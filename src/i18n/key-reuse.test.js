// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * One i18n key must never carry two different English strings.
 *
 * The extraction tooling assigned keys positionally rather than by content, so
 * several keys ended up shared by two unrelated strings. Only one value can win
 * in the catalog, which means the OTHER call site silently renders the wrong
 * message — in every language at once. Real cases this caught:
 *
 *   tools.css-gradient.js.text0   "Copy failed"        vs "Copied!"
 *     -> a FAILED clipboard write reported success to the user
 *   tools.token-studio.js.text16  "Verification error:" vs "Please paste a JWK."
 *   tools.cidr-calculator.js.text5 "Total subnets:"     vs "Use at least /"
 *   tools.ladder-game.js.status1  "Tracing..."          vs "Revealing all..."
 *
 * The inline fallback at each call site is the developer's source of truth, so
 * disagreeing fallbacks for one key prove the collision without needing to
 * inspect the catalogs at all.
 */

const ROUTE_DIR = "src/routes";
const CALL = /_t\(\s*(['"])([\w.\-]+)\1\s*,\s*(['"])((?:\\.|(?!\3)[^\\])*)\3\s*\)/g;

// Punctuation-only drift ("Copied" vs "Copied!") is a catalog-polish issue, not
// a wrong-message bug, so compare on letters and digits only.
const shape = (s) =>
  s
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function collect() {
  const byKey = new Map();
  const files = readdirSync(ROUTE_DIR).filter(
    (f) => f.endsWith(".js") && !f.endsWith(".test.js") && f !== "_handlers.js",
  );
  for (const file of files) {
    const src = readFileSync(join(ROUTE_DIR, file), "utf8");
    for (const m of src.matchAll(CALL)) {
      const key = m[2];
      const fallback = m[4];
      if (!shape(fallback)) continue;
      if (!byKey.has(key)) byKey.set(key, new Map());
      byKey.get(key).set(shape(fallback), `${file}: ${JSON.stringify(fallback)}`);
    }
  }
  return byKey;
}

describe("i18n key reuse", () => {
  it("finds translated call sites to check", () => {
    expect(collect().size).toBeGreaterThan(50);
  });

  it("never uses one key for two different English strings", () => {
    const collisions = [];
    for (const [key, variants] of collect()) {
      if (variants.size > 1) {
        collisions.push(`${key}\n    ${[...variants.values()].join("\n    ")}`);
      }
    }
    expect(collisions, `i18n key collisions:\n\n${collisions.join("\n\n")}`).toEqual([]);
  });
});
