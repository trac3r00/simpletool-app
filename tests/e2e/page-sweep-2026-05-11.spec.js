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
});
