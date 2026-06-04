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
    keywords: 'lint, validator, beautify',
    relatedTools: ['json-schema-studio', 'yaml-toml-converter', 'token-studio', 'text-diff']
  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    icon: '🔑',
    description: 'Generate standard UUIDs (v1, v4).',
    path: '/uuid-generator',
    category: 'generators',
    keywords: 'guid, identifier, unique',
    relatedTools: ['password-generator', 'mock-data-generator', 'encoding-workbench']
  },
  {
    id: 'password-generator',
    name: 'Password Generator',
    icon: '🔐',
    description: 'Create secure, random passwords.',
    path: '/password-generator',
    category: 'security',
    keywords: 'random, secure, strong',
    relatedTools: ['encoding-workbench', 'htpasswd-generator', 'ssh-key-generator', 'secret-scanner']
  },
  {
    id: 'cidr-calculator',
    name: 'IP Subnet Planner',
    icon: '🕸️',
    description: 'Calculate IPv4/IPv6 subnets and ranges.',
    path: '/cidr-calculator',
    category: 'network',
    keywords: 'ip, subnet, mask, network, binary, hex, integer, ptr, reverse dns, ipv6 mapped, format conversion',
    tip: 'Enter a CIDR like 10.0.0.0/24 to see network range, broadcast address, and available hosts',
    relatedTools: ['curl-studio', 'user-agent-decoder', 'csp-builder', 'dns-reference']
  },
  {
    id: 'dns-reference',
    name: 'DNS Record Reference',
    icon: '📇',
    description: 'Interactive reference for DNS record types with syntax, examples, and command builders.',
    path: '/dns-reference',
    category: 'network',
    keywords: 'dns, record, dig, nslookup, domain, resolver',
    tip: 'Comprehensive DNS reference — click any record type to see syntax, examples, TTL recommendations, and generate dig/nslookup commands',
    relatedTools: ['cidr-calculator', 'curl-studio', 'email-analyzer', 'csp-builder']
  },
  {
    id: 'port-reference',
    name: 'Port Reference',
    icon: '🌐',
    description: 'Searchable IANA port database with security risk levels and protocol filters.',
    path: '/port-reference',
    category: 'network',
    keywords: 'port, iana, tcp, udp, service, socket, well-known',
    tip: 'Search ports by number or service name — includes 100+ well-known and registered ports with security risk ratings',
    relatedTools: ['cidr-calculator', 'curl-studio', 'dns-reference', 'csp-builder']
  },
  {
    id: 'http-status-reference',
    name: 'HTTP Status Reference',
    icon: '📡',
    description: 'Search HTTP status codes with usage, safety, idempotency, and cacheability guidance.',
    path: '/http-status-reference',
    category: 'network',
    keywords: 'http, status, response, rfc 9110, cache, idempotent, rest, api',
    tip: 'Search HTTP status codes by code, class, phrase, or when-to-use guidance',
    relatedTools: ['curl-studio', 'protocol-headers', 'dns-reference', 'port-reference']
  },
  {
    id: 'bandwidth-calculator',
    name: 'Bandwidth Calculator',
    icon: '📊',
    description: 'Calculate transfer times, bandwidth needs, and TCP overhead.',
    path: '/bandwidth-calculator',
    category: 'network',
    keywords: 'transfer, throughput, speed, bdp, tcp, latency',
    tip: 'Calculate transfer time, required bandwidth, data capacity, and TCP bandwidth-delay product',
    relatedTools: ['cidr-calculator', 'curl-studio', 'user-agent-decoder']
  },
  {
    id: 'webhook-debugger',
    name: 'Webhook Debugger',
    icon: '🪝',
    description: 'Capture, inspect, and replay webhook payloads locally in your browser.',
    path: '/webhook-debugger',
    category: 'network',
    keywords: 'webhook, hmac, signature, stripe, github webhook, payload, inspect, capture, replay',
    tip: 'Inspect incoming webhook payloads — headers, body, HMAC signature verification, and replay as cURL',
    relatedTools: ['curl-studio', 'json-formatter', 'log-viewer']
  },
  {
    id: 'wireguard-config',
    name: 'WireGuard Config Studio',
    icon: '🔒',
    description: 'Generate WireGuard configurations with local key generation and QR export.',
    path: '/wireguard-config',
    category: 'network',
    keywords: 'wireguard, vpn, config, keys, qr, wireguard.conf',
    tip: 'Generate WireGuard configs with client-side key generation, templates for common topologies, and QR code export',
    relatedTools: ['cidr-calculator', 'curl-studio', 'dns-reference', 'certificate-decoder']
  },
  {
    id: 'wireshark-filter',
    name: 'Wireshark Filter Builder',
    icon: '🦈',
    description: 'Build Wireshark display filters and BPF capture expressions visually.',
    path: '/wireshark-filter',
    category: 'network',
    keywords: 'wireshark, pcap, bpf, display filter, capture, packet analysis',
    tip: 'Create complex Wireshark filters without memorizing syntax — supports display filters and BPF capture filters',
    relatedTools: ['cidr-calculator', 'curl-studio', 'dns-reference', 'port-reference']
  },
  {
    id: 'protocol-headers',
    name: 'Protocol Header Visualizer',
    icon: '📡',
    description: 'Interactive bit-level diagrams for Ethernet, IPv4, IPv6, TCP, UDP, ICMP, and ARP.',
    path: '/protocol-headers',
    category: 'network',
    keywords: 'ethernet, ipv4, ipv6, tcp, udp, icmp, arp, packet, rfc, binary',
    tip: 'Visualize network protocol headers with interactive bit-level diagrams — click fields for detailed info',
    relatedTools: ['wireshark-filter', 'cidr-calculator', 'curl-studio', 'dns-reference']
  },
  {
    id: 'text-diff',
    name: 'Text Diff',
    icon: '📝',
    description: 'Compare two text files for differences.',
    path: '/text-diff',
    category: 'utils',
    keywords: 'compare, changes, delta',
    relatedTools: ['json-formatter', 'code-minifier', 'env-var-manager', 'markdown-editor']
  },
  {
    id: 'regex-visualizer',
    name: 'Regex Studio',
    icon: '🧩',
    description: 'Visualize, explain, and test regular expressions with real-time diagrams.',
    path: '/regex-visualizer',
    category: 'utils',
    keywords: 'pattern, match, test, railroad',
    tip: 'See railroad diagrams, token-by-token explanations, and live match highlighting for any regex',
    relatedTools: ['text-diff', 'case-converter', 'log-viewer', 'code-minifier']
  },
  {
    id: 'cron-builder',
    name: 'Cron Builder',
    icon: '⏰',
    description: 'Visual cron editor with human-readable descriptions and next-run preview.',
    path: '/cron-builder',
    category: 'utils',
    keywords: 'schedule, time, expression, crontab',
    tip: 'Build cron expressions with dropdowns — see plain English descriptions and the next 5 run times',
    relatedTools: ['timestamp-converter', 'curl-studio', 'token-counter']
  },
  {
    id: 'ssh-key-generator',
    name: 'SSH Key Generator',
    icon: '🗝️',
    description: 'Generate RSA and ECDSA SSH keys.',
    path: '/ssh-key-generator',
    category: 'security',
    keywords: 'openssh, pem, public key',
    relatedTools: ['certificate-decoder', 'password-generator', 'token-studio', 'htpasswd-generator']
  },
  {
    id: 'certificate-decoder',
    name: 'X.509 Certificate Inspector',
    icon: '📜',
    description: 'Parse X.509 certificates and CSRs.',
    path: '/certificate-decoder',
    category: 'security',
    keywords: 'ssl, tls, pem, x509',
    tip: 'Paste a PEM certificate to see issuer, subject, validity dates, SANs, and key details',
    relatedTools: ['ssh-key-generator', 'token-studio', 'saml-decoder', 'csp-builder']
  },
  {
    id: 'token-studio',
    name: 'Token Cryptography Suite',
    icon: '🔐',
    description: 'Inspect, generate, and manage JWT tokens and cryptographic keys.',
    path: '/token-studio',
    category: 'security',
    keywords: 'jwt, jwk, jwks, token, auth, jose, oidc, rsa, ec, sign, verify, kid, thumbprint',
    tip: 'All-in-one JWT inspect/generate, JWK key management, and JWKS endpoint simulation',
    badge: 'NEW',
    relatedTools: ['certificate-decoder', 'saml-decoder', 'ssh-key-generator', 'encoding-workbench']
  },
  {
    id: 'encoding-workbench',
    name: 'Encoding & Decoding Workbench',
    icon: '🔓',
    description: 'Encode, decode, hash, and identify data transformations.',
    path: '/encoding-workbench',
    category: 'security',
    keywords: 'base64, hex, url, html, hash, md5, sha, bcrypt, decode, encode, identify',
    tip: 'Auto-detect encoding layers, hash with all algorithms, identify unknown hashes',
    badge: 'NEW',
    relatedTools: ['token-studio', 'certificate-decoder', 'json-formatter', 'secret-scanner']
  },
  {
    id: 'saml-decoder',
    name: 'SAML Inspector',
    icon: '🛡️',
    description: 'Decode SAML requests and responses.',
    path: '/saml-decoder',
    category: 'security',
    keywords: 'sso, xml, assertion',
    tip: 'Decode Base64-encoded SAML requests and responses into readable XML for SSO debugging',
    relatedTools: ['token-studio', 'certificate-decoder', 'encoding-workbench', 'email-analyzer']
  },
  {
    id: 'oauth-debugger',
    name: 'OAuth 2.0 / PKCE Debugger',
    icon: '🔑',
    description: 'Generate PKCE challenges, visualize OAuth flows, and analyze security.',
    path: '/oauth-debugger',
    category: 'security',
    keywords: 'oauth, pkce, authorization, code, flow, openid, oidc, implicit, token',
    tip: 'Generate PKCE code verifier/challenge pairs and check OAuth configuration security',
    badge: 'NEW',
    relatedTools: ['token-studio', 'saml-decoder', 'certificate-decoder', 'csp-builder']
  },
  {
    id: 'user-agent-decoder',
    name: 'User-Agent Parser',
    icon: '🕵️',
    description: 'Parse and analyze User-Agent strings.',
    path: '/user-agent-decoder',
    category: 'network',
    keywords: 'browser, os, device',
    relatedTools: ['curl-studio', 'cidr-calculator', 'log-viewer', 'email-analyzer']
  },
  {
    id: 'qr-code',
    name: 'QR Code Studio',
    icon: '📱',
    description: 'Generate QR codes for URLs and text.',
    path: '/qr-code',
    category: 'generators',
    keywords: '2d, barcode, scan',
    relatedTools: ['image-converter', 'uuid-generator', 'color-converter']
  },
  {
    id: 'timestamp-converter',
    name: 'Timestamp Converter',
    icon: '⏳',
    description: 'Convert Unix timestamps to human dates.',
    path: '/timestamp-converter',
    category: 'formatters',
    keywords: 'epoch, time, date',
    relatedTools: ['cron-builder', 'unit-converter', 'json-formatter']
  },
  {
    id: 'color-converter',
    name: 'Color Converter',
    icon: '🎨',
    description: 'Convert HEX, RGB, and HSL colors.',
    path: '/color-converter',
    category: 'formatters',
    keywords: 'picker, palette, css',
    relatedTools: ['css-gradient', 'svg-optimizer', 'image-converter', 'unit-converter']
  },
  {
    id: 'unit-converter',
    name: 'Unit Converter',
    icon: '⚖️',
    description: 'Convert length, weight, and more.',
    path: '/unit-converter',
    category: 'formatters',
    keywords: 'measure, metric, imperial',
    relatedTools: ['timestamp-converter', 'color-converter', 'case-converter']
  },
  {
    id: 'yaml-toml-converter',
    name: 'Config Converter',
    icon: '⚙️',
    description: 'Convert between YAML, TOML, and JSON.',
    path: '/yaml-toml-converter',
    category: 'formatters',
    keywords: 'config, serialization',
    relatedTools: ['json-formatter', 'json-schema-studio', 'env-var-manager', 'code-minifier']
  },
  {
    id: 'htpasswd-generator',
    name: 'Htpasswd Entry Generator',
    icon: '🔒',
    description: 'Generate apache htpasswd entries.',
    path: '/htpasswd-generator',
    category: 'security',
    keywords: 'apache, basic auth',
    tip: 'Create Apache htpasswd entries with bcrypt, SHA-1, or MD5 for HTTP Basic Auth',
    relatedTools: ['password-generator', 'encoding-workbench', 'csp-builder', 'ssh-key-generator']
  },
  {
    id: 'mock-data-generator',
    name: 'Mock Data Generator',
    icon: '📊',
    description: 'Generate random JSON/CSV data.',
    path: '/mock-data-generator',
    category: 'generators',
    keywords: 'fake, dummy, seed',
    relatedTools: ['json-formatter', 'json-schema-studio', 'uuid-generator', 'sql-formatter']
  },
  {
    id: 'markdown-editor',
    name: 'Markdown Editor',
    icon: '👁️',
    description: 'Split-pane Markdown editor with sync scroll and GFM support.',
    path: '/markdown-editor',
    category: 'utils',
    keywords: 'editor, text, html, gfm',
    relatedTools: ['text-diff', 'mermaid-studio', 'code-minifier', 'case-converter']
  },
  {
    id: 'log-viewer',
    name: 'Log Viewer',
    icon: '📃',
    description: 'Analyze large log files locally with filtering and visualization.',
    path: '/log-viewer',
    category: 'utils',
    keywords: 'analyze, search, filter, virtual',
    relatedTools: ['log-masker', 'regex-visualizer', 'text-diff', 'email-analyzer']
  },
  {
    id: 'case-converter',
    name: 'Text Case Converter',
    icon: 'Aa',
    description: 'Convert text case (camel, snake, etc).',
    path: '/case-converter',
    category: 'formatters',
    keywords: 'string, transform',
    relatedTools: ['regex-visualizer', 'text-diff', 'code-minifier', 'markdown-editor']
  },
  {
    id: 'code-minifier',
    name: 'Code Minifier',
    icon: '📦',
    description: 'Minify JS, CSS, and HTML code.',
    path: '/code-minifier',
    category: 'formatters',
    keywords: 'compress, optimize',
    relatedTools: ['json-formatter', 'svg-optimizer', 'sql-formatter', 'css-gradient']
  },
  {
    id: 'image-converter',
    name: 'Image Converter',
    icon: '🖼️',
    description: 'Convert and resize images locally.',
    path: '/image-converter',
    category: 'formatters',
    keywords: 'png, jpg, webp, resize',
    relatedTools: ['svg-optimizer', 'qr-code', 'color-converter', 'css-gradient']
  },
  {
    id: 'css-gradient',
    name: 'Gradient Generator',
    icon: '🌈',
    description: 'Generate CSS gradients visually.',
    path: '/css-gradient',
    category: 'generators',
    keywords: 'style, design, background',
    relatedTools: ['color-converter', 'svg-optimizer', 'code-minifier', 'image-converter']
  },
  {
    id: 'curl-studio',
    name: 'Curl Studio',
    icon: '🐚',
    description: 'Parse and generate curl commands.',
    path: '/curl-studio',
    category: 'utils',
    keywords: 'curl, api, request, bash',
    tip: 'Paste a curl command to edit headers, body, and method visually — or build one from scratch',
    relatedTools: ['json-formatter', 'user-agent-decoder', 'csp-builder', 'cidr-calculator']
  },
  {
    id: 'log-masker',
    name: 'Log Masker',
    icon: '🎭',
    description: 'Redact PII from logs locally.',
    path: '/log-masker',
    category: 'security',
    keywords: 'privacy, pii, redact, scrubbing',
    tip: 'Automatically detect and redact emails, IPs, credit cards, and other PII from log text',
    relatedTools: ['log-viewer', 'secret-scanner', 'env-var-manager', 'email-analyzer']
  },
  {
    id: 'mermaid-studio',
    name: 'Mermaid Studio',
    icon: '🧜‍♀️',
    description: 'Live Mermaid.js diagram editor.',
    path: '/mermaid-studio',
    category: 'utils',
    keywords: 'diagram, flowchart, sequence, visualization',
    relatedTools: ['markdown-editor', 'svg-optimizer', 'json-schema-studio', 'mock-data-generator']
  },
  {
    id: 'json-schema-studio',
    name: 'JSON Schema Studio',
    icon: '📋',
    description: 'Generate JSON Schema from JSON.',
    path: '/json-schema-studio',
    category: 'utils',
    keywords: 'schema, validation, documentation',
    relatedTools: ['json-formatter', 'yaml-toml-converter', 'mock-data-generator', 'sql-formatter']
  },
  {
    id: 'caffeinate',
    name: 'Caffeinate',
    icon: '☕',
    description: 'Keep your device screen awake using the Wake Lock API.',
    path: '/caffeinate',
    category: 'utils',
    keywords: 'wake lock, screen, awake, sleep, caffeinate',
    relatedTools: ['timestamp-converter', 'cron-builder', 'token-counter']
  },
  {
    id: 'email-analyzer',
    name: 'Email Security Analyzer',
    icon: '📧',
    description: 'Analyze raw emails for SPF/DKIM/DMARC, routing hops, and embedded URLs.',
    path: '/email-analyzer',
    category: 'security',
    keywords: 'email, headers, dkim, spf, dmarc, phishing, soc',
    relatedTools: ['saml-decoder', 'log-masker', 'secret-scanner', 'user-agent-decoder']
  },
  {
    id: 'token-counter',
    name: 'Token Counter & Cost Estimator',
    icon: '🧮',
    description: 'Estimate tokens for GPT/Claude/Llama and calculate cost with your pricing.',
    path: '/token-counter',
    category: 'utils',
    keywords: 'llm, tokens, pricing, estimate, cost',
    relatedTools: ['prompt-template-builder', 'json-formatter', 'code-minifier', 'text-diff']
  },
  {
    id: 'prompt-template-builder',
    name: 'Prompt Template Builder',
    icon: '🧩',
    description: 'Generate reusable prompt templates with placeholders and guardrails.',
    path: '/prompt-template-builder',
    category: 'utils',
    keywords: 'prompt, template, gpt, claude, llama, system, user',
    relatedTools: ['token-counter', 'markdown-editor', 'json-formatter', 'mock-data-generator']
  },
  {
    id: 'sql-formatter',
    name: 'SQL Formatter & Validator',
    icon: '🗄️',
    description: 'Format SQL and catch common syntax issues (Postgres/MySQL-friendly).',
    path: '/sql-formatter',
    category: 'formatters',
    keywords: 'sql, postgres, mysql, lint, beautify',
    relatedTools: ['json-formatter', 'code-minifier', 'mock-data-generator', 'yaml-toml-converter']
  },
  {
    id: 'env-var-manager',
    name: 'Env Var Manager',
    icon: '🧪',
    description: 'Diff .env files across environments and mask secrets for sharing.',
    path: '/env-var-manager',
    category: 'security',
    keywords: 'dotenv, env, config, diff, secret, masking',
    relatedTools: ['secret-scanner', 'log-masker', 'text-diff', 'yaml-toml-converter']
  },
  {
    id: 'svg-optimizer',
    name: 'SVG Optimizer & Editor',
    icon: '✍️',
    description: 'Sanitize, preview, optimize, and recolor SVG icons.',
    path: '/svg-optimizer',
    category: 'formatters',
    keywords: 'svg, optimize, minify, icon, fill, stroke, preview',
    relatedTools: ['image-converter', 'color-converter', 'code-minifier', 'css-gradient']
  },
  {
    id: 'csp-builder',
    name: 'CSP Header Builder',
    icon: '🧱',
    description: 'Interactive Content-Security-Policy builder with directive explanations.',
    path: '/csp-builder',
    category: 'security',
    keywords: 'csp, content-security-policy, header, nonce, security',
    relatedTools: ['curl-studio', 'certificate-decoder', 'email-analyzer', 'htpasswd-generator']
  },
  {
    id: 'secret-scanner',
    name: 'Secret Scanner',
    icon: '🔎',
    description: 'Detect leaked API keys/tokens/passwords and generate a redacted copy.',
    path: '/secret-scanner',
    category: 'security',
    keywords: 'api key, token, password, leak, redact, secrets',
    relatedTools: ['log-masker', 'env-var-manager', 'password-generator', 'email-analyzer']
  },
  {
    id: 'pipe',
    name: 'Pipe Mode',
    icon: '⛓',
    description: 'Chain tools together. Your data never leaves your browser.',
    path: '/pipe',
    category: 'utils',
    keywords: 'chain, pipeline, tools, beta',
    badge: 'BETA',
    relatedTools: ['case-converter', 'json-formatter', 'encoding-workbench', 'text-diff']
  },
  {
    id: 'changelog',
    name: 'Changelog',
    icon: '📋',
    description: 'Release history and recent changes to SimpleTool.',
    path: '/changelog',
    category: 'utils',
    keywords: 'releases, updates, changes, version history',
    relatedTools: ['token-counter', 'markdown-editor', 'json-formatter']
  },
  {
    id: 'github-issue-planner',
    name: 'GitHub Issue / Kanban Automation Planner',
    icon: '📋',
    description: 'Categorize open issues and generate automation prompts for trac3r00 backlogs.',
    path: '/github-issue-planner',
    category: 'utils',
    keywords: 'github, issue, kanban, trac3r00, backlog, automation, planner, project',
    relatedTools: ['cron-builder', 'markdown-editor', 'prompt-template-builder']
  },
  {
    id: 'ladder-game',
    name: 'Ladder Game',
    icon: '🪜',
    description: 'Classic ghost leg ladder game for random matching and decision making.',
    path: '/ladder-game',
    category: 'game',
    keywords: 'ghost leg, random, match, pick, amidakuji, decision',
    hiddenInProduction: true,
    badge: 'NEW',
    relatedTools: ['roulette-wheel', 'marble-roulette', 'password-generator']
  },
  {
    id: 'roulette-wheel',
    name: 'Roulette Wheel',
    icon: '🎡',
    description: 'Spin the wheel for fair random picks with real-time statistics.',
    path: '/roulette-wheel',
    category: 'game',
    keywords: 'spin, random, picker, wheel, decision, fair, statistics',
    hiddenInProduction: true,
    badge: 'NEW',
    relatedTools: ['ladder-game', 'marble-roulette', 'mock-data-generator']
  },
  {
    id: 'marble-roulette',
    name: 'Marble Roulette',
    icon: '🎱',
    description: 'Drop marbles through pegs for a physics-based lucky draw.',
    path: '/marble-roulette',
    category: 'game',
    keywords: 'marble, physics, drop, lucky draw, pachinko, galton, random',
    hiddenInProduction: true,
    badge: 'NEW',
    relatedTools: ['ladder-game', 'roulette-wheel', 'mock-data-generator']
  }
];

export const CATEGORIES = {
  formatters: { title: 'Formatters & Converters', icon: '🔄' },
  security: { title: 'Security & Crypto', icon: '🛡️' },
  network: { title: 'Network & Web', icon: '🌐' },
  generators: { title: 'Generators', icon: '⚡' },
  game: { title: 'Games & Fun', icon: '🎮' },
  utils: { title: 'Utilities', icon: '🛠️' }
};

export function getToolsForEnvironment(isDev = false) {
  if (isDev) return TOOLS;
  return TOOLS.filter((tool) => !tool.hiddenInProduction);
}
