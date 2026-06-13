import { test, expect } from '@playwright/test';
import { handleJSONFormatterRoutes } from '../../src/routes/json-formatter.js';
import { getToolsForEnvironment } from '../../src/utils/tool-registry.js';

const tools = getToolsForEnvironment(true);
const AXE_MIN_JS = 'node_modules/axe-core/axe.min.js';

// ── Baseline Violations ──────────────────────────────────────────
//
// Each entry maps a route path to an array of known axe-core rule
// violations.  The test fails when:
//
//   • a new violation appears                                   (regression)
//   • a known violation's impact level changes                  (regression)
//   • a known violation disappears                              (expected fix — update baseline)
//
// The baseline intentionally tracks rule id + impact only; DOM node
// counts are too brittle for this regression gate.
// ────────────────────────────────────────────────────────────────

const BASELINE_VIOLATIONS = {
  '/': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],

  '/bandwidth-calculator': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'heading-order', impact: 'moderate' },
    { id: 'link-in-text-block', impact: 'serious' },
    { id: 'select-name', impact: 'critical' },
  ],
  '/case-converter': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'heading-order', impact: 'moderate' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/certificate-decoder': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'heading-order', impact: 'moderate' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/cidr-calculator': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'definition-list', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/code-minifier': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/color-converter': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/cron-builder': [
    { id: 'aria-allowed-role', impact: 'minor' },
    { id: 'aria-required-children', impact: 'critical' },
    { id: 'aria-required-parent', impact: 'critical' },
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/css-gradient': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
    { id: 'scrollable-region-focusable', impact: 'serious', optional: true },
  ],
  '/curl-studio': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/dns-reference': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'definition-list', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
    { id: 'select-name', impact: 'critical' },
  ],
  '/encoding-workbench': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/htpasswd-generator': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/http-status-reference': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'definition-list', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/image-converter': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/json-formatter': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/json-schema-studio': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/log-masker': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/log-viewer': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'definition-list', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/markdown-editor': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'heading-order', impact: 'moderate' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/mermaid-studio': [
    { id: 'aria-required-parent', impact: 'critical' },
    { id: 'color-contrast', impact: 'serious' },
    { id: 'heading-order', impact: 'moderate' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/mock-data-generator': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/oauth-debugger': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'label', impact: 'critical' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/password-generator': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/port-reference': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'definition-list', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/protocol-headers': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'heading-order', impact: 'moderate' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/public-repos-yml-builder': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'definition-list', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/qr-code': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/regex-visualizer': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
    { id: 'scrollable-region-focusable', impact: 'serious' },
    { id: 'select-name', impact: 'critical' },
  ],
  '/saml-decoder': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'heading-order', impact: 'moderate' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/ssh-key-generator': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/text-diff': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/timestamp-converter': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/token-studio': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/unit-converter': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/user-agent-decoder': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/uuid-generator': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/webhook-debugger': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/wireguard-config': [
    { id: 'button-name', impact: 'critical' },
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
    { id: 'select-name', impact: 'critical' },
  ],
  '/wireshark-filter': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
    { id: 'select-name', impact: 'critical' },
  ],
  '/yaml-toml-converter': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],

  // ── Routes that are intermittently unavailable ──────────────
  // These routes loaded during a subsequent run — baselines
  // captured from actual axe output when the dev server was stable.

  '/caffeinate': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/changelog': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/csp-builder': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'definition-list', impact: 'serious' },
    { id: 'label', impact: 'critical' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/email-analyzer': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'definition-list', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/env-var-manager': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'definition-list', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/ladder-game': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/marble-roulette': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'definition-list', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/pipe': [
    { id: 'aria-allowed-role', impact: 'minor' },
    { id: 'color-contrast', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/prompt-template-builder': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'definition-list', impact: 'serious' },
    { id: 'label', impact: 'critical' },
    { id: 'link-in-text-block', impact: 'serious' },
    { id: 'select-name', impact: 'critical' },
  ],
  '/roulette-wheel': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'definition-list', impact: 'serious' },
    { id: 'heading-order', impact: 'moderate' },
    { id: 'label', impact: 'critical' },
    { id: 'link-in-text-block', impact: 'serious' },
    { id: 'nested-interactive', impact: 'serious' },
    { id: 'select-name', impact: 'critical' },
  ],
  '/secret-scanner': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'definition-list', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/sql-formatter': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'heading-order', impact: 'moderate' },
    { id: 'link-in-text-block', impact: 'serious' },
    { id: 'select-name', impact: 'critical' },
  ],
  '/svg-optimizer': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'definition-list', impact: 'serious' },
    { id: 'link-in-text-block', impact: 'serious' },
  ],
  '/token-counter': [
    { id: 'color-contrast', impact: 'serious' },
    { id: 'definition-list', impact: 'serious' },
    { id: 'label', impact: 'critical' },
    { id: 'link-in-text-block', impact: 'serious' },
    { id: 'select-name', impact: 'critical' },
  ],
};

// ── Audited Routes ───────────────────────────────────────────────

const AUDITED_ROUTES = [
  '/',                                    // home page
  ...tools.map((t) => t.path),           // every registered tool
];

// ── Helpers ──────────────────────────────────────────────────────

function normalizeViolations(violations) {
  if (!violations || violations.length === 0) return [];
  return violations
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      helpUrl: v.helpUrl,
      nodeCount: v.nodes ? v.nodes.length : undefined,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Serialise a single normalised violation to a one-line string.
 */
function violationLine(v) {
  let line = `  · ${v.id}  [impact: ${v.impact}]`;
  if (v.nodeCount != null) line += `  (${v.nodeCount} node${v.nodeCount === 1 ? '' : 's'})`;
  if (v.helpUrl) line += `  ${v.helpUrl}`;
  return line;
}

/**
 * Build a human-readable diff block for a single route.
 */
function formatDiffBlock(route, newViolations, changedViolations, missingViolations) {
  const parts = [];
  parts.push(`\n── ${route} ──`);

  if (newViolations.length > 0) {
    parts.push(`  NEW violations (not in baseline):`);
    parts.push(...newViolations.map(violationLine));
  }

  if (changedViolations.length > 0) {
    parts.push(`  CHANGED impact level:`);
    for (const c of changedViolations) {
      let line = `  · ${c.id}  [${c.before} → ${c.after}]`;
      if (c.nodeCount != null) line += `  (${c.nodeCount} node${c.nodeCount === 1 ? '' : 's'})`;
      if (c.helpUrl) line += `  ${c.helpUrl}`;
      parts.push(line);
    }
  }

  if (missingViolations.length > 0) {
    parts.push(`  FIXED / missing (in baseline but not found):`);
    parts.push(...missingViolations.map(violationLine));
  }

  return parts.join('\n');
}

/**
 * Inject axe-core and run an audit against the current page.
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

/**
 * Compare two normalised violation lists (actual vs baseline).
 *
 * Returns:
 *   - extra:   violations present in actual but not baseline
 *   - missing: violations present in baseline but not actual
 *   - changed: violations whose impact level differs
 *   - hasDiff: true when any of the above is non-empty
 */
function diffViolations(actual, baseline) {
  const extra = [];
  const missing = [];
  const changed = [];

  const baselineMap = new Map(baseline.map((v) => [v.id, v]));
  const actualMap = new Map(actual.map((v) => [v.id, v]));

  for (const v of actual) {
    const match = baselineMap.get(v.id);
    if (!match) {
      extra.push(v);
    } else if (match.impact !== v.impact) {
      changed.push({ id: v.id, before: match.impact, after: v.impact, helpUrl: v.helpUrl, nodeCount: v.nodeCount });
    }
  }

  for (const v of baseline) {
    if (!actualMap.has(v.id)) {
      if (v.optional) continue;
      missing.push(v);
    }
  }

  return {
    hasDiff: extra.length > 0 || missing.length > 0 || changed.length > 0,
    extra,
    missing,
    changed,
  };
}

async function auditRoute(route, page, baseline) {
  const response = await page.goto(route, { waitUntil: 'networkidle' }).catch(() => null);

  if (!response || !response.ok()) {
    throw new Error(
      `Route ${route} returned ${response ? response.status() : 'ERR_CONNECTION_REFUSED'} — navigation failed`
    );
  }

  const results = await runAxe(page);
  const actual = normalizeViolations(results.violations);

  return diffViolations(actual, baseline);
}

// ── Tests ────────────────────────────────────────────────────────

test.describe('Accessibility audit', () => {
  test.use({
    timeout: 120_000,
    bypassCSP: true,
  });

  // ── 1. Registry integrity ────────────────────────────────────

  test('tool registry is non-empty', () => {
    expect(tools.length).toBeGreaterThan(0);
    expect(AUDITED_ROUTES.length).toBeGreaterThan(1);
  });

  test('every registered route is covered', () => {
    const auditedSet = new Set(AUDITED_ROUTES);
    for (const tool of tools) {
      expect(auditedSet.has(tool.path)).toBeTruthy();
    }
  });

  test('AUDITED_ROUTES contains no duplicate entries', () => {
    const uniqueSet = new Set(AUDITED_ROUTES);
    expect(uniqueSet.size).toBe(AUDITED_ROUTES.length);
  });

  test('BASELINE_VIOLATIONS has no stale routes outside AUDITED_ROUTES', () => {
    const auditedSet = new Set(AUDITED_ROUTES);
    const staleKeys = Object.keys(BASELINE_VIOLATIONS).filter((r) => !auditedSet.has(r));
    expect(staleKeys).toEqual([]);
  });

  test('skip link moves keyboard focus to the main content region', async ({ page }) => {
    const url = new URL('https://simpletool.test/json-formatter');
    const response = await handleJSONFormatterRoutes(new Request(url, { method: 'GET' }), url);
    await page.setContent(await response.text(), { waitUntil: 'domcontentloaded' });

    await page.keyboard.press('Tab');

    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(page.locator('#main-content')).toBeFocused();
  });

  // ── 2. Formatter output ───────────────────────────────────────

  test('violationLine includes rule id, impact, help URL, and affected node count', () => {
    const v = {
      id: 'color-contrast',
      impact: 'serious',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.9/color-contrast',
      nodeCount: 3,
    };
    const line = violationLine(v);
    expect(line).toContain('color-contrast');
    expect(line).toContain('serious');
    expect(line).toContain('https://dequeuniversity.com/rules/axe/4.9/color-contrast');
    expect(line).toContain('3');
  });

  test('violationLine omits optional fields when absent', () => {
    const v = { id: 'heading-order', impact: 'moderate' };
    const line = violationLine(v);
    expect(line).toBe('  · heading-order  [impact: moderate]');
  });

  test('formatDiffBlock includes help URL and affected node count for new violations', () => {
    const block = formatDiffBlock(
      '/test',
      [{ id: 'label', impact: 'critical', helpUrl: 'https://example.com/label', nodeCount: 2 }],
      [],
      []
    );
    expect(block).toContain('label');
    expect(block).toContain('critical');
    expect(block).toContain('https://example.com/label');
    expect(block).toContain('2');
  });

  test('formatDiffBlock includes help URL and affected node count for changed violations', () => {
    const block = formatDiffBlock(
      '/test',
      [],
      [{ id: 'color-contrast', before: 'serious', after: 'critical', helpUrl: 'https://example.com/cc', nodeCount: 5 }],
      []
    );
    expect(block).toContain('color-contrast');
    expect(block).toContain('serious → critical');
    expect(block).toContain('https://example.com/cc');
    expect(block).toContain('5');
  });

  // ── 3. Optional baseline violations ────────────────────────────

  test('optional baseline violations are accepted when present', () => {
    const actual = [
      { id: 'color-contrast', impact: 'serious' },
      { id: 'scrollable-region-focusable', impact: 'serious' },
    ];
    const baseline = [
      { id: 'color-contrast', impact: 'serious' },
      { id: 'scrollable-region-focusable', impact: 'serious', optional: true },
    ];
    const result = diffViolations(actual, baseline);
    expect(result.hasDiff).toBe(false);
    expect(result.extra).toEqual([]);
    expect(result.missing).toEqual([]);
    expect(result.changed).toEqual([]);
  });

  test('optional baseline violations are ignored when missing', () => {
    const actual = [{ id: 'color-contrast', impact: 'serious' }];
    const baseline = [
      { id: 'color-contrast', impact: 'serious' },
      { id: 'scrollable-region-focusable', impact: 'serious', optional: true },
    ];
    const result = diffViolations(actual, baseline);
    expect(result.hasDiff).toBe(false);
    expect(result.extra).toEqual([]);
    expect(result.missing).toEqual([]);
    expect(result.changed).toEqual([]);
  });

  test('optional baseline violations do not hide unexpected new violations', () => {
    const actual = [
      { id: 'color-contrast', impact: 'serious' },
      { id: 'unexpected-rule', impact: 'moderate' },
    ];
    const baseline = [
      { id: 'color-contrast', impact: 'serious' },
      { id: 'scrollable-region-focusable', impact: 'serious', optional: true },
    ];
    const result = diffViolations(actual, baseline);
    expect(result.hasDiff).toBe(true);
    expect(result.extra).toEqual([{ id: 'unexpected-rule', impact: 'moderate' }]);
    expect(result.missing).toEqual([]);
    expect(result.changed).toEqual([]);
  });

  // ── 4. Home page audit ───────────────────────────────────────

  test('home page meets baseline', async ({ page }) => {
    const baseline = BASELINE_VIOLATIONS['/'] || [];
    const result = await auditRoute('/', page, baseline);

    if (result.hasDiff) {
      console.warn(formatDiffBlock('/', result.extra, result.changed, result.missing));
    }

    expect(result.extra).toEqual([]);
    expect(result.changed).toEqual([]);
    expect(result.missing).toEqual([]);
  });

  // ── 5. Per-tool audit ────────────────────────────────────────

  for (const tool of tools) {
    test(`${tool.id}: ${tool.path} meets baseline`, async ({ page }) => {
      const baseline = BASELINE_VIOLATIONS[tool.path] || [];
      const result = await auditRoute(tool.path, page, baseline);

      if (result.hasDiff) {
        console.warn(formatDiffBlock(tool.path, result.extra, result.changed, result.missing));
      }

      expect(result.extra).toEqual([]);
      expect(result.changed).toEqual([]);
      expect(result.missing).toEqual([]);
    });
  }
});
