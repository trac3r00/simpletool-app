import { respondHTML } from "../utils/respond.js";
import { createPageTemplate, createToolHeader } from "../utils/common-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import { createRelatedToolsSection } from "../utils/content-ui.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";

export async function handleWebhookDebuggerRoutes(request, url) {
  const path = url.pathname;

  if (path === "/webhook-debugger" || path === "/webhook-debugger/") {
    if (request.method !== "GET") return null;
    const lang = resolveRequestLanguage(request, url);
    return respondHTML(renderWebhookDebuggerPage(lang));
  }

  return null;
}

function renderWebhookDebuggerPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("webhook-debugger", currentLang);
  const title = translation?.name || "Webhook Payload Inspector";
  const description =
    translation?.desc ||
    "Paste a captured webhook request to inspect its headers, body, and HMAC signature.";

  const header = createToolHeader(
    { emoji: "🪝" },
    title,
    description,
    [
      {
        text:
          translation?.ui?.badge0 ||
          '<span data-i18n="tools.webhook-debugger.ui.badge0">Client-Side Only</span>',
        tooltip:
          "Parsing and signature verification happen in your browser; the request you paste is not sent to our servers.",
      },
    ],
    { toolId: "webhook-debugger" },
  );

  const currentTool = TOOLS.find((t) => t.id === "webhook-debugger");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">
        ${header}

      <!-- Paste panel -->
      <div class="tool-group p-5 mb-6">
        <h2 class="text-sm font-semibold text-surface-800 dark:text-surface-200 mb-1" data-i18n="tools.webhook-debugger.ui.heading0">Paste a webhook request</h2>
        <p class="text-sm text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.webhook-debugger.ui.desc0">Copy a delivery out of your provider's log, a tunnel inspector (ngrok, cloudflared), or your own server log. This inspector does not receive live deliveries — it reads what you paste.</p>

        <label for="raw-request" class="label block mb-1" data-i18n="tools.webhook-debugger.ui.label0">Raw HTTP request or JSON body</label>
        <textarea id="raw-request" rows="12" spellcheck="false"
          class="input input-mono w-full"
          placeholder="POST /hooks/github HTTP/1.1&#10;Host: example.com&#10;Content-Type: application/json&#10;X-Hub-Signature-256: sha256=...&#10;&#10;{&quot;action&quot;:&quot;opened&quot;}"
          data-i18n-placeholder="tools.webhook-debugger.ui.placeholder0"></textarea>

        <div class="flex flex-wrap items-center gap-2 mt-3">
          <button id="inspect-btn" class="btn btn-primary" data-i18n="tools.webhook-debugger.ui.button0">Inspect</button>
          <button id="sample-github-btn" class="btn btn-ghost btn-sm" data-tooltip="Load a GitHub push delivery, signed with a demo secret so Verify succeeds" data-i18n-tooltip="tools.webhook-debugger.ui.tip0"><span data-i18n="tools.webhook-debugger.ui.button1">GitHub sample</span></button>
          <button id="sample-stripe-btn" class="btn btn-ghost btn-sm" data-tooltip="Load a Stripe event delivery, signed with a demo secret so Verify succeeds" data-i18n-tooltip="tools.webhook-debugger.ui.tip1"><span data-i18n="tools.webhook-debugger.ui.button2">Stripe sample</span></button>
          <button id="reset-btn" class="btn btn-ghost btn-sm ml-auto" data-i18n="tools.webhook-debugger.ui.button3">Clear</button>
        </div>

        <p id="parse-error" class="hidden mt-3 text-sm text-error-600 dark:text-error-400" role="alert"></p>
      </div>

      <!-- Parsed request -->
      <div id="request-detail" class="tool-group tool-group--flush hidden overflow-hidden mb-6">
        <div class="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-surface-200 dark:border-surface-700">
          <span id="detail-method" class="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300"></span>
          <span id="detail-path" class="font-mono text-sm text-surface-800 dark:text-surface-200 truncate"></span>
          <span id="detail-meta" class="ml-auto text-xs font-mono text-surface-500 dark:text-surface-400"></span>
        </div>

        <div id="detail-panels">
          <!-- Headers panel -->
          <div class="border-b border-surface-200 dark:border-surface-700">
            <button id="headers-toggle" class="btn-ghost w-full justify-between" aria-expanded="true" aria-controls="headers-panel">
              <span class="text-xs font-bold uppercase text-surface-600 dark:text-surface-300 w-20 text-left" data-i18n="tools.webhook-debugger.ui.label1">Headers</span>
              <span id="headers-count" class="text-xs font-mono text-surface-600 dark:text-surface-300"></span>
              <svg id="headers-chevron" class="w-4 h-4 text-surface-400 ml-auto transition-transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <div id="headers-panel" class="px-5 pb-4">
              <pre id="headers-content" class="font-mono text-xs text-surface-700 dark:text-surface-300 whitespace-pre-wrap break-all max-h-48 overflow-y-auto"></pre>
            </div>
          </div>

          <!-- Body panel -->
          <div class="border-b border-surface-200 dark:border-surface-700">
            <button id="body-toggle" class="btn-ghost w-full justify-between" aria-expanded="true" aria-controls="body-panel">
              <span class="text-xs font-bold uppercase text-surface-600 dark:text-surface-300 w-20 text-left" data-i18n="tools.webhook-debugger.ui.label2">Body</span>
              <span id="body-type" class="text-xs font-mono text-surface-600 dark:text-surface-300"></span>
              <svg id="body-chevron" class="w-4 h-4 text-surface-400 ml-auto transition-transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <div id="body-panel" class="px-5 pb-4">
              <div class="flex items-center justify-between mb-2">
                <div class="flex gap-2">
                  <button id="body-pretty-btn" class="btn btn-ghost btn-xs" data-i18n="tools.webhook-debugger.ui.button4">Pretty</button>
                  <button id="body-raw-btn" class="btn btn-ghost btn-xs" data-i18n="tools.webhook-debugger.ui.button5">Raw</button>
                </div>
                <button id="copy-body-btn" class="btn btn-ghost btn-xs" data-tooltip="Copy body" data-i18n-tooltip="tools.webhook-debugger.ui.tip2"><span data-i18n="tools.webhook-debugger.ui.button6">Copy Body</span></button>
              </div>
              <pre id="body-content" class="font-mono text-xs text-surface-700 dark:text-surface-300 whitespace-pre-wrap break-all max-h-80 overflow-y-auto"></pre>
            </div>
          </div>

          <!-- Signature panel -->
          <div>
            <button id="sig-toggle" class="btn-ghost w-full justify-between" aria-expanded="false" aria-controls="sig-panel">
              <span class="text-xs font-bold uppercase text-surface-600 dark:text-surface-300 w-20 text-left" data-i18n="tools.webhook-debugger.ui.label3">Signature</span>
              <span id="sig-status" class="text-xs font-medium"></span>
              <svg id="sig-chevron" class="w-4 h-4 text-surface-400 ml-auto transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <div id="sig-panel" class="hidden px-5 pb-4">
              <p id="sig-base-note" class="text-xs text-surface-600 dark:text-surface-400 mb-3"></p>
              <div class="grid gap-2 sm:grid-cols-2 mb-3">
                <div>
                  <label for="sig-algorithm" class="label block mb-1" data-i18n="tools.webhook-debugger.ui.label4">HMAC algorithm</label>
                  <select id="sig-algorithm" class="input w-full">
                    <option value="auto" data-i18n="tools.webhook-debugger.ui.option0">Auto-detect</option>
                    <option value="sha256">HMAC-SHA256</option>
                    <option value="sha1">HMAC-SHA1</option>
                    <option value="sha512">HMAC-SHA512</option>
                  </select>
                </div>
                <div>
                  <label for="sig-secret" class="label block mb-1" data-i18n="tools.webhook-debugger.ui.label5">Signing secret</label>
                  <input type="password" id="sig-secret" autocomplete="off" placeholder="whsec_..." data-i18n-placeholder="tools.webhook-debugger.ui.placeholder1" class="input input-mono w-full">
                </div>
              </div>
              <button id="verify-sig-btn" class="btn btn-secondary btn-sm" data-i18n="tools.webhook-debugger.ui.button7">Verify signature</button>
              <div id="sig-result" class="hidden mt-3 font-mono text-xs p-3 rounded-lg" role="status"></div>
            </div>
          </div>

          <!-- Actions row -->
          <div class="flex flex-wrap items-center gap-3 px-5 py-3 border-t border-surface-200 dark:border-surface-700">
            <button id="copy-curl-btn" class="btn btn-secondary btn-sm" data-tooltip="Copy this request as a cURL command" data-i18n-tooltip="tools.webhook-debugger.ui.tip3">
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span data-i18n="tools.webhook-debugger.ui.button8">Copy as cURL</span>
            </button>
            <button id="replay-btn" class="btn btn-ghost btn-sm" data-tooltip="Open this request in Curl Studio" data-i18n-tooltip="tools.webhook-debugger.ui.tip4">
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m0 0a8.001 8.001 0 0115.356 2M4.582 21H6a2 2 0 002-2v-5.582m-9.934 0h9.934a8.008 8.008 0 01-15.356-2m15.356 2H4.582"/></svg>
              <span data-i18n="tools.webhook-debugger.ui.button9">Send in Curl Studio</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div id="empty-state" class="text-center py-16">
        <div class="text-5xl mb-4" aria-hidden="true">🪝</div>
        <p class="text-lg font-semibold text-surface-800 dark:text-surface-200 mb-2" data-i18n="tools.webhook-debugger.ui.heading1">No request loaded</p>
        <p class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.webhook-debugger.ui.desc1">Paste a delivery above, or load a sample. Headers, body, and signature checks are computed in this browser tab.</p>
      </div>

      ${relatedToolsData.length > 0 ? createRelatedToolsSection(relatedToolsData, currentLang) : ""}
      </div>
    </main>

    <script>
      (function() {
      // --- State ---
      var parsed = null;
      var prettyMode = true;

      // --- Elements ---
      var rawInput = document.getElementById('raw-request');
      var inspectBtn = document.getElementById('inspect-btn');
      var resetBtn = document.getElementById('reset-btn');
      var parseError = document.getElementById('parse-error');
      var requestDetail = document.getElementById('request-detail');
      var emptyState = document.getElementById('empty-state');

      // The samples carry REAL signatures over their own bodies, so loading one
      // and hitting Verify proves the check works rather than always reporting
      // a mismatch. Both are signed with DEMO_SECRET, which the sample loader
      // prefills into the secret field.
      var DEMO_SECRET = 'whsec_simpletool_demo';

      var GITHUB_SAMPLE = [
        'POST /hooks/github HTTP/1.1',
        'Host: hooks.example.com',
        'User-Agent: GitHub-Hookshot/a1b2c3d',
        'Content-Type: application/json',
        'X-GitHub-Event: push',
        'X-GitHub-Delivery: 0f7e5a10-4c2b-11ee-9c1a-2f4d6b8e0a11',
        'X-Hub-Signature-256: sha256=ff0f80a51d5aa0cdfb8ab827b9c92e2d5e954588e401448ca87c4b3fe95a3483',
        '',
        '{"ref":"refs/heads/main","after":"9c3a1f2","repository":{"full_name":"acme/widgets"},"pusher":{"name":"octocat"}}'
      ].join('\\n');

      var STRIPE_SAMPLE = [
        'POST /hooks/stripe HTTP/1.1',
        'Host: hooks.example.com',
        'User-Agent: Stripe/1.0 (+https://stripe.com/docs/webhooks)',
        'Content-Type: application/json; charset=utf-8',
        'Stripe-Signature: t=1710000000,v1=47bba5f67439c3f43aeebdeb892fe0aca0055c154dac85411b8d20e89241c7d0',
        '',
        '{"id":"evt_1P0abcDEFghi","type":"payment_intent.succeeded","data":{"object":{"id":"pi_3P0abc","amount":2400,"currency":"usd"}}}'
      ].join('\\n');

      // Header names that carry a webhook signature, most specific first.
      var SIG_HEADERS = [
        'x-hub-signature-256',
        'x-hub-signature',
        'stripe-signature',
        'x-slack-signature',
        'x-shopify-hmac-sha256',
        'x-signature-256',
        'x-signature',
        'x-webhook-signature',
        'signature'
      ];

      // --- Parsing ---------------------------------------------------------

      function parseRawRequest(text) {
        var raw = String(text || '').replace(/\\r\\n/g, '\\n').trim();
        if (!raw) throw new Error(_t('tools.webhook-debugger.js.text0', 'Paste a webhook request first.'));

        // A bare payload: no request line, no headers.
        if (raw.charAt(0) === '{' || raw.charAt(0) === '[') {
          return { method: 'POST', path: '/', version: '', headers: [], body: raw };
        }

        var split = raw.indexOf('\\n\\n');
        var head = split === -1 ? raw : raw.slice(0, split);
        var body = split === -1 ? '' : raw.slice(split + 2);

        var lines = head.split('\\n');
        var method = 'POST';
        var path = '/';
        var version = '';

        var requestLine = lines[0].match(/^([A-Z]+)\\s+(\\S+)(?:\\s+(HTTP\\/[\\d.]+))?\\s*$/);
        if (requestLine) {
          method = requestLine[1];
          path = requestLine[2];
          version = requestLine[3] || '';
          lines = lines.slice(1);
        }

        var headers = [];
        var stray = -1;
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (!line.trim()) continue;
          // A folded continuation line belongs to the previous header.
          if (/^\\s/.test(line) && headers.length) {
            headers[headers.length - 1][1] += ' ' + line.trim();
            continue;
          }
          var m = line.match(/^([^:\\s]+):\\s?([\\s\\S]*)$/);
          if (!m) { stray = i; break; }
          headers.push([m[1], m[2].trim()]);
        }

        // No blank line, but the head ran into non-header text: the rest is body.
        if (stray !== -1 && !body) body = lines.slice(stray).join('\\n');

        if (!requestLine && !headers.length) {
          throw new Error(_t('tools.webhook-debugger.js.text1', 'Could not read this as an HTTP request. Expected a request line or "Header: value" lines, a blank line, then the body.'));
        }

        return { method: method, path: path, version: version, headers: headers, body: body.trim() };
      }

      function headerMap(headers) {
        var map = {};
        headers.forEach(function(h) { map[h[0].toLowerCase()] = h[1]; });
        return map;
      }

      function contentTypeOf(req) {
        return headerMap(req.headers)['content-type'] || '';
      }

      // --- Formatting helpers ----------------------------------------------

      function prettyBody(body, contentType) {
        if (!body) return '';
        if (!contentType || contentType.indexOf('json') !== -1 || body.charAt(0) === '{' || body.charAt(0) === '[') {
          try { return JSON.stringify(JSON.parse(body), null, 2); } catch (e) {}
        }
        if (contentType.indexOf('x-www-form-urlencoded') !== -1) {
          try {
            var out = [];
            new URLSearchParams(body).forEach(function(v, k) { out.push(k + ' = ' + v); });
            if (out.length) return out.join('\\n');
          } catch (e) {}
        }
        return body;
      }

      function copyToClipboard(text, btn) {
        var label = btn ? btn.querySelector('span') : null;
        navigator.clipboard.writeText(text).then(function() {
          if (!label) return;
          var orig = label.textContent;
          label.textContent = _t('tools.webhook-debugger.js.text2', 'Copied');
          setTimeout(function() { label.textContent = orig; }, 1500);
        }).catch(function() {});
      }

      function methodColorClass(method) {
        var m = (method || 'POST').toUpperCase();
        if (m === 'POST') return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300';
        if (m === 'PUT') return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300';
        if (m === 'DELETE') return 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300';
        if (m === 'PATCH') return 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300';
        return 'bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-300';
      }

      function showError(message) {
        parseError.textContent = message;
        parseError.classList.remove('hidden');
      }

      function clearError() {
        parseError.textContent = '';
        parseError.classList.add('hidden');
      }

      // --- Render ----------------------------------------------------------

      function render() {
        if (!parsed) {
          requestDetail.classList.add('hidden');
          emptyState.classList.remove('hidden');
          return;
        }
        emptyState.classList.add('hidden');
        requestDetail.classList.remove('hidden');

        var methodEl = document.getElementById('detail-method');
        methodEl.textContent = parsed.method;
        methodEl.className = 'shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ' + methodColorClass(parsed.method);
        document.getElementById('detail-path').textContent = parsed.path;

        var ct = contentTypeOf(parsed);
        var bytes = parsed.body ? parsed.body.length : 0;
        document.getElementById('detail-meta').textContent =
          parsed.headers.length + ' headers - ' + bytes + ' bytes';

        document.getElementById('headers-count').textContent =
          parsed.headers.length + ' header' + (parsed.headers.length === 1 ? '' : 's');
        document.getElementById('headers-content').textContent =
          parsed.headers.map(function(h) { return h[0] + ': ' + h[1]; }).join('\\n');

        document.getElementById('body-type').textContent = ct.split(';')[0].trim() || 'unknown';
        document.getElementById('body-content').textContent =
          prettyMode ? prettyBody(parsed.body, ct) : parsed.body;

        var sig = findSignature(parsed);
        var sigStatus = document.getElementById('sig-status');
        sigStatus.className = 'text-xs font-medium text-surface-600 dark:text-surface-300';
        sigStatus.textContent = sig
          ? _t('tools.webhook-debugger.js.text3', 'Not verified')
          : _t('tools.webhook-debugger.js.text4', 'No signature header');

        var base = signingBase(parsed);
        document.getElementById('sig-base-note').textContent = sig
          ? _t('tools.webhook-debugger.js.text5', 'Signature header:') + ' ' + sig.header + ' - ' + base.note
          : _t('tools.webhook-debugger.js.text6', 'No known signature header found. Enter a secret to compute the HMAC of') + ' ' + base.note;

        var sigResult = document.getElementById('sig-result');
        sigResult.className = 'hidden mt-3 font-mono text-xs p-3 rounded-lg';
        sigResult.textContent = '';
      }

      // --- Signature -------------------------------------------------------

      function findSignature(req) {
        var map = headerMap(req.headers);
        for (var i = 0; i < SIG_HEADERS.length; i++) {
          var name = SIG_HEADERS[i];
          if (map[name] === undefined) continue;
          return { header: name, value: map[name] };
        }
        return null;
      }

      /**
       * Providers sign different strings, not always the raw body: Stripe signs
       * "timestamp.body" and Slack signs "v0:timestamp:body". Comparing against
       * the body alone reports a valid delivery as a mismatch.
       */
      function signingBase(req) {
        var map = headerMap(req.headers);
        var body = req.body || '';
        var stripe = map['stripe-signature'];
        if (stripe) {
          var t = /(?:^|,)\\s*t=([^,]+)/.exec(stripe);
          if (t) return { base: t[1] + '.' + body, note: 'Stripe scheme: timestamp + "." + body' };
        }
        var slackTs = map['x-slack-request-timestamp'];
        if (map['x-slack-signature'] && slackTs) {
          return { base: 'v0:' + slackTs + ':' + body, note: 'Slack scheme: v0:timestamp:body' };
        }
        return { base: body, note: _t('tools.webhook-debugger.js.text7', 'the raw request body') };
      }

      /** Strips the scheme prefix providers put in front of the digest. */
      function normalizeSignature(sig) {
        var value = sig.value.trim();
        if (sig.header === 'stripe-signature') {
          var v1 = /(?:^|,)\\s*v1=([^,]+)/.exec(value);
          if (v1) return v1[1].trim();
        }
        var prefixed = /^(?:sha1|sha256|sha512|v0|v1)=(.+)$/i.exec(value);
        return prefixed ? prefixed[1].trim() : value;
      }

      function algorithmFor(sig, selected) {
        if (selected !== 'auto') return selected;
        if (!sig) return 'sha256';
        if (sig.header === 'x-hub-signature') return 'sha1';
        if (sig.header === 'x-hub-signature-256') return 'sha256';
        if (/^sha1=/i.test(sig.value)) return 'sha1';
        if (/^sha512=/i.test(sig.value)) return 'sha512';
        return 'sha256';
      }

      async function computeHmac(secret, algorithm, message) {
        var algoMap = { sha256: 'SHA-256', sha1: 'SHA-1', sha512: 'SHA-512' };
        var key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(secret),
          { name: 'HMAC', hash: algoMap[algorithm] || 'SHA-256' },
          false,
          ['sign']
        );
        var signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
        var bytes = new Uint8Array(signature);
        var hex = '';
        var binary = '';
        bytes.forEach(function(b) {
          hex += ('0' + b.toString(16)).slice(-2);
          binary += String.fromCharCode(b);
        });
        return { hex: hex, base64: btoa(binary) };
      }

      // --- Wiring ----------------------------------------------------------

      function inspect() {
        clearError();
        try {
          parsed = parseRawRequest(rawInput.value);
        } catch (e) {
          parsed = null;
          showError(e.message);
        }
        render();
      }

      inspectBtn.addEventListener('click', inspect);

      rawInput.addEventListener('keydown', function(e) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          inspect();
        }
      });

      function loadSample(sample) {
        rawInput.value = sample;
        document.getElementById('sig-secret').value = DEMO_SECRET;
        inspect();
      }

      document.getElementById('sample-github-btn').addEventListener('click', function() {
        loadSample(GITHUB_SAMPLE);
      });

      document.getElementById('sample-stripe-btn').addEventListener('click', function() {
        loadSample(STRIPE_SAMPLE);
      });

      resetBtn.addEventListener('click', function() {
        rawInput.value = '';
        parsed = null;
        clearError();
        document.getElementById('sig-secret').value = '';
        render();
        rawInput.focus();
      });

      function setupToggle(buttonId, panelId, chevronId) {
        var btn = document.getElementById(buttonId);
        var panel = document.getElementById(panelId);
        var chevron = document.getElementById(chevronId);
        if (!btn || !panel) return;
        btn.addEventListener('click', function() {
          var willShow = panel.classList.contains('hidden');
          panel.classList.toggle('hidden', !willShow);
          chevron.classList.toggle('rotate-180', willShow);
          btn.setAttribute('aria-expanded', willShow ? 'true' : 'false');
        });
      }
      setupToggle('headers-toggle', 'headers-panel', 'headers-chevron');
      setupToggle('body-toggle', 'body-panel', 'body-chevron');
      setupToggle('sig-toggle', 'sig-panel', 'sig-chevron');

      document.getElementById('body-pretty-btn').addEventListener('click', function() {
        prettyMode = true;
        render();
      });
      document.getElementById('body-raw-btn').addEventListener('click', function() {
        prettyMode = false;
        render();
      });

      document.getElementById('copy-body-btn').addEventListener('click', function() {
        if (parsed) copyToClipboard(parsed.body || '', this);
      });

      document.getElementById('verify-sig-btn').addEventListener('click', async function() {
        if (!parsed) return;
        var secret = document.getElementById('sig-secret').value;
        var sigResult = document.getElementById('sig-result');
        var sigStatus = document.getElementById('sig-status');

        if (!secret) {
          sigResult.className = 'mt-3 font-mono text-xs p-3 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300';
          sigResult.textContent = _t('tools.webhook-debugger.js.text8', 'Enter the signing secret to verify.');
          return;
        }

        var sig = findSignature(parsed);
        var base = signingBase(parsed);
        var algorithm = algorithmFor(sig, document.getElementById('sig-algorithm').value);
        var digest = await computeHmac(secret, algorithm, base.base);

        if (!sig) {
          sigResult.className = 'mt-3 font-mono text-xs p-3 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300';
          sigResult.textContent = _t('tools.webhook-debugger.js.text9', 'No signature header to compare against.') +
            '\\nHMAC-' + algorithm.toUpperCase() + ' (hex): ' + digest.hex +
            '\\nHMAC-' + algorithm.toUpperCase() + ' (base64): ' + digest.base64;
          sigStatus.textContent = _t('tools.webhook-debugger.js.text4', 'No signature header');
          sigStatus.className = 'text-xs font-medium text-surface-600 dark:text-surface-300';
          return;
        }

        var provided = normalizeSignature(sig);
        var match = provided.toLowerCase() === digest.hex.toLowerCase() || provided === digest.base64;

        sigResult.className = 'mt-3 font-mono text-xs p-3 rounded-lg ' + (match
          ? 'bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300'
          : 'bg-error-100 dark:bg-error-900/30 text-error-800 dark:text-error-300');
        sigResult.textContent = (match
            ? _t('tools.webhook-debugger.js.text10', 'Signature valid')
            : _t('tools.webhook-debugger.js.text11', 'Signature mismatch')) +
          '\\n' + _t('tools.webhook-debugger.js.text12', 'Signed over:') + ' ' + base.note +
          '\\n' + _t('tools.webhook-debugger.js.text13', 'Computed:') + ' ' + digest.hex +
          '\\n' + _t('tools.webhook-debugger.js.text14', 'Provided:') + ' ' + provided;

        sigStatus.textContent = match
          ? _t('tools.webhook-debugger.js.text15', 'Valid')
          : _t('tools.webhook-debugger.js.text16', 'Mismatch');
        sigStatus.className = 'text-xs font-medium ' + (match
          ? 'text-success-600 dark:text-success-400'
          : 'text-error-600 dark:text-error-400');
      });

      function requestUrl() {
        var host = headerMap(parsed.headers)['host'] || '';
        if (/^https?:\\/\\//i.test(parsed.path)) return parsed.path;
        if (!host) return parsed.path;
        return (/^localhost|^127\\./.test(host) ? 'http://' : 'https://') + host + parsed.path;
      }

      // Hop-by-hop and computed headers a replay must not carry over.
      function replayHeaders() {
        var skip = ['host', 'connection', 'content-length', 'transfer-encoding'];
        var out = {};
        parsed.headers.forEach(function(h) {
          if (skip.indexOf(h[0].toLowerCase()) === -1) out[h[0]] = h[1];
        });
        return out;
      }

      document.getElementById('copy-curl-btn').addEventListener('click', function() {
        if (!parsed) return;
        var cmd = 'curl -X ' + parsed.method + ' \\\\\\n  "' + requestUrl() + '"';
        var headers = replayHeaders();
        Object.keys(headers).forEach(function(k) {
          cmd += ' \\\\\\n  -H "' + k + ': ' + headers[k] + '"';
        });
        if (parsed.body && parsed.method !== 'GET') {
          cmd += ' \\\\\\n  -d ' + JSON.stringify(parsed.body);
        }
        copyToClipboard(cmd, this);
      });

      document.getElementById('replay-btn').addEventListener('click', function() {
        if (!parsed) return;
        var params = new URLSearchParams();
        params.set('method', parsed.method);
        params.set('url', requestUrl());
        var headers = replayHeaders();
        if (Object.keys(headers).length > 0) params.set('headers', JSON.stringify(headers));
        if (parsed.body) params.set('body', parsed.body);
        var win = window.open('/curl-studio?' + params.toString(), '_blank');
        if (win) win.focus();
      });

      render();
    })();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    content,
    path: "/webhook-debugger",
    lang: currentLang,
  });
}
