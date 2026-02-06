import { describe, it, expect } from 'vitest';
import { shouldRateLimit, sweepRateLimiter, generateNonce } from './security.js';

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
