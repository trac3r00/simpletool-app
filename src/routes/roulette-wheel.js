/**
 * Roulette Wheel - Rebuilt with Engaging Spin Experience
 * Crypto-random, client-side roulette wheel with simplified UI.
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';

function renderRouletteWheelPage() {
  const toolHeader = createToolHeader(
    { emoji: '\ud83c\udfa1' },
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
      .rw-container { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; padding: 1rem; }
      .rw-wheel-stage { position: relative; width: min(560px, 90vw); height: min(560px, 90vw); max-width: 640px; max-height: 640px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.1), transparent 50%), radial-gradient(circle at 70% 70%, rgba(236, 72, 153, 0.08), transparent 50%); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset; }
      .dark .rw-wheel-stage { background: radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.15), transparent 50%), radial-gradient(circle at 70% 70%, rgba(236, 72, 153, 0.1), transparent 50%); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset; }
      .rw-wheel-stage.spinning { animation: rw-pulse-glow 2s ease-in-out infinite; }
      @keyframes rw-pulse-glow { 0%, 100% { box-shadow: 0 25px 50px -12px rgba(99, 102, 241, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset; } 50% { box-shadow: 0 25px 50px -12px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset; } }
      .rw-canvas { width: 100%; height: 100%; border-radius: 50%; touch-action: none; }
      .rw-confetti-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; pointer-events: none; z-index: 20; }
      .rw-pointer { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); z-index: 30; filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3)); }
      .rw-pointer svg { width: 48px; height: 56px; }
      .rw-center-btn { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 25; width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border: 4px solid white; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.1) inset; color: white; font-weight: 800; font-size: 1.125rem; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
      .dark .rw-center-btn { border-color: #1e293b; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset; }
      .rw-center-btn:hover:not(:disabled) { transform: translate(-50%, -50%) scale(1.05); box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.6), 0 0 0 1px rgba(0, 0, 0, 0.1) inset; }
      .rw-center-btn:active:not(:disabled) { transform: translate(-50%, -50%) scale(0.98); }
      .rw-center-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .rw-result-popup { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0); z-index: 40; background: white; border-radius: 1rem; padding: 1.5rem 2rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05); text-align: center; opacity: 0; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); min-width: 200px; }
      .dark .rw-result-popup { background: #1e293b; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05); }
      .rw-result-popup.show { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      .rw-result-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 0.5rem; }
      .dark .rw-result-label { color: #9ca3af; }
      .rw-result-text { font-size: 1.875rem; font-weight: 800; color: #111827; line-height: 1.2; }
      .dark .rw-result-text { color: #f9fafb; }
      .rw-controls { width: 100%; max-width: 640px; display: flex; flex-direction: column; gap: 1rem; }
      .rw-main-controls { display: flex; align-items: center; justify-content: center; gap: 1rem; flex-wrap: wrap; }
      .rw-sound-toggle { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #f3f4f6; border-radius: 9999px; cursor: pointer; transition: background 0.2s; font-size: 0.875rem; color: #4b5563; }
      .dark .rw-sound-toggle { background: #374151; color: #d1d5db; }
      .rw-sound-toggle:hover { background: #e5e7eb; }
      .dark .rw-sound-toggle:hover { background: #4b5563; }
      .rw-sound-toggle input { width: 1rem; height: 1rem; accent-color: #6366f1; }
      .rw-section { background: white; border: 1px solid #e5e7eb; border-radius: 0.75rem; overflow: hidden; }
      .dark .rw-section { background: #1e293b; border-color: #374151; }
      .rw-section-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; cursor: pointer; background: transparent; border: none; width: 100%; text-align: left; font-weight: 600; color: #111827; transition: background 0.2s; }
      .dark .rw-section-header { color: #f9fafb; }
      .rw-section-header:hover { background: #f9fafb; }
      .dark .rw-section-header:hover { background: #2d3748; }
      .rw-section-title { display: flex; align-items: center; gap: 0.5rem; }
      .rw-section-icon { width: 1.25rem; height: 1.25rem; color: #6366f1; }
      .rw-section-chevron { width: 1.25rem; height: 1.25rem; transition: transform 0.2s; color: #6b7280; }
      .dark .rw-section-chevron { color: #9ca3af; }
      .rw-section.open .rw-section-chevron { transform: rotate(180deg); }
      .rw-section-content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; }
      .rw-section.open .rw-section-content { max-height: 2000px; }
      .rw-section-inner { padding: 1rem 1.25rem; border-top: 1px solid #e5e7eb; }
      .dark .rw-section-inner { border-color: #374151; }
      .rw-segments-list { display: flex; flex-direction: column; gap: 0.5rem; }
      .rw-segment-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; background: #f9fafb; border-radius: 0.5rem; }
      .dark .rw-segment-item { background: #2d3748; }
      .rw-segment-color { width: 1.25rem; height: 1.25rem; border-radius: 50%; flex-shrink: 0; border: 2px solid white; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1); }
      .dark .rw-segment-color { border-color: #1e293b; }
      .rw-segment-input { flex: 1; min-width: 0; padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; background: white; color: #111827; }
      .dark .rw-segment-input { background: #1e293b; border-color: #4b5563; color: #f9fafb; }
      .rw-segment-input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
      .rw-segment-delete { padding: 0.375rem; background: transparent; border: none; color: #9ca3af; cursor: pointer; border-radius: 0.375rem; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
      .rw-segment-delete:hover:not(:disabled) { background: #fee2e2; color: #dc2626; }
      .dark .rw-segment-delete:hover:not(:disabled) { background: rgba(220, 38, 38, 0.2); }
      .rw-segment-delete:disabled { opacity: 0.3; cursor: not-allowed; }
      .rw-add-segment { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
      .rw-add-input { flex: 1; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; background: white; color: #111827; }
      .dark .rw-add-input { background: #1e293b; border-color: #4b5563; color: #f9fafb; }
      .rw-add-input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
      .rw-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
      .rw-stat-card { background: #f9fafb; padding: 1rem; border-radius: 0.5rem; text-align: center; }
      .dark .rw-stat-card { background: #2d3748; }
      .rw-stat-value { font-size: 1.5rem; font-weight: 800; color: #111827; }
      .dark .rw-stat-value { color: #f9fafb; }
      .rw-stat-label { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem; }
      .dark .rw-stat-label { color: #9ca3af; }
      .rw-freq-list { display: flex; flex-direction: column; gap: 0.75rem; }
      .rw-freq-item { display: flex; align-items: center; gap: 0.75rem; }
      .rw-freq-label { width: 100px; font-size: 0.875rem; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .dark .rw-freq-label { color: #d1d5db; }
      .rw-freq-bar-wrap { flex: 1; height: 0.5rem; background: #e5e7eb; border-radius: 9999px; overflow: hidden; }
      .dark .rw-freq-bar-wrap { background: #4b5563; }
      .rw-freq-bar { height: 100%; border-radius: 9999px; transition: width 0.3s ease; }
      .rw-freq-count { width: 2rem; text-align: right; font-size: 0.875rem; font-weight: 600; color: #111827; }
      .dark .rw-freq-count { color: #f9fafb; }
      .rw-history-list { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; }
      .rw-history-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; background: #f9fafb; border-radius: 0.375rem; font-size: 0.875rem; }
      .dark .rw-history-item { background: #2d3748; }
      .rw-history-color { width: 0.75rem; height: 0.75rem; border-radius: 50%; flex-shrink: 0; }
      .rw-history-name { flex: 1; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .dark .rw-history-name { color: #f9fafb; }
      .rw-history-time { font-size: 0.75rem; color: #9ca3af; font-family: monospace; }
      .rw-preset-row { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
      .rw-preset-select { flex: 1; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; background: white; color: #111827; }
      .dark .rw-preset-select { background: #1e293b; border-color: #4b5563; color: #f9fafb; }
      .rw-mode-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
      .rw-mode-input { width: 80px; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; background: white; color: #111827; text-align: center; }
      .dark .rw-mode-input { background: #1e293b; border-color: #4b5563; color: #f9fafb; }
      .rw-mode-status { font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem; }
      .dark .rw-mode-status { color: #9ca3af; }
      .rw-ranking-list { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem; }
      .rw-ranking-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem; background: linear-gradient(90deg, rgba(99, 102, 241, 0.1), transparent); border-radius: 0.375rem; font-size: 0.875rem; }
      .rw-ranking-rank { width: 1.5rem; height: 1.5rem; display: flex; align-items: center; justify-content: center; background: #6366f1; color: white; border-radius: 50%; font-size: 0.75rem; font-weight: 700; }
      .rw-ranking-color { width: 0.75rem; height: 0.75rem; border-radius: 50%; }
      .rw-ranking-name { flex: 1; color: #111827; }
      .dark .rw-ranking-name { color: #f9fafb; }
      @keyframes rw-shake { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(-4px, 2px); } 20% { transform: translate(3px, -3px); } 30% { transform: translate(-3px, 2px); } 40% { transform: translate(2px, -1px); } 50% { transform: translate(-1px, 1px); } 60% { transform: translate(1px, -1px); } 70% { transform: translate(-1px, 0); } 80% { transform: translate(0, -1px); } 90% { transform: translate(1px, 0); } }
      .rw-shake { animation: rw-shake 500ms ease-out; }
      @media (prefers-reduced-motion: reduce) { .rw-wheel-stage.spinning { animation: none; } .rw-result-popup { transition: none; } .rw-section-content { transition: none; } .rw-shake { animation: none; } .rw-freq-bar { transition: none; } .rw-section-chevron { transition: none; } }
      @media (max-width: 640px) { .rw-container { padding: 0.5rem; gap: 1rem; } .rw-center-btn { width: 80px; height: 80px; font-size: 0.875rem; } .rw-pointer { top: -8px; } .rw-pointer svg { width: 36px; height: 42px; } .rw-result-popup { padding: 1rem 1.25rem; min-width: 160px; } .rw-result-text { font-size: 1.25rem; } .rw-stats-grid { grid-template-columns: repeat(2, 1fr); } .rw-freq-label { width: 80px; } }
    </style>
  `;

  const content = `
    ${styles}
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}
        <div class="rw-container">
          <div class="rw-wheel-stage" id="wheel-stage" role="img" data-i18n-aria="tools.roulette-wheel.ui.aria-wheel" aria-label="Roulette wheel">
            <canvas id="wheel-canvas" class="rw-canvas"></canvas>
            <canvas id="confetti-canvas" class="rw-confetti-canvas"></canvas>
            <div class="rw-pointer">
              <svg viewBox="0 0 48 56" fill="none" aria-hidden="true">
                <path d="M24 52c10.2 0 18.5-8.3 18.5-18.5V12c0-1.4-1.7-2.2-2.8-1.2L25.2 21c-.7.5-1.7.5-2.4 0L8.3 10.8c-1.1-1-2.8-.2-2.8 1.2v23.5C5.5 43.7 13.8 52 24 52Z" fill="#1f2937"/>
                <path d="M24 47.4c7.7 0 13.9-6.2 13.9-13.9V17L27 24.8c-1.8 1.3-4.2 1.3-6 0L10.1 17v16.5c0 7.7 6.2 13.9 13.9 13.9Z" fill="#6366f1"/>
              </svg>
            </div>
            <button id="spin-button" class="rw-center-btn" data-i18n="tools.roulette-wheel.ui.spin-button" data-i18n-aria="tools.roulette-wheel.ui.spin-button-aria" aria-label="Spin the wheel">SPIN</button>
            <div id="result-popup" class="rw-result-popup result-announcement" role="alert" aria-live="polite">
              <div class="rw-result-label" data-i18n="tools.roulette-wheel.ui.result-label">Winner</div>
              <div id="result-text" class="rw-result-text"></div>
            </div>
          </div>
          <div class="rw-controls">
            <div class="rw-main-controls">
              <label class="rw-sound-toggle">
                <input type="checkbox" id="sound-toggle">
                <span data-i18n="tools.roulette-wheel.ui.sound-toggle">Sound</span>
              </label>
              <button id="clear-stats-btn" class="btn btn-ghost btn-sm" data-i18n="tools.roulette-wheel.ui.clear-stats">Clear Stats</button>
            </div>
            <div class="rw-section open" id="segments-section">
              <button class="rw-section-header" type="button" aria-expanded="true" data-section-toggle>
                <span class="rw-section-title">
                  <svg class="rw-section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                  <span data-i18n="tools.roulette-wheel.ui.segments-title">Segments</span>
                </span>
                <svg class="rw-section-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div class="rw-section-content">
                <div class="rw-section-inner">
                  <div id="segments-list" class="rw-segments-list"></div>
                  <div class="rw-add-segment">
                    <input type="text" id="new-segment-input" class="rw-add-input" data-i18n-placeholder="tools.roulette-wheel.ui.add-placeholder" placeholder="Add new segment...">
                    <button id="add-segment-btn" class="btn btn-secondary btn-sm" data-i18n="tools.roulette-wheel.ui.add-button">Add</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="rw-section" id="stats-section">
              <button class="rw-section-header" type="button" aria-expanded="false" data-section-toggle>
                <span class="rw-section-title">
                  <svg class="rw-section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                  <span data-i18n="tools.roulette-wheel.ui.stats-title">Statistics</span>
                </span>
                <svg class="rw-section-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div class="rw-section-content">
                <div class="rw-section-inner">
                  <div class="rw-stats-grid">
                    <div class="rw-stat-card"><div id="stat-total" class="rw-stat-value">0</div><div class="rw-stat-label" data-i18n="tools.roulette-wheel.ui.stat-total">Spins</div></div>
                    <div class="rw-stat-card"><div id="stat-fairness" class="rw-stat-value">\u2014</div><div class="rw-stat-label" data-i18n="tools.roulette-wheel.ui.stat-fairness">Fairness</div></div>
                  </div>
                  <div id="freq-chart" class="rw-freq-list"></div>
                  <div style="margin-top: 1rem;">
                    <div class="text-sm font-semibold mb-2" data-i18n="tools.roulette-wheel.ui.history-title">Recent History</div>
                    <div id="history-list" class="rw-history-list"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="rw-section" id="presets-section">
              <button class="rw-section-header" type="button" aria-expanded="false" data-section-toggle>
                <span class="rw-section-title">
                  <svg class="rw-section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                  <span data-i18n="tools.roulette-wheel.ui.presets-title">Presets</span>
                </span>
                <svg class="rw-section-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div class="rw-section-content">
                <div class="rw-section-inner">
                  <div class="rw-preset-row">
                    <input type="text" id="preset-name-input" class="rw-add-input" data-i18n-placeholder="tools.roulette-wheel.ui.preset-name-placeholder" placeholder="Preset name...">
                    <button id="save-preset-btn" class="btn btn-secondary btn-sm" data-i18n="tools.roulette-wheel.ui.save-preset">Save</button>
                  </div>
                  <div class="rw-preset-row">
                    <select id="preset-select" class="rw-preset-select" data-i18n-aria="tools.roulette-wheel.ui.preset-select-aria">
                      <option value="" data-i18n="tools.roulette-wheel.ui.select-preset">Select a preset...</option>
                    </select>
                    <button id="load-preset-btn" class="btn btn-primary btn-sm" data-i18n="tools.roulette-wheel.ui.load-preset">Load</button>
                  </div>
                  <div id="preset-status" class="rw-mode-status" data-i18n="tools.roulette-wheel.ui.preset-status">No preset loaded.</div>
                </div>
              </div>
            </div>
            <div class="rw-section" id="series-section">
              <button class="rw-section-header" type="button" aria-expanded="false" data-section-toggle>
                <span class="rw-section-title">
                  <svg class="rw-section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  <span data-i18n="tools.roulette-wheel.ui.series-title">Series Mode</span>
                </span>
                <svg class="rw-section-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div class="rw-section-content">
                <div class="rw-section-inner">
                  <div class="rw-mode-row">
                    <input type="number" id="series-count" class="rw-mode-input" value="10" min="1" max="50" data-i18n-aria="tools.roulette-wheel.ui.series-count-aria">
                    <button id="start-series-btn" class="btn btn-primary btn-sm" data-i18n="tools.roulette-wheel.ui.start-series">Start Series</button>
                    <button id="stop-series-btn" class="btn btn-ghost btn-sm" disabled data-i18n="tools.roulette-wheel.ui.stop-series">Stop</button>
                  </div>
                  <div id="series-status" class="rw-mode-status" data-i18n="tools.roulette-wheel.ui.series-status">Ready to start series.</div>
                </div>
              </div>
            </div>
            <div class="rw-section" id="tournament-section">
              <button class="rw-section-header" type="button" aria-expanded="false" data-section-toggle>
                <span class="rw-section-title">
                  <svg class="rw-section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                  <span data-i18n="tools.roulette-wheel.ui.tournament-title">Tournament Mode</span>
                </span>
                <svg class="rw-section-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div class="rw-section-content">
                <div class="rw-section-inner">
                  <div class="rw-mode-row">
                    <button id="start-tournament-btn" class="btn btn-primary btn-sm" data-i18n="tools.roulette-wheel.ui.start-tournament">Start Tournament</button>
                    <button id="stop-tournament-btn" class="btn btn-ghost btn-sm" disabled data-i18n="tools.roulette-wheel.ui.stop-tournament">Stop</button>
                  </div>
                  <div id="tournament-status" class="rw-mode-status" data-i18n="tools.roulette-wheel.ui.tournament-status">Ready to start tournament.</div>
                  <div id="tournament-ranking" class="rw-ranking-list"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `;

  const script = `
    <script src="/vendor/game-utils.min.js"><\/script>
    <script>
      (function() {
        'use strict';
        const { cryptoUint32, randInt, randFloat, clamp, escapeHtml, ensureAudioCtx, playBeep, spawnConfetti, tickConfetti, drawConfettiParticles } = window.GameUtils;
        const COLOR_PALETTE = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#d946ef', '#0ea5e9', '#f43f5e', '#22c55e', '#a855f7', '#fb923c', '#06b6d4', '#e11d48', '#4ade80', '#7c3aed'];
        const MIN_SEGMENTS = 2, MAX_SEGMENTS = 20, PRESET_KEY = 'roulette-presets';
        const state = { segments: [], rotation: 0, spinning: false, winnerIndex: null, canvasSize: 0, dpr: 1, audio: { enabled: false, ctx: null }, stats: { total: 0, counts: {}, history: [] }, series: { active: false, remaining: 0, total: 0 }, tournament: { active: false, ranking: [], originalSegments: null }, confetti: [], confettiRaf: null, spinRaf: null };
        const elWheelStage = document.getElementById('wheel-stage'), elWheelCanvas = document.getElementById('wheel-canvas'), elConfettiCanvas = document.getElementById('confetti-canvas'), elSpinBtn = document.getElementById('spin-button'), elResultPopup = document.getElementById('result-popup'), elResultText = document.getElementById('result-text'), elSoundToggle = document.getElementById('sound-toggle'), wheelCtx = elWheelCanvas.getContext('2d'), confettiCtx = elConfettiCanvas.getContext('2d');
        function randomId() { const b = new Uint8Array(8); crypto.getRandomValues(b); return Array.from(b, x => x.toString(16).padStart(2, '0')).join(''); }
        function normalizeAngle(a) { const tau = Math.PI * 2; let x = a % tau; if (x < 0) x += tau; return x; }
        function mixColor(hexA, hexB, t) { const parse = (hex) => { const h = String(hex || '').trim().replace('#', ''); const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h.padEnd(6, '0').slice(0, 6); const n = parseInt(full, 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; }; const a = parse(hexA), b = parse(hexB), tt = clamp(t, 0, 1); const r = Math.round(a.r + (b.r - a.r) * tt), g = Math.round(a.g + (b.g - a.g) * tt), bl = Math.round(a.b + (b.b - a.b) * tt); return '#' + [r, g, bl].map(x => x.toString(16).padStart(2, '0')).join(''); }
        function nowIsoShort() { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0'); }
        function sizeCanvases() { const rect = elWheelStage.getBoundingClientRect(); const cssSize = Math.max(10, Math.floor(Math.min(rect.width, rect.height))); const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); state.canvasSize = cssSize; state.dpr = dpr; elWheelCanvas.width = Math.max(1, Math.round(cssSize * dpr)); elWheelCanvas.height = Math.max(1, Math.round(cssSize * dpr)); elConfettiCanvas.width = Math.max(1, Math.round(cssSize * dpr)); elConfettiCanvas.height = Math.max(1, Math.round(cssSize * dpr)); wheelCtx.setTransform(dpr, 0, 0, dpr, 0, 0); confettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0); }
        function fitLabel(label, maxChars) { const s = String(label || '').trim(); if (!s) return ''; if (s.length <= maxChars) return s; return s.slice(0, Math.max(1, maxChars - 1)).trimEnd() + '\\u2026'; }
        function drawWheel() { const size = state.canvasSize; if (!size) return; const ctx = wheelCtx, n = state.segments.length, cx = size / 2, cy = size / 2, radius = Math.max(10, size * 0.46); ctx.clearRect(0, 0, size, size); ctx.save(); ctx.translate(cx, cy); ctx.shadowColor = document.documentElement.classList.contains('dark') ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12; ctx.beginPath(); ctx.arc(0, 0, radius + 4, 0, Math.PI * 2); ctx.fillStyle = 'transparent'; ctx.fill(); ctx.restore(); if (n < 1) return; const anglePer = (Math.PI * 2) / n, baseStart = -Math.PI / 2, rot = state.rotation; ctx.save(); ctx.translate(cx, cy); for (let i = 0; i < n; i++) { const seg = state.segments[i], start = baseStart + rot + i * anglePer, end = start + anglePer; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, radius, start, end); ctx.closePath(); const base = seg.color, c1 = mixColor(base, '#ffffff', 0.15), c2 = mixColor(base, '#000000', 0.15), grad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius); grad.addColorStop(0, c1); grad.addColorStop(1, c2); ctx.fillStyle = grad; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = document.documentElement.classList.contains('dark') ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)'; ctx.stroke(); if (state.winnerIndex === i && !state.spinning) { ctx.save(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 20; ctx.shadowColor = seg.color; ctx.stroke(); ctx.restore(); } } ctx.restore(); ctx.save(); ctx.translate(cx, cy); ctx.lineWidth = 1; ctx.strokeStyle = document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'; for (let i = 0; i < n; i++) { const a = baseStart + rot + i * anglePer; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius); ctx.stroke(); } ctx.restore(); ctx.save(); ctx.translate(cx, cy); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 4; for (let i = 0; i < n; i++) { const seg = state.segments[i], label = fitLabel(seg.label || ('Option ' + (i + 1)), n > 12 ? 10 : 14); if (!label) continue; const mid = baseStart + rot + (i + 0.5) * anglePer, textRadius = radius * 0.65; ctx.save(); ctx.rotate(mid); ctx.translate(textRadius, 0); const ang = normalizeAngle(mid); if (ang > Math.PI / 2 && ang < (Math.PI * 3) / 2) ctx.rotate(Math.PI); const fontSize = clamp(Math.round(radius * 0.09), 10, 16); ctx.font = '700 ' + fontSize + 'px ui-sans-serif, system-ui, -apple-system, sans-serif'; ctx.fillText(label, 0, 0); ctx.restore(); } ctx.restore(); ctx.save(); ctx.translate(cx, cy); const capR = radius * 0.18, capGrad = ctx.createRadialGradient(0, 0, capR * 0.2, 0, 0, capR); capGrad.addColorStop(0, document.documentElement.classList.contains('dark') ? '#374151' : '#f3f4f6'); capGrad.addColorStop(1, document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff'); ctx.beginPath(); ctx.arc(0, 0, capR, 0, Math.PI * 2); ctx.fillStyle = capGrad; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#4b5563' : '#e5e7eb'; ctx.stroke(); ctx.restore(); }
        function spawnConfettiBurst() { const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; if (prefersReducedMotion) return; const size = state.canvasSize; if (!size) return; const cx = size / 2, cy = size / 2, colors = [...COLOR_PALETTE.slice(0, 6), '#fbbf24', '#f472b6']; spawnConfetti(state.confetti, cx, cy, 120, colors, 1); let last = performance.now(), endAt = last + 3000; function tick(now) { const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now; tickConfetti(state.confetti, dt, size); confettiCtx.clearRect(0, 0, size, size); drawConfettiParticles(confettiCtx, state.confetti); if (now < endAt && state.confetti.length > 0) state.confettiRaf = requestAnimationFrame(tick); else { confettiCtx.clearRect(0, 0, size, size); state.confetti = []; } } if (state.confettiRaf) cancelAnimationFrame(state.confettiRaf); state.confettiRaf = requestAnimationFrame(tick); }
        function playTick() { if (!state.audio.enabled) return; ensureAudioCtx(state.audio); if (!state.audio.ctx) return; playBeep(state.audio, 600 + randInt(200), 30, 0.1); }
        function playWin() { if (!state.audio.enabled) return; ensureAudioCtx(state.audio); if (!state.audio.ctx) return; const notes = [523.25, 659.25, 783.99, 1046.5]; notes.forEach((freq, i) => setTimeout(() => playBeep(state.audio, freq, 150, 0.12), i * 80)); }
        function dramaticEase(t) { const x = clamp(t, 0, 1); if (x < 0.1) { const p = x / 0.1; return p * p * 0.05; } if (x < 0.65) { const p = (x - 0.1) / 0.55; return 0.05 + p * 0.65; } if (x < 0.9) { const p = (x - 0.65) / 0.25, eased = 1 - Math.pow(1 - p, 3); return 0.7 + eased * 0.22; } if (x < 0.98) { const p = (x - 0.9) / 0.08, eased = 1 - Math.pow(1 - p, 4); return 0.92 + eased * 0.06; } const p = (x - 0.98) / 0.02, overshoot = Math.sin(p * Math.PI) * 0.01; return 0.98 + p * 0.02 + overshoot * (1 - p); }
        function screenShake() { const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; if (prefersReducedMotion) return; elWheelStage.classList.remove('rw-shake'); void elWheelStage.offsetHeight; elWheelStage.classList.add('rw-shake'); setTimeout(() => elWheelStage.classList.remove('rw-shake'), 500); }
        function computeTargetRotationForIndex(index, extraSpins) { const n = state.segments.length, anglePer = (Math.PI * 2) / Math.max(1, n), desiredMod = normalizeAngle(-(index + 0.5) * anglePer), currentMod = normalizeAngle(state.rotation); let delta = desiredMod - currentMod; if (delta < 0) delta += Math.PI * 2; return state.rotation + (extraSpins * Math.PI * 2) + delta; }
        function getIndexAtRotation(rot) { const n = state.segments.length; if (n <= 0) return 0; const anglePer = (Math.PI * 2) / n, baseStart = -Math.PI / 2, pointerAngle = -Math.PI / 2, local = normalizeAngle(pointerAngle - rot - baseStart); return clamp(Math.floor(local / anglePer), 0, n - 1); }
        function spin() { if (state.spinning) return; if (state.segments.length < MIN_SEGMENTS) { alert(window._t ? window._t('tools.roulette-wheel.js.need-more', 'Add at least 2 segments') : 'Add at least 2 segments'); return; } const winnerIndex = randInt(state.segments.length); state.winnerIndex = winnerIndex; state.spinning = true; elSpinBtn.disabled = true; elWheelStage.classList.add('spinning'); elResultPopup.classList.remove('show'); const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches, durationMs = prefersReducedMotion ? 800 : 5500 + randInt(1500), extraSpins = prefersReducedMotion ? 1 : 5 + randInt(3), startRot = state.rotation, endRot = computeTargetRotationForIndex(winnerIndex, extraSpins), startedAt = performance.now(); let lastTickIndex = null; function tick(now) { const elapsed = now - startedAt, t = clamp(elapsed / durationMs, 0, 1), eased = dramaticEase(t); state.rotation = startRot + (endRot - startRot) * eased; if (state.audio.enabled && !prefersReducedMotion) { const currentIndex = getIndexAtRotation(state.rotation); if (lastTickIndex !== null && currentIndex !== lastTickIndex) playTick(); lastTickIndex = currentIndex; } drawWheel(); if (t < 1) state.spinRaf = requestAnimationFrame(tick); else { state.rotation = endRot; state.spinning = false; elSpinBtn.disabled = false; elWheelStage.classList.remove('spinning'); screenShake(); showResult(winnerIndex); spawnConfettiBurst(); playWin(); if (state.series.active) handleSeriesComplete(winnerIndex); else if (state.tournament.active) handleTournamentComplete(winnerIndex); } } if (state.spinRaf) cancelAnimationFrame(state.spinRaf); state.spinRaf = requestAnimationFrame(tick); }
        function showResult(index) { const seg = state.segments[index]; if (!seg) return; state.stats.total++; state.stats.counts[seg.id] = (state.stats.counts[seg.id] || 0) + 1; state.stats.history.unshift({ id: seg.id, label: seg.label, color: seg.color, time: nowIsoShort() }); if (state.stats.history.length > 50) state.stats.history.pop(); updateStatsUI(); elResultText.textContent = seg.label || ('Option ' + (index + 1)); elResultPopup.classList.add('show'); setTimeout(() => elResultPopup.classList.remove('show'), 3000); }
        function updateStatsUI() { document.getElementById('stat-total').textContent = state.stats.total; const n = state.segments.length, total = state.stats.total, fairnessEl = document.getElementById('stat-fairness'); if (total < 10 || n < 2) fairnessEl.textContent = '\\u2014'; else { let maxDev = 0; const expected = 100 / n; for (const seg of state.segments) { const count = state.stats.counts[seg.id] || 0, actual = (count / total) * 100; maxDev = Math.max(maxDev, Math.abs(actual - expected)); } if (maxDev < 5) fairnessEl.textContent = 'Good'; else if (maxDev < 10) fairnessEl.textContent = 'Fair'; else fairnessEl.textContent = 'Uneven'; } const freqChart = document.getElementById('freq-chart'); if (n === 0) freqChart.innerHTML = '<div class="text-sm text-surface-500">No segments</div>'; else { const maxCount = Math.max(1, ...state.segments.map(s => state.stats.counts[s.id] || 0)); freqChart.innerHTML = state.segments.map((seg, i) => { const count = state.stats.counts[seg.id] || 0, pct = maxCount > 0 ? (count / maxCount) * 100 : 0, label = fitLabel(seg.label || ('Option ' + (i + 1)), 12); return '<div class="rw-freq-item"><div class="rw-freq-label">' + escapeHtml(label) + '</div><div class="rw-freq-bar-wrap"><div class="rw-freq-bar" style="width:' + pct.toFixed(1) + '%;background:' + seg.color + '"></div></div><div class="rw-freq-count">' + count + '</div></div>'; }).join(''); } const historyList = document.getElementById('history-list'); if (state.stats.history.length === 0) historyList.innerHTML = '<div class="text-sm text-surface-500 p-2">No spins yet</div>'; else historyList.innerHTML = state.stats.history.slice(0, 10).map(h => '<div class="rw-history-item"><div class="rw-history-color" style="background:' + h.color + '"></div><div class="rw-history-name">' + escapeHtml(h.label || 'Unknown') + '</div><div class="rw-history-time">' + h.time + '</div></div>').join(''); }
        function renderSegments() { const list = document.getElementById('segments-list'), n = state.segments.length; list.innerHTML = state.segments.map((seg, i) => { const canDelete = n > MIN_SEGMENTS; return '<div class="rw-segment-item" data-seg-id="' + seg.id + '"><div class="rw-segment-color" style="background:' + seg.color + '"></div><input type="text" class="rw-segment-input" value="' + escapeHtml(seg.label || '') + '" data-i18n-placeholder="tools.roulette-wheel.ui.segment-placeholder" placeholder="Segment name"><button class="rw-segment-delete" ' + (canDelete ? '' : 'disabled') + ' data-i18n-aria="tools.roulette-wheel.ui.delete-segment-aria" aria-label="Delete segment"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button></div>'; }).join(''); }
        function addSegment(label) { if (state.segments.length >= MAX_SEGMENTS) return false; const i = state.segments.length; state.segments.push({ id: randomId(), label: label || ('Option ' + (i + 1)), color: COLOR_PALETTE[i % COLOR_PALETTE.length] }); renderSegments(); drawWheel(); return true; }
        function removeSegment(id) { if (state.segments.length <= MIN_SEGMENTS) return false; state.segments = state.segments.filter(s => s.id !== id); renderSegments(); drawWheel(); updateStatsUI(); return true; }
        function updateSegmentLabel(id, label) { const seg = state.segments.find(s => s.id === id); if (seg) { seg.label = label; drawWheel(); updateStatsUI(); } }
        function readPresets() { try { const raw = localStorage.getItem(PRESET_KEY); if (!raw) return []; const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; if (parsed && Array.isArray(parsed.presets)) return parsed.presets; return []; } catch (e) { return []; } }
        function writePresets(presets) { try { localStorage.setItem(PRESET_KEY, JSON.stringify({ version: 1, presets })); return true; } catch (e) { return false; } }
        function renderPresetSelect() { const presets = readPresets(), select = document.getElementById('preset-select'), current = select.value; select.innerHTML = '<option value="">' + (window._t ? window._t('tools.roulette-wheel.ui.select-preset', 'Select a preset...') : 'Select a preset...') + '</option>' + presets.map(p => '<option value="' + escapeHtml(p.name) + '">' + escapeHtml(p.name) + '</option>').join(''); if (current) select.value = current; }
        function savePreset(name) { if (!name.trim()) return; const presets = readPresets().filter(p => p.name !== name); presets.unshift({ name: name.trim(), savedAt: Date.now(), segments: state.segments.map(s => ({ ...s })) }); if (writePresets(presets.slice(0, 50))) { renderPresetSelect(); document.getElementById('preset-select').value = name.trim(); document.getElementById('preset-status').textContent = window._t ? window._t('tools.roulette-wheel.ui.preset-saved', 'Saved: {name}').replace('{name}', name.trim()) : 'Saved: ' + name.trim(); } }
        function loadPreset(name) { const presets = readPresets(), preset = presets.find(p => p.name === name); if (!preset || !Array.isArray(preset.segments)) return false; state.segments = preset.segments.slice(0, MAX_SEGMENTS).map((s, i) => ({ id: s.id || randomId(), label: s.label || ('Option ' + (i + 1)), color: s.color || COLOR_PALETTE[i % COLOR_PALETTE.length] })); state.stats = { total: 0, counts: {}, history: [] }; state.rotation = 0; renderSegments(); drawWheel(); updateStatsUI(); document.getElementById('preset-status').textContent = window._t ? window._t('tools.roulette-wheel.ui.preset-loaded', 'Loaded: {name}').replace('{name}', name) : 'Loaded: ' + name; return true; }
        function startSeries(count) { if (state.spinning || state.series.active) return; if (state.segments.length < MIN_SEGMENTS) return; state.series.active = true; state.series.total = count; state.series.remaining = count; document.getElementById('start-series-btn').disabled = true; document.getElementById('stop-series-btn').disabled = false; updateSeriesStatus(); spin(); }
        function stopSeries() { state.series.active = false; document.getElementById('start-series-btn').disabled = false; document.getElementById('stop-series-btn').disabled = true; document.getElementById('series-status').textContent = window._t ? window._t('tools.roulette-wheel.ui.series-stopped', 'Series stopped') : 'Series stopped'; }
        function handleSeriesComplete(winnerIndex) { state.series.remaining--; updateSeriesStatus(); if (state.series.active && state.series.remaining > 0) setTimeout(() => spin(), 500); else { state.series.active = false; document.getElementById('start-series-btn').disabled = false; document.getElementById('stop-series-btn').disabled = true; document.getElementById('series-status').textContent = window._t ? window._t('tools.roulette-wheel.ui.series-complete', 'Series complete!') : 'Series complete!'; } }
        function updateSeriesStatus() { const played = state.series.total - state.series.remaining; document.getElementById('series-status').textContent = (window._t ? window._t('tools.roulette-wheel.ui.series-progress', 'Spin {played} of {total}') : 'Spin {played} of {total}').replace('{played}', played).replace('{total}', state.series.total); }
        function startTournament() { if (state.spinning || state.tournament.active) return; if (state.segments.length < 2) { alert(window._t ? window._t('tools.roulette-wheel.ui.need-two', 'Need at least 2 segments') : 'Need at least 2 segments'); return; } state.tournament.active = true; state.tournament.ranking = []; state.tournament.originalSegments = state.segments.map(s => ({ ...s })); document.getElementById('start-tournament-btn').disabled = true; document.getElementById('stop-tournament-btn').disabled = false; document.getElementById('tournament-ranking').innerHTML = ''; document.getElementById('tournament-status').textContent = window._t ? window._t('tools.roulette-wheel.ui.tournament-running', 'Tournament running...') : 'Tournament running...'; spin(); }
        function stopTournament() { state.tournament.active = false; if (state.tournament.originalSegments) { state.segments = state.tournament.originalSegments; renderSegments(); drawWheel(); } document.getElementById('start-tournament-btn').disabled = false; document.getElementById('stop-tournament-btn').disabled = true; document.getElementById('tournament-status').textContent = window._t ? window._t('tools.roulette-wheel.ui.tournament-stopped', 'Tournament stopped') : 'Tournament stopped'; }
        function handleTournamentComplete(winnerIndex) { const winner = state.segments[winnerIndex]; if (winner) { state.tournament.ranking.push({ ...winner }); renderTournamentRanking(); state.segments = state.segments.filter((_, i) => i !== winnerIndex); renderSegments(); drawWheel(); if (state.segments.length > 0 && state.tournament.active) setTimeout(() => spin(), 800); else { state.tournament.active = false; if (state.tournament.originalSegments) { state.segments = state.tournament.originalSegments; renderSegments(); drawWheel(); } document.getElementById('start-tournament-btn').disabled = false; document.getElementById('stop-tournament-btn').disabled = true; document.getElementById('tournament-status').textContent = window._t ? window._t('tools.roulette-wheel.ui.tournament-complete', 'Tournament complete!') : 'Tournament complete!'; } } }
        function renderTournamentRanking() { const container = document.getElementById('tournament-ranking'); container.innerHTML = state.tournament.ranking.map((seg, i) => '<div class="rw-ranking-item"><div class="rw-ranking-rank">' + (i + 1) + '</div><div class="rw-ranking-color" style="background:' + seg.color + '"></div><div class="rw-ranking-name">' + escapeHtml(seg.label || ('Option ' + (i + 1))) + '</div></div>').join(''); }
        function init() { for (let i = 0; i < 4; i++) state.segments.push({ id: randomId(), label: 'Option ' + (i + 1), color: COLOR_PALETTE[i % COLOR_PALETTE.length] }); sizeCanvases(); renderSegments(); drawWheel(); updateStatsUI(); renderPresetSelect(); elSpinBtn.addEventListener('click', () => spin()); elSoundToggle.addEventListener('change', () => { state.audio.enabled = elSoundToggle.checked; if (state.audio.enabled) ensureAudioCtx(state.audio); }); document.getElementById('clear-stats-btn').addEventListener('click', () => { state.stats = { total: 0, counts: {}, history: [] }; updateStatsUI(); }); document.getElementById('segments-list').addEventListener('input', (e) => { if (e.target.classList.contains('rw-segment-input')) { const id = e.target.closest('.rw-segment-item').dataset.segId; updateSegmentLabel(id, e.target.value); } }); document.getElementById('segments-list').addEventListener('click', (e) => { const btn = e.target.closest('.rw-segment-delete'); if (btn) { const id = btn.closest('.rw-segment-item').dataset.segId; removeSegment(id); } }); document.getElementById('add-segment-btn').addEventListener('click', () => { const input = document.getElementById('new-segment-input'); if (addSegment(input.value.trim())) input.value = ''; }); document.getElementById('new-segment-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') { const input = document.getElementById('new-segment-input'); if (addSegment(input.value.trim())) input.value = ''; } }); document.querySelectorAll('[data-section-toggle]').forEach(btn => btn.addEventListener('click', () => { const section = btn.closest('.rw-section'), isOpen = section.classList.contains('open'); section.classList.toggle('open', !isOpen); btn.setAttribute('aria-expanded', String(!isOpen)); })); document.getElementById('save-preset-btn').addEventListener('click', () => { const name = document.getElementById('preset-name-input').value.trim(); if (name) { savePreset(name); document.getElementById('preset-name-input').value = ''; } }); document.getElementById('load-preset-btn').addEventListener('click', () => { const name = document.getElementById('preset-select').value; if (name) loadPreset(name); }); document.getElementById('start-series-btn').addEventListener('click', () => { const count = parseInt(document.getElementById('series-count').value, 10) || 10; startSeries(clamp(count, 1, 50)); }); document.getElementById('stop-series-btn').addEventListener('click', stopSeries); document.getElementById('start-tournament-btn').addEventListener('click', startTournament); document.getElementById('stop-tournament-btn').addEventListener('click', stopTournament); window.addEventListener('resize', () => { sizeCanvases(); drawWheel(); }); const mo = new MutationObserver(() => drawWheel()); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }); }
        init();
      })();
    <\/script>
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
