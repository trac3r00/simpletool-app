import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, getCopyToClipboardScript } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';

export async function handleLogMaskerRoutes(request, url) {
  if (url.pathname !== '/log-masker' && url.pathname !== '/log-masker/') return null;
  if (request.method !== 'GET') return null;

  const title = 'Log Masker';
  const description = 'Redact PII and sensitive data from logs locally. Emails, IPs, and custom patterns are masked in your browser.';

  const header = createToolHeader(
    { emoji: '🎭' },
    title,
    'Ensure privacy by scrubbing sensitive information from your logs before sharing. No data is sent to any server.',
    [{ text: 'PII Redaction', tooltip: 'Redact emails, IPs, credit cards, and other sensitive strings in place.' },
     { text: 'Local Only', tooltip: 'Runs entirely in the browser — no data is sent to any server.' },
     { text: 'Secure', tooltip: 'Masks sensitive fields before displaying results to keep logs private.' }],
    { toolId: 'log-masker' }
  );

  const currentTool = TOOLS.find(t => t.id === 'log-masker');
    const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];


  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      ${header}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Input -->
        <div class="space-y-6">
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <div class="flex justify-between items-center mb-2">
              <label for="log-input" class="block text-sm font-medium text-surface-700 dark:text-surface-300"><span data-i18n="tools.log-masker.ui.label2">Raw Logs</span></label>
              <button id="mask-btn" data-tooltip="Redact all selected PII patterns from the input" class="btn btn-primary btn-sm"><span data-i18n="tools.log-masker.ui.button0">Mask Logs</span></button>
            </div>
            <textarea id="log-input" rows="15" 
              class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm text-surface-900 dark:text-white resize-y"
              placeholder="Paste log content with PII to redact..." data-i18n-placeholder="tools.log-masker.ui.placeholder4"></textarea>
          </div>

          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.log-masker.ui.heading6">Redaction Settings</h2>
            <div class="space-y-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="mask-email" checked data-tooltip="Matches email addresses like user@domain.com" class="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500">
                <span class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.log-masker.ui.desc8">Email Addresses</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="mask-ip" checked data-tooltip="Matches IPv4 addresses like 192.168.1.1" class="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500">
                <span class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.log-masker.ui.desc9">IP Addresses</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="mask-credit-card" checked data-tooltip="Matches 16-digit credit card numbers" class="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500">
                <span class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.log-masker.ui.desc10">Credit Card Numbers</span>
              </label>
              <div class="pt-2">
                <label for="custom-patterns" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1"><span data-i18n="tools.log-masker.ui.label3">Custom Keywords (comma separated)</span></label>
                <input type="text" id="custom-patterns" placeholder="api_key, secret, token" data-i18n-placeholder="tools.log-masker.ui.placeholder5" 
                  class="w-full p-2 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
              </div>
            </div>
          </div>
        </div>

        <!-- Output -->
        <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5 flex flex-col">
           <div class="flex justify-between items-center mb-4">
             <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.log-masker.ui.heading7">Masked Logs</h2>
              <button id="copy-result-btn" type="button" class="btn btn-ghost btn-xs"><span data-i18n="tools.log-masker.ui.button1">Copy Result</span></button>
           </div>
          <div id="log-output" class="flex-1 bg-surface-900 text-surface-50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap overflow-y-auto min-h-[400px]">Logs will appear here after masking...</div>
        </div>
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'What is PII?',
          content: '<p>Personally Identifiable Information (PII) is any data that can be used to identify a specific individual. This includes direct identifiers like names, email addresses, and phone numbers, as well as indirect identifiers like IP addresses, physical locations, and credit card numbers. In the context of server logs, PII often appears in request parameters, headers, or error messages.</p><p>Protecting PII is a critical part of modern data security and is required by various legal frameworks around the world.</p>'
        },
        {
          title: 'Compliance Requirements (GDPR/CCPA)',
          content: '<p>Regulations like the General Data Protection Regulation (GDPR) in Europe and the California Consumer Privacy Act (CCPA) in the United States impose strict rules on how personal data is handled. These laws require organizations to implement "privacy by design" and to minimize the collection and storage of personal data.</p><p>Sharing raw logs containing PII with third-party support teams or developers can lead to compliance violations. Masking or redacting this data before it leaves your secure environment is a key step in maintaining regulatory compliance.</p>'
        },
        {
          title: 'Masking Strategies',
          content: '<p>There are several ways to handle sensitive data in logs:</p><ul><li><strong>Redaction:</strong> Replacing the sensitive value with a generic placeholder like <code>[EMAIL_REDACTED]</code>. This is the most common approach for sharing logs.</li><li><strong>Anonymization:</strong> Irreversibly transforming data so the individual can no longer be identified.</li><li><strong>Pseudonymization:</strong> Replacing identifiers with a consistent alias (like a hash) so you can still correlate events without knowing the user\'s identity.</li></ul><p>Our tool focuses on redaction, using pattern matching to find and replace common PII formats instantly.</p>'
        },
        {
          title: 'Pro Tips',
          content: '<ul><li>Use the <strong>"Custom Keywords"</strong> field to redact internal identifiers like API keys, session tokens, or proprietary project names that aren\'t covered by standard patterns.</li><li>Always perform masking <strong>locally</strong> (as this tool does) to ensure sensitive data never touches a third-party server during the scrubbing process.</li><li>If you are correlating logs across multiple systems, consider using a consistent "salt" with a hashing tool instead of simple redaction to maintain traceability.</li><li>Regularly audit your application code to prevent PII from being logged in the first place; "log at the source" is the best defense.</li></ul>'
        }
      ], 'log-masker')}
    ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

   const scripts = `
     ${getCopyToClipboardScript()}
     <script type="module">
      // Local PII redaction implementation
      function redactPII(text, options = {}) {
        let result = text;

        // Redaction patterns
        const patterns = {
          email: {
            regex: /\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g,
            replacement: '[EMAIL_REDACTED]'
          },
          ipv4: {
            regex: /\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b/g,
            replacement: '[IP_REDACTED]'
          },
          creditCard: {
            regex: /\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b/g,
            replacement: '[CARD_REDACTED]'
          },
          ssn: {
            regex: /\\b\\d{3}-\\d{2}-\\d{4}\\b/g,
            replacement: '[SSN_REDACTED]'
          },
          phone: {
            regex: /\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b/g,
            replacement: '[PHONE_REDACTED]'
          }
        };

        // Apply enabled patterns
        if (options.email !== false) {
          result = result.replace(patterns.email.regex, patterns.email.replacement);
        }
        if (options.ip !== false) {
          result = result.replace(patterns.ipv4.regex, patterns.ipv4.replacement);
        }
        if (options.creditCard !== false) {
          result = result.replace(patterns.creditCard.regex, patterns.creditCard.replacement);
        }
        if (options.ssn !== false) {
          result = result.replace(patterns.ssn.regex, patterns.ssn.replacement);
        }
        if (options.phone !== false) {
          result = result.replace(patterns.phone.regex, patterns.phone.replacement);
        }

        return result;
      }

      const logInput = document.getElementById('log-input');
      const logOutput = document.getElementById('log-output');
      const maskBtn = document.getElementById('mask-btn');
      const copyResultBtn = document.getElementById('copy-result-btn');
      
      const maskEmail = document.getElementById('mask-email');
      const maskIp = document.getElementById('mask-ip');
      const maskCc = document.getElementById('mask-credit-card');
      const customPatterns = document.getElementById('custom-patterns');

      maskBtn.addEventListener('click', async () => {
        const text = logInput.value;
        if (!text) return;

        logOutput.textContent = _t('tools.log-masker.js.text0', 'Masking...');
        
        try {
          // Build options from checkboxes
          const options = {
            email: maskEmail.checked,
            ip: maskIp.checked,
            creditCard: maskCc.checked
          };

          let result = redactPII(text, options);

          // Apply custom simple redaction for keywords
          const keywords = customPatterns.value.split(',').map(s => s.trim()).filter(Boolean);
          if (keywords.length > 0) {
            keywords.forEach(kw => {
              const regex = new RegExp(kw, 'gi');
              result = result.replace(regex, '[REDACTED]');
            });
          }

          logOutput.textContent = result;
        } catch (e) {
          logOutput.textContent = 'Error masking logs: ' + e.message;
        }
      });

      copyResultBtn?.addEventListener('click', () => {
        const text = logOutput.textContent || '';
        copyToClipboard(text, copyResultBtn);
      });
    </script>
  `;

  return respondHTML(createPageTemplate({
    title,
    description,
    path: '/log-masker',
    content,
    scripts
  }));
}
