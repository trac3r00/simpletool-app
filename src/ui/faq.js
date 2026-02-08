import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, getAdSlotHTML } from '../utils/common-ui.js';
import { createFaqAccordion, createBreadcrumbs } from '../utils/content-ui.js';

export const FAQ_ENTRIES = [];

function renderFaqShell({ title, description, content, schema }) {
  const html = createPageTemplate({
    title,
    description,
    content,
    path: '/faq',
    schema
  });

  const toolAdSlot = getAdSlotHTML('tool', {
    wrapperClassName: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'
  });

  const htmlWithoutToolSlot = toolAdSlot ? html.replace(toolAdSlot, '') : html;
  return respondHTML(htmlWithoutToolSlot);
}

export function renderFaqPage() {
  const breadcrumbs = createBreadcrumbs([
    { label: 'Home', url: '/' },
    { label: 'FAQ' }
  ]);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': FAQ_ENTRIES.map(entry => ({
      '@type': 'Question',
      'name': entry.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': entry.answer
      }
    }))
  };

  const categories = [...new Set(FAQ_ENTRIES.map(e => e.category))];
  const groupedContent = categories.map(cat => {
    const items = FAQ_ENTRIES.filter(e => e.category === cat);
    return `
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4" data-i18n="content.faq.cat.${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">${cat}</h2>
        ${createFaqAccordion(items)}
      </section>`;
  }).join('');

  const faqContent = FAQ_ENTRIES.length > 0
    ? groupedContent
    : `
      <div class="text-center py-16">
        <p class="text-surface-500 dark:text-surface-400 text-sm" data-i18n="content.faq.empty">FAQ entries coming soon. Check back for answers to common questions about our tools.</p>
      </div>
    `;

  const content = `
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      ${breadcrumbs}
      <div class="card p-6 sm:p-10">
        <header class="mb-8">
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50" data-i18n="content.faq.heading">Frequently Asked Questions</h1>
          <p class="mt-2 text-sm text-surface-500 dark:text-surface-400" data-i18n="content.faq.subheading">Common questions about SimpleTool and our developer tools.</p>
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
    title: 'FAQ',
    description: 'Frequently asked questions about SimpleTool — privacy-first developer tools.',
    content,
    schema: faqSchema
  });
}

export function handleFaqRoutes(request, url) {
  const pathname = url.pathname.replace(/\/+$/, '') || '/faq';

  if (pathname === '/faq' && request.method === 'GET') {
    return renderFaqPage();
  }

  return null;
}
