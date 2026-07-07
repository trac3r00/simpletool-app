/**
 * Review Description Generator Tool
 *
 * Generate structured review/PR comment descriptions from commit data,
 * diff summaries, or free-form notes.  All processing is client-side.
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleReviewDescriptionGeneratorRoutes(request, url) {
  const { pathname } = url;
  if (pathname === '/review-description-generator' || pathname === '/review-description-generator/') {
    if (request.method === 'GET') {
      return respondHTML(renderReviewDescriptionGeneratorPage(resolveRequestLanguage(request, url)));
    }
    return new Response('Method not allowed', { status: 405 });
  }
  return null;
}

function renderReviewDescriptionGeneratorPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('review-description-generator', currentLang);
  const toolHeader = createToolHeader(
    { emoji: '📝' },
    translation?.name || 'Review Description Generator',
    translation?.desc || 'Generate structured PR review and comment descriptions from commits, diffs, or notes.',
    [
      { text: translation?.ui?.badge0 || 'Client-Side Only', color: 'green' },
      { text: translation?.ui?.badge1 || '6 Templates', color: 'indigo' }
    ],
    { toolId: 'review-description-generator' }
  );

  const currentTool = TOOLS.find(t => t.id === 'review-description-generator');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}

        <!-- Template selector -->
        <div class="mb-6">
          <label class="label" for="template-select">
            <span data-i18n="tools.review-description-generator.ui.label0">Review Template</span>
          </label>
          <select id="template-select" class="input">
            <option value="dependency" data-i18n="tools.review-description-generator.ui.option0">Dependency Bump</option>
            <option value="bugfix" data-i18n="tools.review-description-generator.ui.option1">Bug Fix</option>
            <option value="feature" data-i18n="tools.review-description-generator.ui.option2">Feature Addition</option>
            <option value="refactor" data-i18n="tools.review-description-generator.ui.option3">Refactor / Cleanup</option>
            <option value="ci" data-i18n="tools.review-description-generator.ui.option4">CI / Pipeline Change</option>
            <option value="custom" data-i18n="tools.review-description-generator.ui.option5">Custom</option>
          </select>
        </div>

        <!-- Dynamic form -->
        <div id="form-container" class="space-y-4 mb-6">
          <!-- populated by JS -->
        </div>

        <!-- Action buttons -->
        <div class="flex flex-wrap gap-3 mb-6">
          <button id="generate-btn" class="btn btn-primary">
            <span class="material-symbols-rounded text-sm">auto_awesome</span>
            <span data-i18n="tools.review-description-generator.ui.button0">Generate</span>
          </button>
          <button id="copy-btn" class="btn btn-secondary hidden">
            <span class="material-symbols-rounded text-sm">content_copy</span>
            <span data-i18n="tools.review-description-generator.ui.button1">Copy</span>
          </button>
          <button id="clear-btn" class="btn btn-ghost">
            <span class="material-symbols-rounded text-sm">delete</span>
            <span data-i18n="tools.review-description-generator.ui.button2">Clear</span>
          </button>
        </div>

        <!-- Output -->
        <div id="output-section" class="hidden">
          <label class="label">
            <span data-i18n="tools.review-description-generator.ui.label1">Generated Description</span>
          </label>
          <div id="output-preview" class="input-mono min-h-[200px] whitespace-pre-wrap p-4 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 text-sm"></div>
        </div>

        <!-- Info -->
        <div class="mt-8 p-6 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
          <h3 class="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-3">
            <span data-i18n="tools.review-description-generator.ui.heading0">How It Works</span>
          </h3>
          <ul class="space-y-2 text-sm text-surface-600 dark:text-surface-400">
            <li data-i18n="tools.review-description-generator.ui.text0">Choose a template that matches your review type (dependency bump, bug fix, feature, etc.).</li>
            <li data-i18n="tools.review-description-generator.ui.text1">Fill in the context fields — the tool provides sensible defaults and guidance for each template.</li>
            <li data-i18n="tools.review-description-generator.ui.text2">Click Generate to produce a structured, markdown-formatted description ready for your PR or review comment.</li>
            <li data-i18n="tools.review-description-generator.ui.text3">All processing is local — nothing leaves your browser.</li>
          </ul>
        </div>
      </div>

      ${createRelatedToolsSection(relatedToolsData, currentLang)}
    </main>

    <script>
    (function() {
      'use strict';

      /* ── Template definitions ──────────────────────────── */
      const TEMPLATES = {
        dependency: {
          fields: [
            { id: 'pkg-name',      label: 'Package Name',         placeholder: 'e.g. actions/checkout, js-yaml' },
            { id: 'old-version',   label: 'Previous Version',     placeholder: 'e.g. 6.0.3' },
            { id: 'new-version',   label: 'New Version',          placeholder: 'e.g. 7.0.0' },
            { id: 'change-type',   label: 'Change Scope',         placeholder: 'major / minor / patch',
              type: 'select', options: ['major','minor','patch'] },
            { id: 'changelog-url', label: 'Changelog / Release URL', placeholder: 'https://github.com/…/releases/tag/v7.0.0' },
            { id: 'breaking',     label: 'Breaking Changes',      placeholder: 'List any breaking changes or leave empty', type: 'textarea' },
            { id: 'notes',        label: 'Additional Notes',      placeholder: 'CI impact, migration steps, etc.', type: 'textarea' }
          ],
          generate(f) {
            const scope = f['change-type'] || 'unknown';
            const breaking = f.breaking ? '\\n\\n### Breaking Changes\\n' + f.breaking : '';
            const changelog = f['changelog-url'] ? '\\n\\nChangelog: ' + f['changelog-url'] : '';
            const notes = f.notes ? '\\n\\n### Notes\\n' + f.notes : '';
            return '## Dependency Bump: ' + (f['pkg-name'] || 'package') +
              '\\n\\n| Field | Value |\\n|---|---|' +
              '\\n| Package | ' + (f['pkg-name'] || '—') + ' |' +
              '\\n| From | ' + (f['old-version'] || '—') + ' |' +
              '\\n| To | ' + (f['new-version'] || '—') + ' |' +
              '\\n| Scope | **' + scope + '** |' +
              changelog + breaking + notes +
              '\\n\\n---\\n_Generated by Review Description Generator_';
          }
        },
        bugfix: {
          fields: [
            { id: 'issue-ref',    label: 'Issue Reference',       placeholder: '#123 or URL' },
            { id: 'symptom',      label: 'Observed Symptom',      placeholder: 'What the user sees', type: 'textarea' },
            { id: 'root-cause',   label: 'Root Cause',            placeholder: 'Why it happens', type: 'textarea' },
            { id: 'fix-summary',  label: 'Fix Summary',           placeholder: 'What this change does', type: 'textarea' },
            { id: 'files-changed',label: 'Files Changed',         placeholder: 'src/foo.js, src/bar.js' },
            { id: 'test-plan',    label: 'Test / Verification',   placeholder: 'How to verify the fix', type: 'textarea' },
            { id: 'risk',         label: 'Risk & Rollback',       placeholder: 'Low / Medium / High — rollback plan' }
          ],
          generate(f) {
            const issue = f['issue-ref'] ? ' (Closes ' + f['issue-ref'] + ')' : '';
            return '## Bug Fix' + issue +
              '\\n\\n### Symptom\\n' + (f.symptom || '—') +
              '\\n\\n### Root Cause\\n' + (f['root-cause'] || '—') +
              '\\n\\n### Fix\\n' + (f['fix-summary'] || '—') +
              (f['files-changed'] ? '\\n\\n**Files:** ' + f['files-changed'] : '') +
              '\\n\\n### Verification\\n' + (f['test-plan'] || '—') +
              '\\n\\n### Risk\\n' + (f.risk || '—') +
              '\\n\\n---\\n_Generated by Review Description Generator_';
          }
        },
        feature: {
          fields: [
            { id: 'feature-name', label: 'Feature Name',          placeholder: 'Short title' },
            { id: 'motivation',   label: 'Motivation / Why',      placeholder: 'Why is this needed?', type: 'textarea' },
            { id: 'what-changed', label: 'What Changed',          placeholder: 'Bullet list of changes', type: 'textarea' },
            { id: 'files-changed',label: 'Files Changed',         placeholder: 'src/foo.js, src/bar.js' },
            { id: 'test-plan',    label: 'Test / Verification',   placeholder: 'How to verify', type: 'textarea' },
            { id: 'risk',         label: 'Risk & Rollback',       placeholder: 'Low / Medium / High — rollback plan' }
          ],
          generate(f) {
            return '## Feature: ' + (f['feature-name'] || 'Untitled') +
              '\\n\\n### Motivation\\n' + (f.motivation || '—') +
              '\\n\\n### What Changed\\n' + (f['what-changed'] || '—') +
              (f['files-changed'] ? '\\n\\n**Files:** ' + f['files-changed'] : '') +
              '\\n\\n### Verification\\n' + (f['test-plan'] || '—') +
              '\\n\\n### Risk\\n' + (f.risk || '—') +
              '\\n\\n---\\n_Generated by Review Description Generator_';
          }
        },
        refactor: {
          fields: [
            { id: 'scope',        label: 'Refactor Scope',        placeholder: 'Module or area affected' },
            { id: 'motivation',   label: 'Why',                   placeholder: 'Why refactor now?', type: 'textarea' },
            { id: 'approach',     label: 'Approach',              placeholder: 'What changed structurally', type: 'textarea' },
            { id: 'files-changed',label: 'Files Changed',         placeholder: 'src/foo.js, src/bar.js' },
            { id: 'behavior',     label: 'Behavior Change',       placeholder: 'None (should be none for a pure refactor)' },
            { id: 'test-plan',    label: 'Test / Verification',   placeholder: 'Existing tests still pass, etc.', type: 'textarea' }
          ],
          generate(f) {
            return '## Refactor: ' + (f.scope || 'Untitled') +
              '\\n\\n### Motivation\\n' + (f.motivation || '—') +
              '\\n\\n### Approach\\n' + (f.approach || '—') +
              (f['files-changed'] ? '\\n\\n**Files:** ' + f['files-changed'] : '') +
              '\\n\\n### Behavior Change\\n' + (f.behavior || 'None') +
              '\\n\\n### Verification\\n' + (f['test-plan'] || '—') +
              '\\n\\n---\\n_Generated by Review Description Generator_';
          }
        },
        ci: {
          fields: [
            { id: 'pipeline',     label: 'Pipeline / Workflow',   placeholder: '.github/workflows/ci.yml' },
            { id: 'motivation',   label: 'Why',                   placeholder: 'What triggered this change?', type: 'textarea' },
            { id: 'what-changed', label: 'What Changed',          placeholder: 'Steps added/removed/updated', type: 'textarea' },
            { id: 'impact',       label: 'Impact',                placeholder: 'Build time, permissions, caching, etc.' },
            { id: 'test-plan',    label: 'Verification',          placeholder: 'CI run link or local test output', type: 'textarea' }
          ],
          generate(f) {
            return '## CI Change: ' + (f.pipeline || 'pipeline') +
              '\\n\\n### Motivation\\n' + (f.motivation || '—') +
              '\\n\\n### What Changed\\n' + (f['what-changed'] || '—') +
              '\\n\\n### Impact\\n' + (f.impact || '—') +
              '\\n\\n### Verification\\n' + (f['test-plan'] || '—') +
              '\\n\\n---\\n_Generated by Review Description Generator_';
          }
        },
        custom: {
          fields: [
            { id: 'title',        label: 'Title',                 placeholder: 'Short summary' },
            { id: 'body',         label: 'Description',           placeholder: 'Full description in Markdown', type: 'textarea', rows: 10 }
          ],
          generate(f) {
            return '## ' + (f.title || 'Review Comment') +
              '\\n\\n' + (f.body || '') +
              '\\n\\n---\\n_Generated by Review Description Generator_';
          }
        }
      };

      /* ── DOM refs ──────────────────────────────────────── */
      const templateSelect = document.getElementById('template-select');
      const formContainer  = document.getElementById('form-container');
      const generateBtn    = document.getElementById('generate-btn');
      const copyBtn        = document.getElementById('copy-btn');
      const clearBtn       = document.getElementById('clear-btn');
      const outputSection  = document.getElementById('output-section');
      const outputPreview  = document.getElementById('output-preview');

      /* ── Render form for chosen template ───────────────── */
      function renderForm(templateId) {
        const tpl = TEMPLATES[templateId];
        if (!tpl) return;
        formContainer.innerHTML = '';
        tpl.fields.forEach(function(field) {
          var wrapper = document.createElement('div');
          var label = document.createElement('label');
          label.className = 'label';
          label.setAttribute('for', 'field-' + field.id);
          label.textContent = field.label;
          wrapper.appendChild(label);

          var input;
          if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = field.rows || 3;
            input.className = 'input resize-y';
          } else if (field.type === 'select') {
            input = document.createElement('select');
            input.className = 'input';
            (field.options || []).forEach(function(opt) {
              var o = document.createElement('option');
              o.value = opt;
              o.textContent = opt;
              input.appendChild(o);
            });
          } else {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'input';
          }
          input.id = 'field-' + field.id;
          input.placeholder = field.placeholder || '';
          wrapper.appendChild(input);
          formContainer.appendChild(wrapper);
        });
      }

      /* ── Collect field values ──────────────────────────── */
      function collectFields() {
        var tpl = TEMPLATES[templateSelect.value];
        if (!tpl) return {};
        var result = {};
        tpl.fields.forEach(function(field) {
          var el = document.getElementById('field-' + field.id);
          result[field.id] = el ? el.value : '';
        });
        return result;
      }

      /* ── Generate ─────────────────────────────────────── */
      function generate() {
        var tpl = TEMPLATES[templateSelect.value];
        if (!tpl) return;
        var fields = collectFields();
        var output = tpl.generate(fields);
        outputPreview.textContent = output;
        outputSection.classList.remove('hidden');
        copyBtn.classList.remove('hidden');
      }

      /* ── Copy ──────────────────────────────────────────── */
      function copyOutput() {
        var text = outputPreview.textContent;
        if (!text) return;
        navigator.clipboard.writeText(text).then(function() {
          var original = copyBtn.querySelector('span:last-child');
          if (original) {
            var prev = original.textContent;
            original.textContent = 'Copied!';
            setTimeout(function() { original.textContent = prev; }, 1500);
          }
        });
      }

      /* ── Clear ─────────────────────────────────────────── */
      function clearAll() {
        renderForm(templateSelect.value);
        outputSection.classList.add('hidden');
        copyBtn.classList.add('hidden');
        outputPreview.textContent = '';
      }

      /* ── Bind events ───────────────────────────────────── */
      templateSelect.addEventListener('change', function() { renderForm(templateSelect.value); });
      generateBtn.addEventListener('click', generate);
      copyBtn.addEventListener('click', copyOutput);
      clearBtn.addEventListener('click', clearAll);

      /* ── Init ──────────────────────────────────────────── */
      renderForm(templateSelect.value);
    })();
    </script>
  `;

  return createPageTemplate({
    title: translation?.name || 'Review Description Generator',
    description: translation?.desc || 'Generate structured PR review and comment descriptions from commits, diffs, or notes.',
    content,
    path: '/review-description-generator'
  });
}
