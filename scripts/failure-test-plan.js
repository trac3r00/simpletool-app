/**
 * Failure Test Plan Automation
 *
 * Builds a registry-driven failure-test plan / checklist for all registered tools.
 * Covers recurring Kanban demand lanes:
 *   - route smoke (handler present in _handlers.js)
 *   - registry metadata (required fields present)
 *   - accessibility readiness (basic metadata + semantic HTML hints)
 *   - e2e coverage (TOOL_ACTIONS entry exists)
 *   - vendor/build prerequisites (dist artifacts present)
 *
 * Usage:
 *   node scripts/failure-test-plan.js
 *   npm run test:failure-plan
 *
 * Exits with code 1 when structural problems are found (duplicate ids/paths,
 * missing handlers, missing metadata, missing build artifacts).
 */

import { TOOLS } from '../src/utils/tool-registry.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
let handlersById;

/* ------------------------------------------------------------------ */
// Helpers
/* ------------------------------------------------------------------ */

function getToolActionIds() {
  const suitePath = join(ROOT, 'tests', 'helpers', 'tool-suite.js');
  if (!existsSync(suitePath)) return [];
  const content = readFileSync(suitePath, 'utf8');
  // Extract quoted keys from the TOOL_ACTIONS object body.
  const startMarker = 'export const TOOL_ACTIONS = {';
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.lastIndexOf('};');
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return [];
  const block = content.slice(startIdx + startMarker.length, endIdx);
  const keys = [];
  const keyRe = /['"]([^'"]+)['"]\s*:/g;
  let m;
  while ((m = keyRe.exec(block)) !== null) {
    keys.push(m[1]);
  }
  return keys;
}

function checkBuildPrerequisites() {
  const details = [];
  const artifacts = [
    { path: join(ROOT, 'dist', 'styles.css'), label: 'dist/styles.css' },
    { path: join(ROOT, 'dist', 'vendor'), label: 'dist/vendor/' },
    { path: join(ROOT, 'src', 'routes', '_handlers.js'), label: 'src/routes/_handlers.js' },
  ];

  for (const artifact of artifacts) {
    if (!existsSync(artifact.path)) {
      details.push(`MISSING build artifact: ${artifact.label}`);
    }
  }

  return {
    ok: details.length === 0,
    details: details.length ? details : ['Build artifacts look healthy'],
  };
}

/* ------------------------------------------------------------------ */
// Core plan builder
/* ------------------------------------------------------------------ */

export function buildFailureTestPlan(options = {}) {
  const tools = options.overrideTools ?? TOOLS;
  const handlers = options.overrideHandlers ?? handlersById ?? {};
  const toolActionIds = options.overrideToolActions
    ? Object.keys(options.overrideToolActions)
    : getToolActionIds();
  const strictE2E = options.strictE2E ?? false;

  const structuralErrors = [];
  const idCounts = {};
  const pathCounts = {};

  for (const tool of tools) {
    idCounts[tool.id] = (idCounts[tool.id] || 0) + 1;
    pathCounts[tool.path] = (pathCounts[tool.path] || 0) + 1;
  }

  for (const [id, count] of Object.entries(idCounts)) {
    if (count > 1) {
      structuralErrors.push(`Duplicate tool id: ${id} (${count} occurrences)`);
    }
  }
  for (const [p, count] of Object.entries(pathCounts)) {
    if (count > 1) {
      structuralErrors.push(`Duplicate tool path: ${p} (${count} occurrences)`);
    }
  }

  const requiredMetaFields = ['id', 'name', 'icon', 'description', 'path', 'category', 'keywords'];

  const toolPlans = tools.map((tool) => {
    const missingMeta = requiredMetaFields.filter((f) => {
      const v = tool[f];
      return v === undefined || v === null || v === '';
    });

    const hasHandler = typeof handlers[tool.id] === 'function';

    const lanes = {
      routeSmoke: {
        ok: hasHandler,
        detail: hasHandler ? 'handler present' : 'missing handler',
      },
      metadata: {
        ok: missingMeta.length === 0,
        detail: missingMeta.length === 0 ? 'required fields present' : `missing: ${missingMeta.join(', ')}`,
      },
      a11yReadiness: {
        ok: !!(tool.name && tool.description && tool.icon),
        detail: !!(tool.name && tool.description && tool.icon)
          ? 'basic a11y metadata present'
          : 'incomplete name/description/icon',
      },
      e2eCoverage: {
        ok: toolActionIds.includes(tool.id),
        detail: toolActionIds.includes(tool.id) ? 'TOOL_ACTIONS covered' : 'no TOOL_ACTIONS entry',
      },
    };

    return {
      id: tool.id,
      name: tool.name,
      path: tool.path,
      lanes,
    };
  });

  const buildPrereqs = checkBuildPrerequisites();

  const allBlockingLanesOk = toolPlans.every((t) => {
    const { routeSmoke, metadata, a11yReadiness, e2eCoverage } = t.lanes;
    if (strictE2E) {
      return routeSmoke.ok && metadata.ok && a11yReadiness.ok && e2eCoverage.ok;
    }
    return routeSmoke.ok && metadata.ok && a11yReadiness.ok;
  });

  return {
    tools: toolPlans,
    summary: {
      ok: structuralErrors.length === 0 && allBlockingLanesOk && buildPrereqs.ok,
      strictE2E,
      structuralErrors,
      buildPrerequisites: buildPrereqs,
      totalTools: tools.length,
      coveredE2E: toolPlans.filter((t) => t.lanes.e2eCoverage.ok).length,
      missingHandlers: toolPlans.filter((t) => !t.lanes.routeSmoke.ok).map((t) => t.id),
      missingMetadata: toolPlans
        .filter((t) => !t.lanes.metadata.ok)
        .map((t) => `${t.id}: ${t.lanes.metadata.detail}`),
    },
  };
}

/* ------------------------------------------------------------------ */
// CLI output
/* ------------------------------------------------------------------ */

function printPlan(plan) {
  const { tools, summary } = plan;

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║          SimpleTool App — Failure Test Plan Automation               ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Structural errors (blocking)
  if (summary.structuralErrors.length > 0) {
    console.log('⚠️  STRUCTURAL ERRORS');
    for (const err of summary.structuralErrors) {
      console.log(`   ❌ ${err}`);
    }
    console.log('');
  }

  // Build prerequisites
  const bp = summary.buildPrerequisites;
  console.log(bp.ok ? '✅ Build Prerequisites' : '⚠️  Build Prerequisites');
  for (const d of bp.details) {
    console.log(`   ${d.startsWith('MISSING') ? '❌' : '✅'} ${d}`);
  }
  console.log('');

  // Per-tool lanes
  console.log(`📋 Tool Lanes (${tools.length} tools)`);
  console.log('');

  let toolIssues = 0;
  for (const tool of tools) {
    const laneEntries = Object.entries(tool.lanes);
    const failing = laneEntries.filter(([, l]) => !l.ok);
    if (failing.length === 0) continue;
    toolIssues += failing.length;
    console.log(`   ${tool.name} (${tool.id})`);
    for (const [name, lane] of failing) {
      console.log(`      ❌ ${name}: ${lane.detail}`);
    }
  }

  if (toolIssues === 0) {
    console.log('   ✅ All tool lanes pass.');
  }

  console.log('');
  console.log('─'.repeat(70));
  console.log(`Total tools: ${summary.totalTools}`);
  console.log(`E2E covered: ${summary.coveredE2E} / ${summary.totalTools}`);
  console.log(`Missing handlers: ${summary.missingHandlers.length ? summary.missingHandlers.join(', ') : 'none'}`);
  console.log(`Status: ${summary.ok ? '✅ PASS' : '❌ FAIL'}`);
  console.log('─'.repeat(70));
  console.log('');
}

/* ------------------------------------------------------------------ */
// Main
/* ------------------------------------------------------------------ */

async function main() {
  const strictE2E = process.argv.includes('--strict-e2e');

  const buildPrereqs = checkBuildPrerequisites();
  if (!buildPrereqs.ok) {
    const plan = buildFailureTestPlan({ strictE2E });
    printPlan(plan);
    process.exit(1);
  }

  const mod = await import('../src/routes/_handlers.js');
  handlersById = mod.handlersById;

  const plan = buildFailureTestPlan({ strictE2E });
  printPlan(plan);
  process.exit(plan.summary.ok ? 0 : 1);
}

// Run when executed directly (not imported)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
