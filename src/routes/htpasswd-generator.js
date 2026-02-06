/**
 * HTPasswd Generator
 * Supports bcrypt (-B), Apache MD5 (-m), SHA1 (-s), and plaintext entries
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, infoHint } from '../utils/common-ui.js';

export async function handleHtpasswdRoutes(request, url) {
  const { pathname } = url;

  if (pathname === '/htpasswd-generator' || pathname === '/htpasswd-generator/') {
    if (request.method === 'GET') {
      return respondHTML(renderHtpasswdPage());
    }
    return respondJSON({ error: 'Method not allowed' }, { status: 405 });
  }

  return null;
}

function renderHtpasswdPage() {
  const content = `
    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <header class="bg-white/90 dark:bg-surface-900/80 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-8">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-300 mb-3" data-i18n="tools.htpasswd-generator.ui.desc20">Ops · Infra</p>
            <h1 class="text-4xl sm:text-5xl font-extrabold text-surface-900 dark:text-white mb-4">Htpasswd Entry Generator</h1>
            <p class="text-lg text-surface-600 dark:text-surface-300 max-w-2xl" data-i18n="tools.htpasswd-generator.ui.desc21">Generate production-ready htpasswd entries using bcrypt (-B), Apache MD5 (-m), SHA1 (-s), or plaintext—completely client-side.</p>
          </div>
          <div class="grid gap-3 text-sm text-surface-600 dark:text-surface-300">
            <div class="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-3">
              <span class="text-xl">🛡️</span>
              <div>
                <p class="font-semibold">Zero trust by design</p>
                <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.htpasswd-generator.ui.desc22">No network calls.</p>
              </div>
            </div>
            <div class="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl px-4 py-3">
              <span class="text-xl">⚙️</span>
              <div>
                <p class="font-semibold">Multiple algorithms</p>
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
            <input id="username-input" type="text" data-tooltip="Username for the htpasswd entry" class="w-full px-4 py-3 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100" placeholder="deploy" data-i18n-placeholder="tools.htpasswd-generator.ui.placeholder11" autocomplete="off" />
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label for="password-input" class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide"><span data-i18n="tools.htpasswd-generator.ui.label8">Password</span></label>
              <div class="flex gap-2 text-xs text-surface-500 dark:text-surface-400">
                <button id="toggle-password" type="button" class="hover:text-surface-900 dark:hover:text-white"><span data-i18n="tools.htpasswd-generator.ui.button0">Show</span></button>
                <button id="generate-password" type="button" class="hover:text-emerald-500"><span data-i18n="tools.htpasswd-generator.ui.button1">Generate strong</span></button>
              </div>
            </div>
            <input id="password-input" type="password" data-tooltip="Password to hash for the entry" class="w-full px-4 py-3 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 font-mono" placeholder="•••••••" autocomplete="new-password" />
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
              <label for="cost-slider"><span>Cost</span></label>
              <span id="cost-label">12 rounds</span>
            </div>
            <input id="cost-slider" type="range" aria-label="Bcrypt cost factor" data-tooltip="Higher cost = stronger hash but slower generation" min="8" max="15" value="12" class="w-full h-2 bg-surface-200 dark:bg-surface-800 rounded-lg" />
          </div>

          <div id="salt-options" class="space-y-2 hidden">
            <div class="flex justify-between items-center">
               <label for="salt-input" class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide"><span data-i18n="tools.htpasswd-generator.ui.label10">Salt</span> ${infoHint('Salt is 8 chars (./0-9A-Za-z) for apr1 hashes; randomize for uniqueness.')}</label>
              <button id="random-salt" type="button" class="text-xs text-surface-500 dark:text-surface-400 hover:text-purple-500"><span data-i18n="tools.htpasswd-generator.ui.button2">Randomize</span></button>
            </div>
            <input id="salt-input" type="text" maxlength="8" class="w-full px-4 py-3 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 font-mono" placeholder="8 chars (./0-9A-Za-z)" data-i18n-placeholder="tools.htpasswd-generator.ui.placeholder12" />
          </div>

          <div id="htpasswd-error" class="hidden rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-200 px-4 py-3">Error</div>

          <button id="generate-btn" class="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"><span data-i18n="tools.htpasswd-generator.ui.button3">Generate entry</span></button>
        </div>

        <div class="space-y-6">
          <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-6">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-lg font-bold text-surface-900 dark:text-white" data-i18n="tools.htpasswd-generator.ui.heading18">Current entry</h2>
              <div class="flex gap-2">
                <button id="copy-entry" class="px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-sm text-surface-700 dark:text-surface-200" disabled><span data-i18n="tools.htpasswd-generator.ui.button4">Copy</span></button>
                <button id="download-entry" class="px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700 text-sm text-surface-700 dark:text-surface-200" disabled><span data-i18n="tools.htpasswd-generator.ui.button5">Download</span></button>
              </div>
            </div>
            <pre id="entry-output" class="min-h-[80px] bg-surface-900 text-surface-100 p-4 rounded-2xl overflow-x-auto text-sm">No entry yet.</pre>
          </div>

          <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-6">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-lg font-bold text-surface-900 dark:text-white" data-i18n="tools.htpasswd-generator.ui.heading19">Recent history</h2>
              <button id="clear-history" class="text-xs text-surface-500 dark:text-surface-400 hover:text-rose-500"><span data-i18n="tools.htpasswd-generator.ui.button6">Clear</span></button>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="text-xs uppercase tracking-widest text-surface-500">
                  <tr>
                    <th class="py-2 text-left">Username</th>
                    <th class="py-2 text-left">Algorithm</th>
                    <th class="py-2 text-left" data-i18n="tools.htpasswd-generator.ui.th17">Actions</th>
                  </tr>
                </thead>
                <tbody id="history-body" class="divide-y divide-surface-100 dark:divide-surface-800 text-surface-700 dark:text-surface-200">
                  <tr><td class="py-3 text-surface-500" colspan="3">Nothing generated yet.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>

    <script src="/vendor/bcrypt.min.js" integrity="sha384-qGFE4FIJLgCFuYs3nzg39XpCtvT5AZUhaBdjB3e1+vpKQa03AkyWOyBSFb9OcQ/g" crossorigin="anonymous"></script>
    <script src="/vendor/md5.min.js" integrity="sha384-F0j98TCJcD9D2MLRq8QYONEYfgs+t6PZhSBeWX5hveT8h7vY0ykuYP1EUPr9ijq5" crossorigin="anonymous"></script>
    <script>
      (function() {
        const usernameInput = document.getElementById('username-input');
        const passwordInput = document.getElementById('password-input');
        const algorithmSelect = document.getElementById('algorithm-select');
        const generateBtn = document.getElementById('generate-btn');
        const togglePasswordBtn = document.getElementById('toggle-password');
        const generatePasswordBtn = document.getElementById('generate-password');
        const costSlider = document.getElementById('cost-slider');
        const costLabel = document.getElementById('cost-label');
        const saltSection = document.getElementById('salt-options');
        const saltInput = document.getElementById('salt-input');
        const randomSaltBtn = document.getElementById('random-salt');
        const bcryptSection = document.getElementById('bcrypt-options');
        const errorBox = document.getElementById('htpasswd-error');
        const entryOutput = document.getElementById('entry-output');
        const copyBtn = document.getElementById('copy-entry');
        const downloadBtn = document.getElementById('download-entry');
        const historyBody = document.getElementById('history-body');
        const clearHistoryBtn = document.getElementById('clear-history');

        let generating = false;
        let currentLine = '';
        let history = [];

        algorithmSelect.addEventListener('change', handleAlgorithmChange);
        costSlider.addEventListener('input', () => costLabel.textContent = costSlider.value + ' rounds');
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
        generatePasswordBtn.addEventListener('click', () => {
          passwordInput.value = generateRandomPassword();
        });
        randomSaltBtn.addEventListener('click', () => {
          saltInput.value = generateSalt();
        });
        copyBtn.addEventListener('click', copyEntry);
        downloadBtn.addEventListener('click', downloadEntry);
        clearHistoryBtn.addEventListener('click', () => {
          history = [];
          renderHistory();
        });
        generateBtn.addEventListener('click', async (event) => {
          event.preventDefault();
          if (generating) return;
          await generateEntry();
        });

        costLabel.textContent = costSlider.value + ' rounds';
        handleAlgorithmChange();

        function handleAlgorithmChange() {
          const algorithm = algorithmSelect.value;
          const showSalt = algorithm === 'apr1';
          const showBcrypt = algorithm === 'bcrypt';
          saltSection.classList.toggle('hidden', !showSalt);
          bcryptSection.classList.toggle('hidden', !showBcrypt);
        }

        function togglePasswordVisibility() {
          const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
          passwordInput.setAttribute('type', type);
          togglePasswordBtn.textContent = type === 'password' ? 'Show' : 'Hide';
        }

        async function generateEntry() {
          const username = usernameInput.value.trim();
          const password = passwordInput.value;
          const algorithm = algorithmSelect.value;

          if (!username) {
            return showError('Username is required.');
          }
          if (!password) {
            return showError('Password is required.');
          }
          showError('');
          setLoading(true);

          try {
            let hash;
            if (algorithm === 'bcrypt') {
              const cost = Number(costSlider.value) || 12;
              hash = await generateBcrypt(password, cost);
            } else if (algorithm === 'apr1') {
              const salt = sanitizeSalt(saltInput.value) || generateSalt();
              saltInput.value = salt;
              hash = generateApr1(password, salt);
            } else if (algorithm === 'sha') {
              hash = await generateSha(password);
            } else {
              hash = password;
            }

            currentLine = username + ':' + hash;
            entryOutput.textContent = currentLine;
            copyBtn.disabled = downloadBtn.disabled = false;
            pushHistory({ username, algorithm, line: currentLine });
          } catch (error) {
            showError(error.message);
          } finally {
            setLoading(false);
          }
        }

        function showError(message) {
          if (!message) {
            errorBox.classList.add('hidden');
            return;
          }
          errorBox.textContent = message;
          errorBox.classList.remove('hidden');
        }

        function setLoading(state) {
          generating = state;
          generateBtn.disabled = state;
          generateBtn.textContent = state ? 'Generating…' : 'Generate entry';
        }

        async function generateBcrypt(password, cost) {
          return new Promise((resolve, reject) => {
            try {
              const salt = dcodeIO.bcrypt.genSaltSync(cost);
              const hash = dcodeIO.bcrypt.hashSync(password, salt);
              resolve(hash);
            } catch (error) {
              reject(new Error('Bcrypt computation failed.'));
            }
          });
        }

        function generateApr1(password, salt) {
          if (!window.md5) {
            throw new Error('MD5 library failed to load.');
          }
          const magic = '$apr1$';
          const cleanSalt = salt.slice(0, 8);
          const ctx = password + magic + cleanSalt;
          let final = md5Raw(password + cleanSalt + password);
          let composite = ctx;
          for (let i = password.length; i > 0; i -= 16) {
            composite += final.substring(0, Math.min(16, i));
          }
          for (let i = password.length; i > 0; i >>= 1) {
            composite += (i & 1) ? '\\0' : password.charAt(0);
          }
          final = md5Raw(composite);
          for (let i = 0; i < 1000; i++) {
            let mix = '';
            mix += (i & 1) ? password : final;
            if (i % 3) mix += cleanSalt;
            if (i % 7) mix += password;
            mix += (i & 1) ? final : password;
            final = md5Raw(mix);
          }

          const itoa64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
          const to64 = (value, length) => {
            let output = '';
            let v = value;
            for (let i = 0; i < length; i++) {
              output += itoa64[v & 0x3f];
              v >>= 6;
            }
            return output;
          };

          const bytes = (index) => final.charCodeAt(index);

          const hash =
            to64((bytes(0) << 16) | (bytes(6) << 8) | bytes(12), 4) +
            to64((bytes(1) << 16) | (bytes(7) << 8) | bytes(13), 4) +
            to64((bytes(2) << 16) | (bytes(8) << 8) | bytes(14), 4) +
            to64((bytes(3) << 16) | (bytes(9) << 8) | bytes(15), 4) +
            to64((bytes(4) << 16) | (bytes(10) << 8) | bytes(5), 4) +
            to64(bytes(11), 2);

          return magic + cleanSalt + '$' + hash;
        }

        async function generateSha(password) {
          const data = new TextEncoder().encode(password);
          const digest = await crypto.subtle.digest('SHA-1', data);
          return '{SHA}' + bufferToBase64(digest);
        }

        function md5Raw(value) {
          return window.md5(value, null, true);
        }

        function bufferToBase64(buffer) {
          const bytes = new Uint8Array(buffer);
          let binary = '';
          bytes.forEach(byte => binary += String.fromCharCode(byte));
          return btoa(binary);
        }

        function sanitizeSalt(value) {
          return value.replace(/[^A-Za-z0-9./]/g, '').slice(0, 8);
        }

        function generateSalt() {
          const alphabet = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
          return Array.from(crypto.getRandomValues(new Uint8Array(8))).map(byte => alphabet[byte % alphabet.length]).join('');
        }

        function generateRandomPassword() {
          const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^*_-';
          return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(byte => alphabet[byte % alphabet.length]).join('');
        }

        function pushHistory(entry) {
          history.unshift(entry);
          history = history.slice(0, 5);
          renderHistory();
        }

        function renderHistory() {
          if (!history.length) {
          historyBody.innerHTML = '<tr><td class="py-3 text-surface-500" colspan="3">Nothing generated yet.</td></tr>';
            return;
          }
          historyBody.innerHTML = history.map((item, index) => {
            return '<tr><td class="py-2 pr-4 font-semibold">' + escapeHtml(item.username) + '</td><td class="py-2 pr-4">' + item.algorithm.toUpperCase() + '</td><td class="py-2"><button data-history="' + index + '" class="copy-history text-sm text-emerald-600 dark:text-emerald-300"><span data-i18n="tools.htpasswd-generator.ui.button4">Copy</span></button></td></tr>';
          }).join('');
          document.querySelectorAll('.copy-history').forEach(button => {
            button.addEventListener('click', () => {
              const index = Number(button.getAttribute('data-history'));
              const entry = history[index];
              navigator.clipboard.writeText(entry.line);
              button.textContent = _t('tools.htpasswd-generator.js.text0', 'Copied');
              setTimeout(() => button.textContent = _t('tools.htpasswd-generator.js.text1', 'Copy'), 1500);
            });
          });
        }

        function copyEntry() {
          if (!currentLine) return;
          navigator.clipboard.writeText(currentLine);
          copyBtn.textContent = _t('tools.htpasswd-generator.js.text2', 'Copied!');
          setTimeout(() => copyBtn.textContent = _t('tools.htpasswd-generator.js.text1', 'Copy'), 1500);
        }

        function downloadEntry() {
          if (!currentLine) return;
        const blob = new Blob([currentLine + '\\n'], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = '.htpasswd';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        function escapeHtml(value) {
          if (value === null || value === undefined) {
            return '';
          }
          return String(value).replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
        }
      })();
    </script>
  `;

  return createPageTemplate({
    title: 'Htpasswd Entry Generator',
    description: 'Create bcrypt, apr1-md5, SHA, or plaintext htpasswd entries securely in your browser.',
    path: '/htpasswd-generator',
    content
  });
}
