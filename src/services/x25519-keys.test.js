import { createPrivateKey, createPublicKey } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  base64UrlToBytes,
  bytesToBase64,
  generateX25519KeyPairRaw,
} from "./x25519-keys.js";

function derivePublicFromPrivate(priv) {
  const pkcs8 = Buffer.concat([
    Buffer.from("302e020100300506032b656e04220420", "hex"),
    Buffer.from(priv),
  ]);
  const key = createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
  const spki = createPublicKey(key).export({ type: "spki", format: "der" });
  return new Uint8Array(spki.subarray(spki.length - 32));
}

describe("generateX25519KeyPairRaw", () => {
  it("returns a public key that matches the private scalar", async () => {
    const { privateKey, publicKey } = await generateX25519KeyPairRaw();
    expect(privateKey).toHaveLength(32);
    expect(publicKey).toHaveLength(32);
    expect(derivePublicFromPrivate(privateKey)).toEqual(publicKey);
  });

  it("does not emit an uncorrelated public key", async () => {
    const a = await generateX25519KeyPairRaw();
    const b = await generateX25519KeyPairRaw();
    expect(bytesToBase64(a.publicKey)).not.toBe(bytesToBase64(b.publicKey));
    expect(derivePublicFromPrivate(a.privateKey)).not.toEqual(b.publicKey);
  });
});

describe("base64UrlToBytes", () => {
  it("round-trips a 32-byte scalar", () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const b64 = bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    expect(base64UrlToBytes(b64)).toEqual(bytes);
  });
});
