#!/usr/bin/env node
/**
 * Captures every tool page in both themes and both viewports, and extracts
 * design metrics from the LIVE rendered page (computed styles, not source).
 *
 * This exists so design review is evidence-based rather than eyeballed: the
 * output is a JSON metrics file plus PNGs that a review artifact can embed.
 *
 *   node scripts/design-capture.mjs                    # all tools
 *   node scripts/design-capture.mjs --only pipe,qr-code
 *   node scripts/design-capture.mjs --out .design-capture
 *
 * Requires a server already running (PW_BASE, default http://127.0.0.1:8805)
 * and PW_CHROMIUM_PATH pointing at a working Chromium — the build this
 * Playwright resolves (1208) is corrupt on this machine; 1234 works.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { TOOLS } = await import(`${ROOT}/src/utils/tool-registry.js`);

const argv = process.argv.slice(2);
const opt = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const BASE = process.env.PW_BASE || "http://127.0.0.1:8805";
const EXE = process.env.PW_CHROMIUM_PATH;
const OUT = path.resolve(ROOT, opt("--out", ".design-capture"));
const ONLY = opt("--only", null)?.split(",").map((s) => s.trim());
const SHOTS = !argv.includes("--no-shots");

const targets = TOOLS.filter((t) => !ONLY || ONLY.includes(t.id));
fs.mkdirSync(OUT, { recursive: true });

/** Runs in the page: pulls design facts from computed styles. */
function collectMetrics() {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return false;
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden";
  };
  const uniq = (arr) => [...new Set(arr)];
  const val = (el, prop) => getComputedStyle(el).getPropertyValue(prop).trim();

  const buttons = [...document.querySelectorAll("button")].filter(visible);
  const inputs = [...document.querySelectorAll("input,textarea,select")].filter(visible);
  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(visible);

  return {
    // Typography: how many distinct heading sizes does this page use?
    headingScale: uniq(headings.map((h) => `${h.tagName}:${val(h, "font-size")}`)).sort(),
    h1: headings.filter((h) => h.tagName === "H1").map((h) => ({
      size: val(h, "font-size"),
      weight: val(h, "font-weight"),
      cls: h.className,
    })),
    // Component adoption
    buttonCount: buttons.length,
    buttonsWithComponent: buttons.filter((b) =>
      /\b(btn|tab-trigger|filter-chip|info-hint|cheatsheet-toggle|mobile-tab-btn)\b/.test(b.className),
    ).length,
    inputCount: inputs.length,
    inputsWithComponent: inputs.filter((i) =>
      /\b(input|input-mono|input-search)\b/.test(i.className) ||
      /^(checkbox|radio|range|color|file|hidden|submit|button)$/i.test(i.type || ""),
    ).length,
    // Distinct button geometries — a proxy for visual consistency
    buttonShapes: uniq(
      buttons.map((b) => `${val(b, "border-radius")}|${val(b, "padding")}|${val(b, "font-size")}`),
    ),
    // Surfaces
    panelBg: (() => {
      const p = document.querySelector(".tool-page-panel");
      return p ? val(p, "background-color") : null;
    })(),
    groupsFilled: [...document.querySelectorAll(".tool-group")].filter((g) => {
      if (g.classList.contains("tool-group--inset")) return false;
      const bg = val(g, "background-color");
      return bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
    }).length,
    // Layout health
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  };
}

const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
const report = {};

for (const [i, tool] of targets.entries()) {
  report[tool.id] = { path: tool.path, name: tool.name };
  for (const theme of ["light", "dark"]) {
    for (const [vp, size] of [
      ["desktop", { width: 1440, height: 900 }],
      ["mobile", { width: 390, height: 844 }],
    ]) {
      const ctx = await browser.newContext({
        viewport: size,
        colorScheme: theme,
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      try {
        const res = await page.goto(BASE + tool.path, { waitUntil: "networkidle", timeout: 30000 });
        if (!res || res.status() !== 200) {
          report[tool.id][`${theme}-${vp}`] = { error: `status ${res && res.status()}` };
        } else {
          await page.waitForTimeout(500);
          const metrics = await page.evaluate(collectMetrics);
          metrics.pageErrors = errors.slice(0, 3);
          report[tool.id][`${theme}-${vp}`] = metrics;
          if (SHOTS && vp === "desktop") {
            await page.screenshot({
              path: path.join(OUT, `${tool.id}-${theme}.png`),
              fullPage: false,
            });
          }
        }
      } catch (e) {
        report[tool.id][`${theme}-${vp}`] = { error: e.message.slice(0, 120) };
      }
      await ctx.close();
    }
  }
  console.log(`  [${i + 1}/${targets.length}] ${tool.path}`);
}

await browser.close();
fs.writeFileSync(path.join(OUT, "metrics.json"), JSON.stringify(report, null, 1));
console.log(`\nmetrics -> ${path.join(OUT, "metrics.json")}`);
if (SHOTS) console.log(`screenshots -> ${OUT}/*.png`);
