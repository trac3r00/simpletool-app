import { test, expect } from '@playwright/test';
import { getToolsForEnvironment } from '../../src/utils/tool-registry.js';
import { handlersById } from '../../src/routes/_handlers.js';

const tools = getToolsForEnvironment(true);

test.describe('All tools smoke', () => {
  test('every registered tool id has a corresponding handlersById entry', () => {
    const missing = [];
    for (const tool of tools) {
      if (typeof handlersById[tool.id] !== 'function') {
        missing.push(tool.id);
      }
    }
    expect(missing).toEqual([]);
  });

  for (const tool of tools) {
    test(`${tool.id}: ${tool.path} loads HTTP 200 with zero page/console errors`, async ({ page }) => {
      const pageErrors = [];
      const consoleErrors = [];

      page.on('pageerror', (error) => {
        pageErrors.push(error.message || String(error));
      });

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const { url } = msg.location();
          // The current app references a generated Material Symbols font that is
          // absent in local wrangler dev. Ignore only that known asset 404 so
          // route-level JS errors and other console errors still fail the smoke.
          if (url.endsWith('/fonts/material-symbols.woff2')) {
            return;
          }
          consoleErrors.push(msg.text());
        }
      });

      const response = await page.goto(tool.path);
      expect(response, `Expected response for ${tool.path} to be non-null`).not.toBeNull();
      expect(response.status(), `Expected ${tool.path} to return HTTP 200`).toBe(200);
      expect(pageErrors, `Expected zero page errors on ${tool.path}`).toEqual([]);
      expect(consoleErrors, `Expected zero console errors on ${tool.path}`).toEqual([]);
    });
  }
});
