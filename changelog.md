# Changelog

This changelog is a snapshot-style record of major changes in this workspace.

## 2026-05-07 — v2.4.1 Post-QA sweep

### Bug fixes

- **JSON Formatter**: fix max-depth and key counters (off-by-one on nested objects, array indices inflating key count). Extract `countKeys` into shared `src/utils/json-stats.js` with unit tests.
- **JSON Formatter**: clear stale output and stats on parse/minify error so the panel always reflects the current input.
- **SRI integrity**: regenerate all vendor script integrity hashes; add `scripts/update-sri.mjs` tooling so hashes stay in sync. Fix 13 duplicate `integrity=` attributes produced by a buggy initial run.
- **Clipboard**: add global `getClipboardSafetyScript()` to catch unhandled clipboard rejections (NotAllowedError / SecurityError) with a user-facing toast instead of uncaught page errors. Tighten matching to avoid swallowing non-clipboard errors.
- **Clipboard**: promote `getCopyToClipboardScript()` to `createPageTemplate()` (global), remove redundant per-route calls from 12 route files.
- **SRI crossorigin**: add `crossorigin="anonymous"` to 6 vendor script tags that had `integrity` without it.
- **Routes**: add 301 redirects for `/jwt-inspector`, `/layered-decoder`, and `/css-gradient-generator` aliases.
- **CSS**: fix `.empty-state.hidden` specificity so Tailwind's `hidden` utility actually hides empty-state placeholders.

### Tooling

- `scripts/update-sri.mjs` and `src/utils/vendor-sri.test.js`: make SRI regex attribute-order-independent (two-step matching).
- `scripts/exhaustive-qa.mjs`: new button-mash QA harness that clicks every button on every route and captures page errors.
- `scripts/sweep-routes.mjs`: route sweep script for console errors and structural checks.
- Both QA scripts: add route-count assertion to prevent false-green signals.

### Page-sweep fixes (2026-05-11)

- **Trust pills**: introduce shared `createTrustPill()` UI policy and demote redundant feature-pills across `curl-studio`, `mermaid-studio`, `markdown-editor`, `protocol-decoder`, `wireshark-filter`, `text-diff`, `sql-formatter`, `json-schema-studio`, `regex-studio`, `log-masker`, `wireguard`, and `mock-data-generator` — one privacy/trust pill per page.
- **Routes**:
  - Rename `/markdown-preview` → `/markdown-editor` (301 redirect from old slug); wire new route in `worker.js`.
  - Fix `caffeniate` → `caffeinate` spelling; add 301 from `/caffeniate`; regenerate `_handlers.js`.
  - Add tool-rename redirect helper (`src/utils/tool-rename.js`) for future renames.
- **Home page**: extract `tool-search-filter` into pure function with unit tests; live search now actually filters tool cards instead of being a no-op.
- **404 page**: add inline search bar and popular-tools recovery panel.
- **Tool fixes**:
  - `pipe`: resolve `<title>undefined</title>` and render proper page.
  - `htpasswd-generator`: "Generate entry" button now produces output (was silently no-op).
  - `ssh-key-generator`: emit OpenSSH wire format (RFC 4253) for public keys; add shared encoder util.
  - `dns-reference`: command-builder dropdown now includes DKIM/SPF/DMARC.
  - `uuid-generator`: remove redundant GUID dropdown option (duplicate of v4).
  - `code-minifier`: remove JSON tab; cross-link to JSON Formatter to avoid duplicated functionality.
- **A11y/UX**:
  - `qr`: add accessible `aria-label` to canvas.
  - `saml-decoder`: render empty-pane state correctly.
  - `regex-studio`: fix empty-counter render.
  - `cron-builder`: minute grid uses proper `role="grid"` / `role="gridcell"`; escape template literals in ARIA render to fix runtime errors.
- **Docs**: align `ssh-key-generator` and `css-gradient-generator` educational copy with shipped features.
- **Repo hygiene**: gitignore local dev artifacts (screenshots, draft tests, Claude config).
- **Version bump**: footer link, `/health`, and changelog page now show **v2.4.1**.

## Before adding the 8 tools (baseline)

- Tool count: **32**
- Architecture: **single Cloudflare Worker**, all tool processing **client-side**
- i18n: **en / ko / ja / es** via `data-i18n*` + `window._t()`
- Tests: **Vitest** unit tests + **Playwright** E2E suites

## 2026-02-05 — Added 8 new tools (32 → 40)

### New tools

- **Email Security Analyzer** (`/email-analyzer`) — Parse raw email source for SPF/DKIM/DMARC results, routing hops, identity mismatches, and embedded URLs.
- **Token Counter & Cost Estimator** (`/token-counter`) — Estimate tokens for GPT/Claude/Llama and calculate costs using user-provided pricing.
- **Prompt Template Builder** (`/prompt-template-builder`) — Generate reusable prompt templates with placeholders and optional injection guardrails.
- **SQL Formatter & Validator** (`/sql-formatter`) — Offline SQL formatting + heuristic validation (quotes/parens/comments), Postgres/MySQL-friendly.
- **Env Var Manager** (`/env-var-manager`) — Diff `.env` files across environments, mask secrets, and generate a share-safe report.
- **SVG Optimizer & Editor** (`/svg-optimizer`) — Sanitize SVG for safe preview, optimize/minify, and recolor common fill/stroke values.
- **CSP Header Builder** (`/csp-builder`) — Interactive Content-Security-Policy builder with directive explanations and safety checks.
- **Secret Scanner** (`/secret-scanner`) — Regex-based detection of leaked keys/tokens/passwords with actionable guidance and redacted output.

### Implementation

- Routes: `src/routes/email-analyzer.js`, `src/routes/token-counter.js`, `src/routes/prompt-template-builder.js`, `src/routes/sql-formatter.js`, `src/routes/env-var-manager.js`, `src/routes/svg-optimizer.js`, `src/routes/csp-builder.js`, `src/routes/secret-scanner.js`
- Tool registry: appended metadata entries in `src/utils/tool-registry.js`
- Worker routing: added imports and handler mapping in `src/worker.js`
- i18n: added full **UI + JS** translations for the 8 tools in `src/utils/i18n.js` (en/ko/ja/es)

### QA

- Added Node-only QA simulation runner: `scripts/new-tools-qa-runner.js` (**128** mock cases)
- Last run status (local): `node scripts/new-tools-qa-runner.js` → **128/128 pass**
- Last unit test status (local): `npm test` → **26/26 pass**

### Integration fixes

- `env-var-manager`: escape user-provided env name in parse notes to prevent HTML injection in the page UI.
- `token-counter`: avoid variable name collision (`t`) between translator function and timer variable.
- `sql-formatter`: avoid helper name collision (`fmt`) between `{var}` formatter and SQL formatter function.

