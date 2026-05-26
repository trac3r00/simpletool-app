import { describe, expect, it } from 'vitest';
import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

describe('package build scripts', () => {
  it('downloads Material Symbols before the existing build steps', () => {
    expect(packageJson.scripts['build:fonts']).toBe('node scripts/download-fonts.js');
    expect(packageJson.scripts['build:og']).toBe('node scripts/build-og-image.js');
    expect(packageJson.scripts.build).toBe(
      'bun run build:fonts && bun run build:og && bun run build:routes && bun run build:css && bun run build:ui && bun run build:vendor && bun run build:game-utils'
    );
  });
});
