import { describe, it, expect } from "vitest";
import { handleWebhookDebuggerRoutes } from "./webhook-debugger.js";

function makeRequest(method, url, options = {}) {
  const parsed = new URL(url, "http://localhost");
  const headers = new Headers(options.headers || {});
  return {
    request: new Request(url, { method, headers, body: options.body }),
    url: parsed,
  };
}

async function renderPage() {
  const { request, url } = makeRequest(
    "GET",
    "http://localhost/webhook-debugger",
  );
  const res = await handleWebhookDebuggerRoutes(request, url);
  return { res, html: await res.text() };
}

describe("handleWebhookDebuggerRoutes", () => {
  describe("GET /webhook-debugger", () => {
    it("returns an HTML response for the main page", async () => {
      const { res } = await renderPage();
      expect(res).toBeInstanceOf(Response);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/html");
    });

    it("returns null for non-GET methods", async () => {
      const { request, url } = makeRequest(
        "POST",
        "http://localhost/webhook-debugger",
      );
      expect(await handleWebhookDebuggerRoutes(request, url)).toBeNull();
    });
  });

  /**
   * The tool used to advertise a "Start Listening" workflow backed by
   * /webhook-debugger/capture and a /webhook-debugger/listen iframe. The
   * capture endpoint echoed the payload to whoever POSTed it and there was no
   * channel back to the listening browser — no polling, no SSE, no socket — so
   * a delivery sent to the advertised endpoint never appeared in the page. It
   * also meant payloads reached the Worker while the page claimed everything
   * stayed in the browser. Both endpoints are gone; these tests keep them gone.
   */
  describe("retired capture/listen endpoints", () => {
    it("no longer serves /webhook-debugger/listen", async () => {
      const { request, url } = makeRequest(
        "GET",
        "http://localhost/webhook-debugger/listen?session=abc123",
      );
      expect(await handleWebhookDebuggerRoutes(request, url)).toBeNull();
    });

    it("no longer accepts payloads at /webhook-debugger/capture", async () => {
      for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
        const { request, url } = makeRequest(
          method,
          "http://localhost/webhook-debugger/capture",
          { body: method === "OPTIONS" ? undefined : '{"event":"push"}' },
        );
        expect(
          await handleWebhookDebuggerRoutes(request, url),
          method,
        ).toBeNull();
      }
    });

    it("does not offer a listener workflow in the page copy", async () => {
      const { html } = await renderPage();
      expect(html).not.toMatch(/Start Listening/i);
      expect(html).not.toMatch(/Waiting for webhooks/i);
      expect(html).not.toContain("/webhook-debugger/capture");
      expect(html).not.toContain("/webhook-debugger/listen");
    });
  });

  describe("page copy matches what the tool does", () => {
    it("positions the tool as a paste-in inspector", async () => {
      const { html } = await renderPage();
      expect(html).toContain("Webhook Payload Inspector");
      expect(html).toMatch(/Paste a webhook request/i);
      expect(html).toMatch(/does not receive live deliveries/i);
    });

    it("keeps the local inspection affordances", async () => {
      const { html } = await renderPage();
      for (const id of [
        "raw-request",
        "inspect-btn",
        "headers-content",
        "body-content",
        "sig-secret",
        "verify-sig-btn",
        "copy-curl-btn",
        "replay-btn",
      ]) {
        expect(html, id).toContain(`id="${id}"`);
      }
    });
  });

  describe("unknown sub-paths", () => {
    it("returns null for /webhook-debugger/unknown", async () => {
      const { request, url } = makeRequest(
        "GET",
        "http://localhost/webhook-debugger/unknown",
      );
      const res = await handleWebhookDebuggerRoutes(request, url);
      expect(res).toBeNull();
    });
  });
});
