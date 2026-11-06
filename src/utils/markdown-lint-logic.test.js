// @vitest-environment node
import { describe, it, expect } from "vitest";
import { lint, detectFormat, lineRange, createMarkdownLint } from "./markdown-lint-logic.js";

const SEED = 0x5eed1a7;

function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rules(text, format) {
  return lint(text, format).findings.map((f) => [f.line, f.severity, f.rule]);
}

function errorRules(text, format) {
  return lint(text, format).findings.filter((f) => f.severity === "error").map((f) => f.rule);
}

describe("llms.txt fixtures (llmstxt.org format)", () => {
  it("accepts the spec's mock example with no findings", () => {
    const text = [
      "# Title",
      "",
      "> Optional description goes here",
      "",
      "Optional details go here",
      "",
      "## Section name",
      "",
      "- [Link title](https://link_url): Optional link details",
      "",
      "## Optional",
      "",
      "- [Link title](https://link_url)",
    ].join("\n");
    expect(rules(text, "llms")).toEqual([]);
  });

  it("accepts a leading byte-order mark", () => {
    expect(rules("\uFEFF# Site\n\n> Summary\n", "llms")).toEqual([]);
  });

  it("reports every structural violation at its line", () => {
    const text = [
      "Intro before the title", // 1
      "# Proj", // 2
      "### Deep heading", // 3
      "## Docs", // 4
      "* [A](https://a) notes", // 5
      "- plain item", // 6
      "free text", // 7
      "## optional", // 8
      "## Optional", // 9
      "- [C]()", // 10
      "## More", // 11
      "- [D](https://d)", // 12
    ].join("\n");
    expect(rules(text, "llms")).toEqual([
      [1, "error", "llms-h1-first"],
      [3, "warning", "llms-heading-level"],
      [5, "warning", "llms-list-marker"],
      [5, "warning", "llms-link-notes"],
      [6, "error", "llms-link-missing"],
      [7, "warning", "llms-section-prose"],
      [8, "warning", "llms-section-empty"],
      [8, "warning", "llms-optional-case"],
      [8, "info", "llms-optional-order"],
      [9, "warning", "llms-section-duplicate"],
      [9, "warning", "llms-optional-duplicate"],
      [10, "error", "llms-link-url-empty"],
    ]);
  });

  it("requires an H1 and flags a second one", () => {
    expect(rules("", "llms")).toEqual([[1, "error", "llms-empty"]]);
    expect(errorRules("## Only sections\n- [a](b)", "llms")).toEqual(["llms-h1-first"]);
    expect(rules("# A\n\n> s\n\n# B\n", "llms")).toEqual([[5, "error", "llms-h1-multiple"]]);
  });

  it("suggests the summary blockquote only when it is missing", () => {
    expect(rules("# A\n\nDetails\n", "llms")).toEqual([[1, "info", "llms-summary-missing"]]);
  });

  it("ignores headings and links inside fenced code", () => {
    const text = "# A\n\n> s\n\n```md\n# not a title\n## not a section\n```\n";
    expect(rules(text, "llms")).toEqual([]);
  });

  it("allows indented continuation lines under a link item", () => {
    const text = "# A\n\n> s\n\n## Docs\n- [x](https://x): first line\n  continues here\n";
    expect(rules(text, "llms")).toEqual([]);
  });
});

describe("SKILL.md fixtures (agentskills.io/specification)", () => {
  it("accepts the spec's example with optional fields", () => {
    const text = [
      "---",
      "name: pdf-processing",
      "description: Extract PDF text, fill forms, merge files. Use when handling PDFs.",
      "license: Apache-2.0",
      "metadata:",
      "  author: example-org",
      '  version: "1.0"',
      "---",
      "# PDF processing",
      "Steps go here.",
    ].join("\n");
    expect(rules(text, "skill")).toEqual([[2, "info", "skill-name-directory"]]);
  });

  it("reads block-scalar and quoted descriptions", () => {
    const folded = "---\nname: a\ndescription: >\n  Does a thing.\n  Use when asked.\n---\nBody\n";
    const quoted = "---\nname: a\ndescription: \"Does: a thing. Use when asked.\"\n---\nBody\n";
    expect(errorRules(folded, "skill")).toEqual([]);
    expect(errorRules(quoted, "skill")).toEqual([]);
  });

  it("reports frontmatter, name, description and field violations", () => {
    const text = [
      "---", // 1
      "name: PDF--Tool-", // 2
      "description: Helps: with PDFs", // 3
      "version: 1", // 4
      "metadata:", // 5
      "  v: 1.0", // 6
      "allowed-tools:", // 7
      "  - Read", // 8
      "---", // 9
      "",
    ].join("\n");
    expect(rules(text, "skill")).toEqual([
      [2, "error", "skill-name-charset"],
      [2, "error", "skill-name-hyphen-edge"],
      [2, "error", "skill-name-hyphen-double"],
      [3, "error", "skill-yaml-colon"],
      [3, "info", "skill-description-when"],
      [4, "warning", "skill-field-unknown"],
      [6, "warning", "skill-metadata-scalar"],
      [7, "warning", "skill-allowed-tools-type"],
      [9, "warning", "skill-body-empty"],
    ]);
  });

  it("requires frontmatter on line 1 that is closed", () => {
    expect(rules("# Skill\n", "skill")).toEqual([[1, "error", "skill-frontmatter-missing"]]);
    expect(rules("---\nname: a\n", "skill")).toEqual([[1, "error", "skill-frontmatter-unclosed"]]);
  });

  it("requires name and description", () => {
    expect(errorRules("---\nlicense: MIT\n---\nBody", "skill")).toEqual(["skill-name-missing", "skill-description-missing"]);
    expect(errorRules("---\nname: a\ndescription:\n---\nBody", "skill")).toEqual(["skill-description-empty"]);
  });

  it("enforces the 64, 1024 and 500 character limits at their boundaries", () => {
    const fm = (name, desc, extra) => "---\nname: " + name + "\ndescription: " + desc + "\n" + (extra || "") + "---\nBody\n";
    const when = "Use when x. ";
    expect(errorRules(fm("a".repeat(64), when), "skill")).toEqual([]);
    expect(errorRules(fm("a".repeat(65), when), "skill")).toEqual(["skill-name-length"]);
    expect(errorRules(fm("a", when + "d".repeat(1024 - when.length)), "skill")).toEqual([]);
    expect(errorRules(fm("a", when + "d".repeat(1025 - when.length)), "skill")).toEqual(["skill-description-length"]);
    expect(errorRules(fm("a", when, "compatibility: " + "c".repeat(500) + "\n"), "skill")).toEqual([]);
    expect(errorRules(fm("a", when, "compatibility: " + "c".repeat(501) + "\n"), "skill")).toEqual(["skill-compatibility-length"]);
  });

  it("flags duplicate fields and files over 500 lines", () => {
    expect(errorRules("---\nname: a\nname: b\ndescription: Use when x.\n---\nBody", "skill")).toEqual(["skill-field-duplicate"]);
    const long = "---\nname: a\ndescription: Use when x.\n---\n" + "line\n".repeat(500);
    expect(lint(long, "skill").findings.map((f) => f.rule)).toContain("skill-too-long");
  });
});

describe("AGENTS.md fixtures (agents.md)", () => {
  it("accepts the agents.md sample with commands in code", () => {
    const text = [
      "# AGENTS.md",
      "",
      "## Setup commands",
      "- Install deps: `pnpm install`",
      "- Start dev server: `pnpm dev`",
      "",
      "```bash",
      "pnpm test",
      "```",
      "",
      "## Code style",
      "- TypeScript strict mode",
      "- Make sure you run the linter",
    ].join("\n");
    expect(rules(text, "agents")).toEqual([]);
  });

  it("reports bare commands, secrets, empty sections and unclosed fences", () => {
    const text = [
      "Setup", // 1
      "- Install deps: pnpm install", // 2
      "- $ npm test", // 3
      "API_KEY=abc123def456ghi", // 4
      "token ghp_" + "a".repeat(36), // 5
      "## Empty", // 6
      "## Next", // 7
      "```", // 8
      "open",
    ].join("\n");
    expect(rules(text, "agents")).toEqual([
      [2, "warning", "agents-command-unformatted"],
      [3, "warning", "agents-command-unformatted"],
      [4, "error", "secret-like"],
      [5, "error", "secret-like"],
      [6, "info", "agents-section-empty"],
      [8, "error", "fence-unclosed"],
    ]);
  });

  it("warns on an empty file, a file without headings and one over 32 KiB", () => {
    expect(rules("  \n", "agents")).toEqual([[1, "warning", "agents-empty"]]);
    expect(rules("Just prose.\n", "agents")).toEqual([[1, "warning", "agents-no-headings"]]);
    const big = "# A\n" + "x".repeat(32 * 1024) + "\n";
    expect(rules(big, "agents")).toEqual([[1, "warning", "agents-size"]]);
  });

  it("does not treat placeholders or prose as secrets", () => {
    const text = "# A\n- API_KEY=<your-key>\n- password: ${DB_PASSWORD}\n- The token is rotated daily.\n";
    expect(rules(text, "agents")).toEqual([]);
  });

  it("detects common credential shapes and never echoes them in full", () => {
    const samples = [
      "AKIA" + "ABCDEFGHIJKLMNOP",
      "sk-ant-" + "a1".repeat(15),
      "-----BEGIN RSA PRIVATE KEY-----",
      "xoxb-" + "1234567890-abcdef",
      "AIza" + "B".repeat(35),
    ];
    samples.forEach((s) => {
      const found = lint("# A\n" + s + "\n", "agents").findings.filter((f) => f.rule === "secret-like");
      expect(found, s).toHaveLength(1);
      expect(found[0].message).not.toContain(s);
    });
  });
});

describe("helpers", () => {
  it("detects the format from a file name", () => {
    expect(detectFormat("my-skill/SKILL.md")).toBe("skill");
    expect(detectFormat("C:\\repo\\AGENTS.md")).toBe("agents");
    expect(detectFormat("llms.txt")).toBe("llms");
    expect(detectFormat("README.md")).toBe("");
  });

  it("maps a 1-based line to character offsets, including CRLF text", () => {
    const text = "one\r\ntwo\nthree";
    const r = lineRange(text, 2);
    expect(text.slice(r.start, r.end)).toBe("two");
    expect(text.slice(lineRange(text, 1).start, lineRange(text, 1).end)).toBe("one");
    expect(lineRange(text, 9)).toEqual({ start: text.length, end: text.length });
  });

  it("finding lines agree with lineRange for CRLF input", () => {
    const text = "Setup\r\n- Run: npm test\r\n";
    const [f] = lint(text, "agents").findings.filter((x) => x.rule === "agents-command-unformatted");
    const r = lineRange(text, f.line);
    expect(text.slice(r.start, r.end)).toBe("- Run: npm test");
  });

  it("returns nothing when linting is off", () => {
    expect(lint("anything", "off")).toEqual({ format: "off", findings: [], counts: { error: 0, warning: 0, info: 0 } });
  });

  it("the factory is self-contained once serialized", () => {
    const revived = new Function("return (" + createMarkdownLint.toString() + ")();")();
    expect(revived.lint("# A\n\n> s\n", "llms").findings).toEqual([]);
  });
});

// Independent oracle for the Agent Skills `name` rules, written char by char from
// the spec text rather than with the linter's regexes.
function specNameValid(name) {
  if (name.length < 1 || name.length > 64) return false;
  for (const ch of name) {
    const lowerAlpha = ch >= "a" && ch <= "z";
    const digit = ch >= "0" && ch <= "9";
    if (!lowerAlpha && !digit && ch !== "-") return false;
  }
  if (name.startsWith("-") || name.endsWith("-")) return false;
  return !name.includes("--");
}

function wrongNameValid(name) {
  return /^[a-z0-9-]{1,64}$/.test(name); // forgets the hyphen-placement rules
}

function randomName(rand) {
  const alphabet = "abcz09-AZ_.";
  const len = 1 + Math.floor(rand() * (rand() < 0.1 ? 70 : 8));
  let s = "";
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(rand() * alphabet.length)];
  return s;
}

function linterNameValid(name) {
  const text = "---\nname: " + name + "\ndescription: Use when testing.\n---\nBody\n";
  return !lint(text, "skill").findings.some((f) => f.severity === "error" && f.rule.startsWith("skill-name"));
}

// Generates a random llms.txt from the spec's grammar: H1, optional summary, optional
// details, then H2 sections of '- [name](url): notes' items.
function randomLlms(rand) {
  const word = () => ["docs", "api", "guide", "intro", "faq", "ref"][Math.floor(rand() * 6)];
  const lines = ["# " + word() + " project"];
  if (rand() < 0.7) lines.push("", "> " + word() + " summary");
  if (rand() < 0.5) lines.push("", "Details about " + word() + ".");
  const sectionCount = Math.floor(rand() * 4);
  for (let s = 0; s < sectionCount; s++) {
    lines.push("", "## Section " + s);
    const items = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < items; i++) {
      const notes = rand() < 0.5 ? ": " + word() + " notes" : "";
      lines.push("- [" + word() + "](https://example.com/" + s + "/" + i + ".md)" + notes);
    }
  }
  if (rand() < 0.3) lines.push("", "## Optional", "- [extra](https://example.com/extra.md)");
  return lines;
}

describe("seeded properties (seed " + SEED + ")", () => {
  it("skill name verdicts match the spec oracle", () => {
    const rand = createRandom(SEED);
    for (let i = 0; i < 2000; i++) {
      const name = randomName(rand);
      expect(linterNameValid(name), JSON.stringify(name)).toBe(specNameValid(name));
    }
  });

  it("calibration: a validator missing the hyphen rules disagrees with the oracle", () => {
    const rand = createRandom(SEED);
    let disagreements = 0;
    for (let i = 0; i < 2000; i++) {
      const name = randomName(rand);
      if (wrongNameValid(name) !== specNameValid(name)) disagreements++;
    }
    expect(disagreements).toBeGreaterThan(0);
  });

  it("grammar-generated llms.txt files have no errors or warnings", () => {
    const rand = createRandom(SEED);
    for (let i = 0; i < 500; i++) {
      const text = randomLlms(rand).join("\n");
      const bad = lint(text, "llms").findings.filter((f) => f.severity !== "info");
      expect(bad, text).toEqual([]);
    }
  });

  it("breaking one link in a generated file reports exactly that line", () => {
    const rand = createRandom(SEED + 1);
    let mutated = 0;
    for (let i = 0; i < 500; i++) {
      const lines = randomLlms(rand);
      const linkLines = lines.map((l, idx) => (l.startsWith("- [") ? idx : -1)).filter((idx) => idx >= 0);
      if (!linkLines.length) continue;
      const target = linkLines[Math.floor(rand() * linkLines.length)];
      lines[target] = "- " + lines[target].replace(/^- \[([^\]]*)\]\([^)]*\)/, "$1");
      const errors = lint(lines.join("\n"), "llms").findings.filter((f) => f.severity === "error");
      expect(errors.map((f) => [f.line, f.rule])).toEqual([[target + 1, "llms-link-missing"]]);
      mutated++;
    }
    expect(mutated).toBeGreaterThan(100);
  });
});
