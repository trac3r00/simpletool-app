/**
 * JWT Decoder Tool - Decode and validate JWT tokens
 * All processing happens client-side for privacy
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint } from '../utils/common-ui.js';

export async function handleJWTDecoderRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === '/jwt-decoder' || pathname === '/jwt-decoder/') {
      if (method === 'GET') {
        return respondHTML(renderJWTDecoderPage());
      }
    }

    return respondJSON({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('JWT Decoder Route Error:', error);
    return respondJSON(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function renderJWTDecoderPage() {
  const toolHeader = createToolHeader(
    { emoji: '🔓' },
    'JWT Inspector',
    'Decode and validate JSON Web Tokens with real-time analysis',
    [{ text: 'Privacy First', color: 'indigo', tooltip: 'All processing happens in your browser — no data is sent to any server.' }],
    { toolId: 'jwt-decoder' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">

        ${toolHeader}

        <!-- Status Badge -->
        <div id="status-badge" role="status" class="mb-6 hidden">
          <div class="p-4 rounded-lg border-2 transition-all">
            <div class="flex items-center gap-3">
              <div id="status-icon" class="text-2xl"></div>
              <div class="flex-1">
                <div id="status-text" class="font-semibold"></div>
                <div id="status-detail" class="text-sm opacity-75"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- JWT Input -->
        <div class="mb-6">
          <label class="label"><span data-i18n="tools.jwt-decoder.ui.label3">JWT Token</span> ${infoHint('Paste header.payload.signature (Base64URL). Avoid sharing secrets when copying.')}</label>
          <textarea
            id="jwt-input"
            rows="6"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
            class="input font-mono resize-y"
            data-tooltip="Paste a JWT — three Base64URL segments separated by dots"
          ></textarea>
        </div>

        <!-- Action Buttons -->
        <div class="mb-8 flex gap-3">
          <button id="decode-btn" class="btn btn-primary w-full py-3 text-lg">
            <span data-i18n="tools.jwt-decoder.ui.button0">🔍 Decode Token</span>
          </button>
          <button id="clear-btn" class="btn btn-ghost px-6">
            <span data-i18n="tools.jwt-decoder.ui.button1">🗑️ Clear</span>
          </button>
        </div>

        <!-- Decoded Output -->
        <div id="decoded-output" class="hidden space-y-6">
          <!-- Header -->
          <div class="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <span class="text-2xl">📋</span>
                <span data-tooltip="Algorithm and token type metadata">Header</span>
              </h2>
              <button data-copy-part="header" class="copy-part-btn btn btn-secondary text-xs py-1 px-2">
                <span data-i18n="tools.jwt-decoder.ui.button2">Copy</span>
              </button>
            </div>
            <pre id="header-content" class="bg-white dark:bg-surface-950 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-primary-100 dark:border-primary-900"></pre>
          </div>

          <!-- Payload -->
          <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <span class="text-2xl">📦</span>
                <span data-tooltip="Claims and data carried by the token">Payload</span>
              </h2>
              <button data-copy-part="payload" class="copy-part-btn btn btn-secondary text-xs py-1 px-2">
                <span data-i18n="tools.jwt-decoder.ui.button2">Copy</span>
              </button>
            </div>
            <pre id="payload-content" class="bg-white dark:bg-surface-950 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-green-100 dark:border-green-900"></pre>

            <!-- Payload Analysis -->
            <div id="payload-analysis" class="mt-4 space-y-2"></div>
          </div>

          <!-- Signature -->
          <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <span class="text-2xl">🔐</span>
                <span data-tooltip="Cryptographic signature to verify token integrity">Signature</span>
              </h2>
              <button data-copy-part="signature" class="copy-part-btn btn btn-secondary text-xs py-1 px-2">
                <span data-i18n="tools.jwt-decoder.ui.button2">Copy</span>
              </button>
            </div>
            <pre id="signature-content" class="bg-white dark:bg-surface-950 p-4 rounded-lg overflow-x-auto text-sm font-mono break-all border border-purple-100 dark:border-purple-900"></pre>
            <p class="mt-2 text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.jwt-decoder.ui.desc5">
              ⚠️ Signature verification requires the secret key (not available client-side)
            </p>
          </div>
        </div>

        <!-- Info Section -->
        <div class="mt-8 p-6 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800">
          <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2">
            <span class="material-symbols-rounded">info</span>
            About JWT
          </h2>
          <p class="text-sm text-surface-700 dark:text-surface-300 mb-2" data-i18n="tools.jwt-decoder.ui.desc6">
            JSON Web Tokens (JWT) are a compact, URL-safe means of representing claims to be transferred between two parties.
          </p>
          <ul class="text-sm text-surface-700 dark:text-surface-300 space-y-1 ml-6 list-disc">
            <li><strong>Header:</strong> Contains the token type and hashing algorithm</li>
            <li><strong>Payload:</strong> Contains the claims (user data and metadata)</li>
            <li><strong>Signature:</strong> Ensures the token hasn't been tampered with</li>
          </ul>
          <p class="mt-3 text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.jwt-decoder.ui.desc7">
            🔒 All decoding happens in your browser. Your tokens are never sent to any server.
          </p>
        </div>

      </div>

      ${createCheatsheet('jwt-decoder', 'JWT Quick Reference', [
        { heading: 'Structure', content: '<p><code>header.payload.signature</code> — each part is Base64URL-encoded</p>' },
        { heading: 'Common Claims', content: `
          <table>
            <tr><th>Claim</th><th>Name</th><th>Description</th></tr>
            <tr><td><code>iss</code></td><td>Issuer</td><td>Who created the token</td></tr>
            <tr><td><code>sub</code></td><td>Subject</td><td>Who the token is about</td></tr>
            <tr><td><code>aud</code></td><td>Audience</td><td>Intended recipient</td></tr>
            <tr><td><code>exp</code></td><td>Expiration</td><td>Unix timestamp when token expires</td></tr>
            <tr><td><code>iat</code></td><td>Issued At</td><td>Unix timestamp when token was created</td></tr>
            <tr><td><code>nbf</code></td><td>Not Before</td><td>Token not valid before this time</td></tr>
            <tr><td><code>jti</code></td><td>JWT ID</td><td>Unique token identifier</td></tr>
          </table>` },
        { heading: 'Algorithms', content: `
          <table>
            <tr><th>Algorithm</th><th>Type</th><th>Notes</th></tr>
            <tr><td><code>HS256</code></td><td>Symmetric</td><td>HMAC + SHA-256, shared secret</td></tr>
            <tr><td><code>RS256</code></td><td>Asymmetric</td><td>RSA + SHA-256, public/private key pair</td></tr>
            <tr><td><code>ES256</code></td><td>Asymmetric</td><td>ECDSA + P-256, smaller keys, faster</td></tr>
          </table>` }
      ])}
    </main>
  `;

  const script = `
    <style>
      .json-key { color: #0284c7; }
      .dark .json-key { color: #38bdf8; }
      .json-string { color: #16a34a; }
      .dark .json-string { color: #4ade80; }
      .json-number { color: #ea580c; }
      .dark .json-number { color: #fb923c; }
      .json-boolean { color: #9333ea; }
      .dark .json-boolean { color: #c084fc; }
      .json-null { color: #71717a; }
      .dark .json-null { color: #a1a1aa; }
    </style>
    <script>
      const jwtInput = document.getElementById('jwt-input');
      const decodedOutput = document.getElementById('decoded-output');
      const statusBadge = document.getElementById('status-badge');

      // Base64 URL decode
      function base64UrlDecode(str) {
        // Replace URL-safe characters
        str = str.replace(/-/g, '+').replace(/_/g, '/');

        // Add padding if needed
        const pad = str.length % 4;
        if (pad) {
          str += '='.repeat(4 - pad);
        }

        try {
          // Decode base64
          const decoded = atob(str);

          // Convert to UTF-8
          const bytes = new Uint8Array(decoded.length);
          for (let i = 0; i < decoded.length; i++) {
            bytes[i] = decoded.charCodeAt(i);
          }

          const textDecoder = new TextDecoder('utf-8');
          return textDecoder.decode(bytes);
        } catch (error) {
          throw new Error('Invalid Base64 encoding');
        }
      }

      // Syntax highlight JSON
      function syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
          let cls = 'json-number';
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'json-key';
            } else {
              cls = 'json-string';
            }
          } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
          } else if (/null/.test(match)) {
            cls = 'json-null';
          }
          return '<span class="' + cls + '">' + match + '</span>';
        });
      }

      // Show status
      function showStatus(type, text, detail) {
        const badge = statusBadge;
        const icon = document.getElementById('status-icon');
        const statusText = document.getElementById('status-text');
        const statusDetail = document.getElementById('status-detail');

        badge.classList.remove('hidden');

        if (type === 'success') {
          badge.className = 'mb-6 p-4 rounded-lg border-2 bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-900 dark:text-green-300';
          icon.textContent = '✓';
        } else if (type === 'error') {
          badge.className = 'mb-6 p-4 rounded-lg border-2 bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-900 dark:text-red-300';
          icon.textContent = '✗';
        } else if (type === 'warning') {
          badge.className = 'mb-6 p-4 rounded-lg border-2 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-300';
          icon.textContent = '⚠';
        }

        statusText.textContent = text;
        statusDetail.textContent = detail;
      }

      // Analyze payload for common claims
      function analyzePayload(payload) {
        const analysis = [];

        // Check expiration
        if (payload.exp) {
          const expDate = new Date(payload.exp * 1000);
          const now = new Date();
          const isExpired = expDate < now;

          analysis.push({
            label: 'Expiration',
            value: expDate.toLocaleString(),
            status: isExpired ? 'expired' : 'valid',
            icon: isExpired ? '⚠️' : '✓'
          });
        }

        // Check issued at
        if (payload.iat) {
          const iatDate = new Date(payload.iat * 1000);
          analysis.push({
            label: 'Issued At',
            value: iatDate.toLocaleString(),
            status: 'info',
            icon: '📅'
          });
        }

        // Check not before
        if (payload.nbf) {
          const nbfDate = new Date(payload.nbf * 1000);
          const now = new Date();
          const isValid = nbfDate <= now;

          analysis.push({
            label: 'Not Before',
            value: nbfDate.toLocaleString(),
            status: isValid ? 'valid' : 'pending',
            icon: isValid ? '✓' : '⏳'
          });
        }

        // Check audience
        if (payload.aud) {
          analysis.push({
            label: 'Audience',
            value: Array.isArray(payload.aud) ? payload.aud.join(', ') : payload.aud,
            status: 'info',
            icon: '👥'
          });
        }

        // Check issuer
        if (payload.iss) {
          analysis.push({
            label: 'Issuer',
            value: payload.iss,
            status: 'info',
            icon: '🏢'
          });
        }

        // Check subject
        if (payload.sub) {
          analysis.push({
            label: 'Subject',
            value: payload.sub,
            status: 'info',
            icon: '👤'
          });
        }

        return analysis;
      }

      // Display payload analysis
      function displayPayloadAnalysis(analysis) {
        const container = document.getElementById('payload-analysis');

        if (analysis.length === 0) {
          container.innerHTML = '';
          return;
        }

        container.innerHTML = \`
          <div class="pt-4 border-t border-green-200 dark:border-green-700">
            <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100 mb-2" data-i18n="tools.jwt-decoder.ui.heading4">Claim Analysis</h3>
            <div class="space-y-2">
              \${analysis.map(item => \`
                <div class="flex items-center justify-between text-sm bg-white dark:bg-surface-950 p-2 rounded border border-green-200 dark:border-green-800">
                  <div class="flex items-center gap-2">
                    <span>\${item.icon}</span>
                    <span class="font-medium text-surface-700 dark:text-surface-300">\${item.label}:</span>
                  </div>
                  <span class="text-surface-900 dark:text-surface-100 font-mono text-xs">\${item.value}</span>
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
      }

      // Decode JWT
      function decodeJWT() {
        const token = jwtInput.value.trim();

        if (!token) {
          showStatus(_t('tools.jwt-decoder.js.status0', 'error'), 'No Token Provided', 'Please paste a JWT token to decode');
          decodedOutput.classList.add('hidden');
          return;
        }

        try {
          // Split JWT into parts
          const parts = token.split('.');

          if (parts.length !== 3) {
            throw new Error('Invalid JWT format. JWT must have 3 parts separated by dots.');
          }

          // Decode header
          const headerDecoded = base64UrlDecode(parts[0]);
          const header = JSON.parse(headerDecoded);

          // Decode payload
          const payloadDecoded = base64UrlDecode(parts[1]);
          const payload = JSON.parse(payloadDecoded);

          // Signature (keep as-is)
          const signature = parts[2];

          // Display decoded parts
          document.getElementById('header-content').innerHTML = syntaxHighlight(JSON.stringify(header, null, 2));
          document.getElementById('payload-content').innerHTML = syntaxHighlight(JSON.stringify(payload, null, 2));
          document.getElementById('signature-content').textContent = signature;

          // Analyze payload
          const analysis = analyzePayload(payload);
          displayPayloadAnalysis(analysis);

          // Show success status
          const algorithm = header.alg || 'Unknown';
          showStatus(_t('tools.jwt-decoder.js.status1', 'success'), 'Token Decoded Successfully', \`Algorithm: \${algorithm}\`);

          // Show output
          decodedOutput.classList.remove('hidden');

          // Store decoded data for copy
          window.decodedData = { header, payload, signature };

        } catch (error) {
          showStatus(_t('tools.jwt-decoder.js.status0', 'error'), 'Decoding Failed', error.message);
          decodedOutput.classList.add('hidden');
        }
      }

      // Event delegation for copy buttons
      document.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-part-btn');
        if (copyBtn && window.decodedData) {
          const part = copyBtn.dataset.copyPart;
          let text = '';
          if (part === 'header') {
            text = JSON.stringify(window.decodedData.header, null, 2);
          } else if (part === 'payload') {
            text = JSON.stringify(window.decodedData.payload, null, 2);
          } else if (part === 'signature') {
            text = window.decodedData.signature;
          }

          if (window.copyToClipboard) {
             window.copyToClipboard(text, copyBtn);
          } else {
             navigator.clipboard.writeText(text).then(() => {
                const original = copyBtn.textContent;
                copyBtn.textContent = _t('tools.jwt-decoder.js.text2', 'Copied!');
                setTimeout(() => copyBtn.textContent = original, 2000);
             });
          }
        }
      });

      // Event listeners
      document.getElementById('decode-btn').addEventListener('click', decodeJWT);

      document.getElementById('clear-btn').addEventListener('click', () => {
        jwtInput.value = '';
        decodedOutput.classList.add('hidden');
        statusBadge.classList.add('hidden');
        window.decodedData = null;
      });

      // Real-time decoding on input (debounced)
      let decodeTimeout;
      jwtInput.addEventListener('input', () => {
        clearTimeout(decodeTimeout);
        decodeTimeout = setTimeout(() => {
          if (jwtInput.value.trim().length > 0) {
            decodeJWT();
          }
        }, 500);
      });
    </script>
  `;

  return createPageTemplate({
    title: 'JWT Inspector',
    description: 'Decode and validate JSON Web Tokens with real-time analysis.',
    path: '/jwt-decoder',
    content,
    scripts: script
  });
}
