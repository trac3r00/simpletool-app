/**
 * Automation Planner
 * - Paste GitHub issue / Kanban backlog text
 * - Extracts issue refs, repeated keywords, readiness labels, blockers
 * - Suggests automation lanes and next actions
 * - All processing stays in the browser
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleAutomationPlannerRoutes(request, url) {
  const { pathname } = url;
  if (pathname === '/automation-planner' || pathname === '/automation-planner/') {
    if (request.method === 'GET') return renderAutomationPlannerPage(resolveRequestLanguage(request, url));
    return new Response('Method not allowed', { status: 405 });
  }
  return null;
}

function renderAutomationPlannerPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('automation-planner', currentLang);
  const title = translation?.name || 'Automation Planner';
  const description = translation?.desc || 'Paste backlog text to extract themes, blockers, and suggested automation actions.';

  const header = createToolHeader(
    { emoji: '🤖' },
    title,
    description,
    [
      { text: 'Privacy First', tooltip: 'All analysis happens in your browser. No data is sent anywhere.' },
      { text: 'Local Only', tooltip: 'No external API calls. Paste any text and analyze instantly.' }
    ],
    { toolId: 'automation-planner' }
  );

  const currentTool = TOOLS.find(t => t.id === 'automation-planner');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${header}

        <div class="space-y-6">
          <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-5">
            <label for="ap-input" class="label flex items-center gap-2 mb-2">
              Paste Issue / Kanban Text
            </label>
            <textarea id="ap-input" rows="10" class="input-mono w-full resize-y" placeholder="Paste GitHub issues, Kanban cards, or backlog text here...&#10;&#10;Example:&#10;Fix #123 - auth token refresh bug [critical]&#10;Add #124 - dashboard filters [ready]&#10;Update #125 - API docs [wontfix]&#10;Refactor #126 - user service [blocked by PR #42]&#10;Bump #127 - lodash dep [ready]"></textarea>
            <div class="flex flex-wrap gap-3 mt-4">
              <button id="ap-analyze-btn" class="btn btn-primary">Analyze Backlog</button>
              <button id="ap-sample-btn" class="btn btn-secondary">Load Sample</button>
              <button id="ap-clear-btn" class="btn btn-ghost">Clear</button>
            </div>
          </div>

          <div id="ap-results" class="hidden space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-5">
                <div class="text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1">Readiness</div>
                <div id="ap-readiness" class="text-lg font-bold"></div>
                <div id="ap-readiness-detail" class="text-sm text-surface-500 dark:text-surface-400 mt-1"></div>
              </div>
              <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-5">
                <div class="text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1">Issue Count</div>
                <div id="ap-issue-count" class="text-lg font-bold"></div>
                <div id="ap-issue-detail" class="text-sm text-surface-500 dark:text-surface-400 mt-1"></div>
              </div>
              <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-5">
                <div class="text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1">Blockers</div>
                <div id="ap-blocker-count" class="text-lg font-bold"></div>
                <div id="ap-blocker-detail" class="text-sm text-surface-500 dark:text-surface-400 mt-1"></div>
              </div>
            </div>

            <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-5">
              <h3 class="text-sm font-semibold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3">Top Themes</h3>
              <div id="ap-themes" class="flex flex-wrap gap-2"></div>
            </div>

            <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-5">
              <h3 class="text-sm font-semibold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3">Labels Detected</h3>
              <div id="ap-labels" class="flex flex-wrap gap-2"></div>
            </div>

            <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-5">
              <h3 class="text-sm font-semibold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3">Recommended Next Actions</h3>
              <ul id="ap-actions" class="list-disc list-inside text-sm space-y-1 text-surface-700 dark:text-surface-300"></ul>
            </div>

            <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-5">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold uppercase tracking-wide text-surface-600 dark:text-surface-400">Shareable Summary</h3>
                <button id="ap-copy-summary" class="btn btn-secondary text-xs">Copy</button>
              </div>
              <textarea id="ap-summary" rows="5" readonly class="input-mono w-full resize-none text-sm"></textarea>
            </div>
          </div>
        </div>
      </div>

      ${createRelatedToolsSection(relatedToolsData)}
    </main>
  `;

  const scripts = `
    <script>
      (function() {
        var STOP_WORDS = new Set('the a an is it to in for of on and or not be by at as are was were but this that with from have has had its all will can could would should may might do does did done being been get got getting having doing going make made making take taken taking'.split(' '));

        function analyzeText(text) {
          if (!text || !text.trim()) return null;

          var lines = text.split('\\n').filter(Boolean);
          var issueRefs = (text.match(/#\\d+/g) || []).map(function(r) { return r.slice(1); });

          var words = text.toLowerCase().split(/[^a-z0-9]+/).filter(function(w) {
            return w.length > 2 && !STOP_WORDS.has(w);
          });
          var freq = {};
          for (var i = 0; i < words.length; i++) {
            freq[words[i]] = (freq[words[i]] || 0) + 1;
          }
          var sorted = Object.entries(freq).sort(function(a, b) { return b[1] - a[1]; });
          var topThemes = sorted.slice(0, 10).map(function(e) { return e[0]; });

          var labelPatterns = {
            'ready': /\\[ready\\]|\\[go\\]|#ready|:ready|status:\\s*ready/i,
            'blocked': /\\[blocked\\]|\\[block\\]|#blocked|blocked by|status:\\s*blocked/i,
            'wip': /\\[wip\\]|\\[in.progress\\]|#wip|in progress|status:\\s*wip/i,
            'critical': /\\[critical\\]|\\[urgent\\]|\\[p0\\]|\\[p1\\]|#critical|priority:\\s*(critical|urgent|high)/i,
            'wontfix': /\\[wontfix\\]|\\[won't.fix\\]|\\[closed\\]|status:\\s*wontfix/i,
            'bug': /\\bbug\\b|\\[bug\\]/i,
            'feature': /\\bfeature|\\[feature\\]|\\benhancement\\b|\\[enhancement\\]/i,
            'docs': /\\bdocs\\b|\\bdocumentation\\b|\\[docs\\]/i,
            'refactor': /\\brefactor\\b|\\[refactor\\]|\\bcleanup\\b|\\btech.debt\\b/i,
            'security': /\\bsecurity\\b|\\[security\\]|\\bvulnerability\\b|\\bcve\\b/i,
            'performance': /\\bperformance\\b|\\[perf\\]|\\boptimize\\b|\\bslow\\b/i,
            'deps': /\\bdeps\\b|\\bdependency\\b|\\bbump\\b|\\bupgrade\\b|\\bupdate/i
          };

          var detectedLabels = [];
          for (var label in labelPatterns) {
            if (labelPatterns[label].test(text)) {
              detectedLabels.push(label);
            }
          }

          var blockerPhrases = text.match(/(blocked by|blocking|waiting on|depends on|needs|requires)\\s[^\\n]*/gi) || [];

          var readiness = 'medium';
          var readinessDetail = '';
          if (detectedLabels.indexOf('blocked') !== -1) {
            readiness = 'low';
            readinessDetail = 'Blocked items present — unblock before proceed';
          } else if (detectedLabels.indexOf('ready') !== -1 && detectedLabels.indexOf('critical') === -1 && blockerPhrases.length === 0) {
            readiness = 'high';
            readinessDetail = 'Items marked ready with no blockers detected';
          } else if (detectedLabels.indexOf('wontfix') !== -1 && detectedLabels.indexOf('ready') === -1) {
            readiness = 'low';
            readinessDetail = 'Includes wontfix items — review before action';
          } else if (detectedLabels.indexOf('critical') !== -1) {
            readiness = 'medium';
            readinessDetail = 'Critical items detected — prioritize review';
          } else if (blockerPhrases.length > 0) {
            readiness = 'low';
            readinessDetail = blockerPhrases.length + ' blocker reference(s) found';
          } else {
            readinessDetail = 'Mixed status — review labels for clarity';
          }

          var actions = [];

          if (issueRefs.length > 0) {
            actions.push('Auto-triage ' + issueRefs.length + ' issue reference(s) — apply labels based on detected themes');
          }

          if (detectedLabels.indexOf('blocked') !== -1) {
            actions.push('Flag blocked items for maintainer attention — document dependency chain');
          }

          if (detectedLabels.indexOf('ready') !== -1) {
            actions.push('Auto-assign ready items to next available sprint or milestone');
          }

          if (detectedLabels.indexOf('critical') !== -1) {
            actions.push('Escalate critical/urgent items — create P0/P1 tracking label');
          }

          if (detectedLabels.indexOf('wontfix') !== -1) {
            actions.push('Archive wontfix items — notify original reporter before closing');
          }

          if (detectedLabels.indexOf('bug') !== -1) {
            actions.push('Route bug reports to QA channel — add severity label based on context');
          }

          if (detectedLabels.indexOf('feature') !== -1 || detectedLabels.indexOf('enhancement') !== -1) {
            actions.push('Route feature requests to product review — estimate effort from description');
          }

          if (detectedLabels.indexOf('deps') !== -1) {
            actions.push('Schedule dependency updates in automated Dependabot/Renovate workflow');
          }

          if (detectedLabels.indexOf('security') !== -1) {
            actions.push('Escalate security items immediately — private disclosure channel');
          }

          if (topThemes.length > 0) {
            actions.push('Tag issues with top theme labels: ' + topThemes.slice(0, 3).join(', '));
          }

          if (blockerPhrases.length > 0) {
            actions.push('Track ' + blockerPhrases.length + ' cross-reference blocker(s) — add blocking relationship in project board');
          }

          if (actions.length === 0) {
            actions.push('No specific automation actions identified. Consider adding structured labels ([ready], [blocked], [critical]) to your backlog items.');
          }

          var summary = '## Automation Planner Summary\\n';
          summary += '**Readiness:** ' + readiness.toUpperCase() + ' — ' + readinessDetail + '\\n';
          summary += '**Issues:** ' + issueRefs.length + ' reference(s) found\\n';
          summary += '**Blockers:** ' + blockerPhrases.length + ' detected\\n';
          summary += '**Labels:** ' + (detectedLabels.length > 0 ? detectedLabels.join(', ') : 'None') + '\\n';
          summary += '**Themes:** ' + (topThemes.length > 0 ? topThemes.slice(0, 5).join(', ') : 'None') + '\\n';
          summary += '**Actions:**\\n';
          for (var a = 0; a < actions.length; a++) {
            summary += '- ' + actions[a] + '\\n';
          }

          return {
            issueRefs: issueRefs,
            topThemes: topThemes,
            detectedLabels: detectedLabels,
            blockerPhrases: blockerPhrases,
            readiness: readiness,
            readinessDetail: readinessDetail,
            actions: actions,
            summary: summary
          };
        }

        function renderResults(result) {
          var readinessEl = document.getElementById('ap-readiness');
          var color = result.readiness === 'high' ? 'text-success-600 dark:text-success-400' :
            result.readiness === 'low' ? 'text-error-600 dark:text-error-400' :
            'text-warning-600 dark:text-warning-400';
          readinessEl.className = 'text-lg font-bold ' + color;
          readinessEl.textContent = result.readiness.toUpperCase();
          document.getElementById('ap-readiness-detail').textContent = result.readinessDetail;

          document.getElementById('ap-issue-count').textContent = result.issueRefs.length;
          document.getElementById('ap-issue-detail').textContent = result.issueRefs.length > 0
            ? result.issueRefs.slice(0, 10).join(', ') + (result.issueRefs.length > 10 ? '…' : '')
            : 'No issue references found';

          document.getElementById('ap-blocker-count').textContent = result.blockerPhrases.length;
          document.getElementById('ap-blocker-detail').textContent = result.blockerPhrases.length > 0
            ? result.blockerPhrases.length + ' blocker reference(s)'
            : 'No blockers detected';

          var themesEl = document.getElementById('ap-themes');
          themesEl.innerHTML = '';
          if (result.topThemes.length === 0) {
            themesEl.innerHTML = '<span class="text-sm text-surface-500">No themes detected — try adding more text</span>';
          } else {
            for (var i = 0; i < result.topThemes.length; i++) {
              var badge = document.createElement('span');
              badge.className = 'px-3 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full';
              badge.textContent = result.topThemes[i];
              themesEl.appendChild(badge);
            }
          }

          var labelsEl = document.getElementById('ap-labels');
          labelsEl.innerHTML = '';
          if (result.detectedLabels.length === 0) {
            labelsEl.innerHTML = '<span class="text-sm text-surface-500">No labels detected — use [ready], [blocked], [critical], etc.</span>';
          } else {
            var labelColors = {
              ready: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300',
              blocked: 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300',
              wip: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300',
              critical: 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300',
              wontfix: 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400',
              bug: 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300',
              feature: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
              docs: 'bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-300',
              refactor: 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400',
              security: 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300',
              performance: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300',
              deps: 'bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-300'
            };
            for (var j = 0; j < result.detectedLabels.length; j++) {
              var lb = document.createElement('span');
              lb.className = 'px-3 py-1 text-xs font-medium rounded-full ' + (labelColors[result.detectedLabels[j]] || 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400');
              lb.textContent = result.detectedLabels[j];
              labelsEl.appendChild(lb);
            }
          }

          var actionsEl = document.getElementById('ap-actions');
          actionsEl.innerHTML = '';
          for (var k = 0; k < result.actions.length; k++) {
            var li = document.createElement('li');
            li.textContent = result.actions[k];
            actionsEl.appendChild(li);
          }

          document.getElementById('ap-summary').value = result.summary;
          document.getElementById('ap-results').classList.remove('hidden');
        }

        document.getElementById('ap-analyze-btn').addEventListener('click', function() {
          var text = document.getElementById('ap-input').value;
          if (!text || !text.trim()) {
            if (window.Toast) window.Toast.error('Please paste some backlog text first.');
            return;
          }
          var result = analyzeText(text);
          if (result) renderResults(result);
        });

        document.getElementById('ap-sample-btn').addEventListener('click', function() {
          var sample = [
            'Fix #123 - auth token refresh bug [critical]',
            'Add #124 - dashboard data table filters [ready]',
            'Update #125 - API documentation for v2 endpoints [ready]',
            'Refactor #126 - user service to use repository pattern [blocked by PR #42]',
            'Bump #127 - lodash from 4.17.21 to 4.17.30 [ready]',
            'Investigate #128 - memory leak in WebSocket connections [critical]',
            'Add #129 - unit tests for payment gateway [ready]',
            'Fix #130 - CSS overflow on mobile nav [wontfix]',
            'Upgrade #131 - node from 18 to 20 [deps]',
            'Implement #132 - rate limiting middleware [blocked by design review]',
            'Benchmark #133 - response times under load [performance]',
            'Audit #134 - dependency supply chain [security]'
          ].join('\\n');
          document.getElementById('ap-input').value = sample;
        });

        document.getElementById('ap-clear-btn').addEventListener('click', function() {
          document.getElementById('ap-input').value = '';
          document.getElementById('ap-results').classList.add('hidden');
        });

        document.getElementById('ap-copy-summary').addEventListener('click', function() {
          var summary = document.getElementById('ap-summary');
          summary.select();
          try {
            document.execCommand('copy');
            if (window.Toast) window.Toast.success('Summary copied to clipboard.');
          } catch (e) {
            if (window.Toast) window.Toast.error('Failed to copy.');
          }
        });
      })();
    </script>
  `;

  return respondHTML(createPageTemplate({
    title,
    description,
    lang: currentLang,
    path: '/automation-planner',
    content,
    scripts
  }));
}
