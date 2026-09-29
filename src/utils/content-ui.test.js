import { describe, expect, it } from "vitest";
import { createRelatedToolsSection } from "./content-ui.js";
import { SUPPORTED_LANGUAGES, t } from "./i18n.js";
import { TOOLS } from "./tool-registry.js";

describe("related-tool card localization", () => {
  for (const lang of Object.keys(SUPPORTED_LANGUAGES)) {
    it(`renders valid card keys and catalog values for ${lang}`, () => {
      for (const tool of TOOLS) {
        const html = createRelatedToolsSection([tool], lang);
        expect(html).toContain(
          `href="${lang === "en" ? tool.path : `${tool.path}?lang=${lang}`}"`,
        );
        for (const [field, tag] of [["name", "h3"], ["desc", "p"]]) {
          const key = `tools.${tool.id}.${field}`;
          expect(html).toContain(`data-i18n="${key}"`);
          expect(html).toContain(`>${t(key, lang)}</${tag}>`);
        }
      }
    });
  }

  it("keeps the four-card limit and empty state", () => {
    expect(createRelatedToolsSection([])).toBe("");
    const html = createRelatedToolsSection(TOOLS.slice(0, 5));
    expect((html.match(/<a href=/g) || []).length).toBe(4);
  });
});
