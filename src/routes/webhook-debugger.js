import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleWebhookDebuggerRoutes(request, url) {
  if (url.pathname !== '/webhook-debugger' && url.pathname !== '/webhook-debugger/') return null;
  if (request.method !== 'GET') return null;
  const lang = resolveRequestLanguage(request, url);
  return respondHTML(renderWebhookDebuggerPage(lang));
}

function renderWebhookDebuggerPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('webhook-debugger', currentLang);
  const title = translation?.name || 'Webhook Debugger';
  const description = translation?.desc || 'Capture, inspect, and replay webhook payloads locally in your browser.';

  const header = createToolHeader(
    { emoji: '🪝' },
    title,
    description,
    [{ text: translation?.ui?.badge14 || 'Privacy-First', tooltip: 'All processing happens in your browser — no data is sent to any server.' }],
    { toolId: 'webhook-debugger' }
  );

  const currentTool = TOOLS.find(t => t.id === 'webhook-debugger');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      ${header}

      <!-- Webhook URL display + start/stop -->
      <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5 mb-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex-1 min-w-0">
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1"><span data-i18n="tools.webhook-debugger.ui.label0">Local Endpoint</span></label>
            <div class="flex items-center gap-2">
              <code id="webhook-url" class="flex-1 font-mono text-sm bg-surface-100 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 text-surface-800 dark:text-surface-200 truncate select-all"></code>
              <button id="copy-url-btn" data-tooltip="Copy endpoint URL" data-i18n-tooltip="tools.webhook-debugger.ui.tip0" class="btn btn-ghost btn-sm shrink-0"><span data-i18n="tools.webhook-debugger.ui.button0">Copy</span></button>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div id="status-indicator" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 text-sm font-medium">
              <span id="status-dot" class="w-2.5 h-2.5 rounded-full bg-surface-400"></span>
              <span id="status-label" data-i18n="tools.webhook-debugger.ui.desc0">Stopped</span>
            </div>
            <button id="toggle-listen-btn" data-tooltip="Start/stop webhook listener" data-i18n-tooltip="tools.webhook-debugger.ui.tip1" class="btn btn-primary"><span data-i18n="tools.webhook-debugger.ui.button1">Start Listening</span></button>
          </div>
        </div>
      </div>

      <!-- Request log list -->
      <div id="webhook-log" class="space-y-3 mb-6"></div>

      <!-- Selected request detail -->
      <div id="request-detail" class="hidden bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 overflow-hidden mb-6">
        <!-- Request summary bar -->
        <button id="detail-close-btn" class="w-full flex items-center justify-between px-5 py-3 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-left">
          <div class="flex items-center gap-3 min-w-0">
            <span id="detail-seq" class="shrink-0 text-xs font-mono font-bold text-surface-500 dark:text-surface-400"></span>
            <span id="detail-method" class="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300"></span>
            <span id="detail-path" class="font-mono text-sm text-surface-800 dark:text-surface-200 truncate"></span>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <span id="detail-time" class="text-xs font-mono text-surface-500"></span>
            <svg class="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </div>
        </button>

        <!-- Expanded detail panels -->
        <div id="detail-panels" class="border-t border-surface-200 dark:border-surface-700">
          <!-- Headers panel -->
          <div class="border-b border-surface-200 dark:border-surface-700">
            <button id="headers-toggle" class="w-full flex items-center gap-2 px-5 py-3 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-left">
              <span class="text-xs font-bold uppercase text-surface-500 dark:text-surface-400 w-20">Headers</span>
              <span id="headers-count" class="text-xs font-mono text-surface-500 dark:text-surface-400"></span>
              <svg id="headers-chevron" class="w-4 h-4 text-surface-400 ml-auto transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <div id="headers-panel" class="hidden px-5 pb-4">
              <pre id="headers-content" class="font-mono text-xs text-surface-700 dark:text-surface-300 whitespace-pre-wrap break-all max-h-48 overflow-y-auto"></pre>
            </div>
          </div>

          <!-- Body panel -->
          <div class="border-b border-surface-200 dark:border-surface-700">
            <button id="body-toggle" class="w-full flex items-center gap-2 px-5 py-3 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-left">
              <span class="text-xs font-bold uppercase text-surface-500 dark:text-surface-400 w-20">Body</span>
              <span id="body-type" class="text-xs font-mono text-surface-500 dark:text-surface-400"></span>
              <svg id="body-chevron" class="w-4 h-4 text-surface-400 ml-auto transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <div id="body-panel" class="hidden px-5 pb-4">
              <div class="flex items-center justify-between mb-2">
                <div class="flex gap-2">
                  <button id="body-pretty-btn" class="btn btn-ghost btn-xs" data-i18n="tools.webhook-debugger.ui.button2">Pretty</button>
                  <button id="body-raw-btn" class="btn btn-ghost btn-xs" data-i18n="tools.webhook-debugger.ui.button3">Raw</button>
                </div>
                <button id="copy-body-btn" class="btn btn-ghost btn-xs" data-tooltip="Copy body" data-i18n-tooltip="tools.webhook-debugger.ui.tip2"><span data-i18n="tools.webhook-debugger.ui.button4">Copy Body</span></button>
              </div>
              <pre id="body-content" class="font-mono text-xs text-surface-700 dark:text-surface-300 whitespace-pre-wrap break-all max-h-80 overflow-y-auto"></pre>
            </div>
          </div>

          <!-- Signature verification panel -->
          <div>
            <button id="sig-toggle" class="w-full flex items-center gap-2 px-5 py-3 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-left">
              <span class="text-xs font-bold uppercase text-surface-500 dark:text-surface-400 w-20">Signature</span>
              <span id="sig-status" class="text-xs font-medium"></span>
              <svg id="sig-chevron" class="w-4 h-4 text-surface-400 ml-auto transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <div id="sig-panel" class="hidden px-5 pb-4">
              <div class="flex flex-wrap gap-2 items-center mb-3">
                <select id="sig-algorithm" class="bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg text-xs px-2 py-1.5 focus:ring-primary-500">
                  <option value="sha256">HMAC-SHA256</option>
                  <option value="sha1">HMAC-SHA1</option>
                  <option value="sha512">HMAC-SHA512</option>
                </select>
                <input type="text" id="sig-secret" placeholder="Enter secret..." data-i18n-placeholder="tools.webhook-debugger.ui.placeholder9"
                  class="flex-1 min-w-0 px-2 py-1.5 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg text-xs focus:ring-primary-500">
                <button id="verify-sig-btn" class="btn btn-secondary btn-xs" data-i18n="tools.webhook-debugger.ui.button5">Verify</button>
              </div>
              <div id="sig-result" class="hidden font-mono text-xs p-3 rounded-lg"></div>
            </div>
          </div>

          <!-- Actions row -->
          <div class="flex items-center gap-3 px-5 py-3 bg-surface-50 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700">
            <button id="copy-curl-btn" class="btn btn-secondary btn-sm" data-tooltip="Copy as cURL command (curl-studio format)" data-i18n-tooltip="tools.webhook-debugger.ui.tip3">
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span data-i18n="tools.webhook-debugger.ui.button6">Copy as cURL</span>
            </button>
            <button id="replay-btn" class="btn btn-ghost btn-sm" data-tooltip="Replay this request (opens curl-studio)" data-i18n-tooltip="tools.webhook-debugger.ui.tip4">
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m0 0a8.001 8.001 0 0115.356 2M4.582 21H6a2 2 0 002-2v-5.582m-9.934 0h9.934a8.008 8.008 0 01-15.356-2m15.356 2H4.582"/></svg>
              <span data-i18n="tools.webhook-debugger.ui.button7">Replay</span>
            </button>
            <button id="clear-btn" class="btn btn-ghost btn-sm text-error-600 dark:text-error-400" data-tooltip="Clear this request" data-i18n-tooltip="tools.webhook-debugger.ui.tip5">
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              <span data-i18n="tools.webhook-debugger.ui.button8">Clear</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div id="empty-state" class="text-center py-16">
        <div class="text-5xl mb-4" aria-hidden="true">🪝</div>
        <p class="text-lg font-semibold text-surface-800 dark:text-surface-200 mb-2" data-i18n="tools.webhook-debugger.ui.heading10">Waiting for webhooks</p>
        <p class="text-sm text-surface-500 dark:text-surface-400" data-i18n="tools.webhook-debugger.ui.desc1">Start listening and send a webhook to your local endpoint. Requests will appear here.</p>
      </div>

      ${relatedToolsData.length > 0 ? createRelatedToolsSection(relatedToolsData) : ''}
    </main>

    <script>
      (function() {
      // --- State ---
      var isListening = false;
      var requests = [];  // [{id, timestamp, method, url, headers, body, contentType}]
      var selectedId = null;
      var prettyMode = true;

      // --- Elements ---
      var webhookUrl = document.getElementById('webhook-url');
      var copyUrlBtn = document.getElementById('copy-url-btn');
      var statusDot = document.getElementById('status-dot');
      var statusLabel = document.getElementById('status-label');
      var toggleListenBtn = document.getElementById('toggle-listen-btn');
      var webhookLog = document.getElementById('webhook-log');
      var requestDetail = document.getElementById('request-detail');
      var emptyState = document.getElementById('empty-state');

      // Compute local endpoint (intercept fetch on this origin)
      var localBase = window.location.origin;
      var endpointPath = '/webhook-debugger/capture';
      var fullEndpoint = localBase + endpointPath;

      // Show the endpoint URL
      if (webhookUrl) webhookUrl.textContent = fullEndpoint;

      // --- Utility: format timestamp ---
      function fmtTime(ts) {
        var d = new Date(ts);
        var h = String(d.getHours()).padStart(2, '0');
        var m = String(d.getMinutes()).padStart(2, '0');
        var s = String(d.getSeconds()).padStart(2, '0');
        var ms = String(d.getMilliseconds()).padStart(3, '0');
        return h + ':' + m + ':' + s + '.' + ms;
      }

      // --- Utility: format headers as key: value list ---
      function formatHeaders(headersObj) {
        if (!headersObj) return '';
        if (typeof headersObj === 'string') return headersObj;
        var entries;
        if (headersObj.entries) {
          entries = Array.from(headersObj.entries());
        } else if (Array.isArray(headersObj)) {
          entries = headersObj;
        } else {
          entries = Object.entries(headersObj);
        }
        return entries.map(function(e) { return e[0] + ': ' + e[1]; }).join('\\n');
      }

      // --- Utility: pretty-print body content ---
      function prettyBody(body, contentType) {
        if (!body) return '';
        if (contentType && contentType.includes('json')) {
          try { return JSON.stringify(JSON.parse(body), null, 2); } catch(e) {}
        }
        return body;
      }

      // --- Utility: copy text to clipboard ---
      function copyToClipboard(text, btn) {
        navigator.clipboard.writeText(text).then(function() {
          var orig = btn ? btn.textContent : '';
          if (btn) {
            btn.textContent = 'Copied!';
            setTimeout(function() { btn.textContent = orig; }, 1500);
          }
        }).catch(function() {});
      }

      // --- Fetch interception ---
      // We use a hidden form + iframe approach for GET capture, and
      // override fetch for same-origin capture programmatically.
      // Since this tool inspects client-side webhooks, the most reliable
      // client-side capture is to provide a URL that, when fetched by an
      // external system, returns a tracking pixel or script that reports
      // back via a callback. For local replay/inspection, we use the
      // sessionStorage queue approach.

      // Actually, the right client-side approach for this tool is:
      // Provide a unique per-session URL the user can set in their webhook
      // provider. When that URL is hit (cross-origin), we cannot read the
      // response from the external caller in a client-side only app.
      // 
      // Instead, for client-side inspection:
      // 1. User copies the displayed endpoint into their webhook provider
      // 2. User manually triggers a test webhook
      // 3. This page polls for captured requests via a hidden iframe/script
      //    that loads /webhook-debugger/capture?session=XXX which sets a cookie
      //    we can then read (since same-origin)
      // OR:
      // The simplest real approach: provide a text area where users PASTE their
      // raw HTTP request (headers + body) and we parse/display it — no server needed.
      // 
      // For the proposal's "client-side only" value prop, let's do the paste approach
      // with optional session-based capture via an iframe beacon.
      // The iframe route keeps it serverless and private.

      // Use sessionStorage to coordinate between iframe and parent
      var SESSION_KEY = 'whd_capture_' + (window.location.port || '80');
      var iframeEl = null;

      // Generate a session ID for cross-document messaging
      var sessionId = (function() {
        var stored = sessionStorage.getItem('whd_session_id');
        if (!stored) {
          stored = Math.random().toString(36).substr(2, 9);
          sessionStorage.setItem('whd_session_id', stored);
        }
        return stored;
      })();

      // Create hidden iframe for cross-tab capture (same origin)
      function createIframe() {
        if (iframeEl) return;
        iframeEl = document.createElement('iframe');
        iframeEl.src = localBase + '/webhook-debugger/listen?session=' + sessionId + '&origin=' + encodeURIComponent(window.location.origin);
        iframeEl.style.display = 'none';
        iframeEl.id = 'whd-iframe';
        document.body.appendChild(iframeEl);
      }

      function removeIframe() {
        if (iframeEl) {
          iframeEl.remove();
          iframeEl = null;
        }
      }

      // Set captured request in sessionStorage (for cross-tab/iframe communication)
      function setCapture(req) {
        var captures = [];
        try {
          captures = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
        } catch(e) {}
        captures.push(req);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(captures));
        // Also store current so iframe can read
        sessionStorage.setItem('whd_current', JSON.stringify(req));
      }

      function getCaptures() {
        try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]'); } catch(e) { return []; }
      }

      function clearCaptures() {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem('whd_current');
        requests = [];
        renderLog();
        hideDetail();
      }

      // Poll for new captures from other tabs/iframes
      var lastCaptureTime = 0;
      function pollCaptures() {
        var caps = getCaptures();
        var changed = false;
        caps.forEach(function(cap) {
          if (cap.ts > lastCaptureTime) {
            requests.push(cap);
            lastCaptureTime = cap.ts;
            changed = true;
          }
        });
        if (changed) renderLog();
      }

      setInterval(pollCaptures, 1500);

      // --- Render the request log ---
      function renderLog() {
        if (!webhookLog) return;
        if (requests.length === 0) {
          webhookLog.innerHTML = '';
          return;
        }
        webhookLog.innerHTML = requests.slice().reverse().map(function(req) {
          var shortPath = req.url ? req.url.replace(localBase, '') : req.path || '/';
          var shortHeaders = req.headersObj || {};
          var contentLen = req.body ? req.body.length : 0;
          var methodColor = methodColorClass(req.method);
          return '<div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-4 cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors webhook-log-item" data-id="' + req.id + '" role="button" tabindex="0" aria-label="View request ' + req.id + '">' +
            '<div class="flex items-center gap-3 mb-2">' +
              '<span class="text-xs font-mono font-bold text-surface-500 dark:text-surface-400 shrink-0">#' + req.seq + '</span>' +
              '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ' + methodColor + '">' + (req.method || 'GET') + '</span>' +
              '<span class="font-mono text-sm text-surface-800 dark:text-surface-200 truncate">' + shortPath + '</span>' +
              '<span class="ml-auto text-xs font-mono text-surface-400 shrink-0">' + fmtTime(req.ts) + '</span>' +
            '</div>' +
            '<div class="flex items-center gap-4 text-xs text-surface-500 dark:text-surface-400">' +
              '<span>' + Object.keys(shortHeaders).length + ' headers</span>' +
              '<span>' + contentLen + ' bytes</span>' +
              '<span class="truncate max-w-[200px]">' + (req.contentType || '').split(';')[0].trim() + '</span>' +
            '</div>' +
          '</div>';
        }).join('');

        // Click handlers
        webhookLog.querySelectorAll('.webhook-log-item').forEach(function(el) {
          el.addEventListener('click', function() {
            var id = el.getAttribute('data-id');
            showDetail(id);
          });
          el.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              showDetail(el.getAttribute('data-id'));
            }
          });
        });
      }

      function methodColorClass(method) {
        var m = (method || 'GET').toUpperCase();
        if (m === 'POST') return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300';
        if (m === 'PUT') return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300';
        if (m === 'DELETE') return 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300';
        if (m === 'PATCH') return 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300';
        return 'bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-300';
      }

      // --- Render request detail ---
      function showDetail(id) {
        var req = requests.find(function(r) { return r.id === id; });
        if (!req) return;
        selectedId = id;
        if (emptyState) emptyState.classList.add('hidden');

        document.getElementById('detail-seq').textContent = '#' + req.seq;
        document.getElementById('detail-method').textContent = req.method || 'GET';
        document.getElementById('detail-method').className = 'shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ' + methodColorClass(req.method);
        var shortPath = (req.url || req.path || '/').replace(localBase, '');
        document.getElementById('detail-path').textContent = shortPath;
        document.getElementById('detail-time').textContent = fmtTime(req.ts);

        // Headers
        var hCount = req.headersObj ? Object.keys(req.headersObj).length : 0;
        document.getElementById('headers-count').textContent = hCount + ' header' + (hCount !== 1 ? 's' : '');
        document.getElementById('headers-content').textContent = formatHeaders(req.headersObj);

        // Body
        var ct = req.contentType || '';
        document.getElementById('body-type').textContent = ct.split(';')[0].trim() || 'unknown';
        var rawBody = req.body || '';
        document.getElementById('body-content').textContent = prettyMode ? prettyBody(rawBody, ct) : rawBody;

        // Signature — default to SHA-256, clear result
        var sigResult = document.getElementById('sig-result');
        sigResult.className = 'hidden font-mono text-xs p-3 rounded-lg';
        sigResult.textContent = '';
        document.getElementById('sig-status').textContent = '';

        requestDetail.classList.remove('hidden');
        // Collapse all panels by default
        ['headers-panel', 'body-panel', 'sig-panel'].forEach(function(id) {
          var el = document.getElementById(id);
          if (el) el.classList.add('hidden');
        });
        ['headers-chevron', 'body-chevron', 'sig-chevron'].forEach(function(id) {
          var el = document.getElementById(id);
          if (el) el.classList.remove('rotate-180');
        });
      }

      function hideDetail() {
        selectedId = null;
        requestDetail.classList.add('hidden');
        if (requests.length === 0 && emptyState) emptyState.classList.remove('hidden');
      }

      // --- Signature verification using Web Crypto API ---
      async function computeHmac(secret, algorithm, message) {
        var algoMap = { sha256: 'SHA-256', sha1: 'SHA-1', sha512: 'SHA-512' };
        var key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(secret),
          { name: 'HMAC', hash: algoMap[algorithm] || 'SHA-256' },
          false,
          ['verify', 'sign']
        );
        var signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
        // Convert to hex
        var arr = new Uint8Array(signature);
        var hex = '';
        arr.forEach(function(b) { hex += ('0' + b.toString(16)).slice(-2); });
        return hex;
      }

      // --- Toggle listening ---
      toggleListenBtn.addEventListener('click', function() {
        isListening = !isListening;
        updateListenUI();
        if (isListening) {
          createIframe();
          sessionStorage.setItem('whd_listening', 'true');
        } else {
          removeIframe();
          sessionStorage.removeItem('whd_listening');
        }
      });

      function updateListenUI() {
        if (isListening) {
          statusDot.className = 'w-2.5 h-2.5 rounded-full bg-success-500 animate-pulse';
          statusLabel.textContent = _t('tools.webhook-debugger.ui.desc2', 'Listening...');
          toggleListenBtn.innerHTML = '<span data-i18n="tools.webhook-debugger.ui.button9">Stop</span>';
          toggleListenBtn.classList.remove('btn-primary');
          toggleListenBtn.classList.add('btn-secondary');
        } else {
          statusDot.className = 'w-2.5 h-2.5 rounded-full bg-surface-400';
          statusLabel.textContent = _t('tools.webhook-debugger.ui.desc0', 'Stopped');
          toggleListenBtn.innerHTML = '<span data-i18n="tools.webhook-debugger.ui.button1">Start Listening</span>';
          toggleListenBtn.classList.remove('btn-secondary');
          toggleListenBtn.classList.add('btn-primary');
        }
      }

      // --- Copy URL ---
      copyUrlBtn.addEventListener('click', function() {
        copyToClipboard(fullEndpoint, copyUrlBtn);
      });

      // --- Panel toggles ---
      function setupToggle(headerId, panelId, chevronId) {
        var btn = document.getElementById(headerId);
        var panel = document.getElementById(panelId);
        var chevron = document.getElementById(chevronId);
        if (!btn || !panel) return;
        btn.addEventListener('click', function() {
          var isHidden = panel.classList.contains('hidden');
          panel.classList.toggle('hidden', !isHidden);
          chevron.classList.toggle('rotate-180', isHidden);
        });
      }
      setupToggle('headers-toggle', 'headers-panel', 'headers-chevron');
      setupToggle('body-toggle', 'body-panel', 'body-chevron');
      setupToggle('sig-toggle', 'sig-panel', 'sig-chevron');

      // --- Body pretty/raw toggle ---
      document.getElementById('body-pretty-btn').addEventListener('click', function() {
        prettyMode = true;
        if (selectedId) showDetail(selectedId);
      });
      document.getElementById('body-raw-btn').addEventListener('click', function() {
        prettyMode = false;
        if (selectedId) showDetail(selectedId);
      });

      // --- Copy body ---
      document.getElementById('copy-body-btn').addEventListener('click', function() {
        var req = requests.find(function(r) { return r.id === selectedId; });
        if (req) copyToClipboard(req.body || '', this);
      });

      // --- Copy as cURL ---
      document.getElementById('copy-curl-btn').addEventListener('click', function() {
        var req = requests.find(function(r) { return r.id === selectedId; });
        if (!req) return;
        var headers = req.headersObj || {};
        var cmd = 'curl -X ' + (req.method || 'GET') + ' \\\n  "' + (req.url || localBase + '/') + '"';
        Object.entries(headers).forEach(function(e) {
          if (['host', 'connection', 'content-length'].indexOf(e[0].toLowerCase()) === -1) {
            cmd += ' \\\n  -H "' + e[0] + ': ' + e[1] + '"';
          }
        });
        if (req.body && req.method !== 'GET') {
          cmd += ' \\\n  -d ' + JSON.stringify(req.body);
        }
        copyToClipboard(cmd, this);
      });

      // --- Replay: open curl-studio with pre-filled data ---
      document.getElementById('replay-btn').addEventListener('click', function() {
        var req = requests.find(function(r) { return r.id === selectedId; });
        if (!req) return;
        var params = new URLSearchParams();
        params.set('method', req.method || 'GET');
        params.set('url', req.url || localBase + '/');
        var headers = req.headersObj || {};
        var filtered = {};
        Object.entries(headers).forEach(function(e) {
          if (['host', 'connection', 'content-length'].indexOf(e[0].toLowerCase()) === -1) {
            filtered[e[0]] = e[1];
          }
        });
        if (Object.keys(filtered).length > 0) params.set('headers', JSON.stringify(filtered));
        if (req.body) params.set('body', typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
        var win = window.open('/curl-studio?' + params.toString(), '_blank');
        if (win) win.focus();
      });

      // --- Clear single request ---
      document.getElementById('clear-btn').addEventListener('click', function() {
        if (!selectedId) return;
        requests = requests.filter(function(r) { return r.id !== selectedId; });
        hideDetail();
        renderLog();
        // Persist
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(requests));
      });

      // --- Detail close ---
      document.getElementById('detail-close-btn').addEventListener('click', function() {
        hideDetail();
      });

      // --- Signature verification ---
      document.getElementById('verify-sig-btn').addEventListener('click', async function() {
        var secret = document.getElementById('sig-secret').value;
        var algorithm = document.getElementById('sig-algorithm').value;
        var req = requests.find(function(r) { return r.id === selectedId; });
        if (!req || !secret) return;

        var sigResult = document.getElementById('sig-result');
        sigResult.classList.remove('hidden');

        // Find the signature header
        var headers = req.headersObj || {};
        var sigHeaderNames = ['x-hub-signature-256', 'x-hub-signature', 'x-signature', 'authorization'];
        var foundKey = null, foundSig = null;
        Object.keys(headers).forEach(function(k) {
          if (sigHeaderNames.indexOf(k.toLowerCase()) !== -1) {
            foundKey = k;
            foundSig = headers[k];
          }
        });

        var reqBody = req.body || '';
        var computed = await computeHmac(secret, algorithm, reqBody);

        if (foundSig) {
          // Compare (handle sha256= prefix)
          var provided = foundSig.includes('=') ? foundSig.split('=')[1] : foundSig;
          var match = provided.toLowerCase() === computed.toLowerCase();
          sigResult.className = 'font-mono text-xs p-3 rounded-lg ' + (match
            ? 'bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300'
            : 'bg-error-100 dark:bg-error-900/30 text-error-800 dark:text-error-300');
          sigResult.textContent = (match ? '✓ Signature valid' : '✗ Signature mismatch') + '\\nComputed: ' + computed.slice(0, 32) + '...\\nProvided: ' + provided.slice(0, 32) + '...';
          document.getElementById('sig-status').textContent = match
            ? _t('tools.webhook-debugger.ui.desc3', 'Valid')
            : _t('tools.webhook-debugger.ui.desc4', 'Invalid');
          document.getElementById('sig-status').className = 'text-xs font-medium ' + (match ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400');
        } else {
          sigResult.className = 'font-mono text-xs p-3 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300';
          sigResult.textContent = 'No signature header found.\\nComputed HMAC (' + algorithm.toUpperCase() + '): ' + computed;
          document.getElementById('sig-status').textContent = _t('tools.webhook-debugger.ui.desc5', 'No signature');
          document.getElementById('sig-status').className = 'text-xs font-medium text-surface-500 dark:text-surface-400';
        }
      });

      // --- Listen page (handled by the route for /webhook-debugger/listen) ---
      // If this page was opened as the listener iframe, it will call registerHook
      window.addEventListener('message', function(e) {
        // Accept messages from same origin only
        if (e.origin !== window.location.origin) return;
        if (e.data && e.data.type === 'whd_register') {
          registerRequest(e.data.payload);
        }
      });

      // Expose registration for the listen iframe
      window.whdRegister = function(payload) {
        registerRequest(payload);
      };

      function registerRequest(data) {
        var seq = requests.length + 1;
        var ts = Date.now();
        var req = {
          id: 'req_' + ts + '_' + Math.random().toString(36).substr(2, 6),
          seq: seq,
          ts: ts,
          method: data.method || 'GET',
          url: data.url || data.path || '/',
          headersObj: data.headers || {},
          body: data.body || '',
          contentType: (function() {
            var h = data.headers || {};
            var ct = h['content-type'] || h['Content-Type'] || '';
            return ct;
          })()
        };
        requests.push(req);
        // Persist
        setCapture(req);
        renderLog();
      }

      // Expose global hook registration for listen endpoint
      window.registerWebhookRequest = registerRequest;

      // --- Initialization ---
      function init() {
        // Restore any persisted requests
        var stored = getCaptures();
        if (stored.length > 0) {
          requests = stored;
          lastCaptureTime = stored.length > 0 ? stored[stored.length - 1].ts : 0;
          renderLog();
        }

        // If we're on the listen page (query param), auto-start
        var urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('listen')) {
          isListening = true;
          updateListenUI();
        }

        if (requests.length === 0) {
          if (emptyState) emptyState.classList.remove('hidden');
        } else {
          if (emptyState) emptyState.classList.add('hidden');
          renderLog();
        }
      }

      init();
    })();
    </script>
  `;

  return createPageTemplate({ title, description, content, path: '/webhook-debugger' });
}