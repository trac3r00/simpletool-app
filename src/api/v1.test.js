/**
 * API v1 unit tests — transforms only
 */

import { describe, it, expect } from 'vitest';

// Polyfill btoa/atob for Node
if (typeof globalThis.btoa === 'undefined') {
  globalThis.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
  globalThis.atob = (str) => Buffer.from(str, 'base64').toString('binary');
}

import { handleApiV1 } from './v1.js';

function makeRequest(method, path, body = null) {
  const url = new URL(`https://simpletool.app${path}`);
  const headers = new Headers({
    'CF-Connecting-IP': '1.2.3.4',
  });
  if (body) {
    headers.set('Content-Type', 'application/json');
  }
  return {
    request: new Request(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    }),
    url,
  };
}

async function callApi(method, path, body = null) {
  const { request, url } = makeRequest(method, path, body);
  const response = await handleApiV1(request, url);
  const data = await response.json();
  return { response, data };
}

describe('API v1 — transforms', () => {
  describe('GET /api/v1/transforms', () => {
    it('returns list of transforms', async () => {
      const { response, data } = await callApi('GET', '/api/v1/transforms');
      expect(response.status).toBe(200);
      expect(data.version).toBe('v1');
      expect(data.transforms).toBeInstanceOf(Array);
      expect(data.transforms.length).toBe(5);
      expect(data.rateLimit).toBeDefined();
    });

    it('includes all contract transforms', async () => {
      const { data } = await callApi('GET', '/api/v1/transforms');
      const ids = data.transforms.map(t => t.id);
      expect(ids).toContain('base64');
      expect(ids).toContain('json-format');
      expect(ids).toContain('url-encode');
      expect(ids).toContain('case-converter');
      expect(ids).toContain('line-sort');
    });
  });

  describe('POST /api/v1/transform/:id', () => {
    it('base64 encode', async () => {
      const { response, data } = await callApi('POST', '/api/v1/transform/base64', {
        input: 'Hello World',
        options: { mode: 'encode' },
      });
      expect(response.status).toBe(200);
      expect(data.output).toBe('SGVsbG8gV29ybGQ=');
      expect(data.transform).toBe('base64');
    });

    it('base64 decode', async () => {
      const { data } = await callApi('POST', '/api/v1/transform/base64', {
        input: 'SGVsbG8gV29ybGQ=',
        options: { mode: 'decode' },
      });
      expect(data.output).toBe('Hello World');
    });

    it('json-format prettify', async () => {
      const { data } = await callApi('POST', '/api/v1/transform/json-format', {
        input: '{"a":1,"b":2}',
        options: { mode: 'format', indent: 2 },
      });
      expect(data.output).toBe('{\n  "a": 1,\n  "b": 2\n}');
    });

    it('json-format minify', async () => {
      const { data } = await callApi('POST', '/api/v1/transform/json-format', {
        input: '{\n  "a": 1,\n  "b": 2\n}',
        options: { mode: 'minify' },
      });
      expect(data.output).toBe('{"a":1,"b":2}');
    });

    it('url-encode', async () => {
      const { data } = await callApi('POST', '/api/v1/transform/url-encode', {
        input: 'hello world&foo=bar',
        options: { mode: 'encode' },
      });
      expect(data.output).toBe('hello%20world%26foo%3Dbar');
    });

    it('url-decode', async () => {
      const { data } = await callApi('POST', '/api/v1/transform/url-encode', {
        input: 'hello%20world%26foo%3Dbar',
        options: { mode: 'decode' },
      });
      expect(data.output).toBe('hello world&foo=bar');
    });

    it('case-converter to snake_case', async () => {
      const { data } = await callApi('POST', '/api/v1/transform/case-converter', {
        input: 'Hello World',
        options: { style: 'snake' },
      });
      expect(data.output).toBe('hello_world');
    });

    it('case-converter to camelCase', async () => {
      const { data } = await callApi('POST', '/api/v1/transform/case-converter', {
        input: 'hello world',
        options: { style: 'camel' },
      });
      expect(data.output).toBe('helloWorld');
    });

    it('case-converter to CONSTANT_CASE', async () => {
      const { data } = await callApi('POST', '/api/v1/transform/case-converter', {
        input: 'hello world',
        options: { style: 'constant' },
      });
      expect(data.output).toBe('HELLO_WORLD');
    });

    it('line-sort sort-dedupe', async () => {
      const { data } = await callApi('POST', '/api/v1/transform/line-sort', {
        input: 'c\na\nb\na\nc',
        options: { mode: 'sort-dedupe' },
      });
      expect(data.output).toBe('a\nb\nc');
    });

    it('rejects unknown transform', async () => {
      const { response, data } = await callApi('POST', '/api/v1/transform/nonexistent', {
        input: 'test',
      });
      expect(response.status).toBe(404);
      expect(data.error).toContain('Unknown transform');
    });

    it('rejects GET method', async () => {
      const { response } = await callApi('GET', '/api/v1/transform/base64');
      expect(response.status).toBe(405);
    });

    it('rejects non-string input', async () => {
      const { response, data } = await callApi('POST', '/api/v1/transform/base64', {
        input: 12345,
      });
      expect(response.status).toBe(400);
      expect(data.error).toContain('input must be a string');
    });

    it('rejects oversized input', async () => {
      const { response, data } = await callApi('POST', '/api/v1/transform/base64', {
        input: 'x'.repeat(200_000),
      });
      expect(response.status).toBe(400);
      expect(data.error).toContain('exceeds');
    });

    it('rejects wrong Content-Type', async () => {
      const url = new URL('https://simpletool.app/api/v1/transform/base64');
      const request = new Request(url.toString(), {
        method: 'POST',
        headers: { 'CF-Connecting-IP': '1.2.3.4', 'Content-Type': 'text/plain' },
        body: 'not json',
      });
      const response = await handleApiV1(request, url);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toContain('Content-Type');
    });
  });

  describe('CORS', () => {
    it('returns CORS headers on responses', async () => {
      const { response } = await callApi('GET', '/api/v1/transforms');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('handles OPTIONS preflight', async () => {
      const { request, url } = makeRequest('OPTIONS', '/api/v1/transforms');
      const response = await handleApiV1(request, url);
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('Rate limit headers', () => {
    it('includes X-RateLimit-* headers', async () => {
      const { response } = await callApi('GET', '/api/v1/transforms');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('30');
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
    });
  });

  describe('404 for unknown API paths', () => {
    it('returns 404 with guidance', async () => {
      const { response, data } = await callApi('GET', '/api/v1/nonexistent');
      expect(response.status).toBe(404);
      expect(data.error).toContain('Not found');
    });
  });
});
