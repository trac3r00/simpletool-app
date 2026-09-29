import { test, expect } from "@playwright/test";
import { SUPPORTED_LANGUAGES, t } from "../../src/utils/i18n.js";
import { TOOLS } from "../../src/utils/tool-registry.js";

const locales = Object.keys(SUPPORTED_LANGUAGES);
test.use({ timezoneId: "UTC" });

async function switchLocale(page, locale) {
  await page.locator('[data-i18n-aria="nav.changeLanguage"]').click();
  const navigation = page.waitForEvent("domcontentloaded", { timeout: 15000 });
  await page.locator(`.language-dropdown [data-lang="${locale}"]`).click();
  await navigation;
  expect(await page.locator("html").getAttribute("lang")).toBe(locale);
}

async function changePattern(page, locale, pattern, expected) {
  await page.evaluate(({ locale, pattern, expected }) => {
    window.__explanationReady = new Promise((resolve, reject) => {
      const list = document.getElementById("explanation-list");
      const read = () => Array.from(list.children, (node) => node.textContent);
      const observer = new MutationObserver(() => {
        const actual = read();
        if (JSON.stringify(actual) === JSON.stringify(expected)) {
          clearTimeout(timeout);
          observer.disconnect();
          resolve();
        }
      });
      const timeout = setTimeout(() => {
        observer.disconnect();
        reject(new Error(
          `[${locale}] explanation for ${JSON.stringify(pattern)} never matched.\n` +
            `expected: ${JSON.stringify(expected)}\nobserved: ${JSON.stringify(read())}`,
        ));
      }, 10000);
      observer.observe(list, { childList: true, subtree: true, characterData: true });
    });
  }, { locale, pattern, expected });
  await page.locator("#regex-input").fill(pattern);
  await page.evaluate(() => window.__explanationReady);
  expect(await page.locator("#explanation-list > li").allTextContents()).toEqual(expected);
}

test("related cards follow real language-menu navigation in every locale", async ({ page }) => {
  await page.goto("/json-formatter?lang=en");
  const related = TOOLS.find((tool) => tool.id === "json-formatter").relatedTools.slice(0, 4);
  for (const locale of locales) {
    await switchLocale(page, locale);
    const cards = page.locator('section[aria-label="Related tools"]');
    expect(await cards.locator("h3").allTextContents()).toEqual(
      related.map((id) => t(`tools.${id}.name`, locale)),
    );
    expect(await cards.locator("p").allTextContents()).toEqual(
      related.map((id) => t(`tools.${id}.desc`, locale)),
    );
  }
});

test("generated Regex explanations use all locale catalogs and preserve interpolation", async ({ page }) => {
  await page.goto("/regex-visualizer?lang=en");
  for (const locale of locales) {
    await switchLocale(page, locale);
    await page.locator("#explanation-list > li").first().waitFor();
    const phrase = (key) => t(`tools.regex-visualizer.js.explain.${key}`, locale);
    expect(await page.locator("#explanation-list > li").allTextContents()).toEqual([
      phrase("wordCharacter"), phrase("oneOrMore"),
      phrase("capturingGroupOne").replace("{count}", "1"),
      phrase("characterSet").replace("{set}", "[A-Z]"),
    ]);
    await changePattern(page, locale, "^\\d\\w\\s.*a+b?([<>])(x)$", [
      ...["assertStart", "assertEnd", "digit", "wordCharacter", "whitespace", "anyCharacter", "zeroOrMore", "oneOrMore", "zeroOrOne"].map(phrase),
      phrase("capturingGroupOther").replace("{count}", "2"),
      phrase("characterSet").replace("{set}", "[<>]"),
    ]);
    await changePattern(page, locale, "plain", [phrase("literal")]);
  }
});

test("Cron recipes tips descriptions and dates follow every locale", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-11T12:00:00Z"));
  await page.goto("/cron-builder?lang=en");
  for (const locale of locales) {
    await switchLocale(page, locale);
    const phrase = (key) => t(`tools.cron-builder.js.${key}`, locale);
    expect(await page.locator("#human-readable").textContent()).toBe(phrase("everyMinute"));
    expect(await page.locator("#recipes-list button > span").allTextContents()).toEqual(
      Array.from({ length: 8 }, (_, index) => phrase(`recipe${index}`)),
    );
    for (const key of ["quickEvery", "quickIntervals", "quickLists", "quickRanges"]) {
      expect(await page.locator(`[data-i18n-html="tools.cron-builder.ui.${key}"]`).innerHTML())
        .toBe(t(`tools.cron-builder.ui.${key}`, locale));
    }
    const firstDate = await page.evaluate((locale) => new Date("2026-09-11T12:01:00Z").toLocaleString(locale, {
      weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }), locale);
    expect(await page.locator("#next-executions li > span:first-child").first().textContent()).toBe(firstDate);
    expect(await page.locator("#next-executions li > span:last-child").first().textContent())
      .toBe(`(${phrase("relativeMinutes").replace("{{minutes}}", "1")})`);
    await page.locator("#cron-expression").fill("0 0 * * */2");
    expect(await page.locator("#human-readable").textContent()).toBe(
      phrase("atMidnight") + phrase("onWeekdays").replace("{{days}}", "*/2"),
    );
  }
});
