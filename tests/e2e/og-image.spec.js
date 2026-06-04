import { test, expect } from '@playwright/test';

async function assertOgImageMeta(page, request) {
  const meta = page.locator('meta[property="og:image"]');
  const content = await meta.getAttribute('content');
  expect(content).toBeTruthy();
  expect(content).toMatch(/\/og-image\.png$/);
  const localUrl = new URL(new URL(content).pathname, page.url()).toString();
  const imageResponse = await request.get(localUrl);
  expect(imageResponse.status()).toBe(200);
  expect(imageResponse.headers()['content-type']).toMatch(/^image\//);
}

test.describe('OG image meta and asset', () => {
  test('/og-image.png returns 200 with image/* content-type', async ({ request }) => {
    const response = await request.get('/og-image.png');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/^image\//);
  });

  test('home page og:image meta resolves to a 200 image URL', async ({ page, request }) => {
    await page.goto('/');
    await assertOgImageMeta(page, request);
  });

  test('json-formatter page og:image meta resolves to a 200 image URL', async ({ page, request }) => {
    await page.goto('/json-formatter');
    await assertOgImageMeta(page, request);
  });
});
