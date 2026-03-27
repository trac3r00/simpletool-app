import { describe, it, expect } from 'vitest';
import { testContract } from './test-helper.js';
import lineSort from './line-sort.js';

testContract(lineSort);

describe('line-sort transform', () => {
  it('sorts lines alphabetically', () => {
    expect(lineSort.transform('cherry\napple\nbanana')).toBe('apple\nbanana\ncherry');
  });

  it('sorts in reverse', () => {
    expect(lineSort.transform('a\nb\nc', { mode: 'reverse' })).toBe('c\nb\na');
  });

  it('deduplicates lines', () => {
    expect(lineSort.transform('a\nb\na\nc\nb', { mode: 'dedupe' })).toBe('a\nb\nc');
  });

  it('sorts and deduplicates', () => {
    expect(lineSort.transform('c\na\nb\na', { mode: 'sort-dedupe' })).toBe('a\nb\nc');
  });

  it('returns empty string for null', () => {
    expect(lineSort.transform(null)).toBe('');
  });

  it('handles single line', () => {
    expect(lineSort.transform('only')).toBe('only');
  });

  it('handles empty lines', () => {
    expect(lineSort.transform('b\n\na')).toBe('\na\nb');
  });
});
