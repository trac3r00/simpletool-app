export function readStoredRoulettePresets(storageLike, storageKey) {
  try {
    const raw = storageLike?.getItem?.(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.presets)) return parsed.presets;
  } catch (_) {
    return [];
  }
  return [];
}

export function writeStoredRoulettePresets(storageLike, storageKey, presets) {
  try {
    storageLike?.setItem?.(storageKey, JSON.stringify({ version: 1, presets }));
    return true;
  } catch (_) {
    return false;
  }
}
