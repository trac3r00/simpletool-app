// @vitest-environment node
import { describe, expect, it } from "vitest";
import { handlersById } from "./_handlers.js";
import { getToolsForEnvironment } from "../utils/tool-registry.js";
import { SEO_META } from "../utils/seo-meta.js";

const productionTools = getToolsForEnvironment(false);

async function render(tool) {
  const url = new URL(`https://simpletool.app${tool.path}`);
  const response = await handlersById[tool.id](new Request(url), url);
  return response.text();
}

describe("search metadata (report P0-2)", () => {
  it("covers exactly the production tools", () => {
    expect(Object.keys(SEO_META).sort()).toEqual(
      productionTools.map((tool) => tool.id).sort(),
    );
  });

  it.each(Object.entries(SEO_META))(
    "%s has a search-length title and description",
    (_id, { title, description }) => {
      expect(title.length).toBeGreaterThan(10);
      expect(title.length).toBeLessThanOrEqual(62);
      expect(description.length).toBeGreaterThanOrEqual(110);
      expect(description.length).toBeLessThanOrEqual(170);
      expect(description).not.toMatch(/["<>]/);
    },
  );
});

describe("rendered tool pages", () => {
  it.each(productionTools.map((tool) => [tool.id, tool]))(
    "%s: search head, no ligature text, structured data",
    async (id, tool) => {
      const html = await render(tool);
      const seo = SEO_META[id];
      expect(html).toContain(`<title>${seo.title} | SimpleTool</title>`);
      expect(html).toContain(`<meta name="description" content="${seo.description}">`);
      // Report P0-1: an icon name as element text gets indexed ("qr_code_2").
      expect(html).not.toMatch(
        /class="material-symbols-rounded[^"]*"[^>]*>\s*[a-z][a-z0-9_]*\s*</,
      );
      expect(html).toContain('"@type":"WebApplication"');
      expect(html).toContain('"@type":"BreadcrumbList"');
      expect(html).toContain("data-local-proof");
    },
  );
});
