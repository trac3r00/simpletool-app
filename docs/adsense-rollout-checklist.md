# AdSense Rollout Checklist

## Preflight

- Confirm the site is deployable without ads enabled.
- Confirm [`docs/adsense-integration.md`](adsense-integration.md) matches the current implementation.
- Confirm privacy/legal copy mentions third-party ads and cookie-like technologies.
- Confirm game visibility and AdSense enablement are tracked as separate go/no-go decisions.

## Config

- Set `ADSENSE_CLIENT` in production only.
- Set either `ADSENSE_SLOT` or `ADSENSE_SLOTS`.
- Prefer `ADSENSE_SLOTS` when home/tool/legal/sidebar/bottom placements need different IDs.
- Validate `ADSENSE_SLOTS` JSON before deploy.

## Route verification

- `/`
  - ad containers render only when configured
  - no layout collapse when ads are disabled
- Representative tool route
  - explicit or fallback `tool` slot works
  - no duplicate script injection
- Legal/info route
  - `legal` slot behavior is correct
  - content remains readable with and without ads

## UI and performance

- No visible empty ad frames when slots are missing.
- No console errors from AdSense script loading.
- No duplicated `adsbygoogle` initialization.
- No major CLS caused by delayed ad reveal.
- Hidden containers remain hidden when ads never load.

## Ad placement rules

- No ads placed between educational section panels (cheatsheet sections, reference tables, step-by-step guides).
- Ads may appear before or after a complete educational block, never mid-sequence.
- Sidebar ad (`sidebar` slot) only visible at `xl` breakpoint — does not interrupt content flow on mobile/tablet.
- Game pages require separate placement review before enabling any slot.

## Policy and content

- No misleading labels around ads.
- Privacy and terms pages mention third-party advertising behavior.
- Sensitive/security tools are reviewed for ad placement appropriateness.
- Game pages are reviewed separately before ads are enabled on them.

## Release gate

- `bun run build` passes on the release candidate.
- Targeted route verification passes with ads enabled.
- Targeted route verification passes with ads disabled.
- Release note or ops note records:
  - whether games are production-visible
  - whether AdSense is enabled
  - which slot map was deployed
