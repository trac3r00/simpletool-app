#!/usr/bin/env node
/**
 * i18n String Extraction Script
 * 
 * Scans route files and extracts translatable strings from:
 * 1. HTML elements: button text, labels, placeholders, titles, option text, stat labels, headings
 * 2. JS dynamic strings: status messages, error messages, UI feedback
 * 
 * Usage:
 *   node scripts/i18n-extract.js                    # Extract all, output to stdout
 *   node scripts/i18n-extract.js --out manifest.json # Write to file
 *   node scripts/i18n-extract.js --tool json-formatter # Single tool
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROUTES_DIR = path.join(__dirname, '..', 'src', 'routes');

// Tool ID from filename (e.g., json-formatter.js -> json-formatter)
function toolIdFromFile(filename) {
  return filename.replace('.js', '')
    .replace('css-gradient-generator', 'css-gradient');
}

// Patterns to SKIP (not translatable)
const SKIP_PATTERNS = [
  /^[0-9.,]+$/,           // Pure numbers
  /^[^a-zA-Z]*$/,         // No letters (emojis, symbols only)
  /^\s*$/,                 // Whitespace
  /^#/,                    // CSS selectors, markdown
  /^\$/,                   // Variable references
  /^https?:\/\//,          // URLs
  /^[a-z][a-zA-Z]*\(/,    // Function calls
  /^[{}\[\]()]/,           // Code brackets
  /^\w+\.\w+/,             // File names, dot notation
  /^--/,                   // CSS variables
  /^data-/,                // Data attributes
  /^[A-Z_]{2,}$/,          // Constants (ALL_CAPS)
];

function shouldSkip(text) {
  const trimmed = text.trim();
  if (trimmed.length < 2) return true;
  if (trimmed.length > 200) return true;
  return SKIP_PATTERNS.some(p => p.test(trimmed));
}

// Extract strings from HTML portion of template literal
function extractHTMLStrings(html, toolId) {
  const strings = {};
  let keyIndex = 0;
  
  function addString(en, type, context) {
    if (shouldSkip(en)) return;
    const existing = Object.values(strings).find(s => s.en === en);
    if (existing) return;
    
    const key = `tools.${toolId}.ui.${context || type + keyIndex++}`;
    strings[key] = { en, type, context: context || '' };
  }

  // 1. Button text: >TEXT</button>
  const btnRe = /<button[^>]*>([^<]+)<\/button>/gi;
  for (const m of html.matchAll(btnRe)) {
    const text = m[1].trim();
    if (text.includes('${')) continue;
    if (text) addString(text, 'button');
  }
  
  // 2. Button text with nested elements: <button...><svg...>TEXT</button>
  const btnComplexRe = /<button[^>]*>(?:<[^>]+>)*([^<]+)<\/button>/gi;
  for (const m of html.matchAll(btnComplexRe)) {
    const text = m[1].trim();
    if (text && !text.includes('${')) addString(text, 'button');
  }

  // 3. Labels: <label...>TEXT</label>
  const labelRe = /<label[^>]*>([^<]+)<\/label>/gi;
  for (const m of html.matchAll(labelRe)) {
    const text = m[1].trim();
    if (text && !text.includes('${')) addString(text, 'label');
  }
  
  // 4. Label with class="label": <label class="label">TEXT</label> or nested
  const labelClassRe = /<label[^>]*class="[^"]*label[^"]*"[^>]*>([\s\S]*?)<\/label>/gi;
  for (const m of html.matchAll(labelClassRe)) {
    // Get text content, strip child elements
    let text = m[1].replace(/<[^>]+>/g, '').trim();
    // Handle "Password Length: <span...>16</span>" -> "Password Length:"
    text = text.replace(/:\s*$/, ':').trim();
    if (text && !text.includes('${')) addString(text, 'label');
  }

  // 5. Placeholders: placeholder="TEXT" or placeholder='TEXT'
  const phRe = /placeholder=["']([^"']+)["']/gi;
  for (const m of html.matchAll(phRe)) {
    const text = m[1].trim();
    if (text && !text.includes('${')) addString(text, 'placeholder');
  }

  // 6. Title attributes: title="TEXT"
  const titleRe = /title=["']([^"']+)["']/gi;
  for (const m of html.matchAll(titleRe)) {
    const text = m[1].trim();
    if (text && !text.includes('${') && text !== 'Change language') {
      addString(text, 'title');
    }
  }

  // 7. <option> text: <option...>TEXT</option>
  const optRe = /<option[^>]*>([^<]+)<\/option>/gi;
  for (const m of html.matchAll(optRe)) {
    const text = m[1].trim();
    if (text && !text.includes('${')) addString(text, 'option');
  }

  // 8. Stat labels: uppercase tracking-wide text
  const statRe = /uppercase tracking-wide[^"]*"[^>]*>([^<]+)</gi;
  for (const m of html.matchAll(statRe)) {
    const text = m[1].trim();
    if (text && !text.includes('${')) addString(text, 'stat');
  }

  // 9. <th> text
  const thRe = /<th[^>]*>([^<]+)<\/th>/gi;
  for (const m of html.matchAll(thRe)) {
    const text = m[1].trim();
    if (text && !text.includes('${')) addString(text, 'th');
  }

  // 10. Heading text (h2, h3, h4) - but not h1 (already handled by toolHeader)
  const headRe = /<h[2-4][^>]*>([^<]+)<\/h[2-4]>/gi;
  for (const m of html.matchAll(headRe)) {
    const text = m[1].trim();
    if (text && !text.includes('${')) addString(text, 'heading');
  }

  // 11. Paragraph/span with class containing descriptive text
  const descRe = /<(?:p|span)[^>]*class="[^"]*text-(?:sm|xs|surface)[^"]*"[^>]*>([^<]{3,})<\/(?:p|span)>/gi;
  for (const m of html.matchAll(descRe)) {
    const text = m[1].trim();
    if (text && !text.includes('${') && text.length > 5) addString(text, 'desc');
  }
  
  // 12. Checkbox/radio label spans
  const checkLabelRe = /<span[^>]*class="[^"]*text-sm font-medium[^"]*"[^>]*>([^<]+)<\/span>/gi;
  for (const m of html.matchAll(checkLabelRe)) {
    const text = m[1].trim();
    if (text && !text.includes('${')) addString(text, 'label');
  }

  // 13. Badge/tag text: text in tool header badges
  const badgeRe = /\{\s*text:\s*'([^']+)'/g;
  for (const m of html.matchAll(badgeRe)) {
    const text = m[1].trim();
    if (text && text !== 'Client-Side Only' && text !== 'Privacy First') {
      addString(text, 'badge');
    }
  }
  // Also catch common badges
  addString('Client-Side Only', 'badge');
  addString('Privacy First', 'badge');

  return strings;
}

// Extract dynamic JS strings from <script> blocks
function extractJSStrings(scriptContent, toolId) {
  const strings = {};
  let keyIndex = 0;

  function addString(en, type) {
    if (shouldSkip(en)) return;
    const existing = Object.values(strings).find(s => s.en === en);
    if (existing) return;
    const key = `tools.${toolId}.js.${type}${keyIndex++}`;
    strings[key] = { en, type: 'js' };
  }

  // Common patterns for user-facing strings in JS:
  
  // 1. showStatus('TEXT', ...) or showStatus("TEXT", ...)
  const statusRe = /showStatus\(\s*['"]([^'"]+)['"]/g;
  for (const m of scriptContent.matchAll(statusRe)) {
    addString(m[1], 'status');
  }

  // 2. textContent = 'TEXT' or .textContent = "TEXT"
  const tcRe = /\.textContent\s*=\s*['"`]([^'"`\n$]+)['"`]/g;
  for (const m of scriptContent.matchAll(tcRe)) {
    const text = m[1].trim();
    if (text.length > 1) addString(text, 'text');
  }

  // 3. innerText = 'TEXT'
  const itRe = /\.innerText\s*=\s*['"`]([^'"`\n$]+)['"`]/g;
  for (const m of scriptContent.matchAll(itRe)) {
    addString(m[1].trim(), 'text');
  }

  // 4. innerHTML assignments with simple text (no HTML tags)
  const ihRe = /\.innerHTML\s*=\s*['"]([^<'"]{3,})['"];/g;
  for (const m of scriptContent.matchAll(ihRe)) {
    addString(m[1].trim(), 'text');
  }

  // 5. alert('TEXT') - shouldn't exist per project rules but catch anyway
  const alertRe = /alert\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const m of scriptContent.matchAll(alertRe)) {
    addString(m[1].trim(), 'alert');
  }

  // 6. confirm('TEXT')
  const confirmRe = /confirm\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const m of scriptContent.matchAll(confirmRe)) {
    addString(m[1].trim(), 'confirm');
  }

  // 7. Template literal strings used in innerHTML with text fragments
  // e.g., `<span>Some text</span>` — extract "Some text"
  const tplHtmlRe = /`[^`]*<(?:span|p|div|td|th|label|h[1-6]|li|option|strong|em)[^>]*>([^<$]{3,})<\//g;
  for (const m of scriptContent.matchAll(tplHtmlRe)) {
    const text = m[1].trim();
    if (text && !text.includes('${') && text.length > 2) {
      addString(text, 'tpl');
    }
  }

  return strings;
}

function processRouteFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const filename = path.basename(filePath);
  const toolId = toolIdFromFile(filename);

  // Split into HTML template and script sections
  // HTML is in template literals (const content = `...`)
  // Scripts are in <script> blocks within those literals
  
  const htmlStrings = extractHTMLStrings(content, toolId);
  const jsStrings = extractJSStrings(content, toolId);

  return {
    toolId,
    file: filename,
    strings: { ...htmlStrings, ...jsStrings }
  };
}

// Main
const args = process.argv.slice(2);
const outFile = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
const singleTool = args.includes('--tool') ? args[args.indexOf('--tool') + 1] : null;

const routeFiles = fs.readdirSync(ROUTES_DIR)
  .filter(f => f.endsWith('.js') && !f.endsWith('.test.js'))
  .filter(f => !singleTool || toolIdFromFile(f) === singleTool);

const manifest = {};
let totalStrings = 0;

for (const file of routeFiles) {
  const result = processRouteFile(path.join(ROUTES_DIR, file));
  const count = Object.keys(result.strings).length;
  if (count > 0) {
    manifest[result.toolId] = result.strings;
    totalStrings += count;
  }
}

const output = JSON.stringify(manifest, null, 2);

if (outFile) {
  fs.writeFileSync(outFile, output);
  console.log(`Extracted ${totalStrings} strings from ${Object.keys(manifest).length} tools → ${outFile}`);
} else {
  console.log(output);
}

// Summary
console.error(`\n--- Extraction Summary ---`);
for (const [toolId, strings] of Object.entries(manifest)) {
  console.error(`  ${toolId}: ${Object.keys(strings).length} strings`);
}
console.error(`  TOTAL: ${totalStrings} strings from ${Object.keys(manifest).length} tools`);
