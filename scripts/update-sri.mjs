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

const SCRIPT_TAG_RE =
  /(<script\s+src=["']\/vendor\/([^"']+)["']\s+integrity=["'])([^"']+)(["'])/g;

let changedFiles = 0;
let changedTags = 0;
const skipped = [];

for (const file of readdirSync(ROUTES_DIR)) {
  if (!file.endsWith('.js') || file.endsWith('.test.js')) continue;
  const fullPath = join(ROUTES_DIR, file);
  const original = readFileSync(fullPath, 'utf8');

  const updated = original.replace(
    SCRIPT_TAG_RE,
    (match, prefix, vendorFile, _oldHash, suffix) => {
      const vendorPath = join(VENDOR_DIR, vendorFile);
      if (!existsSync(vendorPath)) {
        skipped.push(`${file}: /vendor/${vendorFile} not found`);
        return match;
      }
      const fresh = computeSriSha384(vendorPath);
      if (match.includes(fresh)) return match;
      changedTags += 1;
      return `${prefix}${fresh}${suffix}`;
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
