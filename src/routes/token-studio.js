/**
 * Token Cryptography Suite - JWT Inspector + JWK/JWKS Studio unified tool
 * All cryptographic operations happen client-side using Web Crypto API
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, getCopyToClipboardScript } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';

export async function handleTokenStudioRoutes(request, url) {
  const { pathname } = url;

  try {
    if (pathname === '/token-studio' || pathname === '/token-studio/') {
      if (request.method === 'GET') return renderTokenStudioPage();
    }

    return respondJSON({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Token Studio Route Error:', error);
    return respondJSON(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function renderTokenStudioPage() {
  const toolHeader = createToolHeader(
    { emoji: '🔐' },
    'Token Cryptography Suite',
    'Inspect, generate, and manage JWT tokens and cryptographic keys',
    [{ text: 'Privacy First', color: 'green', tooltip: 'All cryptographic operations happen in your browser.' }],
    { toolId: 'token-studio' }
  );

  const currentTool = TOOLS.find(t => t.id === 'token-studio');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">

        ${toolHeader}

        <!-- Tabs -->
        <div class="border-b border-surface-200 dark:border-surface-700 mb-8">
          <nav class="flex flex-wrap gap-2" aria-label="Token studio modes" role="tablist">
            <button id="tab-trigger-inspect" class="tab-button active px-4 py-2 border-b-2 border-primary-600 font-medium text-sm text-primary-600 dark:text-primary-400 transition-colors" data-tab="inspect" role="tab" aria-controls="tab-inspect" aria-selected="true" tabindex="0">
              <span data-i18n="tools.token-studio.ui.tabInspect">🔍 Inspect Token</span>
            </button>
            <button id="tab-trigger-generate" class="tab-button px-4 py-2 border-b-2 border-transparent font-medium text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 transition-colors" data-tab="generate" role="tab" aria-controls="tab-generate" aria-selected="false" tabindex="-1">
              <span data-i18n="tools.token-studio.ui.tabGenerate">✏️ Generate Token</span>
            </button>
            <button id="tab-trigger-keys" class="tab-button px-4 py-2 border-b-2 border-transparent font-medium text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 transition-colors" data-tab="keys" role="tab" aria-controls="tab-keys" aria-selected="false" tabindex="-1">
              <span data-i18n="tools.token-studio.ui.tabKeys">🗝️ Key Management</span>
            </button>
            <button id="tab-trigger-jwks" class="tab-button px-4 py-2 border-b-2 border-transparent font-medium text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 transition-colors" data-tab="jwks" role="tab" aria-controls="tab-jwks" aria-selected="false" tabindex="-1">
              <span data-i18n="tools.token-studio.ui.tabJwks">📋 JWKS Endpoint</span>
            </button>
          </nav>
        </div>

        <!-- Tab: Inspect Token -->
        <div id="tab-inspect" class="tab-content" role="tabpanel" aria-labelledby="tab-trigger-inspect">
          <div class="space-y-6">
            <div>
              <label for="inspect-jwt-input" class="label">
                <span data-i18n="tools.token-studio.ui.labelPasteJwt">Paste JWT Token</span>
              </label>
              <textarea
                id="inspect-jwt-input"
                rows="4"
                class="w-full p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0...."
                data-i18n-placeholder="tools.token-studio.ui.placeholderJwt"
                aria-label="JWT token input"
              ></textarea>
              <div class="flex gap-3 mt-2">
                <button id="inspect-decode-btn" class="btn btn-primary">
                  <span data-i18n="tools.token-studio.ui.btnDecode">Decode</span>
                </button>
                <button id="inspect-clear-btn" class="btn btn-ghost">
                  <span data-i18n="tools.token-studio.ui.btnClear">Clear</span>
                </button>
              </div>
            </div>

            <!-- Decoded output -->
            <div id="inspect-result" class="hidden space-y-4">
              <!-- Claim Validation Banner -->
              <div id="inspect-claims-banner" class="hidden rounded-lg p-3 text-sm font-medium border"></div>

              <!-- Header -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wide" data-i18n="tools.token-studio.ui.headingHeader">Header</h3>
                  <button class="copy-btn btn btn-secondary text-xs px-2 py-1" data-copy-target="inspect-header-output">
                    <span data-i18n="tools.token-studio.ui.btnCopy">Copy</span>
                  </button>
                </div>
                <pre id="inspect-header-output" class="w-full p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg overflow-x-auto whitespace-pre-wrap break-all"></pre>
              </div>

              <!-- Payload -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wide" data-i18n="tools.token-studio.ui.headingPayload">Payload</h3>
                  <button class="copy-btn btn btn-secondary text-xs px-2 py-1" data-copy-target="inspect-payload-output">
                    <span data-i18n="tools.token-studio.ui.btnCopy">Copy</span>
                  </button>
                </div>
                <pre id="inspect-payload-output" class="w-full p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg overflow-x-auto whitespace-pre-wrap break-all"></pre>
              </div>

              <!-- Signature Status -->
              <div>
                <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wide mb-2" data-i18n="tools.token-studio.ui.headingSignature">Signature</h3>
                <div class="flex flex-col gap-3">
                  <div id="inspect-sig-status" class="rounded-lg p-3 text-sm border bg-surface-50 dark:bg-surface-950 border-surface-200 dark:border-surface-700 font-mono break-all"></div>
                  <!-- Optional verification -->
                  <div>
                    <label for="inspect-verify-key" class="label text-xs" data-i18n="tools.token-studio.ui.labelVerifyKey">
                      Paste JWK or Shared Secret to verify signature (optional)
                    </label>
                    <textarea
                      id="inspect-verify-key"
                      rows="3"
                      class="w-full p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-y"
                      placeholder='{"kty":"RSA",...} or shared secret string'
                    ></textarea>
                    <button id="inspect-verify-btn" class="btn btn-secondary mt-2">
                      <span data-i18n="tools.token-studio.ui.btnVerify">Verify Signature</span>
                    </button>
                  </div>
                  <div id="inspect-verify-result" class="hidden rounded-lg p-3 text-sm font-medium border"></div>
                </div>
              </div>
            </div>

            <div id="inspect-error" class="hidden rounded-lg p-3 text-sm font-medium border bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800"></div>
          </div>
        </div>

        <!-- Tab: Generate Token -->
        <div id="tab-generate" class="tab-content hidden" role="tabpanel" aria-labelledby="tab-trigger-generate" aria-hidden="true">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left: Config -->
            <div class="space-y-5">
              <!-- Algorithm -->
              <div>
                <label for="gen-algorithm" class="label" data-i18n="tools.token-studio.ui.labelAlgorithm">Algorithm</label>
                <select id="gen-algorithm" class="w-full p-2.5 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                  <optgroup label="HMAC">
                    <option value="HS256" selected>HS256</option>
                    <option value="HS384">HS384</option>
                    <option value="HS512">HS512</option>
                  </optgroup>
                  <optgroup label="RSA">
                    <option value="RS256">RS256</option>
                    <option value="RS384">RS384</option>
                    <option value="RS512">RS512</option>
                  </optgroup>
                  <optgroup label="ECDSA">
                    <option value="ES256">ES256</option>
                    <option value="ES384">ES384</option>
                    <option value="ES512">ES512</option>
                  </optgroup>
                  <optgroup label="RSA-PSS">
                    <option value="PS256">PS256</option>
                    <option value="PS384">PS384</option>
                    <option value="PS512">PS512</option>
                  </optgroup>
                </select>
              </div>

              <!-- Header Editor -->
              <div>
                <label for="gen-header" class="label" data-i18n="tools.token-studio.ui.labelHeader">Header (JSON)</label>
                <textarea
                  id="gen-header"
                  rows="3"
                  class="w-full p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-y"
                ></textarea>
              </div>

              <!-- Payload Editor -->
              <div>
                <label for="gen-payload" class="label" data-i18n="tools.token-studio.ui.labelPayload">Payload (JSON)</label>
                <!-- Quick claim buttons -->
                <div class="flex flex-wrap gap-2 mb-2">
                  <button class="quick-claim-btn btn btn-ghost text-xs px-2 py-1" data-claim="exp" data-i18n="tools.token-studio.ui.btnClaimExp">+exp (1h)</button>
                  <button class="quick-claim-btn btn btn-ghost text-xs px-2 py-1" data-claim="iat" data-i18n="tools.token-studio.ui.btnClaimIat">+iat (now)</button>
                  <button class="quick-claim-btn btn btn-ghost text-xs px-2 py-1" data-claim="nbf" data-i18n="tools.token-studio.ui.btnClaimNbf">+nbf (now)</button>
                  <button class="quick-claim-btn btn btn-ghost text-xs px-2 py-1" data-claim="iss" data-i18n="tools.token-studio.ui.btnClaimIss">+iss</button>
                  <button class="quick-claim-btn btn btn-ghost text-xs px-2 py-1" data-claim="aud" data-i18n="tools.token-studio.ui.btnClaimAud">+aud</button>
                  <button class="quick-claim-btn btn btn-ghost text-xs px-2 py-1" data-claim="sub" data-i18n="tools.token-studio.ui.btnClaimSub">+sub</button>
                  <button class="quick-claim-btn btn btn-ghost text-xs px-2 py-1" data-claim="jti" data-i18n="tools.token-studio.ui.btnClaimJti">+jti (uuid)</button>
                </div>
                <textarea
                  id="gen-payload"
                  rows="6"
                  class="w-full p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-y"
                ></textarea>
              </div>

              <!-- Key Input -->
              <div>
                <label for="gen-key" class="label">
                  <span id="gen-key-label" data-i18n="tools.token-studio.ui.labelSecret">Shared Secret (HMAC)</span>
                </label>
                <textarea
                  id="gen-key"
                  rows="3"
                  class="w-full p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-y"
                  placeholder="your-256-bit-secret"
                ></textarea>
                <p class="text-xs text-surface-500 dark:text-surface-400 mt-1" id="gen-key-hint" data-i18n="tools.token-studio.ui.hintSecret">For HMAC algorithms, enter any UTF-8 string as the shared secret.</p>
              </div>

              <button id="gen-sign-btn" class="btn btn-primary w-full">
                <span data-i18n="tools.token-studio.ui.btnSign">Sign & Generate JWT</span>
              </button>
              <div id="gen-error" class="hidden rounded-lg p-3 text-sm font-medium border bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800"></div>
            </div>

            <!-- Right: Output -->
            <div class="space-y-4">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="label" data-i18n="tools.token-studio.ui.labelOutput">Generated JWT</label>
                  <button id="gen-copy-btn" class="btn btn-secondary text-xs px-2 py-1">
                    <span data-i18n="tools.token-studio.ui.btnCopy">Copy</span>
                  </button>
                </div>
                <div id="gen-jwt-empty" class="rounded-lg p-8 text-center text-surface-400 dark:text-surface-600 bg-surface-50 dark:bg-surface-950 border border-dashed border-surface-200 dark:border-surface-700 font-mono text-sm">
                  <span data-i18n="tools.token-studio.ui.emptyJwt">Generated JWT will appear here</span>
                </div>
                <textarea
                  id="gen-jwt-output"
                  rows="8"
                  class="hidden w-full p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg resize-y"
                  readonly
                ></textarea>
              </div>

              <!-- Color-coded breakdown -->
              <div id="gen-breakdown" class="hidden">
                <h4 class="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2" data-i18n="tools.token-studio.ui.headingBreakdown">Token Breakdown</h4>
                <div class="font-mono text-sm break-all leading-loose p-3 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg">
                  <span id="breakdown-header" class="text-red-600 dark:text-red-400"></span><span class="text-surface-400">.</span><span id="breakdown-payload" class="text-blue-600 dark:text-blue-400"></span><span class="text-surface-400">.</span><span id="breakdown-sig" class="text-green-600 dark:text-green-400"></span>
                </div>
                <div class="flex gap-4 mt-1 text-xs text-surface-500 dark:text-surface-400">
                  <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm bg-red-500 dark:bg-red-400"></span> <span data-i18n="tools.token-studio.ui.legendHeader">Header</span></span>
                  <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm bg-blue-500 dark:bg-blue-400"></span> <span data-i18n="tools.token-studio.ui.legendPayload">Payload</span></span>
                  <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm bg-green-500 dark:bg-green-400"></span> <span data-i18n="tools.token-studio.ui.legendSignature">Signature</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Key Management -->
        <div id="tab-keys" class="tab-content hidden" role="tabpanel" aria-labelledby="tab-trigger-keys" aria-hidden="true">
          <div class="space-y-6">
            <!-- Generate section -->
            <div class="p-4 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg">
              <h3 class="font-semibold text-surface-800 dark:text-surface-200 mb-4" data-i18n="tools.token-studio.ui.headingGenerateKey">Generate Key Pair</h3>
              <div class="flex flex-wrap gap-4 items-end">
                <div>
                  <label for="keys-algorithm" class="label" data-i18n="tools.token-studio.ui.labelKeyAlgorithm">Algorithm</label>
                  <select id="keys-algorithm" class="p-2.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                    <optgroup label="RSA">
                      <option value="RSA-2048">RSA 2048</option>
                      <option value="RSA-4096">RSA 4096</option>
                    </optgroup>
                    <optgroup label="ECDSA">
                      <option value="EC-P256" selected>EC P-256</option>
                      <option value="EC-P384">EC P-384</option>
                      <option value="EC-P521">EC P-521</option>
                    </optgroup>
                    <optgroup label="EdDSA">
                      <option value="OKP-Ed25519">OKP Ed25519</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label class="label" data-i18n="tools.token-studio.ui.labelFormat">Output Format</label>
                  <div class="flex rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700">
                    <button class="format-btn active px-3 py-2 text-sm font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300" data-format="jwk">JWK</button>
                    <button class="format-btn px-3 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800" data-format="pem">PEM</button>
                  </div>
                </div>
                <button id="keys-generate-btn" class="btn btn-primary">
                  <span data-i18n="tools.token-studio.ui.btnGenerateKey">Generate Key Pair</span>
                </button>
              </div>
              <div id="keys-generate-error" class="hidden mt-3 rounded-lg p-3 text-sm font-medium border bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800"></div>
            </div>

            <!-- Key outputs -->
            <div id="keys-output" class="hidden grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-semibold text-surface-700 dark:text-surface-300" data-i18n="tools.token-studio.ui.headingPrivateKey">Private Key</h4>
                  <button class="copy-btn btn btn-secondary text-xs px-2 py-1" data-copy-target="keys-private-output">
                    <span data-i18n="tools.token-studio.ui.btnCopy">Copy</span>
                  </button>
                </div>
                <textarea id="keys-private-output" rows="10" class="w-full p-3 font-mono text-xs bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg resize-y" readonly></textarea>
              </div>
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-semibold text-surface-700 dark:text-surface-300" data-i18n="tools.token-studio.ui.headingPublicKey">Public Key</h4>
                  <button class="copy-btn btn btn-secondary text-xs px-2 py-1" data-copy-target="keys-public-output">
                    <span data-i18n="tools.token-studio.ui.btnCopy">Copy</span>
                  </button>
                </div>
                <textarea id="keys-public-output" rows="10" class="w-full p-3 font-mono text-xs bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg resize-y" readonly></textarea>
                <div id="keys-thumbprint-row" class="hidden mt-2 text-xs text-surface-500 dark:text-surface-400">
                  <span data-i18n="tools.token-studio.ui.labelThumbprint">JWK Thumbprint (kid):</span>
                  <code id="keys-thumbprint" class="ml-1 font-mono text-surface-700 dark:text-surface-300"></code>
                </div>
              </div>
            </div>

            <!-- Import section -->
            <div class="p-4 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg">
              <h3 class="font-semibold text-surface-800 dark:text-surface-200 mb-3" data-i18n="tools.token-studio.ui.headingImportKey">Import / Convert Key</h3>
              <textarea
                id="keys-import-input"
                rows="5"
                class="w-full p-3 font-mono text-sm bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-y"
                placeholder='Paste JWK JSON or PEM key here...'
              ></textarea>
              <div class="flex gap-3 mt-2">
                <button id="keys-import-btn" class="btn btn-secondary">
                  <span data-i18n="tools.token-studio.ui.btnImport">Import & Parse</span>
                </button>
              </div>
              <div id="keys-import-result" class="hidden mt-3 rounded-lg p-3 text-sm border"></div>
            </div>
          </div>
        </div>

        <!-- Tab: JWKS Endpoint -->
        <div id="tab-jwks" class="tab-content hidden" role="tabpanel" aria-labelledby="tab-trigger-jwks" aria-hidden="true">
          <div class="space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Left: Input keys -->
              <div class="space-y-4">
                <h3 class="font-semibold text-surface-800 dark:text-surface-200" data-i18n="tools.token-studio.ui.headingAddKeys">Add Public Keys</h3>
                <div>
                  <label for="jwks-key-input" class="label" data-i18n="tools.token-studio.ui.labelJwkInput">Paste Public JWK (one at a time)</label>
                  <textarea
                    id="jwks-key-input"
                    rows="6"
                    class="w-full p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-y"
                    placeholder='{"kty":"EC","crv":"P-256","x":"...","y":"..."}'
                  ></textarea>
                  <div class="flex gap-3 mt-2">
                    <button id="jwks-add-btn" class="btn btn-primary">
                      <span data-i18n="tools.token-studio.ui.btnAddKey">Add Key</span>
                    </button>
                    <button id="jwks-clear-btn" class="btn btn-ghost">
                      <span data-i18n="tools.token-studio.ui.btnClearAll">Clear All</span>
                    </button>
                  </div>
                  <div id="jwks-add-error" class="hidden mt-2 rounded-lg p-3 text-sm font-medium border bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800"></div>
                </div>

                <!-- Key list -->
                <div>
                  <h4 class="text-sm font-semibold text-surface-600 dark:text-surface-400 mb-2" data-i18n="tools.token-studio.ui.headingKeyList">Keys in Set</h4>
                  <div id="jwks-key-list" class="space-y-2 min-h-12">
                    <p class="text-sm text-surface-400 dark:text-surface-600 italic" id="jwks-empty-label" data-i18n="tools.token-studio.ui.labelNoKeys">No keys added yet.</p>
                  </div>
                </div>
              </div>

              <!-- Right: JWKS output -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-semibold text-surface-800 dark:text-surface-200" data-i18n="tools.token-studio.ui.headingJwksOutput">JWKS Output</h3>
                  <button class="copy-btn btn btn-secondary text-xs px-2 py-1" data-copy-target="jwks-output">
                    <span data-i18n="tools.token-studio.ui.btnCopy">Copy</span>
                  </button>
                </div>
                <textarea
                  id="jwks-output"
                  rows="14"
                  class="w-full p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg resize-y"
                  readonly
                  aria-label="JWKS JSON output"
                >{"keys": []}</textarea>

                <!-- Simulated endpoint info -->
                <div class="p-3 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm space-y-1">
                  <p class="font-medium text-surface-700 dark:text-surface-300" data-i18n="tools.token-studio.ui.headingEndpointInfo">JWKS Endpoint Convention</p>
                  <p class="text-surface-500 dark:text-surface-400 text-xs" data-i18n="tools.token-studio.ui.textEndpointInfo">
                    Serve this JSON at <code class="font-mono bg-surface-100 dark:bg-surface-800 px-1 rounded">/.well-known/jwks.json</code> with
                    <code class="font-mono bg-surface-100 dark:bg-surface-800 px-1 rounded">Content-Type: application/json</code>.
                    Clients use this to fetch public keys for JWT verification without out-of-band key exchange.
                  </p>
                </div>

                <!-- Validation status -->
                <div id="jwks-validation" class="hidden rounded-lg p-3 text-sm font-medium border"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'What is a JWT?',
          content: '<p>A JSON Web Token (JWT) is a compact, URL-safe means of representing claims to be transferred between two parties. A JWT consists of three Base64URL-encoded parts separated by dots: the <strong>Header</strong> (algorithm &amp; type), the <strong>Payload</strong> (claims), and the <strong>Signature</strong>. The signature ensures the token has not been tampered with. JWTs are commonly used for authentication and information exchange in web APIs.</p><p>Standard claims include <code>sub</code> (subject), <code>iss</code> (issuer), <code>aud</code> (audience), <code>exp</code> (expiration), <code>nbf</code> (not before), <code>iat</code> (issued at), and <code>jti</code> (JWT ID).</p>'
        },
        {
          title: 'JWT Algorithms',
          content: '<ul><li><strong>HS256/384/512</strong> — HMAC with SHA-2. Uses a shared secret. Simple, but both parties must hold the same secret key.</li><li><strong>RS256/384/512</strong> — RSA PKCS#1 v1.5 signature. Asymmetric: sign with private key, verify with public key. Ideal for microservice architectures.</li><li><strong>ES256/384/512</strong> — ECDSA with NIST curves (P-256, P-384, P-521). Smaller signatures than RSA with equivalent security.</li><li><strong>PS256/384/512</strong> — RSA-PSS. A probabilistic variant of RSA signing, preferred over RS* in modern systems.</li></ul>'
        },
        {
          title: 'JWK and JWKS',
          content: '<p>A JSON Web Key (JWK) is a JSON structure representing a cryptographic key. A JWK Set (JWKS) is a JSON structure containing an array of JWKs under the <code>keys</code> property. Services publish their JWKS at a well-known URL (e.g., <code>/.well-known/jwks.json</code>), allowing clients to fetch public keys for JWT verification without out-of-band key exchange. Keys in a JWKS are identified by their <code>kid</code> (Key ID), which JWT headers reference.</p>'
        },
        {
          title: 'Security Best Practices',
          content: '<ul><li>Always validate <code>exp</code>, <code>nbf</code>, <code>iss</code>, and <code>aud</code> claims server-side.</li><li>Never use the <code>alg: none</code> algorithm in production — it removes all signature protection.</li><li>Prefer asymmetric algorithms (RS*, ES*, PS*) over HMAC when multiple services need to verify tokens.</li><li>Rotate keys regularly and use <code>kid</code> to identify which key was used to sign each token.</li><li>Store private keys securely — never commit them to version control.</li><li>Use short expiration times and refresh tokens rather than long-lived JWTs.</li></ul>'
        }
      ], 'token-studio')}
      ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const script = `
    ${getCopyToClipboardScript()}
    <script>
      // --- Tab switching (ARIA-compliant, matches password-generator pattern) ---
      (function() {
        var tabList = document.querySelector('[role="tablist"]');
        var tabButtons = tabList ? Array.from(tabList.querySelectorAll('.tab-button')) : [];

        function activateTab(button) {
          if (!button) return;
          var targetId = button.dataset.tab;
          var targetPanelId = 'tab-' + targetId;

          tabButtons.forEach(function(btn) {
            var isTarget = btn === button;
            btn.classList.toggle('active', isTarget);
            btn.classList.toggle('border-primary-600', isTarget);
            btn.classList.toggle('text-primary-600', isTarget);
            btn.classList.toggle('dark:text-primary-400', isTarget);
            btn.classList.toggle('border-transparent', !isTarget);
            btn.setAttribute('aria-selected', String(isTarget));
            btn.setAttribute('tabindex', isTarget ? '0' : '-1');
          });

          document.querySelectorAll('.tab-content').forEach(function(panel) {
            var isTarget = panel.id === targetPanelId;
            panel.classList.toggle('hidden', !isTarget);
            panel.setAttribute('aria-hidden', String(!isTarget));
          });

          button.focus({ preventScroll: true });
        }

        tabButtons.forEach(function(button, index) {
          button.addEventListener('click', function() { activateTab(button); });
          button.addEventListener('keydown', function(event) {
            var key = event.key;
            var lastIndex = tabButtons.length - 1;
            if (key === 'ArrowRight' || key === 'ArrowLeft') {
              event.preventDefault();
              var direction = key === 'ArrowRight' ? 1 : -1;
              var nextIndex = (index + direction + tabButtons.length) % tabButtons.length;
              activateTab(tabButtons[nextIndex]);
            } else if (key === 'Home') {
              event.preventDefault();
              activateTab(tabButtons[0]);
            } else if (key === 'End') {
              event.preventDefault();
              activateTab(tabButtons[lastIndex]);
            }
          });
        });
      })();

      // --- Copy buttons (generic, using data-copy-target) ---
      document.addEventListener('click', function(e) {
        var btn = e.target.closest('.copy-btn');
        if (!btn) return;
        var targetId = btn.dataset.copyTarget;
        if (!targetId) return;
        var el = document.getElementById(targetId);
        if (!el) return;
        var text = el.value !== undefined ? el.value : el.textContent;
        if (text && window.copyToClipboard) {
          window.copyToClipboard(text, btn);
        }
      });

      // --- Base64URL helpers ---
      function b64urlEncode(str) {
        return btoa(unescape(encodeURIComponent(str)))
          .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=/g, '');
      }

      function b64urlDecode(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) str += '=';
        try { return decodeURIComponent(escape(atob(str))); } catch(e) { return atob(str); }
      }

      function b64urlDecodeBytes(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) str += '=';
        var raw = atob(str);
        var bytes = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        return bytes;
      }

      function bytesToB64url(bytes) {
        var raw = '';
        bytes.forEach(function(b) { raw += String.fromCharCode(b); });
        return btoa(raw).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=/g, '');
      }

      // --- Syntax highlighting for JSON output ---
      function syntaxHighlightJson(obj) {
        var str = JSON.stringify(obj, null, 2);
        str = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return str.replace(
          /("(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\"])*"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g,
          function(match) {
            var cls = 'text-blue-600 dark:text-blue-400';
            if (/^"/.test(match)) {
              cls = /:$/.test(match) ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400';
            } else if (/true|false/.test(match)) {
              cls = 'text-amber-600 dark:text-amber-400';
            } else if (/null/.test(match)) {
              cls = 'text-surface-500';
            }
            return '<span class="' + cls + '">' + match + '</span>';
          }
        );
      }

      // --- TAB: INSPECT ---
      (function() {
        var decodeBtn = document.getElementById('inspect-decode-btn');
        var clearBtn = document.getElementById('inspect-clear-btn');
        var input = document.getElementById('inspect-jwt-input');
        var resultEl = document.getElementById('inspect-result');
        var headerEl = document.getElementById('inspect-header-output');
        var payloadEl = document.getElementById('inspect-payload-output');
        var sigStatusEl = document.getElementById('inspect-sig-status');
        var claimsBanner = document.getElementById('inspect-claims-banner');
        var errorEl = document.getElementById('inspect-error');
        var verifyBtn = document.getElementById('inspect-verify-btn');
        var verifyKeyEl = document.getElementById('inspect-verify-key');
        var verifyResultEl = document.getElementById('inspect-verify-result');

        var lastParsed = null;

        function showError(msg) {
          errorEl.textContent = msg;
          errorEl.classList.remove('hidden');
          resultEl.classList.add('hidden');
        }

        function hideError() {
          errorEl.classList.add('hidden');
        }

        function formatClaimTime(ts) {
          try { return new Date(ts * 1000).toISOString(); } catch(e) { return String(ts); }
        }

        decodeBtn.addEventListener('click', function() {
          hideError();
          var token = input.value.trim();
          if (!token) { showError('Please paste a JWT token.'); return; }

          var parts = token.split('.');
          if (parts.length !== 3) { showError('Invalid JWT: expected 3 dot-separated parts.'); return; }

          var header, payload;
          try { header = JSON.parse(b64urlDecode(parts[0])); } catch(e) { showError('Failed to decode header: ' + e.message); return; }
          try { payload = JSON.parse(b64urlDecode(parts[1])); } catch(e) { showError('Failed to decode payload: ' + e.message); return; }

          lastParsed = { header: header, payload: payload, parts: parts };

          headerEl.innerHTML = syntaxHighlightJson(header);
          payloadEl.innerHTML = syntaxHighlightJson(payload);
          sigStatusEl.textContent = parts[2];

          // Claim validation
          var now = Math.floor(Date.now() / 1000);
          var issues = [];
          if (payload.exp !== undefined) {
            if (payload.exp < now) {
              issues.push('exp: Token expired at ' + formatClaimTime(payload.exp));
            } else {
              issues.push('exp: Valid until ' + formatClaimTime(payload.exp));
            }
          }
          if (payload.nbf !== undefined && payload.nbf > now) {
            issues.push('nbf: Not yet valid until ' + formatClaimTime(payload.nbf));
          }
          if (payload.iat !== undefined) {
            issues.push('iat: Issued at ' + formatClaimTime(payload.iat));
          }

          var isExpired = payload.exp !== undefined && payload.exp < now;
          var notYetValid = payload.nbf !== undefined && payload.nbf > now;

          if (issues.length > 0) {
            claimsBanner.innerHTML = issues.map(function(i) { return '<div>' + i + '</div>'; }).join('');
            claimsBanner.className = 'rounded-lg p-3 text-sm font-medium border ' +
              (isExpired || notYetValid
                ? 'bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800'
                : 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800');
            claimsBanner.classList.remove('hidden');
          } else {
            claimsBanner.classList.add('hidden');
          }

          verifyResultEl.classList.add('hidden');
          resultEl.classList.remove('hidden');
        });

        clearBtn.addEventListener('click', function() {
          input.value = '';
          resultEl.classList.add('hidden');
          claimsBanner.classList.add('hidden');
          hideError();
          verifyResultEl.classList.add('hidden');
          lastParsed = null;
        });

        verifyBtn.addEventListener('click', async function() {
          if (!lastParsed) { return; }
          var keyInput = verifyKeyEl.value.trim();
          if (!keyInput) {
            verifyResultEl.textContent = 'Please provide a JWK or shared secret to verify against.';
            verifyResultEl.className = 'rounded-lg p-3 text-sm font-medium border bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800';
            verifyResultEl.classList.remove('hidden');
            return;
          }

          var alg = lastParsed.header.alg || '';
          var parts = lastParsed.parts;
          var signingInput = parts[0] + '.' + parts[1];
          var sigBytes = b64urlDecodeBytes(parts[2]);

          try {
            var isValid = false;

            if (alg.startsWith('HS')) {
              // HMAC: keyInput is shared secret string
              var hashAlg = alg === 'HS256' ? 'SHA-256' : alg === 'HS384' ? 'SHA-384' : 'SHA-512';
              var enc = new TextEncoder();
              var importedKey = await crypto.subtle.importKey(
                'raw', enc.encode(keyInput), { name: 'HMAC', hash: hashAlg }, false, ['verify']
              );
              isValid = await crypto.subtle.verify('HMAC', importedKey, sigBytes, enc.encode(signingInput));
            } else if (alg.startsWith('RS') || alg.startsWith('PS') || alg.startsWith('ES')) {
              // Asymmetric: keyInput is JWK JSON
              var jwk = JSON.parse(keyInput);
              var webCryptoAlg;
              if (alg.startsWith('RS')) {
                var hash = alg === 'RS256' ? 'SHA-256' : alg === 'RS384' ? 'SHA-384' : 'SHA-512';
                webCryptoAlg = { name: 'RSASSA-PKCS1-v1_5', hash: hash };
              } else if (alg.startsWith('PS')) {
                var hash = alg === 'PS256' ? 'SHA-256' : alg === 'PS384' ? 'SHA-384' : 'SHA-512';
                webCryptoAlg = { name: 'RSA-PSS', hash: hash, saltLength: parseInt(hash.replace('SHA-','')) / 8 };
              } else {
                var namedCurve = jwk.crv || 'P-256';
                var hash = namedCurve === 'P-521' ? 'SHA-512' : namedCurve === 'P-384' ? 'SHA-384' : 'SHA-256';
                webCryptoAlg = { name: 'ECDSA', namedCurve: namedCurve, hash: hash };
              }
              var importedKey = await crypto.subtle.importKey('jwk', jwk, webCryptoAlg, false, ['verify']);
              var enc = new TextEncoder();
              isValid = await crypto.subtle.verify(webCryptoAlg, importedKey, sigBytes, enc.encode(signingInput));
            } else {
              throw new Error('Unsupported algorithm: ' + alg);
            }

            verifyResultEl.textContent = isValid ? '✓ Signature is valid.' : '✗ Signature is INVALID.';
            verifyResultEl.className = 'rounded-lg p-3 text-sm font-medium border ' +
              (isValid
                ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800'
                : 'bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800');
            verifyResultEl.classList.remove('hidden');
          } catch(e) {
            verifyResultEl.textContent = 'Verification error: ' + e.message;
            verifyResultEl.className = 'rounded-lg p-3 text-sm font-medium border bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800';
            verifyResultEl.classList.remove('hidden');
          }
        });
      })();

      // --- TAB: GENERATE ---
      (function() {
        var algSelect = document.getElementById('gen-algorithm');
        var headerTa = document.getElementById('gen-header');
        var payloadTa = document.getElementById('gen-payload');
        var keyTa = document.getElementById('gen-key');
        var keyLabel = document.getElementById('gen-key-label');
        var keyHint = document.getElementById('gen-key-hint');
        var signBtn = document.getElementById('gen-sign-btn');
        var copyBtn = document.getElementById('gen-copy-btn');
        var outputTa = document.getElementById('gen-jwt-output');
        var emptyEl = document.getElementById('gen-jwt-empty');
        var breakdownEl = document.getElementById('gen-breakdown');
        var bHeader = document.getElementById('breakdown-header');
        var bPayload = document.getElementById('breakdown-payload');
        var bSig = document.getElementById('breakdown-sig');
        var errorEl = document.getElementById('gen-error');

        function isHmacAlg(alg) { return alg.startsWith('HS'); }

        function updateKeyLabel() {
          var alg = algSelect.value;
          if (isHmacAlg(alg)) {
            keyLabel.textContent = 'Shared Secret (HMAC)';
            keyHint.textContent = 'For HMAC algorithms, enter any UTF-8 string as the shared secret.';
            keyTa.placeholder = 'your-256-bit-secret';
          } else {
            keyLabel.textContent = 'Private Key (JWK)';
            keyHint.textContent = 'Paste the private JWK JSON from Key Management tab, or generate one there first.';
            keyTa.placeholder = '{"kty":"EC","crv":"P-256","d":"...","x":"...","y":"..."}';
          }
        }

        function getDefaultHeader(alg) {
          return JSON.stringify({ alg: alg, typ: 'JWT' }, null, 2);
        }

        function getDefaultPayload() {
          return JSON.stringify({ sub: '1234567890', name: 'John Doe' }, null, 2);
        }

        algSelect.addEventListener('change', function() {
          updateKeyLabel();
          headerTa.value = getDefaultHeader(algSelect.value);
        });

        // Initialize defaults
        headerTa.value = getDefaultHeader(algSelect.value);
        payloadTa.value = getDefaultPayload();
        updateKeyLabel();

        // Quick claim buttons
        document.querySelectorAll('.quick-claim-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var claim = btn.dataset.claim;
            var now = Math.floor(Date.now() / 1000);
            var payload;
            try { payload = JSON.parse(payloadTa.value || '{}'); } catch(e) { payload = {}; }
            switch(claim) {
              case 'exp': payload.exp = now + 3600; break;
              case 'iat': payload.iat = now; break;
              case 'nbf': payload.nbf = now; break;
              case 'iss': payload.iss = 'https://example.com'; break;
              case 'aud': payload.aud = 'https://api.example.com'; break;
              case 'sub': payload.sub = 'user:' + Math.random().toString(36).slice(2, 10); break;
              case 'jti':
                try {
                  payload.jti = crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,function(c){return(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16);});
                } catch(e) { payload.jti = Math.random().toString(36).slice(2); }
                break;
            }
            payloadTa.value = JSON.stringify(payload, null, 2);
          });
        });

        function showError(msg) {
          errorEl.textContent = msg;
          errorEl.classList.remove('hidden');
        }

        function hideError() { errorEl.classList.add('hidden'); }

        signBtn.addEventListener('click', async function() {
          hideError();
          var alg = algSelect.value;
          var header, payload;
          try { header = JSON.parse(headerTa.value); } catch(e) { showError('Invalid header JSON: ' + e.message); return; }
          try { payload = JSON.parse(payloadTa.value || '{}'); } catch(e) { showError('Invalid payload JSON: ' + e.message); return; }
          var keyRaw = keyTa.value.trim();
          if (!keyRaw) { showError('Please provide a key.'); return; }

          var encodedHeader = b64urlEncode(JSON.stringify(header));
          var encodedPayload = b64urlEncode(JSON.stringify(payload));
          var signingInput = encodedHeader + '.' + encodedPayload;
          var enc = new TextEncoder();

          try {
            var sigBytes;
            if (isHmacAlg(alg)) {
              var hashAlg = alg === 'HS256' ? 'SHA-256' : alg === 'HS384' ? 'SHA-384' : 'SHA-512';
              var importedKey = await crypto.subtle.importKey(
                'raw', enc.encode(keyRaw), { name: 'HMAC', hash: hashAlg }, false, ['sign']
              );
              sigBytes = new Uint8Array(await crypto.subtle.sign('HMAC', importedKey, enc.encode(signingInput)));
            } else {
              var jwk = JSON.parse(keyRaw);
              var webCryptoAlg;
              if (alg.startsWith('RS')) {
                var hash = alg === 'RS256' ? 'SHA-256' : alg === 'RS384' ? 'SHA-384' : 'SHA-512';
                webCryptoAlg = { name: 'RSASSA-PKCS1-v1_5', hash: hash };
              } else if (alg.startsWith('PS')) {
                var hash = alg === 'PS256' ? 'SHA-256' : alg === 'PS384' ? 'SHA-384' : 'SHA-512';
                webCryptoAlg = { name: 'RSA-PSS', hash: hash, saltLength: parseInt(hash.replace('SHA-','')) / 8 };
              } else {
                var namedCurve = jwk.crv || 'P-256';
                var hash = namedCurve === 'P-521' ? 'SHA-512' : namedCurve === 'P-384' ? 'SHA-384' : 'SHA-256';
                webCryptoAlg = { name: 'ECDSA', namedCurve: namedCurve, hash: hash };
              }
              var importedKey = await crypto.subtle.importKey('jwk', jwk, webCryptoAlg, false, ['sign']);
              sigBytes = new Uint8Array(await crypto.subtle.sign(webCryptoAlg, importedKey, enc.encode(signingInput)));
            }

            var encodedSig = bytesToB64url(sigBytes);
            var jwt = signingInput + '.' + encodedSig;

            outputTa.value = jwt;
            emptyEl.classList.add('hidden');
            outputTa.classList.remove('hidden');

            // Color breakdown
            bHeader.textContent = encodedHeader;
            bPayload.textContent = encodedPayload;
            bSig.textContent = encodedSig;
            breakdownEl.classList.remove('hidden');
          } catch(e) {
            showError('Signing failed: ' + e.message);
          }
        });

        copyBtn.addEventListener('click', function() {
          var text = outputTa.value;
          if (text && window.copyToClipboard) window.copyToClipboard(text, copyBtn);
        });
      })();

      // --- TAB: KEY MANAGEMENT ---
      (function() {
        var algSelect = document.getElementById('keys-algorithm');
        var generateBtn = document.getElementById('keys-generate-btn');
        var outputEl = document.getElementById('keys-output');
        var privateOut = document.getElementById('keys-private-output');
        var publicOut = document.getElementById('keys-public-output');
        var thumbprintRow = document.getElementById('keys-thumbprint-row');
        var thumbprintEl = document.getElementById('keys-thumbprint');
        var errorEl = document.getElementById('keys-generate-error');
        var formatBtns = document.querySelectorAll('.format-btn');
        var importBtn = document.getElementById('keys-import-btn');
        var importInput = document.getElementById('keys-import-input');
        var importResult = document.getElementById('keys-import-result');

        var currentFormat = 'jwk';
        var lastPrivateKey = null;
        var lastPublicKey = null;
        var lastAlgParam = null;

        formatBtns.forEach(function(btn) {
          btn.addEventListener('click', function() {
            formatBtns.forEach(function(b) {
              b.classList.remove('active', 'bg-primary-50', 'dark:bg-primary-900/30', 'text-primary-700', 'dark:text-primary-300');
              b.classList.add('text-surface-600', 'dark:text-surface-400');
            });
            btn.classList.add('active', 'bg-primary-50', 'dark:bg-primary-900/30', 'text-primary-700', 'dark:text-primary-300');
            btn.classList.remove('text-surface-600', 'dark:text-surface-400');
            currentFormat = btn.dataset.format;
            if (lastPrivateKey && lastPublicKey) updateKeyOutputs();
          });
        });

        async function updateKeyOutputs() {
          try {
            if (currentFormat === 'jwk') {
              var privJwk = await crypto.subtle.exportKey('jwk', lastPrivateKey);
              var pubJwk = await crypto.subtle.exportKey('jwk', lastPublicKey);
              privateOut.value = JSON.stringify(privJwk, null, 2);
              publicOut.value = JSON.stringify(pubJwk, null, 2);
              // Compute thumbprint
              await computeAndShowThumbprint(pubJwk);
            } else {
              var privFormat = 'pkcs8';
              var pubFormat = 'spki';
              var privDer = await crypto.subtle.exportKey(privFormat, lastPrivateKey);
              var pubDer = await crypto.subtle.exportKey(pubFormat, lastPublicKey);
              privateOut.value = derToPem(privDer, 'PRIVATE KEY');
              publicOut.value = derToPem(pubDer, 'PUBLIC KEY');
              thumbprintRow.classList.add('hidden');
            }
          } catch(e) {
            errorEl.textContent = 'Export error: ' + e.message;
            errorEl.classList.remove('hidden');
          }
        }

        function derToPem(der, label) {
          var raw = '';
          new Uint8Array(der).forEach(function(b) { raw += String.fromCharCode(b); });
          var b64 = btoa(raw).match(/.{1,64}/g).join('\\n');
          return '-----BEGIN ' + label + '-----\\n' + b64 + '\\n-----END ' + label + '-----';
        }

        async function computeAndShowThumbprint(pubJwk) {
          // RFC 7638: SHA-256 of lexicographically-sorted required members
          try {
            var members = {};
            var kty = pubJwk.kty;
            if (kty === 'RSA') {
              members = { e: pubJwk.e, kty: pubJwk.kty, n: pubJwk.n };
            } else if (kty === 'EC') {
              members = { crv: pubJwk.crv, kty: pubJwk.kty, x: pubJwk.x, y: pubJwk.y };
            } else if (kty === 'OKP') {
              members = { crv: pubJwk.crv, kty: pubJwk.kty, x: pubJwk.x };
            }
            var sorted = JSON.stringify(members, Object.keys(members).sort());
            var enc = new TextEncoder();
            var hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(sorted));
            var thumbprint = bytesToB64url(new Uint8Array(hashBuf));
            thumbprintEl.textContent = thumbprint;
            thumbprintRow.classList.remove('hidden');
          } catch(e) {
            thumbprintRow.classList.add('hidden');
          }
        }

        generateBtn.addEventListener('click', async function() {
          errorEl.classList.add('hidden');
          var sel = algSelect.value;
          var algParams, extractable = true;

          try {
            if (sel === 'RSA-2048' || sel === 'RSA-4096') {
              var bits = sel === 'RSA-2048' ? 2048 : 4096;
              algParams = { name: 'RSASSA-PKCS1-v1_5', modulusLength: bits, publicExponent: new Uint8Array([1,0,1]), hash: 'SHA-256' };
            } else if (sel === 'EC-P256') {
              algParams = { name: 'ECDSA', namedCurve: 'P-256' };
            } else if (sel === 'EC-P384') {
              algParams = { name: 'ECDSA', namedCurve: 'P-384' };
            } else if (sel === 'EC-P521') {
              algParams = { name: 'ECDSA', namedCurve: 'P-521' };
            } else if (sel === 'OKP-Ed25519') {
              algParams = { name: 'Ed25519' };
            }

            lastAlgParam = algParams;
            generateBtn.disabled = true;
            generateBtn.textContent = 'Generating...';

            var keyPair = await crypto.subtle.generateKey(algParams, extractable, ['sign', 'verify']);
            lastPrivateKey = keyPair.privateKey;
            lastPublicKey = keyPair.publicKey;

            outputEl.classList.remove('hidden');
            await updateKeyOutputs();
          } catch(e) {
            errorEl.textContent = 'Generation failed: ' + e.message + (sel === 'OKP-Ed25519' ? ' (Ed25519 may not be supported in this browser)' : '');
            errorEl.classList.remove('hidden');
          } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Key Pair';
          }
        });

        importBtn.addEventListener('click', async function() {
          var raw = importInput.value.trim();
          if (!raw) {
            importResult.textContent = 'Please paste a JWK or PEM key.';
            importResult.className = 'rounded-lg p-3 text-sm border bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800';
            importResult.classList.remove('hidden');
            return;
          }

          try {
            if (raw.startsWith('{') || raw.startsWith('[')) {
              var jwk = JSON.parse(raw);
              var kty = jwk.kty;
              var info = 'kty: ' + kty;
              if (jwk.crv) info += ', crv: ' + jwk.crv;
              if (jwk.alg) info += ', alg: ' + jwk.alg;
              if (jwk.use) info += ', use: ' + jwk.use;
              if (jwk.kid) info += ', kid: ' + jwk.kid;
              var keyUse = jwk.d ? 'private' : 'public';
              importResult.textContent = 'Valid JWK (' + keyUse + ' key). ' + info;
              importResult.className = 'rounded-lg p-3 text-sm border bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800';
            } else if (raw.includes('-----BEGIN')) {
              var typeMatch = raw.match(/-----BEGIN ([^-]+)-----/);
              var keyType = typeMatch ? typeMatch[1] : 'KEY';
              importResult.textContent = 'Valid PEM detected: ' + keyType + '. Use a library for full PEM import/conversion.';
              importResult.className = 'rounded-lg p-3 text-sm border bg-surface-50 dark:bg-surface-950 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700';
            } else {
              throw new Error('Unrecognized format. Expected JWK JSON or PEM.');
            }
            importResult.classList.remove('hidden');
          } catch(e) {
            importResult.textContent = 'Parse error: ' + e.message;
            importResult.className = 'rounded-lg p-3 text-sm border bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800';
            importResult.classList.remove('hidden');
          }
        });
      })();

      // --- TAB: JWKS ---
      (function() {
        var keyInput = document.getElementById('jwks-key-input');
        var addBtn = document.getElementById('jwks-add-btn');
        var clearBtn = document.getElementById('jwks-clear-btn');
        var keyList = document.getElementById('jwks-key-list');
        var emptyLabel = document.getElementById('jwks-empty-label');
        var output = document.getElementById('jwks-output');
        var addError = document.getElementById('jwks-add-error');
        var validationEl = document.getElementById('jwks-validation');

        var keys = [];

        function updateOutput() {
          var jwks = { keys: keys };
          output.value = JSON.stringify(jwks, null, 2);

          // Validate
          var errors = [];
          keys.forEach(function(k, i) {
            if (!k.kty) errors.push('Key ' + (i+1) + ': missing kty');
            if (!k.use && !k.key_ops) errors.push('Key ' + (i+1) + ': missing use or key_ops (recommended)');
          });
          if (keys.length > 0) {
            var kidsSet = new Set(keys.map(function(k) { return k.kid; }).filter(Boolean));
            if (kidsSet.size < keys.filter(function(k) { return k.kid; }).length) {
              errors.push('Duplicate kid values detected');
            }
          }

          if (errors.length > 0) {
            validationEl.textContent = 'Warnings: ' + errors.join('; ');
            validationEl.className = 'rounded-lg p-3 text-sm font-medium border bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-800';
            validationEl.classList.remove('hidden');
          } else if (keys.length > 0) {
            validationEl.textContent = '✓ Valid JWKS structure (' + keys.length + ' key' + (keys.length !== 1 ? 's' : '') + ')';
            validationEl.className = 'rounded-lg p-3 text-sm font-medium border bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800';
            validationEl.classList.remove('hidden');
          } else {
            validationEl.classList.add('hidden');
          }
        }

        function renderKeyList() {
          if (keys.length === 0) {
            emptyLabel.classList.remove('hidden');
            keyList.innerHTML = '';
            keyList.appendChild(emptyLabel);
            return;
          }
          emptyLabel.classList.add('hidden');
          var items = keys.map(function(k, i) {
            var label = k.kid ? k.kid : (k.kty + (k.crv ? ' (' + k.crv + ')' : ''));
            return '<div class="flex items-center justify-between px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">' +
              '<span class="font-mono text-surface-700 dark:text-surface-300 truncate">' + label + '</span>' +
              '<button class="ml-2 text-error-500 hover:text-error-700 text-xs px-2 py-1 rounded" data-remove-idx="' + i + '" aria-label="Remove key">Remove</button>' +
              '</div>';
          });
          keyList.innerHTML = items.join('');
        }

        keyList.addEventListener('click', function(e) {
          var btn = e.target.closest('[data-remove-idx]');
          if (!btn) return;
          var idx = parseInt(btn.dataset.removeIdx);
          keys.splice(idx, 1);
          renderKeyList();
          updateOutput();
        });

        addBtn.addEventListener('click', function() {
          addError.classList.add('hidden');
          var raw = keyInput.value.trim();
          if (!raw) { addError.textContent = 'Please paste a JWK.'; addError.classList.remove('hidden'); return; }
          try {
            var jwk = JSON.parse(raw);
            if (!jwk.kty) throw new Error('Missing kty property — not a valid JWK.');
            if (jwk.d) throw new Error('This appears to be a private key. Only add public keys to a JWKS endpoint.');
            keys.push(jwk);
            keyInput.value = '';
            renderKeyList();
            updateOutput();
          } catch(e) {
            addError.textContent = 'Invalid JWK: ' + e.message;
            addError.classList.remove('hidden');
          }
        });

        clearBtn.addEventListener('click', function() {
          keys = [];
          keyInput.value = '';
          addError.classList.add('hidden');
          renderKeyList();
          updateOutput();
        });

        // Init
        updateOutput();
      })();
    </script>
  `;

  return respondHTML(createPageTemplate({
    title: 'Token Cryptography Suite',
    description: 'Inspect, decode, generate, and verify JWT tokens. Manage JWK keys and JWKS endpoints. All cryptographic operations run in your browser.',
    path: '/token-studio',
    content,
    scripts: script
  }));
}
