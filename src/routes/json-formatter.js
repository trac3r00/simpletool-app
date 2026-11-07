/**
 * JSON Formatter Tool - Format, validate, and beautify JSON
 * All processing happens client-side for privacy
 */

import { respondHTML, respondJSON } from "../utils/respond.js";
import {
  createPageTemplate,
  createToolHeader,
  createEmptyState,
  getAdSlotHTML,
} from "../utils/common-ui.js";
import {
  createRichEditorPane,
  getRichEditorStyles,
  getRichEditorScript,
} from "../utils/rich-editor.js";
import {
  createEducationalSection,
  createRelatedToolsSection,
  createVisibleArticle,
} from "../utils/content-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import {
  getToolTranslation,
  resolveRequestLanguage,
  t,
} from "../utils/i18n.js";
import { countKeys } from "../utils/json-stats.js";
import {
  preprocessJSONRepairInput,
  repairJSONInput,
} from "../utils/json-repair-logic.js";
import {
  findImpreciseNumbers,
  reformatJSON,
} from "../utils/json-formatter-logic.js";

export async function handleJSONFormatterRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === "/json-formatter" || pathname === "/json-formatter/") {
      if (method === "GET") {
        return renderJSONFormatterPage(resolveRequestLanguage(request, url));
      }
    }

    return respondJSON({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("JSON Formatter Route Error:", error);
    return respondJSON(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    );
  }
}

function renderJSONFormatterPage(lang = "en") {
  const toolTranslation = getToolTranslation("json-formatter", lang);
  const tr = (key, fallback) => {
    const value = t(key, lang);
    return value === key ? fallback : value;
  };
  const toolHeader = createToolHeader(
    { emoji: "📋" },
    toolTranslation?.name || "JSON Formatter",
    toolTranslation?.desc || "Format, validate, and beautify JSON data",
    [
      {
        text: tr("tools.json-formatter.ui.badge12", "Privacy First"),
        color: "green",
        tooltip:
          "All processing happens in your browser — your data is not sent to our servers.",
      },
    ],
    { toolId: "json-formatter" },
  );

  const currentTool = TOOLS.find((t) => t.id === "json-formatter");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <script src="/vendor/jsonrepair.min.js" integrity="sha384-txNZtQavpmzyVZuGJ+Qefns6TreANP5hTgsyCmMT0m3JLHvhol2i/kZLbG2cx1uI" crossorigin="anonymous"></script>

    <main class="tool-page-shell">
      <div class="tool-page-panel">

        ${toolHeader}

        ${createVisibleArticle({
          title: '<span data-i18n="tools.json-formatter.ui.r64_0">Why this JSON formatter does not upload your document</span>',
          paragraphs: [
            `<span data-i18n-html="tools.json-formatter.ui.r64_1">This page calls the browser's <code>JSON.parse</code> and <code>JSON.stringify</code>. There is no "save" action, no paste history, and no shareable link with a sequential id. That is the product: a formatter you can use on an API envelope that still contains session cookies or internal hostnames.</span>`,
            `<span data-i18n-html="tools.json-formatter.ui.r64_2">In November 2025, security researchers showed that long-running online formatters which <em>do</em> store pastes had leaked years of JSON through predictable "recent" URLs. The documents included cloud access keys, JWTs, and internal configs. If a site can show you last week's paste, it had to receive it. This tool never gets that chance because the Worker only serves the HTML and static assets.</span>`,
            `<span data-i18n-html="tools.json-formatter.ui.r64_3">Valid JSON is RFC 8259: double-quoted keys and strings, no trailing commas, no comments, no single quotes. The validator reports the first parse error with a line number. Pretty-print is lossless whitespace; minify is the inverse. Neither step sends a byte of the document off this origin.</span>`,
          ],
        })}

        <!-- Controls -->
        <div class="flex flex-wrap gap-3 mb-6 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
          <button id="format-btn" class="btn btn-primary" data-tooltip="Pretty-print with 2-space indent" data-i18n-tooltip="tools.json-formatter.ui.r64_6">
            <span data-i18n="tools.json-formatter.ui.button0">🎨 Format</span>
          </button>
          <button id="minify-btn" class="btn btn-secondary" data-tooltip="Remove all whitespace to reduce size" data-i18n-tooltip="tools.json-formatter.ui.r64_7">
            <span data-i18n="tools.json-formatter.ui.button1">📦 Minify</span>
          </button>
          <button id="validate-btn" class="btn btn-secondary" data-tooltip="Check JSON syntax without reformatting" data-i18n-tooltip="tools.json-formatter.ui.r64_8">
            <span data-i18n="tools.json-formatter.ui.button2">✓ Validate</span>
          </button>
          <button data-i18n-tooltip="tools.json-formatter.ui.r6_0" id="repair-btn" class="btn btn-secondary" data-tooltip="Fix broken JSON such as LLM output, then format it">
            <span data-i18n="tools.json-formatter.ui.r6_1">🔧 Repair</span>
          </button>
          <button id="clear-btn" class="btn btn-ghost ml-auto" data-tooltip="Clear input and output" data-i18n-tooltip="tools.json-formatter.ui.r64_9">
            <span data-i18n="tools.json-formatter.ui.button3">🗑️ Clear</span>
          </button>
          <button id="copy-btn" class="btn btn-secondary" disabled data-tooltip="Copy formatted output to clipboard" data-i18n-tooltip="tools.json-formatter.ui.r64_10">
            <span data-i18n="tools.json-formatter.ui.button4">📋 Copy</span>
          </button>
        </div>

        <!-- JSON Input/Output -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Input -->
          <div class="flex flex-col gap-2">
            <label class="label"><span data-i18n="tools.json-formatter.ui.label5">Input JSON</span></label>
            ${createRichEditorPane({ id: "input", mode: "textarea", ariaLabel: "JSON input", placeholder: '{"name": "SimpleTool", "version": "2.0", "tools": ["JSON Formatter", "Password Generator"]}', ariaI18nKey: "tools.json-formatter.ui.r64_4" })}
          </div>

           <!-- Output -->
           <div class="flex flex-col gap-2 relative">
              <div class="flex justify-between items-center">
                 <label class="label"><span data-i18n="tools.json-formatter.ui.label6">Formatted Output</span></label>
                 <span id="status-indicator" class="text-xs font-mono hidden"></span>
              </div>
             ${createEmptyState({ icon: "📋", title: "No output yet", description: "Paste JSON on the left, then click Format or Minify.", id: "json-empty-state", i18nTitle: "tools.json-formatter.ui.desc13", i18nDesc: "tools.json-formatter.ui.desc14" })}
             ${createRichEditorPane({ id: "output", mode: "pre", ariaLabel: "JSON output", hidden: true, ariaI18nKey: "tools.json-formatter.ui.r64_5" })}
             <textarea id="json-output" class="hidden" readonly aria-hidden="true"></textarea>
           </div>
        </div>

        <!-- Status & Stats -->
        <div id="status-message" class="hidden mt-4">
           <div id="status-content" class="rounded-lg p-3 text-sm font-medium border"></div>
        </div>
        <p id="repair-fixes" class="hidden mt-2 text-sm text-surface-600 dark:text-surface-400" aria-live="polite"></p>

        <div id="json-stats" class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 hidden">
          <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-size">0</div>
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.json-formatter.ui.stat7" data-tooltip="Total character count in output" data-i18n-tooltip="tools.json-formatter.ui.r64_11">Characters</div>
          </div>
          <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-lines">0</div>
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.json-formatter.ui.stat8" data-tooltip="Number of lines in formatted output" data-i18n-tooltip="tools.json-formatter.ui.r64_12">Lines</div>
          </div>
          <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-keys">0</div>
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.json-formatter.ui.stat9" data-tooltip="Total object keys including nested" data-i18n-tooltip="tools.json-formatter.ui.r64_13">Keys</div>
          </div>
          <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-depth">0</div>
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.json-formatter.ui.stat10" data-tooltip="Deepest nesting level in the structure" data-i18n-tooltip="tools.json-formatter.ui.r64_14">Max Depth</div>
          </div>
        </div>

        <section id="repair-help" class="card mt-6 p-4 sm:p-6" aria-labelledby="repair-help-title">
          <h2 id="repair-help-title" class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2" data-i18n="tools.json-formatter.ui.r4_0">Repair broken JSON from LLMs</h2>
          <p data-i18n-html="tools.json-formatter.ui.r6_2" class="text-sm text-surface-600 dark:text-surface-400 mb-2">The Repair button first removes a Markdown code fence (<code>\`\`\`json … \`\`\`</code>) and any text before the first <code>{</code> or <code>[</code>, then runs the open-source jsonrepair library in your browser. It fixes:</p>
          <ul class="list-disc pl-5 text-sm text-surface-600 dark:text-surface-400 space-y-1">
            <li data-i18n-html="tools.json-formatter.ui.r6_3">Trailing commas: <code>{"a": 1,}</code></li>
            <li data-i18n-html="tools.json-formatter.ui.r6_4">Single quotes: <code>{'a': 'text'}</code></li>
            <li data-i18n-html="tools.json-formatter.ui.r6_5">Comments: <code>// line</code> and <code>/* block */</code></li>
            <li data-i18n-html="tools.json-formatter.ui.r6_6">Unquoted keys: <code>{a: 1}</code></li>
            <li data-i18n-html="tools.json-formatter.ui.r6_7">Truncated output: <code>{"a": [1, 2</code> is closed as <code>{"a": [1, 2]}</code></li>
            <li data-i18n-html="tools.json-formatter.ui.r6_8">Python <code>True</code> and <code>None</code>, converted to <code>true</code> and <code>null</code></li>
          </ul>
          <p data-i18n-html="tools.json-formatter.ui.r6_9" class="text-sm text-surface-600 dark:text-surface-400 mt-2">The result goes to the output panel and your input stays unchanged. Check the repaired data before you use it: a truncated document is closed, but its missing values cannot be recovered. If the text before the JSON itself contains <code>{</code> or <code>[</code>, delete that text first.</p>
        </section>

      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection(
        [
          {
            title: "What is JSON?",
            content:
              "<p>JSON (JavaScript Object Notation) is a lightweight data-interchange format that is easy for humans to read and write and easy for machines to parse and generate. It is based on a subset of the JavaScript Programming Language Standard. JSON is a text format that is completely language independent but uses conventions that are familiar to programmers of the C-family of languages, including C, C++, C#, Java, JavaScript, Perl, Python, and many others.</p><p>These properties make JSON an ideal data-interchange language for web applications, APIs, and configuration files. It represents data as name/value pairs and ordered lists of values. It has become the de facto standard for data exchange on the web, largely replacing XML due to its smaller footprint and better performance.</p>",
          },
          {
            title: "How to Use This Tool",
            content:
              '<ol><li>Paste your raw or messy JSON data into the "Input JSON" editor on the left.</li><li>Click the "Format" button to beautify the code with proper indentation and syntax highlighting.</li><li>Alternatively, use the "Minify" button to remove all whitespace for production use.</li><li>Check the "Status" indicator to ensure your JSON is valid; if there\'s an error, the tool will highlight the exact line.</li><li>Click "Copy" to save the formatted result to your clipboard or "Clear" to start over.</li></ol>',
          },
          {
            title: "Common Use Cases",
            content:
              "<ul><li><strong>API Debugging:</strong> Quickly format unreadable JSON responses from REST APIs to inspect data structures.</li><li><strong>Config Validation:</strong> Ensure your <code>package.json</code>, <code>tsconfig.json</code>, or other configuration files are syntactically correct.</li><li><strong>Data Preparation:</strong> Minify JSON data before embedding it in code or sending it over a network to save bandwidth.</li><li><strong>Learning & Documentation:</strong> Use the beautified output to create clear examples for technical documentation or tutorials.</li></ul>",
          },
          {
            title: "Pro Tips",
            content:
              '<ul><li>Use the "Validate" button if you only want to check for syntax errors without changing the formatting of your input.</li><li>Pay attention to the "Max Depth" statistic to identify overly complex or deeply nested structures that might cause performance issues.</li><li data-i18n="tools.json-formatter.ui.r4_1">Always use double quotes for keys and string values, as single quotes are invalid in standard JSON.</li></ul>',
          },
        ],
        "json-formatter",
        lang,
      )}
    ${createRelatedToolsSection(relatedToolsData)}
    </div>
    ${getAdSlotHTML("json", {
      path: "/json-formatter",
      wrapperClassName: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8",
    })}
  `;

  const script = `
      <style>
        ${getRichEditorStyles()}
      </style>
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

        // Inlined from src/utils/json-repair-logic.js (tested in json-repair-logic.test.js).
        ${preprocessJSONRepairInput.toString()}
        ${repairJSONInput.toString()}

        // Inlined from src/utils/json-formatter-logic.js (tested in json-formatter-logic.test.js).
        ${reformatJSON.toString()}
        ${findImpreciseNumbers.toString()}

        var copyBtn = document.getElementById('copy-btn');
        function setOutput(text) {
          outputEl.value = text;
          outputEditor.setValue(text);
          document.getElementById('json-empty-state').classList.add('hidden');
          copyBtn.disabled = !text;
        }

        // Format/Minify re-indent the original text instead of re-serialising
        // the parsed value, so numbers beyond 2^53 and duplicate keys survive.
        function precisionNote(input) {
          var imprecise = findImpreciseNumbers(input);
          return imprecise.length
            ? '. ' + imprecise.length + ' number(s) exceed JavaScript precision and were kept exactly as written (e.g. ' + imprecise[0] + ').'
            : '';
        }

        var repairFixesEl = document.getElementById('repair-fixes');
        function hideRepairFixes() {
          repairFixesEl.textContent = '';
          repairFixesEl.classList.add('hidden');
        }

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
          copyBtn.disabled = true;
          statsEl.classList.add('hidden');
          document.getElementById('json-empty-state').classList.remove('hidden');
        }

        document.getElementById('format-btn').addEventListener('click', function() {
           try {
             var input = inputEditor.getValue().trim();
             if (!input) return showStatus(_t('tools.json-formatter.js.status0', 'Please enter JSON'), 'error');
             var parsed = JSON.parse(input);
             var formatted = reformatJSON(input, 2);
             setOutput(formatted);
             updateStats(parsed, formatted);
             showStatus(_t('tools.json-formatter.js.status1', 'Formatted successfully') + precisionNote(input), 'success');
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
             var minified = reformatJSON(input, 0);
             setOutput(minified);
             updateStats(parsed, minified);
             showStatus(_t('tools.json-formatter.js.status2', 'Minified successfully') + precisionNote(input), 'success');
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
           copyBtn.disabled = true;
           statusEl.classList.add('hidden');
           statsEl.classList.add('hidden');
           statusIndicator.classList.add('hidden');
           document.getElementById('json-empty-state').classList.remove('hidden');
         });

        document.getElementById('repair-btn').addEventListener('click', function() {
          hideRepairFixes();
          var raw = inputEditor.getValue();
          if (!raw.trim()) return showStatus(_t('tools.json-formatter.js.status0', 'Please enter JSON'), 'error');
          if (typeof JSONRepair === 'undefined' || typeof JSONRepair.jsonrepair !== 'function') {
            showStatus(_t('tools.json-formatter.js.r4_0', 'The repair library did not load. Reload the page and try again.'), 'error');
            resetOutputPanel();
            return;
          }
          var result = repairJSONInput(raw, JSONRepair.jsonrepair);
          if (!result.ok) {
            showStatus((_t('tools.json-formatter.js.r4_1', 'Could not repair JSON:') + ' ') + result.error, 'error');
            resetOutputPanel();
            return;
          }
          var formatted = reformatJSON(result.repaired, 2);
          setOutput(formatted);
          updateStats(result.value, formatted);
          showStatus(result.fixes.length ? 'Repaired and formatted' : 'Already valid JSON; formatted', 'success');
          repairFixesEl.textContent = result.fixes.length
            ? 'Fixes applied: ' + result.fixes.join(', ')
            : 'No fixes needed.';
          repairFixesEl.classList.remove('hidden');
        });

        // A stale repair summary must not describe output from another action.
        ['format-btn', 'minify-btn', 'validate-btn', 'clear-btn'].forEach(function(id) {
          document.getElementById(id).addEventListener('click', hideRepairFixes);
        });

         document.getElementById('copy-btn').addEventListener('click', function() {
           var text = outputEl.value;
           if (!text) return;
           copyToClipboard(text, this);
         });
      </script>
   `;

  return respondHTML(
    createPageTemplate({
      title: toolTranslation?.name || "JSON Formatter",
      description:
        toolTranslation?.desc ||
        "Format, validate, minify and beautify JSON data with syntax highlighting and error detection.",
      path: "/json-formatter",
      content,
      scripts: script,
      lang,
    }),
  );
}
