// @vitest-environment node
import { readFile } from "node:fs/promises";
import { parse } from "acorn";
import { describe, expect, it } from "vitest";
import { handleCronBuilderRoutes } from "./cron-builder.js";
import en from "../i18n/en.js";
import ko from "../i18n/ko.js";
import ja from "../i18n/ja.js";
import es from "../i18n/es.js";
import zhCN from "../i18n/zh-CN.js";
import zhTW from "../i18n/zh-TW.js";
import fr from "../i18n/fr.js";
import de from "../i18n/de.js";
import pt from "../i18n/pt.js";
import vi from "../i18n/vi.js";

const CATALOGS = { en, ko, ja, es, "zh-CN": zhCN, "zh-TW": zhTW, fr, de, pt, vi };
const EXPECTED_CRONS = [
  "* * * * *",
  "*/5 * * * *",
  "0 * * * *",
  "0 0 * * *",
  "0 8 * * *",
  "0 9 * * 1",
  "0 0 1 * *",
  "0 9 * * 1-5",
];
const CODE_LITERALS = ["*", "*/n", "*/5", ",", "1,3,5", "-", "1-5"];

function resolveKey(catalog, path) {
  return path.split(".").reduce((node, segment) => node?.[segment], catalog);
}

function placeholders(value) {
  return [...value.matchAll(/{{[^{}]+}}/g)].map(([token]) => token).sort();
}

const PAYLOAD_KEYS = [
  "tools.cron-builder.ui.tip0",
  "tools.cron-builder.ui.tip1",
  "tools.cron-builder.ui.tip2",
  "tools.cron-builder.ui.tip3",
  "tools.cron-builder.ui.tip4",
  "tools.cron-builder.ui.quickTips",
  "tools.cron-builder.ui.quickEvery",
  "tools.cron-builder.ui.quickIntervals",
  "tools.cron-builder.ui.quickLists",
  "tools.cron-builder.ui.quickRanges",
  "tools.cron-builder.js.recipe0",
  "tools.cron-builder.js.recipe1",
  "tools.cron-builder.js.recipe2",
  "tools.cron-builder.js.recipe3",
  "tools.cron-builder.js.recipe4",
  "tools.cron-builder.js.recipe5",
  "tools.cron-builder.js.recipe6",
  "tools.cron-builder.js.recipe7",
  "tools.cron-builder.js.everyMinute",
  "tools.cron-builder.js.atMidnight",
  "tools.cron-builder.js.atHour",
  "tools.cron-builder.js.atTime",
  "tools.cron-builder.js.atMinuteEveryHour",
  "tools.cron-builder.js.onDayOfMonth",
  "tools.cron-builder.js.onWeekdays",
  "tools.cron-builder.js.inMonth",
  "tools.cron-builder.js.relativeDays",
  "tools.cron-builder.js.relativeHours",
  "tools.cron-builder.js.relativeMinutes"
];

async function loadPayload() {
  const entries = await Promise.all(Object.keys(CATALOGS).map(async (locale) => {
    const values = JSON.parse(await readFile(new URL(`../../scripts/i18n-tool-backfill/${locale}.json`, import.meta.url), "utf8"));
    return [locale, Object.fromEntries(PAYLOAD_KEYS.map((key) => [key, values[key]]))];
  }));
  return Object.fromEntries(entries);
}

async function render(locale) {
  const url = new URL(`https://simpletool.app/cron-builder?lang=${locale}`);
  const response = await handleCronBuilderRoutes(new Request(url), url);
  expect(response.status, locale).toBe(200);
  return response.text();
}

// Parse every inline executable script so assertions follow the program
// structure rather than the route file's whitespace or comments.
function inlineScripts(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attrs]) => !/\bsrc=|type="application\/(?:ld\+)?json"/i.test(attrs))
    .map(([, , body]) => ({ body, ast: parse(body, { ecmaVersion: "latest" }) }));
}

function findNode(node, predicate) {
  if (!node || typeof node.type !== "string") return null;
  if (predicate(node)) return node;
  for (const value of Object.values(node)) {
    for (const child of Array.isArray(value) ? value : [value]) {
      const found = child && typeof child.type === "string" && findNode(child, predicate);
      if (found) return found;
    }
  }
  return null;
}

function declaration(scripts, name) {
  for (const { body, ast } of scripts) {
    const node = findNode(
      ast,
      (n) =>
        (n.type === "VariableDeclarator" && n.id.name === name) ||
        (n.type === "FunctionDeclaration" && n.id?.name === name),
    );
    if (node) return { node, source: body.slice(node.start, node.end), body };
  }
  throw new Error(`${name} is not declared in any inline script`);
}

function runtimeTranslator(scripts, catalog) {
  // Rebuild the page's own cron `t` helper against a window._t that resolves
  // from the payload the server shipped for this locale.
  const helper = declaration(scripts, "t").source;
  const window = {
    _t: (key, fallback) => {
      const value = resolveKey(catalog, key);
      return typeof value === "string" ? value : fallback;
    },
  };
  return new Function("window", `${helper}; return t;`)(window);
}

describe("cron builder runtime localization contract", () => {
  it("preserves recipe expressions and scheduling code while localizing labels", async () => {
    const scripts = inlineScripts(await render("en"));
    const recipes = declaration(scripts, "RECIPES").node.init.elements.map((recipe) =>
      Object.fromEntries(recipe.properties.map((prop) => [prop.key.name, prop.value.value])),
    );

    expect(recipes.map((recipe) => recipe.cron)).toEqual(EXPECTED_CRONS);
    expect(recipes.map((recipe) => recipe.nameKey)).toEqual(
      EXPECTED_CRONS.map((_, index) => `recipe${index}`),
    );
    const controller = declaration(scripts, "getActiveLocale").body;
    expect(controller).toMatch(/calculateNextRuns\(\s*input\.value\s*,\s*5\s*\)/);
    expect(controller).toMatch(/\.toLocaleString\(\s*getActiveLocale\(\)/);
    expect(controller).not.toMatch(/\.toLocaleString\(\s*['"]en-US['"]/);
  });

  it("ships and resolves the localized payload in a non-English render", async () => {
    const html = await render("ko");
    const scripts = inlineScripts(html);
    const shipped = new Function(`return ${declaration(scripts, "_T").source.replace(/^_T\s*=/, "")};`)();

    expect(html).toMatch(/<html[^>]*\blang="ko"/);
    for (const key of PAYLOAD_KEYS) {
      expect(resolveKey(shipped.ko, key), `ko payload ${key}`).toBe(resolveKey(ko, key));
    }
    const t = runtimeTranslator(scripts, shipped.ko);
    expect(t("recipe0", "Every minute")).toBe(ko.tools["cron-builder"].js.recipe0);
    expect(t("relativeMinutes", "in {{minutes}} min", { minutes: 3 })).toBe(
      ko.tools["cron-builder"].js.relativeMinutes.replaceAll("{{minutes}}", "3"),
    );
  });

  it("inserts substituted field text literally", async () => {
    const t = runtimeTranslator(inlineScripts(await render("en")), en);
    for (const value of ["$&", "$'", "$`", "$$", "$1"]) {
      expect(t("onWeekdays", "", { days: value }), value).toBe(
        en.tools["cron-builder"].js.onWeekdays.split("{{days}}").join(value),
      );
    }
  });

  it("keeps identical payload key sets, placeholders, and code literals in all locales", async () => {
    const payload = await loadPayload();
    const locales = Object.keys(CATALOGS);
    const englishKeys = Object.keys(payload.en).sort();

    expect(Object.keys(payload)).toEqual(locales);
    expect(englishKeys).toHaveLength(29);
    for (const locale of locales) {
      expect(Object.keys(payload[locale]).sort(), `${locale} keys`).toEqual(englishKeys);
      for (const key of englishKeys) {
        expect(placeholders(payload[locale][key]), `${locale} ${key} placeholders`).toEqual(
          placeholders(payload.en[key]),
        );
      }
      for (const key of englishKeys.filter((key) => key.includes(".quick"))) {
        for (const literal of CODE_LITERALS.filter((literal) => payload.en[key].includes(literal))) {
          expect(payload[locale][key], `${locale} ${key} literal ${literal}`).toContain(literal);
        }
      }
    }
  });

  it("matches the generated locale catalogs after payload integration", async () => {
    const payload = await loadPayload();
    for (const [locale, entries] of Object.entries(payload)) {
      for (const [key, value] of Object.entries(entries)) {
        expect(resolveKey(CATALOGS[locale], key), `${locale} ${key}`).toBe(value);
      }
    }
  });
});
