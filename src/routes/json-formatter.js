/**
 * JSON Formatter Tool - Format, validate, and beautify JSON
 * All processing happens client-side for privacy
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';

export async function handleJSONFormatterRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === '/json-formatter' || pathname === '/json-formatter/') {
      if (method === 'GET') {
        return renderJSONFormatterPage();
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

function renderJSONFormatterPage() {
  const toolHeader = createToolHeader(
    { emoji: '📋' },
    'JSON Formatter',
    'Format, validate, and beautify JSON data',
    [{ text: 'Privacy First', color: 'green', tooltip: 'All processing happens in your browser — no data is sent to any server.' }],
    { toolId: 'json-formatter' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">

        ${toolHeader}

        <!-- Controls -->
        <div class="flex flex-wrap gap-3 mb-6 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
          <button id="format-btn" class="btn btn-primary" data-tooltip="Pretty-print with 2-space indent">
            <span data-i18n="tools.json-formatter.ui.button0">🎨 Format</span>
          </button>
          <button id="minify-btn" class="btn btn-secondary" data-tooltip="Remove all whitespace to reduce size">
            <span data-i18n="tools.json-formatter.ui.button1">📦 Minify</span>
          </button>
          <button id="validate-btn" class="btn btn-secondary" data-tooltip="Check JSON syntax without reformatting">
            <span data-i18n="tools.json-formatter.ui.button2">✓ Validate</span>
          </button>
          <button id="clear-btn" class="btn btn-ghost ml-auto" data-tooltip="Clear input and output">
            <span data-i18n="tools.json-formatter.ui.button3">🗑️ Clear</span>
          </button>
          <button id="copy-btn" class="btn btn-secondary" data-tooltip="Copy formatted output to clipboard">
            <span data-i18n="tools.json-formatter.ui.button4">📋 Copy</span>
          </button>
        </div>

        <!-- JSON Input/Output -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Input -->
          <div class="flex flex-col gap-2">
            <label class="label"><span data-i18n="tools.json-formatter.ui.label5">Input JSON</span></label>
            <textarea id="json-input" rows="20" 
              placeholder='{"name": "SimpleTool", "version": "2.0", "tools": ["JSON Formatter", "Password Generator"]}' 
              class="input-mono resize-none"></textarea>
          </div>

          <!-- Output -->
          <div class="flex flex-col gap-2 relative">
             <div class="flex justify-between items-center">
                <label class="label"><span data-i18n="tools.json-formatter.ui.label6">Formatted Output</span></label>
                <span id="status-indicator" class="text-xs font-mono hidden"></span>
             </div>
            <textarea id="json-output" rows="20" readonly aria-label="JSON output" class="input-mono resize-none bg-surface-50 dark:bg-surface-950"></textarea>
          </div>
        </div>

        <!-- Status & Stats -->
        <div id="status-message" class="hidden mt-4">
           <div id="status-content" class="rounded-lg p-3 text-sm font-medium border"></div>
        </div>

        <div id="json-stats" class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 hidden">
          <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-size">0</div>
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.json-formatter.ui.stat7" data-tooltip="Total character count in output">Characters</div>
          </div>
          <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-lines">0</div>
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.json-formatter.ui.stat8" data-tooltip="Number of lines in formatted output">Lines</div>
          </div>
          <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-keys">0</div>
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.json-formatter.ui.stat9" data-tooltip="Total object keys including nested">Keys</div>
          </div>
          <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-depth">0</div>
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.json-formatter.ui.stat10" data-tooltip="Deepest nesting level in the structure">Max Depth</div>
          </div>
        </div>

      </div>
    </main>
  `;

  const script = `
    <script>
      const inputEl = document.getElementById('json-input');
      const outputEl = document.getElementById('json-output');
      const statusEl = document.getElementById('status-message');
      const statusContent = document.getElementById('status-content');
      const statsEl = document.getElementById('json-stats');
      const statusIndicator = document.getElementById('status-indicator');

      function showStatus(message, type = 'success') {
        statusEl.classList.remove('hidden');
        if (type === 'success') {
            statusContent.className = 'rounded-lg p-3 text-sm font-medium border bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
            statusIndicator.textContent = _t('tools.json-formatter.js.text5', '✓ Valid');
            statusIndicator.className = 'text-xs font-mono text-green-600 dark:text-green-400';
        } else {
            statusContent.className = 'rounded-lg p-3 text-sm font-medium border bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
            statusIndicator.textContent = _t('tools.json-formatter.js.text6', '✗ Invalid');
            statusIndicator.className = 'text-xs font-mono text-red-600 dark:text-red-400';
        }
        statusContent.textContent = message;
        statusIndicator.classList.remove('hidden');
        
        // Auto hide success messages, keep errors
        if (type === 'success') {
            setTimeout(() => statusEl.classList.add('hidden'), 3000);
        }
      }

      function countKeys(obj, depth = 0) {
        let count = 0;
        let maxDepth = depth;
        if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            count++;
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              const result = countKeys(obj[key], depth + 1);
              count += result.count;
              maxDepth = Math.max(maxDepth, result.maxDepth);
            }
          }
        }
        return { count, maxDepth };
      }

      function updateStats(jsonObj, formatted) {
        const { count, maxDepth } = countKeys(jsonObj);
        document.getElementById('stat-size').textContent = formatted.length.toLocaleString();
        document.getElementById('stat-lines').textContent = formatted.split('\\n').length.toLocaleString();
        document.getElementById('stat-keys').textContent = count.toLocaleString();
        document.getElementById('stat-depth').textContent = maxDepth;
        statsEl.classList.remove('hidden');
      }

      document.getElementById('format-btn').addEventListener('click', () => {
        try {
          const input = inputEl.value.trim();
          if (!input) return showStatus(_t('tools.json-formatter.js.status0', 'Please enter JSON'), 'error');
          const parsed = JSON.parse(input);
          const formatted = JSON.stringify(parsed, null, 2);
          outputEl.value = formatted;
          updateStats(parsed, formatted);
          showStatus(_t('tools.json-formatter.js.status1', 'Formatted successfully'), 'success');
        } catch (error) {
          showStatus(error.message, 'error');
          statsEl.classList.add('hidden');
        }
      });

      document.getElementById('minify-btn').addEventListener('click', () => {
        try {
          const input = inputEl.value.trim();
          if (!input) return showStatus(_t('tools.json-formatter.js.status0', 'Please enter JSON'), 'error');
          const parsed = JSON.parse(input);
          const minified = JSON.stringify(parsed);
          outputEl.value = minified;
          updateStats(parsed, minified);
          showStatus(_t('tools.json-formatter.js.status2', 'Minified successfully'), 'success');
        } catch (error) {
          showStatus(error.message, 'error');
        }
      });

      document.getElementById('validate-btn').addEventListener('click', () => {
        try {
          const input = inputEl.value.trim();
          if (!input) return showStatus(_t('tools.json-formatter.js.status0', 'Please enter JSON'), 'error');
          const parsed = JSON.parse(input);
          updateStats(parsed, input);
          showStatus(_t('tools.json-formatter.js.status3', 'Valid JSON'), 'success');
        } catch (error) {
          showStatus(error.message, 'error');
        }
      });

      document.getElementById('clear-btn').addEventListener('click', () => {
        inputEl.value = '';
        outputEl.value = '';
        statusEl.classList.add('hidden');
        statsEl.classList.add('hidden');
        statusIndicator.classList.add('hidden');
      });

      document.getElementById('copy-btn').addEventListener('click', async () => {
        const text = outputEl.value;
        if (!text) return;
        
        try {
          await navigator.clipboard.writeText(text);
          const btn = document.getElementById('copy-btn');
          const originalText = btn.textContent;
          btn.textContent = _t('tools.json-formatter.js.text7', '✓ Copied');
          setTimeout(() => btn.textContent = originalText, 2000);
        } catch (err) {
          showStatus(_t('tools.json-formatter.js.status4', 'Failed to copy'), 'error');
        }
      });
    </script>
  `;

  return respondHTML(createPageTemplate({
    title: 'JSON Formatter',
    description: 'Format, validate, minify and beautify JSON data with syntax highlighting and error detection.',
    path: '/json-formatter',
    content,
    scripts: script
  }));
}
