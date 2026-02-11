import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';

function renderMarbleRoulettePage() {
  const toolHeader = createToolHeader(
    { emoji: '🎱' },
    'Marble Roulette',
    'Drop marbles through pegs for a physics-based lucky draw.',
    [
      { text: '<span data-i18n="tools.marble-roulette.ui.badge0">Client-Side Only</span>' },
      { text: '<span data-i18n="tools.marble-roulette.ui.badge1">Fair + Unpredictable</span>' }
    ],
    { toolId: 'marble-roulette' }
  );

  const content = `
    <style>
      .marble-roulette-page { overflow-x: hidden; }
      .marble-roulette-page canvas { max-width: 100%; }
    </style>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 marble-roulette-page">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
        ${toolHeader}

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Canvas / Board -->
          <section class="lg:col-span-7" aria-label="Marble board">
            <div class="bg-surface-50 dark:bg-surface-950/40 border border-surface-200 dark:border-surface-800 rounded-xl p-4">
              <div class="flex items-center justify-between gap-3 mb-3">
                <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-50" data-i18n="tools.marble-roulette.ui.heading0">Board</h2>
                <div class="text-xs text-surface-600 dark:text-surface-400" aria-live="polite" id="mr-status" data-i18n="tools.marble-roulette.ui.status0">Ready.</div>
              </div>

              <div id="mr-canvas-wrap" class="relative w-full max-w-full overflow-hidden rounded-lg border border-surface-200 dark:border-surface-800 bg-white/60 dark:bg-surface-950/60" style="aspect-ratio: 3 / 2.5; max-height: 60vh;">
                <canvas id="mr-canvas" class="absolute inset-0 w-full h-full max-w-full" aria-label="Marble simulation canvas" role="img"></canvas>
                <div class="pointer-events-none absolute inset-x-0 top-0 p-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="inline-flex items-center gap-2 text-xs text-surface-700 dark:text-surface-300 bg-white/80 dark:bg-surface-950/70 border border-surface-200/60 dark:border-surface-800/60 rounded-full px-3 py-1">
                      <span class="font-semibold" data-i18n="tools.marble-roulette.ui.stat0">Drops</span>
                      <span class="tabular-nums" id="mr-drops">0</span>
                      <span class="text-surface-400">•</span>
                      <span data-i18n="tools.marble-roulette.ui.stat1">Speed</span>
                      <span class="tabular-nums" id="mr-speed">1x</span>
                    </div>
                    <div class="hidden sm:flex items-center gap-2 text-[11px] text-surface-600 dark:text-surface-400">
                      <span class="inline-flex items-center gap-1" aria-hidden="true">↵</span>
                      <span data-i18n="tools.marble-roulette.ui.text1">Start</span>
                      <span class="text-surface-400">•</span>
                      <span class="inline-flex items-center gap-1" aria-hidden="true">R</span>
                      <span data-i18n="tools.marble-roulette.ui.text2">Reset</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                  <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.heading1">Winner</div>
                  <div id="mr-winner-inline" class="mt-1 text-sm font-semibold text-surface-900 dark:text-surface-50" data-i18n="tools.marble-roulette.ui.text3">—</div>
                </div>
                <div class="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                  <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.heading2">Fairness</div>
                  <div class="mt-1 text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.desc0">Each drop randomizes start positions using Web Crypto.</div>
                </div>
              </div>
            </div>
          </section>

          <!-- Controls -->
          <section class="lg:col-span-5" aria-label="Controls">
            <div class="bg-surface-50 dark:bg-surface-950/40 border border-surface-200 dark:border-surface-800 rounded-xl p-4">
              <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-3" data-i18n="tools.marble-roulette.ui.heading3">Controls</h2>

              <div class="flex flex-col gap-4">
                <div>
                  <label class="label" for="mr-names"><span data-i18n="tools.marble-roulette.ui.label0">Names / options</span></label>
                   <textarea id="mr-names" class="input resize-y min-h-[9rem]" rows="6" aria-label="Names" data-i18n-placeholder="tools.marble-roulette.ui.placeholder0" placeholder="Alice&#10;Bob&#10;Charlie&#10;Dave">Alice
Bob
Charlie
Dave</textarea>
                  <p class="mt-2 text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.desc1">Enter 2–10 names (one per line or comma-separated).</p>
                </div>

                <div class="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                  <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.label2">Speed</div>
                  <div class="mt-2 flex flex-wrap gap-2" aria-label="Speed controls">
                    <button type="button" class="btn btn-secondary" id="mr-speed-1" aria-pressed="true"><span data-i18n="tools.marble-roulette.ui.button0">1x</span></button>
                    <button type="button" class="btn btn-secondary" id="mr-speed-2" aria-pressed="false"><span data-i18n="tools.marble-roulette.ui.button1">2x</span></button>
                    <button type="button" class="btn btn-secondary" id="mr-speed-3" aria-pressed="false"><span data-i18n="tools.marble-roulette.ui.button2">3x</span></button>
                  </div>
                  <p class="mt-2 text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.desc2">Higher speed runs the simulation faster.</p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <button type="button" id="mr-start" class="btn btn-primary" aria-label="Start drop">
                    <span data-i18n="tools.marble-roulette.ui.button3">Start</span>
                  </button>
                  <button type="button" id="mr-reset" class="btn btn-ghost" aria-label="Reset">
                    <span data-i18n="tools.marble-roulette.ui.button4">Reset</span>
                  </button>
                </div>

                <div id="mr-result" class="hidden" aria-live="polite">
                  <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
                    <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.heading4">Result</div>
                    <div class="mt-1 text-lg font-bold text-surface-900 dark:text-surface-50" id="mr-result-title" data-i18n="tools.marble-roulette.ui.text4">🏁 Ranking</div>
                    <div class="mt-3 border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden bg-surface-50 dark:bg-surface-950" aria-label="Ranking">
                      <div id="mr-ranking" class="divide-y divide-surface-200 dark:divide-surface-800"></div>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <button type="button" class="btn btn-primary" id="mr-again">
                        <span data-i18n="tools.marble-roulette.ui.button5">Drop Again</span>
                      </button>
                      <button type="button" class="btn btn-secondary" id="mr-remove-winner">
                        <span data-i18n="tools.marble-roulette.ui.button6">Remove Winner &amp; Drop</span>
                      </button>
                      <button type="button" class="btn btn-ghost" id="mr-new">
                        <span data-i18n="tools.marble-roulette.ui.button7">New Draw</span>
                      </button>
                    </div>
                    <p class="mt-3 text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.desc3">Tip: share by adding <span class="font-mono">?names=Alice,Bob&amp;autostart=true</span>.</p>
                  </div>
                </div>

                <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
                  <div class="flex items-center justify-between gap-3">
                    <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.heading5">Statistics</div>
                    <button type="button" class="btn btn-ghost" id="mr-clear-stats" aria-label="Clear stats">
                      <span data-i18n="tools.marble-roulette.ui.button8">Clear Stats</span>
                    </button>
                  </div>
                  <div class="mt-3 text-sm text-surface-800 dark:text-surface-200" id="mr-stats-empty" data-i18n="tools.marble-roulette.ui.text5">No drops yet — press Start.</div>
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
              <span class="text-3xl">🏆</span>
            </div>
            <h3 class="text-lg font-semibold text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.marble-roulette.ui.heading8">Winner</h3>
            <div class="winner-name text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-50 mb-4" id="winner-name"></div>
            <div class="flex items-center justify-center gap-2 mb-6">
              <span class="inline-block w-4 h-4 rounded-full" id="winner-color"></span>
              <span class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.text6">First to the bottom!</span>
            </div>
            <button type="button" id="winner-close" class="btn btn-primary w-full">
              <span data-i18n="tools.marble-roulette.ui.button9">Awesome</span>
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

        const COLORS = [
          '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
          '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
        ];

        const els = {
          canvasWrap: document.getElementById('mr-canvas-wrap'),
          canvas: document.getElementById('mr-canvas'),
          names: document.getElementById('mr-names'),
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

        function playArrivalDing() {
          mrPlayBeep(880, 80, 0.10);
          setTimeout(() => mrPlayBeep(1100, 60, 0.08), 60);
        }

        function playCelebration() {
          const notes = [523, 659, 784, 1047, 1319];
          const delays = [0, 70, 140, 250, 380];
          for (let i = 0; i < notes.length; i++) {
            setTimeout(() => mrPlayBeep(notes[i], 100, 0.12 - i * 0.01), delays[i]);
          }
        }

        let mrConfettiParticles = [];

        function mrConfettiBurst(cx, cy) {
          if (prefersReducedMotion) return;
          mrConfettiParticles = [];
          for (let i = 0; i < 120; i++) {
            const a = randFloat01() * Math.PI * 2;
            const sp = 2 + randFloat01() * 4.5;
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
          const dt = 1 / 60;
          for (let i = mrConfettiParticles.length - 1; i >= 0; i--) {
            const p = mrConfettiParticles[i];
            p.vy += 8 * dt;
            p.x += p.vx * 60 * dt;
            p.y += p.vy * 60 * dt;
            p.rot += p.vr * 60 * dt;
            p.alpha *= 0.988;
            if (p.alpha < 0.04 || p.y > h + 30) mrConfettiParticles.splice(i, 1);
          }
          ctx2.save();
          for (let i = 0; i < mrConfettiParticles.length; i++) {
            const p = mrConfettiParticles[i];
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

        function parseNames(text) {
          const raw = String(text || '').replaceAll('\r', '').trim();
          if (!raw) return [];
          const normalized = raw.replaceAll(',', '\n');
          const parts = normalized.split('\n').map(s => s.trim()).filter(Boolean);
          const names = [];
          const seen = new Set();
          for (let i = 0; i < parts.length; i++) {
            const n = parts[i].slice(0, 32);
            const key = n.toLowerCase();
            if (!n) continue;
            if (seen.has(key)) continue;
            seen.add(key);
            names.push(n);
            if (names.length >= 10) break;
          }
          return names;
        }

        /** Simulation */
        const ctx = els.canvas.getContext('2d', { alpha: true });
        const state = {
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
          marbles: [],
          slots: [],
          drops: 0,
          rank: [],
          winCounts: new Map(),
          keepNames: [],
          pegHitTimes: new Map()
        };

        function setStatus(text, type) {
          els.status.textContent = text;
          els.status.className = 'text-xs ' + (statusColorMap[type] || statusColorMap['neutral']);
        }

        function getIsDark() {
          return document.documentElement.classList.contains('dark');
        }

        function resizeCanvas() {
          const rect = els.canvasWrap.getBoundingClientRect();
          const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
          const w = Math.max(320, Math.floor(rect.width));
          const h = Math.max(240, Math.floor(rect.height));

          state.dims.w = w;
          state.dims.h = h;
          state.dims.dpr = dpr;
          els.canvas.width = Math.floor(w * dpr);
          els.canvas.height = Math.floor(h * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          if (!state.running) {
            rebuildBoard();
          }
          drawFrame(0);
        }

        function rebuildBoard() {
          const w = state.dims.w;
          const sidePad = Math.max(18, Math.min(36, w * 0.05));
          const topPad = 22;
          const worldH = 2400;

          state.world.w = w;
          state.world.h = worldH;

          state.board = {
            sidePad,
            topPad,
            worldH,
            pegR: 5.5,
            marbleR: 13,
            gravity: 980,
            restitution: 0.62,
            wallRestitution: 0.60,
            linearDamping: 0.08,
            maxSimSeconds: 45,
            slotHeight: 70,
            slotGap: 4
          };

          if (!state.running) {
            rebuildPegs();
            rebuildSlots();
          }
        }

        function rebuildPegs() {
          const w = state.dims.w;
          const b = state.board;

          const usableW = w - b.sidePad * 2;
          const targetCols = 10;
          const spacingX = clamp(usableW / targetCols, 34, 56);
          const rows = 32;
          const topY = b.topPad + 140;
          const bottomY = b.worldH - b.slotHeight - 120;
          const spacingY = clamp((bottomY - topY) / Math.max(1, rows), 44, 58);

          const maxCols = Math.floor(usableW / spacingX);
          const baseCols = clamp(maxCols, 9, 11);
          const pegs = [];

          for (let r = 0; r < rows; r++) {
            const y = topY + r * spacingY;
            const isOffset = r % 2 === 1;
            const cols = baseCols;
            const rowW = (cols - 1) * spacingX;
            const startX = (w / 2) - (rowW / 2) + (isOffset ? spacingX * 0.5 : 0);
            for (let c = 0; c < cols; c++) {
              const x = startX + c * spacingX;
              if (x < b.sidePad + 16 || x > w - b.sidePad - 16) continue;
              pegs.push({ x: x + randRange(-2, 2), y: y + randRange(-1.5, 1.5), r: b.pegR });
            }
          }

          state.pegs = pegs;
        }

        function rebuildSlots() {
          const w = state.world.w;
          const b = state.board;
          const slotCount = Math.max(2, state.keepNames.length || 4);
          const slotW = (w - b.sidePad * 2 - (slotCount - 1) * b.slotGap) / slotCount;
          const slots = [];

          for (let i = 0; i < slotCount; i++) {
            const x = b.sidePad + i * (slotW + b.slotGap) + slotW / 2;
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

        function newMarbles(names) {
          const n = names.length;
          const w = state.world.w;
          const b = state.board;

          const positions = [];
          for (let i = 0; i < n; i++) {
            const baseX = b.sidePad + ((w - b.sidePad * 2) / n) * (i + 0.5);
            positions.push(baseX);
          }
          shuffleInPlace(positions);

          const marbles = [];
          for (let i = 0; i < n; i++) {
            const name = names[i];
            const color = COLORS[i % COLORS.length];
            const laneW = (w - b.sidePad * 2) / Math.max(1, n);
            const xJ = randRange(-laneW * 0.18, laneW * 0.18);
            const x = clamp(positions[i] + xJ, b.sidePad + b.marbleR + 2, w - b.sidePad - b.marbleR - 2);
            const y = b.topPad + 26 + randRange(-4, 4);
            const vx = randRange(-70, 70);
            const vy = randRange(-20, 10);
            marbles.push({
              id: 'm' + i,
              name,
              color,
              x,
              y,
              vx,
              vy,
              r: b.marbleR,
              m: 1,
              finished: false,
              finishedAt: 0,
              rank: 0,
              trail: []
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
          els.winnerInline.textContent = _t('tools.marble-roulette.js.text0', '—');
          els.resultWrap.classList.add('hidden');
          if (els.ranking) els.ranking.innerHTML = '';
          setStatus(_t('tools.marble-roulette.js.text1', 'Ready.'), 'neutral');
          if (Array.isArray(keepNames)) state.keepNames = keepNames;
          state.marbles = [];
          state.rank = [];
          state.pegs = [];
          state.slots = [];
          state.world.camY = 0;
          state.pegHitTimes.clear();
          mrConfettiParticles = [];
          hideWinnerModal();
          rebuildBoard();
          drawFrame(0);
        }

        function setSpeed(mult) {
          state.speedMult = mult;
          els.speed.textContent = String(mult) + 'x';
          const btns = [
            { el: els.speed1, v: 1 },
            { el: els.speed2, v: 2 },
            { el: els.speed3, v: 3 }
          ];
          btns.forEach(b => {
            b.el.setAttribute('aria-pressed', b.v === mult ? 'true' : 'false');
            b.el.classList.toggle('ring-2', b.v === mult);
            b.el.classList.toggle('ring-primary-400', b.v === mult);
            b.el.classList.toggle('ring-offset-2', b.v === mult);
            b.el.classList.toggle('ring-offset-white', b.v === mult);
            b.el.classList.toggle('dark:ring-offset-surface-900', b.v === mult);
          });
        }

        function startDrop(names) {
          if (state.running) return;
          if (!state.board) rebuildBoard();

          const list = Array.isArray(names) ? names : parseNames(els.names.value);
          if (list.length < 2) {
            setStatus(_t('tools.marble-roulette.js.err0', 'Enter at least 2 names.'), 'error');
            return;
          }
          if (list.length > 10) {
            setStatus(_t('tools.marble-roulette.js.err1', 'Max 10 names.'), 'error');
            return;
          }

          els.start.disabled = true;
          mrConfettiParticles = [];
          hideWinnerModal();

          state.keepNames = list.slice();
          state.marbles = newMarbles(list);
          state.rank = [];
          state.simTime = 0;
          state.acc = 0;
          state.lastTs = 0;
          state.world.camY = 0;
          state.pegHitTimes.clear();
          rebuildSlots();
          state.running = true;
          state.drops += 1;
          els.drops.textContent = String(state.drops);
          setStatus(_t('tools.marble-roulette.js.text2', 'Dropping...'), 'neutral');
          els.resultWrap.classList.add('hidden');
          els.winnerInline.textContent = _t('tools.marble-roulette.js.text0', '—');
          if (els.ranking) els.ranking.innerHTML = '';
          els.start.disabled = false;
          drawFrame(0);
          state.rafId = requestAnimationFrame(tick);
        }

        function showWinnerModal(winner) {
          els.winnerName.textContent = winner.name;
          els.winnerColor.style.backgroundColor = winner.color;
          els.winnerModal.classList.remove('hidden');
          requestAnimationFrame(() => {
            els.winnerOverlay.classList.remove('opacity-0');
            els.winnerPanel.classList.remove('scale-95', 'opacity-0');
            els.winnerPanel.classList.add('scale-100', 'opacity-100');
          });
        }

        function hideWinnerModal() {
          els.winnerOverlay.classList.add('opacity-0');
          els.winnerPanel.classList.remove('scale-100', 'opacity-100');
          els.winnerPanel.classList.add('scale-95', 'opacity-0');
          setTimeout(() => {
            els.winnerModal.classList.add('hidden');
          }, 300);
        }

        function renderRanking() {
          if (!els.ranking) return;
          if (!state.rank.length) {
            els.ranking.innerHTML = '<div class="p-3 text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.js.text3">No finishes yet.</div>';
            return;
          }
          els.ranking.innerHTML = state.rank.map((m) => {
            return (
              '<div class="p-3 flex items-center justify-between gap-3">'
                + '<div class="min-w-0 flex items-center gap-2">'
                  + '<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-100 dark:bg-surface-800 text-xs font-extrabold text-surface-700 dark:text-surface-200">' + String(m.rank) + '</span>'
                  + '<span class="w-2.5 h-2.5 rounded-full" style="background:' + escapeHtml(m.color) + '" aria-hidden="true"></span>'
                  + '<span class="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate">' + escapeHtml(m.name) + '</span>'
                + '</div>'
                + '<div class="text-xs text-surface-500 dark:text-surface-400 tabular-nums">' + (m.finishedAt ? m.finishedAt.toFixed(1) + 's' : '') + '</div>'
              + '</div>'
            );
          }).join('');
        }

        function finalizeRun(reason) {
          state.running = false;
          if (state.rafId) cancelAnimationFrame(state.rafId);
          state.rafId = 0;

          if (state.rank.length < state.marbles.length) {
            const remaining = state.marbles.filter(m => !m.finished);
            remaining.sort((a, b) => (b.y - a.y));
            for (let i = 0; i < remaining.length; i++) {
              const m = remaining[i];
              m.finished = true;
              m.finishedAt = state.simTime;
              m.rank = state.rank.length + 1;
              state.rank.push(m);
            }
          }

          drawFrame(0);
          renderRanking();
          els.resultWrap.classList.remove('hidden');

          const winner = state.rank[0];
          if (winner) {
            els.winnerInline.textContent = '🏆 ' + winner.name;
            const prev = state.winCounts.get(winner.name) || 0;
            state.winCounts.set(winner.name, prev + 1);
            renderStats();

            if (!prefersReducedMotion) {
              playCelebration();
              mrConfettiBurst(state.dims.w / 2, state.dims.h / 2);
            }
            showWinnerModal(winner);
          }

          const msg = reason ? String(reason) : _t('tools.marble-roulette.js.text4', 'Race finished.');
          setStatus(msg, 'success');
        }

        function collideCircle(m, c, restitution) {
          const dx = m.x - c.x;
          const dy = m.y - c.y;
          const rr = m.r + c.r;
          const d2 = dx * dx + dy * dy;
          if (d2 <= 0 || d2 >= rr * rr) return false;
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          const overlap = rr - d;
          m.x += nx * overlap;
          m.y += ny * overlap;
          const vn = m.vx * nx + m.vy * ny;
          if (vn < 0) {
            const j = -(1 + restitution) * vn;
            m.vx += j * nx;
            m.vy += j * ny;
          }
          return true;
        }

        function collideSegment(m, ax, ay, bx, by, restitution) {
          const abx = bx - ax;
          const aby = by - ay;
          const apx = m.x - ax;
          const apy = m.y - ay;
          const abLen2 = abx * abx + aby * aby;
          if (abLen2 <= 0) return false;
          let t = (apx * abx + apy * aby) / abLen2;
          t = clamp(t, 0, 1);
          const cx = ax + abx * t;
          const cy = ay + aby * t;
          const dx = m.x - cx;
          const dy = m.y - cy;
          const d2 = dx * dx + dy * dy;
          const rr = m.r;
          if (d2 <= 0 || d2 >= rr * rr) return false;
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          const overlap = rr - d;
          m.x += nx * overlap;
          m.y += ny * overlap;
          const vn = m.vx * nx + m.vy * ny;
          if (vn < 0) {
            const j = -(1 + restitution) * vn;
            m.vx += j * nx;
            m.vy += j * ny;
          }
          return true;
        }

        function step(dt) {
          const b = state.board;
          const w = state.world.w;
          const worldH = state.world.h;
          if (!b || !w || !worldH) return;

          const maxV = 2400;

          for (let i = 0; i < state.marbles.length; i++) {
            const m = state.marbles[i];
            if (m.finished) continue;

            m.vy += b.gravity * dt;
            const damp = Math.max(0, 1 - b.linearDamping * dt);
            m.vx *= damp;
            m.vy *= damp;
            m.x += m.vx * dt;
            m.y += m.vy * dt;

            m.vx = clamp(m.vx, -maxV, maxV);
            m.vy = clamp(m.vy, -maxV, maxV);

            if (!prefersReducedMotion) {
              m.trail.push({ x: m.x, y: m.y });
              if (m.trail.length > 8) m.trail.shift();
            }
          }

          for (let i = 0; i < state.marbles.length; i++) {
            const m = state.marbles[i];
            if (m.finished) continue;
            for (let p = 0; p < state.pegs.length; p++) {
              const g = state.pegs[p];
              const hit = collideCircle(m, g, b.restitution);
              if (hit) {
                state.pegHitTimes.set('' + p, state.simTime);
                const nowMs = performance.now();
                if (nowMs - lastPegSound > 40) { playPegTick(); lastPegSound = nowMs; }
              }
            }
          }

          for (let i = 0; i < state.marbles.length; i++) {
            const a = state.marbles[i];
            if (a.finished) continue;
            for (let j = i + 1; j < state.marbles.length; j++) {
              const c = state.marbles[j];
              if (c.finished) continue;

              const dx = c.x - a.x;
              const dy = c.y - a.y;
              const minDist = a.r + c.r;
              const distSq = dx * dx + dy * dy;
              if (distSq >= minDist * minDist) continue;

              let dist = Math.sqrt(distSq);
              let nx = 1;
              let ny = 0;
              if (dist > 1e-6) {
                nx = dx / dist;
                ny = dy / dist;
              } else {
                dist = 1;
              }

              const overlap = Math.max(0, minDist - dist);
              if (overlap > 0) {
                const half = overlap * 0.5;
                a.x -= nx * half;
                a.y -= ny * half;
                c.x += nx * half;
                c.y += ny * half;
              }

              const rvx = c.vx - a.vx;
              const rvy = c.vy - a.vy;
              const velAlongNormal = rvx * nx + rvy * ny;
              if (velAlongNormal > 0) continue;

              const restitution = 0.62;
              const impulse = -(1 + restitution) * velAlongNormal / 2;
              const ix = impulse * nx;
              const iy = impulse * ny;
              a.vx -= ix;
              a.vy -= iy;
              c.vx += ix;
              c.vy += iy;
            }
          }

          for (let i = 0; i < state.marbles.length; i++) {
            const m = state.marbles[i];
            if (m.finished) continue;
            const minX = b.sidePad + m.r;
            const maxX = w - b.sidePad - m.r;
            if (m.x < minX) {
              m.x = minX;
              if (m.vx < 0) m.vx = -m.vx * b.wallRestitution;
            } else if (m.x > maxX) {
              m.x = maxX;
              if (m.vx > 0) m.vx = -m.vx * b.wallRestitution;
            }
          }

          for (let i = 0; i < state.marbles.length; i++) {
            const m = state.marbles[i];
            if (m.finished) continue;

            for (let s = 0; s < state.slots.length; s++) {
              const slot = state.slots[s];
              if (slot.occupied) continue;

              const halfW = slot.w / 2 - m.r;
              const halfH = slot.h / 2 - m.r;
              const dx = m.x - slot.x;
              const dy = m.y - slot.y;

              if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
                slot.occupied = true;
                slot.winner = m;
                m.finished = true;
                m.finishedAt = state.simTime;
                m.rank = state.rank.length + 1;
                state.rank.push(m);
                if (!prefersReducedMotion) playArrivalDing();
                renderRanking();

                if (state.rank.length === 1) {
                  finalizeRun(_t('tools.marble-roulette.js.text5', 'Winner found!'));
                  return;
                }
                break;
              }
            }
          }

          if (state.simTime > b.maxSimSeconds) {
            finalizeRun(_t('tools.marble-roulette.js.text6', 'Time up — ranking by progress.'));
          }
        }

        function renderStats() {
          const drops = state.drops;
          els.drops.textContent = String(drops);
          if (drops <= 0 || state.winCounts.size === 0) {
            els.statsEmpty.classList.remove('hidden');
            els.stats.classList.add('hidden');
            return;
          }

          els.statsEmpty.classList.add('hidden');
          els.stats.classList.remove('hidden');
          els.statsSub.textContent = _t('tools.marble-roulette.js.text7', 'Drops:') + ' ' + drops;

          const names = state.keepNames.length ? state.keepNames.slice() : Array.from(state.winCounts.keys());
          const rows = [];
          for (let i = 0; i < names.length; i++) {
            const name = names[i];
            const count = state.winCounts.get(name) || 0;
            const color = COLORS[i % COLORS.length];
            rows.push({ name, count, color });
          }

          els.statsGrid.innerHTML = rows.map(r => {
            const pct = drops ? Math.round((r.count / drops) * 1000) / 10 : 0;
            return (
              '<div class="rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950/40 p-2">' +
                '<div class="flex items-center justify-between gap-2">' +
                  '<div class="flex items-center gap-2 min-w-0">' +
                    '<span class="inline-block w-2.5 h-2.5 rounded-full" style="background:' + r.color + '"></span>' +
                    '<span class="text-xs font-medium text-surface-900 dark:text-surface-50 truncate">' + escapeHtml(r.name) + '</span>' +
                  '</div>' +
                  '<span class="text-xs tabular-nums text-surface-700 dark:text-surface-300">' + String(r.count) + '</span>' +
                '</div>' +
                '<div class="mt-1 text-[11px] text-surface-600 dark:text-surface-400">' + String(pct) + '%</div>' +
              '</div>'
            );
          }).join('');
        }

        function tick(ts) {
          if (!state.running) return;
          if (!state.lastTs) state.lastTs = ts;
          const realDt = Math.min(0.05, (ts - state.lastTs) / 1000);
          state.lastTs = ts;

          state.acc += realDt * state.speedMult;

          const dt = state.fixedDt;
          let safety = 0;
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

          drawFrame(ts);
          if (state.running) state.rafId = requestAnimationFrame(tick);
        }

        function drawFrame(ts) {
          const w = state.dims.w;
          const h = state.dims.h;
          const b = state.board;
          if (!b || !w || !h) return;
          const dark = getIsDark();

          ctx.clearRect(0, 0, w, h);
          const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
          if (dark) {
            bgGrad.addColorStop(0, 'rgba(2, 6, 23, 0.40)');
            bgGrad.addColorStop(1, 'rgba(2, 6, 23, 0.75)');
          } else {
            bgGrad.addColorStop(0, 'rgba(255, 255, 255, 0.78)');
            bgGrad.addColorStop(1, 'rgba(241, 245, 249, 0.72)');
          }
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, w, h);

          let leadY = 0;
          for (let i = 0; i < state.marbles.length; i++) {
            const m = state.marbles[i];
            if (m && !m.finished) leadY = Math.max(leadY, m.y);
          }
          if (!leadY && state.slots.length) leadY = b.worldH - b.slotHeight;
          const targetCam = clamp(leadY - h * 0.5, 0, Math.max(0, b.worldH - h));
          const lerp = prefersReducedMotion ? 1 : 0.12;
          state.world.camY = state.world.camY + (targetCam - state.world.camY) * lerp;

          ctx.save();
          ctx.translate(0, -state.world.camY);

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

          ctx.save();
          for (let i = 0; i < state.slots.length; i++) {
            const slot = state.slots[i];
            const slotGrad = ctx.createLinearGradient(slot.x, slot.y - slot.h/2, slot.x, slot.y + slot.h/2);
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

          for (let i = 0; i < state.pegs.length; i++) {
            const p = state.pegs[i];
            const hitTime = state.pegHitTimes.get('' + i);
            let scale = 1;
            if (hitTime && state.simTime - hitTime < 0.15) {
              scale = 1 + Math.sin((state.simTime - hitTime) / 0.15 * Math.PI) * 0.3;
            }

            const r = p.r * scale;
            const g = ctx.createRadialGradient(p.x - r * 0.25, p.y - r * 0.25, 1, p.x, p.y, r * 1.6);
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

          for (let i = 0; i < state.marbles.length; i++) {
            const m = state.marbles[i];
            const r = m.r;

            if (!prefersReducedMotion && m.trail.length > 1) {
              ctx.save();
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              for (let j = 0; j < m.trail.length - 1; j++) {
                const alpha = (j + 1) / m.trail.length * 0.4;
                ctx.strokeStyle = m.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                ctx.lineWidth = r * (j + 1) / m.trail.length;
                ctx.beginPath();
                ctx.moveTo(m.trail[j].x, m.trail[j].y);
                ctx.lineTo(m.trail[j + 1].x, m.trail[j + 1].y);
                ctx.stroke();
              }
              ctx.restore();
            }

            const grad = ctx.createRadialGradient(m.x - r * 0.35, m.y - r * 0.45, 1, m.x, m.y, r * 2);
            grad.addColorStop(0, 'rgba(255,255,255,0.95)');
            grad.addColorStop(0.25, m.color);
            grad.addColorStop(1, dark ? 'rgba(2,6,23,0.85)' : 'rgba(15,23,42,0.45)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
            ctx.fill();

            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.ellipse(m.x - r * 0.3, m.y - r * 0.35, r * 0.25, r * 0.18, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

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

          mrDrawConfetti(ctx, w, h);
          ctx.restore();
        }

        const ro = new ResizeObserver(() => resizeCanvas());
        ro.observe(els.canvasWrap);
        window.addEventListener('resize', () => resizeCanvas(), { passive: true });

        els.speed1.addEventListener('click', () => setSpeed(1));
        els.speed2.addEventListener('click', () => setSpeed(2));
        els.speed3.addEventListener('click', () => setSpeed(3));

        els.start.addEventListener('click', () => startDrop());

        els.reset.addEventListener('click', () => {
          resetRun(parseNames(els.names.value));
        });

        els.again.addEventListener('click', () => {
          if (state.running) return;
          startDrop(state.keepNames);
        });

        els.removeWinner.addEventListener('click', () => {
          if (state.running) return;
          const winner = (state.rank && state.rank[0]) ? state.rank[0].name : '';
          if (!winner) return;
          const next = state.keepNames.filter(n => n !== winner);
          if (next.length < 2) {
            setStatus(_t('tools.marble-roulette.js.err2', 'Need at least 2 names after removing winner.'), 'error');
            return;
          }
          els.names.value = next.join('\n');
          resetRun(next);
          startDrop(next);
        });

        els.newDraw.addEventListener('click', () => {
          state.winCounts = new Map();
          state.drops = 0;
          els.drops.textContent = '0';
          renderStats();
          resetRun(parseNames(els.names.value));
        });

        els.clearStats.addEventListener('click', () => {
          state.winCounts = new Map();
          state.drops = 0;
          els.drops.textContent = '0';
          renderStats();
          setStatus(_t('tools.marble-roulette.js.text8', 'Stats cleared.'), 'neutral');
          els.winnerInline.textContent = _t('tools.marble-roulette.js.text0', '—');
          els.resultWrap.classList.add('hidden');
          drawFrame(0);
        });

        els.winnerClose.addEventListener('click', hideWinnerModal);
        els.winnerOverlay.addEventListener('click', hideWinnerModal);

        window.addEventListener('keydown', (e) => {
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
            hideWinnerModal();
          }
        });

        function loadFromURL() {
          const params = new URLSearchParams(window.location.search);
          const namesParam = params.get('names');
          const autostart = params.get('autostart');
          if (namesParam) {
            const list = String(namesParam).split(',').map(s => s.trim()).filter(Boolean).slice(0, 10);
            if (list.length >= 2) {
              els.names.value = list.join('\n');
              resetRun(list);
              if (String(autostart).toLowerCase() === 'true') {
                setTimeout(() => startDrop(list), 120);
              }
            }
          }
        }

        function init() {
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
    title: 'Marble Roulette',
    description: 'A physics-based marble race lucky draw. Marbles drop through pegs and the first to reach a collection slot wins.',
    path: '/marble-roulette',
    content,
    scripts
  }));
}

export async function handleMarbleRouletteRoutes(request, url) {
  if (url.pathname === '/marble-roulette' || url.pathname === '/marble-roulette/') {
    if (request.method === 'GET') return renderMarbleRoulettePage();
  }
  return null;
}
