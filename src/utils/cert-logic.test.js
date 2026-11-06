import { X509Certificate } from "node:crypto";
import { readFileSync } from "node:fs";
import forge from "node-forge";
import { describe, expect, it } from "vitest";
import {
  checkChainOrder,
  computeCertWarnings,
  describeCertExtensions,
  detectPrivateKey,
  extractCertFields,
  extractPemCertificates,
  parseCertificatePem,
  verifyIssuedBy,
  verifySignatureWebCrypto,
} from "./cert-logic.js";

// Replay: CERT_SEED=<n> npx vitest run src/utils/cert-logic.test.js
const SEED = Number(process.env.CERT_SEED ?? 0xce27f00d) >>> 0;
const CASES = 2000;
const DAY = 24 * 60 * 60 * 1000;

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function report(name, counts) {
  console.info(`[cert-logic] ${name} seed=0x${SEED.toString(16)}`, counts);
}

const fixture = (name) =>
  readFileSync(new URL(`./__fixtures__/certs/${name}.pem`, import.meta.url), "utf8");
const PEMS = { leaf: fixture("leaf"), intermediate: fixture("intermediate"), root: fixture("root") };
const CERTS = Object.fromEntries(
  Object.entries(PEMS).map(([name, pem]) => [name, forge.pki.certificateFromPem(pem)]),
);

// Captured from: openssl x509 -noout -subject -issuer -dates -ext subjectAltName
// plus `-text` for the signature algorithm and key size (OpenSSL 4.1.0).
const OPENSSL = {
  root: {
    subject: "C=US, O=SimpleTool Test, CN=SimpleTool Test Root CA",
    issuer: "C=US, O=SimpleTool Test, CN=SimpleTool Test Root CA",
    notBefore: "Jan  1 00:00:00 2026 GMT",
    notAfter: "Jan  1 00:00:00 2036 GMT",
    san: [],
    signatureAlgorithm: "sha256WithRSAEncryption",
    bits: 2048,
    ca: true,
  },
  intermediate: {
    subject: "C=US, O=SimpleTool Test, CN=SimpleTool Test Intermediate CA",
    issuer: "C=US, O=SimpleTool Test, CN=SimpleTool Test Root CA",
    notBefore: "Jan  1 00:00:00 2026 GMT",
    notAfter: "Jan  1 00:00:00 2034 GMT",
    san: [],
    signatureAlgorithm: "sha256WithRSAEncryption",
    bits: 2048,
    ca: true,
  },
  leaf: {
    subject: "C=US, O=SimpleTool Test, CN=leaf.example.test",
    issuer: "C=US, O=SimpleTool Test, CN=SimpleTool Test Intermediate CA",
    notBefore: "Jan  1 00:00:00 2026 GMT",
    notAfter: "Jan  1 00:00:00 2028 GMT",
    san: ["DNS:leaf.example.test", "DNS:www.leaf.example.test", "IP Address:192.0.2.10"],
    signatureAlgorithm: "sha256WithRSAEncryption",
    bits: 2048,
    ca: false,
  },
};

function parseOpensslDate(text) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [mon, day, time, year] = text.replace(" GMT", "").split(/\s+/);
  const [h, m, s] = time.split(":").map(Number);
  return Date.UTC(Number(year), months.indexOf(mon), Number(day), h, m, s);
}

describe("detectPrivateKey", () => {
  const KEY_LABELS = [
    "PRIVATE KEY",
    "RSA PRIVATE KEY",
    "EC PRIVATE KEY",
    "DSA PRIVATE KEY",
    "ENCRYPTED PRIVATE KEY",
    "OPENSSH PRIVATE KEY",
  ];
  const DECOY_LINES = [
    "-----BEGIN CERTIFICATE-----",
    "-----END CERTIFICATE-----",
    "-----BEGIN PUBLIC KEY-----",
    "-----BEGIN RSA PUBLIC KEY-----",
    "-----BEGIN CERTIFICATE REQUEST-----",
    "PRIVATE KEY",
    "BEGIN PRIVATE KEY",
    "-----BEGIN PRIVATE-----",
  ];
  const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  function randomNoise(random) {
    const lines = [];
    const count = Math.floor(random() * 8);
    for (let i = 0; i < count; i++) {
      if (random() < 0.35) {
        lines.push(DECOY_LINES[Math.floor(random() * DECOY_LINES.length)]);
      } else {
        let line = "";
        const len = Math.floor(random() * 70);
        for (let j = 0; j < len; j++) line += B64[Math.floor(random() * B64.length)];
        lines.push(line);
      }
    }
    return lines.join("\n");
  }

  it("flags exactly the inputs with a private-key armor line inserted at a random position", () => {
    const random = createRandom(SEED);
    const counts = { attempted: 0, executed: 0, discarded: 0, failing: 0, withKey: 0 };
    const failures = [];
    for (let n = 0; n < CASES; n++) {
      counts.attempted++;
      let text = randomNoise(random);
      let inserted = null;
      if (random() < 0.5) {
        const kind = random() < 0.7 ? "BEGIN" : "END";
        inserted = `-----${kind} ${KEY_LABELS[Math.floor(random() * KEY_LABELS.length)]}-----`;
        const at = Math.floor(random() * (text.length + 1));
        text = text.slice(0, at) + inserted + text.slice(at);
        counts.withKey++;
      }
      counts.executed++;
      const actual = detectPrivateKey(text);
      const ok = inserted ? actual === inserted : actual === null;
      if (!ok) {
        counts.failing++;
        if (failures.length < 3) failures.push({ text, inserted, actual });
      }
    }
    report("detectPrivateKey", counts);
    expect(failures).toEqual([]);
    expect(counts.withKey).toBeGreaterThan(CASES / 4);
  });

  it("refuses real key armor variants and ignores public material", () => {
    expect(detectPrivateKey("-----BEGIN PGP PRIVATE KEY BLOCK-----")).not.toBeNull();
    expect(detectPrivateKey("-----begin private key-----")).not.toBeNull();
    expect(detectPrivateKey(`${PEMS.leaf}\n-----BEGIN EC PRIVATE KEY-----\nMHc=`)).not.toBeNull();
    expect(detectPrivateKey(PEMS.leaf + PEMS.intermediate + PEMS.root)).toBeNull();
    expect(detectPrivateKey("-----BEGIN PUBLIC KEY-----\nMIIB\n-----END PUBLIC KEY-----")).toBeNull();
  });
});

describe("computeCertWarnings boundaries", () => {
  const NOW = Date.UTC(2026, 10, 5, 12, 0, 0);
  const BASE = {
    notBefore: NOW - 365 * DAY,
    notAfter: NOW + 365 * DAY,
    sanCount: 2,
    signatureAlgorithm: "sha256WithRSAEncryption",
    keyType: "RSA",
    rsaBits: 2048,
    isCA: false,
  };
  const TABLE = [
    ["baseline", {}, []],
    ["notAfter == now is still valid", { notAfter: NOW }, ["expires-soon"]],
    ["notAfter == now - 1ms", { notAfter: NOW - 1 }, ["expired"]],
    ["notAfter == now + 30d", { notAfter: NOW + 30 * DAY }, ["expires-soon"]],
    ["notAfter == now + 30d + 1ms", { notAfter: NOW + 30 * DAY + 1 }, []],
    ["notAfter == now + 29d", { notAfter: NOW + 29 * DAY }, ["expires-soon"]],
    ["notBefore == now", { notBefore: NOW }, []],
    ["notBefore == now + 1ms", { notBefore: NOW + 1 }, ["not-yet-valid"]],
    ["RSA 2047", { rsaBits: 2047 }, ["weak-rsa-key"]],
    ["RSA 2048", { rsaBits: 2048 }, []],
    ["RSA 1024", { rsaBits: 1024 }, ["weak-rsa-key"]],
    ["RSA 4096", { rsaBits: 4096 }, []],
    ["non-RSA key without bit count", { keyType: "Unknown", rsaBits: null }, []],
    ["no SAN on leaf", { sanCount: 0 }, ["no-san"]],
    ["no SAN on CA", { sanCount: 0, isCA: true }, []],
    ["one SAN", { sanCount: 1 }, []],
    ["sha1WithRSAEncryption", { signatureAlgorithm: "sha1WithRSAEncryption" }, ["weak-signature"]],
    ["md5WithRSAEncryption", { signatureAlgorithm: "md5WithRSAEncryption" }, ["weak-signature"]],
    ["md2WithRSAEncryption", { signatureAlgorithm: "md2WithRSAEncryption" }, ["weak-signature"]],
    ["ecdsa-with-SHA1", { signatureAlgorithm: "ecdsa-with-SHA1" }, ["weak-signature"]],
    ["raw sha1RSA OID", { signatureAlgorithm: "1.2.840.113549.1.1.5" }, ["weak-signature"]],
    ["raw md5RSA OID", { signatureAlgorithm: "1.2.840.113549.1.1.4" }, ["weak-signature"]],
    ["sha224WithRSAEncryption", { signatureAlgorithm: "sha224WithRSAEncryption" }, []],
    ["sha384WithRSAEncryption", { signatureAlgorithm: "sha384WithRSAEncryption" }, []],
    ["sha512WithRSAEncryption", { signatureAlgorithm: "sha512WithRSAEncryption" }, []],
    ["RSASSA-PSS", { signatureAlgorithm: "RSASSA-PSS" }, []],
    ["ecdsa-with-SHA256", { signatureAlgorithm: "ecdsa-with-SHA256" }, []],
    ["raw sha256RSA OID", { signatureAlgorithm: "1.2.840.113549.1.1.11" }, []],
    [
      "everything wrong at once",
      { notAfter: NOW - DAY, sanCount: 0, signatureAlgorithm: "sha1WithRSAEncryption", rsaBits: 1024 },
      ["expired", "no-san", "weak-signature", "weak-rsa-key"],
    ],
    [
      "not yet valid and expiring window both apply",
      { notBefore: NOW + DAY, notAfter: NOW + 2 * DAY },
      ["expires-soon", "not-yet-valid"],
    ],
  ];

  it.each(TABLE)("%s", (_name, override, expected) => {
    const codes = computeCertWarnings({ ...BASE, ...override }, NOW).map((w) => w.code);
    expect(codes.sort()).toEqual([...expected].sort());
  });

  it("matches an independent warning model over seeded random field objects", () => {
    const random = createRandom(SEED ^ 0x5a5a5a5a);
    const ALGS = [
      ["sha256WithRSAEncryption", false],
      ["sha384WithRSAEncryption", false],
      ["ecdsa-with-SHA384", false],
      ["sha1WithRSAEncryption", true],
      ["md5WithRSAEncryption", true],
      ["ecdsa-with-SHA1", true],
    ];
    const counts = { attempted: 0, executed: 0, discarded: 0, failing: 0 };
    const failures = [];
    for (let n = 0; n < CASES; n++) {
      counts.attempted++;
      const offsetAfter = Math.round((random() - 0.3) * 120 * DAY);
      const offsetBefore = Math.round((random() - 0.8) * 60 * DAY);
      const [alg, algWeak] = ALGS[Math.floor(random() * ALGS.length)];
      const fields = {
        notBefore: NOW + offsetBefore,
        notAfter: NOW + offsetAfter,
        sanCount: Math.floor(random() * 3),
        signatureAlgorithm: alg,
        keyType: random() < 0.8 ? "RSA" : "Unknown",
        rsaBits: 1024 + Math.floor(random() * 3) * 1024 + (random() < 0.2 ? -1 : 0),
        isCA: random() < 0.3,
      };
      if (fields.notBefore > fields.notAfter) {
        counts.discarded++;
        continue;
      }
      counts.executed++;
      const expected = [];
      if (offsetAfter < 0) expected.push("expired");
      if (offsetAfter >= 0 && offsetAfter <= 30 * DAY) expected.push("expires-soon");
      if (offsetBefore > 0) expected.push("not-yet-valid");
      if (!fields.isCA && fields.sanCount === 0) expected.push("no-san");
      if (algWeak) expected.push("weak-signature");
      if (fields.keyType === "RSA" && fields.rsaBits < 2048) expected.push("weak-rsa-key");
      const actual = computeCertWarnings(fields, NOW).map((w) => w.code).sort();
      if (JSON.stringify(actual) !== JSON.stringify(expected.sort())) {
        counts.failing++;
        if (failures.length < 3) failures.push({ fields, expected, actual });
      }
    }
    report("computeCertWarnings", counts);
    expect(failures).toEqual([]);
  });
});

describe("chain order over every arrangement of the fixture chain", () => {
  const PARENT = { leaf: "intermediate", intermediate: "root", root: "root" };

  function arrangements(items) {
    const out = [];
    const walk = (prefix, rest) => {
      if (prefix.length) out.push(prefix);
      rest.forEach((item, i) => walk([...prefix, item], [...rest.slice(0, i), ...rest.slice(i + 1)]));
    };
    walk([], items);
    return out;
  }

  const ALL = arrangements(["leaf", "intermediate", "root"]);

  it("covers all 15 non-empty ordered subsets", () => {
    expect(ALL).toHaveLength(15);
  });

  it.each(ALL.map((order) => [order.join(" > "), order]))("%s", (_label, order) => {
    const fields = order.map((name) => extractCertFields(forge, CERTS[name]));
    const result = checkChainOrder(fields);

    const expectedLinks = order.slice(0, -1).map((name, i) => PARENT[name] === order[i + 1]);
    expect(result.links.map((link) => link.ok)).toEqual(expectedLinks);
    expect(result.inOrder).toBe(expectedLinks.every(Boolean));
    expect(result.selfSigned).toEqual(order.map((name) => name === "root"));

    const signatures = order
      .slice(0, -1)
      .map((name, i) => verifyIssuedBy(CERTS[order[i + 1]], CERTS[name]).ok);
    expect(signatures).toEqual(expectedLinks);
  });

  it("verifies the root's self-signature and only its own", () => {
    expect(verifyIssuedBy(CERTS.root, CERTS.root).ok).toBe(true);
    expect(verifyIssuedBy(CERTS.intermediate, CERTS.intermediate).ok).toBe(false);
  });

  it("rejects a signature from a key that did not sign, even when the DNs match", () => {
    const keys = forge.pki.rsa.generateKeyPair({ bits: 512, e: 0x10001 });
    const impostor = forge.pki.createCertificate();
    impostor.publicKey = keys.publicKey;
    impostor.serialNumber = "01";
    impostor.validity.notBefore = new Date(Date.UTC(2026, 0, 1));
    impostor.validity.notAfter = new Date(Date.UTC(2027, 0, 1));
    impostor.setSubject(CERTS.intermediate.subject.attributes);
    impostor.setIssuer(CERTS.root.subject.attributes);
    impostor.sign(keys.privateKey, forge.md.sha256.create());
    expect(checkChainOrder([CERTS.leaf, impostor].map((c) => extractCertFields(forge, c))).inOrder).toBe(true);
    expect(verifyIssuedBy(impostor, CERTS.leaf).ok).toBe(false);
  });

  it("normalises case and whitespace when comparing DNs", () => {
    expect(checkChainOrder([{ subject: "CN=a", issuer: "CN=Root  CA " }, { subject: "cn=root ca", issuer: "x" }]).inOrder).toBe(true);
  });
});

describe("field extraction against openssl", () => {
  it.each(Object.keys(OPENSSL))("%s", (name) => {
    const expected = OPENSSL[name];
    const fields = extractCertFields(forge, CERTS[name]);
    expect(fields.subject).toBe(expected.subject);
    expect(fields.issuer).toBe(expected.issuer);
    expect(fields.notBefore).toBe(parseOpensslDate(expected.notBefore));
    expect(fields.notAfter).toBe(parseOpensslDate(expected.notAfter));
    expect(fields.sans).toEqual(expected.san);
    expect(fields.sanCount).toBe(expected.san.length);
    expect(fields.signatureAlgorithm).toBe(expected.signatureAlgorithm);
    expect(fields.keyType).toBe("RSA");
    expect(fields.rsaBits).toBe(expected.bits);
    expect(fields.isCA).toBe(expected.ca);
  });

  it("splits a concatenated bundle into its PEM blocks in order", () => {
    const bundle = `junk\n${PEMS.leaf}\n\n${PEMS.intermediate}${PEMS.root}trailer`;
    expect(extractPemCertificates(bundle)).toEqual([PEMS.leaf, PEMS.intermediate, PEMS.root].map((p) => p.trim()));
    expect(extractPemCertificates("no certs here")).toEqual([]);
  });
});


describe("parseCertificatePem against node:crypto X509Certificate", () => {
  const NAMES = [
    "leaf", "intermediate", "root", "dogfood-intermediate", "ec-leaf", "utf8-leaf", "ed25519-self", "ec-self",
    "ecc-root", "ecc-intermediate", "ecc-leaf", "ecc-leaf-tampered", "ed25519-root", "ed25519-leaf",
  ];
  const KEY_TYPES = { rsa: "RSA", ec: "EC", ed25519: "Ed25519" };
  const parsed = Object.fromEntries(NAMES.map((name) => [name, parseCertificatePem(forge, fixture(name))]));
  const oracle = Object.fromEntries(NAMES.map((name) => [name, new X509Certificate(fixture(name))]));

  it.each(NAMES)("%s: fingerprint, names, SANs and key type match", (name) => {
    const cert = parsed[name];
    const x509 = oracle[name];
    const fields = extractCertFields(forge, cert);
    expect(forge.md.sha256.create().update(cert.der).digest().toHex().toUpperCase()).toBe(x509.fingerprint256.replace(/:/g, ""));
    // node prints one RDN per line; the page joins them with ", ".
    expect(fields.subject).toBe(x509.subject.split("\n").join(", "));
    expect(fields.issuer).toBe(x509.issuer.split("\n").join(", "));
    // node spells IPv6 SANs out in full; compress them the way forge (and browsers) print them.
    const compressIpv6 = (san) =>
      san.startsWith("IP Address:") && san.includes(":", 11)
        ? "IP Address:" + new URL("http://[" + san.slice(11) + "]").hostname.slice(1, -1)
        : san;
    expect(fields.sans).toEqual(x509.subjectAltName ? x509.subjectAltName.split(", ").map(compressIpv6) : []);
    expect(fields.keyType).toBe(KEY_TYPES[x509.publicKey.asymmetricKeyType]);
    if (fields.keyType === "RSA") expect(cert.keyInfo.bits).toBe(x509.publicKey.asymmetricKeyDetails.modulusLength);
    if (fields.keyType === "EC") expect(cert.keyInfo.curve).toBe({ prime256v1: "P-256", secp384r1: "P-384", secp521r1: "P-521" }[x509.publicKey.asymmetricKeyDetails.namedCurve]);
  });

  it("decodes extended key usage and AIA like node:crypto", () => {
    const ext = describeCertExtensions(forge, parsed["ec-leaf"]);
    expect(ext.extKeyUsage.map((name) => forge.pki.oids[name])).toEqual(oracle["ec-leaf"].keyUsage);
    expect(ext.aia.map((line) => line.replace(": ", " - URI:"))).toEqual(oracle["ec-leaf"].infoAccess.trim().split("\n"));
    expect(ext.crl).toEqual(["http://crl.example.test/int.crl"]);
    expect(ext.keyUsage).toEqual(["digitalSignature", "keyEncipherment"]);
  });

  it("verifies signatures with node:crypto agreement and never fails a signature it cannot check", () => {
    const pairs = [
      ["ec-leaf", "dogfood-intermediate"],
      ["leaf", "intermediate"],
      ["intermediate", "root"],
      ["root", "root"],
      ["ec-self", "ec-self"],
      ["ed25519-self", "ed25519-self"],
      ["ec-leaf", "intermediate"],
    ];
    for (const [child, issuer] of pairs) {
      const result = verifyIssuedBy(parsed[issuer], parsed[child]);
      const expected = oracle[child].checkIssued(oracle[issuer]) && oracle[child].verify(oracle[issuer].publicKey);
      if (result.unsupported) {
        expect(parsed[issuer].keyInfo.type).not.toBe("RSA");
      } else {
        expect([child, issuer, result.ok]).toEqual([child, issuer, expected]);
      }
    }
  });
});


// ECDSA / Ed25519 chains generated with OpenSSL 4.1.0 (keys discarded):
//   ecc-root (P-384, ecdsa-with-SHA384, self) > ecc-intermediate (P-521 key, SHA-384) > ecc-leaf (P-256 key, SHA-512)
//   ed25519-root (Ed25519, self) > ed25519-leaf (P-256 key, Ed25519 signature)
//   ecc-leaf-tampered: ecc-leaf with its SAN changed to "Ecc-leaf..."; openssl verify reports error 7.
describe("verifySignatureWebCrypto against node:crypto X509Certificate.verify", () => {
  const subtle = globalThis.crypto.subtle;
  const der = (name) => forge.pem.decode(fixture(name))[0].body;
  const x509 = (name) => new X509Certificate(fixture(name));
  const PAIRS = [
    ["ecc-root", "ecc-root", true],
    ["ecc-intermediate", "ecc-root", true],
    ["ecc-leaf", "ecc-intermediate", true],
    ["ec-self", "ec-self", true],
    ["ed25519-self", "ed25519-self", true],
    ["ed25519-root", "ed25519-root", true],
    ["ed25519-leaf", "ed25519-root", true],
    ["ecc-leaf-tampered", "ecc-intermediate", false],
    ["ecc-leaf", "ecc-root", false],
    ["ecc-intermediate", "ecc-intermediate", false],
    ["ed25519-leaf", "ed25519-self", false],
    ["ed25519-leaf", "ecc-intermediate", false],
    ["ecc-leaf", "ed25519-root", false],
    ["ecc-leaf", "intermediate", false],
  ];

  it.each(PAIRS)("%s issued by %s -> %s", async (child, issuer, expected) => {
    expect(x509(child).verify(x509(issuer).publicKey)).toBe(expected);
    const result = await verifySignatureWebCrypto(subtle, der(issuer), der(child));
    expect(result.unsupported).toBe(false);
    expect(result.ok).toBe(expected);
    if (!expected) expect(result.error).toBeTruthy();
  });

  it("is what the page falls back to: verifyIssuedBy marks these unsupported, then WebCrypto decides", async () => {
    for (const [child, issuer, expected] of PAIRS.filter(([, issuer]) => issuer !== "intermediate")) {
      const forgeResult = verifyIssuedBy(parseCertificatePem(forge, fixture(issuer)), parseCertificatePem(forge, fixture(child)));
      expect([child, issuer, forgeResult.unsupported]).toEqual([child, issuer, true]);
      expect((await verifySignatureWebCrypto(subtle, der(issuer), der(child))).ok).toBe(expected);
    }
  });

  it("agrees with node:crypto on seeded single-byte corruptions of each signed certificate", async () => {
    const random = createRandom(SEED ^ 0x0ec0ec0e);
    const valid = PAIRS.filter(([, , ok]) => ok);
    const counts = { attempted: 0, executed: 0, discarded: 0, failing: 0, oracleParsed: 0 };
    const failures = [];
    for (let n = 0; n < 400; n++) {
      counts.attempted++;
      const [child, issuer] = valid[Math.floor(random() * valid.length)];
      const original = der(child);
      const at = Math.floor(random() * original.length);
      const flipped = String.fromCharCode(original.charCodeAt(at) ^ (1 + Math.floor(random() * 255)));
      const corrupt = original.slice(0, at) + flipped + original.slice(at + 1);
      const issuerDer = child === issuer ? corrupt : der(issuer);
      let expected = false;
      try {
        const oracleIssuer = new X509Certificate(Buffer.from(issuerDer, "binary"));
        expected = new X509Certificate(Buffer.from(corrupt, "binary")).verify(oracleIssuer.publicKey);
        counts.oracleParsed++;
      } catch {
        expected = false;
      }
      counts.executed++;
      const result = await verifySignatureWebCrypto(subtle, issuerDer, corrupt);
      if (result.ok !== expected) {
        counts.failing++;
        if (failures.length < 3) failures.push({ child, at, expected, result });
      }
    }
    report("verifySignatureWebCrypto corruptions", counts);
    expect(failures).toEqual([]);
    expect(counts.oracleParsed).toBeGreaterThan(100);
  });

  it("calibration: verifying the DER signature as-is, or with the wrong hash, fails where the converted one passes", async () => {
    const leaf = der("ecc-leaf");
    const issuer = new X509Certificate(fixture("ecc-intermediate")).publicKey.export({ type: "spki", format: "der" });
    const key = await subtle.importKey("spki", issuer, { name: "ECDSA", namedCurve: "P-521" }, false, ["verify"]);
    // Independent TLV walk: Certificate ::= SEQUENCE { tbs, signatureAlgorithm, BIT STRING signature }.
    const tlv = (offset) => {
      const first = leaf.charCodeAt(offset + 1);
      const count = first & 0x80 ? first & 0x7f : 0;
      let length = count ? 0 : first;
      for (let i = 0; i < count; i++) length = length * 256 + leaf.charCodeAt(offset + 2 + i);
      return { start: offset, body: offset + 2 + count, end: offset + 2 + count + length };
    };
    const tbsNode = tlv(tlv(0).body);
    const sigNode = tlv(tlv(tbsNode.end).end);
    const tbs = Buffer.from(leaf.slice(tbsNode.start, tbsNode.end), "binary");
    const derSignature = Buffer.from(leaf.slice(sigNode.body + 1, sigNode.end), "binary");
    expect([tbs[0], derSignature[0], sigNode.end]).toEqual([0x30, 0x30, leaf.length]);
    expect(await subtle.verify({ name: "ECDSA", hash: "SHA-512" }, key, derSignature, tbs)).toBe(false);
    expect((await verifySignatureWebCrypto(subtle, der("ecc-intermediate"), leaf)).ok).toBe(true);
    // Same bytes relabelled ecdsa-with-SHA384 in both AlgorithmIdentifiers: the hash comes from the OID, so it must fail.
    const relabelled = leaf.split("\u002a\u0086\u0048\u00ce\u003d\u0004\u0003\u0004").join("\u002a\u0086\u0048\u00ce\u003d\u0004\u0003\u0003");
    expect(relabelled).not.toBe(leaf);
    expect((await verifySignatureWebCrypto(subtle, der("ecc-intermediate"), relabelled)).ok).toBe(false);
  });

  it("keeps Ed25519 as not checked, with the reason, when the browser's WebCrypto lacks it", async () => {
    const noEd25519 = {
      importKey: async (format, data, alg, ...rest) => {
        if (alg.name === "Ed25519") throw new DOMException("Unrecognized name.", "NotSupportedError");
        return subtle.importKey(format, data, alg, ...rest);
      },
      verify: (...args) => subtle.verify(...args),
    };
    const ed = await verifySignatureWebCrypto(noEd25519, der("ed25519-root"), der("ed25519-leaf"));
    expect(ed).toMatchObject({ ok: false, unsupported: true });
    expect(ed.error).toMatch(/Ed25519.*NotSupportedError/);
    expect((await verifySignatureWebCrypto(noEd25519, der("ecc-intermediate"), der("ecc-leaf"))).ok).toBe(true);
  });

  it("reports no-WebCrypto and non-ECDSA/Ed25519 algorithms as not checked rather than failed", async () => {
    expect(await verifySignatureWebCrypto(undefined, der("ecc-root"), der("ecc-root"))).toMatchObject({ ok: false, unsupported: true });
    expect(await verifySignatureWebCrypto(subtle, der("intermediate"), der("leaf"))).toMatchObject({ ok: false, unsupported: true });
  });
});
