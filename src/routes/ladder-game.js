/**
 * Ladder Game (Ghost Leg / Amidakuji) - Modernized with themes, modes, and enhanced UX
 * Fully client-side Canvas tool with hidden ladder mechanics.
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { getToolTranslation, resolveRequestLanguage, t } from '../utils/i18n.js';

function renderLadderGamePage(lang = 'en') {
  const toolTranslation = getToolTranslation('ladder-game', lang);
  const tr = (key, fallback) => {
    const value = t(key, lang);
    return value === key ? fallback : value;
  };
  const toolHeader = createToolHeader(
    { emoji: '🪜' },
    toolTranslation?.name || 'Ladder Game',
    toolTranslation?.desc || 'Classic ghost leg ladder game for random matching and decision making.',
    [{ text: `<span data-i18n="tools.ladder-game.ui.badge0">${tr('tools.ladder-game.ui.badge0', 'Client-Side Only')}</span>` }],
    { toolId: 'ladder-game' }
  );

  const content = `
    <style>
      /* ======================================
         THEME SYSTEM
         ====================================== */
      .ladder-page { --theme-bg: transparent; }

      /* Neon theme */
      .ladder-page[data-theme="neon"] {
        --theme-rail: rgba(0,255,200,0.35);
        --theme-rung: rgba(0,220,255,0.4);
        --theme-bg-from: #0a0a1a;
        --theme-bg-to: #050510;
        --theme-glow: 18px;
        --theme-font: inherit;
      }
      .ladder-page[data-theme="neon"] #ladder-canvas-wrap {
        background: linear-gradient(135deg, #0a0a1a, #050510);
        border-color: rgba(0,220,255,0.2);
      }

      /* Pastel theme */
      .ladder-page[data-theme="pastel"] {
        --theme-rail: rgba(180,120,220,0.4);
        --theme-rung: rgba(120,180,240,0.5);
        --theme-bg-from: #fdf4ff;
        --theme-bg-to: #eff6ff;
        --theme-glow: 8px;
        --theme-font: inherit;
      }
      .ladder-page[data-theme="pastel"] #ladder-canvas-wrap {
        background: linear-gradient(135deg, #fdf4ff, #eff6ff);
        border-color: rgba(180,120,220,0.3);
      }

      /* Corporate theme */
      .ladder-page[data-theme="corporate"] {
        --theme-rail: rgba(71,85,105,0.4);
        --theme-rung: rgba(51,65,85,0.5);
        --theme-bg-from: #f8fafc;
        --theme-bg-to: #f1f5f9;
        --theme-glow: 4px;
        --theme-font: inherit;
      }
      .ladder-page[data-theme="corporate"] #ladder-canvas-wrap {
        background: linear-gradient(135deg, #f8fafc, #f1f5f9);
        border-color: rgba(71,85,105,0.2);
      }

      /* Retro theme */
      .ladder-page[data-theme="retro"] {
        --theme-rail: rgba(0,255,0,0.5);
        --theme-rung: rgba(255,255,0,0.6);
        --theme-bg-from: #000;
        --theme-bg-to: #001100;
        --theme-glow: 12px;
        --theme-font: 'Courier New', monospace;
      }
      .ladder-page[data-theme="retro"] #ladder-canvas-wrap {
        background: #000;
        border: 2px solid #00ff00;
        image-rendering: pixelated;
      }
      .ladder-page[data-theme="retro"] .player-btn,
      .ladder-page[data-theme="retro"] .result-btn {
        font-family: 'Courier New', monospace;
        letter-spacing: 0.05em;
      }

      /* Avatar selector */
      .avatar-btn {
        cursor: pointer;
        font-size: 1.25rem;
        padding: 0.25rem;
        border-radius: 0.375rem;
        border: 2px solid transparent;
        transition: border-color 0.15s, transform 0.15s;
        line-height: 1;
      }
      .avatar-btn:hover { transform: scale(1.15); }
      .avatar-btn.selected { border-color: var(--color-primary-500, #6366f1); }

      /* Drag-and-drop styles */
      .draggable-row {
        cursor: grab;
        transition: opacity 0.2s, transform 0.15s;
      }
      .draggable-row.dragging {
        opacity: 0.4;
        cursor: grabbing;
      }
      .draggable-row.drag-over {
        transform: translateY(-2px);
        outline: 2px dashed var(--color-primary-400, #818cf8);
        outline-offset: 2px;
        border-radius: 0.5rem;
      }

      /* Mystery mode hidden rung */
      .mystery-rung-hidden { opacity: 0; }
      .mystery-rung-reveal {
        animation: rungReveal 0.3s ease-out forwards;
      }
      @keyframes rungReveal {
        from { opacity: 0; transform: scaleX(0); }
        to   { opacity: 1; transform: scaleX(1); }
      }

      /* Particle trail */
      .particle-canvas {
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.75;
      }

      /* Tournament bracket */
      .bracket-round { display: flex; flex-direction: column; justify-content: space-around; }
      .bracket-match {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 4px 8px;
        border: 1px solid rgba(99,102,241,0.3);
        border-radius: 6px;
        font-size: 0.7rem;
        min-width: 80px;
      }
      .bracket-match .winner { color: #6366f1; font-weight: 600; }

      /* Speed race finish animation */
      @keyframes finishPop {
        0%   { transform: scale(1); }
        40%  { transform: scale(1.25); }
        70%  { transform: scale(0.9); }
        100% { transform: scale(1); }
      }
      .finish-pop { animation: finishPop 0.45s ease-out; }

      /* Slide-in for steps */
      .step-panel { transition: opacity 0.2s ease; }
      .step-panel.hidden { display: none; }

      /* Mode tabs */
      .mode-tab {
        padding: 0.375rem 0.75rem;
        border-radius: 0.5rem;
        font-size: 0.8rem;
        font-weight: 500;
        border: 1px solid rgba(99,102,241,0.25);
        background: transparent;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
        color: inherit;
      }
      .mode-tab.active {
        background: #6366f1;
        color: #fff;
        border-color: #6366f1;
      }
      .mode-tab:hover:not(.active) {
        background: rgba(99,102,241,0.12);
      }

      /* Team color swatches */
      .team-swatch {
        width: 12px; height: 12px;
        border-radius: 50%;
        display: inline-block;
      }

      /* Share button success */
      .share-success { color: #10b981 !important; }
    </style>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ladder-page" data-theme="neon">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}

        <section aria-label="Ladder game" class="space-y-6">

          <!-- Step 1: Player Count + Mode Selection -->
          <div id="step-1" data-step="1" class="step-panel">
            <div class="text-center py-8 sm:py-12">
              <h2 class="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2" data-i18n="tools.ladder-game.ui.heading0">${tr('tools.ladder-game.ui.heading0', 'How many players?')}</h2>
              <p class="text-surface-600 dark:text-surface-400 mb-8" data-i18n="tools.ladder-game.ui.text0">${tr('tools.ladder-game.ui.text0', 'Select the number of participants')}</p>

              <div class="flex items-center justify-center gap-4 mb-8">
                <button id="decrement-count" type="button" class="btn btn-secondary w-14 h-14 text-2xl" aria-label="Decrease player count" data-i18n-aria="tools.ladder-game.ui.aria0">−</button>
                <div class="relative">
                  <input type="number" id="player-count" value="4" min="2" max="24" class="input w-24 text-center text-2xl font-bold py-3" aria-label="Player count" data-i18n-aria="tools.ladder-game.ui.label0">
                  <span class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.ladder-game.ui.text1">${tr('tools.ladder-game.ui.text1', 'players')}</span>
                </div>
                <button id="increment-count" type="button" class="btn btn-secondary w-14 h-14 text-2xl" aria-label="Increase player count" data-i18n-aria="tools.ladder-game.ui.aria1">+</button>
              </div>

              <!-- Gameplay Mode Selection -->
              <div class="mb-8">
                <p class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3" data-i18n="tools.ladder-game.ui.modeLabel">${tr('tools.ladder-game.ui.modeLabel', 'Game Mode')}</p>
                <div class="flex flex-wrap justify-center gap-2" role="group" aria-label="Game mode">
                  <button type="button" class="mode-tab active" data-mode="classic" data-i18n="tools.ladder-game.ui.modeClassic">${tr('tools.ladder-game.ui.modeClassic', 'Classic')}</button>
                  <button type="button" class="mode-tab" data-mode="speed" data-i18n="tools.ladder-game.ui.modeSpeed">${tr('tools.ladder-game.ui.modeSpeed', 'Speed Race')}</button>
                  <button type="button" class="mode-tab" data-mode="mystery" data-i18n="tools.ladder-game.ui.modeMystery">${tr('tools.ladder-game.ui.modeMystery', 'Mystery')}</button>
                  <button type="button" class="mode-tab" data-mode="tournament" data-i18n="tools.ladder-game.ui.modeTournament">${tr('tools.ladder-game.ui.modeTournament', 'Tournament')}</button>
                  <button type="button" class="mode-tab" data-mode="team" data-i18n="tools.ladder-game.ui.modeTeam">${tr('tools.ladder-game.ui.modeTeam', 'Team')}</button>
                </div>
                <p id="mode-desc" class="mt-2 text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.ladder-game.ui.modeDescClassic">${tr('tools.ladder-game.ui.modeDescClassic', 'Trace one path at a time to reveal results.')}</p>
              </div>

              <!-- Theme Selection -->
              <div class="mb-8">
                <p class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3" data-i18n="tools.ladder-game.ui.themeLabel">${tr('tools.ladder-game.ui.themeLabel', 'Visual Theme')}</p>
                <div class="flex flex-wrap justify-center gap-2" role="group" aria-label="Visual theme">
                  <button type="button" class="mode-tab active" data-theme-pick="neon" data-i18n="tools.ladder-game.ui.themeNeon">${tr('tools.ladder-game.ui.themeNeon', 'Neon')}</button>
                  <button type="button" class="mode-tab" data-theme-pick="pastel" data-i18n="tools.ladder-game.ui.themePastel">${tr('tools.ladder-game.ui.themePastel', 'Pastel')}</button>
                  <button type="button" class="mode-tab" data-theme-pick="corporate" data-i18n="tools.ladder-game.ui.themeCorporate">${tr('tools.ladder-game.ui.themeCorporate', 'Corporate')}</button>
                  <button type="button" class="mode-tab" data-theme-pick="retro" data-i18n="tools.ladder-game.ui.themeRetro">${tr('tools.ladder-game.ui.themeRetro', 'Retro')}</button>
                </div>
              </div>

              <div class="flex justify-center">
                <button id="btn-step-1-next" type="button" class="btn btn-primary px-8 py-3 text-lg" data-i18n="tools.ladder-game.ui.button0">${tr('tools.ladder-game.ui.button0', 'Start')}</button>
              </div>
            </div>
          </div>

          <!-- Step 2: Names, Results, Options -->
          <div id="step-2" data-step="2" class="step-panel hidden">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.ladder-game.ui.heading1">${tr('tools.ladder-game.ui.heading1', 'Enter Names &amp; Results')}</h2>
                <p class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.ladder-game.ui.text2">${tr('tools.ladder-game.ui.text2', 'Set player names and what they might win')}</p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <label for="preset-select" class="label mb-0" data-i18n="tools.ladder-game.ui.label1">${tr('tools.ladder-game.ui.label1', 'Quick presets')}</label>
                <select id="preset-select" class="input w-40">
                  <option value="" data-i18n="tools.ladder-game.ui.option0">${tr('tools.ladder-game.ui.option0', 'Select...')}</option>
                  <option value="coffee" data-i18n="tools.ladder-game.ui.option1">${tr('tools.ladder-game.ui.option1', 'Coffee break')}</option>
                  <option value="lunch" data-i18n="tools.ladder-game.ui.option2">${tr('tools.ladder-game.ui.option2', 'Lunch duty')}</option>
                  <option value="gift" data-i18n="tools.ladder-game.ui.option3">${tr('tools.ladder-game.ui.option3', 'Gift exchange')}</option>
                  <option value="chores" data-i18n="tools.ladder-game.ui.option4">${tr('tools.ladder-game.ui.option4', 'House chores')}</option>
                  <option value="teams" data-i18n="tools.ladder-game.ui.option5">${tr('tools.ladder-game.ui.option5', 'Team assignment')}</option>
                </select>
              </div>
            </div>

            <!-- CSV/Paste Import -->
            <details class="mb-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/40">
              <summary class="px-4 py-3 text-sm font-medium cursor-pointer select-none text-surface-700 dark:text-surface-300" data-i18n="tools.ladder-game.ui.importLabel">${tr('tools.ladder-game.ui.importLabel', 'Bulk Import (CSV / paste)')}</summary>
              <div class="px-4 pb-4 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="text-xs text-surface-500 mb-1 block" data-i18n="tools.ladder-game.ui.importPlayersLabel">${tr('tools.ladder-game.ui.importPlayersLabel', 'Player Names')}</label>
                  <textarea id="import-players" class="input resize-none text-sm" rows="4" data-i18n-placeholder="tools.ladder-game.ui.importPlayersPH" placeholder="${tr('tools.ladder-game.ui.importPlayersPH', 'Alice, Bob, Charlie\nor one per line')}"></textarea>
                </div>
                <div>
                  <label class="text-xs text-surface-500 mb-1 block" data-i18n="tools.ladder-game.ui.importResultsLabel">${tr('tools.ladder-game.ui.importResultsLabel', 'Results')}</label>
                  <textarea id="import-results" class="input resize-none text-sm" rows="4" data-i18n-placeholder="tools.ladder-game.ui.importResultsPH" placeholder="${tr('tools.ladder-game.ui.importResultsPH', 'Prize A, Prize B\nor one per line')}"></textarea>
                </div>
                <div class="sm:col-span-2">
                  <button id="btn-import" type="button" class="btn btn-secondary text-sm" data-i18n="tools.ladder-game.ui.importBtn">${tr('tools.ladder-game.ui.importBtn', 'Apply Import')}</button>
                </div>
              </div>
            </details>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label for="density-select" class="label mb-0" data-i18n="tools.ladder-game.ui.densityLabel">${tr('tools.ladder-game.ui.densityLabel', 'Ladder Density')}</label>
                <select id="density-select" class="input w-full">
                  <option value="light" data-i18n="tools.ladder-game.ui.densityLight">${tr('tools.ladder-game.ui.densityLight', 'Light')}</option>
                  <option value="standard" selected data-i18n="tools.ladder-game.ui.densityStandard">${tr('tools.ladder-game.ui.densityStandard', 'Standard')}</option>
                  <option value="dense" data-i18n="tools.ladder-game.ui.densityDense">${tr('tools.ladder-game.ui.densityDense', 'Dense')}</option>
                </select>
              </div>
              <label class="flex items-start gap-3 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/40 px-4 py-3 text-sm text-surface-700 dark:text-surface-300">
                <input id="secret-results-toggle" type="checkbox" class="mt-1 rounded border-surface-300 text-primary-600 focus:ring-primary-500">
                <span>
                  <span class="font-medium block" data-i18n="tools.ladder-game.ui.secretLabel">${tr('tools.ladder-game.ui.secretLabel', 'Hide bottom results until reveal')}</span>
                  <span class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.ladder-game.ui.secretHint">${tr('tools.ladder-game.ui.secretHint', 'Keep result labels hidden until someone traces or reveals the ladder.')}</span>
                </span>
              </label>
            </div>

            <!-- Avatar Selector -->
            <div class="mb-4">
              <p class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2" data-i18n="tools.ladder-game.ui.avatarLabel">${tr('tools.ladder-game.ui.avatarLabel', 'Player Avatar')}</p>
              <div id="avatar-selector" class="flex flex-wrap gap-1" role="group" aria-label="Avatar selection">
                <!-- Populated by JS -->
              </div>
            </div>

            <div class="space-y-6">
              <!-- Player Names (Top) with drag reorder -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h3 class="label" data-i18n="tools.ladder-game.ui.label2">${tr('tools.ladder-game.ui.label2', 'Players (Top)')}</h3>
                  <span class="text-xs text-surface-400 dark:text-surface-500" data-i18n="tools.ladder-game.ui.dragHint">${tr('tools.ladder-game.ui.dragHint', 'Drag to reorder')}</span>
                </div>
                <div id="players-container" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <!-- Dynamically populated -->
                </div>
              </div>

              <!-- Results (Bottom) -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h3 class="label" data-i18n="tools.ladder-game.ui.label3">${tr('tools.ladder-game.ui.label3', 'Results (Bottom)')}</h3>
                  <button id="btn-undo-rung" type="button" class="text-xs text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300 disabled:opacity-40 disabled:cursor-not-allowed" disabled data-i18n="tools.ladder-game.ui.undoBtn">${tr('tools.ladder-game.ui.undoBtn', 'Undo Last Randomize')}</button>
                </div>
                <div id="results-container" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <!-- Dynamically populated -->
                </div>
              </div>
            </div>

            <div class="flex justify-between mt-8">
              <button id="btn-step-2-back" type="button" class="btn btn-ghost" data-i18n="tools.ladder-game.ui.button1">${tr('tools.ladder-game.ui.button1', 'Back')}</button>
              <button id="btn-step-2-next" type="button" class="btn btn-primary px-8" data-i18n="tools.ladder-game.ui.button2">${tr('tools.ladder-game.ui.button2', 'Start Ladder')}</button>
            </div>
          </div>

          <!-- Step 3: The Ladder Game -->
          <div id="step-3" data-step="3" class="step-panel hidden">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.ladder-game.ui.heading2">${tr('tools.ladder-game.ui.heading2', 'Find Your Path')}</h2>
                <p class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.ladder-game.ui.text3">${tr('tools.ladder-game.ui.text3', 'Click a player name to trace down, or a result to trace up')}</p>
              </div>
              <div class="flex items-center gap-3">
                <!-- Mode badge -->
                <span id="mode-badge" class="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"></span>
                <label class="inline-flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300 select-none cursor-pointer">
                  <input id="sound-toggle" type="checkbox" class="rounded border-surface-300 text-primary-600 focus:ring-primary-500">
                  <span data-i18n="tools.ladder-game.ui.label4">${tr('tools.ladder-game.ui.label4', 'Sound')}</span>
                </label>
              </div>
            </div>

            <!-- Player Names Row (Clickable) -->
            <div id="game-players-row" class="flex justify-center gap-2 sm:gap-4 mb-2 flex-wrap">
              <!-- Dynamically populated -->
            </div>

            <!-- Canvas Container -->
            <div id="ladder-canvas-wrap" class="relative rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/40 overflow-hidden transition-colors duration-300">
              <canvas id="ladder-canvas" class="block w-full" aria-label="Ladder canvas"></canvas>
              <!-- Loading overlay -->
              <div id="ladder-loading" class="absolute inset-0 flex items-center justify-center bg-surface-50/80 dark:bg-surface-900/80 hidden">
                <div class="spinner"></div>
              </div>
            </div>

            <!-- Results Row (Clickable) -->
            <div id="game-results-row" class="flex justify-center gap-2 sm:gap-4 mt-2 flex-wrap">
              <!-- Dynamically populated -->
            </div>

            <!-- Status -->
            <div class="mt-4 text-center">
              <div id="game-status" role="status" aria-live="polite" class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.ladder-game.ui.status0">${tr('tools.ladder-game.ui.status0', 'Click a name to start tracing')}</div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap justify-center gap-3 mt-6">
              <button id="btn-reveal-all" type="button" class="btn btn-secondary" data-i18n="tools.ladder-game.ui.button3">${tr('tools.ladder-game.ui.button3', 'Reveal All')}</button>
              <button id="btn-share-result" type="button" class="btn btn-secondary" data-i18n="tools.ladder-game.ui.shareBtn">${tr('tools.ladder-game.ui.shareBtn', 'Share Result')}</button>
              <button id="btn-play-again" type="button" class="btn btn-primary" data-i18n="tools.ladder-game.ui.button4">${tr('tools.ladder-game.ui.button4', 'Play Again')}</button>
            </div>

            <!-- Tournament Bracket (shown only in tournament mode) -->
            <div id="tournament-bracket" class="mt-6 hidden">
              <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-3 text-center" data-i18n="tools.ladder-game.ui.bracketHeading">${tr('tools.ladder-game.ui.bracketHeading', 'Tournament Bracket')}</h3>
              <div id="bracket-display" class="flex gap-4 overflow-x-auto pb-2"></div>
            </div>

            <!-- Team Scores (shown only in team mode) -->
            <div id="team-scores-display" class="mt-6 hidden">
              <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-3 text-center" data-i18n="tools.ladder-game.ui.teamScoresHeading">${tr('tools.ladder-game.ui.teamScoresHeading', 'Team Scores')}</h3>
              <div id="team-scores-list" class="grid grid-cols-2 sm:grid-cols-4 gap-3"></div>
            </div>

            <!-- Results Summary -->
            <div id="results-summary" class="mt-6 hidden">
              <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-3 text-center" data-i18n="tools.ladder-game.ui.heading3">${tr('tools.ladder-game.ui.heading3', 'Results')}</h3>
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
    <script src="/vendor/game-utils.min.js" integrity="sha384-FsE7cAW0TeEx6c4IRfZ7KJ7b+qRrVYpJD+uwQSrEfw6r5F3nDtNprsKtKpnS8bH0" crossorigin="anonymous"></script>
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

        const TEAM_COLORS = ['#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899'];

        const AVATARS = ['🎯','🎲','🎪','🎨','🎵','🎮','🏆','⭐','🦊','🐉','🌟','🔥','💎','🚀','🌈','🎭'];

        // Presets for quick setup
        // Preset result values resolved from i18n at runtime
        function buildPresets() {
          const _t = window._t || function(k, fb) { return fb; };
          function expand(arr) { return Array.from({ length: 24 }, (_, i) => arr[i % arr.length]); }
          return {
            coffee: { results: expand([_t('tools.ladder-game.ui.presetCoffeeResult0','Pay for coffee'),_t('tools.ladder-game.ui.presetCoffeeResult1','Free pass'),_t('tools.ladder-game.ui.presetCoffeeResult2','Buy next round'),_t('tools.ladder-game.ui.presetCoffeeResult3','Get treated')]) },
            lunch:  { results: expand([_t('tools.ladder-game.ui.presetLunchResult0','Buy lunch'),_t('tools.ladder-game.ui.presetLunchResult1','Wash dishes'),_t('tools.ladder-game.ui.presetLunchResult2','Free pass')]) },
            gift:   { results: expand([_t('tools.ladder-game.ui.presetGiftResult0','Give a gift'),_t('tools.ladder-game.ui.presetGiftResult1','Receive a gift'),_t('tools.ladder-game.ui.presetGiftResult2','Exchange gifts')]) },
            chores: { results: expand([_t('tools.ladder-game.ui.presetChoresResult0','Clean kitchen'),_t('tools.ladder-game.ui.presetChoresResult1','Do laundry'),_t('tools.ladder-game.ui.presetChoresResult2','Vacuum'),_t('tools.ladder-game.ui.presetChoresResult3','Take out trash'),_t('tools.ladder-game.ui.presetChoresResult4','Clean bathroom'),_t('tools.ladder-game.ui.presetChoresResult5','Free pass')]) },
            teams:  { results: expand([_t('tools.ladder-game.ui.presetTeamsResult0','Team A'),_t('tools.ladder-game.ui.presetTeamsResult1','Team B'),_t('tools.ladder-game.ui.presetTeamsResult2','Team C'),_t('tools.ladder-game.ui.presetTeamsResult3','Team D')]) }
          };
        }
        const PRESETS = buildPresets();

        const MODE_DESCS = {
          classic:    window._t ? window._t('tools.ladder-game.ui.modeDescClassic',    'Trace one path at a time to reveal results.') : 'Trace one path at a time to reveal results.',
          speed:      window._t ? window._t('tools.ladder-game.ui.modeDescSpeed',      'All traces run simultaneously — first to finish wins!') : 'All traces run simultaneously — first to finish wins!',
          mystery:    window._t ? window._t('tools.ladder-game.ui.modeDescMystery',    'Rungs are invisible until a trace touches them.') : 'Rungs are invisible until a trace touches them.',
          tournament: window._t ? window._t('tools.ladder-game.ui.modeDescTournament', 'Multi-round elimination bracket.') : 'Multi-round elimination bracket.',
          team:       window._t ? window._t('tools.ladder-game.ui.modeDescTeam',       'Players split into teams; scores aggregated.') : 'Players split into teams; scores aggregated.'
        };

        // Device detection
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
        const MIN_PLAYERS = 2;
        const MAX_PLAYERS = isMobile ? 12 : 24;
        const DEFAULT_PLAYERS = 4;

        // Theme config per mode
        const THEME_CONFIGS = {
          neon: {
            railColor:   (dark) => 'rgba(0,255,200,0.35)',
            rungColor:   (dark) => 'rgba(0,220,255,0.4)',
            bgFrom:      (dark) => dark ? '#0a0a1a' : '#0a0a1a',
            glowMult:    1.6,
            lineWidth:   2,
            rungWidth:   2.5
          },
          pastel: {
            railColor:   (dark) => dark ? 'rgba(180,120,220,0.35)' : 'rgba(180,120,220,0.4)',
            rungColor:   (dark) => dark ? 'rgba(120,180,240,0.45)' : 'rgba(120,180,240,0.5)',
            bgFrom:      (dark) => dark ? '#1e1030' : '#fdf4ff',
            glowMult:    0.6,
            lineWidth:   2,
            rungWidth:   2.5
          },
          corporate: {
            railColor:   (dark) => dark ? 'rgba(148,163,184,0.4)' : 'rgba(71,85,105,0.4)',
            rungColor:   (dark) => dark ? 'rgba(226,232,240,0.35)' : 'rgba(51,65,85,0.5)',
            bgFrom:      (dark) => dark ? '#0f172a' : '#f8fafc',
            glowMult:    0.3,
            lineWidth:   1.5,
            rungWidth:   2
          },
          retro: {
            railColor:   (dark) => 'rgba(0,255,0,0.5)',
            rungColor:   (dark) => 'rgba(255,255,0,0.6)',
            bgFrom:      (dark) => '#000',
            glowMult:    1.2,
            lineWidth:   2,
            rungWidth:   2,
            pixelated:   true
          }
        };

        // State
        const state = {
          step: 1,
          count: DEFAULT_PLAYERS,
          density: 'standard',
          secretResults: false,
          gameMode: 'classic',
          theme: 'neon',
          selectedAvatar: '🎯',
          players: [],
          results: [],
          ladder: null,
          ladderSnapshot: null, // for undo
          geom: null,
          computedPaths: [],
          traces: [],
          particles: [],
          rafId: null,
          isTracing: false,
          revealedResults: new Set(),
          revealedRungs: new Set(), // for mystery mode
          soundEnabled: false,
          prefersReducedMotion: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          // Speed race
          raceFinishOrder: [],
          // Tournament
          tournamentRound: 0,
          tournamentBracket: [],
          tournamentPlayers: [],
          // Team
          teamAssignments: [], // playerIndex -> teamIndex
          teamCount: 2,
          teamScores: []
        };

        // Audio context for sound effects
        const audio = { ctx: null };

        // DOM Elements
        const elLadderPage    = document.querySelector('.ladder-page');
        const elStep1         = document.getElementById('step-1');
        const elStep2         = document.getElementById('step-2');
        const elStep3         = document.getElementById('step-3');
        const elPlayerCount   = document.getElementById('player-count');
        const elDecrement     = document.getElementById('decrement-count');
        const elIncrement     = document.getElementById('increment-count');
        const elBtnStep1Next  = document.getElementById('btn-step-1-next');
        const elBtnStep2Back  = document.getElementById('btn-step-2-back');
        const elBtnStep2Next  = document.getElementById('btn-step-2-next');
        const elBtnImport     = document.getElementById('btn-import');
        const elBtnUndoRung   = document.getElementById('btn-undo-rung');
        const elPlayersContainer = document.getElementById('players-container');
        const elResultsContainer = document.getElementById('results-container');
        const elPresetSelect  = document.getElementById('preset-select');
        const elAvatarSelector = document.getElementById('avatar-selector');
        const elGamePlayersRow = document.getElementById('game-players-row');
        const elGameResultsRow = document.getElementById('game-results-row');
        const elGameStatus    = document.getElementById('game-status');
        const elBtnRevealAll  = document.getElementById('btn-reveal-all');
        const elBtnShare      = document.getElementById('btn-share-result');
        const elBtnPlayAgain  = document.getElementById('btn-play-again');
        const elResultsSummary = document.getElementById('results-summary');
        const elResultsList   = document.getElementById('results-list');
        const elSoundToggle   = document.getElementById('sound-toggle');
        const elModeBadge     = document.getElementById('mode-badge');
        const elModeDesc      = document.getElementById('mode-desc');
        const elTournamentBracket = document.getElementById('tournament-bracket');
        const elBracketDisplay = document.getElementById('bracket-display');
        const elTeamScoresDisplay = document.getElementById('team-scores-display');
        const elTeamScoresList = document.getElementById('team-scores-list');
        const canvasWrap      = document.getElementById('ladder-canvas-wrap');
        const canvas          = document.getElementById('ladder-canvas');
        const ctx             = canvas.getContext('2d');

        // Initialize
        function init() {
          elPlayerCount.max = MAX_PLAYERS;
          resetNames();
          renderAvatarSelector();

          document.addEventListener('click', handleGlobalClick);
          document.addEventListener('input', handleGlobalInput);

          elSoundToggle.addEventListener('change', (e) => {
            state.soundEnabled = e.target.checked;
            if (state.soundEnabled && !audio.ctx) ensureAudioCtx();
          });

          window.addEventListener('keydown', handleKeydown);

          // Touch swipe to start trace (step 3)
          let touchStartX = 0, touchStartY = 0;
          canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
          }, { passive: true });
          canvas.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx) * 1.5 && state.step === 3 && !state.isTracing) {
              // Swipe down triggers trace for first unrevealed player
              const idx = state.computedPaths.findIndex((_, i) => !state.revealedResults.has(i));
              if (idx !== -1) tracePlayer(idx);
            }
          }, { passive: true });

          const resizeObs = new ResizeObserver(() => {
            if (state.step === 3 && state.ladder) resizeCanvasAndRecompute();
          });
          resizeObs.observe(canvas.parentElement);

          const mo = new MutationObserver(() => {
            if (state.step === 3) draw();
          });
          mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        }

        // ============================================
        // AVATAR SELECTOR
        // ============================================

        function renderAvatarSelector() {
          elAvatarSelector.innerHTML = '';
          AVATARS.forEach(emoji => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'avatar-btn' + (emoji === state.selectedAvatar ? ' selected' : '');
            btn.textContent = emoji;
            btn.setAttribute('aria-label', emoji);
            btn.setAttribute('data-avatar', emoji);
            btn.addEventListener('click', () => {
              state.selectedAvatar = emoji;
              elAvatarSelector.querySelectorAll('.avatar-btn').forEach(b => {
                b.classList.toggle('selected', b.getAttribute('data-avatar') === emoji);
              });
            });
            elAvatarSelector.appendChild(btn);
          });
        }

        // ============================================
        // EVENT HANDLERS
        // ============================================

        function handleGlobalClick(e) {
          const target = e.target;

          if (target.closest('#decrement-count')) {
            const newVal = Math.max(MIN_PLAYERS, parseInt(elPlayerCount.value, 10) - 1);
            elPlayerCount.value = newVal;
            state.count = newVal;
          }

          if (target.closest('#increment-count')) {
            const newVal = Math.min(MAX_PLAYERS, parseInt(elPlayerCount.value, 10) + 1);
            elPlayerCount.value = newVal;
            state.count = newVal;
          }

          if (target.closest('#btn-step-1-next')) {
            state.count = parseInt(elPlayerCount.value, 10) || DEFAULT_PLAYERS;
            goToStep(2);
          }

          if (target.closest('#btn-step-2-back')) {
            goToStep(1);
          }

          if (target.closest('#btn-step-2-next')) {
            collectNamesAndResults();
            goToStep(3);
            initGame();
          }

          if (target.closest('#btn-import')) {
            applyImport();
          }

          if (target.closest('#btn-undo-rung')) {
            undoLadder();
          }

          if (target.closest('#btn-reveal-all')) {
            revealAll();
          }

          if (target.closest('#btn-share-result')) {
            shareResult();
          }

          if (target.closest('#btn-play-again')) {
            resetGame();
            goToStep(1);
          }

          // Mode tab selection (step 1)
          const modeTab = target.closest('[data-mode]');
          if (modeTab && elStep1 && !elStep1.classList.contains('hidden')) {
            state.gameMode = modeTab.getAttribute('data-mode');
            elStep1.querySelectorAll('[data-mode]').forEach(b => {
              b.classList.toggle('active', b === modeTab);
            });
            if (elModeDesc) elModeDesc.textContent = MODE_DESCS[state.gameMode] || '';
          }

          // Theme tab selection
          const themePick = target.closest('[data-theme-pick]');
          if (themePick) {
            state.theme = themePick.getAttribute('data-theme-pick');
            elStep1.querySelectorAll('[data-theme-pick]').forEach(b => {
              b.classList.toggle('active', b === themePick);
            });
            elLadderPage.setAttribute('data-theme', state.theme);
          }

          // Game: Click player name to trace
          const playerBtn = target.closest('[data-player-index]');
          if (playerBtn && elStep3 && !elStep3.classList.contains('hidden')) {
            const idx = parseInt(playerBtn.getAttribute('data-player-index'), 10);
            if (!state.isTracing && state.ladder && state.gameMode !== 'speed') {
              tracePlayer(idx);
            }
          }

          // Game: Click result to trace up
          const resultBtn = target.closest('[data-result-index]');
          if (resultBtn && elStep3 && !elStep3.classList.contains('hidden')) {
            const idx = parseInt(resultBtn.getAttribute('data-result-index'), 10);
            if (!state.isTracing && state.ladder && state.gameMode === 'classic') {
              traceResult(idx);
            }
          }
        }

        function handleGlobalInput(e) {
          const target = e.target;

          if (target.id === 'player-count') {
            let val = parseInt(target.value, 10);
            if (Number.isFinite(val)) {
              val = clamp(val, MIN_PLAYERS, MAX_PLAYERS);
              state.count = val;
            }
          }

          if (target.id === 'preset-select') {
            applyPreset(target.value);
          }

          if (target.id === 'density-select') {
            state.density = target.value || 'standard';
          }

          if (target.id === 'secret-results-toggle') {
            state.secretResults = !!target.checked;
          }
        }

        function handleKeydown(e) {
          if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
            return;
          }

          if (e.key === 'Enter') {
            e.preventDefault();
            if (state.step === 1) elBtnStep1Next.click();
            else if (state.step === 2) elBtnStep2Next.click();
            else if (state.step === 3 && !state.isTracing) {
              // Enter in game: trace next unrevealed or speed-start
              if (state.gameMode === 'speed') startSpeedRace();
              else {
                const idx = state.computedPaths.findIndex((_, i) => !state.revealedResults.has(i));
                if (idx !== -1) tracePlayer(idx);
              }
            }
          }

          if (e.key === 'r' || e.key === 'R') {
            if (state.step === 2) {
              // Re-randomize results order
              shuffleResults();
            }
          }

          if (e.key === 'Escape') {
            if (state.step === 3) { resetGame(); goToStep(1); }
            else if (state.step === 2) goToStep(1);
          }
        }

        // ============================================
        // STEP NAVIGATION
        // ============================================

        function goToStep(step) {
          state.step = step;
          elStep1.classList.toggle('hidden', step !== 1);
          elStep2.classList.toggle('hidden', step !== 2);
          elStep3.classList.toggle('hidden', step !== 3);

          if (step === 2) renderStep2();
          else if (step === 3) renderStep3();
        }

        function resetNames() {
          state.players = [];
          state.results = [];
          for (let i = 0; i < MAX_PLAYERS; i++) {
            state.players.push((window._t ? window._t('tools.ladder-game.js.text0', 'Player') : 'Player') + ' ' + (i + 1));
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const suffix = letters[i % letters.length] || String(i + 1);
            state.results.push((window._t ? window._t('tools.ladder-game.js.text1', 'Result') : 'Result') + ' ' + suffix);
          }
        }

        // ============================================
        // STEP 2: RENDER + DRAG-AND-DROP
        // ============================================

        function renderStep2() {
          elPlayersContainer.innerHTML = '';
          elResultsContainer.innerHTML = '';

          for (let i = 0; i < state.count; i++) {
            // Player input with drag handle
            const pWrap = document.createElement('div');
            pWrap.className = 'flex flex-col draggable-row';
            pWrap.draggable = true;
            pWrap.dataset.dragIndex = i;
            pWrap.dataset.dragType = 'player';
            pWrap.innerHTML =
              '<label class="text-xs text-surface-500 dark:text-surface-400 mb-1 flex items-center gap-1">' +
              '<span class="cursor-grab text-surface-300 dark:text-surface-600 select-none" aria-hidden="true">&#9776;</span>' +
              '<span data-i18n="tools.ladder-game.ui.label6">' + (window._t ? window._t('tools.ladder-game.js.tpl0', 'Player') : 'Player') + ' ' + (i + 1) + '</span></label>' +
              '<div class="flex gap-1 items-center">' +
              '<span class="text-base select-none" aria-hidden="true">' + state.selectedAvatar + '</span>' +
              '<input type="text" class="input flex-1 player-name-input" data-index="' + i + '" value="' + escapeHtml(state.players[i]) + '" placeholder="' + (window._t ? window._t('tools.ladder-game.ui.placeholder0', 'Name') : 'Name') + '" data-i18n-placeholder="tools.ladder-game.ui.placeholder0">' +
              '</div>';
            elPlayersContainer.appendChild(pWrap);

            // Result input
            const rWrap = document.createElement('div');
            rWrap.className = 'flex flex-col';
            rWrap.innerHTML =
              '<label class="text-xs text-surface-500 dark:text-surface-400 mb-1"><span data-i18n="tools.ladder-game.ui.label7">' + (window._t ? window._t('tools.ladder-game.js.tpl1', 'Result') : 'Result') + ' ' + (i + 1) + '</span></label>' +
              '<input type="text" class="input result-input" data-index="' + i + '" value="' + escapeHtml(state.results[i]) + '" placeholder="' + (window._t ? window._t('tools.ladder-game.ui.placeholder1', 'Result') : 'Result') + '" data-i18n-placeholder="tools.ladder-game.ui.placeholder1">';
            elResultsContainer.appendChild(rWrap);
          }

          // Set up drag-and-drop for player rows
          setupDragDrop(elPlayersContainer, 'player');
        }

        function setupDragDrop(container, type) {
          let dragSrcIndex = null;

          container.addEventListener('dragstart', (e) => {
            const row = e.target.closest('.draggable-row');
            if (!row) return;
            dragSrcIndex = parseInt(row.dataset.dragIndex, 10);
            row.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
          });

          container.addEventListener('dragend', (e) => {
            container.querySelectorAll('.draggable-row').forEach(r => {
              r.classList.remove('dragging', 'drag-over');
            });
            dragSrcIndex = null;
          });

          container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const row = e.target.closest('.draggable-row');
            if (!row) return;
            container.querySelectorAll('.draggable-row').forEach(r => r.classList.remove('drag-over'));
            row.classList.add('drag-over');
          });

          container.addEventListener('drop', (e) => {
            e.preventDefault();
            const row = e.target.closest('.draggable-row');
            if (!row || dragSrcIndex === null) return;
            const dropIndex = parseInt(row.dataset.dragIndex, 10);
            if (dragSrcIndex === dropIndex) return;

            // First collect current input values
            collectNamesAndResults();

            // Swap in state
            if (type === 'player') {
              const tmp = state.players[dragSrcIndex];
              state.players[dragSrcIndex] = state.players[dropIndex];
              state.players[dropIndex] = tmp;
            }

            // Re-render
            renderStep2();
          });
        }

        function collectNamesAndResults() {
          const playerInputs = elPlayersContainer.querySelectorAll('.player-name-input');
          const resultInputs = elResultsContainer.querySelectorAll('.result-input');

          for (let i = 0; i < state.count; i++) {
            if (playerInputs[i]) state.players[i] = (playerInputs[i].value || state.players[i]).trim();
            if (resultInputs[i]) state.results[i] = (resultInputs[i].value || state.results[i]).trim();
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

        function applyImport() {
          const playersRaw = document.getElementById('import-players')?.value || '';
          const resultsRaw = document.getElementById('import-results')?.value || '';

          const parseCsv = (raw) => raw
            .split(/[,\\n\\t]+/)
            .map(s => s.trim())
            .filter(Boolean);

          const pNames = parseCsv(playersRaw);
          const rNames = parseCsv(resultsRaw);

          if (pNames.length > 0) {
            const newCount = Math.min(clamp(pNames.length, MIN_PLAYERS, MAX_PLAYERS), MAX_PLAYERS);
            state.count = newCount;
            elPlayerCount.value = newCount;
            for (let i = 0; i < newCount; i++) {
              state.players[i] = pNames[i] || state.players[i];
            }
          }

          if (rNames.length > 0) {
            for (let i = 0; i < state.count; i++) {
              state.results[i] = rNames[i % rNames.length] || state.results[i];
            }
          }

          renderStep2();
        }

        function shuffleResults() {
          collectNamesAndResults();
          // Fisher-Yates shuffle of results
          const arr = state.results.slice(0, state.count);
          for (let i = arr.length - 1; i > 0; i--) {
            const j = randInt(i + 1);
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
          }
          for (let i = 0; i < state.count; i++) state.results[i] = arr[i];
          renderStep2();
        }

        function undoLadder() {
          if (!state.ladderSnapshot) return;
          state.ladder = JSON.parse(JSON.stringify(state.ladderSnapshot));
          state.ladderSnapshot = null;
          elBtnUndoRung.disabled = true;
          computePaths();
          resizeCanvasAndRecompute();
        }

        // ============================================
        // STEP 3: RENDER
        // ============================================

        function renderStep3() {
          elGamePlayersRow.innerHTML = '';
          elGameResultsRow.innerHTML = '';

          const colWidth = Math.min(120, Math.max(60, Math.floor(600 / state.count)));

          for (let i = 0; i < state.count; i++) {
            // Player button (with avatar)
            const pBtn = document.createElement('button');
            pBtn.type = 'button';
            pBtn.className = 'player-btn px-2 py-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium text-sm hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-0.5';
            pBtn.style.width = colWidth + 'px';
            pBtn.style.minWidth = '60px';
            const avatarSpan = document.createElement('span');
            avatarSpan.className = 'text-lg leading-none';
            avatarSpan.textContent = state.selectedAvatar;
            avatarSpan.setAttribute('aria-hidden', 'true');
            const nameSpan = document.createElement('span');
            nameSpan.className = 'truncate w-full text-center';
            nameSpan.textContent = state.players[i];
            pBtn.appendChild(avatarSpan);
            pBtn.appendChild(nameSpan);
            pBtn.setAttribute('data-player-index', i);
            pBtn.setAttribute('aria-label', (window._t ? window._t('tools.ladder-game.js.text2', 'Trace') : 'Trace') + ': ' + state.players[i]);

            // Team color indicator in team mode
            if (state.gameMode === 'team') {
              const teamIdx = i % state.teamCount;
              pBtn.style.borderLeft = '4px solid ' + TEAM_COLORS[teamIdx % TEAM_COLORS.length];
            }

            elGamePlayersRow.appendChild(pBtn);

            // Result button
            const rBtn = document.createElement('button');
            rBtn.type = 'button';
            rBtn.className = 'result-btn px-2 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 font-medium text-sm hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
            rBtn.style.width = colWidth + 'px';
            rBtn.style.minWidth = '60px';
            rBtn.textContent = state.secretResults && !state.revealedResults.has(i)
              ? '?'
              : state.results[i];
            rBtn.setAttribute('data-result-index', i);
            rBtn.setAttribute('aria-label', (window._t ? window._t('tools.ladder-game.js.text3', 'Trace up from') : 'Trace up from') + ': ' + state.results[i]);
            elGameResultsRow.appendChild(rBtn);
          }

          // Mode badge
          const modeNames = { classic:'Classic', speed:'Speed Race', mystery:'Mystery', tournament:'Tournament', team:'Team' };
          if (elModeBadge) elModeBadge.textContent = modeNames[state.gameMode] || state.gameMode;
        }

        // ============================================
        // GAME INIT
        // ============================================

        function initGame() {
          state.revealedResults.clear();
          state.revealedRungs.clear();
          state.traces = [];
          state.particles = [];
          state.raceFinishOrder = [];
          stopAnimationLoop();
          elResultsSummary.classList.add('hidden');
          elResultsList.innerHTML = '';

          // Hide mode-specific panels
          elTournamentBracket.classList.add('hidden');
          elTeamScoresDisplay.classList.add('hidden');

          const statusDefault = window._t ? window._t('tools.ladder-game.ui.status0', 'Click a name to start tracing') : 'Click a name to start tracing';
          setGameStatus(statusDefault);

          // Snapshot before generating (to allow undo)
          state.ladderSnapshot = null;
          generateLadder();
          computeGeometry();
          computePaths();
          resizeCanvasAndRecompute();

          // Mode-specific init
          if (state.gameMode === 'tournament') initTournament();
          if (state.gameMode === 'team') initTeamMode();
          if (state.gameMode === 'speed') {
            setGameStatus(window._t ? window._t('tools.ladder-game.ui.statusSpeedReady', 'Press Enter or click any player to start the race!') : 'Press Enter or click any player to start the race!');
          }

          updateButtonStates();
        }

        function resetGame() {
          state.ladder = null;
          state.ladderSnapshot = null;
          state.computedPaths = [];
          state.traces = [];
          state.particles = [];
          state.revealedResults.clear();
          state.revealedRungs.clear();
          state.raceFinishOrder = [];
          stopAnimationLoop();
          resetNames();
          if (elPresetSelect) elPresetSelect.value = '';
          if (elBtnUndoRung) elBtnUndoRung.disabled = true;
        }

        // ============================================
        // TOURNAMENT MODE
        // ============================================

        function initTournament() {
          // Initialize players list for tournament
          state.tournamentPlayers = Array.from({ length: state.count }, (_, i) => i);
          state.tournamentRound = 0;
          state.tournamentBracket = [];
          elTournamentBracket.classList.remove('hidden');
          renderBracket();
          setGameStatus(window._t ? window._t('tools.ladder-game.ui.statusTournament', 'Tournament mode: trace pairs to eliminate!') : 'Tournament mode: trace pairs to eliminate!');
        }

        function renderBracket() {
          if (!elBracketDisplay) return;
          elBracketDisplay.innerHTML = '';

          for (let r = 0; r < state.tournamentBracket.length; r++) {
            const roundDiv = document.createElement('div');
            roundDiv.className = 'bracket-round gap-3';
            const round = state.tournamentBracket[r];
            round.forEach(match => {
              const matchDiv = document.createElement('div');
              matchDiv.className = 'bracket-match';
              match.players.forEach((pIdx, i) => {
                const span = document.createElement('span');
                span.textContent = state.players[pIdx] || ('P' + (pIdx + 1));
                if (match.winner === pIdx) span.className = 'winner';
                matchDiv.appendChild(span);
              });
              roundDiv.appendChild(matchDiv);
            });
            elBracketDisplay.appendChild(roundDiv);
          }
        }

        // ============================================
        // TEAM MODE
        // ============================================

        function initTeamMode() {
          state.teamCount = Math.min(4, Math.max(2, Math.floor(state.count / 2)));
          state.teamAssignments = Array.from({ length: state.count }, (_, i) => i % state.teamCount);
          state.teamScores = new Array(state.teamCount).fill(0);

          elTeamScoresDisplay.classList.remove('hidden');
          renderTeamScores();
          setGameStatus(window._t ? window._t('tools.ladder-game.ui.statusTeam', 'Team mode: trace all players to see team scores!') : 'Team mode: trace all players to see team scores!');
        }

        function renderTeamScores() {
          elTeamScoresList.innerHTML = '';
          const teamNames = ['Alpha','Beta','Gamma','Delta','Epsilon','Zeta'];
          for (let t = 0; t < state.teamCount; t++) {
            const div = document.createElement('div');
            div.className = 'p-3 rounded-lg border border-surface-200 dark:border-surface-700 text-center';
            div.innerHTML =
              '<div class="flex items-center justify-center gap-2 mb-1">' +
              '<span class="team-swatch" style="background:' + TEAM_COLORS[t % TEAM_COLORS.length] + '"></span>' +
              '<span class="font-semibold text-sm">' + (teamNames[t] || ('Team ' + (t + 1))) + '</span>' +
              '</div>' +
              '<div class="text-2xl font-bold text-surface-900 dark:text-surface-100">' + state.teamScores[t] + '</div>';
            elTeamScoresList.appendChild(div);
          }
        }

        // ============================================
        // LADDER GENERATION
        // ============================================

        function ladderParams() {
          const count = state.count;
          const profile = state.density === 'light'
            ? { rowBase: 16, rowScale: 1.5, rungMin: 2, rungMax: 4, tryP: count <= 3 ? 0.18 : 0.14 }
            : state.density === 'dense'
              ? { rowBase: 24, rowScale: 2.5, rungMin: 4, rungMax: 7, tryP: count <= 3 ? 0.28 : 0.22 }
              : { rowBase: 20, rowScale: 2, rungMin: 3, rungMax: 6, tryP: count <= 3 ? 0.22 : 0.18 };
          const rows = clamp(Math.round(profile.rowBase + count * profile.rowScale), 18, 44);
          return { rows, rungMin: profile.rungMin, rungMax: profile.rungMax, tryP: profile.tryP };
        }

        function generateLadder() {
          const count = state.count;
          const { rows, rungMin: minPerPair, rungMax: maxPerPair, tryP } = ladderParams();
          const rungsByRow = new Array(rows).fill(null).map(() => []);

          for (let row = 0; row < rows; row++) {
            let prevPlaced = false;
            for (let col = 0; col < count - 1; col++) {
              if (randFloat() >= tryP) { prevPlaced = false; continue; }
              if (prevPlaced) continue;
              if (rungsByRow[row].includes(col - 1) || rungsByRow[row].includes(col + 1)) continue;
              rungsByRow[row].push(col);
              prevPlaced = true;
            }
          }

          const counts = new Array(count - 1).fill(0);
          for (let row = 0; row < rows; row++) {
            for (let i = 0; i < rungsByRow[row].length; i++) counts[rungsByRow[row][i]]++;
          }

          function canPlace(row, col) {
            if (row < 0 || row >= rows) return false;
            if (col < 0 || col >= count - 1) return false;
            if (rungsByRow[row].includes(col)) return false;
            if (rungsByRow[row].includes(col - 1) || rungsByRow[row].includes(col + 1)) return false;
            return true;
          }

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

          for (let col = 0; col < count - 1; col++) {
            if (counts[col] <= maxPerPair) continue;
            const positions = [];
            for (let row = 0; row < rows; row++) {
              if (rungsByRow[row].includes(col)) positions.push(row);
            }
            while (counts[col] > maxPerPair && positions.length) {
              const idx = randInt(positions.length);
              const row = positions.splice(idx, 1)[0];
              const at = rungsByRow[row].indexOf(col);
              if (at >= 0) { rungsByRow[row].splice(at, 1); counts[col]--; }
            }
          }

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
          const yTop = 44;
          const yBottom = h - 44;
          const ladderHeight = Math.max(120, yBottom - yTop);
          const count = state.count;
          const xSpan = Math.max(20, w - paddingX * 2);
          const step = count > 1 ? (xSpan / (count - 1)) : 0;
          const xForCol = (c) => paddingX + step * c;

          state.geom = { w, h, paddingX, topTextY: 20, bottomTextY: h - 14, yTop, yBottom, ladderHeight, xForCol };
        }

        // ============================================
        // PATH TRACING
        // ============================================

        function computePaths() {
          if (!state.ladder || !state.geom) { state.computedPaths = []; return; }

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
              if (rungCols.includes(col)) delta = 1;
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

          const oldPaths = state.computedPaths;
          computePaths();

          if (oldPaths.length && state.traces.length) {
            for (let i = 0; i < state.traces.length; i++) {
              const tr = state.traces[i];
              const oldLen = oldPaths[tr.playerIndex]?.length;
              const newLen = state.computedPaths[tr.playerIndex]?.length;
              if (oldLen && newLen) {
                const ratio = clamp(tr.progress / oldLen, 0, 1);
                tr.progress = ratio * newLen;
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
          state.traces = [{ playerIndex, color, progress: 0, done: false, reverse: false }];

          const tracingMsg = window._t ? window._t('tools.ladder-game.js.status1', 'Tracing...') : 'Tracing...';
          setGameStatus(tracingMsg);
          startAnimationLoop();
        }

        function traceResult(resultIndex) {
          if (state.isTracing) return;

          const playerIndex = state.computedPaths.findIndex(p => p.endCol === resultIndex);
          if (playerIndex === -1) return;
          if (state.revealedResults.has(playerIndex)) return;

          state.isTracing = true;
          updateButtonStates();

          const color = COLOR_PALETTE[playerIndex % COLOR_PALETTE.length];
          state.traces = [{ playerIndex, color, progress: 0, done: false, reverse: true, resultIndex }];

          const tracingMsg = window._t ? window._t('tools.ladder-game.js.status1', 'Tracing...') : 'Tracing...';
          setGameStatus(tracingMsg);
          startAnimationLoop();
        }

        function startSpeedRace() {
          if (state.isTracing) return;
          state.isTracing = true;
          state.raceFinishOrder = [];
          updateButtonStates();

          const traces = [];
          for (let i = 0; i < state.count; i++) {
            if (!state.revealedResults.has(i)) {
              traces.push({
                playerIndex: i,
                color: COLOR_PALETTE[i % COLOR_PALETTE.length],
                progress: 0,
                done: false,
                reverse: false,
                isRace: true
              });
            }
          }

          state.traces = traces;
          const raceMsg = window._t ? window._t('tools.ladder-game.ui.statusRacing', 'Race in progress...') : 'Race in progress...';
          setGameStatus(raceMsg);
          startAnimationLoop();
        }

        function revealAll() {
          if (state.isTracing) return;

          if (state.gameMode === 'speed') {
            startSpeedRace();
            return;
          }

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
          const revealMsg = window._t ? window._t('tools.ladder-game.js.status1', 'Revealing all...') : 'Revealing all...';
          setGameStatus(revealMsg);
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
              const tr = state.traces[i];
              const path = state.computedPaths[tr.playerIndex];
              if (!path) continue;
              if (tr.done) continue;

              anyActive = true;
              const ratio = path.length > 0 ? tr.progress / path.length : 0;
              const speedMult = ratio > 0.85 ? 0.6 : 1.0;
              tr.progress += baseSpeed * speedMult * dt;

              if (tr.progress >= path.length) {
                tr.progress = path.length;
                tr.done = true;
                onTraceComplete(tr);
              } else if (state.gameMode === 'mystery') {
                // Reveal rungs as trace passes through them
                revealMysteryRungs(tr);
              }
            }

            // Spawn particles for active traces
            if (!state.prefersReducedMotion) {
              spawnParticles();
              updateParticles(dt);
            }

            draw();

            if (anyActive) {
              state.rafId = requestAnimationFrame(tick);
            } else {
              stopAnimationLoop();
              state.isTracing = false;
              updateButtonStates();
              showResultsSummary();

              if (state.gameMode === 'team') updateTeamScores();
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

        function revealMysteryRungs(tr) {
          const path = state.computedPaths[tr.playerIndex];
          if (!path) return;
          const g = state.geom;
          const { rows, rungsByRow } = state.ladder;
          const rowYs = new Array(rows);
          for (let r = 0; r < rows; r++) {
            rowYs[r] = g.yTop + ((r + 1) * g.ladderHeight) / (rows + 1);
          }

          // Current position y
          const pos = getPositionAtDist(path.points, tr.progress);
          for (let r = 0; r < rows; r++) {
            if (pos.y >= rowYs[r] - 2) {
              const cols = rungsByRow[r];
              cols.forEach(col => {
                const key = r + '_' + col;
                state.revealedRungs.add(key);
              });
            }
          }
        }

        function onTraceComplete(trace) {
          const path = state.computedPaths[trace.playerIndex];
          if (!path) return;

          state.revealedResults.add(trace.playerIndex);

          // Speed race finish order
          if (trace.isRace) {
            state.raceFinishOrder.push(trace.playerIndex);
            if (state.raceFinishOrder.length === 1) {
              // Winner!
              const winnerBtn = elGamePlayersRow.querySelector('[data-player-index="' + trace.playerIndex + '"]');
              if (winnerBtn) winnerBtn.classList.add('finish-pop');
              const winMsg = state.players[trace.playerIndex] + ' ' + (window._t ? window._t('tools.ladder-game.ui.raceWinner', 'wins the race!') : 'wins the race!');
              setGameStatus(winMsg);
            }
          }

          // Highlight the result
          const resultBtn = elGameResultsRow.querySelector('[data-result-index="' + path.endCol + '"]');
          if (resultBtn) {
            resultBtn.classList.add('ring-2', 'ring-primary-500', 'dark:ring-primary-400', 'result-revealed');
            resultBtn.textContent = state.results[path.endCol];
          }

          // Highlight the player
          const playerBtn = elGamePlayersRow.querySelector('[data-player-index="' + trace.playerIndex + '"]');
          if (playerBtn) {
            playerBtn.classList.add('ring-2', 'ring-primary-500', 'dark:ring-primary-400');
            playerBtn.disabled = true;
          }

          if (state.soundEnabled && !state.prefersReducedMotion) {
            if (trace.isRace && state.raceFinishOrder.length === 1) {
              playFanfareSound();
            } else {
              playCompletionSound();
            }
          }

          if (!trace.isRace) {
            setGameStatus(state.players[trace.playerIndex] + ' \u2192 ' + state.results[path.endCol]);
          }
        }

        function updateButtonStates() {
          const playerBtns = elGamePlayersRow.querySelectorAll('[data-player-index]');
          const resultBtns = elGameResultsRow.querySelectorAll('[data-result-index]');

          playerBtns.forEach((btn, i) => {
            btn.disabled = state.isTracing || state.revealedResults.has(i);
          });

          resultBtns.forEach((btn) => {
            const isDisabled = state.isTracing || state.gameMode !== 'classic';
            btn.disabled = isDisabled;
            if (state.gameMode !== 'classic' && !state.isTracing) {
              btn.title = window._t ? window._t('tools.ladder-game.ui.traceUpDisabledHint', 'Trace-up is only available in Classic mode') : 'Trace-up is only available in Classic mode';
            } else {
              btn.removeAttribute('title');
            }
          });

          if (elBtnRevealAll) {
            elBtnRevealAll.disabled = state.isTracing || state.revealedResults.size >= state.count;
          }
          if (elBtnShare) {
            elBtnShare.disabled = state.revealedResults.size === 0;
          }
        }

        function updateTeamScores() {
          state.teamScores = new Array(state.teamCount).fill(0);
          for (const playerIdx of state.revealedResults) {
            const teamIdx = state.teamAssignments[playerIdx];
            const path = state.computedPaths[playerIdx];
            if (!path) continue;
            // Score: positional value (position 0 = count pts)
            const resultIdx = path.endCol;
            const score = state.count - resultIdx;
            state.teamScores[teamIdx] = (state.teamScores[teamIdx] || 0) + score;
          }
          renderTeamScores();
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
            let teamBadge = '';
            if (state.gameMode === 'team') {
              const teamIdx = state.teamAssignments[playerIdx];
              teamBadge = '<span class="team-swatch ml-1" style="background:' + TEAM_COLORS[teamIdx % TEAM_COLORS.length] + '"></span>';
            }

            const item = document.createElement('div');
            item.className = 'flex items-center gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700';
            item.innerHTML =
              '<div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ' + color + '"></div>' +
              '<div class="flex-1 min-w-0">' +
              '<div class="font-medium text-surface-900 dark:text-surface-100 truncate flex items-center gap-1">' +
              '<span>' + state.selectedAvatar + '</span>' +
              '<span>' + escapeHtml(state.players[playerIdx]) + '</span>' +
              teamBadge +
              '</div>' +
              '<div class="text-xs text-surface-500 dark:text-surface-400">' + (window._t ? window._t('tools.ladder-game.js.text4', 'gets') : 'gets') + '</div>' +
              '</div>' +
              '<div class="font-semibold text-primary-600 dark:text-primary-400">' + escapeHtml(state.results[resultIdx]) + '</div>';
            elResultsList.appendChild(item);
          }
        }

        // ============================================
        // PARTICLES
        // ============================================

        function spawnParticles() {
          for (let i = 0; i < state.traces.length; i++) {
            const tr = state.traces[i];
            if (tr.done || tr.progress <= 0) continue;
            const path = state.computedPaths[tr.playerIndex];
            if (!path) continue;
            const pos = getPositionAtDist(path.points, tr.progress);
            if (Math.random() < 0.35) {
              state.particles.push({
                x: pos.x + (Math.random() - 0.5) * 6,
                y: pos.y + (Math.random() - 0.5) * 6,
                vx: (Math.random() - 0.5) * 30,
                vy: (Math.random() - 0.5) * 30,
                life: 0.4 + Math.random() * 0.3,
                maxLife: 0.5,
                color: tr.color,
                size: 1.5 + Math.random() * 2
              });
            }
          }
        }

        function updateParticles(dt) {
          for (let i = state.particles.length - 1; i >= 0; i--) {
            const p = state.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) state.particles.splice(i, 1);
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
          drawParticles();
        }

        function drawBackground() {
          const g = state.geom;
          const thCfg = THEME_CONFIGS[state.theme] || THEME_CONFIGS.neon;
          const dark = isDarkMode();

          const bgColor = thCfg.bgFrom(dark);
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, g.w, g.h);
        }

        function drawLadder() {
          if (!state.ladder || !state.geom) return;

          const g = state.geom;
          const { rows, rungsByRow } = state.ladder;
          const thCfg = THEME_CONFIGS[state.theme] || THEME_CONFIGS.neon;
          const dark = isDarkMode();
          const count = state.count;

          const lineColor = thCfg.railColor(dark);
          const rungColor = thCfg.rungColor(dark);

          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          if (thCfg.pixelated) {
            ctx.imageSmoothingEnabled = false;
          } else {
            ctx.imageSmoothingEnabled = true;
          }

          const rowYs = new Array(rows);
          for (let r = 0; r < rows; r++) {
            rowYs[r] = g.yTop + ((r + 1) * g.ladderHeight) / (rows + 1);
          }

          // Draw vertical rails with subtle glow for neon/retro
          ctx.save();
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = thCfg.lineWidth;
          if (state.theme === 'neon' || state.theme === 'retro') {
            ctx.shadowBlur = 6;
            ctx.shadowColor = lineColor;
          }
          for (let i = 0; i < count; i++) {
            const x = g.xForCol(i);
            ctx.beginPath();
            ctx.moveTo(x, g.yTop);
            ctx.lineTo(x, g.yBottom);
            ctx.stroke();
          }
          ctx.restore();

          // Draw horizontal rungs
          ctx.save();
          ctx.strokeStyle = rungColor;
          ctx.lineWidth = thCfg.rungWidth;
          if (state.theme === 'neon' || state.theme === 'retro') {
            ctx.shadowBlur = 8;
            ctx.shadowColor = rungColor;
          }

          for (let row = 0; row < rows; row++) {
            const y = rowYs[row];
            const cols = rungsByRow[row];
            for (let i = 0; i < cols.length; i++) {
              const c = cols[i];
              const key = row + '_' + c;

              // Mystery mode: only show revealed rungs
              if (state.gameMode === 'mystery' && !state.revealedRungs.has(key)) {
                continue;
              }

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

          const thCfg = THEME_CONFIGS[state.theme] || THEME_CONFIGS.neon;
          const dark = isDarkMode();
          const glow = (dark ? 14 : 10) * thCfg.glowMult;

          for (let i = 0; i < state.traces.length; i++) {
            const tr = state.traces[i];
            const path = state.computedPaths[tr.playerIndex];
            if (!path) continue;

            const points = path.points;
            const color = tr.color;

            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 4.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 0.95;
            ctx.shadowBlur = glow;
            ctx.shadowColor = color;
            drawTracePartial(points, tr.progress);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            ctx.lineWidth = 3;
            drawTracePartial(points, tr.progress);
            ctx.restore();

            // Draw tracer dot with outer glow ring
            if (!tr.done && tr.progress > 0) {
              const pos = getPositionAtDist(points, tr.progress);
              ctx.save();
              // Outer glow ring
              ctx.beginPath();
              ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
              ctx.fillStyle = color;
              ctx.globalAlpha = 0.2;
              ctx.fill();
              // Inner dot
              ctx.globalAlpha = 1;
              ctx.beginPath();
              ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
              ctx.fillStyle = color;
              ctx.shadowBlur = 15 * thCfg.glowMult;
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

        function drawParticles() {
          if (!state.particles.length) return;

          ctx.save();
          for (let i = 0; i < state.particles.length; i++) {
            const p = state.particles[i];
            const alpha = Math.max(0, p.life / p.maxLife) * 0.8;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
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
        // SHARE RESULT
        // ============================================

        function shareResult() {
          if (state.revealedResults.size === 0) return;

          try {
            const shareCanvas = document.createElement('canvas');
            const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
            const w = Math.min(canvas.width / dpr, 640);
            const h = Math.min(canvas.height / dpr, 480);
            shareCanvas.width = w * dpr;
            shareCanvas.height = h * dpr;
            const sctx = shareCanvas.getContext('2d');
            sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            // Draw current canvas state
            sctx.drawImage(canvas, 0, 0, w, h);

            shareCanvas.toBlob((blob) => {
              if (!blob) return;
              try {
                const file = new File([blob], 'ladder-result.png', { type: 'image/png' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                  navigator.share({ files: [file], title: 'Ladder Game Result' }).catch(() => {});
                  return;
                }
              } catch (err) {}
              // Fallback: download
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'ladder-result.png';
              a.click();
              URL.revokeObjectURL(url);
            }, 'image/png');

            // Brief success feedback
            if (elBtnShare) {
              const orig = elBtnShare.textContent;
              elBtnShare.classList.add('share-success');
              elBtnShare.textContent = window._t ? window._t('tools.ladder-game.ui.shareSuccess', 'Saved!') : 'Saved!';
              setTimeout(() => {
                elBtnShare.textContent = orig;
                elBtnShare.classList.remove('share-success');
              }, 2000);
            }
          } catch (err) {}
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

        function playFanfareSound() {
          const c = ensureAudioCtx();
          if (!c) return;
          try {
            const t0 = c.currentTime;
            const notes   = [523, 659, 784, 1047, 1319, 1047, 1319];
            const delays  = [0,   80,  160, 240,  360,  440,  520];
            const gains   = [0.1, 0.1, 0.1, 0.12, 0.15, 0.1, 0.18];
            for (let i = 0; i < notes.length; i++) {
              const o = c.createOscillator();
              const g = c.createGain();
              o.type = 'triangle';
              o.frequency.value = notes[i];
              g.gain.setValueAtTime(0, t0 + delays[i] / 1000);
              g.gain.linearRampToValueAtTime(gains[i], t0 + delays[i] / 1000 + 0.02);
              g.gain.exponentialRampToValueAtTime(0.001, t0 + delays[i] / 1000 + 0.25);
              o.connect(g);
              g.connect(c.destination);
              o.start(t0 + delays[i] / 1000);
              o.stop(t0 + delays[i] / 1000 + 0.3);
            }
          } catch (e) {}
        }

        function playTickSound() {
          const c = ensureAudioCtx();
          if (!c) return;
          try {
            const o = c.createOscillator();
            const g = c.createGain();
            o.type = 'square';
            o.frequency.value = 880;
            g.gain.setValueAtTime(0.04, c.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.03);
            o.connect(g);
            g.connect(c.destination);
            o.start();
            o.stop(c.currentTime + 0.04);
          } catch (e) {}
        }

        // ============================================
        // UTILITIES
        // ============================================

        function setGameStatus(text) {
          if (elGameStatus) elGameStatus.textContent = text;
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

        // Speed mode: clicking a player starts the race
        elGamePlayersRow && elGamePlayersRow.addEventListener('click', (e) => {
          if (state.gameMode === 'speed' && !state.isTracing && state.step === 3) {
            const btn = e.target.closest('[data-player-index]');
            if (btn) startSpeedRace();
          }
        });

        // Start
        init();
      })();
    </script>
  `;

  return createPageTemplate({
    title: toolTranslation?.name || 'Ladder Game',
    description: toolTranslation?.desc || 'Classic ghost leg ladder game for random matching and decision making.',
    content,
    path: '/ladder-game',
    scripts: script,
    lang
  });
}

export async function handleLadderGameRoutes(request, url) {
  if (url.pathname === '/ladder-game' || url.pathname === '/ladder-game/') {
    if (request.method === 'GET') {
      return respondHTML(renderLadderGamePage(resolveRequestLanguage(request, url)));
    }
  }
  return null;
}
