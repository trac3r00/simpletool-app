import { describe, it, expect } from 'vitest';
import { createToolHeader, createFeatureList } from './common-ui.js';

describe('createFeatureList', () => {
  it('returns empty string for empty array', () => {
    const result = createFeatureList([]);
    expect(result).toBe('');
  });

  it('returns empty string for null/undefined', () => {
    expect(createFeatureList(null)).toBe('');
    expect(createFeatureList(undefined)).toBe('');
  });

  it('renders single item as definition list', () => {
    const result = createFeatureList([{ text: 'Feature One' }]);
    expect(result).toBe('<dl data-feature-list><dt class="sr-only">Feature</dt><dd>Feature One</dd></dl>');
  });

  it('renders multiple items as definition list', () => {
    const result = createFeatureList([
      { text: 'Feature One' },
      { text: 'Feature Two' }
    ]);
    expect(result).toContain('data-feature-list');
    expect(result).toContain('<dd>Feature One</dd>');
    expect(result).toContain('<dd>Feature Two</dd>');
  });
});

describe('createToolHeader', () => {
  it('renders with 0 pills - no trust pill rendered', () => {
    const html = createToolHeader(
      { emoji: '🔧' },
      'Test Tool',
      'Test description',
      []
    );
    expect(html).not.toContain('data-trust-pill');
    expect(html).not.toContain('data-feature-list');
  });

  it('renders with 1 pill - exactly 1 data-trust-pill attribute', () => {
    const html = createToolHeader(
      { emoji: '🔧' },
      'Test Tool',
      'Test description',
      [{ text: 'Privacy First' }]
    );
    // Count occurrences of data-trust-pill attribute
    const matches = html.match(/data-trust-pill="[^"]*"/g) || [];
    expect(matches.length).toBe(1);
    expect(html).toContain('data-trust-pill="Privacy First"');
    expect(html).not.toContain('data-feature-list');
  });

  it('renders with 3 pills - 1 trust pill + feature list with 2 dd entries', () => {
    const html = createToolHeader(
      { emoji: '🔧' },
      'Test Tool',
      'Test description',
      [
        { text: 'Trust Pill' },
        { text: 'Feature Two' },
        { text: 'Feature Three' }
      ]
    );
    // Exactly 1 trust pill
    const trustPills = html.match(/data-trust-pill="[^"]*"/g) || [];
    expect(trustPills.length).toBe(1);
    expect(html).toContain('data-trust-pill="Trust Pill"');

    // Feature list with 2 demoted items
    expect(html).toContain('data-feature-list');
    const ddMatches = html.match(/<dd>/g) || [];
    expect(ddMatches.length).toBe(2);
    expect(html).toContain('<dd>Feature Two</dd>');
    expect(html).toContain('<dd>Feature Three</dd>');
  });

  it('preserves existing Tailwind classes on pill', () => {
    const html = createToolHeader(
      { emoji: '🔧' },
      'Test Tool',
      'Test description',
      [{ text: 'Privacy First' }]
    );
    // Pill should have rounded (not rounded-full), bg-primary, text-xs
    expect(html).toContain(' rounded text-xs');
    expect(html).not.toContain('rounded-full');
  });

  it('renders with 2 pills - 1 trust pill + 1 demoted feature', () => {
    const html = createToolHeader(
      { emoji: '🔧' },
      'Test Tool',
      'Test description',
      [
        { text: 'Trust Pill' },
        { text: 'Demoted Feature' }
      ]
    );
    expect(html).toContain('data-trust-pill="Trust Pill"');
    expect(html).toContain('data-feature-list');
    const ddMatches = html.match(/<dd>/g) || [];
    expect(ddMatches.length).toBe(1);
    expect(html).toContain('<dd>Demoted Feature</dd>');
  });

  it('accepts toolId option correctly', () => {
    const html = createToolHeader(
      { emoji: '🔧' },
      'Test Tool',
      'Test description',
      [{ text: 'Privacy First' }],
      { toolId: 'test-tool' }
    );
    expect(html).toContain('data-i18n="tools.test-tool.name"');
    expect(html).toContain('data-i18n="tools.test-tool.desc"');
  });

  it('works with string option for toolId (legacy behavior)', () => {
    const html = createToolHeader(
      { emoji: '🔧' },
      'Test Tool',
      'Test description',
      [{ text: 'Privacy First' }],
      'test-tool'
    );
    expect(html).toContain('data-i18n="tools.test-tool.name"');
  });
});
