/**
 * Compute the Subresource-Integrity (SRI) digest for a local vendor file.
 * Used by tests to verify the integrity= attributes in route source files
 * match the bytes actually shipped in dist/vendor/, and by scripts/update-sri.mjs
 * to write the canonical hashes back to the route files.
 *
 * Pure helper, Node-only (uses node:crypto + node:fs). Not bundled into the
 * worker output.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

/**
 * Compute the SHA-384 base64 digest expected by the SRI integrity= attribute.
 * @param {string} filePath
 * @returns {string} `sha384-<base64>`
 */
export function computeSriSha384(filePath) {
  const bytes = readFileSync(filePath);
  const digest = createHash('sha384').update(bytes).digest('base64');
  return `sha384-${digest}`;
}
