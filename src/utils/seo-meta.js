/**
 * Search-facing <title> and meta description per tool (English pages only).
 *
 * Why this exists (improvement report 2026-11-05, P0-2/P0-3): the registry
 * `name` doubles as the on-page H1 and nav label, so it stays short. Search
 * snippets need the words people actually type ("saml decoder", "htpasswd
 * generator") plus concrete facts, in roughly 110-160 characters.
 *
 * Format: "[search term] Online - [key capability]" ; createPageTemplate()
 * appends " | SimpleTool". Every claim must be true of the shipped tool;
 * src/utils/seo-meta.test.js enforces coverage and length.
 */
export const SEO_META = {
  "json-formatter": {
    title: "JSON Formatter & Validator Online - Repair, Beautify, Minify",
    description:
      "Format, validate, and minify JSON in your browser, and repair broken LLM output (trailing commas, single quotes, code fences). Free, no sign-up, nothing uploaded.",
  },
  "uuid-generator": {
    title: "UUID Generator Online - v4, v7, v1 and NIL UUIDs",
    description:
      "Generate UUID v4, time-ordered v7, v1, and NIL identifiers in bulk with crypto-grade randomness. Free, runs entirely in your browser, nothing is sent to a server.",
  },
  "password-generator": {
    title: "Password Generator Online - Strong Random Passwords",
    description:
      "Create strong random passwords, passphrases, and usernames with crypto.getRandomValues(). No ads on this page, no sign-up, and nothing leaves your browser.",
  },
  "cidr-calculator": {
    title: "CIDR & Subnet Calculator Online - IPv4 and IPv6",
    description:
      "Calculate IPv4 and IPv6 subnets: network range, broadcast address, usable hosts, masks, and splits for any CIDR such as 10.0.0.0/24. Free and runs in your browser.",
  },
  "network-reference": {
    title: "Network Reference - DNS Records, Ports, HTTP Status Codes",
    description:
      "One searchable reference for DNS record types, IANA TCP/UDP ports, HTTP status codes, and Ethernet, IP, and TCP header diagrams. Free, fast, and no sign-up.",
  },
  "bandwidth-calculator": {
    title: "Bandwidth Calculator Online - Transfer Time & Mbps to MB/s",
    description:
      "Calculate file transfer time, required bandwidth, and TCP bandwidth-delay product. Explains Mbps vs MB/s with worked examples and protocol overhead. Free, in-browser.",
  },
  "webhook-debugger": {
    title: "Webhook Payload Inspector - Verify HMAC Signatures Online",
    description:
      "Paste a captured webhook request to inspect headers and body, verify its HMAC signature (GitHub, Stripe, Slack, Shopify style), and rebuild it as cURL. Runs locally.",
  },
  "wireguard-config": {
    title: "WireGuard Config Generator Online - Keys and QR Codes",
    description:
      "Generate WireGuard server and peer configs with keys created in your browser, templates for common topologies, and QR export for mobile clients. Private keys stay local.",
  },
  "wireshark-filter": {
    title: "Wireshark Filter Builder - Display and BPF Capture Filters",
    description:
      "Build Wireshark display filters and BPF capture filters visually without memorizing syntax. Combine protocols, hosts, and ports, then copy the expression. Free.",
  },
  "text-diff": {
    title: "Text Diff Online - Compare Text by Line, Word or Character",
    description:
      "Compare two texts by line, word, or character, ignore whitespace or case, and export a unified .diff patch. Useful for configs and prompt versions. Runs in your browser.",
  },
  "regex-visualizer": {
    title: "Regex Tester Online - Railroad Diagrams and Explanations",
    description:
      "Test regular expressions with live match highlighting, railroad diagrams, and a token-by-token explanation of what each part of the pattern does. Free, in-browser.",
  },
  "cron-builder": {
    title: "Cron Expression Generator - Crontab Editor with Next Runs",
    description:
      "Build cron expressions with dropdowns, read them as plain English, and preview the next run times before deploying a crontab. Free, no sign-up, runs in your browser.",
  },
  "ssh-key-generator": {
    title: "SSH Key Generator Online - Ed25519, ECDSA and RSA Keys",
    description:
      "Generate Ed25519, ECDSA, or RSA SSH key pairs in your browser, then add them to GitHub with step-by-step setup, chmod 600 permissions, and passphrase tips.",
  },
  "certificate-decoder": {
    title: "X.509 Certificate Decoder Online - PEM, CSR and Chain Check",
    description:
      "Decode PEM certificates and CSRs: subject, issuer, SANs, validity, key size. Checks chain order and signatures and warns on expiry, SHA-1, and weak RSA keys.",
  },
  "token-studio": {
    title: "JWT Decoder & Generator Online - JWK and JWKS Tools",
    description:
      "Decode, verify, and sign JWTs, generate and convert JWK keys, and simulate a JWKS endpoint. Decoding happens locally in your browser; tokens are never uploaded.",
  },
  "encoding-workbench": {
    title: "Base64, Hex & URL Decoder Online - Encoding Workbench",
    description:
      "Encode and decode Base64, hex, URL, and HTML entities, auto-detect layered encodings, and hash with MD5, SHA, or bcrypt. Free and processed entirely in your browser.",
  },
  "saml-decoder": {
    title: "SAML Decoder Online - Decode SAML Response and Request",
    description:
      "Decode Base64 and deflated SAML responses and requests into readable XML, see key fields, and diagnose clock skew, audience, and destination errors. Nothing uploaded.",
  },
  "oauth-debugger": {
    title: "PKCE Generator & OAuth 2.0 Debugger Online",
    description:
      "Generate PKCE code verifier and S256 challenge pairs, visualize OAuth 2.0 and OIDC flows, and check an authorization request for common security mistakes. Free.",
  },
  "user-agent-decoder": {
    title: "User-Agent Parser Online - Browser, OS, Device and Bots",
    description:
      "Parse any User-Agent string into browser, OS, and device, detect search, AI, and social crawlers, and load 25+ real samples. Copy the result as JSON. Free, in-browser.",
  },
  "qr-code": {
    title: "QR Code Generator & Scanner Online - Free, No Sign-up",
    description:
      "Create QR codes for URLs, text, and Wi-Fi, download them as PNG or SVG, or decode a QR code from an image. Free, no sign-up, and generated in your browser.",
  },
  "timestamp-converter": {
    title: "Unix Timestamp Converter - Epoch to Date and Back",
    description:
      "Convert Unix epoch timestamps in seconds or milliseconds to human-readable dates in UTC and local time, and convert dates back to timestamps. Free and instant.",
  },
  "color-converter": {
    title: "Color Converter Online - HEX to RGB and HSL",
    description:
      "Convert colors between HEX, RGB, and HSL, pick colors visually, and copy CSS-ready values with one click. Free, fast, and runs entirely in your browser.",
  },
  "unit-converter": {
    title: "Unit Converter Online - Length, Weight, Data and More",
    description:
      "Convert length, weight, temperature, volume, data size, and more between metric and imperial units instantly. Free, no sign-up, and works entirely in your browser.",
  },
  "yaml-toml-converter": {
    title: "YAML to JSON & TOML Converter Online",
    description:
      "Convert configuration files between YAML, TOML, and JSON in any direction with syntax errors shown inline. Free, no sign-up, and your config never leaves the browser.",
  },
  "htpasswd-generator": {
    title: "Htpasswd Generator Online - bcrypt for Apache and Nginx",
    description:
      "Generate .htpasswd entries with bcrypt, APR1-MD5, or SHA-1, verify an existing hash, and copy ready configs for Apache, Nginx, Caddy, Traefik, and Kubernetes.",
  },
  "mock-data-generator": {
    title: "Mock Data Generator Online - Fake JSON and CSV Data",
    description:
      "Generate realistic fake data such as names, emails, addresses, and IDs as JSON or CSV for tests, demos, and database seeding. Free and generated in your browser.",
  },
  "markdown-editor": {
    title: "Markdown Editor Online - Live Preview with GFM",
    description:
      "Write Markdown in a split-pane editor with live GitHub Flavored Markdown preview, synchronized scrolling, and HTML export. Free, no account, saved in your browser.",
  },
  "log-viewer": {
    title: "Log File Viewer Online - Filter and Search Large Logs",
    description:
      "Open large log files locally, filter by level or text, search with regex, and visualize activity over time without uploading anything. Free and fast in your browser.",
  },
  "case-converter": {
    title: "Case Converter Online - camelCase, snake_case, kebab-case",
    description:
      "Convert text between camelCase, PascalCase, snake_case, kebab-case, UPPER, lower, and Title Case instantly. Free, handles multi-line input, and runs in your browser.",
  },
  "code-minifier": {
    title: "Code Minifier Online - Minify JavaScript, CSS and HTML",
    description:
      "Minify JavaScript, CSS, and HTML to shrink file size, and see how many bytes you saved. Free, no sign-up, and your source code is processed only in your browser.",
  },
  "image-converter": {
    title: "Image Converter Online - PNG, JPG and WebP, Resize",
    description:
      "Convert images between PNG, JPG, and WebP and resize them locally with adjustable quality. Your photos are processed in the browser and never uploaded. Free.",
  },
  "css-gradient": {
    title: "CSS Gradient Generator - Linear and Radial Gradients",
    description:
      "Design linear and radial CSS gradients visually with color stops and angles, preview them live, and copy the ready-to-use CSS background code. Free and instant.",
  },
  "curl-studio": {
    title: "Curl Command Builder & Parser Online - Curl Studio",
    description:
      "Paste a curl command to edit its method, headers, and body visually, or build one from scratch and copy it back. Free, and requests are never sent from this page.",
  },
  "log-masker": {
    title: "Log Masker Online - Redact PII from Logs Locally",
    description:
      "Automatically detect and redact emails, IP addresses, credit card numbers, and other PII in log text before sharing it. Free, processed only in your browser.",
  },
  "mermaid-studio": {
    title: "Mermaid Live Editor Online - Flowcharts and Diagrams",
    description:
      "Edit Mermaid.js flowcharts, sequence diagrams, and more with a live preview, then export the diagram. Free, no account, and rendered entirely in your browser.",
  },
  "json-schema-studio": {
    title: "JSON to JSON Schema Generator Online",
    description:
      "Generate a JSON Schema from sample JSON, then refine types and required fields for API validation and documentation. Free, no sign-up, runs in your browser.",
  },
  caffeinate: {
    title: "Keep Screen Awake Online - Caffeinate in Your Browser",
    description:
      "Stop your screen from sleeping during presentations, downloads, or long reads using the browser Wake Lock API. One click to start, free, and no install needed.",
  },
  "email-analyzer": {
    title: "Email Header Analyzer - SPF, DKIM and DMARC Check",
    description:
      "Paste raw email headers to check SPF, DKIM, and DMARC results, trace routing hops, and list embedded URLs for phishing triage. Free and analyzed in your browser.",
  },
  "token-counter": {
    title: "Token Counter Online - Exact GPT Tokens and LLM Cost",
    description:
      "Count tokens exactly for OpenAI models (o200k and cl100k), estimate Claude, Gemini, and Llama, check context window use, and price prompts with your own rates.",
  },
  "prompt-template-builder": {
    title: "Prompt Template Builder - Reusable LLM Prompts",
    description:
      "Build reusable LLM prompt templates with placeholders, system and user sections, and guardrails, then copy them for GPT, Claude, or Llama. Free, in your browser.",
  },
  "repo-ops": {
    title: "Repo Operations - repos.yml and Review Description Builder",
    description:
      "Build public repository inventories (repos.yml), manual-stewardship decision records, and pull request review descriptions in one workspace. Free, in-browser.",
  },
  "sql-formatter": {
    title: "SQL Formatter Online - Beautify and Validate SQL",
    description:
      "Format SQL queries for readability and catch common syntax issues, with PostgreSQL- and MySQL-friendly output. Free, no sign-up, and processed in your browser.",
  },
  "env-var-manager": {
    title: "Env File Diff Online - Compare .env Files, Mask Secrets",
    description:
      "Diff .env files across environments to find missing or changed variables, and mask secret values before sharing. Free and processed entirely in your browser.",
  },
  "svg-optimizer": {
    title: "SVG Optimizer Online - Minify, Sanitize and Recolor SVG",
    description:
      "Sanitize, preview, and minify SVG files, strip unnecessary markup, and recolor fill and stroke for icons. Free, no upload, and runs entirely in your browser.",
  },
  "csp-builder": {
    title: "CSP Header Generator - Content-Security-Policy Builder",
    description:
      "Build a Content-Security-Policy header interactively with explanations for every directive, nonce and hash support, and copy-ready output. Free and in-browser.",
  },
  "secret-scanner": {
    title: "Secret Scanner Online - Find Leaked API Keys and Tokens",
    description:
      "Scan text for leaked API keys, tokens, and passwords, then copy a redacted version that is safe to share. No ads on this page, and nothing leaves your browser.",
  },
  pipe: {
    title: "Pipe Mode - Chain Developer Tools Together",
    description:
      "Chain tools into a pipeline, such as decode Base64 then format JSON, and run every step on the same input. Your data is processed in your browser, not on a server.",
  },
};
