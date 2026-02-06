# Changelog

This changelog is a snapshot-style record of major changes in this workspace.

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

