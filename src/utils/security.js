/**
 * Security utilities for rate limiting and headers
 */

export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_REQUESTS = 120;
export const RATE_LIMIT_MAX_REQUESTS_SHARED_IP = 240;

export const KNOWN_SHARED_IP_ASNS = new Set([
  13335,   // Cloudflare (WARP VPN)
  396982,  // Google LLC (Cloud VPN)
  14618,   // Amazon (AWS VPN endpoints)
  8075,    // Microsoft (Azure VPN)
  20473,   // Choopa/Vultr (VPN providers)
  60068,   // Datacamp Limited (CDN/proxy)
  209242,  // Cloudflare WARP consumer
]);

export function isLikelySharedIP(request) {
  if (!request || !request.cf) return false;
  const asn = request.cf.asn;
  return typeof asn === 'number' && KNOWN_SHARED_IP_ASNS.has(asn);
}

/**
 * Generate a cryptographically secure nonce for CSP
 * @returns {string} Base64-encoded nonce
 */
export function generateNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Convert to base64
  return btoa(String.fromCharCode(...bytes));
}

export function shouldRateLimit(rateLimiter, ip, now, maxRequests = RATE_LIMIT_MAX_REQUESTS) {
  if (!ip || ip === 'unknown') return false;

  const entry = rateLimiter.get(ip);
  if (!entry || now - entry.start >= RATE_LIMIT_WINDOW_MS) {
    rateLimiter.set(ip, { count: 1, start: now });
    return false;
  }

  entry.count += 1;
  return entry.count > maxRequests;
}

export function sweepRateLimiter(rateLimiter, now) {
  const toDelete = [];
  for (const [ip, entry] of rateLimiter.entries()) {
    if (now - entry.start >= RATE_LIMIT_WINDOW_MS) {
      toDelete.push(ip);
    }
  }
  toDelete.forEach(ip => rateLimiter.delete(ip));
}

export function getSecurityHeaders(contentType = 'text/html; charset=utf-8', cacheControl = null, nonce = null) {
  // Default cache control based on content type
  let defaultCacheControl = 'public, s-maxage=60, max-age=0, must-revalidate'; // HTML pages: 60s edge cache, browser no-cache

  if (contentType.startsWith('application/json')) {
    defaultCacheControl = 'no-store, no-cache, must-revalidate'; // API/JSON: no caching
  } else if (contentType.startsWith('text/plain')) {
    defaultCacheControl = 'no-cache, must-revalidate'; // Text responses
  }

  // Build CSP with nonce if provided (eliminates need for unsafe-inline)
  let csp;
  const adScriptSrc = [
    'https://pagead2.googlesyndication.com',
    'https://www.googletagservices.com',
    'https://tpc.googlesyndication.com',
    'https://googleads.g.doubleclick.net',
    'https://adservice.google.com',
    'https://www.googletagmanager.com',
    'https://static.cloudflareinsights.com'
  ].join(' ');

  const adFrameSrc = [
    'https://googleads.g.doubleclick.net',
    'https://tpc.googlesyndication.com',
    'https://pagead2.googlesyndication.com'
  ].join(' ');

  const adConnectSrc = [
    'https://pagead2.googlesyndication.com',
    'https://googleads.g.doubleclick.net',
    'https://adservice.google.com',
    'https://tpc.googlesyndication.com',
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://analytics.google.com',
    'https://cloudflareinsights.com'
  ].join(' ');

  if (nonce) {
    csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}' ${adScriptSrc}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; media-src 'self' data: blob:; connect-src 'self' ${adConnectSrc}; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self' ${adFrameSrc};`;
  } else {
    // Fallback for non-HTML responses
    csp = `default-src 'self'; script-src 'self' 'unsafe-inline' ${adScriptSrc}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; media-src 'self' data: blob:; connect-src 'self' ${adConnectSrc}; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self' ${adFrameSrc};`;
  }


  return {
    'Content-Type': contentType,
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'screen-wake-lock=(self), camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': csp,
    'Cache-Control': cacheControl || defaultCacheControl,
    'Vary': 'Accept-Encoding',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Server': 'SimpleTool-Worker/2.0'
  };
}
