import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSS_URL = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
const DIST_FONTS_DIR = path.join(__dirname, '../dist/fonts');
const TARGET_CSS_FILE = path.join(DIST_FONTS_DIR, 'material-symbols.css');
const TARGET_FONT_FILE = 'material-symbols.woff2';

export function hasValidCache() {
  const fontPath = path.join(DIST_FONTS_DIR, TARGET_FONT_FILE);
  try {
    return (
      fs.existsSync(fontPath) && fs.statSync(fontPath).size > 0 &&
      fs.existsSync(TARGET_CSS_FILE) && fs.statSync(TARGET_CSS_FILE).size > 0
    );
  } catch {
    return false;
  }
}

function ensureFontDir() {
  if (!fs.existsSync(DIST_FONTS_DIR)) {
    fs.mkdirSync(DIST_FONTS_DIR, { recursive: true });
  }
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Request failed with status ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.on('error', reject);
  });
}

export async function main() {
  ensureFontDir();
  if (hasValidCache()) {
    console.log('Fonts already exist, skipping download.');
    return;
  }
  console.log('Fetching CSS...');
  const cssBuffer = await fetch(CSS_URL);
  let cssContent = cssBuffer.toString();

  const match = cssContent.match(/src:\s*url\(([^)]+)\)/);
  if (!match) {
    throw new Error('Could not find font URL in CSS');
  }
  const fontUrl = match[1];
  console.log(`Found font URL: ${fontUrl}`);

  console.log('Downloading font...');
  const fontBuffer = await fetch(fontUrl);
  fs.writeFileSync(path.join(DIST_FONTS_DIR, TARGET_FONT_FILE), fontBuffer);
  console.log(`Saved font to ${path.join(DIST_FONTS_DIR, TARGET_FONT_FILE)}`);

  let newCssContent = cssContent.replace(fontUrl, `./${TARGET_FONT_FILE}`);

  fs.writeFileSync(TARGET_CSS_FILE, newCssContent);
  console.log(`Saved CSS to ${TARGET_CSS_FILE}`);
}

const isMain = process.argv[1] && (
  path.resolve(process.argv[1]) === path.resolve(__filename)
);

if (isMain) {
  main().catch(err => {
    if (hasValidCache()) {
      console.warn(`Warning: failed to download fonts (${err.message}). Using cached fonts.`);
      process.exit(0);
    }
    console.error(`Error: failed to download fonts (${err.message}).`);
    process.exit(1);
  });
}
