/**
 * Home page with clean, engineer-focused design
 */

import { respondHTML } from '../utils/respond.js';
import { getThemeScript, getThemeBootstrapScript, getNavigationHTML, getStylesheetLinks, getGtagScript, getAdSenseScript, getAdSlotHTML, getFooterHTML, getSearchScript, t, getLanguageScript, getLanguageBootstrapScript, getAnalyticsScript, getAlternateLanguageLinks } from '../utils/common-ui.js';
import { getToolsForEnvironment, CATEGORIES } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, localizeTools, normalizeLanguage, withLanguageQuery } from '../utils/i18n.js';

export function renderHomePage({ isDev = false, lang = DEFAULT_LANGUAGE } = {}) {
  const currentLang = normalizeLanguage(lang);
  const tools = localizeTools(getToolsForEnvironment(isDev), currentLang);
  const categories = groupToolsByCategory(tools);
  const homeTitle = t('home.meta.title', currentLang);
  const homeDescription = t('home.meta.description', currentLang);
  const homePath = withLanguageQuery('/', currentLang);
  const homeUrl = `https://simpletool.app${homePath}`;
  const searchTarget = `https://simpletool.app${withLanguageQuery('/?q={search_term_string}', currentLang)}`;

  const html = `<!DOCTYPE html>
<html lang="${currentLang}" class="scroll-smooth" style="visibility:hidden">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${homeTitle}</title>
  <meta name="description" content="${homeDescription}">
  <link rel="canonical" href="${homeUrl}">
  ${getAlternateLanguageLinks('/', currentLang)}
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#4f46e5">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${homeUrl}">
  <meta property="og:title" content="${homeTitle}">
  <meta property="og:description" content="${homeDescription}">
  <meta property="og:site_name" content="SimpleTool">
  <meta property="og:image" content="https://simpletool.app/og-image.svg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${homeTitle}">
  <meta name="twitter:description" content="${homeDescription}">
  <meta name="twitter:image" content="https://simpletool.app/og-image.svg">
  <meta name="keywords" content="online tools, developer tools, JSON formatter, password generator, hash calculator, UUID generator, regex tester, base64 decoder, QR code generator, free tools, privacy tools"><!-- TODO: translate via t('home.meta.keywords', currentLang) once key is added to i18n files -->
  ${getThemeBootstrapScript()}
  ${getLanguageBootstrapScript(currentLang)}
  ${getGtagScript()}
  ${getAdSenseScript()}
  ${getStylesheetLinks()}
</head>
<body class="bg-surface-50 text-surface-900 dark:bg-surface-950 dark:text-surface-50 transition-colors duration-200 flex flex-col min-h-screen">
  <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded">Skip to main content</a>

  ${getNavigationHTML({ maxWidth: 'max-w-7xl', lang: currentLang })}

  <!-- Hero Section -->
  <div id="main-content"></div>
  <header class="pt-16 pb-12 sm:pt-24 sm:pb-16 bg-white dark:bg-surface-950 border-b border-surface-200 dark:border-surface-800 hexagon-pattern">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-surface-900 dark:text-surface-50 mb-6">
        ${t('home.heroTitle', currentLang)}
      </h1>
      <p class="text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        <span data-i18n="home.heroLine1">${t('home.heroLine1', currentLang)}</span> <br class="hidden sm:inline">
        <span data-i18n="home.heroLine2">${t('home.heroLine2', currentLang)}</span>
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

    <!-- Empty state when search query matches no tools -->
    <div id="search-empty-state" class="hidden text-center py-16">
      <div class="text-6xl mb-4" aria-hidden="true">🔍</div>
      <p class="text-lg text-surface-700 dark:text-surface-300">
        ${t('home.noResults', currentLang)}
        <span id="search-empty-query" class="font-semibold text-surface-900 dark:text-surface-100"></span>
      </p>
      <p class="text-sm text-surface-500 dark:text-surface-500 mt-2" data-i18n="home.noResultsHint">Try a different search term.</p>
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
    url: homeUrl,
    description: homeDescription,
    potentialAction: {
      '@type': 'SearchAction',
      target: searchTarget,
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
    itemListElement: tools.map((tool, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: tool.name,
      url: `https://simpletool.app${withLanguageQuery(tool.path, currentLang)}`
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
      const heroSearch = document.getElementById('tool-search');
      const emptyState = document.getElementById('search-empty-state');
      const emptyQueryEl = document.getElementById('search-empty-query');
      const legacyResultsContainer = document.getElementById('search-results-container');

      // Conditionally autofocus on desktop only (viewport width > 640px)
      if (heroSearch && window.innerWidth > 640) {
        heroSearch.focus();
      }

      function filterCards(query) {
        const q = (query || '').toLowerCase().trim();
        const allCards = document.querySelectorAll('[data-tool-id]');
        let visibleCount = 0;

        allCards.forEach(function(card) {
          if (!q) {
            card.classList.remove('hidden');
            visibleCount++;
            return;
          }
          const name = (card.dataset.toolName || '').toLowerCase();
          const desc = (card.dataset.toolDesc || '').toLowerCase();
          const tags = (card.dataset.toolTags || '').toLowerCase();
          // Also match rendered text content (handles client-side i18n language switches)
          const nameEl = card.querySelector('.tool-name');
          const descEl = card.querySelector('.tool-desc');
          const renderedName = nameEl ? nameEl.textContent.toLowerCase() : '';
          const renderedDesc = descEl ? descEl.textContent.toLowerCase() : '';
          const matches = name.indexOf(q) >= 0 || desc.indexOf(q) >= 0 || tags.indexOf(q) >= 0
                       || renderedName.indexOf(q) >= 0 || renderedDesc.indexOf(q) >= 0;
          card.classList.toggle('hidden', !matches);
          if (matches) visibleCount++;
        });

        document.querySelectorAll('.category-section, #favorites-section, #recent-section').forEach(function(section) {
          if (!q) {
            // Restore sections previously hidden by search
            if (section.dataset.searchHidden === '1') {
              section.classList.remove('hidden');
              delete section.dataset.searchHidden;
            }
            return;
          }
          const visibleInSection = section.querySelectorAll('[data-tool-id]:not(.hidden)').length;
          if (visibleInSection === 0) {
            if (!section.classList.contains('hidden')) {
              section.dataset.searchHidden = '1';
              section.classList.add('hidden');
            }
          } else if (section.dataset.searchHidden === '1') {
            section.classList.remove('hidden');
            delete section.dataset.searchHidden;
          }
        });

        if (legacyResultsContainer) legacyResultsContainer.classList.add('hidden');

        if (emptyState) {
          const showEmpty = !!q && visibleCount === 0;
          emptyState.classList.toggle('hidden', !showEmpty);
          if (showEmpty && emptyQueryEl) emptyQueryEl.textContent = '"' + query + '"';
        }
      }

      if (heroSearch) {
        heroSearch.addEventListener('input', function(e) { filterCards(e.target.value); });
      }

      // Wire nav-search-btn click → focus hero search (capture-phase to override modal).
      // The common-ui search script also binds a click listener that opens a modal;
      // we intercept at the capture phase on the document so the modal handler never fires.
      document.addEventListener('click', function(e) {
        const target = e.target;
        if (target && target.closest && target.closest('#nav-search-btn')) {
          if (heroSearch && heroSearch.offsetParent !== null) {
            e.stopImmediatePropagation();
            e.preventDefault();
            heroSearch.focus();
            heroSearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, true);
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
      var allTools = ${JSON.stringify(tools.map(t => ({ id: t.id, name: t.name, path: withLanguageQuery(t.path, currentLang), icon: t.icon, description: t.description, badge: t.badge || '', keywords: t.keywords || '' })))};
      var toolMap = {};
      allTools.forEach(function(t) { toolMap[t.id] = t; });

      function readLS(key) {
        try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : []; } catch(e) { return []; }
      }

      function escAttr(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      function renderCard(tool) {
        var badge = tool.badge ? '<span class="px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 rounded-full">' + tool.badge + '</span>' : '';
        var dataAttrs = 'data-tool-id="' + escAttr(tool.id) + '" data-tool-name="' + escAttr(tool.name) + '" data-tool-desc="' + escAttr(tool.description) + '" data-tool-tags="' + escAttr(tool.keywords || '') + '"';
        return '<a href="' + tool.path + '" ' + dataAttrs + ' class="tool-card group flex flex-col p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200">' +
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
  return Object.entries(categories).map(([key, section]) => `
    <section class="category-section">
      <div class="flex items-center gap-3 mb-6">
        <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100 uppercase tracking-wide" data-i18n="home.cat.${key}">
          ${t('home.cat.' + key, lang)}
        </h2>
        <span class="text-xs font-medium text-surface-400 bg-surface-100 dark:bg-surface-800 dark:text-surface-500 px-2 py-0.5 rounded-full">${section.tools.length}</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${section.tools.map(tool => renderToolCard(tool, lang)).join('')}
      </div>
    </section>
  `).join('');
}

function escapeAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderToolCard(tool, lang = DEFAULT_LANGUAGE) {
  const tags = [tool.keywords || '', ...(tool.tags || [])].filter(Boolean).join(' ');
  return `
    <a href="${withLanguageQuery(tool.path, lang)}" 
       class="tool-card group flex flex-col p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200"
       data-tool-id="${escapeAttr(tool.id)}"
       data-tool-name="${escapeAttr(tool.name)}"
       data-tool-desc="${escapeAttr(tool.description)}"
       data-tool-tags="${escapeAttr(tags)}">
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
