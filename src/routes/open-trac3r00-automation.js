/**
 * Open Trac3r00 Automation
 * - Parse pasted Kanban / GitHub backlog text into an offline automation plan
 * - Counts, signals, labels, branch/PR next steps, copyable markdown
 * - All processing stays in the browser
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleOpenTrac3r00AutomationRoutes(request, url) {
  const { pathname } = url;
  if (pathname === '/open-trac3r00-automation' || pathname === '/open-trac3r00-automation/') {
    if (request.method === 'GET') return respondHTML(renderOpenTrac3r00AutomationPage(resolveRequestLanguage(request, url)));
    return new Response('Method not allowed', { status: 405 });
  }
  return null;
}

function renderOpenTrac3r00AutomationPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('open-trac3r00-automation', currentLang);
  const title = translation?.name || 'Open Trac3r00 Automation';
  const description = translation?.desc || 'Parse pasted Kanban / GitHub backlog text into an offline automation plan with counts, labels, and next steps.';

  const header = createToolHeader(
    { emoji: '🤖' },
    title,
    description,
    [
      { text: '<span data-i18n="tools.open-trac3r00-automation.ui.badge0">Client-Side Only</span>', tooltip: 'No network calls. Plans are generated locally in your browser.' }
    ],
    { toolId: 'open-trac3r00-automation' }
  );

  const currentTool = TOOLS.find(t => t.id === 'open-trac3r00-automation');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${header}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="flex flex-wrap gap-2 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
              <button id="load-sample" class="btn btn-secondary">🧪 <span data-i18n="tools.open-trac3r00-automation.ui.button0">Sample</span></button>
              <button id="clear" class="btn btn-ghost ml-auto">🗑️ <span data-i18n="tools.open-trac3r00-automation.ui.button1">Clear</span></button>
              <button id="copy-plan" class="btn btn-secondary" disabled>📋 <span data-i18n="tools.open-trac3r00-automation.ui.button2">Copy Plan</span></button>
            </div>

            <div>
              <label class="label" data-i18n="tools.open-trac3r00-automation.ui.label0">Repository slug</label>
              <input id="repo-slug" class="input font-mono" data-testid="repo-slug" placeholder="owner/repo" data-i18n-placeholder="tools.open-trac3r00-automation.ui.placeholder0" />
            </div>

            <div>
              <label class="label flex items-center gap-2">
                <span data-i18n="tools.open-trac3r00-automation.ui.label1">Backlog</span>
                <span class="text-xs text-surface-400 dark:text-surface-500" data-i18n="tools.open-trac3r00-automation.ui.desc0">Paste recurring issues / todo items, one per line.</span>
              </label>
              <textarea id="backlog-input" rows="12" class="input-mono resize-y" data-testid="backlog-input" placeholder="- Fix login redirect loop&#10;- Update README with setup steps&#10;- Add rate-limiting tests&#10;- Refactor caching layer" data-i18n-placeholder="tools.open-trac3r00-automation.ui.placeholder1"></textarea>
            </div>

            <button id="generate-plan-btn" class="btn btn-primary w-full" data-testid="generate-plan-btn" data-i18n="tools.open-trac3r00-automation.ui.button3">Generate automation plan</button>
          </div>

          <div class="space-y-4">
            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800" data-testid="signal-summary">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.open-trac3r00-automation.ui.heading0">Signal summary</h2>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                  <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-items">0</div>
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.open-trac3r00-automation.ui.stat0">Items</div>
                </div>
                <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                  <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-bugs">0</div>
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.open-trac3r00-automation.ui.stat1">Bugs</div>
                </div>
                <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                  <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-features">0</div>
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.open-trac3r00-automation.ui.stat2">Features</div>
                </div>
                <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                  <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-chores">0</div>
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.open-trac3r00-automation.ui.stat3">Chores</div>
                </div>
              </div>
            </div>

            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800" data-testid="automation-plan">
              <div class="flex items-center justify-between mb-3">
                <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.open-trac3r00-automation.ui.heading1">Automation plan</h2>
                <span id="plan-empty" class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.open-trac3r00-automation.ui.text0">Paste backlog and click Generate</span>
              </div>
              <div id="plan-output" class="space-y-2"></div>
            </div>

            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800" data-testid="github-next-steps">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.open-trac3r00-automation.ui.heading2">GitHub next steps</h2>
              <div id="next-steps-output" class="space-y-2"></div>
            </div>
          </div>
        </div>
      </div>
    ${createRelatedToolsSection(relatedToolsData)}
    </main>
  `;

  const scripts = String.raw`
    <script>
      const t = (k, fb) => (window._t ? window._t('tools.open-trac3r00-automation.js.' + k, fb) : (fb || k));
      const $ = (id) => document.getElementById(id);

      const els = {
        repoSlug: $('repo-slug'),
        backlog: $('backlog-input'),
        generate: $('generate-plan-btn'),
        loadSample: $('load-sample'),
        clear: $('clear'),
        copyPlan: $('copy-plan'),
        statItems: $('stat-items'),
        statBugs: $('stat-bugs'),
        statFeatures: $('stat-features'),
        statChores: $('stat-chores'),
        planOutput: $('plan-output'),
        nextStepsOutput: $('next-steps-output'),
        planEmpty: $('plan-empty'),
      };

      const SAMPLE = [
        '- Fix login redirect loop after OAuth',
        '- Add dark mode toggle to settings page',
        '- Update README with local dev steps',
        '- Write E2E tests for checkout flow',
        '- Refactor caching layer to use Redis',
        '- Bump dependencies (security patches)',
        '- Clean up stale feature flags',
      ].join('\n');

      function slugify(text) {
        return String(text || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }

      function parseBacklog(text) {
        const lines = String(text || '').split('\n');
        const items = [];
        for (const line of lines) {
          const trimmed = line.replace(/^[-*\s]+/, '').trim();
          if (!trimmed) continue;
          const lower = trimmed.toLowerCase();
          let type = 'chore';
          if (/\b(fix|bug|broken|error|crash|regression|defect|issue|fail|leak|memory|segfault)\b/.test(lower)) type = 'bug';
          else if (/\b(feat|feature|add|implement|support|enable|introduce|new)\b/.test(lower)) type = 'feature';
          items.push({ text: trimmed, type });
        }
        return items;
      }

      function labelForType(type) {
        if (type === 'bug') return 'bug';
        if (type === 'feature') return 'enhancement';
        return 'chore';
      }

      function branchName(item, index) {
        const prefix = item.type === 'bug' ? 'fix' : item.type === 'feature' ? 'feat' : 'chore';
        const slug = slugify(item.text).substring(0, 40);
        return prefix + '/' + (index + 1) + '-' + slug;
      }

      function escapeHtml(str) {
        const s = String(str ?? '');
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
      }

      function escapeShell(str) {
        const s = String(str ?? '');
        return s
          .replace(/\\\\/g, '\\\\\\\\')
          .replace(/\"/g, '\\\\"')
          .replace(/\\$/g, '\\\\$')
          .replace(new RegExp(String.fromCharCode(96), 'g'), '\\\\' + String.fromCharCode(96));
      }

      function escapeMdPipe(str) {
        const s = String(str ?? '');
        return s.replace(/\|/g, '\\|');
      }

      function generatePlan() {
        const repo = els.repoSlug.value.trim();
        const items = parseBacklog(els.backlog.value);

        els.statItems.textContent = String(items.length);
        els.statBugs.textContent = String(items.filter(i => i.type === 'bug').length);
        els.statFeatures.textContent = String(items.filter(i => i.type === 'feature').length);
        els.statChores.textContent = String(items.filter(i => i.type === 'chore').length);

        if (items.length === 0) {
          els.planOutput.innerHTML = '';
          els.nextStepsOutput.innerHTML = '';
          els.planEmpty.classList.remove('hidden');
          els.copyPlan.disabled = true;
          return;
        }

        els.planEmpty.classList.add('hidden');
        els.copyPlan.disabled = false;

        const planHTML = items.map((item, idx) => {
          const label = labelForType(item.type);
          const branch = branchName(item, idx);
          const safeText = escapeHtml(item.text);
          return '\n            <div class="p-3 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">\n              <div class="flex flex-wrap items-center gap-2 mb-1">\n                <span class="px-2 py-0.5 text-xs font-semibold rounded-full ' + (item.type === 'bug' ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300' : item.type === 'feature' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300') + '">' + label + '</span>\n                <span class="text-xs text-surface-500 dark:text-surface-400 font-mono">' + branch + '</span>\n              </div>\n              <div class="text-sm text-surface-800 dark:text-surface-200">' + safeText + '</div>\n            </div>\n          ';
        }).join('');
        els.planOutput.innerHTML = planHTML;

        const nextHTML = items.map((item, idx) => {
          const branch = branchName(item, idx);
          const title = escapeHtml(item.text);
          const prTitle = escapeHtml(escapeShell(item.type === 'bug' ? 'Fix: ' + item.text : item.type === 'feature' ? 'Feat: ' + item.text : 'Chore: ' + item.text));
          const lines = [
            '<div class="p-3 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">',
            '  <div class="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-1">' + (idx + 1) + '. ' + title + '</div>',
            '  <div class="text-xs text-surface-600 dark:text-surface-400 space-y-0.5 font-mono">',
            '    <div>git checkout -b ' + branch + '</div>',
          ];
          if (repo) {
            lines.push('    <div>git push -u origin ' + branch + '</div>');
            lines.push('    <div>gh pr create --title "' + prTitle + '" --body "- [ ] Tests\n- [ ] Docs\n- [ ] Changelog"</div>');
          } else {
            lines.push('    <div>git push origin ' + branch + '</div>');
          }
          lines.push('  </div>');
          lines.push('</div>');
          return lines.join('\n');
        }).join('\n');
        els.nextStepsOutput.innerHTML = nextHTML;
      }

      function copyMarkdown() {
        const repo = els.repoSlug.value.trim();
        const items = parseBacklog(els.backlog.value);
        if (items.length === 0) return;

        const lines = [
          '# Automation Plan',
          '',
          '| # | Type | Title | Branch |',
          '|---|------|-------|--------|',
        ];
        items.forEach((item, idx) => {
          lines.push('| ' + (idx + 1) + ' | ' + labelForType(item.type) + ' | ' + escapeMdPipe(item.text) + ' | ' + branchName(item, idx) + ' |');
        });
        lines.push('');
        lines.push('## GitHub Next Steps');
        lines.push('');
        items.forEach((item, idx) => {
          const branch = branchName(item, idx);
          const title = escapeShell(item.type === 'bug' ? 'Fix: ' + item.text : item.type === 'feature' ? 'Feat: ' + item.text : 'Chore: ' + item.text);
          lines.push((idx + 1) + '. **' + escapeMdPipe(item.text) + '**');
          lines.push('   \`\`\`bash');
          lines.push('   git checkout -b ' + branch);
          if (repo) {
            lines.push('   git push -u origin ' + branch);
            lines.push('   gh pr create --title "' + title + '" --body "- [ ] Tests\\n- [ ] Docs\\n- [ ] Changelog"');
          } else {
            lines.push('   git push origin ' + branch);
          }
          lines.push('   \`\`\`');
          lines.push('');
        });

        const text = lines.join('\n');
        navigator.clipboard.writeText(text).then(() => {
          const old = els.copyPlan.textContent;
          els.copyPlan.textContent = t('text1', '✓ Copied');
          if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
          setTimeout(() => (els.copyPlan.textContent = old), 1200);
        }).catch((e) => {
          console.error('Copy failed:', e);
        });
      }

      els.generate.addEventListener('click', generatePlan);

      els.loadSample.addEventListener('click', () => {
        els.backlog.value = SAMPLE;
        generatePlan();
      });

      els.clear.addEventListener('click', () => {
        els.backlog.value = '';
        els.repoSlug.value = '';
        generatePlan();
      });

      els.copyPlan.addEventListener('click', copyMarkdown);

      generatePlan();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: '/open-trac3r00-automation',
    content,
    scripts,
    lang: currentLang
  });
}
