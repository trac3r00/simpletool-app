/**
 * SAML Response Decoder
 * Decode Base64/deflated SAML payloads entirely in-browser
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createCheatsheet, infoHint } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleSamlDecoderRoutes(request, url) {
  const { pathname } = url;

  if (pathname === '/saml-decoder' || pathname === '/saml-decoder/') {
    if (request.method === 'GET') {
      return respondHTML(renderSamlDecoderPage(resolveRequestLanguage(request, url)));
    }

    return respondJSON({ error: 'Method not allowed' }, { status: 405 });
  }

  return null;
}

function renderSamlDecoderPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('saml-decoder', currentLang);
  const title = translation?.name || 'SAML Inspector';
  const description = translation?.desc || 'Decode SAML requests and responses.';

  const currentTool = TOOLS.find(t => t.id === 'saml-decoder');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <header class="bg-white/90 dark:bg-surface-900/80 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-8">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.35em] text-primary-600 dark:text-primary-300 mb-3" data-i18n="tools.saml-decoder.ui.desc11">Enterprise SSO</p>
            <h1 class="text-4xl sm:text-5xl font-extrabold text-surface-900 dark:text-white mb-4">${title}</h1>
            <p class="text-lg text-surface-600 dark:text-surface-300 max-w-2xl" data-i18n="tools.saml-decoder.ui.desc12">Paste a Base64 SAML response or raw XML to inspect issuers, subjects, attributes, and validity windows instantly—no network requests.</p>
          </div>
          <div class="flex flex-col gap-3 text-sm text-surface-600 dark:text-surface-300">
             <div class="flex items-center gap-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-2xl px-4 py-3">
               <span class="text-xl">🔐</span>
               <div>
                 <p class="font-semibold" data-i18n="tools.saml-decoder.ui.heading11">Client-side only</p>
                 <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.saml-decoder.ui.desc13">Nothing leaves your browser.</p>
               </div>
             </div>
             <div class="flex items-center gap-3 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-2xl px-4 py-3">
               <span class="text-xl">⚡</span>
               <div>
                 <p class="font-semibold" data-i18n="tools.saml-decoder.ui.heading12">Redirect & POST aware</p>
                 <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.saml-decoder.ui.desc14">Base64 + optional deflate.</p>
               </div>
             </div>
          </div>
        </div>
      </header>

      <section class="grid gap-6 lg:grid-cols-2">
        <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-6 space-y-4">
          <div class="flex items-center justify-between">
            <label for="saml-input" class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide"><span data-i18n="tools.saml-decoder.ui.label7">SAML response</span> ${infoHint('Paste Base64 SAMLResponse or raw XML; toggle inflate for redirect payloads.')}</label>
            <button id="clear-btn" type="button" class="btn btn-ghost btn-sm"><span data-i18n="tools.saml-decoder.ui.button0">Clear</span></button>
          </div>
          <textarea id="saml-input" data-tooltip="Paste Base64-encoded SAML request or response" data-i18n-tooltip="tools.saml-decoder.ui.tip0" class="w-full min-h-[220px] rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 px-4 py-3 font-mono text-sm text-surface-900 dark:text-surface-100" placeholder="Paste the Base64 value of SAMLResponse or raw XML here" data-i18n-placeholder="tools.saml-decoder.ui.placeholder8"></textarea>
          <div class="flex flex-wrap gap-4 text-sm text-surface-600 dark:text-surface-400">
            <label class="inline-flex items-center gap-2">
              <input id="inflate-toggle" type="checkbox" data-tooltip="Decompress deflated SAML messages" data-i18n-tooltip="tools.saml-decoder.ui.tip1" class="accent-purple-600" checked />
              <span>Attempt to inflate (Redirect binding)</span>
            </label>
            <label class="inline-flex items-center gap-2">
              <input id="pretty-toggle" type="checkbox" data-tooltip="Format XML output with indentation" data-i18n-tooltip="tools.saml-decoder.ui.tip2" class="accent-purple-600" checked />
              <span>Pretty-print XML</span>
            </label>
          </div>
          <div class="flex flex-wrap gap-3">
             <button id="decode-btn" data-tooltip="Decode and parse the SAML message" data-i18n-tooltip="tools.saml-decoder.ui.tip3" class="btn btn-primary"><span data-i18n="tools.saml-decoder.ui.button7">Decode response</span><span aria-hidden="true">→</span></button>
             <button id="sample-btn" type="button" class="btn btn-secondary"><span data-i18n="tools.saml-decoder.ui.button1">Load sample</span></button>
          </div>
           <div id="saml-error" role="alert" class="hidden rounded-2xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/30 text-sm text-error-700 dark:text-error-200 px-4 py-3" data-i18n="tools.saml-decoder.ui.error0">Parsing error</div>
        </div>

        <div class="space-y-6">
          <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-surface-900 dark:text-white" data-i18n="tools.saml-decoder.ui.heading9">Quick summary</h2>
              <span id="validity-badge" class="text-xs font-semibold px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300" data-i18n="tools.saml-decoder.ui.desc15">Awaiting input</span>
            </div>
            <div class="space-y-2 text-sm text-surface-600 dark:text-surface-300">
              <div class="flex justify-between"><span class="font-semibold">Issuer</span><span id="summary-issuer">—</span></div>
              <div class="flex justify-between"><span class="font-semibold">Subject</span><span id="summary-subject">—</span></div>
              <div class="flex justify-between"><span class="font-semibold">Destination</span><span id="summary-destination">—</span></div>
              <div class="flex justify-between"><span class="font-semibold">Audience</span><span id="summary-audience">—</span></div>
              <div class="flex justify-between"><span class="font-semibold">Signature</span><span id="summary-signature">—</span></div>
              <div class="flex justify-between"><span class="font-semibold">Status</span><span id="summary-status">—</span></div>
            </div>
          </div>

          <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-surface-900 dark:text-white" data-i18n="tools.saml-decoder.ui.heading10">Attributes</h2>
              <button id="copy-attributes" class="btn btn-ghost btn-xs" disabled><span data-i18n="tools.saml-decoder.ui.button2">Copy JSON</span></button>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <tbody id="attribute-body" class="divide-y divide-surface-100 dark:divide-surface-800 text-surface-700 dark:text-surface-200">
                  <tr><td class="py-2 text-surface-500 dark:text-surface-400">Decoded attributes will appear here.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section id="decoded-panel" class="hidden space-y-6">
        <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-6">
          <div class="flex flex-wrap gap-3 border-b border-surface-200 dark:border-surface-800 pb-3 mb-4" role="tablist">
            <button class="tab-button active" data-panel="xml"><span data-i18n="tools.saml-decoder.ui.button3">Pretty XML</span></button>
            <button class="tab-button" data-panel="assertion"><span data-i18n="tools.saml-decoder.ui.button4">Assertion details</span></button>
            <button class="tab-button" data-panel="json"><span data-i18n="tools.saml-decoder.ui.button5">Claims JSON</span></button>
          </div>
          <div id="panel-xml" class="tab-panel space-y-3">
            <div class="flex justify-end"><button id="copy-xml" class="btn btn-ghost btn-xs"><span data-i18n="tools.saml-decoder.ui.button6">Copy XML</span></button></div>
            <pre id="xml-output" class="bg-surface-900 text-surface-100 p-4 rounded-2xl overflow-x-auto text-sm">—</pre>
          </div>
          <div id="panel-assertion" class="tab-panel hidden space-y-3 text-sm text-surface-700 dark:text-surface-200">
            <div class="grid gap-4">
              <div>
                <p class="font-semibold">Assertion ID</p>
                <p id="assertion-id" class="text-surface-500 dark:text-surface-400">—</p>
              </div>
              <div>
                <p class="font-semibold">Authn context</p>
                <p id="assertion-authn" class="text-surface-500 dark:text-surface-400">—</p>
              </div>
              <div>
                <p class="font-semibold">Conditions</p>
                <p id="assertion-conditions" class="text-surface-500 dark:text-surface-400">—</p>
              </div>
            </div>
          </div>
          <div id="panel-json" class="tab-panel hidden">
            <div class="flex justify-end mb-2"><button id="copy-json" class="btn btn-ghost btn-xs"><span data-i18n="tools.saml-decoder.ui.button2">Copy JSON</span></button></div>
            <pre id="json-output" class="bg-surface-900 text-surface-100 p-4 rounded-2xl overflow-x-auto text-sm">—</pre>
          </div>
        </div>
      </section>

      ${createCheatsheet('saml-decoder', 'SAML Quick Reference', [
        { heading: 'SAML Flow', content: '<p>1. User requests resource → 2. SP sends AuthnRequest to IdP → 3. IdP authenticates user → 4. IdP sends Response with Assertion → 5. SP grants access</p>' },
        { heading: 'Key Elements', content: `
          <table>
            <tr><th data-i18n="tools.saml-decoder.ui.th1">Element</th><th data-i18n="tools.saml-decoder.ui.th2">Purpose</th></tr>
            <tr><td><code>AuthnRequest</code></td><td>SP → IdP login request</td></tr>
            <tr><td><code>Response</code></td><td>IdP → SP with assertions</td></tr>
            <tr><td><code>Assertion</code></td><td>Claims about the user</td></tr>
            <tr><td><code>NameID</code></td><td>User identifier</td></tr>
            <tr><td><code>Attribute</code></td><td>User properties (email, role)</td></tr>
          </table>` }
      ])}
    </main>
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'What is SAML?',
          content: `
            <p>Security Assertion Markup Language (SAML) is an XML-based open standard for exchanging authentication and authorization data between parties, in particular, between an Identity Provider (IdP) and a Service Provider (SP). SAML is the backbone of many Enterprise Single Sign-On (SSO) solutions, allowing users to access multiple applications with a single set of credentials.</p>
            <p>The most common version is SAML 2.0, which uses security tokens containing "assertions" to pass information about a principal (usually a user) between the IdP and the SP.</p>
          `
        },
        {
          title: 'How to Use This Tool',
          content: `
            <ol>
              <li><strong>Paste your payload:</strong> Copy the Base64-encoded SAMLResponse or raw XML and paste it into the input field.</li>
              <li><strong>Configure options:</strong> Toggle "Attempt to inflate" if you are decoding a Redirect binding payload (which is often compressed).</li>
              <li><strong>Decode:</strong> Click "Decode response" to parse the message.</li>
              <li><strong>Review Summary:</strong> Check the "Quick summary" for the Issuer, Subject, and validity status.</li>
              <li><strong>Inspect Attributes:</strong> View the decoded user attributes (email, roles, etc.) in the Attributes table.</li>
              <li><strong>Explore Details:</strong> Use the tabs below to see the Pretty XML, Assertion details, or a JSON representation of the claims.</li>
            </ol>
          `
        },
        {
          title: 'Common Use Cases',
          content: `
            <ul>
              <li><strong>SSO Troubleshooting:</strong> Diagnosing why a user cannot log in by checking for expired assertions or audience mismatches.</li>
              <li><strong>Integration Testing:</strong> Verifying that your Identity Provider is sending the correct attributes required by your application.</li>
              <li><strong>Security Auditing:</strong> Inspecting the raw XML to ensure that assertions are properly signed and encrypted where necessary.</li>
              <li><strong>Development:</strong> Quickly viewing the contents of a SAML message during the development of a Service Provider integration.</li>
            </ul>
          `
        },
        {
          title: 'Pro Tips',
          content: `
            <ul>
              <li><strong>Redirect vs. POST:</strong> SAML messages sent via HTTP-Redirect are usually deflated (compressed) before being Base64 encoded. If your decode fails, try toggling the "Attempt to inflate" checkbox.</li>
              <li><strong>Check the Audience:</strong> Ensure the <code>AudienceRestriction</code> matches your SP's Entity ID. This is a common cause of "Invalid SAML" errors.</li>
              <li><strong>Clock Skew:</strong> If a response is marked as invalid, check the <code>NotBefore</code> and <code>NotOnOrAfter</code> times. Small differences between the IdP and SP clocks can cause valid assertions to be rejected.</li>
            </ul>
          `
        }
      ], 'saml-decoder')}
    ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const script = `
    <script src="/vendor/pako.min.js"></script>
    <script>
      (function () {
        var samlInput = document.getElementById('saml-input');
        var decodeBtn = document.getElementById('decode-btn');
        var clearBtn = document.getElementById('clear-btn');
        var sampleBtn = document.getElementById('sample-btn');
        var inflateToggle = document.getElementById('inflate-toggle');
        var prettyToggle = document.getElementById('pretty-toggle');
        var samlError = document.getElementById('saml-error');
        var decodedPanel = document.getElementById('decoded-panel');
        var validityBadge = document.getElementById('validity-badge');
        var attributeBody = document.getElementById('attribute-body');
        var xmlOutput = document.getElementById('xml-output');
        var assertionId = document.getElementById('assertion-id');
        var assertionAuthn = document.getElementById('assertion-authn');
        var assertionConditions = document.getElementById('assertion-conditions');
        var jsonOutput = document.getElementById('json-output');

        // Minimal sample SAML response (Base64-encoded)
        var SAMPLE_SAML = 'PHNhbWxwOlJlc3BvbnNlIHhtbG5zOnNhbWxwPSJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6cHJvdG9jb2wiIHhtbG5zOnNhbWw9InVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDphc3NlcnRpb24iIElEPSJfcmVzcG9uc2UxMjMiIFZlcnNpb249IjIuMCIgSXNzdWVJbnN0YW50PSIyMDI0LTAxLTAxVDEyOjAwOjAwWiIgRGVzdGluYXRpb249Imh0dHBzOi8vc3AuZXhhbXBsZS5jb20vYWNzIj48c2FtbDpJc3N1ZXI+aHR0cHM6Ly9pZHAuZXhhbXBsZS5jb208L3NhbWw6SXNzdWVyPjxzYW1scDpTdGF0dXM+PHNhbWxwOlN0YXR1c0NvZGUgVmFsdWU9InVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDpzdGF0dXM6U3VjY2VzcyIvPjwvc2FtbHA6U3RhdHVzPjxzYW1sOkFzc2VydGlvbiBJRD0iX2Fzc2VydGlvbjQ1NiIgVmVyc2lvbj0iMi4wIiBJc3N1ZUluc3RhbnQ9IjIwMjQtMDEtMDFUMTI6MDA6MDBaIj48c2FtbDpJc3N1ZXI+aHR0cHM6Ly9pZHAuZXhhbXBsZS5jb208L3NhbWw6SXNzdWVyPjxzYW1sOlN1YmplY3Q+PHNhbWw6TmFtZUlEIEZvcm1hdD0idXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6MS4xOm5hbWVpZC1mb3JtYXQ6ZW1haWxBZGRyZXNzIj51c2VyQGV4YW1wbGUuY29tPC9zYW1sOk5hbWVJRD48L3NhbWw6U3ViamVjdD48c2FtbDpDb25kaXRpb25zIE5vdEJlZm9yZT0iMjAyNC0wMS0wMVQxMTo1NTowMFoiIE5vdE9uT3JBZnRlcj0iMjAyNC0wMS0wMVQxMzowMDowMFoiPjxzYW1sOkF1ZGllbmNlUmVzdHJpY3Rpb24+PHNhbWw6QXVkaWVuY2U+aHR0cHM6Ly9zcC5leGFtcGxlLmNvbTwvc2FtbDpBdWRpZW5jZT48L3NhbWw6QXVkaWVuY2VSZXN0cmljdGlvbj48L3NhbWw6Q29uZGl0aW9ucz48c2FtbDpBdXRoblN0YXRlbWVudCBBdXRobkluc3RhbnQ9IjIwMjQtMDEtMDFUMTI6MDA6MDBaIj48c2FtbDpBdXRobkNvbnRleHQ+PHNhbWw6QXV0aG5Db250ZXh0Q2xhc3NSZWY+dXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6Mi4wOmFjOmNsYXNzZXM6UGFzc3dvcmQ8L3NhbWw6QXV0aG5Db250ZXh0Q2xhc3NSZWY+PC9zYW1sOkF1dGhuQ29udGV4dD48L3NhbWw6QXV0aG5TdGF0ZW1lbnQ+PHNhbWw6QXR0cmlidXRlU3RhdGVtZW50PjxzYW1sOkF0dHJpYnV0ZSBOYW1lPSJlbWFpbCIgTmFtZUZvcm1hdD0idXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6Mi4wOmF0dHJuYW1lLWZvcm1hdDpiYXNpYyI+PHNhbWw6QXR0cmlidXRlVmFsdWU+dXNlckBleGFtcGxlLmNvbTwvc2FtbDpBdHRyaWJ1dGVWYWx1ZT48L3NhbWw6QXR0cmlidXRlPjxzYW1sOkF0dHJpYnV0ZSBOYW1lPSJyb2xlcyIgTmFtZUZvcm1hdD0idXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6Mi4wOmF0dHJuYW1lLWZvcm1hdDpiYXNpYyI+PHNhbWw6QXR0cmlidXRlVmFsdWU+YWRtaW48L3NhbWw6QXR0cmlidXRlVmFsdWU+PHNhbWw6QXR0cmlidXRlVmFsdWU+dXNlcjwvc2FtbDpBdHRyaWJ1dGVWYWx1ZT48L3NhbWw6QXR0cmlidXRlPjwvc2FtbDpBdHRyaWJ1dGVTdGF0ZW1lbnQ+PC9zYW1sOkFzc2VydGlvbj48L3NhbWxwOlJlc3BvbnNlPg==';

        function escapeHtml(str) {
          return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        }

        function showError(msg) {
          samlError.textContent = msg;
          samlError.classList.remove('hidden');
          decodedPanel.classList.add('hidden');
        }

        function hideError() {
          samlError.classList.add('hidden');
        }

        function decodeBase64(str) {
          // Normalize URL-safe base64 and strip whitespace
          var cleaned = str.replace(/[\\r\\n\\s]/g, '').replace(/-/g, '+').replace(/_/g, '/');
          var pad = cleaned.length % 4;
          if (pad) cleaned += '='.repeat(4 - pad);
          var binary = atob(cleaned);
          var bytes = new Uint8Array(binary.length);
          for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          return bytes;
        }

        function bytesToString(bytes) {
          return new TextDecoder('utf-8').decode(bytes);
        }

        function tryInflate(bytes) {
          if (window.pako) {
            try {
              return bytesToString(window.pako.inflateRaw(bytes));
            } catch (e) {
              // not deflated, fall through
            }
            try {
              return bytesToString(window.pako.inflate(bytes));
            } catch (e) {
              // not zlib deflated either
            }
          }
          return null;
        }

        function resolveXml(input) {
          var trimmed = input.trim();

          // Already raw XML
          if (trimmed.startsWith('<')) return trimmed;

          var bytes = decodeBase64(trimmed);
          var asString = bytesToString(bytes);

          // Decoded bytes might be raw XML already
          if (asString.trimStart().startsWith('<')) {
            return asString;
          }

          // Try inflate if toggle is on
          if (inflateToggle.checked) {
            var inflated = tryInflate(bytes);
            if (inflated && inflated.trimStart().startsWith('<')) return inflated;
          }

          // Last try: plain text from decoded bytes
          if (asString.trimStart().startsWith('<')) return asString;

          throw new Error(window._t ? window._t('tools.saml-decoder.js.err0', 'Could not decode input as SAML XML. Try toggling the inflate option.') : 'Could not decode input as SAML XML. Try toggling the inflate option.');
        }

        function prettyPrintXml(xml) {
          var indent = 0;
          var result = '';
          var lines = xml
            .replace(/></g, '>\\n<')
            .split('\\n');

          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;
            if (line.startsWith('</')) {
              indent = Math.max(0, indent - 1);
            }
            result += '  '.repeat(indent) + line + '\\n';
            if (!line.startsWith('</') && !line.endsWith('/>') && line.startsWith('<') && !line.includes('</')) {
              indent++;
            }
          }
          return result.trim();
        }

        function getTagText(doc, localName) {
          var els = doc.getElementsByTagNameNS('*', localName);
          if (!els.length) {
            // fallback without namespace
            var fallback = doc.getElementsByTagName(localName);
            if (fallback.length) return fallback[0].textContent.trim();
            return null;
          }
          return els[0].textContent.trim();
        }

        function getAttr(el, name) {
          if (!el) return null;
          return el.getAttribute(name) || el.getAttributeNS(null, name) || null;
        }

        function findElements(doc, localName) {
          var result = [];
          var byNs = doc.getElementsByTagNameNS('*', localName);
          if (byNs.length) {
            for (var i = 0; i < byNs.length; i++) result.push(byNs[i]);
          } else {
            var byTag = doc.getElementsByTagName(localName);
            for (var j = 0; j < byTag.length; j++) result.push(byTag[j]);
          }
          return result;
        }

        function extractSamlData(doc, rawXml) {
          var data = {};

          // Issuer (outermost, from Response)
          var issuers = findElements(doc, 'Issuer');
          data.issuer = issuers.length ? issuers[0].textContent.trim() : '—';

          // Subject / NameID
          var nameIds = findElements(doc, 'NameID');
          data.subject = nameIds.length ? nameIds[0].textContent.trim() : '—';

          // Destination from Response element
          var responseEls = findElements(doc, 'Response');
          data.destination = responseEls.length ? (getAttr(responseEls[0], 'Destination') || '—') : '—';

          // Audience
          var audiences = findElements(doc, 'Audience');
          data.audience = audiences.length ? audiences[0].textContent.trim() : '—';

          // Signature presence
          var sigs = findElements(doc, 'Signature');
          data.signature = sigs.length ? (window._t ? window._t('tools.saml-decoder.js.present', 'Present') : 'Present') : (window._t ? window._t('tools.saml-decoder.js.absent', 'Absent') : 'Absent');

          // Status
          var statusCodes = findElements(doc, 'StatusCode');
          if (statusCodes.length) {
            var val = getAttr(statusCodes[0], 'Value') || '';
            data.status = val.split(':').pop() || val || '—';
          } else {
            data.status = '—';
          }

          // Assertion ID
          var assertions = findElements(doc, 'Assertion');
          data.assertionId = assertions.length ? (getAttr(assertions[0], 'ID') || '—') : '—';

          // AuthnContextClassRef
          var authnRefs = findElements(doc, 'AuthnContextClassRef');
          data.authnContext = authnRefs.length ? authnRefs[0].textContent.trim() : '—';

          // Conditions
          var condEls = findElements(doc, 'Conditions');
          if (condEls.length) {
            var notBefore = getAttr(condEls[0], 'NotBefore') || '';
            var notAfter = getAttr(condEls[0], 'NotOnOrAfter') || '';
            data.notBefore = notBefore || '—';
            data.notOnOrAfter = notAfter || '—';
            data.conditionsText = (notBefore ? 'NotBefore: ' + notBefore : '') +
              (notBefore && notAfter ? ' | ' : '') +
              (notAfter ? 'NotOnOrAfter: ' + notAfter : '') || '—';
          } else {
            data.notBefore = '—';
            data.notOnOrAfter = '—';
            data.conditionsText = '—';
          }

          // Validity check
          data.isValid = false;
          data.isExpired = false;
          if (data.notOnOrAfter !== '—') {
            var expiry = new Date(data.notOnOrAfter);
            var now = new Date();
            data.isExpired = now > expiry;
            data.isValid = !data.isExpired;
          }

          // Attributes
          data.attributes = [];
          var attrEls = findElements(doc, 'Attribute');
          for (var i = 0; i < attrEls.length; i++) {
            var attrEl = attrEls[i];
            var attrName = getAttr(attrEl, 'Name') || getAttr(attrEl, 'FriendlyName') || 'Attribute';
            var valueEls = findElements(attrEl, 'AttributeValue');
            var values = [];
            for (var v = 0; v < valueEls.length; v++) {
              values.push(valueEls[v].textContent.trim());
            }
            data.attributes.push({ name: attrName, values: values });
          }

          return data;
        }

        function buildClaimsJson(samlData) {
          var obj = {
            issuer: samlData.issuer,
            subject: samlData.subject,
            destination: samlData.destination,
            audience: samlData.audience,
            status: samlData.status,
            assertionId: samlData.assertionId,
            authnContext: samlData.authnContext,
            conditions: {
              notBefore: samlData.notBefore,
              notOnOrAfter: samlData.notOnOrAfter
            },
            attributes: {}
          };
          samlData.attributes.forEach(function (attr) {
            obj.attributes[attr.name] = attr.values.length === 1 ? attr.values[0] : attr.values;
          });
          return obj;
        }

        function renderSummary(samlData) {
          document.getElementById('summary-issuer').textContent = samlData.issuer;
          document.getElementById('summary-subject').textContent = samlData.subject;
          document.getElementById('summary-destination').textContent = samlData.destination;
          document.getElementById('summary-audience').textContent = samlData.audience;
          document.getElementById('summary-signature').textContent = samlData.signature;
          document.getElementById('summary-status').textContent = samlData.status;

          if (samlData.isExpired) {
            validityBadge.textContent = window._t ? window._t('tools.saml-decoder.js.expired', 'Expired') : 'Expired';
            validityBadge.className = 'text-xs font-semibold px-3 py-1 rounded-full bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-200';
          } else if (samlData.isValid) {
            validityBadge.textContent = window._t ? window._t('tools.saml-decoder.js.valid', 'Valid') : 'Valid';
            validityBadge.className = 'text-xs font-semibold px-3 py-1 rounded-full bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-200';
          } else {
            validityBadge.textContent = window._t ? window._t('tools.saml-decoder.js.decoded', 'Decoded') : 'Decoded';
            validityBadge.className = 'text-xs font-semibold px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200';
          }
        }

        function renderAttributes(samlData) {
          if (!samlData.attributes.length) {
            attributeBody.innerHTML = '<tr><td class="py-2 text-surface-500 dark:text-surface-400">' + (window._t ? window._t('tools.saml-decoder.js.noAttrs', 'No attributes found.') : 'No attributes found.') + '</td></tr>';
            document.getElementById('copy-attributes').disabled = true;
            return;
          }
          var rows = samlData.attributes.map(function (attr) {
            return '<tr class="border-t border-surface-100 dark:border-surface-800">' +
              '<td class="py-2 pr-4 font-mono text-xs text-surface-700 dark:text-surface-200 align-top">' + escapeHtml(attr.name) + '</td>' +
              '<td class="py-2 font-mono text-xs text-surface-700 dark:text-surface-200">' + escapeHtml(attr.values.join(', ')) + '</td>' +
              '</tr>';
          });
          attributeBody.innerHTML = rows.join('');
          document.getElementById('copy-attributes').disabled = false;
        }

        function renderTabs(xmlString, samlData) {
          var displayXml = prettyToggle.checked ? prettyPrintXml(xmlString) : xmlString;
          xmlOutput.textContent = displayXml;

          assertionId.textContent = samlData.assertionId;
          assertionAuthn.textContent = samlData.authnContext;
          assertionConditions.textContent = samlData.conditionsText;

          jsonOutput.textContent = JSON.stringify(buildClaimsJson(samlData), null, 2);
        }

        function switchTab(panel) {
          document.querySelectorAll('.tab-button').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.panel === panel);
          });
          document.querySelectorAll('.tab-panel').forEach(function (p) {
            p.classList.toggle('hidden', p.id !== 'panel-' + panel);
          });
        }

        function handleDecode() {
          var raw = samlInput.value.trim();
          if (!raw) {
            showError(window._t ? window._t('tools.saml-decoder.js.err1', 'Please paste a SAML response or raw XML.') : 'Please paste a SAML response or raw XML.');
            return;
          }

          hideError();

          var xmlString;
          try {
            xmlString = resolveXml(raw);
          } catch (err) {
            showError(err.message);
            return;
          }

          var parser = new DOMParser();
          var doc = parser.parseFromString(xmlString, 'application/xml');
          var parseError = doc.querySelector('parsererror');
          if (parseError) {
            showError(window._t ? window._t('tools.saml-decoder.js.err2', 'Invalid XML: ') + parseError.textContent.slice(0, 120) : 'Invalid XML: ' + parseError.textContent.slice(0, 120));
            return;
          }

          var samlData = extractSamlData(doc, xmlString);
          renderSummary(samlData);
          renderAttributes(samlData);
          renderTabs(xmlString, samlData);

          decodedPanel.classList.remove('hidden');
          switchTab('xml');
          window._samlDecoded = { xml: xmlString, data: samlData };
        }

        // Tab switching
        document.querySelectorAll('.tab-button').forEach(function (btn) {
          btn.addEventListener('click', function () {
            switchTab(btn.dataset.panel);
          });
        });

        // Copy XML
        document.getElementById('copy-xml').addEventListener('click', function () {
          var text = xmlOutput.textContent;
          navigator.clipboard.writeText(text).then(function () {
            if (window.Toast) window.Toast.success(window._t ? window._t('common.copied', 'Copied!') : 'Copied!');
          });
        });

        // Copy JSON
        document.getElementById('copy-json').addEventListener('click', function () {
          var text = jsonOutput.textContent;
          navigator.clipboard.writeText(text).then(function () {
            if (window.Toast) window.Toast.success(window._t ? window._t('common.copied', 'Copied!') : 'Copied!');
          });
        });

        // Copy Attributes JSON
        document.getElementById('copy-attributes').addEventListener('click', function () {
          if (!window._samlDecoded) return;
          var obj = {};
          window._samlDecoded.data.attributes.forEach(function (attr) {
            obj[attr.name] = attr.values.length === 1 ? attr.values[0] : attr.values;
          });
          navigator.clipboard.writeText(JSON.stringify(obj, null, 2)).then(function () {
            if (window.Toast) window.Toast.success(window._t ? window._t('common.copied', 'Copied!') : 'Copied!');
          });
        });

        // Decode button
        decodeBtn.addEventListener('click', handleDecode);

        // Clear button
        clearBtn.addEventListener('click', function () {
          samlInput.value = '';
          hideError();
          decodedPanel.classList.add('hidden');
          validityBadge.textContent = window._t ? window._t('tools.saml-decoder.ui.desc15', 'Awaiting input') : 'Awaiting input';
          validityBadge.className = 'text-xs font-semibold px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300';
          document.getElementById('summary-issuer').textContent = '—';
          document.getElementById('summary-subject').textContent = '—';
          document.getElementById('summary-destination').textContent = '—';
          document.getElementById('summary-audience').textContent = '—';
          document.getElementById('summary-signature').textContent = '—';
          document.getElementById('summary-status').textContent = '—';
          attributeBody.innerHTML = '<tr><td class="py-2 text-surface-500 dark:text-surface-400">Decoded attributes will appear here.</td></tr>';
          document.getElementById('copy-attributes').disabled = true;
          window._samlDecoded = null;
          samlInput.focus();
        });

        // Sample button
        sampleBtn.addEventListener('click', function () {
          samlInput.value = SAMPLE_SAML;
          inflateToggle.checked = false;
          handleDecode();
        });
      })();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: '/saml-decoder',
    content,
    scripts: script,
    lang: currentLang
  });
}
