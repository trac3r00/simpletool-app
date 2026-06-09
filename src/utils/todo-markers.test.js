import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const M_T = ['T', 'O', 'D', 'O'].join('');
const M_F = ['F', 'I', 'X', 'M', 'E'].join('');
const M_H = ['H', 'A', 'C', 'K'].join('');

const EXCLUDED_PATHS = [
  'node_modules/',
  'dist/',
  '.git/',
  M_T + '.md',
  'todo-markers.test.js',
  'scripts/vendor/',
  'src/utils/bundled-styles.js',
  'coverage/',
  '.wrangler/',
];

const MARKER_RE = new RegExp('(?:^|\\s|>)(?:\\/\\/|<!--|#|\\/\\*|\\*\\s)\\s*.*(' + M_T + '|' + M_F + '|' + M_H + ')\\b', 'i');
const TEST_BLOCK_RE = new RegExp('test\\.' + M_F.toLowerCase() + '\\s*\\(');

function getTrackedSourceFiles() {
  try {
    const output = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' });
    return output
      .split('\n')
      .filter(Boolean)
      .filter((f) => !EXCLUDED_PATHS.some((ex) => f.includes(ex)));
  } catch {
    return [];
  }
}

describe('tracked source files', () => {
  it(`contain no ${M_T}/${M_F}/${M_H} markers or test.${M_F.toLowerCase()} calls`, () => {
    const files = getTrackedSourceFiles();
    expect(files.length).toBeGreaterThan(0);

    const violations = [];
    for (const file of files) {
      const fullPath = join(ROOT, file);
      let content;
      try {
        content = readFileSync(fullPath, 'utf8');
      } catch {
        continue;
      }
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (MARKER_RE.test(lines[i]) || TEST_BLOCK_RE.test(lines[i])) {
          violations.push(`${file}:${i + 1}: ${lines[i].trim()}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
