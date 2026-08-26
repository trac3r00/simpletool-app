#!/usr/bin/env node
/**
 * Generic, section-scoped i18n backfill.
 *
 * WHY THIS EXISTS
 * ---------------
 * `scripts/i18n-translate.js` translated only ko/ja/es, and only for the ~800
 * English phrases that appear in its hand-written DICT; `translate()` returns
 * the English string verbatim on a dictionary miss. `scripts/i18n-merge.js`
 * then wrote all ten catalogs with `enToTarget[en] || en`, and `loadLangMap()`
 * returns `{}` when `/tmp/i18n-<lang>.json` is absent — which it always was for
 * zh-CN, zh-TW, fr, de, pt and vi. Those six catalogs were therefore populated
 * with English VALUES under correct KEYS from the very first commit. Key-parity
 * tests (`rendered-keys.test.js`, `embedded-tools.test.js`) pass on them
 * because the keys are all present; only the values are wrong.
 *
 * This script is the tool for paying that debt down incrementally, one tool or
 * one section at a time, without the hazards that bit `i18n-network-reference`:
 *
 *   (a) EVERY key search is scoped to ONE section of ONE tool. Sections reuse
 *       key names across a tool block — `dns-reference` has both
 *       `cheatsheet.title` and `ui.title` — and a block-wide match clobbers the
 *       wrong one.
 *   (b) Sections are MERGED INTO, never replaced. Replacing a section silently
 *       deletes sibling keys that were already translated.
 *   (c) A locale with no entry for a key is SKIPPED, never written. Writing the
 *       English fallback is what created this mess in the first place.
 *   (d) The result is syntax-checked before it is written, and the script is
 *       idempotent: re-running with unchanged data produces no diff.
 *
 * USAGE
 * -----
 *   node scripts/i18n-backfill.mjs            # apply PATCH below
 *   node scripts/i18n-backfill.mjs --dry-run  # report, write nothing
 *   node scripts/i18n-backfill.mjs --tool bandwidth-calculator   # one tool
 *
 * Then run the normal build. Parity stays enforced by
 * `src/i18n/rendered-keys.test.js` and `src/i18n/embedded-tools.test.js`.
 *
 * FILLING IN `PATCH`
 * ------------------
 * Shape: tool id -> section -> key -> { locale: "translation" }.
 * `en` is the source of truth and is never written by this script; list it only
 * as a comment so a reviewer can see what is being translated. Omit any locale
 * you have not translated yet — omission is safe, English is not.
 *
 *   const PATCH = {
 *     "bandwidth-calculator": {
 *       ui: {
 *         // en: "Calculate Required Bandwidth"
 *         heading2: {
 *           ko: "필요 대역폭 계산",
 *           ja: "必要な帯域幅を計算",
 *           // es/zh-CN/zh-TW/fr/de/pt/vi still to do
 *         },
 *       },
 *     },
 *   };
 *
 * Values that must STAY English — RFC names, HTTP methods, header names, IPv4,
 * EtherType, TTL, SELECT, code samples, format literals, brand names,
 * base64/hex fixtures, CLI flags, MIME types, file extensions — simply get no
 * entry here.
 *
 * FILLING IN `GLOSSARY`
 * ---------------------
 * Most of the debt is not tool-specific. 1,817 distinct English ui/js values
 * account for 2,357 still-English paths across the six untranslated locales,
 * and the head of that distribution is shared page chrome: "Client-Side Only"
 * appears at 43 paths, "Privacy First" at 39, "Copy" at 33, "Clear" at 23. The
 * top 300 distinct values cover 36% of the gap. `GLOSSARY` translates by VALUE
 * so one entry fixes every path holding that string:
 *
 *   const GLOSSARY = {
 *     "Client-Side Only": { ko: "클라이언트 전용", fr: "Côté client uniquement" },
 *   };
 *
 * A glossary entry is applied to a path ONLY when that locale's current value
 * is still byte-identical to `en`. An already-translated value is never
 * touched, so this can be re-run safely as the dictionary grows.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

/** Catalog locale code -> file. `en` is the source of truth, never written. */
const LOCALES = ["ko", "ja", "es", "zh-CN", "zh-TW", "fr", "de", "pt", "vi"];

/** Override for tests; defaults to the real catalog directory. */
const I18N_DIR = process.env.I18N_DIR || "src/i18n";

// ---------------------------------------------------------------------------
// PATCH — fill this in. Empty by design: an empty PATCH is a no-op.
// ---------------------------------------------------------------------------

/** tool -> section -> key -> locale -> translation. @type {Record<string, Record<string, Record<string, Record<string,string>>>>} */
const PATCH = {
  // "bandwidth-calculator": {
  //   ui: {
  //     heading2: { ko: "", ja: "" },
  //   },
  // },
};

/** English value -> locale -> translation. Applied wherever the locale still holds the English. */
const GLOSSARY = {
  // "Client-Side Only": { ko: "", ja: "" },
  // "Privacy First": { ko: "", ja: "" },
};

// ---------------------------------------------------------------- upsert ---
// The three helpers below are lifted from scripts/i18n-network-reference.mjs,
// where their edge cases were found the hard way. Do not "simplify" them.

const j = (v, indent) =>
  JSON.stringify(v, null, 2).replace(/\n/g, "\n" + " ".repeat(indent));

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The whole `"<tool>": { ... }` block, so no edit can stray to another tool. */
function toolBlock(src, tool) {
  const re = new RegExp(
    `^    "?${esc(tool)}"?: \\{$[\\s\\S]*?^    \\},?$`,
    "m",
  );
  const m = src.match(re);
  if (!m) throw new Error(`no catalog entry for tool "${tool}"`);
  return m;
}

/**
 * Start of the next key at section depth. Must accept a QUOTED key: catalogs
 * hold entries such as `"spin-button": "SPIN"` alongside `button0: "Copy"`,
 * and a `\w+`-only boundary silently runs past them into the following key.
 */
const NEXT_KEY = '\\n        (?:"[^"]+"|\\w+):';

/**
 * Returns [start, end) of one section's body inside a tool block, so an upsert
 * cannot stray outside it. This matters: `dns-reference` has BOTH `ui` and
 * `cheatsheet`, and `cheatsheet` already defines `title`. Searching the whole
 * block for `title:` matched the cheatsheet's and clobbered it.
 */
function sectionBody(block, name) {
  const open = block.match(new RegExp(`^      ${esc(name)}: \\{$`, "m"));
  if (!open) return null;
  const from = open.index + open[0].length;
  const close = block.slice(from).match(/^      \},?$/m);
  if (!close) throw new Error(`unterminated "${name}" section`);
  return [from, from + close.index];
}

/**
 * Merges keys INTO a section, creating the section only if it is absent.
 * Replacing the whole section is wrong: sections already carry translated
 * siblings, and an earlier version of the network-reference script overwrote a
 * section and silently deleted them. Green build, green tests, lost work.
 */
function upsertSectionKeys(block, name, values) {
  const span = sectionBody(block, name);
  if (!span) {
    const entry = `      ${name}: ${j(values, 6)},`;
    const close = block.lastIndexOf("\n    },");
    return block.slice(0, close) + "\n" + entry + block.slice(close);
  }
  const [from, to] = span;
  let body = block.slice(from, to);
  for (const [key, value] of Object.entries(values)) {
    const entry = `\n        ${key}: ${j(value, 8)},`;
    const existing = new RegExp(
      `\\n        ${esc(key)}: [\\s\\S]*?(?=${NEXT_KEY}|$)`,
    );
    // Function replacement: a plain string would let `$&` or `$1` inside a
    // translated value be interpreted as a capture reference.
    body = existing.test(body)
      ? body.replace(existing, () => entry)
      : entry + body;
  }
  return block.slice(0, from) + body + block.slice(to);
}

/** Refuse to write a catalog that would not parse. */
function assertParses(source, label) {
  const tmp = path.join(os.tmpdir(), `i18n-backfill-${label}-${Date.now()}.mjs`);
  fs.writeFileSync(tmp, source);
  const res = spawnSync(process.execPath, ["--check", tmp], {
    encoding: "utf-8",
  });
  fs.unlinkSync(tmp);
  if (res.status !== 0) {
    throw new Error(`generated ${label}.js failed syntax check:\n${res.stderr}`);
  }
}

// ------------------------------------------------------------------ main ---

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const onlyTool = args.includes("--tool")
  ? args[args.indexOf("--tool") + 1]
  : null;

const absolute = (p) => path.resolve(p);
const load = async (locale) =>
  (await import(absolute(path.join(I18N_DIR, `${locale}.js`)))).default;

/**
 * Every `tools.<tool>.<section>.<key>` path holding a string, as
 * [tool, section, key, value]. Deliberately restricted to that exact depth:
 * the upsert helpers address a key inside a section, so nested values such as
 * `dns-reference.ui.category.DS` and top-level `nav.*` / `footer.*` / `home.*`
 * are out of reach and are reported rather than silently skipped.
 */
function toolPaths(catalog) {
  const out = [];
  for (const [tool, sections] of Object.entries(catalog.tools || {})) {
    for (const [section, keys] of Object.entries(sections)) {
      if (!keys || typeof keys !== "object") continue;
      for (const [key, value] of Object.entries(keys)) {
        if (typeof value === "string") out.push([tool, section, key, value]);
      }
    }
  }
  return out;
}

/** Rearrange PATCH + GLOSSARY into tool -> section -> key -> value for one locale. */
function planFor(locale, enCatalog, localeCatalog) {
  const plan = {};
  const add = (tool, section, key, value) => {
    if (onlyTool && tool !== onlyTool) return;
    ((plan[tool] ||= {})[section] ||= {})[key] = value;
  };

  for (const [tool, sections] of Object.entries(PATCH)) {
    for (const [section, keys] of Object.entries(sections)) {
      for (const [key, byLocale] of Object.entries(keys)) {
        const value = byLocale[locale];
        // Omission is intentional and safe. Never fall back to English.
        if (value === undefined || value === "") continue;
        add(tool, section, key, value);
      }
    }
  }

  let unreachable = 0;
  if (Object.keys(GLOSSARY).length) {
    const current = new Map();
    for (const [t, s, k, v] of toolPaths(localeCatalog)) {
      current.set(`${t} ${s} ${k}`, v);
    }
    for (const [tool, section, key, enValue] of toolPaths(enCatalog)) {
      const entry = GLOSSARY[enValue];
      if (!entry) continue;
      const value = entry[locale];
      if (value === undefined || value === "") continue;
      // Only fill a value that is still the untranslated English. Never
      // overwrite work someone already did.
      if (current.get(`${tool} ${section} ${key}`) !== enValue) continue;
      add(tool, section, key, value);
    }
    // Glossary hits this script cannot address, so they are never mistaken for done.
    const reachable = new Set(toolPaths(enCatalog).map(([, , , v]) => v));
    for (const enValue of Object.keys(GLOSSARY)) {
      if (!reachable.has(enValue)) unreachable += 1;
    }
  }
  if (unreachable) {
    console.warn(
      `  NOTE: ${unreachable} GLOSSARY entr${unreachable === 1 ? "y" : "ies"} match no tools.<tool>.<section>.<key> path (nested or top-level keys need a PATCH entry)`,
    );
  }
  return plan;
}

const enCatalog = await load("en");

let touched = 0;
let written = 0;
for (const locale of LOCALES) {
  const file = path.join(I18N_DIR, `${locale}.js`);
  if (!fs.existsSync(file)) {
    console.error(`  WARNING: ${file} not found, skipping ${locale}`);
    continue;
  }
  const plan = planFor(locale, enCatalog, await load(locale));
  if (Object.keys(plan).length === 0) {
    console.log(`${locale}: nothing to apply`);
    continue;
  }

  const before = fs.readFileSync(file, "utf-8");
  let src = before;
  let keys = 0;
  for (const [tool, sections] of Object.entries(plan)) {
    const m = toolBlock(src, tool);
    let block = m[0];
    for (const [section, values] of Object.entries(sections)) {
      block = upsertSectionKeys(block, section, values);
      keys += Object.keys(values).length;
    }
    src = src.slice(0, m.index) + block + src.slice(m.index + m[0].length);
  }

  if (src === before) {
    console.log(`${locale}: no change (already applied)`);
    continue;
  }
  assertParses(src, locale);
  touched += 1;
  if (dryRun) {
    console.log(`${locale}: would update ${keys} keys (dry run)`);
  } else {
    fs.writeFileSync(file, src);
    written += 1;
    console.log(`${locale}: updated ${keys} keys`);
  }
}

console.log(
  `\n${dryRun ? touched + " locale file(s) would change" : written + "/" + LOCALES.length + " locale files updated"}`,
);
