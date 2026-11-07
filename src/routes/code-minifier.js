/**
 * Code Minifier & Beautifier Tool
 * Minify and beautify JavaScript, CSS, and HTML code
 * All processing happens client-side
 */

import {
  createPageTemplate,
  createToolHeader,
  getDownloadFileScript,
} from "../utils/common-ui.js";
import { respondHTML } from "../utils/respond.js";
import { CODE_MINIFIER_FUNCTIONS } from "../utils/code-minifier-logic.js";
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

/**
 * Render the Code Minifier page
 */
function renderCodeMinifierPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("code-minifier", currentLang);
  const toolHeader = createToolHeader(
    { emoji: "📦" },
    translation?.name || "Code Minifier",
    translation?.desc ||
      "Minify and beautify JavaScript, CSS, and HTML code with one click. Optimize your code for production or improve readability.",
    [
      {
        text: translation?.ui?.badge16 || "Client-Side Only",
        tooltip:
          "Runs entirely in your browser using Web APIs — your code is processed locally and not sent to our servers.",
        tooltipI18nKey: "tools.code-minifier.ui.r65_2",
      },
    ],
    { toolId: "code-minifier" },
  );

  const currentTool = TOOLS.find((t) => t.id === "code-minifier");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];
  const pageContent = `

    <main class="tool-page-shell">
      <div class="tool-page-panel">
        ${toolHeader}

      <!-- Language Tabs -->
      <div class="flex justify-center mb-6 border-b-2 border-surface-200 dark:border-surface-700">
        <div class="tabs-list" role="tablist" aria-label="Language">
          <button role="tab" aria-selected="true" class="tab-trigger language-tab active" data-lang="javascript" data-tooltip="Minify JavaScript code" data-i18n-tooltip="tools.code-minifier.ui.r65_3"><span data-i18n="tools.code-minifier.ui.button0">JavaScript</span></button>
          <button role="tab" aria-selected="false" class="tab-trigger language-tab" data-lang="css" data-tooltip="Minify CSS stylesheets" data-i18n-tooltip="tools.code-minifier.ui.r65_4"><span data-i18n="tools.code-minifier.ui.button6">CSS</span></button>
          <button role="tab" aria-selected="false" class="tab-trigger language-tab" data-lang="html" data-tooltip="Minify HTML markup" data-i18n-tooltip="tools.code-minifier.ui.r65_5"><span data-i18n="tools.code-minifier.ui.button7">HTML</span></button>
        </div>
      </div>

      <!-- Mode Selection -->
      <div class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button id="minify-btn" aria-pressed="true" class="mode-btn btn btn-primary active" data-tooltip="Remove whitespace and shorten code for production" data-i18n-tooltip="tools.code-minifier.ui.r65_6">
            <span data-i18n="tools.code-minifier.ui.button1">🗜️ Minify Code</span>
          </button>
          <button id="beautify-btn" aria-pressed="false" class="mode-btn btn btn-secondary" data-tooltip="Add indentation and formatting for readability" data-i18n-tooltip="tools.code-minifier.ui.r65_7">
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

          <textarea id="input-code" aria-label="Code input" data-i18n-aria="tools.code-minifier.ui.r65_0" class="input w-full resize-vertical" placeholder="Paste your code here..." data-i18n-placeholder="tools.code-minifier.ui.placeholder6"></textarea>

          <div class="mt-3 text-sm text-surface-600 dark:text-surface-400">
            <span data-i18n="tools.code-minifier.ui.r6_0" id="input-size">Size: 0 bytes</span>
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

          <textarea id="output-code" aria-label="Minified output" data-i18n-aria="tools.code-minifier.ui.r65_1" class="input w-full resize-vertical" readonly placeholder="Output will appear here..." data-i18n-placeholder="tools.code-minifier.ui.placeholder7"></textarea>

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
            All processing happens in your browser. Your code is processed locally and not sent to our servers.
          </p>
        </div>
      </div>
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection(
        [
          {
            title: "What is Minification?",
            content:
              "<p>Minification is the process of removing all unnecessary characters from source code without changing its functionality. This includes removing whitespace, newlines, comments, and sometimes shortening variable names. The goal is to reduce the file size of the code, which in turn reduces the amount of data that needs to be transferred over the network.</p><p>This leads to faster page load times and improved performance for web applications. While minification is essential for production environments, it makes the code nearly impossible for humans to read and debug. Therefore, it is typically performed as a final step in the build process before deploying to a live server.</p>",
          },
          {
            title: "How to Use This Tool",
            content:
              '<ol><li>Select the programming language (JavaScript, CSS, or HTML) from the tabs at the top.</li><li>Paste your source code into the "Input Code" text area on the left.</li><li>Click the "Minify Code" button to reduce the file size for production use.</li><li>Alternatively, click "Beautify Code" to add indentation and formatting for better readability.</li><li>View the results in the "Output Code" area and click "Copy" or "Download" to save your optimized code.</li><li>Need to format or minify JSON? Use the <a href="/json-formatter" class="text-primary-600 dark:text-primary-400 underline">JSON Formatter</a> tool.</li></ol>',
          },
          {
            title: "Common Use Cases",
            content:
              "<ul><li><strong>Production Deployment:</strong> Minify your JS and CSS files before uploading them to your web server to improve site speed and SEO.</li><li><strong>Email Templates:</strong> Minify HTML email code to ensure it stays under the size limits of various email clients and loads quickly for recipients.</li><li><strong>API Responses:</strong> Minify JSON data before sending it from your server to reduce bandwidth usage and egress costs.</li><li><strong>Code Auditing:</strong> Use the beautifier to format messy or minified code you've found online to understand how it works.</li></ul>",
          },
          {
            title: "Pro Tips",
            content:
              "<ul><li>Always keep your original, unminified source code for development and only use the minified version for production deployment.</li><li>Use Source Maps to bridge the gap between minified production code and readable development code, allowing for efficient debugging in the browser.</li><li>Combine minification with Gzip or Brotli compression on your server for the maximum possible reduction in file size and transfer time.</li></ul>",
          },
        ],
        "code-minifier",
        currentLang,
      )}
    </div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">${createRelatedToolsSection(relatedToolsData)}</div>
  `;

  const customStyles = `
    <style>
      .code-editor {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
        font-size: 14px;
        line-height: 1.6;
        min-height: 400px;
      }

      .mode-btn {
        font-weight: 600;
        transition: all 0.2s;
      }

      .mode-btn.active {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    </style>
  `;

  const scripts = `
    <script>
      ${getDownloadFileScript()}

      var currentLang = 'javascript';
      var currentMode = 'minify';

      // ── Language tab switching ────────────────────────────────────────────
      document.querySelectorAll('.language-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          document.querySelectorAll('.language-tab').forEach(function(t) {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
          });
          tab.classList.add('active');
          tab.setAttribute('aria-selected', 'true');
          currentLang = tab.dataset.lang;
          // The mode buttons below re-run processCode(); this did not, so after
          // switching language the output pane kept showing the result computed
          // with the PREVIOUS language until the user touched something else.
          processCode();
        });
      });

      // ── Mode button switching ─────────────────────────────────────────────
      // The solid btn-primary fill is the dominant "selected" signal, so it has
      // to move with .active — otherwise the deselected button keeps its fill
      // and both modes read as active at once.
      function setMode(mode) {
        var selected = document.getElementById(mode === 'minify' ? 'minify-btn' : 'beautify-btn');
        var other = document.getElementById(mode === 'minify' ? 'beautify-btn' : 'minify-btn');
        selected.classList.add('active', 'btn-primary');
        selected.classList.remove('btn-secondary');
        selected.setAttribute('aria-pressed', 'true');
        other.classList.remove('active', 'btn-primary');
        other.classList.add('btn-secondary');
        other.setAttribute('aria-pressed', 'false');
        currentMode = mode;
        processCode();
      }

      document.getElementById('minify-btn').addEventListener('click', function() {
        setMode('minify');
      });

      document.getElementById('beautify-btn').addEventListener('click', function() {
        setMode('beautify');
      });

      // ── Input size display ────────────────────────────────────────────────
      document.getElementById('input-code').addEventListener('input', function() {
        var bytes = new TextEncoder().encode(this.value).length;
        document.getElementById('input-size').textContent =
          _t('tools.code-minifier.js.size', 'Size') + ': ' + bytes.toLocaleString() + ' ' +
          _t('tools.code-minifier.js.bytes', 'bytes');
      });

      // ── Clear ─────────────────────────────────────────────────────────────
      document.getElementById('clear-input-btn').addEventListener('click', function() {
        document.getElementById('input-code').value = '';
        document.getElementById('output-code').value = '';
        document.getElementById('input-size').textContent =
          _t('tools.code-minifier.js.size', 'Size') + ': 0 ' +
          _t('tools.code-minifier.js.bytes', 'bytes');
        document.getElementById('output-stats').classList.add('hidden');
      });

      // ── Copy output ───────────────────────────────────────────────────────
      document.getElementById('copy-output-btn').addEventListener('click', function() {
        var text = document.getElementById('output-code').value;
        if (!text) return;
        copyToClipboard(text, this);
      });

      // ── Download output ───────────────────────────────────────────────────
      document.getElementById('download-output-btn').addEventListener('click', function() {
        var text = document.getElementById('output-code').value;
        if (!text) return;
        var extMap = { javascript: 'js', css: 'css', html: 'html' };
        var suffix = currentMode === 'minify' ? '.min' : '.formatted';
        var filename = 'output' + suffix + '.' + (extMap[currentLang] || 'txt');
        var mimeMap = { javascript: 'text/javascript', css: 'text/css', html: 'text/html' };
        downloadFile(text, filename, mimeMap[currentLang] || 'text/plain');
      });

      // ── Core processing ───────────────────────────────────────────────────
      function processCode() {
        var input = document.getElementById('input-code').value;
        if (!input.trim()) {
          // An empty input must not leave the previous result on screen.
          document.getElementById('output-code').value = '';
          document.getElementById('output-stats').classList.add('hidden');
          return;
        }

        var output;
        try {
          if (currentLang === 'javascript') {
            output = currentMode === 'minify' ? minifyJS(input) : beautifyJS(input);
          } else if (currentLang === 'css') {
            output = currentMode === 'minify' ? minifyCSS(input) : beautifyCSS(input);
          } else if (currentLang === 'html') {
            output = currentMode === 'minify' ? minifyHTML(input) : beautifyHTML(input);
          }
        } catch (err) {
          document.getElementById('output-code').value =
            _t('tools.code-minifier.js.error', 'Error') + ': ' + err.message;
          document.getElementById('output-stats').classList.add('hidden');
          return;
        }

        document.getElementById('output-code').value = output;
        updateStats(input, output);
      }

      function updateStats(input, output) {
        var enc = new TextEncoder();
        var inBytes = enc.encode(input).length;
        var outBytes = enc.encode(output).length;
        var savings = inBytes > 0 ? (((inBytes - outBytes) / inBytes) * 100).toFixed(1) : '0.0';
        var lines = output.split('\\n').length;

        document.getElementById('output-size').textContent =
          _t('tools.code-minifier.js.output', 'Output') + ': ' + outBytes.toLocaleString() + ' ' +
          _t('tools.code-minifier.js.bytes', 'bytes') + ' (' + lines.toLocaleString() + ' ' +
          _t('tools.code-minifier.js.lines', 'lines') + ')';

        var reductionEl = document.getElementById('reduction');
        if (currentMode === 'minify') {
          var saved = inBytes - outBytes;
          reductionEl.textContent =
            _t('tools.code-minifier.js.saved', 'Saved') + ': ' + saved.toLocaleString() + ' ' +
            _t('tools.code-minifier.js.bytes', 'bytes') + ' (' + savings + '%)';
          reductionEl.className = 'ml-4 font-semibold text-success-600 dark:text-success-400';
        } else {
          reductionEl.textContent = '';
        }

        document.getElementById('output-stats').classList.remove('hidden');
      }

      

      // Inlined from src/utils/code-minifier-logic.js (tested in code-minifier-logic.test.js).
      ${CODE_MINIFIER_FUNCTIONS.map((fn) => fn.toString()).join("\n")}
    </script>
  `;

  return createPageTemplate({
    title: translation?.name || "Code Minifier",
    description: translation?.desc || "Minify JS, CSS, and HTML code.",
    path: "/code-minifier",
    content: customStyles + pageContent,
    scripts,
    lang: currentLang,
  });
}

/**
 * Route handler for Code Minifier
 */
export async function handleCodeMinifierRoutes(request, url) {
  const pathname = url.pathname;
  const lang = resolveRequestLanguage(request, url);

  // Only handle exact matches for the code minifier route
  if (pathname === "/code-minifier" || pathname === "/code-minifier/") {
    if (request.method !== "GET") {
      // Return 405 Method Not Allowed for non-GET requests
      return new Response("Method Not Allowed", {
        status: 405,
        headers: {
          "Content-Type": "text/plain",
          Allow: "GET",
        },
      });
    }
    return respondHTML(renderCodeMinifierPage(lang));
  }

  // Return null to let the main router handle 404
  return null;
}
