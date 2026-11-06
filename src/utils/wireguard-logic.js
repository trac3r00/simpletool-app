// Pure WireGuard helpers. They are injected into the page's inline script with
// fn.toString(), so each may only reference the other functions exported here
// and the cidr-logic address parsers injected beside them.
import { expandIPv6, isValidIPv4 } from "./cidr-logic.js";

// A WireGuard key is 32 bytes in standard base64: 43 characters plus one "="
// pad, and the last character before the pad carries only 4 data bits.
export function isWireGuardKey(text) {
  return /^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$/.test(String(text || "").trim());
}

export function invalidCidrEntries(text) {
  const entries = String(text || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  return entries.filter((entry) => {
    const [ip, prefix, extra] = entry.split("/");
    if (extra !== undefined) return true;
    const max = isValidIPv4(ip) ? 32 : expandIPv6(ip) ? 128 : 0;
    if (!max) return true;
    if (prefix === undefined) return false;
    return !/^\d{1,3}$/.test(prefix) || Number(prefix) > max;
  });
}

// Parses a wg-quick .conf. Section and key names are case-insensitive, and
// repeated Address / DNS / AllowedIPs lines accumulate as wg-quick does.
export function parseWireGuardConfig(text) {
  const iface = { privateKey: "", address: "", listenPort: "", dns: "", mtu: "", postUp: "", postDown: "" };
  const peers = [];
  const unknown = [];
  const ifaceKeys = { privatekey: "privateKey", address: "address", listenport: "listenPort", dns: "dns", mtu: "mtu", postup: "postUp", postdown: "postDown" };
  const peerKeys = { publickey: "publicKey", presharedkey: "presharedKey", allowedips: "allowedIPs", endpoint: "endpoint", persistentkeepalive: "persistentKeepalive" };
  const lists = ["address", "dns", "allowedIPs"];
  let section = null;
  let peer = null;
  String(text || "")
    .split(/\r?\n/)
    .forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) return;
      const header = /^\[(\w+)\]$/.exec(trimmed);
      if (header) {
        section = header[1].toLowerCase();
        if (section === "peer") {
          peer = { publicKey: "", presharedKey: "", allowedIPs: "", endpoint: "", persistentKeepalive: "" };
          peers.push(peer);
        } else if (section !== "interface") {
          unknown.push("line " + (index + 1) + ": unknown section [" + header[1] + "]");
        }
        return;
      }
      const eq = trimmed.indexOf("=");
      if (eq === -1) {
        unknown.push("line " + (index + 1) + ": expected Key = Value");
        return;
      }
      const key = trimmed.slice(0, eq).trim().toLowerCase();
      const value = trimmed.slice(eq + 1).trim();
      const target = section === "interface" ? iface : section === "peer" ? peer : null;
      const name = section === "interface" ? ifaceKeys[key] : section === "peer" ? peerKeys[key] : undefined;
      if (!target || !name) {
        unknown.push("line " + (index + 1) + ": " + trimmed.slice(0, eq).trim() + " is not a recognised " + (section || "top-level") + " key");
        return;
      }
      target[name] = lists.includes(name) && target[name] ? target[name] + ", " + value : value;
    });
  return { iface, peers, unknown };
}
