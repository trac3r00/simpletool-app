import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const axeSource = await readFile("node_modules/axe-core/axe.min.js", "utf8");

async function violationsFor(page, path, ruleIds) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.evaluate(axeSource);
  return page.evaluate(async (ids) => {
    const result = await axe.run(document, {
      runOnly: { type: "rule", values: ids },
      resultTypes: ["violations"],
    });
    return result.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.flatMap((node) => node.target),
    }));
  }, ruleIds);
}

async function tabTo(page, selector, limit = 80) {
  for (let index = 0; index < limit; index += 1) {
    await page.keyboard.press("Tab");
    if (await page.locator(selector).evaluate((element) => element === document.activeElement)) {
      return;
    }
  }
  throw new Error(`Keyboard focus did not reach ${selector}`);
}

test.describe("C3 accessibility and mobile usefulness", () => {
  test("scrolling output regions are axe-clean and keyboard reachable", async ({ page }) => {
    expect(await violationsFor(page, "/regex-visualizer", ["scrollable-region-focusable"])).toEqual([]);
    await tabTo(page, "#code-output-region");
    await expect(page.locator("#code-output-region")).toBeFocused();
    await tabTo(page, "#match-groups-scroll");
    await expect(page.locator("#match-groups-scroll")).toBeFocused();

    expect(await violationsFor(page, "/css-gradient", ["scrollable-region-focusable"])).toEqual([]);
    await tabTo(page, "#css-output");
    await expect(page.locator("#css-output")).toBeFocused();
  });

  test("Roulette exposes the canvas image without nesting the spin control", async ({ page }) => {
    expect(await violationsFor(page, "/roulette-wheel", ["nested-interactive"])).toEqual([]);
    await expect(page.locator("#wheel-stage")).not.toHaveAttribute("role", "img");
    await expect(page.locator("#wheel-canvas")).toHaveAttribute("role", "img");
    await tabTo(page, "#spin-button");
    await expect(page.locator("#spin-button")).toBeFocused();
  });

  test("FAQ and curl guide landmarks are distinguishable", async ({ page }) => {
    expect(await violationsFor(page, "/faq", ["landmark-unique"])).toEqual([]);
    expect(await violationsFor(page, "/blog/curl-essentials", ["landmark-unique"])).toEqual([]);
    const labels = await page.locator('pre[role="region"]').evaluateAll((regions) =>
      regions.map((region) => region.getAttribute("aria-label")),
    );
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toEqual(["curl JSON request example"]);

    await page.goto("/blog/curl-essentials?lang=ko", { waitUntil: "domcontentloaded" });
    await expect(page.locator('pre[role="region"]')).toHaveAttribute("aria-label", "curl JSON request example");
    await expect(page.locator('pre[role="region"]')).toHaveAttribute("tabindex", "0");
  });

  test("real recent JSON history and the first matching card fit at 390x844", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto("/json-formatter", { waitUntil: "domcontentloaded" });
    await page.goto("/?q=json", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#recent-section")).toBeVisible();
    await page.evaluate(axeSource);

    const state = await page.evaluate(async () => {
      const card = document.querySelector("#recent-grid [data-tool-id]:not(.hidden)");
      const rect = card.getBoundingClientRect();
      const flagshipLinks = [...document.querySelectorAll("#flagship-links a")];
      const recentCountStyle = getComputedStyle(document.getElementById("recent-count"));
      const channel = (value) => {
        const normalized = value / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      };
      const luminance = (cssColor) => {
        const [red, green, blue] = cssColor.match(/[\d.]+/g).slice(0, 3).map(Number);
        return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
      };
      const foreground = luminance(recentCountStyle.color);
      const background = luminance(recentCountStyle.backgroundColor);
      const contrast = (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      const result = await axe.run(document, {
        runOnly: { type: "rule", values: ["color-contrast"] },
        resultTypes: ["violations"],
      });
      return {
        id: card.dataset.toolId,
        bottom: rect.bottom,
        flagshipCount: flagshipLinks.length,
        recentCountContrast: contrast,
        recentCountViolation: result.violations.some((violation) =>
          violation.nodes.some((node) => node.target.some((target) => target.includes("recent-count"))),
        ),
      };
    });

    expect(state).toEqual({
      id: "json-formatter",
      bottom: expect.any(Number),
      flagshipCount: 8,
      recentCountContrast: expect.any(Number),
      recentCountViolation: false,
    });
    expect(state.bottom).toBeLessThanOrEqual(844);
    expect(state.recentCountContrast).toBeGreaterThanOrEqual(4.5);

    const flagshipHrefs = [];
    await page.locator("#tool-search").focus();
    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press("Tab");
      flagshipHrefs.push(await page.evaluate(() => document.activeElement?.getAttribute("href")));
    }
    expect(new Set(flagshipHrefs).size).toBe(8);
    expect(flagshipHrefs.every(Boolean)).toBe(true);

    await page.locator("#tool-search").fill("zz-no-tool-match");
    await expect(page.locator("#search-empty-state")).toBeVisible();
    await page.locator("#tool-search").fill("");
    await expect(page.locator("#recent-section")).toBeVisible();
    await expect(page.locator("#tools-categories-container")).toBeVisible();
    await context.close();
  });

  test("shortcut help contains focus and restores it after every close path", async ({ page }) => {
    await page.goto("/regex-visualizer", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      window.__shortcutFocusTransitions = [];
      document.addEventListener("focusin", (event) => {
        window.__shortcutFocusTransitions.push(event.target.id || event.target.tagName);
      });
    });

    const trigger = page.locator("#shortcut-help-trigger");
    const close = page.locator("#close-shortcuts-modal");
    const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });

    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await expect(close).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(close).toBeFocused();
    expect(await page.evaluate(() =>
      document.getElementById("keyboard-shortcuts-modal").contains(document.activeElement),
    )).toBe(true);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    // Global shortcuts (mod+K also opens the nav search) must not pull focus
    // out of the open dialog, and Escape must still close the dialog itself.
    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("ControlOrMeta+k");
    await expect(close).toBeFocused();
    await expect(page.locator("#global-search-input")).toBeHidden();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await close.click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await dialog.click({ position: { x: 2, y: 2 } });
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    expect(await page.evaluate(() => window.__shortcutFocusTransitions)).toContain("close-shortcuts-modal");
  });

  test("mobile shortcut help is named, non-overlapping, and keyboard operable", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto("/regex-visualizer", { waitUntil: "domcontentloaded" });
    const trigger = page.locator("#shortcut-help-trigger");
    await expect(trigger).toHaveAccessibleName("Show keyboard shortcuts");
    await trigger.scrollIntoViewIfNeeded();
    const overlap = await trigger.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return document.elementsFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
        .some((node) => node !== element && node.closest?.("main"));
    });
    expect(overlap).toBe(false);

    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
    await expect(dialog).toBeVisible();
    await expect(page.locator("#close-shortcuts-modal")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await context.close();
  });

  test("native select sizing keeps field height without resizing custom selects", async ({ page }) => {
    const heights = async (path, selectors) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      return page.evaluate((ids) => ids.map((id) => getComputedStyle(document.querySelector(id)).height), selectors);
    };
    expect(await heights("/bandwidth-calculator", ["#transfer-size-unit"])).toEqual(["40px"]);
    expect(await heights("/cidr-calculator", ["#subnet-prefix"])).toEqual(["30px"]);
    expect(await heights("/roulette-wheel", ["#sound-theme-select", "#preset-select"])).toEqual(["38px", "38px"]);
  });

  test("localized CSS output name and DNS categories fit on mobile", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto("/css-gradient?lang=ko", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#css-output")).toHaveAttribute("aria-label", "생성된 CSS 코드");

    for (const lang of ["ja", "es", "de", "pt"]) {
      await page.goto(`/dns-reference?lang=${lang}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator('.record-card[data-type="DKIM"] [data-i18n]')).not.toHaveText("Email Security");
      const overflowing = await page.locator(".record-card").evaluateAll((cards) =>
        cards
          .filter((card) => card.scrollWidth > card.clientWidth || card.lastElementChild.scrollWidth > card.lastElementChild.clientWidth)
          .map((card) => card.dataset.type),
      );
      expect(overflowing, lang).toEqual([]);
    }
    await context.close();
  });
});
