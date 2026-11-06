/**
 * Case conversion for /case-converter. Inlined into the page via toString, so
 * each function is self-contained apart from calls to the others listed in
 * CASE_CONVERTER_FUNCTIONS.
 */

// Split identifiers and prose into words: "XMLHttpRequest" -> XML Http Request,
// "user_id" -> user id, "café au lait" keeps the é. Apostrophes join a word
// ("don't" -> dont) instead of splitting it.
export function splitWords(text) {
  return String(text)
    .replace(/['\u2019]/g, "")
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1 $2")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

export function capitalizeWord(word) {
  var chars = Array.from(word.toLowerCase());
  if (!chars.length) return "";
  return chars[0].toUpperCase() + chars.slice(1).join("");
}

export function convertCase(text, style) {
  var words;
  switch (style) {
    case "uppercase":
      return text.toUpperCase();
    case "lowercase":
      return text.toLowerCase();
    case "titleCase":
      return text.replace(/\S+/gu, function (w) {
        return w.replace(/^([^\p{L}\p{N}]*)([\p{L}\p{N}])(.*)$/su, function (_, lead, first, rest) {
          return lead + first.toUpperCase() + rest.toLowerCase();
        });
      });
    case "sentenceCase":
      return text.toLowerCase().replace(/(^\s*|[.!?]\s+)([^\p{L}\s]*)(\p{L})/gu, function (_, a, b, c) {
        return a + b + c.toUpperCase();
      });
    case "alternating":
      return Array.from(text)
        .map(function (ch, i) { return i % 2 === 0 ? ch.toLowerCase() : ch.toUpperCase(); })
        .join("");
    case "inverse":
      return Array.from(text)
        .map(function (ch) {
          var up = ch.toUpperCase();
          return ch === up ? ch.toLowerCase() : up;
        })
        .join("");
  }
  words = splitWords(text);
  switch (style) {
    case "camelCase":
      return words.map(function (w, i) { return i === 0 ? w.toLowerCase() : capitalizeWord(w); }).join("");
    case "pascalCase":
      return words.map(capitalizeWord).join("");
    case "snakeCase":
      return words.map(function (w) { return w.toLowerCase(); }).join("_");
    case "kebabCase":
      return words.map(function (w) { return w.toLowerCase(); }).join("-");
    case "constantCase":
      return words.map(function (w) { return w.toUpperCase(); }).join("_");
    case "dotCase":
      return words.map(function (w) { return w.toLowerCase(); }).join(".");
  }
  throw new Error("Unknown case style: " + style);
}

export const CASE_CONVERTER_FUNCTIONS = [splitWords, capitalizeWord, convertCase];
