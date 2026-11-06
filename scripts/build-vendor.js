/**
 * Build script for vendor assets.
 * Copies third-party browser bundles into dist/vendor and bundles QRCode for client use.
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const vendorDir = path.resolve(projectRoot, "dist", "vendor");

const vendorFiles = [
  { from: "node_modules/jsqr/dist/jsQR.js", to: "jsqr.min.js" },
  { from: "node_modules/marked/lib/marked.umd.js", to: "marked.min.js" },
  { from: "node_modules/dompurify/dist/purify.min.js", to: "purify.min.js" },
  { from: "node_modules/bcryptjs/dist/bcrypt.min.js", to: "bcrypt.min.js" },
  { from: "node_modules/pako/dist/browser/pako.umd.min.js", to: "pako.min.js" },
  {
    from: "node_modules/js-yaml/dist/browser/js-yaml.umd.min.js",
    to: "js-yaml.min.js",
  },

  { from: "node_modules/mermaid/dist/mermaid.min.js", to: "mermaid.min.js" },
  { from: "node_modules/node-forge/dist/forge.min.js", to: "forge.min.js" },
];

async function buildVendor() {
  await fs.mkdir(vendorDir, { recursive: true });

  await Promise.all(
    vendorFiles.map(async (file) => {
      const sourcePath = path.resolve(projectRoot, file.from);
      const destPath = path.resolve(vendorDir, file.to);
      await fs.copyFile(sourcePath, destPath);
    }),
  );

  await build({
    entryPoints: [
      path.resolve(projectRoot, "node_modules", "qrcode", "lib", "browser.js"),
    ],
    outfile: path.resolve(vendorDir, "qrcode.min.js"),
    bundle: true,
    minify: true,
    format: "iife",
    globalName: "QRCode",
  });

  // Off-main-thread regex runner (regex studio, log viewer): a ReDoS pattern
  // is terminated by the page instead of freezing the tab.
  await fs.copyFile(
    path.resolve(projectRoot, "scripts", "vendor", "regex-worker.js"),
    path.resolve(vendorDir, "regex-worker.js"),
  );

  // JSON Schema validation without eval (CSP forbids unsafe-eval, so Ajv's
  // code generation cannot run in the page).
  await build({
    entryPoints: [
      path.resolve(projectRoot, "node_modules", "@cfworker", "json-schema", "dist", "esm", "index.js"),
    ],
    outfile: path.resolve(vendorDir, "json-schema-validator.min.js"),
    bundle: true,
    minify: true,
    format: "iife",
    globalName: "CfJsonSchema",
  });

  // LLM-output JSON repair for the JSON formatter (report P2-11).
  await build({
    entryPoints: [
      path.resolve(projectRoot, "node_modules", "jsonrepair", "lib", "esm", "index.js"),
    ],
    outfile: path.resolve(vendorDir, "jsonrepair.min.js"),
    bundle: true,
    minify: true,
    format: "iife",
    globalName: "JSONRepair",
  });

  // Exact OpenAI tokenizers for the token counter (report P2-11). Large
  // (o200k ~2.7 MB, cl100k ~1 MB), so the page loads them only on demand.
  for (const enc of ["o200k_base", "cl100k_base"]) {
    await build({
      entryPoints: [
        path.resolve(projectRoot, "node_modules", "gpt-tokenizer", "esm", "encoding", `${enc}.js`),
      ],
      outfile: path.resolve(vendorDir, `gpt-tokenizer-${enc}.min.js`),
      bundle: true,
      minify: true,
      format: "iife",
      globalName: `GPTTokenizer_${enc}`,
    });
  }

  await build({
    entryPoints: [
      path.resolve(projectRoot, "node_modules", "toml", "index.js"),
    ],
    outfile: path.resolve(vendorDir, "toml.min.js"),
    bundle: true,
    minify: true,
    format: "iife",
    globalName: "toml",
  });


  await build({
    entryPoints: [
      path.resolve(
        projectRoot,
        "scripts",
        "vendor",
        "railroad-diagrams-entry.cjs",
      ),
    ],
    outfile: path.resolve(vendorDir, "railroad-diagrams.min.js"),
    bundle: true,
    minify: true,
    format: "iife",
    globalName: "Railroad",
    platform: "browser",
  });

  await build({
    entryPoints: [
      path.resolve(projectRoot, "scripts", "vendor", "noble-hashes-entry.js"),
    ],
    outfile: path.resolve(vendorDir, "noble-hashes.min.js"),
    bundle: true,
    minify: true,
    format: "iife",
    globalName: "NobleHashes",
    platform: "browser",
  });
}

buildVendor().catch((error) => {
  console.error("✗ Vendor build failed:", error);
  process.exit(1);
});
