import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  trackToolVisit,
  getRecentTools,
  clearRecentTools,
  toggleFavorite,
  isFavorite,
  getFavorites,
  clearFavorites,
  exportPreferences,
  importPreferences
} from './personalization.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _store: () => store,
    _reset: () => { store = {}; }
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock._reset();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
});

describe('Recent Tools', () => {
  it('returns empty array initially', () => {
    expect(getRecentTools()).toEqual([]);
  });

  it('tracks a tool visit', () => {
    trackToolVisit('json-formatter');
    expect(getRecentTools()).toEqual(['json-formatter']);
  });

  it('deduplicates and puts most recent first', () => {
    trackToolVisit('json-formatter');
    trackToolVisit('uuid-generator');
    trackToolVisit('json-formatter');
    expect(getRecentTools()[0]).toBe('json-formatter');
  });

  it('limits to 10 items', () => {
    for (let i = 0; i < 15; i++) {
      trackToolVisit(`tool-${i}`);
    }
    expect(getRecentTools()).toHaveLength(10);
  });

  it('ignores empty/null toolId', () => {
    trackToolVisit('');
    trackToolVisit(null);
    trackToolVisit(undefined);
    expect(getRecentTools()).toEqual([]);
  });

  it('clears recent tools', () => {
    trackToolVisit('json-formatter');
    clearRecentTools();
    expect(getRecentTools()).toEqual([]);
  });
});

describe('Favorites', () => {
  it('returns empty array initially', () => {
    expect(getFavorites()).toEqual([]);
  });

  it('toggles favorite on', () => {
    const result = toggleFavorite('json-formatter');
    expect(result).toBe(true);
    expect(isFavorite('json-formatter')).toBe(true);
  });

  it('toggles favorite off', () => {
    toggleFavorite('json-formatter'); // on
    const result = toggleFavorite('json-formatter'); // off
    expect(result).toBe(false);
    expect(isFavorite('json-formatter')).toBe(false);
  });

  it('manages multiple favorites', () => {
    toggleFavorite('tool-a');
    toggleFavorite('tool-b');
    toggleFavorite('tool-c');
    expect(getFavorites()).toEqual(['tool-a', 'tool-b', 'tool-c']);
  });

  it('returns false for unfavorited tool', () => {
    expect(isFavorite('nonexistent')).toBe(false);
  });

  it('returns false for null/empty', () => {
    expect(isFavorite('')).toBe(false);
    expect(isFavorite(null)).toBe(false);
    expect(toggleFavorite('')).toBe(false);
  });

  it('clears all favorites', () => {
    toggleFavorite('tool-a');
    toggleFavorite('tool-b');
    clearFavorites();
    expect(getFavorites()).toEqual([]);
  });
});

describe('Export / Import Preferences', () => {
  it('exports preferences as JSON', () => {
    trackToolVisit('json-formatter');
    toggleFavorite('uuid-generator');
    const exported = exportPreferences();
    const parsed = JSON.parse(exported);
    expect(parsed).toHaveProperty('recent');
    expect(parsed).toHaveProperty('favorites');
    expect(parsed.recent).toContain('json-formatter');
    expect(parsed.favorites).toContain('uuid-generator');
  });

  it('imports valid preferences', () => {
    const data = JSON.stringify({
      recent: ['tool-a', 'tool-b'],
      favorites: ['tool-c']
    });
    const result = importPreferences(data);
    expect(result).toBe(true);
    expect(getRecentTools()).toEqual(['tool-a', 'tool-b']);
    expect(getFavorites()).toEqual(['tool-c']);
  });

  it('returns false for invalid JSON', () => {
    expect(importPreferences('not json')).toBe(false);
  });

  it('returns false for null data', () => {
    expect(importPreferences('null')).toBe(false);
  });

  it('truncates recent to max 10', () => {
    const tooMany = Array.from({ length: 20 }, (_, i) => `tool-${i}`);
    importPreferences(JSON.stringify({ recent: tooMany, favorites: [] }));
    expect(getRecentTools()).toHaveLength(10);
  });
});
