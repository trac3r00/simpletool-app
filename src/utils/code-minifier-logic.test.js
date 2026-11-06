// @vitest-environment node
import { describe, expect, it } from "vitest";
import { transformSync } from "esbuild";
import {
  CODE_MINIFIER_FUNCTIONS,
  beautifyCSS,
  beautifyHTML,
  beautifyJS,
  minifyCSS,
  minifyHTML,
  minifyJS,
} from "./code-minifier-logic.js";

// Oracle: esbuild's whitespace-only minification is a canonical print of the
// parsed program. Equal canonical forms mean our output has the same tokens
// and the same automatic-semicolon-insertion result as the input.
const canon = (code, loader) =>
  transformSync(code, { loader, minifyWhitespace: true }).code;

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const JS_CASES = [
  'var s = "a = b, c";\nvar t = 1',
  "a = 1\nb = 2\nc()",
  "x = a - -b;\ny = a + +b;\nz = a++ + ++b",
  "var re = /https?:\\/\\//g; var z = 1;",
  'const s = `a  ${ x + "}" }  b`;',
  "function f(a, b) {\n  if (a) {\n    return\n    b\n  } else { return a ? b : c }\n}",
  "for (let i = 0; i < 10; i++) { x += i / 2 / y }",
  "if (a) /re/.test(b)",
  "a\n++b",
  "class A { #p = 1; get x() { return this.#p } static async *g() { yield* [1] } }",
  "const f = async (x) => { await x?.y?.[0] ?? 1 }",
  "x = 1 .toString(); y = 1.5.toFixed()",
  "switch (a) { case 1: b(); break; default: c() }",
  "var a = b\n[1,2].forEach(f)",
  "try { a() } catch (e) { b() } finally { c() }",
  "do { x++ } while (x < 5)",
  "var x = {}\n/foo/g.test(s)",
  "a = b ? c : d ? e : f",
  "let t = tag`x${1}y`; let u = x\n`t`",
];

describe("minifyJS / beautifyJS", () => {
  it.each(JS_CASES)("preserve the parse of %j", (src) => {
    const expected = canon(src, "js");
    expect(canon(minifyJS(src), "js")).toBe(expected);
    expect(canon(beautifyJS(src), "js")).toBe(expected);
    expect(canon(beautifyJS(minifyJS(src)), "js")).toBe(expected);
  });

  it("never rewrites string contents", () => {
    expect(minifyJS('var s = "a = b, c";')).toBe('var s="a = b, c";');
  });

  it("keeps license comments and drops ordinary ones", () => {
    const out = minifyJS("/*! MIT */\nvar a = 1 // x\n/* y */ var b = 2");
    expect(out.startsWith("/*! MIT */")).toBe(true);
    expect(out).not.toContain("// x");
    expect(out).not.toContain("/* y */");
  });

  it("keeps the parse for seeded random statement soups", () => {
    const pieces = [
      "a = b", "c()", "d++", "++e", "return f", "x = /re[/]x/g", "y = p / q / r",
      "s = 's;}'", "t = `u${v}w`", "if (g) { h() } else i()", "o = { k: 1 }",
      "arr = [1, -1, +1]", "n = 1e3 - -2", "z = a ? b : c", "w = !x && ~y",
    ];
    const rand = mulberry32(20261106);
    const seps = [";", "\n", " ; ", ";\n", "\n\n", "; /* c */ ", "\n// c\n"];
    for (let run = 0; run < 200; run++) {
      let body = "";
      const count = 2 + Math.floor(rand() * 8);
      for (let k = 0; k < count; k++) {
        body += pieces[Math.floor(rand() * pieces.length)];
        body += seps[Math.floor(rand() * seps.length)];
      }
      const src = `function run(a,b,c,e,f,g,h,i,p,q,r,v,x,y) {\n${body}\n}`;
      let expected;
      try {
        expected = canon(src, "js");
      } catch {
        continue;
      }
      expect(canon(minifyJS(src), "js"), src).toBe(expected);
      expect(canon(beautifyJS(src), "js"), src).toBe(expected);
    }
  });
});

const CSS_CASES = [
  ".a :hover { color: red }",
  'a::before { content: "x ; y" }',
  "@media (max-width: 600px) { a:hover { color: red } }",
  "a { background: url(data:image/png;base64,AAA) }",
  "a { width: calc(100% - 2px) }",
  "ul > li + li ~ p , a { margin: 0 auto !important; }",
  "@media screen and (min-width: 1px) { .x { color: rgba(0, 0, 0, .5) } }",
  "/* c */ a{b:c}",
  'a{grid-template-areas: "a b" "c d"}',
  "a{transition: all .2s ease-in-out , color 1s}",
];

describe("minifyCSS / beautifyCSS", () => {
  it.each(CSS_CASES)("preserve the parse of %j", (src) => {
    const expected = canon(src, "css");
    expect(canon(minifyCSS(src), "css")).toBe(expected);
    expect(canon(beautifyCSS(src), "css")).toBe(expected);
  });

  it("keeps the descendant space before a pseudo-class", () => {
    expect(minifyCSS(".a :hover { color: red }")).toBe(".a :hover{color:red}");
  });

  it("does not split a selector inside @media into a declaration", () => {
    expect(beautifyCSS("@media (x: 1) { a:hover { color: red } }")).toContain("a:hover {");
  });
});

describe("minifyHTML / beautifyHTML", () => {
  it("keeps the space between inline elements", () => {
    expect(minifyHTML("<p><b>a</b> <i>b</i></p>")).toBe("<p><b>a</b> <i>b</i></p>");
  });

  it("leaves pre, textarea and script contents byte-identical", () => {
    const pre = "<pre>  x\n    y</pre>";
    const script = '<script>\n// c\nvar a="b";\nfoo()\n</script>';
    const textarea = "<textarea>  keep\n me</textarea>";
    for (const src of [pre, script, textarea]) {
      expect(minifyHTML(src)).toBe(src);
    }
    expect(beautifyHTML(pre)).toBe(pre);
    expect(beautifyHTML(textarea)).toBe(textarea);
    expect(beautifyHTML(script)).toContain('var a="b";\n');
  });

  it("unquotes only safe attribute values inside tags", () => {
    expect(minifyHTML('<div class="a  b" id="x">x = "y"</div>')).toBe(
      '<div class="a  b" id=x>x = "y"</div>',
    );
    expect(minifyHTML('<input value="x"/>')).toBe('<input value="x"/>');
  });

  it("drops comments except conditional comments", () => {
    expect(minifyHTML("<div><!-- x --></div><!--[if IE]><p>a</p><![endif]-->")).toBe(
      "<div></div><!--[if IE]><p>a</p><![endif]-->",
    );
  });

  it("indents nested blocks and keeps short text on the tag's line", () => {
    expect(beautifyHTML("<div><p>Hello <b>world</b>!</p><p>x</p></div>")).toBe(
      "<div>\n  <p>\n    Hello <b>world</b>!\n  </p>\n  <p>x</p>\n</div>",
    );
  });
});

describe("inlined source", () => {
  it("cannot terminate or confuse the page's inline <script>", () => {
    const source = CODE_MINIFIER_FUNCTIONS.map((fn) => fn.toString()).join("\n");
    expect(source).not.toMatch(/<\/script/i);
    expect(source).not.toMatch(/<!--/);
    expect(source).not.toMatch(/<script/i);
  });
});
