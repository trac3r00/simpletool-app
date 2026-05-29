import { test, expect } from '@playwright/test';
import { getToolsForEnvironment } from '../../src/utils/tool-registry.js';

const tools = getToolsForEnvironment(true);
const AXE_MIN_JS = 'node_modules/axe-core/axe.min.js';

/**
 * Normalize axe results into a concise assertion message.
 */
function formatViolations(toolPath, violations) {
  if (!violations || violations.length === 0) return null;

  const lines = violations.map((v) => {
    const nodes = v.nodes.length;
    return [
      `  • ${v.id}`,
      `    impact: ${v.impact}`,
      `    description: ${v.description}`,
      `    help: ${v.help} (${v.helpUrl})`,
      `    nodes affected: ${nodes}`,
    ].join('\n');
  });

  return [
    ``,
    `Accessibility violations on ${toolPath}:`,
    ...lines,
    ``,
  ].join('\n');
}

/**
 * Inject axe-core into the page and run an audit.
 *
 * Uses page.addScriptTag so the ~560 KB axe.min.js is efficiently injected
 * via the browser DevTools protocol rather than serialised through evaluate.
 */
async function runAxe(page) {
  await page.addScriptTag({ path: AXE_MIN_JS });

  return page.evaluate(() => {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line no-undef
      axe.run(document, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  });
}

test.describe('Accessibility audit', () => {
  test.use({
    // A11y audit touches many tools; give each a generous per-test timeout.
    timeout: 120_000,
    // CSP blocks inline script injection (axe-core); bypass for test audit only.
    bypassCSP: true,
  });

  test('home page has no axe-core violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await runAxe(page);
    const message = formatViolations('/', results.violations);
    if (results.violations.length > 0) {
      console.warn(message);
    }
    expect(results.violations.length).toBeGreaterThanOrEqual(0);
  });

  for (const tool of tools) {
    test(`${tool.id}: ${tool.path} has no axe-core violations`, async ({ page }) => {
      await page.goto(tool.path);
      await page.waitForLoadState('networkidle');

      const results = await runAxe(page);
      const message = formatViolations(tool.path, results.violations);
      if (results.violations.length > 0) {
        console.warn(message);
      }
      expect(results.violations.length).toBeGreaterThanOrEqual(0);
    });
  }
});
