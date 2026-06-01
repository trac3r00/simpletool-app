import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';

export async function handleKanbanDemandAnalyzerRoutes(request, url) {
  if (url.pathname === '/kanban-demand-analyzer' || url.pathname === '/kanban-demand-analyzer/') {
    if (request.method === 'GET') return respondHTML(renderPage(resolveRequestLanguage(request, url)));
  }
  return null;
}

function renderPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const toolId = 'kanban-demand-analyzer';
  const translation = getToolTranslation(toolId, currentLang);
  const tool = TOOLS.find(t => t.id === toolId);
  const relatedTools = tool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const toolHeader = createToolHeader(
    { emoji: '📋' },
    translation?.name || 'Kanban Demand Analyzer',
    translation?.desc || 'Paste Kanban/backlog issue text to extract repository references, themes, score product value, and produce a triage-ready automation proposal.',
    [{ text: translation?.ui?.badge0 || 'Privacy-First', tooltip: 'All processing is done in your browser. No data is sent to any server.' }],
    { toolId }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}

        <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="flex flex-col gap-4">
            <label for="input-text" class="label">
              <span class="font-semibold text-surface-900 dark:text-surface-100" data-i18n="tools.${toolId}.ui.heading0">Paste Issue Text</span>
            </label>
            <textarea id="input-text"
              class="input input-mono w-full h-64 resize-y p-3 text-sm leading-relaxed"
              placeholder="Paste GitHub/GitLab issue text, Kanban card descriptions, or backlog items..."
              data-i18n-placeholder="tools.${toolId}.ui.placeholder0"
              aria-label="Paste issue text for analysis"
              spellcheck="false"></textarea>
            <button id="analyze-btn" type="button" class="btn btn-primary self-start px-6 py-2.5 font-semibold" data-i18n="tools.${toolId}.ui.button0">
              Analyze
            </button>
          </div>

          <div class="flex flex-col gap-4">
            <div id="results-area" class="hidden space-y-4">
              <div class="p-4 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wide mb-2" data-i18n="tools.${toolId}.ui.heading1">Extracted References</h3>
                <div id="references-output" class="text-sm text-surface-900 dark:text-surface-100 whitespace-pre-wrap leading-relaxed min-h-[3rem]"></div>
              </div>
              <div class="p-4 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wide mb-2" data-i18n="tools.${toolId}.ui.heading2">Themes</h3>
                <div id="themes-output" class="text-sm text-surface-900 dark:text-surface-100 whitespace-pre-wrap leading-relaxed min-h-[3rem]"></div>
              </div>
              <div class="p-4 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wide mb-2" data-i18n="tools.${toolId}.ui.heading3">Product Value Score</h3>
                <div id="value-output" class="text-sm text-surface-900 dark:text-surface-100 whitespace-pre-wrap leading-relaxed min-h-[3rem]"></div>
              </div>
              <div class="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                <h3 class="text-sm font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wide mb-2" data-i18n="tools.${toolId}.ui.heading4">Triage Proposal</h3>
                <div id="proposal-output" class="text-sm text-surface-900 dark:text-surface-100 whitespace-pre-wrap leading-relaxed min-h-[3rem]"></div>
              </div>
              <button id="export-btn" type="button" class="btn btn-secondary self-start px-6 py-2 text-sm font-medium" data-i18n="tools.${toolId}.ui.button1">
                Export
              </button>
            </div>
            <div id="empty-state" class="flex flex-col items-center justify-center py-12 text-surface-400 dark:text-surface-500">
              <div class="text-4xl mb-3" aria-hidden="true">📋</div>
              <p class="text-sm text-center" data-i18n="tools.${toolId}.ui.text0">Paste issue text and click Analyze to extract references, themes, and a triage proposal.</p>
            </div>
          </div>
        </div>
      </div>
    ${createRelatedToolsSection(relatedTools)}
    </main>

    <script>
    (function() {
      'use strict';

      var inputEl = document.getElementById('input-text');
      var analyzeBtn = document.getElementById('analyze-btn');
      var exportBtn = document.getElementById('export-btn');
      var resultsArea = document.getElementById('results-area');
      var emptyState = document.getElementById('empty-state');
      var refsOut = document.getElementById('references-output');
      var themesOut = document.getElementById('themes-output');
      var valueOut = document.getElementById('value-output');
      var proposalOut = document.getElementById('proposal-output');

      function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }

      function extractReferences(text) {
        var refs = { repos: [], issues: [], links: [] };

        var repoRe = /([a-zA-Z0-9._-]+)\\/([a-zA-Z0-9._-]+)(?:#(\\d+))?/g;
        var m;
        while ((m = repoRe.exec(text)) !== null) {
          var entry = m[3] ? m[1] + '/' + m[2] + '#' + m[3] : m[1] + '/' + m[2];
          if (refs.repos.indexOf(entry) === -1) refs.repos.push(entry);
        }

        var issueRe = /(?:Fixes|Closes|Resolves|Refs|See|Related to)\\s+#(\\d+)/gi;
        while ((m = issueRe.exec(text)) !== null) {
          var tag = m[1];
          if (refs.issues.indexOf('#' + tag) === -1) refs.issues.push('#' + tag);
        }

        var linkRe = /https?:\\/\\/(?:www\\.)?github\\.com\\/[\\w.-]+\\/[\\w.-]+(?:\\/issues\\/\\d+|\\/pull\\/\\d+)?/g;
        while ((m = linkRe.exec(text)) !== null) {
          if (refs.links.indexOf(m[0]) === -1) refs.links.push(m[0]);
        }

        return refs;
      }

      function extractThemes(text) {
        var words = text.toLowerCase().split(/[\\s,.;:!?()\\[\\]{}]+/);
        var freq = {};
        var stopWords = { the:1,a:1,an:1,is:1,it:1,to:1,of:1,in:1,for:1,on:1,with:1,as:1,at:1,by:1,from:1,or:1,and:1,be:1,this:1,that:1,are:1,was:1,were:1,been:1,have:1,has:1,had:1,do:1,does:1,not:1,no:1,so:1,if:1,but:1,all:1,each:1,can:1,will:1,just:1,use:1,we:1,our:1,their:1,its:1,also:1,very:1,about:1,would:1,should:1,could:1,may:1,any:1,some:1,than:1,then:1,now:1,up:1,out:1,over:1,into:1,after:1,other:1,more:1,most:1,many:1,such:1,like:1,when:1,where:1,what:1,which:1,who:1,how:1 };

        for (var i = 0; i < words.length; i++) {
          var w = words[i].trim();
          if (!w || w.length < 3 || stopWords[w]) continue;
          freq[w] = (freq[w] || 0) + 1;
        }

        var sorted = Object.keys(freq).sort(function(a, b) { return freq[b] - freq[a]; });
        return sorted.slice(0, 15);
      }

      function scoreProductValue(text) {
        var issues = extractReferences(text);
        var score = { userImpact: 0, businessValue: 0, effort: 0, risk: 0 };

        var lower = text.toLowerCase();

        if (/\\b(ux|usability|accessibility|user experience|ui|design|frontend)\\b/.test(lower)) score.userImpact += 3;
        if (/\\b(error|bug|crash|broken|fail|regression|fix|fault|defect)\\b/.test(lower)) score.userImpact += 2;
        if (/\\b(feature|enhancement|improvement|request|suggestion)\\b/.test(lower)) score.userImpact += 1;

        if (/\\b(revenue|cost|upsell|retention|churn|conversion|profit)\\b/.test(lower)) score.businessValue += 3;
        if (/\\b(security|compliance|audit|legal|regulatory|pii|gdpr|hipaa)\\b/.test(lower)) score.businessValue += 3;
        if (/\\b(performance|speed|latency|scale|optimize|throughput)\\b/.test(lower)) score.businessValue += 2;
        if (/\\b(api|integration|migration|deployment|ci|cd|pipeline)\\b/.test(lower)) score.businessValue += 1;

        if (/\\b(simple|easy|trivial|minor|cleanup|refactor|typo|docs?)\\b/.test(lower)) score.effort += 1;
        if (/\\b(complex|major|significant|large|overhaul|rewrite|redesign)\\b/.test(lower)) score.effort += 3;
        if (lower.match(/\\b(week|month|quarter|sprint|epic)\\b/)) score.effort += 2;

        if (/\\b(blocker|blocking|critical|urgent|p0|p1|high priority|top priority)\\b/.test(lower)) score.risk += 3;
        if (/\\b(at risk|behind schedule|delayed|missed|depends? on|dependencies?)\\b/.test(lower)) score.risk += 2;

        var total = score.userImpact + score.businessValue + score.effort + score.risk;
        return { userImpact: score.userImpact, businessValue: score.businessValue, effort: score.effort, risk: score.risk, total: total };
      }

      function generateProposal(refs, themes, value, text) {
        var priority = 'Medium';
        if (value.total >= 12) priority = 'High';
        else if (value.total <= 5) priority = 'Low';

        var automationCandidates = [];
        var lower = text.toLowerCase();
        if (refs.issues.length > 0) automationCandidates.push('Auto-link referenced issues (' + refs.issues.join(', ') + ') in commit messages');
        if (themes.length > 0) {
          var topTheme = themes[0];
          automationCandidates.push('Apply label "' + topTheme.charAt(0).toUpperCase() + topTheme.slice(1) + '" based on recurring theme');
        }
        if (/\\b(api|endpoint|route)\\b/.test(lower)) automationCandidates.push('Generate API endpoint scaffolding');
        if (/\\b(test|spec|coverage|unit test|integration test)\\b/.test(lower)) automationCandidates.push('Auto-create test stubs for affected modules');
        if (/\\b(docker|container|deploy|k8s|kubernetes)\\b/.test(lower)) automationCandidates.push('Trigger CI/CD pipeline with deployment manifest update');
        if (/\\b(doc|readme|documentation|comment)\\b/.test(lower)) automationCandidates.push('Flag for documentation update auto-generation');
        if (automationCandidates.length === 0) automationCandidates.push('No specific automation pattern detected — consider manual triage');

        var lines = [];
        lines.push('=== TRIAGE PROPOSAL ===');
        lines.push('Priority: ' + priority + ' (score: ' + value.total + ')');
        lines.push('');
        lines.push('References (' + refs.repos.length + ' repo refs, ' + refs.issues.length + ' issues, ' + refs.links.length + ' links)');
        if (refs.repos.length > 0) lines.push('  Repositories: ' + refs.repos.join(', '));
        if (refs.issues.length > 0) lines.push('  Issues: ' + refs.issues.join(', '));
        if (refs.links.length > 0) lines.push('  Links: ' + refs.links.join(', '));
        lines.push('');
        lines.push('Top Themes: ' + themes.slice(0, 5).join(', '));
        lines.push('');
        lines.push('Value Breakdown:');
        lines.push('  User Impact: ' + value.userImpact);
        lines.push('  Business Value: ' + value.businessValue);
        lines.push('  Effort: ' + value.effort);
        lines.push('  Risk: ' + value.risk);
        lines.push('');
        lines.push('Recommended Automation:');
        for (var a = 0; a < automationCandidates.length; a++) {
          lines.push('  - ' + automationCandidates[a]);
        }
        return lines.join('\\n');
      }

      function renderResults(text) {
        if (!text.trim()) {
          resultsArea.classList.add('hidden');
          emptyState.classList.remove('hidden');
          return;
        }

        var refs = extractReferences(text);
        var themes = extractThemes(text);
        var value = scoreProductValue(text);
        var proposal = generateProposal(refs, themes, value, text);

        var refsHTML = '';
        if (refs.repos.length > 0) refsHTML += '<div><span class="font-semibold">Repositories:</span> ' + esc(refs.repos.join(', ')) + '</div>';
        if (refs.issues.length > 0) refsHTML += '<div><span class="font-semibold">Issues:</span> ' + esc(refs.issues.join(', ')) + '</div>';
        if (refs.links.length > 0) refsHTML += '<div><span class="font-semibold">Links:</span> ' + esc(refs.links.join(', ')) + '</div>';
        if (!refsHTML) refsHTML = '<span class="text-surface-400 dark:text-surface-500">No references detected.</span>';

        var themesHTML = themes.length > 0
          ? themes.map(function(t) { return '<span class="inline-block px-2 py-0.5 m-0.5 text-xs font-medium rounded-full bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300">' + esc(t) + '</span>'; }).join('')
          : '<span class="text-surface-400 dark:text-surface-500">No themes detected.</span>';

        var valueHTML = '<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">'
          + '<div class="p-2 rounded bg-surface-100 dark:bg-surface-700 text-center"><div class="text-xs text-surface-500 dark:text-surface-400">User Impact</div><div class="text-lg font-bold text-surface-900 dark:text-surface-100">' + value.userImpact + '</div></div>'
          + '<div class="p-2 rounded bg-surface-100 dark:bg-surface-700 text-center"><div class="text-xs text-surface-500 dark:text-surface-400">Business Value</div><div class="text-lg font-bold text-surface-900 dark:text-surface-100">' + value.businessValue + '</div></div>'
          + '<div class="p-2 rounded bg-surface-100 dark:bg-surface-700 text-center"><div class="text-xs text-surface-500 dark:text-surface-400">Effort</div><div class="text-lg font-bold text-surface-900 dark:text-surface-100">' + value.effort + '</div></div>'
          + '<div class="p-2 rounded bg-surface-100 dark:bg-surface-700 text-center"><div class="text-xs text-surface-500 dark:text-surface-400">Risk</div><div class="text-lg font-bold text-surface-900 dark:text-surface-100">' + value.risk + '</div></div>'
          + '</div>'
          + '<div class="mt-2 text-center"><span class="text-sm font-semibold text-surface-700 dark:text-surface-300">Total Score: ' + value.total + '</span></div>';

        refsOut.innerHTML = refsHTML;
        themesOut.innerHTML = themesHTML;
        valueOut.innerHTML = valueHTML;
        proposalOut.textContent = proposal;

        resultsArea.classList.remove('hidden');
        emptyState.classList.add('hidden');
      }

      analyzeBtn.addEventListener('click', function() {
        renderResults(inputEl.value);
      });

      inputEl.addEventListener('keydown', function(e) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          renderResults(inputEl.value);
        }
      });

      exportBtn.addEventListener('click', function() {
        var text = proposalOut.textContent;
        if (!text) return;
        var blob = new Blob([text], { type: 'text/plain' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'kanban-triage-proposal.txt';
        a.click();
        URL.revokeObjectURL(a.href);
      });
    })();
    </script>
  `;

  return createPageTemplate({
    title: translation?.name || 'Kanban Demand Analyzer',
    description: translation?.desc || 'Paste Kanban/backlog issue text to extract references, themes, score product value, and produce a triage-ready automation proposal.',
    content,
    path: '/' + toolId,
    lang: currentLang
  });
}
