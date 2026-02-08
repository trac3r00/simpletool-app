/**
 * Ladder Game (Ghost Leg / Amidakuji)
 * Fully client-side Canvas tool.
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';

function renderLadderGamePage() {
  const toolHeader = createToolHeader(
    { emoji: '🪜' },
    'Ladder Game',
    'Classic ghost leg ladder game for random matching and decision making.',
    [{ text: '<span data-i18n="tools.ladder-game.ui.badge0">Client-Side Only</span>' }],
    { toolId: 'ladder-game' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}

        <section aria-label="Ladder game" class="space-y-4">
          <div class="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-5">
            <div class="flex-1 min-w-0">
              <p class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.ladder-game.ui.text0">Choose a player count, set names, then press Start to generate a random ladder.</p>
            </div>
            <div class="flex flex-wrap items-end gap-2">
               <div class="flex items-end gap-2">
                 <label for="player-count" class="label"><span data-i18n="tools.ladder-game.ui.label0">Player count</span></label>
                 <div class="flex items-center gap-1">
                   <button id="remove-player" type="button" class="btn btn-ghost px-3" aria-label="Remove player" data-i18n-aria="tools.ladder-game.ui.button3">−</button>
                   <select id="player-count" class="input w-20" aria-label="Player count">
                     <option value="2">2</option>
                     <option value="3">3</option>
                     <option value="4" selected>4</option>
                     <option value="5">5</option>
                     <option value="6">6</option>
                     <option value="7">7</option>
                     <option value="8">8</option>
                     <option value="9">9</option>
                     <option value="10">10</option>
                   </select>
                   <button id="add-player" type="button" class="btn btn-ghost px-3" aria-label="Add player" data-i18n-aria="tools.ladder-game.ui.button4">+</button>
                </div>
              </div>

               <div class="flex items-end gap-2">
                 <label for="map-size" class="label"><span data-i18n="tools.ladder-game.ui.label3">Map size</span></label>
                 <select id="map-size" class="input w-36" aria-label="Map size">
                   <option value="compact" data-i18n="tools.ladder-game.ui.option0">Compact</option>
                   <option value="standard" selected data-i18n="tools.ladder-game.ui.option1">Standard</option>
                   <option value="large" data-i18n="tools.ladder-game.ui.option2">Large</option>
                 </select>
               </div>

               <div class="flex items-center gap-2">
                 <label class="inline-flex items-center gap-2 text-sm text-surface-700 dark:text-surface-200 select-none">
                   <input id="spoiler-guard" type="checkbox" class="rounded border-surface-300 text-primary-600 focus:ring-primary-500">
                   <span data-i18n="tools.ladder-game.ui.label4">Spoiler guard</span>
                 </label>

                 <button id="generate" type="button" class="btn btn-primary" data-i18n="tools.ladder-game.ui.button0">Start</button>
                <button id="reveal-all" type="button" class="btn btn-secondary" data-i18n="tools.ladder-game.ui.button1">Reveal All</button>
                <button id="reset" type="button" class="btn btn-ghost" data-i18n="tools.ladder-game.ui.button2">Reset</button>
              </div>
            </div>
          </div>

          <div class="border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 overflow-hidden">
            <div id="ladder-scroll" class="overflow-x-auto">
              <div id="ladder-stage" class="p-3 sm:p-4" style="width: 760px;">
                <div class="grid gap-3" style="grid-template-rows: auto auto auto;">
                  <div id="players-row" class="flex gap-2" aria-label="Players"></div>

                  <div id="ladder-canvas-wrap" class="relative rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/40 overflow-hidden">
                    <canvas id="ladder-canvas" class="block w-full" aria-label="Ladder canvas"></canvas>
                    <div id="ladder-spoiler" class="hidden absolute inset-0 z-40">
                      <div id="ladder-spoiler-grid" class="absolute inset-0 grid" style="grid-template-columns: repeat(10, minmax(0, 1fr)); grid-template-rows: repeat(8, minmax(0, 1fr));"></div>
                      <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(circle at 50% 20%, rgba(0,0,0,0.35), rgba(0,0,0,0.55));"></div>
                    </div>
                  </div>

                  <div id="results-row" class="flex gap-2" aria-label="Results"></div>
                </div>
              </div>
            </div>

            <div class="px-4 sm:px-6 py-3 border-t border-surface-200 dark:border-surface-800">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div id="status" role="status" aria-live="polite" class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.ladder-game.ui.status0">Ready.</div>
                <div class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.ladder-game.ui.text2">Tip: Generate a new ladder anytime to reshuffle the outcomes.</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  `;

  const script = `
    <script src="/vendor/game-utils.min.js"></script>
    <script>
      (function() {
        const { clamp, cryptoUint32, randInt, randFloat, ensureAudioCtx: _ensureAudioCtx, playBeep: _playBeep } = window.GameUtils;

        const COLOR_PALETTE = [
          '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
          '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
        ];

        const MIN_PLAYERS = 2;
        const MAX_PLAYERS = 10;
        const DEFAULT_PLAYERS = 4;

        const elCount = document.getElementById('player-count');
         const elAdd = document.getElementById('add-player');
         const elRemove = document.getElementById('remove-player');
         const elGenerate = document.getElementById('generate');
         const elRevealAll = document.getElementById('reveal-all');
         const elReset = document.getElementById('reset');
         const elMapSize = document.getElementById('map-size');
         const elSpoilerGuard = document.getElementById('spoiler-guard');
         const elPlayersRow = document.getElementById('players-row');
         const elResultsRow = document.getElementById('results-row');
         const elStage = document.getElementById('ladder-stage');
         const elScroll = document.getElementById('ladder-scroll');
         const elStatus = document.getElementById('status');
         const elCanvasWrap = document.getElementById('ladder-canvas-wrap');
         const elSpoiler = document.getElementById('ladder-spoiler');
         const elSpoilerGrid = document.getElementById('ladder-spoiler-grid');
         const canvas = document.getElementById('ladder-canvas');
         const ctx = canvas.getContext('2d');

        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function setStatus(text, type) {
          elStatus.removeAttribute('data-i18n');
          elStatus.textContent = text;
          elStatus.classList.remove('text-primary-700', 'dark:text-primary-300');
          if (type === 'highlight') {
            elStatus.classList.add('text-primary-700', 'dark:text-primary-300');
          }
        }

        function defaultPlayerName(i) {
          return window._t('tools.ladder-game.js.text0', 'Player') + ' ' + (i + 1);
        }

        function defaultResultName(i) {
          const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const suffix = letters[i] ? letters[i] : String(i + 1);
          return window._t('tools.ladder-game.js.text1', 'Result') + ' ' + suffix;
        }

          const state = {
            count: DEFAULT_PLAYERS,
            mapSize: 'standard',
            started: false,
            spoilerEnabled: false,
            players: new Array(MAX_PLAYERS).fill('').map((_, i) => defaultPlayerName(i)),
            results: new Array(MAX_PLAYERS).fill('').map((_, i) => defaultResultName(i)),
            ladder: null,
            geom: null,
            computedPaths: [],
           traces: [],
           rafId: null,
           resizeObs: null
         };

        function buildRowsIfNeeded() {
          if (elPlayersRow.childElementCount === MAX_PLAYERS) return;

          elPlayersRow.innerHTML = '';
          elResultsRow.innerHTML = '';

          for (let i = 0; i < MAX_PLAYERS; i++) {
            const colWrap = document.createElement('div');
            colWrap.className = 'min-w-0';
            colWrap.dataset.col = String(i);

            const revealBtn = document.createElement('button');
            revealBtn.type = 'button';
            revealBtn.className = 'btn btn-ghost w-full justify-center px-3 py-2 text-sm whitespace-nowrap overflow-hidden text-ellipsis';
            revealBtn.dataset.playerReveal = String(i);
            revealBtn.setAttribute('aria-label', window._t('tools.ladder-game.js.text2', 'Reveal one') + ': ' + state.players[i]);
            revealBtn.textContent = state.players[i];

            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'player-name-' + i;
            input.className = 'input mt-2';
            input.value = state.players[i];
            input.setAttribute('data-i18n-placeholder', 'tools.ladder-game.ui.placeholder0');
            input.placeholder = 'Player name';
            input.setAttribute('aria-label', window._t('tools.ladder-game.js.text3', 'Player name'));

            colWrap.appendChild(revealBtn);
            colWrap.appendChild(input);
            elPlayersRow.appendChild(colWrap);

            const rWrap = document.createElement('div');
            rWrap.className = 'min-w-0';
            rWrap.dataset.col = String(i);
            rWrap.dataset.resultWrap = '1';

            const rInput = document.createElement('input');
            rInput.type = 'text';
            rInput.id = 'result-text-' + i;
            rInput.className = 'input';
            rInput.value = state.results[i];
            rInput.setAttribute('data-i18n-placeholder', 'tools.ladder-game.ui.placeholder1');
            rInput.placeholder = 'Result text';
            rInput.setAttribute('aria-label', window._t('tools.ladder-game.js.text4', 'Result text'));

            rWrap.appendChild(rInput);
            elResultsRow.appendChild(rWrap);
          }

          // Ensure i18n applies to dynamically added placeholders.
          try {
            if (window.setLanguage && window._i18nGetLang) window.setLanguage(window._i18nGetLang());
           } catch (e) {}

           updateControlsEnabled();
        }

        function getPlayerControls() {
          const btns = Array.from(elPlayersRow.querySelectorAll('[data-player-reveal]'));
          const inputs = Array.from(elPlayersRow.querySelectorAll('input[id^="player-name-"]'));
          const rInputs = Array.from(elResultsRow.querySelectorAll('input[id^="result-text-"]'));
          const rWraps = Array.from(elResultsRow.querySelectorAll('[data-result-wrap]'));
          return { btns, inputs, rInputs, rWraps };
        }

        function updateVisibilityAndLayout() {
          const { btns, inputs, rInputs, rWraps } = getPlayerControls();
          const count = state.count;

          for (let i = 0; i < MAX_PLAYERS; i++) {
            const visible = i < count;
            const pCol = btns[i].parentElement;
            const rCol = rInputs[i].parentElement;
            if (visible) {
              pCol.classList.remove('hidden');
              rCol.classList.remove('hidden');
              btns[i].disabled = !state.started;
              inputs[i].disabled = false;
              rInputs[i].disabled = false;
            } else {
              pCol.classList.add('hidden');
              rCol.classList.add('hidden');
              btns[i].disabled = true;
              inputs[i].disabled = true;
              rInputs[i].disabled = true;
            }
          }

          // Compute stage width and per-column width (tighter, Naver-like).
          const scrollWidth = Math.max(0, elScroll.clientWidth);
          const gap = 8; // Tailwind gap-2
          const minColW = 108;
          const idealColW = 136;
          const maxColW = 210;
          const availableForCols = scrollWidth ? (scrollWidth - 32) : (idealColW * count);
          const approxColW = availableForCols > 0 ? ((availableForCols - gap * (count - 1)) / count) : idealColW;
          const colW = clamp(Math.round(approxColW), minColW, maxColW);
          const stageW = Math.max(260, (colW * count) + gap * (count - 1));
          elStage.style.width = stageW + 'px';

          // Apply column widths.
          for (let i = 0; i < count; i++) {
            btns[i].parentElement.style.width = colW + 'px';
            rInputs[i].parentElement.style.width = colW + 'px';
          }

          // Canvas size is bound to stage width.
          resizeCanvasAndRecompute();
        }

        function dismissSpoiler() {
          if (!elSpoiler) return;
          elSpoiler.classList.add('hidden');
          if (elSpoilerGrid) elSpoilerGrid.innerHTML = '';
        }

        function getSpoilerGridDims() {
          if (state.mapSize === 'large') return { cols: 12, rows: 10 };
          if (state.mapSize === 'compact') return { cols: 8, rows: 6 };
          return { cols: 10, rows: 8 };
        }

        function buildSpoilerTiles() {
          if (!elSpoiler || !elSpoilerGrid) return;
          if (!state.started || !state.spoilerEnabled) {
            dismissSpoiler();
            return;
          }

          const dims = getSpoilerGridDims();
          elSpoilerGrid.style.gridTemplateColumns = 'repeat(' + String(dims.cols) + ', minmax(0, 1fr))';
          elSpoilerGrid.style.gridTemplateRows = 'repeat(' + String(dims.rows) + ', minmax(0, 1fr))';
          elSpoilerGrid.innerHTML = '';

          const total = dims.cols * dims.rows;
          for (let i = 0; i < total; i++) {
            const t = document.createElement('button');
            t.type = 'button';
            t.className = 'ladder-spoiler-tile';
            t.setAttribute('aria-label', 'Reveal');
            t.addEventListener('click', () => {
              t.classList.add('ladder-spoiler-tile-off');
              setTimeout(() => {
                t.remove();
                if (!elSpoilerGrid.childElementCount) dismissSpoiler();
              }, 160);
            });
            elSpoilerGrid.appendChild(t);
          }

          elSpoiler.classList.remove('hidden');
        }

        function canStart() {
          const { inputs } = getPlayerControls();
          for (let i = 0; i < state.count; i++) {
            const v = inputs[i] ? String(inputs[i].value || '').trim() : '';
            if (!v) return false;
          }
          return true;
        }

        function updateControlsEnabled() {
          const ok = canStart();
          if (elGenerate) elGenerate.disabled = !ok;
          if (elRevealAll) elRevealAll.disabled = !state.started;
          const { btns } = getPlayerControls();
          for (let i = 0; i < btns.length; i++) {
            if (!btns[i]) continue;
            btns[i].disabled = !state.started;
          }
        }

         function chooseCanvasHeight() {
           const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
           const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

           // Comfortable ladder area on desktop; keep it compact on short screens.
           const sizeMult = state.mapSize === 'large' ? 1.22 : (state.mapSize === 'compact' ? 0.90 : 1.0);
           const base = (vw < 640 ? 560 : 680) * sizeMult;
           return clamp(Math.round(Math.min(base, vh * 0.86)), 480, 980);
         }

        function isDarkMode() {
          return document.documentElement.classList.contains('dark');
        }

        function computeGeometry() {
          const rect = canvas.getBoundingClientRect();
          const w = Math.max(10, Math.round(rect.width));
          const h = Math.max(10, Math.round(rect.height));

          const paddingX = 22;
          const topTextY = 20;
          const bottomTextY = h - 14;
          const yTop = 44;
          const yBottom = h - 44;
          const ladderHeight = Math.max(120, yBottom - yTop);
          const count = state.count;
          const xSpan = Math.max(20, w - paddingX * 2);
          const step = count > 1 ? (xSpan / (count - 1)) : 0;

          const xForCol = (c) => paddingX + step * c;

          return {
            w,
            h,
            paddingX,
            topTextY,
            bottomTextY,
            yTop,
            yBottom,
            ladderHeight,
            xForCol
          };
        }

         function ladderParams() {
           const count = state.count;
           const size = state.mapSize;
 
           // Bigger maps: more rows and slightly denser rung distribution.
           const rowBase = size === 'large' ? 30 : (size === 'compact' ? 16 : 22);
           const rowScale = size === 'large' ? 3 : (size === 'compact' ? 2 : 2);
           const rows = clamp(rowBase + count * rowScale, size === 'large' ? 34 : 18, size === 'large' ? 56 : 40);
 
           const rungMin = size === 'large' ? 5 : (size === 'compact' ? 3 : 4);
           const rungMax = size === 'large' ? 9 : (size === 'compact' ? 5 : 7);
 
           // Try-rate per cell controls overall density.
           const tryP = size === 'large'
             ? (count <= 3 ? 0.30 : 0.24)
             : (count <= 3 ? 0.22 : 0.18);
 
           return { rows, rungMin, rungMax, tryP };
         }

         function generateLadder() {
           const count = state.count;
           const { rows, rungMin: minPerPair, rungMax: maxPerPair, tryP } = ladderParams();
           const rungsByRow = new Array(rows).fill(null).map(() => []);

          // First pass: probabilistic fill with adjacency constraint.
          for (let row = 0; row < rows; row++) {
            let prevPlaced = false;
            for (let col = 0; col < count - 1; col++) {
               const shouldTry = randFloat() < tryP;
               if (!shouldTry) {
                 prevPlaced = false;
                 continue;
               }
              if (prevPlaced) continue;
              // Ensure no rung adjacent on this row.
              if (rungsByRow[row].includes(col - 1) || rungsByRow[row].includes(col + 1)) continue;
              rungsByRow[row].push(col);
              prevPlaced = true;
            }
          }

           // Normalize per-column-pair rung counts.
           const counts = new Array(count - 1).fill(0);
          for (let row = 0; row < rows; row++) {
            for (let i = 0; i < rungsByRow[row].length; i++) {
              counts[rungsByRow[row][i]]++;
            }
          }

          function canPlace(row, col) {
            if (row < 0 || row >= rows) return false;
            if (col < 0 || col >= count - 1) return false;
            if (rungsByRow[row].includes(col)) return false;
            if (rungsByRow[row].includes(col - 1) || rungsByRow[row].includes(col + 1)) return false;
            return true;
          }

          // Add missing rungs.
          for (let col = 0; col < count - 1; col++) {
            let guard = 0;
            while (counts[col] < minPerPair && guard < 500) {
              guard++;
              const row = randInt(rows);
              if (!canPlace(row, col)) continue;
              rungsByRow[row].push(col);
              counts[col]++;
            }
          }

          // Remove extras.
          for (let col = 0; col < count - 1; col++) {
            if (counts[col] <= maxPerPair) continue;
            const positions = [];
            for (let row = 0; row < rows; row++) {
              if (rungsByRow[row].includes(col)) positions.push(row);
            }
            // Randomly remove until within max.
            while (counts[col] > maxPerPair && positions.length) {
              const idx = randInt(positions.length);
              const row = positions.splice(idx, 1)[0];
              const at = rungsByRow[row].indexOf(col);
              if (at >= 0) rungsByRow[row].splice(at, 1);
              counts[col]--;
            }
          }

          // Materialize rungs.
          const rungs = [];
          for (let row = 0; row < rows; row++) {
            rungsByRow[row].sort((a, b) => a - b);
            for (let i = 0; i < rungsByRow[row].length; i++) {
              rungs.push({ row, col: rungsByRow[row][i] });
            }
          }

          state.ladder = { rows, rungsByRow, rungs };
          setStatus(window._t('tools.ladder-game.js.status0', 'Ladder generated.'), 'highlight');
        }

        function computePaths() {
          if (!state.ladder || !state.geom) {
            state.computedPaths = [];
            return;
          }
          const { rows, rungsByRow } = state.ladder;
          const g = state.geom;
          const count = state.count;

          const rowYs = new Array(rows);
          for (let r = 0; r < rows; r++) {
            rowYs[r] = g.yTop + ((r + 1) * g.ladderHeight) / (rows + 1);
          }

          function follow(startCol) {
            let col = startCol;
            const pts = [{ x: g.xForCol(col), y: g.yTop }];
            for (let r = 0; r < rows; r++) {
              const y = rowYs[r];
              const rungCols = rungsByRow[r];
              let delta = 0;

              // If there is a rung starting at our column, cross right.
              if (rungCols.includes(col)) delta = 1;
              // Else if there is a rung starting at col-1, we are on the right side; cross left.
              else if (rungCols.includes(col - 1)) delta = -1;

              if (delta !== 0) {
                pts.push({ x: g.xForCol(col), y });
                col = col + delta;
                pts.push({ x: g.xForCol(col), y });
              }
            }
            pts.push({ x: g.xForCol(col), y: g.yBottom });
            return { points: pts, endCol: col };
          }

          const computed = [];
          for (let i = 0; i < count; i++) {
            const { points, endCol } = follow(i);
            let len = 0;
            for (let p = 1; p < points.length; p++) {
              const dx = points[p].x - points[p - 1].x;
              const dy = points[p].y - points[p - 1].y;
              len += Math.hypot(dx, dy);
            }
            computed.push({ points, endCol, length: len });
          }
          state.computedPaths = computed;
        }

        function resizeCanvasAndRecompute() {
          const stageRect = elStage.getBoundingClientRect();
          const cssW = Math.max(10, Math.round(stageRect.width));
          const cssH = chooseCanvasHeight();
          canvas.style.height = cssH + 'px';
          canvas.style.width = cssW + 'px';

          const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
          canvas.width = Math.round(cssW * dpr);
          canvas.height = Math.round(cssH * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          const prev = state.geom;
          state.geom = computeGeometry();

          // Preserve active trace progress as a ratio on resize.
          const oldPaths = state.computedPaths;
          computePaths();
          if (prev && oldPaths && oldPaths.length && state.traces.length) {
            for (let i = 0; i < state.traces.length; i++) {
              const t = state.traces[i];
              const oldLen = oldPaths[t.playerIndex] ? oldPaths[t.playerIndex].length : null;
              const newLen = state.computedPaths[t.playerIndex] ? state.computedPaths[t.playerIndex].length : null;
              if (oldLen && newLen) {
                const ratio = clamp(t.progress / oldLen, 0, 1);
                t.progress = ratio * newLen;
              }
            }
          }

          draw();
        }

        function clearCelebrations() {
          const wraps = elResultsRow.querySelectorAll('[data-result-wrap]');
          wraps.forEach(w => {
            w.classList.remove('ring-2', 'ring-primary-400', 'dark:ring-primary-600');
            w.removeAttribute('data-celebrate');
          });
        }

        function celebrate(colIndex) {
          clearCelebrations();
          const wrap = elResultsRow.querySelector('[data-col="' + colIndex + '"]');
          if (!wrap) return;
          wrap.classList.add('ring-2', 'ring-primary-400', 'dark:ring-primary-600');
          wrap.setAttribute('data-celebrate', '1');
          setTimeout(() => {
            wrap.removeAttribute('data-celebrate');
          }, 700);
        }

        const audio = { ctx: null };

        function ensureAudioCtx() { return _ensureAudioCtx(audio); }
        function playBeep(freq, durMs, gain) { _playBeep(audio, freq, durMs, gain); }

        function playJunctionPing() {
          playBeep(1200 + randInt(200), 35, 0.10);
        }

        function playTraceTick(progress) {
          const p = clamp(progress, 0, 1);
          playBeep(600 + p * 300, 20, 0.06 + p * 0.04);
        }

        function playCelebration() {
          const notes = [523, 659, 784, 1047, 1319];
          const delays = [0, 70, 140, 250, 380];
          for (let i = 0; i < notes.length; i++) {
            setTimeout(() => playBeep(notes[i], 100, 0.12 - i * 0.01), delays[i]);
          }
        }

        function playImpact() {
          const c = ensureAudioCtx();
          if (!c) return;
          try {
            const t0 = c.currentTime;
            const o = c.createOscillator();
            const g = c.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(120, t0);
            o.frequency.exponentialRampToValueAtTime(35, t0 + 0.12);
            g.gain.setValueAtTime(0.25, t0);
            g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
            o.connect(g);
            g.connect(c.destination);
            o.start(t0);
            o.stop(t0 + 0.25);
          } catch (e) {}
        }

        function screenShake(el) {
          if (prefersReducedMotion) return;
          el.classList.remove('ladder-shake');
          void el.offsetHeight;
          el.classList.add('ladder-shake');
          setTimeout(() => el.classList.remove('ladder-shake'), 520);
        }

        function showCountdown(container, cb) {
          if (prefersReducedMotion) { cb(); return; }
          const nums = [3, 2, 1];
          let idx = 0;
          function next() {
            const old = container.querySelector('.ladder-countdown');
            if (old) old.remove();
            if (idx >= nums.length) { cb(); return; }
            const overlay = document.createElement('div');
            overlay.className = 'ladder-countdown';
            const numEl = document.createElement('div');
            numEl.className = 'ladder-countdown-num';
            numEl.textContent = String(nums[idx]);
            overlay.appendChild(numEl);
            container.appendChild(overlay);
            playBeep(440 + nums[idx] * 200, 100, 0.12);
            idx++;
            setTimeout(next, 700);
          }
          next();
        }

        function confettiBurst(cx, cy) {
          if (prefersReducedMotion) return;
          const g = state.geom;
          if (!g) return;
          const colors = COLOR_PALETTE.slice(0, state.count);
          const particles = [];
          for (let i = 0; i < 120; i++) {
            const a = randFloat() * Math.PI * 2;
            const sp = 2 + randFloat() * 4;
            particles.push({
              x: cx, y: cy,
              vx: Math.cos(a) * sp,
              vy: Math.sin(a) * sp - 2.5,
              rot: randFloat() * Math.PI * 2,
              vr: (randFloat() - 0.5) * 0.3,
              w: 4 + randInt(6),
              h: 7 + randInt(9),
              alpha: 1,
              color: colors[randInt(colors.length)]
            });
          }
          let last = performance.now();
          const endAt = last + 2000;
          function tick(now) {
            const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
            last = now;
            for (let i = particles.length - 1; i >= 0; i--) {
              const p = particles[i];
              p.vy += 8 * dt;
              p.x += p.vx * 60 * dt;
              p.y += p.vy * 60 * dt;
              p.rot += p.vr * 60 * dt;
              p.alpha *= 0.987;
              if (p.alpha < 0.04 || p.y > g.h + 40) particles.splice(i, 1);
            }
            draw();
            ctx.save();
            for (let i = 0; i < particles.length; i++) {
              const p = particles[i];
              ctx.save();
              ctx.translate(p.x, p.y);
              ctx.rotate(p.rot);
              ctx.globalAlpha = p.alpha;
              ctx.fillStyle = p.color;
              ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
              ctx.restore();
            }
            ctx.restore();
            if (now < endAt && particles.length) {
              requestAnimationFrame(tick);
            }
          }
          requestAnimationFrame(tick);
        }

        function drawBackground() {
          const g = state.geom;
          const dark = isDarkMode();
          const grad = ctx.createLinearGradient(0, 0, g.w, g.h);
          if (dark) {
            grad.addColorStop(0, 'rgba(15, 23, 42, 0.55)');
            grad.addColorStop(1, 'rgba(2, 6, 23, 0.55)');
          } else {
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            grad.addColorStop(1, 'rgba(241, 245, 249, 0.9)');
          }
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, g.w, g.h);

          // Subtle dots for depth.
          ctx.save();
          ctx.globalAlpha = dark ? 0.12 : 0.08;
          ctx.fillStyle = dark ? '#94a3b8' : '#64748b';
          const step = 24;
          for (let y = 10; y < g.h; y += step) {
            for (let x = 10; x < g.w; x += step) {
              if (((x + y) / step) % 3 === 0) ctx.fillRect(x, y, 1, 1);
            }
          }
          ctx.restore();
        }

        function drawBaseLadder() {
          const g = state.geom;
          const count = state.count;
          const dark = isDarkMode();

          const line = dark ? 'rgba(148, 163, 184, 0.55)' : 'rgba(30, 41, 59, 0.35)';
          const rung = dark ? 'rgba(226, 232, 240, 0.40)' : 'rgba(51, 65, 85, 0.35)';

          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Player and result labels on canvas.
          ctx.save();
          ctx.font = '12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
          ctx.fillStyle = dark ? 'rgba(226, 232, 240, 0.88)' : 'rgba(15, 23, 42, 0.78)';
          ctx.textAlign = 'center';
          const { btns, rInputs } = getPlayerControls();
          for (let i = 0; i < count; i++) {
            const px = g.xForCol(i);
            const pName = (btns[i] && btns[i].textContent) ? btns[i].textContent.trim() : ('Player ' + (i + 1));
            const rName = (rInputs[i] && rInputs[i].value) ? rInputs[i].value.trim() : ('Result ' + (i + 1));
            ctx.fillText(pName, px, g.topTextY);
            ctx.fillText(rName, px, g.bottomTextY);
          }
          ctx.restore();

          // Vertical rails.
          ctx.save();
          ctx.strokeStyle = line;
          ctx.lineWidth = 2;
          for (let i = 0; i < count; i++) {
            const x = g.xForCol(i);
            ctx.beginPath();
            ctx.moveTo(x, g.yTop);
            ctx.lineTo(x, g.yBottom);
            ctx.stroke();
          }
          ctx.restore();

          // Horizontal rungs.
          if (!state.ladder) return;
          const { rows, rungsByRow } = state.ladder;
          const rowYs = new Array(rows);
          for (let r = 0; r < rows; r++) {
            rowYs[r] = g.yTop + ((r + 1) * g.ladderHeight) / (rows + 1);
          }

          ctx.save();
          ctx.strokeStyle = rung;
          ctx.lineWidth = 3;
          for (let row = 0; row < rows; row++) {
            const y = rowYs[row];
            const cols = rungsByRow[row];
            for (let i = 0; i < cols.length; i++) {
              const c = cols[i];
              const x1 = g.xForCol(c);
              const x2 = g.xForCol(c + 1);
              ctx.beginPath();
              ctx.moveTo(x1, y);
              ctx.lineTo(x2, y);
              ctx.stroke();
            }
          }
          ctx.restore();
        }

        function drawTracePartial(points, dist) {
          if (!points || points.length < 2) return;
          let remaining = dist;
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            const a = points[i - 1];
            const b = points[i];
            const segLen = Math.hypot(b.x - a.x, b.y - a.y);
            if (remaining >= segLen) {
              ctx.lineTo(b.x, b.y);
              remaining -= segLen;
              continue;
            }
            if (remaining <= 0) break;
            const t = remaining / segLen;
            ctx.lineTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
            remaining = 0;
            break;
          }
          ctx.stroke();
        }

        function drawTraces() {
          const dark = isDarkMode();
          for (let i = 0; i < state.traces.length; i++) {
            const t = state.traces[i];
            const path = state.computedPaths[t.playerIndex];
            if (!path) continue;
            const points = path.points;
            const color = t.color;
            const glow = dark ? 16 : 12;

            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 0.95;
            ctx.shadowBlur = glow;
            ctx.shadowColor = color;
            drawTracePartial(points, t.progress);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            ctx.lineWidth = 3.5;
            drawTracePartial(points, t.progress);
            ctx.restore();

            if (!t.done && t.progress > 0) {
              const pos = getPositionAtDist(points, t.progress);
              ctx.save();
              ctx.beginPath();
              ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
              ctx.fillStyle = color;
              ctx.shadowBlur = 18;
              ctx.shadowColor = color;
              ctx.fill();
              ctx.beginPath();
              ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
              ctx.fillStyle = 'white';
              ctx.shadowBlur = 0;
              ctx.fill();
              ctx.restore();
            }
          }
        }

        function draw() {
          if (!state.geom) return;
          ctx.clearRect(0, 0, state.geom.w, state.geom.h);
          drawBackground();
          drawBaseLadder();
          drawTraces();
        }

        function stopAnimationLoop() {
          if (state.rafId) {
            cancelAnimationFrame(state.rafId);
            state.rafId = null;
          }
        }

        function getPositionAtDist(points, dist) {
          let remaining = dist;
          for (let i = 1; i < points.length; i++) {
            const a = points[i - 1];
            const b = points[i];
            const segLen = Math.hypot(b.x - a.x, b.y - a.y);
            if (remaining <= segLen) {
              const t = segLen > 0 ? remaining / segLen : 0;
              return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
            }
            remaining -= segLen;
          }
          const last = points[points.length - 1];
          return { x: last.x, y: last.y };
        }

        function isAtJunction(points, dist) {
          let remaining = dist;
          for (let i = 1; i < points.length; i++) {
            const a = points[i - 1];
            const b = points[i];
            const segLen = Math.hypot(b.x - a.x, b.y - a.y);
            if (remaining <= segLen) {
              return remaining < 3 && i > 1 && Math.abs(a.x - points[i - 2].x) > 2;
            }
            remaining -= segLen;
          }
          return false;
        }

        function startAnimationLoop() {
          if (state.rafId) return;
          let last = performance.now();
          const baseSpeed = prefersReducedMotion ? 1500 : 160;

          function tick(now) {
            const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
            last = now;

            let anyActive = false;
            for (let i = 0; i < state.traces.length; i++) {
              const t = state.traces[i];
              const path = state.computedPaths[t.playerIndex];
              if (!path) continue;
              if (t.done) continue;
              anyActive = true;
              const ratio = path.length > 0 ? t.progress / path.length : 0;
              const speedMult = ratio > 0.85 ? 0.6 : 1.0;
              const junctionSlow = isAtJunction(path.points, t.progress) ? 0.5 : 1.0;
              const effSpeed = baseSpeed * speedMult * junctionSlow;
              const prevProg = t.progress;
              t.progress += effSpeed * dt;

              if (!prefersReducedMotion && path.length > 0) {
                const prevRatio = prevProg / path.length;
                const curRatio = t.progress / path.length;
                const tickInterval = 0.04;
                if (Math.floor(curRatio / tickInterval) > Math.floor(prevRatio / tickInterval)) {
                  playTraceTick(curRatio);
                }
                if (isAtJunction(path.points, t.progress) && !isAtJunction(path.points, prevProg)) {
                  playJunctionPing();
                }
              }

              if (t.progress >= path.length) {
                t.progress = path.length;
                t.done = true;
                const pName = state.players[t.playerIndex] || ('Player ' + (t.playerIndex + 1));
                const endCol = path.endCol;
                const rText = state.results[endCol] || ('Result ' + (endCol + 1));

                if (!prefersReducedMotion) {
                  playImpact();
                  screenShake(canvas.parentElement);
                  const endPos = getPositionAtDist(path.points, path.length);
                  confettiBurst(endPos.x, endPos.y);
                  playCelebration();
                }

                celebrate(endCol);
                setStatus(window._t('tools.ladder-game.js.status2', 'Complete:') + ' ' + pName + ' \\u2192 ' + rText, 'highlight');
              }
            }

            draw();

            if (anyActive) {
              state.rafId = requestAnimationFrame(tick);
            } else {
              stopAnimationLoop();
            }
          }

          state.rafId = requestAnimationFrame(tick);
        }

        function resetTraces() {
          stopAnimationLoop();
          state.traces = [];
          clearCelebrations();
          draw();
          setStatus(window._t('tools.ladder-game.js.status3', 'Reset.'), null);
        }

        function resetToSetup() {
          resetTraces();
          state.started = false;
          state.ladder = null;
          state.computedPaths = [];
          dismissSpoiler();
          updateVisibilityAndLayout();
          updateControlsEnabled();
          draw();
          setStatus(window._t('tools.ladder-game.js.status5', 'Set names, then press Start.'), null);
        }

        function revealOne(playerIndex) {
          if (!state.computedPaths[playerIndex]) return;
          dismissSpoiler();
          resetTraces();
          const container = canvas.parentElement;
          showCountdown(container, function() {
            const cd = container.querySelector('.ladder-countdown');
            if (cd) cd.remove();
            const color = COLOR_PALETTE[playerIndex % COLOR_PALETTE.length];
            state.traces = [{ playerIndex, color, progress: 0, done: false }];
            setStatus(window._t('tools.ladder-game.js.status1', 'Tracing...'), 'highlight');
            startAnimationLoop();
          });
        }

        function revealAll() {
          if (!state.started) return;
          dismissSpoiler();
          resetTraces();
          const container = canvas.parentElement;
          showCountdown(container, function() {
            const cd = container.querySelector('.ladder-countdown');
            if (cd) cd.remove();
            const traces = [];
            for (let i = 0; i < state.count; i++) {
              traces.push({
                playerIndex: i,
                color: COLOR_PALETTE[i % COLOR_PALETTE.length],
                progress: 0,
                done: false
              });
            }
            state.traces = traces;
            setStatus(window._t('tools.ladder-game.js.status1', 'Tracing...'), 'highlight');
            startAnimationLoop();
          });
        }

        function syncNamesFromInputs() {
          const { btns, inputs, rInputs } = getPlayerControls();
          for (let i = 0; i < state.count; i++) {
            const name = inputs[i].value.trim() || defaultPlayerName(i);
            state.players[i] = name;
            btns[i].textContent = name;
            btns[i].setAttribute('aria-label', window._t('tools.ladder-game.js.text2', 'Reveal one') + ': ' + name);

            const r = rInputs[i].value.trim() || defaultResultName(i);
            state.results[i] = r;
          }
          draw();
        }

        function setCount(next) {
          const n = clamp(next | 0, MIN_PLAYERS, MAX_PLAYERS);
          if (n === state.count) return;
          state.count = n;
          elCount.value = String(n);
          resetToSetup();
          updateVisibilityAndLayout();
          syncNamesFromInputs();
          updateControlsEnabled();
        }

        function init() {
          buildRowsIfNeeded();

           // Set initial values.
           elCount.value = String(DEFAULT_PLAYERS);
           elMapSize.value = state.mapSize;
           setCount(DEFAULT_PLAYERS);

          const { btns, inputs, rInputs } = getPlayerControls();
          for (let i = 0; i < MAX_PLAYERS; i++) {
            inputs[i].value = (i < DEFAULT_PLAYERS) ? ('Player ' + (i + 1)) : defaultPlayerName(i);
            rInputs[i].value = (i < DEFAULT_PLAYERS)
              ? ('Result ' + String.fromCharCode(65 + i))
              : defaultResultName(i);
          }

          // Sync translated prefixes if non-en language is active.
          try {
            const lang = window._i18nGetLang ? window._i18nGetLang() : 'en';
            if (lang !== 'en') {
              for (let i = 0; i < MAX_PLAYERS; i++) {
                if (inputs[i].value === ('Player ' + (i + 1))) inputs[i].value = defaultPlayerName(i);
                const expectedA = 'Result ' + String.fromCharCode(65 + i);
                if (rInputs[i].value === expectedA) rInputs[i].value = defaultResultName(i);
              }
            }
          } catch (e) {}

          // Setup mode: straight rails only until Start.
          state.started = false;
          state.ladder = null;
          state.computedPaths = [];
          dismissSpoiler();
          updateVisibilityAndLayout();
          syncNamesFromInputs();
          draw();
          setStatus(window._t('tools.ladder-game.js.status5', 'Set names, then press Start.'), null);

          // Inputs update names in real time.
          elPlayersRow.addEventListener('input', (e) => {
            const input = e.target && e.target.matches && e.target.matches('input');
            if (!input) return;
            syncNamesFromInputs();
            updateControlsEnabled();
          });
          elResultsRow.addEventListener('input', (e) => {
            const input = e.target && e.target.matches && e.target.matches('input');
            if (!input) return;
            syncNamesFromInputs();
          });

          // Click player name button to reveal one.
          elPlayersRow.addEventListener('click', (e) => {
            const btn = e.target && e.target.closest ? e.target.closest('[data-player-reveal]') : null;
            if (!btn) return;
            if (!state.started) return;
            const idx = parseInt(btn.getAttribute('data-player-reveal'), 10);
            if (!Number.isFinite(idx) || idx < 0 || idx >= state.count) return;
            revealOne(idx);
          });

          // Control buttons.
          elGenerate.addEventListener('click', () => {
            if (!canStart()) {
              setStatus(window._t('tools.ladder-game.js.status6', 'Enter all player names first.'), null);
              return;
            }
            dismissSpoiler();
            resetTraces();
            syncNamesFromInputs();
            generateLadder();
            computePaths();
            state.started = true;
            updateVisibilityAndLayout();
            buildSpoilerTiles();
            updateControlsEnabled();
            draw();
          });
          elRevealAll.addEventListener('click', () => revealAll());
          elReset.addEventListener('click', () => resetToSetup());

          elAdd.addEventListener('click', () => setCount(state.count + 1));
          elRemove.addEventListener('click', () => setCount(state.count - 1));

          elCount.addEventListener('change', () => {
            const n = parseInt(elCount.value, 10);
            if (!Number.isFinite(n)) {
              setStatus(window._t('tools.ladder-game.js.status4', 'Player count must be between 2 and 10.'), null);
              elCount.value = String(state.count);
              return;
            }
            setCount(n);
          });

           elMapSize.addEventListener('change', () => {
             const v = String(elMapSize.value || '').toLowerCase();
             state.mapSize = (v === 'compact' || v === 'large') ? v : 'standard';
             resetToSetup();
           });

          if (elSpoilerGuard) {
            elSpoilerGuard.checked = false;
            state.spoilerEnabled = false;
            elSpoilerGuard.addEventListener('change', () => {
              state.spoilerEnabled = !!elSpoilerGuard.checked;
              if (state.started && state.spoilerEnabled) buildSpoilerTiles();
              else dismissSpoiler();
            });
          }

          if (elCanvasWrap) {
            elCanvasWrap.addEventListener('pointerdown', () => {
              dismissSpoiler();
            }, { passive: true });
          }

          updateControlsEnabled();

          // Responsive resizing.
          state.resizeObs = new ResizeObserver(() => {
            updateVisibilityAndLayout();
          });
          state.resizeObs.observe(elScroll);
          window.addEventListener('resize', () => updateVisibilityAndLayout(), { passive: true });

           // Theme changes should redraw (canvas colors differ).
           const mo = new MutationObserver(() => draw());
           mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

           // Keyboard shortcuts: Enter (Start), R (Reset), A (Reveal All)
           window.addEventListener('keydown', (e) => {
             // Guard: don't fire if user is typing in input/textarea
             if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

             if (e.key === 'Enter') {
               e.preventDefault();
               if (canStart()) {
                 elGenerate.click();
               }
             }
             if (e.key === 'r' || e.key === 'R') {
               e.preventDefault();
               elReset.click();
             }
             if (e.key === 'a' || e.key === 'A') {
               e.preventDefault();
               elRevealAll.click();
             }
           });
         }

        // Minimal inline animation for celebrations.
        const style = document.createElement('style');
        style.textContent = '\\n'
          + '[data-result-wrap][data-celebrate="1"] {\\n'
          + '  animation: ladderPulse 650ms ease-out both;\\n'
          + '}\\n'
          + '@keyframes ladderPulse {\\n'
          + '  0% { transform: translateY(0); }\\n'
          + '  40% { transform: translateY(-2px); }\\n'
          + '  100% { transform: translateY(0); }\\n'
          + '}\\n'
          + '.ladder-countdown {\\n'
          + '  position: absolute; inset: 0; z-index: 50;\\n'
          + '  display: flex; align-items: center; justify-content: center;\\n'
          + '  background: rgba(0,0,0,0.5); backdrop-filter: blur(3px);\\n'
          + '  pointer-events: none;\\n'
          + '}\\n'
          + '.ladder-countdown-num {\\n'
          + '  font-size: 6rem; font-weight: 900; color: white;\\n'
          + '  text-shadow: 0 0 30px rgba(255,255,255,0.4), 0 0 60px rgba(99,102,241,0.3);\\n'
          + '  animation: ladderCountPop 700ms cubic-bezier(0.2,0.9,0.2,1) both;\\n'
          + '}\\n'
          + '@keyframes ladderCountPop {\\n'
          + '  0% { transform: scale(2.5); opacity: 0; }\\n'
          + '  35% { transform: scale(0.9); opacity: 1; }\\n'
          + '  60% { transform: scale(1.08); }\\n'
          + '  100% { transform: scale(1); opacity: 0.2; }\\n'
          + '}\\n'
          + '.ladder-shake {\\n'
          + '  animation: ladderShake 500ms ease-out;\\n'
          + '}\\n'
          + '@keyframes ladderShake {\\n'
          + '  0%,100% { transform: translate(0,0); }\\n'
          + '  10% { transform: translate(-4px,2px); }\\n'
          + '  20% { transform: translate(3px,-3px); }\\n'
          + '  30% { transform: translate(-3px,1px); }\\n'
          + '  40% { transform: translate(2px,-1px); }\\n'
          + '  50% { transform: translate(-1px,1px); }\\n'
          + '}\\n'
          + '.ladder-spotlight {\\n'
          + '  animation: ladderSpot 1.2s ease-in-out;\\n'
          + '}\\n'
          + '@keyframes ladderSpot {\\n'
          + '  0% { box-shadow: 0 0 0 0 rgba(251,191,36,0); }\\n'
          + '  30% { box-shadow: 0 0 20px 6px rgba(251,191,36,0.4), 0 0 40px 15px rgba(251,191,36,0.15); }\\n'
          + '  100% { box-shadow: 0 0 0 0 rgba(251,191,36,0); }\\n'
          + '}\\n'
          + '@media (prefers-reduced-motion: reduce) {\\n'
          + '  .ladder-countdown-num { animation: none; opacity: 1; transform: scale(1); }\\n'
          + '  .ladder-shake { animation: none; }\\n'
          + '  .ladder-spotlight { animation: none; }\\n'
          + '}\\n'
          + '.ladder-spoiler-tile {\\n'
          + '  display:block; width:100%; height:100%;\\n'
          + '  background: rgba(15, 23, 42, 0.88);\\n'
          + '  border: 1px solid rgba(148, 163, 184, 0.18);\\n'
          + '  transition: opacity 140ms ease, transform 140ms ease;\\n'
          + '}\\n'
          + '.ladder-spoiler-tile:hover { opacity: 0.96; }\\n'
          + '.ladder-spoiler-tile-off { opacity: 0; transform: scale(0.98); }\\n';
        document.head.appendChild(style);

        init();
      })();
    </script>
  `;

  return respondHTML(createPageTemplate({
    title: 'Ladder Game',
    description: 'Play the classic Korean ghost leg ladder game (Amidakuji) to randomly match players to outcomes. Fully client-side with Canvas animations.',
    path: '/ladder-game',
    content,
    scripts: script
  }));
}

export async function handleLadderGameRoutes(request, url) {
  if (url.pathname === '/ladder-game' || url.pathname === '/ladder-game/') {
    if (request.method === 'GET') return renderLadderGamePage();
  }
  return null;
}
