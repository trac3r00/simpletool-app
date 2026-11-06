/**
 * Step transforms for /pipe (src/routes/pipe.js).
 *
 * Inlined into the page via toString (see PIPE_LOGIC_FUNCTIONS), so each
 * function is self-contained apart from calls to the others in that list and
 * to convertCase from case-converter-logic.js, which the page inlines too.
 * convertCase is imported (not referenced as a free global) so that when the
 * Worker bundler renames it (e.g. to convertCase2), the call inside
 * pipeCaseConvert is renamed with it and the inlined copies still match.
 * Transforms throw on bad input so the pipeline can stop at the failing step
 * instead of passing an error string to the next step.
 */
import { convertCase } from "./case-converter-logic.js";

export function pipeBase64Encode(text) {
  var bytes = new TextEncoder().encode(String(text));
  var bin = "";
  for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// Accepts standard and URL-safe Base64 (JWT segments), surrounding or embedded
// whitespace, and missing padding. The decoded bytes must be valid UTF-8.
export function pipeBase64Decode(text) {
  var s = String(text).replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) {
    throw new Error("Invalid Base64: only A-Z, a-z, 0-9, +, / (or -, _) and trailing = are allowed");
  }
  s = s.replace(/=+$/, "");
  if (s.length % 4 === 1) throw new Error("Invalid Base64: the length is not a valid Base64 length");
  while (s.length % 4) s += "=";
  var bin = atob(s);
  var bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (e) {
    throw new Error("Decoded bytes are not UTF-8 text (binary data cannot be shown here)");
  }
}

export function pipeUrlEncode(text) {
  return encodeURIComponent(String(text));
}

// "+" is decoded as a space when spaceAsPlus is set (HTML form / query-string
// encoding); otherwise it is kept literally, as decodeURIComponent does.
export function pipeUrlDecode(text, spaceAsPlus) {
  var s = String(text);
  if (spaceAsPlus) s = s.replace(/\+/g, " ");
  try {
    return decodeURIComponent(s);
  } catch (e) {
    throw new Error("Invalid URL encoding: a % must be followed by two hex digits forming valid UTF-8");
  }
}

export function pipeJsonFormat(text, mode) {
  var parsed;
  try {
    parsed = JSON.parse(String(text).trim());
  } catch (e) {
    throw new Error("Invalid JSON: " + e.message);
  }
  return mode === "minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
}

// Sorts by UTF-16 code unit, like `LC_ALL=C sort` for BMP text. A single
// trailing newline is treated as a terminator rather than an empty last line,
// so it does not sort to the top as a blank line; it is kept on the output.
export function pipeLineSort(text, mode) {
  var s = String(text).replace(/\r\n/g, "\n");
  var trailing = s.endsWith("\n");
  if (trailing) s = s.slice(0, -1);
  var lines = s.split("\n");
  var out;
  if (mode === "reverse") out = lines.slice().sort().reverse();
  else if (mode === "dedupe") out = Array.from(new Set(lines));
  else if (mode === "sort-dedupe") out = Array.from(new Set(lines)).sort();
  else out = lines.slice().sort();
  return out.join("\n") + (trailing ? "\n" : "");
}

export function pipeCaseConvert(text, style) {
  var map = {
    camel: "camelCase",
    snake: "snakeCase",
    kebab: "kebabCase",
    pascal: "pascalCase",
    upper: "uppercase",
    lower: "lowercase",
    constant: "constantCase",
    dot: "dotCase",
    title: "titleCase",
    sentence: "sentenceCase",
  };
  return convertCase(String(text), map[style] || "camelCase");
}

// Shared-link and saved-workflow payloads are untrusted: keep only steps whose
// contract exists and only option values that contract offers.
export function pipeSanitizeSteps(data, contracts) {
  if (!Array.isArray(data)) return [];
  var out = [];
  for (var i = 0; i < data.length && out.length < 20; i++) {
    var s = data[i];
    if (!s || typeof s !== "object") continue;
    var id = typeof s.id === "string" ? s.id : s.contractId;
    var contract = Object.prototype.hasOwnProperty.call(contracts, id) ? contracts[id] : null;
    if (!contract) continue;
    var given = (s.o || s.options) && typeof (s.o || s.options) === "object" ? s.o || s.options : {};
    var options = {};
    (contract.options || []).forEach(function (opt) {
      var v = given[opt.id];
      options[opt.id] = opt.values.indexOf(v) >= 0 ? v : opt.default;
    });
    out.push({ contractId: id, options: options });
  }
  return out;
}

export const PIPE_LOGIC_FUNCTIONS = [
  pipeBase64Encode,
  pipeBase64Decode,
  pipeUrlEncode,
  pipeUrlDecode,
  pipeJsonFormat,
  pipeLineSort,
  pipeCaseConvert,
  pipeSanitizeSteps,
];
