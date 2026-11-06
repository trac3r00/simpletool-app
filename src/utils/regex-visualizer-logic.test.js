import { describe, expect, it } from "vitest";
import { buildSnippet, escapeDelimiter, explainPattern, toPythonPattern } from "./regex-visualizer-logic.js";
import { handleRegexVisualizerRoutes } from "../routes/regex-visualizer.js";

describe("regex code snippets", () => {
  // These snippets were executed with python3 and `java Main.java`; their
  // matches equalled JavaScript RegExp on the same pattern and text.
  it("JavaScript keeps an already-escaped slash intact", () => {
    // The old generator turned \/ into \\/ and ended the literal early.
    const code = buildSnippet("js", "^https?:\\/\\/", "g", "https://a.test");
    expect(code.split("\n")[0]).toBe("const regex = /^https?:\\/\\//g;");
    expect(() => new Function(code.replace(/console\.log/g, "void"))).not.toThrow();
  });

  it("Java combines flags with | instead of passing extra arguments", () => {
    const code = buildSnippet("java", "a", "gim", "A");
    expect(code).toContain('Pattern.compile("a", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE)');
  });

  it("PHP drops the g flag, which preg rejects", () => {
    const code = buildSnippet("php", "a/b", "gims", "x");
    expect(code).toContain("$re = '/a\\\\/b/ims';");
    expect(code).toContain("preg_match_all(");
    expect(buildSnippet("php", "a", "i", "x")).toContain("preg_match($re");
  });

  it("Python converts named groups and escapes newlines in the test string", () => {
    expect(toPythonPattern("(?<y>\\d+)\\k<y>")).toBe("(?P<y>\\d+)(?P=y)");
    const code = buildSnippet("python", "(?<y>a)", "gs", 'x\n"y"');
    expect(code).toContain('regex = "(?P<y>a)"');
    expect(code).toContain('test_str = "x\\n\\"y\\""');
    expect(code).toContain("re.DOTALL");
  });

  it("quotes test strings so they cannot break out of the literal", () => {
    const text = "it's \"q\" \\ `b` ${x}\n";
    const js = buildSnippet("js", "q", "g", text);
    const str = new Function(js.split("\n")[1].replace("const str = ", "return ").replace(/;$/, ""))();
    expect(str).toBe(text);
  });

  // Seeded property test: a pattern placed between "/" delimiters by
  // escapeDelimiter must behave exactly like new RegExp(pattern).
  it("escapeDelimiter preserves regex behaviour", () => {
    let seed = 7;
    const pick = (s) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return s[seed % s.length];
    };
    const atoms = ["a", "b", "/", "\\/", "\\d", ".", "[/a]", "(a|/)", "\\\\", "x*"];
    const samples = ["a/b", "//", "\\/", "ab1", "/a/", "x\\y", ""];
    for (let k = 0; k < 300; k++) {
      const pattern = Array.from({ length: 1 + (k % 5) }, () => pick(atoms)).join("");
      const literal = new Function("return /" + escapeDelimiter(pattern) + "/g;")();
      const direct = new RegExp(pattern, "g");
      for (const s of samples) {
        expect([...s.matchAll(literal)].map((m) => m.index + ":" + m[0]), pattern).toEqual(
          [...s.matchAll(direct)].map((m) => m.index + ":" + m[0]),
        );
      }
    }
  });
});

describe("regex explanation", () => {
  it("does not mistake escaped metacharacters for operators", () => {
    const lines = explainPattern("a\\.b\\?");
    expect(lines).toEqual(['Matches "a" literally', 'Matches "." literally', 'Matches "b" literally', 'Matches "?" literally']);
  });

  it("names group kinds and quantifiers", () => {
    expect(explainPattern("(?<y>\\d{4})(?:x|y)+?(?!z)")).toEqual([
      'Starts capture group 1 named "y"',
      "Matches a digit (0-9), exactly 4 times",
      "Ends the group",
      "Starts a non-capturing group",
      'Matches "x" literally',
      "Or: the alternative on the right",
      'Matches "y" literally',
      "Ends the group, one or more times (as few as possible)",
      "Starts a negative lookahead: what follows must not match",
      'Matches "z" literally',
      "Ends the group",
    ]);
  });
});

describe("regex studio page", () => {
  it("inlines a factory that evaluates in the browser form", async () => {
    const url = new URL("https://simpletool.app/regex-visualizer");
    const html = await (await handleRegexVisualizerRoutes(new Request(url))).text();
    const marker = "const regexLogic = (";
    const start = html.indexOf(marker);
    expect(start).toBeGreaterThan(-1);
    const end = html.indexOf(")();", start);
    // eslint-disable-next-line no-eval
    const logic = eval("(" + html.slice(start + marker.length, end) + ")()");
    expect(logic.buildSnippet("js", "a\\/b", "g", "a/b").split("\n")[0]).toBe("const regex = /a\\/b/g;");
  });
});
