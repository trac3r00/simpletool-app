import { test, expect } from '@playwright/test';
import { TOOL_ACTIONS } from '../helpers/tool-suite.js';

// ---------------------------------------------------------------------------
// Ladder Game — 3-step wizard flow
// ---------------------------------------------------------------------------
test.describe('Ladder Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ladder-game', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('page loads with step 1 visible and correct title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Ladder Game');
    await expect(page.locator('[data-step="1"]')).toBeVisible();
    await expect(page.locator('[data-step="2"]')).toBeHidden();
    await expect(page.locator('[data-step="3"]')).toBeHidden();
  });

  test('step 1: player count defaults to 4 with increment/decrement', async ({ page }) => {
    const countInput = page.locator('#player-count');
    await expect(countInput).toHaveValue('4');

    // Increment
    await page.locator('#increment-count').click();
    await expect(countInput).toHaveValue('5');

    // Decrement
    await page.locator('#decrement-count').click();
    await expect(countInput).toHaveValue('4');

    // Decrement below min (2)
    await page.locator('#decrement-count').click();
    await page.locator('#decrement-count').click();
    await expect(countInput).toHaveValue('2');
    await page.locator('#decrement-count').click();
    await expect(countInput).toHaveValue('2'); // stays at 2
  });

  test('wizard flow: step 1 → step 2 → step 3', async ({ page }) => {
    // Step 1: click Start
    await page.locator('#btn-step-1-next').click();

    // Step 2 should be visible
    await expect(page.locator('[data-step="1"]')).toBeHidden();
    await expect(page.locator('[data-step="2"]')).toBeVisible();

    // Verify player name inputs exist (4 default)
    const playerInputs = page.locator('#players-container .player-name-input');
    await expect(playerInputs).toHaveCount(4);

    // Verify result inputs exist (4 default)
    const resultInputs = page.locator('#results-container .result-input');
    await expect(resultInputs).toHaveCount(4);

    // Step 2: click Start Ladder
    await page.locator('#btn-step-2-next').click();

    // Step 3 should be visible
    await expect(page.locator('[data-step="2"]')).toBeHidden();
    await expect(page.locator('[data-step="3"]')).toBeVisible();

    // Canvas should be visible
    await expect(page.locator('#ladder-canvas')).toBeVisible();
  });

  test('step 2: back button returns to step 1', async ({ page }) => {
    await page.locator('#btn-step-1-next').click();
    await expect(page.locator('[data-step="2"]')).toBeVisible();

    await page.locator('#btn-step-2-back').click();
    await expect(page.locator('[data-step="1"]')).toBeVisible();
    await expect(page.locator('[data-step="2"]')).toBeHidden();
  });

  test('step 2: preset select populates result inputs', async ({ page }) => {
    await page.locator('#btn-step-1-next').click();
    await expect(page.locator('[data-step="2"]')).toBeVisible();

    // Select coffee preset
    await page.locator('#preset-select').selectOption('coffee');

    // First result input should contain preset value
    const firstResult = page.locator('#results-container .result-input').first();
    const value = await firstResult.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('step 3: player buttons and result buttons are clickable', async ({ page }) => {
    // Navigate to step 3
    await page.locator('#btn-step-1-next').click();
    await page.locator('#btn-step-2-next').click();
    await expect(page.locator('[data-step="3"]')).toBeVisible();

    // Player buttons should exist
    const playerBtns = page.locator('[data-player-index]');
    await expect(playerBtns).toHaveCount(4);

    // Result buttons should exist
    const resultBtns = page.locator('[data-result-index]');
    await expect(resultBtns).toHaveCount(4);
  });

  test('step 3: click player name traces path', async ({ page }) => {
    test.setTimeout(30000);
    // Navigate to step 3
    await page.locator('#btn-step-1-next').click();
    await page.locator('#btn-step-2-next').click();
    await expect(page.locator('[data-step="3"]')).toBeVisible();

    // Click first player button to trace
    await page.locator('[data-player-index="0"]').click();

    // Wait for trace to complete (status changes to show "→")
    await page.waitForFunction(
      () => {
        const el = document.getElementById('game-status');
        return el && el.textContent.includes('\u2192');
      },
      { timeout: 20000 }
    );

    // First player button should be disabled after trace
    await expect(page.locator('[data-player-index="0"]')).toBeDisabled();
  });

  test('step 3: Reveal All traces all players', async ({ page }) => {
    test.setTimeout(60000);
    // Navigate to step 3
    await page.locator('#btn-step-1-next').click();
    await page.locator('#btn-step-2-next').click();
    await expect(page.locator('[data-step="3"]')).toBeVisible();

    // Click Reveal All
    await page.locator('#btn-reveal-all').click();

    // Wait for results summary to appear
    await page.waitForFunction(
      () => {
        const el = document.getElementById('results-summary');
        return el && !el.classList.contains('hidden');
      },
      { timeout: 45000 }
    );

    // Results summary should contain items
    const resultItems = page.locator('#results-list > div');
    const count = await resultItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('step 3: Play Again returns to step 1', async ({ page }) => {
    test.setTimeout(30000);
    // Navigate to step 3
    await page.locator('#btn-step-1-next').click();
    await page.locator('#btn-step-2-next').click();
    await expect(page.locator('[data-step="3"]')).toBeVisible();

    // Click Play Again
    await page.locator('#btn-play-again').click();

    // Should be back at step 1
    await expect(page.locator('[data-step="1"]')).toBeVisible();
    await expect(page.locator('[data-step="3"]')).toBeHidden();
  });

  test('mobile viewport: wizard renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ladder-game', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();

    // Step 1 should be visible
    await expect(page.locator('[data-step="1"]')).toBeVisible();
    await expect(page.locator('#player-count')).toBeVisible();
    await expect(page.locator('#btn-step-1-next')).toBeVisible();
  });

  test('dark mode: step panels render in dark mode', async ({ page }) => {
    await page.evaluate(() => document.documentElement.classList.add('dark'));

    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(true);
    await expect(page.locator('[data-step="1"]')).toBeVisible();
  });

  test('TOOL_ACTIONS smoke test', async ({ page }) => {
    test.setTimeout(60000);
    const actions = TOOL_ACTIONS['ladder-game'];
    await actions.action(page);
    await actions.waitFor(page);
  });
});

// ---------------------------------------------------------------------------
// Roulette Wheel
// ---------------------------------------------------------------------------
test.describe('Roulette Wheel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/roulette-wheel', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('page loads with wheel canvas and spin button', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Roulette Wheel');
    await expect(page.locator('#wheel-canvas')).toBeAttached();
    await expect(page.locator('#spin-button')).toBeVisible();
  });

  test('shows 4 default segments', async ({ page }) => {
    const segItems = page.locator('#segments-list .rw-segment-item');
    await expect(segItems).toHaveCount(4);

    // First segment should have a label
    const firstInput = page.locator('#segments-list .rw-segment-input').first();
    await expect(firstInput).toHaveValue('Option 1');
  });

  test('spin produces a result popup', async ({ page }) => {
    test.setTimeout(20000);
    await page.locator('#spin-button').click();

    // Wait for result popup to show
    await page.waitForFunction(
      () => {
        const el = document.getElementById('result-popup');
        return el && el.classList.contains('show');
      },
      { timeout: 15000 }
    );

    const resultText = page.locator('#result-text');
    await expect(resultText).not.toBeEmpty();
  });

  test('add segment increases count', async ({ page }) => {
    const before = await page.locator('#segments-list .rw-segment-item').count();

    // Type a new segment name and click add
    await page.locator('#new-segment-input').fill('New Option');
    await page.locator('#add-segment-btn').click();

    const after = await page.locator('#segments-list .rw-segment-item').count();
    expect(after).toBe(before + 1);
  });

  test('remove segment decreases count', async ({ page }) => {
    // First add one to ensure we can remove
    await page.locator('#new-segment-input').fill('Extra');
    await page.locator('#add-segment-btn').click();
    const before = await page.locator('#segments-list .rw-segment-item').count();

    // Click first delete button
    const deleteBtn = page.locator('#segments-list .rw-segment-delete').first();
    await deleteBtn.click();

    const after = await page.locator('#segments-list .rw-segment-item').count();
    expect(after).toBe(before - 1);
  });

  test('stats update after spin', async ({ page }) => {
    test.setTimeout(20000);
    await page.locator('#spin-button').click();

    // Wait for spin to complete
    await page.waitForFunction(
      () => {
        const el = document.getElementById('result-popup');
        return el && el.classList.contains('show');
      },
      { timeout: 15000 }
    );

    const totalSpins = page.locator('#stat-total');
    await expect(totalSpins).not.toHaveText('0');
  });

  test('series mode runs multiple spins', async ({ page }) => {
    test.setTimeout(90000);

    // Open series section
    const seriesSection = page.locator('#series-section');
    if (!(await seriesSection.evaluate(el => el.classList.contains('open')))) {
      await seriesSection.locator('[data-section-toggle]').click();
    }

    // Set count to 3 and start
    const seriesInput = page.locator('#series-count');
    await seriesInput.fill('3');
    await page.locator('#start-series-btn').click();

    // Wait for series to complete
    await page.waitForFunction(
      () => {
        const el = document.getElementById('series-status');
        return el && (el.textContent.includes('complete') || el.textContent.includes('Complete') || el.textContent.includes('3 of 3'));
      },
      { timeout: 80000 }
    );

    const totalSpins = page.locator('#stat-total');
    const count = parseInt(await totalSpins.textContent(), 10);
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('tournament runs elimination spins and populates ranking', async ({ page }) => {
    test.setTimeout(120000);

    // Open tournament section by clicking its header
    await page.locator('#tournament-section [data-section-toggle]').click();
    await page.waitForFunction(
      () => document.getElementById('tournament-section')?.classList.contains('open'),
      { timeout: 5000 }
    );

    await page.locator('#start-tournament-btn').click();

    // Wait for at least one ranking entry to appear
    await page.waitForFunction(
      () => {
        const el = document.getElementById('tournament-ranking');
        return el && el.children.length >= 1;
      },
      { timeout: 100000 }
    );

    const ranking = page.locator('#tournament-ranking');
    await expect(ranking).not.toBeEmpty();
  });

  test('presets can be saved and loaded', async ({ page }) => {
    // Open presets section
    const presetsSection = page.locator('#presets-section');
    if (!(await presetsSection.evaluate(el => el.classList.contains('open')))) {
      await presetsSection.locator('[data-section-toggle]').click();
    }

    await page.locator('#preset-name-input').fill('Test Preset');
    await page.locator('#save-preset-btn').click();

    const presetStatus = page.locator('#preset-status');
    await expect(presetStatus).toContainText('Saved');

    // Preset select should have an option now
    const presetSelect = page.locator('#preset-select');
    const options = presetSelect.locator('option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(1);
  });

  test('mobile viewport: wheel and controls render', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/roulette-wheel', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('#wheel-canvas')).toBeAttached();
    await expect(page.locator('#spin-button')).toBeVisible();
  });

  test('dark mode: wheel stage renders in dark mode', async ({ page }) => {
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await expect(page.locator('#wheel-canvas')).toBeAttached();
    await expect(page.locator('#spin-button')).toBeVisible();
  });

  test('TOOL_ACTIONS smoke test', async ({ page }) => {
    test.setTimeout(20000);
    const actions = TOOL_ACTIONS['roulette-wheel'];
    await actions.action(page);
    await actions.waitFor(page);
  });
});

// ---------------------------------------------------------------------------
// Marble Roulette
// ---------------------------------------------------------------------------
test.describe('Marble Roulette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/marble-roulette', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('page loads with canvas and start button', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Marble Roulette');
    await expect(page.locator('#mr-canvas')).toBeAttached();
    await expect(page.locator('#mr-start')).toBeVisible();
  });

  test('default names textarea has 4 names', async ({ page }) => {
    const namesValue = await page.locator('#mr-names').inputValue();
    const names = namesValue.split('\n').filter(n => n.trim());
    expect(names.length).toBe(4);
    expect(names).toContain('Alice');
    expect(names).toContain('Bob');
  });

  test('start drop runs simulation and shows result', async ({ page }) => {
    test.setTimeout(120000);
    await page.locator('#mr-start').click();

    // Wait for result panel to show
    await page.locator('#mr-result:not(.hidden)').waitFor({ state: 'visible', timeout: 90000 });

    const ranking = page.locator('#mr-ranking');
    await expect(ranking).not.toBeEmpty();
  });

  test('race completes with winner displayed', async ({ page }) => {
    test.setTimeout(120000);
    await page.locator('#mr-start').click();
    await page.locator('#mr-result:not(.hidden)').waitFor({ state: 'visible', timeout: 90000 });

    // Winner inline should show winner name
    const winnerText = await page.locator('#mr-winner-inline').textContent();
    expect(winnerText).not.toBe('—');
    expect(winnerText.length).toBeGreaterThan(1);
  });

  test('winner modal shows and can be closed', async ({ page }) => {
    test.setTimeout(120000);
    await page.locator('#mr-start').click();

    // Wait for winner modal to appear
    await page.waitForFunction(
      () => {
        const modal = document.getElementById('winner-modal');
        return modal && !modal.classList.contains('hidden');
      },
      { timeout: 90000 }
    );

    // Winner name should be visible
    const winnerName = page.locator('#winner-name');
    await expect(winnerName).not.toBeEmpty();

    // Close modal
    await page.locator('#winner-close').click();

    // Modal should be hidden after close animation
    await page.waitForFunction(
      () => {
        const modal = document.getElementById('winner-modal');
        return modal && modal.classList.contains('hidden');
      },
      { timeout: 5000 }
    );
  });

  test('speed controls update speed display', async ({ page }) => {
    await page.locator('#mr-speed-2').click();
    await expect(page.locator('#mr-speed')).toHaveText('2x');
    await expect(page.locator('#mr-speed-2')).toHaveAttribute('aria-pressed', 'true');

    await page.locator('#mr-speed-3').click();
    await expect(page.locator('#mr-speed')).toHaveText('3x');
    await expect(page.locator('#mr-speed-3')).toHaveAttribute('aria-pressed', 'true');

    await page.locator('#mr-speed-1').click();
    await expect(page.locator('#mr-speed')).toHaveText('1x');
  });

  test('reset clears state', async ({ page }) => {
    test.setTimeout(120000);
    await page.locator('#mr-start').click();

    await page.locator('#mr-result:not(.hidden)').waitFor({ state: 'visible', timeout: 90000 });

    // Close winner modal if it blocks interaction
    await page.evaluate(() => {
      const modal = document.getElementById('winner-modal');
      if (modal && !modal.classList.contains('hidden')) {
        document.getElementById('winner-close').click();
      }
    });
    await page.waitForTimeout(400);

    await page.locator('#mr-reset').click();
    await expect(page.locator('#mr-result')).toHaveClass(/hidden/);
  });

  test('remove winner removes name from textarea and starts new drop', async ({ page }) => {
    test.setTimeout(180000);
    await page.locator('#mr-start').click();
    await page.locator('#mr-result:not(.hidden)').waitFor({ state: 'visible', timeout: 90000 });

    const winnerText = await page.locator('#mr-winner-inline').textContent();
    const winnerName = winnerText.replace(/^🏆\s*/, '').trim();

    // Close winner modal first if visible
    await page.evaluate(() => {
      const modal = document.getElementById('winner-modal');
      if (modal && !modal.classList.contains('hidden')) {
        document.getElementById('winner-close').click();
      }
    });
    await page.waitForTimeout(400);

    await page.locator('#mr-remove-winner').click();

    // After remove-winner, the names textarea should not contain the winner
    await page.waitForFunction(
      (name) => {
        const el = document.getElementById('mr-names');
        return el && !el.value.includes(name);
      },
      winnerName,
      { timeout: 10000 }
    );
  });

  test('custom names can be entered', async ({ page }) => {
    await page.locator('#mr-names').fill('Alpha\nBeta\nGamma');

    const namesValue = await page.locator('#mr-names').inputValue();
    expect(namesValue).toContain('Alpha');
    expect(namesValue).toContain('Beta');
    expect(namesValue).toContain('Gamma');
  });

  test('URL params load names and can autostart', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/marble-roulette?names=Foo,Bar,Baz&autostart=true', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();

    const namesValue = await page.locator('#mr-names').inputValue();
    expect(namesValue).toContain('Foo');
    expect(namesValue).toContain('Bar');
    expect(namesValue).toContain('Baz');

    // autostart=true should trigger a drop
    await page.locator('#mr-result:not(.hidden)').waitFor({ state: 'visible', timeout: 90000 });
  });

  test('mobile viewport: canvas and controls render', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/marble-roulette', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('#mr-canvas')).toBeAttached();
    await expect(page.locator('#mr-start')).toBeVisible();
    await expect(page.locator('#mr-names')).toBeVisible();
  });

  test('dark mode: board renders in dark mode', async ({ page }) => {
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await expect(page.locator('#mr-canvas')).toBeAttached();
    await expect(page.locator('#mr-start')).toBeVisible();
  });

  test('TOOL_ACTIONS smoke test', async ({ page }) => {
    test.setTimeout(120000);
    const actions = TOOL_ACTIONS['marble-roulette'];
    await actions.action(page);
    await actions.waitFor(page);
  });
});
