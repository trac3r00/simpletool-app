/**
 * Legacy URL redirects for renamed/migrated tools.
 * Single source of truth for all 301 permanent redirects.
 */

export const LEGACY_REDIRECTS = {
  // PR #8 redirects (consolidated from worker.js inline blocks)
  "/jwt-inspector": "/token-studio",
  "/jwt-decoder": "/token-studio",
  "/jwk-jwks-studio": "/token-studio",
  "/tools/jwt-decoder": "/token-studio",
  "/layered-decoder": "/encoding-workbench",
  "/hash-calculator": "/encoding-workbench",
  "/hash-generator": "/encoding-workbench",
  "/universal-decoder": "/encoding-workbench",
  "/encoder-decoder": "/encoding-workbench",
  // CSS Gradient Generator: filename differs from registered route
  "/css-gradient-generator": "/css-gradient",
  // Other renamed tools
  "/regex-tester": "/regex-visualizer",
  "/lorem-ipsum": "/mock-data-generator",
  // Network Reference merge (Track A): preserve the former tool as a tab target.
  "/dns-reference": "/network-reference?tab=dns",
  "/port-reference": "/network-reference?tab=ports",
  "/http-status-reference": "/network-reference?tab=http",
  "/protocol-headers": "/network-reference?tab=headers",
  "/domain-status": "/network-reference?tab=dns",
  // Repo Operations merge: preserve each former workflow as a tab target.
  "/public-repos-yml-builder": "/repo-ops?tab=inventory",
  "/public-repos-not-automation": "/repo-ops?tab=manual",
  "/review-description-generator": "/repo-ops?tab=review",
  // Upcoming renames (Tasks 15, 16)
  "/markdown-preview": "/markdown-editor",
  "/caffeniate": "/caffeinate",
  "/wireguard": "/wireguard-config",
  "/mock-data": "/mock-data-generator",
  "/yaml-converter": "/yaml-toml-converter",
};

/**
 * Check if a URL pathname matches a legacy redirect entry.
 * Returns a redirect Response (301) if matched, null otherwise.
 * @param {URL} url
 * @returns {Response|null}
 */
export function tryLegacyRedirect(url) {
  const path =
    url.pathname.length > 1 && url.pathname.endsWith("/")
      ? url.pathname.slice(0, -1)
      : url.pathname;
  const target = LEGACY_REDIRECTS[path];
  if (target) {
    const dest = new URL(target, url.origin);
    const targetParams = new Set(dest.searchParams.keys());
    for (const [key, value] of url.searchParams) {
      if (!targetParams.has(key)) dest.searchParams.append(key, value);
    }
    return Response.redirect(dest.href, 301);
  }
  return null;
}
