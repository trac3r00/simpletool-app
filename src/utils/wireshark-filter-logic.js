// Pure filter builders for the Wireshark filter page. They are injected into
// the page's inline script with fn.toString(), so each may only reference the
// other functions exported here.

export function joinClause(filter, clause, joiner) {
  const current = String(filter || "").trim();
  if (!current) return clause;
  if (/[(!]$/.test(current)) return current + clause;
  if (/(?:&&|\|\||\band|\bor|\bnot)$/.test(current)) return current + " " + clause;
  return current + " " + joiner + " " + clause;
}

export function appendOperator(filter, op) {
  const current = String(filter || "").trim();
  if (op === ")") return current + ")";
  if (op === "(") return current ? current + " (" : "(";
  return current ? current + " " + op : op;
}

// Display-filter values: numbers, addresses, and MACs are literals; anything
// else is a quoted string. An empty value turns the clause into a field
// existence test ("http.request"), which is how boolean fields are filtered.
export function buildDisplayClause(field, operator, rawValue) {
  const quote = (text) => '"' + text.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  if (!field) return { error: "Choose a protocol and a field first." };
  const value = String(rawValue || "").trim();
  if (!value) {
    if (operator === "==") return { clause: field };
    if (operator === "!=") return { clause: "!" + field };
    return { error: "Enter a value for the " + operator + " comparison." };
  }
  if (operator === "contains" || operator === "matches") {
    return { clause: field + " " + operator + " " + quote(value) };
  }
  const literal =
    /^-?\d+(\.\d+)?$/.test(value) ||
    /^0x[0-9a-f]+$/i.test(value) ||
    /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(value) ||
    /^[0-9a-f:]*:[0-9a-f:.]*(\/\d{1,3})?$/i.test(value) ||
    /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.test(value);
  return { clause: field + " " + operator + " " + (literal ? value : quote(value)) };
}

export function ipv4NetError(value) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec(value);
  if (!m) return "";
  const octets = m.slice(1, 5).map(Number);
  const prefix = Number(m[5]);
  if (octets.some((o) => o > 255) || prefix > 32) return "Invalid IPv4 network " + value + ".";
  const ip = octets.reduce((acc, o) => acc * 256 + o, 0);
  const size = 2 ** (32 - prefix);
  const network = ip - (ip % size);
  if (network === ip) return "";
  const text = [24, 16, 8, 0].map((s) => Math.floor(network / 2 ** s) % 256).join(".");
  return value + " has host bits set; use " + text + "/" + prefix + ".";
}

// BPF capture-filter clause. Combinations libpcap rejects ("tcp host x",
// "icmp port 80", "src proto 6", "proto tcp") are rewritten or reported.
export function buildBpfClause(primitive, direction, rawValue, proto) {
  const value = String(rawValue || "").trim();
  const dir = direction ? direction + " " : "";
  if (!value) return { error: "Enter a value for " + primitive + "." };
  if (/\s/.test(value)) return { error: "The value cannot contain spaces." };

  if (primitive === "proto") {
    if (direction) return { error: "src/dst does not apply to proto." };
    if (proto && !["ip", "ip6"].includes(proto)) {
      return { error: "proto can only be qualified by ip or ip6; set Protocol to Any, ip, or ip6." };
    }
    let target;
    if (/^\d+$/.test(value)) {
      if (Number(value) > 255) return { error: "IP protocol numbers are 0-255." };
      target = value;
    } else if (/^[a-z][a-z0-9-]*$/i.test(value)) {
      target = "\\" + value.toLowerCase();
    } else {
      return { error: "Use a protocol number (6) or name (tcp)." };
    }
    return { clause: (proto ? proto + " " : "") + "proto " + target };
  }

  if (primitive === "port" || primitive === "portrange") {
    const validPort = /^\d+$/.test(value) ? Number(value) <= 65535 : /^[a-z][a-z0-9-]*$/i.test(value);
    if (primitive === "port" && !validPort) {
      return { error: "Ports are 0-65535 or a service name such as http." };
    }
    if (primitive === "portrange") {
      const m = /^(\d+)(?:-(\d+))?$/.exec(value);
      if (!m || Number(m[1]) > 65535 || Number(m[2] || 0) > 65535) {
        return { error: "Use a range such as 1-1024 (ports 0-65535)." };
      }
    }
    if (proto === "icmp" || proto === "arp") {
      return { error: proto.toUpperCase() + " has no ports; choose tcp, udp, or Any." };
    }
    const prefix = ["tcp", "udp"].includes(proto) ? proto + " " : proto ? proto + " and " : "";
    return { clause: prefix + dir + primitive + " " + value };
  }

  const looksIPv6 = value.includes(":");
  const looksIPv4 = /^\d{1,3}(\.\d{1,3}){1,3}(\/\d{1,2})?$/.test(value);
  if (proto === "ip6" && looksIPv4) return { error: "ip6 cannot match the IPv4 value " + value + "." };
  if (["ip", "arp", "icmp"].includes(proto) && looksIPv6) {
    return { error: proto + " cannot match the IPv6 value " + value + "." };
  }
  if (primitive === "net") {
    const netError = ipv4NetError(value);
    if (netError) return { error: netError };
  }
  const prefix = ["ip", "ip6", "arp"].includes(proto) ? proto + " " : proto ? proto + " and " : "";
  return { clause: prefix + dir + primitive + " " + value };
}

export function validateFilter(filter, mode) {
  const issues = [];
  const text = String(filter || "").trim();
  if (!text) return issues;
  let depth = 0;
  for (const ch of text) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (depth < 0) break;
  }
  if (depth !== 0) issues.push("unbalanced parentheses");
  const binary = mode === "display" ? "(?:&&|\\|\\|)" : "(?:\\band\\b|\\bor\\b)";
  const unary = mode === "display" ? "!" : "\\bnot\\b";
  if (new RegExp("(?:" + binary + "|" + unary + "|\\()\\s*$").test(text)) {
    issues.push("ends with an operator");
  }
  if (new RegExp("^" + binary).test(text)) issues.push("starts with a binary operator");
  if (new RegExp(binary + "\\s*" + binary).test(text)) issues.push("two operators in a row");
  return issues;
}
