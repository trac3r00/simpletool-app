/**
 * Landing page at /. Introduces the product, surfaces the flagship tools and
 * the categories, and hands off to the full catalog at /tools.
 */

import { respondHTML } from "../utils/respond.js";
import { createPageTemplate, getAdSlotHTML, t } from "../utils/common-ui.js";
import { getToolsForEnvironment } from "../utils/tool-registry.js";
import {
  DEFAULT_LANGUAGE,
  localizeTools,
  normalizeLanguage,
  withLanguageQuery,
} from "../utils/i18n.js";
import { categoryIcon } from "./home-icons.js";
import {
  groupToolsByCategory,
  renderToolCard,
  stripLeadingEmoji,
} from "./tools-page.js";

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

const WHY_ITEMS = [
  { title: "home.why1Title", body: "home.why1Body", icon: "devices" },
  { title: "home.why2Title", body: "home.why2Body", icon: "bolt" },
  { title: "home.why3Title", body: "home.why3Body", icon: "apps" },
];

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
  const homeUrl = `https://simpletool.app${withLanguageQuery("/", currentLang)}`;
  const toolsHref = withLanguageQuery("/tools", currentLang);
  const searchTarget = `https://simpletool.app${withLanguageQuery("/tools?q={search_term_string}", currentLang)}`;
  const langField =
    currentLang === DEFAULT_LANGUAGE
      ? ""
      : `<input type="hidden" name="lang" value="${currentLang}">`;

  const content = `
  <header class="hexagon-pattern pt-14 pb-12 sm:pt-20 sm:pb-16">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h1 class="max-w-3xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-6xl" data-i18n="home.heroTitle">${t("home.heroTitle", currentLang)}</h1>
      <p class="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl" data-i18n="home.heroLine1">${t("home.heroLine1", currentLang)}</p>

      <form class="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row" action="/tools" method="get" role="search">
        <div class="relative flex-1 group">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <span class="material-symbols-rounded text-[20px] text-muted-foreground group-focus-within:text-primary" aria-hidden="true" data-icon="search"></span>
          </div>
          <input type="text" name="q" id="tool-search"
                 class="input w-full rounded-lg bg-card py-3 pl-11 pr-16 text-base shadow-sm"
                 placeholder="${t("nav.searchTools", currentLang)}"
                 data-i18n-placeholder="nav.searchTools"
                 aria-label="${t("nav.searchTools", currentLang)}">
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <kbd class="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-xs text-muted-foreground sm:block">⌘K</kbd>
          </div>
          ${langField}
        </div>
        <button type="submit" class="btn-primary h-12 px-5 text-base">
          <span data-i18n="home.ctaBrowse">${t("home.ctaBrowse", currentLang)}</span>
          <span class="material-symbols-rounded text-[18px]" aria-hidden="true" data-icon="arrow_forward"></span>
        </button>
      </form>

      <ul class="mt-5 flex flex-wrap gap-y-1 text-sm text-muted-foreground">
        <li class="whitespace-nowrap"><span data-i18n="home.trustClient">${t("home.trustClient", currentLang)}</span><span class="mx-2" aria-hidden="true">·</span></li>
        <li class="whitespace-nowrap"><span data-i18n="home.trustAccount">${t("home.trustAccount", currentLang)}</span><span class="mx-2" aria-hidden="true">·</span></li>
        <li class="whitespace-nowrap"><span data-i18n="home.trustCount">${t("home.trustCount", currentLang)}</span><span class="mx-2" aria-hidden="true">·</span></li>
        <li class="whitespace-nowrap" data-i18n="home.trustLangs">${t("home.trustLangs", currentLang)}</li>
      </ul>
      <p class="mt-2 max-w-2xl text-xs text-muted-foreground" data-i18n="home.heroLine2">${t("home.heroLine2", currentLang)}</p>
    </div>
  </header>

  <main class="mx-auto flex max-w-7xl flex-grow flex-col gap-16 px-4 pb-16 sm:px-6 lg:px-8">
    <section aria-labelledby="home-popular-title">
      <div class="mb-5 flex items-end justify-between gap-4">
        <h2 id="home-popular-title" class="text-2xl font-bold tracking-tight text-foreground" data-i18n="home.popularTitle">${t("home.popularTitle", currentLang)}</h2>
        <a href="${toolsHref}" class="home-text-link" data-i18n="home.viewAll">${t("home.viewAll", currentLang)}</a>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        ${flagships.map((tool) => renderToolCard(tool, currentLang)).join("")}
      </div>
    </section>

    <section aria-labelledby="home-why-title">
      <h2 id="home-why-title" class="mb-5 text-2xl font-bold tracking-tight text-foreground" data-i18n="home.whyTitle">${t("home.whyTitle", currentLang)}</h2>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        ${WHY_ITEMS.map(
          ({ title, body, icon }) => `
        <div class="tool-card p-5">
          <span class="home-tool-icon"><span class="material-symbols-rounded text-[20px]" aria-hidden="true" data-icon="${icon}"></span></span>
          <h3 class="mt-4 font-semibold text-foreground" data-i18n="${title}">${t(title, currentLang)}</h3>
          <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground" data-i18n="${body}">${t(body, currentLang)}</p>
        </div>`,
        ).join("")}
      </div>
    </section>

    <section aria-labelledby="home-categories-title">
      <h2 id="home-categories-title" class="mb-5 text-2xl font-bold tracking-tight text-foreground" data-i18n="home.categoriesTitle">${t("home.categoriesTitle", currentLang)}</h2>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        ${Object.entries(categories)
          .map(
            ([key, section]) => `
        <a href="${toolsHref}#category-${key}" class="tool-card tool-card-link home-tool-card group items-center">
          <span class="home-tool-icon"><span class="material-symbols-rounded text-[20px]" aria-hidden="true" data-icon="${categoryIcon(key)}"></span></span>
          <span class="home-tool-name flex-1" data-i18n="home.cat.${key}">${stripLeadingEmoji(t(`home.cat.${key}`, currentLang))}</span>
          <span class="home-count">${section.tools.length}</span>
        </a>`,
          )
          .join("")}
      </div>
    </section>

    <section class="tool-card relative overflow-hidden p-8 text-center sm:p-12" aria-labelledby="home-final-title">
      <div class="hexagon-pattern pointer-events-none absolute inset-0" aria-hidden="true"></div>
      <div class="relative">
        <h2 id="home-final-title" class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl" data-i18n="home.finalTitle">${t("home.finalTitle", currentLang)}</h2>
        <p class="mx-auto mt-3 max-w-xl text-muted-foreground" data-i18n="home.finalBody">${t("home.finalBody", currentLang)}</p>
        <a href="${toolsHref}" class="btn-primary mt-6 h-11 px-5">
          <span data-i18n="home.ctaBrowse">${t("home.ctaBrowse", currentLang)}</span>
          <span class="material-symbols-rounded text-[18px]" aria-hidden="true" data-icon="arrow_forward"></span>
        </a>
      </div>
    </section>

    ${getAdSlotHTML("home", { path: "/" })}
  </main>`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SimpleTool",
    url: homeUrl,
    description: homeDescription,
    potentialAction: {
      "@type": "SearchAction",
      target: searchTarget,
      "query-input": "required name=search_term_string",
    },
  };

  // The nav search is hidden on this page; route the phone search icon to the
  // hero field instead of the modal (capture phase beats the modal handler).
  const scripts = `
  <script>
    (function() {
      var heroSearch = document.getElementById('tool-search');
      document.addEventListener('click', function(e) {
        var target = e.target;
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
