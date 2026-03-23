/**
 * Text Diff Checker Tool
 * Compare two texts and show differences
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleTextDiffRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === '/text-diff' || pathname === '/text-diff/') {
      if (method === 'GET') {
        return renderTextDiffPage(resolveRequestLanguage(request, url));
      }
    }

    return respondJSON({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Text Diff Route Error:', error);
    return respondJSON(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function renderTextDiffPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('text-diff', currentLang);
  const toolHeader = createToolHeader(
    { emoji: '🔍' },
    translation?.name || 'Text Diff',
    translation?.desc || 'Compare two texts side-by-side and highlight differences',
    [
      { text: translation?.ui?.badge7 || 'Client-Side Only', color: 'blue', tooltip: 'All processing happens in your browser — no data is sent to any server.' },
      { text: translation?.ui?.badge8 || 'Privacy First', color: 'blue', tooltip: 'All processing happens in your browser — no data is sent to any server.' }
    ],
    { toolId: 'text-diff' }
  );

  const currentTool = TOOLS.find(t => t.id === 'text-diff');
    const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];


  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">

        ${toolHeader}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="card p-4">
            <h2 class="text-lg font-semibold mb-2 text-surface-900 dark:text-surface-50" data-i18n="tools.text-diff.ui.heading3">Original Text</h2>
            <textarea id="text1" rows="15" data-tooltip="Paste the original text here" data-i18n-tooltip="tools.text-diff.ui.tip0" class="w-full px-4 py-3 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow resize-none" placeholder="Enter original text..." data-i18n-placeholder="tools.text-diff.ui.placeholder1"></textarea>
          </div>

          <div class="card p-4">
            <h2 class="text-lg font-semibold mb-2 text-surface-900 dark:text-surface-50" data-i18n="tools.text-diff.ui.heading4">Modified Text</h2>
            <textarea id="text2" rows="15" data-tooltip="Paste the modified text here" data-i18n-tooltip="tools.text-diff.ui.tip2" class="w-full px-4 py-3 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow resize-none" placeholder="Enter modified text..." data-i18n-placeholder="tools.text-diff.ui.placeholder2"></textarea>
          </div>
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
          <div id="diff-output" class="font-mono text-sm whitespace-pre-wrap bg-surface-50 dark:bg-surface-950 p-4 rounded-lg border border-surface-200 dark:border-surface-800 overflow-x-auto"></div>
        </div>
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'What is Text Diffing?',
          content: '<p>Text diffing is the process of comparing two sequences of data (usually text) to identify the differences between them. It highlights what has been added, removed, or modified. This is a fundamental operation in software development, data analysis, and content management, allowing users to track changes over time or compare different versions of a document.</p>'
        },
        {
          title: 'Diff Algorithms',
          content: '<p>Most text diffing tools use algorithms based on the Longest Common Subsequence (LCS) problem. The goal is to find the longest sequence of elements that appear in both texts in the same relative order. Common implementations include the Myers diff algorithm, which is highly efficient and used by Git, and the Hunt-McIlroy algorithm. These algorithms calculate the minimum number of edits (insertions and deletions) required to transform one text into another.</p>'
        },
        {
          title: 'Use Cases',
          content: '<ul><li><strong>Code Reviews:</strong> Developers use diffs to see exactly what changed in a pull request.</li><li><strong>Version Control:</strong> Systems like Git store history as a series of diffs to save space.</li><li><strong>Content Auditing:</strong> Writers and editors compare drafts to ensure all requested changes were made.</li><li><strong>Data Validation:</strong> Comparing configuration files or database exports to find discrepancies.</li><li><strong>Legal and Compliance:</strong> Comparing contracts or policy documents to identify subtle wording changes.</li></ul>'
        },
        {
          title: 'Pro Tips',
          content: '<ul><li><strong>Ignore Whitespace:</strong> Many diff tools have options to ignore changes in indentation or trailing spaces, which can reduce noise when comparing code.</li><li><strong>Context Lines:</strong> When viewing diffs, including a few lines of unchanged text around the differences (context) helps you understand the impact of the changes.</li><li><strong>Word-level vs. Line-level:</strong> While line-level diffs are standard for code, word-level diffs are often more useful for prose and natural language documents.</li><li><strong>Side-by-Side View:</strong> For complex changes, a side-by-side (split) view is often easier to read than a unified (inline) view.</li></ul>'
        }
      ], 'text-diff')}
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
     <!-- Note: diff-add/diff-remove use inline styles for precise color control -->
    <script>
      function diff(text1, text2) {
        const lines1 = text1.split('\\n');
        const lines2 = text2.split('\\n');
        const result = [];

        const maxLen = Math.max(lines1.length, lines2.length);
        for (let i = 0; i < maxLen; i++) {
          const line1 = lines1[i] || '';
          const line2 = lines2[i] || '';

          if (line1 === line2) {
            result.push({ type: 'equal', text: line1 });
          } else {
            if (line1) result.push({ type: 'remove', text: line1 });
            if (line2) result.push({ type: 'add', text: line2 });
          }
        }
        return result;
      }

      // HTML escape function to prevent XSS
      function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
      }

      document.getElementById('compare-btn').addEventListener('click', () => {
        const text1 = document.getElementById('text1').value;
        const text2 = document.getElementById('text2').value;

        const differences = diff(text1, text2);
        const output = differences.map(d => {
          const escapedText = escapeHTML(d.text);
          if (d.type === 'add') return '<div class="diff-add px-1">+ ' + escapedText + '</div>';
          if (d.type === 'remove') return '<div class="diff-remove px-1">- ' + escapedText + '</div>';
          return '<div class="px-1 text-surface-600 dark:text-surface-400">  ' + escapedText + '</div>';
        }).join('');

        document.getElementById('diff-output').innerHTML = output || '<span class="text-surface-400 italic" data-i18n="tools.text-diff.ui.desc6">No differences found (or empty input)</span>';
        document.getElementById('result').classList.remove('hidden');
      });
    </script>
  `;

  return respondHTML(createPageTemplate({
    title: translation?.name || 'Text Diff',
    description: translation?.desc || 'Compare two texts side-by-side and highlight differences.',
    path: '/text-diff',
    content,
    scripts: script,
    lang: currentLang
  }));
}
