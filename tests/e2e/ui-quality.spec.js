import { test, expect } from '@playwright/test';
import { BLOG_ARTICLES } from '../../src/ui/blog.js';
import { getToolsForEnvironment } from '../../src/utils/tool-registry.js';

const tools = getToolsForEnvironment(true);
const contentRoutes = [
  '/',
  ...tools.map((tool) => tool.path),
  '/terms',
  '/privacy',
  '/about',
  '/contact',
  '/security',
  '/careers',
  '/blog',
  '/faq',
  ...BLOG_ARTICLES.map((article) => `/blog/${article.slug}`),
  '/_ui-quality-missing'
];

test.describe('UI quality contract', () => {
  test('every registered tool gives visible form controls and buttons an accessible name', async ({ page }) => {
    test.setTimeout(120_000);
    const violations = [];

    for (const tool of tools) {
      await page.goto(tool.path, { waitUntil: 'domcontentloaded' });
      const routeViolations = await page.evaluate(() => {
        const isVisible = (element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const fields = [...document.querySelectorAll('input:not([type="hidden"]):not([type="button"]):not([type="submit"]), select, textarea')]
          .filter(isVisible)
          .filter((field) => {
            const labels = field.labels ? [...field.labels] : [];
            return labels.length === 0 && !field.getAttribute('aria-label') && !field.getAttribute('aria-labelledby');
          })
          .map((field) => field.id || field.className || field.tagName.toLowerCase());
        const buttons = [...document.querySelectorAll('button')]
          .filter(isVisible)
          .filter((button) => !(button.getAttribute('aria-label') || button.getAttribute('title') || button.innerText || '').trim())
          .map((button) => button.id || button.className || 'button');
        return { fields, buttons };
      });

      if (routeViolations.fields.length || routeViolations.buttons.length) {
        violations.push({ route: tool.path, ...routeViolations });
      }
    }

    expect(violations).toEqual([]);
  });

  test('every rendered screen maintains a sequential visible heading outline', async ({ page }) => {
    test.setTimeout(120_000);
    const violations = [];

    for (const route of contentRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const skips = await page.evaluate(() => {
        const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter((heading) => {
          const rect = heading.getBoundingClientRect();
          const style = getComputedStyle(heading);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        });
        const result = [];
        for (let index = 1; index < headings.length; index += 1) {
          const previous = Number(headings[index - 1].tagName.slice(1));
          const current = Number(headings[index].tagName.slice(1));
          if (current > previous + 1) {
            result.push({
              from: previous,
              to: current,
              text: headings[index].textContent.trim()
            });
          }
        }
        return result;
      });
      if (skips.length) violations.push({ route, skips });
    }

    expect(violations).toEqual([]);
  });

  test('Log Viewer level filters remain inside their tablet container', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto('/log-viewer');

    const geometry = await page.evaluate(() => {
      const group = document.getElementById('toggle-other').parentElement.getBoundingClientRect();
      const other = document.getElementById('toggle-other').getBoundingClientRect();
      return { groupRight: group.right, otherRight: other.right };
    });

    expect(geometry.otherRight).toBeLessThanOrEqual(geometry.groupRight + 0.5);
  });

  test('JSON Formatter preserves its complete sample placeholder', async ({ page }) => {
    await page.goto('/json-formatter');
    await expect(page.locator('#re-input')).toHaveAttribute(
      'placeholder',
      '{"name": "SimpleTool", "version": "2.0", "tools": ["JSON Formatter", "Password Generator"]}'
    );
  });

  test('Material Symbols render as icons instead of visible ligature names', async ({ page }) => {
    await page.goto('/qr-code', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(async () => {
      await document.fonts.ready;
      const icons = [...document.querySelectorAll('.material-symbols-rounded')].filter((icon) => {
        const rect = icon.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      return {
        fontReady: document.fonts.check('24px "Material Symbols Rounded"'),
        oversized: icons
          .filter((icon) => icon.getBoundingClientRect().width > Math.max(40, icon.getBoundingClientRect().height * 2))
          .map((icon) => icon.textContent.trim())
      };
    });

    expect(result.fontReady).toBe(true);
    expect(result.oversized).toEqual([]);
  });

  test('core tool controls stay readable and contained on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/cron-builder');
    const cronTabs = await page.locator('#builder-tabs .tab-btn span').evaluateAll((tabs) =>
      tabs.map((tab) => ({ height: tab.getBoundingClientRect().height, whiteSpace: getComputedStyle(tab).whiteSpace }))
    );
    expect(cronTabs.every((tab) => tab.height <= 20 && tab.whiteSpace === 'nowrap')).toBe(true);

    await page.goto('/code-minifier');
    const languageTabs = await page.locator('.language-tab').evaluateAll((tabs) =>
      tabs.map((tab) => ({ clientWidth: tab.clientWidth, scrollWidth: tab.scrollWidth, height: tab.getBoundingClientRect().height }))
    );
    expect(languageTabs.every((tab) => tab.scrollWidth <= tab.clientWidth + 1 && tab.height <= 48)).toBe(true);

    await page.goto('/webhook-debugger');
    const endpoint = await page.locator('#webhook-url').evaluate((element) => ({
      width: element.getBoundingClientRect().width,
      labelHeight: element.closest('.bg-white, .dark\\:bg-surface-900')?.querySelector('label')?.getBoundingClientRect().height
    }));
    expect(endpoint.width).toBeGreaterThan(120);
    expect(endpoint.labelHeight).toBeLessThanOrEqual(24);

    await page.goto('/timestamp-converter');
    const timestamp = await page.locator('#current-unix').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const parent = element.parentElement.getBoundingClientRect();
      return { left: rect.left, right: rect.right, parentLeft: parent.left, parentRight: parent.right };
    });
    expect(timestamp.left).toBeGreaterThanOrEqual(timestamp.parentLeft - 0.5);
    expect(timestamp.right).toBeLessThanOrEqual(timestamp.parentRight + 0.5);
  });

  test('Japanese Unit Converter localizes dynamic categories and unit options', async ({ page }) => {
    await page.goto('/unit-converter?lang=ja');

    await expect(page.locator('[data-category-id="length"]')).toContainText('長さ');
    await expect(page.locator('[data-category-id="weight"]')).toContainText('重さ');
    await expect(page.locator('#from-unit option').first()).toHaveText('メートル (m)');
    await expect(page.locator('#to-unit option').nth(1)).toHaveText('キロメートル (km)');
  });
});
