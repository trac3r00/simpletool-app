/**
 * Changelog / Release Notes Page
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate } from '../utils/common-ui.js';
import { DEFAULT_LANGUAGE, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

const RELEASES = [
  {
    version: '2.4.0',
    date: '2026-03-23',
    title: 'Production Readiness & Full i18n',
    changes: [
      { type: 'feat', text: 'Full i18n support for all 10 languages across 49 tools' },
      { type: 'feat', text: 'Added unit-converter with 10 categories and real conversion formulas' },
      { type: 'feat', text: 'Added code-minifier with JS/CSS/HTML/JSON minify and beautify' },
      { type: 'feat', text: 'Added SAML decoder with Base64 decode, XML parse, and inflate support' },
      { type: 'feat', text: 'Restored QR code generator (16 missing DOM elements)' },
      { type: 'feat', text: 'Added og:image for social sharing, skip-link for accessibility' },
      { type: 'feat', text: 'Added FAQ, legal, blog content for 6 new languages' },
      { type: 'feat', text: 'Added 74 tooltip i18n attributes and 5 placeholder translations' },
      { type: 'feat', text: 'Created changelog page with version display in footer' },
      { type: 'fix', text: 'Fixed service worker cache corruption (stale CSP nonces)' },
      { type: 'fix', text: 'Fixed Token Studio XSS vulnerability (escapeHtml on JWK fields)' },
      { type: 'fix', text: 'Fixed console errors on 6 pages (null guards, _t fallback, regex escaping)' },
      { type: 'fix', text: 'Replaced dead libsodium CDN with Web Crypto API for WireGuard' },
      { type: 'fix', text: 'Fixed language persistence on back button navigation' },
      { type: 'fix', text: 'Fixed duplicate category icons on home page' },
      { type: 'fix', text: 'Fixed heading hierarchy (H2→H3) for accessibility' },
      { type: 'fix', text: 'Fixed roulette wheel 3D transform breaking E2E tests' },
      { type: 'fix', text: 'Fixed unescaped quotes in German/Portuguese/Vietnamese translations' },
      { type: 'perf', text: 'Sub-4ms TTFB, pages under 165KB, minimal resource count' },
    ]
  },
  {
    version: '2.3.0',
    date: '2026-03-22',
    title: 'Mobile Overflow & New Tool Translations',
    changes: [
      { type: 'feat', text: 'Added i18n translations for new tools' },
      { type: 'fix', text: 'Fixed mobile overflow issues across tool pages' },
      { type: 'fix', text: 'Improved responsive layout for narrow viewports' },
    ]
  }
];

function renderChangelogPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);

  const typeLabels = {
    feat: { label: 'New', color: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300' },
    fix: { label: 'Fix', color: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300' },
    perf: { label: 'Perf', color: 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300' },
    chore: { label: 'Chore', color: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300' },
  };

  const releasesHTML = RELEASES.map(release => {
    const dateFormatted = new Date(release.date).toLocaleDateString(currentLang, { year: 'numeric', month: 'long', day: 'numeric' });
    const changesHTML = release.changes.map(c => {
      const t = typeLabels[c.type] || typeLabels.chore;
      return `<li class="flex items-start gap-3 py-2">
        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${t.color} flex-shrink-0 mt-0.5">${t.label}</span>
        <span class="text-surface-700 dark:text-surface-300 text-sm">${c.text}</span>
      </li>`;
    }).join('');

    return `
      <section class="mb-10">
        <div class="flex items-baseline gap-4 mb-4">
          <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-50">v${release.version}</h2>
          <span class="text-sm text-surface-500 dark:text-surface-400">${dateFormatted}</span>
        </div>
        <p class="text-base text-surface-600 dark:text-surface-400 mb-4 font-medium">${release.title}</p>
        <ul class="space-y-1 border-l-2 border-surface-200 dark:border-surface-700 pl-4">
          ${changesHTML}
        </ul>
      </section>
    `;
  }).join('');

  const content = `
    <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-surface-900 dark:text-surface-50 mb-2">Changelog</h1>
        <p class="text-surface-600 dark:text-surface-400">Release history and recent changes to SimpleTool.</p>
      </div>
      ${releasesHTML}
    </main>
  `;

  return createPageTemplate({
    title: 'Changelog',
    description: 'Release history and recent changes to SimpleTool.',
    content,
    path: '/changelog',
    lang: currentLang
  });
}

export async function handleChangelogRoutes(request, url) {
  if (url.pathname === '/changelog' || url.pathname === '/changelog/') {
    if (request.method === 'GET') {
      return respondHTML(renderChangelogPage(resolveRequestLanguage(request, url)));
    }
  }
  return null;
}
