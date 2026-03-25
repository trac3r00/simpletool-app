import { describe, it, expect } from 'vitest';
import { TOOLS, CATEGORIES, getToolsForEnvironment } from './tool-registry.js';

describe('TOOLS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(TOOLS)).toBe(true);
    expect(TOOLS.length).toBeGreaterThan(0);
  });

  it('each tool has required fields', () => {
    for (const tool of TOOLS) {
      expect(tool).toHaveProperty('id');
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('icon');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('path');
      expect(tool).toHaveProperty('category');
      expect(typeof tool.id).toBe('string');
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(typeof tool.path).toBe('string');
      expect(typeof tool.category).toBe('string');
    }
  });

  it('all tool IDs are unique', () => {
    const ids = TOOLS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all tool paths are unique', () => {
    const paths = TOOLS.map((t) => t.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('paths start with /', () => {
    for (const tool of TOOLS) {
      expect(tool.path.startsWith('/')).toBe(true);
    }
  });

  it('categories reference valid CATEGORIES keys', () => {
    const validCategories = Object.keys(CATEGORIES);
    for (const tool of TOOLS) {
      expect(validCategories).toContain(tool.category);
    }
  });

  it('relatedTools reference valid tool IDs', () => {
    const allIds = new Set(TOOLS.map((t) => t.id));
    for (const tool of TOOLS) {
      if (tool.relatedTools) {
        for (const relatedId of tool.relatedTools) {
          expect(allIds.has(relatedId)).toBe(true);
        }
      }
    }
  });
});

describe('CATEGORIES', () => {
  it('has expected category keys', () => {
    expect(CATEGORIES).toHaveProperty('formatters');
    expect(CATEGORIES).toHaveProperty('security');
    expect(CATEGORIES).toHaveProperty('network');
    expect(CATEGORIES).toHaveProperty('generators');
    expect(CATEGORIES).toHaveProperty('game');
    expect(CATEGORIES).toHaveProperty('utils');
  });

  it('each category has title and icon', () => {
    for (const [, cat] of Object.entries(CATEGORIES)) {
      expect(cat).toHaveProperty('title');
      expect(cat).toHaveProperty('icon');
      expect(typeof cat.title).toBe('string');
      expect(typeof cat.icon).toBe('string');
    }
  });
});

describe('getToolsForEnvironment', () => {
  it('returns all tools in dev mode', () => {
    const devTools = getToolsForEnvironment(true);
    expect(devTools).toEqual(TOOLS);
  });

  it('filters hidden tools in production', () => {
    const prodTools = getToolsForEnvironment(false);
    const hiddenTools = TOOLS.filter((t) => t.hiddenInProduction);
    expect(prodTools.length).toBe(TOOLS.length - hiddenTools.length);
  });

  it('production tools do not include hidden tools', () => {
    const prodTools = getToolsForEnvironment(false);
    for (const tool of prodTools) {
      expect(tool.hiddenInProduction).toBeFalsy();
    }
  });

  it('defaults to production when no argument given', () => {
    const defaultTools = getToolsForEnvironment();
    const prodTools = getToolsForEnvironment(false);
    expect(defaultTools.length).toBe(prodTools.length);
  });
});
