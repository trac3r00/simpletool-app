# Design System — SimpleTool.app

> **Source of truth:** Design tokens are defined in `tailwind.config.js` (colors,
> fonts, animation) and `styles/input.css` (component classes: `.btn`, `.card`,
> `.tool-card`, `.input`, `.label`, etc.). This document describes intent and the
> patterns that the code actually ships — if the two disagree, the code wins and
> this file is the bug. Last reconciled with shipped code: **2026-08-22**.

## Product Context

- **What this is:** Browser-based developer and everyday utilities served from a
  single Cloudflare Worker. **53 tools in production** (56 registered; 3 are
  dev-only games — `ladder-game`, `roulette-wheel`, `marble-roulette` — hidden in
  production via `hiddenInProduction` in `src/utils/tool-registry.js`).
- **Who it's for:** Developers and general users on the open web.
- **Space/industry:** Online tool sites (CyberChef, 10015.io, IT-Tools, DevUtils).
- **Project type:** Web app (tool collection + Pipe Mode workspace).
- **Differentiator:** Tool input and output are processed in the browser. The
  Worker renders and routes pages; page and asset requests still pass through
  Cloudflare, and — when configured in production — non-personalized AdSense and
  Cloudflare Web Analytics make third-party requests. Sensitive tools never load
  ad scripts (see **Ads & Privacy** below). This is deliberately *not* an
  absolute "nothing ever leaves the browser" claim.

## Aesthetic Direction

- **Direction:** Industrial/Utilitarian
- **Decoration level:** Minimal (typography and spacing do the work)
- **Mood:** Trustworthy, precise, functional. Feels like a tool built by people who
  build tools — not a template, not a SaaS marketing page. The design gets out of
  the way so the tools can work.
- **Reference sites:** 10015.io (card grid), IT-Tools (sidebar + cards),
  CyberChef (recipe chaining UX).

## Typography

- **Family:** Geist (sans) + Geist Mono (mono), loaded from Google Fonts.
- **Loading:** A single `<link rel="stylesheet">` with `preconnect` hints in
  `getStylesheetLinks()` (`src/utils/common-ui.js`). The font URL is
  `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap`.
  (Do not re-add an `@import` of this URL to `styles/input.css` — that caused a
  duplicate request on every page; removed 2026-08-22.)
- **Icon font:** Material Symbols Rounded, **self-hosted** at
  `/fonts/material-symbols.woff2` (`@font-face` in `common-ui.js`). Used by
  `.info-hint`. Keep it self-hosted — a CDN load previously 404'd.
- **Roles:**
  - Display/Hero: Geist 700
  - Body / UI: Geist 400/500/600
  - Data / Code: Geist Mono 400/500
- **Type scale:** Standard Tailwind scale (`text-xs` 12 → `text-5xl` 48). There is
  **no** custom `fontSize` config, so use Tailwind's class names directly. The
  hero uses `text-4xl sm:text-5xl` (`src/ui/home.js`).

## Color

Defined in `tailwind.config.js` under `theme.extend.colors`. Use the token names
below; **never** raw `indigo-*` / `emerald-*` (they read as AI-generated slop).

- **`primary-*`** — blue, brand accent (CTAs, links, active states). `primary-600`
  = `#2563eb`, `primary-700` = `#1d4ed8` (hover), `primary-100` = `#dbeafe`.
- **`surface-*`** — Zinc neutral scale, 50 (`#fafafa`) → 950 (`#09090b`).
- **`success-*` / `warning-*` / `error-*`** — semantic. Standard Tailwind
  green/amber/red scales.
- **`info-*`** — a byte-for-byte duplicate of the `primary-*` blue scale, but **in
  active use** (~28 usages across 15+ route files, e.g. `cidr-calculator`,
  `encoding-workbench`, `oauth-debugger`, `cron-builder`). It is a live token, not a
  removal candidate. Prefer `primary-*` for new work to keep one accent name.
- **Pipe Mode accent (teal):** Uses **stock Tailwind `teal-*`** classes
  (`teal-600` = `#0d9488`, etc.), not a project-defined token. Teal signals Pipe
  Mode territory (`src/routes/pipe.js`).
- **Dark mode:** `darkMode: "class"`. Theming is done entirely with Tailwind
  `dark:` variants (e.g. `dark:bg-surface-950`), not CSS custom properties.

## Spacing & Layout

- **Base unit / density:** 4px, comfortable. Use Tailwind's default spacing scale
  (`p-4`, `gap-4`, `space-y-16`, …).
- **Grid:** Responsive card grid on the home page; content max width `max-w-7xl`
  (1280px).
- **Border radius (`--radius-*` reference; realized via Tailwind `rounded-*`):**
  `sm` 4px · `md` 8px · `lg` 12px · `xl` 16px · `full` 9999px.
  - Buttons: `rounded-md` (8px) — every `.btn` variant.
  - Generic content cards (`.card`, used on legal / FAQ / blog pages):
    `rounded-lg` (12px).
  - Home tool cards (`.tool-card`): `rounded-xl` (16px) `shadow-sm`.
  - Contributor rule (mirrored in `AGENTS.md`): card rounding is
    `rounded-xl shadow-sm` — never `rounded-2xl shadow-lg`.
- **Breakpoints:** Tailwind defaults (`sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280).

## Motion

- **Approach:** Minimal-functional. Use Tailwind utilities directly
  (`transition-colors duration-200`, `animate-fade-in`, `animate-fade-in-up`,
  `animate-spin`).
- **Durations in use:** ~200ms for color/theme transitions, ~300ms for
  fades/accordions/spinners. Pipe Mode step changes get the longer end for
  visual continuity.

## Component Patterns

Component classes live in `styles/input.css` (`@layer components` + plain rules).

### Buttons
- Base: `.btn` (`rounded-md`, `text-sm`, `font-medium`, focus ring).
- Variants: `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`,
  `.btn-teal` (Pipe Mode). Sizes: `.btn-sm`, `.btn-xs`.

### Cards
- `.card` — generic surface card, `rounded-lg shadow-sm` (legal/FAQ/blog).
- `.tool-card` — home-page tool card, `rounded-xl shadow-sm`, hover
  `border-primary-400`. Contains emoji icon, title, description; Pipe Mode tools
  get a teal "Works with Pipe Mode" affordance.

### Forms
- `.input` / `.input-mono` — full-width, `rounded-md`, focus ring `primary-500`.
- `.label` — uppercase, tracked, `text-xs font-semibold`.

### Feedback & chrome
- **Toasts** — bottom-right notifications are built **inline in JS**
  (`src/utils/common-ui.js`, `#toast-container` + a `showToast`-style helper that
  composes `bg-*`/`animate-*` classes on the fly). There are no `.toast*` component
  classes in CSS (the old unused ones were removed 2026-08-22).
- `.spinner` (+ `-sm` / `-lg`), `.empty-state` (+ `-icon` / `-title` / `-desc`).
- `[data-tooltip]` — pure-CSS tooltip with `-pos="bottom"` / `"right"` variants.
- `.info-hint` — small Material Symbols help icon that triggers a tooltip.
- `.cheatsheet` — collapsible reference panel used inside tools.
- `.glass` — translucent, blurred nav/header bar.
- `.mobile-tab-bar` / `.mobile-tab-btn` / `.mobile-tab-active` — two-pane mobile
  switcher.
- `.rich-editor*` — textarea + highlighted `<pre>` overlay with `.re-*` token
  colors (JSON, JWT, keywords).

## Ads & Privacy

The design must never imply absolute privacy. Current honest stance (enforced by
`src/ui/honest-copy.test.js`):

- Non-personalized AdSense only; Auto ads off; `ads.txt` only after real slot IDs.
- **Allow-list** (ads may appear): `home`, `json`, `legal`.
- **Deny-list** (never load ad scripts): password, SSH keys, Token Studio,
  WireGuard, certificates, secret scanner, encoding tools, and Pipe Mode.
- Copy may not claim "no tracking" / "never track" / "0 bytes stored."
- See `docs/adsense-integration.md` for the authoritative ad rules.

## Catalog Freeze

New tool pages are frozen until the eight flagships (JSON, Token studio / JWT,
Regex, Cron, Password, SSH/certs, Curl, CIDR) beat the bookmarks people already
use. Existing routes stay live; the freeze is about new catalog entries, not
deletions. (Also stated in `AGENTS.md`.)

## Decisions Log

| Date       | Decision                                            | Rationale                                                                                                          |
| ---------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 2026-03-27 | Initial design system created                       | Via /design-consultation; office-hours product context + competitive research (10015.io, IT-Tools, CyberChef).   |
| 2026-03-27 | Geist over system fonts                             | An intentional typeface creates identity; ~50KB is worth every page feeling designed.                             |
| 2026-03-27 | Blue primary over indigo                            | Indigo (#6366f1) is the default AI-generated accent; blue (#2563eb) reads trustworthy and avoids the slop signal. |
| 2026-03-27 | Teal accent for Pipe Mode                           | A second color gives Pipe Mode its own territory: teal = pipes, blue = tools.                                     |
| 2026-03-27 | Minimal decoration                                  | Tool sites are utilities; every decoration pixel competes with the tool. Typography and spacing do the work.      |
| 2026-08-22 | Doc reconciled with shipped code                    | Tool count 49→53 (56 incl. dev games); languages 4→10; tool cards documented as `rounded-xl`; buttons `rounded-md`; teal via stock Tailwind; tailwind.config.js named as token source of truth. |
| 2026-08-22 | Privacy positioning made honest                     | Removed absolute "data never leaves the browser" framing to match the honesty-pass copy and the ad allow/deny model. |
| 2026-08-22 | Removed dead CSS custom properties from input.css   | The `:root`/`.dark` `--font-*`/`--primary-*`/`--accent-*`/`--space-*`/`--shadow-*`/`--ease-*`/`--dur-*`/tint vars had zero consumers (theming is Tailwind `dark:`); only `--scroll-*` remain. |
| 2026-08-22 | Added missing `.btn-teal`                           | `pipe.js` used `btn btn-teal` but the class was undefined, so the Pipe Mode "Copy" button rendered unstyled.      |
