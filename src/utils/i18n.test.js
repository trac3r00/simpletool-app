import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_QUERY_KEY,
  normalizeLanguage,
  resolveRequestLanguage,
  withLanguageQuery,
  t,
  getToolTranslation,
  localizeTool,
  localizeTools,
  getLanguageBootstrapScript,
  getLanguageSelectorHTML
} from './i18n.js';

// Import locale modules directly to test raw translations (no fallback)
import enCatalog from '../i18n/en.js';
import koCatalog from '../i18n/ko.js';
import jaCatalog from '../i18n/ja.js';
import esCatalog from '../i18n/es.js';
import zhCNCatalog from '../i18n/zh-CN.js';
import zhTWCatalog from '../i18n/zh-TW.js';
import frCatalog from '../i18n/fr.js';
import deCatalog from '../i18n/de.js';
import ptCatalog from '../i18n/pt.js';
import viCatalog from '../i18n/vi.js';

const localeCatalogs = {
  en: enCatalog,
  ko: koCatalog,
  ja: jaCatalog,
  es: esCatalog,
  'zh-CN': zhCNCatalog,
  'zh-TW': zhTWCatalog,
  fr: frCatalog,
  de: deCatalog,
  pt: ptCatalog,
  vi: viCatalog,
};

describe('SUPPORTED_LANGUAGES', () => {
  it('contains 10 languages', () => {
    expect(Object.keys(SUPPORTED_LANGUAGES)).toHaveLength(10);
  });

  it('includes all expected language codes', () => {
    const codes = Object.keys(SUPPORTED_LANGUAGES);
    expect(codes).toEqual(
      expect.arrayContaining(['en', 'ko', 'ja', 'es', 'zh-CN', 'zh-TW', 'fr', 'de', 'pt', 'vi'])
    );
  });

  it('each language has name and flag', () => {
    for (const [, lang] of Object.entries(SUPPORTED_LANGUAGES)) {
      expect(lang).toHaveProperty('name');
      expect(lang).toHaveProperty('flag');
      expect(typeof lang.name).toBe('string');
      expect(typeof lang.flag).toBe('string');
    }
  });
});

describe('DEFAULT_LANGUAGE', () => {
  it('is English', () => {
    expect(DEFAULT_LANGUAGE).toBe('en');
  });
});

describe('LANGUAGE_QUERY_KEY', () => {
  it('is "lang"', () => {
    expect(LANGUAGE_QUERY_KEY).toBe('lang');
  });
});

describe('normalizeLanguage', () => {
  it('returns default for null/undefined/empty', () => {
    expect(normalizeLanguage(null)).toBe('en');
    expect(normalizeLanguage(undefined)).toBe('en');
    expect(normalizeLanguage('')).toBe('en');
  });

  it('normalizes supported base languages', () => {
    expect(normalizeLanguage('en')).toBe('en');
    expect(normalizeLanguage('ko')).toBe('ko');
    expect(normalizeLanguage('ja')).toBe('ja');
    expect(normalizeLanguage('fr')).toBe('fr');
    expect(normalizeLanguage('de')).toBe('de');
    expect(normalizeLanguage('pt')).toBe('pt');
    expect(normalizeLanguage('vi')).toBe('vi');
    expect(normalizeLanguage('es')).toBe('es');
  });

  it('normalizes Chinese variants correctly', () => {
    expect(normalizeLanguage('zh-CN')).toBe('zh-CN');
    expect(normalizeLanguage('zh-TW')).toBe('zh-TW');
    expect(normalizeLanguage('zh-Hant')).toBe('zh-TW');
    expect(normalizeLanguage('zh')).toBe('zh-CN');
    expect(normalizeLanguage('zh_tw')).toBe('zh-TW');
    expect(normalizeLanguage('zh_cn')).toBe('zh-CN');
  });

  it('is case-insensitive', () => {
    expect(normalizeLanguage('EN')).toBe('en');
    expect(normalizeLanguage('Ko')).toBe('ko');
    expect(normalizeLanguage('ZH-TW')).toBe('zh-TW');
  });

  it('handles hyphenated locale strings', () => {
    expect(normalizeLanguage('en-US')).toBe('en');
    expect(normalizeLanguage('ko-KR')).toBe('ko');
    expect(normalizeLanguage('ja-JP')).toBe('ja');
  });

  it('returns default for unsupported languages', () => {
    expect(normalizeLanguage('xx')).toBe('en');
    expect(normalizeLanguage('ru')).toBe('en');
    expect(normalizeLanguage('ar')).toBe('en');
  });

  it('trims whitespace', () => {
    expect(normalizeLanguage('  ko  ')).toBe('ko');
  });
});

describe('resolveRequestLanguage', () => {
  function makeRequest(acceptLanguage) {
    return {
      headers: {
        get: (name) => name === 'Accept-Language' ? acceptLanguage : null
      }
    };
  }

  function makeUrl(langParam) {
    const url = new URL('https://simpletool.app/json-formatter');
    if (langParam) url.searchParams.set('lang', langParam);
    return url;
  }

  it('prefers query parameter over Accept-Language', () => {
    const req = makeRequest('ja');
    const url = makeUrl('ko');
    expect(resolveRequestLanguage(req, url)).toBe('ko');
  });

  it('falls back to Accept-Language when no query param', () => {
    const req = makeRequest('ja,en;q=0.9');
    const url = makeUrl(null);
    expect(resolveRequestLanguage(req, url)).toBe('ja');
  });

  it('returns default when unsupported language normalizes to en', () => {
    // normalizeLanguage('ru') returns 'en' (default), which is a valid supported language
    const req = makeRequest('ru,ko;q=0.8');
    const url = makeUrl(null);
    expect(resolveRequestLanguage(req, url)).toBe('en');
  });

  it('picks first supported language from Accept-Language', () => {
    const req = makeRequest('ko,ja;q=0.9');
    const url = makeUrl(null);
    expect(resolveRequestLanguage(req, url)).toBe('ko');
  });

  it('returns default when no language matches', () => {
    const req = makeRequest('ru,ar');
    const url = makeUrl(null);
    expect(resolveRequestLanguage(req, url)).toBe('en');
  });

  it('handles null request and url', () => {
    expect(resolveRequestLanguage(null, null)).toBe('en');
  });

  it('normalizes query parameter', () => {
    const req = makeRequest('');
    const url = makeUrl('zh-Hant');
    expect(resolveRequestLanguage(req, url)).toBe('zh-TW');
  });
});

describe('withLanguageQuery', () => {
  it('returns path unchanged for default language', () => {
    expect(withLanguageQuery('/json-formatter', 'en')).toBe('/json-formatter');
  });

  it('appends lang query for non-default language', () => {
    expect(withLanguageQuery('/json-formatter', 'ko')).toBe('/json-formatter?lang=ko');
  });

  it('returns external URLs unchanged', () => {
    expect(withLanguageQuery('https://example.com', 'ko')).toBe('https://example.com');
  });

  it('returns mailto links unchanged', () => {
    expect(withLanguageQuery('mailto:test@test.com', 'ko')).toBe('mailto:test@test.com');
  });

  it('returns hash links unchanged', () => {
    expect(withLanguageQuery('#section', 'ko')).toBe('#section');
  });

  it('returns empty/null path unchanged', () => {
    expect(withLanguageQuery('', 'ko')).toBe('');
    expect(withLanguageQuery(null, 'ko')).toBe(null);
  });

  it('preserves existing query params', () => {
    const result = withLanguageQuery('/path?foo=bar', 'ko');
    expect(result).toContain('foo=bar');
    expect(result).toContain('lang=ko');
  });

  it('preserves hash fragment', () => {
    const result = withLanguageQuery('/path#section', 'ko');
    expect(result).toContain('lang=ko');
    expect(result).toContain('#section');
  });
});

describe('t (translate)', () => {
  it('returns English translation for known path', () => {
    const result = t('nav.home', 'en');
    expect(typeof result).toBe('string');
    expect(result).not.toBe('nav.home');
  });

  it('returns the path string for unknown keys', () => {
    expect(t('totally.fake.key', 'en')).toBe('totally.fake.key');
  });

  it('falls back to English for missing keys in other languages', () => {
    const enResult = t('nav.home', 'en');
    const koResult = t('nav.home', 'ko');
    expect(typeof koResult).toBe('string');
    expect(koResult).not.toBe('nav.home');
    // Both should resolve (not return the path key)
    expect(enResult).not.toBe('nav.home');
  });
});

describe('getToolTranslation', () => {
  it('returns translation for known tool in English', () => {
    const result = getToolTranslation('json-formatter', 'en');
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('name');
  });

  it('returns null for unknown tool', () => {
    const result = getToolTranslation('nonexistent-tool', 'en');
    expect(result).toBeNull();
  });
});

describe('localizeTool', () => {
  it('applies translation to tool object', () => {
    const tool = { id: 'json-formatter', name: 'Original', description: 'Original desc' };
    const result = localizeTool(tool, 'en');
    expect(result.id).toBe('json-formatter');
    expect(typeof result.name).toBe('string');
  });

  it('returns copy of tool when no translation exists', () => {
    const tool = { id: 'nonexistent', name: 'Test', description: 'Desc' };
    const result = localizeTool(tool, 'en');
    expect(result).toEqual(tool);
    expect(result).not.toBe(tool); // should be a copy
  });
});

describe('localizeTools', () => {
  it('localizes an array of tools', () => {
    const tools = [
      { id: 'json-formatter', name: 'JSON', description: 'Format JSON' },
      { id: 'nonexistent', name: 'Test', description: 'Desc' }
    ];
    const result = localizeTools(tools, 'en');
    expect(result).toHaveLength(2);
  });

  it('handles null/empty input', () => {
    expect(localizeTools(null, 'en')).toEqual([]);
    expect(localizeTools([], 'en')).toEqual([]);
  });
});

describe('getLanguageBootstrapScript', () => {
  it('returns a script tag', () => {
    const script = getLanguageBootstrapScript();
    expect(script).toContain('<script');
    expect(script).toContain('data-i18n-bootstrap');
  });

  it('includes supported languages', () => {
    const script = getLanguageBootstrapScript();
    expect(script).toContain('zh-CN');
    expect(script).toContain('zh-TW');
  });
});

describe('getLanguageSelectorHTML', () => {
  it('returns HTML with language options', () => {
    const html = getLanguageSelectorHTML('en');
    expect(html).toContain('data-lang="en"');
    expect(html).toContain('data-lang="ko"');
    expect(html).toContain('aria-haspopup="true"');
  });

  it('marks current language as active', () => {
    const html = getLanguageSelectorHTML('ko');
    expect(html).toContain('font-semibold');
  });
});

describe('quality-tracer translations across all supported languages', () => {
  for (const [lang, catalog] of Object.entries(localeCatalogs)) {
    it(`has quality-tracer name and desc in ${lang}`, () => {
      const qt = catalog.tools?.['quality-tracer'];
      expect(qt).toBeDefined();
      expect(typeof qt.name).toBe('string');
      expect(typeof qt.desc).toBe('string');
      expect(qt.name.length).toBeGreaterThan(0);
      expect(qt.desc.length).toBeGreaterThan(0);
    });

    it(`has quality-tracer ui object in ${lang}`, () => {
      const qt = catalog.tools?.['quality-tracer'];
      expect(qt).toBeDefined();
      expect(typeof qt.ui).toBe('object');
      expect(Object.keys(qt.ui).length).toBeGreaterThan(0);
    });

    it(`has quality-tracer js object with action0 and action6 in ${lang}`, () => {
      const qt = catalog.tools?.['quality-tracer'];
      expect(qt).toBeDefined();
      expect(typeof qt.js).toBe('object');
      expect(typeof qt.js.action0).toBe('string');
      expect(typeof qt.js.action6).toBe('string');
      expect(qt.js.action0.length).toBeGreaterThan(0);
      expect(qt.js.action6.length).toBeGreaterThan(0);
    });
  }
});
