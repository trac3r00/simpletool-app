# AdSense Integration

> **Authoritative ad-policy doc.** The allow/deny lists below mirror the code —
> the real source of truth is `ALLOW_SLOT_KEYS`, `DENY_AD_PATHS`, and
> `LEGAL_AD_PATHS` in [`src/utils/ads.js`](../src/utils/ads.js), enforced by
> `src/ui/honest-copy.test.js`. Other docs must point here rather than restate
> the lists.

Manual Display units only. Non-personalized ads. Never Auto ads.

A publisher ID (`ADSENSE_CLIENT`) is enough for site connection: `/ads.txt`,
the `google-adsense-account` meta, and Google's official `adsbygoogle.js`
snippet as a **static** `<head>` script on script-allow pages (home, JSON
Formatter, About/Privacy/Terms/changelog, blog, FAQ). Ad **units**
(`<ins class="adsbygoogle">`) stay off until `ADSENSE_SLOTS` contains real
slot IDs. Secret tools never load the script.

## Current implementation

- Policy and rendering live in [`src/utils/ads.js`](../src/utils/ads.js).
- Worker wiring lives in [`src/worker.js`](../src/worker.js).
- CSP adds Google Ads hosts on pages that may load the client script
  (`pageAllowsAdScript`), even before slot IDs exist. `frame-src` includes
  `www.google.com` and `www.googleadservices.com` so the traffic-quality
  iframe is not blocked.
- GTM and GA stay out of CSP.

## Configuration

- `ADSENSE_CLIENT` = `ca-pub-5134881365131182`
- `ADSENSE_SLOTS` JSON keys:
  - `home` — reserved, **currently placed nowhere**: the homepage's below-catalog
    block (editorial copy + flagship links) was removed on 2026-09-10 and took the
    only `home` unit with it. The key stays parseable for a future placement, but
    `/` is not manual-unit inventory (`pageAllowsAds("/")` is false), so setting it
    renders nothing until both the allow-list and a call site are restored.
  - `json` — JSON Formatter, below the tool controls
  - `legal` — About, Privacy, Terms, and changelog only
- `ADSENSE_SLOT` can fill those three keys if a unit is reused.
- `tool`, `sidebar`, and `bottom` are ignored.
- Contact, Security, and Careers stay off the unit allow list (too thin for ads).
- Blog and FAQ load the client script for site-connect but are not unit inventory. Privacy disclosures include these script-load routes even though they have no manual unit.
- Dev / local environments disable ads, ads.txt, and the account meta. To test the production configuration, request a deployed production URL; changing local environment variables while requesting localhost cannot enable ads.

Example:

```json
{
  "home": "1111111111",
  "json": "2222222222",
  "legal": "3333333333"
}
```

## Hard rules

- Non-personalized only (`requestNonPersonalizedAds = 1`, `data-npa-on="1"`). This does not remove consent obligations for cookies or local storage where legally required.
- Client script is the official static tag in `<head>` (required for AdSense site-connect). Units still wait for slot IDs. Auto ads stay off in the AdSense UI.
- Visible `Advertisement` label and reserved height (`min-height: 280px`).
- Deny list never loads the script: password, SSH, Token Studio, WireGuard, certs, secret scanner, encoding workbench.
- Other tool pages also stay off unless they are on the allow list.

## Verification

1. Publisher ID, empty `ADSENSE_SLOTS` → `/ads.txt` + `google-adsense-account` meta + static `adsbygoogle.js?client=` in `<head>`, no `<ins>`.
2. Configured slots → `/ads.txt` ends with a newline and `/json-formatter` plus `/about` render one reserved slot each. (`/` renders none — see the `home` note above.)
3. `/password-generator` still has no ads script.
4. `/contact`, `/security`, and `/careers` have no ads script.
5. CSP includes `pagead2.googlesyndication.com` on script-allow pages (including `/blog`) once a publisher ID exists, and never GTM/GA.
6. Before serving users in the EEA, UK, or Switzerland, verify the required consent message/CMP in the AdSense account. This repository cannot prove or activate that account setting.
