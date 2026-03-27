/**
 * Pipe Mode — chain tools together, all client-side.
 * Your data never leaves your browser.
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate } from '../utils/common-ui.js';
import { DEFAULT_LANGUAGE, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handlePipeRoutes(request, url) {
  const { pathname } = url;

  if (pathname === '/pipe' || pathname === '/pipe/') {
    if (request.method === 'GET') {
      return renderPipePage(resolveRequestLanguage(request, url));
    }
  }

  return null;
}

function renderPipePage(lang = DEFAULT_LANGUAGE) {
  const content = `
    <main class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50 flex items-center gap-3">
            <span class="text-teal-600 dark:text-teal-400">⛓</span>
            Pipe Mode
            <span class="text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 px-2 py-0.5 rounded-full">BETA</span>
          </h1>
          <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">Chain tools together. Your data never leaves your browser.</p>
        </div>
        <div class="flex gap-2">
          <button id="share-btn" class="btn btn-ghost text-xs" title="Share pipeline (no data included)">Share</button>
          <button id="save-btn" class="btn btn-ghost text-xs" title="Save to browser">Save</button>
          <button id="clear-btn" class="btn btn-ghost text-xs text-red-500" title="Clear pipeline">Clear</button>
        </div>
      </div>

      <div class="flex gap-4" id="pipe-layout">
        <!-- Sidebar: Tool Palette (desktop) -->
        <aside id="tool-palette" class="w-56 shrink-0 hidden lg:block">
          <div class="sticky top-20 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg p-3">
            <input type="text" id="palette-search" placeholder="Search tools..."
              class="w-full px-2 py-1.5 text-xs border border-surface-200 dark:border-surface-700 rounded bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 mb-3"
              role="search" aria-label="Search tools">
            <div id="palette-list" class="space-y-0.5 text-sm max-h-[60vh] overflow-y-auto"></div>
          </div>
        </aside>

        <!-- Main Workspace -->
        <div class="flex-1 min-w-0">
          <!-- Input -->
          <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg p-4 mb-0">
            <label class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2 block">Input</label>
            <textarea id="pipe-input" rows="3"
              placeholder="Paste your data here, or try a recipe below..."
              class="w-full px-3 py-2 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 font-mono text-sm resize-y"
            ></textarea>
          </div>

          <!-- Steps Container -->
          <div id="steps-container" class="relative">
            <!-- Steps are rendered here by JS -->
          </div>

          <!-- Add Step (mobile) -->
          <div class="lg:hidden mt-3">
            <button id="add-step-mobile" class="btn btn-secondary w-full text-sm">+ Add Step</button>
          </div>

          <!-- Final Output -->
          <div id="final-output-container" class="hidden mt-0">
            <div class="border-l-2 border-surface-300 dark:border-surface-600 h-5 ml-6"></div>
            <div class="bg-teal-50 dark:bg-teal-900/20 border border-teal-300 dark:border-teal-700 rounded-lg p-4">
              <div class="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wider mb-2">Final Output</div>
              <pre id="final-output" class="font-mono text-sm text-surface-900 dark:text-surface-100 whitespace-pre-wrap break-all max-h-64 overflow-auto"></pre>
              <div class="flex gap-2 mt-3">
                <button id="copy-output" class="btn btn-teal text-xs px-3 py-1">Copy</button>
                <button id="download-output" class="btn btn-secondary text-xs px-3 py-1">Download</button>
              </div>
            </div>
          </div>

          <!-- Recipe Gallery (empty state / inspiration) -->
          <div id="recipe-gallery" class="mt-8">
            <h2 class="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3">Try a recipe</h2>
            <div class="flex gap-3 overflow-x-auto pb-2" id="recipe-list"></div>
          </div>
        </div>
      </div>

      <!-- Mobile palette bottom sheet -->
      <div id="mobile-palette" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-black/40" id="mobile-palette-backdrop"></div>
        <div class="absolute bottom-0 left-0 right-0 bg-white dark:bg-surface-900 rounded-t-xl p-4 max-h-[70vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-3">
            <span class="font-semibold text-sm">Add a step</span>
            <button id="close-mobile-palette" class="text-surface-400 hover:text-surface-600 text-lg">&times;</button>
          </div>
          <input type="text" id="mobile-palette-search" placeholder="Search tools..."
            class="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800 mb-3">
          <div id="mobile-palette-list" class="space-y-1"></div>
        </div>
      </div>
    </main>
  `;

  const script = `
    <script>
      // ── Contract Registry (client-side) ──────────────────────
      const CONTRACTS = {
        'case-converter': {
          id: 'case-converter', name: 'Text Case Converter', inputTypes: ['text'], outputTypes: ['text'],
          options: [{ id: 'style', type: 'select', values: ['camel','snake','kebab','pascal','upper','lower','constant','dot','title','sentence'], default: 'camel' }],
          transform(input, opts = {}) {
            if (!input) return '';
            const s = opts.style || 'camel', t = String(input);
            const words = () => t.toLowerCase().replace(/[^a-zA-Z0-9\\s]/g, '').split(/\\s+/).filter(Boolean);
            switch (s) {
              case 'upper': return t.toUpperCase();
              case 'lower': return t.toLowerCase();
              case 'title': return t.replace(/\\w\\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
              case 'sentence': return t.toLowerCase().replace(/(^\\w|[.!?]\\s+\\w)/g, c => c.toUpperCase());
              case 'camel': { const w = words(); return w.map((x,i) => i===0 ? x : x.charAt(0).toUpperCase()+x.slice(1)).join(''); }
              case 'pascal': return words().map(x => x.charAt(0).toUpperCase()+x.slice(1)).join('');
              case 'snake': return t.toLowerCase().replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_|_$/g,'');
              case 'kebab': return t.toLowerCase().replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'');
              case 'constant': return t.toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
              case 'dot': return t.toLowerCase().replace(/[^a-zA-Z0-9]+/g,'.').replace(/^\\.|\\.\$/g,'');
              default: return t;
            }
          }
        },
        'base64': {
          id: 'base64', name: 'Base64 Encode/Decode', inputTypes: ['text'], outputTypes: ['text'],
          options: [{ id: 'mode', type: 'select', values: ['encode','decode'], default: 'encode' }],
          transform(input, opts = {}) {
            if (!input) return '';
            const m = opts.mode || 'encode', t = String(input);
            if (m === 'decode') { try { return decodeURIComponent(atob(t).split('').map(c=>'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')); } catch { return '[Error: invalid Base64]'; } }
            try { return btoa(encodeURIComponent(t).replace(/%([0-9A-F]{2})/g,(_,p)=>String.fromCharCode(parseInt(p,16)))); } catch { return '[Error: cannot encode]'; }
          }
        },
        'url-encode': {
          id: 'url-encode', name: 'URL Encode/Decode', inputTypes: ['text'], outputTypes: ['text'],
          options: [{ id: 'mode', type: 'select', values: ['encode','decode'], default: 'encode' }],
          transform(input, opts = {}) {
            if (!input) return '';
            const t = String(input);
            if ((opts.mode||'encode') === 'decode') { try { return decodeURIComponent(t); } catch { return '[Error: invalid URL encoding]'; } }
            return encodeURIComponent(t);
          }
        },
        'json-format': {
          id: 'json-format', name: 'JSON Format/Minify', inputTypes: ['text','json'], outputTypes: ['text','json'],
          options: [{ id: 'mode', type: 'select', values: ['format','minify'], default: 'format' }],
          transform(input, opts = {}) {
            if (!input) return '';
            try { const p = JSON.parse(String(input).trim()); return (opts.mode||'format') === 'minify' ? JSON.stringify(p) : JSON.stringify(p, null, 2); }
            catch (e) { return '[Error: ' + e.message + ']'; }
          }
        },
        'line-sort': {
          id: 'line-sort', name: 'Line Sort & Dedupe', inputTypes: ['text'], outputTypes: ['text'],
          options: [{ id: 'mode', type: 'select', values: ['sort','reverse','dedupe','sort-dedupe'], default: 'sort' }],
          transform(input, opts = {}) {
            if (!input) return '';
            const lines = String(input).split('\\n'), m = opts.mode || 'sort';
            if (m === 'reverse') return lines.sort().reverse().join('\\n');
            if (m === 'dedupe') { const s = new Set(); return lines.filter(l => { if (s.has(l)) return false; s.add(l); return true; }).join('\\n'); }
            if (m === 'sort-dedupe') return [...new Set(lines)].sort().join('\\n');
            return lines.sort().join('\\n');
          }
        }
      };

      const CATEGORIES = {
        'Text': ['case-converter', 'line-sort'],
        'Encoding': ['base64', 'url-encode'],
        'Format': ['json-format']
      };

      const RECIPES = [
        { name: 'Decode JWT payload', steps: [{ id: 'base64', options: { mode: 'decode' } }, { id: 'json-format', options: { mode: 'format' } }] },
        { name: 'Sort & dedupe lines', steps: [{ id: 'line-sort', options: { mode: 'sort-dedupe' } }] },
        { name: 'Encode for URL', steps: [{ id: 'base64', options: { mode: 'encode' } }, { id: 'url-encode', options: { mode: 'encode' } }] },
      ];

      // ── State ──────────────────────────────────────────────
      let pipeSteps = [];
      let debounceTimer = null;

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
          catEl.className = 'text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider mt-3 mb-1 first:mt-0';
          catEl.textContent = cat;
          container.appendChild(catEl);
          for (const id of matching) {
            const btn = document.createElement('button');
            btn.className = 'block w-full text-left px-2 py-1.5 rounded text-sm text-surface-700 dark:text-surface-300 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-900/30 dark:hover:text-teal-300 transition-colors';
            btn.textContent = CONTRACTS[id].name;
            btn.onclick = () => { addStep(id); closeMobilePalette(); };
            container.appendChild(btn);
          }
        }
        if (container.children.length === 0) {
          container.innerHTML = '<div class="text-xs text-surface-400 py-2">No tools match</div>';
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
          card.className = 'pipe-step border border-surface-200 dark:border-surface-800 rounded-lg overflow-hidden';
          card.dataset.index = i;

          // Header
          const header = document.createElement('div');
          header.className = 'flex items-center justify-between px-3 py-2 bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700';
          header.innerHTML = \`
            <div class="flex items-center gap-2 text-sm">
              <span class="cursor-grab text-surface-400 select-none" title="Drag to reorder">⋮⋮</span>
              <span class="font-medium text-surface-800 dark:text-surface-200">\${contract.name}</span>
              <a href="\${contract.id === 'line-sort' ? '#' : '/'+contract.id}" class="text-[11px] text-teal-600 dark:text-teal-400 hover:underline">\${contract.id === 'line-sort' ? '' : 'Open full tool'}</a>
            </div>
            <div class="flex items-center gap-1">
              <button class="move-up text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 text-xs px-1" title="Move up (Alt+Up)" \${i===0?'disabled':''}>&uarr;</button>
              <button class="move-down text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 text-xs px-1" title="Move down (Alt+Down)" \${i===pipeSteps.length-1?'disabled':''}>&darr;</button>
              <button class="remove-step text-red-400 hover:text-red-600 text-xs px-1" aria-label="Remove \${contract.name} step">&times;</button>
            </div>
          \`;

          // Options (if any)
          let optionsHtml = '';
          if (contract.options && contract.options.length > 0) {
            optionsHtml = '<div class="px-3 py-2 border-b border-surface-100 dark:border-surface-700 flex gap-3 flex-wrap">';
            for (const opt of contract.options) {
              if (opt.type === 'select' && opt.values) {
                optionsHtml += \`<label class="text-xs text-surface-500"><span class="mr-1">\${opt.id}:</span>
                  <select class="opt-select text-xs border border-surface-200 dark:border-surface-700 rounded px-1 py-0.5 bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-200" data-opt="\${opt.id}">
                    \${opt.values.map(v => \`<option value="\${v}" \${step.options[opt.id]===v?'selected':''}>\${v}</option>\`).join('')}
                  </select></label>\`;
              }
            }
            optionsHtml += '</div>';
          }

          // Output area
          const outputDiv = document.createElement('div');
          outputDiv.className = 'step-output px-3 py-2 font-mono text-xs text-surface-500 dark:text-surface-400 whitespace-pre-wrap break-all max-h-32 overflow-auto';
          outputDiv.setAttribute('aria-live', 'polite');
          outputDiv.textContent = 'Waiting...';

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
            card.className = 'pipe-step border border-surface-200 dark:border-surface-800 rounded-lg overflow-hidden opacity-50';
            outputEl.textContent = 'Skipped';
            return;
          }

          try {
            const result = contract.transform(current, step.options);
            card.className = 'pipe-step border border-surface-200 dark:border-surface-800 rounded-lg overflow-hidden';
            outputEl.textContent = result || '(empty)';
            current = result;
          } catch (err) {
            card.className = 'pipe-step border border-red-300 dark:border-red-800 rounded-lg overflow-hidden bg-red-50 dark:bg-red-900/20';
            outputEl.textContent = 'Error: ' + (err.message || err);
            outputEl.className = outputEl.className.replace('text-surface-500', 'text-red-600').replace('text-surface-400', 'text-red-400');
            failed = true;
          }
        });

        if (pipeSteps.length > 0 && !failed) {
          finalContainer.classList.remove('hidden');
          finalOutput.textContent = current;
        } else if (pipeSteps.length === 0) {
          finalContainer.classList.add('hidden');
        } else {
          finalContainer.classList.remove('hidden');
          finalOutput.textContent = '(pipeline has errors)';
        }
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
          card.className = 'shrink-0 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-4 py-3 text-left hover:border-teal-400 transition-colors min-w-[200px]';
          card.innerHTML = \`
            <div class="font-medium text-sm text-surface-800 dark:text-surface-200 mb-1">\${recipe.name}</div>
            <div class="text-xs text-surface-400">\${recipe.steps.map(s => CONTRACTS[s.id]?.name || s.id).join(' → ')}</div>
            <div class="text-xs text-teal-600 dark:text-teal-400 mt-2">Try it →</div>
          \`;
          card.onclick = () => {
            pipeSteps = recipe.steps.map(s => ({ contractId: s.id, options: { ...s.options } }));
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
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
        });
      };

      document.getElementById('share-btn').onclick = () => {
        if (pipeSteps.length === 0) return;
        const data = pipeSteps.map(s => ({ id: s.contractId, o: s.options }));
        const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
        if (encoded.length > 1500) {
          navigator.clipboard.writeText(JSON.stringify(data, null, 2));
          if (window.Toast) window.Toast.info('Pipeline too long for URL. Config copied to clipboard as JSON.');
          return;
        }
        const url = location.origin + '/pipe#' + encoded;
        navigator.clipboard.writeText(url).then(() => {
          const btn = document.getElementById('share-btn');
          btn.textContent = 'Link copied!';
          setTimeout(() => { btn.textContent = 'Share'; }, 2000);
        });
      };

      document.getElementById('save-btn').onclick = () => {
        if (pipeSteps.length === 0) return;
        localStorage.setItem('pipe-workflow', JSON.stringify(pipeSteps));
        const btn = document.getElementById('save-btn');
        btn.textContent = 'Saved!';
        setTimeout(() => { btn.textContent = 'Save'; }, 1500);
      };

      document.getElementById('clear-btn').onclick = () => {
        pipeSteps = [];
        inputEl.value = '';
        renderSteps();
        finalContainer.classList.add('hidden');
      };

      document.getElementById('download-output').onclick = () => {
        const blob = new Blob([finalOutput.textContent], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'pipe-output.txt';
        a.click();
        URL.revokeObjectURL(a.href);
      };

      // ── Mobile palette ─────────────────────────────────────
      const mobilePalette = document.getElementById('mobile-palette');
      document.getElementById('add-step-mobile')?.addEventListener('click', () => {
        mobilePalette.classList.remove('hidden');
        renderPalette(mobilePaletteList);
      });
      document.getElementById('close-mobile-palette')?.addEventListener('click', closeMobilePalette);
      document.getElementById('mobile-palette-backdrop')?.addEventListener('click', closeMobilePalette);
      function closeMobilePalette() { mobilePalette.classList.add('hidden'); }

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
            const data = JSON.parse(decodeURIComponent(atob(hash)));
            if (Array.isArray(data)) {
              pipeSteps = data.map(s => ({ contractId: s.id, options: s.o || {} }));
              // Show shared pipeline banner
              const banner = document.createElement('div');
              banner.className = 'bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-lg px-4 py-3 mb-4 text-sm text-teal-800 dark:text-teal-200';
              banner.textContent = 'Someone shared this pipeline with you. Paste your data above to run it.';
              inputEl.parentElement.parentElement.insertBefore(banner, inputEl.parentElement);
              renderSteps();
              return;
            }
          } catch {}
        }
        const saved = localStorage.getItem('pipe-workflow');
        if (saved) {
          try {
            const data = JSON.parse(saved);
            if (Array.isArray(data) && data.length > 0) {
              pipeSteps = data;
              renderSteps();
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
    createPageTemplate('Pipe Mode — SimpleTool', content + script, { canonicalPath: '/pipe' })
  );
}
