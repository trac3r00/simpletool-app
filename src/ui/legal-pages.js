/**
 * Legal pages - Terms of Service, Privacy Policy, About, Contact
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, getAdSlotHTML } from '../utils/common-ui.js';

const SITE_NAME = 'SimpleTool App';
const CONTACT_EMAIL = 'hello@simpletool.app';
const LAST_UPDATED = 'January 24, 2026';

function renderLegalShell({ title, description, content }) {
  // createPageTemplate always includes the tool ad slot; legal pages have their own slot,
  // so strip the default tool slot to avoid double-ads.
  const html = createPageTemplate({
    title,
    description,
    content
  });

  const toolAdSlot = getAdSlotHTML('tool', {
    wrapperClassName: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'
  });

  const htmlWithoutToolSlot = toolAdSlot ? html.replace(toolAdSlot, '') : html;
  return respondHTML(htmlWithoutToolSlot);
}

function wrapLegalPage({ heading, title, description, showLastUpdated = true, body }) {
  const updated = showLastUpdated
    ? `<p class="mt-2 text-sm text-surface-500 dark:text-surface-400">Last Updated: ${LAST_UPDATED}</p>`
    : '';

  const content = `
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div class="card p-6 sm:p-10">
        <header class="mb-8">
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">${heading}</h1>
          ${updated}
        </header>

        <div class="prose dark:prose-invert max-w-none prose-pre:bg-surface-100 dark:prose-pre:bg-surface-950 prose-pre:border prose-pre:border-surface-200 dark:prose-pre:border-surface-800">
          ${body}
        </div>
      </div>

      ${getAdSlotHTML('legal', { wrapperClassName: 'mt-10' })}
    </main>
  `;

  return renderLegalShell({ title, description, content });
}

export function renderTermsPage() {
  const body = `
    <section class="mb-8">
      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing and using ${SITE_NAME} ("Service"), you accept and agree to be bound by the terms and provisions of this agreement.
        If you do not agree to these terms, please do not use this Service.
      </p>
    </section>

    <section class="mb-8">
      <h2>2. Description of Service</h2>
      <p>
        ${SITE_NAME} provides free, privacy-focused web tools including but not limited to:
      </p>
      <ul>
        <li>Password generators</li>
        <li>Username generators</li>
        <li>Passphrase generators</li>
        <li>Email alias tools</li>
        <li>Text encoding/decoding operations</li>
        <li>QR code generation and scanning</li>
      </ul>
      <p>
        <strong>All tools operate entirely client-side in your browser.</strong> We do not collect, store, transmit, or have access to any data you generate or process using our tools.
      </p>
    </section>

    <section class="mb-8">
      <h2>3. Privacy and Data Processing</h2>
      <p>
        Our tools are designed with privacy as the top priority:
      </p>
      <ul>
        <li><strong>Client-side processing:</strong> All tool computations happen in your browser</li>
        <li><strong>No tool data storage:</strong> We do not store generated passwords, usernames, or other outputs on our servers</li>
        <li><strong>No accounts:</strong> You can use the Service without signing up</li>
        <li><strong>Operational logging:</strong> Cloudflare may log basic request data for security and abuse prevention</li>
        <li><strong>Advertising:</strong> Ads are served by third-party networks and may use cookies or similar technologies</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>4. Advertising</h2>
      <p>
        The Service is free to use and supported by advertising. We currently use Google AdSense to serve ads.
        Ad providers may collect or use information such as cookies, device identifiers, and IP addresses to deliver
        and measure ads. You can manage ad personalization in your browser settings or via Google Ads Settings.
      </p>
    </section>

    <section class="mb-8">
      <h2>5. Use License</h2>
      <p>
        Permission is granted to use this Service for personal and commercial purposes. You may:
      </p>
      <ul>
        <li>Use the tools for any lawful purpose</li>
        <li>Generate unlimited passwords, usernames, and other content</li>
        <li>Use generated content in your applications or services</li>
      </ul>
      <p>
        You may not:
      </p>
      <ul>
        <li>Attempt to reverse engineer or extract the source code</li>
        <li>Use automated systems to abuse or overload the service</li>
        <li>Redistribute or resell this service without permission</li>
        <li>Use the service for illegal activities</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>6. Disclaimer of Warranties</h2>
      <p>
        This Service is provided "as is" without warranties of any kind, either express or implied, including but not limited to:
      </p>
      <ul>
        <li><strong>Availability:</strong> We do not guarantee uninterrupted or error-free operation</li>
        <li><strong>Security:</strong> While we use cryptographically secure random number generation, you are responsible for securely storing generated passwords</li>
        <li><strong>Accuracy:</strong> We do not warrant that tools will meet your specific requirements</li>
        <li><strong>Fitness:</strong> We do not guarantee the service is suitable for any particular purpose</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>7. Limitation of Liability</h2>
      <p>
        In no event shall ${SITE_NAME} or its operators be liable for any damages (including, without limitation, damages for loss of data, business interruption, or security breaches) arising out of the use or inability to use this Service.
      </p>
      <p>
        <strong>Important:</strong> You are solely responsible for:
      </p>
      <ul>
        <li>Securely storing generated passwords and credentials</li>
        <li>Ensuring generated passwords meet your security requirements</li>
        <li>Verifying the suitability of tools for your use case</li>
        <li>Compliance with applicable laws and regulations</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>8. Security Best Practices</h2>
      <p>
        We recommend the following security practices:
      </p>
      <ul>
        <li>Use a reputable password manager to store generated passwords</li>
        <li>Enable two-factor authentication wherever possible</li>
        <li>Use unique passwords for each account</li>
        <li>Regularly update passwords for sensitive accounts</li>
        <li>Never share passwords via insecure channels</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>9. Changes to Terms</h2>
      <p>
        We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to this page.
        Your continued use of the Service after changes constitutes acceptance of the modified terms.
      </p>
    </section>

    <section class="mb-8">
      <h2>10. Contact Information</h2>
      <p>
        For questions about these Terms of Service, please contact us at:
      </p>
      <p>
        <a href="mailto:${CONTACT_EMAIL}" class="text-primary-600 dark:text-primary-400 hover:underline">${CONTACT_EMAIL}</a>
      </p>
    </section>
  `;

  return wrapLegalPage({
    heading: 'Terms of Service',
    title: 'Terms of Service',
    description: `Terms of Service for ${SITE_NAME}.`,
    showLastUpdated: true,
    body
  });
}

export function renderPrivacyPage() {
  const body = `
    <section class="mb-8">
      <h2>Our Privacy Commitment</h2>
      <p>
        ${SITE_NAME} is built with privacy as the fundamental design principle. <strong>We do not collect, store, or have access to any data you generate using our tools.</strong>
        The service is ad-supported, and third-party ad providers may collect limited data to deliver and measure ads.
      </p>
    </section>

    <section class="mb-8">
      <h2>1. Information We DO NOT Collect</h2>
      <p>
        We explicitly do not collect:
      </p>
      <ul>
        <li><strong>Generated Content:</strong> Passwords, usernames, passphrases, email aliases, QR codes, or any other content you generate</li>
        <li><strong>Personal Information:</strong> Names, email addresses, phone numbers, or any identifying information</li>
        <li><strong>Account Data:</strong> We do not require accounts or collect profile data</li>
        <li><strong>First-party Analytics:</strong> We do not run our own analytics or tracking pixels</li>
        <li><strong>First-party Tracking Cookies:</strong> We do not set persistent tracking cookies</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>2. How Our Tools Work</h2>
      <p>
        All tools on ${SITE_NAME} operate entirely <strong>client-side in your web browser:</strong>
      </p>
      <ul>
        <li>Password generation uses your browser's built-in <code class="bg-surface-100 dark:bg-surface-800 px-1 rounded">crypto.getRandomValues()</code> for cryptographically secure randomness</li>
        <li>Tool computation happens on your device - tool inputs are not sent to our servers</li>
        <li>Generated content never leaves your browser unless you explicitly copy and paste it</li>
        <li>Tool operations do not call backend APIs for processing (ads may load third-party requests)</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>3. Browser Storage</h2>
      <p>
        We do not use persistent browser storage (no localStorage, no IndexedDB).
        Theme toggles apply only for the current session and reset when you leave.
      </p>
    </section>

    <section class="mb-8">
      <h2>4. Cookies</h2>
      <p>
        We do not set first-party cookies or persistent identifiers. Third-party advertising providers may set cookies
        or similar technologies to deliver and measure ads.
      </p>
    </section>

    <section class="mb-8">
      <h2>5. Third-Party Services</h2>
      <p>
        We use minimal third-party services:
      </p>
      <ul>
        <li><strong>Cloudflare:</strong> Hosting and CDN services. Cloudflare may collect basic request logs (such as IP address and user agent) for security and abuse prevention. See <a href="https://www.cloudflare.com/privacypolicy/" class="text-primary-600 dark:text-primary-400 hover:underline" target="_blank" rel="noopener noreferrer">Cloudflare's Privacy Policy</a></li>
        <li><strong>Google Fonts:</strong> Icon fonts may be loaded from Google Fonts</li>
        <li><strong>Google AdSense:</strong> Ad delivery and measurement. AdSense may use cookies or similar technologies to personalize and measure ads</li>
      </ul>
      <p>
        We do not use:
      </p>
      <ul>
        <li>Google Analytics</li>
        <li>Facebook Pixel</li>
        <li>Social media widgets or tracking</li>
        <li>Any other analytics or tracking services</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>6. Data Security</h2>
      <p>
        Since we don't collect data, there's no data to breach. However, we implement security best practices:
      </p>
      <ul>
        <li>All connections use HTTPS encryption</li>
        <li>No server-side storage of user-generated content</li>
        <li>Use of cryptographically secure random number generation</li>
        <li>Regular security updates to our infrastructure</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>7. Your Responsibilities</h2>
      <p>
        While we don't collect your data, you should:
      </p>
      <ul>
        <li>Store generated passwords securely (use a password manager)</li>
        <li>Never share passwords through insecure channels</li>
        <li>Ensure you're using the legitimate ${SITE_NAME} website</li>
        <li>Keep your browser and operating system updated</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>8. Children's Privacy</h2>
      <p>
        Our Service does not collect any information from anyone, including children under 13. The Service can be safely used by individuals of all ages.
      </p>
    </section>

    <section class="mb-8">
      <h2>9. GDPR Compliance</h2>
      <p>
        Under GDPR (General Data Protection Regulation):
      </p>
      <ul>
        <li>We do not receive or store tool inputs, so we are not a controller of that content</li>
        <li>Third-party providers (Cloudflare, AdSense) may process limited data under their own policies</li>
        <li>You can manage ad personalization in your browser or Google Ads Settings</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>10. CCPA Compliance</h2>
      <p>
        Under CCPA (California Consumer Privacy Act):
      </p>
      <ul>
        <li>We do not sell personal information from tool inputs because we do not collect it</li>
        <li>Ad providers may collect data to deliver ads under their policies</li>
        <li>You can manage ad personalization in Google Ads Settings</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>11. Changes to Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify users of any material changes by updating the "Last Updated" date at the top of this page.
      </p>
    </section>

    <section class="mb-8">
      <h2>12. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy, please contact us at:
      </p>
      <p>
        <a href="mailto:${CONTACT_EMAIL}" class="text-primary-600 dark:text-primary-400 hover:underline">${CONTACT_EMAIL}</a>
      </p>
    </section>
  `;

  return wrapLegalPage({
    heading: 'Privacy Policy',
    title: 'Privacy Policy',
    description: `Privacy Policy for ${SITE_NAME}.`,
    showLastUpdated: true,
    body
  });
}

export function renderAboutPage() {
  const body = `
    <section class="mb-8">
      <h2>Our Mission</h2>
      <p>
        ${SITE_NAME} provides free, privacy-focused web tools for everyone. We believe that essential security and productivity tools should be:
      </p>
      <ul>
        <li><strong>Free:</strong> No subscriptions or paywalls; ads help keep the service running</li>
        <li><strong>Private:</strong> Client-side processing; we don't store your tool inputs</li>
        <li><strong>Accessible:</strong> No account required, works on any device</li>
        <li><strong>Transparent:</strong> Clear documentation and open practices</li>
      </ul>
      <p>
        SimpleTool is independently maintained and ad-supported. It is not a charity or nonprofit service.
      </p>
    </section>

    <section class="mb-8">
      <h2>Why We Built This</h2>
      <p>
        We created ${SITE_NAME} because we believe:
      </p>
      <ul>
        <li>Basic security tools shouldn't require an account or payment</li>
        <li>Privacy should be the default, not an option</li>
        <li>Simple tools shouldn't come with complex privacy policies</li>
        <li>Users should never have to trust a service with sensitive data</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>How It Works</h2>
      <p>
        All our tools run entirely in your web browser using JavaScript:
      </p>
      <ul>
        <li><strong>Client-Side Processing:</strong> Computations happen on your device, not our servers</li>
        <li><strong>Secure Randomness:</strong> We use <code class="bg-surface-100 dark:bg-surface-800 px-1 rounded">crypto.getRandomValues()</code> for cryptographic-quality random numbers</li>
        <li><strong>No Data Transmission:</strong> Generated content never leaves your browser</li>
        <li><strong>Modern Web Standards:</strong> Built with vanilla JavaScript, no heavy frameworks</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>Technology Stack</h2>
      <ul>
        <li><strong>Hosting:</strong> Cloudflare Workers (edge computing)</li>
        <li><strong>Frontend:</strong> Vanilla JavaScript + Tailwind CSS</li>
        <li><strong>Encryption:</strong> Web Crypto API</li>
        <li><strong>Libraries:</strong> QRCode.js, jsQR (for QR operations)</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>For Enterprises</h2>
      <p>
        ${SITE_NAME} is suitable for enterprise use:
      </p>
      <ul>
        <li><strong>Compliance-Friendly:</strong> Tool inputs are not stored server-side</li>
        <li><strong>SOC 2 Aligned:</strong> Privacy-by-design architecture</li>
        <li><strong>GDPR/CCPA Compliant:</strong> No personal data processing</li>
        <li><strong>Zero Trust:</strong> Nothing leaves the user's browser</li>
        <li><strong>Auditable:</strong> Open about how tools work</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>Contact & Support</h2>
      <p>
        Have questions, suggestions, or found a bug?
      </p>
      <p>
        Email us: <a href="mailto:${CONTACT_EMAIL}" class="text-primary-600 dark:text-primary-400 hover:underline">${CONTACT_EMAIL}</a>
      </p>
    </section>
  `;

  return wrapLegalPage({
    heading: `About ${SITE_NAME}`,
    title: 'About',
    description: `About ${SITE_NAME} and our privacy-first tools.`,
    showLastUpdated: false,
    body
  });
}

export function renderSecurityPage() {
  const body = `
    <section class="mb-8">
      <h2>Reporting a Vulnerability</h2>
      <p>
        If you believe you've found a security issue, please report it responsibly.
      </p>
      <p>
        Email: <a href="mailto:security@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline">security@simpletool.app</a>
      </p>
    </section>

    <section class="mb-8">
      <h2>Scope</h2>
      <ul>
        <li>The SimpleTool App website and Cloudflare Worker endpoints</li>
        <li>Client-side tools and UI functionality</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>Response Expectations</h2>
      <p>
        We aim to acknowledge valid reports within 3 business days and provide status updates as fixes are made.
      </p>
    </section>
  `;

  return wrapLegalPage({
    heading: 'Security Policy',
    title: 'Security Policy',
    description: `Security policy and reporting guidance for ${SITE_NAME}.`,
    showLastUpdated: true,
    body
  });
}

export function renderCareersPage() {
  const body = `
    <section class="mb-8">
      <h2>Open Roles</h2>
      <p>
        We don't have any open positions at the moment. If you'd like to be considered for future opportunities,
        send a short note with your background and interests.
      </p>
      <p>
        Email: <a href="mailto:business@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline">business@simpletool.app</a>
      </p>
    </section>
  `;

  return wrapLegalPage({
    heading: 'Careers',
    title: 'Careers',
    description: `Careers at ${SITE_NAME}.`,
    showLastUpdated: true,
    body
  });
}

export function renderContactPage() {
  const body = `
    <p>
      We'd love to hear from you! Whether you have questions, feedback, bug reports, or feature requests, feel free to reach out.
    </p>

    <section class="mb-8">
      <h2>General Inquiries</h2>
      <p>
        For general questions about ${SITE_NAME}:
      </p>
      <p>
        <a href="mailto:${CONTACT_EMAIL}" class="text-primary-600 dark:text-primary-400 hover:underline font-semibold">${CONTACT_EMAIL}</a>
      </p>
    </section>

    <section class="mb-8">
      <h2>Bug Reports & Feature Requests</h2>
      <p>
        Found a bug or have an idea for a new feature? Let us know! When reporting bugs, please include:
      </p>
      <ul>
        <li>Description of the issue</li>
        <li>Steps to reproduce (if applicable)</li>
        <li>Browser and operating system</li>
        <li>Any error messages you saw</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2>Security Issues</h2>
      <p>
        If you discover a security vulnerability, please report it responsibly:
      </p>
      <p>
        Email: <a href="mailto:security@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline">security@simpletool.app</a>
      </p>
      <p>
        Please do not disclose security issues publicly until we've had a chance to address them.
      </p>
    </section>

    <section class="mb-8">
      <h2>Enterprise & Partnership</h2>
      <p>
        Interested in enterprise licensing, white-label solutions, or partnerships?
      </p>
      <p>
        Email: <a href="mailto:business@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline">business@simpletool.app</a>
      </p>
    </section>

    <section class="mb-8">
      <h2>Response Time</h2>
      <p>
        We typically respond within 2-3 business days. Security issues are prioritized and addressed as quickly as possible.
      </p>
    </section>
  `;

  return wrapLegalPage({
    heading: 'Contact Us',
    title: 'Contact',
    description: `Contact information for ${SITE_NAME}.`,
    showLastUpdated: false,
    body
  });
}
