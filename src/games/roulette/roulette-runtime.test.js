import { describe, expect, it } from 'vitest';

import {
  advanceRouletteSeries,
  computeRouletteFairnessLabel,
  createRouletteSessionState,
  pickRouletteWinnerIndex,
  resolveRouletteRoundOutcome,
  ROULETTE_PHASES,
  pushRouletteTournamentWinner,
  setRoulettePhase
  ,
  startRouletteSeries,
  startRouletteTournament,
  stopRouletteSeries,
  stopRouletteTournament
} from './runtime.js';

const segments = [
  { id: 'option-1', label: 'Option 1', weight: 5 },
  { id: 'option-2', label: 'Option 2', weight: 1 }
];

describe('roulette runtime', () => {
  it('tracks the basic phase flow from editing to round result', () => {
    let state = createRouletteSessionState({ defaultSelectionMode: 'equal' });
    expect(state.phase).toBe(ROULETTE_PHASES.editing);

    state = setRoulettePhase(state, ROULETTE_PHASES.ready);
    expect(state.phase).toBe(ROULETTE_PHASES.ready);

    state = setRoulettePhase({ ...state, spinning: true }, ROULETTE_PHASES.spinning);
    expect(state.phase).toBe(ROULETTE_PHASES.spinning);

    state = resolveRouletteRoundOutcome({
      state,
      segments,
      winnerIndex: 0,
      mode: 'equal'
    });
    expect(state.phase).toBe(ROULETTE_PHASES.roundResult);
    expect(state.lastWinnerId).toBe('option-1');
  });

  it('uses weights when picking a winner in weighted mode', () => {
    expect(pickRouletteWinnerIndex(segments, 'weighted', 0.01)).toBe(0);
    expect(pickRouletteWinnerIndex(segments, 'weighted', 0.95)).toBe(1);
  });

  it('computes fairness buckets from stats snapshots', () => {
    expect(computeRouletteFairnessLabel(segments, { 'option-1': 8, 'option-2': 2 }, 10, 'weighted')).toBe('Good');
    expect(computeRouletteFairnessLabel(segments, { 'option-1': 10, 'option-2': 0 }, 10, 'equal')).toBe('Uneven');
  });

  it('completes elimination mode when one segment remains', () => {
    const state = createRouletteSessionState({ defaultSelectionMode: 'equal' });
    const outcome = resolveRouletteRoundOutcome({
      state: setRoulettePhase(state, ROULETTE_PHASES.spinning),
      segments,
      winnerIndex: 0,
      mode: 'elimination'
    });

    expect(outcome.phase).toBe(ROULETTE_PHASES.completed);
    expect(outcome.remainingSegmentIds).toEqual(['option-2']);
  });

  it('advances and stops series state through runtime helpers', () => {
    let state = createRouletteSessionState({ defaultSelectionMode: 'equal' });
    state = startRouletteSeries(state, 3);
    expect(state.series.active).toBe(true);
    expect(state.series.remaining).toBe(3);

    state = advanceRouletteSeries(state);
    expect(state.series.remaining).toBe(2);
    expect(state.phase).toBe(ROULETTE_PHASES.roundResult);

    state = stopRouletteSeries(state);
    expect(state.series.active).toBe(false);
    expect(state.phase).toBe(ROULETTE_PHASES.ready);
  });

  it('tracks tournament ranking and completion through runtime helpers', () => {
    let state = createRouletteSessionState({ defaultSelectionMode: 'equal' });
    state = startRouletteTournament(state, segments);
    expect(state.tournament.active).toBe(true);
    expect(state.tournament.originalSegments).toHaveLength(2);

    state = pushRouletteTournamentWinner(state, segments[0], [segments[1]]);
    expect(state.tournament.ranking).toHaveLength(1);
    expect(state.tournament.active).toBe(true);

    state = pushRouletteTournamentWinner(state, segments[1], []);
    expect(state.phase).toBe(ROULETTE_PHASES.completed);
    expect(state.tournament.ranking).toHaveLength(2);

    state = stopRouletteTournament(state);
    expect(state.tournament.active).toBe(false);
    expect(state.phase).toBe(ROULETTE_PHASES.ready);
  });
});
