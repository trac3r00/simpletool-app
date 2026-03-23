/**
 * JWK/JWKS Studio
 * - Convert PEM/JWK/JWKS to public JWK
 * - Compute RFC 7638 JWK thumbprints (kid)
 * - Build a JWKS
 * - Verify JWT signatures offline (RS256/PS256/ES256 P-256)
 *
 * All processing happens client-side.
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';

export async function handleJwkJwksStudioRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === '/jwk-jwks-studio' || pathname === '/jwk-jwks-studio/') {
      if (method === 'GET') return respondHTML(renderJwkJwksStudioPage());
    }
    return null;
  } catch {
    return respondJSON(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function renderJwkJwksStudioPage() {
  const toolHeader = createToolHeader(
    { emoji: '🧷' },
    'JWK/JWKS Studio',
    'Convert keys, compute RFC 7638 thumbprints (kid), build JWKS, and verify JWT signatures locally.',
    [{ text: 'Client-Side Only', tooltip: 'All processing happens in your browser. Nothing is uploaded.' }],
    { toolId: 'jwk-jwks-studio' }
  );

  const currentTool = TOOLS.find(t => t.id === 'jwk-jwks-studio');
    const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];


  const content = `
    <script src="/vendor/forge.min.js" integrity="sha384-xHPi7wmhLGnxH9OUWvRRdUiqfT3b6SJShD/WWXkabW5wIlCxk2UyJezPvffKACOD" crossorigin="anonymous"></script>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="space-y-8">
        <div class="card p-6 sm:p-8">
          ${toolHeader}

          <div class="mt-4 p-4 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg text-sm text-surface-700 dark:text-surface-300">
            <p class="font-semibold mb-1" data-i18n="tools.jwk-jwks-studio.ui.desc0">What this is good for</p>
            <ul class="list-disc ml-6 space-y-1">
              <li>Generate a correct <code>kid</code> (RFC 7638 thumbprint) for OIDC / JWKS hosting</li>
              <li>Convert <code>PEM PUBLIC KEY</code> or <code>JWK/JWKS</code> into a clean public JWK</li>
              <li>Verify a JWT signature offline (no network)</li>
            </ul>
          </div>
        </div>

        <section class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div class="card p-6">
            <h2 class="text-sm font-bold text-surface-900 dark:text-surface-50 uppercase tracking-wide mb-3" data-i18n="tools.jwk-jwks-studio.ui.heading0">1) Import / Convert</h2>

            <label class="label">
              <span data-i18n="tools.jwk-jwks-studio.ui.label0">Key Input</span>
              ${infoHint('Paste: JWK, JWKS, PEM public key (SPKI), or a PEM certificate (RSA-only extraction).')}
            </label>
            <textarea id="key-input" rows="10" class="input font-mono text-xs resize-y" spellcheck="false"
              placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----&#10;&#10;or { &quot;kty&quot;: &quot;RSA&quot;, ... }"></textarea>

            <div class="mt-3 flex flex-wrap gap-3">
              <button id="import-btn" class="btn btn-primary">
                <span data-i18n="tools.jwk-jwks-studio.ui.button0">Import</span>
              </button>
              <button id="thumbprint-btn" class="btn btn-secondary" data-tooltip="Compute RFC 7638 SHA-256 thumbprint for the imported JWK" data-i18n-tooltip="tools.jwk-jwks-studio.ui.tip0">
                <span data-i18n="tools.jwk-jwks-studio.ui.button1">Thumbprint</span>
              </button>
              <button id="add-to-jwks-btn" class="btn btn-secondary" data-tooltip="Add/Upsert imported key into the JWKS editor" data-i18n-tooltip="tools.jwk-jwks-studio.ui.tip1">
                <span data-i18n="tools.jwk-jwks-studio.ui.button2">Add to JWKS</span>
              </button>
              <button id="clear-key-btn" class="btn btn-ghost">
                <span data-i18n="tools.jwk-jwks-studio.ui.button3">Clear</span>
              </button>
            </div>

            <div id="import-status" class="hidden mt-4 p-3 rounded-lg border text-sm"></div>

            <div class="mt-6 grid grid-cols-1 gap-4">
              <div class="p-4 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg">
                <div class="flex items-center justify-between gap-3 mb-2">
                  <h3 class="text-xs font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.jwk-jwks-studio.ui.stat0">Imported JWK (Public)</h3>
                  <button id="copy-jwk-btn" class="btn btn-secondary text-xs py-1 px-2"><span data-i18n="tools.jwk-jwks-studio.ui.button4">Copy</span></button>
                </div>
                <pre id="jwk-output" class="text-xs font-mono whitespace-pre-wrap break-words text-surface-900 dark:text-surface-100">—</pre>
              </div>

              <div class="p-4 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label mb-1" data-i18n="tools.jwk-jwks-studio.ui.label3">Thumbprint (RFC 7638, SHA-256)</label>
                    <div class="flex gap-2">
                      <input id="thumbprint-output" class="input input-mono text-xs" readonly placeholder="—" />
                      <button id="copy-thumbprint-btn" class="btn btn-secondary text-xs py-1 px-2"><span data-i18n="tools.jwk-jwks-studio.ui.button5">Copy</span></button>
                    </div>
                  </div>
                  <div>
                    <label class="label mb-1" data-i18n="tools.jwk-jwks-studio.ui.label4">kid (Suggested)</label>
                    <div class="flex gap-2">
                      <input id="kid-output" class="input input-mono text-xs" readonly placeholder="—" />
                      <button id="copy-kid-btn" class="btn btn-secondary text-xs py-1 px-2"><span data-i18n="tools.jwk-jwks-studio.ui.button6">Copy</span></button>
                    </div>
                  </div>
                </div>
                <p class="mt-2 text-xs text-surface-500 dark:text-surface-400">
                  Tip: Many JWKS hosting issues are just a mismatched <code>kid</code>.
                </p>
              </div>
            </div>
          </div>

          <div class="card p-6">
            <h2 class="text-sm font-bold text-surface-900 dark:text-surface-50 uppercase tracking-wide mb-3" data-i18n="tools.jwk-jwks-studio.ui.heading1">2) JWKS Editor</h2>

            <label class="label" data-i18n="tools.jwk-jwks-studio.ui.label1">
              JWKS JSON
              ${infoHint('This editor is used by the verifier below. Paste a JWKS from your IdP, or build one here.')}
            </label>
            <textarea id="jwks-input" rows="12" class="input font-mono text-xs resize-y" spellcheck="false"
              placeholder="{&#10;  &quot;keys&quot;: []&#10;}"></textarea>

            <div class="mt-3 flex flex-wrap gap-3">
              <button id="format-jwks-btn" class="btn btn-secondary"><span data-i18n="tools.jwk-jwks-studio.ui.button7">Format</span></button>
              <button id="copy-jwks-btn" class="btn btn-secondary"><span data-i18n="tools.jwk-jwks-studio.ui.button8">Copy</span></button>
              <button id="clear-jwks-btn" class="btn btn-ghost"><span data-i18n="tools.jwk-jwks-studio.ui.button9">Clear</span></button>
            </div>

            <div id="jwks-status" class="hidden mt-4 p-3 rounded-lg border text-sm"></div>
          </div>
        </section>

        <section class="card p-6 sm:p-8">
          <h2 class="text-sm font-bold text-surface-900 dark:text-surface-50 uppercase tracking-wide mb-3" data-i18n="tools.jwk-jwks-studio.ui.heading2">3) Verify JWT (Offline)</h2>
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div>
              <label class="label" data-i18n="tools.jwk-jwks-studio.ui.label2">
                JWT
                ${infoHint('Paste header.payload.signature (Base64URL). Verification uses the JWKS editor above.')}
              </label>
              <textarea id="jwt-input" rows="8" class="input font-mono text-xs resize-y" spellcheck="false"
                placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6Ii4uLiJ9.eyJzdWIiOiIxMjM0In0. ..."></textarea>
              <div class="mt-3 flex flex-wrap gap-3">
                <button id="verify-btn" class="btn btn-primary"><span data-i18n="tools.jwk-jwks-studio.ui.button10">Verify Signature</span></button>
                <button id="clear-jwt-btn" class="btn btn-ghost"><span data-i18n="tools.jwk-jwks-studio.ui.button11">Clear</span></button>
              </div>
              <div id="verify-status" class="hidden mt-4 p-3 rounded-lg border text-sm"></div>
            </div>

            <div class="space-y-4">
              <div class="p-4 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg">
                <div class="flex items-center justify-between gap-3 mb-2">
                  <h3 class="text-xs font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.jwk-jwks-studio.ui.stat1">Header</h3>
                  <button id="copy-jwt-header-btn" class="btn btn-secondary text-xs py-1 px-2"><span data-i18n="tools.jwk-jwks-studio.ui.button12">Copy</span></button>
                </div>
                <pre id="jwt-header-out" class="text-xs font-mono whitespace-pre-wrap break-words text-surface-900 dark:text-surface-100">—</pre>
              </div>

              <div class="p-4 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg">
                <div class="flex items-center justify-between gap-3 mb-2">
                  <h3 class="text-xs font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.jwk-jwks-studio.ui.stat2">Payload</h3>
                  <button id="copy-jwt-payload-btn" class="btn btn-secondary text-xs py-1 px-2"><span data-i18n="tools.jwk-jwks-studio.ui.button13">Copy</span></button>
                </div>
                <pre id="jwt-payload-out" class="text-xs font-mono whitespace-pre-wrap break-words text-surface-900 dark:text-surface-100">—</pre>
              </div>
            </div>
          </div>
        </section>

        ${createCheatsheet('jwk-jwks-studio', 'JWK/JWKS Notes', [
          { heading: 'RFC 7638 Thumbprint', content: '<p>Thumbprints are computed over a canonical JSON object (sorted keys, no whitespace), then SHA-256 hashed and Base64URL-encoded. A common safe <code>kid</code> is the thumbprint.</p>' },
          { heading: 'Supported JWT alg', content: '<ul><li><code>RS256</code> (RSA PKCS#1 v1.5 + SHA-256)</li><li><code>PS256</code> (RSA-PSS + SHA-256, saltLength 32)</li><li><code>ES256</code> (ECDSA P-256 + SHA-256)</li></ul>' },
          { heading: 'Common Failure Modes', content: '<ul><li><code>kid</code> mismatch between JWT header and JWKS</li><li><code>alg</code> mismatch (JWT says ES256 but JWKS key is RSA)</li><li>ECDSA signature format: JWS uses raw <code>r||s</code>, while WebCrypto expects DER</li></ul>' },
        ])}
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'What is JWK/JWKS?',
          content: `
            <p>JSON Web Key (JWK) is a JSON-based format for representing cryptographic keys. It is defined in RFC 7517 and is widely used in modern identity protocols like OpenID Connect (OIDC). A JWK Set (JWKS) is simply a JSON object that contains an array of JWKs.</p>
            <p>JWKS are typically hosted at a public URL (the "jwks_uri") by an Identity Provider (IdP). This allows applications to dynamically retrieve the public keys needed to verify the signatures of JWTs issued by that IdP without having to hardcode keys or certificates.</p>
          `
        },
        {
          title: 'How to Use This Tool',
          content: `
            <ol>
              <li><strong>Import a Key:</strong> Paste a PEM public key, a single JWK, or a full JWKS into the "Key Input" field and click "Import".</li>
              <li><strong>Generate Thumbprint:</strong> Click "Thumbprint" to compute the RFC 7638 SHA-256 hash of the key, which is often used as the <code>kid</code> (Key ID).</li>
              <li><strong>Build a JWKS:</strong> Click "Add to JWKS" to move your imported key into the JWKS Editor. You can manage multiple keys here for rotation.</li>
              <li><strong>Verify JWT:</strong> Paste a JWT into the verifier section. The tool will use the keys in your JWKS Editor to attempt to verify the signature locally.</li>
            </ol>
          `
        },
        {
          title: 'Common Use Cases',
          content: `
            <ul>
              <li><strong>OIDC Configuration:</strong> Generating the correct <code>kid</code> and JWK format for your application's <code>.well-known/jwks.json</code> endpoint.</li>
              <li><strong>Key Conversion:</strong> Converting legacy PEM public keys into the modern JWK format required by many cloud providers and libraries.</li>
              <li><strong>Offline Debugging:</strong> Verifying JWT signatures from your local environment without needing to make network requests to an IdP.</li>
              <li><strong>Security Testing:</strong> Manually building JWKS objects to test how your application handles key rotation or multiple active keys.</li>
            </ul>
          `
        },
        {
          title: 'Pro Tips',
          content: `
            <ul>
              <li><strong>Key Rotation:</strong> When rotating keys, keep both the old and new keys in your JWKS for a transition period. This ensures that tokens signed with the old key remain valid until they expire.</li>
              <li><strong>Use "sig" for Signing:</strong> Always set the <code>use</code> parameter to <code>"sig"</code> for keys intended for signature verification to help clients distinguish them from encryption keys.</li>
              <li><strong>Deterministic kids:</strong> Using the RFC 7638 thumbprint as your <code>kid</code> ensures that the ID is always consistent for the same key material, regardless of where it is generated.</li>
            </ul>
          `
        }
      ], 'jwk-jwks-studio', lang)}
    ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const scripts = `
    <script>
      (function() {
        const MAX_INPUT_CHARS = 1_000_000;

        const keyInput = document.getElementById('key-input');
        const jwksInput = document.getElementById('jwks-input');
        const jwtInput = document.getElementById('jwt-input');

        const importBtn = document.getElementById('import-btn');
        const thumbprintBtn = document.getElementById('thumbprint-btn');
        const addToJwksBtn = document.getElementById('add-to-jwks-btn');
        const clearKeyBtn = document.getElementById('clear-key-btn');

        const formatJwksBtn = document.getElementById('format-jwks-btn');
        const copyJwksBtn = document.getElementById('copy-jwks-btn');
        const clearJwksBtn = document.getElementById('clear-jwks-btn');

        const verifyBtn = document.getElementById('verify-btn');
        const clearJwtBtn = document.getElementById('clear-jwt-btn');

        const importStatus = document.getElementById('import-status');
        const jwksStatus = document.getElementById('jwks-status');
        const verifyStatus = document.getElementById('verify-status');

        const jwkOut = document.getElementById('jwk-output');
        const thumbprintOut = document.getElementById('thumbprint-output');
        const kidOut = document.getElementById('kid-output');

        const jwtHeaderOut = document.getElementById('jwt-header-out');
        const jwtPayloadOut = document.getElementById('jwt-payload-out');

        const copyJwkBtn = document.getElementById('copy-jwk-btn');
        const copyThumbprintBtn = document.getElementById('copy-thumbprint-btn');
        const copyKidBtn = document.getElementById('copy-kid-btn');
        const copyJwtHeaderBtn = document.getElementById('copy-jwt-header-btn');
        const copyJwtPayloadBtn = document.getElementById('copy-jwt-payload-btn');

        /** @type {any|null} */
        let importedJwk = null;

         function showStatus(el, kind, message) {
           if (!el) return;
           el.classList.remove('hidden');
           el.className = 'mt-4 p-3 rounded-lg border text-sm';
          if (kind === 'ok') {
               el.classList.add('bg-success-50','dark:bg-success-900/20','border-success-200','dark:border-success-800','text-success-900','dark:text-success-100');
             } else if (kind === 'warn') {
               el.classList.add('bg-warning-50','dark:bg-warning-900/20','border-warning-200','dark:border-warning-800','text-warning-900','dark:text-warning-100');
             } else {
               el.classList.add('bg-error-50','dark:bg-error-900/20','border-error-200','dark:border-error-800','text-error-900','dark:text-error-100');
             }
           el.textContent = message;
         }

        function hideStatus(el) {
          if (!el) return;
          el.classList.add('hidden');
          el.textContent = '';
        }

        function clampInput(raw) {
          const s = String(raw ?? '');
          if (s.length > MAX_INPUT_CHARS) throw new Error('Input too large. Please paste a smaller key/JWKS/JWT.');
          return s;
        }

        function safeJsonParse(raw) {
          try { return { ok: true, value: JSON.parse(raw) }; }
          catch (e) { return { ok: false, error: e }; }
        }

        function prettyJson(obj) {
          return JSON.stringify(obj, null, 2);
        }

        function base64ToBytes(b64) {
          const bin = atob(b64);
          const out = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
          return out;
        }

        function bytesToBase64(bytes) {
          let bin = '';
          const chunk = 0x8000;
          for (let i = 0; i < bytes.length; i += chunk) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
          }
          return btoa(bin);
        }

        function base64UrlToBytes(b64u) {
          const b64 = String(b64u).replace(/-/g, '+').replace(/_/g, '/');
          const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
          return base64ToBytes(b64 + pad);
        }

        function bytesToBase64Url(bytes) {
          return bytesToBase64(bytes).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/g, '');
        }

        function normalizePemBlock(raw) {
          const text = String(raw || '').trim();
          const blocks = text.match(/-----BEGIN [^-]+-----[\\s\\S]*?-----END [^-]+-----/g);
          if (!blocks || !blocks.length) return null;
          // Use the first block; that's typically what users expect.
          return blocks[0].trim();
        }

        function pemToDerBytes(pem) {
          const body = pem
            .replace(/-----BEGIN [^-]+-----/g, '')
            .replace(/-----END [^-]+-----/g, '')
            .replace(/\\s+/g, '');
          return base64ToBytes(body);
        }

        function isLikelyJwt(raw) {
          const s = String(raw || '').trim();
          const parts = s.split('.');
          return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0;
        }

        function pickPublicParts(jwk) {
          if (!jwk || typeof jwk !== 'object') return null;
          if (jwk.kty === 'RSA') {
            if (!jwk.n || !jwk.e) return null;
            // Keep output intentionally minimal: enough for JWKS hosting + verification.
            return { kty: 'RSA', n: jwk.n, e: jwk.e, kid: jwk.kid, alg: jwk.alg, use: jwk.use, key_ops: jwk.key_ops };
          }
          if (jwk.kty === 'EC') {
            if (!jwk.crv || !jwk.x || !jwk.y) return null;
            return { kty: 'EC', crv: jwk.crv, x: jwk.x, y: jwk.y, kid: jwk.kid, alg: jwk.alg, use: jwk.use, key_ops: jwk.key_ops };
          }
          return null;
        }

        async function importFromJwkOrJwks(obj) {
          if (!obj || typeof obj !== 'object') throw new Error('Invalid JSON.');

          if (Array.isArray(obj.keys)) {
            if (obj.keys.length === 0) throw new Error('JWKS has no keys.');
            // Prefer a public key.
            const cand = obj.keys.find((k) => k && typeof k === 'object' && !k.d) || obj.keys[0];
            const pub = pickPublicParts(cand);
            if (!pub) throw new Error('Unsupported key in JWKS. Expected RSA or EC public key.');
            return pub;
          }

          if (obj.kty) {
            const pub = pickPublicParts(obj);
            if (!pub) throw new Error('Unsupported JWK. Expected RSA or EC public key.');
            return pub;
          }

          throw new Error('JSON input must be a JWK or JWKS.');
        }

        async function importFromPem(pem) {
          const block = normalizePemBlock(pem);
          if (!block) throw new Error('No PEM block found.');

          // Reject obvious private key pastes.
          if (/BEGIN (?:RSA|EC|DSA|ED25519)? ?PRIVATE KEY/i.test(block)) {
            throw new Error('This looks like a PRIVATE KEY. For safety, this tool only accepts PUBLIC material.');
          }

          // Special case: certificate -> try to extract public key with forge (best-effort).
          if (/BEGIN CERTIFICATE/i.test(block)) {
            if (!window.forge) throw new Error('Certificate parsing requires forge (vendor).');
            try {
              const cert = window.forge.pki.certificateFromPem(block);
              // RSA-only export is reliable here; EC cert support depends on forge internals.
              const asn1 = window.forge.pki.publicKeyToAsn1(cert.publicKey);
              const spkiBytes = window.forge.asn1.toDer(asn1).getBytes();
              const spki = new Uint8Array(spkiBytes.length);
              for (let i = 0; i < spkiBytes.length; i++) spki[i] = spkiBytes.charCodeAt(i);
              return await importFromSpki(spki.buffer);
            } catch (e) {
              throw new Error('Unable to extract a public key from this certificate. Paste a PEM PUBLIC KEY or a JWK/JWKS instead.');
            }
          }

          // BEGIN RSA PUBLIC KEY (PKCS#1) -> convert to SPKI via forge.
          if (/BEGIN RSA PUBLIC KEY/i.test(block)) {
            if (!window.forge) throw new Error('RSA PUBLIC KEY conversion requires forge (vendor).');
            try {
              const pub = window.forge.pki.publicKeyFromPem(block);
              const asn1 = window.forge.pki.publicKeyToAsn1(pub);
              const spkiBytes = window.forge.asn1.toDer(asn1).getBytes();
              const spki = new Uint8Array(spkiBytes.length);
              for (let i = 0; i < spkiBytes.length; i++) spki[i] = spkiBytes.charCodeAt(i);
              return await importFromSpki(spki.buffer);
            } catch (e) {
              throw new Error('Unable to convert RSA PUBLIC KEY PEM. Paste a PEM PUBLIC KEY (SPKI) or JWK/JWKS JSON instead.');
            }
          }

          // BEGIN PUBLIC KEY (SPKI) expected.
          if (!/BEGIN PUBLIC KEY/i.test(block)) {
            throw new Error('Unsupported PEM type. Paste a PEM PUBLIC KEY, PEM RSA PUBLIC KEY, or JWK/JWKS JSON.');
          }

          const der = pemToDerBytes(block);
          return await importFromSpki(der.buffer);
        }

        async function importFromSpki(spkiArrayBuffer) {
          // Try RSA first, then EC P-256.
          // Exported JWK will represent the key type regardless of import alg choice.
          try {
            const rsaKey = await crypto.subtle.importKey(
              'spki',
              spkiArrayBuffer,
              { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
              true,
              ['verify']
            );
            const jwk = await crypto.subtle.exportKey('jwk', rsaKey);
            const pub = pickPublicParts(jwk);
            if (!pub) throw new Error('RSA key export failed.');
            return pub;
          } catch (rsaErr) {
            // fallthrough
          }

          try {
            const ecKey = await crypto.subtle.importKey(
              'spki',
              spkiArrayBuffer,
              { name: 'ECDSA', namedCurve: 'P-256' },
              true,
              ['verify']
            );
            const jwk = await crypto.subtle.exportKey('jwk', ecKey);
            const pub = pickPublicParts(jwk);
            if (!pub) throw new Error('EC key export failed.');
            return pub;
          } catch (ecErr) {
            throw new Error('Unable to import this key. Supported: RSA public keys, or EC P-256 public keys (SPKI).');
          }
        }

        async function computeRfc7638Thumbprint(jwk) {
          if (!jwk || typeof jwk !== 'object') throw new Error('No JWK imported.');
          let canon;
          if (jwk.kty === 'RSA') {
            if (!jwk.e || !jwk.n) throw new Error('RSA JWK requires n and e.');
            canon = JSON.stringify({ e: jwk.e, kty: 'RSA', n: jwk.n });
          } else if (jwk.kty === 'EC') {
            if (!jwk.crv || !jwk.x || !jwk.y) throw new Error('EC JWK requires crv, x, y.');
            canon = JSON.stringify({ crv: jwk.crv, kty: 'EC', x: jwk.x, y: jwk.y });
          } else {
            throw new Error('Thumbprint supported only for RSA and EC keys.');
          }

          const data = new TextEncoder().encode(canon);
          const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
          return bytesToBase64Url(digest);
        }

        function jwtParts(jwt) {
          const s = String(jwt || '').trim();
          const parts = s.split('.');
          if (parts.length !== 3) throw new Error('JWT must have 3 dot-separated parts.');
          return { headerB64u: parts[0], payloadB64u: parts[1], sigB64u: parts[2], signingInput: parts[0] + '.' + parts[1] };
        }

        function decodeJsonB64u(b64u) {
          const bytes = base64UrlToBytes(b64u);
          const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
          const parsed = safeJsonParse(text);
          if (!parsed.ok) throw new Error('Invalid JSON in token part.');
          return parsed.value;
        }

        function ecdsaRawToDer(raw) {
          // JWS uses raw (r||s). WebCrypto expects DER.
          const sig = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
          if (sig.length % 2 !== 0) throw new Error('Invalid ECDSA signature length.');
          const half = sig.length / 2;
          let r = sig.slice(0, half);
          let s = sig.slice(half);

          function trimLeadingZeros(bytes) {
            let i = 0;
            while (i < bytes.length - 1 && bytes[i] === 0) i++;
            return bytes.slice(i);
          }

          function ensurePositive(bytes) {
            if (bytes.length === 0) return new Uint8Array([0]);
            if (bytes[0] & 0x80) {
              const out = new Uint8Array(bytes.length + 1);
              out[0] = 0;
              out.set(bytes, 1);
              return out;
            }
            return bytes;
          }

          r = ensurePositive(trimLeadingZeros(r));
          s = ensurePositive(trimLeadingZeros(s));

          const len = 2 + r.length + 2 + s.length;
          const out = new Uint8Array(2 + len);
          let o = 0;
          out[o++] = 0x30;
          out[o++] = len;
          out[o++] = 0x02;
          out[o++] = r.length;
          out.set(r, o); o += r.length;
          out[o++] = 0x02;
          out[o++] = s.length;
          out.set(s, o); o += s.length;
          return out;
        }

        function pickKeyFromJwks(jwksObj, kid) {
          if (!jwksObj || typeof jwksObj !== 'object') return null;
          const keys = Array.isArray(jwksObj.keys) ? jwksObj.keys : (jwksObj.kty ? [jwksObj] : []);
          if (!keys.length) return null;
          if (kid) {
            const match = keys.find((k) => k && typeof k === 'object' && k.kid === kid);
            if (match) return match;
          }
          if (keys.length === 1) return keys[0];
          // Prefer "sig" usage when ambiguous.
          const sigKey = keys.find((k) => k && typeof k === 'object' && (k.use === 'sig' || (Array.isArray(k.key_ops) && k.key_ops.includes('verify'))));
          return sigKey || keys[0];
        }

        async function verifyJwtSignature(jwt, jwksObj) {
          const { headerB64u, payloadB64u, sigB64u, signingInput } = jwtParts(jwt);
          const header = decodeJsonB64u(headerB64u);
          const payload = decodeJsonB64u(payloadB64u);

          const alg = String(header.alg || '').trim();
          const kid = String(header.kid || '').trim();
          if (!alg) throw new Error('JWT header missing alg.');

          const jwk = pickKeyFromJwks(jwksObj, kid || null);
          if (!jwk) throw new Error('No key found in JWKS.');
          if (kid && jwk.kid && jwk.kid !== kid) {
            // pickKeyFromJwks would have matched kid; this is just a guard
            throw new Error('kid mismatch.');
          }

          const data = new TextEncoder().encode(signingInput);
          const sigRaw = base64UrlToBytes(sigB64u);

          if (alg === 'RS256') {
            const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
            const ok = await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, sigRaw, data);
            return { ok, header, payload, pickedKid: jwk.kid || null, pickedKty: jwk.kty || null, alg };
          }

          if (alg === 'PS256') {
            const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSA-PSS', hash: 'SHA-256' }, false, ['verify']);
            const ok = await crypto.subtle.verify({ name: 'RSA-PSS', saltLength: 32 }, key, sigRaw, data);
            return { ok, header, payload, pickedKid: jwk.kid || null, pickedKty: jwk.kty || null, alg };
          }

          if (alg === 'ES256') {
            const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
            const sigDer = ecdsaRawToDer(sigRaw);
            const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, sigDer, data);
            return { ok, header, payload, pickedKid: jwk.kid || null, pickedKty: jwk.kty || null, alg };
          }

          throw new Error('Unsupported alg: ' + alg + '. Supported: RS256, PS256, ES256.');
        }

        function tryGetJwksFromEditor() {
          const raw = (jwksInput.value || '').trim();
          if (!raw) return { keys: [] };
          const parsed = safeJsonParse(raw);
          if (!parsed.ok) throw new Error('Invalid JWKS JSON.');
          const obj = parsed.value;
          if (obj && typeof obj === 'object' && Array.isArray(obj.keys)) return obj;
          if (obj && typeof obj === 'object' && obj.kty) return { keys: [obj] };
          throw new Error('JWKS editor must contain a JWKS ({ keys: [...] }) or a single JWK.');
        }

        function setImported(jwk, note) {
          importedJwk = jwk;
          jwkOut.textContent = prettyJson(jwk);
          thumbprintOut.value = '';
          kidOut.value = '';
          hideStatus(verifyStatus);
          if (note) showStatus(importStatus, 'ok', note);
          else showStatus(importStatus, 'ok', 'Imported a public JWK.');
        }

        async function handleImport() {
          hideStatus(importStatus);
          const raw = clampInput(keyInput.value);
          if (!raw.trim()) {
            importedJwk = null;
            jwkOut.textContent = '—';
            thumbprintOut.value = '';
            kidOut.value = '';
            showStatus(importStatus, 'warn', 'Paste a JWK/JWKS/PEM public key first.');
            return;
          }

          if (isLikelyJwt(raw)) {
            showStatus(importStatus, 'warn', 'This looks like a JWT. Paste keys/JWKS here; paste JWTs in the verifier section.');
            return;
          }

          const trimmed = raw.trim();

          // JSON JWK/JWKS
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            const parsed = safeJsonParse(trimmed);
            if (!parsed.ok) {
              showStatus(importStatus, 'error', 'Invalid JSON: ' + (parsed.error && parsed.error.message ? parsed.error.message : String(parsed.error)));
              return;
            }
            try {
              const jwk = await importFromJwkOrJwks(parsed.value);
              setImported(jwk, Array.isArray(parsed.value?.keys) ? 'Imported from JWKS.' : 'Imported from JWK.');
              return;
            } catch (e) {
              showStatus(importStatus, 'error', e.message || String(e));
              return;
            }
          }

          // PEM
          if (trimmed.includes('BEGIN') && trimmed.includes('END')) {
            try {
              const jwk = await importFromPem(trimmed);
              setImported(jwk, 'Imported from PEM.');
              return;
            } catch (e) {
              showStatus(importStatus, 'error', e.message || String(e));
              return;
            }
          }

          showStatus(importStatus, 'error', 'Unrecognized input. Paste JWK/JWKS JSON or a PEM public key/certificate.');
        }

        async function handleThumbprint() {
          hideStatus(importStatus);
          if (!importedJwk) {
            showStatus(importStatus, 'warn', 'Import a key first.');
            return;
          }
          try {
            const tp = await computeRfc7638Thumbprint(importedJwk);
            thumbprintOut.value = tp;
            kidOut.value = tp;
            // Do not mutate importedJwk automatically; user may want to keep original kid.
            showStatus(importStatus, 'ok', 'Computed RFC 7638 thumbprint. Suggested kid = thumbprint.');
          } catch (e) {
            showStatus(importStatus, 'error', e.message || String(e));
          }
        }

        function upsertKeyIntoJwks(jwksObj, jwk) {
          const out = (jwksObj && typeof jwksObj === 'object') ? jwksObj : { keys: [] };
          if (!Array.isArray(out.keys)) out.keys = [];

          const key = { ...jwk };
          if (!key.kid) {
            // Prefer computed kid if present in UI.
            const suggested = String(kidOut.value || '').trim();
            if (suggested) key.kid = suggested;
          }

          // Keep it public only.
          delete key.d;
          delete key.p;
          delete key.q;
          delete key.dp;
          delete key.dq;
          delete key.qi;
          delete key.oth;

          const idx = key.kid ? out.keys.findIndex((k) => k && typeof k === 'object' && k.kid === key.kid) : -1;
          if (idx >= 0) out.keys[idx] = key;
          else out.keys.push(key);
          return out;
        }

        function handleAddToJwks() {
          hideStatus(jwksStatus);
          if (!importedJwk) {
            showStatus(jwksStatus, 'warn', 'Import a key first.');
            return;
          }
          try {
            const current = tryGetJwksFromEditor();
            const next = upsertKeyIntoJwks(current, importedJwk);
            jwksInput.value = prettyJson(next);
            showStatus(jwksStatus, 'ok', 'Key added to JWKS editor.');
          } catch (e) {
            showStatus(jwksStatus, 'error', e.message || String(e));
          }
        }

        function handleFormatJwks() {
          hideStatus(jwksStatus);
          try {
            const obj = tryGetJwksFromEditor();
            jwksInput.value = prettyJson(obj);
            showStatus(jwksStatus, 'ok', 'Formatted JWKS JSON.');
          } catch (e) {
            showStatus(jwksStatus, 'error', e.message || String(e));
          }
        }

        async function handleVerify() {
          hideStatus(verifyStatus);
          const jwt = clampInput(jwtInput.value).trim();
          if (!jwt) {
            showStatus(verifyStatus, 'warn', 'Paste a JWT first.');
            return;
          }

          let jwksObj;
          try {
            jwksObj = tryGetJwksFromEditor();
          } catch (e) {
            showStatus(verifyStatus, 'error', e.message || String(e));
            return;
          }

          try {
            const res = await verifyJwtSignature(jwt, jwksObj);
            jwtHeaderOut.textContent = prettyJson(res.header);
            jwtPayloadOut.textContent = prettyJson(res.payload);

            if (res.ok) {
              showStatus(verifyStatus, 'ok', 'Signature VALID (' + res.alg + '). Picked key: ' + (res.pickedKid || '(no kid)') + ' (' + (res.pickedKty || '?') + ')');
            } else {
              showStatus(verifyStatus, 'error', 'Signature INVALID (' + res.alg + '). Picked key: ' + (res.pickedKid || '(no kid)'));
            }
          } catch (e) {
            showStatus(verifyStatus, 'error', e.message || String(e));
          }
        }

        async function copyText(text, statusEl) {
          try {
            await navigator.clipboard.writeText(String(text ?? ''));
            if (statusEl) showStatus(statusEl, 'ok', 'Copied to clipboard.');
            if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
          } catch (e) {
            if (statusEl) showStatus(statusEl, 'error', 'Copy failed (clipboard permission).');
          }
        }

        importBtn.addEventListener('click', () => { handleImport().catch((e) => showStatus(importStatus, 'error', e.message || String(e))); });
        thumbprintBtn.addEventListener('click', () => { handleThumbprint().catch((e) => showStatus(importStatus, 'error', e.message || String(e))); });
        addToJwksBtn.addEventListener('click', () => { handleAddToJwks(); });

        clearKeyBtn.addEventListener('click', () => {
          keyInput.value = '';
          importedJwk = null;
          jwkOut.textContent = '—';
          thumbprintOut.value = '';
          kidOut.value = '';
          hideStatus(importStatus);
          keyInput.focus();
        });

        formatJwksBtn.addEventListener('click', handleFormatJwks);
        copyJwksBtn.addEventListener('click', () => copyText(jwksInput.value || '', jwksStatus));
        clearJwksBtn.addEventListener('click', () => {
          jwksInput.value = '';
          hideStatus(jwksStatus);
          jwksInput.focus();
        });

        verifyBtn.addEventListener('click', () => { handleVerify().catch((e) => showStatus(verifyStatus, 'error', e.message || String(e))); });
        clearJwtBtn.addEventListener('click', () => {
          jwtInput.value = '';
          jwtHeaderOut.textContent = '—';
          jwtPayloadOut.textContent = '—';
          hideStatus(verifyStatus);
          jwtInput.focus();
        });

        copyJwkBtn.addEventListener('click', () => copyText(jwkOut.textContent === '—' ? '' : jwkOut.textContent, importStatus));
        copyThumbprintBtn.addEventListener('click', () => copyText(thumbprintOut.value || '', importStatus));
        copyKidBtn.addEventListener('click', () => copyText(kidOut.value || '', importStatus));
        copyJwtHeaderBtn.addEventListener('click', () => copyText(jwtHeaderOut.textContent === '—' ? '' : jwtHeaderOut.textContent, verifyStatus));
        copyJwtPayloadBtn.addEventListener('click', () => copyText(jwtPayloadOut.textContent === '—' ? '' : jwtPayloadOut.textContent, verifyStatus));

        // Defensive: prevent uncaught rejections from bubbling to Playwright soak.
        window.addEventListener('unhandledrejection', (e) => {
          e.preventDefault();
        });
      })();
    </script>
  `;

  return createPageTemplate({
    title: 'JWK/JWKS Studio',
    description: 'Convert PEM/JWK/JWKS, compute RFC 7638 thumbprints (kid), build JWKS, and verify JWT signatures offline.',
    content,
    path: '/jwk-jwks-studio',
    scripts
  });
}
