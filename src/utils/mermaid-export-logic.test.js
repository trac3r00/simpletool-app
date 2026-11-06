// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createMermaidExportLogic } from "./mermaid-export-logic.js";

const { parseViewBox, exportDimensions } = createMermaidExportLogic();

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("parseViewBox", () => {
  // Spec forms from SVG 1.1 section 7.7: whitespace and/or comma separators.
  it.each([
    ["0 0 100 50", { x: 0, y: 0, width: 100, height: 50 }],
    ["-8 -8 216.5 174", { x: -8, y: -8, width: 216.5, height: 174 }],
    ["0,0,10,20", { x: 0, y: 0, width: 10, height: 20 }],
    ["  1 , 2\t3\n4 ", { x: 1, y: 2, width: 3, height: 4 }],
    ["0 0 1e3 2.5e2", { x: 0, y: 0, width: 1000, height: 250 }],
  ])("%j", (input, expected) => {
    expect(parseViewBox(input)).toEqual(expected);
  });

  it.each([null, undefined, "", "0 0 100", "0 0 100 50 1", "0 0 0 50", "0 0 100 -1", "a b c d", "0 0 Infinity 5", "0,,0 1 1"])(
    "rejects %j",
    (input) => {
      expect(parseViewBox(input)).toBeNull();
    },
  );

  it("parses seeded random viewBoxes formatted with mixed separators", () => {
    const rand = mulberry32(11);
    const seps = [" ", ",", ", ", "\t", "  ", " ,"];
    for (let i = 0; i < 500; i++) {
      const box = {
        x: Math.round((rand() - 0.5) * 2000) / 4,
        y: Math.round((rand() - 0.5) * 2000) / 4,
        width: Math.round(rand() * 4000 + 1) / 4,
        height: Math.round(rand() * 4000 + 1) / 4,
      };
      const pick = () => seps[Math.floor(rand() * seps.length)];
      const text = [box.x, box.y, box.width, box.height].map(String).reduce((a, b) => a + pick() + b);
      expect(parseViewBox(text)).toEqual(box);
    }
  });
});

describe("exportDimensions", () => {
  // Hand-written model: the 2x raster of a box, with the long side capped.
  function model(w, h, scale, maxSide) {
    let s = scale;
    if (Math.max(w, h) * s > maxSide) s = maxSide / Math.max(w, h);
    return { width: Math.max(1, Math.round(w * s)), height: Math.max(1, Math.round(h * s)) };
  }

  it("doubles a small diagram", () => {
    expect(exportDimensions({ width: 216.5, height: 174 }, 2, 8192)).toEqual({ width: 433, height: 348, scale: 2 });
  });

  it("caps the longer side", () => {
    const d = exportDimensions({ width: 6000, height: 1500 }, 2, 8192);
    expect(d.width).toBe(8192);
    expect(d.height).toBe(2048);
  });

  it("matches the model on seeded random boxes", () => {
    const rand = mulberry32(23);
    for (let i = 0; i < 1000; i++) {
      const w = rand() * 9000 + 0.1;
      const h = rand() * 9000 + 0.1;
      const got = exportDimensions({ width: w, height: h }, 2, 8192);
      const want = model(w, h, 2, 8192);
      expect({ width: got.width, height: got.height }).toEqual(want);
      expect(Math.max(got.width, got.height)).toBeLessThanOrEqual(8192);
      expect(Math.min(got.width, got.height)).toBeGreaterThanOrEqual(1);
    }
  });
});
