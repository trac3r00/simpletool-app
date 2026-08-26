# Design System — SimpleTool.app

> **Source of truth:** Design tokens are defined in `tailwind.config.js` (colors,
> fonts, animation) and `styles/input.css` (component classes: `.btn`, `.card`,
> `.tool-card`, `.input`, `.label`, etc.). This document describes intent and the
> patterns that the code actually ships — if the two disagree, the code wins and
> this file is the bug. Last reconciled with shipped code: **2026-08-22**.

## Product Context

- **What this is:** Browser-based developer and everyday utilities served from a
  single Cloudflare Worker. **47 tools in production** (50 registered; 3 are
  dev-only games — `ladder-game`, `roulette-wheel`, `marble-roulette` — hidden in
  production via `hiddenInProduction` in `src/utils/tool-registry.js`). `changelog`
  was retired as a catalog tool 2026-08-22 (the `/changelog` page stays live).
- **Who it's for:** Developers and general users on the open web.
- **Space/industry:** Online tool sites (CyberChef, 10015.io, IT-Tools, DevUtils).
- **Project type:** Web app (tool collection + Pipe Mode workspace).
- **Differentiator:** Tool input and output are processed in the browser. The
  Worker renders and routes pages; page and asset requests still pass through
  Cloudflare, and — when configured in production — non-personalized AdSense and
  Cloudflare Web Analytics make third-party requests. Sensitive tools never load
  ad scripts (see **Ads & Privacy** below). This is deliberately _not_ an
  absolute "nothing ever leaves the browser" claim.

## Aesthetic Direction

- **Direction:** **Modern Utility** (adopted 2026-08-22, replacing the earlier
  "Industrial/Utilitarian" look). Polished and friendly, but deliberately escapes
  default-blue SaaS slop via a **violet** brand anchor and a **cyan** accent, with
  soft depth on interaction.
- **Decoration level:** Minimal-plus — typography and spacing still do most of the
  work, but a single signature (violet→cyan gradient + smooth hover depth on the
  tool grid) gives the site something to be remembered by.
- **Mood:** Trustworthy, precise, functional, quietly distinctive. Feels like a
  well-made tool, not a template and not a marketing page. The design stays out of
  the way so the tools can work.
- **Signature:** The tool grid — violet→cyan gradient accents plus cards that lift
  (`shadow-sm`→`shadow-md`, 2px rise, violet border tint) on hover.
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
The Modern Utility palette (2026-08-22) is **6 named hues**: `primary` (violet),
`info` (cyan accent), `surface` (slate neutrals), and semantic
`success`/`warning`/`error`.

- **`primary-*`** — **violet**, brand accent (CTAs, links, active states, focus
  rings, `::selection`). Action = `primary-600` `#7c3aed`, hover = `primary-700`
  `#6d28d9` (the identity anchor), tint = `primary-100` `#ede9fe`. Chosen over
  blue/indigo to be distinct without reading as slop.
- **`info-*`** — **cyan accent**, `info-600` `#0891b2`. Formerly a byte-for-byte
  duplicate of the old blue primary; now a genuinely distinct accent used for the
  brand gradient, informational states, and (progressively) the Pipe-Mode signal.
  Still ~28 live usages across 15+ route files (`cidr-calculator`,
  `encoding-workbench`, `oauth-debugger`, `cron-builder`, …).
- **`surface-*`** — **slate** neutral scale, 50 (`#f8fafc`) → 950 (`#0f0f12`).
  Mid-tones are stock slate; `900` (`#12141c`, card elevation on dark) and `950`
  (`#0f0f12`, page background on dark) are tuned to neutral charcoal so dark mode
  reads near-black rather than slate-blue.
- **`success-*` / `warning-*` / `error-*`** — semantic. Standard Tailwind
  green/amber/red scales.
- **Pipe Mode accent (cyan):** Pipe Mode uses the identity's **`info` cyan** as
  its territory signal (`.btn-info`, `info-*` tints on the final-output box,
  recipe "Try it →", shared-pipeline banner). The legacy stock-teal accent was
  swapped out when `pipe.js` was re-skinned on 2026-08-26; `teal-*` classes no
  longer appear outside content-categorical maps.
- **Brand gradient:** violet→cyan, via the `.text-gradient-brand` /
  `.bg-brand-gradient` / `.bg-brand-gradient-soft` utilities in
  `styles/input.css`. This is the signature accent — use sparingly (hero, section
  headers, tool-grid affordance), not as page-wide chrome.
- **Dark mode:** `darkMode: "class"`. Both light and dark are authored deliberately
  (neither is merely derived). Mobile browser chrome (`<meta name="theme-color">`)
  is scheme-aware: `#f8fafc` light / `#0f0f12` dark.

### Token architecture (shadcn-style, 2026-08-22)

The design language is **shadcn/ui's** — its token model and its "new-york"
component set — ported onto this app's **vanilla Tailwind + Cloudflare Worker**
stack. **No React, no Radix, no client runtime is shipped** (shadcn's own premise
is "you own the code"). The Modern Utility palette lives _inside_ shadcn's
vocabulary:

- **Semantic tokens** are HSL triplets on `:root` / `.dark` in `styles/input.css`
  (`--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`,
  `--accent`, `--info`, `--border`, `--input`, `--ring`, `--radius`, + semantic
  `--success`/`--warning`/`--destructive`). `tailwind.config.js` maps each to a
  utility, so `bg-primary`, `text-muted-foreground`, `border-border`,
  `ring-ring`, `bg-info/10` all resolve per theme.
- **Naming caveat:** shadcn's `--accent` is the **neutral hover/highlight surface**
  (slate-100/800), _not_ a brand color. Our cyan brand accent is **`--info`**
  (violet stays `--primary`). Don't conflate them.
- **`--radius`** (0.5rem) drives `rounded-lg`/`md`/`sm` (8 / 6 / 4px). Tool cards
  keep the explicit `rounded-xl` (12px).
- **Coexistence:** the numeric hue **scales** (`primary-*`, `surface-*`, `info-*`)
  remain in `tailwind.config.js` so the not-yet-migrated routes keep working;
  components migrate onto the semantic tokens during the Track A waves.

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
  `.btn-info` (Pipe Mode cyan; `info-700` fill in light because white on
  `info-600` is 3.7:1, light-cyan fill with dark text in dark). Sizes:
  `.btn-sm`, `.btn-xs`.

### Tool page shell

- `.tool-page-shell` — the shared route canvas (`max-w-7xl`) with responsive
  horizontal gutters and a consistent 32→48px vertical rhythm.
- `.tool-page-panel` — the primary `bg-card` / `border-border` tool surface,
  `rounded-xl shadow-sm`, with a restrained 2px violet→cyan top rule. A migrated
  route should use exactly one primary panel; nested functional groups remain
  lighter-weight instead of becoming cards inside cards.
## Component contract — when a class is required

The identity is only universal if it is unavoidable. The rule contributors
follow:

> **Anything a user can interact with, and any surface that carries the page's
> identity, must come from a component class. Raw utilities are for LAYOUT.**

| Element | Required class | Raw utilities still allowed for |
|---|---|---|
| `<button>`, `[role="button"]` | `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-danger` / `.btn-info` | `w-`, `flex-`, `justify-`, margins, responsive visibility |
| List-item button (tool palette, menu) | `.menu-item` | width, margins |
| Icon-only button | that variant **+ `.btn-icon`** (36px) or `.btn-icon-sm` (32px) | position, `md:hidden` |
| Floating action button | `.btn-fab` | `fixed`, `bottom-`, `left-`, `z-` |
| `<input>`, `<textarea>`, `<select>` | `.input` or `.input-mono` | width, `pl-`/`pr-` for adornments, `resize-` |
| Nav search trigger | `.input-search` | width |
| Severity filter toggle | `.filter-chip` + its semantic tint | — |
| Page surface | `.tool-page-panel` | — |
| Nested group | `.tool-group` (`--flush` / `--inset`) | padding, flex chains |

**Colour is never a raw utility on an interactive element** — it comes from the
variant. The one exception is a tint that *is* the information rather than
decoration: `.filter-chip` carries `bg-error-100`/`bg-warning-100` because the
severity is content. If the colour would be the same for every instance, it
belongs in the component.

**Do not hand-roll to "avoid a load-order dependency."** `getThemeToggleButton`
carried that comment for a hand-built copy of `.btn-ghost`; there is no such
dependency, because component classes ship in the same compiled stylesheet as
the utilities that would replace them. The hand-rolled copy had drifted: it used
`focus:ring` (which fires on mouse click) where `.btn` uses `focus-visible:ring`
(keyboard only).

Enforced by `npm run test:ui-audit`, which reports `handrolled-button` /
`handrolled-input` for any interactive element built from a utility stack.

- **`.tool-group`** is that lighter-weight group: `rounded-lg border border-border
  p-4`, with **no fill and no shadow**. It deliberately adds no second surface.
  `--card` is `#fff` (light) and `#12141c` (dark), so the pre-rebuild
  `bg-white dark:bg-surface-900` group painted the *same colour as the panel it
  sat in* — a card inside an identical card, separated only by a hairline and a
  `shadow-sm` that cannot read on a same-colour ground.
  Filling it with `bg-muted` would break the palette the other way: `.input` is
  `bg-background` (98% light / 6% dark), so an input would sit **above** a muted
  group in light but **below** it in dark — elevation inverting between themes.
  Leaving the fill inherited preserves the one rule the palette encodes:
  **card = raised, background = recessed well.** A group is a delineation, not
  an elevation.
  - `.tool-group--flush` (`p-0`) for containers whose children own the padding
    (editor panes, log tables) — pair with `overflow-hidden`.
  - `.tool-group--inset` (`bg-muted/60`, transparent border) for read-only
    output regions. Safe to fill because they hold rendered output, not inputs,
    so the inversion above cannot arise.
  - Radius steps **down** when nesting: panel `rounded-xl` → group `rounded-lg`.
  - Floating surfaces (dropdowns, modals, sheets) use `bg-popover` — they *do*
    own a fill, because they leave the panel's plane entirely.
- `createToolHeader()` emits stable `.tool-header*` hooks. Inside
  `.tool-page-shell`, those hooks opt into a larger 30→36px H1, semantic text
  tokens, a gradient-wash icon tile, a cyan trust badge, and responsive stacking.
  Outside the shell, the legacy utility presentation remains intact during the
  incremental migration.
- `.content-page-shell` / `.content-page-panel` — the prose counterpart, used by
  legal, FAQ, blog (index + article), and changelog. Same vertical rhythm as the
  tool shell but a `max-w-4xl` reading measure, since prose wants a shorter line
  than a tool workspace. Adopted 2026-08-22; `changelog` moved off its one-off
  `max-w-3xl` at the same time. The home page keeps its own hero/grid composition.

  Because `.tool-page-shell .tool-header-title` is a two-class selector, it outranks the
  single-class size utilities `createToolHeader` still emits inline — so every tool page
  renders the canonical H1 regardless of those utilities. A route that hand-writes its own
  `<h1>` therefore only needs the `.tool-header-title` class; adding size/weight/color
  utilities alongside it is what caused the pre-rebuild H1 drift.

- **Migration status:** merged routes (`network-reference`, `repo-ops`) established
  the shell. The first independent-tool wave (`unit-converter`,
  `bandwidth-calculator`, `uuid-generator`, `caffeinate`) adopted it on 2026-08-22.
  Route-specific controls, scripts, IDs, and educational content remain unchanged;
  later waves should repeat that wrapper-only migration before deeper component
  refactors.

### Cards

- `.card` — generic surface card, `rounded-lg shadow-sm`, now used for content
  _inside_ prose pages (article cards, related-tool tiles); the page-level surface
  on those routes is `.content-page-panel` (`rounded-xl`), matching `.tool-page-panel`.
- `.tool-card` — `rounded-xl shadow-sm` surface panel, **dual-use**: (1) static
  content panels inside tool routes (cidr, dns, port, protocol-headers, wireguard,
  wireshark) use the `p-6` default and stay static; (2) home-grid cards
  add `p-4` for density. The base class carries **no** hover/transform so static
  panels don't animate.
- `.tool-card-link` — modifier added to the home grid's clickable cards for the
  **signature hover**: `shadow-sm`→`shadow-md`, a 2px rise (`-translate-y-0.5`),
  and a violet border tint, on a 200ms `transition-all`. The icon tile also tints
  violet and scales on hover. Cards contain emoji icon, title, description; Pipe
  Mode tools get a "Works with Pipe Mode" affordance.
- **Hero wash** — `.hexagon-pattern` (home hero) is a low-opacity violet→cyan
  radial glow, the identity's hero signature. Kept subtle so it never competes with
  the H1/search contrast.

### Forms

- `.input` / `.input-mono` — full-width, `rounded-md`, `border-input`, focus-visible
  ring `--ring` (violet).
- `.label` — uppercase, tracked, `text-xs font-semibold`, `text-muted-foreground`.

### Tabs & badges (shadcn new-york)

- `.tabs-list` + `.tab-trigger` — segmented tab bar on a `bg-muted` track; the
  active trigger (`[aria-selected="true"]` or `.active`) lifts to `bg-background`
  - `shadow-sm`. Keyboard-accessible (`role="tablist"` / `aria-selected`), focus
    ring via `--ring`. Used by the merged tabbed tools (`repo-ops`,
    `network-reference`) and adoptable site-wide.
- `.badge` + `.badge-default` / `.badge-secondary` / `.badge-info` /
  `.badge-outline` — pill labels. `badge-info` is the cyan (`--info`) tinted
  variant for "Client-Side Only" / informational tags.
- These live in `@layer components`; Tailwind's JIT only emits them once a route
  references them, so they appear in `dist/styles.css` after first use.

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

| Date       | Decision                                          | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-27 | Initial design system created                     | Via /design-consultation; office-hours product context + competitive research (10015.io, IT-Tools, CyberChef).                                                                                                                                                                                                                                                                                                                              |
| 2026-03-27 | Geist over system fonts                           | An intentional typeface creates identity; ~50KB is worth every page feeling designed.                                                                                                                                                                                                                                                                                                                                                       |
| 2026-03-27 | Blue primary over indigo                          | Indigo (#6366f1) is the default AI-generated accent; blue (#2563eb) reads trustworthy and avoids the slop signal.                                                                                                                                                                                                                                                                                                                           |
| 2026-03-27 | Teal accent for Pipe Mode                         | A second color gives Pipe Mode its own territory: teal = pipes, blue = tools.                                                                                                                                                                                                                                                                                                                                                               |
| 2026-03-27 | Minimal decoration                                | Tool sites are utilities; every decoration pixel competes with the tool. Typography and spacing do the work.                                                                                                                                                                                                                                                                                                                                |
| 2026-08-22 | Doc reconciled with shipped code                  | Tool count 49→53 (56 incl. dev games); languages 4→10; tool cards documented as `rounded-xl`; buttons `rounded-md`; teal via stock Tailwind; tailwind.config.js named as token source of truth.                                                                                                                                                                                                                                             |
| 2026-08-22 | Privacy positioning made honest                   | Removed absolute "data never leaves the browser" framing to match the honesty-pass copy and the ad allow/deny model.                                                                                                                                                                                                                                                                                                                        |
| 2026-08-22 | Removed dead CSS custom properties from input.css | The `:root`/`.dark` `--font-*`/`--primary-*`/`--accent-*`/`--space-*`/`--shadow-*`/`--ease-*`/`--dur-*`/tint vars had zero consumers (theming is Tailwind `dark:`); only `--scroll-*` remain.                                                                                                                                                                                                                                               |
| 2026-08-22 | Added missing `.btn-teal`                         | `pipe.js` used `btn btn-teal` but the class was undefined, so the Pipe Mode "Copy" button rendered unstyled.                                                                                                                                                                                                                                                                                                                                |
| 2026-08-22 | **New identity: Modern Utility** (violet + cyan)  | Full frontend rebuild (Track A). Primary blue→**violet** (`#7c3aed`/`#6d28d9`) to escape default-blue slop while staying trusted; `info` blue-dup→distinct **cyan** accent (`#0891b2`); `surface` zinc→**slate** with neutral-charcoal darks (`#0f0f12`). Chosen by the user over Precision-Instrument / Warm-Editorial / Brutalist-Mono directions.                                                                                        |
| 2026-08-22 | Signature = tool-grid gradient + hover depth      | The one memorable element: violet→cyan brand gradient (`.text-gradient-brand`/`.bg-brand-gradient`) plus tool cards that lift on hover. Applied via shared tokens/classes so all ~50 pages re-skin without per-route color edits.                                                                                                                                                                                                           |
| 2026-08-22 | Both light + dark authored deliberately           | User chose "both" as the default; neither mode is a mechanical derivation. `theme-color` meta is scheme-aware.                                                                                                                                                                                                                                                                                                                              |
| 2026-08-22 | **Adopt shadcn design language (no React)**       | User asked for shadcn; it is React/Radix-only, and this app is vanilla JS on CF Workers. Ported shadcn's _token model_ (semantic HSL CSS vars → Tailwind utilities) + new-york component set (btn/card/input/tabs/badge) onto the existing stack instead of re-platforming. Violet→`--primary`, cyan→`--info`, slate→neutrals; `--accent` reserved as shadcn's neutral hover surface. Numeric scales kept alongside for small tinted elements (chips, badges, stat tiles) whose correct target is `bg-muted`, not `bg-card`. |
| 2026-08-26 | **Pipe Mode re-skinned onto the identity** | The last teal holdout: header rebuilt on `createToolHeader` (gradient icon tile + cyan Beta pill), `.btn-teal`→`.btn-info` (cyan, AA-safe fills both themes), final-output/banner/links teal→`info-*`, palette items on new `.menu-item`, step-card chrome on semantic `border-border`/`bg-muted`, recipe cards on `.tool-card-link` signature hover, icon buttons on `.btn-icon-sm`. Behavior, IDs, and the client contract registry untouched. Follow-up same day: `.tool-page-shell--wide` (full-bleed, pipe-only) and cron-builder's `min-h-screen` removed — every tool route now shares the identical `max-w-7xl` shell + panel. |
| 2026-08-26 | **AA contrast pass on shared tokens** | Browser audit (`test:ui-audit`) measured: trust pill / `.badge-info` cyan-on-tint 3.39:1 → text `info-700`/`info-300`; `--muted-foreground` 47%→44% (was 4.49:1 on `--background`, 4.30:1 on `--muted`); dark `--primary` 66%→64% (white button text was 4.29:1); ~90 `text-primary-600` route usages gained missing `dark:text-primary-400`. Also: `tool-group` never carries `shadow-*`; button decoration beyond the variant removed (mock-data CTA); `accent-primary-600` is the checkbox accent everywhere; bandwidth unit toggle moved onto `.tabs-list`/`.tab-trigger`. |
| 2026-08-24 | **Nested groups are delineation, not elevation** | `--card` is #fff/#12141c — the same colour as `.tool-page-panel` — so the pre-rebuild nested card was a card inside an identical card. `bg-muted` would invert elevation between themes against `.input` (`bg-background`). `.tool-group` therefore adds border+radius+padding and **no fill**; `--flush` for child-padded containers, `--inset` for output-only regions, `bg-popover` for surfaces that leave the panel's plane. 104 group edits + 27 form controls to `.input`; guarded by `src/ui/card-contract.test.js`. |
