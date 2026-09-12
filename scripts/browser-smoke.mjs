#!/usr/bin/env node
/**
 * Real-browser smoke test that does not need Playwright.
 *
 * Playwright's chromium install truncates during extraction on some machines
 * (the payload downloads, then the browser directory ends up a few hundred KB),
 * which makes `npm run test:e2e` fail with `browserType.launch: Executable
 * doesn't exist` regardless of code health. This script gets real browser
 * coverage from Safari instead.
 *
 * How it works: a local server renders each route through the actual
 * `handlersById` and injects a collector into <head>. The collector captures
 * window.onerror, unhandledrejection, console.error and failed asset loads,
 * probes the DOM, then POSTs the verdict back to /__report. Pages are driven
 * with `osascript`, so no Safari "Allow JavaScript from Apple Events"
 * permission is required — the page talks to the server, not AppleScript.
 *
 *   node scripts/browser-smoke.mjs                # all tools, load + interact
 *   node scripts/browser-smoke.mjs --no-interact  # load only (faster)
 *   node scripts/browser-smoke.mjs --only json-formatter,qr-code
 *   node scripts/browser-smoke.mjs --port 8790
 *
 * Exits non-zero if any tool reports an error or a probe anomaly.
 * macOS + Safari only. Requires `npm run build` first (serves dist/).
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
const flag = (name) => argv.includes(name);
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const PORT = Number(opt("--port", "8788"));
const INTERACT = !flag("--no-interact");
const ONLY = opt("--only", null)
  ?.split(",")
  .map((s) => s.trim());
const SETTLE_MS = INTERACT ? 8000 : 4500;

const targets = TOOLS.filter((t) => !ONLY || ONLY.includes(t.id));
if (!targets.length) {
  console.error(`no tools matched --only ${ONLY?.join(",")}`);
  process.exit(2);
}

const byPath = new Map(TOOLS.map((t) => [t.path, t.id]));
const results = new Map();

const MIME = {
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};

const collector = (id) => `<script>
(function(){
 var E=[];
 window.addEventListener('error',function(e){
   E.push({k:e.target&&e.target.tagName?'asset':'error',
     m:String(e.message||(e.target&&e.target.src)||e.error||''),
     src:String(e.filename||(e.target&&(e.target.src||e.target.href))||''),line:e.lineno||0});
 },true);
 window.addEventListener('unhandledrejection',function(e){
   E.push({k:'reject',m:String((e.reason&&e.reason.message)||e.reason)});
 });
 var ce=console.error;
 console.error=function(){
   E.push({k:'console',m:Array.prototype.map.call(arguments,String).join(' ').slice(0,300)});
   return ce.apply(console,arguments);
 };
 window.__ERRPUSH=function(o){E.push(o);};
 function report(){
   var probe={};
   try{
     var g=document.querySelectorAll('.tool-group');
     probe.h1=document.querySelectorAll('h1').length;
     probe.groups=g.length;
     probe.groupFilled=0;
     for(var i=0;i<g.length;i++){
       if(g[i].classList.contains('tool-group--inset'))continue;
       var bg=getComputedStyle(g[i]).backgroundColor;
       if(bg&&bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent')probe.groupFilled++;
     }
     probe.inputs=document.querySelectorAll('.input,.input-mono').length;
     probe.bodyText=(document.body.innerText||'').trim().length;
   }catch(err){probe.probeError=String(err&&err.message);}
   var payload=JSON.stringify({id:${JSON.stringify(id)},errors:E,probe:probe});
   try{ navigator.sendBeacon('/__report',payload); }
   catch(e){ var x=new XMLHttpRequest(); x.open('POST','/__report',true);
             x.setRequestHeader('content-type','text/plain'); x.send(payload); }
 }
 function go(){
   if(window.__interact) setTimeout(function(){ window.__interact(report); },800);
   else setTimeout(report,1500);
 }
 if(document.readyState==='complete')go(); else window.addEventListener('load',go);
})();
</script>`;

/** Fills visible fields with type-plausible values, then clicks action buttons. */
const driver = `<script>
(function(){
 var SKIP=/copy|download|share|print|clipboard|theme|language|close|dismiss|cancel|reset|clear/i;
 var GO=/generate|format|convert|decode|encode|run|build|analyze|mask|minify|beautify|parse|validate|scan|calculate|compute|create|apply|optimize|compare|diff|hash|sign|verify|preview|render|load sample|sample|example|start|submit/i;
 function sample(el){
   var t=(el.getAttribute('type')||'').toLowerCase();
   var id=(el.id||'')+' '+(el.getAttribute('placeholder')||'');
   if(t==='number')return '8';
   if(t==='email')return 'user@example.com';
   if(t==='url')return 'https://example.com/a';
   if(t==='color'||t==='range'||t==='checkbox'||t==='radio'||t==='file')return null;
   if(/json/i.test(id))return '{"a":1,"b":[2,3]}';
   if(/yaml/i.test(id))return 'a: 1\\nb:\\n  - 2';
   if(/sql/i.test(id))return 'select 1 from t where x=2';
   if(/cidr|ip/i.test(id))return '10.0.0.0/24';
   if(/cron/i.test(id))return '*/5 * * * *';
   if(/regex|pattern/i.test(id))return '[a-z]+';
   if(/jwt|token/i.test(id))return 'eyJhbGciOiJIUzI1NiJ9.eyJhIjoxfQ.x';
   if(/url|endpoint|host|domain/i.test(id))return 'https://example.com/a';
   if(/hex/i.test(id))return 'deadbeef';
   if(/markdown|md/i.test(id))return '# Title\\n\\ntext';
   return 'test input 123';
 }
 window.__interact=function(done){
   try{
     var f=document.querySelectorAll('input:not([type=hidden]),textarea');
     for(var i=0;i<f.length;i++){
       var el=f[i];
       if(el.disabled||el.readOnly||el.offsetParent===null)continue;
       var v=sample(el); if(v===null)continue;
       el.focus(); el.value=v;
       el.dispatchEvent(new Event('input',{bubbles:true}));
       el.dispatchEvent(new Event('change',{bubbles:true}));
     }
     var picked=[].slice.call(document.querySelectorAll('button,[role=button]')).filter(function(b){
       var txt=(b.innerText||b.textContent||'')+' '+(b.id||'')+' '+(b.getAttribute('aria-label')||'');
       if(SKIP.test(txt))return false;
       if(b.disabled||b.offsetParent===null)return false;
       return GO.test(txt);
     }).slice(0,6);
     var n=0;
     (function next(){
       if(n>=picked.length){ setTimeout(done,900); return; }
       try{ picked[n].click(); }catch(e){}
       n++; setTimeout(next,450);
     })();
   }catch(e){ window.__ERRPUSH({k:'driver',m:String(e&&e.message)}); setTimeout(done,300); }
 };
})();
</script>`;

/** Known-bad page used to prove the harness is not reporting vacuous success. */
const faults =
  `<script src="/__definitely-missing-asset.js"></script>` +
  `<script>console.error("SELFTEST console.error");` +
  `setTimeout(function(){ null.boom; },200);` +
  `Promise.reject(new Error("SELFTEST rejection"));</script>`;

/**
 * Inject before the LAST </body>. Some routes (markdown-editor) embed a
 * literal '</body>' inside a client-side print template; splicing at the
 * first match lands inside a JS array and throws a bogus SyntaxError.
 */
function injectBeforeBodyEnd(html, snippet) {
  const i = html.lastIndexOf("</body>");
  return i < 0 ? html + snippet : html.slice(0, i) + snippet + html.slice(i);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/__report" && req.method === "POST") {
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
  const distFile = path.join(ROOT, "dist", url.pathname);
  if (
    url.pathname !== "/" &&
    fs.existsSync(distFile) &&
    fs.statSync(distFile).isFile()
  ) {
    res.writeHead(200, {
      "content-type":
        MIME[path.extname(url.pathname)] || "application/octet-stream",
    });
    return res.end(fs.readFileSync(distFile));
  }
  const id = byPath.get(url.pathname);
  if (id && handlersById[id]) {
    try {
      const u = new URL("https://simpletool.app" + url.pathname + url.search);
      const r = await handlersById[id](new Request(u, { method: "GET" }), u);
      let html = await r.text();
      html = html.replace(/<head([^>]*)>/i, `<head$1>${collector(id)}`);
      if (url.searchParams.get("__interact") === "1")
        html = injectBeforeBodyEnd(html, driver);
      if (url.searchParams.get("__fault") === "1")
        html = injectBeforeBodyEnd(html, faults);
      res.writeHead(r.status, { "content-type": "text/html; charset=utf-8" });
      return res.end(html);
    } catch (e) {
      res.writeHead(500);
      return res.end("handler threw: " + e.message);
    }
  }
  res.writeHead(404);
  res.end("");
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const run = (file, args) =>
  new Promise((resolve, reject) =>
    execFile(file, args, (error, _stdout, stderr) => {
      if (error)
        reject(new Error(`${file} failed: ${stderr.trim() || error.message}`));
      else resolve();
    }),
  );
const osa = (script) => run("osascript", ["-e", script]);

let opened = false;

async function visit(url) {
  // `open location` for the first page so a document exists to navigate.
  await osa(
    opened
      ? `tell application "Safari" to set URL of document 1 to "${url}"`
      : `tell application "Safari" to open location "${url}"`,
  );
  opened = true;
}

/** Waits for a report to land, rather than assuming a fixed settle is enough. */
async function visitAndAwait(url, id, timeoutMs) {
  results.delete(id);
  await visit(url);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (results.has(id)) return results.get(id);
    await sleep(250);
  }
  return null;
}

await new Promise((r) => server.listen(PORT, r));
const base = `http://localhost:${PORT}`;
console.log(
  `browser-smoke: ${targets.length} tools on ${base} (interact=${INTERACT})`,
);

// AppleScript does not reliably launch a cold Safari process. Launch it via
// LaunchServices first, and surface either launch or navigation failures.
await run("open", ["-a", "Safari"]);
await osa('tell application "Safari" to activate');
await sleep(2000);

// 1. Prove the harness detects errors before trusting any clean result.
// Retried once: a first-run cold start is slow, and a false SELF-TEST FAILED
// is just as unhelpful as a false pass.
const probeTool = targets[0];
let selfTest = null;
for (const budget of [SETTLE_MS + 8000, SETTLE_MS + 12000]) {
  selfTest = await visitAndAwait(
    `${base}${probeTool.path}?__fault=1`,
    probeTool.id,
    budget,
  );
  if (selfTest) break;
  console.log("  self-test: no report yet, retrying...");
}
const kinds = new Set((selfTest?.errors ?? []).map((e) => e.k));
for (const need of ["asset", "console", "reject", "error"]) {
  if (!kinds.has(need)) {
    console.error(
      `SELF-TEST FAILED: harness did not detect a '${need}' fault. ` +
        `A clean run would be meaningless, so refusing to continue.`,
    );
    server.close();
    process.exit(3);
  }
}
console.log(`self-test ok — harness detects: ${[...kinds].sort().join(", ")}`);
results.clear();

// 2. Real run.
for (const [i, tool] of targets.entries()) {
  const url = `${base}${tool.path}${INTERACT ? "?__interact=1" : ""}`;
  let r = await visitAndAwait(url, tool.id, SETTLE_MS + 6000);
  // A missing report is usually a slow navigation, not a broken page. Retry
  // once with a longer budget so a transient miss is not reported as failure —
  // a harness that cries wolf gets ignored, which is its own failure mode.
  if (!r) r = await visitAndAwait(url, tool.id, SETTLE_MS + 15000);
  const n = r?.errors.length ?? 0;
  const mark = !r ? "NO REPORT" : n === 0 ? "ok" : `${n} error(s)`;
  console.log(
    `  [${i + 1}/${targets.length}] ${tool.path} — ${mark}${!r ? " (after retry)" : ""}`,
  );
}

server.close();
await osa(
  `tell application "Safari"
     repeat with w in windows
       set i to (count of tabs of w)
       repeat while i > 0
         if URL of tab i of w contains "localhost:${PORT}" then close tab i of w
         set i to i - 1
       end repeat
     end repeat
   end tell`,
);

// 3. Verdict.
const failures = [];
for (const tool of targets) {
  const r = results.get(tool.id);
  if (!r) {
    failures.push(`${tool.id}: no report (page never finished loading?)`);
    continue;
  }
  for (const e of r.errors) {
    failures.push(
      `${tool.id}: [${e.k}] ${e.m.slice(0, 160)}${e.src ? ` @${e.src}` : ""}`,
    );
  }
  const p = r.probe ?? {};
  if (p.h1 !== 1)
    failures.push(`${tool.id}: expected exactly one <h1>, found ${p.h1}`);
  if (p.groupFilled > 0)
    failures.push(
      `${tool.id}: ${p.groupFilled} .tool-group paint their own fill (see DESIGN.md)`,
    );
  if (!p.bodyText || p.bodyText < 150)
    failures.push(
      `${tool.id}: page rendered almost no text (bodyText=${p.bodyText})`,
    );
  if (p.probeError) failures.push(`${tool.id}: probe threw ${p.probeError}`);
}

const groups = targets.reduce(
  (a, t) => a + (results.get(t.id)?.probe?.groups ?? 0),
  0,
);
const inputs = targets.reduce(
  (a, t) => a + (results.get(t.id)?.probe?.inputs ?? 0),
  0,
);
console.log(
  `\nreported ${results.size}/${targets.length} · .tool-group=${groups} · .input=${inputs}`,
);

if (failures.length) {
  console.error(`\nFAILED (${failures.length}):`);
  for (const f of failures) console.error("  " + f);
  process.exit(1);
}
console.log("PASS — no page errors, console errors, or probe anomalies.");
