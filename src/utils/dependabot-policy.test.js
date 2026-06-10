import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const DEPENDABOT_PATH = resolve(process.cwd(), '.github/dependabot.yml');

function loadText() {
  return readFileSync(DEPENDABOT_PATH, 'utf8');
}

/**
 * Extract the YAML block for a given package-ecosystem.
 * Returns the substring from "  - package-ecosystem: \"<name>\"" up to (but not including)
 * the next sibling "  - package-ecosystem:" line or end of file.
 */
function extractBlock(text, ecosystem) {
  const marker = `  - package-ecosystem: "${ecosystem}"`;
  const start = text.indexOf(marker);
  if (start === -1) return null;

  const afterStart = text.indexOf('\n', start) + 1;
  const nextBlock = text.indexOf('  - package-ecosystem:', afterStart);
  const end = nextBlock !== -1 ? nextBlock + 1 : text.length;
  return text.slice(afterStart, end);
}

describe('dependabot.yml policy', () => {
  const text = loadText();

  it('should load and contain version 2', () => {
    expect(text).toContain('version: 2');
  });

  describe('npm ecosystem', () => {
    const block = extractBlock(text, 'npm');

    it('should have an npm block', () => {
      expect(block).toBeTruthy();
    });

    it('should target root directory', () => {
      expect(block).toMatch(/directory: "\/"/);
    });

    it('should keep weekly Asia/Seoul schedule on Monday at 09:00', () => {
      expect(block).toMatch(/interval: "weekly"/);
      expect(block).toMatch(/day: "monday"/);
      expect(block).toMatch(/time: "09:00"/);
      expect(block).toMatch(/timezone: "Asia\/Seoul"/);
    });

    it('should preserve reviewer', () => {
      expect(block).toContain('- "trac3r00"');
    });

    it('should preserve dependency labels', () => {
      expect(block).toContain('- "dependencies"');
      expect(block).toContain('- "npm"');
    });

    it('should preserve commit-message prefix and scope', () => {
      expect(block).toMatch(/prefix: "chore"/);
      expect(block).not.toMatch(/prefix: "chore\(deps\)"/);
      expect(block).toMatch(/include: "scope"/);
    });

    it('should disable automatic rebase to reduce CI churn', () => {
      expect(block).toMatch(/rebase-strategy:\s*"disabled"/);
    });

    it('should ignore wrangler and tailwindcss v4', () => {
      expect(block).toMatch(/dependency-name: "wrangler"/);
      expect(block).toMatch(/dependency-name: "tailwindcss"/);
      expect(block).toMatch(/versions:\s*\[\s*"4\.x"\s*\]/s);
    });

    it('should guard major updates with version-constrained ignore entries', () => {
      // Every ignore entry must carry either a versions constraint on a major
      // range (e.g. "4.x") or an explicit comment explaining full-ignore
      // rationale — this proves major-update protection is intentional.
      const ignoreSection = block.match(/ignore:[\s\S]*?(?=\n\s+groups:|\n\s+package-ecosystem:|$)/);
      expect(ignoreSection).toBeTruthy();

      const entries = [...block.matchAll(/-\s+dependency-name:\s*"([^"]+)"[\s\S]*?(?=-\s+dependency-name|\n\s+groups:|\n\s+package-ecosystem:|$)/g)];

      // Must have at least one ignore entry (guard is present)
      expect(entries.length).toBeGreaterThanOrEqual(1);

      // Each ignore entry should either specify a versions constraint
      // (scoped major-version guard) or the dependency-name must be "wrangler"
      // which is fully-ignored because it's a managed runtime package.
      for (const entry of entries) {
        const fullMatch = entry[0];
        const hasVersionConstraint = /versions:\s*\[/.test(fullMatch);
        const isManagedRuntime = /dependency-name:\s*"wrangler"/.test(fullMatch);
        expect(
          hasVersionConstraint || isManagedRuntime,
          `Ignore entry for "${entry[1]}" must have a versions constraint or be a managed runtime package`
        ).toBe(true);
      }
    });

    it('should separate production and development dependency groups', () => {
      // Ensure both group names appear inside the npm block
      expect(block).toContain('production-dependencies:');
      expect(block).toContain('dev-dependencies:');

      // production-dependencies settings
      const prodMatch = block.match(
        /production-dependencies:[\s\S]*?dependency-type:\s*"production"/
      );
      expect(prodMatch).toBeTruthy();
      expect(block).toMatch(
        /production-dependencies:[\s\S]*?patterns:[\s\S]*?-\s*"\*"/
      );
      expect(block).toMatch(
        /production-dependencies:[\s\S]*?update-types:[\s\S]*?-\s*"minor"[\s\S]*?-\s*"patch"/
      );

      // dev-dependencies settings
      const devMatch = block.match(
        /dev-dependencies:[\s\S]*?dependency-type:\s*"development"/
      );
      expect(devMatch).toBeTruthy();
      expect(block).toMatch(
        /dev-dependencies:[\s\S]*?patterns:[\s\S]*?-\s*"\*"/
      );
      expect(block).toMatch(
        /dev-dependencies:[\s\S]*?update-types:[\s\S]*?-\s*"minor"[\s\S]*?-\s*"patch"/
      );
    });
  });

  describe('github-actions ecosystem', () => {
    const block = extractBlock(text, 'github-actions');

    it('should have a github-actions block', () => {
      expect(block).toBeTruthy();
    });

    it('should target root directory', () => {
      expect(block).toMatch(/directory: "\/"/);
    });

    it('should keep weekly Asia/Seoul schedule on Monday at 09:00', () => {
      expect(block).toMatch(/interval: "weekly"/);
      expect(block).toMatch(/day: "monday"/);
      expect(block).toMatch(/time: "09:00"/);
      expect(block).toMatch(/timezone: "Asia\/Seoul"/);
    });

    it('should preserve reviewer', () => {
      expect(block).toContain('- "trac3r00"');
    });

    it('should preserve dependency labels', () => {
      expect(block).toContain('- "dependencies"');
      expect(block).toContain('- "github-actions"');
    });

    it('should preserve commit-message prefix and scope', () => {
      expect(block).toMatch(/prefix: "chore"/);
      expect(block).not.toMatch(/prefix: "chore\(deps\)"/);
      expect(block).toMatch(/include: "scope"/);
    });

    it('should group minor and patch action updates', () => {
      expect(block).toContain('actions-minor-patch:');
      expect(block).toMatch(
        /actions-minor-patch:[\s\S]*?patterns:[\s\S]*?-\s*"\*"/
      );
      expect(block).toMatch(
        /actions-minor-patch:[\s\S]*?update-types:[\s\S]*?-\s*"minor"[\s\S]*?-\s*"patch"/
      );
    });
  });
});
