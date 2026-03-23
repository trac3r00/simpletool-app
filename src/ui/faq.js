import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, getAdSlotHTML } from '../utils/common-ui.js';
import { createFaqAccordion, createBreadcrumbs } from '../utils/content-ui.js';
import { DEFAULT_LANGUAGE, normalizeLanguage, resolveRequestLanguage, t } from '../utils/i18n.js';
import { getFaqEntries } from './faq-content.js';

function stripHtml(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function renderFaqShell({ title, description, content, schema, lang = DEFAULT_LANGUAGE }) {
  const html = createPageTemplate({
    title,
    description,
    content,
    path: '/faq',
    schema,
    lang
  });

  const toolAdSlot = getAdSlotHTML('tool', {
    wrapperClassName: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'
  });

  const htmlWithoutToolSlot = toolAdSlot ? html.replace(toolAdSlot, '') : html;
  return respondHTML(htmlWithoutToolSlot);
}

export function renderFaqPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const faqEntries = getFaqEntries(currentLang);
  const breadcrumbs = createBreadcrumbs([
    { label: t('nav.home', currentLang), url: '/' },
    { label: t('content.faq.heading', currentLang) }
  ], { lang: currentLang });

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqEntries.map((entry) => ({
      '@type': 'Question',
      'name': entry.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': stripHtml(entry.answer)
      }
    }))
  };

  const categories = [...new Set(faqEntries.map((entry) => entry.category))];
  const groupedContent = categories.map((category) => {
    const items = faqEntries.filter((entry) => entry.category === category);
    return `
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">${category}</h2>
        ${createFaqAccordion(items, { i18n: false })}
      </section>`;
  }).join('');

  const faqContent = faqEntries.length > 0
    ? groupedContent
    : `
      <div class="text-center py-16">
        <p class="text-surface-500 dark:text-surface-400 text-sm" data-i18n="content.faq.empty">${t('content.faq.empty', currentLang)}</p>
      </div>
    `;

  const content = `
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      ${breadcrumbs}
      <div class="card p-6 sm:p-10">
        <header class="mb-8">
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50" data-i18n="content.faq.heading">${t('content.faq.heading', currentLang)}</h1>
          <p class="mt-2 text-sm text-surface-500 dark:text-surface-400" data-i18n="content.faq.subheading">${t('content.faq.subheading', currentLang)}</p>
        </header>

        ${faqContent}
      </div>

      ${getAdSlotHTML('legal', { wrapperClassName: 'mt-10' })}
    </main>
    <script>
      (function(){
        function openAnchor() {
          var hash = window.location.hash;
          if (!hash) return;
          var el = document.querySelector(hash);
          if (el && el.tagName === 'DETAILS') {
            el.setAttribute('open', '');
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
        openAnchor();
        window.addEventListener('hashchange', openAnchor);
      })();
    </script>
  `;

  return renderFaqShell({
    title: t('content.faq.heading', currentLang),
    description: t('content.faq.subheading', currentLang),
    content,
    schema: faqSchema,
    lang: currentLang
  });
}

export function handleFaqRoutes(request, url) {
  const pathname = url.pathname.replace(/\/+$/, '') || '/faq';

  if (pathname === '/faq' && request.method === 'GET') {
    return renderFaqPage(resolveRequestLanguage(request, url));
  }

  return null;
}
