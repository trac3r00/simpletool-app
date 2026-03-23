# Roulette Config-Driven Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild `roulette-wheel` around a config-driven contract, competitive mode runtime, and operations-aware UI without breaking existing request-visible i18n behavior.

**Architecture:** Extract roulette logic from the route into separate config, runtime, render, and storage modules. Keep the Worker route thin, make all UI copy config/i18n keyed, and add focused unit + Playwright coverage for contract validity and competitive mode progression.

**Tech Stack:** Cloudflare Worker route templates, vanilla JS, Vitest, Playwright, existing i18n helpers, existing game-utils bundle

---

### Task 1: Create Roulette Module Skeleton

**Files:**
- Create: `src/games/roulette/config.js`
- Create: `src/games/roulette/runtime.js`
- Create: `src/games/roulette/render.js`
- Create: `src/games/roulette/storage.js`
- Modify: `src/routes/roulette-wheel.js`
- Test: `src/games/roulette/roulette-config.test.js`

**Step 1: Write the failing test**

Create `src/games/roulette/roulette-config.test.js` with assertions that exported config modules exist and contain `catalog`, `themes`, `presets`, and `modes`.

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/roulette/roulette-config.test.js`
Expected: FAIL because the module and exports do not exist yet.

**Step 3: Write minimal implementation**

Create the four module files with minimal named exports and update the route so it can import a shell renderer later without changing behavior yet.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/roulette/roulette-config.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/games/roulette src/routes/roulette-wheel.js
git commit -m "Create a roulette module boundary before expanding rules

Constraint: Existing request-visible i18n behavior must stay stable during extraction
Rejected: Add more behavior in-place in the route file | would deepen hardcoded coupling
Confidence: high
Scope-risk: narrow
Directive: Keep the route thin; do not move new rules back into the page shell
Tested: roulette-config unit test
Not-tested: competitive mode flows"
```

### Task 2: Move Contract Data Out of the Route

**Files:**
- Modify: `src/games/roulette/config.js`
- Modify: `src/routes/roulette-wheel.js`
- Modify: `src/utils/i18n.js`
- Test: `src/games/roulette/roulette-config.test.js`

**Step 1: Write the failing test**

Add assertions that presets, layout sections, badges, and mode metadata come from config and that all user-facing labels are translation-key based.

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/roulette/roulette-config.test.js`
Expected: FAIL because the config does not yet contain the expected contract shape.

**Step 3: Write minimal implementation**

Move preset definitions, theme tokens, badge metadata, section order, and mode metadata into `config.js`. Wire the route to consume those exports and extend `i18n.js` with the new key set.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/roulette/roulette-config.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/games/roulette/config.js src/routes/roulette-wheel.js src/utils/i18n.js src/games/roulette/roulette-config.test.js
git commit -m "Move roulette display and operations metadata into config

Constraint: Copy must stay translatable through the existing i18n contract
Rejected: Store raw labels in config | breaks translation coverage and request-visible metadata strategy
Confidence: high
Scope-risk: moderate
Directive: New presets and sections must be added through config, not handwritten DOM fragments
Tested: roulette-config unit test
Not-tested: runtime progression"
```

### Task 3: Introduce Runtime State Machine

**Files:**
- Modify: `src/games/roulette/runtime.js`
- Modify: `src/routes/roulette-wheel.js`
- Test: `src/games/roulette/roulette-runtime.test.js`

**Step 1: Write the failing test**

Create `src/games/roulette/roulette-runtime.test.js` covering state transitions `editing -> ready -> spinning -> roundResult -> completed` for `standard` mode.

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/roulette/roulette-runtime.test.js`
Expected: FAIL because the runtime state machine does not exist yet.

**Step 3: Write minimal implementation**

Implement runtime factories and state transition helpers for `standard`, `weighted`, and `elimination`, then connect the route script to consume runtime snapshots.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/roulette/roulette-runtime.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/games/roulette/runtime.js src/routes/roulette-wheel.js src/games/roulette/roulette-runtime.test.js
git commit -m "Introduce a roulette state machine before competitive modes

Constraint: Existing spin behavior must remain client-side and crypto-random
Rejected: Keep state in ad hoc DOM variables | makes elimination and bracket flows fragile
Confidence: medium
Scope-risk: moderate
Directive: Add new mode logic through runtime transitions, not DOM event branches
Tested: roulette-runtime unit test
Not-tested: Playwright competitive flows"
```

### Task 4: Add Competitive Modes

**Files:**
- Modify: `src/games/roulette/config.js`
- Modify: `src/games/roulette/runtime.js`
- Modify: `src/routes/roulette-wheel.js`
- Test: `src/games/roulette/roulette-runtime.test.js`
- Test: `tests/e2e/roulette-competitive-modes.spec.js`

**Step 1: Write the failing test**

Add unit tests for `bestOfSeries` and `bracket` progression plus a Playwright spec that loads a preset, switches modes, completes rounds, and verifies winner progression.

**Step 2: Run test to verify it fails**

Run:
- `npx vitest run src/games/roulette/roulette-runtime.test.js`
- `npx playwright test tests/e2e/roulette-competitive-modes.spec.js`

Expected: FAIL because series and bracket logic are not implemented yet.

**Step 3: Write minimal implementation**

Implement `bestOfSeries` and `bracket` mode transitions, scoreboards, and result snapshots with config-defined UI metadata.

**Step 4: Run test to verify it passes**

Run:
- `npx vitest run src/games/roulette/roulette-runtime.test.js`
- `npx playwright test tests/e2e/roulette-competitive-modes.spec.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/games/roulette/config.js src/games/roulette/runtime.js src/routes/roulette-wheel.js tests/e2e/roulette-competitive-modes.spec.js src/games/roulette/roulette-runtime.test.js
git commit -m "Add competitive roulette modes on top of the shared runtime

Constraint: Competitive flows must remain understandable on mobile without modal overload
Rejected: Separate per-mode pages | fragments the product and duplicates route logic
Confidence: medium
Scope-risk: broad
Directive: Preserve one mode engine and multiple projections rather than forking page logic per mode
Tested: roulette-runtime unit tests, competitive Playwright flow
Not-tested: extended soak behavior"
```

### Task 5: Refresh the Roulette UI

**Files:**
- Modify: `src/games/roulette/render.js`
- Modify: `src/routes/roulette-wheel.js`
- Modify: `src/utils/i18n.js`
- Test: `tests/e2e/roulette-competitive-modes.spec.js`

**Step 1: Write the failing test**

Extend Playwright coverage to assert stage-first layout, mode-aware panels, result projection, and bracket board visibility for competitive modes.

**Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/roulette-competitive-modes.spec.js`
Expected: FAIL because the new UI projections are not rendered yet.

**Step 3: Write minimal implementation**

Move DOM projection logic into `render.js`, rebuild the section layout from config, and keep the route shell limited to mount + bootstrapping.

**Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/roulette-competitive-modes.spec.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/games/roulette/render.js src/routes/roulette-wheel.js src/utils/i18n.js tests/e2e/roulette-competitive-modes.spec.js
git commit -m "Rebuild roulette around mode-aware stage rendering

Constraint: The UI must stay modern but still work within the existing Worker template system
Rejected: Keep one giant inline template string | prevents config-driven section composition
Confidence: medium
Scope-risk: broad
Directive: Render from config projections; avoid one-off section markup in the route shell
Tested: competitive Playwright flow
Not-tested: visual polish on every viewport"
```

### Task 6: Add Operations Surface and Persistence

**Files:**
- Modify: `src/games/roulette/config.js`
- Modify: `src/games/roulette/storage.js`
- Modify: `src/games/roulette/render.js`
- Modify: `src/routes/roulette-wheel.js`
- Test: `src/games/roulette/roulette-config.test.js`
- Test: `tests/e2e/roulette-competitive-modes.spec.js`

**Step 1: Write the failing test**

Add tests for featured presets, sponsor-safe labels, ad-safe zones, and persisted custom presets.

**Step 2: Run test to verify it fails**

Run:
- `npx vitest run src/games/roulette/roulette-config.test.js`
- `npx playwright test tests/e2e/roulette-competitive-modes.spec.js`

Expected: FAIL because operations metadata and storage behavior are incomplete.

**Step 3: Write minimal implementation**

Implement operations metadata rendering, storage helpers for custom presets, and ad-safe placement gating that stays outside the active game stage.

**Step 4: Run test to verify it passes**

Run:
- `npx vitest run src/games/roulette/roulette-config.test.js`
- `npx playwright test tests/e2e/roulette-competitive-modes.spec.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/games/roulette/config.js src/games/roulette/storage.js src/games/roulette/render.js src/routes/roulette-wheel.js src/games/roulette/roulette-config.test.js tests/e2e/roulette-competitive-modes.spec.js
git commit -m "Make roulette operationally configurable without breaking gameplay

Constraint: Ads and sponsor content must never interrupt active interaction zones
Rejected: Inline ad insertion inside the wheel stage | UX and policy risk
Confidence: high
Scope-risk: moderate
Directive: Keep sponsor and ad surfaces declarative and stage-external
Tested: config unit tests, competitive Playwright flow
Not-tested: production ad serving behavior"
```

### Task 7: Full Regression and Documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/adsense-integration.md`
- Modify: `docs/adsense-rollout-checklist.md`
- Modify: `docs/monetization-content-safety.md`
- Test: `tests/e2e/i18n-seam.spec.js`
- Test: `tests/i18n-verification.spec.js`
- Test: `tests/e2e/roulette-competitive-modes.spec.js`

**Step 1: Write the failing test**

Add or extend any missing regression assertions for request-visible locale metadata and operations-safe UI placement after the route extraction.

**Step 2: Run test to verify it fails**

Run:
- `npx playwright test tests/e2e/i18n-seam.spec.js -g "roulette"`
- `npx playwright test tests/i18n-verification.spec.js -g "Request-Visible Seam Gates"`

Expected: FAIL if extraction regresses metadata or i18n behavior.

**Step 3: Write minimal implementation**

Patch remaining regressions, then update docs to reflect the new config-driven roulette architecture and monetization constraints.

**Step 4: Run test to verify it passes**

Run:
- `npx vitest run src/games/roulette/roulette-config.test.js src/games/roulette/roulette-runtime.test.js`
- `npx playwright test tests/e2e/roulette-competitive-modes.spec.js`
- `npx playwright test tests/e2e/i18n-seam.spec.js`
- `npx playwright test tests/i18n-verification.spec.js -g "Request-Visible Seam Gates"`
- `npm test`

Expected: PASS across unit and focused E2E suites.

**Step 5: Commit**

```bash
git add README.md docs/adsense-integration.md docs/adsense-rollout-checklist.md docs/monetization-content-safety.md tests/e2e/i18n-seam.spec.js tests/i18n-verification.spec.js tests/e2e/roulette-competitive-modes.spec.js src/games/roulette
git commit -m "Lock roulette extraction with i18n and operations regressions covered

Constraint: Existing request-visible locale behavior is already a verified seam and must stay green
Rejected: Defer regression coverage until after UI polish | too risky for a cross-cutting extraction
Confidence: high
Scope-risk: moderate
Directive: Treat request-visible i18n seams as release gates, not best-effort checks
Tested: roulette unit tests, focused Playwright suites, Vitest suite
Not-tested: full end-to-end soak"
```
