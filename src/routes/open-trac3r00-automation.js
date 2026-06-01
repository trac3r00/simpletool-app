import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage, t } from '../utils/i18n.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';

export async function handleOpenTrac3r00AutomationRoutes(request, url) {
  if (url.pathname === '/open-trac3r00-automation' || url.pathname === '/open-trac3r00-automation/') {
    if (request.method === 'GET') return respondHTML(renderOpenTrac3r00AutomationPage(resolveRequestLanguage(request, url)));
  }
  return null;
}

function renderOpenTrac3r00AutomationPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('open-trac3r00-automation', currentLang);
  const toolHeader = createToolHeader(
    { emoji: '🤖' },
    translation?.name || 'Open Trac3r00 Automation',
    translation?.desc || 'Convert issue text and Kanban demand snippets into concise automation briefs with references, labels, counts, and prioritized action checklists.',
    [{ text: translation?.ui?.badge0 || 'Client-Side Only', tooltip: 'All parsing runs locally — no data sent anywhere.' }],
    { toolId: 'open-trac3r00-automation' }
  );

  const currentTool = TOOLS.find(t => t.id === 'open-trac3r00-automation');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}

        <!-- Input Section -->
        <div class="mt-6 space-y-4">
          <label for="ota-input" class="label" data-i18n="tools.open-trac3r00-automation.ui.label0">
            ${t('tools.open-trac3r00-automation.ui.label0')}
          </label>
          <textarea id="ota-input"
            class="input-mono w-full h-48 resize-y"
            placeholder="${t('tools.open-trac3r00-automation.ui.placeholder0')}"
            data-i18n-placeholder="tools.open-trac3r00-automation.ui.placeholder0"
            aria-label="${t('tools.open-trac3r00-automation.ui.label0')}"
          ></textarea>
          <div class="flex flex-wrap gap-3">
            <button id="ota-analyze-btn" type="button" class="btn btn-primary" data-i18n="tools.open-trac3r00-automation.ui.button0">
              ${t('tools.open-trac3r00-automation.ui.button0')}
            </button>
            <button id="ota-clear-btn" type="button" class="btn btn-secondary" data-i18n="tools.open-trac3r00-automation.ui.button1">
              ${t('tools.open-trac3r00-automation.ui.button1')}
            </button>
            <button id="ota-sample-btn" type="button" class="btn btn-ghost" data-i18n="tools.open-trac3r00-automation.ui.button2">
              ${t('tools.open-trac3r00-automation.ui.button2')}
            </button>
          </div>
        </div>

        <!-- Results Section -->
        <div id="ota-results" class="mt-8 hidden space-y-6">
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="p-4 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
              <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1" data-i18n="tools.open-trac3r00-automation.ui.stat0">${t('tools.open-trac3r00-automation.ui.stat0')}</div>
              <div id="ota-ref-count" class="text-2xl font-bold text-surface-900 dark:text-surface-100">0</div>
            </div>
            <div class="p-4 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
              <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1" data-i18n="tools.open-trac3r00-automation.ui.stat1">${t('tools.open-trac3r00-automation.ui.stat1')}</div>
              <div id="ota-label-count" class="text-2xl font-bold text-surface-900 dark:text-surface-100">0</div>
            </div>
            <div class="p-4 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
              <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1" data-i18n="tools.open-trac3r00-automation.ui.stat2">${t('tools.open-trac3r00-automation.ui.stat2')}</div>
              <div id="ota-word-count" class="text-2xl font-bold text-surface-900 dark:text-surface-100">0</div>
            </div>
          </div>

          <!-- Detected Labels / Themes -->
          <div class="p-4 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
            <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3" data-i18n="tools.open-trac3r00-automation.ui.heading0">${t('tools.open-trac3r00-automation.ui.heading0')}</h3>
            <div id="ota-label-list" class="flex flex-wrap gap-2 min-h-[2rem]">
              <span class="text-sm text-surface-400 dark:text-surface-500" data-i18n="tools.open-trac3r00-automation.ui.desc0">${t('tools.open-trac3r00-automation.ui.desc0')}</span>
            </div>
          </div>

          <!-- Issue References -->
          <div class="p-4 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
            <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3" data-i18n="tools.open-trac3r00-automation.ui.heading1">${t('tools.open-trac3r00-automation.ui.heading1')}</h3>
            <div id="ota-ref-list" class="space-y-2 min-h-[2rem]">
              <span class="text-sm text-surface-400 dark:text-surface-500" data-i18n="tools.open-trac3r00-automation.ui.desc1">${t('tools.open-trac3r00-automation.ui.desc1')}</span>
            </div>
          </div>

          <!-- Prioritized Action Checklist -->
          <div class="p-4 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
            <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3" data-i18n="tools.open-trac3r00-automation.ui.heading2">${t('tools.open-trac3r00-automation.ui.heading2')}</h3>
            <div id="ota-checklist" class="space-y-2 min-h-[2rem]">
              <span class="text-sm text-surface-400 dark:text-surface-500" data-i18n="tools.open-trac3r00-automation.ui.desc2">${t('tools.open-trac3r00-automation.ui.desc2')}</span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div id="ota-empty" class="mt-8 text-center py-12 text-surface-400 dark:text-surface-500">
          <div class="text-5xl mb-4" aria-hidden="true">🤖</div>
          <p class="text-base" data-i18n="tools.open-trac3r00-automation.ui.desc3">${t('tools.open-trac3r00-automation.ui.desc3')}</p>
        </div>
      </div>
      ${createRelatedToolsSection(relatedToolsData)}
    </main>

    <script>
    (function() {
      'use strict';

      var input = document.getElementById('ota-input');
      var analyzeBtn = document.getElementById('ota-analyze-btn');
      var clearBtn = document.getElementById('ota-clear-btn');
      var sampleBtn = document.getElementById('ota-sample-btn');
      var results = document.getElementById('ota-results');
      var empty = document.getElementById('ota-empty');
      var refCount = document.getElementById('ota-ref-count');
      var labelCount = document.getElementById('ota-label-count');
      var wordCount = document.getElementById('ota-word-count');
      var labelList = document.getElementById('ota-label-list');
      var refList = document.getElementById('ota-ref-list');
      var checklist = document.getElementById('ota-checklist');

      var LABEL_KEYWORDS = {
        'bug': { label: 'Bug', priority: 'high', emoji: '\ud83d\udc1b' },
        'feature': { label: 'Feature', priority: 'medium', emoji: '\u2728' },
        'enhancement': { label: 'Enhancement', priority: 'medium', emoji: '\ud83d\udca1' },
        'security': { label: 'Security', priority: 'high', emoji: '\ud83d\udd12' },
        'performance': { label: 'Performance', priority: 'medium', emoji: '\u26a1' },
        'documentation': { label: 'Documentation', priority: 'low', emoji: '\ud83d\udcdd' },
        'refactor': { label: 'Refactor', priority: 'medium', emoji: '\ud83d\udd04' },
        'test': { label: 'Testing', priority: 'medium', emoji: '\u2705' },
        'ci': { label: 'CI/CD', priority: 'medium', emoji: '\ud83d\udd17' },
        'deps': { label: 'Dependencies', priority: 'low', emoji: '\ud83d\udce6' },
        'ux': { label: 'UX', priority: 'medium', emoji: '\ud83c\udfa8' },
        'api': { label: 'API', priority: 'medium', emoji: '\ud83d\udd17' },
        'accessibility': { label: 'Accessibility', priority: 'high', emoji: '\u267f' },
        'a11y': { label: 'Accessibility', priority: 'high', emoji: '\u267f' },
        'urgent': { label: 'Urgent', priority: 'critical', emoji: '\ud83d\udd25' },
        'blocker': { label: 'Blocker', priority: 'critical', emoji: '\ud83d\udeab' },
        'good first issue': { label: 'Good First Issue', priority: 'low', emoji: '\ud83c\udf93' },
        'help wanted': { label: 'Help Wanted', priority: 'medium', emoji: '\ud83d\ude4b' }
      };

      function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
      }

      function parseIssueRefs(text) {
        var refs = [];
        var pattern = /([a-zA-Z0-9_-]+\\/[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+)#(\\d+)/g;
        var match;
        while ((match = pattern.exec(text)) !== null) {
          refs.push({ repo: match[1], issue: match[2], full: match[0] });
        }
        return refs;
      }

      function detectLabels(text) {
        var lower = text.toLowerCase();
        var found = [];
        for (var key in LABEL_KEYWORDS) {
          if (lower.indexOf(key) >= 0) {
            found.push(LABEL_KEYWORDS[key]);
          }
        }
        var deduped = [];
        var seen = {};
        for (var i = 0; i < found.length; i++) {
          if (!seen[found[i].label]) {
            seen[found[i].label] = true;
            deduped.push(found[i]);
          }
        }
        deduped.sort(function(a, b) {
          var order = { critical: 0, high: 1, medium: 2, low: 3 };
          return (order[a.priority] || 99) - (order[b.priority] || 99);
        });
        return deduped;
      }

      function generateChecklist(refs, labels) {
        var items = [];

        if (refs.length > 0) {
          items.push({ text: 'Review referenced issues and update status', priority: 'high' });
          items.push({ text: 'Cross-reference related PRs and linked discussions', priority: 'medium' });
        }

        var highLabels = labels.filter(function(l) { return l.priority === 'critical' || l.priority === 'high'; });
        if (highLabels.length > 0) {
          items.push({ text: 'Address ' + highLabels[0].label.toLowerCase() + ' items with immediate attention', priority: 'critical' });
        }

        items.push({ text: 'Define acceptance criteria based on issue descriptions', priority: 'high' });
        items.push({ text: 'Assign ownership and set milestone', priority: 'medium' });
        items.push({ text: 'Write or update tests for new behavior', priority: 'medium' });
        items.push({ text: 'Update documentation if scope changes', priority: 'low' });

        if (labels.length > 0) {
          items.push({ text: 'Apply detected labels: ' + labels.map(function(l) { return l.label; }).join(', '), priority: 'low' });
        }

        return items;
      }

      function buildSearchUrl(repo) {
        return 'https://github.com/' + repo + '/issues?q=is%3Aissue+is%3Aopen';
      }

      function analyze() {
        var text = input.value.trim();
        if (!text) {
          results.classList.add('hidden');
          empty.classList.remove('hidden');
          return;
        }

        empty.classList.add('hidden');
        results.classList.remove('hidden');

        var refs = parseIssueRefs(text);
        var labels = detectLabels(text);
        var words = text.split(/\\s+/).filter(Boolean).length;
        var checklistItems = generateChecklist(refs, labels);

        refCount.textContent = refs.length;
        labelCount.textContent = labels.length;
        wordCount.textContent = words;

        // Labels
        if (labels.length > 0) {
          labelList.innerHTML = labels.map(function(l) {
            return '<span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-600">' +
              l.emoji + ' ' + escapeHtml(l.label) +
              ' <span class="text-surface-400 dark:text-surface-500">(' + escapeHtml(l.priority) + ')</span></span>';
          }).join('');
        } else {
          labelList.innerHTML = '<span class="text-sm text-surface-400 dark:text-surface-500">No labels detected</span>';
        }

        // References
        if (refs.length > 0) {
          refList.innerHTML = refs.map(function(ref) {
            var searchUrl = buildSearchUrl(ref.repo);
            return '<div class="flex items-center gap-2 text-sm">' +
              '<span class="text-primary-600 dark:text-primary-400 font-mono">' + escapeHtml(ref.full) + '</span>' +
              ' <a href="' + searchUrl + '" target="_blank" rel="noopener" class="text-primary-600 dark:text-primary-400 hover:underline text-xs">\ud83d\udd0d ' + escapeHtml(ref.repo) + ' issues</a>' +
              '</div>';
          }).join('');
        } else {
          refList.innerHTML = '<span class="text-sm text-surface-400 dark:text-surface-500">No issue references found</span>';
        }

        // Checklist
        if (checklistItems.length > 0) {
          checklist.innerHTML = checklistItems.map(function(item) {
            var labelClass = 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300';
            if (item.priority === 'critical') labelClass = 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300';
            else if (item.priority === 'high') labelClass = 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300';
            else if (item.priority === 'low') labelClass = 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400';
            return '<div class="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">' +
              '<input type="checkbox" class="mt-0.5 h-4 w-4 rounded border-surface-300 dark:border-surface-600 text-primary-600 focus:ring-primary-500">' +
              '<div class="flex-1"><span class="text-sm text-surface-700 dark:text-surface-300">' + escapeHtml(item.text) + '</span></div>' +
              '<span class="px-1.5 py-0.5 text-xs font-medium rounded ' + labelClass + '">' + escapeHtml(item.priority) + '</span>' +
              '</div>';
          }).join('');
        } else {
          checklist.innerHTML = '<span class="text-sm text-surface-400 dark:text-surface-500">No action items generated</span>';
        }
      }

      analyzeBtn.addEventListener('click', analyze);

      clearBtn.addEventListener('click', function() {
        input.value = '';
        results.classList.add('hidden');
        empty.classList.remove('hidden');
      });

      sampleBtn.addEventListener('click', function() {
        input.value = '## Innovation Proposal: Markdown Editor Enhancements\\n\\n' +
          'This proposal addresses simpletool-app#34 and simpletool-app#45 to add Mermaid diagram ' +
          'support and export to PDF.\\n\\n' +
          '### Related Issues\\n' +
          '- simpletool-app#34 - Add Mermaid diagram live preview\\n' +
          '- simpletool-app#45 - Export markdown to PDF\\n' +
          '- simpletool-app#12 - Fix table rendering bug\\n\\n' +
          '### Labels / Themes\\n' +
          'feature, enhancement, documentation, ux, performance\\n\\n' +
          '### Requirements\\n' +
          '1. Integrate Mermaid.js for diagram rendering\\n' +
          '2. Add PDF export using browser print API\\n' +
          '3. Ensure dark mode support for diagrams\\n' +
          '4. Maintain accessibility for all new features\\n\\n' +
          '### Acceptance Criteria\\n' +
          '- [ ] Mermaid code blocks render as diagrams\\n' +
          '- [ ] Export creates properly formatted PDF\\n' +
          '- [ ] All existing tests pass';
        analyze();
      });

      // Allow Ctrl+Enter to trigger analysis
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          analyze();
        }
      });
    })();
    </script>
  `;

  return createPageTemplate({
    title: translation?.name || 'Open Trac3r00 Automation',
    description: translation?.desc || 'Convert issue text and Kanban demand snippets into concise automation briefs.',
    content,
    path: '/open-trac3r00-automation',
    lang: currentLang
  });
}
