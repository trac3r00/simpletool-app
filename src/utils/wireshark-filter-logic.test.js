import { afterAll, describe, expect, it } from "vitest";
import { execFile, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  appendOperator,
  buildBpfClause,
  buildDisplayClause,
  joinClause,
  validateFilter,
} from "./wireshark-filter-logic.js";

const hasTcpdump = spawnSync("tcpdump", ["--version"]).status === 0;
const scratch = mkdtempSync(join(tmpdir(), "bpf-oracle-"));
const pcap = join(scratch, "empty.pcap");
const header = Buffer.alloc(24);
header.writeUInt32LE(0xa1b2c3d4, 0);
header.writeUInt16LE(2, 4);
header.writeUInt16LE(4, 6);
header.writeUInt32LE(65535, 16);
header.writeUInt32LE(1, 20);
writeFileSync(pcap, header);
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

function libpcapAccepts(expression) {
  return spawnSync("tcpdump", ["-r", pcap, "-d", expression]).status === 0;
}

function libpcapAcceptsAsync(expression) {
  return new Promise((resolve) => {
    execFile("tcpdump", ["-r", pcap, "-d", expression], (error) => resolve(!error));
  });
}

const SAMPLE_VALUES = {
  host: ["10.0.0.1", "fe80::1", "", "1.2.3.4 5"],
  net: ["10.0.0.0/8", "10.0.0.1/8", "192.168.1", "fe80::/10"],
  port: ["80", "http", "70000", ""],
  portrange: ["1-1024", "1024-1", "1-70000", "80"],
  proto: ["6", "tcp", "300", "icmp"],
};
const DIRECTIONS = ["", "src", "dst"];
const PROTOCOLS = ["", "tcp", "udp", "icmp", "arp", "ip", "ip6"];

describe.skipIf(!hasTcpdump)("buildBpfClause against libpcap (tcpdump -d)", () => {
  // The IP protocol field is 8 bits; libpcap compiles "proto 300" anyway.
  const STRICTER_THAN_LIBPCAP = (c) => c.primitive === "proto" && Number(c.value) > 255;
  // A service name such as "http" resolves through the host's /etc/services,
  // and distributions differ on whether it lists a udp entry, so libpcap's
  // verdict on a named port is a property of the machine, not of the filter.
  const HOST_DEPENDENT = (c) => c.primitive === "port" && /^[a-z]/i.test(c.value);

  it("emits only expressions libpcap compiles, and errors only where the naive form fails", async () => {
    const cases = [];
    for (const [primitive, values] of Object.entries(SAMPLE_VALUES)) {
      for (const value of values) {
        for (const direction of DIRECTIONS) {
          for (const proto of PROTOCOLS) {
            const result = buildBpfClause(primitive, direction, value, proto);
            const naive = [proto, direction, primitive, value].filter(Boolean).join(" ");
            cases.push({ primitive, direction, value, proto, result, expression: result.clause || naive });
          }
        }
      }
    }
    const verdicts = [];
    for (let i = 0; i < cases.length; i += 16) {
      verdicts.push(...(await Promise.all(cases.slice(i, i + 16).map((c) => libpcapAcceptsAsync(c.expression)))));
    }
    cases.forEach((c, i) => {
      if (HOST_DEPENDENT(c)) return;
      if (c.result.clause) expect(verdicts[i], JSON.stringify(c)).toBe(true);
      else if (!STRICTER_THAN_LIBPCAP(c)) expect(verdicts[i], JSON.stringify(c)).toBe(false);
    });
    expect(cases.filter((c) => c.result.clause).length).toBeGreaterThan(60);
  }, 30000);

  it("joins clauses and operators into expressions libpcap compiles", () => {
    let filter = "";
    filter = joinClause(filter, buildBpfClause("port", "", "80", "tcp").clause, "and");
    filter = appendOperator(filter, "and");
    filter = appendOperator(filter, "not");
    filter = appendOperator(filter, "(");
    filter = joinClause(filter, buildBpfClause("host", "src", "10.0.0.1", "").clause, "and");
    filter = appendOperator(filter, "or");
    filter = joinClause(filter, buildBpfClause("net", "", "192.168.0.0/16", "").clause, "and");
    filter = appendOperator(filter, ")");
    expect(filter).toBe("tcp port 80 and not (src host 10.0.0.1 or net 192.168.0.0/16)");
    expect(validateFilter(filter, "bpf")).toEqual([]);
    expect(libpcapAccepts(filter)).toBe(true);
  });
});

describe("buildBpfClause fixtures (recorded from tcpdump 4.99 / libpcap 1.10)", () => {
  it.each([
    [["host", "src", "1.2.3.4", "tcp"], "tcp and src host 1.2.3.4"],
    [["port", "dst", "443", "tcp"], "tcp dst port 443"],
    [["proto", "", "tcp", ""], "proto \\tcp"],
    [["host", "", "::1", "ip6"], "ip6 host ::1"],
  ])("%j -> %s", (args, clause) => {
    expect(buildBpfClause(...args).clause).toBe(clause);
  });

  it("reports host bits in a network and suggests the aligned block", () => {
    expect(buildBpfClause("net", "", "10.0.0.1/8", "").error).toContain("10.0.0.0/8");
  });
});

describe("buildDisplayClause (Wireshark display-filter grammar)", () => {
  it.each([
    [["tcp.port", "==", "80"], "tcp.port == 80"],
    [["ip.addr", "==", "10.0.0.0/8"], "ip.addr == 10.0.0.0/8"],
    [["ip.addr", "==", "fe80::1"], "ip.addr == fe80::1"],
    [["arp.src.hw_mac", "==", "00:11:22:33:44:55"], "arp.src.hw_mac == 00:11:22:33:44:55"],
    [["http.method", "==", "GET"], 'http.method == "GET"'],
    [["http.request", "==", ""], "http.request"],
    [["http.request", "!=", ""], "!http.request"],
    [["http.uri", "contains", 'a"b\\c'], 'http.uri contains "a\\"b\\\\c"'],
  ])("%j -> %s", (args, clause) => {
    expect(buildDisplayClause(...args).clause).toBe(clause);
  });

  it("refuses an ordering comparison without a value", () => {
    expect(buildDisplayClause("ip.ttl", ">", "").error).toBeTruthy();
    expect(buildDisplayClause("", "==", "1").error).toBeTruthy();
  });
});

describe("joinClause", () => {
  it("does not insert a joiner after an operator or an open parenthesis", () => {
    expect(joinClause("", "a", "&&")).toBe("a");
    expect(joinClause("a", "b", "&&")).toBe("a && b");
    expect(joinClause("a ||", "b", "&&")).toBe("a || b");
    expect(joinClause("!", "b", "&&")).toBe("!b");
    expect(joinClause("a && (", "b", "&&")).toBe("a && (b");
    expect(joinClause("port 80 and", "host x", "and")).toBe("port 80 and host x");
  });
});

describe("validateFilter", () => {
  it("flags unbalanced parentheses and dangling or doubled operators", () => {
    expect(validateFilter("a && (b", "display")).toContain("unbalanced parentheses");
    expect(validateFilter(")(", "display")).toContain("unbalanced parentheses");
    expect(validateFilter("a &&", "display")).toContain("ends with an operator");
    expect(validateFilter("a && || b", "display")).toContain("two operators in a row");
    expect(validateFilter("port 80 and", "bpf")).toContain("ends with an operator");
    expect(validateFilter("tcp.port == 80 && !http", "display")).toEqual([]);
  });
});
