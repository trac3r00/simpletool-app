/**
 * Pure SSH key logic shared by the route (injected via fn.toString()) and tests.
 *
 * createSshKeyLogic must stay fully self-contained: the route inlines its
 * source into the page, so it may not reference imports or module-level names.
 */
export function createSshKeyLogic() {
  const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  function concat(parts) {
    let length = 0;
    parts.forEach(function (part) {
      length += part.length;
    });
    const out = new Uint8Array(length);
    let offset = 0;
    parts.forEach(function (part) {
      out.set(part, offset);
      offset += part.length;
    });
    return out;
  }

  function uint32(value) {
    return new Uint8Array([(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]);
  }

  function sshString(bytes) {
    return concat([uint32(bytes.length), bytes]);
  }

  function utf8(text) {
    return new TextEncoder().encode(String(text));
  }

  function base64(bytes) {
    let out = "";
    for (let index = 0; index < bytes.length; index += 3) {
      const b1 = index + 1 < bytes.length ? bytes[index + 1] : 0;
      const b2 = index + 2 < bytes.length ? bytes[index + 2] : 0;
      const triple = (bytes[index] << 16) | (b1 << 8) | b2;
      out += BASE64_ALPHABET[(triple >> 18) & 63] + BASE64_ALPHABET[(triple >> 12) & 63];
      out += index + 1 < bytes.length ? BASE64_ALPHABET[(triple >> 6) & 63] : "=";
      out += index + 2 < bytes.length ? BASE64_ALPHABET[triple & 63] : "=";
    }
    return out;
  }

  // WebCrypto exports an Ed25519 private key as a 48-byte PKCS#8 document
  // (RFC 8410): a fixed 16-byte prefix, then OCTET STRING(32) holding the seed.
  function ed25519SeedFromPkcs8(pkcs8) {
    const bytes = new Uint8Array(pkcs8);
    if (bytes.length !== 48 || bytes[14] !== 0x04 || bytes[15] !== 0x20) {
      throw new Error("Unexpected Ed25519 PKCS#8 layout");
    }
    return bytes.slice(16);
  }

  // Unencrypted "openssh-key-v1" private key (OpenSSH PROTOCOL.key), the format
  // ssh-keygen writes. OpenSSH cannot load Ed25519 keys stored as PKCS#8 PEM.
  function encodeOpenSshEd25519PrivateKey(seed, publicKey, comment, checkint) {
    if (seed.length !== 32 || publicKey.length !== 32) {
      throw new Error("Ed25519 seed and public key must be 32 bytes each");
    }
    const keyType = utf8("ssh-ed25519");
    const publicBlob = concat([sshString(keyType), sshString(publicKey)]);
    const check = uint32(checkint >>> 0);
    let privateSection = concat([
      check,
      check,
      sshString(keyType),
      sshString(publicKey),
      sshString(concat([seed, publicKey])),
      sshString(utf8(comment)),
    ]);
    // Pad to the cipher block size (8 for "none") with bytes 1, 2, 3, ...
    const padding = [];
    for (let pad = 1; (privateSection.length + padding.length) % 8 !== 0; pad++) padding.push(pad);
    privateSection = concat([privateSection, new Uint8Array(padding)]);

    const body = concat([
      utf8("openssh-key-v1\0"),
      sshString(utf8("none")),
      sshString(utf8("none")),
      sshString(new Uint8Array(0)),
      uint32(1),
      sshString(publicBlob),
      sshString(privateSection),
    ]);
    const encoded = base64(body).match(/.{1,70}/g).join("\n");
    return "-----BEGIN OPENSSH PRIVATE KEY-----\n" + encoded + "\n-----END OPENSSH PRIVATE KEY-----\n";
  }

  return {
    ed25519SeedFromPkcs8: ed25519SeedFromPkcs8,
    encodeOpenSshEd25519PrivateKey: encodeOpenSshEd25519PrivateKey,
  };
}

export const { ed25519SeedFromPkcs8, encodeOpenSshEd25519PrivateKey } = createSshKeyLogic();
