import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage, t } from '../utils/i18n.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';

export async function handleCaffeinateRoutes(request, url) {
  if (url.pathname === '/caffeinate' || url.pathname === '/caffeinate/') {
    if (request.method === 'GET') return respondHTML(renderCaffeinatePage(resolveRequestLanguage(request, url)));
  }
  return null;
}

function renderCaffeinatePage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('caffeinate', currentLang);
  const toolHeader = createToolHeader(
    { emoji: '☕' },
    translation?.name || 'Caffeinate',
    translation?.desc || 'Keep your device screen awake using the Wake Lock API. No downloads, fully client-side.',
    [{ text: translation?.ui?.badge0 || 'Client-Side Only', tooltip: 'Runs entirely in your browser using Web APIs — your data never leaves your device.' }],
    { toolId: 'caffeinate' }
  );

  const currentTool = TOOLS.find(t => t.id === 'caffeinate');
    const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];


  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}

        <!-- Status Panel -->
        <div id="status-panel" class="mt-6 p-5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-center transition-all duration-300">
          <div id="status-icon" class="text-5xl mb-3" aria-hidden="true">💤</div>
          <p id="status-text" class="text-surface-700 dark:text-surface-300 text-base" role="status" aria-live="polite" data-i18n="tools.caffeinate.ui.status0">
            ${t('tools.caffeinate.ui.status0')}
          </p>
        </div>

        <!-- Mode Indicator -->
        <div id="mode-badge" class="mt-4 flex justify-center">
          <span id="mode-label" class="hidden px-3 py-1 text-xs font-semibold rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400"></span>
        </div>

        <!-- Note -->
        <p class="mt-4 text-sm text-center text-surface-500 dark:text-surface-400" data-i18n="tools.caffeinate.ui.desc0">
          ${t('tools.caffeinate.ui.desc0')}
        </p>

        <!-- Action Buttons -->
        <div class="mt-6 flex flex-col items-center gap-3">
          <button id="toggle-btn" type="button" data-tooltip="Uses the Wake Lock API to prevent your screen from sleeping" class="btn btn-primary px-8 py-3 text-base font-semibold" data-i18n="tools.caffeinate.ui.button0">
            ${t('tools.caffeinate.ui.button0')}
          </button>
          <button id="pip-btn" type="button" class="hidden btn btn-secondary px-6 py-2 text-sm font-medium">
            📌 Pin to Screen (PiP)
          </button>
          <p id="pip-hint" class="hidden text-xs text-surface-400 dark:text-surface-500 text-center max-w-sm">
            Opens a small floating window so the wake lock stays active even when this tab is in the background.
          </p>
        </div>

        <!-- Stats -->
        <div id="stats-panel" class="hidden mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="text-center p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1" data-i18n="tools.caffeinate.ui.label0">${t('tools.caffeinate.ui.label0')}</div>
            <div id="stat-mode" class="text-sm font-semibold text-surface-900 dark:text-surface-100">—</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1" data-i18n="tools.caffeinate.ui.label1">${t('tools.caffeinate.ui.label1')}</div>
            <div id="stat-uptime" class="text-sm font-semibold text-surface-900 dark:text-surface-100">—</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1" data-i18n="tools.caffeinate.ui.label2">${t('tools.caffeinate.ui.label2')}</div>
            <div id="stat-heartbeats" class="text-sm font-semibold text-surface-900 dark:text-surface-100">0</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1" data-i18n="tools.caffeinate.ui.label3">${t('tools.caffeinate.ui.label3')}</div>
            <div id="stat-reactivations" class="text-sm font-semibold text-surface-900 dark:text-surface-100">0</div>
          </div>
        </div>
      </div>
    ${createRelatedToolsSection(relatedToolsData)}
    </main>

    <script>
    (function() {
      'use strict';

      var HEARTBEAT_INTERVAL = 30000;
      var MAX_REACTIVATION_ATTEMPTS = 3;
      var REACTIVATION_DELAY = 2000;
      var SLEEP_THRESHOLD = 120000;

      var state = {
        wakeLock: null,
        fallbackVideo: null,
        active: false,
        intentActive: false,
        mode: 'none',
        heartbeatTimer: null,
        uptimeTimer: null,
        lastActivity: 0,
        startedAt: 0,
        reactivationAttempts: 0,
        heartbeatCount: 0,
        reactivationCount: 0,
        supportsWakeLock: 'wakeLock' in navigator,
        pipCanvas: null,
        pipVideo: null,
        pipWindow: null,
        pipAnimFrame: null,
        silentAudioCtx: null,
        silentOscillator: null
      };

      var statusPanel = document.getElementById('status-panel');
      var statusIcon = document.getElementById('status-icon');
      var statusText = document.getElementById('status-text');
      var toggleBtn = document.getElementById('toggle-btn');
      var modeLabel = document.getElementById('mode-label');
      var statsPanel = document.getElementById('stats-panel');

      function updateUI(icon, message, isActive, panelState) {
        statusIcon.textContent = icon;
        statusText.textContent = message;
        var btnText = isActive ? (window._t ? window._t('tools.caffeinate.ui.button1') : 'Deactivate Wake Lock') : (window._t ? window._t('tools.caffeinate.ui.button0') : 'Activate Wake Lock');
        toggleBtn.textContent = btnText;
        toggleBtn.setAttribute('data-i18n', isActive ? 'tools.caffeinate.ui.button1' : 'tools.caffeinate.ui.button0');

         statusPanel.classList.remove('border-primary-400', 'dark:border-primary-600', 'border-warning-400', 'dark:border-warning-600', 'border-error-400', 'dark:border-error-600');
         if (panelState === 'active') {
           statusPanel.classList.add('border-primary-400', 'dark:border-primary-600');
         } else if (panelState === 'warn') {
           statusPanel.classList.add('border-warning-400', 'dark:border-warning-600');
         } else if (panelState === 'error') {
           statusPanel.classList.add('border-error-400', 'dark:border-error-600');
         }
      }

      function showMode(mode) {
        if (!mode || mode === 'none') {
          modeLabel.classList.add('hidden');
          return;
        }
        var labels = {
          native: window._t ? window._t('tools.caffeinate.js.mode0') : 'Wake Lock API',
          'native+pip': 'Wake Lock + PiP',
          'native+background': 'Wake Lock + Background Safe',
          fallback: 'Background Safe Mode',
          'fallback+pip': 'Video Fallback + PiP',
          pip: 'Picture-in-Picture',
          basic: window._t ? window._t('tools.caffeinate.js.mode2') : 'Basic Fallback'
        };
        modeLabel.textContent = labels[mode] || mode;
        modeLabel.classList.remove('hidden');
      }

      function updateStats() {
        document.getElementById('stat-mode').textContent = state.mode === 'none' ? '—' : state.mode;
        document.getElementById('stat-heartbeats').textContent = state.heartbeatCount;
        document.getElementById('stat-reactivations').textContent = state.reactivationCount;
      }

      function updateUptime() {
        if (!state.startedAt) {
          document.getElementById('stat-uptime').textContent = '—';
          return;
        }
        var secs = Math.floor((Date.now() - state.startedAt) / 1000);
        var h = Math.floor(secs / 3600);
        var m = Math.floor((secs % 3600) / 60);
        var s = secs % 60;
        document.getElementById('stat-uptime').textContent =
          (h > 0 ? h + 'h ' : '') + (m > 0 ? m + 'm ' : '') + s + 's';
      }

      function startUptimeTimer() {
        if (state.uptimeTimer) clearInterval(state.uptimeTimer);
        state.startedAt = Date.now();
        updateUptime();
        state.uptimeTimer = setInterval(updateUptime, 1000);
      }

      function stopUptimeTimer() {
        if (state.uptimeTimer) {
          clearInterval(state.uptimeTimer);
          state.uptimeTimer = null;
        }
        state.startedAt = 0;
        document.getElementById('stat-uptime').textContent = '—';
      }

      function startHeartbeat() {
        if (state.heartbeatTimer) clearInterval(state.heartbeatTimer);
        state.heartbeatTimer = setInterval(function() {
          if (!state.intentActive || !state.active) return;
          state.heartbeatCount++;
          updateStats();

          var elapsed = Date.now() - state.lastActivity;
          if (elapsed > SLEEP_THRESHOLD) {
            attemptReactivation('System may have slept');
            return;
          }
          state.lastActivity = Date.now();

          if (state.mode === 'native' && !state.wakeLock) {
            attemptReactivation('Native wake lock lost');
          } else if (state.mode === 'fallback' && state.fallbackVideo &&
                     (state.fallbackVideo.paused || state.fallbackVideo.ended)) {
            attemptReactivation('Fallback video stopped');
          }
        }, HEARTBEAT_INTERVAL);
      }

      function stopHeartbeat() {
        if (state.heartbeatTimer) {
          clearInterval(state.heartbeatTimer);
          state.heartbeatTimer = null;
        }
      }

      async function attemptReactivation(reason) {
        if (state.reactivationAttempts >= MAX_REACTIVATION_ATTEMPTS) {
          var msg = (window._t ? window._t('tools.caffeinate.js.status2') : 'Wake lock failed: {{reason}}. Please reactivate manually.').replace('{{reason}}', reason);
          updateUI('❌', msg, false, 'error');
          showMode('none');
          return false;
        }
        state.reactivationAttempts++;
        state.reactivationCount++;
        updateStats();

        var msg = (window._t ? window._t('tools.caffeinate.js.status3') : 'Reactivating ({{attempt}}/{{max}})...').replace('{{attempt}}', state.reactivationAttempts).replace('{{max}}', MAX_REACTIVATION_ATTEMPTS);
        updateUI('🔄', msg, false, 'warn');

        await new Promise(function(r) { setTimeout(r, REACTIVATION_DELAY); });
        if (document.visibilityState === 'visible') {
          var ok = await activateWakeLock();
          if (ok) { state.reactivationAttempts = 0; return true; }
        }
        return false;
      }

      async function activateNative() {
        try {
          if (!navigator.wakeLock || document.visibilityState !== 'visible') return false;
          var lock = await navigator.wakeLock.request('screen');
          state.wakeLock = lock;
          state.mode = 'native';
          state.active = true;
          state.lastActivity = Date.now();

          lock.addEventListener('release', handleRelease);
          updateUI('☕', window._t ? window._t('tools.caffeinate.js.status0') : 'Native wake lock active. Your screen will stay awake.', true, 'active');
          showMode('native');
          startHeartbeat();
          startUptimeTimer();
          return true;
        } catch (e) {
          state.wakeLock = null;
          return false;
        }
      }

      async function activateFallback() {
        try {
          // ── Strategy 1: Silent mp4 video loop (NoSleep.js proven technique) ──
          // This base64 mp4 contains an actual audio track — browsers treat it
          // as real media playback so the tab stays "active" even when backgrounded.
          // The video has an empty audio track and a single transparent frame.
          var SILENT_MP4 = 'data:video/mp4;base64,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';

          var video = document.createElement('video');
          video.setAttribute('playsinline', '');
          video.muted = false;  // must NOT be muted for background playback
          video.loop = true;
          video.volume = 0.001; // near-silent but not muted
          video.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:-1';
          video.setAttribute('aria-hidden', 'true');
          video.src = SILENT_MP4;

          document.body.appendChild(video);
          await video.play();

          state.fallbackVideo = video;

          // ── Strategy 2: Web Audio API silent oscillator (timer anti-throttle) ──
          try {
            var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            var oscillator = audioCtx.createOscillator();
            var gainNode = audioCtx.createGain();
            gainNode.gain.value = 0.001; // inaudible
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start();
            state.silentAudioCtx = audioCtx;
            state.silentOscillator = oscillator;
          } catch (audioErr) {
            // Web Audio not available — video alone is still valuable
          }

          // ── Strategy 3: Media Session API — register as "playing" with OS ──
          try {
            if ('mediaSession' in navigator) {
              navigator.mediaSession.metadata = new MediaMetadata({
                title: 'Caffeinate — Screen Awake',
                artist: 'SimpleTool',
                album: 'Wake Lock Active'
              });
              navigator.mediaSession.playbackState = 'playing';
            }
          } catch (msErr) {}

          state.mode = 'fallback';
          state.active = true;
          state.lastActivity = Date.now();
          updateUI('☕', 'Wake lock active (background-safe mode). Your screen will stay awake.', true, 'active');
          showMode('fallback');
          startHeartbeat();
          startUptimeTimer();
          return true;
        } catch (e) {
          cleanupFallback();
          return false;
        }
      }

      function cleanupFallback() {
        if (state.fallbackVideo) {
          try { state.fallbackVideo.pause(); state.fallbackVideo.remove(); } catch (e) {}
          state.fallbackVideo = null;
        }
        if (state.silentOscillator) {
          try { state.silentOscillator.stop(); } catch (e) {}
          state.silentOscillator = null;
        }
        if (state.silentAudioCtx) {
          try { state.silentAudioCtx.close(); } catch (e) {}
          state.silentAudioCtx = null;
        }
        try {
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'none';
          }
        } catch (e) {}
      }

      // ── Picture-in-Picture: keeps tab "visible" even when backgrounded ──

      var pipBtn = document.getElementById('pip-btn');
      var pipHint = document.getElementById('pip-hint');
      var supportsPiP = (typeof HTMLVideoElement !== 'undefined' && 'requestPictureInPicture' in HTMLVideoElement.prototype);

      function renderPipFrame() {
        if (!state.pipCanvas || !state.intentActive) return;
        var ctx = state.pipCanvas.getContext('2d');
        var w = state.pipCanvas.width;
        var h = state.pipCanvas.height;

        // dark background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        // coffee icon
        ctx.font = '48px serif';
        ctx.textAlign = 'center';
        ctx.fillText('☕', w / 2, 65);

        // uptime
        var secs = state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : 0;
        var hh = Math.floor(secs / 3600);
        var mm = Math.floor((secs % 3600) / 60);
        var ss = secs % 60;
        var timeStr = (hh > 0 ? hh + 'h ' : '') + (mm > 0 ? mm + 'm ' : '') + ss + 's';

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.fillText(timeStr, w / 2, 105);

        // status dot
        ctx.fillStyle = state.active ? '#22c55e' : '#ef4444';
        ctx.beginPath();
        ctx.arc(w / 2, 130, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText(state.active ? 'AWAKE' : 'INACTIVE', w / 2, 150);

        state.pipAnimFrame = requestAnimationFrame(renderPipFrame);
      }

      async function activatePiP() {
        if (!supportsPiP) return false;
        try {
          // Create canvas with timer animation
          var canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 160;
          state.pipCanvas = canvas;

          // Create video from canvas stream
          var video = document.createElement('video');
          video.muted = true;
          video.setAttribute('playsinline', '');
          video.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none';
          video.setAttribute('aria-hidden', 'true');
          video.srcObject = canvas.captureStream(30);
          document.body.appendChild(video);
          await video.play();
          state.pipVideo = video;

          // Start rendering frames
          renderPipFrame();

          // Enter PiP
          state.pipWindow = await video.requestPictureInPicture();

          state.pipWindow.addEventListener('leavepictureinpicture', function() {
            cleanupPiP();
            if (state.intentActive) {
              // Fell back — update mode label
              state.mode = state.wakeLock ? 'native' : (state.fallbackVideo ? 'fallback' : state.mode);
              showMode(state.mode);
              pipBtn.textContent = '📌 Pin to Screen (PiP)';
            }
          });

          // Update mode to show PiP is active
          if (state.mode === 'native') {
            state.mode = 'native+pip';
          } else if (state.mode === 'fallback') {
            state.mode = 'fallback+pip';
          } else {
            state.mode = 'pip';
          }
          showMode(state.mode);
          pipBtn.textContent = '📌 PiP Active — Click to Close';

          return true;
        } catch (e) {
          cleanupPiP();
          return false;
        }
      }

      function cleanupPiP() {
        if (state.pipAnimFrame) {
          cancelAnimationFrame(state.pipAnimFrame);
          state.pipAnimFrame = null;
        }
        if (document.pictureInPictureElement === state.pipVideo) {
          try { document.exitPictureInPicture(); } catch (e) {}
        }
        if (state.pipVideo) {
          try { state.pipVideo.pause(); state.pipVideo.remove(); } catch (e) {}
          state.pipVideo = null;
        }
        state.pipCanvas = null;
        state.pipWindow = null;
      }

      async function activateWakeLock() {
        // Always start the background-safe fallback (video + audio) first.
        // Even if native Wake Lock works, the fallback keeps the screen on
        // when the tab goes to the background and the native lock is released.
        var fbOk = await activateFallback();

        if (state.supportsWakeLock) {
          var nativeOk = await activateNative();
          if (nativeOk) {
            // Both native + fallback active = best coverage
            state.mode = 'native+background';
            showMode(state.mode);
            return true;
          }
        }

        // Native failed or unavailable — fallback alone
        if (fbOk) return true;

        updateUI('❌', window._t ? window._t('tools.caffeinate.js.status9') : 'Wake lock unavailable on this device. Check system power settings.', false, 'error');
        return false;
      }

      async function deactivateWakeLock(msg, manual) {
        if (manual) {
          state.intentActive = false;
          state.reactivationAttempts = 0;
        }
        stopHeartbeat();
        stopUptimeTimer();

        if (state.wakeLock) {
          try {
            state.wakeLock.removeEventListener('release', handleRelease);
            await state.wakeLock.release();
          } catch (e) {}
          state.wakeLock = null;
        }
        cleanupFallback();
        cleanupPiP();

        state.mode = 'none';
        state.active = false;
        updateUI('💤', msg || (window._t ? window._t('tools.caffeinate.js.status4') : 'Wake lock deactivated.'), false, '');
        showMode('none');
        updateStats();
      }

      function handleRelease() {
        state.wakeLock = null;
        state.active = false;
        state.mode = 'none';

        if (!state.intentActive) {
          updateUI('💤', window._t ? window._t('tools.caffeinate.js.status5') : 'Wake lock released.', false, '');
          showMode('none');
          stopHeartbeat();
          stopUptimeTimer();
          return;
        }

        if (document.visibilityState === 'visible' && document.hasFocus()) {
          updateUI('🔄', window._t ? window._t('tools.caffeinate.js.status7') : 'Reactivating...', false, 'warn');
          setTimeout(async function() {
            if (state.intentActive) {
              var ok = await activateWakeLock();
              if (!ok) attemptReactivation('Browser released wake lock');
            }
          }, 1000);
        } else {
          updateUI('⏸️', window._t ? window._t('tools.caffeinate.js.status6') : 'Tab hidden. Wake lock paused — will restore when tab is active.', false, 'warn');
        }
      }

      toggleBtn.addEventListener('click', async function() {
        toggleBtn.disabled = true;
        try {
          if (state.intentActive) {
            await deactivateWakeLock('Wake lock deactivated.', true);
            statsPanel.classList.add('hidden');
            pipBtn.classList.add('hidden');
            pipHint.classList.add('hidden');
            pipBtn.textContent = '📌 Pin to Screen (PiP)';
            return;
          }
          state.intentActive = true;
          state.heartbeatCount = 0;
          state.reactivationCount = 0;
          statsPanel.classList.remove('hidden');
          updateStats();
          var ok = await activateWakeLock();
          if (!ok) {
            state.intentActive = false;
          } else if (supportsPiP) {
            pipBtn.classList.remove('hidden');
            pipHint.classList.remove('hidden');
          }
        } finally {
          toggleBtn.disabled = false;
        }
      });

      pipBtn.addEventListener('click', async function() {
        pipBtn.disabled = true;
        try {
          if (state.pipWindow) {
            // PiP is active — close it
            cleanupPiP();
            state.mode = state.wakeLock ? 'native' : (state.fallbackVideo ? 'fallback' : 'none');
            showMode(state.mode);
            pipBtn.textContent = '📌 Pin to Screen (PiP)';
          } else {
            var ok = await activatePiP();
            if (!ok) {
              pipHint.textContent = 'PiP not available on this browser.';
            }
          }
        } finally {
          pipBtn.disabled = false;
        }
      });

      document.addEventListener('visibilitychange', function() {
        if (!state.intentActive) return;
        if (document.visibilityState === 'visible' && document.hasFocus()) {
          if (!state.active) {
            state.reactivationAttempts = 0;
            updateUI('🔄', window._t ? window._t('tools.caffeinate.js.status7') : 'Reactivating...', false, 'warn');
            setTimeout(async function() {
              if (state.intentActive && document.visibilityState === 'visible') {
                await activateWakeLock();
              }
            }, 500);
          }
        } else if (state.active) {
          updateUI('⏸️', window._t ? window._t('tools.caffeinate.js.status8') : 'Tab hidden. Wake lock effectiveness reduced.', true, 'warn');
        }
      });

      window.addEventListener('focus', function() {
        if (state.intentActive && document.visibilityState === 'visible' && !state.active) {
          setTimeout(function() {
            if (state.intentActive && document.hasFocus()) activateWakeLock();
          }, 100);
        }
        state.lastActivity = Date.now();
      });

      window.addEventListener('pagehide', function() {
        state.intentActive = false;
        stopHeartbeat();
        stopUptimeTimer();
        cleanupPiP();
        if (state.wakeLock) {
          state.wakeLock.removeEventListener('release', handleRelease);
          state.wakeLock.release().catch(function(){});
        }
        cleanupFallback();
      });
    })();
    </script>
  `;

  return createPageTemplate({
    title: translation?.name || 'Caffeinate',
    description: translation?.desc || 'Keep your device screen awake using the Wake Lock API. No downloads, fully client-side.',
    content,
    path: '/caffeinate',
    lang: currentLang
  });
}