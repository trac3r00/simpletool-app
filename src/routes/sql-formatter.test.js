// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { handleSQLFormatterRoutes } from './sql-formatter.js';

function createEscapeHtml() {
  return (value) => {
    const v = String(value ?? '');
    return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  };
}

describe('sql-formatter route', () => {
  describe('route handler', () => {
    it('returns HTML for GET /sql-formatter', async () => {
      const url = new URL('http://localhost/sql-formatter');
      const request = new Request(url, { method: 'GET' });
      const response = await handleSQLFormatterRoutes(request, url);
      expect(response).not.toBeNull();
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });

    it('contains escaped where in the rendered issues source', async () => {
      const url = new URL('http://localhost/sql-formatter');
      const request = new Request(url, { method: 'GET' });
      const response = await handleSQLFormatterRoutes(request, url);
      const text = await response.text();
      expect(text).toContain('escapeHtml(where)');
    });
  });

  describe('escapeHtml behavior', () => {
    it('escapes HTML special characters', () => {
      const escapeHtml = createEscapeHtml();
      expect(escapeHtml('&')).toBe('&amp;');
      expect(escapeHtml('<')).toBe('&lt;');
      expect(escapeHtml('>')).toBe('&gt;');
      expect(escapeHtml('"')).toBe('&quot;');
      expect(escapeHtml("'")).toBe('&#039;');
    });

    it('escapes a script tag payload', () => {
      const escapeHtml = createEscapeHtml();
      expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });
  });
});
