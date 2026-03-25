import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { getToolTranslation, resolveRequestLanguage, t } from '../utils/i18n.js';
import { getMarbleBootConfig } from '../games/marble/config.js';

function renderMarbleRoulettePage(lang = 'en') {
  const toolTranslation = getToolTranslation('marble-roulette', lang);
  const marbleBootConfig = getMarbleBootConfig();
  const tr = (key, fallback) => {
    const value = t(key, lang);
    return value === key ? fallback : value;
  };
  const toolHeader = createToolHeader(
    { emoji: '🎱' },
    toolTranslation?.name || 'Marble Roulette',
    toolTranslation?.desc || 'Drop marbles through pegs for a physics-based lucky draw.',
    [
      { text: `<span data-i18n="tools.marble-roulette.ui.badge0">${tr('tools.marble-roulette.ui.badge0', 'Client-Side Only')}</span>` },
      { text: `<span data-i18n="tools.marble-roulette.ui.badge1">${tr('tools.marble-roulette.ui.badge1', 'Fair + Unpredictable')}</span>` }
    ],
    { toolId: 'marble-roulette' }
  );

  const content = `
    <style>
      .marble-roulette-page { overflow-x: hidden; }
      .marble-roulette-page canvas { max-width: 100%; }
      .mr-replay-bar { height: 4px; border-radius: 2px; transition: width 0.1s linear; }
      @keyframes mr-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
      .mr-bumper-glow { animation: mr-pulse 0.3s ease-out; }
    </style>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 marble-roulette-page">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
        ${toolHeader}

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Canvas / Board -->
          <section class="lg:col-span-7" aria-label="Marble board">
            <div class="bg-surface-50 dark:bg-surface-950/40 border border-surface-200 dark:border-surface-800 rounded-xl p-4">
              <div class="flex items-center justify-between gap-3 mb-3">
                <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-50" data-i18n="tools.marble-roulette.ui.heading0">${tr('tools.marble-roulette.ui.heading0', 'Board')}</h2>
                <div class="text-xs text-surface-600 dark:text-surface-400" aria-live="polite" id="mr-status" data-i18n="tools.marble-roulette.ui.status0">${tr('tools.marble-roulette.ui.status0', 'Ready.')}</div>
              </div>

              <div id="mr-canvas-wrap" class="relative w-full max-w-full overflow-hidden rounded-lg border border-surface-200 dark:border-surface-800 bg-white/60 dark:bg-surface-950/60" style="aspect-ratio: 3 / 2.5; max-height: 60vh;">
                <canvas id="mr-canvas" class="absolute inset-0 w-full h-full max-w-full" aria-label="Marble simulation canvas" role="img"></canvas>
                <div class="pointer-events-none absolute inset-x-0 top-0 p-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="inline-flex items-center gap-2 text-xs text-surface-700 dark:text-surface-300 bg-white/80 dark:bg-surface-950/70 border border-surface-200/60 dark:border-surface-800/60 rounded-full px-3 py-1">
                      <span class="font-semibold" data-i18n="tools.marble-roulette.ui.stat0">${tr('tools.marble-roulette.ui.stat0', 'Drops')}</span>
                      <span class="tabular-nums" id="mr-drops">0</span>
                      <span class="text-surface-400">&bull;</span>
                      <span data-i18n="tools.marble-roulette.ui.stat1">${tr('tools.marble-roulette.ui.stat1', 'Speed')}</span>
                      <span class="tabular-nums" id="mr-speed">1x</span>
                    </div>
                    <div class="hidden sm:flex items-center gap-2 text-[11px] text-surface-600 dark:text-surface-400">
                      <span class="inline-flex items-center gap-1" aria-hidden="true">&#x21B5;</span>
                      <span data-i18n="tools.marble-roulette.ui.text1">${tr('tools.marble-roulette.ui.text1', 'Start')}</span>
                      <span class="text-surface-400">&bull;</span>
                      <span class="inline-flex items-center gap-1" aria-hidden="true">R</span>
                      <span data-i18n="tools.marble-roulette.ui.text2">${tr('tools.marble-roulette.ui.text2', 'Reset')}</span>
                    </div>
                  </div>
                </div>
                <!-- Replay overlay -->
                <div id="mr-replay-overlay" class="hidden absolute inset-0 pointer-events-none z-10">
                  <div class="absolute bottom-3 left-3 right-3">
                    <div class="bg-surface-900/80 backdrop-blur rounded-lg px-3 py-2 flex items-center gap-3">
                      <span class="text-xs font-semibold text-white/90" data-i18n="tools.marble-roulette.ui.replayLabel">${tr('tools.marble-roulette.ui.replayLabel', 'Slow-Mo Replay')}</span>
                      <div class="flex-1 bg-white/20 rounded-full h-1 overflow-hidden">
                        <div id="mr-replay-progress" class="mr-replay-bar bg-primary-400 h-full" style="width:0%"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                  <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.heading1">${tr('tools.marble-roulette.ui.heading1', 'Winner')}</div>
                  <div id="mr-winner-inline" class="mt-1 text-sm font-semibold text-surface-900 dark:text-surface-50" data-i18n="tools.marble-roulette.ui.text3">&mdash;</div>
                </div>
                <div class="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                  <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.heading2">${tr('tools.marble-roulette.ui.heading2', 'Fairness')}</div>
                  <div class="mt-1 text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.desc0">${tr('tools.marble-roulette.ui.desc0', 'Each drop randomizes start positions using Web Crypto.')}</div>
                </div>
              </div>
            </div>
          </section>

          <!-- Controls -->
          <section class="lg:col-span-5" aria-label="Controls">
            <div class="bg-surface-50 dark:bg-surface-950/40 border border-surface-200 dark:border-surface-800 rounded-xl p-4">
              <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-3" data-i18n="tools.marble-roulette.ui.heading3">${tr('tools.marble-roulette.ui.heading3', 'Controls')}</h2>

              <div class="flex flex-col gap-4">
                <div>
                  <label class="label" for="mr-names"><span data-i18n="tools.marble-roulette.ui.label0">${tr('tools.marble-roulette.ui.label0', 'Names / options')}</span></label>
                   <textarea id="mr-names" class="input resize-y min-h-[9rem]" rows="6" aria-label="Names" data-i18n-placeholder="tools.marble-roulette.ui.placeholder0" placeholder="${tr('tools.marble-roulette.ui.placeholder0', 'Alice\nBob\nCharlie\nDave')}">${tr('tools.marble-roulette.ui.placeholder0', 'Alice\nBob\nCharlie\nDave').replace(/&#10;/g, '\n')}</textarea>
                  <p class="mt-2 text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.desc1">${tr('tools.marble-roulette.ui.desc1', 'Enter 2&ndash;10 names (one per line or comma-separated).')}</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                    <label class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" for="mr-theme" data-i18n="tools.marble-roulette.ui.labelTheme">${tr('tools.marble-roulette.ui.labelTheme', 'Board Theme')}</label>
                    <select id="mr-theme" class="input mt-2">
                      ${marbleBootConfig.themes.map((theme) => `<option value="${theme.id}" data-i18n="${theme.labelKey}">${tr(theme.labelKey, theme.fallbackLabel)}</option>`).join('')}
                    </select>
                    <p class="mt-2 text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.descTheme">${tr('tools.marble-roulette.ui.descTheme', 'Swap peg density and board behavior without changing the draw flow.')}</p>
                  </div>
                  <div class="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                    <label class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" for="mr-winner-mode" data-i18n="tools.marble-roulette.ui.labelWinnerMode">${tr('tools.marble-roulette.ui.labelWinnerMode', 'Winner Target')}</label>
                    <div class="mt-2 grid grid-cols-[1fr_auto] gap-2">
                      <select id="mr-winner-mode" class="input">
                        ${marbleBootConfig.winnerModes.map((mode) => `<option value="${mode.id}" data-i18n="${mode.labelKey}">${tr(mode.labelKey, mode.fallbackLabel)}</option>`).join('')}
                      </select>
                      <input id="mr-target-ordinal" type="number" min="2" max="10" value="${marbleBootConfig.defaultOrdinalTarget}" class="input w-20 text-center hidden" aria-label="Ordinal target">
                    </div>
                    <p class="mt-2 text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.descWinnerMode">${tr('tools.marble-roulette.ui.descWinnerMode', 'Pick the first finisher, last finisher, or a specific place in the ranking.')}</p>
                  </div>
                </div>

                <div class="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                  <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.label2">${tr('tools.marble-roulette.ui.label2', 'Speed')}</div>
                  <div class="mt-2 flex flex-wrap gap-2" aria-label="Speed controls">
                    <button type="button" class="btn btn-secondary" id="mr-speed-1" aria-pressed="true"><span data-i18n="tools.marble-roulette.ui.button0">${tr('tools.marble-roulette.ui.button0', '1x')}</span></button>
                    <button type="button" class="btn btn-secondary" id="mr-speed-2" aria-pressed="false"><span data-i18n="tools.marble-roulette.ui.button1">${tr('tools.marble-roulette.ui.button1', '2x')}</span></button>
                    <button type="button" class="btn btn-secondary" id="mr-speed-3" aria-pressed="false"><span data-i18n="tools.marble-roulette.ui.button2">${tr('tools.marble-roulette.ui.button2', '3x')}</span></button>
                  </div>
                  <p class="mt-2 text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.desc2">${tr('tools.marble-roulette.ui.desc2', 'Higher speed runs the simulation faster.')}</p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <button type="button" id="mr-shuffle" class="btn btn-secondary" aria-label="Shuffle entries">
                    <span data-i18n="tools.marble-roulette.ui.buttonShuffle">${tr('tools.marble-roulette.ui.buttonShuffle', 'Shuffle')}</span>
                  </button>
                  <button type="button" id="mr-start" class="btn btn-primary" aria-label="Start drop">
                    <span data-i18n="tools.marble-roulette.ui.button3">${tr('tools.marble-roulette.ui.button3', 'Start')}</span>
                  </button>
                  <button type="button" id="mr-reset" class="btn btn-ghost" aria-label="Reset">
                    <span data-i18n="tools.marble-roulette.ui.button4">${tr('tools.marble-roulette.ui.button4', 'Reset')}</span>
                  </button>
                </div>

                <div id="mr-result" class="hidden" aria-live="polite">
                  <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
                    <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.heading4">${tr('tools.marble-roulette.ui.heading4', 'Result')}</div>
                    <div class="mt-1 text-lg font-bold text-surface-900 dark:text-surface-50" id="mr-result-title" data-i18n="tools.marble-roulette.ui.text4">${tr('tools.marble-roulette.ui.text4', '&#127937; Ranking')}</div>
                    <div class="mt-3 border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden bg-surface-50 dark:bg-surface-950" aria-label="Ranking">
                      <div id="mr-ranking" class="divide-y divide-surface-200 dark:divide-surface-800"></div>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <button type="button" class="btn btn-primary" id="mr-again">
                        <span data-i18n="tools.marble-roulette.ui.button5">${tr('tools.marble-roulette.ui.button5', 'Drop Again')}</span>
                      </button>
                      <button type="button" class="btn btn-secondary" id="mr-replay-btn">
                        <span data-i18n="tools.marble-roulette.ui.buttonReplay">${tr('tools.marble-roulette.ui.buttonReplay', 'Slow-Mo Replay')}</span>
                      </button>
                      <button type="button" class="btn btn-secondary" id="mr-remove-winner">
                        <span data-i18n="tools.marble-roulette.ui.button6">${tr('tools.marble-roulette.ui.button6', 'Remove Winner &amp; Drop')}</span>
                      </button>
                      <button type="button" class="btn btn-ghost" id="mr-new">
                        <span data-i18n="tools.marble-roulette.ui.button7">${tr('tools.marble-roulette.ui.button7', 'New Draw')}</span>
                      </button>
                    </div>
                    <p class="mt-3 text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.desc3">${tr('tools.marble-roulette.ui.desc3', 'Tip: share by adding <span class="font-mono">?names=Alice,Bob&amp;autostart=true</span>.')}</p>
                  </div>
                </div>

                <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
                  <div class="flex items-center justify-between gap-3">
                    <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.heading5">${tr('tools.marble-roulette.ui.heading5', 'Statistics')}</div>
                    <button type="button" class="btn btn-ghost" id="mr-clear-stats" aria-label="Clear stats">
                      <span data-i18n="tools.marble-roulette.ui.button8">${tr('tools.marble-roulette.ui.button8', 'Clear Stats')}</span>
                    </button>
                  </div>
                  <div class="mt-3 text-sm text-surface-800 dark:text-surface-200" id="mr-stats-empty" data-i18n="tools.marble-roulette.ui.text5">${tr('tools.marble-roulette.ui.text5', 'No drops yet &mdash; press Start.')}</div>
                  <div class="mt-3 hidden" id="mr-stats">
                    <div class="text-xs text-surface-600 dark:text-surface-400" id="mr-stats-sub"></div>
                    <div class="mt-2 grid grid-cols-2 gap-2" id="mr-stats-grid"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>

    <!-- Winner Announcement Modal -->
    <div id="winner-modal" class="fixed inset-0 z-[100] hidden" role="dialog" aria-modal="true" aria-labelledby="winner-title">
      <div class="fixed inset-0 bg-surface-900/60 backdrop-blur-sm transition-opacity opacity-0" id="winner-overlay"></div>
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <div class="winner-announcement bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full transform scale-95 opacity-0 transition-all duration-300" id="winner-panel">
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
              <span class="text-3xl">&#127942;</span>
            </div>
            <h3 class="text-lg font-semibold text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.marble-roulette.ui.heading8">${tr('tools.marble-roulette.ui.heading8', 'Winner')}</h3>
            <div class="winner-name text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-50 mb-4" id="winner-name"></div>
            <div class="flex items-center justify-center gap-2 mb-6">
              <span class="inline-block w-4 h-4 rounded-full" id="winner-color"></span>
              <span class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.text6">${tr('tools.marble-roulette.ui.text6', 'First to the bottom!')}</span>
            </div>
            <button type="button" id="winner-close" class="btn btn-primary w-full">
              <span data-i18n="tools.marble-roulette.ui.button9">${tr('tools.marble-roulette.ui.button9', 'Awesome')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const scripts = String.raw`
    <script src="/vendor/game-utils.min.js"></script>
    <script>
      (function() {
        const _t = (typeof window._t === 'function') ? window._t : function(k, fb) { return fb; };
        const marbleBootConfig = ${JSON.stringify(marbleBootConfig)};

        const COLORS = [
          '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
          '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
        ];

        const els = {
          canvasWrap: document.getElementById('mr-canvas-wrap'),
          canvas: document.getElementById('mr-canvas'),
          names: document.getElementById('mr-names'),
          theme: document.getElementById('mr-theme'),
          winnerMode: document.getElementById('mr-winner-mode'),
          targetOrdinal: document.getElementById('mr-target-ordinal'),
          shuffle: document.getElementById('mr-shuffle'),
          start: document.getElementById('mr-start'),
          reset: document.getElementById('mr-reset'),
          status: document.getElementById('mr-status'),
          drops: document.getElementById('mr-drops'),
          speed: document.getElementById('mr-speed'),
          winnerInline: document.getElementById('mr-winner-inline'),
          resultWrap: document.getElementById('mr-result'),
          resultTitle: document.getElementById('mr-result-title'),
          ranking: document.getElementById('mr-ranking'),
          again: document.getElementById('mr-again'),
          replayBtn: document.getElementById('mr-replay-btn'),
          replayOverlay: document.getElementById('mr-replay-overlay'),
          replayProgress: document.getElementById('mr-replay-progress'),
          removeWinner: document.getElementById('mr-remove-winner'),
          newDraw: document.getElementById('mr-new'),
          speed1: document.getElementById('mr-speed-1'),
          speed2: document.getElementById('mr-speed-2'),
          speed3: document.getElementById('mr-speed-3'),
          clearStats: document.getElementById('mr-clear-stats'),
          statsEmpty: document.getElementById('mr-stats-empty'),
          stats: document.getElementById('mr-stats'),
          statsSub: document.getElementById('mr-stats-sub'),
          statsGrid: document.getElementById('mr-stats-grid'),
          winnerModal: document.getElementById('winner-modal'),
          winnerOverlay: document.getElementById('winner-overlay'),
          winnerPanel: document.getElementById('winner-panel'),
          winnerName: document.getElementById('winner-name'),
          winnerColor: document.getElementById('winner-color'),
          winnerClose: document.getElementById('winner-close')
        };

        const statusColorMap = {
          'error': 'text-error-700 dark:text-error-300',
          'success': 'text-success-700 dark:text-success-300',
          'neutral': 'text-surface-600 dark:text-surface-400'
        };

        const GameUtils = window.GameUtils;
        const { randU32, randFloat01, randRange, shuffleInPlace, clamp, escapeHtml, ensureAudioCtx: _ensureAudioCtx, playBeep: _playBeep } = GameUtils;

        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const mrAudio = { ctx: null };
        let lastPegSound = 0;

        function ensureAudioCtx() { return _ensureAudioCtx(mrAudio); }
        function mrPlayBeep(freq, durMs, gain) { _playBeep(mrAudio, freq, durMs, gain); }

        function playPegTick() {
          mrPlayBeep(1400 + Math.floor(randFloat01() * 400), 15, 0.04);
        }

        function playBumperHit() {
          mrPlayBeep(220, 60, 0.15);
          setTimeout(function() { mrPlayBeep(330, 40, 0.10); }, 30);
        }

        function playFlipperHit() {
          mrPlayBeep(500, 30, 0.08);
        }

        function playArrivalDing() {
          mrPlayBeep(880, 80, 0.10);
          setTimeout(function() { mrPlayBeep(1100, 60, 0.08); }, 60);
        }

        function playCelebration() {
          var notes = [523, 659, 784, 1047, 1319];
          var delays = [0, 70, 140, 250, 380];
          for (var i = 0; i < notes.length; i++) {
            (function(idx) {
              setTimeout(function() { mrPlayBeep(notes[idx], 100, 0.12 - idx * 0.01); }, delays[idx]);
            })(i);
          }
        }

        // ── Spatial Hash for O(1) peg lookups ───────────────────────
        var pegGrid = { cellSize: 80, cells: new Map() };

        function pegGridClear() { pegGrid.cells.clear(); }

        function pegGridInsert(idx, obj) {
          var cs = pegGrid.cellSize;
          var x0 = Math.floor((obj.x - obj.r) / cs);
          var x1 = Math.floor((obj.x + obj.r) / cs);
          var y0 = Math.floor((obj.y - obj.r) / cs);
          var y1 = Math.floor((obj.y + obj.r) / cs);
          for (var cx = x0; cx <= x1; cx++) {
            for (var cy = y0; cy <= y1; cy++) {
              var k = (cx & 0xFFFF) | ((cy & 0xFFFF) << 16);
              var bucket = pegGrid.cells.get(k);
              if (!bucket) { bucket = []; pegGrid.cells.set(k, bucket); }
              bucket.push(idx);
            }
          }
        }

        function pegGridQuery(obj) {
          var cs = pegGrid.cellSize;
          var x0 = Math.floor((obj.x - obj.r - 20) / cs);
          var x1 = Math.floor((obj.x + obj.r + 20) / cs);
          var y0 = Math.floor((obj.y - obj.r - 20) / cs);
          var y1 = Math.floor((obj.y + obj.r + 20) / cs);
          var seen = new Set();
          var result = [];
          for (var cx = x0; cx <= x1; cx++) {
            for (var cy = y0; cy <= y1; cy++) {
              var k = (cx & 0xFFFF) | ((cy & 0xFFFF) << 16);
              var bucket = pegGrid.cells.get(k);
              if (!bucket) continue;
              for (var i = 0; i < bucket.length; i++) {
                if (!seen.has(bucket[i])) {
                  seen.add(bucket[i]);
                  result.push(bucket[i]);
                }
              }
            }
          }
          return result;
        }

        function buildPegGrid(pegs) {
          pegGridClear();
          for (var i = 0; i < pegs.length; i++) {
            pegGridInsert(i, pegs[i]);
          }
        }

        // ── Confetti ────────────────────────────────────────────────
        var mrConfettiParticles = [];

        function mrConfettiBurst(cx, cy) {
          if (prefersReducedMotion) return;
          mrConfettiParticles = [];
          for (var i = 0; i < 120; i++) {
            var a = randFloat01() * Math.PI * 2;
            var sp = 2 + randFloat01() * 4.5;
            mrConfettiParticles.push({
              x: cx, y: cy,
              vx: Math.cos(a) * sp,
              vy: Math.sin(a) * sp - 2.5,
              rot: randFloat01() * Math.PI * 2,
              vr: (randFloat01() - 0.5) * 0.35,
              w: 4 + Math.floor(randFloat01() * 6),
              h: 7 + Math.floor(randFloat01() * 10),
              alpha: 1,
              color: COLORS[Math.floor(randFloat01() * COLORS.length)]
            });
          }
        }

        function mrDrawConfetti(ctx2, w, h) {
          if (!mrConfettiParticles.length) return;
          var dt = 1 / 60;
          for (var i = mrConfettiParticles.length - 1; i >= 0; i--) {
            var p = mrConfettiParticles[i];
            p.vy += 8 * dt;
            p.x += p.vx * 60 * dt;
            p.y += p.vy * 60 * dt;
            p.rot += p.vr * 60 * dt;
            p.alpha *= 0.988;
            if (p.alpha < 0.04 || p.y > h + 30) mrConfettiParticles.splice(i, 1);
          }
          ctx2.save();
          for (var i = 0; i < mrConfettiParticles.length; i++) {
            var p = mrConfettiParticles[i];
            ctx2.save();
            ctx2.translate(p.x, p.y);
            ctx2.rotate(p.rot);
            ctx2.globalAlpha = p.alpha;
            ctx2.fillStyle = p.color;
            ctx2.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx2.restore();
          }
          ctx2.restore();
        }

        // ── Camera Shake ────────────────────────────────────────────
        var shake = { intensity: 0, decay: 0.88, offsetX: 0, offsetY: 0 };

        function triggerShake(intensity) {
          if (prefersReducedMotion) return;
          shake.intensity = Math.min(shake.intensity + intensity, 10);
        }

        function updateShake() {
          if (shake.intensity < 0.3) {
            shake.intensity = 0;
            shake.offsetX = 0;
            shake.offsetY = 0;
            return;
          }
          shake.offsetX = (Math.random() - 0.5) * 2 * shake.intensity;
          shake.offsetY = (Math.random() - 0.5) * 2 * shake.intensity;
          shake.intensity *= shake.decay;
        }

        // ── Trail Particles ─────────────────────────────────────────
        var trailParticles = [];

        function spawnTrail(x, y, color) {
          if (prefersReducedMotion || trailParticles.length > 600) return;
          trailParticles.push({
            x: x, y: y, color: color,
            alpha: 0.45,
            r: 1.5 + Math.random() * 1.5,
            life: 0.35 + Math.random() * 0.2
          });
        }

        function updateTrails(dt) {
          for (var i = trailParticles.length - 1; i >= 0; i--) {
            var p = trailParticles[i];
            p.life -= dt;
            p.alpha = Math.max(0, p.life * 1.3);
            p.r *= 0.96;
            if (p.life <= 0) trailParticles.splice(i, 1);
          }
        }

        function drawTrails(ctx2, camY) {
          if (!trailParticles.length) return;
          ctx2.save();
          for (var i = 0; i < trailParticles.length; i++) {
            var p = trailParticles[i];
            ctx2.globalAlpha = p.alpha;
            ctx2.fillStyle = p.color;
            ctx2.beginPath();
            ctx2.arc(p.x, p.y - camY, p.r, 0, Math.PI * 2);
            ctx2.fill();
          }
          ctx2.restore();
        }

        // ── Replay Recorder ─────────────────────────────────────────
        var recorder = { frames: new Map(), recording: false, counter: 0 };
        var replay = { active: false, rafId: 0, startTime: 0, duration: 0, winnerId: null, path: [] };

        function recorderReset() {
          recorder.frames.clear();
          recorder.counter = 0;
          recorder.recording = false;
        }

        function recorderCapture(marbles, simTime) {
          if (!recorder.recording) return;
          recorder.counter++;
          if (recorder.counter % 2 !== 0) return;
          for (var i = 0; i < marbles.length; i++) {
            var m = marbles[i];
            var arr = recorder.frames.get(m.id);
            if (!arr) { arr = []; recorder.frames.set(m.id, arr); }
            if (arr.length < 3000) {
              arr.push({ x: m.x, y: m.y, t: simTime });
            }
          }
        }

        // ── Helpers ─────────────────────────────────────────────────

        function getThemeMeta(themeId) {
          var list = Array.isArray(marbleBootConfig.themes) ? marbleBootConfig.themes : [];
          return list.find(function(theme) { return theme.id === themeId; }) || list[0] || {
            pegProfile: {},
            board: {}
          };
        }

        function getWinnerTarget(listLength) {
          var maxOrdinal = Math.max(2, Math.min(listLength, marbleBootConfig.maxParticipants || 10));
          var nextOrdinal = clamp(Number(els.targetOrdinal.value || state.ordinalTarget || marbleBootConfig.defaultOrdinalTarget), 2, maxOrdinal);
          state.ordinalTarget = nextOrdinal;
          els.targetOrdinal.value = String(nextOrdinal);
          if (state.winnerMode === 'last') return listLength;
          if (state.winnerMode === 'ordinal') return nextOrdinal;
          return 1;
        }

        function parseNames(text) {
          var raw = String(text || '').replaceAll('\r', '').trim();
          if (!raw) return [];
          var normalized = raw.replaceAll(',', '\n');
          var parts = normalized.split('\n').map(function(s) { return s.trim(); }).filter(Boolean);
          var names = [];
          for (var i = 0; i < parts.length; i++) {
            var match = parts[i].match(/^(.*?)(?:\s*[*xX]\s*(\d+))?$/);
            var baseName = (match && match[1] ? match[1] : parts[i]).trim().slice(0, 32);
            var repeat = clamp(Number(match && match[2] ? match[2] : 1), 1, marbleBootConfig.maxParticipants || 10);
            if (!baseName) continue;
            for (var r = 0; r < repeat; r++) {
              if (names.length >= (marbleBootConfig.maxParticipants || 10)) break;
              names.push(repeat > 1 ? baseName + ' #' + (r + 1) : baseName);
            }
          }
          return names;
        }

        // ── Collision Functions ──────────────────────────────────────

        function collideCircle(m, c, restitution) {
          var dx = m.x - c.x;
          var dy = m.y - c.y;
          var rr = m.r + c.r;
          var d2 = dx * dx + dy * dy;
          if (d2 <= 0 || d2 >= rr * rr) return false;
          var d = Math.sqrt(d2);
          var nx = dx / d;
          var ny = dy / d;
          var overlap = rr - d;
          m.x += nx * overlap;
          m.y += ny * overlap;
          var vn = m.vx * nx + m.vy * ny;
          if (vn < 0) {
            var j = -(1 + restitution) * vn;
            m.vx += j * nx;
            m.vy += j * ny;
          }
          return true;
        }

        function collideBumper(m, bumper) {
          var dx = m.x - bumper.x;
          var dy = m.y - bumper.y;
          var rr = m.r + bumper.r;
          var d2 = dx * dx + dy * dy;
          if (d2 <= 0 || d2 >= rr * rr) return false;
          var d = Math.sqrt(d2);
          var nx = dx / d;
          var ny = dy / d;
          var overlap = rr - d;
          m.x += nx * overlap;
          m.y += ny * overlap;
          var speed = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
          var kick = Math.max(speed, bumper.kickForce * 0.5);
          m.vx = nx * kick;
          m.vy = ny * kick;
          return true;
        }

        function collideFlipper(m, fl) {
          var abx = fl.x2 - fl.x1;
          var aby = fl.y2 - fl.y1;
          var apx = m.x - fl.x1;
          var apy = m.y - fl.y1;
          var abLen2 = abx * abx + aby * aby;
          if (abLen2 <= 0) return false;
          var t2 = (apx * abx + apy * aby) / abLen2;
          if (t2 < 0) t2 = 0;
          if (t2 > 1) t2 = 1;
          var cx = fl.x1 + abx * t2;
          var cy = fl.y1 + aby * t2;
          var dx = m.x - cx;
          var dy = m.y - cy;
          var d2 = dx * dx + dy * dy;
          var rr = m.r + (fl.thickness || 4);
          if (d2 <= 0 || d2 >= rr * rr) return false;
          var d = Math.sqrt(d2);
          var nx = dx / d;
          var ny = dy / d;
          var overlap = rr - d;
          m.x += nx * overlap;
          m.y += ny * overlap;
          var vn = m.vx * nx + m.vy * ny;
          if (vn < 0) {
            var rest = fl.restitution || 0.82;
            var j = -(1 + rest) * vn;
            m.vx += j * nx;
            m.vy += j * ny;
          }
          return true;
        }

        // ── Simulation State ─────────────────────────────────────────
        var ctx = els.canvas.getContext('2d', { alpha: true });
        var state = {
          running: false,
          rafId: 0,
          lastTs: 0,
          acc: 0,
          simTime: 0,
          fixedDt: 1 / 60,
          speedMult: 1,
          dims: { w: 0, h: 0, dpr: 1 },
          world: { w: 0, h: 0, camY: 0 },
          board: null,
          pegs: [],
          bumpers: [],
          flippers: [],
          marbles: [],
          slots: [],
          drops: 0,
          rank: [],
          selectedWinner: null,
          winCounts: new Map(),
          keepNames: [],
          themeId: marbleBootConfig.defaultTheme,
          winnerMode: marbleBootConfig.defaultWinnerMode,
          ordinalTarget: marbleBootConfig.defaultOrdinalTarget,
          pegHitTimes: new Map(),
          bumperHitTimes: new Map(),
          isPinball: false
        };

        function setStatus(text, type) {
          els.status.textContent = text;
          els.status.className = 'text-xs ' + (statusColorMap[type] || statusColorMap['neutral']);
        }

        function getIsDark() {
          return document.documentElement.classList.contains('dark');
        }

        function resizeCanvas() {
          var rect = els.canvasWrap.getBoundingClientRect();
          var dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
          var w = Math.max(320, Math.floor(rect.width));
          var h = Math.max(240, Math.floor(rect.height));

          state.dims.w = w;
          state.dims.h = h;
          state.dims.dpr = dpr;
          els.canvas.width = Math.floor(w * dpr);
          els.canvas.height = Math.floor(h * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          if (!state.running && !replay.active) {
            rebuildBoard();
          }
          drawFrame(0);
        }

        function rebuildBoard() {
          var w = state.dims.w;
          var theme = getThemeMeta(state.themeId);
          var boardConfig = theme.board || {};
          var sidePad = Math.max(18, Math.min(36, w * 0.05));
          var topPad = 22;
          var worldH = 2400;

          state.world.w = w;
          state.world.h = worldH;
          state.isPinball = !!theme.isPinball;

          state.board = {
            sidePad: sidePad,
            topPad: topPad,
            worldH: worldH,
            pegR: 5.5,
            marbleR: 13,
            gravity: boardConfig.gravity || 980,
            restitution: boardConfig.restitution || 0.62,
            wallRestitution: boardConfig.wallRestitution || 0.60,
            linearDamping: boardConfig.linearDamping || 0.08,
            maxSimSeconds: boardConfig.maxSimSeconds || 45,
            slotHeight: 70,
            slotGap: 4
          };

          if (!state.running) {
            rebuildPegs();
            rebuildSlots();
            if (state.isPinball) {
              rebuildBumpers();
              rebuildFlippers();
            } else {
              state.bumpers = [];
              state.flippers = [];
            }
          }
        }

        function rebuildPegs() {
          var w = state.dims.w;
          var b = state.board;
          var theme = getThemeMeta(state.themeId);
          var pegProfile = theme.pegProfile || {};

          var usableW = w - b.sidePad * 2;
          var targetCols = pegProfile.targetCols || 10;
          var spacingX = clamp(usableW / targetCols, pegProfile.spacingXMin || 34, pegProfile.spacingXMax || 56);
          var rows = pegProfile.rows || 32;
          var topY = b.topPad + 140;
          var bottomY = b.worldH - b.slotHeight - 120;
          var spacingY = clamp((bottomY - topY) / Math.max(1, rows), pegProfile.spacingYMin || 44, pegProfile.spacingYMax || 58);

          var maxCols = Math.floor(usableW / spacingX);
          var baseCols = clamp(maxCols, 9, 11);
          var pegs = [];

          for (var r = 0; r < rows; r++) {
            var y = topY + r * spacingY;
            var isOffset = r % 2 === 1;
            var rowW = (baseCols - 1) * spacingX;
            var startX = (w / 2) - (rowW / 2) + (isOffset ? spacingX * 0.5 : 0);
            for (var c = 0; c < baseCols; c++) {
              var x = startX + c * spacingX;
              if (x < b.sidePad + 16 || x > w - b.sidePad - 16) continue;
              pegs.push({
                x: x + randRange(-(pegProfile.jitterX || 2), pegProfile.jitterX || 2),
                y: y + randRange(-(pegProfile.jitterY || 1.5), pegProfile.jitterY || 1.5),
                r: b.pegR
              });
            }
          }

          state.pegs = pegs;
          buildPegGrid(pegs);
        }

        function rebuildSlots() {
          var w = state.world.w;
          var b = state.board;
          var slotCount = Math.max(2, state.keepNames.length || 4);
          var slotW = (w - b.sidePad * 2 - (slotCount - 1) * b.slotGap) / slotCount;
          var slots = [];

          for (var i = 0; i < slotCount; i++) {
            var x = b.sidePad + i * (slotW + b.slotGap) + slotW / 2;
            slots.push({
              x: x,
              y: b.worldH - b.slotHeight / 2,
              w: slotW,
              h: b.slotHeight,
              occupied: false,
              winner: null
            });
          }

          state.slots = slots;
        }

        function rebuildBumpers() {
          var w = state.dims.w;
          var b = state.board;
          var bumpers = [];
          var usableW = w - b.sidePad * 2;
          var topY = b.topPad + 200;
          var bottomY = b.worldH - b.slotHeight - 200;
          var midX = w / 2;
          var bumperRows = 6;
          var sectionH = (bottomY - topY) / (bumperRows + 1);

          for (var r = 0; r < bumperRows; r++) {
            var y = topY + (r + 1) * sectionH;
            var count = (r % 2 === 0) ? 3 : 2;
            var spread = usableW * 0.55;
            for (var c = 0; c < count; c++) {
              var frac = count === 1 ? 0.5 : c / (count - 1);
              var x = midX - spread / 2 + frac * spread + randRange(-8, 8);
              bumpers.push({
                x: x,
                y: y + randRange(-10, 10),
                r: 18 + randRange(-2, 4),
                kickForce: 500 + randRange(0, 200),
                hitTime: 0
              });
            }
          }
          state.bumpers = bumpers;
        }

        function rebuildFlippers() {
          var w = state.dims.w;
          var b = state.board;
          var flippers = [];
          var usableW = w - b.sidePad * 2;
          var midX = w / 2;
          var topY = b.topPad + 400;
          var bottomY = b.worldH - b.slotHeight - 300;
          var flipperRows = 4;
          var sectionH = (bottomY - topY) / (flipperRows + 1);

          for (var r = 0; r < flipperRows; r++) {
            var y = topY + (r + 1) * sectionH;
            var side = (r % 2 === 0) ? -1 : 1;
            var angle = side * 0.35;
            var len = 40 + (r % 2) * 10;

            var lx = midX - usableW * 0.28;
            flippers.push({
              x1: lx, y1: y,
              x2: lx + Math.cos(angle) * len, y2: y + Math.sin(angle) * len,
              thickness: 5, restitution: 0.82
            });

            var rx = midX + usableW * 0.28;
            flippers.push({
              x1: rx, y1: y,
              x2: rx - Math.cos(angle) * len, y2: y + Math.sin(angle) * len,
              thickness: 5, restitution: 0.82
            });
          }
          state.flippers = flippers;
        }

        function newMarbles(names) {
          var n = names.length;
          var w = state.world.w;
          var b = state.board;

          var positions = [];
          for (var i = 0; i < n; i++) {
            var baseX = b.sidePad + ((w - b.sidePad * 2) / n) * (i + 0.5);
            positions.push(baseX);
          }
          shuffleInPlace(positions);

          var marbles = [];
          for (var i = 0; i < n; i++) {
            var name = names[i];
            var color = COLORS[i % COLORS.length];
            var laneW = (w - b.sidePad * 2) / Math.max(1, n);
            var xJ = randRange(-laneW * 0.18, laneW * 0.18);
            var x = clamp(positions[i] + xJ, b.sidePad + b.marbleR + 2, w - b.sidePad - b.marbleR - 2);
            var y = b.topPad + 26 + randRange(-4, 4);
            var vx = randRange(-70, 70);
            var vy = randRange(-20, 10);
            marbles.push({
              id: 'm' + i,
              name: name,
              color: color,
              x: x,
              y: y,
              vx: vx,
              vy: vy,
              r: b.marbleR,
              m: 1,
              finished: false,
              finishedAt: 0,
              rank: 0,
              trail: [],
              trailTimer: 0
            });
          }

          return marbles;
        }

        function resetRun(keepNames) {
          state.running = false;
          if (state.rafId) cancelAnimationFrame(state.rafId);
          state.rafId = 0;
          state.lastTs = 0;
          state.acc = 0;
          state.simTime = 0;
          stopReplay();
          els.winnerInline.textContent = _t('tools.marble-roulette.js.text0', '\u2014');
          els.resultWrap.classList.add('hidden');
          if (els.ranking) els.ranking.innerHTML = '';
          setStatus(_t('tools.marble-roulette.js.text1', 'Ready.'), 'neutral');
          if (Array.isArray(keepNames)) state.keepNames = keepNames;
          state.marbles = [];
          state.rank = [];
          state.selectedWinner = null;
          state.pegs = [];
          state.bumpers = [];
          state.flippers = [];
          state.slots = [];
          state.world.camY = 0;
          state.pegHitTimes.clear();
          state.bumperHitTimes.clear();
          mrConfettiParticles = [];
          trailParticles = [];
          shake.intensity = 0;
          recorderReset();
          hideWinnerModal();
          rebuildBoard();
          drawFrame(0);
        }

        function setSpeed(mult) {
          state.speedMult = mult;
          els.speed.textContent = String(mult) + 'x';
          var btns = [
            { el: els.speed1, v: 1 },
            { el: els.speed2, v: 2 },
            { el: els.speed3, v: 3 }
          ];
          btns.forEach(function(b) {
            b.el.setAttribute('aria-pressed', b.v === mult ? 'true' : 'false');
            b.el.classList.toggle('ring-2', b.v === mult);
            b.el.classList.toggle('ring-primary-400', b.v === mult);
            b.el.classList.toggle('ring-offset-2', b.v === mult);
            b.el.classList.toggle('ring-offset-white', b.v === mult);
            b.el.classList.toggle('dark:ring-offset-surface-900', b.v === mult);
          });
        }

        function startDrop(names) {
          if (state.running || replay.active) return;
          if (!state.board) rebuildBoard();

          var list = Array.isArray(names) ? names : parseNames(els.names.value);
          if (list.length < (marbleBootConfig.minParticipants || 2)) {
            setStatus(_t('tools.marble-roulette.js.err0', 'Enter at least 2 names.'), 'error');
            return;
          }
          if (list.length > (marbleBootConfig.maxParticipants || 10)) {
            setStatus(_t('tools.marble-roulette.js.err1', 'Max 10 names.'), 'error');
            return;
          }

          els.start.disabled = true;
          mrConfettiParticles = [];
          trailParticles = [];
          shake.intensity = 0;
          hideWinnerModal();
          stopReplay();

          state.keepNames = list.slice();
          state.selectedWinner = null;
          state.marbles = newMarbles(list);
          state.rank = [];
          state.simTime = 0;
          state.acc = 0;
          state.lastTs = 0;
          state.world.camY = 0;
          state.pegHitTimes.clear();
          state.bumperHitTimes.clear();
          recorderReset();
          recorder.recording = true;
          rebuildSlots();
          state.running = true;
          state.drops += 1;
          els.drops.textContent = String(state.drops);
          setStatus(_t('tools.marble-roulette.js.text2', 'Dropping...'), 'neutral');
          els.resultWrap.classList.add('hidden');
          els.winnerInline.textContent = _t('tools.marble-roulette.js.text0', '\u2014');
          if (els.ranking) els.ranking.innerHTML = '';
          els.start.disabled = false;
          drawFrame(0);
          state.rafId = requestAnimationFrame(tick);
        }

        function showWinnerModal(winner) {
          els.winnerName.textContent = winner.name;
          els.winnerColor.style.backgroundColor = winner.color;
          els.winnerModal.classList.remove('hidden');
          requestAnimationFrame(function() {
            els.winnerOverlay.classList.remove('opacity-0');
            els.winnerPanel.classList.remove('scale-95', 'opacity-0');
            els.winnerPanel.classList.add('scale-100', 'opacity-100');
          });
        }

        function hideWinnerModal() {
          els.winnerOverlay.classList.add('opacity-0');
          els.winnerPanel.classList.remove('scale-100', 'opacity-100');
          els.winnerPanel.classList.add('scale-95', 'opacity-0');
          setTimeout(function() {
            els.winnerModal.classList.add('hidden');
          }, 300);
        }

        function renderRanking() {
          if (!els.ranking) return;
          if (!state.rank.length) {
            els.ranking.innerHTML = '<div class="p-3 text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.js.text3">' + _t('tools.marble-roulette.js.text3', 'No finishes yet.') + '</div>';
            return;
          }
          els.ranking.innerHTML = state.rank.map(function(m) {
            return (
              '<div class="p-3 flex items-center justify-between gap-3">'
                + '<div class="min-w-0 flex items-center gap-2">'
                  + '<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-100 dark:bg-surface-800 text-xs font-extrabold text-surface-700 dark:text-surface-200" data-i18n="tools.marble-roulette.ui.desc16">' + String(m.rank) + '</span>'
                  + '<span class="w-2.5 h-2.5 rounded-full" style="background:' + escapeHtml(m.color) + '" aria-hidden="true"></span>'
                  + '<span class="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate" data-i18n="tools.marble-roulette.ui.desc17">' + escapeHtml(m.name) + '</span>'
                + '</div>'
                + '<div class="text-xs text-surface-500 dark:text-surface-400 tabular-nums">' + (m.finishedAt ? m.finishedAt.toFixed(2) + 's' : '') + '</div>'
              + '</div>'
            );
          }).join('');
        }

        function resolveSelectedWinner() {
          if (!state.rank.length) return null;
          var targetIndex = clamp(getWinnerTarget(state.rank.length), 1, state.rank.length) - 1;
          return state.rank[targetIndex] || state.rank[0] || null;
        }

        function finalizeRun(reason) {
          state.running = false;
          recorder.recording = false;
          if (state.rafId) cancelAnimationFrame(state.rafId);
          state.rafId = 0;

          if (state.rank.length < state.marbles.length) {
            var remaining = state.marbles.filter(function(m) { return !m.finished; });
            remaining.sort(function(a, b) { return b.y - a.y; });
            for (var i = 0; i < remaining.length; i++) {
              var m = remaining[i];
              m.finished = true;
              m.finishedAt = state.simTime;
              m.rank = state.rank.length + 1;
              state.rank.push(m);
            }
          }

          drawFrame(0);
          renderRanking();
          els.resultWrap.classList.remove('hidden');

          var winner = resolveSelectedWinner();
          state.selectedWinner = winner;
          if (winner) {
            els.winnerInline.textContent = '\uD83C\uDFC6 ' + winner.name;
            var prev = state.winCounts.get(winner.name) || 0;
            state.winCounts.set(winner.name, prev + 1);
            renderStats();

            if (!prefersReducedMotion) {
              playCelebration();
              mrConfettiBurst(state.dims.w / 2, state.dims.h / 2);
              triggerShake(4);
            }
            showWinnerModal(winner);
          }

          var msg = reason ? String(reason) : _t('tools.marble-roulette.js.text4', 'Race finished.');
          setStatus(msg, 'success');
        }

        // ── Physics Step ─────────────────────────────────────────────

        function step(dt) {
          var b = state.board;
          var w = state.world.w;
          var worldH = state.world.h;
          if (!b || !w || !worldH) return;

          var maxV = 2400;

          // Integrate velocity + gravity
          for (var i = 0; i < state.marbles.length; i++) {
            var m = state.marbles[i];
            if (m.finished) continue;

            m.vy += b.gravity * dt;
            var damp = Math.max(0, 1 - b.linearDamping * dt);
            m.vx *= damp;
            m.vy *= damp;
            m.x += m.vx * dt;
            m.y += m.vy * dt;

            m.vx = clamp(m.vx, -maxV, maxV);
            m.vy = clamp(m.vy, -maxV, maxV);

            // Trail (position history for drawing)
            if (!prefersReducedMotion) {
              m.trail.push({ x: m.x, y: m.y });
              if (m.trail.length > 10) m.trail.shift();

              // Spawn particle trail
              m.trailTimer -= dt;
              if (m.trailTimer <= 0) {
                spawnTrail(m.x, m.y, m.color);
                m.trailTimer = 0.04;
              }
            }
          }

          // Peg collisions (spatial hash accelerated)
          for (var i = 0; i < state.marbles.length; i++) {
            var m = state.marbles[i];
            if (m.finished) continue;
            var nearby = pegGridQuery(m);
            for (var p = 0; p < nearby.length; p++) {
              var pegIdx = nearby[p];
              var g = state.pegs[pegIdx];
              if (!g) continue;
              var hit = collideCircle(m, g, b.restitution);
              if (hit) {
                state.pegHitTimes.set('' + pegIdx, state.simTime);
                var nowMs = performance.now();
                if (nowMs - lastPegSound > 40) { playPegTick(); lastPegSound = nowMs; }
                triggerShake(0.5);
              }
            }
          }

          // Bumper collisions (pinball mode)
          if (state.isPinball && state.bumpers.length) {
            for (var i = 0; i < state.marbles.length; i++) {
              var m = state.marbles[i];
              if (m.finished) continue;
              for (var bi = 0; bi < state.bumpers.length; bi++) {
                var bump = state.bumpers[bi];
                if (collideBumper(m, bump)) {
                  bump.hitTime = state.simTime;
                  state.bumperHitTimes.set('' + bi, state.simTime);
                  playBumperHit();
                  triggerShake(3);
                }
              }
            }
          }

          // Flipper collisions (pinball mode)
          if (state.isPinball && state.flippers.length) {
            for (var i = 0; i < state.marbles.length; i++) {
              var m = state.marbles[i];
              if (m.finished) continue;
              for (var fi = 0; fi < state.flippers.length; fi++) {
                if (collideFlipper(m, state.flippers[fi])) {
                  playFlipperHit();
                  triggerShake(1.5);
                }
              }
            }
          }

          // Marble-marble collisions
          for (var i = 0; i < state.marbles.length; i++) {
            var a = state.marbles[i];
            if (a.finished) continue;
            for (var j = i + 1; j < state.marbles.length; j++) {
              var c = state.marbles[j];
              if (c.finished) continue;

              var dx = c.x - a.x;
              var dy = c.y - a.y;
              var minDist = a.r + c.r;
              var distSq = dx * dx + dy * dy;
              if (distSq >= minDist * minDist) continue;

              var dist = Math.sqrt(distSq);
              var nx = 1;
              var ny = 0;
              if (dist > 1e-6) {
                nx = dx / dist;
                ny = dy / dist;
              } else {
                dist = 1;
              }

              var overlap = Math.max(0, minDist - dist);
              if (overlap > 0) {
                var half = overlap * 0.5;
                a.x -= nx * half;
                a.y -= ny * half;
                c.x += nx * half;
                c.y += ny * half;
              }

              var rvx = c.vx - a.vx;
              var rvy = c.vy - a.vy;
              var velAlongNormal = rvx * nx + rvy * ny;
              if (velAlongNormal > 0) continue;

              var restitution = 0.62;
              var impulse = -(1 + restitution) * velAlongNormal / 2;
              var ix = impulse * nx;
              var iy = impulse * ny;
              a.vx -= ix;
              a.vy -= iy;
              c.vx += ix;
              c.vy += iy;

              triggerShake(0.3);
            }
          }

          // Wall collisions
          for (var i = 0; i < state.marbles.length; i++) {
            var m = state.marbles[i];
            if (m.finished) continue;
            var minX = b.sidePad + m.r;
            var maxX = w - b.sidePad - m.r;
            if (m.x < minX) {
              m.x = minX;
              if (m.vx < 0) m.vx = -m.vx * b.wallRestitution;
            } else if (m.x > maxX) {
              m.x = maxX;
              if (m.vx > 0) m.vx = -m.vx * b.wallRestitution;
            }
          }

          // Slot arrival check
          for (var i = 0; i < state.marbles.length; i++) {
            var m = state.marbles[i];
            if (m.finished) continue;

            for (var s = 0; s < state.slots.length; s++) {
              var slot = state.slots[s];
              if (slot.occupied) continue;

              var halfW = slot.w / 2 - m.r;
              var halfH = slot.h / 2 - m.r;
              var dx = m.x - slot.x;
              var dy = m.y - slot.y;

              if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
                slot.occupied = true;
                slot.winner = m;
                m.finished = true;
                m.finishedAt = state.simTime;
                m.rank = state.rank.length + 1;
                state.rank.push(m);
                if (!prefersReducedMotion) playArrivalDing();
                renderRanking();

                if (state.rank.length >= getWinnerTarget(state.keepNames.length)) {
                  finalizeRun(_t('tools.marble-roulette.js.text5', 'Winner found!'));
                  return;
                }
                break;
              }
            }
          }

          // Record for replay
          recorderCapture(state.marbles, state.simTime);

          if (state.simTime > b.maxSimSeconds) {
            finalizeRun(_t('tools.marble-roulette.js.text6', 'Time up \u2014 ranking by progress.'));
          }
        }

        function renderStats() {
          var drops = state.drops;
          els.drops.textContent = String(drops);
          if (drops <= 0 || state.winCounts.size === 0) {
            els.statsEmpty.classList.remove('hidden');
            els.stats.classList.add('hidden');
            return;
          }

          els.statsEmpty.classList.add('hidden');
          els.stats.classList.remove('hidden');
          els.statsSub.textContent = _t('tools.marble-roulette.js.text7', 'Drops:') + ' ' + drops;

          var names = state.keepNames.length ? state.keepNames.slice() : Array.from(state.winCounts.keys());
          var rows = [];
          for (var i = 0; i < names.length; i++) {
            var name = names[i];
            var count = state.winCounts.get(name) || 0;
            var color = COLORS[i % COLORS.length];
            rows.push({ name: name, count: count, color: color });
          }

          els.statsGrid.innerHTML = rows.map(function(r) {
            var pct = drops ? Math.round((r.count / drops) * 1000) / 10 : 0;
            return (
              '<div class="rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950/40 p-2">' +
                '<div class="flex items-center justify-between gap-2">' +
                  '<div class="flex items-center gap-2 min-w-0">' +
                    '<span class="inline-block w-2.5 h-2.5 rounded-full" style="background:' + r.color + '"></span>' +
                    '<span class="text-xs font-medium text-surface-900 dark:text-surface-50 truncate" data-i18n="tools.marble-roulette.ui.desc18">' + escapeHtml(r.name) + '</span>' +
                  '</div>' +
                  '<span class="text-xs tabular-nums text-surface-700 dark:text-surface-300" data-i18n="tools.marble-roulette.ui.desc19">' + String(r.count) + '</span>' +
                '</div>' +
                '<div class="mt-1 text-[11px] text-surface-600 dark:text-surface-400">' + String(pct) + '%</div>' +
              '</div>'
            );
          }).join('');
        }

        function tick(ts) {
          if (!state.running) return;
          if (!state.lastTs) state.lastTs = ts;
          var realDt = Math.min(0.05, (ts - state.lastTs) / 1000);
          state.lastTs = ts;

          state.acc += realDt * state.speedMult;

          var dt = state.fixedDt;
          var safety = 0;
          while (state.acc >= dt) {
            state.simTime += dt;
            step(dt);
            state.acc -= dt;
            if (!state.running) break;
            safety++;
            if (safety >= 60) {
              state.acc = 0;
              break;
            }
          }

          updateShake();
          updateTrails(realDt);
          drawFrame(ts);
          if (state.running) state.rafId = requestAnimationFrame(tick);
        }

        // ── Slow-Motion Replay ───────────────────────────────────────

        function startReplay() {
          if (!state.selectedWinner || state.running) return;
          var winnerId = state.selectedWinner.id;
          var path = recorder.frames.get(winnerId);
          if (!path || path.length < 10) return;

          replay.active = true;
          replay.winnerId = winnerId;
          replay.path = path;
          replay.duration = path[path.length - 1].t * 4; // 0.25x speed
          replay.startTime = performance.now();
          els.replayOverlay.classList.remove('hidden');
          setStatus(_t('tools.marble-roulette.js.textReplay', 'Replaying winner path...'), 'neutral');
          replay.rafId = requestAnimationFrame(tickReplay);
        }

        function stopReplay() {
          replay.active = false;
          if (replay.rafId) cancelAnimationFrame(replay.rafId);
          replay.rafId = 0;
          els.replayOverlay.classList.add('hidden');
        }

        function tickReplay(ts) {
          if (!replay.active) return;
          var elapsed = (ts - replay.startTime) / 1000;
          var progress = Math.min(1, elapsed / replay.duration);
          els.replayProgress.style.width = (progress * 100) + '%';

          if (progress >= 1) {
            stopReplay();
            setStatus(_t('tools.marble-roulette.js.text4', 'Race finished.'), 'success');
            return;
          }

          drawReplayFrame(progress);
          replay.rafId = requestAnimationFrame(tickReplay);
        }

        function drawReplayFrame(progress) {
          var w = state.dims.w;
          var h = state.dims.h;
          var b = state.board;
          if (!b || !w || !h) return;
          var dark = getIsDark();

          ctx.clearRect(0, 0, w, h);
          var bgGrad = ctx.createLinearGradient(0, 0, 0, h);
          if (dark) {
            bgGrad.addColorStop(0, 'rgba(2, 6, 23, 0.40)');
            bgGrad.addColorStop(1, 'rgba(2, 6, 23, 0.75)');
          } else {
            bgGrad.addColorStop(0, 'rgba(255, 255, 255, 0.78)');
            bgGrad.addColorStop(1, 'rgba(241, 245, 249, 0.72)');
          }
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, w, h);

          // Interpolate winner position
          var path = replay.path;
          var tMax = path[path.length - 1].t;
          var tCur = progress * tMax;
          var idx = 0;
          for (var i = 0; i < path.length - 1; i++) {
            if (path[i + 1].t >= tCur) { idx = i; break; }
          }
          var f0 = path[idx];
          var f1 = path[Math.min(idx + 1, path.length - 1)];
          var frac = (f1.t - f0.t) > 0 ? (tCur - f0.t) / (f1.t - f0.t) : 0;
          var mx = f0.x + (f1.x - f0.x) * frac;
          var my = f0.y + (f1.y - f0.y) * frac;

          var targetCam = clamp(my - h * 0.5, 0, Math.max(0, b.worldH - h));
          ctx.save();
          ctx.translate(0, -targetCam);

          // Draw walls
          ctx.strokeStyle = dark ? 'rgba(148,163,184,0.22)' : 'rgba(51,65,85,0.16)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(b.sidePad, b.topPad);
          ctx.lineTo(b.sidePad, b.worldH - 10);
          ctx.moveTo(w - b.sidePad, b.topPad);
          ctx.lineTo(w - b.sidePad, b.worldH - 10);
          ctx.stroke();

          // Draw pegs (dimmed)
          ctx.globalAlpha = 0.3;
          for (var i = 0; i < state.pegs.length; i++) {
            var p = state.pegs[i];
            ctx.fillStyle = dark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(148, 163, 184, 0.4)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;

          // Draw replay trail (all past positions)
          var winner = state.selectedWinner;
          if (winner) {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            var trailEnd = idx + 1;
            for (var i = Math.max(0, trailEnd - 80); i < trailEnd; i++) {
              var alpha = (i - (trailEnd - 80)) / 80 * 0.6;
              if (alpha <= 0) continue;
              ctx.strokeStyle = winner.color;
              ctx.globalAlpha = alpha;
              ctx.lineWidth = 4;
              if (i > 0 && path[i] && path[i - 1]) {
                ctx.beginPath();
                ctx.moveTo(path[i - 1].x, path[i - 1].y);
                ctx.lineTo(path[i].x, path[i].y);
                ctx.stroke();
              }
            }
            ctx.restore();

            // Draw marble at current position
            ctx.globalAlpha = 1;
            var r = 13;
            var grad = ctx.createRadialGradient(mx - r * 0.35, my - r * 0.45, 1, mx, my, r * 2);
            grad.addColorStop(0, 'rgba(255,255,255,0.95)');
            grad.addColorStop(0.25, winner.color);
            grad.addColorStop(1, dark ? 'rgba(2,6,23,0.85)' : 'rgba(15,23,42,0.45)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(mx, my, r, 0, Math.PI * 2);
            ctx.fill();

            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.ellipse(mx - r * 0.3, my - r * 0.35, r * 0.25, r * 0.18, -0.3, 0, Math.PI * 2);
            ctx.fill();

            // Name label
            ctx.font = '12px ui-sans-serif, system-ui, -apple-system';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillStyle = dark ? 'rgba(226,232,240,0.9)' : 'rgba(15,23,42,0.75)';
            ctx.fillText(winner.name, mx, my - r - 8);
          }

          ctx.restore();
        }

        // ── Main Draw Frame ──────────────────────────────────────────

        function drawFrame(ts) {
          if (replay.active) return; // replay has its own draw

          var w = state.dims.w;
          var h = state.dims.h;
          var b = state.board;
          if (!b || !w || !h) return;
          var dark = getIsDark();

          ctx.clearRect(0, 0, w, h);
          var bgGrad = ctx.createLinearGradient(0, 0, 0, h);
          if (dark) {
            bgGrad.addColorStop(0, 'rgba(2, 6, 23, 0.40)');
            bgGrad.addColorStop(1, 'rgba(2, 6, 23, 0.75)');
          } else {
            bgGrad.addColorStop(0, 'rgba(255, 255, 255, 0.78)');
            bgGrad.addColorStop(1, 'rgba(241, 245, 249, 0.72)');
          }
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, w, h);

          var leadY = 0;
          for (var i = 0; i < state.marbles.length; i++) {
            var m = state.marbles[i];
            if (m && !m.finished) leadY = Math.max(leadY, m.y);
          }
          if (!leadY && state.slots.length) leadY = b.worldH - b.slotHeight;
          var targetCam = clamp(leadY - h * 0.5, 0, Math.max(0, b.worldH - h));
          var lerp = prefersReducedMotion ? 1 : 0.12;
          state.world.camY = state.world.camY + (targetCam - state.world.camY) * lerp;

          ctx.save();
          ctx.translate(shake.offsetX, -state.world.camY + shake.offsetY);

          // Walls
          ctx.save();
          ctx.strokeStyle = dark ? 'rgba(148,163,184,0.22)' : 'rgba(51,65,85,0.16)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(b.sidePad, b.topPad);
          ctx.lineTo(b.sidePad, b.worldH - 10);
          ctx.moveTo(w - b.sidePad, b.topPad);
          ctx.lineTo(w - b.sidePad, b.worldH - 10);
          ctx.stroke();
          ctx.restore();

          // Slots
          ctx.save();
          for (var i = 0; i < state.slots.length; i++) {
            var slot = state.slots[i];
            var slotGrad = ctx.createLinearGradient(slot.x, slot.y - slot.h/2, slot.x, slot.y + slot.h/2);
            if (dark) {
              slotGrad.addColorStop(0, 'rgba(30, 41, 59, 0.6)');
              slotGrad.addColorStop(1, 'rgba(15, 23, 42, 0.8)');
            } else {
              slotGrad.addColorStop(0, 'rgba(241, 245, 249, 0.6)');
              slotGrad.addColorStop(1, 'rgba(226, 232, 240, 0.8)');
            }
            ctx.fillStyle = slotGrad;
            ctx.fillRect(slot.x - slot.w/2, slot.y - slot.h/2, slot.w, slot.h);

            ctx.strokeStyle = dark ? 'rgba(148,163,184,0.25)' : 'rgba(51,65,85,0.20)';
            ctx.lineWidth = 1;
            ctx.strokeRect(slot.x - slot.w/2, slot.y - slot.h/2, slot.w, slot.h);

            ctx.save();
            ctx.font = '10px ui-sans-serif, system-ui, -apple-system';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = dark ? 'rgba(148,163,184,0.7)' : 'rgba(71,85,105,0.7)';
            ctx.fillText('Slot ' + (i + 1), slot.x, slot.y - slot.h/2 + 4);
            ctx.restore();
          }
          ctx.restore();

          // Bumpers (pinball mode)
          if (state.isPinball && state.bumpers.length) {
            for (var i = 0; i < state.bumpers.length; i++) {
              var bump = state.bumpers[i];
              var hitAge = state.simTime - (state.bumperHitTimes.get('' + i) || -1);
              var glow = hitAge < 0.2;
              var bScale = glow ? 1 + Math.sin(hitAge / 0.2 * Math.PI) * 0.15 : 1;
              var bR = bump.r * bScale;

              // Outer ring
              var bGrad = ctx.createRadialGradient(bump.x, bump.y, bR * 0.3, bump.x, bump.y, bR);
              if (glow) {
                bGrad.addColorStop(0, 'rgba(239, 68, 68, 0.95)');
                bGrad.addColorStop(0.6, 'rgba(239, 68, 68, 0.6)');
                bGrad.addColorStop(1, 'rgba(239, 68, 68, 0.1)');
              } else {
                bGrad.addColorStop(0, dark ? 'rgba(220, 38, 38, 0.85)' : 'rgba(220, 38, 38, 0.8)');
                bGrad.addColorStop(0.7, dark ? 'rgba(153, 27, 27, 0.6)' : 'rgba(185, 28, 28, 0.5)');
                bGrad.addColorStop(1, dark ? 'rgba(127, 29, 29, 0.2)' : 'rgba(153, 27, 27, 0.15)');
              }
              ctx.fillStyle = bGrad;
              ctx.beginPath();
              ctx.arc(bump.x, bump.y, bR, 0, Math.PI * 2);
              ctx.fill();

              // Inner dome highlight
              ctx.fillStyle = 'rgba(255,255,255,0.35)';
              ctx.beginPath();
              ctx.arc(bump.x - bR * 0.15, bump.y - bR * 0.2, bR * 0.35, 0, Math.PI * 2);
              ctx.fill();

              // Border ring
              ctx.strokeStyle = glow ? 'rgba(252, 165, 165, 0.8)' : 'rgba(220, 38, 38, 0.4)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(bump.x, bump.y, bR + 1, 0, Math.PI * 2);
              ctx.stroke();
            }
          }

          // Flippers (pinball mode)
          if (state.isPinball && state.flippers.length) {
            ctx.save();
            ctx.lineCap = 'round';
            for (var i = 0; i < state.flippers.length; i++) {
              var fl = state.flippers[i];
              ctx.strokeStyle = dark ? 'rgba(59, 130, 246, 0.8)' : 'rgba(37, 99, 235, 0.7)';
              ctx.lineWidth = (fl.thickness || 5) * 2;
              ctx.beginPath();
              ctx.moveTo(fl.x1, fl.y1);
              ctx.lineTo(fl.x2, fl.y2);
              ctx.stroke();

              // Inner lighter line
              ctx.strokeStyle = dark ? 'rgba(147, 197, 253, 0.5)' : 'rgba(96, 165, 250, 0.4)';
              ctx.lineWidth = (fl.thickness || 5);
              ctx.beginPath();
              ctx.moveTo(fl.x1, fl.y1);
              ctx.lineTo(fl.x2, fl.y2);
              ctx.stroke();
            }
            ctx.restore();
          }

          // Pegs
          for (var i = 0; i < state.pegs.length; i++) {
            var p = state.pegs[i];
            var hitTime = state.pegHitTimes.get('' + i);
            var scale = 1;
            if (hitTime && state.simTime - hitTime < 0.15) {
              scale = 1 + Math.sin((state.simTime - hitTime) / 0.15 * Math.PI) * 0.3;
            }

            var r = p.r * scale;
            var g = ctx.createRadialGradient(p.x - r * 0.25, p.y - r * 0.25, 1, p.x, p.y, r * 1.6);
            if (dark) {
              g.addColorStop(0, 'rgba(226, 232, 240, 0.92)');
              g.addColorStop(1, 'rgba(148, 163, 184, 0.55)');
            } else {
              g.addColorStop(0, 'rgba(241, 245, 249, 1)');
              g.addColorStop(1, 'rgba(148, 163, 184, 0.70)');
            }
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore(); // un-translate for world coords

          // Trail particles (drawn in screen coords but offset by camY)
          drawTrails(ctx, state.world.camY - shake.offsetY);

          ctx.save();
          ctx.translate(shake.offsetX, -state.world.camY + shake.offsetY);

          // Marbles
          for (var i = 0; i < state.marbles.length; i++) {
            var m = state.marbles[i];
            var r = m.r;

            // Position trail (line segments)
            if (!prefersReducedMotion && m.trail.length > 1) {
              ctx.save();
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              for (var j = 0; j < m.trail.length - 1; j++) {
                var alpha = (j + 1) / m.trail.length * 0.4;
                ctx.strokeStyle = m.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                ctx.lineWidth = r * (j + 1) / m.trail.length;
                ctx.beginPath();
                ctx.moveTo(m.trail[j].x, m.trail[j].y);
                ctx.lineTo(m.trail[j + 1].x, m.trail[j + 1].y);
                ctx.stroke();
              }
              ctx.restore();
            }

            // Marble body with enhanced gradient + shadow
            if (!prefersReducedMotion) {
              ctx.save();
              ctx.shadowColor = m.color;
              ctx.shadowBlur = 8;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 2;
              ctx.restore();
            }

            var grad = ctx.createRadialGradient(m.x - r * 0.35, m.y - r * 0.45, 1, m.x, m.y, r * 2);
            grad.addColorStop(0, 'rgba(255,255,255,0.95)');
            grad.addColorStop(0.25, m.color);
            grad.addColorStop(1, dark ? 'rgba(2,6,23,0.85)' : 'rgba(15,23,42,0.45)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
            ctx.fill();

            // Highlight reflection
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.ellipse(m.x - r * 0.3, m.y - r * 0.35, r * 0.25, r * 0.18, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Secondary reflection (new)
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.ellipse(m.x + r * 0.2, m.y + r * 0.25, r * 0.12, r * 0.08, 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Name label
            if (state.marbles.length <= 10) {
              ctx.save();
              ctx.font = '11px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillStyle = dark ? 'rgba(226,232,240,0.9)' : 'rgba(15,23,42,0.75)';
              ctx.fillText(m.name, m.x, m.y - r - 6);
              ctx.restore();
            }
          }

          mrDrawConfetti(ctx, w, h + state.world.camY);
          ctx.restore();
        }

        // ── Event Listeners ──────────────────────────────────────────

        var ro = new ResizeObserver(function() { resizeCanvas(); });
        ro.observe(els.canvasWrap);
        window.addEventListener('resize', function() { resizeCanvas(); }, { passive: true });

        els.speed1.addEventListener('click', function() { setSpeed(1); });
        els.speed2.addEventListener('click', function() { setSpeed(2); });
        els.speed3.addEventListener('click', function() { setSpeed(3); });
        els.theme.addEventListener('change', function() {
          state.themeId = els.theme.value || marbleBootConfig.defaultTheme;
          resetRun(parseNames(els.names.value));
        });
        els.winnerMode.addEventListener('change', function() {
          state.winnerMode = els.winnerMode.value || marbleBootConfig.defaultWinnerMode;
          els.targetOrdinal.classList.toggle('hidden', state.winnerMode !== 'ordinal');
          resetRun(parseNames(els.names.value));
        });
        els.targetOrdinal.addEventListener('change', function() {
          state.ordinalTarget = clamp(Number(els.targetOrdinal.value || marbleBootConfig.defaultOrdinalTarget), 2, marbleBootConfig.maxParticipants || 10);
          els.targetOrdinal.value = String(state.ordinalTarget);
          resetRun(parseNames(els.names.value));
        });

        els.start.addEventListener('click', function() { startDrop(); });
        els.shuffle.addEventListener('click', function() {
          var list = parseNames(els.names.value);
          if (list.length < 2) return;
          shuffleInPlace(list);
          els.names.value = list.join('\n');
          resetRun(list);
        });

        els.reset.addEventListener('click', function() {
          resetRun(parseNames(els.names.value));
        });

        els.again.addEventListener('click', function() {
          if (state.running || replay.active) return;
          startDrop(state.keepNames);
        });

        els.replayBtn.addEventListener('click', function() {
          if (state.running) return;
          if (replay.active) { stopReplay(); return; }
          startReplay();
        });

        els.removeWinner.addEventListener('click', function() {
          if (state.running || replay.active) return;
          var winner = state.selectedWinner ? state.selectedWinner.name : '';
          if (!winner) return;
          var next = state.keepNames.filter(function(n) { return n !== winner; });
          if (next.length < 2) {
            setStatus(_t('tools.marble-roulette.js.err2', 'Need at least 2 names after removing winner.'), 'error');
            return;
          }
          els.names.value = next.join('\n');
          resetRun(next);
          startDrop(next);
        });

        els.newDraw.addEventListener('click', function() {
          state.winCounts = new Map();
          state.drops = 0;
          els.drops.textContent = '0';
          renderStats();
          resetRun(parseNames(els.names.value));
        });

        els.clearStats.addEventListener('click', function() {
          state.winCounts = new Map();
          state.drops = 0;
          els.drops.textContent = '0';
          renderStats();
          setStatus(_t('tools.marble-roulette.js.text8', 'Stats cleared.'), 'neutral');
          els.winnerInline.textContent = _t('tools.marble-roulette.js.text0', '\u2014');
          els.resultWrap.classList.add('hidden');
          drawFrame(0);
        });

        els.winnerClose.addEventListener('click', hideWinnerModal);
        els.winnerOverlay.addEventListener('click', hideWinnerModal);

        window.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            startDrop();
          }
          if (e.key === 'r' || e.key === 'R') {
            if (document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')) return;
            e.preventDefault();
            resetRun(parseNames(els.names.value));
          }
          if (e.key === 'Escape') {
            if (replay.active) { stopReplay(); return; }
            hideWinnerModal();
          }
        });

        function loadFromURL() {
          var params = new URLSearchParams(window.location.search);
          var namesParam = params.get('names');
          var autostart = params.get('autostart');
          var themeParam = params.get('theme');
          var winnerParam = params.get('winner');
          var ordinalParam = params.get('place');
          if (themeParam && getThemeMeta(themeParam).id) {
            state.themeId = themeParam;
            els.theme.value = themeParam;
          }
          if (winnerParam && ['first', 'last', 'ordinal'].includes(String(winnerParam))) {
            state.winnerMode = String(winnerParam);
            els.winnerMode.value = state.winnerMode;
          }
          if (ordinalParam) {
            state.ordinalTarget = clamp(Number(ordinalParam || marbleBootConfig.defaultOrdinalTarget), 2, marbleBootConfig.maxParticipants || 10);
            els.targetOrdinal.value = String(state.ordinalTarget);
          }
          els.targetOrdinal.classList.toggle('hidden', state.winnerMode !== 'ordinal');
          if (namesParam) {
            var list = parseNames(String(namesParam));
            if (list.length >= 2) {
              els.names.value = list.join('\n');
              resetRun(list);
              if (String(autostart).toLowerCase() === 'true') {
                setTimeout(function() { startDrop(list); }, 120);
              }
            }
          }
        }

        function init() {
          els.theme.value = state.themeId;
          els.winnerMode.value = state.winnerMode;
          els.targetOrdinal.value = String(state.ordinalTarget);
          els.targetOrdinal.classList.toggle('hidden', state.winnerMode !== 'ordinal');
          setSpeed(1);
          rebuildBoard();
          resetRun(parseNames(els.names.value));
          renderStats();
          loadFromURL();
        }

        init();
      })();
    </script>
  `;

  return respondHTML(createPageTemplate({
    title: toolTranslation?.name || 'Marble Roulette',
    description: toolTranslation?.desc || 'A physics-based marble race lucky draw. Marbles drop through pegs and the first to reach a collection slot wins.',
    path: '/marble-roulette',
    content,
    scripts,
    lang
  }));
}

export async function handleMarbleRouletteRoutes(request, url) {
  if (url.pathname === '/marble-roulette' || url.pathname === '/marble-roulette/') {
    if (request.method === 'GET') return renderMarbleRoulettePage(resolveRequestLanguage(request, url));
  }
  return null;
}
