import { describe, expect, it } from 'vitest';
import { encodeOpenSSHPublicKey } from './openssh-encode.js';

function hexToBytes(hex) {
  const normalized = hex.replace(/\s+/g, '');
  if (normalized.length % 2 !== 0) {
    throw new Error('hex string must have an even length');
  }

  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }

  return bytes;
}

const ecdsaVector = {
  x: hexToBytes('6e024a1a8bfc2206613e305ae8b466454166594cbae05c51b686c17a968f2a70'),
  y: hexToBytes('4b6e96cdcdb85b833e4dfa468688da61a19e32e2dc9fe314d19896b8347c3fb6'),
  expected: 'ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBG4CShqL/CIGYT4wWui0ZkVBZllMuuBcUbaGwXqWjypwS26Wzc24W4M+TfpGhojaYaGeMuLcn+MU0ZiWuDR8P7Y='
};

const rsaVector = {
  e: hexToBytes('010001'),
  n: hexToBytes(
    'c68ea393a5132195a877b8dcef3cfff86df48261dfb1d9eddeb0830c6bf6351252c72b83d096c1e78ce4121c05da8ad8' +
    'f7af3dfac85fd4a3c0bafa475bcf588af70ada728ca1b770fcbb1b124a3bd4b642be9984653e87ac4550e686f677b19d' +
    '12423a5de7b5ad8a120a2d1bcc89a7ed07a83ac9a3b5537f12cb05c732eb5ca3b9393be843fba9da3e9167310a3b410d' +
    'b1f77052410d92efb96394b041bc75329a1f7cb55d7920cc56c3ed841a883df14d94e4bec13d1a9f6710aaceb3f6d3bb' +
    '44fec05e192a533595746ea483be3161011680d0490d255f33675a5996847d53f97996cba90696a18ceefebc7b1f0bdf' +
    '4cc419655ad8c797c66de626feb2ce2f'
  ),
  expected: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDGjqOTpRMhlah3uNzvPP/4bfSCYd+x2e3esIMMa/Y1ElLHK4PQlsHnjOQSHAXaitj3rz36yF/Uo8C6+kdbz1iK9wracoyht3D8uxsSSjvUtkK+mYRlPoesRVDmhvZ3sZ0SQjpd57WtihIKLRvMiaftB6g6yaO1U38SywXHMutco7k5O+hD+6naPpFnMQo7QQ2x93BSQQ2S77ljlLBBvHUymh98tV15IMxWw+2EGog98U2U5L7BPRqfZxCqzrP207tE/sBeGSpTNZV0bqSDvjFhARaA0EkNJV8zZ1pZloR9U/l5lsupBpahjO7+vHsfC99MxBllWtjHl8Zt5ib+ss4v'
};

describe('encodeOpenSSHPublicKey', () => {
  it('encodes ECDSA P-256 public keys in OpenSSH wire format', () => {
    const encoded = encodeOpenSSHPublicKey({
      algo: 'ecdsa-sha2-nistp256',
      params: { x: ecdsaVector.x, y: ecdsaVector.y }
    });

    expect(encoded).toBe(ecdsaVector.expected);
    expect(encoded.startsWith('ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTY')).toBe(true);
  });

  it('encodes RSA public keys in OpenSSH wire format with mpint padding', () => {
    const encoded = encodeOpenSSHPublicKey({
      algo: 'ssh-rsa',
      params: { e: rsaVector.e, n: rsaVector.n }
    });

    expect(encoded).toBe(rsaVector.expected);
    expect(encoded.startsWith('ssh-rsa AAAAB3NzaC1yc2E')).toBe(true);
  });

  it('throws for unsupported algorithms', () => {
    expect(() => encodeOpenSSHPublicKey({ algo: 'ssh-ed25519', params: {} })).toThrow(
      'Unsupported OpenSSH public key algorithm: ssh-ed25519'
    );
  });
});
