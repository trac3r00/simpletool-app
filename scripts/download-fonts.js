/**
 * Fetch the self-hosted Material Symbols Rounded icon font.
 *
 * We request a SUBSET, not the whole family. The full variable font is 5.3 MB;
 * on the home page that was 98.5% of the total transfer, and every Lighthouse
 * run flagged it. Google Fonts' `icon_names` parameter returns a font carrying
 * only the requested ligatures (~10 KB for this site), with the FILL/GRAD/opsz/
 * wght axes intact — `.info-hint .material-symbols-rounded` in styles/input.css
 * sets font-variation-settings, so the axes must survive.
 *
 * The icon list comes from scripts/icon-inventory.mjs, which scans src/ for
 * every icon name. Adding an icon to a route is enough: the next build sees the
 * manifest is stale and refetches. src/utils/icon-subset.test.js fails if the
 * shipped font and the scanned list ever drift apart.
 *
 * The unsubsetted font is not kept in the repo. To get it back for comparison:
 *   curl -A "Mozilla/5.0" "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
 * and download the woff2 that CSS points at.
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";
import { collectIconNames } from "./icon-inventory.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FAMILY_QUERY =
  "family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";
const DIST_FONTS_DIR = path.join(__dirname, "../dist/fonts");
const TARGET_CSS_FILE = path.join(DIST_FONTS_DIR, "material-symbols.css");
const TARGET_FONT_FILE = "material-symbols.woff2"; // Basename
// Build metadata, not a served asset — everything under dist/fonts/ is public.
const MANIFEST_FILE = path.join(__dirname, "icon-manifest.json");

// Ensure dist/fonts exists
if (!fs.existsSync(DIST_FONTS_DIR)) {
  fs.mkdirSync(DIST_FONTS_DIR, { recursive: true });
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`Request failed with status ${res.statusCode}`));
            return;
          }
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer);
          });
        },
      )
      .on("error", reject);
  });
}

function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const fontPath = path.join(DIST_FONTS_DIR, TARGET_FONT_FILE);
  const iconNames = await collectIconNames();

  const manifest = readManifest();
  const upToDate =
    fs.existsSync(fontPath) &&
    fs.existsSync(TARGET_CSS_FILE) &&
    manifest &&
    Array.isArray(manifest.iconNames) &&
    manifest.iconNames.join(",") === iconNames.join(",");

  if (upToDate) {
    console.log(
      `Material Symbols subset already covers all ${iconNames.length} icons, skipping download.`,
    );
    return;
  }

  console.log(`Fetching CSS for ${iconNames.length} icons...`);
  const cssUrl = `https://fonts.googleapis.com/css2?${FAMILY_QUERY}&icon_names=${iconNames.join(",")}&display=swap`;
  const cssBuffer = await fetch(cssUrl);
  const cssContent = cssBuffer.toString();

  // Extract WOFF2 URL
  const match = cssContent.match(/src:\s*url\(([^)]+)\)/);
  if (!match) {
    throw new Error("Could not find font URL in CSS");
  }
  const fontUrl = match[1];
  console.log(`Found font URL: ${fontUrl}`);

  console.log("Downloading font...");
  const fontBuffer = await fetch(fontUrl);
  fs.writeFileSync(fontPath, fontBuffer);
  console.log(`Saved font to ${fontPath} (${fontBuffer.length} bytes)`);

  // Update CSS to point to local file (keep font-display: swap for performance)
  const newCssContent = cssContent.replace(fontUrl, `./${TARGET_FONT_FILE}`);
  fs.writeFileSync(TARGET_CSS_FILE, newCssContent);
  console.log(`Saved CSS to ${TARGET_CSS_FILE}`);

  fs.writeFileSync(
    MANIFEST_FILE,
    `${JSON.stringify({ iconNames, bytes: fontBuffer.length }, null, 2)}\n`,
  );
  console.log(`Saved icon manifest to ${MANIFEST_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
