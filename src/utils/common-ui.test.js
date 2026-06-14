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

  it('renders single item as a semantic feature list', () => {
    const result = createFeatureList([{ text: 'Feature One' }]);
    expect(result).toBe('<ul data-feature-list class="mt-2 flex flex-wrap gap-2 text-xs text-surface-600 dark:text-surface-400"><li>Feature One</li></ul>');
  });

  it('renders multiple items as semantic feature list items', () => {
    const result = createFeatureList([
      { text: 'Feature One' },
      { text: 'Feature Two' }
    ]);
    expect(result).toContain('data-feature-list');
    expect(result).not.toContain('<dl');
    expect(result).not.toContain('<dd>');
    expect(result).toContain('<li>Feature One</li>');
    expect(result).toContain('<li>Feature Two</li>');
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

  it('renders with 1 pill - exactly 1 data-trust-pill marker attribute', () => {
    const html = createToolHeader(
      { emoji: '🔧' },
      'Test Tool',
      'Test description',
      [{ text: 'Privacy First' }]
    );
    // Count occurrences of data-trust-pill attribute
    const matches = html.match(/data-trust-pill(?:=|\s|>)/g) || [];
    expect(matches.length).toBe(1);
    expect(html).toContain('data-trust-pill');
    expect(html).toContain('Privacy First');
    expect(html).not.toContain('data-feature-list');
  });

  it('renders HTML badge content without nesting markup inside attributes', () => {
    const html = createToolHeader(
      { emoji: '🔧' },
      'Test Tool',
      'Test description',
      [{ text: '<span data-i18n="tools.test-tool.ui.badge0">Privacy First</span>' }]
    );

    expect(html).toContain('data-trust-pill');
    expect(html).toContain('<span data-i18n="tools.test-tool.ui.badge0">Privacy First</span>');
    expect(html).not.toContain('data-trust-pill="<span');
  });

  it('renders with 3 pills - 1 trust pill + feature list with 2 li entries', () => {
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
    const trustPills = html.match(/data-trust-pill(?:=|\s|>)/g) || [];
    expect(trustPills.length).toBe(1);
    expect(html).toContain('data-trust-pill');
    expect(html).toContain('Trust Pill');

    // Feature list with 2 demoted items
    expect(html).toContain('data-feature-list');
    const liMatches = html.match(/<li>/g) || [];
    expect(liMatches.length).toBe(2);
    expect(html).not.toContain('<dl');
    expect(html).not.toContain('<dd>');
    expect(html).toContain('<li>Feature Two</li>');
    expect(html).toContain('<li>Feature Three</li>');
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
    expect(html).toContain('data-trust-pill');
    expect(html).toContain('Trust Pill');
    expect(html).toContain('data-feature-list');
    const liMatches = html.match(/<li>/g) || [];
    expect(liMatches.length).toBe(1);
    expect(html).not.toContain('<dl');
    expect(html).not.toContain('<dd>');
    expect(html).toContain('<li>Demoted Feature</li>');
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
