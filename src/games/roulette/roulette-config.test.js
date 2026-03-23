import { describe, expect, it } from 'vitest';

import {
  getRouletteBootConfig,
  rouletteBadgeMeta,
  rouletteCatalog,
  rouletteModes,
  roulettePresets,
  rouletteSectionMeta,
  rouletteThemes
} from './config.js';
import { buildRouletteToolBadges, getRouletteMountMeta, getRouletteSectionOrder } from './render.js';
import { createRouletteSessionState, normalizeRouletteMode } from './runtime.js';
import { readStoredRoulettePresets, writeStoredRoulettePresets } from './storage.js';

describe('roulette module boundary', () => {
  it('exports a config contract with catalog, themes, presets, and modes', () => {
    expect(rouletteCatalog.id).toBe('roulette-wheel');
    expect(rouletteCatalog.storageKey).toBeTruthy();
    expect(Object.keys(rouletteThemes).length).toBeGreaterThan(0);
    expect(Object.keys(roulettePresets).length).toBeGreaterThan(0);
    expect(Object.keys(rouletteModes)).toEqual(expect.arrayContaining(['equal', 'weighted']));
    expect(Object.keys(rouletteSectionMeta)).toEqual(expect.arrayContaining(['segments', 'mode', 'stats', 'presets']));
    expect(rouletteBadgeMeta.every((badge) => badge.textKey.startsWith('tools.roulette-wheel.ui.'))).toBe(true);
  });

  it('builds a serializable boot config for the route', () => {
    const bootConfig = getRouletteBootConfig();
    expect(bootConfig.defaultSelectionMode).toBe('equal');
    expect(bootConfig.colorPalette.length).toBeGreaterThanOrEqual(4);
    expect(getRouletteSectionOrder(bootConfig)).toContain('mode');
    expect(bootConfig.sections.find((section) => section.id === 'segments')?.defaultOpen).toBe(true);
    expect(bootConfig.presets.every((preset) => preset.labelKey.startsWith('tools.roulette-wheel.ui.'))).toBe(true);
    expect(bootConfig.presets.every((preset) => typeof preset.defaultMode === 'string')).toBe(true);
    expect(bootConfig.modes.every((mode) => mode.labelKey.startsWith('tools.roulette-wheel.ui.'))).toBe(true);
  });

  it('creates an initial runtime state from boot config', () => {
    const state = createRouletteSessionState(getRouletteBootConfig());
    expect(state.selectionMode).toBe('equal');
    expect(state.stats.total).toBe(0);
    expect(normalizeRouletteMode('weighted')).toBe('weighted');
    expect(normalizeRouletteMode('anything-else')).toBe('equal');
  });

  it('provides mount metadata and storage helpers', () => {
    const storage = new Map();
    const fakeStorage = {
      getItem(key) {
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        storage.set(key, value);
      }
    };

    expect(getRouletteMountMeta().stageId).toBe('wheel-stage');
    expect(buildRouletteToolBadges('en', (key) => key)).toHaveLength(2);
    expect(writeStoredRoulettePresets(fakeStorage, rouletteCatalog.storageKey, [{ name: 'alpha', segments: [] }])).toBe(true);
    expect(readStoredRoulettePresets(fakeStorage, rouletteCatalog.storageKey)).toHaveLength(1);
  });
});
