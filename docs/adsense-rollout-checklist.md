# AdSense Rollout Checklist

## Before turning ads on

- Create three Display units in AdSense. Do not enable Auto ads.
- Paste the slot IDs into `ADSENSE_SLOTS` (`home`, `json`, `legal`).
- Confirm privacy/terms mention non-personalized ads on the allow list.
- Confirm the deny list still has no script.

## After deploy

- `/ads.txt` returns the publisher line plus a trailing newline.
- `/` has one reserved slot below the tool grid.
- `/json-formatter` has one reserved slot below the editor.
- `/about` and `/changelog` have one reserved slot in the footer.
- `/password-generator` and the rest of the deny list have no `adsbygoogle`.
- Script request happens after first paint.
- No GTM / GA hosts in CSP.
