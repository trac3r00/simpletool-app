// @vitest-environment node
import { describe, expect, it } from "vitest";
import { handlersById } from "../routes/_handlers.js";
import { TOOLS } from "../utils/tool-registry.js";

/**
 * Every page must have exactly one <h1> and must not skip heading levels.
 *
 * Eight tools shipped an h1 -> h3 skip, and all eight traced back to two shared
 * components rather than to the tools themselves:
 *   - `createCheatsheet` rendered its title inside a bare <button>, so its
 *     <h3> section headings had no <h2> above them. Now <h2><button>, which is
 *     also the ARIA authoring-practices accordion pattern.
 *   - the footer's three column titles were <h3>, which skipped a level on any
 *     page whose main content contained no <h2> at all.
 *
 * A skipped level is invisible in the rendered page and breaks screen-reader
 * navigation, which is why nothing else caught it.
 *
 * This checks SERVER-RENDERED markup, so headings injected by client scripts
 * (e.g. case-converter's result cards) are out of scope here — those are
 * covered by the browser pass in `scripts/deep-ui-audit.mjs`.
 */

function headings(html) {
  // Ignore anything inside <script>/<template>: routes embed markup strings
  // there that are not part of the rendered document outline.
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<template[\s\S]*?<\/template>/gi, " ");
  return [...body.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({
    level: Number(m[1]),
    text: m[2].replace(/<[^>]*>/g, "").trim().slice(0, 40),
  }));
}

function firstSkip(list) {
  let prev = 0;
  for (const h of list) {
    if (prev && h.level > prev + 1) return `h${prev} -> h${h.level} ("${h.text}")`;
    prev = h.level;
  }
  return null;
}

describe("heading order", () => {
  const routes = TOOLS.filter((t) => typeof handlersById[t.id] === "function");

  it("covers every registered tool", () => {
    expect(routes.length).toBe(TOOLS.length);
  });

  it("every tool page has exactly one <h1> and skips no level", async () => {
    const offenders = [];
    for (const tool of routes) {
      const url = new URL(`https://simpletool.app${tool.path}`);
      const response = await handlersById[tool.id](
        new Request(url, { method: "GET" }),
        url,
      );
      if (response.status !== 200) continue;
      const list = headings(await response.text());

      const h1s = list.filter((h) => h.level === 1).length;
      if (h1s !== 1) offenders.push(`${tool.id}: expected 1 <h1>, found ${h1s}`);

      const skip = firstSkip(list);
      if (skip) offenders.push(`${tool.id}: ${skip}`);
    }
    expect(offenders).toEqual([]);
  });

  it("the detector recognises a skip and a missing h1", () => {
    // Guards against the assertion above passing because the parser broke.
    expect(firstSkip([{ level: 1, text: "a" }, { level: 3, text: "b" }])).toMatch(
      /h1 -> h3/,
    );
    expect(firstSkip([{ level: 1, text: "a" }, { level: 2, text: "b" }])).toBeNull();
    expect(headings("<h2 class=x>Title</h2>")).toEqual([{ level: 2, text: "Title" }]);
    expect(headings("<script><h1>ignored</h1></script>")).toEqual([]);
  });
});
