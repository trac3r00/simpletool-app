/**
 * Common UI Components and Utilities
 * Provides universal navigation, theme management, and styling
 * Used across all tool pages for consistency
 */

import { bundledStylesHash } from './bundled-styles.js';
import { getKeyboardShortcutsScript } from './keyboard-shortcuts.js';
import { TOOLS } from './tool-registry.js';
import { getPersonalizationScript } from './personalization.js';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  t,
  getLanguageSelectorHTML,
  getLanguageBootstrapScript,
  getLanguageScript,
  localizeTools,
  normalizeLanguage,
  withLanguageQuery
} from './i18n.js';

// Re-export keyboard shortcuts, i18n, and personalization for easy access
export { getKeyboardShortcutsScript, t, getLanguageSelectorHTML, getLanguageBootstrapScript, getLanguageScript, getPersonalizationScript };

export function createCheatsheet(toolId, title, sections) {
  const id = `cheatsheet-${toolId}`;
  const prefix = `tools.${toolId}.cheatsheet`;
  const sectionsHTML = sections.map((s, i) =>
    `${s.heading ? `<h3 data-i18n="${prefix}.h${i}">${s.heading}</h3>` : ''}` +
    `<div data-i18n-html="${prefix}.c${i}">${s.content}</div>`
  ).join('');

  return `
    <div class="cheatsheet mt-6" id="${id}">
      <button class="cheatsheet-toggle" aria-expanded="false" aria-controls="${id}-content" data-cheatsheet-id="${toolId}">
        <span class="flex items-center gap-2">
          <span class="text-base">📖</span>
          <span data-i18n="${prefix}.title">${title}</span>
        </span>
        <svg class="w-4 h-4 transition-transform duration-200 cheatsheet-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      <div class="cheatsheet-content" id="${id}-content" role="region" aria-labelledby="${id}">
        <div class="cheatsheet-inner">
          ${sectionsHTML}
        </div>
      </div>
    </div>
  `;
}

export function getCheatsheetToggleScript() {
  return `
    <script>
      (function() {
        function toggleCheatsheet(btn) {
          const id = btn.getAttribute('data-cheatsheet-id');
          const content = document.getElementById('cheatsheet-' + id + '-content');
          if (!content) return;
          const inner = content.querySelector('.cheatsheet-inner');
          if (!inner) return;
          const isOpen = content.classList.contains('open');
          const chevron = btn.querySelector('.cheatsheet-chevron');
          if (isOpen) {
            content.style.maxHeight = content.scrollHeight + 'px';
            requestAnimationFrame(function() { content.style.maxHeight = '0'; });
            content.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
            if (chevron) chevron.style.transform = '';
            try { localStorage.removeItem('cheatsheet-' + id); } catch(e) {}
          } else {
            content.classList.add('open');
            content.style.maxHeight = inner.scrollHeight + 40 + 'px';
            btn.setAttribute('aria-expanded', 'true');
            if (chevron) chevron.style.transform = 'rotate(180deg)';
            try { localStorage.setItem('cheatsheet-' + id, '1'); } catch(e) {}
          }
        }

        document.addEventListener('click', function(e) {
          var btn = e.target.closest('.cheatsheet-toggle');
          if (btn) toggleCheatsheet(btn);
        });

        document.querySelectorAll('.cheatsheet-toggle').forEach(function(btn) {
          var id = btn.getAttribute('data-cheatsheet-id');
          try {
            if (localStorage.getItem('cheatsheet-' + id) === '1') {
              var content = document.getElementById('cheatsheet-' + id + '-content');
              if (content) {
                var inner = content.querySelector('.cheatsheet-inner');
                content.classList.add('open');
                content.style.maxHeight = (inner ? inner.scrollHeight + 40 : 2000) + 'px';
                btn.setAttribute('aria-expanded', 'true');
                var chevron = btn.querySelector('.cheatsheet-chevron');
                if (chevron) chevron.style.transform = 'rotate(180deg)';
              }
            }
          } catch(e) {}
        });
      })();
    </script>
  `;
}

let analyticsToken = '';

export function setAnalyticsToken(token) {
  analyticsToken = typeof token === 'string' ? token.trim() : '';
}

let siteUrl = 'https://simpletool.app';

export function setSiteUrl(url) {
  siteUrl = typeof url === 'string' ? url.replace(/\/+$/, '') : 'https://simpletool.app';
}

export function getAlternateLanguageLinks(path = '/', currentLang = DEFAULT_LANGUAGE) {
  const normalizedPath = path || '/';
  const links = Object.keys(SUPPORTED_LANGUAGES).map((lang) => {
    const href = `${siteUrl}${withLanguageQuery(normalizedPath, lang)}`;
    return `<link rel="alternate" hreflang="${lang}" href="${href}">`;
  });
  links.push(`<link rel="alternate" hreflang="x-default" href="${siteUrl}${withLanguageQuery(normalizedPath, DEFAULT_LANGUAGE)}">`);
  return links.join('\n  ');
}

export function getAnalyticsScript() {
  if (!analyticsToken) return '';
  return `<!-- Cloudflare Web Analytics (privacy-preserving, no cookies) -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "${analyticsToken}"}'></script>`;
}

/**
 * Shared tool layout abstraction.
 * Provides consistent inner content structure for tool pages.
 * Modes: 'two-panel' (input/output grid), 'single-panel' (centered), 'custom' (pass-through).
 */
export function createToolLayout(options) {
  const {
    mode = 'two-panel',
    toolHeader = '',
    controls = '',
    leftPanel = '',
    rightPanel = '',
    content = '',
    footer = '',
    actionBar
  } = options;

  const actionBarHTML = actionBar ? getActionBarHTML(actionBar) : '';

  let innerContent;
  if (mode === 'two-panel') {
    innerContent = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="flex flex-col gap-2">${leftPanel}</div>
        <div class="flex flex-col gap-2 relative">
          ${actionBarHTML}
          ${rightPanel}
        </div>
      </div>`;
  } else if (mode === 'single-panel') {
    innerContent = `
      <div class="max-w-3xl mx-auto">
        ${actionBarHTML}
        ${content}
      </div>`;
  } else {
    innerContent = content;
  }

  return `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}
        ${controls ? `<div class="flex flex-wrap gap-3 mb-6 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">${controls}</div>` : ''}
        ${innerContent}
      </div>
      ${footer}
    </main>`;
}

/**
 * Universal action bar for tool output areas.
 */
export function getActionBarHTML(options = {}) {
  const { copy = true, download = false, share = false, fullscreen = false, outputId = 'output' } = options;
  const buttons = [];

  if (copy) {
    buttons.push(`<button type="button" class="action-btn" data-action="copy" data-target="${outputId}" title="Copy to clipboard">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
      <span class="action-label">Copy</span>
    </button>`);
  }
  if (download) {
    buttons.push(`<button type="button" class="action-btn" data-action="download" data-target="${outputId}" title="Download">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
      <span class="action-label">Download</span>
    </button>`);
  }
  if (share) {
    buttons.push(`<button type="button" class="action-btn" data-action="share" title="Share permalink">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
      <span class="action-label">Share</span>
    </button>`);
  }
  if (fullscreen) {
    buttons.push(`<button type="button" class="action-btn" data-action="fullscreen" title="Fullscreen">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
      <span class="action-label">Fullscreen</span>
    </button>`);
  }

  if (buttons.length === 0) return '';

  return `<div class="flex items-center justify-end gap-1 mb-2">
    ${buttons.join('\n    ')}
  </div>`;
}

/**
 * Script for universal action bar interactions (copy with feedback, download, share).
 * @returns {string} Script tag
 */
export function getActionBarScript() {
  return `<script>
  (function() {
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.dataset.action;
      var targetId = btn.dataset.target;

      if (action === 'copy') {
        var el = document.getElementById(targetId);
        var text = el ? (el.value || el.textContent || el.innerText) : '';
        if (text && navigator.clipboard) {
          navigator.clipboard.writeText(text).then(function() {
            var label = btn.querySelector('.action-label');
            if (label) { var orig = label.textContent; label.textContent = '✓ Copied'; setTimeout(function() { label.textContent = orig; }, 2000); }
          });
        }
      }
      if (action === 'download') {
        var el = document.getElementById(targetId);
        var text = el ? (el.value || el.textContent || el.innerText) : '';
        if (text) {
          var blob = new Blob([text], { type: 'text/plain' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = (targetId || 'output') + '.txt';
          a.click();
          URL.revokeObjectURL(a.href);
        }
      }
      if (action === 'share') {
        var url = new URL(window.location.href);
        navigator.clipboard.writeText(url.href).then(function() {
          var label = btn.querySelector('.action-label');
          if (label) { var orig = label.textContent; label.textContent = '✓ Link copied'; setTimeout(function() { label.textContent = orig; }, 2000); }
        });
      }
      if (action === 'fullscreen') {
        var main = document.querySelector('main');
        if (main) { if (document.fullscreenElement) document.exitFullscreen(); else main.requestFullscreen(); }
      }
    });
  })();
  </script>`;
}

let adConfig = {
  client: null,
  slots: {}
};

function isAdsEnabled() {
  return typeof adConfig.client === 'string' && 
         Boolean(adConfig.client.trim()) && 
         adConfig.slots && 
         Object.keys(adConfig.slots).length > 0;
}

export function setAdConfig(config = {}) {
  const { client, slots } = config;
  if (client === null) {
    adConfig.client = null;
  }
  if (typeof client === 'string' && client.trim()) {
    adConfig.client = client.trim();
  }
  if (slots && typeof slots === 'object') {
    adConfig.slots = { ...slots };
  }
}

export function getAdConfig() {
  return { ...adConfig, slots: { ...adConfig.slots } };
}

/**
 * Google AdSense script tag (disabled by default).
 */
export function getGtagScript() {
  // Disabled by default to avoid third-party requests in restrictive environments.
  return '';
}

export function getAdSenseScript() {
  if (!isAdsEnabled()) return '';
  const client = adConfig.client;
  
  // Validate client ID format to prevent malformed URLs
  // Must start with ca-pub- and followed by digits
  if (!client || !/^ca-pub-\d+$/.test(client)) {
    console.warn('[AdSense] Invalid client ID format, skipping ad script injection');
    return '';
  }

  return `
    <script>
      (function() {
        function loadAdSense() {
          const script = document.createElement('script');
          script.async = true;
          script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}';
          script.crossOrigin = 'anonymous';
          script.dataset.adClient = '${client}';
          script.onerror = function() { this.remove(); };
          document.head.appendChild(script);
        }
        // Load after DOM is ready or 2 seconds, whichever comes first
        if (document.readyState === 'complete') {
          setTimeout(loadAdSense, 2000);
        } else {
          window.addEventListener('DOMContentLoaded', function() {
            setTimeout(loadAdSense, 2000);
          });
        }
        // Safety timeout: remove if not loaded after 5 seconds
        setTimeout(function() {
          const scripts = document.querySelectorAll('script[data-ad-client]');
          scripts.forEach(function(s) {
            if (!window.adsbygoogle || !window.adsbygoogle.loaded) {
              s.remove();
            }
          });
        }, 5000);
      })();
    </script>
  `;
}

/**
 * Render an AdSense slot, if configured.
 */
export function getAdSlotHTML(slotKey, options = {}) {
  if (!isAdsEnabled()) return '';
  const slotId = adConfig.slots?.[slotKey];
  
  // If no slot ID configured for this key, return empty string
  if (!slotId || typeof slotId !== 'string' || !slotId.trim()) {
    return '';
  }

  const {
    wrapperClassName = '',
    label = 'Sponsored',
    format = 'auto',
    responsive = true
  } = options;

  const labelHTML = label ? `<p class="text-xs uppercase tracking-widest text-surface-400 mb-2">${label}</p>` : '';

  return `
    <aside class="${wrapperClassName}" aria-label="Advertisement" style="display:none" data-ad-container>
      ${labelHTML}
       <ins class="adsbygoogle"
            style="display:block"
            data-ad-client="${adConfig.client}"
            data-ad-slot="${slotId}"
            data-ad-format="${format}"
            data-full-width-responsive="${responsive ? 'true' : 'false'}"></ins>
       <script>try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}</script>
     </aside>
  `;
}

/**
 * Shared theme toggle button markup with accessible defaults
 */
export function getThemeToggleButton(options = {}) {
  const {
    id = 'theme-toggle',
    currentLang = DEFAULT_LANGUAGE,
    label = t('nav.toggleTheme', normalizeLanguage(currentLang)),
    className = ''
  } = options;
  const lang = normalizeLanguage(currentLang);
  const labels = {
    system: t('nav.toggleTheme', lang),
    light: t('nav.switchDark', lang),
    dark: t('nav.switchLight', lang)
  };

  // Uses btn-ghost style but manual classes to avoid dependency loop if CSS isn't loaded yet
  const classes = [
    'p-2 rounded-lg',
    'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    'focus:ring-offset-white dark:focus:ring-offset-surface-950',
    className
  ].filter(Boolean).join(' ');

  return `
    <button id="${id}" type="button" aria-label="${label}" title="${labels.system}" class="${classes}" data-theme-toggle="true" data-theme-label-system="${labels.system}" data-theme-label-light="${labels.light}" data-theme-label-dark="${labels.dark}">
      <span class="sr-only">${label}</span>
      <!-- System Icon (monitor) -->
      <svg class="w-5 h-5" data-theme-icon="system" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
      </svg>
      <!-- Sun Icon -->
      <svg class="w-5 h-5 hidden" data-theme-icon="light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
      </svg>
      <!-- Moon Icon -->
      <svg class="w-5 h-5 hidden" data-theme-icon="dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
      </svg>
    </button>
  `;
}

/**
 * Get common navigation HTML
 */
export function getNavigationHTML(options = {}) {
  const {
    maxWidth = 'max-w-7xl',
    lang = DEFAULT_LANGUAGE
  } = options;
  const currentLang = normalizeLanguage(lang);
  const homeHref = withLanguageQuery('/', currentLang);

  return `
    <!-- Navigation -->
     <nav class="sticky top-0 z-50 glass" aria-label="${t('nav.home')}" data-i18n-aria="nav.home">
      <div class="${maxWidth} mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-14">
          <div class="flex items-center gap-4">
            <a href="${homeHref}"
               class="flex items-center gap-2 text-surface-900 dark:text-surface-50 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md py-1 pr-2">
              <div class="p-1 rounded bg-primary-50 dark:bg-primary-900/50 group-hover:bg-primary-100 dark:group-hover:bg-primary-900 transition-colors">
                <svg class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                </svg>
              </div>
              <span class="font-semibold text-sm tracking-tight">SimpleTool</span>
            </a>
            
            <!-- Separator -->
            <div class="h-4 w-px bg-surface-200 dark:bg-surface-700 hidden sm:block"></div>
          </div>

           <div class="flex items-center gap-2">
             <!-- Mobile search button (icon only) -->
             <button type="button" id="mobile-search-btn" class="md:hidden p-2 rounded-lg text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="${t('nav.searchTools', currentLang)}">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
             </button>
             <!-- Desktop search input (readonly, triggers modal on click/focus) -->
             <div class="hidden md:flex items-center mr-2 relative">
                 <svg class="absolute left-3 w-3.5 h-3.5 text-surface-400 dark:text-surface-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                 <input type="text" readonly id="nav-search-btn" placeholder="${t('nav.search', currentLang)}" data-i18n-placeholder="nav.search" class="w-48 lg:w-64 pl-8 pr-3 py-1.5 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md text-xs text-surface-500 dark:text-surface-400 placeholder-surface-500 dark:placeholder-surface-400 hover:border-surface-300 dark:hover:border-surface-600 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="${t('nav.searchTools', currentLang)}" />
             </div>
             ${getLanguageSelectorHTML(currentLang)}
             ${getThemeToggleButton({ currentLang })}
           </div>
        </div>
      </div>
    </nav>
  `;
}

/**
 * Theme bootstrap script to avoid flash of incorrect theme.
 */
export function getThemeBootstrapScript() {
   return `
     <script data-theme-bootstrap>
       (function() {
         const root = document.documentElement;
         let stored;
         try {
           stored = localStorage.getItem('theme');
         } catch (e) {
           stored = null;
         }
         const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
         const effectiveTheme = (!stored || stored === 'system')
           ? (prefersDark ? 'dark' : 'light')
           : stored;
         if (effectiveTheme === 'dark') {
           root.classList.add('dark');
         } else {
           root.classList.remove('dark');
         }
         // Remove visibility:hidden to prevent FOUC
         root.style.visibility = '';
       })();
     </script>
   `;
 }

/**
 * Get common theme management JavaScript
 * Handles dark mode toggle without persistent storage
 */
export function getThemeScript() {
  return `
    <script>
      (function() {
        const root = document.documentElement;
        let transitionTimeout;
        const MODES = ['system', 'light', 'dark'];

        // Show only the icon matching the current mode
        const MODE_LABELS = { system: 'System', light: 'Light', dark: 'Dark' };
        const syncToggleState = (mode) => {
          const toggles = document.querySelectorAll('[data-theme-toggle]');
          const nextIdx = (MODES.indexOf(mode) + 1) % MODES.length;
          const nextMode = MODES[nextIdx];
          toggles.forEach(btn => {
            const currentLabel = MODE_LABELS[mode] || mode;
            const nextLabel = MODE_LABELS[nextMode] || nextMode;
            const label = 'Theme: ' + currentLabel + ' \u2014 click for ' + nextLabel;
            btn.setAttribute('title', label);
            btn.setAttribute('aria-label', label);
            const srOnly = btn.querySelector('.sr-only');
            if (srOnly) srOnly.textContent = label;
            btn.querySelectorAll('[data-theme-icon]').forEach(icon => {
              icon.classList.toggle('hidden', icon.dataset.themeIcon !== mode);
            });
          });
        };

        const readStoredMode = () => {
          try {
            return localStorage.getItem('theme');
          } catch (e) {
            return null;
          }
        };

        const getSystemDark = () =>
          window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        const resolveEffective = (mode) =>
          (!mode || mode === 'system') ? (getSystemDark() ? 'dark' : 'light') : mode;

        const withTransitionsDisabled = (callback) => {
          root.classList.add('theme-transition');
          if (transitionTimeout) clearTimeout(transitionTimeout);
          callback();
          transitionTimeout = window.setTimeout(() => {
            root.classList.remove('theme-transition');
          }, 120);
        };

        const applyTheme = (mode) => {
          const effective = resolveEffective(mode);
          const shouldBeDark = effective === 'dark';
          const isDark = root.classList.contains('dark');
          if (shouldBeDark !== isDark) {
            withTransitionsDisabled(() => {
              root.classList.toggle('dark', shouldBeDark);
            });
          }
          syncToggleState(mode || 'system');
        };

        const setMode = (mode) => {
          try { localStorage.setItem('theme', mode); } catch (e) {}
          applyTheme(mode);
        };

        // Initialize — default is system
        const stored = readStoredMode();
        const currentMode = stored || 'system';
        applyTheme(currentMode);

        // Click cycles: system → light → dark → system
        document.addEventListener('click', (e) => {
          const toggleBtn = e.target.closest('[data-theme-toggle]');
          if (toggleBtn) {
            e.preventDefault();
            const cur = readStoredMode() || 'system';
            const idx = MODES.indexOf(cur);
            const next = MODES[(idx + 1) % MODES.length];
            setMode(next);
          }
        });

        // Listen for system changes — only apply when in system mode
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
          const mode = readStoredMode() || 'system';
          if (mode === 'system') {
            applyTheme('system');
          }
        });
      })();
    </script>
  `;
}

/**
 * Global Search Script
 */
export function getSearchScript(options = {}) {
  const {
    lang = DEFAULT_LANGUAGE
  } = options;
  const currentLang = normalizeLanguage(lang);
  const tools = localizeTools(TOOLS, currentLang).map(({ id, name, path, icon, description, keywords, hiddenInProduction }) => ({
    id,
    name,
    path: withLanguageQuery(path, currentLang),
    icon,
    description,
    keywords: keywords || '',
    hiddenInProduction: Boolean(hiddenInProduction)
  }));

  return `
    <div id="search-modal" class="fixed inset-0 z-[100] hidden" role="dialog" aria-modal="true">
      <div class="fixed inset-0 bg-surface-900/50 backdrop-blur-sm transition-opacity opacity-0" id="search-overlay"></div>
      <div class="fixed inset-0 overflow-y-auto p-4 sm:p-6 md:p-20">
        <div class="mx-auto max-w-2xl transform divide-y divide-surface-100 dark:divide-surface-800 overflow-hidden rounded-xl bg-white dark:bg-surface-900 shadow-2xl ring-1 ring-black/5 transition-all opacity-0 scale-95" id="search-panel">
          <div class="relative">
            <svg class="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-surface-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
            </svg>
            <input type="text" class="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-surface-900 dark:text-white placeholder:text-surface-400 focus:ring-0 sm:text-sm" placeholder="${t('nav.searchTools', currentLang)}" data-i18n-placeholder="nav.searchTools" id="global-search-input" role="combobox" aria-label="Search tools" aria-expanded="false" aria-controls="search-results">
          </div>
          <ul class="max-h-96 scroll-py-3 overflow-y-auto p-3" id="search-results" role="listbox">
            <!-- Results injected here -->
          </ul>
          <div class="flex flex-wrap items-center bg-surface-50 dark:bg-surface-950 px-4 py-2.5 text-xs text-surface-500 dark:text-surface-400 border-t border-surface-100 dark:border-surface-800">
            ${t('nav.searchTools', currentLang)} · <kbd class="mx-1 font-sans font-semibold text-surface-900 dark:text-white">↑↓</kbd> ${t('nav.searchNavigate', currentLang)} · <kbd class="mx-1 font-sans font-semibold text-surface-900 dark:text-white">↵</kbd> ${t('nav.searchSelect', currentLang)} · <kbd class="mx-1 font-sans font-semibold text-surface-900 dark:text-white">esc</kbd> ${t('nav.searchClose', currentLang)}
          </div>
        </div>
      </div>
    </div>

    <script>
      (function() {
        const allTools = ${JSON.stringify(tools)};
        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
        const tools = isLocal ? allTools : allTools.filter((tool) => !tool.hiddenInProduction);
        const modal = document.getElementById('search-modal');
        const overlay = document.getElementById('search-overlay');
        const panel = document.getElementById('search-panel');
        const input = document.getElementById('global-search-input');
        const resultsList = document.getElementById('search-results');
        const navBtn = document.getElementById('nav-search-btn');
        let selectedIndex = 0;
        let isOpen = false;
        let currentResults = tools;

        function openSearch() {
          if (isOpen) return;
          
          if (document.activeElement !== navBtn) {
             const heroSearch = document.getElementById('tool-search');
             if (heroSearch && heroSearch.offsetParent !== null) {
               heroSearch.focus();
               return;
             }
          }

          isOpen = true;
          modal.classList.remove('hidden');
          requestAnimationFrame(() => {
            overlay.classList.remove('opacity-0');
            panel.classList.remove('opacity-0', 'scale-95');
          });
          input.value = '';
          selectedIndex = 0;
          currentResults = tools;
          renderResults(tools);
          input.focus();
          document.body.style.overflow = 'hidden';
        }

        function closeSearch() {
          if (!isOpen) return;
          isOpen = false;
          overlay.classList.add('opacity-0');
          panel.classList.add('opacity-0', 'scale-95');
          setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
          }, 200);
        }

        window.fuzzySearch = function(query, list) {
          if (!query) return list.map(item => ({ ...item, score: 1 }));
          
          const q = query.toLowerCase();
          const results = [];
          const keys = ['name', 'description', 'keywords'];
          var i18nTools = (typeof window._i18nToolTranslations === 'function') ? window._i18nToolTranslations() : {};

          for (const item of list) {
            let maxScore = 0;
            var texts = [];
            for (const key of keys) {
              if (item[key]) texts.push(item[key]);
            }
            var tr = item.id ? i18nTools[item.id] : null;
            if (tr) {
              if (tr.name) texts.push(tr.name);
              if (tr.desc) texts.push(tr.desc);
            }

            for (var ti = 0; ti < texts.length; ti++) {
              const text = texts[ti].toLowerCase();

              let score = 0;
              if (text === q) score = 100;
              else if (text.startsWith(q)) score = 80;
              else if (text.includes(q)) score = 60;
              else {
                let queryIdx = 0;
                let textIdx = 0;
                let matches = 0;
                while (queryIdx < q.length && textIdx < text.length) {
                  if (q[queryIdx] === text[textIdx]) {
                    queryIdx++;
                    matches++;
                  }
                  textIdx++;
                }
                if (matches === q.length) {
                  score = 20 + (q.length / text.length) * 20;
                }
              }
              if (score > maxScore) maxScore = score;
            }
            if (maxScore > 0) results.push({ ...item, score: maxScore });
          }
          return results.sort((a, b) => b.score - a.score);
        };

        function renderResults(results) {
          if (results.length === 0) {
            resultsList.innerHTML = \`
              <li class="p-4 text-center text-sm text-surface-500 dark:text-surface-400">
                ${t('home.noResults', currentLang)}
              </li>
            \`;
            return;
          }

          var _tr = (typeof window._i18nToolTranslations === 'function') ? window._i18nToolTranslations() : {};
          resultsList.innerHTML = results.map((tool, index) => {
            var t = tool.id ? _tr[tool.id] : null;
            var dName = (t && t.name) ? t.name : tool.name;
            var dDesc = (t && t.desc) ? t.desc : tool.description;
            return \`
            <li class="group flex cursor-default select-none items-center rounded-xl p-3 hover:bg-surface-100 dark:hover:bg-surface-800 \${index === selectedIndex ? 'bg-surface-100 dark:bg-surface-800' : ''}" id="option-\${index}" role="option" tabindex="-1" data-tool-path="\${tool.path}">
              <div class="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xl">
                \${tool.icon}
              </div>
              <div class="ml-4 flex-auto">
                <p class="text-sm font-medium text-surface-900 dark:text-white">\${dName}</p>
                <p class="text-xs text-surface-500 dark:text-surface-400 line-clamp-1">\${dDesc}</p>
              </div>
              <svg class="ml-3 h-5 w-5 flex-none text-surface-400 opacity-0 group-hover:opacity-100 \${index === selectedIndex ? 'opacity-100' : ''}" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
              </svg>
            </li>
          \`; }).join('');
          
          const selected = document.getElementById('option-' + selectedIndex);
          if (selected) selected.scrollIntoView({ block: 'nearest' });
        }

         // Bind click to both mobile and desktop search buttons
         const mobileBtn = document.getElementById('mobile-search-btn');
         navBtn?.addEventListener('click', openSearch);
         mobileBtn?.addEventListener('click', openSearch);

        window.addEventListener('keydown', (e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (isOpen) closeSearch();
            else openSearch();
          }
          if (e.key === 'Escape' && isOpen) {
            closeSearch();
          }
        });

        input.addEventListener('input', (e) => {
          const query = e.target.value.trim();
          selectedIndex = 0;
          currentResults = window.fuzzySearch(query, tools);
          renderResults(currentResults);
        });

        input.addEventListener('keydown', (e) => {
          if (!currentResults.length) return;

          if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % currentResults.length;
            renderResults(currentResults);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + currentResults.length) % currentResults.length;
            renderResults(currentResults);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentResults[selectedIndex]) {
              window.location.href = currentResults[selectedIndex].path;
            }
          }
        });

        resultsList.addEventListener('click', (e) => {
          const item = e.target.closest('[data-tool-path]');
          if (!item) return;
          const path = item.getAttribute('data-tool-path');
          if (path) window.location.href = path;
        });

        overlay.addEventListener('click', closeSearch);
      })();
    </script>
  `;
}

/**
 * Global Toast System
 */
export function getToastScript() {
  return `
    <div id="toast-container" class="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none"></div>
    <script>
      (function() {
        const container = document.getElementById('toast-container');
        
        window.Toast = {
          show: function(msg, type = 'info', duration = 3000) {
            const toast = document.createElement('div');
            const bgClass = type === 'success' ? 'bg-success-500 dark:bg-success-600' :
                           type === 'error' ? 'bg-error-500 dark:bg-error-600' :
                           'bg-info-500 dark:bg-info-600';
            const icon = type === 'success' ? '✓' :
                        type === 'error' ? '✕' :
                        'ℹ';
            
            toast.className = \`\${bgClass} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 pointer-events-auto animate-slide-in\`;
            toast.innerHTML = \`<span>\${icon}</span><span>\${msg}</span>\`;
            container.appendChild(toast);
            
            if (duration > 0) {
              setTimeout(() => {
                toast.classList.add('animate-fade-out');
                setTimeout(() => toast.remove(), 300);
              }, duration);
            }
          },
          success: function(msg, duration = 3000) {
            this.show(msg, 'success', duration);
          },
          error: function(msg, duration = 3000) {
            this.show(msg, 'error', duration);
          },
          info: function(msg, duration = 3000) {
            this.show(msg, 'info', duration);
          }
        };
      })();
    </script>
    <style>
      @keyframes slide-in {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes fade-out {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
      .animate-slide-in {
        animation: slide-in 0.3s ease-out;
      }
      .animate-fade-out {
        animation: fade-out 0.3s ease-out;
      }
    </style>
  `;
}

/**
 * Include bundled stylesheet links
 */
export function getStylesheetLinks() {
    const version = bundledStylesHash || 'dev';
    return `
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
      <link rel="prefetch" as="font" type="font/woff2" href="/fonts/material-symbols.woff2" crossorigin>
      <style>
       @font-face {
         font-family: 'Material Symbols Rounded';
        font-style: normal;
        font-weight: 100 700;
         font-display: swap;
        src: url(/fonts/material-symbols.woff2) format('woff2');
      }
      .material-symbols-rounded {
        font-family: 'Material Symbols Rounded';
        font-weight: normal;
        font-style: normal;
        font-size: 24px;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        -webkit-font-feature-settings: 'liga';
        -webkit-font-smoothing: antialiased;
      }
      /* i18n overflow protection for longer translations (de, fr, pt) */
      [data-i18n], [data-i18n-html] { overflow-wrap: break-word; word-break: break-word; }
      .btn, [role="menuitem"] { overflow: hidden; text-overflow: ellipsis; }
      .language-dropdown { scrollbar-width: thin; }
      .language-dropdown::-webkit-scrollbar { width: 6px; }
      .language-dropdown::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.3); border-radius: 3px; }
    </style>
    <link rel="stylesheet" href="/styles.css?v=${version}" data-bundled-stylesheet="true">
  `;
}

/**
 * Get common footer HTML
 * 3-column layout: Brand | Top Tools | Legal
 * Responsive: stacks on mobile
 */
export function getFooterHTML(options = {}) {
   const { lang = DEFAULT_LANGUAGE } = options;
   const currentLang = normalizeLanguage(lang);
   const topTools = localizeTools(TOOLS.slice(0, 5), currentLang);
   const toolsHTML = topTools.map(tool => 
     `<li><a href="${withLanguageQuery(tool.path, currentLang)}" class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"><span>${tool.icon}</span><span>${tool.name}</span></a></li>`
   ).join('');
   
   return `
     <footer class="border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 mt-12">
       <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <!-- 4-Column Grid: Brand | Tools | Resources | Legal -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-8">
           
           <!-- Column 1: Brand -->
           <div class="flex flex-col">
             <div class="flex items-center gap-2 mb-2">
               <div class="p-1.5 rounded bg-primary-50 dark:bg-primary-900/50">
                 <svg class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                 </svg>
               </div>
               <span class="font-bold text-lg text-surface-900 dark:text-surface-50">SimpleTool</span>
             </div>
             <p class="text-sm text-surface-600 dark:text-surface-400 mb-4" data-i18n="footer.tagline">${t('footer.tagline', currentLang)}</p>
              <p class="text-xs text-surface-500 dark:text-surface-500">© ${new Date().getFullYear()} SimpleTool · <a href="/changelog" class="hover:text-primary-500 transition-colors">v2.4.1</a></p>
           </div>
           
           <!-- Column 2: Top Tools -->
           <div class="flex flex-col">
             <h3 class="font-semibold text-surface-900 dark:text-surface-50 mb-4 text-sm uppercase tracking-wide" data-i18n="footer.popularTools">${t('footer.popularTools', currentLang)}</h3>
             <ul class="space-y-2 flex-1">
               ${toolsHTML}
               <li class="pt-2 border-t border-surface-200 dark:border-surface-800">
                 <a href="${withLanguageQuery('/', currentLang)}" class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors" data-i18n="footer.viewAll">${t('footer.viewAll', currentLang)}</a>
               </li>
             </ul>
           </div>
           
            <!-- Column 3: Resources -->
            <div class="flex flex-col">
              <h3 class="font-semibold text-surface-900 dark:text-surface-50 mb-4 text-sm uppercase tracking-wide" data-i18n="footer.resources">${t('footer.resources', currentLang)}</h3>
              <ul class="space-y-2">
                <li>
                 <a href="${withLanguageQuery('/blog', currentLang)}" class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" data-i18n="footer.blog">${t('footer.blog', currentLang)}</a>
                </li>
                <li>
                  <a href="${withLanguageQuery('/faq', currentLang)}" class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" data-i18n="footer.faq">${t('footer.faq', currentLang)}</a>
                </li>
              </ul>
            </div>
            
            <!-- Column 4: Legal & Support -->
            <div class="flex flex-col">
              <h3 class="font-semibold text-surface-900 dark:text-surface-50 mb-4 text-sm uppercase tracking-wide" data-i18n="footer.legal">${t('footer.legal', currentLang)}</h3>
             <ul class="space-y-2">
               <li>
                 <a href="${withLanguageQuery('/about', currentLang)}" class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" data-i18n="footer.about">${t('footer.about', currentLang)}</a>
               </li>
               <li>
                 <a href="${withLanguageQuery('/privacy', currentLang)}" class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" data-i18n="footer.privacy">${t('footer.privacy', currentLang)}</a>
               </li>
               <li>
                 <a href="${withLanguageQuery('/terms', currentLang)}" class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" data-i18n="footer.terms">${t('footer.terms', currentLang)}</a>
               </li>
               <li>
                 <a href="${withLanguageQuery('/contact', currentLang)}" class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" data-i18n="footer.contact">${t('footer.contact', currentLang)}</a>
               </li>
               <li>
                 <a href="${withLanguageQuery('/security', currentLang)}" class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" data-i18n="footer.security">${t('footer.security', currentLang)}</a>
               </li>
             </ul>
           </div>
           
         </div>
         
         <!-- Divider -->
         <div class="border-t border-surface-200 dark:border-surface-800 pt-6">
           <p class="text-xs text-surface-500 dark:text-surface-500 text-center">
             ${t('footer.privacyNote', currentLang)} <a href="${withLanguageQuery('/privacy', currentLang)}" class="text-primary-600 dark:text-primary-400 hover:underline" data-i18n="footer.learnMore">${t('footer.learnMore', currentLang)}</a>
           </p>
         </div>
       </div>
     </footer>
   `;
}

/**
 * Create a complete base HTML template
 */
export function createPageTemplate(options) {
  const {
    title,
    description,
    content,
    path = '',
    scripts = '',
    schema
  } = options;
  const currentLang = normalizeLanguage(options.lang || DEFAULT_LANGUAGE);
  const toolId = path ? path.replace(/^\//, '') : '';

  const pagePath = path || '/';
  const pageUrl = `${siteUrl}${withLanguageQuery(pagePath, currentLang)}`;
  const fullTitle = `${title} | SimpleTool`;

  const sidebarAd = getAdSlotHTML('sidebar', {
    wrapperClassName: 'hidden xl:block w-[160px] flex-shrink-0 sticky top-24 self-start ml-4 mt-8',
    format: 'vertical',
    responsive: false,
    label: ''
  });

  const bottomAd = getAdSlotHTML('bottom', {
    wrapperClassName: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-8 border-t border-surface-200 dark:border-surface-800',
    format: 'horizontal',
    responsive: true,
    label: ''
  });

  return `<!DOCTYPE html>
<html lang="${currentLang}" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullTitle}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${pageUrl}">
  ${getAlternateLanguageLinks(pagePath, currentLang)}
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#2563eb">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${fullTitle}">
  <meta property="og:description" content="${description}">
  <meta property="og:site_name" content="SimpleTool">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${fullTitle}">
  <meta name="twitter:description" content="${description}">
  <meta property="og:image" content="https://simpletool.app/og-image.svg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:image" content="https://simpletool.app/og-image.svg">
  ${getThemeBootstrapScript()}
  ${getLanguageBootstrapScript(currentLang)}
  ${getGtagScript()}
  ${getAdSenseScript()}
  ${getStylesheetLinks()}
</head>
<body class="bg-surface-50 text-surface-900 dark:bg-surface-950 dark:text-surface-50 transition-colors duration-200 flex flex-col min-h-screen" data-tool-page-id="${toolId}">
  <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded">Skip to main content</a>
  ${getNavigationHTML({ lang: currentLang })}
  <div class="flex-grow" role="presentation">
    <div class="flex">
      <div id="main-content" class="flex-1 min-w-0 overflow-x-hidden">
        ${content}
      </div>
      ${sidebarAd}
    </div>
  </div>
  ${bottomAd}
  ${getFooterHTML({ lang: currentLang })}
  ${schema !== undefined ? (schema ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>` : '') : (path ? `<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'SoftwareApplication',name:title,url:pageUrl,description,applicationCategory:'DeveloperApplication',operatingSystem:'Any',offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}})}</script>` : '')}
   ${getThemeScript()}
   ${getLanguageScript(toolId, currentLang)}
   ${getSearchScript({ lang: currentLang })}
   ${getToastScript()}
   ${getKeyboardShortcutsScript()}
   ${getCheatsheetToggleScript()}
   ${getCopyToClipboardScript()}
   ${getClipboardSafetyScript()}
   ${toolId ? getPersonalizationScript(toolId) : ''}
   ${scripts}
  ${isAdsEnabled() ? `<script>
    (function(){
      function showAds(){document.querySelectorAll('[data-ad-container]').forEach(function(el){el.style.display=''});}
      if(window.adsbygoogle&&window.adsbygoogle.loaded){showAds();return;}
      var t=setTimeout(function(){},3000);
      var check=setInterval(function(){
        var ins=document.querySelector('ins.adsbygoogle');
        if(ins&&(ins.dataset.adStatus||ins.childElementCount>0)){clearInterval(check);clearTimeout(t);showAds();}
      },200);
      setTimeout(function(){clearInterval(check);},5000);
    })();
  </script>` : ''}
  ${getAnalyticsScript()}
  <script>if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(function(){});}</script>
</body>
</html>`;
}

/**
 * Common copy to clipboard function
 * Shows both button state change AND toast notification for consistent feedback
 */
export function getCopyToClipboardScript() {
  return `
    <script>
    function copyToClipboard(text, button) {
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        const originalContent = button.innerHTML;
        const originalClass = button.className;
        
        // Update button state for localized visual feedback
        button.innerHTML = '<span class="flex items-center gap-1">✓ Copied</span>';
        button.classList.add('text-success-600', 'dark:text-success-400', 'bg-success-50', 'dark:bg-success-900/20', 'border-success-200', 'dark:border-success-800');
        button.classList.remove('text-surface-600', 'hover:bg-surface-100');

        // Show toast notification for global feedback
        if (window.Toast && typeof window.Toast.success === 'function') {
          window.Toast.success('Copied to clipboard!');
        }

        setTimeout(() => {
          button.innerHTML = originalContent;
          button.className = originalClass;
        }, 2000);
      }).catch(err => {
        console.error('Copy failed:', err);
        button.innerText = 'Error';

        // Show error toast
        if (window.Toast && typeof window.Toast.error === 'function') {
          window.Toast.error('Failed to copy to clipboard');
        }

        setTimeout(() => button.innerText = 'Copy', 2000);
      });
    }
    </script>
  `;
}

/**
 * Global safety net for clipboard rejections.
 *
 * Many tool routes call `navigator.clipboard.writeText(...)` directly. The
 * call can reject in plenty of contexts (insecure HTTP, iframe without
 * write permission, denied user permission, no user activation). When
 * those rejections aren't caught they surface as `unhandledrejection`
 * page errors — which the exhaustive QA harness flagged on 9+ tools.
 *
 * This script swallows clipboard-only rejections and shows a single user-
 * facing toast instead. It is intentionally narrow: it ONLY catches
 * `NotAllowedError` / `SecurityError` thrown from the Clipboard API and
 * forwards everything else, so we don't hide unrelated bugs.
 */
export function getClipboardSafetyScript() {
  return `
    <script>
    (function () {
      function isClipboardError(reason) {
        if (!reason) return false;
        if (typeof reason === 'string') return /clipboard/i.test(reason);
        var name = reason.name || '';
        var msg = reason.message || String(reason);
        return /clipboard/i.test(msg) ||
               ((name === 'NotAllowedError' || name === 'SecurityError') &&
                /clipboard|write/i.test(msg));
      }
      window.addEventListener('unhandledrejection', function (e) {
        if (!isClipboardError(e.reason)) return;
        e.preventDefault();
        if (window.Toast && typeof window.Toast.error === 'function') {
          window.Toast.error('Could not copy — clipboard access denied. Please copy manually.');
        }
      });
    })();
    </script>
  `;
}

/**
 * Create a feature list definition list.
 * @param {Array<{text: string, tooltip?: string}>} items - Feature items
 * @returns {string} HTML markup
 */
export function createFeatureList(items = []) {
  if (!items || !items.length) return '';
  const itemsHTML = items.map(item => `<dd>${item.text}</dd>`).join('');
  return `<dl data-feature-list>${itemsHTML}</dl>`;
}

/**
 * Create a tool header section.
 * Enforces single-pill policy: max 1 trust pill, rest demoted to feature list.
 */
export function createToolHeader(icon, title, subtitle, badges = [], options = {}) {
  const { toolId } = typeof options === 'string' ? { toolId: options } : (options || {});

  const titleAttr = toolId ? ` data-i18n="tools.${toolId}.name"` : '';
  const subtitleAttr = toolId ? ` data-i18n="tools.${toolId}.desc"` : '';

  // Single-pill policy: first badge is the trust pill, rest are demoted features
  let trustPillHTML = '';
  let demotedFeaturesHTML = '';

  if (badges.length === 1) {
    // Single pill: render as trust pill
    const badge = badges[0];
    const tipAttr = badge.tooltip ? ` data-tooltip="${badge.tooltip}" cursor-help` : '';
    const tipClass = badge.tooltip ? ' cursor-help' : '';
    trustPillHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300${tipClass}" data-trust-pill="${badge.text}"${tipAttr}>
       ${badge.text}
     </span>`;
  } else if (badges.length >= 2) {
    // Multiple pills: first is trust pill, rest are demoted features
    const trustBadge = badges[0];
    const tipAttr = trustBadge.tooltip ? ` data-tooltip="${trustBadge.tooltip}" cursor-help` : '';
    const tipClass = trustBadge.tooltip ? ' cursor-help' : '';
    trustPillHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300${tipClass}" data-trust-pill="${trustBadge.text}"${tipAttr}>
       ${trustBadge.text}
     </span>`;
    demotedFeaturesHTML = createFeatureList(badges.slice(1));
  } else if (badges.length === 0) {
    // No pills: nothing to render
  }

  return `
    <div class="mb-8 border-b border-surface-200 dark:border-surface-800 pb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 p-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
             <span class="text-3xl">${icon.emoji || '🛠️'}</span>
          </div>
          <div>
            <div class="flex items-center gap-3 mb-1 flex-wrap">
              <h1 class="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-50 tracking-tight"${titleAttr}>${title}</h1>
              ${trustPillHTML}
            </div>
            <p class="text-surface-600 dark:text-surface-400 text-sm sm:text-base max-w-2xl"${subtitleAttr}>${subtitle}</p>
            ${demotedFeaturesHTML}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create download/export button functionality
 */
export function infoHint(tooltip, ariaLabel, options = {}) {
  const { large = false, position, i18nKey, icon = 'help' } = options;
  const sizeClass = large ? ' info-hint-lg' : '';
  const posAttr = position ? ` data-tooltip-pos="${position}"` : '';
  const i18nAttr = i18nKey ? ` data-i18n-tooltip="${i18nKey}"` : '';
  const label = ariaLabel || tooltip;
  return `<button type="button" class="info-hint${sizeClass}" data-tooltip="${tooltip}"${posAttr}${i18nAttr} aria-label="${label}"><span class="material-symbols-rounded" aria-hidden="true">${icon}</span></button>`;
}

export function createEmptyState(options = {}) {
  const {
    icon = '📥',
    title = 'No input yet',
    description = 'Paste or type your input above to get started.',
    id = 'empty-state',
    i18nTitle,
    i18nDesc
  } = options;
  const titleAttr = i18nTitle ? ` data-i18n="${i18nTitle}"` : '';
  const descAttr = i18nDesc ? ` data-i18n="${i18nDesc}"` : '';
  return `
    <div id="${id}" class="empty-state">
      <span class="empty-state-icon">${icon}</span>
      <p class="empty-state-title"${titleAttr}>${title}</p>
      <p class="empty-state-desc"${descAttr}>${description}</p>
    </div>
  `;
}

export function getBtnLoadingScript() {
  return `
    <script>
      (function() {
        window.btnLoading = function(btn, fn) {
          if (btn.disabled) return;
          var original = btn.innerHTML;
          var w = btn.offsetWidth;
          btn.style.minWidth = w + 'px';
          btn.disabled = true;
          btn.innerHTML = '<span class="spinner-sm spinner"></span>';
          var start = Date.now();
          Promise.resolve().then(function() {
            return fn();
          }).then(function() {
            var elapsed = Date.now() - start;
            var delay = Math.max(0, 280 - elapsed);
            setTimeout(function() {
              btn.innerHTML = original;
              btn.disabled = false;
              btn.style.minWidth = '';
            }, delay);
          }).catch(function(err) {
            btn.innerHTML = original;
            btn.disabled = false;
            btn.style.minWidth = '';
            console.error(err);
          });
        };
      })();
    </script>
  `;
}

export function getDownloadFileScript() {
   return `
     function downloadFile(content, filename, contentType) {
       const blob = new Blob([content], { type: contentType });
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = filename;
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
       URL.revokeObjectURL(url);
     }
   `;
}

/**
 * Create a mobile tab view for two-pane layouts
 * Shows tab bar on mobile (max-width: 1023px), full layout on desktop
 * @param {Object} options
 * @param {string} options.leftPaneId - ID of left pane element
 * @param {string} options.rightPaneId - ID of right pane element
 * @param {string} options.leftLabel - Label for left tab
 * @param {string} options.rightLabel - Label for right tab
 * @returns {string} HTML for tab bar
 */
export function createMobileTabView(options = {}) {
  const {
    leftPaneId = 'left-pane',
    rightPaneId = 'right-pane',
    leftLabel = 'Left',
    rightLabel = 'Right'
  } = options;

  return `
    <div class="mobile-tab-bar" data-left-pane="${leftPaneId}" data-right-pane="${rightPaneId}">
      <button class="mobile-tab-btn mobile-tab-active" data-tab="left" aria-selected="true" role="tab">
        ${leftLabel}
      </button>
      <button class="mobile-tab-btn" data-tab="right" aria-selected="false" role="tab">
        ${rightLabel}
      </button>
    </div>
  `;
}

/**
 * Get client-side script for mobile tab switching
 * Handles tab clicks and visibility toggling
 * @returns {string} Script tag with tab switching logic
 */
export function getMobileTabScript() {
  return `
    <script>
      (function() {
        const tabBars = document.querySelectorAll('.mobile-tab-bar');
        
        tabBars.forEach(tabBar => {
          const leftPaneId = tabBar.getAttribute('data-left-pane');
          const rightPaneId = tabBar.getAttribute('data-right-pane');
          const leftPane = document.getElementById(leftPaneId);
          const rightPane = document.getElementById(rightPaneId);
          
          if (!leftPane || !rightPane) return;
          
          const buttons = tabBar.querySelectorAll('.mobile-tab-btn');
          
          // Restore saved tab preference or default to left
          let savedTab = 'left';
          try {
            savedTab = localStorage.getItem('mobile-tab-preference') || 'left';
          } catch (e) {}
          
          // Initialize visibility
          const showTab = (tabName) => {
            if (tabName === 'left') {
              leftPane.style.display = '';
              rightPane.style.display = 'none';
            } else {
              leftPane.style.display = 'none';
              rightPane.style.display = '';
            }
            
            // Update button states
            buttons.forEach(btn => {
              const isActive = btn.getAttribute('data-tab') === tabName;
              btn.classList.toggle('mobile-tab-active', isActive);
              btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });
            
            // Save preference
            try {
              localStorage.setItem('mobile-tab-preference', tabName);
            } catch (e) {}
          };
          
          // Set initial tab
          showTab(savedTab);
          
          // Bind click handlers
          buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              const tabName = btn.getAttribute('data-tab');
              showTab(tabName);
            });
          });
        });
      })();
    </script>
  `;
}
