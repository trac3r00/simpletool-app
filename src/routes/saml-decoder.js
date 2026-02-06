/**
 * SAML Response Decoder
 * Decode Base64/deflated SAML payloads entirely in-browser
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createCheatsheet, infoHint } from '../utils/common-ui.js';

export async function handleSamlDecoderRoutes(request, url) {
  const { pathname } = url;

  if (pathname === '/saml-decoder' || pathname === '/saml-decoder/') {
    if (request.method === 'GET') {
      return respondHTML(renderSamlDecoderPage());
    }

    return respondJSON({ error: 'Method not allowed' }, { status: 405 });
  }

  return null;
}

function renderSamlDecoderPage() {
  const content = `
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <header class="bg-white/90 dark:bg-surface-900/80 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-8">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.35em] text-purple-600 dark:text-purple-300 mb-3" data-i18n="tools.saml-decoder.ui.desc11">Enterprise SSO</p>
            <h1 class="text-4xl sm:text-5xl font-extrabold text-surface-900 dark:text-white mb-4">SAML Inspector</h1>
            <p class="text-lg text-surface-600 dark:text-surface-300 max-w-2xl" data-i18n="tools.saml-decoder.ui.desc12">Paste a Base64 SAML response or raw XML to inspect issuers, subjects, attributes, and validity windows instantly—no network requests.</p>
          </div>
          <div class="flex flex-col gap-3 text-sm text-surface-600 dark:text-surface-300">
            <div class="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl px-4 py-3">
              <span class="text-xl">🔐</span>
              <div>
                <p class="font-semibold">Client-side only</p>
                <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.saml-decoder.ui.desc13">Nothing leaves your browser.</p>
              </div>
            </div>
            <div class="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl px-4 py-3">
              <span class="text-xl">⚡</span>
              <div>
                <p class="font-semibold">Redirect & POST aware</p>
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
            <button id="clear-btn" type="button" class="text-sm text-surface-500 dark:text-surface-400 hover:text-rose-500"><span data-i18n="tools.saml-decoder.ui.button0">Clear</span></button>
          </div>
          <textarea id="saml-input" data-tooltip="Paste Base64-encoded SAML request or response" class="w-full min-h-[220px] rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 px-4 py-3 font-mono text-sm text-surface-900 dark:text-surface-100" placeholder="Paste the Base64 value of SAMLResponse or raw XML here" data-i18n-placeholder="tools.saml-decoder.ui.placeholder8"></textarea>
          <div class="flex flex-wrap gap-4 text-sm text-surface-600 dark:text-surface-400">
            <label class="inline-flex items-center gap-2">
              <input id="inflate-toggle" type="checkbox" data-tooltip="Decompress deflated SAML messages" class="accent-purple-600" checked />
              <span>Attempt to inflate (Redirect binding)</span>
            </label>
            <label class="inline-flex items-center gap-2">
              <input id="pretty-toggle" type="checkbox" data-tooltip="Format XML output with indentation" class="accent-purple-600" checked />
              <span>Pretty-print XML</span>
            </label>
          </div>
          <div class="flex flex-wrap gap-3">
            <button id="decode-btn" data-tooltip="Decode and parse the SAML message" class="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition">Decode response<span aria-hidden="true">→</span></button>
            <button id="sample-btn" type="button" class="px-4 py-3 rounded-2xl border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-200 font-semibold hover:border-purple-500 dark:hover:border-purple-400 transition"><span data-i18n="tools.saml-decoder.ui.button1">Load sample</span></button>
          </div>
          <div id="saml-error" role="alert" class="hidden rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-200 px-4 py-3">Parsing error</div>
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
              <button id="copy-attributes" class="text-sm text-purple-600 dark:text-purple-300 hover:underline" disabled><span data-i18n="tools.saml-decoder.ui.button2">Copy JSON</span></button>
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
            <div class="flex justify-end"><button id="copy-xml" class="inline-flex items-center gap-2 text-sm text-purple-600 dark:text-purple-300 hover:underline"><span data-i18n="tools.saml-decoder.ui.button6">Copy XML</span></button></div>
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
            <div class="flex justify-end mb-2"><button id="copy-json" class="inline-flex items-center gap-2 text-sm text-purple-600 dark:text-purple-300 hover:underline"><span data-i18n="tools.saml-decoder.ui.button2">Copy JSON</span></button></div>
            <pre id="json-output" class="bg-surface-900 text-surface-100 p-4 rounded-2xl overflow-x-auto text-sm">—</pre>
          </div>
        </div>
      </section>

      ${createCheatsheet('saml-decoder', 'SAML Quick Reference', [
        { heading: 'SAML Flow', content: '<p>1. User requests resource → 2. SP sends AuthnRequest to IdP → 3. IdP authenticates user → 4. IdP sends Response with Assertion → 5. SP grants access</p>' },
        { heading: 'Key Elements', content: `
          <table>
            <tr><th>Element</th><th>Purpose</th></tr>
            <tr><td><code>AuthnRequest</code></td><td>SP → IdP login request</td></tr>
            <tr><td><code>Response</code></td><td>IdP → SP with assertions</td></tr>
            <tr><td><code>Assertion</code></td><td>Claims about the user</td></tr>
            <tr><td><code>NameID</code></td><td>User identifier</td></tr>
            <tr><td><code>Attribute</code></td><td>User properties (email, role)</td></tr>
          </table>` }
      ])}
    </main>

    <script src="/vendor/pako.min.js" integrity="sha384-rNlaE5fs9dGIjmxWDALQh/RBAaGRYT5ChrzHo6tRfgrZ36iRFAiquP5g41Jsv+0j" crossorigin="anonymous"></script>
    <script>
      (function() {
        const inputEl = document.getElementById('saml-input');
        const decodeBtn = document.getElementById('decode-btn');
        const sampleBtn = document.getElementById('sample-btn');
        const clearBtn = document.getElementById('clear-btn');
        const inflateToggle = document.getElementById('inflate-toggle');
        const prettyToggle = document.getElementById('pretty-toggle');
        const errorBox = document.getElementById('saml-error');
        const panel = document.getElementById('decoded-panel');
        const attributeBody = document.getElementById('attribute-body');
        const copyAttributesBtn = document.getElementById('copy-attributes');
        const copyXmlBtn = document.getElementById('copy-xml');
        const copyJsonBtn = document.getElementById('copy-json');
        const xmlOutput = document.getElementById('xml-output');
        const jsonOutput = document.getElementById('json-output');
        const summaryFields = {
          issuer: document.getElementById('summary-issuer'),
          subject: document.getElementById('summary-subject'),
          destination: document.getElementById('summary-destination'),
          audience: document.getElementById('summary-audience'),
          signature: document.getElementById('summary-signature'),
          status: document.getElementById('summary-status')
        };
        const validityBadge = document.getElementById('validity-badge');
        const assertionFields = {
          id: document.getElementById('assertion-id'),
          authn: document.getElementById('assertion-authn'),
          conditions: document.getElementById('assertion-conditions')
        };

        let latestJson = null;
        let latestXml = null;

        decodeBtn.addEventListener('click', handleDecode);
        sampleBtn.addEventListener('click', loadSample);
        clearBtn.addEventListener('click', () => {
          inputEl.value = '';
          panel.classList.add('hidden');
          errorBox.classList.add('hidden');
          attributeBody.innerHTML = '<tr><td class="py-2 text-surface-500">Decoded attributes will appear here.</td></tr>';
          copyAttributesBtn.disabled = true;
        });

        document.querySelectorAll('.tab-button').forEach(button => {
          button.addEventListener('click', () => switchTab(button.dataset.panel));
        });

        copyAttributesBtn.addEventListener('click', () => {
          if (!latestJson) return;
          navigator.clipboard.writeText(JSON.stringify(latestJson.attributes, null, 2));
          copyAttributesBtn.textContent = _t('tools.saml-decoder.js.text0', 'Copied!');
          setTimeout(() => copyAttributesBtn.textContent = _t('tools.saml-decoder.js.text1', 'Copy JSON'), 1500);
        });

        copyXmlBtn.addEventListener('click', () => {
          if (!latestXml) return;
          navigator.clipboard.writeText(latestXml);
          copyXmlBtn.textContent = _t('tools.saml-decoder.js.text0', 'Copied!');
          setTimeout(() => copyXmlBtn.textContent = _t('tools.saml-decoder.js.text2', 'Copy XML'), 1500);
        });

        copyJsonBtn.addEventListener('click', () => {
          if (!latestJson) return;
          navigator.clipboard.writeText(JSON.stringify(latestJson, null, 2));
          copyJsonBtn.textContent = _t('tools.saml-decoder.js.text0', 'Copied!');
          setTimeout(() => copyJsonBtn.textContent = _t('tools.saml-decoder.js.text1', 'Copy JSON'), 1500);
        });

        function handleDecode() {
          try {
            const xml = extractXml(inputEl.value.trim(), inflateToggle.checked);
            const parsed = analyzeXml(xml);
            latestJson = parsed;
            latestXml = xml;
            renderSummary(parsed);
            renderAttributes(parsed.attributes);
            renderPanels(parsed, xml);
            panel.classList.remove('hidden');
            errorBox.classList.add('hidden');
            copyAttributesBtn.disabled = parsed.attributes.length === 0;
          } catch (error) {
            showError(error.message);
          }
        }

        function showError(message) {
          errorBox.textContent = message;
          errorBox.classList.remove('hidden');
          panel.classList.add('hidden');
        }

        function extractXml(raw, allowInflate) {
          if (!raw) throw new Error('Paste a SAML response first.');
          if (raw.trim().startsWith('<')) {
            return raw.trim();
          }

          let decoded;
          try {
            const sanitized = raw.replace(/\\s+/g, '');
            decoded = atob(sanitized);
          } catch (error) {
            throw new Error('Input is not valid Base64 or XML.');
          }

          if (decoded.trim().startsWith('<')) {
            return decoded;
          }

          if (allowInflate && window.pako) {
            try {
              const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
              const inflated = window.pako.inflateRaw(bytes, { to: 'string' });
              if (inflated.trim().startsWith('<')) {
                return inflated;
              }
            } catch (error) {
              console.warn('Inflate failed:', error);
            }
          }

          throw new Error('Unable to detect XML payload. Toggle inflate if this is a Redirect binding payload.');
        }

        function analyzeXml(xml) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(xml, 'text/xml');
          if (doc.getElementsByTagName('parsererror').length) {
            throw new Error('Malformed XML detected.');
          }

          const response = doc.getElementsByTagNameNS('*', 'Response')[0];
          const assertion = doc.getElementsByTagNameNS('*', 'Assertion')[0];
          const issuer = getText(doc, 'Issuer');
          const nameId = getText(doc, 'NameID');
          const destination = response ? response.getAttribute('Destination') : null;
          const audienceNodes = Array.from(doc.getElementsByTagNameNS('*', 'Audience'));
          const audiences = audienceNodes.map(node => node.textContent.trim()).filter(Boolean);
          const attributes = Array.from(doc.getElementsByTagNameNS('*', 'Attribute')).map(mapAttribute);
          const statusCode = doc.getElementsByTagNameNS('*', 'StatusCode')[0];
          const status = statusCode ? statusCode.getAttribute('Value') : 'Unknown';
          const signaturePresent = doc.getElementsByTagNameNS('*', 'Signature').length > 0;
          const notBefore = getAttribute(assertion, 'Conditions', 'NotBefore');
          const notOnOrAfter = getAttribute(assertion, 'Conditions', 'NotOnOrAfter');
          const authnStatement = doc.getElementsByTagNameNS('*', 'AuthnStatement')[0];
          const authnInstant = authnStatement ? authnStatement.getAttribute('AuthnInstant') : null;
          const authnContext = getText(doc, 'AuthnContextClassRef');

          return {
            issuer: issuer || 'Unknown issuer',
            subject: nameId || '—',
            destination: destination || '—',
            audiences,
            status,
            signaturePresent,
            attributes,
            notBefore,
            notOnOrAfter,
            assertionId: assertion ? assertion.getAttribute('ID') : '—',
            authnInstant,
            authnContext: authnContext || '—'
          };
        }

        function mapAttribute(node) {
          const name = node.getAttribute('Name') || node.getAttribute('FriendlyName') || 'Unnamed attribute';
          const values = Array.from(node.getElementsByTagNameNS('*', 'AttributeValue')).map(v => v.textContent.trim());
          return { name, values };
        }

        function getText(doc, localName) {
          const el = doc.getElementsByTagNameNS('*', localName)[0];
          return el ? el.textContent.trim() : null;
        }

        function getAttribute(assertion, nodeName, attr) {
          if (!assertion) return null;
          const node = assertion.getElementsByTagNameNS('*', nodeName)[0];
          return node ? node.getAttribute(attr) : null;
        }

        function renderSummary(data) {
          summaryFields.issuer.textContent = data.issuer;
          summaryFields.subject.textContent = data.subject;
          summaryFields.destination.textContent = data.destination;
          summaryFields.audience.textContent = data.audiences.length ? data.audiences[0] : '—';
          summaryFields.signature.textContent = data.signaturePresent ? 'Embedded signature found' : 'No signature element';
          summaryFields.status.textContent = data.status;

          const validity = describeValidity(data.notBefore, data.notOnOrAfter);
          validityBadge.textContent = validity.label;
          validityBadge.className = 'text-xs font-semibold px-3 py-1 rounded-full ' + validity.className;
        }

        function describeValidity(notBefore, notAfter) {
          if (!notBefore && !notAfter) {
            return { label: 'No conditions', className: 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300' };
          }
          const now = Date.now();
          const start = notBefore ? Date.parse(notBefore) : null;
          const end = notAfter ? Date.parse(notAfter) : null;
          if (start && now < start) {
            return { label: 'Not yet valid', className: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200' };
          }
          if (end && now >= end) {
            return { label: 'Expired', className: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200' };
          }
          return { label: 'Currently valid', className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200' };
        }

        function renderAttributes(attributes) {
          if (!attributes.length) {
            attributeBody.innerHTML = '<tr><td class="py-2 text-surface-500">No AttributeStatement elements were found.</td></tr>';
            return;
          }
          attributeBody.innerHTML = attributes.map(attr => {
            const value = attr.values.length ? attr.values.join(', ') : '—';
            return '<tr><td class="py-2 pr-4 font-semibold">' + escapeHtml(attr.name) + '</td><td class="py-2 text-surface-600 dark:text-surface-300">' + escapeHtml(value) + '</td></tr>';
          }).join('');
        }

        function renderPanels(data, xml) {
          const prettyXml = prettyToggle.checked ? formatXml(xml) : xml;
          xmlOutput.textContent = prettyXml;
          jsonOutput.textContent = JSON.stringify(data, null, 2);
          assertionFields.id.textContent = data.assertionId || '—';
          assertionFields.authn.textContent = data.authnContext || data.authnInstant || '—';
          assertionFields.conditions.textContent = buildConditionText(data.notBefore, data.notOnOrAfter, data.audiences);
        }

        function buildConditionText(notBefore, notAfter, audiences) {
          const parts = [];
          if (notBefore) parts.push('NotBefore: ' + notBefore);
          if (notAfter) parts.push('NotOnOrAfter: ' + notAfter);
          if (audiences && audiences.length) parts.push('AudienceRestriction: ' + audiences.join(', '));
          return parts.length ? parts.join(' \u2022 ') : '—';
        }

        function switchTab(panelName) {
          document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.panel === panelName);
          });
          document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('hidden', panel.id !== 'panel-' + panelName);
          });
        }

        function formatXml(xml) {
          try {
            const PADDING = '  ';
            const reg = /(>)(<)(\\/*)/g;
            let formatted = '';
            let pad = 0;
            xml = xml.replace(reg, '$1\\n$2$3');
            xml.split('\\n').forEach((node) => {
              if (node.match(/^<\\//)) pad -= 1;
              formatted += PADDING.repeat(Math.max(pad, 0)) + node + '\\n';
              if (node.match(/^<[^!?][^>]*[^\\/]>/)) pad += 1;
            });
            return formatted.trim();
          } catch (error) {
            return xml;
          }
        }

        function escapeHtml(value) {
          if (value === null || value === undefined) {
            return '';
          }
          return String(value).replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
        }

        function loadSample() {
          const sample = 'PD94bWwgdmVyc2lvbj0iMS4wIj8+PHNhbWxwOlJlc3BvbnNlIElEPSJpZC0xMjMiIERlc3RpbmF0aW9uPSJodHRwczovL2FwcC5leGFtcGxlLmNvbS9hY2MvbG9naW4iIElzc3VlSW5zdGFudD0iMjAyNS0wMS0wMVQxMjowMDowMFoiIHhtbG5zOnNhbWxwPSJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6cHJvdG9jb2wiIHhtbG5zOnNhbWw9InVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDphc3NlcnRpb24iPjxzYW1sOklzc3VlciB4bWxucz0idXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6Mi4wOmFzc2VydGlvbiI+aHR0cHM6Ly9pZHAuZXhhbXBsZS5jb20vPC9zYW1sOklzc3Vlcj48c2FtbDpTdWJqZWN0PjxzYW1sOk5hbWVJRCBGb3JtYXQ9ImVtYWlsQWRkcmVzcyI+dXNlckBleGFtcGxlLmNvbTwvc2FtbDpOYW1lSUQ+PC9zYW1sOlN1YmplY3Q+PHNhbWw6QXR0cmlidXRlU3RhdGVtZW50PjxzYW1sOkF0dHJpYnV0ZSBOYW1lPSJyb2xlIj48c2FtbDpBdHRyaWJ1dGVWYWx1ZT5BZG1pbjwvc2FtbDpBdHRyaWJ1dGVWYWx1ZT48L3NhbWw6QXR0cmlidXRlPjxzYW1sOkF0dHJpYnV0ZSBOYW1lPSJ1c2VybmFtZSI+PHNhbWw6QXR0cmlidXRlVmFsdWU+amRvZTwvc2FtbDpBdHRyaWJ1dGVWYWx1ZT48L3NhbWw6QXR0cmlidXRlPjwvc2FtbDpBdHRyaWJ1dGVTdGF0ZW1lbnQ+PC9zYW1scDpSZXNwb25zZT4=';
          inputEl.value = sample;
        }
      })();
    </script>
  `;

  return createPageTemplate({
    title: 'SAML Inspector',
    description: 'Decode, pretty-print, and inspect SAML assertions client-side with attribute and validity insights.',
    path: '/saml-decoder',
    content
  });
}
