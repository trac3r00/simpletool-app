import { describe, expect, it } from "vitest";

import { handlePasswordGeneratorRoutes } from "./password-generator.js";

// Handler-level scope only: worker.fetch never dispatches /api/* here (it
// routes by tool.path). The public /api contract is asserted end to end in
// src/worker.http-semantics.test.js.
describe("handlePasswordGeneratorRoutes in isolation", () => {
  it("serves its own page", async () => {
    const request = new Request("https://simpletool.app/password-generator");
    const response = await handlePasswordGeneratorRoutes(
      request,
      new URL(request.url),
    );

    expect(response.status).toBe(200);
  });

  for (const prefix of [
    "password",
    "username",
    "passphrase",
    "email",
    "cyberchef",
    "qr",
  ]) {
    it(`has no /api/${prefix} branch of its own`, async () => {
      const request = new Request(`https://simpletool.app/api/${prefix}`);
      const response = await handlePasswordGeneratorRoutes(
        request,
        new URL(request.url),
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Not found" });
    });
  }
});
