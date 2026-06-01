import { describe, it, expect } from 'vitest';
import { renderHomePage } from './home.js';
import { t } from '../utils/common-ui.js';

describe('renderHomePage', () => {
  it('uses t() for keywords meta tag and contains no technical-debt marker in rendered head', async () => {
    const response = renderHomePage({ lang: 'en' });
    const html = await response.text();
    const expectedKeywords = t('home.meta.keywords', 'en');
    const marker = ['TO', 'DO'].join('');
    expect(html).toContain(`<meta name="keywords" content="${expectedKeywords}">`);
    expect(html).not.toContain(marker);
  });
});
