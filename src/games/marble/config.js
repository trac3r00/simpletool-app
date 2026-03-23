export const marbleCatalog = {
  id: 'marble-roulette',
  minParticipants: 2,
  maxParticipants: 10,
  defaultTheme: 'classic-drop',
  defaultWinnerMode: 'first',
  defaultOrdinalTarget: 2
};

export const marbleThemes = {
  'classic-drop': {
    id: 'classic-drop',
    labelKey: 'tools.marble-roulette.ui.themeClassic',
    fallbackLabel: 'Classic Drop',
    pegProfile: {
      rows: 32,
      targetCols: 10,
      spacingXMin: 34,
      spacingXMax: 56,
      spacingYMin: 44,
      spacingYMax: 58,
      jitterX: 2,
      jitterY: 1.5
    },
    board: {
      gravity: 980,
      restitution: 0.62,
      wallRestitution: 0.60,
      linearDamping: 0.08,
      maxSimSeconds: 45
    }
  },
  'arc-sprint': {
    id: 'arc-sprint',
    labelKey: 'tools.marble-roulette.ui.themeArc',
    fallbackLabel: 'Arc Sprint',
    pegProfile: {
      rows: 28,
      targetCols: 9,
      spacingXMin: 36,
      spacingXMax: 60,
      spacingYMin: 46,
      spacingYMax: 62,
      jitterX: 3.5,
      jitterY: 2.5
    },
    board: {
      gravity: 1040,
      restitution: 0.66,
      wallRestitution: 0.58,
      linearDamping: 0.07,
      maxSimSeconds: 40
    }
  },
  'chaos-funnel': {
    id: 'chaos-funnel',
    labelKey: 'tools.marble-roulette.ui.themeChaos',
    fallbackLabel: 'Chaos Funnel',
    pegProfile: {
      rows: 34,
      targetCols: 11,
      spacingXMin: 30,
      spacingXMax: 50,
      spacingYMin: 40,
      spacingYMax: 54,
      jitterX: 5,
      jitterY: 3
    },
    board: {
      gravity: 1120,
      restitution: 0.58,
      wallRestitution: 0.64,
      linearDamping: 0.05,
      maxSimSeconds: 48
    }
  },
  'pinball-madness': {
    id: 'pinball-madness',
    labelKey: 'tools.marble-roulette.ui.themePinball',
    fallbackLabel: 'Pinball Madness',
    isPinball: true,
    pegProfile: {
      rows: 22,
      targetCols: 8,
      spacingXMin: 38,
      spacingXMax: 62,
      spacingYMin: 52,
      spacingYMax: 68,
      jitterX: 3,
      jitterY: 2
    },
    board: {
      gravity: 880,
      restitution: 0.72,
      wallRestitution: 0.70,
      linearDamping: 0.04,
      maxSimSeconds: 55
    }
  }
};

export const marbleWinnerModes = [
  {
    id: 'first',
    labelKey: 'tools.marble-roulette.ui.targetFirst',
    fallbackLabel: 'First to finish'
  },
  {
    id: 'last',
    labelKey: 'tools.marble-roulette.ui.targetLast',
    fallbackLabel: 'Last to finish'
  },
  {
    id: 'ordinal',
    labelKey: 'tools.marble-roulette.ui.targetOrdinal',
    fallbackLabel: 'Nth finisher'
  }
];

export function getMarbleBootConfig() {
  return {
    ...marbleCatalog,
    themes: Object.values(marbleThemes).map((theme) => ({
      id: theme.id,
      labelKey: theme.labelKey,
      fallbackLabel: theme.fallbackLabel,
      pegProfile: { ...theme.pegProfile },
      board: { ...theme.board }
    })),
    winnerModes: marbleWinnerModes.map((mode) => ({ ...mode }))
  };
}
