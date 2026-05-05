/**
 * JSON Formatter Tool - Format, validate, and beautify JSON
 * All processing happens client-side for privacy
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createEmptyState, getCopyToClipboardScript } from '../utils/common-ui.js';
import { createRichEditorPane, getRichEditorStyles, getRichEditorScript } from '../utils/rich-editor.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { getToolTranslation, resolveRequestLanguage, t } from '../utils/i18n.js';
import { countKeys } from '../utils/json-stats.js';

export async function handleJSONFormatterRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === '/json-formatter' || pathname === '/json-formatter/') {
      if (method === 'GET') {
        return renderJSONFormatterPage(resolveRequestLanguage(request, url));
      }
    }

    return respondJSON({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('JSON Formatter Route Error:', error);
    return respondJSON(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function renderJSONFormatterPage(lang = 'en') {
  const toolTranslation = getToolTranslation('json-formatter', lang);
  const tr = (key, fallback) => {
    const value = t(key, lang);
    return value === key ? fallback : value;
  };
  const toolHeader = createToolHeader(
    { emoji: '📋' },
    toolTranslation?.name || 'JSON Formatter',
    toolTranslation?.desc || 'Format, validate, and beautify JSON data',
    [{ text: tr('tools.json-formatter.ui.badge12', 'Privacy First'), color: 'green', tooltip: 'All processing happens in your browser — no data is sent to any server.' }],
    { toolId: 'json-formatter' }
  );

  const currentTool = TOOLS.find(t => t.id === 'json-formatter');
    const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];


  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">

        ${toolHeader}

        <!-- Controls -->
        <div class="flex flex-wrap gap-3 mb-6 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
          <button id="format-btn" class="btn btn-primary" data-tooltip="Pretty-print with 2-space indent" data-i18n-tooltip="tools.json-formatter.ui.tip0">
            <span data-i18n="tools.json-formatter.ui.button0">🎨 Format</span>
          </button>
          <button id="minify-btn" class="btn btn-secondary" data-tooltip="Remove all whitespace to reduce size" data-i18n-tooltip="tools.json-formatter.ui.tip1">
            <span data-i18n="tools.json-formatter.ui.button1">📦 Minify</span>
          </button>
          <button id="validate-btn" class="btn btn-secondary" data-tooltip="Check JSON syntax without reformatting" data-i18n-tooltip="tools.json-formatter.ui.tip2">
            <span data-i18n="tools.json-formatter.ui.button2">✓ Validate</span>
          </button>
          <button id="clear-btn" class="btn btn-ghost ml-auto" data-tooltip="Clear input and output" data-i18n-tooltip="tools.json-formatter.ui.tip3">
            <span data-i18n="tools.json-formatter.ui.button3">🗑️ Clear</span>
          </button>
          <button id="copy-btn" class="btn btn-secondary" data-tooltip="Copy formatted output to clipboard" data-i18n-tooltip="tools.json-formatter.ui.tip4">
            <span data-i18n="tools.json-formatter.ui.button4">📋 Copy</span>
          </button>
        </div>

        <!-- JSON Input/Output -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Input -->
          <div class="flex flex-col gap-2">
            <label class="label"><span data-i18n="tools.json-formatter.ui.label5">Input JSON</span></label>
            ${createRichEditorPane({ id: 'input', mode: 'textarea', placeholder: '{"name": "SimpleTool", "version": "2.0", "tools": ["JSON Formatter", "Password Generator"]}' })}
          </div>

           <!-- Output -->
           <div class="flex flex-col gap-2 relative">
              <div class="flex justify-between items-center">
                 <label class="label"><span data-i18n="tools.json-formatter.ui.label6">Formatted Output</span></label>
                 <span id="status-indicator" class="text-xs font-mono hidden"></span>
              </div>
             ${createEmptyState({ icon: '📋', title: 'No output yet', description: 'Paste JSON on the left, then click Format or Minify.', id: 'json-empty-state', i18nTitle: 'tools.json-formatter.ui.desc13', i18nDesc: 'tools.json-formatter.ui.desc14' })}
             ${createRichEditorPane({ id: 'output', mode: 'pre', ariaLabel: 'JSON output', hidden: true })}
             <textarea id="json-output" class="hidden" readonly aria-hidden="true"></textarea>
           </div>
        </div>

        <!-- Status & Stats -->
        <div id="status-message" class="hidden mt-4">
           <div id="status-content" class="rounded-lg p-3 text-sm font-medium border"></div>
        </div>

        <div id="json-stats" class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 hidden">
          <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-size">0</div>
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.json-formatter.ui.stat7" data-tooltip="Total character count in output" data-i18n-tooltip="tools.json-formatter.ui.tip5">Characters</div>
          </div>
          <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-lines">0</div>
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.json-formatter.ui.stat8" data-tooltip="Number of lines in formatted output" data-i18n-tooltip="tools.json-formatter.ui.tip6">Lines</div>
          </div>
          <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-keys">0</div>
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.json-formatter.ui.stat9" data-tooltip="Total object keys including nested" data-i18n-tooltip="tools.json-formatter.ui.tip7">Keys</div>
          </div>
          <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-depth">0</div>
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.json-formatter.ui.stat10" data-tooltip="Deepest nesting level in the structure" data-i18n-tooltip="tools.json-formatter.ui.tip8">Max Depth</div>
          </div>
        </div>

      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'What is JSON?',
          content: '<p>JSON (JavaScript Object Notation) is a lightweight data-interchange format that is easy for humans to read and write and easy for machines to parse and generate. It is based on a subset of the JavaScript Programming Language Standard. JSON is a text format that is completely language independent but uses conventions that are familiar to programmers of the C-family of languages, including C, C++, C#, Java, JavaScript, Perl, Python, and many others.</p><p>These properties make JSON an ideal data-interchange language for web applications, APIs, and configuration files. It represents data as name/value pairs and ordered lists of values. It has become the de facto standard for data exchange on the web, largely replacing XML due to its smaller footprint and better performance.</p>'
        },
        {
          title: 'How to Use This Tool',
          content: '<ol><li>Paste your raw or messy JSON data into the "Input JSON" editor on the left.</li><li>Click the "Format" button to beautify the code with proper indentation and syntax highlighting.</li><li>Alternatively, use the "Minify" button to remove all whitespace for production use.</li><li>Check the "Status" indicator to ensure your JSON is valid; if there\'s an error, the tool will highlight the exact line.</li><li>Click "Copy" to save the formatted result to your clipboard or "Clear" to start over.</li></ol>'
        },
        {
          title: 'Common Use Cases',
          content: '<ul><li><strong>API Debugging:</strong> Quickly format unreadable JSON responses from REST APIs to inspect data structures.</li><li><strong>Config Validation:</strong> Ensure your <code>package.json</code>, <code>tsconfig.json</code>, or other configuration files are syntactically correct.</li><li><strong>Data Preparation:</strong> Minify JSON data before embedding it in code or sending it over a network to save bandwidth.</li><li><strong>Learning & Documentation:</strong> Use the beautified output to create clear examples for technical documentation or tutorials.</li></ul>'
        },
        {
          title: 'Pro Tips',
          content: '<ul><li>Use the "Validate" button if you only want to check for syntax errors without changing the formatting of your input.</li><li>Pay attention to the "Max Depth" statistic to identify overly complex or deeply nested structures that might cause performance issues.</li><li>Always use double quotes for keys and string values, as single quotes are invalid in standard JSON.</li></ul>'
        }
      ], 'json-formatter', lang)}
    ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

   const script = `
     <style>
       ${getRichEditorStyles()}
     </style>
     ${getCopyToClipboardScript()}
     ${getRichEditorScript()}
      <script>
        var inputEditor = new RichEditor('input');
        var outputEditor = new RichEditor('output');
        outputEditor.setHighlighter('json');

        var outputEl = document.getElementById('json-output');
        var statusEl = document.getElementById('status-message');
        var statusContent = document.getElementById('status-content');
        var statsEl = document.getElementById('json-stats');
        var statusIndicator = document.getElementById('status-indicator');

        function showStatus(message, type) {
          type = type || 'success';
          statusEl.classList.remove('hidden');
          if (type === 'success') {
              statusContent.className = 'rounded-lg p-3 text-sm font-medium border bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800';
              statusIndicator.textContent = _t('tools.json-formatter.js.text5', '✓ Valid');
              statusIndicator.className = 'text-xs font-mono text-success-600 dark:text-success-400';
          } else {
              statusContent.className = 'rounded-lg p-3 text-sm font-medium border bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800';
              statusIndicator.textContent = _t('tools.json-formatter.js.text6', '✗ Invalid');
              statusIndicator.className = 'text-xs font-mono text-error-600 dark:text-error-400';
          }
          statusContent.textContent = message;
          statusIndicator.classList.remove('hidden');

          if (type === 'success') {
              setTimeout(function() { statusEl.classList.add('hidden'); }, 3000);
          }
        }

        // Inlined from src/utils/json-stats.js — keep in sync via the import above.
        // The same function powers the unit tests in src/utils/json-stats.test.js.
        ${countKeys.toString()}

        function updateStats(jsonObj, formatted) {
          var result = countKeys(jsonObj);
          document.getElementById('stat-size').textContent = formatted.length.toLocaleString();
          document.getElementById('stat-lines').textContent = formatted.split('\\n').length.toLocaleString();
          document.getElementById('stat-keys').textContent = result.count.toLocaleString();
          document.getElementById('stat-depth').textContent = result.maxDepth;
          statsEl.classList.remove('hidden');
        }

        // Drop the stale formatted output so an error never leaves the user
        // staring at output that does not correspond to their current input.
        function resetOutputPanel() {
          outputEl.value = '';
          outputEditor.clear(true);
          statsEl.classList.add('hidden');
          document.getElementById('json-empty-state').classList.remove('hidden');
        }

        document.getElementById('format-btn').addEventListener('click', function() {
           try {
             var input = inputEditor.getValue().trim();
             if (!input) return showStatus(_t('tools.json-formatter.js.status0', 'Please enter JSON'), 'error');
             var parsed = JSON.parse(input);
             var formatted = JSON.stringify(parsed, null, 2);
             outputEl.value = formatted;
             outputEditor.setValue(formatted);
             document.getElementById('json-empty-state').classList.add('hidden');
             updateStats(parsed, formatted);
             showStatus(_t('tools.json-formatter.js.status1', 'Formatted successfully'), 'success');
           } catch (error) {
             showStatus(error.message, 'error');
             resetOutputPanel();
           }
         });

        document.getElementById('minify-btn').addEventListener('click', function() {
           try {
             var input = inputEditor.getValue().trim();
             if (!input) return showStatus(_t('tools.json-formatter.js.status0', 'Please enter JSON'), 'error');
             var parsed = JSON.parse(input);
             var minified = JSON.stringify(parsed);
             outputEl.value = minified;
             outputEditor.setValue(minified);
             document.getElementById('json-empty-state').classList.add('hidden');
             updateStats(parsed, minified);
             showStatus(_t('tools.json-formatter.js.status2', 'Minified successfully'), 'success');
           } catch (error) {
             showStatus(error.message, 'error');
             resetOutputPanel();
           }
         });

        document.getElementById('validate-btn').addEventListener('click', function() {
          try {
            var input = inputEditor.getValue().trim();
            if (!input) return showStatus(_t('tools.json-formatter.js.status0', 'Please enter JSON'), 'error');
            var parsed = JSON.parse(input);
            updateStats(parsed, input);
            showStatus(_t('tools.json-formatter.js.status3', 'Valid JSON'), 'success');
          } catch (error) {
            showStatus(error.message, 'error');
            // Validate does not write output, but it does surface stats on
            // success — hide them on failure so the panel matches reality.
            statsEl.classList.add('hidden');
          }
        });

        document.getElementById('clear-btn').addEventListener('click', function() {
           inputEditor.clear();
           outputEl.value = '';
           outputEditor.clear(true);
           statusEl.classList.add('hidden');
           statsEl.classList.add('hidden');
           statusIndicator.classList.add('hidden');
           document.getElementById('json-empty-state').classList.remove('hidden');
         });

         document.getElementById('copy-btn').addEventListener('click', function() {
           var text = outputEl.value;
           if (!text) return;
           copyToClipboard(text, this);
         });
      </script>
   `;

  return respondHTML(createPageTemplate({
    title: toolTranslation?.name || 'JSON Formatter',
    description: toolTranslation?.desc || 'Format, validate, minify and beautify JSON data with syntax highlighting and error detection.',
    path: '/json-formatter',
    content,
    scripts: script,
    lang
  }));
}
