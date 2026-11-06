// The route inlines this factory into its client script with fn.toString(), so it
// must stay self-contained. A factory keeps the inner names local: the worker
// bundler may rename colliding top-level names.
export function createJwtLogic() {
  const HASH_BY_SIZE = { "256": "SHA-256", "384": "SHA-384", "512": "SHA-512" };
  // RFC 7518 §3.4: each ES* algorithm is bound to exactly one curve.
  const CURVE_BY_ALG = { ES256: "P-256", ES384: "P-384", ES512: "P-521" };
  const PRIVATE_MEMBERS = ["d", "p", "q", "dp", "dq", "qi", "oth", "k"];

  function normalizeJwtInput(input) {
    return String(input || "").trim().replace(/^bearer\s+/i, "").replace(/\s+/g, "");
  }

  function jwsParams(alg, jwk) {
    const m = /^(HS|RS|PS|ES)(256|384|512)$/.exec(alg);
    // RFC 9864 adds the fully-specified "Ed25519" alongside "EdDSA"; browsers
    // export Ed25519 JWKs with alg "Ed25519", so both names are the same here.
    if (alg === "EdDSA" || alg === "Ed25519") {
      if (jwk && (jwk.kty !== "OKP" || jwk.crv !== "Ed25519")) {
        throw new Error(alg + " here needs an OKP key with crv \"Ed25519\".");
      }
      if (jwk && jwk.alg && jwk.alg !== "EdDSA" && jwk.alg !== "Ed25519") checkAlgMember(alg, jwk);
      return { importAlg: { name: "Ed25519" }, signAlg: { name: "Ed25519" } };
    }
    if (!m) throw new Error("Unsupported algorithm: " + alg);
    const family = m[1];
    const hash = HASH_BY_SIZE[m[2]];
    if (family === "HS") return { hmac: true, hash: hash };
    const kty = family === "ES" ? "EC" : "RSA";
    if (jwk && jwk.kty !== kty) {
      throw new Error(alg + " needs a " + kty + " key, but this JWK has kty \"" + jwk.kty + "\".");
    }
    checkAlgMember(alg, jwk);
    if (family === "RS") {
      const p = { name: "RSASSA-PKCS1-v1_5", hash: hash };
      return { importAlg: p, signAlg: p };
    }
    if (family === "PS") {
      return { importAlg: { name: "RSA-PSS", hash: hash }, signAlg: { name: "RSA-PSS", saltLength: Number(m[2]) / 8 } };
    }
    const curve = CURVE_BY_ALG[alg];
    if (jwk && jwk.crv !== curve) {
      throw new Error(alg + " requires curve " + curve + ", but this key is " + (jwk.crv || "missing crv") + ".");
    }
    return { importAlg: { name: "ECDSA", namedCurve: curve }, signAlg: { name: "ECDSA", hash: hash } };
  }

  function checkAlgMember(alg, jwk) {
    if (jwk && jwk.alg && jwk.alg !== alg) {
      throw new Error("This key is marked alg \"" + jwk.alg + "\". Select " + jwk.alg + ", or use a key made for " + alg + ".");
    }
  }

  function publicJwkFrom(jwk) {
    const pub = {};
    Object.keys(jwk).forEach(function (k) {
      if (PRIVATE_MEMBERS.indexOf(k) === -1 && k !== "key_ops") pub[k] = jwk[k];
    });
    return pub;
  }

  function withHeaderAlg(headerText, alg) {
    let header;
    try { header = JSON.parse(headerText); } catch (e) { return null; }
    if (!header || typeof header !== "object" || Array.isArray(header)) return null;
    header.alg = alg;
    return JSON.stringify(header, null, 2);
  }

  // --- Verify with JWKS ---------------------------------------------------
  const JWKS_ALGS = /^(RS|PS|ES)(256|384|512)$|^EdDSA$|^Ed25519$/;

  function b64urlBytes(str) {
    if (!/^[A-Za-z0-9_-]*$/.test(str)) throw new Error("The token contains characters outside base64url.");
    let s = str.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const raw = atob(s);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  }

  function b64urlJson(str, what) {
    let value;
    try { value = JSON.parse(new TextDecoder().decode(b64urlBytes(str))); } catch (e) {
      throw new Error("The token " + what + " is not base64url-encoded JSON.");
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("The token " + what + " must be a JSON object.");
    return value;
  }

  // Accepts a JWK Set ({"keys": [...]}) or a single JWK, which is treated as a one-key set.
  function parseJwks(text) {
    let doc;
    try { doc = JSON.parse(String(text || "").trim()); } catch (e) { throw new Error("The JWKS is not valid JSON: " + e.message); }
    if (!doc || typeof doc !== "object" || Array.isArray(doc)) throw new Error("The JWKS must be a JSON object with a \"keys\" array.");
    const keys = Array.isArray(doc.keys) ? doc.keys : (typeof doc.kty === "string" ? [doc] : null);
    if (!keys) throw new Error("The JWKS must have a \"keys\" array.");
    if (!keys.length) throw new Error("The JWKS \"keys\" array is empty.");
    keys.forEach(function (k, i) {
      if (!k || typeof k !== "object" || typeof k.kty !== "string") throw new Error("Key #" + (i + 1) + " has no \"kty\" member.");
    });
    return keys;
  }

  // Why a key cannot verify this alg, or null when it fits.
  function keyMismatch(alg, jwk) {
    if (jwk.use && jwk.use !== "sig") return "use is \"" + jwk.use + "\", not \"sig\"";
    if (Array.isArray(jwk.key_ops) && jwk.key_ops.indexOf("verify") === -1) return "key_ops does not include \"verify\"";
    try { jwsParams(alg, jwk); } catch (e) { return e.message; }
    return null;
  }

  // RFC 7515 §4.1.4: with a kid, only keys carrying that kid are candidates.
  // Without one, every key whose kty/crv/alg fits the token's alg is tried.
  function selectJwksCandidates(header, keys) {
    const alg = header.alg;
    const hasKid = header.kid !== undefined;
    const pool = [];
    const skipped = [];
    keys.forEach(function (jwk, index) {
      if (hasKid && jwk.kid !== header.kid) return;
      const why = keyMismatch(alg, jwk);
      if (why) skipped.push({ index: index, kid: jwk.kid, reason: why });
      else pool.push({ index: index, jwk: jwk });
    });
    if (hasKid && !pool.length && !skipped.length) {
      const kids = keys.map(function (k) { return k.kid; }).filter(function (k) { return k !== undefined; });
      throw new Error("No key in the JWKS has kid \"" + header.kid + "\"" + (kids.length ? " (available: " + kids.join(", ") + ")." : "; none of its keys has a kid."));
    }
    if (!pool.length) {
      throw new Error((hasKid ? "No key with kid \"" + header.kid + "\"" : "No key in the JWKS") + " fits " + alg +
        (skipped.length ? ": " + skipped.map(function (s) { return "#" + (s.index + 1) + " " + s.reason; }).join("; ") : "."));
    }
    return { candidates: pool, skipped: skipped };
  }

  // RFC 7519 §4.1.4-4.1.6. now and skew are in seconds; skew widens each bound.
  function checkTimeClaims(payload, now, skew) {
    const checks = [];
    function numeric(name) {
      const v = payload[name];
      if (v === undefined) return null;
      if (typeof v !== "number" || !isFinite(v)) {
        checks.push({ claim: name, ok: false, message: name + " must be a NumericDate (seconds), got " + JSON.stringify(v) + "." });
        return null;
      }
      return v;
    }
    const exp = numeric("exp");
    if (exp !== null) {
      checks.push(now < exp + skew
        ? { claim: "exp", ok: true, message: "Not expired (exp " + exp + ")." }
        : { claim: "exp", ok: false, message: "Expired: exp " + exp + " is " + (now - exp) + "s before now, beyond the " + skew + "s skew." });
    }
    const nbf = numeric("nbf");
    if (nbf !== null) {
      checks.push(now + skew >= nbf
        ? { claim: "nbf", ok: true, message: "Already valid (nbf " + nbf + ")." }
        : { claim: "nbf", ok: false, message: "Not yet valid: nbf " + nbf + " is " + (nbf - now) + "s after now, beyond the " + skew + "s skew." });
    }
    const iat = numeric("iat");
    if (iat !== null) {
      checks.push(iat <= now + skew
        ? { claim: "iat", ok: true, message: "Issued in the past (iat " + iat + ")." }
        : { claim: "iat", ok: false, message: "Issued in the future: iat " + iat + " is " + (iat - now) + "s after now, beyond the " + skew + "s skew." });
    }
    return checks;
  }

  async function verifyWithJwks(token, jwksText, options, subtle) {
    const parts = normalizeJwtInput(token).split(".");
    if (parts.length !== 3) throw new Error("Expected a signed JWT with 3 dot-separated parts.");
    const header = b64urlJson(parts[0], "header");
    const payload = b64urlJson(parts[1], "payload");
    const alg = header.alg;
    if (typeof alg !== "string" || !JWKS_ALGS.test(alg)) {
      throw new Error("JWKS verification covers RS*, PS*, ES* and EdDSA; this token's alg is " + JSON.stringify(alg) + ".");
    }
    const keys = parseJwks(jwksText);
    const picked = selectJwksCandidates(header, keys);
    const sig = b64urlBytes(parts[2]);
    const data = new TextEncoder().encode(parts[0] + "." + parts[1]);
    const tried = [];
    let verifiedBy = null;
    for (const c of picked.candidates) {
      const params = jwsParams(alg, c.jwk);
      let ok = false;
      let error = null;
      try {
        const key = await subtle.importKey("jwk", publicJwkFrom(c.jwk), params.importAlg, false, ["verify"]);
        ok = await subtle.verify(params.signAlg, key, sig, data);
      } catch (e) {
        error = e && e.message ? e.message : String(e);
      }
      tried.push({ index: c.index, kid: c.jwk.kid, ok: ok, error: error });
      if (ok) { verifiedBy = { index: c.index, kid: c.jwk.kid, kty: c.jwk.kty, crv: c.jwk.crv, alg: c.jwk.alg }; break; }
    }
    const now = options && typeof options.now === "number" ? options.now : Math.floor(Date.now() / 1000);
    const skew = options && typeof options.skew === "number" && options.skew >= 0 ? options.skew : 0;
    const claims = checkTimeClaims(payload, now, skew);
    return {
      header: header,
      payload: payload,
      signatureValid: verifiedBy !== null,
      verifiedBy: verifiedBy,
      tried: tried,
      skipped: picked.skipped,
      claims: claims,
      valid: verifiedBy !== null && claims.every(function (c) { return c.ok; }),
    };
  }

  return {
    normalizeJwtInput: normalizeJwtInput,
    jwsParams: jwsParams,
    publicJwkFrom: publicJwkFrom,
    withHeaderAlg: withHeaderAlg,
    parseJwks: parseJwks,
    selectJwksCandidates: selectJwksCandidates,
    checkTimeClaims: checkTimeClaims,
    verifyWithJwks: verifyWithJwks,
  };
}

export const {
  normalizeJwtInput, jwsParams, publicJwkFrom, withHeaderAlg,
  parseJwks, selectJwksCandidates, checkTimeClaims, verifyWithJwks,
} = createJwtLogic();
