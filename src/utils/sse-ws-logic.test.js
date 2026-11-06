import { describe, expect, it } from "vitest";
import { createSseWsLogic } from "./sse-ws-logic.js";

const { parseEventStream, parseHex, decodeWebSocketFrames } = createSseWsLogic();

const hexBytes = (hex) => parseHex(hex).bytes;

describe("parseEventStream (WHATWG HTML spec examples)", () => {
  it("joins multi-line data with newlines", () => {
    const r = parseEventStream("data: YHOO\ndata: +2\ndata: 10\n\n");
    expect(r.events.map((e) => e.data)).toEqual(["YHOO\n+2\n10"]);
  });

  it("tracks ids, resets them with a bare id field, and keeps a leading space after one is stripped", () => {
    const r = parseEventStream(
      ": test stream\n\ndata: first event\nid: 1\n\ndata:second event\nid\n\ndata:  third event\n\n",
    );
    expect(r.events.map((e) => [e.data, e.lastEventId])).toEqual([
      ["first event", "1"],
      ["second event", ""],
      [" third event", ""],
    ]);
    expect(r.comments).toEqual([" test stream"]);
  });

  it("fires an empty event and a newline event, and discards the unterminated tail", () => {
    const r = parseEventStream("data\n\ndata\ndata\n\ndata:");
    expect(r.events.map((e) => e.data)).toEqual(["", "\n"]);
    expect(r.discardedTail).toBe(true);
  });

  it("treats 'data:test' and 'data: test' the same", () => {
    const r = parseEventStream("data:test\n\ndata: test\n\n");
    expect(r.events.map((e) => e.data)).toEqual(["test", "test"]);
  });

  it("accepts CR and CRLF line endings, strips one leading BOM, and reads event and retry", () => {
    const r = parseEventStream("\uFEFFevent: delta\r\ndata: {\"a\":1}\r\nretry: 3000\r\n\r\ndata: x\rretry: nope\r\r");
    expect(r.events.map((e) => [e.type, e.data])).toEqual([
      ["delta", '{"a":1}'],
      ["message", "x"],
    ]);
    expect(r.retry).toBe(3000);
  });

  it("ignores an id containing NULL and unknown fields", () => {
    const r = parseEventStream("id: a\u0000b\nfoo: bar\ndata: y\n\n");
    expect(r.events[0]).toMatchObject({ data: "y", lastEventId: "" });
  });
});

describe("parseHex", () => {
  it("accepts spaces, 0x prefixes and colons", () => {
    expect([...parseHex("0x81 05:48").bytes]).toEqual([0x81, 0x05, 0x48]);
  });
  it("rejects odd length and non-hex input", () => {
    expect(parseHex("abc").error).toMatch(/odd/);
    expect(parseHex("zz").error).toMatch(/hex digits/);
  });
});

describe("decodeWebSocketFrames (RFC 6455 section 5.7 examples)", () => {
  it("decodes a single-frame unmasked text message", () => {
    const { frames, error } = decodeWebSocketFrames(hexBytes("81 05 48 65 6c 6c 6f"));
    expect(error).toBeNull();
    expect(frames[0]).toMatchObject({ fin: true, opcodeName: "text", masked: false, text: "Hello" });
  });

  it("unmasks a single-frame masked text message", () => {
    const { frames } = decodeWebSocketFrames(hexBytes("81 85 37 fa 21 3d 7f 9f 4d 51 58"));
    expect(frames[0]).toMatchObject({ masked: true, text: "Hello", maskingKey: "37 fa 21 3d" });
  });

  it("decodes a fragmented message as a text frame then a continuation", () => {
    const { frames } = decodeWebSocketFrames(hexBytes("01 03 48 65 6c 80 02 6c 6f"));
    expect(frames.map((f) => [f.fin, f.opcodeName, f.text])).toEqual([
      [false, "text", "Hel"],
      [true, "continuation", "lo"],
    ]);
  });

  it("decodes an unmasked ping and a masked pong", () => {
    const { frames } = decodeWebSocketFrames(hexBytes("89 05 48 65 6c 6c 6f 8a 85 37 fa 21 3d 7f 9f 4d 51 58"));
    expect(frames.map((f) => [f.opcodeName, f.text])).toEqual([
      ["ping", "Hello"],
      ["pong", "Hello"],
    ]);
  });

  it("reads 16-bit and 64-bit payload lengths", () => {
    const b256 = new Uint8Array(4 + 256);
    b256.set([0x82, 0x7e, 0x01, 0x00]);
    const b64k = new Uint8Array(10 + 65536);
    b64k.set([0x82, 0x7f, 0, 0, 0, 0, 0, 1, 0, 0]);
    expect(decodeWebSocketFrames(b256).frames[0]).toMatchObject({ payloadLength: 256, lengthEncoding: "16-bit" });
    expect(decodeWebSocketFrames(b64k).frames[0]).toMatchObject({ payloadLength: 65536, lengthEncoding: "64-bit" });
  });
});

describe("decodeWebSocketFrames edge cases", () => {
  it("reads a close code and reason", () => {
    const { frames } = decodeWebSocketFrames(hexBytes("88 07 03 e8 62 79 65 21 21"));
    expect(frames[0]).toMatchObject({ opcodeName: "close", closeCode: 1000, closeReason: "bye!!" });
  });

  it("reports a truncated payload with the byte counts", () => {
    const { frames, error } = decodeWebSocketFrames(hexBytes("81 05 48 65"));
    expect(frames).toHaveLength(0);
    expect(error).toMatch(/announces 5 payload bytes but only 2 remain/);
  });

  it("warns on invalid UTF-8 text, oversized control frames, and reserved opcodes", () => {
    expect(decodeWebSocketFrames(hexBytes("81 02 c3 28")).frames[0].warnings.join(" ")).toMatch(/UTF-8/);
    const ping = new Uint8Array(2 + 126 + 2);
    ping.set([0x89, 0x7e, 0x00, 0x7e]);
    expect(decodeWebSocketFrames(ping).frames[0].warnings.join(" ")).toMatch(/125 bytes/);
    expect(decodeWebSocketFrames(hexBytes("83 00")).frames[0].warnings.join(" ")).toMatch(/reserved/);
  });
});

// Independent encoder written against RFC 6455 with Node's Buffer: the decoder
// must return exactly what this encoder framed, for random payloads and masks.
function encodeFrame({ fin, opcode, payload, mask }) {
  const len = payload.length;
  const header = [((fin ? 1 : 0) << 7) | opcode];
  const maskBit = mask ? 0x80 : 0;
  let ext = Buffer.alloc(0);
  if (len < 126) header.push(maskBit | len);
  else if (len < 65536) {
    header.push(maskBit | 126);
    ext = Buffer.alloc(2);
    ext.writeUInt16BE(len);
  } else {
    header.push(maskBit | 127);
    ext = Buffer.alloc(8);
    ext.writeBigUInt64BE(BigInt(len));
  }
  const body = Buffer.from(payload);
  if (mask) for (let i = 0; i < body.length; i++) body[i] ^= mask[i % 4];
  return Buffer.concat([Buffer.from(header), ext, mask ? Buffer.from(mask) : Buffer.alloc(0), body]);
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe("decodeWebSocketFrames round-trip against an independent encoder", () => {
  it("decodes 200 random frames back to their payloads", () => {
    const rand = rng(6455);
    const specs = [];
    const chunks = [];
    for (let n = 0; n < 200; n++) {
      const sizes = [0, 1, 125, 126, 127, 300, 65535, 65536];
      const len = rand() < 0.3 ? sizes[Math.floor(rand() * sizes.length)] : Math.floor(rand() * 400);
      const payload = Buffer.alloc(len);
      for (let i = 0; i < len; i++) payload[i] = Math.floor(rand() * 256);
      const mask = rand() < 0.5 ? [0, 1, 2, 3].map(() => Math.floor(rand() * 256)) : null;
      const spec = { fin: rand() < 0.8, opcode: 2, payload, mask };
      specs.push(spec);
      chunks.push(encodeFrame(spec));
    }
    const { frames, error } = decodeWebSocketFrames(new Uint8Array(Buffer.concat(chunks)));
    expect(error).toBeNull();
    expect(frames).toHaveLength(200);
    frames.forEach((f, i) => {
      expect(f.payloadLength).toBe(specs[i].payload.length);
      expect(f.fin).toBe(specs[i].fin);
      expect(f.masked).toBe(Boolean(specs[i].mask));
      const expectedHex = [...specs[i].payload.subarray(0, 64)].map((b) => b.toString(16).padStart(2, "0")).join(" ");
      expect(f.payloadHex.replace(" ...", "")).toBe(expectedHex);
    });
  });

  it("calibration: a decoder that ignores the mask would fail this check", () => {
    const frame = encodeFrame({ fin: true, opcode: 1, payload: Buffer.from("Hello"), mask: [0x37, 0xfa, 0x21, 0x3d] });
    const raw = [...frame.subarray(6)].map((b) => String.fromCharCode(b)).join("");
    expect(raw).not.toBe("Hello");
    expect(decodeWebSocketFrames(new Uint8Array(frame)).frames[0].text).toBe("Hello");
  });
});
