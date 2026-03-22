/**
 * Home page with clean, engineer-focused design
 */

import { respondHTML } from '../utils/respond.js';
import { getThemeScript, getThemeBootstrapScript, getNavigationHTML, getStylesheetLinks, getGtagScript, getAdSenseScript, getAdSlotHTML, getFooterHTML, getSearchScript, t, getLanguageScript, getLanguageBootstrapScript, getAnalyticsScript } from '../utils/common-ui.js';
import { getToolsForEnvironment, CATEGORIES } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, localizeTools, normalizeLanguage, withLanguageQuery } from '../utils/i18n.js';

export function renderHomePage({ isDev = false, lang = DEFAULT_LANGUAGE } = {}) {
  const currentLang = normalizeLanguage(lang);
  const tools = localizeTools(getToolsForEnvironment(isDev), currentLang);
  const categories = groupToolsByCategory(tools);
  const homeTitle = t('home.meta.title', currentLang);
  const homeDescription = t('home.meta.description', currentLang);

  const html = `<!DOCTYPE html>
<html lang="${currentLang}" class="scroll-smooth" style="visibility:hidden">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${homeTitle}</title>
  <meta name="description" content="${homeDescription}">
  <link rel="canonical" href="https://simpletool.app">
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#4f46e5">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://simpletool.app">
  <meta property="og:title" content="${homeTitle}">
  <meta property="og:description" content="${homeDescription}">
  <meta property="og:site_name" content="SimpleTool">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${homeTitle}">
  <meta name="twitter:description" content="${homeDescription}">
  <meta name="keywords" content="online tools, developer tools, JSON formatter, password generator, hash calculator, UUID generator, regex tester, base64 decoder, QR code generator, free tools, privacy tools">
  ${getThemeBootstrapScript()}
  ${getLanguageBootstrapScript(currentLang)}
  ${getGtagScript()}
  ${getAdSenseScript()}
  ${getStylesheetLinks()}
</head>
<body class="bg-surface-50 text-surface-900 dark:bg-surface-950 dark:text-surface-50 transition-colors duration-200 flex flex-col min-h-screen">

  ${getNavigationHTML({ maxWidth: 'max-w-7xl', lang: currentLang })}

  <!-- Hero Section -->
  <header class="pt-16 pb-12 sm:pt-24 sm:pb-16 bg-white dark:bg-surface-950 border-b border-surface-200 dark:border-surface-800 hexagon-pattern">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-surface-900 dark:text-surface-50 mb-6">
        ${t('home.heroTitle', currentLang)}
      </h1>
      <p class="text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        <span data-i18n="home.heroLine1">A collection of free, privacy-first tools for your daily workflow.</span> <br class="hidden sm:inline">
        <span data-i18n="home.heroLine2">No tracking, no data collection — just tools that work.</span>
      </p>
      
      <!-- Search Input -->
      <div class="max-w-2xl mx-auto relative group">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-surface-400 group-focus-within:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
         <input type="text"
                id="tool-search"
                class="block w-full pl-11 pr-4 py-4 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl text-surface-900 dark:text-surface-50 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow shadow-sm"
                placeholder="${t('nav.search', currentLang)}"
                data-i18n-placeholder="nav.search"
                aria-label="${t('nav.search', currentLang)}"
                data-autofocus-desktop>
        <div class="absolute inset-y-0 right-0 pr-4 flex items-center">
          <span class="text-xs text-surface-400 border border-surface-200 dark:border-surface-700 rounded px-1.5 py-0.5 hidden sm:block">⌘K</span>
        </div>
      </div>
    </div>
  </header>


  ${getAdSlotHTML('home', {
    wrapperClassName: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'
  })}

  <!-- Tools Grid -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 flex-grow">
    <!-- Favorites Section (populated client-side from localStorage) -->
    <div id="favorites-section" class="hidden space-y-6">
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-lg bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300">⭐</span>
        <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100 uppercase tracking-wide" data-i18n="home.favorites">${t('home.favorites', currentLang)}</h2>
        <span id="favorites-count" class="text-xs font-medium text-surface-400 bg-surface-100 dark:bg-surface-800 dark:text-surface-500 px-2 py-0.5 rounded-full">0</span>
      </div>
      <div id="favorites-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
    </div>

    <!-- Recently Used Section (populated client-side from localStorage) -->
    <div id="recent-section" class="hidden space-y-6">
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-lg bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">🕐</span>
        <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100 uppercase tracking-wide" data-i18n="home.recentlyUsed">${t('home.recentlyUsed', currentLang)}</h2>
        <span id="recent-count" class="text-xs font-medium text-surface-400 bg-surface-100 dark:bg-surface-800 dark:text-surface-500 px-2 py-0.5 rounded-full">0</span>
      </div>
      <div id="recent-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
    </div>

    <div id="search-results-container" class="hidden space-y-8">
      <h2 id="search-results-heading" class="text-lg font-bold text-surface-900 dark:text-surface-100 mb-6 flex items-center gap-2 uppercase tracking-wide">
        🔍 <span id="search-results-label" data-i18n="home.searchResultsLabel">${t('home.searchResultsLabel', currentLang)}</span>
        <span id="search-results-count" class="text-xs font-medium text-surface-400 bg-surface-100 dark:bg-surface-800 dark:text-surface-500 px-2 py-0.5 rounded-full"></span>
      </h2>
      <div id="search-results-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Search results injected here -->
      </div>
    </div>

    <div id="tools-categories-container" class="space-y-16">
      ${renderCategories(categories, currentLang)}
    </div>
  </main>

  ${getAdSlotHTML('bottom', {
    wrapperClassName: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-8 border-t border-surface-200 dark:border-surface-800'
  })}

  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SimpleTool',
    url: 'https://simpletool.app',
    description: homeDescription,
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://simpletool.app/?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  })}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('home.heroTitle', currentLang),
    numberOfItems: tools.length,
    itemListElement: tools.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      url: `https://simpletool.app${t.path}`
    }))
  })}
  </script>

  <!-- Footer -->
  ${getFooterHTML({ lang: currentLang })}

  ${getThemeScript()}
  ${getLanguageScript('', currentLang)}
  ${getSearchScript({ lang: currentLang })}
   <script>
     (function() {
       const searchInput = document.getElementById('tool-search');
       const resultsContainer = document.getElementById('search-results-container');
       const resultsGrid = document.getElementById('search-results-grid');
       const categoriesContainer = document.getElementById('tools-categories-container');
       
       // Conditionally autofocus on desktop only (viewport width > 640px)
       if (window.innerWidth > 640) {
         searchInput.focus();
       }
       
       // Get tools from the global search script's context if possible, or we can just use the same data
       // Since we want to find ALL tools, we'll use the same tools array that getSearchScript uses.
       // We'll wait for the global script to be ready or just redefine the tools list here for simplicity
       // but a better way is to expose it.
      
      function renderToolCard(tool) {
        var _tr = (typeof window._i18nToolTranslations === 'function') ? window._i18nToolTranslations() : {};
        var t = tool.id ? _tr[tool.id] : null;
        var dName = (t && t.name) ? t.name : tool.name;
        var dDesc = (t && t.desc) ? t.desc : tool.description;
        return \`
          <a href="\${tool.path}" 
             class="tool-card group flex flex-col p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200">
            <div class="flex items-start justify-between mb-3">
              <div class="text-3xl bg-surface-50 dark:bg-surface-800 p-2 rounded-lg border border-surface-100 dark:border-surface-700 group-hover:scale-110 transition-transform duration-200">
                \${tool.icon}
              </div>
            </div>
            <h3 class="font-bold text-surface-900 dark:text-surface-50 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              \${dName}
            </h3>
            <p class="text-sm text-surface-500 dark:text-surface-400 leading-relaxed line-clamp-2">
              \${dDesc}
            </p>
          </a>
        \`;
      }

      function filterTools(query) {
        const term = query.trim();
        
        if (!term) {
          resultsContainer.classList.add('hidden');
          categoriesContainer.classList.remove('hidden');
          return;
        }

        // Use the fuzzySearch function defined in getSearchScript
        if (typeof window.fuzzySearch !== 'function') return;

        // We need the tools list. Since it's not exported from the closure in getSearchScript,
        // we'll have to rely on the fact that we know what's in it or expose it.
        // For now, let's assume we can get it from the DOM or just re-pass it.
        // Actually, let's just use the tools we have in the registry.
        const tools = ${JSON.stringify(tools.map(t => ({ id: t.id, name: t.name, path: t.path, icon: t.icon, description: t.description, keywords: t.keywords })))};
        
        const filtered = window.fuzzySearch(term, tools);

        var countEl = document.getElementById('search-results-count');
        countEl.textContent = filtered.length;

        if (filtered.length > 0) {
          resultsGrid.innerHTML = filtered.map(tool => renderToolCard(tool)).join('');
          // Highlight matched terms in card names and descriptions
          var escaped = term.replace(/[-.*+?^$|(){}[\\]\\\\]/g, '\\\\$&');
          var re = new RegExp('(' + escaped + ')', 'gi');
          resultsGrid.querySelectorAll('.tool-name, .tool-desc').forEach(function(el) {
            var orig = el.textContent;
            if (re.test(orig)) {
              el.innerHTML = orig.replace(re, '<mark class="bg-warning-200 dark:bg-warning-800/60 text-inherit rounded px-0.5">$1</mark>');
            }
          });
          resultsContainer.classList.remove('hidden');
          categoriesContainer.classList.add('hidden');
        } else {
          resultsGrid.innerHTML = '<p class="col-span-full text-center py-12 text-surface-500">${t('home.noResults', currentLang)}</p>';
          resultsContainer.classList.remove('hidden');
          categoriesContainer.classList.add('hidden');
        }
      }

      searchInput.addEventListener('input', (e) => filterTools(e.target.value));
    })();
  </script>
  <script>
    (function(){
      function showAds(){document.querySelectorAll('[data-ad-container]').forEach(function(el){el.style.display=''});}
      var check=setInterval(function(){
        var ins=document.querySelector('ins.adsbygoogle');
        if(ins&&(ins.dataset.adStatus||ins.childElementCount>0)){clearInterval(check);showAds();}
      },200);
      setTimeout(function(){clearInterval(check);},5000);
    })();
  </script>
  <script>
    (function() {
      var RECENT_KEY = 'simpletool-recent';
      var FAV_KEY = 'simpletool-favorites';
      var allTools = ${JSON.stringify(tools.map(t => ({ id: t.id, name: t.name, path: withLanguageQuery(t.path, currentLang), icon: t.icon, description: t.description, badge: t.badge || '' })))};
      var toolMap = {};
      allTools.forEach(function(t) { toolMap[t.id] = t; });

      function readLS(key) {
        try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : []; } catch(e) { return []; }
      }

      function renderCard(tool) {
        var badge = tool.badge ? '<span class="px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 rounded-full">' + tool.badge + '</span>' : '';
        return '<a href="' + tool.path + '" class="tool-card group flex flex-col p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200">' +
          '<div class="flex items-start justify-between mb-3"><div class="text-3xl bg-surface-50 dark:bg-surface-800 p-2 rounded-lg border border-surface-100 dark:border-surface-700 group-hover:scale-110 transition-transform duration-200">' + tool.icon + '</div>' + badge + '</div>' +
          '<h3 class="tool-name font-bold text-surface-900 dark:text-surface-50 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">' + tool.name + '</h3>' +
          '<p class="tool-desc text-sm text-surface-500 dark:text-surface-400 leading-relaxed line-clamp-2">' + tool.description + '</p></a>';
      }

      function populate(sectionId, gridId, countId, ids) {
        var tools = ids.map(function(id) { return toolMap[id]; }).filter(Boolean);
        if (tools.length === 0) return;
        document.getElementById(sectionId).classList.remove('hidden');
        document.getElementById(countId).textContent = tools.length;
        document.getElementById(gridId).innerHTML = tools.map(renderCard).join('');
      }

      populate('favorites-section', 'favorites-grid', 'favorites-count', readLS(FAV_KEY));
      populate('recent-section', 'recent-grid', 'recent-count', readLS(RECENT_KEY));
    })();
  </script>
  ${getAnalyticsScript()}
  <script>if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(function(){});}</script>
</body>
</html>`;

  return respondHTML(html);
}

function renderCategories(categories, lang = DEFAULT_LANGUAGE) {
   const accentColors = {
     formatters: 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300',
     security: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300',
     network: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
     generators: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
      utils: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
      game: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300'
   };

  return Object.entries(categories).map(([key, section]) => `
    <section class="category-section">
      <div class="flex items-center gap-3 mb-6">
        <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-lg ${accentColors[key] || ''}">${section.icon}</span>
        <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100 uppercase tracking-wide" data-i18n="home.cat.${key}">
          ${section.title}
        </h2>
        <span class="text-xs font-medium text-surface-400 bg-surface-100 dark:bg-surface-800 dark:text-surface-500 px-2 py-0.5 rounded-full">${section.tools.length}</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${section.tools.map(tool => renderToolCard(tool, lang)).join('')}
      </div>
    </section>
  `).join('');
}

function renderToolCard(tool, lang = DEFAULT_LANGUAGE) {
  return `
    <a href="${withLanguageQuery(tool.path, lang)}" 
       class="tool-card group flex flex-col p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200"
       data-tool-id="${tool.id}"
       data-name="${tool.name}"
       data-keywords="${tool.description} ${tool.keywords || ''}">
      <div class="flex items-start justify-between mb-3">
        <div class="text-3xl bg-surface-50 dark:bg-surface-800 p-2 rounded-lg border border-surface-100 dark:border-surface-700 group-hover:scale-110 transition-transform duration-200">
          ${tool.icon}
        </div>
        ${tool.badge ? `<span class="px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 rounded-full">${tool.badge}</span>` : ''}
      </div>
      <h3 class="tool-name font-bold text-surface-900 dark:text-surface-50 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
        ${tool.name}
      </h3>
      <p class="tool-desc text-sm text-surface-500 dark:text-surface-400 leading-relaxed line-clamp-2">
        ${tool.description}
      </p>
    </a>
  `;
}

function groupToolsByCategory(tools) {
  const categories = Object.fromEntries(
    Object.entries(CATEGORIES).map(([key, meta]) => [key, { ...meta, tools: [] }])
  );

  tools.forEach(tool => {
    const cat = tool.category && categories[tool.category] ? tool.category : 'utils';
    categories[cat].tools.push(tool);
  });

  // Filter out empty categories
  const filtered = {};
  for (const [key, section] of Object.entries(categories)) {
    if (section.tools.length > 0) {
      filtered[key] = section;
    }
  }

  return filtered;
}
