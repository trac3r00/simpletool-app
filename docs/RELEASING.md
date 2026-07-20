# Release & Merge Policy

This document defines when a PR gets merged, when a release is cut, and how
hotfixes flow. It exists because "CI is green" is necessary but not sufficient.

## Where contributors should look

- **Before opening a PR:** use `.github/PULL_REQUEST_TEMPLATE.md` and paste
  real verification evidence.
- **Before merging a PR:** use the merge checklist in this document.
- **Before tagging a release:** update `changelog.md`, confirm the exact SHA
  passed the release checks, then create the tag/release notes from that SHA.
- **During incidents:** follow the hotfix and rollback sections below.

## Required merge gates

A PR is merged only when ALL of the following hold:

1. **CI green on the latest commit** (not an earlier one). Required checks are
   `Build`, `Unit Tests (Vitest)`, and `E2E Tests (Playwright)` from the CI
   workflow.
2. **PR body complete** per `.github/PULL_REQUEST_TEMPLATE.md` — linked issue,
   why-section, pasted verification output. A PR with an empty Why section is
   not mergeable regardless of CI.
3. **Reviewer confidence in verification.** The PR must include the smallest
   relevant local command output or CI evidence. Route/UI changes also need
   affected-route manual exercise; docs-only changes may use markdown/file
   inspection.
4. **One logical change per PR.** If a PR mixes a feature and an unrelated
   refactor, split it.
5. **Soak rule for batches:** never merge more than ONE deploy-affecting PR
   per 15 minutes. Each push to `main` triggers a production deploy; merging
   N PRs in the same minute cancels intermediate deploys and makes failures
   unattributable. (Incident 2026-06-09: 4 PRs merged at 19:32, deploys
   cancelled, the follow-up SRI fix failed and had to be reverted — root
   cause could not be isolated to a single PR.)
   - Exception: docs-only / CI-config-only PRs may batch freely.
6. **Dependabot:** patch/minor dev-deps may auto-merge after CI. Major bumps
   and anything in `dependencies` (shipped code) require a manual review of
   the changelog and one local `bun run build && bun run test` run.

## Direct pushes to main

Not allowed, including for the repo owner and automation. Every change goes
through a PR so the template and CI gate apply. The only exception is a
broken-main emergency where CI itself cannot run; such a push must be
followed within 24h by a retroactive PR-style writeup in the commit or an
issue documenting why.

## Release policy

`main` auto-deploys on every push (continuous deployment). The deploy workflow
serializes production deploys, rebuilds the app, runs unit and E2E tests,
performs a Wrangler dry-run, deploys to Cloudflare Workers, then smoke-tests
`/health`, `/`, and `/json-formatter`. Releases give us named, documented
rollback anchors on top of that continuous deployment flow.

- **When to tag:** after a meaningful user-facing milestone (new tool, major
  UX change, security fix) or at most every ~2 weeks of accumulated changes.
  Pure dependency churn does not justify a release.
- **Versioning:** semver. Breaking URL/behavior change = major; new tool or
  feature = minor; fixes/deps = patch.
- **Changelog:** update `changelog.md` before tagging. Keep it user-readable:
  headline the version/date, group notable Features / Fixes / Dependencies /
  Docs, and include operational notes that affect release managers.
- **Release notes:** generated from merged PR titles and `changelog.md`, grouped
  as Features / Fixes / Dependencies / Docs. Every note line links its PR.
- **Tags:** tag the exact SHA that passed the pre-tag check. Use `vX.Y.Z`
  format so release tags sort consistently.
- **Pre-tag check:** `bun run build && bun run test && bun run test:e2e` locally
  or via CI on the exact tagged SHA.

## Hotfix flow

1. Branch `hotfix/<slug>` from `main`.
2. PR with template (Why = incident description + evidence).
3. Merge alone (never batched), watch the deploy run to completion.
4. If the deploy fails, revert immediately first, diagnose second.

## Rollback

- Preferred: `git revert` via PR (keeps history, re-runs CI/deploy).
- Anchors: release tags are known-good states; `gh release list` to find the
  last one, `git revert <bad>..HEAD` or redeploy the tag in an emergency.
