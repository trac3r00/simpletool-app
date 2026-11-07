/**
 * SAML Response Decoder
 * Decode Base64/deflated SAML payloads entirely in-browser
 */

import { respondHTML, respondJSON } from "../utils/respond.js";
import {
  createPageTemplate,
  createCheatsheet,
  infoHint, createToolHeader } from "../utils/common-ui.js";
import {
  createEducationalSection,
  createRelatedToolsSection,
} from "../utils/content-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import {
  checkSamlTimeWindow,
  diagnoseSaml,
  extractSamlPayload,
  formatSamlKeyFields,
  prettyPrintSamlXml,
} from "../utils/saml-logic.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";

export async function handleSamlDecoderRoutes(request, url) {
  const { pathname } = url;

  if (pathname === "/saml-decoder" || pathname === "/saml-decoder/") {
    if (request.method === "GET") {
      return respondHTML(
        renderSamlDecoderPage(resolveRequestLanguage(request, url)),
      );
    }

    return respondJSON({ error: "Method not allowed" }, { status: 405 });
  }

  return null;
}

function renderSamlDecoderPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("saml-decoder", currentLang);
  const title = translation?.name || "SAML Decoder";
  const description =
    translation?.desc || "Decode SAML requests and responses.";

  const currentTool = TOOLS.find((t) => t.id === "saml-decoder");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">
      ${createToolHeader(
        { emoji: "🛡️" },
        title,
        "Paste a Base64 SAML response or raw XML to inspect issuers, subjects, attributes, and validity windows instantly\u2014no network requests.",
        [
          {
            text: "Client-side only",
            i18nKey: "tools.saml-decoder.ui.heading11",
            tooltip:
              "Processed in your browser, not sent to our servers.",
            tooltipI18nKey: "tools.saml-decoder.ui.r65_1",
          },
          {
            text: "Redirect & POST aware",
            i18nKey: "tools.saml-decoder.ui.heading12",
          },
        ],
        {
          toolId: "saml-decoder",
          subtitleI18nKey: "tools.saml-decoder.ui.desc12",
        },
      )}

      <section class="grid gap-6 lg:grid-cols-2">
        <div class="tool-group p-6 space-y-4">
          <div class="flex items-center justify-between">
            <label for="saml-input" class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide"><span data-i18n="tools.saml-decoder.ui.label7">SAML response</span> ${infoHint("Paste Base64 SAMLResponse or raw XML; toggle inflate for redirect payloads.", undefined, { i18nKey: "tools.saml-decoder.ui.r65_2", ariaI18nKey: "tools.saml-decoder.ui.r65_0" })}</label>
            <button id="clear-btn" type="button" class="btn btn-ghost btn-sm"><span data-i18n="tools.saml-decoder.ui.button0">Clear</span></button>
          </div>
          <textarea id="saml-input" data-tooltip="Paste Base64-encoded SAML request or response" data-i18n-tooltip="tools.saml-decoder.ui.r65_3" class="input-mono w-full min-h-[220px]" placeholder="Paste the Base64 value of SAMLResponse or raw XML here" data-i18n-placeholder="tools.saml-decoder.ui.placeholder8"></textarea>
          <div class="flex flex-wrap gap-4 text-sm text-surface-600 dark:text-surface-400">
            <label class="inline-flex items-center gap-2">
              <input id="inflate-toggle" type="checkbox" data-tooltip="Decompress deflated SAML messages" data-i18n-tooltip="tools.saml-decoder.ui.r65_4" class="accent-primary-600" checked />
              <span data-i18n="tools.saml-decoder.ui.r6_0">Attempt to inflate (Redirect binding)</span>
            </label>
            <label class="inline-flex items-center gap-2">
              <input id="pretty-toggle" type="checkbox" data-tooltip="Format XML output with indentation" data-i18n-tooltip="tools.saml-decoder.ui.r65_5" class="accent-primary-600" checked />
              <span data-i18n="tools.saml-decoder.ui.r6_1">Pretty-print XML</span>
            </label>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label for="expected-entity-id" class="label" data-i18n="tools.saml-decoder.ui.r3_6">Expected SP entity ID (optional)</label>
              <input id="expected-entity-id" type="text" class="input w-full" placeholder="https://sp.example.com" autocomplete="off" spellcheck="false" />
            </div>
            <div>
              <label for="expected-acs-url" class="label" data-i18n="tools.saml-decoder.ui.r3_7">Expected ACS URL (optional)</label>
              <input id="expected-acs-url" type="text" class="input w-full" placeholder="https://sp.example.com/acs" autocomplete="off" spellcheck="false" />
            </div>
          </div>
          <div class="flex flex-wrap gap-3">
             <button id="decode-btn" data-tooltip="Decode and parse the SAML message" data-i18n-tooltip="tools.saml-decoder.ui.r65_6" class="btn btn-primary"><span data-i18n="tools.saml-decoder.ui.button7">Decode response</span><span aria-hidden="true">→</span></button>
             <button id="sample-btn" type="button" class="btn btn-secondary"><span data-i18n="tools.saml-decoder.ui.button1">Load sample</span></button>
          </div>
           <div id="saml-error" role="alert" class="hidden rounded-xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/30 text-sm text-error-700 dark:text-error-200 px-4 py-3" data-i18n="tools.saml-decoder.ui.error0">Parsing error</div>
        </div>

        <div id="saml-summary-pane" class="space-y-6 hidden">
          <div class="tool-group p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-surface-900 dark:text-white" data-i18n="tools.saml-decoder.ui.heading9">Quick summary</h2>
              <span id="validity-badge" class="text-xs font-semibold px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300" data-i18n="tools.saml-decoder.ui.desc15">Awaiting input</span>
            </div>
            <div class="space-y-2 text-sm text-surface-600 dark:text-surface-300">
              <div class="flex justify-between"><span data-i18n="tools.saml-decoder.ui.r6_2" class="font-semibold">Issuer</span><span id="summary-issuer">—</span></div>
              <div class="flex justify-between"><span data-i18n="tools.saml-decoder.ui.r6_3" class="font-semibold">Subject</span><span id="summary-subject">—</span></div>
              <div class="flex justify-between"><span data-i18n="tools.saml-decoder.ui.r6_4" class="font-semibold">Destination</span><span id="summary-destination">—</span></div>
              <div class="flex justify-between"><span data-i18n="tools.saml-decoder.ui.r6_5" class="font-semibold">Audience</span><span id="summary-audience">—</span></div>
              <div class="flex justify-between"><span data-i18n="tools.saml-decoder.ui.r6_6" class="font-semibold">Signature</span><span id="summary-signature">—</span></div>
              <div class="flex justify-between"><span data-i18n="tools.saml-decoder.ui.r6_7" class="font-semibold">Status</span><span id="summary-status">—</span></div>
            </div>
          </div>

          <div class="tool-group p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-surface-900 dark:text-white" data-i18n="tools.saml-decoder.ui.heading10">Attributes</h2>
              <button id="copy-attributes" class="btn btn-ghost btn-xs" disabled><span data-i18n="tools.saml-decoder.ui.button2">Copy JSON</span></button>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <tbody id="attribute-body" class="divide-y divide-surface-100 dark:divide-surface-800 text-surface-700 dark:text-surface-200">
                  <tr><td class="py-2 text-surface-500 dark:text-surface-400" data-i18n="tools.saml-decoder.ui.r3_15">Decoded attributes will appear here.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section id="saml-analysis" class="hidden grid gap-6 lg:grid-cols-2">
        <div class="tool-group p-6">
          <h2 class="text-lg font-bold text-surface-900 dark:text-white mb-4" data-i18n="tools.saml-decoder.ui.r3_11">Key fields</h2>
          <dl id="key-fields" class="divide-y divide-surface-100 dark:divide-surface-800 text-sm"></dl>
        </div>
        <div class="tool-group p-6">
          <h2 class="text-lg font-bold text-surface-900 dark:text-white mb-1" data-i18n="tools.saml-decoder.ui.r3_12">Diagnostics</h2>
          <p class="text-xs text-surface-500 dark:text-surface-400 mb-4" data-i18n="tools.saml-decoder.ui.r3_14">Checked against your clock, plus the expected SP values if you entered them. Signatures are detected, not verified.</p>
          <ul id="diagnostics-list" class="space-y-3 text-sm"></ul>
        </div>
      </section>

      <section id="decoded-panel" class="hidden space-y-6">
        <div class="tool-group p-6">
          <div class="tabs-list flex flex-wrap gap-3 border-b border-surface-200 dark:border-surface-800 pb-3 mb-4" role="tablist">
            <button type="button" role="tab" id="tab-xml" aria-controls="panel-xml" aria-selected="true" class="tab-trigger tab-button active" data-panel="xml"><span data-i18n="tools.saml-decoder.ui.button3">Pretty XML</span></button>
            <button type="button" role="tab" id="tab-assertion" aria-controls="panel-assertion" aria-selected="false" class="tab-trigger tab-button" data-panel="assertion"><span data-i18n="tools.saml-decoder.ui.button4">Assertion details</span></button>
            <button type="button" role="tab" id="tab-json" aria-controls="panel-json" aria-selected="false" class="tab-trigger tab-button" data-panel="json"><span data-i18n="tools.saml-decoder.ui.button5">Claims JSON</span></button>
          </div>
          <div id="panel-xml" role="tabpanel" aria-labelledby="tab-xml" class="tab-panel space-y-3">
            <div class="flex justify-end"><button id="copy-xml" class="btn btn-ghost btn-xs"><span data-i18n="tools.saml-decoder.ui.button6">Copy XML</span></button></div>
            <pre id="xml-output" class="bg-surface-900 text-surface-100 p-4 rounded-xl overflow-x-auto text-sm">—</pre>
          </div>
          <div id="panel-assertion" role="tabpanel" aria-labelledby="tab-assertion" class="tab-panel hidden space-y-3 text-sm text-surface-700 dark:text-surface-200">
            <div class="grid gap-4">
              <div>
                <p data-i18n="tools.saml-decoder.ui.r6_8" class="font-semibold">Assertion ID</p>
                <p id="assertion-id" class="text-surface-500 dark:text-surface-400">—</p>
              </div>
              <div>
                <p data-i18n="tools.saml-decoder.ui.r6_9" class="font-semibold">Authn context</p>
                <p id="assertion-authn" class="text-surface-500 dark:text-surface-400">—</p>
              </div>
              <div>
                <p data-i18n="tools.saml-decoder.ui.r6_10" class="font-semibold">Conditions</p>
                <p id="assertion-conditions" class="text-surface-500 dark:text-surface-400">—</p>
              </div>
            </div>
          </div>
          <div id="panel-json" role="tabpanel" aria-labelledby="tab-json" class="tab-panel hidden">
            <div class="flex justify-end mb-2"><button id="copy-json" class="btn btn-ghost btn-xs"><span data-i18n="tools.saml-decoder.ui.button2">Copy JSON</span></button></div>
            <pre id="json-output" class="bg-surface-900 text-surface-100 p-4 rounded-xl overflow-x-auto text-sm">—</pre>
          </div>
        </div>
      </section>

      <section class="tool-group p-6" aria-labelledby="common-saml-errors">
        <h2 id="common-saml-errors" class="text-lg font-bold text-surface-900 dark:text-white mb-4" data-i18n="tools.saml-decoder.ui.r3_13">Common SAML errors</h2>
        <div data-i18n-aria="tools.saml-decoder.ui.r6_11" class="overflow-x-auto" tabindex="0" role="region" aria-label="SAML error causes and fixes table">
          <table class="min-w-full text-sm text-left">
            <thead class="text-surface-600 dark:text-surface-300">
              <tr><th scope="col" class="py-2 pr-4" data-i18n="tools.saml-decoder.ui.r3_8">Error</th><th scope="col" class="py-2 pr-4" data-i18n="tools.saml-decoder.ui.r3_9">Cause</th><th scope="col" class="py-2" data-i18n="tools.saml-decoder.ui.r3_10">Fix</th></tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800 text-surface-700 dark:text-surface-200 align-top">
              <tr><td data-i18n="tools.saml-decoder.ui.r6_12" class="py-2 pr-4 font-semibold">Clock skew / NotOnOrAfter</td><td data-i18n="tools.saml-decoder.ui.r6_13" class="py-2 pr-4">The SP's clock is outside the assertion's NotBefore (inclusive) to NotOnOrAfter (exclusive) window, often because the IdP and SP clocks disagree or the response was replayed late.</td><td data-i18n="tools.saml-decoder.ui.r6_14" class="py-2">Sync both servers with NTP, allow a small skew tolerance on the SP, and post the response promptly.</td></tr>
              <tr><td data-i18n="tools.saml-decoder.ui.r6_15" class="py-2 pr-4 font-semibold">Audience mismatch</td><td data-i18n="tools.saml-decoder.ui.r6_16" class="py-2 pr-4">The Audience in the AudienceRestriction is not the SP's entity ID; the comparison is an exact string match.</td><td data-i18n="tools.saml-decoder.ui.r6_17" class="py-2">Make the IdP's configured audience / SP entity ID identical to the SP metadata, including scheme and trailing slash.</td></tr>
              <tr><td data-i18n="tools.saml-decoder.ui.r6_18" class="py-2 pr-4 font-semibold">Destination / Recipient mismatch</td><td data-i18n="tools.saml-decoder.ui.r6_19" class="py-2 pr-4">The Response Destination or SubjectConfirmationData Recipient differs from the ACS URL the SP believes it received on, e.g. http vs https behind a proxy.</td><td data-i18n="tools.saml-decoder.ui.r6_20" class="py-2">Register the exact ACS URL at the IdP and configure the SP to know its public URL when behind a load balancer.</td></tr>
              <tr><td data-i18n="tools.saml-decoder.ui.r6_21" class="py-2 pr-4 font-semibold">InResponseTo mismatch / unsolicited response</td><td data-i18n="tools.saml-decoder.ui.r6_22" class="py-2 pr-4">InResponseTo does not match an AuthnRequest ID the SP issued (lost session, multiple tabs), or is missing because the login was IdP-initiated.</td><td data-i18n="tools.saml-decoder.ui.r6_23" class="py-2">Keep the request ID in a session that survives the cross-site POST (SameSite cookie settings), or enable IdP-initiated login on the SP if intended.</td></tr>
              <tr><td data-i18n="tools.saml-decoder.ui.r6_24" class="py-2 pr-4 font-semibold">Invalid signature / wrong IdP certificate</td><td data-i18n="tools.saml-decoder.ui.r6_25" class="py-2 pr-4">The SP validates with a different certificate than the IdP signed with (often after certificate rotation), or the XML was modified after signing.</td><td data-i18n="tools.saml-decoder.ui.r6_26" class="py-2">Refresh the IdP metadata or signing certificate on the SP and confirm whether the Response, the Assertion, or both are expected to be signed.</td></tr>
              <tr><td data-i18n="tools.saml-decoder.ui.r6_27" class="py-2 pr-4 font-semibold">NameID format mismatch</td><td data-i18n="tools.saml-decoder.ui.r6_28" class="py-2 pr-4">The NameID Format sent (e.g. transient) differs from the NameIDPolicy the SP requested or the identifier it maps users by.</td><td data-i18n="tools.saml-decoder.ui.r6_29" class="py-2">Align the NameID format and source attribute on the IdP with what the SP expects (e.g. emailAddress or persistent).</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      ${createCheatsheet("saml-decoder", "SAML Quick Reference", [
        {
          heading: "SAML Flow",
          content:
            '<p data-i18n="tools.saml-decoder.ui.r66_c5">1. User requests resource → 2. SP sends AuthnRequest to IdP → 3. IdP authenticates user → 4. IdP sends Response with Assertion → 5. SP grants access</p>',
        },
        {
          heading: "Key Elements",
          content: `
          <table>
            <tr><th data-i18n="tools.saml-decoder.ui.th1">Element</th><th data-i18n="tools.saml-decoder.ui.th2">Purpose</th></tr>
            <tr><td><code>AuthnRequest</code></td><td data-i18n="tools.saml-decoder.ui.r66_c1">SP → IdP login request</td></tr>
            <tr><td><code>Response</code></td><td data-i18n="tools.saml-decoder.ui.r66_c2">IdP → SP with assertions</td></tr>
            <tr><td><code>Assertion</code></td><td data-i18n="tools.saml-decoder.ui.r66_c3">Claims about the user</td></tr>
            <tr><td><code>NameID</code></td><td data-i18n="tools.saml-decoder.ui.r66_c4">User identifier</td></tr>
            <tr><td><code>Attribute</code></td><td data-i18n="tools.saml-decoder.ui.r3_1">User properties (email, role)</td></tr>
          </table>`,
        },
      ])}
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection(
        [
          {
            title: "What is SAML?",
            content: `
            <p>Security Assertion Markup Language (SAML) is an XML-based open standard for exchanging authentication and authorization data between parties, in particular, between an Identity Provider (IdP) and a Service Provider (SP). SAML is the backbone of many Enterprise Single Sign-On (SSO) solutions, allowing users to access multiple applications with a single set of credentials.</p>
            <p data-i18n="tools.saml-decoder.ui.r3_2">The most common version is SAML 2.0, which uses security tokens containing "assertions" to pass information about a principal (usually a user) between the IdP and the SP.</p>
          `,
          },
          {
            title: "How to Use This Tool",
            content: `
            <ol>
              <li><strong>Paste your payload:</strong> Copy the Base64-encoded SAMLResponse or raw XML and paste it into the input field.</li>
              <li><strong>Configure options:</strong> Toggle "Attempt to inflate" if you are decoding a Redirect binding payload (which is often compressed).</li>
              <li><strong>Decode:</strong> Click "Decode response" to parse the message.</li>
              <li><strong>Review Summary:</strong> Check the "Quick summary" for the Issuer, Subject, and validity status.</li>
              <li><strong>Inspect Attributes:</strong> View the decoded user attributes (email, roles, etc.) in the Attributes table.</li>
              <li><strong data-i18n="tools.saml-decoder.ui.r3_3">Explore Details:</strong> Use the tabs below to see the Pretty XML, Assertion details, or a JSON representation of the claims.</li>
            </ol>
          `,
          },
          {
            title: "Common Use Cases",
            content: `
            <ul>
              <li><strong>SSO Troubleshooting:</strong> Diagnosing why a user cannot log in by checking for expired assertions or audience mismatches.</li>
              <li><strong>Integration Testing:</strong> Verifying that your Identity Provider is sending the correct attributes required by your application.</li>
              <li><strong>Security Auditing:</strong> Inspecting the raw XML to ensure that assertions are properly signed and encrypted where necessary.</li>
              <li><strong data-i18n="tools.saml-decoder.ui.r3_4">Development:</strong> Quickly viewing the contents of a SAML message during the development of a Service Provider integration.</li>
            </ul>
          `,
          },
          {
            title: "Pro Tips",
            content: `
            <ul>
              <li><strong>Redirect vs. POST:</strong> SAML messages sent via HTTP-Redirect are usually deflated (compressed) before being Base64 encoded. If your decode fails, try toggling the "Attempt to inflate" checkbox.</li>
              <li><strong>Check the Audience:</strong> Ensure the <code>AudienceRestriction</code> matches your SP's Entity ID. This is a common cause of "Invalid SAML" errors.</li>
              <li><strong data-i18n="tools.saml-decoder.ui.r3_5">Clock Skew:</strong> If a response is marked as invalid, check the <code>NotBefore</code> and <code>NotOnOrAfter</code> times. Small differences between the IdP and SP clocks can cause valid assertions to be rejected.</li>
            </ul>
          `,
          },
        ],
        "saml-decoder",
        currentLang,
      )}
    ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const script = `
    <script src="/vendor/pako.min.js" integrity="sha384-SOKq5nI1KT/1aHGKGCSjD46LOyeO/LcL8TAC8JLlwecpKClaN4q2iUaJTID0OTA1" crossorigin="anonymous"></script>
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
        var samlSummaryPane = document.getElementById('saml-summary-pane');
        var validityBadge = document.getElementById('validity-badge');
        var attributeBody = document.getElementById('attribute-body');
        var xmlOutput = document.getElementById('xml-output');
        var assertionId = document.getElementById('assertion-id');
        var assertionAuthn = document.getElementById('assertion-authn');
        var assertionConditions = document.getElementById('assertion-conditions');
        var jsonOutput = document.getElementById('json-output');
        var samlAnalysis = document.getElementById('saml-analysis');
        var keyFieldsEl = document.getElementById('key-fields');
        var diagnosticsList = document.getElementById('diagnostics-list');
        var expectedEntityId = document.getElementById('expected-entity-id');
        var expectedAcsUrl = document.getElementById('expected-acs-url');

        ${checkSamlTimeWindow.toString()}
        ${formatSamlKeyFields.toString()}
        ${diagnoseSaml.toString()}
        ${extractSamlPayload.toString()}
        ${prettyPrintSamlXml.toString()}

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
          samlSummaryPane.classList.add('hidden');
          samlAnalysis.classList.add('hidden');
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
          var trimmed = extractSamlPayload(input).payload;

          // Already raw XML
          if (trimmed.startsWith('<')) return trimmed;

          var bytes;
          try {
            bytes = decodeBase64(trimmed);
          } catch (err) {
            throw new Error('Input is not valid Base64. Paste the SAMLResponse/SAMLRequest value, the whole form field, a redirect URL, or raw XML.');
          }
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

          // Validity check (NotBefore inclusive, NotOnOrAfter exclusive)
          var windowState = checkSamlTimeWindow(
            data.notBefore === '—' ? null : data.notBefore,
            data.notOnOrAfter === '—' ? null : data.notOnOrAfter,
            Date.now()
          ).state;
          data.isExpired = windowState === 'expired';
          data.isValid = windowState === 'valid';

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

        function firstText(root, localName) {
          var els = findElements(root, localName);
          var text = els.length ? els[0].textContent.trim() : '';
          return text || null;
        }

        function firstAttr(root, localName, attrName) {
          var els = findElements(root, localName);
          for (var i = 0; i < els.length; i++) {
            var value = getAttr(els[i], attrName);
            if (value) return value;
          }
          return null;
        }

        function extractKeyFields(doc) {
          var root = doc.documentElement;
          var nameIds = findElements(doc, 'NameID');
          var audiences = findElements(doc, 'Audience').map(function (el) {
            return el.textContent.trim();
          }).filter(Boolean);
          return {
            issuer: firstText(doc, 'Issuer'),
            nameId: nameIds.length ? (nameIds[0].textContent.trim() || null) : null,
            nameIdFormat: nameIds.length ? getAttr(nameIds[0], 'Format') : null,
            audiences: audiences,
            destination: getAttr(root, 'Destination'),
            recipient: firstAttr(doc, 'SubjectConfirmationData', 'Recipient'),
            inResponseTo: getAttr(root, 'InResponseTo') || firstAttr(doc, 'SubjectConfirmationData', 'InResponseTo'),
            issueInstant: getAttr(root, 'IssueInstant') || firstAttr(doc, 'Assertion', 'IssueInstant'),
            notBefore: firstAttr(doc, 'Conditions', 'NotBefore'),
            notOnOrAfter: firstAttr(doc, 'Conditions', 'NotOnOrAfter'),
            statusCode: firstAttr(doc, 'StatusCode', 'Value'),
            authnContextClassRef: firstText(doc, 'AuthnContextClassRef'),
            attributeCount: findElements(doc, 'Attribute').length,
            hasSignature: findElements(doc, 'Signature').length > 0,
            hasEncryptedAssertion: findElements(doc, 'EncryptedAssertion').length > 0
          };
        }

        function renderAnalysis() {
          if (!window._samlDecoded) return;
          var fields = window._samlDecoded.fields;
          keyFieldsEl.innerHTML = formatSamlKeyFields(fields).map(function (row) {
            var missing = row.value === 'not present';
            return '<div class="flex flex-wrap justify-between gap-x-4 py-2">' +
              '<dt class="font-semibold text-surface-700 dark:text-surface-200">' + escapeHtml(row.label) + '</dt>' +
              '<dd class="font-mono text-xs break-all ' + (missing ? 'text-surface-500 dark:text-surface-400 italic' : 'text-surface-700 dark:text-surface-200') + '">' + escapeHtml(row.value) + '</dd>' +
              '</div>';
          }).join('');

          var findings = diagnoseSaml(fields, Date.now(), {
            entityId: expectedEntityId.value,
            acsUrl: expectedAcsUrl.value
          });
          if (!findings.length) {
            diagnosticsList.innerHTML = '<li class="rounded-lg border border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-200 px-4 py-3">No problems detected by these checks.</li>';
            return;
          }
          diagnosticsList.innerHTML = findings.map(function (f) {
            var tone = f.severity === 'error'
              ? 'border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/30 text-error-700 dark:text-error-200'
              : 'border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-200';
            return '<li class="rounded-lg border px-4 py-3 ' + tone + '" data-diagnostic="' + escapeHtml(f.id) + '">' +
              '<p class="font-semibold">' + escapeHtml(f.title) + '</p>' +
              '<p class="mt-1 break-words">' + escapeHtml(f.detail) + '</p>' +
              '</li>';
          }).join('');
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
          var displayXml = prettyToggle.checked ? prettyPrintSamlXml(xmlString) : xmlString;
          xmlOutput.textContent = displayXml;

          assertionId.textContent = samlData.assertionId;
          assertionAuthn.textContent = samlData.authnContext;
          assertionConditions.textContent = samlData.conditionsText;

          jsonOutput.textContent = JSON.stringify(buildClaimsJson(samlData), null, 2);
        }

        function switchTab(panel) {
          document.querySelectorAll('.tab-button').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.panel === panel);
            btn.setAttribute('aria-selected', btn.dataset.panel === panel ? 'true' : 'false');
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
          samlSummaryPane.classList.remove('hidden');
          switchTab('xml');
          window._samlDecoded = { xml: xmlString, data: samlData, fields: extractKeyFields(doc) };
          renderAnalysis();
          samlAnalysis.classList.remove('hidden');
        }

        expectedEntityId.addEventListener('input', renderAnalysis);
        prettyToggle.addEventListener('change', function () {
          if (!window._samlDecoded) return;
          xmlOutput.textContent = prettyToggle.checked ? prettyPrintSamlXml(window._samlDecoded.xml) : window._samlDecoded.xml;
        });
        inflateToggle.addEventListener('change', function () {
          if (samlInput.value.trim()) handleDecode();
        });
        expectedAcsUrl.addEventListener('input', renderAnalysis);

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
          samlSummaryPane.classList.add('hidden');
          samlAnalysis.classList.add('hidden');
          keyFieldsEl.innerHTML = '';
          diagnosticsList.innerHTML = '';
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
    path: "/saml-decoder",
    content,
    scripts: script,
    lang: currentLang,
  });
}
