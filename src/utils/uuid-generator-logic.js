// Single factory: inlined via toString(), so bundler renames of separate top-level helpers would break the page.
export function createUuidLogic() {
  function toHex(bytes) {
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  }

  function generateV4(fillRandom) {
    const bytes = new Uint8Array(16);
    fillRandom(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return toHex(bytes);
  }

  // RFC 9562 s6.2 method 1: a 12-bit counter in rand_a keeps IDs generated in
  // the same millisecond strictly increasing. The counter starts with its top
  // bit clear so it has room to grow; on overflow the timestamp is bumped.
  function generateV7(nowMs, fillRandom, state) {
    const bytes = new Uint8Array(16);
    fillRandom(bytes);
    let ms = nowMs;
    let counter;
    if (state && state.v7Ms !== undefined && ms <= state.v7Ms) {
      ms = state.v7Ms;
      counter = state.v7Counter + 1;
      if (counter > 0xfff) {
        ms += 1;
        counter = ((bytes[6] << 8) | bytes[7]) & 0x7ff;
      }
    } else {
      counter = ((bytes[6] << 8) | bytes[7]) & 0x7ff;
    }
    if (state) {
      state.v7Ms = ms;
      state.v7Counter = counter;
    }
    const ts = BigInt(ms);
    for (let i = 0; i < 6; i++) {
      bytes[i] = Number((ts >> BigInt(40 - 8 * i)) & 0xffn);
    }
    bytes[6] = 0x70 | (counter >> 8);
    bytes[7] = counter & 0xff;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return toHex(bytes);
  }

  // RFC 9562 s5.1: 60-bit count of 100ns intervals since 1582-10-15. BigInt is
  // required (the value exceeds 2^53). Within one millisecond the sub-ms ticks
  // advance per ID so a batch is unique and time-ordered; the node is random
  // with the multicast bit set, as the RFC requires for non-MAC nodes.
  function generateV1(nowMs, fillRandom, state) {
    let ticks = BigInt(nowMs) * 10000n + 122192928000000000n;
    if (state && state.v1Ticks !== undefined && ticks <= state.v1Ticks) {
      ticks = state.v1Ticks + 1n;
    }
    if (state) state.v1Ticks = ticks;
    const rnd = new Uint8Array(8);
    fillRandom(rnd);
    const timeLow = (ticks & 0xffffffffn).toString(16).padStart(8, "0");
    const timeMid = ((ticks >> 32n) & 0xffffn).toString(16).padStart(4, "0");
    const timeHi = (((ticks >> 48n) & 0x0fffn) | 0x1000n)
      .toString(16)
      .padStart(4, "0");
    const clockSeq = ((((rnd[1] & 0x3f) | 0x80) << 8) | rnd[0])
      .toString(16)
      .padStart(4, "0");
    rnd[2] |= 0x01;
    const node = Array.from(rnd.slice(2, 8), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    return timeLow + "-" + timeMid + "-" + timeHi + "-" + clockSeq + "-" + node;
  }

  function formatUUID(uuid, format) {
    if (format === "plain") return uuid.replace(/-/g, "");
    if (format === "uppercase") return uuid.toUpperCase();
    if (format === "braces") return "{" + uuid + "}";
    return uuid;
  }

  function generateBatch(version, count, format, nowMs, fillRandom) {
    const state = {};
    const out = [];
    for (let i = 0; i < count; i++) {
      let uuid;
      if (version === "v7") uuid = generateV7(nowMs, fillRandom, state);
      else if (version === "v1") uuid = generateV1(nowMs, fillRandom, state);
      else if (version === "nil") uuid = "00000000-0000-0000-0000-000000000000";
      else uuid = generateV4(fillRandom);
      out.push(formatUUID(uuid, format));
    }
    return out;
  }

  return { generateV4, generateV7, generateV1, formatUUID, generateBatch };
}

export const { generateV4, generateV7, generateV1, formatUUID, generateBatch } =
  createUuidLogic();
