import { respondHTML } from "../utils/respond.js";
import { createPageTemplate, createToolHeader } from "../utils/common-ui.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
  t,
} from "../utils/i18n.js";
import { TOOLS } from "../utils/tool-registry.js";
import { createRelatedToolsSection } from "../utils/content-ui.js";

export async function handleCaffeinateRoutes(request, url) {
  if (url.pathname === "/caffeinate" || url.pathname === "/caffeinate/") {
    if (request.method === "GET")
      return respondHTML(
        renderCaffeinatePage(resolveRequestLanguage(request, url)),
      );
  }
  return null;
}

function renderCaffeinatePage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("caffeinate", currentLang);
  const toolHeader = createToolHeader(
    { emoji: "☕" },
    translation?.name || "Caffeinate",
    translation?.desc ||
      "Keep your device screen awake using the Wake Lock API. No downloads, fully client-side.",
    [
      {
        text: translation?.ui?.badge0 || "Client-Side Only",
        tooltip:
          "Runs entirely in your browser using Web APIs — your data is processed locally and not sent to our servers.",
      },
    ],
    { toolId: "caffeinate" },
  );

  const currentTool = TOOLS.find((t) => t.id === "caffeinate");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">
        ${toolHeader}

        <!-- Status Panel -->
        <div id="status-panel" class="mt-6 p-5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-center transition-all duration-300">
          <div id="status-icon" class="text-5xl mb-3" aria-hidden="true">💤</div>
          <p id="status-text" class="text-surface-700 dark:text-surface-300 text-base" role="status" aria-live="polite" data-i18n="tools.caffeinate.ui.status0">
            ${t("tools.caffeinate.ui.status0")}
          </p>
        </div>

        <!-- Mode Indicator -->
        <div id="mode-badge" class="mt-4 flex justify-center">
          <span id="mode-label" class="hidden px-3 py-1 text-xs font-semibold rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400"></span>
        </div>

        <!-- Note -->
        <p class="mt-4 text-sm text-center text-surface-500 dark:text-surface-400" data-i18n="tools.caffeinate.ui.desc0">
          ${t("tools.caffeinate.ui.desc0")}
        </p>

        <!-- Action Button -->
        <div class="mt-6 flex justify-center">
          <button id="toggle-btn" type="button" data-tooltip="Uses the Wake Lock API to prevent your screen from sleeping" class="btn btn-primary px-8 py-3 text-base font-semibold" data-i18n="tools.caffeinate.ui.button0">
            ${t("tools.caffeinate.ui.button0")}
          </button>
        </div>

        <!-- Stats -->
        <div id="stats-panel" class="hidden mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="text-center p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1" data-i18n="tools.caffeinate.ui.label0">${t("tools.caffeinate.ui.label0")}</div>
            <div id="stat-mode" class="text-sm font-semibold text-surface-900 dark:text-surface-100">—</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1" data-i18n="tools.caffeinate.ui.label1">${t("tools.caffeinate.ui.label1")}</div>
            <div id="stat-uptime" class="text-sm font-semibold text-surface-900 dark:text-surface-100">—</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1" data-i18n="tools.caffeinate.ui.label2">${t("tools.caffeinate.ui.label2")}</div>
            <div id="stat-heartbeats" class="text-sm font-semibold text-surface-900 dark:text-surface-100">0</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1" data-i18n="tools.caffeinate.ui.label3">${t("tools.caffeinate.ui.label3")}</div>
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
      var RECOVERY_DELAY = 500;
      var MAX_RECOVERY_ATTEMPTS = 3;

      var state = {
        wakeLock: null,
        wakeLockReleaseHandler: null,
        requestPromise: null,
        requestGeneration: 0,
        recoveryTimer: null,
        recoveryAttempts: 0,
        lastErrorMessage: '',
        active: false,
        intentActive: false,
        mode: 'none',
        heartbeatTimer: null,
        uptimeTimer: null,
        lastActivity: 0,
        startedAt: 0,
        heartbeatCount: 0,
        reactivationCount: 0,
        supportsWakeLock: Boolean(navigator.wakeLock && navigator.wakeLock.request)
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
        var buttonActive = state.intentActive;
        var btnText = buttonActive ? (window._t ? window._t('tools.caffeinate.ui.button1') : 'Deactivate Wake Lock') : (window._t ? window._t('tools.caffeinate.ui.button0') : 'Activate Wake Lock');
        toggleBtn.textContent = btnText;
        toggleBtn.setAttribute('data-i18n', buttonActive ? 'tools.caffeinate.ui.button1' : 'tools.caffeinate.ui.button0');

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
          fallback: window._t ? window._t('tools.caffeinate.js.mode1') : 'Video Fallback',
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
          if (!state.intentActive || !state.wakeLock) return;
          state.heartbeatCount++;
          updateStats();
          state.lastActivity = Date.now();
          if (state.wakeLock.released) handleRelease(state.wakeLock);
        }, HEARTBEAT_INTERVAL);
      }

      function stopHeartbeat() {
        if (state.heartbeatTimer) {
          clearInterval(state.heartbeatTimer);
          state.heartbeatTimer = null;
        }
      }

      function syncButton() {
        var key = state.intentActive ? 'tools.caffeinate.ui.button1' : 'tools.caffeinate.ui.button0';
        toggleBtn.textContent = window._t ? window._t(key) : (state.intentActive ? 'Deactivate Wake Lock' : 'Activate Wake Lock');
        toggleBtn.setAttribute('data-i18n', key);
      }

      function cancelRecovery() {
        if (state.recoveryTimer) {
          clearTimeout(state.recoveryTimer);
          state.recoveryTimer = null;
        }
        state.recoveryAttempts = 0;
      }

      function scheduleRecovery() {
        if (!state.intentActive || document.visibilityState !== 'visible' ||
            state.wakeLock || state.requestPromise || state.recoveryTimer) return;
        var generation = state.requestGeneration;
        var delay = RECOVERY_DELAY * Math.pow(2, state.recoveryAttempts);
        updateUI('🔄', window._t ? window._t('tools.caffeinate.js.status7') : 'Reactivating...', false, 'warn');
        state.recoveryTimer = setTimeout(async function() {
          state.recoveryTimer = null;
          if (generation !== state.requestGeneration || !state.intentActive ||
              document.visibilityState !== 'visible' || state.wakeLock) return;
          state.recoveryAttempts++;
          state.reactivationCount++;
          updateStats();
          var acquired = await activateWakeLock();
          if (acquired || generation !== state.requestGeneration || !state.intentActive ||
              document.visibilityState !== 'visible' || state.wakeLock) return;
          if (state.recoveryAttempts < MAX_RECOVERY_ATTEMPTS) {
            scheduleRecovery();
          } else {
            requireManualRetry();
          }
        }, delay);
      }

      function requireManualRetry() {
        cancelRecovery();
        state.intentActive = false;
        var message = state.lastErrorMessage ||
          (window._t ? window._t('tools.caffeinate.js.status2') : 'Wake lock failed: {{reason}}. Please reactivate manually.').replace('{{reason}}', 'Request rejected');
        updateUI('❌', message, false, 'error');
        showMode('none');
        updateStats();
      }

      async function activateNative() {
        if (!state.supportsWakeLock || !state.intentActive || document.visibilityState !== 'visible') return false;
        if (state.wakeLock && !state.wakeLock.released) return true;
        if (state.requestPromise) return state.requestPromise;

        var generation = state.requestGeneration;
        var pending = (async function() {
          try {
            var lock = await navigator.wakeLock.request('screen');
            if (generation !== state.requestGeneration || !state.intentActive ||
                document.visibilityState !== 'visible') {
              if (!lock.released) await lock.release();
              return false;
            }
            if (lock.released) throw new Error('Browser returned a released wake lock');

            var releaseHandler = function() { handleRelease(lock); };
            state.wakeLock = lock;
            state.wakeLockReleaseHandler = releaseHandler;
            state.recoveryAttempts = 0;
            state.mode = 'native';
            state.active = true;
            state.lastActivity = Date.now();
            lock.addEventListener('release', releaseHandler);
            updateUI('☕', window._t ? window._t('tools.caffeinate.js.status0') : 'Native wake lock active. Your screen will stay awake.', true, 'active');
            showMode('native');
            updateStats();
            startHeartbeat();
            startUptimeTimer();
            return true;
          } catch (error) {
            if (generation === state.requestGeneration && state.intentActive) {
              var reason = error && (error.message || error.name) ? (error.message || error.name) : 'Request rejected';
              var message = (window._t ? window._t('tools.caffeinate.js.status2') : 'Wake lock failed: {{reason}}. Please reactivate manually.').replace('{{reason}}', reason);
              state.lastErrorMessage = message;
              state.active = false;
              state.mode = 'none';
              updateUI('❌', message, false, 'error');
              showMode('none');
            }
            return false;
          } finally {
            if (state.requestPromise === pending) state.requestPromise = null;
          }
        })();
        state.requestPromise = pending;
        return pending;
      }

      async function activateWakeLock() {
        if (!state.supportsWakeLock) {
          updateUI('❌', window._t ? window._t('tools.caffeinate.js.status9') : 'Wake lock unavailable on this device. Check system power settings.', false, 'error');
          return false;
        }
        return activateNative();
      }

      async function deactivateWakeLock(message, preserveIntent) {
        if (!preserveIntent) state.intentActive = false;
        state.requestGeneration++;
        state.requestPromise = null;
        cancelRecovery();
        stopHeartbeat();
        stopUptimeTimer();

        var lock = state.wakeLock;
        var releaseHandler = state.wakeLockReleaseHandler;
        state.wakeLock = null;
        state.wakeLockReleaseHandler = null;
        state.mode = 'none';
        state.active = false;
        if (lock) {
          lock.removeEventListener('release', releaseHandler);
          try { if (!lock.released) await lock.release(); } catch (e) {}
        }

        updateUI(preserveIntent ? '⏸️' : '💤', message || (window._t ? window._t('tools.caffeinate.js.status4') : 'Wake lock deactivated.'), false, preserveIntent ? 'warn' : '');
        showMode('none');
        updateStats();
      }

      function handleRelease(lock) {
        if (lock !== state.wakeLock) return;
        lock.removeEventListener('release', state.wakeLockReleaseHandler);
        state.wakeLock = null;
        state.wakeLockReleaseHandler = null;
        state.active = false;
        state.mode = 'none';
        stopHeartbeat();
        stopUptimeTimer();
        showMode('none');
        updateStats();

        if (!state.intentActive) {
          updateUI('💤', window._t ? window._t('tools.caffeinate.js.status5') : 'Wake lock released.', false, '');
        } else if (document.visibilityState === 'visible') {
          scheduleRecovery();
        } else {
          updateUI('⏸️', window._t ? window._t('tools.caffeinate.js.status6') : 'Tab hidden. Wake lock paused — will restore when tab is active.', false, 'warn');
        }
      }

      toggleBtn.addEventListener('click', async function() {
        toggleBtn.disabled = true;
        try {
          if (state.intentActive) {
            await deactivateWakeLock('Wake lock deactivated.', false);
            statsPanel.classList.add('hidden');
            return;
          }
          state.intentActive = true;
          state.heartbeatCount = 0;
          state.reactivationCount = 0;
          statsPanel.classList.remove('hidden');
          updateStats();
          syncButton();
          await activateWakeLock();
        } finally {
          toggleBtn.disabled = false;
        }
      });

      document.addEventListener('visibilitychange', function() {
        if (!state.intentActive) return;
        if (document.visibilityState === 'visible') {
          scheduleRecovery();
        } else {
          cancelRecovery();
          updateUI('⏸️', window._t ? window._t('tools.caffeinate.js.status6') : 'Tab hidden. Wake lock paused — will restore when tab is active.', false, 'warn');
        }
      });

      window.addEventListener('focus', function() {
        state.lastActivity = Date.now();
        if (state.intentActive && document.visibilityState === 'visible') scheduleRecovery();
      });

      window.addEventListener('pageshow', function() {
        if (state.intentActive && document.visibilityState === 'visible') scheduleRecovery();
      });

      window.addEventListener('pagehide', function() {
        var message = window._t ? window._t('tools.caffeinate.js.status6') : 'Tab hidden. Wake lock paused — will restore when tab is active.';
        return deactivateWakeLock(message, true);
      });
    })();
    </script>
  `;

  return createPageTemplate({
    title: translation?.name || "Caffeinate",
    description:
      translation?.desc ||
      "Keep your device screen awake using the Wake Lock API. No downloads, fully client-side.",
    content,
    path: "/caffeinate",
    lang: currentLang,
  });
}
