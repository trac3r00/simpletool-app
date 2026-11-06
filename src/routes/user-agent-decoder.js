/**
 * User-Agent Decoder Tool
 * Parse and analyze User-Agent strings to identify browser, OS, and device type
 * Perfect for log analysis and web development
 */

import { respondHTML, respondJSON } from "../utils/respond.js";
import { createPageTemplate, createToolHeader } from "../utils/common-ui.js";
import {
  createEducationalSection,
  createRelatedToolsSection,
} from "../utils/content-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";
import { analyzeUserAgent, detectUserAgentBot, UA_SAMPLES } from "../utils/ua-logic.js";

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderSampleLibrary() {
  const groups = [];
  for (const sample of UA_SAMPLES) {
    let group = groups.find((g) => g.name === sample.group);
    if (!group) {
      group = { name: sample.group, samples: [] };
      groups.push(group);
    }
    group.samples.push(sample);
  }
  return groups
    .map(
      (group) => `
              <div>
                <h3 class="text-xs font-semibold text-surface-700 dark:text-surface-300 mb-2">${escapeAttr(group.name)}</h3>
                <div class="flex flex-wrap gap-2">
                  ${group.samples
                    .map(
                      (s) =>
                        `<button type="button" class="sample-btn btn btn-ghost btn-xs" data-ua="${escapeAttr(s.ua)}" title="${escapeAttr(s.ua)}">${escapeAttr(s.label)}</button>`,
                    )
                    .join("\n                  ")}
                </div>
              </div>`,
    )
    .join("");
}

export async function handleUserAgentDecoderRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (
      pathname === "/user-agent-decoder" ||
      pathname === "/user-agent-decoder/"
    ) {
      if (method === "GET") {
        return renderUserAgentDecoderPage(resolveRequestLanguage(request, url));
      }
    }

    return respondJSON({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("User-Agent Decoder Route Error:", error);
    return respondJSON(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    );
  }
}

function renderUserAgentDecoderPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("user-agent-decoder", currentLang);
  const toolName = translation?.name || "User-Agent Parser";
  const toolDescription =
    translation?.desc ||
    "Parse browser, OS, and device information from User-Agent strings";
  const toolHeader = createToolHeader(
    { emoji: "🔍" },
    toolName,
    toolDescription,
    [
      {
        text: translation?.ui?.badge23 || "Log Analysis",
        color: "cyan",
        tooltip:
          "Analyze User-Agent strings and related logs entirely in your browser.",
      },
    ],
    { toolId: "user-agent-decoder" },
  );

  const currentTool = TOOLS.find((t) => t.id === "user-agent-decoder");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">

        ${toolHeader}

        <!-- Current Browser Detection -->
        <div class="mb-8 p-6 bg-gradient-to-r from-primary-50 to-surface-50 dark:from-primary-900/20 dark:to-surface-900/20 border-2 border-primary-200 dark:border-primary-800 rounded-xl">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <h2 class="text-sm font-bold text-primary-900 dark:text-primary-300 mb-2" data-i18n="tools.user-agent-decoder.ui.heading12">🌐 Your Current Browser</h2>
              <div id="current-ua" class="text-xs font-mono text-surface-700 dark:text-surface-300 bg-background p-3 rounded border border-primary-200 dark:border-primary-700 break-all"></div>
            </div>
            <button id="use-current" type="button" class="btn btn-secondary whitespace-nowrap text-sm py-2" data-tooltip="Use your current browser User-Agent string" data-i18n-tooltip="tools.user-agent-decoder.ui.tip0">
              <span data-i18n="tools.user-agent-decoder.ui.button0">Use This</span>
            </button>
        </div>
        </div>

        <div class="space-y-6">
          <div>
            <label for="ua-input" class="label" data-i18n="tools.user-agent-decoder.ui.label9">User-Agent String</label>
            <textarea id="ua-input" rows="4" class="input-mono resize-y" placeholder="Paste User-Agent string here..." data-i18n-placeholder="tools.user-agent-decoder.ui.placeholder11"></textarea>
            <p id="ua-error" class="hidden mt-2 text-sm text-danger-600 dark:text-danger-400"></p>
            <div class="flex flex-wrap gap-2 mt-3">
              <button id="parse-btn" type="button" class="btn btn-primary" data-i18n="tools.user-agent-decoder.ui.button6">🔍 Parse User-Agent</button>
              <button id="clear-btn" type="button" class="btn btn-ghost" data-i18n="tools.user-agent-decoder.ui.button7">🗑️ Clear</button>
            </div>
          </div>

          <div>
            <p class="label" data-i18n="tools.user-agent-decoder.ui.label10">Quick Examples</p>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="example-btn btn btn-ghost btn-xs" data-ua="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" data-i18n="tools.user-agent-decoder.ui.button1">Chrome on Windows</button>
              <button type="button" class="example-btn btn btn-ghost btn-xs" data-ua="Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15" data-i18n="tools.user-agent-decoder.ui.button2">Safari on macOS</button>
              <button type="button" class="example-btn btn btn-ghost btn-xs" data-ua="Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1" data-i18n="tools.user-agent-decoder.ui.button3">iPhone Safari</button>
              <button type="button" class="example-btn btn btn-ghost btn-xs" data-ua="Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.104 Mobile Safari/537.36" data-i18n="tools.user-agent-decoder.ui.button4">Android Chrome</button>
              <button type="button" class="example-btn btn btn-ghost btn-xs" data-ua="Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0" data-i18n="tools.user-agent-decoder.ui.button5">Firefox on Linux</button>
            </div>
          </div>

          <section id="ua-samples" aria-labelledby="ua-samples-heading" class="card p-4">
            <h2 id="ua-samples-heading" class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-1" data-i18n="tools.user-agent-decoder.ui.r3_1">Sample library</h2>
            <p class="text-xs text-surface-500 dark:text-surface-400 mb-3">${UA_SAMPLES.length} User-Agent strings from common browsers, crawlers, and HTTP clients. Click one to load and parse it.</p>
            <div class="space-y-3">${renderSampleLibrary()}
            </div>
          </section>

          <div id="results" class="hidden space-y-4">
            <div>
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.user-agent-decoder.ui.heading13">Parsed Information</h2>
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><dt class="text-surface-500">Browser</dt><dd id="browser-name">—</dd></div>
                <div><dt class="text-surface-500" data-i18n="tools.user-agent-decoder.ui.desc15">Version:</dt><dd id="browser-version">—</dd></div>
                <div><dt class="text-surface-500" data-i18n="tools.user-agent-decoder.ui.desc16">Engine:</dt><dd id="browser-engine">—</dd></div>
                <div><dt class="text-surface-500">OS</dt><dd id="os-name">—</dd></div>
                <div><dt class="text-surface-500">OS version</dt><dd id="os-version">—</dd></div>
                <div><dt class="text-surface-500" data-i18n="tools.user-agent-decoder.ui.desc17">Architecture:</dt><dd id="os-arch">—</dd></div>
                <div><dt class="text-surface-500">Device</dt><dd id="device-type">—</dd></div>
                <div><dt class="text-surface-500" data-i18n="tools.user-agent-decoder.ui.desc18">Vendor:</dt><dd id="device-vendor">—</dd></div>
                <div><dt class="text-surface-500" data-i18n="tools.user-agent-decoder.ui.desc19">Model:</dt><dd id="device-model">—</dd></div>
                <div><dt class="text-surface-500" data-i18n="tools.user-agent-decoder.ui.desc20">Bot/Crawler:</dt><dd id="is-bot">—</dd></div>
                <div><dt class="text-surface-500">Bot name</dt><dd id="bot-name">—</dd></div>
                <div><dt class="text-surface-500">Bot category</dt><dd id="bot-category">—</dd></div>
                <div><dt class="text-surface-500" data-i18n="tools.user-agent-decoder.ui.desc21">Mobile:</dt><dd id="is-mobile">—</dd></div>
                <div><dt class="text-surface-500" data-i18n="tools.user-agent-decoder.ui.desc22">Tablet:</dt><dd id="is-tablet">—</dd></div>
              </dl>
            </div>
            <div>
              <div class="flex items-center justify-between gap-3 mb-2">
                <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.user-agent-decoder.ui.heading14">Raw Analysis Output</h2>
                <button id="copy-analysis" type="button" class="btn btn-ghost btn-xs" data-i18n="tools.user-agent-decoder.ui.button8">Copy</button>
              </div>
              <pre id="raw-output" class="input-mono whitespace-pre-wrap break-all text-xs p-3"></pre>
            </div>
            <div>
              <div class="flex items-center justify-between gap-3 mb-2">
                <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.user-agent-decoder.ui.r3_2">JSON Output</h2>
                <button id="copy-json" type="button" class="btn btn-ghost btn-xs" data-i18n="tools.user-agent-decoder.ui.r3_0">Copy JSON</button>
              </div>
              <pre id="json-output" class="input-mono whitespace-pre-wrap break-all text-xs p-3"></pre>
            </div>
          </div>
        </div>

        ${createEducationalSection(
          [
            {
              title: "What is a User-Agent?",
              content:
                "A User-Agent is a string sent by your browser to every website you visit. It identifies the browser version, operating system, and device type, allowing servers to optimize content for your specific environment.",
            },
            {
              title: "How to Use This Tool",
              content:
                'Paste a User-Agent string into the input box or click "Use This" to analyze your current browser\'s string. The tool will break down the browser engine, OS version, and device characteristics.',
            },
            {
              title: "Common Use Cases",
              content:
                "Debugging website compatibility issues, analyzing web server logs to identify bot traffic, verifying browser spoofing, and understanding device distribution in your audience.",
            },
            {
              title: "Pro Tips",
              content:
                'Many modern browsers "freeze" or simplify their User-Agent strings to prevent fingerprinting. Always look for the "Version" or "Chrome" tokens for the most accurate version info.',
            },
          ],
          "user-agent-decoder",
          currentLang,
        )}
    ${createRelatedToolsSection(relatedToolsData)}
      </div>
    </main>

  `;

  const script = `
    <script>
      ${detectUserAgentBot.toString()}
      ${analyzeUserAgent.toString()}

      const uaInput = document.getElementById('ua-input');
      const currentUa = document.getElementById('current-ua');
      const resultsEl = document.getElementById('results');

      // Display current browser UA
      if (currentUa) currentUa.textContent = navigator.userAgent;

      // Use current UA button
      var useCurrentBtn = document.getElementById('use-current');
      if (useCurrentBtn) useCurrentBtn.addEventListener('click', () => {
        if (uaInput) uaInput.value = navigator.userAgent;
        parseUserAgent();
      });

      // Example buttons
      document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (uaInput) uaInput.value = btn.dataset.ua;
          parseUserAgent();
        });
      });

      document.querySelectorAll('.sample-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (uaInput) uaInput.value = btn.dataset.ua;
          parseUserAgent();
          if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });

      var copyJsonBtn = document.getElementById('copy-json');
      if (copyJsonBtn) copyJsonBtn.addEventListener('click', async () => {
        const jsonOutput = document.getElementById('json-output');
        if (!copyJsonBtn.dataset.label) copyJsonBtn.dataset.label = copyJsonBtn.textContent;
        const orig = copyJsonBtn.dataset.label;
        try {
          await navigator.clipboard.writeText(jsonOutput ? jsonOutput.textContent : '');
          copyJsonBtn.textContent = '✓ Copied!';
        } catch (err) {
          copyJsonBtn.textContent = 'Copy failed: select the JSON and copy manually';
        }
        setTimeout(() => copyJsonBtn.textContent = orig, 2000);
      });

      // Parse button
      var parseBtn = document.getElementById('parse-btn');
      if (parseBtn) parseBtn.addEventListener('click', parseUserAgent);

      // Clear button
      var clearBtn = document.getElementById('clear-btn');
      if (clearBtn) clearBtn.addEventListener('click', () => {
        if (uaInput) uaInput.value = '';
        if (resultsEl) resultsEl.classList.add('hidden');
      });

      // Copy analysis button
      var copyAnalysisBtn = document.getElementById('copy-analysis');
      if (copyAnalysisBtn) copyAnalysisBtn.addEventListener('click', async () => {
        const rawOutput = document.getElementById('raw-output');
        const text = rawOutput ? rawOutput.textContent : '';
        if (!copyAnalysisBtn.dataset.label) copyAnalysisBtn.dataset.label = copyAnalysisBtn.textContent;
        const orig = copyAnalysisBtn.dataset.label;
        try {
          await navigator.clipboard.writeText(text);
          copyAnalysisBtn.textContent = _t('tools.user-agent-decoder.js.text0', '✓ Copied!');
          if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
        } catch (err) {
          copyAnalysisBtn.textContent = 'Copy failed: select the text and copy manually';
        }
        setTimeout(() => copyAnalysisBtn.textContent = orig, 2000);
      });

       function parseUserAgent() {
         if (!uaInput) return;
         const ua = uaInput.value.trim();
         if (!ua) {
           document.getElementById('ua-error').textContent = _t('tools.user-agent-decoder.js.alert1', 'Please enter a User-Agent string.');
           document.getElementById('ua-error').classList.remove('hidden');
           return;
         }

         document.getElementById('ua-error').classList.add('hidden');
         const parsed = analyzeUserAgent(ua);

        // Update UI
        document.getElementById('browser-name').textContent = parsed.browser.name || 'Unknown';
        document.getElementById('browser-version').textContent = parsed.browser.version || 'Unknown';
        document.getElementById('browser-engine').textContent = parsed.browser.engine || 'Unknown';

        document.getElementById('os-name').textContent = parsed.os.name || 'Unknown';
        document.getElementById('os-version').textContent = parsed.os.version || 'Unknown';
        document.getElementById('os-arch').textContent = parsed.os.architecture || 'Unknown';

        document.getElementById('device-type').textContent = parsed.device.type || 'Unknown';
        document.getElementById('device-vendor').textContent = parsed.device.vendor || 'Unknown';
        document.getElementById('device-model').textContent = parsed.device.model || 'Unknown';

        document.getElementById('is-bot').textContent = parsed.isBot ? '✅ Yes' : '❌ No';
        document.getElementById('bot-name').textContent = parsed.bot.name || '—';
        document.getElementById('bot-category').textContent = parsed.bot.category || '—';
        document.getElementById('is-mobile').textContent = parsed.isMobile ? '✅ Yes' : '❌ No';
        document.getElementById('is-tablet').textContent = parsed.isTablet ? '✅ Yes' : '❌ No';

        // Generate raw output
        let rawOutput = '=== USER-AGENT ANALYSIS ===\\n\\n';
        rawOutput += 'Original String:\\n' + ua + '\\n\\n';
        rawOutput += '--- BROWSER ---\\n';
        rawOutput += 'Name: ' + (parsed.browser.name || 'Unknown') + '\\n';
        rawOutput += 'Version: ' + (parsed.browser.version || 'Unknown') + '\\n';
        rawOutput += 'Engine: ' + (parsed.browser.engine || 'Unknown') + '\\n';
        rawOutput += 'Engine Version: ' + (parsed.browser.engineVersion || 'Unknown') + '\\n\\n';
        rawOutput += '--- OPERATING SYSTEM ---\\n';
        rawOutput += 'Name: ' + (parsed.os.name || 'Unknown') + '\\n';
        rawOutput += 'Version: ' + (parsed.os.version || 'Unknown') + '\\n';
        rawOutput += 'Architecture: ' + (parsed.os.architecture || 'Unknown') + '\\n\\n';
        rawOutput += '--- DEVICE ---\\n';
        rawOutput += 'Type: ' + (parsed.device.type || 'Unknown') + '\\n';
        rawOutput += 'Vendor: ' + (parsed.device.vendor || 'Unknown') + '\\n';
        rawOutput += 'Model: ' + (parsed.device.model || 'Unknown') + '\\n\\n';
        rawOutput += '--- FLAGS ---\\n';
        rawOutput += 'Is Bot: ' + (parsed.isBot ? 'Yes' : 'No') + '\\n';
        rawOutput += 'Bot Name: ' + (parsed.bot.name || '-') + '\\n';
        rawOutput += 'Bot Category: ' + (parsed.bot.category || '-') + '\\n';
        rawOutput += 'Is Mobile: ' + (parsed.isMobile ? 'Yes' : 'No') + '\\n';
        rawOutput += 'Is Tablet: ' + (parsed.isTablet ? 'Yes' : 'No') + '\\n';

        document.getElementById('raw-output').textContent = rawOutput;
        document.getElementById('json-output').textContent = JSON.stringify({
          userAgent: ua,
          browser: parsed.browser,
          os: parsed.os,
          device: parsed.device,
          bot: parsed.bot,
          isMobile: parsed.isMobile,
          isTablet: parsed.isTablet
        }, null, 2);
        resultsEl.classList.remove('hidden');
      }

    </script>
  `;

  return respondHTML(
    createPageTemplate({
      title: toolName,
      description: toolDescription,
      path: "/user-agent-decoder",
      content,
      scripts: script,
      lang: currentLang,
    }),
  );
}
