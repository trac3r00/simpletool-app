import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { builtinModules } from 'module';
import { TOOLS, getToolsForEnvironment } from '../src/utils/tool-registry.js';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = resolve(__filename, '../..');

function getPackageName(specifier) {
  if (specifier.startsWith('@')) {
    return specifier.split('/').slice(0, 2).join('/');
  }
  return specifier.split('/')[0];
}

describe('lighthouse-audit direct dependency declaration', () => {
  it('every non-relative, non-builtin direct import must be declared as a direct package dependency or devDependency', () => {
    const scriptPath = join(PROJECT_ROOT, 'scripts', 'lighthouse-audit.js');
    const scriptSource = readFileSync(scriptPath, 'utf8');
    const pkg = JSON.parse(readFileSync(join(PROJECT_ROOT, 'package.json'), 'utf8'));

    const allDeps = new Set([
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ]);

    const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
    const matches = [...scriptSource.matchAll(importRegex)];

    const externalImports = [];
    for (const match of matches) {
      const specifier = match[1];
      if (specifier.startsWith('.')) continue; // relative
      if (specifier.startsWith('node:')) continue; // node: prefixed builtin
      const baseName = getPackageName(specifier);
      if (builtinModules.includes(baseName)) continue; // builtin
      externalImports.push(baseName);
    }

    const uniqueExternalImports = [...new Set(externalImports)];
    expect(uniqueExternalImports.length).toBeGreaterThan(0);

    for (const imp of uniqueExternalImports) {
      expect(allDeps).toContain(imp);
    }
  });
});

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
