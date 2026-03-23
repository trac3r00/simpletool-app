/**
 * Content UI Components — reusable building blocks for blog, FAQ, and educational pages.
 * Professional editorial aesthetic: clean typography, generous whitespace, subtle accent borders.
 */

import { DEFAULT_LANGUAGE, normalizeLanguage, withLanguageQuery, t } from './i18n.js';

/**
 * Educational section with collapsible panels.
 * @param {Array<{title: string, content: string}>} sections
 * @param {string} [toolId] - Optional tool ID for i18n namespacing
 * @returns {string} HTML
 */
export function createEducationalSection(sections, toolId, lang = DEFAULT_LANGUAGE) {
  if (!sections || sections.length === 0) return '';

  const prefix = toolId ? `tools.${toolId}.edu` : 'content.edu';
  const currentLang = normalizeLanguage(lang);

  const items = sections.map((section, i) => {
    const headingKey = `${prefix}.heading${i + 1}`;
    const contentKey = `${prefix}.p${i + 1}`;
    const headingText = t(headingKey, currentLang) !== headingKey ? t(headingKey, currentLang) : section.title;
    const contentText = t(contentKey, currentLang) !== contentKey ? t(contentKey, currentLang) : section.content;
    return `
    <details class="group border-l-4 border-primary-500 dark:border-primary-400 bg-white dark:bg-surface-900 rounded-r-lg shadow-sm"${i === 0 ? ' open' : ''}>
      <summary class="flex items-center justify-between w-full px-5 py-4 cursor-pointer select-none text-left text-surface-900 dark:text-surface-50 font-semibold text-base hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500" data-i18n="${headingKey}">
        <span>${headingText}</span>
        <svg class="w-5 h-5 text-surface-400 dark:text-surface-500 transition-transform duration-200 group-open:rotate-180 flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </summary>
      <div class="px-5 pb-5 pt-1 text-sm text-surface-700 dark:text-surface-300 leading-relaxed prose dark:prose-invert max-w-none" data-i18n-html="${contentKey}">
        ${contentText}
      </div>
    </details>
  `;}).join('');

  return `
    <div data-section="educational" class="space-y-3 mt-8" role="region" aria-label="Educational content">
      ${items}
    </div>
  `;
}

/**
 * FAQ Accordion with accessible details/summary and anchor IDs.
 * @param {Array<{id: string, question: string, answer: string}>} items
 * @returns {string} HTML
 */
export function createFaqAccordion(items, options = {}) {
  if (!items || items.length === 0) return '';
  const withI18n = options.i18n !== false;

  const faqItems = items.map((item, i) => `
    <details id="${item.id || 'q' + (i + 1)}" class="group border border-surface-200 dark:border-surface-800 rounded-lg bg-white dark:bg-surface-900 shadow-sm" data-faq-item>
      <summary class="flex items-center justify-between w-full px-5 py-4 cursor-pointer select-none text-left font-medium text-surface-900 dark:text-surface-50 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"${withI18n ? ` data-i18n="content.faq.q${i}"` : ''}>
        <span>${item.question}</span>
        <svg class="w-5 h-5 text-surface-400 dark:text-surface-500 transition-transform duration-200 group-open:rotate-180 flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </summary>
      <div class="px-5 pb-5 pt-1 text-sm text-surface-700 dark:text-surface-300 leading-relaxed border-t border-surface-100 dark:border-surface-800 mt-1 prose dark:prose-invert max-w-none"${withI18n ? ` data-i18n-html="content.faq.a${i}"` : ''}>
        ${item.answer}
      </div>
    </details>
  `).join('');

  return `
    <div class="space-y-3" role="region" aria-label="Frequently asked questions">
      ${faqItems}
    </div>
  `;
}

/**
 * Blog article card for listing pages.
 * @param {{title: string, description: string, slug: string, category: string, readingTime: string, datePublished: string}} article
 * @returns {string} HTML
 */
export function createBlogArticleCard(article, options = {}) {
  if (!article) return '';
  const lang = normalizeLanguage(options.lang || DEFAULT_LANGUAGE);
  const locale = options.locale || 'en-US';

  const dateFormatted = article.datePublished
    ? new Date(article.datePublished).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return `
    <a href="${withLanguageQuery(`/blog/${article.slug}`, lang)}" class="block card p-6 hover:border-primary-400 dark:hover:border-primary-600 transition-colors duration-200 group" data-blog-card>
      <div class="flex flex-wrap items-center gap-2 mb-3">
        ${article.category ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">${article.category}</span>` : ''}
        ${article.readingTime ? `<span class="text-xs text-surface-500 dark:text-surface-400">${article.readingTime}</span>` : ''}
      </div>
      <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-50 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 mb-2">
        ${article.title}
      </h3>
      <p class="text-sm text-surface-600 dark:text-surface-400 leading-relaxed mb-3">
        ${article.description}
      </p>
      ${dateFormatted ? `<time datetime="${article.datePublished}" class="text-xs text-surface-400 dark:text-surface-500">${dateFormatted}</time>` : ''}
    </a>
  `;
}

/**
 * Related tools section — grid of tool cards linking back to tools.
 * @param {Array<{icon: string, name: string, description: string, path: string}>} tools
 * @returns {string} HTML
 */
export function createRelatedToolsSection(tools, lang = DEFAULT_LANGUAGE) {
  if (!tools || tools.length === 0) return '';

  const cards = tools.slice(0, 4).map(tool => `
    <a href="${tool.path}" class="card p-4 hover:border-primary-400 dark:hover:border-primary-600 transition-colors duration-200 group flex items-start gap-3">
      <span class="text-2xl flex-shrink-0" aria-hidden="true">${tool.icon}</span>
      <div class="min-w-0">
        <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-50 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">${tool.name}</h3>
        <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2">${tool.description}</p>
      </div>
    </a>
  `).join('');

  return `
    <section class="mt-10" aria-label="Related tools">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4" data-i18n="content.relatedTools">${t('content.relatedTools', lang)}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${cards}
      </div>
    </section>
  `;
}

/**
 * Breadcrumb navigation with BreadcrumbList schema markup.
 * @param {Array<{label: string, url: string}>} items — last item is current page (no link)
 * @returns {string} HTML
 */
export function createBreadcrumbs(items, options = {}) {
  if (!items || items.length === 0) return '';
  const lang = normalizeLanguage(options.lang || DEFAULT_LANGUAGE);

  const schemaItems = items.map((item, i) => ({
    '@type': 'ListItem',
    'position': i + 1,
    'name': item.label,
    ...(item.url ? { 'item': `https://simpletool.app${withLanguageQuery(item.url, lang)}` } : {})
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': schemaItems
  };

  const links = items.map((item, i) => {
    const isLast = i === items.length - 1;
    if (isLast) {
      return `<span class="text-sm text-surface-500 dark:text-surface-400" aria-current="page">${item.label}</span>`;
    }
    return `<a href="${withLanguageQuery(item.url, lang)}" class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">${item.label}</a>`;
  }).join(`<svg class="w-4 h-4 text-surface-400 dark:text-surface-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>`);

  return `
    <nav aria-label="Breadcrumb" class="mb-6">
      <ol class="flex items-center gap-2 flex-wrap">
        ${links}
      </ol>
      <script type="application/ld+json">${JSON.stringify(schema)}</script>
    </nav>
  `;
}

/**
 * Reading progress bar — thin bar at top of page tracking scroll progress.
 * Returns a script block (CSP-safe: must be rendered inside page template).
 * @returns {string} HTML with script
 */
export function createReadingProgressBar() {
  return `
    <div id="reading-progress-container" style="position:fixed;top:0;left:0;width:100%;height:3px;z-index:9999;pointer-events:none;">
      <div id="reading-progress-bar" style="height:100%;width:0%;transition:width 80ms ease-out;" class="bg-primary-500"></div>
    </div>
    <script>
      (function(){
        var bar = document.getElementById('reading-progress-bar');
        if (!bar) return;
        function update() {
          var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
          bar.style.width = Math.min(100, Math.max(0, progress)) + '%';
        }
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update, { passive: true });
        update();
      })();
    </script>
  `;
}
