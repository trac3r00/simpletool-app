import { createHash, createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  base64ToBytes,
  bytesToBase64,
  bytesToHex,
  detectEncodingLayers,
  hexToBytes,
  hmacMd5Bytes,
  md5Bytes,
  utf8DecodeStrict,
  utf8Encode,
} from "./encoding-workbench-logic.js";

const SEED = Number(process.env.ENCODING_PROPERTY_SEED) || 0x456e6331;
const TEXT_POOL = [..."abcXYZ019 !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~\n\t", "é", "ß", "日", "本", "한", "😀", "🔐"];

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randomInt(random, max) {
  return Math.floor(random() * max);
}

function randomBytes(random, maxLength) {
  const bytes = new Uint8Array(randomInt(random, maxLength + 1));
  for (let i = 0; i < bytes.length; i++) bytes[i] = randomInt(random, 256);
  return bytes;
}

function randomText(random, maxLength) {
  const length = 1 + randomInt(random, maxLength);
  let out = "";
  for (let i = 0; i < length; i++) out += TEXT_POOL[randomInt(random, TEXT_POOL.length)];
  return out;
}

describe("encoding-workbench-logic (seed " + SEED + ")", () => {
  it("hex round-trips UTF-8 text and matches Buffer's hex", () => {
    const random = createRandom(SEED);
    for (let i = 0; i < 300; i++) {
      const text = randomText(random, 40);
      const hex = bytesToHex(utf8Encode(text));
      expect(hex).toBe(Buffer.from(text, "utf8").toString("hex"));
      expect(utf8DecodeStrict(hexToBytes(hex))).toBe(text);
    }
    expect(bytesToHex(utf8Encode("é日😀"))).toBe("c3a9e697a5f09f9880");
  });

  it("hexToBytes accepts 0x, spaces and colons and rejects malformed input", () => {
    expect(bytesToHex(hexToBytes("0xDE AD:be ef"))).toBe("deadbeef");
    expect(() => hexToBytes("abc")).toThrow(/odd/);
    expect(() => hexToBytes("zz")).toThrow(/Invalid hex/);
  });

  it("base64 decodes standard, URL-safe and unpadded input exactly like Buffer", () => {
    const random = createRandom(SEED + 1);
    for (let i = 0; i < 300; i++) {
      const bytes = randomBytes(random, 64);
      const std = Buffer.from(bytes).toString("base64");
      const url = Buffer.from(bytes).toString("base64url");
      expect(bytesToBase64(bytes)).toBe(std);
      expect([...base64ToBytes(std)]).toEqual([...bytes]);
      expect([...base64ToBytes(url)]).toEqual([...bytes]);
      expect([...base64ToBytes(std.replace(/(.{8})/g, "$1\n "))]).toEqual([...bytes]);
    }
    expect(() => base64ToBytes("abcde")).toThrow(/length/);
    expect(() => base64ToBytes("ab$c")).toThrow(/characters/);
  });

  it("utf8DecodeStrict rejects invalid UTF-8", () => {
    expect(utf8DecodeStrict(new Uint8Array([0xff]))).toBeNull();
    expect(utf8DecodeStrict(new Uint8Array([0xc3, 0xa9]))).toBe("é");
  });

  it("md5Bytes matches node:crypto for random byte strings and block boundaries", () => {
    const random = createRandom(SEED + 2);
    const lengths = [0, 1, 55, 56, 57, 63, 64, 65, 119, 120, 128, 1000];
    for (const length of lengths) {
      const bytes = new Uint8Array(length).map(() => randomInt(random, 256));
      expect(md5Bytes(bytes)).toBe(createHash("md5").update(bytes).digest("hex"));
    }
    for (let i = 0; i < 200; i++) {
      const bytes = randomBytes(random, 300);
      expect(md5Bytes(bytes)).toBe(createHash("md5").update(bytes).digest("hex"));
    }
  });

  it("hmacMd5Bytes matches node:crypto, including empty and >64-byte keys", () => {
    const random = createRandom(SEED + 3);
    for (let i = 0; i < 200; i++) {
      const key = randomBytes(random, 100);
      const data = randomBytes(random, 200);
      expect(hmacMd5Bytes(key, data)).toBe(createHmac("md5", key).update(data).digest("hex"));
    }
  });

  it("detectEncodingLayers peels nested layers in any order", () => {
    const random = createRandom(SEED + 4);
    const encoders = {
      Base64: (s) => Buffer.from(s, "utf8").toString("base64"),
      Hex: (s) => Buffer.from(s, "utf8").toString("hex"),
      URL: (s) => encodeURIComponent(s),
    };
    const names = Object.keys(encoders);
    for (let i = 0; i < 200; i++) {
      const plain = "user=" + randomText(random, 12).replace(/\s/g, "_") + "&ok=1 é";
      let encoded = plain;
      let previous = "";
      const depth = 1 + randomInt(random, 3);
      for (let d = 0; d < depth; d++) {
        let name = names[randomInt(random, names.length)];
        if (name === previous && name === "URL") name = "Base64";
        encoded = encoders[name](encoded);
        previous = name;
      }
      expect(detectEncodingLayers(encoded).final).toBe(plain);
    }
  });

  it("detectEncodingLayers does not invent layers for plain input", () => {
    expect(detectEncodingLayers("1234").layers).toEqual([]);
    expect(detectEncodingLayers("hello world").layers).toEqual([]);
    expect(detectEncodingLayers("aGVsbG8gd29ybGQ=").final).toBe("hello world");
  });
});
