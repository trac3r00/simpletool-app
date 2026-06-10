# Summary

<!-- One paragraph: what this PR changes and WHY it is needed. Link the issue. -->

Closes #

## What changed

<!-- Bullet list of concrete changes. Each bullet = one logical change. -->

-

## Why

<!-- The problem/motivation. If reverting, state exactly what broke and the evidence. -->

## Verification

<!-- Paste real command output or CI evidence. "It works" is not verification. -->

- [ ] `npm run build` passes
- [ ] `npm test` passes (unit)
- [ ] `npm run test:e2e` passes (or N/A — explain)
- [ ] Manually exercised the affected route(s)

```text
(paste relevant test/build output here)
```

## Risk & rollback

<!-- What could break, and how to undo this change. -->

- Risk:
- Rollback: revert this commit / 

## Checklist

- [ ] Regex in template literals double-escaped (`\\d` not `\d`)
- [ ] UI uses design tokens (`primary-*`, `surface-*`, `.btn`, `.card`)
- [ ] Dark mode variants included
- [ ] i18n keys added/updated if UI text changed
- [ ] No secrets, no personal info, no local paths in code or this description
