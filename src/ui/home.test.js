// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { renderHomePage } from './home.js';
import { t } from '../utils/i18n.js';

describe('renderHomePage', () => {
  it('renders localized meta keywords from i18n data for English', async () => {
    const response = renderHomePage({ lang: 'en' });
    const html = await response.text();
    const expectedKeywords = t('home.meta.keywords', 'en');
    expect(html).toContain(`<meta name="keywords" content="${expectedKeywords}">`);
  });

  it('renders localized meta keywords from i18n data for Korean', async () => {
    const response = renderHomePage({ lang: 'ko' });
    const html = await response.text();
    const expectedKeywords = t('home.meta.keywords', 'ko');
    expect(html).toContain(`<meta name="keywords" content="${expectedKeywords}">`);
  });

  it('renders no technical-debt markers in the HTML', async () => {
    const response = renderHomePage({ lang: 'en' });
    const html = await response.text();
    const markers = ['T' + 'O' + 'D' + 'O', 'F' + 'I' + 'X' + 'M' + 'E'];
    expect(html).not.toMatch(new RegExp(markers.join('|'), 'i'));
  });
});
