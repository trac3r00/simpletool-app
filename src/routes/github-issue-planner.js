/**
 * GitHub Issue / Kanban Automation Planner
 * - Parses pasted GitHub issue JSON or plain text
 * - Categorizes, prioritizes, and generates automation summaries
 * - All processing stays in the browser
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createEmptyState } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleGithubIssuePlannerRoutes(request, url) {
  const { pathname } = url;
  if (pathname === '/github-issue-planner' || pathname === '/github-issue-planner/') {
    if (request.method === 'GET') return respondHTML(renderGithubIssuePlannerPage(resolveRequestLanguage(request, url)));
    return new Response('Method not allowed', { status: 405 });
  }
  return null;
}

function renderGithubIssuePlannerPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('github-issue-planner', currentLang);
  const title = translation?.name || 'GitHub Issue / Kanban Automation Planner';
  const description = translation?.desc || 'Categorize open issues and generate automation prompts for trac3r00 backlogs.';

  const header = createToolHeader(
    { emoji: '📋' },
    title,
    description,
    [
      { text: 'Client-Side Only', tooltip: 'All processing happens in your browser — no data is sent to any server.' }
    ],
    { toolId: 'github-issue-planner' }
  );

  const currentTool = TOOLS.find(t => t.id === 'github-issue-planner');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${header}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="flex flex-wrap gap-2 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
              <button id="load-sample" class="btn btn-secondary" data-i18n="tools.github-issue-planner.ui.button0">🧪 Sample</button>
              <button id="clear" class="btn btn-ghost ml-auto" data-i18n="tools.github-issue-planner.ui.button1">🗑️ Clear</button>
            </div>

            <label class="label" data-i18n="tools.github-issue-planner.ui.label0">Paste GitHub issues (JSON or text)</label>
            <textarea id="issue-input" rows="18" class="input-mono resize-y" placeholder="Paste GitHub issue JSON array, or one issue per line..." data-i18n-placeholder="tools.github-issue-planner.ui.placeholder0"></textarea>

            <button id="analyze-issues-btn" class="btn btn-primary w-full" data-i18n="tools.github-issue-planner.ui.button2">Analyze &amp; Generate Prompts</button>
          </div>

          <div class="space-y-4" id="automation-output">
            ${createEmptyState({ icon: '🤖', title: 'No analysis yet', description: 'Paste issues on the left and click Analyze to see summaries and automation prompts.', id: 'planner-empty-state', i18nTitle: 'tools.github-issue-planner.ui.desc0', i18nDesc: 'tools.github-issue-planner.ui.desc1' })}

            <div id="summary-panel" class="hidden space-y-4">
              <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.github-issue-planner.ui.heading0">Summary</h2>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div class="p-3 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                    <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-total">0</div>
                    <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.github-issue-planner.ui.stat0">Total</div>
                  </div>
                  <div class="p-3 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                    <div class="text-2xl font-bold text-error-600 dark:text-error-400" id="stat-bugs">0</div>
                    <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.github-issue-planner.ui.stat1">Bugs</div>
                  </div>
                  <div class="p-3 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                    <div class="text-2xl font-bold text-warning-600 dark:text-warning-400" id="stat-features">0</div>
                    <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.github-issue-planner.ui.stat2">Features</div>
                  </div>
                  <div class="p-3 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                    <div class="text-2xl font-bold text-info-600 dark:text-info-400" id="stat-docs">0</div>
                    <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.github-issue-planner.ui.stat3">Docs / Other</div>
                  </div>
                </div>

                <div class="mt-4">
                  <h3 class="text-xs font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-2" data-i18n="tools.github-issue-planner.ui.heading1">Priority Breakdown</h3>
                  <div class="space-y-2" id="priority-breakdown"></div>
                </div>

                <div class="mt-4">
                  <h3 class="text-xs font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-2" data-i18n="tools.github-issue-planner.ui.heading2">Label Breakdown</h3>
                  <div class="flex flex-wrap gap-2" id="label-breakdown"></div>
                </div>
              </div>

              <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                <div class="flex items-center justify-between mb-3">
                  <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.github-issue-planner.ui.heading3">GitHub Automation Prompt</h2>
                  <button id="copy-gh-prompt" class="btn btn-secondary text-xs py-1 px-2" disabled data-i18n="tools.github-issue-planner.ui.button3">Copy</button>
                </div>
                <textarea id="gh-prompt" rows="8" class="input-mono resize-y" readonly></textarea>
              </div>

              <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                <div class="flex items-center justify-between mb-3">
                  <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.github-issue-planner.ui.heading4">Kanban Board Prompt</h2>
                  <button id="copy-kanban-prompt" class="btn btn-secondary text-xs py-1 px-2" disabled data-i18n="tools.github-issue-planner.ui.button4">Copy</button>
                </div>
                <textarea id="kanban-prompt" rows="8" class="input-mono resize-y" readonly></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const script = `
    <script>
      (function() {
        function getPriority(issue) {
          const labels = (issue.labels || []).map(function(l) {
            return (typeof l === 'string' ? l : l.name || '').toLowerCase();
          });
          const title = (issue.title || '').toLowerCase();
          const body = (issue.body || '').toLowerCase();
          const text = title + ' ' + body + ' ' + labels.join(' ');
          if (/p0|critical|urgent|blocker|severity-critical/.test(text)) return 'P0 — Critical';
          if (/p1|high|important|severity-high/.test(text)) return 'P1 — High';
          if (/p2|medium|severity-medium/.test(text)) return 'P2 — Medium';
          if (/p3|low|nice.to.have|severity-low/.test(text)) return 'P3 — Low';
          return 'Unprioritized';
        }

        function getCategory(issue) {
          const labels = (issue.labels || []).map(function(l) {
            return (typeof l === 'string' ? l : l.name || '').toLowerCase();
          });
          const title = (issue.title || '').toLowerCase();
          const body = (issue.body || '').toLowerCase();
          const text = title + ' ' + body + ' ' + labels.join(' ');
          if (/bug|fix|crash|error|broken|regression|defect/.test(text)) return 'bug';
          if (/feature|enhancement|request|add|implement|support/.test(text)) return 'feature';
          if (/doc|readme|wiki|guide|tutorial/.test(text)) return 'docs';
          return 'other';
        }

        function parseIssues(raw) {
          var trimmed = raw.trim();
          if (!trimmed) return [];

          // Try GitHub API JSON
          try {
            var parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return parsed;
            if (parsed && Array.isArray(parsed.issues)) return parsed.issues;
            if (parsed && typeof parsed === 'object') return [parsed];
          } catch (e) {}

          // Plain text: one issue per line
          return trimmed.split('\\n').map(function(line) {
            return { title: line.trim(), labels: [], body: '' };
          }).filter(function(i) { return i.title; });
        }

        function generateGHPrompt(issues, summary) {
          var lines = [
            'You are a GitHub project automation assistant. Here is the current open-issue backlog for trac3r00:',
            ''
          ];
          lines.push('## Summary');
          lines.push('- Total issues: ' + summary.total);
          lines.push('- Bugs: ' + summary.bugs);
          lines.push('- Features: ' + summary.features);
          lines.push('- Docs / Other: ' + summary.docs);
          lines.push('');
          lines.push('## Issues by Priority');
          Object.keys(summary.priorities).sort().forEach(function(p) {
            lines.push('### ' + p);
            summary.priorities[p].forEach(function(i) {
              lines.push('- ' + i.title);
            });
            lines.push('');
          });
          lines.push('## Suggested Actions');
          lines.push('1. Label all unprioritized issues with P1–P3.');
          lines.push('2. Open a \"Bug Triage\" milestone and assign all bug issues.');
          lines.push('3. Convert high-priority feature requests into draft PRs with task lists.');
          lines.push('4. Schedule weekly automation to move stale issues (>30 days) to a backlog review column.');
          return lines.join('\\n');
        }

        function generateKanbanPrompt(issues, summary) {
          var lines = [
            'You are a Kanban board automation planner for trac3r00. Based on the analyzed backlog, here is the recommended board structure and actions:',
            ''
          ];
          lines.push('## Board Columns');
          lines.push('1. Backlog — All unprioritized issues');
          lines.push('2. Ready — P1 issues with clear acceptance criteria');
          lines.push('3. In Progress — WIP limit = 3');
          lines.push('4. Review — PRs linked to issues');
          lines.push('5. Done — Closed / resolved');
          lines.push('');
          lines.push('## Card Distribution');
          Object.keys(summary.priorities).sort().forEach(function(p) {
            var count = summary.priorities[p].length;
            lines.push('- ' + p + ': ' + count + ' card(s)');
          });
          lines.push('');
          lines.push('## Automation Rules');
          lines.push('- When an issue is labeled P0, move it to \"Ready\" and @mention the on-call engineer.');
          lines.push('- When a bug issue has no update for 7 days, add a \"stale\" label.');
          lines.push('- When a feature issue is linked to a PR, move it to \"Review\".');
          lines.push('- Auto-archive done cards after 14 days.');
          return lines.join('\\n');
        }

        function analyze() {
          var input = document.getElementById('issue-input').value;
          var issues = parseIssues(input);

          if (issues.length === 0) {
            var out = document.getElementById('automation-output');
            out.innerHTML = '<div class="p-5 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl text-error-700 dark:text-error-300">Please paste at least one issue.</div>';
            return;
          }

          var summary = {
            total: issues.length,
            bugs: 0,
            features: 0,
            docs: 0,
            priorities: {},
            labels: {}
          };

          issues.forEach(function(issue) {
            var cat = getCategory(issue);
            if (cat === 'bug') summary.bugs++;
            else if (cat === 'feature') summary.features++;
            else summary.docs++;

            var pri = getPriority(issue);
            if (!summary.priorities[pri]) summary.priorities[pri] = [];
            summary.priorities[pri].push(issue);

            (issue.labels || []).forEach(function(l) {
              var name = (typeof l === 'string' ? l : l.name || '').toLowerCase();
              if (name) {
                if (!summary.labels[name]) summary.labels[name] = 0;
                summary.labels[name]++;
              }
            });
          });

          document.getElementById('stat-total').textContent = summary.total;
          document.getElementById('stat-bugs').textContent = summary.bugs;
          document.getElementById('stat-features').textContent = summary.features;
          document.getElementById('stat-docs').textContent = summary.docs;

          var priContainer = document.getElementById('priority-breakdown');
          priContainer.innerHTML = '';
          Object.keys(summary.priorities).sort().forEach(function(p) {
            var count = summary.priorities[p].length;
            var bar = document.createElement('div');
            bar.className = 'flex items-center gap-2';
            var pct = summary.total ? Math.round((count / summary.total) * 100) : 0;
            bar.innerHTML = '<span class="text-xs text-surface-600 dark:text-surface-300 w-32 shrink-0">' + p + '</span>' +
              '<div class="flex-1 h-2 bg-surface-200 dark:bg-surface-800 rounded-full overflow-hidden">' +
              '<div class="h-full bg-primary-500 rounded-full" style="width:' + pct + '%"></div></div>' +
              '<span class="text-xs text-surface-500 dark:text-surface-400 w-8 text-right">' + count + '</span>';
            priContainer.appendChild(bar);
          });

          var labelContainer = document.getElementById('label-breakdown');
          labelContainer.innerHTML = '';
          Object.keys(summary.labels).sort(function(a, b) { return summary.labels[b] - summary.labels[a]; }).forEach(function(l) {
            var badge = document.createElement('span');
            badge.className = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300 border border-surface-200 dark:border-surface-700';
            badge.textContent = l + ' (' + summary.labels[l] + ')';
            labelContainer.appendChild(badge);
          });

          document.getElementById('gh-prompt').value = generateGHPrompt(issues, summary);
          document.getElementById('kanban-prompt').value = generateKanbanPrompt(issues, summary);

          document.getElementById('planner-empty-state').classList.add('hidden');
          document.getElementById('summary-panel').classList.remove('hidden');
          document.getElementById('copy-gh-prompt').disabled = false;
          document.getElementById('copy-kanban-prompt').disabled = false;
        }

        document.getElementById('analyze-issues-btn').addEventListener('click', function() {
          var btn = this;
          btn.disabled = true;
          btn.innerHTML = '<span class="spinner-sm spinner"></span> Analyzing...';
          setTimeout(function() {
            analyze();
            btn.disabled = false;
            btn.innerHTML = 'Analyze &amp; Generate Prompts';
          }, 200);
        });

        document.getElementById('load-sample').addEventListener('click', function() {
          var sample = JSON.stringify([
            { title: 'Fix login crash on mobile', labels: [{ name: 'bug' }, { name: 'p1' }], body: 'Users report crash after OAuth redirect.' },
            { title: 'Add dark mode toggle', labels: [{ name: 'feature' }, { name: 'p2' }], body: 'System-level dark mode support.' },
            { title: 'Update API documentation', labels: [{ name: 'docs' }], body: 'OpenAPI spec is out of date.' },
            { title: 'Refactor rate limiter', labels: [{ name: 'enhancement' }, { name: 'p0' }], body: 'Current implementation is not thread-safe.' }
          ], null, 2);
          document.getElementById('issue-input').value = sample;
        });

        document.getElementById('clear').addEventListener('click', function() {
          document.getElementById('issue-input').value = '';
          document.getElementById('planner-empty-state').classList.remove('hidden');
          document.getElementById('summary-panel').classList.add('hidden');
          document.getElementById('gh-prompt').value = '';
          document.getElementById('kanban-prompt').value = '';
          document.getElementById('copy-gh-prompt').disabled = true;
          document.getElementById('copy-kanban-prompt').disabled = true;
        });

        document.getElementById('copy-gh-prompt').addEventListener('click', function() {
          var text = document.getElementById('gh-prompt').value;
          if (text) copyToClipboard(text, this);
        });

        document.getElementById('copy-kanban-prompt').addEventListener('click', function() {
          var text = document.getElementById('kanban-prompt').value;
          if (text) copyToClipboard(text, this);
        });
      })();
    </script>
  `;

  return createPageTemplate({
    title: title,
    description: description,
    path: '/github-issue-planner',
    content,
    scripts: script,
    lang
  });
}
