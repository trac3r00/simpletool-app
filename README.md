# SimpleTool App - Unified Cloudflare Worker

> **Privacy-focused, ad-supported web tools running entirely in your browser**
> Client-side processing | Free to use | Ads help fund maintenance

---

## Overview

SimpleTool App is a collection of free, privacy-focused web utilities that run entirely client-side. All computations happen in your browser—we never see, collect, or store your data.

### Available Tools

#### Power-User Essentials
- **📊 Log Viewer** - Analyze large log files locally with filtering and visualization
- **#️⃣ Hash Calculator** - Compute SHA256, MD5, and other hashes
- **📦 Code Minifier** - Minify JS, CSS, and HTML code
- **📝 Text Diff** - Compare two text files for differences
- **📜 X.509 Certificate Inspector** - Parse X.509 certificates and CSRs
- **🕸️ IP Subnet Planner** - Calculate IPv4/IPv6 subnets and ranges
- **🛡️ SAML Inspector** - Decode SAML requests and responses
- **🔮 Layered Decoder** - Auto-detect and unwrap layered encodings (Base64, URL, Hex, and more)
- **🗝️ SSH Key Generator** - Generate RSA and ECDSA SSH keys
- **🕵️ User-Agent Parser** - Parse and analyze User-Agent strings
- **🐚 Curl Studio** - Parse and generate curl commands
- **🎭 Log Masker** - Redact PII from logs locally
- **🧜‍♀️ Mermaid Studio** - Live Mermaid.js diagram editor
- **📋 JSON Schema Studio** - Generate JSON Schema from JSON

#### Privacy-First Tools
- **🔐 Password Generator** - Create secure, random passwords
- **📋 JSON Formatter** - Validate, format, and minify JSON data
- **📱 QR Code Studio** - Generate QR codes for URLs and text
- **🧩 Regex Studio** - Visualize, explain, and test regular expressions with real-time diagrams
- **🔑 UUID Generator** - Generate standard UUIDs (v1, v4)
- **⏳ Timestamp Converter** - Convert Unix timestamps to human dates
- **🎨 Color Converter** - Convert HEX, RGB, and HSL colors
- **👁️ Markdown Editor** - Split-pane Markdown editor with sync scroll and GFM support
- **Aa Text Case Converter** - Convert text case (camel, snake, etc)
- **🔒 Htpasswd Entry Generator** - Generate apache htpasswd entries
- **⚙️ Config Converter** - Convert between YAML, TOML, and JSON
- **⏰ Cron Builder** - Visual cron editor with human-readable descriptions and next-run preview
- **📊 Mock Data Generator** - Generate random JSON/CSV data
- **🖼️ Image Converter** - Convert and resize images locally
- **🌈 Gradient Generator** - Generate CSS gradients visually
- **⚖️ Unit Converter** - Convert length, weight, and more

---

## Features

### 🔒 Privacy First
- **Client-side processing** - Tool inputs stay in your browser
- **No accounts** - Use everything without signing up
- **No first-party analytics** - We don't run our own tracking pixels
- **Minimal storage** - Theme toggles are session-only
- **Ad-supported** - Third-party ads may use cookies or similar tech
- **GDPR/CCPA mindful** - Tool inputs aren't processed server-side

### 🛡️ Security
- **Cryptographically secure** - Uses `crypto.getRandomValues()` for true randomness
- **Privacy-by-design** - Architecture designed with SOC 2 principles in mind
- **Worker-level rate limiting** - Cloudflare edge enforces 120 req/min per IP to protect access to the worker while all tool processing remains 100% client-side
- **HTTPS only** - All connections encrypted (TLS 1.3+)

> **Note on Compliance:** While this tool is designed with privacy principles similar to SOC 2 controls, "SOC-II aligned" refers to architectural design choices, not formal certification. No formal SOC 2 audit has been conducted. For organizational compliance requirements, consult your security team. Ad partners and hosting providers have their own privacy policies.

### 🎨 Modern Design
- **Bundled Tailwind CSS** - Clean, modern interface served directly from the worker (no external CDN dependency)
- **Dark mode** - Automatic or manual theme switching with fixed tab visibility
- **Responsive** - Works on mobile, tablet, and desktop
- **Accessible** - WCAG compliant
- **Universal Components** - Shared navigation, theme management, and UI utilities

---

## Project Structure

```
cloudflare-worker/
├── wrangler.toml              # Cloudflare Worker configuration
├── package.json               # Dependencies and scripts
├── README.md                  # This file
└── src/
    ├── worker.js              # Main worker entry point & routing
    ├── routes/                # Individual tool route handlers
    │   ├── caffeniate.js      # Caffeniate tool
    │   ├── password-generator.js  # Password generator (client-side only)
    │   ├── hash-calculator.js # Hash calculator with file upload support
    │   └── log-viewer.js      # Enterprise log viewer with parsing
    ├── ui/                    # UI rendering modules
    │   ├── home.js            # Home page renderer
    │   └── legal-pages.js     # Terms, Privacy, About, Contact pages
    ├── services/              # Business logic (client-side helpers)
    │   ├── generators.js      # Password/username/passphrase generators
    │   ├── cyberchef.js       # CyberChef text operations
    │   └── qr.js              # QR code generation
    └── utils/                 # Utility functions
        ├── security.js        # Rate limiting & security headers
        ├── respond.js         # Response helpers
        └── common-ui.js       # Universal UI components & styling
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (for deployment)
- Wrangler CLI: `npm install -g wrangler`

### Installation

```bash
# Navigate to the worker directory
cd cloudflare-worker

# Install dependencies
npm install

# Login to Cloudflare
wrangler login
```

### Development

```bash
# Run locally with hot reload
npm run dev

# Visit http://localhost:8787
```

### Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

**Configure custom domain in Cloudflare Dashboard:**
1. Go to Workers & Pages
2. Select your worker
3. Add custom domain (e.g., `simpletool.app`)

### Configuration

- `ADSENSE_CLIENT`: AdSense publisher ID (e.g., `ca-pub-...`).
- `ADSENSE_SLOT`: Single fallback ad slot ID applied to home/tool/legal slots.
- `ADSENSE_SLOTS`: JSON map for slot IDs (overrides `ADSENSE_SLOT` per key).

Example `ADSENSE_SLOTS`:

```json
{
  "home": "1234567890",
  "tool": "2345678901",
  "legal": "3456789012"
}
```

---

## Available Routes

### Pages
| Route | Description |
|-------|-------------|
| `/` | Home page with tool grid |
| `/password-generator` | Create secure, random passwords |
| `/json-formatter` | Validate, format, and minify JSON data |
| `/qr-code` | Generate QR codes for URLs and text |
| `/layered-decoder` | Auto-detect and unwrap layered encodings |
| `/regex-studio` | Visualize, explain, and test regular expressions |
| `/uuid-generator` | Generate standard UUIDs (v1, v4) |
| `/timestamp-converter` | Convert Unix timestamps to human dates |
| `/color-converter` | Convert HEX, RGB, and HSL colors |
| `/markdown-editor` | Split-pane Markdown editor |
| `/text-diff` | Compare two text files for differences |
| `/jwt-inspector` | Inspect and decode JSON Web Tokens |
| `/hash-calculator` | Compute SHA256, MD5, and other hashes |
| `/ip-subnet-planner` | Calculate IPv4/IPv6 subnets and ranges |
| `/x509-certificate-inspector` | Parse X.509 certificates and CSRs |
| `/saml-inspector` | Decode SAML requests and responses |
| `/text-case-converter` | Convert text case (camel, snake, etc) |
| `/htpasswd-entry-generator` | Generate apache htpasswd entries |
| `/config-converter` | Convert between YAML, TOML, and JSON |
| `/cron-builder` | Visual cron editor |
| `/mock-data-generator` | Generate random JSON/CSV data |
| `/log-viewer` | Analyze large log files locally |
| `/user-agent-parser` | Parse and analyze User-Agent strings |
| `/ssh-key-generator` | Generate RSA and ECDSA SSH keys |
| `/image-converter` | Convert and resize images locally |
| `/gradient-generator` | Generate CSS gradients visually |
| `/code-minifier` | Minify JS, CSS, and HTML code |
| `/unit-converter` | Convert length, weight, and more |
| `/curl-studio` | Parse and generate curl commands |
| `/log-masker` | Redact PII from logs locally |
| `/mermaid-studio` | Live Mermaid.js diagram editor |
| `/json-schema-studio` | Generate JSON Schema from JSON |
| `/terms` | Terms of Service |
| `/privacy` | Privacy Policy |
| `/about` | About page |
| `/contact` | Contact information |
| `/security` | Security policy |
| `/careers` | Careers |

**Note:** Legacy routes with the `/tools/` prefix (e.g., `/tools/password-generator`) are supported via 301 redirect for backwards compatibility.

### API Endpoints
| Route | Description |
|-------|-------------|
| `/health` | Health check (JSON) |
| `/robots.txt` | SEO robots file |
| `/.well-known/security.txt` | Security contact info |

**Note:** API endpoints for password generation are disabled. All tools operate client-side for privacy.

## Recent Updates

### What's New in v2.3.0 (2025-12-01)

**New power-user tools**
- **🧪 Magic Universal Decoder** quickly unwraps stacked encodings (Base64, URL, Hex, JWT, HTML entities) and shows provenance for each layer.
- **🧩 RegEx Visualizer** renders railroad-style diagrams, token explanations, and live match previews so complex patterns are easier to audit.
- **🗝️ SSH Key Generator** delivers ECDSA (P-256) and RSA key pairs entirely via Web Crypto with copy/download helpers plus usage playbooks.

**Navigation & verification**
- Home grid, worker routes, and automated tests now include Universal Decoder, Regex Visualizer, SSH Key Generator, and the existing User-Agent Decoder so every tool is one click away.
- Added regression tests to ensure each new endpoint responds with CSP-hardened HTML.

**Documentation clarity**
- README now carries only the latest highlights (full history lives in `CHANGELOG.md`), Accessibility "Expected Metrics" → **Target Metrics**, and the rate-limit note explicitly calls out that throttling happens at the Cloudflare edge while tools remain 100% client-side.
- Modern Design section emphasizes that Tailwind CSS is pre-bundled into the worker—no external CDN dependency.

> Need previous release notes? See [CHANGELOG.md](CHANGELOG.md) for the full history.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and changes.

---

## Privacy Commitment

SimpleTool App respects your privacy:

- **Tool inputs stay local** - We don't store tool inputs or outputs on our servers
- **No accounts** - No login, registration, or user profiles
- **Client-side processing** - Everything runs in your browser using Web Crypto API
- **Minimal storage** - Theme toggle is session-only (no persistent storage)
- **Ad-supported** - Third-party ads may use cookies or similar technologies
- **Limited operational logs** - Cloudflare may log minimal request metadata for security

### Compliance & Transparency

- **Privacy by design** - Tool inputs are not processed server-side
- **Third-party policies** - Cloudflare and AdSense have their own privacy policies
- **No first-party analytics** - We don't run our own tracking pixels

**Important Caveats:**
- **Cloudflare Logging:** When using the hosted version at simpletool.app, Cloudflare may log minimal metadata (IP addresses, timestamps) as part of their edge network. See [Cloudflare's Privacy Policy](https://www.cloudflare.com/privacypolicy/) for details.
- **Advertising:** Google AdSense may use cookies or similar tech to serve and measure ads. You can manage personalization in Google Ads Settings.
- **Browser Storage:** No persistent browser storage is used; theme toggles reset when you leave the page.
- **Clipboard & Extensions:** Data copied to clipboard may be accessible to browser extensions. Be cautious with sensitive information.

### Self-Hosting for Enterprise

For complete control and to eliminate all third-party dependencies, you can self-host this project:
- Deploy to your own infrastructure (Node.js, Docker, or other serverless platforms)
- Full source code available under MIT License
- No external API dependencies
- See [Deployment](#deployment) section for instructions

---

## Technology Stack

- **Runtime:** Cloudflare Workers (serverless edge computing)
- **Frontend:** Vanilla JavaScript + Tailwind CSS
- **Encryption:** Web Crypto API (`crypto.getRandomValues()`, `crypto.subtle.digest()`)
- **Libraries:** QRCode.js, jsQR, Mermaid.js (for diagrams)
- **Architecture:** Universal UI components with shared styling system
- **No frameworks** - Lightweight and fast

---

## Security Features

### Built-in Protections
- **Rate limiting** - 120 requests/minute per IP with deterministic cleanup mechanism
- **Security headers** - CSP with nonce-based script execution, HSTS, X-Frame-Options, X-Content-Type-Options
- **CSP Compliance** - Strict Content Security Policy without `unsafe-inline` (all event handlers use delegation)
- **Input validation** - All inputs sanitized
- **Web Crypto API** - Cryptographically secure randomness (`crypto.getRandomValues()`, `crypto.subtle`)
- **No server-side storage** - Stateless architecture
- **HTTPS enforcement** - All HTTP redirected to HTTPS (TLS 1.3+)
- **Method validation** - Proper HTTP method handling with 405 responses for invalid methods

### Security Best Practices for Users

**When Handling Sensitive Data:**
1. **Use Incognito/Private Mode** - Reduces browser history persistence
2. **Verify HTTPS Connection** - Look for the padlock icon in your browser
3. **Disable Browser Extensions** - Extensions can access page content and clipboard
4. **Clear Clipboard After Use** - Sensitive data may persist in clipboard history
5. **Use Dedicated Browser** - Consider a separate browser profile for sensitive work
6. **Avoid Public WiFi** - Use VPN when accessing tools on untrusted networks

**Algorithm Security Warnings:**
- ⚠️ **MD5 & SHA-1 are DEPRECATED** - Cryptographically broken. See Hash Calculator warnings.
- ✓ Use **SHA-256 or SHA-512** for any security-sensitive operations

### Known Limitations
- **Rate limiting** is IP-based and may not prevent sophisticated distributed attacks
- **No CAPTCHA** - Automated abuse possible (trade-off for privacy)
- **Browser environment** - Client-side code is visible and can be modified by users
- **No server-side validation** - All validation happens client-side

For enterprise deployments requiring enhanced security, consider self-hosting with additional protections (WAF, advanced rate limiting, etc.).

---

## For Enterprises

SimpleTool App is suitable for enterprise use:

- **Compliance-Friendly** - Tool inputs are not stored on our servers
- **Privacy-by-Design** - Architecture designed with SOC 2 principles in mind (not formally certified)
- **GDPR/CCPA Mindful** - Tool inputs aren't processed server-side
- **Zero Trust** - All processing happens client-side
- **Auditable** - Open source, fully transparent
- **No vendor lock-in** - Tools work offline, self-hostable

For enterprise deployments, we recommend self-hosting to eliminate all third-party dependencies and maintain complete control over your infrastructure.

---

## Accessibility Goals & Roadmap

SimpleTool App is actively working toward WCAG 2.1 Level AA compliance. Each release includes automated + manual testing, and we publish remaining gaps so the roadmap stays transparent.

### Accessibility Foundations (Shipped)

**Core safeguards already implemented:**
- **Semantic HTML** - Proper heading hierarchy, landmark regions, and ARIA labels
- **Keyboard Navigation** - All interactive elements accessible via keyboard (Tab, Enter, Space)
- **Screen Reader Support** - ARIA labels, alt text, and descriptive button names
- **Color Contrast** - Targeting WCAG AA contrast ratios (4.5:1 for text, 3:1 for UI components) with dark-mode tweaks in progress
- **Focus Indicators** - Visible focus states on all interactive elements
- **Responsive Design** - Works on all screen sizes and zoom levels (up to 200%)
- **Dark Mode** - High contrast theme option for visual comfort
- **No Time Limits** - Tools never timeout or expire user input
- **Error Identification** - Clear error messages with suggestions for correction

**Shared UX patterns across tools:**
- Consistent navigation and theming
- Predictable UI patterns with mirrored layouts
- Skip-to-content links (planned) and preserved heading order
- Resizable text without loss of functionality

### Current Accessibility Status & Fixes (2025-11-20 update)

- Source: `lighthouse-report.json` (Chrome 142 using `wrangler dev`)
- Previous Scores: Performance 100, Accessibility **77**, Best Practices 100, SEO 100
- Target: Accessibility 90+ for WCAG 2.1 AA compliance

**Recent fixes implemented (v2.3.1):**
- [x] Add an accessible name + `aria-pressed` state to the global theme toggle so screen readers announce it correctly
- [x] Enhanced focus indicators across all interactive elements (4px ring with proper offset)
- [x] Improved dark-mode contrast for UI components to meet ≥3:1 ratio
- [x] Better ARIA labels on navigation and mobile menu toggle
- [x] Tool cards now have proper aria-label attributes
- [x] Enhanced keyboard navigation with aria-expanded states
- [x] Tailwind CSS pre-bundled into worker (no external CDN dependency)

**Remaining improvements:**
- [ ] Further increase contrast for some tool icon headers in dark mode
- [ ] Add skip-to-content link for keyboard users
- [ ] Re-test all tools in Lighthouse and publish updated accessibility scores
- [ ] Implement focus-trap in modal dialogs (if any are added)

### Lighthouse Testing

We recommend using Chrome DevTools Lighthouse for accessibility audits:

**Run Lighthouse Audit:**
```bash
# Open Chrome DevTools (F12)
# Navigate to Lighthouse tab
# Select "Accessibility" category
# Click "Generate report"
```

**Target Metrics:**

> Targets we design toward each release. Actual Lighthouse scores (currently Accessibility 77) are published in the status table above so deltas stay transparent.
```
Performance:     90-100 (static content, client-side processing)
Accessibility:   90-100 (WCAG 2.1 AA compliant)
Best Practices:  90-100 (HTTPS, security headers, no console errors)
SEO:             90-100 (meta tags, semantic HTML, robots.txt)
```

**Command Line Lighthouse:**
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit on deployed site
lighthouse https://simpletool.app --view

# Run audit on specific tool
lighthouse https://simpletool.app/tools/password-generator --view

# Export JSON report
lighthouse https://simpletool.app --output json --output-path ./report.json
```

> See **Current Accessibility Status & Fixes** above for the latest Lighthouse scores and action items we are tracking from each run.

### WCAG 2.1 Coverage Progress

**Level A (maintained each release):**
- Text alternatives for non-text content
- (N/A) No multimedia yet, but captions documented for future additions
- Adaptable content structure with semantic regions
- Distinguishable visual design (color + contrast guardrails)
- Keyboard accessible functionality and logical tab order
- No time limits, no flashing content, predictable navigation
- Input assistance and descriptive error states

**Level AA (validation in progress):**
- Enhanced color contrast rules enforced in light mode, dark-mode updates underway
- Text remains usable at 200% zoom without horizontal scrolling
- Multiple ways to locate content (nav, search soon, keyboard shortcuts planned)
- Headings and labels describe topic/purpose; aria-label coverage audited quarterly
- Focus indicators visible in all interaction states
- Error suggestions provided in high-risk flows (hash verification, uploads)
- Error prevention safeguards for destructive or irreversible actions

### Manual Testing Checklist

**Keyboard Navigation:**
```
1. Tab through all interactive elements
2. Verify focus indicators are visible
3. Test Enter/Space on buttons and controls
4. Ensure no keyboard traps
5. Check tab order is logical
```

**Screen Reader Testing:**
```bash
# macOS VoiceOver
Cmd + F5

# Windows Narrator
Win + Ctrl + Enter

# Test checklist:
- All images have alt text
- Form inputs have labels
- Buttons have descriptive names
- Error messages are announced
- Page structure is clear
```

**Visual Testing:**
```
1. Zoom to 200% - verify no content loss
2. Toggle dark mode - verify contrast
3. Reduce motion (system settings) - verify animations respect preference
4. Test on mobile devices (touch targets ≥ 44x44px)
```

### Accessibility Testing Tools

**Automated Testing:**
- [WAVE Browser Extension](https://wave.webaim.org/extension/) - Visual accessibility testing
- [axe DevTools](https://www.deque.com/axe/devtools/) - Automated WCAG checks
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Google's audit tool
- [Pa11y](https://pa11y.org/) - Command-line accessibility testing

**Manual Testing:**
- macOS VoiceOver (built-in screen reader)
- NVDA (Windows, free screen reader)
- JAWS (Windows, commercial screen reader)
- Browser zoom and text resize
- Keyboard-only navigation

### Continuous Improvement

We continuously improve accessibility through:
- Regular Lighthouse audits before each release
- User feedback from assistive technology users
- Following WCAG 2.1 updates and WCAG 3.0 working drafts
- Testing with actual screen readers and assistive devices

**Report Accessibility Issues:**
If you encounter any accessibility barriers, please email: accessibility@simpletool.app

We aim to respond within 48 hours and resolve issues in the next release cycle.

---

## Adding New Tools

1. **Create route handler** in `src/routes/your-tool.js`
2. **Register the tool** in `src/utils/tool-registry.js`
3. **Add route** to `src/worker.js`
4. **Add tool card** to home page in `src/ui/home.js`
5. **Follow privacy-first principles** - keep processing client-side

See existing tools for examples.

---

## Troubleshooting

### Development Issues

**Port already in use:**
```bash
# Change port in wrangler dev
npx wrangler dev --port 8788
```

**Module not found:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build fails:**
- Ensure Node.js 18+ is installed: `node --version`
- Clear npm cache: `npm cache clean --force`
- Check for syntax errors in JavaScript files

**Wrangler command not found:**
```bash
# Install wrangler globally
npm install -g wrangler
# Or use npx
npx wrangler --version
```

### Deployment Issues

**Login fails:**
```bash
# Logout and login again
npx wrangler logout
npx wrangler login
```

**Custom domain not working:**
1. Check DNS settings in Cloudflare dashboard
2. Ensure CNAME record points to `<your-worker>.workers.dev`
3. Wait 5-10 minutes for DNS propagation
4. Verify SSL/TLS encryption mode is "Full" or "Full (strict)"

**404 errors after deployment:**
- Verify routes in `wrangler.toml` match your code
- Check that route patterns use wildcards correctly: `*simpletool.app/*`
- Ensure worker is deployed to correct zone

**Worker exceeds CPU time limits:**
- Cloudflare Workers have a 10ms CPU time limit (free plan) or 50ms (paid)
- Large file processing should use streams or chunking
- Consider using Web Workers for heavy computations
- Profile your code to find bottlenecks

**KV namespace errors:**
```bash
# List KV namespaces
npx wrangler kv:namespace list

# Create new namespace
npx wrangler kv:namespace create "MY_NAMESPACE"

# Add binding to wrangler.toml
```

**CORS errors:**
- Ensure security headers in `src/utils/security.js` include proper CORS headers
- Check `Access-Control-Allow-Origin` header configuration
- Verify preflight OPTIONS requests are handled

**Rate limiting triggering for legitimate users:**
- Increase rate limit in `src/utils/security.js`
- Implement more sophisticated rate limiting (e.g., tiered limits)
- Consider using Cloudflare's built-in rate limiting rules

**Large file uploads failing:**
- Cloudflare Workers have a 100MB request body limit (paid plan)
- Free plan has lower limits (~10MB)
- For larger files, consider chunked uploads or direct browser processing
- All current tools (Hash Calculator, Log Viewer) process files client-side to avoid this limit

**Memory limit exceeded:**
- Workers have 128MB memory limit
- Avoid loading entire large files into memory
- Use streaming where possible
- Process data in chunks

### Common Errors & Solutions

**Error: "no such file or directory"**
- Check file paths are correct
- Ensure imports use correct relative paths
- Verify file exists in repository

**Error: "Module is not defined"**
- Use ES modules syntax (`import`/`export`) instead of CommonJS
- Ensure `type: "javascript"` in `wrangler.toml`

**Error: "Bindings are not available"**
- Check `wrangler.toml` for correct binding configuration
- Ensure environment variables are set in Cloudflare dashboard
- Use `npx wrangler secret put` for sensitive values

**Tailwind CSS not loading:**
- Using CDN version - no build step required
- Check browser console for CSP errors
- Verify internet connection (CDN requires network access)

### Performance Optimization

**Slow initial load:**
- Minimize JavaScript bundle size
- Use code splitting for large tools
- Leverage Cloudflare's edge caching
- Consider inlining critical CSS

**High bandwidth usage:**
- Enable Cloudflare's Auto Minify (JS, CSS, HTML)
- Use Brotli compression
- Optimize images and assets
- Implement resource caching headers

### Self-Hosting Troubleshooting

**Docker build fails:**
- See [DOCKER.md](DOCKER.md) for detailed Docker setup
- Ensure Docker daemon is running
- Check Dockerfile syntax

**Node.js deployment issues:**
- Cloudflare Workers use V8 isolates, not Node.js
- Some Node.js APIs not available (fs, path, etc.)
- Use Web APIs instead (fetch, crypto.subtle, etc.)

---

## Legal

### Terms of Service
See [/terms](/terms) for complete Terms of Service.

**Summary:** Use at your own risk. We provide tools as-is without warranty. You're responsible for securely storing generated passwords.

### Privacy Policy
See [/privacy](/privacy) for complete Privacy Policy.

**Summary:** Tool inputs stay client-side and aren't stored on our servers. Ads are served by third-party providers; see the Privacy Policy for details.

---

## Support & Contact

- **General:** hello@simpletool.app
- **Security Issues:** security@simpletool.app
- **Enterprise/Business:** business@simpletool.app

---

## License

MIT License - Use freely for personal and commercial projects.

---

## Acknowledgments

- **Tailwind CSS** - Beautiful utility-first CSS
- **Cloudflare Workers** - Lightning-fast edge computing
- **QRCode.js & jsQR** - QR code generation and scanning
- **Community** - All users and contributors

---

**Built with privacy in mind 🔒**

Client-side tools, minimal storage, and transparent policies.
