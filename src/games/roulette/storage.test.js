import { describe, it, expect } from 'vitest';
import {
  readStoredRoulettePresets,
  writeStoredRoulettePresets
} from './storage.js';

function createMockStorage(data = {}) {
  const store = { ...data };
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    _store: () => store
  };
}

describe('readStoredRoulettePresets', () => {
  it('returns empty array when storage is empty', () => {
    const storage = createMockStorage();
    expect(readStoredRoulettePresets(storage, 'presets')).toEqual([]);
  });

  it('returns empty array when key does not exist', () => {
    const storage = createMockStorage();
    expect(readStoredRoulettePresets(storage, 'nonexistent')).toEqual([]);
  });

  it('reads a plain array', () => {
    const presets = [{ name: 'Colors', items: ['Red', 'Blue'] }];
    const storage = createMockStorage({ presets: JSON.stringify(presets) });
    expect(readStoredRoulettePresets(storage, 'presets')).toEqual(presets);
  });

  it('reads from wrapper object with .presets', () => {
    const presets = [{ name: 'Test', items: ['A', 'B'] }];
    const storage = createMockStorage({
      presets: JSON.stringify({ version: 1, presets })
    });
    expect(readStoredRoulettePresets(storage, 'presets')).toEqual(presets);
  });

  it('returns empty array for invalid JSON', () => {
    const storage = createMockStorage({ presets: 'not-json' });
    expect(readStoredRoulettePresets(storage, 'presets')).toEqual([]);
  });

  it('returns empty array for non-array data', () => {
    const storage = createMockStorage({ presets: JSON.stringify('string') });
    expect(readStoredRoulettePresets(storage, 'presets')).toEqual([]);
  });

  it('handles null storage gracefully', () => {
    expect(readStoredRoulettePresets(null, 'key')).toEqual([]);
  });

  it('handles storage without getItem', () => {
    expect(readStoredRoulettePresets({}, 'key')).toEqual([]);
  });
});

describe('writeStoredRoulettePresets', () => {
  it('writes presets with version wrapper', () => {
    const storage = createMockStorage();
    const presets = [{ name: 'Test', items: ['A'] }];
    const result = writeStoredRoulettePresets(storage, 'presets', presets);
    expect(result).toBe(true);
    const stored = JSON.parse(storage._store().presets);
    expect(stored.version).toBe(1);
    expect(stored.presets).toEqual(presets);
  });

  it('overwrites existing data', () => {
    const storage = createMockStorage({ presets: JSON.stringify({ version: 1, presets: [{ old: true }] }) });
    const newPresets = [{ name: 'New', items: ['X'] }];
    writeStoredRoulettePresets(storage, 'presets', newPresets);
    const stored = JSON.parse(storage._store().presets);
    expect(stored.presets).toEqual(newPresets);
  });

  it('returns false on storage failure', () => {
    const storage = {
      setItem: () => { throw new Error('QuotaExceeded'); }
    };
    const result = writeStoredRoulettePresets(storage, 'key', []);
    expect(result).toBe(false);
  });

  it('handles null storage gracefully (no-op via optional chaining)', () => {
    // null?.setItem?.() silently does nothing — returns true
    const result = writeStoredRoulettePresets(null, 'key', []);
    expect(result).toBe(true);
  });
});
