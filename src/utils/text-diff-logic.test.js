import { describe, expect, it } from "vitest";
import {
  computeTextDiff,
  createUnifiedDiff,
  diffTokenKey,
  myersMatchPairs,
  tokenizeText,
} from "./text-diff-logic.js";

const SEED = Number(process.env.TEXT_DIFF_SEED || 0x5eed2026);
const CASES = Number(process.env.TEXT_DIFF_CASES || 300);
const MODES = ["line", "word", "char"];

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ALPHABET = ["a", "b", "c", "A", "B", "x", "é", "한", "😀", " ", " ", "\t", "\n", "\n"];
const OTHER_ALPHABET = ["q", "z", "ü", "字"];

function randomText(rand, maxLen, alphabet = ALPHABET) {
  const len = Math.floor(rand() * (maxLen + 1));
  let s = "";
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(rand() * alphabet.length)];
  return s;
}

function mutate(rand, text) {
  const chars = Array.from(text);
  const edits = 1 + Math.floor(rand() * 4);
  for (let e = 0; e < edits; e++) {
    const pos = Math.floor(rand() * (chars.length + 1));
    const r = rand();
    if (r < 0.4 && chars.length) chars.splice(Math.min(pos, chars.length - 1), 1);
    else if (r < 0.8) chars.splice(pos, 0, ...Array.from(randomText(rand, 4) || "a"));
    else chars.splice(pos, 0, "\n");
  }
  return chars.join("");
}

function generatePair(rand, n) {
  const kind = n % 6;
  if (kind === 0) return ["", randomText(rand, 30)];
  if (kind === 1) {
    const t = randomText(rand, 40);
    return [t, t];
  }
  if (kind === 2) return [randomText(rand, 30), randomText(rand, 30, OTHER_ALPHABET)];
  if (kind === 3) return [randomText(rand, 30), randomText(rand, 30)];
  const a = randomText(rand, 40);
  const b = mutate(rand, a);
  if (kind === 4) return [a, b];
  return [a.endsWith("\n") ? a.slice(0, -1) : a + "\n", b];
}

// Independent oracles below: tokenizer, O(n*m) LCS table, unified patch applier.
function oracleTokens(text, mode) {
  if (text === "") return [];
  if (mode === "char") return [...text];
  if (mode === "word") {
    const out = [];
    for (const ch of text) {
      const ws = ch === " " || ch === "\t" || ch === "\n";
      const prev = out[out.length - 1];
      const prevWs = prev !== undefined && /^[ \t\n]/.test(prev);
      if (prev !== undefined && prevWs === ws) out[out.length - 1] += ch;
      else out.push(ch);
    }
    return out;
  }
  const parts = text.split("\n");
  const out = parts.slice(0, -1).map((p) => p + "\n");
  if (parts[parts.length - 1] !== "") out.push(parts[parts.length - 1]);
  return out;
}

function oracleLcsLength(xs, ys, eq) {
  let prev = new Array(ys.length + 1).fill(0);
  for (let i = 1; i <= xs.length; i++) {
    const row = new Array(ys.length + 1).fill(0);
    for (let j = 1; j <= ys.length; j++) {
      row[j] = eq(xs[i - 1], ys[j - 1])
        ? prev[j - 1] + 1
        : Math.max(prev[j], row[j - 1]);
    }
    prev = row;
  }
  return prev[ys.length];
}

function applyUnifiedPatch(original, patch) {
  if (patch === "") return original;
  const src = oracleTokens(original, "line");
  const lines = patch.split("\n");
  if (!lines[0].startsWith("--- ") || !lines[1].startsWith("+++ ")) throw new Error("bad headers");
  const out = [];
  let pos = 0;
  let idx = 2;
  while (idx < lines.length && lines[idx] !== "") {
    const m = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@$/.exec(lines[idx]);
    if (!m) throw new Error("bad hunk header: " + lines[idx]);
    const aStart = Number(m[1]);
    const aCount = m[2] === undefined ? 1 : Number(m[2]);
    const bCount = m[4] === undefined ? 1 : Number(m[4]);
    const startIdx = aCount === 0 ? aStart : aStart - 1;
    if (startIdx < pos) throw new Error("overlapping hunk");
    while (pos < startIdx) out.push(src[pos++]);
    idx++;
    const body = [];
    while (idx < lines.length && /^[ +\-\\]/.test(lines[idx])) {
      if (lines[idx][0] === "\\") {
        const last = body[body.length - 1];
        last.text = last.text.slice(0, -1);
      } else {
        body.push({ kind: lines[idx][0], text: lines[idx].slice(1) + "\n" });
      }
      idx++;
    }
    let seenA = 0;
    let seenB = 0;
    for (const entry of body) {
      if (entry.kind !== "+") {
        if (src[pos] !== entry.text) throw new Error("context mismatch at " + pos);
        pos++;
        seenA++;
      }
      if (entry.kind !== "-") {
        out.push(entry.text);
        seenB++;
      }
    }
    if (seenA !== aCount || seenB !== bCount) throw new Error("hunk counts wrong");
  }
  while (pos < src.length) out.push(src[pos++]);
  return out.join("");
}

function runProperty(name, check) {
  const rand = mulberry32(SEED);
  const tally = { attempted: 0, executed: 0, discarded: 0, failing: 0 };
  const failures = [];
  for (let n = 0; n < CASES; n++) {
    tally.attempted++;
    const [a, b] = generatePair(rand, n);
    const result = check(a, b, rand);
    if (result === "discard") {
      tally.discarded++;
      continue;
    }
    tally.executed++;
    if (result !== true) {
      tally.failing++;
      if (failures.length < 3) failures.push({ n, a, b, result });
    }
  }
  console.log(
    `[text-diff ${name}] seed=0x${SEED.toString(16)} attempted=${tally.attempted} executed=${tally.executed} discarded=${tally.discarded} failing=${tally.failing}`,
  );
  return { tally, failures };
}

function reconstructs(a, b, ops) {
  let ra = "";
  let rb = "";
  for (const op of ops) {
    if (op.type !== "insert") ra += op.a;
    if (op.type !== "delete") rb += op.b;
  }
  return ra === a && rb === b;
}

function isMinimal(a, b, ops, mode, eq = (x, y) => x === y) {
  const ta = oracleTokens(a, mode);
  const tb = oracleTokens(b, mode);
  const engineA = ops.filter((o) => o.type !== "insert").map((o) => o.a);
  const engineB = ops.filter((o) => o.type !== "delete").map((o) => o.b);
  if (JSON.stringify(engineA) !== JSON.stringify(ta)) return "tokenization of A differs";
  if (JSON.stringify(engineB) !== JSON.stringify(tb)) return "tokenization of B differs";
  const equals = ops.filter((o) => o.type === "equal");
  if (!equals.every((o) => eq(o.a, o.b))) return "equal op joins unequal tokens";
  const lcs = oracleLcsLength(ta, tb, eq);
  return equals.length === lcs ? true : `equal=${equals.length} lcs=${lcs}`;
}

function deleteAllInsertAll(a, b, mode) {
  return [
    ...tokenizeText(a, mode).map((t) => ({ type: "delete", a: t })),
    ...tokenizeText(b, mode).map((t) => ({ type: "insert", b: t })),
  ];
}

describe("text diff properties", () => {
  for (const mode of MODES) {
    it(`(a) ${mode}: edit script reconstructs A and B`, () => {
      const { failures } = runProperty(`a/${mode}`, (a, b) => {
        const forward = computeTextDiff(a, b, { mode }).ops;
        const backward = computeTextDiff(b, a, { mode }).ops;
        return reconstructs(a, b, forward) && reconstructs(b, a, backward);
      });
      expect(failures).toEqual([]);
    });

    it(`(b) ${mode}: equal-token count equals the O(n*m) LCS length`, () => {
      const { failures } = runProperty(`b/${mode}`, (a, b) =>
        isMinimal(a, b, computeTextDiff(a, b, { mode }).ops, mode),
      );
      expect(failures).toEqual([]);
    });

    it(`(b) ${mode}: minimal under ignoreCase against a lower-casing oracle`, () => {
      const { failures } = runProperty(`b-case/${mode}`, (a, b) =>
        isMinimal(
          a,
          b,
          computeTextDiff(a, b, { mode, ignoreCase: true }).ops,
          mode,
          (x, y) => x.toLowerCase() === y.toLowerCase(),
        ),
      );
      expect(failures).toEqual([]);
    });
  }

  it("(b) calibration: a delete-all/insert-all script fails minimality", () => {
    let caught = 0;
    for (const mode of MODES) {
      const { tally } = runProperty(`b-calibration/${mode}`, (a, b) =>
        isMinimal(a, b, deleteAllInsertAll(a, b, mode), mode),
      );
      caught += tally.failing;
    }
    expect(caught).toBeGreaterThan(0);
  });

  it("(c) unified diff applied by an independent patcher yields B", () => {
    const { failures } = runProperty("c", (a, b) => {
      const patch = createUnifiedDiff(a, b);
      if (a === b) return patch === "";
      let patched;
      try {
        patched = applyUnifiedPatch(a, patch);
      } catch (error) {
        return error.message;
      }
      if (patched !== b) return "patched text differs";
      const ctx = checkContextWidth(a, patch);
      return ctx;
    });
    expect(failures).toEqual([]);
  });

  it("(d) case- and whitespace-only differences produce no changes", () => {
    const { failures } = runProperty("d", (a, _b, rand) => {
      const b = perturbCaseAndWhitespace(a, rand);
      for (const mode of MODES) {
        const opts = { mode, ignoreCase: true, ignoreWhitespace: true };
        const { ops, stats } = computeTextDiff(a, b, opts);
        if (ops.some((o) => o.type !== "equal")) return `${mode}: has changes`;
        if (stats.added || stats.removed) return `${mode}: stats count changes`;
        if (!reconstructs(a, b, ops)) return `${mode}: does not reconstruct`;
      }
      return createUnifiedDiff(a, b, { ignoreCase: true, ignoreWhitespace: true }) === ""
        ? true
        : "unified diff not empty";
    });
    expect(failures).toEqual([]);
  });
});

function checkContextWidth(a, patch) {
  const totalA = oracleTokens(a, "line").length;
  const hunks = patch.split(/^(?=@@ )/m).slice(1);
  for (const hunk of hunks) {
    const [header, ...body] = hunk.split("\n").filter((l) => l !== "" && l[0] !== "\\");
    const m = /^@@ -(\d+)(?:,(\d+))?/.exec(header);
    const aCount = m[2] === undefined ? 1 : Number(m[2]);
    const firstA = aCount === 0 ? Number(m[1]) : Number(m[1]) - 1;
    const kinds = body.map((l) => l[0]);
    const lead = kinds.findIndex((k) => k !== " ");
    const trail = kinds.length - 1 - kinds.map((k) => k !== " ").lastIndexOf(true);
    if (lead > 3 || trail > 3) return "too much context";
    if (lead < 3 && firstA !== 0) return "too little leading context";
    if (trail < 3 && firstA + aCount !== totalA) return "too little trailing context";
  }
  return true;
}

function perturbCaseAndWhitespace(text, rand) {
  const runs = text.match(/[ \t\n]+|[^ \t\n]+/g) || [];
  return runs
    .map((run, i) => {
      if (/^[ \t\n]+$/.test(run)) {
        if (run.includes("\n")) {
          const nl = run.split("\n").length - 1;
          const isLast = i === runs.length - 1;
          const keepsFinalLine = isLast && !run.endsWith("\n");
          const trailing = keepsFinalLine || (!isLast && rand() < 0.5) ? "  " : "";
          return (rand() < 0.5 ? "\t " : "") + "\n".repeat(nl) + trailing;
        }
        return [" ", "\t", "   ", " \t"][Math.floor(rand() * 4)];
      }
      return [...run].map((ch) => (rand() < 0.5 ? ch.toUpperCase() : ch.toLowerCase())).join("");
    })
    .join("");
}

describe("text diff examples", () => {
  it("formats a GNU-style unified hunk", () => {
    expect(createUnifiedDiff("a\nb\nc\n", "a\nB\nc\n")).toBe(
      "--- original.txt\n+++ modified.txt\n@@ -1,3 +1,3 @@\n a\n-b\n+B\n c\n",
    );
  });

  it("uses start 0 and count 0 for an empty original", () => {
    expect(createUnifiedDiff("", "x\n")).toBe(
      "--- original.txt\n+++ modified.txt\n@@ -0,0 +1 @@\n+x\n",
    );
  });

  it("marks a missing final newline", () => {
    expect(createUnifiedDiff("x", "x\n")).toBe(
      "--- original.txt\n+++ modified.txt\n@@ -1 +1 @@\n-x\n\\ No newline at end of file\n+x\n",
    );
  });

  it("splits distant changes into separate hunks", () => {
    const a = Array.from({ length: 20 }, (_, i) => `l${i}\n`).join("");
    const b = a.replace("l1\n", "L1\n").replace("l18\n", "L18\n");
    const patch = createUnifiedDiff(a, b);
    expect(patch.match(/^@@ .* @@$/gm)).toEqual(["@@ -1,5 +1,5 @@", "@@ -16,5 +16,5 @@"]);
  });

  it("counts stats per mode unit (word mode skips whitespace)", () => {
    expect(computeTextDiff("one two three", "one 2 three", { mode: "word" }).stats).toEqual({
      added: 1,
      removed: 1,
      unchanged: 2,
    });
  });

  it("ignoreWhitespace in line mode removes all whitespace from the key", () => {
    expect(diffTokenKey("  a \tb\n", "line", { ignoreWhitespace: true })).toBe("ab");
  });

  it("handles 5,000-line inputs with many changes", () => {
    const rand = mulberry32(SEED);
    const a = Array.from({ length: 5000 }, () => `line ${Math.floor(rand() * 50)}\n`).join("");
    const b = Array.from({ length: 5000 }, () => `line ${Math.floor(rand() * 50)}\n`).join("");
    const { ops } = computeTextDiff(a, b, { mode: "line" });
    expect(reconstructs(a, b, ops)).toBe(true);
  });

  it("a work budget keeps a valid script and reports it as inexact", () => {
    const rand = mulberry32(SEED);
    const words = () => Array.from({ length: 4000 }, () => ["the", "a", "model", "\n"][Math.floor(rand() * 4)]).join(" ");
    const a = words();
    const b = words();
    const result = computeTextDiff(a, b, { mode: "word", maxCost: 100000 });
    expect(result.exact).toBe(false);
    expect(reconstructs(a, b, result.ops)).toBe(true);
    expect(applyUnifiedPatch(a, createUnifiedDiff(a, b, { maxCost: 1000 }))).toBe(b);
    expect(computeTextDiff("a b", "a c", { mode: "word" }).exact).toBe(true);
  });

  it("myersMatchPairs returns strictly increasing matches", () => {
    const { pairs, exact } = myersMatchPairs([1, 2, 3, 2, 1], [3, 2, 1, 2]);
    expect(exact).toBe(true);
    expect(pairs.length).toBe(3);
    for (let k = 1; k < pairs.length; k++) {
      expect(pairs[k][0]).toBeGreaterThan(pairs[k - 1][0]);
      expect(pairs[k][1]).toBeGreaterThan(pairs[k - 1][1]);
    }
  });
});
