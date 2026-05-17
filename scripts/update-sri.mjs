#!/usr/bin/env node
/**
 * Replace every <script src="/vendor/X.min.js" integrity="sha384-...">
 * occurrence in src/routes/*.js with the SRI digest of the actual bytes
 * in dist/vendor/X.min.js.
 *
 * Run after `npm run build:vendor` whenever a third-party bundle changes.
 * Verified by src/utils/vendor-sri.test.js.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeSriSha384 } from '../src/utils/vendor-sri.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ROUTES_DIR = join(ROOT, 'src', 'routes');
const VENDOR_DIR = join(ROOT, 'dist', 'vendor');

// Two-step matching so attribute order does not matter.
// Step 1: find any <script> tag whose src points into /vendor/.
// Step 2: within that tag, locate and rewrite the integrity value.
const VENDOR_SCRIPT_RE = /<script\s+[^>]*src=["']\/vendor\/([^"']+)["'][^>]*>/g;
const INTEGRITY_RE = /(integrity=["'])([^"']+)(["'])/;

let changedFiles = 0;
let changedTags = 0;
const skipped = [];

for (const file of readdirSync(ROUTES_DIR)) {
  if (!file.endsWith('.js') || file.endsWith('.test.js')) continue;
  const fullPath = join(ROUTES_DIR, file);
  const original = readFileSync(fullPath, 'utf8');

  const updated = original.replace(
    VENDOR_SCRIPT_RE,
    (fullTag, vendorFile) => {
      const vendorPath = join(VENDOR_DIR, vendorFile);
      if (!existsSync(vendorPath)) {
        skipped.push(`${file}: /vendor/${vendorFile} not found`);
        return fullTag;
      }
      if (!INTEGRITY_RE.test(fullTag)) return fullTag; // no integrity attr to update
      const fresh = computeSriSha384(vendorPath);
      if (fullTag.includes(fresh)) return fullTag;
      changedTags += 1;
      return fullTag.replace(INTEGRITY_RE, `$1${fresh}$3`);
    }
  );

  if (updated !== original) {
    writeFileSync(fullPath, updated);
    changedFiles += 1;
    console.log(`updated ${file}`);
  }
}

console.log(`\nFiles changed: ${changedFiles}`);
console.log(`<script> tags rewritten: ${changedTags}`);
if (skipped.length) {
  console.log(`\nSkipped:`);
  for (const s of skipped) console.log(`  ${s}`);
}
