/**
 * Format detection and TOML serialisation for /yaml-toml-converter. Inlined
 * into the page via toString, so each function is self-contained apart from
 * calls to the others listed in CONFIG_CONVERTER_FUNCTIONS.
 */

// Guess JSON / YAML / TOML from the first significant line. A leading "[" is
// JSON only if the whole text parses: "[package]" opens a TOML table. A
// "key = value" line is TOML even when the value contains ":" (URLs, times).
export function detectConfigFormat(src) {
  var s = String(src).trim();
  if (!s) return "unknown";
  if (s[0] === "{") return "json";
  if (s[0] === "[") {
    try {
      JSON.parse(s);
      return "json";
    } catch (e) {
      var head = s.split("\n")[0].trim();
      return /^\[\[?\s*[A-Za-z0-9_\-."' ]+\s*\]\]?\s*(#.*)?$/.test(head) ? "toml" : "json";
    }
  }
  var lines = s.split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line || line[0] === "#") continue;
    if (line === "---" || line.slice(0, 4) === "--- " || line.slice(0, 2) === "- ") return "yaml";
    if (/^(?:[A-Za-z0-9_-]+|"[^"]*"|'[^']*')(?:\s*\.\s*(?:[A-Za-z0-9_-]+|"[^"]*"|'[^']*'))*\s*=/.test(line)) return "toml";
    return "yaml";
  }
  return "yaml";
}

export function tomlKey(k) {
  return /^[A-Za-z0-9_-]+$/.test(k) ? k : tomlString(k);
}

export function tomlString(s) {
  // JSON string escapes are a subset of TOML basic-string escapes, except
  // that TOML forbids a raw DEL (U+007F).
  return JSON.stringify(s).replace(/\x7f/g, "\\u007f");
}

export function tomlIsTable(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date);
}

export function tomlInline(v, path, skipped) {
  if (typeof v === "string") return tomlString(v);
  if (typeof v === "boolean") return String(v);
  if (typeof v === "number") {
    if (isNaN(v)) return "nan";
    if (!isFinite(v)) return v > 0 ? "inf" : "-inf";
    return String(v);
  }
  if (typeof v === "bigint") return v.toString();
  if (v instanceof Date) {
    if (isNaN(v.getTime())) throw new Error("Invalid date at " + path.join("."));
    return v.toISOString();
  }
  if (Array.isArray(v)) {
    var items = [];
    v.forEach(function (item, i) {
      if (item === null || item === undefined) {
        skipped.push(path.concat(String(i)).join("."));
        return;
      }
      items.push(tomlInline(item, path.concat(String(i)), skipped));
    });
    return "[" + items.join(", ") + "]";
  }
  if (tomlIsTable(v)) {
    var pairs = [];
    Object.keys(v).forEach(function (k) {
      if (v[k] === null || v[k] === undefined) {
        skipped.push(path.concat(k).join("."));
        return;
      }
      pairs.push(tomlKey(k) + " = " + tomlInline(v[k], path.concat(k), skipped));
    });
    return pairs.length ? "{ " + pairs.join(", ") + " }" : "{}";
  }
  throw new Error("Cannot represent " + typeof v + " in TOML at " + path.join("."));
}

export function tomlEmitTable(obj, path, out, header, skipped) {
  var simple = [];
  var tables = [];
  var arrays = [];
  Object.keys(obj).forEach(function (k) {
    var v = obj[k];
    if (v === null || v === undefined) {
      skipped.push(path.concat(k).join("."));
    } else if (tomlIsTable(v)) {
      tables.push(k);
    } else if (Array.isArray(v) && v.length > 0 && v.every(tomlIsTable)) {
      arrays.push(k);
    } else {
      simple.push(tomlKey(k) + " = " + tomlInline(v, path.concat(k), skipped));
    }
  });
  if (header) {
    if (out.length) out.push("");
    out.push(header);
  }
  simple.forEach(function (line) { out.push(line); });
  tables.forEach(function (k) {
    var p = path.concat(k);
    tomlEmitTable(obj[k], p, out, "[" + p.map(tomlKey).join(".") + "]", skipped);
  });
  arrays.forEach(function (k) {
    var p = path.concat(k);
    obj[k].forEach(function (item) {
      tomlEmitTable(item, p, out, "[[" + p.map(tomlKey).join(".") + "]]", skipped);
    });
  });
}

// Serialise parsed data as TOML 1.0. TOML has no null, so null values are
// left out and listed in a leading comment; the root must be a table.
export function toToml(data) {
  if (!tomlIsTable(data)) {
    var kind = Array.isArray(data) ? "an array" : data === null ? "null" : "a " + typeof data;
    throw new Error("TOML needs a table (key/value object) at the top level; this data is " + kind + ".");
  }
  var out = [];
  var skipped = [];
  tomlEmitTable(data, [], out, null, skipped);
  if (skipped.length) {
    out.unshift("# TOML has no null; omitted: " + skipped.join(", "), "");
  }
  return out.join("\n") + "\n";
}

export const CONFIG_CONVERTER_FUNCTIONS = [
  detectConfigFormat, tomlKey, tomlString, tomlIsTable, tomlInline, tomlEmitTable, toToml,
];
