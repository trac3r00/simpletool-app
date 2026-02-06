#!/usr/bin/env node
/**
 * i18n Apply Script
 * 
 * Reads the extracted manifest and modifies route files to add i18n support.
 * 
 * Strategy:
 * - HTML static text: Add data-i18n="key" to elements
 * - Placeholders: Add data-i18n-placeholder="key"  
 * - Title attributes: Add data-i18n-title="key"
 * - JS dynamic strings: Replace string literals with _t('key', 'fallback')
 * 
 * Usage:
 *   node scripts/i18n-apply.js                        # Dry run (show changes)
 *   node scripts/i18n-apply.js --write                 # Apply changes
 *   node scripts/i18n-apply.js --tool json-formatter   # Single tool
 *   node scripts/i18n-apply.js --gen-translations      # Generate i18n.js entries
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROUTES_DIR = path.join(__dirname, '..', 'src', 'routes');
const MANIFEST_PATH = path.join(__dirname, 'i18n-manifest.json');

const args = process.argv.slice(2);
const dryRun = !args.includes('--write');
const singleTool = args.includes('--tool') ? args[args.indexOf('--tool') + 1] : null;
const genTranslations = args.includes('--gen-translations');

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

function toolIdToFile(toolId) {
  if (toolId === 'css-gradient') return 'css-gradient-generator.js';
  return toolId + '.js';
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyHTMLi18n(content, toolId, strings) {
  let modified = content;
  let changeCount = 0;

  for (const [key, info] of Object.entries(strings)) {
    if (info.type === 'js') continue;
    const en = info.en;

    if (info.type === 'placeholder') {
      const escaped = escapeRegex(en);
      const re = new RegExp(`placeholder=["']${escaped}["'](?!\\s*data-i18n)`, 'g');
      const replacement = `placeholder="${en}" data-i18n-placeholder="${key}"`;
      const before = modified;
      modified = modified.replace(re, replacement);
      if (modified !== before) changeCount++;
    } else if (info.type === 'title') {
      const escaped = escapeRegex(en);
      const re = new RegExp(`title=["']${escaped}["'](?!\\s*data-i18n)`, 'g');
      const replacement = `title="${en}" data-i18n-title="${key}"`;
      const before = modified;
      modified = modified.replace(re, replacement);
      if (modified !== before) changeCount++;
    } else if (info.type === 'button') {
      const escaped = escapeRegex(en);
      // Button with just text: >TEXT</button>
      const re = new RegExp(`(<button[^>]*)>(\\s*)${escaped}(\\s*)</button>`, 'g');
      const before = modified;
      modified = modified.replace(re, (match, attrs, ws1, ws2) => {
        if (attrs.includes('data-i18n')) return match;
        return `${attrs}>${ws1}<span data-i18n="${key}">${en}</span>${ws2}</button>`;
      });
      if (modified !== before) changeCount++;
    } else if (info.type === 'label') {
      const escaped = escapeRegex(en);
      // Simple label: <label class="label">TEXT</label>
      const re = new RegExp(`(<label[^>]*)>(\\s*)${escaped}(\\s*)</label>`, 'g');
      const before = modified;
      modified = modified.replace(re, (match, attrs, ws1, ws2) => {
        if (attrs.includes('data-i18n')) return match;
        return `${attrs}>${ws1}<span data-i18n="${key}">${en}</span>${ws2}</label>`;
      });
      if (modified !== before) changeCount++;
    } else if (info.type === 'stat') {
      const escaped = escapeRegex(en);
      const re = new RegExp(`(uppercase tracking-wide[^"]*"[^>]*)>(\\s*)${escaped}(\\s*)<`, 'g');
      const before = modified;
      modified = modified.replace(re, (match, attrs, ws1, ws2) => {
        if (attrs.includes('data-i18n')) return match;
        return `${attrs} data-i18n="${key}">${ws1}${en}${ws2}<`;
      });
      if (modified !== before) changeCount++;
    } else if (info.type === 'th') {
      const escaped = escapeRegex(en);
      const re = new RegExp(`(<th[^>]*)>(\\s*)${escaped}(\\s*)</th>`, 'g');
      const before = modified;
      modified = modified.replace(re, (match, attrs, ws1, ws2) => {
        if (attrs.includes('data-i18n')) return match;
        return `${attrs} data-i18n="${key}">${ws1}${en}${ws2}</th>`;
      });
      if (modified !== before) changeCount++;
    } else if (info.type === 'heading') {
      const escaped = escapeRegex(en);
      const re = new RegExp(`(<h[2-4][^>]*)>(\\s*)${escaped}(\\s*)</h([2-4])>`, 'g');
      const before = modified;
      modified = modified.replace(re, (match, attrs, ws1, ws2, lvl) => {
        if (attrs.includes('data-i18n')) return match;
        return `${attrs} data-i18n="${key}">${ws1}${en}${ws2}</h${lvl}>`;
      });
      if (modified !== before) changeCount++;
    } else if (info.type === 'option') {
      const escaped = escapeRegex(en);
      const re = new RegExp(`(<option[^>]*)>(\\s*)${escaped}(\\s*)</option>`, 'g');
      const before = modified;
      modified = modified.replace(re, (match, attrs, ws1, ws2) => {
        if (attrs.includes('data-i18n')) return match;
        return `${attrs} data-i18n="${key}">${ws1}${en}${ws2}</option>`;
      });
      if (modified !== before) changeCount++;
    } else if (info.type === 'desc') {
      const escaped = escapeRegex(en);
      const re = new RegExp(`(<(?:p|span)[^>]*class="[^"]*text-(?:sm|xs|surface)[^"]*"[^>]*)>(\\s*)${escaped}(\\s*)</(p|span)>`, 'g');
      const before = modified;
      modified = modified.replace(re, (match, attrs, ws1, ws2, tag) => {
        if (attrs.includes('data-i18n')) return match;
        return `${attrs} data-i18n="${key}">${ws1}${en}${ws2}</${tag}>`;
      });
      if (modified !== before) changeCount++;
    }
  }

  return { content: modified, changeCount };
}

function applyJSi18n(content, toolId, strings) {
  let modified = content;
  let changeCount = 0;

  for (const [key, info] of Object.entries(strings)) {
    if (info.type !== 'js') continue;
    const en = info.en;
    const escaped = escapeRegex(en);

    // Pattern: showStatus('TEXT' -> showStatus(_t('key', 'TEXT')
    const statusRe = new RegExp(`showStatus\\(\\s*'${escaped}'`, 'g');
    let before = modified;
    modified = modified.replace(statusRe, `showStatus(_t('${key}', '${en}')`);
    if (modified !== before) { changeCount++; continue; }

    const statusReD = new RegExp(`showStatus\\(\\s*"${escaped}"`, 'g');
    before = modified;
    modified = modified.replace(statusReD, `showStatus(_t('${key}', "${en}")` );
    if (modified !== before) { changeCount++; continue; }

    // Pattern: .textContent = 'TEXT' -> .textContent = _t('key', 'TEXT')
    const tcRe = new RegExp(`\\.textContent\\s*=\\s*'${escaped}'`, 'g');
    before = modified;
    modified = modified.replace(tcRe, `.textContent = _t('${key}', '${en}')`);
    if (modified !== before) { changeCount++; continue; }

    const tcReD = new RegExp(`\\.textContent\\s*=\\s*"${escaped}"`, 'g');
    before = modified;
    modified = modified.replace(tcReD, `.textContent = _t('${key}', "${en}")`);
    if (modified !== before) { changeCount++; continue; }

    // Pattern: .innerText = 'TEXT'
    const itRe = new RegExp(`\\.innerText\\s*=\\s*'${escaped}'`, 'g');
    before = modified;
    modified = modified.replace(itRe, `.innerText = _t('${key}', '${en}')`);
    if (modified !== before) { changeCount++; continue; }
  }

  return { content: modified, changeCount };
}

function processFile(toolId) {
  const filename = toolIdToFile(toolId);
  const filePath = path.join(ROUTES_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`  SKIP: ${filename} not found`);
    return 0;
  }

  const original = fs.readFileSync(filePath, 'utf-8');
  const strings = manifest[toolId];
  if (!strings) return 0;

  const html = applyHTMLi18n(original, toolId, strings);
  const js = applyJSi18n(html.content, toolId, strings);
  const totalChanges = html.changeCount + js.changeCount;

  if (totalChanges > 0) {
    if (dryRun) {
      console.log(`  ${filename}: ${totalChanges} changes (HTML: ${html.changeCount}, JS: ${js.changeCount}) [DRY RUN]`);
    } else {
      fs.writeFileSync(filePath, js.content);
      console.log(`  ${filename}: ${totalChanges} changes applied (HTML: ${html.changeCount}, JS: ${js.changeCount})`);
    }
  } else {
    console.log(`  ${filename}: no changes`);
  }

  return totalChanges;
}

function generateTranslationEntries() {
  const toolUI = {};
  
  for (const [toolId, strings] of Object.entries(manifest)) {
    const ui = {};
    for (const [key, info] of Object.entries(strings)) {
      const parts = key.split('.');
      const subkey = parts.slice(3).join('.');
      ui[subkey] = info.en;
    }
    toolUI[toolId] = { ui };
  }

  console.log(JSON.stringify(toolUI, null, 2));
}

// Main
if (genTranslations) {
  generateTranslationEntries();
  process.exit(0);
}

console.log(dryRun ? '=== DRY RUN ===' : '=== APPLYING CHANGES ===');

const toolIds = singleTool ? [singleTool] : Object.keys(manifest);
let totalChanges = 0;

for (const toolId of toolIds) {
  totalChanges += processFile(toolId);
}

console.log(`\nTotal: ${totalChanges} changes across ${toolIds.length} tools`);
if (dryRun) console.log('Run with --write to apply changes.');
