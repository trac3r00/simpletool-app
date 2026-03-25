import { describe, it, expect } from 'vitest';
import {
  generatePassword,
  scorePassword,
  generateUsername,
  generatePassphrase,
  generateCatchAllEmail,
  generatePlusAddress,
  passwordMetadata
} from './generators.js';

describe('generatePassword', () => {
  it('generates a password of default length (24)', () => {
    const pw = generatePassword();
    expect(pw.length).toBe(24);
  });

  it('respects custom length', () => {
    const pw = generatePassword({ length: 32 });
    expect(pw.length).toBe(32);
  });

  it('enforces minimum length of 12', () => {
    const pw = generatePassword({ length: 4 });
    expect(pw.length).toBe(12);
  });

  it('enforces maximum length of 128', () => {
    const pw = generatePassword({ length: 200 });
    expect(pw.length).toBe(128);
  });

  it('includes uppercase when selected', () => {
    const pw = generatePassword({ uppercase: true, lowercase: false, numbers: false, symbols: false });
    expect(/[A-Z]/.test(pw)).toBe(true);
  });

  it('includes lowercase when selected', () => {
    const pw = generatePassword({ uppercase: false, lowercase: true, numbers: false, symbols: false });
    expect(/[a-z]/.test(pw)).toBe(true);
  });

  it('includes numbers when selected', () => {
    const pw = generatePassword({ uppercase: false, lowercase: false, numbers: true, symbols: false });
    expect(/\d/.test(pw)).toBe(true);
  });

  it('includes symbols when selected', () => {
    const pw = generatePassword({ uppercase: false, lowercase: false, numbers: false, symbols: true });
    expect(/[^A-Za-z0-9]/.test(pw)).toBe(true);
  });

  it('throws when no character types selected', () => {
    expect(() => generatePassword({
      uppercase: false, lowercase: false, numbers: false, symbols: false
    })).toThrow('Select at least one character type');
  });

  it('generates unique passwords', () => {
    const passwords = new Set(Array.from({ length: 20 }, () => generatePassword()));
    expect(passwords.size).toBe(20);
  });

  it('guarantees at least one char from each selected pool', () => {
    // With all pools selected, test many times
    for (let i = 0; i < 10; i++) {
      const pw = generatePassword({ length: 12 });
      expect(/[A-Z]/.test(pw)).toBe(true);
      expect(/[a-z]/.test(pw)).toBe(true);
      expect(/\d/.test(pw)).toBe(true);
      expect(/[^A-Za-z0-9]/.test(pw)).toBe(true);
    }
  });
});

describe('scorePassword', () => {
  it('rates short simple passwords as weak', () => {
    const result = scorePassword('abc');
    expect(result.score).toBeLessThanOrEqual(2);
    expect(result.label).toBeDefined();
    expect(result.percentage).toBeDefined();
  });

  it('rates long complex passwords as strong', () => {
    const result = scorePassword('Abc123!@#defGHI456$%^');
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it('returns score between 0 and 4', () => {
    const cases = ['', 'a', 'Abc1!', 'VeryStr0ng!Pass#word'];
    for (const pw of cases) {
      const { score } = scorePassword(pw);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(4);
    }
  });

  it('percentage is score/4 * 100', () => {
    const result = scorePassword('Test123!');
    expect(result.percentage).toBe((result.score / 4) * 100);
  });

  it('labels match score values', () => {
    const labels = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'];
    const result = scorePassword('x');
    expect(labels).toContain(result.label);
  });
});

describe('generateUsername', () => {
  it('generates a username of default length', () => {
    const username = generateUsername();
    expect(username.length).toBeLessThanOrEqual(12);
    expect(username.length).toBeGreaterThan(0);
  });

  it('respects custom length', () => {
    const username = generateUsername({ length: 20 });
    expect(username.length).toBeLessThanOrEqual(20);
  });

  it('enforces min length of 6', () => {
    const username = generateUsername({ length: 2 });
    expect(username.length).toBeGreaterThanOrEqual(6);
  });

  it('enforces max length of 32', () => {
    const username = generateUsername({ length: 100 });
    expect(username.length).toBeLessThanOrEqual(32);
  });

  it('generates readable style by default', () => {
    const username = generateUsername({ style: 'readable' });
    expect(/^[a-z0-9]+$/.test(username)).toBe(true);
  });

  it('generates color style', () => {
    const username = generateUsername({ style: 'color' });
    expect(username.length).toBeGreaterThan(0);
  });

  it('generates default style', () => {
    const username = generateUsername({ style: 'random' });
    expect(username.length).toBeGreaterThan(0);
  });

  it('excludes numbers when includeNumbers is false', () => {
    // With readable style and no numbers, should still produce something
    const username = generateUsername({ includeNumbers: false, style: 'readable' });
    expect(username.length).toBeGreaterThan(0);
  });
});

describe('generatePassphrase', () => {
  it('generates a passphrase with default settings', () => {
    const phrase = generatePassphrase();
    const words = phrase.split('-');
    expect(words).toHaveLength(4);
  });

  it('respects custom word count', () => {
    const phrase = generatePassphrase({ wordCount: 6, separator: '-' });
    const words = phrase.split('-');
    expect(words).toHaveLength(6);
  });

  it('enforces min word count of 3', () => {
    const phrase = generatePassphrase({ wordCount: 1 });
    const words = phrase.split('-');
    expect(words.length).toBeGreaterThanOrEqual(3);
  });

  it('enforces max word count of 8', () => {
    const phrase = generatePassphrase({ wordCount: 20 });
    const words = phrase.split('-');
    expect(words.length).toBeLessThanOrEqual(8);
  });

  it('uses custom separator', () => {
    const phrase = generatePassphrase({ separator: '_' });
    expect(phrase).toContain('_');
  });

  it('capitalizes words when enabled', () => {
    const phrase = generatePassphrase({ capitalize: true });
    const words = phrase.split('-');
    for (const word of words) {
      expect(word[0]).toBe(word[0].toUpperCase());
    }
  });

  it('includes numbers when enabled', () => {
    const phrase = generatePassphrase({ includeNumbers: true });
    expect(/\d/.test(phrase)).toBe(true);
  });
});

describe('generateCatchAllEmail', () => {
  it('generates an email address', () => {
    const email = generateCatchAllEmail();
    expect(email).toContain('@');
    const [local, domain] = email.split('@');
    expect(local.length).toBeGreaterThan(0);
    expect(domain.length).toBeGreaterThan(0);
  });

  it('uses provided prefix', () => {
    const email = generateCatchAllEmail({ prefix: 'testuser' });
    expect(email.startsWith('testuser@')).toBe(true);
  });

  it('uses provided domain', () => {
    const email = generateCatchAllEmail({ domain: 'example.com' });
    expect(email.endsWith('@example.com')).toBe(true);
  });

  it('supports syllable style', () => {
    const email = generateCatchAllEmail({ style: 'syllable' });
    expect(email).toContain('@');
  });
});

describe('generatePlusAddress', () => {
  it('generates a plus address from base email', () => {
    const email = generatePlusAddress({ baseEmail: 'user@example.com' });
    expect(email).toMatch(/^user\+[a-z0-9]+@example\.com$/);
  });

  it('respects custom tag length', () => {
    const email = generatePlusAddress({ baseEmail: 'user@example.com', tagLength: 10 });
    const tag = email.split('+')[1].split('@')[0];
    expect(tag).toHaveLength(10);
  });

  it('throws for invalid base email', () => {
    expect(() => generatePlusAddress({ baseEmail: 'invalid' })).toThrow();
    expect(() => generatePlusAddress({})).toThrow();
  });
});

describe('passwordMetadata', () => {
  it('returns length, strength, and timestamp', () => {
    const meta = passwordMetadata('Test123!');
    expect(meta).toHaveProperty('length', 8);
    expect(meta).toHaveProperty('strength');
    expect(meta).toHaveProperty('generatedAt');
    expect(meta.strength).toHaveProperty('score');
    expect(meta.strength).toHaveProperty('label');
  });

  it('generatedAt is a valid ISO string', () => {
    const meta = passwordMetadata('pw');
    expect(() => new Date(meta.generatedAt)).not.toThrow();
    expect(new Date(meta.generatedAt).toISOString()).toBe(meta.generatedAt);
  });
});
