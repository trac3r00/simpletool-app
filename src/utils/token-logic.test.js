import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import * as npmO200k from "gpt-tokenizer/encoding/o200k_base";
import * as npmCl100k from "gpt-tokenizer/encoding/cl100k_base";
import { computeSriSha384 } from "./vendor-sri.js";
import {
  TOKENIZER_BUNDLES,
  TOKEN_MODELS,
  contextUsage,
  escapeHtml,
  segmentTokens,
  renderTokenSpans,
} from "./token-logic.js";

// Replay: TOKEN_SEED=<n> npx vitest run src/utils/token-logic.test.js
const SEED = Number(process.env.TOKEN_SEED || 20261106);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ENCODE_OPTS = { disallowedSpecial: new Set() };
const NPM = { o200k_base: npmO200k, cl100k_base: npmCl100k };

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RANGES = [
  [0x20, 0x7e],
  [0x20, 0x7e],
  [0x0a, 0x0a],
  [0x00a0, 0x024f],
  [0x0400, 0x04ff],
  [0x0600, 0x06ff],
  [0x0e00, 0x0e7f],
  [0x3040, 0x30ff],
  [0x4e00, 0x9fff],
  [0xac00, 0xd7a3],
  [0xfffd, 0xfffd],
  [0x1f300, 0x1faff],
  [0x10000, 0x10ffff],
];
const FRAGMENTS = ["<|endoftext|>", "<|im_start|>", "  ", "\t", "\r\n", "&<>\"'", "e\u0301", "👩‍👩‍👧"];

function randomText(rand, maxLen = 40) {
  const len = Math.floor(rand() * maxLen);
  let s = "";
  for (let i = 0; i < len; i++) {
    if (rand() < 0.08) {
      s += FRAGMENTS[Math.floor(rand() * FRAGMENTS.length)];
      continue;
    }
    const [lo, hi] = RANGES[Math.floor(rand() * RANGES.length)];
    s += String.fromCodePoint(lo + Math.floor(rand() * (hi - lo + 1)));
  }
  return s;
}

function loadVendored(enc) {
  const ctx = { TextEncoder, TextDecoder };
  vm.createContext(ctx);
  const file = join(ROOT, "dist", "vendor", `gpt-tokenizer-${enc}.min.js`);
  vm.runInContext(readFileSync(file, "utf8"), ctx);
  return ctx[TOKENIZER_BUNDLES[enc].global];
}

function checkSegmentation(segs, tokens, decode, input) {
  if (segs.map((s) => s.text).join("") !== input) return "concat != input";
  if (segs.some((s) => !s.exact)) return "inexact segment";
  if (segs.reduce((n, s) => n + s.tokens, 0) !== tokens.length) return "token sum mismatch";
  let i = 0;
  for (const s of segs) {
    if (decode(tokens.slice(i, i + s.tokens)) !== s.text) return "segment != decode(its tokens)";
    i += s.tokens;
  }
  return null;
}

describe("segmentTokens: decoded per-token segments reassemble the input", () => {
  for (const enc of Object.keys(NPM)) {
    it(`${enc}: 300 random unicode strings (seed ${SEED})`, () => {
      const rand = mulberry32(SEED);
      const { encode, decode } = NPM[enc];
      const failures = [];
      for (let n = 0; n < 300; n++) {
        const input = randomText(rand);
        const tokens = encode(input, ENCODE_OPTS);
        const why = checkSegmentation(segmentTokens(tokens, decode, input), tokens, decode, input);
        if (why) failures.push({ n, input, why });
      }
      expect(failures).toEqual([]);
    });
  }

  it("a token list cut mid-text yields an exact prefix plus at most one inexact tail", () => {
    const rand = mulberry32(SEED + 1);
    const { encode, decode } = npmO200k;
    for (let n = 0; n < 200; n++) {
      const input = randomText(rand, 60);
      const tokens = encode(input, ENCODE_OPTS);
      const cut = tokens.slice(0, Math.floor(rand() * (tokens.length + 1)));
      const segs = segmentTokens(cut, decode, input);
      const exact = segs.filter((s) => s.exact);
      expect(input.startsWith(exact.map((s) => s.text).join(""))).toBe(true);
      expect(segs.filter((s) => !s.exact).length).toBeLessThanOrEqual(1);
      expect(segs.reduce((k, s) => k + s.tokens, 0)).toBe(cut.length);
    }
  });

  it("calibration: per-token decode without grouping violates the property", () => {
    const naive = (tokens, decode) => tokens.map((t) => ({ text: decode([t]), tokens: 1, exact: true }));
    const rand = mulberry32(SEED);
    const { encode, decode } = npmO200k;
    let failing = 0;
    for (let n = 0; n < 300; n++) {
      const input = randomText(rand);
      const tokens = encode(input, ENCODE_OPTS);
      if (checkSegmentation(naive(tokens, decode), tokens, decode, input)) failing++;
    }
    expect(failing).toBeGreaterThan(0);
  });
});

// Vendored bundles are built from the same npm package, so this only proves the
// bundle was not corrupted or mismatched; it is not an independent check of
// tokenizer correctness against OpenAI. The known vectors below are that check.
describe("vendored bundles", () => {
  const vendored = {};
  beforeAll(() => {
    for (const enc of Object.keys(NPM)) vendored[enc] = loadVendored(enc);
  });

  for (const enc of Object.keys(NPM)) {
    it(`${enc}: SRI constant matches dist/vendor bytes`, () => {
      const file = join(ROOT, "dist", "vendor", `gpt-tokenizer-${enc}.min.js`);
      expect(TOKENIZER_BUNDLES[enc].integrity).toBe(computeSriSha384(file));
      expect(TOKENIZER_BUNDLES[enc].src).toBe(`/vendor/gpt-tokenizer-${enc}.min.js`);
    });

    it(`${enc}: vendored token count equals npm count on 200 random strings`, () => {
      const rand = mulberry32(SEED + 2);
      for (let n = 0; n < 200; n++) {
        const input = randomText(rand, 80);
        expect(vendored[enc].encode(input, ENCODE_OPTS).length).toBe(
          NPM[enc].encode(input, ENCODE_OPTS).length,
        );
      }
    });
  }

  // Published tiktoken reference ids (tiktoken README / OpenAI cookbook).
  const KNOWN = {
    o200k_base: { "hello world": [24912, 2375], "tiktoken is great!": [83, 8251, 2488, 382, 2212, 0] },
    cl100k_base: { "hello world": [15339, 1917], "tiktoken is great!": [83, 1609, 5963, 374, 2294, 0] },
  };
  for (const [enc, vectors] of Object.entries(KNOWN)) {
    for (const [text, ids] of Object.entries(vectors)) {
      it(`${enc}: ${JSON.stringify(text)} encodes to the reference ids`, () => {
        expect(NPM[enc].encode(text)).toEqual(ids);
        expect(Array.from(vendored[enc].encode(text))).toEqual(ids);
      });
    }
  }
});

describe("contextUsage", () => {
  it("returns null for a missing or invalid window", () => {
    for (const w of [0, -1, "", null, undefined, NaN, Infinity, "abc"]) {
      expect(contextUsage(10, w)).toBeNull();
    }
  });

  it("boundaries: empty, exactly full, one over", () => {
    expect(contextUsage(0, 128000)).toMatchObject({ percentLabel: "0.0%", remaining: 128000, over: false, barPercent: 0 });
    expect(contextUsage(128000, 128000)).toMatchObject({ percentLabel: "100.0%", remaining: 0, over: false, barPercent: 100 });
    expect(contextUsage(128001, 128000)).toMatchObject({ remaining: -1, over: true, barPercent: 100 });
    expect(contextUsage(1, 3).percentLabel).toBe("33.3%");
    expect(contextUsage(2, 3).percentLabel).toBe("66.7%");
    expect(contextUsage(5, "8192").window).toBe(8192);
  });

  it("matches a hand model on 500 random pairs", () => {
    const rand = mulberry32(SEED + 3);
    for (let n = 0; n < 500; n++) {
      const w = 1 + Math.floor(rand() * 2_000_000);
      const u = Math.floor(rand() * 2.5 * w);
      const r = contextUsage(u, w);
      expect(r.remaining).toBe(w - u);
      expect(r.over).toBe(u > w);
      expect(r.barPercent).toBeCloseTo(Math.min(100, (u * 100) / w), 9);
      expect(Math.abs(parseFloat(r.percentLabel) - (u * 100) / w)).toBeLessThanOrEqual(0.05 + 1e-9);
    }
  });
});

describe("renderTokenSpans", () => {
  const unescape = (s) =>
    s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

  it("escapes text and alternates span classes (200 random cases)", () => {
    const rand = mulberry32(SEED + 4);
    const { encode, decode } = npmCl100k;
    for (let n = 0; n < 200; n++) {
      const input = randomText(rand);
      const segs = segmentTokens(encode(input, ENCODE_OPTS), decode, input);
      const html = renderTokenSpans(segs);
      const spans = [...html.matchAll(/<span class="([^"]*)" title="[^"]*">([^<]*)<\/span>/g)];
      expect(spans.map((m) => m[0]).join("")).toBe(html);
      expect(spans.length).toBe(segs.length);
      expect(spans.map((m) => unescape(m[2])).join("")).toBe(input);
      spans.forEach((m, i) => expect(m[1].includes(i % 2 ? "bg-info-100" : "bg-primary-100")).toBe(true));
    }
  });

  it("escapeHtml covers the five HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });
});

describe("injection safety", () => {
  it("helpers work when re-created from fn.toString() (no closures)", () => {
    const src = [contextUsage, escapeHtml, segmentTokens, renderTokenSpans].map((f) => f.toString()).join("\n");
    const api = new Function(`${src}; return { contextUsage, escapeHtml, segmentTokens, renderTokenSpans };`)();
    const input = "héllo 世界 🎉";
    const tokens = npmO200k.encode(input);
    expect(api.segmentTokens(tokens, npmO200k.decode, input)).toEqual(segmentTokens(tokens, npmO200k.decode, input));
    expect(api.contextUsage(5, 10)).toEqual(contextUsage(5, 10));
  });

  it("every model is either exact with a bundled encoding or an estimate with a reason", () => {
    for (const m of TOKEN_MODELS) {
      if (m.encoding) expect(TOKENIZER_BUNDLES[m.encoding]).toBeDefined();
      else expect(m.reason && ["claude", "llama"].includes(m.family)).toBeTruthy();
      expect(m.contextWindow === null || Number.isInteger(m.contextWindow)).toBe(true);
    }
  });
});
