import { readFileSync } from "node:fs";
import vm from "node:vm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegexWorkerClient, REGEX_TIMEOUT_MESSAGE } from "./regex-worker-client.js";
import { buildMatchRequest } from "./regex-visualizer-logic.js";
import { buildHighlightRequest, buildLineFilterRequest, buildSearchRegex } from "./log-viewer-logic.js";

const WORKER_SOURCE = readFileSync(new URL("../../scripts/vendor/regex-worker.js", import.meta.url), "utf8");

function loadWorker() {
  let reply = null;
  const self = { postMessage: (data) => { reply = data; } };
  vm.runInNewContext(WORKER_SOURCE, { self, Object, Array, String, RegExp });
  return (request) => {
    reply = null;
    self.onmessage({ data: structuredClone(request) });
    return structuredClone(reply);
  };
}

// Oracles: the main-thread matching code both pages ran before the worker, same logic.
function studioOracle(pattern, flags, text) {
  const regex = new RegExp(pattern, flags);
  const matches = [];
  let match;
  if (regex.global) {
    while ((match = regex.exec(text)) !== null) {
      matches.push(match);
      if (match.index === regex.lastIndex) regex.lastIndex++;
      if (matches.length >= 1000) break;
    }
  } else {
    match = regex.exec(text);
    if (match) matches.push(match);
  }
  return matches.map((m) => ({ index: m.index, match: m[0], groups: m.slice(1) }));
}

function lineFilterOracle(query, isRegex, lines) {
  const { regex } = buildSearchRegex(query, isRegex, 10000);
  const hits = [];
  lines.forEach((line, i) => {
    regex.lastIndex = 0;
    if (regex.test(line)) hits.push(i);
  });
  return hits;
}

function highlightOracle(query, isRegex, text) {
  const { regex } = buildSearchRegex(query, isRegex, 10000);
  const ranges = [];
  regex.lastIndex = 0;
  let match;
  let count = 0;
  while ((match = regex.exec(text)) !== null) {
    if (++count > 1000) break;
    ranges.push([match.index, match.index + match[0].length]);
    if (match[0].length === 0) regex.lastIndex++;
  }
  return ranges;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ATOMS = ["a", "b", "A", ".", "\\d", "\\w", "\\s", "[ab]", "[^a]", "^", "$", "\\b", "(a)", "(?<n>b)", "(a|b)", "(x)?", "()", "\\n", "😀"];
const QUANTS = ["", "", "", "*", "+", "?", "{2}", "{1,3}", "*?"];

function randomPattern(rand) {
  const parts = [];
  const n = 1 + Math.floor(rand() * 4);
  for (let i = 0; i < n; i++) {
    parts.push(ATOMS[Math.floor(rand() * ATOMS.length)] + QUANTS[Math.floor(rand() * QUANTS.length)]);
  }
  return parts.join(rand() < 0.15 ? "|" : "");
}

function randomText(rand, maxLen) {
  const chars = "aabbAB1 \n_x😀";
  let out = "";
  const len = Math.floor(rand() * maxLen);
  for (let i = 0; i < len; i++) out += [...chars][Math.floor(rand() * [...chars].length)];
  return out;
}

function randomFlags(rand) {
  return ["g", "i", "m", "s", "u"].filter(() => rand() < 0.5).join("");
}

function workerMatches(reply) {
  return reply.matches.map((m) => ({ index: m.index, match: m.match, groups: m.groups }));
}

describe("regex worker matches the old main-thread results", () => {
  const runWorker = loadWorker();

  it("regex studio: seeded patterns, flags and texts", () => {
    const rand = mulberry32(20261106);
    let compared = 0;
    for (let i = 0; i < 3000; i++) {
      const pattern = randomPattern(rand);
      const flags = randomFlags(rand);
      const text = randomText(rand, 40);
      let expected;
      try {
        expected = studioOracle(pattern, flags, text);
      } catch {
        expect(runWorker({ id: i, ...buildMatchRequest(pattern, flags, text) }).ok).toBe(false);
        continue;
      }
      const reply = runWorker({ id: i, ...buildMatchRequest(pattern, flags, text) });
      expect(reply.ok, pattern + " /" + flags).toBe(true);
      expect(workerMatches(reply), JSON.stringify({ pattern, flags, text })).toEqual(expected);
      compared++;
    }
    expect(compared).toBeGreaterThan(2000);
  });

  it("regex studio keeps the 1000-match cap", () => {
    const text = "a".repeat(1500);
    const reply = runWorker({ id: 1, ...buildMatchRequest("a", "g", text) });
    expect(reply.matches).toHaveLength(1000);
    expect(reply.capped).toBe(true);
    expect(workerMatches(reply)).toEqual(studioOracle("a", "g", text));
  });

  it("a wrong request mapping is caught by the oracle (calibration)", () => {
    const rand = mulberry32(7);
    let mismatches = 0;
    for (let i = 0; i < 500; i++) {
      const pattern = randomPattern(rand);
      const flags = randomFlags(rand).replace("g", "");
      const text = randomText(rand, 30);
      let expected;
      try { expected = studioOracle(pattern, flags, text); } catch { continue; }
      const wrong = { ...buildMatchRequest(pattern, flags, text), maxMatches: 1000 };
      const got = workerMatches(runWorker({ id: i, ...wrong }));
      if (JSON.stringify(got) !== JSON.stringify(expected)) mismatches++;
    }
    expect(mismatches).toBeGreaterThan(0);
  });

  it("log viewer: line filtering and row highlights", () => {
    const rand = mulberry32(42);
    for (let i = 0; i < 1500; i++) {
      const isRegex = rand() < 0.7;
      const query = isRegex ? randomPattern(rand) : randomText(rand, 4) || "a";
      if (buildSearchRegex(query, isRegex, 10000).error) continue;
      const lines = Array.from({ length: 1 + Math.floor(rand() * 8) }, () => randomText(rand, 25).replace(/\n/g, " "));
      const filtered = runWorker({ id: i, ...buildLineFilterRequest(query, isRegex, lines) });
      expect(filtered.lineIndexes, JSON.stringify({ query, lines })).toEqual(lineFilterOracle(query, isRegex, lines));
      const line = lines[0];
      const lit = runWorker({ id: i, ...buildHighlightRequest(query, isRegex, line, 1000) });
      const ranges = lit.matches.map((m) => [m.index, m.index + m.match.length]);
      expect(ranges, JSON.stringify({ query, line })).toEqual(highlightOracle(query, isRegex, line));
    }
  });
});

describe("regex worker client deadline", () => {
  let instances;
  let runWorker;

  class FakeWorker {
    constructor(url) {
      this.url = url;
      this.terminated = false;
      this.hang = FakeWorker.hangNext;
      instances.push(this);
    }
    postMessage(request) {
      if (this.hang) return;
      const reply = runWorker(request);
      queueMicrotask(() => { if (!this.terminated) this.onmessage({ data: reply }); });
    }
    terminate() { this.terminated = true; }
  }

  beforeEach(() => {
    instances = [];
    runWorker = loadWorker();
    FakeWorker.hangNext = false;
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("returns worker matches", async () => {
    const client = createRegexWorkerClient({ Worker: FakeWorker });
    const outcome = await client.run(buildMatchRequest("b+", "g", "abba b"));
    expect(outcome.status).toBe("ok");
    expect(outcome.result.matches.map((m) => m.match)).toEqual(["bb", "b"]);
    expect(instances[0].url).toBe("/vendor/regex-worker.js");
  });

  it("terminates a late worker at the deadline and recreates it on the next run", async () => {
    const client = createRegexWorkerClient({ Worker: FakeWorker, timeoutMs: 1500 });
    FakeWorker.hangNext = true;
    const pending = client.run(buildMatchRequest("(a+)+$", "g", "a".repeat(30) + "!"));
    await vi.advanceTimersByTimeAsync(1499);
    expect(instances[0].terminated).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toEqual({ status: "timeout" });
    expect(instances[0].terminated).toBe(true);

    FakeWorker.hangNext = false;
    const next = await client.run(buildMatchRequest("a", "g", "aa"));
    expect(next.status).toBe("ok");
    expect(instances).toHaveLength(2);
  });

  it("a newer run supersedes a busy one without waiting for its deadline", async () => {
    const client = createRegexWorkerClient({ Worker: FakeWorker });
    FakeWorker.hangNext = true;
    const stale = client.run(buildMatchRequest("(a+)+$", "g", "a".repeat(30) + "!"));
    FakeWorker.hangNext = false;
    const fresh = client.run(buildMatchRequest("a", "g", "a"));
    expect(await stale).toEqual({ status: "cancelled" });
    expect((await fresh).status).toBe("ok");
    expect(instances[0].terminated).toBe(true);
  });

  it("reports pattern errors from the worker", async () => {
    const client = createRegexWorkerClient({ Worker: FakeWorker });
    const outcome = await client.run(buildMatchRequest("(", "g", "a"));
    expect(outcome.status).toBe("error");
  });

  it("batches resolve together in request order", async () => {
    const client = createRegexWorkerClient({ Worker: FakeWorker });
    const outcome = await client.runBatch([
      buildHighlightRequest("a", true, "aXa", 1000),
      buildHighlightRequest("a", true, "b", 1000),
    ]);
    expect(outcome.results.map((r) => r.matches.length)).toEqual([2, 0]);
  });

  it("exposes the in-page timeout copy", () => {
    expect(REGEX_TIMEOUT_MESSAGE).toMatch(/catastrophic backtracking/);
  });
});
