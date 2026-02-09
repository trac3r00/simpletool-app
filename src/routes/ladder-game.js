/**
 * Ladder Game (Ghost Leg / Amidakuji) - Naver-style Wizard Flow
 * Fully client-side Canvas tool with hidden ladder mechanics.
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

        <section aria-label="Ladder game" class="space-y-6">
          <!-- Step 1: Player Count -->
          <div id="step-1" data-step="1" class="step-panel">
            <div class="text-center py-8 sm:py-12">
              <h2 class="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2" data-i18n="tools.ladder-game.ui.heading0">How many players?</h2>
              <p class="text-surface-600 dark:text-surface-400 mb-8" data-i18n="tools.ladder-game.ui.text0">Select the number of participants</p>

              <div class="flex items-center justify-center gap-4 mb-8">
                <button id="decrement-count" type="button" class="btn btn-secondary w-14 h-14 text-2xl" aria-label="Decrease player count" data-i18n-aria="tools.ladder-game.ui.aria0">−</button>
                <div class="relative">
                  <input type="number" id="player-count" value="4" min="2" max="24" class="input w-24 text-center text-2xl font-bold py-3" aria-label="Player count" data-i18n-aria="tools.ladder-game.ui.label0">
                  <span class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.ladder-game.ui.text1">players</span>
                </div>
                <button id="increment-count" type="button" class="btn btn-secondary w-14 h-14 text-2xl" aria-label="Increase player count" data-i18n-aria="tools.ladder-game.ui.aria1">+</button>
              </div>

              <div class="flex justify-center">
                <button id="btn-step-1-next" type="button" class="btn btn-primary px-8 py-3 text-lg" data-i18n="tools.ladder-game.ui.button0">Start</button>
              </div>
            </div>
          </div>

          <!-- Step 2: Names and Results -->
          <div id="step-2" data-step="2" class="step-panel hidden">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.ladder-game.ui.heading1">Enter Names & Results</h2>
                <p class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.ladder-game.ui.text2">Set player names and what they might win</p>
              </div>
              <div class="flex items-center gap-2">
                <label for="preset-select" class="label mb-0" data-i18n="tools.ladder-game.ui.label1">Quick presets</label>
                <select id="preset-select" class="input w-40">
                  <option value="" data-i18n="tools.ladder-game.ui.option0">Select...</option>
                  <option value="coffee" data-i18n="tools.ladder-game.ui.option1">Coffee break</option>
                  <option value="lunch" data-i18n="tools.ladder-game.ui.option2">Lunch duty</option>
                  <option value="gift" data-i18n="tools.ladder-game.ui.option3">Gift exchange</option>
                  <option value="chores" data-i18n="tools.ladder-game.ui.option4">House chores</option>
                  <option value="teams" data-i18n="tools.ladder-game.ui.option5">Team assignment</option>
                </select>
              </div>
            </div>

            <div class="space-y-6">
              <!-- Player Names (Top) -->
              <div>
                <h3 class="label" data-i18n="tools.ladder-game.ui.label2">Players (Top)</h3>
                <div id="players-container" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <!-- Dynamically populated -->
                </div>
              </div>

              <!-- Results (Bottom) -->
              <div>
                <h3 class="label" data-i18n="tools.ladder-game.ui.label3">Results (Bottom)</h3>
                <div id="results-container" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <!-- Dynamically populated -->
                </div>
              </div>
            </div>

            <div class="flex justify-between mt-8">
              <button id="btn-step-2-back" type="button" class="btn btn-ghost" data-i18n="tools.ladder-game.ui.button1">Back</button>
              <button id="btn-step-2-next" type="button" class="btn btn-primary px-8" data-i18n="tools.ladder-game.ui.button2">Start Ladder</button>
            </div>
          </div>

          <!-- Step 3: The Ladder Game -->
          <div id="step-3" data-step="3" class="step-panel hidden">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.ladder-game.ui.heading2">Find Your Path</h2>
                <p class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.ladder-game.ui.text3">Click a player name to trace down, or a result to trace up</p>
              </div>
              <div class="flex items-center gap-2">
                <label class="inline-flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300 select-none cursor-pointer">
                  <input id="sound-toggle" type="checkbox" class="rounded border-surface-300 text-primary-600 focus:ring-primary-500">
                  <span data-i18n="tools.ladder-game.ui.label4">Sound</span>
                </label>
              </div>
            </div>

            <!-- Player Names Row (Clickable) -->
            <div id="game-players-row" class="flex justify-center gap-2 sm:gap-4 mb-2">
              <!-- Dynamically populated -->
            </div>

            <!-- Canvas Container -->
            <div class="relative rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/40 overflow-hidden">
              <canvas id="ladder-canvas" class="block w-full" aria-label="Ladder canvas"></canvas>
              <!-- Loading overlay -->
              <div id="ladder-loading" class="absolute inset-0 flex items-center justify-center bg-surface-50/80 dark:bg-surface-900/80 hidden">
                <div class="spinner"></div>
              </div>
            </div>

            <!-- Results Row (Clickable) -->
            <div id="game-results-row" class="flex justify-center gap-2 sm:gap-4 mt-2">
              <!-- Dynamically populated -->
            </div>

            <!-- Status -->
            <div class="mt-4 text-center">
              <div id="game-status" role="status" aria-live="polite" class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.ladder-game.ui.status0">Click a name to start tracing</div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap justify-center gap-3 mt-6">
              <button id="btn-reveal-all" type="button" class="btn btn-secondary" data-i18n="tools.ladder-game.ui.button3">Reveal All</button>
              <button id="btn-play-again" type="button" class="btn btn-primary" data-i18n="tools.ladder-game.ui.button4">Play Again</button>
            </div>

            <!-- Results Summary -->
            <div id="results-summary" class="mt-6 hidden">
              <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-3 text-center" data-i18n="tools.ladder-game.ui.heading3">Results</h3>
              <div id="results-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <!-- Dynamically populated -->
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
        const { clamp, cryptoUint32, randInt, randFloat } = window.GameUtils;

        // Color palette for traces
        const COLOR_PALETTE = [
          '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
          '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
          '#06b6d4', '#f43f5e', '#8b5cf6', '#10b981', '#f59e0b',
          '#3b82f6', '#ef4444', '#ec4899', '#14b8a6', '#f97316',
          '#6366f1', '#84cc16', '#06b6d4', '#f43f5e'
        ];

        // Presets for quick setup
        const PRESETS = {
          coffee: {
            results: ['Pay for coffee', 'Free pass', 'Buy next round', 'Get treated', 'Pay for coffee', 'Free pass', 'Buy next round', 'Get treated', 'Pay for coffee', 'Free pass', 'Buy next round', 'Get treated', 'Pay for coffee', 'Free pass', 'Buy next round', 'Get treated', 'Pay for coffee', 'Free pass', 'Buy next round', 'Get treated', 'Pay for coffee', 'Free pass', 'Buy next round', 'Get treated']
          },
          lunch: {
            results: ['Buy lunch', 'Wash dishes', 'Free pass', 'Buy lunch', 'Wash dishes', 'Free pass', 'Buy lunch', 'Wash dishes', 'Free pass', 'Buy lunch', 'Wash dishes', 'Free pass', 'Buy lunch', 'Wash dishes', 'Free pass', 'Buy lunch', 'Wash dishes', 'Free pass', 'Buy lunch', 'Wash dishes', 'Free pass', 'Buy lunch', 'Wash dishes', 'Free pass']
          },
          gift: {
            results: ['Give a gift', 'Receive a gift', 'Exchange gifts', 'Give a gift', 'Receive a gift', 'Exchange gifts', 'Give a gift', 'Receive a gift', 'Exchange gifts', 'Give a gift', 'Receive a gift', 'Exchange gifts', 'Give a gift', 'Receive a gift', 'Exchange gifts', 'Give a gift', 'Receive a gift', 'Exchange gifts', 'Give a gift', 'Receive a gift', 'Exchange gifts', 'Give a gift', 'Receive a gift', 'Exchange gifts']
          },
          chores: {
            results: ['Clean kitchen', 'Do laundry', 'Vacuum', 'Take out trash', 'Clean bathroom', 'Free pass', 'Clean kitchen', 'Do laundry', 'Vacuum', 'Take out trash', 'Clean bathroom', 'Free pass', 'Clean kitchen', 'Do laundry', 'Vacuum', 'Take out trash', 'Clean bathroom', 'Free pass', 'Clean kitchen', 'Do laundry', 'Vacuum', 'Take out trash', 'Clean bathroom', 'Free pass']
          },
          teams: {
            results: ['Team A', 'Team B', 'Team C', 'Team D', 'Team A', 'Team B', 'Team C', 'Team D', 'Team A', 'Team B', 'Team C', 'Team D', 'Team A', 'Team B', 'Team C', 'Team D', 'Team A', 'Team B', 'Team C', 'Team D', 'Team A', 'Team B', 'Team C', 'Team D']
          }
        };

        // Device detection
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
        const MIN_PLAYERS = 2;
        const MAX_PLAYERS = isMobile ? 12 : 24;
        const DEFAULT_PLAYERS = 4;

        // State
        const state = {
          step: 1,
          count: DEFAULT_PLAYERS,
          players: [],
          results: [],
          ladder: null,
          geom: null,
          computedPaths: [],
          traces: [],
          rafId: null,
          isTracing: false,
          revealedResults: new Set(),
          soundEnabled: false,
          prefersReducedMotion: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
        };

        // Audio context for sound effects
        const audio = { ctx: null };

        // DOM Elements
        const elStep1 = document.getElementById('step-1');
        const elStep2 = document.getElementById('step-2');
        const elStep3 = document.getElementById('step-3');
        const elPlayerCount = document.getElementById('player-count');
        const elDecrement = document.getElementById('decrement-count');
        const elIncrement = document.getElementById('increment-count');
        const elBtnStep1Next = document.getElementById('btn-step-1-next');
        const elBtnStep2Back = document.getElementById('btn-step-2-back');
        const elBtnStep2Next = document.getElementById('btn-step-2-next');
        const elPlayersContainer = document.getElementById('players-container');
        const elResultsContainer = document.getElementById('results-container');
        const elPresetSelect = document.getElementById('preset-select');
        const elGamePlayersRow = document.getElementById('game-players-row');
        const elGameResultsRow = document.getElementById('game-results-row');
        const elGameStatus = document.getElementById('game-status');
        const elBtnRevealAll = document.getElementById('btn-reveal-all');
        const elBtnPlayAgain = document.getElementById('btn-play-again');
        const elResultsSummary = document.getElementById('results-summary');
        const elResultsList = document.getElementById('results-list');
        const elSoundToggle = document.getElementById('sound-toggle');
        const canvas = document.getElementById('ladder-canvas');
        const ctx = canvas.getContext('2d');

        // Initialize
        function init() {
          // Set max based on device
          elPlayerCount.max = MAX_PLAYERS;
          
          // Initialize arrays
          resetNames();

          // Event delegation
          document.addEventListener('click', handleGlobalClick);
          document.addEventListener('input', handleGlobalInput);

          // Sound toggle
          elSoundToggle.addEventListener('change', (e) => {
            state.soundEnabled = e.target.checked;
            if (state.soundEnabled && !audio.ctx) {
              ensureAudioCtx();
            }
          });

          // Keyboard shortcuts
          window.addEventListener('keydown', handleKeydown);

          // Resize observer
          const resizeObs = new ResizeObserver(() => {
            if (state.step === 3 && state.ladder) {
              resizeCanvasAndRecompute();
            }
          });
          resizeObs.observe(canvas.parentElement);

          // Theme change observer
          const mo = new MutationObserver(() => {
            if (state.step === 3) draw();
          });
          mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        }

        function handleGlobalClick(e) {
          const target = e.target;

          // Step 1: Decrement count
          if (target.closest('#decrement-count')) {
            const newVal = Math.max(MIN_PLAYERS, parseInt(elPlayerCount.value, 10) - 1);
            elPlayerCount.value = newVal;
            state.count = newVal;
          }

          // Step 1: Increment count
          if (target.closest('#increment-count')) {
            const newVal = Math.min(MAX_PLAYERS, parseInt(elPlayerCount.value, 10) + 1);
            elPlayerCount.value = newVal;
            state.count = newVal;
          }

          // Step 1: Next button
          if (target.closest('#btn-step-1-next')) {
            state.count = parseInt(elPlayerCount.value, 10) || DEFAULT_PLAYERS;
            goToStep(2);
          }

          // Step 2: Back button
          if (target.closest('#btn-step-2-back')) {
            goToStep(1);
          }

          // Step 2: Next button
          if (target.closest('#btn-step-2-next')) {
            collectNamesAndResults();
            goToStep(3);
            initGame();
          }

          // Step 3: Reveal All
          if (target.closest('#btn-reveal-all')) {
            revealAll();
          }

          // Step 3: Play Again
          if (target.closest('#btn-play-again')) {
            resetGame();
            goToStep(1);
          }

          // Game: Click player name to trace
          if (target.closest('[data-player-index]')) {
            const btn = target.closest('[data-player-index]');
            const idx = parseInt(btn.getAttribute('data-player-index'), 10);
            if (!state.isTracing && state.ladder) {
              tracePlayer(idx);
            }
          }

          // Game: Click result to trace up
          if (target.closest('[data-result-index]')) {
            const btn = target.closest('[data-result-index]');
            const idx = parseInt(btn.getAttribute('data-result-index'), 10);
            if (!state.isTracing && state.ladder) {
              traceResult(idx);
            }
          }
        }

        function handleGlobalInput(e) {
          const target = e.target;

          // Player count input
          if (target.id === 'player-count') {
            let val = parseInt(target.value, 10);
            if (Number.isFinite(val)) {
              val = clamp(val, MIN_PLAYERS, MAX_PLAYERS);
              state.count = val;
            }
          }

          // Preset selection
          if (target.id === 'preset-select') {
            applyPreset(target.value);
          }
        }

        function handleKeydown(e) {
          if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
            return;
          }

          if (e.key === 'Enter') {
            e.preventDefault();
            if (state.step === 1) {
              elBtnStep1Next.click();
            } else if (state.step === 2) {
              elBtnStep2Next.click();
            }
          }
        }

        function goToStep(step) {
          state.step = step;
          elStep1.classList.toggle('hidden', step !== 1);
          elStep2.classList.toggle('hidden', step !== 2);
          elStep3.classList.toggle('hidden', step !== 3);

          if (step === 2) {
            renderStep2();
          } else if (step === 3) {
            renderStep3();
          }
        }

        function resetNames() {
          state.players = [];
          state.results = [];
          for (let i = 0; i < MAX_PLAYERS; i++) {
            state.players.push(window._t('tools.ladder-game.js.text0', 'Player') + ' ' + (i + 1));
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const suffix = letters[i % letters.length] || String(i + 1);
            state.results.push(window._t('tools.ladder-game.js.text1', 'Result') + ' ' + suffix);
          }
        }

        function renderStep2() {
          // Render player inputs
          elPlayersContainer.innerHTML = '';
          elResultsContainer.innerHTML = '';

          for (let i = 0; i < state.count; i++) {
            // Player input
            const pWrap = document.createElement('div');
            pWrap.className = 'flex flex-col';
            pWrap.innerHTML = '<label class="text-xs text-surface-500 dark:text-surface-400 mb-1">' + window._t('tools.ladder-game.js.tpl0', 'Player') + ' ' + (i + 1) + '</label>' +
              '<input type="text" class="input player-name-input" data-index="' + i + '" value="' + escapeHtml(state.players[i]) + '" placeholder="' + window._t('tools.ladder-game.ui.placeholder0', 'Name') + '" data-i18n-placeholder="tools.ladder-game.ui.placeholder0">';
            elPlayersContainer.appendChild(pWrap);

            // Result input
            const rWrap = document.createElement('div');
            rWrap.className = 'flex flex-col';
            rWrap.innerHTML = '<label class="text-xs text-surface-500 dark:text-surface-400 mb-1">' + window._t('tools.ladder-game.js.tpl1', 'Result') + ' ' + (i + 1) + '</label>' +
              '<input type="text" class="input result-input" data-index="' + i + '" value="' + escapeHtml(state.results[i]) + '" placeholder="' + window._t('tools.ladder-game.ui.placeholder1', 'Result') + '" data-i18n-placeholder="tools.ladder-game.ui.placeholder1">';
            elResultsContainer.appendChild(rWrap);
          }
        }

        function collectNamesAndResults() {
          const playerInputs = elPlayersContainer.querySelectorAll('.player-name-input');
          const resultInputs = elResultsContainer.querySelectorAll('.result-input');

          for (let i = 0; i < state.count; i++) {
            state.players[i] = (playerInputs[i]?.value || state.players[i]).trim();
            state.results[i] = (resultInputs[i]?.value || state.results[i]).trim();
          }
        }

        function applyPreset(presetKey) {
          if (!presetKey || !PRESETS[presetKey]) return;

          const preset = PRESETS[presetKey];
          const resultInputs = elResultsContainer.querySelectorAll('.result-input');

          for (let i = 0; i < state.count && i < resultInputs.length; i++) {
            resultInputs[i].value = preset.results[i % preset.results.length];
          }
        }

        function renderStep3() {
          // Render clickable player names
          elGamePlayersRow.innerHTML = '';
          elGameResultsRow.innerHTML = '';

          const colWidth = Math.min(120, Math.max(60, Math.floor(600 / state.count)));

          for (let i = 0; i < state.count; i++) {
            // Player button
            const pBtn = document.createElement('button');
            pBtn.type = 'button';
            pBtn.className = 'player-btn px-2 py-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium text-sm hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
            pBtn.style.width = colWidth + 'px';
            pBtn.style.minWidth = '60px';
            pBtn.textContent = state.players[i];
            pBtn.setAttribute('data-player-index', i);
            pBtn.setAttribute('aria-label', window._t('tools.ladder-game.js.text2', 'Trace') + ': ' + state.players[i]);
            elGamePlayersRow.appendChild(pBtn);

            // Result button
            const rBtn = document.createElement('button');
            rBtn.type = 'button';
            rBtn.className = 'result-btn px-2 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 font-medium text-sm hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
            rBtn.style.width = colWidth + 'px';
            rBtn.style.minWidth = '60px';
            rBtn.textContent = state.results[i];
            rBtn.setAttribute('data-result-index', i);
            rBtn.setAttribute('aria-label', window._t('tools.ladder-game.js.text3', 'Trace up from') + ': ' + state.results[i]);
            elGameResultsRow.appendChild(rBtn);
          }
        }

        function initGame() {
          // Reset game state
          state.revealedResults.clear();
          state.traces = [];
          stopAnimationLoop();
          elResultsSummary.classList.add('hidden');
          elResultsList.innerHTML = '';
          setGameStatus(window._t('tools.ladder-game.ui.status0', 'Click a name to start tracing'));

          // Generate ladder
          generateLadder();
          computeGeometry();
          computePaths();
          resizeCanvasAndRecompute();

          // Reset button states
          updateButtonStates();
        }

        function resetGame() {
          state.ladder = null;
          state.computedPaths = [];
          state.traces = [];
          state.revealedResults.clear();
          stopAnimationLoop();
          resetNames();
          elPresetSelect.value = '';
        }

        // ============================================
        // LADDER GENERATION (PRESERVED ALGORITHM)
        // ============================================

        function ladderParams() {
          const count = state.count;
          // Fixed params for consistency
          const rowBase = 20;
          const rowScale = 2;
          const rows = clamp(rowBase + count * rowScale, 18, 40);
          const rungMin = 3;
          const rungMax = 6;
          const tryP = count <= 3 ? 0.22 : 0.18;

          return { rows, rungMin, rungMax, tryP };
        }

        function generateLadder() {
          const count = state.count;
          const { rows, rungMin: minPerPair, rungMax: maxPerPair, tryP } = ladderParams();
          const rungsByRow = new Array(rows).fill(null).map(() => []);

          // First pass: probabilistic fill with adjacency constraint
          for (let row = 0; row < rows; row++) {
            let prevPlaced = false;
            for (let col = 0; col < count - 1; col++) {
              const shouldTry = randFloat() < tryP;
              if (!shouldTry) {
                prevPlaced = false;
                continue;
              }
              if (prevPlaced) continue;
              // Ensure no rung adjacent on this row
              if (rungsByRow[row].includes(col - 1) || rungsByRow[row].includes(col + 1)) continue;
              rungsByRow[row].push(col);
              prevPlaced = true;
            }
          }

          // Normalize per-column-pair rung counts
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

          // Add missing rungs
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

          // Remove extras
          for (let col = 0; col < count - 1; col++) {
            if (counts[col] <= maxPerPair) continue;
            const positions = [];
            for (let row = 0; row < rows; row++) {
              if (rungsByRow[row].includes(col)) positions.push(row);
            }
            // Randomly remove until within max
            while (counts[col] > maxPerPair && positions.length) {
              const idx = randInt(positions.length);
              const row = positions.splice(idx, 1)[0];
              const at = rungsByRow[row].indexOf(col);
              if (at >= 0) rungsByRow[row].splice(at, 1);
              counts[col]--;
            }
          }

          // Materialize rungs
          const rungs = [];
          for (let row = 0; row < rows; row++) {
            rungsByRow[row].sort((a, b) => a - b);
            for (let i = 0; i < rungsByRow[row].length; i++) {
              rungs.push({ row, col: rungsByRow[row][i] });
            }
          }

          state.ladder = { rows, rungsByRow, rungs };
        }

        function computeGeometry() {
          const rect = canvas.getBoundingClientRect();
          const w = Math.max(10, Math.round(rect.width));
          const h = Math.max(300, Math.min(600, Math.round(w * 0.8)));

          const paddingX = Math.max(30, Math.min(60, w / (state.count + 2)));
          const topTextY = 20;
          const bottomTextY = h - 14;
          const yTop = 44;
          const yBottom = h - 44;
          const ladderHeight = Math.max(120, yBottom - yTop);
          const count = state.count;
          const xSpan = Math.max(20, w - paddingX * 2);
          const step = count > 1 ? (xSpan / (count - 1)) : 0;

          const xForCol = (c) => paddingX + step * c;

          state.geom = {
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

        // ============================================
        // PATH TRACING (PRESERVED ALGORITHM)
        // ============================================

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

          // PRESERVED: follow() path tracing algorithm
          function follow(startCol) {
            let col = startCol;
            const pts = [{ x: g.xForCol(col), y: g.yTop }];
            for (let r = 0; r < rows; r++) {
              const y = rowYs[r];
              const rungCols = rungsByRow[r];
              let delta = 0;

              // If there is a rung starting at our column, cross right
              if (rungCols.includes(col)) delta = 1;
              // Else if there is a rung starting at col-1, we are on the right side; cross left
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
            computed.push({ points, endCol, length: len, startCol: i });
          }

          state.computedPaths = computed;
        }

        function resizeCanvasAndRecompute() {
          if (!state.geom) return;

          const cssW = Math.max(10, Math.round(canvas.parentElement.clientWidth));
          const cssH = state.geom.h;

          canvas.style.height = cssH + 'px';
          canvas.style.width = cssW + 'px';

          const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
          canvas.width = Math.round(cssW * dpr);
          canvas.height = Math.round(cssH * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          state.geom.w = cssW;

          // Recompute paths with new geometry
          const oldPaths = state.computedPaths;
          computePaths();

          // Preserve trace progress on resize
          if (oldPaths.length && state.traces.length) {
            for (let i = 0; i < state.traces.length; i++) {
              const t = state.traces[i];
              const oldLen = oldPaths[t.playerIndex]?.length;
              const newLen = state.computedPaths[t.playerIndex]?.length;
              if (oldLen && newLen) {
                const ratio = clamp(t.progress / oldLen, 0, 1);
                t.progress = ratio * newLen;
              }
            }
          }

          draw();
        }

        // ============================================
        // TRACING & ANIMATION
        // ============================================

        function tracePlayer(playerIndex) {
          if (state.isTracing) return;
          if (state.revealedResults.has(playerIndex)) return;

          const path = state.computedPaths[playerIndex];
          if (!path) return;

          state.isTracing = true;
          updateButtonStates();

          const color = COLOR_PALETTE[playerIndex % COLOR_PALETTE.length];
          state.traces = [{
            playerIndex,
            color,
            progress: 0,
            done: false,
            reverse: false
          }];

          setGameStatus(window._t('tools.ladder-game.js.status1', 'Tracing...'));
          startAnimationLoop();
        }

        function traceResult(resultIndex) {
          if (state.isTracing) return;

          // Find which player ends at this result
          const playerIndex = state.computedPaths.findIndex(p => p.endCol === resultIndex);
          if (playerIndex === -1) return;
          if (state.revealedResults.has(playerIndex)) return;

          state.isTracing = true;
          updateButtonStates();

          const color = COLOR_PALETTE[playerIndex % COLOR_PALETTE.length];
          state.traces = [{
            playerIndex,
            color,
            progress: 0,
            done: false,
            reverse: true,
            resultIndex
          }];

          setGameStatus(window._t('tools.ladder-game.js.status1', 'Tracing...'));
          startAnimationLoop();
        }

        function revealAll() {
          if (state.isTracing) return;

          state.isTracing = true;
          updateButtonStates();

          const traces = [];
          for (let i = 0; i < state.count; i++) {
            traces.push({
              playerIndex: i,
              color: COLOR_PALETTE[i % COLOR_PALETTE.length],
              progress: 0,
              done: false,
              reverse: false
            });
          }

          state.traces = traces;
          setGameStatus(window._t('tools.ladder-game.js.status1', 'Revealing all...'));
          startAnimationLoop();
        }

        function startAnimationLoop() {
          if (state.rafId) return;

          let last = performance.now();
          const baseSpeed = state.prefersReducedMotion ? 1500 : 220;

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
              const effSpeed = baseSpeed * speedMult;

              t.progress += effSpeed * dt;

              if (t.progress >= path.length) {
                t.progress = path.length;
                t.done = true;
                onTraceComplete(t);
              }
            }

            draw();

            if (anyActive) {
              state.rafId = requestAnimationFrame(tick);
            } else {
              stopAnimationLoop();
              state.isTracing = false;
              updateButtonStates();
              showResultsSummary();
            }
          }

          state.rafId = requestAnimationFrame(tick);
        }

        function stopAnimationLoop() {
          if (state.rafId) {
            cancelAnimationFrame(state.rafId);
            state.rafId = null;
          }
        }

        function onTraceComplete(trace) {
          const path = state.computedPaths[trace.playerIndex];
          if (!path) return;

          state.revealedResults.add(trace.playerIndex);

          // Highlight the result
          const resultBtn = elGameResultsRow.querySelector('[data-result-index="' + path.endCol + '"]');
          if (resultBtn) {
            resultBtn.classList.add('ring-2', 'ring-primary-500', 'dark:ring-primary-400', 'result-revealed');
          }

          // Highlight the player
          const playerBtn = elGamePlayersRow.querySelector('[data-player-index="' + trace.playerIndex + '"]');
          if (playerBtn) {
            playerBtn.classList.add('ring-2', 'ring-primary-500', 'dark:ring-primary-400');
            playerBtn.disabled = true;
          }

          // Play sound if enabled
          if (state.soundEnabled && !state.prefersReducedMotion) {
            playCompletionSound();
          }

          setGameStatus(state.players[trace.playerIndex] + ' \\u2192 ' + state.results[path.endCol]);
        }

        function updateButtonStates() {
          const playerBtns = elGamePlayersRow.querySelectorAll('[data-player-index]');
          const resultBtns = elGameResultsRow.querySelectorAll('[data-result-index]');

          playerBtns.forEach((btn, i) => {
            btn.disabled = state.isTracing || state.revealedResults.has(i);
          });

          resultBtns.forEach((btn) => {
            btn.disabled = state.isTracing;
          });

          elBtnRevealAll.disabled = state.isTracing || state.revealedResults.size >= state.count;
        }

        function showResultsSummary() {
          if (state.revealedResults.size === 0) return;

          elResultsSummary.classList.remove('hidden');
          elResultsList.innerHTML = '';

          const sortedResults = Array.from(state.revealedResults).sort((a, b) => a - b);

          for (const playerIdx of sortedResults) {
            const path = state.computedPaths[playerIdx];
            if (!path) continue;

            const resultIdx = path.endCol;
            const color = COLOR_PALETTE[playerIdx % COLOR_PALETTE.length];

            const item = document.createElement('div');
            item.className = 'flex items-center gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700';
            item.innerHTML =
              '<div class="w-3 h-3 rounded-full" style="background-color: ' + color + '"></div>' +
              '<div class="flex-1 min-w-0">' +
              '<div class="font-medium text-surface-900 dark:text-surface-100 truncate">' + escapeHtml(state.players[playerIdx]) + '</div>' +
              '<div class="text-xs text-surface-500 dark:text-surface-400">' + window._t('tools.ladder-game.js.text4', 'gets') + '</div>' +
              '</div>' +
              '<div class="font-semibold text-primary-600 dark:text-primary-400">' + escapeHtml(state.results[resultIdx]) + '</div>';
            elResultsList.appendChild(item);
          }
        }

        // ============================================
        // RENDERING
        // ============================================

        function draw() {
          if (!state.geom) return;

          ctx.clearRect(0, 0, state.geom.w, state.geom.h);
          drawBackground();
          drawLadder();
          drawTraces();
        }

        function drawBackground() {
          const g = state.geom;
          const dark = isDarkMode();

          // Gradient background
          const grad = ctx.createLinearGradient(0, 0, g.w, g.h);
          if (dark) {
            grad.addColorStop(0, 'rgba(15, 23, 42, 0.3)');
            grad.addColorStop(1, 'rgba(2, 6, 23, 0.3)');
          } else {
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            grad.addColorStop(1, 'rgba(241, 245, 249, 0.9)');
          }
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, g.w, g.h);
        }

        function drawLadder() {
          if (!state.ladder || !state.geom) return;

          const g = state.geom;
          const { rows, rungsByRow } = state.ladder;
          const dark = isDarkMode();
          const count = state.count;

          const lineColor = dark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(30, 41, 59, 0.25)';
          const rungColor = dark ? 'rgba(226, 232, 240, 0.35)' : 'rgba(51, 65, 85, 0.3)';

          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Calculate row Y positions
          const rowYs = new Array(rows);
          for (let r = 0; r < rows; r++) {
            rowYs[r] = g.yTop + ((r + 1) * g.ladderHeight) / (rows + 1);
          }

          // Draw vertical rails
          ctx.save();
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 2;
          for (let i = 0; i < count; i++) {
            const x = g.xForCol(i);
            ctx.beginPath();
            ctx.moveTo(x, g.yTop);
            ctx.lineTo(x, g.yBottom);
            ctx.stroke();
          }
          ctx.restore();

          // Draw horizontal rungs (always visible now)
          ctx.save();
          ctx.strokeStyle = rungColor;
          ctx.lineWidth = 2.5;
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

        function drawTraces() {
          if (!state.computedPaths.length || !state.geom) return;

          const dark = isDarkMode();

          for (let i = 0; i < state.traces.length; i++) {
            const t = state.traces[i];
            const path = state.computedPaths[t.playerIndex];
            if (!path) continue;

            const points = path.points;
            const color = t.color;
            const glow = dark ? 14 : 10;

            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 4.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 0.95;
            ctx.shadowBlur = glow;
            ctx.shadowColor = color;
            drawTracePartial(points, t.progress);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            ctx.lineWidth = 3;
            drawTracePartial(points, t.progress);
            ctx.restore();

            // Draw tracer dot
            if (!t.done && t.progress > 0) {
              const pos = getPositionAtDist(points, t.progress);
              ctx.save();
              ctx.beginPath();
              ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
              ctx.fillStyle = color;
              ctx.shadowBlur = 15;
              ctx.shadowColor = color;
              ctx.fill();
              ctx.beginPath();
              ctx.arc(pos.x, pos.y, 3.5, 0, Math.PI * 2);
              ctx.fillStyle = 'white';
              ctx.shadowBlur = 0;
              ctx.fill();
              ctx.restore();
            }
          }
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

        // ============================================
        // AUDIO
        // ============================================

        function ensureAudioCtx() {
          if (audio.ctx) return audio.ctx;
          try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            audio.ctx = new AC();
            return audio.ctx;
          } catch (e) { return null; }
        }

        function playCompletionSound() {
          const c = ensureAudioCtx();
          if (!c) return;
          try {
            const t0 = c.currentTime;
            const notes = [523, 659, 784, 1047];
            const delays = [0, 60, 120, 200];

            for (let i = 0; i < notes.length; i++) {
              const o = c.createOscillator();
              const g = c.createGain();
              o.type = 'sine';
              o.frequency.value = notes[i];
              g.gain.setValueAtTime(0, t0 + delays[i] / 1000);
              g.gain.linearRampToValueAtTime(0.08, t0 + delays[i] / 1000 + 0.01);
              g.gain.exponentialRampToValueAtTime(0.001, t0 + delays[i] / 1000 + 0.15);
              o.connect(g);
              g.connect(c.destination);
              o.start(t0 + delays[i] / 1000);
              o.stop(t0 + delays[i] / 1000 + 0.2);
            }
          } catch (e) {}
        }

        // ============================================
        // UTILITIES
        // ============================================

        function setGameStatus(text) {
          elGameStatus.textContent = text;
        }

        function isDarkMode() {
          return document.documentElement.classList.contains('dark');
        }

        function escapeHtml(s) {
          return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        // Start
        init();
      })();
    </script>
  `;

  return createPageTemplate({
    title: 'Ladder Game',
    description: 'Classic ghost leg ladder game for random matching and decision making.',
    content,
    path: '/ladder-game',
    scripts: script
  });
}

export async function handleLadderGameRoutes(request, url) {
  if (url.pathname === '/ladder-game' || url.pathname === '/ladder-game/') {
    if (request.method === 'GET') {
      return respondHTML(renderLadderGamePage());
    }
  }
  return null;
}
