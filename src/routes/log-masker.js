import { respondHTML } from "../utils/respond.js";
import { createPageTemplate, createToolHeader } from "../utils/common-ui.js";
import {
  createEducationalSection,
  createRelatedToolsSection,
} from "../utils/content-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import { createLogMasker } from "../utils/log-masker-logic.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";

export async function handleLogMaskerRoutes(request, url) {
  if (url.pathname !== "/log-masker" && url.pathname !== "/log-masker/")
    return null;
  if (request.method !== "GET") return null;
  const lang = resolveRequestLanguage(request, url);
  return renderLogMaskerPage(lang);
}

function renderLogMaskerPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("log-masker", currentLang);
  const title = "Log Masker";
  const description =
    "Redact PII and sensitive data from logs locally. Emails, IPs, and custom patterns are masked in your browser.";

  const header = createToolHeader(
    { emoji: "🎭" },
    translation?.name || title,
    translation?.desc || description,
    [
      {
        text: translation?.ui?.badge13 || "PII Redaction",
        tooltip:
          "Redact emails, IPs, credit cards, and other sensitive strings in place.",
      },
    ],
    { toolId: "log-masker" },
  );

  const currentTool = TOOLS.find((t) => t.id === "log-masker");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">
        ${header}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Input -->
        <div class="space-y-6">
          <div class="tool-group p-5">
            <div class="flex justify-between items-center mb-2">
              <label for="log-input" class="block text-sm font-medium text-surface-700 dark:text-surface-300"><span data-i18n="tools.log-masker.ui.label2">Raw Logs</span></label>
              <button id="mask-btn" data-tooltip="Redact all selected PII patterns from the input" data-i18n-tooltip="tools.log-masker.ui.tip0" class="btn btn-primary btn-sm"><span data-i18n="tools.log-masker.ui.button0">Mask Logs</span></button>
            </div>
            <textarea id="log-input" rows="15" 
              class="input-mono w-full resize-y"
              placeholder="Paste log content with PII to redact..." data-i18n-placeholder="tools.log-masker.ui.placeholder4"></textarea>
          </div>

          <div class="tool-group p-5">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.log-masker.ui.heading6">Redaction Settings</h2>
            <div class="space-y-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="mask-email" checked data-tooltip="Matches email addresses like user@domain.com" data-i18n-tooltip="tools.log-masker.ui.tip1" class="w-4 h-4 rounded border-surface-300 text-primary-600 dark:text-primary-400 focus:ring-primary-500">
                <span class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.log-masker.ui.desc8">Email Addresses</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="mask-ip" checked data-tooltip="Matches IPv4 addresses like 192.168.1.1" data-i18n-tooltip="tools.log-masker.ui.tip2" class="w-4 h-4 rounded border-surface-300 text-primary-600 dark:text-primary-400 focus:ring-primary-500">
                <span class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.log-masker.ui.desc9">IP Addresses</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="mask-credit-card" checked data-tooltip="Matches 13-19 digit card numbers that pass the Luhn check" data-i18n-tooltip="tools.log-masker.ui.tip3" class="w-4 h-4 rounded border-surface-300 text-primary-600 dark:text-primary-400 focus:ring-primary-500">
                <span class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.log-masker.ui.desc10">Credit Card Numbers</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="mask-ssn" checked class="w-4 h-4 rounded border-surface-300 text-primary-600 dark:text-primary-400 focus:ring-primary-500">
                <span class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.log-masker.ui.r3_1">US Social Security Numbers</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="mask-phone" checked class="w-4 h-4 rounded border-surface-300 text-primary-600 dark:text-primary-400 focus:ring-primary-500">
                <span class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.log-masker.ui.r3_2">Phone Numbers</span>
              </label>
              <div class="pt-2">
                <label for="custom-patterns" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1"><span data-i18n="tools.log-masker.ui.label3">Custom Keywords (comma separated)</span></label>
                <input type="text" id="custom-patterns" placeholder="api_key, secret, token" data-i18n-placeholder="tools.log-masker.ui.placeholder5" 
                  class="input w-full">
              </div>
            </div>
          </div>
        </div>

        <!-- Output -->
        <div class="tool-group p-5 flex flex-col">
           <div class="flex justify-between items-center mb-4">
             <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.log-masker.ui.heading7">Masked Logs</h2>
              <button id="copy-result-btn" type="button" class="btn btn-ghost btn-xs"><span data-i18n="tools.log-masker.ui.button1">Copy Result</span></button>
           </div>
          <div id="log-output" role="region" aria-label="Masked logs" tabindex="0" class="flex-1 bg-surface-900 text-surface-50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap overflow-y-auto min-h-[400px]" data-i18n="tools.log-masker.ui.desc11">Logs will appear here after masking...</div>
        </div>
      </div>
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection(
        [
          {
            title: "What is PII?",
            content:
              "<p>Personally Identifiable Information (PII) is any data that can be used to identify a specific individual. This includes direct identifiers like names, email addresses, and phone numbers, as well as indirect identifiers like IP addresses, physical locations, and credit card numbers. In the context of server logs, PII often appears in request parameters, headers, or error messages.</p><p>Protecting PII is a critical part of modern data security and is required by various legal frameworks around the world.</p>",
          },
          {
            title: "Compliance Requirements (GDPR/CCPA)",
            content:
              '<p>Regulations like the General Data Protection Regulation (GDPR) in Europe and the California Consumer Privacy Act (CCPA) in the United States impose strict rules on how personal data is handled. These laws require organizations to implement "privacy by design" and to minimize the collection and storage of personal data.</p><p>Sharing raw logs containing PII with third-party support teams or developers can lead to compliance violations. Masking or redacting this data before it leaves your secure environment is a key step in maintaining regulatory compliance.</p>',
          },
          {
            title: "Masking Strategies",
            content:
              "<p>There are several ways to handle sensitive data in logs:</p><ul><li><strong>Redaction:</strong> Replacing the sensitive value with a generic placeholder like <code>[EMAIL_REDACTED]</code>. This is the most common approach for sharing logs.</li><li><strong>Anonymization:</strong> Irreversibly transforming data so the individual can no longer be identified.</li><li><strong>Pseudonymization:</strong> Replacing identifiers with a consistent alias (like a hash) so you can still correlate events without knowing the user's identity.</li></ul><p>Our tool focuses on redaction, using pattern matching to find and replace common PII formats instantly.</p>",
          },
          {
            title: "Pro Tips",
            content:
              '<ul><li>Use the <strong>"Custom Keywords"</strong> field to redact internal identifiers like API keys, session tokens, or proprietary project names that aren\'t covered by standard patterns.</li><li>Always perform masking <strong>locally</strong> (as this tool does) to ensure sensitive data never touches a third-party server during the scrubbing process.</li><li>If you are correlating logs across multiple systems, consider using a consistent "salt" with a hashing tool instead of simple redaction to maintain traceability.</li><li data-i18n="tools.log-masker.ui.r3_0">Regularly audit your application code to prevent PII from being logged in the first place; "log at the source" is the best defense.</li></ul>',
          },
        ],
        "log-masker",
        currentLang,
      )}
    ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const scripts = `
      <script type="module">
      const logMasker = (${createLogMasker.toString()})();

      const logInput = document.getElementById('log-input');
      const logOutput = document.getElementById('log-output');
      const maskBtn = document.getElementById('mask-btn');
      const copyResultBtn = document.getElementById('copy-result-btn');
      
      const maskEmail = document.getElementById('mask-email');
      const maskIp = document.getElementById('mask-ip');
      const maskCc = document.getElementById('mask-credit-card');
      const maskSsn = document.getElementById('mask-ssn');
      const maskPhone = document.getElementById('mask-phone');
      const customPatterns = document.getElementById('custom-patterns');

      const placeholderText = logOutput.textContent;
      copyResultBtn.disabled = true;

      function runMask() {
        const text = logInput.value;
        if (!text) {
          logOutput.textContent = placeholderText;
          copyResultBtn.disabled = true;
          logInput.focus();
          return;
        }
        const result = logMasker.redact(text, {
          email: maskEmail.checked,
          ip: maskIp.checked,
          creditCard: maskCc.checked,
          ssn: maskSsn.checked,
          phone: maskPhone.checked,
          keywords: customPatterns.value.split(','),
        });
        logOutput.textContent = result;
        copyResultBtn.disabled = false;
      }

      maskBtn.addEventListener('click', runMask);
      logInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          runMask();
        }
      });
      [maskEmail, maskIp, maskCc, maskSsn, maskPhone].forEach((el) => el.addEventListener('change', () => {
        if (!copyResultBtn.disabled) runMask();
      }));

      copyResultBtn?.addEventListener('click', () => {
        if (copyResultBtn.disabled) return;
        copyToClipboard(logOutput.textContent || '', copyResultBtn);
      });
    </script>
  `;

  return respondHTML(
    createPageTemplate({
      title: translation?.name || title,
      description: translation?.desc || description,
      path: "/log-masker",
      content,
      scripts,
      lang: currentLang,
    }),
  );
}
