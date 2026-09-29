import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { t, SUPPORTED_LANGUAGES } from "../utils/i18n.js";
import { getLegalSections } from "./legal-content.js";
import { getFaqEntries } from "./faq-content.js";
import { getLocalizedBlogArticle } from "./blog-content-locales.js";
import {
  REVIEWED_CONTENT_LOCALES,
  REVIEWED_LEGAL_CONTENT,
} from "./generated-content-locales.js";
import {
  BLOG_ARTICLES,
  handleBlogRoutes,
  renderBlogPostPage,
  RETIRED_BLOG_REDIRECTS,
} from "./blog.js";
import {
  AD_SCRIPT_PATHS,
  AD_SCRIPT_PREFIXES,
  ALLOW_SLOT_KEYS,
  DENY_AD_PATHS,
  LEGAL_AD_PATHS,
  getAdPolicySnapshot,
  pageAllowsAdScript,
} from "../utils/ads.js";
import {
  PRODUCTION_TOOL_COUNT,
  TOOLS,
  getToolsForEnvironment,
} from "../utils/tool-registry.js";
import { handlersById } from "../routes/_handlers.js";
import { renderPrivacyPage, renderTermsPage } from "./legal-pages.js";
import { renderFaqPage } from "./faq.js";
import { withLanguageQuery } from "../utils/i18n.js";

const LANGS = Object.keys(SUPPORTED_LANGUAGES);

const GAME_POSITIONING = /marble roulette|marble-roulette|roulette à billes|마블 룰렛|マーブルルーレット|弹珠轮盘|彈珠輪盤/i;

const VAPOR_ENTERPRISE =
  /white-label|white label|화이트라벨|ホワイトラベル|白標|nhãn trắng|enterprise licensing|enterprise & partnership|엔터프라이즈 라이선스|cấp phép doanh nghiệp/i;

const ABSOLUTE_NO_TRACKING =
  /no tracking|never track|without surveillance|추적 없음|トラッキングなし|never leaves your (device|browser|machine)|no data is sent to any server|nothing (ever )?leaves your (device|browser)|0 bytes stored|100% (client-side|private)|(^|[^\d])0 (tool )?(inputs|bytes|data)( \w+)? stored|zero (tool )?inputs stored|nothing is (sent|uploaded|transmitted)|zero data exposure|no data (ever )?leaves/i;



/**
 * Renders markup down to the text a reader actually sees.
 *
 * The absolutist-claim guard used to match against RAW html, so a claim split
 * across elements — `<div>100%</div><div>Client-Side</div>` — never matched
 * /100% client-side/ and shipped to the About page anyway. Tags collapse to a
 * space (not to nothing) so "100%</div><div>Client-Side" becomes
 * "100% Client-Side" rather than "100%Client-Side".
 */
function visibleText(html) {
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function flattenLegal(pageId, lang = "en") {
  return getLegalSections(pageId, lang)
    .flatMap((section) => [
      section.heading || "",
      ...(section.paragraphs || []),
      ...(section.list || []),
      visibleText(section.html || ""),
    ])
    .join("\n");
}

function flattenFaq(lang = "en") {
  return getFaqEntries(lang)
    .flatMap((entry) => [visibleText(entry.question), visibleText(entry.answer)])
    .join("\n");
}

describe("homepage catalog copy", () => {
  it("does not pitch marble roulette or leftover games in homepage meta", () => {
    for (const lang of LANGS) {
      const description = t("home.meta.description", lang);
      const hero = `${t("home.heroLine1", lang)} ${t("home.heroLine2", lang)}`;
      expect(description, lang).not.toMatch(GAME_POSITIONING);
      expect(hero, lang).not.toMatch(GAME_POSITIONING);
    }
  });

  it("describes the actual developer-tool catalog", () => {
    const description = t("home.meta.description", "en").toLowerCase();
    expect(description).toMatch(/json/);
    expect(description).toMatch(/password|jwt|token|regex|cron|curl|cidr/);
    expect(description).not.toMatch(/dozens more utilities/);
  });
});

describe("ads vs no-tracking story", () => {
  it("does not claim absolute no-tracking on homepage, about, privacy, or FAQ", () => {
    for (const lang of LANGS) {
      const hero = `${t("home.heroLine1", lang)} ${t("home.heroLine2", lang)}`;
      expect(hero, `hero ${lang}`).not.toMatch(ABSOLUTE_NO_TRACKING);
    }
    expect(flattenLegal("about", "en")).not.toMatch(ABSOLUTE_NO_TRACKING);
    expect(flattenLegal("privacy", "en")).not.toMatch(ABSOLUTE_NO_TRACKING);
    expect(flattenFaq("en")).not.toMatch(ABSOLUTE_NO_TRACKING);
  });

  /**
   * Every page that can serve an ad is checked, not just about+privacy.
   * LEGAL_AD_PATHS is the source of truth for which those are, so this cannot
   * drift out of sync with the ad config the way a hardcoded list would.
   */
  it("does not claim absolute no-tracking on ANY ad-serving legal page", () => {
    for (const adPath of LEGAL_AD_PATHS) {
      const pageId = adPath.replace(/^\//, "");
      const text = flattenLegal(pageId, "en");
      if (!text.trim()) continue; // not a LEGAL_CONTENT page (e.g. /changelog)
      expect(text, `${adPath} absolutist claim`).not.toMatch(ABSOLUTE_NO_TRACKING);
    }
  });

  /**
   * Ads run on an allow list, so the About page must SAY SO — in every
   * language, not just English.
   *
   * This exists because the guard used to check `en` only. The English copy
   * was reconciled to disclose ads while ko/zh-CN/zh-TW/fr/de/pt/vi kept an
   * older sentence promising users could work "without surveillance" with no
   * ads disclosure at all — a claim the AdSense allow list contradicts. Seven
   * locales shipped that for as long as the guard was English-only.
   */
  const ADS_DISCLOSED = {
    en: /ads?\b|advertis/i,
    ko: /광고|ads?\b|advertis/i,
    ja: /広告|ads?\b|advertis/i,
    es: /anuncio|publicidad/i,
    "zh-CN": /广告|ads?\b|advertis/i,
    "zh-TW": /廣告|ads?\b|advertis/i,
    fr: /publicit|annonce|ads?\b|advertis/i,
    de: /anzeige|werbe|ads?\b|advertis/i,
    pt: /an[úu]ncio|publicidade|ads?\b|advertis/i,
    vi: /qu[ảa]ng c[áa]o|ads?\b|advertis/i,
  };

  it("discloses advertising on the about page in every language", () => {
    for (const lang of LANGS) {
      const pattern = ADS_DISCLOSED[lang];
      expect(pattern, `no ads pattern defined for ${lang}`).toBeTruthy();
      expect(flattenLegal("about", lang), `about ${lang} must disclose ads`).toMatch(
        pattern,
      );
    }
  });

  /**
   * The regex above was previously only pointed at the hero, legal pages, and
   * FAQ — none of the surfaces that actually carried absolutist claims. Tool
   * routes and blog articles are where the copy lives, so they are scanned
   * here. Text is taken from rendered HTML with tags stripped, so a claim is
   * caught wherever it appears in visible copy.
   */
  /**
   * Visible copy is not only text nodes: tooltips, titles, aria-labels and
   * placeholders are read by users too, and an earlier version of this helper
   * threw them away with the tags — which made the scan pass on a claim that
   * was plainly visible on the page. Attribute values are collected first,
   * then the remaining markup is reduced to its text.
   */
  const VISIBLE_ATTRS =
    /(?:title|aria-label|data-tooltip|placeholder)="([^"]*)"/gi;

  const stripTags = (html) => {
    const body = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ");
    const attrs = [...body.matchAll(VISIBLE_ATTRS)].map((m) => m[1]).join(" ");
    const text = body.replace(/<[^>]+>/g, " ");
    return `${text} ${attrs}`.replace(/&amp;/g, "&").replace(/\s+/g, " ");
  };

  it("makes no absolutist privacy claim on any tool page", async () => {
    const offenders = [];
    let scanned = 0;
    for (const tool of TOOLS) {
      const handler = handlersById[tool.id];
      if (!handler) continue;
      const url = new URL(`https://simpletool.app${tool.path}`);
      const response = await handler(new Request(url, { method: "GET" }), url);
      if (response.status !== 200) continue;
      const text = stripTags(await response.text());
      const match = text.match(ABSOLUTE_NO_TRACKING);
      if (match) offenders.push(`${tool.path}: "${match[0]}"`);
      scanned += 1;
    }
    expect(scanned).toBe(TOOLS.length);
    expect(offenders).toEqual([]);
  });

  it("makes no absolutist privacy claim in any blog article", async () => {
    const offenders = [];
    let scanned = 0;
    for (const article of BLOG_ARTICLES) {
      const response = renderBlogPostPage(article.slug, "en");
      if (!response || response.status !== 200) continue;
      scanned += 1;
      const match = stripTags(await response.text()).match(
        ABSOLUTE_NO_TRACKING,
      );
      if (match) offenders.push(`${article.slug}: "${match[0]}"`);
    }
    expect(scanned).toBe(BLOG_ARTICLES.length);
    expect(offenders).toEqual([]);
  });

  it("says labeled non-personalized ads may exist and password/keys stay ad-free", () => {
    const hero = t("home.heroLine2", "en").toLowerCase();
    const about = flattenLegal("about", "en").toLowerCase();
    const privacy = flattenLegal("privacy", "en").toLowerCase();
    const faq = flattenFaq("en").toLowerCase();

    expect(hero).toMatch(/ad/);
    expect(about).toMatch(/ad/);
    expect(privacy).toMatch(/non-personalized|nonpersonalized|allow-list|allow list/);
    expect(faq).toMatch(/ad/);
    expect(`${hero}\n${about}\n${privacy}\n${faq}`).toMatch(
      /password|ssh|key/,
    );
    expect(`${hero}\n${about}\n${privacy}\n${faq}`).toMatch(/ad-free|never load ad/);
  });

  it("does not add AdSense inventory beyond the existing allow list", () => {
    expect([...ALLOW_SLOT_KEYS]).toEqual(["home", "json", "legal"]);
    expect(DENY_AD_PATHS).toEqual(
      expect.arrayContaining([
        "/password-generator",
        "/ssh-key-generator",
        "/token-studio",
      ]),
    );
    expect([...LEGAL_AD_PATHS]).toEqual([
      "/about",
      "/privacy",
      "/terms",
      "/changelog",
    ]);
  });

  const NO_ADS_NOW = /現在広告は掲載しておらず|ahora mismo no mostramos|ahora mismo no cargamos|当前不投放|当前也不加载|目前不投放|目前也不載入|pour le moment|ne chargeons actuellement|Derzeit schalten wir keine|laden derzeit keine|No momento não exibimos|atualmente não carregamos|Hiện chúng tôi không phục vụ|hiện không tải script quảng cáo|広告・分析ベンダーなし|Sin proveedores de publicidad|无广告或分析服务商|無廣告或分析服務商|Aucun prestataire publicitaire|Keine Werbe- oder Analyseanbieter|Nenhum fornecedor de publicidade|Không có nhà cung cấp quảng cáo/i;

  it("does not claim ads are off on terms or privacy in any language", () => {
    for (const lang of LANGS) {
      expect(flattenLegal("terms", lang), `terms ${lang}`).not.toMatch(
        NO_ADS_NOW,
      );
      expect(flattenLegal("privacy", lang), `privacy ${lang}`).not.toMatch(
        NO_ADS_NOW,
      );
    }
  });

  it("names AdSense cookies and an opt-out on the privacy policy in every language", () => {
    for (const lang of LANGS) {
      const text = flattenLegal("privacy", lang);
      expect(text, `privacy ${lang} AdSense`).toMatch(/AdSense|애드센스/i);
      expect(text, `privacy ${lang} cookie`).toMatch(/cookie|쿠키/i);
      expect(text, `privacy ${lang} opt-out`).toMatch(
        /adssettings\.google\.com/,
      );
      expect(text, `privacy ${lang} aboutads`).toMatch(/aboutads\.info/);
    }
  });
});

describe("vapor enterprise copy", () => {
  it("removes white-label and enterprise-licensing language from contact and about", () => {
    for (const lang of LANGS) {
      expect(flattenLegal("contact", lang), `contact ${lang}`).not.toMatch(
        VAPOR_ENTERPRISE,
      );
      expect(flattenLegal("about", lang), `about ${lang}`).not.toMatch(
        VAPOR_ENTERPRISE,
      );
    }
    const contactHeadings = getLegalSections("contact", "en").map(
      (section) => section.heading || "",
    );
    expect(contactHeadings.join("\n")).not.toMatch(/enterprise/i);
    const aboutHeadings = getLegalSections("about", "en").map(
      (section) => section.heading || "",
    );
    expect(aboutHeadings.join("\n")).not.toMatch(/for enterprises/i);
  });
});

describe("retired blog twins", () => {
  it("removed the weaker duplicates from the article list", () => {
    for (const slug of Object.keys(RETIRED_BLOG_REDIRECTS)) {
      expect(BLOG_ARTICLES.some((a) => a.slug === slug), slug).toBe(false);
    }
  });

  it("301s each retired slug to its successor", () => {
    for (const [slug, target] of Object.entries(RETIRED_BLOG_REDIRECTS)) {
      const url = new URL(`https://simpletool.app/blog/${slug}`);
      const res = handleBlogRoutes(new Request(url), url);
      expect(res?.status, slug).toBe(301);
      expect(res.headers.get("Location"), slug).toBe(
        `https://simpletool.app${target}`,
      );
    }
  });

  it("keeps every redirect target resolvable", () => {
    for (const target of Object.values(RETIRED_BLOG_REDIRECTS)) {
      if (target.startsWith("/blog/")) {
        expect(
          BLOG_ARTICLES.some((a) => `/blog/${a.slug}` === target),
          target,
        ).toBe(true);
      }
    }
  });
});

describe("content route contracts", () => {
  it("keeps all eleven article routes renderable", async () => {
    expect(BLOG_ARTICLES).toHaveLength(11);
    for (const article of BLOG_ARTICLES) {
      expect(renderBlogPostPage(article.slug, "en")?.status, article.slug).toBe(200);
    }
  });

  it("keeps the regex digit example machine-accurate", () => {
    const article = BLOG_ARTICLES.find(({ slug }) => slug === "regex-guide");
    const codeTokens = [...article.content.matchAll(/<code>([^<]+)<\/code>/g)].map(
      (match) => match[1],
    );
    const digitToken = codeTokens.find((token) => token === "\\d");
    expect(digitToken).toBe("\\d");
    const digitPattern = new RegExp(`^${digitToken}$`);
    expect(digitPattern.test("5")).toBe(true);
    expect(digitPattern.test("٥")).toBe(false);
  });

  it("keeps internal article and FAQ links on registered routes", () => {
    const validPaths = new Set([
      "/",
      "/about",
      "/blog",
      "/careers",
      "/contact",
      "/faq",
      "/privacy",
      "/security",
      "/terms",
      ...TOOLS.map((tool) => tool.path),
      ...BLOG_ARTICLES.map((article) => `/blog/${article.slug}`),
    ]);
    const bodies = LANGS.flatMap((lang) => [
      ...BLOG_ARTICLES.map(
        (article) => getLocalizedBlogArticle(article, lang).content,
      ),
      ...getFaqEntries(lang).map((entry) => entry.answer),
    ]);
    const hrefs = bodies.flatMap((body) =>
      [...body.matchAll(/href="([^"]+)"/g)].map((match) => match[1]),
    );
    for (const href of hrefs.filter((href) => href.startsWith("/"))) {
      expect(validPaths.has(href), href).toBe(true);
    }
    for (const href of hrefs.filter((href) => !href.startsWith("/"))) {
      expect(() => new URL(href), href).not.toThrow();
    }
  });

  it("selects complete generated translations without changing machine keys", () => {
    const localizedLanguages = [
      "ko",
      "ja",
      "es",
      "zh-CN",
      "zh-TW",
      "fr",
      "de",
      "pt",
      "vi",
    ];
    const revisedArticles = BLOG_ARTICLES.filter(
      (article) => article.slug !== "inspect-jwt-in-the-browser",
    );
    const englishFaq = getFaqEntries("en");
    const hrefs = (html) =>
      [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    const codeContents = (html) =>
      [...html.matchAll(/<code[^>]*>([\s\S]*?)<\/code>/g)].map(
        (match) => match[1],
      );
    const openingTags = (html) =>
      [...html.matchAll(/<([a-z0-9-]+)(?:\s[^>]*)?>/gi)].map(
        (match) => match[0],
      );

    expect(Object.keys(REVIEWED_CONTENT_LOCALES)).toEqual(localizedLanguages);
    for (const lang of localizedLanguages) {
      const generatedLocale = REVIEWED_CONTENT_LOCALES[lang];
      const localizedFaq = getFaqEntries(lang);
      expect(localizedFaq, `${lang} generated FAQ selection`).toBe(
        generatedLocale.faq,
      );
      expect(localizedFaq.map((entry) => entry.id), `${lang} FAQ ids`).toEqual(
        englishFaq.map((entry) => entry.id),
      );
      expect(
        localizedFaq.map((entry) => entry.category),
        `${lang} FAQ category keys`,
      ).toEqual(englishFaq.map((entry) => entry.category));
      localizedFaq.forEach((entry, index) => {
        expect(hrefs(entry.answer), `${lang}:${entry.id} FAQ links`).toEqual(
          hrefs(englishFaq[index].answer),
        );
        expect(
          openingTags(entry.answer),
          `${lang}:${entry.id} FAQ HTML attributes`,
        ).toEqual(openingTags(englishFaq[index].answer));
      });
      for (const article of revisedArticles) {
        const generated = generatedLocale.articles.find(
          (entry) => entry.slug === article.slug,
        );
        const localized = getLocalizedBlogArticle(article, lang);
        expect(localized.slug, `${lang}:${article.slug} slug`).toBe(article.slug);
        expect(localized.title, `${lang}:${article.slug} generated title`).toBe(
          generated.title,
        );
        expect(localized.content, `${lang}:${article.slug} generated content`).toBe(
          generated.content,
        );
        expect(hrefs(localized.content), `${lang}:${article.slug} links`).toEqual(
          hrefs(article.content),
        );
        expect(
          codeContents(localized.content),
          `${lang}:${article.slug} code samples`,
        ).toEqual(codeContents(article.content));
        expect(
          openingTags(localized.content),
          `${lang}:${article.slug} HTML attributes`,
        ).toEqual(openingTags(article.content));
      }
    }
  });
});

describe("registry-backed public count", () => {
  it("derives the production count from the visible registry", () => {
    expect(PRODUCTION_TOOL_COUNT).toBe(getToolsForEnvironment(false).length);
    expect(PRODUCTION_TOOL_COUNT).toBe(45);
  });
});

describe("reviewed content locale generator", () => {
  it("keeps generated-content-locales.js in sync with its JSON source", () => {
    const script = fileURLToPath(
      new URL("../../scripts/i18n-content-locales.mjs", import.meta.url),
    );
    // Throws (non-zero exit) when the generated module is stale.
    expect(() =>
      execFileSync(process.execPath, [script, "--check"], { stdio: "pipe" }),
    ).not.toThrow();
  });
});

describe("machine-bound advertising disclosure", () => {
  it("uses one exact/prefix allow-list for script-bearing routes", () => {
    const snapshot = getAdPolicySnapshot();
    expect(snapshot.scriptPaths).toEqual([...AD_SCRIPT_PATHS]);
    expect(snapshot.scriptPrefixes).toEqual([...AD_SCRIPT_PREFIXES]);
    for (const path of AD_SCRIPT_PATHS) expect(pageAllowsAdScript(path)).toBe(true);
    expect(pageAllowsAdScript("/blog/what-is-json")).toBe(true);
    expect(pageAllowsAdScript("/password-generator")).toBe(false);
  });

  it("binds Terms and Privacy sections to the ad policy snapshot", () => {
    for (const lang of LANGS) {
      for (const pageId of ["terms", "privacy"]) {
        const bindings = getLegalSections(pageId, lang).filter(
          (section) => section.adPolicy,
        );
        expect(bindings).toHaveLength(1);
        expect(bindings[0].adPolicy).toEqual(getAdPolicySnapshot());
        expect(bindings[0].adPolicyLabels).toBe(
          REVIEWED_LEGAL_CONTENT[lang].adPolicy,
        );
      }
      expect(getLegalSections("contact", lang).at(-1).paragraphs).toEqual([
        REVIEWED_LEGAL_CONTENT[lang].responseMessage,
      ]);
      expect(getLegalSections("security", lang).at(-1).paragraphs).toEqual([
        REVIEWED_LEGAL_CONTENT[lang].securityResponse,
      ]);
    }
  });

  it("renders the machine-readable ad scope exactly as the policy snapshot", async () => {
    const snapshot = getAdPolicySnapshot();
    for (const lang of LANGS) {
      for (const render of [renderTermsPage, renderPrivacyPage]) {
        const html = await render(lang).text();
        const scopes = html.match(/<div[^>]*data-ad-policy-scope="v1"[^>]*>/g) || [];
        expect(scopes).toHaveLength(1);
        expect(scopes[0]).toContain(`data-auto-ads-status="${snapshot.autoAdsStatus}"`);
        expect(scopes[0]).toContain(`data-cmp-status="${snapshot.cmpStatus}"`);
        const paths = [...html.matchAll(/data-ad-policy-path="([^"]+)"/g)].map((m) => m[1]);
        expect(paths).toEqual([...snapshot.manualUnitPaths, ...snapshot.scriptPaths]);
        const prefixes = [...html.matchAll(/data-ad-policy-prefix="([^"]+)"/g)].map((m) => m[1]);
        expect(prefixes).toEqual([...snapshot.scriptPrefixes]);
      }
    }
  });

  it("keeps the selected language on internal FAQ answer links", async () => {
    for (const lang of LANGS.filter((code) => code !== "en")) {
      const html = await renderFaqPage(lang).text();
      const hrefs = [...html.matchAll(/data-faq-item[\s\S]*?<\/details>/g)]
        .flatMap((m) => [...m[0].matchAll(/href="(\/[^"]*)"/g)].map((h) => h[1]));
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) expect(href).toBe(withLanguageQuery(href.split("?")[0], lang));
    }
  });

  it("does not list the homepage as manual-unit inventory", () => {
    expect(getAdPolicySnapshot().manualUnitPaths).not.toContain("/");
  });
});

describe("catalog freeze guard", () => {
  it("does not add tool routes in this slice", () => {
    // 56 → 55: `changelog` retired as a catalog tool (the /changelog page stays
    // live, served directly in worker.js).
    // 55 → 52: network-reference merge — dns/port/http-status/protocol-headers
    // (4 tools) collapsed into one tabbed /network-reference; old paths 301.
    // 52 → 50: repo-ops merge — public-repos-yml-builder,
    // public-repos-not-automation, and review-description-generator collapsed
    // into tabbed /repo-ops; old paths 301.
    // 50 → 48: token-counter and pipe retired by request on 2026-09-10;
    // both former paths retain permanent redirects (see src/utils/redirects.js).
    expect(TOOLS.map((tool) => tool.id)).toHaveLength(48);
  });
});
