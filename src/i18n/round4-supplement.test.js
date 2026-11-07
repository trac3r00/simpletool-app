// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import ROUND4 from "./supplements/round4.js";
import { getToolTranslation } from "../utils/i18n.js";

const LANGS = ["en", "ko", "ja", "es", "zh-CN", "zh-TW", "fr", "de", "pt", "vi"];
const keyList = (tools) =>
  Object.entries(tools)
    .flatMap(([id, t]) => Object.entries(t).flatMap(([section, map]) => Object.keys(map).map((k) => `${id}.${section}.${k}`)))
    .sort();
const valueAt = (tools, path) => {
  const [id, section, key] = path.split(".");
  return tools[id][section][key];
};

describe("round-4 i18n supplement", () => {
  const enKeys = keyList(ROUND4.en.tools);

  it("covers every supported language with exactly the English keys", () => {
    expect(Object.keys(ROUND4).sort()).toEqual([...LANGS].sort());
    for (const lang of LANGS) expect(keyList(ROUND4[lang].tools)).toEqual(enKeys);
  });

  it("has no empty values", () => {
    for (const lang of LANGS) {
      for (const path of enKeys) expect(valueAt(ROUND4[lang].tools, path).trim()).not.toBe("");
    }
  });

  it("translates most strings away from English in every other language", () => {
    for (const lang of LANGS.filter((l) => l !== "en")) {
      const same = enKeys.filter((path) => valueAt(ROUND4[lang].tools, path) === valueAt(ROUND4.en.tools, path));
      expect(same.length / enKeys.length).toBeLessThan(0.25);
    }
  });

  it("every supplement key is referenced by its route", () => {
    for (const path of enKeys) {
      const [id, section, key] = path.split(".");
      const src = readFileSync(new URL(`../routes/${id}.js`, import.meta.url), "utf8");
      expect(src, path).toContain(`tools.${id}.${section}.${key}`);
    }
  });

  it("is merged into the runtime catalog for ui and js sections", () => {
    for (const path of enKeys) {
      const [id, section, key] = path.split(".");
      const runtime = getToolTranslation(id, "ko")?.[section]?.[key];
      expect(typeof runtime, path).toBe("string");
    }
    const jsPath = enKeys.find((p) => p.split(".")[1] === "js");
    const [id, , key] = jsPath.split(".");
    expect(getToolTranslation(id, "ko").js[key]).toBe(valueAt(ROUND4.ko.tools, jsPath));
  });
});
