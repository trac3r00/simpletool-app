import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { buildCurlCommand, shellQuote, signatureCandidates, utf8ByteLength } from "./webhook-logic.js";

function mulberry32(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("shellQuote", () => {
  it("round-trips seeded hostile strings through /bin/sh unchanged", () => {
    const rand = mulberry32(0xbeef);
    const alphabet = ["a", " ", "'", '"', "$", "`", "\\", "!", "*", "$(id)", "${HOME}", "\n", "\t", ";", "|", "&", "é", "🪝", "{}", "%"];
    const samples = [];
    for (let i = 0; i < 200; i++) {
      let s = "";
      const len = Math.floor(rand() * 12);
      for (let j = 0; j < len; j++) s += alphabet[Math.floor(rand() * alphabet.length)];
      samples.push(s);
    }
    const script = samples.map((s) => "printf '%s\\0' " + shellQuote(s)).join("\n");
    const out = execFileSync("/bin/sh", ["-c", script], { encoding: "utf8" });
    expect(out.split("\0").slice(0, -1)).toEqual(samples);
  });
});

describe("buildCurlCommand", () => {
  it("produces a command whose argv matches the request exactly", () => {
    const body = '{"msg":"it\'s $HOME and `id`"}';
    const cmd = buildCurlCommand("POST", "https://hooks.example.com/x?a=1&b=2", { "X-Sig": 'sha256="abc"' }, body);
    const argv = execFileSync("/bin/sh", ["-c", "printargs() { for a; do printf '%s\\0' \"$a\"; done; }; " + cmd.replace(/^curl/, "printargs")], {
      encoding: "utf8",
    })
      .split("\0")
      .slice(0, -1);
    expect(argv).toEqual(["-X", "POST", "https://hooks.example.com/x?a=1&b=2", "-H", 'X-Sig: sha256="abc"', "--data-raw", body]);
  });

  it("omits the body for GET", () => {
    expect(buildCurlCommand("GET", "https://x", {}, "ignored")).toBe("curl -X GET 'https://x'");
  });
});

describe("utf8ByteLength", () => {
  it("counts UTF-8 bytes, not UTF-16 code units", () => {
    expect(utf8ByteLength("abc")).toBe(3);
    expect(utf8ByteLength("é")).toBe(Buffer.byteLength("é"));
    expect(utf8ByteLength("🪝")).toBe(4);
  });
});

describe("signatureCandidates", () => {
  it("returns every Stripe v1 signature and strips scheme prefixes", () => {
    expect(signatureCandidates("stripe-signature", "t=1,v1=aaa,v1=bbb,v0=ccc")).toEqual(["aaa", "bbb"]);
    expect(signatureCandidates("x-hub-signature-256", "sha256=abc")).toEqual(["abc"]);
    expect(signatureCandidates("x-shopify-hmac-sha256", "b64==")).toEqual(["b64=="]);
  });
});
