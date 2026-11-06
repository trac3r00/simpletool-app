/**
 * Text Diff Checker Tool
 * Compare two texts and show differences
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
import { createTextDiffEngine } from "../utils/text-diff-logic.js";

export async function handleTextDiffRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === "/text-diff" || pathname === "/text-diff/") {
      if (method === "GET") {
        return renderTextDiffPage(resolveRequestLanguage(request, url));
      }
    }

    return respondJSON({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("Text Diff Route Error:", error);
    return respondJSON(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    );
  }
}

function renderTextDiffPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("text-diff", currentLang);
  const toolHeader = createToolHeader(
    { emoji: "🔍" },
    translation?.name || "Text Diff",
    translation?.desc ||
      "Compare two texts side-by-side and highlight differences",
    [
      {
        text: translation?.ui?.badge8 || "Privacy First",
        color: "blue",
        tooltip:
          "All processing happens in your browser — your data is not sent to our servers.",
      },
    ],
    { toolId: "text-diff" },
  );

  const currentTool = TOOLS.find((t) => t.id === "text-diff");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">

        ${toolHeader}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="card p-4">
            <h2 class="text-lg font-semibold mb-2 text-surface-900 dark:text-surface-50" data-i18n="tools.text-diff.ui.heading3">Original Text</h2>
            <textarea id="text1" rows="15" aria-label="Original text" data-tooltip="Paste the original text here" data-i18n-tooltip="tools.text-diff.ui.tip0" class="input-mono w-full resize-none" placeholder="Enter original text..." data-i18n-placeholder="tools.text-diff.ui.placeholder1"></textarea>
          </div>

          <div class="card p-4">
            <h2 class="text-lg font-semibold mb-2 text-surface-900 dark:text-surface-50" data-i18n="tools.text-diff.ui.heading4">Modified Text</h2>
            <textarea id="text2" rows="15" aria-label="Modified text" data-tooltip="Paste the modified text here" data-i18n-tooltip="tools.text-diff.ui.tip2" class="input-mono w-full resize-none" placeholder="Enter modified text..." data-i18n-placeholder="tools.text-diff.ui.placeholder2"></textarea>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-x-6 gap-y-3 mb-4">
          <div class="flex items-center gap-2">
            <label for="diff-mode" class="label mb-0" data-i18n="tools.text-diff.ui.r3_4">Compare by</label>
            <select id="diff-mode" class="input w-auto min-h-[44px]">
              <option value="line" selected data-i18n="tools.text-diff.ui.r3_0">Lines</option>
              <option value="word">Words</option>
              <option value="char">Characters</option>
            </select>
          </div>
          <label class="flex items-center gap-2 min-h-[44px] cursor-pointer text-sm text-surface-700 dark:text-surface-300">
            <input type="checkbox" id="ignore-whitespace" class="w-5 h-5 accent-primary-600">
            Ignore whitespace
          </label>
          <label class="flex items-center gap-2 min-h-[44px] cursor-pointer text-sm text-surface-700 dark:text-surface-300">
            <input type="checkbox" id="ignore-case" class="w-5 h-5 accent-primary-600">
            Ignore case
          </label>
        </div>

        <button id="compare-btn" class="btn btn-primary w-full py-4 text-lg mb-6" data-tooltip="Compare the two texts and highlight differences" data-i18n-tooltip="tools.text-diff.ui.tip1">
          <span data-i18n="tools.text-diff.ui.button0">Compare Texts</span>
        </button>

        <div id="result" class="hidden card p-6">
           <div class="flex items-center justify-between mb-4">
             <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.text-diff.ui.heading5">Differences</h2>
             <div class="flex gap-4 text-xs">
               <span class="flex items-center gap-1"><span class="w-3 h-3 bg-success-100 border border-success-300 rounded-sm"></span> Added</span>
               <span class="flex items-center gap-1"><span class="w-3 h-3 bg-error-100 border border-error-300 rounded-sm"></span> Removed</span>
             </div>
           </div>
          <dl id="diff-stats" class="grid grid-cols-3 gap-3 mb-4 text-center">
            <div class="rounded-lg border border-border bg-success-50 dark:bg-success-900/20 p-3">
              <dt class="text-xs text-muted-foreground">Added</dt>
              <dd id="stat-added" class="text-xl font-semibold text-success-700 dark:text-success-300">0</dd>
            </div>
            <div class="rounded-lg border border-border bg-error-50 dark:bg-error-900/20 p-3">
              <dt class="text-xs text-muted-foreground">Removed</dt>
              <dd id="stat-removed" class="text-xl font-semibold text-error-700 dark:text-error-300">0</dd>
            </div>
            <div class="rounded-lg border border-border bg-surface-50 dark:bg-surface-900 p-3">
              <dt class="text-xs text-muted-foreground">Unchanged</dt>
              <dd id="stat-unchanged" class="text-xl font-semibold text-surface-800 dark:text-surface-100">0</dd>
            </div>
          </dl>
          <p id="stat-unit" class="text-xs text-muted-foreground mb-2"></p>
          <p id="diff-notice" class="hidden text-sm mb-3 p-3 rounded-lg border border-info-300 bg-info-50 text-info-900 dark:bg-info-900/20 dark:text-info-100 dark:border-info-700" role="status"></p>
          <div id="diff-output" class="font-mono text-sm whitespace-pre-wrap bg-surface-50 dark:bg-surface-950 p-4 rounded-lg border border-surface-200 dark:border-surface-800 overflow-x-auto max-h-[70vh] overflow-y-auto"></div>

          <div class="mt-6">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
              <h3 class="text-base font-semibold text-surface-900 dark:text-surface-50" data-i18n="tools.text-diff.ui.r3_5">Unified diff</h3>
              <div class="flex gap-2">
                <button type="button" id="copy-unified" class="btn btn-secondary">
                  <span class="material-symbols-rounded" aria-hidden="true" data-icon="content_copy"></span>
                  Copy diff
                </button>
                <button type="button" id="download-unified" class="btn btn-secondary">
                  <span class="material-symbols-rounded" aria-hidden="true" data-icon="download"></span>
                  Download .diff
                </button>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mb-2" data-i18n="tools.text-diff.ui.r3_11">Always line-based, with 3 lines of context around each change.</p>
            <pre id="unified-output" class="font-mono text-xs whitespace-pre overflow-auto max-h-96 bg-surface-50 dark:bg-surface-950 p-4 rounded-lg border border-surface-200 dark:border-surface-800 text-surface-800 dark:text-surface-200" tabindex="0" aria-label="Unified diff output"></pre>
            <p id="unified-status" class="text-sm mt-2 text-muted-foreground" role="status" aria-live="polite"></p>
          </div>
        </div>
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <section class="card p-6 sm:p-8 mt-8 text-sm text-surface-700 dark:text-surface-300 leading-relaxed" aria-labelledby="diff-guide-heading">
        <h2 id="diff-guide-heading" class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.text-diff.ui.r3_6">How the comparison works</h2>
        <p class="mb-4">The diff uses Myers' algorithm, which finds a shortest edit script: the fewest insertions and deletions that turn the original into the modified text. Everything else is shown as unchanged. All of it runs in your browser. For very large inputs that share little text, the search is capped to keep the page responsive; the page tells you when that happens, and the diff it shows is still correct but may not be the smallest one.</p>

        <h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mt-6 mb-2" data-i18n="tools.text-diff.ui.r3_7">Comparison modes</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>Lines</strong> compares whole lines, like <code>diff</code> and <code>git diff</code>. Best for code, config files, and logs.</li>
          <li><strong data-i18n="tools.text-diff.ui.r3_1">Words</strong> compares words and the whitespace between them, so a one-word edit in a long paragraph shows as one word instead of a whole changed line. Best for prose and prompts.</li>
          <li><strong data-i18n="tools.text-diff.ui.r3_2">Characters</strong> compares single characters (Unicode code points, so emoji and accented letters count as one). Best for short strings such as IDs, hashes, or URLs.</li>
        </ul>

        <h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mt-6 mb-2" data-i18n="tools.text-diff.ui.r3_8">Ignore whitespace and ignore case</h3>
        <p class="mb-2"><strong>Ignore case</strong> treats upper- and lower-case letters as equal.</p>
        <p><strong>Ignore whitespace</strong> in line mode removes all spaces, tabs, and other whitespace before comparing two lines, like <code>git diff -w</code>, so re-indented lines count as unchanged. In word and character modes, any run of whitespace matches any other run, so <code>a&nbsp;&nbsp;b</code> matches <code>a b</code>, but whitespace added where there was none still counts as a change.</p>

        <h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mt-6 mb-2" data-i18n="tools.text-diff.ui.r3_9">Unified diff format</h3>
        <p class="mb-2">The export uses the unified format that <code>diff -u</code> produces and <code>patch</code> reads:</p>
        <pre class="font-mono text-xs bg-surface-50 dark:bg-surface-950 p-4 rounded-lg border border-surface-200 dark:border-surface-800 overflow-x-auto mb-2">--- original.txt
+++ modified.txt
@@ -1,3 +1,3 @@
 host = localhost
-port = 8080
+port = 9090
 debug = false</pre>
        <ul class="list-disc pl-5 space-y-1">
          <li><code>---</code> and <code>+++</code> name the original and modified files.</li>
          <li>Each hunk starts with <code>@@ -start,count +start,count @@</code>: the first line number and the number of lines the hunk covers in each file. A count of 1 is left out.</li>
          <li>Lines starting with a space are context, <code>-</code> lines are removed, and <code>+</code> lines are added. Each hunk has up to 3 lines of context, and changes that close together share a hunk.</li>
          <li><code>\\ No newline at end of file</code> marks a last line that has no trailing newline.</li>
          <li>To apply the downloaded file: <code>patch original.txt text-diff.diff</code>.</li>
        </ul>
        <p class="mt-2">With an ignore option on, lines that count as equal are written as context from the original text. Applying that patch does not reproduce the ignored differences.</p>

        <h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mt-6 mb-2" data-i18n="tools.text-diff.ui.r3_10">Common uses</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>Config files:</strong> compare a deployed <code>.env</code>, YAML, or nginx config with the version you expect, and turn on ignore whitespace to hide indentation noise.</li>
          <li><strong>LLM prompt versions:</strong> use word mode to see exactly which instructions changed between two prompt drafts before you compare model outputs.</li>
          <li><strong>Code review:</strong> paste two versions of a function to read the change outside your editor, or export a <code>.diff</code> to attach to an issue or a message.</li>
        </ul>
      </section>
      ${createEducationalSection(
        [
          {
            title: "What is Text Diffing?",
            content:
              "<p>Text diffing is the process of comparing two sequences of data (usually text) to identify the differences between them. It highlights what has been added, removed, or modified. This is a fundamental operation in software development, data analysis, and content management, allowing users to track changes over time or compare different versions of a document.</p>",
          },
          {
            title: "Diff Algorithms",
            content:
              "<p>Most text diffing tools use algorithms based on the Longest Common Subsequence (LCS) problem. The goal is to find the longest sequence of elements that appear in both texts in the same relative order. Common implementations include the Myers diff algorithm, which is highly efficient and used by Git, and the Hunt-McIlroy algorithm. These algorithms calculate the minimum number of edits (insertions and deletions) required to transform one text into another.</p>",
          },
          {
            title: "Use Cases",
            content:
              "<ul><li><strong>Code Reviews:</strong> Developers use diffs to see exactly what changed in a pull request.</li><li><strong>Version Control:</strong> Systems like Git store history as a series of diffs to save space.</li><li><strong>Content Auditing:</strong> Writers and editors compare drafts to ensure all requested changes were made.</li><li><strong>Data Validation:</strong> Comparing configuration files or database exports to find discrepancies.</li><li><strong>Legal and Compliance:</strong> Comparing contracts or policy documents to identify subtle wording changes.</li></ul>",
          },
          {
            title: "Pro Tips",
            content:
              "<ul><li><strong>Ignore Whitespace:</strong> Many diff tools have options to ignore changes in indentation or trailing spaces, which can reduce noise when comparing code.</li><li><strong>Context Lines:</strong> When viewing diffs, including a few lines of unchanged text around the differences (context) helps you understand the impact of the changes.</li><li><strong>Word-level vs. Line-level:</strong> While line-level diffs are standard for code, word-level diffs are often more useful for prose and natural language documents.</li><li><strong>Side-by-Side View:</strong> For complex changes, a side-by-side (split) view is often easier to read than a unified (inline) view.</li></ul>",
          },
        ],
        "text-diff",
        currentLang,
      )}
    ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const script = `
     <style>
       .diff-add { background-color: rgba(34, 197, 94, 0.2); color: #14532d; }
       .dark .diff-add { background-color: rgba(34, 197, 94, 0.2); color: #86efac; }
       
       .diff-remove { background-color: rgba(239, 68, 68, 0.2); text-decoration: line-through; color: #7f1d1d; }
       .dark .diff-remove { background-color: rgba(239, 68, 68, 0.2); color: #fca5a5; }
     </style>
    <script>
      const textDiffEngine = (${createTextDiffEngine.toString()})();
      const DIFF_MAX_COST = 20000000;
      const UNIT_LABELS = { line: 'lines', word: 'words', char: 'characters' };
      let lastUnifiedDiff = '';

      function escapeHTML(str) {
        return str.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
      }

      function stripNewline(line) {
        return line.endsWith('\\n') ? line.slice(0, -1) : line;
      }

      function renderLineOps(ops) {
        return ops.map((op) => {
          if (op.type === 'insert') return '<div class="diff-add px-1">+ ' + escapeHTML(stripNewline(op.b)) + '</div>';
          if (op.type === 'delete') return '<div class="diff-remove px-1">- ' + escapeHTML(stripNewline(op.a)) + '</div>';
          return '<div class="px-1 text-surface-600 dark:text-surface-400">  ' + escapeHTML(stripNewline(op.b)) + '</div>';
        }).join('');
      }

      function renderInlineOps(ops) {
        let html = '';
        let runType = null;
        let runText = '';
        const flush = () => {
          if (!runText) return;
          const text = escapeHTML(runText);
          if (runType === 'insert') html += '<ins class="diff-add no-underline">' + text + '</ins>';
          else if (runType === 'delete') html += '<del class="diff-remove">' + text + '</del>';
          else html += '<span class="text-surface-700 dark:text-surface-300">' + text + '</span>';
          runText = '';
        };
        for (const op of ops) {
          if (op.type !== runType) {
            flush();
            runType = op.type;
          }
          runText += op.type === 'delete' ? op.a : op.b;
        }
        flush();
        return html;
      }

      function readOptions() {
        return {
          mode: document.getElementById('diff-mode').value,
          ignoreWhitespace: document.getElementById('ignore-whitespace').checked,
          ignoreCase: document.getElementById('ignore-case').checked,
        };
      }

      function runCompare() {
        const text1 = document.getElementById('text1').value;
        const text2 = document.getElementById('text2').value;
        const opts = readOptions();
        opts.maxCost = DIFF_MAX_COST;
        const notice = document.getElementById('diff-notice');
        const result = textDiffEngine.computeTextDiff(text1, text2, opts);
        notice.textContent = result.exact ? '' : 'These inputs are large and very different, so the comparison stopped searching for the smallest diff to keep the page responsive. Every change shown is real, but some unchanged text may be shown as removed and re-added. Line mode is usually faster.';
        notice.classList.toggle('hidden', result.exact);
        const hasChanges = result.ops.some((op) => op.type !== 'equal');

        document.getElementById('stat-added').textContent = result.stats.added.toLocaleString();
        document.getElementById('stat-removed').textContent = result.stats.removed.toLocaleString();
        document.getElementById('stat-unchanged').textContent = result.stats.unchanged.toLocaleString();
        document.getElementById('stat-unit').textContent = (_t('tools.text-diff.js.r4_0', 'Counts are in') + ' ') + UNIT_LABELS[result.mode] + '.';

        const output = document.getElementById('diff-output');
        if (!hasChanges) {
          output.innerHTML = '<span class="text-surface-400 italic" data-i18n="tools.text-diff.ui.desc6">No differences found (or empty input)</span>';
        } else {
          output.innerHTML = result.mode === 'line' ? renderLineOps(result.ops) : renderInlineOps(result.ops);
        }

        lastUnifiedDiff = textDiffEngine.createUnifiedDiff(text1, text2, {
          ignoreWhitespace: opts.ignoreWhitespace,
          ignoreCase: opts.ignoreCase,
          maxCost: DIFF_MAX_COST,
        });
        document.getElementById('unified-output').textContent = lastUnifiedDiff || 'No line differences, so the unified diff is empty.';
        document.getElementById('copy-unified').disabled = !lastUnifiedDiff;
        document.getElementById('download-unified').disabled = !lastUnifiedDiff;
        document.getElementById('unified-status').textContent = '';
        document.getElementById('result').classList.remove('hidden');
      }

      document.getElementById('compare-btn').addEventListener('click', runCompare);

      ['diff-mode', 'ignore-whitespace', 'ignore-case'].forEach((id) => {
        document.getElementById(id).addEventListener('change', () => {
          if (!document.getElementById('result').classList.contains('hidden')) runCompare();
        });
      });

      document.getElementById('copy-unified').addEventListener('click', async () => {
        const status = document.getElementById('unified-status');
        if (!lastUnifiedDiff) return;
        try {
          await navigator.clipboard.writeText(lastUnifiedDiff);
          status.textContent = _t('tools.text-diff.js.r4_1', 'Unified diff copied to clipboard.');
        } catch (error) {
          status.textContent = _t('tools.text-diff.js.r4_2', 'Copy failed: your browser blocked clipboard access. Select the diff above and copy it manually.');
        }
      });

      document.getElementById('download-unified').addEventListener('click', () => {
        if (!lastUnifiedDiff) return;
        const blob = new Blob([lastUnifiedDiff], { type: 'text/x-diff' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = 'text-diff.diff';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(href), 0);
        document.getElementById('unified-status').textContent = _t('tools.text-diff.js.r4_3', 'Downloaded text-diff.diff.');
      });
    </script>
  `;

  return respondHTML(
    createPageTemplate({
      title: translation?.name || "Text Diff",
      description:
        translation?.desc ||
        "Compare two texts side-by-side and highlight differences.",
      path: "/text-diff",
      content,
      scripts: script,
      lang: currentLang,
    }),
  );
}
