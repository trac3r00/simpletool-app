/**
 * Roulette Wheel - Modernized with 3D effects, new modes, and enhanced UX
 * Crypto-random, client-side roulette wheel.
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { getToolTranslation, resolveRequestLanguage, t } from '../utils/i18n.js';
import { getRouletteBootConfig } from '../games/roulette/config.js';
import { buildRouletteToolBadges } from '../games/roulette/render.js';
import {
  advanceRouletteSeries,
  createRouletteSessionState,
  pushRouletteTournamentWinner,
  ROULETTE_PHASES,
  startRouletteSeries,
  startRouletteTournament,
  stopRouletteSeries,
  stopRouletteTournament
} from '../games/roulette/runtime.js';

function renderRouletteWheelPage(lang = 'en') {
  const toolTranslation = getToolTranslation('roulette-wheel', lang);
  const rouletteBootConfig = getRouletteBootConfig();
  const toolHeader = createToolHeader(
    { emoji: '\ud83c\udfa1' },
    toolTranslation?.name || 'Roulette Wheel',
    toolTranslation?.desc || 'Spin the wheel for fair random picks with real-time statistics.',
    buildRouletteToolBadges(lang, t),
    { toolId: 'roulette-wheel' }
  );

  const styles = `
    <style>
      .rw-container { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; padding: 1rem; }
      .rw-wheel-wrapper { }
      .rw-wheel-stage { position: relative; width: min(560px, 90vw); height: min(560px, 90vw); max-width: 640px; max-height: 640px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.1), transparent 50%), radial-gradient(circle at 70% 70%, rgba(236, 72, 153, 0.08), transparent 50%); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset; transition: box-shadow 0.3s ease; }
      .dark .rw-wheel-stage { background: radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.15), transparent 50%), radial-gradient(circle at 70% 70%, rgba(236, 72, 153, 0.1), transparent 50%); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset; }
      .rw-wheel-stage.spinning { animation: rw-pulse-glow 2s ease-in-out infinite; }
      .rw-wheel-stage.neon-glow { box-shadow: 0 0 30px rgba(99, 102, 241, 0.5), 0 0 60px rgba(139, 92, 246, 0.3), 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset; }
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
      .rw-center-btn.timed-active { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); animation: rw-timed-pulse 1s ease-in-out infinite; }
      @keyframes rw-timed-pulse { 0%, 100% { box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.5); } 50% { box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.8), 0 0 15px rgba(239, 68, 68, 0.3); } }
      .rw-result-popup { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0); z-index: 40; background: white; border-radius: 1rem; padding: 1.5rem 2rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05); text-align: center; opacity: 0; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); min-width: 200px; }
      .dark .rw-result-popup { background: #1e293b; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05); }
      .rw-result-popup.show { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      @keyframes rw-bounce { 0% { transform: translate(-50%, -50%) scale(0); } 50% { transform: translate(-50%, -50%) scale(1.08); } 70% { transform: translate(-50%, -50%) scale(0.96); } 100% { transform: translate(-50%, -50%) scale(1); } }
      .rw-result-popup.bounce { animation: rw-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; opacity: 1; }
      .rw-result-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 0.5rem; }
      .dark .rw-result-label { color: #9ca3af; }
      .rw-result-text { font-size: 1.875rem; font-weight: 800; color: #111827; line-height: 1.2; }
      .dark .rw-result-text { color: #f9fafb; }
      .rw-controls { width: 100%; max-width: 640px; display: flex; flex-direction: column; gap: 1rem; }
      .rw-main-controls { display: flex; align-items: center; justify-content: center; gap: 0.75rem; flex-wrap: wrap; }
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
      .rw-segment-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; background: #f9fafb; border-radius: 0.5rem; cursor: grab; }
      .rw-segment-item.dragging { opacity: 0.5; cursor: grabbing; }
      .rw-segment-item.drag-over { border-top: 2px solid #6366f1; }
      .dark .rw-segment-item { background: #2d3748; }
      .rw-segment-color { width: 1.25rem; height: 1.25rem; border-radius: 50%; flex-shrink: 0; border: 2px solid white; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1); cursor: pointer; }
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
      .rw-import-export { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
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
      .rw-mode-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
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
      .rw-bracket-board { display: grid; gap: 0.75rem; margin-top: 1rem; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
      .rw-bracket-column { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 0.75rem; }
      .dark .rw-bracket-column { background: #2d3748; border-color: #4b5563; }
      .rw-bracket-heading { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; margin-bottom: 0.5rem; }
      .dark .rw-bracket-heading { color: #9ca3af; }
      .rw-bracket-entry { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.625rem; border-radius: 0.5rem; background: white; color: #111827; font-size: 0.875rem; margin-bottom: 0.5rem; }
      .dark .rw-bracket-entry { background: #1e293b; color: #f9fafb; }
      .rw-bracket-entry:last-child { margin-bottom: 0; }
      .rw-bracket-empty { font-size: 0.875rem; color: #6b7280; }
      .dark .rw-bracket-empty { color: #9ca3af; }
      .rw-bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 80px; margin-top: 0.75rem; padding: 0 0.25rem; }
      .rw-bar { flex: 1; min-width: 8px; border-radius: 3px 3px 0 0; transition: height 0.3s ease; position: relative; }
      .rw-bar:hover::after { content: attr(data-label); position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); font-size: 10px; white-space: nowrap; background: #1f2937; color: white; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px; }
      @keyframes rw-shake { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(-4px, 2px); } 20% { transform: translate(3px, -3px); } 30% { transform: translate(-3px, 2px); } 40% { transform: translate(2px, -1px); } 50% { transform: translate(-1px, 1px); } 60% { transform: translate(1px, -1px); } 70% { transform: translate(-1px, 0); } 80% { transform: translate(0, -1px); } 90% { transform: translate(1px, 0); } }
      .rw-shake { animation: rw-shake 500ms ease-out; }
      .rw-fullscreen { position: fixed !important; inset: 0 !important; z-index: 9999 !important; width: 100vw !important; height: 100vh !important; max-width: none !important; max-height: none !important; border-radius: 0 !important; background: white !important; display: flex !important; align-items: center !important; justify-content: center !important; }
      .dark .rw-fullscreen { background: #0f172a !important; }
      @media (prefers-reduced-motion: reduce) { .rw-wheel-stage.spinning { animation: none; } .rw-result-popup { transition: none; } .rw-result-popup.bounce { animation: none; } .rw-section-content { transition: none; } .rw-shake { animation: none; } .rw-freq-bar { transition: none; } .rw-section-chevron { transition: none; } }
      @media (max-width: 640px) { .rw-container { padding: 0.5rem; gap: 1rem; } .rw-center-btn { width: 80px; height: 80px; font-size: 0.875rem; } .rw-pointer { top: -8px; } .rw-pointer svg { width: 36px; height: 42px; } .rw-result-popup { padding: 1rem 1.25rem; min-width: 160px; } .rw-result-text { font-size: 1.25rem; } .rw-stats-grid { grid-template-columns: repeat(2, 1fr); } .rw-freq-label { width: 80px; } }
    </style>
  `;

  const content = `
    ${styles}
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}
        <div class="rw-container">
          <div class="rw-wheel-wrapper">
            <div class="rw-wheel-stage" id="wheel-stage" role="img" aria-label="Roulette wheel">
              <canvas id="wheel-canvas" class="rw-canvas"></canvas>
              <canvas id="confetti-canvas" class="rw-confetti-canvas"></canvas>
              <div class="rw-pointer">
                <svg viewBox="0 0 48 56" fill="none" aria-hidden="true">
                  <path d="M24 52c10.2 0 18.5-8.3 18.5-18.5V12c0-1.4-1.7-2.2-2.8-1.2L25.2 21c-.7.5-1.7.5-2.4 0L8.3 10.8c-1.1-1-2.8-.2-2.8 1.2v23.5C5.5 43.7 13.8 52 24 52Z" fill="#1f2937"/>
                  <path d="M24 47.4c7.7 0 13.9-6.2 13.9-13.9V17L27 24.8c-1.8 1.3-4.2 1.3-6 0L10.1 17v16.5c0 7.7 6.2 13.9 13.9 13.9Z" fill="#6366f1"/>
                </svg>
              </div>
              <button id="spin-button" class="rw-center-btn" data-i18n="tools.roulette-wheel.ui.spin-button">${t('tools.roulette-wheel.ui.spin-button', lang)}</button>
              <div id="result-popup" class="rw-result-popup result-announcement" role="alert" aria-live="polite">
                <div class="rw-result-label" data-i18n="tools.roulette-wheel.ui.result-label">${t('tools.roulette-wheel.ui.result-label', lang)}</div>
                <div id="result-text" class="rw-result-text"></div>
              </div>
            </div>
          </div>
          <div class="rw-controls">
            <div class="rw-main-controls">
              <label class="rw-sound-toggle">
                <input type="checkbox" id="sound-toggle">
                <span data-i18n="tools.roulette-wheel.ui.sound-toggle">${t('tools.roulette-wheel.ui.sound-toggle', lang)}</span>
              </label>
              <select id="sound-theme-select" class="rw-mode-input" style="width:auto;">
                ${rouletteBootConfig.soundThemes.map(st => `<option value="${st.id}">${st.fallbackLabel}</option>`).join('')}
              </select>
              <button id="clear-stats-btn" class="btn btn-ghost btn-sm" data-i18n="tools.roulette-wheel.ui.clear-stats">${t('tools.roulette-wheel.ui.clear-stats', lang)}</button>
              <button id="fullscreen-btn" class="btn btn-ghost btn-sm" data-i18n="tools.roulette-wheel.ui.fullscreen" title="${t('tools.roulette-wheel.ui.fullscreen', lang)}" aria-label="${t('tools.roulette-wheel.ui.fullscreen', lang)}">&#x26F6;</button>
              <button id="neon-toggle-btn" class="btn btn-ghost btn-sm" data-i18n="tools.roulette-wheel.ui.neonToggle" title="${t('tools.roulette-wheel.ui.neonToggle', lang)}" aria-label="${t('tools.roulette-wheel.ui.neonToggle', lang)}">&#x2728;</button>
            </div>
            <div class="rw-section open" id="segments-section" data-section-id="segments">
              <button class="rw-section-header" type="button" aria-expanded="true" data-section-toggle>
                <span class="rw-section-title">
                  <svg class="rw-section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                  <span data-i18n="tools.roulette-wheel.ui.segments-title">${t('tools.roulette-wheel.ui.segments-title', lang)}</span>
                </span>
                <svg class="rw-section-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div class="rw-section-content">
                <div class="rw-section-inner">
                  <div id="segments-list" class="rw-segments-list"></div>
                  <div class="rw-add-segment">
                    <input type="text" id="new-segment-input" class="rw-add-input" data-i18n-placeholder="tools.roulette-wheel.ui.add-placeholder" placeholder="Add new segment...">
                    <button id="add-segment-btn" class="btn btn-secondary btn-sm" data-i18n="tools.roulette-wheel.ui.add-button">${t('tools.roulette-wheel.ui.add-button', lang)}</button>
                  </div>
                  <div class="rw-import-export">
                    <button id="export-segments-btn" class="btn btn-ghost btn-sm" data-i18n="tools.roulette-wheel.ui.exportBtn">${t('tools.roulette-wheel.ui.exportBtn', lang)}</button>
                    <button id="import-segments-btn" class="btn btn-ghost btn-sm" data-i18n="tools.roulette-wheel.ui.importBtn">${t('tools.roulette-wheel.ui.importBtn', lang)}</button>
                    <input type="file" id="import-file-input" accept=".json,.csv,.txt" class="hidden">
                  </div>
                </div>
              </div>
            </div>
            <div class="rw-section" id="mode-section" data-section-id="mode">
              <button class="rw-section-header" type="button" aria-expanded="false" data-section-toggle>
                <span class="rw-section-title">
                  <svg class="rw-section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-2.21 0-4 .895-4 2s1.79 2 4 2 4 .895 4 2-1.79 2-4 2m0-10v12"/></svg>
                  <span data-i18n="tools.roulette-wheel.ui.modeTitle">${t('tools.roulette-wheel.ui.modeTitle', lang)}</span>
                </span>
                <svg class="rw-section-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div class="rw-section-content">
                <div class="rw-section-inner">
                  <div class="rw-mode-row">
                    <button id="mode-equal-btn" class="btn btn-secondary btn-sm" aria-pressed="true" data-i18n="tools.roulette-wheel.ui.modeEqual">${t('tools.roulette-wheel.ui.modeEqual', lang)}</button>
                    <button id="mode-weighted-btn" class="btn btn-secondary btn-sm" aria-pressed="false" data-i18n="tools.roulette-wheel.ui.modeWeighted">${t('tools.roulette-wheel.ui.modeWeighted', lang)}</button>
                    <button id="mode-progressive-btn" class="btn btn-secondary btn-sm" aria-pressed="false" data-i18n="tools.roulette-wheel.ui.modeProgressive">${t('tools.roulette-wheel.ui.modeProgressive', lang)}</button>
                    <button id="mode-timed-btn" class="btn btn-secondary btn-sm" aria-pressed="false" data-i18n="tools.roulette-wheel.ui.modeTimed">${t('tools.roulette-wheel.ui.modeTimed', lang)}</button>
                  </div>
                  <div id="mode-status" class="rw-mode-status">${t('tools.roulette-wheel.js.modeEqualActive', lang)}</div>
                  <p class="mt-2 text-sm text-surface-500 dark:text-surface-400" data-i18n="tools.roulette-wheel.ui.modeHint">${t('tools.roulette-wheel.ui.modeHint', lang)}</p>
                </div>
              </div>
            </div>
            <div class="rw-section" id="stats-section" data-section-id="stats">
              <button class="rw-section-header" type="button" aria-expanded="false" data-section-toggle>
                <span class="rw-section-title">
                  <svg class="rw-section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                  <span data-i18n="tools.roulette-wheel.ui.stats-title">${t('tools.roulette-wheel.ui.stats-title', lang)}</span>
                </span>
                <svg class="rw-section-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div class="rw-section-content">
                <div class="rw-section-inner">
                  <div class="rw-stats-grid">
                    <div class="rw-stat-card"><div id="stat-total" class="rw-stat-value">0</div><div class="rw-stat-label" data-i18n="tools.roulette-wheel.ui.stat-total">${t('tools.roulette-wheel.ui.stat-total', lang)}</div></div>
                    <div class="rw-stat-card"><div id="stat-fairness" class="rw-stat-value">\u2014</div><div class="rw-stat-label" data-i18n="tools.roulette-wheel.ui.stat-fairness">${t('tools.roulette-wheel.ui.stat-fairness', lang)}</div></div>
                  </div>
                  <div id="freq-chart" class="rw-freq-list"></div>
                  <div id="bar-chart" class="rw-bar-chart"></div>
                  <div style="margin-top: 1rem;">
                    <div class="text-sm font-semibold mb-2" data-i18n="tools.roulette-wheel.ui.history-title">${t('tools.roulette-wheel.ui.history-title', lang)}</div>
                    <div id="history-list" class="rw-history-list"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="rw-section" id="presets-section" data-section-id="presets">
              <button class="rw-section-header" type="button" aria-expanded="false" data-section-toggle>
                <span class="rw-section-title">
                  <svg class="rw-section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                  <span data-i18n="tools.roulette-wheel.ui.presets-title">${t('tools.roulette-wheel.ui.presets-title', lang)}</span>
                </span>
                <svg class="rw-section-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div class="rw-section-content">
                <div class="rw-section-inner">
                  <div class="rw-preset-row">
                    <input type="text" id="preset-name-input" class="rw-add-input" data-i18n-placeholder="tools.roulette-wheel.ui.preset-name-placeholder" placeholder="Preset name...">
                    <button id="save-preset-btn" class="btn btn-secondary btn-sm" data-i18n="tools.roulette-wheel.ui.save-preset">${t('tools.roulette-wheel.ui.save-preset', lang)}</button>
                  </div>
                  <div class="rw-preset-row">
                    <select id="preset-select" class="rw-preset-select">
                      <option value="" data-i18n="tools.roulette-wheel.ui.select-preset">${t('tools.roulette-wheel.ui.select-preset', lang)}</option>
                    </select>
                    <button id="load-preset-btn" class="btn btn-primary btn-sm" data-i18n="tools.roulette-wheel.ui.load-preset">${t('tools.roulette-wheel.ui.load-preset', lang)}</button>
                  </div>
                  <div id="preset-status" class="rw-mode-status" data-i18n="tools.roulette-wheel.ui.preset-status">${t('tools.roulette-wheel.ui.preset-status', lang)}</div>
                </div>
              </div>
            </div>
            <div class="rw-section" id="series-section" data-section-id="series">
              <button class="rw-section-header" type="button" aria-expanded="false" data-section-toggle>
                <span class="rw-section-title">
                  <svg class="rw-section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  <span data-i18n="tools.roulette-wheel.ui.series-title">${t('tools.roulette-wheel.ui.series-title', lang)}</span>
                </span>
                <svg class="rw-section-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div class="rw-section-content">
                <div class="rw-section-inner">
                  <div class="rw-mode-row">
                    <input type="number" id="series-count" class="rw-mode-input" value="10" min="1" max="50">
                    <button id="start-series-btn" class="btn btn-primary btn-sm" data-i18n="tools.roulette-wheel.ui.start-series">${t('tools.roulette-wheel.ui.start-series', lang)}</button>
                    <button id="stop-series-btn" class="btn btn-ghost btn-sm" disabled data-i18n="tools.roulette-wheel.ui.stop-series">${t('tools.roulette-wheel.ui.stop-series', lang)}</button>
                  </div>
                  <div id="series-status" class="rw-mode-status" data-i18n="tools.roulette-wheel.ui.series-status">${t('tools.roulette-wheel.ui.series-status', lang)}</div>
                </div>
              </div>
            </div>
            <div class="rw-section" id="tournament-section" data-section-id="tournament">
              <button class="rw-section-header" type="button" aria-expanded="false" data-section-toggle>
                <span class="rw-section-title">
                  <svg class="rw-section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                  <span data-i18n="tools.roulette-wheel.ui.tournament-title">${t('tools.roulette-wheel.ui.tournament-title', lang)}</span>
                </span>
                <svg class="rw-section-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div class="rw-section-content">
                <div class="rw-section-inner">
                  <div class="rw-mode-row">
                    <button id="start-tournament-btn" class="btn btn-primary btn-sm" data-i18n="tools.roulette-wheel.ui.start-tournament">${t('tools.roulette-wheel.ui.start-tournament', lang)}</button>
                    <button id="stop-tournament-btn" class="btn btn-ghost btn-sm" disabled data-i18n="tools.roulette-wheel.ui.stop-tournament">${t('tools.roulette-wheel.ui.stop-tournament', lang)}</button>
                  </div>
                  <div id="tournament-status" class="rw-mode-status" data-i18n="tools.roulette-wheel.ui.tournament-status">${t('tools.roulette-wheel.ui.tournament-status', lang)}</div>
                  <div id="tournament-bracket-board" class="rw-bracket-board">
                    <div class="rw-bracket-column">
                      <div class="rw-bracket-heading" data-i18n="tools.roulette-wheel.ui.bracketRemaining">${t('tools.roulette-wheel.ui.bracketRemaining', lang)}</div>
                      <div id="tournament-bracket-remaining" class="rw-bracket-empty" data-i18n="tools.roulette-wheel.js.bracketAwaiting">${t('tools.roulette-wheel.js.bracketAwaiting', lang)}</div>
                    </div>
                    <div class="rw-bracket-column">
                      <div class="rw-bracket-heading" data-i18n="tools.roulette-wheel.ui.bracketWinners">${t('tools.roulette-wheel.ui.bracketWinners', lang)}</div>
                      <div id="tournament-bracket-winners" class="rw-bracket-empty" data-i18n="tools.roulette-wheel.js.bracketAwaiting">${t('tools.roulette-wheel.js.bracketAwaiting', lang)}</div>
                    </div>
                  </div>
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
        var _t = (typeof window._t === 'function') ? window._t : function(k, fb) { return fb; };
        var rouletteBootConfig = ${JSON.stringify(rouletteBootConfig)};
        var ROULETTE_PHASES = ${JSON.stringify(ROULETTE_PHASES)};
        var startRouletteSeries = ${startRouletteSeries.toString()};
        var advanceRouletteSeries = ${advanceRouletteSeries.toString()};
        var stopRouletteSeries = ${stopRouletteSeries.toString()};
        var startRouletteTournament = ${startRouletteTournament.toString()};
        var pushRouletteTournamentWinner = ${pushRouletteTournamentWinner.toString()};
        var stopRouletteTournament = ${stopRouletteTournament.toString()};
        var GU = window.GameUtils;
        var cryptoUint32 = GU.cryptoUint32, randInt = GU.randInt, randFloat = GU.randFloat, clamp = GU.clamp, escapeHtml = GU.escapeHtml, ensureAudioCtx = GU.ensureAudioCtx, playBeep = GU.playBeep, spawnConfetti = GU.spawnConfetti, tickConfetti = GU.tickConfetti, drawConfettiParticles = GU.drawConfettiParticles;
        var COLOR_PALETTE = rouletteBootConfig.colorPalette;
        var MIN_SEGMENTS = rouletteBootConfig.minSegments, MAX_SEGMENTS = rouletteBootConfig.maxSegments, PRESET_KEY = rouletteBootConfig.storageKey;
        var BUILT_IN_PRESETS = Array.isArray(rouletteBootConfig.presets) ? rouletteBootConfig.presets : [];
        var SECTION_META = Array.isArray(rouletteBootConfig.sections) ? rouletteBootConfig.sections : [];
        var MODE_META = Array.isArray(rouletteBootConfig.modes) ? rouletteBootConfig.modes : [];
        var SOUND_THEMES = Array.isArray(rouletteBootConfig.soundThemes) ? rouletteBootConfig.soundThemes : [];
        var state = ${JSON.stringify(createRouletteSessionState(rouletteBootConfig))};
        state.soundThemeId = rouletteBootConfig.defaultSoundTheme || 'casino';
        state.neonGlow = false;
        state.isFullscreen = false;
        state.progressiveCounts = {};
        state.timedSpinning = false;
        var elWheelStage = document.getElementById('wheel-stage'), elWheelCanvas = document.getElementById('wheel-canvas'), elConfettiCanvas = document.getElementById('confetti-canvas'), elSpinBtn = document.getElementById('spin-button'), elResultPopup = document.getElementById('result-popup'), elResultText = document.getElementById('result-text'), elSoundToggle = document.getElementById('sound-toggle'), wheelCtx = elWheelCanvas.getContext('2d'), confettiCtx = elConfettiCanvas.getContext('2d');

        function randomId() { var b = new Uint8Array(8); crypto.getRandomValues(b); return Array.from(b, function(x) { return x.toString(16).padStart(2, '0'); }).join(''); }
        function normalizeAngle(a) { var tau = Math.PI * 2; var x = a % tau; if (x < 0) x += tau; return x; }
        function mixColor(hexA, hexB, t) { var parse = function(hex) { var h = String(hex || '').trim().replace('#', ''); var full = h.length === 3 ? h.split('').map(function(c) { return c + c; }).join('') : h.padEnd(6, '0').slice(0, 6); var n = parseInt(full, 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; }; var a = parse(hexA), b = parse(hexB), tt = clamp(t, 0, 1); return '#' + [Math.round(a.r + (b.r - a.r) * tt), Math.round(a.g + (b.g - a.g) * tt), Math.round(a.b + (b.b - a.b) * tt)].map(function(x) { return x.toString(16).padStart(2, '0'); }).join(''); }
        function nowIsoShort() { var d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0'); }
        function getSoundTheme() { return SOUND_THEMES.find(function(st) { return st.id === state.soundThemeId; }) || SOUND_THEMES[0] || {}; }

        function sizeCanvases() { var rect = elWheelStage.getBoundingClientRect(); var cssSize = Math.max(10, Math.floor(Math.min(rect.width, rect.height))); var dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); state.canvasSize = cssSize; state.dpr = dpr; elWheelCanvas.width = Math.max(1, Math.round(cssSize * dpr)); elWheelCanvas.height = Math.max(1, Math.round(cssSize * dpr)); elConfettiCanvas.width = Math.max(1, Math.round(cssSize * dpr)); elConfettiCanvas.height = Math.max(1, Math.round(cssSize * dpr)); wheelCtx.setTransform(dpr, 0, 0, dpr, 0, 0); confettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0); }
        function fitLabel(label, maxChars) { var s = String(label || '').trim(); if (!s) return ''; if (s.length <= maxChars) return s; return s.slice(0, Math.max(1, maxChars - 1)).trimEnd() + '\u2026'; }

        function drawWheel() { var size = state.canvasSize; if (!size) return; var ctx = wheelCtx, n = state.segments.length, cx = size / 2, cy = size / 2, radius = Math.max(10, size * 0.46); ctx.clearRect(0, 0, size, size); ctx.save(); ctx.translate(cx, cy); ctx.shadowColor = document.documentElement.classList.contains('dark') ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12; ctx.beginPath(); ctx.arc(0, 0, radius + 4, 0, Math.PI * 2); ctx.fillStyle = 'transparent'; ctx.fill(); ctx.restore(); if (n < 1) return; var anglePer = (Math.PI * 2) / n, baseStart = -Math.PI / 2, rot = state.rotation; ctx.save(); ctx.translate(cx, cy); for (var i = 0; i < n; i++) { var seg = state.segments[i], start = baseStart + rot + i * anglePer, end = start + anglePer; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, radius, start, end); ctx.closePath(); var base = seg.color, c1 = mixColor(base, '#ffffff', 0.15), c2 = mixColor(base, '#000000', 0.15), grad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius); grad.addColorStop(0, c1); grad.addColorStop(1, c2); ctx.fillStyle = grad; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = document.documentElement.classList.contains('dark') ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)'; ctx.stroke(); if (state.winnerIndex === i && !state.spinning && !state.timedSpinning) { ctx.save(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 20; ctx.shadowColor = seg.color; ctx.stroke(); ctx.restore(); } } ctx.restore(); ctx.save(); ctx.translate(cx, cy); ctx.lineWidth = 1; ctx.strokeStyle = document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'; for (var i = 0; i < n; i++) { var a = baseStart + rot + i * anglePer; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius); ctx.stroke(); } ctx.restore(); ctx.save(); ctx.translate(cx, cy); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 4; for (var i = 0; i < n; i++) { var seg = state.segments[i], label = fitLabel(seg.label || ('Option ' + (i + 1)), n > 12 ? 10 : 14); if (!label) continue; var mid = baseStart + rot + (i + 0.5) * anglePer, textRadius = radius * 0.65; ctx.save(); ctx.rotate(mid); ctx.translate(textRadius, 0); var ang = normalizeAngle(mid); if (ang > Math.PI / 2 && ang < (Math.PI * 3) / 2) ctx.rotate(Math.PI); var fontSize = clamp(Math.round(radius * 0.09), 10, 16); ctx.font = '700 ' + fontSize + 'px ui-sans-serif, system-ui, -apple-system, sans-serif'; ctx.fillText(label, 0, 0); ctx.restore(); } ctx.restore(); ctx.save(); ctx.translate(cx, cy); var capR = radius * 0.18, capGrad = ctx.createRadialGradient(0, 0, capR * 0.2, 0, 0, capR); capGrad.addColorStop(0, document.documentElement.classList.contains('dark') ? '#374151' : '#f3f4f6'); capGrad.addColorStop(1, document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff'); ctx.beginPath(); ctx.arc(0, 0, capR, 0, Math.PI * 2); ctx.fillStyle = capGrad; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#4b5563' : '#e5e7eb'; ctx.stroke(); ctx.restore(); }

        function spawnConfettiBurst() { var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; if (prefersReducedMotion) return; var size = state.canvasSize; if (!size) return; var cx = size / 2, cy = size / 2, colors = COLOR_PALETTE.slice(0, 6).concat(['#fbbf24', '#f472b6']); spawnConfetti(state.confetti, cx, cy, 120, colors, 1); var last = performance.now(), endAt = last + 3000; function tick(now) { var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now; tickConfetti(state.confetti, dt, size); confettiCtx.clearRect(0, 0, size, size); drawConfettiParticles(confettiCtx, state.confetti); if (now < endAt && state.confetti.length > 0) state.confettiRaf = requestAnimationFrame(tick); else { confettiCtx.clearRect(0, 0, size, size); state.confetti = []; } } if (state.confettiRaf) cancelAnimationFrame(state.confettiRaf); state.confettiRaf = requestAnimationFrame(tick); }

        function playTick() { if (!state.audio.enabled) return; ensureAudioCtx(state.audio); if (!state.audio.ctx) return; var st = getSoundTheme(); playBeep(state.audio, st.tickFreq[0] + randInt(st.tickFreq[1]), st.tickDur, st.tickGain); }
        function playWin() { if (!state.audio.enabled) return; ensureAudioCtx(state.audio); if (!state.audio.ctx) return; var st = getSoundTheme(); st.winNotes.forEach(function(freq, i) { setTimeout(function() { playBeep(state.audio, freq, st.winDur, st.winGain); }, i * st.winDelay); }); }

        function dramaticEase(t) { var x = clamp(t, 0, 1); if (x < 0.1) return (x / 0.1) * (x / 0.1) * 0.05; if (x < 0.65) return 0.05 + ((x - 0.1) / 0.55) * 0.65; if (x < 0.9) { var p = (x - 0.65) / 0.25; return 0.7 + (1 - Math.pow(1 - p, 3)) * 0.22; } if (x < 0.98) { var p = (x - 0.9) / 0.08; return 0.92 + (1 - Math.pow(1 - p, 4)) * 0.06; } var p = (x - 0.98) / 0.02; return 0.98 + p * 0.02 + Math.sin(p * Math.PI) * 0.01 * (1 - p); }

        function screenShake() { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; elWheelStage.classList.remove('rw-shake'); void elWheelStage.offsetHeight; elWheelStage.classList.add('rw-shake'); setTimeout(function() { elWheelStage.classList.remove('rw-shake'); }, 500); }

        function computeTargetRotationForIndex(index, extraSpins) { var n = state.segments.length, anglePer = (Math.PI * 2) / Math.max(1, n), desiredMod = normalizeAngle(-(index + 0.5) * anglePer), currentMod = normalizeAngle(state.rotation); var delta = desiredMod - currentMod; if (delta < 0) delta += Math.PI * 2; return state.rotation + (extraSpins * Math.PI * 2) + delta; }
        function getIndexAtRotation(rot) { var n = state.segments.length; if (n <= 0) return 0; var anglePer = (Math.PI * 2) / n, baseStart = -Math.PI / 2, pointerAngle = -Math.PI / 2, local = normalizeAngle(pointerAngle - rot - baseStart); return clamp(Math.floor(local / anglePer), 0, n - 1); }
        function segmentWeight(seg) { var raw = Number(seg && seg.weight); return Number.isFinite(raw) && raw > 0 ? raw : 0; }

        // Progressive mode: reduce weight of recent winners
        function pickWinnerIndex() {
          var n = state.segments.length;
          if (n === 0) return 0;
          if (state.selectionMode === 'progressive') {
            var weights = state.segments.map(function(seg) {
              var base = Math.max(1, segmentWeight(seg));
              var recentWins = state.progressiveCounts[seg.id] || 0;
              return Math.max(0.1, base * Math.pow(0.5, recentWins));
            });
            var total = weights.reduce(function(s, w) { return s + w; }, 0);
            if (total <= 0) return randInt(n);
            var cursor = randFloat() * total;
            for (var i = 0; i < n; i++) { cursor -= weights[i]; if (cursor <= 0) return i; }
            return n - 1;
          }
          if (state.selectionMode === 'weighted') {
            var total = state.segments.reduce(function(sum, seg) { return sum + segmentWeight(seg); }, 0);
            if (total <= 0) return randInt(n);
            var cursor = randFloat() * total;
            for (var i = 0; i < n; i++) { cursor -= segmentWeight(state.segments[i]); if (cursor <= 0) return i; }
            return n - 1;
          }
          return randInt(n);
        }

        // Timed mode: continuous spinning, click to freeze
        function startTimedSpin() {
          if (state.segments.length < MIN_SEGMENTS) return;
          state.timedSpinning = true;
          state.spinning = true;
          elSpinBtn.classList.add('timed-active');
          elSpinBtn.textContent = window._t ? window._t('tools.roulette-wheel.ui.btnStop', 'STOP') : 'STOP';
          elWheelStage.classList.add('spinning');
          elResultPopup.classList.remove('show', 'bounce');
          var speed = 0.08;
          function tick() {
            if (!state.timedSpinning) return;
            state.rotation += speed;
            drawWheel();
            if (state.audio.enabled) {
              var idx = getIndexAtRotation(state.rotation);
              if (state._lastTimedIdx !== undefined && idx !== state._lastTimedIdx) playTick();
              state._lastTimedIdx = idx;
            }
            state.spinRaf = requestAnimationFrame(tick);
          }
          if (state.spinRaf) cancelAnimationFrame(state.spinRaf);
          state.spinRaf = requestAnimationFrame(tick);
        }

        function stopTimedSpin() {
          state.timedSpinning = false;
          state.spinning = false;
          elSpinBtn.classList.remove('timed-active');
          elSpinBtn.textContent = window._t ? window._t('tools.roulette-wheel.ui.btnSpin', 'SPIN') : 'SPIN';
          elWheelStage.classList.remove('spinning');
          if (state.spinRaf) cancelAnimationFrame(state.spinRaf);
          var winnerIndex = getIndexAtRotation(state.rotation);
          state.winnerIndex = winnerIndex;
          screenShake();
          showResult(winnerIndex);
          spawnConfettiBurst();
          playWin();
          drawWheel();
        }

        function spin() {
          if (state.selectionMode === 'timed') {
            if (state.timedSpinning) { stopTimedSpin(); return; }
            startTimedSpin();
            return;
          }
          if (state.spinning) return;
          if (state.segments.length < MIN_SEGMENTS) return;
          var winnerIndex = pickWinnerIndex();
          state.winnerIndex = winnerIndex;
          state.spinning = true;
          state.phase = 'spinning';
          elSpinBtn.disabled = true;
          elWheelStage.classList.add('spinning');
          elResultPopup.classList.remove('show', 'bounce');
          var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          var durationMs = prefersReducedMotion ? 800 : 5500 + randInt(1500);
          var extraSpins = prefersReducedMotion ? 1 : 5 + randInt(3);
          var startRot = state.rotation, endRot = computeTargetRotationForIndex(winnerIndex, extraSpins), startedAt = performance.now();
          var lastTickIndex = null;
          function tick(now) {
            var elapsed = now - startedAt, t = clamp(elapsed / durationMs, 0, 1), eased = dramaticEase(t);
            state.rotation = startRot + (endRot - startRot) * eased;
            if (state.audio.enabled && !prefersReducedMotion) {
              var currentIndex = getIndexAtRotation(state.rotation);
              if (lastTickIndex !== null && currentIndex !== lastTickIndex) playTick();
              lastTickIndex = currentIndex;
            }
            drawWheel();
            if (t < 1) state.spinRaf = requestAnimationFrame(tick);
            else {
              state.rotation = endRot;
              state.spinning = false;
              state.phase = 'roundResult';
              elSpinBtn.disabled = false;
              elWheelStage.classList.remove('spinning');
              screenShake();
              showResult(winnerIndex);
              spawnConfettiBurst();
              playWin();
              if (state.series.active) handleSeriesComplete(winnerIndex);
              else if (state.tournament.active) handleTournamentComplete(winnerIndex);
            }
          }
          if (state.spinRaf) cancelAnimationFrame(state.spinRaf);
          state.spinRaf = requestAnimationFrame(tick);
        }

        function showResult(index) {
          var seg = state.segments[index];
          if (!seg) return;
          state.stats.total++;
          state.stats.counts[seg.id] = (state.stats.counts[seg.id] || 0) + 1;
          state.stats.history.unshift({ id: seg.id, label: seg.label, color: seg.color, time: nowIsoShort() });
          if (state.stats.history.length > 50) state.stats.history.pop();
          if (state.selectionMode === 'progressive') {
            state.progressiveCounts[seg.id] = (state.progressiveCounts[seg.id] || 0) + 1;
          }
          updateStatsUI();
          elResultText.textContent = seg.label || ('Option ' + (index + 1));
          elResultPopup.classList.remove('show', 'bounce');
          void elResultPopup.offsetHeight;
          elResultPopup.classList.add('bounce', 'show');
          setTimeout(function() { elResultPopup.classList.remove('bounce'); }, 500);
          setTimeout(function() { elResultPopup.classList.remove('show'); }, 3500);
        }

        function updateStatsUI() {
          document.getElementById('stat-total').textContent = state.stats.total;
          var n = state.segments.length, total = state.stats.total, fairnessEl = document.getElementById('stat-fairness');
          if (total < 10 || n < 2) fairnessEl.textContent = '\u2014';
          else {
            var maxDev = 0, totalWeight = state.segments.reduce(function(sum, seg) { return sum + segmentWeight(seg); }, 0);
            for (var i = 0; i < state.segments.length; i++) {
              var seg = state.segments[i], count = state.stats.counts[seg.id] || 0, actual = (count / total) * 100;
              var expected = state.selectionMode === 'weighted' && totalWeight > 0 ? (segmentWeight(seg) / totalWeight) * 100 : (100 / n);
              maxDev = Math.max(maxDev, Math.abs(actual - expected));
            }
            if (maxDev < 5) fairnessEl.textContent = _t('tools.roulette-wheel.js.fairnessGood', 'Good');
            else if (maxDev < 10) fairnessEl.textContent = _t('tools.roulette-wheel.js.fairnessFair', 'Fair');
            else fairnessEl.textContent = _t('tools.roulette-wheel.js.fairnessUneven', 'Uneven');
          }
          // Frequency bars
          var freqChart = document.getElementById('freq-chart');
          if (n === 0) freqChart.innerHTML = '<div class="text-sm text-surface-500">' + _t('tools.roulette-wheel.js.noSegments', 'No segments') + '</div>';
          else {
            var maxCount = Math.max(1, Math.max.apply(null, state.segments.map(function(s) { return state.stats.counts[s.id] || 0; })));
            freqChart.innerHTML = state.segments.map(function(seg, i) {
              var count = state.stats.counts[seg.id] || 0, pct = maxCount > 0 ? (count / maxCount) * 100 : 0, label = fitLabel(seg.label || ('Option ' + (i + 1)), 12);
              var meta = state.selectionMode === 'weighted' ? ' <span class="text-[10px] text-surface-400">w:' + segmentWeight(seg) + '</span>' : '';
              return '<div class="rw-freq-item"><div class="rw-freq-label">' + escapeHtml(label) + meta + '</div><div class="rw-freq-bar-wrap"><div class="rw-freq-bar" style="width:' + pct.toFixed(1) + '%;background:' + seg.color + '"></div></div><div class="rw-freq-count">' + count + '</div></div>';
            }).join('');
          }
          // Bar chart
          var barChart = document.getElementById('bar-chart');
          if (n > 0 && total > 0) {
            var maxC = Math.max(1, Math.max.apply(null, state.segments.map(function(s) { return state.stats.counts[s.id] || 0; })));
            barChart.innerHTML = state.segments.map(function(seg) {
              var c = state.stats.counts[seg.id] || 0, h = Math.max(2, (c / maxC) * 100);
              return '<div class="rw-bar" style="height:' + h + '%;background:' + seg.color + '" data-label="' + escapeHtml(seg.label) + ': ' + c + '"></div>';
            }).join('');
          } else { barChart.innerHTML = ''; }
          // History
          var historyList = document.getElementById('history-list');
          if (state.stats.history.length === 0) historyList.innerHTML = '<div class="text-sm text-surface-500 p-2">' + _t('tools.roulette-wheel.js.noSpinsYet', 'No spins yet') + '</div>';
          else historyList.innerHTML = state.stats.history.slice(0, 10).map(function(h) { return '<div class="rw-history-item"><div class="rw-history-color" style="background:' + h.color + '"></div><div class="rw-history-name">' + escapeHtml(h.label || 'Unknown') + '</div><div class="rw-history-time">' + h.time + '</div></div>'; }).join('');
        }

        function renderSegments() {
          var list = document.getElementById('segments-list'), n = state.segments.length, weightLabel = _t('tools.roulette-wheel.ui.weightLabel', 'Weight');
          list.innerHTML = state.segments.map(function(seg, i) {
            var canDelete = n > MIN_SEGMENTS;
            return '<div class="rw-segment-item" draggable="true" data-seg-id="' + seg.id + '"><input type="color" class="rw-segment-color" value="' + seg.color + '" style="background:' + seg.color + '" title="Pick color" aria-label="Pick color"><input type="text" class="rw-segment-input" value="' + escapeHtml(seg.label || '') + '" placeholder="' + (_t ? _t('tools.roulette-wheel.ui.ph0', 'Segment name') : 'Segment name') + '"><label class="text-[11px] text-surface-500 dark:text-surface-400">' + escapeHtml(weightLabel) + '<input type="number" class="rw-mode-input rw-segment-weight ml-2" min="0" max="100" step="1" value="' + Math.max(0, Number(seg.weight || 1)) + '"></label><button class="rw-segment-delete" ' + (canDelete ? '' : 'disabled') + ' aria-label="Delete segment"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button></div>';
          }).join('');
        }

        function addSegment(label) { if (state.segments.length >= MAX_SEGMENTS) return false; var i = state.segments.length; state.segments.push({ id: randomId(), label: label || ('Option ' + (i + 1)), color: COLOR_PALETTE[i % COLOR_PALETTE.length], weight: 1 }); renderSegments(); drawWheel(); return true; }
        function removeSegment(id) { if (state.segments.length <= MIN_SEGMENTS) return false; state.segments = state.segments.filter(function(s) { return s.id !== id; }); renderSegments(); drawWheel(); updateStatsUI(); return true; }
        function updateSegmentLabel(id, label) { var seg = state.segments.find(function(s) { return s.id === id; }); if (seg) { seg.label = label; drawWheel(); updateStatsUI(); } }
        function updateSegmentWeight(id, weight) { var seg = state.segments.find(function(s) { return s.id === id; }); if (seg) { var next = Number(weight); seg.weight = Number.isFinite(next) ? Math.max(0, Math.round(next)) : 0; updateStatsUI(); } }
        function updateSegmentColor(id, color) { var seg = state.segments.find(function(s) { return s.id === id; }); if (seg) { seg.color = color; renderSegments(); drawWheel(); } }
        function materializeSegment(segment, index) { return { id: segment.id || randomId(), label: segment.labelKey && window._t ? window._t(segment.labelKey, segment.fallbackLabel || ('Option ' + (index + 1))) : (segment.label || segment.fallbackLabel || ('Option ' + (index + 1))), color: segment.color || COLOR_PALETTE[index % COLOR_PALETTE.length], weight: Math.max(0, Number(segment.weight || 1)) }; }

        // Drag and drop reorder
        var dragSrcId = null;
        function handleDragStart(e) { var item = e.target.closest('.rw-segment-item'); if (!item) return; dragSrcId = item.dataset.segId; item.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; }
        function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; var item = e.target.closest('.rw-segment-item'); if (item) item.classList.add('drag-over'); }
        function handleDragLeave(e) { var item = e.target.closest('.rw-segment-item'); if (item) item.classList.remove('drag-over'); }
        function handleDrop(e) { e.preventDefault(); var item = e.target.closest('.rw-segment-item'); if (!item || !dragSrcId) return; item.classList.remove('drag-over'); var targetId = item.dataset.segId; if (dragSrcId === targetId) return; var srcIdx = state.segments.findIndex(function(s) { return s.id === dragSrcId; }); var tgtIdx = state.segments.findIndex(function(s) { return s.id === targetId; }); if (srcIdx < 0 || tgtIdx < 0) return; var moved = state.segments.splice(srcIdx, 1)[0]; state.segments.splice(tgtIdx, 0, moved); renderSegments(); drawWheel(); }
        function handleDragEnd() { dragSrcId = null; document.querySelectorAll('.rw-segment-item').forEach(function(el) { el.classList.remove('dragging', 'drag-over'); }); }

        // Import/Export
        function exportSegments() {
          var data = JSON.stringify(state.segments.map(function(s) { return { label: s.label, color: s.color, weight: s.weight }; }), null, 2);
          var blob = new Blob([data], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a'); a.href = url; a.download = 'roulette-segments.json'; a.click();
          URL.revokeObjectURL(url);
        }
        function importSegments(file) {
          var reader = new FileReader();
          reader.onload = function(e) {
            try {
              var text = e.target.result;
              var segments;
              if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
                segments = text.split(/[\\n,]/).map(function(s) { return s.trim(); }).filter(Boolean).map(function(label, i) { return { label: label, color: COLOR_PALETTE[i % COLOR_PALETTE.length], weight: 1 }; });
              } else {
                segments = JSON.parse(text);
              }
              if (!Array.isArray(segments) || segments.length < 2) return;
              state.segments = segments.slice(0, MAX_SEGMENTS).map(function(s, i) { return { id: randomId(), label: s.label || s.name || ('Option ' + (i+1)), color: s.color || COLOR_PALETTE[i % COLOR_PALETTE.length], weight: Math.max(0, Number(s.weight || 1)) }; });
              state.stats = { total: 0, counts: {}, history: [] };
              state.rotation = 0;
              renderSegments(); drawWheel(); updateStatsUI();
            } catch (err) { /* ignore parse errors */ }
          };
          reader.readAsText(file);
        }

        // Presets
        function getBuiltInPresetOption(id) { return BUILT_IN_PRESETS.find(function(preset) { return preset.id === id; }) || null; }
        function applySeriesState(nextState) { state.phase = nextState.phase; state.series = nextState.series; }
        function applyTournamentState(nextState) { state.phase = nextState.phase; state.tournament = nextState.tournament; }

        function setSelectionMode(mode) {
          state.selectionMode = (mode === 'weighted' || mode === 'progressive' || mode === 'timed') ? mode : 'equal';
          if (state.timedSpinning && mode !== 'timed') stopTimedSpin();
          ['equal', 'weighted', 'progressive', 'timed'].forEach(function(m) {
            var btn = document.getElementById('mode-' + m + '-btn');
            if (btn) btn.setAttribute('aria-pressed', String(state.selectionMode === m));
          });
          var meta = MODE_META.find(function(item) { return item.id === state.selectionMode; });
          var fallback = state.selectionMode === 'weighted' ? 'Weighted mode active' : state.selectionMode === 'progressive' ? 'Progressive mode active' : state.selectionMode === 'timed' ? 'Timed mode active' : 'Equal mode active';
          document.getElementById('mode-status').textContent = meta && meta.statusKey ? _t(meta.statusKey, fallback) : fallback;
          if (state.selectionMode === 'progressive') state.progressiveCounts = {};
          updateStatsUI();
        }

        function readPresets() { try { var raw = localStorage.getItem(PRESET_KEY); if (!raw) return []; var parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; if (parsed && Array.isArray(parsed.presets)) return parsed.presets; return []; } catch (e) { return []; } }
        function writePresets(presets) { try { localStorage.setItem(PRESET_KEY, JSON.stringify({ version: 1, presets: presets })); return true; } catch (e) { return false; } }
        function renderPresetSelect() { var presets = readPresets(), select = document.getElementById('preset-select'), current = select.value; var builtIns = BUILT_IN_PRESETS.map(function(preset) { var label = _t(preset.labelKey, preset.fallbackLabel || preset.id); return '<option value="builtin:' + escapeHtml(preset.id) + '">' + escapeHtml(label) + '</option>'; }).join(''); var custom = presets.map(function(p) { return '<option value="custom:' + escapeHtml(p.name) + '">' + escapeHtml(p.name) + '</option>'; }).join(''); select.innerHTML = '<option value="">' + _t('tools.roulette-wheel.ui.select-preset', 'Select a preset...') + '</option>' + builtIns + custom; if (current) select.value = current; }
        function savePreset(name) { if (!name.trim()) return; var presets = readPresets().filter(function(p) { return p.name !== name; }); presets.unshift({ name: name.trim(), savedAt: Date.now(), segments: state.segments.map(function(s) { return { id: s.id, label: s.label, color: s.color, weight: s.weight }; }) }); if (writePresets(presets.slice(0, 50))) { renderPresetSelect(); document.getElementById('preset-select').value = 'custom:' + name.trim(); document.getElementById('preset-status').textContent = _t('tools.roulette-wheel.ui.preset-saved', 'Saved: {name}').replace('{name}', name.trim()); } }
        function loadPreset(value) { var isBuiltIn = String(value || '').startsWith('builtin:'), rawName = String(value || '').replace(/^builtin:|^custom:/, ''); var preset = isBuiltIn ? getBuiltInPresetOption(rawName) : readPresets().find(function(item) { return item.name === rawName; }); if (!preset || !Array.isArray(preset.segments)) return false; state.segments = preset.segments.slice(0, MAX_SEGMENTS).map(function(segment, i) { return materializeSegment(segment, i); }); state.stats = { total: 0, counts: {}, history: [] }; state.rotation = 0; setSelectionMode(preset.defaultMode || rouletteBootConfig.defaultSelectionMode); renderSegments(); drawWheel(); updateStatsUI(); var label = isBuiltIn ? _t(preset.labelKey, preset.fallbackLabel || rawName) : rawName; document.getElementById('preset-status').textContent = _t('tools.roulette-wheel.ui.preset-loaded', 'Loaded: {name}').replace('{name}', label); return true; }

        function startSeries(count) { if (state.spinning || state.series.active) return; if (state.segments.length < MIN_SEGMENTS) return; applySeriesState(startRouletteSeries(state, count)); document.getElementById('start-series-btn').disabled = true; document.getElementById('stop-series-btn').disabled = false; updateSeriesStatus(); spin(); }
        function stopSeries() { applySeriesState(stopRouletteSeries(state)); document.getElementById('start-series-btn').disabled = false; document.getElementById('stop-series-btn').disabled = true; document.getElementById('series-status').textContent = _t('tools.roulette-wheel.ui.series-stopped', 'Series stopped'); }
        function handleSeriesComplete(winnerIndex) { applySeriesState(advanceRouletteSeries(state)); updateSeriesStatus(); if (state.series.active && state.series.remaining > 0) setTimeout(function() { spin(); }, 500); else { document.getElementById('start-series-btn').disabled = false; document.getElementById('stop-series-btn').disabled = true; document.getElementById('series-status').textContent = _t('tools.roulette-wheel.ui.series-complete', 'Series complete!'); } }
        function updateSeriesStatus() { var played = state.series.total - state.series.remaining; document.getElementById('series-status').textContent = _t('tools.roulette-wheel.ui.series-progress', 'Spin {played} of {total}').replace('{played}', played).replace('{total}', state.series.total); }

        function renderTournamentBracket() { var remainingEl = document.getElementById('tournament-bracket-remaining'), winnersEl = document.getElementById('tournament-bracket-winners'); var emptyText = _t('tools.roulette-wheel.js.bracketAwaiting', 'Start a tournament to populate the bracket.'); if (state.segments.length === 0) remainingEl.innerHTML = '<div class="rw-bracket-empty">' + emptyText + '</div>'; else remainingEl.innerHTML = state.segments.map(function(seg) { return '<div class="rw-bracket-entry"><div class="rw-ranking-color" style="background:' + seg.color + '"></div><div>' + escapeHtml(seg.label || 'Unknown') + '</div></div>'; }).join(''); if (state.tournament.ranking.length === 0) winnersEl.innerHTML = '<div class="rw-bracket-empty">' + emptyText + '</div>'; else winnersEl.innerHTML = state.tournament.ranking.map(function(seg, i) { return '<div class="rw-bracket-entry"><div class="rw-ranking-rank">' + (i + 1) + '</div><div>' + escapeHtml(seg.label || 'Unknown') + '</div></div>'; }).join(''); }
        function startTournament() { if (state.spinning || state.tournament.active) return; if (state.segments.length < 2) return; applyTournamentState(startRouletteTournament(state, state.segments)); document.getElementById('start-tournament-btn').disabled = true; document.getElementById('stop-tournament-btn').disabled = false; document.getElementById('tournament-ranking').innerHTML = ''; renderTournamentBracket(); document.getElementById('tournament-status').textContent = _t('tools.roulette-wheel.ui.tournament-running', 'Tournament running...'); spin(); }
        function stopTournament() { applyTournamentState(stopRouletteTournament(state)); if (Array.isArray(state.tournament.originalSegments) && state.tournament.originalSegments.length) { state.segments = state.tournament.originalSegments.map(function(segment) { return { id: segment.id, label: segment.label, color: segment.color, weight: segment.weight }; }); renderSegments(); drawWheel(); } renderTournamentBracket(); document.getElementById('start-tournament-btn').disabled = false; document.getElementById('stop-tournament-btn').disabled = true; document.getElementById('tournament-status').textContent = _t('tools.roulette-wheel.ui.tournament-stopped', 'Tournament stopped'); }
        function handleTournamentComplete(winnerIndex) { var winner = state.segments[winnerIndex]; var remainingSegments = state.segments.filter(function(_, i) { return i !== winnerIndex; }); applyTournamentState(pushRouletteTournamentWinner(state, winner, remainingSegments)); state.segments = remainingSegments; renderSegments(); drawWheel(); renderTournamentRanking(); if (state.segments.length > 0 && state.tournament.active) setTimeout(function() { spin(); }, 800); else { if (Array.isArray(state.tournament.originalSegments) && state.tournament.originalSegments.length) { state.segments = state.tournament.originalSegments.map(function(segment) { return { id: segment.id, label: segment.label, color: segment.color, weight: segment.weight }; }); renderSegments(); drawWheel(); } renderTournamentBracket(); document.getElementById('start-tournament-btn').disabled = false; document.getElementById('stop-tournament-btn').disabled = true; document.getElementById('tournament-status').textContent = _t('tools.roulette-wheel.ui.tournament-complete', 'Tournament complete!'); } }
        function renderTournamentRanking() { var container = document.getElementById('tournament-ranking'); container.innerHTML = state.tournament.ranking.map(function(seg, i) { return '<div class="rw-ranking-item"><div class="rw-ranking-rank">' + (i + 1) + '</div><div class="rw-ranking-color" style="background:' + seg.color + '"></div><div class="rw-ranking-name">' + escapeHtml(seg.label || ('Option ' + (i + 1))) + '</div></div>'; }).join(''); renderTournamentBracket(); }

        // Fullscreen
        function toggleFullscreen() {
          var wrapper = document.querySelector('.rw-wheel-wrapper');
          if (state.isFullscreen) {
            wrapper.classList.remove('rw-fullscreen');
            state.isFullscreen = false;
            if (document.exitFullscreen) document.exitFullscreen().catch(function(){});
          } else {
            wrapper.classList.add('rw-fullscreen');
            state.isFullscreen = true;
            if (wrapper.requestFullscreen) wrapper.requestFullscreen().catch(function(){});
          }
          setTimeout(function() { sizeCanvases(); drawWheel(); }, 100);
        }

        function applySectionLayout() { var controls = document.querySelector('.rw-controls'); if (!controls) return; var ordered = SECTION_META.map(function(meta) { return controls.querySelector('[data-section-id="' + meta.id + '"]'); }).filter(Boolean); ordered.forEach(function(section, index) { controls.appendChild(section); var meta = SECTION_META[index]; var open = Boolean(meta && meta.defaultOpen); section.classList.toggle('open', open); var toggle = section.querySelector('[data-section-toggle]'); if (toggle) toggle.setAttribute('aria-expanded', String(open)); }); }

        function init() {
          var defaultPreset = BUILT_IN_PRESETS[0];
          state.segments = (defaultPreset ? defaultPreset.segments : []).slice(0, MAX_SEGMENTS).map(function(segment, i) { return materializeSegment(segment, i); });
          if (state.segments.length < MIN_SEGMENTS) { for (var i = 0; i < 4; i++) state.segments.push({ id: randomId(), label: 'Option ' + (i + 1), color: COLOR_PALETTE[i % COLOR_PALETTE.length], weight: 1 }); }
          state.phase = 'ready';
          applySectionLayout();
          sizeCanvases();
          renderSegments();
          drawWheel();
          updateStatsUI();
          renderPresetSelect();
          renderTournamentBracket();
          setSelectionMode(rouletteBootConfig.defaultSelectionMode);

          elSpinBtn.addEventListener('click', function() { spin(); });
          elSoundToggle.addEventListener('change', function() { state.audio.enabled = elSoundToggle.checked; if (state.audio.enabled) ensureAudioCtx(state.audio); });
          document.getElementById('sound-theme-select').addEventListener('change', function(e) { state.soundThemeId = e.target.value || 'casino'; });
          document.getElementById('clear-stats-btn').addEventListener('click', function() { state.stats = { total: 0, counts: {}, history: [] }; state.progressiveCounts = {}; updateStatsUI(); });
          document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
          document.getElementById('neon-toggle-btn').addEventListener('click', function() { state.neonGlow = !state.neonGlow; elWheelStage.classList.toggle('neon-glow', state.neonGlow); });

          // Segment events
          var segList = document.getElementById('segments-list');
          segList.addEventListener('input', function(e) { var row = e.target.closest('.rw-segment-item'); if (!row) return; var id = row.dataset.segId; if (e.target.classList.contains('rw-segment-input')) updateSegmentLabel(id, e.target.value); if (e.target.classList.contains('rw-segment-weight')) updateSegmentWeight(id, e.target.value); if (e.target.classList.contains('rw-segment-color')) updateSegmentColor(id, e.target.value); });
          segList.addEventListener('click', function(e) { var btn = e.target.closest('.rw-segment-delete'); if (btn) { var id = btn.closest('.rw-segment-item').dataset.segId; removeSegment(id); } });
          segList.addEventListener('dragstart', handleDragStart);
          segList.addEventListener('dragover', handleDragOver);
          segList.addEventListener('dragleave', handleDragLeave);
          segList.addEventListener('drop', handleDrop);
          segList.addEventListener('dragend', handleDragEnd);

          document.getElementById('add-segment-btn').addEventListener('click', function() { var input = document.getElementById('new-segment-input'); if (addSegment(input.value.trim())) input.value = ''; });
          document.getElementById('new-segment-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') { var input = document.getElementById('new-segment-input'); if (addSegment(input.value.trim())) input.value = ''; } });
          document.getElementById('export-segments-btn').addEventListener('click', exportSegments);
          document.getElementById('import-segments-btn').addEventListener('click', function() { document.getElementById('import-file-input').click(); });
          document.getElementById('import-file-input').addEventListener('change', function(e) { if (e.target.files && e.target.files[0]) importSegments(e.target.files[0]); e.target.value = ''; });

          document.getElementById('mode-equal-btn').addEventListener('click', function() { setSelectionMode('equal'); });
          document.getElementById('mode-weighted-btn').addEventListener('click', function() { setSelectionMode('weighted'); });
          document.getElementById('mode-progressive-btn').addEventListener('click', function() { setSelectionMode('progressive'); });
          document.getElementById('mode-timed-btn').addEventListener('click', function() { setSelectionMode('timed'); });

          document.querySelectorAll('[data-section-toggle]').forEach(function(btn) { btn.addEventListener('click', function() { var section = btn.closest('.rw-section'), isOpen = section.classList.contains('open'); section.classList.toggle('open', !isOpen); btn.setAttribute('aria-expanded', String(!isOpen)); }); });
          document.getElementById('save-preset-btn').addEventListener('click', function() { var name = document.getElementById('preset-name-input').value.trim(); if (name) { savePreset(name); document.getElementById('preset-name-input').value = ''; } });
          document.getElementById('load-preset-btn').addEventListener('click', function() { var value = document.getElementById('preset-select').value; if (value) loadPreset(value); });
          document.getElementById('start-series-btn').addEventListener('click', function() { var count = parseInt(document.getElementById('series-count').value, 10) || 10; startSeries(clamp(count, 1, 50)); });
          document.getElementById('stop-series-btn').addEventListener('click', stopSeries);
          document.getElementById('start-tournament-btn').addEventListener('click', startTournament);
          document.getElementById('stop-tournament-btn').addEventListener('click', stopTournament);

          window.addEventListener('resize', function() { sizeCanvases(); drawWheel(); });
          window.addEventListener('keydown', function(e) { if (e.key === 'F11') { e.preventDefault(); toggleFullscreen(); } if (e.key === 'Escape' && state.isFullscreen) toggleFullscreen(); });
          var mo = new MutationObserver(function() { drawWheel(); });
          mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
          document.addEventListener('fullscreenchange', function() { if (!document.fullscreenElement && state.isFullscreen) { state.isFullscreen = false; document.querySelector('.rw-wheel-wrapper').classList.remove('rw-fullscreen'); setTimeout(function() { sizeCanvases(); drawWheel(); }, 100); } });
        }
        init();
      })();
    <\/script>
  `;

  return respondHTML(createPageTemplate({
    title: toolTranslation?.name || 'Roulette Wheel',
    description: toolTranslation?.desc || 'Spin a crypto-random roulette wheel for fair picks with real-time statistics, presets, sound effects, and fullscreen mode.',
    path: '/roulette-wheel',
    content,
    scripts: script,
    lang
  }));
}

export async function handleRouletteWheelRoutes(request, url) {
  if (url.pathname === '/roulette-wheel' || url.pathname === '/roulette-wheel/') {
    if (request.method === 'GET') return renderRouletteWheelPage(resolveRequestLanguage(request, url));
  }
  return null;
}
