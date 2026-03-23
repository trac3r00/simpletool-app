import { getRouletteBootConfig } from './config.js';

export function getRouletteMountMeta() {
  return {
    stageId: 'wheel-stage',
    canvasId: 'wheel-canvas',
    resultPopupId: 'result-popup'
  };
}

export function getRouletteSectionOrder(bootConfig = {}) {
  return Array.isArray(bootConfig.sectionOrder) ? [...bootConfig.sectionOrder] : [];
}

export function buildRouletteToolBadges(lang, translate) {
  const bootConfig = getRouletteBootConfig();
  return (bootConfig.badges || []).map((badge) => ({
    text: `<span data-i18n="${badge.textKey}">${translate(badge.textKey, lang)}</span>`
  }));
}
