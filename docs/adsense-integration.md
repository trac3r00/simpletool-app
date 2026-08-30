# AdSense Integration

> **Authoritative ad-policy doc.** The allow/deny lists below mirror the code —
> the real source of truth is `ALLOW_SLOT_KEYS`, `DENY_AD_PATHS`, and
> `LEGAL_AD_PATHS` in [`src/utils/ads.js`](../src/utils/ads.js), enforced by
> `src/ui/honest-copy.test.js`. Other docs must point here rather than restate
> the lists.

Manual Display units only. Non-personalized ads. Never Auto ads.

A publisher ID (`ADSENSE_CLIENT`) is enough for site connection: `/ads.txt`
and the `google-adsense-account` meta ship without loading ad scripts. Ad
units, `adsbygoogle.js`, and the Google Ads CSP hosts stay off until
`ADSENSE_SLOTS` contains real slot IDs.

## Current implementation

- Policy and rendering live in [`src/utils/ads.js`](../src/utils/ads.js).
- Worker wiring lives in [`src/worker.js`](../src/worker.js).
- CSP adds Google Ads hosts only while ads are enabled.
- GTM and GA stay out of CSP.

## Configuration

- `ADSENSE_CLIENT` = `ca-pub-5134881365131182`
- `ADSENSE_SLOTS` JSON keys:
  - `home` — homepage, below the tool grid
  - `json` — JSON Formatter, below the educational section
  - `legal` — About, Privacy, Terms, and changelog only
- `ADSENSE_SLOT` can fill those three keys if a unit is reused.
- `tool`, `sidebar`, and `bottom` are ignored.
- Contact, Security, and Careers stay off the allow list (too thin for ads).
- Dev / local environments disable ads, ads.txt, and the account meta.

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

1. Publisher ID, empty `ADSENSE_SLOTS` → `/ads.txt` + `google-adsense-account` meta, no `adsbygoogle.js`, no `<ins>`.
2. Configured slots → `/ads.txt` ends with a newline and `/` plus `/json-formatter` plus `/about` render one reserved slot each.
3. `/password-generator` still has no ads script.
4. `/contact`, `/security`, and `/careers` have no ads script.
5. CSP includes `pagead2.googlesyndication.com` only while ads are enabled, and never GTM/GA.
