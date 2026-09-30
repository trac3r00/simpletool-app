import { describe, it, expect } from "vitest";
import { runInNewContext } from "node:vm";
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_QUERY_KEY,
  normalizeLanguage,
  resolveRequestLanguage,
  withLanguageQuery,
  t,
  getToolTranslation,
  localizeTool,
  localizeTools,
  getLanguageBootstrapScript,
  getLanguageScript,
  getLanguageSelectorHTML,
} from "./i18n.js";
import en from "../i18n/en.js";
import ko from "../i18n/ko.js";
import ja from "../i18n/ja.js";
import es from "../i18n/es.js";
import zhCN from "../i18n/zh-CN.js";
import zhTW from "../i18n/zh-TW.js";
import fr from "../i18n/fr.js";
import de from "../i18n/de.js";
import pt from "../i18n/pt.js";
import vi from "../i18n/vi.js";

const LOCALE_MODULES = {
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

function extractLanguageCatalog(script) {
  const match = script.match(/var _T = ([\s\S]*?);\n\s*var _supported/);
  expect(match).not.toBeNull();
  return JSON.parse(match[1]);
}

describe("SUPPORTED_LANGUAGES", () => {
  it("contains 10 languages", () => {
    expect(Object.keys(SUPPORTED_LANGUAGES)).toHaveLength(10);
  });

  it("includes all expected language codes", () => {
    const codes = Object.keys(SUPPORTED_LANGUAGES);
    expect(codes).toEqual(
      expect.arrayContaining([
        "en",
        "ko",
        "ja",
        "es",
        "zh-CN",
        "zh-TW",
        "fr",
        "de",
        "pt",
        "vi",
      ]),
    );
  });

  it("each language has name and flag", () => {
    for (const [, lang] of Object.entries(SUPPORTED_LANGUAGES)) {
      expect(lang).toHaveProperty("name");
      expect(lang).toHaveProperty("flag");
      expect(typeof lang.name).toBe("string");
      expect(typeof lang.flag).toBe("string");
    }
  });
});

describe("DEFAULT_LANGUAGE", () => {
  it("is English", () => {
    expect(DEFAULT_LANGUAGE).toBe("en");
  });
});

describe("LANGUAGE_QUERY_KEY", () => {
  it('is "lang"', () => {
    expect(LANGUAGE_QUERY_KEY).toBe("lang");
  });
});

describe("normalizeLanguage", () => {
  it("returns default for null/undefined/empty", () => {
    expect(normalizeLanguage(null)).toBe("en");
    expect(normalizeLanguage(undefined)).toBe("en");
    expect(normalizeLanguage("")).toBe("en");
  });

  it("normalizes supported base languages", () => {
    expect(normalizeLanguage("en")).toBe("en");
    expect(normalizeLanguage("ko")).toBe("ko");
    expect(normalizeLanguage("ja")).toBe("ja");
    expect(normalizeLanguage("fr")).toBe("fr");
    expect(normalizeLanguage("de")).toBe("de");
    expect(normalizeLanguage("pt")).toBe("pt");
    expect(normalizeLanguage("vi")).toBe("vi");
    expect(normalizeLanguage("es")).toBe("es");
  });

  it("normalizes Chinese variants correctly", () => {
    expect(normalizeLanguage("zh-CN")).toBe("zh-CN");
    expect(normalizeLanguage("zh-TW")).toBe("zh-TW");
    expect(normalizeLanguage("zh-Hant")).toBe("zh-TW");
    expect(normalizeLanguage("zh")).toBe("zh-CN");
    expect(normalizeLanguage("zh_tw")).toBe("zh-TW");
    expect(normalizeLanguage("zh_cn")).toBe("zh-CN");
  });

  it("is case-insensitive", () => {
    expect(normalizeLanguage("EN")).toBe("en");
    expect(normalizeLanguage("Ko")).toBe("ko");
    expect(normalizeLanguage("ZH-TW")).toBe("zh-TW");
  });

  it("handles hyphenated locale strings", () => {
    expect(normalizeLanguage("en-US")).toBe("en");
    expect(normalizeLanguage("ko-KR")).toBe("ko");
    expect(normalizeLanguage("ja-JP")).toBe("ja");
  });

  it("returns default for unsupported languages", () => {
    expect(normalizeLanguage("xx")).toBe("en");
    expect(normalizeLanguage("ru")).toBe("en");
    expect(normalizeLanguage("ar")).toBe("en");
  });

  it("trims whitespace", () => {
    expect(normalizeLanguage("  ko  ")).toBe("ko");
  });
});

describe("resolveRequestLanguage", () => {
  function makeRequest(acceptLanguage) {
    return {
      headers: {
        get: (name) => (name === "Accept-Language" ? acceptLanguage : null),
      },
    };
  }

  function makeUrl(langParam) {
    const url = new URL("https://simpletool.app/json-formatter");
    if (langParam) url.searchParams.set("lang", langParam);
    return url;
  }

  it("prefers query parameter over Accept-Language", () => {
    const req = makeRequest("ja");
    const url = makeUrl("ko");
    expect(resolveRequestLanguage(req, url)).toBe("ko");
  });

  it("falls back to Accept-Language when no query param", () => {
    const req = makeRequest("ja,en;q=0.9");
    const url = makeUrl(null);
    expect(resolveRequestLanguage(req, url)).toBe("ja");
  });

  it("returns default when unsupported language normalizes to en", () => {
    // normalizeLanguage('ru') returns 'en' (default), which is a valid supported language
    const req = makeRequest("ru,ko;q=0.8");
    const url = makeUrl(null);
    expect(resolveRequestLanguage(req, url)).toBe("en");
  });

  it("picks first supported language from Accept-Language", () => {
    const req = makeRequest("ko,ja;q=0.9");
    const url = makeUrl(null);
    expect(resolveRequestLanguage(req, url)).toBe("ko");
  });

  it("returns default when no language matches", () => {
    const req = makeRequest("ru,ar");
    const url = makeUrl(null);
    expect(resolveRequestLanguage(req, url)).toBe("en");
  });

  it("handles null request and url", () => {
    expect(resolveRequestLanguage(null, null)).toBe("en");
  });

  it("normalizes query parameter", () => {
    const req = makeRequest("");
    const url = makeUrl("zh-Hant");
    expect(resolveRequestLanguage(req, url)).toBe("zh-TW");
  });
});

describe("withLanguageQuery", () => {
  it("returns path unchanged for default language", () => {
    expect(withLanguageQuery("/json-formatter", "en")).toBe("/json-formatter");
  });

  it("appends lang query for non-default language", () => {
    expect(withLanguageQuery("/json-formatter", "ko")).toBe(
      "/json-formatter?lang=ko",
    );
  });

  it("returns external URLs unchanged", () => {
    expect(withLanguageQuery("https://example.com", "ko")).toBe(
      "https://example.com",
    );
  });

  it("returns mailto links unchanged", () => {
    expect(withLanguageQuery("mailto:test@test.com", "ko")).toBe(
      "mailto:test@test.com",
    );
  });

  it("returns hash links unchanged", () => {
    expect(withLanguageQuery("#section", "ko")).toBe("#section");
  });

  it("returns empty/null path unchanged", () => {
    expect(withLanguageQuery("", "ko")).toBe("");
    expect(withLanguageQuery(null, "ko")).toBe(null);
  });

  it("preserves existing query params", () => {
    const result = withLanguageQuery("/path?foo=bar", "ko");
    expect(result).toContain("foo=bar");
    expect(result).toContain("lang=ko");
  });

  it("preserves hash fragment", () => {
    const result = withLanguageQuery("/path#section", "ko");
    expect(result).toContain("lang=ko");
    expect(result).toContain("#section");
  });
});

describe("t (translate)", () => {
  it("returns English translation for known path", () => {
    const result = t("nav.home", "en");
    expect(typeof result).toBe("string");
    expect(result).not.toBe("nav.home");
  });

  it("returns the path string for unknown keys", () => {
    expect(t("totally.fake.key", "en")).toBe("totally.fake.key");
  });

  it("falls back to English for missing keys in other languages", () => {
    const enResult = t("nav.home", "en");
    const koResult = t("nav.home", "ko");
    expect(typeof koResult).toBe("string");
    expect(koResult).not.toBe("nav.home");
    // Both should resolve (not return the path key)
    expect(enResult).not.toBe("nav.home");
  });
});

describe("getToolTranslation", () => {
  it("returns translation for known tool in English", () => {
    const result = getToolTranslation("json-formatter", "en");
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("name");
  });

  it("returns null for unknown tool", () => {
    const result = getToolTranslation("nonexistent-tool", "en");
    expect(result).toBeNull();
  });
});

describe("composite tool translations", () => {
  it("defines canonical metadata and tab labels in every locale module", () => {
    expect(Object.keys(LOCALE_MODULES)).toEqual(
      Object.keys(SUPPORTED_LANGUAGES),
    );

    for (const [lang, locale] of Object.entries(LOCALE_MODULES)) {
      const network = locale.tools["network-reference"];
      const repoOps = locale.tools["repo-ops"];

      expect(network, `${lang} network-reference`).toMatchObject({
        name: expect.any(String),
        desc: expect.any(String),
        ui: {
          tab0: expect.any(String),
          tab1: expect.any(String),
          tab2: expect.any(String),
          tab3: expect.any(String),
          aria0: expect.any(String),
        },
      });
      expect(Object.keys(network.ui)).toEqual([
        "tab0",
        "tab1",
        "tab2",
        "tab3",
        "aria0",
      ]);
      expect(repoOps, `${lang} repo-ops`).toMatchObject({
        name: expect.any(String),
        desc: expect.any(String),
        ui: {
          tab0: expect.any(String),
          tab1: expect.any(String),
          tab2: expect.any(String),
          aria0: expect.any(String),
        },
      });
      expect(Object.keys(repoOps.ui)).toEqual([
        "tab0",
        "tab1",
        "tab2",
        "aria0",
      ]);

      for (const value of [
        network.name,
        network.desc,
        ...Object.values(network.ui),
        repoOps.name,
        repoOps.desc,
        ...Object.values(repoOps.ui),
      ]) {
        expect(
          value.trim(),
          `${lang} has a blank composite translation`,
        ).not.toBe("");
      }

      if (lang !== DEFAULT_LANGUAGE) {
        expect(network.name).not.toBe(
          LOCALE_MODULES[DEFAULT_LANGUAGE].tools["network-reference"].name,
        );
        expect(repoOps.name).not.toBe(
          LOCALE_MODULES[DEFAULT_LANGUAGE].tools["repo-ops"].name,
        );
      }
    }
  });

  it("keeps the approved English source strings", () => {
    expect(en.tools["network-reference"]).toEqual({
      name: "Network Reference",
      desc: "DNS records, common ports, HTTP status codes, and protocol headers — four references in one tabbed tool.",
      ui: {
        tab0: "DNS records",
        tab1: "Ports",
        tab2: "HTTP status",
        tab3: "Protocol headers",
        aria0: "Network reference sections",
      },
    });
    expect(en.tools["repo-ops"]).toEqual({
      name: "Repo Operations",
      desc: "Build public repository inventories, manual-stewardship records, and review descriptions in one workspace.",
      ui: {
        tab0: "Repository inventory",
        tab1: "Manual stewardship",
        tab2: "Review descriptions",
        aria0: "Repository operations sections",
      },
    });
  });
});

describe("localizeTool", () => {
  it("applies translation to tool object", () => {
    const tool = {
      id: "json-formatter",
      name: "Original",
      description: "Original desc",
    };
    const result = localizeTool(tool, "en");
    expect(result.id).toBe("json-formatter");
    expect(typeof result.name).toBe("string");
  });

  it("returns copy of tool when no translation exists", () => {
    const tool = { id: "nonexistent", name: "Test", description: "Desc" };
    const result = localizeTool(tool, "en");
    expect(result).toEqual(tool);
    expect(result).not.toBe(tool); // should be a copy
  });
});

describe("localizeTools", () => {
  it("localizes an array of tools", () => {
    const tools = [
      { id: "json-formatter", name: "JSON", description: "Format JSON" },
      { id: "nonexistent", name: "Test", description: "Desc" },
    ];
    const result = localizeTools(tools, "en");
    expect(result).toHaveLength(2);
  });

  it("handles null/empty input", () => {
    expect(localizeTools(null, "en")).toEqual([]);
    expect(localizeTools([], "en")).toEqual([]);
  });
});

describe("getLanguageBootstrapScript", () => {
  it("returns a script tag", () => {
    const script = getLanguageBootstrapScript();
    expect(script).toContain("<script");
    expect(script).toContain("data-i18n-bootstrap");
  });

  it("includes supported languages", () => {
    const script = getLanguageBootstrapScript();
    expect(script).toContain("zh-CN");
    expect(script).toContain("zh-TW");
  });
});

describe("getLanguageScript", () => {
  it("preserves the canonical-only full dictionary behavior by default", () => {
    const catalog = extractLanguageCatalog(
      getLanguageScript("dns-reference", "en"),
    );

    expect(catalog.en.tools["dns-reference"]).toHaveProperty("ui");
    expect(catalog.en.tools["dns-reference"]).toHaveProperty("js");
    expect(catalog.en.tools["port-reference"]).not.toHaveProperty("ui");
    expect(catalog.en.tools["port-reference"]).not.toHaveProperty("js");
  });

  it("retains full dictionaries only for the canonical and allowlisted tools", () => {
    const embeddedToolIds = [
      "dns-reference",
      "port-reference",
      "http-status-reference",
      "protocol-headers",
    ];
    const catalog = extractLanguageCatalog(
      getLanguageScript("network-reference", "ja", embeddedToolIds),
    );

    for (const lang of ["en", "ja"]) {
      expect(catalog[lang].tools["network-reference"]).toHaveProperty("ui");
      for (const toolId of [
        "dns-reference",
        "port-reference",
        "protocol-headers",
      ]) {
        expect(catalog[lang].tools[toolId], `${lang} ${toolId}`).toHaveProperty(
          "ui",
        );
        expect(catalog[lang].tools[toolId], `${lang} ${toolId}`).toHaveProperty(
          "js",
        );
      }
      expect(catalog[lang].tools["json-formatter"]).not.toHaveProperty("ui");
      expect(catalog[lang].tools["json-formatter"]).not.toHaveProperty("js");
    }
  });
});

describe("getLanguageSelectorHTML", () => {
  it("returns HTML with language options", () => {
    const html = getLanguageSelectorHTML("en");
    expect(html).toContain('data-lang="en"');
    expect(html).toContain('data-lang="ko"');
    expect(html).toContain('aria-haspopup="true"');
  });

  it("marks current language as active", () => {
    const html = getLanguageSelectorHTML("ko");
    expect(html).toContain("font-semibold");
  });

  it("marks only the current language as active", () => {
    const html = getLanguageSelectorHTML("ko");
    const active = [...html.matchAll(/data-lang="([a-zA-Z-]+)"[^>]*/g)].filter(
      (match) => match[0].includes("font-semibold"),
    );

    expect(active).toHaveLength(1);
    expect(active[0][1]).toBe("ko");
    expect(html).toContain('aria-current="true"');
  });
});

/**
 * A locale change has to be one transaction: title, meta, html[lang],
 * aria-labels and server-only prose (blog article bodies carry no data-i18n
 * keys) must all agree afterwards. Only the server can restate all of that, so
 * both the switcher and the load-time reconciliation navigate rather than
 * patch. These tests execute the emitted scripts to prove the navigation
 * happens — asserting on the source text would not.
 */
describe("locale changes are atomic", () => {
  function scriptBody(html) {
    const match = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    return match[1];
  }

  function createBrowser({ href, stored }) {
    const calls = { assign: [], replace: [] };
    const storage = new Map();
    if (stored) storage.set("language", stored);
    const url = new URL(href);
    const patched = {
      key: "footer.privacy",
      textContent: "SERVER RENDERED",
      getAttribute: (name) => (name === "data-i18n" ? "footer.privacy" : null),
    };

    const location = {
      href: url.href,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      assign: (next) => calls.assign.push(next),
      replace: (next) => calls.replace.push(next),
    };

    return {
      calls,
      patched,
      storage,
      sandbox: {
        URL,
        URLSearchParams,
        navigator: { language: "ja" },
        localStorage: {
          getItem: (key) => storage.get(key) ?? null,
          setItem: (key, value) => storage.set(key, String(value)),
        },
        document: {
          documentElement: { lang: "" },
          body: { getAttribute: () => null },
          querySelectorAll: (selector) =>
            selector === "[data-i18n]" ? [patched] : [],
          querySelector: () => null,
          addEventListener: () => {},
        },
        window: {
          location,
          history: { pushState: () => {} },
          addEventListener: () => {},
        },
      },
    };
  }

  describe("getLanguageBootstrapScript", () => {
    it("re-requests the page when the stored locale is not the rendered one", () => {
      const browser = createBrowser({
        href: "https://simpletool.app/blog/some-article",
        stored: "es",
      });

      runInNewContext(
        scriptBody(getLanguageBootstrapScript("en")),
        browser.sandbox,
      );

      expect(browser.calls.replace).toEqual(["/blog/some-article?lang=es"]);
    });

    it("does not re-request when the URL already names a locale", () => {
      const browser = createBrowser({
        href: "https://simpletool.app/?lang=en",
        stored: "es",
      });

      runInNewContext(
        scriptBody(getLanguageBootstrapScript("en")),
        browser.sandbox,
      );

      expect(browser.calls.replace).toEqual([]);
      expect(browser.sandbox.document.documentElement.lang).toBe("en");
    });

    it("does not re-request for a visitor with no stored preference", () => {
      const browser = createBrowser({ href: "https://simpletool.app/" });

      runInNewContext(
        scriptBody(getLanguageBootstrapScript("es")),
        browser.sandbox,
      );

      expect(browser.calls.replace).toEqual([]);
      expect(browser.sandbox.document.documentElement.lang).toBe("es");
    });
  });

  describe("setLanguage", () => {
    it("navigates instead of patching the reachable half of the page", () => {
      const browser = createBrowser({
        href: "https://simpletool.app/json-formatter?lang=es",
      });

      runInNewContext(
        scriptBody(getLanguageScript("json-formatter", "es")),
        browser.sandbox,
      );
      browser.sandbox.window.setLanguage("en");

      expect(browser.calls.assign).toEqual([
        "https://simpletool.app/json-formatter?lang=en",
      ]);
      expect(browser.patched.textContent).toBe("SERVER RENDERED");
      expect(browser.storage.get("language")).toBe("en");
    });

    it("keeps lang=en explicit so Accept-Language cannot override the choice", () => {
      const browser = createBrowser({
        href: "https://simpletool.app/?lang=es",
      });

      runInNewContext(
        scriptBody(getLanguageScript(null, "es")),
        browser.sandbox,
      );
      browser.sandbox.window.setLanguage("en");

      expect(browser.calls.assign[0]).toContain(`${LANGUAGE_QUERY_KEY}=en`);
    });

    it("preserves the rest of the query string and the path", () => {
      const browser = createBrowser({
        href: "https://simpletool.app/repo-ops?tab=gitignore&lang=en",
      });

      runInNewContext(
        scriptBody(getLanguageScript("repo-ops", "en")),
        browser.sandbox,
      );
      browser.sandbox.window.setLanguage("ja");

      const next = new URL(browser.calls.assign[0]);
      expect(next.pathname).toBe("/repo-ops");
      expect(next.searchParams.get("tab")).toBe("gitignore");
      expect(next.searchParams.get("lang")).toBe("ja");
    });

    it("ignores an unsupported locale", () => {
      const browser = createBrowser({ href: "https://simpletool.app/" });

      runInNewContext(
        scriptBody(getLanguageScript(null, "en")),
        browser.sandbox,
      );
      browser.sandbox.window.setLanguage("xx");

      expect(browser.calls.assign).toEqual([]);
      expect(browser.storage.has("language")).toBe(false);
    });

    it("falls back to an in-place patch where navigation is unavailable", () => {
      const browser = createBrowser({
        href: "https://simpletool.app/?lang=ja",
      });
      delete browser.sandbox.window.location.assign;

      runInNewContext(
        scriptBody(getLanguageScript(null, "ja")),
        browser.sandbox,
      );
      browser.sandbox.window.setLanguage("en");

      expect(browser.patched.textContent).toBe(t("footer.privacy", "en"));
      expect(browser.sandbox.document.documentElement.lang).toBe("en");
    });
  });
});
