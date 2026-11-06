/**
 * HTPasswd Generator
 * Supports bcrypt (-B), Apache MD5 (-m), SHA1 (-s), and plaintext entries;
 * verify, bulk, Authorization header, and server config snippets.
 */

import { respondHTML, respondJSON } from "../utils/respond.js";
import { createPageTemplate, infoHint, createToolHeader } from "../utils/common-ui.js";
import {
  createEducationalSection,
  createRelatedToolsSection,
} from "../utils/content-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import { createHtpasswdLogic } from "../utils/htpasswd-logic.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";

export async function handleHtpasswdRoutes(request, url) {
  const { pathname } = url;

  if (
    pathname === "/htpasswd-generator" ||
    pathname === "/htpasswd-generator/"
  ) {
    if (request.method === "GET") {
      return respondHTML(
        renderHtpasswdPage(resolveRequestLanguage(request, url)),
      );
    }
    return respondJSON({ error: "Method not allowed" }, { status: 405 });
  }

  return null;
}

function renderHtpasswdPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("htpasswd-generator", currentLang);
  const title = translation?.name || "Htpasswd Generator";
  const description =
    translation?.desc ||
    "Create bcrypt htpasswd entries in the browser. Apache MD5, SHA-1, and plaintext remain as legacy options.";

  const currentTool = TOOLS.find((t) => t.id === "htpasswd-generator");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">
      ${createToolHeader(
        { emoji: "🔒" },
        title,
        "Generate htpasswd entries in the browser. bcrypt (-B) is the default for new files. Apache MD5, unsalted SHA-1, and plaintext are legacy compatibility options only.",
        [
          {
            text: "Zero trust by design",
            i18nKey: "tools.htpasswd-generator.ui.desc24",
            tooltip: "No network calls.",
          },
          {
            text: "Multiple algorithms",
            i18nKey: "tools.htpasswd-generator.ui.desc25",
          },
        ],
        {
          toolId: "htpasswd-generator",
          subtitleI18nKey: "tools.htpasswd-generator.ui.desc21",
        },
      )}

      <section class="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <div class="tool-group min-w-0 p-6 space-y-5">
          <div class="space-y-2">
            <label for="username-input" class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide"><span data-i18n="tools.htpasswd-generator.ui.label7">Username</span></label>
            <input id="username-input" type="text" data-tooltip="Username for the htpasswd entry" data-i18n-tooltip="tools.htpasswd-generator.ui.tip0" class="input w-full" placeholder="deploy" data-i18n-placeholder="tools.htpasswd-generator.ui.placeholder11" autocomplete="off" />
          </div>

          <div class="space-y-2">
             <div class="flex items-center justify-between">
               <label for="password-input" class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide"><span data-i18n="tools.htpasswd-generator.ui.label8">Password</span></label>
              <div class="flex gap-2 text-xs text-surface-500 dark:text-surface-400">
                   <button id="toggle-password" type="button" class="btn btn-ghost btn-xs"><span data-i18n="tools.htpasswd-generator.ui.button0">Show</span></button>
                   <button id="generate-password" type="button" class="btn btn-ghost btn-xs text-primary-600 dark:text-primary-400"><span data-i18n="tools.htpasswd-generator.ui.button1">Generate strong</span></button>
                 </div>
             </div>
            <input id="password-input" type="password" data-tooltip="Password to hash for the entry" data-i18n-tooltip="tools.htpasswd-generator.ui.tip1" class="input-mono w-full" placeholder="•••••••" autocomplete="new-password" />
          </div>

          <div class="space-y-2">
            <label for="algorithm-select" class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide"><span data-i18n="tools.htpasswd-generator.ui.label9">Algorithm</span> ${infoHint("Pick bcrypt/apr1/SHA1/plain to match your htpasswd setup; bcrypt is strongest.")}</label>
            <select id="algorithm-select" class="input">
              <option value="bcrypt" data-i18n="tools.htpasswd-generator.ui.option13">Bcrypt (-B)</option>
              <option value="apr1" data-i18n="tools.htpasswd-generator.ui.option14">Apache MD5 (-m)</option>
              <option value="sha" data-i18n="tools.htpasswd-generator.ui.option15">SHA1 (-s)</option>
              <option value="plain" data-i18n="tools.htpasswd-generator.ui.option16">Plaintext</option>
            </select>
          </div>

          <div id="bcrypt-options" class="space-y-2">
            <div class="flex justify-between text-sm text-surface-600 dark:text-surface-400">
              <label for="cost-slider"><span data-i18n="tools.htpasswd-generator.ui.label11">Cost</span></label>
              <span id="cost-label" data-i18n="tools.htpasswd-generator.ui.label12">12 rounds</span>
            </div>
            <input id="cost-slider" type="range" aria-label="Bcrypt cost factor" data-tooltip="Higher cost = stronger hash but slower generation" data-i18n-tooltip="tools.htpasswd-generator.ui.tip2" min="8" max="15" value="12" class="w-full h-2 bg-surface-200 dark:bg-surface-800 rounded-lg" />
          </div>

          <div id="salt-options" class="space-y-2 hidden">
            <div class="flex justify-between items-center">
               <label for="salt-input" class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide"><span data-i18n="tools.htpasswd-generator.ui.label10">Salt</span> ${infoHint("Salt is 8 chars (./0-9A-Za-z) for apr1 hashes; randomize for uniqueness.")}</label>
              <button id="random-salt" type="button" class="btn btn-ghost btn-xs"><span data-i18n="tools.htpasswd-generator.ui.button2">Randomize</span></button>
            </div>
            <input id="salt-input" type="text" maxlength="8" class="input-mono w-full" placeholder="8 chars (./0-9A-Za-z)" data-i18n-placeholder="tools.htpasswd-generator.ui.placeholder12" />
          </div>

           <div id="htpasswd-error" role="alert" class="hidden rounded-xl border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/30 text-sm text-danger-700 dark:text-danger-200 px-4 py-3">Error</div>

           <button id="generate-btn" class="btn btn-primary w-full"><span data-i18n="tools.htpasswd-generator.ui.button3">Generate entry</span></button>
        </div>

        <div class="min-w-0 space-y-6">
          <div class="tool-group p-6">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-lg font-bold text-surface-900 dark:text-white" data-i18n="tools.htpasswd-generator.ui.heading18">Current entry</h2>
              <div class="flex gap-2">
                <button id="copy-entry" class="btn btn-secondary btn-sm" disabled><span data-i18n="tools.htpasswd-generator.ui.button4">Copy</span></button>
                <button id="download-entry" class="btn btn-secondary btn-sm" disabled><span data-i18n="tools.htpasswd-generator.ui.button5">Download</span></button>
              </div>
            </div>
            <pre id="entry-output" role="status" tabindex="0" class="min-h-[80px] bg-surface-900 text-surface-100 p-4 rounded-xl overflow-x-auto text-sm" data-i18n="tools.htpasswd-generator.ui.desc26">No entry yet.</pre>
            <p class="mt-2 text-xs text-surface-600 dark:text-surface-400">Downloads are saved as <code>htpasswd</code>: browsers drop a leading dot from downloaded names. Rename it to <code>.htpasswd</code> on your server.</p>
          </div>

          <div class="tool-group p-6">
             <div class="flex items-center justify-between mb-3">
               <h2 class="text-lg font-bold text-surface-900 dark:text-white" data-i18n="tools.htpasswd-generator.ui.heading19">Recent history</h2>
               <button id="clear-history" class="btn btn-ghost btn-xs text-error-600 dark:text-error-400"><span data-i18n="tools.htpasswd-generator.ui.button6">Clear</span></button>
             </div>
            <div class="overflow-x-auto" tabindex="0">
              <table class="min-w-full text-sm">
                <thead class="text-xs uppercase tracking-widest text-surface-600 dark:text-surface-400">
                  <tr>
                    <th class="py-2 text-left" data-i18n="tools.htpasswd-generator.ui.th6">Username</th>
                    <th class="py-2 text-left" data-i18n="tools.htpasswd-generator.ui.th7">Algorithm</th>
                    <th class="py-2 text-left" data-i18n="tools.htpasswd-generator.ui.th17">Actions</th>
                  </tr>
                </thead>
                <tbody id="history-body" class="divide-y divide-surface-100 dark:divide-surface-800 text-surface-700 dark:text-surface-200">
                  <tr><td class="py-3 text-surface-600 dark:text-surface-400" colspan="3" data-i18n="tools.htpasswd-generator.ui.desc27">Nothing generated yet.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-2 mt-6">
        <div class="tool-group min-w-0 p-6 space-y-4">
          <h2 class="text-lg font-bold text-surface-900 dark:text-white" data-i18n="tools.htpasswd-generator.ui.r3_14">Bulk entries</h2>
          <p class="text-sm text-surface-600 dark:text-surface-400">One <code>user:password</code> per line. Only the first colon splits a line, so passwords may contain colons. Every entry uses the algorithm and cost selected above; apr1 entries each get their own random salt.</p>
          <div class="space-y-2">
            <label for="bulk-input" class="label" data-i18n="tools.htpasswd-generator.ui.r3_6">Users and passwords</label>
            <textarea id="bulk-input" rows="6" class="input-mono w-full" placeholder="alice:first-password&#10;bob:second:password" spellcheck="false" autocomplete="off"></textarea>
          </div>
          <button id="bulk-generate" type="button" class="btn btn-primary w-full" data-i18n="tools.htpasswd-generator.ui.r3_4">Generate all entries</button>
          <div id="bulk-errors" role="alert" class="hidden whitespace-pre-wrap rounded-xl border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/30 text-sm text-danger-700 dark:text-danger-200 px-4 py-3"></div>
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-200" data-i18n="tools.htpasswd-generator.ui.r3_15">htpasswd file</h3>
            <div class="flex gap-2">
              <button id="bulk-copy" type="button" class="btn btn-secondary btn-sm" aria-label="Copy all bulk entries" disabled>Copy</button>
              <button id="bulk-download" type="button" class="btn btn-secondary btn-sm" aria-label="Download bulk entries as .htpasswd" disabled>Download</button>
            </div>
          </div>
          <pre id="bulk-output" role="status" class="min-h-[80px] bg-surface-900 text-surface-100 p-4 rounded-xl overflow-x-auto text-sm">No bulk entries yet.</pre>
        </div>

        <div class="tool-group min-w-0 p-6 space-y-4">
          <h2 class="text-lg font-bold text-surface-900 dark:text-white" data-i18n="tools.htpasswd-generator.ui.r3_16">Verify an existing entry</h2>
          <p class="text-sm text-surface-600 dark:text-surface-400">Paste one line from an htpasswd file and a candidate password. bcrypt, Apache MD5 (apr1), {SHA}, and plaintext entries (including nginx's <code>{PLAIN}</code> prefix) are checked in your browser.</p>
          <div class="space-y-2">
            <label for="verify-line" class="label" data-i18n="tools.htpasswd-generator.ui.r3_7">htpasswd line</label>
            <input id="verify-line" type="text" class="input-mono w-full" placeholder="deploy:$2y$12$..." data-i18n-placeholder="tools.htpasswd-generator.ui.r3_3" spellcheck="false" autocomplete="off" />
          </div>
          <div class="space-y-2">
            <label for="verify-password" class="label" data-i18n="tools.htpasswd-generator.ui.r3_8">Candidate password</label>
            <input id="verify-password" type="password" class="input-mono w-full" autocomplete="off" />
          </div>
          <button id="verify-btn" type="button" class="btn btn-primary w-full" data-i18n="tools.htpasswd-generator.ui.r3_5">Verify password</button>
          <div id="verify-result" role="status" aria-live="polite" class="hidden rounded-xl border px-4 py-3 text-sm"></div>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-[2fr,3fr] mt-6">
        <div class="tool-group min-w-0 p-6 space-y-4">
          <h2 class="text-lg font-bold text-surface-900 dark:text-white" data-i18n="tools.htpasswd-generator.ui.r3_17">Authorization header</h2>
          <p class="text-sm text-surface-600 dark:text-surface-400">Built from the username and password above: <code>user:password</code> is encoded as UTF-8, then Base64 (RFC 7617). Base64 is an encoding, not encryption, so anyone who sees this header can read the password.</p>
          <div class="space-y-2">
            <label for="auth-url" class="label" data-i18n="tools.htpasswd-generator.ui.r3_9">Request URL for the curl example</label>
            <input id="auth-url" type="url" class="input-mono w-full" value="https://example.com/admin/" spellcheck="false" autocomplete="off" />
          </div>
          <div id="auth-error" role="alert" class="hidden rounded-xl border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/30 text-sm text-danger-700 dark:text-danger-200 px-4 py-3"></div>
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-200" data-i18n="tools.htpasswd-generator.ui.r3_18">Header</h3>
            <button id="copy-header" type="button" class="btn btn-ghost btn-xs" aria-label="Copy Authorization header">Copy</button>
          </div>
          <pre id="auth-header-output" tabindex="0" class="bg-surface-900 text-surface-100 p-4 rounded-xl overflow-x-auto text-sm" data-i18n="tools.htpasswd-generator.ui.r3_24">Enter a username and password above.</pre>
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-200" data-i18n="tools.htpasswd-generator.ui.r3_19">curl</h3>
            <button id="copy-curl" type="button" class="btn btn-ghost btn-xs" aria-label="Copy curl command">Copy</button>
          </div>
          <pre id="auth-curl-output" tabindex="0" class="bg-surface-900 text-surface-100 p-4 rounded-xl overflow-x-auto text-sm">Enter a username and password above.</pre>
        </div>

        <div class="tool-group min-w-0 p-6 space-y-4">
          <h2 class="text-lg font-bold text-surface-900 dark:text-white" data-i18n="tools.htpasswd-generator.ui.r3_20">Server configuration</h2>
          <p class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.htpasswd-generator.ui.r3_23">Snippets use the most recent entries generated on this page (a bulk run replaces a single entry). Until you generate one, the username above is shown with a placeholder hash.</p>
          <div class="space-y-2">
            <label for="config-path" class="label" data-i18n="tools.htpasswd-generator.ui.r3_10">htpasswd file path on the server</label>
            <input id="config-path" type="text" class="input-mono w-full" value="/etc/nginx/.htpasswd" spellcheck="false" autocomplete="off" />
          </div>
          <div id="config-error" role="alert" class="hidden rounded-xl border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/30 text-sm text-danger-700 dark:text-danger-200 px-4 py-3"></div>
          ${[
            ["apache", "Apache (.htaccess)", "Needs mod_auth_basic and mod_authn_file. In .htaccess, the directory must allow <code>AllowOverride AuthConfig</code>."],
            ["nginx", "nginx", "nginx checks apr1, {SHA}, {SSHA}, and {PLAIN} entries itself; any other hash, bcrypt included, goes to the system crypt(). See the crypt_r() note below."],
            ["kubernetes", "Kubernetes (ingress-nginx)", "The secret key must be named <code>auth</code>; <code>--from-file=auth</code> uses the file name as the key. Add the annotations to your Ingress."],
            ["caddy", "Caddy", "Caddy's <code>basic_auth</code> accepts bcrypt hashes only, so apr1, {SHA}, and plaintext entries will not work. Before Caddy 2.8 the directive was named <code>basicauth</code>."],
            ["traefik", "Traefik", "Traefik accepts bcrypt, apr1, and SHA-1 hashes. The <code>$$</code> doubling is for docker-compose labels only; in a Traefik file provider or a <code>usersFile</code>, write single <code>$</code>."],
          ]
            .map(
              ([id, heading, note]) => `
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-200">${heading}</h3>
              <button type="button" class="btn btn-ghost btn-xs config-copy" data-config="${id}" aria-label="Copy ${heading} config">Copy</button>
            </div>
            <pre id="config-${id}" tabindex="0" class="bg-surface-900 text-surface-100 p-4 rounded-xl overflow-x-auto text-sm"></pre>
            <p class="text-xs text-surface-600 dark:text-surface-400">${note}</p>
          </div>`,
            )
            .join("")}
        </div>
      </section>
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12" role="region" aria-label="Htpasswd guide">
      <section class="card p-6 sm:p-8 mb-8 space-y-4">
        <h2 class="text-xl font-bold text-surface-900 dark:text-white" data-i18n="tools.htpasswd-generator.ui.r3_21">Which algorithm should you use?</h2>
        <div class="overflow-x-auto" tabindex="0">
          <table class="min-w-full text-sm">
            <thead class="text-left text-surface-700 dark:text-surface-300">
              <tr>
                <th class="py-2 pr-4">Algorithm</th>
                <th class="py-2 pr-4" data-i18n="tools.htpasswd-generator.ui.r3_11">htpasswd flag</th>
                <th class="py-2 pr-4" data-i18n="tools.htpasswd-generator.ui.r3_12">Verdict</th>
                <th class="py-2" data-i18n="tools.htpasswd-generator.ui.r3_13">Why</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800 text-surface-700 dark:text-surface-300">
              <tr>
                <td class="py-2 pr-4 font-medium">bcrypt</td>
                <td class="py-2 pr-4"><code>-B</code></td>
                <td class="py-2 pr-4 font-semibold">Recommended</td>
                <td class="py-2">Salted and deliberately slow. Each +1 on the cost factor doubles the work. Only the first 72 bytes of a password are used.</td>
              </tr>
              <tr>
                <td class="py-2 pr-4 font-medium">Apache MD5 (apr1)</td>
                <td class="py-2 pr-4"><code>-m</code></td>
                <td class="py-2 pr-4 font-semibold">Legacy</td>
                <td class="py-2">Salted, but a fixed 1,000 rounds of MD5 is cheap to brute-force on modern hardware. Use it only when the server cannot verify bcrypt.</td>
              </tr>
              <tr>
                <td class="py-2 pr-4 font-medium">SHA-1 ({SHA})</td>
                <td class="py-2 pr-4"><code>-s</code></td>
                <td class="py-2 pr-4 font-semibold">Weak</td>
                <td class="py-2">A single unsalted SHA-1: identical passwords produce identical hashes, and each guess costs one fast hash.</td>
              </tr>
              <tr>
                <td class="py-2 pr-4 font-medium">Plaintext</td>
                <td class="py-2 pr-4"><code>-p</code></td>
                <td class="py-2 pr-4 font-semibold">Insecure</td>
                <td class="py-2">Stored as-is. Apache httpd accepts plaintext only on Windows and NetWare, and nginx needs the <code>{PLAIN}</code> prefix.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <h3 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.htpasswd-generator.ui.r3_22">nginx error: "crypt_r() failed (22: Invalid argument)"</h3>
        <p class="text-surface-700 dark:text-surface-300">nginx verifies apr1, {SHA}, {SSHA}, and {PLAIN} entries with its own code, but passes every other hash, including bcrypt's <code>$2y$</code>, to the operating system's <code>crypt()</code> (<code>crypt_r()</code> on Linux). If that system's libc does not implement bcrypt, the call fails with EINVAL, nginx logs this error, and the request gets a 500 Internal Server Error instead of a login prompt.</p>
        <p class="text-surface-700 dark:text-surface-300">There are two fixes: regenerate the entries with Apache MD5 (apr1), which nginx always understands, or run nginx on a system whose <code>crypt()</code> supports bcrypt (for example, one using libxcrypt with bcrypt enabled).</p>
      </section>
      ${createEducationalSection(
        [
          {
            title: "What is htpasswd?",
            content: `
            <p>The <code>htpasswd</code> file is a flat-file database used to store usernames and hashed passwords for basic authentication on Apache and Nginx web servers. It is a simple but effective way to protect specific directories or administrative panels on a website without needing a full database-backed authentication system.</p>
            <p>Each line in an <code>htpasswd</code> file represents a single user and follows the format <code>username:hashed_password</code>.</p>
          `,
          },
          {
            title: "How to Use This Tool",
            content: `
            <ol>
              <li><strong>Enter Username:</strong> Type the username you want to use for authentication.</li>
              <li><strong>Provide Password:</strong> Enter a password or click "Generate strong" to create a secure one.</li>
              <li><strong>Select Algorithm:</strong> Choose "Bcrypt (-B)" for modern security or "Apache MD5 (-m)" for legacy compatibility.</li>
              <li><strong>Generate:</strong> Click "Generate entry" to create the hashed string.</li>
              <li><strong data-i18n="tools.htpasswd-generator.ui.r3_0">Copy or Download:</strong> Copy the resulting line to your clipboard or download it as a file to upload to your server.</li>
            </ol>
          `,
          },
          {
            title: "Common Use Cases",
            content: `
            <ul>
              <li><strong>Admin Panels:</strong> Protecting sensitive areas like <code>/admin</code> or <code>/wp-admin</code> with an extra layer of server-level security.</li>
              <li><strong>Staging Sites:</strong> Restricting access to development or staging environments so they aren't indexed by search engines or viewed by the public.</li>
              <li><strong>Private Repositories:</strong> Securing local Git or SVN repositories served over HTTP.</li>
              <li><strong data-i18n="tools.htpasswd-generator.ui.r3_1">API Gateways:</strong> Implementing simple authentication for internal microservices or legacy APIs.</li>
            </ul>
          `,
          },
          {
            title: "Pro Tips",
            content: `
            <ul>
              <li><strong>Always Use Bcrypt:</strong> Bcrypt is intentionally slow and uses a "cost" factor to resist brute-force attacks. It is significantly more secure than the legacy MD5 or SHA1 options.</li>
              <li><strong>Secure the File:</strong> Name your file <code>.htpasswd</code> (with a leading dot) and store it <strong>outside</strong> your web root directory to prevent it from being downloaded.</li>
              <li><strong data-i18n="tools.htpasswd-generator.ui.r3_2">HTTPS is Mandatory:</strong> Basic authentication sends credentials in a format that is easily reversible. Never use it over unencrypted HTTP; always ensure your site is served over HTTPS.</li>
            </ul>
          `,
          },
        ],
        "htpasswd-generator",
        currentLang,
      )}
    ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const scripts = `
    <script src="/vendor/bcrypt.min.js" integrity="sha384-qGFE4FIJLgCFuYs3nzg39XpCtvT5AZUhaBdjB3e1+vpKQa03AkyWOyBSFb9OcQ/g" crossorigin="anonymous"></script>
    <script>
      const HtpasswdLogic = (${createHtpasswdLogic.toString()})();
      const usernameInput = document.getElementById('username-input');
      const passwordInput = document.getElementById('password-input');
      const algorithmSelect = document.getElementById('algorithm-select');
      const costSlider = document.getElementById('cost-slider');
      const costLabel = document.getElementById('cost-label');
      const saltInput = document.getElementById('salt-input');
      const bcryptOptions = document.getElementById('bcrypt-options');
      const saltOptions = document.getElementById('salt-options');
      const errorBox = document.getElementById('htpasswd-error');
      const generateBtn = document.getElementById('generate-btn');
      const entryOutput = document.getElementById('entry-output');
      const copyEntryBtn = document.getElementById('copy-entry');
      const downloadEntryBtn = document.getElementById('download-entry');
      const clearHistoryBtn = document.getElementById('clear-history');
      const historyBody = document.getElementById('history-body');
      const togglePasswordBtn = document.getElementById('toggle-password');
      const generatePasswordBtn = document.getElementById('generate-password');
      const randomSaltBtn = document.getElementById('random-salt');

      const APR1_ALPHABET = HtpasswdLogic.APR1_ALPHABET;
      const bulkInput = document.getElementById('bulk-input');
      const bulkGenerateBtn = document.getElementById('bulk-generate');
      const bulkErrors = document.getElementById('bulk-errors');
      const bulkOutput = document.getElementById('bulk-output');
      const bulkCopyBtn = document.getElementById('bulk-copy');
      const bulkDownloadBtn = document.getElementById('bulk-download');
      const verifyLineInput = document.getElementById('verify-line');
      const verifyPasswordInput = document.getElementById('verify-password');
      const verifyBtn = document.getElementById('verify-btn');
      const verifyResult = document.getElementById('verify-result');
      const authUrlInput = document.getElementById('auth-url');
      const authError = document.getElementById('auth-error');
      const authHeaderOutput = document.getElementById('auth-header-output');
      const authCurlOutput = document.getElementById('auth-curl-output');
      const configPathInput = document.getElementById('config-path');
      const configError = document.getElementById('config-error');
      const CONFIG_IDS = ['apache', 'nginx', 'kubernetes', 'caddy', 'traefik'];
      let configEntries = [];
      let bulkText = '';
      let authResult = null;
      const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+[]{}';
      const historyItems = [];
      let currentEntry = '';

      function translate(key, fallback) {
        return window._t ? window._t(key, fallback) : fallback;
      }

      function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function(character) {
          return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
          }[character] || character;
        });
      }

      function showError(message) {
        errorBox.textContent = message;
        errorBox.classList.remove('hidden');
      }

      function hideError() {
        errorBox.textContent = '';
        errorBox.classList.add('hidden');
      }

      function setButtonBusy(button, busy, busyLabel) {
        if (!button) return;
        if (!button.dataset.originalLabel) {
          button.dataset.originalLabel = button.innerHTML;
        }
        button.disabled = busy;
        button.innerHTML = busy ? busyLabel : button.dataset.originalLabel;
      }

      function randomFromCharset(charset, length) {
        const bytes = crypto.getRandomValues(new Uint32Array(length));
        let output = '';
        for (let index = 0; index < length; index += 1) {
          output += charset[bytes[index] % charset.length];
        }
        return output;
      }

      function generateStrongPassword() {
        return randomFromCharset(PASSWORD_CHARS, 20);
      }

      function generateApr1Salt() {
        return randomFromCharset(APR1_ALPHABET, 8);
      }

      function updateCostLabel() {
        costLabel.textContent = costSlider.value + ' rounds';
      }

      function updateAlgorithmOptions() {
        const algorithm = algorithmSelect.value;
        bcryptOptions.classList.toggle('hidden', algorithm !== 'bcrypt');
        saltOptions.classList.toggle('hidden', algorithm !== 'apr1');
      }

      function updateCurrentEntry(entry) {
        currentEntry = entry;
        entryOutput.textContent = entry || translate('tools.htpasswd-generator.ui.desc26', 'No entry yet.');
        const hasEntry = Boolean(entry);
        copyEntryBtn.disabled = !hasEntry;
        downloadEntryBtn.disabled = !hasEntry;
      }

      function algorithmLabelFor(value) {
        switch (value) {
          case 'bcrypt':
            return translate('tools.htpasswd-generator.ui.option13', 'Bcrypt (-B)');
          case 'apr1':
            return translate('tools.htpasswd-generator.ui.option14', 'Apache MD5 (-m)');
          case 'sha':
            return translate('tools.htpasswd-generator.ui.option15', 'SHA1 (-s)');
          case 'plain':
            return translate('tools.htpasswd-generator.ui.option16', 'Plaintext');
          default:
            return value;
        }
      }

      function renderHistory() {
        if (!historyItems.length) {
          historyBody.innerHTML = '<tr><td class="py-3 text-surface-600 dark:text-surface-400" colspan="3">' + escapeHtml(translate('tools.htpasswd-generator.ui.desc27', 'Nothing generated yet.')) + '</td></tr>';
          return;
        }

        historyBody.innerHTML = historyItems.map(function(item, index) {
          return '<tr>' +
            '<td class="py-3 font-medium">' + escapeHtml(item.username) + '</td>' +
            '<td class="py-3">' + escapeHtml(item.algorithmLabel) + '</td>' +
            '<td class="py-3">' +
              '<button type="button" class="btn btn-ghost btn-xs history-copy" data-history-index="' + index + '">' +
                escapeHtml(translate('tools.htpasswd-generator.ui.button4', 'Copy')) +
              '</button>' +
            '</td>' +
          '</tr>';
        }).join('');
      }

      async function copyText(text, button) {
        await navigator.clipboard.writeText(text);
        if (window.Toast) {
          window.Toast.success(translate('common.copied', 'Copied!'));
        }
        if (!button) return;
        // Keep the first label: a second click within 1.5s must not capture "Copied!" as the label to restore.
        if (!button.dataset.copyLabel) button.dataset.copyLabel = button.innerHTML;
        window.clearTimeout(Number(button.dataset.copyTimer));
        button.innerHTML = translate('common.copied', 'Copied!');
        button.dataset.copyTimer = String(window.setTimeout(function() {
          button.innerHTML = button.dataset.copyLabel;
        }, 1500));
      }

      function downloadEntry() {
        downloadText(currentEntry);
      }

      function downloadText(text) {
        if (!text) return;
        const blob = new Blob([text + '\\n'], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'htpasswd';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(function() {
          URL.revokeObjectURL(url);
        }, 0);
      }

      function getBcryptLib() {
        return (window.dcodeIO && window.dcodeIO.bcrypt) || window.bcrypt || null;
      }

      async function buildBcryptEntry(password) {
        const bcryptLib = getBcryptLib();
        if (!bcryptLib) {
          throw new Error('bcrypt library not available. Reload and try again.');
        }

        const rounds = parseInt(costSlider.value, 10);

        const hash = await new Promise(function(resolve, reject) {
          bcryptLib.genSalt(rounds, function(saltError, salt) {
            if (saltError) {
              reject(saltError);
              return;
            }

            bcryptLib.hash(password, salt, function(hashError, value) {
              if (hashError) {
                reject(hashError);
                return;
              }
              resolve(value);
            });
          });
        });

        return hash.startsWith('$2a$') ? '$2y$' + hash.slice(4) : hash;
      }

      async function buildHash(password, apr1Salt) {
        switch (algorithmSelect.value) {
          case 'bcrypt':
            return buildBcryptEntry(password);
          case 'apr1':
            return HtpasswdLogic.apr1Hash(password, apr1Salt || generateApr1Salt());
          case 'sha':
            return HtpasswdLogic.shaHash(password);
          case 'plain':
            return password;
          default:
            throw new Error('Unsupported algorithm.');
        }
      }

      function pushHistoryItem(item) {
        historyItems.unshift(item);
        if (historyItems.length > 8) {
          historyItems.length = 8;
        }
        renderHistory();
      }

      async function generateEntry() {
        hideError();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username) {
          showError('Enter a username first.');
          usernameInput.focus();
          return;
        }

        const usernameError = HtpasswdLogic.validateUsername(username);
        if (usernameError) {
          showError(usernameError);
          usernameInput.focus();
          return;
        }

        if (!password) {
          showError('Enter a password first.');
          passwordInput.focus();
          return;
        }

        const suppliedSalt = saltInput.value.trim();
        if (algorithmSelect.value === 'apr1' && suppliedSalt && !/^[./0-9A-Za-z]{1,8}$/.test(suppliedSalt)) {
          showError('Salt must be 1-8 characters using ./0-9A-Za-z.');
          saltInput.focus();
          return;
        }

        setButtonBusy(generateBtn, true, '<span>' + _t('tools.htpasswd-generator.js.r4_1', 'Generating…') + '</span>');

        try {
          const hash = await buildHash(password, suppliedSalt);
          const entry = username + ':' + hash;
          updateCurrentEntry(entry);
          configEntries = [{ username: username, hash: hash, algorithm: algorithmSelect.value }];
          renderConfigs();
          pushHistoryItem({
            username: username,
            algorithmLabel: algorithmLabelFor(algorithmSelect.value),
            entry: entry
          });
        } catch (error) {
          showError(error instanceof Error ? error.message : 'Failed to generate entry.');
        } finally {
          setButtonBusy(generateBtn, false, '');
        }
      }

      togglePasswordBtn.addEventListener('click', function() {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        const label = togglePasswordBtn.querySelector('span');
        if (label) {
          label.textContent = isHidden ? 'Hide' : translate('tools.htpasswd-generator.ui.button0', 'Show');
        }
      });

      generatePasswordBtn.addEventListener('click', function() {
        passwordInput.value = generateStrongPassword();
        hideError();
      });

      randomSaltBtn.addEventListener('click', function() {
        saltInput.value = generateApr1Salt();
        hideError();
      });

      algorithmSelect.addEventListener('change', function() {
        updateAlgorithmOptions();
        hideError();
      });

      costSlider.addEventListener('input', updateCostLabel);
      generateBtn.addEventListener('click', generateEntry);
      copyEntryBtn.addEventListener('click', function() {
        if (currentEntry) {
          copyText(currentEntry, copyEntryBtn).catch(function() {
            showError('Clipboard access failed. Copy the entry manually.');
          });
        }
      });
      downloadEntryBtn.addEventListener('click', downloadEntry);
      clearHistoryBtn.addEventListener('click', function() {
        historyItems.length = 0;
        renderHistory();
      });
      historyBody.addEventListener('click', function(event) {
        const button = event.target.closest('.history-copy');
        if (!button) return;
        const index = Number(button.getAttribute('data-history-index'));
        const item = historyItems[index];
        if (!item) return;
        updateCurrentEntry(item.entry);
        copyText(item.entry, button).catch(function() {
          showError('Clipboard access failed. Copy the entry manually.');
        });
      });

      function setAlert(element, message) {
        element.textContent = message || '';
        element.classList.toggle('hidden', !message);
      }

      async function generateBulk() {
        setAlert(bulkErrors, '');
        const parsed = HtpasswdLogic.parseBulkLines(bulkInput.value);
        if (parsed.errors.length) {
          setAlert(bulkErrors, parsed.errors.map(function(item) {
            return 'Line ' + item.lineNumber + ': ' + item.error;
          }).join('\\n'));
          return;
        }
        if (!parsed.entries.length) {
          setAlert(bulkErrors, 'Enter at least one user:password line.');
          return;
        }
        setButtonBusy(bulkGenerateBtn, true, '<span>' + _t('tools.htpasswd-generator.js.r4_1', 'Generating…') + '</span>');
        try {
          const generated = [];
          for (const item of parsed.entries) {
            const hash = await buildHash(item.password, '');
            generated.push({ username: item.username, hash: hash, algorithm: algorithmSelect.value });
          }
          bulkText = generated.map(function(item) { return item.username + ':' + item.hash; }).join('\\n');
          bulkOutput.textContent = bulkText;
          bulkCopyBtn.disabled = false;
          bulkDownloadBtn.disabled = false;
          configEntries = generated;
          renderConfigs();
        } catch (error) {
          setAlert(bulkErrors, error instanceof Error ? error.message : 'Failed to generate entries.');
        } finally {
          setButtonBusy(bulkGenerateBtn, false, '');
        }
      }

      const ALGORITHM_NAMES = { bcrypt: 'bcrypt', apr1: 'Apache MD5 (apr1)', sha: 'SHA-1 ({SHA})', plain: 'plaintext' };

      function runVerify() {
        const bcryptLib = getBcryptLib();
        const result = HtpasswdLogic.verifyHtpasswdLine(
          verifyLineInput.value,
          verifyPasswordInput.value,
          bcryptLib ? function(password, hash) { return bcryptLib.compareSync(password, hash); } : null
        );
        verifyResult.classList.remove('hidden', 'border-primary-300', 'bg-primary-50', 'text-primary-800', 'dark:border-primary-700', 'dark:bg-primary-900/30', 'dark:text-primary-100', 'border-danger-200', 'bg-danger-50', 'text-danger-700', 'dark:border-danger-800', 'dark:bg-danger-900/30', 'dark:text-danger-200');
        const positive = result.ok && result.match;
        verifyResult.classList.add.apply(verifyResult.classList, positive
          ? ['border-primary-300', 'bg-primary-50', 'text-primary-800', 'dark:border-primary-700', 'dark:bg-primary-900/30', 'dark:text-primary-100']
          : ['border-danger-200', 'bg-danger-50', 'text-danger-700', 'dark:border-danger-800', 'dark:bg-danger-900/30', 'dark:text-danger-200']);
        if (!result.ok) {
          verifyResult.textContent = (_t('tools.htpasswd-generator.js.r4_0', 'Cannot verify:') + ' ') + result.error;
          return;
        }
        let message = (result.match ? 'Match' : 'No match') + ': the password ' + (result.match ? 'matches' : 'does not match') +
          ' the ' + ALGORITHM_NAMES[result.algorithm] + ' entry for "' + result.username + '".';
        if (result.possiblyCrypt && !result.match) {
          message += ' This value looks like a 13-character DES crypt() hash, which this page does not support; it was compared as plaintext.';
        }
        verifyResult.textContent = message;
      }

      function renderAuthHeader() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        authResult = null;
        if (!username || !password) {
          setAlert(authError, '');
          authHeaderOutput.textContent = 'Enter a username and password above.';
          authCurlOutput.textContent = 'Enter a username and password above.';
          return;
        }
        const result = HtpasswdLogic.buildBasicAuth(username, password, authUrlInput.value.trim() || 'https://example.com/');
        if (!result.ok) {
          setAlert(authError, result.error);
          authHeaderOutput.textContent = '';
          authCurlOutput.textContent = '';
          return;
        }
        setAlert(authError, '');
        authResult = result;
        authHeaderOutput.textContent = result.header;
        authCurlOutput.textContent = result.curl;
      }

      function renderConfigs() {
        const configs = HtpasswdLogic.buildServerConfigs({
          filePath: configPathInput.value,
          username: usernameInput.value.trim() || 'deploy',
          entries: configEntries
        });
        setAlert(configError, configs.ok ? '' : configs.error);
        CONFIG_IDS.forEach(function(id) {
          document.getElementById('config-' + id).textContent = configs.ok ? configs[id] : '';
        });
      }

      function copyFromHandler(text, button) {
        if (!text) return;
        copyText(text, button).catch(function() {
          showError('Clipboard access failed. Copy the text manually.');
        });
      }

      usernameInput.addEventListener('input', function() {
        hideError();
        renderAuthHeader();
        if (!configEntries.length) renderConfigs();
      });
      passwordInput.addEventListener('input', function() {
        hideError();
        renderAuthHeader();
      });
      generatePasswordBtn.addEventListener('click', renderAuthHeader);
      saltInput.addEventListener('input', hideError);
      bulkGenerateBtn.addEventListener('click', generateBulk);
      bulkCopyBtn.addEventListener('click', function() { copyFromHandler(bulkText, bulkCopyBtn); });
      bulkDownloadBtn.addEventListener('click', function() { downloadText(bulkText); });
      verifyBtn.addEventListener('click', runVerify);
      // These fields are not in a <form>, so Enter does nothing unless wired explicitly.
      function onEnter(inputs, action) {
        inputs.forEach(function(input) {
          input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.isComposing) {
              event.preventDefault();
              action();
            }
          });
        });
      }
      onEnter([verifyLineInput, verifyPasswordInput], runVerify);
      onEnter([usernameInput, passwordInput, saltInput], function() {
        if (!generateBtn.disabled) generateEntry();
      });
      authUrlInput.addEventListener('input', renderAuthHeader);
      document.getElementById('copy-header').addEventListener('click', function(event) {
        copyFromHandler(authResult && authResult.header, event.currentTarget);
      });
      document.getElementById('copy-curl').addEventListener('click', function(event) {
        copyFromHandler(authResult && authResult.curl, event.currentTarget);
      });
      configPathInput.addEventListener('input', renderConfigs);
      document.querySelectorAll('.config-copy').forEach(function(button) {
        button.addEventListener('click', function() {
          const pre = document.getElementById('config-' + button.getAttribute('data-config'));
          copyFromHandler(pre && pre.textContent, button);
        });
      });

      updateCostLabel();
      updateAlgorithmOptions();
      saltInput.value = generateApr1Salt();
      renderHistory();
      renderAuthHeader();
      renderConfigs();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: "/htpasswd-generator",
    content,
    scripts,
    lang: currentLang,
  });
}
