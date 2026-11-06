// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createSecretScanner } from "./secret-scanner-logic.js";

const { scanText, redact } = createSecretScanner();

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ALNUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const UPPER_DIGIT = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const pick = (r, chars, n) => Array.from({ length: n }, () => chars[Math.floor(r() * chars.length)]).join("");

// Each generator returns the full line, the secret substring that must vanish
// from the redacted output, and the id the scanner should report. Formats are
// taken from the issuers' published token layouts, not from the scanner.
const GENERATORS = [
  (r) => { const v = "AKIA" + pick(r, UPPER_DIGIT, 16); return { line: `aws_key = ${v}`, secret: v, id: "aws_access_key_id" }; },
  (r) => { const v = pick(r, ALNUM + "/+", 40); return { line: `AWS_SECRET_ACCESS_KEY=${v}`, secret: v, id: "aws_secret_access_key" }; },
  (r) => { const p = ["ghp_", "gho_", "ghu_", "ghs_", "ghr_"][Math.floor(r() * 5)]; const v = p + pick(r, ALNUM, 36); return { line: `GITHUB_TOKEN=${v}`, secret: v, id: "github_pat" }; },
  (r) => { const v = "sk_" + (r() < 0.5 ? "live" : "test") + "_" + pick(r, ALNUM, 24); return { line: `stripe: "${v}"`, secret: v, id: "stripe_secret" }; },
  (r) => { const v = "xoxb-" + pick(r, "0123456789", 12) + "-" + pick(r, ALNUM, 24); return { line: `slack ${v}`, secret: v, id: "slack_token" }; },
  (r) => { const v = "https://hooks.slack.com/services/T" + pick(r, UPPER_DIGIT, 8) + "/B" + pick(r, UPPER_DIGIT, 8) + "/" + pick(r, ALNUM, 24); return { line: `webhook=${v}`, secret: v, id: "slack_webhook" }; },
  (r) => { const v = "sk-ant-api03-" + pick(r, ALNUM, 40); return { line: `ANTHROPIC=${v}`, secret: v, id: "anthropic_key" }; },
  (r) => { const v = "sk-proj-" + pick(r, ALNUM, 20) + "1" + pick(r, ALNUM, 20); return { line: `key ${v}`, secret: v, id: "openai_key" }; },
  (r) => { const v = "npm_" + pick(r, ALNUM, 36); return { line: `//registry.npmjs.org/:_authToken=${v}`, secret: v, id: "npm_token" }; },
  (r) => { const pw = pick(r, ALNUM, 12); return { line: `DATABASE_URL=postgres://app:${pw}@db.internal:5432/app`, secret: pw, id: "url_credentials" }; },
  (r) => { const v = "AIza" + pick(r, ALNUM, 35); return { line: `maps=${v}`, secret: v, id: "google_api_key" }; },
];

const FILLER = ["INFO request ok", "user=jane", "const x = 1;", "# config", "path=/var/log/app", "한국어 로그 😀"];

describe("secret scanner (seeded property test)", () => {
  it("redacts every generated secret and reports exactly one finding per secret", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const r = rng(seed);
      const planted = [];
      const lines = [];
      for (let i = 0; i < 6; i++) {
        if (r() < 0.5) {
          const g = GENERATORS[Math.floor(r() * GENERATORS.length)](r);
          planted.push({ ...g, lineNo: lines.length + 1 });
          lines.push(g.line);
        } else {
          lines.push(FILLER[Math.floor(r() * FILLER.length)]);
        }
      }
      const text = lines.join("\n");
      const out = redact(text, false);
      const { findings } = scanText(text, false);
      for (const p of planted) {
        expect(out, `seed ${seed}: ${p.id} leaked`).not.toContain(p.secret);
        const onLine = findings.filter((f) => f.line === p.lineNo);
        expect(onLine.map((f) => f.id), `seed ${seed} line ${p.lineNo}`).toEqual([p.id]);
      }
      expect(findings.length, `seed ${seed}`).toBe(planted.length);
    }
  });

  it("leaves filler-only text untouched", () => {
    const text = FILLER.join("\n");
    expect(redact(text, true)).toBe(text);
    expect(scanText(text, true).findings).toEqual([]);
  });
});

describe("secret scanner regressions", () => {
  it("masks only the password of a connection URL", () => {
    expect(redact("postgres://admin:hunter2pass@db.example.com:5432/app", false)).toBe(
      "postgres://admin:[REDACTED:url_credentials]@db.example.com:5432/app",
    );
  });

  it("labels a Bearer JWT once, as the JWT", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    const { findings } = scanText(`Authorization: Bearer ${jwt}`, false);
    expect(findings.map((f) => f.id)).toEqual(["jwt"]);
  });

  it("reports the truncation flag for oversized input", () => {
    const res = scanText("x".repeat(300000), false);
    expect(res.truncated).toBe(true);
  });
});
