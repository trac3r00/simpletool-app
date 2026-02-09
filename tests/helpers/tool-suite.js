/**
 * TOOL_ACTIONS — quick-smoke interaction map for game tools.
 *
 * Each entry describes the minimal action to verify a tool works:
 *   action(page)  → performs one user interaction
 *   waitFor(page) → returns a locator/assertion that confirms the tool responded
 */

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
  }
};
