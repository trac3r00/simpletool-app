// The route inlines this factory into its client script with fn.toString(), so it
// must stay self-contained. A factory (rather than separate functions) keeps the
// inner names local: the worker bundler may rename colliding top-level names.
export function createEncodingWorkbenchLogic() {
  function utf8Encode(text) {
    return new TextEncoder().encode(String(text));
  }

  function utf8DecodeStrict(bytes) {
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch (e) {
      return null;
    }
  }

  function bytesToHex(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i++) {
      out += (bytes[i] < 16 ? "0" : "") + bytes[i].toString(16);
    }
    return out;
  }

  function hexToBytes(input) {
    let clean = String(input).replace(/[\s:]/g, "");
    if (/^0x/i.test(clean)) clean = clean.slice(2);
    if (!/^[0-9a-fA-F]*$/.test(clean)) {
      throw new Error("Invalid hex input: only 0-9 and a-f are allowed");
    }
    if (clean.length % 2 !== 0) {
      throw new Error("Invalid hex input: odd number of hex digits");
    }
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  function bytesToBase64(bytes) {
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function base64ToBytes(input) {
    let clean = String(input).replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) {
      throw new Error("Invalid Base64 input: unexpected characters");
    }
    clean = clean.replace(/=+$/, "");
    if (clean.length % 4 === 1) {
      throw new Error("Invalid Base64 input: wrong length");
    }
    while (clean.length % 4) clean += "=";
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function isPrintableText(text) {
    return text.length > 0 && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFD]/.test(text);
  }

  // A layer is accepted only when it decodes to printable UTF-8, so plain words
  // and digit strings are not "decoded" into control-character garbage.
  function detectEncodingLayers(input, maxLayers) {
    const limit = maxLayers || 10;
    const layers = [];
    let current = String(input).trim();

    const attempts = [
      {
        type: "Hex",
        test: function (s) {
          const c = s.replace(/\s/g, "");
          return c.length >= 4 && c.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(c);
        },
        decode: function (s) { return utf8DecodeStrict(hexToBytes(s)); },
      },
      {
        type: "Base64",
        test: function (s) {
          const c = s.replace(/\s/g, "");
          return c.length >= 4 && /^[A-Za-z0-9+/_-]+={0,2}$/.test(c);
        },
        decode: function (s) { return utf8DecodeStrict(base64ToBytes(s)); },
      },
      {
        type: "URL",
        test: function (s) { return /%[0-9A-Fa-f]{2}/.test(s); },
        decode: function (s) { return decodeURIComponent(s); },
      },
    ];

    while (layers.length < limit) {
      let advanced = false;
      for (let i = 0; i < attempts.length; i++) {
        const attempt = attempts[i];
        if (!attempt.test(current)) continue;
        let decoded = null;
        try { decoded = attempt.decode(current); } catch (e) { decoded = null; }
        if (decoded === null || decoded === current || !isPrintableText(decoded)) continue;
        layers.push({ type: attempt.type, decoded: decoded });
        current = decoded.trim() || decoded;
        advanced = true;
        break;
      }
      if (!advanced) break;
    }

    return { layers: layers, final: current };
  }

  function md5Bytes(bytes) {
    const s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
      5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
      4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
      6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
    const K = new Array(64);
    for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;

    const len = bytes.length;
    const padded = new Uint8Array((((len + 8) >> 6) + 1) << 6);
    padded.set(bytes);
    padded[len] = 0x80;
    const bitLenLo = (len * 8) >>> 0;
    const bitLenHi = Math.floor(len / 0x20000000) >>> 0;
    const end = padded.length;
    padded[end - 8] = bitLenLo & 0xff;
    padded[end - 7] = (bitLenLo >>> 8) & 0xff;
    padded[end - 6] = (bitLenLo >>> 16) & 0xff;
    padded[end - 5] = (bitLenLo >>> 24) & 0xff;
    padded[end - 4] = bitLenHi & 0xff;
    padded[end - 3] = (bitLenHi >>> 8) & 0xff;
    padded[end - 2] = (bitLenHi >>> 16) & 0xff;
    padded[end - 1] = (bitLenHi >>> 24) & 0xff;

    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    const M = new Array(16);
    for (let off = 0; off < end; off += 64) {
      for (let j = 0; j < 16; j++) {
        const p = off + j * 4;
        M[j] = (padded[p] | (padded[p + 1] << 8) | (padded[p + 2] << 16) | (padded[p + 3] << 24)) >>> 0;
      }
      let A = a0, B = b0, C = c0, D = d0;
      for (let i = 0; i < 64; i++) {
        let F, g;
        if (i < 16) { F = (B & C) | (~B & D); g = i; }
        else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
        else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * i) % 16; }
        F = (F + A + K[i] + M[g]) >>> 0;
        A = D; D = C; C = B;
        B = (B + ((F << s[i]) | (F >>> (32 - s[i])))) >>> 0;
      }
      a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
    }

    let hex = "";
    const words = [a0, b0, c0, d0];
    for (let w = 0; w < 4; w++) {
      for (let k = 0; k < 4; k++) {
        const byte = (words[w] >>> (k * 8)) & 0xff;
        hex += (byte < 16 ? "0" : "") + byte.toString(16);
      }
    }
    return hex;
  }

  function hmacMd5Bytes(keyBytes, dataBytes) {
    let key = keyBytes;
    if (key.length > 64) {
      const h = md5Bytes(key);
      key = new Uint8Array(16);
      for (let i = 0; i < 16; i++) key[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
    }
    const inner = new Uint8Array(64 + dataBytes.length);
    const outerKey = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      const k = i < key.length ? key[i] : 0;
      inner[i] = k ^ 0x36;
      outerKey[i] = k ^ 0x5c;
    }
    inner.set(dataBytes, 64);
    const innerHex = md5Bytes(inner);
    const outer = new Uint8Array(64 + 16);
    outer.set(outerKey);
    for (let i = 0; i < 16; i++) outer[64 + i] = parseInt(innerHex.slice(i * 2, i * 2 + 2), 16);
    return md5Bytes(outer);
  }

  return { utf8Encode, utf8DecodeStrict, bytesToHex, hexToBytes, bytesToBase64, base64ToBytes, isPrintableText, detectEncodingLayers, md5Bytes, hmacMd5Bytes };
}

export const {
  utf8Encode,
  utf8DecodeStrict,
  bytesToHex,
  hexToBytes,
  bytesToBase64,
  base64ToBytes,
  isPrintableText,
  detectEncodingLayers,
  md5Bytes,
  hmacMd5Bytes,
} = createEncodingWorkbenchLogic();
