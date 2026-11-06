// Injected into the DNS reference script with fn.toString(); self-contained.
// Returns an ASCII (punycode) DNS name or IP literal safe to paste into a
// shell command, or an error. Anything with shell metacharacters is refused.
export function normalizeDnsTarget(text) {
  const raw = String(text || "").trim().replace(/\.$/, "");
  if (!raw) return { name: "" };
  if (/^[0-9a-f:]+$/i.test(raw) && raw.includes(":")) return { name: raw.toLowerCase() };
  let ascii;
  try {
    ascii = new URL("http://" + raw + "/").hostname;
  } catch (e) {
    return { error: "\"" + raw + "\" is not a valid domain name." };
  }
  if (ascii !== raw.toLowerCase() && !/[^\x00-\x7f]/.test(raw)) {
    return { error: "\"" + raw + "\" is not a valid domain name." };
  }
  if (!/^[a-z0-9_]([a-z0-9_-]{0,62})(\.[a-z0-9_]([a-z0-9_-]{0,62}))*$/.test(ascii) || ascii.length > 253) {
    return { error: "\"" + raw + "\" is not a valid domain name." };
  }
  return { name: ascii };
}
