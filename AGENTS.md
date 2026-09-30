# AGENTS.md — SimpleTool App (Cloudflare Worker)

## Overview

47 browser-based web tools served from a single Cloudflare Worker (50 registered, including 3 dev-only games hidden in production). All tool processing is client-side. Server renders HTML via template literals in route files. Supports 10 languages (en/ko/ja/es/zh-CN/zh-TW/fr/de/pt/vi) via a client-side i18n system.

**Stack:** Cloudflare Workers (V8 isolates), Vanilla JS, Tailwind CSS 3, Vitest, Playwright.

## Merge & Release Policy

See `docs/RELEASING.md` — merge checklist (CI green + complete PR body + one-logical-change), 15-min soak rule between deploy-affecting merges, no direct pushes to main, semver tagging, hotfix flow.

## Build / Test / Deploy

```bash
npm run build           # Tailwind CSS → embed hash → vendor bundle (required before dev/deploy)
npm run dev             # build + wrangler dev at localhost:8787
npm run deploy          # build + wrangler deploy

# Unit tests (Vitest) — fast, no browser
npm test                                               # run all 624 unit tests (54 files)
npx vitest run src/utils/security.test.js              # single file
npx vitest run -t "rate limits after threshold"        # single test by name

# E2E tests (Playwright) — dev server auto-started via webServer config
npm run test:e2e                                       # all 283 E2E tests (8 spec files)
npx playwright test tests/e2e/games.spec.js            # single suite
npx playwright test tests/e2e/all-tools-smoke.spec.js  # smoke suite
npx playwright test tests/e2e/page-sweep-2026-05-11.spec.js -g "home"  # grep by name
npx playwright test --headed                           # watch in browser

# Real-browser smoke WITHOUT Playwright (macOS + Safari)
npm run test:browser                                   # all 50 tools: load + interact
node scripts/browser-smoke.mjs --no-interact           # load only (faster)
node scripts/browser-smoke.mjs --only pipe,json-formatter

# DEEP per-tool UI + design audit (macOS + Safari) — much slower, much stricter
npm run test:ui-audit                                  # all 50 tools (~45 min)
node scripts/deep-ui-audit.mjs --only pipe,qr-code     # a few tools
node scripts/deep-ui-audit.mjs --mobile                # 390px viewport pass
node scripts/deep-ui-audit.mjs --json report.json      # machine-readable
AUDIT_VERBOSE=1 node scripts/deep-ui-audit.mjs --only pipe   # per-phase trace
```

**Icon font.** `build:fonts` ships a *subset* of Material Symbols Rounded — the
full family is 5.3MB and was 98.5% of the home page's transfer. The icon list is
scanned out of `src/` by `scripts/icon-inventory.mjs`, so adding
`<span class="material-symbols-rounded">new_icon</span>` to a route needs no
extra step: the next `npm run build` refetches a subset that includes it. An icon
the scanner cannot see (injected by a helper's default, say) must be added to
`ALWAYS_INCLUDE` in that file, or it renders as the raw text `new_icon`.
`src/utils/icon-subset.test.js` fails if the shipped font and the scan disagree.
See DESIGN.md for the full contract.

**Vitest** collects `src/**/*.test.js`. **Playwright** collects `tests/**/*.spec.js`. They do not overlap (vitest.config.js excludes `tests/**/*.spec.*`).

**If Playwright cannot launch** (`browserType.launch: Executable doesn't exist`),
the chromium install has truncated during extraction — a known failure on some
machines, unrelated to code health. Diagnose in this order: remove a stale
`~/Library/Caches/ms-playwright/__dirlock`, then reinstall with
`./node_modules/.bin/playwright install chromium` (NOT `npx`, which may resolve
a newer Playwright and install a build the local launcher does not want).

If it still fails, `npm run test:browser` gives real browser coverage instead:
it serves each route through the actual `handlersById`, injects a collector that
captures `window.onerror` / `unhandledrejection` / `console.error` / failed asset
loads plus DOM probes, drives Safari with `osascript`, and exits non-zero on any
error. It fault-injects a known-bad page first and refuses to run if that is not
detected, so a green result cannot be vacuous. It is a smoke test, not a
replacement for the Playwright suite: WebKit only, and it asserts "nothing
throws", not per-tool output correctness.

**`npm run test:ui-audit`** is the deep counterpart. It inventories EVERY
interactive control per tool, activates each one individually (re-seeding inputs
before each click so a "Clear" cannot poison later controls), cycles every
`<select>` through all options, and asserts design/a11y invariants: duplicate
ids, accessible names, one `<h1>` + heading order, WCAG 2.2 tap targets, text
contrast, horizontal overflow, and the `.tool-group` no-fill contract.

Hard-won constraints — change these only with evidence:

- **Only one audit may run at a time.** Two runs fight over Safari's
  `document 1` and the loser records `NO REPORT` for every tool. A lock file
  enforces this.
- **The probe defers to `load` + 1200ms.** Tool routes bind handlers on
  `DOMContentLoaded`; running earlier reports every one of them dead.
- **It waits 250ms after each click before measuring.** This codebase has 31
  `async` click handlers whose DOM writes land in a later microtask; measuring
  synchronously reported all of them as dead controls.
- **It blocks navigation** (`submit`, `target=_blank`, `window.open`,
  `window.print`) for the duration. A `<button type="submit">` inside a form
  navigates away, and a popup steals `document 1` from the driver.
- **`settle()` must not use `requestAnimationFrame`** — Safari halts rAF in a
  background tab and the probe hangs with no report.
- **There is no focus-visibility check**, deliberately. `:focus-visible` is
  modality-driven, so programmatic focus never matches it; the check produced
  377 false findings against the global rule already in `styles/input.css`.

Like the smoke test, it fault-injects first and refuses to run (exit 3) unless
the seeded defects are detected.

## Project Structure

```
src/
  worker.js              # Entry point: routing, rate limiting, security headers
  routes/*.js            # One file per tool (HTML + inline <script> via template literals)
  utils/
    common-ui.js         # createPageTemplate(), createToolHeader(), nav, theme, ads
    i18n.js              # i18n system: TRANSLATIONS, getLanguageScript(toolId), t()
    tool-registry.js     # TOOLS array — single source of truth for tool metadata
    security.js          # Rate limiting, CSP nonce, security headers
    respond.js           # respondHTML(), respondJSON(), respond404(), respond429()
    bundled-styles.js    # Auto-generated — do not edit (build:ui output)
  ui/
    home.js              # Home page grid (builds its own HTML, not via createPageTemplate)
    legal-pages.js       # Terms, Privacy, About, Contact, Security, Careers
scripts/
  i18n-extract.js        # Extract translatable strings from route files → manifest.json
  i18n-apply.js          # Add data-i18n attributes and _t() calls to route files
  i18n-translate.js      # Dictionary-based translation generator (ko/ja/es)
  i18n-merge.js          # Merge translations into i18n.js TRANSLATIONS object
  i18n-manifest.json     # Extracted strings manifest (generated by i18n-extract)
styles/input.css         # Tailwind source with design tokens (.btn, .card, .input, .label)
dist/                    # Build output: styles.css, vendor/*.min.js
tests/
  e2e/games.spec.js              # Game tools (ladder, roulette, marble) UI + interaction tests
  e2e/generators-utils-ui.spec.js # Generator & utility tools UI + interaction tests
  e2e/network-tools.spec.js      # Network tools UI + interaction tests
  e2e/page-sweep-2026-05-11.spec.js # Regression sweep for specific tool behaviors
  e2e/all-tools-smoke.spec.js    # Every registered tool: HTTP 200 + zero page/console errors
  helpers/tool-suite.js          # Shared test actions per tool (TOOL_ACTIONS map)
```

## Catalog Freeze

Do not add new tool pages until the eight flagships (JSON, Token studio / JWT, Regex, Cron, Password, SSH/certs, Curl, CIDR) beat the bookmarks people already use. Existing routes stay live; this freeze is about new catalog entries, not deletions.

## Adding a New Tool

1. Create `src/routes/my-tool.js` — export `handleMyToolRoutes(request, url)`
2. Register in `src/utils/tool-registry.js` — add entry to `TOOLS` array
3. Add the handler to `TOOL_HANDLERS` in `scripts/build-routes.js`, then run `npm run build`
   - `src/routes/_handlers.js` is generated from that list; never hand-edit it.
   - `src/worker.js` needs no edit: it routes off the registry (`for (const tool of runtimeTools)`).
   - `src/ui/home.js` needs no edit either: the grid is registry-driven via `getToolsForEnvironment`.
4. Add an entry to `TOOL_ACTIONS` in `tests/helpers/tool-suite.js` only if the tool
   needs shared interaction coverage in the E2E suites; most tools do not.

## ⚠️ CRITICAL: Template Literal Regex Escaping

**All route files generate HTML via backtick template literals.** Any regex inside a template literal MUST double-escape backslashes:

```js
// ❌ BROKEN — \d becomes just "d", \b becomes backspace
const html = `<script>const re = /\d+/;</script>`;

// ✅ CORRECT — \\d becomes \d at runtime
const html = `<script>const re = /\\d+/;</script>`;
```

Affected characters: `\d`, `\w`, `\s`, `\b`, `\S`, `\W`, `\D`, `\B`, `\.`

**Exception:** Files using `String.raw` backticks (e.g., `mock-data-generator.js`) preserve backslashes — single `\` is correct there.

## i18n System

Ten languages: en (default), ko, ja, es, zh-CN, zh-TW, fr, de, pt, vi. Language stored in `localStorage('language')`.

**Server-side:** `getLanguageScript(toolId, lang, i18nToolIds)` serializes translations inline. Only the active tool's `ui`/`js` data is included (other tools get name/desc only) to keep page size small. Composite routes that embed other tools' markup (`/network-reference`, `/repo-ops`) pass those tools' ids via `createPageTemplate({ i18nToolIds })` so the embedded sections' dictionaries ship too.

**Client-side:** `_patchDOM(lang)` walks `data-i18n`, `data-i18n-placeholder`, `data-i18n-title`, `data-i18n-aria` attributes. `window._t(key, fallback)` resolves JS dynamic strings.

**Translation pipeline.** Catalogs live in `src/i18n/{lang}.js` (one module per
language), not in `src/utils/i18n.js`. Author English first, then regenerate — never
hand-edit the nine non-English files.

```bash
# audit which route strings exist / lack keys (writes the manifest the apply step reads)
node scripts/i18n-extract.js --out scripts/i18n-manifest.json
node scripts/i18n-apply.js            # dry run; --write to add data-i18n attrs to routes
node scripts/i18n-embedded-tools.mjs  # regenerate the embedded-workflow catalogs (all 10 locales)
npm run build
```

Known gaps in the older scripts: `i18n-translate.js` needs an unproduced
`/tmp/i18n-strings.json` and only emits ko/ja/es, and `i18n-merge.js` still targets the
retired monolithic object and cannot insert a missing tool entry. Prefer a focused
generator like `scripts/i18n-embedded-tools.mjs`, which holds English as the source of
truth, upserts all ten locales, and is byte-stable on re-run. Key parity is enforced by
`src/i18n/embedded-tools.test.js`.

**Key naming:** `tools.{toolId}.ui.{type}{index}` for HTML, `tools.{toolId}.js.{type}{index}` for JS. Types: button, label, stat, th, heading, option, desc, badge, placeholder, title, status, text, tpl.

## Code Style

### Module Format
- ES Modules (`import`/`export`). No CommonJS. `"type": "module"` in package.json.

### Route File Pattern
```js
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { respondHTML } from '../utils/respond.js';

function renderMyToolPage() {
  const toolHeader = createToolHeader(
    { emoji: '🔧' }, 'My Tool', 'Tool description.', [{ text: 'Client-Side Only' }]
  );
  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}
      </div>
    </main>
    <script>/* client-side logic — double-escape regex! */</script>
  `;
  return createPageTemplate({ title: 'My Tool', description: '...', content, path: '/my-tool' });
}

export async function handleMyToolRoutes(request, url) {
  if (url.pathname === '/my-tool' || url.pathname === '/my-tool/') {
    if (request.method === 'GET') return respondHTML(renderMyToolPage());
  }
  return null;
}
```

**Note:** `path` in `createPageTemplate` is used to derive the `toolId` for i18n. Always pass it.

### UI Design Tokens (from `styles/input.css`)

Design language is **shadcn/ui** (token model + new-york components) ported onto
vanilla Tailwind — **no React/Radix**. Semantic HSL CSS vars live on `:root`/`.dark`
in `styles/input.css`; `tailwind.config.js` maps them to utilities. Prefer the
**semantic** tokens for new/migrated code; the numeric scales stay only for
un-migrated routes.

| Token | Usage |
|-------|-------|
| `.btn .btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-danger` | Buttons (on semantic tokens; hover via `/90` opacity) |
| `.card` | Card container — `bg-card border-border rounded-lg` |
| `.input` / `.input-mono` | Text inputs — `border-input`, focus ring `--ring` |
| `.label` | Form labels — `text-muted-foreground` |
| `.tabs-list` / `.tab-trigger` | shadcn segmented tabs (merged tools; `[aria-selected]`/`.active`) |
| `.badge` / `.badge-default` / `.badge-secondary` / `.badge-info` / `.badge-outline` | Pill labels |
| `bg-primary` / `text-primary-foreground` | **Brand violet** — semantic (`--primary` = `#7c3aed` light / `#8b5cf6` dark) |
| `bg-info` / `text-info` | **Cyan accent** (`--info` `#0891b2`/`#22d3ee`) — gradients, info states. NOT `accent` |
| `bg-accent` / `text-accent-foreground` | shadcn **neutral hover surface** (slate), *not* a brand color |
| `bg-background` / `text-foreground` / `bg-card` / `text-muted-foreground` | Page + surface + text tokens |
| `border-border` / `border-input` / `ring-ring` | Hairlines, field edges, focus rings |
| `primary-*` / `info-*` / `surface-*` | Numeric scales (violet / cyan / slate) — for small tinted elements (chips, badges, stat tiles) and form controls not yet on `.input`. Panels and groups use semantic tokens. Never `indigo-*`, `emerald-*` |
| `.text-gradient-brand` / `.bg-brand-gradient` | Violet→cyan signature gradient (large text / accents only) |
| `.tool-card` (panel) / `.tool-card-link` (grid hover) | Card panel vs. clickable grid card |
| `rounded-xl shadow-sm` | Card rounding (never `rounded-2xl shadow-lg`); `--radius` 0.5rem drives lg/md/sm |
| `max-w-7xl` | Outer container width |

### Naming Conventions
- Route handlers: `handleXxxRoutes(request, url)`
- Render functions: `renderXxxPage()`
- Tool IDs in registry: kebab-case (`json-formatter`, `curl-studio`)
- File names: kebab-case matching tool ID (`src/routes/curl-studio.js`)

### Error Handling
- Route handlers return `null` for unmatched paths (worker.js tries next handler)
- Use `respondJSON({ error: '...' }, { status: 4xx })` for API errors
- Client-side: show errors in-page via DOM, never `alert()`

### Security
- CSP uses nonce-based script execution — no `unsafe-inline`
- All event handlers use delegation or inline `<script>` blocks (never `onclick=""` attributes)
- Rate limiting: 120 req/min per IP (Durable Object + memory fallback). Disabled in dev.
- Use `crypto.getRandomValues()` / `crypto.subtle` for any crypto operations

### Dark Mode
All UI must support dark mode via `dark:` Tailwind variants. Use `surface-*` and `primary-*` tokens.

### Accessibility
- Semantic HTML: proper heading hierarchy, landmark regions, ARIA labels
- All interactive elements keyboard-accessible
- Target WCAG 2.1 AA: 4.5:1 contrast for text, 3:1 for UI components
- Use `role`, `aria-selected`, `aria-controls`, `tabindex` on custom widgets

## Environment
- **Runtime:** Cloudflare Workers (V8, not Node.js — no `fs`, `path`, `process`)
- **Durable Objects:** `RateLimiter` class (binding: `RATE_LIMITER`, migration tag: `v1`)
- **Static assets:** `dist/` directory served via Workers Assets binding
- **Env vars:** `ADSENSE_CLIENT`, `ADSENSE_SLOTS` (JSON), `ENVIRONMENT`
- **Dev detection:** `isDevEnvironment()` checks for `localhost`/`127.0.0.1`
- **3 routes have custom headers** (not using `createToolHeader`): `saml-decoder.js`, `htpasswd-generator.js`, `yaml-toml-converter.js`.
  They still hand-write their `<h1>`, but it now carries `.tool-header-title` so the shell's
  H1 rule applies — a hand-built header must use that class rather than its own size/weight
  utilities. The same applies to the other hand-written H1s (`repo-ops.js`, `network-reference.js`,
  `pipe.js`), which are composite/bespoke layouts rather than single-tool headers.
