/**
 * Password Generator Tool - Client-side only implementation
 * All generation happens in the browser for maximum privacy
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handlePasswordGeneratorRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    // Serve the UI
    if (pathname === '/password-generator' || pathname === '/password-generator/') {
      if (method === 'GET') {
        return renderPasswordGeneratorPage(resolveRequestLanguage(request, url));
      }
    }

    // API endpoints are disabled - all features are client-side only
    if (pathname.startsWith('/api/password') || pathname.startsWith('/api/username') ||
      pathname.startsWith('/api/passphrase') || pathname.startsWith('/api/email') ||
      pathname.startsWith('/api/cyberchef') || pathname.startsWith('/api/qr')) {
      return respondJSON({
        error: 'API access disabled',
        message: 'This tool operates entirely client-side for privacy. All generation happens in your browser.',
        available: false
      }, { status: 403 });
    }

    return respondJSON({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Password Generator Route Error:', error);
    return respondJSON(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function renderPasswordGeneratorPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('password-generator', currentLang);
  const toolHeader = createToolHeader(
    { emoji: '🔐' },
    translation?.name || 'Password Generator',
    translation?.desc || 'Create secure passwords, usernames, and passphrases with advanced customization options.',
    [{ text: translation?.ui?.badge35 || 'Client-Side Only', color: 'blue', tooltip: 'Runs entirely in your browser using Web APIs — your data never leaves your device.' }],
    { toolId: 'password-generator' }
  );

  const currentTool = TOOLS.find(t => t.id === 'password-generator');
    const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];


  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">

        ${toolHeader}

        <!-- Tabs -->
        <div class="border-b border-surface-200 dark:border-surface-700 mb-8">
          <nav class="flex flex-wrap gap-2" aria-label="Password generator modes" role="tablist">
            <button id="tab-trigger-password" class="tab-button active px-4 py-2 border-b-2 border-primary-600 font-medium text-sm text-primary-600 dark:text-primary-400 transition-colors" data-tab="password" role="tab" aria-controls="tab-password" aria-selected="true" tabindex="0">
              <span class="material-symbols-rounded text-base align-middle">lock</span> <span data-i18n="tools.password-generator.ui.tab0">Password</span>
            </button>
            <button id="tab-trigger-username" class="tab-button px-4 py-2 border-b-2 border-transparent font-medium text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 transition-colors" data-tab="username" role="tab" aria-controls="tab-username" aria-selected="false" tabindex="-1">
              <span class="material-symbols-rounded text-base align-middle">person</span> <span data-i18n="tools.password-generator.ui.tab1">Username</span>
            </button>
            <button id="tab-trigger-passphrase" class="tab-button px-4 py-2 border-b-2 border-transparent font-medium text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 transition-colors" data-tab="passphrase" role="tab" aria-controls="tab-passphrase" aria-selected="false" tabindex="-1">
              <span class="material-symbols-rounded text-base align-middle">description</span> <span data-i18n="tools.password-generator.ui.tab2">Passphrase</span>
            </button>
            <button id="tab-trigger-email" class="tab-button px-4 py-2 border-b-2 border-transparent font-medium text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 transition-colors" data-tab="email" role="tab" aria-controls="tab-email" aria-selected="false" tabindex="-1">
              <span class="material-symbols-rounded text-base align-middle">email</span> <span data-i18n="tools.password-generator.ui.tab3">Email</span>
            </button>
          </nav>
        </div>

        <!-- Password Tab -->
        <div id="tab-password" class="tab-content" role="tabpanel" aria-labelledby="tab-trigger-password">
          <div class="space-y-6">
            <div>
              <label for="password-length" class="label">
                <span data-i18n="tools.password-generator.ui.label0">Password Length:</span> <span id="length-value" class="font-bold text-primary-600 dark:text-primary-400">16</span>
              </label>
              <input type="range" id="password-length" min="8" max="128" value="16" class="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-600" data-tooltip="Longer passwords are stronger. 16+ characters recommended" data-i18n-tooltip="tools.password-generator.ui.tip0">
            </div>

            <div class="grid grid-cols-2 gap-4">
              <label class="flex items-center space-x-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700">
                <input type="checkbox" id="use-uppercase" checked class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500">
                <span class="text-sm font-medium text-surface-900 dark:text-surface-100" data-i18n="tools.password-generator.ui.desc24" data-tooltip="26 uppercase letters increase entropy" data-i18n-tooltip="tools.password-generator.ui.tip1">Uppercase (A-Z)</span>
              </label>
              <label class="flex items-center space-x-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700">
                <input type="checkbox" id="use-lowercase" checked class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500">
                <span class="text-sm font-medium text-surface-900 dark:text-surface-100" data-i18n="tools.password-generator.ui.desc25" data-tooltip="26 lowercase letters increase entropy" data-i18n-tooltip="tools.password-generator.ui.tip2">Lowercase (a-z)</span>
              </label>
              <label class="flex items-center space-x-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700">
                <input type="checkbox" id="use-numbers" checked class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500">
                <span class="text-sm font-medium text-surface-900 dark:text-surface-100" data-i18n="tools.password-generator.ui.desc26" data-tooltip="10 digits add variety to your password" data-i18n-tooltip="tools.password-generator.ui.tip3">Numbers (0-9)</span>
              </label>
              <label class="flex items-center space-x-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700">
                <input type="checkbox" id="use-symbols" checked class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500">
                <span class="text-sm font-medium text-surface-900 dark:text-surface-100" data-i18n="tools.password-generator.ui.desc27" data-tooltip="Special characters greatly increase password strength" data-i18n-tooltip="tools.password-generator.ui.tip4">Symbols (!@#$)</span>
              </label>
            </div>

             <div id="pw-error" role="alert" class="hidden rounded-lg border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/30 text-sm text-error-700 dark:text-error-200 px-4 py-3"></div>

            <button id="generate-password" class="btn btn-primary w-full py-4 text-lg">
              <span data-i18n="tools.password-generator.ui.button0">Generate Password</span>
            </button>

              <div id="password-result" class="hidden">
                <div class="bg-success-50 dark:bg-success-900/20 rounded-lg p-6 border border-success-200 dark:border-success-800">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <p class="text-sm text-surface-600 dark:text-surface-400 mb-2" data-i18n="tools.password-generator.ui.desc28">Your Password:</p>
                    <p id="password-output" class="text-2xl font-mono font-bold text-surface-900 dark:text-white break-all"></p>
                  </div>
                   <button id="copy-password" class="flex-shrink-0 btn btn-secondary" aria-label="Copy password to clipboard">
                     <span class="material-symbols-rounded">content_copy</span>
                   </button>
                </div>
                <div id="password-strength" class="mt-4">
                  <!-- Segmented strength bar -->
                  <div class="flex items-center gap-3">
                    <div class="flex gap-1 flex-1" id="strength-segments" role="meter" aria-label="Password strength" aria-valuemin="0" aria-valuemax="4" aria-valuenow="0">
                      <div class="strength-seg h-2 flex-1 rounded-full bg-surface-200 dark:bg-surface-700 transition-all duration-300"></div>
                      <div class="strength-seg h-2 flex-1 rounded-full bg-surface-200 dark:bg-surface-700 transition-all duration-300"></div>
                      <div class="strength-seg h-2 flex-1 rounded-full bg-surface-200 dark:bg-surface-700 transition-all duration-300"></div>
                      <div class="strength-seg h-2 flex-1 rounded-full bg-surface-200 dark:bg-surface-700 transition-all duration-300"></div>
                    </div>
                    <span id="strength-label" class="text-sm font-semibold whitespace-nowrap"></span>
                  </div>
                  <p id="strength-detail" class="text-xs text-surface-500 dark:text-surface-400 mt-1.5"></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Username Tab -->
        <div id="tab-username" class="tab-content hidden" role="tabpanel" aria-labelledby="tab-trigger-username">
          <div class="space-y-6">
            <div>
              <label for="username-length" class="label">
                <span data-i18n="tools.password-generator.ui.label1">Username Length:</span> <span id="username-length-value" class="font-bold text-primary-600 dark:text-primary-400">12</span>
              </label>
              <input type="range" id="username-length" min="6" max="32" value="12" class="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-600">
            </div>

            <div>
              <label for="username-style" class="label"><span data-i18n="tools.password-generator.ui.label5">Style</span></label>
              <select id="username-style" class="input">
                <option value="readable" data-i18n="tools.password-generator.ui.option17">Readable (syllable-based)</option>
                <option value="secure" data-i18n="tools.password-generator.ui.option18">Secure (random)</option>
                <option value="color" data-i18n="tools.password-generator.ui.option19">Color (hex-based)</option>
              </select>
            </div>

            <label class="flex items-center space-x-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700">
              <input type="checkbox" id="username-include-numbers" checked class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500">
              <span class="text-sm font-medium text-surface-900 dark:text-surface-100" data-i18n="tools.password-generator.ui.desc29">Include numbers</span>
            </label>

            <button id="generate-username" class="btn btn-primary w-full py-4 text-lg">
              <span data-i18n="tools.password-generator.ui.button1">Generate Username</span>
            </button>

             <div id="username-result" class="hidden">
               <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-6 border border-surface-200 dark:border-surface-700">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <p class="text-sm text-surface-600 dark:text-surface-400 mb-2" data-i18n="tools.password-generator.ui.desc30">Your Username:</p>
                    <p id="username-output" class="text-2xl font-mono font-bold text-surface-900 dark:text-white break-all"></p>
                  </div>
                   <button id="copy-username" class="flex-shrink-0 btn btn-secondary" aria-label="Copy username to clipboard">
                     <span class="material-symbols-rounded">content_copy</span>
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Passphrase Tab -->
        <div id="tab-passphrase" class="tab-content hidden" role="tabpanel" aria-labelledby="tab-trigger-passphrase">
          <div class="space-y-6">
            <div>
              <label for="passphrase-words" class="label">
                <span data-i18n="tools.password-generator.ui.label2">Word Count:</span> <span id="passphrase-words-value" class="font-bold text-primary-600 dark:text-primary-400">4</span>
              </label>
              <input type="range" id="passphrase-words" min="3" max="8" value="4" class="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-600">
            </div>

            <div>
              <label for="passphrase-separator" class="label"><span data-i18n="tools.password-generator.ui.label6">Separator</span></label>
              <input type="text" id="passphrase-separator" value="-" maxlength="3" class="input">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label class="flex items-center space-x-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700">
                <input type="checkbox" id="passphrase-capitalize" checked class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500">
                <span class="text-sm font-medium text-surface-900 dark:text-surface-100" data-i18n="tools.password-generator.ui.desc31">Capitalize words</span>
              </label>
              <label class="flex items-center space-x-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700">
                <input type="checkbox" id="passphrase-include-numbers" class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500">
                <span class="text-sm font-medium text-surface-900 dark:text-surface-100" data-i18n="tools.password-generator.ui.desc29">Include numbers</span>
              </label>
            </div>

            <button id="generate-passphrase" class="btn btn-primary w-full py-4 text-lg">
              <span data-i18n="tools.password-generator.ui.button2">Generate Passphrase</span>
            </button>

             <div id="passphrase-result" class="hidden">
               <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-6 border border-surface-200 dark:border-surface-700">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <p class="text-sm text-surface-600 dark:text-surface-400 mb-2" data-i18n="tools.password-generator.ui.desc32">Your Passphrase:</p>
                    <p id="passphrase-output" class="text-2xl font-mono font-bold text-surface-900 dark:text-white break-all"></p>
                  </div>
                   <button id="copy-passphrase" class="flex-shrink-0 btn btn-secondary" aria-label="Copy passphrase to clipboard">
                     <span class="material-symbols-rounded">content_copy</span>
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Email Tools Tab -->
        <div id="tab-email" class="tab-content hidden" role="tabpanel" aria-labelledby="tab-trigger-email">
          <h3 class="text-xl font-semibold text-surface-900 dark:text-white mb-6" data-i18n="tools.password-generator.ui.heading22">📬 Catch-all Address</h3>
          <div class="space-y-6">
            <div>
              <label for="email-prefix" class="label"><span data-i18n="tools.password-generator.ui.label7">Custom Prefix (optional)</span></label>
              <input type="text" id="email-prefix" placeholder="Leave empty for random" data-i18n-placeholder="tools.password-generator.ui.placeholder15" class="input">
            </div>

            <div>
              <label for="email-domain" class="label"><span data-i18n="tools.password-generator.ui.label8">Custom Domain (optional)</span></label>
              <input type="text" id="email-domain" placeholder="example.com" class="input">
            </div>

            <div>
              <label for="email-prefix-length" class="label">
                Random Prefix Length: <span id="email-prefix-length-value" class="font-bold text-primary-600 dark:text-primary-400">12</span>
              </label>
              <input type="range" id="email-prefix-length" min="6" max="20" value="12" class="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-600">
            </div>

            <div>
              <label for="email-style" class="label"><span data-i18n="tools.password-generator.ui.label5">Style</span></label>
              <select id="email-style" class="input">
                <option value="random" data-i18n="tools.password-generator.ui.option20">Secure random</option>
                <option value="syllable" data-i18n="tools.password-generator.ui.option21">Pronounceable</option>
              </select>
            </div>

            <button id="generate-catchall" class="btn btn-primary w-full py-4 text-lg">
              <span data-i18n="tools.password-generator.ui.button3">Generate Catch-all Email</span>
            </button>

             <div id="catchall-result" class="hidden">
               <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-6 border border-surface-200 dark:border-surface-700">
                 <div class="flex items-start justify-between gap-4">
                   <div class="flex-1">
                     <p class="text-sm text-surface-600 dark:text-surface-400 mb-2" data-i18n="tools.password-generator.ui.desc33">Catch-all Email:</p>
                     <p id="catchall-output" class="text-xl font-mono font-bold text-surface-900 dark:text-white break-all"></p>
                   </div>
                    <button id="copy-catchall" class="flex-shrink-0 btn btn-secondary" aria-label="Copy catch-all email to clipboard">
                      <span class="material-symbols-rounded">content_copy</span>
                    </button>
                 </div>
               </div>
             </div>
          </div>

          <hr class="my-8 border-surface-200 dark:border-surface-700">

          <h3 class="text-xl font-semibold text-surface-900 dark:text-white mb-6" data-i18n="tools.password-generator.ui.heading23">➕ Plus Alias</h3>
          <div class="space-y-6">
            <div>
              <label for="alias-base-email" class="label"><span data-i18n="tools.password-generator.ui.label9">Base Email Address</span></label>
              <input type="email" id="alias-base-email" placeholder="user@example.com" data-i18n-placeholder="tools.password-generator.ui.placeholder16" required class="input">
            </div>

            <div>
              <label for="alias-tag-length" class="label">
                Tag Length: <span id="alias-tag-length-value" class="font-bold text-primary-600 dark:text-primary-400">6</span>
              </label>
              <input type="range" id="alias-tag-length" min="2" max="16" value="6" class="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-600">
            </div>

             <div id="alias-error" role="alert" class="hidden rounded-lg border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/30 text-sm text-error-700 dark:text-error-200 px-4 py-3"></div>

            <button id="generate-alias" class="btn btn-primary w-full py-4 text-lg">
              <span data-i18n="tools.password-generator.ui.button4">Generate Plus Alias</span>
            </button>

             <div id="alias-result" class="hidden">
               <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-6 border border-surface-200 dark:border-surface-700">
                 <div class="flex items-start justify-between gap-4">
                   <div class="flex-1">
                     <p class="text-sm text-surface-600 dark:text-surface-400 mb-2" data-i18n="tools.password-generator.ui.desc34">Plus Alias:</p>
                     <p id="alias-output" class="text-xl font-mono font-bold text-surface-900 dark:text-white break-all"></p>
                   </div>
                    <button id="copy-alias" class="flex-shrink-0 btn btn-secondary" aria-label="Copy email alias to clipboard">
                      <span class="material-symbols-rounded">content_copy</span>
                    </button>
                 </div>
               </div>
             </div>
          </div>
        </div>

      </div>

      ${createEducationalSection([
        {
          title: 'What Makes a Password Secure?',
          content: `
            <p>A secure password is your first line of defense against unauthorized access. In the modern era of high-speed computing, "secure" is defined by <strong>entropy</strong>—the measure of randomness and unpredictability in a string. A strong password should be long (at least 16 characters), unique to every account, and composed of a diverse set of character types including uppercase, lowercase, numbers, and symbols.</p>
            <p>Avoid using personal information like birthdays, pet names, or common dictionary words. Even complex-looking substitutions like "P@ssw0rd123" are easily cracked by modern brute-force tools that use massive dictionaries of common patterns.</p>
          `
        },
        {
          title: 'How to Use This Tool',
          content: `
            <ol>
              <li><strong>Select your mode:</strong> Choose between Password, Username, Passphrase, or Email Alias depending on your needs.</li>
              <li><strong>Adjust length:</strong> Use the slider to set the desired length. For passwords, 16+ characters is recommended for high security.</li>
              <li><strong>Configure options:</strong> Toggle character sets (symbols, numbers, etc.) or styles (readable vs. secure).</li>
              <li><strong>Generate:</strong> Click the "Generate" button to create your unique credential.</li>
              <li><strong>Copy:</strong> Use the copy icon to safely move the result to your clipboard or password manager.</li>
            </ol>
          `
        },
        {
          title: 'Common Use Cases',
          content: `
            <ul>
              <li><strong>Account Security:</strong> Generating unique, high-entropy passwords for every online service you use.</li>
              <li><strong>System Administration:</strong> Creating secure temporary passwords for new users or service accounts.</li>
              <li><strong>Privacy Protection:</strong> Using "Plus Aliases" (e.g., user+service@domain.com) to track which services sell your data or to filter spam.</li>
              <li><strong>Memorable Security:</strong> Using the Passphrase generator for master passwords that need to be typed manually but remain resistant to cracking.</li>
            </ul>
          `
        },
        {
          title: 'Pro Tips',
          content: `
            <ul>
              <li><strong>Use a Password Manager:</strong> Never try to memorize complex passwords. Use this tool to generate them, and store them in a reputable password manager like Bitwarden, 1Password, or KeePassXC.</li>
              <li><strong>Entropy over Complexity:</strong> Length is often more important than character variety. A 20-character lowercase password is often harder to crack than an 8-character "complex" one.</li>
              <li><strong>Rotate on Breach:</strong> If a service you use is compromised, use this generator to create a completely new, unrelated password immediately.</li>
            </ul>
          `
        }
      ], 'password-generator')}
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'What Makes a Password Secure?',
          content: '<p>A secure password is your first line of defense against unauthorized access. In the modern era of high-speed computing, "secure" is defined by <strong>entropy</strong>—the measure of randomness and unpredictability in a string. A strong password should be long (at least 16 characters), unique to every account, and composed of a diverse set of character types including uppercase, lowercase, numbers, and symbols.</p><p>Avoid using personal information like birthdays, pet names, or common dictionary words. Even complex-looking substitutions like "P@ssw0rd123" are easily cracked by modern brute-force tools that use massive dictionaries of common patterns.</p>'
        },
        {
          title: 'Entropy Explained',
          content: '<p>Entropy is a measure of the randomness and unpredictability of a password, typically expressed in bits. The higher the entropy, the stronger the password. For example, a 10-character password using only lowercase letters has much lower entropy than a 10-character password using a full set of alphanumeric and special characters.</p><p>Our generator calculates entropy in real-time to give you an objective measure of your password\'s strength. A password with over 100 bits of entropy is considered exceptionally strong and resistant to modern cracking techniques.</p>'
        },
        {
          title: 'Best Practices',
          content: '<ul><li><strong>Never Reuse Passwords:</strong> Use a unique password for every single account. If one service is breached, your other accounts remain safe.</li><li><strong>Use a Password Manager:</strong> Since humans can\'t remember dozens of complex, unique passwords, use a reputable password manager to store them securely.</li><li><strong>Enable MFA:</strong> Multi-Factor Authentication adds a critical second layer of security even if your password is compromised.</li><li><strong>Avoid Personal Info:</strong> Never include names, birthdays, or common words that can be found in a dictionary.</li></ul>'
        },
        {
          title: 'Pro Tips',
          content: '<ul><li>Use the "Passphrase" mode for accounts you need to type manually; they are easier to remember but still highly secure.</li><li>For maximum security, generate the longest password allowed by the service (often 64 or 128 characters).</li><li>Regularly audit your saved passwords using your password manager\'s built-in security check features.</li><li>Consider using "Plus Aliases" (e.g., user+service@gmail.com) to track which services sell your data or send spam.</li></ul>'
        }
      ], 'password-generator')}
    ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const script = `
    <script>
      // Tab switching with accessibility enhancements
      const tabList = document.querySelector('[role="tablist"]');
      const tabButtons = tabList ? Array.from(tabList.querySelectorAll('.tab-button')) : [];

      const activateTab = (button) => {
        if (!button) return;

        const targetId = button.dataset.tab;
        const targetPanelId = 'tab-' + targetId;

        tabButtons.forEach((btn) => {
          const isTarget = btn === button;
          btn.classList.toggle('active', isTarget);
          btn.classList.toggle('border-primary-600', isTarget);
          btn.classList.toggle('text-primary-600', isTarget);
          btn.classList.toggle('dark:text-primary-400', isTarget);
          btn.classList.toggle('border-transparent', !isTarget);
          
          btn.setAttribute('aria-selected', String(isTarget));
          btn.setAttribute('tabindex', isTarget ? '0' : '-1');
        });

        document.querySelectorAll('.tab-content').forEach(panel => {
           const isTarget = panel.id === targetPanelId;
           panel.classList.toggle('hidden', !isTarget);
           panel.setAttribute('aria-hidden', String(!isTarget));
        });

        button.focus({ preventScroll: true });
      };

      tabButtons.forEach((button, index) => {
        button.addEventListener('click', () => activateTab(button));
        button.addEventListener('keydown', (event) => {
          const { key } = event;
          const lastIndex = tabButtons.length - 1;

          if (key === 'ArrowRight' || key === 'ArrowLeft') {
            event.preventDefault();
            const direction = key === 'ArrowRight' ? 1 : -1;
            const nextIndex = (index + direction + tabButtons.length) % tabButtons.length;
            activateTab(tabButtons[nextIndex]);
          } else if (key === 'Home') {
            event.preventDefault();
            activateTab(tabButtons[0]);
          } else if (key === 'End') {
            event.preventDefault();
            activateTab(tabButtons[lastIndex]);
          }
        });
      });

      // Utility: Copy function using common-ui
      // (Assuming copyToClipboard is available globally from common-ui via template)
      
      function copyText(elementId, buttonId) {
         const text = document.getElementById(elementId).textContent;
         const btn = document.getElementById(buttonId);
         if(window.copyToClipboard) {
             window.copyToClipboard(text, btn);
         } else {
             navigator.clipboard.writeText(text).then(() => {
                 if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
                 const original = btn.innerHTML;
                 btn.innerHTML = '✓';
                 setTimeout(() => btn.innerHTML = original, 2000);
             });
         }
      }

      // Password length slider
      const lengthSlider = document.getElementById('password-length');
      const lengthValue = document.getElementById('length-value');
      lengthSlider?.addEventListener('input', (e) => {
        lengthValue.textContent = e.target.value;
      });

      // Password generation
      document.getElementById('generate-password')?.addEventListener('click', () => {
        const length = parseInt(lengthSlider.value);
        const useUppercase = document.getElementById('use-uppercase').checked;
        const useLowercase = document.getElementById('use-lowercase').checked;
        const useNumbers = document.getElementById('use-numbers').checked;
        const useSymbols = document.getElementById('use-symbols').checked;

        // Build character sets
        const charsets = [];
        if (useUppercase) charsets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
        if (useLowercase) charsets.push('abcdefghijklmnopqrstuvwxyz');
        if (useNumbers) charsets.push('0123456789');
        if (useSymbols) charsets.push('!@#$%^&*()_+-=[]{}|;:,.<>?');

         if (charsets.length === 0) {
           document.getElementById('pw-error').textContent = _t('tools.password-generator.js.text0', 'Please select at least one character type.');
           document.getElementById('pw-error').classList.remove('hidden');
           return;
         }

         // Ensure minimum length
         if (length < charsets.length) {
           document.getElementById('pw-error').textContent = _t('tools.password-generator.js.alert2', 'Password length too short for selected options.');
           document.getElementById('pw-error').classList.remove('hidden');
           return;
         }

        // Combine all charsets
        const allChars = charsets.join('');
        const passwordArray = [];

        // Guarantee representation
        for (const charset of charsets) {
          const randomBytes = crypto.getRandomValues(new Uint32Array(1));
          passwordArray.push(charset[randomBytes[0] % charset.length]);
        }

        // Fill remaining
        const remaining = length - charsets.length;
        const remainingBytes = crypto.getRandomValues(new Uint32Array(remaining));
        for (let i = 0; i < remaining; i++) {
          passwordArray.push(allChars[remainingBytes[i] % allChars.length]);
        }

        // Shuffle
        for (let i = passwordArray.length - 1; i > 0; i--) {
          const randomBytes = crypto.getRandomValues(new Uint32Array(1));
          const j = randomBytes[0] % (i + 1);
          [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
        }

         const password = passwordArray.join('');

         // Display result
         document.getElementById('pw-error').classList.add('hidden');
         document.getElementById('password-output').textContent = password;
         document.getElementById('password-result').classList.remove('hidden');

        // Calculate strength and drive the segmented meter
        const entropy = password.length * Math.log2(allChars.length);
        const segments = document.querySelectorAll('.strength-seg');
        const strengthLabel = document.getElementById('strength-label');
        const strengthDetail = document.getElementById('strength-detail');
        const segmentsContainer = document.getElementById('strength-segments');

        // Determine level: 0=weak, 1=fair, 2=good, 3=strong
        let level = 0, label = '', color = '';
        if (entropy >= 100) {
          level = 4; label = _t('tools.password-generator.js.status3', 'Strong'); color = '#16a34a';
        } else if (entropy >= 60) {
          level = 3; label = _t('tools.password-generator.js.status4', 'Good'); color = '#2563eb';
        } else if (entropy >= 40) {
          level = 2; label = _t('tools.password-generator.js.status5', 'Fair'); color = '#d97706';
        } else {
          level = 1; label = _t('tools.password-generator.js.status6', 'Weak'); color = '#dc2626';
        }

        segments.forEach((seg, i) => {
          if (i < level) {
            seg.style.backgroundColor = color;
          } else {
            seg.style.backgroundColor = '';
            seg.className = 'strength-seg h-2 flex-1 rounded-full bg-surface-200 dark:bg-surface-700 transition-all duration-300';
          }
        });

        segmentsContainer.setAttribute('aria-valuenow', level);
        strengthLabel.textContent = label;
        strengthLabel.style.color = color;
        strengthDetail.textContent = Math.round(entropy) + '-bit entropy \xB7 ' + password.length + ' characters \xB7 ' + allChars.length + ' charset size';
      });

      // Copy password
      document.getElementById('copy-password')?.addEventListener('click', () => {
         copyText('password-output', 'copy-password');
      });

      // Utility: Secure random int
      function secureRandomInt(max) {
        const range = 0x100000000;
        const limit = Math.floor(range / max) * max;
        const buffer = new Uint32Array(1);
        while (true) {
          crypto.getRandomValues(buffer);
          if (buffer[0] < limit) return buffer[0] % max;
        }
      }

      // Username generator
      const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
      const VOWELS = 'aeiou';

      function randomSyllable() {
        const pattern = secureRandomInt(3);
        if (pattern === 0) {
          return CONSONANTS[secureRandomInt(CONSONANTS.length)] +
                 VOWELS[secureRandomInt(VOWELS.length)] +
                 CONSONANTS[secureRandomInt(CONSONANTS.length)];
        }
        if (pattern === 1) {
          return CONSONANTS[secureRandomInt(CONSONANTS.length)] +
                 VOWELS[secureRandomInt(VOWELS.length)];
        }
        return VOWELS[secureRandomInt(VOWELS.length)] +
               CONSONANTS[secureRandomInt(CONSONANTS.length)];
      }

      function randomWord(minSyllables = 2, maxSyllables = 3) {
        const syllables = minSyllables + secureRandomInt(maxSyllables - minSyllables + 1);
        let word = '';
        for (let i = 0; i < syllables; i++) {
          word += randomSyllable();
        }
        return word.toLowerCase();
      }

      function generateUsername(length, style, includeNumbers) {
        const target = Math.max(6, Math.min(32, length));
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';

        if (style === 'readable') {
          let username = randomWord(2, 3) + randomWord(1, 2);
          if (includeNumbers) {
            while (username.length < target) {
              username += secureRandomInt(10).toString();
            }
          }
          return username.slice(0, target);
        }

        if (style === 'color') {
          const color = secureRandomInt(0xffffff).toString(16).padStart(6, '0');
          let name = color;
          const pool = lowercase + (includeNumbers ? numbers : '');
          while (name.length < target) {
            name += pool[secureRandomInt(pool.length)];
          }
          return name.slice(0, target).toLowerCase();
        }

        // Secure random
        const pool = lowercase + (includeNumbers ? numbers : '');
        let username = lowercase[secureRandomInt(lowercase.length)];
        while (username.length < target) {
          username += pool[secureRandomInt(pool.length)];
        }
        return username;
      }

      // Passphrase generator
      function generatePassphrase(wordCount, separator, capitalize, includeNumbers) {
        const count = Math.max(3, Math.min(8, wordCount));
        const words = [];

        for (let i = 0; i < count; i++) {
          words.push(randomWord(2, 3));
        }

        const processed = words.map(word => {
          const base = capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word;
          if (!includeNumbers) return base;
          const suffix = secureRandomInt(100).toString().padStart(2, '0');
          return base + suffix;
        });

        return processed.join(separator);
      }

      // Username length slider
      const usernameLengthSlider = document.getElementById('username-length');
      const usernameLengthValue = document.getElementById('username-length-value');
      usernameLengthSlider?.addEventListener('input', (e) => {
        usernameLengthValue.textContent = e.target.value;
      });

      // Username generation
      document.getElementById('generate-username')?.addEventListener('click', () => {
        const length = parseInt(usernameLengthSlider.value);
        const style = document.getElementById('username-style').value;
        const includeNumbers = document.getElementById('username-include-numbers').checked;

        const username = generateUsername(length, style, includeNumbers);

        document.getElementById('username-output').textContent = username;
        document.getElementById('username-result').classList.remove('hidden');
      });

      // Copy username
      document.getElementById('copy-username')?.addEventListener('click', () => {
         copyText('username-output', 'copy-username');
      });

      // Passphrase length slider
      const passphraseWordsSlider = document.getElementById('passphrase-words');
      const passphraseWordsValue = document.getElementById('passphrase-words-value');
      passphraseWordsSlider?.addEventListener('input', (e) => {
        passphraseWordsValue.textContent = e.target.value;
      });

      // Passphrase generation
      document.getElementById('generate-passphrase')?.addEventListener('click', () => {
        const wordCount = parseInt(passphraseWordsSlider.value);
        const separator = document.getElementById('passphrase-separator').value || '-';
        const capitalize = document.getElementById('passphrase-capitalize').checked;
        const includeNumbers = document.getElementById('passphrase-include-numbers').checked;

        const passphrase = generatePassphrase(wordCount, separator, capitalize, includeNumbers);

        document.getElementById('passphrase-output').textContent = passphrase;
        document.getElementById('passphrase-result').classList.remove('hidden');
      });

      // Copy passphrase
      document.getElementById('copy-passphrase')?.addEventListener('click', () => {
         copyText('passphrase-output', 'copy-passphrase');
      });

      // ========== EMAIL TOOLS ==========
      const RANDOM_TLDS = ['com', 'net', 'org', 'io', 'dev', 'app', 'tech'];

      function generateCatchAllEmail(prefix, domain, prefixLength, style) {
        const localLength = Math.max(6, Math.min(20, prefixLength));
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';

        let localPart = prefix?.toLowerCase();
        if (!localPart) {
          if (style === 'syllable') {
            localPart = randomWord(2, 3);
          } else {
            const pool = lowercase + numbers;
            localPart = lowercase[secureRandomInt(lowercase.length)];
            while (localPart.length < localLength) {
              localPart += pool[secureRandomInt(pool.length)];
            }
          }
          localPart = localPart.slice(0, localLength);
        }

        const chosenDomain = domain?.toLowerCase() ||
          randomWord(2, 2) + '.' + RANDOM_TLDS[secureRandomInt(RANDOM_TLDS.length)];

        return localPart + '@' + chosenDomain;
      }

      function generatePlusAddress(baseEmail, tagLength) {
        if (!baseEmail || !baseEmail.includes('@')) {
          throw new Error('A valid base email address is required');
        }

        const [localPart, domain] = baseEmail.split('@');
        const length = Math.max(2, Math.min(16, tagLength));
        const pool = 'abcdefghijklmnopqrstuvwxyz0123456789';

        let tag = '';
        for (let i = 0; i < length; i++) {
          tag += pool[secureRandomInt(pool.length)];
        }

        return localPart + '+' + tag + '@' + domain;
      }

      // Email prefix length slider
      const emailPrefixLengthSlider = document.getElementById('email-prefix-length');
      const emailPrefixLengthValue = document.getElementById('email-prefix-length-value');
      emailPrefixLengthSlider?.addEventListener('input', (e) => {
        emailPrefixLengthValue.textContent = e.target.value;
      });

      // Catch-all generation
      document.getElementById('generate-catchall')?.addEventListener('click', () => {
        const prefix = document.getElementById('email-prefix').value || undefined;
        const domain = document.getElementById('email-domain').value || undefined;
        const prefixLength = parseInt(emailPrefixLengthSlider.value);
        const style = document.getElementById('email-style').value;

        const email = generateCatchAllEmail(prefix, domain, prefixLength, style);

        document.getElementById('catchall-output').textContent = email;
        document.getElementById('catchall-result').classList.remove('hidden');
      });

      // Copy catch-all
      document.getElementById('copy-catchall')?.addEventListener('click', () => {
         copyText('catchall-output', 'copy-catchall');
      });

      // Alias tag length slider
      const aliasTagLengthSlider = document.getElementById('alias-tag-length');
      const aliasTagLengthValue = document.getElementById('alias-tag-length-value');
      aliasTagLengthSlider?.addEventListener('input', (e) => {
        aliasTagLengthValue.textContent = e.target.value;
      });

       // Plus alias generation
       document.getElementById('generate-alias')?.addEventListener('click', () => {
         const baseEmail = document.getElementById('alias-base-email').value;
         if (!baseEmail || !baseEmail.includes('@')) {
           document.getElementById('alias-error').textContent = _t('tools.password-generator.js.text1', 'Please enter a valid base email address.');
           document.getElementById('alias-error').classList.remove('hidden');
           return;
         }

         try {
           const tagLength = parseInt(aliasTagLengthSlider.value);
           const email = generatePlusAddress(baseEmail, tagLength);

           document.getElementById('alias-error').classList.add('hidden');
           document.getElementById('alias-output').textContent = email;
           document.getElementById('alias-result').classList.remove('hidden');
         } catch (error) {
           document.getElementById('alias-error').textContent = error.message;
           document.getElementById('alias-error').classList.remove('hidden');
         }
      });

      // Copy alias
      document.getElementById('copy-alias')?.addEventListener('click', () => {
         copyText('alias-output', 'copy-alias');
      });
    </script>
  `;

  return respondHTML(createPageTemplate({
    title: translation?.name || 'Password Generator',
    description: translation?.desc || 'Create secure, random passwords.',
    path: '/password-generator',
    content,
    scripts: script,
    lang: currentLang
  }));
}
