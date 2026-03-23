/**
 * HTPasswd Generator
 * Supports bcrypt (-B), Apache MD5 (-m), SHA1 (-s), and plaintext entries
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, infoHint } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleHtpasswdRoutes(request, url) {
  const { pathname } = url;

  if (pathname === '/htpasswd-generator' || pathname === '/htpasswd-generator/') {
    if (request.method === 'GET') {
      return respondHTML(renderHtpasswdPage(resolveRequestLanguage(request, url)));
    }
    return respondJSON({ error: 'Method not allowed' }, { status: 405 });
  }

  return null;
}

function renderHtpasswdPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('htpasswd-generator', currentLang);
  const title = translation?.name || 'Htpasswd Entry Generator';
  const description = translation?.desc || 'Create bcrypt, apr1-md5, SHA, or plaintext htpasswd entries securely in your browser.';

  const currentTool = TOOLS.find(t => t.id === 'htpasswd-generator');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
       <header class="bg-white/90 dark:bg-surface-900/80 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-8">
         <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
           <div>
            <p class="text-xs font-semibold uppercase tracking-[0.35em] text-success-600 dark:text-success-300 mb-3" data-i18n="tools.htpasswd-generator.ui.desc20">Ops · Infra</p>
            <h1 class="text-4xl sm:text-5xl font-extrabold text-surface-900 dark:text-white mb-4">${title}</h1>
            <p class="text-lg text-surface-600 dark:text-surface-300 max-w-2xl" data-i18n="tools.htpasswd-generator.ui.desc21">Generate production-ready htpasswd entries using bcrypt (-B), Apache MD5 (-m), SHA1 (-s), or plaintext—completely client-side.</p>
          </div>
           <div class="grid gap-3 text-sm text-surface-600 dark:text-surface-300">
             <div class="flex items-center gap-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-2xl px-4 py-3">
               <span class="text-xl">🛡️</span>
               <div>
                 <p class="font-semibold" data-i18n="tools.htpasswd-generator.ui.desc24">Zero trust by design</p>
                 <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.htpasswd-generator.ui.desc22">No network calls.</p>
               </div>
             </div>
             <div class="flex items-center gap-3 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-2xl px-4 py-3">
               <span class="text-xl">⚙️</span>
               <div>
                 <p class="font-semibold" data-i18n="tools.htpasswd-generator.ui.desc25">Multiple algorithms</p>
                 <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.htpasswd-generator.ui.desc23">Bcrypt, apr1, SHA, plain.</p>
               </div>
             </div>
           </div>
        </div>
      </header>

      <section class="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-6 space-y-5">
          <div class="space-y-2">
            <label for="username-input" class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide"><span data-i18n="tools.htpasswd-generator.ui.label7">Username</span></label>
            <input id="username-input" type="text" data-tooltip="Username for the htpasswd entry" data-i18n-tooltip="tools.htpasswd-generator.ui.tip0" class="w-full px-4 py-3 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100" placeholder="deploy" data-i18n-placeholder="tools.htpasswd-generator.ui.placeholder11" autocomplete="off" />
          </div>

          <div class="space-y-2">
             <div class="flex items-center justify-between">
               <label for="password-input" class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide"><span data-i18n="tools.htpasswd-generator.ui.label8">Password</span></label>
              <div class="flex gap-2 text-xs text-surface-500 dark:text-surface-400">
                   <button id="toggle-password" type="button" class="btn btn-ghost btn-xs"><span data-i18n="tools.htpasswd-generator.ui.button0">Show</span></button>
                   <button id="generate-password" type="button" class="btn btn-ghost btn-xs text-primary-600 dark:text-primary-400"><span data-i18n="tools.htpasswd-generator.ui.button1">Generate strong</span></button>
                 </div>
             </div>
            <input id="password-input" type="password" data-tooltip="Password to hash for the entry" data-i18n-tooltip="tools.htpasswd-generator.ui.tip1" class="w-full px-4 py-3 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 font-mono" placeholder="•••••••" autocomplete="new-password" />
          </div>

          <div class="space-y-2">
            <label for="algorithm-select" class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide"><span data-i18n="tools.htpasswd-generator.ui.label9">Algorithm</span> ${infoHint('Pick bcrypt/apr1/SHA1/plain to match your htpasswd setup; bcrypt is strongest.')}</label>
            <select id="algorithm-select" class="w-full px-4 py-3 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-100">
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
               <label for="salt-input" class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide"><span data-i18n="tools.htpasswd-generator.ui.label10">Salt</span> ${infoHint('Salt is 8 chars (./0-9A-Za-z) for apr1 hashes; randomize for uniqueness.')}</label>
              <button id="random-salt" type="button" class="btn btn-ghost btn-xs"><span data-i18n="tools.htpasswd-generator.ui.button2">Randomize</span></button>
            </div>
            <input id="salt-input" type="text" maxlength="8" class="w-full px-4 py-3 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 font-mono" placeholder="8 chars (./0-9A-Za-z)" data-i18n-placeholder="tools.htpasswd-generator.ui.placeholder12" />
          </div>

           <div id="htpasswd-error" class="hidden rounded-2xl border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/30 text-sm text-danger-700 dark:text-danger-200 px-4 py-3">Error</div>

           <button id="generate-btn" class="btn btn-primary w-full"><span data-i18n="tools.htpasswd-generator.ui.button3">Generate entry</span></button>
        </div>

        <div class="space-y-6">
          <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-6">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-lg font-bold text-surface-900 dark:text-white" data-i18n="tools.htpasswd-generator.ui.heading18">Current entry</h2>
              <div class="flex gap-2">
                <button id="copy-entry" class="btn btn-secondary btn-sm" disabled><span data-i18n="tools.htpasswd-generator.ui.button4">Copy</span></button>
                <button id="download-entry" class="btn btn-secondary btn-sm" disabled><span data-i18n="tools.htpasswd-generator.ui.button5">Download</span></button>
              </div>
            </div>
            <pre id="entry-output" role="status" class="min-h-[80px] bg-surface-900 text-surface-100 p-4 rounded-2xl overflow-x-auto text-sm" data-i18n="tools.htpasswd-generator.ui.desc26">No entry yet.</pre>
          </div>

          <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-6">
             <div class="flex items-center justify-between mb-3">
               <h2 class="text-lg font-bold text-surface-900 dark:text-white" data-i18n="tools.htpasswd-generator.ui.heading19">Recent history</h2>
               <button id="clear-history" class="btn btn-ghost btn-xs text-error-600 dark:text-error-400"><span data-i18n="tools.htpasswd-generator.ui.button6">Clear</span></button>
             </div>
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="text-xs uppercase tracking-widest text-surface-500">
                  <tr>
                    <th class="py-2 text-left" data-i18n="tools.htpasswd-generator.ui.th6">Username</th>
                    <th class="py-2 text-left" data-i18n="tools.htpasswd-generator.ui.th7">Algorithm</th>
                    <th class="py-2 text-left" data-i18n="tools.htpasswd-generator.ui.th17">Actions</th>
                  </tr>
                </thead>
                <tbody id="history-body" class="divide-y divide-surface-100 dark:divide-surface-800 text-surface-700 dark:text-surface-200">
                  <tr><td class="py-3 text-surface-500" colspan="3" data-i18n="tools.htpasswd-generator.ui.desc27">Nothing generated yet.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'What is htpasswd?',
          content: `
            <p>The <code>htpasswd</code> file is a flat-file database used to store usernames and hashed passwords for basic authentication on Apache and Nginx web servers. It is a simple but effective way to protect specific directories or administrative panels on a website without needing a full database-backed authentication system.</p>
            <p>Each line in an <code>htpasswd</code> file represents a single user and follows the format <code>username:hashed_password</code>.</p>
          `
        },
        {
          title: 'How to Use This Tool',
          content: `
            <ol>
              <li><strong>Enter Username:</strong> Type the username you want to use for authentication.</li>
              <li><strong>Provide Password:</strong> Enter a password or click "Generate strong" to create a secure one.</li>
              <li><strong>Select Algorithm:</strong> Choose "Bcrypt (-B)" for modern security or "Apache MD5 (-m)" for legacy compatibility.</li>
              <li><strong>Generate:</strong> Click "Generate entry" to create the hashed string.</li>
              <li><strong>Copy or Download:</strong> Copy the resulting line to your clipboard or download it as a file to upload to your server.</li>
            </ol>
          `
        },
        {
          title: 'Common Use Cases',
          content: `
            <ul>
              <li><strong>Admin Panels:</strong> Protecting sensitive areas like <code>/admin</code> or <code>/wp-admin</code> with an extra layer of server-level security.</li>
              <li><strong>Staging Sites:</strong> Restricting access to development or staging environments so they aren't indexed by search engines or viewed by the public.</li>
              <li><strong>Private Repositories:</strong> Securing local Git or SVN repositories served over HTTP.</li>
              <li><strong>API Gateways:</strong> Implementing simple authentication for internal microservices or legacy APIs.</li>
            </ul>
          `
        },
        {
          title: 'Pro Tips',
          content: `
            <ul>
              <li><strong>Always Use Bcrypt:</strong> Bcrypt is intentionally slow and uses a "cost" factor to resist brute-force attacks. It is significantly more secure than the legacy MD5 or SHA1 options.</li>
              <li><strong>Secure the File:</strong> Name your file <code>.htpasswd</code> (with a leading dot) and store it <strong>outside</strong> your web root directory to prevent it from being downloaded.</li>
              <li><strong>HTTPS is Mandatory:</strong> Basic authentication sends credentials in a format that is easily reversible. Never use it over unencrypted HTTP; always ensure your site is served over HTTPS.</li>
            </ul>
          `
        }
      ], 'htpasswd-generator', currentLang)}
    ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  return createPageTemplate({
    title,
    description,
    path: '/htpasswd-generator',
    content,
    lang: currentLang
  });
}
