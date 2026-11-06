// @vitest-environment node
import { describe, expect, it } from "vitest";
import { handlePipeRoutes } from "./pipe.js";
import { TOOLS } from "../utils/tool-registry.js";

async function renderPipe() {
  const url = new URL("http://localhost/pipe");
  const response = await handlePipeRoutes(new Request(url, { method: "GET" }), url);
  return response.text();
}

describe("pipe route", () => {
  it("links each step's full tool to a registered tool page", async () => {
    const html = await renderPipe();
    const hrefs = [...html.matchAll(/fullTool: '([^']+)'/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThan(0);
    const paths = new Set(TOOLS.map((tool) => tool.path));
    for (const href of hrefs) expect(paths).toContain(href);
  });

  it("inlines every helper the step transforms call", async () => {
    const html = await renderPipe();
    for (const name of ["convertCase", "pipeBase64Decode", "pipeLineSort", "pipeSanitizeSteps"]) {
      expect(html).toMatch(new RegExp("function " + name + "\\d*\\("));
    }
  });

  it("does not put a landmark role on the palette search input", async () => {
    const html = await renderPipe();
    expect(html).not.toMatch(/<input[^>]*id="palette-search"[^>]*role=/);
  });
});
