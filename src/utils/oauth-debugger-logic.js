// The route inlines this factory into its client script with fn.toString(), so it
// must stay self-contained. A factory keeps the inner names local: the worker
// bundler may rename colliding top-level names.
export function createOAuthLogic() {
  // RFC 8252 §7.3 / §8.3: loopback redirects are http://127.0.0.0/8, [::1] or
  // localhost, decided by the parsed host, never by a string prefix
  // (http://localhost.evil.example is not loopback).
  function isLoopbackHost(hostname) {
    const host = String(hostname || "").toLowerCase();
    if (host === "localhost" || host === "[::1]" || host === "::1") return true;
    return /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
  }

  function analyzeOAuthConfig(config) {
    const responseType = String(config.responseType || "").trim();
    const grantType = String(config.grantType || "").trim();
    const redirectUri = String(config.redirectUri || "").trim();
    const scope = String(config.scope || "").trim();
    const responseParts = responseType.split(/\s+/).filter(Boolean);
    const scopes = scope.split(/\s+/).filter(Boolean);
    const findings = [];
    const add = function (severity, key, text) { findings.push({ severity: severity, key: key, text: text }); };

    if (responseParts.length && responseParts.indexOf("code") === -1) {
      add("critical", "implicit", "Implicit flow is deprecated (OAuth 2.1). Use Authorization Code + PKCE instead (RFC 9700).");
    }
    if (responseParts.indexOf("code") !== -1 && !config.hasPkce) {
      add("critical", "noPkce", "PKCE is required for public clients and recommended for all clients (RFC 7636, OAuth 2.1). Add code_challenge and code_verifier.");
    }
    if (grantType === "password") {
      add("critical", "passwordGrant", "Resource Owner Password Credentials (password grant) is deprecated in OAuth 2.1. Migrate to Authorization Code + PKCE.");
    }

    if (redirectUri) {
      let url = null;
      try { url = new URL(redirectUri); } catch (e) { url = null; }
      if (!url) {
        add("warning", "redirectNotAbsolute", "redirect_uri is not an absolute URI (RFC 6749 §3.1.2). Use the full registered value, e.g. https://app.example.com/callback.");
      } else {
        if (redirectUri.indexOf("#") !== -1) {
          add("warning", "redirectFragment", "redirect_uri must not contain a fragment (#...) (RFC 6749 §3.1.2).");
        }
        if (redirectUri.indexOf("*") !== -1) {
          add("warning", "redirectWildcard", "Wildcard redirect URIs are prohibited in OAuth 2.1. Use exact URI matching.");
        }
        if (url.protocol === "http:" && !isLoopbackHost(url.hostname)) {
          add("warning", "redirectHttp", "redirect_uri uses HTTP on a non-loopback host. Use HTTPS for all non-loopback redirect URIs to prevent code and token interception.");
        }
      }
    }

    if (!config.hasState) {
      add("warning", "noState", "No state parameter. The state parameter is strongly recommended for CSRF protection (RFC 6749 §10.12).");
    }
    if (scopes.indexOf("openid") !== -1) {
      add("info", "oidc", "OpenID Connect flow detected (scope includes \"openid\"). Validate the id_token signature and claims (iss, aud, exp, nonce).");
    }
    if (grantType === "client_credentials") {
      add("info", "clientCredentials", "client_credentials grant is for machine-to-machine flows. No user is involved; store client_secret securely and never expose it client-side.");
    }
    if (grantType === "refresh_token") {
      add("info", "refreshRotation", "Public clients must use refresh token rotation or sender-constrained refresh tokens (OAuth 2.1, RFC 9700 §4.14).");
    }

    if (findings.length === 0) {
      add("info", "noIssues", "No issues detected. Configuration looks good based on the provided inputs.");
    }
    return findings;
  }

  return { isLoopbackHost: isLoopbackHost, analyzeOAuthConfig: analyzeOAuthConfig };
}

export const { isLoopbackHost, analyzeOAuthConfig } = createOAuthLogic();
