/**
 * Build script for vendor assets.
 * Copies third-party browser bundles into dist/vendor and bundles QRCode for client use.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const vendorDir = path.resolve(projectRoot, 'dist', 'vendor');

const vendorFiles = [
  { from: 'node_modules/jsqr/dist/jsQR.js', to: 'jsqr.min.js' },
  { from: 'node_modules/marked/lib/marked.umd.js', to: 'marked.min.js' },
  { from: 'node_modules/dompurify/dist/purify.min.js', to: 'purify.min.js' },
  { from: 'node_modules/bcryptjs/dist/bcrypt.min.js', to: 'bcrypt.min.js' },
  { from: 'node_modules/blueimp-md5/js/md5.min.js', to: 'md5.min.js' },
  { from: 'node_modules/pako/dist/browser/pako.umd.min.js', to: 'pako.min.js' },
  { from: 'node_modules/js-yaml/dist/browser/js-yaml.umd.min.js', to: 'js-yaml.min.js' },

  { from: 'node_modules/mermaid/dist/mermaid.min.js', to: 'mermaid.min.js' },
  { from: 'node_modules/node-forge/dist/forge.min.js', to: 'forge.min.js' }
];

async function buildVendor() {
  await fs.mkdir(vendorDir, { recursive: true });

  await Promise.all(vendorFiles.map(async (file) => {
    const sourcePath = path.resolve(projectRoot, file.from);
    const destPath = path.resolve(vendorDir, file.to);
    await fs.copyFile(sourcePath, destPath);
  }));

  await build({
    entryPoints: [path.resolve(projectRoot, 'node_modules', 'qrcode', 'lib', 'browser.js')],
    outfile: path.resolve(vendorDir, 'qrcode.min.js'),
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'QRCode'
  });

  await build({
    entryPoints: [path.resolve(projectRoot, 'node_modules', 'toml', 'index.js')],
    outfile: path.resolve(vendorDir, 'toml.min.js'),
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'toml'
  });

  await build({
    entryPoints: [path.resolve(projectRoot, 'scripts', 'vendor', 'to-json-schema-entry.cjs')],
    outfile: path.resolve(vendorDir, 'to-json-schema.min.js'),
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'toJsonSchema',
    platform: 'browser'
  });

  await build({
    entryPoints: [path.resolve(projectRoot, 'scripts', 'vendor', 'railroad-diagrams-entry.cjs')],
    outfile: path.resolve(vendorDir, 'railroad-diagrams.min.js'),
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'Railroad',
    platform: 'browser'
  });

  await build({
    entryPoints: [path.resolve(projectRoot, 'scripts', 'vendor', 'noble-hashes-entry.js')],
    outfile: path.resolve(vendorDir, 'noble-hashes.min.js'),
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'NobleHashes',
    platform: 'browser'
  });
}

buildVendor().catch((error) => {
  console.error('✗ Vendor build failed:', error);
  process.exit(1);
});
