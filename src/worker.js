/**
 * SimpleTool App - Unified Cloudflare Worker
 * Path-based routing for all tools under simpletool.app
 */

import { renderHomePage } from './ui/home.js';
import * as Sentry from '@sentry/cloudflare';
import { handlersById } from './routes/_handlers.js';
import { handlePipeRoutes } from './routes/pipe.js';
import { handleMarkdownEditorRoutes } from './routes/markdown-editor.js';
import { getToolsForEnvironment } from './utils/tool-registry.js';
import {
  renderTermsPage,
  renderPrivacyPage,
  renderAboutPage,
  renderContactPage,
  renderSecurityPage,
  renderCareersPage
} from './ui/legal-pages.js';
import { handleBlogRoutes, BLOG_ARTICLES } from './ui/blog.js';
import { handleFaqRoutes } from './ui/faq.js';
import { handleChangelogRoutes } from './routes/changelog.js';
import {
  getSecurityHeaders,
  shouldRateLimit,
  sweepRateLimiter,
  isLikelySharedIP,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_MAX_REQUESTS_SHARED_IP,
  RATE_LIMIT_WINDOW_MS
} from './utils/security.js';
import { respondJSON, respondText, respond404, respond429 } from './utils/respond.js';
import { tryLegacyRedirect } from './utils/redirects.js';
import { bundledStyles, bundledStylesHash } from './utils/bundled-styles.js';
import { setAdConfig, setAnalyticsToken, setSiteUrl } from './utils/common-ui.js';
import { resolveRequestLanguage } from './utils/i18n.js';

// Rate limiting state (memory fallback)
const rateLimiter = new Map();
const workerStartedAt = Date.now();

// handlersById is imported from ./routes/_handlers.js (auto-generated)

async function resolveToolResponse(handler, request, url) {
  const response = await handler(request, url);
  return response ?? respond404();
}

function matchesToolPath(pathname, toolPath) {
  return pathname === toolPath || pathname.startsWith(`${toolPath}/`);
}

function parseAdSlots(env) {
  if (!env) return {};
  const slots = {};

  if (typeof env.ADSENSE_SLOTS === 'string' && env.ADSENSE_SLOTS.trim()) {
    try {
      Object.assign(slots, JSON.parse(env.ADSENSE_SLOTS));
    } catch (error) {
      console.warn('Invalid ADSENSE_SLOTS JSON. Falling back to default slot.', error);
    }
  }

  if (typeof env.ADSENSE_SLOT === 'string' && env.ADSENSE_SLOT.trim()) {
    const fallback = env.ADSENSE_SLOT.trim();
    slots.home ||= fallback;
    slots.tool ||= fallback;
    slots.legal ||= fallback;
    slots.sidebar ||= fallback;
    slots.bottom ||= fallback;
  }

  return slots;
}

function isDevEnvironment(env, url) {
  const envValue = (env?.ENVIRONMENT || '').toLowerCase();
  if (envValue === 'development' || envValue === 'dev' || envValue === 'local') {
    return true;
  }
  const host = url.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function stripConditionalHeaders(request) {
  const headers = new Headers(request.headers);
  headers.delete('if-none-match');
  headers.delete('if-modified-since');
  headers.delete('if-match');
  headers.delete('if-unmodified-since');
  return new Request(request, { headers });
}

function getAssetSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
}

function buildSitemapXml(origin, tools) {
  const base = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  const paths = new Set([
    '/',
    '/terms',
    '/privacy',
    '/about',
    '/contact',
    '/security',
    '/careers'
  ]);

  for (const tool of tools) {
    if (tool?.path) {
      paths.add(tool.path);
    }
  }

  paths.add('/blog');
  paths.add('/faq');
  for (const article of BLOG_ARTICLES) {
    if (article?.slug) {
      paths.add(`/blog/${article.slug}`);
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const contentPaths = new Set(['/blog', '/faq']);
  const legalPaths = new Set(['/terms', '/privacy', '/about', '/contact', '/security', '/careers']);

  const urls = Array.from(paths).sort().map((path) => {
    const loc = `${base}${path === '/' ? '' : path}`;
    const isHome = path === '/';
    const isLegal = legalPaths.has(path);
    const isContent = contentPaths.has(path) || path.startsWith('/blog/');
    const priority = isHome ? '1.0' : isLegal ? '0.3' : isContent ? '0.7' : '0.8';
    const changefreq = isHome ? 'daily' : isLegal ? 'yearly' : isContent ? 'weekly' : 'weekly';
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>'
  ].join('\n');
}

async function checkRateLimitDO(env, ip, now, maxRequests = RATE_LIMIT_MAX_REQUESTS) {
  if (!env?.RATE_LIMITER || !ip || ip === 'unknown') {
    return { limited: false };
  }

  try {
    const id = env.RATE_LIMITER.idFromName(ip);
    const stub = env.RATE_LIMITER.get(id);
    const url = new URL('https://rate-limiter/check');
    url.searchParams.set('now', String(now));
    url.searchParams.set('limit', String(maxRequests));
    url.searchParams.set('windowMs', String(RATE_LIMIT_WINDOW_MS));
    const response = await stub.fetch(url.toString());
    if (!response.ok) {
      console.warn('Durable Object rate limiter returned non-OK status. Falling back to fail-closed response.', response.status);
      return { limited: false, fallback: true };
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Durable Object rate limiting failed. Falling back to memory.', error);
    return { limited: false, fallback: true };
  }
}

const worker = {
  async fetch(request, env, ctx) {
    const now = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const requestId = crypto.randomUUID();
    const isDev = isDevEnvironment(env, url);
    const runtimeTools = getToolsForEnvironment(isDev);

    setSiteUrl(env?.SITE_URL || 'https://simpletool.app');

    if (isDev) {
      setAdConfig({
        client: null,
        slots: {}
      });
      setAnalyticsToken('');
    } else {
      setAdConfig({
        client: env?.ADSENSE_CLIENT,
        slots: parseAdSlots(env)
      });
      setAnalyticsToken(env?.CF_ANALYTICS_TOKEN);
    }

    // Periodic rate limiter cleanup (always run to prevent memory growth)
    if (!globalThis.rateLimiterSweepCounter) {
      globalThis.rateLimiterSweepCounter = 0;
    }
    globalThis.rateLimiterSweepCounter++;
    if (globalThis.rateLimiterSweepCounter >= 100) {
      sweepRateLimiter(rateLimiter, now);
      globalThis.rateLimiterSweepCounter = 0;
    }

    if (!isDev) {
      const effectiveLimit = isLikelySharedIP(request)
        ? RATE_LIMIT_MAX_REQUESTS_SHARED_IP
        : RATE_LIMIT_MAX_REQUESTS;

      if (shouldRateLimit(rateLimiter, ip, now, effectiveLimit)) {
        return respond429();
      }

      const doRateLimitResult = await checkRateLimitDO(env, ip, now, effectiveLimit);
      if (doRateLimitResult?.limited) {
        const retryAfterSeconds = Math.ceil((doRateLimitResult.retryAfterMs || 0) / 1000);
        return respond429({ retryAfterSeconds });
      }
      // If DO is unavailable (fallback: true), rely on in-memory rate limiter above
    }

    // Route handling with path-based routing
    try {
      // Health check endpoint
      if (path === '/health' || path === '/api/health') {
        return respondJSON({
          status: 'healthy',
          uptime: now - workerStartedAt,
          timestamp: new Date().toISOString(),
          version: '2.4.1'
        }, {
          headers: { 'Cache-Control': 'no-store' }
        });
      }

      if (path === '/debug-sentry') {
        throw new Error('Sentry test error');
      }

      // ads.txt (Google AdSense)
      if (path === '/ads.txt') {
        const adsTxt = 'google.com, pub-5134881365131182, DIRECT, f08c47fec0942fa0';
        return respondText(adsTxt, {
          headers: { 'Cache-Control': 'public, max-age=86400' }
        });
      }

      // Robots.txt
      if (path === '/robots.txt') {
        const robotsTxt = [
          'User-agent: *',
          'Allow: /',
          `Sitemap: ${url.origin}/sitemap.xml`
        ].join('\n');
        return respondText(robotsTxt);
      }

      // Sitemap.xml
      if (path === '/sitemap.xml') {
        const sitemapXml = buildSitemapXml(url.origin, runtimeTools);
        return respondText(sitemapXml, {
          headers: { 'Content-Type': 'application/xml; charset=utf-8' }
        });
      }

      // Security.txt
      if (path === '/.well-known/security.txt') {
        const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        const securityTxt = [
          'Contact: mailto:security@simpletool.app',
          `Expires: ${expiresAt}`,
          'Policy: https://simpletool.app/security',
          'Hiring: https://simpletool.app/careers'
        ].join('\n');
        return respondText(securityTxt);
      }

      if (path === '/styles.css') {
        const etag = `"${bundledStylesHash}"`;
        if (isDev) {
          if (request.headers.get('If-None-Match') === etag) {
            return new Response(null, {
              status: 304,
              headers: {
                'ETag': etag,
                'Cache-Control': 'no-cache'
              }
            });
          }
          return new Response(bundledStyles, {
            headers: {
              ...getSecurityHeaders('text/css; charset=utf-8'),
              'Cache-Control': 'no-cache',
              'ETag': etag
            }
          });
        }
        if (request.headers.get('If-None-Match') === etag) {
          return new Response(null, {
            status: 304,
            headers: {
              'ETag': etag,
              'Cache-Control': 'public, max-age=31536000, immutable'
            }
          });
        }

        return new Response(bundledStyles, {
          headers: {
            ...getSecurityHeaders('text/css; charset=utf-8'),
            'Cache-Control': 'public, max-age=31536000, immutable',
            'ETag': etag
          }
        });
      }

      if (path.startsWith('/vendor/') || path.startsWith('/fonts/') || path === '/manifest.json' || path === '/sw.js') {
        if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
          const assetRequest = isDev ? stripConditionalHeaders(request) : request;
          let assetResponse = await env.ASSETS.fetch(assetRequest);
          
          if (isDev && assetResponse.status === 304) {
            const bustUrl = new URL(request.url);
            bustUrl.searchParams.set('dev-cache-bust', String(Date.now()));
            assetResponse = await env.ASSETS.fetch(new Request(bustUrl.toString(), assetRequest));
          }
          
          // If asset not found, return 404 immediately
          if (assetResponse.status === 404) {
            console.warn(`Asset not found: ${path}`);
            return respond404();
          }

          if (!isDev) {
            const headers = new Headers(assetResponse.headers);
            const securityHeaders = getAssetSecurityHeaders();
            for (const [key, value] of Object.entries(securityHeaders)) {
              headers.set(key, value);
            }
            return new Response(assetResponse.body, {
              status: assetResponse.status,
              headers
            });
          }
          const headers = new Headers(assetResponse.headers);
          headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
          headers.delete('ETag');
          headers.delete('Last-Modified');
          const securityHeaders = getAssetSecurityHeaders();
          for (const [key, value] of Object.entries(securityHeaders)) {
            headers.set(key, value);
          }
          return new Response(assetResponse.body, {
            status: assetResponse.status === 304 ? 200 : assetResponse.status,
            headers
          });
        }
        console.error('ASSETS binding missing for path:', path);
        return respond404();
      }

      // Favicon
      if (path === '/favicon.ico') {
        // SVG favicon converted to ICO format (embedded as SVG)
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
          <rect width="64" height="64" rx="12" fill="#2563eb"/>
          <path d="M32 16c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16-7.2-16-16-16zm0 6c5.5 0 10 4.5 10 10s-4.5 10-10 10-10-4.5-10-10 4.5-10 10-10z" fill="#fff"/>
          <circle cx="32" cy="32" r="4" fill="#60a5fa"/>
        </svg>`;
        return new Response(svg, {
          headers: {
            ...getAssetSecurityHeaders(),
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000, immutable'
          }
        });
      }

      // Home page
      if (path === '/' || path === '/index.html') {
        return renderHomePage({ isDev, lang: resolveRequestLanguage(request, url) });
      }

      // Legacy routing compatibility: older docs/links used the /tools/<tool-id> prefix.
      if (path === '/tools') {
        const redirectUrl = new URL(request.url);
        redirectUrl.pathname = '/';
        return Response.redirect(redirectUrl.href, 301);
      }

      if (path.startsWith('/tools/')) {
        const redirectUrl = new URL(request.url);
        redirectUrl.pathname = path.slice('/tools'.length).replace(/^\/+/, '/');
        return Response.redirect(redirectUrl.href, 301);
      }

      // Tool routes - path-based

      // Legacy tool redirects (map-driven) — before /tools/ prefix so single-hop works
      const legacyRedirect = tryLegacyRedirect(url);
      if (legacyRedirect) return legacyRedirect;

      // Legacy routing compatibility: older docs/links used the /tools/<tool-id> prefix.
      if (path === '/tools') {
        const redirectUrl = new URL(request.url);
        redirectUrl.pathname = '/';
        return Response.redirect(redirectUrl.href, 301);
      }

      if (path.startsWith('/tools/')) {
        const redirectUrl = new URL(request.url);
        redirectUrl.pathname = path.slice('/tools'.length).replace(/^\/+/, '/');
        return Response.redirect(redirectUrl.href, 301);
      }

      // Pipe Mode
      if (path === '/pipe' || path === '/pipe/') {
        const pipeResponse = await handlePipeRoutes(request, url);
        if (pipeResponse) return pipeResponse;
      }

      // Markdown Editor
      if (path === '/markdown-editor' || path === '/markdown-editor/') {
        const mdResponse = await handleMarkdownEditorRoutes(request, url);
        if (mdResponse) return mdResponse;
      }

      // Active tool routes (registry-driven)
      for (const tool of runtimeTools) {
        const handler = handlersById[tool.id];
        if (!handler) continue;
        if (matchesToolPath(path, tool.path)) {
          return resolveToolResponse(handler, request, url);
        }
      }

      // Legal & Static pages
      if (path === '/terms' || path === '/terms.html') {
        return renderTermsPage(resolveRequestLanguage(request, url));
      }

      if (path === '/privacy' || path === '/privacy.html') {
        return renderPrivacyPage(resolveRequestLanguage(request, url));
      }

      if (path === '/about' || path === '/about.html') {
        return renderAboutPage(resolveRequestLanguage(request, url));
      }

      if (path === '/contact' || path === '/contact.html') {
        return renderContactPage(resolveRequestLanguage(request, url));
      }

      if (path === '/security' || path === '/security.html') {
        return renderSecurityPage(resolveRequestLanguage(request, url));
      }

      if (path === '/careers' || path === '/careers.html') {
        return renderCareersPage(resolveRequestLanguage(request, url));
      }

      // Content pages (blog, FAQ)
      if (path === '/blog' || path === '/blog/' || path.startsWith('/blog/')) {
        const blogResponse = handleBlogRoutes(request, url);
        if (blogResponse) return blogResponse;
      }

      if (path === '/faq' || path === '/faq/') {
        const faqResponse = handleFaqRoutes(request, url);
        if (faqResponse) return faqResponse;
      }

      if (path === '/changelog' || path === '/changelog/') {
        const changelogResponse = await handleChangelogRoutes(request, url);
        if (changelogResponse) return changelogResponse;
      }

      // 404 for everything else
      return respond404();

    } catch (error) {
      Sentry.captureException(error);
      console.error('Worker error', {
        requestId,
        path,
        method: request.method,
        error: error?.message || String(error)
      });
      return respondJSON(
        { error: 'Internal server error' },
        {
          status: 500,
          headers: { 'Cache-Control': 'no-store' }
        }
      );
    }
  }
};

export default Sentry.withSentry(
  (env) => ({
    dsn: env.SENTRY_DSN,
    enabled: Boolean(env.SENTRY_DSN),
    release: env.CF_VERSION_METADATA?.id,
    tracesSampleRate: 1.0
  }),
  worker
);

// Legal pages are now imported from ./ui/legal-pages.js
export { RateLimiter } from './utils/rate-limiter-do.js';
