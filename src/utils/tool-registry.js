/**
 * Single source of truth for tool metadata.
 *
 * Fields:
 * - id: path segment (no leading slash)
 * - name/icon/description: UI strings (English)
 * - path: route path used by the UI (do not change routing here)
 * - category: used for home grouping (formatters, security, network, generators, game, utils)
 * - keywords: additional search tokens (string)
 */

export const TOOLS = [
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    icon: '📋',
    description: 'Validate, format, and minify JSON data.',
    path: '/json-formatter',
    category: 'formatters',
    keywords: 'lint, validator, beautify'
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Inspector',
    icon: '🔓',
    description: 'Inspect and decode JSON Web Tokens.',
    path: '/jwt-decoder',
    category: 'security',
    keywords: 'token, auth, base64',
    tip: 'Decode JWT header, payload, and verify signature — paste any JWT to see its claims'
  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    icon: '🔑',
    description: 'Generate standard UUIDs (v1, v4).',
    path: '/uuid-generator',
    category: 'generators',
    keywords: 'guid, identifier, unique'
  },
  {
    id: 'password-generator',
    name: 'Password Generator',
    icon: '🔐',
    description: 'Create secure, random passwords.',
    path: '/password-generator',
    category: 'security',
    keywords: 'random, secure, strong'
  },
  {
    id: 'hash-calculator',
    name: 'Hash Calculator',
    icon: '#️⃣',
    description: 'Compute SHA256, MD5, and other hashes.',
    path: '/hash-calculator',
    category: 'security',
    keywords: 'checksum, crypto, digest'
  },
  {
    id: 'cidr-calculator',
    name: 'IP Subnet Planner',
    icon: '🕸️',
    description: 'Calculate IPv4/IPv6 subnets and ranges.',
    path: '/cidr-calculator',
    category: 'network',
    keywords: 'ip, subnet, mask, network',
    tip: 'Enter a CIDR like 10.0.0.0/24 to see network range, broadcast address, and available hosts'
  },
  {
    id: 'text-diff',
    name: 'Text Diff',
    icon: '📝',
    description: 'Compare two text files for differences.',
    path: '/text-diff',
    category: 'utils',
    keywords: 'compare, changes, delta'
  },
  {
    id: 'regex-visualizer',
    name: 'Regex Studio',
    icon: '🧩',
    description: 'Visualize, explain, and test regular expressions with real-time diagrams.',
    path: '/regex-visualizer',
    category: 'utils',
    keywords: 'pattern, match, test, railroad',
    tip: 'See railroad diagrams, token-by-token explanations, and live match highlighting for any regex'
  },
  {
    id: 'universal-decoder',
    name: 'Layered Decoder',
    icon: '🔮',
    description: 'Auto-detect and unwrap layered encodings (Base64, URL, Hex, and more).',
    path: '/universal-decoder',
    category: 'formatters',
    keywords: 'base64, hex, url, html',
    tip: 'Paste encoded text and watch it unwrap layer by layer — Base64 inside URL encoding inside Hex, etc.'
  },
  {
    id: 'cron-builder',
    name: 'Cron Builder',
    icon: '⏰',
    description: 'Visual cron editor with human-readable descriptions and next-run preview.',
    path: '/cron-builder',
    category: 'utils',
    keywords: 'schedule, time, expression, crontab',
    tip: 'Build cron expressions with dropdowns — see plain English descriptions and the next 5 run times'
  },
  {
    id: 'ssh-key-generator',
    name: 'SSH Key Generator',
    icon: '🗝️',
    description: 'Generate RSA and ECDSA SSH keys.',
    path: '/ssh-key-generator',
    category: 'security',
    keywords: 'openssh, pem, public key'
  },
  {
    id: 'certificate-decoder',
    name: 'X.509 Certificate Inspector',
    icon: '📜',
    description: 'Parse X.509 certificates and CSRs.',
    path: '/certificate-decoder',
    category: 'security',
    keywords: 'ssl, tls, pem, x509',
    tip: 'Paste a PEM certificate to see issuer, subject, validity dates, SANs, and key details'
  },
  {
    id: 'jwk-jwks-studio',
    name: 'JWK/JWKS Studio',
    icon: '🧷',
    description: 'Convert PEM/JWK/JWKS, compute RFC7638 thumbprints, and verify JWT signatures offline.',
    path: '/jwk-jwks-studio',
    category: 'security',
    keywords: 'jwk, jwks, jose, oidc, kid, rfc 7638, thumbprint, jwt, rs256, ps256, es256',
    tip: 'Paste a JWK/JWKS or PEM public key to compute a correct kid (thumbprint) and verify JWTs client-side',
    badge: 'NEW'
  },
  {
    id: 'saml-decoder',
    name: 'SAML Inspector',
    icon: '🛡️',
    description: 'Decode SAML requests and responses.',
    path: '/saml-decoder',
    category: 'security',
    keywords: 'sso, xml, assertion',
    tip: 'Decode Base64-encoded SAML requests and responses into readable XML for SSO debugging'
  },
  {
    id: 'user-agent-decoder',
    name: 'User-Agent Parser',
    icon: '🕵️',
    description: 'Parse and analyze User-Agent strings.',
    path: '/user-agent-decoder',
    category: 'network',
    keywords: 'browser, os, device'
  },
  {
    id: 'qr-code',
    name: 'QR Code Studio',
    icon: '📱',
    description: 'Generate QR codes for URLs and text.',
    path: '/qr-code',
    category: 'generators',
    keywords: '2d, barcode, scan'
  },
  {
    id: 'timestamp-converter',
    name: 'Timestamp Converter',
    icon: '⏳',
    description: 'Convert Unix timestamps to human dates.',
    path: '/timestamp-converter',
    category: 'formatters',
    keywords: 'epoch, time, date'
  },
  {
    id: 'color-converter',
    name: 'Color Converter',
    icon: '🎨',
    description: 'Convert HEX, RGB, and HSL colors.',
    path: '/color-converter',
    category: 'formatters',
    keywords: 'picker, palette, css'
  },
  {
    id: 'unit-converter',
    name: 'Unit Converter',
    icon: '⚖️',
    description: 'Convert length, weight, and more.',
    path: '/unit-converter',
    category: 'formatters',
    keywords: 'measure, metric, imperial'
  },
  {
    id: 'yaml-toml-converter',
    name: 'Config Converter',
    icon: '⚙️',
    description: 'Convert between YAML, TOML, and JSON.',
    path: '/yaml-toml-converter',
    category: 'formatters',
    keywords: 'config, serialization'
  },
  {
    id: 'htpasswd-generator',
    name: 'Htpasswd Entry Generator',
    icon: '🔒',
    description: 'Generate apache htpasswd entries.',
    path: '/htpasswd-generator',
    category: 'security',
    keywords: 'apache, basic auth',
    tip: 'Create Apache htpasswd entries with bcrypt, SHA-1, or MD5 for HTTP Basic Auth'
  },
  {
    id: 'mock-data-generator',
    name: 'Mock Data Generator',
    icon: '📊',
    description: 'Generate random JSON/CSV data.',
    path: '/mock-data-generator',
    category: 'generators',
    keywords: 'fake, dummy, seed'
  },
  {
    id: 'markdown-preview',
    name: 'Markdown Editor',
    icon: '👁️',
    description: 'Split-pane Markdown editor with sync scroll and GFM support.',
    path: '/markdown-preview',
    category: 'utils',
    keywords: 'editor, text, html, gfm'
  },
  {
    id: 'log-viewer',
    name: 'Log Viewer',
    icon: '📃',
    description: 'Analyze large log files locally with filtering and visualization.',
    path: '/log-viewer',
    category: 'utils',
    keywords: 'analyze, search, filter, virtual'
  },
  {
    id: 'case-converter',
    name: 'Text Case Converter',
    icon: 'Aa',
    description: 'Convert text case (camel, snake, etc).',
    path: '/case-converter',
    category: 'formatters',
    keywords: 'string, transform'
  },
  {
    id: 'code-minifier',
    name: 'Code Minifier',
    icon: '📦',
    description: 'Minify JS, CSS, and HTML code.',
    path: '/code-minifier',
    category: 'formatters',
    keywords: 'compress, optimize'
  },
  {
    id: 'image-converter',
    name: 'Image Converter',
    icon: '🖼️',
    description: 'Convert and resize images locally.',
    path: '/image-converter',
    category: 'formatters',
    keywords: 'png, jpg, webp, resize'
  },
  {
    id: 'css-gradient',
    name: 'Gradient Generator',
    icon: '🌈',
    description: 'Generate CSS gradients visually.',
    path: '/css-gradient',
    category: 'generators',
    keywords: 'style, design, background'
  },
  {
    id: 'curl-studio',
    name: 'Curl Studio',
    icon: '🐚',
    description: 'Parse and generate curl commands.',
    path: '/curl-studio',
    category: 'utils',
    keywords: 'curl, api, request, bash',
    tip: 'Paste a curl command to edit headers, body, and method visually — or build one from scratch'
  },
  {
    id: 'log-masker',
    name: 'Log Masker',
    icon: '🎭',
    description: 'Redact PII from logs locally.',
    path: '/log-masker',
    category: 'security',
    keywords: 'privacy, pii, redact, scrubbing',
    tip: 'Automatically detect and redact emails, IPs, credit cards, and other PII from log text'
  },
  {
    id: 'mermaid-studio',
    name: 'Mermaid Studio',
    icon: '🧜‍♀️',
    description: 'Live Mermaid.js diagram editor.',
    path: '/mermaid-studio',
    category: 'utils',
    keywords: 'diagram, flowchart, sequence, visualization'
  },
  {
    id: 'json-schema-studio',
    name: 'JSON Schema Studio',
    icon: '📋',
    description: 'Generate JSON Schema from JSON.',
    path: '/json-schema-studio',
    category: 'utils',
    keywords: 'schema, validation, documentation'
  },
  {
    id: 'caffeniate',
    name: 'Caffeniate',
    icon: '☕',
    description: 'Keep your device screen awake using the Wake Lock API.',
    path: '/caffeniate',
    category: 'utils',
    keywords: 'wake lock, screen, awake, sleep, caffeinate'
  },
  {
    id: 'email-analyzer',
    name: 'Email Security Analyzer',
    icon: '📧',
    description: 'Analyze raw emails for SPF/DKIM/DMARC, routing hops, and embedded URLs.',
    path: '/email-analyzer',
    category: 'security',
    keywords: 'email, headers, dkim, spf, dmarc, phishing, soc'
  },
  {
    id: 'token-counter',
    name: 'Token Counter & Cost Estimator',
    icon: '🧮',
    description: 'Estimate tokens for GPT/Claude/Llama and calculate cost with your pricing.',
    path: '/token-counter',
    category: 'utils',
    keywords: 'llm, tokens, pricing, estimate, cost'
  },
  {
    id: 'prompt-template-builder',
    name: 'Prompt Template Builder',
    icon: '🧩',
    description: 'Generate reusable prompt templates with placeholders and guardrails.',
    path: '/prompt-template-builder',
    category: 'utils',
    keywords: 'prompt, template, gpt, claude, llama, system, user'
  },
  {
    id: 'sql-formatter',
    name: 'SQL Formatter & Validator',
    icon: '🗄️',
    description: 'Format SQL and catch common syntax issues (Postgres/MySQL-friendly).',
    path: '/sql-formatter',
    category: 'formatters',
    keywords: 'sql, postgres, mysql, lint, beautify'
  },
  {
    id: 'env-var-manager',
    name: 'Env Var Manager',
    icon: '🧪',
    description: 'Diff .env files across environments and mask secrets for sharing.',
    path: '/env-var-manager',
    category: 'security',
    keywords: 'dotenv, env, config, diff, secret, masking'
  },
  {
    id: 'svg-optimizer',
    name: 'SVG Optimizer & Editor',
    icon: '✍️',
    description: 'Sanitize, preview, optimize, and recolor SVG icons.',
    path: '/svg-optimizer',
    category: 'formatters',
    keywords: 'svg, optimize, minify, icon, fill, stroke, preview'
  },
  {
    id: 'csp-builder',
    name: 'CSP Header Builder',
    icon: '🧱',
    description: 'Interactive Content-Security-Policy builder with directive explanations.',
    path: '/csp-builder',
    category: 'security',
    keywords: 'csp, content-security-policy, header, nonce, security'
  },
  {
    id: 'secret-scanner',
    name: 'Secret Scanner',
    icon: '🔎',
    description: 'Detect leaked API keys/tokens/passwords and generate a redacted copy.',
    path: '/secret-scanner',
    category: 'security',
    keywords: 'api key, token, password, leak, redact, secrets'
  },
  {
    id: 'ladder-game',
    name: 'Ladder Game',
    icon: '🪜',
    description: 'Classic ghost leg ladder game for random matching and decision making.',
    path: '/ladder-game',
    category: 'game',
    keywords: 'ghost leg, random, match, pick, amidakuji, decision',
    badge: 'NEW'
  },
  {
    id: 'roulette-wheel',
    name: 'Roulette Wheel',
    icon: '🎡',
    description: 'Spin the wheel for fair random picks with real-time statistics.',
    path: '/roulette-wheel',
    category: 'game',
    keywords: 'spin, random, picker, wheel, decision, fair, statistics',
    badge: 'NEW'
  },
  {
    id: 'marble-roulette',
    name: 'Marble Roulette',
    icon: '🎱',
    description: 'Drop marbles through pegs for a physics-based lucky draw.',
    path: '/marble-roulette',
    category: 'game',
    keywords: 'marble, physics, drop, lucky draw, pachinko, galton, random',
    badge: 'NEW'
  }
];
