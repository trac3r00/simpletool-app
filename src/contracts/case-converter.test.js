import { describe, it, expect } from 'vitest';
import { testContract } from './test-helper.js';
import caseConverter from './case-converter.js';

testContract(caseConverter);

describe('case-converter transform', () => {
  it('converts to camelCase', () => {
    expect(caseConverter.transform('hello world', { style: 'camel' })).toBe('helloWorld');
  });

  it('converts to snake_case', () => {
    expect(caseConverter.transform('Hello World', { style: 'snake' })).toBe('hello_world');
  });

  it('converts to kebab-case', () => {
    expect(caseConverter.transform('Hello World', { style: 'kebab' })).toBe('hello-world');
  });

  it('converts to PascalCase', () => {
    expect(caseConverter.transform('hello world', { style: 'pascal' })).toBe('HelloWorld');
  });

  it('converts to UPPER', () => {
    expect(caseConverter.transform('hello', { style: 'upper' })).toBe('HELLO');
  });

  it('converts to lower', () => {
    expect(caseConverter.transform('HELLO', { style: 'lower' })).toBe('hello');
  });

  it('converts to CONSTANT_CASE', () => {
    expect(caseConverter.transform('hello world', { style: 'constant' })).toBe('HELLO_WORLD');
  });

  it('defaults to camel when no style given', () => {
    expect(caseConverter.transform('hello world')).toBe('helloWorld');
  });

  it('returns empty string for null', () => {
    expect(caseConverter.transform(null)).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(caseConverter.transform('')).toBe('');
  });
});
