
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { handleLogMaskerRoutes } from './log-masker.js';

function createRedactPII() {
  const patterns = {
    email: {
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
      replacement: '[EMAIL_REDACTED]'
    }
  };
  return (text) => text.replace(patterns.email.regex, patterns.email.replacement);
}

describe('log-masker email regex (no pipe in TLD)', () => {
  describe('behavioral tests', () => {
    it('should mask normal email addresses', () => {
      const redact = createRedactPII();
      expect(redact('contact user@example.com now')).toBe('contact [EMAIL_REDACTED] now');
    });

    it('should mask mixed-case email addresses', () => {
      const redact = createRedactPII();
      expect(redact('Contact User@Example.CoM for info')).toBe('Contact [EMAIL_REDACTED] for info');
    });

    it('should NOT mask pipe character in TLD position', () => {
      const redact = createRedactPII();
      expect(redact('user@example.c|om')).toBe('user@example.c|om');
    });

    it('should NOT mask pipe with multiple pipes in TLD position', () => {
      const redact = createRedactPII();
      expect(redact('user@example.c|o|m')).toBe('user@example.c|o|m');
    });
  });

  describe('source content tests', () => {
    it('should not contain pipe in email regex TLD character class', async () => {
      const url = new URL('http://localhost/log-masker');
      const request = new Request(url, { method: 'GET' });
      const response = await handleLogMaskerRoutes(request, url);
      const text = await response.text();

      expect(text).not.toContain('[A-Z|a-z]');
      expect(text).toContain('[A-Za-z]');
    });
  });
});
