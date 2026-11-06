import { describe, expect, it } from "vitest";
import { isIPv4, isIPv6 } from "node:net";
import {
  classifyIPv4,
  classifyIPv6,
  compressIPv6,
  expandIPv6,
  ipv4UsableLabel,
  isValidIPv4,
} from "./cidr-logic.js";

function mulberry32(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0x5eed);
const pick = (items) => items[Math.floor(rand() * items.length)];

function randomGroup() {
  const kind = rand();
  if (kind < 0.35) return "0";
  const len = 1 + Math.floor(rand() * 4);
  let out = "";
  for (let i = 0; i < len; i++) out += pick("0123456789abcdefABCDEF".split(""));
  return out;
}

function randomCandidate() {
  const groups = Array.from({ length: 8 }, randomGroup);
  const mode = rand();
  if (mode < 0.4) return groups.join(":");
  if (mode < 0.8) {
    const start = Math.floor(rand() * 8);
    const len = 1 + Math.floor(rand() * (8 - start));
    return groups.slice(0, start).join(":") + "::" + groups.slice(start + len).join(":");
  }
  const broken = [
    groups.join(":") + ":1",
    groups.slice(0, 3).join(":") + "::" + groups.slice(4, 6).join(":") + "::1",
    groups.join(":").replace(/^./, "g"),
    "12345::" + groups[0],
    ":" + groups.join(":"),
    groups.slice(0, 6).join(":") + ":1.2.3.4",
    "::ffff:" + [1, 2, 3, Math.floor(rand() * 400)].join("."),
    groups.slice(0, 7).join(":") + ":",
  ];
  return pick(broken);
}

describe("expandIPv6 / compressIPv6", () => {
  it("agrees with node:net validity and WHATWG URL serialization on 3000 seeded inputs", () => {
    let valid = 0;
    for (let i = 0; i < 3000; i++) {
      const candidate = randomCandidate();
      const expanded = expandIPv6(candidate);
      expect(Boolean(expanded), candidate).toBe(isIPv6(candidate));
      if (!expanded) continue;
      valid++;
      expect(expanded).toMatch(/^([0-9a-f]{4}:){7}[0-9a-f]{4}$/);
      const canonical = new URL("http://[" + candidate + "]/").hostname.slice(1, -1);
      expect(compressIPv6(candidate), candidate).toBe(canonical);
    }
    expect(valid).toBeGreaterThan(1500);
  });

  it("rejects groups that are not 1-4 hex digits instead of throwing", () => {
    for (const bad of ["gggg::1", "12345::", "2001:db8::/64", "fe80::1%eth0", ":::", "1::2::3"]) {
      expect(expandIPv6(bad), bad).toBeNull();
    }
  });
});

describe("isValidIPv4", () => {
  it("matches node:net for dotted quads without leading-zero octets", () => {
    for (let i = 0; i < 2000; i++) {
      const octets = Array.from({ length: 4 }, () => String(Math.floor(rand() * 300)));
      const ip = octets.join(".");
      expect(isValidIPv4(ip), ip).toBe(isIPv4(ip));
    }
    expect(isValidIPv4("1.2.3")).toBe(false);
    expect(isValidIPv4("1.2.3.4.5")).toBe(false);
    expect(isValidIPv4("1.2.3.1e2")).toBe(false);
  });
});

const ip4 = (text) => text.split(".").reduce((acc, o) => acc * 256 + Number(o), 0);
const ip6 = (text) =>
  expandIPv6(text)
    .split(":")
    .reduce((acc, g) => (acc << 16n) + BigInt("0x" + g), 0n);

describe("classifyIPv4 (RFC 6890 registry)", () => {
  it.each([
    ["10.1.2.0", 24, "Private RFC 1918 /8"],
    ["172.31.0.0", 16, "Private RFC 1918 /12"],
    ["192.168.1.0", 24, "Private RFC 1918 /16"],
    ["100.64.0.0", 10, "Carrier-grade NAT /10"],
    ["198.18.0.0", 15, "Benchmarking"],
    ["192.0.0.0", 24, "IETF protocol assignments"],
    ["8.8.8.0", 24, "Public routable"],
    ["255.255.255.255", 32, "Limited broadcast"],
    ["240.0.0.0", 4, "Future use"],
  ])("%s/%i is %s", (net, prefix, label) => {
    expect(classifyIPv4(ip4(net), prefix).label).toBe(label);
  });

  it("reports blocks that contain special ranges instead of labelling them by their first address", () => {
    expect(classifyIPv4(ip4("0.0.0.0"), 0).label).toBe("Spans special-purpose ranges");
    expect(classifyIPv4(ip4("10.0.0.0"), 7).label).toBe("Spans special-purpose ranges");
    expect(classifyIPv4(ip4("172.0.0.0"), 8).special).toContain("Private RFC 1918 /12");
  });
});

describe("classifyIPv6", () => {
  it.each([
    ["::1", 128, "Loopback (::1/128)"],
    ["::", 128, "Unspecified (::/128)"],
    ["::ffff:0:0", 96, "IPv4-mapped (::ffff:0:0/96)"],
    ["ff02::", 16, "Multicast (ff00::/8)"],
    ["fd12:3456::", 48, "Unique Local (fc00::/7)"],
    ["fe80::", 64, "Link-local (fe80::/10)"],
    ["2001:db8:1::", 48, "Documentation (2001:db8::/32)"],
    ["2606:4700::", 32, "Global unicast"],
    ["4000::", 3, "Reserved by IETF"],
  ])("%s/%i is %s", (net, prefix, label) => {
    expect(classifyIPv6(ip6(net), prefix).label).toBe(label);
  });

  it("does not call ::/0 an unspecified address", () => {
    expect(classifyIPv6(0n, 0).label).toBe("Spans special-purpose ranges");
  });
});

describe("ipv4UsableLabel", () => {
  it("distinguishes /32 single hosts from /31 point-to-point links", () => {
    expect(ipv4UsableLabel(32)).toBe("1 (single host)");
    expect(ipv4UsableLabel(31)).toBe("2 (point-to-point, RFC 3021)");
    expect(ipv4UsableLabel(24)).toBe((254).toLocaleString() + " usable");
  });
});
