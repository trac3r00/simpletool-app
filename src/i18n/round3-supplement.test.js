// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import ROUND3 from "./supplements/round3.js";
import { getToolTranslation } from "../utils/i18n.js";

const LANGS = ["en", "ko", "ja", "es", "zh-CN", "zh-TW", "fr", "de", "pt", "vi"];
const enTools = ROUND3.en.tools;
const keyList = (tools) =>
  Object.entries(tools)
    .flatMap(([id, t]) => Object.keys(t.ui).map((k) => `${id}.${k}`))
    .sort();

describe("round-3 i18n supplement", () => {
  it("covers every supported language with exactly the English keys", () => {
    expect(Object.keys(ROUND3).sort()).toEqual([...LANGS].sort());
    for (const lang of LANGS) expect(keyList(ROUND3[lang].tools)).toEqual(keyList(enTools));
  });

  it("has no empty values", () => {
    for (const lang of LANGS) {
      for (const t of Object.values(ROUND3[lang].tools)) {
        for (const value of Object.values(t.ui)) expect(value.trim()).not.toBe("");
      }
    }
  });

  it("translates most strings away from English in every other language", () => {
    const keys = keyList(enTools);
    for (const lang of LANGS.filter((l) => l !== "en")) {
      const same = keys.filter((k) => {
        const [id, key] = k.split(".");
        return ROUND3[lang].tools[id].ui[key] === enTools[id].ui[key];
      });
      expect(same.length / keys.length).toBeLessThan(0.25);
    }
  });

  it("every supplement key is wired into its route", () => {
    for (const [id, t] of Object.entries(enTools)) {
      const src = readFileSync(new URL(`../routes/${id}.js`, import.meta.url), "utf8");
      for (const key of Object.keys(t.ui)) expect(src).toContain(`tools.${id}.ui.${key}"`);
    }
  });

  it("is merged into the runtime catalog without overriding existing keys", () => {
    const [id, t] = Object.entries(ROUND3.ko.tools)[0];
    const [key, value] = Object.entries(t.ui)[0];
    expect(getToolTranslation(id, "ko").ui[key]).toBe(value);
  });
});
