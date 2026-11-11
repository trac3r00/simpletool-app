// Exit-code contract for scripts/browser-smoke.mjs. Safari is replaced by fake
// `open` / `osascript` executables on PATH: the fake osascript fetches the page
// the harness asked for and posts the collector's report itself, so the real
// server, self-test and verdict logic run without a browser.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOOLS } from "../utils/tool-registry.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const HARNESS = path.join(ROOT, "scripts/browser-smoke.mjs");

const FAKE_OSASCRIPT = `
const script = process.argv[process.argv.indexOf("-e") + 1] || "";
const fail = (msg) => { process.stderr.write(msg + "\\n"); process.exit(1); };
// Async IIFE, not top-level await: the file is extensionless, so Node loads it as
// CommonJS. Top-level await would depend on Node's ESM syntax detection
// re-parsing it as a module; the IIFE runs as plain CommonJS without it.
(async () => {
if (/close tab/.test(script)) {
  if (process.env.FAKE_CLEANUP_FAIL) fail("execution error: Safari got an error (-1728)");
  process.exit(0);
}
const nav = script.match(/(?:open location|set URL of document 1 to) "([^"]+)"/);
if (!nav) process.exit(0);
if (process.env.FAKE_NAV_FAIL) fail("execution error: Safari got an error (-600)");
const url = new URL(nav[1]);
const html = await (await fetch(url)).text();
const id = JSON.parse(html.match(/\\{id:("[^"]*"),errors:/)[1]);
const errors = url.searchParams.get("__fault") === "1"
  ? ["asset", "console", "reject", "error"].map((k) => ({ k, m: "fake " + k }))
  : process.env.FAKE_PAGE_ERROR ? [{ k: "error", m: "fake page error" }] : [];
const probe = { h1: 1, groups: 0, groupFilled: 0, inputs: 0, bodyText: 500 };
await fetch(new URL("/__report", url), {
  method: "POST",
  body: JSON.stringify({ id, errors, probe }),
});
})().catch((e) => fail(String(e && e.stack || e)));
`;

const FAKE_OPEN = `
if (process.env.FAKE_OPEN_FAIL) {
  process.stderr.write("Unable to find application named 'Safari'\\n");
  process.exit(1);
}
`;

let bin;

beforeAll(() => {
  bin = fs.mkdtempSync(path.join(os.tmpdir(), "browser-smoke-fakes-"));
  for (const [name, body] of [
    ["osascript", FAKE_OSASCRIPT],
    ["open", FAKE_OPEN],
  ]) {
    const file = path.join(bin, name);
    fs.writeFileSync(file, `#!${process.execPath}\n${body}`);
    fs.chmodSync(file, 0o755);
  }
});

afterAll(() => fs.rmSync(bin, { recursive: true, force: true }));

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

async function runHarness(env) {
  const port = await freePort();
  const child = spawn(
    process.execPath,
    [HARNESS, "--no-interact", "--only", TOOLS[0].id, "--port", String(port)],
    {
      cwd: ROOT,
      env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, ...env },
    },
  );
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (d) => (stdout += d));
  child.stderr.on("data", (d) => (stderr += d));
  const code = await new Promise((resolve) => child.on("close", resolve));
  return { code, stdout, stderr };
}

describe("browser-smoke harness exit codes", () => {
  it("passes a clean run", async () => {
    const r = await runHarness({});
    expect(r.code, r.stderr).toBe(0);
    expect(r.stdout).toContain("PASS");
  }, 30_000);

  it("reports the verdict when tab cleanup fails", async () => {
    const r = await runHarness({ FAKE_CLEANUP_FAIL: "1" });
    expect(r.code, r.stderr).toBe(0);
    expect(r.stdout).toContain("PASS");
    expect(r.stderr).toContain("-1728");
  }, 30_000);

  it("still fails on page errors when tab cleanup also fails", async () => {
    const r = await runHarness({ FAKE_CLEANUP_FAIL: "1", FAKE_PAGE_ERROR: "1" });
    expect(r.code).toBe(1);
    expect(r.stderr).toContain("FAILED (1)");
    expect(r.stderr).toContain("fake page error");
  }, 30_000);

  it("fails when Safari cannot be launched", async () => {
    const r = await runHarness({ FAKE_OPEN_FAIL: "1" });
    expect(r.code).not.toBe(0);
    expect(r.stderr).toContain("open failed");
    expect(r.stdout).not.toContain("PASS");
  }, 30_000);

  it("fails when navigation fails", async () => {
    const r = await runHarness({ FAKE_NAV_FAIL: "1" });
    expect(r.code).not.toBe(0);
    expect(r.stderr).toContain("osascript failed");
    expect(r.stdout).not.toContain("PASS");
  }, 30_000);
});
