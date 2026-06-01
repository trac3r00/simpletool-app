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
});
