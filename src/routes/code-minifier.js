/**
 * Code Minifier & Beautifier Tool
 * Minify and beautify JavaScript, CSS, HTML, and JSON code
 * All processing happens client-side
 */

import { createPageTemplate, createToolHeader, getCopyToClipboardScript, getDownloadFileScript } from '../utils/common-ui.js';
import { respondHTML } from '../utils/respond.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

/**
 * Render the Code Minifier page
 */
function renderCodeMinifierPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('code-minifier', currentLang);
  const toolHeader = createToolHeader(
    { emoji: '📦' },
    translation?.name || 'Code Minifier',
    translation?.desc || 'Minify and beautify JavaScript, CSS, HTML, and JSON code with one click. Optimize your code for production or improve readability.',
    [{ text: translation?.ui?.badge16 || 'Client-Side Only', tooltip: 'Runs entirely in your browser using Web APIs — your code never leaves your device.' }],
    { toolId: 'code-minifier' }
  );

  const currentTool = TOOLS.find(t => t.id === 'code-minifier');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];
  const pageContent = `

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}

      <!-- Language Tabs -->
      <div class="flex justify-center mb-6 border-b-2 border-surface-200 dark:border-surface-700">
        <div class="flex gap-2">
          <button class="language-tab active" data-lang="javascript" data-tooltip="Minify JavaScript code" data-i18n-tooltip="tools.code-minifier.ui.tip0"><span data-i18n="tools.code-minifier.ui.button0">JavaScript</span></button>
          <button class="language-tab" data-lang="css" data-tooltip="Minify CSS stylesheets" data-i18n-tooltip="tools.code-minifier.ui.tip1"><span data-i18n="tools.code-minifier.ui.button6">CSS</span></button>
          <button class="language-tab" data-lang="html" data-tooltip="Minify HTML markup" data-i18n-tooltip="tools.code-minifier.ui.tip2"><span data-i18n="tools.code-minifier.ui.button7">HTML</span></button>
          <button class="language-tab" data-lang="json" data-tooltip="Format or minify JSON data" data-i18n-tooltip="tools.code-minifier.ui.tip3"><span data-i18n="tools.code-minifier.ui.button8">JSON</span></button>
        </div>
      </div>

      <!-- Mode Selection -->
      <div class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button id="minify-btn" class="mode-btn btn btn-primary active" data-tooltip="Remove whitespace and shorten code for production" data-i18n-tooltip="tools.code-minifier.ui.tip4">
            <span data-i18n="tools.code-minifier.ui.button1">🗜️ Minify Code</span>
          </button>
          <button id="beautify-btn" class="mode-btn btn btn-secondary" data-tooltip="Add indentation and formatting for readability" data-i18n-tooltip="tools.code-minifier.ui.tip5">
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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'What is Minification?',
          content: '<p>Minification is the process of removing all unnecessary characters from source code without changing its functionality. This includes removing whitespace, newlines, comments, and sometimes shortening variable names. The goal is to reduce the file size of the code, which in turn reduces the amount of data that needs to be transferred over the network.</p><p>This leads to faster page load times and improved performance for web applications. While minification is essential for production environments, it makes the code nearly impossible for humans to read and debug. Therefore, it is typically performed as a final step in the build process before deploying to a live server.</p>'
        },
        {
          title: 'How to Use This Tool',
          content: '<ol><li>Select the programming language (JavaScript, CSS, HTML, or JSON) from the tabs at the top.</li><li>Paste your source code into the "Input Code" text area on the left.</li><li>Click the "Minify Code" button to reduce the file size for production use.</li><li>Alternatively, click "Beautify Code" to add indentation and formatting for better readability.</li><li>View the results in the "Output Code" area and click "Copy" or "Download" to save your optimized code.</li></ol>'
        },
        {
          title: 'Common Use Cases',
          content: '<ul><li><strong>Production Deployment:</strong> Minify your JS and CSS files before uploading them to your web server to improve site speed and SEO.</li><li><strong>Email Templates:</strong> Minify HTML email code to ensure it stays under the size limits of various email clients and loads quickly for recipients.</li><li><strong>API Responses:</strong> Minify JSON data before sending it from your server to reduce bandwidth usage and egress costs.</li><li><strong>Code Auditing:</strong> Use the beautifier to format messy or minified code you\'ve found online to understand how it works.</li></ul>'
        },
        {
          title: 'Pro Tips',
          content: '<ul><li>Always keep your original, unminified source code for development and only use the minified version for production deployment.</li><li>Use Source Maps to bridge the gap between minified production code and readable development code, allowing for efficient debugging in the browser.</li><li>Combine minification with Gzip or Brotli compression on your server for the maximum possible reduction in file size and transfer time.</li></ul>'
        }
      ], 'code-minifier', currentLang)}
    </div>
    ${createRelatedToolsSection(relatedToolsData)}
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

  const scripts = `
    ${getCopyToClipboardScript()}
    <script>
      ${getDownloadFileScript()}

      var currentLang = 'javascript';
      var currentMode = 'minify';

      // ── Language tab switching ────────────────────────────────────────────
      document.querySelectorAll('.language-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          document.querySelectorAll('.language-tab').forEach(function(t) {
            t.classList.remove('active');
          });
          tab.classList.add('active');
          currentLang = tab.dataset.lang;
        });
      });

      // ── Mode button switching ─────────────────────────────────────────────
      document.getElementById('minify-btn').addEventListener('click', function() {
        document.getElementById('minify-btn').classList.add('active');
        document.getElementById('beautify-btn').classList.remove('active');
        currentMode = 'minify';
        processCode();
      });

      document.getElementById('beautify-btn').addEventListener('click', function() {
        document.getElementById('beautify-btn').classList.add('active');
        document.getElementById('minify-btn').classList.remove('active');
        currentMode = 'beautify';
        processCode();
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
        var extMap = { javascript: 'js', css: 'css', html: 'html', json: 'json' };
        var suffix = currentMode === 'minify' ? '.min' : '.formatted';
        var filename = 'output' + suffix + '.' + (extMap[currentLang] || 'txt');
        var mimeMap = { javascript: 'text/javascript', css: 'text/css', html: 'text/html', json: 'application/json' };
        downloadFile(text, filename, mimeMap[currentLang] || 'text/plain');
      });

      // ── Core processing ───────────────────────────────────────────────────
      function processCode() {
        var input = document.getElementById('input-code').value;
        if (!input.trim()) return;

        var output;
        try {
          if (currentLang === 'json') {
            output = processJSON(input, currentMode);
          } else if (currentLang === 'javascript') {
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

      // ── JSON ──────────────────────────────────────────────────────────────
      function processJSON(input, mode) {
        var parsed = JSON.parse(input);
        return mode === 'minify' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
      }

      // ── JavaScript minifier ───────────────────────────────────────────────
      function minifyJS(code) {
        // Remove single-line comments (not inside strings)
        var result = removeJSSingleLineComments(code);
        // Remove multi-line comments (not inside strings)
        result = removeJSMultiLineComments(result);
        // Collapse whitespace runs to single space
        result = result.replace(/[ \\t]+/g, ' ');
        // Remove spaces around operators and punctuation
        result = result.replace(/ *(\\{|\\}|\\(|\\)|;|,|=|\\+|-|\\*|\\/|:|<|>|!|&|\\||\\?|~|\\^|%) */g, '$1');
        // Remove leading/trailing whitespace on each line then join
        result = result.split('\\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; }).join('');
        return result;
      }

      function removeJSSingleLineComments(code) {
        var out = '';
        var i = 0;
        var len = code.length;
        while (i < len) {
          var ch = code[i];
          // String literals: skip to end
          if (ch === '"' || ch === "'" || ch === '\`') {
            var quote = ch;
            out += ch;
            i++;
            while (i < len) {
              var c = code[i];
              out += c;
              if (c === '\\\\') { i++; if (i < len) { out += code[i]; } }
              else if (c === quote) { break; }
              i++;
            }
            i++;
            continue;
          }
          // Regex literal (heuristic: / after operator/keyword context)
          // Single-line comment
          if (ch === '/' && code[i+1] === '/') {
            while (i < len && code[i] !== '\\n') i++;
            continue;
          }
          // Multi-line comment start — skip
          if (ch === '/' && code[i+1] === '*') {
            i += 2;
            while (i < len && !(code[i] === '*' && code[i+1] === '/')) i++;
            i += 2;
            continue;
          }
          out += ch;
          i++;
        }
        return out;
      }

      function removeJSMultiLineComments(code) {
        // Already removed in removeJSSingleLineComments — return as-is
        return code;
      }

      // ── JavaScript beautifier ─────────────────────────────────────────────
      function beautifyJS(code) {
        // First minify lightly (strip comments, normalize spaces)
        var stripped = removeJSSingleLineComments(code);
        var lines = [];
        var indent = 0;
        var indentStr = '  ';
        var tokens = tokenizeJS(stripped);

        for (var i = 0; i < tokens.length; i++) {
          var tok = tokens[i];
          if (tok === '}' || tok === ']') {
            indent = Math.max(0, indent - 1);
            lines.push(indentStr.repeat(indent) + tok);
          } else if (tok === '{' || tok === '[') {
            lines.push(indentStr.repeat(indent) + tok);
            indent++;
          } else if (tok === ';') {
            var last = lines.length > 0 ? lines[lines.length - 1] : '';
            lines[lines.length - 1] = last + ';';
          } else if (tok === ',') {
            var last2 = lines.length > 0 ? lines[lines.length - 1] : '';
            lines[lines.length - 1] = last2 + ',';
          } else {
            // Append to current line or start new one
            var last3 = lines.length > 0 ? lines[lines.length - 1] : null;
            var trimLast = last3 !== null ? last3.trim() : '';
            if (trimLast === '' || trimLast.endsWith('{') || trimLast.endsWith('[') || trimLast.endsWith(';') || trimLast.endsWith(',') || trimLast.endsWith('}') || last3 === null) {
              lines.push(indentStr.repeat(indent) + tok);
            } else {
              lines[lines.length - 1] += ' ' + tok;
            }
          }
        }
        return lines.join('\\n');
      }

      function tokenizeJS(code) {
        var tokens = [];
        var i = 0;
        var len = code.length;
        while (i < len) {
          // Skip whitespace
          if (/\\s/.test(code[i])) { i++; continue; }
          var ch = code[i];
          // String
          if (ch === '"' || ch === "'" || ch === '\`') {
            var q = ch, s = ch; i++;
            while (i < len) {
              var c = code[i]; s += c;
              if (c === '\\\\') { i++; if (i < len) s += code[i]; }
              else if (c === q) break;
              i++;
            }
            tokens.push(s); i++; continue;
          }
          // Single char tokens
          if (ch === '{' || ch === '}' || ch === '(' || ch === ')' || ch === '[' || ch === ']' || ch === ';' || ch === ',') {
            tokens.push(ch); i++; continue;
          }
          // Word
          if (/[\\w$]/.test(ch)) {
            var w = '';
            while (i < len && /[\\w$]/.test(code[i])) { w += code[i]; i++; }
            tokens.push(w); continue;
          }
          // Operator run
          var op = '';
          while (i < len && !/[\\w\\s{}()[\\];,'"\`]/.test(code[i])) { op += code[i]; i++; }
          if (op) tokens.push(op);
        }
        return tokens;
      }

      // ── CSS minifier ──────────────────────────────────────────────────────
      function minifyCSS(code) {
        // Remove comments
        var result = code.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '');
        // Collapse whitespace
        result = result.replace(/\\s+/g, ' ');
        // Remove spaces around {}:;,
        result = result.replace(/ *([{}:;,]) */g, '$1');
        // Remove last semicolons before }
        result = result.replace(/;}/g, '}');
        return result.trim();
      }

      // ── CSS beautifier ────────────────────────────────────────────────────
      function beautifyCSS(code) {
        // Remove comments first
        var stripped = code.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '');
        // Normalize whitespace
        stripped = stripped.replace(/\\s+/g, ' ').trim();
        var result = '';
        var indent = 0;
        var indentStr = '  ';
        var i = 0;
        var len = stripped.length;
        while (i < len) {
          var ch = stripped[i];
          if (ch === '{') {
            result += ' {\\n';
            indent++;
            result += indentStr.repeat(indent);
          } else if (ch === '}') {
            // Remove trailing space/indent before }
            result = result.trimEnd() + '\\n}\\n\\n';
            indent = Math.max(0, indent - 1);
          } else if (ch === ';') {
            result += ';\\n' + indentStr.repeat(indent);
          } else if (ch === ':' && indent > 0) {
            result += ': ';
            // Skip following space if any
            if (stripped[i+1] === ' ') i++;
          } else if (ch === ',') {
            // For selectors (outside block) keep comma with newline
            if (indent === 0) {
              result += ',\\n';
            } else {
              result += ', ';
            }
          } else {
            result += ch;
          }
          i++;
        }
        // Clean up excessive blank lines
        return result.replace(/\\n{3,}/g, '\\n\\n').trim();
      }

      // ── HTML minifier ─────────────────────────────────────────────────────
      function minifyHTML(code) {
        // Remove HTML comments
        var result = code.replace(/<!--[\\s\\S]*?-->/g, '');
        // Collapse whitespace between tags
        result = result.replace(/>\\s+</g, '><');
        // Collapse whitespace within text nodes (multiple spaces → one)
        result = result.replace(/\\s{2,}/g, ' ');
        // Remove unnecessary quotes on attributes (simple values: word chars + - _ . only)
        result = result.replace(/=(["'])([\\w\\-_\\.]+)\\1/g, '=$2');
        return result.trim();
      }

      // ── HTML beautifier ───────────────────────────────────────────────────
      function beautifyHTML(code) {
        // Normalize whitespace between tags
        var normalized = code.replace(/>\\s+</g, '><').trim();
        var result = '';
        var indent = 0;
        var indentStr = '  ';
        var voidTags = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
        var inlineTags = /^(a|abbr|acronym|b|bdo|big|br|button|cite|code|dfn|em|i|img|input|kbd|label|map|object|output|q|samp|select|small|span|strong|sub|sup|textarea|time|tt|u|var)$/i;

        // Simple tag-by-tag pass
        var re = /(<[^>]+>|[^<]+)/g;
        var match;
        while ((match = re.exec(normalized)) !== null) {
          var piece = match[0];
          if (piece.startsWith('</')) {
            // Closing tag
            var tagName = piece.match(/<\\/([\\w-]+)/);
            var name = tagName ? tagName[1] : '';
            if (!inlineTags.test(name)) {
              indent = Math.max(0, indent - 1);
              result += '\\n' + indentStr.repeat(indent) + piece;
            } else {
              result += piece;
            }
          } else if (piece.startsWith('<')) {
            // Opening or self-closing tag
            var tagName2 = piece.match(/<([\\w-]+)/);
            var name2 = tagName2 ? tagName2[1] : '';
            var selfClosing = piece.endsWith('/>') || voidTags.test(name2);
            if (!inlineTags.test(name2)) {
              result += '\\n' + indentStr.repeat(indent) + piece;
              if (!selfClosing) indent++;
            } else {
              result += piece;
            }
          } else {
            // Text node
            var text = piece.replace(/\\s+/g, ' ').trim();
            if (text) result += text;
          }
        }
        return result.replace(/^\\n/, '').replace(/\\n{3,}/g, '\\n\\n');
      }
    </script>
  `;

  return createPageTemplate({
    title: translation?.name || 'Code Minifier',
    description: translation?.desc || 'Minify JS, CSS, and HTML code.',
    path: '/code-minifier',
    content: customStyles + pageContent,
    scripts,
    lang: currentLang
  });
}

/**
 * Route handler for Code Minifier
 */
export async function handleCodeMinifierRoutes(request, url) {
  const pathname = url.pathname;
  const lang = resolveRequestLanguage(request, url);

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
    return respondHTML(renderCodeMinifierPage(lang));
  }

  // Return null to let the main router handle 404
  return null;
}
