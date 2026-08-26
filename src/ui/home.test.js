import { describe, expect, it } from "vitest";
import { t } from "../utils/i18n.js";
import { renderHomePage } from "./home.js";

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
  });
});
