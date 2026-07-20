# Roulette Config-Driven Design

**Date:** 2026-03-22

**Status:** Implemented. This document records the design decisions behind the current roulette modules.

**Scope:** First rebuild of `roulette-wheel`

## Goal

Separate the UI, rules, presets, and operational concerns previously combined in [`src/routes/roulette-wheel.js`](../../src/routes/roulette-wheel.js). Build the modern interface and competitive mode pack on a config-driven operational contract.

## Decisions

- Prioritize the roulette tool for this rebuild.
- Make operational flexibility the primary value of the first pass.
- Keep configuration in JavaScript modules rather than an external file or API.
- Cover game behavior, UI composition, and operational metadata in the configuration contract.
- Include equal, weighted, progressive, timed, and elimination selection modes, plus multi-spin series and elimination-tournament workflows.

## Selected approach

The design considered expanding the existing route file, separating config/runtime/render modules, and introducing a dedicated engine layer. Separating config, runtime, and rendering offered the appropriate scope for this iteration.

- Expanding the route file would have been faster but would have added more hard-coded behavior.
- A separate engine layer could help over the long term but was broader than this change required.
- Config/runtime/render separation preserves the existing Worker architecture while providing clear boundaries for operations, localization, and UI behavior.

## Architecture

### Contract

Roulette behavior is represented by composable projections rather than one large object:

- `rouletteCatalog`: game identity, feature flags, ad-safe policy, and the default layout reference.
- `rouletteThemes`: color tokens, stage treatment, badge style, result-card style, and motion intensity.
- `roulettePresets`: segments, default weights, recommended mode, featured state, and operational tags.
- `rouletteModes`: rule definitions and UI metadata for equal, weighted, progressive, timed, and elimination selection modes.

All user-visible configuration strings use translation keys instead of raw text.

### Runtime

The runtime separates these states:

- `editing`
- `ready`
- `spinning`
- `roundResult`
- `seriesProgress`
- `tournamentProgress`
- `completed`

Game-rule state and presentation state remain separate. The mode runtime produces a snapshot, and the UI renders that snapshot.

### Rendering

The route owns the page shell and mount point. Rendering is divided into stage and panel projections:

- hero
- stage
- mode panel
- preset panel
- statistics panel
- series panel
- tournament panel

Section order, featured presets, sponsor-safe labels, and ad-safe placement are controlled through configuration.

## Files

- [`src/routes/roulette-wheel.js`](../../src/routes/roulette-wheel.js): page shell and runtime initialization.
- [`src/games/roulette/config.js`](../../src/games/roulette/config.js): catalog, themes, presets, modes, and operational metadata.
- [`src/games/roulette/runtime.js`](../../src/games/roulette/runtime.js): state transitions and mode behavior.
- [`src/games/roulette/render.js`](../../src/games/roulette/render.js): DOM projections.
- [`src/games/roulette/storage.js`](../../src/games/roulette/storage.js): persisted custom presets and state helpers.
- [`src/games/roulette/roulette-config.test.js`](../../src/games/roulette/roulette-config.test.js): configuration contract tests.
- [`src/games/roulette/roulette-runtime.test.js`](../../src/games/roulette/roulette-runtime.test.js): mode progression tests.
- [`src/games/roulette/storage.test.js`](../../src/games/roulette/storage.test.js): persistence tests.
- [`tests/e2e/games.spec.js`](../../tests/e2e/games.spec.js): browser-level game coverage.

## Delivered scope

- Configurable presets, themes, badges, and section order.
- Equal, weighted, progressive, timed, and elimination selection modes.
- Multi-spin series and elimination-tournament workflows.
- Stage-focused UI composition.
- Translation-key-based labels.
- An ad-safe placement contract.

## Risks addressed

- The route previously carried too many responsibilities.
- Series and tournament progression required explicit state transitions to keep replay and statistics behavior consistent.
- Raw configuration labels would have bypassed the global localization contract.
- Ads inside the active game stage would create user-experience and policy risks.

## Non-goals

- External CMS or API management for presets.
- A physics engine comparable to Marble Roulette.
- Full migration of legal, blog, and FAQ content to a new translation system.

## Verification

```bash
bunx vitest run src/games/roulette/roulette-config.test.js src/games/roulette/roulette-runtime.test.js src/games/roulette/storage.test.js
bunx playwright test tests/e2e/games.spec.js
```
