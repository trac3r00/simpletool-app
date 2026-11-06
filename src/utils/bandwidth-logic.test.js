import { describe, expect, it } from "vitest";
import {
  calculateTransferTime,
  toBitsPerSecond,
  toBytes,
} from "./bandwidth-logic.js";

const PROPERTY_SEED = 0x5eed1234;
const PROPERTY_CASES = 1000;

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe("bandwidth calculations", () => {
  it("matches the independent transfer-time equation for seeded random inputs", () => {
    const random = createRandom(PROPERTY_SEED);
    let attempted = 0;
    let executed = 0;
    let discarded = 0;
    let failing = 0;

    for (let index = 0; index < PROPERTY_CASES; index++) {
      attempted++;
      const bytes = 1 + random() * 1e15;
      const bitsPerSecond = 1 + random() * 1e12;
      const actual = calculateTransferTime(bytes, bitsPerSecond);
      if (actual === null) {
        discarded++;
        continue;
      }
      executed++;

      const expected = (bytes * 8) / bitsPerSecond;
      if (Math.abs((actual * bitsPerSecond - bytes * 8) / (bytes * 8)) > 1e-9) {
        failing++;
      }
      expect(actual).toBeCloseTo(expected, 10);
    }

    expect({ attempted, executed, discarded, failing }).toEqual({
      attempted: PROPERTY_CASES,
      executed: PROPERTY_CASES,
      discarded: 0,
      failing: 0,
    });
  });

  it("never increases transfer time when bandwidth increases", () => {
    const random = createRandom(PROPERTY_SEED ^ 0x9e3779b9);
    let attempted = 0;
    let executed = 0;
    let discarded = 0;
    let failing = 0;

    for (let index = 0; index < PROPERTY_CASES; index++) {
      attempted++;
      const bytes = 1 + random() * 1e15;
      const lowerSpeed = 1 + random() * 1e12;
      const higherSpeed = lowerSpeed * (1 + random() * 10);
      const slower = calculateTransferTime(bytes, lowerSpeed);
      const faster = calculateTransferTime(bytes, higherSpeed);
      if (slower === null || faster === null) {
        discarded++;
        continue;
      }
      executed++;
      if (faster > slower) failing++;
      expect(faster).toBeLessThanOrEqual(slower);
    }

    expect({ attempted, executed, discarded, failing }).toEqual({
      attempted: PROPERTY_CASES,
      executed: PROPERTY_CASES,
      discarded: 0,
      failing: 0,
    });
  });

  it("converts decimal and binary units using their specified factors", () => {
    expect(toBytes(1, "MB")).toBe(1_000_000);
    expect(toBytes(1, "GB")).toBe(1_000_000_000);
    expect(toBytes(1, "GB", true)).toBe(1_073_741_824);
    expect(toBytes(1, "GiB")).toBe(1_073_741_824);
    expect(toBitsPerSecond(1, "Mbps")).toBe(1_000_000);
    expect(toBitsPerSecond(1, "Gbps")).toBe(1_000_000_000);
  });

  it.each([
    ["zero size", 0, 1e6],
    ["negative size", -1, 1e6],
    ["NaN size", NaN, 1e6],
    ["empty size", "", 1e6],
    ["zero speed", 1e6, 0],
    ["negative speed", 1e6, -1],
    ["NaN speed", 1e6, NaN],
    ["empty speed", 1e6, ""],
  ])("returns null for %s", (_caseName, bytes, speed) => {
    expect(calculateTransferTime(bytes, speed)).toBeNull();
  });

  it("returns null when conversion inputs are invalid", () => {
    expect(toBytes(0, "MB")).toBeNull();
    expect(toBytes(-1, "MB")).toBeNull();
    expect(toBytes(NaN, "MB")).toBeNull();
    expect(toBytes(1, "unknown")).toBeNull();
    expect(toBitsPerSecond(0, "Mbps")).toBeNull();
    expect(toBitsPerSecond(-1, "Mbps")).toBeNull();
    expect(toBitsPerSecond(NaN, "Mbps")).toBeNull();
    expect(toBitsPerSecond(1, "unknown")).toBeNull();
    expect(toBytes("", "MB")).toBeNull();
    expect(toBitsPerSecond("", "Mbps")).toBeNull();
  });

  it("applies protocol efficiency as the usable share of link speed", () => {
    expect(calculateTransferTime(1_000_000, 8_000_000, 50)).toBe(2);
    expect(calculateTransferTime(1_000_000, 8_000_000, 0)).toBeNull();
    expect(calculateTransferTime(1_000_000, 8_000_000, 101)).toBeNull();
  });

  it("detects the omitted byte-to-bit factor in the calibration mutant", () => {
    const bytes = 12_345_678;
    const bitsPerSecond = 9_876_543;
    const actual = calculateTransferTime(bytes, bitsPerSecond);
    const deliberatelyWrong = bytes / bitsPerSecond;
    const relativeError = Math.abs(
      (deliberatelyWrong * bitsPerSecond - bytes * 8) / (bytes * 8),
    );

    expect(actual).toBe((bytes * 8) / bitsPerSecond);
    expect(relativeError).toBeGreaterThan(1e-9);
    expect(() => {
      expect(deliberatelyWrong).toBeCloseTo((bytes * 8) / bitsPerSecond, 10);
    }).toThrow();
  });
});
