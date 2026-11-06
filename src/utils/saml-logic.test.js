import { describe, expect, it } from "vitest";
import {
  checkSamlTimeWindow,
  diagnoseSaml,
  extractSamlPayload,
  formatSamlKeyFields,
  prettyPrintSamlXml,
} from "./saml-logic.js";

const PROPERTY_SEED = 0x5a4d1e02;
const PROPERTY_CASES = 2000;
const SUCCESS = "urn:oasis:names:tc:SAML:2.0:status:Success";
const STATUS_CODES = [
  SUCCESS,
  "urn:oasis:names:tc:SAML:2.0:status:Requester",
  "urn:oasis:names:tc:SAML:2.0:status:Responder",
  "urn:oasis:names:tc:SAML:2.0:status:VersionMismatch",
  "urn:oasis:names:tc:SAML:2.0:status:AuthnFailed",
  "urn:oasis:names:tc:SAML:2.0:status:RequestDenied",
];

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randomInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

function nearOffset(random) {
  return random() < 0.5 ? randomInt(random, -1, 1) : randomInt(random, -5000, 5000);
}

// Oracle: SAML 2.0 Core 2.5.1.2, NotBefore inclusive, NotOnOrAfter exclusive.
function oracleWindow(nbMs, naMs, nowMs) {
  if (nowMs < nbMs) return "not-yet-valid";
  if (nowMs >= naMs) return "expired";
  return "valid";
}

function wrongInclusiveWindow(nbMs, naMs, nowMs) {
  if (nowMs < nbMs) return "not-yet-valid";
  if (nowMs > naMs) return "expired";
  return "valid";
}

function runWindowProperty(classify) {
  const random = createRandom(PROPERTY_SEED);
  const stats = { attempted: 0, executed: 0, discarded: 0, failing: 0, firstFailure: null };
  for (let index = 0; index < PROPERTY_CASES; index++) {
    stats.attempted++;
    const nbMs = Date.UTC(2020, 0, 1) + randomInt(random, 0, 4e11);
    const naMs = nbMs + randomInt(random, -2000, 600000);
    if (naMs <= nbMs) {
      stats.discarded++;
      continue;
    }
    const nowMs = (random() < 0.5 ? nbMs : naMs) + nearOffset(random);
    stats.executed++;
    const nb = new Date(nbMs).toISOString();
    const na = new Date(naMs).toISOString();
    const actual = classify(nb, na, nowMs);
    const expected = oracleWindow(nbMs, naMs, nowMs);
    if (actual !== expected) {
      stats.failing++;
      stats.firstFailure ??= { nb, na, nowMs, actual, expected };
    }
  }
  return stats;
}

describe("checkSamlTimeWindow", () => {
  it("matches the SAML core inclusive/exclusive window oracle for seeded times", () => {
    const stats = runWindowProperty((nb, na, now) => checkSamlTimeWindow(nb, na, now).state);
    expect(stats.firstFailure).toBeNull();
    expect(stats.executed).toBeGreaterThan(PROPERTY_CASES / 2);
    expect(stats.failing).toBe(0);
  });

  it("calibration: an inclusive NotOnOrAfter comparison is caught by the property", () => {
    const stats = runWindowProperty((nb, na, now) => {
      return wrongInclusiveWindow(Date.parse(nb), Date.parse(na), now);
    });
    expect(stats.failing).toBeGreaterThan(0);
  });

  it("treats the exact boundaries per spec", () => {
    const nb = "2024-01-01T12:00:00Z";
    const na = "2024-01-01T12:05:00.000Z";
    expect(checkSamlTimeWindow(nb, na, Date.parse(nb)).state).toBe("valid");
    expect(checkSamlTimeWindow(nb, na, Date.parse(nb) - 1).state).toBe("not-yet-valid");
    expect(checkSamlTimeWindow(nb, na, Date.parse(na) - 1).state).toBe("valid");
    expect(checkSamlTimeWindow(nb, na, Date.parse(na)).state).toBe("expired");
  });

  it("handles missing and unparseable bounds", () => {
    expect(checkSamlTimeWindow(null, null, 0).state).toBe("unbounded");
    expect(checkSamlTimeWindow(null, "2024-01-01T00:00:00Z", 0).state).toBe("valid");
    expect(checkSamlTimeWindow("garbage", null, 0)).toMatchObject({
      state: "invalid-timestamp",
      badField: "NotBefore",
    });
  });
});

describe("diagnoseSaml", () => {
  const base = {
    issuer: "https://idp.example.com",
    audiences: ["https://sp.example.com"],
    destination: "https://sp.example.com/acs",
    recipient: "https://sp.example.com/acs",
    notBefore: "2024-01-01T12:00:00Z",
    notOnOrAfter: "2024-01-01T12:05:00Z",
    statusCode: SUCCESS,
    hasSignature: true,
  };
  const inWindow = Date.parse("2024-01-01T12:01:00Z");
  const ids = (list) => list.map((d) => d.id);

  it("reports nothing for a clean in-window signed Success response", () => {
    expect(
      diagnoseSaml(base, inWindow, { entityId: "https://sp.example.com", acsUrl: "https://sp.example.com/acs" }),
    ).toEqual([]);
  });

  it("flags expiry at NotOnOrAfter and mentions clock skew when early", () => {
    expect(ids(diagnoseSaml(base, Date.parse(base.notOnOrAfter)))).toEqual(["expired"]);
    const early = diagnoseSaml(base, Date.parse(base.notBefore) - 3000);
    expect(ids(early)).toEqual(["not-yet-valid"]);
    expect(early[0].detail).toContain("clock skew");
  });

  it("flags audience mismatch exactly when the expected entity ID is absent (seeded)", () => {
    const random = createRandom(PROPERTY_SEED ^ 0xa0d1);
    const pool = ["https://sp.example.com", "https://sp.example.com/", "urn:sp", "URN:SP", "sp", "https://other"];
    let executed = 0;
    let failing = 0;
    for (let index = 0; index < 500; index++) {
      const audiences = pool.filter(() => random() < 0.4);
      const entityId = pool[randomInt(random, 0, pool.length - 1)];
      executed++;
      const expected = audiences.length > 0 && !audiences.includes(entityId);
      const actual = ids(diagnoseSaml({ ...base, audiences }, inWindow, { entityId })).includes("audience-mismatch");
      if (actual !== expected) failing++;
    }
    expect(executed).toBe(500);
    expect(failing).toBe(0);
  });

  it("flags Destination or Recipient mismatch against the ACS URL", () => {
    expect(ids(diagnoseSaml(base, inWindow, { acsUrl: "https://sp.example.com/acs/" }))).toEqual([
      "destination-mismatch",
    ]);
    expect(
      ids(diagnoseSaml({ ...base, recipient: "https://lb.internal/acs" }, inWindow, { acsUrl: base.destination })),
    ).toEqual(["destination-mismatch"]);
    expect(ids(diagnoseSaml(base, inWindow, { acsUrl: "" }))).toEqual([]);
  });

  it("flags every status code except Success", () => {
    for (const statusCode of STATUS_CODES) {
      const flagged = ids(diagnoseSaml({ ...base, statusCode }, inWindow)).includes("status-not-success");
      expect(flagged).toBe(statusCode !== SUCCESS);
    }
  });

  it("flags a missing Signature element", () => {
    expect(ids(diagnoseSaml({ ...base, hasSignature: false }, inWindow))).toEqual(["no-signature"]);
  });
});

describe("formatSamlKeyFields", () => {
  it("shows 'not present' for missing values and counts attributes", () => {
    const rows = formatSamlKeyFields({ issuer: "idp", audiences: [], attributeCount: 3 });
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.value]));
    expect(byLabel.Issuer).toBe("idp");
    expect(byLabel.Audience).toBe("not present");
    expect(byLabel.NameID).toBe("not present");
    expect(byLabel["Attribute count"]).toBe("3");
  });
});


describe("extractSamlPayload", () => {
  const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  function randomBase64(random) {
    let out = "";
    const length = randomInt(random, 4, 400);
    for (let i = 0; i < length; i++) out += B64[randomInt(random, 0, B64.length - 1)];
    return out + "=".repeat(randomInt(random, 0, 2));
  }

  it("recovers the exact Base64 value from every paste shape (oracle: encodeURIComponent / URLSearchParams)", () => {
    const random = createRandom(PROPERTY_SEED ^ 0x0bad5eed);
    const failures = [];
    for (let n = 0; n < PROPERTY_CASES; n++) {
      const value = randomBase64(random);
      const name = random() < 0.5 ? "SAMLResponse" : "SAMLRequest";
      const query = new URLSearchParams({ [name]: value, RelayState: "r" + n }).toString();
      const shapes = [
        [value, null],
        [encodeURIComponent(value), null],
        [name + "=" + encodeURIComponent(value), name],
        ["https://idp.example.com/sso?" + query, name],
        ["  " + "https://sp.example.com/acs?RelayState=x&" + name + "=" + encodeURIComponent(value) + "&Sig=abc  ", name],
      ];
      for (const [input, parameter] of shapes) {
        const result = extractSamlPayload(input);
        if (result.payload !== value || result.parameter !== parameter) failures.push({ input, result, value });
      }
    }
    expect(failures.slice(0, 3)).toEqual([]);
  });

  it("leaves raw XML and malformed percent-encoding alone", () => {
    expect(extractSamlPayload(' <samlp:Response a="SAMLResponse=x"/>').payload).toBe('<samlp:Response a="SAMLResponse=x"/>');
    expect(extractSamlPayload("abc%E0%A4%A").payload).toBe("abc%E0%A4%A");
  });
});

describe("prettyPrintSamlXml", () => {
  it("does not let the XML declaration or comments open an indent level", () => {
    const xml = '<?xml version="1.0"?><!-- c --><a><b>t</b><!-- d --><c/><e x="1"><f>u</f></e></a>';
    expect(prettyPrintSamlXml(xml)).toBe(
      ['<?xml version="1.0"?>', "<!-- c -->", "<a>", "  <b>t</b>", "  <!-- d -->", "  <c/>", '  <e x="1">', "    <f>u</f>", "  </e>", "</a>"].join("\n"),
    );
  });

  it("keeps every tag and text in order and is idempotent over random trees", () => {
    const random = createRandom(PROPERTY_SEED ^ 0x9e77);
    function tree(depth) {
      const name = "n" + randomInt(random, 0, 9);
      if (depth > 3 || random() < 0.3) return random() < 0.5 ? "<" + name + "/>" : "<" + name + ">v" + randomInt(random, 0, 99) + "</" + name + ">";
      let children = "";
      for (let i = randomInt(random, 1, 3); i > 0; i--) children += random() < 0.15 ? "<!-- k -->" : tree(depth + 1);
      return "<" + name + ' a="' + depth + '">' + children + "</" + name + ">";
    }
    for (let n = 0; n < 500; n++) {
      const xml = (random() < 0.5 ? '<?xml version="1.0"?>' : "") + tree(0);
      const pretty = prettyPrintSamlXml(xml);
      expect(pretty.split("\n").map((line) => line.trim()).join("")).toBe(xml);
      expect(prettyPrintSamlXml(pretty)).toBe(pretty);
      const lastLine = pretty.split("\n").pop();
      expect(lastLine.startsWith(" ")).toBe(false);
    }
  });
});

describe("diagnoseSaml with an EncryptedAssertion", () => {
  it("explains the encryption instead of only reporting a missing signature", () => {
    const ids = diagnoseSaml({ hasSignature: false, hasEncryptedAssertion: true, statusCode: SUCCESS }, Date.now(), {}).map((f) => f.id);
    expect(ids).toEqual(["encrypted-assertion", "no-signature"]);
    const plain = diagnoseSaml({ hasSignature: true, statusCode: SUCCESS }, Date.now(), {});
    expect(plain).toEqual([]);
  });
});
