import { describe, it, expect } from 'vitest';
import { TOOLS, getToolsForEnvironment } from '../src/utils/tool-registry.js';

describe('lighthouse-audit page list derivation', () => {
  it('getAuditPages() should exist and return an array', async () => {
    const { getAuditPages } = await import('./lighthouse-audit.js');
    expect(getAuditPages).toBeDefined();
    expect(typeof getAuditPages).toBe('function');
    const pages = getAuditPages();
    expect(Array.isArray(pages)).toBe(true);
    expect(pages.length).toBeGreaterThan(0);
  });

  it('getAuditPages(false) should include every public tool from the registry', async () => {
    const { getAuditPages } = await import('./lighthouse-audit.js');
    const pages = getAuditPages(false);
    const pagePaths = pages.map(p => p.path);
    const publicTools = getToolsForEnvironment(false);

    for (const tool of publicTools) {
      expect(pagePaths).toContain(tool.path);
    }
  });

  it('getAuditPages(false) should include static and meta pages', async () => {
    const { getAuditPages } = await import('./lighthouse-audit.js');
    const pages = getAuditPages(false);
    const pagePaths = pages.map(p => p.path);

    const expectedStatic = ['/', '/terms', '/privacy', '/about', '/contact', '/security', '/careers'];
    const expectedMeta = ['/ads.txt', '/robots.txt', '/sitemap.xml'];

    for (const path of [...expectedStatic, ...expectedMeta]) {
      expect(pagePaths).toContain(path);
    }
  });

  it('getAuditPages(false) should NOT include hiddenInProduction tools', async () => {
    const { getAuditPages } = await import('./lighthouse-audit.js');
    const pages = getAuditPages(false);
    const pagePaths = pages.map(p => p.path);
    const hiddenTools = TOOLS.filter(t => t.hiddenInProduction);

    for (const tool of hiddenTools) {
      expect(pagePaths).not.toContain(tool.path);
    }
  });

  it('getAuditPages(true) should include hiddenInProduction tools', async () => {
    const { getAuditPages } = await import('./lighthouse-audit.js');
    const pages = getAuditPages(true);
    const pagePaths = pages.map(p => p.path);
    const hiddenTools = TOOLS.filter(t => t.hiddenInProduction);

    for (const tool of hiddenTools) {
      expect(pagePaths).toContain(tool.path);
    }
  });
});
