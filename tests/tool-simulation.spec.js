// @ts-check
import { test, expect } from '@playwright/test';
import { TOOLS } from '../src/utils/tool-registry.js';

/* ──────────────────────────────────────────────
 * Configuration via environment variables
 * ────────────────────────────────────────────── */
const SIM_SEED = parseInt(process.env.SIM_SEED || '20260205', 10);
const SIM_ITERS = parseInt(process.env.SIM_ITERS || '6', 10);
const SIM_TOOL_IDS = process.env.SIM_TOOL_IDS
  ? process.env.SIM_TOOL_IDS.split(',').map(s => s.trim())
  : null;
const SIM_FUZZ = Math.max(0, Math.min(1, parseFloat(process.env.SIM_FUZZ || '0.35')));
const SIM_STRICT = process.env.SIM_STRICT !== '0'; // default '1' → true
const SIM_MIN_SCORE = parseInt(process.env.SIM_MIN_SCORE || '70', 10);

/* ──────────────────────────────────────────────
 * Seeded PRNG  –  mulberry32
 * ────────────────────────────────────────────── */
function mulberry32(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ──────────────────────────────────────────────
 * Console-error noise filter (narrow: ads/external only)
 * ────────────────────────────────────────────── */
const NOISE_PATTERNS = [
  'favicon',
  'googletagmanager',
  'adsbygoogle',
  'pagead',
  'adsense',
  'third-party cookie',
  'ERR_BLOCKED',
  'ERR_CONNECTION_REFUSED',
];

const filterAppErrors = (errors) =>
  errors.filter((e) => !NOISE_PATTERNS.some((pat) => e.includes(pat)));

/* ──────────────────────────────────────────────
 * Page error noise filter (automation-only)
 * ────────────────────────────────────────────── */
const PAGE_ERROR_NOISE = [
  'Clipboard',
  'clipboard',
  'writeText',
  'NotAllowedError',
  'Write permission denied',
  'ResizeObserver loop',
];

/* ──────────────────────────────────────────────
 * Crash-like console error patterns (real regressions)
 * ────────────────────────────────────────────── */
const CRASH_PATTERNS = [
  /SRI|integrity/i,
  /net::ERR_/,
  /CSP|Content-Security-Policy/i,
  /SyntaxError/,
  /TypeError[\s\S]*at\s/,
  /ReferenceError/,
  /RangeError/,
  /InternalError/,
  /Uncaught/i,
];

function isCrashLikeError(msg) {
  return CRASH_PATTERNS.some((re) => re.test(msg));
}

/* ──────────────────────────────────────────────
 * Fuzz corpus — mixed-format strings chosen
 * without regard to tool identity. Picked solely
 * by field-level UI hints or at random.
 * ────────────────────────────────────────────── */
const FUZZ_CORPUS = [
  // JSON-ish
  '{"a":1,"b":[2,3],"c":{"d":true}}',
  '[{"x":"hello"},{"x":"world"}]',
  '{"nested":{"deep":{"value":42}}}',
  // YAML-ish
  'server:\n  host: 0.0.0.0\n  port: 3000\nlog_level: debug',
  'items:\n  - name: alpha\n  - name: beta',
  // SQL-ish
  'SELECT u.id, u.name FROM users u JOIN orders o ON u.id = o.uid WHERE o.total > 50;',
  "INSERT INTO events (ts, kind) VALUES ('2025-01-01', 'click');",
  // Base64-ish
  'SGVsbG8gV29ybGQhIFRoaXMgaXMgYSB0ZXN0Lg==',
  'dGVzdCBkYXRhIGZvciBmdXp6aW5n',
  // URL-ish
  'https://example.com/api/v2/search?q=test+data&limit=10&offset=0#results',
  'ftp://files.example.org/pub/data.csv',
  // Regex-ish
  '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z]{2,}$',
  '(?:https?://)?(?:www\\.)?[\\w.-]+\\.\\w{2,}',
  // Markdown-ish
  '# Title\n\n**Bold** _italic_ ~~strike~~\n\n- list item\n- [link](http://ex.com)',
  '| Col A | Col B |\n|-------|-------|\n| 1     | two   |',
  // Log-ish
  '2025-06-15T08:30:00Z ERROR [main] NullPointerException at line 42',
  '192.168.1.55 - - [15/Jun/2025:08:30:00 +0000] "GET /index HTTP/1.1" 200 1234',
  // CSV-ish
  'name,age,email\nAlice,30,alice@example.com\nBob,25,bob@example.com',
  // HTML-ish
  '<div class="card"><h2>Hello</h2><p>Some <em>content</em></p></div>',
  // CSS-ish
  'body { margin: 0; padding: 16px; font-family: sans-serif; color: #333; }',
  // Cron-ish
  '*/15 * * * *',
  '0 9 * * MON-FRI',
  // CIDR-ish
  '10.0.0.0/8',
  '2001:db8::/32',
  // JWT-ish
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.richi',
  // INI-ish
  '[database]\nhost=localhost\nport=5432\nname=myapp',
  // Shell-ish
  'curl -X POST https://api.example.com/data -H "Content-Type: application/json" -d \'{"key":"val"}\'',
  // Mermaid-ish
  'graph LR\n  A-->B\n  B-->C\n  C-->A',
  // Key=Value pairs
  'API_KEY=sk-test-1234567890\nDEBUG=true\nPORT=8080',
  // PEM-ish
  '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Z3VS5JJcds3xfn/ygWe\nGFsETCOHsGGY\n-----END PUBLIC KEY-----',
  // XML-ish
  '<?xml version="1.0"?><root><item id="1">Hello</item></root>',
  // UUID-ish
  '550e8400-e29b-41d4-a716-446655440000',
  // Timestamp-ish
  '1700000000',
  '2025-06-15T12:00:00Z',
  // Color-ish
  '#e74c3c',
  'rgb(46, 204, 113)',
  'hsl(210, 50%, 60%)',
  // User-agent-ish
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36',
  // CSP-ish
  "default-src 'self'; script-src 'nonce-abc'; img-src *",
  // SAML-ish (base64 of small XML)
  'PHNhbWw+dGVzdDwvc2FtbD4=',
  // Plain text
  'The quick brown fox jumps over the lazy dog 1234567890',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'hello world foo bar baz qux',
];

/* ──────────────────────────────────────────────
 * Weird string generator — random length, whitespace,
 * quotes, backslashes, unicode escapes (ASCII-safe)
 * ────────────────────────────────────────────── */
const WEIRD_CHARS = [
  ' ', '\t', '\n', '"', "'", '`', '\\', '/', '<', '>', '&',
  '{', '}', '[', ']', '(', ')', '|', '^', '$', '#', '!',
  '?', '*', '+', '=', '%', '@', '~', ';', ':', ',', '.',
  '\\u0000', '\\u00e9', '\\uD83D', '\\n', '\\t', '\\r',
  '0', 'a', 'Z', '_', '-',
];

function weirdString(rand) {
  // occasionally very long (up to 500 chars), usually 5-80
  const isLong = rand() < 0.1;
  const len = isLong
    ? 200 + Math.floor(rand() * 300)
    : 5 + Math.floor(rand() * 75);
  let s = '';
  for (let i = 0; i < len; i++) {
    s += WEIRD_CHARS[Math.floor(rand() * WEIRD_CHARS.length)];
  }
  return s;
}

/* ──────────────────────────────────────────────
 * Field-hint-based content picker.
 * Uses ONLY runtime UI signals (type, placeholder,
 * aria-label, id, name) — never tool metadata.
 * ────────────────────────────────────────────── */

/** Map of field-hint keywords → indices into FUZZ_CORPUS that are somewhat plausible */
const HINT_KEYWORD_RANGES = {
  json:      { start: 0,  end: 3  },
  schema:    { start: 0,  end: 3  },
  yaml:      { start: 3,  end: 5  },
  toml:      { start: 3,  end: 5  },
  config:    { start: 3,  end: 5  },
  sql:       { start: 5,  end: 7  },
  query:     { start: 5,  end: 7  },
  base64:    { start: 7,  end: 9  },
  decode:    { start: 7,  end: 9  },
  encode:    { start: 7,  end: 9  },
  url:       { start: 9,  end: 11 },
  link:      { start: 9,  end: 11 },
  qr:        { start: 9,  end: 11 },
  regex:     { start: 11, end: 13 },
  pattern:   { start: 11, end: 13 },
  markdown:  { start: 13, end: 15 },
  md:        { start: 13, end: 15 },
  log:       { start: 15, end: 17 },
  csv:       { start: 17, end: 18 },
  html:      { start: 18, end: 19 },
  css:       { start: 19, end: 20 },
  gradient:  { start: 19, end: 20 },
  style:     { start: 19, end: 20 },
  cron:      { start: 20, end: 22 },
  cidr:      { start: 22, end: 24 },
  ip:        { start: 22, end: 24 },
  subnet:    { start: 22, end: 24 },
  jwt:       { start: 24, end: 25 },
  token:     { start: 24, end: 25 },
  ini:       { start: 25, end: 26 },
  env:       { start: 25, end: 26 },
  dotenv:    { start: 25, end: 26 },
  curl:      { start: 26, end: 27 },
  api:       { start: 26, end: 27 },
  request:   { start: 26, end: 27 },
  mermaid:   { start: 27, end: 28 },
  diagram:   { start: 27, end: 28 },
  key:       { start: 28, end: 29 },
  secret:    { start: 28, end: 29 },
  pem:       { start: 29, end: 30 },
  cert:      { start: 29, end: 30 },
  xml:       { start: 30, end: 31 },
  saml:      { start: 30, end: 31 },
  uuid:      { start: 31, end: 32 },
  guid:      { start: 31, end: 32 },
  timestamp: { start: 32, end: 34 },
  unix:      { start: 32, end: 34 },
  epoch:     { start: 32, end: 34 },
  color:     { start: 34, end: 37 },
  hex:       { start: 34, end: 37 },
  rgb:       { start: 34, end: 37 },
  hsl:       { start: 34, end: 37 },
  fg:        { start: 34, end: 37 },
  bg:        { start: 34, end: 37 },
  foreground:{ start: 34, end: 37 },
  background:{ start: 34, end: 37 },
  'user-agent': { start: 37, end: 38 },
  ua:        { start: 37, end: 38 },
  browser:   { start: 37, end: 38 },
  csp:       { start: 38, end: 39 },
  mask:      { start: 15, end: 17 },
  code:      { start: 19, end: 20 },
  text:      { start: 41, end: 44 },
  input:     { start: 41, end: 44 },
  hash:      { start: 41, end: 44 },
  checksum:  { start: 41, end: 44 },
  password:  { start: 41, end: 44 },
  case:      { start: 41, end: 44 },
};

function fieldContent(rand, fieldHint) {
  const h = (fieldHint || '').toLowerCase();

  // Special typed fields — always return appropriate format
  if (h.includes('type=number') || h.includes(' number ')) {
    return String(Math.floor(rand() * 9999) + 1);
  }
  if (h.includes('type=url')) {
    return 'https://example.com/path?q=' + Math.floor(rand() * 10000);
  }
  if (h.includes('type=email')) {
    return 'fuzz' + Math.floor(rand() * 10000) + '@example.com';
  }
  if (h.includes('type=color')) {
    const r = Math.floor(rand() * 256);
    const g = Math.floor(rand() * 256);
    const b = Math.floor(rand() * 256);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Decide: fuzz or format-hinted?
  const useFuzz = rand() < SIM_FUZZ;

  if (!useFuzz) {
    // Try to match a field-hint keyword
    for (const [kw, range] of Object.entries(HINT_KEYWORD_RANGES)) {
      if (h.includes(kw)) {
        const idx = range.start + Math.floor(rand() * (range.end - range.start));
        return FUZZ_CORPUS[Math.min(idx, FUZZ_CORPUS.length - 1)];
      }
    }
  }

  // No hint matched or fuzz chosen: pick from whole corpus or weird string
  if (rand() < 0.25) {
    return weirdString(rand);
  }
  return FUZZ_CORPUS[Math.floor(rand() * FUZZ_CORPUS.length)];
}

/* ──────────────────────────────────────────────
 * In-memory file buffers for file-input uploads
 * ────────────────────────────────────────────── */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64'
);
const TEXT_LOG = Buffer.from(
  '2025-01-01 00:00:00 INFO  Application started\n2025-01-01 00:00:01 DEBUG Config loaded\n2025-01-01 00:00:02 WARN  Low memory\n',
  'utf-8'
);
const JSON_BUF = Buffer.from(
  JSON.stringify({ users: [{ name: 'Alice', role: 'admin' }, { name: 'Bob', role: 'user' }] }),
  'utf-8'
);

function pickFileForAccept(accept) {
  const a = (accept || '').toLowerCase();
  if (a.includes('image') || a.includes('png') || a.includes('jpg') || a.includes('jpeg') || a.includes('webp') || a.includes('svg'))
    return { name: 'test.png', mimeType: 'image/png', buffer: TINY_PNG };
  if (a.includes('json'))
    return { name: 'data.json', mimeType: 'application/json', buffer: JSON_BUF };
  return { name: 'sample.log', mimeType: 'text/plain', buffer: TEXT_LOG };
}

/* ──────────────────────────────────────────────
  * Smart button selection helper
  * Prefers action verbs, deprioritizes utility buttons
  * ────────────────────────────────────────────── */
const ACTION_VERBS = [
  'generate', 'analyze', 'scan', 'parse', 'decode', 'encode',
  'format', 'minify', 'validate', 'compare', 'convert', 'optimize',
  'preview', 'run', 'calculate',
];

const UTILITY_BUTTONS = [
  'copy', 'clear', 'reset', 'download', 'share', 'close', 'help',
];

/**
 * Selects a meaningful primary action button from main.
 * Prefers buttons with action verbs, deprioritizes utility buttons.
 * Falls back to first visible enabled button if no match.
 * Uses rand() to pick among multiple candidates.
 */
async function selectSmartButton(page, rand) {
  const buttons = await page.locator('main button:visible:not(:disabled)').all();
  if (buttons.length === 0) return null;

  const candidates = [];

  for (const btn of buttons) {
    const text = (await btn.textContent()).toLowerCase().trim();
    const ariaLabel = (await btn.getAttribute('aria-label') || '').toLowerCase();
    const combined = `${text} ${ariaLabel}`;

    // Check if it's an action verb button
    const isActionVerb = ACTION_VERBS.some(verb => combined.includes(verb));
    // Check if it's a utility button
    const isUtility = UTILITY_BUTTONS.some(util => combined.includes(util));

    if (isActionVerb && !isUtility) {
      candidates.push({ btn, priority: 2 }); // Highest priority
    } else if (!isUtility) {
      candidates.push({ btn, priority: 1 }); // Medium priority (non-utility, non-action)
    } else {
      candidates.push({ btn, priority: 0 }); // Lowest priority (utility)
    }
  }

  // Sort by priority descending, then pick randomly from top tier
  candidates.sort((a, b) => b.priority - a.priority);
  const topPriority = candidates[0]?.priority ?? -1;
  const topCandidates = candidates.filter(c => c.priority === topPriority);

  if (topCandidates.length === 0) return null;

  const chosen = topCandidates[Math.floor(rand() * topCandidates.length)];
  return chosen.btn;
}

/* ──────────────────────────────────────────────
  * Output/state-change snapshot helpers
  * ────────────────────────────────────────────── */
const OUTPUT_SELECTOR = [
  'main input[readonly]',
  'main input[disabled]',
  'main textarea[readonly]',
  'main textarea[disabled]',
  'main pre',
  'main code',
  'main [role="status"]',
  'main [aria-live]',
  'main [id*="output" i]',
  'main [id*="result" i]',
  'main [id*="preview" i]',
  'main [class*="output" i]',
  'main [class*="result" i]',
  'main [class*="preview" i]',
  'main canvas',
  'main img',
  'main svg',
].join(', ');

async function snapshotOutputs(page) {
   return page.evaluate((sel) => {
      const map = {};
      const els = document.querySelectorAll(sel);
      let idx = 0;
      for (const el of els) {
        // Skip invisible (0-size) elements
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        // Skip elements with display:none, visibility:hidden, or opacity:0
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')
          continue;
        
        let val;
        const tagName = el.tagName.toUpperCase();
        
        if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
          val = /** @type {HTMLInputElement} */ (el).value;
        } else if (tagName === 'IMG') {
          // For IMG: use currentSrc || src || ''
          val = (el.currentSrc || el.src || '');
        } else if (tagName === 'CANVAS') {
          // For CANVAS: use stable signature with width, height, and data URL prefix
          try {
            const dataUrl = el.toDataURL();
            val = `${el.width}x${el.height}:${dataUrl.slice(0, 50)}`;
          } catch {
            // Fallback if toDataURL fails (e.g., cross-origin canvas)
            val = `${el.width}x${el.height}`;
          }
        } else if (tagName === 'SVG') {
          // For SVG: use outerHTML prefix
          val = el.outerHTML.slice(0, 200);
        } else {
          // Default: use textContent
          val = (el.textContent || '').trim();
        }
        
        map['o' + idx] = val;
        idx++;
      }
      return map;
    }, OUTPUT_SELECTOR);
}

function didOutputChange(before, after) {
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of allKeys) {
    const b = before[k] || '';
    const a = after[k] || '';
    if (a !== b) return true;
  }
  return false;
}

/* ──────────────────────────────────────────────
 * Handled-error UI detector: visible error banner/alert
 * ────────────────────────────────────────────── */
const HANDLED_ERROR_SELECTOR = [
  'main [role="alert"]',
  'main .error',
  'main #error',
  'main [id*="error" i]',
  'main [class*="error" i]',
].join(', ');

async function hasVisibleHandledError(page) {
  return page.evaluate((sel) => {
    const els = document.querySelectorAll(sel);
    for (const el of els) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')
        continue;
      if ((el.textContent || '').trim().length > 0) return true;
    }
    return false;
  }, HANDLED_ERROR_SELECTOR);
}

/* ──────────────────────────────────────────────
 * Results accumulator (shared across all tests)
 * ────────────────────────────────────────────── */
const RESULTS = {};

/**
 * @typedef {{
 *   interacted: boolean;
 *   hadUnfilteredConsoleErrors: boolean;
 *   hadUnfilteredPageErrors: boolean;
 *   hadOutputChange: boolean;
 *   duration: number;
 * }} IterRecord
 *
 * @typedef {{
 *   name: string;
 *   total: number;
 *   passed: number;
 *   failed: number;
 *   errors: number;
 *   times: number[];
 *   iters: IterRecord[];
 *   score: number;
 * }} ToolResult
 */

function initResult(toolId, toolName) {
  /** @type {ToolResult} */
  const r = {
    name: toolName,
    total: 0,
    passed: 0,
    failed: 0,
    errors: 0,
    times: [],
    iters: [],
    score: 0,
  };
  RESULTS[toolId] = r;
}

function recordIteration(toolId, passed, ms, rec) {
  const r = RESULTS[toolId];
  r.total++;
  if (passed) {
    r.passed++;
  } else {
    r.failed++;
  }
  r.times.push(ms);
  r.iters.push(rec);
}

function recordError(toolId) {
  const r = RESULTS[toolId];
  r.total++;
  r.errors++;
  r.iters.push({
    interacted: false,
    hadUnfilteredConsoleErrors: false,
    hadUnfilteredPageErrors: false,
    hadOutputChange: false,
    duration: 0,
  });
}

/* ──────────────────────────────────────────────
 * Score computation (0-100) from iteration signals
 *
 * Components (weights sum to 100):
 *   - No page errors:       25 pts  (fraction of iters without page errors)
 *   - No console errors:    20 pts  (fraction of iters without console errors)
 *   - Output changed:       25 pts  (fraction of iters that produced output)
 *   - Interacted:           15 pts  (fraction of iters with interaction)
 *   - No exceptions:        10 pts  (fraction of iters without thrown errors)
 *   - Speed bonus:           5 pts  (avg < 1000ms → 5, < 2000ms → 3, else 0)
 * ────────────────────────────────────────────── */
function computeScore(r) {
  const n = r.total || 1;
  const noPageErr = r.iters.filter((i) => !i.hadUnfilteredPageErrors).length / n;
  const noConsErr = r.iters.filter((i) => !i.hadUnfilteredConsoleErrors).length / n;
  const outputChg = r.iters.filter((i) => i.hadOutputChange).length / n;
  const interacted = r.iters.filter((i) => i.interacted).length / n;
  const noExcept = (n - r.errors) / n;
  const avgMs = r.times.length
    ? r.times.reduce((a, b) => a + b, 0) / r.times.length
    : 9999;
  const speedBonus = avgMs < 1000 ? 5 : avgMs < 2000 ? 3 : 0;

  const raw =
    noPageErr * 25 +
    noConsErr * 20 +
    outputChg * 25 +
    interacted * 15 +
    noExcept * 10 +
    speedBonus;

  return Math.round(Math.max(0, Math.min(100, raw)));
}

function avg(arr) {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

function grade(r) {
  const rate = r.passed / (r.total || 1);
  if (rate >= 0.98 && r.errors === 0) return 'A+';
  if (rate >= 0.95) return 'A';
  if (rate >= 0.90) return 'B+';
  if (rate >= 0.85) return 'B';
  if (rate >= 0.80) return 'C+';
  if (rate >= 0.70) return 'C';
  return 'F';
}

/* ──────────────────────────────────────────────
 * Filter tools based on SIM_TOOL_IDS
 * ────────────────────────────────────────────── */
const toolsToTest = SIM_TOOL_IDS
  ? TOOLS.filter((t) => SIM_TOOL_IDS.includes(t.id))
  : TOOLS;

/* ──────────────────────────────────────────────
 * Configure serial execution (results are shared)
 * ────────────────────────────────────────────── */
test.describe.configure({ mode: 'serial' });

test.describe('Tool Simulation', () => {
  test.setTimeout(180_000);

  for (let toolIdx = 0; toolIdx < toolsToTest.length; toolIdx++) {
    const tool = toolsToTest[toolIdx];
    test(`${tool.id} (${SIM_ITERS} iterations)`, async ({ page }) => {
      initResult(tool.id, tool.name);

      const toolSeedBase = (SIM_SEED + toolIdx * 7919) | 0;

      const consoleErrors = [];
      const pageErrors = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', (err) => {
        pageErrors.push(err.stack || err.message || String(err));
      });

      for (let iter = 0; iter < SIM_ITERS; iter++) {
        const rand = mulberry32(toolSeedBase + iter * 997);
        const t0 = Date.now();
        const errBefore = consoleErrors.length;
        const pageErrBefore = pageErrors.length;

        try {
           // Navigate
           await page.goto(tool.path, { waitUntil: 'domcontentloaded', timeout: 30000 });
           await page.waitForTimeout(300);

           let interacted = false;

           /* ── Capture handled-error UI state BEFORE interaction ── */
           const hasHandledErrorUIBefore = await hasVisibleHandledError(page);

           /* ── Snapshot outputs BEFORE interaction ── */
           const snapBefore = await snapshotOutputs(page);

          /* ── Fill visible text inputs ── */
          const textInputs = page.locator(
            'main input[type="text"]:visible, main input[type="number"]:visible, main input[type="search"]:visible, main input[type="url"]:visible, main input[type="email"]:visible, main input:not([type]):visible'
          );
          const textInputCount = await textInputs.count();
          for (let ti = 0; ti < textInputCount; ti++) {
            const inp = textInputs.nth(ti);
            const isReadonly = await inp.getAttribute('readonly');
            const isDisabled = await inp.isDisabled();
            if (isReadonly !== null || isDisabled) continue;
            const inpType = (await inp.getAttribute('type').catch(() => '')) || '';
            if (inpType === 'color' || inpType === 'range' || inpType === 'file') continue;
            const fieldHint = [
              'type=' + inpType,
              await inp.getAttribute('id').catch(() => '') || '',
              await inp.getAttribute('name').catch(() => '') || '',
              await inp.getAttribute('placeholder').catch(() => '') || '',
              await inp.getAttribute('aria-label').catch(() => '') || '',
            ].join(' ');
            const content = fieldContent(rand, fieldHint);
            try {
              await inp.fill(content);
              interacted = true;
            } catch {
              // element may have become stale
            }
          }

          /* ── Fill visible textareas ── */
          const textareas = page.locator('main textarea:visible');
          const taCount = await textareas.count();
          for (let ti = 0; ti < taCount; ti++) {
            const ta = textareas.nth(ti);
            const isReadonly = await ta.getAttribute('readonly');
            const isDisabled = await ta.isDisabled();
            if (isReadonly !== null || isDisabled) continue;
            const fieldHint = [
              await ta.getAttribute('id').catch(() => '') || '',
              await ta.getAttribute('name').catch(() => '') || '',
              await ta.getAttribute('placeholder').catch(() => '') || '',
              await ta.getAttribute('aria-label').catch(() => '') || '',
            ].join(' ');
            const content = fieldContent(rand, fieldHint);
            try {
              await ta.fill(content);
              interacted = true;
            } catch {
              // element may have become stale
            }
          }

          /* ── Set visible selects to a non-default option ── */
          const selects = page.locator('main select:visible');
          const selCount = await selects.count();
          for (let si = 0; si < selCount; si++) {
            const sel = selects.nth(si);
            const isDisabled = await sel.isDisabled();
            if (isDisabled) continue;
            try {
              const options = await sel.locator('option').all();
              if (options.length > 1) {
                const idx = 1 + Math.floor(rand() * (options.length - 1));
                const val = await options[idx].getAttribute('value');
                if (val !== null) {
                  await sel.selectOption(val);
                  interacted = true;
                }
              }
            } catch {
              // some selects may be tricky
            }
          }

          /* ── Toggle checkboxes occasionally ── */
          const checkboxes = page.locator('main input[type="checkbox"]:visible');
          const cbCount = await checkboxes.count();
          for (let ci = 0; ci < cbCount; ci++) {
            if (rand() < 0.35) {
              const cb = checkboxes.nth(ci);
              const isDisabled = await cb.isDisabled();
              if (isDisabled) continue;
              try {
                const checked = await cb.isChecked();
                if (checked) {
                  await cb.uncheck();
                } else {
                  await cb.check();
                }
                interacted = true;
              } catch {
                // skip
              }
            }
          }

          /* ── Upload file if file input is present ── */
          const fileInputs = page.locator('main input[type="file"]');
          const fiCount = await fileInputs.count();
          for (let fi = 0; fi < fiCount; fi++) {
            const fileInp = fileInputs.nth(fi);
            try {
              const accept = (await fileInp.getAttribute('accept')) || '';
              const fileData = pickFileForAccept(accept);
              await fileInp.setInputFiles({
                name: fileData.name,
                mimeType: fileData.mimeType,
                buffer: fileData.buffer,
              });
              interacted = true;
            } catch {
              // file input may not be interactable
            }
          }

           /* ── Click a smart-selected action button ── */
           let clicked = false;
           const smartBtn = await selectSmartButton(page, rand);
           if (smartBtn) {
             try {
               await smartBtn.click();
               clicked = true;
               interacted = true;
             } catch {
               // button may have gone stale
             }
           }

          /* ── Poll for output change or handled-error banner (max 1500ms) ── */
          let snapAfter = await snapshotOutputs(page);
          let hadOutputChange = didOutputChange(snapBefore, snapAfter);
          if (!hadOutputChange) {
            const pollEnd = Date.now() + 1500;
            const pollInterval = 150;
            while (Date.now() < pollEnd) {
              await page.waitForTimeout(pollInterval);
              const errorVisible = await hasVisibleHandledError(page);
              if (errorVisible) break;
              snapAfter = await snapshotOutputs(page);
              hadOutputChange = didOutputChange(snapBefore, snapAfter);
              if (hadOutputChange) break;
            }
            if (!hadOutputChange) {
              snapAfter = await snapshotOutputs(page);
              hadOutputChange = didOutputChange(snapBefore, snapAfter);
            }
          }

           /* ── Detect handled error UI AFTER interaction ── */
           const hasHandledErrorUIAfter = await hasVisibleHandledError(page);

          /* ── Classify console/page errors ── */
          const newConsoleErrors = filterAppErrors(consoleErrors.slice(errBefore));
          const newPageErrors = pageErrors.slice(pageErrBefore);
          const filteredPageErrors = newPageErrors.filter(
            (e) => !PAGE_ERROR_NOISE.some((pat) => e.includes(pat))
          );

          const hadUnfilteredPageErrors = filteredPageErrors.length > 0;
          const hadUnfilteredConsoleErrors = newConsoleErrors.length > 0;

           // Determine crash-like console errors
           const crashConsoleErrors = newConsoleErrors.filter((e) => isCrashLikeError(e));

           // A console error is "handled" only if:
           // 1. Error UI transitioned from not visible to visible (before → after)
           // 2. No crash-like errors present
           const errorUITransitioned = !hasHandledErrorUIBefore && hasHandledErrorUIAfter;
           const hasOnlyHandledConsoleErrors =
             hadUnfilteredConsoleErrors &&
             crashConsoleErrors.length === 0 &&
             errorUITransitioned;

          // Pass/fail logic:
          // - Fail on any unfiltered page error
          // - Fail on crash-like console errors
          // - Allow non-crash console errors IF handled error UI is visible
          const passed =
            interacted &&
            !hadUnfilteredPageErrors &&
            (crashConsoleErrors.length === 0) &&
            (!hadUnfilteredConsoleErrors || hasOnlyHandledConsoleErrors);

          /** @type {IterRecord} */
          const rec = {
            interacted,
            hadUnfilteredConsoleErrors,
            hadUnfilteredPageErrors,
            hadOutputChange,
            duration: Date.now() - t0,
          };

           if (process.env.SIM_DEBUG === '1' && !passed) {
             console.log(
               `[DBG] ${tool.id} i=${iter} interacted=${interacted} ` +
               `ce=${JSON.stringify(newConsoleErrors)} pe=${JSON.stringify(filteredPageErrors)} ` +
               `outputChg=${hadOutputChange} handledUI=${hasHandledErrorUIAfter}`
             );
           }

           recordIteration(tool.id, passed, Date.now() - t0, rec);
         } catch (e) {
           if (process.env.SIM_DEBUG === '1') {
             console.log(`[DBG] ${tool.id} i=${iter} threw exception: ${e.message}`);
           }
           recordError(tool.id);
         }
      }

      // Compute score
      const r = RESULTS[tool.id];
      r.score = computeScore(r);

      // Strict-mode regression gate: minimum score and at least one pass
      if (SIM_STRICT) {
        expect(
          r.score,
          `${tool.id}: score ${r.score} below minimum ${SIM_MIN_SCORE}`
        ).toBeGreaterThanOrEqual(SIM_MIN_SCORE);

        expect(
          r.passed,
          `${tool.id}: expected at least 1 passing iteration, got ${r.passed}`
        ).toBeGreaterThanOrEqual(1);
      }

      // Per-tool assertion: strict gating for real regressions
      const filteredPageErrorsAll = pageErrors.filter(
        (e) => !PAGE_ERROR_NOISE.some((pat) => e.includes(pat))
      );

      // Always fail on unfiltered page errors (real crashes)
      expect(
        filteredPageErrorsAll,
        `${tool.id}: unfiltered page errors detected`
      ).toHaveLength(0);

       // Always fail on crash-like console errors (regardless of SIM_STRICT)
       const allCrashConsole = filterAppErrors(consoleErrors).filter((e) =>
         isCrashLikeError(e)
       );
       expect(
         allCrashConsole,
         `${tool.id}: crash-like console errors detected: ${JSON.stringify(allCrashConsole)}`
       ).toHaveLength(0);

       // Check that errors (thrown exceptions) are zero
       expect(
         r.errors,
         `${tool.id}: expected zero thrown errors, got ${r.errors}`
       ).toBe(0);
    });
  }

  /* ──────────────────────────────────────────────
   * Final summary report
   * ────────────────────────────────────────────── */
  test('Final report', () => {
    const ids = Object.keys(RESULTS);
    if (!ids.length) {
      console.log('No simulation data collected.');
      return;
    }

    const pad = (s, n) => String(s).padEnd(n);
    const padr = (s, n) => String(s).padStart(n);

    console.log('');
    console.log('='.repeat(110));
    console.log('  TOOL SIMULATION REPORT');
    console.log(
      `  Seed: ${SIM_SEED}  |  Iterations: ${SIM_ITERS}  |  Tools: ${ids.length}  |  Fuzz: ${SIM_FUZZ}  |  Strict: ${SIM_STRICT}`
    );
    console.log('='.repeat(110));
    console.log(
      '| ' +
        pad('Tool ID', 28) +
        ' | ' +
        pad('Tool Name', 28) +
        ' | ' +
        padr('Total', 5) +
        ' | ' +
        padr('Pass', 5) +
        ' | ' +
        padr('Fail', 5) +
        ' | ' +
        padr('Err', 4) +
        ' | ' +
        padr('Avg ms', 7) +
        ' | ' +
        padr('Score', 5) +
        ' | ' +
        padr('Grade', 5) +
        ' |'
    );
    console.log('|' + '-'.repeat(108) + '|');

    let totalAll = 0;
    let passAll = 0;
    let failAll = 0;
    let errAll = 0;
    let scoreSum = 0;

    for (const id of ids) {
      const r = RESULTS[id];
      totalAll += r.total;
      passAll += r.passed;
      failAll += r.failed;
      errAll += r.errors;
      scoreSum += r.score;
      console.log(
        '| ' +
          pad(id, 28) +
          ' | ' +
          pad(r.name, 28) +
          ' | ' +
          padr(r.total, 5) +
          ' | ' +
          padr(r.passed, 5) +
          ' | ' +
          padr(r.failed, 5) +
          ' | ' +
          padr(r.errors, 4) +
          ' | ' +
          padr(avg(r.times), 7) +
          ' | ' +
          padr(r.score, 5) +
          ' | ' +
          padr(grade(r), 5) +
          ' |'
      );
    }

    console.log('|' + '-'.repeat(108) + '|');
    const avgScore = ids.length ? Math.round(scoreSum / ids.length) : 0;
    console.log(
      `| OVERALL: ${passAll}/${totalAll} passed (${totalAll ? ((passAll / totalAll) * 100).toFixed(1) : 0}%), ` +
        `${failAll} failed, ${errAll} errors, avg score: ${avgScore}` +
        ' '.repeat(Math.max(0, 108 - 70)) +
        '|'
    );
    console.log('='.repeat(110));
    console.log('');
  });
});
