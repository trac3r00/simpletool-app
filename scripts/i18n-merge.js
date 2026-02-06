#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = path.join(__dirname, 'i18n-manifest.json');
const I18N_PATH = path.join(__dirname, '..', 'src', 'utils', 'i18n.js');

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

function loadLangMap(langCode) {
  const fp = `/tmp/i18n-${langCode}.json`;
  if (!fs.existsSync(fp)) {
    console.error(`  WARNING: ${fp} not found`);
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

const koMap = loadLangMap('ko');
const jaMap = loadLangMap('ja');
const esMap = loadLangMap('es');

const perLang = {
  en: buildToolTranslations('en', null),
  ko: buildToolTranslations('ko', koMap),
  ja: buildToolTranslations('ja', jaMap),
  es: buildToolTranslations('es', esMap),
};

const lines = fs.readFileSync(I18N_PATH, 'utf-8').split('\n');

const langStarts = {};
const langOrder = ['en', 'ko', 'ja', 'es'];
let inTranslations = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const TRANSLATIONS')) inTranslations = true;
  if (!inTranslations) continue;
  for (const lang of langOrder) {
    if (lines[i].match(new RegExp(`^  ${lang}: \\{`)) && !lines[i].includes('name:')) {
      langStarts[lang] = i;
    }
  }
}

for (const lang of langOrder) {
  const toolData = perLang[lang];
  const startLine = langStarts[lang];
  if (startLine === undefined) {
    console.error(`  WARNING: Could not find ${lang} section in TRANSLATIONS`);
    continue;
  }
  
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
    
    for (let i = startLine; i < lines.length; i++) {
      if (i > startLine && lines[i].match(/^  (ko|ja|es|};)/)) break;
      
      const match = lines[i].match(toolEntryRe);
      if (match) {
        lines[i] = lines[i].replace(toolEntryRe, `$1, ${extra} }`);
        break;
      }
    }
  }
}

fs.writeFileSync(I18N_PATH, lines.join('\n'));

let totalStrings = 0;
for (const toolData of Object.values(perLang.en)) {
  totalStrings += Object.keys(toolData.ui || {}).length + Object.keys(toolData.js || {}).length;
}
console.log(`Merged ${totalStrings} UI strings per language into ${I18N_PATH}`);
console.log(`  ko: ${Object.keys(koMap).length} translations loaded`);
console.log(`  ja: ${Object.keys(jaMap).length} translations loaded`);
console.log(`  es: ${Object.keys(esMap).length} translations loaded`);
