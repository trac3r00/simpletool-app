/**
 * Encoding & Decoding Workbench — Unified tool merging Hash Calculator + Layered Decoder
 * Tabs: Encode/Decode | Hash | Identify
 * All processing happens client-side for privacy
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createEmptyState } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleEncodingWorkbenchRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === '/encoding-workbench' || pathname === '/encoding-workbench/') {
      if (method === 'GET') {
        return renderEncodingWorkbenchPage(resolveRequestLanguage(request, url));
      }
    }

    return respondJSON({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Encoding Workbench Route Error:', error);
    return respondJSON(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function renderEncodingWorkbenchPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('encoding-workbench', currentLang);
  const toolHeader = createToolHeader(
    { emoji: '🔓' },
    translation?.name || 'Encoding & Decoding Workbench',
    translation?.desc || 'Encode, decode, hash, and identify data transformations',
    [{ text: translation?.ui?.badge0 || 'Privacy First', color: 'green', tooltip: 'All processing happens in your browser — no data is sent to any server.' }],
    { toolId: 'encoding-workbench' }
  );

  const currentTool = TOOLS.find(t => t.id === 'encoding-workbench');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">

        ${toolHeader}

        <!-- Tab Navigation -->
        <div class="mb-8">
          <div class="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl border border-surface-200 dark:border-surface-700 w-fit" role="tablist">
            <button id="tab-encode" class="tab-btn active px-5 py-2 rounded-lg font-medium text-sm transition-all duration-200 bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm" role="tab" aria-controls="panel-encode" aria-selected="true" data-tooltip="Encode and decode text between formats" data-i18n-tooltip="tools.encoding-workbench.ui.tip0">
              <span data-i18n="tools.encoding-workbench.ui.tab0">🔄 Encode / Decode</span>
            </button>
            <button id="tab-hash" class="tab-btn px-5 py-2 rounded-lg font-medium text-sm transition-all duration-200 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200" role="tab" aria-controls="panel-hash" aria-selected="false" data-tooltip="Generate cryptographic hashes" data-i18n-tooltip="tools.encoding-workbench.ui.tip1">
              <span data-i18n="tools.encoding-workbench.ui.tab1"># Hash</span>
            </button>
            <button id="tab-identify" class="tab-btn px-5 py-2 rounded-lg font-medium text-sm transition-all duration-200 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200" role="tab" aria-controls="panel-identify" aria-selected="false" data-tooltip="Identify unknown hashes or encoded strings" data-i18n-tooltip="tools.encoding-workbench.ui.tip2">
              <span data-i18n="tools.encoding-workbench.ui.tab2">🔍 Identify</span>
            </button>
          </div>
        </div>

        <!-- ===== PANEL: Encode / Decode ===== -->
        <div id="panel-encode" class="tab-panel">

          <!-- Input -->
          <div class="mb-4">
            <label class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
              <span data-i18n="tools.encoding-workbench.ui.label0">Input</span>
            </label>
            <textarea
              id="enc-input"
              rows="5"
              placeholder="Paste text or encoded data here…"
              data-i18n-placeholder="tools.encoding-workbench.ui.placeholder0"
              class="w-full p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-600 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            ></textarea>
          </div>

          <!-- Operation Buttons -->
          <div class="flex flex-wrap gap-2 mb-4">
            <button class="enc-op-btn btn btn-secondary btn-sm" data-op="base64-encode" data-i18n="tools.encoding-workbench.ui.op0">Base64 Encode</button>
            <button class="enc-op-btn btn btn-secondary btn-sm" data-op="base64-decode" data-i18n="tools.encoding-workbench.ui.op1">Base64 Decode</button>
            <button class="enc-op-btn btn btn-secondary btn-sm" data-op="url-encode" data-i18n="tools.encoding-workbench.ui.op2">URL Encode</button>
            <button class="enc-op-btn btn btn-secondary btn-sm" data-op="url-decode" data-i18n="tools.encoding-workbench.ui.op3">URL Decode</button>
            <button class="enc-op-btn btn btn-secondary btn-sm" data-op="html-encode" data-i18n="tools.encoding-workbench.ui.op4">HTML Encode</button>
            <button class="enc-op-btn btn btn-secondary btn-sm" data-op="html-decode" data-i18n="tools.encoding-workbench.ui.op5">HTML Decode</button>
            <button class="enc-op-btn btn btn-secondary btn-sm" data-op="hex-encode" data-i18n="tools.encoding-workbench.ui.op6">Hex Encode</button>
            <button class="enc-op-btn btn btn-secondary btn-sm" data-op="hex-decode" data-i18n="tools.encoding-workbench.ui.op7">Hex Decode</button>
            <span class="border-l border-surface-200 dark:border-surface-700 mx-1"></span>
            <button id="auto-detect-btn" class="btn btn-primary btn-sm" data-i18n="tools.encoding-workbench.ui.op8">🔎 Auto-Detect Layers</button>
          </div>

          <!-- Decode Chain Visualization -->
          <div id="decode-chain" class="hidden mb-6">
            <p class="text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-3" data-i18n="tools.encoding-workbench.ui.chainLabel">Detected Encoding Layers</p>
            <div id="chain-steps" class="flex flex-wrap items-center gap-2"></div>
            <div class="mt-4 flex gap-2">
              <button id="decode-all-btn" class="btn btn-primary btn-sm" data-i18n="tools.encoding-workbench.ui.decodeAll">⚡ Decode All Layers</button>
            </div>
          </div>

          <!-- Output -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                <span data-i18n="tools.encoding-workbench.ui.label1">Output</span>
              </label>
              <button id="enc-copy-btn" class="btn btn-ghost btn-xs text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800" data-i18n="tools.encoding-workbench.ui.copy">Copy</button>
            </div>
            <div id="enc-empty" class="">
              ${createEmptyState({ icon: '🔄', title: 'No output yet', description: 'Choose an operation above or click Auto-Detect Layers.', id: 'enc-empty-state', i18nTitle: 'tools.encoding-workbench.ui.desc0', i18nDesc: 'tools.encoding-workbench.ui.desc1' })}
            </div>
            <textarea
              id="enc-output"
              rows="5"
              readonly
              placeholder=""
              class="hidden w-full p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            ></textarea>
            <div id="enc-error" class="hidden mt-2 px-3 py-2 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300 border border-error-200 dark:border-error-800 text-sm"></div>
          </div>

          <div class="mt-4 flex gap-2">
            <button id="enc-clear-btn" class="btn btn-ghost btn-sm ml-auto" data-i18n="tools.encoding-workbench.ui.clear">Clear</button>
          </div>
        </div>

        <!-- ===== PANEL: Hash ===== -->
        <div id="panel-hash" class="tab-panel hidden">
          <div class="grid lg:grid-cols-2 gap-8">

            <!-- Input side -->
            <div class="space-y-5">

              <!-- Mode toggle -->
              <div class="flex gap-2">
                <button id="hash-mode-text" class="hash-mode-btn btn btn-primary btn-sm" data-mode="text" data-i18n="tools.encoding-workbench.ui.hashModeText">📝 Text</button>
                <button id="hash-mode-file" class="hash-mode-btn btn btn-secondary btn-sm" data-mode="file" data-i18n="tools.encoding-workbench.ui.hashModeFile">📁 File</button>
              </div>

              <!-- Text input -->
              <div id="hash-text-section">
                <label class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                  <span data-i18n="tools.encoding-workbench.ui.hashInputLabel">Input Text</span>
                </label>
                <textarea
                  id="hash-text-input"
                  rows="6"
                  placeholder="Enter text to hash…"
                  data-i18n-placeholder="tools.encoding-workbench.ui.hashPlaceholder"
                  class="w-full p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-600 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                ></textarea>
              </div>

              <!-- File input -->
              <div id="hash-file-section" class="hidden">
                <div id="hash-drop-zone" class="border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-xl p-10 text-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-all group">
                  <input type="file" id="hash-file-input" class="hidden">
                  <div class="w-14 h-14 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <span class="text-3xl">📁</span>
                  </div>
                  <p class="text-sm font-semibold text-surface-700 dark:text-surface-300" data-i18n="tools.encoding-workbench.ui.dropFile">Drop file here or click to browse</p>
                  <p class="text-xs text-surface-500 dark:text-surface-400 mt-1" data-i18n="tools.encoding-workbench.ui.dropFileHint">Processed entirely in your browser</p>
                </div>
                <div id="hash-file-info" class="hidden mt-3 px-4 py-3 rounded-lg bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 flex items-center justify-between">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-xl">📄</span>
                    <div class="min-w-0">
                      <div id="hash-file-name" class="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate max-w-[180px]"></div>
                      <div id="hash-file-size" class="text-xs text-surface-600 dark:text-surface-400"></div>
                    </div>
                  </div>
                  <button id="hash-file-clear" class="btn btn-ghost btn-xs text-error-600 dark:text-error-400" data-i18n="tools.encoding-workbench.ui.remove">Remove</button>
                </div>
              </div>

              <!-- Algorithm checkboxes -->
              <div>
                <p class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2" data-i18n="tools.encoding-workbench.ui.algoLabel">Algorithms</p>
                <div class="flex flex-wrap gap-2" id="algo-checkboxes">
                  <label class="algo-label"><input type="checkbox" class="algo-cb" value="SHA-256" checked> SHA-256</label>
                  <label class="algo-label"><input type="checkbox" class="algo-cb" value="SHA-384"> SHA-384</label>
                  <label class="algo-label"><input type="checkbox" class="algo-cb" value="SHA-512"> SHA-512</label>
                  <label class="algo-label"><input type="checkbox" class="algo-cb" value="SHA-1"> SHA-1</label>
                  <label class="algo-label"><input type="checkbox" class="algo-cb" value="MD5"> MD5</label>
                </div>
              </div>

              <!-- HMAC toggle -->
              <div>
                <label class="flex items-center gap-2 cursor-pointer mb-2">
                  <input type="checkbox" id="hmac-toggle" class="w-4 h-4 rounded border-surface-300 dark:border-surface-700 text-primary-600 focus:ring-2 focus:ring-primary-500">
                  <span class="text-sm font-semibold text-surface-700 dark:text-surface-300" data-i18n="tools.encoding-workbench.ui.hmacLabel">HMAC Mode</span>
                </label>
                <div id="hmac-key-section" class="hidden">
                  <input
                    type="password"
                    id="hmac-key"
                    placeholder="Enter HMAC secret key…"
                    data-i18n-placeholder="tools.encoding-workbench.ui.hmacPlaceholder"
                    class="w-full p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                </div>
              </div>

              <!-- bcrypt section -->
              <div>
                <label class="flex items-center gap-2 cursor-pointer mb-2">
                  <input type="checkbox" id="bcrypt-toggle" class="w-4 h-4 rounded border-surface-300 dark:border-surface-700 text-primary-600 focus:ring-2 focus:ring-primary-500">
                  <span class="text-sm font-semibold text-surface-700 dark:text-surface-300" data-i18n="tools.encoding-workbench.ui.bcryptLabel">bcrypt Mode</span>
                </label>
                <div id="bcrypt-section" class="hidden flex items-center gap-3">
                  <label class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.encoding-workbench.ui.bcryptRoundsLabel">Cost rounds:</label>
                  <select id="bcrypt-rounds" class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-1.5 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="4" data-i18n="tools.encoding-workbench.ui.option29">4 (fastest)</option>
                    <option value="6">6</option>
                    <option value="8">8</option>
                    <option value="10" selected data-i18n="tools.encoding-workbench.ui.option30">10 (recommended)</option>
                    <option value="12" data-i18n="tools.encoding-workbench.ui.option31">12 (slowest)</option>
                  </select>
                </div>
              </div>

              <div class="flex gap-3">
                <button id="hash-all-btn" class="btn btn-primary flex-1" data-i18n="tools.encoding-workbench.ui.hashAll">Hash All</button>
                <button id="hash-clear-btn" class="btn btn-secondary" data-i18n="tools.encoding-workbench.ui.clear">Clear</button>
              </div>
            </div>

            <!-- Results side -->
            <div>
              <div class="bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800 p-5 min-h-[300px]">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300" data-i18n="tools.encoding-workbench.ui.hashResultsLabel">Hash Results</h3>
                </div>
                <div id="hash-results">
                  ${createEmptyState({ icon: '#️⃣', title: 'No hashes yet', description: 'Enter text or select a file and click Hash All.', id: 'hash-empty-state', i18nTitle: 'tools.encoding-workbench.ui.desc2', i18nDesc: 'tools.encoding-workbench.ui.desc3' })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== PANEL: Identify ===== -->
        <div id="panel-identify" class="tab-panel hidden">

          <div class="mb-4">
            <label class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
              <span data-i18n="tools.encoding-workbench.ui.identifyInputLabel">Unknown Hash or Encoded String</span>
            </label>
            <textarea
              id="identify-input"
              rows="4"
              placeholder="Paste a hash or encoded string…"
              data-i18n-placeholder="tools.encoding-workbench.ui.identifyPlaceholder"
              class="w-full p-3 font-mono text-sm bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-600 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            ></textarea>
          </div>

          <div class="flex gap-3 mb-6">
            <button id="identify-btn" class="btn btn-primary" data-i18n="tools.encoding-workbench.ui.identifyBtn">🔍 Identify</button>
            <button id="identify-clear-btn" class="btn btn-ghost" data-i18n="tools.encoding-workbench.ui.clear">Clear</button>
          </div>

          <div id="identify-results">
            ${createEmptyState({ icon: '🔍', title: 'Nothing identified yet', description: 'Paste a hash or encoded string above and click Identify.', id: 'identify-empty-state', i18nTitle: 'tools.encoding-workbench.ui.desc4', i18nDesc: 'tools.encoding-workbench.ui.desc5' })}
          </div>
        </div>

      </div>
    </main>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'What is Encoding vs Hashing?',
          content: '<p><strong>Encoding</strong> transforms data into a different representation that can be reversed (decoded). Common formats include Base64 — used to transmit binary data over text channels — URL encoding, HTML entity encoding, and hexadecimal. Encoding is not encryption; it offers no confidentiality.</p><p><strong>Hashing</strong> is a one-way mathematical transformation. A cryptographic hash function takes any input and produces a fixed-length fingerprint. You cannot reverse a hash to retrieve the original input. Hashes are used to verify file integrity, store passwords securely, and generate digital signatures.</p>'
        },
        {
          title: 'How to Use This Tool',
          content: '<ol><li><strong>Encode / Decode tab:</strong> Paste text and choose an operation (Base64, URL, HTML, Hex), or click Auto-Detect Layers to automatically unwrap multiple nested encodings.</li><li><strong>Hash tab:</strong> Enter text or select a file, choose algorithms, and click Hash All. Enable HMAC mode to compute keyed hashes with a shared secret.</li><li><strong>Identify tab:</strong> Paste an unknown hash or encoded string and click Identify to see likely algorithms with confidence ratings.</li></ol>'
        },
        {
          title: 'Layered Encoding Explained',
          content: '<p>Real-world data is often encoded multiple times. For example, a payload could be URL-encoded, then Base64-encoded, then placed inside a hex string. The Auto-Detect Layers feature inspects the input pattern, attempts each decoding in sequence, and visualises every step as a card so you can see exactly how the data was wrapped.</p>'
        },
        {
          title: 'Hash Algorithm Guide',
          content: '<ul><li><strong>MD5</strong> — 128-bit output. Cryptographically broken; use only for legacy compatibility or non-security checksums.</li><li><strong>SHA-1</strong> — 160-bit output. Deprecated for security use. Still found in older Git commits and certificates.</li><li><strong>SHA-256</strong> — 256-bit output. General-purpose, widely used in TLS, code signing, and data integrity checks.</li><li><strong>SHA-512</strong> — 512-bit output. Higher security margin; preferred for password-adjacent workflows.</li><li><strong>bcrypt</strong> — Adaptive password-hashing function with a configurable cost factor. Use for storing passwords; not for data integrity.</li></ul>'
        }
      ], 'encoding-workbench', currentLang)}
      ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const script = `
    <script src="/vendor/md5.min.js" integrity="sha384-JmVtRz6RWiXnA14QbIOJzPuU3MidULOpBP66deeLLyyoF4Tr/gZlbkHkL6vTthxH" crossorigin="anonymous"></script>
    <script src="/vendor/bcrypt.min.js" integrity="sha384-qGFE4FIJLgCFuYs3nzg39XpCtvT5AZUhaBdjB3e1+vpKQa03AkyWOyBSFb9OcQ/g" crossorigin="anonymous"></script>
    <style>
      .tab-btn { outline: none; }
      .tab-btn:focus-visible { box-shadow: 0 0 0 2px var(--color-primary-500); }
      .algo-label {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.8125rem;
        font-weight: 500;
        padding: 0.25rem 0.625rem;
        border-radius: 0.5rem;
        border: 1px solid var(--color-surface-200, #e5e7eb);
        background: var(--color-surface-50, #f9fafb);
        color: var(--color-surface-700, #374151);
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
      }
      .dark .algo-label {
        border-color: var(--color-surface-700, #374151);
        background: var(--color-surface-900, #111827);
        color: var(--color-surface-300, #d1d5db);
      }
      .chain-card {
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
        background: var(--color-surface-50, #f9fafb);
        border: 1px solid var(--color-surface-200, #e5e7eb);
        border-radius: 0.5rem;
        padding: 0.5rem 0.75rem;
        font-size: 0.75rem;
        max-width: 200px;
        word-break: break-all;
      }
      .dark .chain-card {
        background: var(--color-surface-800, #1f2937);
        border-color: var(--color-surface-700, #374151);
      }
      .chain-label {
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 2px;
        color: var(--color-primary-600, #4f46e5);
      }
      .dark .chain-label { color: var(--color-primary-400, #818cf8); }
      .chain-value {
        color: var(--color-surface-600, #4b5563);
        font-family: monospace;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 180px;
      }
      .dark .chain-value { color: var(--color-surface-400, #9ca3af); }
      .chain-arrow {
        color: var(--color-surface-400, #9ca3af);
        font-size: 1rem;
        line-height: 1;
        flex-shrink: 0;
      }
      .hash-row {
        display: grid;
        grid-template-columns: 7rem 1fr auto;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--color-surface-100, #f3f4f6);
      }
      .dark .hash-row { border-bottom-color: var(--color-surface-800, #1f2937); }
      .hash-row:last-child { border-bottom: none; }
      .hash-algo-name {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--color-surface-600, #4b5563);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .dark .hash-algo-name { color: var(--color-surface-400, #9ca3af); }
      .hash-value {
        font-family: monospace;
        font-size: 0.75rem;
        word-break: break-all;
        color: var(--color-surface-900, #111827);
      }
      .dark .hash-value { color: var(--color-surface-100, #f3f4f6); }
      .identify-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.2rem 0.5rem;
        border-radius: 0.375rem;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .badge-high { background: #dcfce7; color: #16a34a; }
      .dark .badge-high { background: rgba(22,163,74,0.15); color: #4ade80; }
      .badge-medium { background: #fef3c7; color: #d97706; }
      .dark .badge-medium { background: rgba(217,119,6,0.15); color: #fbbf24; }
      .badge-low { background: #fee2e2; color: #dc2626; }
      .dark .badge-low { background: rgba(220,38,38,0.15); color: #f87171; }
    </style>
    <script>
    (function() {
      // ─── Tab switching ───────────────────────────────────────────────────────
      var tabBtns = document.querySelectorAll('.tab-btn');
      var tabPanels = document.querySelectorAll('.tab-panel');

      tabBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var targetId = btn.getAttribute('aria-controls');
          tabBtns.forEach(function(b) {
            b.classList.remove('active', 'bg-white', 'dark:bg-surface-900', 'text-primary-600', 'dark:text-primary-400', 'shadow-sm');
            b.classList.add('text-surface-600', 'dark:text-surface-400');
            b.setAttribute('aria-selected', 'false');
          });
          tabPanels.forEach(function(p) { p.classList.add('hidden'); });

          btn.classList.add('active', 'bg-white', 'dark:bg-surface-900', 'text-primary-600', 'dark:text-primary-400', 'shadow-sm');
          btn.classList.remove('text-surface-600', 'dark:text-surface-400');
          btn.setAttribute('aria-selected', 'true');
          var panel = document.getElementById(targetId);
          if (panel) panel.classList.remove('hidden');
        });
      });

      // ─── Encoding helpers ────────────────────────────────────────────────────
      function htmlEncode(s) {
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
      }
      function htmlDecode(s) {
        var d = document.createElement('div');
        d.innerHTML = s;
        return d.textContent || d.innerText || '';
      }
      function hexEncode(s) {
        return Array.from(s).map(function(c) {
          return c.charCodeAt(0).toString(16).padStart(2,'0');
        }).join('');
      }
      function hexDecode(s) {
        var clean = s.replace(/\\s/g,'');
        if (clean.length % 2 !== 0) throw new Error('Odd-length hex string');
        var out = '';
        for (var i = 0; i < clean.length; i += 2) {
          out += String.fromCharCode(parseInt(clean.slice(i, i+2), 16));
        }
        return out;
      }

      function applyOp(op, text) {
        switch (op) {
          case 'base64-encode': return btoa(unescape(encodeURIComponent(text)));
          case 'base64-decode':
            try { return decodeURIComponent(escape(atob(text.replace(/[\\r\\n]/g,'')))); }
            catch(e) { throw new Error('Invalid Base64 input'); }
          case 'url-encode': return encodeURIComponent(text);
          case 'url-decode':
            try { return decodeURIComponent(text); }
            catch(e) { throw new Error('Malformed URL encoding'); }
          case 'html-encode': return htmlEncode(text);
          case 'html-decode': return htmlDecode(text);
          case 'hex-encode': return hexEncode(text);
          case 'hex-decode':
            try { return hexDecode(text); }
            catch(e) { throw new Error('Invalid hex input'); }
          default: throw new Error('Unknown operation: ' + op);
        }
      }

      // ─── Encode/Decode panel wiring ──────────────────────────────────────────
      var encInput   = document.getElementById('enc-input');
      var encOutput  = document.getElementById('enc-output');
      var encError   = document.getElementById('enc-error');
      var encEmpty   = document.getElementById('enc-empty');
      var encChain   = document.getElementById('decode-chain');
      var chainSteps = document.getElementById('chain-steps');

      function showEncOutput(text) {
        encOutput.value = text;
        encOutput.classList.remove('hidden');
        encEmpty.classList.add('hidden');
        encError.classList.add('hidden');
      }
      function showEncError(msg) {
        encError.textContent = msg;
        encError.classList.remove('hidden');
        encOutput.classList.add('hidden');
        encEmpty.classList.add('hidden');
      }
      function resetEncOutput() {
        encOutput.classList.add('hidden');
        encError.classList.add('hidden');
        encEmpty.classList.remove('hidden');
        encChain.classList.add('hidden');
      }

      document.querySelectorAll('.enc-op-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var input = encInput.value;
          if (!input.trim()) return;
          var op = btn.getAttribute('data-op');
          try {
            showEncOutput(applyOp(op, input));
          } catch(e) {
            showEncError(e.message);
          }
        });
      });

      // ─── Auto-detect layers ──────────────────────────────────────────────────
      function detectEncodingLayers(input) {
        var layers = [];
        var current = input.trim();

        // Try hex decode
        if (/^[0-9a-fA-F\\s]+$/.test(current) && current.replace(/\\s/g,'').length % 2 === 0 && current.replace(/\\s/g,'').length >= 4) {
          try {
            var d = hexDecode(current);
            if (d && d.length > 0 && /[\\x20-\\x7E]/.test(d)) {
              layers.push({ type: 'Hex', decoded: d });
              current = d;
            }
          } catch(e) {}
        }

        // Try base64 decode
        if (/^[A-Za-z0-9+/\\n\\r]+=*$/.test(current.trim()) && current.trim().length >= 4) {
          try {
            var b = atob(current.replace(/[\\r\\n]/g,''));
            var bText = decodeURIComponent(escape(b));
            if (bText && bText.length > 0) {
              layers.push({ type: 'Base64', decoded: bText });
              current = bText;
            }
          } catch(e) {}
        }

        // Try URL decode
        if (current.includes('%') && current !== input.trim()) {
          try {
            var u = decodeURIComponent(current);
            if (u !== current) {
              layers.push({ type: 'URL', decoded: u });
              current = u;
            }
          } catch(e) {}
        } else if (input.includes('%')) {
          try {
            var u2 = decodeURIComponent(input);
            if (u2 !== input) {
              layers.push({ type: 'URL', decoded: u2 });
              current = u2;
            }
          } catch(e) {}
        }

        return { layers: layers, final: current };
      }

      function buildChainHTML(input, layers, final) {
        var parts = [];
        parts.push(buildCard('Input', input.length > 40 ? input.slice(0,40)+'…' : input));
        layers.forEach(function(layer) {
          parts.push('<span class="chain-arrow">→</span>');
          parts.push(buildCard(layer.type + ' Decode', layer.decoded.length > 40 ? layer.decoded.slice(0,40)+'…' : layer.decoded));
        });
        return parts.join('');
      }

      function buildCard(label, value) {
        return '<div class="chain-card"><span class="chain-label">' + label + '</span><span class="chain-value">' + escapeHTML(value) + '</span></div>';
      }

      function escapeHTML(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      }

      document.getElementById('auto-detect-btn').addEventListener('click', function() {
        var input = encInput.value;
        if (!input.trim()) return;
        var result = detectEncodingLayers(input);
        if (result.layers.length === 0) {
          showEncError(_t('tools.encoding-workbench.js.noLayers', 'No recognisable encoding layers detected.'));
          encChain.classList.add('hidden');
          return;
        }
        chainSteps.innerHTML = buildChainHTML(input, result.layers, result.final);
        encChain.classList.remove('hidden');
        showEncOutput(result.final);
      });

      document.getElementById('decode-all-btn').addEventListener('click', function() {
        var input = encInput.value;
        if (!input.trim()) return;
        var result = detectEncodingLayers(input);
        showEncOutput(result.final);
      });

      document.getElementById('enc-copy-btn').addEventListener('click', function() {
        var text = encOutput.value;
        if (!text) return;
        copyToClipboard(text, this);
      });

      document.getElementById('enc-clear-btn').addEventListener('click', function() {
        encInput.value = '';
        resetEncOutput();
        encChain.classList.add('hidden');
      });

      // ─── Hash panel wiring ───────────────────────────────────────────────────
      var hashMode = 'text';
      var currentFileBuffer = null;

      document.querySelectorAll('.hash-mode-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          hashMode = btn.getAttribute('data-mode');
          document.querySelectorAll('.hash-mode-btn').forEach(function(b) {
            b.classList.remove('btn-primary');
            b.classList.add('btn-secondary');
          });
          btn.classList.add('btn-primary');
          btn.classList.remove('btn-secondary');

          document.getElementById('hash-text-section').classList.toggle('hidden', hashMode !== 'text');
          document.getElementById('hash-file-section').classList.toggle('hidden', hashMode !== 'file');
        });
      });

      // File drop zone
      var dropZone = document.getElementById('hash-drop-zone');
      dropZone.addEventListener('click', function() {
        document.getElementById('hash-file-input').click();
      });
      dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropZone.classList.add('border-primary-500','bg-surface-50','dark:bg-surface-800/50');
      });
      dropZone.addEventListener('dragleave', function() {
        dropZone.classList.remove('border-primary-500','bg-surface-50','dark:bg-surface-800/50');
      });
      dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('border-primary-500','bg-surface-50','dark:bg-surface-800/50');
        var file = e.dataTransfer.files[0];
        if (file) loadHashFile(file);
      });
      document.getElementById('hash-file-input').addEventListener('change', function() {
        if (this.files[0]) loadHashFile(this.files[0]);
      });
      document.getElementById('hash-file-clear').addEventListener('click', function() {
        currentFileBuffer = null;
        document.getElementById('hash-file-info').classList.add('hidden');
        dropZone.classList.remove('hidden');
        document.getElementById('hash-file-input').value = '';
      });

      function loadHashFile(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
          currentFileBuffer = e.target.result;
          document.getElementById('hash-file-name').textContent = file.name;
          document.getElementById('hash-file-size').textContent = formatBytes(file.size);
          document.getElementById('hash-file-info').classList.remove('hidden');
          dropZone.classList.add('hidden');
        };
        reader.readAsArrayBuffer(file);
      }

      function formatBytes(n) {
        if (n < 1024) return n + ' B';
        if (n < 1048576) return (n/1024).toFixed(1) + ' KB';
        return (n/1048576).toFixed(2) + ' MB';
      }

      // HMAC toggle
      document.getElementById('hmac-toggle').addEventListener('change', function() {
        document.getElementById('hmac-key-section').classList.toggle('hidden', !this.checked);
        if (this.checked) {
          document.getElementById('bcrypt-toggle').checked = false;
          document.getElementById('bcrypt-section').classList.add('hidden');
        }
      });
      // bcrypt toggle
      document.getElementById('bcrypt-toggle').addEventListener('change', function() {
        document.getElementById('bcrypt-section').classList.toggle('hidden', !this.checked);
        if (this.checked) {
          document.getElementById('hmac-toggle').checked = false;
          document.getElementById('hmac-key-section').classList.add('hidden');
        }
      });

      // Hash computation
      async function sha(algo, data) {
        var buf = typeof data === 'string' ? new TextEncoder().encode(data) : data;
        var digest = await crypto.subtle.digest(algo, buf);
        return Array.from(new Uint8Array(digest)).map(function(b) { return b.toString(16).padStart(2,'0'); }).join('');
      }

      async function hmacSha(algo, keyStr, data) {
        var keyBuf = new TextEncoder().encode(keyStr);
        var dataBuf = typeof data === 'string' ? new TextEncoder().encode(data) : data;
        var cryptoKey = await crypto.subtle.importKey('raw', keyBuf, { name: 'HMAC', hash: algo }, false, ['sign']);
        var sig = await crypto.subtle.sign('HMAC', cryptoKey, dataBuf);
        return Array.from(new Uint8Array(sig)).map(function(b) { return b.toString(16).padStart(2,'0'); }).join('');
      }

      async function computeHash(algo, data, hmacKey) {
        if (algo === 'MD5') {
          if (typeof window.md5 !== 'function') throw new Error('MD5 library not loaded');
          var text = typeof data === 'string' ? data : new TextDecoder().decode(data);
          return window.md5(text);
        }
        var algoMap = { 'SHA-1': 'SHA-1', 'SHA-256': 'SHA-256', 'SHA-384': 'SHA-384', 'SHA-512': 'SHA-512' };
        var webAlgo = algoMap[algo];
        if (!webAlgo) throw new Error('Unsupported algorithm: ' + algo);
        if (hmacKey) return hmacSha(webAlgo, hmacKey, data);
        return sha(webAlgo, data);
      }

      document.getElementById('hash-all-btn').addEventListener('click', async function() {
        var btn = this;
        var original = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-sm" style="display:inline-block;vertical-align:middle;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.6s linear infinite;"></span>';

        var bcryptMode = document.getElementById('bcrypt-toggle').checked;
        var hmacMode   = document.getElementById('hmac-toggle').checked;
        var hmacKey    = document.getElementById('hmac-key').value;
        var selectedAlgos = Array.from(document.querySelectorAll('.algo-cb:checked')).map(function(cb) { return cb.value; });
        var data;

        if (hashMode === 'text') {
          data = document.getElementById('hash-text-input').value;
          if (!data) {
            btn.disabled = false;
            btn.innerHTML = original;
            return;
          }
        } else {
          if (!currentFileBuffer) {
            btn.disabled = false;
            btn.innerHTML = original;
            return;
          }
          data = currentFileBuffer;
        }

        try {
          var resultsHTML = '';

          if (bcryptMode) {
            var text = typeof data === 'string' ? data : new TextDecoder().decode(data);
            var rounds = parseInt(document.getElementById('bcrypt-rounds').value, 10);
            if (typeof window.dcodeIO !== 'undefined' && window.dcodeIO.bcrypt) {
              var salt = window.dcodeIO.bcrypt.genSaltSync(rounds);
              var hash = window.dcodeIO.bcrypt.hashSync(text, salt);
              resultsHTML = renderHashRow('bcrypt (cost ' + rounds + ')', hash);
            } else if (typeof window.bcrypt !== 'undefined') {
              var salt2 = window.bcrypt.genSaltSync(rounds);
              var hash2 = window.bcrypt.hashSync(text, salt2);
              resultsHTML = renderHashRow('bcrypt (cost ' + rounds + ')', hash2);
            } else {
              resultsHTML = '<p class="text-sm text-error-600 dark:text-error-400" data-i18n="tools.encoding-workbench.ui.desc40">bcrypt library not available. Please check vendor scripts.</p>';
            }
          } else {
            for (var i = 0; i < selectedAlgos.length; i++) {
              var algo = selectedAlgos[i];
              try {
                var hashVal = await computeHash(algo, data, hmacMode ? hmacKey : null);
                resultsHTML += renderHashRow(hmacMode ? 'HMAC-' + algo : algo, hashVal);
              } catch(e) {
                resultsHTML += renderHashRow(algo, 'Error: ' + e.message);
              }
            }
          }

          if (!resultsHTML) {
            resultsHTML = '<p class="text-sm text-surface-500 dark:text-surface-400" data-i18n="tools.encoding-workbench.ui.desc41">No algorithms selected.</p>';
          }
          document.getElementById('hash-results').innerHTML = '<div class="divide-y divide-surface-100 dark:divide-surface-800">' + resultsHTML + '</div>';
        } catch(e) {
          document.getElementById('hash-results').innerHTML = '<p class="text-sm text-error-600 dark:text-error-400" data-i18n="tools.encoding-workbench.ui.desc42">' + escapeHTML(e.message) + '</p>';
        } finally {
          btn.disabled = false;
          btn.innerHTML = original;
        }
      });

      function renderHashRow(algo, value) {
        var safeAlgo  = escapeHTML(algo);
        var safeValue = escapeHTML(value);
        var rowId     = 'hr-' + algo.replace(/[^a-zA-Z0-9]/g, '-');
        return '<div class="hash-row">' +
          '<span class="hash-algo-name">' + safeAlgo + '</span>' +
          '<span class="hash-value" id="' + rowId + '">' + safeValue + '</span>' +
          '<button class="btn btn-ghost btn-xs text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hash-copy-btn" data-copy-target="' + rowId + '"><span data-i18n="tools.encoding-workbench.ui.button10">Copy</span></button>' +
          '</div>';
      }

      // Event delegation for hash copy buttons
      document.getElementById('hash-results').addEventListener('click', function(e) {
        var btn = e.target.closest('.hash-copy-btn');
        if (!btn) return;
        var targetId = btn.dataset.copyTarget;
        var el = document.getElementById(targetId);
        if (el) copyToClipboard(el.textContent, btn);
      });

      document.getElementById('hash-clear-btn').addEventListener('click', function() {
        document.getElementById('hash-text-input').value = '';
        currentFileBuffer = null;
        document.getElementById('hash-file-info').classList.add('hidden');
        dropZone.classList.remove('hidden');
        document.getElementById('hash-file-input').value = '';
        document.getElementById('hash-results').innerHTML = \`${createEmptyState({ icon: '#️⃣', title: 'No hashes yet', description: 'Enter text or select a file and click Hash All.', id: 'hash-empty-state', i18nTitle: 'tools.encoding-workbench.ui.desc2', i18nDesc: 'tools.encoding-workbench.ui.desc3' })}\`;
      });

      // ─── Identify panel wiring ───────────────────────────────────────────────
      function identifyInput(input) {
        var trimmed = input.trim();
        var len = trimmed.length;
        var isHex    = /^[0-9a-fA-F]+$/.test(trimmed);
        var isBase64 = /^[A-Za-z0-9+/=]+$/.test(trimmed);

        var candidates = [];

        // bcrypt prefix
        if (/^\\$2[aby]\\$/.test(trimmed)) {
          candidates.push({ algo: 'bcrypt', confidence: 'High', type: 'hash', action: 'hash' });
        }

        // Hex-length hashes
        if (isHex) {
          if (len === 32) {
            candidates.push({ algo: 'MD5', confidence: 'High', type: 'hash', action: 'hash' });
            candidates.push({ algo: 'NTLM', confidence: 'Medium', type: 'hash', action: null });
          } else if (len === 40) {
            candidates.push({ algo: 'SHA-1', confidence: 'High', type: 'hash', action: 'hash' });
            candidates.push({ algo: 'RIPEMD-160', confidence: 'Low', type: 'hash', action: null });
          } else if (len === 64) {
            candidates.push({ algo: 'SHA-256', confidence: 'High', type: 'hash', action: 'hash' });
            candidates.push({ algo: 'SHA-3-256', confidence: 'Medium', type: 'hash', action: null });
          } else if (len === 96) {
            candidates.push({ algo: 'SHA-384', confidence: 'High', type: 'hash', action: 'hash' });
          } else if (len === 128) {
            candidates.push({ algo: 'SHA-512', confidence: 'High', type: 'hash', action: 'hash' });
            candidates.push({ algo: 'SHA-3-512', confidence: 'Medium', type: 'hash', action: null });
          } else if (len >= 4 && len % 2 === 0) {
            candidates.push({ algo: 'Hex-encoded data', confidence: 'Medium', type: 'encoding', action: 'decode' });
          }
        }

        // URL-encoded check
        if (/%[0-9A-Fa-f]{2}/.test(trimmed)) {
          candidates.push({ algo: 'URL Encoding', confidence: 'High', type: 'encoding', action: 'decode' });
        }

        // Base64 check (not pure hex overlap)
        if (!isHex && isBase64 && len % 4 === 0 && len >= 4) {
          candidates.push({ algo: 'Base64', confidence: 'Medium', type: 'encoding', action: 'decode' });
        }

        // HTML entities
        if (/&[a-zA-Z]+;|&#[0-9]+;/.test(trimmed)) {
          candidates.push({ algo: 'HTML Entities', confidence: 'High', type: 'encoding', action: 'decode' });
        }

        // JWT structure
        if (/^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+$/.test(trimmed)) {
          candidates.push({ algo: 'JWT (JSON Web Token)', confidence: 'High', type: 'encoding', action: null });
        }

        return candidates;
      }

      document.getElementById('identify-btn').addEventListener('click', function() {
        var input = document.getElementById('identify-input').value;
        if (!input.trim()) return;
        var candidates = identifyInput(input);
        var resultsEl = document.getElementById('identify-results');

        if (candidates.length === 0) {
          resultsEl.innerHTML = '<div class="px-4 py-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.encoding-workbench.ui.desc43">' + (window._t ? window._t('tools.encoding-workbench.ui.desc43', 'Could not identify the encoding or hash type. The input may be plain text or use an unsupported format.') : 'Could not identify the encoding or hash type. The input may be plain text or use an unsupported format.') + '</div>';
          return;
        }

        var inputVal = document.getElementById('identify-input').value;
        var rows = candidates.map(function(c) {
          var badgeClass = c.confidence === 'High' ? 'badge-high' : c.confidence === 'Medium' ? 'badge-medium' : 'badge-low';
          var actionBtn = '';
          if (c.action === 'decode') {
            actionBtn = '<button class="btn btn-ghost btn-xs identify-action-btn" data-action="decode" data-v="' + escapeHTML(inputVal).replace(/"/g, '&quot;') + '" data-i18n="tools.encoding-workbench.ui.decodeThis">Decode this \u2192</button>';
          } else if (c.action === 'hash') {
            actionBtn = '<button class="btn btn-ghost btn-xs identify-action-btn" data-action="hash" data-i18n="tools.encoding-workbench.ui.verifyHash">Verify hash →</button>';
          }
          return '<div class="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-800 last:border-0">' +
            '<div class="flex items-center gap-3">' +
              '<span class="text-sm font-semibold text-surface-900 dark:text-surface-100">' + escapeHTML(c.algo) + '</span>' +
              '<span class="text-xs text-surface-500 dark:text-surface-400 capitalize">' + c.type + '</span>' +
            '</div>' +
            '<div class="flex items-center gap-2">' +
              '<span class="identify-badge ' + badgeClass + '">' + c.confidence + '</span>' +
              actionBtn +
            '</div>' +
          '</div>';
        }).join('');

        resultsEl.innerHTML = '<div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-5"><h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3" data-i18n="tools.encoding-workbench.ui.identifyResults">Identification Results</h3>' + rows + '</div>';
      });

      document.getElementById('identify-clear-btn').addEventListener('click', function() {
        document.getElementById('identify-input').value = '';
        document.getElementById('identify-results').innerHTML = \`${createEmptyState({ icon: '🔍', title: 'Nothing identified yet', description: 'Paste a hash or encoded string above and click Identify.', id: 'identify-empty-state', i18nTitle: 'tools.encoding-workbench.ui.desc4', i18nDesc: 'tools.encoding-workbench.ui.desc5' })}\`;
      });

      document.getElementById('identify-results').addEventListener('click', function(e) {
        var btn = e.target.closest('.identify-action-btn');
        if (!btn) return;
        if (btn.dataset.action === 'decode') {
          document.getElementById('enc-input').value = btn.dataset.v;
          document.getElementById('tab-encode').click();
          document.getElementById('auto-detect-btn').click();
        } else if (btn.dataset.action === 'hash') {
          document.getElementById('tab-hash').click();
        }
      });

      // Spinner keyframe (inline so CSP nonce covers it)
      if (!document.getElementById('workbench-spin-style')) {
        var st = document.createElement('style');
        st.id = 'workbench-spin-style';
        st.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(st);
      }

    })();
    </script>
  `;

  return respondHTML(createPageTemplate({
    title: translation?.name || 'Encoding & Decoding Workbench',
    description: translation?.desc || 'Encode, decode, hash, and identify data transformations',
    path: '/encoding-workbench',
    content,
    scripts: script,
    lang: currentLang
  }));
}
