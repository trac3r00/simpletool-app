/**
 * Lightweight i18n system for SimpleTool
 * Supports 10 languages with per-language modules
 * Uses localStorage for persistence
 */

import { CONTENT_TRANSLATIONS } from './content-metadata.js';
import en from '../i18n/en.js';
import ko from '../i18n/ko.js';
import ja from '../i18n/ja.js';
import es from '../i18n/es.js';
import zhCN from '../i18n/zh-CN.js';
import zhTW from '../i18n/zh-TW.js';
import fr from '../i18n/fr.js';
import de from '../i18n/de.js';
import pt from '../i18n/pt.js';
import vi from '../i18n/vi.js';

export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', flag: '🇺🇸' },
  ko: { name: '한국어', flag: '🇰🇷' },
  ja: { name: '日本語', flag: '🇯🇵' },
  es: { name: 'Español', flag: '🇪🇸' },
  'zh-CN': { name: '简体中文', flag: '🇨🇳' },
  'zh-TW': { name: '繁體中文', flag: '🇹🇼' },
  fr: { name: 'Français', flag: '🇫🇷' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  pt: { name: 'Português', flag: '🇧🇷' },
  vi: { name: 'Tiếng Việt', flag: '🇻🇳' }
};

export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGE_QUERY_KEY = 'lang';

const TRANSLATIONS = {
  en,
  ko,
  ja,
  es,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  fr,
  de,
  pt,
  vi
};

function getLanguageCatalog(lang) {
  const normalized = normalizeLanguage(lang);
  const base = TRANSLATIONS[normalized] || TRANSLATIONS[DEFAULT_LANGUAGE];
  const content = CONTENT_TRANSLATIONS[normalized] || CONTENT_TRANSLATIONS[DEFAULT_LANGUAGE];
  return content ? { ...base, content } : base;
}

/**
 * Get current language from localStorage or browser preference
 */
export function getCurrentLanguage() {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const stored = localStorage.getItem('language');
  if (stored && SUPPORTED_LANGUAGES[stored]) return stored;

  const browserLang = normalizeLanguage(navigator.language);
  if (SUPPORTED_LANGUAGES[browserLang]) return browserLang;

  return DEFAULT_LANGUAGE;
}

/**
 * Translate a key path (e.g., 'nav.home')
 */
export function t(path, lang = getCurrentLanguage()) {
  const keys = path.split('.');
  let result = getLanguageCatalog(lang);
  
  for (const key of keys) {
    if (result[key] === undefined) {
      // Fallback to English if key missing in current language
      let fallback = getLanguageCatalog(DEFAULT_LANGUAGE);
      for (const fKey of keys) {
        if (fallback[fKey] === undefined) return path;
        fallback = fallback[fKey];
      }
      return fallback;
    }
    result = result[key];
  }
  
  return result;
}

export function normalizeLanguage(lang) {
  const raw = String(lang || '').trim().toLowerCase();
  const parts = raw.split(/[-_]/);
  const base = parts[0];
  if (base === 'zh') {
    const sub = (parts[1] || '').toUpperCase();
    if (sub === 'TW' || sub === 'HANT') return 'zh-TW';
    return 'zh-CN';
  }
  return SUPPORTED_LANGUAGES[base] ? base : DEFAULT_LANGUAGE;
}

export function resolveRequestLanguage(request, url) {
  const queryLang = url?.searchParams?.get(LANGUAGE_QUERY_KEY);
  if (queryLang && SUPPORTED_LANGUAGES[normalizeLanguage(queryLang)]) {
    return normalizeLanguage(queryLang);
  }

  const acceptLanguage = request?.headers?.get('Accept-Language') || '';
  for (const part of acceptLanguage.split(',')) {
    const code = normalizeLanguage(part.split(';')[0]);
    if (SUPPORTED_LANGUAGES[code]) {
      return code;
    }
  }

  return DEFAULT_LANGUAGE;
}

export function withLanguageQuery(path, lang = DEFAULT_LANGUAGE) {
  if (!path || path.startsWith('http') || path.startsWith('mailto:') || path.startsWith('#')) {
    return path;
  }
  const normalized = normalizeLanguage(lang);
  if (normalized === DEFAULT_LANGUAGE) {
    return path;
  }
  const [pathname, hash = ''] = path.split('#');
  const [base, search = ''] = pathname.split('?');
  const params = new URLSearchParams(search);
  params.set(LANGUAGE_QUERY_KEY, normalized);
  const query = params.toString();
  return `${base}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
}

export function getToolTranslation(toolId, lang = DEFAULT_LANGUAGE) {
  const normalized = normalizeLanguage(lang);
  return TRANSLATIONS[normalized]?.tools?.[toolId] || TRANSLATIONS[DEFAULT_LANGUAGE]?.tools?.[toolId] || null;
}

export function localizeTool(tool, lang = DEFAULT_LANGUAGE) {
  const translation = getToolTranslation(tool?.id, lang);
  if (!translation) return { ...tool };
  return {
    ...tool,
    name: translation.name || tool.name,
    description: translation.desc || tool.description,
    tip: translation.tip || tool.tip
  };
}

export function localizeTools(tools, lang = DEFAULT_LANGUAGE) {
  return (tools || []).map((tool) => localizeTool(tool, lang));
}

/**
 * Get the language bootstrap script to avoid flash of incorrect language
 */
export function getLanguageBootstrapScript(serverLang = DEFAULT_LANGUAGE) {
  return `
    <script data-i18n-bootstrap>
      (function() {
        var supported = ${JSON.stringify(Object.keys(SUPPORTED_LANGUAGES))};
        var params = new URLSearchParams(window.location.search);
        function normLang(s) {
          s = (s || '').trim().toLowerCase();
          var p = s.split(/[-_]/);
          if (p[0] === 'zh') {
            var sub = (p[1] || '').toUpperCase();
            return (sub === 'TW' || sub === 'HANT') ? 'zh-TW' : 'zh-CN';
          }
          return p[0];
        }
        var lang = params.get('${LANGUAGE_QUERY_KEY}') || localStorage.getItem('language') || ${JSON.stringify(serverLang)};
        lang = normLang(lang);
        if (supported.indexOf(lang) === -1) {
          lang = normLang(navigator.language);
          if (supported.indexOf(lang) === -1) lang = ${JSON.stringify(DEFAULT_LANGUAGE)};
        }
        document.documentElement.lang = lang;
      })();
    </script>
  `;
}

/**
 * Get the language management script for the client
 */
export function getLanguageScript(toolId, serverLang = DEFAULT_LANGUAGE) {
  const normalized = normalizeLanguage(serverLang);
  const langsToSend = normalized === DEFAULT_LANGUAGE ? [DEFAULT_LANGUAGE] : [DEFAULT_LANGUAGE, normalized];
  const slim = {};
  for (const lang of langsToSend) {
    const data = getLanguageCatalog(lang);
    slim[lang] = { ...data };
    if (data.tools) {
      const tools = {};
      for (const [id, info] of Object.entries(data.tools)) {
        if (id === toolId) {
          tools[id] = info;
        } else {
          const { ui, js, edu, cheatsheet, ...rest } = info;
          tools[id] = rest;
        }
      }
      slim[lang] = { ...slim[lang], tools };
    }
  }
  const translationsJSON = JSON.stringify(slim);
  return `
    <script>
      (function() {
        var _T = ${translationsJSON};
        var _supported = ${JSON.stringify(Object.keys(SUPPORTED_LANGUAGES))};
        var _langs = ${JSON.stringify(SUPPORTED_LANGUAGES)};

        function _normLang(s) {
          s = (s || '').trim().toLowerCase();
          var p = s.split(/[-_]/);
          if (p[0] === 'zh') {
            var sub = (p[1] || '').toUpperCase();
            return (sub === 'TW' || sub === 'HANT') ? 'zh-TW' : 'zh-CN';
          }
          return p[0];
        }

        function _getLang() {
          var params = new URLSearchParams(window.location.search);
          var s = params.get('${LANGUAGE_QUERY_KEY}') || localStorage.getItem('language') || ${JSON.stringify(serverLang)};
          s = _normLang(s);
          if (s && _supported.indexOf(s) !== -1) return s;
          var b = _normLang(navigator.language);
          if (_supported.indexOf(b) !== -1) return b;
          return ${JSON.stringify(DEFAULT_LANGUAGE)};
        }

        function _resolve(lang, path) {
          var keys = path.split('.');
          var obj = _T[lang] || _T['en'];
          for (var i = 0; i < keys.length; i++) {
            if (obj[keys[i]] === undefined) {
              obj = _T['en'];
              for (var j = 0; j < keys.length; j++) {
                if (obj[keys[j]] === undefined) return path;
                obj = obj[keys[j]];
              }
              return obj;
            }
            obj = obj[keys[i]];
          }
          return obj;
        }

        function _patchDOM(lang) {
          document.querySelectorAll('[data-i18n]').forEach(function(el) {
            var key = el.getAttribute('data-i18n');
            var val = _resolve(lang, key);
            if (typeof val === 'string' && val !== key) el.textContent = val;
          });
          document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
            var key = el.getAttribute('data-i18n-placeholder');
            var val = _resolve(lang, key);
            if (typeof val === 'string' && val !== key) el.placeholder = val;
          });
          document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
            var key = el.getAttribute('data-i18n-title');
            var val = _resolve(lang, key);
            if (typeof val === 'string' && val !== key) el.title = val;
          });
          document.querySelectorAll('[data-i18n-aria]').forEach(function(el) {
            var key = el.getAttribute('data-i18n-aria');
            var val = _resolve(lang, key);
            if (typeof val === 'string' && val !== key) el.setAttribute('aria-label', val);
          });
          document.querySelectorAll('[data-i18n-tooltip]').forEach(function(el) {
            var key = el.getAttribute('data-i18n-tooltip');
            var val = _resolve(lang, key);
            if (typeof val === 'string' && val !== key) el.setAttribute('data-tooltip', val);
          });
          document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
            var key = el.getAttribute('data-i18n-html');
            var val = _resolve(lang, key);
            if (typeof val === 'string' && val !== key) el.innerHTML = val;
          });
          var t = _T[lang] && _T[lang].tools ? _T[lang].tools : null;
          if (t) {
            document.querySelectorAll('[data-tool-id]').forEach(function(card) {
              var id = card.getAttribute('data-tool-id');
              var tr = t[id];
              if (tr) {
                var nameEl = card.querySelector('.tool-name');
                var descEl = card.querySelector('.tool-desc');
                if (nameEl) nameEl.textContent = tr.name;
                if (descEl) descEl.textContent = tr.desc;
              }
            });
          }
          var flagEl = document.querySelector('[aria-haspopup="true"] .text-lg');
          if (flagEl && _langs[lang]) flagEl.textContent = _langs[lang].flag;
          document.querySelectorAll('.language-dropdown [role="menuitem"]').forEach(function(btn) {
            btn.classList.remove('bg-surface-50', 'dark:bg-surface-800/50', 'font-semibold');
          });
          var activeBtn = document.querySelector('.language-dropdown [role="menuitem"]:nth-child(' + (_supported.indexOf(lang) + 1) + ')');
          if (activeBtn) activeBtn.classList.add('bg-surface-50', 'dark:bg-surface-800/50', 'font-semibold');
          var langButton = document.querySelector('[aria-haspopup="true"]');
          if (langButton) {
            var changeLanguageLabel = _resolve(lang, 'nav.changeLanguage');
            if (typeof changeLanguageLabel === 'string' && changeLanguageLabel !== 'nav.changeLanguage') {
              langButton.setAttribute('aria-label', changeLanguageLabel);
              langButton.setAttribute('title', changeLanguageLabel);
            }
          }
          document.querySelectorAll('[data-theme-toggle]').forEach(function(btn) {
            var systemLabel = _resolve(lang, 'nav.toggleTheme');
            var lightLabel = _resolve(lang, 'nav.switchDark');
            var darkLabel = _resolve(lang, 'nav.switchLight');
            btn.setAttribute('data-theme-label-system', systemLabel);
            btn.setAttribute('data-theme-label-light', lightLabel);
            btn.setAttribute('data-theme-label-dark', darkLabel);
            var mode = localStorage.getItem('theme') || 'system';
            var label = mode === 'light' ? lightLabel : mode === 'dark' ? darkLabel : systemLabel;
            btn.setAttribute('title', label);
            btn.setAttribute('aria-label', label);
            var srOnly = btn.querySelector('.sr-only');
            if (srOnly) srOnly.textContent = label;
          });
          // Update page title
          var titleEl = document.querySelector('title');
          if (titleEl && titleEl.getAttribute('data-i18n-title-key')) {
            var titleKey = titleEl.getAttribute('data-i18n-title-key');
            var val = _resolve(lang, titleKey);
            if (typeof val === 'string' && val !== titleKey) document.title = val + ' | SimpleTool';
          }
          // Also try tool-based title update
          var toolId = document.body.getAttribute('data-tool-id') || document.querySelector('[data-tool-page-id]')?.getAttribute('data-tool-page-id');
          if (toolId && _T[lang] && _T[lang].tools && _T[lang].tools[toolId]) {
            document.title = _T[lang].tools[toolId].name + ' | SimpleTool';
          }
        }

        window._t = function(key, fallback) {
          var val = _resolve(_getLang(), key);
          return (val !== key) ? val : (fallback || key);
        };
        window._i18nGetLang = _getLang;
        window._i18nToolTranslations = function() {
          var lang = _getLang();
          return (_T[lang] && _T[lang].tools) ? _T[lang].tools : (_T['en'].tools || {});
        };

        window.setLanguage = function(lang) {
          localStorage.setItem('language', lang);
          var next = new URL(window.location.href);
          if (lang === ${JSON.stringify(DEFAULT_LANGUAGE)}) {
            next.searchParams.delete('${LANGUAGE_QUERY_KEY}');
          } else {
            next.searchParams.set('${LANGUAGE_QUERY_KEY}', lang);
          }
          if (!_T[lang]) {
            window.location.href = next.toString();
            return;
          }
          window.history.replaceState({}, '', next.toString());
          document.documentElement.lang = lang;
          _patchDOM(lang);
        };

        document.addEventListener('DOMContentLoaded', function() {
          var lang = _getLang();
          if (lang !== 'en') _patchDOM(lang);

          var langButton = document.querySelector('[aria-haspopup="true"]');
          var langDropdown = document.querySelector('.language-dropdown');

          if (langButton && langDropdown) {
            var isOpen = false;

            langButton.addEventListener('click', function(e) {
              e.stopPropagation();
              isOpen = !isOpen;
              if (isOpen) {
                langDropdown.classList.remove('hidden');
                langButton.setAttribute('aria-expanded', 'true');
              } else {
                langDropdown.classList.add('hidden');
                langButton.setAttribute('aria-expanded', 'false');
              }
            });

            document.addEventListener('click', function(e) {
              if (!langButton.contains(e.target) && !langDropdown.contains(e.target)) {
                langDropdown.classList.add('hidden');
                langButton.setAttribute('aria-expanded', 'false');
                isOpen = false;
              }
            });

            langDropdown.addEventListener('click', function(e) {
              var btn = e.target.closest('[data-lang]');
              if (btn) {
                window.setLanguage(btn.getAttribute('data-lang'));
              }
              langDropdown.classList.add('hidden');
              langButton.setAttribute('aria-expanded', 'false');
              isOpen = false;
            });

            document.addEventListener('keydown', function(e) {
              if (!isOpen) return;
              var items = langDropdown.querySelectorAll('[data-lang]');
              var focused = langDropdown.querySelector('[data-lang]:focus');
              var idx = Array.prototype.indexOf.call(items, focused);
              if (e.key === 'Escape') {
                langDropdown.classList.add('hidden');
                langButton.setAttribute('aria-expanded', 'false');
                isOpen = false;
                langButton.focus();
                e.preventDefault();
              } else if (e.key === 'ArrowDown') {
                var next = idx < items.length - 1 ? idx + 1 : 0;
                items[next].focus();
                e.preventDefault();
              } else if (e.key === 'ArrowUp') {
                var prev = idx > 0 ? idx - 1 : items.length - 1;
                items[prev].focus();
                e.preventDefault();
              }
            });
          }
        });
      })();
    </script>
  `;
}

/**
 * Get language selector HTML
 */
export function getLanguageSelectorHTML(lang = DEFAULT_LANGUAGE) {
  const current = normalizeLanguage(lang);
  const changeLanguageLabel = t('nav.changeLanguage', current);
  const options = Object.entries(SUPPORTED_LANGUAGES).map(([code, { name, flag }]) => `
    <button data-lang="${code}" 
            class="flex items-center gap-2 w-full px-4 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors ${current === code ? 'bg-surface-50 dark:bg-surface-800/50 font-semibold' : ''}"
            role="menuitem">
      <span>${flag}</span>
      <span>${name}</span>
    </button>
  `).join('');

  return `
    <div class="relative inline-block text-left group">
      <button type="button"
              class="flex items-center gap-2 p-2 rounded-lg text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-haspopup="true"
              aria-expanded="false"
              aria-label="${changeLanguageLabel}"
              title="${changeLanguageLabel}"
              data-i18n-aria="nav.changeLanguage"
              data-i18n-title="nav.changeLanguage">
        <span class="text-lg" aria-hidden="true">${SUPPORTED_LANGUAGES[current].flag}</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div class="language-dropdown absolute right-0 mt-2 w-44 max-h-80 origin-top-right rounded-md bg-white dark:bg-surface-900 shadow-lg ring-1 ring-black/5 focus:outline-none hidden z-[60] border border-surface-200 dark:border-surface-800 overflow-y-auto">
        <div class="py-1" role="menu" aria-orientation="vertical">
          ${options}
        </div>
      </div>
    </div>
  `;
}
