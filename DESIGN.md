# Design System — SimpleTool.app

## Product Context
- **What this is:** Privacy-first browser tools. 49 utilities running on Cloudflare Workers, all client-side.
- **Who it's for:** Anyone on the internet, developers and general users alike.
- **Space/industry:** Online tool sites (CyberChef, 10015.io, IT-Tools, DevUtils).
- **Project type:** Web app (tool collection + Pipe Mode workspace).
- **Differentiator:** Data never leaves the browser. Privacy as architecture, not marketing.

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian
- **Decoration level:** Minimal (typography and spacing do all the work)
- **Mood:** Trustworthy, precise, functional. Feels like a tool built by people who build tools. Not a template, not a SaaS marketing page. The design gets out of the way so the tools can work.
- **Reference sites:** 10015.io (card grid pattern), IT-Tools (sidebar + cards), CyberChef (recipe chaining UX)

## Typography
- **Display/Hero:** Geist 700 — geometric, clean, modern. Designed by Vercel. Sharp at large sizes. Not overused.
- **Body:** Geist 400/500 — same family for cohesion. Excellent readability at 14-16px.
- **UI/Labels:** Geist 500/600 — medium weight for interface elements, badges, section headers.
- **Data/Tables:** Geist Mono 400 — true monospace companion. tabular-nums support for aligned numbers.
- **Code:** Geist Mono 400 — replaces JetBrains Mono for better pairing with Geist.
- **Loading:** Google Fonts CDN: `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap`
- **Scale:**
  - xs: 12px (labels, timestamps)
  - sm: 13px (secondary text, descriptions)
  - base: 14px (body, UI default)
  - md: 16px (body emphasis, tool descriptions)
  - lg: 20px (section headings)
  - xl: 24px (page headings)
  - 2xl: 32px (hero subheadings)
  - 3xl: 48px (hero display)

## Color
- **Approach:** Restrained (1 primary + 1 accent + neutrals)
- **Primary:** #2563eb (blue-600) — trust, reliability, privacy. Used for CTAs, links, active states.
- **Primary Dark:** #1d4ed8 — hover states.
- **Primary Light:** #dbeafe — backgrounds, subtle highlights.
- **Accent (Pipe Mode):** #0d9488 (teal-600) — flow, connection. Used exclusively for Pipe Mode features.
- **Accent Dark:** #0f766e — hover states for pipe elements.
- **Accent Light:** #ccfbf1 — pipe step highlights, palette hover.
- **Neutrals:** Zinc scale (warm-cool gray)
  - 50: #fafafa (page background, light)
  - 100: #f4f4f5 (surface alt, code blocks)
  - 200: #e4e4e7 (borders)
  - 300: #d4d4d8 (disabled borders)
  - 400: #a1a1aa (subtle text)
  - 500: #71717a (muted text)
  - 600: #52525b (secondary text, dark mode)
  - 700: #3f3f46 (dark mode borders)
  - 800: #27272a (dark mode surface alt)
  - 900: #18181b (dark mode surface, light mode text)
  - 950: #09090b (dark mode background)
- **Semantic:**
  - Success: #16a34a / light: #dcfce7
  - Warning: #ca8a04 / light: #fef9c3
  - Error: #dc2626 / light: #fee2e2
  - Info: #2563eb / light: #dbeafe
- **Dark mode strategy:** Invert surfaces (950 bg, 900 surface), reduce primary saturation slightly (#3b82f6), keep accent vivid (#14b8a6).

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable
- **Scale:**
  - 2xs: 2px
  - xs: 4px
  - sm: 8px
  - md: 16px
  - lg: 24px
  - xl: 32px
  - 2xl: 48px
  - 3xl: 64px

## Layout
- **Approach:** Grid-disciplined
- **Grid:** 12 columns on desktop, 6 on tablet, 4 on mobile
- **Max content width:** 1200px (7xl)
- **Border radius:**
  - sm: 4px (buttons, inputs, badges)
  - md: 8px (small cards, dropdowns)
  - lg: 12px (large cards, modals, tool containers)
  - full: 9999px (pills, avatars)
- **Breakpoints:** sm: 640px, md: 768px, lg: 1024px, xl: 1280px

## Motion
- **Approach:** Minimal-functional
- **Easing:** enter: ease-out, exit: ease-in, move: ease-in-out
- **Duration:**
  - micro: 100ms (button state changes, toggles)
  - short: 200ms (fade-in, color transitions, theme switch)
  - medium: 300ms (slide-up, accordion, pipe step add/remove)
  - long: 500ms (page transitions, reserved for Pipe Mode reorder)
- **Pipe Mode exception:** Step add/remove/reorder gets medium (300ms) transitions for visual continuity.

## Component Patterns

### Tool Cards (homepage)
- `bg-surface / border border-surface-200 / rounded-lg / p-5`
- Hover: `border-primary`
- Contains: emoji icon, title (Geist 600 15px), description (Geist 400 13px muted)
- "Works with Pipe Mode" badge: teal pill for contracted tools

### Pipe Step Cards
- Normal: `border border-surface-200 rounded-md`
- Active: `border-primary-300 bg-primary-50/50`
- Error: `border-red-300 bg-red-50`
- Disabled: `opacity-50`
- Header: surface-alt background, step name + drag handle + "Open full tool" link
- Output: mono font, below header

### Buttons
- Primary: `bg-primary text-white rounded-sm px-5 py-2`
- Secondary: `bg-surface border border-surface-200 text-text rounded-sm`
- Ghost: `bg-transparent text-muted hover:bg-surface-alt rounded-sm`
- Teal (Pipe Mode): `bg-teal text-white rounded-sm`

### Alerts
- Rounded-sm, semantic background-light + semantic text color
- Icon + message, 13px font weight 500

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-27 | Initial design system created | Created by /design-consultation based on office-hours product context + competitive research of 10015.io, IT-Tools, CyberChef |
| 2026-03-27 | Geist over system fonts | Intentional typeface creates identity. ~50KB extra load is worth it for every page feeling designed, not generated. |
| 2026-03-27 | Blue primary over indigo | Indigo (#6366f1) is the most common AI-generated accent. Blue (#2563eb) reads as trustworthy and avoids the AI slop signal. |
| 2026-03-27 | Teal accent for Pipe Mode | Second color creates visual territory. Users learn teal = pipes, blue = tools. Makes Pipe Mode feel special. |
| 2026-03-27 | Minimal decoration | Tool sites are utilities. Every decoration pixel competes with the tool itself. Typography and spacing do the work. |
