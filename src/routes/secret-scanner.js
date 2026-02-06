/**
 * Secret Scanner
 * - Detects leaked API keys/tokens/passwords using regex heuristics
 * - Generates a redacted (share-safe) version of the input
 * - Runs entirely in the browser
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint } from '../utils/common-ui.js';

export async function handleSecretScannerRoutes(request, url) {
  const { pathname } = url;
  if (pathname === '/secret-scanner' || pathname === '/secret-scanner/') {
    if (request.method === 'GET') return respondHTML(renderSecretScannerPage());
    return new Response('Method not allowed', { status: 405 });
  }
  return null;
}

function renderSecretScannerPage() {
  const title = 'Secret Scanner';
  const description = 'Scan pasted code/config for leaked API keys, tokens, and passwords — then generate a share-safe redaction.';

  const header = createToolHeader(
    { emoji: '🔎' },
    title,
    description,
    [
      { text: '<span data-i18n="tools.secret-scanner.ui.badge0">Local Only</span>', tooltip: 'Nothing is uploaded — scanning happens in your browser.' },
      { text: '<span data-i18n="tools.secret-scanner.ui.badge1">Actionable</span>', tooltip: 'Highlights common key formats and sensitive assignments.' }
    ],
    { toolId: 'secret-scanner' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${header}

        <div class="flex flex-wrap gap-3 mb-6 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
          <button id="scan" class="btn btn-primary">🕵️ <span data-i18n="tools.secret-scanner.ui.button0">Scan</span></button>
          <button id="sample" class="btn btn-secondary">🧪 <span data-i18n="tools.secret-scanner.ui.button1">Sample</span></button>
          <button id="clear" class="btn btn-ghost ml-auto">🗑️ <span data-i18n="tools.secret-scanner.ui.button2">Clear</span></button>
          <button id="copy-redacted" class="btn btn-secondary" disabled>📋 <span data-i18n="tools.secret-scanner.ui.button3">Copy Redacted</span></button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-3">
            <label class="label flex items-center gap-2">
              <span data-i18n="tools.secret-scanner.ui.label0">Input</span>
              ${infoHint('Paste code, logs, configs, CI output, .env, or JSON. This tool uses regex heuristics — false positives are possible.', 'Help', { i18nKey: 'tools.secret-scanner.ui.desc0' })}
            </label>
            <textarea id="input" rows="18" class="input-mono resize-y" placeholder="Paste code/config here..." data-i18n-placeholder="tools.secret-scanner.ui.placeholder0"></textarea>

            <div class="flex flex-wrap items-center gap-4 text-sm text-surface-700 dark:text-surface-300">
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input id="show" type="checkbox" class="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500">
                <span data-i18n="tools.secret-scanner.ui.label1">Show full matches (unsafe)</span>
              </label>
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input id="include-low" type="checkbox" class="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" checked>
                <span data-i18n="tools.secret-scanner.ui.label2">Include low severity patterns</span>
              </label>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.secret-scanner.ui.stat0">High</div>
                <div class="text-xl font-bold font-mono" id="high">0</div>
              </div>
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.secret-scanner.ui.stat1">Medium</div>
                <div class="text-xl font-bold font-mono" id="med">0</div>
              </div>
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.secret-scanner.ui.stat2">Low</div>
                <div class="text-xl font-bold font-mono" id="low">0</div>
              </div>
            </div>

            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.secret-scanner.ui.heading0">Findings</h2>
              <div id="findings" class="space-y-2 text-sm text-surface-700 dark:text-surface-200">
                <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.secret-scanner.ui.desc1">Click Scan to find secrets.</p>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <label class="label flex items-center gap-2">
                <span data-i18n="tools.secret-scanner.ui.label3">Redacted output (share-safe)</span>
                ${infoHint('Use this when pasting logs into tickets or chats. Always rotate credentials if a real secret leaked.', 'Help', { i18nKey: 'tools.secret-scanner.ui.desc2' })}
              </label>
              <textarea id="redacted" rows="18" class="input-mono resize-y bg-surface-50 dark:bg-surface-950" readonly placeholder="Redacted text will appear here after scanning..." data-i18n-placeholder="tools.secret-scanner.ui.placeholder1"></textarea>
            </div>
          </div>
        </div>

        ${createCheatsheet('secret-scanner', '<span data-i18n="tools.secret-scanner.ui.heading1">What to do if you find a secret</span>', [
          {
            heading: '<span data-i18n="tools.secret-scanner.ui.heading2">Immediate steps</span>',
            content: `
              <ol class="list-decimal ml-6 space-y-1">
                <li><strong><span data-i18n="tools.secret-scanner.ui.text0">Revoke/rotate</span></strong> <span data-i18n="tools.secret-scanner.ui.desc3">the credential immediately (don’t just delete the commit).</span></li>
                <li data-i18n="tools.secret-scanner.ui.desc4">Search for usage in logs and audit trails.</li>
                <li data-i18n="tools.secret-scanner.ui.desc5">Invalidate sessions if applicable.</li>
                <li data-i18n="tools.secret-scanner.ui.desc6">Patch the process: use secret managers, pre-commit scanning, CI checks.</li>
              </ol>
            `
          },
          {
            heading: '<span data-i18n="tools.secret-scanner.ui.heading3">Notes</span>',
            content: `
              <p data-i18n="tools.secret-scanner.ui.desc7">Regex scanners can miss secrets (false negatives) and flag benign strings (false positives). Use multiple signals.</p>
            `
          }
        ])}
      </div>
    </main>
  `;

  const scripts = String.raw`
    <script>
      const t = (k, fb) => (window._t ? window._t('tools.secret-scanner.js.' + k, fb) : (fb || k));
      const fmt = (s, vars) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] !== undefined) ? String(vars[k]) : '');

      const $ = (id) => document.getElementById(id);
      const els = {
        input: $('input'),
        redacted: $('redacted'),
        findings: $('findings'),
        scan: $('scan'),
        sample: $('sample'),
        clear: $('clear'),
        copyRedacted: $('copy-redacted'),
        show: $('show'),
        includeLow: $('include-low'),
        high: $('high'),
        med: $('med'),
        low: $('low'),
      };

	      const SAMPLE = [
	        'AWS_ACCESS_KEY_ID=AKIA0123456789ABCDE1',
	        'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
	        'GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyzABCDE1234567',
	        'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.signature',
	        'stripe_key = "sk_live_51Hh2Abcdefghijklmnopqrstuvwxyz012345"',
	        '-----BEGIN PRIVATE KEY-----',
	        'MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...',
	        '-----END PRIVATE KEY-----',
	      ].join('\n');

      const PATTERNS = [
        {
          id: 'private_key',
          labelKey: 'text0',
          label: 'Private key block',
          severity: 'high',
          re: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/g,
          adviceKey: 'text1',
          advice: 'Revoke/rotate the key. Treat as compromised.'
        },
	        {
	          id: 'aws_access_key_id',
	          labelKey: 'text2',
	          label: 'AWS Access Key ID',
	          severity: 'high',
	          re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g,
	          adviceKey: 'text3',
	          advice: 'Rotate AWS keys and investigate CloudTrail usage.'
	        },
	        {
	          id: 'github_pat',
	          labelKey: 'text4',
	          label: 'GitHub token',
	          severity: 'high',
	          re: /\b(ghp_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
	          adviceKey: 'text5',
	          advice: 'Revoke the token in GitHub and audit access.'
	        },
	        {
	          id: 'google_api_key',
	          labelKey: 'text6',
	          label: 'Google API key',
	          severity: 'high',
	          re: /\bAIza[0-9A-Za-z_-]{35}\b/g,
	          adviceKey: 'text7',
	          advice: 'Restrict/rotate the key in Google Cloud Console.'
	        },
	        {
	          id: 'stripe_secret',
	          labelKey: 'text8',
	          label: 'Stripe secret key',
	          severity: 'high',
	          re: /\bsk_live_[0-9a-zA-Z]{20,}\b/g,
	          adviceKey: 'text9',
	          advice: 'Roll the key in Stripe and check recent charges/activity.'
	        },
	        {
	          id: 'slack_token',
	          labelKey: 'text10',
	          label: 'Slack token',
	          severity: 'high',
	          re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g,
	          adviceKey: 'text11',
	          advice: 'Revoke the Slack token and review app scopes.'
	        },
	        {
	          id: 'jwt',
	          labelKey: 'text12',
	          label: 'JWT-like token',
	          severity: 'medium',
	          re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
	          adviceKey: 'text13',
	          advice: 'If this is a real session token, invalidate sessions and rotate signing keys if needed.'
	        },
	        {
	          id: 'bearer',
	          labelKey: 'text14',
	          label: 'Bearer token in header',
	          severity: 'medium',
	          re: /\bBearer\s+[A-Za-z0-9._+/=-]{16,}/g,
	          adviceKey: 'text15',
	          advice: 'Treat as credential. Rotate/invalidate token and audit usage.'
	        },
	        {
	          id: 'password_assign',
	          labelKey: 'text16',
	          label: 'Password assignment',
	          severity: 'medium',
	          re: /\b(pass(word)?|pwd)\s*[:=]\s*['"][^'"]{6,}['"]/gi,
	          adviceKey: 'text17',
	          advice: 'Remove hardcoded passwords. Store in a secret manager or env var.'
	        },
	        {
	          id: 'api_key_assign',
	          labelKey: 'text18',
	          label: 'API key assignment',
	          severity: 'low',
	          re: /\b(api[_-]?key|token|secret)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
	          adviceKey: 'text19',
	          advice: 'Review if this is a real secret. Consider moving to a secret store.'
	        }
	      ];

      function labelFor(p) {
        return t(p.labelKey || '', p.label || p.id);
      }

      function adviceFor(p) {
        return t(p.adviceKey || '', p.advice || '');
      }

      function maskToken(t) {
        const s = String(t || '');
        if (s.length <= 8) return t('text20', '[REDACTED]');
        return s.slice(0, 4) + '…' + s.slice(-4) + ' (' + s.length + ')';
      }

      function countSeverity(findings) {
        let high = 0, med = 0, low = 0;
        findings.forEach(f => {
          if (f.severity === 'high') high++;
          else if (f.severity === 'medium') med++;
          else low++;
        });
        return { high, med, low };
      }

      function escapeHtml(s) {
        return String(s ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

	      function scanText(text, includeLow) {
	        const src = String(text || '');
	        const maxLen = 250_000;
	        const truncated = src.length > maxLen ? src.slice(0, maxLen) : src;
	        const lines = truncated.split('\n');

        const findings = [];
        const patterns = includeLow ? PATTERNS : PATTERNS.filter(p => p.severity !== 'low');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          for (const p of patterns) {
            p.re.lastIndex = 0;
            let m;
            while ((m = p.re.exec(line)) !== null) {
              findings.push({
                id: p.id,
                label: labelFor(p),
                severity: p.severity,
                advice: adviceFor(p),
                line: i + 1,
                match: m[0],
                col: (m.index || 0) + 1,
              });
              if (findings.length >= 200) return { findings, truncated: src.length > maxLen };
            }
          }
        }
        return { findings, truncated: src.length > maxLen };
      }

      function redact(text, includeLow) {
        let out = String(text || '');
        const patterns = includeLow ? PATTERNS : PATTERNS.filter(p => p.severity !== 'low');
        patterns.forEach(p => {
          // Rebuild regex without global state issues per replace
          const re = new RegExp(p.re.source, p.re.flags.includes('g') ? p.re.flags : (p.re.flags + 'g'));
          out = out.replace(re, (m) => '[REDACTED:' + p.id + ']');
        });
        return out;
      }

      function renderFindings(findings, showFull, truncated) {
        els.findings.innerHTML = '';
        if (!findings.length) {
          const p = document.createElement('p');
          p.className = 'text-surface-500 dark:text-surface-400';
          p.textContent = truncated ? t('text21', 'No matches found in the first 250k characters.') : t('text22', 'No matches found.');
          els.findings.appendChild(p);
          return;
        }

        if (truncated) {
          const note = document.createElement('div');
          note.className = 'rounded-lg border p-3 text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
          note.textContent = t('text23', 'Input was large; scanned only the first 250,000 characters.');
          els.findings.appendChild(note);
        }

        const severityCls = (sev) => sev === 'high'
          ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
          : sev === 'medium'
            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800'
            : 'bg-surface-50 dark:bg-surface-950 text-surface-800 dark:text-surface-200 border-surface-200 dark:border-surface-800';

        findings.slice(0, 120).forEach(f => {
          const row = document.createElement('div');
          row.className = 'rounded-lg border p-3 ' + severityCls(f.severity);
          const head = document.createElement('div');
          head.className = 'flex items-center justify-between gap-3';

          const left = document.createElement('div');
          left.className = 'font-semibold';
          left.textContent = f.label;

          const where = document.createElement('div');
          where.className = 'text-xs font-mono opacity-80';
          const sevLabel = f.severity === 'high' ? t('text24', 'High') : f.severity === 'medium' ? t('text25', 'Medium') : t('text26', 'Low');
          where.textContent = 'L' + f.line + ':' + f.col + ' · ' + sevLabel;

          head.appendChild(left);
          head.appendChild(where);

          const body = document.createElement('div');
          body.className = 'mt-2 text-xs font-mono break-words';
          body.textContent = showFull ? f.match : maskToken(f.match);

          const advice = document.createElement('div');
          advice.className = 'mt-2 text-xs opacity-90';
          advice.textContent = f.advice;

          row.appendChild(head);
          row.appendChild(body);
          row.appendChild(advice);
          els.findings.appendChild(row);
        });

        if (findings.length > 120) {
          const more = document.createElement('p');
          more.className = 'text-xs text-surface-500 dark:text-surface-400';
          more.textContent = fmt(t('text27', 'Showing first {n} findings.'), { n: 120 });
          els.findings.appendChild(more);
        }
      }

      function run() {
        const text = els.input.value;
        const includeLow = els.includeLow.checked;
        const { findings, truncated } = scanText(text, includeLow);
        const c = countSeverity(findings);
        els.high.textContent = String(c.high);
        els.med.textContent = String(c.med);
        els.low.textContent = String(c.low);
        renderFindings(findings, els.show.checked, truncated);

        els.redacted.value = redact(text, includeLow);
        els.copyRedacted.disabled = !els.redacted.value.trim();
      }

      els.scan.addEventListener('click', run);
      els.sample.addEventListener('click', () => {
        els.input.value = SAMPLE;
      });
      els.clear.addEventListener('click', () => {
        els.input.value = '';
        els.redacted.value = '';
        els.findings.innerHTML = '<p class="text-surface-500 dark:text-surface-400">' + t('text28', 'Click Scan to find secrets.') + '</p>';
        els.high.textContent = '0';
        els.med.textContent = '0';
        els.low.textContent = '0';
        els.copyRedacted.disabled = true;
      });
      els.copyRedacted.addEventListener('click', async () => {
        const text = els.redacted.value;
        if (!text.trim()) return;
        try {
          await navigator.clipboard.writeText(text);
          const old = els.copyRedacted.textContent;
          els.copyRedacted.textContent = t('text29', '✓ Copied');
          setTimeout(() => (els.copyRedacted.textContent = old), 1200);
        } catch (e) {
          console.error('Copy failed:', e);
        }
      });
      els.show.addEventListener('change', () => {
        // Re-render from last scan by scanning quickly again (fast enough)
        run();
      });
      els.includeLow.addEventListener('change', () => run());
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: '/secret-scanner',
    content,
    scripts
  });
}
