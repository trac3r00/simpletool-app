import { describe, it, expect } from 'vitest';
import { countKeys } from './json-stats.js';

describe('countKeys', () => {
  describe('depth conventions', () => {
    it('treats a non-empty root object as depth 1', () => {
      expect(countKeys({ a: 1 })).toEqual({ count: 1, maxDepth: 1 });
    });

    it('treats a nested object as the parents depth + 1 (regression: was off-by-one)', () => {
      // BUG 2: previously {"a":{"b":1}} reported maxDepth = 1 instead of 2.
      expect(countKeys({ a: { b: 1 } })).toEqual({ count: 2, maxDepth: 2 });
    });

    it('reports the deepest path for asymmetric nesting', () => {
      const value = { a: 1, b: { c: { d: { e: 1 } } } };
      // top, b, c, d → depth 4
      expect(countKeys(value).maxDepth).toBe(4);
    });

    it('returns depth 0 for primitive roots', () => {
      expect(countKeys(42)).toEqual({ count: 0, maxDepth: 0 });
      expect(countKeys('hello')).toEqual({ count: 0, maxDepth: 0 });
      expect(countKeys(true)).toEqual({ count: 0, maxDepth: 0 });
      expect(countKeys(null)).toEqual({ count: 0, maxDepth: 0 });
    });

    it('returns depth 1 for an empty object or array (the container exists)', () => {
      expect(countKeys({})).toEqual({ count: 0, maxDepth: 1 });
      expect(countKeys([])).toEqual({ count: 0, maxDepth: 1 });
    });
  });

  describe('key counting', () => {
    it('counts only own properties of objects, not array indices (regression: was inflated)', () => {
      // BUG 3: previously the QA input below reported 7 KEYS instead of 5.
      // Objects: name, tools, meta, valid, count → 5
      // Arrays: ["json","jwt"] should contribute 0
      const input = {
        name: 'Daniel',
        tools: ['json', 'jwt'],
        meta: { valid: true, count: 42 }
      };
      expect(countKeys(input)).toEqual({ count: 5, maxDepth: 2 });
    });

    it('counts keys recursively through nested objects', () => {
      const value = { a: { b: { c: 1 } } };
      // a + b + c = 3 keys
      expect(countKeys(value).count).toBe(3);
    });

    it('skips over array elements when counting keys, even when the array contains objects', () => {
      const value = { items: [{ k1: 1 }, { k2: 2 }] };
      // items + k1 + k2 = 3 keys (array indices NOT counted)
      expect(countKeys(value)).toEqual({ count: 3, maxDepth: 3 });
    });

    it('handles deeply nested mixed structures', () => {
      const value = {
        users: [
          { id: 1, profile: { name: 'a' } },
          { id: 2, profile: { name: 'b' } }
        ]
      };
      // users + (id + profile + name)*2 = 1 + 6 = 7
      expect(countKeys(value).count).toBe(7);
      // root → users array (2) → user obj (3) → profile (4) → name leaf
      expect(countKeys(value).maxDepth).toBe(4);
    });
  });

  describe('immutability and edge cases', () => {
    it('does not mutate the input', () => {
      const value = { a: 1, b: { c: 2 } };
      const snapshot = JSON.stringify(value);
      countKeys(value);
      expect(JSON.stringify(value)).toBe(snapshot);
    });

    it('treats undefined as a primitive (depth 0, count 0)', () => {
      expect(countKeys(undefined)).toEqual({ count: 0, maxDepth: 0 });
    });

    it('does not count inherited properties', () => {
      const proto = { inherited: 'should not count' };
      const value = Object.create(proto);
      value.own = 'should count';
      expect(countKeys(value)).toEqual({ count: 1, maxDepth: 1 });
    });
  });
});
