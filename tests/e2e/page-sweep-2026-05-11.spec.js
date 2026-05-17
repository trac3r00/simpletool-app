import { test, expect } from '@playwright/test';

test.describe('Page sweep 2026-05-11 regressions', () => {
  test('ssh-key-generator: ECDSA produces OpenSSH wire format', async ({ page }) => {
    await page.goto('http://localhost:8787/ssh-key-generator');
    await page.locator('#generate-btn').click();
    await expect(page.locator('#results')).toBeVisible();

    const publicKey = page.locator('#public-key');
    await expect(publicKey).toHaveValue(/^ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAA/);
    await expect(publicKey).not.toHaveValue(/MFkwEwYHKoZIzj0CAQYI/);
  });

  test('ssh-key-generator: RSA produces OpenSSH wire format', async ({ page }) => {
    await page.goto('http://localhost:8787/ssh-key-generator');
    await page.locator('input[name="keyType"][value="rsa"]').check();
    await page.locator('#rsa-size').selectOption('2048');
    await page.locator('#generate-btn').click();
    await expect(page.locator('#results')).toBeVisible();
    await expect(page.locator('#public-key')).toHaveValue(/^ssh-rsa AAAAB3NzaC1yc2E/);
  });

  test('/pipe: renders valid page with proper title', async ({ page }) => {
    const response = await page.goto('http://localhost:8787/pipe');
    expect(response.status()).toBe(200);
    const title = await page.title();
    expect(title).not.toContain('undefined');
    expect(title.length).toBeGreaterThan(5);
    const h1 = await page.locator('h1').first().textContent();
    expect(h1).toBeTruthy();
  });

  test('htpasswd-generator: Generate entry produces bcrypt output', async ({ page }) => {
    await page.goto('http://localhost:8787/htpasswd-generator');
    await page.fill('input[name="username"], #username, #username-input, input[placeholder*="username" i]', 'admin');

    const strongBtn = page.locator('button:has-text("Generate strong"), button:has-text("Generate password")');
    if (await strongBtn.count() > 0) {
      await strongBtn.first().click();
    }

    await page.waitForTimeout(500);
    await page.locator('#generate-btn').click();
    await page.waitForTimeout(5000);

    await expect(page.locator('#entry-output')).toContainText(/admin:\$2[aby]\$/);
    await expect(page.locator('#entry-output')).not.toContainText('No entry yet.');
    await expect(page.locator('#history-body')).toContainText('admin');
  });

  test('home search: json query filters cards correctly', async ({ page }) => {
    await page.goto('http://localhost:8787/');
    const search = page.locator('#tool-search');
    await expect(search).toBeVisible();

    await search.fill('json');
    await page.waitForTimeout(300);

    const jsonCard = page.locator('[data-tool-id="json-formatter"]');
    await expect(jsonCard).toBeVisible();

    const irrelevantIds = ['ladder-game', 'token-studio', 'caffeniate', 'bandwidth'];
    for (const id of irrelevantIds) {
      const card = page.locator(`[data-tool-id="${id}"]`);
      if (await card.count() > 0) {
        await expect(card).toBeHidden();
      }
    }

    await search.fill('');
    await page.waitForTimeout(300);
    await expect(jsonCard).toBeVisible();
  });

  test('home search: empty state shows when no tools match', async ({ page }) => {
    await page.goto('http://localhost:8787/');
    const search = page.locator('#tool-search');
    await search.fill('xyznomatch12345');
    await page.waitForTimeout(300);

    const emptyState = page.locator('#search-empty-state');
    await expect(emptyState).toBeVisible();

    await search.fill('');
    await page.waitForTimeout(300);
    await expect(emptyState).toBeHidden();
  });

  test('home: clicking nav-search-btn focuses hero search', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:8787/');
    const heroSearch = page.locator('#tool-search');
    await expect(heroSearch).toBeVisible();

    await page.locator('#tool-search').evaluate(el => el.blur());
    await page.locator('#nav-search-btn').click();
    await page.waitForTimeout(200);

    const focused = await page.evaluate(() => document.activeElement && document.activeElement.id);
    expect(focused).toBe('tool-search');
  });
});
