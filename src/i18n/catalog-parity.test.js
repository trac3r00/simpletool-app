// @vitest-environment node
import { describe, expect, it } from "vitest";
import { handlersById } from "../routes/_handlers.js";
import { SUPPORTED_LANGUAGES } from "../utils/i18n.js";
import { TOOLS } from "../utils/tool-registry.js";
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

// These former standalone tools are intentionally retained because their
// markup and scripts are embedded by network-reference or repo-ops.
const EMBEDDED_TOOL_IDS = [
  "dns-reference",
  "port-reference",
  "http-status-reference",
  "protocol-headers",
  "public-repos-yml-builder",
  "public-repos-not-automation",
  "review-description-generator",
];

function leafPaths(value, prefix = "", result = []) {
  for (const [key, child] of Object.entries(value ?? {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      leafPaths(child, path, result);
    } else {
      result.push(path);
    }
  }
  return result;
}

describe("complete locale catalog parity", () => {
  it("loads one catalog for every supported language", () => {
    expect(Object.keys(CATALOGS).sort()).toEqual(
      Object.keys(SUPPORTED_LANGUAGES).sort(),
    );
  });

  it("keeps exact nested leaf-key parity with English", () => {
    const englishLeaves = leafPaths(en).sort();
    expect(englishLeaves.length).toBeGreaterThan(2500);

    for (const [locale, catalog] of Object.entries(CATALOGS)) {
      expect(leafPaths(catalog).sort(), `${locale} leaf keys`).toEqual(
        englishLeaves,
      );
    }
  });

  it("has exactly 48 active tool entries plus seven embedded catalogs", () => {
    const activeIds = TOOLS.map((tool) => tool.id).sort();
    const expectedCatalogIds = [...activeIds, ...EMBEDDED_TOOL_IDS].sort();

    expect(activeIds).toHaveLength(48);
    expect(new Set(activeIds).size).toBe(48);
    for (const [locale, catalog] of Object.entries(CATALOGS)) {
      expect(Object.keys(catalog.tools).sort(), `${locale} tool entries`).toEqual(
        expectedCatalogIds,
      );
    }
  });

  it("keeps the 48 registry tools and generated handler map in lockstep", () => {
    const registryIds = TOOLS.map((tool) => tool.id).sort();
    expect(Object.keys(handlersById).sort()).toEqual(registryIds);
    for (const tool of TOOLS) {
      expect(typeof handlersById[tool.id], tool.id).toBe("function");
      expect(tool.path).toBe(`/${tool.id}`);
    }
  });
});
