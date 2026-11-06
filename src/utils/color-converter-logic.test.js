import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  formatColor,
  hsvToRgbExact,
  parseColor,
  rgbToHsvExact,
} from "./color-converter-logic.js";

// Oracle: Python colorsys, random.seed(20261106): 40 random RGB triples, 40 random h/s/l (and h/s/v) triples.
// Python rounds half-to-even, so channel comparisons allow 1 step.
const fixture = JSON.parse(
  readFileSync(new URL("./color-converter-logic.fixture.json", import.meta.url), "utf8"),
);

const near = (actual, expected) =>
  actual.forEach((v, i) => expect(Math.abs(v - expected[i])).toBeLessThanOrEqual(1));

describe("parseColor", () => {
  it("keeps hex input exact (regression: #FF5733 used to display as #FF5833)", () => {
    for (const { hex, rgb } of fixture.hex) {
      const c = parseColor(hex);
      expect([c.r, c.g, c.b]).toEqual(rgb);
      expect(formatColor(c).hex).toBe(hex.toUpperCase());
    }
    expect(formatColor(parseColor("#FF5733")).hex).toBe("#FF5733");
  });

  it("matches colorsys for hsl() and hsv() input", () => {
    for (const { in: [h, s, l], rgb } of fixture.hsl) {
      const c = parseColor("hsl(" + h + ", " + s + "%, " + l + "%)");
      near([c.r, c.g, c.b], rgb);
    }
    for (const { in: [h, s, v], rgb } of fixture.hsv) {
      const c = parseColor("hsv(" + h + " " + s + "% " + v + "%)");
      near([c.r, c.g, c.b], rgb);
    }
  });

  it("accepts short hex, alpha hex, modern and legacy syntaxes", () => {
    expect(parseColor("#f00")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(parseColor("f00a").a).toBeCloseTo(0.667, 3);
    expect(parseColor("#ff000080").a).toBeCloseTo(0.502, 3);
    expect(parseColor("rgb(255 87 51)")).toEqual({ r: 255, g: 87, b: 51, a: 1 });
    expect(parseColor("rgba(255, 87, 51, 0.5)").a).toBe(0.5);
    expect(parseColor("rgb(255 87 51 / 50%)").a).toBe(0.5);
    expect(parseColor("rgb(100%, 0%, 50%)")).toEqual({ r: 255, g: 0, b: 128, a: 1 });
    expect(parseColor("rgb(10.4, 20.6, 30)")).toEqual({ r: 10, g: 21, b: 30, a: 1 });
    expect(parseColor("hsl(0.5turn 100% 50%)")).toEqual({ r: 0, g: 255, b: 255, a: 1 });
    expect(parseColor("hsl(-120, 100%, 50%)")).toEqual({ r: 0, g: 0, b: 255, a: 1 });
    expect(parseColor("HSL(14,100%,60%)")).toEqual({ r: 255, g: 99, b: 51, a: 1 });
  });

  it("rejects malformed and out-of-range input instead of guessing", () => {
    for (const bad of ["", "   ", "red", "#12", "#12345", "#ggg", "rgb(300,0,0)", "rgb(-1,0,0)",
      "rgb(1,2)", "rgb(1,2,3,4,5)", "rgba(1,2,3,2)", "hsl(10, 120%, 50%)", "hsl(x, 1%, 1%)",
      "rgb(1,,3)", "rgb(1 2 3) trailing", "😀", "rgb(1/2/3)"]) {
      expect(parseColor(bad)).toBeNull();
    }
  });
});

describe("formatColor", () => {
  it("matches colorsys HSL/HSV within rounding", () => {
    for (const { rgb, hsl, hsv } of fixture.hex) {
      const out = formatColor({ r: rgb[0], g: rgb[1], b: rgb[2], a: 1 });
      const nums = (s) => s.match(/[\d.]+/g).map(Number);
      const [H, S, L] = nums(out.hsl);
      const [H2, S2, V2] = nums(out.hsv);
      near([H % 360, S, L], [Math.round(hsl[0]) % 360, Math.round(hsl[1]), Math.round(hsl[2])]);
      near([H2 % 360, S2, V2], [Math.round(hsv[0]) % 360, Math.round(hsv[1]), Math.round(hsv[2])]);
    }
  });

  it("switches to alpha forms only when alpha < 1", () => {
    expect(formatColor({ r: 255, g: 0, b: 0, a: 1 })).toEqual({
      hex: "#FF0000", rgb: "rgb(255, 0, 0)", hsl: "hsl(0, 100%, 50%)", hsv: "hsv(0, 100%, 100%)",
    });
    const half = formatColor({ r: 255, g: 0, b: 0, a: 0.5 });
    expect(half.hex).toBe("#FF000080");
    expect(half.rgb).toBe("rgba(255, 0, 0, 0.5)");
    expect(half.hsl).toBe("hsla(0, 100%, 50%, 0.5)");
  });
});

describe("HSV round-trip (seeded property)", () => {
  it("rgb -> exact hsv -> rgb is the identity for every channel", () => {
    let seed = 1106;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) % 256);
    for (let i = 0; i < 2000; i++) {
      const r = rand(), g = rand(), b = rand();
      const hsv = rgbToHsvExact(r, g, b);
      expect(hsvToRgbExact(hsv.h, hsv.s, hsv.v)).toEqual({ r, g, b });
    }
  });
});
