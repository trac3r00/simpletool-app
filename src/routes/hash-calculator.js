/**
 * Hash Calculator Tool - Generate and verify cryptographic hashes
 * Supports text input and file uploads for hash calculation
 * All processing happens client-side for privacy
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint, createEmptyState } from '../utils/common-ui.js';
import { createEducationalSection } from '../utils/content-ui.js';

export async function handleHashCalculatorRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    // Support both old /hash-generator and new /hash-calculator routes
    if (pathname === '/hash-generator' || pathname === '/hash-generator/' ||
        pathname === '/hash-calculator' || pathname === '/hash-calculator/') {
      if (method === 'GET') {
        return renderHashCalculatorPage();
      }
    }

    return respondJSON({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Hash Calculator Route Error:', error);
    return respondJSON(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function renderHashCalculatorPage() {
  const toolHeader = createToolHeader(
    { emoji: '🔐' },
    'Hash Calculator',
    'Calculate and verify cryptographic hashes from text or files',
    [{ text: 'SHA-256 Recommended', color: 'green', tooltip: 'SHA-256 hashing is used by default because it is cryptographically strong and browser-native.' }],
    { toolId: 'hash-calculator' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      ${toolHeader}

       <!-- Status Badge -->
       <div class="mb-6 flex items-center justify-between">
         <div id="status-badge" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-300 text-sm font-medium">
           <span class="w-2 h-2 rounded-full bg-success-500 animate-pulse"></span>
           <span>Ready</span>
         </div>
       </div>

      <!-- Tab Navigation -->
      <div class="mb-8">
        <div class="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl border border-surface-200 dark:border-surface-700 w-fit" role="tablist">
          <button id="tab-text" class="tab-button active px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200 bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm" role="tab" aria-controls="content-text" aria-selected="true" data-tooltip="Hash text input directly">
            <span data-i18n="tools.hash-calculator.ui.button0">📝 Text</span>
          </button>
          <button id="tab-file" class="tab-button px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200" role="tab" aria-controls="content-file" aria-selected="false" data-tooltip="Hash a file upload">
            <span data-i18n="tools.hash-calculator.ui.button1">📁 File</span>
          </button>
          <button id="tab-verify" class="tab-button px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200" role="tab" aria-controls="content-verify" aria-selected="false" data-tooltip="Compare a known hash against input">
            <span data-i18n="tools.hash-calculator.ui.button2">✓ Verify</span>
          </button>
        </div>
      </div>

      <!-- Workspace -->
      <div class="grid lg:grid-cols-2 gap-8">
        <!-- Input Side -->
        <div class="space-y-6">
          <div class="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-4">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100">Legacy Hashes (MD5, SHA-1)</h3>
                <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">Opt in to legacy hashes for compatibility with older systems.</p>
              </div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" id="legacy-hashes" class="w-4 h-4 rounded border-surface-300 dark:border-surface-700 text-primary-600 focus:ring-2 focus:ring-primary-500">
                <span id="legacy-label" class="text-xs font-semibold text-surface-700 dark:text-surface-300">Enable</span>
              </label>
            </div>
            <p class="mt-3 text-xs text-error-600 dark:text-error-400">Warning: MD5 and SHA-1 are broken and should only be used for legacy verification.</p>
          </div>
          <!-- Text Input Content -->
          <div id="content-text" class="tab-content" role="tabpanel">
            <div class="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-6">
              <label class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3 block"><span data-i18n="tools.hash-calculator.ui.label9">Input Text</span></label>
              <textarea
                id="text-input"
                rows="8"
                placeholder="Enter text to hash..." data-i18n-placeholder="tools.hash-calculator.ui.placeholder13"
                class="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg p-3 font-mono text-sm text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-600 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              ></textarea>
              <div class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-600 dark:text-surface-400">
                <span>Length: <span id="text-length" class="font-semibold text-surface-900 dark:text-surface-100">0</span></span>
                <label class="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" id="text-live-hash" checked class="w-4 h-4 rounded border-surface-300 dark:border-surface-700 text-primary-600 focus:ring-2 focus:ring-primary-500">
                  <span class="group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Live Mode</span>
                </label>
              </div>
            </div>

            <div class="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-6">
              <label class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3 block" data-tooltip="Add a secret key to create a keyed hash (HMAC)"><span data-i18n="tools.hash-calculator.ui.label10">HMAC Secret (Optional)</span> ${infoHint('Optional private key for HMAC hashing; keep it secret when sharing hashes.')}</label>
              <input
                type="password"
                id="text-hmac"
                placeholder="Enter secret key..." data-i18n-placeholder="tools.hash-calculator.ui.placeholder14"
                class="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg p-3 font-mono text-sm text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

             <div class="flex gap-3">
               <button id="text-generate-btn" class="btn btn-primary flex-1">
                 <span id="text-hash-spinner" class="spinner-sm hidden" style="display:inline-block;vertical-align:middle;margin-right:6px;border-color:rgba(255,255,255,0.3);border-top-color:#fff;"></span>
                 <span data-i18n="tools.hash-calculator.ui.button3">Generate Hash</span>
               </button>
              <button id="text-clear-btn" class="btn btn-secondary">
                <span data-i18n="tools.hash-calculator.ui.button4">Clear</span>
              </button>
            </div>
          </div>

          <!-- File Upload Content -->
          <div id="content-file" class="tab-content hidden" role="tabpanel">
             <div id="file-drop-zone" class="bg-white dark:bg-surface-900 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-700 p-12 text-center cursor-pointer hover:border-info-500 dark:hover:border-info-500 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all group">
               <input type="file" id="file-input" class="hidden">
               <div class="w-16 h-16 bg-info-50 dark:bg-info-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                 <span class="material-symbols-rounded text-3xl text-info-600 dark:text-info-400">upload_file</span>
               </div>
              <p class="text-lg font-semibold text-surface-900 dark:text-surface-100" data-i18n="tools.hash-calculator.ui.desc17">Drop file here</p>
              <p class="text-sm text-surface-500 dark:text-surface-400 mt-1" data-i18n="tools.hash-calculator.ui.desc18">or click to browse</p>
            </div>

             <div id="file-info" class="hidden bg-info-50 dark:bg-info-900/20 rounded-lg border border-info-200 dark:border-info-800 p-4">
              <div class="flex items-center justify-between">
               <div class="flex items-center gap-3">
                   <span class="material-symbols-rounded text-2xl text-info-600 dark:text-info-400">description</span>
                  <div>
                    <div id="file-name" class="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate max-w-[200px]"></div>
                    <div id="file-size" class="text-xs text-surface-600 dark:text-surface-400"></div>
                  </div>
                </div>
                 <button id="file-clear" class="btn btn-ghost btn-xs text-error-600 dark:text-error-400"><span data-i18n="tools.hash-calculator.ui.button5">Remove</span></button>
              </div>
            </div>

            <div class="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-6">
              <label class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3 block" data-tooltip="Add a secret key to create a keyed hash (HMAC)"><span>HMAC Secret (Optional)</span> ${infoHint('Optional private key for HMAC hashing; keep it secret when sharing hashes.')}</label>
              <input
                type="password"
                id="file-hmac"
                placeholder="Enter secret key..." data-i18n-placeholder="tools.hash-calculator.ui.placeholder14"
                class="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg p-3 font-mono text-sm text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

             <button id="file-generate-btn" class="btn btn-primary w-full" disabled>
               <span id="file-hash-spinner" class="spinner-sm hidden" style="display:inline-block;vertical-align:middle;margin-right:6px;border-color:rgba(255,255,255,0.3);border-top-color:#fff;"></span>
               <span data-i18n="tools.hash-calculator.ui.button6">Process File</span>
             </button>
          </div>

          <!-- Verify Content -->
          <div id="content-verify" class="tab-content hidden" role="tabpanel">
            <div class="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-6">
              <label class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3 block"><span data-i18n="tools.hash-calculator.ui.label11">Expected Hash</span></label>
              <input
                type="text"
                id="verify-expected"
                placeholder="Paste hash to verify..." data-i18n-placeholder="tools.hash-calculator.ui.placeholder15"
                class="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg p-3 font-mono text-sm text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div class="mt-4">
                <label class="text-xs font-semibold text-surface-700 dark:text-surface-300 mb-2 block">Algorithm</label>
                <select
                  id="verify-algorithm"
                  class="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg px-3 py-2 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="auto">Auto (length)</option>
                  <option value="SHA-256">SHA-256</option>
                  <option value="SHA-384">SHA-384</option>
                  <option value="SHA-512">SHA-512</option>
                  <option value="SHA3-256">SHA3-256</option>
                  <option value="SHA3-512">SHA3-512</option>
                  <option value="SHAKE128">SHAKE128 (256-bit)</option>
                  <option value="SHAKE256">SHAKE256 (512-bit)</option>
                  <option value="Keccak-256">Keccak-256</option>
                  <option value="BLAKE2s-256">BLAKE2s-256</option>
                  <option value="BLAKE2b-512">BLAKE2b-512</option>
                  <option value="RIPEMD-160">RIPEMD-160</option>
                  <option value="MD5">MD5 (Legacy)</option>
                  <option value="SHA-1">SHA-1 (Legacy)</option>
                </select>
                <p class="mt-2 text-xs text-surface-500 dark:text-surface-400">Auto works only when the hash length maps to a single algorithm.</p>
              </div>
            </div>
            
            <div id="verify-drop-zone" class="bg-white dark:bg-surface-900 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-700 p-8 text-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all">
              <input type="file" id="verify-file-input" class="hidden">
              <span class="material-symbols-rounded text-3xl text-surface-400 dark:text-surface-600 mb-2" data-i18n="tools.hash-calculator.ui.desc19">verified_user</span>
              <p class="text-sm font-semibold text-surface-700 dark:text-surface-300" data-i18n="tools.hash-calculator.ui.desc20">Select file to verify</p>
            </div>

             <div id="verify-file-info" class="hidden bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-3">
               <div class="flex items-center justify-between text-xs">
                  <div class="min-w-0">
                    <div id="verify-file-name" class="font-mono text-surface-600 dark:text-surface-400 truncate max-w-[150px]"></div>
                    <div id="verify-file-size" class="text-[11px] text-surface-500 dark:text-surface-400"></div>
                  </div>
                   <button id="verify-file-clear" class="btn btn-ghost btn-xs text-error-600 dark:text-error-400"><span data-i18n="tools.hash-calculator.ui.button4">Clear</span></button>
               </div>
            </div>

            <button id="verify-btn" class="btn btn-primary w-full" disabled>
              <span data-i18n="tools.hash-calculator.ui.button7">Verify Integrity</span>
            </button>
          </div>
        </div>

        <!-- Output Side -->
        <div class="space-y-6">
          <div class="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-6 h-full flex flex-col">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-300"><span data-i18n="tools.hash-calculator.ui.label12">Hash Results</span></h2>
              <div id="perf-stats" class="hidden flex gap-4 text-xs text-surface-600 dark:text-surface-400">
                <span>Time: <span id="stat-time" class="font-semibold text-surface-900 dark:text-surface-100"></span>ms</span>
                <span>Speed: <span id="stat-speed" class="font-semibold text-surface-900 dark:text-surface-100"></span>MB/s</span>
              </div>
            </div>

            <div id="hash-results" class="space-y-4 flex-grow">
               ${createEmptyState({ icon: '🔐', title: 'Awaiting input', description: 'Enter text or drop a file to compute hashes.', id: 'hash-empty-state' })}
             </div>

            <div id="verify-result" class="hidden mt-6"></div>
          </div>
        </div>
      </div>

       <!-- Security Notice -->
       <div class="mt-12 p-6 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 flex gap-4 items-start">
         <div class="p-2 bg-error-100 dark:bg-error-900/40 rounded-lg">
           <span class="material-symbols-rounded text-error-600 dark:text-error-400">security</span>
         </div>
         <div>
           <h2 class="text-sm font-semibold text-error-700 dark:text-error-300 mb-1" data-i18n="tools.hash-calculator.ui.heading16">Security Notice</h2>
           <p class="text-sm text-error-600 dark:text-error-400 leading-relaxed" data-i18n="tools.hash-calculator.ui.desc22">MD5 and SHA-1 are cryptographically broken and disabled by default. You can opt in to legacy hashes for compatibility only. All processing occurs in a sandboxed client-side environment using the Web Crypto API. No data is transmitted to external servers.</p>
         </div>
       </div>

      ${createCheatsheet('hash-calculator', 'Hash Algorithm Reference', [
        { heading: 'Algorithm Comparison', content: `
          <table>
            <tr><th>Algorithm</th><th>Output</th><th>Security</th><th>Use Cases</th></tr>
            <tr><td><code>MD5</code></td><td>128-bit</td><td>⚠️ Broken</td><td>Legacy checksums (opt-in)</td></tr>
            <tr><td><code>SHA-1</code></td><td>160-bit</td><td>⚠️ Deprecated</td><td>Legacy compatibility (opt-in)</td></tr>
            <tr><td><code>SHA-256</code></td><td>256-bit</td><td>✅ Secure</td><td>General purpose, TLS</td></tr>
            <tr><td><code>SHA-384</code></td><td>384-bit</td><td>✅ Secure</td><td>TLS certificates</td></tr>
            <tr><td><code>SHA-512</code></td><td>512-bit</td><td>✅ Secure</td><td>High-security applications</td></tr>
          </table>` },
        { heading: 'HMAC', content: '<p>HMAC adds a secret key to the hash, creating a keyed hash for message authentication. Use it when you need to verify both integrity and authenticity.</p>' }
      ])}
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'What is Hashing?',
          content: `
            <p>Cryptographic hashing is a mathematical process that transforms any input data (text or files) into a fixed-size string of characters, typically a hexadecimal number. This "fingerprint" is unique to the input; even a single bit change in the source data will result in a completely different hash, a phenomenon known as the <strong>avalanche effect</strong>.</p>
            <p>Unlike encryption, hashing is a <strong>one-way function</strong>. You cannot reverse a hash to retrieve the original data. This makes it ideal for verifying data integrity, storing passwords securely (when combined with salts), and identifying files without exposing their contents.</p>
          `
        },
        {
          title: 'How to Use This Tool',
          content: `
            <ol>
              <li><strong>Select Input Type:</strong> Choose the "Text" tab for strings or the "File" tab for local files.</li>
              <li><strong>Provide Input:</strong> Paste your text or drag and drop your file into the workspace.</li>
              <li><strong>Optional HMAC:</strong> Enter a secret key in the HMAC field if you need to generate a keyed hash for authentication.</li>
              <li><strong>Review Results:</strong> The tool automatically computes multiple hash variants (SHA-256, SHA-512, etc.) in real-time.</li>
              <li><strong>Verify Integrity:</strong> Use the "Verify" tab to compare a known hash against your input to check for tampering.</li>
            </ol>
          `
        },
        {
          title: 'Common Use Cases',
          content: `
            <ul>
              <li><strong>Software Verification:</strong> Checking the SHA-256 checksum of a downloaded installer to ensure it hasn't been corrupted or modified by a third party.</li>
              <li><strong>Data Integrity:</strong> Generating hashes for database records or configuration files to detect unauthorized changes over time.</li>
              <li><strong>Password Security:</strong> Understanding how different algorithms (like SHA-512) transform plain text into secure representations.</li>
              <li><strong>Digital Forensics:</strong> Identifying duplicate files or verifying that evidence has not been altered.</li>
            </ul>
          `
        },
        {
          title: 'Pro Tips',
          content: `
            <ul>
              <li><strong>Prefer SHA-256+:</strong> Always use SHA-256 or SHA-512 for security-sensitive tasks. MD5 and SHA-1 are cryptographically broken and should only be used for legacy compatibility.</li>
              <li><strong>Use HMAC for Authenticity:</strong> If you need to verify both integrity and the identity of the sender, use HMAC with a shared secret key.</li>
              <li><strong>Check the Source:</strong> When verifying downloads, always obtain the expected hash from a trusted, HTTPS-secured official website.</li>
            </ul>
          `
        }
      ], 'hash-calculator')}
    </div>
  `;

  const script = `
    <script src="/vendor/noble-hashes.min.js"></script>
    <script src="/vendor/md5.min.js" integrity="sha384-JmVtRz6RWiXnA14QbIOJzPuU3MidULOpBP66deeLLyyoF4Tr/gZlbkHkL6vTthxH" crossorigin="anonymous"></script>
    <script>
      // Tab Management
      const tabButtons = document.querySelectorAll('.tab-button');
      const tabContents = document.querySelectorAll('.tab-content');

      tabButtons.forEach(button => {
        button.addEventListener('click', () => {
          const targetId = button.getAttribute('aria-controls');
          
          // Reset states
          tabButtons.forEach(btn => {
            btn.classList.remove('active', 'bg-white', 'dark:bg-surface-900', 'text-primary-600', 'dark:text-primary-400', 'shadow-sm');
            btn.classList.add('text-surface-600', 'dark:text-surface-400');
            btn.setAttribute('aria-selected', 'false');
          });
          
          tabContents.forEach(content => {
            content.classList.add('hidden');
          });

          // Activate selected
          button.classList.add('active', 'bg-white', 'dark:bg-surface-900', 'text-primary-600', 'dark:text-primary-400', 'shadow-sm');
          button.classList.remove('text-surface-600', 'dark:text-surface-400');
          button.setAttribute('aria-selected', 'true');
          
          const targetContent = document.getElementById(targetId);
          targetContent.classList.remove('hidden');

           // Clean up results
           document.getElementById('hash-results').innerHTML = \`${createEmptyState({ icon: '🔐', title: 'Awaiting input', description: 'Enter text or drop a file to compute hashes.', id: 'hash-empty-state' })}\`;
          document.getElementById('perf-stats').classList.add('hidden');
          updateStatusBadge('ready');
        });
      });

      // Shared state
      let currentFileData = null;
      let verifyFileData = null;

      const textEncoder = new TextEncoder();
      const WEB_CRYPTO_HASHES = ['SHA-256', 'SHA-384', 'SHA-512'];
      const LEGACY_HASHES = ['MD5', 'SHA-1'];
      const NOBLE_HASHES = {
        'SHA3-256': { hash: (bytes) => window.NobleHashes.sha3_256(bytes), hexLength: 64 },
        'SHA3-512': { hash: (bytes) => window.NobleHashes.sha3_512(bytes), hexLength: 128 },
        'SHAKE128': { hash: (bytes) => window.NobleHashes.shake128(bytes, 32), hexLength: 64 },
        'SHAKE256': { hash: (bytes) => window.NobleHashes.shake256(bytes, 64), hexLength: 128 },
        'Keccak-256': { hash: (bytes) => window.NobleHashes.keccak_256(bytes), hexLength: 64 },
        'BLAKE2s-256': { hash: (bytes) => window.NobleHashes.blake2s(bytes), hexLength: 64 },
        'BLAKE2b-512': { hash: (bytes) => window.NobleHashes.blake2b(bytes), hexLength: 128 },
        'RIPEMD-160': { hash: (bytes) => window.NobleHashes.ripemd160(bytes), hexLength: 40 }
      };
      const VERIFY_HASH_OPTIONS = [
        { id: 'SHA-256', hexLength: 64, legacy: false },
        { id: 'SHA-384', hexLength: 96, legacy: false },
        { id: 'SHA-512', hexLength: 128, legacy: false },
        { id: 'SHA3-256', hexLength: 64, legacy: false },
        { id: 'SHA3-512', hexLength: 128, legacy: false },
        { id: 'SHAKE128', hexLength: 64, legacy: false },
        { id: 'SHAKE256', hexLength: 128, legacy: false },
        { id: 'Keccak-256', hexLength: 64, legacy: false },
        { id: 'BLAKE2s-256', hexLength: 64, legacy: false },
        { id: 'BLAKE2b-512', hexLength: 128, legacy: false },
        { id: 'RIPEMD-160', hexLength: 40, legacy: false },
        { id: 'MD5', hexLength: 32, legacy: true },
        { id: 'SHA-1', hexLength: 40, legacy: true }
      ];
      let legacyEnabled = false;

      function updateStatusBadge(status) {
        const badge = document.getElementById('status-badge');
       const statusConfig = {
           ready: {
             text: 'Ready',
             classes: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-700 dark:text-success-300'
           },
           processing: {
             text: 'Processing...',
             classes: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800 text-warning-700 dark:text-warning-300'
           },
           completed: {
             text: 'Completed',
             classes: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-700 dark:text-success-300'
           },
           failed: {
             text: 'Failed',
             classes: 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800 text-error-700 dark:text-error-300'
           }
         };
        const config = statusConfig[status] || statusConfig.ready;
        badge.className = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ' + config.classes;
        badge.querySelector('span:last-child').textContent = config.text;
      }

      const legacyToggle = document.getElementById('legacy-hashes');
      const legacyLabel = document.getElementById('legacy-label');

      const updateLegacyState = (enabled) => {
        legacyEnabled = enabled;
        legacyLabel.textContent = enabled ? 'Enabled' : 'Enable';
      };

      updateLegacyState(legacyToggle.checked);

      legacyToggle.addEventListener('change', () => {
        updateLegacyState(legacyToggle.checked);
        const activeTab = document.querySelector('.tab-button.active')?.getAttribute('aria-controls');
        if (activeTab === 'content-text' && textInput.value.length > 0 && textLiveHash.checked) {
          generateAllHashes(textInput.value, textHmac.value.trim() || null);
        }
        if (activeTab === 'content-file' && currentFileData) {
          const fileHmacInput = document.getElementById('file-hmac');
          const fileSecret = fileHmacInput ? fileHmacInput.value.trim() : null;
          generateAllHashes(currentFileData, fileSecret || null);
        }
      });

      function toBinaryString(bytes) {
        let result = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          result += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }
        return result;
      }

      function md5HexFromData(data) {
        if (!window.md5) {
          throw new Error('MD5 library failed to load.');
        }
        if (typeof data === 'string') {
          return window.md5(data);
        }
        if (window.md5.arrayBuffer) {
          const buffer = data instanceof ArrayBuffer
            ? data
            : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
          return window.md5.arrayBuffer(buffer);
        }
        try {
          return window.md5(data);
        } catch (error) {
          return window.md5(toBinaryString(data));
        }
      }

      function isHmacSupported(algorithm, allowLegacy) {
        return WEB_CRYPTO_HASHES.includes(algorithm) || (allowLegacy && LEGACY_HASHES.includes(algorithm));
      }

      function getBytes(data) {
        if (data instanceof Uint8Array) return data;
        if (typeof data === 'string') return textEncoder.encode(data);
        if (data instanceof ArrayBuffer) return new Uint8Array(data);
        return new Uint8Array(data);
      }

      function toHex(data) {
        if (!window.NobleHashes || !window.NobleHashes.bytesToHex) {
          throw new Error('Noble hashes library failed to load.');
        }
        const bytes = data instanceof Uint8Array ? data : getBytes(data);
        return window.NobleHashes.bytesToHex(bytes);
      }

      // Generate hash using Web Crypto API
      async function generateHash(algorithm, data, secret = null, allowLegacy = false) {
        const bytes = getBytes(data);

        if (secret) {
          if (algorithm === 'MD5') throw new Error('HMAC-MD5 is not supported in browsers.');
          if (!isHmacSupported(algorithm, allowLegacy)) throw new Error('Unsupported HMAC algorithm: ' + algorithm);
          const keyData = textEncoder.encode(secret);
          const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: algorithm }, false, ['sign']);
          const signature = await crypto.subtle.sign('HMAC', key, bytes);
          return toHex(new Uint8Array(signature));
        }

        if (algorithm === 'MD5') {
          return md5HexFromData(typeof data === 'string' ? data : bytes);
        }

        if (NOBLE_HASHES[algorithm]) {
          return toHex(NOBLE_HASHES[algorithm].hash(bytes));
        }

        if (WEB_CRYPTO_HASHES.includes(algorithm) || (allowLegacy && algorithm === 'SHA-1')) {
          const hashBuffer = await crypto.subtle.digest(algorithm, bytes);
          return toHex(new Uint8Array(hashBuffer));
        }

        throw new Error('Unsupported hash algorithm: ' + algorithm);
      }

       function displayHash(name, hash, color, description) {
         const colorClasses = {
           green: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-700 dark:text-success-300',
           indigo: 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300',
           blue: 'bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800 text-info-700 dark:text-info-300'
         }[color] || 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-800 text-surface-900 dark:text-surface-100';

        return \`
          <div class="p-5 rounded-xl border \${colorClasses} transition-all hover:shadow-md group">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-current"></div>
                <h3 class="text-xs font-semibold">
                  \${name}
                </h3>
              </div>
              <button data-copy-hash="\${hash}" class="copy-hash-btn btn btn-ghost btn-xs border border-current/30">
                <span data-i18n="tools.hash-calculator.ui.button8">Copy</span>
              </button>
            </div>
            <code class="block text-xs font-mono break-all mb-3 p-3 bg-white dark:bg-surface-950 rounded-lg border border-current/20">
              \${hash}
            </code>
            <p class="text-xs opacity-75">
              \${description}
            </p>
          </div>
        \`;
      }

       async function generateAllHashes(data, secret = null) {
         updateStatusBadge('processing');

         const textHashSpinner = document.getElementById('text-hash-spinner');
         const fileHashSpinner = document.getElementById('file-hash-spinner');
         const activeTab = document.querySelector('.tab-button.active')?.getAttribute('aria-controls');
         
         if (activeTab === 'content-text') {
           textHashSpinner.classList.remove('hidden');
         } else if (activeTab === 'content-file') {
           fileHashSpinner.classList.remove('hidden');
         }

         const isText = typeof data === 'string';
         const startTime = performance.now();
         const hashes = [];

        try {
          const variants = secret
            ? [
                { label: 'HMAC-SHA-256', algorithm: 'SHA-256', color: 'green', description: 'HMAC-SHA-256' },
                { label: 'HMAC-SHA-384', algorithm: 'SHA-384', color: 'indigo', description: 'HMAC-SHA-384' },
                { label: 'HMAC-SHA-512', algorithm: 'SHA-512', color: 'blue', description: 'HMAC-SHA-512' }
              ]
            : [
                { label: 'SHA-256', algorithm: 'SHA-256', color: 'green', description: 'Recommended standard' },
                { label: 'SHA-384', algorithm: 'SHA-384', color: 'indigo', description: 'Extended security' },
                { label: 'SHA-512', algorithm: 'SHA-512', color: 'blue', description: 'Maximum security' },
                { label: 'SHA3-256', algorithm: 'SHA3-256', color: 'green', description: 'SHA-3 standard' },
                { label: 'SHA3-512', algorithm: 'SHA3-512', color: 'blue', description: 'SHA-3 standard (512-bit)' },
                { label: 'SHAKE128 (256-bit)', algorithm: 'SHAKE128', color: 'indigo', description: 'SHAKE128 with 256-bit output' },
                { label: 'SHAKE256 (512-bit)', algorithm: 'SHAKE256', color: 'blue', description: 'SHAKE256 with 512-bit output' },
                { label: 'Keccak-256', algorithm: 'Keccak-256', color: 'green', description: 'Keccak legacy variant' },
                { label: 'BLAKE2s-256', algorithm: 'BLAKE2s-256', color: 'indigo', description: 'Fast modern hash (256-bit)' },
                { label: 'BLAKE2b-512', algorithm: 'BLAKE2b-512', color: 'blue', description: 'High-throughput hash (512-bit)' },
                { label: 'RIPEMD-160', algorithm: 'RIPEMD-160', color: 'indigo', description: 'Legacy-friendly 160-bit hash' }
              ];

          if (legacyEnabled) {
            if (secret) {
              variants.push({ label: 'HMAC-SHA-1', algorithm: 'SHA-1', color: 'blue', description: 'Legacy HMAC-SHA-1' });
            } else {
              variants.push(
                { label: 'MD5', algorithm: 'MD5', color: 'indigo', description: 'Legacy checksum' },
                { label: 'SHA-1', algorithm: 'SHA-1', color: 'blue', description: 'Legacy checksum' }
              );
            }
          }

          for (const variant of variants) {
            const result = await generateHash(variant.algorithm, data, secret, legacyEnabled);
            hashes.push({ name: variant.label, hash: result, color: variant.color, description: variant.description });
          }

          document.getElementById('hash-results').innerHTML = hashes.map(h => displayHash(h.name, h.hash, h.color, h.description)).join('');

          const duration = (performance.now() - startTime).toFixed(2);
          const sizeBytes = isText ? new TextEncoder().encode(data).length : data.byteLength;
          const sizeMB = sizeBytes / (1024 * 1024);
          const speed = duration > 0 ? (sizeMB / (duration / 1000)).toFixed(2) : '∞';

           document.getElementById('stat-time').textContent = duration;
           document.getElementById('stat-speed').textContent = speed;
           document.getElementById('perf-stats').classList.remove('hidden');
           
           textHashSpinner.classList.add('hidden');
           fileHashSpinner.classList.add('hidden');
           updateStatusBadge('completed');

           } catch (error) {
             const hashResults = document.getElementById('hash-results');
             hashResults.innerHTML = '';
             const errDiv = document.createElement('div');
             errDiv.className = 'p-6 text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl font-mono text-sm';
             errDiv.textContent = 'Error: ' + error.message;
             hashResults.appendChild(errDiv);
             textHashSpinner.classList.add('hidden');
             fileHashSpinner.classList.add('hidden');
             updateStatusBadge('failed');
           }
      }
      // Event delegation for copy buttons
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.copy-hash-btn');
        if (btn) {
          const hash = btn.dataset.copyHash;
          if(window.copyToClipboard) {
             window.copyToClipboard(hash, btn);
          } else {
             navigator.clipboard.writeText(hash);
             if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
          }
        }
      });

      // Text Input Handlers
      const textInput = document.getElementById('text-input');
      const textHmac = document.getElementById('text-hmac');
      const textLiveHash = document.getElementById('text-live-hash');

      const runTextHash = () => {
        document.getElementById('text-length').textContent = textInput.value.length;
        if (textLiveHash.checked && textInput.value.length > 0) {
          clearTimeout(window.textHashTimeout);
          window.textHashTimeout = setTimeout(() => {
            generateAllHashes(textInput.value, textHmac.value.trim() || null);
          }, 300);
        }
      };

      textInput.addEventListener('input', runTextHash);
      textHmac.addEventListener('input', runTextHash);

      document.getElementById('text-generate-btn').addEventListener('click', () => {
        if (textInput.value) generateAllHashes(textInput.value, textHmac.value.trim() || null);
      });

      document.getElementById('text-clear-btn').addEventListener('click', () => {
        textInput.value = '';
        textHmac.value = '';
        document.getElementById('hash-results').innerHTML = '';
        document.getElementById('perf-stats').classList.add('hidden');
        document.getElementById('text-length').textContent = '0';
      });

      // File Upload Handlers
      const fileInput = document.getElementById('file-input');
      const fileDropZone = document.getElementById('file-drop-zone');
      
      fileDropZone.addEventListener('click', () => fileInput.click());
      fileDropZone.addEventListener('dragover', (e) => { e.preventDefault(); fileDropZone.classList.add('border-primary-500'); });
      fileDropZone.addEventListener('dragleave', () => fileDropZone.classList.remove('border-primary-500'));
      fileDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropZone.classList.remove('border-primary-500');
        if (e.dataTransfer.files.length) handleFileSelect(e.dataTransfer.files[0]);
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFileSelect(e.target.files[0]);
      });

      function handleFileSelect(file) {
        document.getElementById('file-name').textContent = file.name;
        document.getElementById('file-size').textContent = (file.size / 1024).toFixed(2) + ' KB';
        document.getElementById('file-info').classList.remove('hidden');
        document.getElementById('file-generate-btn').disabled = false;

        const reader = new FileReader();
        reader.onload = (e) => currentFileData = new Uint8Array(e.target.result);
        reader.readAsArrayBuffer(file);
      }

      document.getElementById('file-generate-btn').addEventListener('click', () => {
        if (currentFileData) generateAllHashes(currentFileData, document.getElementById('file-hmac').value.trim() || null);
      });

      document.getElementById('file-clear').addEventListener('click', () => {
        currentFileData = null;
        document.getElementById('file-info').classList.add('hidden');
        document.getElementById('file-generate-btn').disabled = true;
        document.getElementById('hash-results').innerHTML = '';
        document.getElementById('perf-stats').classList.add('hidden');
        fileInput.value = '';
      });

      // Verification Handlers
      const verifyFileInput = document.getElementById('verify-file-input');
      const verifyDropZone = document.getElementById('verify-drop-zone');
      
      verifyDropZone.addEventListener('click', () => verifyFileInput.click());
      verifyDropZone.addEventListener('dragover', (e) => { e.preventDefault(); verifyDropZone.classList.add('border-primary-500'); });
      verifyDropZone.addEventListener('dragleave', () => verifyDropZone.classList.remove('border-primary-500'));
      verifyDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        verifyDropZone.classList.remove('border-primary-500');
        if (e.dataTransfer.files.length) handleVerifyFile(e.dataTransfer.files[0]);
      });

      verifyFileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleVerifyFile(e.target.files[0]);
      });

      function handleVerifyFile(file) {
        document.getElementById('verify-file-name').textContent = file.name;
        document.getElementById('verify-file-size').textContent = (file.size / 1024).toFixed(2) + ' KB';
        document.getElementById('verify-file-info').classList.remove('hidden');
        
        const reader = new FileReader();
        reader.onload = (e) => {
          verifyFileData = new Uint8Array(e.target.result);
          checkVerifyBtn();
        };
        reader.readAsArrayBuffer(file);
      }

      document.getElementById('verify-expected').addEventListener('input', checkVerifyBtn);

      function checkVerifyBtn() {
        const expectedRaw = document.getElementById('verify-expected').value;
        const expected = expectedRaw.replace(/\s+/g, '').trim();
        document.getElementById('verify-btn').disabled = !verifyFileData || !expected;
      }

      function renderVerifyPanel({ title, message, expected, computed, tone }) {
        const verifyResult = document.getElementById('verify-result');
        const panel = document.createElement('div');
         const toneClass = tone === 'success'
            ? 'bg-success-50 dark:bg-success-900/20 border-success-500 dark:border-success-700 text-success-700 dark:text-success-300'
            : 'bg-error-50 dark:bg-error-900/20 border-error-500 dark:border-error-700 text-error-700 dark:text-error-300';
        panel.className = 'p-6 rounded-xl border-2 ' + toneClass + ' font-mono';

        const titleEl = document.createElement('h3');
        titleEl.className = 'text-lg font-semibold mb-3';
        titleEl.textContent = title;

        panel.appendChild(titleEl);

        if (message) {
          const messageEl = document.createElement('p');
          messageEl.className = 'text-xs opacity-90';
          messageEl.textContent = message;
          panel.appendChild(messageEl);
        }

        if (expected || computed) {
          const details = document.createElement('div');
          details.className = 'space-y-2 text-xs opacity-90 mt-3';

          if (expected) {
            const expectedLine = document.createElement('p');
            expectedLine.className = 'break-all';
            expectedLine.textContent = 'Expected: ' + expected;
            details.appendChild(expectedLine);
          }

          if (computed) {
            const computedLine = document.createElement('p');
            computedLine.className = 'break-all';
            computedLine.textContent = 'Computed: ' + computed;
            details.appendChild(computedLine);
          }

          panel.appendChild(details);
        }

        verifyResult.replaceChildren(panel);
        verifyResult.classList.remove('hidden');
      }

      document.getElementById('verify-btn').addEventListener('click', async () => {
        const expectedRaw = document.getElementById('verify-expected').value;
        const expected = expectedRaw.replace(/\s+/g, '').toLowerCase();
        const selectedAlgo = document.getElementById('verify-algorithm').value;
        let algo = null;

        if (!expected) {
          renderVerifyPanel({ title: 'Missing hash', message: 'Enter a hash to verify.', tone: 'error' });
          return;
        }

        if (!/^[0-9a-f]+$/i.test(expected)) {
          renderVerifyPanel({ title: 'Invalid hash', message: 'Use hexadecimal characters only.', tone: 'error' });
          return;
        }

        if (selectedAlgo === 'auto') {
          const candidates = VERIFY_HASH_OPTIONS.filter((option) => {
            if (option.hexLength !== expected.length) return false;
            if (!legacyEnabled && option.legacy) return false;
            return true;
          });

          if (candidates.length === 0) {
            renderVerifyPanel({ title: 'Invalid length', message: 'Select an algorithm for this hash length.', tone: 'error' });
            return;
          }

          if (candidates.length > 1) {
            renderVerifyPanel({ title: 'Ambiguous length', message: 'Pick a specific algorithm to verify.', tone: 'error' });
            return;
          }

          algo = candidates[0].id;
        } else {
          const selection = VERIFY_HASH_OPTIONS.find((option) => option.id === selectedAlgo);
          if (!selection) {
            renderVerifyPanel({ title: 'Unsupported algorithm', message: 'Choose a different algorithm.', tone: 'error' });
            return;
          }
          if (selection.legacy && !legacyEnabled) {
            renderVerifyPanel({ title: 'Legacy disabled', message: 'Enable legacy hashes to verify MD5/SHA-1.', tone: 'error' });
            return;
          }
          if (expected.length !== selection.hexLength) {
            renderVerifyPanel({ title: 'Length mismatch', message: 'Expected ' + selection.hexLength + ' hex characters.', tone: 'error' });
            return;
          }
          algo = selection.id;
        }

        const calculated = await generateHash(algo, verifyFileData, null, legacyEnabled);
        const match = calculated.toLowerCase() === expected;
        renderVerifyPanel({
          title: match ? '✓ Integrity Verified' : '✗ Verification Failed',
          expected,
          computed: calculated,
          tone: match ? 'success' : 'error'
        });
      });

      document.getElementById('verify-file-clear').addEventListener('click', () => {
        verifyFileData = null;
        document.getElementById('verify-file-info').classList.add('hidden');
        verifyFileInput.value = '';
        document.getElementById('verify-result').classList.add('hidden');
        checkVerifyBtn();
      });

    </script>
  `;

  return respondHTML(createPageTemplate({
    title: 'Hash Calculator',
    description: 'Calculate and verify cryptographic hashes from text or files. Support for SHA-256, SHA-384, SHA-512, and HMAC.',
    path: '/hash-calculator',
    content,
    scripts: script
  }));
}
