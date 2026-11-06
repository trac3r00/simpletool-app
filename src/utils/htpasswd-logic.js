/**
 * Pure htpasswd logic shared by the route (injected via fn.toString()) and tests.
 *
 * createHtpasswdLogic must stay fully self-contained: the route inlines its
 * source into the page, so it may not reference imports or module-level names.
 */
export function createHtpasswdLogic() {
  const APR1_ALPHABET = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const HASH_PLACEHOLDER = "<generate-an-entry-first>";
  const MAX_VERIFY_BCRYPT_COST = 16;
  const MD5_SHIFTS = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  const MD5_CONSTANTS = new Int32Array(64);
  for (let index = 0; index < 64; index++) {
    MD5_CONSTANTS[index] = Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) | 0;
  }

  function utf8Bytes(text) {
    return Array.from(new TextEncoder().encode(String(text)));
  }

  function md5Bytes(input) {
    const bytes = input;
    const length = bytes.length;
    const blockCount = ((length + 8) >>> 6) + 1;
    const words = new Int32Array(blockCount * 16);
    for (let index = 0; index < length; index++) {
      words[index >> 2] |= (bytes[index] & 0xff) << ((index % 4) * 8);
    }
    words[length >> 2] |= 0x80 << ((length % 4) * 8);
    words[blockCount * 16 - 2] = (length * 8) >>> 0;
    words[blockCount * 16 - 1] = Math.floor(length / 0x20000000);

    let a0 = 0x67452301;
    let b0 = 0xefcdab89 | 0;
    let c0 = 0x98badcfe | 0;
    let d0 = 0x10325476;
    for (let block = 0; block < blockCount; block++) {
      let a = a0;
      let b = b0;
      let c = c0;
      let d = d0;
      for (let step = 0; step < 64; step++) {
        let f;
        let g;
        if (step < 16) {
          f = (b & c) | (~b & d);
          g = step;
        } else if (step < 32) {
          f = (d & b) | (~d & c);
          g = (5 * step + 1) % 16;
        } else if (step < 48) {
          f = b ^ c ^ d;
          g = (3 * step + 5) % 16;
        } else {
          f = c ^ (b | ~d);
          g = (7 * step) % 16;
        }
        const shift = MD5_SHIFTS[(step >> 4) * 4 + (step % 4)];
        f = (f + a + MD5_CONSTANTS[step] + words[block * 16 + g]) | 0;
        a = d;
        d = c;
        c = b;
        b = (b + ((f << shift) | (f >>> (32 - shift)))) | 0;
      }
      a0 = (a0 + a) | 0;
      b0 = (b0 + b) | 0;
      c0 = (c0 + c) | 0;
      d0 = (d0 + d) | 0;
    }

    const output = [];
    [a0, b0, c0, d0].forEach(function (word) {
      for (let shift = 0; shift < 32; shift += 8) output.push((word >>> shift) & 0xff);
    });
    return output;
  }

  function sha1Bytes(input) {
    const bytes = Array.from(input);
    const length = bytes.length;
    const blockCount = ((length + 8) >>> 6) + 1;
    const words = new Int32Array(blockCount * 16);
    for (let index = 0; index < length; index++) {
      words[index >> 2] |= (bytes[index] & 0xff) << (24 - (index % 4) * 8);
    }
    words[length >> 2] |= 0x80 << (24 - (length % 4) * 8);
    words[blockCount * 16 - 2] = Math.floor(length / 0x20000000);
    words[blockCount * 16 - 1] = (length * 8) >>> 0;

    let h0 = 0x67452301;
    let h1 = 0xefcdab89 | 0;
    let h2 = 0x98badcfe | 0;
    let h3 = 0x10325476;
    let h4 = 0xc3d2e1f0 | 0;
    const schedule = new Int32Array(80);
    for (let block = 0; block < blockCount; block++) {
      for (let index = 0; index < 80; index++) {
        if (index < 16) {
          schedule[index] = words[block * 16 + index];
        } else {
          const mixed = schedule[index - 3] ^ schedule[index - 8] ^ schedule[index - 14] ^ schedule[index - 16];
          schedule[index] = (mixed << 1) | (mixed >>> 31);
        }
      }
      let a = h0;
      let b = h1;
      let c = h2;
      let d = h3;
      let e = h4;
      for (let index = 0; index < 80; index++) {
        let f;
        let k;
        if (index < 20) {
          f = (b & c) | (~b & d);
          k = 0x5a827999;
        } else if (index < 40) {
          f = b ^ c ^ d;
          k = 0x6ed9eba1;
        } else if (index < 60) {
          f = (b & c) | (b & d) | (c & d);
          k = 0x8f1bbcdc | 0;
        } else {
          f = b ^ c ^ d;
          k = 0xca62c1d6 | 0;
        }
        const temp = (((a << 5) | (a >>> 27)) + f + e + k + schedule[index]) | 0;
        e = d;
        d = c;
        c = (b << 30) | (b >>> 2);
        b = a;
        a = temp;
      }
      h0 = (h0 + a) | 0;
      h1 = (h1 + b) | 0;
      h2 = (h2 + c) | 0;
      h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0;
    }

    const output = [];
    [h0, h1, h2, h3, h4].forEach(function (word) {
      for (let shift = 24; shift >= 0; shift -= 8) output.push((word >>> shift) & 0xff);
    });
    return output;
  }

  function base64FromBytes(input) {
    const bytes = Array.from(input);
    let output = "";
    for (let index = 0; index < bytes.length; index += 3) {
      const b0 = bytes[index];
      const b1 = index + 1 < bytes.length ? bytes[index + 1] : 0;
      const b2 = index + 2 < bytes.length ? bytes[index + 2] : 0;
      const triple = (b0 << 16) | (b1 << 8) | b2;
      output += BASE64_ALPHABET[(triple >> 18) & 63] + BASE64_ALPHABET[(triple >> 12) & 63];
      output += index + 1 < bytes.length ? BASE64_ALPHABET[(triple >> 6) & 63] : "=";
      output += index + 2 < bytes.length ? BASE64_ALPHABET[triple & 63] : "=";
    }
    return output;
  }

  function isValidApr1Salt(salt) {
    return /^[./0-9A-Za-z]{1,8}$/.test(salt);
  }

  // Apache's $apr1$ MD5-crypt, computed over UTF-8 bytes (matches `openssl passwd -apr1`).
  function apr1Hash(password, salt) {
    const saltText = String(salt);
    if (!/^[^$]{0,8}$/.test(saltText)) {
      throw new Error("apr1 salt must be at most 8 characters and cannot contain $.");
    }
    const pw = utf8Bytes(password);
    const saltBytes = utf8Bytes(saltText);
    const magic = utf8Bytes("$apr1$");

    let context = pw.concat(magic, saltBytes);
    const alternate = md5Bytes(pw.concat(saltBytes, pw));
    for (let remaining = pw.length; remaining > 0; remaining -= 16) {
      context = context.concat(alternate.slice(0, Math.min(16, remaining)));
    }
    for (let remaining = pw.length; remaining > 0; remaining >>= 1) {
      context.push(remaining & 1 ? 0 : pw[0]);
    }

    let final = md5Bytes(context);
    for (let round = 0; round < 1000; round++) {
      let next = round & 1 ? pw.slice() : final.slice();
      if (round % 3) next = next.concat(saltBytes);
      if (round % 7) next = next.concat(pw);
      next = next.concat(round & 1 ? final : pw);
      final = md5Bytes(next);
    }

    function to64(value, count) {
      let out = "";
      for (let index = 0; index < count; index++) {
        out += APR1_ALPHABET[value & 0x3f];
        value >>= 6;
      }
      return out;
    }

    const encoded =
      to64((final[0] << 16) | (final[6] << 8) | final[12], 4) +
      to64((final[1] << 16) | (final[7] << 8) | final[13], 4) +
      to64((final[2] << 16) | (final[8] << 8) | final[14], 4) +
      to64((final[3] << 16) | (final[9] << 8) | final[15], 4) +
      to64((final[4] << 16) | (final[10] << 8) | final[5], 4) +
      to64(final[11], 2);
    return "$apr1$" + saltText + "$" + encoded;
  }

  function shaHash(password) {
    return "{SHA}" + base64FromBytes(sha1Bytes(utf8Bytes(password)));
  }

  function validateUsername(username) {
    const name = String(username);
    if (!name) return "Username is empty.";
    if (/[:\r\n]/.test(name)) return "Username cannot contain colons or line breaks.";
    if (utf8Bytes(name).length > 255) return "Username is longer than 255 bytes.";
    return null;
  }

  function parseHtpasswdLine(line) {
    const text = String(line).replace(/\r?\n$/, "").replace(/\r$/, "");
    if (/[\r\n]/.test(text)) return { ok: false, error: "Paste exactly one htpasswd line." };
    if (!text.trim()) return { ok: false, error: "The line is empty." };
    if (text.startsWith("#")) return { ok: false, error: "The line is a comment, not an entry." };
    const colon = text.indexOf(":");
    if (colon === -1) return { ok: false, error: "Missing ':' between username and hash." };
    const username = text.slice(0, colon);
    const hash = text.slice(colon + 1);
    if (!username) return { ok: false, error: "Username before ':' is empty." };
    if (!hash) return { ok: false, error: "Hash after ':' is empty." };

    if (/^\$2[aby]\$/.test(hash)) {
      if (!/^\$2[aby]\$(0[4-9]|[12][0-9]|3[01])\$[./A-Za-z0-9]{53}$/.test(hash)) {
        return { ok: false, error: "Malformed bcrypt hash: expected $2y$NN$ followed by 53 characters." };
      }
      return { ok: true, username: username, hash: hash, algorithm: "bcrypt" };
    }
    if (hash.startsWith("$apr1$")) {
      const match = /^\$apr1\$([^$]{0,8})\$([./0-9A-Za-z]{22})$/.exec(hash);
      if (!match) {
        return { ok: false, error: "Malformed apr1 hash: expected $apr1$<salt up to 8 chars>$<22 chars>." };
      }
      return { ok: true, username: username, hash: hash, algorithm: "apr1", salt: match[1] };
    }
    if (hash.startsWith("{SHA}")) {
      if (!/^\{SHA\}[A-Za-z0-9+/]{27}=$/.test(hash)) {
        return { ok: false, error: "Malformed {SHA} hash: expected 28 Base64 characters after {SHA}." };
      }
      return { ok: true, username: username, hash: hash, algorithm: "sha" };
    }
    if (hash.startsWith("{PLAIN}")) {
      return { ok: true, username: username, hash: hash, algorithm: "plain", plaintext: hash.slice(7) };
    }
    if (hash.startsWith("$") || hash.startsWith("{")) {
      return { ok: false, error: "Unsupported hash format. This page verifies bcrypt, apr1, {SHA}, and plaintext." };
    }
    return {
      ok: true,
      username: username,
      hash: hash,
      algorithm: "plain",
      plaintext: hash,
      possiblyCrypt: /^[./0-9A-Za-z]{13}$/.test(hash),
    };
  }

  function verifyHtpasswdLine(line, password, bcryptCompareSync) {
    const parsed = parseHtpasswdLine(line);
    if (!parsed.ok) return parsed;
    const candidate = String(password);
    let match;
    switch (parsed.algorithm) {
      case "bcrypt":
        // bcryptjs runs synchronously on the page thread: 2^cost rounds at cost 31 would hang the tab for hours.
        if (Number(parsed.hash.slice(4, 6)) > MAX_VERIFY_BCRYPT_COST) {
          return {
            ok: false,
            error: "bcrypt cost " + parsed.hash.slice(4, 6) + " is too slow to check in a browser (limit " + MAX_VERIFY_BCRYPT_COST + "). Use `htpasswd -v` instead.",
          };
        }
        if (typeof bcryptCompareSync !== "function") {
          return { ok: false, error: "bcrypt library not available. Reload and try again." };
        }
        // bcryptjs implements one bcrypt variant; $2b$/$2y$ hashes are byte-identical to $2a$ for it.
        match = Boolean(bcryptCompareSync(candidate, "$2a$" + parsed.hash.slice(4)));
        break;
      case "apr1":
        match = apr1Hash(candidate, parsed.salt) === parsed.hash;
        break;
      case "sha":
        match = shaHash(candidate) === parsed.hash;
        break;
      default:
        match = candidate === parsed.plaintext;
    }
    return {
      ok: true,
      match: match,
      username: parsed.username,
      algorithm: parsed.algorithm,
      possiblyCrypt: Boolean(parsed.possiblyCrypt),
    };
  }

  function shellQuote(value) {
    return "'" + String(value).replace(/'/g, "'\\''") + "'";
  }

  function buildBasicAuth(username, password, url) {
    const name = String(username);
    if (name.includes(":")) {
      return { ok: false, error: "Basic auth user-ids cannot contain ':' (RFC 7617)." };
    }
    const token = base64FromBytes(utf8Bytes(name + ":" + String(password)));
    const target = String(url || "https://example.com/");
    return {
      ok: true,
      token: token,
      header: "Authorization: Basic " + token,
      curl: "curl -u " + shellQuote(name + ":" + String(password)) + " " + shellQuote(target),
    };
  }

  function parseBulkLines(text) {
    const entries = [];
    const errors = [];
    const seen = {};
    String(text)
      .split(/\r?\n/)
      .forEach(function (raw, index) {
        const lineNumber = index + 1;
        if (!raw.trim()) return;
        const colon = raw.indexOf(":");
        if (colon === -1) {
          errors.push({ lineNumber: lineNumber, error: "Missing ':' between username and password." });
          return;
        }
        const username = raw.slice(0, colon).trim();
        const password = raw.slice(colon + 1);
        const usernameError = validateUsername(username);
        if (usernameError) {
          errors.push({ lineNumber: lineNumber, error: usernameError });
          return;
        }
        if (!password) {
          errors.push({ lineNumber: lineNumber, error: "Password is empty." });
          return;
        }
        if (Object.prototype.hasOwnProperty.call(seen, username)) {
          errors.push({ lineNumber: lineNumber, error: "Duplicate username '" + username + "' (first on line " + seen[username] + ")." });
          return;
        }
        seen[username] = lineNumber;
        entries.push({ lineNumber: lineNumber, username: username, password: password });
      });
    return { entries: entries, errors: errors };
  }

  function buildServerConfigs(options) {
    const filePath = String(options.filePath || "").trim() || "/etc/nginx/.htpasswd";
    if (/[\s"'\\]/.test(filePath)) {
      return { ok: false, error: "File path cannot contain spaces, quotes, or backslashes." };
    }
    const realm = "Restricted";
    const entries = (options.entries && options.entries.length
      ? options.entries
      : [{ username: options.username || "deploy", hash: "", algorithm: "" }]
    ).map(function (entry) {
      return {
        username: String(entry.username || "deploy"),
        hash: String(entry.hash || HASH_PLACEHOLDER),
        algorithm: entry.hash ? String(entry.algorithm || "") : "",
      };
    });
    const lines = entries.map(function (entry) {
      return entry.username + ":" + entry.hash;
    });
    const hasHashes = entries.every(function (entry) {
      return entry.hash !== HASH_PLACEHOLDER;
    });
    const allBcrypt = entries.every(function (entry) {
      return entry.algorithm === "bcrypt";
    });
    const anyPlain = entries.some(function (entry) {
      return entry.algorithm === "plain";
    });

    const apache = [
      "# .htaccess (or a <Directory>/<Location> block)",
      "AuthType Basic",
      'AuthName "' + realm + '"',
      "AuthUserFile " + filePath,
      "Require valid-user",
    ].join("\n");

    const nginx = [
      "location /admin/ {",
      '    auth_basic "' + realm + '";',
      "    auth_basic_user_file " + filePath + ";",
      "}",
    ].join("\n");

    const kubernetes = [
      "# ingress-nginx reads the htpasswd data from the secret key named \"auth\"",
      "cat > auth <<'EOF'",
      lines.join("\n"),
      "EOF",
      "kubectl create secret generic basic-auth --from-file=auth",
      "",
      "# Ingress metadata",
      "metadata:",
      "  annotations:",
      "    nginx.ingress.kubernetes.io/auth-type: basic",
      "    nginx.ingress.kubernetes.io/auth-secret: basic-auth",
      '    nginx.ingress.kubernetes.io/auth-realm: "' + realm + '"',
    ].join("\n");

    const caddyLines = ["example.com {", "\tbasic_auth /admin/* {"];
    if (hasHashes && !allBcrypt) {
      caddyLines.push("\t\t# Caddy accepts bcrypt hashes only. Regenerate with Bcrypt (-B).");
    }
    entries.forEach(function (entry) {
      caddyLines.push("\t\t" + entry.username + " " + entry.hash);
    });
    caddyLines.push("\t}", "\treverse_proxy localhost:8080", "}");
    const caddy = caddyLines.join("\n");

    const traefikLines = ["# docker-compose labels: every $ in a hash is written as $$"];
    if (anyPlain) {
      traefikLines.push("# Traefik does not accept plaintext entries. Use bcrypt, apr1, or {SHA}.");
    }
    traefikLines.push(
      "labels:",
      '  - "traefik.http.middlewares.basic-auth.basicauth.users=' +
        lines
          .map(function (line) {
            return line.replace(/\$/g, "$$$$");
          })
          .join(",") +
        '"',
      '  - "traefik.http.routers.my-app.middlewares=basic-auth"',
    );
    const traefik = traefikLines.join("\n");

    return {
      ok: true,
      hasHashes: hasHashes,
      apache: apache,
      nginx: nginx,
      kubernetes: kubernetes,
      caddy: caddy,
      traefik: traefik,
    };
  }

  return {
    APR1_ALPHABET: APR1_ALPHABET,
    utf8Bytes: utf8Bytes,
    md5Bytes: md5Bytes,
    sha1Bytes: sha1Bytes,
    base64FromBytes: base64FromBytes,
    isValidApr1Salt: isValidApr1Salt,
    apr1Hash: apr1Hash,
    shaHash: shaHash,
    validateUsername: validateUsername,
    parseHtpasswdLine: parseHtpasswdLine,
    verifyHtpasswdLine: verifyHtpasswdLine,
    shellQuote: shellQuote,
    buildBasicAuth: buildBasicAuth,
    parseBulkLines: parseBulkLines,
    buildServerConfigs: buildServerConfigs,
  };
}

export const {
  utf8Bytes,
  md5Bytes,
  sha1Bytes,
  base64FromBytes,
  isValidApr1Salt,
  apr1Hash,
  shaHash,
  validateUsername,
  parseHtpasswdLine,
  verifyHtpasswdLine,
  shellQuote,
  buildBasicAuth,
  parseBulkLines,
  buildServerConfigs,
} = createHtpasswdLogic();
