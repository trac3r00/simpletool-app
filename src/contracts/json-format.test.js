import { describe, it, expect } from 'vitest';
import { testContract } from './test-helper.js';
import jsonFormat from './json-format.js';

testContract(jsonFormat);

describe('json-format transform', () => {
  it('formats compact JSON', () => {
    const input = '{"a":1,"b":2}';
    const result = jsonFormat.transform(input, { mode: 'format' });
    expect(result).toContain('\n');
    expect(result).toContain('  "a": 1');
  });

  it('minifies formatted JSON', () => {
    const input = '{\n  "a": 1,\n  "b": 2\n}';
    const result = jsonFormat.transform(input, { mode: 'minify' });
    expect(result).toBe('{"a":1,"b":2}');
  });

  it('defaults to format', () => {
    const result = jsonFormat.transform('{"x":1}');
    expect(result).toContain('\n');
  });

  it('returns error message for invalid JSON', () => {
    const result = jsonFormat.transform('not json');
    expect(result).toContain('Error');
  });

  it('returns empty string for null', () => {
    expect(jsonFormat.transform(null)).toBe('');
  });

  it('handles nested objects', () => {
    const input = '{"a":{"b":{"c":1}}}';
    const result = jsonFormat.transform(input);
    expect(result).toContain('      "c": 1');
  });
});
