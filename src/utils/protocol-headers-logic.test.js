import { afterAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseHexDump } from "./protocol-headers-logic.js";

function mulberry32(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0x4e7);
const packets = Array.from({ length: 12 }, () =>
  Buffer.from(Array.from({ length: 20 + Math.floor(rand() * 90) }, () => Math.floor(rand() * 256))),
);
const scratch = mkdtempSync(join(tmpdir(), "hex-oracle-"));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

function tool(cmd, args, input) {
  const result = spawnSync(cmd, args, { input });
  return result.status === 0 ? result.stdout.toString() : null;
}

function tcpdumpHex(packet) {
  const file = join(scratch, "p.pcap");
  const header = Buffer.alloc(24);
  header.writeUInt32LE(0xa1b2c3d4, 0);
  header.writeUInt16LE(2, 4);
  header.writeUInt16LE(4, 6);
  header.writeUInt32LE(65535, 16);
  header.writeUInt32LE(1, 20);
  const rec = Buffer.alloc(16);
  rec.writeUInt32LE(packet.length, 8);
  rec.writeUInt32LE(packet.length, 12);
  writeFileSync(file, Buffer.concat([header, rec, packet]));
  const out = tool("tcpdump", ["-r", file, "-xx", "-n"]);
  return out && out.split("\n").filter((l) => /^\s+0x/.test(l)).join("\n");
}

describe("parseHexDump against real dump tools", () => {
  const formatters = {
    "xxd": (p) => tool("xxd", [], p),
    "hexdump -C": (p) => tool("hexdump", ["-C"], p),
    "tcpdump -xx": tcpdumpHex,
    "spaced bytes": (p) => [...p].map((b) => b.toString(16).padStart(2, "0")).join(" "),
    "hex stream": (p) => p.toString("hex"),
    "0x list": (p) => [...p].map((b) => "0x" + b.toString(16).padStart(2, "0")).join(", "),
    "colon": (p) => [...p].map((b) => b.toString(16).padStart(2, "0")).join(":"),
  };
  for (const [name, format] of Object.entries(formatters)) {
    it(name, () => {
      for (const packet of packets) {
        const text = format(packet);
        if (!text) return;
        expect(parseHexDump(text).bytes, text).toEqual([...packet]);
      }
    });
  }

  it("reports odd digit counts and empty input instead of guessing", () => {
    expect(parseHexDump("45 0").error).toContain("odd number");
    expect(parseHexDump("zz zz").error).toBe("No hex bytes found.");
  });
});
