import { describe, expect, it } from "vitest";
import { generateKeyPairSync, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import { invalidCidrEntries, isWireGuardKey, parseWireGuardConfig } from "./wireguard-logic.js";

function mulberry32(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("isWireGuardKey", () => {
  it("accepts X25519 keys exported by node:crypto", () => {
    for (let i = 0; i < 50; i++) {
      const { publicKey, privateKey } = generateKeyPairSync("x25519");
      const pub = publicKey.export({ format: "jwk" }).x;
      const priv = privateKey.export({ format: "jwk" }).d;
      for (const b64url of [pub, priv]) {
        const b64 = Buffer.from(b64url, "base64url").toString("base64");
        expect(isWireGuardKey(b64), b64).toBe(true);
      }
    }
  });

  it("agrees with a decode-to-32-bytes oracle on seeded random strings", () => {
    const rand = mulberry32(0xc0ffee);
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (let i = 0; i < 3000; i++) {
      const len = 42 + Math.floor(rand() * 4);
      let text = "";
      for (let j = 0; j < len; j++) text += alphabet[Math.floor(rand() * 64)];
      if (rand() < 0.8) text += "=";
      if (rand() < 0.3) text = randomBytes(32).toString("base64");
      const bytes = Buffer.from(text, "base64");
      const oracle =
        /^[A-Za-z0-9+/]+=*$/.test(text) && bytes.length === 32 && bytes.toString("base64") === text;
      expect(isWireGuardKey(text), text).toBe(oracle);
    }
  });
});

describe("invalidCidrEntries", () => {
  it("matches node:net for bare addresses and enforces prefix bounds", () => {
    const rand = mulberry32(42);
    const pieces = ["10", "0", "255", "256", "1", "fd00", "::", ":", "abcd", "g1", "01", "192.168.1.1"];
    for (let i = 0; i < 2000; i++) {
      const n = 1 + Math.floor(rand() * 6);
      let ip = "";
      for (let j = 0; j < n; j++) ip += pieces[Math.floor(rand() * pieces.length)] + (rand() < 0.5 ? "." : ":");
      ip = ip.slice(0, -1);
      expect(invalidCidrEntries(ip).length === 0, ip).toBe(isIP(ip) !== 0);
    }
    expect(invalidCidrEntries("10.0.0.2/24, fd00::2/64")).toEqual([]);
    expect(invalidCidrEntries("0.0.0.0/0, ::/0")).toEqual([]);
    expect(invalidCidrEntries("10.0.0.2/33, fd00::2/129, 999.1.1.1/24")).toEqual([
      "10.0.0.2/33",
      "fd00::2/129",
      "999.1.1.1/24",
    ]);
  });
});

describe("parseWireGuardConfig", () => {
  it("reads wg-quick files case-insensitively and accumulates repeated list keys", () => {
    const parsed = parseWireGuardConfig(
      [
        "[interface]",
        "privatekey=abc=",
        "Address = 10.0.0.2/24",
        "Address = fd00::2/64",
        "# comment",
        "[Peer]",
        "PublicKey = pk=",
        "AllowedIPs = 10.0.0.0/24",
        "AllowedIPs = fd00::/64",
        "Endpoint = vpn.example.com:51820",
        "Bogus = 1",
      ].join("\r\n"),
    );
    expect(parsed.iface.privateKey).toBe("abc=");
    expect(parsed.iface.address).toBe("10.0.0.2/24, fd00::2/64");
    expect(parsed.peers).toHaveLength(1);
    expect(parsed.peers[0].allowedIPs).toBe("10.0.0.0/24, fd00::/64");
    expect(parsed.peers[0].endpoint).toBe("vpn.example.com:51820");
    expect(parsed.unknown).toEqual(["line 11: Bogus is not a recognised peer key"]);
  });
});
