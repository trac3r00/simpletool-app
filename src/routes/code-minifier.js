/**
 * Code Minifier & Beautifier Tool
 * Minify and beautify JavaScript, CSS, HTML, and JSON code
 * All processing happens client-side
 */

import { createPageTemplate, createToolHeader, getCopyToClipboardScript, getDownloadFileScript } from '../utils/common-ui.js';
import { respondHTML } from '../utils/respond.js';

/**
 * Render the Code Minifier page
 */
function renderCodeMinifierPage() {
  const toolHeader = createToolHeader(
    { emoji: '📦' },
    'Code Minifier',
    'Minify and beautify JavaScript, CSS, HTML, and JSON code with one click. Optimize your code for production or improve readability.',
    [{ text: 'Client-Side Only', tooltip: 'Runs entirely in your browser using Web APIs — your code never leaves your device.' }],
    { toolId: 'code-minifier' }
  );

  const pageContent = `

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}

      <!-- Language Tabs -->
      <div class="flex justify-center mb-6 border-b-2 border-surface-200 dark:border-surface-700">
        <div class="flex gap-2">
          <button class="language-tab active" data-lang="javascript" data-tooltip="Minify JavaScript code"><span data-i18n="tools.code-minifier.ui.button0">JavaScript</span></button>
          <button class="language-tab" data-lang="css" data-tooltip="Minify CSS stylesheets">CSS</button>
          <button class="language-tab" data-lang="html" data-tooltip="Minify HTML markup">HTML</button>
          <button class="language-tab" data-lang="json" data-tooltip="Format or minify JSON data">JSON</button>
        </div>
      </div>

      <!-- Mode Selection -->
      <div class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button id="minify-btn" class="mode-btn btn btn-primary active" data-tooltip="Remove whitespace and shorten code for production">
            <span data-i18n="tools.code-minifier.ui.button1">🗜️ Minify Code</span>
          </button>
          <button id="beautify-btn" class="mode-btn btn btn-secondary" data-tooltip="Add indentation and formatting for readability">
            <span data-i18n="tools.code-minifier.ui.button2">✨ Beautify Code</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Input -->
        <div>
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.code-minifier.ui.heading8">📝 Input Code</h2>
            <button id="clear-input-btn" class="btn btn-ghost text-sm">
              <span data-i18n="tools.code-minifier.ui.button3">🗑️ Clear</span>
            </button>
          </div>

          <textarea id="input-code" class="code-editor w-full p-4 border-2 border-surface-300 dark:border-surface-700 rounded-lg bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 resize-vertical" placeholder="Paste your code here..." data-i18n-placeholder="tools.code-minifier.ui.placeholder6"></textarea>

          <div class="mt-3 text-sm text-surface-600 dark:text-surface-400">
            <span id="input-size">Size: 0 bytes</span>
          </div>
        </div>

        <!-- Output -->
        <div>
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.code-minifier.ui.heading9">✅ Output Code</h2>
            <div class="flex gap-2">
              <button id="copy-output-btn" class="btn btn-primary text-sm">
                <span data-i18n="tools.code-minifier.ui.button4">📋 Copy</span>
              </button>
              <button id="download-output-btn" class="btn btn-secondary text-sm">
                <span data-i18n="tools.code-minifier.ui.button5">💾 Download</span>
              </button>
            </div>
          </div>

          <textarea id="output-code" class="code-editor w-full p-4 border-2 border-surface-300 dark:border-surface-700 rounded-lg bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 resize-vertical" readonly placeholder="Output will appear here..." data-i18n-placeholder="tools.code-minifier.ui.placeholder7"></textarea>

          <div id="output-stats" class="mt-3 text-sm text-surface-600 dark:text-surface-400 hidden">
            <span id="output-size"></span>
            <span id="reduction" class="ml-4 font-semibold"></span>
          </div>
        </div>
      </div>

      <!-- Info -->
      <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
          <h3 class="font-bold text-surface-900 dark:text-surface-100 mb-2" data-i18n="tools.code-minifier.ui.heading10">🗜️ Minification</h3>
          <p class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.code-minifier.ui.desc13">
            Removes whitespace, comments, and optimizes code for smaller file sizes. Perfect for production.
          </p>
        </div>

        <div class="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
          <h3 class="font-bold text-surface-900 dark:text-surface-100 mb-2" data-i18n="tools.code-minifier.ui.heading11">✨ Beautification</h3>
          <p class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.code-minifier.ui.desc14">
            Formats code with proper indentation and spacing. Makes code more readable and maintainable.
          </p>
        </div>

        <div class="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
          <h3 class="font-bold text-surface-900 dark:text-surface-100 mb-2" data-i18n="tools.code-minifier.ui.heading12">🔒 Privacy First</h3>
          <p class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.code-minifier.ui.desc15">
            All processing happens in your browser. Your code never leaves your device.
          </p>
        </div>
      </div>
      </div>
    </main>

    ${getCopyToClipboardScript()}

    <script>
      ${getDownloadFileScript()}
      // State
      let currentLanguage = 'javascript';
      let currentMode = 'minify';

      // DOM Elements
      const inputCode = document.getElementById('input-code');
      const outputCode = document.getElementById('output-code');
      const inputSize = document.getElementById('input-size');
      const outputStats = document.getElementById('output-stats');
      const outputSize = document.getElementById('output-size');
      const reduction = document.getElementById('reduction');

      // Language Tabs
      document.querySelectorAll('.language-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.language-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          currentLanguage = tab.dataset.lang;
          processCode();
        });
      });

      // Mode Buttons
      document.getElementById('minify-btn').addEventListener('click', () => {
        currentMode = 'minify';
        const minBtn = document.getElementById('minify-btn');
        const beauBtn = document.getElementById('beautify-btn');
        minBtn.classList.add('active', 'btn-primary');
        minBtn.classList.remove('btn-secondary');
        beauBtn.classList.remove('active', 'btn-primary');
        beauBtn.classList.add('btn-secondary');
        processCode();
      });

      document.getElementById('beautify-btn').addEventListener('click', () => {
        currentMode = 'beautify';
        const minBtn = document.getElementById('minify-btn');
        const beauBtn = document.getElementById('beautify-btn');
        beauBtn.classList.add('active', 'btn-primary');
        beauBtn.classList.remove('btn-secondary');
        minBtn.classList.remove('active', 'btn-primary');
        minBtn.classList.add('btn-secondary');
        processCode();
      });

      // Input Changes
      inputCode.addEventListener('input', () => {
        updateInputSize();
        processCode();
      });

      // Clear Input
      document.getElementById('clear-input-btn').addEventListener('click', () => {
        inputCode.value = '';
        outputCode.value = '';
        updateInputSize();
        outputStats.classList.add('hidden');
      });

      // Copy Output
      document.getElementById('copy-output-btn').addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(outputCode.value);
          const btn = document.getElementById('copy-output-btn');
          const original = btn.textContent;
          btn.textContent = _t('tools.code-minifier.js.text0', '✓ Copied!');
          setTimeout(() => { btn.textContent = original; }, 2000);
        } catch (err) {
          // Show error inline, not via alert
          const btn = document.getElementById('copy-output-btn');
          btn.textContent = _t('tools.code-minifier.js.text1', '✗ Failed');
          setTimeout(() => { btn.textContent = _t('tools.code-minifier.js.text2', '📋 Copy'); }, 2000);
        }
      });

      // Download Output
      document.getElementById('download-output-btn').addEventListener('click', () => {
        if (!outputCode.value) return;

        const extensions = {
          javascript: 'js',
          css: 'css',
          html: 'html',
          json: 'json'
        };

        const filename = \`\${currentMode}-\${currentLanguage}.\${extensions[currentLanguage]}\`;
        downloadFile(outputCode.value, filename, 'text/plain');
      });

      // Update Input Size
      function updateInputSize() {
        const bytes = new Blob([inputCode.value]).size;
        inputSize.textContent = \`Size: \${formatBytes(bytes)}\`;
      }

      // Process Code
      function processCode() {
        const input = inputCode.value.trim();
        if (!input) {
          outputCode.value = '';
          outputStats.classList.add('hidden');
          return;
        }

        try {
          let output;
          if (currentMode === 'minify') {
            output = minifyCode(input, currentLanguage);
          } else {
            output = beautifyCode(input, currentLanguage);
          }

          outputCode.value = output;

          // Update stats
          const inputBytes = new Blob([input]).size;
          const outputBytes = new Blob([output]).size;
          outputSize.textContent = \`Size: \${formatBytes(outputBytes)}\`;

          if (currentMode === 'minify') {
            const saved = inputBytes - outputBytes;
            const percent = ((saved / inputBytes) * 100).toFixed(1);
            reduction.textContent = \`Reduced by \${percent}% (\${formatBytes(saved)} saved)\`;
            reduction.className = 'ml-4 font-semibold text-green-600 dark:text-green-400';
          } else {
            const added = outputBytes - inputBytes;
            const percent = ((added / inputBytes) * 100).toFixed(1);
            reduction.textContent = \`Expanded by \${percent}% (\${formatBytes(added)} added)\`;
            reduction.className = 'ml-4 font-semibold text-blue-600 dark:text-blue-400';
          }

          outputStats.classList.remove('hidden');
        } catch (error) {
          outputCode.value = \`Error: \${error.message}\`;
          outputStats.classList.add('hidden');
        }
      }

      // Minify Code
      function minifyCode(code, language) {
        switch (language) {
          case 'javascript':
            return minifyJavaScript(code);
          case 'css':
            return minifyCSS(code);
          case 'html':
            return minifyHTML(code);
          case 'json':
            return minifyJSON(code);
          default:
            return code;
        }
      }

      // Beautify Code
      function beautifyCode(code, language) {
        switch (language) {
          case 'javascript':
            return beautifyJavaScript(code);
          case 'css':
            return beautifyCSS(code);
          case 'html':
            return beautifyHTML(code);
          case 'json':
            return beautifyJSON(code);
          default:
            return code;
        }
      }

      // JavaScript Minification
      function minifyJavaScript(code) {
        let output = '';
        let i = 0;
        const len = code.length;
        let inString = false;
        let stringChar = '';
        let inLineComment = false;
        let inBlockComment = false;
        let inRegex = false;

        while (i < len) {
          const char = code[i];
          const next = code[i + 1] || '';
          const prev = code[i - 1] || '';

          // Handle Strings
          if (inString) {
            output += char;
            if (char === stringChar && prev !== '\\\\') {
              inString = false;
            }
            i++;
            continue;
          }

          // Handle Comments
          if (inLineComment) {
            if (char === '\\n') {
              inLineComment = false;
              output += '\\n';
            }
            i++;
            continue;
          }

          if (inBlockComment) {
            if (char === '*' && next === '/') {
              inBlockComment = false;
              i += 2;
            } else {
              i++;
            }
            continue;
          }

          // Handle Regex (simplified detection)
          if (inRegex) {
            output += char;
            if (char === '/' && prev !== '\\\\') {
              inRegex = false;
            }
            i++;
            continue;
          }

          // Start String
          if (char === '"' || char === "'" || char === '\`') {
            inString = true;
            stringChar = char;
            output += char;
            i++;
            continue;
          }

          // Start Comments
          if (char === '/' && next === '/') {
            inLineComment = true;
            i += 2;
            continue;
          }

          if (char === '/' && next === '*') {
            inBlockComment = true;
            i += 2;
            continue;
          }

          // Start Regex (heuristic: previous char was operator or start of line)
          // This is hard to get 100% right without a full parser, but we can try a basic check
          if (char === '/') {
            const lastSignificant = output.trim().slice(-1);
            if (['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '\\n'].includes(lastSignificant) || output.trim() === '') {
              inRegex = true;
              output += char;
              i++;
              continue;
            }
          }

          // Normal Code
          output += char;
          i++;
        }

        // Post-processing to remove extra whitespace
        return output
          .replace(/\\s+/g, ' ')
          .replace(/\\s*([{}()\\[\\];,:<>+\\-*\\/=!&|?])\\s*/g, '$1')
          .replace(/;}/g, '}')
          .trim();
      }

      // JavaScript Beautification
      function beautifyJavaScript(code) {
        let formatted = '';
        let indentLevel = 0;
        const indent = '  ';
        let inString = false;
        let stringChar = '';

        for (let i = 0; i < code.length; i++) {
          const char = code[i];
          const nextChar = code[i + 1];

          // Handle strings
          if ((char === '"' || char === "'" || char === '\`') && code[i - 1] !== '\\\\') {
            if (!inString) {
              inString = true;
              stringChar = char;
            } else if (char === stringChar) {
              inString = false;
            }
            formatted += char;
            continue;
          }

          if (inString) {
            formatted += char;
            continue;
          }

          // Handle braces
          if (char === '{') {
            formatted += char + '\\n';
            indentLevel++;
            formatted += indent.repeat(indentLevel);
          } else if (char === '}') {
            indentLevel = Math.max(0, indentLevel - 1);
            formatted = formatted.trimEnd() + '\\n' + indent.repeat(indentLevel) + char;
            if (nextChar && nextChar !== ';' && nextChar !== ',') {
              formatted += '\\n' + indent.repeat(indentLevel);
            }
          } else if (char === ';') {
            formatted += char;
            if (nextChar && nextChar !== '}') {
              formatted += '\\n' + indent.repeat(indentLevel);
            }
          } else {
            formatted += char;
          }
        }

        return formatted.replace(/\\n+/g, '\\n').trim();
      }

      // CSS Minification
      function minifyCSS(code) {
        return code
          .replace(/\\/\\*[\\s\\S]*?\\*\\//g, '') // Remove comments
          .replace(/\\s+/g, ' ') // Replace multiple spaces
          .replace(/\\s*([{}:;,>+~])\\s*/g, '$1') // Remove spaces around special chars
          .replace(/;}/g, '}') // Remove last semicolon in block
          .trim();
      }

      // CSS Beautification
      function beautifyCSS(code) {
        const indent = '  ';
        return code
          .replace(/\\s*{\\s*/g, ' {\\n' + indent)
          .replace(/\\s*}\\s*/g, '\\n}\\n')
          .replace(/\\s*;\\s*/g, ';\\n' + indent)
          .replace(/,\\s*/g, ', ')
          .replace(/\\n+/g, '\\n')
          .trim();
      }

      // HTML Minification
      function minifyHTML(code) {
        return code
          .replace(/<!--[\\s\\S]*?-->/g, '') // Remove comments
          .replace(/>\\s+</g, '><') // Remove whitespace between tags
          .replace(/\\s+/g, ' ') // Replace multiple spaces
          .trim();
      }

      // HTML Beautification
      function beautifyHTML(code) {
        const indent = '  ';
        let formatted = '';
        let indentLevel = 0;
        const tags = code.match(/<[^>]+>/g) || [];
        const parts = code.split(/(<[^>]+>)/);

        parts.forEach(part => {
          if (!part.trim()) return;

          if (part.startsWith('</')) {
            indentLevel = Math.max(0, indentLevel - 1);
            formatted += indent.repeat(indentLevel) + part.trim() + '\\n';
          } else if (part.startsWith('<')) {
            formatted += indent.repeat(indentLevel) + part.trim() + '\\n';
            if (!part.endsWith('/>') && !part.match(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/)) {
              indentLevel++;
            }
          } else {
            const text = part.trim();
            if (text) {
              formatted += indent.repeat(indentLevel) + text + '\\n';
            }
          }
        });

        return formatted.trim();
      }

      // JSON Minification
      function minifyJSON(code) {
        const obj = JSON.parse(code);
        return JSON.stringify(obj);
      }

      // JSON Beautification
      function beautifyJSON(code) {
        const obj = JSON.parse(code);
        return JSON.stringify(obj, null, 2);
      }

      // Format Bytes
      function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
      }

      // Initialize
      updateInputSize();
    </script>
  `;

  const customStyles = `
    <style>
      .code-editor {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
        font-size: 14px;
        line-height: 1.6;
        min-height: 400px;
      }

      .language-tab {
        padding: 0.75rem 1.5rem;
        border: 1px solid transparent;
        border-bottom: none;
        border-radius: 8px 8px 0 0;
        font-weight: 600;
        transition: all 0.2s;
        cursor: pointer;
        background: #f4f4f5;
        color: #71717a;
      }

      .dark .language-tab {
        background: #27272a;
        color: #a1a1aa;
      }

      .language-tab.active {
        background: white;
        color: #4f46e5;
        border-color: #e4e4e7;
        border-bottom-color: white;
      }

      .dark .language-tab.active {
        background: #18181b;
        color: #818cf8;
        border-color: #3f3f46;
        border-bottom-color: #18181b;
      }

      .mode-btn {
        padding: 1rem 2rem;
        font-weight: 600;
        transition: all 0.2s;
      }

      .mode-btn.active {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    </style>
  `;

  return createPageTemplate({
    title: 'Code Minifier',
    description: 'Minify and beautify JavaScript, CSS, HTML, and JSON code. Optimize for production or improve readability.',
    path: '/code-minifier',
    content: customStyles + pageContent
  });
}

/**
 * Route handler for Code Minifier
 */
export async function handleCodeMinifierRoutes(request, url) {
  const pathname = url.pathname;

  // Only handle exact matches for the code minifier route
  if (pathname === '/code-minifier' || pathname === '/code-minifier/') {
    if (request.method !== 'GET') {
      // Return 405 Method Not Allowed for non-GET requests
      return new Response('Method Not Allowed', {
        status: 405,
        headers: {
          'Content-Type': 'text/plain',
          'Allow': 'GET'
        }
      });
    }
    return respondHTML(renderCodeMinifierPage());
  }

  // Return null to let the main router handle 404
  return null;
}
