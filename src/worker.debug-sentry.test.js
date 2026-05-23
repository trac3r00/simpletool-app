import { describe, it, expect, vi, beforeEach } from 'vitest';

const captureException = vi.fn();

vi.mock('@sentry/cloudflare', () => ({
  captureException,
  withSentry: (_opts, handler) => handler
}));

const { __workerForTests: worker } = await import('./worker.js');

function makeRequest(urlString, init = {}) {
  return new Request(urlString, { method: 'GET', ...init });
}

function makeEnv(overrides = {}) {
  return {
    ENVIRONMENT: 'production',
    ASSETS: { fetch: async () => new Response('', { status: 404 }) },
    ...overrides
  };
}

const ctx = { waitUntil() {}, passThroughOnException() {} };

describe('GET /debug-sentry exposure (issue #13)', () => {
  beforeEach(() => {
    captureException.mockClear();
  });

  it('returns 404 in production without throwing or capturing to Sentry', async () => {
    const res = await worker.fetch(
      makeRequest('https://simpletool.app/debug-sentry'),
      makeEnv(),
      ctx
    );

    expect(res.status).toBe(404);
    expect(captureException).not.toHaveBeenCalled();
  });

  it('returns 404 on non-localhost hosts even when ENVIRONMENT is unset', async () => {
    const res = await worker.fetch(
      makeRequest('https://simpletool.app/debug-sentry'),
      makeEnv({ ENVIRONMENT: undefined }),
      ctx
    );

    expect(res.status).toBe(404);
    expect(captureException).not.toHaveBeenCalled();
  });

  it('still throws and captures via Sentry on localhost (dev wiring probe)', async () => {
    const res = await worker.fetch(
      makeRequest('http://localhost:8787/debug-sentry'),
      makeEnv({ ENVIRONMENT: 'development' }),
      ctx
    );

    expect(res.status).toBe(500);
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(captureException.mock.calls[0][0].message).toBe('Sentry test error');
  });
});
