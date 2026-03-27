import { describe, it, expect } from 'vitest';
import { testContract } from './test-helper.js';
import urlEncode from './url-encode.js';

testContract(urlEncode);

describe('url-encode transform', () => {
  it('encodes text', () => {
    expect(urlEncode.transform('hello world', { mode: 'encode' })).toBe('hello%20world');
  });

  it('decodes text', () => {
    expect(urlEncode.transform('hello%20world', { mode: 'decode' })).toBe('hello world');
  });

  it('encodes special characters', () => {
    expect(urlEncode.transform('a=1&b=2', { mode: 'encode' })).toBe('a%3D1%26b%3D2');
  });

  it('defaults to encode', () => {
    expect(urlEncode.transform('hello world')).toBe('hello%20world');
  });

  it('returns empty string for null', () => {
    expect(urlEncode.transform(null)).toBe('');
  });
});
