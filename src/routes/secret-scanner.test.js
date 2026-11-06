// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createSecretScanner } from "../utils/secret-scanner-logic.js";
import { handleSecretScannerRoutes } from "./secret-scanner.js";

/**
 * Secret Scanner's whole promise is that its "share-safe" output is safe to
 * paste somewhere else. These assertions run the shipped engine (the route
 * inlines createSecretScanner.toString()), so they cannot drift from what
 * users get.
 */

const SOURCE = readFileSync("src/routes/secret-scanner.js", "utf8");
const { PATTERNS, redact } = createSecretScanner();

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
  it("never leaves an AWS secret access key in the share-safe output", () => {
    expect(redact(SAMPLE, false)).not.toContain(AWS_SECRET);
    expect(redact(SAMPLE, true)).not.toContain(AWS_SECRET);
  });

  it("redacts the whole PEM block, not just the BEGIN line", () => {
    expect(redact(SAMPLE, false)).not.toContain(PEM_BODY);
  });

  it("keeps the variable name readable while masking the value", () => {
    expect(redact(SAMPLE, false)).toContain("AWS_SECRET_ACCESS_KEY=");
  });

  it("redacts an unterminated PEM block", () => {
    const truncated = `-----BEGIN PRIVATE KEY-----\n${PEM_BODY}\n`;
    expect(redact(truncated, false)).not.toContain(PEM_BODY);
  });

  it("does not flag benign configuration or code", () => {
    const benign = [
      "PASSWORD_MIN_LENGTH=12",
      "TOKEN_EXPIRY_SECONDS=3600",
      "API_KEY_HEADER=X-Api-Key",
      "const secretSauce = computeThing(a, b);",
      "SECRET_NAME=my-app-secret",
      "Use your AWS secret access key from the IAM console.",
      "pip install scikit-learn sk-learn-extra-tooling",
    ];
    for (const line of benign) {
      expect(redact(line, true), `should not redact: ${line}`).toBe(line);
    }
  });

  it("still catches the credentials it always caught", () => {
    const out = redact(SAMPLE, false);
    expect(out).toContain("[REDACTED:aws_access_key_id]");
    for (const [text, id] of [
      ["ghp_" + "a".repeat(36), "github_pat"],
      ["sk_live_" + "a".repeat(24), "stripe_secret"],
      ["Bearer " + "a".repeat(24), "bearer"],
    ]) {
      expect(redact(text, false)).toContain(`[REDACTED:${id}]`);
    }
  });
});

describe("secret scanner page wiring", () => {
  it("inlines the tested engine instead of a private copy", async () => {
    const url = new URL("http://localhost/secret-scanner");
    const res = await handleSecretScannerRoutes(new Request(url), url);
    const html = await res.text();
    expect(html).toContain("function createSecretScanner()");
    expect(SOURCE).not.toContain("const PATTERNS = [");
  });

  it("gives every pattern label/advice an i18n key no other string uses", () => {
    // Regression: four patterns pointed at text23-text26, which are the
    // truncation notice and the High/Medium/Low labels, so the AWS secret
    // finding was titled "Input was large; scanned only the first 250,000 characters."
    const patternKeys = PATTERNS.flatMap((p) => [p.labelKey, p.adviceKey]).filter(Boolean);
    expect(new Set(patternKeys).size).toBe(patternKeys.length);
    const uiKeys = [...SOURCE.matchAll(/\bt\('(text\d+)'/g)].map((m) => m[1]);
    for (const key of patternKeys) expect(uiKeys, key).not.toContain(key);
  });
});
