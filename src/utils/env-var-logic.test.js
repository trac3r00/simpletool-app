// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseEnv } from "node:util";
import { createEnvVarEngine } from "./env-var-logic.js";

const engine = createEnvVarEngine();
const values = (text) =>
  Object.fromEntries([...engine.parseDotenv(text).map].map(([k, v]) => [k, v.value]));

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const pick = (r, chars, n) => Array.from({ length: n }, () => chars[Math.floor(r() * chars.length)]).join("");
const WORD = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-./:@";

// Unquoted values avoid "#" because Node and python-dotenv disagree on
// "a#b"; this tool follows python-dotenv there (see the regression below).
function line(r, key) {
  const kind = Math.floor(r() * 5);
  const v = pick(r, WORD, 1 + Math.floor(r() * 20));
  if (kind === 0) return `${key}=${v}`;
  if (kind === 1) return `export ${key}=${v}`;
  if (kind === 2) return `${key}="${v} ${pick(r, WORD, 3)}"`;
  if (kind === 3) return `${key}='${v}'`;
  return `${key}="${v}\n${pick(r, WORD, 5)}"`;
}

describe("parseDotenv agrees with node:util parseEnv", () => {
  it("on 300 seeded documents", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const r = rng(seed);
      const lines = ["# header"];
      const n = 1 + Math.floor(r() * 8);
      for (let i = 0; i < n; i++) {
        lines.push(line(r, "K" + Math.floor(r() * 6)));
        if (r() < 0.2) lines.push("");
      }
      const text = lines.join(r() < 0.5 ? "\n" : "\r\n");
      expect(values(text), `seed ${seed}\n${text}`).toEqual(parseEnv(text));
    }
  });
});

describe("parseDotenv regressions", () => {
  it("reads multiline double-quoted values instead of reporting line 2 as an error", () => {
    const parsed = engine.parseDotenv('MULTI="line1\nline2"\nNEXT=1');
    expect(parsed.errors).toEqual([]);
    expect(parsed.map.get("MULTI").value).toBe("line1\nline2");
    expect(parsed.map.get("NEXT").value).toBe("1");
  });

  it("keeps a # that is not preceded by whitespace (python-dotenv semantics)", () => {
    expect(values("HASH=abc#def\nC=x # note")).toEqual({ HASH: "abc#def", C: "x" });
  });

  it("reports an unterminated quote instead of swallowing silently", () => {
    const parsed = engine.parseDotenv('A="never closed\nB=2');
    expect(parsed.errors.map((e) => e.code)).toEqual(["unterminated"]);
  });
});

describe("masking keeps share-safe output safe", () => {
  it("masks passwords inside connection URLs even when the key looks harmless", () => {
    const url = "postgres://admin:hunter2pass@db.dev:5432/app";
    expect(engine.isSensitive("DATABASE_URL", url)).toBe(true);
    expect(engine.maskValue(url)).toBe("postgres://admin:****@db.dev:5432/app");
  });

  it("treats *_KEY, AUTH_* and similar names as sensitive but not KEYBOARD", () => {
    for (const k of ["MASTER_KEY", "STRIPE_KEY", "KEY", "AUTH_HEADER", "DB_PWD", "JWT_SALT"]) {
      expect(engine.looksSensitiveKey(k), k).toBe(true);
    }
    for (const k of ["KEYBOARD_LAYOUT", "MONKEY_COUNT", "API_URL", "DB_HOST"]) {
      expect(engine.looksSensitiveKey(k), k).toBe(false);
    }
  });
});

describe("keyMatchesFilter", () => {
  it("supports the comma-separated filter the placeholder suggests", () => {
    expect(engine.keyMatchesFilter("AWS_REGION", "aws_, secret")).toBe(true);
    expect(engine.keyMatchesFilter("JWT_SECRET", "AWS_, SECRET")).toBe(true);
    expect(engine.keyMatchesFilter("DB_HOST", "AWS_, SECRET")).toBe(false);
    expect(engine.keyMatchesFilter("DB_HOST", "  ")).toBe(true);
  });
});
