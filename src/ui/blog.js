import { respondHTML } from "../utils/respond.js";
import { createPageTemplate } from "../utils/common-ui.js";
import {
  createBlogArticleCard,
  createBreadcrumbs,
  createReadingProgressBar,
} from "../utils/content-ui.js";
import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  resolveRequestLanguage,
  t,
} from "../utils/i18n.js";
import { getLocalizedBlogArticle } from "./blog-content-locales.js";

export const BLOG_ARTICLES = [
  {
    slug: "inspect-jwt-in-the-browser",
    title: "Inspect a JWT in the browser, not on someone else's server",
    description:
      "How JSON Web Tokens are structured, what a client-side inspector can and cannot prove, and why pasting a production token into a random decoder is a bad habit.",
    category: "Security",
    readingTime: "8 min read",
    datePublished: "2026-09-08",
    content: `
      <p>A JSON Web Token is three Base64URL segments: a header, a payload, and a signature. Anyone who can read the token can read the claims. The signature is the only part that is supposed to be hard to forge, and verifying it needs the matching secret or public key.</p>
      <p>Online JWT decoders that <em>upload</em> the token create a second copy of whatever you pasted: session identifiers, internal emails, tenant ids, sometimes the signing secret if it was stuffed into a custom claim. A decoder that runs <code>atob</code> in your tab never receives that copy. SimpleTool's <a href="/token-studio">Token Studio</a> is that kind of decoder. It also generates keys and inspects JWKS locally. It does not phone a verification API.</p>
      <h2>What a local inspector is good for</h2>
      <ul>
        <li>Confirming <code>alg</code>, <code>kid</code>, expiry, and audience before you drop a token into a ticket.</li>
        <li>Seeing whether a token is a JWT at all, or just three dotted blobs.</li>
        <li>Building a test token you will sign yourself, still in the browser.</li>
      </ul>
      <h2>What it cannot do</h2>
      <p>Without the key, a client-side tool cannot honestly say a production token is valid. Treat an unsigned or unverified payload as untrusted JSON. If you need a server to accept the token, verify it on the server with the real JWKS.</p>
      <p>Also remember the rest of the browser: extensions, screenshots, and the clipboard. Local is not the same as air-gapped. It is still the right default over a pastebin with a sequential URL.</p>
      <p>Related: the <a href="/json-formatter">JSON Formatter</a> on this site uses the same rule for API bodies. Format in the tab. Do not send the document to a third-party history page.</p>
    `,
  },
  {
    slug: "what-is-json",
    title: "JSON syntax that actually breaks parsers",
    description:
      "A practical guide to JSON values, number limits, duplicate keys, and the syntax errors that stop real parsers.",
    category: "Development",
    readingTime: "7 min read",
    datePublished: "2026-02-08",
    content: `
      <p>JSON is a data-interchange format defined by <a href="https://www.rfc-editor.org/rfc/rfc8259" rel="noopener noreferrer">RFC 8259</a>. A document contains one value: an object, array, string, number, boolean, or <code>null</code>. Property names and string values require double quotes; comments, trailing commas, <code>NaN</code>, and <code>Infinity</code> are not JSON.</p>
      <h2>Start with a parser failure you can reproduce</h2>
      <pre tabindex="0" role="region" aria-label="Invalid and valid JSON examples"><code>// invalid: trailing comma and single quotes
{'enabled': true,}

// valid
{"enabled": true}</code></pre>
      <p>The <a href="/json-formatter">JSON Formatter</a> reports the syntax error and can format or minify valid input. Formatting changes whitespace, not the data model.</p>
      <h2>Numbers need special care</h2>
      <p>JSON defines decimal number syntax but does not define an integer width. JavaScript's ordinary <code>Number</code> type cannot exactly represent every integer above <code>9,007,199,254,740,991</code>. This formatter preserves numeric lexemes such as <code>9007199254740993</code>, <code>1.2300</code>, and <code>1e400</code> while re-indenting, but downstream software may still round or reject them. Use strings or an arbitrary-precision type when exact identifiers or monetary values cross systems.</p>
      <h2>Duplicate keys are ambiguous</h2>
      <p>The RFC says object names should be unique, but parsers differ: many keep only the last duplicate. Validate that condition separately when data is a contract. JSON Schema can validate required fields and types; syntax validation alone cannot tell whether <code>{"port": -1}</code> is acceptable to your application.</p>
      <h2>Choose another format when the job differs</h2>
      <p>YAML is convenient for hand-edited configuration but has a larger syntax surface. XML supports mixed document content and namespaces. JSON is a good fit for predictable API payloads, not an automatic winner for every document.</p>

    `,
  },
  {
    slug: "password-security-guide",
    title: "Generate passwords that survive the actual policy",
    description:
      "Use length, randomness, password-manager storage, and site-specific constraints without relying on composition myths.",
    category: "Security",
    readingTime: "8 min read",
    datePublished: "2026-02-08",
    content: `
      <p>A useful password is unique to one account, generated unpredictably, accepted by that service, and stored where you can retrieve it. Symbols and mixed case do not rescue a short reused password.</p>
      <h2>Use a generator, then verify the field accepts it</h2>
      <p>Open the <a href="/password-generator">Password Generator</a>, choose a length your target accepts, generate with the desired character sets, and save the result in a password manager. The tool uses the browser's cryptographic random source. It cannot check whether a site truncates input, rejects a character, or silently imposes a shorter maximum.</p>
      <p>For a concrete default, start with at least 15 random characters for a single-factor password, or follow the service's stricter rule. Current <a href="https://pages.nist.gov/800-63-4/sp800-63b.html" rel="noopener noreferrer">NIST SP 800-63B guidance</a> emphasizes length, blocklists, password managers, and rate limiting rather than mandatory mixtures of character classes.</p>
      <h2>Passphrases and machine secrets are different jobs</h2>
      <p>A multi-word passphrase can be easier to type, but words must be selected randomly rather than as a quotation. API keys and database credentials are not typed from memory, so use longer random output and store it in the platform's secret manager.</p>
      <h2>Generation does not solve storage</h2>
      <p>A browser generator creates a candidate; it does not rotate credentials, synchronize a vault, or protect clipboard history. Clear copied secrets and avoid shared machines. Service operators should store passwords with a dedicated password hashing scheme such as Argon2id, not SHA-256; see the <a href="https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html" rel="noopener noreferrer">OWASP Password Storage Cheat Sheet</a>.</p>

    `,
  },
  {
    slug: "understanding-hashes",
    title: "Hashes for checksums, signatures, and passwords",
    description:
      "Pick a hash workflow by purpose: file integrity, keyed authentication, signatures, or password storage.",
    category: "Security",
    readingTime: "8 min read",
    datePublished: "2026-02-08",
    content: `
      <p>A hash maps bytes to a fixed-size digest. The same bytes produce the same digest, so hashes are useful for detecting accidental or unauthorized changes. They do not encrypt data and cannot prove who produced a message by themselves.</p>
      <h2>Checksum a file with the publisher's value</h2>
      <p>Compute SHA-256 over the downloaded bytes and compare every hexadecimal character with a digest obtained from a trusted publisher channel. A match shows the bytes match that digest; it does not help if an attacker replaced both the file and the checksum.</p>
      <h2>Do not use plain hashes as authenticators</h2>
      <p>For a shared-secret message check, use HMAC rather than concatenating a key and message. For public verification, use a digital signature. <a href="https://csrc.nist.gov/pubs/fips/180-4/upd1/final" rel="noopener noreferrer">FIPS 180-4</a> specifies the SHA-2 family, while <a href="https://www.rfc-editor.org/rfc/rfc2104" rel="noopener noreferrer">RFC 2104</a> defines HMAC.</p>
      <h2>MD5 and SHA-1 have narrow legacy roles</h2>
      <p>Practical collisions make MD5 unsuitable for signatures or trust decisions, and SHA-1 is also deprecated for collision-sensitive uses. A legacy MD5 checksum may still detect an accidental transfer error, but it should not be presented as security.</p>
      <h2>Password hashing is deliberately expensive</h2>
      <p>Fast general-purpose hashes let attackers try guesses quickly. Password databases need a salted, tunable password hashing function such as Argon2id, scrypt, or bcrypt under a documented migration policy. The <a href="/encoding-workbench">Encoding Workbench</a> can compute general hashes for inspection; it is not a password database implementation.</p>

    `,
  },
  {
    slug: "jwt-explained",
    title: "JWT claims, signatures, and verification boundaries",
    description:
      "Decode a JWT safely, then verify algorithm, issuer, audience, time claims, and keys in the system that trusts it.",
    category: "Security",
    readingTime: "8 min read",
    datePublished: "2026-02-08",
    content: `
      <p>A JSON Web Token usually has three Base64URL segments: protected header, claims payload, and signature. Decoding the first two segments is not verification. Anyone holding a token can alter decoded text; only a successful signature check with an allowed algorithm and trusted key establishes integrity.</p>
      <h2>Inspect before you verify</h2>
      <p>Use <a href="/token-studio">Token Studio</a> to inspect <code>alg</code>, <code>kid</code>, <code>iss</code>, <code>aud</code>, <code>exp</code>, and <code>nbf</code>. Treat every displayed claim as untrusted until verification succeeds. The focused <a href="/blog/inspect-jwt-in-the-browser">browser inspection guide</a> explains what local decoding can and cannot prove.</p>
      <h2>Verification is an application policy</h2>
      <p>Pin the algorithms your application accepts; do not let the token choose an unexpected verification mode. Resolve <code>kid</code> only within the issuer's trusted JWKS, verify issuer and audience exactly, and apply a small documented clock-skew allowance to time claims. <a href="https://www.rfc-editor.org/rfc/rfc8725" rel="noopener noreferrer">RFC 8725</a> records current JWT security practices.</p>
      <h2>JWT is not encrypted by default</h2>
      <p>A signed JWT can be read by its holder. Do not put passwords, API keys, or unnecessary personal data in claims. Keep token lifetimes bounded and plan revocation or key rotation when immediate invalidation matters.</p>
      <p>The tool can verify supported signatures when you provide suitable key material. It cannot establish that a key came from the correct issuer or that a token is authorized for your application; those are trust decisions outside the decoder.</p>

    `,
  },
  {
    slug: "regex-guide",
    title: "Debug a regular expression with counterexamples",
    description:
      "Build a pattern from anchors and groups, test non-matches, and recognize engine and performance limits.",
    category: "Development",
    readingTime: "8 min read",
    datePublished: "2026-02-08",
    content: `
      <p>A regular expression answers a narrow text-matching question. Start with examples that must match and examples that must not. A pattern that passes only the happy path is unfinished.</p>
      <h2>Anchor whole-field validation</h2>
      <p>To accept a six-digit ASCII code, test <code>^[0-9]{6}$</code>. Without the anchors, the same pattern also finds six digits inside a longer string. In JavaScript, <code>\\d</code> matches ASCII digits; other regex engines may use Unicode digit semantics. An explicit range makes an ASCII protocol requirement clear.</p>
      <h2>Use groups to extract, not to guess meaning</h2>
      <p>For <code>2026-09-12</code>, <code>^([0-9]{4})-([0-9]{2})-([0-9]{2})$</code> separates fields, but it still accepts month 99. Parse and validate calendar meaning after the structural match.</p>
      <h2>Test the engine you deploy</h2>
      <p>Syntax and features vary across JavaScript, PCRE, RE2, Python, and other engines. The <a href="/regex-visualizer">Regex Studio</a> uses the browser's JavaScript engine; its result is not proof that a server-side engine behaves identically. MDN documents JavaScript's <a href="https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions" rel="noopener noreferrer">regular-expression syntax</a>.</p>
      <h2>Avoid ambiguous repeated alternatives</h2>
      <p>Nested quantifiers and overlapping alternatives can trigger excessive backtracking in some engines. Test long near-misses, set input limits at system boundaries, and prefer a parser when the grammar has nested structure. A visual explanation helps review a pattern; it cannot guarantee safe runtime on every input.</p>

    `,
  },
  {
    slug: "curl-essentials",
    title: "Reproduce an HTTP request with curl",
    description:
      "Build a minimal request, inspect headers and redirects, preserve errors, and avoid leaking credentials into shell history.",
    category: "Networking",
    readingTime: "8 min read",
    datePublished: "2026-02-05",
    content: `
      <p><code>curl</code> is useful when you need to separate an HTTP problem from application code. Begin with the smallest request that reproduces the issue, then add one option at a time.</p>
      <h2>Send JSON and fail visibly</h2>
      <pre tabindex="0" role="region" aria-label="curl JSON request example"><code>curl --fail-with-body \\
  --request POST \\
  --header 'Content-Type: application/json' \\
  --data '{"enabled":true}' \\
  https://api.example.test/widgets</code></pre>
      <p><code>--fail-with-body</code> makes HTTP 4xx/5xx responses fail the command while retaining the response body. Use <code>--include</code> for response headers and <code>--verbose</code> for connection and request diagnostics. The authoritative option behavior is in the <a href="https://curl.se/docs/manpage.html" rel="noopener noreferrer">curl man page</a>.</p>
      <h2>Redirects can change the security context</h2>
      <p><code>--location</code> follows redirects. Inspect the chain before forwarding credentials across hosts, and do not use <code>--location-trusted</code> casually. Avoid <code>--insecure</code>: it disables certificate verification and can hide the TLS failure you need to diagnose.</p>
      <h2>Keep secrets out of generated commands</h2>
      <p>The <a href="/curl-studio">Curl Studio</a> builds commands and parses existing ones in the browser. Prefer environment variables, a protected config file, or interactive input for real tokens instead of pasting them into a shareable command or shell history. The studio does not send the request, resolve DNS, or test the remote server.</p>

    `,
  },
  {
    slug: "x509-certificates-explained",
    title: "Read an X.509 certificate without overtrusting it",
    description:
      "Inspect names, validity, key usage, and chain clues while keeping hostname and trust-store verification separate.",
    category: "Security",
    readingTime: "8 min read",
    datePublished: "2026-02-06",
    content: `
      <p>An X.509 certificate binds a public key to names and attributes signed by an issuer. Reading its fields is inspection, not proof that a live server is trustworthy.</p>
      <h2>Check the identity fields first</h2>
      <p>For HTTPS, clients match the requested hostname against the Subject Alternative Name extension. The legacy Common Name is not a substitute when SAN is present. Then check <code>notBefore</code> and <code>notAfter</code>, key type and size, signature algorithm, and key-usage constraints.</p>
      <h2>A chain needs more than the leaf</h2>
      <p>The server normally sends the leaf and required intermediate certificates. The client builds a path to a root in its own trust store and applies name constraints, policy, and usage rules. A missing intermediate can fail on one client even if another retrieves or caches it.</p>
      <p><a href="https://www.rfc-editor.org/rfc/rfc5280" rel="noopener noreferrer">RFC 5280</a> defines certificate and path-validation rules. Browser behavior also depends on platform trust stores and current CA policy.</p>
      <h2>Use the decoder for fields, not network claims</h2>
      <p>The <a href="/certificate-decoder">Certificate Decoder</a> parses PEM or DER input locally and shows certificate fields. It does not contact the hostname, fetch missing intermediates, check current revocation status, or certify that a chain is accepted by every client. Use a live TLS client for those checks and avoid pasting private keys; a certificate contains the public key only.</p>

    `,
  },
  {
    slug: "saml-oauth-oidc-compared",
    title: "Choose SAML, OAuth 2.0, or OpenID Connect by flow",
    description:
      "Separate browser SSO, delegated API authorization, and identity claims before selecting a protocol.",
    category: "Security",
    readingTime: "9 min read",
    datePublished: "2026-02-07",
    content: `
      <p>SAML, OAuth 2.0, and OpenID Connect solve overlapping-looking but different problems. Start with the actors and the artifact your application must validate.</p>
      <h2>SAML: signed assertions for browser SSO</h2>
      <p>A SAML identity provider sends an XML assertion to a service provider, commonly through the browser. Validate the XML signature, issuer, audience, destination, recipient, timestamps, and replay protections. The <a href="/saml-decoder">SAML Decoder</a> can decode a request or response for inspection; decoding does not validate the signature or trust relationship. Specifications are published by <a href="https://www.oasis-open.org/standard/saml/" rel="noopener noreferrer">OASIS</a>.</p>
      <h2>OAuth 2.0: delegated authorization</h2>
      <p>OAuth gives a client limited access to a resource server. An access token is not automatically proof of the user's identity. For browser-based clients, authorization code with PKCE is the usual modern flow; exact choices depend on the authorization server and threat model. See <a href="https://www.rfc-editor.org/rfc/rfc6749" rel="noopener noreferrer">RFC 6749</a> and its current security guidance.</p>
      <h2>OpenID Connect: identity on OAuth</h2>
      <p>OIDC adds an ID token and user-information conventions. The client validates issuer, audience, signature, nonce where applicable, and time claims. Access tokens go to APIs; ID tokens describe the authentication event to the client.</p>
      <h2>Do not convert artifacts by shape alone</h2>
      <p>Base64-decoded XML and JWT claims are untrusted until protocol-specific validation succeeds. Choose based on existing identity infrastructure, client type, logout/session needs, metadata rotation, and the libraries your team can operate safely.</p>

    `,
  },
  {
    slug: "cron-expressions-guide",
    title: "Verify a cron schedule before deployment",
    description:
      "Account for dialect, timezone, day-field rules, daylight-saving transitions, and missed-run behavior.",
    category: "Development",
    readingTime: "7 min read",
    datePublished: "2026-02-08",
    content: `
      <p>A cron expression is only part of a schedule. The same text can mean different things across Unix cron, Quartz, cloud schedulers, and CI systems because field counts and day rules vary.</p>
      <h2>Identify the dialect</h2>
      <p>Classic Unix cron uses five fields: minute, hour, day of month, month, and day of week. Some systems add seconds or a year. For example, <code>0 9 * * 1-5</code> commonly means 09:00 on weekdays, but only in a five-field dialect with that day numbering.</p>
      <h2>Timezone is part of the requirement</h2>
      <p>"Every day at 09:00" is incomplete without a timezone. Daylight-saving changes can skip or repeat local wall-clock times. If consistent elapsed intervals matter, use an interval scheduler; if local business time matters, document how duplicate or missing runs are handled.</p>
      <h2>Preview, then test the scheduler itself</h2>
      <p>The <a href="/cron-builder">Cron Expression Builder</a> previews upcoming times for its supported syntax. Compare several results around month ends, leap days, and timezone transitions. The preview cannot prove how your deployment platform handles downtime, overlap, retries, or misfires.</p>
      <h2>Make jobs safe to repeat</h2>
      <p>Schedulers can launch late, concurrently, or more than once. Use idempotency keys or locking where duplicate work is harmful, record the intended run time, and monitor completion separately from trigger creation. POSIX documents the portable <a href="https://pubs.opengroup.org/onlinepubs/9799919799/utilities/crontab.html" rel="noopener noreferrer">crontab interface</a>; platform extensions require platform documentation.</p>

    `,
  },
  {
    slug: "csp-implementation-guide",
    title: "Deploy CSP from report-only to enforcement",
    description:
      "Inventory resource types, choose nonce or hash-based script policy, review reports, and enforce without claiming CSP stops every XSS.",
    category: "Security",
    readingTime: "9 min read",
    datePublished: "2026-02-08",
    content: `
      <p>Content Security Policy tells a browser which resource loads and execution paths are allowed. It can reduce the impact of injection bugs, but it does not replace output encoding, safe DOM APIs, dependency review, or server-side authorization.</p>
      <h2>Inventory before enforcing</h2>
      <p>List scripts, styles, images, fonts, connections, frames, workers, and forms. Begin with <code>Content-Security-Policy-Report-Only</code>, exercise real workflows, and review reports. Reports can contain page URLs and other context, so send them only to an endpoint with an appropriate retention policy.</p>
      <h2>Prefer nonces or hashes for scripts</h2>
      <p>A per-response unpredictable nonce allows specific inline scripts without enabling all inline execution. Static script blocks can use hashes. Avoid broad sources and <code>'unsafe-inline'</code> when they would defeat the protection you are trying to add. Nonces must be generated for each response and inserted into both the header and intended tags.</p>
      <h2>Set directives for the actual resource types</h2>
      <p><code>default-src</code> is a fallback, not a complete policy. Review <code>script-src</code>, <code>style-src</code>, <code>img-src</code>, <code>font-src</code>, <code>connect-src</code>, <code>frame-src</code>, <code>frame-ancestors</code>, <code>worker-src</code>, and <code>form-action</code> as applicable. MDN maintains a practical <a href="https://developer.mozilla.org/docs/Web/HTTP/CSP" rel="noopener noreferrer">CSP reference</a>.</p>
      <h2>Use the builder as a draft, then test responses</h2>
      <p>The <a href="/csp-builder">CSP Header Builder</a> helps assemble directives. It cannot inventory runtime dependencies or prove a policy is secure. Test the actual response header, navigation, authentication, uploads, error pages, and third-party integrations before moving from report-only to enforcement. Keep the old reporting path long enough to detect regressions after deployment.</p>

    `,
  },
];

function renderBlogShell({
  title,
  description,
  content,
  schema,
  path = "/blog",
  lang = DEFAULT_LANGUAGE,
  robots,
  canonicalUrl,
}) {
  const html = createPageTemplate({
    title,
    description,
    content,
    path,
    schema,
    lang,
    robots,
    canonicalUrl,
  });

  return respondHTML(html);
}

function getBlogLocale(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  return {
    lang: currentLang,
    dateLocale:
      { en: "en-US", ko: "ko-KR", ja: "ja-JP", es: "es-ES" }[currentLang] ||
      "en-US",
  };
}

function getLocalizedBlogCategory(category, lang) {
  return t(`content.blog.cat.${category}`, lang) || category;
}

export function renderBlogListingPage(lang = DEFAULT_LANGUAGE) {
  const locale = getBlogLocale(lang);
  const articleCards =
    BLOG_ARTICLES.length > 0
      ? BLOG_ARTICLES.map((article) => {
          const localizedArticle = getLocalizedBlogArticle(
            article,
            locale.lang,
          );
          return createBlogArticleCard(
            {
              ...localizedArticle,
              category: getLocalizedBlogCategory(
                localizedArticle.category,
                locale.lang,
              ),
            },
            { lang: locale.lang, locale: locale.dateLocale },
          );
        }).join("")
      : `
      <div class="text-center py-16">
        <p class="text-surface-500 dark:text-surface-400 text-sm" data-i18n-html="content.blog.empty">${t("content.blog.empty", locale.lang)}</p>
      </div>
    `;

  const breadcrumbs = createBreadcrumbs(
    [
      { label: t("nav.home", locale.lang), url: "/" },
      { label: t("content.blog.heading", locale.lang) },
    ],
    { lang: locale.lang },
  );

  const content = `
    <main class="content-page-shell">
      ${breadcrumbs}
      <div class="content-page-panel">
        <header class="mb-8">
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50" data-i18n="content.blog.heading">${t("content.blog.heading", locale.lang)}</h1>
          <p class="mt-2 text-sm text-surface-500 dark:text-surface-400" data-i18n-html="content.blog.subheading">${t("content.blog.subheading", locale.lang)}</p>
        </header>

        <div class="space-y-4">
          ${articleCards}
        </div>
      </div>
    </main>
  `;

  return renderBlogShell({
    title: t("content.blog.heading", locale.lang),
    description: t("content.blog.subheading", locale.lang),
    content,
    lang: locale.lang,
  });
}

export function renderBlogPostPage(slug, lang = DEFAULT_LANGUAGE) {
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);
  if (!article) return null;
  const locale = getBlogLocale(lang);
  const localizedArticle = getLocalizedBlogArticle(article, locale.lang);

  const breadcrumbs = createBreadcrumbs(
    [
      { label: t("nav.home", locale.lang), url: "/" },
      { label: t("content.blog.heading", locale.lang), url: "/blog" },
      { label: localizedArticle.title },
    ],
    { lang: locale.lang },
  );

  const progressBar = createReadingProgressBar();

  const dateFormatted = localizedArticle.datePublished
    ? new Date(localizedArticle.datePublished).toLocaleDateString(
        locale.dateLocale,
        { year: "numeric", month: "long", day: "numeric" },
      )
    : "";

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: localizedArticle.title,
    description: localizedArticle.description,
    ...(localizedArticle.datePublished
      ? { datePublished: localizedArticle.datePublished }
      : {}),
    author: { "@type": "Organization", name: "SimpleTool" },
    publisher: {
      "@type": "Organization",
      name: "SimpleTool",
      url: "https://simpletool.app",
    },
    mainEntityOfPage: `https://simpletool.app/blog/${slug}`,
  };

  const content = `
    ${progressBar}
    <main class="content-page-shell">
      ${breadcrumbs}
      <article class="content-page-panel">
        <header class="mb-8">
          <div class="flex flex-wrap items-center gap-2 mb-3">
            ${localizedArticle.category ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">${getLocalizedBlogCategory(localizedArticle.category, locale.lang)}</span>` : ""}
            ${localizedArticle.readingTime ? `<span class="text-xs text-surface-500 dark:text-surface-400">${localizedArticle.readingTime}</span>` : ""}
          </div>
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">${localizedArticle.title}</h1>
          ${dateFormatted ? `<time datetime="${localizedArticle.datePublished}" class="block mt-2 text-sm text-surface-500 dark:text-surface-400">${dateFormatted}</time>` : ""}
        </header>

        <div class="prose dark:prose-invert max-w-none prose-pre:bg-surface-900 dark:prose-pre:bg-surface-950 prose-pre:text-surface-100 prose-pre:border prose-pre:border-surface-200 dark:prose-pre:border-surface-800 prose-a:text-primary-700 dark:prose-a:text-primary-300 prose-a:underline prose-a:underline-offset-2">
          ${localizedArticle.content || ""}
        </div>
      </article>
    </main>
  `;

  const canonicalSlug = article.canonicalSlug || slug;
  return renderBlogShell({
    title: localizedArticle.title,
    description: localizedArticle.description,
    content,
    schema,
    path: `/blog/${slug}`,
    lang: locale.lang,
    robots: article.noindex ? "noindex,follow" : undefined,
    canonicalUrl: `https://simpletool.app/blog/${canonicalSlug}`,
  });
}

/**
 * Slugs of removed articles that duplicated a stronger piece. Each 301s to the
 * article (or page) that superseded it so old links and search results keep
 * resolving.
 */
export const RETIRED_BLOG_REDIRECTS = {
  "password-security-best-practices-2026": "/blog/password-security-guide",
  "understanding-json-web-tokens": "/blog/jwt-explained",
  "regex-guide-for-beginners": "/blog/regex-guide",
  "hash-algorithms-compared": "/blog/understanding-hashes",
  "why-client-side-tools-matter": "/about",
};

export function handleBlogRoutes(request, url) {
  const pathname = url.pathname.replace(/\/+$/, "") || "/blog";
  const method = request.method;
  const lang = resolveRequestLanguage(request, url);

  if (pathname === "/blog") {
    if (method === "GET") return renderBlogListingPage(lang);
  }

  const blogPostPattern = /^\/blog\/([a-z0-9][a-z0-9-]*[a-z0-9])$/;
  const postMatch = pathname.match(blogPostPattern);
  if (postMatch && method === "GET") {
    const redirect = RETIRED_BLOG_REDIRECTS[postMatch[1]];
    if (redirect) {
      return new Response(null, {
        status: 301,
        headers: { Location: `${url.origin}${redirect}` },
      });
    }
    return renderBlogPostPage(postMatch[1], lang);
  }

  return null;
}
