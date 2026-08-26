#!/usr/bin/env node
/**
 * Deep per-tool UI + design audit, in a real browser (Safari via osascript).
 *
 * This exists because `scripts/browser-smoke.mjs` is only a smoke test: it
 * fills every field with one generic string, clicks at most six buttons whose
 * label matches a verb regex, and asserts that nothing threw. That says
 * nothing about whether a control is wired up, whether a page is usable, or
 * whether it honours the design system.
 *
 * This audit instead, for every registered tool:
 *   - inventories EVERY interactive control (button, input, select, textarea,
 *     [role=button], summary, [tabindex])
 *   - activates each control INDIVIDUALLY and checks the DOM actually reacted,
 *     so a control wired to nothing is reported as a dead control
 *   - cycles every <select> through all of its options
 *   - asserts design/a11y invariants: accessible names, duplicate ids, tap
 *     target size, text contrast, focus visibility, heading order, horizontal
 *     overflow, and the DESIGN.md component contract
 *
 * Run:
 *   node scripts/deep-ui-audit.mjs                 # all tools
 *   node scripts/deep-ui-audit.mjs --only pipe,qr-code
 *   node scripts/deep-ui-audit.mjs --mobile        # 390px viewport pass
 *   node scripts/deep-ui-audit.mjs --json out.json # machine-readable report
 *
 * Exits non-zero if any finding at severity >= error survives. macOS + Safari.
 * Requires `npm run build` first (it serves dist/).
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { handlersById } = await import(`${ROOT}/src/routes/_handlers.js`);
const { TOOLS } = await import(`${ROOT}/src/utils/tool-registry.js`);

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};

const PORT = Number(opt("--port", "8899"));
const ONLY = opt("--only", null)?.split(",").map((s) => s.trim());
const JSON_OUT = opt("--json", null);
const MOBILE = flag("--mobile");

const targets = TOOLS.filter((t) => !ONLY || ONLY.includes(t.id));
if (!targets.length) {
  console.error("no tools matched --only");
  process.exit(2);
}
const byPath = new Map(TOOLS.map((t) => [t.path, t.id]));
const results = new Map();

const MIME = {
  ".css": "text/css", ".js": "application/javascript", ".json": "application/json",
  ".png": "image/png", ".woff2": "font/woff2", ".ico": "image/x-icon",
  ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json",
};

const PROBE = fs.readFileSync(`${ROOT}/scripts/deep-ui-probe.js`, "utf8");

function injectBeforeBodyEnd(html, snippet) {
  const i = html.lastIndexOf("</body>");
  return i < 0 ? html + snippet : html.slice(0, i) + snippet + html.slice(i);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/__audit" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const d = JSON.parse(body);
        results.set(d.id, d);
      } catch {
        /* ignore malformed beacon */
      }
      res.writeHead(204);
      res.end();
    });
    return;
  }
  if (url.pathname === "/__phase" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (process.env.AUDIT_VERBOSE) {
        try {
          const d = JSON.parse(body);
          console.log(`      · ${d.phase}${d.extra ? " (" + d.extra + ")" : ""}`);
        } catch {}
      }
      res.writeHead(204);
      res.end();
    });
    return;
  }
  const distFile = path.join(ROOT, "dist", url.pathname);
  if (url.pathname !== "/" && fs.existsSync(distFile) && fs.statSync(distFile).isFile()) {
    res.writeHead(200, { "content-type": MIME[path.extname(url.pathname)] || "application/octet-stream" });
    return res.end(fs.readFileSync(distFile));
  }
  const id = byPath.get(url.pathname);
  if (id && handlersById[id]) {
    try {
      const u = new URL("https://simpletool.app" + url.pathname + url.search);
      const r = await handlersById[id](new Request(u, { method: "GET" }), u);
      let html = await r.text();
      const cfg = JSON.stringify({ id, selfTest: url.searchParams.get("__fault") === "1" });
      html = injectBeforeBodyEnd(html, `<script>window.__AUDIT_CFG=${cfg};</script><script>${PROBE}</script>`);
      res.writeHead(r.status, { "content-type": "text/html; charset=utf-8" });
      return res.end(html);
    } catch (e) {
      res.writeHead(500);
      return res.end("threw: " + e.message);
    }
  }
  res.writeHead(404);
  res.end("");
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const osa = (s) => new Promise((r) => execFile("osascript", ["-e", s], () => r()));

let opened = false;
async function visitAndAwait(url, id, timeoutMs) {
  results.delete(id);
  await osa(
    opened
      ? `tell application "Safari" to set URL of document 1 to "${url}"`
      : `tell application "Safari" to open location "${url}"`,
  );
  opened = true;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (results.has(id)) return results.get(id);
    await sleep(300);
  }
  return null;
}

// Only one audit may drive Safari at a time: two runs fight over
// `document 1`, and the loser silently records NO REPORT for every tool.
// A lock file makes that collision loud instead of corrupting a run.
const LOCK = "/tmp/.deep-ui-audit.lock";
if (fs.existsSync(LOCK)) {
  const pid = Number(fs.readFileSync(LOCK, "utf8").trim());
  let alive = false;
  try { process.kill(pid, 0); alive = true; } catch { alive = false; }
  if (alive) {
    console.error(`another deep-ui-audit is running (pid ${pid}) and is driving Safari.`);
    console.error("Runs cannot overlap — wait for it, or kill it first.");
    process.exit(4);
  }
  fs.unlinkSync(LOCK);
}
fs.writeFileSync(LOCK, String(process.pid));
const releaseLock = () => { try { fs.unlinkSync(LOCK); } catch {} };
process.on("exit", releaseLock);
process.on("SIGINT", () => { releaseLock(); process.exit(130); });

await new Promise((r) => server.listen(PORT, r));
const base = `http://localhost:${PORT}`;
console.log(`deep-ui-audit: ${targets.length} tools on ${base}${MOBILE ? " (mobile 390px)" : ""}`);

await osa('tell application "Safari" to activate');
if (MOBILE) {
  await osa('tell application "Safari" to set bounds of front window to {0, 0, 390, 900}');
} else {
  await osa('tell application "Safari" to set bounds of front window to {0, 0, 1440, 900}');
}
await sleep(2000);

// Self-test: a deliberately broken page must produce the findings we rely on.
// Without this, "no findings" is indistinguishable from "probe never ran".
const probeTool = targets[0];
let st = null;
for (const budget of [45000, 60000]) {
  st = await visitAndAwait(`${base}${probeTool.path}?__fault=1`, probeTool.id, budget);
  if (st) break;
  console.log("  self-test: no report yet, retrying...");
}
const stKinds = new Set((st?.findings ?? []).map((f) => f.kind));
for (const need of ["dead-control", "no-accessible-name", "duplicate-id"]) {
  if (!stKinds.has(need)) {
    console.error(
      `SELF-TEST FAILED: probe did not report '${need}' on a page seeded with that defect. ` +
        `Refusing to run — a clean result would be meaningless.`,
    );
    server.close();
    process.exit(3);
  }
}
console.log(`self-test ok — probe detects: ${[...stKinds].sort().join(", ")}`);
results.clear();

for (const [i, tool] of targets.entries()) {
  const url = `${base}${tool.path}`;
  let r = await visitAndAwait(url, tool.id, 60000);
  if (!r) r = await visitAndAwait(url, tool.id, 90000);
  const n = r?.findings.length ?? 0;
  const err = (r?.findings ?? []).filter((f) => f.sev === "error").length;
  const mark = !r
    ? "NO REPORT"
    : n === 0
      ? "clean"
      : `${n} finding(s)${err ? `, ${err} error` : ""}`;
  const inv = r ? ` [${r.inventory.total} controls, ${r.inventory.activated} activated]` : "";
  console.log(`  [${i + 1}/${targets.length}] ${tool.path} — ${mark}${inv}`);
}

server.close();
await osa(
  `tell application "Safari"
     repeat with w in windows
       set i to (count of tabs of w)
       repeat while i > 0
         if URL of tab i of w contains "localhost:" then close tab i of w
         set i to i - 1
       end repeat
     end repeat
   end tell`,
);

// ---------------------------------------------------------------- report
const all = [];
for (const tool of targets) {
  const r = results.get(tool.id);
  if (!r) {
    all.push({ tool: tool.id, sev: "error", kind: "no-report", msg: "page never reported", at: "" });
    continue;
  }
  for (const f of r.findings) all.push({ tool: tool.id, ...f });
}

const byKind = new Map();
for (const f of all) {
  if (!byKind.has(f.kind)) byKind.set(f.kind, []);
  byKind.get(f.kind).push(f);
}

const totals = targets.reduce(
  (a, t) => {
    const r = results.get(t.id);
    if (r) {
      a.controls += r.inventory.total;
      a.activated += r.inventory.activated;
      a.selects += r.inventory.selectOptions;
    }
    return a;
  },
  { controls: 0, activated: 0, selects: 0 },
);

console.log(
  `\ninventory: ${totals.controls} controls across ${results.size} tools · ` +
    `${totals.activated} individually activated · ${totals.selects} select-options cycled`,
);

const order = { error: 0, warn: 1, info: 2 };
console.log(`\nfindings by kind (${all.length} total):`);
for (const [kind, list] of [...byKind.entries()].sort(
  (a, b) => order[a[1][0].sev] - order[b[1][0].sev] || b[1].length - a[1].length,
)) {
  const tools = [...new Set(list.map((f) => f.tool))];
  console.log(`  ${list[0].sev.toUpperCase().padEnd(5)} ${kind.padEnd(24)} ${String(list.length).padStart(4)} in ${tools.length} tool(s)`);
}

if (JSON_OUT) {
  fs.writeFileSync(JSON_OUT, JSON.stringify({ totals, findings: all }, null, 1));
  console.log(`\nfull report → ${JSON_OUT}`);
}

const errors = all.filter((f) => f.sev === "error");
if (errors.length) {
  console.error(`\n${errors.length} ERROR-severity finding(s). First 25:`);
  for (const f of errors.slice(0, 25)) console.error(`  ${f.tool}: [${f.kind}] ${f.msg} ${f.at}`);
  process.exit(1);
}
console.log("\nPASS — no error-severity findings.");
