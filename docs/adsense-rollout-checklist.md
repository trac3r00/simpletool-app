# AdSense Rollout Checklist

> Canonical allow/deny lists and policy live in
> [`adsense-integration.md`](./adsense-integration.md) (which mirrors
> `src/utils/ads.js`). This file is the operational rollout steps only.

## Before requesting site review

- Confirm `/ads.txt` is the publisher line plus a trailing newline (needs `ADSENSE_CLIENT`, not slot IDs).
- Confirm every page includes `<meta name="google-adsense-account" content="ca-pub-…">`.
- Confirm allow-listed HTML (home, JSON, legal, blog, FAQ) has the official static `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-…">` in `<head>`.
- Confirm the AdSense Sites URL is `https://simpletool.app` (apex). `www.simpletool.app` has no DNS unless you add it.
- Confirm Privacy names Google AdSense, cookies (including doubleclick.net / Google domains), and opt-out links (`adssettings.google.com`, `aboutads.info`) in every language.
- Confirm Terms does not say ads are off in any language.
- Confirm `/robots.txt` allows crawling and lists `/sitemap.xml`.
- Confirm `/about`, `/privacy`, `/terms`, and `/contact` are linked from the footer.

## Before turning ads on

- Create three Display units in AdSense. Do not enable Auto ads.
- Paste the slot IDs into `ADSENSE_SLOTS` (`home`, `json`, `legal`).
- Confirm privacy/terms mention non-personalized ads on the allow list.
- Confirm the deny list still has no script.
- For EEA/UK/CH traffic, turn on a Google-certified CMP (AdSense Privacy & messaging / Funding Choices) before serving. NPA still uses cookies for frequency capping and fraud, so EU user-consent policy still applies.

## After deploy

- `/ads.txt` returns the publisher line plus a trailing newline.
- `/` has one reserved slot below the tool grid.
- `/json-formatter` has one reserved slot below the educational section.
- `/about` and `/changelog` have one reserved slot.
- `/contact`, `/security`, `/careers`, and `/password-generator` have no `adsbygoogle`.
- Homepage `<head>` contains the official `adsbygoogle.js?client=` tag even with empty slots (no `<ins>` until slot IDs exist).
- No GTM / GA hosts in CSP.
