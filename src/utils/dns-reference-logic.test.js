import { describe, expect, it } from "vitest";
import { domainToASCII } from "node:url";
import { normalizeDnsTarget } from "./dns-reference-logic.js";

describe("normalizeDnsTarget", () => {
  it("converts IDN names to punycode (RFC 3492 / node:url domainToASCII)", () => {
    for (const name of ["bücher.example", "münchen.de", "例え.jp", "EXAMPLE.com"]) {
      expect(normalizeDnsTarget(name).name).toBe(domainToASCII(name));
    }
    expect(normalizeDnsTarget("bücher.example").name).toBe("xn--bcher-kva.example");
  });

  it("keeps IP literals and DNS-only labels", () => {
    expect(normalizeDnsTarget("8.8.8.8").name).toBe("8.8.8.8");
    expect(normalizeDnsTarget("2001:4860:4860::8888").name).toBe("2001:4860:4860::8888");
    expect(normalizeDnsTarget("_dmarc.example.com.").name).toBe("_dmarc.example.com");
    expect(normalizeDnsTarget("").name).toBe("");
  });

  it("refuses anything a shell would interpret", () => {
    for (const bad of ["example.com; rm -rf /", "$(id).example", "a b.com", "`x`.com", "a|b", "a&&b", "ex'ample.com", "a/b"]) {
      expect(normalizeDnsTarget(bad).error, bad).toBeTruthy();
    }
  });
});
