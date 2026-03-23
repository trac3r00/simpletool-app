#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = path.join(__dirname, 'i18n-manifest.json');
const I18N_DIR = path.join(__dirname, '..', 'src', 'i18n');

const LANG_ORDER = ['en', 'ko', 'ja', 'es', 'zh-CN', 'zh-TW', 'fr', 'de', 'pt', 'vi'];

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

function loadLangMap(langCode) {
  const fp = `/tmp/i18n-${langCode}.json`;
  if (!fs.existsSync(fp)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

function buildToolTranslations(langCode, enToTarget) {
  const result = {};

  for (const [toolId, strings] of Object.entries(manifest)) {
    const ui = {};
    const js = {};

    for (const [fullKey, info] of Object.entries(strings)) {
      const parts = fullKey.split('.');
      const section = parts[2];
      const subKey = parts.slice(3).join('.');

      const en = info.en;
      const translated = langCode === 'en' ? en : (enToTarget[en] || en);

      if (section === 'ui') {
        ui[subKey] = translated;
      } else if (section === 'js') {
        js[subKey] = translated;
      }
    }

    result[toolId] = {};
    if (Object.keys(ui).length > 0) result[toolId].ui = ui;
    if (Object.keys(js).length > 0) result[toolId].js = js;
  }

  return result;
}

// Load translation maps dynamically for all non-English languages
const langMaps = {};
for (const lang of LANG_ORDER) {
  if (lang === 'en') continue;
  langMaps[lang] = loadLangMap(lang);
}

// Build per-language tool translations
const perLang = { en: buildToolTranslations('en', null) };
for (const lang of LANG_ORDER) {
  if (lang === 'en') continue;
  perLang[lang] = buildToolTranslations(lang, langMaps[lang]);
}

let totalUpdated = 0;

for (const lang of LANG_ORDER) {
  const langFile = path.join(I18N_DIR, `${lang}.js`);
  if (!fs.existsSync(langFile)) {
    console.error(`  WARNING: ${langFile} not found, skipping ${lang}`);
    continue;
  }

  const originalSource = fs.readFileSync(langFile, 'utf-8');
  const lines = originalSource.split('\n');
  const toolData = perLang[lang];

  // Find the tools section start
  let toolsLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\s+tools:\s*\{/)) {
      toolsLineIdx = i;
      break;
    }
  }

  if (toolsLineIdx === -1) {
    console.error(`  WARNING: Could not find tools section in ${langFile}`);
    continue;
  }

  // Find the end of the tools block by brace matching
  let depth = 0;
  let toolsEndIdx = toolsLineIdx;
  let foundStart = false;
  for (let i = toolsLineIdx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') { depth++; foundStart = true; }
      if (ch === '}') depth--;
    }
    if (foundStart && depth === 0) {
      toolsEndIdx = i;
      break;
    }
  }

  // Merge tool translations into the existing tools block
  for (const [toolId, sections] of Object.entries(toolData)) {
    const uiJson = sections.ui ? JSON.stringify(sections.ui) : null;
    const jsJson = sections.js ? JSON.stringify(sections.js) : null;

    const extra = [
      uiJson ? `ui: ${uiJson}` : null,
      jsJson ? `js: ${jsJson}` : null,
    ].filter(Boolean).join(', ');

    if (!extra) continue;

    const toolEntryRe = new RegExp(
      `('${toolId}':\\s*\\{\\s*name:\\s*'[^']*'\\s*,\\s*desc:\\s*'[^']*')(?:,\\s*ui:\\s*\\{[^}]*\\})?(?:,\\s*js:\\s*\\{[^}]*\\})?\\s*\\}`
    );

    for (let i = toolsLineIdx; i <= toolsEndIdx; i++) {
      const match = lines[i].match(toolEntryRe);
      if (match) {
        lines[i] = lines[i].replace(toolEntryRe, `$1, ${extra} }`);
        break;
      }
    }
  }

  const nextSource = lines.join('\n');

  if (nextSource === originalSource) continue;

  // Syntax check
  const tmpFile = path.join(os.tmpdir(), `i18n-merge-${lang}-${Date.now()}.mjs`);
  fs.writeFileSync(tmpFile, nextSource);
  const syntaxCheck = spawnSync(process.execPath, ['--check', tmpFile], { encoding: 'utf-8' });
  try { fs.unlinkSync(tmpFile); } catch {}

  if (syntaxCheck.status !== 0) {
    console.error(`Merge aborted for ${lang}: generated file failed syntax validation.`);
    if (syntaxCheck.stderr) console.error(syntaxCheck.stderr.trim());
    continue;
  }

  fs.writeFileSync(langFile, nextSource);
  totalUpdated++;
  const mapCount = langMaps[lang] ? Object.keys(langMaps[lang]).length : 0;
  console.log(`  ${lang}: updated (${mapCount} translations loaded)`);
}

let totalStrings = 0;
for (const toolData of Object.values(perLang.en)) {
  totalStrings += Object.keys(toolData.ui || {}).length + Object.keys(toolData.js || {}).length;
}
console.log(`Merged ${totalStrings} UI strings per language across ${totalUpdated} files`);
