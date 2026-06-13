/**
 * TOOL_ACTIONS — quick-smoke interaction map for game tools.
 *
 * Each entry describes the minimal action to verify a tool works:
 *   action(page)  → performs one user interaction
 *   waitFor(page) → returns a locator/assertion that confirms the tool responded
 */

import { expect } from '@playwright/test';

export const TOOL_ACTIONS = {
  'ladder-game': {
    async action(page) {
      await page.locator('#btn-step-1-next').click();
      await page.locator('[data-step="2"]').waitFor({ state: 'visible', timeout: 5000 });
      await page.locator('#btn-step-2-next').click();
    },
    async waitFor(page) {
      await page.locator('[data-step="3"]').waitFor({ state: 'visible', timeout: 8000 });
      await page.locator('#ladder-canvas').waitFor({ state: 'visible', timeout: 5000 });
    }
  },

  'roulette-wheel': {
    async action(page) {
      await page.locator('#spin-button').click();
    },
    async waitFor(page) {
      await page.waitForFunction(
        () => {
          const el = document.getElementById('result-popup');
          return el && el.classList.contains('show');
        },
        { timeout: 15000 }
      );
    }
  },

  'marble-roulette': {
    async action(page) {
      await page.locator('#mr-start').click();
    },
    async waitFor(page) {
      await page.locator('#mr-result:not(.hidden)').waitFor({ state: 'visible', timeout: 90000 });
    }
  },

  'port-reference': {
    async action(page) {
      await page.locator('#port-search').fill('443');
    },
    async waitFor(page) {
      await expect(page.locator('#results-body')).toContainText('HTTPS');
    }
  },

  'bandwidth-calculator': {
    async action(page) {
      await page.locator('#transfer-size').fill('1');
      await page.locator('#transfer-bandwidth').fill('100');
    },
    async waitFor(page) {
      await expect(page.locator('#transfer-result')).not.toHaveText('--');
    }
  },

  'dns-reference': {
    async action(page) {
      await page.locator('.record-card').first().click();
    },
    async waitFor(page) {
      await expect(page.locator('#detail-panel')).toBeVisible();
    }
  },

  'cidr-calculator': {
    async action(page) {
      await page.locator('#cidr-input').fill('192.168.1.0/24');
      await page.locator('#analyze-btn').click();
    },
    async waitFor(page) {
      await expect(page.locator('#results-panel')).not.toHaveClass(/hidden/);
      await expect(page.locator('#summary-network')).not.toHaveText('—');
    }
  },

  'wireshark-filter': {
    async action(page) {
      await page.locator('[data-filter="http"]').click();
    },
    async waitFor(page) {
      await expect(page.locator('#filter-preview')).toContainText('http');
    }
  },

  'protocol-headers': {
    async action(page) {
      await page.locator('.diagram-field').first().click();
    },
    async waitFor(page) {
      await expect(page.locator('#field-detail')).not.toContainText('Click on any field');
    }
  },

  'wireguard-config': {
    async action(page) {
      await page.locator('#iface-address').fill('10.0.0.1/24');
    },
    async waitFor(page) {
      await expect(page.locator('#config-preview')).toContainText('10.0.0.1/24');
    }
  },

  'public-repos-yml-builder': {
    async action(page) {
      await page.locator('#repo-input').fill('trac3r00/simpletool-app team=maintainers sha=missing branch=protected secrets=ok');
      await page.locator('#build-inventory').click();
    },
    async waitFor(page) {
      await expect(page.locator('#repos-yaml-output')).toHaveValue(/trac3r00\/simpletool-app/);
      await expect(page.locator('#actions-output')).toHaveValue(/Public repos audit/);
      await expect(page.locator('#findings-list')).toContainText('SHA pinning');
    }
  },

  'http-status-reference': {
    async action(page) {
      await page.locator('#status-search').fill('404');
    },
    async waitFor(page) {
      await expect(page.locator('#results-body')).toContainText('Not Found');
    }
  }
};
