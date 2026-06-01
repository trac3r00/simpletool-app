/**
 * Quality Tracer
 * - Paste a Kanban / backlog / issue-list text dump
 * - Heuristic local analysis: themes, blockers, next actions, product-value score
 * - All processing stays in the browser
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, infoHint } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleQualityTracerRoutes(request, url) {
  const { pathname } = url;
  if (pathname === '/quality-tracer' || pathname === '/quality-tracer/') {
    if (request.method === 'GET') return respondHTML(renderQualityTracerPage(resolveRequestLanguage(request, url)));
    return respondJSON({ error: 'Method not allowed' }, { status: 405 });
  }
  return null;
}

function renderQualityTracerPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('quality-tracer', currentLang);
  const title = translation?.name || 'Quality Tracer';
  const description = translation?.desc || 'Analyze Kanban/backlog dumps locally to surface quality themes, readiness blockers, next actions, and a product-value score.';

  const header = createToolHeader(
    { emoji: '🔍' },
    title,
    description,
    [
      { text: '<span data-i18n="tools.quality-tracer.ui.badge0">Client-Side Only</span>', tooltip: 'All analysis runs in your browser. No data is sent to any server.' }
    ],
    { toolId: 'quality-tracer' }
  );

  const currentTool = TOOLS.find(t => t.id === 'quality-tracer');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${header}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-3">
            <div class="flex flex-wrap gap-2 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
              <button id="load-sample" class="btn btn-secondary">🧪 <span data-i18n="tools.quality-tracer.ui.button0">Sample</span></button>
              <button id="clear" class="btn btn-ghost ml-auto">🗑️ <span data-i18n="tools.quality-tracer.ui.button1">Clear</span></button>
              <button id="analyze-btn" class="btn btn-primary">🔍 <span data-i18n="tools.quality-tracer.ui.button2">Analyze</span></button>
            </div>

            <label class="label flex items-center gap-2">
              <span data-i18n="tools.quality-tracer.ui.label0">Backlog / Issue List</span>
              ${infoHint('Paste any text dump: one item per line. Status prefixes like TODO/BLOCKED/BUG/DONE are auto-detected.', 'Help', { i18nKey: 'tools.quality-tracer.ui.desc0' })}
            </label>
            <textarea id="backlog-input" rows="14" class="input-mono resize-y" placeholder="Paste your Kanban or backlog text here..." data-i18n-placeholder="tools.quality-tracer.ui.placeholder0"></textarea>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-total">0</div>
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.quality-tracer.ui.stat0">Items</div>
              </div>
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-done">0</div>
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.quality-tracer.ui.stat1">Done</div>
              </div>
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-blocked">0</div>
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.quality-tracer.ui.stat2">Blocked</div>
              </div>
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-bugs">0</div>
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.quality-tracer.ui.stat3">Bugs</div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.quality-tracer.ui.heading0">Quality Themes</h2>
              <div id="themes-panel" class="flex flex-wrap gap-2">
                <span class="text-sm text-surface-500 dark:text-surface-400" data-i18n="tools.quality-tracer.ui.text0">Run analysis to see themes.</span>
              </div>
            </div>

            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.quality-tracer.ui.heading1">Readiness Blockers</h2>
              <ul id="blockers-panel" class="space-y-2 text-sm text-surface-700 dark:text-surface-300">
                <li class="text-surface-500 dark:text-surface-400" data-i18n="tools.quality-tracer.ui.text1">Run analysis to see blockers.</li>
              </ul>
            </div>

            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.quality-tracer.ui.heading2">Suggested Next Actions</h2>
              <ol id="actions-panel" class="list-decimal ml-5 space-y-1 text-sm text-surface-700 dark:text-surface-300">
                <li class="text-surface-500 dark:text-surface-400" data-i18n="tools.quality-tracer.ui.text2">Run analysis to see suggestions.</li>
              </ol>
            </div>

            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <div class="flex items-center justify-between mb-3">
                <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.quality-tracer.ui.heading3">Product-Value Score</h2>
                <span id="score-value" class="text-3xl font-bold text-primary-600 dark:text-primary-400">--</span>
              </div>
              <div class="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-4 overflow-hidden">
                <div id="score-ring" class="bg-primary-500 h-4 rounded-full transition-all duration-500" style="width:0%"></div>
              </div>
              <p class="text-xs text-surface-500 dark:text-surface-400 mt-2" data-i18n="tools.quality-tracer.ui.desc1">Based on completion, blocker density, clarity, and balance.</p>
            </div>
          </div>
        </div>
      </div>
    ${createRelatedToolsSection(relatedToolsData)}
    </main>
  `;

  const scripts = String.raw`
    <script>
      const $ = (id) => document.getElementById(id);

      const els = {
        input: $('backlog-input'),
        analyzeBtn: $('analyze-btn'),
        loadSample: $('load-sample'),
        clear: $('clear'),
        statTotal: $('stat-total'),
        statDone: $('stat-done'),
        statBlocked: $('stat-blocked'),
        statBugs: $('stat-bugs'),
        themesPanel: $('themes-panel'),
        blockersPanel: $('blockers-panel'),
        actionsPanel: $('actions-panel'),
        scoreValue: $('score-value'),
        scoreRing: $('score-ring'),
      };

      const SAMPLE = [
        'TODO: Fix login bug on Safari',
        'DOING: Refactor auth module for SSO',
        'BLOCKED: Waiting for API keys from platform team',
        'DONE: Setup CI/CD pipeline',
        'BUG: Memory leak in parser under load',
        'TODO: Write API documentation',
        'DONE: Deploy staging environment',
        'P0: Critical outage fix needed',
        'TODO: Add integration tests for checkout flow',
        'BLOCKED: Legal review for terms of service update',
        'DONE: Initial user research interviews',
        'FIX: Resolve CORS issue on preflight requests'
      ].join('\n');

      function parseItems(text) {
        return (text || '').split('\n').map(l => l.trim()).filter(l => l.length > 0);
      }

      function detectStatus(line) {
        const m = line.match(/^\s*(TODO|DOING|DONE|BLOCKED|BUG|FIX|P0|P1|P2)\s*[:\-\)\]\s]*/i);
        return m ? m[1].toUpperCase() : null;
      }

      function detectThemes(line) {
        const themes = [];
        const keywords = [
          { key: 'Bug', words: ['bug', 'fix', 'crash', 'error', 'regression', 'defect', 'leak'] },
          { key: 'Refactor', words: ['refactor', 'rewrite', 'cleanup', 'debt', 'legacy'] },
          { key: 'Test', words: ['test', 'e2e', 'unit test', 'integration test', 'spec', 'coverage'] },
          { key: 'Docs', words: ['doc', 'readme', 'guide', 'wiki', 'documentation', 'changelog'] },
          { key: 'Security', words: ['security', 'auth', 'sso', 'mfa', 'oauth', 'cve', 'vulnerability', 'cors'] },
          { key: 'Performance', words: ['performance', 'speed', 'latency', 'memory', 'cache', 'optimize'] },
          { key: 'UI/UX', words: ['ui', 'ux', 'design', 'layout', 'css', 'accessibility', 'a11y'] },
          { key: 'DevOps', words: ['ci/cd', 'deploy', 'pipeline', 'infra', 'staging', 'docker', 'kubernetes'] },
          { key: 'API', words: ['api', 'endpoint', 'rest', 'graphql', 'sdk'] },
          { key: 'Data', words: ['data', 'database', 'schema', 'migration', 'backup', 'sync'] },
          { key: 'Feature', words: ['feature', 'add', 'support', 'implement', 'enable'] }
        ];
        const lower = line.toLowerCase();
        for (const g of keywords) {
          if (g.words.some(w => lower.includes(w))) {
            themes.push(g.key);
          }
        }
        return themes;
      }

      function analyze(text) {
        const lines = parseItems(text);
        const total = lines.length;
        const statuses = [];
        const themeCounts = {};
        const blockers = [];
        let done = 0;
        let blocked = 0;
        let bugs = 0;
        let hasStatusLabel = 0;

        for (const line of lines) {
          const status = detectStatus(line);
          if (status) {
            hasStatusLabel++;
            statuses.push(status);
            if (status === 'DONE') done++;
            if (status === 'BLOCKED') {
              blocked++;
              blockers.push(line);
            }
            if (status === 'BUG') bugs++;
          }

          const themes = detectThemes(line);
          for (const t of themes) {
            themeCounts[t] = (themeCounts[t] || 0) + 1;
          }

          const lower = line.toLowerCase();
          if (!status && (lower.includes('blocked') || lower.includes('waiting') || lower.includes('dependency') || lower.includes('external') || lower.includes('approval needed') || lower.includes('on hold'))) {
            blockers.push(line);
          }
        }

        // Score
        let score = 0;
        if (total > 0) {
          // Completion 0-40
          score += Math.round((done / total) * 40);
          // Clarity 0-20
          score += Math.round((hasStatusLabel / total) * 20);
          // Balance 0-20 (diverse themes)
          const themeKeys = Object.keys(themeCounts);
          score += Math.min(20, themeKeys.length * 4);
          // Health 0-20 (low bug ratio)
          const bugRatio = bugs / total;
          score += Math.round(Math.max(0, 20 - bugRatio * 100));
          // Blocker penalty
          const blockerPenalty = Math.min(30, blockers.length * 10);
          score = Math.max(0, score - blockerPenalty);
        }
        score = Math.min(100, Math.round(score));

        // Actions
        const actions = [];
        if (blockers.length > 0) {
          actions.push('Unblock ' + blockers.length + ' item(s) before shipping.');
        }
        if (done / total < 0.3 && total > 0) {
          actions.push('Low completion ratio — focus on finishing in-progress work before starting new items.');
        }
        if (bugs > 0) {
          actions.push('Schedule a bug-fix pass (' + bugs + ' bug-related item(s) detected).');
        }
        const hasTest = themeCounts['Test'] || 0;
        const hasDocs = themeCounts['Docs'] || 0;
        if (hasTest === 0 && total > 3) {
          actions.push('Add testing coverage — no test-related items found.');
        }
        if (hasDocs === 0 && total > 3) {
          actions.push('Add documentation tasks — no doc-related items found.');
        }
        if (actions.length === 0 && total > 0) {
          actions.push('Backlog looks healthy. Prepare a release checklist and do a final review.');
        }
        if (total === 0) {
          actions.push('Paste a backlog to get suggestions.');
        }

        return {
          total,
          done,
          blocked,
          bugs,
          themeCounts,
          blockers,
          actions,
          score
        };
      }

      function renderThemes(themeCounts) {
        const keys = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]);
        if (keys.length === 0) {
          return '<span class="text-sm text-surface-500 dark:text-surface-400">No clear themes detected.</span>';
        }
        return keys.map(([name, count]) => {
          return '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border border-primary-100 dark:border-primary-800">' + name + ' <span class="ml-1 text-primary-500 dark:text-primary-400">' + count + '</span></span>';
        }).join('');
      }

      function renderBlockers(blockers) {
        if (blockers.length === 0) {
          return '<li class="text-sm text-surface-500 dark:text-surface-400">No blockers detected.</li>';
        }
        return blockers.map(b => '<li class="flex items-start gap-2"><span class="text-warning-500 mt-0.5" aria-hidden="true">⚠️</span><span>' + escapeHtml(b) + '</span></li>').join('');
      }

      function renderActions(actions) {
        if (actions.length === 0) {
          return '<li class="text-sm text-surface-500 dark:text-surface-400">No suggestions yet.</li>';
        }
        return actions.map(a => '<li>' + escapeHtml(a) + '</li>').join('');
      }

      function escapeHtml(s) {
        return ('' + s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      function updateUI(result) {
        els.statTotal.textContent = result.total;
        els.statDone.textContent = result.done;
        els.statBlocked.textContent = result.blocked;
        els.statBugs.textContent = result.bugs;
        els.themesPanel.innerHTML = renderThemes(result.themeCounts);
        els.blockersPanel.innerHTML = renderBlockers(result.blockers);
        els.actionsPanel.innerHTML = renderActions(result.actions);
        els.scoreValue.textContent = result.total > 0 ? result.score : '--';
        els.scoreRing.style.width = result.total > 0 ? result.score + '%' : '0%';
        // Color the score ring based on value
        if (result.total > 0) {
          els.scoreRing.className = 'h-4 rounded-full transition-all duration-500 ' + (result.score >= 70 ? 'bg-success-500' : result.score >= 40 ? 'bg-warning-500' : 'bg-danger-500');
        }
      }

      els.analyzeBtn.addEventListener('click', () => {
        const result = analyze(els.input.value);
        updateUI(result);
      });

      els.loadSample.addEventListener('click', () => {
        els.input.value = SAMPLE;
        const result = analyze(SAMPLE);
        updateUI(result);
      });

      els.clear.addEventListener('click', () => {
        els.input.value = '';
        updateUI({ total: 0, done: 0, blocked: 0, bugs: 0, themeCounts: {}, blockers: [], actions: ['Paste a backlog to get suggestions.'], score: 0 });
      });

      // Initial empty state
      updateUI({ total: 0, done: 0, blocked: 0, bugs: 0, themeCounts: {}, blockers: [], actions: ['Paste a backlog to get suggestions.'], score: 0 });
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: '/quality-tracer',
    content,
    scripts,
    lang: currentLang
  });
}
