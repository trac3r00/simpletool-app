export const ROULETTE_PHASES = {
  editing: 'editing',
  ready: 'ready',
  spinning: 'spinning',
  roundResult: 'roundResult',
  completed: 'completed'
};

export function createRouletteSessionState(bootConfig = {}) {
  return {
    phase: ROULETTE_PHASES.editing,
    segments: [],
    rotation: 0,
    spinning: false,
    winnerIndex: null,
    canvasSize: 0,
    dpr: 1,
    audio: { enabled: false, ctx: null },
    selectionMode: bootConfig.defaultSelectionMode || 'equal',
    stats: { total: 0, counts: {}, history: [] },
    series: { active: false, remaining: 0, total: 0 },
    tournament: { active: false, ranking: [], originalSegments: null },
    confetti: [],
    confettiRaf: null,
    spinRaf: null
  };
}

export function normalizeRouletteMode(mode) {
  return mode === 'weighted' ? 'weighted' : 'equal';
}

export function segmentWeight(segment) {
  const raw = Number(segment && segment.weight);
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

export function pickRouletteWinnerIndex(segments, selectionMode, randomUnit = 0) {
  if (!Array.isArray(segments) || segments.length === 0) return 0;
  const normalizedMode = selectionMode === 'weighted' ? 'weighted' : 'equal';
  const getWeight = (segment) => {
    const raw = Number(segment && segment.weight);
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  };
  if (normalizedMode !== 'weighted') {
    return Math.min(segments.length - 1, Math.floor(Math.max(0, Math.min(0.999999, randomUnit)) * segments.length));
  }

  const total = segments.reduce((sum, segment) => sum + getWeight(segment), 0);
  if (total <= 0) {
    return Math.min(segments.length - 1, Math.floor(Math.max(0, Math.min(0.999999, randomUnit)) * segments.length));
  }

  let cursor = Math.max(0, Math.min(0.999999, randomUnit)) * total;
  for (let index = 0; index < segments.length; index += 1) {
    cursor -= getWeight(segments[index]);
    if (cursor <= 0) return index;
  }
  return segments.length - 1;
}

export function computeRouletteFairnessLabel(segments, counts, total, selectionMode) {
  if (!Array.isArray(segments) || segments.length < 2 || total < 10) return '—';

  const normalizedMode = selectionMode === 'weighted' ? 'weighted' : 'equal';
  const getWeight = (segment) => {
    const raw = Number(segment && segment.weight);
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  };
  const totalWeight = segments.reduce((sum, segment) => sum + getWeight(segment), 0);
  let maxDeviation = 0;

  for (const segment of segments) {
    const actual = (((counts && counts[segment.id]) || 0) / total) * 100;
    const expected = normalizedMode === 'weighted' && totalWeight > 0
      ? (getWeight(segment) / totalWeight) * 100
      : 100 / segments.length;
    maxDeviation = Math.max(maxDeviation, Math.abs(actual - expected));
  }

  if (maxDeviation < 5) return 'Good';
  if (maxDeviation < 10) return 'Fair';
  return 'Uneven';
}

export function setRoulettePhase(state, phase) {
  return {
    ...state,
    phase
  };
}

export function startRouletteSeries(state, total) {
  const rounds = Math.max(1, Number(total) || 1);
  return {
    ...state,
    phase: ROULETTE_PHASES.ready,
    series: {
      ...state.series,
      active: true,
      total: rounds,
      remaining: rounds
    }
  };
}

export function advanceRouletteSeries(state) {
  const remaining = Math.max(0, (state.series?.remaining || 0) - 1);
  const active = remaining > 0;
  return {
    ...state,
    phase: active ? ROULETTE_PHASES.roundResult : ROULETTE_PHASES.completed,
    series: {
      ...state.series,
      active,
      remaining
    }
  };
}

export function stopRouletteSeries(state) {
  return {
    ...state,
    phase: ROULETTE_PHASES.ready,
    series: {
      ...state.series,
      active: false
    }
  };
}

export function startRouletteTournament(state, segments) {
  return {
    ...state,
    phase: ROULETTE_PHASES.ready,
    tournament: {
      active: true,
      ranking: [],
      originalSegments: Array.isArray(segments) ? segments.map((segment) => ({ ...segment })) : []
    }
  };
}

export function pushRouletteTournamentWinner(state, winner, remainingSegments) {
  const ranking = [...(state.tournament?.ranking || [])];
  if (winner) ranking.push({ ...winner });
  const active = Array.isArray(remainingSegments) ? remainingSegments.length > 0 : false;
  return {
    ...state,
    phase: active ? ROULETTE_PHASES.roundResult : ROULETTE_PHASES.completed,
    tournament: {
      ...state.tournament,
      active,
      ranking
    }
  };
}

export function stopRouletteTournament(state) {
  return {
    ...state,
    phase: ROULETTE_PHASES.ready,
    tournament: {
      ...state.tournament,
      active: false
    }
  };
}

export function resolveRouletteRoundOutcome({ state, segments, winnerIndex, mode }) {
  const nextMode = mode || state.selectionMode;
  const winner = Array.isArray(segments) ? segments[winnerIndex] : null;
  const nextSegments = nextMode === 'elimination'
    ? (segments || []).filter((_, index) => index !== winnerIndex)
    : (segments || []);
  const nextPhase = nextMode === 'elimination' && nextSegments.length <= 1
    ? ROULETTE_PHASES.completed
    : ROULETTE_PHASES.roundResult;

  return {
    ...state,
    phase: nextPhase,
    spinning: false,
    winnerIndex,
    lastWinnerId: winner?.id || null,
    remainingSegmentIds: nextSegments.map((segment) => segment.id)
  };
}
