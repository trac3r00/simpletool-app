/**
 * OAuth 2.0 / PKCE Flow Debugger
 * Generate PKCE challenges, visualize OAuth flows, and analyze security — all in-browser.
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, getCopyToClipboardScript } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleOAuthDebuggerRoutes(request, url) {
  const { pathname } = url;
  try {
    if (pathname === '/oauth-debugger' || pathname === '/oauth-debugger/') {
      if (request.method === 'GET') return renderOAuthDebuggerPage(resolveRequestLanguage(request, url));
    }
    return respondJSON({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('OAuth Debugger Route Error:', error);
    return respondJSON({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}

function renderOAuthDebuggerPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('oauth-debugger', currentLang);
  const title = translation?.name || 'OAuth 2.0 / PKCE Debugger';
  const description = translation?.desc || 'Generate PKCE challenges, visualize OAuth flows, and analyze security.';

  const toolHeader = createToolHeader(
    { emoji: '🔑' },
    title,
    description,
    [{ text: 'Privacy First', color: 'green', tooltip: 'All operations happen in your browser.' }],
    { toolId: 'oauth-debugger' }
  );

  const currentTool = TOOLS.find(t => t.id === 'oauth-debugger');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}

        <div class="space-y-10">

          <!-- Section 1: PKCE Generator -->
          <section>
            <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.oauth-debugger.ui.heading0">PKCE Generator</h2>
            <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-6 space-y-5">
              <p class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.oauth-debugger.ui.desc0">Click Generate to create a cryptographically random code_verifier and derive its SHA-256 code_challenge.</p>
              <button id="pkce-generate-btn" class="btn btn-primary" data-i18n="tools.oauth-debugger.ui.button0">Generate PKCE Pair</button>

              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.oauth-debugger.ui.label0">code_verifier <span class="normal-case font-normal">(43–128 URL-safe chars)</span></label>
                  <div class="flex gap-2">
                    <input id="pkce-verifier" readonly class="w-full p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100" placeholder="Click Generate..." data-i18n-placeholder="tools.oauth-debugger.ui.placeholder0" />
                    <button class="btn btn-secondary flex-shrink-0" onclick="copyToClipboard(document.getElementById('pkce-verifier').value, this)" data-i18n="tools.oauth-debugger.ui.button1">Copy</button>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.oauth-debugger.ui.label1">code_challenge <span class="normal-case font-normal">(SHA-256, base64url)</span></label>
                  <div class="flex gap-2">
                    <input id="pkce-challenge" readonly class="w-full p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100" placeholder="Derived after generation..." data-i18n-placeholder="tools.oauth-debugger.ui.placeholder1" />
                    <button class="btn btn-secondary flex-shrink-0" onclick="copyToClipboard(document.getElementById('pkce-challenge').value, this)" data-i18n="tools.oauth-debugger.ui.button2">Copy</button>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.oauth-debugger.ui.label2">code_challenge_method</label>
                  <input readonly value="S256" class="w-40 p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100" />
                </div>
              </div>
            </div>
          </section>

          <!-- Section 2: Flow Visualizer -->
          <section>
            <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.oauth-debugger.ui.heading1">Authorization URL Builder</h2>
            <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-6 space-y-6">

              <!-- Flow diagram -->
              <div class="overflow-x-auto">
                <div class="flex items-start gap-0 min-w-[600px] text-xs">
                  ${flowStep('1', 'Client', 'Build authorization URL with code_challenge', 'bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-800 dark:text-primary-200')}
                  ${flowArrow('GET /authorize?...')}
                  ${flowStep('2', 'Auth Server', 'Authenticate user, display consent screen', 'bg-surface-100 dark:bg-surface-800 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300')}
                  ${flowArrow('302 redirect + code')}
                  ${flowStep('3', 'Client', 'Receive auth code in redirect_uri', 'bg-surface-100 dark:bg-surface-800 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300')}
                  ${flowArrow('POST /token + code_verifier')}
                  ${flowStep('4', 'Auth Server', 'Verify code_verifier against stored challenge', 'bg-surface-100 dark:bg-surface-800 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300')}
                  ${flowArrow('access_token')}
                  ${flowStep('5', 'Client', 'Use access_token to call APIs', 'bg-success-100 dark:bg-success-900/30 border-success-300 dark:border-success-700 text-success-800 dark:text-success-200')}
                </div>
              </div>

              <!-- Config fields -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="flow-auth-endpoint" class="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.oauth-debugger.ui.label3">Authorization Endpoint</label>
                  <input id="flow-auth-endpoint" type="url" class="w-full p-3 font-mono text-sm bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100" placeholder="https://auth.example.com/oauth2/authorize" value="" data-i18n-placeholder="tools.oauth-debugger.ui.placeholder2" />
                </div>
                <div>
                  <label for="flow-client-id" class="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.oauth-debugger.ui.label4">client_id</label>
                  <input id="flow-client-id" type="text" class="w-full p-3 font-mono text-sm bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100" placeholder="your-client-id" data-i18n-placeholder="tools.oauth-debugger.ui.placeholder3" />
                </div>
                <div>
                  <label for="flow-redirect-uri" class="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.oauth-debugger.ui.label5">redirect_uri</label>
                  <input id="flow-redirect-uri" type="url" class="w-full p-3 font-mono text-sm bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100" placeholder="https://yourapp.example.com/callback" data-i18n-placeholder="tools.oauth-debugger.ui.placeholder4" />
                </div>
                <div>
                  <label for="flow-scope" class="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.oauth-debugger.ui.label6">scope</label>
                  <input id="flow-scope" type="text" class="w-full p-3 font-mono text-sm bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100" placeholder="openid profile email" value="openid profile email" data-i18n-placeholder="tools.oauth-debugger.ui.placeholder5" />
                </div>
                <div>
                  <label for="flow-state" class="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.oauth-debugger.ui.label7">state <span class="normal-case font-normal">(CSRF token)</span></label>
                  <div class="flex gap-2">
                    <input id="flow-state" type="text" class="w-full p-3 font-mono text-sm bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100" placeholder="random-state-value" data-i18n-placeholder="tools.oauth-debugger.ui.placeholder6" />
                    <button id="flow-gen-state" class="btn btn-ghost flex-shrink-0 text-xs" data-i18n="tools.oauth-debugger.ui.button3">Random</button>
                  </div>
                </div>
                <div class="flex items-center gap-3 pt-5">
                  <input id="flow-use-pkce" type="checkbox" class="w-4 h-4 rounded border-surface-300 accent-primary-600" checked />
                  <label for="flow-use-pkce" class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.oauth-debugger.ui.label8">Include PKCE parameters (use generated values above)</label>
                </div>
              </div>

              <div class="flex flex-wrap gap-3">
                <button id="flow-build-btn" class="btn btn-primary" data-i18n="tools.oauth-debugger.ui.button4">Build Authorization URL</button>
              </div>

              <div id="flow-url-wrap" class="hidden space-y-2">
                <label class="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.oauth-debugger.ui.label9">Authorization URL</label>
                <div class="flex gap-2">
                  <textarea id="flow-url-output" readonly rows="4" class="w-full p-3 font-mono text-sm bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 resize-none"></textarea>
                  <button class="btn btn-secondary flex-shrink-0 self-start" onclick="copyToClipboard(document.getElementById('flow-url-output').value, this)" data-i18n="tools.oauth-debugger.ui.button5">Copy</button>
                </div>
              </div>
            </div>
          </section>

          <!-- Section 3: Security Analyzer -->
          <section>
            <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.oauth-debugger.ui.heading2">Security Analyzer</h2>
            <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-6 space-y-5">
              <p class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.oauth-debugger.ui.desc1">Describe your OAuth configuration and get security recommendations.</p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="sec-response-type" class="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.oauth-debugger.ui.label10">response_type</label>
                  <select id="sec-response-type" class="w-full p-3 font-mono text-sm bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100">
                    <option value="code" data-i18n="tools.oauth-debugger.ui.option19">code (Authorization Code)</option>
                    <option value="token" data-i18n="tools.oauth-debugger.ui.option20">token (Implicit — deprecated)</option>
                    <option value="id_token" data-i18n="tools.oauth-debugger.ui.option21">id_token (Implicit OIDC — deprecated)</option>
                    <option value="code id_token" data-i18n="tools.oauth-debugger.ui.option22">code id_token (Hybrid)</option>
                  </select>
                </div>
                <div>
                  <label for="sec-grant-type" class="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.oauth-debugger.ui.label11">grant_type (token endpoint)</label>
                  <select id="sec-grant-type" class="w-full p-3 font-mono text-sm bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100">
                    <option value="authorization_code" data-i18n="tools.oauth-debugger.ui.option23">authorization_code</option>
                    <option value="client_credentials" data-i18n="tools.oauth-debugger.ui.option24">client_credentials</option>
                    <option value="refresh_token" data-i18n="tools.oauth-debugger.ui.option25">refresh_token</option>
                    <option value="password" data-i18n="tools.oauth-debugger.ui.option26">password (deprecated)</option>
                  </select>
                </div>
                <div>
                  <label for="sec-redirect-uri" class="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.oauth-debugger.ui.label12">redirect_uri</label>
                  <input id="sec-redirect-uri" type="text" class="w-full p-3 font-mono text-sm bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100" placeholder="https://yourapp.example.com/callback" data-i18n-placeholder="tools.oauth-debugger.ui.placeholder7" />
                </div>
                <div>
                  <label for="sec-scope" class="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.oauth-debugger.ui.label13">scope</label>
                  <input id="sec-scope" type="text" class="w-full p-3 font-mono text-sm bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100" placeholder="openid profile email" data-i18n-placeholder="tools.oauth-debugger.ui.placeholder8" />
                </div>
                <div class="flex flex-col gap-3 sm:col-span-2">
                  <label class="inline-flex items-center gap-2 cursor-pointer">
                    <input id="sec-has-pkce" type="checkbox" class="w-4 h-4 rounded border-surface-300 accent-primary-600" />
                    <span class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.oauth-debugger.ui.label14">PKCE is used (code_challenge + code_verifier)</span>
                  </label>
                  <label class="inline-flex items-center gap-2 cursor-pointer">
                    <input id="sec-has-state" type="checkbox" class="w-4 h-4 rounded border-surface-300 accent-primary-600" />
                    <span class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.oauth-debugger.ui.label15">state parameter is included</span>
                  </label>
                </div>
              </div>

              <button id="sec-analyze-btn" class="btn btn-primary" data-i18n="tools.oauth-debugger.ui.button6">Analyze Configuration</button>

              <div id="sec-results" class="hidden space-y-3">
                <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wide" data-i18n="tools.oauth-debugger.ui.heading3">Security Findings</h3>
                <div id="sec-findings"></div>
              </div>
            </div>
          </section>

        </div>
      </div>

      <div class="mt-8">
        ${createEducationalSection([
          {
            title: 'What is PKCE and Why Does It Matter?',
            content: `
              <p>Proof Key for Code Exchange (PKCE, RFC 7636) was originally designed for mobile and native apps that cannot securely store a client secret. It works by having the client generate a random <code>code_verifier</code>, derive a <code>code_challenge</code> from it (SHA-256 + base64url), and send the challenge with the authorization request. When exchanging the authorization code for tokens, the client sends the original <code>code_verifier</code>. The authorization server verifies it matches the earlier challenge — proving the token request came from the same client that started the flow.</p>
              <p>Even for confidential clients (server-side apps with a client secret), PKCE is now recommended by OAuth 2.1 as a defense against authorization code interception attacks.</p>
            `
          },
          {
            title: 'Why Is the Implicit Flow Deprecated?',
            content: `
              <p>The implicit flow (<code>response_type=token</code>) was designed as a shortcut for single-page apps, returning the access token directly in the URL fragment. This creates serious problems: tokens in URLs appear in browser history, server logs, and referrer headers, and the flow is vulnerable to token injection attacks. OAuth 2.0 Security Best Current Practice (RFC 9700) and OAuth 2.1 explicitly remove the implicit flow in favor of Authorization Code + PKCE, which SPAs can use safely without a client secret.</p>
            `
          },
          {
            title: 'Key OAuth 2.1 Changes',
            content: `
              <ul>
                <li><strong>PKCE required</strong> for all Authorization Code flows, including confidential clients.</li>
                <li><strong>Implicit flow removed</strong> — use Authorization Code + PKCE instead.</li>
                <li><strong>Resource Owner Password Credentials (ROPC) removed</strong> — the <code>password</code> grant type is deprecated.</li>
                <li><strong>Refresh token rotation required</strong> for public clients — a new refresh token must be issued with each use.</li>
                <li><strong>Redirect URI exact matching required</strong> — no pattern matching or wildcards.</li>
              </ul>
            `
          },
          {
            title: 'Authorization Code Flow Step by Step',
            content: `
              <ol>
                <li><strong>Generate PKCE pair:</strong> Create a random <code>code_verifier</code> and compute <code>code_challenge = BASE64URL(SHA256(code_verifier))</code>.</li>
                <li><strong>Redirect to authorization endpoint:</strong> Include <code>response_type=code</code>, <code>client_id</code>, <code>redirect_uri</code>, <code>scope</code>, <code>state</code>, <code>code_challenge</code>, and <code>code_challenge_method=S256</code>.</li>
                <li><strong>User authenticates</strong> at the authorization server and grants consent.</li>
                <li><strong>Receive authorization code</strong> at your <code>redirect_uri</code> alongside the echoed <code>state</code> — verify <code>state</code> matches what you sent.</li>
                <li><strong>Exchange code for tokens:</strong> POST to the token endpoint with <code>grant_type=authorization_code</code>, <code>code</code>, <code>redirect_uri</code>, <code>client_id</code>, and <code>code_verifier</code>.</li>
                <li><strong>Receive access token</strong> (and optionally <code>id_token</code> and <code>refresh_token</code>) and use them to call APIs.</li>
              </ol>
            `
          }
        ], 'oauth-debugger')}
      </div>

      ${createRelatedToolsSection(relatedToolsData)}
    </main>
  `;

  const scripts = `
    ${getCopyToClipboardScript()}
    <script>
      (function() {
        // ── PKCE Generator ──────────────────────────────────────────────
        function generateVerifier() {
          var arr = new Uint8Array(48);
          crypto.getRandomValues(arr);
          return base64url(arr).slice(0, 96); // 96 chars — well within 43-128 range
        }

        function base64url(buffer) {
          var bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
          var bin = '';
          for (var i = 0; i < bytes.byteLength; i++) {
            bin += String.fromCharCode(bytes[i]);
          }
          return btoa(bin).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
        }

        async function deriveChallenge(verifier) {
          var encoded = new TextEncoder().encode(verifier);
          var digest = await crypto.subtle.digest('SHA-256', encoded);
          return base64url(new Uint8Array(digest));
        }

        document.getElementById('pkce-generate-btn').addEventListener('click', async function() {
          var verifier = generateVerifier();
          var challenge = await deriveChallenge(verifier);
          document.getElementById('pkce-verifier').value = verifier;
          document.getElementById('pkce-challenge').value = challenge;
        });

        // ── Flow Visualizer ─────────────────────────────────────────────
        document.getElementById('flow-gen-state').addEventListener('click', function() {
          var arr = new Uint8Array(16);
          crypto.getRandomValues(arr);
          document.getElementById('flow-state').value = base64url(arr);
        });

        document.getElementById('flow-build-btn').addEventListener('click', function() {
          var endpoint = document.getElementById('flow-auth-endpoint').value.trim();
          var clientId = document.getElementById('flow-client-id').value.trim();
          var redirectUri = document.getElementById('flow-redirect-uri').value.trim();
          var scope = document.getElementById('flow-scope').value.trim();
          var state = document.getElementById('flow-state').value.trim();
          var usePkce = document.getElementById('flow-use-pkce').checked;

          if (!endpoint || !clientId) {
            if (window.Toast) window.Toast.error('Authorization endpoint and client_id are required.');
            return;
          }

          try {
            var u = new URL(endpoint);
            u.searchParams.set('response_type', 'code');
            u.searchParams.set('client_id', clientId);
            if (redirectUri) u.searchParams.set('redirect_uri', redirectUri);
            if (scope) u.searchParams.set('scope', scope);
            if (state) u.searchParams.set('state', state);

            if (usePkce) {
              var verifier = document.getElementById('pkce-verifier').value;
              var challenge = document.getElementById('pkce-challenge').value;
              if (verifier && challenge) {
                u.searchParams.set('code_challenge', challenge);
                u.searchParams.set('code_challenge_method', 'S256');
              } else {
                if (window.Toast) window.Toast.error('Generate a PKCE pair first using the PKCE Generator section.');
                return;
              }
            }

            document.getElementById('flow-url-output').value = u.toString();
            document.getElementById('flow-url-wrap').classList.remove('hidden');
          } catch (e) {
            if (window.Toast) window.Toast.error('Invalid authorization endpoint URL.');
          }
        });

        // ── Security Analyzer ───────────────────────────────────────────
        document.getElementById('sec-analyze-btn').addEventListener('click', function() {
          var responseType = document.getElementById('sec-response-type').value;
          var grantType = document.getElementById('sec-grant-type').value;
          var redirectUri = document.getElementById('sec-redirect-uri').value.trim();
          var scope = document.getElementById('sec-scope').value.trim();
          var hasPkce = document.getElementById('sec-has-pkce').checked;
          var hasState = document.getElementById('sec-has-state').checked;

          var findings = [];

          // Critical: implicit flow
          if (responseType === 'token' || responseType === 'id_token') {
            findings.push({ severity: 'critical', text: 'Implicit flow is deprecated (OAuth 2.1). Use Authorization Code + PKCE instead (RFC 9700).' });
          }

          // Critical: no PKCE on authorization_code flow
          if (responseType === 'code' && !hasPkce) {
            findings.push({ severity: 'critical', text: 'PKCE is required for public clients and recommended for all clients (RFC 7636, OAuth 2.1). Add code_challenge and code_verifier.' });
          }

          // Critical: password grant
          if (grantType === 'password') {
            findings.push({ severity: 'critical', text: 'Resource Owner Password Credentials (password grant) is deprecated in OAuth 2.1. Migrate to Authorization Code + PKCE.' });
          }

          // Warning: HTTP redirect_uri
          if (redirectUri && redirectUri.startsWith('http:') && !redirectUri.startsWith('http://localhost') && !redirectUri.startsWith('http://127.')) {
            findings.push({ severity: 'warning', text: 'redirect_uri uses HTTP. Use HTTPS for all non-loopback redirect URIs to prevent token interception.' });
          }

          // Warning: no state
          if (!hasState) {
            findings.push({ severity: 'warning', text: 'No state parameter. The state parameter is strongly recommended for CSRF protection (RFC 6749 §10.12).' });
          }

          // Warning: wildcard or localhost in redirect_uri for non-dev
          if (redirectUri && (redirectUri.includes('*') || redirectUri.includes('localhost')) && !redirectUri.startsWith('http://localhost') && !redirectUri.startsWith('http://127.')) {
            findings.push({ severity: 'warning', text: 'Wildcard redirect URIs are prohibited in OAuth 2.1. Use exact URI matching.' });
          }

          // Info: OpenID Connect detected
          if (scope && scope.includes('openid')) {
            findings.push({ severity: 'info', text: 'OpenID Connect flow detected (scope includes "openid"). Validate the id_token signature and claims (iss, aud, exp, nonce).' });
          }

          // Info: client_credentials note
          if (grantType === 'client_credentials') {
            findings.push({ severity: 'info', text: 'client_credentials grant is for machine-to-machine flows. No user is involved; store client_secret securely and never expose it client-side.' });
          }

          if (findings.length === 0) {
            findings.push({ severity: 'info', text: 'No issues detected. Configuration looks good based on the provided inputs.' });
          }

          var findingsEl = document.getElementById('sec-findings');
          findingsEl.innerHTML = '';
          findings.forEach(function(f) {
            var div = document.createElement('div');
            var classes = 'rounded-lg border p-4 text-sm ';
            var label = '';
            if (f.severity === 'critical') {
              classes += 'bg-error-50 dark:bg-error-900/20 border-error-300 dark:border-error-700 text-error-800 dark:text-error-200';
              label = '<span class="font-bold uppercase tracking-wide mr-2" data-i18n="tools.oauth-debugger.ui.stat31">Critical:</span>';
            } else if (f.severity === 'warning') {
              classes += 'bg-warning-50 dark:bg-warning-900/20 border-warning-300 dark:border-warning-700 text-warning-800 dark:text-warning-200';
              label = '<span class="font-bold uppercase tracking-wide mr-2" data-i18n="tools.oauth-debugger.ui.stat32">Warning:</span>';
            } else {
              classes += 'bg-info-50 dark:bg-info-900/20 border-info-300 dark:border-info-700 text-info-800 dark:text-info-200';
              label = '<span class="font-bold uppercase tracking-wide mr-2" data-i18n="tools.oauth-debugger.ui.stat33">Info:</span>';
            }
            div.className = classes;
            div.innerHTML = label + f.text;
            findingsEl.appendChild(div);
          });

          document.getElementById('sec-results').classList.remove('hidden');
        });
      })();
    </script>
  `;

  return respondHTML(createPageTemplate({
    title,
    description,
    lang: currentLang,
    path: '/oauth-debugger',
    content,
    scripts
  }));
}

function flowStep(num, actor, desc, colorClasses) {
  return `
    <div class="flex flex-col items-center gap-1 w-36">
      <div class="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">${num}</div>
      <div class="border rounded-lg p-3 w-full text-center ${colorClasses}">
        <div class="font-semibold text-xs mb-1">${actor}</div>
        <div class="text-xs leading-snug">${desc}</div>
      </div>
    </div>
  `;
}

function flowArrow(label) {
  return `
    <div class="flex flex-col items-center justify-center gap-1 px-1 pt-8">
      <div class="text-xs text-surface-500 dark:text-surface-400 whitespace-nowrap text-center max-w-[80px] leading-snug">${label}</div>
      <div class="text-surface-400 dark:text-surface-500 text-base">→</div>
    </div>
  `;
}
