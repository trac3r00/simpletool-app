import { describe, it, expect } from 'vitest';
import { isProjectOwnedFile } from './scan-project-files.js';

describe('project-owned technical-debt marker file filter', () => {
  it('excludes node_modules paths', () => {
    expect(isProjectOwnedFile('node_modules/katex/dist/katex.js')).toBe(false);
    expect(isProjectOwnedFile('./node_modules/lodash/index.js')).toBe(false);
    expect(isProjectOwnedFile('app/node_modules/package/file.js')).toBe(false);
  });

  it('excludes dist and vendor paths', () => {
    expect(isProjectOwnedFile('dist/styles.css')).toBe(false);
    expect(isProjectOwnedFile('dist/vendor/game-utils.min.js')).toBe(false);
    expect(isProjectOwnedFile('scripts/vendor/noble-hashes-entry.js')).toBe(false);
  });

  it('excludes .git, .wrangler, and coverage paths', () => {
    expect(isProjectOwnedFile('.git/config')).toBe(false);
    expect(isProjectOwnedFile('.wrangler/state/v1/kv/some-key')).toBe(false);
    expect(isProjectOwnedFile('coverage/lcov-report/index.html')).toBe(false);
  });

  it('includes project source, tests, and scripts', () => {
    expect(isProjectOwnedFile('src/utils/security.js')).toBe(true);
    expect(isProjectOwnedFile('src/routes/json-formatter.js')).toBe(true);
    expect(isProjectOwnedFile('tests/e2e/games.spec.js')).toBe(true);
    expect(isProjectOwnedFile('scripts/build-ui.js')).toBe(true);
  });

  it('accepts paths with backslash separators', () => {
    expect(isProjectOwnedFile('node_modules\\katex\\dist\\katex.js')).toBe(false);
    expect(isProjectOwnedFile('src\\utils\\security.js')).toBe(true);
  });
});
