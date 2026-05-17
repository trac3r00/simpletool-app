/**
 * RFC 4253 / RFC 4251 OpenSSH public-key wire encoder.
 */

const textEncoder = new TextEncoder();

function assertUint8Array(value, name) {
  if (!(value instanceof Uint8Array)) {
    throw new TypeError(`${name} must be a Uint8Array`);
  }
}

function toUtf8Bytes(value) {
  return textEncoder.encode(value);
}

function writeUint32(value) {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    throw new RangeError('uint32 value out of range');
  }

  const bytes = new Uint8Array(4);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, value, false);
  return bytes;
}

function concat(...arrays) {
  let totalLength = 0;
  for (const array of arrays) {
    assertUint8Array(array, 'concat input');
    totalLength += array.length;
  }

  const output = new Uint8Array(totalLength);
  let offset = 0;

  for (const array of arrays) {
    output.set(array, offset);
    offset += array.length;
  }

  return output;
}

function writeString(bytes) {
  assertUint8Array(bytes, 'string bytes');
  return concat(writeUint32(bytes.length), bytes);
}

function writeMpint(bytes) {
  assertUint8Array(bytes, 'mpint bytes');

  let payload = bytes;
  if (bytes.length > 0 && (bytes[0] & 0x80) !== 0) {
    payload = concat(new Uint8Array([0]), bytes);
  }

  return concat(writeUint32(payload.length), payload);
}

function toBase64(bytes) {
  assertUint8Array(bytes, 'base64 bytes');

  let binary = '';
  const chunkSize = 8192;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

export function encodeOpenSSHPublicKey({ algo, params }) {
  if (algo === 'ecdsa-sha2-nistp256') {
    const { x, y } = params ?? {};
    assertUint8Array(x, 'params.x');
    assertUint8Array(y, 'params.y');

    if (x.length !== 32 || y.length !== 32) {
      throw new RangeError('ECDSA P-256 coordinates must be 32 bytes each');
    }

    const wireBytes = concat(
      writeString(toUtf8Bytes('ecdsa-sha2-nistp256')),
      writeString(toUtf8Bytes('nistp256')),
      writeString(concat(new Uint8Array([0x04]), x, y))
    );

    return `ecdsa-sha2-nistp256 ${toBase64(wireBytes)}`;
  }

  if (algo === 'ssh-rsa') {
    const { e, n } = params ?? {};
    assertUint8Array(e, 'params.e');
    assertUint8Array(n, 'params.n');

    const wireBytes = concat(
      writeString(toUtf8Bytes('ssh-rsa')),
      writeMpint(e),
      writeMpint(n)
    );

    return `ssh-rsa ${toBase64(wireBytes)}`;
  }

  throw new Error(`Unsupported OpenSSH public key algorithm: ${algo}`);
}
