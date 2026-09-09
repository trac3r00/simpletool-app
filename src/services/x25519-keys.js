/**
 * X25519 keypair helpers for WireGuard.
 * Web Crypto forbids raw private-key export; JWK `d` is the portable scalar.
 */

export function base64UrlToBytes(value) {
  if (typeof value !== "string" || !value) {
    throw new TypeError("base64url value is required");
  }
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bytesToBase64(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError("bytes must be a Uint8Array");
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function generateX25519KeyPairRaw(subtle = globalThis.crypto?.subtle) {
  if (!subtle?.generateKey) {
    throw new Error("Web Crypto is not available in this browser");
  }

  const keyPair = await subtle.generateKey({ name: "X25519" }, true, [
    "deriveBits",
  ]);
  const publicKey = new Uint8Array(await subtle.exportKey("raw", keyPair.publicKey));

  let privateKey;
  try {
    privateKey = new Uint8Array(await subtle.exportKey("raw", keyPair.privateKey));
  } catch {
    const jwk = await subtle.exportKey("jwk", keyPair.privateKey);
    if (typeof jwk.d !== "string") {
      throw new Error("X25519 private key export is not supported");
    }
    privateKey = base64UrlToBytes(jwk.d);
  }

  if (privateKey.length !== 32 || publicKey.length !== 32) {
    throw new Error("X25519 keys must be 32 bytes");
  }

  return { privateKey, publicKey };
}
