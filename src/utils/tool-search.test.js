import { describe, it, expect } from 'vitest';
import { filterTools } from './tool-search.js';
import { TOOLS } from './tool-registry.js';

describe('filterTools', () => {
  it('returns all tools when query is empty', () => {
    expect(filterTools(TOOLS, '').length).toBe(TOOLS.length);
  });

  it('returns all tools when query is whitespace only', () => {
    expect(filterTools(TOOLS, '   ').length).toBe(TOOLS.length);
  });

  it("'json' matches json-formatter", () => {
    const results = filterTools(TOOLS, 'json');
    expect(results.some((t) => t.id === 'json-formatter')).toBe(true);
  });

  it("'json' does NOT match ladder-game", () => {
    const results = filterTools(TOOLS, 'json');
    expect(results.some((t) => t.id === 'ladder-game')).toBe(false);
  });

  it("'json' does NOT match token-studio", () => {
    const results = filterTools(TOOLS, 'json');
    expect(results.some((t) => t.id === 'token-studio')).toBe(false);
  });

  it("'json' does NOT match caffeniate", () => {
    const results = filterTools(TOOLS, 'json');
    expect(results.some((t) => t.id === 'caffeniate')).toBe(false);
  });

  it("'json' does NOT match bandwidth-calculator", () => {
    const results = filterTools(TOOLS, 'json');
    expect(results.some((t) => t.id === 'bandwidth-calculator')).toBe(false);
  });

  it("'json' does NOT match markdown-preview", () => {
    const results = filterTools(TOOLS, 'json');
    expect(results.some((t) => t.id === 'markdown-preview')).toBe(false);
  });

  it("'regex' matches regex-visualizer", () => {
    const results = filterTools(TOOLS, 'regex');
    expect(results.some((t) => t.id === 'regex-visualizer')).toBe(true);
  });

  it("nonsense query 'xyzzy12345' returns empty array", () => {
    const results = filterTools(TOOLS, 'xyzzy12345');
    expect(results.length).toBe(0);
  });

  it("special chars query '.*' does not crash", () => {
    expect(() => filterTools(TOOLS, '.*')).not.toThrow();
    const results = filterTools(TOOLS, '.*');
    expect(Array.isArray(results)).toBe(true);
  });

  it("case-insensitive: 'JSON' returns same results as 'json'", () => {
    const lower = filterTools(TOOLS, 'json');
    const upper = filterTools(TOOLS, 'JSON');
    expect(upper.length).toBe(lower.length);
    expect(upper.some((t) => t.id === 'json-formatter')).toBe(true);
  });
});
