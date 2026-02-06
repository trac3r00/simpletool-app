/**
 * Environment Variable Manager
 * - Parse .env files
 * - Diff between environments
 * - Mask secrets for safe sharing
 * All processing is client-side.
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint } from '../utils/common-ui.js';

export async function handleEnvVarManagerRoutes(request, url) {
  const { pathname } = url;
  if (pathname === '/env-var-manager' || pathname === '/env-var-manager/') {
    if (request.method === 'GET') return respondHTML(renderEnvVarManagerPage());
    return new Response('Method not allowed', { status: 405 });
  }
  return null;
}

function renderEnvVarManagerPage() {
  const title = 'Env Var Manager';
  const description = 'Compare .env files across environments and generate a share-safe (masked) diff.';

  const header = createToolHeader(
    { emoji: '🧪' },
    title,
    description,
    [
      { text: '<span data-i18n="tools.env-var-manager.ui.badge0">Diff</span>', tooltip: 'Find missing keys and value drift between environments.' },
      { text: '<span data-i18n="tools.env-var-manager.ui.badge1">Mask Secrets</span>', tooltip: 'Generate a shareable report without exposing sensitive values.' }
    ],
    { toolId: 'env-var-manager' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${header}

        <div class="flex flex-wrap gap-3 mb-6 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
          <button id="compare" class="btn btn-primary">🔁 <span data-i18n="tools.env-var-manager.ui.button0">Compare</span></button>
          <button id="swap" class="btn btn-secondary">⇄ <span data-i18n="tools.env-var-manager.ui.button1">Swap</span></button>
          <button id="load-sample" class="btn btn-secondary">🧪 <span data-i18n="tools.env-var-manager.ui.button2">Sample</span></button>
          <button id="clear" class="btn btn-ghost ml-auto">🗑️ <span data-i18n="tools.env-var-manager.ui.button3">Clear</span></button>
          <button id="copy-report" class="btn btn-secondary" disabled>📋 <span data-i18n="tools.env-var-manager.ui.button4">Copy Share Report</span></button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-3">
              <label class="label flex items-center gap-2">
                <span data-i18n="tools.env-var-manager.ui.label0">Environment A</span>
                ${infoHint('Paste dotenv-style KEY=VALUE lines. Comments (#) are supported. No data leaves your device.', 'Help', { i18nKey: 'tools.env-var-manager.ui.desc0' })}
              </label>
              <input id="name-a" class="input w-40" value="Dev" aria-label="Name A" data-i18n-aria="tools.env-var-manager.ui.aria0" />
            </div>
            <textarea id="env-a" rows="16" class="input-mono resize-y" placeholder="API_URL=https://dev.example.com&#10;JWT_SECRET=..." data-i18n-placeholder="tools.env-var-manager.ui.placeholder0"></textarea>
            <div id="parse-a" class="hidden text-xs rounded-lg p-3 border"></div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between gap-3">
              <label class="label" data-i18n="tools.env-var-manager.ui.label1">Environment B</label>
              <input id="name-b" class="input w-40" value="Prod" aria-label="Name B" data-i18n-aria="tools.env-var-manager.ui.aria1" />
            </div>
            <textarea id="env-b" rows="16" class="input-mono resize-y" placeholder="API_URL=https://example.com&#10;JWT_SECRET=..." data-i18n-placeholder="tools.env-var-manager.ui.placeholder1"></textarea>
            <div id="parse-b" class="hidden text-xs rounded-lg p-3 border"></div>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-1 space-y-4">
            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.env-var-manager.ui.heading0">Options</h2>
              <label class="inline-flex items-center gap-2 cursor-pointer text-sm text-surface-700 dark:text-surface-300">
                <input id="mask" type="checkbox" class="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" checked>
                <span data-i18n="tools.env-var-manager.ui.label2">Mask sensitive values</span>
              </label>
              <div class="mt-3">
                <label class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.env-var-manager.ui.label3">Filter keys</label>
                <input id="filter" class="input font-mono" placeholder="e.g., AWS_, SECRET, DB_" data-i18n-placeholder="tools.env-var-manager.ui.placeholder2" />
              </div>
            </div>

            <div class="p-5 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.env-var-manager.ui.heading1">Summary</h2>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="p-3 bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-800">
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase" data-i18n="tools.env-var-manager.ui.stat0">Same</div>
                  <div class="text-xl font-bold font-mono" id="same-count">0</div>
                </div>
                <div class="p-3 bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-800">
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase" data-i18n="tools.env-var-manager.ui.stat1">Changed</div>
                  <div class="text-xl font-bold font-mono" id="changed-count">0</div>
                </div>
                <div class="p-3 bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-800">
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase" data-i18n="tools.env-var-manager.ui.stat2">Only A</div>
                  <div class="text-xl font-bold font-mono" id="only-a-count">0</div>
                </div>
                <div class="p-3 bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-800">
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase" data-i18n="tools.env-var-manager.ui.stat3">Only B</div>
                  <div class="text-xl font-bold font-mono" id="only-b-count">0</div>
                </div>
              </div>
            </div>

            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.env-var-manager.ui.heading2">Share-safe report</h2>
              <textarea id="share" rows="10" class="input-mono resize-y bg-surface-50 dark:bg-surface-950" readonly placeholder="Click Compare to generate..." data-i18n-placeholder="tools.env-var-manager.ui.placeholder3"></textarea>
            </div>
          </div>

          <div class="lg:col-span-2">
            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <div class="flex items-center justify-between mb-3 gap-3">
                <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.env-var-manager.ui.heading3">Diff</h2>
                <span id="row-count" class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.env-var-manager.ui.text0">0 rows</span>
              </div>
              <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                  <thead class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400">
                    <tr>
                      <th class="text-left py-2 pr-4" data-i18n="tools.env-var-manager.ui.th0">Key</th>
                      <th class="text-left py-2 px-3" id="th-a">A</th>
                      <th class="text-left py-2 px-3" id="th-b">B</th>
                      <th class="text-left py-2 pl-3" data-i18n="tools.env-var-manager.ui.th1">Status</th>
                    </tr>
                  </thead>
                  <tbody id="tbody" class="divide-y divide-surface-200 dark:divide-surface-800"></tbody>
                </table>
              </div>
              <div id="empty" class="text-sm text-surface-500 dark:text-surface-400 py-6" data-i18n="tools.env-var-manager.ui.desc1">Click Compare to see differences.</div>
            </div>
          </div>
        </div>

        ${createCheatsheet('env-var-manager', '<span data-i18n="tools.env-var-manager.ui.heading4">Dotenv Notes</span>', [
          {
            heading: '<span data-i18n="tools.env-var-manager.ui.heading5">Masking strategy</span>',
            content: `
              <p data-i18n="tools.env-var-manager.ui.desc2">Sensitive keys are detected by name (SECRET, TOKEN, KEY, PASSWORD, etc.) and by value heuristics (JWT-like, long random strings). You can disable masking to see raw values locally.</p>
            `
          },
          {
            heading: '<span data-i18n="tools.env-var-manager.ui.heading6">Parsing</span>',
            content: `
              <ul class="list-disc ml-6 space-y-1">
                <li><span data-i18n="tools.env-var-manager.ui.desc3">Supports</span> <code>export KEY=VALUE</code></li>
                <li><span data-i18n="tools.env-var-manager.ui.desc4">Supports quoted values</span> (<code>"..."</code> <span data-i18n="tools.env-var-manager.ui.text1">or</span> <code>'...'</code>)</li>
                <li><span data-i18n="tools.env-var-manager.ui.desc5">Inline comments are stripped for unquoted values</span> (<code>VALUE # comment</code>)</li>
              </ul>
            `
          }
        ])}
      </div>
    </main>
  `;

  const scripts = String.raw`
    <script>
      const t = (k, fb) => (window._t ? window._t('tools.env-var-manager.js.' + k, fb) : (fb || k));
      const fmt = (s, vars) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] !== undefined) ? String(vars[k]) : '');

      const $ = (id) => document.getElementById(id);
      const els = {
        nameA: $('name-a'),
        nameB: $('name-b'),
        envA: $('env-a'),
        envB: $('env-b'),
        parseA: $('parse-a'),
        parseB: $('parse-b'),
        compare: $('compare'),
        swap: $('swap'),
        loadSample: $('load-sample'),
        clear: $('clear'),
        copyReport: $('copy-report'),
        mask: $('mask'),
        filter: $('filter'),
        sameCount: $('same-count'),
        changedCount: $('changed-count'),
        onlyACount: $('only-a-count'),
        onlyBCount: $('only-b-count'),
        share: $('share'),
        tbody: $('tbody'),
        empty: $('empty'),
        rowCount: $('row-count'),
        thA: $('th-a'),
        thB: $('th-b'),
      };

	      const SAMPLE_A = [
	        'API_URL=https://dev.example.com',
	        'DB_HOST=localhost',
	        'DB_USER=dev',
	        'DB_PASSWORD=dev-password',
	        'JWT_SECRET=dev_jwt_secret_1234567890',
	        'S3_BUCKET=dev-bucket',
	        'FEATURE_FLAG_NEW_UI=true',
	      ].join('\n');

	      const SAMPLE_B = [
	        'API_URL=https://example.com',
	        'DB_HOST=db.prod.internal',
	        'DB_USER=app',
	        'DB_PASSWORD=prod-password-super-secret',
	        'JWT_SECRET=prod_jwt_secret_abcdef1234567890',
	        'S3_BUCKET=prod-bucket',
	        'FEATURE_FLAG_NEW_UI=false',
	        'SENTRY_DSN=https://public@example.ingest.sentry.io/123',
	      ].join('\n');

	      function normalizeNewlines(s) {
	        return String(s || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
	      }

      function looksSensitiveKey(key) {
        return /(SECRET|TOKEN|API[_-]?KEY|PASSWORD|PASS|PRIVATE|CREDENTIAL|BEARER|SESSION|COOKIE|DSN)/i.test(String(key || ''));
      }

	      function looksSensitiveValue(value) {
	        const v = String(value || '');
	        if (!v) return false;
	        if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(v)) return true; // JWT-ish
	        if (v.length >= 24 && /^[A-Za-z0-9_+/=-]+$/.test(v) && !v.includes(' ')) return true;
	        if (/-----BEGIN [A-Z ]+PRIVATE KEY-----/.test(v)) return true;
	        return false;
	      }

      function maskValue(value) {
        const v = String(value ?? '');
        if (!v) return '';
        if (v.length <= 6) return '[REDACTED]';
        return v.slice(0, 2) + '…' + v.slice(-2) + ' (' + v.length + ')';
      }

	      function parseDotenv(text) {
	        const src = normalizeNewlines(text);
	        const lines = src.split('\n');
        const map = new Map();
        const order = [];
        const duplicates = [];
        const errors = [];

        for (let idx = 0; idx < lines.length; idx++) {
          const raw = lines[idx];
          if (!raw) continue;
          const trimmed = raw.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith('#')) continue;

	          let line = raw;
	          if (/^\s*export\s+/.test(line)) line = line.replace(/^\s*export\s+/, '');

          const eq = line.indexOf('=');
          if (eq <= 0) {
            errors.push({ line: idx + 1, msg: fmt(t('text0', 'Missing "=" in: {v}'), { v: raw.trim().slice(0, 80) }) });
            continue;
          }

          const key = line.slice(0, eq).trim();
          if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
            errors.push({ line: idx + 1, msg: fmt(t('text1', 'Invalid key: {key}'), { key }) });
            continue;
          }

          let valueRaw = line.slice(eq + 1).trim();
          let value = valueRaw;

          // Strip inline comment for unquoted values: VALUE # comment
          if (valueRaw && valueRaw[0] !== '"' && valueRaw[0] !== '\'') {
            const hash = valueRaw.indexOf('#');
            if (hash >= 0) {
              const before = valueRaw.slice(0, hash);
              const prevChar = before.slice(-1);
              if (prevChar === ' ' || prevChar === '\t' || before === '') {
                valueRaw = before.trimEnd();
                value = valueRaw;
              }
            }
          }

          // Unquote
          if (valueRaw.startsWith('"')) {
            const end = valueRaw.lastIndexOf('"');
            value = end > 0 ? valueRaw.slice(1, end) : valueRaw.slice(1);
            value = value
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
          } else if (valueRaw.startsWith("'")) {
            const end = valueRaw.lastIndexOf("'");
            value = end > 0 ? valueRaw.slice(1, end) : valueRaw.slice(1);
          }

          if (map.has(key)) duplicates.push({ line: idx + 1, key });
          map.set(key, { key, value, raw: valueRaw });
          order.push(key);
        }

        return { map, order, duplicates, errors };
      }

      function renderParseInfo(el, parsed, envName) {
        const issues = [
          ...parsed.errors.map(e => 'L' + e.line + ': ' + e.msg),
          ...parsed.duplicates.map(d => 'L' + d.line + ': ' + fmt(t('text2', 'duplicate key {key}'), { key: d.key }))
        ];
        if (!issues.length) {
          el.classList.add('hidden');
          el.innerHTML = '';
          return;
        }
	        el.classList.remove('hidden');
	        el.className = 'text-xs rounded-lg p-3 border bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
	        el.innerHTML = '<div class="font-semibold mb-1">' + escapeHtml(fmt(t('text3', '{env} parse notes'), { env: envName })) + '</div><ul class="list-disc ml-5 space-y-0.5">' +
	          issues.slice(0, 8).map(s => '<li>' + s.replace(/</g, '&lt;') + '</li>').join('') +
	          (issues.length > 8 ? '<li>…</li>' : '') +
	          '</ul>';
	      }

      function diffEnvs(a, b) {
        const keys = new Set([...a.map.keys(), ...b.map.keys()]);
        const rows = [];
        for (const key of Array.from(keys).sort()) {
          const av = a.map.get(key)?.value ?? null;
          const bv = b.map.get(key)?.value ?? null;
          let status = 'same';
          if (av === null) status = 'onlyB';
          else if (bv === null) status = 'onlyA';
          else if (av !== bv) status = 'changed';
          rows.push({ key, av, bv, status });
        }
        return rows;
      }

      function statusLabel(status) {
        if (status === 'same') return { text: t('text4', 'Same'), cls: 'text-green-700 dark:text-green-200' };
        if (status === 'changed') return { text: t('text5', 'Changed'), cls: 'text-yellow-700 dark:text-yellow-200' };
        if (status === 'onlyA') return { text: t('text6', 'Only A'), cls: 'text-surface-700 dark:text-surface-200' };
        return { text: t('text7', 'Only B'), cls: 'text-surface-700 dark:text-surface-200' };
      }

      function renderTable(rows) {
        const filter = els.filter.value.trim().toLowerCase();
        const mask = els.mask.checked;

        els.tbody.innerHTML = '';

        let visible = 0;
        let same = 0, changed = 0, onlyA = 0, onlyB = 0;

        rows.forEach(r => {
          if (r.status === 'same') same++;
          else if (r.status === 'changed') changed++;
          else if (r.status === 'onlyA') onlyA++;
          else onlyB++;

          if (filter && !r.key.toLowerCase().includes(filter)) return;
          visible++;

          const sensitive = looksSensitiveKey(r.key) || looksSensitiveValue(r.av) || looksSensitiveValue(r.bv);
          const avShown = (r.av === null) ? '' : (mask && sensitive ? maskValue(r.av) : r.av);
          const bvShown = (r.bv === null) ? '' : (mask && sensitive ? maskValue(r.bv) : r.bv);

	          const s = statusLabel(r.status);

	          const tr = document.createElement('tr');
	          tr.innerHTML =
	            '<td class="py-3 pr-4 font-mono text-xs sm:text-sm break-words">' + escapeHtml(r.key) + '</td>' +
	            '<td class="py-3 px-3 font-mono text-xs sm:text-sm break-words">' + escapeHtml(avShown) + '</td>' +
	            '<td class="py-3 px-3 font-mono text-xs sm:text-sm break-words">' + escapeHtml(bvShown) + '</td>' +
	            '<td class="py-3 pl-3 font-semibold ' + s.cls + '">' + escapeHtml(s.text) + '</td>';
	          els.tbody.appendChild(tr);
	        });

        els.sameCount.textContent = String(same);
        els.changedCount.textContent = String(changed);
        els.onlyACount.textContent = String(onlyA);
        els.onlyBCount.textContent = String(onlyB);
        els.rowCount.textContent = fmt(t('text8', '{n} rows'), { n: visible });
        els.empty.style.display = visible ? 'none' : '';
      }

      function escapeHtml(s) {
        return String(s ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function buildShareReport(rows, nameA, nameB) {
        const same = rows.filter(r => r.status === 'same').length;
        const changed = rows.filter(r => r.status === 'changed');
        const onlyA = rows.filter(r => r.status === 'onlyA');
        const onlyB = rows.filter(r => r.status === 'onlyB');

        const lines = [];
        lines.push(t('text9', 'Env Diff (share-safe)'));
        lines.push(fmt(t('text10', 'A={a}, B={b}'), { a: nameA, b: nameB }));
        lines.push('');
        lines.push(fmt(t('text11', 'Summary: same={same}, changed={changed}, onlyA={onlyA}, onlyB={onlyB}'), { same, changed: changed.length, onlyA: onlyA.length, onlyB: onlyB.length }));
        lines.push('');

        if (changed.length) {
          lines.push(t('text12', 'Changed:'));
          changed.slice(0, 60).forEach(r => {
            const sensitive = looksSensitiveKey(r.key) || looksSensitiveValue(r.av) || looksSensitiveValue(r.bv);
            const avShown = sensitive ? maskValue(r.av) : r.av;
            const bvShown = sensitive ? maskValue(r.bv) : r.bv;
            lines.push('- ' + r.key + ': ' + avShown + '  ->  ' + bvShown);
          });
          if (changed.length > 60) lines.push(t('text13', '…'));
          lines.push('');
        }

        if (onlyA.length) {
          lines.push(fmt(t('text14', 'Only in {env}:'), { env: nameA }));
          onlyA.slice(0, 60).forEach(r => lines.push('- ' + r.key));
          if (onlyA.length > 60) lines.push(t('text13', '…'));
          lines.push('');
        }
        if (onlyB.length) {
          lines.push(fmt(t('text14', 'Only in {env}:'), { env: nameB }));
          onlyB.slice(0, 60).forEach(r => lines.push('- ' + r.key));
          if (onlyB.length > 60) lines.push(t('text13', '…'));
          lines.push('');
        }

	        lines.push(t('text15', 'Note: Values are masked for safety. Diff is heuristic and does not include comments/order.'));
	        return lines.join('\n');
	      }

      let lastRows = null;

      function runCompare() {
        const a = parseDotenv(els.envA.value);
        const b = parseDotenv(els.envB.value);
        renderParseInfo(els.parseA, a, els.nameA.value || 'A');
        renderParseInfo(els.parseB, b, els.nameB.value || 'B');

        els.thA.textContent = els.nameA.value || 'A';
        els.thB.textContent = els.nameB.value || 'B';

        const rows = diffEnvs(a, b);
        lastRows = rows;
        renderTable(rows);
        els.share.value = buildShareReport(rows, els.nameA.value || 'A', els.nameB.value || 'B');
        els.copyReport.disabled = !rows.length;
      }

      els.compare.addEventListener('click', runCompare);
      els.swap.addEventListener('click', () => {
        const t = els.envA.value;
        els.envA.value = els.envB.value;
        els.envB.value = t;
        const n = els.nameA.value;
        els.nameA.value = els.nameB.value;
        els.nameB.value = n;
        if (lastRows) runCompare();
      });
      els.loadSample.addEventListener('click', () => {
        els.envA.value = SAMPLE_A;
        els.envB.value = SAMPLE_B;
      });
      els.clear.addEventListener('click', () => {
        els.envA.value = '';
        els.envB.value = '';
        els.share.value = '';
        els.tbody.innerHTML = '';
        els.empty.style.display = '';
        els.rowCount.textContent = fmt(t('text8', '{n} rows'), { n: 0 });
        els.sameCount.textContent = '0';
        els.changedCount.textContent = '0';
        els.onlyACount.textContent = '0';
        els.onlyBCount.textContent = '0';
        els.copyReport.disabled = true;
        lastRows = null;
        els.parseA.classList.add('hidden');
        els.parseB.classList.add('hidden');
      });
      els.mask.addEventListener('change', () => { if (lastRows) renderTable(lastRows); });
      els.filter.addEventListener('input', () => { if (lastRows) renderTable(lastRows); });
      els.copyReport.addEventListener('click', async () => {
        const text = els.share.value;
        if (!text.trim()) return;
        try {
          await navigator.clipboard.writeText(text);
          const old = els.copyReport.textContent;
          els.copyReport.textContent = t('text16', '✓ Copied');
          setTimeout(() => (els.copyReport.textContent = old), 1200);
        } catch (e) {
          console.error('Copy failed:', e);
        }
      });
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: '/env-var-manager',
    content,
    scripts
  });
}
