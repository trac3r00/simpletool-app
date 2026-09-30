// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The `surface-*` scale runs light -> dark as the number rises:
 *   surface-300 = 83% L, surface-400 = 65%, surface-500 = 47%, surface-600 = 35%
 *
 * Light mode therefore needs a HIGH number (dark text on a light ground) and
 * dark mode a LOW one. A pair like `text-surface-400 dark:text-surface-500` is
 * inverted — it puts the lighter colour on white (2.57:1, well under the 4.5:1
 * minimum) AND the darker colour on near-black. Both themes fail.
 *
 * 21 such pairs existed across 10 files. They rendered fine, threw nothing, and
 * passed every other test, which is why this needs its own assertion.
 *
 * The canonical muted pair is `text-surface-500 dark:text-surface-400`, which is
 * exactly `--muted-foreground` in each theme (4.72:1 light, 7.15:1 dark).
 */

const DIRS = ["src/routes", "src/ui", "src/utils"];
const SKIP = new Set(["bundled-styles.js"]);

function sourceFiles() {
  const out = [];
  for (const dir of DIRS) {
    for (const name of readdirSync(dir)) {
      if (!name.endsWith(".js") || name.endsWith(".test.js") || SKIP.has(name)) continue;
      out.push([`${dir}/${name}`, readFileSync(join(dir, name), "utf8")]);
    }
  }
  return out;
}

/** Returns inverted light/dark text pairs found in a class attribute. */
function invertedPairs(source) {
  const hits = [];
  for (const match of source.matchAll(/class="([^"]*)"/g)) {
    const tokens = match[1].split(/\s+/);
    const light = tokens.find((t) => /^text-surface-\d+$/.test(t));
    const dark = tokens.find((t) => /^dark:text-surface-\d+$/.test(t));
    if (!light || !dark) continue;
    const l = Number(light.split("-").pop());
    const d = Number(dark.split("-").pop());
    if (l < d) hits.push(`${light} / ${dark}`);
  }
  return hits;
}

/**
 * Dark mode paints onto `--background` = surface-950 (6% L). Text at
 * surface-500 (47% L) yields 4.09:1 — under the 4.5:1 minimum — while
 * surface-400 (65% L) yields 7.50:1.
 *
 * This is separate from `invertedPairs` on purpose: the footer shipped
 * `text-surface-500 dark:text-surface-500`, an EQUAL pair, which the
 * inverted check (which requires light < dark) could never catch. It was the
 * single largest contrast defect in the app — 3 strings x 33 pages.
 */
function tooDarkInDarkMode(source) {
  const hits = [];
  for (const match of source.matchAll(/class="([^"]*)"/g)) {
    const dark = match[1]
      .split(/\s+/)
      .find((t) => /^dark:text-surface-\d+$/.test(t));
    if (!dark) continue;
    if (Number(dark.split("-").pop()) >= 500) hits.push(dark);
  }
  return hits;
}

/**
 * The same defect hides in `styles/input.css` `@apply` rules, where no
 * `class="..."` attribute exists to scan. `.empty-state-desc` (the worst
 * measured text in the app at 2.56:1) and `.info-hint` (18 findings) both
 * lived here and were invisible to the markup scan above.
 *
 * A rule that declares its OWN inverting background is exempt: `[data-tooltip]`
 * pairs `bg-surface-900 text-surface-50` with `dark:bg-surface-200
 * dark:text-surface-900`, which inverts correctly on purpose.
 */
function invertedCssRules() {
  const css = readFileSync("styles/input.css", "utf8");
  const hits = [];
  for (const match of css.matchAll(/@apply ([^;]+);/g)) {
    const body = match[1];
    if (/\bdark:bg-/.test(body)) continue; // declares its own inverted ground
    const tokens = body.split(/\s+/);
    const light = tokens.find((t) => /^text-surface-\d+$/.test(t));
    const dark = tokens.find((t) => /^dark:text-surface-\d+$/.test(t));
    if (!light || !dark) continue;
    const l = Number(light.split("-").pop());
    const d = Number(dark.split("-").pop());
    if (l <= d) hits.push(`${light} / ${dark}`);
  }
  return hits;
}

describe("light/dark text contrast contract", () => {
  it("no stylesheet rule inverts or equates its light and dark text shades", () => {
    expect(invertedCssRules()).toEqual([]);
  });

  it("no route inverts its light and dark text shades", () => {
    const offenders = [];
    for (const [path, source] of sourceFiles()) {
      for (const pair of invertedPairs(source)) {
        offenders.push(`${path}: ${pair}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no dark-mode body text is surface-500 or darker", () => {
    const offenders = [];
    for (const [path, source] of sourceFiles()) {
      for (const cls of tooDarkInDarkMode(source)) offenders.push(`${path}: ${cls}`);
    }
    expect(offenders).toEqual([]);
  });

  it("the detectors actually recognise their defects", () => {
    expect(tooDarkInDarkMode('<p class="text-surface-500 dark:text-surface-500">')).toEqual([
      "dark:text-surface-500",
    ]);
    expect(tooDarkInDarkMode('<p class="text-surface-500 dark:text-surface-400">')).toEqual([]);
    // Guards against the assertion above passing because the matcher broke.
    expect(invertedPairs('<p class="text-surface-400 dark:text-surface-500">')).toEqual([
      "text-surface-400 / dark:text-surface-500",
    ]);
    expect(invertedPairs('<p class="text-surface-500 dark:text-surface-400">')).toEqual([]);
  });
});
