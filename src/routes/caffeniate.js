import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { t } from '../utils/i18n.js';

export async function handleCaffeniateRoutes(request, url) {
  if (url.pathname === '/caffeniate' || url.pathname === '/caffeniate/') {
    if (request.method === 'GET') return respondHTML(renderCaffeniatePage());
  }
  return null;
}

function renderCaffeniatePage() {
  const toolHeader = createToolHeader(
    { emoji: '☕' },
    'Caffeniate',
    'Keep your device screen awake using the Wake Lock API. No downloads, fully client-side.',
    [{ text: 'Client-Side Only', tooltip: 'Runs entirely in your browser using Web APIs — your data never leaves your device.' }],
    { toolId: 'caffeniate' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}

        <!-- Status Panel -->
        <div id="status-panel" class="mt-6 p-5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-center transition-all duration-300">
          <div id="status-icon" class="text-5xl mb-3" aria-hidden="true">💤</div>
          <p id="status-text" class="text-surface-700 dark:text-surface-300 text-base" role="status" aria-live="polite" data-i18n="tools.caffeniate.ui.status0">
            ${t('tools.caffeniate.ui.status0')}
          </p>
        </div>

        <!-- Mode Indicator -->
        <div id="mode-badge" class="mt-4 flex justify-center">
          <span id="mode-label" class="hidden px-3 py-1 text-xs font-semibold rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400"></span>
        </div>

        <!-- Note -->
        <p class="mt-4 text-sm text-center text-surface-500 dark:text-surface-400" data-i18n="tools.caffeniate.ui.desc0">
          ${t('tools.caffeniate.ui.desc0')}
        </p>

        <!-- Action Button -->
        <div class="mt-6 flex justify-center">
          <button id="toggle-btn" type="button" data-tooltip="Uses the Wake Lock API to prevent your screen from sleeping" class="btn btn-primary px-8 py-3 text-base font-semibold" data-i18n="tools.caffeniate.ui.button0">
            ${t('tools.caffeniate.ui.button0')}
          </button>
        </div>

        <!-- Stats -->
        <div id="stats-panel" class="hidden mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="text-center p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1" data-i18n="tools.caffeniate.ui.label0">${t('tools.caffeniate.ui.label0')}</div>
            <div id="stat-mode" class="text-sm font-semibold text-surface-900 dark:text-surface-100">—</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1" data-i18n="tools.caffeniate.ui.label1">${t('tools.caffeniate.ui.label1')}</div>
            <div id="stat-uptime" class="text-sm font-semibold text-surface-900 dark:text-surface-100">—</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1" data-i18n="tools.caffeniate.ui.label2">${t('tools.caffeniate.ui.label2')}</div>
            <div id="stat-heartbeats" class="text-sm font-semibold text-surface-900 dark:text-surface-100">0</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1" data-i18n="tools.caffeniate.ui.label3">${t('tools.caffeniate.ui.label3')}</div>
            <div id="stat-reactivations" class="text-sm font-semibold text-surface-900 dark:text-surface-100">0</div>
          </div>
        </div>
      </div>
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
        supportsWakeLock: 'wakeLock' in navigator
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
        var btnText = isActive ? (window._t ? window._t('tools.caffeniate.ui.button1') : 'Deactivate Wake Lock') : (window._t ? window._t('tools.caffeniate.ui.button0') : 'Activate Wake Lock');
        toggleBtn.textContent = btnText;
        toggleBtn.setAttribute('data-i18n', isActive ? 'tools.caffeniate.ui.button1' : 'tools.caffeniate.ui.button0');

        statusPanel.classList.remove('border-primary-400', 'dark:border-primary-600', 'border-yellow-400', 'dark:border-yellow-600', 'border-red-400', 'dark:border-red-600');
        if (panelState === 'active') {
          statusPanel.classList.add('border-primary-400', 'dark:border-primary-600');
        } else if (panelState === 'warn') {
          statusPanel.classList.add('border-yellow-400', 'dark:border-yellow-600');
        } else if (panelState === 'error') {
          statusPanel.classList.add('border-red-400', 'dark:border-red-600');
        }
      }

      function showMode(mode) {
        if (!mode || mode === 'none') {
          modeLabel.classList.add('hidden');
          return;
        }
        var labels = {
          native: window._t ? window._t('tools.caffeniate.js.mode0') : 'Wake Lock API',
          fallback: window._t ? window._t('tools.caffeniate.js.mode1') : 'Video Fallback',
          basic: window._t ? window._t('tools.caffeniate.js.mode2') : 'Basic Fallback'
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
          var msg = (window._t ? window._t('tools.caffeniate.js.status2') : 'Wake lock failed: {{reason}}. Please reactivate manually.').replace('{{reason}}', reason);
          updateUI('❌', msg, false, 'error');
          showMode('none');
          return false;
        }
        state.reactivationAttempts++;
        state.reactivationCount++;
        updateStats();

        var msg = (window._t ? window._t('tools.caffeniate.js.status3') : 'Reactivating ({{attempt}}/{{max}})...').replace('{{attempt}}', state.reactivationAttempts).replace('{{max}}', MAX_REACTIVATION_ATTEMPTS);
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
          updateUI('☕', window._t ? window._t('tools.caffeniate.js.status0') : 'Native wake lock active. Your screen will stay awake.', true, 'active');
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
          var video = document.createElement('video');
          video.setAttribute('playsinline', '');
          video.muted = true;
          video.loop = true;
          video.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none';
          video.setAttribute('aria-hidden', 'true');

          var canvas = document.createElement('canvas');
          canvas.width = 1; canvas.height = 1;
          var ctx = canvas.getContext('2d');
          ctx.fillRect(0, 0, 1, 1);
          video.src = canvas.toDataURL('image/png');

          document.body.appendChild(video);
          await video.play();

          state.fallbackVideo = video;
          state.mode = 'fallback';
          state.active = true;
          state.lastActivity = Date.now();
          updateUI('☕', window._t ? window._t('tools.caffeniate.js.status1') : 'Fallback wake lock active. Keep this tab in the foreground.', true, 'active');
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
      }

      async function activateWakeLock() {
        if (state.supportsWakeLock) {
          var ok = await activateNative();
          if (ok) return true;
        }
        var fb = await activateFallback();
        if (fb) return true;

        updateUI('❌', window._t ? window._t('tools.caffeniate.js.status9') : 'Wake lock unavailable on this device. Check system power settings.', false, 'error');
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

        state.mode = 'none';
        state.active = false;
        updateUI('💤', msg || (window._t ? window._t('tools.caffeniate.js.status4') : 'Wake lock deactivated.'), false, '');
        showMode('none');
        updateStats();
      }

      function handleRelease() {
        state.wakeLock = null;
        state.active = false;
        state.mode = 'none';

        if (!state.intentActive) {
          updateUI('💤', window._t ? window._t('tools.caffeniate.js.status5') : 'Wake lock released.', false, '');
          showMode('none');
          stopHeartbeat();
          stopUptimeTimer();
          return;
        }

        if (document.visibilityState === 'visible' && document.hasFocus()) {
          updateUI('🔄', window._t ? window._t('tools.caffeniate.js.status7') : 'Reactivating...', false, 'warn');
          setTimeout(async function() {
            if (state.intentActive) {
              var ok = await activateWakeLock();
              if (!ok) attemptReactivation('Browser released wake lock');
            }
          }, 1000);
        } else {
          updateUI('⏸️', window._t ? window._t('tools.caffeniate.js.status6') : 'Tab hidden. Wake lock paused — will restore when tab is active.', false, 'warn');
        }
      }

      toggleBtn.addEventListener('click', async function() {
        toggleBtn.disabled = true;
        try {
          if (state.intentActive) {
            await deactivateWakeLock('Wake lock deactivated.', true);
            statsPanel.classList.add('hidden');
            return;
          }
          state.intentActive = true;
          state.heartbeatCount = 0;
          state.reactivationCount = 0;
          statsPanel.classList.remove('hidden');
          updateStats();
          var ok = await activateWakeLock();
          if (!ok) state.intentActive = false;
        } finally {
          toggleBtn.disabled = false;
        }
      });

      document.addEventListener('visibilitychange', function() {
        if (!state.intentActive) return;
        if (document.visibilityState === 'visible' && document.hasFocus()) {
          if (!state.active) {
            state.reactivationAttempts = 0;
            updateUI('🔄', window._t ? window._t('tools.caffeniate.js.status7') : 'Reactivating...', false, 'warn');
            setTimeout(async function() {
              if (state.intentActive && document.visibilityState === 'visible') {
                await activateWakeLock();
              }
            }, 500);
          }
        } else if (state.active) {
          updateUI('⏸️', window._t ? window._t('tools.caffeniate.js.status8') : 'Tab hidden. Wake lock effectiveness reduced.', true, 'warn');
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
    title: 'Caffeniate - Keep Screen Awake',
    description: 'Keep your device screen awake using the Wake Lock API. Client-side, no downloads required.',
    content,
    path: '/caffeniate'
  });
}
