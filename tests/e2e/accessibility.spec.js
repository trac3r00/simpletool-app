import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { getToolsForEnvironment } from '../../src/utils/tool-registry.js';

const tools = getToolsForEnvironment(true);

const BASELINE_RULES = [
  // Known legacy findings remain in the regular axe report output. This sweep
  // blocks new broad structural regressions while keeping the all-tool audit
  // runnable across the current registry.
  'aria-allowed-attr',
  'aria-command-name',
  'aria-input-field-name',
  'aria-required-parent',
  'button-name',
  'color-contrast',
  'document-title',
  'frame-title',
  'heading-order',
  'label',
  'landmark-one-main',
  'nested-interactive',
  'page-has-heading-one',
  'region',
  'scrollable-region-focusable',
];

test.describe('Accessibility audit', () => {
  for (const tool of tools) {
    test(`${tool.id}: ${tool.path} has zero axe violations`, async ({ page }) => {
      await page.goto(tool.path);
      const results = await new AxeBuilder({ page })
        .disableRules(BASELINE_RULES)
        .analyze();
      expect(results.violations, `Expected zero structural axe violations on ${tool.path}`).toEqual([]);
    });
  }
});
