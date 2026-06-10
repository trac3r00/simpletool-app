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
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
       <header class="bg-white/90 dark:bg-surface-900/80 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-8">
         <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
           <div>
            <p class="text-xs font-semibold uppercase tracking-[0.35em] text-success-600 dark:text-success-300 mb-3" data-i18n="tools.htpasswd-generator.ui.desc20">Ops · Infra</p>
            <h1 class="text-4xl sm:text-5xl font-extrabold text-surface-900 dark:text-white mb-4">${title}</h1>
            <p class="text-lg text-surface-600 dark:text-surface-300 max-w-2xl" data-i18n="tools.htpasswd-generator.ui.desc21">Generate production-ready htpasswd entries using bcrypt (-B), Apache MD5 (-m), SHA1 (-s), or plaintext—completely client-side.</p>
          </div>
           <div class="grid gap-3 text-sm text-surface-600 dark:text-surface-300">
             <div class="flex items-center gap-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-xl px-4 py-3">
               <span class="text-xl">🛡️</span>
               <div>
                 <p class="font-semibold" data-i18n="tools.htpasswd-generator.ui.desc24">Zero trust by design</p>
                 <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.htpasswd-generator.ui.desc22">No network calls.</p>
               </div>
             </div>
             <div class="flex items-center gap-3 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-xl px-4 py-3">
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
        <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 space-y-5">
          <div class="space-y-2">
            <label for="username-input" class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide"><span data-i18n="tools.htpasswd-generator.ui.label7">Username</span></label>
            <input id="username-input" type="text" data-tooltip="Username for the htpasswd entry" data-i18n-tooltip="tools.htpasswd-generator.ui.tip0" class="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100" placeholder="deploy" data-i18n-placeholder="tools.htpasswd-generator.ui.placeholder11" autocomplete="off" />
          </div>

          <div class="space-y-2">
             <div class="flex items-center justify-between">
               <label for="password-input" class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide"><span data-i18n="tools.htpasswd-generator.ui.label8">Password</span></label>
              <div class="flex gap-2 text-xs text-surface-500 dark:text-surface-400">
                   <button id="toggle-password" type="button" class="btn btn-ghost btn-xs"><span data-i18n="tools.htpasswd-generator.ui.button0">Show</span></button>
                   <button id="generate-password" type="button" class="btn btn-ghost btn-xs text-primary-600 dark:text-primary-400"><span data-i18n="tools.htpasswd-generator.ui.button1">Generate strong</span></button>
                 </div>
             </div>
            <input id="password-input" type="password" data-tooltip="Password to hash for the entry" data-i18n-tooltip="tools.htpasswd-generator.ui.tip1" class="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 font-mono" placeholder="•••••••" autocomplete="new-password" />
          </div>

          <div class="space-y-2">
            <label for="algorithm-select" class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide"><span data-i18n="tools.htpasswd-generator.ui.label9">Algorithm</span> ${infoHint('Pick bcrypt/apr1/SHA1/plain to match your htpasswd setup; bcrypt is strongest.')}</label>
            <select id="algorithm-select" class="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-100">
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
            <input id="salt-input" type="text" maxlength="8" class="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 font-mono" placeholder="8 chars (./0-9A-Za-z)" data-i18n-placeholder="tools.htpasswd-generator.ui.placeholder12" />
          </div>

           <div id="htpasswd-error" class="hidden rounded-xl border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/30 text-sm text-danger-700 dark:text-danger-200 px-4 py-3">Error</div>

           <button id="generate-btn" class="btn btn-primary w-full"><span data-i18n="tools.htpasswd-generator.ui.button3">Generate entry</span></button>
        </div>

        <div class="space-y-6">
          <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-lg font-bold text-surface-900 dark:text-white" data-i18n="tools.htpasswd-generator.ui.heading18">Current entry</h2>
              <div class="flex gap-2">
                <button id="copy-entry" class="btn btn-secondary btn-sm" disabled><span data-i18n="tools.htpasswd-generator.ui.button4">Copy</span></button>
                <button id="download-entry" class="btn btn-secondary btn-sm" disabled><span data-i18n="tools.htpasswd-generator.ui.button5">Download</span></button>
              </div>
            </div>
            <pre id="entry-output" role="status" class="min-h-[80px] bg-surface-900 text-surface-100 p-4 rounded-xl overflow-x-auto text-sm" data-i18n="tools.htpasswd-generator.ui.desc26">No entry yet.</pre>
          </div>

          <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6">
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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
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

  const scripts = `
    <script src="/vendor/md5.min.js" integrity="sha384-JmVtRz6RWiXnA14QbIOJzPuU3MidULOpBP66deeLLyyoF4Tr/gZlbkHkL6vTthxH" crossorigin="anonymous"></script>
    <script src="/vendor/bcrypt.min.js" integrity="sha384-qGFE4FIJLgCFuYs3nzg39XpCtvT5AZUhaBdjB3e1+vpKQa03AkyWOyBSFb9OcQ/g" crossorigin="anonymous"></script>
    <script>
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

      const APR1_ALPHABET = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
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
          historyBody.innerHTML = '<tr><td class="py-3 text-surface-500" colspan="3">' + escapeHtml(translate('tools.htpasswd-generator.ui.desc27', 'Nothing generated yet.')) + '</td></tr>';
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
        const original = button.innerHTML;
        button.innerHTML = translate('common.copied', 'Copied!');
        window.setTimeout(function() {
          button.innerHTML = original;
        }, 1500);
      }

      function downloadEntry() {
        if (!currentEntry) return;
        const blob = new Blob([currentEntry + '\\n'], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = '.htpasswd';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(function() {
          URL.revokeObjectURL(url);
        }, 0);
      }

      function binaryStringFromBytes(bytes) {
        let binary = '';
        for (let index = 0; index < bytes.length; index += 1) {
          binary += String.fromCharCode(bytes[index]);
        }
        return binary;
      }

      async function buildShaEntry(password) {
        const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
        return '{SHA}' + btoa(binaryStringFromBytes(new Uint8Array(digest)));
      }

      function md5Raw(value) {
        if (typeof window.md5 !== 'function') {
          throw new Error('MD5 library not available. Reload and try again.');
        }
        return window.md5(value, null, true);
      }

      function apr1To64(value, length) {
        let output = '';
        let remaining = length;
        while (remaining > 0) {
          output += APR1_ALPHABET[value & 0x3f];
          value >>= 6;
          remaining -= 1;
        }
        return output;
      }

      function buildApr1Entry(password, suppliedSalt) {
        let salt = (suppliedSalt || generateApr1Salt()).split('$')[0].slice(0, 8);
        if (!salt) {
          salt = generateApr1Salt();
        }
        const magic = '$apr1$';
        let context = password + magic + salt;
        const alternate = md5Raw(password + salt + password);

        for (let remaining = password.length; remaining > 0; remaining -= 16) {
          context += alternate.substring(0, Math.min(16, remaining));
        }

        for (let remaining = password.length; remaining > 0; remaining >>= 1) {
          context += (remaining & 1) ? String.fromCharCode(0) : password.charAt(0);
        }

        let final = md5Raw(context);
        for (let index = 0; index < 1000; index += 1) {
          let next = '';
          next += (index & 1) ? password : final;
          if (index % 3) next += salt;
          if (index % 7) next += password;
          next += (index & 1) ? final : password;
          final = md5Raw(next);
        }

        const bytes = Array.from(final, function(character) {
          return character.charCodeAt(0) & 0xff;
        });

        const encoded =
          apr1To64((bytes[0] << 16) | (bytes[6] << 8) | bytes[12], 4) +
          apr1To64((bytes[1] << 16) | (bytes[7] << 8) | bytes[13], 4) +
          apr1To64((bytes[2] << 16) | (bytes[8] << 8) | bytes[14], 4) +
          apr1To64((bytes[3] << 16) | (bytes[9] << 8) | bytes[15], 4) +
          apr1To64((bytes[4] << 16) | (bytes[10] << 8) | bytes[5], 4) +
          apr1To64(bytes[11], 2);

        return magic + salt + '$' + encoded;
      }

      async function buildBcryptEntry(password) {
        const bcryptLib = (window.dcodeIO && window.dcodeIO.bcrypt) || window.bcrypt;
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

      async function buildHash(password) {
        switch (algorithmSelect.value) {
          case 'bcrypt':
            return buildBcryptEntry(password);
          case 'apr1':
            return buildApr1Entry(password, saltInput.value.trim());
          case 'sha':
            return buildShaEntry(password);
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

        if (/[:\\r\\n]/.test(username)) {
          showError('Username cannot contain colons or line breaks.');
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

        setButtonBusy(generateBtn, true, '<span>Generating…</span>');

        try {
          const hash = await buildHash(password);
          const entry = username + ':' + hash;
          updateCurrentEntry(entry);
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

      usernameInput.addEventListener('input', hideError);
      passwordInput.addEventListener('input', hideError);
      saltInput.addEventListener('input', hideError);

      updateCostLabel();
      updateAlgorithmOptions();
      saltInput.value = generateApr1Salt();
      renderHistory();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: '/htpasswd-generator',
    content,
    scripts,
    lang: currentLang
  });
}
