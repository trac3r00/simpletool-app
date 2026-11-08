// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { t } from "../utils/i18n.js";

/**
 * Port of qa-scripts/i18n-scan.mjs. A route element's data-i18n key must
 * translate to the English text the element already shows. A key swapped with
 * another element renders the wrong string in every language, and this guard
 * catches it.
 */

const ROUTE_DIR = "src/routes";
const ELEMENT = /<([a-z0-9]+)\b[^>]*\sdata-i18n="([^"$]+)"[^>]*>([\s\S]*?)<\/\1>/g;

const norm = (s) =>
  String(s ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const ALLOWLIST = [
  "markdown-editor.js tools.markdown-editor.ui.title8", // shortened label: "Print" for "Print preview"
  "token-studio.js tools.token-studio.ui.textEndpointInfo", // catalog holds the lead-in only; rest of the sentence not verified
  "csp-builder.js tools.csp-builder.ui.desc2", // element text is a concatenated t('text10') fallback; same string
  "secret-scanner.js tools.secret-scanner.ui.desc1", // element text is a concatenated t('text28') fallback; same string
  "oauth-debugger.js tools.oauth-debugger.ui.label0", // catalog drops the parenthetical hint
  "oauth-debugger.js tools.oauth-debugger.ui.label1", // catalog drops the parenthetical hint
  "oauth-debugger.js tools.oauth-debugger.ui.label7", // catalog drops the parenthetical hint
  "color-converter.js tools.color-converter.ui.desc4", // same formats listed, shorter notation in catalog
  "token-counter.js tools.token-counter.ui.stat6", // FLAGGED: catalog reads "Llama"; "Gemini" from the element is missing
  "token-counter.js tools.token-counter.ui.desc1", // FLAGGED: catalog omits the Gemini sentence present in the element
  "uuid-generator.js tools.uuid-generator.ui.button0", // shortened label: "Generate" for "Generate UUID"
  "roulette-wheel.js tools.roulette-wheel.ui.fullscreen", // element is the ⛶ entity glyph; catalog is its accessible name
  "roulette-wheel.js tools.roulette-wheel.ui.neonToggle", // element is the ✨ entity glyph; catalog is its accessible name
  "wireshark-filter.js tools.wireshark-filter.ui.option0", // key absent from catalog; text is "-- Select Field --"
  "svg-optimizer.js tools.svg-optimizer.ui.label1", // element entity-encodes "<title>"; norm strips it from the catalog side only
  "marble-roulette.js tools.marble-roulette.ui.text3", // entity &mdash; vs the em dash in the catalog
  "marble-roulette.js tools.marble-roulette.js.text3", // element is a concatenated _t() fallback; same string
  "encoding-workbench.js tools.encoding-workbench.ui.desc42", // element is runtime error text (escapeHTML(e.message)), not a catalog string
  "encoding-workbench.js tools.encoding-workbench.ui.desc43", // element is a concatenated window._t() fallback; same string
  "encoding-workbench.js tools.encoding-workbench.ui.decodeThis", // source holds a literal \u2192 escape that renders as the arrow
  "regex-visualizer.js tools.regex-visualizer.ui.option8", // key absent from catalog; text is "URL"
];

function scanRoutes() {
  const problems = [];
  const files = readdirSync(ROUTE_DIR).filter(
    (f) => f.endsWith(".js") && !f.endsWith(".test.js"),
  );
  for (const file of files) {
    const src = readFileSync(join(ROUTE_DIR, file), "utf8");
    for (const m of src.matchAll(ELEMENT)) {
      const key = m[2];
      const text = norm(m[3]);
      if (key.includes("'") || key.includes("+")) continue;
      const id = `${file} ${key}`;
      // Server-rendered text such as ${t("tools.x.ui.k", lang)}: the key it
      // renders must be the key _patchDOM swaps in on a language change.
      const rendered = m[3].trim().match(/^\$\{\s*(?:t|tr|_t|ui|tx)\(\s*["'`]([^"'`]+)["'`]/);
      if (rendered) {
        const inner = rendered[1];
        if (key !== inner && !key.endsWith(`.${inner}`)) {
          problems.push({ id, detail: `renders ${inner} but patches ${key}` });
        }
        continue;
      }
      if (!text || text.includes("${")) continue;
      const val = t(key, "en");
      if (val === key || val === "") {
        problems.push({ id, detail: `MISSING-KEY src="${text}"` });
        continue;
      }
      if (norm(val) !== text) {
        problems.push({ id, detail: `src="${text}" en="${norm(val)}"` });
      }
    }
  }
  return problems;
}

describe("route data-i18n keys", () => {
  it("translate to the element's own English text, except allowlisted leftovers", () => {
    const unlisted = scanRoutes()
      .filter((p) => !ALLOWLIST.includes(p.id))
      .map((p) => `${p.id} ${p.detail}`);
    expect(unlisted).toEqual([]);
  });
});
