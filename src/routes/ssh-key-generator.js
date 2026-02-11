/**
 * SSH Key Generator Tool
 * Generate ED25519 and RSA key pairs securely in the browser using Web Crypto API
 * All processing happens client-side - keys never leave your browser
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';

export async function handleSSHKeyGeneratorRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === '/ssh-key-generator' || pathname === '/ssh-key-generator/') {
      if (method === 'GET') {
        return renderSSHKeyGeneratorPage();
      }
    }

    return respondJSON({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('SSH Key Generator Route Error:', error);
    return respondJSON(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function renderSSHKeyGeneratorPage() {
  const toolHeader = createToolHeader(
    { emoji: '🔑' },
    'SSH Key Generator',
    'Generate secure SSH key pairs client-side using Web Crypto API',
    [{ text: 'Private & Secure', color: 'green', tooltip: 'Keys are generated in the browser via the Web Crypto API and private material never leaves your device.' }],
    { toolId: 'ssh-key-generator' }
  );

  const currentTool = TOOLS.find(t => t.id === 'ssh-key-generator');
    const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];


  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">

        ${toolHeader}

         <!-- Privacy Notice -->
         <div class="mb-8 p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
           <div class="flex items-start gap-3">
             <span class="text-2xl">🔒</span>
             <div>
               <h2 class="text-sm font-bold text-success-900 dark:text-success-300 mb-1" data-i18n="tools.ssh-key-generator.ui.heading11">100% Client-Side & Private</h2>
               <ul class="text-xs text-success-800 dark:text-success-200 space-y-1 list-disc list-inside">
                <li>All keys generated in your browser using Web Crypto API</li>
                <li>Private keys NEVER leave your device</li>
                <li>No logging, no tracking, no data collection</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <!-- Controls -->
          <div class="space-y-6">
            <!-- Key Type Selection -->
            <div>
              <label class="label mb-3"><span data-i18n="tools.ssh-key-generator.ui.label2">Key Type</span> ${infoHint('Choose ECDSA for modern clients or RSA when you need older-system compatibility.')}</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label class="relative flex items-start p-4 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-900 transition-all has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 dark:has-[:checked]:bg-primary-900/20">
                  <input type="radio" name="keyType" value="ecdsa" data-tooltip="Modern, smaller keys, faster operations" checked class="mt-1 w-4 h-4 text-primary-600 focus:ring-primary-500">
                  <div class="ml-3">
                    <div class="text-sm font-bold text-surface-900 dark:text-surface-50">ECDSA (P-256)</div>
                    <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">Modern, secure, fast. Compatible with most systems.</div>
                  </div>
                </label>
                <label class="relative flex items-start p-4 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-900 transition-all has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 dark:has-[:checked]:bg-primary-900/20">
                  <input type="radio" name="keyType" value="rsa" data-tooltip="Traditional, widely compatible with older systems" class="mt-1 w-4 h-4 text-primary-600 focus:ring-primary-500">
                  <div class="ml-3">
                    <div class="text-sm font-bold text-surface-900 dark:text-surface-50">RSA</div>
                    <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">Traditional, widely supported. Larger key size.</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- RSA Key Size (only shown for RSA) -->
            <div id="rsa-options" class="hidden">
            <label for="rsa-size" class="label"><span data-i18n="tools.ssh-key-generator.ui.label3">RSA Key Size</span> ${infoHint('Larger bit sizes (2048/3072/4096) increase security but slow generation.')}</label>
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
            <button id="generate-btn" class="btn btn-primary" data-tooltip="Generate a new SSH key pair in your browser" w-full py-3 text-lg">
              <span id="btn-text">Generate Key Pair</span>
              <span id="btn-loading" class="hidden flex items-center gap-2">
                <span class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Generating...
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
              <summary class="cursor-pointer text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">Show Setup Instructions</summary>
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

      ${createCheatsheet('ssh-key-generator', 'SSH Key Quick Reference', [
        { heading: 'Key Types', content: `
          <table>
            <tr><th>Algorithm</th><th>Key Size</th><th>Security</th><th>Use Case</th></tr>
            <tr><td><code>RSA</code></td><td>2048/4096-bit</td><td>✅ Secure</td><td>General purpose, widest compatibility</td></tr>
            <tr><td><code>ECDSA</code></td><td>P-256</td><td>✅ Secure</td><td>Modern systems, compact keys</td></tr>
            <tr><td><code>Ed25519</code></td><td>256-bit</td><td>✅ Best</td><td>Best performance (if supported)</td></tr>
          </table>` },
        { heading: 'Common Commands', content: `
          <table>
            <tr><th>Command</th><th>Description</th></tr>
            <tr><td><code>ssh-keygen -t ed25519</code></td><td>Generate Ed25519 key</td></tr>
            <tr><td><code>ssh-copy-id user@host</code></td><td>Copy public key to server</td></tr>
            <tr><td><code>ssh-add ~/.ssh/id_ed25519</code></td><td>Add key to SSH agent</td></tr>
            <tr><td><code>chmod 600 ~/.ssh/id_*</code></td><td>Set correct permissions</td></tr>
          </table>` }
      ])}
    ${createRelatedToolsSection(relatedToolsData)}
    </main>
  `;

  const script = `
    <script>
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

      // Show/hide RSA options
      keyTypeInputs.forEach(input => {
        input.addEventListener('change', () => {
          rsaOptions.classList.toggle('hidden', input.value !== 'rsa');
        });
      });

      // Generate key pair
      generateBtn.addEventListener('click', async () => {
        const keyType = document.querySelector('input[name="keyType"]:checked').value;

        // Disable button and show loading
        generateBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');

        try {
          if (keyType === 'ecdsa') {
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
          const errEl = document.getElementById('keygen-error');
          errEl.textContent = 'Error generating key pair: ' + error.message;
          errEl.classList.remove('hidden');
          console.error(error);
        } finally {
          generateBtn.disabled = false;
          btnText.classList.remove('hidden');
          btnLoading.classList.add('hidden');
        }
      });

       async function generateECDSA() {
         const keyPair = await window.crypto.subtle.generateKey(
           { name: 'ECDSA', namedCurve: 'P-256' },
           true,
           ['sign', 'verify']
         );

         const publicKeyRaw = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
         const privateKeyRaw = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

         const publicKeyPEM = arrayBufferToPEM(publicKeyRaw, 'PUBLIC KEY');
         const privateKeyPEM = arrayBufferToPEM(privateKeyRaw, 'PRIVATE KEY');

         const comment = keyComment.value.trim() || 'generated-by-simpletool';
         const publicKeySSH = convertToSSHPublicKey(publicKeyRaw, 'ecdsa-sha2-nistp256', comment);
         const privateKeySSH = convertToSSHPrivateKey(privateKeyRaw, publicKeyRaw, 'ecdsa-sha2-nistp256');

         const fingerprint = await calculateFingerprint(publicKeyRaw);

         document.getElementById('keygen-error').classList.add('hidden');
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

         const publicKeyRaw = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
         const privateKeyRaw = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

         const comment = keyComment.value.trim() || 'generated-by-simpletool';
         const publicKeySSH = convertToSSHPublicKey(publicKeyRaw, 'ssh-rsa', comment);
         const privateKeySSH = convertToSSHPrivateKey(privateKeyRaw, publicKeyRaw, 'ssh-rsa');

         const fingerprint = await calculateFingerprint(publicKeyRaw);

         document.getElementById('keygen-error').classList.add('hidden');
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

      function convertToSSHPublicKey(publicKeyRaw, algorithm, comment) {
        const base64Key = arrayBufferToBase64(publicKeyRaw);
        return \`\${algorithm} \${base64Key} \${comment}\`;
      }

      function convertToSSHPrivateKey(privateKeyRaw, publicKeyRaw, algorithm) {
        return arrayBufferToPEM(privateKeyRaw, 'PRIVATE KEY');
      }

      async function calculateFingerprint(publicKeyRaw) {
        const hash = await crypto.subtle.digest('SHA-256', publicKeyRaw);
        const hashArray = Array.from(new Uint8Array(hash));
        const hashBase64 = btoa(String.fromCharCode(...hashArray));
        return 'SHA256:' + hashBase64;
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
        const blob = new Blob([content], { type: 'text/plain' });
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

  return respondHTML(createPageTemplate({
    title: 'SSH Key Generator',
    description: 'Generate secure SSH key pairs client-side using Web Crypto API.',
    path: '/ssh-key-generator',
    content,
    scripts: script
  }));
}
