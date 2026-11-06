// Injected into the protocol-headers script with fn.toString(); self-contained.
// Accepts the hex formats people actually paste: spaced bytes, a continuous
// stream (Wireshark "Copy as Hex Stream"), 2-byte groups with offsets
// (tcpdump -x/-xx, xxd), hexdump -C, colon-separated, and 0x-prefixed lists.
// Per line, an optional offset is dropped, then hex tokens are read until the
// first non-hex token (the ASCII column of xxd / tcpdump -X).
export function parseHexDump(text) {
  const bytes = [];
  const lines = String(text || "").split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines.length > 1 && /^\s*[0-9a-f]{7,8}\s*$/i.test(lines[i])) continue;
    let line = lines[i].replace(/\|.*\|\s*$/, "");
    line = line.replace(/^\s*(?:0x)?[0-9a-f]{4,8}:\s*/i, "");
    line = line.replace(/^\s*[0-9a-f]{7,8}(?=\s{2})/i, "");
    line = line.replace(/,/g, " ").replace(/\b0x(?=[0-9a-f])/gi, "");
    if (/^\s*([0-9a-f]{2}:){2,}[0-9a-f]{2}\s*$/i.test(line)) line = line.replace(/:/g, " ");
    const tokens = line.trim().split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      if (!/^[0-9a-f]+$/i.test(token)) break;
      if (token.length % 2) {
        return { error: "Line " + (i + 1) + ": \"" + token + "\" has an odd number of hex digits." };
      }
      for (let j = 0; j < token.length; j += 2) bytes.push(parseInt(token.slice(j, j + 2), 16));
    }
  }
  if (!bytes.length) return { error: "No hex bytes found." };
  return { bytes };
}
