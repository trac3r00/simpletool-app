import { describe, expect, it } from "vitest";
import { UNIT_CATEGORIES, convertUnit, formatUnitResult } from "./unit-converter-logic.js";

const conv = (cat, v, from, to) => convertUnit(UNIT_CATEGORIES, cat, v, from, to);

// Oracle: exact definitions from NIST SP 811 (2008) appendix B and the SI Brochure.
describe("convertUnit against NIST/SI definitions", () => {
  it.each([
    ["weight", 1, "lb", "kg", 0.45359237],
    ["weight", 1, "oz", "g", 28.349523125],
    ["weight", 1, "st", "lb", 14],
    ["volume", 1, "gal", "l", 3.785411784],
    ["volume", 1, "gal", "floz", 128],
    ["volume", 1, "cup", "tbsp", 16],
    ["volume", 1, "tbsp", "tsp", 3],
    ["area", 1, "acre", "ft2", 43560],
    ["area", 1, "mi2", "acre", 640],
    ["speed", 100, "kmh", "ms", 27.7777777778],
    ["speed", 1, "kn", "kmh", 1.852],
    ["pressure", 1, "psi", "Pa", 6894.75729317],
    ["pressure", 1, "mmHg", "Pa", 133.322387415],
    ["pressure", 1, "atm", "kPa", 101.325],
    ["energy", 1, "kWh", "J", 3600000],
    ["energy", 1, "eV", "J", 1.602176634e-19],
    ["data", 1, "KiB", "B", 1024],
    ["data", 1, "KB", "B", 1000],
    ["data", 1, "GiB", "MB", 1073.741824],
    ["data", 1, "B", "bit", 8],
    ["length", 1, "nmi", "m", 1852],
    ["length", 1, "mi", "ft", 5280],
    ["time", 1, "year", "day", 365.2425],
  ])("%s: %d %s -> %s = %d", (cat, v, from, to, expected) => {
    expect(Number(formatUnitResult(conv(cat, v, from, to)))).toBeCloseTo(expected, 9);
  });

  it("converts temperature on the affine scale", () => {
    expect(conv("temperature", 100, "c", "f")).toBeCloseTo(212, 12);
    expect(conv("temperature", -40, "f", "c")).toBeCloseTo(-40, 12);
    expect(conv("temperature", 0, "k", "f")).toBeCloseTo(-459.67, 12);
    expect(conv("temperature", 25, "c", "k")).toBeCloseTo(298.15, 12);
  });

  it("refuses temperatures below absolute zero and non-finite input", () => {
    expect(conv("temperature", -5, "k", "c")).toBeNull();
    expect(conv("temperature", -274, "c", "k")).toBeNull();
    expect(conv("temperature", -460, "f", "f")).toBeNull();
    expect(conv("temperature", -273.15, "c", "k")).toBeCloseTo(0, 9);
    expect(conv("length", NaN, "m", "ft")).toBeNull();
    expect(conv("length", Infinity, "m", "ft")).toBeNull();
    expect(conv("length", 1, "m", "parsec")).toBeNull();
  });
});

describe("round trips (seeded property)", () => {
  it("a -> b -> a returns the input to 12 significant digits for every unit pair", () => {
    let seed = 42;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (const cat of UNIT_CATEGORIES) {
      for (const [a] of cat.units) {
        for (const [b] of cat.units) {
          const v = cat.id === "temperature" ? rand() * 1000 : (rand() - 0.5) * 10 ** Math.floor(rand() * 12 - 4);
          const back = conv(cat.id, conv(cat.id, v, a, b), b, a);
          expect(Math.abs(back - v)).toBeLessThanOrEqual(Math.abs(v) * 1e-12 + 1e-12);
        }
      }
    }
  });

  it("unit ids are unique within each category", () => {
    for (const cat of UNIT_CATEGORIES) {
      const ids = cat.units.map((u) => u[0]);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("formatUnitResult", () => {
  it("trims float noise without losing significant digits", () => {
    expect(formatUnitResult(0.1 + 0.2)).toBe("0.3");
    expect(formatUnitResult(1 / 3)).toBe("0.333333333333");
    expect(formatUnitResult(1.602176634e-19)).toBe("1.602176634e-19");
    expect(formatUnitResult(-0)).toBe("0");
    expect(formatUnitResult(NaN)).toBe("");
  });
});
