import { describe, expect, it } from "vitest";
import { analyzeOAuthConfig, isLoopbackHost } from "./oauth-debugger-logic.js";

const SEED = Number(process.env.OAUTH_PROPERTY_SEED) || 0x4f417531;

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function keys(config) {
  return analyzeOAuthConfig(config).map((f) => f.key);
}

const SAFE = { responseType: "code", grantType: "authorization_code", hasPkce: true, hasState: true, scope: "profile" };

describe("oauth-debugger-logic (seed " + SEED + ")", () => {
  it("decides loopback from the parsed host, not a string prefix (RFC 8252)", () => {
    for (const host of ["localhost", "127.0.0.1", "127.10.20.30", "[::1]"]) expect(isLoopbackHost(host)).toBe(true);
    for (const host of ["localhost.evil.example", "127.0.0.1.evil.example", "example.com", "128.0.0.1"]) {
      expect(isLoopbackHost(host)).toBe(false);
    }
  });

  it("warns on plain-HTTP redirects to hosts that only look like loopback", () => {
    expect(keys({ ...SAFE, redirectUri: "http://localhost.evil.example/cb" })).toContain("redirectHttp");
    expect(keys({ ...SAFE, redirectUri: "http://127.0.0.1.evil.example/cb" })).toContain("redirectHttp");
    expect(keys({ ...SAFE, redirectUri: "http://127.0.0.1:8080/cb" })).not.toContain("redirectHttp");
    expect(keys({ ...SAFE, redirectUri: "https://localhost:3000/cb" })).toEqual(["noIssues"]);
  });

  it("matches an independent restatement of the rules for random configurations", () => {
    const random = createRandom(SEED);
    const responseTypes = ["code", "token", "id_token", "code id_token", "id_token token"];
    const grants = ["authorization_code", "client_credentials", "refresh_token", "password"];
    const redirects = ["", "https://app.example/cb", "http://app.example/cb", "http://[::1]:9/cb", "app.example/cb", "https://app.example/cb#x", "https://*.example/cb", "com.example.app:/cb"];
    for (let i = 0; i < 400; i++) {
      const config = {
        responseType: responseTypes[Math.floor(random() * responseTypes.length)],
        grantType: grants[Math.floor(random() * grants.length)],
        redirectUri: redirects[Math.floor(random() * redirects.length)],
        scope: random() < 0.5 ? "openid email" : "email",
        hasPkce: random() < 0.5,
        hasState: random() < 0.5,
      };
      const got = new Set(keys(config));
      const hasCode = config.responseType.split(" ").includes("code");
      expect(got.has("implicit")).toBe(!hasCode);
      expect(got.has("noPkce")).toBe(hasCode && !config.hasPkce);
      expect(got.has("passwordGrant")).toBe(config.grantType === "password");
      expect(got.has("noState")).toBe(!config.hasState);
      expect(got.has("oidc")).toBe(config.scope.includes("openid"));
      expect(got.has("redirectHttp")).toBe(config.redirectUri === "http://app.example/cb");
      expect(got.has("redirectNotAbsolute")).toBe(config.redirectUri === "app.example/cb");
      expect(got.has("redirectFragment")).toBe(config.redirectUri.endsWith("#x"));
      expect(got.has("redirectWildcard")).toBe(config.redirectUri.includes("*"));
      const anyOtherRule = !hasCode || (hasCode && !config.hasPkce) || config.grantType !== "authorization_code" ||
        !config.hasState || config.scope.includes("openid") ||
        ["http://app.example/cb", "app.example/cb", "https://app.example/cb#x", "https://*.example/cb"].includes(config.redirectUri);
      expect(got.has("noIssues")).toBe(!anyOtherRule);
    }
  });
});
