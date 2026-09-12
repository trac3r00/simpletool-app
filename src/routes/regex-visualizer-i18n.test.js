// @vitest-environment node
import { describe, expect, it } from "vitest";
import de from "../i18n/de.js";
import en from "../i18n/en.js";
import es from "../i18n/es.js";
import fr from "../i18n/fr.js";
import ja from "../i18n/ja.js";
import ko from "../i18n/ko.js";
import pt from "../i18n/pt.js";
import vi from "../i18n/vi.js";
import zhCN from "../i18n/zh-CN.js";
import zhTW from "../i18n/zh-TW.js";
import { handleRegexVisualizerRoutes } from "./regex-visualizer.js";

const CATALOGS = {
  en,
  ko,
  ja,
  es,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  fr,
  de,
  pt,
  vi,
};

function explanationCatalog(catalog) {
  return catalog.tools?.["regex-visualizer"]?.js?.explain;
}

function placeholders(value) {
  return [...value.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)]
    .map((match) => match[1])
    .sort();
}

describe("Regex explanation runtime i18n", () => {
  it("keeps generated locale keys and named placeholders in parity", () => {
    const english = explanationCatalog(CATALOGS.en);
    expect(english).toBeTruthy();
    const englishKeys = Object.keys(english).sort();

    for (const [locale, catalog] of Object.entries(CATALOGS)) {
      const translations = explanationCatalog(catalog);
      expect(translations, `${locale} explanation catalog`).toBeTruthy();
      expect(Object.keys(translations).sort(), `${locale} keys`).toEqual(
        englishKeys,
      );
      for (const key of englishKeys) {
        expect(typeof translations[key], `${locale} ${key}`).toBe("string");
        expect(placeholders(translations[key]), `${locale} ${key}`).toEqual(
          placeholders(english[key]),
        );
        if (locale !== "en") {
          expect(translations[key], `${locale} ${key} should be localized`).not.toBe(
            english[key],
          );
        }
      }
    }
  });

  it("uses the generated English catalog as every runtime fallback", async () => {
    const url = new URL("https://simpletool.app/regex-visualizer?lang=en");
    const response = await handleRegexVisualizerRoutes(new Request(url), url);
    const html = await response.text();
    const runtimeFallbacks = new Map(
      [...html.matchAll(/_t\('([^']+)', '([^']*)'\)/g)]
        .filter((match) => match[1].startsWith("tools.regex-visualizer.js.explain."))
        .map((match) => [match[1].split(".").at(-1), match[2]]),
    );

    expect(Object.fromEntries(runtimeFallbacks)).toEqual(
      explanationCatalog(CATALOGS.en),
    );
  });
});
