/**
 * Quality Automation Planner
 * - Accepts backlog/proposal signals and outputs deterministic quality automation recommendations
 * - Pure scoring/planning functions exported for tests
 * - All processing stays in the browser
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export const SIGNAL_PATTERNS = {
  'block-for-triage': ['bug', 'crash', 'error', 'failure', 'triage', 'critical', 'block', 'regression', 'incident', 'outage', 'broken', 'defect'],
  'add-coverage': ['test', 'coverage', 'unit', 'spec', 'jest', 'vitest', 'missing test', 'untested', 'no tests', 'untested code'],
  'dependency-automation': ['dependency', 'npm', 'outdated', 'cve', 'vulnerability', 'dependabot', 'audit', 'package', 'upgrade', 'patch', 'security advisory'],
  'accessibility-audit': ['accessibility', 'a11y', 'screen reader', 'wcag', 'contrast', 'aria', 'keyboard', 'focus', 'alt text', 'semantic', 'colorblind', 'screenreader']
};

export function analyzeQualitySignals(signals) {
  if (!Array.isArray(signals) || signals.length === 0) {
    return { recommendations: [], summary: 'No quality signals detected.' };
  }

  const found = new Set();

  for (const signal of signals) {
    const lower = String(signal).toLowerCase();
    for (const [recommendation, keywords] of Object.entries(SIGNAL_PATTERNS)) {
      for (const keyword of keywords) {
        if (lower.includes(keyword.toLowerCase())) {
          found.add(recommendation);
          break;
        }
      }
    }
  }

  const recommendations = Array.from(found);

  const order = ['block-for-triage', 'add-coverage', 'dependency-automation', 'accessibility-audit'];
  recommendations.sort((a, b) => order.indexOf(a) - order.indexOf(b));

  const summary = recommendations.length === 0
    ? 'No actionable quality signals detected.'
    : `${recommendations.length} recommendation${recommendations.length === 1 ? '' : 's'} identified.`;

  return { recommendations, summary };
}

export function calculateReadinessScore(recommendations) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return 100;
  }

  let score = 100;
  for (const rec of recommendations) {
    if (rec === 'block-for-triage') {
      score -= 20;
    } else {
      score -= 15;
    }
  }

  return Math.max(0, score);
}

export async function handleQualityAutomationPlannerRoutes(request, url) {
  const { pathname } = url;
  if (pathname === '/quality-automation-planner' || pathname === '/quality-automation-planner/') {
    if (request.method === 'GET') return respondHTML(renderQualityAutomationPlannerPage(resolveRequestLanguage(request, url)));
    return new Response('Method not allowed', { status: 405 });
  }
  return null;
}

function renderQualityAutomationPlannerPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('quality-automation-planner', currentLang);
  const title = translation?.name || 'Quality Automation Planner';
  const description = translation?.desc || 'Turn backlog and proposal signals into deterministic quality automation recommendations and a readiness score.';

  const header = createToolHeader(
    { emoji: '🛡️' },
    title,
    description,
    [
      { text: '<span data-i18n="tools.quality-automation-planner.ui.badge0">Client-Side Only</span>', tooltip: 'All analysis is performed locally in your browser.' }
    ],
    { toolId: 'quality-automation-planner' }
  );

  const currentTool = TOOLS.find(t => t.id === 'quality-automation-planner');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${header}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="flex flex-wrap gap-2 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
              <button id="load-sample" class="btn btn-secondary">🧪 <span data-i18n="tools.quality-automation-planner.ui.button0">Load Sample</span></button>
              <button id="clear" class="btn btn-ghost ml-auto">🗑️ <span data-i18n="tools.quality-automation-planner.ui.button1">Clear</span></button>
              <button id="copy" class="btn btn-secondary" disabled>📋 <span data-i18n="tools.quality-automation-planner.ui.button2">Copy Report</span></button>
            </div>

            <label class="label" data-i18n="tools.quality-automation-planner.ui.label0">Backlog / Proposal Signals</label>
            <textarea id="signals" rows="12" class="input-mono resize-y" placeholder="Enter signals, one per line (e.g., 'Bug in checkout', 'No tests for auth', 'Outdated dependencies')..." data-i18n-placeholder="tools.quality-automation-planner.ui.placeholder0"></textarea>

            <button id="analyze-btn" class="btn btn-primary w-full">🔍 <span data-i18n="tools.quality-automation-planner.ui.button3">Analyze Signals</span></button>
          </div>

          <div class="space-y-4">
            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.quality-automation-planner.ui.heading0">Readiness Score</h2>
              <div class="flex items-center gap-4">
                <div id="score-badge" class="text-4xl font-bold text-primary-600 dark:text-primary-400">—</div>
                <div class="flex-1">
                  <div class="h-4 bg-surface-200 dark:bg-surface-800 rounded-full overflow-hidden">
                    <div id="score-bar" class="h-full bg-primary-500 rounded-full transition-all duration-500" style="width: 0%"></div>
                  </div>
                  <p id="score-label" class="text-sm text-surface-500 dark:text-surface-400 mt-1" data-i18n="tools.quality-automation-planner.ui.text0">Enter signals and click Analyze</p>
                </div>
              </div>
            </div>

            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.quality-automation-planner.ui.heading1">Recommendations</h2>
              <div id="recommendations-list" class="space-y-2">
                <p class="text-surface-500 dark:text-surface-400 text-sm" data-i18n="tools.quality-automation-planner.ui.text1">No recommendations yet.</p>
              </div>
            </div>

            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.quality-automation-planner.ui.heading2">Summary</h2>
              <p id="summary-text" class="text-surface-700 dark:text-surface-300 text-sm" data-i18n="tools.quality-automation-planner.ui.text2">Waiting for input.</p>
            </div>
          </div>
        </div>
      </div>
      ${createRelatedToolsSection(relatedToolsData)}
    </main>
  `;

  const scripts = String.raw`
    <script>
      const t = (k, fb) => (window._t ? window._t('tools.quality-automation-planner.js.' + k, fb) : (fb || k));
      const $ = (id) => document.getElementById(id);

      const els = {
        signals: $('signals'),
        analyzeBtn: $('analyze-btn'),
        loadSample: $('load-sample'),
        clear: $('clear'),
        copy: $('copy'),
        scoreBadge: $('score-badge'),
        scoreBar: $('score-bar'),
        scoreLabel: $('score-label'),
        recommendationsList: $('recommendations-list'),
        summaryText: $('summary-text')
      };

      const SAMPLE = [
        'Critical bug in payment flow causing intermittent 500 errors',
        'New auth module has no unit tests or integration coverage',
        'npm audit found 3 high-severity CVEs in downstream dependencies',
        'Landing page fails WCAG contrast requirements and missing ARIA labels'
      ].join('\n');

      const SIGNAL_PATTERNS = {
        'block-for-triage': ['bug', 'crash', 'error', 'failure', 'triage', 'critical', 'block', 'regression', 'incident', 'outage', 'broken', 'defect'],
        'add-coverage': ['test', 'coverage', 'unit', 'spec', 'jest', 'vitest', 'missing test', 'untested', 'no tests', 'untested code'],
        'dependency-automation': ['dependency', 'npm', 'outdated', 'cve', 'vulnerability', 'dependabot', 'audit', 'package', 'upgrade', 'patch', 'security advisory'],
        'accessibility-audit': ['accessibility', 'a11y', 'screen reader', 'wcag', 'contrast', 'aria', 'keyboard', 'focus', 'alt text', 'semantic', 'colorblind', 'screenreader']
      };

      const REC_LABELS = {
        'block-for-triage': { label: 'Block for Triage', color: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300 border-danger-200 dark:border-danger-800' },
        'add-coverage': { label: 'Add Coverage', color: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300 border-warning-200 dark:border-warning-800' },
        'dependency-automation': { label: 'Dependency Automation', color: 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300 border-info-200 dark:border-info-800' },
        'accessibility-audit': { label: 'Accessibility Audit', color: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border-primary-200 dark:border-primary-800' }
      };

      function analyzeQualitySignals(signals) {
        if (!Array.isArray(signals) || signals.length === 0) {
          return { recommendations: [], summary: 'No quality signals detected.' };
        }
        const found = new Set();
        for (const signal of signals) {
          const lower = String(signal).toLowerCase();
          for (const [recommendation, keywords] of Object.entries(SIGNAL_PATTERNS)) {
            for (const keyword of keywords) {
              if (lower.includes(keyword.toLowerCase())) {
                found.add(recommendation);
                break;
              }
            }
          }
        }
        const recommendations = Array.from(found);
        const order = ['block-for-triage', 'add-coverage', 'dependency-automation', 'accessibility-audit'];
        recommendations.sort((a, b) => order.indexOf(a) - order.indexOf(b));
        const summary = recommendations.length === 0
          ? 'No actionable quality signals detected.'
          : recommendations.length + ' recommendation' + (recommendations.length === 1 ? '' : 's') + ' identified.';
        return { recommendations, summary };
      }

      function calculateReadinessScore(recommendations) {
        if (!Array.isArray(recommendations) || recommendations.length === 0) return 100;
        let score = 100;
        for (const rec of recommendations) {
          score -= (rec === 'block-for-triage' ? 20 : 15);
        }
        return Math.max(0, score);
      }

      function renderRecommendations(recommendations) {
        if (recommendations.length === 0) {
          els.recommendationsList.innerHTML = '<p class="text-surface-500 dark:text-surface-400 text-sm">' + t('text0', 'No actionable signals found.') + '</p>';
          return;
        }
        els.recommendationsList.innerHTML = recommendations.map(rec => {
          const meta = REC_LABELS[rec] || { label: rec, color: '' };
          return '<div class="flex items-center gap-3 p-3 rounded-lg border ' + meta.color + '">' +
            '<span class="text-lg">' + (rec === 'block-for-triage' ? '🚫' : rec === 'add-coverage' ? '📈' : rec === 'dependency-automation' ? '📦' : '♿') + '</span>' +
            '<span class="font-semibold text-sm">' + meta.label + '</span>' +
            '</div>';
        }).join('');
      }

      function updateScore(score) {
        els.scoreBadge.textContent = score;
        els.scoreBar.style.width = score + '%';
        if (score >= 80) {
          els.scoreBar.className = 'h-full rounded-full transition-all duration-500 bg-success-500';
          els.scoreBadge.className = 'text-4xl font-bold text-success-600 dark:text-success-400';
          els.scoreLabel.textContent = t('text1', 'Ready to proceed');
        } else if (score >= 50) {
          els.scoreBar.className = 'h-full rounded-full transition-all duration-500 bg-warning-500';
          els.scoreBadge.className = 'text-4xl font-bold text-warning-600 dark:text-warning-400';
          els.scoreLabel.textContent = t('text2', 'Proceed with caution — address recommendations');
        } else {
          els.scoreBar.className = 'h-full rounded-full transition-all duration-500 bg-danger-500';
          els.scoreBadge.className = 'text-4xl font-bold text-danger-600 dark:text-danger-400';
          els.scoreLabel.textContent = t('text3', 'Blocked — quality gates not met');
        }
      }

      function analyze() {
        const raw = els.signals.value;
        const lines = raw.split(/\n/).map(s => s.trim()).filter(Boolean);
        const result = analyzeQualitySignals(lines);
        const score = calculateReadinessScore(result.recommendations);
        renderRecommendations(result.recommendations);
        updateScore(score);
        els.summaryText.textContent = result.summary;
        els.copy.disabled = result.recommendations.length === 0;
      }

      els.analyzeBtn.addEventListener('click', analyze);

      els.loadSample.addEventListener('click', () => {
        els.signals.value = SAMPLE;
        analyze();
      });

      els.clear.addEventListener('click', () => {
        els.signals.value = '';
        els.recommendationsList.innerHTML = '<p class="text-surface-500 dark:text-surface-400 text-sm">' + t('text0', 'No actionable signals found.') + '</p>';
        els.scoreBadge.textContent = '—';
        els.scoreBar.style.width = '0%';
        els.scoreLabel.textContent = t('text4', 'Enter signals and click Analyze');
        els.summaryText.textContent = t('text5', 'Waiting for input.');
        els.copy.disabled = true;
      });

      els.copy.addEventListener('click', async () => {
        const raw = els.signals.value;
        const lines = raw.split(/\n/).map(s => s.trim()).filter(Boolean);
        const result = analyzeQualitySignals(lines);
        const score = calculateReadinessScore(result.recommendations);
        const report = [
          t('text6', 'Quality Automation Report'),
          t('text7', 'Readiness Score: {score}/100').replace('{score}', score),
          '',
          t('text8', 'Recommendations:'),
          ...result.recommendations.map(r => '- ' + (REC_LABELS[r]?.label || r)),
          '',
          t('text9', 'Summary: {summary}').replace('{summary}', result.summary)
        ].join('\n');
        try {
          await navigator.clipboard.writeText(report);
          const old = els.copy.textContent;
          els.copy.textContent = t('text10', '✓ Copied');
          if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
          setTimeout(() => (els.copy.textContent = old), 1200);
        } catch (e) {
          console.error('Copy failed:', e);
        }
      });
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: '/quality-automation-planner',
    content,
    scripts,
    lang: currentLang
  });
}
