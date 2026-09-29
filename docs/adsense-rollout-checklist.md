# AdSense Rollout Checklist

> Canonical allow/deny lists and policy live in
> [`adsense-integration.md`](./adsense-integration.md) (which mirrors
> `src/utils/ads.js`). This file is the operational rollout steps only.

## Before requesting site review

- Treat the owner-supplied 2026-09-11 rejection as **low-value content** review, not as a known bad route or word-count issue. Exercise all 48 registered tools plus home/legal/blog/FAQ routes for original utility, complete behavior, navigation, and good UX; record production-hidden routes honestly.
- Confirm `/ads.txt` is the publisher line plus a trailing newline (needs `ADSENSE_CLIENT`, not slot IDs).
- Confirm every page includes `<meta name="google-adsense-account" content="ca-pub-…">`.
- Confirm allow-listed HTML (home, JSON, legal, blog, FAQ) has the official static `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-…">` in `<head>`.
- Confirm the AdSense Sites URL is `https://simpletool.app` (apex). `www.simpletool.app` has no DNS unless you add it.
- Confirm Privacy names Google AdSense, cookies (including doubleclick.net / Google domains), opt-out links (`adssettings.google.com`, `aboutads.info`), and the complete script-load scope (including blog and FAQ) in every language.
- Confirm Terms does not say ads are off in any language.
- Confirm `/robots.txt` allows crawling and lists `/sitemap.xml`.
- Confirm `/about`, `/privacy`, `/terms`, and `/contact` are linked from the footer.

## Before turning ads on

- Create manual Display units in AdSense for the two current placements (`json` and `legal`). Do not enable Auto ads.
- Paste those slot IDs into `ADSENSE_SLOTS`. Set `home` only if a homepage placement is re-added; the key currently has no call site.
- Confirm privacy/terms mention non-personalized ads on the allow list.
- Confirm the deny list still has no script.
- For EEA/UK/CH traffic, configure and publish the appropriate consent message/CMP in AdSense Privacy & messaging before serving. Non-personalized mode alone does not waive consent for cookies or local storage where legally required. Record the account-side configuration; repository tests cannot verify it.

## After deploy

- `/ads.txt` returns the publisher line plus a trailing newline.
- `/` has no reserved slot (the below-catalog block that held it was removed); it still ships the client script in `<head>`.
- `/json-formatter` has one reserved slot below the tool controls.
- `/about` and `/changelog` have one reserved slot.
- `/contact`, `/security`, `/careers`, and `/password-generator` have no `adsbygoogle`.
- Homepage `<head>` contains the official `adsbygoogle.js?client=` tag even with empty slots (no `<ins>` until slot IDs exist).
- No GTM / GA hosts in CSP.
- Do not request review until the deployed site matches the reviewed commit and the AdSense account-side CMP/message and Auto ads settings have been checked.
