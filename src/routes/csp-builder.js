/**
 * CSP Header Builder
 * - Builds a Content-Security-Policy header interactively
 * - Parses existing CSP strings
 * - Explains directives and flags risky settings
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint } from '../utils/common-ui.js';

export async function handleCSPBuilderRoutes(request, url) {
  const { pathname } = url;
  if (pathname === '/csp-builder' || pathname === '/csp-builder/') {
    if (request.method === 'GET') return respondHTML(renderCSPBuilderPage());
    return new Response('Method not allowed', { status: 405 });
  }
  return null;
}

function renderCSPBuilderPage() {
  const title = 'CSP Header Builder';
  const description = 'Build a Content-Security-Policy header with clear explanations and safety checks.';

  const header = createToolHeader(
    { emoji: '🧱' },
    title,
    description,
    [
      { text: '<span data-i18n="tools.csp-builder.ui.badge0">Interactive</span>', tooltip: 'Edit directives and instantly see the full header value.' },
      { text: '<span data-i18n="tools.csp-builder.ui.badge1">Security Checks</span>', tooltip: 'Warns on unsafe-inline, wildcard sources, and missing baselines.' }
    ],
    { toolId: 'csp-builder' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${header}

        <div class="flex flex-wrap gap-3 mb-6 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
          <button id="apply-baseline" class="btn btn-primary">✅ <span data-i18n="tools.csp-builder.ui.button0">Baseline</span></button>
          <button id="parse" class="btn btn-secondary">🧩 <span data-i18n="tools.csp-builder.ui.button1">Parse</span></button>
          <button id="clear" class="btn btn-ghost ml-auto">🗑️ <span data-i18n="tools.csp-builder.ui.button2">Clear</span></button>
          <button id="copy" class="btn btn-secondary" disabled>📋 <span data-i18n="tools.csp-builder.ui.button3">Copy Header</span></button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <label class="label flex items-center gap-2">
                <span data-i18n="tools.csp-builder.ui.label0">Existing CSP (optional)</span>
                ${infoHint('Paste only the policy value (everything after “Content-Security-Policy:”). Then click Parse.', 'Help', { i18nKey: 'tools.csp-builder.ui.desc0' })}
              </label>
              <textarea id="csp-input" rows="6" class="input-mono resize-y" placeholder="default-src 'self'; script-src 'self' 'nonce-{{nonce}}'; object-src 'none'; base-uri 'none';" data-i18n-placeholder="tools.csp-builder.ui.placeholder0"></textarea>
              <div class="mt-3 flex items-center justify-between gap-3">
                <label class="inline-flex items-center gap-2 cursor-pointer text-sm text-surface-700 dark:text-surface-300">
                  <input id="report-only" type="checkbox" class="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500">
                  <span data-i18n="tools.csp-builder.ui.label1">Report-Only header</span>
                </label>
                <div class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.csp-builder.ui.desc1">Tip: Use Report-Only to test safely in production.</div>
              </div>
            </div>

            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.csp-builder.ui.heading0">Warnings</h2>
              <div id="warnings" class="text-sm text-surface-700 dark:text-surface-200">
                <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.csp-builder.ui.desc2">No warnings yet.</p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <div class="flex items-center justify-between mb-3">
                <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.csp-builder.ui.heading1">Directives</h2>
                <span class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.csp-builder.ui.text0">Space-separated sources</span>
              </div>

              <div class="space-y-3">
                ${directiveRow('default-src', "Fallback for most fetches", "e.g., 'self'")}
                ${directiveRow('script-src', "JS sources (use nonce/hash, avoid unsafe-inline)", "e.g., 'self' 'nonce-{{nonce}}'")}
                ${directiveRow('style-src', "CSS sources (consider hashes/nonces)", "e.g., 'self'")}
                ${directiveRow('img-src', "Images", "e.g., 'self' data: https:")}
                ${directiveRow('connect-src', "XHR/fetch/WebSocket", "e.g., 'self' https://api.example.com")}
                ${directiveRow('font-src', "Fonts", "e.g., 'self' data:")}
                ${directiveRow('frame-src', "Frames/iframes", "e.g., 'self'")}
                ${directiveRow('object-src', "Plugins (usually 'none')", "e.g., 'none'")}
                ${directiveRow('base-uri', "Restrict <base> tag", "e.g., 'none'")}
                ${directiveRow('form-action', "Where forms can POST", "e.g., 'self'")}
                ${directiveRow('frame-ancestors', "Who can embed you", "e.g., 'none'")}
              </div>
            </div>

            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <label class="label flex items-center gap-2">
                <span data-i18n="tools.csp-builder.ui.label2">Header output</span>
                ${infoHint('Copy this into your server response headers. For testing, prefer “Content-Security-Policy-Report-Only”.', 'Help', { i18nKey: 'tools.csp-builder.ui.desc3' })}
              </label>
              <textarea id="csp-output" rows="7" class="input-mono resize-y bg-surface-50 dark:bg-surface-950" readonly></textarea>
              <div class="mt-2 text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.csp-builder.ui.desc4">This tool does not validate your site behavior — always test in a staging environment.</div>
            </div>
          </div>
        </div>

        ${createCheatsheet('csp-builder', '<span data-i18n="tools.csp-builder.ui.heading2">CSP Concepts</span>', [
          {
            heading: '<span data-i18n="tools.csp-builder.ui.heading3">Baseline recommendations</span>',
            content: `
              <ul class="list-disc ml-6 space-y-1">
                <li><code>object-src 'none'</code> — <span data-i18n="tools.csp-builder.ui.desc5">blocks plugin content</span></li>
                <li><code>base-uri 'none'</code> — <span data-i18n="tools.csp-builder.ui.desc6">prevents base tag injection</span></li>
                <li><code>frame-ancestors 'none'</code> — <span data-i18n="tools.csp-builder.ui.desc7">prevents clickjacking</span> (<span data-i18n="tools.csp-builder.ui.desc8">or set to allowed origins</span>)</li>
                <li><span data-i18n="tools.csp-builder.ui.desc9">Prefer</span> <strong><span data-i18n="tools.csp-builder.ui.text1">nonces/hashes</span></strong> <span data-i18n="tools.csp-builder.ui.desc10">over</span> <code>'unsafe-inline'</code> <span data-i18n="tools.csp-builder.ui.desc11">for scripts/styles</span></li>
              </ul>
            `
          },
          {
            heading: '<span data-i18n="tools.csp-builder.ui.heading4">Report-Only</span>',
            content: `
              <p data-i18n="tools.csp-builder.ui.desc12">Report-Only lets you monitor policy violations without blocking content. Use it to roll out a strict policy safely.</p>
            `
          }
        ])}
      </div>
    </main>
  `;

  const scripts = String.raw`
    <script>
      const t = (k, fb) => (window._t ? window._t('tools.csp-builder.js.' + k, fb) : (fb || k));

      const $ = (id) => document.getElementById(id);
      const dirIds = [
        'default-src','script-src','style-src','img-src','connect-src',
        'font-src','frame-src','object-src','base-uri','form-action','frame-ancestors'
      ];

      const els = {
        input: $('csp-input'),
        output: $('csp-output'),
        warnings: $('warnings'),
        reportOnly: $('report-only'),
        applyBaseline: $('apply-baseline'),
        parse: $('parse'),
        clear: $('clear'),
        copy: $('copy'),
      };

      const inputs = {};
      dirIds.forEach(id => (inputs[id] = $('dir-' + id)));

      function normalizePolicyValue(s) {
        // Allow full header lines too.
        const raw = String(s || '').trim();
        const m = raw.match(/content-security-policy(-report-only)?:\s*(.*)$/i);
        return m ? m[2].trim() : raw;
      }

      function parseCsp(value) {
        const out = {};
        const v = normalizePolicyValue(value);
        v.split(';').map(p => p.trim()).filter(Boolean).forEach(part => {
          const [name, ...rest] = part.split(/\s+/);
          if (!name) return;
          out[name.toLowerCase()] = rest.join(' ').trim();
        });
        return out;
      }

      function buildCsp() {
        const parts = [];
        dirIds.forEach(name => {
          const v = String(inputs[name].value || '').trim();
          if (!v) return;
          parts.push(name + ' ' + v);
        });
        return parts.join('; ') + (parts.length ? ';' : '');
      }

      function addWarning(level, text) {
        const row = document.createElement('div');
        row.className = 'rounded-lg border p-3 text-sm ' +
          (level === 'high'
            ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
            : level === 'medium'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800'
              : 'bg-surface-50 dark:bg-surface-950 text-surface-800 dark:text-surface-200 border-surface-200 dark:border-surface-800');
        row.textContent = text;
        els.warnings.appendChild(row);
      }

      function validateAndRenderWarnings(policy) {
        els.warnings.innerHTML = '';

        const def = String(inputs['default-src'].value || '').trim();
        if (!def) addWarning('medium', t('text0', "Missing default-src. Consider setting default-src 'self' as a baseline."));

        const script = String(inputs['script-src'].value || '').trim();
        if (script.includes("'unsafe-inline'")) addWarning('high', t('text1', "script-src contains 'unsafe-inline' (XSS risk). Prefer nonces/hashes."));
        if (script.includes('*')) addWarning('high', t('text2', "script-src contains '*' (very permissive). Consider narrowing origins."));
        if (!script) addWarning('medium', t('text3', 'Missing script-src. Many strict policies set script-src explicitly (often with nonces/hashes).'));

        const obj = String(inputs['object-src'].value || '').trim();
        if (!obj) addWarning('medium', t('text4', "Missing object-src. Recommended: object-src 'none'."));
        if (obj && obj !== "'none'") addWarning('low', t('text5', "object-src is not 'none'. If you don't need plugins, set it to 'none'."));

        const base = String(inputs['base-uri'].value || '').trim();
        if (!base) addWarning('medium', t('text6', "Missing base-uri. Recommended: base-uri 'none'."));

        const fa = String(inputs['frame-ancestors'].value || '').trim();
        if (!fa) addWarning('medium', t('text7', "Missing frame-ancestors. Recommended: frame-ancestors 'none' (or allowed origins)."));

        const style = String(inputs['style-src'].value || '').trim();
        if (style.includes("'unsafe-inline'")) addWarning('low', t('text8', "style-src contains 'unsafe-inline'. Consider hashes/nonces if feasible."));

        if (!els.warnings.childElementCount) {
          const p = document.createElement('p');
          p.className = 'text-surface-500 dark:text-surface-400';
          p.textContent = t('text9', 'No warnings detected for basic checks.');
          els.warnings.appendChild(p);
        }
      }

      function updateOutput() {
        const policy = buildCsp();
        const headerName = els.reportOnly.checked ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
        els.output.value = headerName + ': ' + policy;
        els.copy.disabled = !policy.trim();
        validateAndRenderWarnings(policy);
      }

      function applyBaseline() {
        inputs['default-src'].value = "'self'";
        inputs['script-src'].value = "'self' 'nonce-{{nonce}}'";
        inputs['style-src'].value = "'self'";
        inputs['img-src'].value = "'self' data: https:";
        inputs['connect-src'].value = "'self'";
        inputs['font-src'].value = "'self' data:";
        inputs['frame-src'].value = "'self'";
        inputs['object-src'].value = "'none'";
        inputs['base-uri'].value = "'none'";
        inputs['form-action'].value = "'self'";
        inputs['frame-ancestors'].value = "'none'";
        updateOutput();
      }

      els.applyBaseline.addEventListener('click', applyBaseline);
      els.parse.addEventListener('click', () => {
        const parsed = parseCsp(els.input.value);
        dirIds.forEach(name => {
          inputs[name].value = parsed[name] || '';
        });
        // Heuristic: if they pasted report-only header, toggle it
        els.reportOnly.checked = /content-security-policy-report-only:/i.test(String(els.input.value || ''));
        updateOutput();
      });

      els.clear.addEventListener('click', () => {
        els.input.value = '';
        dirIds.forEach(name => (inputs[name].value = ''));
        els.reportOnly.checked = false;
        els.output.value = '';
        els.copy.disabled = true;
        els.warnings.innerHTML = '<p class="text-surface-500 dark:text-surface-400">' + t('text10', 'No warnings yet.') + '</p>';
      });

      els.copy.addEventListener('click', async () => {
        const text = els.output.value;
        if (!text.trim()) return;
        try {
          await navigator.clipboard.writeText(text);
          const old = els.copy.textContent;
          els.copy.textContent = t('text11', '✓ Copied');
          setTimeout(() => (els.copy.textContent = old), 1200);
        } catch (e) {
          console.error('Copy failed:', e);
        }
      });

      els.reportOnly.addEventListener('change', updateOutput);
      dirIds.forEach(name => inputs[name].addEventListener('input', updateOutput));

      // initialize
      updateOutput();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: '/csp-builder',
    content,
    scripts
  });
}

function directiveRow(name, help, placeholder) {
  const id = `dir-${name}`;
  const helpKey = `tools.csp-builder.ui.dirHelp.${name}`;
  const phKey = `tools.csp-builder.ui.dirPlaceholder.${name}`;
  return `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
      <div class="sm:col-span-1">
        <label for="${id}" class="text-xs font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide">${name}</label>
        <div class="text-xs text-surface-500 dark:text-surface-400 mt-1" data-i18n="${helpKey}">${help}</div>
      </div>
      <div class="sm:col-span-2">
        <input id="${id}" class="input font-mono" placeholder="${placeholder}" data-i18n-placeholder="${phKey}" />
      </div>
    </div>
  `;
}
