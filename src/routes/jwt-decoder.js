import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint, createEmptyState, getBtnLoadingScript } from '../utils/common-ui.js';
import { createRichEditorPane, getRichEditorStyles, getRichEditorScript } from '../utils/rich-editor.js';

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

        <!-- JWT Input via RichEditor -->
        <div class="mb-6">
          <label class="label"><span data-i18n="tools.jwt-decoder.ui.label3">JWT Token</span> ${infoHint('Paste header.payload.signature (Base64URL). Avoid sharing secrets when copying.')}</label>
          ${createRichEditorPane({ id: 'jwt-input', mode: 'textarea', rows: 5, placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' })}
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

         <!-- Empty State -->
         ${createEmptyState({ icon: '🔓', title: 'No token decoded', description: 'Paste a JWT token above and click Decode.', id: 'jwt-empty-state' })}

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
            ${createRichEditorPane({ id: 'header-content', mode: 'pre', ariaLabel: 'Decoded JWT header' })}
          </div>

           <!-- Payload -->
           <div class="bg-success-50 dark:bg-success-900/20 rounded-xl p-6 border border-success-200 dark:border-success-800">
             <div class="flex items-center justify-between mb-4">
               <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                 <span class="text-2xl">📦</span>
                 <span data-tooltip="Claims and data carried by the token">Payload</span>
               </h2>
               <button data-copy-part="payload" class="copy-part-btn btn btn-secondary text-xs py-1 px-2">
                 <span data-i18n="tools.jwt-decoder.ui.button2">Copy</span>
               </button>
             </div>
             ${createRichEditorPane({ id: 'payload-content', mode: 'pre', ariaLabel: 'Decoded JWT payload' })}

             <!-- Payload Analysis -->
             <div id="payload-analysis" class="mt-4 space-y-2"></div>
           </div>

           <!-- Signature -->
           <div class="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <span class="text-2xl">🔐</span>
                <span data-tooltip="Cryptographic signature to verify token integrity">Signature</span>
              </h2>
              <button data-copy-part="signature" class="copy-part-btn btn btn-secondary text-xs py-1 px-2">
                <span data-i18n="tools.jwt-decoder.ui.button2">Copy</span>
              </button>
            </div>
             <pre id="signature-content" class="bg-white dark:bg-surface-950 p-4 rounded-lg overflow-x-auto text-sm font-mono break-all border border-primary-100 dark:border-primary-900"></pre>
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
    <style>${getRichEditorStyles()}</style>
    ${getRichEditorScript()}
    ${getBtnLoadingScript()}
    <script>
      var jwtEditor = new RichEditor('jwt-input');
      jwtEditor.setHighlighter('jwt');
      var headerEditor = new RichEditor('header-content');
      headerEditor.setHighlighter('json');
      var payloadEditor = new RichEditor('payload-content');
      payloadEditor.setHighlighter('json');
      var decodedOutput = document.getElementById('decoded-output');
      var statusBadge = document.getElementById('status-badge');

      function base64UrlDecode(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        var pad = str.length % 4;
        if (pad) str += '='.repeat(4 - pad);
        try {
          var decoded = atob(str);
          var bytes = new Uint8Array(decoded.length);
          for (var i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
          return new TextDecoder('utf-8').decode(bytes);
        } catch (error) {
          throw new Error('Invalid Base64 encoding');
        }
      }

      function showStatus(type, text, detail) {
        var icon = document.getElementById('status-icon');
        var statusText = document.getElementById('status-text');
        var statusDetail = document.getElementById('status-detail');
        statusBadge.classList.remove('hidden');

         if (type === 'success') {
           statusBadge.className = 'mb-6 p-4 rounded-lg border-2 bg-success-50 dark:bg-success-900/20 border-success-300 dark:border-success-700 text-success-900 dark:text-success-300';
           icon.textContent = '✓';
         } else if (type === 'error') {
           statusBadge.className = 'mb-6 p-4 rounded-lg border-2 bg-error-50 dark:bg-error-900/20 border-error-300 dark:border-error-700 text-error-900 dark:text-error-300';
           icon.textContent = '✗';
         } else if (type === 'warning') {
           statusBadge.className = 'mb-6 p-4 rounded-lg border-2 bg-warning-50 dark:bg-warning-900/20 border-warning-300 dark:border-warning-700 text-warning-900 dark:text-warning-300';
           icon.textContent = '⚠';
         }

        statusText.textContent = text;
        statusDetail.textContent = detail;
      }

      function analyzePayload(payload) {
        var analysis = [];
        if (payload.exp) {
          var expDate = new Date(payload.exp * 1000);
          var isExpired = expDate < new Date();
          analysis.push({ label: 'Expiration', value: expDate.toLocaleString(), status: isExpired ? 'expired' : 'valid', icon: isExpired ? '⚠️' : '✓' });
        }
        if (payload.iat) {
          analysis.push({ label: 'Issued At', value: new Date(payload.iat * 1000).toLocaleString(), status: 'info', icon: '📅' });
        }
        if (payload.nbf) {
          var nbfDate = new Date(payload.nbf * 1000);
          var isValid = nbfDate <= new Date();
          analysis.push({ label: 'Not Before', value: nbfDate.toLocaleString(), status: isValid ? 'valid' : 'pending', icon: isValid ? '✓' : '⏳' });
        }
        if (payload.aud) {
          analysis.push({ label: 'Audience', value: Array.isArray(payload.aud) ? payload.aud.join(', ') : payload.aud, status: 'info', icon: '👥' });
        }
        if (payload.iss) {
          analysis.push({ label: 'Issuer', value: payload.iss, status: 'info', icon: '🏢' });
        }
        if (payload.sub) {
          analysis.push({ label: 'Subject', value: payload.sub, status: 'info', icon: '👤' });
        }
        return analysis;
      }

      function displayPayloadAnalysis(analysis) {
        var container = document.getElementById('payload-analysis');
        if (analysis.length === 0) { container.innerHTML = ''; return; }
        container.innerHTML = \`
          <div class="pt-4 border-t border-success-200 dark:border-success-700">
            <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100 mb-2" data-i18n="tools.jwt-decoder.ui.heading4">Claim Analysis</h3>
            <div class="space-y-2">
              \${analysis.map(function(item) { return \`
                <div class="flex items-center justify-between text-sm bg-white dark:bg-surface-950 p-2 rounded border border-success-200 dark:border-success-800">
                  <div class="flex items-center gap-2">
                    <span>\${item.icon}</span>
                    <span class="font-medium text-surface-700 dark:text-surface-300">\${item.label}:</span>
                  </div>
                  <span class="text-surface-900 dark:text-surface-100 font-mono text-xs">\${item.value}</span>
                </div>
              \`; }).join('')}
            </div>
          </div>
        \`;
      }

      function decodeJWT() {
        var token = jwtEditor.getValue().trim();
        if (!token) {
          showStatus(_t('tools.jwt-decoder.js.status0', 'error'), 'No Token Provided', 'Please paste a JWT token to decode');
          decodedOutput.classList.add('hidden');
          return;
        }

        try {
          var parts = token.split('.');
          if (parts.length !== 3) throw new Error('Invalid JWT format. JWT must have 3 parts separated by dots.');

          var header = JSON.parse(base64UrlDecode(parts[0]));
          var payload = JSON.parse(base64UrlDecode(parts[1]));
          var signature = parts[2];

          headerEditor.setValue(JSON.stringify(header, null, 2));
          payloadEditor.setValue(JSON.stringify(payload, null, 2));
          document.getElementById('signature-content').textContent = signature;

          displayPayloadAnalysis(analyzePayload(payload));

           var algorithm = header.alg || 'Unknown';
           showStatus(_t('tools.jwt-decoder.js.status1', 'success'), 'Token Decoded Successfully', \`Algorithm: \${algorithm}\`);

           document.getElementById('jwt-empty-state').classList.add('hidden');
           decodedOutput.classList.remove('hidden');
           decodedOutput.classList.add('animate-fade-in-up');

          window.decodedData = { header: header, payload: payload, signature: signature };
        } catch (error) {
          showStatus(_t('tools.jwt-decoder.js.status0', 'error'), 'Decoding Failed', error.message);
          decodedOutput.classList.add('hidden');
        }
      }

      document.addEventListener('click', function(e) {
        var copyBtn = e.target.closest('.copy-part-btn');
        if (copyBtn && window.decodedData) {
          var part = copyBtn.dataset.copyPart;
          var text = '';
          if (part === 'header') text = JSON.stringify(window.decodedData.header, null, 2);
          else if (part === 'payload') text = JSON.stringify(window.decodedData.payload, null, 2);
          else if (part === 'signature') text = window.decodedData.signature;

          if (window.copyToClipboard) {
             window.copyToClipboard(text, copyBtn);
          } else {
             navigator.clipboard.writeText(text).then(function() {
                var original = copyBtn.textContent;
                copyBtn.textContent = _t('tools.jwt-decoder.js.text2', 'Copied!');
                if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
                setTimeout(function() { copyBtn.textContent = original; }, 2000);
             });
          }
        }
      });

      document.getElementById('decode-btn').addEventListener('click', function() {
        window.btnLoading(this, decodeJWT);
      });

       document.getElementById('clear-btn').addEventListener('click', function() {
         jwtEditor.clear();
         decodedOutput.classList.add('hidden');
         decodedOutput.classList.remove('animate-fade-in-up');
         statusBadge.classList.add('hidden');
         document.getElementById('jwt-empty-state').classList.remove('hidden');
         headerEditor.clear();
         payloadEditor.clear();
         document.getElementById('signature-content').textContent = '';
         window.decodedData = null;
       });

      var decodeTimeout;
      document.getElementById('re-jwt-input').addEventListener('input', function() {
        clearTimeout(decodeTimeout);
        decodeTimeout = setTimeout(function() {
          if (jwtEditor.getValue().trim().length > 0) decodeJWT();
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
