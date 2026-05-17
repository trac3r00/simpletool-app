#!/usr/bin/env node
/**
 * Phase B sweep: open every tool route, capture console errors / network
 * failures / primary input-output happy path, and write the result to
 * .omc/research/sweep-{date}.json + .md.
 *
 * Usage:
 *   node scripts/sweep-routes.mjs            # sweeps localhost:8787
 *   BASE_URL=http://localhost:8787 node scripts/sweep-routes.mjs
 */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8787';
const OUT_DIR = join(ROOT, '.omc', 'research');
mkdirSync(OUT_DIR, { recursive: true });

const today = new Date().toISOString().slice(0, 10);
const OUT_JSON = join(OUT_DIR, `sweep-${today}.json`);
const OUT_MD = join(OUT_DIR, `sweep-${today}.md`);

// Discover route ids from the build manifest. They map 1:1 to URL paths.
const handlersSrc = readFileSync(join(ROOT, 'scripts', 'build-routes.js'), 'utf8');
const ROUTE_IDS = [...handlersSrc.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);
if (ROUTE_IDS.length === 0) {
  console.error('No routes found in scripts/build-routes.js — regex may be stale');
  process.exit(1);
}

// Tools that are intentionally non-interactive on first paint.
const STATIC_ROUTES = new Set(['caffeniate', 'dns-reference', 'port-reference', 'protocol-headers']);

const browser = await chromium.launch({ args: ['--disable-gpu'] });
const ctx = await browser.newContext();

/**
 * Open one route and capture: console errors, request failures, primary
 * controls present, screenshot of any uncaught exception.
 */
async function sweepOne(routeId) {
  const url = `${BASE_URL}/${routeId}`;
  const result = {
    route: routeId,
    url,
    status: null,
    consoleErrors: [],
    networkFailures: [],
    pageError: null,
    issues: [],
    title: null,
    h1: null,
    primaryControls: { textareas: 0, inputs: 0, buttons: 0 },
  };

  const page = await ctx.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('favicon') || text.includes('Manifest')) return; // noise
      result.consoleErrors.push(text);
    }
  });
  page.on('pageerror', (err) => {
    result.pageError = String(err);
  });
  page.on('requestfailed', (req) => {
    result.networkFailures.push({ url: req.url(), failure: req.failure()?.errorText });
  });

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    result.status = response?.status() ?? null;

    if (result.status && result.status >= 400) {
      result.issues.push({ severity: 'critical', kind: 'http', detail: `HTTP ${result.status}` });
    }

    result.title = await page.title();
    result.h1 = await page.locator('h1').first().textContent().catch(() => null);

    const probe = await page.evaluate(() => ({
      textareas: document.querySelectorAll('textarea').length,
      inputs: document.querySelectorAll('input:not([type=hidden])').length,
      buttons: document.querySelectorAll('button').length,
      hasMain: !!document.querySelector('main'),
      hasH1: !!document.querySelector('h1'),
      lang: document.documentElement.lang,
    }));
    result.primaryControls = probe;

    if (!probe.hasMain) result.issues.push({ severity: 'minor', kind: 'a11y', detail: 'no <main> landmark' });
    if (!probe.hasH1) result.issues.push({ severity: 'minor', kind: 'a11y', detail: 'no <h1>' });
    if (!probe.lang) result.issues.push({ severity: 'minor', kind: 'a11y', detail: 'missing html[lang]' });

    if (!STATIC_ROUTES.has(routeId) && probe.buttons === 0) {
      result.issues.push({ severity: 'minor', kind: 'ux', detail: 'no interactive buttons present' });
    }
  } catch (err) {
    result.issues.push({ severity: 'critical', kind: 'crash', detail: String(err) });
  } finally {
    if (result.consoleErrors.length) {
      result.issues.push({ severity: 'major', kind: 'console', detail: `${result.consoleErrors.length} console error(s)` });
    }
    if (result.networkFailures.length) {
      result.issues.push({ severity: 'major', kind: 'network', detail: `${result.networkFailures.length} failed request(s)` });
    }
    if (result.pageError) {
      result.issues.push({ severity: 'critical', kind: 'pageerror', detail: result.pageError });
    }
    await page.close();
  }
  return result;
}

console.log(`Sweeping ${ROUTE_IDS.length} routes against ${BASE_URL}...`);
const results = [];
const concurrency = 6;
for (let i = 0; i < ROUTE_IDS.length; i += concurrency) {
  const batch = ROUTE_IDS.slice(i, i + concurrency);
  const batchResults = await Promise.all(batch.map(sweepOne));
  results.push(...batchResults);
  process.stdout.write(`  ${results.length}/${ROUTE_IDS.length}\r`);
}
console.log(`  ${results.length}/${ROUTE_IDS.length} done.`);

await browser.close();

// Sort by severity worst-first.
const severityOrder = { critical: 0, major: 1, minor: 2 };
const withWorst = results.map((r) => {
  const worst = r.issues.reduce((acc, i) => Math.min(acc, severityOrder[i.severity] ?? 3), 3);
  return { ...r, _worst: worst };
});
withWorst.sort((a, b) => a._worst - b._worst);

writeFileSync(OUT_JSON, JSON.stringify(results, null, 2));

// Markdown summary.
const md = [];
md.push(`# Sweep ${today} (${BASE_URL})`);
md.push('');
md.push(`Routes scanned: **${results.length}**`);
const totalIssues = results.reduce((acc, r) => acc + r.issues.length, 0);
const cleanCount = results.filter((r) => r.issues.length === 0).length;
md.push(`Routes with zero issues: **${cleanCount} / ${results.length}**`);
md.push(`Total issues raised: **${totalIssues}**`);
md.push('');
md.push('## Issue table');
md.push('');
md.push('| Route | Status | Worst | Issues |');
md.push('|---|---|---|---|');
for (const r of withWorst) {
  if (r.issues.length === 0) continue;
  const worst = ['critical', 'major', 'minor', 'clean'][r._worst] || 'clean';
  const list = r.issues.map((i) => `${i.severity}/${i.kind}: ${i.detail}`).join('; ');
  md.push(`| /${r.route} | ${r.status ?? 'n/a'} | ${worst} | ${list} |`);
}
md.push('');
md.push('## Clean routes');
md.push('');
md.push(results.filter((r) => r.issues.length === 0).map((r) => `- /${r.route}`).join('\n'));
writeFileSync(OUT_MD, md.join('\n'));

console.log(`\nWrote ${OUT_JSON}`);
console.log(`Wrote ${OUT_MD}`);
console.log(`\nClean: ${cleanCount} | With issues: ${results.length - cleanCount} | Total findings: ${totalIssues}`);
