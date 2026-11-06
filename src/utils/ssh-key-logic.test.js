import { createPrivateKey, createPublicKey, generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ed25519SeedFromPkcs8, encodeOpenSshEd25519PrivateKey } from "./ssh-key-logic.js";

// Written by `ssh-keygen -t ed25519 -N '' -C 'fixture émile@host'` (OpenSSH 10.5). Test-only key.
const FIXTURE = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACC4RVS2t6iaEWb4V1vPjSkL/SusTwhR52O3o9fi6JGMXQAAAJgZVsbTGVbG
0wAAAAtzc2gtZWQyNTUxOQAAACC4RVS2t6iaEWb4V1vPjSkL/SusTwhR52O3o9fi6JGMXQ
AAAECRHOPJRL990Rz77X1QT9Wd857s6qsTzbPz8GmfLf3bgrhFVLa3qJoRZvhXW8+NKQv9
K6xPCFHnY7ej1+LokYxdAAAAE2ZpeHR1cmUgw6ltaWxlQGhvc3QBAg==
-----END OPENSSH PRIVATE KEY-----
`;
const FIXTURE_PUBLIC = "AAAAC3NzaC1lZDI1NTE5AAAAILhFVLa3qJoRZvhXW8+NKQv9K6xPCFHnY7ej1+LokYxd";

// openssh-key-v1 layout: magic(15) + "none"(8) + "none"(8) + kdfoptions(4) + count(4) = 39,
// then the length-prefixed 51-byte public blob, then the length-prefixed private section.
const PUBLIC_BLOB_START = 43;
const SECTION_LENGTH_AT = 94;
const SECTION_START = 98;

function fixtureBytes() {
  return Buffer.from(FIXTURE.split("\n").slice(1, -2).join(""), "base64");
}

function publicKeyFromSeed(seed) {
  const pkcs8 = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(seed)]);
  const jwk = createPublicKey(createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" })).export({ format: "jwk" });
  return new Uint8Array(Buffer.from(jwk.x, "base64url"));
}

describe("OpenSSH Ed25519 private key encoding", () => {
  it("reproduces an ssh-keygen key byte for byte", () => {
    const bytes = fixtureBytes();
    const checkint = bytes.readUInt32BE(SECTION_START);
    const keyPairStart = SECTION_START + 8 + 15 + 36 + 4;
    const keyPair = bytes.subarray(keyPairStart, keyPairStart + 64);
    const seed = new Uint8Array(keyPair.subarray(0, 32));
    const publicKey = publicKeyFromSeed(seed);

    expect(Buffer.from(publicKey).equals(keyPair.subarray(32))).toBe(true);
    expect(encodeOpenSshEd25519PrivateKey(seed, publicKey, "fixture émile@host", checkint)).toBe(FIXTURE);
  });

  it("embeds the same public blob that the .pub line carries", () => {
    const bytes = fixtureBytes();
    expect(bytes.subarray(PUBLIC_BLOB_START, PUBLIC_BLOB_START + 51).toString("base64")).toBe(FIXTURE_PUBLIC);
  });

  it("extracts the seed from node:crypto PKCS#8 exports (same layout as WebCrypto)", () => {
    for (let round = 0; round < 20; round++) {
      const { privateKey, publicKey } = generateKeyPairSync("ed25519");
      const seed = ed25519SeedFromPkcs8(privateKey.export({ format: "der", type: "pkcs8" }));
      const expected = Buffer.from(publicKey.export({ format: "jwk" }).x, "base64url");
      expect(Buffer.from(publicKeyFromSeed(seed)).equals(expected)).toBe(true);
    }
  });

  it("pads the private section to 8 bytes for every comment length", () => {
    const seed = new Uint8Array(32).fill(7);
    const publicKey = publicKeyFromSeed(seed);
    for (let length = 0; length < 24; length++) {
      const pem = encodeOpenSshEd25519PrivateKey(seed, publicKey, "c".repeat(length), 0x01020304);
      const bytes = Buffer.from(pem.split("\n").slice(1, -2).join(""), "base64");
      const sectionLength = bytes.readUInt32BE(SECTION_LENGTH_AT);
      const section = bytes.subarray(SECTION_START);
      expect(section.length).toBe(sectionLength);
      expect(sectionLength % 8).toBe(0);
      const commentEnd = 8 + 15 + 36 + 68 + 4 + length;
      expect([...section.subarray(commentEnd)]).toEqual([...section.subarray(commentEnd)].map((_, i) => i + 1));
    }
  });

  it("rejects PKCS#8 input that is not a bare Ed25519 seed", () => {
    expect(() => ed25519SeedFromPkcs8(new Uint8Array(47))).toThrow();
  });
});
