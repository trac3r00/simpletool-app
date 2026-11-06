import { describe, expect, it } from "vitest";
import { contrastRatio, normalizeHex, scanWarning } from "./qr-code-logic.js";

describe("qr-code-logic", () => {
  it.each([
    ["#000000", "#000000"],
    ["FFF", "#ffffff"],
    ["  #1A2b3C ", "#1a2b3c"],
    ["#12", null],
    ["red", null],
    ["#12345g", null],
    ["", null],
  ])("normalizes %j to %s", (input, out) => {
    expect(normalizeHex(input)).toBe(out);
  });

  it("matches WCAG reference contrast ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    // #767676 on white is the WebAIM-published 4.54:1 grey.
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  it("warns about inverted or low-contrast colours only", () => {
    expect(scanWarning("#000000", "#ffffff")).toBeNull();
    expect(scanWarning("#ffffff", "#000000")).toMatch(/lighter than the background/);
    expect(scanWarning("#999999", "#ffffff")).toMatch(/^Low contrast \(2\.8:1\)/);
  });
});
