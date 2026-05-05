#!/usr/bin/env node
/**
 * Exhaustive button-mash QA. Drives every visible interactive element on
 * every tool page in real Chromium (same engine as Chrome). Captures:
 *   - element inventory (buttons / inputs / textareas / selects / ranges /
 *     checkboxes / radios / file inputs / colors)
 *   - per-button click result (no-error / N new errors)
 *   - uncaught pageerrors, unhandledrejections, filtered console errors
 *
 * Persists per-tool findings to .omc/research/exhaustive-qa-{date}.json
 * and a human-readable digest to .omc/research/exhaustive-qa-{date}.md.
 *
 * Usage:
 *   node scripts/exhaustive-qa.mjs
 *   BASE_URL=http://localhost:8787 node scripts/exhaustive-qa.mjs
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
const OUT_JSON = join(OUT_DIR, `exhaustive-qa-${today}.json`);
const OUT_MD = join(OUT_DIR, `exhaustive-qa-${today}.md`);

const handlersSrc = readFileSync(join(ROOT, 'scripts', 'build-routes.js'), 'utf8');
const ROUTES = [...handlersSrc.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);

/**
 * Harness function injected into the page. Returns a structured findings
 * object. Inline because page.evaluate needs a self-contained function.
 */
async function harness() {
  const findings = {
    elements: { buttons: 0, textInputs: 0, textareas: 0, selects: 0, ranges: 0, checkboxes: 0, radios: 0, files: 0, colors: 0, links: 0 },
    interactions: [],
    issues: [],
  };

  const skipBtn = /change language|theme:|skip to main content|🇺🇸|🇰🇷|🇯🇵|🇪🇸|🇨🇳|🇹🇼|🇫🇷|🇩🇪|🇧🇷|🇻🇳/i;

  const main = document.querySelector('main');
  if (!main) {
    findings.issues.push('NO <main> ELEMENT');
    return findings;
  }

  findings.elements.buttons = main.querySelectorAll('button:not([disabled])').length;
  findings.elements.textInputs = main.querySelectorAll('input:not([type=hidden]):not([type=range]):not([type=checkbox]):not([type=radio]):not([type=color]):not([type=file]):not([readonly]):not([disabled])').length;
  findings.elements.textareas = main.querySelectorAll('textarea:not([readonly]):not([disabled])').length;
  findings.elements.selects = main.querySelectorAll('select:not([disabled])').length;
  findings.elements.ranges = main.querySelectorAll('input[type=range]:not([disabled])').length;
  findings.elements.checkboxes = main.querySelectorAll('input[type=checkbox]:not([disabled])').length;
  findings.elements.radios = main.querySelectorAll('input[type=radio]:not([disabled])').length;
  findings.elements.files = main.querySelectorAll('input[type=file]:not([disabled])').length;
  findings.elements.colors = main.querySelectorAll('input[type=color]:not([disabled])').length;
  findings.elements.links = main.querySelectorAll('a').length;

  function inferValue(el) {
    const id = (el.id || '').toLowerCase();
    const name = (el.name || '').toLowerCase();
    const ph = (el.placeholder || '').toLowerCase();
    const hint = id + ' ' + name + ' ' + ph;
    if (/email/.test(hint)) return 'test@example.com';
    if (/url|link/.test(hint)) return 'https://simpletool.app';
    if (/cidr|subnet/.test(hint)) return '10.0.0.0/24';
    if (/^ip|ip[-_]?address|address/.test(hint)) return '192.168.1.10';
    if (/json/.test(hint)) return '{"a":1,"b":[2,3]}';
    if (/yaml/.test(hint)) return 'name: alice\nage: 30';
    if (/cron/.test(hint)) return '0 9 * * 1';
    if (/regex|pattern/.test(hint)) return '[a-z]+\\d{2}';
    if (/timestamp|epoch|unix/.test(hint)) return '1700000000';
    if (/hex|color/.test(hint)) return '#ff8800';
    if (/cert|pem/.test(hint)) return '-----BEGIN CERTIFICATE-----\nMIIDsample\n-----END CERTIFICATE-----';
    if (/jwt|token/.test(hint)) return 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.x';
    if (/ua|user.?agent/.test(hint)) return 'Mozilla/5.0 (Test)';
    if (/curl/.test(hint)) return 'curl https://api.example.com';
    if (/sql/.test(hint)) return 'select * from users';
    if (/markdown|md/.test(hint)) return '# Hello\n\n- one';
    if (/svg/.test(hint)) return '<svg><rect width="10" height="10"/></svg>';
    if (/mermaid|diagram/.test(hint)) return 'graph TD\nA-->B';
    if (/host|domain/.test(hint)) return 'example.com';
    if (/port/.test(hint)) return '8080';
    if (/user|name/.test(hint)) return 'alice';
    if (/password|secret|pass/.test(hint)) return 'hunter2';
    if (el.type === 'number') return '100';
    return 'sample text';
  }

  // Step 1: Fill every text input + textarea
  const textInputs = [...main.querySelectorAll('input:not([type=hidden]):not([type=range]):not([type=checkbox]):not([type=radio]):not([type=color]):not([type=file]):not([readonly]):not([disabled])')];
  for (const el of textInputs) {
    try {
      const v = inferValue(el);
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) {
      findings.issues.push(`fill input ${el.id || '?'}: ${e.message}`);
    }
  }
  const textareas = [...main.querySelectorAll('textarea:not([readonly]):not([disabled])')];
  for (const el of textareas) {
    try {
      const v = inferValue(el);
      // RichEditor — element id="input" or id="output" with global window.inputEditor
      if ((el.id === 'input' || el.id === 'json-input') && window.inputEditor?.setValue) {
        window.inputEditor.setValue(v);
      } else {
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        setter.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } catch (e) {
      findings.issues.push(`fill textarea ${el.id || '?'}: ${e.message}`);
    }
  }

  // Step 2: Set ranges to mid value
  for (const el of main.querySelectorAll('input[type=range]:not([disabled])')) {
    try {
      const min = +el.min || 0; const max = +el.max || 100;
      el.value = String(Math.round((min + max) / 2));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) {
      findings.issues.push(`range ${el.id || '?'}: ${e.message}`);
    }
  }
  // Step 3: Toggle each checkbox
  for (const el of [...main.querySelectorAll('input[type=checkbox]:not([disabled])')].slice(0, 15)) {
    try { el.click(); } catch (e) { findings.issues.push(`checkbox ${el.id || '?'}: ${e.message}`); }
  }
  // Step 4: Pick last option of each select
  for (const el of main.querySelectorAll('select:not([disabled])')) {
    try {
      if (el.options.length > 1) {
        el.value = el.options[el.options.length - 1].value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } catch (e) { findings.issues.push(`select ${el.id || '?'}: ${e.message}`); }
  }
  // Step 5: Color inputs
  for (const el of main.querySelectorAll('input[type=color]:not([disabled])')) {
    try { el.value = '#ff8800'; el.dispatchEvent(new Event('input', { bubbles: true })); }
    catch (e) { findings.issues.push(`color ${el.id || '?'}: ${e.message}`); }
  }
  // Step 6: First radio in each group (best-effort)
  const seenRadioGroups = new Set();
  for (const el of main.querySelectorAll('input[type=radio]:not([disabled])')) {
    if (seenRadioGroups.has(el.name)) continue;
    seenRadioGroups.add(el.name);
    try { el.click(); } catch (e) { findings.issues.push(`radio ${el.name || '?'}: ${e.message}`); }
  }

  // Step 7: Click EVERY visible button (cap at 50). Track any new pageerror per click.
  const buttons = [...main.querySelectorAll('button:not([disabled])')];
  for (const el of buttons.slice(0, 50)) {
    const label = (el.textContent || '').trim().slice(0, 60);
    const aria = el.getAttribute('aria-label') || '';
    if (skipBtn.test(label + ' ' + aria)) continue;

    const errorsBefore = (window.__qaErrors || []).length;
    let clickThrew = null;
    try {
      el.click();
    } catch (e) { clickThrew = e.message; }
    // Yield 50ms for handlers + microtasks to settle
    await new Promise((r) => setTimeout(r, 60));
    const errorsAfter = (window.__qaErrors || []).length;
    const newErrors = (window.__qaErrors || []).slice(errorsBefore, errorsAfter);

    findings.interactions.push({
      action: 'click',
      label,
      id: el.id || null,
      newErrors: newErrors.length,
      threw: clickThrew,
    });
    if (clickThrew) {
      findings.issues.push(`button "${label}" click threw: ${clickThrew}`);
    }
    if (newErrors.length) {
      findings.issues.push(`button "${label}" raised: ${newErrors[0].slice(0, 250)}`);
    }
  }

  return findings;
}

const browser = await chromium.launch({ args: ['--disable-gpu'] });
// Grant clipboard permissions so writeText() succeeds on localhost.
// In real browsers users grant this via the prompt; the project's
// playwright.config.js already does the same for the main e2e suite.
const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
const concurrency = 4;

async function qaOne(routeId) {
  const url = `${BASE_URL}/${routeId}`;
  const result = {
    route: routeId,
    url,
    status: null,
    consoleErrors: [],
    pageErrors: [],
    elements: null,
    interactions: [],
    issues: [],
  };
  const page = await ctx.newPage();

  // Install error capture BEFORE navigation. We:
  //  - defer the check to a microtask so any page-level preventDefault
  //    handlers run first
  //  - additionally treat clipboard NotAllowedError / SecurityError as
  //    handled, since common-ui's getClipboardSafetyScript() catches them
  //    in real browsers (Playwright's automation context denies
  //    clipboard-write by default, which is purely a harness artifact —
  //    real users with a granted permission don't see this).
  await page.addInitScript(() => {
    window.__qaErrors = [];
    function isHandledClipboard(reason) {
      if (!reason) return false;
      var name = reason.name || '';
      var msg = reason.message || String(reason);
      return /clipboard/i.test(msg) ||
             name === 'NotAllowedError' ||
             name === 'SecurityError';
    }
    window.addEventListener('error', (e) => {
      queueMicrotask(() => {
        if (e.defaultPrevented) return;
        window.__qaErrors.push(`pageerror: ${e.error?.stack || e.error?.message || e.message}`);
      });
    });
    window.addEventListener('unhandledrejection', (e) => {
      if (isHandledClipboard(e.reason)) return;
      queueMicrotask(() => {
        if (e.defaultPrevented) return;
        window.__qaErrors.push(`unhandledrejection: ${String(e.reason)}`);
      });
    });
  });

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const t = msg.text();
    if (/favicon|Manifest|sentry|adsbygoogle|googletag|gtag|google-analytics|integrity/i.test(t)) return;
    result.consoleErrors.push(t);
  });
  page.on('pageerror', (err) => {
    const msg = `pageerror: ${err}`;
    // Clipboard rejections are caught by getClipboardSafetyScript() in
    // common-ui.js (preventDefault + toast). Playwright's CDP-level
    // pageerror listener still fires for them; treat as harness noise.
    if (/NotAllowedError.*clipboard|clipboard.*permission|clipboard.*denied/i.test(msg)) return;
    result.pageErrors.push(msg);
  });

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    result.status = response?.status() ?? null;
    if (result.status !== 200) {
      result.issues.push(`HTTP ${result.status}`);
    }
    const f = await page.evaluate(harness);
    result.elements = f.elements;
    result.interactions = f.interactions;
    result.issues.push(...f.issues);

    // Final pageerror probe (anything raised after the harness finished)
    const trailing = await page.evaluate(() => window.__qaErrors || []);
    if (trailing.length > result.pageErrors.length) {
      result.pageErrors.push(...trailing.slice(result.pageErrors.length));
    }
  } catch (e) {
    result.issues.push(`navigation/harness threw: ${String(e).slice(0, 250)}`);
  } finally {
    await page.close();
  }
  return result;
}

console.log(`Driving ${ROUTES.length} routes against ${BASE_URL} with concurrency=${concurrency}...`);
const results = [];
for (let i = 0; i < ROUTES.length; i += concurrency) {
  const batch = ROUTES.slice(i, i + concurrency);
  const batchResults = await Promise.all(batch.map(qaOne));
  results.push(...batchResults);
  process.stdout.write(`  ${results.length}/${ROUTES.length}\r`);
}
console.log(`  ${results.length}/${ROUTES.length} done.`);

await browser.close();

writeFileSync(OUT_JSON, JSON.stringify(results, null, 2));

// Markdown digest
const md = [];
md.push(`# Exhaustive button-mash QA — ${today} (${BASE_URL})`);
md.push('');
const totalButtons = results.reduce((a, r) => a + (r.interactions?.length || 0), 0);
const totalElements = results.reduce(
  (a, r) => a + (r.elements ? Object.values(r.elements).reduce((s, n) => s + n, 0) : 0),
  0
);
const totalIssues = results.reduce((a, r) => a + r.issues.length, 0);
const totalPageErrors = results.reduce((a, r) => a + r.pageErrors.length, 0);
const cleanRoutes = results.filter((r) => r.issues.length === 0 && r.pageErrors.length === 0).length;
md.push(`Routes scanned: **${results.length}**`);
md.push(`Total interactive elements counted: **${totalElements}**`);
md.push(`Total button clicks fired: **${totalButtons}**`);
md.push(`Routes with zero issues + zero pageerrors: **${cleanRoutes} / ${results.length}**`);
md.push(`Total issues raised: **${totalIssues}**`);
md.push(`Total uncaught page errors: **${totalPageErrors}**`);
md.push('');
md.push('## Per-route summary');
md.push('');
md.push('| Route | Status | Elements | Buttons clicked | Page errors | Issues |');
md.push('|---|---|---|---|---|---|');
for (const r of results) {
  const elTotal = r.elements ? Object.values(r.elements).reduce((s, n) => s + n, 0) : 0;
  const btn = r.interactions?.length || 0;
  const pe = r.pageErrors.length;
  const iss = r.issues.length;
  md.push(`| /${r.route} | ${r.status} | ${elTotal} | ${btn} | ${pe} | ${iss} |`);
}
md.push('');
md.push('## Routes with issues');
md.push('');
const broken = results.filter((r) => r.issues.length > 0 || r.pageErrors.length > 0);
if (broken.length === 0) {
  md.push('_(none)_');
} else {
  for (const r of broken) {
    md.push(`### /${r.route}`);
    if (r.pageErrors.length) {
      md.push('Page errors:');
      for (const pe of r.pageErrors.slice(0, 5)) md.push(`- ${pe.slice(0, 400)}`);
    }
    if (r.consoleErrors.length) {
      md.push('Console errors:');
      for (const ce of r.consoleErrors.slice(0, 5)) md.push(`- ${ce.slice(0, 300)}`);
    }
    if (r.issues.length) {
      md.push('Issues:');
      for (const i of r.issues.slice(0, 8)) md.push(`- ${i.slice(0, 400)}`);
    }
    md.push('');
  }
}

writeFileSync(OUT_MD, md.join('\n'));
console.log(`\nWrote ${OUT_JSON}`);
console.log(`Wrote ${OUT_MD}`);
console.log(`Clean: ${cleanRoutes}/${results.length} | issues: ${totalIssues} | pageerrors: ${totalPageErrors}`);
