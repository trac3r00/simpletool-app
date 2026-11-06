import { describe, expect, it } from "vitest";
import {
  createUuidLogic,
  formatUUID,
  generateBatch,
  generateV1,
} from "./uuid-generator-logic.js";

const SEED = Number(process.env.UUID_PROPERTY_SEED || 0x5eed2026);

function seededFill(seed) {
  let s = seed >>> 0;
  return (bytes) => {
    for (let i = 0; i < bytes.length; i++) {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      bytes[i] = ((t ^ (t >>> 14)) >>> 0) & 0xff;
    }
  };
}

// Independent RFC 9562 field decoding (not shared with the generator).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const version = (u) => parseInt(u[14], 16);
const variantOk = (u) => "89ab".includes(u[19]);
const v7Ms = (u) => parseInt(u.replace(/-/g, "").slice(0, 12), 16);
function v1Ms(u) {
  const [low, mid, hi] = u.split("-");
  const ticks =
    (BigInt("0x" + hi) & 0xfffn) * 2n ** 48n +
    BigInt("0x" + mid) * 2n ** 32n +
    BigInt("0x" + low);
  return Number((ticks - 122192928000000000n) / 10000n);
}

describe("uuid-generator-logic", () => {
  it("matches the well-known v1 prefix for the Unix epoch", () => {
    expect(generateV1(0, seededFill(1), {})).toMatch(/^13814000-1dd2-11b2-/);
  });

  it("emits valid v4/v7/v1 fields, unique and time-ordered batches (seeded)", () => {
    const now = Date.UTC(2026, 10, 6, 12, 0, 0, 123);
    for (let round = 0; round < 10; round++) {
      const fill = seededFill(SEED + round);
      for (const v of ["v4", "v7", "v1"]) {
        const label = `seed ${SEED + round} ${v}`;
        const batch = generateBatch(v, 500, "hyphenated", now, fill);
        expect(new Set(batch).size, label).toBe(500);
        const bad = batch.filter(
          (u) => !UUID_RE.test(u) || version(u) !== Number(v[1]) || !variantOk(u),
        );
        expect(bad, label).toEqual([]);
        if (v === "v7") {
          expect(batch.every((u, i) => i === 0 || batch[i - 1] < u), label).toBe(true);
          expect(v7Ms(batch[0])).toBe(now);
          expect(v7Ms(batch[499]) - now).toBeLessThanOrEqual(1);
        }
        if (v === "v1") {
          expect(v1Ms(batch[0])).toBe(now);
          expect(parseInt(batch[0].slice(24, 26), 16) & 1).toBe(1);
        }
      }
    }
  });

  it("keeps v7 increasing across a 12-bit counter overflow", () => {
    const { generateV7 } = createUuidLogic();
    const fill = seededFill(SEED);
    const state = {};
    const ids = [];
    for (let i = 0; i < 6000; i++) ids.push(generateV7(1000, fill, state));
    expect(ids).toEqual([...ids].sort());
    expect(new Set(ids).size).toBe(6000);
    expect(v7Ms(ids[5999])).toBeGreaterThan(1000);
  });

  it("formats and returns NIL", () => {
    const u = "0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d";
    expect(formatUUID(u, "plain")).toBe("0a1b2c3d4e5f4a6b8c7d8e9f0a1b2c3d");
    expect(formatUUID(u, "uppercase")).toBe(u.toUpperCase());
    expect(formatUUID(u, "braces")).toBe("{" + u + "}");
    expect(generateBatch("nil", 2, "plain", 0, seededFill(1))).toEqual([
      "0".repeat(32),
      "0".repeat(32),
    ]);
  });
});
