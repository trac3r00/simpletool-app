/**
 * Durable Object rate limiter for global enforcement.
 */

import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from './security.js';

const STATE_KEY = 'rate-state';

export class RateLimiter {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== '/check') {
      return new Response('Not found', { status: 404 });
    }

    const now = Number(url.searchParams.get('now')) || Date.now();
    const limit = Number(url.searchParams.get('limit')) || RATE_LIMIT_MAX_REQUESTS;
    const windowMs = Number(url.searchParams.get('windowMs')) || RATE_LIMIT_WINDOW_MS;

    let data = await this.state.storage.get(STATE_KEY);
    if (!data || now - data.start >= windowMs) {
      data = { count: 0, start: now };
    }

    data.count += 1;

    await this.state.storage.put(STATE_KEY, data, {
      expirationTtl: Math.ceil(windowMs / 1000) + 1
    });

    const limited = data.count > limit;
    const retryAfterMs = limited ? Math.max(0, windowMs - (now - data.start)) : 0;

    return new Response(
      JSON.stringify({
        limited,
        remaining: Math.max(0, limit - data.count),
        reset: data.start + windowMs,
        retryAfterMs
      }),
      { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}
