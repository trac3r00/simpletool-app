// The route inlines this factory into its client script with fn.toString(), so it
// must stay self-contained. A factory keeps the inner names local: the worker
// bundler may rename colliding top-level names.
export function createRegexLogic() {
  // Escape every "/" that is not already escaped, so the pattern can sit
  // between "/" delimiters (JS literal, PHP preg). Inside [...] an escaped "/"
  // means the same thing, so classes need no special case.
  function escapeDelimiter(pattern) {
    let out = "";
    for (let i = 0; i < pattern.length; i++) {
      const ch = pattern[i];
      if (ch === "\\" && i + 1 < pattern.length) {
        out += ch + pattern[++i];
      } else if (ch === "/") {
        out += "\\/";
      } else {
        out += ch;
      }
    }
    return out;
  }

  function cStyleString(text) {
    return '"' + String(text)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t") + '"';
  }

  // Python's re spells named groups and named back-references differently.
  function toPythonPattern(pattern) {
    return pattern
      .replace(/\(\?<([A-Za-z_][A-Za-z0-9_]*)>/g, "(?P<$1>")
      .replace(/\\k<([A-Za-z_][A-Za-z0-9_]*)>/g, "(?P=$1)");
  }

  function buildSnippet(lang, pattern, flags, text) {
    const has = function (f) { return flags.indexOf(f) !== -1; };
    if (lang === "python") {
      const pyFlags = [];
      if (has("i")) pyFlags.push("re.IGNORECASE");
      if (has("m")) pyFlags.push("re.MULTILINE");
      if (has("s")) pyFlags.push("re.DOTALL");
      const flagArg = pyFlags.length ? ", " + pyFlags.join(" | ") : "";
      const call = has("g")
        ? "for match in re.finditer(regex, test_str" + flagArg + "):\n    print(match.start(), match.end(), match.group(0), match.groups())"
        : "match = re.search(regex, test_str" + flagArg + ")\nif match:\n    print(match.start(), match.end(), match.group(0), match.groups())";
      return "import re\n\nregex = " + cStyleString(toPythonPattern(pattern)) + "\ntest_str = " + cStyleString(text) + "\n\n" + call;
    }
    if (lang === "php") {
      const phpFlags = ["i", "m", "s", "u"].filter(has).join("");
      const quote = function (s) { return "'" + String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'"; };
      const call = has("g")
        ? "preg_match_all($re, $str, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);"
        : "preg_match($re, $str, $matches, PREG_OFFSET_CAPTURE);";
      return "<?php\n$re = " + quote("/" + escapeDelimiter(pattern) + "/" + phpFlags) + ";\n$str = " + quote(text) + ";\n\n" + call + "\nvar_dump($matches);";
    }
    if (lang === "java") {
      const javaFlags = [];
      if (has("i")) javaFlags.push("Pattern.CASE_INSENSITIVE");
      if (has("i") && has("u")) javaFlags.push("Pattern.UNICODE_CASE");
      if (has("m")) javaFlags.push("Pattern.MULTILINE");
      if (has("s")) javaFlags.push("Pattern.DOTALL");
      const flagArg = javaFlags.length ? ", " + javaFlags.join(" | ") : "";
      const loop = has("g") ? "while (matcher.find()) {" : "if (matcher.find()) {";
      return "import java.util.regex.Matcher;\nimport java.util.regex.Pattern;\n\npublic class Main {\n    public static void main(String[] args) {\n        final Pattern pattern = Pattern.compile(" + cStyleString(pattern) + flagArg + ");\n        final Matcher matcher = pattern.matcher(" + cStyleString(text) + ");\n        " + loop + "\n            System.out.println(matcher.start() + \" \" + matcher.end() + \" \" + matcher.group(0));\n            for (int i = 1; i <= matcher.groupCount(); i++) {\n                System.out.println(\"  group \" + i + \": \" + matcher.group(i));\n            }\n        }\n    }\n}";
    }
    const loopBody = has("g")
      ? "for (const m of str.matchAll(regex)) {\n  console.log(m.index, m[0], m.slice(1));\n}"
      : "const m = regex.exec(str);\nif (m) console.log(m.index, m[0], m.slice(1));";
    return "const regex = /" + escapeDelimiter(pattern) + "/" + flags + ";\nconst str = " + JSON.stringify(text) + ";\n\n" + loopBody;
  }

  const ESCAPES = {
    d: "a digit (0-9)", D: "a non-digit", w: "a word character (letter, digit, or _)", W: "a non-word character",
    s: "a whitespace character", S: "a non-whitespace character", b: "a word boundary", B: "a non-word-boundary position",
    n: "a newline", r: "a carriage return", t: "a tab", f: "a form feed", v: "a vertical tab", "0": "a NUL character",
  };

  function describeQuantifier(q) {
    const lazy = q.charAt(q.length - 1) === "?" && q.length > 1 ? " (as few as possible)" : "";
    const base = lazy ? q.slice(0, -1) : q;
    if (base === "*") return "zero or more times" + lazy;
    if (base === "+") return "one or more times" + lazy;
    if (base === "?") return "optionally" + lazy;
    const m = /^\{(\d+)(,(\d*))?\}$/.exec(base);
    if (!m) return base;
    if (!m[2]) return "exactly " + m[1] + " times";
    if (m[3] === "") return m[1] + " or more times" + lazy;
    return "between " + m[1] + " and " + m[3] + " times" + lazy;
  }

  function explainPattern(pattern) {
    const out = [];
    let i = 0;
    let groupNo = 0;
    const quant = function () {
      const rest = pattern.slice(i);
      const m = /^(\*|\+|\?|\{\d+(,\d*)?\})\??/.exec(rest);
      if (!m) return "";
      i += m[0].length;
      return ", " + describeQuantifier(m[0]);
    };
    while (i < pattern.length) {
      const ch = pattern[i];
      if (ch === "\\") {
        const n = pattern[i + 1];
        let text;
        let len = 2;
        if (n === undefined) { text = "a trailing backslash"; len = 1; }
        else if (ESCAPES[n]) text = (n === "b" || n === "B" ? "" : "Matches ") + ESCAPES[n];
        else if (/[1-9]/.test(n)) { const d = /^\d+/.exec(pattern.slice(i + 1))[0]; len = 1 + d.length; text = "Matches the same text as group " + d; }
        else if (n === "k" && pattern[i + 2] === "<") { const e = pattern.indexOf(">", i); len = e - i + 1; text = "Matches the same text as group \"" + pattern.slice(i + 3, e) + "\""; }
        else if ((n === "p" || n === "P") && pattern[i + 2] === "{") { const e = pattern.indexOf("}", i); len = e - i + 1; text = "Matches a character " + (n === "P" ? "not " : "") + "in Unicode property " + pattern.slice(i + 3, e); }
        else if (n === "x") { len = 4; text = "Matches the character with hex code " + pattern.slice(i + 2, i + 4); }
        else if (n === "u") { const br = pattern[i + 2] === "{"; const e = br ? pattern.indexOf("}", i) + 1 : i + 6; len = e - i; text = "Matches the Unicode character " + pattern.slice(i, e); }
        else text = "Matches \"" + n + "\" literally";
        i += len;
        if (text === ESCAPES.b || text === ESCAPES.B) text = "Asserts " + text;
        out.push(text + quant());
        continue;
      }
      if (ch === "[") {
        let j = i + 1;
        if (pattern[j] === "^") j++;
        if (pattern[j] === "]") j++;
        while (j < pattern.length && pattern[j] !== "]") j += pattern[j] === "\\" ? 2 : 1;
        const body = pattern.slice(i, j + 1);
        i = j + 1;
        const neg = body.charAt(1) === "^";
        out.push("Matches one character " + (neg ? "not " : "") + "in the set " + body + quant());
        continue;
      }
      if (ch === "(") {
        const rest = pattern.slice(i);
        let m;
        if ((m = /^\(\?<([A-Za-z_$][\w$]*)>/.exec(rest))) { groupNo++; out.push("Starts capture group " + groupNo + " named \"" + m[1] + "\""); i += m[0].length; continue; }
        if (rest.indexOf("(?:") === 0) { out.push("Starts a non-capturing group"); i += 3; continue; }
        if (rest.indexOf("(?=") === 0) { out.push("Starts a lookahead: what follows must match"); i += 3; continue; }
        if (rest.indexOf("(?!") === 0) { out.push("Starts a negative lookahead: what follows must not match"); i += 3; continue; }
        if (rest.indexOf("(?<=") === 0) { out.push("Starts a lookbehind: what comes before must match"); i += 4; continue; }
        if (rest.indexOf("(?<!") === 0) { out.push("Starts a negative lookbehind: what comes before must not match"); i += 4; continue; }
        groupNo++;
        out.push("Starts capture group " + groupNo);
        i++;
        continue;
      }
      if (ch === ")") { i++; out.push("Ends the group" + quant()); continue; }
      if (ch === "|") { i++; out.push("Or: the alternative on the right"); continue; }
      if (ch === "^") { i++; out.push("Asserts the start of the string (or line, with the m flag)"); continue; }
      if (ch === "$") { i++; out.push("Asserts the end of the string (or line, with the m flag)"); continue; }
      if (ch === ".") { i++; out.push("Matches any character except a newline (any character, with the s flag)" + quant()); continue; }
      let lit = "";
      while (i < pattern.length && !/[\\[\]().|^$*+?{]/.test(pattern[i])) {
        const next = pattern[i + 1];
        if (lit && next !== undefined && /[*+?{]/.test(next)) break;
        lit += pattern[i++];
      }
      if (!lit) { lit = pattern[i++]; }
      out.push("Matches \"" + lit + "\" literally" + quant());
    }
    return out;
  }

  // The worker always matches with a global regex; a non-global studio regex reports
  // only the first match, which is the same as stopping a global scan after one hit.
  function buildMatchRequest(pattern, flags, text) {
    return { mode: "matches", pattern: pattern, flags: flags, text: text, maxMatches: flags.indexOf("g") === -1 ? 1 : 1000 };
  }

  return { buildSnippet: buildSnippet, explainPattern: explainPattern, escapeDelimiter: escapeDelimiter, toPythonPattern: toPythonPattern, buildMatchRequest: buildMatchRequest };
}

const regexLogic = createRegexLogic();
export const buildSnippet = regexLogic.buildSnippet;
export const explainPattern = regexLogic.explainPattern;
export const escapeDelimiter = regexLogic.escapeDelimiter;
export const toPythonPattern = regexLogic.toPythonPattern;
export const buildMatchRequest = regexLogic.buildMatchRequest;
