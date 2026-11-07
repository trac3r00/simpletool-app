/**
 * Pipe Mode — chain tools together, all client-side.
 * Your data is processed in your browser, not sent to our servers.
 */

import { respondHTML } from "../utils/respond.js";
import { createPageTemplate, createToolHeader } from "../utils/common-ui.js";
import { DEFAULT_LANGUAGE, resolveRequestLanguage } from "../utils/i18n.js";
import { CASE_CONVERTER_FUNCTIONS } from "../utils/case-converter-logic.js";
import { PIPE_LOGIC_FUNCTIONS } from "../utils/pipe-logic.js";

const INLINE_LOGIC = [...CASE_CONVERTER_FUNCTIONS, ...PIPE_LOGIC_FUNCTIONS]
  .map((fn) => fn.toString())
  .join("\n");

export async function handlePipeRoutes(request, url) {
  const { pathname } = url;

  if (pathname === "/pipe" || pathname === "/pipe/") {
    if (request.method === "GET") {
      return renderPipePage(resolveRequestLanguage(request, url));
    }
  }

  return null;
}

function renderPipePage(lang = DEFAULT_LANGUAGE) {
  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">
      ${createToolHeader(
        { emoji: "⛓️" },
        '<span data-i18n="tools.pipe.ui.r64_0">Pipe Mode</span>',
        "Chain tools together. Your data is processed in your browser, not sent to our servers.",
        [
          {
            text: "Beta",
            i18nKey: "tools.pipe.ui.r64_2",
            tooltip:
              "Pipe Mode is new — pipelines and recipes may still change.",
            tooltipI18nKey: "tools.pipe.ui.r64_3",
          },
        ],
        { subtitleI18nKey: "tools.pipe.ui.r64_1" },
      )}
      <div class="flex flex-wrap justify-end gap-2 -mt-6 mb-3">
        <button id="share-btn" class="btn btn-ghost text-xs" title="Share pipeline (no data included)" data-i18n-title="tools.pipe.ui.r3_2" data-i18n="tools.pipe.ui.r3_5">Share</button>
        <button id="save-btn" class="btn btn-ghost text-xs" title="Save to browser" data-i18n-title="tools.pipe.ui.r3_3" data-i18n="tools.pipe.ui.r3_6">Save</button>
        <button id="clear-btn" class="btn btn-ghost text-xs text-error-600 dark:text-error-400" title="Clear pipeline" data-i18n-title="tools.pipe.ui.r3_4" data-i18n="tools.pipe.ui.r3_7">Clear</button>
      </div>
      <p id="pipe-status" class="text-xs text-right text-surface-600 dark:text-surface-300 mb-3 break-all" role="status" aria-live="polite"></p>

      <div class="flex gap-4" id="pipe-layout">
        <!-- Sidebar: Tool Palette (desktop) -->
        <aside id="tool-palette" class="w-56 shrink-0 hidden lg:block">
          <div class="sticky top-20 tool-group p-3">
            <input data-i18n-aria="tools.pipe.ui.r6_0" type="search" id="palette-search" placeholder="Search tools..." data-i18n-placeholder="tools.pipe.ui.r3_0"
              class="input text-xs mb-3"
              aria-label="Search tools">
            <div id="palette-list" class="space-y-0.5 text-sm max-h-[60vh] overflow-y-auto"></div>
          </div>
        </aside>

        <!-- Main Workspace -->
        <div class="flex-1 min-w-0">
          <!-- Input -->
          <div class="tool-group p-4 mb-0">
            <label for="pipe-input" class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2 block" data-i18n="tools.pipe.ui.r3_11">Input</label>
            <textarea id="pipe-input" rows="3"
              placeholder="Paste your data here, or try a recipe below..." data-i18n-placeholder="tools.pipe.ui.r3_1"
              class="input"
            ></textarea>
          </div>

          <!-- Steps Container -->
          <div id="steps-container" class="relative">
            <!-- Steps are rendered here by JS -->
          </div>

          <!-- Add Step (mobile) -->
          <div class="lg:hidden mt-3">
            <button id="add-step-mobile" class="btn btn-secondary w-full text-sm" data-i18n="tools.pipe.ui.r3_8">+ Add Step</button>
          </div>

          <!-- Final Output -->
          <div id="final-output-container" class="hidden mt-0">
            <div class="border-l-2 border-surface-300 dark:border-surface-600 h-5 ml-6"></div>
            <div class="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg p-4">
              <div class="text-xs font-semibold text-info-700 dark:text-info-300 uppercase tracking-wider mb-2" data-i18n="tools.pipe.ui.r3_12">Final Output</div>
              <pre id="final-output" class="font-mono text-sm text-surface-900 dark:text-surface-100 whitespace-pre-wrap break-all max-h-64 overflow-auto"></pre>
              <div class="flex flex-wrap gap-2 mt-3">
                <button id="copy-output" class="btn btn-info btn-xs" data-i18n="tools.pipe.ui.r3_9">Copy</button>
                <button id="download-output" class="btn btn-secondary btn-xs" data-i18n="tools.pipe.ui.r3_10">Download</button>
              </div>
            </div>
          </div>

          <!-- Recipe Gallery (empty state / inspiration) -->
          <div id="recipe-gallery" class="mt-8">
            <h2 class="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3" data-i18n="tools.pipe.ui.r3_13">Try a recipe</h2>
            <!-- Recipe cards stack on narrow screens and sit in a row from sm up,
               so no card is ever clipped past the viewport. -->
            <div
              class="grid grid-cols-1 sm:grid-cols-3 gap-3"
              id="recipe-list"
              role="region"
              aria-label="Recipe gallery"
              data-i18n-aria="tools.pipe.ui.r64_16"
            ></div>
          </div>
        </div>
      </div>

      <!-- Mobile palette bottom sheet -->
      <div id="mobile-palette" class="fixed inset-0 z-50 hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-palette-title">
        <div class="absolute inset-0 bg-black/40" id="mobile-palette-backdrop"></div>
        <div class="absolute bottom-0 left-0 right-0 bg-popover text-popover-foreground rounded-t-xl p-4 max-h-[70vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-3">
            <h2 id="mobile-palette-title" class="font-semibold text-sm" data-i18n="tools.pipe.ui.r3_14">Add a step</h2>
            <button data-i18n-aria="tools.pipe.ui.r6_1" id="close-mobile-palette" class="btn btn-ghost btn-icon-sm text-lg" aria-label="Close palette">&times;</button>
          </div>
          <input data-i18n-aria="tools.pipe.ui.r6_3" data-i18n-placeholder="tools.pipe.ui.r6_2" type="search" id="mobile-palette-search" placeholder="Search tools..."
            class="input w-full mb-3" aria-label="Search tools">
          <div id="mobile-palette-list" class="space-y-1"></div>
        </div>
      </div>
      </div>
    </main>
  `;

  const script = `
    <script>
      // Inlined from src/utils/case-converter-logic.js and src/utils/pipe-logic.js
      // (tested in their .test.js files).
      ${INLINE_LOGIC}
      // This script runs before the i18n bootstrap defines window._t, so resolve
      // it at call time and fall back to English until it exists.
      const _t = (key, fallback) => (typeof window._t === 'function' ? window._t(key, fallback) : fallback);

      // ── Contract Registry (client-side) ──────────────────────
      // fullTool: the standalone page that does the same job, or null.
      const CONTRACTS = {
        'case-converter': {
          id: 'case-converter', name: 'Text Case Converter', nameKey: 'tools.pipe.ui.r64_4', fullTool: '/case-converter',
          options: [{ id: 'style', type: 'select', values: ['camel','snake','kebab','pascal','upper','lower','constant','dot','title','sentence'], default: 'camel' }],
          transform(input, opts) { return input ? pipeCaseConvert(input, opts.style) : ''; }
        },
        'base64': {
          id: 'base64', name: 'Base64 Encode/Decode', nameKey: 'tools.pipe.ui.r64_5', fullTool: '/encoding-workbench',
          options: [{ id: 'mode', type: 'select', values: ['encode','decode'], default: 'encode' }],
          transform(input, opts) { return input ? (opts.mode === 'decode' ? pipeBase64Decode(input) : pipeBase64Encode(input)) : ''; }
        },
        'url-encode': {
          id: 'url-encode', name: 'URL Encode/Decode', nameKey: 'tools.pipe.ui.r64_6', fullTool: '/encoding-workbench',
          options: [{ id: 'mode', type: 'select', values: ['encode','decode','decode-form'], default: 'encode' }],
          transform(input, opts) {
            if (!input) return '';
            if (opts.mode === 'decode') return pipeUrlDecode(input, false);
            if (opts.mode === 'decode-form') return pipeUrlDecode(input, true);
            return pipeUrlEncode(input);
          }
        },
        'json-format': {
          id: 'json-format', name: 'JSON Format/Minify', nameKey: 'tools.pipe.ui.r64_7', fullTool: '/json-formatter',
          options: [{ id: 'mode', type: 'select', values: ['format','minify'], default: 'format' }],
          transform(input, opts) { return input ? pipeJsonFormat(input, opts.mode) : ''; }
        },
        'line-sort': {
          id: 'line-sort', name: 'Line Sort & Dedupe', nameKey: 'tools.pipe.ui.r64_8', fullTool: null,
          options: [{ id: 'mode', type: 'select', values: ['sort','reverse','dedupe','sort-dedupe'], default: 'sort' }],
          transform(input, opts) { return input ? pipeLineSort(input, opts.mode) : ''; }
        }
      };
      const OPTION_LABELS = { 'decode-form': 'decode (+ as space)', 'reverse': 'reverse sort', 'sort-dedupe': 'sort + dedupe' };

      const CATEGORIES = {
        'Text': ['case-converter', 'line-sort'],
        'Encoding': ['base64', 'url-encode'],
        'Format': ['json-format']
      };

      const CATEGORY_KEYS = { 'Text': 'tools.pipe.ui.r64_9', 'Encoding': 'tools.pipe.ui.r64_10', 'Format': 'tools.pipe.ui.r64_11' };

      const RECIPES = [
        { name: 'Decode JWT payload', nameKey: 'tools.pipe.ui.r64_12', sample: 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9', steps: [{ id: 'base64', options: { mode: 'decode' } }, { id: 'json-format', options: { mode: 'format' } }] },
        { name: 'Sort & dedupe lines', nameKey: 'tools.pipe.ui.r64_13', sample: 'banana\\ncherry\\napple\\nbanana\\napple', steps: [{ id: 'line-sort', options: { mode: 'sort-dedupe' } }] },
        { name: 'Base64 for a URL parameter', nameKey: 'tools.pipe.ui.r64_14', sample: 'hello world & friends=true', steps: [{ id: 'base64', options: { mode: 'encode' } }, { id: 'url-encode', options: { mode: 'encode' } }] },
      ];

      // ── State ──────────────────────────────────────────────
      let pipeSteps = [];
      let debounceTimer = null;
      let seededSample = null;
      const STEP_OUTPUT_CLASS = 'step-output px-3 py-2 font-mono text-xs whitespace-pre-wrap break-all max-h-32 overflow-auto';

      // ── DOM refs ───────────────────────────────────────────
      const inputEl = document.getElementById('pipe-input');
      const stepsEl = document.getElementById('steps-container');
      const finalContainer = document.getElementById('final-output-container');
      const finalOutput = document.getElementById('final-output');
      const paletteList = document.getElementById('palette-list');
      const paletteSearch = document.getElementById('palette-search');
      const mobilePaletteList = document.getElementById('mobile-palette-list');
      const recipeList = document.getElementById('recipe-list');

      // ── Palette ────────────────────────────────────────────
      function renderPalette(container, filter = '') {
        container.innerHTML = '';
        const f = filter.toLowerCase();
        for (const [cat, ids] of Object.entries(CATEGORIES)) {
          const matching = ids.filter(id => {
            const c = CONTRACTS[id];
            return !f || c.name.toLowerCase().includes(f) || id.includes(f);
          });
          if (matching.length === 0) continue;
          const catEl = document.createElement('div');
          catEl.className = 'text-[11px] font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mt-3 mb-1 first:mt-0';
          catEl.textContent = _t(CATEGORY_KEYS[cat], cat);
          catEl.setAttribute('data-i18n', CATEGORY_KEYS[cat]);
          container.appendChild(catEl);
          for (const id of matching) {
            const btn = document.createElement('button');
            btn.className = 'menu-item';
            btn.textContent = _t(CONTRACTS[id].nameKey, CONTRACTS[id].name);
            btn.setAttribute('data-i18n', CONTRACTS[id].nameKey);
            btn.onclick = () => { addStep(id); closeMobilePalette(); };
            container.appendChild(btn);
          }
        }
        if (container.children.length === 0) {
          container.innerHTML = '<div class="text-xs text-surface-500 dark:text-surface-400 py-2">' + _t('tools.pipe.js.r4_9', 'No tools match') + '</div>';
        }
      }

      // ── Steps ──────────────────────────────────────────────
      function addStep(contractId, options = {}) {
        const contract = CONTRACTS[contractId];
        if (!contract) return;
        const defaultOpts = {};
        if (contract.options) {
          for (const opt of contract.options) {
            defaultOpts[opt.id] = opt.default || opt.values?.[0] || '';
          }
        }
        pipeSteps.push({ contractId, options: { ...defaultOpts, ...options } });
        renderSteps();
        runPipe();
      }

      function removeStep(index) {
        pipeSteps.splice(index, 1);
        renderSteps();
        runPipe();
      }

      function moveStep(from, to) {
        if (to < 0 || to >= pipeSteps.length) return;
        const [item] = pipeSteps.splice(from, 1);
        pipeSteps.splice(to, 0, item);
        renderSteps();
        runPipe();
        // Re-rendering replaces the cards, so keep keyboard focus on the moved step.
        const moved = stepsEl.querySelectorAll('.pipe-step')[to];
        if (moved) {
          const preferred = moved.querySelector(to < from ? '.move-up' : '.move-down');
          (preferred && !preferred.disabled ? preferred : moved.querySelector('.remove-step')).focus();
        }
      }

      function renderSteps() {
        stepsEl.innerHTML = '';
        pipeSteps.forEach((step, i) => {
          const contract = CONTRACTS[step.contractId];
          if (!contract) return;

          // Connector line
          const conn = document.createElement('div');
          conn.className = 'border-l-2 border-surface-300 dark:border-surface-600 h-5 ml-6 relative';
          conn.innerHTML = '<div class="absolute -bottom-1 left-[-5px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-surface-300 dark:border-t-surface-600"></div>';
          stepsEl.appendChild(conn);

          // Step card
          const card = document.createElement('div');
          card.className = 'pipe-step border border-border rounded-lg overflow-hidden';
          card.dataset.index = i;

          // Header
          const header = document.createElement('div');
          header.className = 'flex items-center justify-between px-3 py-2 bg-muted/60 border-b border-border';
          header.innerHTML = \`
            <div class="flex items-center gap-2 text-sm">
              <span class="text-xs font-mono text-surface-500 dark:text-surface-400">\${i + 1}.</span>
              <span class="font-medium text-surface-800 dark:text-surface-200">\${contract.name}</span>
              \${contract.fullTool ? '<a href="' + contract.fullTool + '" class="text-[11px] text-info-600 dark:text-info-400 hover:underline">Open full tool</a>' : ''}
            </div>
            <div class="flex items-center gap-1">
              <button class="move-up btn btn-ghost btn-icon-sm text-xs" title="\${_t('tools.pipe.js.r4_0', 'Move up (Alt+Up)')}" aria-label="Move \${contract.name} step up" \${i===0?'disabled':''}>&uarr;</button>
              <button class="move-down btn btn-ghost btn-icon-sm text-xs" title="\${_t('tools.pipe.js.r4_1', 'Move down (Alt+Down)')}" aria-label="Move \${contract.name} step down" \${i===pipeSteps.length-1?'disabled':''}>&darr;</button>
              <button class="remove-step btn btn-ghost btn-icon-sm text-error-600 dark:text-error-400" aria-label="Remove \${contract.name} step">&times;</button>
            </div>
          \`;

          // Options (if any)
          let optionsHtml = '';
          if (contract.options && contract.options.length > 0) {
            optionsHtml = '<div class="px-3 py-2 border-b border-border flex gap-3 flex-wrap">';
            for (const opt of contract.options) {
              if (opt.type === 'select' && opt.values) {
                optionsHtml += \`<label class="text-xs text-surface-500 dark:text-surface-400"><span class="mr-1">\${opt.id}:</span>
                  <select class="input opt-select text-xs px-1 py-0.5 w-auto" data-opt="\${opt.id}">
                    \${opt.values.map(v => \`<option value="\${v}" \${step.options[opt.id]===v?'selected':''}>\${OPTION_LABELS[v] || v}</option>\`).join('')}
                  </select></label>\`;
              }
            }
            optionsHtml += '</div>';
          }

          // Output area
          const outputDiv = document.createElement('div');
          outputDiv.className = STEP_OUTPUT_CLASS + ' text-surface-500 dark:text-surface-400';
          outputDiv.setAttribute('aria-live', 'polite');
          outputDiv.textContent = _t('tools.pipe.js.r4_2', 'Waiting...');

          card.appendChild(header);
          if (optionsHtml) { const d = document.createElement('div'); d.innerHTML = optionsHtml; card.appendChild(d.firstElementChild); }
          card.appendChild(outputDiv);
          stepsEl.appendChild(card);

          // Event listeners
          card.querySelector('.remove-step').onclick = () => removeStep(i);
          card.querySelector('.move-up').onclick = () => moveStep(i, i - 1);
          card.querySelector('.move-down').onclick = () => moveStep(i, i + 1);
          card.querySelectorAll('.opt-select').forEach(sel => {
            sel.onchange = () => {
              pipeSteps[i].options[sel.dataset.opt] = sel.value;
              runPipe();
            };
          });
        });
      }

      // ── Pipeline execution ─────────────────────────────────
      function runPipe() {
        const input = inputEl.value;
        let current = input;
        let failed = false;

        const cards = stepsEl.querySelectorAll('.pipe-step');
        pipeSteps.forEach((step, i) => {
          const card = cards[i];
          if (!card) return;
          const outputEl = card.querySelector('.step-output');
          const contract = CONTRACTS[step.contractId];

          if (failed) {
            card.className = 'pipe-step border border-border rounded-lg overflow-hidden opacity-50';
            outputEl.textContent = _t('tools.pipe.js.r4_3', 'Skipped');
            return;
          }

          try {
            const result = contract.transform(current, step.options);
            card.className = 'pipe-step border border-border rounded-lg overflow-hidden';
            outputEl.className = STEP_OUTPUT_CLASS + ' text-surface-500 dark:text-surface-400';
            outputEl.textContent = result || '(empty)';
            current = result;
          } catch (err) {
            card.className = 'pipe-step border border-error-300 dark:border-error-800 rounded-lg overflow-hidden bg-error-50 dark:bg-error-900/20';
            outputEl.className = STEP_OUTPUT_CLASS + ' text-error-600 dark:text-error-400';
            outputEl.textContent = (_t('tools.pipe.js.r4_4', 'Error in step') + ' ') + (i + 1) + ': ' + (err.message || err);
            failed = true;
          }
        });

        const copyBtn = document.getElementById('copy-output');
        const downloadBtn = document.getElementById('download-output');
        if (pipeSteps.length > 0 && !failed) {
          finalContainer.classList.remove('hidden');
          finalOutput.textContent = current;
          copyBtn.disabled = downloadBtn.disabled = false;
        } else if (pipeSteps.length === 0) {
          finalContainer.classList.add('hidden');
        } else {
          finalContainer.classList.remove('hidden');
          finalOutput.textContent = '(no output: fix the step marked in red above)';
          copyBtn.disabled = downloadBtn.disabled = true;
        }
      }

      let statusTimer = null;
      function setStatus(msg) {
        const el = document.getElementById('pipe-status');
        el.textContent = msg;
        clearTimeout(statusTimer);
        statusTimer = setTimeout(() => { el.textContent = ''; }, 6000);
      }

      // ── Debounced input ────────────────────────────────────
      inputEl.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(runPipe, 300);
      });

      // ── Recipes ────────────────────────────────────────────
      function renderRecipes() {
        recipeList.innerHTML = '';
        RECIPES.forEach(recipe => {
          const card = document.createElement('button');
          card.className = 'tool-card tool-card-link p-4 text-left min-w-0';
          card.innerHTML = \`
            <div class="font-medium text-sm text-surface-800 dark:text-surface-200 mb-1" data-i18n="\${recipe.nameKey}">\${_t(recipe.nameKey, recipe.name)}</div>
            <div class="text-xs text-surface-500 dark:text-surface-400">\${recipe.steps.map(s => CONTRACTS[s.id] ? '<span data-i18n="' + CONTRACTS[s.id].nameKey + '">' + _t(CONTRACTS[s.id].nameKey, CONTRACTS[s.id].name) + '</span>' : s.id).join(' → ')}</div>
            <div class="text-xs text-info-700 dark:text-info-300 mt-2" data-i18n="tools.pipe.ui.r64_15">\${_t('tools.pipe.js.r4_10', 'Try it →')}</div>
          \`;
          card.onclick = () => {
            pipeSteps = recipe.steps.map(s => ({ contractId: s.id, options: { ...s.options } }));
            // Seed the sample input only when the box is empty or still holds
            // another recipe's sample, so trying a recipe never clobbers real data.
            if ((!inputEl.value.trim() || inputEl.value === seededSample) && recipe.sample) {
              inputEl.value = recipe.sample;
              seededSample = recipe.sample;
            }
            renderSteps();
            runPipe();
            document.getElementById('recipe-gallery').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          };
          recipeList.appendChild(card);
        });
      }

      // ── Share / Save / Clear ───────────────────────────────
      document.getElementById('copy-output').onclick = () => {
        navigator.clipboard.writeText(finalOutput.textContent).then(() => {
          const btn = document.getElementById('copy-output');
          btn.textContent = _t('tools.pipe.js.r4_5', 'Copied!');
          setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
        }, () => setStatus('Copy failed: the browser blocked clipboard access. Select the output and copy it manually.'));
      };

      document.getElementById('share-btn').onclick = () => {
        if (pipeSteps.length === 0) { setStatus('Add at least one step before sharing.'); return; }
        const data = pipeSteps.map(s => ({ id: s.contractId, o: s.options }));
        const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
        const url = location.origin + '/pipe#' + encoded;
        navigator.clipboard.writeText(url).then(() => {
          const btn = document.getElementById('share-btn');
          btn.textContent = _t('tools.pipe.js.r4_6', 'Link copied!');
          setStatus('Share link copied. It contains the steps only, not your input.');
          setTimeout(() => { btn.textContent = 'Share'; }, 2000);
        }, () => setStatus('Clipboard blocked. Share link: ' + url));
      };

      document.getElementById('save-btn').onclick = () => {
        if (pipeSteps.length === 0) { setStatus('Add at least one step before saving.'); return; }
        try {
          localStorage.setItem('pipe-workflow', JSON.stringify(pipeSteps));
        } catch (e) {
          setStatus('Could not save: browser storage is unavailable.');
          return;
        }
        const btn = document.getElementById('save-btn');
        btn.textContent = _t('tools.pipe.js.r4_7', 'Saved!');
        setStatus('Pipeline saved in this browser. It reloads automatically next time.');
        setTimeout(() => { btn.textContent = 'Save'; }, 1500);
      };

      document.getElementById('clear-btn').onclick = () => {
        pipeSteps = [];
        inputEl.value = '';
        seededSample = null;
        try { localStorage.removeItem('pipe-workflow'); } catch (e) {}
        if (location.hash) history.replaceState(null, '', location.pathname + location.search);
        renderSteps();
        runPipe();
        setStatus('Pipeline cleared.');
      };

      document.getElementById('download-output').onclick = () => {
        const blob = new Blob([finalOutput.textContent], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'pipe-output.txt';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      };

      // ── Mobile palette ─────────────────────────────────────
      const mobilePalette = document.getElementById('mobile-palette');
      const addStepMobile = document.getElementById('add-step-mobile');
      const mobileSearch = document.getElementById('mobile-palette-search');
      addStepMobile.addEventListener('click', () => {
        mobilePalette.classList.remove('hidden');
        mobileSearch.value = '';
        renderPalette(mobilePaletteList);
        mobileSearch.focus();
      });
      document.getElementById('close-mobile-palette').addEventListener('click', closeMobilePalette);
      document.getElementById('mobile-palette-backdrop').addEventListener('click', closeMobilePalette);
      function closeMobilePalette() {
        if (mobilePalette.classList.contains('hidden')) return;
        mobilePalette.classList.add('hidden');
        if (getComputedStyle(addStepMobile.parentElement).display !== 'none') addStepMobile.focus();
      }
      // Escape closes the sheet; Tab stays inside it while it is open.
      mobilePalette.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); closeMobilePalette(); return; }
        if (e.key !== 'Tab') return;
        const items = Array.from(mobilePalette.querySelectorAll('button, input')).filter(el => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });

      document.getElementById('mobile-palette-search')?.addEventListener('input', (e) => {
        renderPalette(mobilePaletteList, e.target.value);
      });

      // ── Keyboard shortcuts ─────────────────────────────────
      document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 'ArrowUp') {
          const focused = document.activeElement?.closest('.pipe-step');
          if (focused) { const i = parseInt(focused.dataset.index); moveStep(i, i-1); e.preventDefault(); }
        }
        if (e.altKey && e.key === 'ArrowDown') {
          const focused = document.activeElement?.closest('.pipe-step');
          if (focused) { const i = parseInt(focused.dataset.index); moveStep(i, i+1); e.preventDefault(); }
        }
      });

      // ── Restore from URL hash or localStorage ──────────────
      function restore() {
        const hash = location.hash.slice(1);
        if (hash) {
          try {
            const data = pipeSanitizeSteps(JSON.parse(decodeURIComponent(atob(hash))), CONTRACTS);
            if (data.length) {
              pipeSteps = data;
              // Show shared pipeline banner
              const banner = document.createElement('div');
              banner.className = 'bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg px-4 py-3 mb-4 text-sm text-info-800 dark:text-info-200';
              banner.textContent = _t('tools.pipe.js.r4_8', 'Someone shared this pipeline with you. Paste your data above to run it.');
              inputEl.parentElement.parentElement.insertBefore(banner, inputEl.parentElement);
              renderSteps();
              runPipe();
              return;
            }
          } catch {}
          setStatus('This share link is not a valid pipeline, so it was ignored.');
        }
        let saved = null;
        try { saved = localStorage.getItem('pipe-workflow'); } catch (e) {}
        if (saved) {
          try {
            const data = pipeSanitizeSteps(JSON.parse(saved), CONTRACTS);
            if (data.length > 0) {
              pipeSteps = data;
              renderSteps();
              runPipe();
            }
          } catch {}
        }
      }

      // ── Init ───────────────────────────────────────────────
      renderPalette(paletteList);
      paletteSearch.addEventListener('input', (e) => renderPalette(paletteList, e.target.value));
      renderRecipes();
      restore();
    </script>
  `;

  return respondHTML(
    createPageTemplate({
      title: "Pipe Mode — Chain Tools Together",
      description:
        "Chain multiple tools into a pipeline. Your data is processed in your browser, not sent to our servers.",
      content: content + script,
      path: "/pipe",
      lang,
    }),
  );
}
