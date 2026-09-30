import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const M_T = ["T", "O", "D", "O"].join("");
const M_F = ["F", "I", "X", "M", "E"].join("");
const M_H = ["H", "A", "C", "K"].join("");

const EXCLUDED_PATHS = [
  "node_modules/",
  "dist/",
  ".git/",
  M_T + ".md",
  "todo-markers.test.js",
  "scripts/vendor/",
  "src/utils/bundled-styles.js",
  "coverage/",
  ".wrangler/",
];

const MARKER_RE = new RegExp(
  "(?:^|\\s|>)(?:\\/\\/|<!--|#|\\/\\*|\\*\\s)\\s*.*(" +
    M_T +
    "|" +
    M_F +
    "|" +
    M_H +
    ")\\b",
  "i",
);
const TEST_BLOCK_RE = new RegExp("test\\." + M_F.toLowerCase() + "\\s*\\(");

// Same heuristic git uses for its own binary detection: a NUL byte in the
// first 8000 bytes. Content-based, so extensionless text files stay scanned.
const BINARY_SNIFF_BYTES = 8000;

function isBinary(buffer) {
  return buffer.subarray(0, BINARY_SNIFF_BYTES).includes(0);
}

function findMarkerViolations(file, buffer) {
  if (isBinary(buffer)) return [];
  const violations = [];
  const lines = buffer.toString("utf8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (MARKER_RE.test(lines[i]) || TEST_BLOCK_RE.test(lines[i])) {
      violations.push(`${file}:${i + 1}: ${lines[i].trim()}`);
    }
  }
  return violations;
}

function getTrackedSourceFiles() {
  try {
    const output = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" });
    return output
      .split("\n")
      .filter(Boolean)
      .filter((f) => !EXCLUDED_PATHS.some((ex) => f.includes(ex)));
  } catch {
    return [];
  }
}

describe("marker scan", () => {
  const marked = `// ${M_T}: remove this\n`;

  it("flags markers in text files, including extensionless ones", () => {
    expect(findMarkerViolations("CODEOWNERS", Buffer.from(`# ${M_H} owner\n`))).toEqual([
      `CODEOWNERS:1: # ${M_H} owner`,
    ]);
    expect(findMarkerViolations("docs/a.md", Buffer.from(`x\n<!-- ${M_F} -->\n`))).toEqual([
      `docs/a.md:2: <!-- ${M_F} -->`,
    ]);
    expect(findMarkerViolations("a.js", Buffer.from(`test.${M_F.toLowerCase()}("x")\n`))).toHaveLength(1);
  });

  it("skips binary files even when their bytes spell a marker", () => {
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x0a]),
      Buffer.from(marked),
    ]);
    expect(findMarkerViolations("shot.png", png)).toEqual([]);
  });

  it("treats a NUL byte past the sniff window as text", () => {
    const late = Buffer.concat([Buffer.from(marked), Buffer.alloc(8000, 0x20), Buffer.from([0])]);
    expect(findMarkerViolations("big.txt", late)).toHaveLength(1);
  });
});

describe("tracked source files", () => {
  // Reads every tracked file, so its runtime scales with the repo and the
  // runner, not with the code under test. Binaries (~43MB of screenshots) are
  // skipped before decoding; the 30s cap keeps headroom on the shared pve-ci
  // runner, where the 5s default failed before that skip (8.8s observed).
  it(`contain no ${M_T}/${M_F}/${M_H} markers or test.${M_F.toLowerCase()} calls`, () => {
    const files = getTrackedSourceFiles();
    expect(files.length).toBeGreaterThan(0);

    const violations = [];
    for (const file of files) {
      let buffer;
      try {
        buffer = readFileSync(join(ROOT, file));
      } catch {
        continue;
      }
      violations.push(...findMarkerViolations(file, buffer));
    }

    expect(violations).toEqual([]);
  }, 30_000);
});
