/**
 * Pure SAML diagnostics used by /saml-decoder.
 *
 * Every function here is injected into the page via `fn.toString()`, so each
 * one must stay self-contained: no imports, no module-level constants, and
 * calls only to the other functions in this file (they are injected together).
 */

/**
 * Evaluate a SAML validity window per SAML 2.0 Core 2.5.1.2:
 * valid when NotBefore <= now < NotOnOrAfter (NotBefore inclusive,
 * NotOnOrAfter exclusive). Missing bounds are unbounded.
 */
export function checkSamlTimeWindow(notBefore, notOnOrAfter, nowMs) {
  var notBeforeMs = notBefore ? Date.parse(notBefore) : null;
  var notOnOrAfterMs = notOnOrAfter ? Date.parse(notOnOrAfter) : null;
  var result = {
    state: "valid",
    notBeforeMs: notBeforeMs,
    notOnOrAfterMs: notOnOrAfterMs,
    badField: null,
  };
  if (notBeforeMs !== null && Number.isNaN(notBeforeMs)) {
    result.state = "invalid-timestamp";
    result.badField = "NotBefore";
    return result;
  }
  if (notOnOrAfterMs !== null && Number.isNaN(notOnOrAfterMs)) {
    result.state = "invalid-timestamp";
    result.badField = "NotOnOrAfter";
    return result;
  }
  if (notBeforeMs === null && notOnOrAfterMs === null) {
    result.state = "unbounded";
    return result;
  }
  if (notBeforeMs !== null && nowMs < notBeforeMs) {
    result.state = "not-yet-valid";
  } else if (notOnOrAfterMs !== null && nowMs >= notOnOrAfterMs) {
    result.state = "expired";
  }
  return result;
}

export function formatSamlKeyFields(fields) {
  function show(value) {
    if (value === null || value === undefined) return "not present";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "not present";
    var text = String(value).trim();
    return text ? text : "not present";
  }
  return [
    { label: "Issuer", value: show(fields.issuer) },
    { label: "NameID", value: show(fields.nameId) },
    { label: "NameID Format", value: show(fields.nameIdFormat) },
    { label: "Audience", value: show(fields.audiences) },
    { label: "Destination", value: show(fields.destination) },
    { label: "Recipient", value: show(fields.recipient) },
    { label: "InResponseTo", value: show(fields.inResponseTo) },
    { label: "IssueInstant", value: show(fields.issueInstant) },
    { label: "NotBefore", value: show(fields.notBefore) },
    { label: "NotOnOrAfter", value: show(fields.notOnOrAfter) },
    { label: "StatusCode", value: show(fields.statusCode) },
    { label: "AuthnContextClassRef", value: show(fields.authnContextClassRef) },
    { label: "Attribute count", value: String(fields.attributeCount || 0) },
  ];
}

export function diagnoseSaml(fields, nowMs, expected) {
  var out = [];
  var exp = expected || {};
  var entityId = (exp.entityId || "").trim();
  var acsUrl = (exp.acsUrl || "").trim();
  var nowIso = new Date(nowMs).toISOString();

  var win = checkSamlTimeWindow(fields.notBefore || null, fields.notOnOrAfter || null, nowMs);
  if (win.state === "expired") {
    out.push({
      id: "expired",
      severity: "error",
      title: "Assertion expired",
      detail:
        "NotOnOrAfter is " + fields.notOnOrAfter + " and the current time is " + nowIso +
        " (" + Math.round((nowMs - win.notOnOrAfterMs) / 1000) +
        " s past). NotOnOrAfter is exclusive, so the assertion is rejected at that instant. " +
        "Request a fresh response; if it is only slightly past, check the SP and IdP clocks.",
    });
  } else if (win.state === "not-yet-valid") {
    out.push({
      id: "not-yet-valid",
      severity: "error",
      title: "Assertion not yet valid",
      detail:
        "NotBefore is " + fields.notBefore + " and the current time is " + nowIso +
        " (" + Math.round((win.notBeforeMs - nowMs) / 1000) +
        " s early). This usually means clock skew: the IdP clock is ahead of the SP clock. " +
        "Sync both with NTP or allow a small skew tolerance on the SP.",
    });
  } else if (win.state === "invalid-timestamp") {
    out.push({
      id: "invalid-timestamp",
      severity: "warning",
      title: win.badField + " is not a valid timestamp",
      detail: "Could not parse " + win.badField + " as an xs:dateTime value, so the validity window was not checked.",
    });
  }

  var audiences = fields.audiences || [];
  if (entityId && audiences.length && audiences.indexOf(entityId) === -1) {
    out.push({
      id: "audience-mismatch",
      severity: "error",
      title: "Audience mismatch",
      detail:
        "Expected SP entity ID " + entityId + " but the assertion's Audience is " +
        audiences.join(", ") + ". Make the SP entity ID and the IdP's configured audience identical (exact string match).",
    });
  }

  if (acsUrl) {
    var mismatches = [];
    if (fields.destination && fields.destination !== acsUrl) {
      mismatches.push("Destination is " + fields.destination);
    }
    if (fields.recipient && fields.recipient !== acsUrl) {
      mismatches.push("Recipient is " + fields.recipient);
    }
    if (mismatches.length) {
      out.push({
        id: "destination-mismatch",
        severity: "error",
        title: "Destination / Recipient mismatch",
        detail:
          "Expected ACS URL " + acsUrl + " but " + mismatches.join(" and ") +
          ". Check scheme, host, port, path and trailing slash; a proxy or load balancer can also change the URL the SP sees.",
      });
    }
  }

  var successCode = "urn:oasis:names:tc:SAML:2.0:status:Success";
  if (fields.statusCode && fields.statusCode !== successCode) {
    out.push({
      id: "status-not-success",
      severity: "error",
      title: "Status is not Success",
      detail:
        "StatusCode is " + fields.statusCode +
        ". The IdP did not authenticate the user; check the IdP logs for the reason.",
    });
  }

  if (fields.hasEncryptedAssertion) {
    out.push({
      id: "encrypted-assertion",
      severity: "warning",
      title: "Assertion is encrypted",
      detail:
        "The Response carries an EncryptedAssertion. Its Subject, Conditions, Audience and attributes can only be read with the SP's " +
        "private key, so they show as not present here and were not checked.",
    });
  }

  if (!fields.hasSignature) {
    out.push({
      id: "no-signature",
      severity: "warning",
      title: "No Signature element",
      detail: fields.hasEncryptedAssertion
        ? "The Response itself has no ds:Signature element. A signature inside the encrypted Assertion cannot be seen without decrypting it. " +
          "This tool does not verify signatures."
        : "Neither the Response nor the Assertion contains a ds:Signature element. Most SPs require a signed Response or Assertion " +
          "(the HTTP-Redirect binding signs via a query parameter instead). This tool does not verify signatures.",
    });
  }

  return out;
}

/**
 * Pull the Base64 (or raw XML) SAML message out of what people actually paste:
 * a bare value, a percent-encoded form value (DevTools "view source"), a
 * "SAMLResponse=..." form field, or a full HTTP-Redirect URL with SAMLRequest/SAMLResponse.
 * A literal "+" is kept as "+": it is a Base64 character, and form encoders write it as %2B.
 */
export function extractSamlPayload(input) {
  var text = String(input === null || input === undefined ? "" : input).trim();
  if (text.charAt(0) === "<") return { payload: text, parameter: null };
  var parameter = null;
  var match = /(?:^|[?&#\s])(SAMLResponse|SAMLRequest)=([^&#\s]*)/.exec(text);
  if (match) {
    parameter = match[1];
    text = match[2];
  }
  if (/%[0-9A-Fa-f]{2}/.test(text)) {
    try {
      text = decodeURIComponent(text);
    } catch (err) {
      // Not valid percent-encoding: leave it for the Base64 step to reject.
    }
  }
  return { payload: text, parameter: parameter };
}

/**
 * Indent XML one element per line. Declarations (<?...?>), comments and
 * doctype lines never open a level, so they do not shift the rest of the tree.
 */
export function prettyPrintSamlXml(xml) {
  var indent = 0;
  var result = "";
  var lines = String(xml).replace(/>\s*</g, ">\n<").split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    if (line.indexOf("</") === 0) indent = Math.max(0, indent - 1);
    result += "  ".repeat(indent) + line + "\n";
    var opensLevel =
      line.charAt(0) === "<" &&
      line.indexOf("</") !== 0 &&
      line.indexOf("<?") !== 0 &&
      line.indexOf("<!") !== 0 &&
      line.slice(-2) !== "/>" &&
      line.indexOf("</") === -1;
    if (opensLevel) indent++;
  }
  return result.trim();
}
