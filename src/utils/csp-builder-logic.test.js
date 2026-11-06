import { describe, expect, it } from "vitest";
import {
  buildCsp,
  cspWarnings,
  formatWarning,
  isReportOnlyHeader,
  parseCsp,
} from "./csp-builder-logic.js";

const SEED = Number(process.env.CSP_PROPERTY_SEED) || 0x43535031;
const NAMES = ["default-src", "script-src", "style-src", "img-src", "worker-src", "report-uri", "upgrade-insecure-requests", "require-trusted-types-for"];
const SOURCES = ["'self'", "'none'", "https://a.example", "*.cdn.example", "data:", "'nonce-abc123'", "'sha256-AAAA'", "/csp-report", "'script'"];

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

function keys(warnings) {
  return warnings.map((w) => w.key);
}

describe("csp-builder-logic (seed " + SEED + ")", () => {
  it("parse(build(entries)) round-trips arbitrary directive lists, order included", () => {
    const random = createRandom(SEED);
    for (let i = 0; i < 300; i++) {
      const names = [...NAMES].sort(() => random() - 0.5).slice(0, 1 + Math.floor(random() * NAMES.length));
      const entries = names.map((name) => {
        const count = Math.floor(random() * 4);
        return [name, Array.from({ length: count }, () => pick(random, SOURCES)).join(" ")];
      });
      const parsed = parseCsp(buildCsp(entries));
      expect(parsed.order).toEqual(names);
      for (const [name, value] of entries) expect(parsed.directives[name]).toBe(value);
      expect(parsed.duplicates).toEqual([]);
    }
  });

  it("keeps the first occurrence of a repeated directive (CSP3 2.2.1) and reports the duplicate", () => {
    const parsed = parseCsp("script-src 'self'; SCRIPT-SRC https://evil.example; img-src *");
    expect(parsed.directives["script-src"]).toBe("'self'");
    expect(parsed.duplicates).toEqual(["script-src"]);
  });

  it("accepts a full header line split over several lines, and value-less directives", () => {
    const input = "Content-Security-Policy-Report-Only: default-src 'self';\n  upgrade-insecure-requests;\n  report-uri /csp";
    const parsed = parseCsp(input);
    expect(isReportOnlyHeader(input)).toBe(true);
    expect(parsed.order).toEqual(["default-src", "upgrade-insecure-requests", "report-uri"]);
    expect(buildCsp(parsed.order.map((n) => [n, parsed.directives[n]]))).toBe(
      "default-src 'self'; upgrade-insecure-requests; report-uri /csp;",
    );
  });

  it("evaluates script/object checks through the default-src fallback", () => {
    expect(keys(cspWarnings({ "default-src": "'self' 'unsafe-inline'" }))).toContain("unsafeInlineFrom");
    const strict = cspWarnings({ "default-src": "'none'", "script-src": "'self'", "base-uri": "'none'", "frame-ancestors": "'none'" });
    expect(keys(strict)).toEqual([]);
  });

  it("does not flag 'unsafe-inline' when a nonce, hash or strict-dynamic makes browsers ignore it", () => {
    expect(keys(cspWarnings({ "script-src": "'unsafe-inline' 'nonce-r4nd'" }))).not.toContain("unsafeInlineFrom");
    expect(keys(cspWarnings({ "script-src": "'unsafe-inline' 'strict-dynamic' 'sha256-x'" }))).not.toContain("unsafeInlineFrom");
  });

  it("flags unquoted keywords, 'none' mixed with sources, loose script sources and placeholders", () => {
    const w = cspWarnings({ "script-src": "self https: 'nonce-{{nonce}}'", "img-src": "'none' https://x.example" });
    expect(keys(w)).toEqual(expect.arrayContaining(["unquotedKeyword", "looseScript", "noneWithOthers", "noncePlaceholder"]));
    const unquoted = w.find((x) => x.key === "unquotedKeyword");
    expect(formatWarning(unquoted, unquoted.text)).toBe(
      "script-src: self must be in single quotes ('self'). Unquoted, the browser treats it as a host name.",
    );
    expect(keys(cspWarnings({ "script-src": "https://*.cdn.example" }))).not.toContain("looseScript");
  });
});
