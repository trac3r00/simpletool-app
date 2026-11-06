import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("wrangler.toml", () => {
  it("disables keep_names so fn.toString() helpers run in the browser", () => {
    const toml = readFileSync(new URL("../../wrangler.toml", import.meta.url), "utf8");
    expect(toml).toMatch(/^keep_names\s*=\s*false\s*$/m);
  });
});
