/**
 * Personalization Utilities
 * Provides localStorage-based favorites and recently used tools tracking
 * Used by common-ui.js and home.js for personalized tool discovery
 */

const RECENT_KEY = 'simpletool-recent';
const FAVORITES_KEY = 'simpletool-favorites';
const MAX_RECENT = 10;

// --- Recently Used Tools ---

/**
 * Add toolId to recent list (max 10, deduped, most recent first).
 * @param {string} toolId
 */
export function trackToolVisit(toolId) {
  if (!toolId) return;
  const current = getRecentTools();
  const deduped = current.filter(id => id !== toolId);
  const updated = [toolId, ...deduped].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch (e) {
    // Safari private browsing or storage full — silently ignore
  }
}

/**
 * Returns array of recently visited tool IDs (most recent first).
 * @returns {string[]}
 */
export function getRecentTools() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Clears recent tools history.
 */
export function clearRecentTools() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch (e) {
    // Silently ignore
  }
}

// --- Favorite Tools ---

/**
 * Toggle favorite status for a tool. Returns the new state.
 * @param {string} toolId
 * @returns {boolean} true if now favorited, false if removed
 */
export function toggleFavorite(toolId) {
  if (!toolId) return false;
  const current = getFavorites();
  const isCurrentlyFavorited = current.includes(toolId);
  const updated = isCurrentlyFavorited
    ? current.filter(id => id !== toolId)
    : [...current, toolId];
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  } catch (e) {
    // Silently ignore
  }
  return !isCurrentlyFavorited;
}

/**
 * Check if a tool is favorited.
 * @param {string} toolId
 * @returns {boolean}
 */
export function isFavorite(toolId) {
  if (!toolId) return false;
  return getFavorites().includes(toolId);
}

/**
 * Returns array of favorited tool IDs.
 * @returns {string[]}
 */
export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Clears all favorites.
 */
export function clearFavorites() {
  try {
    localStorage.removeItem(FAVORITES_KEY);
  } catch (e) {
    // Silently ignore
  }
}

// --- Export / Import ---

/**
 * Returns a JSON string of all preferences for cross-device transfer.
 * @returns {string}
 */
export function exportPreferences() {
  return JSON.stringify({
    recent: getRecentTools(),
    favorites: getFavorites(),
  });
}

/**
 * Imports preferences from a JSON string. Returns true on success, false on failure.
 * @param {string} jsonString
 * @returns {boolean}
 */
export function importPreferences(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (typeof data !== 'object' || data === null) return false;

    if (Array.isArray(data.recent)) {
      localStorage.setItem(RECENT_KEY, JSON.stringify(data.recent.slice(0, MAX_RECENT)));
    }
    if (Array.isArray(data.favorites)) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(data.favorites));
    }
    return true;
  } catch (e) {
    return false;
  }
}

// --- Browser Script Injection ---

/**
 * Returns a self-contained <script> tag string for browser injection.
 * The script tracks the tool visit and manages the favorite toggle button.
 * @param {string} [toolId]
 * @returns {string}
 */
export function getPersonalizationScript(toolId) {
  const toolIdLiteral = toolId ? JSON.stringify(toolId) : 'null';
  return `<script>
(function() {
  'use strict';

  var RECENT_KEY = 'simpletool-recent';
  var FAVORITES_KEY = 'simpletool-favorites';
  var MAX_RECENT = 10;
  var TOOL_ID = ${toolIdLiteral};

  function getRecentTools() {
    try {
      var raw = localStorage.getItem(RECENT_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function trackToolVisit(id) {
    if (!id) return;
    var current = getRecentTools();
    var deduped = current.filter(function(x) { return x !== id; });
    var updated = [id].concat(deduped).slice(0, MAX_RECENT);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch (e) {}
  }

  function getFavorites() {
    try {
      var raw = localStorage.getItem(FAVORITES_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function isFavorite(id) {
    if (!id) return false;
    return getFavorites().indexOf(id) !== -1;
  }

  function toggleFavorite(id) {
    if (!id) return false;
    var current = getFavorites();
    var isCurrentlyFavorited = current.indexOf(id) !== -1;
    var updated = isCurrentlyFavorited
      ? current.filter(function(x) { return x !== id; })
      : current.concat([id]);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (e) {}
    return !isCurrentlyFavorited;
  }

  function updateStarButton(btn, favorited) {
    if (!btn) return;
    btn.setAttribute('aria-pressed', favorited ? 'true' : 'false');
    btn.classList.toggle('is-favorited', favorited);
    var label = btn.querySelector('.favorite-label');
    if (label) {
      label.textContent = favorited ? 'Unfavorite' : 'Favorite';
    }
    var icon = btn.querySelector('.favorite-icon');
    if (icon) {
      icon.textContent = favorited ? '★' : '☆';
    }
  }

  // Track visit on page load
  if (TOOL_ID) {
    trackToolVisit(TOOL_ID);
  }

  // Set up favorite toggle once DOM is ready
  function initFavoriteButton() {
    var btn = document.querySelector('[data-favorite-toggle]');
    if (!btn) return;

    var id = btn.getAttribute('data-favorite-toggle') || TOOL_ID;
    if (!id) return;

    // Set initial state
    updateStarButton(btn, isFavorite(id));

    btn.addEventListener('click', function() {
      var newState = toggleFavorite(id);
      updateStarButton(btn, newState);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFavoriteButton);
  } else {
    initFavoriteButton();
  }
})();
<\/script>`;
}
