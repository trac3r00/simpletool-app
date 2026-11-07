/**
 * X.509 Certificate Decoder (PEM)
 * Parses certificates client-side using node-forge
 */

import { respondHTML, respondJSON } from "../utils/respond.js";
import {
  createPageTemplate,
  createToolHeader,
  createCheatsheet,
  infoHint,
} from "../utils/common-ui.js";
import {
  createEducationalSection,
  createRelatedToolsSection,
} from "../utils/content-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import {
  checkChainOrder,
  computeCertWarnings,
  detectPrivateKey,
  extractCertFields,
  describeCertExtensions,
  extractPemCertificates,
  parseCertificatePem,
  verifyIssuedBy,
  verifySignatureWebCrypto,
} from "../utils/cert-logic.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";

export async function handleCertificateDecoderRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (
      pathname === "/certificate-decoder" ||
      pathname === "/certificate-decoder/"
    ) {
      if (method === "GET") {
        return respondHTML(
          renderCertificateDecoderPage(resolveRequestLanguage(request, url)),
        );
      }
    }

    return respondJSON({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("Certificate Decoder Route Error:", error);
    return respondJSON(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    );
  }
}

function renderCertificateDecoderPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("certificate-decoder", currentLang);
  const toolHeader = createToolHeader(
    { emoji: "📜" },
    translation?.name || "X.509 Certificate Decoder",
    translation?.desc ||
      "Inspect PEM certificates client-side. Validate issuers, SANs, and extensions securely.",
    [
      {
        text: translation?.ui?.badge16 || "Privacy First",
        color: "emerald",
        tooltip:
          "All processing happens in your browser — your data is not sent to our servers.",
      },
    ],
    { toolId: "certificate-decoder" },
  );

  const currentTool = TOOLS.find((t) => t.id === "certificate-decoder");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <script src="/vendor/forge.min.js" integrity="sha384-wX64sW+w67fcBkYc40eYEvKyZMtpFujAPnxJPPMvE6fT3WDOJDZOAAny4rWgoBYq" crossorigin="anonymous"></script>

    <main class="tool-page-shell">
      <div class="tool-page-panel">
      <div class="space-y-8">
        
        <!-- Header & Input -->
        <div class="card p-6 sm:p-8">
          ${toolHeader}

          <div class="space-y-4">
            <label for="certificate-input" class="label"><span data-i18n="tools.certificate-decoder.ui.label2">Paste Certificate (PEM Format)</span> ${infoHint("Paste PEM block with BEGIN/END headers so the parser detects it.")}</label>
            <textarea id="certificate-input" class="input font-mono h-48 resize-y" data-tooltip="Paste PEM certificate starting with -----BEGIN CERTIFICATE-----" data-i18n-tooltip="tools.certificate-decoder.ui.tip0" placeholder="-----BEGIN CERTIFICATE-----&#10;MIIByzCCAXSgAwIBAgIUTQl...
-----END CERTIFICATE-----"></textarea>
            
            <div class="flex gap-3">
              <button id="parse-btn" class="btn btn-primary" data-tooltip="Decode and display certificate details" data-i18n-tooltip="tools.certificate-decoder.ui.tip1">
                <span data-i18n="tools.certificate-decoder.ui.button0">Parse Certificate</span>
              </button>
              <button id="clear-btn" class="btn btn-ghost" data-tooltip="Clear input and results" data-i18n-tooltip="tools.certificate-decoder.ui.tip2">
                <span data-i18n="tools.certificate-decoder.ui.button1">Clear</span>
              </button>
            </div>
          </div>

           <div id="error-banner" role="alert" class="hidden mt-4 p-4 rounded-lg bg-error-50 text-error-900 border border-error-200 dark:bg-error-900/20 dark:text-error-200 dark:border-error-800 text-sm"></div>
          
          <div id="status-badge" class="hidden mt-6 flex items-center gap-4 p-4 rounded-lg border-2 transition-all">
            <div id="status-icon" class="text-3xl"></div>
            <div>
              <p id="status-text" class="text-lg font-bold"></p>
              <p id="status-detail" class="text-sm text-surface-600 dark:text-surface-400"></p>
            </div>
          </div>
        </div>

        <!-- Results Pane -->
        <section id="results-pane" class="hidden space-y-6">

          <div class="card p-6">
            <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100" data-i18n="tools.certificate-decoder.ui.r4_1">Warnings</h2>
            <div id="warnings-list" class="mt-4 text-sm text-surface-700 dark:text-surface-300"></div>
          </div>

          <div class="card p-6">
            <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100" data-i18n="tools.certificate-decoder.ui.r4_2">Certificate Chain</h2>
            <p class="mt-1 text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.certificate-decoder.ui.r4_3">Checks order and signatures between the certificates you pasted only. Trust stores and revocation are not checked.</p>
            <p id="chain-summary" class="mt-4 text-sm font-semibold"></p>
            <ol id="chain-list" class="mt-4 space-y-3 text-sm text-surface-700 dark:text-surface-300"></ol>
            <div id="cert-select-wrap" class="hidden mt-4 max-w-md">
              <label for="cert-select" class="label" data-i18n="tools.certificate-decoder.ui.r4_0">Show details for</label>
              <select id="cert-select" class="input"></select>
            </div>
          </div>

          <!-- Summary Cards -->
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4" id="summary-grid">
            <div class="card p-4">
              <p class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 font-bold" data-i18n="tools.certificate-decoder.ui.stat3">Common Name</p>
              <p id="summary-cn" class="mt-1 text-lg font-semibold text-surface-900 dark:text-surface-100 break-words">—</p>
            </div>
            <div class="card p-4">
              <p class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 font-bold" data-i18n="tools.certificate-decoder.ui.stat4">Issuer</p>
              <p id="summary-issuer" class="mt-1 text-lg font-semibold text-surface-900 dark:text-surface-100 break-words">—</p>
            </div>
            <div class="card p-4">
              <p class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 font-bold" data-i18n="tools.certificate-decoder.ui.stat5">Valid From</p>
              <p id="summary-valid-from" class="mt-1 text-base font-semibold text-surface-900 dark:text-surface-100">—</p>
            </div>
            <div class="card p-4">
              <p class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 font-bold" data-i18n="tools.certificate-decoder.ui.stat6">Valid To</p>
              <p id="summary-valid-to" class="mt-1 text-base font-semibold text-surface-900 dark:text-surface-100">—</p>
            </div>
          </div>

          <!-- Detail Sections -->
          <div class="card divide-y divide-surface-200 dark:divide-surface-800">
            
            <details class="group p-4" open>
              <summary class="flex items-center justify-between cursor-pointer list-none">
                <span class="text-lg font-bold text-surface-900 dark:text-surface-100" data-i18n="tools.certificate-decoder.ui.desc7">Subject</span>
                <span class="material-symbols-rounded text-surface-400 transition-transform group-open:rotate-180" aria-hidden="true" data-icon="expand_more"></span>
              </summary>
              <div id="subject-details" class="mt-4 text-sm text-surface-700 dark:text-surface-300"></div>
            </details>

            <details class="group p-4" open>
              <summary class="flex items-center justify-between cursor-pointer list-none">
                <span class="text-lg font-bold text-surface-900 dark:text-surface-100">Issuer</span>
                <span class="material-symbols-rounded text-surface-400 transition-transform group-open:rotate-180" aria-hidden="true" data-icon="expand_more"></span>
              </summary>
              <div id="issuer-details" class="mt-4 text-sm text-surface-700 dark:text-surface-300"></div>
            </details>

            <details class="group p-4" open>
              <summary class="flex items-center justify-between cursor-pointer list-none">
                <span class="text-lg font-bold text-surface-900 dark:text-surface-100" data-i18n="tools.certificate-decoder.ui.desc9">Subject Alternative Names (SANs)</span>
                <span class="material-symbols-rounded text-surface-400 transition-transform group-open:rotate-180" aria-hidden="true" data-icon="expand_more"></span>
              </summary>
              <div id="sans-list" class="mt-4 text-sm text-surface-700 dark:text-surface-300"></div>
            </details>

            <details class="group p-4" open>
              <summary class="flex items-center justify-between cursor-pointer list-none">
                <span class="text-lg font-bold text-surface-900 dark:text-surface-100" data-i18n="tools.certificate-decoder.ui.desc10">Certificate Details</span>
                <span class="material-symbols-rounded text-surface-400 transition-transform group-open:rotate-180" aria-hidden="true" data-icon="expand_more"></span>
              </summary>
              <div id="details-list" class="mt-4 text-sm text-surface-700 dark:text-surface-300"></div>
            </details>

            <details class="group p-4" open>
              <summary class="flex items-center justify-between cursor-pointer list-none">
                <span class="text-lg font-bold text-surface-900 dark:text-surface-100" data-i18n="tools.certificate-decoder.ui.desc11">Extensions</span>
                <span class="material-symbols-rounded text-surface-400 transition-transform group-open:rotate-180" aria-hidden="true" data-icon="expand_more"></span>
              </summary>
              <div id="extensions-details" class="mt-4 text-sm text-surface-700 dark:text-surface-300"></div>
            </details>

          </div>
        </section>

      </div>

      ${createCheatsheet("certificate-decoder", "X.509 Certificate Reference", [
        {
          heading: "Certificate Fields",
          content: `
          <table>
            <tr><th data-i18n="tools.certificate-decoder.ui.th4">Field</th><th data-i18n="tools.certificate-decoder.ui.th5">Description</th></tr>
            <tr><td><code>Subject</code></td><td>Entity the certificate identifies</td></tr>
            <tr><td><code>Issuer</code></td><td>CA that signed the certificate</td></tr>
            <tr><td><code>Serial Number</code></td><td>Unique certificate identifier</td></tr>
            <tr><td><code>Not Before / After</code></td><td>Validity period</td></tr>
            <tr><td><code>Subject Alt Names</code></td><td>Additional domains / IPs</td></tr>
            <tr><td><code>Key Usage</code></td><td data-i18n="tools.certificate-decoder.ui.r4_4">Allowed operations</td></tr>
          </table>`,
        },
        {
          heading: "Certificate Types",
          content: `
          <table>
            <tr><th data-i18n="tools.certificate-decoder.ui.th6">Type</th><th data-i18n="tools.certificate-decoder.ui.th7">Validation</th><th data-i18n="tools.certificate-decoder.ui.th8">Use Case</th></tr>
            <tr><td><code>DV</code> (Domain)</td><td>Quick / automated</td><td>Basic HTTPS</td></tr>
            <tr><td><code>OV</code> (Organization)</td><td>Business verified</td><td>Company sites</td></tr>
            <tr><td><code>EV</code> (Extended)</td><td>Strict verification</td><td data-i18n="tools.certificate-decoder.ui.r4_5">Financial / legal</td></tr>
          </table>`,
        },
      ])}
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection(
        [
          {
            title: "What are X.509 Certificates?",
            content: `
            <p>X.509 is a standard format for public key certificates, which are digital documents that securely bind a public key to an identity (such as a website, organization, or individual). These certificates are the foundation of the Public Key Infrastructure (PKI) used to secure the internet via HTTPS, as well as for signing emails and software.</p>
            <p data-i18n="tools.certificate-decoder.ui.r4_6">An X.509 certificate contains the public key, the identity of the certificate holder, and the digital signature of the Certificate Authority (CA) that issued the certificate, proving its authenticity.</p>
          `,
          },
          {
            title: "How to Use This Tool",
            content: `
            <ol>
              <li><strong>Paste your certificate:</strong> Copy your PEM-encoded certificate (including the BEGIN and END headers) and paste it into the input field.</li>
              <li><strong>Parse:</strong> Click "Parse Certificate" to extract and analyze the data.</li>
              <li><strong>Review Summary:</strong> Check the top cards for the Common Name (CN), Issuer, and validity dates.</li>
              <li><strong>Inspect Details:</strong> Expand the sections below to see the full Subject, Issuer, SANs, and technical extensions.</li>
              <li><strong data-i18n="tools.certificate-decoder.ui.r4_7">Check Status:</strong> Look at the status badge to see if the certificate is currently valid or expired.</li>
            </ol>
          `,
          },
          {
            title: "Common Use Cases",
            content: `
            <ul>
              <li><strong>SSL/TLS Troubleshooting:</strong> Diagnosing why a website is showing a "Not Secure" warning by checking for expiration or hostname mismatches.</li>
              <li><strong>Security Auditing:</strong> Verifying that a certificate was issued by a trusted CA and uses strong signature algorithms (like SHA-256).</li>
              <li><strong>Development:</strong> Inspecting self-signed certificates or CSRs (Certificate Signing Requests) during local development.</li>
              <li><strong data-i18n="tools.certificate-decoder.ui.r4_8">Infrastructure Management:</strong> Checking the Subject Alternative Names (SANs) to ensure all required subdomains are covered by a single certificate.</li>
            </ul>
          `,
          },
          {
            title: "Pro Tips",
            content: `
            <ul>
              <li><strong>Check the SANs:</strong> Modern browsers rely on the Subject Alternative Name (SAN) extension rather than the Common Name (CN) for hostname verification. Always ensure your domain is listed in the SANs.</li>
              <li><strong>Verify the Chain:</strong> If a certificate is valid but still untrusted, it may be missing intermediate certificates. Check the "Issuer" to identify which intermediate CA you need to include on your server.</li>
              <li><strong data-i18n="tools.certificate-decoder.ui.r4_9">Fingerprints for Pinning:</strong> Use the SHA-256 Fingerprint provided by this tool if you need to implement certificate pinning in mobile applications or high-security APIs.</li>
            </ul>
          `,
          },
        ],
        "certificate-decoder",
        currentLang,
      )}
    ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const script = `
    <script>
      (function() {
        const textarea = document.getElementById('certificate-input');
        const parseBtn = document.getElementById('parse-btn');
        const clearBtn = document.getElementById('clear-btn');
        const errorBanner = document.getElementById('error-banner');
        const statusBadge = document.getElementById('status-badge');
        const statusIcon = document.getElementById('status-icon');
        const statusText = document.getElementById('status-text');
        const statusDetail = document.getElementById('status-detail');
        const resultsPane = document.getElementById('results-pane');
        
        const summaryFields = {
          cn: document.getElementById('summary-cn'),
          issuer: document.getElementById('summary-issuer'),
          validFrom: document.getElementById('summary-valid-from'),
          validTo: document.getElementById('summary-valid-to')
        };
        const sections = {
          subject: document.getElementById('subject-details'),
          issuer: document.getElementById('issuer-details'),
          sans: document.getElementById('sans-list'),
          details: document.getElementById('details-list'),
          extensions: document.getElementById('extensions-details')
        };

        const detectPrivateKey = ${detectPrivateKey.toString()};
        const extractPemCertificates = ${extractPemCertificates.toString()};
        const computeCertWarnings = ${computeCertWarnings.toString()};
        const checkChainOrder = ${checkChainOrder.toString()};
        const extractCertFields = ${extractCertFields.toString()};
        const verifyIssuedBy = ${verifyIssuedBy.toString()};
        const verifySignatureWebCrypto = ${verifySignatureWebCrypto.toString()};
        const parseCertificatePem = ${parseCertificatePem.toString()};
        const describeCertExtensions = ${describeCertExtensions.toString()};

        const warningsList = document.getElementById('warnings-list');
        const chainSummary = document.getElementById('chain-summary');
        const chainList = document.getElementById('chain-list');
        const certSelectWrap = document.getElementById('cert-select-wrap');
        const certSelect = document.getElementById('cert-select');
        let parsedCerts = [];
        let chainRun = 0;

        certSelect.addEventListener('change', () => {
          const entry = parsedCerts[Number(certSelect.value)];
          if (entry) renderCertificate(entry.cert);
        });

        const statusBaseClasses = 'flex items-center gap-4 rounded-lg border-2 px-4 py-4 transition-all shadow-sm';
           const statusThemes = {
            valid: { classes: 'border-success-200 bg-success-50 text-success-900 dark:border-success-800 dark:bg-success-900/20 dark:text-success-100', icon: '🟢', label: 'Currently Valid' },
            expired: { classes: 'border-error-200 bg-error-50 text-error-900 dark:border-error-800 dark:bg-error-900/20 dark:text-error-100', icon: '🔴', label: 'Expired' },
             notYetValid: { classes: 'border-warning-200 bg-warning-50 text-warning-900 dark:border-warning-800 dark:bg-warning-900/20 dark:text-warning-100', icon: '🟡', label: 'Not Yet Valid' },
            error: { classes: 'border-error-200 bg-error-50 text-error-900 dark:border-error-800 dark:bg-error-900/20 dark:text-error-100', icon: '⚠️', label: 'Unable to Parse' }
          };

        parseBtn.addEventListener('click', handleParse);
        clearBtn.addEventListener('click', () => {
          textarea.value = '';
          resetUI();
          textarea.focus();
        });

        textarea.addEventListener('input', () => {
          if (!errorBanner.classList.contains('hidden')) {
            hideError();
          }
        });

        function handleParse() {
          const rawInput = textarea.value.trim();

          if (!rawInput) {
            showError('Please paste a PEM-formatted certificate to begin.');
            return;
          }

          const keyHeader = detectPrivateKey(rawInput);
          if (keyHeader) {
            showError('Private key detected (' + keyHeader + '). Nothing was parsed: this tool reads certificates only, so remove the key and paste just the certificate(s). If this key was ever shared (chat, ticket, email, or another website), treat it as compromised and rotate it.');
            return;
          }

          const pems = extractPemCertificates(rawInput);

          if (!pems.length) {
            if (/^[A-Za-z0-9+/=\\\\s]+$/.test(rawInput) && rawInput.length > 100) {
               showError('This looks like base64 data but is missing the PEM headers. Please ensure it starts with "-----BEGIN CERTIFICATE-----" and ends with "-----END CERTIFICATE-----".');
            } else {
               showError('No valid PEM certificate found. Please ensure your input contains "-----BEGIN CERTIFICATE-----" and "-----END CERTIFICATE-----".');
            }
            return;
          }

          if (!window.forge) {
            showError('Cryptography library (Forge) not loaded. Please check your internet connection and reload.');
            return;
          }

          const certs = [];
          for (let i = 0; i < pems.length; i++) {
            try {
              certs.push(parseCertificatePem(window.forge, pems[i]));
            } catch (err) {
              showError('Certificate ' + (i + 1) + ' of ' + pems.length + ' could not be parsed. The block may be truncated or corrupted; copy it again including the BEGIN and END lines.');
              return;
            }
          }

          const now = Date.now();
          parsedCerts = certs.map((cert) => {
            const fields = extractCertFields(window.forge, cert);
            return { cert, fields, warnings: computeCertWarnings(fields, now) };
          });
          hideError();
          renderWarnings(parsedCerts);
          renderChain(parsedCerts).catch((err) => {
            chainSummary.textContent = (_t('tools.certificate-decoder.js.r4_0', 'Signature check failed:') + ' ') + String((err && err.message) || err);
          });
          renderCertificate(parsedCerts[0].cert);
        }

        function certLabel(entry, index) {
          const cn = getAttributeValue(entry.cert.subject?.attributes, 'CN');
          return '#' + (index + 1) + ' ' + (cn || entry.fields.subject || 'Certificate');
        }

        function renderWarnings(entries) {
          const blocks = entries.map((entry, index) => {
            if (!entry.warnings.length) return '';
            const items = entry.warnings.map((w) => '<li>' + escapeHtml(w.message) + '</li>').join('');
            return '<div class="p-4 rounded-lg border border-warning-200 bg-warning-50 text-warning-900 dark:border-warning-800 dark:bg-warning-900/20 dark:text-warning-100">'
              + '<h3 class="font-semibold">' + escapeHtml(certLabel(entry, index)) + '</h3>'
              + '<ul class="mt-2 list-disc pl-5 space-y-1">' + items + '</ul></div>';
          }).filter(Boolean);
          warningsList.innerHTML = blocks.length
            ? '<div class="space-y-3">' + blocks.join('') + '</div>'
            : '<p>No warnings for ' + entries.length + ' certificate(s): dates, SAN, signature algorithm and RSA key size look fine.</p>';
        }

        // RSA signatures are checked synchronously with forge; ECDSA and Ed25519 go to WebCrypto.
        async function checkSignature(issuer, cert) {
          const result = verifyIssuedBy(issuer, cert);
          if (!result.unsupported) return result;
          return verifySignatureWebCrypto(window.crypto && window.crypto.subtle, issuer.der, cert.der);
        }

        async function renderChain(entries) {
          const run = ++chainRun;
          const order = checkChainOrder(entries.map((entry) => entry.fields));
          chainSummary.textContent = _t('tools.certificate-decoder.js.r4_1', 'Checking signatures...');
          chainList.innerHTML = '';
          const [signed, selfVerified] = await Promise.all([
            Promise.all(entries.map((entry, i) => i + 1 < entries.length ? checkSignature(entries[i + 1].cert, entry.cert) : null)),
            Promise.all(entries.map((entry, i) => order.selfSigned[i] ? checkSignature(entry.cert, entry.cert) : null))
          ]);
          if (run !== chainRun) return;
          const last = entries.length - 1;

          const rows = entries.map((entry, i) => {
            const lines = [
              'Subject: ' + entry.fields.subject,
              'Issuer: ' + entry.fields.issuer
            ];
            if (order.selfSigned[i]) {
              lines.push(selfVerified[i].ok
                ? 'Self-signed root: signature verifies with its own key.'
                : selfVerified[i].unsupported
                  ? 'Self-signed (subject equals issuer). Signature not checked: ' + selfVerified[i].error
                  : 'Subject equals issuer, but the self-signature does not verify.');
            }
            if (i < last) {
              lines.push(order.links[i].ok
                ? 'Issuer matches the subject of #' + (i + 2) + '.'
                : 'Out of order: issuer does not match the subject of #' + (i + 2) + '.');
              lines.push(signed[i].ok
                ? 'Signature verified with the public key of #' + (i + 2) + '.'
                : signed[i].unsupported
                  ? 'Signature not checked: ' + signed[i].error
                  : 'Signature NOT verified by #' + (i + 2) + '.' + (signed[i].error ? ' ' + signed[i].error : ''));
            } else if (!order.selfSigned[i]) {
              lines.push('Last certificate is not self-signed; its issuer was not included.');
            }
            return '<li class="p-3 rounded-lg border border-surface-200 dark:border-surface-800">'
              + '<p class="font-semibold text-surface-900 dark:text-surface-100">' + escapeHtml(certLabel(entry, i)) + '</p>'
              + lines.map((line) => '<p class="mt-1 break-words">' + escapeHtml(line) + '</p>').join('')
              + '</li>';
          });
          chainList.innerHTML = rows.join('');

          const allSigned = signed.every((result) => result === null || result.ok);
          const anyUnchecked = signed.some((result) => result && result.unsupported);
          if (entries.length === 1) {
            chainSummary.textContent = order.selfSigned[0] ? '1 certificate (self-signed).' : '1 certificate; paste the intermediates after it to check the chain.';
          } else if (order.inOrder && allSigned) {
            chainSummary.textContent = entries.length + ' certificates in order: each one is signed by the next.';
          } else if (order.inOrder && signed.every((result) => result === null || result.ok || result.unsupported) && anyUnchecked) {
            chainSummary.textContent = entries.length + ' certificates in order by name; some signatures could not be checked in this browser (see below).';
          } else {
            chainSummary.textContent = entries.length + ' certificates: chain is out of order or a signature does not verify. Expected order is leaf first, then each issuer.';
          }

          certSelect.innerHTML = entries.map((entry, i) => '<option value="' + i + '">' + escapeHtml(certLabel(entry, i)) + '</option>').join('');
          certSelect.value = '0';
          certSelectWrap.classList.toggle('hidden', entries.length < 2);
        }

        function renderCertificate(cert) {
          updateSummary(cert);
          sections.subject.innerHTML = renderAttributes(cert.subject?.attributes);
          sections.issuer.innerHTML = renderAttributes(cert.issuer?.attributes);
          sections.sans.innerHTML = renderSans(cert.extensions);
          sections.details.innerHTML = renderDetails(cert);
          sections.extensions.innerHTML = renderExtensions(cert);
          updateValidity(cert.validity);
          resultsPane.classList.remove('hidden');
        }

        function updateSummary(cert) {
          summaryFields.cn.textContent = getAttributeValue(cert.subject?.attributes, 'CN') || '—';
          summaryFields.issuer.textContent = getAttributeValue(cert.issuer?.attributes, 'CN') || cert.issuer?.attributes?.map(attr => attr.value).join(', ') || '—';
          summaryFields.validFrom.textContent = formatDate(cert.validity?.notBefore);
          summaryFields.validTo.textContent = formatDate(cert.validity?.notAfter);
        }

        function updateValidity(validity) {
          if (!validity) {
            statusBadge.classList.add('hidden');
            return;
          }

          const now = new Date();
          const notBefore = validity.notBefore ? new Date(validity.notBefore) : null;
          const notAfter = validity.notAfter ? new Date(validity.notAfter) : null;
          let state = 'valid';
          let detail = 'Validity dates unavailable.';

          if (!notBefore || !notAfter) {
            state = 'error';
          } else if (now < notBefore) {
            state = 'notYetValid';
            detail = 'Becomes valid on ' + formatDate(notBefore);
          } else if (now > notAfter) {
            state = 'expired';
            detail = 'Expired on ' + formatDate(notAfter);
          } else {
            const remainingMs = notAfter - now;
            const remainingDays = Math.max(0, Math.round(remainingMs / (1000 * 60 * 60 * 24)));
            state = 'valid';
            detail = remainingDays > 0 ? \`\${remainingDays} day(s) until expiry\` : 'Expires within 24 hours';
          }

          const config = statusThemes[state] || statusThemes.error;
          statusBadge.className = statusBaseClasses + ' ' + config.classes;
          statusIcon.textContent = config.icon;
          statusText.textContent = config.label;
          statusDetail.textContent = detail;
          statusBadge.classList.remove('hidden');
        }

        function renderAttributes(attributes = []) {
          if (!attributes.length) return '<p class="text-surface-500 dark:text-surface-400" data-i18n="tools.certificate-decoder.ui.desc12">No data present.</p>';

          const items = attributes.map(attr => {
            const label = formatAttributeLabel(attr);
            return \`
              <div>
                <p class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 font-bold">
\${escapeHtml(label)}</p>
                <p class="mt-1 font-mono text-sm break-words text-surface-900 dark:text-surface-100">
\${escapeHtml(attr.value || '—')}</p>
              </div>
            \`;
          }).join('');

          return '<div class="grid gap-4 sm:grid-cols-2">' + items + '</div>';
        }

        function renderSans(extensions = []) {
          const san = extensions.find(ext => ext.name === 'subjectAltName');
          if (!san || !Array.isArray(san.altNames) || !san.altNames.length) {
            return '<p class="text-surface-500 dark:text-surface-400" data-i18n="tools.certificate-decoder.ui.desc13">No Subject Alternative Names present.</p>';
          }

          const items = san.altNames.map((alt) => {
            const type = describeSanType(alt.type);
            return \`
              <li class="flex flex-wrap items-center gap-2">
                <span class="badge bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 text-xs px-2 py-0.5 rounded">
\${type}</span>
                <span class="font-mono text-sm break-all text-surface-900 dark:text-surface-100">
\${escapeHtml(alt.type === 7 ? alt.ip : alt.value || '')}</span>
              </li>
            \`;
          }).join('');

          return '<ul class="space-y-2">' + items + '</ul>';
        }

        function renderDetails(cert) {
          const fingerprint = computeFingerprint(cert);
          const serial = formatSerial(cert.serialNumber);
          const signatureAlgorithm = extractCertFields(window.forge, cert).signatureAlgorithm;
          const publicKey = describePublicKey(cert);
          const table = [
            ['Serial Number', serial],
            ['Version', cert.version !== undefined ? 'v' + (cert.version + 1) : '—'],
            ['Signature Algorithm', signatureAlgorithm],
            ['Public Key', publicKey],
            ['SHA-256 Fingerprint', fingerprint]
          ];

          return renderDefinitionList(table);
        }

        function renderExtensions(cert) {
          if (!(cert.extensions || []).length) return '<p class="text-surface-500 dark:text-surface-400" data-i18n="tools.certificate-decoder.ui.desc14">No extensions parsed.</p>';

          const ext = describeCertExtensions(window.forge, cert);
          const basicConstraints = cert.extensions.find(e => e.name === 'basicConstraints');
          const list = (items, separator) => items === null ? 'Not present' : (items.length ? items.join(separator) : 'None');

          const rows = [
            ['Key Usage', list(ext.keyUsage, ', ') + (ext.keyUsageCritical ? ' (critical)' : '')],
            ['Extended Key Usage', list(ext.extKeyUsage, ', ')],
            ['Basic Constraints', formatBasicConstraints(basicConstraints)],
            ['CRL Distribution Points', list(ext.crl, '\\n')],
            ['Authority Information Access', list(ext.aia, '\\n')]
          ];

          return renderDefinitionList(rows);
        }

        function renderDefinitionList(rows) {
          const items = rows.map(([label, value]) => {
            const safeValue = escapeHtml(value || '—').replace(/\\n/g, '<br>');
            return \`
              <div>
                <p class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 font-bold">
\${escapeHtml(label)}</p>
                <p class="mt-1 font-mono text-sm text-surface-900 dark:text-surface-100 break-words">
\${safeValue}</p>
              </div>
            \`;
          }).join('');

          return '<div class="grid gap-4 sm:grid-cols-2">' + items + '</div>';
        }

        // Helper functions from original...
        function describeSanType(type) { const map = { 1: 'RFC822', 2: 'DNS', 6: 'URI', 7: 'IP', 8: 'RID' }; return map[type] || 'Other'; }


        function describePublicKey(cert) { const info = cert.keyInfo; if (!info) return 'Unknown'; if (info.bits) return info.type + ' (' + info.bits + ' bits)'; return info.curve ? info.type + ' (' + info.curve + ')' : info.type; }

        function computeFingerprint(cert) { try { const md = window.forge.md.sha256.create(); md.update(cert.der); return md.digest().toHex().match(/.{1,2}/g).join(':').toUpperCase(); } catch { return 'Unavailable'; } }

        function formatBasicConstraints(ext) { if (!ext) return 'Not present'; const isCa = ext.cA ? 'TRUE' : 'FALSE'; const pathLen = typeof ext.pathLenConstraint === 'number' ? ', Path Length ≤ ' + ext.pathLenConstraint : ''; return 'Is CA: ' + isCa + pathLen; }



        function formatSerial(serialNumber) { if (!serialNumber) return '—'; const normalized = String(serialNumber).replace(/[^a-fA-F0-9]/g, ''); return normalized.match(/.{1,2}/g)?.join(':').toUpperCase() || normalized || serialNumber; }


        function getAttributeValue(attributes = [], shortName) { const match = attributes.find(attr => attr.shortName === shortName); return match?.value || ''; }

        function formatAttributeLabel(attr) { if (attr?.shortName) return attr.shortName.toUpperCase(); if (attr?.name) return attr.name.replace(/([A-Z])/g, ' $1').trim(); return attr?.type || 'Attribute'; }

        function formatDate(date) { if (!date) return '—'; try { return new Date(date).toUTCString(); } catch { return '—'; } }

        function escapeHtml(value) { const str = String(value ?? ''); return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
        
        function hideError() {
            document.getElementById('error-banner').classList.add('hidden');
        }
        
        function showError(msg) {
            const banner = document.getElementById('error-banner');
            banner.textContent = msg;
            banner.classList.remove('hidden');
            document.getElementById('results-pane').classList.add('hidden');
            document.getElementById('status-badge').classList.add('hidden');
        }
        
        function resetUI() {
           chainRun++;
           document.getElementById('error-banner').classList.add('hidden');
           document.getElementById('results-pane').classList.add('hidden');
           document.getElementById('status-badge').classList.add('hidden');
        }
        
      })();
    </script>
  `;

  return createPageTemplate({
    title: translation?.name || "X.509 Certificate Decoder",
    description:
      translation?.desc ||
      "Inspect PEM certificates client-side. Validate issuers, SANs, and extensions securely.",
    path: "/certificate-decoder",
    content,
    scripts: script,
    lang: currentLang,
  });
}
