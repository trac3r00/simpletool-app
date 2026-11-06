// The route inlines this factory into its client script with fn.toString(), so it
// must stay self-contained. A factory keeps the inner names local: the worker
// bundler may rename colliding top-level names.
export function createCurlLogic() {
  const ANSI_ESCAPES = { n: "\n", t: "\t", r: "\r", a: "\x07", b: "\b", e: "\x1b", E: "\x1b", f: "\f", v: "\v", "\\": "\\", "'": "'", '"': '"', "?": "?" };

  // POSIX shell word splitting for the quoting a pasted curl command uses:
  // '...', "...", backslash escapes, line continuations (LF or CRLF) and bash's
  // $'...' ANSI-C quoting, which Chrome's "Copy as cURL" emits for bodies with
  // newlines or quotes.
  function tokenizeShell(input) {
    const tokens = [];
    const s = String(input == null ? "" : input);
    let cur = "";
    let started = false;
    let i = 0;
    const push = function () {
      if (started) tokens.push(cur);
      cur = "";
      started = false;
    };
    while (i < s.length) {
      const ch = s[i];
      if (ch === "$" && s[i + 1] === "'") {
        started = true;
        i += 2;
        while (i < s.length && s[i] !== "'") {
          if (s[i] === "\\" && i + 1 < s.length) {
            const n = s[i + 1];
            if (ANSI_ESCAPES[n] !== undefined) { cur += ANSI_ESCAPES[n]; i += 2; continue; }
            if (n === "x") {
              const hex = /^[0-9a-fA-F]{1,2}/.exec(s.slice(i + 2));
              if (hex) { cur += String.fromCharCode(parseInt(hex[0], 16)); i += 2 + hex[0].length; continue; }
            }
            if (n === "u" || n === "U") {
              const hex = (n === "u" ? /^[0-9a-fA-F]{1,4}/ : /^[0-9a-fA-F]{1,8}/).exec(s.slice(i + 2));
              if (hex) { cur += String.fromCodePoint(parseInt(hex[0], 16)); i += 2 + hex[0].length; continue; }
            }
            if (/[0-7]/.test(n)) {
              const oct = /^[0-7]{1,3}/.exec(s.slice(i + 1));
              cur += String.fromCharCode(parseInt(oct[0], 8));
              i += 1 + oct[0].length;
              continue;
            }
            cur += "\\" + n;
            i += 2;
            continue;
          }
          cur += s[i++];
        }
        i++;
        continue;
      }
      if (ch === "'") {
        started = true;
        const end = s.indexOf("'", i + 1);
        const stop = end === -1 ? s.length : end;
        cur += s.slice(i + 1, stop);
        i = stop + 1;
        continue;
      }
      if (ch === '"') {
        started = true;
        i++;
        while (i < s.length && s[i] !== '"') {
          if (s[i] === "\\" && i + 1 < s.length) {
            const n = s[i + 1];
            if (n === "\n") { i += 2; continue; }
            if (n === "\r" && s[i + 2] === "\n") { i += 3; continue; }
            if (n === "$" || n === "`" || n === '"' || n === "\\") { cur += n; i += 2; continue; }
          }
          cur += s[i++];
        }
        i++;
        continue;
      }
      if (ch === "\\") {
        const n = s[i + 1];
        if (n === "\n") { i += 2; continue; }
        if (n === "\r" && s[i + 2] === "\n") { i += 3; continue; }
        if (n !== undefined) { cur += n; started = true; i += 2; continue; }
        i++;
        continue;
      }
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
        push();
        i++;
        continue;
      }
      cur += ch;
      started = true;
      i++;
    }
    push();
    return tokens;
  }

  const SHORT_VALUE = { X: "-X", H: "-H", d: "-d", u: "-u", A: "-A", e: "-e", b: "-b", o: "-o", m: "-m", T: "-T", F: "-F", x: "-x", E: "-E", c: "-c", r: "-r", w: "-w", K: "-K", U: "-U", D: "-D", Y: "-Y", y: "-y", z: "-z", C: "-C", P: "-P", Q: "-Q", t: "-t" };
  const ALIASES = {
    "--request": "-X", "--header": "-H", "--data": "-d", "--data-ascii": "-d",
    "--user": "-u", "--user-agent": "-A", "--referer": "-e", "--cookie": "-b",
    "--output": "-o", "--max-time": "-m", "--upload-file": "-T", "--form": "-F",
    "--proxy": "-x", "--head": "-I", "--get": "-G",
  };
  const LONG_VALUE = new Set([
    "--url", "--data-raw", "--data-binary", "--data-urlencode", "--json", "--form-string",
    "--connect-timeout", "--retry", "--retry-delay", "--retry-max-time", "--cert", "--key",
    "--cacert", "--capath", "--cert-type", "--key-type", "--pass", "--resolve", "--connect-to",
    "--interface", "--limit-rate", "--max-filesize", "--max-redirs", "--oauth2-bearer",
    "--proxy-user", "--cookie-jar", "--dump-header", "--write-out", "--config", "--range",
    "--continue-at", "--ciphers", "--aws-sigv4", "--unix-socket", "--abstract-unix-socket",
    "--happy-eyeballs-timeout-ms", "--expect100-timeout", "--keepalive-time", "--noproxy",
    "--preproxy", "--proxy-header", "--request-target", "--trace", "--trace-ascii", "--variable",
  ]);

  function encodeFormComponent(text) {
    return encodeURIComponent(text).replace(/%20/g, "+");
  }

  // curl --data-urlencode forms: "content", "=content", "name=content",
  // "@file", "name@file".
  function urlencodeData(arg) {
    const eq = arg.indexOf("=");
    const at = arg.indexOf("@");
    if (at !== -1 && (eq === -1 || at < eq)) return { text: arg, file: true };
    if (eq === -1) return { text: encodeFormComponent(arg) };
    const name = arg.slice(0, eq);
    const value = encodeFormComponent(arg.slice(eq + 1));
    return { text: name ? name + "=" + value : value };
  }

  function addHeader(headers, raw) {
    const at = raw.indexOf(":");
    if (at <= 0) {
      const semi = raw.indexOf(";");
      if (semi > 0 && semi === raw.length - 1) headers[raw.slice(0, semi).trim()] = "";
      return;
    }
    const name = raw.slice(0, at).trim();
    const value = raw.slice(at + 1).trim();
    const existing = Object.keys(headers).find(function (k) { return k.toLowerCase() === name.toLowerCase(); });
    if (existing && headers[existing] !== "") {
      headers[existing] += (name.toLowerCase() === "cookie" ? "; " : ", ") + value;
    } else {
      headers[existing || name] = value;
    }
  }

  function hasHeader(headers, name) {
    return Object.keys(headers).some(function (k) { return k.toLowerCase() === name.toLowerCase(); });
  }

  function parseCurl(curlCommand) {
    const result = { method: "", url: "", headers: {}, body: null };
    const tokens = tokenizeShell(String(curlCommand || "").trim());
    const data = [];
    const form = [];
    const flags = [];
    const warnings = [];
    let user = "";
    let get = false;
    let head = false;
    let upload = "";
    let bodyIsJson = false;

    for (let i = 0; i < tokens.length; i++) {
      let tok = tokens[i];
      if (i === 0 && tok.toLowerCase() === "curl") continue;
      let value = null;
      if (/^-[A-Za-z]/.test(tok) && tok.length > 2 && SHORT_VALUE[tok[1]]) {
        value = tok.slice(2);
        tok = SHORT_VALUE[tok[1]];
      }
      const opt = ALIASES[tok] || tok;
      const takes = (opt.length === 2 && SHORT_VALUE[opt[1]] === opt) || LONG_VALUE.has(opt);
      if (takes && value === null) value = tokens[++i] === undefined ? "" : tokens[i];

      switch (opt) {
        case "-X": result.method = value.toUpperCase(); break;
        case "-H": addHeader(result.headers, value); break;
        case "-d":
          if (value.charAt(0) === "@") warnings.push("-d " + value + " reads the body from a file, which this page cannot see.");
          data.push(value.replace(/[\r\n]/g, ""));
          break;
        case "--data-raw": data.push(value); break;
        case "--data-binary":
          if (value.charAt(0) === "@") warnings.push("--data-binary " + value + " reads the body from a file, which this page cannot see.");
          data.push(value);
          break;
        case "--data-urlencode": {
          const enc = urlencodeData(value);
          if (enc.file) warnings.push("--data-urlencode " + value + " reads from a file, which this page cannot see.");
          data.push(enc.text);
          break;
        }
        case "--json":
          data.push(value);
          bodyIsJson = true;
          break;
        case "-F": case "--form-string": form.push(value); break;
        case "-u": user = value; break;
        case "-A": result.headers["User-Agent"] = value; break;
        case "-e": result.headers.Referer = value; break;
        case "-b":
          if (value.indexOf("=") !== -1) addHeader(result.headers, "Cookie: " + value);
          else warnings.push("-b " + value + " reads cookies from a file, which this page cannot see.");
          break;
        case "--oauth2-bearer": result.headers.Authorization = "Bearer " + value; break;
        case "-T": upload = value; break;
        case "-G": get = true; break;
        case "-I": head = true; break;
        case "--url": if (!result.url) result.url = value; break;
        default:
          if (takes) break;
          if (tok.charAt(0) === "-" && tok.length > 1) { flags.push(tok); break; }
          if (!result.url) result.url = tok;
          else warnings.push("Extra URL \"" + tok + "\" ignored: only the first URL is shown.");
      }
    }

    if (bodyIsJson) {
      if (!hasHeader(result.headers, "Content-Type")) result.headers["Content-Type"] = "application/json";
      if (!hasHeader(result.headers, "Accept")) result.headers.Accept = "application/json";
    }
    if (data.length && get) {
      result.url += (result.url.indexOf("?") === -1 ? "?" : "&") + data.join("&");
    } else if (data.length) {
      const joined = data.join(bodyIsJson ? "" : "&");
      try { result.body = JSON.parse(joined); } catch (e) { result.body = joined; }
    }
    if (!result.method) {
      if (head) result.method = "HEAD";
      else if (get) result.method = "GET";
      else if (upload) result.method = "PUT";
      else if (data.length || form.length) result.method = "POST";
      else result.method = "GET";
    }
    if (form.length) result.form = form;
    if (user) result.user = user;
    if (upload) result.uploadFile = upload;
    if (flags.length) result.flags = flags;
    if (warnings.length) result.warnings = warnings;
    if (!result.url) result.warnings = (result.warnings || []).concat("No URL found in the command.");
    return result;
  }

  // POSIX single quotes keep every character literal, including $ and `,
  // which double quotes would expand.
  function shellQuote(text) {
    const s = String(text);
    if (/^[A-Za-z0-9_\/.:=@%+,-]+$/.test(s)) return s;
    return "'" + s.replace(/'/g, "'\\''") + "'";
  }

  function parseHeaderInput(text) {
    const raw = String(text || "").trim();
    if (!raw) return { headers: {} };
    if (raw.charAt(0) === "{") {
      try {
        const obj = JSON.parse(raw);
        if (!obj || typeof obj !== "object" || Array.isArray(obj)) return { error: "Headers JSON must be an object like {\"Accept\": \"application/json\"}." };
        const headers = {};
        Object.keys(obj).forEach(function (k) { headers[k] = String(obj[k]); });
        return { headers: headers };
      } catch (e) {
        return { error: "Headers are not valid JSON: " + e.message };
      }
    }
    const headers = {};
    const lines = raw.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const at = line.indexOf(":");
      if (at <= 0) return { error: "Line " + (i + 1) + " is not a header. Use JSON or one \"Name: value\" per line." };
      headers[line.slice(0, at).trim()] = line.slice(at + 1).trim();
    }
    return { headers: headers };
  }

  function generateCurl(spec) {
    const method = String(spec.method || "GET").toUpperCase();
    const url = String(spec.url || "").trim();
    const headers = spec.headers || {};
    const body = spec.body == null ? "" : String(spec.body);
    const parts = ["curl"];
    if (method === "HEAD") parts.push("-I");
    else if (method !== "GET" || body) parts.push("-X " + method);
    parts.push(shellQuote(url));
    const rest = [];
    Object.keys(headers).forEach(function (k) {
      rest.push("-H " + shellQuote(k + ": " + headers[k]));
    });
    // --data-raw, not -d: -d treats a leading @ as a file name.
    if (body) rest.push("--data-raw " + shellQuote(body));
    return [parts.join(" ")].concat(rest).join(" \\\n  ");
  }

  return {
    tokenizeShell: tokenizeShell,
    parseCurl: parseCurl,
    shellQuote: shellQuote,
    parseHeaderInput: parseHeaderInput,
    generateCurl: generateCurl,
  };
}

const curlLogic = createCurlLogic();
export const tokenizeShell = curlLogic.tokenizeShell;
export const parseCurl = curlLogic.parseCurl;
export const shellQuote = curlLogic.shellQuote;
export const parseHeaderInput = curlLogic.parseHeaderInput;
export const generateCurl = curlLogic.generateCurl;
