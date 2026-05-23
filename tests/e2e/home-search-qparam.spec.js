import { test, expect } from '@playwright/test';

async function openHome(page, query) {
  const url = query != null ? `/?q=${encodeURIComponent(query)}` : '/';
  await page.goto(url);
  await expect(page.locator('main')).toBeVisible();
}

test.describe('Home search query parameter', () => {
  test('/?q=json prefills search, filters cards, and has no console errors', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error.message || error)));
    const consoleErrors = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error' && !/Failed to load resource|net::ERR/.test(text)) {
        consoleErrors.push(text);
      }
    });

    await openHome(page, 'json');

    const search = page.locator('#tool-search');
    await expect(search).toHaveValue('json');

    // Every visible card must match "json" in at least one of name/desc/tags/rendered text
    const mismatches = await page.evaluate(() => {
      const q = 'json';
      const cards = document.querySelectorAll('[data-tool-id]:not(.hidden)');
      const out = [];
      cards.forEach((card) => {
        const name = (card.dataset.toolName || '').toLowerCase();
        const desc = (card.dataset.toolDesc || '').toLowerCase();
        const tags = (card.dataset.toolTags || '').toLowerCase();
        const renderedName = (card.querySelector('.tool-name')?.textContent || '').toLowerCase();
        const renderedDesc = (card.querySelector('.tool-desc')?.textContent || '').toLowerCase();
        const matches = name.includes(q) || desc.includes(q) || tags.includes(q) || renderedName.includes(q) || renderedDesc.includes(q);
        if (!matches) out.push(card.dataset.toolId || 'unknown');
      });
      return out;
    });
    expect(mismatches).toEqual([]);

    // There should be at least one hidden card (filtering actually happened)
    const hiddenCount = await page.locator('[data-tool-id].hidden').count();
    expect(hiddenCount).toBeGreaterThan(0);

    await expect(page.locator('#search-empty-state')).toBeHidden();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('/ shows full grid with empty search box', async ({ page }) => {
    await openHome(page, null);

    const search = page.locator('#tool-search');
    await expect(search).toHaveValue('');

    const hiddenCount = await page.locator('[data-tool-id].hidden').count();
    expect(hiddenCount).toBe(0);

    const visibleCount = await page.locator('[data-tool-id]:not(.hidden)').count();
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('/?q=zz-no-tool-match shows empty state with query text', async ({ page }) => {
    await openHome(page, 'zz-no-tool-match');

    const search = page.locator('#tool-search');
    await expect(search).toHaveValue('zz-no-tool-match');

    const emptyState = page.locator('#search-empty-state');
    await expect(emptyState).toBeVisible();

    const queryText = await page.locator('#search-empty-query').textContent();
    expect(queryText).toContain('zz-no-tool-match');

    // No visible tool cards
    const visibleCount = await page.locator('[data-tool-id]:not(.hidden)').count();
    expect(visibleCount).toBe(0);
  });
});
