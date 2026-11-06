// @vitest-environment node
import { describe, expect, it } from "vitest";
import { findImpreciseNumbers, reformatJSON } from "./json-formatter-logic.js";

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomValue(rand, depth) {
  const r = rand();
  if (depth > 3 || r < 0.35) {
    const leaves = [0, -1.5, 1e21, 42, true, false, null, "", "a\"b\\c", "é 😀", "]},:[{", "\n\t"];
    return leaves[Math.floor(rand() * leaves.length)];
  }
  if (r < 0.65) {
    return Array.from({ length: Math.floor(rand() * 4) }, () => randomValue(rand, depth + 1));
  }
  const obj = {};
  const n = Math.floor(rand() * 4);
  for (let i = 0; i < n; i++) obj["k" + i + (rand() < 0.3 ? " :," : "")] = randomValue(rand, depth + 1);
  return obj;
}

function sprinkleWhitespaceBetweenTokens(json, rand) {
  let out = "";
  let inStr = false;
  for (let i = 0; i < json.length; i++) {
    const c = json[i];
    out += c;
    if (inStr) {
      if (c === "\\") out += json[++i];
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if ("{}[],:".includes(c) && rand() < 0.5) out += [" ", "\n", "\t", "\r\n  "][Math.floor(rand() * 4)];
  }
  return out;
}

describe("reformatJSON", () => {
  it("matches JSON.stringify for seeded random documents (oracle)", () => {
    const rand = mulberry32(8259);
    for (let run = 0; run < 500; run++) {
      const value = randomValue(rand, 0);
      const compact = JSON.stringify(value);
      const messy = sprinkleWhitespaceBetweenTokens(compact, rand);
      expect(reformatJSON(messy, 2)).toBe(JSON.stringify(value, null, 2));
      expect(reformatJSON(messy, 0)).toBe(compact);
    }
  });

  it("keeps number literals and duplicate keys exactly as written", () => {
    const src = '{"id": 12345678901234567890, "f": 1.0, "e": 1e5, "dup": 1, "dup": 2}';
    expect(reformatJSON(src, 0)).toBe('{"id":12345678901234567890,"f":1.0,"e":1e5,"dup":1,"dup":2}');
  });
});

describe("findImpreciseNumbers", () => {
  it("flags integers beyond 2^53 and over-long decimals only", () => {
    expect(findImpreciseNumbers('{"a": 9007199254740993, "b": 9007199254740991, "c": "12345678901234567890"}')).toEqual([
      "9007199254740993",
    ]);
    expect(findImpreciseNumbers("[0.1, 1.0, 3.141592653589793238]")).toEqual(["3.141592653589793238"]);
  });
});
