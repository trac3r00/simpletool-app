import { describe, it, expect } from 'vitest';
import { handleWebhookDebuggerRoutes } from './webhook-debugger.js';

function makeRequest(method, url, options = {}) {
  const parsed = new URL(url, 'http://localhost');
  const headers = new Headers(options.headers || {});
  return {
    request: new Request(url, { method, headers, body: options.body }),
    url: parsed
  };
}

describe('handleWebhookDebuggerRoutes', () => {
  describe('GET /webhook-debugger', () => {
    it('returns an HTML response for the main page', async () => {
      const { request, url } = makeRequest('GET', 'http://localhost/webhook-debugger');
      const res = await handleWebhookDebuggerRoutes(request, url);
      expect(res).toBeInstanceOf(Response);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/html');
    });
  });

  describe('GET /webhook-debugger/listen', () => {
    it('returns a minimal HTML page for the listener iframe', async () => {
      const { request, url } = makeRequest('GET', 'http://localhost/webhook-debugger/listen?session=abc123&origin=http://localhost');
      const res = await handleWebhookDebuggerRoutes(request, url);
      expect(res).toBeInstanceOf(Response);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/html');
      const body = await res.text();
      expect(body).toContain('whd_capture');
      expect(body).toContain('whd_register');
      expect(body).toContain('abc123');
    });

    it('returns null for non-GET methods', async () => {
      const { request, url } = makeRequest('POST', 'http://localhost/webhook-debugger/listen');
      const res = await handleWebhookDebuggerRoutes(request, url);
      expect(res).toBeNull();
    });
  });

  describe('/webhook-debugger/capture', () => {
    it('handles OPTIONS preflight with CORS headers', async () => {
      const { request, url } = makeRequest('OPTIONS', 'http://localhost/webhook-debugger/capture');
      const res = await handleWebhookDebuggerRoutes(request, url);
      expect(res).toBeInstanceOf(Response);
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('captures a POST request and returns JSON echo', async () => {
      const { request, url } = makeRequest('POST', 'http://localhost/webhook-debugger/capture', {
        headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': 'sha256=abc123' },
        body: JSON.stringify({ event: 'push', ref: 'refs/heads/main' })
      });
      const res = await handleWebhookDebuggerRoutes(request, url);
      expect(res).toBeInstanceOf(Response);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('application/json');
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');

      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.captured).toBeDefined();
      expect(data.captured.method).toBe('POST');
      expect(data.captured.body).toContain('"event":"push"');
      expect(data.captured.contentType).toBe('application/json');
      expect(data.captured.timestamp).toBeTypeOf('number');
    });

    it('captures a GET request with empty body', async () => {
      const { request, url } = makeRequest('GET', 'http://localhost/webhook-debugger/capture?foo=bar');
      const res = await handleWebhookDebuggerRoutes(request, url);
      expect(res).toBeInstanceOf(Response);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.captured.method).toBe('GET');
      expect(data.captured.path).toContain('?foo=bar');
    });

    it('captures PUT, DELETE, PATCH requests', async () => {
      for (const method of ['PUT', 'DELETE', 'PATCH']) {
        const { request, url } = makeRequest(method, 'http://localhost/webhook-debugger/capture', {
          body: 'test body'
        });
        const res = await handleWebhookDebuggerRoutes(request, url);
        const data = await res.json();
        expect(data.ok).toBe(true);
        expect(data.captured.method).toBe(method);
      }
    });
  });

  describe('unknown sub-paths', () => {
    it('returns null for /webhook-debugger/unknown', async () => {
      const { request, url } = makeRequest('GET', 'http://localhost/webhook-debugger/unknown');
      const res = await handleWebhookDebuggerRoutes(request, url);
      expect(res).toBeNull();
    });
  });
});
