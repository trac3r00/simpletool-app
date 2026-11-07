/**
 * SSH Key Generator Tool
 * Generate Ed25519, ECDSA, and RSA key pairs in the browser using Web Crypto API
 * All processing happens client-side - keys stay in your browser and are not sent to our servers
 */

import { respondHTML, respondJSON } from "../utils/respond.js";
import {
  createPageTemplate,
  createToolHeader,
  createCheatsheet,
  infoHint,
} from "../utils/common-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import { createSshKeyLogic } from "../utils/ssh-key-logic.js";
import { createRelatedToolsSection } from "../utils/content-ui.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";

export async function handleSSHKeyGeneratorRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (
      pathname === "/ssh-key-generator" ||
      pathname === "/ssh-key-generator/"
    ) {
      if (method === "GET") {
        return renderSSHKeyGeneratorPage(resolveRequestLanguage(request, url));
      }
    }

    return respondJSON({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("SSH Key Generator Route Error:", error);
    return respondJSON(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    );
  }
}

function renderSSHKeyGeneratorPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("ssh-key-generator", currentLang);
  const title = translation?.name || "SSH Key Generator";
  const description =
    translation?.desc ||
    "Generate Ed25519, ECDSA, and RSA SSH keys in the browser";

  const toolHeader = createToolHeader(
    { emoji: "🔑" },
    title,
    description,
    [
      {
        text: translation?.ui?.badge18 || "Private & Secure",
        color: "green",
        tooltip:
          "Keys are generated in the browser via the Web Crypto API and the private key stays in your browser and is not sent to our servers.",
        tooltipI18nKey: "tools.ssh-key-generator.ui.r63_16",
      },
    ],
    { toolId: "ssh-key-generator" },
  );

  const currentTool = TOOLS.find((t) => t.id === "ssh-key-generator");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">

        ${toolHeader}

         <!-- Privacy Notice -->
         <div class="mb-8 p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
           <div class="flex items-start gap-3">
             <span class="text-2xl">🔒</span>
             <div>
               <h2 class="text-sm font-bold text-success-900 dark:text-success-300 mb-1" data-i18n="tools.ssh-key-generator.ui.heading11">Keys Generated in Your Browser</h2>
               <ul class="text-xs text-success-800 dark:text-success-200 space-y-1 list-disc list-inside">
                <li data-i18n="tools.ssh-key-generator.ui.r6_0">All keys generated in your browser using Web Crypto API</li>
                <li data-i18n="tools.ssh-key-generator.ui.r6_1">Private keys stay in your browser and are not sent to our servers</li>
                <li data-i18n="tools.ssh-key-generator.ui.r6_2">Page assets load over the network, but the keys this tool generates are not transmitted</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <!-- Controls -->
          <div class="space-y-6">
            <!-- Key Type Selection -->
            <div>
              <label class="label mb-3"><span data-i18n="tools.ssh-key-generator.ui.label2">Key Type</span> ${infoHint("Ed25519 is the default for new servers. ECDSA P-256 and RSA remain for older systems.", undefined, { i18nKey: "tools.ssh-key-generator.ui.r63_17", ariaI18nKey: "tools.ssh-key-generator.ui.r63_17" })}</label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label class="relative flex items-start p-4 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-900 transition-all has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 dark:has-[:checked]:bg-primary-900/20">
                  <input data-i18n-tooltip="tools.ssh-key-generator.ui.r6_3" type="radio" name="keyType" value="ed25519" data-tooltip="Recommended for new deployments" checked class="mt-1 w-4 h-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500">
                  <div class="ml-3">
                    <div class="text-sm font-bold text-surface-900 dark:text-surface-50">Ed25519</div>
                    <div data-i18n="tools.ssh-key-generator.ui.r6_4" class="text-xs text-surface-600 dark:text-surface-400 mt-1">Recommended. Fast, small, modern default.</div>
                  </div>
                </label>
                <label class="relative flex items-start p-4 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-900 transition-all has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 dark:has-[:checked]:bg-primary-900/20">
                  <input type="radio" name="keyType" value="ecdsa" data-tooltip="Modern, smaller keys, faster operations" data-i18n-tooltip="tools.ssh-key-generator.ui.r63_21" class="mt-1 w-4 h-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500">
                  <div class="ml-3">
                    <div data-i18n="tools.ssh-key-generator.ui.r6_5" class="text-sm font-bold text-surface-900 dark:text-surface-50">ECDSA (P-256)</div>
                    <div data-i18n="tools.ssh-key-generator.ui.r6_6" class="text-xs text-surface-600 dark:text-surface-400 mt-1">Compact keys. Broad current-system support.</div>
                  </div>
                </label>
                <label class="relative flex items-start p-4 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-900 transition-all has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 dark:has-[:checked]:bg-primary-900/20">
                  <input type="radio" name="keyType" value="rsa" data-tooltip="Traditional, widely compatible with older systems" data-i18n-tooltip="tools.ssh-key-generator.ui.r63_22" class="mt-1 w-4 h-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500">
                  <div class="ml-3">
                    <div class="text-sm font-bold text-surface-900 dark:text-surface-50">RSA</div>
                    <div data-i18n="tools.ssh-key-generator.ui.r6_7" class="text-xs text-surface-600 dark:text-surface-400 mt-1">Legacy compatibility. Larger key size.</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- RSA Key Size (only shown for RSA) -->
            <div id="rsa-options" class="hidden">
            <label for="rsa-size" class="label"><span data-i18n="tools.ssh-key-generator.ui.label3">RSA Key Size</span> ${infoHint("Larger bit sizes (2048/3072/4096) increase security but slow generation.", undefined, { i18nKey: "tools.ssh-key-generator.ui.r63_18", ariaI18nKey: "tools.ssh-key-generator.ui.r63_18" })}</label>
              <select id="rsa-size" class="input">
                <option value="2048" data-i18n="tools.ssh-key-generator.ui.option6">2048 bits (Minimum, faster)</option>
                <option value="3072" data-i18n="tools.ssh-key-generator.ui.option7">3072 bits (Balanced)</option>
                <option value="4096" selected data-i18n="tools.ssh-key-generator.ui.option8">4096 bits (Maximum security, slower)</option>
              </select>
            </div>

            <!-- Comment/Label -->
            <div>
              <label for="key-comment" class="label"><span data-i18n="tools.ssh-key-generator.ui.label4">Comment (Optional)</span></label>
              <input type="text" id="key-comment" placeholder="user@host or description" data-i18n-placeholder="tools.ssh-key-generator.ui.placeholder5" class="input">
              <p class="mt-1 text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.ssh-key-generator.ui.desc13">Appended to public key for identification</p>
            </div>

            <!-- Generate Button -->
            <button id="generate-btn" class="btn btn-primary w-full py-3 text-lg" data-tooltip="Generate a new SSH key pair in your browser" data-i18n-tooltip="tools.ssh-key-generator.ui.r63_23">
              <span id="btn-text" data-i18n="tools.ssh-key-generator.ui.r63_19">Generate Key Pair</span>
              <span id="btn-loading" class="hidden flex items-center gap-2">
                <span class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                <span data-i18n="tools.ssh-key-generator.ui.r63_20">Generating...</span>
              </span>
             </button>
          </div>

          <!-- Error Banner -->
           <div id="keygen-error" role="alert" class="hidden rounded-lg border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/30 text-sm text-error-700 dark:text-error-200 px-4 py-3"></div>

          <!-- Results -->
          <div id="results" class="hidden space-y-6">
            
            <!-- Public Key -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h2 class="text-sm font-bold text-surface-900 dark:text-surface-50 uppercase tracking-wide" data-i18n="tools.ssh-key-generator.ui.stat9">🔓 Public Key</h2>
                <div class="flex gap-2">
                  <button id="copy-public" class="btn btn-secondary btn-xs"><span data-i18n="tools.ssh-key-generator.ui.button0">Copy</span></button>
                  <button id="download-public" class="btn btn-secondary btn-xs"><span data-i18n="tools.ssh-key-generator.ui.button1">Download</span></button>
                </div>
              </div>
              <textarea id="public-key" readonly rows="4" class="input font-mono text-xs resize-none bg-surface-50 dark:bg-surface-950"></textarea>
              <p class="mt-1 text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.ssh-key-generator.ui.desc14">Add this to ~/.ssh/authorized_keys on remote servers</p>
            </div>

            <!-- Private Key -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h2 class="text-sm font-bold text-surface-900 dark:text-surface-50 uppercase tracking-wide" data-i18n="tools.ssh-key-generator.ui.stat10">🔐 Private Key</h2>
                <div class="flex gap-2">
                  <button id="copy-private" class="btn btn-secondary btn-xs"><span data-i18n="tools.ssh-key-generator.ui.button0">Copy</span></button>
                  <button id="download-private" class="btn btn-secondary btn-xs"><span data-i18n="tools.ssh-key-generator.ui.button1">Download</span></button>
                </div>
              </div>
               <textarea id="private-key" readonly rows="8" class="input font-mono text-xs resize-none bg-error-50 dark:bg-error-900/10 border-error-200 dark:border-error-900 text-surface-900 dark:text-surface-100"></textarea>
               <p class="mt-1 text-xs text-error-600 dark:text-error-400 font-semibold" data-i18n="tools.ssh-key-generator.ui.desc15">⚠️ KEEP THIS PRIVATE! Save with permissions 600.</p>
            </div>

            <!-- Fingerprint -->
            <div class="p-3 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg">
              <h2 class="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase mb-1" data-i18n="tools.ssh-key-generator.ui.heading12">Fingerprint (SHA-256)</h2>
              <code id="fingerprint" class="text-xs font-mono text-surface-900 dark:text-surface-100 break-all"></code>
            </div>

            <!-- Setup Instructions -->
            <details class="group">
              <summary data-i18n="tools.ssh-key-generator.ui.r6_8" class="cursor-pointer text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">Show Setup Instructions</summary>
              <div class="mt-3 text-xs text-surface-600 dark:text-surface-400 space-y-2 p-3 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <p class="font-semibold text-surface-900 dark:text-surface-200" data-i18n="tools.ssh-key-generator.ui.desc16">Local Machine:</p>
                <pre class="bg-surface-200 dark:bg-surface-900 p-2 rounded overflow-x-auto">chmod 600 ~/.ssh/id_key
eval \"$(ssh-agent -s)\" 
ssh-add ~/.ssh/id_key</pre>

                <p class="font-semibold text-surface-900 dark:text-surface-200 mt-2" data-i18n="tools.ssh-key-generator.ui.desc17">Remote Server:</p>
                <pre class="bg-surface-200 dark:bg-surface-900 p-2 rounded overflow-x-auto">mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo \"PUBLIC_KEY\" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys</pre>
              </div>
            </details>
          </div>

        </div>

      </div>

      ${createCheatsheet("ssh-key-generator", "SSH Key Quick Reference", [
        {
          heading: "Key Types",
          content: `
          <table>
            <tr><th data-i18n="tools.ssh-key-generator.ui.th7">Algorithm</th><th data-i18n="tools.ssh-key-generator.ui.th8">Key Size</th><th data-i18n="tools.ssh-key-generator.ui.th9">Security</th><th data-i18n="tools.ssh-key-generator.ui.th10">Use Case</th></tr>
            <tr><td><code>Ed25519</code></td><td>256-bit</td><td data-i18n="tools.ssh-key-generator.ui.r66_c1">✅ Recommended</td><td data-i18n="tools.ssh-key-generator.ui.r66_c2">New deployments, OpenSSH default</td></tr>
            <tr><td><code>ECDSA</code></td><td>P-256</td><td data-i18n="tools.ssh-key-generator.ui.r66_c3">✅ Secure</td><td data-i18n="tools.ssh-key-generator.ui.r66_c4">Modern systems, compact keys</td></tr>
            <tr><td><code>RSA</code></td><td>2048/4096-bit</td><td data-i18n="tools.ssh-key-generator.ui.r66_c5">✅ Compatible</td><td data-i18n="tools.ssh-key-generator.ui.r3_0">Older appliances that reject Ed25519</td></tr>
          </table>`,
        },
        {
          heading: "Common Commands",
          content: `
          <table>
            <tr><th data-i18n="tools.ssh-key-generator.ui.th11">Command</th><th data-i18n="tools.ssh-key-generator.ui.th12">Description</th></tr>
            <tr><td><code>ssh-keygen -t ed25519</code></td><td data-i18n="tools.ssh-key-generator.ui.r66_c6">Generate Ed25519 key (recommended)</td></tr>
            <tr><td><code>ssh-keygen -t ecdsa -b 256</code></td><td data-i18n="tools.ssh-key-generator.ui.r66_c7">Generate ECDSA key (P-256)</td></tr>
            <tr><td><code>ssh-keygen -t rsa -b 4096</code></td><td data-i18n="tools.ssh-key-generator.ui.r66_c8">Generate RSA key (4096-bit)</td></tr>
            <tr><td><code>ssh-copy-id user@host</code></td><td data-i18n="tools.ssh-key-generator.ui.r66_c9">Copy public key to server</td></tr>
            <tr><td><code>chmod 600 ~/.ssh/id_*</code></td><td data-i18n="tools.ssh-key-generator.ui.r3_1">Set correct permissions</td></tr>
          </table>`,
        },
      ])}

      <section class="card p-6 mt-8" aria-labelledby="ssh-compare-heading">
        <h2 id="ssh-compare-heading" class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-3" data-i18n="tools.ssh-key-generator.ui.r3_6">Ed25519 vs ECDSA vs RSA</h2>
        <div data-i18n-aria="tools.ssh-key-generator.ui.r6_9" class="overflow-x-auto" tabindex="0" role="region" aria-label="Key type comparison table">
          <table class="w-full text-sm text-left text-surface-700 dark:text-surface-300">
            <thead>
              <tr class="border-b border-surface-200 dark:border-surface-800 text-surface-900 dark:text-surface-50">
                <th data-i18n="tools.ssh-key-generator.ui.r6_10" scope="col" class="py-2 pr-4">Algorithm</th>
                <th scope="col" class="py-2 pr-4" data-i18n="tools.ssh-key-generator.ui.r3_2">Key size</th>
                <th scope="col" class="py-2 pr-4" data-i18n="tools.ssh-key-generator.ui.r3_3">Public key data (base64 chars)</th>
                <th scope="col" class="py-2 pr-4" data-i18n="tools.ssh-key-generator.ui.r3_4">OpenSSH support since</th>
                <th scope="col" class="py-2" data-i18n="tools.ssh-key-generator.ui.r3_5">When to use</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-surface-200 dark:border-surface-800">
                <th scope="row" class="py-2 pr-4 font-semibold"><code>ssh-ed25519</code></th>
                <td data-i18n="tools.ssh-key-generator.ui.r6_11" class="py-2 pr-4">256-bit (fixed)</td>
                <td class="py-2 pr-4">68</td>
                <td class="py-2 pr-4">6.5 (2014)</td>
                <td data-i18n="tools.ssh-key-generator.ui.r6_12" class="py-2">Default choice for new keys</td>
              </tr>
              <tr class="border-b border-surface-200 dark:border-surface-800">
                <th scope="row" class="py-2 pr-4 font-semibold"><code>ecdsa-sha2-nistp256</code></th>
                <td data-i18n="tools.ssh-key-generator.ui.r6_13" class="py-2 pr-4">256-bit (P-256)</td>
                <td class="py-2 pr-4">140</td>
                <td class="py-2 pr-4">5.7 (2011)</td>
                <td data-i18n="tools.ssh-key-generator.ui.r6_14" class="py-2">Systems that require NIST curves</td>
              </tr>
              <tr>
                <th scope="row" class="py-2 pr-4 font-semibold"><code>ssh-rsa</code></th>
                <td data-i18n="tools.ssh-key-generator.ui.r6_15" class="py-2 pr-4">3072 or 4096-bit</td>
                <td data-i18n="tools.ssh-key-generator.ui.r6_16" class="py-2 pr-4">544 (3072-bit), 716 (4096-bit)</td>
                <td data-i18n="tools.ssh-key-generator.ui.r6_17" class="py-2 pr-4">All SSH-2 versions</td>
                <td data-i18n="tools.ssh-key-generator.ui.r6_18" class="py-2">Legacy systems that reject Ed25519</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul class="mt-4 text-sm text-surface-700 dark:text-surface-300 space-y-1 list-disc list-inside">
          <li data-i18n-html="tools.ssh-key-generator.ui.r6_19">Use Ed25519 unless something on the other end cannot accept it. Since OpenSSH 9.5, <code>ssh-keygen</code> creates Ed25519 keys by default.</li>
          <li data-i18n-html="tools.ssh-key-generator.ui.r6_20">Use RSA only for legacy systems, and then at 3072 bits or more (the <code>ssh-keygen</code> default RSA size since OpenSSH 8.0).</li>
          <li data-i18n="tools.ssh-key-generator.ui.r6_21">GitHub accepts Ed25519, ECDSA, and RSA public keys.</li>
        </ul>
      </section>

      <section class="card p-6 mt-8" aria-labelledby="ssh-github-heading">
        <h2 id="ssh-github-heading" class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-3" data-i18n="tools.ssh-key-generator.ui.r3_7">Add the key to GitHub</h2>
        <ol class="text-sm text-surface-700 dark:text-surface-300 space-y-2 list-decimal list-inside">
          <li data-i18n-html="tools.ssh-key-generator.ui.r6_22">Save the private key as <code>~/.ssh/id_ed25519_github</code> and the public key as <code>~/.ssh/id_ed25519_github.pub</code>.</li>
          <li data-i18n-html="tools.ssh-key-generator.ui.r6_23">On GitHub, open <strong>Settings &gt; SSH and GPG keys &gt; New SSH key</strong>.</li>
          <li data-i18n-html="tools.ssh-key-generator.ui.r6_24">Give it a title, keep the key type as <strong>Authentication Key</strong>, and paste the full contents of the <code>.pub</code> file (one line starting with <code>ssh-ed25519</code>).</li>
          <li data-i18n-html="tools.ssh-key-generator.ui.r6_25">Test the connection: <code>ssh -T git@github.com</code>. On success GitHub greets you by username and says it does not provide shell access.</li>
        </ol>
        <h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mt-5 mb-2" data-i18n="tools.ssh-key-generator.ui.r3_8">Pin the key in ~/.ssh/config</h3>
        <p data-i18n-html="tools.ssh-key-generator.ui.r6_26" class="text-sm text-surface-700 dark:text-surface-300 mb-2">With several keys loaded, ssh may offer the wrong one first. <code>IdentitiesOnly yes</code> makes ssh use only the <code>IdentityFile</code> listed for that host.</p>
        <pre tabindex="0" class="bg-surface-100 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 p-3 rounded-lg overflow-x-auto text-xs text-surface-800 dark:text-surface-200"><code>Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github
  IdentitiesOnly yes</code></pre>
      </section>

      <section class="card p-6 mt-8" aria-labelledby="ssh-store-heading">
        <h2 id="ssh-store-heading" class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-3" data-i18n="tools.ssh-key-generator.ui.r3_9">Store it safely</h2>
        <pre tabindex="0" class="bg-surface-100 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 p-3 rounded-lg overflow-x-auto text-xs text-surface-800 dark:text-surface-200"><code>chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519_github
chmod 644 ~/.ssh/id_ed25519_github.pub</code></pre>
        <ul class="mt-4 text-sm text-surface-700 dark:text-surface-300 space-y-2 list-disc list-inside">
          <li data-i18n-html="tools.ssh-key-generator.ui.r6_27">OpenSSH refuses a private key that other users can read. It prints <code>WARNING: UNPROTECTED PRIVATE KEY FILE!</code> and <code>Permissions 0644 ... are too open</code>, then ignores the key. A key readable by others could be copied, so <code>chmod 600</code> is required, not optional.</li>
          <li data-i18n-html="tools.ssh-key-generator.ui.r6_28">Protect the private key with a passphrase: <code>ssh-keygen -p -f ~/.ssh/id_ed25519_github</code> adds or changes one.</li>
          <li data-i18n-html="tools.ssh-key-generator.ui.r6_29">Avoid retyping the passphrase with ssh-agent: <code>eval "$(ssh-agent -s)"</code>, then <code>ssh-add ~/.ssh/id_ed25519_github</code>.</li>
        </ul>
        <h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mt-5 mb-2" data-i18n="tools.ssh-key-generator.ui.r3_10">Offline equivalent</h3>
        <p class="text-sm text-surface-700 dark:text-surface-300 mb-2" data-i18n="tools.ssh-key-generator.ui.r3_12">To generate the key without a browser, run this on your own machine. It asks for a file path and a passphrase.</p>
        <pre tabindex="0" class="bg-surface-100 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 p-3 rounded-lg overflow-x-auto text-xs text-surface-800 dark:text-surface-200"><code>ssh-keygen -t ed25519 -C "you@example.com"</code></pre>
      </section>

      <section class="mt-8 text-sm text-surface-600 dark:text-surface-400" aria-labelledby="ssh-sources-heading">
        <h2 id="ssh-sources-heading" class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-2" data-i18n="tools.ssh-key-generator.ui.r3_11">Sources</h2>
        <p data-i18n-html="tools.ssh-key-generator.ui.r6_30" class="mb-2">Last reviewed: <time datetime="2026-11-06">2026-11-06</time></p>
        <ul class="space-y-1 list-disc list-inside">
          <li><a data-i18n="tools.ssh-key-generator.ui.r6_31" class="text-primary-600 dark:text-primary-400 hover:underline" href="https://man.openbsd.org/ssh-keygen" rel="noopener">ssh-keygen(1) manual</a></li>
          <li><a data-i18n="tools.ssh-key-generator.ui.r6_32" class="text-primary-600 dark:text-primary-400 hover:underline" href="https://man.openbsd.org/ssh_config" rel="noopener">ssh_config(5) manual</a></li>
          <li><a data-i18n="tools.ssh-key-generator.ui.r6_33" class="text-primary-600 dark:text-primary-400 hover:underline" href="https://docs.github.com/en/authentication/connecting-to-github-with-ssh" rel="noopener">GitHub Docs: Connecting to GitHub with SSH</a></li>
        </ul>
      </section>
    ${createRelatedToolsSection(relatedToolsData)}
    </main>
  `;

  const script = `
    <script>
      const SshKeyLogic = (${createSshKeyLogic.toString()})();
      const keyTypeInputs = document.querySelectorAll('input[name="keyType"]');
      const rsaOptions = document.getElementById('rsa-options');
      const rsaSize = document.getElementById('rsa-size');
      const keyComment = document.getElementById('key-comment');
      const generateBtn = document.getElementById('generate-btn');
      const btnText = document.getElementById('btn-text');
      const btnLoading = document.getElementById('btn-loading');
      const resultsEl = document.getElementById('results');
      const publicKeyEl = document.getElementById('public-key');
      const privateKeyEl = document.getElementById('private-key');
      const fingerprintEl = document.getElementById('fingerprint');
      const textEncoder = new TextEncoder();

      // Show/hide RSA options
      keyTypeInputs.forEach(input => {
        input.addEventListener('change', () => {
          rsaOptions.classList.toggle('hidden', input.value !== 'rsa');
        });
      });

      // Generate key pair
      generateBtn.addEventListener('click', async () => {
        const keyType = document.querySelector('input[name="keyType"]:checked').value;
        const errEl = document.getElementById('keygen-error');
        errEl.classList.add('hidden');
        errEl.textContent = '';

        // Disable button and show loading
        generateBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');

        try {
          if (keyType === 'ed25519') {
            await generateEd25519();
          } else if (keyType === 'ecdsa') {
            await generateECDSA();
          } else {
            await generateRSA();
          }
          resultsEl.classList.remove('hidden');
          // Smooth scroll to results on mobile
          if (window.innerWidth < 1024) {
            resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } catch (error) {
          errEl.textContent = _t('tools.ssh-key-generator.js.text2', 'Error generating key pair: ') + error.message;
          errEl.classList.remove('hidden');
          console.error(error);
        } finally {
          generateBtn.disabled = false;
          btnText.classList.remove('hidden');
          btnLoading.classList.add('hidden');
        }
      });

       async function generateEd25519() {
         const keyPair = await window.crypto.subtle.generateKey(
           { name: 'Ed25519' },
           true,
           ['sign', 'verify']
         );

         const publicKeyRaw = new Uint8Array(await window.crypto.subtle.exportKey('raw', keyPair.publicKey));
         const privateKeyRaw = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

         if (publicKeyRaw.length !== 32) {
           throw new Error('Unexpected Ed25519 public key format');
         }

         const comment = keyComment.value.trim() || 'user@simpletool';
         const { key: publicKeySSH, wireBytes } = encodeEd25519PublicKey(publicKeyRaw, comment);
         // OpenSSH refuses Ed25519 keys in PKCS#8 PEM ("invalid format"), so write its native format.
         const checkint = crypto.getRandomValues(new Uint32Array(1))[0];
         const privateKeySSH = SshKeyLogic.encodeOpenSshEd25519PrivateKey(
           SshKeyLogic.ed25519SeedFromPkcs8(privateKeyRaw), publicKeyRaw, comment, checkint
         ).trimEnd();
         const fingerprint = await calculateFingerprint(wireBytes);

         publicKeyEl.value = publicKeySSH;
         privateKeyEl.value = privateKeySSH;
         fingerprintEl.textContent = fingerprint;
       }

       async function generateECDSA() {
         const keyPair = await window.crypto.subtle.generateKey(
           { name: 'ECDSA', namedCurve: 'P-256' },
           true,
           ['sign', 'verify']
         );

         const publicKeyRaw = new Uint8Array(await window.crypto.subtle.exportKey('raw', keyPair.publicKey));
         const privateKeyRaw = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

         if (publicKeyRaw.length !== 65 || publicKeyRaw[0] !== 0x04) {
           throw new Error('Unexpected ECDSA public key format');
         }

         const x = publicKeyRaw.slice(1, 33);
         const y = publicKeyRaw.slice(33, 65);
         const comment = keyComment.value.trim() || 'user@simpletool';
         const { key: publicKeySSH, wireBytes } = encodeECDSAPublicKey(x, y, comment);
         const privateKeySSH = arrayBufferToPEM(privateKeyRaw, 'PRIVATE KEY');
         const fingerprint = await calculateFingerprint(wireBytes);

         publicKeyEl.value = publicKeySSH;
         privateKeyEl.value = privateKeySSH;
         fingerprintEl.textContent = fingerprint;
       }

       async function generateRSA() {
         const keySize = parseInt(rsaSize.value);
         const keyPair = await window.crypto.subtle.generateKey(
           {
             name: 'RSASSA-PKCS1-v1_5',
             modulusLength: keySize,
             publicExponent: new Uint8Array([1, 0, 1]),
             hash: 'SHA-256'
           },
           true,
           ['sign', 'verify']
         );

         const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
         const privateKeyRaw = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

         if (!publicKeyJwk.e || !publicKeyJwk.n) {
           throw new Error('Unexpected RSA public key format');
         }

         const exponentBytes = decodeBase64UrlToBytes(publicKeyJwk.e);
         const modulusBytes = decodeBase64UrlToBytes(publicKeyJwk.n);
         const comment = keyComment.value.trim() || 'user@simpletool';
         const { key: publicKeySSH, wireBytes } = encodeRSAPublicKey(exponentBytes, modulusBytes, comment);
         const privateKeySSH = arrayBufferToPEM(privateKeyRaw, 'PRIVATE KEY');
         const fingerprint = await calculateFingerprint(wireBytes);

         publicKeyEl.value = publicKeySSH;
         privateKeyEl.value = privateKeySSH;
         fingerprintEl.textContent = fingerprint;
       }

      function arrayBufferToPEM(buffer, label) {
        const base64 = arrayBufferToBase64(buffer);
        const formatted = base64 ? (base64.match(/.{1,64}/g) || []).join('\\n') : '';
        return \`-----BEGIN \${label}-----\\n\${formatted}\\n-----END \${label}-----\`;
      }

      function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      }

      function toUtf8Bytes(value) {
        return textEncoder.encode(value);
      }

      function concat(...arrays) {
        const total = arrays.reduce((sum, array) => sum + array.length, 0);
        const out = new Uint8Array(total);
        let offset = 0;
        for (const array of arrays) {
          out.set(array, offset);
          offset += array.length;
        }
        return out;
      }

      function writeUint32(value) {
        const bytes = new Uint8Array(4);
        new DataView(bytes.buffer).setUint32(0, value, false);
        return bytes;
      }

      function writeString(bytes) {
        return concat(writeUint32(bytes.length), bytes);
      }

      function writeMpint(bytes) {
        let start = 0;
        while (start < bytes.length - 1 && bytes[start] === 0) {
          start += 1;
        }

        let payload = bytes.slice(start);
        if (payload.length === 0) {
          payload = new Uint8Array([0]);
        }

        if ((payload[0] & 0x80) !== 0) {
          payload = concat(new Uint8Array([0]), payload);
        }

        return concat(writeUint32(payload.length), payload);
      }

      function toBase64(bytes) {
        let binary = '';
        const chunkSize = 8192;
        for (let index = 0; index < bytes.length; index += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
        }
        return btoa(binary);
      }

      function encodeEd25519PublicKey(keyBytes, comment) {
        const wireBytes = concat(
          writeString(toUtf8Bytes('ssh-ed25519')),
          writeString(keyBytes)
        );

        return {
          key: \`ssh-ed25519 \${toBase64(wireBytes)} \${comment}\`,
          wireBytes
        };
      }

      function encodeECDSAPublicKey(x, y, comment) {
        const wireBytes = concat(
          writeString(toUtf8Bytes('ecdsa-sha2-nistp256')),
          writeString(toUtf8Bytes('nistp256')),
          writeString(concat(new Uint8Array([0x04]), x, y))
        );

        return {
          key: \`ecdsa-sha2-nistp256 \${toBase64(wireBytes)} \${comment}\`,
          wireBytes
        };
      }

      function encodeRSAPublicKey(exponentBytes, modulusBytes, comment) {
        const wireBytes = concat(
          writeString(toUtf8Bytes('ssh-rsa')),
          writeMpint(exponentBytes),
          writeMpint(modulusBytes)
        );

        return {
          key: \`ssh-rsa \${toBase64(wireBytes)} \${comment}\`,
          wireBytes
        };
      }

      function decodeBase64UrlToBytes(value) {
        const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
        const binary = atob(padded);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index++) {
          bytes[index] = binary.charCodeAt(index);
        }
        return bytes;
      }

      async function calculateFingerprint(publicKeyBytes) {
        const hash = await crypto.subtle.digest('SHA-256', publicKeyBytes);
        const hashArray = Array.from(new Uint8Array(hash));
        const hashBase64 = btoa(String.fromCharCode(...hashArray));
        return 'SHA256:' + hashBase64.replace(/=+$/g, '');
      }

       // Copy/Download Helpers
       const handleAction = async (btnId, elementId, action) => {
         const el = document.getElementById(elementId);
         const btn = document.getElementById(btnId);
         const content = el.value;

         if (action === 'copy') {
           if(window.copyToClipboard) {
             window.copyToClipboard(content, btn);
           } else {
             await navigator.clipboard.writeText(content);
             btn.textContent = _t('tools.ssh-key-generator.js.text0', '✓ Copied');
             if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
             setTimeout(() => btn.textContent = _t('tools.ssh-key-generator.js.text1', 'Copy'), 2000);
           }
         } else {
           const keyType = document.querySelector('input[name="keyType"]:checked').value;
           let filename = 'id_' + keyType;
           if (elementId === 'public-key') filename += '.pub';
           downloadFile(content, filename);
         }
       };

      document.getElementById('copy-public').addEventListener('click', () => handleAction('copy-public', 'public-key', 'copy'));
      document.getElementById('copy-private').addEventListener('click', () => handleAction('copy-private', 'private-key', 'copy'));
      document.getElementById('download-public').addEventListener('click', () => handleAction('download-public', 'public-key', 'download'));
      document.getElementById('download-private').addEventListener('click', () => handleAction('download-private', 'private-key', 'download'));

      function downloadFile(content, filename) {
        // octet-stream keeps Chrome from renaming id_ed25519 to id_ed25519.txt; OpenSSH wants the final newline.
        const blob = new Blob([content.endsWith('\\n') ? content : content + '\\n'], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    </script>
  `;

  return respondHTML(
    createPageTemplate({
      title,
      description,
      path: "/ssh-key-generator",
      content,
      scripts: script,
      lang: currentLang,
    }),
  );
}
