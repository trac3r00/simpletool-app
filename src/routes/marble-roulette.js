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
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Canvas / Board -->
          <section class="lg:col-span-7" aria-label="Marble board">
            <div class="bg-surface-50 dark:bg-surface-950/40 border border-surface-200 dark:border-surface-800 rounded-xl p-4">
              <div class="flex items-center justify-between gap-3 mb-3">
                <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-50" data-i18n="tools.marble-roulette.ui.heading0">Board</h2>
                <div class="text-xs text-surface-600 dark:text-surface-400" aria-live="polite" id="mr-status" data-i18n="tools.marble-roulette.ui.status0">Ready.</div>
              </div>

              <div id="mr-canvas-wrap" class="relative w-full overflow-hidden rounded-lg border border-surface-200 dark:border-surface-800 bg-white/60 dark:bg-surface-950/60" style="aspect-ratio: 3 / 2.5;">
                <canvas id="mr-canvas" class="absolute inset-0 w-full h-full" aria-label="Marble simulation canvas" role="img"></canvas>
                <div class="pointer-events-none absolute inset-x-0 top-0 p-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="inline-flex items-center gap-2 text-xs text-surface-700 dark:text-surface-300 bg-white/80 dark:bg-surface-950/70 border border-surface-200/60 dark:border-surface-800/60 rounded-full px-3 py-1">
                      <span class="font-semibold" data-i18n="tools.marble-roulette.ui.stat0">Drops</span>
                      <span class="tabular-nums" id="mr-drops">0</span>
                      <span class="text-surface-400">•</span>
                      <span data-i18n="tools.marble-roulette.ui.stat1">Speed</span>
                      <span class="tabular-nums" id="mr-speed">1x</span>
                      <span class="text-surface-400">•</span>
                      <span data-i18n="tools.marble-roulette.ui.stat2">Mode</span>
                      <span id="mr-mode" class="tabular-nums" data-i18n="tools.marble-roulette.ui.text0">First to bottom</span>
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
                  <div class="mt-1 text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.desc0">Each drop randomizes start positions and tiny velocity nudges using Web Crypto.</div>
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

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                    <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.heading6">Rules</div>
                    <div class="mt-2 text-sm text-surface-800 dark:text-surface-200" data-i18n="tools.marble-roulette.ui.desc5">
                      All marbles race to one goal. The finish order becomes the ranking.
                    </div>
                    <div class="mt-2 text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.desc6">
                      Random skills can trigger mid-run (springs, boosts, teleports).
                    </div>
                  </div>

                  <div class="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                    <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.label2">Speed</div>
                    <div class="mt-2 flex flex-wrap gap-2" aria-label="Speed controls">
                      <button type="button" class="btn btn-secondary" id="mr-speed-1" aria-pressed="true"><span data-i18n="tools.marble-roulette.ui.button0">1x</span></button>
                      <button type="button" class="btn btn-secondary" id="mr-speed-2" aria-pressed="false"><span data-i18n="tools.marble-roulette.ui.button1">2x</span></button>
                      <button type="button" class="btn btn-secondary" id="mr-speed-3" aria-pressed="false"><span data-i18n="tools.marble-roulette.ui.button2">3x</span></button>
                    </div>
                    <p class="mt-2 text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.desc2">Higher speed runs the simulation faster — not the randomization.</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                    <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.label4">Map</div>
                    <div class="mt-2">
                      <select id="mr-map" class="input w-full" aria-label="Map" data-i18n-aria="tools.marble-roulette.ui.label4">
                        <option value="classic" selected data-i18n="tools.marble-roulette.ui.option5">Classic</option>
                        <option value="tower" data-i18n="tools.marble-roulette.ui.option6">Tower</option>
                        <option value="springs" data-i18n="tools.marble-roulette.ui.option7">Springs</option>
                      </select>
                    </div>
                    <p class="mt-2 text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.desc7">Maps change obstacle layout.</p>
                  </div>

                  <div class="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                    <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.heading7">Using skills</div>
                    <div class="mt-2 flex items-center justify-between gap-3">
                      <div class="text-sm text-surface-800 dark:text-surface-200" data-i18n="tools.marble-roulette.ui.label5">Random skill gates</div>
                      <label class="inline-flex items-center gap-2">
                        <input id="mr-skills" type="checkbox" class="rounded border-surface-300 text-primary-600 focus:ring-primary-500" checked>
                        <span class="text-sm text-surface-700 dark:text-surface-200" data-i18n="tools.marble-roulette.ui.label6">On</span>
                      </label>
                    </div>
                    <p class="mt-2 text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.desc8">Springs/boost/teleport/slow can trigger mid-run.</p>
                  </div>
                </div>

                <div class="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                  <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.label3">Board size</div>
                  <div class="mt-2 flex flex-col gap-2">
                    <select id="mr-board-size" class="input w-full" aria-label="Board size" data-i18n-aria="tools.marble-roulette.ui.label3">
                      <option value="compact" data-i18n="tools.marble-roulette.ui.option2">Compact</option>
                      <option value="standard" selected data-i18n="tools.marble-roulette.ui.option3">Standard</option>
                      <option value="large" data-i18n="tools.marble-roulette.ui.option4">Large</option>
                    </select>
                    <p class="text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.marble-roulette.ui.desc4">Large boards have more pegs and take longer.</p>
                  </div>
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
                    <div class="mt-1 text-lg font-bold text-surface-900 dark:text-surface-50" id="mr-result-title">🏁 Ranking</div>
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
                  <div class="mt-3 text-sm text-surface-800 dark:text-surface-200" id="mr-stats-empty" data-i18n="tools.marble-roulette.ui.text4">No drops yet — press Start.</div>
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
           mode: document.getElementById('mr-mode'),
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
          boardSize: document.getElementById('mr-board-size'),
          map: document.getElementById('mr-map'),
          skills: document.getElementById('mr-skills'),
          clearStats: document.getElementById('mr-clear-stats'),
           statsEmpty: document.getElementById('mr-stats-empty'),
           stats: document.getElementById('mr-stats'),
           statsSub: document.getElementById('mr-stats-sub'),
           statsGrid: document.getElementById('mr-stats-grid')
         };

         // Status color mapping
         const statusColorMap = {
           'error': 'text-error-700 dark:text-error-300',
           'success': 'text-success-700 dark:text-success-300',
           'neutral': 'text-surface-600 dark:text-surface-400'
         };

        const GameUtils = window.GameUtils;
        const { randU32, randFloat01, randRange, shuffleInPlace, clamp, escapeHtml, ensureAudioCtx: _ensureAudioCtx, playBeep: _playBeep } = GameUtils;
        function renderModeText() {
          els.mode.textContent = _t('tools.marble-roulette.js.text10', 'Finish order');
        }

        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const mrAudio = { ctx: null };
        let lastPegSound = 0;
        let lastWallSound = 0;

        function ensureAudioCtx() { return _ensureAudioCtx(mrAudio); }
        function mrPlayBeep(freq, durMs, gain) { _playBeep(mrAudio, freq, durMs, gain); }

        function playPegTick() {
          mrPlayBeep(1400 + Math.floor(randFloat01() * 400), 15, 0.04);
        }

        function playWallThud() {
          const c = ensureAudioCtx();
          if (!c) return;
          try {
            const t0 = c.currentTime;
            const o = c.createOscillator();
            const g = c.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(100, t0);
            o.frequency.exponentialRampToValueAtTime(30, t0 + 0.08);
            g.gain.setValueAtTime(0.12, t0);
            g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
            o.connect(g);
            g.connect(c.destination);
            o.start(t0);
            o.stop(t0 + 0.12);
          } catch (e) {}
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

        function playImpact() {
          const c = ensureAudioCtx();
          if (!c) return;
          try {
            const t0 = c.currentTime;
            const o = c.createOscillator();
            const g = c.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(140, t0);
            o.frequency.exponentialRampToValueAtTime(35, t0 + 0.15);
            g.gain.setValueAtTime(0.28, t0);
            g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
            o.connect(g);
            g.connect(c.destination);
            o.start(t0);
            o.stop(t0 + 0.25);
          } catch (e) {}
        }

        function mrScreenShake() {
          if (prefersReducedMotion) return;
          const el = els.canvasWrap;
          el.style.transition = 'none';
          const start = performance.now();
          const dur = 500;
          function frame(now) {
            const t = (now - start) / dur;
            if (t >= 1) { el.style.transform = ''; return; }
            const decay = 1 - t;
            const x = (Math.random() - 0.5) * 10 * decay;
            const y = (Math.random() - 0.5) * 10 * decay;
            el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
            requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
        }

        function mrShowCountdown(container, cb) {
          if (prefersReducedMotion) { cb(); return; }
          const nums = [3, 2, 1];
          let idx = 0;
          function next() {
            const old = container.querySelector('.mr-countdown');
            if (old) old.remove();
            if (idx >= nums.length) { cb(); return; }
            const overlay = document.createElement('div');
            overlay.className = 'mr-countdown';
            overlay.style.cssText = 'position:absolute;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);pointer-events:none;';
            const numEl = document.createElement('div');
            numEl.style.cssText = 'font-size:6rem;font-weight:900;color:white;text-shadow:0 0 30px rgba(255,255,255,0.4);animation:mrCountPop 700ms cubic-bezier(0.2,0.9,0.2,1) both;';
            numEl.textContent = String(nums[idx]);
            overlay.appendChild(numEl);
            container.appendChild(overlay);
            mrPlayBeep(440 + nums[idx] * 200, 100, 0.12);
            idx++;
            setTimeout(next, 700);
          }
          next();
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
          boardSize: 'standard',
          mapId: 'classic',
          useSkills: true,
          dims: { w: 0, h: 0, dpr: 1 },
          world: { w: 0, h: 0, camY: 0 },
          board: null,
          pegs: [],
          bumpers: [],
          springs: [],
          teleporters: [],
          skillGates: [],
          marbles: [],
          drops: 0,
          rank: [],
          winCounts: new Map(),
          keepNames: [],
          events: []
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

          // Rebuild board geometry for new size
          rebuildBoard();
          drawFrame(0);
        }

        function rebuildBoard() {
          const w = state.dims.w;
          const size = state.boardSize;
          const isLarge = size === 'large';
          const isCompact = size === 'compact';
          const sidePad = Math.max(18, Math.min(36, w * 0.05));
          const topPad = 22;

          const baseWorldH = isCompact ? 1900 : (isLarge ? 3800 : 2700);
          const worldH = state.mapId === 'tower'
            ? Math.round(baseWorldH * 1.25)
            : (state.mapId === 'springs' ? Math.round(baseWorldH * 1.10) : baseWorldH);
          state.world.w = w;
          state.world.h = worldH;

          const holeR = isLarge ? 24 : 22;
          const holeX = w * 0.5;
          const holeY = worldH - 70;
          const funnelTopY = worldH - (isLarge ? 520 : 420);

          state.board = {
            sidePad,
            topPad,
            worldH,
            pegR: isCompact ? 5.8 : (isLarge ? 5.2 : 5.5),
            bumperR: isLarge ? 22 : 20,
            springR: isLarge ? 18 : 16,
            marbleR: isLarge ? 9.5 : 10,
            gravity: isLarge ? 960 : 990,
            restitution: 0.62,
            bumperRestitution: 0.88,
            wallRestitution: 0.60,
            linearDamping: 0.08,
            maxSubSteps: isLarge ? 10 : 7,
            maxSimSeconds: isCompact ? 26 : (isLarge ? 70 : 45),
            hole: { x: holeX, y: holeY, r: holeR },
            funnel: { topY: funnelTopY }
          };

          // During a running race, keep existing peg/obstacle layouts stable.
          if (!state.running) {
            rebuildPegs();
            rebuildObstacles();
            rebuildSkillGates();
          }
          renderModeText();
        }

        function rebuildSkillGates() {
          const b = state.board;
          if (!b) return;
          if (!state.useSkills) {
            state.skillGates = [];
            return;
          }
          const w = state.world.w;
          const isLarge = state.boardSize === 'large';
          const isCompact = state.boardSize === 'compact';
          const n = isCompact ? 5 : (isLarge ? 10 : 7);
          const topY = b.topPad + 260;
          const bottomY = b.funnel.topY - 340;
          const span = Math.max(10, bottomY - topY);
          const gates = [];
          for (let i = 0; i < n; i++) {
            const t = (i + 1) / (n + 1);
            gates.push({
              y: topY + span * t,
              x0: b.sidePad + 8,
              x1: w - b.sidePad - 8
            });
          }
          state.skillGates = gates;
        }

        function rebuildObstacles() {
          const b = state.board;
          const w = state.world.w;
          const worldH = state.world.h;
          if (!b || !w || !worldH) return;
          const isLarge = state.boardSize === 'large';

          const bumpers = [];
          const springs = [];
          const teleports = [];

          if (state.mapId === 'springs') {
            // More springs, fewer bumpers.
            const springCount = isLarge ? 14 : 10;
            for (let i = 0; i < springCount; i++) {
              const y = b.topPad + 420 + i * (worldH - b.topPad - 980) / Math.max(1, springCount - 1);
              const leftX = b.sidePad + 30 + randRange(0, 24);
              const rightX = w - b.sidePad - 30 - randRange(0, 24);
              const r = b.springR;
              springs.push({ x: leftX, y, r, cooldown: 0 });
              springs.push({ x: rightX, y, r, cooldown: 0 });
            }

            const bumperCount = isLarge ? 6 : 4;
            for (let i = 0; i < bumperCount; i++) {
              const y = b.topPad + 520 + (i + 1) * (worldH - b.topPad - 1200) / (bumperCount + 1);
              const x = b.sidePad + 120 + randRange(0, Math.max(0, (w - b.sidePad * 2) * 0.22));
              const r = b.bumperR + randRange(-2, 4);
              bumpers.push({ x, y, r });
              bumpers.push({ x: w - x, y, r });
            }
          } else if (state.mapId === 'tower') {
            // A tall center tower of bumpers.
            const bumperCount = isLarge ? 14 : 10;
            const midX = w * 0.5;
            for (let i = 0; i < bumperCount; i++) {
              const y = b.topPad + 420 + i * (worldH - b.topPad - 980) / Math.max(1, bumperCount - 1);
              const wobble = (i % 2 === 0 ? -1 : 1) * (40 + randRange(0, 30));
              bumpers.push({ x: midX + wobble, y, r: b.bumperR });
            }

            const springCount = isLarge ? 6 : 4;
            for (let i = 0; i < springCount; i++) {
              const y = b.topPad + worldH * (0.22 + 0.14 * i);
              const x = (i % 2 === 0) ? (b.sidePad + 34) : (w - b.sidePad - 34);
              springs.push({ x, y, r: b.springR, cooldown: 0 });
            }
          } else {
            // Classic: balanced.
            const bumperCount = isLarge ? 10 : 6;
            for (let i = 0; i < bumperCount; i++) {
              const y = b.topPad + 420 + (i + 1) * (worldH - b.topPad - 980) / (bumperCount + 1);
              const x = b.sidePad + 90 + randRange(0, Math.max(0, (w - b.sidePad * 2) * 0.32));
              const r = b.bumperR + randRange(-2, 4);
              bumpers.push({ x, y, r });
              bumpers.push({ x: w - x, y, r });
            }

            const springCount = isLarge ? 10 : 7;
            for (let i = 0; i < springCount; i++) {
              const y = b.topPad + 520 + i * (worldH - b.topPad - 1200) / Math.max(1, springCount - 1);
              const leftX = b.sidePad + 30 + randRange(0, 24);
              const rightX = w - b.sidePad - 30 - randRange(0, 24);
              const r = b.springR;
              springs.push({ x: leftX, y, r, cooldown: 0 });
              springs.push({ x: rightX, y, r, cooldown: 0 });
            }
          }

          // Teleporter pair (one pair only)
          if (state.mapId !== 'springs') {
            const tpA = { x: b.sidePad + 110, y: b.topPad + worldH * 0.46, r: 18 };
            const tpB = { x: w - b.sidePad - 110, y: b.topPad + worldH * 0.62, r: 18 };
            teleports.push({ a: tpA, b: tpB });
          }

          state.bumpers = bumpers;
          state.springs = springs;
          state.teleporters = teleports;
        }

        function rebuildPegs() {
          const w = state.dims.w;
          const b = state.board;

          const size = state.boardSize;
          const isLarge = size === 'large';
          const isCompact = size === 'compact';

          const usableW = w - b.sidePad * 2;
          const targetCols = isLarge ? 12 : (isCompact ? 9 : 10);
          const spacingX = clamp(usableW / targetCols, 34, 56);
          const rows = isCompact ? 22 : (isLarge ? 44 : 32);
          const topY = b.topPad + 140;
          const bottomY = b.funnel.topY - 170;
          const spacingY = clamp((bottomY - topY) / Math.max(1, rows), isLarge ? 46 : 44, isLarge ? 64 : 58);

          const maxCols = Math.floor(usableW / spacingX);
          const baseCols = clamp(maxCols, isCompact ? 8 : 9, isLarge ? 13 : 11);
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

        function newMarbles(names) {
          const n = names.length;
          const w = state.world.w;
          const b = state.board;

          // Candidate start x positions distributed across board; shuffled per run for fairness.
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
              glow: 0,
              gateMask: 0,
              slowUntil: 0,
              tpCooldownUntil: 0,
              springCooldownUntil: 0,
              lastY: y
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
          els.winnerInline.textContent = _t('tools.marble-roulette.js.text2', '—');
          els.resultWrap.classList.add('hidden');
          els.resultTitle.textContent = _t('tools.marble-roulette.js.text11', '🏁 Ranking');
          if (els.ranking) els.ranking.innerHTML = '';
          setStatus(_t('tools.marble-roulette.js.text4', 'Ready.'), 'neutral');
          if (Array.isArray(keepNames)) state.keepNames = keepNames;
          state.marbles = [];
          state.rank = [];
          state.events = [];
          state.world.camY = 0;
          renderModeText();
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

        function readBoardSize() {
          if (!els.boardSize) return;
          const v = String(els.boardSize.value || '').toLowerCase();
          state.boardSize = (v === 'compact' || v === 'large') ? v : 'standard';
        }

        function readMapAndSkills() {
          if (els.map) {
            const v = String(els.map.value || '').toLowerCase();
            state.mapId = (v === 'tower' || v === 'springs') ? v : 'classic';
          }
          if (els.skills) {
            state.useSkills = !!els.skills.checked;
          }
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

          mrShowCountdown(els.canvasWrap, function() {
            const cd = els.canvasWrap.querySelector('.mr-countdown');
            if (cd) cd.remove();

            state.keepNames = list.slice();
            state.marbles = newMarbles(list);
            state.rank = [];
            state.events = [];
            state.simTime = 0;
            state.acc = 0;
            state.lastTs = 0;
            state.world.camY = 0;
            state.running = true;
            state.drops += 1;
            els.drops.textContent = String(state.drops);
            setStatus(_t('tools.marble-roulette.js.text5', 'Dropping...'), 'neutral');
            els.resultWrap.classList.add('hidden');
            els.winnerInline.textContent = _t('tools.marble-roulette.js.text2', '—');
            if (els.ranking) els.ranking.innerHTML = '';
            els.start.disabled = false;
            drawFrame(0);
            state.rafId = requestAnimationFrame(tick);
          });
        }

        function renderRanking() {
          if (!els.ranking) return;
          if (!state.rank.length) {
            els.ranking.innerHTML = '<div class="p-3 text-sm text-surface-600 dark:text-surface-400">No finishes yet.</div>';
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

          // If timeout, rank remaining by progress (larger y = closer to finish).
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
          }

          if (!prefersReducedMotion && winner && state.board) {
            playImpact();
            mrScreenShake();
            mrConfettiBurst(state.board.hole.x, state.board.hole.y - state.world.camY);
            playCelebration();
          }

          const msg = reason ? String(reason) : _t('tools.marble-roulette.js.text12', 'Race finished.');
          setStatus(msg, 'success');
        }

        function randInt(maxExclusive) {
          const m = (maxExclusive >>> 0);
          if (!m) return 0;
          const limit = Math.floor(0x100000000 / m) * m;
          while (true) {
            const x = randU32() >>> 0;
            if (x < limit) return x % m;
          }
        }

        function applyRandomSkill(m) {
          const b = state.board;
          if (!b) return;
          const w = state.world.w;
          const now = state.simTime;

          const skill = randInt(4);
          if (skill === 0) {
            // Spring up
            m.vy = -Math.abs(m.vy) - (820 + randRange(0, 260));
            m.vx += randRange(-120, 120);
            if (!prefersReducedMotion) mrPlayBeep(980, 40, 0.10);
            return;
          }
          if (skill === 1) {
            // Boost
            m.vx += randRange(-260, 260);
            m.vy += randRange(-220, -80);
            if (!prefersReducedMotion) mrPlayBeep(1400, 22, 0.06);
            return;
          }
          if (skill === 2) {
            // Teleport (with cooldown)
            if (now < m.tpCooldownUntil) return;
            const nx = randRange(b.sidePad + m.r + 6, w - b.sidePad - m.r - 6);
            const ny = Math.max(b.topPad + 40, m.y - (220 + randRange(0, 160)));
            m.x = nx;
            m.y = ny;
            m.tpCooldownUntil = now + 1.6;
            m.vx *= 0.6;
            m.vy = Math.min(m.vy, 120);
            if (!prefersReducedMotion) mrPlayBeep(760, 26, 0.08);
            return;
          }
          // Slow
          m.slowUntil = Math.max(m.slowUntil, now + 1.6);
          m.vx *= 0.78;
          m.vy *= 0.78;
          if (!prefersReducedMotion) mrPlayBeep(520, 50, 0.07);
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

        /** Physics and collisions */
        function step(dt) {
          const b = state.board;
          const w = state.world.w;
          const worldH = state.world.h;
          if (!b || !w || !worldH) return;

          const maxV = 2400;

          // Integrate
          for (let i = 0; i < state.marbles.length; i++) {
            const m = state.marbles[i];
            if (m.finished) {
              m.glow = Math.max(0, m.glow - dt * 1.8);
              continue;
            }

            m.lastY = m.y;
            m.vy += b.gravity * dt;
            const slow = (state.simTime < m.slowUntil) ? 1.9 : 1.0;
            const damp = Math.max(0, 1 - (b.linearDamping * slow) * dt);
            m.vx *= damp;
            m.vy *= damp;
            m.x += m.vx * dt;
            m.y += m.vy * dt;

            m.vx = GameUtils.clamp(m.vx, -maxV, maxV);
            m.vy = GameUtils.clamp(m.vy, -maxV, maxV);
          }

          // Gate-triggered random skills
          for (let i = 0; i < state.marbles.length; i++) {
            const m = state.marbles[i];
            if (m.finished) continue;
            for (let g = 0; g < state.skillGates.length && g < 30; g++) {
              const gate = state.skillGates[g];
              const mask = 1 << g;
              if ((m.gateMask & mask) !== 0) continue;
              if (m.lastY < gate.y && m.y >= gate.y) {
                m.gateMask |= mask;
                applyRandomSkill(m);
              }
            }
          }

          // Marble-peg collisions
          for (let i = 0; i < state.marbles.length; i++) {
            const m = state.marbles[i];
            if (m.finished) continue;
            for (let p = 0; p < state.pegs.length; p++) {
              const g = state.pegs[p];
              const hit = collideCircle(m, g, b.restitution);
              if (hit && !prefersReducedMotion) {
                const nowMs = performance.now();
                if (nowMs - lastPegSound > 40) { playPegTick(); lastPegSound = nowMs; }
              }
            }
          }

          // Marble-to-marble collisions (equal mass)
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

          // Bumper collisions
          for (let i = 0; i < state.marbles.length; i++) {
            const m = state.marbles[i];
            if (m.finished) continue;
            for (let p = 0; p < state.bumpers.length; p++) {
              const bb = state.bumpers[p];
              collideCircle(m, bb, b.bumperRestitution);
            }
          }

          // Springs
          for (let i = 0; i < state.marbles.length; i++) {
            const m = state.marbles[i];
            if (m.finished) continue;
            for (let s = 0; s < state.springs.length; s++) {
              const sp = state.springs[s];
              const hit = collideCircle(m, sp, 0.75);
              if (hit && state.simTime >= m.springCooldownUntil) {
                m.springCooldownUntil = state.simTime + 0.35;
                m.vy = -Math.abs(m.vy) - 980;
                m.vx += randRange(-80, 80);
                if (!prefersReducedMotion) mrPlayBeep(1120, 22, 0.06);
              }
            }
          }

          // Teleporters
          for (let i = 0; i < state.marbles.length; i++) {
            const m = state.marbles[i];
            if (m.finished) continue;
            for (let tpi = 0; tpi < state.teleporters.length; tpi++) {
              const pair = state.teleporters[tpi];
              if (state.simTime < m.tpCooldownUntil) continue;
              const inA = ((m.x - pair.a.x) ** 2 + (m.y - pair.a.y) ** 2) < (pair.a.r ** 2);
              const inB = ((m.x - pair.b.x) ** 2 + (m.y - pair.b.y) ** 2) < (pair.b.r ** 2);
              if (inA) {
                m.x = pair.b.x;
                m.y = pair.b.y - 160;
                m.tpCooldownUntil = state.simTime + 1.8;
                m.vx *= 0.4;
                m.vy = Math.min(m.vy, 120);
                if (!prefersReducedMotion) mrPlayBeep(720, 18, 0.08);
              } else if (inB) {
                m.x = pair.a.x;
                m.y = pair.a.y - 160;
                m.tpCooldownUntil = state.simTime + 1.8;
                m.vx *= 0.4;
                m.vy = Math.min(m.vy, 120);
                if (!prefersReducedMotion) mrPlayBeep(720, 18, 0.08);
              }
            }
          }

          // World walls
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

            // Funnel walls near finish
            if (m.y > b.funnel.topY - 40) {
              const hx = b.hole.x;
              const hy = b.hole.y;
              const hr = b.hole.r;
              const topY = b.funnel.topY;
              const leftAx = b.sidePad;
              const leftAy = topY;
              const leftBx = hx - hr;
              const leftBy = hy;
              const rightAx = w - b.sidePad;
              const rightAy = topY;
              const rightBx = hx + hr;
              const rightBy = hy;
              collideSegment(m, leftAx, leftAy, leftBx, leftBy, 0.55);
              collideSegment(m, rightAx, rightAy, rightBx, rightBy, 0.55);
            }
          }

          // Finish hole
          for (let i = 0; i < state.marbles.length; i++) {
            const m = state.marbles[i];
            if (m.finished) continue;
            const dx = m.x - b.hole.x;
            const dy = m.y - b.hole.y;
            const rr = (b.hole.r * 0.78);
            if ((dx * dx + dy * dy) <= rr * rr && m.y > b.hole.y - b.hole.r) {
              m.finished = true;
              m.finishedAt = state.simTime;
              m.rank = state.rank.length + 1;
              m.glow = 1;
              state.rank.push(m);
              if (!prefersReducedMotion) playArrivalDing();
              renderRanking();
              if (state.rank.length === state.marbles.length) {
                finalizeRun(_t('tools.marble-roulette.js.text12', 'Race finished.'));
                return;
              }
            }
          }

          if (state.simTime > b.maxSimSeconds) {
            finalizeRun(_t('tools.marble-roulette.js.text13', 'Time up — ranking by progress.'));
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

          // Speed multiplier affects sim time step accumulation
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
              // Safety cap: avoid spiraling if a frame lags.
              state.acc = 0;
              break;
            }
          }

          drawFrame(ts);
          if (state.running) state.rafId = requestAnimationFrame(tick);
        }

        /** Rendering */
        function drawFrame(ts) {
          const w = state.dims.w;
          const h = state.dims.h;
          const b = state.board;
          if (!b || !w || !h) return;
          const dark = getIsDark();

          // Background
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

          // Camera follows the leading marble.
          let leadY = 0;
          for (let i = 0; i < state.marbles.length; i++) {
            const m = state.marbles[i];
            if (m && !m.finished) leadY = Math.max(leadY, m.y);
          }
          if (!leadY && b.hole) leadY = b.hole.y;
          const targetCam = clamp(leadY - h * 0.36, 0, Math.max(0, b.worldH - h));
          const lerp = prefersReducedMotion ? 1 : 0.12;
          state.world.camY = state.world.camY + (targetCam - state.world.camY) * lerp;

          ctx.save();
          ctx.translate(0, -state.world.camY);

          // World walls
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

          // Skill gates
          ctx.save();
          ctx.setLineDash([6, 6]);
          ctx.lineWidth = 1;
          ctx.strokeStyle = dark ? 'rgba(99,102,241,0.22)' : 'rgba(99,102,241,0.18)';
          for (let g = 0; g < state.skillGates.length; g++) {
            const gate = state.skillGates[g];
            ctx.beginPath();
            ctx.moveTo(gate.x0, gate.y);
            ctx.lineTo(gate.x1, gate.y);
            ctx.stroke();
          }
          ctx.restore();

          // Pegs
          for (let i = 0; i < state.pegs.length; i++) {
            const p = state.pegs[i];
            const r = p.r;
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

          // Bumpers
          for (let i = 0; i < state.bumpers.length; i++) {
            const bb = state.bumpers[i];
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.strokeStyle = dark ? 'rgba(251,191,36,0.35)' : 'rgba(245,158,11,0.28)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(bb.x, bb.y, bb.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // Springs
          for (let i = 0; i < state.springs.length; i++) {
            const sp = state.springs[i];
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.strokeStyle = dark ? 'rgba(34,197,94,0.35)' : 'rgba(16,185,129,0.28)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // Teleporters
          for (let i = 0; i < state.teleporters.length; i++) {
            const pair = state.teleporters[i];
            ctx.save();
            ctx.globalAlpha = 0.55;
            ctx.strokeStyle = dark ? 'rgba(168,85,247,0.40)' : 'rgba(139,92,246,0.28)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pair.a.x, pair.a.y, pair.a.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(pair.b.x, pair.b.y, pair.b.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // Funnel + hole
          if (b.hole) {
            const hx = b.hole.x;
            const hy = b.hole.y;
            const hr = b.hole.r;
            const topY = b.funnel.topY;
            ctx.save();
            ctx.strokeStyle = dark ? 'rgba(226,232,240,0.22)' : 'rgba(51,65,85,0.18)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(b.sidePad, topY);
            ctx.lineTo(hx - hr, hy);
            ctx.moveTo(w - b.sidePad, topY);
            ctx.lineTo(hx + hr, hy);
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.fillStyle = dark ? 'rgba(0,0,0,0.55)' : 'rgba(15,23,42,0.35)';
            ctx.beginPath();
            ctx.arc(hx, hy, hr, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Marbles
          for (let i = 0; i < state.marbles.length; i++) {
            const m = state.marbles[i];
            const r = m.r;
            const t = (ts || 0) / 1000;

            if (m.glow > 0) {
              ctx.save();
              ctx.globalAlpha = 0.22 * m.glow;
              ctx.strokeStyle = m.color;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(m.x, m.y, r + 8 + (Math.sin(t * 7) * 2), 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }

            const grad = ctx.createRadialGradient(m.x - r * 0.35, m.y - r * 0.45, 1, m.x, m.y, r * 1.8);
            grad.addColorStop(0, 'rgba(255,255,255,0.95)');
            grad.addColorStop(0.25, m.color);
            grad.addColorStop(1, dark ? 'rgba(2,6,23,0.75)' : 'rgba(15,23,42,0.35)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
            ctx.fill();

            if (state.marbles.length <= 10) {
              ctx.save();
              ctx.font = '11px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillStyle = dark ? 'rgba(226,232,240,0.85)' : 'rgba(15,23,42,0.70)';
              ctx.fillText(m.name, m.x, m.y - r - 4);
              ctx.restore();
            }
          }

          mrDrawConfetti(ctx, w, h);
          ctx.restore();
        }

        /** UI wiring */
        const ro = new ResizeObserver(() => resizeCanvas());
        ro.observe(els.canvasWrap);
        window.addEventListener('resize', () => resizeCanvas(), { passive: true });

        els.speed1.addEventListener('click', () => setSpeed(1));
        els.speed2.addEventListener('click', () => setSpeed(2));
        els.speed3.addEventListener('click', () => setSpeed(3));

        if (els.boardSize) {
          els.boardSize.addEventListener('change', () => {
            readBoardSize();
            readMapAndSkills();
            resetRun(state.keepNames);
            resizeCanvas();
          });
        }

        if (els.map) {
          els.map.addEventListener('change', () => {
            readMapAndSkills();
            resetRun(state.keepNames);
            resizeCanvas();
          });
        }

        if (els.skills) {
          els.skills.addEventListener('change', () => {
            readMapAndSkills();
            resetRun(state.keepNames);
            resizeCanvas();
          });
        }

        els.start.addEventListener('click', () => {
          readBoardSize();
          readMapAndSkills();
          startDrop();
        });

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
          setStatus(_t('tools.marble-roulette.js.text9', 'Stats cleared.'), 'neutral');
          els.winnerInline.textContent = _t('tools.marble-roulette.js.text2', '—');
          els.resultWrap.classList.add('hidden');
          drawFrame(0);
        });

        // Keyboard shortcuts
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
        });

        // URL params: ?names=A,B,C&autostart=true
        function loadFromURL() {
          const params = new URLSearchParams(window.location.search);
          const namesParam = params.get('names');
          const autostart = params.get('autostart');
          if (namesParam) {
            // URLSearchParams.get() is already decoded; treat commas as separators.
            const list = String(namesParam).split(',').map(s => s.trim()).filter(Boolean).slice(0, 10);
            if (list.length >= 2) {
              els.names.value = list.join('\n');
              resetRun(list);
              if (String(autostart).toLowerCase() === 'true') {
                // Defer to allow initial layout
                setTimeout(() => startDrop(list), 120);
              }
            }
          }
        }

        const mrStyle = document.createElement('style');
        mrStyle.textContent = '@keyframes mrCountPop { 0% { transform: scale(2.5); opacity: 0; } 35% { transform: scale(0.9); opacity: 1; } 60% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 0.2; } }';
        document.head.appendChild(mrStyle);

        function init() {
          setSpeed(1);
          renderModeText();
          readMapAndSkills();
          resizeCanvas();
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
    description: 'A physics-based marble race lucky draw. All marbles race to one goal and the finish order becomes the ranking.',
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
