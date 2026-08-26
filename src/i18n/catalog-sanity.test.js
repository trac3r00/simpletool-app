// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Catalog values must be real user-facing text.
 *
 * Two defect classes shipped undetected because a broken value is still a
 * STRING under a VALID key — so the missing-key guard in `rendered-keys.test.js`
 * passed, the build passed, and every render test passed:
 *
 *  1. Extractor artifacts. The string extractor captured fragments of JS
 *     concatenation, e.g. `tools.jwt-decoder.js.tpl4 = "' + match + '"`. Where
 *     such a key was wired to dynamic content via `data-i18n`, `_patchDOM`
 *     REPLACED the real runtime value with that literal garbage. 13 elements
 *     were affected across 7 tools.
 *
 *  2. A key stored as its own value: `cidr-calculator.ui.title3` held the
 *     literal text "tools.cidr-calculator.ui.title0", so eight copy buttons
 *     showed that raw key path as their tooltip.
 */

const DIR = "src/i18n";
const LOCALES = readdirSync(DIR).filter(
  (f) => f.endsWith(".js") && !f.endsWith(".test.js"),
);

/** A value that is plainly a fragment of JS source, not prose. */
function looksLikeCodeFragment(value) {
  return (
    /'\s*\+/.test(value) || // "' + foo"
    /\+\s*'/.test(value) || // "foo + '"
    /window\._t\s*\(/.test(value) // a call expression, not prose
  );
}

/** A value that is itself a translation key path. */
function looksLikeKeyPath(value) {
  return /^(tools|nav|home|footer|common|content)\.[A-Za-z0-9_.-]+$/.test(
    value,
  );
}

function walk(node, path, visit) {
  for (const [key, value] of Object.entries(node ?? {})) {
    const next = path ? `${path}.${key}` : key;
    if (typeof value === "string") visit(next, value);
    else if (value && typeof value === "object") walk(value, next, visit);
  }
}

async function loadCatalog(file) {
  const mod = await import(`./${file}`);
  return Object.values(mod)[0];
}

describe("catalog value sanity", () => {
  it("scans every locale file", () => {
    expect(LOCALES.length).toBe(10);
  });

  it("no value is a fragment of JavaScript source", async () => {
    const offenders = [];
    for (const file of LOCALES) {
      const catalog = await loadCatalog(file);
      walk(catalog, "", (path, value) => {
        if (looksLikeCodeFragment(value)) {
          offenders.push(
            `${file} ${path} = ${JSON.stringify(value.slice(0, 50))}`,
          );
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it("no value is itself a translation key path", async () => {
    const offenders = [];
    for (const file of LOCALES) {
      const catalog = await loadCatalog(file);
      walk(catalog, "", (path, value) => {
        if (looksLikeKeyPath(value)) {
          offenders.push(`${file} ${path} = ${JSON.stringify(value)}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it("no route wires data-i18n to a value that is a code fragment", async () => {
    // Belt-and-braces: even if such a value survives above, it must never be
    // bound to markup, because that is what makes it user-visible.
    const en = await loadCatalog("en.js");
    const broken = new Set();
    walk(en, "", (path, value) => {
      if (looksLikeCodeFragment(value) || looksLikeKeyPath(value))
        broken.add(path);
    });
    const offenders = [];
    for (const name of readdirSync("src/routes")) {
      if (!name.endsWith(".js") || name.endsWith(".test.js")) continue;
      const source = readFileSync(join("src/routes", name), "utf8");
      for (const key of broken) {
        if (source.includes(`data-i18n="${key}"`))
          offenders.push(`${name}: ${key}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("the detectors recognise both defect shapes", () => {
    expect(looksLikeCodeFragment("' + match + '")).toBe(true);
    expect(looksLikeCodeFragment("Error: ' + error.message + '")).toBe(true);
    expect(looksLikeCodeFragment("Copy to clipboard")).toBe(false);
    expect(looksLikeKeyPath("tools.cidr-calculator.ui.title0")).toBe(true);
    expect(looksLikeKeyPath("Copy to clipboard")).toBe(false);
  });
});
