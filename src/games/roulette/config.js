export const rouletteCatalog = {
  id: 'roulette-wheel',
  storageKey: 'roulette-presets',
  minSegments: 2,
  maxSegments: 20,
  defaultSelectionMode: 'equal',
  defaultTheme: 'classic-neon',
  defaultSoundTheme: 'casino',
  sections: ['segments', 'mode', 'stats', 'presets', 'series', 'tournament'],
  adPolicy: {
    stageSafe: false,
    allowedZones: ['header', 'sidebar', 'bottom']
  }
};

export const rouletteBadgeMeta = [
  {
    id: 'fair',
    textKey: 'tools.roulette-wheel.ui.badge0'
  },
  {
    id: 'client-only',
    textKey: 'tools.roulette-wheel.ui.badge1'
  }
];

export const rouletteSectionMeta = {
  segments: {
    id: 'segments',
    titleKey: 'tools.roulette-wheel.ui.segments-title',
    defaultOpen: true
  },
  mode: {
    id: 'mode',
    titleKey: 'tools.roulette-wheel.ui.modeTitle',
    defaultOpen: false
  },
  stats: {
    id: 'stats',
    titleKey: 'tools.roulette-wheel.ui.stats-title',
    defaultOpen: false
  },
  presets: {
    id: 'presets',
    titleKey: 'tools.roulette-wheel.ui.presets-title',
    defaultOpen: false
  },
  series: {
    id: 'series',
    titleKey: 'tools.roulette-wheel.ui.series-title',
    defaultOpen: false
  },
  tournament: {
    id: 'tournament',
    titleKey: 'tools.roulette-wheel.ui.tournament-title',
    defaultOpen: false
  }
};

export const rouletteThemes = {
  'classic-neon': {
    colorPalette: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#d946ef', '#0ea5e9', '#f43f5e', '#22c55e', '#a855f7', '#fb923c', '#06b6d4', '#e11d48', '#4ade80', '#7c3aed']
  }
};

export const rouletteSoundThemes = {
  casino: {
    id: 'casino',
    labelKey: 'tools.roulette-wheel.ui.soundCasino',
    fallbackLabel: 'Casino',
    tickFreq: [600, 200],
    tickDur: 30,
    tickGain: 0.10,
    winNotes: [523.25, 659.25, 783.99, 1046.5],
    winDur: 150,
    winGain: 0.12,
    winDelay: 80
  },
  arcade: {
    id: 'arcade',
    labelKey: 'tools.roulette-wheel.ui.soundArcade',
    fallbackLabel: 'Arcade',
    tickFreq: [1200, 400],
    tickDur: 15,
    tickGain: 0.08,
    winNotes: [440, 554, 659, 880, 1100],
    winDur: 80,
    winGain: 0.10,
    winDelay: 60
  },
  minimal: {
    id: 'minimal',
    labelKey: 'tools.roulette-wheel.ui.soundMinimal',
    fallbackLabel: 'Minimal',
    tickFreq: [400, 100],
    tickDur: 10,
    tickGain: 0.04,
    winNotes: [523.25, 783.99],
    winDur: 200,
    winGain: 0.06,
    winDelay: 120
  }
};

export const roulettePresets = {
  default_options: {
    labelKey: 'tools.roulette-wheel.ui.presetBuiltinQuick',
    fallbackLabel: 'Quick Decision',
    theme: 'classic-neon',
    featured: true,
    defaultMode: 'equal',
    ops: {
      sponsorEligible: false,
      safeForAds: true
    },
    allowedModes: ['equal', 'weighted'],
    segments: [
      { id: 'option-1', labelKey: 'tools.roulette-wheel.ui.presetOptionOne', fallbackLabel: 'Option 1', weight: 1 },
      { id: 'option-2', labelKey: 'tools.roulette-wheel.ui.presetOptionTwo', fallbackLabel: 'Option 2', weight: 1 },
      { id: 'option-3', labelKey: 'tools.roulette-wheel.ui.presetOptionThree', fallbackLabel: 'Option 3', weight: 1 },
      { id: 'option-4', labelKey: 'tools.roulette-wheel.ui.presetOptionFour', fallbackLabel: 'Option 4', weight: 1 }
    ]
  },
  yes_no_maybe: {
    labelKey: 'tools.roulette-wheel.ui.presetBuiltinYesNo',
    fallbackLabel: 'Yes / No / Maybe',
    theme: 'classic-neon',
    featured: false,
    defaultMode: 'equal',
    ops: {
      sponsorEligible: false,
      safeForAds: true
    },
    allowedModes: ['equal', 'weighted'],
    segments: [
      { id: 'yes', labelKey: 'tools.roulette-wheel.ui.presetOptionYes', fallbackLabel: 'Yes', weight: 1 },
      { id: 'no', labelKey: 'tools.roulette-wheel.ui.presetOptionNo', fallbackLabel: 'No', weight: 1 },
      { id: 'maybe', labelKey: 'tools.roulette-wheel.ui.presetOptionMaybe', fallbackLabel: 'Maybe', weight: 1 }
    ]
  },
  lunch_vote: {
    labelKey: 'tools.roulette-wheel.ui.presetBuiltinLunch',
    fallbackLabel: 'Lunch Vote',
    theme: 'classic-neon',
    featured: true,
    defaultMode: 'weighted',
    ops: {
      sponsorEligible: true,
      safeForAds: true
    },
    allowedModes: ['equal', 'weighted', 'elimination'],
    segments: [
      { id: 'ramen', labelKey: 'tools.roulette-wheel.ui.presetOptionRamen', fallbackLabel: 'Ramen', weight: 2 },
      { id: 'pizza', labelKey: 'tools.roulette-wheel.ui.presetOptionPizza', fallbackLabel: 'Pizza', weight: 2 },
      { id: 'tacos', labelKey: 'tools.roulette-wheel.ui.presetOptionTacos', fallbackLabel: 'Tacos', weight: 1 },
      { id: 'salad', labelKey: 'tools.roulette-wheel.ui.presetOptionSalad', fallbackLabel: 'Salad', weight: 1 }
    ]
  },
  team_shuffle: {
    labelKey: 'tools.roulette-wheel.ui.presetBuiltinTeams',
    fallbackLabel: 'Team Shuffle',
    theme: 'classic-neon',
    featured: false,
    defaultMode: 'equal',
    ops: {
      sponsorEligible: false,
      safeForAds: true
    },
    allowedModes: ['equal', 'weighted', 'elimination'],
    segments: [
      { id: 'team-red', labelKey: 'tools.roulette-wheel.ui.presetOptionTeamRed', fallbackLabel: 'Team Red', weight: 1 },
      { id: 'team-blue', labelKey: 'tools.roulette-wheel.ui.presetOptionTeamBlue', fallbackLabel: 'Team Blue', weight: 1 },
      { id: 'team-green', labelKey: 'tools.roulette-wheel.ui.presetOptionTeamGreen', fallbackLabel: 'Team Green', weight: 1 },
      { id: 'team-gold', labelKey: 'tools.roulette-wheel.ui.presetOptionTeamGold', fallbackLabel: 'Team Gold', weight: 1 }
    ]
  }
};

export const rouletteModes = {
  equal: {
    id: 'equal',
    labelKey: 'tools.roulette-wheel.ui.modeEqual',
    statusKey: 'tools.roulette-wheel.js.modeEqualActive',
    competitive: false
  },
  weighted: {
    id: 'weighted',
    labelKey: 'tools.roulette-wheel.ui.modeWeighted',
    statusKey: 'tools.roulette-wheel.js.modeWeightedActive',
    competitive: false
  },
  progressive: {
    id: 'progressive',
    labelKey: 'tools.roulette-wheel.ui.modeProgressive',
    statusKey: 'tools.roulette-wheel.js.modeProgressiveActive',
    competitive: false
  },
  timed: {
    id: 'timed',
    labelKey: 'tools.roulette-wheel.ui.modeTimed',
    statusKey: 'tools.roulette-wheel.js.modeTimedActive',
    competitive: false
  },
  elimination: {
    id: 'elimination',
    labelKey: 'tools.roulette-wheel.ui.tournament-title',
    statusKey: 'tools.roulette-wheel.ui.tournament-running',
    competitive: true
  }
};

export function getRouletteBootConfig() {
  return {
    colorPalette: rouletteThemes[rouletteCatalog.defaultTheme].colorPalette,
    storageKey: rouletteCatalog.storageKey,
    minSegments: rouletteCatalog.minSegments,
    maxSegments: rouletteCatalog.maxSegments,
    defaultSelectionMode: rouletteCatalog.defaultSelectionMode,
    defaultSoundTheme: rouletteCatalog.defaultSoundTheme,
    sectionOrder: [...rouletteCatalog.sections],
    badges: rouletteBadgeMeta.map((badge) => ({ ...badge })),
    sections: rouletteCatalog.sections.map((id) => ({ ...rouletteSectionMeta[id] })),
    modes: Object.values(rouletteModes).map((mode) => ({ ...mode })),
    soundThemes: Object.values(rouletteSoundThemes).map((st) => ({ ...st })),
    presets: Object.entries(roulettePresets).map(([id, preset]) => ({
      id,
      labelKey: preset.labelKey,
      fallbackLabel: preset.fallbackLabel,
      theme: preset.theme,
      featured: Boolean(preset.featured),
      defaultMode: preset.defaultMode || rouletteCatalog.defaultSelectionMode,
      ops: { ...preset.ops },
      allowedModes: [...preset.allowedModes],
      segments: preset.segments.map((segment) => ({ ...segment }))
    }))
  };
}
