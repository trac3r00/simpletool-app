// @vitest-environment node
import { readFile } from "node:fs/promises";
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

async function renderEnglish() {
  const url = new URL("https://simpletool.app/cron-builder?lang=en");
  const response = await handleCronBuilderRoutes(new Request(url), url);
  expect(response.status).toBe(200);
  return response.text();
}

describe("cron builder runtime localization contract", () => {
  it("preserves recipe expressions and scheduling code while localizing labels", async () => {
    const html = await renderEnglish();
    const recipeCrons = [...html.matchAll(/nameKey: 'recipe\d+', name: '[^']+', cron: '([^']+)'/g)]
      .map((match) => match[1]);

    expect(recipeCrons).toEqual(EXPECTED_CRONS);
    const controllerStart = html.indexOf("/**\n       * Cron Logic & UI Controller");
    const scriptTagStart = html.lastIndexOf("<script", controllerStart);
    const scriptStart = html.indexOf(">", scriptTagStart) + 1;
    const scriptEnd = html.indexOf("</script>", controllerStart);
    expect(controllerStart).toBeGreaterThan(-1);
    expect(scriptTagStart).toBeGreaterThan(-1);
    expect(() => new Function(html.slice(scriptStart, scriptEnd))).not.toThrow();
    expect(html).toContain("calculateNextRuns(input.value, 5)");
    expect(html).toContain("date.toLocaleString(getActiveLocale()");
    expect(html).not.toContain("date.toLocaleString('en-US'");
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
