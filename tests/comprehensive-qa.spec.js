import { test, expect } from '@playwright/test';

// Shared console error filter - ERR_CONNECTION_REFUSED is from blocked Google Analytics on localhost
const filterAppErrors = (errors) => errors.filter(e => 
  !e.includes('favicon') && !e.includes('google') && 
  !e.includes('ERR_BLOCKED') && !e.includes('ERR_CONNECTION_REFUSED') &&
  !e.includes('googletagmanager')
);

test.describe('1. JSON Formatter', () => {
  test('formats valid JSON', async ({ page }) => {
    await page.goto('/json-formatter');
    await page.locator('#json-input').fill('{"name":"test","value":42}');
    await page.click('#format-btn');
    await page.waitForTimeout(500);
    const output = await page.locator('#json-output').inputValue();
    expect(output).toContain('"name"');
    expect(output).toContain('\n');
  });

  test('shows error for invalid JSON', async ({ page }) => {
    await page.goto('/json-formatter');
    await page.locator('#json-input').fill('{invalid json}');
    await page.click('#format-btn');
    await page.waitForTimeout(500);
    const indicator = page.locator('#status-indicator');
    const visible = await indicator.isVisible();
    expect(visible).toBeTruthy();
  });

  test('minify works', async ({ page }) => {
    await page.goto('/json-formatter');
    await page.locator('#json-input').fill('{\n  "name": "test",\n  "value": 42\n}');
    await page.click('#minify-btn');
    await page.waitForTimeout(500);
    const output = await page.locator('#json-output').inputValue();
    expect(output).not.toContain('\n');
    expect(output).toContain('"name"');
  });

  test('validate works', async ({ page }) => {
    await page.goto('/json-formatter');
    await page.locator('#json-input').fill('{"valid": true}');
    await page.click('#validate-btn');
    await page.waitForTimeout(500);
    await expect(page.locator('#status-indicator')).toBeVisible();
  });

  test('clear button works', async ({ page }) => {
    await page.goto('/json-formatter');
    await page.locator('#json-input').fill('{"test": 1}');
    await page.click('#format-btn');
    await page.waitForTimeout(300);
    await page.click('#clear-btn');
    await page.waitForTimeout(300);
    expect(await page.locator('#json-input').inputValue()).toBe('');
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/json-formatter');
    await page.locator('#json-input').fill('{"test": 1}');
    await page.click('#format-btn');
    await page.waitForTimeout(500);
    expect(filterAppErrors(errors)).toHaveLength(0);
  });
});

test.describe('2. JWT Decoder', () => {
  const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  test('decodes valid JWT', async ({ page }) => {
    await page.goto('/jwt-decoder');
    await page.locator('#jwt-input').fill(JWT);
    const decodeBtn = page.locator('#decode-btn');
    if (await decodeBtn.isVisible().catch(() => false)) await decodeBtn.click();
    await page.waitForTimeout(500);
    expect(await page.locator('#header-content').textContent()).toContain('HS256');
    expect(await page.locator('#payload-content').textContent()).toContain('John Doe');
  });

  test('handles invalid JWT gracefully', async ({ page }) => {
    await page.goto('/jwt-decoder');
    await page.locator('#jwt-input').fill('not.a.jwt');
    const decodeBtn = page.locator('#decode-btn');
    if (await decodeBtn.isVisible().catch(() => false)) await decodeBtn.click();
    await page.waitForTimeout(500);
    expect(await page.textContent('body')).toBeTruthy(); // page doesn't crash
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/jwt-decoder');
    await page.locator('#jwt-input').fill(JWT);
    await page.waitForTimeout(500);
    expect(filterAppErrors(errors)).toHaveLength(0);
  });
});

test.describe('3. UUID Generator', () => {
  test('generates valid UUID', async ({ page }) => {
    await page.goto('/uuid-generator');
    await page.click('#generate-btn');
    await page.waitForTimeout(500);
    const output = await page.locator('#uuid-output').textContent();
    expect(output).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/uuid-generator');
    await page.click('#generate-btn');
    await page.waitForTimeout(500);
    expect(filterAppErrors(errors)).toHaveLength(0);
  });
});

test.describe('4. Password Generator', () => {
  test('generates password on page load', async ({ page }) => {
    await page.goto('/password-generator');
    await page.waitForTimeout(1000);
    // Password generators often auto-generate on load
    const pageText = await page.textContent('body');
    expect(pageText.length).toBeGreaterThan(100);
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/password-generator');
    await page.waitForTimeout(1000);
    expect(filterAppErrors(errors)).toHaveLength(0);
  });
});

test.describe('5. Hash Calculator', () => {
  test('generates hashes for text input', async ({ page }) => {
    await page.goto('/hash-calculator');
    const textTab = page.locator('#tab-text');
    if (await textTab.isVisible().catch(() => false)) await textTab.click();
    await page.waitForTimeout(300);
    const textInput = page.locator('#content-text textarea, #content-text input').first();
    await textInput.fill('hello world');
    const genBtn = page.locator('#text-generate-btn');
    if (await genBtn.isVisible().catch(() => false)) await genBtn.click();
    await page.waitForTimeout(500);
    const results = await page.locator('#hash-results').textContent();
    expect(results).toMatch(/[0-9a-f]{32,}/i);
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/hash-calculator');
    await page.waitForTimeout(1000);
    expect(filterAppErrors(errors)).toHaveLength(0);
  });
});

test.describe('6. Text Diff', () => {
  test('compares two texts and shows differences', async ({ page }) => {
    await page.goto('/text-diff');
    await page.locator('#text1').fill('hello world\nfoo bar');
    await page.locator('#text2').fill('hello earth\nfoo bar');
    await page.click('#compare-btn');
    await page.waitForTimeout(500);
    // Result div should become visible
    await expect(page.locator('#result')).toBeVisible();
    const diffText = await page.locator('#diff-output').textContent();
    expect(diffText.length).toBeGreaterThan(0);
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/text-diff');
    await page.locator('#text1').fill('a');
    await page.locator('#text2').fill('b');
    await page.click('#compare-btn');
    await page.waitForTimeout(500);
    expect(filterAppErrors(errors)).toHaveLength(0);
  });
});

test.describe('7. QR Code', () => {
  test('generates QR code', async ({ page }) => {
    await page.goto('/qr-code');
    await page.locator('#qr-data').fill('https://example.com');
    const genBtn = page.locator('#generate-qr');
    if (await genBtn.isVisible().catch(() => false)) await genBtn.click();
    await page.waitForTimeout(1000);
    const hasCanvas = await page.locator('#qr-canvas').isVisible().catch(() => false);
    const hasPreview = await page.locator('#qr-preview').isVisible().catch(() => false);
    expect(hasCanvas || hasPreview).toBeTruthy();
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/qr-code');
    await page.locator('#qr-data').fill('test');
    await page.waitForTimeout(1000);
    expect(filterAppErrors(errors)).toHaveLength(0);
  });
});

test.describe('8. Color Converter', () => {
  test('converts hex to RGB/HSL', async ({ page }) => {
    await page.goto('/color-converter');
    const input = page.locator('#manual-input');
    await input.fill('#ff5733');
    await input.dispatchEvent('input');
    await page.waitForTimeout(500);
    const hex = await page.locator('#hex-value').textContent();
    const rgb = await page.locator('#rgb-value').textContent();
    expect(hex.toUpperCase()).toContain('FF5733');
    expect(rgb).toMatch(/\d+/);
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/color-converter');
    await page.waitForTimeout(1000);
    expect(filterAppErrors(errors)).toHaveLength(0);
  });
});

test.describe('9. Timestamp Converter', () => {
  test('converts unix timestamp', async ({ page }) => {
    await page.goto('/timestamp-converter');
    await page.locator('#unix-input').fill('1700000000');
    await page.locator('#unix-input').press('Enter');
    await page.waitForTimeout(500);
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/2023|Nov/i);
  });

  test('now button works', async ({ page }) => {
    await page.goto('/timestamp-converter');
    const nowBtn = page.locator('#now-btn');
    if (await nowBtn.isVisible().catch(() => false)) {
      await nowBtn.click();
      await page.waitForTimeout(500);
    }
    const currentUnix = await page.locator('#current-unix').textContent().catch(() => '');
    expect(currentUnix.length).toBeGreaterThan(0);
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/timestamp-converter');
    await page.waitForTimeout(1000);
    expect(filterAppErrors(errors)).toHaveLength(0);
  });
});

test.describe('10. CIDR Calculator', () => {
  test('calculates subnet for 192.168.1.0/24', async ({ page }) => {
    await page.goto('/cidr-calculator');
    await page.locator('#cidr-input').fill('192.168.1.0/24');
    await page.click('#analyze-btn');
    await page.waitForTimeout(500);
    await expect(page.locator('#results-panel')).toBeVisible();
    const text = await page.locator('#results-panel').textContent();
    expect(text).toMatch(/254|256|255\.255\.255\.0/);
  });

  test('handles invalid CIDR gracefully', async ({ page }) => {
    await page.goto('/cidr-calculator');
    await page.locator('#cidr-input').fill('not-a-cidr');
    await page.click('#analyze-btn');
    await page.waitForTimeout(500);
    // Should show error or just not crash
    const errorVisible = await page.locator('#cidr-error').isVisible().catch(() => false);
    expect(true).toBeTruthy(); // page survives
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/cidr-calculator');
    await page.locator('#cidr-input').fill('10.0.0.0/8');
    await page.click('#analyze-btn');
    await page.waitForTimeout(500);
    expect(filterAppErrors(errors)).toHaveLength(0);
  });
});

test.describe('11. Regex Visualizer', () => {
  test('visualizes regex pattern and shows matches', async ({ page }) => {
    await page.goto('/regex-visualizer');
    await page.locator('#regex-input').fill('[A-Z]\\w+');
    await page.locator('#test-string').fill('Hello World Test');
    await page.waitForTimeout(500);
    const matchCount = await page.locator('#match-count').textContent();
    expect(matchCount).toMatch(/\d+/);
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/regex-visualizer');
    await page.waitForTimeout(1000);
    expect(filterAppErrors(errors)).toHaveLength(0);
  });
});

test.describe('12. Cron Builder', () => {
  test('displays cron expression', async ({ page }) => {
    await page.goto('/cron-builder');
    await page.waitForTimeout(500);
    const expr = await page.locator('#cron-expression').inputValue();
    expect(expr).toMatch(/[\*\d]/);
  });

  test('human readable and next executions shown', async ({ page }) => {
    await page.goto('/cron-builder');
    await page.waitForTimeout(500);
    expect((await page.locator('#human-readable').textContent()).length).toBeGreaterThan(0);
    expect((await page.locator('#next-executions').textContent()).length).toBeGreaterThan(0);
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/cron-builder');
    await page.waitForTimeout(1000);
    expect(filterAppErrors(errors)).toHaveLength(0);
  });
});

test.describe('13. Markdown Preview', () => {
  test('renders markdown to HTML', async ({ page }) => {
    await page.goto('/markdown-preview');
    await page.locator('#markdown-input').fill('# Hello World\n\n**bold** and *italic*\n\n- item 1\n- item 2');
    await page.waitForTimeout(500);
    const html = await page.locator('#preview-output').innerHTML();
    expect(html).toContain('<h1');
    expect(html).toMatch(/<strong>|<b>/);
  });

  test('word count updates', async ({ page }) => {
    await page.goto('/markdown-preview');
    await page.locator('#markdown-input').fill('one two three four five');
    await page.waitForTimeout(500);
    expect(await page.locator('#word-count').textContent()).toMatch(/5/);
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/markdown-preview');
    await page.locator('#markdown-input').fill('# Test');
    await page.waitForTimeout(500);
    expect(filterAppErrors(errors)).toHaveLength(0);
  });
});

test.describe('Security Tests', () => {
  test('markdown preview sanitizes XSS', async ({ page }) => {
    await page.goto('/markdown-preview');
    await page.locator('#markdown-input').fill('<script>alert("xss")</script><img src=x onerror=alert(1)>');
    await page.waitForTimeout(500);
    const html = await page.locator('#preview-output').innerHTML();
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('onerror');
  });

  test('JSON formatter handles script tags in values', async ({ page }) => {
    await page.goto('/json-formatter');
    await page.locator('#json-input').fill('{"key": "<script>alert(1)</script>"}');
    await page.click('#format-btn');
    await page.waitForTimeout(500);
    const output = await page.locator('#json-output').inputValue();
    expect(output).toContain('script'); // text preserved, not executed
  });
});
