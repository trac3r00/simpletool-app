/**
 * Environment Variable Manager
 * - Parse .env files
 * - Diff between environments
 * - Mask secrets for safe sharing
 * All processing is client-side.
 */

import { respondHTML } from "../utils/respond.js";
import {
  createPageTemplate,
  createToolHeader,
  createCheatsheet,
  infoHint,
} from "../utils/common-ui.js";
import {
  createEducationalSection,
  createRelatedToolsSection,
} from "../utils/content-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import { createEnvVarEngine } from "../utils/env-var-logic.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";

export async function handleEnvVarManagerRoutes(request, url) {
  const { pathname } = url;
  if (pathname === "/env-var-manager" || pathname === "/env-var-manager/") {
    if (request.method === "GET")
      return respondHTML(
        renderEnvVarManagerPage(resolveRequestLanguage(request, url)),
      );
    return new Response("Method not allowed", { status: 405 });
  }
  return null;
}

function renderEnvVarManagerPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("env-var-manager", currentLang);
  const title = translation?.name || "Env Var Manager";
  const description =
    translation?.desc ||
    "Compare .env files across environments and generate a share-safe (masked) diff.";

  const header = createToolHeader(
    { emoji: "🧪" },
    title,
    description,
    [
      {
        text: '<span data-i18n="tools.env-var-manager.ui.badge0">Diff</span>',
        tooltip: "Find missing keys and value drift between environments.",
      },
      {
        text: '<span data-i18n="tools.env-var-manager.ui.badge1">Mask Secrets</span>',
        tooltip:
          "Generate a shareable report without exposing sensitive values.",
      },
    ],
    { toolId: "env-var-manager" },
  );

  const currentTool = TOOLS.find((t) => t.id === "env-var-manager");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">
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
                ${infoHint("Paste dotenv-style KEY=VALUE lines. Comments (#) are supported. Your input is processed locally and not sent to our servers.", "Help", { i18nKey: "tools.env-var-manager.ui.desc0" })}
              </label>
              <input id="name-a" class="input w-40" value="Dev" aria-label="Name A" data-i18n-aria="tools.env-var-manager.ui.aria0" />
            </div>
            <textarea id="env-a" rows="16" aria-label="Environment A variables" class="input-mono resize-y" placeholder="API_URL=https://dev.example.com&#10;JWT_SECRET=..." data-i18n-placeholder="tools.env-var-manager.ui.placeholder0"></textarea>
            <div id="parse-a" class="hidden text-xs rounded-lg p-3 border"></div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between gap-3">
              <label class="label" data-i18n="tools.env-var-manager.ui.label1">Environment B</label>
              <input id="name-b" class="input w-40" value="Prod" aria-label="Name B" data-i18n-aria="tools.env-var-manager.ui.aria1" />
            </div>
            <textarea id="env-b" rows="16" aria-label="Environment B variables" class="input-mono resize-y" placeholder="API_URL=https://example.com&#10;JWT_SECRET=..." data-i18n-placeholder="tools.env-var-manager.ui.placeholder1"></textarea>
            <div id="parse-b" class="hidden text-xs rounded-lg p-3 border"></div>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-1 space-y-4">
            <div class="tool-group p-5">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.env-var-manager.ui.heading0">Options</h2>
              <label class="inline-flex items-center gap-2 cursor-pointer text-sm text-surface-700 dark:text-surface-300">
                <input id="mask" type="checkbox" class="w-4 h-4 rounded border-surface-300 text-primary-600 dark:text-primary-400 focus:ring-primary-500" checked>
                <span data-i18n="tools.env-var-manager.ui.label2">Mask sensitive values</span>
              </label>
              <div class="mt-3">
                <label class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.env-var-manager.ui.label3">Filter keys</label>
                <input id="filter" aria-label="Filter variables" class="input font-mono" placeholder="e.g., AWS_, SECRET, DB_" data-i18n-placeholder="tools.env-var-manager.ui.placeholder2" />
              </div>
            </div>

            <div class="p-5 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.env-var-manager.ui.heading1">Summary</h2>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="tool-group p-3">
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase" data-i18n="tools.env-var-manager.ui.stat0">Same</div>
                  <div class="text-xl font-bold font-mono" id="same-count">0</div>
                </div>
                <div class="tool-group p-3">
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase" data-i18n="tools.env-var-manager.ui.stat1">Changed</div>
                  <div class="text-xl font-bold font-mono" id="changed-count">0</div>
                </div>
                <div class="tool-group p-3">
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase" data-i18n="tools.env-var-manager.ui.stat2">Only A</div>
                  <div class="text-xl font-bold font-mono" id="only-a-count">0</div>
                </div>
                <div class="tool-group p-3">
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase" data-i18n="tools.env-var-manager.ui.stat3">Only B</div>
                  <div class="text-xl font-bold font-mono" id="only-b-count">0</div>
                </div>
              </div>
            </div>

            <div class="tool-group p-5">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.env-var-manager.ui.heading2">Share-safe report</h2>
              <textarea id="share" rows="10" aria-label="Shareable comparison output" class="input-mono resize-y bg-surface-50 dark:bg-surface-950" readonly placeholder="Click Compare to generate..." data-i18n-placeholder="tools.env-var-manager.ui.placeholder3"></textarea>
            </div>
          </div>

          <div class="lg:col-span-2">
            <div class="tool-group p-5">
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

        ${createCheatsheet(
          "env-var-manager",
          '<span data-i18n="tools.env-var-manager.ui.heading4">Dotenv Notes</span>',
          [
            {
              heading:
                '<span data-i18n="tools.env-var-manager.ui.heading5">Masking strategy</span>',
              content: `
              <p data-i18n="tools.env-var-manager.ui.desc2">Sensitive keys are detected by name (SECRET, TOKEN, KEY, PASSWORD, etc.) and by value heuristics (JWT-like, long random strings). You can disable masking to see raw values locally.</p>
            `,
            },
            {
              heading:
                '<span data-i18n="tools.env-var-manager.ui.heading6">Parsing</span>',
              content: `
              <ul class="list-disc ml-6 space-y-1">
                <li><span data-i18n="tools.env-var-manager.ui.desc3">Supports</span> <code>export KEY=VALUE</code></li>
                <li><span data-i18n="tools.env-var-manager.ui.desc4">Supports quoted values</span> (<code>"..."</code> <span data-i18n="tools.env-var-manager.ui.text1">or</span> <code>'...'</code>)</li>
                <li><span data-i18n="tools.env-var-manager.ui.desc5">Inline comments are stripped for unquoted values</span> (<code>VALUE # comment</code>)</li>
              </ul>
            `,
            },
          ],
        )}
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection(
        [
          {
            title: "Environment Variables Best Practices",
            content:
              '<p>Environment variables are a fundamental part of the "Twelve-Factor App" methodology, which advocates for a strict separation of configuration from code. By using environment variables, you can run the same code in different environments (development, staging, production) simply by changing the configuration values.</p><p>Best practices include using descriptive, uppercase names (e.g., <code>DATABASE_URL</code>), providing default values for non-critical settings, and never hardcoding sensitive information directly into your source control.</p>',
          },
          {
            title: "Secret Management",
            content:
              "<p>Secrets are a special category of environment variables that contain sensitive information like API keys, database passwords, and private certificates. Managing these securely is critical to preventing data breaches. You should use a dedicated secret management service (like AWS Secrets Manager, HashiCorp Vault, or Cloudflare Secrets) for production environments.</p><p>For local development, <code>.env</code> files are commonly used, but they should <strong>never</strong> be committed to your git repository. Always add <code>*.env</code> to your <code>.gitignore</code> file.</p>",
          },
          {
            title: ".env Security",
            content:
              '<p>When sharing <code>.env</code> files with teammates for debugging, there is a high risk of accidentally exposing production secrets. Our manager helps mitigate this risk by providing a "Mask sensitive values" feature. It uses heuristics to identify keys like <code>SECRET</code>, <code>TOKEN</code>, or <code>PASSWORD</code> and replaces their values with a masked version (e.g., <code>ab...yz (32)</code>).</p><p>This allows you to compare the structure and non-sensitive values of your environment files without leaking the actual secrets.</p>',
          },
          {
            title: "Pro Tips",
            content:
              '<ul><li>Use the <strong>"Swap"</strong> button to quickly reverse the comparison direction between Environment A and Environment B.</li><li>Leverage the <strong>"Filter keys"</strong> input to focus on specific groups of variables, such as all keys starting with <code>AWS_</code> or <code>DB_</code>.</li><li>Always include a <code>.env.example</code> file in your repository with dummy values to show other developers which variables are required for the app to run.</li><li data-i18n="tools.env-var-manager.ui.r3_0">Remember that environment variables are typically strings; if your app needs a boolean or a number, ensure you parse the value correctly in your code.</li></ul>',
          },
        ],
        "env-var-manager",
        currentLang,
      )}
    ${createRelatedToolsSection(relatedToolsData)}
    </div>
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

      const engine = (${createEnvVarEngine.toString()})();
      const parseDotenv = engine.parseDotenv;
      const diffEnvs = engine.diffEnvs;
      const isSensitive = engine.isSensitive;
      const maskValue = engine.maskValue;

      function parseMessage(e) {
        if (e.code === 'missing_eq') return fmt(t('text0', 'Missing "=" in: {v}'), { v: e.v });
        if (e.code === 'invalid_key') return fmt(t('text1', 'Invalid key: {key}'), { key: e.key });
        return 'Unterminated quoted value for ' + e.key;
      }

      function renderParseInfo(el, parsed, envName) {
        const issues = [
          ...parsed.errors.map(e => ({ line: e.line, text: parseMessage(e) })),
          ...parsed.duplicates.map(d => ({ line: d.line, text: fmt(t('text2', 'duplicate key {key}'), { key: d.key }) }))
        ].sort((x, y) => x.line - y.line).map(i => 'L' + i.line + ': ' + i.text);
        if (!issues.length) {
          el.classList.add('hidden');
          el.innerHTML = '';
          return;
        }
	        el.classList.remove('hidden');
	        el.className = 'text-xs rounded-lg p-3 border bg-warning-50 dark:bg-warning-900/20 text-warning-800 dark:text-warning-200 border-warning-200 dark:border-warning-800';
	        el.innerHTML = '<div class="font-semibold mb-1">' + escapeHtml(fmt(t('text3', '{env} parse notes'), { env: envName })) + '</div><ul class="list-disc ml-5 space-y-0.5">' +
	          issues.slice(0, 8).map(s => '<li>' + s.replace(/</g, '&lt;') + '</li>').join('') +
	          (issues.length > 8 ? '<li>…</li>' : '') +
	          '</ul>';
	      }

       function statusLabel(status) {
         if (status === 'same') return { text: t('text4', 'Same'), cls: 'text-success-700 dark:text-success-200' };
        if (status === 'changed') return { text: t('text5', 'Changed'), cls: 'text-warning-700 dark:text-warning-200' };
        if (status === 'onlyA') return { text: t('text6', 'Only A'), cls: 'text-surface-700 dark:text-surface-200' };
        return { text: t('text7', 'Only B'), cls: 'text-surface-700 dark:text-surface-200' };
      }

      function renderTable(rows) {
        const filter = els.filter.value;
        const mask = els.mask.checked;

        els.tbody.innerHTML = '';

        let visible = 0;
        let same = 0, changed = 0, onlyA = 0, onlyB = 0;

        rows.forEach(r => {
          if (r.status === 'same') same++;
          else if (r.status === 'changed') changed++;
          else if (r.status === 'onlyA') onlyA++;
          else onlyB++;

          if (!engine.keyMatchesFilter(r.key, filter)) return;
          visible++;

          const sensitive = isSensitive(r.key, r.av, r.bv);
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
        if (!visible) {
          els.empty.textContent = rows.length ? 'No keys match the filter.' : 'No variables found. Paste KEY=VALUE lines into A and B.';
        }
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
            const sensitive = isSensitive(r.key, r.av, r.bv);
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
      const emptyText = els.empty.textContent;

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
        runCompare();
      });
      els.clear.addEventListener('click', () => {
        els.envA.value = '';
        els.envB.value = '';
        els.share.value = '';
        els.tbody.innerHTML = '';
        els.empty.style.display = '';
        els.empty.textContent = emptyText;
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
          const old = els.copyReport.innerHTML;
          els.copyReport.textContent = t('text16', '✓ Copied');
          if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
          setTimeout(() => (els.copyReport.innerHTML = old), 1200);
        } catch (e) {
          els.copyReport.textContent = 'Copy failed: select the report and copy it manually.';
        }
      });
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: "/env-var-manager",
    content,
    scripts,
    lang: currentLang,
  });
}
