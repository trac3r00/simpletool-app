// @vitest-environment node
import { describe, expect, it } from "vitest";
import { SUPPORTED_LANGUAGES } from "../utils/i18n.js";
import en from "./en.js";
import ko from "./ko.js";
import ja from "./ja.js";
import es from "./es.js";
import zhCN from "./zh-CN.js";
import zhTW from "./zh-TW.js";
import fr from "./fr.js";
import de from "./de.js";
import pt from "./pt.js";
import vi from "./vi.js";

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

// The four workflows that lost their standalone routes in the network-reference
// and repo-ops merges. Their markup still carries data-i18n hooks and their
// scripts still call _t(), so they still need full catalog entries.
// Regenerate with: node scripts/i18n-embedded-tools.mjs
const EMBEDDED_TOOLS = [
  "http-status-reference",
  "public-repos-yml-builder",
  "public-repos-not-automation",
  "review-description-generator",
];

// Deliberately identical across locales: standards names and literal code samples.
const SHARED_VALUES = new Set([
  "RFC 9110",
  "repos.yml",
  "repositories: []",
  "name: Public repos audit",
  // The repos.yml placeholder is sample input, not prose: every token in it
  // (`team=`, `cadence=`, `sha=ok`) is a literal the parser matches on, so
  // translating it would demonstrate a format the tool rejects.
  "example-api team=platform cadence=weekly sha=ok branch=protected secrets=ok monetization=ready\n" +
    "https://github.com/example/docs-site team=docs cadence=monthly sha=ok branch=protected secrets=ok monetization=todo",
]);

// Cognates — the correct target-language term is spelled like English.
const COGNATES = new Set([
  "fr:http-status-reference:ui:button4",
  "es:public-repos-not-automation:js:manual",
  "pt:public-repos-not-automation:ui:heading2",
  "pt:public-repos-not-automation:js:manual",
]);

describe("embedded workflow tool translations", () => {
  it("covers every supported language", () => {
    expect(Object.keys(CATALOGS).sort()).toEqual(
      Object.keys(SUPPORTED_LANGUAGES).sort(),
    );
  });

  for (const toolId of EMBEDDED_TOOLS) {
    it(`${toolId} has English metadata and a ui dictionary`, () => {
      const entry = en.tools[toolId];
      expect(entry, `en is missing ${toolId}`).toBeTruthy();
      expect(entry.name?.trim()).toBeTruthy();
      expect(entry.desc?.trim()).toBeTruthy();
      expect(Object.keys(entry.ui || {}).length).toBeGreaterThan(0);
    });

    it(`${toolId} keeps exact key parity in every locale`, () => {
      const ref = en.tools[toolId];
      const refSections = Object.keys(ref).filter(
        (k) => k === "ui" || k === "js",
      );

      for (const [lang, catalog] of Object.entries(CATALOGS)) {
        const entry = catalog.tools[toolId];
        expect(entry, `${lang} is missing ${toolId}`).toBeTruthy();
        expect(entry.name?.trim(), `${lang} ${toolId}.name`).toBeTruthy();
        expect(entry.desc?.trim(), `${lang} ${toolId}.desc`).toBeTruthy();

        for (const section of refSections) {
          expect(
            Object.keys(entry[section] || {}).sort(),
            `${lang} ${toolId}.${section} key set`,
          ).toEqual(Object.keys(ref[section]).sort());
        }
      }
    });

    it(`${toolId} has no empty or untranslated values`, () => {
      const ref = en.tools[toolId];
      const offenders = [];

      for (const [lang, catalog] of Object.entries(CATALOGS)) {
        const entry = catalog.tools[toolId];
        for (const section of ["ui", "js"]) {
          for (const [key, refValue] of Object.entries(ref[section] || {})) {
            const value = entry[section][key];
            if (!String(value ?? "").trim()) {
              offenders.push(`${lang} ${toolId}.${section}.${key} is empty`);
              continue;
            }
            if (lang === "en") continue;
            const allowed =
              SHARED_VALUES.has(value) ||
              COGNATES.has(`${lang}:${toolId}:${section}:${key}`);
            if (value === refValue && !allowed) {
              offenders.push(
                `${lang} ${toolId}.${section}.${key} is untranslated ("${value}")`,
              );
            }
          }
        }
      }

      expect(offenders).toEqual([]);
    });
  }
});
