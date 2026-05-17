/**
 * Response helpers
 */

import { getSecurityHeaders, generateNonce } from './security.js';
import {
  createPageTemplate,
  getThemeBootstrapScript,
  getLanguageBootstrapScript,
  getStylesheetLinks,
  getAdSenseScript,
  getAdSlotHTML
} from './common-ui.js';

function injectStylesheet(html) {
  if (html.includes('data-bundled-stylesheet')) {
    return html;
  }

  const styles = getStylesheetLinks();

  if (html.includes('</head>')) {
    return html.replace('</head>', `${styles}\n</head>`);
  }

  return `${styles}\n${html}`;
}

function injectThemeBootstrap(html) {
  if (html.includes('data-theme-bootstrap')) {
    return html;
  }

  const bootstrap = getThemeBootstrapScript();

  if (html.includes('</head>')) {
    return html.replace('</head>', `${bootstrap}\n</head>`);
  }

  return `${bootstrap}\n${html}`;
}

function injectLanguageBootstrap(html) {
  if (html.includes('data-i18n-bootstrap')) {
    return html;
  }

  const bootstrap = getLanguageBootstrapScript();

  if (html.includes('</head>')) {
    return html.replace('</head>', `${bootstrap}\n</head>`);
  }

  return `${bootstrap}\n${html}`;
}

function injectAdSenseScript(html) {
  if (html.includes('adsbygoogle.js')) {
    return html;
  }

  const adScript = getAdSenseScript();
  if (!adScript.trim()) {
    return html;
  }

  if (html.includes('</head>')) {
    return html.replace('</head>', `${adScript}\n</head>`);
  }

  return `${adScript}\n${html}`;
}

function injectAdSlot(html) {
  if (html.includes('class="adsbygoogle"') || html.includes("class='adsbygoogle'") || html.includes('data-ad-slot=')) {
    return html;
  }

  const adSlot = getAdSlotHTML('tool', {
    wrapperClassName: 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'
  });
  if (!adSlot) {
    return html;
  }

  if (html.includes('</body>')) {
    return html.replace('</body>', `${adSlot}\n</body>`);
  }

  return `${html}\n${adSlot}`;
}

export function respondJSON(data, options = {}) {
  const { status = 200, headers = {} } = options;

  // Ensure Cache-Control defaults to no-store for JSON unless explicitly overridden
  const finalHeaders = {
    ...getSecurityHeaders('application/json; charset=utf-8'),
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    ...headers
  };

  return new Response(JSON.stringify(data), {
    status,
    headers: finalHeaders
  });
}

export function respondHTML(html, options = {}) {
  const { status = 200, headers = {}, url = null } = options;

  // Generate nonce for CSP
  const nonce = generateNonce();

  // Determine cache control: bypass caching for URLs with query parameters
  const hasQueryParams = url && url.search && url.search.length > 1;
  const cacheControl = hasQueryParams ? 'private, no-cache, must-revalidate' : null;

  const htmlWithStyles = injectStylesheet(html);
  const htmlWithTheme = injectThemeBootstrap(htmlWithStyles);
  const htmlWithLang = injectLanguageBootstrap(htmlWithTheme);
  const htmlWithAds = injectAdSlot(injectAdSenseScript(htmlWithLang));

  // Inject nonce into ALL script tags (both inline and external)
  const htmlWithNonce = htmlWithAds.replace(
    /<script(\s|>)/g,
    `<script nonce="${nonce}"$1`
  );

  return new Response(htmlWithNonce, {
    status,
    headers: {
      ...getSecurityHeaders('text/html; charset=utf-8', cacheControl, nonce),
      ...headers
    }
  });
}

export function respondText(text, options = {}) {
  const { status = 200, headers = {} } = options;
  return new Response(text, {
    status,
    headers: {
      ...getSecurityHeaders('text/plain; charset=utf-8'),
      ...headers
    }
  });
}

export function respond404() {
  const html = createPageTemplate({
    title: '404 - Page Not Found',
    description: 'The requested page could not be found.',
    content: `
      <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div class="card p-8 sm:p-10 text-center">
          <p class="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-2">404 error</p>
          <h1 class="text-4xl sm:text-5xl font-bold text-surface-900 dark:text-surface-50 mb-4">Page not found</h1>
          <p class="text-base text-surface-600 dark:text-surface-300 mb-8">
            We can't seem to find the page you're looking for. Double-check the URL or head back home.
          </p>
          <div class="mb-8">
            <input type="search" id="error-search" placeholder="Search tools..." class="input w-full max-w-sm mx-auto mb-6">
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
              <a href="/json-formatter" class="card p-4 hover:shadow-md transition-shadow text-center text-sm font-medium text-surface-700 dark:text-surface-200">JSON Formatter</a>
              <a href="/password-generator" class="card p-4 hover:shadow-md transition-shadow text-center text-sm font-medium text-surface-700 dark:text-surface-200">Password Generator</a>
              <a href="/uuid-generator" class="card p-4 hover:shadow-md transition-shadow text-center text-sm font-medium text-surface-700 dark:text-surface-200">UUID Generator</a>
              <a href="/regex-visualizer" class="card p-4 hover:shadow-md transition-shadow text-center text-sm font-medium text-surface-700 dark:text-surface-200">Regex Studio</a>
              <a href="/color-converter" class="card p-4 hover:shadow-md transition-shadow text-center text-sm font-medium text-surface-700 dark:text-surface-200">Color Converter</a>
              <a href="/curl-studio" class="card p-4 hover:shadow-md transition-shadow text-center text-sm font-medium text-surface-700 dark:text-surface-200">Curl Studio</a>
            </div>
          </div>
          <div class="flex flex-wrap justify-center gap-3">
            <a href="/" class="btn btn-primary px-6 py-3">Go to Home</a>
            <a href="/contact" class="btn btn-secondary px-6 py-3">Contact Support</a>
          </div>
        </div>
      </main>
    `
  });
  return respondHTML(html, {
    status: 404,
    headers: { 'Cache-Control': 'no-store' }
  });
}

export function respond429(options = {}) {
  const { retryAfterSeconds } = options;
  const headers = { 'Cache-Control': 'no-store' };
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    headers['Retry-After'] = String(Math.ceil(retryAfterSeconds));
  }
  return respondJSON(
    { error: 'Rate limit exceeded', message: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers
    }
  );
}
