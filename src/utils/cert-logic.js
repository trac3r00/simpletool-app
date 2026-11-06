/**
 * Pure certificate-inspection logic for /certificate-decoder.
 *
 * Every export is self-contained (no imports, no closures over module state)
 * because the route injects them into its inline <script> via fn.toString().
 * Functions that need node-forge take it as an argument, so the same code runs
 * against the page's vendored forge and the npm `node-forge` in tests.
 */

/**
 * Returns the first PEM private-key armor line found in `text`
 * (BEGIN or END; PRIVATE KEY, RSA/EC/DSA/ENCRYPTED/OPENSSH PRIVATE KEY,
 * PGP PRIVATE KEY BLOCK), or null when there is none.
 */
export function detectPrivateKey(text) {
  const match = String(text ?? "").match(
    /-----(?:BEGIN|END) [A-Z0-9 ]*PRIVATE KEY(?: BLOCK)?-----/i,
  );
  return match ? match[0] : null;
}

export function extractPemCertificates(text) {
  return (
    String(text ?? "").match(
      /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g,
    ) || []
  );
}

/**
 * Warnings for one certificate, from a plain field object:
 *   { notBefore: ms, notAfter: ms, sanCount, signatureAlgorithm, keyType, rsaBits, isCA }
 * `nowMs` is the evaluation instant. notAfter is inclusive (RFC 5280 4.1.2.5):
 * a certificate whose notAfter equals now is still valid but expiring.
 */
export function computeCertWarnings(fields, nowMs) {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const warnings = [];
  const notBefore = Number(fields.notBefore);
  const notAfter = Number(fields.notAfter);

  if (nowMs > notAfter) {
    warnings.push({
      code: "expired",
      message: "Certificate has expired (notAfter " + new Date(notAfter).toUTCString() + ").",
    });
  } else if (notAfter - nowMs <= 30 * DAY_MS) {
    warnings.push({
      code: "expires-soon",
      message: "Certificate expires within 30 days (" + new Date(notAfter).toUTCString() + ").",
    });
  }
  if (nowMs < notBefore) {
    warnings.push({
      code: "not-yet-valid",
      message: "Certificate is not valid yet (notBefore " + new Date(notBefore).toUTCString() + ").",
    });
  }
  if (!fields.isCA && !(fields.sanCount > 0)) {
    warnings.push({
      code: "no-san",
      message:
        "No Subject Alternative Name. Browsers match hostnames against SANs only, not the Common Name.",
    });
  }

  const alg = String(fields.signatureAlgorithm || "");
  const weakOids = [
    "1.2.840.113549.1.1.2", // md2WithRSAEncryption
    "1.2.840.113549.1.1.4", // md5WithRSAEncryption
    "1.2.840.113549.1.1.5", // sha1WithRSAEncryption
    "1.3.14.3.2.29", // sha1WithRSASignature (OIW)
    "1.2.840.10045.4.1", // ecdsa-with-SHA1
    "1.2.840.10040.4.3", // dsa-with-sha1
  ];
  if (/(?:sha-?1|md[25])(?![0-9])/i.test(alg) || weakOids.indexOf(alg) !== -1) {
    warnings.push({
      code: "weak-signature",
      message: "Weak signature algorithm (" + alg + "). SHA-1 and MD5 signatures are collision-prone.",
    });
  }

  if (String(fields.keyType || "").toUpperCase() === "RSA" && Number(fields.rsaBits) < 2048) {
    warnings.push({
      code: "weak-rsa-key",
      message: "RSA key is " + fields.rsaBits + " bits; 2048 bits is the minimum accepted by public CAs.",
    });
  }
  return warnings;
}

/**
 * Chain order from DN strings: entries = [{ subject, issuer }] in pasted order.
 * Link i is in order when the issuer DN of cert i equals the subject DN of
 * cert i+1 (case and whitespace insensitive). selfSigned[i] is subject === issuer.
 */
export function checkChainOrder(entries) {
  const norm = (dn) => String(dn ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  const links = [];
  for (let i = 0; i + 1 < entries.length; i++) {
    links.push({
      from: i,
      to: i + 1,
      ok: norm(entries[i].issuer) === norm(entries[i + 1].subject),
    });
  }
  return {
    links,
    inOrder: links.every((link) => link.ok),
    selfSigned: entries.map((entry) => norm(entry.subject) === norm(entry.issuer)),
  };
}

export function extractCertFields(forge, cert) {
  const dn = (attributes) =>
    (attributes || [])
      .map((attr) => (attr.shortName || attr.name || attr.type) + "=" + attr.value)
      .join(", ");
  const exts = cert.extensions || [];
  const sanExt = exts.find((ext) => ext.name === "subjectAltName");
  const sanTypes = { 1: "email", 2: "DNS", 6: "URI", 7: "IP Address" };
  const sans = ((sanExt && sanExt.altNames) || []).map(
    (alt) => (sanTypes[alt.type] || "othername") + ":" + (alt.type === 7 ? alt.ip : alt.value),
  );
  const basic = exts.find((ext) => ext.name === "basicConstraints");
  const key = cert.publicKey;
  const keyInfo = cert.keyInfo || null;
  return {
    subject: dn(cert.subject && cert.subject.attributes),
    issuer: dn(cert.issuer && cert.issuer.attributes),
    notBefore: cert.validity.notBefore.getTime(),
    notAfter: cert.validity.notAfter.getTime(),
    sans,
    sanCount: sans.length,
    signatureAlgorithm:
      forge.pki.oids[cert.signatureOid] ||
      {
        "1.2.840.10045.4.1": "ecdsa-with-SHA1",
        "1.2.840.10045.4.3.2": "ecdsa-with-SHA256",
        "1.2.840.10045.4.3.3": "ecdsa-with-SHA384",
        "1.2.840.10045.4.3.4": "ecdsa-with-SHA512",
      }[cert.signatureOid] ||
      cert.signatureOid ||
      "Unknown",
    keyType: key && key.n ? "RSA" : keyInfo ? keyInfo.type : "Unknown",
    rsaBits: key && key.n ? key.n.bitLength() : null,
    isCA: Boolean(basic && basic.cA),
  };
}

/**
 * Whether `issuerCert` signed `cert`. forge throws when the DNs differ; that is reported as not verified.
 * `unsupported` marks signatures this page cannot check (non-RSA issuer key or unknown digest),
 * which must not be shown as a failed verification.
 */
export function verifyIssuedBy(issuerCert, cert) {
  if (!issuerCert.publicKey || !issuerCert.publicKey.n) {
    const type = (issuerCert.keyInfo && issuerCert.keyInfo.type) || "non-RSA";
    return { ok: false, unsupported: true, error: "Issuer key is " + type + "; only RSA signatures are verified here." };
  }
  if (cert.keyInfo && !cert.md) {
    return { ok: false, unsupported: true, error: "Signature algorithm " + cert.signatureOid + " is not supported." };
  }
  try {
    return { ok: issuerCert.verify(cert) === true, error: null };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
}


/**
 * Whether the issuer's key signed `cert`, checked with WebCrypto for the signatures forge cannot verify:
 * ecdsa-with-SHA1/256/384/512 by a P-256, P-384 or P-521 key, and Ed25519 (RFC 5758, RFC 8410).
 * `issuerDer` and `certDer` are DER as binary strings (forge's cert.der); `subtle` is crypto.subtle.
 * Resolves to { ok, unsupported, error }. `unsupported` means the signature was not checked (no WebCrypto,
 * no Ed25519 in this browser, another algorithm); a signature that was checked and is wrong is ok: false.
 * Self-contained so the route can inject it with fn.toString().
 */
export async function verifySignatureWebCrypto(subtle, issuerDer, certDer) {
  const ECDSA_HASHES = {
    "1.2.840.10045.4.1": "SHA-1",
    "1.2.840.10045.4.3.2": "SHA-256",
    "1.2.840.10045.4.3.3": "SHA-384",
    "1.2.840.10045.4.3.4": "SHA-512",
  };
  const CURVES = {
    "1.2.840.10045.3.1.7": { name: "P-256", size: 32 },
    "1.3.132.0.34": { name: "P-384", size: 48 },
    "1.3.132.0.35": { name: "P-521", size: 66 },
  };
  const EC_KEY = "1.2.840.10045.2.1";
  const ED25519 = "1.3.101.112";
  const KEY_NAMES = { "1.2.840.113549.1.1.1": "RSA", "1.2.840.10045.2.1": "EC", "1.3.101.112": "Ed25519", "1.3.101.113": "Ed448" };

  function node(der, offset, limit) {
    if (offset + 2 > limit) throw new Error("Truncated DER.");
    const first = der.charCodeAt(offset + 1);
    let header = 2;
    let length = first;
    if (first & 0x80) {
      const count = first & 0x7f;
      if (count < 1 || count > 4) throw new Error("Unsupported DER length.");
      length = 0;
      for (let index = 0; index < count; index++) length = length * 256 + der.charCodeAt(offset + 2 + index);
      header += count;
    }
    const end = offset + header + length;
    if (end > limit) throw new Error("Truncated DER.");
    return { tag: der.charCodeAt(offset), start: offset, body: offset + header, end };
  }
  function children(der, parent) {
    const out = [];
    for (let at = parent.body; at < parent.end; at = out[out.length - 1].end) out.push(node(der, at, parent.end));
    return out;
  }
  function oid(der, item) {
    if (item.tag !== 0x06) throw new Error("Expected an OBJECT IDENTIFIER.");
    const arcs = [];
    let value = 0;
    for (let at = item.body; at < item.end; at++) {
      const byte = der.charCodeAt(at);
      value = value * 128 + (byte & 0x7f);
      if (byte & 0x80) continue;
      if (!arcs.length) arcs.push(value < 80 ? Math.floor(value / 40) : 2, value < 80 ? value % 40 : value - 80);
      else arcs.push(value);
      value = 0;
    }
    return arcs.join(".");
  }
  function bytes(der, from, to) {
    const out = new Uint8Array(to - from);
    for (let index = 0; index < out.length; index++) out[index] = der.charCodeAt(from + index) & 0xff;
    return out;
  }
  // X9.62 Ecdsa-Sig-Value (SEQUENCE { r INTEGER, s INTEGER }) to the fixed-width r || s that WebCrypto takes.
  function ecdsaRaw(signature, size) {
    const text = String.fromCharCode.apply(null, Array.from(signature));
    const seq = node(text, 0, text.length);
    if (seq.tag !== 0x30 || seq.end !== text.length) return null;
    const parts = children(text, seq);
    if (parts.length !== 2) return null;
    const raw = new Uint8Array(size * 2);
    for (let index = 0; index < 2; index++) {
      const integer = parts[index];
      if (integer.tag !== 0x02 || integer.end === integer.body) return null;
      let from = integer.body;
      if (text.charCodeAt(from) & 0x80) return null;
      while (from < integer.end - 1 && text.charCodeAt(from) === 0) from++;
      const length = integer.end - from;
      if (length > size) return null;
      raw.set(bytes(text, from, integer.end), index * size + size - length);
    }
    return raw;
  }

  if (!subtle) {
    return { ok: false, unsupported: true, error: "WebCrypto is not available on this page, so the signature was not checked." };
  }
  let signedData, signature, sigOid, keyOid, curveOid, spki;
  try {
    // Certificate ::= SEQUENCE { tbsCertificate SEQUENCE, signatureAlgorithm SEQUENCE, signatureValue BIT STRING }
    function certificate(der) {
      const root = node(der, 0, der.length);
      const parts = root.tag === 0x30 && root.end === der.length ? children(der, root) : [];
      if (parts.length !== 3 || parts[0].tag !== 0x30 || parts[1].tag !== 0x30 || parts[2].tag !== 0x03) {
        throw new Error("Not a DER Certificate.");
      }
      return parts;
    }
    const [tbs, sigAlg, sigValue] = certificate(certDer);
    const tbsFields = children(certDer, tbs);
    // TBSCertificate ::= SEQUENCE { [0] version OPTIONAL, serialNumber, signature, ... }
    const tbsSigAlg = tbsFields[tbsFields[0].tag === 0xa0 ? 2 : 1];
    if (certDer.substring(tbsSigAlg.start, tbsSigAlg.end) !== certDer.substring(sigAlg.start, sigAlg.end)) {
      return { ok: false, unsupported: false, error: "The signature algorithm inside the certificate does not match the outer one." };
    }
    sigOid = oid(certDer, children(certDer, sigAlg)[0]);
    if (sigValue.tag !== 0x03 || certDer.charCodeAt(sigValue.body) !== 0) throw new Error("Malformed signature BIT STRING.");
    signature = bytes(certDer, sigValue.body + 1, sigValue.end);
    signedData = bytes(certDer, tbs.start, tbs.end);

    const issuerTbs = certificate(issuerDer)[0];
    const issuerFields = children(issuerDer, issuerTbs);
    const spkiNode = issuerFields[(issuerFields[0].tag === 0xa0 ? 1 : 0) + 5];
    const keyAlg = children(issuerDer, children(issuerDer, spkiNode)[0]);
    keyOid = oid(issuerDer, keyAlg[0]);
    curveOid = keyAlg[1] && keyAlg[1].tag === 0x06 ? oid(issuerDer, keyAlg[1]) : null;
    spki = bytes(issuerDer, spkiNode.start, spkiNode.end);
  } catch (err) {
    return { ok: false, unsupported: false, error: "Could not read the signature: " + String((err && err.message) || err) };
  }

  const keyName = KEY_NAMES[keyOid] || keyOid;
  let importAlg, verifyAlg;
  if (ECDSA_HASHES[sigOid]) {
    if (keyOid !== EC_KEY) {
      return { ok: false, unsupported: false, error: "Signed with ECDSA, but the issuer key is " + keyName + "." };
    }
    const curve = CURVES[curveOid];
    if (!curve) {
      return { ok: false, unsupported: true, error: "Issuer EC curve " + (curveOid || "(explicit parameters)") + " is not supported by WebCrypto." };
    }
    try {
      signature = ecdsaRaw(signature, curve.size);
    } catch (err) {
      signature = null;
    }
    if (!signature) {
      return { ok: false, unsupported: false, error: "ECDSA signature is not a valid (r, s) pair for " + curve.name + "." };
    }
    importAlg = { name: "ECDSA", namedCurve: curve.name };
    verifyAlg = { name: "ECDSA", hash: ECDSA_HASHES[sigOid] };
  } else if (sigOid === ED25519) {
    if (keyOid !== ED25519) {
      return { ok: false, unsupported: false, error: "Signed with Ed25519, but the issuer key is " + keyName + "." };
    }
    importAlg = { name: "Ed25519" };
    verifyAlg = { name: "Ed25519" };
  } else {
    return { ok: false, unsupported: true, error: "Signature algorithm " + sigOid + " with an " + keyName + " issuer key is not verified here." };
  }

  let key;
  try {
    key = await subtle.importKey("spki", spki, importAlg, false, ["verify"]);
  } catch (err) {
    const reason = (err && err.name) || "Error";
    if (reason === "NotSupportedError" || importAlg.name === "Ed25519") {
      return { ok: false, unsupported: true, error: "This browser's WebCrypto cannot import " + (importAlg.namedCurve || importAlg.name) + " keys (" + reason + ")." };
    }
    return { ok: false, unsupported: false, error: "The issuer's public key could not be imported (" + reason + ")." };
  }
  try {
    const ok = await subtle.verify(verifyAlg, key, signature, signedData);
    return { ok: ok === true, unsupported: false, error: ok === true ? null : "The certificate was altered after signing, or a different key signed it." };
  } catch (err) {
    return { ok: false, unsupported: false, error: "Verification failed: " + String((err && err.message) || err) };
  }
}

/**
 * Parses one PEM certificate with node-forge, including the cases forge rejects on its own:
 * non-RSA subject keys (EC, Ed25519) and signature OIDs it cannot digest (ecdsa-with-*).
 * For those, the SPKI is swapped for a placeholder RSA key so forge can read every other
 * field, `publicKey` is set to null, and `keyInfo` describes the real key.
 * UTF8String/BMPString name values are decoded (forge leaves them as raw bytes), and
 * `der` is the original encoding, which fingerprints and the TBS digest are computed from.
 */
export function parseCertificatePem(forge, pem) {
  const asn1 = forge.asn1;
  const der = forge.pem.decode(pem)[0].body;
  const root = asn1.fromDer(der);
  const tbs = root.value[0];
  const spkiIndex = (tbs.value[0].tagClass === asn1.Class.CONTEXT_SPECIFIC ? 1 : 0) + 5;
  const spki = tbs.value[spkiIndex];
  const keyOid = asn1.derToOid(spki.value[0].value[0].value);
  const params = spki.value[0].value[1];
  const curveOid = params && params.type === asn1.Type.OID ? asn1.derToOid(params.value) : null;
  const CURVES = { "1.2.840.10045.3.1.7": "P-256", "1.3.132.0.34": "P-384", "1.3.132.0.35": "P-521" };
  const KEYS = { "1.2.840.10045.2.1": "EC", "1.3.101.112": "Ed25519", "1.3.101.113": "Ed448", "1.2.840.113549.1.1.10": "RSA-PSS" };

  let cert;
  let keyInfo = null;
  if (keyOid === "1.2.840.113549.1.1.1") {
    cert = forge.pki.certificateFromAsn1(root, false);
    keyInfo = { type: "RSA", bits: cert.publicKey.n.bitLength() };
  } else {
    const BigInteger = forge.jsbn.BigInteger;
    const placeholder = forge.pki.publicKeyToAsn1(
      forge.pki.setRsaPublicKey(new BigInteger("65537"), new BigInteger("65537")),
    );
    const original = tbs.value[spkiIndex];
    tbs.value[spkiIndex] = placeholder;
    try {
      cert = forge.pki.certificateFromAsn1(root, false);
    } finally {
      tbs.value[spkiIndex] = original;
    }
    cert.publicKey = null;
    keyInfo = { type: KEYS[keyOid] || keyOid, curve: curveOid ? CURVES[curveOid] || curveOid : null };
  }

  function headerLength(offset) {
    const first = der.charCodeAt(offset + 1);
    return first < 0x80 ? 2 : 2 + (first & 0x7f);
  }
  function contentLength(offset) {
    const first = der.charCodeAt(offset + 1);
    if (first < 0x80) return first;
    let length = 0;
    for (let index = 0; index < (first & 0x7f); index++) length = length * 256 + der.charCodeAt(offset + 2 + index);
    return length;
  }
  const tbsStart = headerLength(0);
  const tbsDer = der.substr(tbsStart, headerLength(tbsStart) + contentLength(tbsStart));
  const DIGESTS = {
    "1.2.840.113549.1.1.4": "md5",
    "1.2.840.113549.1.1.5": "sha1",
    "1.3.14.3.2.29": "sha1",
    "1.2.840.113549.1.1.11": "sha256",
    "1.2.840.113549.1.1.12": "sha384",
    "1.2.840.113549.1.1.13": "sha512",
  };
  const digest = DIGESTS[cert.signatureOid];
  cert.md = digest && forge.md[digest] ? forge.md[digest].create().update(tbsDer) : null;

  function decodeValue(attr) {
    try {
      if (attr.valueTagClass === asn1.Type.UTF8) return forge.util.decodeUtf8(attr.value);
      if (attr.valueTagClass === asn1.Type.BMPSTRING) {
        let out = "";
        for (let index = 0; index + 1 < attr.value.length; index += 2) {
          out += String.fromCharCode((attr.value.charCodeAt(index) << 8) | attr.value.charCodeAt(index + 1));
        }
        return out;
      }
    } catch (err) {
      return attr.value;
    }
    return attr.value;
  }
  [cert.subject, cert.issuer].forEach(function (name) {
    (name.attributes || []).forEach(function (attr) {
      attr.value = decodeValue(attr);
    });
  });

  cert.keyInfo = keyInfo;
  cert.der = der;
  return cert;
}

/**
 * Human-readable key usage, extended key usage, CRL distribution point and AIA values.
 * forge only flags known usages as booleans and leaves CRL DP / AIA undecoded, so the
 * extension values are read from their DER (RFC 5280 4.2.1.3, 4.2.1.12, 4.2.1.13, 4.2.2.1).
 */
export function describeCertExtensions(forge, cert) {
  const asn1 = forge.asn1;
  const exts = cert.extensions || [];
  const find = (name) => exts.find((ext) => ext.name === name || ext.id === name);
  const oidName = (oid) => forge.pki.oids[oid] || oid;
  const KEY_USAGES = [
    "digitalSignature", "nonRepudiation", "keyEncipherment", "dataEncipherment",
    "keyAgreement", "keyCertSign", "cRLSign", "encipherOnly", "decipherOnly",
  ];
  function uris(node, out) {
    if (node.tagClass === asn1.Class.CONTEXT_SPECIFIC && node.type === 6 && !node.constructed) {
      out.push(node.value);
    } else if (Array.isArray(node.value)) {
      node.value.forEach((child) => uris(child, out));
    }
    return out;
  }
  function parse(ext) {
    try {
      return asn1.fromDer(ext.value);
    } catch (err) {
      return null;
    }
  }

  const keyUsageExt = find("keyUsage");
  const ekuExt = find("extKeyUsage");
  const crlExt = find("cRLDistributionPoints") || find("2.5.29.31");
  const aiaExt = find("authorityInfoAccess") || find("1.3.6.1.5.5.7.1.1");
  const ekuNode = ekuExt && parse(ekuExt);
  const crlNode = crlExt && parse(crlExt);
  const aiaNode = aiaExt && parse(aiaExt);
  const AIA_METHODS = { "1.3.6.1.5.5.7.48.1": "OCSP", "1.3.6.1.5.5.7.48.2": "CA Issuers" };

  return {
    keyUsage: keyUsageExt ? KEY_USAGES.filter((name) => keyUsageExt[name]) : null,
    keyUsageCritical: Boolean(keyUsageExt && keyUsageExt.critical),
    extKeyUsage: ekuNode ? ekuNode.value.map((oid) => oidName(asn1.derToOid(oid.value))) : null,
    crl: crlNode ? uris(crlNode, []) : null,
    aia: aiaNode
      ? aiaNode.value.map((desc) => {
          const method = asn1.derToOid(desc.value[0].value);
          return (AIA_METHODS[method] || oidName(method)) + ": " + (uris(desc.value[1], [])[0] || "(non-URI location)");
        })
      : null,
  };
}
