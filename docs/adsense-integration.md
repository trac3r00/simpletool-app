# AdSense Integration

Manual Display units only. Non-personalized ads. Never Auto ads.

Ads stay off until `ADSENSE_SLOTS` contains real slot IDs. `ads.txt` is served
only after that. A publisher ID with empty slots is not enough.

## Current implementation

- Policy and rendering live in [`src/utils/ads.js`](../src/utils/ads.js).
- Worker wiring lives in [`src/worker.js`](../src/worker.js).
- CSP adds Google Ads hosts only while ads are enabled.
- GTM and GA stay out of CSP.

## Configuration

- `ADSENSE_CLIENT` = `ca-pub-5134881365131182`
- `ADSENSE_SLOTS` JSON keys:
  - `home` — homepage, below the tool grid
  - `json` — JSON Formatter, below the editor
  - `legal` — changelog / about / privacy / terms / contact / security / careers
- `ADSENSE_SLOT` can fill those three keys if a unit is reused.
- `tool`, `sidebar`, and `bottom` are ignored.
- Dev / local environments disable ads.

Example:

```json
{
  "home": "1111111111",
  "json": "2222222222",
  "legal": "3333333333"
}
```

## Hard rules

- Non-personalized only (`requestNonPersonalizedAds = 1`, `data-npa-on="1"`).
- Script loads after first paint, and only if a reserved slot exists on the page.
- Visible `Advertisement` label and reserved height (`min-height: 280px`).
- Deny list never loads the script: password, SSH, Token Studio, WireGuard, certs, secret scanner, encoding workbench, pipe.
- Other tool pages also stay off unless they are on the allow list.

## Verification

1. Empty `ADSENSE_SLOTS` → no `ads.txt`, no `ca-pub` script, no `<ins>`.
2. Configured slots → `/ads.txt` ends with a newline and `/` plus `/json-formatter` plus `/about` render one reserved slot each.
3. `/password-generator` still has no ads script.
4. CSP includes `pagead2.googlesyndication.com` only while ads are enabled, and never GTM/GA.
