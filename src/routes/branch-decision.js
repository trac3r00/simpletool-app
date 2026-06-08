/**
 * Branch Decision Helper
 * - Pure client-side utility to help automation/fixer operators decide
 *   whether to reuse an existing PR/branch, block for triage, or create new.
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

/**
 * Pure decision function for branch/PR actions.
 * @param {Object} inputs
 * @param {boolean} inputs.issueTriaged
 * @param {string} inputs.existingPR - 'none' | 'open' | 'closed' | 'merged'
 * @param {boolean} inputs.scopeMatches
 * @param {boolean} inputs.recentActivity
 * @param {boolean} inputs.automationActive
 * @returns {{decision: 'reuse'|'create-new'|'block', reason: string}}
 */
export function decideBranchAction(inputs) {
  const {
    issueTriaged = false,
    existingPR = 'none',
    scopeMatches = false,
    recentActivity = false,
    automationActive = false
  } = inputs;

  if (!issueTriaged) {
    return { decision: 'block', reason: 'Issue needs triage before any branch decision can be made.' };
  }

  if (automationActive && scopeMatches) {
    return { decision: 'reuse', reason: 'automation already active on existing branch with matching scope.' };
  }

  if (existingPR === 'open' && scopeMatches) {
    return { decision: 'reuse', reason: 'Existing open PR matches the current scope — reuse it.' };
  }

  if (existingPR === 'open' && !scopeMatches && recentActivity) {
    return { decision: 'reuse', reason: 'Open PR has recent activity — work in progress may cover the needed scope; review before deciding.' };
  }

  if (existingPR === 'merged') {
    return { decision: 'create-new', reason: 'Previous PR was merged — create a new branch for the next change.' };
  }

  if (existingPR === 'closed') {
    return { decision: 'create-new', reason: 'Existing PR is closed — create a new branch.' };
  }

  if (existingPR === 'open' && !scopeMatches && !recentActivity) {
    return { decision: 'create-new', reason: 'stale open PR with mismatched scope — create a new branch.' };
  }

  return { decision: 'create-new', reason: 'No reusable existing branch or PR — create a new branch.' };
}

function renderBranchDecisionPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('branch-decision', currentLang);
  const title = translation?.name || 'Branch Decision Helper';
  const description = translation?.desc || 'Decide whether to reuse an existing PR/branch, block for triage, or create a new branch.';

  const header = createToolHeader(
    { emoji: '🌿' },
    title,
    description,
    [{ text: '<span data-i18n="tools.branch-decision.ui.badge0">Client-Side Only</span>' }],
    { toolId: 'branch-decision' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${header}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800 space-y-4">
              <div class="flex items-center gap-3">
                <input id="issue-triaged" type="checkbox" class="w-4 h-4 text-primary-600 rounded border-surface-300 focus:ring-primary-500" />
                <label for="issue-triaged" class="label mb-0" data-i18n="tools.branch-decision.ui.label0">Issue is triaged and scope is clear</label>
              </div>

              <div>
                <label for="existing-pr" class="label" data-i18n="tools.branch-decision.ui.label1">Existing PR / branch status</label>
                <select id="existing-pr" class="input">
                  <option value="none" data-i18n="tools.branch-decision.ui.option0">None</option>
                  <option value="open" data-i18n="tools.branch-decision.ui.option1">Open</option>
                  <option value="closed" data-i18n="tools.branch-decision.ui.option2">Closed (not merged)</option>
                  <option value="merged" data-i18n="tools.branch-decision.ui.option3">Merged</option>
                </select>
              </div>

              <div class="flex items-center gap-3">
                <input id="scope-matches" type="checkbox" class="w-4 h-4 text-primary-600 rounded border-surface-300 focus:ring-primary-500" />
                <label for="scope-matches" class="label mb-0" data-i18n="tools.branch-decision.ui.label2">Existing PR scope matches current need</label>
              </div>

              <div class="flex items-center gap-3">
                <input id="recent-activity" type="checkbox" class="w-4 h-4 text-primary-600 rounded border-surface-300 focus:ring-primary-500" />
                <label for="recent-activity" class="label mb-0" data-i18n="tools.branch-decision.ui.label3">Recent activity on existing PR (last 48h)</label>
              </div>

              <div class="flex items-center gap-3">
                <input id="automation-active" type="checkbox" class="w-4 h-4 text-primary-600 rounded border-surface-300 focus:ring-primary-500" />
                <label for="automation-active" class="label mb-0" data-i18n="tools.branch-decision.ui.label4">Automation/fix bot is active on existing branch</label>
              </div>
            </div>

            <div class="flex gap-3">
              <button id="decide-btn" class="btn btn-primary" data-i18n="tools.branch-decision.ui.button0">Decide</button>
              <button id="clear-btn" class="btn btn-ghost" data-i18n="tools.branch-decision.ui.button1">Clear</button>
            </div>
          </div>

          <div class="space-y-4">
            <div id="decision-output" class="hidden p-5 rounded-xl border">
              <div class="flex items-center gap-3 mb-3">
                <span id="decision-icon" class="text-2xl"></span>
                <h2 id="decision-title" class="text-lg font-bold"></h2>
              </div>
              <p id="decision-reason" class="text-surface-700 dark:text-surface-300 leading-relaxed"></p>
            </div>

            <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
              <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100 mb-2" data-i18n="tools.branch-decision.ui.heading0">Decision Matrix</h3>
              <ul class="text-sm text-surface-600 dark:text-surface-400 space-y-1 list-disc ml-5">
                <li data-i18n="tools.branch-decision.ui.desc0">Not triaged → Block</li>
                <li data-i18n="tools.branch-decision.ui.desc1">Open PR + scope matches → Reuse</li>
                <li data-i18n="tools.branch-decision.ui.desc2">Active automation + scope matches → Reuse</li>
                <li data-i18n="tools.branch-decision.ui.desc3">Merged PR → Create new</li>
                <li data-i18n="tools.branch-decision.ui.desc4">Closed PR → Create new</li>
                <li data-i18n="tools.branch-decision.ui.desc5">Stale open PR + mismatch → Create new</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  `;

  const scripts = `
    <script>
      (function() {
        const $ = (id) => document.getElementById(id);

        const els = {
          issueTriaged: $('issue-triaged'),
          existingPR: $('existing-pr'),
          scopeMatches: $('scope-matches'),
          recentActivity: $('recent-activity'),
          automationActive: $('automation-active'),
          decideBtn: $('decide-btn'),
          clearBtn: $('clear-btn'),
          output: $('decision-output'),
          icon: $('decision-icon'),
          title: $('decision-title'),
          reason: $('decision-reason'),
        };

        const DECISION_STYLES = {
          reuse: {
            icon: '♻️',
            title: 'Reuse Existing',
            borderClass: 'border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20',
            titleClass: 'text-success-700 dark:text-success-300'
          },
          'create-new': {
            icon: '🆕',
            title: 'Create New Branch',
            borderClass: 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20',
            titleClass: 'text-primary-700 dark:text-primary-300'
          },
          block: {
            icon: '🛑',
            title: 'Block for Triage',
            borderClass: 'border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20',
            titleClass: 'text-warning-700 dark:text-warning-300'
          }
        };

        function decide() {
          const inputs = {
            issueTriaged: els.issueTriaged.checked,
            existingPR: els.existingPR.value,
            scopeMatches: els.scopeMatches.checked,
            recentActivity: els.recentActivity.checked,
            automationActive: els.automationActive.checked
          };

          const result = window.decideBranchAction(inputs);
          const style = DECISION_STYLES[result.decision];

          els.output.classList.remove('hidden');
          els.output.className = 'p-5 rounded-xl border ' + style.borderClass;
          els.icon.textContent = style.icon;
          els.title.textContent = style.title;
          els.title.className = 'text-lg font-bold ' + style.titleClass;
          els.reason.textContent = result.reason;
        }

        function clear() {
          els.issueTriaged.checked = false;
          els.existingPR.value = 'none';
          els.scopeMatches.checked = false;
          els.recentActivity.checked = false;
          els.automationActive.checked = false;
          els.output.classList.add('hidden');
        }

        // Expose pure function on window so inline script can call it
        window.decideBranchAction = ${decideBranchAction.toString()};

        els.decideBtn.addEventListener('click', decide);
        els.clearBtn.addEventListener('click', clear);
      })();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: '/branch-decision',
    content,
    scripts,
    lang: currentLang
  });
}

export async function handleBranchDecisionRoutes(request, url) {
  const { pathname } = url;
  if (pathname === '/branch-decision' || pathname === '/branch-decision/') {
    if (request.method === 'GET') return respondHTML(renderBranchDecisionPage(resolveRequestLanguage(request, url)));
    return new Response('Method not allowed', { status: 405 });
  }
  return null;
}
