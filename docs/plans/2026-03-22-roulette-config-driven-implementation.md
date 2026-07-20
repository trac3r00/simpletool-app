# Roulette Config-Driven Implementation Record

**Date:** 2026-03-22

**Status:** Implemented

This document records the delivered module boundary and verification surface for the Roulette Wheel rebuild. It replaces the original task-by-task implementation plan, whose proposed file names and test commands no longer matched the repository.

## Goal

Move Roulette Wheel configuration, state transitions, rendering helpers, and persistence out of the route while preserving the Cloudflare Worker page model and browser-side execution.

## Delivered architecture

- [`src/games/roulette/config.js`](../../src/games/roulette/config.js) defines catalog metadata, themes, presets, section metadata, badges, and selection modes.
- [`src/games/roulette/runtime.js`](../../src/games/roulette/runtime.js) owns phases, winner selection, round outcomes, statistics labels, series progression, and tournament progression.
- [`src/games/roulette/render.js`](../../src/games/roulette/render.js) exposes mount metadata and transforms configuration into render-ready projections.
- [`src/games/roulette/storage.js`](../../src/games/roulette/storage.js) reads and writes custom presets through the browser storage interface.
- [`src/routes/roulette-wheel.js`](../../src/routes/roulette-wheel.js) renders the page and connects the modules to browser interactions.

## Behavior delivered

- Equal, weighted, progressive, timed, and elimination selection modes.
- Configured themes and built-in presets.
- Multi-spin series with progress reporting.
- Elimination tournaments with ranking output.
- Saved custom presets.
- Statistics and fairness feedback.
- Localized configuration labels.
- Ad-safe operational metadata that keeps monetization outside the active stage.

## Verification coverage

The current test files are:

- [`src/games/roulette/roulette-config.test.js`](../../src/games/roulette/roulette-config.test.js): module exports, serializable boot configuration, translation-key contracts, initial runtime state, render metadata, and storage integration.
- [`src/games/roulette/roulette-runtime.test.js`](../../src/games/roulette/roulette-runtime.test.js): phase flow, weighted selection, fairness labels, elimination, series, and tournament behavior.
- [`src/games/roulette/storage.test.js`](../../src/games/roulette/storage.test.js): persisted preset behavior.
- [`tests/e2e/games.spec.js`](../../tests/e2e/games.spec.js): page loading, segment editing, spinning, statistics, series, tournament, preset, mobile, dark-mode, and smoke flows.

Run the focused checks with:

```bash
bunx vitest run src/games/roulette/roulette-config.test.js src/games/roulette/roulette-runtime.test.js src/games/roulette/storage.test.js
bunx playwright test tests/e2e/games.spec.js --grep "Roulette Wheel"
```

Run the complete project checks with:

```bash
bun run build
bun run test
bun run test:e2e
```

## Operational constraints

- Keep user-visible configuration text behind translation keys.
- Keep game-rule state separate from DOM presentation state.
- Keep ads and sponsorship surfaces outside the active wheel, controls, and result areas.
- Preserve browser-side processing and avoid server-side game state.
- Update the focused unit and browser coverage when modes, presets, progression, or persistence change.
