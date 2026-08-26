// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The pre-rebuild card stack (`bg-white dark:bg-surface-900` + rounded +
 * border/shadow) painted a nested group in the exact same colour as the
 * `.tool-page-panel` containing it. It was replaced by `.tool-group`, which
 * adds no second fill. This guard stops it coming back — the drift is
 * invisible to every behavioural test, because the page still renders fine,
 * it just renders as a card inside an identical card.
 *
 * See DESIGN.md "card = raised, background = recessed well".
 */

const ROUTE_DIRS = ["src/routes", "src/ui"];
// All three legacy surface pairings. An earlier version of this guard only
// matched surface-900 and silently missed a whole family on -950/-800.
const CARD_SURFACE = /bg-white\s+dark:bg-surface-(800|900|950)/;
const CONTAINER = /rounded-(xl|lg)/;
// Textareas/selects/colour inputs: their target is `.input`, not `.tool-group`.
const FORM_CONTROL =
  /\bfont-mono\b|\bresize-|focus:ring|focus:outline|\bcursor-pointer\b/;

/**
 * Every form control now uses the `.input` / `.input-mono` contract, so no
 * source file should carry the numeric card surface at all. Kept as an empty
 * budget rather than deleted: if a future edit reintroduces `bg-white
 * dark:bg-surface-900` anywhere, this fails with the file and count.
 */
const FORM_CONTROL_BUDGET = {
  // The home hero deliberately keeps a bespoke white+surface-950 pair: no
  // semantic token matches it, `bg-card` would lift the dark band off the
  // page and `bg-background` would flatten the light one into it. Documented
  // inline in home.js. Everything else must use a semantic token.
  "home.js": 1,
};

function sourceFiles() {
  const files = [];
  for (const dir of ROUTE_DIRS) {
    for (const name of readdirSync(dir)) {
      if (!name.endsWith(".js") || name.endsWith(".test.js")) continue;
      files.push([name, readFileSync(join(dir, name), "utf8")]);
    }
  }
  return files;
}

function legacyCardHits(source) {
  return [...source.matchAll(/class="([^"]*)"/g)]
    .map((match) => match[1])
    .filter((cls) => CARD_SURFACE.test(cls));
}

describe("nested group card contract", () => {
  it("no route hand-builds the legacy card stack as a container", () => {
    const offenders = [];
    for (const [name, source] of sourceFiles()) {
      for (const cls of legacyCardHits(source)) {
        if (FORM_CONTROL.test(cls)) continue;
        if (CONTAINER.test(cls) && /\bp-\d/.test(cls)) {
          offenders.push(`${name}: ${cls.slice(0, 80)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("the remaining numeric-surface form controls do not grow", () => {
    const counts = {};
    for (const [name, source] of sourceFiles()) {
      const n = legacyCardHits(source).length;
      if (n > 0) counts[name] = n;
    }
    expect(counts).toEqual(FORM_CONTROL_BUDGET);
  });

  it("tool-group is never given a competing surface fill", () => {
    const offenders = [];
    for (const [name, source] of sourceFiles()) {
      for (const cls of [...source.matchAll(/class="([^"]*)"/g)].map(
        (m) => m[1],
      )) {
        if (!/\btool-group\b/.test(cls)) continue;
        if (/\bbg-(white|card|surface-\d+)\b/.test(cls)) {
          offenders.push(`${name}: ${cls.slice(0, 80)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
