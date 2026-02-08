/**
 * SAML Response Decoder
 * Decode Base64/deflated SAML payloads entirely in-browser
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createCheatsheet, infoHint } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';

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
  const currentTool = TOOLS.find(t => t.id === 'saml-decoder');
    const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <header class="bg-white/90 dark:bg-surface-900/80 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-8">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div>
             <p class="text-xs font-semibold uppercase tracking-[0.35em] text-primary-600 dark:text-primary-300 mb-3" data-i18n="tools.saml-decoder.ui.desc11">Enterprise SSO</p>
            <h1 class="text-4xl sm:text-5xl font-extrabold text-surface-900 dark:text-white mb-4">SAML Inspector</h1>
            <p class="text-lg text-surface-600 dark:text-surface-300 max-w-2xl" data-i18n="tools.saml-decoder.ui.desc12">Paste a Base64 SAML response or raw XML to inspect issuers, subjects, attributes, and validity windows instantly—no network requests.</p>
          </div>
          <div class="flex flex-col gap-3 text-sm text-surface-600 dark:text-surface-300">
             <div class="flex items-center gap-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-2xl px-4 py-3">
               <span class="text-xl">🔐</span>
               <div>
                 <p class="font-semibold">Client-side only</p>
                 <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.saml-decoder.ui.desc13">Nothing leaves your browser.</p>
               </div>
             </div>
             <div class="flex items-center gap-3 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-2xl px-4 py-3">
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
            <button id="clear-btn" type="button" class="btn btn-ghost btn-sm"><span data-i18n="tools.saml-decoder.ui.button0">Clear</span></button>
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
             <button id="decode-btn" data-tooltip="Decode and parse the SAML message" class="btn btn-primary">Decode response<span aria-hidden="true">→</span></button>
             <button id="sample-btn" type="button" class="btn btn-secondary"><span data-i18n="tools.saml-decoder.ui.button1">Load sample</span></button>
          </div>
           <div id="saml-error" role="alert" class="hidden rounded-2xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/30 text-sm text-error-700 dark:text-error-200 px-4 py-3">Parsing error</div>
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
            <tr><th>Element</th><th>Purpose</th></tr>
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

  return createPageTemplate({
    title: 'SAML Inspector',
    description: 'Decode, pretty-print, and inspect SAML assertions client-side with attribute and validity insights.',
    path: '/saml-decoder',
    content
  });
}
