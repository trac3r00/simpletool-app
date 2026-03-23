/**
 * Email Security Analyzer
 * - Parses raw RFC 5322 emails (headers + body)
 * - Extracts Authentication-Results (SPF/DKIM/DMARC), routing hints, and URLs
 * - Runs entirely in the browser (no network calls)
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleEmailAnalyzerRoutes(request, url) {
  const { pathname } = url;
  if (pathname === '/email-analyzer' || pathname === '/email-analyzer/') {
    if (request.method === 'GET') return respondHTML(renderEmailAnalyzerPage(resolveRequestLanguage(request, url)));
    return new Response('Method not allowed', { status: 405 });
  }
  return null;
}

function renderEmailAnalyzerPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('email-analyzer', currentLang);
  const title = translation?.name || 'Email Security Analyzer';
  const description = translation?.desc || 'Understand SPF, DKIM, DMARC, routing hops, and embedded URLs from a raw email — all locally.';

  const header = createToolHeader(
    { emoji: '📧' },
    title,
    description,
    [
      { text: translation?.ui?.badge0 || '<span data-i18n="tools.email-analyzer.ui.badge0">Client-Side Only</span>', tooltip: 'Parsing and analysis happen entirely in your browser. Nothing is uploaded.' },
      { text: translation?.ui?.badge1 || '<span data-i18n="tools.email-analyzer.ui.badge1">SOC-Friendly</span>', tooltip: 'Highlights authentication results, identity mismatches, and suspicious URLs.' }
    ],
    { toolId: 'email-analyzer' }
  );

  const currentTool = TOOLS.find(t => t.id === 'email-analyzer');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];


  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${header}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-3">
            <div class="flex flex-wrap gap-2 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
              <button id="analyze-btn" class="btn btn-primary">
                <span>🔎 <span data-i18n="tools.email-analyzer.ui.button0">Analyze</span></span>
              </button>
              <button id="load-sample-btn" class="btn btn-secondary">
                <span>🧪 <span data-i18n="tools.email-analyzer.ui.button1">Load Sample</span></span>
              </button>
              <button id="clear-btn" class="btn btn-ghost ml-auto">
                <span>🗑️ <span data-i18n="tools.email-analyzer.ui.button2">Clear</span></span>
              </button>
            </div>

            <label class="label flex items-center gap-2">
              <span data-i18n="tools.email-analyzer.ui.label0">Raw Email (Headers + Body)</span>
              ${infoHint('Paste a raw email source (RFC 5322). Many clients have “View original / Show raw source”.', 'Help', { i18nKey: 'tools.email-analyzer.ui.desc0' })}
            </label>
            <textarea id="email-input" rows="18" class="input-mono resize-y" placeholder="Paste the full email source here..." data-i18n-placeholder="tools.email-analyzer.ui.placeholder0"></textarea>

            <div class="flex flex-wrap items-center gap-4 text-sm text-surface-600 dark:text-surface-400">
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input id="include-body-urls" type="checkbox" class="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" checked>
                <span data-i18n="tools.email-analyzer.ui.label1">Extract URLs from body</span>
              </label>
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input id="mask-pii" type="checkbox" class="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500">
                <span data-i18n="tools.email-analyzer.ui.label2">Mask emails/IPs in report</span>
              </label>
            </div>

            <div id="status" class="hidden rounded-lg p-3 text-sm font-medium border"></div>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2">SPF</div>
                <div id="spf-result" class="text-lg font-bold">—</div>
                <div id="spf-detail" class="text-xs text-surface-500 dark:text-surface-400 mt-1 break-words"></div>
              </div>
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2">DKIM</div>
                <div id="dkim-result" class="text-lg font-bold">—</div>
                <div id="dkim-detail" class="text-xs text-surface-500 dark:text-surface-400 mt-1 break-words"></div>
              </div>
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2">DMARC</div>
                <div id="dmarc-result" class="text-lg font-bold">—</div>
                <div id="dmarc-detail" class="text-xs text-surface-500 dark:text-surface-400 mt-1 break-words"></div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4">
              <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                <div class="flex items-center justify-between gap-3 mb-3">
                  <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.email-analyzer.ui.heading0">Identity</h2>
                  <button id="copy-summary-btn" class="btn btn-secondary text-xs py-1 px-2" disabled>
                    <span data-i18n="tools.email-analyzer.ui.button3">Copy Summary</span>
                  </button>
                </div>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <dt class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.email-analyzer.ui.label3">From</dt>
                    <dd class="font-mono text-surface-900 dark:text-surface-50 break-words" id="id-from">—</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.email-analyzer.ui.label4">To</dt>
                    <dd class="font-mono text-surface-900 dark:text-surface-50 break-words" id="id-to">—</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.email-analyzer.ui.label5">Subject</dt>
                    <dd class="text-surface-900 dark:text-surface-50 break-words" id="id-subject">—</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.email-analyzer.ui.label6">Date</dt>
                    <dd class="text-surface-900 dark:text-surface-50 break-words" id="id-date">—</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.email-analyzer.ui.label7">Return-Path</dt>
                    <dd class="font-mono text-surface-900 dark:text-surface-50 break-words" id="id-return-path">—</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.email-analyzer.ui.label8">Reply-To</dt>
                    <dd class="font-mono text-surface-900 dark:text-surface-50 break-words" id="id-reply-to">—</dd>
                  </div>
                </dl>
              </div>

              <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                <div class="flex items-center justify-between gap-3 mb-3">
                  <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.email-analyzer.ui.heading1">Findings</h2>
                  <span id="finding-count" class="text-xs text-surface-500 dark:text-surface-400">0</span>
                </div>
                <div id="findings" class="space-y-2 text-sm text-surface-700 dark:text-surface-200">
                  <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.email-analyzer.ui.text0">Run analysis to see signals and mismatches.</p>
                </div>
              </div>

              <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                <div class="flex items-center justify-between gap-3 mb-3">
                  <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.email-analyzer.ui.heading2">URLs</h2>
                  <span id="url-count" class="text-xs text-surface-500 dark:text-surface-400">0</span>
                </div>
                <div id="urls" class="text-sm text-surface-700 dark:text-surface-200">
                  <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.email-analyzer.ui.text1">No URLs extracted yet.</p>
                </div>
              </div>

              <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                <div class="flex items-center justify-between gap-3 mb-3">
                  <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.email-analyzer.ui.heading3">Routing Hops</h2>
                  <span id="hop-count" class="text-xs text-surface-500 dark:text-surface-400">0</span>
                </div>
                <div id="hops" class="text-sm text-surface-700 dark:text-surface-200">
                  <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.email-analyzer.ui.text2">No routing data yet.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        ${createCheatsheet('email-analyzer', '<span data-i18n="tools.email-analyzer.ui.heading4">Email Auth Quick Reference</span>', [
          {
            heading: '<span data-i18n="tools.email-analyzer.ui.heading5">What these checks mean</span>',
            content: `
              <ul class="list-disc ml-6 space-y-1">
                <li><strong>SPF</strong>: <span data-i18n="tools.email-analyzer.ui.desc1">Did the sending IP align with the envelope sender domain</span> (<code>MAIL FROM</code>)<span data-i18n="tools.email-analyzer.ui.desc2">?</span></li>
                <li><strong>DKIM</strong>: <span data-i18n="tools.email-analyzer.ui.desc3">Is the message content signed, and does the signature validate for the signing domain?</span></li>
                <li><strong>DMARC</strong>: <span data-i18n="tools.email-analyzer.ui.desc4">Does</span> <strong>From:</strong><span data-i18n="tools.email-analyzer.ui.desc5"> align with SPF and/or DKIM, and what’s the policy outcome?</span></li>
              </ul>
              <p class="mt-2 text-xs text-surface-500 dark:text-surface-400"><span data-i18n="tools.email-analyzer.ui.desc6">This tool reads the results already present in the email headers (e.g.,</span> <code>Authentication-Results</code>). <span data-i18n="tools.email-analyzer.ui.desc7">It does not perform live DNS lookups or cryptographic verification.</span></p>
            `
          },
          {
            heading: '<span data-i18n="tools.email-analyzer.ui.heading6">Common header fields</span>',
            content: `
              <table>
                <tr><th><span data-i18n="tools.email-analyzer.ui.th0">Header</span></th><th><span data-i18n="tools.email-analyzer.ui.th1">Why it matters</span></th></tr>
                <tr><td><code>From</code></td><td><span data-i18n="tools.email-analyzer.ui.desc8">Displayed sender identity (user-facing)</span></td></tr>
                <tr><td><code>Return-Path</code></td><td><span data-i18n="tools.email-analyzer.ui.desc9">Envelope sender (SPF typically evaluates this)</span></td></tr>
                <tr><td><code>Reply-To</code></td><td><span data-i18n="tools.email-analyzer.ui.desc10">Where replies go (often abused in BEC)</span></td></tr>
                <tr><td><code>Received</code></td><td><span data-i18n="tools.email-analyzer.ui.desc11">Mail hops + IP clues (spoofing / relays)</span></td></tr>
                <tr><td><code>Authentication-Results</code></td><td><span data-i18n="tools.email-analyzer.ui.desc12">SPF/DKIM/DMARC outcomes from the receiver</span></td></tr>
              </table>
            `
          }
        ])}
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'Email Authentication Explained',
          content: '<p>Email authentication is a collection of techniques used to provide verifiable information about the origin of an email message. By validating the sender\'s identity, these protocols help mail servers distinguish between legitimate messages and spoofed or fraudulent ones (like phishing). The three pillars of modern email authentication are SPF, DKIM, and DMARC.</p><p>When an email is received, the receiving server performs these checks and records the results in the email\'s headers, which this tool parses for you.</p>'
        },
        {
          title: 'SPF/DKIM/DMARC',
          content: '<ul><li><strong>SPF (Sender Policy Framework):</strong> A DNS-based mechanism that lists the IP addresses and domains authorized to send email on behalf of your domain.</li><li><strong>DKIM (DomainKeys Identified Mail):</strong> Adds a digital signature to the email, allowing the receiver to verify that the message was indeed sent by the domain owner and hasn\'t been tampered with in transit.</li><li><strong>DMARC (Domain-based Message Authentication, Reporting, and Conformance):</strong> Ties SPF and DKIM together. It tells the receiver what to do if the authentication fails (e.g., "none," "quarantine," or "reject") and provides a way for receivers to report back to the sender.</li></ul>'
        },
        {
          title: 'Phishing Detection',
          content: '<p>Phishing emails often use "spoofing" to appear as if they come from a trusted source. Our analyzer looks for common red flags, such as a mismatch between the "From" address (what the user sees) and the "Return-Path" (where the mail actually came from). We also extract and analyze URLs in the email body to identify suspicious links, such as those using Punycode (lookalike domains) or IP addresses instead of hostnames.</p><p>By reviewing the "Findings" section, you can quickly identify these signals and determine if an email is safe to interact with.</p>'
        },
        {
          title: 'Pro Tips',
          content: '<ul><li>Always check the <strong>"Authentication-Results"</strong> header first; it provides the definitive outcome of the security checks performed by your mail provider.</li><li>Use the <strong>"Mask PII"</strong> option when sharing reports with others to protect sensitive email addresses and IP information.</li><li>Pay close attention to the <strong>"Reply-To"</strong> header; if it differs from the "From" address, it may be a sign of a Business Email Compromise (BEC) attack.</li><li>Review the <strong>"Routing Hops"</strong> to see the path the email took; an unusually long or complex path through unknown servers can be a sign of relay abuse.</li></ul>'
        }
      ], 'email-analyzer')}
    ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const scripts = String.raw`
    <script>
      const t = (k, fb) => (window._t ? window._t('tools.email-analyzer.js.' + k, fb) : (fb || k));
      const fmt = (s, vars) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] !== undefined) ? String(vars[k]) : '');

      const els = {
        input: document.getElementById('email-input'),
        analyzeBtn: document.getElementById('analyze-btn'),
        loadSampleBtn: document.getElementById('load-sample-btn'),
        clearBtn: document.getElementById('clear-btn'),
        includeBodyUrls: document.getElementById('include-body-urls'),
        maskPii: document.getElementById('mask-pii'),
        status: document.getElementById('status'),
        spfResult: document.getElementById('spf-result'),
        spfDetail: document.getElementById('spf-detail'),
        dkimResult: document.getElementById('dkim-result'),
        dkimDetail: document.getElementById('dkim-detail'),
        dmarcResult: document.getElementById('dmarc-result'),
        dmarcDetail: document.getElementById('dmarc-detail'),
        idFrom: document.getElementById('id-from'),
        idTo: document.getElementById('id-to'),
        idSubject: document.getElementById('id-subject'),
        idDate: document.getElementById('id-date'),
        idReturnPath: document.getElementById('id-return-path'),
        idReplyTo: document.getElementById('id-reply-to'),
        findings: document.getElementById('findings'),
        findingCount: document.getElementById('finding-count'),
        urls: document.getElementById('urls'),
        urlCount: document.getElementById('url-count'),
        hops: document.getElementById('hops'),
        hopCount: document.getElementById('hop-count'),
        copySummaryBtn: document.getElementById('copy-summary-btn'),
      };

      let lastSummary = null;
      let lastMask = false;

      const SAMPLE_EMAIL = [
        'Return-Path: <bounce@mailer.example.net>',
        'Received: from outbound.mailer.example.net (outbound.mailer.example.net [203.0.113.22]) by mx.google.com with ESMTPS id abc123 for <soc@example.com>; Tue, 21 Jan 2025 10:20:30 -0800 (PST)',
        'Authentication-Results: mx.google.com;',
        '  spf=pass (google.com: domain of mailer.example.net designates 203.0.113.22 as permitted sender) smtp.mailfrom=bounce@mailer.example.net;',
        '  dkim=pass header.i=@example.net header.s=s1 header.b=abc123;',
        '  dmarc=pass (p=reject sp=reject dis=none) header.from=example.net',
        'From: "Example Billing" <billing@example.net>',
        'To: soc@example.com',
        'Subject: Payment required: Invoice INV-1042',
        'Date: Tue, 21 Jan 2025 10:20:28 -0800',
        'Message-ID: <20250121182028.12345@mail.example.net>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        '',
        'Hello,',
        '',
        'Your invoice is ready. Review it here:',
        'https://billing.example.net/invoices/INV-1042',
        '',
        'If you did not request this, contact support.',
        '',
        '— Example Billing',
        'Unsubscribe: http://xn--exmple-qta.net/unsub?u=soc@example.com'
      ].join('\n');

       function setStatus(kind, message) {
         if (!message) {
           els.status.classList.add('hidden');
           els.status.textContent = '';
           return;
         }
         els.status.classList.remove('hidden');
         if (kind === 'error') {
           els.status.className = 'rounded-lg p-3 text-sm font-medium border bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-200 border-danger-200 dark:border-danger-800';
         } else if (kind === 'warn') {
           els.status.className = 'rounded-lg p-3 text-sm font-medium border bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-200 border-warning-200 dark:border-warning-800';
         } else {
           els.status.className = 'rounded-lg p-3 text-sm font-medium border bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-200 border-success-200 dark:border-success-800';
         }
         els.status.textContent = message;
       }

      function normalizeNewlines(text) {
        return String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      }

      function parseEmail(raw) {
        const text = normalizeNewlines(raw);
        const lines = text.split('\n');
        const headerLines = [];
        let current = '';
        let i = 0;
        for (; i < lines.length; i++) {
          const line = lines[i];
          if (line === '') {
            if (current) headerLines.push(current);
            i++;
            break;
          }
          if (/^[ \t]/.test(line)) {
            current += ' ' + line.trim();
          } else {
            if (current) headerLines.push(current);
            current = line;
          }
        }
        if (current && i >= lines.length) headerLines.push(current);

        const headers = new Map(); // lowerName -> string[]
        for (const hl of headerLines) {
          const idx = hl.indexOf(':');
          if (idx <= 0) continue;
          const name = hl.slice(0, idx).trim().toLowerCase();
          const value = hl.slice(idx + 1).trim();
          const arr = headers.get(name) || [];
          arr.push(value);
          headers.set(name, arr);
        }

        const body = lines.slice(i).join('\n');
        return { headers, body, rawHeaders: headerLines.join('\n') };
      }

      function firstHeader(headers, name) {
        const v = headers.get(String(name).toLowerCase());
        return Array.isArray(v) && v.length ? v[0] : '';
      }

      function allHeaders(headers, name) {
        const v = headers.get(String(name).toLowerCase());
        return Array.isArray(v) ? v : [];
      }

      function extractEmailDomains(value) {
        const re = /\b[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g;
        const out = [];
        let m;
        while ((m = re.exec(String(value || ''))) !== null) {
          out.push(m[1].toLowerCase());
        }
        return Array.from(new Set(out));
      }

      function maskEmailAddress(addr) {
        const s = String(addr || '');
        return s.replace(/\b([A-Za-z0-9._%+-]{1,})@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g, (m, local, dom) => {
          if (local.length <= 2) return '*@' + dom;
          return local.slice(0, 1) + '***' + local.slice(-1) + '@' + dom;
        });
      }

      function isPrivateIPv4(ip) {
        const parts = String(ip).split('.').map(n => parseInt(n, 10));
        if (parts.length !== 4 || parts.some(n => !Number.isFinite(n) || n < 0 || n > 255)) return true;
        const [a, b] = parts;
        if (a === 10) return true;
        if (a === 127) return true;
        if (a === 0) return true;
        if (a === 169 && b === 254) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 192 && b === 168) return true;
        return false;
      }

      function extractIPv4(text) {
        const re = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
        const out = [];
        let m;
        while ((m = re.exec(String(text || ''))) !== null) {
          const ip = m[0];
          const parts = ip.split('.').map(n => parseInt(n, 10));
          if (parts.length === 4 && parts.every(n => Number.isFinite(n) && n >= 0 && n <= 255)) out.push(ip);
        }
        return out;
      }

      function maskIPv4(text) {
        return String(text || '').replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, (ip) => {
          const parts = ip.split('.').map(n => parseInt(n, 10));
          if (parts.length !== 4 || parts.some(n => !Number.isFinite(n) || n < 0 || n > 255)) return ip;
          return parts[0] + '.' + parts[1] + '.x.x';
        });
      }

      function safeTrim(s, max = 140) {
        const str = String(s || '');
        return str.length > max ? str.slice(0, max - 1) + '…' : str;
      }

      function splitSemicolonsRespectParens(value) {
        const s = String(value || '');
        const parts = [];
        let buf = '';
        let depth = 0;
        for (let i = 0; i < s.length; i++) {
          const ch = s[i];
          if (ch === '(') depth++;
          if (ch === ')' && depth > 0) depth--;
          if (ch === ';' && depth === 0) {
            parts.push(buf);
            buf = '';
            continue;
          }
          buf += ch;
        }
        if (buf.trim()) parts.push(buf);
        return parts.map(p => p.trim()).filter(Boolean);
      }

      function parseAuthFromAuthResults(headerValue) {
        const parts = splitSemicolonsRespectParens(headerValue);
        const out = { spf: null, dkim: null, dmarc: null, raw: headerValue };

        function escapeRe(s) {
          return String(s || '').replace(/[.*+?^{}$()|[\]\\]/g, '\\$&');
        }

        function parseResult(prefix) {
          const item = parts.find(p => p.toLowerCase().startsWith(prefix + '='));
          if (!item) return null;
          const rest = item.slice(prefix.length + 1).trim();
          const result = (rest.match(/^[a-zA-Z]+/) || [''])[0].toLowerCase();
          return result || null;
        }

        function parseParam(key) {
          const re = new RegExp('\\b' + escapeRe(key) + '=([^;\\s]+)', 'i');
          const m = re.exec(headerValue);
          return m ? m[1] : '';
        }

        out.spf = parseResult('spf');
        out.dkim = parseResult('dkim');
        out.dmarc = parseResult('dmarc');

        const mailFrom = parseParam('smtp.mailfrom') || parseParam('mailfrom');
        const dkimI = parseParam('header.i') || '';
        const dkimS = parseParam('header.s') || '';
        const dmarcFrom = parseParam('header.from') || '';

        return {
          spf: out.spf ? { result: out.spf, mailfrom: mailFrom } : null,
          dkim: out.dkim ? { result: out.dkim, identity: dkimI, selector: dkimS } : null,
          dmarc: out.dmarc ? { result: out.dmarc, headerFrom: dmarcFrom } : null
        };
      }

      function parseAuthenticationResults(headers) {
        const ar = allHeaders(headers, 'authentication-results');
        const arc = allHeaders(headers, 'arc-authentication-results');
        const combined = [...ar, ...arc];

        // Prefer the first Authentication-Results header (closest to receiver).
        const picked = combined.length ? combined[0] : '';
        const parsed = picked ? parseAuthFromAuthResults(picked) : { spf: null, dkim: null, dmarc: null };

        // Fallback: Received-SPF (common on some systems)
        const receivedSpf = firstHeader(headers, 'received-spf');
        if (!parsed.spf && receivedSpf) {
          const m = receivedSpf.trim().match(/^(pass|fail|softfail|neutral|none|temperror|permerror)\b/i);
          if (m) parsed.spf = { result: m[1].toLowerCase(), mailfrom: '' };
        }

        return { ...parsed, raw: picked || receivedSpf || '' };
      }

      function normalizeUrlCandidate(s) {
        const raw = String(s || '').trim();
        if (!raw) return '';
        if (/^https?:\/\//i.test(raw)) return raw;
        if (/^www\./i.test(raw)) return 'http://' + raw;
        return '';
      }

      function extractUrls(text) {
        const out = [];
        const re = /(https?:\/\/[^\s<>"'()]+|www\.[^\s<>"'()]+)/gi;
        let m;
        while ((m = re.exec(String(text || ''))) !== null) {
          const url = normalizeUrlCandidate(m[0]);
          if (url) out.push(url);
        }
        return Array.from(new Set(out));
      }

      function scoreUrl(u) {
        const flags = [];
        let hostname = '';
        try {
          const url = new URL(u);
          hostname = url.hostname || '';
          if (hostname.startsWith('xn--')) flags.push('punycode');
          if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) flags.push('ip_host');
          if (url.username || url.password) flags.push('userinfo');
          if (url.protocol !== 'https:') flags.push('non_https');
        } catch (e) {
          flags.push('invalid');
        }
        return { flags, hostname };
      }

       function severityBadge(sev) {
         if (sev === 'high') return { label: t('text0', 'High'), cls: 'bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-200 border-danger-200 dark:border-danger-800' };
         if (sev === 'medium') return { label: t('text1', 'Medium'), cls: 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-200 border-warning-200 dark:border-warning-800' };
         return { label: t('text2', 'Low'), cls: 'bg-surface-50 dark:bg-surface-950 text-surface-700 dark:text-surface-200 border-surface-200 dark:border-surface-800' };
       }

       function authBadge(result) {
         const r = String(result || '').toLowerCase();
         if (r === 'pass') return { text: t('text3', 'pass'), cls: 'text-success-700 dark:text-success-200' };
         if (r === 'fail') return { text: t('text4', 'fail'), cls: 'text-danger-700 dark:text-danger-200' };
         if (r === 'softfail' || r === 'neutral') return { text: r, cls: 'text-warning-700 dark:text-warning-200' };
         if (r) return { text: r, cls: 'text-surface-700 dark:text-surface-200' };
         return { text: t('text5', 'unknown'), cls: 'text-surface-500 dark:text-surface-400' };
       }

      function buildFindings(summary) {
        const findings = [];

        const from = summary.from || '';
        const replyTo = summary.replyTo || '';
        const returnPath = summary.returnPath || '';

        const fromDomains = extractEmailDomains(from);
        const replyDomains = extractEmailDomains(replyTo);
        const returnDomains = extractEmailDomains(returnPath);

        if (replyTo && fromDomains.length && replyDomains.length && fromDomains[0] !== replyDomains[0]) {
          findings.push({
            severity: 'medium',
            title: t('text6', 'Reply-To mismatch'),
            detail: t('text7', 'Reply-To domain differs from From domain. Common in phishing/BEC.')
          });
        }

        if (returnPath && fromDomains.length && returnDomains.length && fromDomains[0] !== returnDomains[0]) {
          findings.push({
            severity: 'low',
            title: t('text8', 'Return-Path mismatch'),
            detail: t('text9', 'Envelope sender differs from From. This can be normal (mailing lists) but worth checking.')
          });
        }

        const spf = (summary.auth?.spf?.result || '').toLowerCase();
        const dkim = (summary.auth?.dkim?.result || '').toLowerCase();
        const dmarc = (summary.auth?.dmarc?.result || '').toLowerCase();

        if (dmarc === 'fail') {
          findings.push({ severity: 'high', title: t('text10', 'DMARC failed'), detail: t('text11', 'DMARC indicates From alignment failed (phishing risk). Review authentication results and domains.') });
        }
        if (spf === 'fail') findings.push({ severity: 'medium', title: t('text12', 'SPF failed'), detail: t('text13', 'Sending IP not authorized for envelope sender domain.') });
        if (dkim === 'fail') findings.push({ severity: 'medium', title: t('text14', 'DKIM failed'), detail: t('text15', 'Signature validation failed or was missing.') });

        const publicIps = summary.routing?.ips?.filter(ip => !isPrivateIPv4(ip)) || [];
        if (publicIps.length === 0 && summary.routing?.ips?.length) {
          findings.push({ severity: 'low', title: t('text16', 'No public sender IP found'), detail: t('text17', 'Only private/local IPs detected in Received headers. This can occur with internal relays.') });
        }

        for (const url of summary.urls || []) {
          const { flags, hostname } = scoreUrl(url);
          if (flags.includes('punycode')) {
            findings.push({ severity: 'high', title: t('text18', 'Punycode domain in URL'), detail: t('text19', 'URL domain uses punycode (xn--). Verify it is not a lookalike domain.') });
          }
          if (flags.includes('ip_host')) findings.push({ severity: 'medium', title: t('text20', 'IP literal URL'), detail: t('text21', 'URL uses an IP address as host. Often suspicious for phishing/malware.') });
          if (flags.includes('non_https')) findings.push({ severity: 'low', title: t('text22', 'Non-HTTPS link'), detail: t('text23', 'URL is not HTTPS. Treat with extra caution.') });
          if (hostname && fromDomains.length && hostname.endsWith(fromDomains[0]) === false && hostname.includes(fromDomains[0]) === false) {
            // Soft heuristic only
          }
        }

        return findings;
      }

      function renderFindings(findings) {
        els.findings.innerHTML = '';
        els.findingCount.textContent = String(findings.length);
        if (!findings.length) {
          const p = document.createElement('p');
          p.className = 'text-surface-500 dark:text-surface-400';
          p.textContent = t('text24', 'No obvious red flags detected from headers. (Still review the full context.)');
          els.findings.appendChild(p);
          return;
        }
        findings.forEach(f => {
          const badge = severityBadge(f.severity);
          const row = document.createElement('div');
          row.className = 'rounded-lg border p-3 ' + badge.cls;

          const title = document.createElement('div');
          title.className = 'flex items-center justify-between gap-3';
          const left = document.createElement('div');
          left.className = 'font-semibold';
          left.textContent = f.title;
          const sev = document.createElement('span');
          sev.className = 'text-xs font-mono px-2 py-0.5 rounded border border-current/20';
          sev.textContent = badge.label;
          title.appendChild(left);
          title.appendChild(sev);

          const detail = document.createElement('div');
          detail.className = 'text-xs mt-1 opacity-90';
          detail.textContent = f.detail;

          row.appendChild(title);
          row.appendChild(detail);
          els.findings.appendChild(row);
        });
      }

      function renderUrls(urls, maskPii) {
        els.urls.innerHTML = '';
        els.urlCount.textContent = String(urls.length);
        if (!urls.length) {
          const p = document.createElement('p');
          p.className = 'text-surface-500 dark:text-surface-400';
          p.textContent = t('text25', 'No URLs found.');
          els.urls.appendChild(p);
          return;
        }

        const flagLabel = (code) => {
          const map = {
            punycode: t('text26', 'Punycode'),
            ip_host: t('text27', 'IP host'),
            userinfo: t('text28', 'Userinfo'),
            non_https: t('text29', 'Non-HTTPS'),
            invalid: t('text30', 'Invalid URL'),
          };
          return map[code] || code;
        };

        const list = document.createElement('ul');
        list.className = 'space-y-2';
        urls.slice(0, 30).forEach(u => {
          const item = document.createElement('li');
          item.className = 'flex items-start justify-between gap-3';

          const left = document.createElement('div');
          left.className = 'min-w-0';

          const a = document.createElement('a');
          a.className = 'font-mono text-sm text-primary-700 dark:text-primary-300 hover:underline break-words';
          a.textContent = safeTrim(maskPii ? maskEmailAddress(u) : u, 200);
          try {
            const parsed = new URL(u);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
              a.href = u;
            } else {
              a.removeAttribute('href');
              a.title = 'Blocked: non-HTTP protocol';
              a.className += ' line-through opacity-60 cursor-not-allowed';
            }
          } catch (_e) {
            a.removeAttribute('href');
          }
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          left.appendChild(a);

          const { flags, hostname } = scoreUrl(u);
          const meta = document.createElement('div');
          meta.className = 'text-xs text-surface-500 dark:text-surface-400 mt-0.5';
          meta.textContent = hostname + (flags.length ? ' · ' + flags.map(flagLabel).join(', ') : '');
          left.appendChild(meta);

          item.appendChild(left);
          list.appendChild(item);
        });
        if (urls.length > 30) {
          const more = document.createElement('p');
          more.className = 'text-xs text-surface-500 dark:text-surface-400 mt-2';
          more.textContent = fmt(t('text31', 'Showing first {n} URLs.'), { n: 30 });
          els.urls.appendChild(list);
          els.urls.appendChild(more);
          return;
        }
        els.urls.appendChild(list);
      }

      function renderHops(receivedHeaders, maskPii) {
        const hops = receivedHeaders || [];
        const ips = [];
        hops.forEach(h => ips.push(...extractIPv4(h)));
        const uniqueIps = Array.from(new Set(ips));
        els.hopCount.textContent = String(hops.length);

        els.hops.innerHTML = '';
        if (!hops.length) {
          const p = document.createElement('p');
          p.className = 'text-surface-500 dark:text-surface-400';
          p.textContent = t('text32', 'No Received headers found.');
          els.hops.appendChild(p);
          return { ips: uniqueIps };
        }

        const list = document.createElement('ol');
        list.className = 'space-y-2 list-decimal ml-5';
        hops.slice(0, 12).forEach((h) => {
          const li = document.createElement('li');
          li.className = 'font-mono text-xs text-surface-700 dark:text-surface-200 break-words';
          const text = maskPii ? maskIPv4(maskEmailAddress(h)) : h;
          li.textContent = safeTrim(text, 260);
          list.appendChild(li);
        });
        els.hops.appendChild(list);
        if (hops.length > 12) {
          const more = document.createElement('p');
          more.className = 'text-xs text-surface-500 dark:text-surface-400 mt-2';
          more.textContent = fmt(t('text33', 'Showing first {n} Received hops.'), { n: 12 });
          els.hops.appendChild(more);
        }

        return { ips: uniqueIps };
      }

      function setAuthUI(targetResultEl, targetDetailEl, authObj, label) {
        const badge = authBadge(authObj && authObj.result);
        targetResultEl.textContent = badge.text;
        targetResultEl.className = 'text-lg font-bold ' + badge.cls;

        const detailParts = [];
        if (label === 'spf' && authObj?.mailfrom) detailParts.push('mailfrom=' + authObj.mailfrom);
        if (label === 'dkim') {
          if (authObj?.identity) detailParts.push('i=' + authObj.identity);
          if (authObj?.selector) detailParts.push('s=' + authObj.selector);
        }
        if (label === 'dmarc' && authObj?.headerFrom) detailParts.push('from=' + authObj.headerFrom);
        targetDetailEl.textContent = detailParts.join(' · ');
      }

      function buildCopySummary(summary, maskPii) {
        const m = (s) => (maskPii ? maskIPv4(maskEmailAddress(s)) : s);
        const lines = [];
        lines.push(t('text34', 'Email Security Summary'));
        lines.push(t('text35', 'From: {v}').replace('{v}', m(summary.from || '')));
        lines.push(t('text36', 'To: {v}').replace('{v}', m(summary.to || '')));
        lines.push(t('text37', 'Subject: {v}').replace('{v}', m(summary.subject || '')));
        lines.push(t('text38', 'Date: {v}').replace('{v}', m(summary.date || '')));
        lines.push('');
        lines.push(t('text39', 'Auth:'));
        lines.push('  SPF: ' + (summary.auth?.spf?.result || t('text5', 'unknown')) + (summary.auth?.spf?.mailfrom ? ' (mailfrom=' + m(summary.auth.spf.mailfrom) + ')' : ''));
        lines.push('  DKIM: ' + (summary.auth?.dkim?.result || t('text5', 'unknown')) + (summary.auth?.dkim?.identity ? ' (i=' + m(summary.auth.dkim.identity) + ')' : ''));
        lines.push('  DMARC: ' + (summary.auth?.dmarc?.result || t('text5', 'unknown')) + (summary.auth?.dmarc?.headerFrom ? ' (from=' + m(summary.auth.dmarc.headerFrom) + ')' : ''));
        lines.push('');
        if (summary.urls?.length) {
          lines.push(fmt(t('text40', 'URLs ({n}):'), { n: summary.urls.length }));
          summary.urls.slice(0, 10).forEach(u => lines.push('  - ' + m(u)));
          if (summary.urls.length > 10) lines.push('  ' + t('text41', '...'));
        } else {
          lines.push(t('text42', 'URLs: none detected'));
        }
        lines.push('');
        if (summary.routing?.ips?.length) {
          const pub = summary.routing.ips.filter(ip => !isPrivateIPv4(ip));
          lines.push(t('text43', 'IPs: ') + (pub.length ? pub.join(', ') : summary.routing.ips.join(', ')));
        }
        return lines.join('\n');
      }

      function runAnalysis() {
        const raw = els.input.value;
        if (!raw.trim()) {
          setStatus('error', t('text44', 'Paste a raw email first.'));
          return;
        }

        setStatus(null, '');
        const { headers, body } = parseEmail(raw);

        const from = firstHeader(headers, 'from');
        const to = firstHeader(headers, 'to');
        const subject = firstHeader(headers, 'subject');
        const date = firstHeader(headers, 'date');
        const returnPath = firstHeader(headers, 'return-path');
        const replyTo = firstHeader(headers, 'reply-to');

        const auth = parseAuthenticationResults(headers);
        const received = allHeaders(headers, 'received');

        const urls = els.includeBodyUrls.checked ? extractUrls(body) : [];
        const routing = renderHops(received, els.maskPii.checked);

        const summary = { from, to, subject, date, returnPath, replyTo, auth, urls, routing };
        const findings = buildFindings(summary);

        const mask = els.maskPii.checked;
        const m = (s) => (mask ? maskIPv4(maskEmailAddress(s)) : s);

        els.idFrom.textContent = m(from) || '—';
        els.idTo.textContent = m(to) || '—';
        els.idSubject.textContent = m(subject) || '—';
        els.idDate.textContent = m(date) || '—';
        els.idReturnPath.textContent = m(returnPath) || '—';
        els.idReplyTo.textContent = m(replyTo) || '—';

        setAuthUI(els.spfResult, els.spfDetail, auth.spf, 'spf');
        setAuthUI(els.dkimResult, els.dkimDetail, auth.dkim, 'dkim');
        setAuthUI(els.dmarcResult, els.dmarcDetail, auth.dmarc, 'dmarc');

        renderFindings(findings);
        renderUrls(urls, mask);

        lastSummary = summary;
        lastMask = mask;
        els.copySummaryBtn.disabled = false;

        if (!auth.raw) {
          setStatus('warn', t('text45', 'No Authentication-Results header found. Results may be missing or your source omitted headers.'));
        } else {
          setStatus('success', t('text46', 'Analysis complete.'));
        }
      }

      els.copySummaryBtn.addEventListener('click', async () => {
        if (!lastSummary) return;
        try {
          const text = buildCopySummary(lastSummary, lastMask);
          await navigator.clipboard.writeText(text);
          setStatus('success', t('text47', 'Summary copied to clipboard.'));
        } catch (e) {
          setStatus('error', fmt(t('text48', 'Copy failed: {message}'), { message: e?.message || e }));
        }
      });

      els.analyzeBtn.addEventListener('click', runAnalysis);
      els.loadSampleBtn.addEventListener('click', () => {
        els.input.value = SAMPLE_EMAIL;
        setStatus('success', t('text49', 'Sample loaded. Click Analyze.'));
      });
      els.clearBtn.addEventListener('click', () => {
        els.input.value = '';
        setStatus(null, '');
        els.spfResult.textContent = '—';
        els.dkimResult.textContent = '—';
        els.dmarcResult.textContent = '—';
        els.spfDetail.textContent = '';
        els.dkimDetail.textContent = '';
        els.dmarcDetail.textContent = '';
        els.idFrom.textContent = '—';
        els.idTo.textContent = '—';
        els.idSubject.textContent = '—';
        els.idDate.textContent = '—';
        els.idReturnPath.textContent = '—';
        els.idReplyTo.textContent = '—';
        els.findings.innerHTML = '<p class="text-surface-500 dark:text-surface-400" data-i18n="tools.email-analyzer.ui.desc14">' + t('text50', 'Run analysis to see signals and mismatches.') + '</p>';
        els.findingCount.textContent = '0';
        els.urls.innerHTML = '<p class="text-surface-500 dark:text-surface-400" data-i18n="tools.email-analyzer.ui.desc15">' + t('text51', 'No URLs extracted yet.') + '</p>';
        els.urlCount.textContent = '0';
        els.hops.innerHTML = '<p class="text-surface-500 dark:text-surface-400" data-i18n="tools.email-analyzer.ui.desc16">' + t('text52', 'No routing data yet.') + '</p>';
        els.hopCount.textContent = '0';
        els.copySummaryBtn.disabled = true;
        lastSummary = null;
        lastMask = false;
      });
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    lang: currentLang,
    path: '/email-analyzer',
    content,
    scripts
  });
}
