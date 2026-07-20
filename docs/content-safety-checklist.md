# Content Safety Checklist

Use this checklist when auditing tool content for ad policy compliance before enabling AdSense on a new page or slot.

## Per-tool audit

For each tool page, confirm:

- [ ] The page does not instruct users to perform illegal activity
- [ ] The page does not generate or display content that violates Google AdSense program policies (no adult, dangerous, deceptive, or hateful content)
- [ ] Any security/crypto output (hashes, keys, certificates, tokens) is clearly framed as educational or utility output — not as attack tooling
- [ ] The page title and meta description accurately represent the tool's purpose
- [ ] Tool labels and help text are not misleading or exaggerated

## Sensitive tool categories

Extra review required for these tool categories:

### Security and crypto tools
- [ ] Ad placement does not appear inside the primary input/output area
- [ ] Ad label ("Sponsored") is clearly distinct from tool results
- [ ] No ad is adjacent to a "Generate" or "Decode" button in a way that could be clicked by mistake
- [ ] Tool description does not frame the utility as an offensive attack tool

### Token and certificate inspection tools
- [ ] Ad placement is outside the decoded output panel
- [ ] No ad appears between the input and the decoded result

### Secret scanning and log masking tools
- [ ] No ad appears inside a result panel that displays sensitive-looking data patterns
- [ ] Ad label is present and visible near any sponsored content

### Game pages (marble roulette, ladder game, roulette wheel)
- [ ] Ad placement reviewed separately — motion-heavy layouts require individual assessment
- [ ] No ad appears inside the active play area
- [ ] Ad containers do not overlap game result displays
- [ ] Ads are not styled to resemble game rewards or win states

## Legal and privacy pages

- [ ] Privacy policy mentions third-party advertising (Google AdSense) and cookie/identifier usage
- [ ] Terms of service includes an advertising section
- [ ] Legal page ad slot (`legal`) is outside the primary policy text body
- [ ] No ad is placed in a way that interrupts a user reading required legal disclosures

## Educational content panels

- [ ] No ad placed between sequential steps in a how-to section
- [ ] No ad placed between cheatsheet heading and its content
- [ ] No ad placed inside a reference table
- [ ] Ads appear only before or after a complete educational block

## i18n compliance

- [ ] Ad-adjacent labels (e.g. "Sponsored") appear in the correct locale or are locale-neutral
- [ ] Privacy and terms ad disclosure text exists for every language listed in `SUPPORTED_LANGUAGES` in `src/utils/i18n.js`.
- [ ] No locale shows a visible ad label that is untranslated while the rest of the page is localized

## Pre-release sign-off

Complete before enabling any new slot in production:

- [ ] All affected tool pages pass per-tool audit above
- [ ] Sensitive tool categories reviewed individually
- [ ] Legal pages verified for disclosure language
- [ ] Educational panel placement rules confirmed
- [ ] i18n compliance confirmed for all active languages
- [ ] `docs/adsense-rollout-checklist.md` preflight passed
