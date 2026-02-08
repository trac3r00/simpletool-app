/**
 * Roulette Wheel
 * Crypto-random, client-side roulette wheel with real-time statistics.
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';

function renderRouletteWheelPage() {
  const toolHeader = createToolHeader(
    { emoji: '🎡' },
    'Roulette Wheel',
    'Spin the wheel for fair random picks with real-time statistics.',
    [
      { text: '<span data-i18n="tools.roulette-wheel.ui.badge0">Crypto-Random Fair</span>', tooltip: 'Uses crypto.getRandomValues() with bias-free selection.' },
      { text: '<span data-i18n="tools.roulette-wheel.ui.badge1">Client-Side Only</span>', tooltip: 'Everything runs locally in your browser.' }
    ],
    { toolId: 'roulette-wheel' }
  );

  const styles = `
    <style>
      /* Wheel stage */
      .rw-wheel-frame {
        background:
          radial-gradient(900px 600px at 20% 10%, rgba(15, 23, 42, 0.06), transparent 58%),
          radial-gradient(900px 600px at 85% 25%, rgba(15, 23, 42, 0.05), transparent 60%),
          radial-gradient(900px 600px at 55% 85%, rgba(15, 23, 42, 0.04), transparent 62%);
      }
      .dark .rw-wheel-frame {
        background:
          radial-gradient(900px 600px at 20% 10%, rgba(226, 232, 240, 0.06), transparent 58%),
          radial-gradient(900px 600px at 85% 25%, rgba(226, 232, 240, 0.05), transparent 60%),
          radial-gradient(900px 600px at 55% 85%, rgba(226, 232, 240, 0.04), transparent 62%);
      }
      .rw-wheel-wrap {
        width: min(640px, 100%);
        min-width: 260px;
        aspect-ratio: 1 / 1;
      }
      .rw-canvas {
        image-rendering: auto;
        touch-action: pan-x pan-y;
      }
      .rw-result {
        opacity: 0;
        transform: translateY(8px) scale(0.98);
        transition: opacity 260ms ease, transform 260ms ease;
      }
      .rw-result[data-show="1"] {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      .rw-pop {
        animation: rwPop 520ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
      }
      @keyframes rwPop {
        0% { transform: translate(-50%, -50%) scale(0.98); filter: saturate(0.95); }
        60% { transform: translate(-50%, -50%) scale(1.03); filter: saturate(1.1); }
        100% { transform: translate(-50%, -50%) scale(1); filter: saturate(1); }
      }
      .rw-bar {
        background: linear-gradient(90deg, rgba(15, 23, 42, 0.04), rgba(15, 23, 42, 0.02));
      }
      .dark .rw-bar {
        background: linear-gradient(90deg, rgba(148, 163, 184, 0.10), rgba(148, 163, 184, 0.05));
      }

      /* Post-spin action panel */
      .rw-postspin {
        opacity: 0;
        transform: translateY(8px);
        transition: opacity 220ms ease, transform 220ms ease;
      }
      .rw-postspin[data-show="1"] {
        opacity: 1;
        transform: translateY(0);
      }
      /* Countdown overlay */
      .rw-countdown {
        position: absolute;
        inset: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.55);
        backdrop-filter: blur(4px);
        pointer-events: none;
      }
      .rw-countdown-num {
        font-size: 8rem;
        font-weight: 900;
        color: white;
        text-shadow: 0 0 40px rgba(255,255,255,0.5), 0 0 80px rgba(99,102,241,0.4);
        animation: rwCountPop 700ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
      }
      @keyframes rwCountPop {
        0% { transform: scale(2.5); opacity: 0; }
        35% { transform: scale(0.9); opacity: 1; }
        60% { transform: scale(1.08); }
        100% { transform: scale(1); opacity: 0.2; }
      }

      /* Screen shake */
      @keyframes rwShake {
        0%, 100% { transform: translate(0, 0); }
        10% { transform: translate(-6px, 3px); }
        20% { transform: translate(5px, -4px); }
        30% { transform: translate(-4px, 2px); }
        40% { transform: translate(3px, -2px); }
        50% { transform: translate(-2px, 1px); }
        60% { transform: translate(2px, -1px); }
        70% { transform: translate(-1px, 1px); }
        80% { transform: translate(1px, 0); }
        90% { transform: translate(0, -1px); }
      }
      .rw-shake {
        animation: rwShake 600ms ease-out;
      }

      /* Winner spotlight glow */
      .rw-spotlight {
        animation: rwSpotlight 1.5s ease-in-out;
      }
      @keyframes rwSpotlight {
        0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
        30% { box-shadow: 0 0 30px 8px rgba(251, 191, 36, 0.5), 0 0 60px 20px rgba(251, 191, 36, 0.2); }
        100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
      }

      @media (prefers-reduced-motion: reduce) {
        .rw-postspin {
          transition: none;
          transform: none;
        }
        .rw-countdown-num { animation: none; opacity: 1; transform: scale(1); }
        .rw-shake { animation: none; }
        .rw-spotlight { animation: none; }
      }
    </style>
  `;

  const content = `
    ${styles}
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- Wheel Column -->
          <section class="lg:col-span-7" aria-labelledby="rw-wheel-heading">
            <div class="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 id="rw-wheel-heading" class="text-lg font-semibold text-surface-900 dark:text-surface-50" data-i18n="tools.roulette-wheel.ui.heading0">Wheel</h2>
                <p class="text-sm text-surface-600 dark:text-surface-400 mt-1" data-i18n="tools.roulette-wheel.ui.text0">The outcome is selected before the animation starts. The spin is purely visual.</p>
              </div>
              <div class="flex items-center gap-2">
                <button id="fullscreen-btn" type="button" class="btn btn-ghost" data-i18n="tools.roulette-wheel.ui.button0" data-i18n-aria="tools.roulette-wheel.ui.button0" aria-label="Toggle fullscreen">
                  Fullscreen
                </button>
              </div>
            </div>

            <div class="rw-wheel-frame border border-surface-200 dark:border-surface-800 rounded-xl bg-surface-50 dark:bg-surface-950 overflow-hidden">
              <div class="p-4 sm:p-6">
                <div class="flex justify-center">
                  <div id="wheel-stage" class="rw-wheel-wrap relative rounded-xl bg-white/60 dark:bg-surface-900/40 border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden" tabindex="0" role="group" data-i18n-aria="tools.roulette-wheel.ui.text1" aria-label="Roulette wheel">
                    <canvas id="wheel-canvas" class="rw-canvas absolute inset-0 w-full h-full"></canvas>
                    <canvas id="confetti-canvas" class="rw-canvas absolute inset-0 w-full h-full pointer-events-none"></canvas>

                    <!-- Pointer -->
                    <div class="absolute -top-1 left-1/2 -translate-x-1/2 z-20">
                      <svg width="40" height="48" viewBox="0 0 40 48" fill="none" aria-hidden="true">
                        <path d="M20 46c8.5 0 15.4-6.9 15.4-15.4V10.3c0-1.2-1.4-1.8-2.3-1L21 18.2c-.6.4-1.4.4-2 0L6.9 9.3c-.9-.8-2.3-.2-2.3 1v20.3C4.6 39.1 11.5 46 20 46Z" fill="currentColor" class="text-surface-900/90 dark:text-surface-50/90"/>
                        <path d="M20 42.2c6.4 0 11.6-5.2 11.6-11.6V14.5L22.5 21c-1.5 1.1-3.5 1.1-5 0L8.4 14.5v16.1c0 6.4 5.2 11.6 11.6 11.6Z" fill="currentColor" class="text-primary-600/90 dark:text-primary-300/90"/>
                      </svg>
                    </div>

                    <!-- Center Spin Button -->
                    <button id="spin-btn" type="button" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 select-none btn btn-primary px-7 py-4 shadow-sm" data-i18n="tools.roulette-wheel.ui.button1" data-i18n-aria="tools.roulette-wheel.ui.button1" aria-label="Spin">
                      SPIN
                    </button>

                    <!-- Result Overlay -->
                    <div id="result-overlay" class="rw-result absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                      <div id="result-card" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] rounded-xl border border-surface-200 dark:border-surface-800 bg-white/90 dark:bg-surface-950/80 backdrop-blur px-5 py-5 shadow-sm">
                        <div class="text-xs uppercase tracking-widest text-surface-500 dark:text-surface-400" data-i18n="tools.roulette-wheel.ui.label0">Result</div>
                        <div id="result-text" class="mt-2 text-2xl sm:text-3xl font-extrabold text-surface-900 dark:text-surface-50 leading-tight"></div>
                        <div id="result-sub" class="mt-2 text-sm text-surface-600 dark:text-surface-400"></div>
                      </div>
                    </div>

                    <div id="live-region" class="sr-only" aria-live="polite"></div>
                  </div>
                </div>

                <div class="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div id="wheel-status" role="status" aria-live="polite" class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.roulette-wheel.ui.status0">Ready.</div>
                  <div class="flex items-center gap-3">
                    <label class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300 select-none">
                      <input id="sound-toggle" type="checkbox" class="w-4 h-4 text-primary-600 focus:ring-primary-500" />
                      <span data-i18n="tools.roulette-wheel.ui.label1">Sound effects</span>
                    </label>
                    <button id="hide-result" type="button" class="btn btn-secondary" data-i18n="tools.roulette-wheel.ui.button2">Hide Result</button>
                  </div>
                </div>

                <!-- Post-spin action panel (shown after spin completes) -->
                <div id="postspin-panel" class="rw-postspin hidden mt-4 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4" role="region" aria-live="polite" aria-label="Post-spin actions">
                  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div class="text-base sm:text-lg font-extrabold text-surface-900 dark:text-surface-50">
                      <span data-i18n="tools.roulette-wheel.ui.text7">🎉 Winner:</span>
                      <span id="postspin-winner-name" class="ml-1"></span>
                    </div>
                    <div id="postspin-only-one" class="hidden text-sm font-semibold text-primary-800 dark:text-primary-200 bg-primary-50 dark:bg-primary-900/30 border border-primary-200/60 dark:border-primary-800/50 rounded-lg px-3 py-1" data-i18n="tools.roulette-wheel.ui.text8">Only one option left!</div>
                  </div>
                  <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button type="button" class="btn btn-primary" data-postspin-action="spin-again" data-i18n="tools.roulette-wheel.ui.button9" data-i18n-aria="tools.roulette-wheel.ui.button9" aria-label="Spin Again">Spin Again</button>
                    <button type="button" class="btn btn-secondary" data-postspin-action="remove-winner-spin" data-i18n="tools.roulette-wheel.ui.button10" data-i18n-aria="tools.roulette-wheel.ui.button10" aria-label="Remove Winner & Spin">Remove Winner & Spin</button>
                    <button type="button" class="btn btn-ghost" data-postspin-action="remove-winner" data-i18n="tools.roulette-wheel.ui.button11" data-i18n-aria="tools.roulette-wheel.ui.button11" aria-label="Remove Winner">Remove Winner</button>
                    <button type="button" class="btn btn-ghost" data-postspin-action="reset-all" data-i18n="tools.roulette-wheel.ui.button12" data-i18n-aria="tools.roulette-wheel.ui.button12" aria-label="Reset All">Reset All</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Controls + Stats Column -->
          <aside class="lg:col-span-5 space-y-6" aria-labelledby="rw-controls-heading">
            <section class="border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-900 shadow-sm p-5 sm:p-6" aria-labelledby="rw-controls-heading">
              <div class="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 id="rw-controls-heading" class="text-lg font-semibold text-surface-900 dark:text-surface-50" data-i18n="tools.roulette-wheel.ui.heading1">Segments</h2>
                  <p class="text-sm text-surface-600 dark:text-surface-400 mt-1" data-i18n="tools.roulette-wheel.ui.text2">Add 2–20 options. Colors are auto-assigned.</p>
                </div>
                <button id="add-segment" type="button" class="btn btn-secondary" data-i18n="tools.roulette-wheel.ui.button3">Add Segment</button>
              </div>

              <div id="segments-list" class="space-y-3"></div>

              <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button id="spin-side" type="button" class="btn btn-primary" data-i18n="tools.roulette-wheel.ui.button4">Spin</button>
                <button id="clear-stats" type="button" class="btn btn-ghost" data-i18n="tools.roulette-wheel.ui.button5">Clear Stats</button>
              </div>
            </section>

            <section class="border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-900 shadow-sm p-5 sm:p-6" aria-labelledby="rw-series-heading">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 id="rw-series-heading" class="text-lg font-semibold text-surface-900 dark:text-surface-50" data-i18n="tools.roulette-wheel.ui.heading6">Series</h2>
                  <p class="text-sm text-surface-600 dark:text-surface-400 mt-1" data-i18n="tools.roulette-wheel.ui.text9">Run multiple spins in a row for a longer game.</p>
                </div>
              </div>

              <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div class="sm:col-span-1">
                  <label for="series-count" class="label"><span data-i18n="tools.roulette-wheel.ui.label4">Spins</span></label>
                  <input id="series-count" type="number" min="1" max="50" step="1" value="10" class="input" aria-label="Series spins" />
                </div>
                <button id="series-start" type="button" class="btn btn-primary" data-i18n="tools.roulette-wheel.ui.button13">Play Series</button>
                <button id="series-stop" type="button" class="btn btn-ghost" data-i18n="tools.roulette-wheel.ui.button14">Stop</button>
              </div>
              <div id="series-status" class="mt-3 text-sm text-surface-600 dark:text-surface-400" role="status" aria-live="polite" data-i18n="tools.roulette-wheel.ui.status2">Not running.</div>

              <div class="mt-5 pt-5 border-t border-surface-200 dark:border-surface-800">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-50" data-i18n="tools.roulette-wheel.ui.heading7">Tournament</h3>
                    <p class="text-sm text-surface-600 dark:text-surface-400 mt-1" data-i18n="tools.roulette-wheel.ui.desc0">Eliminate winners until one option remains, producing a full ranking.</p>
                  </div>
                </div>
                <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button id="tourney-start" type="button" class="btn btn-primary" data-i18n="tools.roulette-wheel.ui.button15">Start Tournament</button>
                  <button id="tourney-stop" type="button" class="btn btn-ghost" data-i18n="tools.roulette-wheel.ui.button16">Stop</button>
                </div>
                <div id="tourney-status" class="mt-3 text-sm text-surface-600 dark:text-surface-400" role="status" aria-live="polite" data-i18n="tools.roulette-wheel.ui.status3">Not running.</div>
                <div id="tourney-ranking-wrap" class="hidden mt-3 border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden bg-surface-50 dark:bg-surface-950" aria-label="Tournament ranking">
                  <div id="tourney-ranking" class="divide-y divide-surface-200 dark:divide-surface-800"></div>
                </div>
              </div>
            </section>

            <section class="border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-900 shadow-sm p-5 sm:p-6" aria-labelledby="rw-presets-heading">
              <h2 id="rw-presets-heading" class="text-lg font-semibold text-surface-900 dark:text-surface-50" data-i18n="tools.roulette-wheel.ui.heading2">Presets</h2>
              <p class="text-sm text-surface-600 dark:text-surface-400 mt-1" data-i18n="tools.roulette-wheel.ui.text3">Save your segment list to reuse later (stored in your browser).</p>

              <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div class="sm:col-span-2">
                  <label for="preset-name" class="label"><span data-i18n="tools.roulette-wheel.ui.label2">Preset name</span></label>
                  <input id="preset-name" type="text" class="input" data-i18n-placeholder="tools.roulette-wheel.ui.placeholder0" placeholder="e.g., Team lunch" />
                </div>
                <button id="save-preset" type="button" class="btn btn-secondary" data-i18n="tools.roulette-wheel.ui.button6">Save Preset</button>
              </div>

              <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div class="sm:col-span-2">
                  <label for="preset-select" class="label"><span data-i18n="tools.roulette-wheel.ui.label3">Load preset</span></label>
                  <select id="preset-select" class="input" data-i18n-aria="tools.roulette-wheel.ui.label3" aria-label="Load preset">
                    <option value="" data-i18n="tools.roulette-wheel.ui.option0">Select a preset…</option>
                  </select>
                </div>
                <button id="load-preset" type="button" class="btn btn-ghost" data-i18n="tools.roulette-wheel.ui.button7">Load</button>
              </div>

              <div id="preset-status" class="mt-3 text-sm text-surface-600 dark:text-surface-400" role="status" aria-live="polite" data-i18n="tools.roulette-wheel.ui.status1">No preset loaded.</div>
            </section>

            <section class="border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-900 shadow-sm p-5 sm:p-6" aria-labelledby="rw-stats-heading">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 id="rw-stats-heading" class="text-lg font-semibold text-surface-900 dark:text-surface-50" data-i18n="tools.roulette-wheel.ui.heading3">Statistics</h2>
                  <p class="text-sm text-surface-600 dark:text-surface-400 mt-1" data-i18n="tools.roulette-wheel.ui.text4">Track outcomes and verify distribution over time.</p>
                </div>
                <div class="text-right">
                  <div class="text-xs uppercase tracking-widest text-surface-500 dark:text-surface-400" data-i18n="tools.roulette-wheel.ui.stat0">Total Spins</div>
                  <div id="total-spins" class="text-2xl font-extrabold text-surface-900 dark:text-surface-50">0</div>
                </div>
              </div>

              <div class="mt-4 flex items-center justify-between gap-3">
                <div>
                  <div class="text-xs uppercase tracking-widest text-surface-500 dark:text-surface-400" data-i18n="tools.roulette-wheel.ui.stat1">Fairness</div>
                  <div id="fairness" class="text-sm font-semibold text-surface-800 dark:text-surface-200">—</div>
                </div>
                <div id="fairness-badge" class="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300">—</div>
              </div>

              <div class="mt-5">
                <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100" data-i18n="tools.roulette-wheel.ui.heading4">Frequency</h3>
                <div id="freq-chart" class="mt-3 space-y-2"></div>
              </div>

              <div class="mt-6">
                <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100" data-i18n="tools.roulette-wheel.ui.heading5">History</h3>
                <div id="history" class="mt-3 border border-surface-200 dark:border-surface-800 rounded-xl bg-surface-50 dark:bg-surface-950 overflow-hidden">
                  <div id="history-list" class="max-h-56 overflow-y-auto divide-y divide-surface-200 dark:divide-surface-800"></div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  `;

  const script = `
    <script src="/vendor/game-utils.min.js"></script>
    <script>
      (function() {
        'use strict';

        const { clamp, cryptoUint32, randInt, randFloat, escapeHtml, ensureAudioCtx: _ensureAudioCtx, playBeep: _playBeep, spawnConfetti, tickConfetti, drawConfettiParticles } = window.GameUtils;
        const safeText = escapeHtml;

        const COLOR_PALETTE = [
          '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
          '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
          '#d946ef', '#0ea5e9', '#f43f5e', '#22c55e', '#a855f7',
          '#fb923c', '#06b6d4', '#e11d48', '#4ade80', '#7c3aed'
        ];

        const MIN_SEGMENTS = 2;
        const MAX_SEGMENTS = 20;
        const MAX_HISTORY_VISIBLE = 100;
        const PRESET_KEY = 'roulette-presets';

        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const elWheelStage = document.getElementById('wheel-stage');
        const elWheelCanvas = document.getElementById('wheel-canvas');
        const elConfettiCanvas = document.getElementById('confetti-canvas');
        const elSpinBtn = document.getElementById('spin-btn');
        const elSpinSide = document.getElementById('spin-side');
        const elHideResult = document.getElementById('hide-result');
        const elResultOverlay = document.getElementById('result-overlay');
        const elResultCard = document.getElementById('result-card');
        const elResultText = document.getElementById('result-text');
        const elResultSub = document.getElementById('result-sub');
        const elLive = document.getElementById('live-region');

        const elPostSpinPanel = document.getElementById('postspin-panel');
        const elPostSpinWinnerName = document.getElementById('postspin-winner-name');
        const elPostSpinOnlyOne = document.getElementById('postspin-only-one');

        const elStatus = document.getElementById('wheel-status');
        const elSegmentsList = document.getElementById('segments-list');
        const elAddSegment = document.getElementById('add-segment');

        const elTotalSpins = document.getElementById('total-spins');
        const elFairness = document.getElementById('fairness');
        const elFairnessBadge = document.getElementById('fairness-badge');
        const elFreqChart = document.getElementById('freq-chart');
        const elHistoryList = document.getElementById('history-list');
        const elClearStats = document.getElementById('clear-stats');

        const elPresetName = document.getElementById('preset-name');
        const elSavePreset = document.getElementById('save-preset');
        const elPresetSelect = document.getElementById('preset-select');
        const elLoadPreset = document.getElementById('load-preset');
        const elPresetStatus = document.getElementById('preset-status');

        const elSeriesCount = document.getElementById('series-count');
        const elSeriesStart = document.getElementById('series-start');
        const elSeriesStop = document.getElementById('series-stop');
        const elSeriesStatus = document.getElementById('series-status');

        const elTourneyStart = document.getElementById('tourney-start');
        const elTourneyStop = document.getElementById('tourney-stop');
        const elTourneyStatus = document.getElementById('tourney-status');
        const elTourneyRankingWrap = document.getElementById('tourney-ranking-wrap');
        const elTourneyRanking = document.getElementById('tourney-ranking');

        const elFullscreen = document.getElementById('fullscreen-btn');
        const elSoundToggle = document.getElementById('sound-toggle');

        const wheelCtx = elWheelCanvas.getContext('2d');
        const confettiCtx = elConfettiCanvas.getContext('2d');

        function normalizeAngle(a) {
          const tau = Math.PI * 2;
          let x = a % tau;
          if (x < 0) x += tau;
          return x;
        }

        function bytesToHex(bytes) {
          let s = '';
          for (let i = 0; i < bytes.length; i++) {
            s += bytes[i].toString(16).padStart(2, '0');
          }
          return s;
        }

        function randomId() {
          const b = new Uint8Array(8);
          crypto.getRandomValues(b);
          return bytesToHex(b);
        }

        function mixColor(hexA, hexB, t) {
          const a = hexToRgb(hexA);
          const b = hexToRgb(hexB);
          const tt = clamp(t, 0, 1);
          const r = Math.round(a.r + (b.r - a.r) * tt);
          const g = Math.round(a.g + (b.g - a.g) * tt);
          const bl = Math.round(a.b + (b.b - a.b) * tt);
          return rgbToHex(r, g, bl);
        }

        function hexToRgb(hex) {
          const h = String(hex || '').trim().replace('#', '');
          const full = (h.length === 3)
            ? (h[0] + h[0] + h[1] + h[1] + h[2] + h[2])
            : h.padEnd(6, '0').slice(0, 6);
          const n = parseInt(full, 16);
          return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
        }

        function rgbToHex(r, g, b) {
          const rr = clamp(r | 0, 0, 255);
          const gg = clamp(g | 0, 0, 255);
          const bb = clamp(b | 0, 0, 255);
          return '#' + rr.toString(16).padStart(2, '0') + gg.toString(16).padStart(2, '0') + bb.toString(16).padStart(2, '0');
        }

        function nowIsoShort() {
          const d = new Date();
          const hh = String(d.getHours()).padStart(2, '0');
          const mm = String(d.getMinutes()).padStart(2, '0');
          const ss = String(d.getSeconds()).padStart(2, '0');
          return hh + ':' + mm + ':' + ss;
        }

        function setStatus(text, tone) {
          elStatus.removeAttribute('data-i18n');
          elStatus.textContent = text;
          elStatus.classList.remove('text-primary-700', 'dark:text-primary-300', 'text-surface-900', 'dark:text-surface-50', 'font-semibold');
          if (tone === 'highlight') {
            elStatus.classList.add('text-primary-700', 'dark:text-primary-300');
          }
          if (tone === 'danger') {
            elStatus.classList.add('text-surface-900', 'dark:text-surface-50', 'font-semibold');
          }
        }

        function setPresetStatus(text, tone) {
          elPresetStatus.removeAttribute('data-i18n');
          elPresetStatus.textContent = text;
          elPresetStatus.classList.remove('text-primary-700', 'dark:text-primary-300', 'text-surface-900', 'dark:text-surface-50', 'font-semibold');
          if (tone === 'highlight') {
            elPresetStatus.classList.add('text-primary-700', 'dark:text-primary-300');
          }
          if (tone === 'danger') {
            elPresetStatus.classList.add('text-surface-900', 'dark:text-surface-50', 'font-semibold');
          }
        }

        const state = {
          segments: [],
          rotation: 0,
          spinning: false,
          series: {
            active: false,
            remaining: 0,
            total: 0,
            stopRequested: false
          },
          tournament: {
            active: false,
            stopRequested: false,
            ranking: []
          },
          highlightId: null,
          lastResultId: null,
          winnerIndex: null,
          canvasSize: 0,
          dpr: 1,
          resizeObs: null,
          spinRaf: null,
          confettiRaf: null,
          confetti: [],
          glowPhase: 0,
          audio: {
            enabled: false,
            ctx: null,
            lastTickIndex: null
          },
          stats: {
            total: 0,
            history: [],
            counts: {}
          }
        };

        let baselineSegments = null;
        const lastWinner = { id: null, index: null, label: '' };

        function cloneSegmentsForBaseline(segs) {
          return (segs || []).map((s, i) => ({
            id: (s && s.id) ? String(s.id) : randomId(),
            label: (s && (s.label != null)) ? String(s.label).slice(0, 80) : (window._t('tools.roulette-wheel.js.text0', 'Option') + ' ' + (i + 1)),
            color: (s && s.color) ? String(s.color) : COLOR_PALETTE[i % COLOR_PALETTE.length]
          }));
        }

        function hidePostSpinPanel() {
          if (!elPostSpinPanel) return;
          elPostSpinPanel.removeAttribute('data-show');
          elPostSpinPanel.classList.add('hidden');
          if (elPostSpinOnlyOne) elPostSpinOnlyOne.classList.add('hidden');
          if (elPostSpinWinnerName) elPostSpinWinnerName.textContent = '';
          lastWinner.id = null;
          lastWinner.index = null;
          lastWinner.label = '';
        }

        function winnerExistsInSegments() {
          if (!lastWinner.id) return false;
          return state.segments.some(s => s && s.id === lastWinner.id);
        }

        function updatePostSpinPanelButtons() {
          if (!elPostSpinPanel || elPostSpinPanel.classList.contains('hidden')) return;

          const btnSpinAgain = elPostSpinPanel.querySelector('[data-postspin-action="spin-again"]');
          const btnRemoveSpin = elPostSpinPanel.querySelector('[data-postspin-action="remove-winner-spin"]');
          const btnRemove = elPostSpinPanel.querySelector('[data-postspin-action="remove-winner"]');
          const btnReset = elPostSpinPanel.querySelector('[data-postspin-action="reset-all"]');

          const canSpin = !state.spinning && ensureSegmentCount().ok;
          const exists = winnerExistsInSegments();
          const canRemove = !state.spinning && exists && state.segments.length > 1;
          const canRemoveAndSpin = !state.spinning && exists && state.segments.length > 2;

          if (btnSpinAgain) btnSpinAgain.disabled = !canSpin;
          if (btnRemove) btnRemove.disabled = !canRemove;
          if (btnRemoveSpin) btnRemoveSpin.disabled = !canRemoveAndSpin;
          if (btnReset) btnReset.disabled = !!state.spinning;

          if (elPostSpinOnlyOne) {
            if (state.segments.length === 1) elPostSpinOnlyOne.classList.remove('hidden');
            else elPostSpinOnlyOne.classList.add('hidden');
          }
        }

        function showPostSpinPanel(seg, index) {
          if (!elPostSpinPanel) return;
          const label = segmentLabel(seg, index);
          lastWinner.id = seg && seg.id ? seg.id : null;
          lastWinner.index = index;
          lastWinner.label = label;
          if (elPostSpinWinnerName) elPostSpinWinnerName.textContent = label;
          elPostSpinPanel.classList.remove('hidden');
          updatePostSpinPanelButtons();
          // Fade in.
          elPostSpinPanel.removeAttribute('data-show');
          void elPostSpinPanel.offsetHeight;
          elPostSpinPanel.setAttribute('data-show', '1');
        }

        function defaultSegments() {
          return [0, 1, 2, 3].map((i) => ({
            id: randomId(),
            label: 'Option ' + (i + 1),
            color: COLOR_PALETTE[i % COLOR_PALETTE.length]
          }));
        }

        function refreshDefaultsForLanguage() {
          try {
            const lang = window._i18nGetLang ? window._i18nGetLang() : 'en';
            if (lang === 'en') return;
            for (let i = 0; i < state.segments.length; i++) {
              const expected = 'Option ' + (i + 1);
              if (state.segments[i].label === expected) {
                state.segments[i].label = window._t('tools.roulette-wheel.js.text0', 'Option') + ' ' + (i + 1);
              }
            }
          } catch (e) {}
        }

        function ensureSegmentCount() {
          const n = state.segments.length;
          if (n < MIN_SEGMENTS) {
            return { ok: false, message: window._t('tools.roulette-wheel.js.status0', 'Add at least 2 segments to spin.') };
          }
          if (n > MAX_SEGMENTS) {
            return { ok: false, message: window._t('tools.roulette-wheel.js.status1', 'Too many segments. Max is 20.') };
          }
          return { ok: true, message: '' };
        }

        function segmentLabel(seg, index) {
          const label = (seg && seg.label) ? String(seg.label).trim() : '';
          if (label) return label;
          return window._t('tools.roulette-wheel.js.text0', 'Option') + ' ' + (index + 1);
        }

        function updateSpinEnabled() {
          const ok = ensureSegmentCount().ok;
          const busy = state.spinning || (state.series && state.series.active) || (state.tournament && state.tournament.active);
          const disabled = busy || !ok;
          elSpinBtn.disabled = disabled;
          elSpinSide.disabled = disabled;
          elAddSegment.disabled = busy;
          elClearStats.disabled = busy;
          elSavePreset.disabled = busy;
          elLoadPreset.disabled = busy;
          elPresetSelect.disabled = busy;
          if (elSeriesStart) elSeriesStart.disabled = busy;
          if (elSeriesStop) elSeriesStop.disabled = !(state.series && state.series.active);
          if (elTourneyStart) elTourneyStart.disabled = busy;
          if (elTourneyStop) elTourneyStop.disabled = !(state.tournament && state.tournament.active);
          updatePostSpinPanelButtons();
        }

        function setTourneyStatus(text, tone) {
          if (!elTourneyStatus) return;
          elTourneyStatus.textContent = text;
          elTourneyStatus.classList.remove('text-primary-700', 'dark:text-primary-300', 'text-surface-900', 'dark:text-surface-50', 'font-semibold');
          if (tone === 'highlight') {
            elTourneyStatus.classList.add('text-primary-700', 'dark:text-primary-300');
          }
          if (tone === 'danger') {
            elTourneyStatus.classList.add('text-surface-900', 'dark:text-surface-50', 'font-semibold');
          }
        }

        function renderTourneyRanking() {
          if (!elTourneyRanking || !elTourneyRankingWrap) return;
          const rows = state.tournament && Array.isArray(state.tournament.ranking)
            ? state.tournament.ranking
            : [];
          if (!rows.length) {
            elTourneyRankingWrap.classList.add('hidden');
            elTourneyRanking.innerHTML = '';
            return;
          }
          elTourneyRankingWrap.classList.remove('hidden');
          elTourneyRanking.innerHTML = rows.map((r, i) => {
            return (
              '<div class="p-3 flex items-center justify-between gap-3">'
                + '<div class="min-w-0 flex items-center gap-2">'
                  + '<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-100 dark:bg-surface-800 text-xs font-extrabold text-surface-700 dark:text-surface-200">' + String(i + 1) + '</span>'
                  + '<span class="w-2.5 h-2.5 rounded-full" style="background:' + safeText(r.color) + '" aria-hidden="true"></span>'
                  + '<span class="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate">' + safeText(r.label) + '</span>'
                + '</div>'
              + '</div>'
            );
          }).join('');
        }

        function setSeriesStatus(text, tone) {
          if (!elSeriesStatus) return;
          elSeriesStatus.removeAttribute('data-i18n');
          elSeriesStatus.textContent = text;
          elSeriesStatus.classList.remove('text-primary-700', 'dark:text-primary-300', 'text-surface-900', 'dark:text-surface-50', 'font-semibold');
          if (tone === 'highlight') {
            elSeriesStatus.classList.add('text-primary-700', 'dark:text-primary-300');
          }
          if (tone === 'danger') {
            elSeriesStatus.classList.add('text-surface-900', 'dark:text-surface-50', 'font-semibold');
          }
        }

        function renderSegmentsList() {
          const n = state.segments.length;
          const rows = state.segments.map((seg, i) => {
            const label = segmentLabel(seg, i);
            const canRemove = n > MIN_SEGMENTS;
            const removeDisabled = (!canRemove || state.spinning) ? 'disabled' : '';
            const removeClasses = canRemove
              ? 'btn btn-ghost text-xs px-3 py-2'
              : 'btn btn-ghost text-xs px-3 py-2 opacity-50 cursor-not-allowed';
            return (
              '<div class="flex items-center gap-3">'
                + '<div class="w-3.5 h-3.5 rounded-full ring-2 ring-white/70 dark:ring-surface-950/50" style="background:' + safeText(seg.color) + '" aria-hidden="true"></div>'
                + '<input '
                + '  class="input flex-1" '
                + '  data-seg-input="1" '
                + '  data-seg-id="' + safeText(seg.id) + '" '
                + '  value="' + safeText(label) + '" '
                + '  data-i18n-placeholder="tools.roulette-wheel.ui.placeholder1" '
                + '  placeholder="Segment label" '
                + '  aria-label="' + safeText(window._t('tools.roulette-wheel.js.text1', 'Segment label')) + '" '
                + '/>'
                + '<button type="button" class="' + removeClasses + '" data-remove-id="' + safeText(seg.id) + '" ' + removeDisabled + ' aria-label="' + safeText(window._t('tools.roulette-wheel.js.text2', 'Remove segment')) + '">'
                + '  <span data-i18n="tools.roulette-wheel.ui.button8">Remove</span>'
                + '</button>'
              + '</div>'
            );
          }).join('');

          elSegmentsList.innerHTML = rows;
          try {
            if (window.setLanguage && window._i18nGetLang) window.setLanguage(window._i18nGetLang());
          } catch (e) {}
        }

        function getSegmentsFromInputs() {
          const inputs = Array.from(elSegmentsList.querySelectorAll('[data-seg-input="1"]'));
          const byId = new Map(state.segments.map(s => [s.id, s]));
          for (let i = 0; i < inputs.length; i++) {
            const id = inputs[i].getAttribute('data-seg-id');
            const seg = byId.get(id);
            if (!seg) continue;
            seg.label = String(inputs[i].value || '').slice(0, 80);
          }
        }

        function clearResultOverlay() {
          elResultOverlay.removeAttribute('data-show');
          elResultCard.classList.remove('rw-pop');
          elResultText.textContent = '';
          elResultSub.textContent = '';
        }

        function showResult(seg, index) {
          const label = segmentLabel(seg, index);
          const total = state.stats.total;
          const count = state.stats.counts[seg.id] || 0;
          const pct = total ? (count / total) * 100 : 0;
          elResultText.textContent = label;
          elResultSub.textContent = window._t('tools.roulette-wheel.js.text3', 'This option has won') + ' ' + String(count) + ' ' + window._t('tools.roulette-wheel.js.text4', 'time(s)') + ' (' + pct.toFixed(1) + '%).';
          elResultOverlay.setAttribute('data-show', '1');
          // Re-trigger pop animation.
          elResultCard.classList.remove('rw-pop');
          void elResultCard.offsetHeight;
          elResultCard.classList.add('rw-pop');
          elLive.textContent = window._t('tools.roulette-wheel.js.text5', 'Result:') + ' ' + label;
        }

        function sizeCanvases() {
          const rect = elWheelStage.getBoundingClientRect();
          const cssSize = Math.max(10, Math.floor(Math.min(rect.width, rect.height)));
          const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
          state.canvasSize = cssSize;
          state.dpr = dpr;
          elWheelCanvas.width = Math.max(1, Math.round(cssSize * dpr));
          elWheelCanvas.height = Math.max(1, Math.round(cssSize * dpr));
          elConfettiCanvas.width = Math.max(1, Math.round(cssSize * dpr));
          elConfettiCanvas.height = Math.max(1, Math.round(cssSize * dpr));
          wheelCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
          confettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function fitLabel(label, maxChars) {
          const s = String(label || '').trim();
          if (!s) return '';
          if (s.length <= maxChars) return s;
          return s.slice(0, Math.max(1, maxChars - 1)).trimEnd() + '…';
        }

        function drawWheel() {
          const size = state.canvasSize;
          if (!size) return;
          const ctx = wheelCtx;
          const n = state.segments.length;

          ctx.clearRect(0, 0, size, size);

          const cx = size / 2;
          const cy = size / 2;
          const radius = Math.max(10, (size * 0.48));

          // Ambient shadow.
          ctx.save();
          ctx.translate(cx, cy);
          ctx.shadowColor = 'rgba(15, 23, 42, 0.25)';
          if (document.documentElement.classList.contains('dark')) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
          }
          ctx.shadowBlur = 18;
          ctx.shadowOffsetY = 10;
          ctx.beginPath();
          ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,0,0,0)';
          ctx.fill();
          ctx.restore();

          // Rim.
          ctx.save();
          ctx.translate(cx, cy);
          const rimGrad = ctx.createRadialGradient(0, 0, radius * 0.78, 0, 0, radius + 10);
          rimGrad.addColorStop(0, document.documentElement.classList.contains('dark') ? 'rgba(226, 232, 240, 0.12)' : 'rgba(15, 23, 42, 0.10)');
          rimGrad.addColorStop(1, document.documentElement.classList.contains('dark') ? 'rgba(226, 232, 240, 0.02)' : 'rgba(15, 23, 42, 0.03)');
          ctx.beginPath();
          ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = rimGrad;
          ctx.fill();
          ctx.restore();

          if (state.spinning && state.glowPhase) {
            ctx.save();
            ctx.translate(cx, cy);
            const pulse = 8 + Math.sin(state.glowPhase) * 6;
            ctx.shadowColor = 'rgba(99, 102, 241, 0.4)';
            ctx.shadowBlur = pulse;
            ctx.beginPath();
            ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
          }

          if (n < 1) return;
          const anglePer = (Math.PI * 2) / n;
          const baseStart = -Math.PI / 2;
          const rot = state.rotation;

          ctx.save();
          ctx.translate(cx, cy);
          for (let i = 0; i < n; i++) {
            const seg = state.segments[i];
            const start = baseStart + rot + i * anglePer;
            const end = start + anglePer;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, start, end);
            ctx.closePath();

            const base = seg.color;
            const c1 = mixColor(base, '#ffffff', 0.18);
            const c2 = mixColor(base, '#000000', 0.18);
            const grad = ctx.createRadialGradient(0, 0, radius * 0.12, 0, 0, radius);
            grad.addColorStop(0, c1);
            grad.addColorStop(1, c2);
            ctx.fillStyle = grad;
            ctx.fill();

            // Segment border.
            ctx.lineWidth = 2;
            ctx.strokeStyle = document.documentElement.classList.contains('dark')
              ? 'rgba(2, 6, 23, 0.45)'
              : 'rgba(255, 255, 255, 0.55)';
            ctx.stroke();

            // Highlight winner.
            if (state.highlightId && seg.id === state.highlightId) {
              ctx.save();
              ctx.lineWidth = 5;
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
              ctx.shadowBlur = 18;
              ctx.shadowColor = seg.color;
              ctx.stroke();
              ctx.restore();
            }
          }
          ctx.restore();

          // Separators (thin gloss lines).
          ctx.save();
          ctx.translate(cx, cy);
          ctx.lineWidth = 1;
          ctx.strokeStyle = document.documentElement.classList.contains('dark')
            ? 'rgba(226, 232, 240, 0.20)'
            : 'rgba(15, 23, 42, 0.12)';
          for (let i = 0; i < n; i++) {
            const a = baseStart + rot + i * anglePer;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
            ctx.stroke();
          }
          ctx.restore();

          // Labels.
          ctx.save();
          ctx.translate(cx, cy);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const labelAlpha = state.spinning && state.glowPhase
            ? clamp(0.15 + (1 - Math.min(1, state.glowPhase * 0.012)) * 0.81, 0.15, 0.96)
            : 0.96;
          ctx.fillStyle = 'rgba(255, 255, 255, ' + labelAlpha.toFixed(2) + ')';
          ctx.shadowColor = 'rgba(0, 0, 0, ' + (labelAlpha * 0.36).toFixed(2) + ')';
          ctx.shadowBlur = 6;

          for (let i = 0; i < n; i++) {
            const seg = state.segments[i];
            const label = fitLabel(segmentLabel(seg, i), 16);
            if (!label) continue;
            const mid = baseStart + rot + (i + 0.5) * anglePer;

            const textRadius = radius * 0.64;
            ctx.save();
            ctx.rotate(mid);
            ctx.translate(textRadius, 0);

            // Keep text upright.
            const ang = normalizeAngle(mid);
            if (ang > Math.PI / 2 && ang < (Math.PI * 3) / 2) {
              ctx.rotate(Math.PI);
            }

            const sizeGuess = clamp(Math.round(radius * 0.10), 10, 18);
            ctx.font = '700 ' + sizeGuess + 'px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
            ctx.fillText(label, 0, 0);
            ctx.restore();
          }
          ctx.restore();

          // Center cap.
          ctx.save();
          ctx.translate(cx, cy);
          const capR = radius * 0.20;
          const capGrad = ctx.createRadialGradient(0, 0, capR * 0.15, 0, 0, capR);
          capGrad.addColorStop(0, document.documentElement.classList.contains('dark') ? 'rgba(226, 232, 240, 0.10)' : 'rgba(15, 23, 42, 0.06)');
          capGrad.addColorStop(1, document.documentElement.classList.contains('dark') ? 'rgba(2, 6, 23, 0.45)' : 'rgba(255, 255, 255, 0.85)');
          ctx.beginPath();
          ctx.arc(0, 0, capR, 0, Math.PI * 2);
          ctx.fillStyle = capGrad;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = document.documentElement.classList.contains('dark') ? 'rgba(148, 163, 184, 0.35)' : 'rgba(15, 23, 42, 0.10)';
          ctx.stroke();
          ctx.restore();
        }

        function drawConfetti() {
          const size = state.canvasSize;
          if (!size) return;
          confettiCtx.clearRect(0, 0, size, size);
          drawConfettiParticles(confettiCtx, state.confetti);
        }

        function stopSpinRaf() {
          if (state.spinRaf) {
            cancelAnimationFrame(state.spinRaf);
            state.spinRaf = null;
          }
        }

        function stopConfettiRaf() {
          if (state.confettiRaf) {
            cancelAnimationFrame(state.confettiRaf);
            state.confettiRaf = null;
          }
        }

        function clearConfetti() {
          stopConfettiRaf();
          state.confetti = [];
          const size = state.canvasSize;
          if (size) confettiCtx.clearRect(0, 0, size, size);
        }

        function spawnConfettiParticles(cx, cy, count, colors, speedMult) {
          spawnConfetti(state.confetti, cx, cy, count, colors, speedMult);
        }

        function confettiBurst(seedColor) {
          if (prefersReducedMotion) return;
          clearConfetti();
          const size = state.canvasSize;
          if (!size) return;
          const cx = size / 2;
          const cy = size / 2;
          const base = seedColor || COLOR_PALETTE[randInt(COLOR_PALETTE.length)];
          const colors = [
            base,
            mixColor(base, '#ffffff', 0.25),
            mixColor(base, '#000000', 0.15),
            '#fbbf24',
            COLOR_PALETTE[randInt(COLOR_PALETTE.length)],
            COLOR_PALETTE[randInt(COLOR_PALETTE.length)]
          ];
          spawnConfettiParticles(cx, cy, 180, colors, 1);
          setTimeout(() => spawnConfettiParticles(cx, cy, 90, colors, 0.8), 600);

          let last = performance.now();
          const endAt = last + 3500;
          let frame = 0;
          function tick(now) {
            const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
            last = now;
            frame++;
            for (let i = 0; i < state.confetti.length; i++) {
              const p = state.confetti[i];
              if (p.shimmer && frame % 4 === 0) {
                p.alpha = Math.min(1, p.alpha + 0.08);
              }
            }
            tickConfetti(state.confetti, dt, size);
            drawConfetti();
            if (now < endAt && state.confetti.length) {
              state.confettiRaf = requestAnimationFrame(tick);
            } else {
              stopConfettiRaf();
              setTimeout(() => clearConfetti(), 150);
            }
          }
          state.confettiRaf = requestAnimationFrame(tick);
        }

        function ensureAudio() {
          if (!state.audio.enabled) return null;
          return _ensureAudioCtx(state.audio);
        }

        function playBeep(freq, durMs, gain) {
          if (!state.audio.enabled) return;
          _playBeep(state.audio, freq, durMs, gain);
        }

        function playTick(spinProgress) {
          if (!state.audio.enabled) return;
          const p = clamp(spinProgress || 0, 0, 1);
          const freq = 880 - p * 440 + randInt(60);
          const dur = 20 + Math.round(p * 30);
          const gain = 0.08 + p * 0.10;
          playBeep(freq, dur, gain);
        }

        function playDrumRoll() {
          if (!state.audio.enabled) return;
          const ctx = ensureAudio();
          if (!ctx) return;
          try {
            const dur = 2.0;
            const t0 = ctx.currentTime;
            const bufSize = Math.round(ctx.sampleRate * dur);
            const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) {
              const t = i / ctx.sampleRate;
              const envelope = Math.min(1, t * 3) * Math.max(0, 1 - (t / dur) * 0.3);
              const rollRate = 20 + t * 15;
              const roll = Math.sin(t * rollRate * Math.PI * 2) > 0 ? 1 : -1;
              data[i] = (Math.random() * 2 - 1) * 0.06 * envelope * ((roll + 1) / 2 * 0.7 + 0.3);
            }
            const src = ctx.createBufferSource();
            src.buffer = buf;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.15, t0);
            g.gain.linearRampToValueAtTime(0.25, t0 + dur * 0.7);
            g.gain.linearRampToValueAtTime(0, t0 + dur);
            src.connect(g);
            g.connect(ctx.destination);
            src.start(t0);
          } catch (e) {}
        }

        function playImpactThud() {
          if (!state.audio.enabled) return;
          const ctx = ensureAudio();
          if (!ctx) return;
          try {
            const t0 = ctx.currentTime;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(150, t0);
            o.frequency.exponentialRampToValueAtTime(40, t0 + 0.15);
            g.gain.setValueAtTime(0.3, t0);
            g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
            o.connect(g);
            g.connect(ctx.destination);
            o.start(t0);
            o.stop(t0 + 0.3);
          } catch (e) {}
        }

        function playCelebrate() {
          if (!state.audio.enabled) return;
          const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
          const delays = [0, 80, 160, 280, 420];
          const gains = [0.14, 0.12, 0.11, 0.10, 0.08];
          const durs = [100, 100, 120, 140, 200];
          for (let i = 0; i < notes.length; i++) {
            setTimeout(() => playBeep(notes[i], durs[i], gains[i]), delays[i]);
          }
        }

        function getIndexAtRotation(rot) {
          const n = state.segments.length;
          if (n <= 0) return 0;
          const anglePer = (Math.PI * 2) / n;
          const baseStart = -Math.PI / 2;
          const pointerAngle = -Math.PI / 2;
          const local = normalizeAngle(pointerAngle - rot - baseStart);
          const idx = Math.floor(local / anglePer);
          return clamp(idx, 0, n - 1);
        }

        function easeOutQuint(t) {
          const x = clamp(t, 0, 1);
          return 1 - Math.pow(1 - x, 5);
        }

        function dramaticEase(t) {
          const x = clamp(t, 0, 1);
          if (x < 0.65) return easeOutQuint(x / 0.65) * 0.88;
          if (x < 0.78) {
            const sub = (x - 0.65) / 0.13;
            return 0.88 + sub * 0.06;
          }
          if (x < 0.88) {
            const sub = (x - 0.78) / 0.10;
            return 0.94 + sub * 0.005 + Math.sin(sub * Math.PI * 3) * 0.004;
          }
          const sub = (x - 0.88) / 0.12;
          return 0.945 + easeOutQuint(sub) * 0.055;
        }

        function screenShake(el) {
          if (prefersReducedMotion) return;
          el.classList.remove('rw-shake');
          void el.offsetHeight;
          el.classList.add('rw-shake');
          setTimeout(() => el.classList.remove('rw-shake'), 620);
        }

        function showCountdown(container, cb) {
          if (prefersReducedMotion) { cb(); return; }
          const nums = [3, 2, 1];
          let idx = 0;
          function next() {
            const existing = container.querySelector('.rw-countdown');
            if (existing) existing.remove();
            if (idx >= nums.length) { cb(); return; }
            const overlay = document.createElement('div');
            overlay.className = 'rw-countdown';
            const numEl = document.createElement('div');
            numEl.className = 'rw-countdown-num';
            numEl.textContent = String(nums[idx]);
            overlay.appendChild(numEl);
            container.appendChild(overlay);
            playBeep(440 + nums[idx] * 200, 120, 0.15);
            idx++;
            setTimeout(next, 750);
          }
          next();
        }

        function computeTargetRotationForIndex(index, extraSpins) {
          const n = state.segments.length;
          const anglePer = (Math.PI * 2) / Math.max(1, n);
          const desiredMod = normalizeAngle(- (index + 0.5) * anglePer);
          const currentMod = normalizeAngle(state.rotation);
          let delta = desiredMod - currentMod;
          if (delta < 0) delta += Math.PI * 2;
          return state.rotation + (extraSpins * Math.PI * 2) + delta;
        }

        function addSpinToStats(seg) {
          state.stats.total += 1;
          state.stats.counts[seg.id] = (state.stats.counts[seg.id] || 0) + 1;
          state.stats.history.unshift({
            id: seg.id,
            label: seg.label,
            color: seg.color,
            at: nowIsoShort()
          });
          if (state.stats.history.length > 500) state.stats.history.length = 500;
        }

        function clearStats() {
          state.stats.total = 0;
          state.stats.history = [];
          state.stats.counts = {};
          updateStatsUI();
        }

        function fairnessForSegment(count, total, n) {
          if (!total || n <= 0) return { expected: 0, actual: 0, dev: 0, z: 0 };
          const p = 1 / n;
          const expected = p * 100;
          const actual = (count / total) * 100;
          const dev = Math.abs(actual - expected);
          // Approximate standard deviation of proportion (binomial) in percent.
          const std = Math.sqrt(p * (1 - p) / total) * 100;
          const z = std > 0 ? (dev / std) : 0;
          return { expected, actual, dev, z };
        }

        function updateStatsUI() {
          const total = state.stats.total;
          const n = state.segments.length;
          elTotalSpins.textContent = String(total);

          // Fairness indicator.
          if (total < 1 || n < 1) {
            elFairness.textContent = '—';
            elFairnessBadge.textContent = '—';
            elFairnessBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300';
          } else {
            let worstZ = 0;
            for (let i = 0; i < n; i++) {
              const seg = state.segments[i];
              const c = state.stats.counts[seg.id] || 0;
              const f = fairnessForSegment(c, total, n);
              worstZ = Math.max(worstZ, f.z);
            }
            const label = (total < 20)
              ? window._t('tools.roulette-wheel.js.stat0', 'Collecting data…')
              : (worstZ <= 2.5)
                ? window._t('tools.roulette-wheel.js.stat1', 'Within expected variance')
                : (worstZ <= 4)
                  ? window._t('tools.roulette-wheel.js.stat2', 'Slightly uneven (normal sometimes)')
                  : window._t('tools.roulette-wheel.js.stat3', 'Uneven (needs more spins)');
            elFairness.textContent = label;

            let badgeText = '';
            let badgeClass = 'text-xs font-semibold px-2.5 py-1 rounded-full ';
            if (total < 20) {
              badgeText = window._t('tools.roulette-wheel.js.stat4', 'Warming up');
              badgeClass += 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300';
            } else if (worstZ <= 2.5) {
              badgeText = window._t('tools.roulette-wheel.js.stat5', 'Good');
              badgeClass += 'bg-primary-50 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200';
            } else if (worstZ <= 4) {
              badgeText = window._t('tools.roulette-wheel.js.stat6', 'Watch');
              badgeClass += 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200';
            } else {
              badgeText = window._t('tools.roulette-wheel.js.stat7', 'High deviation');
              badgeClass += 'bg-primary-100 dark:bg-primary-900/40 text-primary-900 dark:text-primary-100';
            }
            elFairnessBadge.textContent = badgeText;
            elFairnessBadge.className = badgeClass;
          }

          // Frequency chart.
          if (n < 1) {
            elFreqChart.innerHTML = '<div class="text-sm text-surface-500 dark:text-surface-400" data-i18n="tools.roulette-wheel.ui.text5">No segments.</div>';
          } else {
            const rows = state.segments.map((seg, i) => {
              const c = state.stats.counts[seg.id] || 0;
              const actualPct = total ? (c / total) * 100 : 0;
              const f = fairnessForSegment(c, total, n);
              let tone = 'text-surface-600 dark:text-surface-400';
              if (total >= 20) {
                if (f.z <= 2.5) tone = 'text-primary-700 dark:text-primary-300';
                else if (f.z <= 4) tone = 'text-surface-700 dark:text-surface-200';
                else tone = 'text-surface-900 dark:text-surface-50';
              }
              const expected = (n ? (100 / n) : 0);
              const label = fitLabel(segmentLabel(seg, i), 24);
              const barW = clamp(actualPct, 0, 100);
              return (
                '<div class="grid grid-cols-12 gap-3 items-center">'
                  + '<div class="col-span-5 min-w-0">'
                    + '<div class="flex items-center gap-2 min-w-0">'
                      + '<span class="w-2.5 h-2.5 rounded-full" style="background:' + safeText(seg.color) + '" aria-hidden="true"></span>'
                      + '<span class="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">' + safeText(label) + '</span>'
                    + '</div>'
                    + '<div class="text-xs ' + tone + '">'
                      + window._t('tools.roulette-wheel.js.text6', 'Expected') + ' ' + expected.toFixed(1) + '% · '
                      + window._t('tools.roulette-wheel.js.text7', 'Actual') + ' ' + actualPct.toFixed(1) + '%'
                    + '</div>'
                  + '</div>'
                  + '<div class="col-span-5">'
                    + '<div class="rw-bar h-2.5 rounded-full overflow-hidden border border-surface-200 dark:border-surface-800">'
                      + '<div class="h-full" style="width:' + barW.toFixed(2) + '%; background:' + safeText(seg.color) + '"></div>'
                    + '</div>'
                  + '</div>'
                  + '<div class="col-span-2 text-right">'
                    + '<div class="text-sm font-semibold text-surface-900 dark:text-surface-100">' + String(c) + '</div>'
                    + '<div class="text-xs ' + tone + '">' + (total ? ('±' + f.dev.toFixed(1) + '%') : '—') + '</div>'
                  + '</div>'
                + '</div>'
              );
            }).join('');
            elFreqChart.innerHTML = rows;
          }
          try {
            if (window.setLanguage && window._i18nGetLang) window.setLanguage(window._i18nGetLang());
          } catch (e) {}

          // History.
          if (!state.stats.history.length) {
            elHistoryList.innerHTML = '<div class="p-3 text-sm text-surface-500 dark:text-surface-400" data-i18n="tools.roulette-wheel.ui.text6">No spins yet.</div>';
          } else {
            const slice = state.stats.history.slice(0, MAX_HISTORY_VISIBLE);
            const items = slice.map((h, idx) => {
              return (
                '<div class="p-3 flex items-center justify-between gap-3">'
                  + '<div class="min-w-0">'
                    + '<div class="flex items-center gap-2 min-w-0">'
                      + '<span class="w-2.5 h-2.5 rounded-full" style="background:' + safeText(h.color) + '" aria-hidden="true"></span>'
                      + '<span class="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">' + safeText(h.label) + '</span>'
                    + '</div>'
                    + '<div class="text-xs text-surface-500 dark:text-surface-400">' + safeText(h.at) + '</div>'
                  + '</div>'
                  + '<div class="text-xs font-mono text-surface-500 dark:text-surface-400">#' + String(total - idx) + '</div>'
                + '</div>'
              );
            }).join('');
            elHistoryList.innerHTML = items;
          }
          try {
            if (window.setLanguage && window._i18nGetLang) window.setLanguage(window._i18nGetLang());
          } catch (e) {}
        }

        function spin() {
          if (state.spinning) return;
          getSegmentsFromInputs();
          const check = ensureSegmentCount();
          if (!check.ok) {
            setStatus(check.message, 'danger');
            return;
          }

          if (!baselineSegments) {
            baselineSegments = cloneSegmentsForBaseline(state.segments);
          }

          hidePostSpinPanel();
          clearResultOverlay();
          state.highlightId = null;
          state.winnerIndex = null;
          state.audio.lastTickIndex = null;
          state.glowPhase = 0;
          clearConfetti();

          state.spinning = true;
          updateSpinEnabled();
          setStatus(window._t('tools.roulette-wheel.js.status2', 'Spinning…'), 'highlight');

          const n = state.segments.length;
          const winnerIndex = randInt(n);
          state.winnerIndex = winnerIndex;

          function startActualSpin() {
            const cdEl = elWheelStage.querySelector('.rw-countdown');
            if (cdEl) cdEl.remove();

            const inAuto = !!((state.series && state.series.active) || (state.tournament && state.tournament.active));
            const extraSpins = prefersReducedMotion
              ? 2
              : (inAuto ? (4 + randInt(3)) : (6 + randInt(5)));
            const durationMs = prefersReducedMotion
              ? 1200
              : (inAuto ? (2200 + randInt(1201)) : (6000 + randInt(4001)));
            const startRot = state.rotation;
            const endRot = computeTargetRotationForIndex(winnerIndex, extraSpins);
            let drumRollPlayed = false;

            const startedAt = performance.now();
            const endAt = startedAt + durationMs;

            function tick(now) {
              const t = clamp((now - startedAt) / durationMs, 0, 1);
              const eased = dramaticEase(t);
              state.rotation = startRot + (endRot - startRot) * eased;
              state.glowPhase = (state.glowPhase || 0) + 0.06;

              if (state.audio.enabled) {
                const idx = getIndexAtRotation(state.rotation);
                if (state.audio.lastTickIndex == null) {
                  state.audio.lastTickIndex = idx;
                } else if (idx !== state.audio.lastTickIndex) {
                  state.audio.lastTickIndex = idx;
                  playTick(t);
                }
                if (t > 0.75 && !drumRollPlayed) {
                  drumRollPlayed = true;
                  playDrumRoll();
                }
              }

              drawWheel();

              if (now < endAt) {
                state.spinRaf = requestAnimationFrame(tick);
                return;
              }

              stopSpinRaf();
              state.rotation = endRot;
              state.glowPhase = 0;
              const seg = state.segments[winnerIndex]
                || state.segments[Math.max(0, Math.min(state.segments.length - 1, winnerIndex))]
                || state.segments[0];

              if (!seg) {
                state.spinning = false;
                updateSpinEnabled();
                setStatus(window._t('tools.roulette-wheel.js.status23', 'Spin cancelled.'), 'danger');
                return;
              }

              playImpactThud();
              screenShake(elWheelStage);

              state.highlightId = seg.id;
              drawWheel();

              const pauseMs = prefersReducedMotion ? 100 : 700;
              setTimeout(function revealWinner() {
                state.spinning = false;
                updateSpinEnabled();

                addSpinToStats(seg);
                updateStatsUI();

                const safeWinnerIndex = Math.max(0, state.segments.findIndex(s => s && s.id === seg.id));
                showResult(seg, safeWinnerIndex);
                setStatus(window._t('tools.roulette-wheel.js.status3', 'Result:') + ' ' + segmentLabel(seg, safeWinnerIndex), 'highlight');

                confettiBurst(seg.color);
                playCelebrate();

                elWheelStage.classList.add('rw-spotlight');
                setTimeout(function() { elWheelStage.classList.remove('rw-spotlight'); }, 1600);

                drawWheel();

                const inAutoNow = !!((state.series && state.series.active) || (state.tournament && state.tournament.active));
                if (!inAutoNow) {
                  showPostSpinPanel(seg, safeWinnerIndex);
                }

                if (state.series && state.series.active) {
                  state.series.remaining = Math.max(0, (state.series.remaining | 0) - 1);
                  const done = state.series.stopRequested || state.series.remaining <= 0;
                  if (done) {
                    const total = state.series.total | 0;
                    const played = total - (state.series.remaining | 0);
                    state.series.active = false;
                    state.series.stopRequested = false;
                    setSeriesStatus(window._t('tools.roulette-wheel.js.status19', 'Series complete:') + ' ' + String(played) + '/' + String(total), 'highlight');
                    updateSpinEnabled();
                  } else {
                    const total = state.series.total | 0;
                    const played = total - (state.series.remaining | 0);
                    setSeriesStatus(window._t('tools.roulette-wheel.js.status20', 'Series running:') + ' ' + String(played) + '/' + String(total), 'highlight');
                    updateSpinEnabled();
                    setTimeout(() => {
                      if (state.series && state.series.active && !state.spinning) spin();
                    }, prefersReducedMotion ? 80 : 260);
                  }
                }

                if (state.tournament && state.tournament.active) {
                  // Record winner then eliminate it.
                  state.tournament.ranking.push({ label: segmentLabel(seg, safeWinnerIndex), color: seg.color });
                  renderTourneyRanking();

                  const removed = removeSegmentByIdWithMin(seg.id, 1);
                  if (!removed) {
                    state.tournament.stopRequested = true;
                  }

                  const done = state.tournament.stopRequested || state.segments.length <= 1;
                  if (done) {
                    // Add final remaining as last place in ranking.
                    if (state.segments.length === 1) {
                      const last = state.segments[0];
                      state.tournament.ranking.push({ label: segmentLabel(last, 0), color: last.color });
                    }
                    state.tournament.active = false;
                    state.tournament.stopRequested = false;

                    // Restore original segments so the wheel is ready for another round.
                    if (baselineSegments && baselineSegments.length) {
                      state.segments = cloneSegmentsForBaseline(baselineSegments);
                      renderSegmentsList();
                      drawWheel();
                      updateStatsUI();
                    }

                    renderTourneyRanking();
                    const winner = state.tournament.ranking.length ? state.tournament.ranking[0].label : '';
                    setTourneyStatus(
                      window._t('tools.roulette-wheel.js.status22', 'Tournament complete!') + (winner ? ' ' + window._t('tools.roulette-wheel.js.status23', 'Winner:') + ' ' + winner : ''),
                      'highlight'
                    );
                    updateSpinEnabled();
                  } else {
                    setTourneyStatus(window._t('tools.roulette-wheel.js.status25', 'Tournament running…'), 'highlight');
                    updateSpinEnabled();
                    setTimeout(() => {
                      if (state.tournament && state.tournament.active && !state.spinning) spin();
                    }, prefersReducedMotion ? 80 : 260);
                  }
                }
              }, (state.series && state.series.active) ? (prefersReducedMotion ? 40 : 180) : pauseMs);
            }

            stopSpinRaf();
            state.spinRaf = requestAnimationFrame(tick);
          }

          if ((state.series && state.series.active) || (state.tournament && state.tournament.active)) {
            startActualSpin();
          } else {
            showCountdown(elWheelStage, startActualSpin);
          }
        }

        function startSeries() {
          if (!elSeriesCount) return;
          if (state.spinning) return;
          if (state.series && state.series.active) return;

          getSegmentsFromInputs();
          const check = ensureSegmentCount();
          if (!check.ok) {
            setSeriesStatus(check.message, 'danger');
            setStatus(check.message, 'danger');
            return;
          }

          const raw = parseInt(String(elSeriesCount.value || '').trim(), 10);
          const n = Number.isFinite(raw) ? clamp(raw, 1, 50) : 10;
          elSeriesCount.value = String(n);

          state.series.active = true;
          state.series.total = n;
          state.series.remaining = n;
          state.series.stopRequested = false;
          hidePostSpinPanel();
          clearResultOverlay();
          setSeriesStatus(window._t('tools.roulette-wheel.js.status20', 'Series running:') + ' 0/' + String(n), 'highlight');
          updateSpinEnabled();
          spin();
        }

        function stopSeries() {
          if (!state.series || !state.series.active) return;
          state.series.stopRequested = true;
          setSeriesStatus(window._t('tools.roulette-wheel.js.status21', 'Stopping after this spin…'), 'danger');
          updateSpinEnabled();
        }

        function startTournament() {
          if (state.spinning) return;
          if (state.tournament && state.tournament.active) return;
          getSegmentsFromInputs();
          const check = ensureSegmentCount();
          if (!check.ok) {
            setTourneyStatus(check.message, 'danger');
            setStatus(check.message, 'danger');
            return;
          }
          if (state.segments.length < 2) {
            setTourneyStatus(window._t('tools.roulette-wheel.js.status27', 'Need at least 2 options.'), 'danger');
            return;
          }
          state.tournament.active = true;
          state.tournament.stopRequested = false;
          state.tournament.ranking = [];
          renderTourneyRanking();
          hidePostSpinPanel();
          clearResultOverlay();
          setTourneyStatus(window._t('tools.roulette-wheel.js.status25', 'Tournament running…'), 'highlight');
          updateSpinEnabled();
          spin();
        }

        function stopTournament() {
          if (!state.tournament || !state.tournament.active) return;
          state.tournament.stopRequested = true;
          setTourneyStatus(window._t('tools.roulette-wheel.js.status26', 'Stopping after this spin…'), 'danger');
          updateSpinEnabled();
        }

        function readPresets() {
          try {
            const raw = localStorage.getItem(PRESET_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            if (parsed && Array.isArray(parsed.presets)) return parsed.presets;
            return [];
          } catch (e) {
            return [];
          }
        }

        function writePresets(presets) {
          try {
            localStorage.setItem(PRESET_KEY, JSON.stringify({ version: 1, presets }));
            return true;
          } catch (e) {
            return false;
          }
        }

        function renderPresetSelect() {
          const presets = readPresets();
          const current = elPresetSelect.value;
          const opts = ['<option value="" data-i18n="tools.roulette-wheel.ui.option0">Select a preset…</option>'];
          for (let i = 0; i < presets.length; i++) {
            const p = presets[i];
            if (!p || !p.name) continue;
            opts.push('<option value="' + safeText(p.name) + '">' + safeText(p.name) + '</option>');
          }
          elPresetSelect.innerHTML = opts.join('');
          if (current) elPresetSelect.value = current;
          try {
            if (window.setLanguage && window._i18nGetLang) window.setLanguage(window._i18nGetLang());
          } catch (e) {}
        }

        function savePreset() {
          const name = String(elPresetName.value || '').trim().slice(0, 40);
          if (!name) {
            setPresetStatus(window._t('tools.roulette-wheel.js.status4', 'Enter a preset name to save.'), 'danger');
            return;
          }
          getSegmentsFromInputs();
          const check = ensureSegmentCount();
          if (!check.ok) {
            setPresetStatus(check.message, 'danger');
            return;
          }
          const presets = readPresets().filter(p => p && p.name);
          const cleaned = presets.filter(p => p.name !== name);
          cleaned.unshift({
            name,
            savedAt: Date.now(),
            segments: state.segments.map((s, i) => ({
              id: s.id || randomId(),
              label: segmentLabel(s, i),
              color: s.color || COLOR_PALETTE[i % COLOR_PALETTE.length]
            }))
          });
          const ok = writePresets(cleaned.slice(0, 50));
          if (!ok) {
            setPresetStatus(window._t('tools.roulette-wheel.js.status5', 'Failed to save preset (storage unavailable).'), 'danger');
            return;
          }
          renderPresetSelect();
          elPresetSelect.value = name;
          setPresetStatus(window._t('tools.roulette-wheel.js.status6', 'Saved preset:') + ' ' + name, 'highlight');
        }

        function loadPreset() {
          const name = String(elPresetSelect.value || '').trim();
          if (!name) {
            setPresetStatus(window._t('tools.roulette-wheel.js.status7', 'Select a preset to load.'), 'danger');
            return;
          }
          const presets = readPresets();
          const p = presets.find(x => x && x.name === name);
          if (!p || !Array.isArray(p.segments)) {
            setPresetStatus(window._t('tools.roulette-wheel.js.status8', 'Preset not found.'), 'danger');
            return;
          }
          const segs = p.segments.slice(0, MAX_SEGMENTS).map((s, i) => ({
            id: (s && s.id) ? String(s.id) : randomId(),
            label: (s && s.label) ? String(s.label).slice(0, 80) : (window._t('tools.roulette-wheel.js.text0', 'Option') + ' ' + (i + 1)),
            color: (s && s.color) ? String(s.color) : COLOR_PALETTE[i % COLOR_PALETTE.length]
          })).filter(s => s && s.id);

          if (segs.length < MIN_SEGMENTS) {
            setPresetStatus(window._t('tools.roulette-wheel.js.status9', 'Preset must have at least 2 segments.'), 'danger');
            return;
          }

          state.segments = segs;
          state.rotation = 0;
          state.highlightId = null;
          clearResultOverlay();
          hidePostSpinPanel();
          clearStats();
          renderSegmentsList();
          drawWheel();
          updateSpinEnabled();
          setPresetStatus(window._t('tools.roulette-wheel.js.status10', 'Loaded preset:') + ' ' + name, 'highlight');
          setStatus(window._t('tools.roulette-wheel.js.status11', 'Segments loaded. Stats reset.'), null);
        }

        async function toggleFullscreen() {
          const target = elWheelStage.closest('.rw-wheel-frame') || elWheelStage;
          try {
            if (!document.fullscreenElement) {
              await target.requestFullscreen();
              elFullscreen.textContent = window._t('tools.roulette-wheel.js.text8', 'Exit Fullscreen');
            } else {
              await document.exitFullscreen();
              elFullscreen.textContent = window._t('tools.roulette-wheel.js.text9', 'Fullscreen');
            }
          } catch (e) {
            setStatus(window._t('tools.roulette-wheel.js.status12', 'Fullscreen not available.'), 'danger');
          }
        }

        function addSegment() {
          getSegmentsFromInputs();
          if (state.segments.length >= MAX_SEGMENTS) {
            setStatus(window._t('tools.roulette-wheel.js.status1', 'Too many segments. Max is 20.'), 'danger');
            return;
          }
          const i = state.segments.length;
          state.segments.push({
            id: randomId(),
            label: window._t('tools.roulette-wheel.js.text0', 'Option') + ' ' + (i + 1),
            color: COLOR_PALETTE[i % COLOR_PALETTE.length]
          });
          renderSegmentsList();
          drawWheel();
          updateSpinEnabled();
        }

        function removeSegmentByIdWithMin(id, minAllowed) {
          getSegmentsFromInputs();
          const minN = Math.max(1, minAllowed | 0);
          if (state.segments.length <= minN) return false;
          const next = state.segments.filter(s => s.id !== id);
          if (next.length < minN) return false;
          state.segments = next;
          state.highlightId = null;
          clearResultOverlay();
          renderSegmentsList();
          drawWheel();
          updateStatsUI();
          updateSpinEnabled();
          setStatus(window._t('tools.roulette-wheel.js.status13', 'Segment removed.'), null);
          return true;
        }

        function removeSegmentById(id) {
          return removeSegmentByIdWithMin(id, MIN_SEGMENTS);
        }

        function init() {
          state.segments = defaultSegments();
          refreshDefaultsForLanguage();

          // Sound toggle.
          elSoundToggle.checked = false;
          state.audio.enabled = false;
          elSoundToggle.addEventListener('change', () => {
            state.audio.enabled = !!elSoundToggle.checked;
            if (state.audio.enabled) {
              ensureAudio();
              // A tiny confirmation tick.
              setTimeout(() => playBeep(740, 30, 0.08), 0);
            }
          });

          // Segment list events.
          elSegmentsList.addEventListener('input', (e) => {
            const input = e.target && e.target.matches && e.target.matches('[data-seg-input="1"]') ? e.target : null;
            if (!input) return;
            const id = input.getAttribute('data-seg-id');
            const seg = state.segments.find(s => s.id === id);
            if (!seg) return;
            seg.label = String(input.value || '').slice(0, 80);
            state.highlightId = null;
            clearResultOverlay();
            hidePostSpinPanel();
            drawWheel();
            updateStatsUI();
          });
          elSegmentsList.addEventListener('click', (e) => {
            const btn = e.target && e.target.closest ? e.target.closest('[data-remove-id]') : null;
            if (!btn) return;
            const id = btn.getAttribute('data-remove-id');
            if (!id) return;
            removeSegmentById(id);
            hidePostSpinPanel();
          });

          elAddSegment.addEventListener('click', () => addSegment());

          // Spin.
          function spinFromUI() {
            if (state.series && state.series.active) return;
            spin();
          }
          elSpinBtn.addEventListener('click', spinFromUI);
          elSpinSide.addEventListener('click', spinFromUI);
          elWheelStage.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              spinFromUI();
            }
          });

          // Hide result.
          elHideResult.addEventListener('click', () => {
            clearResultOverlay();
            drawWheel();
          });

          // Post-spin action panel (event delegation).
          document.addEventListener('click', (e) => {
            const btn = e.target && e.target.closest ? e.target.closest('[data-postspin-action]') : null;
            if (!btn) return;
            const action = btn.getAttribute('data-postspin-action');
            if (!action) return;

            if (action === 'spin-again') {
              hidePostSpinPanel();
              spin();
              return;
            }

            if (action === 'remove-winner-spin') {
              if (state.spinning) return;
              if (!lastWinner.id) return;
              if (!winnerExistsInSegments()) {
                updatePostSpinPanelButtons();
                return;
              }
              if (state.segments.length <= 2) {
                updatePostSpinPanelButtons();
                return;
              }
              const ok = removeSegmentByIdWithMin(lastWinner.id, 1);
              updatePostSpinPanelButtons();
              if (!ok) return;
              hidePostSpinPanel();
              setTimeout(() => spin(), 300);
              return;
            }

            if (action === 'remove-winner') {
              if (state.spinning) return;
              if (!lastWinner.id) return;
              if (!winnerExistsInSegments()) {
                updatePostSpinPanelButtons();
                return;
              }
              removeSegmentByIdWithMin(lastWinner.id, 1);
              updatePostSpinPanelButtons();
              return;
            }

            if (action === 'reset-all') {
              if (state.spinning) return;
              if (!baselineSegments || !baselineSegments.length) return;
              state.segments = cloneSegmentsForBaseline(baselineSegments);
              state.rotation = 0;
              state.highlightId = null;
              clearResultOverlay();
              hidePostSpinPanel();
              clearStats();
              renderSegmentsList();
              drawWheel();
              updateSpinEnabled();
              setStatus(window._t('tools.roulette-wheel.js.status18', 'Reset to original segments.'), null);
            }
          });

          // Stats.
          elClearStats.addEventListener('click', () => {
            clearStats();
            state.highlightId = null;
            clearResultOverlay();
            drawWheel();
            setStatus(window._t('tools.roulette-wheel.js.status14', 'Stats cleared.'), null);
          });

          // Presets.
          renderPresetSelect();
          elSavePreset.addEventListener('click', () => savePreset());
          elLoadPreset.addEventListener('click', () => loadPreset());
          elPresetSelect.addEventListener('change', () => {
            if (!elPresetSelect.value) {
              setPresetStatus(window._t('tools.roulette-wheel.js.status15', 'No preset loaded.'), null);
              return;
            }
            setPresetStatus(window._t('tools.roulette-wheel.js.status16', 'Selected:') + ' ' + elPresetSelect.value, null);
          });

          // Series.
          if (elSeriesStart) elSeriesStart.addEventListener('click', () => startSeries());
          if (elSeriesStop) elSeriesStop.addEventListener('click', () => stopSeries());
          setSeriesStatus(window._t('tools.roulette-wheel.js.status22', 'Not running.'), null);

          // Tournament.
          if (elTourneyStart) elTourneyStart.addEventListener('click', () => startTournament());
          if (elTourneyStop) elTourneyStop.addEventListener('click', () => stopTournament());
          setTourneyStatus('Not running.', null);
          renderTourneyRanking();

          // Fullscreen.
          elFullscreen.addEventListener('click', () => toggleFullscreen());
          document.addEventListener('fullscreenchange', () => {
            const inFs = !!document.fullscreenElement;
            elFullscreen.textContent = inFs
              ? window._t('tools.roulette-wheel.js.text8', 'Exit Fullscreen')
              : window._t('tools.roulette-wheel.js.text9', 'Fullscreen');
            setTimeout(() => {
              sizeCanvases();
              drawWheel();
            }, 50);
          });

          // Canvas sizing.
          sizeCanvases();
          drawWheel();
          updateStatsUI();
          renderSegmentsList();
          updateSpinEnabled();

          state.resizeObs = new ResizeObserver(() => {
            sizeCanvases();
            drawWheel();
          });
          state.resizeObs.observe(elWheelStage);
          window.addEventListener('resize', () => {
            sizeCanvases();
            drawWheel();
          }, { passive: true });

          // Theme changes affect canvas gloss/shadows.
          const mo = new MutationObserver(() => {
            drawWheel();
          });
          mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

          setStatus(window._t('tools.roulette-wheel.js.status17', 'Ready.'), null);
        }

        init();
      })();
    </script>
  `;

  return respondHTML(createPageTemplate({
    title: 'Roulette Wheel',
    description: 'Spin a crypto-random roulette wheel for fair picks with real-time statistics, presets, sound effects, and fullscreen mode.',
    path: '/roulette-wheel',
    content,
    scripts: script
  }));
}

export async function handleRouletteWheelRoutes(request, url) {
  if (url.pathname === '/roulette-wheel' || url.pathname === '/roulette-wheel/') {
    if (request.method === 'GET') return renderRouletteWheelPage();
  }
  return null;
}
