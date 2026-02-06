/**
 * Security utilities for rate limiting and headers
 */

export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_REQUESTS = 120;

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

export function shouldRateLimit(rateLimiter, ip, now) {
  if (!ip || ip === 'unknown') return false;

  const entry = rateLimiter.get(ip);
  if (!entry || now - entry.start >= RATE_LIMIT_WINDOW_MS) {
    rateLimiter.set(ip, { count: 1, start: now });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
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
  let defaultCacheControl = 'private, no-cache, must-revalidate'; // HTML pages: no caching due to CSP nonce

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
    'https://www.googletagmanager.com'
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
    'https://analytics.google.com'
  ].join(' ');

  if (nonce) {
    csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}' ${adScriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; media-src 'self' data: blob:; connect-src 'self' ${adConnectSrc}; font-src 'self' data:; frame-src 'self' ${adFrameSrc};`;
  } else {
    // Fallback for non-HTML responses
    csp = `default-src 'self'; script-src 'self' 'unsafe-inline' ${adScriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; media-src 'self' data: blob:; connect-src 'self' ${adConnectSrc}; font-src 'self' data:; frame-src 'self' ${adFrameSrc};`;
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
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Server': 'SimpleTool-Worker/2.0'
  };
}
