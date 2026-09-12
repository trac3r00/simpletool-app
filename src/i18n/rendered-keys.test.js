// @vitest-environment node
import { describe, expect, it } from "vitest";
import { handlersById } from "../routes/_handlers.js";
import { SUPPORTED_LANGUAGES } from "../utils/i18n.js";
import {
  TOOLS,
  setRuntimeEnvironment,
} from "../utils/tool-registry.js";

const I18N_ATTRS = [
  "data-i18n",
  "data-i18n-placeholder",
  "data-i18n-title",
  "data-i18n-aria",
  "data-i18n-tooltip",
  "data-i18n-html",
];

function extractCatalogs(html) {
  const match = html.match(/var _T = ([\s\S]*?);\n\s*var _supported/);
  if (!match) throw new Error("no _T catalog found in rendered HTML");
  return JSON.parse(match[1]);
}

function renderedAttributeKeys(html) {
  // Do not mistake attribute-shaped strings in JSON or executable scripts for
  // DOM attributes. Generated runtime markup is covered separately by the
  // static _t call scan below where its key is knowable.
  const markup = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "");
  const keys = new Set();
  for (const attr of I18N_ATTRS) {
    for (const match of markup.matchAll(
      new RegExp(`${attr}="([^"]+)"`, "g"),
    )) {
      keys.add(match[1]);
    }
  }
  return keys;
}

function staticTranslationCallKeys(html) {
  const keys = new Set();
  const pattern = /(?:window\.)?_t\(\s*(['"])([^'"\n]+)\1/g;
  for (const match of html.matchAll(pattern)) {
    const following = html
      .slice(match.index + match[0].length)
      .match(/^\s*(.)/)?.[1];
    // A literal prefix concatenated with a runtime suffix cannot be resolved
    // statically; concrete rendered data attributes cover those call sites.
    if (following !== "+") keys.add(match[2]);
  }
  return keys;
}

function resolveKey(catalog, path) {
  return path.split(".").reduce((node, segment) => node?.[segment], catalog);
}

async function render(tool, locale) {
  const url = new URL(
    `https://simpletool.app${tool.path}?lang=${encodeURIComponent(locale)}`,
  );
  const response = await handlersById[tool.id](new Request(url), url);
  expect(response.status, tool.id).toBe(200);
  return response.text();
}

describe("rendered translation keys", () => {
  // Direct handler calls bypass worker.js, which normally publishes the
  // environment before rendering. Development mode keeps all three hidden
  // game catalogs available while this test exercises all 48 handlers.
  setRuntimeEnvironment(true);

  for (const tool of TOOLS) {
    it(`${tool.path} resolves rendered attributes and static _t calls in every locale`, async () => {
      for (const locale of Object.keys(SUPPORTED_LANGUAGES)) {
        const html = await render(tool, locale);
        const catalog = extractCatalogs(html)[locale];
        const keys = new Set([
          ...renderedAttributeKeys(html),
          ...staticTranslationCallKeys(html),
        ]);

        expect(
          keys.size,
          `${tool.id} ${locale} should expose translated UI`,
        ).toBeGreaterThan(0);
        expect(catalog, `${tool.id} ${locale} catalog`).toBeTruthy();
        const unresolved = [...keys]
          .filter((key) => typeof resolveKey(catalog, key) !== "string")
          .sort();
        expect(unresolved, `${tool.id} ${locale} unresolved keys`).toEqual([]);
      }
    });
  }
});
