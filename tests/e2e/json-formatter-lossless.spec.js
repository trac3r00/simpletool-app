import { test, expect } from "@playwright/test";

const evidenceDirectory = process.env.JSON_EVIDENCE_DIR;
const input = '{"id":9007199254740993,"ok":true}';
const pretty = ['{', '  "id": 9007199254740993,', '  "ok": true', '}'].join("\n");

test("desktop Format Minify and Copy preserve an unsafe integer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/json-formatter");
  await page.locator("#re-input").fill(input);

  await page.locator("#format-btn").click();
  await expect(page.locator("#json-output")).toHaveValue(pretty);
  await expect(page.locator("#re-output")).toHaveText(pretty);
  await expect(page.locator("#status-indicator")).toHaveText(/Valid/);
  await page.locator("#re-output-wrap").scrollIntoViewIfNeeded();
  if (evidenceDirectory) {
    await page.screenshot({
      path: `${evidenceDirectory}/json-desktop-1440x1000.png`,
    });
  }

  await page.locator("#minify-btn").click();
  await expect(page.locator("#json-output")).toHaveValue(input);
  await expect(page.locator("#re-output")).toHaveText(input);
  await page.evaluate(() => {
    const nativeWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
    window.clipboardWriteCompleted = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Clipboard write did not complete")), 5000);
      navigator.clipboard.writeText = async (text) => {
        try {
          await nativeWriteText(text);
          clearTimeout(timeout);
          resolve();
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
          throw error;
        } finally {
          navigator.clipboard.writeText = nativeWriteText;
        }
      };
    });
  });
  await page.locator("#copy-btn").click();
  await page.evaluate(() => window.clipboardWriteCompleted);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(input);
});

test("malformed input errors and clears stale success output", async ({ page }) => {
  await page.goto("/json-formatter");
  await page.locator("#re-input").fill('{"ok":true}');
  await page.locator("#format-btn").click();
  await expect(page.locator("#status-indicator")).toHaveText(/Valid/);

  await page.locator("#re-input").fill('{"id":}');
  await page.locator("#format-btn").click();
  await expect(page.locator("#status-indicator")).toHaveText(/Invalid/);
  await expect(page.locator("#status-content")).not.toBeEmpty();
  await expect(page.locator("#json-output")).toHaveValue("");
  await expect(page.locator("#re-output")).toHaveText("");
});

test("mobile JSON formatting preserves ordinary structure and numeric lexemes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/json-formatter");
  await page.locator("#re-input").fill('{"a":1,"b":[true,false]}');
  await page.locator("#format-btn").click();
  await expect(page.locator("#json-output")).toHaveValue(
    ['{', '  "a": 1,', '  "b": [', "    true,", "    false", "  ]", '}'].join("\n"),
  );
  await expect(page.locator("#status-indicator")).toHaveText(/Valid/);

  const preciseInput = '{"id":9007199254740993,"ok":true}';
  await page.locator("#re-input").fill(preciseInput);
  await page.locator("#format-btn").click();
  await expect(page.locator("#json-output")).toHaveValue(
    ['{', '  "id": 9007199254740993,', '  "ok": true', '}'].join("\n"),
  );
  await page.locator("#re-output-wrap").scrollIntoViewIfNeeded();
  if (evidenceDirectory) {
    await page.screenshot({
      path: `${evidenceDirectory}/json-mobile-390x844.png`,
    });
  }
  await page.locator("#minify-btn").click();
  await expect(page.locator("#json-output")).toHaveValue(preciseInput);
});
