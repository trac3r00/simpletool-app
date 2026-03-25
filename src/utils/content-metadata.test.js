import { describe, it, expect } from 'vitest';
import { CONTENT_TRANSLATIONS } from './content-metadata.js';

const EXPECTED_LANGUAGES = ['en', 'ko', 'ja', 'es', 'zh-CN', 'zh-TW', 'fr', 'de', 'pt', 'vi'];

describe('CONTENT_TRANSLATIONS', () => {
  it('contains all 10 supported languages', () => {
    for (const lang of EXPECTED_LANGUAGES) {
      expect(CONTENT_TRANSLATIONS).toHaveProperty(lang);
    }
  });

  it('each language has relatedTools string', () => {
    for (const lang of EXPECTED_LANGUAGES) {
      expect(typeof CONTENT_TRANSLATIONS[lang].relatedTools).toBe('string');
      expect(CONTENT_TRANSLATIONS[lang].relatedTools.length).toBeGreaterThan(0);
    }
  });

  it('each language has faq section with required keys', () => {
    for (const lang of EXPECTED_LANGUAGES) {
      const faq = CONTENT_TRANSLATIONS[lang].faq;
      expect(faq).toHaveProperty('heading');
      expect(faq).toHaveProperty('subheading');
      expect(faq).toHaveProperty('empty');
      expect(faq).toHaveProperty('cat');
      expect(typeof faq.heading).toBe('string');
      expect(typeof faq.subheading).toBe('string');
    }
  });

  it('each language has blog section with required keys', () => {
    for (const lang of EXPECTED_LANGUAGES) {
      const blog = CONTENT_TRANSLATIONS[lang].blog;
      expect(blog).toHaveProperty('heading');
      expect(blog).toHaveProperty('subheading');
      expect(blog).toHaveProperty('empty');
      expect(blog).toHaveProperty('cat');
    }
  });

  it('each language has legal section with all page titles', () => {
    const requiredKeys = [
      'lastUpdated', 'termsTitle', 'termsDescription',
      'privacyTitle', 'privacyDescription',
      'aboutTitle', 'aboutDescription',
      'securityTitle', 'securityDescription',
      'careersTitle', 'careersDescription',
      'contactTitle', 'contactDescription'
    ];
    for (const lang of EXPECTED_LANGUAGES) {
      const legal = CONTENT_TRANSLATIONS[lang].legal;
      for (const key of requiredKeys) {
        expect(legal).toHaveProperty(key);
        expect(typeof legal[key]).toBe('string');
      }
    }
  });

  it('FAQ categories are consistent across languages', () => {
    const enCats = Object.keys(CONTENT_TRANSLATIONS.en.faq.cat);
    for (const lang of EXPECTED_LANGUAGES) {
      const langCats = Object.keys(CONTENT_TRANSLATIONS[lang].faq.cat);
      expect(langCats).toEqual(enCats);
    }
  });

  it('blog categories are consistent across languages', () => {
    const enCats = Object.keys(CONTENT_TRANSLATIONS.en.blog.cat);
    for (const lang of EXPECTED_LANGUAGES) {
      const langCats = Object.keys(CONTENT_TRANSLATIONS[lang].blog.cat);
      expect(langCats).toEqual(enCats);
    }
  });
});
