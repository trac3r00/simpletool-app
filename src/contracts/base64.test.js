import { describe, it, expect } from 'vitest';
import { testContract } from './test-helper.js';
import base64 from './base64.js';

testContract(base64);

describe('base64 transform', () => {
  it('encodes text to base64', () => {
    expect(base64.transform('Hello World', { mode: 'encode' })).toBe('SGVsbG8gV29ybGQ=');
  });

  it('decodes base64 to text', () => {
    expect(base64.transform('SGVsbG8gV29ybGQ=', { mode: 'decode' })).toBe('Hello World');
  });

  it('defaults to encode', () => {
    expect(base64.transform('test')).toBe('dGVzdA==');
  });

  it('returns empty string for null', () => {
    expect(base64.transform(null)).toBe('');
  });

  it('handles invalid base64 on decode gracefully', () => {
    const result = base64.transform('not-valid-base64!!!', { mode: 'decode' });
    expect(typeof result).toBe('string');
  });
});
