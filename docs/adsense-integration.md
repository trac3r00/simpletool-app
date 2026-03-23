# AdSense Integration

This project supports manual AdSense slot injection with server-side config parsing and client-side lazy script loading.

## Current implementation

- Env parsing lives in [src/worker.js](/Users/cminseo/Documents/scripts/HTML-Sites/simpletool-app/src/worker.js).
- Ad script/slot rendering lives in [src/utils/common-ui.js](/Users/cminseo/Documents/scripts/HTML-Sites/simpletool-app/src/utils/common-ui.js).
- HTML injection fallback for tool pages lives in [src/utils/respond.js](/Users/cminseo/Documents/scripts/HTML-Sites/simpletool-app/src/utils/respond.js).

## Required env vars

- `ADSENSE_CLIENT`
  - Format: `ca-pub-<digits>`
  - If invalid or missing, AdSense script injection is skipped.
- `ADSENSE_SLOT`
  - Fallback slot ID used for all supported page positions when `ADSENSE_SLOTS` does not override them.
- `ADSENSE_SLOTS`
  - JSON object keyed by slot name.
  - Parsed first; `ADSENSE_SLOT` fills any missing keys.
- `ENVIRONMENT`
  - `development`, `dev`, or `local` disables ads entirely.

## Supported slot keys

Current code uses these slot keys:

- `home`
- `tool`
- `legal`
- `sidebar`
- `bottom`

Example:

```json
{
  "home": "1234567890",
  "tool": "2345678901",
  "legal": "3456789012",
  "sidebar": "4567890123",
  "bottom": "5678901234"
}
```

## Page behavior

- Home page renders explicit `home` and `bottom` slots.
- Tool pages can render explicit slots or receive a fallback `tool` slot injected by `respond.js`.
- Legal/content pages use `legal` and may also inherit tool-slot behavior depending on page composition.
- Sidebar layouts can use `sidebar` where shared page templates include it.

## Runtime behavior

- Ads are disabled automatically in dev/local environments.
- The AdSense script is loaded lazily after DOM readiness with a 2-second delay.
- Invalid client IDs are rejected before script injection.
- Empty or missing slot IDs return no markup.
- Ad containers stay hidden until a script/ad-status signal is observed.

## Verification

Use these checks before enabling production ads:

1. Confirm `ADSENSE_CLIENT` matches `^ca-pub-\\d+$`.
2. Confirm each expected slot key resolves to a non-empty string.
3. Load `/`, one representative tool route, and one legal/info page with ads enabled.
4. Load the same pages with ads disabled and confirm layout stays intact.
5. Confirm no duplicate AdSense script tags appear in the final HTML.
6. Confirm pages without configured slot keys render no empty ad shells.

## Slot configuration per page type

| Page type | Slot keys used | Notes |
|-----------|----------------|-------|
| Home (`/`) | `home`, `bottom` | `home` renders in the hero area; `bottom` renders below footer fold |
| Tool pages | `tool`, `sidebar`, `bottom` | `tool` injected by `respond.js` fallback; `sidebar` shown at `xl` breakpoint only; `bottom` after content |
| Legal/info pages | `legal` | May inherit `tool` slot via `respond.js` depending on page composition |
| Game pages | reviewed separately | See `docs/monetization-content-safety.md` before enabling |

Ad placement rule: **Do not place ads between educational content section panels** (cheatsheet, reference tables, step-by-step guides). Place only before or after the complete educational block.

## Test mode setup

To test AdSense rendering without live traffic:

1. Set `ADSENSE_CLIENT` to your real publisher ID in a non-production environment.
2. Set `ADSENSE_SLOTS` to a JSON object with at least one slot key pointing to a real slot ID.
3. Add `?adtest=on` to the page URL — Google's ad server will serve test ads that do not generate revenue or policy violations.
4. Verify that `window.adsbygoogle` is defined after the 2-second load delay.
5. Confirm `data-ad-container` elements become visible after ad fill is confirmed.
6. Test with the slot deliberately missing (empty string value) to confirm no empty shells render.

To simulate a disabled-ads environment locally, set `ENVIRONMENT=development` in your local `.dev.vars` file — the `getAdSenseScript()` and `getAdSlotHTML()` functions will both return empty strings.

## CLS prevention

Ad containers use `style="display:none"` and are only revealed when an ad is confirmed to be filling the space. This prevents Cumulative Layout Shift because no space is reserved until ad fill is confirmed. The trade-off is that the ad reveal may cause a small reflow; this is acceptable per Google's guidance for lazy-loaded ads.

## Known boundaries

- This project uses manual slot placement, not Auto ads.
- Ads are disabled automatically when `ADSENSE_SLOTS` is an empty object `{}` (current default in `wrangler.toml`).
- Ads are presentation-only; game launch and AdSense enablement must stay separate release decisions.
- Locale-aware ad labels are not fully generalized yet and should be covered in the i18n seam work.
