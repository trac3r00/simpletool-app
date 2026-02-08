import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint, createEmptyState, getBtnLoadingScript } from '../utils/common-ui.js';
import { createRichEditorPane, getRichEditorStyles, getRichEditorScript } from '../utils/rich-editor.js';
import { createEducationalSection } from '../utils/content-ui.js';

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

        </div>

      </div>

      ${createEducationalSection([
        {
          title: 'What is JWT?',
          content: `
            <p>JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information between parties as a JSON object. This information can be verified and trusted because it is digitally signed. JWTs can be signed using a secret (with the HMAC algorithm) or a public/private key pair using RSA or ECDSA.</p>
            <p>Because of their compact size, JWTs are commonly used in authentication and information exchange scenarios, such as "Bearer" tokens in HTTP Authorization headers.</p>
          `
        },
        {
          title: 'How to Use This Tool',
          content: `
            <ol>
              <li><strong>Paste your token:</strong> Copy your encoded JWT (header.payload.signature) and paste it into the input field.</li>
              <li><strong>Automatic Decode:</strong> The tool will automatically detect the token and decode its components in real-time.</li>
              <li><strong>Inspect Header:</strong> Review the algorithm (alg) and token type (typ) in the Header section.</li>
              <li><strong>Analyze Payload:</strong> Examine the claims, such as expiration (exp), issuer (iss), and subject (sub) in the Payload section.</li>
              <li><strong>Verify Claims:</strong> Check the "Claim Analysis" box for human-readable dates and validation status.</li>
            </ol>
          `
        },
        {
          title: 'Common Use Cases',
          content: `
            <ul>
              <li><strong>Authentication:</strong> Inspecting ID tokens or access tokens from providers like Auth0, Firebase, or AWS Cognito.</li>
              <li><strong>Debugging:</strong> Troubleshooting why a token is being rejected by your backend (e.g., checking if it has expired).</li>
              <li><strong>Security Auditing:</strong> Verifying that sensitive data is not being accidentally exposed in the unencrypted payload.</li>
              <li><strong>Development:</strong> Quickly viewing the contents of a token during API development without writing custom code.</li>
            </ul>
          `
        },
        {
          title: 'Pro Tips',
          content: `
            <ul>
              <li><strong>JWT is not Encrypted:</strong> Remember that standard JWTs are only signed, not encrypted. Anyone with the token can read the payload. <strong>Never store passwords or private keys in a JWT.</strong></li>
              <li><strong>Check Expiration:</strong> Always verify the <code>exp</code> claim. If a token is expired, it should be rejected by your application.</li>
              <li><strong>Use HTTPS:</strong> Since JWTs are often used for authentication, they must always be transmitted over secure HTTPS connections to prevent interception.</li>
            </ul>
          `
        }
      ], 'jwt-decoder')}

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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'What is JWT?',
          content: '<p>JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information between parties as a JSON object. This information can be verified and trusted because it is digitally signed. JWTs can be signed using a secret (with the HMAC algorithm) or a public/private key pair using RSA or ECDSA.</p><p>Because of their compact size, JWTs are commonly used in authentication and information exchange scenarios, such as "Bearer" tokens in HTTP Authorization headers.</p>'
        },
        {
          title: 'Token Structure (header.payload.signature)',
          content: '<p>A JWT typically consists of three parts separated by dots (<code>.</code>):</p><ul><li><strong>Header:</strong> Usually consists of two parts: the type of the token (JWT) and the signing algorithm being used (e.g., HS256 or RS256).</li><li><strong>Payload:</strong> Contains the "claims." Claims are statements about an entity (typically, the user) and additional data. There are three types of claims: registered, public, and private claims.</li><li><strong>Signature:</strong> Created by taking the encoded header, the encoded payload, a secret, and the algorithm specified in the header, and signing that.</li></ul>'
        },
        {
          title: 'Security Considerations',
          content: '<p>While JWTs are signed to ensure integrity, they are typically NOT encrypted. This means that anyone who has the token can decode the header and payload to read the information inside. <strong>Never store sensitive information like passwords or private keys in a JWT payload.</strong></p><p>Additionally, always verify the <code>exp</code> (expiration) claim to prevent replay attacks, and ensure your server validates the signature using a strong, secret key or the correct public key before trusting the data in the payload.</p>'
        },
        {
          title: 'Pro Tips',
          content: '<ul><li>Use the <strong>"exp"</strong> claim to set a short expiration time for access tokens to minimize the impact of a stolen token.</li><li>Always use <strong>HTTPS</strong> to transmit JWTs to prevent interception via man-in-the-middle attacks.</li><li>If using asymmetric algorithms (like RS256), you can share your public key so other services can verify your tokens without being able to create them.</li><li>Check for the <strong>"nbf"</strong> (Not Before) claim if you want to issue a token that only becomes valid at a specific future time.</li></ul>'
        }
      ], 'jwt-decoder')}
    </div>
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
