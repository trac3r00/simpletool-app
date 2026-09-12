import { test, expect } from "@playwright/test";
import { handleJSONFormatterRoutes } from "../../src/routes/json-formatter.js";
import { getToolsForEnvironment } from "../../src/utils/tool-registry.js";

const tools = getToolsForEnvironment(true);
const AXE_MIN_JS = "node_modules/axe-core/axe.min.js";

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
  "/": [
    { id: "color-contrast", impact: "serious", optional: true },
  ],
  "/about": [
  ],
  "/bandwidth-calculator": [
    { id: "select-name", impact: "critical", optional: true },
  ],
  "/blog": [
    { id: "heading-order", impact: "moderate", optional: true },
    { id: "list", impact: "serious", optional: true },
  ],
  "/caffeinate": [
  ],
  "/case-converter": [
  ],
  "/certificate-decoder": [
  ],
  "/changelog": [
  ],
  "/cidr-calculator": [
  ],
  "/code-minifier": [
  ],
  "/color-converter": [
  ],
  "/cron-builder": [
    { id: "aria-allowed-role", impact: "minor", optional: true },
    { id: "aria-required-children", impact: "critical", optional: true },
    { id: "aria-required-parent", impact: "critical", optional: true },
  ],
  "/csp-builder": [
  ],
  "/css-gradient": [
    { id: "scrollable-region-focusable", impact: "serious", optional: true },
  ],
  "/curl-studio": [
  ],
  "/email-analyzer": [
  ],
  "/encoding-workbench": [
  ],
  "/env-var-manager": [
  ],
  "/faq": [
    { id: "landmark-unique", impact: "moderate", optional: true },
    { id: "list", impact: "serious", optional: true },
  ],
  "/htpasswd-generator": [
    { id: "color-contrast", impact: "serious", optional: true },
  ],
  "/image-converter": [
  ],
  "/json-formatter": [
  ],
  "/json-schema-studio": [
  ],
  "/ladder-game": [
  ],
  "/log-masker": [
  ],
  "/log-viewer": [
  ],
  "/marble-roulette": [
  ],
  "/markdown-editor": [
  ],
  "/mermaid-studio": [
    { id: "aria-required-parent", impact: "critical", optional: true },
    { id: "color-contrast", impact: "serious", optional: true },
  ],
  "/mock-data-generator": [
    { id: "color-contrast", impact: "serious", optional: true },
  ],
  "/network-reference": [
    { id: "select-name", impact: "critical", optional: true },
  ],
  "/oauth-debugger": [
  ],
  "/password-generator": [
  ],
  "/privacy": [
  ],
  "/prompt-template-builder": [
    { id: "select-name", impact: "critical", optional: true },
  ],
  "/qr-code": [
  ],
  "/regex-visualizer": [
    { id: "scrollable-region-focusable", impact: "serious", optional: true },
    { id: "select-name", impact: "critical", optional: true },
  ],
  "/repo-ops": [
  ],
  "/roulette-wheel": [
    { id: "nested-interactive", impact: "serious", optional: true },
    { id: "select-name", impact: "critical", optional: true },
  ],
  "/saml-decoder": [
    { id: "color-contrast", impact: "serious", optional: true },
  ],
  "/secret-scanner": [
  ],
  "/sql-formatter": [
    { id: "select-name", impact: "critical", optional: true },
  ],
  "/ssh-key-generator": [
  ],
  "/svg-optimizer": [
  ],
  "/terms": [
  ],
  "/text-diff": [
  ],
  "/timestamp-converter": [
  ],
  "/token-studio": [
  ],
  "/unit-converter": [
  ],
  "/user-agent-decoder": [
  ],
  "/uuid-generator": [
  ],
  "/webhook-debugger": [
  ],
  "/wireguard-config": [
    { id: "select-name", impact: "critical", optional: true },
  ],
  "/wireshark-filter": [
    { id: "select-name", impact: "critical", optional: true },
  ],
  "/yaml-toml-converter": [
    { id: "color-contrast", impact: "serious", optional: true },
  ],
};

// ── Audited Routes ───────────────────────────────────────────────

const AUDITED_ROUTES = [
  "/", // home page
  ...tools.map((t) => t.path), // every registered tool
  // Content and legal pages. These were previously unaudited, which meant the
  // blog, FAQ and legal copy — the pages most likely to be read start to
  // finish by a screen-reader user — had no accessibility coverage at all.
  "/about",
  "/faq",
  "/privacy",
  "/terms",
  "/blog",
  "/changelog",
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
  if (v.nodeCount != null)
    line += `  (${v.nodeCount} node${v.nodeCount === 1 ? "" : "s"})`;
  if (v.helpUrl) line += `  ${v.helpUrl}`;
  return line;
}

/**
 * Build a human-readable diff block for a single route.
 */
function formatDiffBlock(
  route,
  newViolations,
  changedViolations,
  missingViolations,
) {
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
      if (c.nodeCount != null)
        line += `  (${c.nodeCount} node${c.nodeCount === 1 ? "" : "s"})`;
      if (c.helpUrl) line += `  ${c.helpUrl}`;
      parts.push(line);
    }
  }

  if (missingViolations.length > 0) {
    parts.push(`  FIXED / missing (in baseline but not found):`);
    parts.push(...missingViolations.map(violationLine));
  }

  return parts.join("\n");
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
      changed.push({
        id: v.id,
        before: match.impact,
        after: v.impact,
        helpUrl: v.helpUrl,
        nodeCount: v.nodeCount,
      });
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
  const response = await page
    .goto(route, { waitUntil: "networkidle" })
    .catch(() => null);

  if (!response || !response.ok()) {
    throw new Error(
      `Route ${route} returned ${response ? response.status() : "ERR_CONNECTION_REFUSED"} — navigation failed`,
    );
  }

  const results = await runAxe(page);
  const actual = normalizeViolations(results.violations);

  return diffViolations(actual, baseline);
}

// ── Tests ────────────────────────────────────────────────────────

test.describe("Accessibility audit", () => {
  test.use({
    timeout: 120_000,
    bypassCSP: true,
  });

  // ── 1. Registry integrity ────────────────────────────────────

  test("tool registry is non-empty", () => {
    expect(tools.length).toBeGreaterThan(0);
    expect(AUDITED_ROUTES.length).toBeGreaterThan(1);
  });

  test("every registered route is covered", () => {
    const auditedSet = new Set(AUDITED_ROUTES);
    for (const tool of tools) {
      expect(auditedSet.has(tool.path)).toBeTruthy();
    }
  });

  test("AUDITED_ROUTES contains no duplicate entries", () => {
    const uniqueSet = new Set(AUDITED_ROUTES);
    expect(uniqueSet.size).toBe(AUDITED_ROUTES.length);
  });

  test("BASELINE_VIOLATIONS has no stale routes outside AUDITED_ROUTES", () => {
    const auditedSet = new Set(AUDITED_ROUTES);
    const staleKeys = Object.keys(BASELINE_VIOLATIONS).filter(
      (r) => !auditedSet.has(r),
    );
    expect(staleKeys).toEqual([]);
  });

  test("skip link moves keyboard focus to the main content region", async ({
    page,
  }) => {
    const url = new URL("https://simpletool.test/json-formatter");
    const response = await handleJSONFormatterRoutes(
      new Request(url, { method: "GET" }),
      url,
    );
    await page.setContent(await response.text(), {
      waitUntil: "domcontentloaded",
    });

    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await expect(skipLink).toBeFocused();

    await page.keyboard.press("Enter");

    await expect(page.locator("#main-content")).toBeFocused();
  });

  // ── 2. Formatter output ───────────────────────────────────────

  test("violationLine includes rule id, impact, help URL, and affected node count", () => {
    const v = {
      id: "color-contrast",
      impact: "serious",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.9/color-contrast",
      nodeCount: 3,
    };
    const line = violationLine(v);
    expect(line).toContain("color-contrast");
    expect(line).toContain("serious");
    expect(line).toContain(
      "https://dequeuniversity.com/rules/axe/4.9/color-contrast",
    );
    expect(line).toContain("3");
  });

  test("violationLine omits optional fields when absent", () => {
    const v = { id: "heading-order", impact: "moderate" };
    const line = violationLine(v);
    expect(line).toBe("  · heading-order  [impact: moderate]");
  });

  test("formatDiffBlock includes help URL and affected node count for new violations", () => {
    const block = formatDiffBlock(
      "/test",
      [
        {
          id: "label",
          impact: "critical",
          helpUrl: "https://example.com/label",
          nodeCount: 2,
        },
      ],
      [],
      [],
    );
    expect(block).toContain("label");
    expect(block).toContain("critical");
    expect(block).toContain("https://example.com/label");
    expect(block).toContain("2");
  });

  test("formatDiffBlock includes help URL and affected node count for changed violations", () => {
    const block = formatDiffBlock(
      "/test",
      [],
      [
        {
          id: "color-contrast",
          before: "serious",
          after: "critical",
          helpUrl: "https://example.com/cc",
          nodeCount: 5,
        },
      ],
      [],
    );
    expect(block).toContain("color-contrast");
    expect(block).toContain("serious → critical");
    expect(block).toContain("https://example.com/cc");
    expect(block).toContain("5");
  });

  // ── 3. Optional baseline violations ────────────────────────────

  test("optional baseline violations are accepted when present", () => {
    const actual = [
      { id: "color-contrast", impact: "serious" },
      { id: "scrollable-region-focusable", impact: "serious" },
    ];
    const baseline = [
      { id: "color-contrast", impact: "serious" },
      { id: "scrollable-region-focusable", impact: "serious", optional: true },
    ];
    const result = diffViolations(actual, baseline);
    expect(result.hasDiff).toBe(false);
    expect(result.extra).toEqual([]);
    expect(result.missing).toEqual([]);
    expect(result.changed).toEqual([]);
  });

  test("optional baseline violations are ignored when missing", () => {
    const actual = [{ id: "color-contrast", impact: "serious" }];
    const baseline = [
      { id: "color-contrast", impact: "serious" },
      { id: "scrollable-region-focusable", impact: "serious", optional: true },
    ];
    const result = diffViolations(actual, baseline);
    expect(result.hasDiff).toBe(false);
    expect(result.extra).toEqual([]);
    expect(result.missing).toEqual([]);
    expect(result.changed).toEqual([]);
  });

  test("optional baseline violations do not hide unexpected new violations", () => {
    const actual = [
      { id: "color-contrast", impact: "serious" },
      { id: "unexpected-rule", impact: "moderate" },
    ];
    const baseline = [
      { id: "color-contrast", impact: "serious" },
      { id: "scrollable-region-focusable", impact: "serious", optional: true },
    ];
    const result = diffViolations(actual, baseline);
    expect(result.hasDiff).toBe(true);
    expect(result.extra).toEqual([
      { id: "unexpected-rule", impact: "moderate" },
    ]);
    expect(result.missing).toEqual([]);
    expect(result.changed).toEqual([]);
  });

  // ── 4. Home page audit ───────────────────────────────────────

  test("home page meets baseline", async ({ page }) => {
    const baseline = BASELINE_VIOLATIONS["/"] || [];
    const result = await auditRoute("/", page, baseline);

    if (result.hasDiff) {
      console.warn(
        formatDiffBlock("/", result.extra, result.changed, result.missing),
      );
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
        console.warn(
          formatDiffBlock(
            tool.path,
            result.extra,
            result.changed,
            result.missing,
          ),
        );
      }

      expect(result.extra).toEqual([]);
      expect(result.changed).toEqual([]);
      expect(result.missing).toEqual([]);
    });
  }
});
