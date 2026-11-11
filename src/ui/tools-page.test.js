import { describe, expect, it } from "vitest";
import { t } from "../utils/i18n.js";
import { TOOLS } from "../utils/tool-registry.js";
import { renderToolsPage } from "./tools-page.js";
import { TOOL_SYMBOLS, toolSymbol } from "./home-icons.js";

function countOccurrences(text, value) {
  return text.split(value).length - 1;
}

describe("renderToolsPage", () => {
  it("renders the catalog through the shared document shell once", async () => {
    const response = renderToolsPage({ lang: "en" });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(`<title>${t("catalog.meta.title", "en")} | SimpleTool</title>`);
    expect(html).toContain('<link rel="canonical" href="https://simpletool.app/tools">');
    expect(html).toContain('"@type":"ItemList"');
    expect(html).not.toContain('"@type":"WebSite"');
    expect(html).toContain("const heroSearch = document.getElementById('tool-search')");
    expect(html).not.toContain("keyboard-shortcuts-modal");
    expect(html).not.toContain("function copyToClipboard");
    expect(countOccurrences(html, "<!DOCTYPE html>")).toBe(1);
    expect(countOccurrences(html, "data-theme-bootstrap")).toBe(1);
    expect(countOccurrences(html, "data-i18n-bootstrap")).toBe(1);
    expect(countOccurrences(html, "data-bundled-stylesheet")).toBe(1);
    expect(countOccurrences(html, "serviceWorker.register")).toBe(1);
    expect(html).toContain('data-i18n="catalog.title"');
    expect(html).toContain("JSON.parse");
    expect(html).toContain('href="/json-formatter"');
    expect(html).toContain("material-symbols-rounded");
    // Versioned so a cache-first service worker cannot pin an old icon subset.
    expect(html).toMatch(/url\(\/fonts\/material-symbols\.woff2\?v=[0-9a-f]{16}\)/);
    expect(html).not.toContain('rel="prefetch" as="font"');
    expect(html).not.toContain("🔄 Formatters");
    // The section heading draws its own icon; a locale emoji doubled it.
    for (const lang of ["en", "ko", "ja", "es", "zh-CN", "zh-TW", "fr", "de", "pt", "vi"]) {
      for (const cat of ["formatters", "security", "network", "generators", "game", "utils"]) {
        expect(t(`home.cat.${cat}`, lang)).toMatch(/^[\p{L}\p{N}]/u);
      }
    }
    expect(html.indexOf('id="tool-search"')).toBeLessThan(
      html.indexOf('id="tools-categories-container"'),
    );
  });

  it("puts search in the header and uses Material tiles, not emoji", async () => {
    const html = await renderToolsPage({ lang: "en" }).text();
    const header = html.slice(
      html.indexOf("<header"),
      html.indexOf("</header>"),
    );
    expect(header).toContain("max-w-7xl");
    expect(header).toContain('id="tool-search"');
    expect(header).toContain("nav.searchTools");
    expect(html).not.toContain('id="nav-search-btn"');
    expect(html).toContain('href="/tools" data-i18n="shell.navTools" aria-current="page"');

    const jsonCard = html.slice(
      html.indexOf('data-tool-id="json-formatter"'),
      html.indexOf('data-tool-id="json-formatter"') + 900,
    );
    expect(jsonCard).toContain(toolSymbol("json-formatter"));
    expect(jsonCard).not.toContain("📋");
    expect(html).not.toContain("scale-110");
    const footer = html.slice(html.indexOf("<footer"), html.indexOf("</footer>"));
    expect(footer).not.toContain("📋");
  });

  it("maps every registered tool to a Material Symbols ligature", () => {
    for (const tool of TOOLS) {
      expect(TOOL_SYMBOLS[tool.id], tool.id).toBeTruthy();
      expect(toolSymbol(tool.id)).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it("keeps localized shell metadata", async () => {
    const html = await renderToolsPage({ lang: "ko" }).text();

    expect(html).toContain('<html lang="ko"');
    expect(html).toContain(`<title>${t("catalog.meta.title", "ko")} | SimpleTool</title>`);
    expect(html).toContain(
      '<link rel="canonical" href="https://simpletool.app/tools?lang=ko">',
    );
  });
});
