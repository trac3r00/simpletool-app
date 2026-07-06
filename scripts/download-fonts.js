import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSS_URL = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
const DIST_FONTS_DIR = path.join(__dirname, '../dist/fonts');
const TARGET_CSS_FILE = path.join(DIST_FONTS_DIR, 'material-symbols.css');
const TARGET_FONT_FILE = 'material-symbols.woff2'; // Basename

// Ensure dist/fonts exists
if (!fs.existsSync(DIST_FONTS_DIR)) {
  fs.mkdirSync(DIST_FONTS_DIR, { recursive: true });
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
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
    }).on('error', reject);
  });
}

async function main() {
  const fontPath = path.join(DIST_FONTS_DIR, TARGET_FONT_FILE);
  if (fs.existsSync(fontPath) && fs.existsSync(TARGET_CSS_FILE)) {
    console.log('Material Symbols font already present, skipping download.');
    return;
  }
  console.log('Fetching CSS...');
  const cssBuffer = await fetch(CSS_URL);
  let cssContent = cssBuffer.toString();

  // Extract WOFF2 URL
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

  // Update CSS to point to local file (keep font-display: swap for performance)
  let newCssContent = cssContent.replace(fontUrl, `./${TARGET_FONT_FILE}`);

  fs.writeFileSync(TARGET_CSS_FILE, newCssContent);
  console.log(`Saved CSS to ${TARGET_CSS_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
