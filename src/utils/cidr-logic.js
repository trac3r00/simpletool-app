// Pure address helpers for the CIDR calculator. Each function is injected into
// the page's inline script with fn.toString(), so every one must be
// self-contained apart from the other helpers exported here (which are
// injected under the same names).

export function isValidIPv4(ip) {
  const octets = String(ip).split(".");
  if (octets.length !== 4) return false;
  return octets.every((octet) => {
    if (octet === "" || octet.length > 3 || /[^0-9]/.test(octet)) return false;
    const value = Number(octet);
    return value >= 0 && value <= 255;
  });
}

// Returns the fully expanded form (8 groups of 4 lowercase hex digits) or null
// when the text is not a valid IPv6 address. Accepts an embedded IPv4 tail.
export function expandIPv6(address) {
  let text = String(address).trim().toLowerCase();
  if (!text || /[^0-9a-f:.]/.test(text)) return null;
  if (text.includes(".")) {
    const lastColon = text.lastIndexOf(":");
    if (lastColon === -1) return null;
    const ipv4Part = text.slice(lastColon + 1);
    if (!isValidIPv4(ipv4Part)) return null;
    const octets = ipv4Part.split(".").map(Number);
    const high = ((octets[0] << 8) | octets[1]).toString(16);
    const low = ((octets[2] << 8) | octets[3]).toString(16);
    text = text.slice(0, lastColon + 1) + high + ":" + low;
  }
  const halves = text.split("::");
  if (halves.length > 2) return null;
  const toGroups = (part) => (part === "" ? [] : part.split(":"));
  const head = toGroups(halves[0]);
  const tail = halves.length === 2 ? toGroups(halves[1]) : [];
  const groups = [...head, ...tail];
  if (!groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return null;
  let full;
  if (halves.length === 2) {
    const missing = 8 - groups.length;
    if (missing < 1) return null;
    full = [...head, ...new Array(missing).fill("0"), ...tail];
  } else {
    if (groups.length !== 8) return null;
    full = groups;
  }
  return full.map((g) => g.padStart(4, "0")).join(":");
}

// RFC 5952 canonical text: lowercase, leading zeros dropped, the first longest
// run of two or more zero groups replaced by "::".
export function compressIPv6(address) {
  const expanded = expandIPv6(address);
  if (!expanded) return address;
  const parts = expanded.split(":").map((p) => p.replace(/^0+/, "") || "0");
  let bestStart = -1;
  let bestLength = 0;
  for (let i = 0; i < 8; ) {
    if (parts[i] !== "0") {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && parts[j] === "0") j++;
    if (j - i > bestLength) {
      bestStart = i;
      bestLength = j - i;
    }
    i = j;
  }
  if (bestLength < 2) return parts.join(":");
  return (
    parts.slice(0, bestStart).join(":") +
    "::" +
    parts.slice(bestStart + bestLength).join(":")
  );
}

// Classifies the whole block against RFC 6890 special-purpose ranges: a block
// inside a range takes its label; a block containing ranges spans them.
export function classifyBlock(network, prefix, bits, ranges, fallback) {
  const toBig = (v) => BigInt(v);
  const net = toBig(network);
  const size = 1n << BigInt(bits - prefix);
  for (const entry of ranges) {
    const start = toBig(entry.start);
    const entrySize = 1n << BigInt(bits - entry.prefix);
    if (prefix >= entry.prefix && net >= start && net < start + entrySize) {
      return { label: entry.label, special: entry.special };
    }
  }
  const inside = ranges.filter((entry) => {
    const start = toBig(entry.start);
    return entry.prefix > prefix && start >= net && start < net + size;
  });
  if (inside.length) {
    return {
      label: "Spans special-purpose ranges",
      special: "Includes " + inside.map((e) => e.label).join(", "),
    };
  }
  return fallback;
}

export function classifyIPv4(networkInt, prefix) {
  const v4 = (a, b, c, d) => ((a << 24) >>> 0) + (b << 16) + (c << 8) + d;
  const ranges = [
    { start: v4(255, 255, 255, 255), prefix: 32, label: "Limited broadcast", special: "RFC 919 local-link broadcast" },
    { start: v4(0, 0, 0, 0), prefix: 8, label: "This network (0.0.0.0/8)", special: 'RFC 1122 "this host on this network"' },
    { start: v4(10, 0, 0, 0), prefix: 8, label: "Private RFC 1918 /8", special: "Internal addressing" },
    { start: v4(100, 64, 0, 0), prefix: 10, label: "Carrier-grade NAT /10", special: "RFC 6598 shared space" },
    { start: v4(127, 0, 0, 0), prefix: 8, label: "Loopback", special: "Host-local only" },
    { start: v4(169, 254, 0, 0), prefix: 16, label: "Link-local", special: "APIPA auto configuration" },
    { start: v4(172, 16, 0, 0), prefix: 12, label: "Private RFC 1918 /12", special: "Internal addressing" },
    { start: v4(192, 0, 0, 0), prefix: 24, label: "IETF protocol assignments", special: "RFC 6890 special use" },
    { start: v4(192, 0, 2, 0), prefix: 24, label: "TEST-NET-1", special: "Documentation only" },
    { start: v4(192, 88, 99, 0), prefix: 24, label: "6to4 relay anycast", special: "Deprecated by RFC 7526" },
    { start: v4(192, 168, 0, 0), prefix: 16, label: "Private RFC 1918 /16", special: "Internal addressing" },
    { start: v4(198, 18, 0, 0), prefix: 15, label: "Benchmarking", special: "RFC 2544 device testing" },
    { start: v4(198, 51, 100, 0), prefix: 24, label: "TEST-NET-2", special: "Documentation only" },
    { start: v4(203, 0, 113, 0), prefix: 24, label: "TEST-NET-3", special: "Documentation only" },
    { start: v4(224, 0, 0, 0), prefix: 4, label: "Multicast", special: "RFC 5771 special use" },
    { start: v4(240, 0, 0, 0), prefix: 4, label: "Future use", special: "Reserved / experimental" },
  ];
  return classifyBlock(networkInt >>> 0, prefix, 32, ranges, {
    label: "Public routable",
    special: "Subject to RIR allocation policies",
  });
}

export function classifyIPv6(networkBigInt, prefix) {
  const v6 = (hexGroups) =>
    hexGroups.reduce((acc, g) => (acc << 16n) + BigInt(g), 0n) <<
    BigInt(16 * (8 - hexGroups.length));
  const ranges = [
    { start: 0n, prefix: 128, label: "Unspecified (::/128)", special: "No address assigned" },
    { start: 1n, prefix: 128, label: "Loopback (::1/128)", special: "Host-local only" },
    { start: v6([0, 0, 0, 0, 0, 0xffff]), prefix: 96, label: "IPv4-mapped (::ffff:0:0/96)", special: "RFC 4291 IPv4 addresses in IPv6 sockets" },
    { start: v6([0x64, 0xff9b]), prefix: 96, label: "NAT64 (64:ff9b::/96)", special: "RFC 6052 IPv4/IPv6 translation" },
    { start: v6([0x2001, 0]), prefix: 32, label: "Teredo (2001::/32)", special: "RFC 4380 tunneling" },
    { start: v6([0x2001, 0xdb8]), prefix: 32, label: "Documentation (2001:db8::/32)", special: "Use in docs/examples" },
    { start: v6([0x2002]), prefix: 16, label: "6to4 (2002::/16)", special: "RFC 3056 tunneling" },
    { start: v6([0xfc00]), prefix: 7, label: "Unique Local (fc00::/7)", special: "RFC 4193 private IPv6 space" },
    { start: v6([0xfe80]), prefix: 10, label: "Link-local (fe80::/10)", special: "Single segment only" },
    { start: v6([0xff00]), prefix: 8, label: "Multicast (ff00::/8)", special: "RFC 4291 multicast" },
  ];
  const globalUnicast = v6([0x2000]);
  const inGlobal = prefix >= 3 && networkBigInt >= globalUnicast && networkBigInt < globalUnicast + (1n << 125n);
  return classifyBlock(networkBigInt, prefix, 128, ranges, inGlobal
    ? { label: "Global unicast", special: "Routable on the public internet" }
    : { label: "Reserved by IETF", special: "Outside 2000::/3 and the special-purpose ranges" });
}

// Usable-host wording for an IPv4 prefix: /31 links have two usable ends
// (RFC 3021) and a /32 is a single host, not a point-to-point link.
export function ipv4UsableLabel(prefix) {
  if (prefix === 32) return "1 (single host)";
  if (prefix === 31) return "2 (point-to-point, RFC 3021)";
  return (2 ** (32 - prefix) - 2).toLocaleString() + " usable";
}
