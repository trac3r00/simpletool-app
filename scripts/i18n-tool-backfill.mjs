#!/usr/bin/env node
// English route fallbacks are the source of truth. Keep translations in the
// adjacent JSON files; this generator adds keys without rewriting catalog style.
import fs from 'node:fs';
import { parse } from 'acorn';

const locales = process.argv.includes('--english-only')
  ? ['en'] : ['en', 'ko', 'ja', 'es', 'zh-CN', 'zh-TW', 'fr', 'de', 'pt', 'vi'];
const checkOnly = process.argv.includes('--check');
const load = locale => JSON.parse(fs.readFileSync(new URL(`./i18n-tool-backfill/${locale}.json`, import.meta.url), 'utf8'));
const english = load('en');
const englishKeys = Object.keys(english).sort();

function literalMarkup(value) {
  return {
    tags: value.match(/<[^>]+>/g) || [],
    code: [...value.matchAll(/<(code|pre)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(match => match[2]),
    tokens: value.match(/\$\{[^}]+\}|\{\{[^}]+\}\}|\{[a-zA-Z_]\w*\}/g) || [],
    leading: value.match(/^\s*/)[0],
    trailing: value.match(/\s*$/)[0],
  };
}
function validate(locale, values) {
  if (JSON.stringify(Object.keys(values).sort()) !== JSON.stringify(englishKeys)) {
    throw new Error(`${locale}: translation key set differs from English`);
  }
  for (const key of englishKeys) {
    if (typeof values[key] !== 'string' || !values[key].trim()) throw new Error(`${locale}: empty ${key}`);
    if (JSON.stringify(literalMarkup(values[key])) !== JSON.stringify(literalMarkup(english[key]))) {
      throw new Error(`${locale}: markup, code, placeholder, or boundary whitespace changed in ${key}`);
    }
  }
}
function property(node, key) {
  return node.properties.find(item => (item.key.name ?? item.key.value) === key);
}
function render(source, values) {
  const ast = parse(source, {ecmaVersion:'latest', sourceType:'module'});
  const root = ast.body.find(node => node.type === 'ExportDefaultDeclaration')?.declaration;
  if (root?.type !== 'ObjectExpression') throw new Error('Catalog must export an object');
  const groups = new Map();
  for (const [key, value] of Object.entries(values)) {
    const segments = key.split('.');
    let node = root;
    for (let index = 0; index < segments.length; index++) {
      const part = segments[index];
      const existing = property(node, part);
      if (existing) {
        if (index === segments.length - 1) {
          if (existing.value.value !== value) throw new Error(`Existing catalog value differs: ${key}`);
        } else {
          if (existing.value.type !== 'ObjectExpression') throw new Error(`Catalog path is not an object: ${key}`);
          node = existing.value;
        }
      } else {
        if (!groups.has(node)) groups.set(node, {});
        let patch = groups.get(node);
        for (const segment of segments.slice(index, -1)) patch = patch[segment] ||= {};
        patch[segments.at(-1)] = value;
        break;
      }
    }
  }
  const edits = [];
  for (const [node, additions] of groups) {
    const close = node.end - 1;
    const lineStart = source.lastIndexOf('\n', close) + 1;
    const closePrefix = source.slice(lineStart, close);
    const ownLine = /^\s*$/.test(closePrefix);
    const indent = ownLine ? closePrefix : source.slice(lineStart).match(/^\s*/)[0];
    const at = ownLine ? lineStart : close;
    const last = node.properties.at(-1);
    if (last && !source.slice(last.end, close).includes(',')) edits.push({at:last.end, text:','});
    const body = JSON.stringify(additions, null, 2).split('\n').slice(1, -1)
      .map(line => `${indent}  ${line.slice(2)}`).join('\n');
    edits.push({at, text:`${ownLine ? '' : '\n'}${body},\n${ownLine ? '' : indent}`});
  }
  for (const edit of edits.sort((a, b) => b.at - a.at)) source = source.slice(0, edit.at) + edit.text + source.slice(edit.at);
  parse(source, {ecmaVersion:'latest', sourceType:'module'});
  return {source, addedGroups:groups.size};
}

let changed = 0;
for (const locale of locales) {
  const values = load(locale);
  validate(locale, values);
  const file = new URL(`../src/i18n/${locale}.js`, import.meta.url);
  const before = fs.readFileSync(file, 'utf8');
  const after = render(before, values);
  if (before !== after.source) {
    changed++;
    if (!checkOnly) fs.writeFileSync(file, after.source);
  }
  console.log(`${locale}: ${englishKeys.length} keys validated; ${after.addedGroups} object(s) updated`);
}
if (checkOnly && changed) throw new Error(`${changed} catalog(s) require regeneration`);
