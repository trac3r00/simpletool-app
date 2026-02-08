/**
 * User-Agent Decoder Tool
 * Parse and analyze User-Agent strings to identify browser, OS, and device type
 * Perfect for log analysis and web development
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { createEducationalSection } from '../utils/content-ui.js';

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

        ${createEducationalSection([
          {
            title: 'What is a User-Agent?',
            content: 'A User-Agent is a string sent by your browser to every website you visit. It identifies the browser version, operating system, and device type, allowing servers to optimize content for your specific environment.'
          },
          {
            title: 'How to Use This Tool',
            content: 'Paste a User-Agent string into the input box or click "Use This" to analyze your current browser\'s string. The tool will break down the browser engine, OS version, and device characteristics.'
          },
          {
            title: 'Common Use Cases',
            content: 'Debugging website compatibility issues, analyzing web server logs to identify bot traffic, verifying browser spoofing, and understanding device distribution in your audience.'
          },
          {
            title: 'Pro Tips',
            content: 'Many modern browsers "freeze" or simplify their User-Agent strings to prevent fingerprinting. Always look for the "Version" or "Chrome" tokens for the most accurate version info.'
          }
        ], 'user-agent-decoder')}
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
        if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
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
