/**
 * /tools — the full catalog: search, favorites, recently used, and every tool
 * grouped by category. The landing page at / links here.
 */

import { respondHTML } from "../utils/respond.js";
import { createPageTemplate, t } from "../utils/common-ui.js";
import { getToolsForEnvironment, CATEGORIES } from "../utils/tool-registry.js";
import {
  DEFAULT_LANGUAGE,
  localizeTools,
  normalizeLanguage,
  withLanguageQuery,
} from "../utils/i18n.js";
import { categoryIcon, toolSymbol } from "./home-icons.js";
import { matchesToolQuery } from "../utils/tool-search.js";

export function stripLeadingEmoji(value) {
  return String(value).replace(
    /^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]+\s*/u,
    "",
  );
}

export function renderToolsPage({
  isDev = false,
  lang = DEFAULT_LANGUAGE,
} = {}) {
  const currentLang = normalizeLanguage(lang);
  const tools = localizeTools(getToolsForEnvironment(isDev), currentLang);
  const categories = groupToolsByCategory(tools);
  const pageTitle = t("catalog.meta.title", currentLang);
  const pageDescription = t("catalog.meta.description", currentLang);

  const content = `
  <header class="hexagon-pattern pt-10 pb-2 sm:pt-12">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h1 class="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl" data-i18n="catalog.title">${t("catalog.title", currentLang)}</h1>
      <p class="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground" data-i18n="catalog.subtitle">${t("catalog.subtitle", currentLang)}</p>

      <div class="relative mt-6 max-w-xl group">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <span class="material-symbols-rounded text-[20px] text-muted-foreground group-focus-within:text-primary" aria-hidden="true" data-icon="search"></span>
        </div>
         <input type="text"
                id="tool-search"
                class="input w-full rounded-lg bg-card py-3 pl-11 pr-16 text-base shadow-sm"
                placeholder="${t("nav.searchTools", currentLang)}"
                data-i18n-placeholder="nav.searchTools"
                aria-label="${t("nav.searchTools", currentLang)}">
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <kbd class="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-xs text-muted-foreground sm:block">⌘K</kbd>
        </div>
      </div>
    </div>
  </header>

  <!-- Tools Grid -->
  <main class="mx-auto flex max-w-7xl flex-grow flex-col gap-12 px-4 py-10 sm:px-6 lg:px-8">
    <!-- Favorites Section (populated client-side from localStorage) -->
    <div id="favorites-section" class="hidden space-y-4">
      <div class="home-section-heading">
        <span class="material-symbols-rounded text-[18px] text-warning-700 dark:text-warning-300" aria-hidden="true" data-icon="star"></span>
        <h2 data-i18n="home.favorites">${t("home.favorites", currentLang)}</h2>
        <span id="favorites-count" class="home-count">0</span>
      </div>
      <div id="favorites-grid" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"></div>
    </div>

    <!-- Recently Used Section (populated client-side from localStorage) -->
    <div id="recent-section" class="hidden space-y-4">
      <div class="home-section-heading">
        <span class="material-symbols-rounded text-[18px] text-muted-foreground" aria-hidden="true" data-icon="history"></span>
        <h2 data-i18n="home.recentlyUsed">${t("home.recentlyUsed", currentLang)}</h2>
        <span id="recent-count" class="home-count">0</span>
      </div>
      <div id="recent-grid" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"></div>
    </div>

    <div id="search-results-container" class="hidden space-y-8">
      <h2 id="search-results-heading" class="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-6 flex items-center gap-2 uppercase tracking-wide">
        <span class="material-symbols-rounded text-[20px]" aria-hidden="true" data-icon="search"></span>
        <span id="search-results-label" data-i18n="home.searchResultsLabel">${t("home.searchResultsLabel", currentLang)}</span>
        <span id="search-results-count" class="text-xs font-medium text-surface-500 bg-surface-100 dark:bg-surface-800 dark:text-surface-400 px-2 py-0.5 rounded-full"></span>
      </h2>
      <div id="search-results-grid" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <!-- Search results injected here -->
      </div>
    </div>

    <div id="tools-categories-container" class="space-y-12">
      ${renderCategories(categories, currentLang)}
    </div>

    <div id="search-empty-state" class="hidden py-16 text-center">
      <div class="mb-4" aria-hidden="true"><span class="material-symbols-rounded text-5xl text-surface-400" aria-hidden="true" data-icon="search"></span></div>
      <p class="text-lg text-surface-700 dark:text-surface-300">
        ${t("home.noResults", currentLang)}
        <span id="search-empty-query" class="font-semibold text-surface-900 dark:text-surface-100"></span>
      </p>
      <p class="mt-2 text-sm text-surface-500 dark:text-surface-400" data-i18n="home.noResultsHint">Try a different search term.</p>
    </div>

  </main>`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: pageTitle,
        numberOfItems: tools.length,
        itemListElement: tools.map((tool, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: tool.name,
          url: `https://simpletool.app${withLanguageQuery(tool.path, currentLang)}`,
        })),
      },
    ],
  };

  const scripts = `
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

      var matchesToolQuery = ${matchesToolQuery.toString()};

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
          const matches = matchesToolQuery([name, desc, tags, renderedName, renderedDesc].join(' '), q);
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
            const countEl = section.querySelector('.category-count');
            if (countEl) {
              countEl.textContent = String(section.querySelectorAll('[data-tool-id]').length);
            }
            return;
          }
          const visibleInSection = section.querySelectorAll('[data-tool-id]:not(.hidden)').length;
          const countEl = section.querySelector('.category-count, [id$="-count"]');
          if (countEl && section.classList.contains('category-section')) {
            countEl.textContent = String(visibleInSection);
          }
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

      // Sync URL ?q= as user types (debounced)
      var _qSyncTimer = null;
      function syncQueryToURL(value) {
        clearTimeout(_qSyncTimer);
        _qSyncTimer = setTimeout(function() {
          var url = new URL(window.location.href);
          var v = (value || '').trim();
          if (v) {
            url.searchParams.set('q', v);
          } else {
            url.searchParams.delete('q');
          }
          if (url.search !== window.location.search) {
            history.replaceState(null, '', url.toString());
          }
        }, 300);
      }

      // Honor deep-link ?q= parameter
      var _urlQ = new URLSearchParams(window.location.search).get('q');
      if (heroSearch && _urlQ) {
        heroSearch.value = _urlQ;
        filterCards(_urlQ);
        var _len = heroSearch.value.length;
        heroSearch.setSelectionRange(_len, _len);
        if (window.innerWidth > 640) {
          heroSearch.focus();
        }
      }

      if (heroSearch) {
        heroSearch.addEventListener('input', function(e) { filterCards(e.target.value); syncQueryToURL(e.target.value); });
      }

      // Wire nav-search-btn click → focus hero search (capture-phase to override modal).
      // The common-ui search script also binds a click listener that opens a modal;
      // we intercept at the capture phase on the document so the modal handler never fires.
      document.addEventListener('click', function(e) {
        const target = e.target;
        if (target && target.closest && target.closest('#nav-search-btn, #mobile-search-btn')) {
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
    (function() {
      var RECENT_KEY = 'simpletool-recent';
      var FAV_KEY = 'simpletool-favorites';
      var allTools = ${JSON.stringify(tools.map((item) => ({ id: item.id, name: item.name, path: withLanguageQuery(item.path, currentLang), symbol: toolSymbol(item.id), description: item.description, badge: item.badge || "", keywords: item.keywords || "" })))};
      var toolMap = {};
      allTools.forEach(function(t) { toolMap[t.id] = t; });

      function readLS(key) {
        try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : []; } catch(e) { return []; }
      }

      function escAttr(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      // Mirrors renderToolCard() on the server so restored rows match the grid.
      function renderCard(tool) {
        var badge = tool.badge ? '<span class="home-badge">' + tool.badge + '</span>' : '';
        var dataAttrs = 'data-tool-id="' + escAttr(tool.id) + '" data-tool-name="' + escAttr(tool.name) + '" data-tool-desc="' + escAttr(tool.description) + '" data-tool-tags="' + escAttr(tool.keywords || '') + '"';
        return '<a href="' + tool.path + '" ' + dataAttrs + ' class="tool-card tool-card-link home-tool-card group">' +
          '<span class="home-tool-icon"><span class="material-symbols-rounded text-[20px]" aria-hidden="true" data-icon="' + tool.symbol + '"></span></span>' +
          '<div class="min-w-0"><div class="flex items-center gap-2"><h3 class="tool-name home-tool-name">' + tool.name + '</h3>' + badge + '</div>' +
          '<p class="tool-desc home-tool-desc">' + tool.description + '</p></div></a>';
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
  </script>`;

  return respondHTML(
    createPageTemplate({
      title: pageTitle,
      description: pageDescription,
      keywords: t("home.meta.keywords", currentLang),
      content,
      path: "/tools",
      lang: currentLang,
      schema,
      scripts,
      includeToolUtilities: false,
    }),
  );
}

function renderCategories(categories, lang = DEFAULT_LANGUAGE) {
  return Object.entries(categories)
    .map(
      ([key, section]) => `
    <section class="category-section scroll-mt-20" id="category-${key}">
      <div class="home-section-heading mb-4">
        <span class="material-symbols-rounded text-[18px] text-primary" aria-hidden="true" data-icon="${categoryIcon(key)}"></span>
        <h2 data-i18n="home.cat.${key}">${stripLeadingEmoji(t("home.cat." + key, lang))}</h2>
        <span class="category-count home-count">${section.tools.length}</span>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        ${section.tools.map((tool) => renderToolCard(tool, lang)).join("")}
      </div>
    </section>
  `,
    )
    .join("");
}

function escapeAttr(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderToolCard(tool, lang = DEFAULT_LANGUAGE) {
  const tags = [tool.keywords || "", ...(tool.tags || [])]
    .filter(Boolean)
    .join(" ");
  return `
    <a href="${withLanguageQuery(tool.path, lang)}"
       class="tool-card tool-card-link home-tool-card group"
       data-tool-id="${escapeAttr(tool.id)}"
       data-tool-name="${escapeAttr(tool.name)}"
       data-tool-desc="${escapeAttr(tool.description)}"
       data-tool-tags="${escapeAttr(tags)}">
      <span class="home-tool-icon">
        <span class="material-symbols-rounded text-[20px]" aria-hidden="true" data-icon="${toolSymbol(tool.id)}"></span>
      </span>
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="tool-name home-tool-name">${tool.name}</h3>
          ${tool.badge ? `<span class="home-badge">${tool.badge}</span>` : ""}
        </div>
        <p class="tool-desc home-tool-desc">${tool.description}</p>
      </div>
    </a>
  `;
}

export function groupToolsByCategory(tools) {
  const categories = Object.fromEntries(
    Object.entries(CATEGORIES).map(([key, meta]) => [
      key,
      { ...meta, tools: [] },
    ]),
  );

  tools.forEach((tool) => {
    const cat =
      tool.category && categories[tool.category] ? tool.category : "utils";
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
