import { describe, expect, it } from "vitest";
import { createPasswordLogic } from "./password-generator-logic.js";

const SEED = Number(process.env.PASSWORD_PROPERTY_SEED) || 0x50777331;
const SETS = ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz", "0123456789", "!@#$%^&*()_+-=[]{}|;:,.<>?"];

function createRandomInt(seed) {
  let state = seed >>> 0;
  return (max) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return Math.floor((state / 0x100000000) * max);
  };
}

describe("password-generator-logic (seed " + SEED + ")", () => {
  const logic = createPasswordLogic(createRandomInt(SEED));
  const rand = createRandomInt(SEED + 1);

  it("passwords have the exact length, only allowed characters and every selected set", () => {
    for (let i = 0; i < 500; i++) {
      const sets = SETS.filter(() => rand(2) === 1);
      if (!sets.length) sets.push(SETS[rand(4)]);
      const length = Math.max(sets.length, 8 + rand(121));
      const pw = logic.generatePassword(length, sets);
      expect(pw).toHaveLength(length);
      const allowed = new Set(sets.join(""));
      expect([...pw].every((c) => allowed.has(c))).toBe(true);
      for (const set of sets) expect([...pw].some((c) => set.includes(c))).toBe(true);
    }
    expect(() => logic.generatePassword(16, [])).toThrow("NO_CHARSET");
    expect(() => logic.generatePassword(3, SETS)).toThrow("TOO_SHORT");
  });

  it("usernames honour the length slider and the numbers checkbox for every style", () => {
    for (const style of ["readable", "secure", "color"]) {
      for (const includeNumbers of [true, false]) {
        for (let length = 6; length <= 32; length++) {
          const name = logic.generateUsername(length, style, includeNumbers);
          expect(name, `${style} ${includeNumbers} ${length}`).toHaveLength(length);
          expect(/^[a-z0-9]+$/.test(name)).toBe(true);
          if (!includeNumbers) expect(/\d/.test(name), `${style} ${name}`).toBe(false);
          if (style === "readable" && includeNumbers) expect(/\d\d$/.test(name)).toBe(true);
        }
      }
    }
  });

  it("passphrases have the requested word count and separator", () => {
    for (let words = 3; words <= 8; words++) {
      const phrase = logic.generatePassphrase(words, " ~ ", true, true);
      const parts = phrase.split(" ~ ");
      expect(parts).toHaveLength(words);
      for (const part of parts) expect(part).toMatch(/^[A-Z][a-z]+\d\d$/);
    }
  });

  it("validates catch-all prefixes and domains instead of emitting invalid addresses", () => {
    expect(() => logic.generateCatchAllEmail("My Name@x", "", 12, "random")).toThrow("BAD_PREFIX");
    expect(() => logic.generateCatchAllEmail("", "not a domain", 12, "random")).toThrow("BAD_DOMAIN");
    expect(logic.generateCatchAllEmail("Team.Billing", "@Example.COM", 12, "random")).toBe("team.billing@example.com");
    expect(logic.generateCatchAllEmail("", "例え.jp", 12, "syllable")).toMatch(/^[a-z]{12}@例え\.jp$/);
    for (let len = 6; len <= 20; len++) {
      expect(logic.generateCatchAllEmail("", "", len, "random").split("@")[0]).toHaveLength(len);
    }
  });

  it("plus aliases keep the full local part and domain and reject malformed bases", () => {
    for (const bad of ["", "user@", "@example.com", "a@b@c.com", "user@localhost", "us er@example.com"]) {
      expect(() => logic.generatePlusAddress(bad, 6), bad).toThrow("BAD_EMAIL");
    }
    const alias = logic.generatePlusAddress("first.last+news@mail.example.com", 8);
    expect(alias).toMatch(/^first\.last\+news\+[a-z0-9]{8}@mail\.example\.com$/);
  });
});
