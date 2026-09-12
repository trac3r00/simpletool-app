import { describe, expect, it } from "vitest";

import { handlePasswordGeneratorRoutes } from "./password-generator.js";

describe("password generator route boundaries", () => {
  for (const prefix of [
    "password",
    "username",
    "passphrase",
    "email",
    "cyberchef",
    "qr",
  ]) {
    it(`does not expose the disabled /api/${prefix} branch`, async () => {
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
