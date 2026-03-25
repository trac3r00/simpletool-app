import { describe, it, expect } from 'vitest';
import {
  marbleCatalog,
  marbleThemes,
  marbleWinnerModes,
  getMarbleBootConfig
} from './config.js';

describe('marbleCatalog', () => {
  it('has correct id', () => {
    expect(marbleCatalog.id).toBe('marble-roulette');
  });

  it('has valid participant limits', () => {
    expect(marbleCatalog.minParticipants).toBe(2);
    expect(marbleCatalog.maxParticipants).toBe(10);
    expect(marbleCatalog.minParticipants).toBeLessThan(marbleCatalog.maxParticipants);
  });

  it('has a default theme', () => {
    expect(marbleCatalog.defaultTheme).toBe('classic-drop');
    expect(marbleThemes).toHaveProperty(marbleCatalog.defaultTheme);
  });

  it('has valid default winner mode', () => {
    expect(marbleCatalog.defaultWinnerMode).toBe('first');
    expect(marbleWinnerModes.some((m) => m.id === marbleCatalog.defaultWinnerMode)).toBe(true);
  });
});

describe('marbleThemes', () => {
  const themeIds = ['classic-drop', 'arc-sprint', 'chaos-funnel', 'pinball-madness'];

  it('contains all expected themes', () => {
    for (const id of themeIds) {
      expect(marbleThemes).toHaveProperty(id);
    }
  });

  it('each theme has required structure', () => {
    for (const [key, theme] of Object.entries(marbleThemes)) {
      expect(theme.id).toBe(key);
      expect(theme).toHaveProperty('labelKey');
      expect(theme).toHaveProperty('fallbackLabel');
      expect(theme).toHaveProperty('pegProfile');
      expect(theme).toHaveProperty('board');
    }
  });

  it('pegProfile has all physics parameters', () => {
    const requiredKeys = ['rows', 'targetCols', 'spacingXMin', 'spacingXMax', 'spacingYMin', 'spacingYMax', 'jitterX', 'jitterY'];
    for (const theme of Object.values(marbleThemes)) {
      for (const key of requiredKeys) {
        expect(theme.pegProfile).toHaveProperty(key);
        expect(typeof theme.pegProfile[key]).toBe('number');
      }
    }
  });

  it('board has all physics parameters', () => {
    const requiredKeys = ['gravity', 'restitution', 'wallRestitution', 'linearDamping', 'maxSimSeconds'];
    for (const theme of Object.values(marbleThemes)) {
      for (const key of requiredKeys) {
        expect(theme.board).toHaveProperty(key);
        expect(typeof theme.board[key]).toBe('number');
      }
    }
  });

  it('pinball-madness has isPinball flag', () => {
    expect(marbleThemes['pinball-madness'].isPinball).toBe(true);
  });

  it('physics values are positive', () => {
    for (const theme of Object.values(marbleThemes)) {
      expect(theme.board.gravity).toBeGreaterThan(0);
      expect(theme.board.restitution).toBeGreaterThan(0);
      expect(theme.board.restitution).toBeLessThanOrEqual(1);
      expect(theme.board.maxSimSeconds).toBeGreaterThan(0);
    }
  });
});

describe('marbleWinnerModes', () => {
  it('has 3 modes', () => {
    expect(marbleWinnerModes).toHaveLength(3);
  });

  it('includes first, last, and ordinal', () => {
    const ids = marbleWinnerModes.map((m) => m.id);
    expect(ids).toEqual(['first', 'last', 'ordinal']);
  });

  it('each mode has id, labelKey, and fallbackLabel', () => {
    for (const mode of marbleWinnerModes) {
      expect(typeof mode.id).toBe('string');
      expect(typeof mode.labelKey).toBe('string');
      expect(typeof mode.fallbackLabel).toBe('string');
    }
  });
});

describe('getMarbleBootConfig', () => {
  it('returns config with themes and winnerModes', () => {
    const config = getMarbleBootConfig();
    expect(config).toHaveProperty('id', 'marble-roulette');
    expect(config).toHaveProperty('themes');
    expect(config).toHaveProperty('winnerModes');
    expect(Array.isArray(config.themes)).toBe(true);
    expect(Array.isArray(config.winnerModes)).toBe(true);
  });

  it('themes are deep copies', () => {
    const config = getMarbleBootConfig();
    const originalTheme = marbleThemes['classic-drop'];
    const configTheme = config.themes.find((t) => t.id === 'classic-drop');
    expect(configTheme.pegProfile).not.toBe(originalTheme.pegProfile);
    expect(configTheme.board).not.toBe(originalTheme.board);
    expect(configTheme.pegProfile).toEqual(originalTheme.pegProfile);
  });

  it('winnerModes are copies', () => {
    const config = getMarbleBootConfig();
    expect(config.winnerModes[0]).not.toBe(marbleWinnerModes[0]);
    expect(config.winnerModes[0]).toEqual(marbleWinnerModes[0]);
  });
});
