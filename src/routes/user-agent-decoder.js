/**
 * User-Agent Decoder Tool
 * Parse and analyze User-Agent strings to identify browser, OS, and device type
 * Perfect for log analysis and web development
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';

export async function handleUserAgentDecoderRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === '/user-agent-decoder' || pathname === '/user-agent-decoder/') {
      if (method === 'GET') {
        return renderUserAgentDecoderPage();
      }
    }

    return respondJSON({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('User-Agent Decoder Route Error:', error);
    return respondJSON(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function renderUserAgentDecoderPage() {
  const toolHeader = createToolHeader(
    { emoji: '🔍' },
    'User-Agent Parser',
    'Parse browser, OS, and device information from User-Agent strings',
    [{ text: 'Log Analysis', color: 'cyan', tooltip: 'Analyze User-Agent strings and related logs entirely in your browser.' }],
    { toolId: 'user-agent-decoder' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">

        ${toolHeader}

        <!-- Current Browser Detection -->
        <div class="mb-8 p-6 bg-gradient-to-r from-primary-50 to-surface-50 dark:from-primary-900/20 dark:to-surface-900/20 border-2 border-primary-200 dark:border-primary-800 rounded-xl">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <h2 class="text-sm font-bold text-primary-900 dark:text-primary-300 mb-2" data-i18n="tools.user-agent-decoder.ui.heading12">🌐 Your Current Browser</h2>
              <div id="current-ua" class="text-xs font-mono text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-950 p-3 rounded border border-primary-200 dark:border-primary-700 break-all"></div>
            </div>
            <button id="use-current" class="btn btn-secondary" data-tooltip="Use your current browser User-Agent string" whitespace-nowrap text-sm py-2">
              <span data-i18n="tools.user-agent-decoder.ui.button0">Use This</span>
            </button>
          </div>
        </div>

        <!-- Input -->
        <div class="mb-6">
          <label class="label"><span data-i18n="tools.user-agent-decoder.ui.label9">User-Agent String</span></label>
          <textarea id="ua-input" rows="4" placeholder="Paste User-Agent string here..." data-tooltip="Paste a User-Agent string from HTTP request headers" data-i18n-placeholder="tools.user-agent-decoder.ui.placeholder11" class="input resize-vertical font-mono"></textarea>
        </div>

        <!-- Common Examples -->
        <div class="mb-6">
          <label class="label"><span data-i18n="tools.user-agent-decoder.ui.label10">Quick Examples</span></label>
          <div class="flex flex-wrap gap-2">
            <button class="example-btn px-3 py-2 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 text-xs font-medium rounded-lg transition-colors" data-ua="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36">
              <span data-i18n="tools.user-agent-decoder.ui.button1">Chrome on Windows</span>
            </button>
            <button class="example-btn px-3 py-2 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 text-xs font-medium rounded-lg transition-colors" data-ua="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15">
              <span data-i18n="tools.user-agent-decoder.ui.button2">Safari on macOS</span>
            </button>
            <button class="example-btn px-3 py-2 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 text-xs font-medium rounded-lg transition-colors" data-ua="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1">
              <span data-i18n="tools.user-agent-decoder.ui.button3">iPhone Safari</span>
            </button>
            <button class="example-btn px-3 py-2 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 text-xs font-medium rounded-lg transition-colors" data-ua="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36">
              <span data-i18n="tools.user-agent-decoder.ui.button4">Android Chrome</span>
            </button>
            <button class="example-btn px-3 py-2 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 text-xs font-medium rounded-lg transition-colors" data-ua="Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/120.0">
              <span data-i18n="tools.user-agent-decoder.ui.button5">Firefox on Linux</span>
            </button>
          </div>
        </div>

         <!-- Action Buttons -->
         <div class="mb-6 flex gap-3">
           <button id="parse-btn" class="btn btn-primary" data-tooltip="Analyze and break down the User-Agent components" w-full py-3 text-lg">
             <span data-i18n="tools.user-agent-decoder.ui.button6">🔍 Parse User-Agent</span>
           </button>
           <button id="clear-btn" class="btn btn-ghost px-6 text-lg">
             <span data-i18n="tools.user-agent-decoder.ui.button7">🗑️ Clear</span>
           </button>
         </div>

         <div id="ua-error" role="alert" class="hidden mb-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-200 px-4 py-3"></div>

         <!-- Results -->
        <div id="results" class="hidden">
          <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.user-agent-decoder.ui.heading13">Parsed Information</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <!-- Browser Info -->
            <div class="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
              <h2 class="text-sm font-semibold text-primary-900 dark:text-primary-300 mb-3 flex items-center gap-2">
                <span class="text-xl">🌐</span> Browser
              </h2>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between border-b border-primary-100 dark:border-primary-800 pb-1">
                  <span class="text-surface-600 dark:text-surface-400">Name:</span>
                  <span id="browser-name" class="font-semibold text-surface-900 dark:text-surface-100">-</span>
                </div>
                <div class="flex justify-between border-b border-primary-100 dark:border-primary-800 pb-1">
                  <span class="text-surface-600 dark:text-surface-400" data-i18n="tools.user-agent-decoder.ui.desc15">Version:</span>
                  <span id="browser-version" class="font-semibold text-surface-900 dark:text-surface-100">-</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400" data-i18n="tools.user-agent-decoder.ui.desc16">Engine:</span>
                  <span id="browser-engine" class="font-semibold text-surface-900 dark:text-surface-100">-</span>
                </div>
              </div>
            </div>

            <!-- OS Info -->
            <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h2 class="text-sm font-semibold text-green-900 dark:text-green-300 mb-3 flex items-center gap-2">
                <span class="text-xl">💻</span> Operating System
              </h2>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between border-b border-green-100 dark:border-green-800 pb-1">
                  <span class="text-surface-600 dark:text-surface-400">OS:</span>
                  <span id="os-name" class="font-semibold text-surface-900 dark:text-surface-100">-</span>
                </div>
                <div class="flex justify-between border-b border-green-100 dark:border-green-800 pb-1">
                  <span class="text-surface-600 dark:text-surface-400" data-i18n="tools.user-agent-decoder.ui.desc15">Version:</span>
                  <span id="os-version" class="font-semibold text-surface-900 dark:text-surface-100">-</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400" data-i18n="tools.user-agent-decoder.ui.desc17">Architecture:</span>
                  <span id="os-arch" class="font-semibold text-surface-900 dark:text-surface-100">-</span>
                </div>
              </div>
            </div>

            <!-- Device Info -->
            <div class="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <h2 class="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
                <span class="text-xl">📱</span> Device
              </h2>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between border-b border-purple-100 dark:border-purple-800 pb-1">
                  <span class="text-surface-600 dark:text-surface-400">Type:</span>
                  <span id="device-type" class="font-semibold text-surface-900 dark:text-surface-100">-</span>
                </div>
                <div class="flex justify-between border-b border-purple-100 dark:border-purple-800 pb-1">
                  <span class="text-surface-600 dark:text-surface-400" data-i18n="tools.user-agent-decoder.ui.desc18">Vendor:</span>
                  <span id="device-vendor" class="font-semibold text-surface-900 dark:text-surface-100">-</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400" data-i18n="tools.user-agent-decoder.ui.desc19">Model:</span>
                  <span id="device-model" class="font-semibold text-surface-900 dark:text-surface-100">-</span>
                </div>
              </div>
            </div>

            <!-- Additional Info -->
            <div class="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <h2 class="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-3 flex items-center gap-2">
                <span class="text-xl">ℹ️</span> Additional Info
              </h2>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between border-b border-orange-100 dark:border-orange-800 pb-1">
                  <span class="text-surface-600 dark:text-surface-400" data-i18n="tools.user-agent-decoder.ui.desc20">Bot/Crawler:</span>
                  <span id="is-bot" class="font-semibold text-surface-900 dark:text-surface-100">-</span>
                </div>
                <div class="flex justify-between border-b border-orange-100 dark:border-orange-800 pb-1">
                  <span class="text-surface-600 dark:text-surface-400" data-i18n="tools.user-agent-decoder.ui.desc21">Mobile:</span>
                  <span id="is-mobile" class="font-semibold text-surface-900 dark:text-surface-100">-</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400" data-i18n="tools.user-agent-decoder.ui.desc22">Tablet:</span>
                  <span id="is-tablet" class="font-semibold text-surface-900 dark:text-surface-100">-</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Raw Analysis -->
          <div class="p-4 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-50" data-i18n="tools.user-agent-decoder.ui.heading14">Raw Analysis Output</h2>
              <button id="copy-analysis" class="btn btn-secondary text-xs py-1 px-3">
                <span data-i18n="tools.user-agent-decoder.ui.button8">Copy</span>
              </button>
            </div>
            <pre id="raw-output" class="text-xs font-mono text-surface-900 dark:text-surface-100 whitespace-pre-wrap overflow-x-auto max-h-96"></pre>
          </div>
        </div>

      </div>
    </main>
  `;

  const script = `
    <script>
      const uaInput = document.getElementById('ua-input');
      const currentUa = document.getElementById('current-ua');
      const resultsEl = document.getElementById('results');

      // Display current browser UA
      currentUa.textContent = navigator.userAgent;

      // Use current UA button
      document.getElementById('use-current').addEventListener('click', () => {
        uaInput.value = navigator.userAgent;
        parseUserAgent();
      });

      // Example buttons
      document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          uaInput.value = btn.dataset.ua;
          parseUserAgent();
        });
      });

      // Parse button
      document.getElementById('parse-btn').addEventListener('click', parseUserAgent);

      // Clear button
      document.getElementById('clear-btn').addEventListener('click', () => {
        uaInput.value = '';
        resultsEl.classList.add('hidden');
      });

      // Copy analysis button
      document.getElementById('copy-analysis').addEventListener('click', async () => {
        const text = document.getElementById('raw-output').textContent;
        await navigator.clipboard.writeText(text);
        const btn = document.getElementById('copy-analysis');
        const orig = btn.textContent;
        btn.textContent = _t('tools.user-agent-decoder.js.text0', '✓ Copied!');
        setTimeout(() => btn.textContent = orig, 2000);
      });

       function parseUserAgent() {
         const ua = uaInput.value.trim();
         if (!ua) {
           document.getElementById('ua-error').textContent = 'Please enter a User-Agent string.';
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

        document.getElementById('device-type').textContent = parsed.device.type || 'Desktop';
        document.getElementById('device-vendor').textContent = parsed.device.vendor || 'Unknown';
        document.getElementById('device-model').textContent = parsed.device.model || 'Unknown';

        document.getElementById('is-bot').textContent = parsed.isBot ? '✅ Yes' : '❌ No';
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
        rawOutput += 'Type: ' + (parsed.device.type || 'Desktop') + '\\n';
        rawOutput += 'Vendor: ' + (parsed.device.vendor || 'Unknown') + '\\n';
        rawOutput += 'Model: ' + (parsed.device.model || 'Unknown') + '\\n\\n';
        rawOutput += '--- FLAGS ---\\n';
        rawOutput += 'Is Bot: ' + (parsed.isBot ? 'Yes' : 'No') + '\\n';
        rawOutput += 'Is Mobile: ' + (parsed.isMobile ? 'Yes' : 'No') + '\\n';
        rawOutput += 'Is Tablet: ' + (parsed.isTablet ? 'Yes' : 'No') + '\\n';

        document.getElementById('raw-output').textContent = rawOutput;
        resultsEl.classList.remove('hidden');
      }

      function analyzeUserAgent(ua) {
        const result = {
          browser: { name: null, version: null, engine: null, engineVersion: null },
          os: { name: null, version: null, architecture: null },
          device: { type: null, vendor: null, model: null },
          isBot: false,
          isMobile: false,
          isTablet: false
        };

        // Detect bots
        const botPatterns = /bot|crawler|spider|scraper|slurp|google|bing|yahoo|duckduckgo|baidu|yandex|curl|wget|python|java|php/i;
        result.isBot = botPatterns.test(ua);

        // Detect mobile/tablet
        result.isMobile = /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        result.isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(ua);

        // Browser detection
        if (ua.includes('Edg/')) {
          result.browser.name = 'Microsoft Edge';
          result.browser.version = extractVersion(ua, /Edg\\/(\\d+\\.\\d+)/);
          result.browser.engine = 'Blink';
        } else if (ua.includes('Chrome/') && !ua.includes('Chromium')) {
          result.browser.name = 'Google Chrome';
          result.browser.version = extractVersion(ua, /Chrome\\/(\\d+\\.\\d+)/);
          result.browser.engine = 'Blink';
        } else if (ua.includes('Firefox/')) {
          result.browser.name = 'Mozilla Firefox';
          result.browser.version = extractVersion(ua, /Firefox\\/(\\d+\\.\\d+)/);
          result.browser.engine = 'Gecko';
        } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
          result.browser.name = 'Safari';
          result.browser.version = extractVersion(ua, /Version\\/(\\d+\\.\\d+)/);
          result.browser.engine = 'WebKit';
        } else if (ua.includes('OPR/') || ua.includes('Opera/')) {
          result.browser.name = 'Opera';
          result.browser.version = extractVersion(ua, /(?:OPR|Opera)\\/(\\d+\\.\\d+)/);
          result.browser.engine = 'Blink';
        }

        // Engine version
        if (result.browser.engine === 'Blink' || result.browser.engine === 'WebKit') {
          result.browser.engineVersion = extractVersion(ua, /AppleWebKit\\/(\\d+\\.\\d+)/);
        } else if (result.browser.engine === 'Gecko') {
          result.browser.engineVersion = extractVersion(ua, /rv:(\\d+\\.\\d+)/);
        }

        // OS detection
        if (ua.includes('Windows NT')) {
          result.os.name = 'Windows';
          const version = extractVersion(ua, /Windows NT (\\d+\\.\\d+)/);
          const winVersions = {
            '10.0': '10/11',
            '6.3': '8.1',
            '6.2': '8',
            '6.1': '7',
            '6.0': 'Vista',
            '5.1': 'XP'
          };
          result.os.version = winVersions[version] || version;
          result.os.architecture = ua.includes('Win64') || ua.includes('x64') ? 'x64' : 'x86';
        } else if (ua.includes('iPhone') || ua.includes('iPad')) {
          result.os.name = 'iOS';
          result.os.version = extractVersion(ua, /OS (\\d+[._]\\d+)/);
          if (result.os.version) result.os.version = result.os.version.replace(/_/g, '.');
          result.os.architecture = 'ARM';
        } else if (ua.includes('Mac OS X')) {
          result.os.name = 'macOS';
          result.os.version = extractVersion(ua, /Mac OS X (\\d+[._]\\d+(?:[._]\\d+)?)/);
          if (result.os.version) result.os.version = result.os.version.replace(/_/g, '.');
          result.os.architecture = ua.includes('Intel') ? 'Intel' : (ua.includes('ARM') || ua.includes('M1') || ua.includes('M2') ? 'ARM' : 'Unknown');
        } else if (ua.includes('Linux')) {
          result.os.name = 'Linux';
          result.os.architecture = ua.includes('x86_64') ? 'x64' : (ua.includes('aarch64') || ua.includes('arm') ? 'ARM' : 'x86');
        } else if (ua.includes('Android')) {
          result.os.name = 'Android';
          result.os.version = extractVersion(ua, /Android (\\d+(?:\\.\\d+)?)/);
          result.os.architecture = 'ARM';
        }

        // Device detection
        if (ua.includes('iPhone')) {
          result.device.type = 'Mobile';
          result.device.vendor = 'Apple';
          result.device.model = 'iPhone';
        } else if (ua.includes('iPad')) {
          result.device.type = 'Tablet';
          result.device.vendor = 'Apple';
          result.device.model = 'iPad';
        } else if (ua.includes('Android')) {
          result.device.type = result.isTablet ? 'Tablet' : 'Mobile';
          // Try to extract vendor and model from Android UA
          const androidMatch = ua.match(/Android.*; ([^)]+)\\)/);
          if (androidMatch) {
            const deviceInfo = androidMatch[1];
            const parts = deviceInfo.split(/\\s+/);
            result.device.vendor = parts[0] || 'Unknown';
            result.device.model = parts.slice(1).join(' ') || 'Unknown';
          }
        } else if (result.isMobile) {
          result.device.type = 'Mobile';
        } else if (result.isTablet) {
          result.device.type = 'Tablet';
        } else {
          result.device.type = 'Desktop';
        }

        return result;
      }

      function extractVersion(ua, regex) {
        const match = ua.match(regex);
        return match ? match[1] : null;
      }
    </script>
  `;

  return respondHTML(createPageTemplate({
    title: 'User-Agent Parser - Parse Browser & OS Information',
    description: 'Parse and analyze User-Agent strings to identify browser, OS, device type, and version. Perfect for log analysis and web development.',
    path: '/user-agent-decoder',
    content,
    scripts: script
  }));
}
