import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, infoHint } from '../utils/common-ui.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handlePublicReposNotAutomationRoutes(request, url) {
  const { pathname } = url;
  if (pathname === '/public-repos-not-automation' || pathname === '/public-repos-not-automation/') {
    if (request.method === 'GET') {
      return respondHTML(renderPublicReposNotAutomationPage(resolveRequestLanguage(request, url)));
    }
    return new Response('Method not allowed', { status: 405 });
  }
  return null;
}

function renderPublicReposNotAutomationPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('public-repos-not-automation', currentLang);
  const title = translation?.name || 'Public Repos Not Automation';
  const description = translation?.desc || 'Decide which recurring public repository tasks should stay manual for now and generate a no-automation decision record.';
  const currentTool = TOOLS.find((tool) => tool.id === 'public-repos-not-automation');
  const relatedToolsData = currentTool?.relatedTools?.map((id) => TOOLS.find((tool) => tool.id === id)).filter(Boolean) || [];

  const header = createToolHeader(
    { emoji: '🛑' },
    title,
    description,
    [
      { text: '<span data-i18n="tools.public-repos-not-automation.ui.badge0">Client-Side Only</span>', tooltip: 'All evaluation and record generation runs in your browser.' },
      { text: '<span data-i18n="tools.public-repos-not-automation.ui.badge1">Manual Stewardship</span>', tooltip: 'Capture why automation is deferred and what evidence would change the decision.' }
    ],
    { toolId: 'public-repos-not-automation' }
  );

  const sampleTask = [
    'repo: trac3r00/simpletool-app',
    'task: auto-close stale public issues from recurring Kanban demand',
    'owner: maintainers',
    'cadence: monthly',
    'risk: high',
    'next-review: 2026-07-15'
  ].join('&#10;');

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${header}

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <section class="lg:col-span-2 space-y-5">
            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <div class="flex items-center justify-between gap-3 mb-3">
                <label for="repo-task-input" class="label flex items-center gap-2">
                  <span data-i18n="tools.public-repos-not-automation.ui.label0">Repository task</span>
                  ${infoHint('Use one key:value per line for repo, task, owner, cadence, risk, next-review, and notes. Plain text is also accepted.', 'Help', { i18nKey: 'tools.public-repos-not-automation.ui.desc0' })}
                </label>
                <button id="load-sample" class="btn btn-ghost btn-xs" type="button" data-i18n="tools.public-repos-not-automation.ui.button0">Sample</button>
              </div>
              <textarea id="repo-task-input" rows="10" class="input-mono resize-y" placeholder="${sampleTask}" data-i18n-placeholder="tools.public-repos-not-automation.ui.placeholder0"></textarea>
              <p class="mt-3 text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.public-repos-not-automation.ui.desc1">Designed for public repository work that has recurring Kanban demand but still needs manual stewardship and human judgment.</p>
            </div>

            <div class="p-5 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-4" data-i18n="tools.public-repos-not-automation.ui.heading0">No-automation reasons</h2>
              <div class="space-y-3">
                ${reasonCheckbox('safety', 'Safety or reputation risk', 'Automation could affect public users, external contributors, security posture, or project trust.', true)}
                ${reasonCheckbox('unclear-owner', 'Unclear owner or approval path', 'No named maintainer can review failures, exceptions, or rollback decisions.', true)}
                ${reasonCheckbox('low-frequency', 'Low frequency or weak demand', 'The task is not frequent enough to justify automation maintenance cost.', false)}
                ${reasonCheckbox('ambiguous-policy', 'Ambiguous policy boundary', 'The task needs judgment calls that are not yet written as explicit rules.', true)}
                ${reasonCheckbox('missing-observability', 'Missing observability', 'There is no reliable signal to confirm that automation worked correctly.', false)}
              </div>
            </div>

            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="decision-owner" class="label" data-i18n="tools.public-repos-not-automation.ui.label1">Decision owner</label>
                  <input id="decision-owner" class="input" value="maintainers" placeholder="maintainers" />
                </div>
                <div>
                  <label for="review-window" class="label" data-i18n="tools.public-repos-not-automation.ui.label2">Review window</label>
                  <select id="review-window" class="input">
                    <option value="30 days" data-i18n="tools.public-repos-not-automation.ui.option0">30 days</option>
                    <option value="60 days" data-i18n="tools.public-repos-not-automation.ui.option1">60 days</option>
                    <option value="90 days" data-i18n="tools.public-repos-not-automation.ui.option2">90 days</option>
                    <option value="next release" data-i18n="tools.public-repos-not-automation.ui.option3">Next release</option>
                  </select>
                </div>
              </div>
              <div class="mt-4">
                <label for="automation-threshold" class="label" data-i18n="tools.public-repos-not-automation.ui.label3">Evidence needed before automation</label>
                <textarea id="automation-threshold" rows="4" class="input resize-y" placeholder="e.g., written policy, rollback owner, audit log, dry-run evidence, and 3 repeated manual executions." data-i18n-placeholder="tools.public-repos-not-automation.ui.placeholder1"></textarea>
              </div>
            </div>

            <div class="flex flex-wrap gap-3 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
              <button id="build-decision" class="btn btn-primary" type="button" data-i18n="tools.public-repos-not-automation.ui.button1">Build decision record</button>
              <button id="clear-decision" class="btn btn-ghost" type="button" data-i18n="tools.public-repos-not-automation.ui.button2">Clear</button>
            </div>
          </section>

          <section class="lg:col-span-3 space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3" aria-live="polite">
              ${statBox('selected-reason-count', 'Reasons', '0')}
              ${statBox('decision-state', 'Decision', 'Manual')}
              ${statBox('review-state', 'Review', '30 days')}
            </div>

            <div id="form-error" class="hidden rounded-lg border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20 px-4 py-3 text-sm text-error-800 dark:text-error-200" role="alert"></div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                <div class="flex items-center justify-between gap-3 mb-3">
                  <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.public-repos-not-automation.ui.heading1">Decision record</h2>
                  <button id="copy-decision" class="btn btn-secondary btn-xs" type="button" disabled data-i18n="tools.public-repos-not-automation.ui.button3">Copy</button>
                </div>
                <textarea id="decision-output" rows="20" class="input-mono resize-y bg-surface-50 dark:bg-surface-950" readonly placeholder="No automation decision record will appear here." data-i18n-placeholder="tools.public-repos-not-automation.ui.placeholder2"></textarea>
              </div>

              <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                <div class="flex items-center justify-between gap-3 mb-3">
                  <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.public-repos-not-automation.ui.heading2">Checklist</h2>
                  <button id="copy-checklist" class="btn btn-secondary btn-xs" type="button" disabled data-i18n="tools.public-repos-not-automation.ui.button3">Copy</button>
                </div>
                <textarea id="checklist-output" rows="20" class="input-mono resize-y bg-surface-50 dark:bg-surface-950" readonly placeholder="Manual stewardship checklist will appear here." data-i18n-placeholder="tools.public-repos-not-automation.ui.placeholder3"></textarea>
              </div>
            </div>
          </section>
        </div>
      </div>
      ${createRelatedToolsSection(relatedToolsData)}
    </main>
  `;

  const scripts = String.raw`
    <script>
      (function() {
        const tr = (key, fallback) => (window._t ? window._t('tools.public-repos-not-automation.js.' + key, fallback) : fallback);
        const $ = (id) => document.getElementById(id);
        const els = {
          task: $('repo-task-input'),
          owner: $('decision-owner'),
          review: $('review-window'),
          threshold: $('automation-threshold'),
          decisionButton: $('build-decision'),
          clear: $('clear-decision'),
          sample: $('load-sample'),
          decision: $('decision-output'),
          checklist: $('checklist-output'),
          copyDecision: $('copy-decision'),
          copyChecklist: $('copy-checklist'),
          error: $('form-error'),
          reasonCount: $('selected-reason-count'),
          decisionState: $('decision-state'),
          reviewState: $('review-state')
        };

        const sample = [
          'repo: trac3r00/simpletool-app',
          'task: auto-close stale public issues from recurring Kanban demand',
          'owner: maintainers',
          'cadence: monthly',
          'risk: high',
          'next-review: 2026-07-15'
        ].join('\n');

        const reasons = [
          { id: 'safety', label: tr('reasonSafety', 'Safety or reputation risk') },
          { id: 'unclear-owner', label: tr('reasonOwner', 'Unclear owner or approval path') },
          { id: 'low-frequency', label: tr('reasonFrequency', 'Low frequency or weak demand') },
          { id: 'ambiguous-policy', label: tr('reasonPolicy', 'Ambiguous policy boundary') },
          { id: 'missing-observability', label: tr('reasonObservability', 'Missing observability') }
        ];

        function selectedReasons() {
          return reasons.filter((reason) => {
            const input = $('reason-' + reason.id);
            return input && input.checked;
          });
        }

        function parseTaskInput(value) {
          const text = value ? value.toString() : '';
          const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
          const fields = {};
          const freeform = [];
          lines.forEach((line) => {
            const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.+)$/);
            if (match) {
              fields[match[1].toLowerCase()] = match[2].trim();
            } else {
              freeform.push(line);
            }
          });
          return {
            repo: fields.repo || fields.repository || 'public repository',
            task: fields.task || fields.workflow || freeform.join(' ') || 'public repository task',
            owner: fields.owner || '',
            cadence: fields.cadence || 'unspecified',
            risk: fields.risk || 'review',
            nextReview: fields['next-review'] || fields.review || ''
          };
        }

        function showError(message) {
          els.error.textContent = message;
          els.error.classList.remove('hidden');
        }

        function clearError() {
          els.error.textContent = '';
          els.error.classList.add('hidden');
        }

        function buildDecisionRecord(task, selected, threshold) {
          const owner = els.owner.value.trim() || task.owner || 'maintainers';
          const reviewWindow = els.review.value;
          const nextReview = task.nextReview || reviewWindow;
          const reasonLines = selected.map((reason) => '- ' + reason.label).join('\n');
          return [
            '# No-Automation Decision Record',
            '',
            'Decision: Do not automate yet',
            'Repository: ' + task.repo,
            'Task: ' + task.task,
            'Owner: ' + owner,
            'Cadence: ' + task.cadence,
            'Risk: ' + task.risk,
            'Review window: ' + reviewWindow,
            'Next review: ' + nextReview,
            '',
            '## Why this stays manual',
            reasonLines,
            '',
            '## Manual stewardship',
            '- Keep the task visible in Kanban with a named owner.',
            '- Record each manual execution and any exception that required judgment.',
            '- Revisit automation only when the evidence threshold is met.',
            '',
            '## Evidence needed before automation',
            threshold || '- Written policy, rollback owner, dry-run result, audit log, and repeated manual demand.'
          ].join('\n');
        }

        function buildChecklist(task, selected, threshold) {
          const reasonLines = selected.map((reason) => '- [ ] Re-check reason: ' + reason.label).join('\n');
          return [
            '# No-Automation Checklist',
            '',
            '- [ ] Confirm the repository is public: ' + task.repo,
            '- [ ] Confirm the recurring task is still needed: ' + task.task,
            '- [ ] Confirm manual owner: ' + (els.owner.value.trim() || task.owner || 'maintainers'),
            '- [ ] Keep automation disabled until the decision record is reviewed.',
            reasonLines,
            '- [ ] Capture manual run evidence in the linked Kanban item.',
            '- [ ] Define rollback and public-communication steps before any automation trial.',
            '- [ ] Required threshold: ' + (threshold || 'written policy, observability, dry-run evidence, and repeated demand')
          ].filter(Boolean).join('\n');
        }

        function updateStats(selected) {
          els.reasonCount.textContent = selected.length.toLocaleString();
          els.decisionState.textContent = selected.length ? tr('manual', 'Manual') : tr('needsReason', 'Needs reason');
          els.reviewState.textContent = els.review.value;
        }

        function composeDecision() {
          clearError();
          const selected = selectedReasons();
          const input = els.task.value.trim();
          if (!input) {
            showError(tr('missingTask', 'Add a repository task before building the decision record.'));
            return;
          }
          if (selected.length === 0) {
            showError(tr('missingReasons', 'Select at least one reason not to automate yet.'));
            return;
          }
          const task = parseTaskInput(input);
          const threshold = els.threshold.value.trim();
          els.decision.value = buildDecisionRecord(task, selected, threshold);
          els.checklist.value = buildChecklist(task, selected, threshold);
          els.copyDecision.disabled = false;
          els.copyChecklist.disabled = false;
          updateStats(selected);
        }

        function resetOutputs() {
          els.decision.value = '';
          els.checklist.value = '';
          els.copyDecision.disabled = true;
          els.copyChecklist.disabled = true;
          clearError();
          updateStats(selectedReasons());
        }

        async function copyFrom(el, button) {
          const value = el.value;
          if (!value.trim()) return;
          try {
            await navigator.clipboard.writeText(value);
            const old = button.textContent;
            button.textContent = tr('copied', 'Copied');
            setTimeout(() => { button.textContent = old; }, 1200);
          } catch (error) {
            showError(tr('copyFailed', 'Copy failed. Select the output and copy it manually.'));
          }
        }

        els.decisionButton.addEventListener('click', composeDecision);
        els.sample.addEventListener('click', () => {
          els.task.value = sample;
          composeDecision();
        });
        els.clear.addEventListener('click', () => {
          els.task.value = '';
          els.threshold.value = '';
          resetOutputs();
        });
        els.copyDecision.addEventListener('click', () => copyFrom(els.decision, els.copyDecision));
        els.copyChecklist.addEventListener('click', () => copyFrom(els.checklist, els.copyChecklist));
        reasons.forEach((reason) => {
          const input = $('reason-' + reason.id);
          if (input) input.addEventListener('change', () => updateStats(selectedReasons()));
        });
        els.review.addEventListener('change', () => updateStats(selectedReasons()));

        els.task.value = sample;
        composeDecision();
      })();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: '/public-repos-not-automation',
    content,
    scripts,
    lang: currentLang
  });
}

function reasonCheckbox(id, label, help, checked) {
  return `
    <label class="flex items-start gap-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3 cursor-pointer">
      <input id="reason-${id}" type="checkbox" class="mt-1 w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" ${checked ? 'checked' : ''}>
      <span>
        <span class="block text-sm font-semibold text-surface-900 dark:text-surface-100">${label}</span>
        <span class="block text-xs text-surface-500 dark:text-surface-400">${help}</span>
      </span>
    </label>
  `;
}

function statBox(id, label, value) {
  return `
    <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800">
      <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400">${label}</div>
      <div id="${id}" class="mt-1 text-2xl font-bold font-mono text-surface-900 dark:text-surface-50">${value}</div>
    </div>
  `;
}
