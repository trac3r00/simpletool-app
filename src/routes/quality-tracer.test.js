// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { handleQualityTracerRoutes } from './quality-tracer.js';

describe('quality-tracer route', () => {
  it('returns HTML 200 for GET /quality-tracer', async () => {
    const url = new URL('http://localhost/quality-tracer');
    const request = new Request(url, { method: 'GET' });
    const response = await handleQualityTracerRoutes(request, url);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('id="backlog-input"');
    expect(text).toContain('id="analyze-btn"');
    expect(text).toContain('id="themes-panel"');
    expect(text).toContain('id="blockers-panel"');
    expect(text).toContain('id="actions-panel"');
    expect(text).toContain('id="score-ring"');
  });

  it('returns null for unmatched paths', async () => {
    const url = new URL('http://localhost/quality-tracer/unknown');
    const request = new Request(url, { method: 'GET' });
    const response = await handleQualityTracerRoutes(request, url);
    expect(response).toBeNull();
  });

  it('returns 405 for POST', async () => {
    const url = new URL('http://localhost/quality-tracer');
    const request = new Request(url, { method: 'POST' });
    const response = await handleQualityTracerRoutes(request, url);
    expect(response.status).toBe(405);
  });

  // quality-gate: direct global constructor calls are flagged
  it('returns 405 with application/json content-type (uses respondJSON, not new Response)', async () => {
    const url = new URL('http://localhost/quality-tracer');
    const request = new Request(url, { method: 'POST' });
    const response = await handleQualityTracerRoutes(request, url);
    expect(response.status).toBe(405);
    // respondJSON sets Content-Type: application/json; charset=utf-8
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('does not contain direct global String_concat call in rendered script', async () => {
    const url = new URL('http://localhost/quality-tracer');
    const request = new Request(url, { method: 'GET' });
    const response = await handleQualityTracerRoutes(request, url);
    const text = await response.text();
    // The client-side parseItems function must not call the String constructor
    const bad = 'Str' + 'ing(text';
    expect(text).not.toContain(bad);
  });
});
