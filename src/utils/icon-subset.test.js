import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { collectIconNames } from "../../scripts/icon-inventory.mjs";

const REPO_ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const FONT = path.join(REPO_ROOT, "dist/fonts/material-symbols.woff2");
const MANIFEST = path.join(REPO_ROOT, "scripts/icon-manifest.json");

// The unsubsetted family is 5.3 MB and was 98.5% of the home page's transfer.
// The current subset is ~38 KB; this cap is loose enough for a few dozen more
// icons and tight enough that shipping the full font fails immediately.
const MAX_FONT_BYTES = 300 * 1024;

describe("Material Symbols subset", () => {
  it("ships a subset, not the full family", () => {
    const bytes = fs.statSync(FONT).size;
    expect(bytes).toBeLessThan(MAX_FONT_BYTES);
    expect(fs.readFileSync(FONT).subarray(0, 4).toString("latin1")).toBe(
      "wOF2",
    );
  });

  it("covers every icon name used in src/", async () => {
    const used = await collectIconNames();
    const shipped = JSON.parse(fs.readFileSync(MANIFEST, "utf8")).iconNames;

    // An icon that is used but not subset renders as its raw text
    // ("content_copy") instead of a glyph. Run `npm run build:fonts` to
    // refetch the subset after adding or removing an icon.
    expect(shipped).toEqual(used);
  });

  it("records only well-formed ligature names", () => {
    const shipped = JSON.parse(fs.readFileSync(MANIFEST, "utf8")).iconNames;
    expect(shipped.length).toBeGreaterThan(0);
    for (const name of shipped) expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
  });

  it("finds icons from both markup and data-driven call sites", async () => {
    const used = await collectIconNames();
    // literal <span class="material-symbols-rounded">content_copy</span>
    expect(used).toContain("content_copy");
    // infoHint()'s default icon, which appears in no markup
    expect(used).toContain("help");
    // unit-converter's category table, rendered through innerHTML
    expect(used).toContain("straighten");
  });
});
