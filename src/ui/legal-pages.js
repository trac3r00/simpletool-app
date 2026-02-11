/**
 * Legal pages - Terms of Service, Privacy Policy, About, Contact
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, getAdSlotHTML } from '../utils/common-ui.js';

const SITE_NAME = 'SimpleTool App';
const CONTACT_EMAIL = 'hello@simpletool.app';
const LAST_UPDATED = 'January 24, 2026';

function renderLegalShell({ title, description, content, path }) {
  // createPageTemplate always includes the tool ad slot; legal pages have their own slot,
  // so strip the default tool slot to avoid double-ads.
  const html = createPageTemplate({
    title,
    description,
    content,
    path
  });

  const toolAdSlot = getAdSlotHTML('tool', {
    wrapperClassName: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'
  });

  const htmlWithoutToolSlot = toolAdSlot ? html.replace(toolAdSlot, '') : html;
  return respondHTML(htmlWithoutToolSlot);
}

function wrapLegalPage({ heading, title, description, showLastUpdated = true, body, path }) {
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

  return renderLegalShell({ title, description, content, path });
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
    body,
    path: '/terms'
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
    body,
    path: '/privacy'
  });
}

export function renderAboutPage() {
  const body = `
    <section class="mb-10">
      <h2 class="text-2xl font-bold mb-4" data-i18n="tools.about.ui.heading1">Our Mission</h2>
      <p data-i18n="tools.about.ui.text1">
        ${SITE_NAME} was founded on a simple yet powerful premise: the most essential digital tools should be accessible to everyone, without compromising their privacy or security. In an era where "free" often means "you are the product," we've taken a different path. Our mission is to provide a comprehensive suite of high-performance web utilities that operate with absolute transparency and zero data retention. We believe that the tools you use to manage your digital life—whether it's generating a secure password, inspecting a SAML response, or minifying code—should be as private as a local application on your own computer.
      </p>
      <p data-i18n="tools.about.ui.text2">
        We differentiate ourselves by moving the computation from the server to the edge—and ultimately to your own device. While competitors often process your sensitive data (like passwords, logs, or certificates) on their backend servers, SimpleTool ensures that your data never leaves your browser. This "Privacy-by-Design" architecture isn't just a feature; it's our fundamental commitment to our users. By eliminating the need for server-side processing, we remove the single most common point of failure in modern web applications: the centralized database. At SimpleTool, there is no database of your secrets because we never ask for them in the first place.
      </p>
      <p data-i18n="tools.about.ui.text3">
        The modern web is plagued by the "Privacy Paradox"—the conflict between our need for convenient digital tools and our desire to keep our personal information secure. Most "free" utility sites are built on a business model of data harvesting, where your inputs are logged, analyzed, and often sold to third-party brokers. SimpleTool breaks this cycle. We've engineered our platform to be a "dark" utility: we don't use session recording, we don't run heatmaps, and we don't track your journey through our tools. We provide the utility you need without the surveillance you don't.
      </p>
      <ul class="mt-6 space-y-3">
        <li data-i18n="tools.about.ui.text4"><strong>Free Forever:</strong> No subscriptions, paywalls, or "pro" tiers. Ads help keep the lights on.</li>
        <li data-i18n="tools.about.ui.text5"><strong>Absolute Privacy:</strong> 100% client-side processing; your data never touches our disks.</li>
        <li data-i18n="tools.about.ui.text6"><strong>Universal Access:</strong> No account required. Works instantly on any modern device.</li>
        <li data-i18n="tools.about.ui.text7"><strong>Radical Transparency:</strong> We are open about how our tools work and the technologies we use.</li>
      </ul>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold mb-6" data-i18n="tools.about.ui.heading2">By the Numbers</h2>
      <div class="not-prose grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
          <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1" data-i18n="tools.about.ui.stat1">45+</div>
          <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider" data-i18n="tools.about.ui.stat_desc1">Professional Tools</div>
        </div>
        <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
          <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1" data-i18n="tools.about.ui.stat2">4</div>
          <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider" data-i18n="tools.about.ui.stat_desc2">Global Languages</div>
        </div>
        <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
          <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1" data-i18n="tools.about.ui.stat3">100%</div>
          <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider" data-i18n="tools.about.ui.stat_desc3">Client-Side</div>
        </div>
        <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
          <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1" data-i18n="tools.about.ui.stat4">0</div>
          <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider" data-i18n="tools.about.ui.stat_desc4">Bytes Stored</div>
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold mb-4" data-i18n="tools.about.ui.heading3">Technical Philosophy</h2>
      <p data-i18n="tools.about.ui.text8">
        Our technical philosophy is rooted in the "Zero Trust" model. We believe that you shouldn't have to trust us with your data because we've designed our system so that we <em>cannot</em> see it even if we wanted to. By leveraging modern web standards like the Web Crypto API and Cloudflare Workers, we've built a platform that is both incredibly fast and inherently secure. This approach allows us to deliver the power of a full-featured utility suite with the security profile of a local script.
      </p>
      <p data-i18n="tools.about.ui.text9">
        The shift toward client-side processing is more than just a performance optimization; it's a paradigm shift in user safety. By executing logic locally, we eliminate the risk of server-side data breaches, man-in-the-middle attacks on tool inputs, and unauthorized data harvesting. Every line of code we write is evaluated through the lens of: "How can we do this without touching the user's data?" We embrace the constraints of the browser environment as a catalyst for innovation, finding creative ways to implement complex logic—like log parsing or image conversion—entirely within the user's local execution context.
      </p>
      <p data-i18n="tools.about.ui.text10">
        We are committed to verifiable security. Unlike black-box server-side tools, our client-side logic is transparent. Technically-minded users can inspect the network traffic to confirm that no sensitive data is being transmitted, and they can audit the JavaScript executing in their browser. We believe that true security comes from architecture, not just promises. By using standardized, browser-native APIs like the Web Crypto API, we ensure that our cryptographic operations are performed using the most secure methods available on your device.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold mb-4" data-i18n="tools.about.ui.heading4">Why Client-Side Matters</h2>
      <p data-i18n="tools.about.ui.text11">
        In the traditional web model, you send your data to a server, the server processes it, and sends the result back. This model is inherently risky for sensitive data. If the server is compromised, your data is exposed. If the connection is intercepted, your data is exposed. If the company changes its privacy policy, your data might be sold.
      </p>
      <p data-i18n="tools.about.ui.text12">
        By moving the processing to the client side, SimpleTool eliminates these risks. Your data never leaves your device. The "processing" happens in your browser's memory. This means:
      </p>
      <ul class="space-y-2">
        <li data-i18n="tools.about.ui.text13"><strong>Instant Performance:</strong> No network latency for processing. Large files are hashed or parsed at the speed of your local CPU and RAM.</li>
        <li data-i18n="tools.about.ui.text14"><strong>Offline Capability:</strong> Once the tool is loaded, it can often continue to work even if you lose your internet connection.</li>
        <li data-i18n="tools.about.ui.text15"><strong>Absolute Privacy:</strong> Even if our servers were compromised, the attacker would find no record of your passwords, logs, or sensitive documents.</li>
        <li data-i18n="tools.about.ui.text16"><strong>Reduced Carbon Footprint:</strong> By leveraging the computing power already available on your device, we reduce the need for massive, energy-hungry server farms to do the heavy lifting.</li>
      </ul>
      <p class="mt-4" data-i18n="tools.about.ui.text17">
        This approach aligns with the growing "Local-First" software movement, which prioritizes user ownership of data and the ability for software to function independently of centralized cloud services. We believe that the future of the web is decentralized, where the browser acts as a powerful, private workstation rather than just a thin client for remote servers.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold mb-4" data-i18n="tools.about.ui.heading5">Privacy Commitment</h2>
      <p data-i18n="tools.about.ui.text18">
        Privacy is not an afterthought at SimpleTool; it is the foundation upon which every tool is built. Our commitment goes beyond mere compliance with regulations like GDPR and CCPA. We strive for "Privacy Excellence," which means we actively seek out ways to minimize our digital footprint and maximize your anonymity. We believe that privacy is a fundamental human right, and in the digital age, that right must be protected by robust technical architecture, not just legal promises.
      </p>
      <p data-i18n="tools.about.ui.text19">
        Our "Privacy-First" pillars include:
      </p>
      <ul class="space-y-2">
        <li data-i18n="tools.about.ui.text20"><strong>No Tracking:</strong> We do not use first-party analytics, tracking pixels, or session recording tools. Your journey through our site is your own.</li>
        <li data-i18n="tools.about.ui.text21"><strong>No Accounts:</strong> You are never required to sign up, log in, or provide an email address to use our tools. We don't want to know who you are; we just want to help you get your work done.</li>
        <li data-i18n="tools.about.ui.text22"><strong>No Persistence:</strong> We do not use persistent browser storage (like IndexedDB or long-lived localStorage) for tool data. When you close the tab, your data is gone from our environment.</li>
        <li data-i18n="tools.about.ui.text23"><strong>Transparency:</strong> We are open about our architecture and how our tools function. We provide clear explanations of the underlying technologies so that technically-minded users can verify our claims.</li>
      </ul>
      <p class="mt-4" data-i18n="tools.about.ui.text24">
        We recognize that privacy is a dynamic field, and we continuously audit our tools to ensure they meet the highest standards of data protection. Our goal is to provide a "safe harbor" on the internet—a place where you can perform sensitive tasks with the confidence that your privacy is being protected by design, not just by policy.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold mb-4" data-i18n="tools.about.ui.heading6">Technology Stack</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h3 class="text-lg font-semibold mb-2" data-i18n="tools.about.ui.heading7">Infrastructure</h3>
          <ul class="space-y-2 text-sm">
            <li data-i18n="tools.about.ui.text25"><strong>Cloudflare Workers:</strong> Our global edge network that serves content from 300+ cities worldwide, ensuring low latency and high availability without the need for traditional origin servers.</li>
            <li data-i18n="tools.about.ui.text26"><strong>Web Crypto API:</strong> A native browser API that provides a set of hardware-accelerated cryptographic operations, including hashing, signature verification, and encryption.</li>
            <li data-i18n="tools.about.ui.text27"><strong>WebAssembly (Wasm):</strong> A binary instruction format that allows us to run high-performance code (written in languages like C++ or Rust) at near-native speed directly in your browser.</li>
          </ul>
        </div>
        <div>
          <h3 class="text-lg font-semibold mb-2" data-i18n="tools.about.ui.heading8">Frontend</h3>
          <ul class="space-y-2 text-sm">
            <li data-i18n="tools.about.ui.text28"><strong>Vanilla JavaScript:</strong> We avoid heavy frameworks like React or Vue to keep our bundle size small and our performance high. Our tools are built with clean, modern ES modules.</li>
            <li data-i18n="tools.about.ui.text29"><strong>Tailwind CSS:</strong> A utility-first CSS framework that allows us to build a beautiful, responsive, and accessible user interface with minimal custom CSS.</li>
            <li data-i18n="tools.about.ui.text30"><strong>Modern Web APIs:</strong> We leverage the latest browser capabilities, including the File API for local file handling, the Canvas API for image processing, and the Streams API for efficient data manipulation.</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold mb-4" data-i18n="tools.about.ui.heading9">For Enterprises</h2>
      <p data-i18n="tools.about.ui.text31">
        ${SITE_NAME} is designed to meet the rigorous security and compliance requirements of modern enterprises. By ensuring that sensitive data never leaves the employee's workstation, we help organizations maintain a strong security posture without sacrificing productivity.
      </p>
      <p data-i18n="tools.about.ui.text32">
        In many corporate environments, using third-party web tools is restricted due to the risk of data exfiltration. SimpleTool solves this problem by providing a "Zero-Exfiltration" environment. Because all processing happens locally, security teams can approve the use of our tools with the confidence that proprietary code, sensitive logs, and internal credentials are never transmitted to our infrastructure.
      </p>
      <ul class="space-y-2">
        <li data-i18n="tools.about.ui.text33"><strong>Compliance-Friendly:</strong> Tool inputs are not stored server-side, simplifying data residency and sovereignty requirements.</li>
        <li data-i18n="tools.about.ui.text34"><strong>Privacy-by-Design:</strong> Our architecture is designed with SOC 2 principles in mind, focusing on security, availability, and confidentiality.</li>
        <li data-i18n="tools.about.ui.text35"><strong>GDPR/CCPA Compliant:</strong> No personal data processing occurs on our infrastructure, reducing your organization's compliance burden.</li>
        <li data-i18n="tools.about.ui.text36"><strong>Zero Trust:</strong> Nothing leaves the user's browser, eliminating the risk of data breaches from our platform.</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-bold mb-4" data-i18n="tools.about.ui.heading10">Contact & Support</h2>
      <p data-i18n="tools.about.ui.text37">
        We are committed to the continuous improvement of SimpleTool and value the input of our community. Whether you're an individual developer, a student, or part of an enterprise security team, your feedback helps us build better, safer tools for everyone.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <div class="card p-4 border border-surface-200 dark:border-surface-800">
          <h3 class="font-bold mb-1" data-i18n="tools.about.ui.heading11">General Support</h3>
          <p class="text-sm text-surface-600 dark:text-surface-400 mb-2" data-i18n="tools.about.ui.text38">Questions, suggestions, or bug reports.</p>
          <a href="mailto:${CONTACT_EMAIL}" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">${CONTACT_EMAIL}</a>
          <p class="text-xs text-surface-500 mt-2" data-i18n="tools.about.ui.text39">Response time: 24-48 hours</p>
        </div>
        <div class="card p-4 border border-surface-200 dark:border-surface-800">
          <h3 class="font-bold mb-1" data-i18n="tools.about.ui.heading12">Security Team</h3>
          <p class="text-sm text-surface-600 dark:text-surface-400 mb-2" data-i18n="tools.about.ui.text40">Vulnerability reports and security concerns.</p>
          <a href="mailto:security@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">security@simpletool.app</a>
          <p class="text-xs text-surface-500 mt-2" data-i18n="tools.about.ui.text41">Response time: Priority</p>
        </div>
        <div class="card p-4 border border-surface-200 dark:border-surface-800">
          <h3 class="font-bold mb-1" data-i18n="tools.about.ui.heading13">Business Inquiries</h3>
          <p class="text-sm text-surface-600 dark:text-surface-400 mb-2" data-i18n="tools.about.ui.text42">Partnerships, enterprise licensing, or media.</p>
          <a href="mailto:business@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">business@simpletool.app</a>
          <p class="text-xs text-surface-500 mt-2" data-i18n="tools.about.ui.text43">Response time: 2-3 business days</p>
        </div>
      </div>
    </section>
  `;

  return wrapLegalPage({
    heading: `About ${SITE_NAME}`,
    title: 'About',
    description: `About ${SITE_NAME} and our privacy-first tools.`,
    showLastUpdated: false,
    body,
    path: '/about'
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
    body,
    path: '/security'
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
    body,
    path: '/careers'
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
    body,
    path: '/contact'
  });
}
