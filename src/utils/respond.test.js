import { describe, it, expect } from 'vitest';
import { respondJSON, respondText, respond404, respond429 } from './respond.js';

describe('respondJSON', () => {
  it('returns a Response with JSON content-type', async () => {
    const res = respondJSON({ hello: 'world' });
    expect(res).toBeInstanceOf(Response);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('returns status 200 by default', () => {
    const res = respondJSON({ ok: true });
    expect(res.status).toBe(200);
  });

  it('supports custom status codes', () => {
    const res = respondJSON({ error: 'bad' }, { status: 400 });
    expect(res.status).toBe(400);
  });

  it('serializes data as JSON', async () => {
    const data = { key: 'value', num: 42 };
    const res = respondJSON(data);
    const body = await res.json();
    expect(body).toEqual(data);
  });

  it('includes no-cache headers', () => {
    const res = respondJSON({});
    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });

  it('allows header overrides', () => {
    const res = respondJSON({}, { headers: { 'X-Custom': 'test' } });
    expect(res.headers.get('X-Custom')).toBe('test');
  });
});

describe('respondText', () => {
  it('returns a Response with text/plain content-type', () => {
    const res = respondText('hello');
    expect(res.headers.get('Content-Type')).toContain('text/plain');
  });

  it('returns the text body', async () => {
    const res = respondText('hello world');
    const body = await res.text();
    expect(body).toBe('hello world');
  });

  it('supports custom status', () => {
    const res = respondText('error', { status: 500 });
    expect(res.status).toBe(500);
  });
});

describe('respond404', () => {
  it('returns status 404', () => {
    const res = respond404();
    expect(res.status).toBe(404);
  });

  it('returns HTML content', () => {
    const res = respond404();
    expect(res.headers.get('Content-Type')).toContain('text/html');
  });
});

describe('respond429', () => {
  it('returns status 429', () => {
    const res = respond429();
    expect(res.status).toBe(429);
  });

  it('includes Retry-After header when specified', () => {
    const res = respond429({ retryAfterSeconds: 30 });
    expect(res.headers.get('Retry-After')).toBe('30');
  });

  it('omits Retry-After when not specified', () => {
    const res = respond429();
    expect(res.headers.get('Retry-After')).toBeNull();
  });

  it('omits Retry-After for invalid values', () => {
    const res = respond429({ retryAfterSeconds: -1 });
    expect(res.headers.get('Retry-After')).toBeNull();
  });

  it('returns JSON error body', async () => {
    const res = respond429();
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body.error).toContain('Rate limit');
  });
});
