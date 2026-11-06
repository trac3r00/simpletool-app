import { createPublicKey, verify as nodeVerify, sign as nodeSign, generateKeyPairSync, createHmac, constants } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  checkTimeClaims, jwsParams, normalizeJwtInput, parseJwks, publicJwkFrom, selectJwksCandidates, verifyWithJwks, withHeaderAlg,
} from "./token-studio-logic.js";

const { subtle } = globalThis.crypto;
const SEED = Number(process.env.JWT_PROPERTY_SEED) || 0x4a575431;

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const b64url = (bytes) => Buffer.from(bytes).toString("base64url");

async function generateFor(alg) {
  if (alg === "EdDSA") return subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  if (alg.startsWith("ES")) {
    return subtle.generateKey({ name: "ECDSA", namedCurve: { ES256: "P-256", ES384: "P-384", ES512: "P-521" }[alg] }, true, ["sign", "verify"]);
  }
  const name = alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5";
  return subtle.generateKey({ name, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-" + alg.slice(2) }, true, ["sign", "verify"]);
}

function nodeVerifies(alg, publicJwk, signingInput, signature) {
  const key = createPublicKey({ key: publicJwk, format: "jwk" });
  const data = Buffer.from(signingInput);
  if (alg === "EdDSA") return nodeVerify(null, data, key, signature);
  const hash = "sha" + alg.slice(2);
  if (alg.startsWith("ES")) return nodeVerify(hash, data, { key, dsaEncoding: "ieee-p1363" }, signature);
  if (alg.startsWith("PS")) {
    return nodeVerify(hash, data, { key, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: Number(alg.slice(2)) / 8 }, signature);
  }
  return nodeVerify(hash, data, key, signature);
}

describe("token-studio-logic (seed " + SEED + ")", () => {
  it("signatures made with jwsParams verify under node:crypto for every asymmetric alg", async () => {
    const random = createRandom(SEED);
    const algs = ["RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512", "EdDSA"];
    for (const alg of algs) {
      const pair = await generateFor(alg);
      const privateJwk = await subtle.exportKey("jwk", pair.privateKey);
      delete privateJwk.alg;
      const params = jwsParams(alg, privateJwk);
      const key = await subtle.importKey("jwk", privateJwk, params.importAlg, false, ["sign"]);
      const header = b64url(JSON.stringify({ alg, typ: "JWT" }));
      const payload = b64url(JSON.stringify({ sub: String(random()), n: Math.floor(random() * 1e9) }));
      const signingInput = header + "." + payload;
      const sig = new Uint8Array(await subtle.sign(params.signAlg, key, new TextEncoder().encode(signingInput)));
      const pub = publicJwkFrom(privateJwk);
      expect(pub.d).toBeUndefined();
      expect(nodeVerifies(alg, pub, signingInput, sig), alg).toBe(true);
    }
  }, 60000);

  it("HMAC params produce the same signature as node:crypto", async () => {
    for (const alg of ["HS256", "HS384", "HS512"]) {
      const params = jwsParams(alg, null);
      const key = await subtle.importKey("raw", new TextEncoder().encode("s3cret"), { name: "HMAC", hash: params.hash }, false, ["sign"]);
      const sig = Buffer.from(await subtle.sign("HMAC", key, new TextEncoder().encode("a.b")));
      expect(sig.toString("hex")).toBe(createHmac("sha" + alg.slice(2), "s3cret").update("a.b").digest("hex"));
    }
  });

  it("rejects key/alg mismatches with an actionable message", () => {
    expect(() => jwsParams("ES256", { kty: "EC", crv: "P-384" })).toThrow(/requires curve P-256/);
    expect(() => jwsParams("RS256", { kty: "EC", crv: "P-256" })).toThrow(/needs a RSA key/);
    expect(() => jwsParams("PS256", { kty: "RSA", alg: "RS256" })).toThrow(/marked alg "RS256"/);
    expect(() => jwsParams("EdDSA", { kty: "OKP", crv: "Ed448" })).toThrow(/Ed25519/);
    expect(jwsParams("EdDSA", { kty: "OKP", crv: "Ed25519", alg: "Ed25519" }).signAlg.name).toBe("Ed25519");
    expect(jwsParams("Ed25519", { kty: "OKP", crv: "Ed25519", alg: "EdDSA" }).signAlg.name).toBe("Ed25519");
    expect(() => jwsParams("EdDSA", { kty: "OKP", crv: "Ed25519", alg: "ES256" })).toThrow(/marked alg/);
    expect(() => jwsParams("none", {})).toThrow(/Unsupported/);
  });

  describe("verify with JWKS (node:crypto oracle)", () => {
    const NOW = 1_800_000_000;
    const ALGS = ["RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512", "EdDSA"];
    const keyCache = new Map();

    // Keys and signatures come from node:crypto, independent of the WebCrypto path under test.
    function nodeKeyPair(alg, slot = 0) {
      const id = alg.slice(0, 2) + (alg.startsWith("ES") ? alg : "") + ":" + slot;
      if (!keyCache.has(id)) {
        let pair;
        if (alg === "EdDSA") pair = generateKeyPairSync("ed25519");
        else if (alg.startsWith("ES")) pair = generateKeyPairSync("ec", { namedCurve: { ES256: "P-256", ES384: "P-384", ES512: "P-521" }[alg] });
        else pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
        keyCache.set(id, pair);
      }
      return keyCache.get(id);
    }

    function nodeSignJwt(alg, privateKey, header, payload) {
      const signingInput = b64url(JSON.stringify({ alg, ...header })) + "." + b64url(JSON.stringify(payload));
      const data = Buffer.from(signingInput);
      const hash = "sha" + alg.slice(2);
      let sig;
      if (alg === "EdDSA") sig = nodeSign(null, data, privateKey);
      else if (alg.startsWith("ES")) sig = nodeSign(hash, data, { key: privateKey, dsaEncoding: "ieee-p1363" });
      else if (alg.startsWith("PS")) sig = nodeSign(hash, data, { key: privateKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: Number(alg.slice(2)) / 8 });
      else sig = nodeSign(hash, data, privateKey);
      return signingInput + "." + b64url(sig);
    }

    const jwkOf = (pair, extra) => ({ ...pair.publicKey.export({ format: "jwk" }), ...extra });
    const jwks = (...keys) => JSON.stringify({ keys });
    const verify = (token, set, opts = {}) => verifyWithJwks(token, set, { now: NOW, skew: 0, ...opts }, subtle);

    it("seeded: picks the kid's key or tries every fitting key, and rejects tampering", async () => {
      const random = createRandom(SEED ^ 0x6a776b73);
      for (let round = 0; round < 30; round++) {
        const alg = ALGS[Math.floor(random() * ALGS.length)];
        const signer = nodeKeyPair(alg, 0);
        const decoy = nodeKeyPair(alg, 1);
        const useKid = random() < 0.5;
        const keys = [jwkOf(decoy, { kid: "decoy", use: "sig" }), jwkOf(signer, { kid: "signer", use: "sig" })];
        if (random() < 0.5) keys.reverse();
        const token = nodeSignJwt(alg, signer.privateKey, useKid ? { kid: "signer" } : {}, { sub: "u" + round, exp: NOW + 60 });
        const label = alg + " round " + round + (useKid ? " kid" : " no-kid");

        const ok = await verify(token, jwks(...keys));
        expect(ok.signatureValid, label).toBe(true);
        expect(ok.valid, label).toBe(true);
        expect(ok.verifiedBy.kid, label).toBe("signer");
        expect(ok.tried.length, label).toBe(useKid ? 1 : keys.findIndex((k) => k.kid === "signer") + 1);

        // Flip one payload character: the oracle signature no longer covers it.
        const [h, p, s] = token.split(".");
        const at = Math.floor(random() * p.length);
        const swapped = p[at] === "A" ? "B" : "A";
        const tampered = [h, p.slice(0, at) + swapped + p.slice(at + 1), s].join(".");
        let bad;
        try { bad = await verify(tampered, jwks(...keys)); } catch (e) { bad = { signatureValid: false, error: e.message }; }
        expect(bad.signatureValid, label + " tampered").toBe(false);
      }
    }, 120000);

    it("a wrong kid fails with the available kids listed", async () => {
      const pair = nodeKeyPair("ES256");
      const token = nodeSignJwt("ES256", pair.privateKey, { kid: "rotated-away" }, { sub: "x" });
      await expect(verify(token, jwks(jwkOf(pair, { kid: "current" }), jwkOf(nodeKeyPair("RS256"), { kid: "rsa-1" }))))
        .rejects.toThrow(/No key in the JWKS has kid "rotated-away" \(available: current, rsa-1\)/);
    });

    it("a kid that names a key from the wrong family is reported, not silently retried", async () => {
      const pair = nodeKeyPair("ES256");
      const token = nodeSignJwt("ES256", pair.privateKey, { kid: "k" }, {});
      await expect(verify(token, jwks(jwkOf(nodeKeyPair("RS256"), { kid: "k" }), jwkOf(pair))))
        .rejects.toThrow(/No key with kid "k" fits ES256: #1 ES256 needs a EC key/);
    });

    it("without a kid, keys for other algs, enc keys and non-verify key_ops are skipped", async () => {
      const pair = nodeKeyPair("PS256");
      const token = nodeSignJwt("PS256", pair.privateKey, {}, {});
      const set = jwks(
        jwkOf(nodeKeyPair("ES256"), { kid: "ec" }),
        jwkOf(pair, { kid: "enc", use: "enc" }),
        jwkOf(pair, { kid: "rs-only", alg: "RS256" }),
        jwkOf(pair, { kid: "sign-only", key_ops: ["sign"] }),
        jwkOf(pair, { kid: "good", alg: "PS256" }),
      );
      const r = await verify(token, set);
      expect(r.verifiedBy).toMatchObject({ index: 4, kid: "good", kty: "RSA", alg: "PS256" });
      expect(r.skipped.map((s) => s.kid)).toEqual(["ec", "enc", "rs-only", "sign-only"]);
      await expect(verify(token, jwks(jwkOf(nodeKeyPair("ES256"))))).rejects.toThrow(/No key in the JWKS fits PS256/);
    });

    it("a valid signature from an expired token is still reported invalid; skew can admit it", async () => {
      const pair = nodeKeyPair("EdDSA");
      const set = jwks(jwkOf(pair, { kid: "ed" }));
      const expired = nodeSignJwt("EdDSA", pair.privateKey, { kid: "ed" }, { exp: NOW - 30, iat: NOW - 3600 });
      const r = await verify(expired, set);
      expect(r.signatureValid).toBe(true);
      expect(r.valid).toBe(false);
      expect(r.claims.find((c) => c.claim === "exp")).toMatchObject({ ok: false });
      expect((await verify(expired, set, { skew: 60 })).valid).toBe(true);
      expect((await verify(expired, set, { skew: 30 })).valid).toBe(false); // exp is exclusive
    });

    it("time claims follow RFC 7519 bounds with skew", () => {
      expect(checkTimeClaims({ exp: NOW }, NOW, 0)[0].ok).toBe(false);
      expect(checkTimeClaims({ exp: NOW + 1 }, NOW, 0)[0].ok).toBe(true);
      expect(checkTimeClaims({ nbf: NOW }, NOW, 0)[0].ok).toBe(true);
      expect(checkTimeClaims({ nbf: NOW + 10 }, NOW, 9)[0].ok).toBe(false);
      expect(checkTimeClaims({ nbf: NOW + 10 }, NOW, 10)[0].ok).toBe(true);
      expect(checkTimeClaims({ iat: NOW + 5 }, NOW, 0)[0].ok).toBe(false);
      expect(checkTimeClaims({ iat: NOW + 5 }, NOW, 5)[0].ok).toBe(true);
      expect(checkTimeClaims({ exp: "tomorrow" }, NOW, 0)[0]).toMatchObject({ ok: false, message: expect.stringMatching(/NumericDate/) });
      expect(checkTimeClaims({}, NOW, 0)).toEqual([]);
    });

    it("rejects malformed sets and tokens it cannot verify with a JWKS", async () => {
      expect(() => parseJwks("{oops")).toThrow(/not valid JSON/);
      expect(() => parseJwks('{"keys": []}')).toThrow(/empty/);
      expect(() => parseJwks('{"keys": [{"kid": "a"}]}')).toThrow(/#1 has no "kty"/);
      expect(parseJwks('{"kty":"OKP","crv":"Ed25519","x":"AA"}')).toHaveLength(1);
      expect(() => selectJwksCandidates({ alg: "ES256", kid: "a" }, [{ kty: "EC", crv: "P-256" }])).toThrow(/none of its keys has a kid/);
      const hs = b64url(JSON.stringify({ alg: "HS256" })) + "." + b64url("{}") + ".sig";
      await expect(verify(hs, jwks({ kty: "oct", k: "AA" }))).rejects.toThrow(/covers RS\*, PS\*, ES\* and EdDSA/);
      const none = b64url(JSON.stringify({ alg: "none" })) + "." + b64url("{}") + ".";
      await expect(verify(none, jwks({ kty: "oct", k: "AA" }))).rejects.toThrow(/"none"/);
    });
  });

  it("normalizes pasted tokens and rewrites only the header alg", () => {
    expect(normalizeJwtInput("  Bearer eyJh.\n eyJz.sig \n")).toBe("eyJh.eyJz.sig");
    expect(JSON.parse(withHeaderAlg('{"alg":"HS256","typ":"JWT","kid":"k1"}', "ES256"))).toEqual({ alg: "ES256", typ: "JWT", kid: "k1" });
    expect(withHeaderAlg("{oops", "ES256")).toBeNull();
    expect(withHeaderAlg("[1]", "ES256")).toBeNull();
  });
});
