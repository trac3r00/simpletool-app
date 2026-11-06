// Pure helpers for the webhook inspector, injected into the page's inline
// script with fn.toString(); each may only reference the others exported here.

// POSIX single-quote quoting: nothing inside '...' is expanded, and a literal
// quote is written as '\'' (close, escaped quote, reopen).
export function shellQuote(value) {
  return "'" + String(value).replace(/'/g, "'\\''") + "'";
}

export function buildCurlCommand(method, url, headers, body) {
  let cmd = "curl -X " + method + " " + shellQuote(url);
  Object.keys(headers).forEach((name) => {
    cmd += " \\\n  -H " + shellQuote(name + ": " + headers[name]);
  });
  if (body && method !== "GET" && method !== "HEAD") {
    cmd += " \\\n  --data-raw " + shellQuote(body);
  }
  return cmd;
}

export function utf8ByteLength(text) {
  return new TextEncoder().encode(String(text || "")).length;
}

// Stripe can send several v1 signatures during secret rotation; any match is valid.
export function signatureCandidates(header, value) {
  const text = String(value || "").trim();
  if (header === "stripe-signature") {
    const all = text
      .split(",")
      .map((part) => /^\s*v1=(.+)$/.exec(part))
      .filter(Boolean)
      .map((m) => m[1].trim());
    if (all.length) return all;
  }
  const prefixed = /^(?:sha1|sha256|sha512|v0|v1)=(.+)$/i.exec(text);
  return [prefixed ? prefixed[1].trim() : text];
}
