// @vitest-environment node
import { describe, it, expect } from "vitest";
import { handleLogMaskerRoutes } from "./log-masker.js";
import { createLogMasker } from "../utils/log-masker-logic.js";

const { redact } = createLogMasker();

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe("log-masker email", () => {
  it("masks normal and mixed-case addresses", () => {
    expect(redact("contact user@example.com now")).toBe("contact [EMAIL_REDACTED] now");
    expect(redact("Contact User@Example.CoM for info")).toBe("Contact [EMAIL_REDACTED] for info");
  });

  it("does not treat a pipe as part of the TLD", () => {
    expect(redact("user@example.c|om")).toBe("user@example.c|om");
    expect(redact("user@example.c|o|m")).toBe("user@example.c|o|m");
  });

  it("masks internationalised addresses", () => {
    expect(redact("email=홍길동@example.com")).toBe("email=[EMAIL_REDACTED]");
  });
});

describe("log-masker numbers", () => {
  it("masks Luhn-valid cards of every common length and leaves invalid ones", () => {
    // Issuer-published test PANs (Visa, Mastercard, Amex 15, Discover).
    for (const pan of ["4111 1111 1111 1111", "5555-5555-5555-4444", "3782 822463 10005", "6011111111111117"]) {
      expect(redact(`card=${pan} ok`), pan).toBe("card=[CARD_REDACTED] ok");
    }
    expect(redact("card=4111 1111 1111 1112 ok", { phone: false })).toBe("card=4111 1111 1111 1112 ok");
  });

  it("never masks bare digit runs such as epoch seconds as phone numbers", () => {
    const r = rng(42);
    for (let i = 0; i < 300; i++) {
      const n = String(1_000_000_000 + Math.floor(r() * 8_999_999_999)).slice(0, 10);
      expect(redact(`ts=${n} duration_ms=${n}`), n).toBe(`ts=${n} duration_ms=${n}`);
    }
  });

  it("masks formatted phone numbers", () => {
    for (const p of ["(415) 555-2671", "415-555-2671", "+1 415-555-2671", "+14155552671", "415.555.2671"]) {
      expect(redact(`phone=${p}`), p).toBe("phone=[PHONE_REDACTED]");
    }
  });

  it("honours every toggle, including SSN and phone", () => {
    const line = "a@b.io 10.0.0.1 2001:db8::1 4111111111111111 123-45-6789 (415) 555-2671";
    expect(
      redact(line, { email: false, ip: false, creditCard: false, ssn: false, phone: false }),
    ).toBe(line);
  });

  it("masks IPv4 and IPv6 but not invalid octets or clock times", () => {
    expect(redact("from 203.0.113.7 and 2001:db8::1 at 10:00:00")).toBe(
      "from [IP_REDACTED] and [IP_REDACTED] at 10:00:00",
    );
    expect(redact("v999.1.1.1 std::move")).toBe("v999.1.1.1 std::move");
  });
});

describe("log-masker custom keywords", () => {
  it("masks the value of a keyword assignment, keeping the key", () => {
    const out = redact('api_key=sk_live_abc token: "eyJabc.def" secret = s3cr3t', {
      keywords: ["api_key", "token", "secret"],
    });
    expect(out).toBe('api_key=[REDACTED] token: "[REDACTED]" secret = [REDACTED]');
  });

  it("treats keywords literally, so regex syntax cannot throw", () => {
    expect(redact("project a(b) here", { keywords: ["a(b", "[x"] })).toBe("project [REDACTED]) here");
  });
});

describe("log-masker page", () => {
  it("inlines the tested engine", async () => {
    const url = new URL("http://localhost/log-masker");
    const response = await handleLogMaskerRoutes(new Request(url), url);
    const text = await response.text();
    expect(text).toContain("function createLogMasker()");
    expect(text).toContain('id="mask-ssn"');
    expect(text).toContain('id="mask-phone"');
  });
});
