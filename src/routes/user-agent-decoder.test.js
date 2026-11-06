// @vitest-environment node
import { describe, expect, it } from "vitest";
import { handleUserAgentDecoderRoutes } from "./user-agent-decoder.js";

describe("user-agent-decoder route", () => {
  it("renders a paste field, parse output, and a working Use This button", async () => {
    const url = new URL("http://localhost/user-agent-decoder");
    const request = new Request(url, { method: "GET" });
    const response = await handleUserAgentDecoderRoutes(request, url);

    expect(response).not.toBeNull();
    expect(response.status).toBe(200);

    const text = await response.text();
    expect(text).toContain('id="ua-input"');
    expect(text).toContain('id="parse-btn"');
    expect(text).toContain('id="results"');
    expect(text).toContain('id="raw-output"');
    expect(text).toContain('id="use-current"');
    expect(text).toContain("uaInput.value = navigator.userAgent");
    expect(text).toContain('id="browser-name"');
  });

  it("renders the sample library, bot fields, JSON panel, and injected detector", async () => {
    const url = new URL("http://localhost/user-agent-decoder");
    const response = await handleUserAgentDecoderRoutes(new Request(url), url);
    const text = await response.text();

    expect((text.match(/class="sample-btn /g) || []).length).toBeGreaterThanOrEqual(25);
    expect(text).toContain('data-ua="curl/8.7.1"');
    expect(text).toContain('id="bot-name"');
    expect(text).toContain('id="bot-category"');
    expect(text).toContain('id="json-output"');
    expect(text).toContain('id="copy-json"');
    expect(text).toContain("function detectUserAgentBot(");
  });
});
