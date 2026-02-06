import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

import { handleEmailAnalyzerRoutes } from '../src/routes/email-analyzer.js';
import { handleTokenCounterRoutes } from '../src/routes/token-counter.js';
import { handlePromptTemplateBuilderRoutes } from '../src/routes/prompt-template-builder.js';
import { handleSQLFormatterRoutes } from '../src/routes/sql-formatter.js';
import { handleEnvVarManagerRoutes } from '../src/routes/env-var-manager.js';
import { handleSVGOptimizerRoutes } from '../src/routes/svg-optimizer.js';
import { handleCSPBuilderRoutes } from '../src/routes/csp-builder.js';
import { handleSecretScannerRoutes } from '../src/routes/secret-scanner.js';

const filterAppErrors = (errors) => errors.filter(e =>
  !e.includes('favicon') && !e.includes('google') &&
  !e.includes('ERR_BLOCKED') && !e.includes('ERR_CONNECTION_REFUSED') &&
  !e.includes('googletagmanager')
);

async function readText(url) {
  return fs.readFile(url, 'utf8');
}

async function readBin(url) {
  return fs.readFile(url);
}

function withBase(html) {
  if (html.includes('<base ')) return html;
  return html.replace('<head>', '<head>\n  <base href="http://local/" />');
}

async function renderToolHtml(handler, pathname) {
  const url = new URL('http://local' + pathname);
  const req = new Request(url.toString(), { method: 'GET' });
  const res = await handler(req, url);
  if (!res) throw new Error('No response from handler for ' + pathname);
  const html = await res.text();
  return withBase(html);
}

async function setupAssetRoutes(page) {
  const stylesCss = await readText(new URL('../dist/styles.css', import.meta.url));
  const purifyJs = await readText(new URL('../dist/vendor/purify.min.js', import.meta.url));
  const materialCss = await readText(new URL('../dist/fonts/material-symbols.css', import.meta.url));
  const materialWoff2 = await readBin(new URL('../dist/fonts/material-symbols.woff2', import.meta.url));

  await page.route('**/*', async (route) => {
    const requestUrl = new URL(route.request().url());

    // Block external calls
    if (requestUrl.origin !== 'http://local') {
      return route.abort();
    }

    const path = requestUrl.pathname;

    if (path === '/styles.css') {
      return route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: stylesCss });
    }
    if (path === '/vendor/purify.min.js') {
      return route.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', body: purifyJs });
    }
    if (path === '/fonts/material-symbols.css') {
      return route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: materialCss });
    }
    if (path === '/fonts/material-symbols.woff2') {
      return route.fulfill({ status: 200, contentType: 'font/woff2', body: materialWoff2 });
    }
    if (path === '/favicon.ico') {
      return route.fulfill({ status: 204, body: '' });
    }

    return route.fulfill({ status: 404, body: '' });
  });
}

test.describe('New Tools QA (offline, no webServer)', () => {
  test('Email Security Analyzer — 20 mock emails', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await setupAssetRoutes(page);
    await page.setContent(await renderToolHtml(handleEmailAnalyzerRoutes, '/email-analyzer'), { waitUntil: 'domcontentloaded' });

    const cases = [
      {
        name: 'all pass',
        raw: [
          'Return-Path: <bounce@mailer.example.net>',
          'Authentication-Results: mx;',
          ' spf=pass smtp.mailfrom=bounce@mailer.example.net;',
          ' dkim=pass header.i=@example.net header.s=s1;',
          ' dmarc=pass header.from=example.net',
          'From: billing@example.net',
          'To: soc@example.com',
          'Subject: Invoice',
          '',
          'Hello https://example.net/pay'
        ].join('\n'),
        exp: { spf: 'pass', dkim: 'pass', dmarc: 'pass', minUrls: 1 }
      },
      {
        name: 'dmarc fail',
        raw: [
          'Authentication-Results: mx; spf=pass smtp.mailfrom=a@evil.tld; dkim=pass header.i=@evil.tld; dmarc=fail header.from=example.com',
          'From: ceo@example.com',
          'Reply-To: attacker@evil.tld',
          'To: finance@example.com',
          'Subject: urgent',
          '',
          'pay now http://xn--exmple-qta.net'
        ].join('\n'),
        exp: { spf: 'pass', dkim: 'pass', dmarc: 'fail', minUrls: 1 }
      },
      {
        name: 'spf fail',
        raw: [
          'Authentication-Results: mx; spf=fail smtp.mailfrom=a@example.net; dkim=pass header.i=@example.net; dmarc=fail header.from=example.net',
          'From: a@example.net',
          'To: b@example.net',
          'Subject: test',
          '',
          'https://example.net'
        ].join('\n'),
        exp: { spf: 'fail', dkim: 'pass', dmarc: 'fail', minUrls: 1 }
      },
      {
        name: 'received-spf fallback',
        raw: [
          'Received-SPF: pass (domain of example.net designates 203.0.113.10 as permitted sender)',
          'From: a@example.net',
          'To: b@example.net',
          'Subject: test',
          '',
          'no links'
        ].join('\n'),
        exp: { spf: 'pass', dkim: 'unknown', dmarc: 'unknown', minUrls: 0 }
      },
      {
        name: 'no auth headers',
        raw: [
          'From: a@example.net',
          'To: b@example.net',
          'Subject: test',
          '',
          'https://example.net'
        ].join('\n'),
        exp: { spf: 'unknown', dkim: 'unknown', dmarc: 'unknown', minUrls: 1 }
      },
    ];

    while (cases.length < 20) {
      const i = cases.length + 1;
      const spf = (i % 3 === 0) ? 'fail' : 'pass';
      const dkim = (i % 4 === 0) ? 'fail' : 'pass';
      const dmarc = (spf === 'pass' && dkim === 'pass') ? 'pass' : (i % 2 ? 'fail' : 'pass');
      const url = (i % 5 === 0) ? `http://203.0.113.${i}` : `https://example.net/path/${i}`;
      cases.push({
        name: 'gen-' + i,
        raw: [
          `Authentication-Results: mx; spf=${spf} smtp.mailfrom=a@example.net; dkim=${dkim} header.i=@example.net; dmarc=${dmarc} header.from=example.net`,
          `Received: from mail.example.net (mail.example.net [203.0.113.${i}]) by mx with ESMTP; Tue, 21 Jan 2025 10:20:30 -0800`,
          'From: a@example.net',
          'To: b@example.net',
          'Subject: test ' + i,
          '',
          'See: ' + url
        ].join('\n'),
        exp: { spf, dkim, dmarc, minUrls: 1 }
      });
    }

    for (const tc of cases) {
      await test.step(tc.name, async () => {
        await page.locator('#email-input').fill(tc.raw);
        await page.click('#analyze-btn');
        await page.waitForTimeout(50);
        await expect(page.locator('#spf-result')).toHaveText(new RegExp(tc.exp.spf, 'i'));
        await expect(page.locator('#dkim-result')).toHaveText(new RegExp(tc.exp.dkim, 'i'));
        await expect(page.locator('#dmarc-result')).toHaveText(new RegExp(tc.exp.dmarc, 'i'));
      });
    }

    expect(filterAppErrors(errors)).toHaveLength(0);
  });

  test('Token Counter — 15 mock texts', async ({ page }) => {
    await setupAssetRoutes(page);
    await page.setContent(await renderToolHtml(handleTokenCounterRoutes, '/token-counter'), { waitUntil: 'domcontentloaded' });

    const texts = [
      'hello world',
      '한국어 문장 하나입니다. 토큰이 어떻게 추정되는지 확인합니다.',
      '日本語の文章です。トークン推定の確認。',
      'function hello(){return "world";}',
      JSON.stringify({ a: 1, b: [1, 2, 3], c: { nested: true } }),
      'A'.repeat(2000),
      'The quick brown fox jumps over the lazy dog.'.repeat(50),
    ];
    while (texts.length < 15) texts.push('case-' + texts.length + ' ' + 'lorem ipsum '.repeat(texts.length + 5));

    await page.locator('#gpt-in-rate').fill('5');
    await page.locator('#gpt-out-rate').fill('15');
    await page.locator('#out-tokens').fill('1000');

    for (const [i, t] of texts.entries()) {
      await test.step('text-' + i, async () => {
        await page.locator('#text').fill(t);
        await page.waitForTimeout(50);
        const gptIn = Number((await page.locator('#gpt-in').textContent())?.replace(/,/g, '') || '0');
        expect(gptIn).toBeGreaterThan(0);
      });
    }

    const costText = await page.locator('#gpt-cost').textContent();
    expect(costText || '').toMatch(/\$\d+\.\d{2}/);
  });

  test('Prompt Template Builder — 10 configs', async ({ page }) => {
    await setupAssetRoutes(page);
    await page.setContent(await renderToolHtml(handlePromptTemplateBuilderRoutes, '/prompt-template-builder'), { waitUntil: 'domcontentloaded' });

    const configs = [
      { target: 'gpt', outFormat: 'markdown', role: 'You are a senior backend engineer.', task: 'Explain this stacktrace and propose fixes.', vars: 'stacktrace, context' },
      { target: 'claude', outFormat: 'json', role: 'You are a security engineer.', task: 'Generate an incident triage plan.', vars: 'incident_summary, logs' },
      { target: 'generic', outFormat: 'checklist', role: 'You are an SRE.', task: 'Write a runbook to diagnose latency spikes.', vars: 'service_name, metrics' },
    ];
    while (configs.length < 10) configs.push({ target: 'gpt', outFormat: 'markdown', role: 'You are a helpful assistant.', task: 'Summarize: ' + configs.length, vars: 'input' });

    for (const [i, c] of configs.entries()) {
      await test.step('cfg-' + i, async () => {
        await page.locator('#target').selectOption(c.target);
        await page.locator('#out-format').selectOption(c.outFormat);
        await page.locator('#role').fill(c.role);
        await page.locator('#task').fill(c.task);
        await page.locator('#vars').fill(c.vars);
        await page.waitForTimeout(30);

        if (c.target === 'claude') {
          const user = await page.locator('#user').inputValue();
          expect(user).toContain('<task>');
        } else if (c.target === 'generic') {
          const single = await page.locator('#single').inputValue();
          expect(single).toContain('Task:');
        } else {
          const user = await page.locator('#user').inputValue();
          expect(user).toContain('# Task');
        }
      });
    }
  });

  test('SQL Formatter & Validator — 25 queries', async ({ page }) => {
    await setupAssetRoutes(page);
    await page.setContent(await renderToolHtml(handleSQLFormatterRoutes, '/sql-formatter'), { waitUntil: 'domcontentloaded' });

    const queries = [
      { sql: 'select id,email from users where id=1 and active=true order by created_at desc;', valid: true },
      { sql: "SELECT * FROM t WHERE name = 'unterminated;", valid: false, expect: 'Unclosed single-quoted string' },
      { sql: 'SELECT (1 + 2 FROM t;', valid: false, expect: 'Unbalanced parentheses' },
      { sql: '/* comment without end SELECT 1;', valid: false, expect: 'Unclosed block comment' },
      { sql: 'SELECT a, b, c FROM t;', valid: true },
    ];
    while (queries.length < 25) {
      const i = queries.length;
      const ok = i % 5 !== 0;
      queries.push({
        sql: ok ? `SELECT col${i}, col${i + 1} FROM t WHERE a=${i} AND b=${i + 1};` : `SELECT col${i} FROM t WHERE a='oops;`,
        valid: ok,
      });
    }

    for (const [i, q] of queries.entries()) {
      await test.step('q-' + i, async () => {
        await page.locator('#sql-in').fill(q.sql);
        await page.click('#format');
        await page.waitForTimeout(50);
        const out = await page.locator('#sql-out').inputValue();
        expect(out).toContain('\n');

        await page.click('#validate');
        await page.waitForTimeout(20);
        const issuesText = await page.locator('#issues').textContent();
        if (q.valid) {
          expect(issuesText || '').toMatch(/No issues detected|✓/);
        } else if (q.expect) {
          expect(issuesText || '').toContain(q.expect);
        }
      });
    }
  });

  test('Env Var Manager — 15 diffs', async ({ page }) => {
    await setupAssetRoutes(page);
    await page.setContent(await renderToolHtml(handleEnvVarManagerRoutes, '/env-var-manager'), { waitUntil: 'domcontentloaded' });

    const pairs = [
      { a: 'A=1\nB=2\nJWT_SECRET=devsecret', b: 'A=1\nB=3\nJWT_SECRET=prodsecret\nC=9', exp: { same: 1, changed: 2, onlyA: 0, onlyB: 1 } },
      { a: 'API_URL=https://dev\nPASSWORD="abc12345"\n', b: 'API_URL=https://dev\nPASSWORD="abc12345"\n', exp: { same: 2, changed: 0, onlyA: 0, onlyB: 0 } },
      { a: 'export X=1\nY=2 # comment', b: 'X=1\nY=2\nZ=3', exp: { same: 2, changed: 0, onlyA: 0, onlyB: 1 } },
    ];
    while (pairs.length < 15) {
      const i = pairs.length;
      pairs.push({
        a: `K${i}=A${i}\nSECRET_${i}=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`,
        b: `K${i}=B${i}\nSECRET_${i}=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\nONLY_${i}=x`,
        exp: { same: 0, changed: 2, onlyA: 0, onlyB: 1 }
      });
    }

    for (const [i, p] of pairs.entries()) {
      await test.step('pair-' + i, async () => {
        await page.locator('#env-a').fill(p.a);
        await page.locator('#env-b').fill(p.b);
        await page.click('#compare');
        await page.waitForTimeout(60);

        const same = Number(await page.locator('#same-count').textContent() || '0');
        const changed = Number(await page.locator('#changed-count').textContent() || '0');
        const onlyA = Number(await page.locator('#only-a-count').textContent() || '0');
        const onlyB = Number(await page.locator('#only-b-count').textContent() || '0');

        expect(same).toBe(p.exp.same);
        expect(changed).toBe(p.exp.changed);
        expect(onlyA).toBe(p.exp.onlyA);
        expect(onlyB).toBe(p.exp.onlyB);
      });
    }
  });

  test('SVG Optimizer — 8 SVGs (sanitize + recolor)', async ({ page }) => {
    await setupAssetRoutes(page);
    await page.setContent(await renderToolHtml(handleSVGOptimizerRoutes, '/svg-optimizer'), { waitUntil: 'domcontentloaded' });

    // Ensure DOMPurify is available before interacting
    await page.waitForFunction(() => Boolean(window.DOMPurify));

    const svgs = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#ff0000"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" onload="alert(1)"><circle cx="5" cy="5" r="4" fill="#00ff00"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>alert(1)</script><path d="M0 0h10v10H0z" fill="#000"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><g style="fill:#123456"><path d="M0 0h10v10H0z"/></g></svg>',
    ];
    while (svgs.length < 8) svgs.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M${svgs.length} 0h10v10H0z" fill="#${svgs.length}${svgs.length}${svgs.length}"/></svg>`);

    for (const [i, svg] of svgs.entries()) {
      await test.step('svg-' + i, async () => {
        await page.locator('#svg-input').fill(svg);
        await page.click('#optimize-btn');
        await page.waitForTimeout(120);
        const out = await page.locator('#svg-output').inputValue();
        expect(out).toContain('<svg');
        expect(out.toLowerCase()).not.toContain('<script');
        expect(out.toLowerCase()).not.toContain('onload=');
      });
    }

    await page.locator('#svg-input').fill('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#ff0000"/></svg>');
    await page.click('#preview-btn');
    await page.waitForTimeout(120);
    const colorRow = page.locator('#colors input').first();
    await colorRow.fill('#0000ff');
    await page.click('#apply-colors');
    await page.waitForTimeout(80);
    const recolored = await page.locator('#svg-output').inputValue();
    expect(recolored).toContain('#0000ff');
  });

  test('CSP Builder — baseline + parse', async ({ page }) => {
    await setupAssetRoutes(page);
    await page.setContent(await renderToolHtml(handleCSPBuilderRoutes, '/csp-builder'), { waitUntil: 'domcontentloaded' });

    await page.click('#apply-baseline');
    await page.waitForTimeout(30);
    const out = await page.locator('#csp-output').inputValue();
    expect(out).toContain('Content-Security-Policy');
    expect(out).toContain("object-src 'none'");

    await page.locator('#csp-input').fill("default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none';");
    await page.click('#parse');
    await page.waitForTimeout(30);
    const warnings = await page.locator('#warnings').textContent();
    expect(warnings || '').toMatch(/unsafe-inline/i);
  });

  test('Secret Scanner — 15 mock leaks', async ({ page }) => {
    await setupAssetRoutes(page);
    await page.setContent(await renderToolHtml(handleSecretScannerRoutes, '/secret-scanner'), { waitUntil: 'domcontentloaded' });

    const samples = [
      'AKIA0123456789ABCDE1',
      'github_pat_1234567890_abcdefghijklmnopqrstuvwxyz',
      'ghp_0123456789abcdefghijklmnopqrstuvwxyzABCDEF0123',
      'AIzaSyA-0123456789_abcdefghijklmnopqrstuvwxyzABCD',
      'sk_live_0123456789abcdefghijklmnopqrstuvwxyz',
      'xoxb-1234567890-abcdefg-hijklmnop',
      'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.signature',
      'password="supersecret"',
      'api_key: "abcdefg1234567890"',
      '-----BEGIN PRIVATE KEY-----',
    ];
    while (samples.length < 15) samples.push('token="' + 'a'.repeat(20 + samples.length) + '"');

    await page.locator('#input').fill(samples.join('\n'));
    await page.click('#scan');
    await page.waitForTimeout(80);

    const high = Number(await page.locator('#high').textContent() || '0');
    const redacted = await page.locator('#redacted').inputValue();
    expect(high).toBeGreaterThan(0);
    expect(redacted).toContain('[REDACTED:');
  });
});

