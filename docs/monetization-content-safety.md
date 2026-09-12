# Monetization Content Safety

> Ad allow/deny lists and slot policy are defined in
> [`adsense-integration.md`](./adsense-integration.md) (mirroring
> `src/utils/ads.js`). This document covers content-safety policy only.

This document is the operator checklist for keeping monetization changes compatible with the product's privacy-first positioning.

## Core rules

- Do not couple ad enablement to feature launch readiness.
- Do not require ads for a page to function.
- Do not insert misleading UI that makes ads look like tool controls.
- Do not weaken privacy/security copy to accommodate monetization.
- Never click live ads or ask others to click them; automated verification must inspect HTML only and must not request ad creatives.
- Treat consent/CMP configuration, Auto ads state, traffic quality, and account notices as operator-owned AdSense settings that repository tests cannot prove.

## Placement guidance

- Keep ad labels explicit and visually distinct.
- Prefer top/bottom or content-adjacent placements that do not interrupt critical workflows.
- Avoid placing ads inside the core interaction area of sensitive tools.
- Review game pages separately because motion-heavy layouts can make ad placement feel deceptive.

## Sensitive surfaces

Use extra caution on:

- security/crypto tools
- token/certificate/secret inspection pages
- privacy/legal pages
- games with highly animated or reward-like UI

For these pages:

- ensure the ad label remains visible
- avoid placing ads next to primary action buttons
- avoid placements that can be mistaken for results, rewards, or verification states

## i18n requirement

If ad labels, sponsorship text, or monetization disclosures are user-visible, they must be treated as part of the translation contract.

Minimum covered copy:

- ad label text
- privacy disclosure text referencing AdSense
- any page-level monetization note

## Operational review

Before each monetization-related release:

1. Verify current slot keys match deployed config.
2. Verify privacy/legal wording still matches actual behavior.
3. Verify pages remain usable when the AdSense script never loads.
4. Verify no route shows an empty sponsored box when ads are disabled.
5. Verify no game or tool result panel looks like ad content.
6. Verify consent messaging/CMP requirements for EEA, UK, and Switzerland in the AdSense account; NPA alone does not waive consent for cookies or local storage where legally required.
7. Verify Auto ads remains disabled and only intended manual Display unit IDs are configured.

## Non-goals

- This document does not replace Google policy review.
- This document does not authorize new placements automatically.
- This document does not change the requirement that core tool processing stays client-side.
