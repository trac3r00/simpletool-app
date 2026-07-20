# AdSense Integration

This project supports manual AdSense slot injection with server-side config parsing and client-side lazy script loading.

## Current implementation

- Environment parsing lives in [`src/worker.js`](../src/worker.js).
- Ad script and slot rendering live in [`src/utils/common-ui.js`](../src/utils/common-ui.js).
- The HTML injection fallback for pages without an explicit slot lives in [`src/utils/respond.js`](../src/utils/respond.js).

## Configuration variables

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
- Pages built with `createPageTemplate()` include `sidebar` and `bottom` placements when those keys are configured.
- `respondHTML()` appends a `tool` placement only when the page does not already contain an ad slot.
- Legal, FAQ, and blog pages explicitly render `legal` placements and suppress their template-level `tool` placement.

## Runtime behavior

- Ads are disabled automatically in dev/local environments.
- The AdSense script is loaded lazily after DOM readiness with a 2-second delay.
- Invalid client IDs are rejected before script injection.
- Empty or missing slot IDs return no markup.
- Ad containers stay hidden until a script/ad-status signal is observed.

## Verification

Use these checks before enabling production ads:

1. Confirm `ADSENSE_CLIENT` matches `^ca-pub-\d+$`.
2. Confirm each expected slot key resolves to a non-empty string.
3. Load `/`, one representative tool route, and one legal/info page with ads enabled.
4. Load the same pages with ads disabled and confirm layout stays intact.
5. Confirm no duplicate AdSense script tags appear in the final HTML.
6. Confirm pages without configured slot keys render no empty ad shells.

## Slot configuration per page type

| Page type | Slot keys used | Notes |
|-----------|----------------|-------|
| Home (`/`) | `home`, `bottom` | `home` renders in the hero area; `bottom` renders below footer fold |
| Tool pages | `tool`, `sidebar`, `bottom` | `tool` is the fallback for pages without an explicit slot; `sidebar` is shown at the `xl` breakpoint; `bottom` follows the main content. |
| Legal, FAQ, and blog pages | `legal`, `sidebar`, `bottom` | These pages render `legal` explicitly and remove the template-level `tool` slot. |
| Game pages | reviewed separately | See `docs/monetization-content-safety.md` before enabling |

Ad placement rule: **Do not place ads between educational content section panels** (cheatsheet, reference tables, step-by-step guides). Place only before or after the complete educational block.

## Test setup

Localhost and loopback hosts always use development mode, which disables ads. Use the local Worker to verify the disabled-ad layout. To exercise configured slots, use a non-production Cloudflare deployment with a non-local hostname and test AdSense credentials.

1. Set `ADSENSE_CLIENT` to the publisher ID used for testing.
2. Set `ADSENSE_SLOTS` to a JSON object with at least one test slot ID.
3. Verify that only one AdSense loader is present.
4. Confirm configured `data-ad-container` elements become visible only after fill is detected.
5. Remove one slot key and confirm the corresponding page renders no empty ad shell.

To verify the disabled-ad path explicitly, set `ENVIRONMENT=development`, `dev`, or `local`. The Worker clears its ad configuration in those environments, so `getAdSenseScript()` and `getAdSlotHTML()` both return empty strings.

## CLS prevention

Ad containers use `style="display:none"` and are only revealed when an ad is confirmed to be filling the space. This prevents Cumulative Layout Shift because no space is reserved until ad fill is confirmed. The trade-off is that the ad reveal may cause a small reflow; this is acceptable per Google's guidance for lazy-loaded ads.

## Known boundaries

- This project uses manual slot placement, not Auto ads.
- Ads are disabled automatically when `ADSENSE_SLOTS` is an empty object `{}` (current default in `wrangler.toml`).
- Ads are presentation-only; game launch and AdSense enablement must stay separate release decisions.
- Locale-aware ad labels are not fully generalized yet and should be covered in the i18n seam work.
