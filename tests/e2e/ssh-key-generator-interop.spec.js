import { spawnSync } from "node:child_process";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

test("Ed25519 private output is loadable and matches its displayed public key", async ({
  page,
}) => {
  await page.goto("/ssh-key-generator", { waitUntil: "domcontentloaded" });

  const generated = await page.evaluate(() =>
    new Promise((resolve, reject) => {
      const button = document.querySelector("#generate-btn");
      const privateKey = document.querySelector("#private-key");
      const publicKey = document.querySelector("#public-key");
      const error = document.querySelector("#keygen-error");
      const timeout = setTimeout(() => {
        observer.disconnect();
        reject(new Error("SSH key generation did not complete"));
      }, 30_000);
      const observer = new MutationObserver(() => {
        if (button.disabled) return;
        clearTimeout(timeout);
        observer.disconnect();
        if (!privateKey.value || !publicKey.value) {
          reject(new Error(error.textContent || "SSH key generation failed"));
          return;
        }
        resolve({ privateKey: privateKey.value, publicKey: publicKey.value });
      });

      observer.observe(button, {
        attributes: true,
        attributeFilter: ["disabled"],
      });
      button.click();
    }),
  );

  const directory = await mkdtemp(join(tmpdir(), "simpletool-ssh-interop-"));
  const keyPath = join(directory, "id_ed25519");
  try {
    await writeFile(keyPath, `${generated.privateKey}\n`, { mode: 0o600 });
    await chmod(keyPath, 0o600);
    const derived = spawnSync("ssh-keygen", ["-y", "-f", keyPath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 10_000,
    });

    expect(derived.stderr).toBe("");
    expect(derived.status).toBe(0);
    expect(derived.stdout.trim().split(/\s+/).slice(0, 2)).toEqual(
      generated.publicKey.trim().split(/\s+/).slice(0, 2),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
