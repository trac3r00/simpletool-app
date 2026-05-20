import { describe, it, expect } from 'vitest';
import {
  shouldRateLimit,
  sweepRateLimiter,
  generateNonce,
  getSecurityHeaders,
  isLikelySharedIP,
  RATE_LIMIT_MAX_REQUESTS_SHARED_IP,
  KNOWN_SHARED_IP_ASNS
} from './security.js';

describe('Security Utils', () => {
  it('generates unique nonces', () => {
    const nonce1 = generateNonce();
    const nonce2 = generateNonce();
    expect(nonce1).not.toBe(nonce2);
    expect(nonce1.length).toBeGreaterThan(0);
  });

  it('rate limits after threshold', () => {
    const limiter = new Map();
    const ip = '1.2.3.4';
    const now = Date.now();

    for (let i = 0; i < 120; i++) {
      expect(shouldRateLimit(limiter, ip, now)).toBe(false);
    }

    expect(shouldRateLimit(limiter, ip, now)).toBe(true);
  });

  it('cleans up stale entries', () => {
    const limiter = new Map();
    const twoMinutesAgo = Date.now() - 120_000;
    const now = Date.now();

    limiter.set('1.2.3.4', { count: 5, start: twoMinutesAgo });
    limiter.set('5.6.7.8', { count: 3, start: now });

    sweepRateLimiter(limiter, now);

    expect(limiter.has('1.2.3.4')).toBe(false);
    expect(limiter.has('5.6.7.8')).toBe(true);
  });
});

describe('getSecurityHeaders', () => {
  const getCspDirective = (csp, name) => csp.split(';').find(directive => directive.trim().startsWith(name));

  it('returns edge cache headers for HTML', () => {
    const headers = getSecurityHeaders('text/html; charset=utf-8', null, 'test-nonce');
    const csp = headers['Content-Security-Policy'];
    const connectSrc = getCspDirective(csp, 'connect-src');
    const frameSrc = getCspDirective(csp, 'frame-src');

    expect(headers['Cache-Control']).toBe('public, s-maxage=60, max-age=0, must-revalidate');
    expect(headers['Vary']).toBe('Accept-Encoding');
    expect(csp).toContain("script-src 'self' 'nonce-test-nonce'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(connectSrc).toContain('https://*.adtrafficquality.google');
    expect(frameSrc).toContain('https://*.adtrafficquality.google');
  });

  it('uses unsafe-inline fallback and adtrafficquality CSP without a nonce', () => {
    const headers = getSecurityHeaders('text/html; charset=utf-8');
    const csp = headers['Content-Security-Policy'];
    const connectSrc = getCspDirective(csp, 'connect-src');
    const frameSrc = getCspDirective(csp, 'frame-src');

    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'nonce-");
    expect(connectSrc).toContain('https://*.adtrafficquality.google');
    expect(frameSrc).toContain('https://*.adtrafficquality.google');
  });

  it('returns no-store for JSON', () => {
    const headers = getSecurityHeaders('application/json; charset=utf-8');
    expect(headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    expect(headers['Vary']).toBe('Accept-Encoding');
  });

  it('returns no-cache for text', () => {
    const headers = getSecurityHeaders('text/plain; charset=utf-8');
    expect(headers['Cache-Control']).toBe('no-cache, must-revalidate');
    expect(headers['Vary']).toBe('Accept-Encoding');
  });
});

describe('isLikelySharedIP', () => {
  it('returns true for known VPN ASNs', () => {
    const request = { cf: { asn: 13335 } }; // Cloudflare WARP
    expect(isLikelySharedIP(request)).toBe(true);
  });

  it('returns false for regular ISP ASNs', () => {
    const request = { cf: { asn: 12345 } }; // Some random ISP
    expect(isLikelySharedIP(request)).toBe(false);
  });

  it('returns false when request.cf is undefined', () => {
    expect(isLikelySharedIP({})).toBe(false);
    expect(isLikelySharedIP(null)).toBe(false);
    expect(isLikelySharedIP(undefined)).toBe(false);
  });

  it('returns false when asn is not a number', () => {
    const request = { cf: { asn: 'not-a-number' } };
    expect(isLikelySharedIP(request)).toBe(false);
  });
});

describe('Rate limit constants', () => {
  it('has correct shared IP limit', () => {
    expect(RATE_LIMIT_MAX_REQUESTS_SHARED_IP).toBe(240);
  });

  it('contains known VPN ASNs', () => {
    expect(KNOWN_SHARED_IP_ASNS.has(13335)).toBe(true); // Cloudflare
    expect(KNOWN_SHARED_IP_ASNS.has(396982)).toBe(true); // Google Cloud
    expect(KNOWN_SHARED_IP_ASNS.size).toBeGreaterThanOrEqual(7);
  });
});
