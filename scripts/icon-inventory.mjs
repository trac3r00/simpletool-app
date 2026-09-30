/**
 * Single source of truth for which Material Symbols glyphs the site actually uses.
 *
 * The full "Material Symbols Rounded" variable font is 5.3 MB — on the home page
 * it was 98.5% of the total payload. We ship a subset containing only the icons
 * below, so this scanner has to find EVERY icon name in the codebase: a name that
 * is missing from the subset renders as its raw text ("content_copy") instead of
 * a glyph.
 *
 * Consumed by scripts/download-fonts.js (which requests exactly these names from
 * the Google Fonts `icon_names` API) and by src/utils/icon-subset.test.js (which
 * fails the build when the shipped subset no longer matches this list).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const SRC_DIR = path.join(REPO_ROOT, "src");
const I18N_DIR = path.join(SRC_DIR, "i18n");

/** Generated, enormous, and never a source of icon markup. */
const SKIP_FILES = new Set(["bundled-styles.js"]);

/** A Material Symbols ligature name: lowercase letters, digits, underscores. */
const ICON_NAME = /^[a-z][a-z0-9_]*$/;

/**
 * Icons that no static scan can see, with the reason each one is needed.
 * Keep this list justified — every entry costs bytes in the shipped font.
 */
export const ALWAYS_INCLUDE = {
  // infoHint() in src/utils/common-ui.js defaults to this icon and ~40 call
  // sites rely on the default, so it never appears as literal markup.
  help: "default icon of infoHint() in src/utils/common-ui.js",
  // Returned when a tool id or category is missing from home-icons.js.
  apps: "fallback tile in src/ui/home-icons.js",
};

function listJsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listJsFiles(full));
    } else if (
      entry.name.endsWith(".js") &&
      !entry.name.endsWith(".test.js") &&
      !SKIP_FILES.has(entry.name)
    ) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Icon names written directly into markup:
 *   <span class="material-symbols-rounded ...">content_copy</span>
 * Also returns the data-i18n keys attached to those spans, because _patchDOM()
 * overwrites the span's text with the catalog value at runtime — so the catalog
 * value is an icon name too.
 */
function scanMarkup(text) {
  const icons = new Set();
  const i18nKeys = new Set();
  const span =
    /class="material-symbols-rounded[^"]*"([^>]*)>\s*([A-Za-z0-9_]+)\s*</g;
  let m;
  while ((m = span.exec(text)) !== null) {
    const [, attrs, name] = m;
    if (ICON_NAME.test(name)) icons.add(name);
    const key = /data-i18n="([^"]+)"/.exec(attrs);
    if (key) i18nKeys.add(key[1]);
  }
  return { icons, i18nKeys };
}

/**
 * Icon names passed as data rather than markup, e.g. the unit-converter
 * category table (`icon: 'straighten'`) rendered through innerHTML, or an
 * `infoHint(..., { icon: 'x' })` override. Emoji icons in tool-registry.js do
 * not match ICON_NAME and are ignored.
 */
function scanIconProps(text) {
  const icons = new Set();
  const prop = /\bicon:\s*["']([a-z][a-z0-9_]*)["']/g;
  let m;
  while ((m = prop.exec(text)) !== null) icons.add(m[1]);
  return icons;
}

function readNested(obj, dottedKey) {
  return dottedKey.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

/**
 * Resolve every icon-bearing data-i18n key in all ten catalogs. Today every
 * locale leaves these values untranslated, but a translator who "localizes"
 * an icon name would otherwise silently ship a glyph we never subset.
 */
async function scanCatalogs(i18nKeys) {
  const icons = new Set();
  if (i18nKeys.size === 0) return icons;
  const files = fs
    .readdirSync(I18N_DIR)
    .filter((f) => f.endsWith(".js") && !f.endsWith(".test.js"));
  for (const file of files) {
    let catalog;
    try {
      catalog = (await import(path.join(I18N_DIR, file))).default;
    } catch {
      continue; // a catalog that will not import is not this script's problem
    }
    for (const key of i18nKeys) {
      const value = readNested(catalog, key);
      if (typeof value === "string" && ICON_NAME.test(value)) icons.add(value);
    }
  }
  return icons;
}

/**
 * @returns {Promise<string[]>} sorted, de-duplicated icon ligature names.
 */
export async function collectIconNames() {
  const icons = new Set(Object.keys(ALWAYS_INCLUDE));
  const i18nKeys = new Set();

  for (const file of listJsFiles(SRC_DIR)) {
    const text = fs.readFileSync(file, "utf8");
    if (!text.includes("material-symbols-rounded") && !text.includes("icon:"))
      continue;
    const markup = scanMarkup(text);
    markup.icons.forEach((i) => icons.add(i));
    markup.i18nKeys.forEach((k) => i18nKeys.add(k));
    scanIconProps(text).forEach((i) => icons.add(i));
  }

  (await scanCatalogs(i18nKeys)).forEach((i) => icons.add(i));
  return [...icons].sort();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const names = await collectIconNames();
  console.log(names.join("\n"));
  console.error(`\n${names.length} icons`);
}
