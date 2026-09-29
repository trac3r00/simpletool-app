/**
 * Home page with clean, engineer-focused design
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

const FLAGSHIP_IDS = [
  "json-formatter",
  "token-studio",
  "regex-visualizer",
  "cron-builder",
  "password-generator",
  "ssh-key-generator",
  "curl-studio",
  "cidr-calculator",
];

function stripLeadingEmoji(value) {
  return String(value).replace(
    /^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]+\s*/u,
    "",
  );
}

export function renderHomePage({
  isDev = false,
  lang = DEFAULT_LANGUAGE,
} = {}) {
  const currentLang = normalizeLanguage(lang);
  const tools = localizeTools(getToolsForEnvironment(isDev), currentLang);
  const categories = groupToolsByCategory(tools);
  const flagships = FLAGSHIP_IDS.map((id) =>
    tools.find((tool) => tool.id === id),
  ).filter(Boolean);
  const homeTitle = t("home.meta.title", currentLang);
  const homeDescription = t("home.meta.description", currentLang);
  const homePath = withLanguageQuery("/", currentLang);
  const homeUrl = `https://simpletool.app${homePath}`;
  const searchTarget = `https://simpletool.app${withLanguageQuery("/?q={search_term_string}", currentLang)}`;

  const content = `
  <!-- Hero Section -->
  <!-- Hero band keeps a bespoke surface pair on purpose: no semantic token is
       white+surface-950. bg-card would lift the dark band off the page and
       bg-background would flatten the light one into it. -->
  <header class="border-b border-surface-200 bg-white dark:bg-surface-950 pt-8 pb-6 dark:border-surface-800 hexagon-pattern sm:pt-16 sm:pb-12">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h1 class="text-balance text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-50 sm:text-5xl" data-i18n="home.heroTitle">
        ${t("home.heroTitle", currentLang)}
      </h1>
      <p class="mt-3 max-w-2xl text-base leading-relaxed text-surface-600 dark:text-surface-400 sm:mt-4 sm:text-lg">
        <span data-i18n="home.heroLine1">${t("home.heroLine1", currentLang)}</span>
        <span class="mt-2 hidden text-sm text-surface-500 dark:text-surface-400 sm:block" data-i18n="home.heroLine2">${t("home.heroLine2", currentLang)}</span>
      </p>

      <div class="relative mt-6 max-w-xl group sm:mt-8">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <span class="material-symbols-rounded text-[20px] text-surface-400 group-focus-within:text-primary-500" aria-hidden="true">search</span>
        </div>
         <input type="text"
                id="tool-search"
                class="input w-full py-3 pl-11 pr-4 text-base"
                placeholder="${t("nav.searchTools", currentLang)}"
                data-i18n-placeholder="nav.searchTools"
                aria-label="${t("nav.searchTools", currentLang)}">
        <div class="absolute inset-y-0 right-0 flex items-center pr-4">
          <span class="hidden rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground sm:block">⌘K</span>
        </div>
      </div>

      <ul class="mt-6 hidden flex-wrap gap-y-1 text-sm text-surface-500 dark:text-surface-400 sm:flex">
        <li class="whitespace-nowrap"><span data-i18n="home.trustClient">${t("home.trustClient", currentLang)}</span><span class="mx-2 text-muted-foreground" aria-hidden="true">·</span></li>
        <li class="whitespace-nowrap"><span data-i18n="home.trustAccount">${t("home.trustAccount", currentLang)}</span><span class="mx-2 text-muted-foreground" aria-hidden="true">·</span></li>
        <li class="whitespace-nowrap"><span data-i18n="home.trustCount">${t("home.trustCount", currentLang)}</span><span class="mx-2 text-muted-foreground" aria-hidden="true">·</span></li>
        <li class="whitespace-nowrap" data-i18n="home.trustLangs">${t("home.trustLangs", currentLang)}</li>
      </ul>

      <nav class="mt-4 sm:mt-6" aria-label="${t("home.flagshipsNav", currentLang)}" data-i18n-aria="home.flagshipsNav">
        <ul id="flagship-links" class="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          ${flagships
            .map(
              (tool) =>
                `<li class="shrink-0"><a class="inline-flex items-center rounded-md border border-border bg-card px-2.5 py-1 text-sm text-foreground hover:border-primary/50 hover:text-primary" href="${withLanguageQuery(tool.path, currentLang)}">${tool.name}</a></li>`,
            )
            .join("")}
        </ul>
      </nav>
    </div>
  </header>

  <!-- Tools Grid -->
  <main class="mx-auto flex max-w-7xl flex-grow flex-col px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
    <!-- Favorites Section (populated client-side from localStorage) -->
    <div id="favorites-section" class="hidden space-y-6">
      <div class="flex items-center gap-3">
        <span class="material-symbols-rounded text-warning-700 dark:text-warning-300" aria-hidden="true">star</span>
        <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-100 uppercase tracking-wide" data-i18n="home.favorites">${t("home.favorites", currentLang)}</h2>
        <span id="favorites-count" class="text-xs font-medium text-surface-500 bg-surface-100 dark:bg-surface-800 dark:text-surface-400 px-2 py-0.5 rounded-full">0</span>
      </div>
      <div id="favorites-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
    </div>

    <!-- Recently Used Section (populated client-side from localStorage) -->
    <div id="recent-section" class="hidden space-y-6">
      <div class="flex items-center gap-3">
        <span class="material-symbols-rounded text-primary-600 dark:text-primary-400" aria-hidden="true">history</span>
        <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-100 uppercase tracking-wide" data-i18n="home.recentlyUsed">${t("home.recentlyUsed", currentLang)}</h2>
        <span id="recent-count" class="text-xs font-medium text-surface-600 bg-surface-100 dark:bg-surface-800 dark:text-surface-300 px-2 py-0.5 rounded-full">0</span>
      </div>
      <div id="recent-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
    </div>

    <div id="search-results-container" class="hidden space-y-8">
      <h2 id="search-results-heading" class="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-6 flex items-center gap-2 uppercase tracking-wide">
        <span class="material-symbols-rounded text-[20px]" aria-hidden="true">search</span>
        <span id="search-results-label" data-i18n="home.searchResultsLabel">${t("home.searchResultsLabel", currentLang)}</span>
        <span id="search-results-count" class="text-xs font-medium text-surface-500 bg-surface-100 dark:bg-surface-800 dark:text-surface-400 px-2 py-0.5 rounded-full"></span>
      </h2>
      <div id="search-results-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Search results injected here -->
      </div>
    </div>

    <div id="tools-categories-container" class="space-y-16">
      ${renderCategories(categories, currentLang)}
    </div>

    <div id="search-empty-state" class="hidden py-16 text-center">
      <div class="mb-4" aria-hidden="true"><span class="material-symbols-rounded text-5xl text-surface-400">search</span></div>
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
        "@type": "WebSite",
        name: "SimpleTool",
        url: homeUrl,
        description: homeDescription,
        potentialAction: {
          "@type": "SearchAction",
          target: searchTarget,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "ItemList",
        name: t("home.heroTitle", currentLang),
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

      function renderCard(tool) {
        var badge = tool.badge ? '<span class="px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 rounded-full">' + tool.badge + '</span>' : '';
        var dataAttrs = 'data-tool-id="' + escAttr(tool.id) + '" data-tool-name="' + escAttr(tool.name) + '" data-tool-desc="' + escAttr(tool.description) + '" data-tool-tags="' + escAttr(tool.keywords || '') + '"';
        return '<a href="' + tool.path + '" ' + dataAttrs + ' class="tool-card tool-card-link group flex flex-col p-4">' +
          '<div class="flex items-start justify-between mb-3"><div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted"><span class="material-symbols-rounded text-[20px] text-primary" aria-hidden="true">' + tool.symbol + '</span></div>' + badge + '</div>' +
          '<h3 class="tool-name mb-1 font-semibold text-surface-900 transition-colors group-hover:text-primary dark:text-surface-50">' + tool.name + '</h3>' +
          '<p class="tool-desc text-sm leading-relaxed text-surface-500 line-clamp-3 dark:text-surface-400">' + tool.description + '</p></a>';
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
      title: homeTitle,
      titleSuffix: "",
      description: homeDescription,
      keywords: t("home.meta.keywords", currentLang),
      content,
      path: "/",
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
    <section class="category-section">
      <div class="flex items-center gap-3 mb-6">
        <span class="material-symbols-rounded text-primary" aria-hidden="true">${categoryIcon(key)}</span>
        <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-100 uppercase tracking-wide" data-i18n="home.cat.${key}">
          ${stripLeadingEmoji(t("home.cat." + key, lang))}
        </h2>
        <span class="category-count text-xs font-medium text-surface-600 bg-surface-100 dark:bg-surface-800 dark:text-surface-400 px-2 py-0.5 rounded-full">${section.tools.length}</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

function renderToolCard(tool, lang = DEFAULT_LANGUAGE) {
  const tags = [tool.keywords || "", ...(tool.tags || [])]
    .filter(Boolean)
    .join(" ");
  return `
    <a href="${withLanguageQuery(tool.path, lang)}"
       class="tool-card tool-card-link group flex flex-col p-4"
       data-tool-id="${escapeAttr(tool.id)}"
       data-tool-name="${escapeAttr(tool.name)}"
       data-tool-desc="${escapeAttr(tool.description)}"
       data-tool-tags="${escapeAttr(tags)}">
      <div class="flex items-start justify-between mb-3">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
          <span class="material-symbols-rounded text-[20px] text-primary" aria-hidden="true">${toolSymbol(tool.id)}</span>
        </div>
        ${tool.badge ? `<span class="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">${tool.badge}</span>` : ""}
      </div>
      <h3 class="tool-name mb-1 font-semibold text-surface-900 transition-colors group-hover:text-primary dark:text-surface-50">
        ${tool.name}
      </h3>
      <p class="tool-desc text-sm text-surface-500 dark:text-surface-400 leading-relaxed line-clamp-3">
        ${tool.description}
      </p>
    </a>
  `;
}

function groupToolsByCategory(tools) {
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
