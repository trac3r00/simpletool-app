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

  // Each explanation line is an English template with {name} placeholders under a
  // stable message key. The optional translate(key, english) lets the page swap in
  // a localized template; without it the English text is returned unchanged.
  const ESCAPES = {
    d: ["r66_esc_digit", "a digit (0-9)"], D: ["r66_esc_nondigit", "a non-digit"],
    w: ["r66_esc_word", "a word character (letter, digit, or _)"], W: ["r66_esc_nonword", "a non-word character"],
    s: ["r66_esc_space", "a whitespace character"], S: ["r66_esc_nonspace", "a non-whitespace character"],
    b: ["r66_esc_boundary", "a word boundary"], B: ["r66_esc_nonboundary", "a non-word-boundary position"],
    n: ["r66_esc_newline", "a newline"], r: ["r66_esc_cr", "a carriage return"], t: ["r66_esc_tab", "a tab"],
    f: ["r66_esc_formfeed", "a form feed"], v: ["r66_esc_vtab", "a vertical tab"], "0": ["r66_esc_nul", "a NUL character"],
  };

  function explainPattern(pattern, translate) {
    const msg = function (key, english, params) {
      const template = translate ? translate(key, english) : english;
      return String(template).replace(/\{(\w+)\}/g, function (whole, name) {
        return params && Object.prototype.hasOwnProperty.call(params, name) ? params[name] : whole;
      });
    };
    const describeQuantifier = function (q) {
      const lazy = q.charAt(q.length - 1) === "?" && q.length > 1;
      const base = lazy ? q.slice(0, -1) : q;
      let text;
      if (base === "*") text = msg("r66_q_star", "zero or more times");
      else if (base === "+") text = msg("r66_q_plus", "one or more times");
      else if (base === "?") text = msg("r66_q_optional", "optionally");
      else {
        const m = /^\{(\d+)(,(\d*))?\}$/.exec(base);
        if (!m) return base;
        if (!m[2]) return msg("r66_q_exact", "exactly {n} times", { n: m[1] });
        text = m[3] === ""
          ? msg("r66_q_min", "{n} or more times", { n: m[1] })
          : msg("r66_q_range", "between {min} and {max} times", { min: m[1], max: m[3] });
      }
      return lazy ? msg("r66_q_lazy", "{q} (as few as possible)", { q: text }) : text;
    };
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
        if (n === undefined) { text = msg("r66_trailing_backslash", "a trailing backslash"); len = 1; }
        else if (ESCAPES[n]) {
          const what = msg(ESCAPES[n][0], ESCAPES[n][1]);
          text = n === "b" || n === "B"
            ? msg("r66_asserts", "Asserts {what}", { what: what })
            : msg("r66_matches", "Matches {what}", { what: what });
        }
        else if (/[1-9]/.test(n)) { const d = /^\d+/.exec(pattern.slice(i + 1))[0]; len = 1 + d.length; text = msg("r66_backref", "Matches the same text as group {n}", { n: d }); }
        else if (n === "k" && pattern[i + 2] === "<") { const e = pattern.indexOf(">", i); len = e - i + 1; text = msg("r66_backref_named", "Matches the same text as group \"{name}\"", { name: pattern.slice(i + 3, e) }); }
        else if ((n === "p" || n === "P") && pattern[i + 2] === "{") {
          const e = pattern.indexOf("}", i); len = e - i + 1;
          text = n === "P"
            ? msg("r66_not_property", "Matches a character not in Unicode property {name}", { name: pattern.slice(i + 3, e) })
            : msg("r66_property", "Matches a character in Unicode property {name}", { name: pattern.slice(i + 3, e) });
        }
        else if (n === "x") { len = 4; text = msg("r66_hex", "Matches the character with hex code {code}", { code: pattern.slice(i + 2, i + 4) }); }
        else if (n === "u") { const br = pattern[i + 2] === "{"; const e = br ? pattern.indexOf("}", i) + 1 : i + 6; len = e - i; text = msg("r66_unicode", "Matches the Unicode character {code}", { code: pattern.slice(i, e) }); }
        else text = msg("r66_literal", "Matches \"{text}\" literally", { text: n });
        i += len;
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
        out.push((neg
          ? msg("r66_not_in_set", "Matches one character not in the set {set}", { set: body })
          : msg("r66_in_set", "Matches one character in the set {set}", { set: body })) + quant());
        continue;
      }
      if (ch === "(") {
        const rest = pattern.slice(i);
        let m;
        if ((m = /^\(\?<([A-Za-z_$][\w$]*)>/.exec(rest))) { groupNo++; out.push(msg("r66_group_named", "Starts capture group {n} named \"{name}\"", { n: String(groupNo), name: m[1] })); i += m[0].length; continue; }
        if (rest.indexOf("(?:") === 0) { out.push(msg("r66_noncapturing", "Starts a non-capturing group")); i += 3; continue; }
        if (rest.indexOf("(?=") === 0) { out.push(msg("r66_lookahead", "Starts a lookahead: what follows must match")); i += 3; continue; }
        if (rest.indexOf("(?!") === 0) { out.push(msg("r66_neg_lookahead", "Starts a negative lookahead: what follows must not match")); i += 3; continue; }
        if (rest.indexOf("(?<=") === 0) { out.push(msg("r66_lookbehind", "Starts a lookbehind: what comes before must match")); i += 4; continue; }
        if (rest.indexOf("(?<!") === 0) { out.push(msg("r66_neg_lookbehind", "Starts a negative lookbehind: what comes before must not match")); i += 4; continue; }
        groupNo++;
        out.push(msg("r66_group", "Starts capture group {n}", { n: String(groupNo) }));
        i++;
        continue;
      }
      if (ch === ")") { i++; out.push(msg("r66_group_end", "Ends the group") + quant()); continue; }
      if (ch === "|") { i++; out.push(msg("r66_or", "Or: the alternative on the right")); continue; }
      if (ch === "^") { i++; out.push(msg("r66_anchor_start", "Asserts the start of the string (or line, with the m flag)")); continue; }
      if (ch === "$") { i++; out.push(msg("r66_anchor_end", "Asserts the end of the string (or line, with the m flag)")); continue; }
      if (ch === ".") { i++; out.push(msg("r66_dot", "Matches any character except a newline (any character, with the s flag)") + quant()); continue; }
      let lit = "";
      while (i < pattern.length && !/[\\[\]().|^$*+?{]/.test(pattern[i])) {
        const next = pattern[i + 1];
        if (lit && next !== undefined && /[*+?{]/.test(next)) break;
        lit += pattern[i++];
      }
      if (!lit) { lit = pattern[i++]; }
      out.push(msg("r66_literal", "Matches \"{text}\" literally", { text: lit }) + quant());
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
