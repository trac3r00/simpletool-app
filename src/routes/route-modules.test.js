// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Every route module must parse and every route must render.
 *
 * Route files are JS template literals containing an inline client script, so a
 * stray BACKTICK anywhere — including inside a code comment — silently
 * terminates the literal and turns the rest of the file into garbage. This bit
 * three separate edits in one session, and each time the symptom was confusing:
 * the failure surfaced as four unrelated suites breaking at once (heading
 * order, honest copy, placeholder escaping, shell markup), because those tests
 * iterate every tool and one unparseable route takes them all down.
 *
 * This asserts the root property directly, so the next occurrence names the
 * file instead of scattering blame.
 */

const ROUTE_DIR = "src/routes";

const routeFiles = readdirSync(ROUTE_DIR).filter(
  (f) => f.endsWith(".js") && !f.endsWith(".test.js") && f !== "_handlers.js",
);

describe("route modules", () => {
  it("finds the route files", () => {
    expect(routeFiles.length).toBeGreaterThan(40);
  });

  it("every route module imports without throwing", async () => {
    const broken = [];
    for (const file of routeFiles) {
      try {
        await import(`./${file}`);
      } catch (error) {
        broken.push(`${file}: ${String(error.message).split("\n")[0]}`);
      }
    }
    expect(broken).toEqual([]);
  });

  // NOTE: a "no unescaped backtick" heuristic used to live here and was
  // removed. Routes legitimately nest their own template literals, so scanning
  // raw source produced false positives — and the import test above proves the
  // property directly rather than by proxy: if a stray backtick breaks a
  // literal, the module cannot parse.
});
