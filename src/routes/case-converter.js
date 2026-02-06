/**
 * Text Case Converter Tool - Convert text between different cases
 * All processing happens client-side for privacy
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';

export async function handleCaseConverterRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === '/case-converter' || pathname === '/case-converter/') {
      if (method === 'GET') {
        return renderCaseConverterPage();
      }
    }

    return respondJSON({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Case Converter Route Error:', error);
    return respondJSON(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function renderCaseConverterPage() {
  const toolHeader = createToolHeader(
    { emoji: 'Aa' },
    'Text Case Converter',
    'Transform text between different case styles instantly',
    [{ text: '12+ Styles', color: 'indigo', tooltip: 'Supports over a dozen case styles like camelCase, snake_case, kebab-case, and more.' }],
    { toolId: 'case-converter' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">

        ${toolHeader}

        <!-- Input -->
        <div class="mb-6">
          <label class="label"><span data-i18n="tools.case-converter.ui.label0">Input Text</span></label>
          <textarea
            id="input-text"
            rows="6"
            placeholder="Type or paste text to convert between cases..." data-i18n-placeholder="tools.case-converter.ui.placeholder1"
            class="input resize-y"
          ></textarea>
          <div class="mt-2 text-xs text-surface-500 dark:text-surface-400 flex justify-end gap-4">
            <span><span id="char-count" class="font-bold text-surface-700 dark:text-surface-300">0</span> characters</span>
            <span><span id="word-count" class="font-bold text-surface-700 dark:text-surface-300">0</span> words</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 mb-6">
          <button id="clear-btn" class="btn btn-ghost" data-tooltip="Clear all input and results">
            <span class="material-symbols-rounded text-sm" data-i18n="tools.case-converter.ui.desc3">delete</span> Clear
          </button>
        </div>

        <!-- Conversion Results Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" id="conversion-results"></div>

        <!-- Info Section -->
        <div class="mt-8 p-6 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
          <h2 class="text-sm font-bold text-primary-900 dark:text-primary-100 mb-3 uppercase tracking-wide" data-i18n="tools.case-converter.ui.stat2">Supported Case Types</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-surface-600 dark:text-surface-400">
            <div data-tooltip="All letters capitalized"><strong class="text-surface-900 dark:text-surface-200">UPPERCASE:</strong> ALL CAPS</div>
            <div data-tooltip="All letters lowercased"><strong class="text-surface-900 dark:text-surface-200">lowercase:</strong> no caps</div>
            <div data-tooltip="First letter of each word capitalized"><strong class="text-surface-900 dark:text-surface-200">Title Case:</strong> Capitalize Words</div>
            <div data-tooltip="Only the first letter of first word capitalized"><strong class="text-surface-900 dark:text-surface-200">Sentence case:</strong> First letter only</div>
            <div data-tooltip="Common in JavaScript variables and functions"><strong class="text-surface-900 dark:text-surface-200">camelCase:</strong> javaScriptStyle</div>
            <div data-tooltip="Common for class names in C#, Java, React"><strong class="text-surface-900 dark:text-surface-200">PascalCase:</strong> ReactComponentStyle</div>
            <div data-tooltip="Common in Python, Ruby, and databases"><strong class="text-surface-900 dark:text-surface-200">snake_case:</strong> python_style</div>
            <div data-tooltip="Common in URLs, CSS, and HTML attributes"><strong class="text-surface-900 dark:text-surface-200">kebab-case:</strong> url-slug-style</div>
            <div data-tooltip="Common for constants and environment variables"><strong class="text-surface-900 dark:text-surface-200">CONSTANT_CASE:</strong> ENV_VAR_STYLE</div>
            <div data-tooltip="Common for object property paths"><strong class="text-surface-900 dark:text-surface-200">dot.case:</strong> object.property.style</div>
            <div data-tooltip="Alternating upper and lowercase"><strong class="text-surface-900 dark:text-surface-200">aLtErNaTiNg:</strong> mOcKiNg sPoNgEbOb</div>
          </div>
        </div>

      </div>
    </main>
  `;

  const script = `
    <script>
      const inputText = document.getElementById('input-text');
      const conversionResults = document.getElementById('conversion-results');
      const charCount = document.getElementById('char-count');
      const wordCount = document.getElementById('word-count');

      // Conversion functions
      const conversions = {
        uppercase: {
          name: 'UPPERCASE',
          icon: '⬆️',
          color: 'red',
          convert: (text) => text.toUpperCase()
        },
        lowercase: {
          name: 'lowercase',
          icon: '⬇️',
          color: 'blue',
          convert: (text) => text.toLowerCase()
        },
        titleCase: {
          name: 'Title Case',
          icon: '📝',
          color: 'green',
          convert: (text) => text.replace(/\\w\\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
        },
        sentenceCase: {
          name: 'Sentence case',
          icon: '📄',
          color: 'purple',
          convert: (text) => text.toLowerCase().replace(/(^\\w|[.!?]\\s+\\w)/g, (c) => c.toUpperCase())
        },
        camelCase: {
          name: 'camelCase',
          icon: '🐫',
          color: 'orange',
          convert: (text) => {
            const words = text.toLowerCase().replace(/[^a-zA-Z0-9\\s]/g, '').split(/\\s+/);
            return words.map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)).join('');
          }
        },
        pascalCase: {
          name: 'PascalCase',
          icon: '🅿️',
          color: 'indigo',
          convert: (text) => {
            const words = text.toLowerCase().replace(/[^a-zA-Z0-9\\s]/g, '').split(/\\s+/);
            return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
          }
        },
        snakeCase: {
          name: 'snake_case',
          icon: '🐍',
          color: 'teal',
          convert: (text) => text.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
        },
        kebabCase: {
          name: 'kebab-case',
          icon: '🌭',
          color: 'pink',
          convert: (text) => text.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
        },
        constantCase: {
          name: 'CONSTANT_CASE',
          icon: '🔒',
          color: 'cyan',
          convert: (text) => text.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')
        },
        dotCase: {
          name: 'dot.case',
          icon: '⚫',
          color: 'gray',
          convert: (text) => text.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '.').replace(/^\.|\$/g, '')
        },
        alternating: {
          name: 'aLtErNaTiNg CaSe',
          icon: '🔀',
          color: 'yellow',
          convert: (text) => text.split('').map((char, i) => i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()).join('')
        },
        inverse: {
          name: 'InVeRsE cAsE',
          icon: '🔃',
          color: 'lime',
          convert: (text) => text.split('').map(char => char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()).join('')
        }
      };

      // Event delegation for copy buttons
      document.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-result-btn');
        if (copyBtn) {
          const raw = copyBtn.dataset.copyResult || '';
          let text = raw;
          try {
            text = decodeURIComponent(raw);
          } catch (_) {
            // Fallback to raw if decode fails
          }
          
          if(window.copyToClipboard) {
             window.copyToClipboard(text, copyBtn);
          } else {
             navigator.clipboard.writeText(text).then(() => {
                const original = copyBtn.innerHTML;
                copyBtn.innerHTML = '✓';
                setTimeout(() => copyBtn.innerHTML = original, 2000);
             });
          }
        }
      });

      // Display conversion result
      function displayConversion(key, config, result) {
        const safeResult = escapeHtml(result);
        return \`
          <div class="bg-surface-50 dark:bg-surface-950 rounded-lg p-4 border border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <h3 class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide">\${config.name}</h3>
              </div>
              <button data-copy-result="\${encodeURIComponent(result)}" class="copy-result-btn text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <span class="material-symbols-rounded text-sm" data-i18n="tools.case-converter.ui.desc4">content_copy</span>
              </button>
            </div>
            <div class="relative">
              <code class="block text-sm font-mono text-surface-900 dark:text-surface-100 break-words min-h-[1.5em]">\${safeResult || '<span class="opacity-30">...</span>'}</code>
            </div>
          </div>
        \`;
      }

      function escapeHtml(value) {
        return String(value).replace(/[&<>'"']/g, (char) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[char]));
      }

      // Update conversions
      function updateConversions() {
        const text = inputText.value;

        // Update counts
        charCount.textContent = text.length;
        wordCount.textContent = text.trim() ? text.trim().split(/\\s+/).length : 0;

        if (!text.trim()) {
          // Show empty states
          const results = Object.entries(conversions).map(([key, config]) => {
             return displayConversion(key, config, '');
          }).join('');
          conversionResults.innerHTML = results;
          return;
        }

        // Generate all conversions
        const results = Object.entries(conversions).map(([key, config]) => {
          const result = config.convert(text);
          return displayConversion(key, config, result);
        }).join('');

        conversionResults.innerHTML = results;
      }

      // Live conversion
      inputText.addEventListener('input', updateConversions);

      // Clear button
      document.getElementById('clear-btn').addEventListener('click', () => {
        inputText.value = '';
        updateConversions();
      });

      // Initial state
      updateConversions();
    </script>
  `;

  return respondHTML(createPageTemplate({
    title: 'Text Case Converter - Transform Text Case Instantly',
    description: 'Convert text between different cases: uppercase, lowercase, title case, camelCase, snake_case, kebab-case, and more.',
    path: '/case-converter',
    content,
    scripts: script
  }));
}
