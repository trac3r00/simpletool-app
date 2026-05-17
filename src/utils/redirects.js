/**
 * Legacy URL redirects for renamed/migrated tools.
 * Single source of truth for all 301 permanent redirects.
 */

export const LEGACY_REDIRECTS = {
  // PR #8 redirects (consolidated from worker.js inline blocks)
  '/jwt-inspector': '/token-studio',
  '/jwt-decoder': '/token-studio',
  '/jwk-jwks-studio': '/token-studio',
  '/tools/jwt-decoder': '/token-studio',
  '/layered-decoder': '/encoding-workbench',
  '/hash-calculator': '/encoding-workbench',
  '/hash-generator': '/encoding-workbench',
  '/universal-decoder': '/encoding-workbench',
  '/encoder-decoder': '/encoding-workbench',
  // CSS Gradient Generator: filename differs from registered route
  '/css-gradient-generator': '/css-gradient',
  // Other renamed tools
  '/regex-tester': '/regex-visualizer',
  '/lorem-ipsum': '/mock-data-generator',
  '/domain-status': '/dns-reference',
  // Upcoming renames (Tasks 15, 16)
  '/markdown-preview': '/markdown-editor',
  '/caffeniate': '/caffeinate',
  '/wireguard': '/wireguard-config',
  '/mock-data': '/mock-data-generator',
  '/yaml-converter': '/yaml-toml-converter',
};

/**
 * Check if a URL pathname matches a legacy redirect entry.
 * Returns a redirect Response (301) if matched, null otherwise.
 * @param {URL} url
 * @returns {Response|null}
 */
export function tryLegacyRedirect(url) {
  const path = url.pathname;
  const target = LEGACY_REDIRECTS[path];
  if (target) {
    const dest = new URL(target, url.origin);
    return Response.redirect(dest.href, 301);
  }
  return null;
}
