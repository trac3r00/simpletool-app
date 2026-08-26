// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Secret Scanner's whole promise is that its "share-safe" output is safe to
 * paste somewhere else. Two gaps broke that promise:
 *
 *  1. There was no AWS secret-access-key pattern at all, and the only
 *     assignment pattern required QUOTES (`key: "value"`) plus `low` severity —
 *     so `AWS_SECRET_ACCESS_KEY=wJalr...` was neither detected nor masked and
 *     passed through verbatim.
 *  2. `private_key` matched only `-----BEGIN … PRIVATE KEY-----`, so the base64
 *     body of the key survived into the redacted output.
 *
 * Both produced a redacted-looking result that still contained the credential —
 * the worst failure mode this tool has. These assertions run the SHIPPED
 * patterns, extracted from the route, so they cannot drift from what users get.
 */

const SOURCE = readFileSync("src/routes/secret-scanner.js", "utf8");

/** Extracts the real PATTERNS array out of the inline client script. */
function loadPatterns() {
  const start = SOURCE.indexOf("const PATTERNS = [");
  expect(start, "PATTERNS array should exist").toBeGreaterThan(-1);
  const close = /^[\t ]*\];[\t ]*$/m.exec(SOURCE.slice(start));
  const body = SOURCE.slice(start, start + close.index + close[0].length)
    // the route wraps labels in t('key', 'English'); collapse to the literal
    .replace(/t\((['"][^'"]*['"]),\s*(['"])((?:[^'\\]|\\.)*)\2\)/g, (_m, _k, _q, text) =>
      JSON.stringify(text),
    );
  // eslint-disable-next-line no-eval
  return eval(`(function(){${body}; return PATTERNS;})()`);
}

/** Mirrors the shipped redact(), including redactGroup handling. */
function redact(patterns, text, includeLow) {
  let out = String(text ?? "");
  const active = includeLow
    ? patterns
    : patterns.filter((p) => p.severity !== "low");
  for (const p of active) {
    const flags = p.re.flags.includes("g") ? p.re.flags : p.re.flags + "g";
    out = out.replace(new RegExp(p.re.source, flags), function (m) {
      if (!p.redactGroup) return `[REDACTED:${p.id}]`;
      const groups = Array.prototype.slice.call(arguments, 1, -2);
      const value = groups[p.redactGroup - 1];
      if (!value) return `[REDACTED:${p.id}]`;
      const at = m.lastIndexOf(value);
      return m.slice(0, at) + `[REDACTED:${p.id}]` + m.slice(at + value.length);
    });
  }
  return out;
}

const AWS_SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
const PEM_BODY = "MIIEowIBAAKCAQEA3Tz2mr7SZiAMfQyuvBjM9OiJjRazXBZ1BjP5CE/Wm/Rr500P";

const SAMPLE = [
  "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE",
  `AWS_SECRET_ACCESS_KEY=${AWS_SECRET}`,
  "-----BEGIN RSA PRIVATE KEY-----",
  PEM_BODY,
  "-----END RSA PRIVATE KEY-----",
].join("\n");

describe("secret scanner redaction", () => {
  const patterns = loadPatterns();

  it("never leaves an AWS secret access key in the share-safe output", () => {
    // Default severity filter — the leak must not depend on "include low".
    expect(redact(patterns, SAMPLE, false)).not.toContain(AWS_SECRET);
    expect(redact(patterns, SAMPLE, true)).not.toContain(AWS_SECRET);
  });

  it("redacts the whole PEM block, not just the BEGIN line", () => {
    expect(redact(patterns, SAMPLE, false)).not.toContain(PEM_BODY);
  });

  it("keeps the variable name readable while masking the value", () => {
    // A fully blanked line is harder to review than a labelled redaction.
    expect(redact(patterns, SAMPLE, false)).toContain("AWS_SECRET_ACCESS_KEY=");
  });

  it("redacts an unterminated PEM block", () => {
    const truncated = `-----BEGIN PRIVATE KEY-----\n${PEM_BODY}\n`;
    expect(redact(patterns, truncated, false)).not.toContain(PEM_BODY);
  });

  it("does not flag benign configuration or code", () => {
    const benign = [
      "PASSWORD_MIN_LENGTH=12",
      "TOKEN_EXPIRY_SECONDS=3600",
      "API_KEY_HEADER=X-Api-Key",
      "const secretSauce = computeThing(a, b);",
      "SECRET_NAME=my-app-secret",
      "Use your AWS secret access key from the IAM console.",
    ];
    for (const line of benign) {
      expect(redact(patterns, line, true), `should not redact: ${line}`).toBe(line);
    }
  });

  it("still catches the credentials it always caught", () => {
    const out = redact(patterns, SAMPLE, false);
    expect(out).toContain("[REDACTED:aws_access_key_id]");
    for (const [text, id] of [
      ["ghp_" + "a".repeat(36), "github_pat"],
      ["sk_live_" + "a".repeat(24), "stripe_secret"],
      ["Bearer " + "a".repeat(24), "bearer"],
    ]) {
      expect(redact(patterns, text, false)).toContain(`[REDACTED:${id}]`);
    }
  });
});
