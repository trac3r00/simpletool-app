// @vitest-environment node
import { describe, expect, it } from "vitest";
import { handleRepoOpsRoutes } from "./repo-ops.js";
import { LEGACY_REDIRECTS, tryLegacyRedirect } from "../utils/redirects.js";
import { TOOLS } from "../utils/tool-registry.js";

describe("repo-ops route", () => {
  it("combines all three workflows behind accessible tabs without duplicate static IDs", async () => {
    const url = new URL("http://localhost/repo-ops");
    const response = await handleRepoOpsRoutes(
      new Request(url, { method: "GET" }),
      url,
    );

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('role="tablist"');
    for (const id of ["inventory", "manual", "review"]) {
      expect(html).toContain(`id="repo-ops-tab-${id}"`);
      expect(html).toContain(`id="repo-ops-panel-${id}"`);
      expect(html).toContain(`aria-controls="repo-ops-panel-${id}"`);
      expect(html).toContain(`aria-labelledby="repo-ops-tab-${id}"`);
    }
    expect(html).toContain("repos-yaml-output");
    expect(html).toContain("decision-output");
    expect(html).toContain("template-select");

    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("load-sample");
    expect(ids).toContain("load-no-automation-sample");
  });

  it("replaces the three catalog entries and redirects each former path", () => {
    expect(TOOLS).toHaveLength(50);
    expect(TOOLS.find((tool) => tool.id === "repo-ops")).toBeTruthy();
    const redirects = {
      "/public-repos-yml-builder": "inventory",
      "/public-repos-not-automation": "manual",
      "/review-description-generator": "review",
    };
    for (const [path, tab] of Object.entries(redirects)) {
      expect(LEGACY_REDIRECTS[path]).toBe(`/repo-ops?tab=${tab}`);
      for (const suffix of ["", "/"]) {
        const response = tryLegacyRedirect(
          new URL(`https://simpletool.app${path}${suffix}`),
        );
        expect(response.status).toBe(301);
        expect(response.headers.get("location")).toBe(
          `https://simpletool.app/repo-ops?tab=${tab}`,
        );
      }
    }
  });
});
