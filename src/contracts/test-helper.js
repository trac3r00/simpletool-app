/**
 * Shared test helper for contract validation.
 * Usage: testContract(myContract) generates standard tests.
 */

import { describe, it, expect } from 'vitest';

const VALID_TYPES = ['text', 'json', 'csv', 'number', 'url'];

export function testContract(contract) {
  describe(`Contract: ${contract.id}`, () => {
    it('has valid schema', () => {
      expect(contract.id).toBeTruthy();
      expect(typeof contract.id).toBe('string');
      expect(contract.name).toBeTruthy();
      expect(typeof contract.name).toBe('string');
      expect(Array.isArray(contract.inputTypes)).toBe(true);
      expect(contract.inputTypes.length).toBeGreaterThan(0);
      expect(Array.isArray(contract.outputTypes)).toBe(true);
      expect(contract.outputTypes.length).toBeGreaterThan(0);
      expect(typeof contract.transform).toBe('function');
    });

    it('uses valid types', () => {
      for (const t of contract.inputTypes) {
        expect(VALID_TYPES).toContain(t);
      }
      for (const t of contract.outputTypes) {
        expect(VALID_TYPES).toContain(t);
      }
    });

    it('handles null input without throwing', () => {
      expect(() => contract.transform(null)).not.toThrow();
    });

    it('handles empty string input without throwing', () => {
      expect(() => contract.transform('')).not.toThrow();
    });

    it('handles undefined input without throwing', () => {
      expect(() => contract.transform(undefined)).not.toThrow();
    });

    it('returns a value (not undefined) for valid input', () => {
      const sample = getSampleInput(contract.inputTypes[0]);
      const result = contract.transform(sample);
      expect(result).not.toBeUndefined();
    });

    if (contract.options && contract.options.length > 0) {
      it('has valid options schema', () => {
        for (const opt of contract.options) {
          expect(opt.id).toBeTruthy();
          expect(typeof opt.id).toBe('string');
          expect(opt.type).toBeTruthy();
        }
      });
    }
  });
}

function getSampleInput(type) {
  switch (type) {
    case 'text': return 'Hello World test input';
    case 'json': return '{"key": "value"}';
    case 'csv': return 'name,age\nAlice,30\nBob,25';
    case 'number': return '42';
    case 'url': return 'https://example.com/path?q=test';
    default: return 'test';
  }
}
