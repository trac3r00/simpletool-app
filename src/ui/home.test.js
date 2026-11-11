import { describe, expect, it } from "vitest";
import { t } from "../utils/i18n.js";
import { renderHomePage } from "./home.js";
import { toolSymbol } from "./home-icons.js";

function siteNavOf(html) {
  const start = html.indexOf('class="site-nav');
  return html.slice(start, html.indexOf("</ul>", start));
}

describe("renderHomePage (landing)", () => {
  it("introduces the product and hands off to the /tools catalog", async () => {
    const response = renderHomePage({ lang: "en" });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(`<title>${t("home.meta.title", "en")}</title>`);
    expect(html).toContain('<link rel="canonical" href="https://simpletool.app/">');
    expect(html).toContain('"@type":"WebSite"');
    expect(html).toContain('"target":"https://simpletool.app/tools?q={search_term_string}"');
    expect(html).not.toContain('"@type":"ItemList"');
    expect(html).toContain('<form class="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row" action="/tools" method="get" role="search">');
    expect(html).toContain('name="q" id="tool-search"');
    expect(html).toContain('data-i18n="home.popularTitle"');
    expect(html).toContain('data-i18n="home.whyTitle"');
    expect(html).toContain('data-i18n="home.categoriesTitle"');
    expect(html).toContain('href="/tools#category-formatters"');
    expect(html).not.toContain('id="tools-categories-container"');
    expect(html).not.toContain('id="home-editorial"');
    expect(html).not.toContain('id="nav-search-btn"');
    expect(html).toContain('<button type="submit" class="btn-primary h-12 px-5 text-base">');

    const jsonCard = html.slice(
      html.indexOf('data-tool-id="json-formatter"'),
      html.indexOf('data-tool-id="json-formatter"') + 900,
    );
    expect(jsonCard).toContain(toolSymbol("json-formatter"));
  });

  it("links Home, Tools, About, Blog and FAQ in the top bar and marks Home current", async () => {
    const siteNav = siteNavOf(await renderHomePage({ lang: "en" }).text());
    expect(siteNav).toContain('href="/" data-i18n="shell.navHome" aria-current="page"');
    expect(siteNav).toContain('href="/tools" data-i18n="shell.navTools">');
    for (const page of ["about", "blog", "faq"]) {
      expect(siteNav).toContain(`href="/${page}" data-i18n="footer.${page}"`);
    }
  });

  it("keeps the visitor's language in links, search and metadata", async () => {
    const html = await renderHomePage({ lang: "ko" }).text();

    expect(html).toContain('<html lang="ko"');
    expect(html).toContain(`<title>${t("home.meta.title", "ko")}</title>`);
    expect(html).toContain(
      '<link rel="canonical" href="https://simpletool.app/?lang=ko">',
    );
    expect(html).toContain(
      '<link rel="alternate" hreflang="en" href="https://simpletool.app/">',
    );
    expect(html).toContain('<input type="hidden" name="lang" value="ko">');
    expect(html).toContain(`>${t("home.ctaBrowse", "ko")}<`);
    const siteNav = siteNavOf(html);
    expect(siteNav).toContain(`href="/tools?lang=ko" data-i18n="shell.navTools">${t("shell.navTools", "ko")}<`);
    for (const page of ["about", "blog", "faq"]) {
      expect(siteNav).toContain(`href="/${page}?lang=ko" data-i18n="footer.${page}">${t(`footer.${page}`, "ko")}<`);
    }
  });
});
