import { describe, expect, it } from "vitest";
import { t, SUPPORTED_LANGUAGES } from "../utils/i18n.js";
import { getLegalSections } from "./legal-content.js";
import { getFaqEntries } from "./faq-content.js";
import { BLOG_ARTICLES, renderBlogPostPage } from "./blog.js";
import { ALLOW_SLOT_KEYS, DENY_AD_PATHS } from "../utils/ads.js";
import { TOOLS } from "../utils/tool-registry.js";

const LANGS = Object.keys(SUPPORTED_LANGUAGES);

const GAME_POSITIONING = /marble roulette|marble-roulette|roulette à billes|마블 룰렛|マーブルルーレット|弹珠轮盘|彈珠輪盤/i;

const VAPOR_ENTERPRISE =
  /white-label|white label|화이트라벨|ホワイトラベル|白標|enterprise licensing|enterprise & partnership|엔터프라이즈 라이선스/i;

const ABSOLUTE_NO_TRACKING =
  /no tracking|never track|without surveillance|추적 없음|トラッキングなし/i;

const WEAKER_BLOG_TWINS = {
  "password-security-best-practices-2026": "password-security-guide",
  "understanding-json-web-tokens": "jwt-explained",
  "regex-guide-for-beginners": "regex-guide",
  "hash-algorithms-compared": "understanding-hashes",
};

function flattenLegal(pageId, lang = "en") {
  return getLegalSections(pageId, lang)
    .flatMap((section) => [
      section.heading || "",
      ...(section.paragraphs || []),
      ...(section.list || []),
      section.html || "",
    ])
    .join("\n");
}

function flattenFaq(lang = "en") {
  return getFaqEntries(lang)
    .flatMap((entry) => [entry.question, entry.answer])
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

describe("blog twins", () => {
  it("noindexes weaker JWT/regex/password/hash twins onto the stronger article", () => {
    for (const [weak, strong] of Object.entries(WEAKER_BLOG_TWINS)) {
      const article = BLOG_ARTICLES.find((item) => item.slug === weak);
      expect(article, weak).toBeTruthy();
      expect(article.noindex, weak).toBe(true);
      expect(article.canonicalSlug, weak).toBe(strong);
      expect(BLOG_ARTICLES.some((item) => item.slug === strong)).toBe(true);
    }
  });

  it("renders robots noindex and a canonical to the stronger twin", async () => {
    const response = renderBlogPostPage("regex-guide-for-beginners");
    const html = await response.text();
    expect(html).toMatch(/name="robots"[^>]*content="noindex,follow"/);
    expect(html).toContain('href="https://simpletool.app/blog/regex-guide"');
  });
});

describe("catalog freeze guard", () => {
  it("does not add tool routes in this slice", () => {
    expect(TOOLS.map((tool) => tool.id)).toHaveLength(56);
  });
});
