import { describe, expect, it } from "vitest";
import { handleJSONFormatterRoutes } from "./json-formatter.js";

describe("JSON formatter route", () => {
  it("wires the lossless formatter into both browser actions", async () => {
    const request = new Request("https://example.com/json-formatter");
    const response = await handleJSONFormatterRoutes(
      request,
      new URL(request.url),
    );
    const html = await response.text();

    expect(html).toContain("function formatJsonLosslessly");
    expect(html).toContain("formatJsonLosslessly(input, 2)");
    expect(html).toContain("formatJsonLosslessly(input, 0)");
  });
});
