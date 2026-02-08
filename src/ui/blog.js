import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, getAdSlotHTML } from '../utils/common-ui.js';
import { createBlogArticleCard, createBreadcrumbs, createReadingProgressBar } from '../utils/content-ui.js';

export const BLOG_ARTICLES = [];

function renderBlogShell({ title, description, content, schema }) {
  const html = createPageTemplate({
    title,
    description,
    content,
    path: '/blog',
    schema
  });

  const toolAdSlot = getAdSlotHTML('tool', {
    wrapperClassName: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'
  });

  const htmlWithoutToolSlot = toolAdSlot ? html.replace(toolAdSlot, '') : html;
  return respondHTML(htmlWithoutToolSlot);
}

export function renderBlogListingPage() {
  const articleCards = BLOG_ARTICLES.length > 0
    ? BLOG_ARTICLES.map(article => createBlogArticleCard(article)).join('')
    : `
      <div class="text-center py-16">
        <p class="text-surface-500 dark:text-surface-400 text-sm" data-i18n="content.blog.empty">Articles coming soon. Check back for developer guides, tutorials, and tool deep-dives.</p>
      </div>
    `;

  const breadcrumbs = createBreadcrumbs([
    { label: 'Home', url: '/' },
    { label: 'Blog' }
  ]);

  const content = `
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      ${breadcrumbs}
      <div class="card p-6 sm:p-10">
        <header class="mb-8">
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50" data-i18n="content.blog.heading">Blog</h1>
          <p class="mt-2 text-sm text-surface-500 dark:text-surface-400" data-i18n="content.blog.subheading">Guides, tutorials, and insights for developers.</p>
        </header>

        <div class="space-y-4">
          ${articleCards}
        </div>
      </div>

      ${getAdSlotHTML('legal', { wrapperClassName: 'mt-10' })}
    </main>
  `;

  return renderBlogShell({
    title: 'Blog',
    description: 'Developer guides, tutorials, and tool deep-dives from SimpleTool.',
    content
  });
}

export function renderBlogPostPage(slug) {
  const article = BLOG_ARTICLES.find(a => a.slug === slug);
  if (!article) return null;

  const breadcrumbs = createBreadcrumbs([
    { label: 'Home', url: '/' },
    { label: 'Blog', url: '/blog' },
    { label: article.title }
  ]);

  const progressBar = createReadingProgressBar();

  const dateFormatted = article.datePublished
    ? new Date(article.datePublished).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': article.title,
    'description': article.description,
    'datePublished': article.datePublished || '',
    'author': { '@type': 'Organization', 'name': 'SimpleTool' },
    'publisher': { '@type': 'Organization', 'name': 'SimpleTool', 'url': 'https://simpletool.app' },
    'mainEntityOfPage': `https://simpletool.app/blog/${slug}`
  };

  const content = `
    ${progressBar}
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      ${breadcrumbs}
      <article class="card p-6 sm:p-10">
        <header class="mb-8">
          <div class="flex flex-wrap items-center gap-2 mb-3">
            ${article.category ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">${article.category}</span>` : ''}
            ${article.readingTime ? `<span class="text-xs text-surface-500 dark:text-surface-400">${article.readingTime}</span>` : ''}
          </div>
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">${article.title}</h1>
          ${dateFormatted ? `<time datetime="${article.datePublished}" class="block mt-2 text-sm text-surface-500 dark:text-surface-400">${dateFormatted}</time>` : ''}
        </header>

        <div class="prose dark:prose-invert max-w-none prose-pre:bg-surface-100 dark:prose-pre:bg-surface-950 prose-pre:border prose-pre:border-surface-200 dark:prose-pre:border-surface-800">
          ${article.content || ''}
        </div>
      </article>

      ${getAdSlotHTML('legal', { wrapperClassName: 'mt-10' })}
    </main>
  `;

  return renderBlogShell({
    title: article.title,
    description: article.description,
    content,
    schema
  });
}

export function handleBlogRoutes(request, url) {
  const pathname = url.pathname.replace(/\/+$/, '') || '/blog';
  const method = request.method;

  if (pathname === '/blog') {
    if (method === 'GET') return renderBlogListingPage();
  }

  const blogPostPattern = /^\/blog\/([a-z0-9][a-z0-9-]*[a-z0-9])$/;
  const postMatch = pathname.match(blogPostPattern);
  if (postMatch && method === 'GET') {
    return renderBlogPostPage(postMatch[1]);
  }

  return null;
}
