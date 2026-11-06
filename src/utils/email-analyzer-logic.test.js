// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createEmailEngine } from "./email-analyzer-logic.js";

const engine = createEmailEngine();

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const ALPHABET = ["a", "Z", "0", " ", "_", "=", "?", "é", "한", "국", "😀", "⚠", "-", "."];
const randomText = (r) => Array.from({ length: 1 + Math.floor(r() * 12) }, () => ALPHABET[Math.floor(r() * ALPHABET.length)]).join("");

// Expected values below were produced by Python's stdlib `email` package
// (email.header.decode_header, email.utils.parseaddr, get_payload(decode=True))
// on the same message.
const PHISH = [
  "Authentication-Results: mx.example.com; spf=softfail smtp.mailfrom=billing@evil-relay.biz; dmarc=fail header.from=paypal.com",
  'From: "service@paypal.com" <attacker@evil-relay.biz>',
  "To: =?UTF-8?B?7ZmN6ri464+Z?= <victim@example.com>",
  "Subject: =?UTF-8?Q?Your_account_is_suspended_=E2=9A=A0?=",
  "MIME-Version: 1.0",
  'Content-Type: multipart/alternative; boundary="b1"',
  "",
  "--b1",
  "Content-Type: text/plain; charset=UTF-8",
  "Content-Transfer-Encoding: base64",
  "",
  Buffer.from("Plain part: https://plain.example.org/pay?x=1&y=2 — 한국어\n").toString("base64"),
  "--b1",
  "Content-Type: text/html; charset=UTF-8",
  "Content-Transfer-Encoding: quoted-printable",
  "",
  '<a href=3D"https://paypal.com.secure-login.example.biz/verify?id=3D1234&amp;x=3Dy">Verify</a>',
  "Or visit http://198.51.100.9/login. Also see https://example.com/a-very-long-path-that-is-wrapped-by-qp-sof=",
  "t-line-breaks/page.html), thanks.",
  "--b1--",
].join("\r\n");

describe("RFC 2047 encoded-words", () => {
  it("decodes B and Q words (matches Python email.header)", () => {
    expect(engine.decodeEncodedWords("=?UTF-8?B?7ZmN6ri464+Z?= <victim@example.com>")).toBe("홍길동 <victim@example.com>");
    expect(engine.decodeEncodedWords("=?UTF-8?Q?Your_account_is_suspended_=E2=9A=A0?=")).toBe("Your account is suspended ⚠");
  });

  it("round-trips random Unicode through B and Q encoding (Buffer / encodeURIComponent as oracle)", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const text = randomText(rng(seed));
      const b = `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
      const q = `=?utf-8?Q?${Array.from(Buffer.from(text, "utf8"), (byte) => "=" + byte.toString(16).toUpperCase().padStart(2, "0")).join("")}?=`;
      expect(engine.decodeEncodedWords(b), `B seed ${seed}`).toBe(text);
      expect(engine.decodeEncodedWords(q), `Q seed ${seed}`).toBe(text);
      expect(engine.decodeEncodedWords(`${b} ${q}`), `adjacent seed ${seed}`).toBe(text + text);
    }
  });
});

describe("message body decoding", () => {
  const parsed = engine.parseEmail(PHISH);
  const urls = engine.extractUrls(engine.decodedBody(parsed));

  it("extracts URLs from base64 and quoted-printable parts, decoded (matches Python get_payload)", () => {
    expect(urls).toEqual([
      "https://plain.example.org/pay?x=1&y=2",
      "https://paypal.com.secure-login.example.biz/verify?id=1234&x=y",
      "http://198.51.100.9/login",
      "https://example.com/a-very-long-path-that-is-wrapped-by-qp-soft-line-breaks/page.html",
    ]);
  });
});

describe("sender identity", () => {
  it("uses the angle-addr, not an address inside the display name (matches Python parseaddr)", () => {
    const from = '"service@paypal.com" <attacker@evil-relay.biz>';
    expect(engine.addressOf(from)).toBe("attacker@evil-relay.biz");
    expect(engine.domainOf(from)).toBe("evil-relay.biz");
    expect(engine.domainOf(engine.displayName(from))).toBe("paypal.com");
  });

  it("treats subdomains as aligned and unrelated domains as not", () => {
    expect(engine.domainsAligned("mailer.example.net", "example.net")).toBe(true);
    expect(engine.domainsAligned("example.net", "bounce.example.net")).toBe(true);
    expect(engine.domainsAligned("gmail.com", "example.net")).toBe(false);
    expect(engine.domainsAligned("notexample.net", "example.net")).toBe(false);
  });
});

describe("URL scoring", () => {
  it("flags punycode in any label, not only the first", () => {
    expect(engine.scoreUrl("https://login.xn--pple-43d.com/").flags).toContain("punycode");
    expect(engine.scoreUrl("https://www.example.com/").flags).toEqual([]);
  });

  it("strips trailing prose punctuation but keeps balanced parentheses", () => {
    expect(engine.extractUrls("See https://en.wikipedia.org/wiki/Foo_(bar). Next www.example.com, ok")).toEqual([
      "https://en.wikipedia.org/wiki/Foo_(bar)",
      "http://www.example.com",
    ]);
  });
});
