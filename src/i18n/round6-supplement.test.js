// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import ROUND6 from "./supplements/round6.js";
import { getToolTranslation, t } from "../utils/i18n.js";

const LANGS = ["en", "ko", "ja", "es", "zh-CN", "zh-TW", "fr", "de", "pt", "vi"];
const leaves = (node, prefix = "") =>
  Object.entries(node).flatMap(([k, v]) =>
    typeof v === "string" ? [[prefix + k, v]] : leaves(v, `${prefix}${k}.`),
  );
const enLeaves = new Map(leaves(ROUND6.en));

const sourceFiles = ["../routes/", "../utils/", "../ui/"].flatMap((dir) =>
  readdirSync(new URL(dir, import.meta.url))
    .filter((f) => f.endsWith(".js") && !f.endsWith(".test.js"))
    .map((f) => readFileSync(new URL(dir + f, import.meta.url), "utf8")),
);
const allSource = sourceFiles.join("\n");

describe("round-6 i18n supplement", () => {
  it("every locale has exactly the English keys, none empty", () => {
    expect(Object.keys(ROUND6).sort()).toEqual([...LANGS].sort());
    for (const lang of LANGS) {
      const map = new Map(leaves(ROUND6[lang]));
      expect([...map.keys()].sort(), lang).toEqual([...enLeaves.keys()].sort());
      for (const [path, value] of map) expect(value.trim(), `${lang} ${path}`).not.toBe("");
    }
  });

  it("every key is referenced by source", () => {
    const unreferenced = [...enLeaves.keys()].filter((path) => {
      const short = path.split(".").at(-1);
      return !allSource.includes(path) && !allSource.includes(`"${short}"`) && !allSource.includes(`'${short}'`);
    });
    expect(unreferenced).toEqual([]);
  });

  it("is merged into the runtime catalog", () => {
    expect(t("home.trustAccount", "ko")).toBe(ROUND6.ko.home.trustAccount);
    expect(t("shell.localProofHeading", "ja")).toBe(ROUND6.ja.shell.localProofHeading);
    const [toolId, sections] = Object.entries(ROUND6.ko.tools)[0];
    const [section, map] = Object.entries(sections)[0];
    const [key, value] = Object.entries(map)[0];
    expect(getToolTranslation(toolId, "ko")[section][key]).toBe(value);
  });
});
