// @vitest-environment node
import { describe, expect, it } from "vitest";
import { handleRepoOpsRoutes } from "../routes/repo-ops.js";
import { handleNetworkReferenceRoutes } from "../routes/network-reference.js";

/**
 * Guard against the class of bug where markup references a `data-i18n*` key
 * that no locale catalog defines. The client's `_patchDOM` skips a key it
 * cannot resolve, so the server-rendered English survives — the page never
 * breaks, it just silently stops translating. That failure mode is invisible
 * to every other test in the suite, which is why it needs its own.
 *
 * Composite routes are the highest-risk surface: they embed several tools'
 * markup, so a catalog that was complete for a standalone route can be
 * incomplete once its markup is rendered under a different tool id.
 */

const I18N_ATTRS = [
  "data-i18n",
  "data-i18n-placeholder",
  "data-i18n-title",
  "data-i18n-aria",
  "data-i18n-tooltip",
  "data-i18n-html",
];

const LANGS = [
  "en",
  "ko",
  "ja",
  "es",
  "zh-CN",
  "zh-TW",
  "fr",
  "de",
  "pt",
  "vi",
];

const ROUTES = [
  ["/repo-ops", handleRepoOpsRoutes],
  ["/network-reference", handleNetworkReferenceRoutes],
];

/**
 * Empty by design. `dns-reference` (ui.category.*, ui.title.*),
 * `port-reference` (cheatsheet.c0-c2, ui.tip0) and `protocol-headers`
 * (cheatsheet.c0-c3) were backfilled by scripts/i18n-network-reference.mjs —
 * 38 keys that had never been defined in any locale, including `en`.
 *
 * Kept as an empty set rather than deleted: the per-locale tests below name any
 * key a route references that no catalog defines, and the "still actually
 * missing" test below fails if anything listed here now resolves. Add an entry
 * only to consciously accept a gap.
 */
const KNOWN_UNTRANSLATED = new Set([]);

function extractCatalog(html, lang) {
  const match = html.match(/var _T = ([\s\S]*?);\n\s*var _supported/);
  if (!match) throw new Error("no _T catalog found in rendered HTML");
  return JSON.parse(match[1])[lang];
}

function referencedKeys(html) {
  const keys = new Set();
  for (const attr of I18N_ATTRS) {
    for (const match of html.matchAll(new RegExp(`${attr}="([^"]+)"`, "g"))) {
      keys.add(match[1]);
    }
  }
  return keys;
}

function resolveKey(catalog, path) {
  let node = catalog;
  for (const segment of path.split(".")) {
    if (node?.[segment] === undefined) return undefined;
    node = node[segment];
  }
  return node;
}

async function render(handler, path, lang) {
  const url = new URL(`https://simpletool.app${path}?lang=${lang}`);
  const response = await handler(new Request(url, { method: "GET" }), url);
  expect(response.status).toBe(200);
  return response.text();
}

describe("rendered data-i18n keys resolve in every locale", () => {
  for (const [path, handler] of ROUTES) {
    for (const lang of LANGS) {
      it(`${path} (${lang}) references no undefined translation key`, async () => {
        const html = await render(handler, path, lang);
        const catalog = extractCatalog(html, lang);
        const keys = [...referencedKeys(html)];

        expect(keys.length).toBeGreaterThan(20);

        const unresolved = keys
          .filter((key) => typeof resolveKey(catalog, key) !== "string")
          .filter((key) => !KNOWN_UNTRANSLATED.has(key))
          .sort();

        expect(unresolved).toEqual([]);
      });
    }
  }

  it("every known-untranslated key is still actually missing", async () => {
    const stillMissing = new Set();
    for (const [path, handler] of ROUTES) {
      const html = await render(handler, path, "ko");
      const catalog = extractCatalog(html, "ko");
      for (const key of referencedKeys(html)) {
        if (typeof resolveKey(catalog, key) !== "string") stillMissing.add(key);
      }
    }
    const fixed = [...KNOWN_UNTRANSLATED]
      .filter((key) => !stillMissing.has(key))
      .sort();
    expect(
      fixed,
      "these keys now resolve — delete them from KNOWN_UNTRANSLATED",
    ).toEqual([]);
  });
});
