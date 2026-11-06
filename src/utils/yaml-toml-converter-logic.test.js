// @vitest-environment node
import { describe, expect, it } from "vitest";
import toml from "toml";
import { detectConfigFormat, toToml } from "./yaml-toml-converter-logic.js";

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KEYS = ["name", "my key", "a.b", "ünï", "x-y_z", "", "1", "quote\"d"];
const STRINGS = ["", "plain", "line\nbreak", "tab\t", "quote\" and \\", "é 😀", "\x7f", "# not a comment"];

function randomScalar(rand) {
  const pick = Math.floor(rand() * 4);
  if (pick === 0) return STRINGS[Math.floor(rand() * STRINGS.length)];
  if (pick === 1) return Math.floor(rand() * 2000) - 1000;
  if (pick === 2) return rand() < 0.5;
  return Math.round(rand() * 1e4) / 100 + 0.5;
}

function randomTable(rand, depth) {
  const obj = {};
  const n = Math.floor(rand() * 4) + (depth === 0 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const key = KEYS[Math.floor(rand() * KEYS.length)] + (rand() < 0.5 ? String(i) : "");
    const r = rand();
    if (depth < 3 && r < 0.2) obj[key] = randomTable(rand, depth + 1);
    else if (depth < 3 && r < 0.35) obj[key] = Array.from({ length: 1 + Math.floor(rand() * 3) }, () => randomTable(rand, depth + 1));
    else if (r < 0.5) {
      // Single-type arrays only: TOML before 1.0 forbade mixed arrays, so this stays valid for any oracle version.
      const sample = randomScalar(rand);
      obj[key] = Array.from({ length: Math.floor(rand() * 4) }, () => {
        let v = randomScalar(rand);
        while (typeof v !== typeof sample || Number.isInteger(v) !== Number.isInteger(sample)) v = randomScalar(rand);
        return v;
      });
    } else obj[key] = randomScalar(rand);
  }
  return obj;
}

describe("toToml", () => {
  it("round-trips seeded random tables through an independent TOML parser", () => {
    const rand = mulberry32(1);
    for (let run = 0; run < 400; run++) {
      const data = randomTable(rand, 0);
      const text = toToml(data);
      expect(toml.parse(text), text).toEqual(data);
    }
  });

  it("nests sub-tables of array items under the array path", () => {
    const data = { servers: [{ name: "a", meta: { x: 1 } }, { name: "b", meta: { x: 2 } }] };
    const text = toToml(data);
    expect(text).toContain("[servers.meta]");
    expect(toml.parse(text)).toEqual(data);
  });

  it("writes nested arrays inline instead of as tables", () => {
    expect(toToml({ d: [[1, 2], [3]] })).toBe("d = [[1, 2], [3]]\n");
  });

  it("writes dates as offset date-times and lists omitted nulls", () => {
    const text = toToml({ when: new Date("2024-01-01T00:00:00Z"), n: null, list: [1, null] });
    expect(text).toBe("# TOML has no null; omitted: n, list.1\n\nwhen = 2024-01-01T00:00:00.000Z\nlist = [1]\n");
    expect(toml.parse(text).when.toISOString()).toBe("2024-01-01T00:00:00.000Z");
  });

  it("refuses a non-table root", () => {
    expect(() => toToml([1, 2])).toThrow(/top level/);
    expect(() => toToml("text")).toThrow(/top level/);
  });
});

describe("detectConfigFormat", () => {
  it.each([
    ['{"a": 1}', "json"],
    ["[1, 2]", "json"],
    ["[1, 2", "json"],
    ['[package]\nname = "demo"', "toml"],
    ["[[bin]]\nname = 'x'", "toml"],
    ['url = "http://x.com"\nport = 80', "toml"],
    ['# comment\n\ntitle = "x"', "toml"],
    ['"quoted key".sub = 1', "toml"],
    ["name: x\nport: 80", "yaml"],
    ["- a\n- b", "yaml"],
    ["---\na: 1", "yaml"],
    ["a: b=c", "yaml"],
    ["", "unknown"],
  ])("%j -> %s", (src, expected) => {
    expect(detectConfigFormat(src)).toBe(expected);
  });
});
