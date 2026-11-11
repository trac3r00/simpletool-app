import { describe, expect, it } from "vitest";
import { t } from "../utils/i18n.js";
import { TOOLS } from "../utils/tool-registry.js";
import { renderHomePage } from "./home.js";
import { TOOL_SYMBOLS, toolSymbol } from "./home-icons.js";

function countOccurrences(text, value) {
  return text.split(value).length - 1;
}

describe("renderHomePage", () => {
  it("renders the homepage through the shared document shell once", async () => {
    const response = renderHomePage({ lang: "en" });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(`<title>${t("home.meta.title", "en")}</title>`);
    expect(html).not.toContain(
      `<title>${t("home.meta.title", "en")} | SimpleTool</title>`,
    );
    expect(html).toContain(
      `<meta name="keywords" content="${t("home.meta.keywords", "en")}">`,
    );
    expect(html).toContain('<link rel="canonical" href="https://simpletool.app/">');
    expect(html).toContain('"@type":"WebSite"');
    expect(html).toContain('"@type":"ItemList"');
    expect(html).toContain("const heroSearch = document.getElementById('tool-search')");
    expect(html).not.toContain("keyboard-shortcuts-modal");
    expect(html).not.toContain("function copyToClipboard");
    expect(countOccurrences(html, "<!DOCTYPE html>")).toBe(1);
    expect(countOccurrences(html, "data-theme-bootstrap")).toBe(1);
    expect(countOccurrences(html, "data-i18n-bootstrap")).toBe(1);
    expect(countOccurrences(html, "data-bundled-stylesheet")).toBe(1);
    expect(countOccurrences(html, "serviceWorker.register")).toBe(1);
    // The editorial block was removed; site pages are linked from the top bar.
    expect(html).not.toContain('id="home-editorial"');
    const siteNav = html.slice(html.indexOf('class="site-nav'), html.indexOf("</ul>", html.indexOf('class="site-nav')));
    for (const page of ["about", "blog", "faq"]) {
      expect(siteNav).toContain(`href="/${page}" data-i18n="footer.${page}"`);
    }
    expect(html).toContain("JSON.parse");
    expect(html).toContain("Developer tools that stay in the browser");
    expect(html).toContain('data-i18n="home.trustClient"');
    expect(html).toContain('href="/json-formatter"');
    expect(html).toContain("material-symbols-rounded");
    // Versioned so a cache-first service worker cannot pin an old icon subset.
    expect(html).toMatch(/url\(\/fonts\/material-symbols\.woff2\?v=[0-9a-f]{16}\)/);
    expect(html).not.toContain('rel="prefetch" as="font"');
    expect(html).not.toContain("🔄 Formatters");
    // The section heading draws its own icon; a locale emoji doubled it.
    for (const lang of ["ko", "ja", "es", "zh-CN", "zh-TW", "fr", "de", "pt", "vi"]) {
      for (const cat of ["formatters", "security", "network", "generators", "game", "utils"]) {
        expect(t(`home.cat.${cat}`, lang)).toMatch(/^[\p{L}\p{N}]/u);
      }
    }
    expect(html.indexOf('id="tools-categories-container"')).toBeLessThan(
      html.indexOf('id="home-below-catalog"'),
    );
    expect(html.indexOf('id="tool-search"')).toBeLessThan(
      html.indexOf('id="tools-categories-container"'),
    );
  });

  it("aligns the hero with the catalog and uses Material tiles, not emoji", async () => {
    const html = await renderHomePage({ lang: "en" }).text();
    const header = html.slice(
      html.indexOf("<header"),
      html.indexOf("</header>"),
    );
    expect(header).toContain("max-w-7xl");
    expect(header).toContain('id="tool-search"');
    expect(header).toContain('data-i18n-aria="home.flagshipsNav"');
    expect(header).not.toContain("person_off");
    expect(header).toContain("nav.searchTools");
    expect(html).not.toContain('id="nav-search-btn"');
    expect(html).toContain('id="home-below-catalog"');

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

  it("keeps localized shell metadata and alternate links", async () => {
    const html = await renderHomePage({ lang: "ko" }).text();

    expect(html).toContain('<html lang="ko"');
    expect(html).toContain(`<title>${t("home.meta.title", "ko")}</title>`);
    expect(html).toContain(
      '<link rel="canonical" href="https://simpletool.app/?lang=ko">',
    );
    expect(html).toContain(
      '<link rel="alternate" hreflang="en" href="https://simpletool.app/">',
    );
    // Top-bar site links keep the visitor's language.
    const siteNav = html.slice(html.indexOf('class="site-nav'), html.indexOf("</ul>", html.indexOf('class="site-nav')));
    for (const page of ["about", "blog", "faq"]) {
      expect(siteNav).toContain(`href="/${page}?lang=ko" data-i18n="footer.${page}">${t(`footer.${page}`, "ko")}<`);
    }
  });
});
