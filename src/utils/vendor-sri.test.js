import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeSriSha384 } from './vendor-sri.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ROUTES_DIR = join(ROOT, 'src', 'routes');
const VENDOR_DIR = join(ROOT, 'dist', 'vendor');

// Two-step matching so attribute order does not matter.
const VENDOR_SCRIPT_RE = /<script\s+[^>]*src=["']\/vendor\/([^"']+)["'][^>]*>/g;
const INTEGRITY_RE = /integrity=["']([^"']+)["']/;

function collectScriptTags() {
  const occurrences = [];
  const files = readdirSync(ROUTES_DIR).filter((f) => f.endsWith('.js') && !f.endsWith('.test.js'));
  for (const file of files) {
    const fullPath = join(ROUTES_DIR, file);
    const src = readFileSync(fullPath, 'utf8');
    let match;
    while ((match = VENDOR_SCRIPT_RE.exec(src)) !== null) {
      const fullTag = match[0];
      const vendorFile = match[1];
      const integrityMatch = fullTag.match(INTEGRITY_RE);
      if (integrityMatch) {
        occurrences.push({ file, vendorFile, integrity: integrityMatch[1] });
      }
    }
  }
  return occurrences;
}

describe('vendor SRI integrity attributes', () => {
  it('every <script src="/vendor/...">  has a matching SHA-384 for the actual file', () => {
    const tags = collectScriptTags();
    expect(tags.length).toBeGreaterThan(0);

    const mismatches = [];
    for (const { file, vendorFile, integrity } of tags) {
      const vendorPath = join(VENDOR_DIR, vendorFile);
      if (!existsSync(vendorPath)) {
        mismatches.push(`${file}: /vendor/${vendorFile} does not exist on disk`);
        continue;
      }
      const expected = computeSriSha384(vendorPath);
      if (expected !== integrity) {
        mismatches.push(
          `${file}: /vendor/${vendorFile} integrity="${integrity}" — expected "${expected}"`
        );
      }
    }

    expect(mismatches).toEqual([]);
  });
});
