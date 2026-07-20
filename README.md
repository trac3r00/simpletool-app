# SimpleTool

Browser-based developer and everyday utilities served from a single Cloudflare Worker.

[![CI](https://github.com/Trac3r00/simpletool-app/actions/workflows/ci.yml/badge.svg)](https://github.com/Trac3r00/simpletool-app/actions/workflows/ci.yml)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES%20modules-F7DF1E?logo=javascript&logoColor=000)](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Modules)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

## Overview

SimpleTool is a collection of web utilities for formatting data, inspecting security artifacts, working with network formats, generating values, and transforming text or media. The Cloudflare Worker renders and routes the pages; tool input and output are processed in the browser.

The production catalog contains 53 tools. Three additional game tools are available when the Worker runs in a development environment.

## Features

- Browser-side processing for tool data, with no application accounts or server-side tool-data storage.
- Utilities for JSON, YAML, TOML, SQL, Markdown, regular expressions, text diffs, images, SVG, colors, timestamps, and units.
- Security and inspection tools for passwords, SSH keys, X.509 certificates, SAML, OAuth/PKCE, tokens, CSP, secrets, and environment files.
- Network references and builders for CIDR, DNS records, ports, HTTP status codes, protocol headers, Wireshark filters, WireGuard, webhooks, and curl.
- Registry-driven routing, home-page discovery, related-tool links, and production visibility.
- Responsive light and dark themes built with Tailwind CSS.
- Localization for English, Korean, Japanese, Spanish, Simplified Chinese, Traditional Chinese, French, German, Portuguese, and Vietnamese.
- Nonce-based Content Security Policy headers and IP-based rate limiting, backed by a Durable Object with an in-memory fallback.
- Unit tests with Vitest, browser tests with Playwright, and automated accessibility checks with axe-core.

## Architecture

```text
Browser
  |  HTTP request
  v
Cloudflare Worker (src/worker.js)
  |-- static and metadata routes
  |-- legal, blog, FAQ, and changelog pages
  |-- registry-driven tool routing
  |     `-- route modules render HTML and browser-side JavaScript
  |-- security headers and rate limiting
  `-- Workers Assets binding
         `-- generated CSS, fonts, vendor bundles, manifest, service worker

Browser executes each tool locally
  `-- user-provided tool data remains in the browser
```

`src/utils/tool-registry.js` is the source of truth for the tool catalog. `scripts/build-routes.js` generates the route-handler map, and the remaining build scripts compile Tailwind CSS, bundle browser dependencies, generate the Open Graph image, and prepare static assets in `dist/`.

## Requirements

The CI environment uses:

- Node.js 22
- [Bun](https://bun.sh/)
- Chromium for Playwright browser tests
- A Cloudflare account only when deploying

## Installation

```bash
git clone https://github.com/Trac3r00/simpletool-app.git
cd simpletool-app
bun install --frozen-lockfile
```

Install the Playwright browser before running E2E or accessibility tests:

```bash
bunx playwright install chromium
```

## Usage

Build the generated routes and browser assets, then start the local Worker:

```bash
bun run dev
```

Wrangler serves the application at `http://localhost:8787` by default.

Useful commands:

| Command | Purpose |
| --- | --- |
| `bun run build` | Generate routes, CSS, embedded styles, fonts, vendor bundles, game utilities, and the Open Graph image. |
| `bun run dev` | Build the project and start `wrangler dev`. |
| `bun run deploy` | Build and deploy with Wrangler. |
| `bun run test` | Run the Vitest unit suite once. |
| `bun run test:watch` | Run Vitest in watch mode. |
| `bun run test:coverage` | Run Vitest with coverage enabled. |
| `bun run test:e2e` | Run the Playwright suite; the test configuration starts a local Worker automatically. |
| `bun run test:e2e:ui` | Open Playwright's interactive test UI. |
| `bun run test:e2e:headed` | Run Playwright with a visible browser. |
| `bun run test:a11y` | Audit the home page and registered tool routes with Playwright and axe-core. |

To deploy interactively, authenticate Wrangler first:

```bash
bunx wrangler login
bun run deploy
```

Production deployment is also automated by `.github/workflows/deploy.yml` for pushes to `main`. The workflow builds, runs unit and E2E tests, performs a Wrangler dry run, deploys, and smoke-tests representative routes.

## Configuration

Cloudflare Worker settings are defined in `wrangler.toml`. The checked-in defaults disable AdSense, Sentry reporting, and Cloudflare Web Analytics until their values are configured.

### Runtime variables

| Variable | Purpose |
| --- | --- |
| `ENVIRONMENT` | Set to `development`, `dev`, or `local` to disable ads and production rate limiting and to include development-only tools. |
| `SITE_URL` | Base URL used for canonical links; defaults to `https://simpletool.app`. |
| `ADSENSE_CLIENT` | AdSense publisher client ID in `ca-pub-<digits>` format. |
| `ADSENSE_SLOT` | Optional fallback slot ID for any missing supported placement. |
| `ADSENSE_SLOTS` | JSON object containing `home`, `tool`, `legal`, `sidebar`, and/or `bottom` slot IDs. |
| `SENTRY_DSN` | Enables Sentry error reporting when non-empty. |
| `CF_ANALYTICS_TOKEN` | Enables the Cloudflare Web Analytics beacon when non-empty. |

For local overrides, place values in the ignored `.dev.vars` file. Do not commit credentials or private deployment values.

Example non-secret local configuration:

```dotenv
ENVIRONMENT=development
SITE_URL=http://localhost:8787
ADSENSE_SLOTS={}
```

### Bindings

| Binding | Source | Purpose |
| --- | --- | --- |
| `ASSETS` | `[assets]` | Serves generated files from `dist/`. |
| `CF_VERSION_METADATA` | `[version_metadata]` | Supplies the deployed version identifier to Sentry releases. |
| `RATE_LIMITER` | `[durable_objects]` | Stores per-IP rate-limit state in the `RateLimiter` Durable Object. |

See [AdSense integration](docs/adsense-integration.md) for slot behavior and [the rollout checklist](docs/adsense-rollout-checklist.md) before enabling advertising.

### Playwright variables

`playwright.config.js` supports these test-runner variables:

| Variable | Behavior |
| --- | --- |
| `PW_BASE_URL` | Overrides the URL used by browser tests. |
| `PW_PORT` | Overrides the local Worker port; defaults to `8787`. |
| `PW_NO_WEB_SERVER=1` | Prevents Playwright from starting its managed local Worker. |
| `PW_SKIP_BUILD=1` | Skips the build in Playwright's managed server command. CI uses this when testing a prepared build artifact. |
| `PW_USE_SYSTEM_CHROME=1` | Runs tests with the installed Chrome channel instead of bundled Chromium. |

## Development

Run a build before unit tests that import route or shared UI modules because `bun run build` generates `src/routes/_handlers.js`, `src/utils/bundled-styles.js`, and files under `dist/`.

```bash
bun run build
bun run test
bun run test:e2e
```

Focused examples:

```bash
bunx vitest run src/utils/security.test.js
bunx playwright test tests/e2e/network-tools.spec.js
bunx playwright test tests/e2e/all-tools-smoke.spec.js
```

The CI workflow runs build, unit-test, and E2E jobs for pull requests targeting `main`, pushes to non-`main` branches, and manual workflow dispatches. Review [the release and merge policy](docs/RELEASING.md) before opening or merging a pull request.

### Adding a tool

1. Add a route module under `src/routes/`.
2. Register its metadata in `src/utils/tool-registry.js`.
3. Add its handler export to `scripts/build-routes.js`.
4. Add or update the corresponding browser test action in `tests/helpers/tool-suite.js` when the tool needs interaction coverage.
5. Run `bun run build` to regenerate `src/routes/_handlers.js` and the browser assets.

Route pages are HTML template literals. Regular-expression backslashes inside those templates must be doubled so the browser receives the intended expression. Files using `String.raw` are the exception.

## Project structure

```text
src/
  worker.js               Worker entry point, routing, runtime config, and rate limiting
  routes/                 Tool route modules and generated handler map
  ui/                     Home, legal, blog, and FAQ rendering
  utils/                  Shared UI, i18n, security, responses, registry, and helpers
  i18n/                   Per-language translation catalogs
  games/                  Browser-side game configuration and runtime modules
scripts/                  Build, translation, simulation, and QA scripts
styles/input.css          Tailwind source and shared design tokens
tests/e2e/                Playwright browser and accessibility tests
docs/                     Release, advertising, safety, architecture, and handoff documentation
dist/                     Generated browser assets
wrangler.toml             Cloudflare Worker configuration and bindings
```

## Privacy and security notes

- Tool inputs and outputs are handled by browser-side code. Requests for pages and static assets still pass through Cloudflare and may produce normal infrastructure logs.
- AdSense and Cloudflare Web Analytics can make third-party requests when configured in production.
- The Worker applies CSP, HSTS, clickjacking, MIME-sniffing, referrer, permissions, and cross-origin headers.
- The default request limit is 120 requests per minute per IP, or 240 for recognized shared-IP networks. Rate limiting is disabled in development environments.
- Algorithms such as MD5 and SHA-1 remain available for compatibility and inspection workflows; they should not be used for new security-sensitive designs.

Report security issues using the contact published at `/.well-known/security.txt` or the instructions on the hosted `/security` page.

## License

The project is distributed under the MIT License, as declared in `package.json`.
