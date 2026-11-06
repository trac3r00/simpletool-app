/**
 * Re-indent JSON text without parsing values into JavaScript numbers or
 * objects, so 64-bit ids, "1.0", "1e5" and duplicate keys survive Format and
 * Minify exactly as written. JSON.parse/stringify would round
 * 12345678901234567890 to 12345678901234567000 and keep only the last of two
 * duplicate keys.
 *
 * Precondition: `text` is valid JSON (the caller validates with JSON.parse
 * first, which also supplies the error message). Inlined into /json-formatter
 * via toString, so it must stay self-contained.
 */
export function reformatJSON(text, indent) {
  var pad = typeof indent === "number" ? " ".repeat(indent) : indent || "";
  var out = "";
  var depth = 0;
  var i = 0;
  var n = text.length;
  function isWs(c) {
    return c === " " || c === "\t" || c === "\n" || c === "\r";
  }
  function newline(d) {
    return pad ? "\n" + pad.repeat(d) : "";
  }
  while (i < n) {
    var ch = text[i];
    if (isWs(ch)) {
      i++;
      continue;
    }
    if (ch === '"') {
      var j = i + 1;
      while (j < n && text[j] !== '"') {
        if (text[j] === "\\") j++;
        j++;
      }
      out += text.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (ch === "{" || ch === "[") {
      var close = ch === "{" ? "}" : "]";
      var k = i + 1;
      while (k < n && isWs(text[k])) k++;
      if (text[k] === close) {
        out += ch + close;
        i = k + 1;
        continue;
      }
      depth++;
      out += ch + newline(depth);
      i++;
      continue;
    }
    if (ch === "}" || ch === "]") {
      depth--;
      out += newline(depth) + ch;
      i++;
      continue;
    }
    if (ch === ",") {
      out += "," + newline(depth);
      i++;
      continue;
    }
    if (ch === ":") {
      out += pad ? ": " : ":";
      i++;
      continue;
    }
    var m = i;
    while (m < n && ",:]}".indexOf(text[m]) === -1 && !isWs(text[m])) m++;
    out += text.slice(i, m);
    i = m;
  }
  return out;
}

/**
 * Number literals that JSON.parse cannot represent exactly (integers beyond
 * 2^53, or decimals that do not round-trip). Used to tell the user why the
 * formatter keeps the original text.
 */
export function findImpreciseNumbers(text) {
  var found = [];
  var re = /"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  var m;
  while ((m = re.exec(text)) !== null) {
    var lit = m[0];
    if (lit[0] === '"') continue;
    var num = Number(lit);
    var digits = lit.replace(/^-/, "").replace(/[eE].*$/, "").replace(".", "").replace(/^0+/, "");
    if (/^-?\d+$/.test(lit) ? !Number.isSafeInteger(num) : digits.length > 15 && String(num) !== lit) {
      found.push(lit);
    }
  }
  return found;
}
