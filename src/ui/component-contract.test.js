// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The identity is only universal if it is unavoidable.
 *
 * DESIGN.md "Component contract": anything a user can interact with must come
 * from a component class; raw utilities are for LAYOUT. Before this was
 * enforced, 164 buttons and 86 form controls across the 50 tools were built
 * from hand-rolled utility stacks that had each drifted from the component
 * they were imitating — e.g. `getThemeToggleButton` hand-copied `.btn-ghost`
 * but used `focus:ring` (fires on mouse click) where `.btn` uses
 * `focus-visible:ring` (keyboard only).
 *
 * A class name alone is not a component. `tab-button`, `cidr-chip` and friends
 * are JS selector hooks with no CSS rule behind them — an element may carry
 * them, but it still needs a real component class for its appearance.
 */

const DIRS = ["src/routes", "src/ui", "src/utils"];
const SKIP = new Set(["bundled-styles.js"]);

/** Component classes that give an interactive element its appearance. */
const BUTTON_COMPONENTS =
  /\b(btn|btn-primary|btn-secondary|btn-ghost|btn-danger|btn-info|btn-fab|btn-icon|btn-icon-sm|btn-sm|btn-xs|tab-trigger|filter-chip|info-hint|cheatsheet-toggle|mobile-tab-btn|menu-item)\b/;
const INPUT_COMPONENTS = /\b(input|input-mono|input-search)\b/;

/** Types that are not text-like and legitimately style themselves. */
const NON_TEXT_INPUT = /^(checkbox|radio|range|color|file|hidden|submit|button|image|reset)$/i;

/**
 * Per-tool affordances that are deliberately NOT one of the shared components,
 * because they are a distinct visual pattern rather than a button:
 * a tinted chip, a selectable record/picker card, a segmented unit toggle.
 * Listed explicitly so the exception is a decision, not an oversight.
 */
const ALLOWED_BESPOKE = /\b(cidr-chip|record-card|unit-toggle|pipe-picker|rw-[a-z-]+|opt-select|copy-result-btn|remove-peer-btn)\b/;

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

/** True when the class list is a hand-rolled visual stack. */
function isHandRolled(cls) {
  const hasPadding = /\b(p|px|py)-[\d.]+/.test(cls);
  const hasSurface = /\b(bg-|border\b|border-[a-z])/.test(cls);
  return hasPadding && hasSurface;
}

describe("component contract", () => {
  it("every text-like form control uses .input / .input-mono / .input-search", () => {
    const offenders = [];
    for (const [path, source] of sourceFiles()) {
      for (const match of source.matchAll(/<(input|textarea|select)\b([^>]*)>/g)) {
        const tag = match[0];
        const type = (tag.match(/type="([^"]+)"/) ?? [])[1] ?? "";
        if (NON_TEXT_INPUT.test(type)) continue;
        const cls = (tag.match(/class="([^"]*)"/) ?? [])[1] ?? "";
        if (!cls || INPUT_COMPONENTS.test(cls) || ALLOWED_BESPOKE.test(cls)) continue;
        if (!isHandRolled(cls)) continue; // unstyled/utility-free is fine
        offenders.push(`${path}: ${cls.slice(0, 60)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no button is a hand-rolled visual stack", () => {
    const offenders = [];
    for (const [path, source] of sourceFiles()) {
      for (const match of source.matchAll(/<button\b([^>]*)>/g)) {
        const cls = (match[0].match(/class="([^"]*)"/) ?? [])[1] ?? "";
        if (!cls || BUTTON_COMPONENTS.test(cls) || ALLOWED_BESPOKE.test(cls)) continue;
        if (!isHandRolled(cls)) continue;
        offenders.push(`${path}: ${cls.slice(0, 60)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("the detector recognises a hand-rolled stack", () => {
    expect(isHandRolled("px-4 py-2 bg-primary-600 text-white rounded")).toBe(true);
    expect(isHandRolled("btn-primary w-full")).toBe(false); // no padding/surface
    expect(isHandRolled("flex items-center gap-2")).toBe(false);
    expect(BUTTON_COMPONENTS.test("btn-ghost btn-icon md:hidden")).toBe(true);
    expect(INPUT_COMPONENTS.test("input-search w-48")).toBe(true);
  });
});
