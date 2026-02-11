/**
 * Magic Universal Decoder Tool
 * Automatically detects and decodes layered encodings (Base64, URL, Hex, JWT, HTML entities, etc.)
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';

export async function handleUniversalDecoderRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === '/universal-decoder' || pathname === '/universal-decoder/') {
      if (method === 'GET') {
        return renderUniversalDecoderPage();
      }
      return respondJSON({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET' } });
    }

    return respondJSON({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Universal Decoder Route Error:', error);
    return respondJSON(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function renderUniversalDecoderPage() {
  const toolHeader = createToolHeader(
    { emoji: '🧪' },
    'Layered Decoder',
    'Paste suspicious blobs, log payloads, phishing URLs, or encoded secrets. Recursive analysis powered entirely in your browser.',
      [
        { text: 'Client-side processing', color: 'blue', tooltip: 'Runs entirely in your browser using Web APIs — your data never leaves your device.' },
        { text: 'Zero server storage', color: 'green', tooltip: 'Nothing decoded or analyzed is stored or sent to any server.' }
      ],
    { toolId: 'universal-decoder' }
  );

  const currentTool = TOOLS.find(t => t.id === 'universal-decoder');
    const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];


  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}

        <div class="grid lg:grid-cols-2 gap-6">
          <!-- Input Column -->
          <section class="space-y-6">
            <!-- Input Area -->
            <div class="bg-surface-50 dark:bg-surface-950/50 border border-surface-200 dark:border-surface-800 rounded-lg p-4">
              <label for="magic-input" class="label flex items-center justify-between">
                <span>Input Payload</span>
                <span id="status-message" class="text-xs font-mono text-surface-500 dark:text-surface-400" data-i18n="tools.universal-decoder.ui.desc15">● IDLE</span>
              </label>
              <textarea
                id="magic-input"
                rows="12"
                placeholder="> Paste Base64, URL encoded, Hex, JWT, HTML entities..." data-i18n-placeholder="tools.universal-decoder.ui.placeholder7"
                class="input-mono resize-vertical"></textarea>
            </div>

            <!-- Controls -->
            <div class="bg-surface-50 dark:bg-surface-950/50 border border-surface-200 dark:border-surface-800 rounded-lg p-4">
              <div class="flex flex-wrap items-center gap-3 mb-4">
                <button id="analyze-btn" class="btn btn-primary" data-tooltip="Detect encoding layers and unwrap them one by one"><span data-i18n="tools.universal-decoder.ui.button0">Analyze</span></button>

                <label class="inline-flex items-center gap-2 text-sm font-medium text-surface-700 dark:text-surface-200 cursor-pointer">
                  <input id="live-mode" type="checkbox" data-tooltip="Automatically analyze as you type or paste" class="rounded border-surface-300 text-primary-600 focus:ring-primary-500" checked>
                  <span>Live Mode</span>
                </label>

                <label class="inline-flex items-center gap-2 text-sm font-medium text-surface-700 dark:text-surface-200 cursor-pointer">
                  <input id="external-api" type="checkbox" class="rounded border-surface-300 text-primary-600 focus:ring-primary-500">
                  <span>Use External APIs</span>
                </label>

              </div>

              <!-- Samples -->
              <div class="space-y-3">
                <p class="text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.universal-decoder.ui.stat8">Quick Samples</p>
                <div class="flex flex-wrap gap-2">
                  <button class="sample-btn btn btn-secondary text-xs" data-sample="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlcyI6WyJzZWMtZW5naW5lZXIiLCJhbmFseXN0Il0sImlhdCI6MTcwNTUzNjAwMH0.WyUjA-l5w1XvDEw4m7xZB_MgNeeukS0x3-b0JVfu4E">JWT</button>
                  <button class="sample-btn btn btn-secondary text-xs" data-sample="aHR0cHMlM0ElMkYlMkZldmlsLmNvbSUyRmF1dGglM0ZyZWRpcmVjdCUzRGphdmFzY3JpcHQlM0FhbGVydCglMjhkb2N1bWVudC5jb29raWUlMkMp"><span data-i18n="tools.universal-decoder.ui.button1">Double URL</span></button>
                  <button class="sample-btn btn btn-secondary text-xs" data-sample="&#x3c;script&#x3e;alert(&#x27;owned&#x27;)&#x3c;/script&#x3e;">HTML</button>
                  <button class="sample-btn btn btn-secondary text-xs" data-sample="4d0061006c006900630069006f00750073003a0020"><span data-i18n="tools.universal-decoder.ui.button2">UTF-16</span></button>
                </div>
              </div>

              <div class="mt-4 space-y-2">
                <p class="text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">Custom Rainbow Entry</p>
                <div class="flex flex-col sm:flex-row gap-2">
                  <input id="custom-hash" type="text" placeholder="Hash (e.g., 5f4dcc...)" class="input text-xs flex-1" aria-label="Custom hash">
                  <input id="custom-value" type="text" placeholder="Value" class="input text-xs w-full sm:w-32" aria-label="Custom value">
                  <button id="add-custom" class="btn btn-secondary text-xs">Add</button>
                </div>
              </div>
            </div>

            <!-- Info Panel -->
            <div class="bg-surface-50 dark:bg-surface-950/50 border border-surface-200 dark:border-surface-800 rounded-lg p-4">
              <p class="text-sm font-semibold text-surface-700 dark:text-surface-200 uppercase tracking-wide mb-3" data-i18n="tools.universal-decoder.ui.stat9">
                Detection Matrix
              </p>
              <ul class="space-y-2 text-sm text-surface-600 dark:text-surface-300">
                <li class="flex items-start gap-2"><span class="text-surface-400 mt-0.5">•</span> Base64 & Base64URL, URL encoding, Hex (ASCII/UTF-16)</li>
                <li class="flex items-start gap-2"><span class="text-surface-400 mt-0.5">•</span> JWT payloads, HTML entities, Unicode escapes</li>
                <li class="flex items-start gap-2"><span class="text-surface-400 mt-0.5">•</span> Nested encodings (e.g., Base64 → URL → JWT)</li>
                <li class="flex items-start gap-2"><span class="text-surface-400 mt-0.5">•</span> Query strings & phishing URL analysis</li>
              </ul>
            </div>
          </section>

          <!-- Results Column -->
          <section class="space-y-6">
            <!-- Stats Bar -->
            <div class="bg-surface-50 dark:bg-surface-950/50 border border-surface-200 dark:border-surface-800 rounded-lg p-4">
              <div class="flex flex-wrap items-center gap-6 text-sm">
                <div class="flex items-center gap-2">
                  <span class="text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wide" data-i18n="tools.universal-decoder.ui.desc16">Confidence</span>
                  <span id="confidence-badge" class="px-3 py-1 text-xs font-semibold rounded border border-surface-200 text-surface-600 bg-white dark:bg-surface-900 dark:border-surface-800">UNKNOWN</span>
                </div>
                <div class="flex items-center gap-2 text-surface-700 dark:text-surface-200">
                  <span class="text-surface-500 dark:text-surface-400" data-i18n="tools.universal-decoder.ui.desc17">Layers:</span>
                  <span id="layer-count" class="font-semibold">0</span>
                </div>
                <div class="flex items-center gap-2 text-surface-700 dark:text-surface-200">
                  <span class="text-surface-500 dark:text-surface-400" data-i18n="tools.universal-decoder.ui.desc18">Format:</span>
                  <span id="final-format" class="font-semibold">N/A</span>
                </div>
                <div class="flex items-center gap-2">
                  <span id="hash-lookup-stats" class="px-3 py-1 text-xs font-semibold rounded border border-surface-200 text-surface-600 bg-white dark:bg-surface-900 dark:border-surface-800 dark:text-surface-300">🔍 Hash Lookups: 0/0 successful</span>
                </div>
              </div>
            </div>

            <div id="error-banner" class="hidden p-4 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 dark:bg-danger-900/20 dark:border-danger-800/60 dark:text-danger-200 text-sm font-mono"></div>

            <!-- Output Area -->
            <div class="bg-surface-50 dark:bg-surface-950/50 border border-surface-200 dark:border-surface-800 rounded-lg p-4">
              <label class="label flex items-center justify-between">
                <span>Output</span>
                <span id="final-byte-length" class="text-xs font-mono text-surface-500 dark:text-surface-400" data-i18n="tools.universal-decoder.ui.desc19">0 BYTES</span>
              </label>
              <textarea
                id="final-output"
                rows="12"
                readonly
                aria-label="Decoded output"
                class="input-mono resize-vertical bg-white dark:bg-surface-950"></textarea>
              <div class="mt-4 flex items-center gap-3">
                <button id="copy-output" class="btn btn-secondary"><span data-i18n="tools.universal-decoder.ui.button3">Copy</span></button>
                <button id="download-output" class="btn btn-ghost"><span data-i18n="tools.universal-decoder.ui.button4">Download</span></button>
              </div>
            </div>

            <!-- Analysis Panels -->
            <div class="space-y-4">
              <div class="bg-surface-50 dark:bg-surface-950/50 border border-surface-200 dark:border-surface-800 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-200 uppercase tracking-wide" data-i18n="tools.universal-decoder.ui.stat10">
                    Structured Data
                  </h2>
                  <span class="text-xs text-surface-400 font-mono" data-i18n="tools.universal-decoder.ui.desc20">AUTO-UPDATED</span>
                </div>
                <div id="detected-structures" class="space-y-3 text-sm text-surface-600 dark:text-surface-300 font-mono">
                  <p class="text-surface-500 dark:text-surface-400 italic font-mono" data-i18n="tools.universal-decoder.ui.desc21">No structured content detected yet.</p>
                </div>
              </div>

              <div class="bg-surface-50 dark:bg-surface-950/50 border border-surface-200 dark:border-surface-800 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-200 uppercase tracking-wide">
                    Hash Analysis
                  </h2>
                  <span class="text-xs text-surface-400 font-mono">ONE-WAY</span>
                </div>
                <div id="hash-analysis" class="space-y-3 text-sm text-surface-600 dark:text-surface-300 font-mono">
                  <p class="text-surface-500 dark:text-surface-400 italic font-mono">No hashes detected yet.</p>
                </div>
              </div>

              <div class="bg-surface-50 dark:bg-surface-950/50 border border-surface-200 dark:border-surface-800 rounded-lg p-4">
                <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-200 uppercase tracking-wide mb-3" data-i18n="tools.universal-decoder.ui.stat11">
                  Query Params
                </h2>
                <div id="query-params" class="text-sm text-surface-600 dark:text-surface-300 font-mono">
                  <p class="text-surface-500 dark:text-surface-400 italic">No query string detected.</p>
                </div>
              </div>

              <div class="bg-surface-50 dark:bg-surface-950/50 border border-surface-200 dark:border-surface-800 rounded-lg p-4">
                <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-200 uppercase tracking-wide mb-3" data-i18n="tools.universal-decoder.ui.stat12">
                  JSON Preview
                </h2>
                <pre id="json-preview" class="text-xs font-mono text-surface-700 dark:text-surface-200 bg-white dark:bg-surface-950 rounded-lg p-4 overflow-x-auto border border-surface-200 dark:border-surface-800">Provide JSON-like content to preview structure.</pre>
              </div>
            </div>

            <!-- Decoding Steps -->
            <div class="bg-surface-50 dark:bg-surface-950/50 border border-surface-200 dark:border-surface-800 rounded-lg p-4">
              <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-200 uppercase tracking-wide mb-4" data-i18n="tools.universal-decoder.ui.stat13">
                Decoding Pipeline
              </h2>
              <div id="analysis-steps" class="space-y-3 text-sm text-surface-700 dark:text-surface-200">
                <p class="text-surface-500 dark:text-surface-400 italic font-mono" data-i18n="tools.universal-decoder.ui.desc22">No operations run yet.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    ${createRelatedToolsSection(relatedToolsData)}
    </main>
  `;

  const scripts = `
    <script>
      (function() {
        const inputEl = document.getElementById('magic-input');
        const analyzeBtn = document.getElementById('analyze-btn');
        const liveToggle = document.getElementById('live-mode');
        const statusMessage = document.getElementById('status-message');
        const stepsEl = document.getElementById('analysis-steps');
        const finalOutputEl = document.getElementById('final-output');
        const confidenceBadge = document.getElementById('confidence-badge');
        const layerCountEl = document.getElementById('layer-count');
        const finalFormatEl = document.getElementById('final-format');
        const byteLengthEl = document.getElementById('final-byte-length');
        const hashLookupEl = document.getElementById('hash-lookup-stats');
        const structuresEl = document.getElementById('detected-structures');
        const hashAnalysisEl = document.getElementById('hash-analysis');
        const jsonPreviewEl = document.getElementById('json-preview');
        const queryParamsEl = document.getElementById('query-params');
        const errorBanner = document.getElementById('error-banner');
        const copyBtn = document.getElementById('copy-output');
        const downloadBtn = document.getElementById('download-output');
        const externalApiToggle = document.getElementById('external-api');
        const customHashInput = document.getElementById('custom-hash');
        const customValueInput = document.getElementById('custom-value');
        const addCustomButton = document.getElementById('add-custom');

        const htmlDecoder = (() => {
          const textarea = document.createElement('textarea');
          return (value) => {
            textarea.innerHTML = value;
            return textarea.value;
          };
        })();

        const base64Alphabet = /^[A-Za-z0-9+/]+={0,2}$/;
        const base64UrlAlphabet = /^[A-Za-z0-9_\\-]+={0,2}$/;

        const HASH_LENGTHS = {
          32: 'MD5',
          40: 'SHA1',
          64: 'SHA256',
          128: 'SHA512'
        };
        const RAINBOW_TABLE = {
          // Original simple hashes
          '5f4dcc3b5aa765d61d8327deb882cf99': 'password',
          '21232f297a57a5a743894a0e4a801fc3': 'admin',
          'e10adc3949ba59abbe56e057f20f883e': '123456',
          '25d55ad283aa400af464c76d713c07ad': '12345678',
          '827ccb0eea8a706c4c34a16891f84e7b': '12345',
          '96e79218965eb72c92a549dd5a330112': '111111',
          'fcea920f7412b5da7be0cf42b8c93759': '1234567',
          'd8578edf8458ce06fbc5bb76a58c5ca4': 'qwerty',
          '5ebe2294ecd0e0f08eab7690d2a6ee69': 'secret',
          '098f6bcd4621d373cade4e832627b4f6': 'test',
          '63a9f0ea7bb98050796b649e85481845': 'root',
          '0d107d09f5bbe40cade3de5c71e9e9b7': 'letmein',
          '40be4e59b9a2a2b5dffb918c0e86b3d7': 'welcome',
          '7c6a180b36896a0a8c02787eeafb0e4c': 'password1',
          '0192023a7bbd73250516f069df18b500': 'admin123',
          'e99a18c428cb38d5f260853678922e03': 'abc123',
          '084e0343a0486ff05530df6c705c8bb4': 'guest',
          'f25a2fc72690b780b2a14e140ef6a9e0': 'iloveyou',
          '482c811da5d5b4bc6d497ffa98491e38': 'password123',
          'cc03e747a6afbbcbf8be7668acfebee5': 'test123',
          'eb0a191797624dd3a48fa681d3061212': 'master',
          '25f9e794323b453885f5181f1b624d0b': '123456789',
          
          // 8-layer MD5 chains for hello
          '5d41402abc4b2a76b9719d911017c592': 'hello',
          '69a329523ce1ec88bf63061863d9cb14': '5d41402abc4b2a76b9719d911017c592',
          '0dcd649d4ef5f787e39ddf48d8e625a5': '69a329523ce1ec88bf63061863d9cb14',
          '5d6aaee903365197ede6f325eb3716c5': '0dcd649d4ef5f787e39ddf48d8e625a5',
          'cbe8d0c48ab0ed8d23eacb1621f6c5c3': '5d6aaee903365197ede6f325eb3716c5',
          '8fa852c5f5b1d0d6b1cb0fad32596c71': 'cbe8d0c48ab0ed8d23eacb1621f6c5c3',
          '91a84cf929b73800d2ff81da28834c64': '8fa852c5f5b1d0d6b1cb0fad32596c71',
          '45b7d5e4d3fca6a4868d46a941076b72': '91a84cf929b73800d2ff81da28834c64',
          
          // 8-layer MD5 chains for test123
          'e08a7c49d96c2b475656cc8fe18cee8e': 'cc03e747a6afbbcbf8be7668acfebee5',
          '9dd6023e88f1e5bcf51415d2caa4e031': 'e08a7c49d96c2b475656cc8fe18cee8e',
          '50b863eac9e42dbd7119e68d5250a1dc': '9dd6023e88f1e5bcf51415d2caa4e031',
          '19836f68eab25fb450099bced25043ed': '50b863eac9e42dbd7119e68d5250a1dc',
          'c01e5178886a830eef38506c53c22153': '19836f68eab25fb450099bced25043ed',
          '8e3958190f5d869bffbe96241064a428': 'c01e5178886a830eef38506c53c22153',
          '9eb03cb8711dcd5621cd166db45ac983': '8e3958190f5d869bffbe96241064a428',
          
          // 8-layer MD5 chains for admin123
          '0c909a141f1f2c0a1cb602b0b2d7d050': '0192023a7bbd73250516f069df18b500',
          '105dad91250a07b716d6a714a3e676b8': '0c909a141f1f2c0a1cb602b0b2d7d050',
          'f25c71d9bcd588c85ffa55e9e60f9c24': '105dad91250a07b716d6a714a3e676b8',
          'e79f9ee6349210ccb2be1ef56f61b049': 'f25c71d9bcd588c85ffa55e9e60f9c24',
          'ddebc975e81c486131cb7fd07cdac483': 'e79f9ee6349210ccb2be1ef56f61b049',
          '94bcb903de52695bdc6ff41401cdeeb0': 'ddebc975e81c486131cb7fd07cdac483',
          'a3d6c722d954ff939c21cd82e20643fe': '94bcb903de52695bdc6ff41401cdeeb0',
          
          // 8-layer MD5 chains for password
          '696d29e0940a4957748fe3fc9efd22a3': '5f4dcc3b5aa765d61d8327deb882cf99',
          '5a22e6c339c96c9c0513a46e44c39683': '696d29e0940a4957748fe3fc9efd22a3',
          'e777a29bee9227c8a6a86e0bad61fc40': '5a22e6c339c96c9c0513a46e44c39683',
          '7b3b4de00794a247cf8df8e6fbfe19bf': 'e777a29bee9227c8a6a86e0bad61fc40',
          '20ffe80a69fbe8ce4d848eef461b3e39': '7b3b4de00794a247cf8df8e6fbfe19bf',
          '55ae17202f23e50f30883ee4bb581001': '20ffe80a69fbe8ce4d848eef461b3e39',
          'c66bfc320be01d07d4c326dea4254cb9': '55ae17202f23e50f30883ee4bb581001',
          
          // 8-layer MD5 chains for password123
          '9df7a7314e3884b26222e2ccd834aa24': '482c811da5d5b4bc6d497ffa98491e38',
          '7096bb445dc0d4162cd102693b94b1cf': '9df7a7314e3884b26222e2ccd834aa24',
          'bbcd87a83fe0697c88558a2e231ccf04': '7096bb445dc0d4162cd102693b94b1cf',
          '5f8893c1660fd33eee69d01ee8750e4e': 'bbcd87a83fe0697c88558a2e231ccf04',
          '632502fd0ff74627d099ea96399a8d2c': '5f8893c1660fd33eee69d01ee8750e4e',
          'db22a8ac5dc211b8e7afa5fe4042a281': '632502fd0ff74627d099ea96399a8d2c',
          'b655b1ca64d0d7825dc3eef6cb8a3faa': 'db22a8ac5dc211b8e7afa5fe4042a281',
          
          // 8-layer MD5 chains for root
          'b9be11166d72e9e3ae7fd407165e4bd2': '63a9f0ea7bb98050796b649e85481845',
          '29481bf5d996d39610e57c0254ee33b7': 'b9be11166d72e9e3ae7fd407165e4bd2',
          'c65d644e720146c0102d8866c3ee0404': '29481bf5d996d39610e57c0254ee33b7',
          '38b04e559910164fed598ed76efddcbb': 'c65d644e720146c0102d8866c3ee0404',
          '7177163aab8633f9772c1e583296c0f1': '38b04e559910164fed598ed76efddcbb',
          'a3702609f7dbedbdfa22109754d8d546': '7177163aab8633f9772c1e583296c0f1',
          '96005a29a7abe1be8c47e2382db6efd4': 'a3702609f7dbedbdfa22109754d8d546',
          
          // 8-layer MD5 chains for admin
          'c3284d0f94606de1fd2af172aba15bf3': '21232f297a57a5a743894a0e4a801fc3',
          '77e2edcc9b40441200e31dc57dbb8829': 'c3284d0f94606de1fd2af172aba15bf3',
          '6ad4664ba23eac71b5ef5e826ea0c6cd': '77e2edcc9b40441200e31dc57dbb8829',
          '67f43efc5701784db1504e4993d7e393': '6ad4664ba23eac71b5ef5e826ea0c6cd',
          'da146e60619d5e8252c3c67597a566eb': '67f43efc5701784db1504e4993d7e393',
          '4c14a808735abb4b205d1c8cb54ec845': 'da146e60619d5e8252c3c67597a566eb',
          '687fb677c784ce2a0b273263bfe778be': '4c14a808735abb4b205d1c8cb54ec845',
          
          // 8-layer MD5 chains for qwerty
          '897c8fde25c5cc5270cda61425eed3c8': 'd8578edf8458ce06fbc5bb76a58c5ca4',
          'cf6ebf3453bf1877ee3f1dce7bd1ec19': '897c8fde25c5cc5270cda61425eed3c8',
          'a6160f504775ad2505783ab57ba5cff7': 'cf6ebf3453bf1877ee3f1dce7bd1ec19',
          '1508c94019643d20528dbf094da70c61': 'a6160f504775ad2505783ab57ba5cff7',
          'b0b48867d7d0a65291cf6b48842a8b5b': '1508c94019643d20528dbf094da70c61',
          'efe6fba560b11246a24ced54c6c43b03': 'b0b48867d7d0a65291cf6b48842a8b5b',
          '743f5112061bfb34550b02c2383fa8c6': 'efe6fba560b11246a24ced54c6c43b03',
          '1a100d2c0dab19c4430e7d73762b3423': '743f5112061bfb34550b02c2383fa8c6',
          
          // 8-layer MD5 chains for letmein
          '95689b85b58c9f2613ef6fd4494c6e3f': '0d107d09f5bbe40cade3de5c71e9e9b7',
          '2f00e87735fd8737fe3a858e9451048d': '95689b85b58c9f2613ef6fd4494c6e3f',
          'e84e77d2b8fad2f7cde5db47ec6a8ccc': '2f00e87735fd8737fe3a858e9451048d',
          '3104a8afbd143477b6d8c2affb432c2c': 'e84e77d2b8fad2f7cde5db47ec6a8ccc',
          '146c5108b5349e23f5e90b3d742bff4a': '3104a8afbd143477b6d8c2affb432c2c',
          '7593bf77330cbc0e127af78a8a2a2672': '146c5108b5349e23f5e90b3d742bff4a',
          '90b56eadee832e809375f021842abff3': '7593bf77330cbc0e127af78a8a2a2672',
          
          // 8-layer MD5 chains for welcome
          '4d347a85afd94351ff8fdce0b33261a6': '40be4e59b9a2a2b5dffb918c0e86b3d7',
          'a8f320e8dc4b04a47ae8891cb67f7fef': '4d347a85afd94351ff8fdce0b33261a6',
          '5be29958b3cbb68e487ebd74599357e8': 'a8f320e8dc4b04a47ae8891cb67f7fef',
          '3b46aa55c9ddf7ebdc07388cf631f931': '5be29958b3cbb68e487ebd74599357e8',
          'f48ed7ef5c46388ebcea0fb350432881': '3b46aa55c9ddf7ebdc07388cf631f931',
          '4a471759a93912352f9d8ec8a91dc009': 'f48ed7ef5c46388ebcea0fb350432881',
          'ac7f0b025ce5468e0fc091dd67f73dbc': '4a471759a93912352f9d8ec8a91dc009',
          
          // 8-layer MD5 chains for abc123
          '57f231b1ec41dc6641270cb09a56f897': 'e99a18c428cb38d5f260853678922e03',
          '80e380bb24647ada593f44e60a806b63': '57f231b1ec41dc6641270cb09a56f897',
          '5f1970f5bf52909ee77cd8f8c50bdd9f': '80e380bb24647ada593f44e60a806b63',
          'f3653951c3b6b3aa51233343f0f1291a': '5f1970f5bf52909ee77cd8f8c50bdd9f',
          '6417d274e347597ab961334a809517fd': 'f3653951c3b6b3aa51233343f0f1291a',
          'fde23322fc99954437c13453f8454a65': '6417d274e347597ab961334a809517fd',
          'e815594ef4bb94ea2d366611440a2173': 'fde23322fc99954437c13453f8454a65',
          '4d186321c1a7f0f354b297e8914ab240': 'e815594ef4bb94ea2d366611440a2173',
          
          // 8-layer MD5 chains for master
          '60860627d939017b5d02866ccab695da': 'eb0a191797624dd3a48fa681d3061212',
          '7d5ef6c22a29b4933d68ae5ad10b0bd9': '60860627d939017b5d02866ccab695da',
          '1b2d11c841974d7cc7422d055b2d5c3f': '7d5ef6c22a29b4933d68ae5ad10b0bd9',
          '718a0b5878d56d92bcd62945adc78fae': '1b2d11c841974d7cc7422d055b2d5c3f',
          '8a9f793f5ba08cad6f9a0427cfd555b6': '718a0b5878d56d92bcd62945adc78fae',
          '3f37e330c48086cfcd7a7d64cde6f42a': '8a9f793f5ba08cad6f9a0427cfd555b6',
          'dffd5fb45936eaddc0107ac466c5c1eb': '3f37e330c48086cfcd7a7d64cde6f42a',
          
          // 8-layer MD5 chains for 123456789
          '70873e8580c9900986939611618d7b1e': '25f9e794323b453885f5181f1b624d0b',
          'a970a7e3b359f88a4732b56050822888': '70873e8580c9900986939611618d7b1e',
          'e6e537d46540581aafa8d505896dee78': 'a970a7e3b359f88a4732b56050822888',
          '2a810c88e3cb947e85bbab2728102f0d': 'e6e537d46540581aafa8d505896dee78',
          '774ef01be7f998e14b126900923fe8fa': '2a810c88e3cb947e85bbab2728102f0d',
          'a4a22ba3806018611b90a3519195e905': '774ef01be7f998e14b126900923fe8fa',
          '2dd2617580441c8917d1a2935718d1f6': 'a4a22ba3806018611b90a3519195e905',
          '5c29a959abce4eda5f0e8a7d80bce573': '2dd2617580441c8917d1a2935718d1f6',
          
          // Legacy nested hashes (keep for compatibility)
          '7110eda4d09e062aa5e4a390b0a572ac0d2c0220': '21232f297a57a5a743894a0e4a801fc3',
          'c93ccd78b2076528346216b3b2f701e6': '7110eda4d09e062aa5e4a390b0a572ac0d2c0220',
          '5d2e19393cc5ef67d456ebb0c2fd7c52': '5f4dcc3b5aa765d61d8327deb882cf99',
          
          // SHA1 hashes
          '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8': 'password',
          'd033e22ae348aeb5660fc2140aec35850c4da997': 'admin',
          '7c4a8d09ca3762af61e59520943dc26494f8941b': '123456',
          '7c222fb2927d828af22f592134e8932480637c0d': '12345678',
          '8cb2237d0679ca88db6464eac60da96345513964': '12345',
          'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3': 'test',
          'dc76e9f0c0006e8f919e0c515c66dbba3982f785': 'root',
          'b1b3773a05c0ed0176787a4f1574ff0075f7521e': 'qwerty',
          'b7a875fc1ea228b9061041b7cec4bd3c52ab3ce3': 'letmein',
          'c0b137fe2d792459f26ff763cce44574a5b5ab03': 'welcome',
          'e38ad214943daad1d64c102faec29de4afe9da3d': 'password1',
          'f865b53623b121fd34ee5426c792e5c33af8c227': 'admin123',
          '6367c48dd193d56ea7b0baad25b19455e529f5ee': 'abc123',
          '35675e68f4b5af7b995d9205ad0fc43842f16450': 'guest',
          'ee8d8728f435fd550f83852aabab5234ce1da528': 'iloveyou',
          
          // SHA256 hashes
          '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8': 'password',
          '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918': 'admin',
          '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92': '123456',
          'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f': '12345678',
          '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5': '12345',
          '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08': 'test',
          '4813494d137e1631bba301d5acab6e7bb7aa74ce1185d456565ef51d737677b2': 'root',
          '65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5': 'qwerty',
          '1c8bfe8f801d79745c4631d09fff36c82aa37fc4cce4fc946683d7b336b63032': 'letmein',
          '280d44ab1e9f79b5cce2dd4f58f5fe91f0fbacdac9f7447dffc318ceb79f2d02': 'welcome',
          '0b14d501a594442a01c6859541bcb3e8164d183d32937b851835442f69d5c94e': 'password1',
          '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9': 'admin123',
          '6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090': 'abc123',
          '84983c60f7daadc1cb8698621f802c0d9f9a3c3c295c810748fb048115c186ec': 'guest',
          'e4ad93ca07acb8d908a3aa41e920ea4f4ef4f26e7f86cf8291c5db289780a5ae': 'iloveyou',
          
          // SHA512 hashes
          'b109f3bbbc244eb82441917ed06d618b9008dd09b3befd1b5e07394c706a8bb980b1d7785e5976ec049b46df5f1326af5a2ea6d103fd07c95385ffab0cacbc86': 'password',
          
          '55c3b5386c486feb662a0785f340938f518d547f': '5f4dcc3b5aa765d61d8327deb882cf99',
          '90b9aa7e25f80cf4f64e990b78a9fc5ebd6cecad': '21232f297a57a5a743894a0e4a801fc3',
          '83353d597cbad458989f2b1a5c1fa1f9f665c858': '63a9f0ea7bb98050796b649e85481845',
          '4028a0e356acc947fcd2bfbf00cef11e128d484a': '098f6bcd4621d373cade4e832627b4f6',
          '0f869632dedf073cb0587e8dfa43ec94c872abfc': '5d41402abc4b2a76b9719d911017c592',
          '7186ebfb69adb98029cce10975245bf1e6c44194': 'd8578edf8458ce06fbc5bb76a58c5ca4',
          '1fb586718403e6b398655502d2114f5ac27badd1': 'e99a18c428cb38d5f260853678922e03',
          '10470c3b4b1fed12c3baac014be15fac67c6e815': 'e10adc3949ba59abbe56e057f20f883e',
          '3a92e26dc595d24c29df0f343630105fce94a4b5': '0d107d09f5bbe40cade3de5c71e9e9b7',
          '0da4aea08df1536477acc5ae8a1a6ab73a307c44': '40be4e59b9a2a2b5dffb918c0e86b3d7',
          'ff297dd696fc4aabe14e0e41348e438cf63f516d': 'eb0a191797624dd3a48fa681d3061212',
          'a346bc80408d9b2a5063fd1bddb20e2d5586ec30': '25f9e794323b453885f5181f1b624d0b',

          '3f2cd8e57b096fe7e4a78a5627e34ca3f885ad65a56e61c287cf4211bbc5949f': '5f4dcc3b5aa765d61d8327deb882cf99',
          '465c194afb65670f38322df087f0a9bb225cc257e43eb4ac5a0c98ef5b3173ac': '21232f297a57a5a743894a0e4a801fc3',
          'ee258b5e3a3e3b7811f16a520ab2c1635f430a8c484df9dfe81fb42ad83d40c2': '63a9f0ea7bb98050796b649e85481845',
          '52bbea75ee75a6f1d24781d56e6c8ffb9b76e1024013b516bbaaac27e21ae9e0': '098f6bcd4621d373cade4e832627b4f6',
          '4914e23374bb211e3dca0df7636fefffc7fedd94f1340ae81c7d6c07b7113e9b': '5d41402abc4b2a76b9719d911017c592',
          '9f9dd1d2e3f189e7929a73ef1f5b54873622f64cc15210133c5085b5175325df': '5ebe2294ecd0e0f08eab7690d2a6ee69',
          'abb157624df5cc9747156dd19a0dfb21e5bdf715e2f68b1b2d99c7e74f5b5734': '40be4e59b9a2a2b5dffb918c0e86b3d7',
          'f759864761e3679e26c4362935d6a0d562bef02f026a9670d4e6e46103969a78': 'd8578edf8458ce06fbc5bb76a58c5ca4',
          '101a57f8d7efd05310997baf73fdbbf55a17b4fbd00136fa6b92e6af6e82937a': 'e99a18c428cb38d5f260853678922e03',

          '85ec0898f0998c95a023f18f1123cbc77ba51f2632137b61999655d59817d942ecef3012762604e442d395a194c53e94e9fb5bb8fe74d61900eb05cb0c078bb6': '5f4dcc3b5aa765d61d8327deb882cf99',
          'edbd881f1ee2f76ba0bd70fd184f87711be991a0401fd07ccd4b199665f00761afc91731d8d8ba6cbb188b2ed5bfb465b9f3d30231eb0430b9f90fe91d136648': '21232f297a57a5a743894a0e4a801fc3',
          'b9f5a9e9ee6900759c53f1862616e88a74ee96d94a62554f94b5b66b452420bd178a0a082f05261d35077a8bd162dc12c6ac676302a76ac9e9336674ec1017a9': '63a9f0ea7bb98050796b649e85481845',
          'ff594f8cf10ca2e3ad4279375f0d0e688a7eca861000e7ecc63ae4b105c8be7bcb57e8c1172ea460c462c6f715508dc356fd964cf41644682db1feffd466769a': '098f6bcd4621d373cade4e832627b4f6',
          '6fd6a08f746595ea1c50ab98dac8737a6a8910c50718ce5e0757b23065f0fe76cc5ebd83f5f625d5c73754c5c3f6f8878664bd935b3c0627ac62213c057a8b79': '5d41402abc4b2a76b9719d911017c592',
          '66d7a8cab8407236426d89088164901276fdc17d6fd0a81d999378fe99cf0923828aec4a7f56ed527e771b48a80efa112f679a64bb4bccc6fe3c1662eaf713c1': '5ebe2294ecd0e0f08eab7690d2a6ee69',
          'e13b1bd042023d0d5e6480e6a10fd5f2caa7231e2c3a7b7b553b69f986ac5a2d7df5d12a097dd79140d5a328cfe13bc7d7e9d444c9eb21f4c406ea3a31f29e15': '40be4e59b9a2a2b5dffb918c0e86b3d7',
          'cacf8bd48cf4eb5fa0c0f650f149c9473cc313db06683f67e628734d9a4ea2bbac77de3d2bbe1f774a6e9c95ec152378315f301a8e34616343a9b36bc1927c56': 'd8578edf8458ce06fbc5bb76a58c5ca4',
          '53fb860b6e934e38477f6df6d7664f6a5c4124b5fb9f8c88d8efab6eb9e8cd081c995fe14354f18016a72324129150ba066a15e5899b08b94922e7561bf29691': 'e99a18c428cb38d5f260853678922e03',

          'd86c161a7c71d0ad6ae3093d12aa5a18a2a79158': '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
          'e424af1995f69a6e74acaa591fd9959f7d192a03': '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
          'fa3cb40065453b193d17d9df756658fd17baef44': '4813494d137e1631bba301d5acab6e7bb7aa74ce1185d456565ef51d737677b2',
          'e9e8fa9602f37a97a0e3f588c8e49e1bbb756706': '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
          'ee662f2bc691daa48d074542722d8e1b0587673c': '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
          '83e03ef3fae0fdb2dc4334f6ce20ffce65e46fca': '2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b',
          '72beb5b593c55381b4796e29ee001f9e57981b9a': '280d44ab1e9f79b5cce2dd4f58f5fe91f0fbacdac9f7447dffc318ceb79f2d02',
          '623fe6deeb80d6c3b0aee5f6ac5a0f98ab39f314': '65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5',
          'e0f9c4ac056b3fc7c17d250e98465ed6cd2a0755': '6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090',

          '0d287772dfced30917b9dbb547a3dfc2b8ddfa82ef867191f73c64f4770face9': '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8',
          'b5a04226bda8fc65a475e3e76359fdec6fe75dced1924004d1e170cc47ea3f1b': 'd033e22ae348aeb5660fc2140aec35850c4da997',
          'ca9e680399decb9dd10d0cc4acda282c05e905174ab331bd9503e9f2e3b59f07': 'dc76e9f0c0006e8f919e0c515c66dbba3982f785',
          '168601827c50b37054f4e565dbf4050a6bd854bc91650280539cca45bae1fb2f': 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3',
          '48e0954096864b1bfbd37e84f954952ddcbde8b6a94373b7c17bae49e4e09c65': 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d',
          '6d31c4c9c005c3fd2ae4ebbdbd22d67def0cc89254a4be887261651cd30b5cc7': 'e5e9fa1ba31ecd1ae84f75caaa474f3a663f05f4',
          '7f6b2113c33bb6b45d5476a13f1f90405a4694c0d36c2a2b4e67f4b9cbc824a2': 'c0b137fe2d792459f26ff763cce44574a5b5ab03',
          'b7deb5b2557562a27828b73ee8ade434d1ac0b1ce2682732d794764a79691af6': 'b1b3773a05c0ed0176787a4f1574ff0075f7521e',
          '1ad69fdc9394f84314ed68beeafb561b904075fdd53677598a06688098eb6427': '6367c48dd193d56ea7b0baad25b19455e529f5ee'
        };
        const RAINBOW_SOURCES = {};
        Object.keys(RAINBOW_TABLE).forEach((hash) => {
          RAINBOW_SOURCES[hash] = 'static';
        });

        const RAINBOW_EXTERNAL_TOGGLE_KEY = 'rainbow-external-api';
        const RAINBOW_EXTERNAL_CACHE_KEY = 'rainbow-external-cache';
        const RAINBOW_CUSTOM_CACHE_KEY = 'rainbow-custom-entries';
        const MAX_DYNAMIC_LAYERS = 10;

        const COMMON_PASSWORDS = [
          'password',
          '123456',
          '12345678',
          '1234',
          'qwerty',
          '12345',
          'dragon',
          'pussy',
          'baseball',
          'football',
          'letmein',
          'monkey',
          '696969',
          'abc123',
          'mustang',
          'michael',
          'shadow',
          'master',
          'jennifer',
          '111111',
          '2000',
          'jordan',
          'superman',
          'harley',
          '1234567',
          'fuckme',
          'hunter',
          'fuckyou',
          'trustno1',
          'ranger',
          'buster',
          'thomas',
          'tigger',
          'robert',
          'soccer',
          'fuck',
          'batman',
          'test',
          'pass',
          'killer',
          'hockey',
          'george',
          'charlie',
          'andrew',
          'michelle',
          'love',
          'sunshine',
          'jessica',
          'asshole',
          '6969',
          'pepper',
          'daniel',
          'access',
          '123456789',
          '654321',
          'joshua',
          'maggie',
          'starwars',
          'silver',
          'william',
          'dallas',
          'yankees',
          '123123',
          'ashley',
          '666666',
          'hello',
          'amanda',
          'orange',
          'biteme',
          'freedom',
          'computer',
          'sexy',
          'thunder',
          'nicole',
          'ginger',
          'heather',
          'hammer',
          'summer',
          'corvette',
          'taylor',
          'fucker',
          'austin',
          '1111',
          'merlin',
          'matthew',
          '121212',
          'golfer',
          'cheese',
          'princess',
          'martin',
          'chelsea',
          'patrick',
          'richard',
          'diamond',
          'yellow',
          'bigdog',
          'secret',
          'asdfgh',
          'sparky',
          'cowboy',
          'camaro',
          'anthony',
          'matrix',
          'falcon',
          'iloveyou',
          'bailey',
          'guitar',
          'jackson',
          'purple',
          'scooter',
          'phoenix',
          'aaaaaa',
          'morgan',
          'tigers',
          'porsche',
          'mickey',
          'maverick',
          'cookie',
          'nascar',
          'peanut',
          'justin',
          '131313',
          'money',
          'horny',
          'samantha',
          'panties',
          'steelers',
          'joseph',
          'snoopy',
          'boomer',
          'whatever',
          'iceman',
          'smokey',
          'gateway',
          'dakota',
          'cowboys',
          'eagles',
          'chicken',
          'dick',
          'black',
          'zxcvbn',
          'please',
          'andrea',
          'ferrari',
          'knight',
          'hardcore',
          'melissa',
          'compaq',
          'coffee',
          'booboo',
          'bitch',
          'johnny',
          'bulldog',
          'xxxxxx',
          'welcome',
          'james',
          'player',
          'ncc1701',
          'wizard',
          'scooby',
          'charles',
          'junior',
          'internet',
          'bigdick',
          'mike',
          'brandy',
          'tennis',
          'blowjob',
          'banana',
          'monster',
          'spider',
          'lakers',
          'miller',
          'rabbit',
          'enter',
          'mercedes',
          'brandon',
          'steven',
          'fender',
          'john',
          'yamaha',
          'diablo',
          'chris',
          'boston',
          'tiger',
          'marine',
          'chicago',
          'rangers',
          'gandalf',
          'winter',
          'bigtits',
          'barney',
          'edward',
          'raiders',
          'porn',
          'badboy',
          'blowme',
          'spanky',
          'bigdaddy',
          'johnson',
          'chester',
          'london',
          'midnight',
          'blue',
          'fishing',
          '000000',
          'hannah',
          'slayer',
          '11111111',
          'rachel',
          'sexsex',
          'redsox',
          'thx1138',
          'asdf',
          'marlboro',
          'panther',
          'zxcvbnm',
          'arsenal',
          'oliver',
          'qazwsx',
          'mother',
          'victoria',
          '7777777',
          'jasper',
          'angel',
          'david',
          'winner',
          'crystal',
          'golden',
          'butthead',
          'viking',
          'jack',
          'iwantu',
          'shannon',
          'murphy',
          'angels',
          'prince',
          'cameron',
          'girls',
          'madison',
          'wilson',
          'carlos',
          'hooters',
          'willie',
          'startrek',
          'captain',
          'maddog',
          'jasmine',
          'butter',
          'booger',
          'angela',
          'golf',
          'lauren',
          'rocket',
          'tiffany',
          'theman',
          'dennis',
          'liverpoo',
          'flower',
          'forever',
          'green',
          'jackie',
          'muffin',
          'turtle',
          'sophie',
          'danielle',
          'redskins',
          'toyota',
          'jason',
          'sierra',
          'winston',
          'debbie',
          'giants',
          'packers',
          'newyork',
          'jeremy',
          'casper',
          'bubba',
          '112233',
          'sandra',
          'lovers',
          'mountain',
          'united',
          'cooper',
          'driver',
          'tucker',
          'helpme',
          'fucking',
          'pookie',
          'lucky',
          'maxwell',
          '8675309',
          'bear',
          'suckit',
          'gators',
          '5150',
          '222222',
          'shithead',
          'fuckoff',
          'jaguar',
          'monica',
          'fred',
          'happy',
          'hotdog',
          'tits',
          'gemini',
          'lover',
          'xxxxxxxx',
          '777777',
          'canada',
          'nathan',
          'victor',
          'florida',
          '88888888',
          'nicholas',
          'rosebud',
          'metallic',
          'doctor',
          'trouble',
          'success',
          'stupid',
          'tomcat',
          'warrior',
          'peaches',
          'apples',
          'fish',
          'qwertyui',
          'magic',
          'buddy',
          'dolphins',
          'rainbow',
          'gunner',
          '987654',
          'freddy',
          'alexis',
          'braves',
          'cock',
          '2112',
          '1212',
          'cocacola',
          'xavier',
          'dolphin',
          'testing',
          'bond007',
          'member',
          'calvin',
          'voodoo',
          '7777',
          'samson',
          'alex',
          'apollo',
          'fire',
          'tester',
          'walter',
          'beavis',
          'voyager',
          'peter',
          'porno',
          'bonnie',
          'rush2112',
          'beer',
          'apple',
          'scorpio',
          'jonathan',
          'skippy',
          'sydney',
          'scott',
          'red123',
          'power',
          'gordon',
          'travis',
          'beaver',
          'star',
          'jackass',
          'flyers',
          'boobs',
          '232323',
          'zzzzzz',
          'steve',
          'rebecca',
          'scorpion',
          'doggie',
          'legend',
          'ou812',
          'yankee',
          'blazer',
          'bill',
          'runner',
          'birdie',
          'bitches',
          '555555',
          'parker',
          'topgun',
          'asdfasdf',
          'heaven',
          'viper',
          'animal',
          '2222',
          'bigboy',
          '4444',
          'arthur',
          'baby',
          'private',
          'godzilla',
          'donald',
          'williams',
          'lifehack',
          'phantom',
          'dave',
          'rock',
          'august',
          'sammy',
          'cool',
          'brian',
          'platinum',
          'jake',
          'bronco',
          'paul',
          'mark',
          'frank',
          'heka6w2',
          'copper',
          'billy',
          'cumshot',
          'garfield',
          'willow',
          'cunt',
          'little',
          'carter',
          'slut',
          'albert',
          '69696969',
          'kitten',
          'super',
          'jordan23',
          'eagle1',
          'shelby',
          'america',
          '11111',
          'jessie',
          'house',
          'free',
          '123321',
          'chevy',
          'bullshit',
          'white',
          'broncos',
          'horney',
          'surfer',
          'nissan',
          '999999',
          'saturn',
          'airborne',
          'elephant',
          'marvin',
          'shit',
          'action',
          'adidas',
          'qwert',
          'kevin',
          '1313',
          'explorer',
          'walker',
          'police',
          'christin',
          'december',
          'benjamin',
          'wolf',
          'sweet',
          'therock',
          'king',
          'online',
          'dickhead',
          'brooklyn',
          'teresa',
          'cricket',
          'sharon',
          'dexter',
          'racing',
          'penis',
          'gregory',
          '0000',
          'teens',
          'redwings',
          'dreams',
          'michigan',
          'hentai',
          'magnum',
          '87654321',
          'nothing',
          'donkey',
          'trinity',
          'digital',
          '333333',
          'stella',
          'cartman',
          'guinness',
          '123abc',
          'speedy',
          'buffalo',
          'kitty',
          'pimpin',
          'eagle',
          'einstein',
          'kelly',
          'nelson',
          'nirvana',
          'vampire',
          'xxxx',
          'playboy',
          'louise',
          'pumpkin',
          'snowball',
          'test123',
          'girl',
          'sucker',
          'mexico',
          'beatles',
          'fantasy',
          'ford',
          'gibson',
          'celtic',
          'marcus',
          'cherry',
          'cassie',
          '888888',
          'natasha',
          'sniper',
          'chance',
          'genesis',
          'hotrod',
          'reddog',
          'alexande',
          'college',
          'jester',
          'passw0rd',
          'bigcock',
          'smith',
          'lasvegas',
          'carmen',
          'slipknot',
          '3333',
          'death',
          'kimberly',
          '1q2w3e',
          'eclipse',
          '1q2w3e4r',
          'stanley',
          'samuel',
          'drummer',
          'homer',
          'montana',
          'music',
          'aaaa',
          'spencer',
          'jimmy',
          'carolina',
          'colorado',
          'creative',
          'hello1',
          'rocky',
          'goober',
          'friday',
          'bollocks',
          'scotty',
          'abcdef',
          'bubbles',
          'hawaii',
          'fluffy',
          'mine',
          'stephen',
          'horses',
          'thumper',
          '5555',
          'pussies',
          'darkness',
          'asdfghjk',
          'pamela',
          'boobies',
          'buddha',
          'vanessa',
          'sandman',
          'naughty',
          'douglas',
          'honda',
          'matt',
          'azerty',
          '6666',
          'shorty',
          'money1',
          'beach',
          'loveme',
          '4321',
          'simple',
          'poohbear',
          '444444',
          'badass',
          'destiny',
          'sarah',
          'denise',
          'vikings',
          'lizard',
          'melanie',
          'assman',
          'sabrina',
          'nintendo',
          'water',
          'good',
          'howard',
          'time',
          '123qwe',
          'november',
          'xxxxx',
          'october',
          'leather',
          'bastard',
          'young',
          '101010',
          'extreme',
          'hard',
          'password1',
          'vincent',
          'pussy1',
          'lacrosse',
          'hotmail',
          'spooky',
          'amateur',
          'alaska',
          'badger',
          'paradise',
          'maryjane',
          'poop',
          'crazy',
          'mozart',
          'video',
          'russell',
          'vagina',
          'spitfire',
          'anderson',
          'norman',
          'eric',
          'cherokee',
          'cougar',
          'barbara',
          'long',
          '420420',
          'family',
          'horse',
          'enigma',
          'allison',
          'raider',
          'brazil',
          'blonde',
          'jones',
          '55555',
          'dude',
          'drowssap',
          'jeff',
          'school',
          'marshall',
          'lovely',
          '1qaz2wsx',
          'jeffrey',
          'caroline',
          'franklin',
          'booty',
          'molly',
          'snickers',
          'leslie',
          'nipples',
          'courtney',
          'diesel',
          'rocks',
          'eminem',
          'westside',
          'suzuki',
          'daddy',
          'passion',
          'hummer',
          'ladies',
          'zachary',
          'frankie',
          'elvis',
          'reggie',
          'alpha',
          'suckme',
          'simpson',
          'patricia',
          '147147',
          'pirate',
          'tommy',
          'semperfi',
          'jupiter',
          'redrum',
          'freeuser',
          'wanker',
          'stinky',
          'ducati',
          'paris',
          'natalie',
          'babygirl',
          'bishop',
          'windows',
          'spirit',
          'pantera',
          'monday',
          'patches',
          'brutus',
          'houston',
          'smooth',
          'penguin',
          'marley',
          'forest',
          'cream',
          '212121',
          'flash',
          'maximus',
          'nipple',
          'bobby',
          'bradley',
          'vision',
          'pokemon',
          'champion',
          'fireman',
          'indian',
          'softball',
          'picard',
          'system',
          'clinton',
          'cobra',
          'enjoy',
          'lucky1',
          'claire',
          'claudia',
          'boogie',
          'timothy',
          'marines',
          'security',
          'dirty',
          'admin',
          'wildcats',
          'pimp',
          'dancer',
          'hardon',
          'veronica',
          'fucked',
          'abcd1234',
          'abcdefg',
          'ironman',
          'wolverin',
          'remember',
          'great',
          'freepass',
          'bigred',
          'squirt',
          'justice',
          'francis',
          'hobbes',
          'kermit',
          'pearljam',
          'mercury',
          'domino',
          '9999',
          'denver',
          'brooke',
          'rascal',
          'hitman',
          'mistress',
          'simon',
          'tony',
          'bbbbbb',
          'friend',
          'peekaboo',
          'naked',
          'budlight',
          'electric',
          'sluts',
          'stargate',
          'saints',
          'bondage',
          'brittany',
          'bigman',
          'zombie',
          'swimming',
          'duke',
          'qwerty1',
          'babes',
          'scotland',
          'disney',
          'rooster',
          'brenda',
          'mookie',
          'swordfis',
          'candy',
          'duncan',
          'olivia',
          'hunting',
          'blink182',
          'alicia',
          '8888',
          'samsung',
          'bubba1',
          'whore',
          'virginia',
          'general',
          'passport',
          'aaaaaaaa',
          'erotic',
          'liberty',
          'arizona',
          'jesus',
          'abcd',
          'newport',
          'skipper',
          'rolltide',
          'balls',
          'happy1',
          'galore',
          'christ',
          'weasel',
          '242424',
          'wombat',
          'digger',
          'classic',
          'bulldogs',
          'poopoo',
          'accord',
          'popcorn',
          'turkey',
          'jenny',
          'amber',
          'bunny',
          'mouse',
          '007007',
          'titanic',
          'liverpool',
          'dreamer',
          'everton',
          'friends',
          'chevelle',
          'carrie',
          'gabriel',
          'psycho',
          'nemesis',
          'burton',
          'pontiac',
          'connor',
          'eatme',
          'lickme',
          'roland',
          'cumming',
          'mitchell',
          'ireland',
          'lincoln',
          'arnold',
          'spiderma',
          'patriots',
          'goblue',
          'devils',
          'eugene',
          'empire',
          'asdfg',
          'cardinal',
          'brown',
          'shaggy',
          'froggy',
          'qwer',
          'kawasaki',
          'kodiak',
          'people',
          'phpbb',
          'light',
          '54321',
          'kramer',
          'chopper',
          'hooker',
          'honey',
          'whynot',
          'lesbian',
          'lisa',
          'baxter',
          'adam',
          'snake',
          'teen',
          'ncc1701d',
          'qqqqqq',
          'airplane',
          'britney',
          'avalon',
          'sandy',
          'sugar',
          'sublime',
          'stewart',
          'wildcat',
          'raven',
          'scarface',
          'elizabet',
          '123654',
          'trucks',
          'wolfpack',
          'pervert',
          'lawrence',
          'raymond',
          'redhead',
          'american',
          'alyssa',
          'bambam',
          'movie',
          'woody',
          'shaved',
          'snowman',
          'tiger1',
          'chicks',
          'raptor',
          '1969',
          'stingray',
          'shooter',
          'france',
          'stars',
          'madmax',
          'kristen',
          'sports',
          'jerry',
          '789456',
          'garcia',
          'simpsons',
          'lights',
          'ryan',
          'looking',
          'chronic',
          'alison',
          'hahaha',
          'packard',
          'hendrix',
          'perfect',
          'service',
          'spring',
          'srinivas',
          'spike',
          'katie',
          '252525',
          'oscar',
          'brother',
          'bigmac',
          'suck',
          'single',
          'cannon',
          'georgia',
          'popeye',
          'tattoo',
          'texas',
          'party',
          'bullet',
          'taurus',
          'sailor',
          'wolves',
          'panthers',
          'japan',
          'strike',
          'flowers',
          'pussycat',
          'chris1',
          'loverboy',
          'berlin',
          'sticky',
          'marina',
          'tarheels',
          'fisher',
          'russia',
          'connie',
          'wolfgang',
          'testtest',
          'mature',
          'bass',
          'catch22',
          'juice',
          'michael1',
          'nigger',
          '159753',
          'women',
          'alpha1',
          'trooper',
          'hawkeye',
          'head',
          'freaky',
          'dodgers',
          'pakistan',
          'machine',
          'pyramid',
          'vegeta',
          'katana',
          'moose',
          'tinker',
          'coyote',
          'infinity',
          'inside',
          'pepsi',
          'letmein1',
          'bang',
          'control',
          'baseball1',
          'football1',
          'qwerty123',
          'password12',
          'iloveyou1',
          'princess1',
          'rockyou',
          'abc1234',
          'sunshine1',
          'chocolate',
          'password2',
          'angel1',
          'junior1',
          'shadow1',
          'monkey1',
          'lovely',
          'princess',
          'nicole1',
          'daniel1',
          'babygirl1',
          'beautiful',
          'qwerty12',
          'amanda1',
          'ashley1',
          'michael1',
          'buster1',
          'jennifer1',
          'jordan1',
          'soccer1',
          'hockey1',
          'pepper1',
          'joshua1',
          'matthew1',
          'trustno1',
          'william1',
          'anthony1',
          'batman1',
          'hunter1',
          'charlie1',
          'martin1',
          'rangers1',
          'killer1',
          'george1',
          'dragon1',
          'passw0rd',
          'qazwsx1',
          '1234qwer',
          'qwer1234',
          '123qweasd',
          'qweasd',
          'asdzxc',
          'zaq12wsx',
          '1qaz2wsx3edc',
          'qweasdzxc',
          '!@#$%^&*',
          'password!',
          'admin1',
          'letmein123',
          'welcome1',
          'monkey123',
          'football123',
          'baseball123',
          'dragon123',
          'master123',
          'superman123',
          'batman123',
          'hello123',
          'qwerty1234',
          'abc12345',
          '12345abc',
          '1234abcd',
          'abcd1234',
          'pass1234',
          'test1234',
          'user123',
          'user1234',
          'login123',
          'default',
          'changeme',
          'changeit',
          'temp123',
          'temp1234',
          'temporary',
          'guest123',
          'root123',
          'demo',
          'demo123',
          'sample',
          'example',
          'testing123',
          'development',
          'production',
          'staging',
          'local',
          'localhost',
          'devops',
          'sysadmin',
          'webmaster',
          'ftpuser',
          'backup',
          'oracle',
          'mysql',
          'postgres',
          'mongodb',
          'redis',
          'apache',
          'nginx',
          'server',
          'database',
          'network',
          'support',
          'service123',
          'qwe123',
          'asd123',
          'zxc123',
          '123asd',
          '123zxc',
          '321qwe',
          '321asd',
          '321zxc',
          'qweasd123',
          'asdzxc123',
          'qwerty!',
          'password@',
          'admin@123',
          'root@123',
          'user@123',
          'P@ssw0rd',
          'P@ssword',
          'P@ssword1',
          'Passw0rd!',
          'Password1!',
          'Admin123!',
          'Welcome1!',
          'Qwerty123!',
          'Test@123',
          'Admin@123',
          'Root@123',
          'User@123',
          'pass@123',
          'passw@rd',
          'pa$$w0rd',
          'pa$$word',
          'p@$$w0rd',
          'Pa$$w0rd',
          'Summer2020',
          'Winter2020',
          'Spring2021',
          'Fall2021',
          'January2020',
          'March2020',
          'April2020',
          'May2020',
          'June2020',
          'July2020',
          'August2020',
          'September',
          'October2020',
          'November',
          'December2020',
          'company',
          'company123',
          'corporate',
          'business',
          'enterprise',
          'office',
          'office123',
          'work123',
          'employee',
          'staff',
          'manager',
          'director',
          'executive',
          'ceo',
          'cfo',
          'cto',
          'president',
          'chairman',
          'secretary',
          'assistant',
          'intern',
          'contractor',
          'consultant',
          'analyst',
          'developer',
          'engineer',
          'programmer',
          'designer',
          'architect',
          'qa',
          'tester',
          'devtest',
          'prodtest',
          'uat',
          'sit',
          'devenv',
          'prodenv',
          'stagingenv',
          'testenv'
        ];
        const MORSE_TABLE = {
          '.-': 'A',
          '-...': 'B',
          '-.-.': 'C',
          '-..': 'D',
          '.': 'E',
          '..-.': 'F',
          '--.': 'G',
          '....': 'H',
          '..': 'I',
          '.---': 'J',
          '-.-': 'K',
          '.-..': 'L',
          '--': 'M',
          '-.': 'N',
          '---': 'O',
          '.--.': 'P',
          '--.-': 'Q',
          '.-.': 'R',
          '...': 'S',
          '-': 'T',
          '..-': 'U',
          '...-': 'V',
          '.--': 'W',
          '-..-': 'X',
          '-.--': 'Y',
          '--..': 'Z',
          '-----': '0',
          '.----': '1',
          '..---': '2',
          '...--': '3',
          '....-': '4',
          '.....': '5',
          '-....': '6',
          '--...': '7',
          '---..': '8',
          '----.': '9',
          '.-.-.-': '.',
          '--..--': ',',
          '..--..': '?',
          '-.-.--': '!',
          '-..-.': '/',
          '-.--.': '(',
          '-.--.-': ')',
          '.-...': '&',
          '---...': ':',
          '-.-.-.': ';',
          '-...-': '=',
          '.-.-.': '+',
          '-....-': '-',
          '..--.-': '_',
          '.-..-.': '"',
          '...-..-': '$',
          '.--.-.': '@'
        };

        function stripWhitespace(value) {
          return value.replace(/[\\s\\u200B\\u200C\\u200D\\uFEFF]+/g, '');
        }

        function normalizeHash(value) {
          return stripWhitespace(value).toLowerCase();
        }

        function loadStoredMap(key) {
          try {
            const raw = localStorage.getItem(key);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return {};
            return parsed;
          } catch {
            return {};
          }
        }

        function saveStoredMap(key, map) {
          localStorage.setItem(key, JSON.stringify(map));
        }

        function applyStoredEntries(entries, source, allowOverride = false) {
          Object.keys(entries).forEach((hash) => {
            const normalized = normalizeHash(hash);
            const value = entries[hash];
            if (!normalized || !value) return;
            if (!allowOverride && RAINBOW_TABLE[normalized]) return;
            RAINBOW_TABLE[normalized] = String(value);
            RAINBOW_SOURCES[normalized] = source;
          });
        }

        const externalCache = loadStoredMap(RAINBOW_EXTERNAL_CACHE_KEY);
        const customCache = loadStoredMap(RAINBOW_CUSTOM_CACHE_KEY);
        applyStoredEntries(externalCache, 'external');
        applyStoredEntries(customCache, 'custom', true);

        function storeExternalEntry(hash, value) {
          if (!hash || !value) return;
          externalCache[hash] = value;
          saveStoredMap(RAINBOW_EXTERNAL_CACHE_KEY, externalCache);
          RAINBOW_TABLE[hash] = value;
          RAINBOW_SOURCES[hash] = 'external';
        }

        function storeCustomEntry(hash, value) {
          if (!hash || !value) return;
          customCache[hash] = value;
          saveStoredMap(RAINBOW_CUSTOM_CACHE_KEY, customCache);
          RAINBOW_TABLE[hash] = value;
          RAINBOW_SOURCES[hash] = 'custom';
        }

        function md5(string) {
          return rstr2hex(rstrMD5(str2rstrUTF8(string)));
        }

        function rstrMD5(input) {
          return binl2rstr(binlMD5(rstr2binl(input), input.length * 8));
        }

        function rstr2hex(input) {
          const hexTab = '0123456789abcdef';
          let output = '';
          for (let i = 0; i < input.length; i++) {
            const x = input.charCodeAt(i);
            output += hexTab.charAt((x >>> 4) & 15) + hexTab.charAt(x & 15);
          }
          return output;
        }

        function str2rstrUTF8(input) {
          return unescape(encodeURIComponent(input));
        }

        function rstr2binl(input) {
          const output = Array((input.length >> 2) + 1).fill(0);
          for (let i = 0; i < input.length * 8; i += 8) {
            output[i >> 5] |= (input.charCodeAt(i / 8) & 255) << (i % 32);
          }
          return output;
        }

        function binl2rstr(input) {
          let output = '';
          for (let i = 0; i < input.length * 32; i += 8) {
            output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 255);
          }
          return output;
        }

        function binlMD5(x, len) {
          x[len >> 5] |= 128 << (len % 32);
          x[((len + 64) >>> 9 << 4) + 14] = len;

          let a = 1732584193;
          let b = -271733879;
          let c = -1732584194;
          let d = 271733878;

          for (let i = 0; i < x.length; i += 16) {
            const oldA = a;
            const oldB = b;
            const oldC = c;
            const oldD = d;

            a = md5ff(a, b, c, d, x[i], 7, -680876936);
            d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
            c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
            b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
            a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
            d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
            c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
            b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
            a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
            d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
            c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
            b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
            d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);

            a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
            d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
            c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
            b = md5gg(b, c, d, a, x[i], 20, -373897302);
            a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
            d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
            c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
            d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
            c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
            b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
            d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
            c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
            b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);

            a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
            d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
            c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
            b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
            d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
            c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
            b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
            d = md5hh(d, a, b, c, x[i], 11, -358537222);
            c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
            b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
            d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
            b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);

            a = md5ii(a, b, c, d, x[i], 6, -198630844);
            d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
            c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
            a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
            d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
            c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
            a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
            d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
            b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
            d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
            b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);

            a = safeAdd(a, oldA);
            b = safeAdd(b, oldB);
            c = safeAdd(c, oldC);
            d = safeAdd(d, oldD);
          }

          return [a, b, c, d];
        }

        function safeAdd(x, y) {
          const lsw = (x & 65535) + (y & 65535);
          const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
          return (msw << 16) | (lsw & 65535);
        }

        function bitRotateLeft(num, cnt) {
          return (num << cnt) | (num >>> (32 - cnt));
        }

        function md5cmn(q, a, b, x, s, t) {
          return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
        }

        function md5ff(a, b, c, d, x, s, t) {
          return md5cmn((b & c) | (~b & d), a, b, x, s, t);
        }

        function md5gg(a, b, c, d, x, s, t) {
          return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
        }

        function md5hh(a, b, c, d, x, s, t) {
          return md5cmn(b ^ c ^ d, a, b, x, s, t);
        }

        function md5ii(a, b, c, d, x, s, t) {
          return md5cmn(c ^ (b | ~d), a, b, x, s, t);
        }

        let dynamicRainbowTable = null;

        function buildDynamicRainbowTable() {
          if (dynamicRainbowTable) return dynamicRainbowTable;

          dynamicRainbowTable = {};
          COMMON_PASSWORDS.forEach((password) => {
            let current = password;
            for (let layer = 1; layer <= MAX_DYNAMIC_LAYERS; layer++) {
              const hash = md5(current);
              if (!dynamicRainbowTable[hash]) {
                dynamicRainbowTable[hash] = current;
              }
              current = hash;
            }
          });

          return dynamicRainbowTable;
        }

        const RAINBOW_APIS = [
          {
            name: 'md5decrypt.net',
            url: (hash, algorithm) => algorithm === 'MD5'
              ? 'https://md5decrypt.net/Api/api.php?hash=' + hash + '&hash_type=md5&email=test@test.com&code=free'
              : null,
            parseResponse: (text) => text && text !== 'ERROR' ? text : null
          },
          {
            name: 'hashtoolkit',
            url: (hash) => 'https://hashtoolkit.com/reverse-hash?hash=' + hash,
            parseResponse: (html) => {
              const match = html.match(/<span class="res-text">([^<]+)<\\/span>/);
              return match ? match[1] : null;
            }
          }
        ];

        async function lookupHashExternal(hash, algorithm) {
          const useExternal = localStorage.getItem(RAINBOW_EXTERNAL_TOGGLE_KEY) === 'true';
          if (!useExternal) return null;

          const normalizedAlgorithm = (algorithm || '').toUpperCase();

          for (const api of RAINBOW_APIS) {
            const apiUrl = api.url(hash, normalizedAlgorithm);
            if (!apiUrl) continue;
            let timeoutId;
            const controller = new AbortController();
            try {
              timeoutId = setTimeout(() => controller.abort(), 5000);
              const response = await fetch(apiUrl, {
                signal: controller.signal,
                mode: 'cors'
              });
              clearTimeout(timeoutId);

              if (!response.ok) continue;
              const text = await response.text();
              const result = api.parseResponse(text);
              if (result) return result;
            } catch (error) {
              if (timeoutId) clearTimeout(timeoutId);
              continue;
            }
          }
          return null;
        }

        async function reverseHash(hash, algorithm = 'MD5') {
          const normalized = normalizeHash(hash);
          if (!normalized) return null;

          const staticMatch = RAINBOW_TABLE[normalized];
          if (staticMatch) {
            return { value: staticMatch, source: RAINBOW_SOURCES[normalized] || 'static' };
          }

          const dynamicTable = buildDynamicRainbowTable();
          if (dynamicTable[normalized]) {
            return { value: dynamicTable[normalized], source: 'dynamic' };
          }

          const external = await lookupHashExternal(normalized, algorithm);
          if (external) {
            storeExternalEntry(normalized, external);
            return { value: external, source: 'external' };
          }

          return null;
        }

        function detectHash(value) {
          const normalized = normalizeHash(value);
          if (!normalized) return null;
          if (!/^[0-9a-f]+$/.test(normalized)) return null;
          const algorithm = HASH_LENGTHS[normalized.length];
          if (!algorithm) return null;
          return {
            algorithm,
            hash: normalized,
            match: RAINBOW_TABLE[normalized] || null,
            length: normalized.length
          };
        }

        function isSupportedHash(value) {
          const normalized = normalizeHash(value);
          if (!normalized) return null;
          if (!/^[0-9a-f]+$/.test(normalized)) return null;
          const algorithm = HASH_LENGTHS[normalized.length];
          if (!algorithm) return null;
          return { hash: normalized, algorithm };
        }

        function looksLikeBinary(value) {
          const stripped = stripWhitespace(value);
          if (stripped.length < 16) return false;
          if (stripped.length % 8 !== 0) return false;
          return /^[01]+$/.test(stripped);
        }

        function decodeBinary(value) {
          const stripped = stripWhitespace(value);
          if (!/^[01]+$/.test(stripped) || stripped.length % 8 !== 0) {
            throw new Error('Invalid binary payload.');
          }
          const bytes = new Uint8Array(stripped.length / 8);
          for (let i = 0; i < stripped.length; i += 8) {
            bytes[i / 8] = parseInt(stripped.slice(i, i + 8), 2);
          }
          return new TextDecoder().decode(bytes);
        }

        function looksLikeOctal(value) {
          const trimmed = value.trim();
          if (/(?:\\\\[0-7]{3}){2,}/.test(trimmed)) {
            if (!trimmed.startsWith('\\\\') && trimmed.endsWith('\\\\')) {
              const reversed = reverseString(trimmed);
              if (reversed.startsWith('\\\\') && /(?:\\\\[0-7]{3}){2,}/.test(reversed)) {
                return false;
              }
            }
            return true;
          }
          const tokens = trimmed.split(/[\\s,]+/).filter(Boolean);
          if (tokens.length < 2) return false;
          if (!tokens.every((token) => /^[0-7]{3}$/.test(token))) return false;
          const alsoValidDecimal = tokens.every((token) => {
            const num = parseInt(token, 10);
            return num >= 32 && num <= 126;
          });
          if (alsoValidDecimal) {
            const octalBytes = tokens.map((t) => parseInt(t, 8));
            const decimalBytes = tokens.map((t) => parseInt(t, 10));
            const octalText = String.fromCharCode(...octalBytes);
            const decimalText = String.fromCharCode(...decimalBytes);
            const octalLower = [...octalText].filter((c) => c >= 'a' && c <= 'z').length;
            const decimalLower = [...decimalText].filter((c) => c >= 'a' && c <= 'z').length;
            if (decimalLower > octalLower) return false;
          }
          return true;
        }

        function decodeOctal(value) {
          const escaped = value.match(/\\\\[0-7]{3}/g);
          let bytes = [];
          if (escaped && escaped.length) {
            bytes = escaped.map((token) => parseInt(token.slice(1), 8));
          } else {
            const tokens = value.trim().split(/[\\s,]+/).filter(Boolean);
            if (!tokens.length || !tokens.every((token) => /^[0-7]{3}$/.test(token))) {
              throw new Error('Invalid octal payload.');
            }
            bytes = tokens.map((token) => parseInt(token, 8));
          }
          return new TextDecoder().decode(new Uint8Array(bytes));
        }

        function looksLikeDecimalBytes(value) {
          const tokens = value.trim().split(/[\\s,]+/).filter(Boolean);
          if (tokens.length < 2) return false;
          if (!tokens.every((token) => /^\\d{1,3}$/.test(token))) return false;
          return tokens.every((token) => {
            const number = Number.parseInt(token, 10);
            return number >= 0 && number <= 255;
          });
        }

        function decodeDecimalBytes(value) {
          const tokens = value.trim().split(/[\\s,]+/).filter(Boolean);
          if (!tokens.length || !tokens.every((token) => /^\\d{1,3}$/.test(token))) {
            throw new Error('Invalid decimal byte payload.');
          }
          const bytes = tokens.map((token) => Number.parseInt(token, 10));
          if (bytes.some((byte) => byte < 0 || byte > 255)) {
            throw new Error('Decimal bytes must be between 0 and 255.');
          }
          return new TextDecoder().decode(new Uint8Array(bytes));
        }

        function looksLikeQuotedPrintable(value) {
          return /=[0-9A-Fa-f]{2}/.test(value) || /=\\r?\\n/.test(value);
        }

        function decodeQuotedPrintable(value) {
          const normalized = value.replace(/=\\r?\\n/g, '');
          return normalized.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
          });
        }

        function looksLikeUUencode(value) {
          const trimmed = value.trim();
          if (!/^begin [0-7]{3} /m.test(trimmed)) return false;
          return /\\nend\\s*$/m.test(trimmed);
        }

        function decodeUUencode(value) {
          const lines = value.replace(/\\r/g, '').split('\\n');
          const beginIndex = lines.findIndex((line) => /^begin [0-7]{3} /.test(line));
          if (beginIndex === -1) {
            throw new Error('UUencode begin line missing.');
          }
          const tail = lines.slice(beginIndex + 1);
          const endIndex = tail.findIndex((line) => line.trim() === 'end');
          const body = endIndex === -1 ? tail : tail.slice(0, endIndex);
          const bytes = [];
          body.forEach((line) => {
            if (!line) return;
            const length = ((line.charCodeAt(0) - 32) & 63);
            if (!length) return;
            let idx = 1;
            let outCount = 0;
            while (outCount < length && idx + 3 < line.length) {
              const c1 = (line.charCodeAt(idx++) - 32) & 63;
              const c2 = (line.charCodeAt(idx++) - 32) & 63;
              const c3 = (line.charCodeAt(idx++) - 32) & 63;
              const c4 = (line.charCodeAt(idx++) - 32) & 63;
              const b1 = (c1 << 2) | (c2 >> 4);
              const b2 = ((c2 & 15) << 4) | (c3 >> 2);
              const b3 = ((c3 & 3) << 6) | c4;
              if (outCount < length) {
                bytes.push(b1);
                outCount += 1;
              }
              if (outCount < length) {
                bytes.push(b2);
                outCount += 1;
              }
              if (outCount < length) {
                bytes.push(b3);
                outCount += 1;
              }
            }
          });
          return new TextDecoder().decode(new Uint8Array(bytes));
        }

        function isAscii85Char(char) {
          const code = char.charCodeAt(0);
          return (code >= 33 && code <= 117) || char === 'z';
        }

        function looksLikeAscii85(value) {
          let body = value.trim();
          if (!body) return false;
          if (body.includes('\\\\')) return false;
          if (looksLikeOctal(body) || looksLikeDecimalBytes(body) || looksLikeUrlEncoded(body)) return false;
          if (scoreDecodedText(body) >= 70) return false;
          if (body.startsWith('<~')) body = body.slice(2);
          if (body.endsWith('~>')) body = body.slice(0, -2);
          body = stripWhitespace(body);
          if (body.length < 10) return false;
          if (looksLikeHex(body) || looksLikeBinary(body)) return false;
          for (let i = 0; i < body.length; i++) {
            if (!isAscii85Char(body[i])) return false;
          }
          return true;
        }

        function decodeAscii85(value) {
          let body = value.trim();
          if (body.startsWith('<~')) body = body.slice(2);
          if (body.endsWith('~>')) body = body.slice(0, -2);
          body = stripWhitespace(body);
          const bytes = [];
          let chunk = [];
          for (let i = 0; i < body.length; i++) {
            const char = body[i];
            if (char === 'z' && chunk.length === 0) {
              bytes.push(0, 0, 0, 0);
              continue;
            }
            if (!isAscii85Char(char)) {
              throw new Error('Invalid ASCII85 character.');
            }
            chunk.push(char.charCodeAt(0) - 33);
            if (chunk.length === 5) {
              let value32 = 0;
              for (let j = 0; j < 5; j++) {
                value32 = value32 * 85 + chunk[j];
              }
              bytes.push((value32 >>> 24) & 255, (value32 >>> 16) & 255, (value32 >>> 8) & 255, value32 & 255);
              chunk = [];
            }
          }
          if (chunk.length) {
            const padding = 5 - chunk.length;
            for (let i = 0; i < padding; i++) {
              chunk.push(84);
            }
            let value32 = 0;
            for (let j = 0; j < 5; j++) {
              value32 = value32 * 85 + chunk[j];
            }
            const tail = [(value32 >>> 24) & 255, (value32 >>> 16) & 255, (value32 >>> 8) & 255, value32 & 255];
            bytes.push(...tail.slice(0, chunk.length - 1));
          }
          return new TextDecoder().decode(new Uint8Array(bytes));
        }

        // Base32 decoder (RFC 4648)
        const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        const BASE32_MAP = {};
        for (let i = 0; i < BASE32_ALPHABET.length; i++) {
          BASE32_MAP[BASE32_ALPHABET[i]] = i;
        }

        function looksLikeBase32(value) {
          const stripped = stripWhitespace(value).toUpperCase().replace(/=+$/, '');
          if (stripped.length < 8) return false;
          if (!/^[A-Z2-7]+$/.test(stripped)) return false;
          if (isDictionaryWord(stripped)) return false;
          if (/^[A-F0-9]+$/i.test(stripped) && stripped.length % 2 === 0) return false;
          const letterCount = (stripped.match(/[A-Z]/g) || []).length;
          const digitCount = (stripped.match(/[2-7]/g) || []).length;
          if (letterCount < digitCount) return false;
          try {
            const decoded = decodeBase32(stripped);
            const hasNumericEncoding = looksLikeBinary(decoded)
              || looksLikeOctal(decoded)
              || looksLikeDecimalBytes(decoded)
              || looksLikeHex(decoded);
            if (hasNumericEncoding) return true;
            if (looksMeaningfulText(decoded)) return true;
            return (bestEncodedScore(decoded) || 0) >= 55;
          } catch {
            return false;
          }
        }

        function decodeBase32(value) {
          const stripped = stripWhitespace(value).toUpperCase().replace(/=+$/, '');
          const bytes = [];
          let buffer = 0;
          let bits = 0;
          for (let i = 0; i < stripped.length; i++) {
            const char = stripped[i];
            const val = BASE32_MAP[char];
            if (val === undefined) throw new Error('Invalid Base32 character: ' + char);
            buffer = (buffer << 5) | val;
            bits += 5;
            if (bits >= 8) {
              bits -= 8;
              bytes.push((buffer >> bits) & 0xFF);
            }
          }
          return new TextDecoder().decode(new Uint8Array(bytes));
        }

        // Base58 decoder (Bitcoin alphabet: no 0, O, I, l)
        const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        const BASE58_MAP = {};
        for (let i = 0; i < BASE58_ALPHABET.length; i++) {
          BASE58_MAP[BASE58_ALPHABET[i]] = i;
        }

        function looksLikeBase58(value) {
          const stripped = stripWhitespace(value);
          if (stripped.length < 4) return false;
          // Must only contain Base58 alphabet (no 0, O, I, l)
          if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(stripped)) return false;
          // Avoid matching hex strings
          if (/^[0-9a-fA-F]+$/.test(stripped)) return false;
          // Avoid dictionary words
          if (isDictionaryWord(stripped)) return false;
          // Check for mixed case or digits to distinguish from plain text
          const hasUpper = /[A-Z]/.test(stripped);
          const hasLower = /[a-z]/.test(stripped);
          const hasDigit = /[0-9]/.test(stripped);
          if (!((hasUpper && hasLower) || (hasDigit && (hasUpper || hasLower)))) return false;

          try {
            const decoded = decodeBase58(stripped);
            const hasNumericEncoding = looksLikeBinary(decoded)
              || looksLikeOctal(decoded)
              || looksLikeDecimalBytes(decoded)
              || looksLikeHex(decoded);
            if (hasNumericEncoding) return true;
            if (looksMeaningfulText(decoded)) return true;
            return (bestEncodedScore(decoded) || 0) >= 55;
          } catch {
            return false;
          }
        }

        function decodeBase58(value) {
          const stripped = stripWhitespace(value);
          if (!stripped.length) return '';
          // Count leading '1's (they represent leading zero bytes)
          let leadingZeros = 0;
          for (let i = 0; i < stripped.length && stripped[i] === '1'; i++) {
            leadingZeros++;
          }
          // Convert base58 to big integer, then to bytes
          const bytes = [0];
          for (let i = 0; i < stripped.length; i++) {
            const char = stripped[i];
            const val = BASE58_MAP[char];
            if (val === undefined) throw new Error('Invalid Base58 character: ' + char);
            let carry = val;
            for (let j = bytes.length - 1; j >= 0; j--) {
              const total = bytes[j] * 58 + carry;
              bytes[j] = total % 256;
              carry = Math.floor(total / 256);
            }
            while (carry > 0) {
              bytes.unshift(carry % 256);
              carry = Math.floor(carry / 256);
            }
          }
          // Add leading zero bytes
          const result = new Uint8Array(leadingZeros + bytes.length);
          for (let i = 0; i < bytes.length; i++) {
            result[leadingZeros + i] = bytes[i];
          }
          return new TextDecoder().decode(result);
        }

        function looksLikeRot47(value) {
          const trimmed = value.trim();
          if (trimmed.length < 8) return false;
          if (isDictionaryWord(trimmed)) return false;
          for (let i = 0; i < trimmed.length; i++) {
            const code = trimmed.charCodeAt(i);
            if (code === 9 || code === 10 || code === 13 || code === 32) continue;
            const inAsciiRange = code >= 33 && code <= 126;
            const inSimRange = code >= 66 && code <= 159;
            if (!inAsciiRange && !inSimRange) return false;
          }
          const currentTextScore = scoreDecodedText(trimmed);
          if (currentTextScore >= 75) return false;
          const currentEncodedScore = bestEncodedScore(trimmed);
          const rotatedStandard = rot47Standard(trimmed);
          const rotatedSim = rot47SimInverse(trimmed);

          const checkCandidate = (candidate) => {
            if (candidate === trimmed) return false;
            const candidateEncodedScore = bestEncodedScore(candidate);
            if (candidateEncodedScore !== null) {
              if (currentEncodedScore === null) return true;
              if (candidateEncodedScore >= currentEncodedScore + 10) return true;
            }
            const candidateTextScore = scoreDecodedText(candidate);
            if (candidateTextScore >= currentTextScore + 15) return true;
            return false;
          };

          if (checkCandidate(rotatedStandard)) return true;
          if (checkCandidate(rotatedSim)) return true;
          return false;
        }

        function rot47Standard(value) {
          return value.replace(/[!-~]/g, (char) => {
            const code = char.charCodeAt(0);
            return String.fromCharCode(33 + ((code - 33 + 47) % 94));
          });
        }

        function rot47SimInverse(value) {
          let out = '';
          for (let i = 0; i < value.length; i++) {
            const code = value.charCodeAt(i);
            if (code >= 66 && code <= 159) {
              const y = (code - 113 + 940) % 94;
              out += String.fromCharCode(33 + y);
              continue;
            }
            if (code >= 33 && code <= 126) {
              out += String.fromCharCode(33 + ((code - 33 + 47) % 94));
              continue;
            }
            out += value[i];
          }
          return out;
        }

        function rot47(value) {
          const standard = rot47Standard(value);
          const sim = rot47SimInverse(value);
          const standardScore = scoreDecodedCandidate(standard) + (bestEncodedScore(standard) || 0);
          const simScore = scoreDecodedCandidate(sim) + (bestEncodedScore(sim) || 0);
          return simScore > standardScore ? sim : standard;
        }

        function punycodeDigit(code) {
          if (code >= 48 && code <= 57) return code - 22;
          if (code >= 65 && code <= 90) return code - 65;
          if (code >= 97 && code <= 122) return code - 97;
          return 36;
        }

        function punycodeAdapt(delta, numPoints, firstTime) {
          let result = delta;
          result = firstTime ? Math.floor(result / 700) : Math.floor(result / 2);
          result += Math.floor(result / numPoints);
          let k = 0;
          while (result > 455) {
            result = Math.floor(result / 35);
            k += 36;
          }
          return k + Math.floor((36 * result) / (result + 38));
        }

        function decodePunycodeLabel(value) {
          let n = 128;
          let i = 0;
          let bias = 72;
          const output = [];
          const dashPos = value.lastIndexOf('-');
          let index = 0;
          if (dashPos > -1) {
            for (let j = 0; j < dashPos; j++) {
              output.push(value.charCodeAt(j));
            }
            index = dashPos + 1;
          }
          while (index < value.length) {
            const oldi = i;
            let w = 1;
            for (let k = 36; ; k += 36) {
              if (index >= value.length) throw new Error('Invalid punycode payload.');
              const digit = punycodeDigit(value.charCodeAt(index++));
              if (digit >= 36) throw new Error('Invalid punycode digit.');
              i += digit * w;
              const t = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;
              if (digit < t) break;
              w *= (36 - t);
            }
            const outLength = output.length + 1;
            bias = punycodeAdapt(i - oldi, outLength, oldi === 0);
            n += Math.floor(i / outLength);
            i = i % outLength;
            output.splice(i, 0, n);
            i += 1;
          }
          return String.fromCodePoint(...output);
        }

        function looksLikePunycode(value) {
          return /\\bxn--[a-z0-9-]{4,}/i.test(value);
        }

        function decodePunycode(value) {
          return value.replace(/\\bxn--[a-z0-9-]{4,}/gi, (match) => {
            const label = match.slice(4);
            try {
              return decodePunycodeLabel(label);
            } catch {
              return match;
            }
          });
        }

        function looksLikeMorse(value) {
          const trimmed = value.trim();
          if (!trimmed) return false;
          if (!/^[.\\-\\/\\s]+$/.test(trimmed)) return false;
          return /[.\\-]/.test(trimmed);
        }

        function decodeMorse(value) {
          const trimmed = value.trim();
          if (!trimmed) return '';
          const words = trimmed.split(/\\s*\\/\\s*|\\s{2,}/);
          return words.map((word) => {
            return word.split(/\\s+/).map((symbol) => MORSE_TABLE[symbol] || '?').join('');
          }).join(' ');
        }

        function safeAtob(value) {
          try {
            return atob(value);
          } catch {
            return null;
          }
        }

        function padBase64(value) {
          const stripped = stripWhitespace(value);
          const mod = stripped.length % 4;
          if (mod === 1) return null;
          return stripped + '==='.slice((stripped.length + 3) % 4);
        }

        function isDictionaryWord(value) {
          const commonWords = new Set([
            'password', 'admin', 'secret', 'test', 'user', 'root', 'guest',
            'login', 'welcome', 'hello', 'world', 'data', 'info', 'access',
            'system', 'account', 'service', 'public', 'private', 'secure',
            'qwerty', 'letmein', 'iloveyou', 'abc123', 'password1', 'admin123'
          ]);
          return commonWords.has(value.trim().toLowerCase());
        }

        function looksLikeBase64(value) {
          const stripped = stripWhitespace(value);
          
          if (isDictionaryWord(stripped)) return false;
          
          if (stripped.length < 4) return false;
          if (!base64Alphabet.test(stripped)) return false;
          if (stripped.length % 4 === 1) return false;
          if (looksLikeBinary(stripped) || looksLikeDecimalBytes(value) || looksLikeOctal(value)) return false;
          if (looksLikeHex(stripped)) return false;
          
          const padded = padBase64(stripped);
          if (!padded) return false;
          const decoded = safeAtob(padded);
          if (decoded === null) return false;
          const hasNumericEncoding = looksLikeBinary(decoded)
            || looksLikeOctal(decoded)
            || looksLikeDecimalBytes(decoded)
            || looksLikeHex(decoded);
          if (hasNumericEncoding) return true;
          if (looksMeaningfulText(decoded)) return true;
          return (bestEncodedScore(decoded) || 0) >= 55;
        }

        function looksLikeBase64Url(value) {
          const stripped = stripWhitespace(value);
          
          if (isDictionaryWord(stripped)) return false;
          
          if (stripped.length < 4) return false;
          if (!base64UrlAlphabet.test(stripped)) return false;
          if (stripped.length % 4 === 1) return false;
          if (looksLikeBinary(stripped) || looksLikeDecimalBytes(value) || looksLikeOctal(value)) return false;
          if (looksLikeHex(stripped)) return false;
          
          const normalized = stripped.replace(/-/g, '+').replace(/_/g, '/');
          const padded = padBase64(normalized);
          if (!padded) return false;
          const decoded = safeAtob(padded);
          if (decoded === null) return false;
          const hasNumericEncoding = looksLikeBinary(decoded)
            || looksLikeOctal(decoded)
            || looksLikeDecimalBytes(decoded)
            || looksLikeHex(decoded);
          if (hasNumericEncoding) return true;
          if (looksMeaningfulText(decoded)) return true;
          return (bestEncodedScore(decoded) || 0) >= 55;
        }

        function looksLikeHex(value) {
          const stripped = stripWhitespace(value);
          if (stripped.length < 8 || stripped.length % 2 !== 0) return false;
          return /^[0-9a-fA-F]+$/.test(stripped);
        }

        function looksLikeJwt(value) {
          return /^[A-Za-z0-9_\\-]+\\.[A-Za-z0-9_\\-]+\\.[A-Za-z0-9_\\-]*$/.test(value.trim());
        }

        function looksLikeUrlEncoded(value) {
          return /%[0-9a-fA-F]{2}/.test(value);
        }

        function isLikelyEncoded(value) {
          return looksLikeJwt(value)
            || looksLikeBase64(value)
            || looksLikeBase64Url(value)
            || looksLikeHex(value)
            || looksLikeBinary(value)
            || looksLikeOctal(value)
            || looksLikeDecimalBytes(value)
            || looksLikeQuotedPrintable(value)
            || looksLikeUUencode(value)
            || looksLikeAscii85(value)
            || looksLikePunycode(value)
            || looksLikeMorse(value)
            || looksLikeUrlEncoded(value)
            || Boolean(detectHash(value));
        }

        function reverseString(value) {
          return value.split('').reverse().join('');
        }

        function rot13(value) {
          return value.replace(/[A-Za-z]/g, (char) => {
            const base = char <= 'Z' ? 65 : 97;
            return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
          });
        }

        function findMatches(pattern, value, minLength, limit = 40) {
          const matches = [];
          const seen = new Set();
          const iterator = value.matchAll(pattern);
          for (const match of iterator) {
            const token = match[0];
            if (token.length < minLength) continue;
            if (seen.has(token)) continue;
            seen.add(token);
            matches.push(token);
            if (matches.length >= limit) break;
          }
          return matches;
        }

        function decodeHexToText(value) {
          const stripped = stripWhitespace(value);
          if (!/^[0-9a-fA-F]+$/.test(stripped) || stripped.length % 2 !== 0) return null;
          const bytes = new Uint8Array(stripped.length / 2);
          for (let i = 0; i < stripped.length; i += 2) {
            bytes[i / 2] = parseInt(stripped.slice(i, i + 2), 16);
          }
          try {
            return new TextDecoder('utf-8').decode(bytes);
          } catch {
            return new TextDecoder('utf-16').decode(bytes);
          }
        }

        function looksLikeHexEncodedText(value) {
          const decoded = decodeHexToText(value);
          if (!decoded) return false;
          if (looksLikeBinary(decoded) || looksLikeOctal(decoded) || looksLikeDecimalBytes(decoded) || looksLikeHex(decoded)) return true;
          if (looksMeaningfulText(decoded)) return true;
          return (bestEncodedScore(decoded) || 0) >= 55;
        }

        function decodeJwtPayload(value) {
          const parts = value.split('.');
          if (parts.length < 2) return null;
          const segment = parts[1];
          const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
          const padded = normalized + '==='.slice((normalized.length + 3) % 4);
          const json = atob(padded);
          return JSON.stringify(JSON.parse(json), null, 2);
        }

        function decodeCandidateText(candidate) {
          if (!candidate) return null;
          try {
            if (candidate.type === 'Base64') {
              const padded = padBase64(candidate.token);
              if (!padded) return null;
              return safeAtob(padded);
            }
            if (candidate.type === 'Base64URL') {
              const normalized = candidate.token.replace(/-/g, '+').replace(/_/g, '/');
              const padded = padBase64(normalized);
              if (!padded) return null;
              return safeAtob(padded);
            }
            if (candidate.type === 'Hex') {
              return decodeHexToText(candidate.token);
            }
            if (candidate.type === 'URL') {
              return decodeURIComponent(candidate.token);
            }
            if (candidate.type === 'JWT') {
              return decodeJwtPayload(candidate.token);
            }
          } catch {
            return null;
          }
          return null;
        }

        function scoreDecodedText(value) {
          if (!value) return 0;
          const trimmed = value.trim();
          if (!trimmed) return 0;
          let printable = 0;
          let control = 0;
          let nulls = 0;
          for (let i = 0; i < trimmed.length; i++) {
            const code = trimmed.charCodeAt(i);
            if (code === 0) {
              nulls += 1;
              control += 1;
              continue;
            }
            if (code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)) {
              printable += 1;
            } else if (code < 32 || code === 127) {
              control += 1;
            }
          }
          const length = Math.max(trimmed.length, 1);
          const printableRatio = printable / length;
          const controlRatio = control / length;
          let score = printableRatio * 100;
          score -= controlRatio * 80;
          if (nulls > 0) score -= 20;
          if (/\\uFFFD/.test(trimmed)) score -= 20;
          if (/\\bhttps?:\\/\\//i.test(trimmed)) score += 20;
          if (/^[A-Za-z]+:\\/\\//.test(trimmed)) score += 10;
          if (/^[^=]+=[^&]+(&[^=]+=[^&]+)+$/.test(trimmed)) score += 15;
          if (/^\\s*(\\{|\\[)/.test(trimmed)) {
            try {
              JSON.parse(trimmed);
              score += 30;
            } catch {
              // ignore
            }
          }
          if (/[A-Za-z]{3,}/.test(trimmed)) score += 5;
          if (/\\s/.test(trimmed)) score += 5;
          if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length >= 16) score -= 15;
          const compact = stripWhitespace(trimmed);
          if (base64Alphabet.test(compact) && compact.length >= 16) score -= 10;
          score += Math.min(trimmed.length / 20, 10);
          return Math.max(score, 0);
        }

        function looksMeaningfulText(value) {
          if (!value) return false;
          const trimmed = value.trim();
          if (!trimmed) return false;
          if (/\\bhttps?:\\/\\//i.test(trimmed)) return true;
          if (/^[A-Za-z]+:\\/\\//.test(trimmed)) return true;
          if (/^[A-Z][-A-Za-z]+:/.test(trimmed)) return true;
          if (/^[^=]+=[^&]+(&[^=]+=[^&]+)+$/.test(trimmed)) return true;
          if (/^\\s*(\\{|\\[)/.test(trimmed)) {
            try {
              JSON.parse(trimmed);
              return true;
            } catch {
              // ignore
            }
          }
          if (/[A-Za-z]{3,}/.test(trimmed) && trimmed.length <= 24) return true;
          if (/\\s/.test(trimmed)) return true;
          return false;
        }

        function hasOctalEscapes(value) {
          if (!value) return false;
          const trimmed = value.trim();
          if (!trimmed) return false;
          let count = 0;
          for (let i = 0; i + 3 < trimmed.length; i++) {
            if (trimmed[i] !== '\\\\') continue;
            const c1 = trimmed.charCodeAt(i + 1);
            const c2 = trimmed.charCodeAt(i + 2);
            const c3 = trimmed.charCodeAt(i + 3);
            const isOct1 = c1 >= 48 && c1 <= 55;
            const isOct2 = c2 >= 48 && c2 <= 55;
            const isOct3 = c3 >= 48 && c3 <= 55;
            if (!isOct1 || !isOct2 || !isOct3) continue;
            count += 1;
            if (count >= 2) return true;
            i += 3;
          }
          return false;
        }

        function isUsefulDecodedOutput(value) {
          if (!value) return false;
          if (looksLikeBinary(value) || looksLikeOctal(value) || looksLikeDecimalBytes(value) || looksLikeHex(value)) return true;
          if (hasOctalEscapes(value)) return true;
          if (looksMeaningfulText(value)) return true;
          if (isLikelyEncoded(value)) return true;
          if (looksLikeHtmlEntities(value)) return true;
          if (/\\\\u[0-9a-fA-F]{4}/.test(value)) return true;
          return false;
        }

        function scoreDecodedCandidate(value) {
          if (!value) return 0;
          let score = scoreDecodedText(value);
          if (detectHash(value)) score += 35;
          if (looksLikeHex(value)) score += 20;
          if (looksLikeBinary(value)) score += 15;
          if (looksLikeOctal(value)) score += 15;
          if (looksLikeDecimalBytes(value)) score += 15;
          if (looksLikeQuotedPrintable(value)) score += 10;
          if (looksLikeAscii85(value)) score += 10;
          if (looksLikeUUencode(value)) score += 10;
          if (looksLikePunycode(value)) score += 8;
          if (looksLikeMorse(value)) score += 8;
          if (looksLikeUrlEncoded(value)) score += 10;
          if (looksLikeHtmlEntities(value)) score += 15;
          if (looksLikeBase32(value)) score += 12;
          if (looksLikeBase58(value)) score += 12;
          return score;
        }

        function scoreBase64Value(value) {
          const stripped = stripWhitespace(value);
          if (!base64Alphabet.test(stripped)) return null;
          const padded = padBase64(stripped);
          if (!padded) return null;
          const decoded = safeAtob(padded);
          if (decoded === null) return null;
          return scoreDecodedCandidate(decoded);
        }

        function scoreBase64UrlValue(value) {
          const stripped = stripWhitespace(value);
          if (!base64UrlAlphabet.test(stripped)) return null;
          const normalized = stripped.replace(/-/g, '+').replace(/_/g, '/');
          const padded = padBase64(normalized);
          if (!padded) return null;
          const decoded = safeAtob(padded);
          if (decoded === null) return null;
          return scoreDecodedCandidate(decoded);
        }

        function looksLikeHtmlEntities(value) {
          return /&[a-zA-Z]+;|&#x?[0-9a-fA-F]+;/.test(value);
        }

        function bestEncodedScore(value) {
          const scores = [scoreBase64Value(value), scoreBase64UrlValue(value)].filter((score) => score !== null);
          if (looksLikeJwt(value)) scores.push(70);
          if (looksLikeHex(value)) scores.push(70);
          if (looksLikeBinary(value)) scores.push(65);
          if (looksLikeOctal(value)) scores.push(60);
          if (looksLikeDecimalBytes(value)) scores.push(60);
          if (looksLikeQuotedPrintable(value)) scores.push(55);
          if (looksLikeAscii85(value)) scores.push(55);
          if (looksLikeUUencode(value)) scores.push(60);
          if (looksLikePunycode(value)) scores.push(50);
          if (looksLikeMorse(value)) scores.push(45);
          if (looksLikeUrlEncoded(value)) scores.push(50);
          if (looksLikeHtmlEntities(value)) scores.push(65);
          if (looksLikeBase32(value)) scores.push(60);
          if (looksLikeBase58(value)) scores.push(60);
          if (detectHash(value)) scores.push(85);
          if (!scores.length) return null;
          return Math.max(...scores);
        }

        function extractEmbeddedToken(value) {
          const trimmed = value.trim();
          if (!trimmed) return null;
          if (value.includes('|||')) return null;
          const baselineScore = scoreDecodedCandidate(trimmed);
          if (baselineScore >= 70 && !looksLikeJwt(trimmed)) return null;
          const candidates = [];
          findMatches(/[A-Za-z0-9_\\-]+\\.[A-Za-z0-9_\\-]+\\.[A-Za-z0-9_\\-]*/g, value, 16)
            .forEach((token) => candidates.push({ token, label: 'JWT', type: 'JWT' }));
          findMatches(/[A-Za-z0-9+/]{16,}={0,2}/g, value, 16)
            .forEach((token) => candidates.push({ token, label: 'Base64', type: 'Base64' }));
          findMatches(/[A-Za-z0-9_\\-]{16,}={0,2}/g, value, 16)
            .forEach((token) => candidates.push({ token, label: 'Base64URL', type: 'Base64URL' }));
          findMatches(/(?:[0-9a-fA-F]{2}){8,}/g, value, 16)
            .forEach((token) => candidates.push({ token, label: 'Hex', type: 'Hex' }));
          findMatches(/%[0-9a-fA-F]{2}(?:%[0-9a-fA-F]{2}){3,}/g, value, 12)
            .forEach((token) => candidates.push({ token, label: 'URL', type: 'URL' }));

          if (!candidates.length) return null;
          const scored = [];
          candidates.forEach((candidate) => {
            const decoded = decodeCandidateText(candidate);
            if (!decoded) return;
            const score = scoreDecodedCandidate(decoded);
            scored.push({ ...candidate, score });
          });
          if (!scored.length) return null;
          scored.sort((a, b) => b.score - a.score || b.token.length - a.token.length);
          let best = scored[0];
          if (best.score < 70) return null;
          if (best.score < baselineScore + 20) return null;
          if (best.token === trimmed) {
            const alternative = scored.find((item) => item.token !== trimmed && item.score >= Math.max(45, best.score + 5));
            if (alternative) {
              best = alternative;
            } else {
              return null;
            }
          }
          return { token: best.token, label: best.label, score: best.score };
        }

        function base64ToBytes(value) {
          const binary = atob(value);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          return bytes;
        }

        function decodeBytes(value) {
          const trimmed = value.trim();
          const base64Padded = padBase64(trimmed);
          if (base64Padded && base64Alphabet.test(stripWhitespace(trimmed))) {
            return base64ToBytes(base64Padded);
          }
          const normalizedUrl = trimmed.replace(/-/g, '+').replace(/_/g, '/');
          const base64UrlPadded = padBase64(normalizedUrl);
          if (base64UrlPadded && base64Alphabet.test(stripWhitespace(normalizedUrl))) {
            return base64ToBytes(base64UrlPadded);
          }
          if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0) {
            const bytes = new Uint8Array(trimmed.length / 2);
            for (let i = 0; i < trimmed.length; i += 2) {
              bytes[i / 2] = parseInt(trimmed.slice(i, i + 2), 16);
            }
            return bytes;
          }
          return null;
        }

        function stripPkcs7(bytes) {
          if (!bytes.length) return bytes;
          const pad = bytes[bytes.length - 1];
          if (pad < 1 || pad > 16) return bytes;
          for (let i = bytes.length - pad; i < bytes.length; i++) {
            if (bytes[i] !== pad) return bytes;
          }
          return bytes.slice(0, bytes.length - pad);
        }

        async function decryptAesPayload(cipherBytes, keyBytes, ivBytes) {
          const errors = [];
          const algorithms = [];
          if (ivBytes.length >= 12) algorithms.push({ name: 'AES-GCM', iv: ivBytes });
          if (ivBytes.length === 16) algorithms.push({ name: 'AES-CBC', iv: ivBytes });

          for (const algorithm of algorithms) {
            try {
              const key = await crypto.subtle.importKey('raw', keyBytes, algorithm.name, false, ['decrypt']);
              const decrypted = await crypto.subtle.decrypt({ name: algorithm.name, iv: algorithm.iv }, key, cipherBytes);
              let outputBytes = new Uint8Array(decrypted);
              if (algorithm.name === 'AES-CBC') {
                outputBytes = stripPkcs7(outputBytes);
              }
              return new TextDecoder().decode(outputBytes);
            } catch (error) {
              errors.push(algorithm.name + ': ' + (error && error.message ? error.message : 'decrypt failed'));
            }
          }

          throw new Error('AES decrypt failed (' + errors.join('; ') + ')');
        }

        const detectors = [
          /*
          {
            id: 'hash',
            label: 'Hash',
            description: 'One-way hash detected.',
            test: (value) => Boolean(detectHash(value)),
            decode: (value) => {
              const detected = detectHash(value);
              if (!detected) {
                throw new Error('No hash detected.');
              }
              const cleaned = stripWhitespace(value);
              const algorithm = detected.algorithm;
              const hashLength = detected.length;
              const match = detected.match;
              const message = match
                ? algorithm + ' hash detected. Found in rainbow table: \\'' + match + '\\'.'
                : algorithm + ' hash detected (not in rainbow table - irreversible).';
              return {
                output: cleaned,
                meta: {
                  type: 'hash',
                  algorithm,
                  hash: detected.hash,
                  display: cleaned,
                  match,
                  message
                },
                label: algorithm + ' Hash',
                description: 'This appears to be an ' + algorithm + ' hash (' + hashLength + ' hex characters). Hashes are one-way cryptographic functions and cannot be decoded. This encoding chain ends in a hash - further decoding is not possible.',
                halt: true
              };
            }
          },
          */
          {
            id: 'aes-split',
            label: 'AES Split (|||)',
            description: 'Detected delimiter-split AES payload.',
            test: (value) => value.includes('|||'),
            decode: async (value) => {
              const parts = value.split('|||').map((part) => part.trim()).filter(Boolean);
              if (parts.length < 3) {
                throw new Error('Expected cipher|||key|||iv format.');
              }
              const cipherBytes = decodeBytes(parts[0]);
              const keyBytes = decodeBytes(parts[1]);
              const ivBytes = decodeBytes(parts[2]);
              if (!cipherBytes || !keyBytes || !ivBytes) {
                throw new Error('Unable to decode cipher/key/iv bytes.');
              }
              if (![16, 24, 32].includes(keyBytes.length)) {
                throw new Error('Invalid AES key length: ' + keyBytes.length + ' bytes.');
              }
              return decryptAesPayload(cipherBytes, keyBytes, ivBytes);
            }
          },
          {
            id: 'jwt',
            label: 'JWT (JSON Web Token)',
            description: 'Detected three segments that decode into header, payload, and signature.',
            test: (value) => /^[A-Za-z0-9_\\-]+\\.[A-Za-z0-9_\\-]+\\.[A-Za-z0-9_\\-]*$/.test(value.trim()),
            decode: (value) => {
              const segments = value.trim().split('.');
              if (segments.length < 2) {
                throw new Error('JWT must have at least header and payload segments.');
              }
              const decodeSegment = (segment) => {
                const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
                const padded = normalized + '==='.slice((normalized.length + 3) % 4);
                const json = atob(padded);
                return JSON.parse(json);
              };
              const header = decodeSegment(segments[0]);
              const payload = decodeSegment(segments[1]);
              const meta = {
                type: 'jwt',
                header,
                payload,
                signature: segments[2] || ''
              };
              return { output: JSON.stringify(payload, null, 2), meta };
            }
          },
          {
            id: 'embedded-token',
            label: 'Embedded Token',
            description: 'Extracted a likely token from surrounding text.',
            test: (value) => {
              const candidate = extractEmbeddedToken(value);
              return Boolean(candidate && candidate.token);
            },
            decode: (value) => {
              const candidate = extractEmbeddedToken(value);
              if (!candidate) {
                throw new Error('No embedded token detected.');
              }
              return { output: candidate.token, meta: { type: 'embedded', tokenType: candidate.label, score: candidate.score } };
            }
          },
          {
            id: 'base64',
            label: 'Base64',
            description: 'Looks like padded ASCII-safe characters.',
            test: (value) => looksLikeBase64(value),
            decode: (value) => {
              const padded = padBase64(value);
              if (!padded) {
                throw new Error('Invalid Base64 length.');
              }
              const decoded = safeAtob(padded);
              if (decoded === null) {
                throw new Error('Invalid Base64 content.');
              }
              const hasNumericEncoding = looksLikeBinary(decoded)
                || looksLikeOctal(decoded)
                || looksLikeDecimalBytes(decoded)
                || looksLikeHex(decoded);
              if (!hasNumericEncoding && !looksMeaningfulText(decoded) && (bestEncodedScore(decoded) || 0) < 55) {
                throw new Error('Decoded Base64 content appears invalid.');
              }
              return decoded;
            }
          },
          {
            id: 'base64url',
            label: 'Base64URL',
            description: 'URL-safe Base64 alphabet detected.',
            test: (value) => looksLikeBase64Url(value),
            decode: (value) => {
              const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
              const padded = padBase64(normalized);
              if (!padded) {
                throw new Error('Invalid Base64URL length.');
              }
              const decoded = safeAtob(padded);
              if (decoded === null) {
                throw new Error('Invalid Base64URL content.');
              }
              const hasNumericEncoding = looksLikeBinary(decoded)
                || looksLikeOctal(decoded)
                || looksLikeDecimalBytes(decoded)
                || looksLikeHex(decoded);
              if (!hasNumericEncoding && !looksMeaningfulText(decoded) && (bestEncodedScore(decoded) || 0) < 55) {
                throw new Error('Decoded Base64URL content appears invalid.');
              }
              return decoded;
            }
          },
          {
            id: 'ascii85',
            label: 'ASCII85/Base85',
            description: 'Detected ASCII85/Base85 alphabet encoding.',
            test: (value) => looksLikeAscii85(value),
            decode: (value) => {
              const decoded = decodeAscii85(value);
              if (!isUsefulDecodedOutput(decoded)) {
                throw new Error('Decoded ASCII85 content appears invalid.');
              }
              return decoded;
            }
          },
          {
            id: 'base32',
            label: 'Base32',
            description: 'Detected RFC 4648 Base32 encoding.',
            test: (value) => looksLikeBase32(value),
            decode: (value) => {
              const decoded = decodeBase32(value);
              const hasNumericEncoding = looksLikeBinary(decoded)
                || looksLikeOctal(decoded)
                || looksLikeDecimalBytes(decoded)
                || looksLikeHex(decoded);
              if (!hasNumericEncoding && !looksMeaningfulText(decoded) && (bestEncodedScore(decoded) || 0) < 55) {
                throw new Error('Decoded Base32 content appears invalid.');
              }
              return decoded;
            }
          },
          {
            id: 'base58',
            label: 'Base58',
            description: 'Detected Base58 encoding (Bitcoin alphabet).',
            test: (value) => looksLikeBase58(value),
            decode: (value) => {
              const decoded = decodeBase58(value);
              const hasNumericEncoding = looksLikeBinary(decoded)
                || looksLikeOctal(decoded)
                || looksLikeDecimalBytes(decoded)
                || looksLikeHex(decoded);
              if (!hasNumericEncoding && !looksMeaningfulText(decoded) && (bestEncodedScore(decoded) || 0) < 55) {
                throw new Error('Decoded Base58 content appears invalid.');
              }
              return decoded;
            }
          },
          {
            id: 'url',
            label: 'URL Encoding',
            description: 'Contains percent-encoded bytes.',
            test: (value) => /%[0-9a-fA-F]{2}/.test(value),
            decode: (value) => decodeURIComponent(value)
          },
          {
            id: 'quoted-printable',
            label: 'Quoted-Printable',
            description: 'Detected =XX hex escapes and soft line breaks.',
            test: (value) => looksLikeQuotedPrintable(value),
            decode: (value) => {
              const decoded = decodeQuotedPrintable(value);
              if (!isUsefulDecodedOutput(decoded)) {
                throw new Error('Decoded quoted-printable content appears invalid.');
              }
              return decoded;
            }
          },
          {
            id: 'binary',
            label: 'Binary',
            description: 'Detected 8-bit binary byte sequences.',
            test: (value) => looksLikeBinary(value),
            decode: (value) => {
              const decoded = decodeBinary(value);
              if (!isUsefulDecodedOutput(decoded)) {
                throw new Error('Decoded binary content appears invalid.');
              }
              return decoded;
            }
          },
          {
            id: 'octal',
            label: 'Octal',
            description: 'Detected octal byte escapes.',
            test: (value) => looksLikeOctal(value),
            decode: (value) => {
              const decoded = decodeOctal(value);
              if (!isUsefulDecodedOutput(decoded)) {
                throw new Error('Decoded octal content appears invalid.');
              }
              return decoded;
            }
          },
          {
            id: 'decimal',
            label: 'Decimal Bytes',
            description: 'Detected decimal-encoded byte values.',
            test: (value) => looksLikeDecimalBytes(value),
            decode: (value) => {
              const decoded = decodeDecimalBytes(value);
              if (!isUsefulDecodedOutput(decoded)) {
                throw new Error('Decoded decimal bytes content appears invalid.');
              }
              return decoded;
            }
          },
          {
            id: 'uuencode',
            label: 'UUencode',
            description: 'Detected uuencode begin/end block.',
            test: (value) => looksLikeUUencode(value),
            decode: (value) => decodeUUencode(value)
          },
          {
            id: 'punycode',
            label: 'Punycode',
            description: 'Detected xn-- internationalized domain encoding.',
            test: (value) => looksLikePunycode(value),
            decode: (value) => decodePunycode(value)
          },
          {
            id: 'morse',
            label: 'Morse Code',
            description: 'Detected dot/dash Morse sequences.',
            test: (value) => looksLikeMorse(value),
            decode: (value) => decodeMorse(value)
          },
          {
            id: 'unicode',
            label: 'Unicode Escapes',
            description: 'Found \\\\uXXXX style escape sequences.',
            test: (value) => /\\\\u[0-9a-fA-F]{4}/.test(value),
            decode: (value) => value.replace(/\\\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
          },
          {
            id: 'html',
            label: 'HTML Entities',
            description: 'Detected &amp; or &#xNN; sequences.',
            test: (value) => /&[a-zA-Z]+;|&#x?[0-9a-fA-F]+;/.test(value),
            decode: (value) => {
              const decoded = htmlDecoder(value);
              if (!isUsefulDecodedOutput(decoded)) {
                throw new Error('Decoded HTML entities appear invalid.');
              }
              return decoded;
            }
          },
          {
            id: 'md5-hash',
            label: 'MD5 Hash',
            description: 'MD5 hash detected, attempting rainbow table lookup (static/dynamic/external).',
            hashAlgorithm: 'MD5',
            test: (value) => /^[a-f0-9]{32}$/i.test(value.trim())
              && !looksLikeBinary(value)
              && !looksLikeDecimalBytes(value)
              && !looksLikeOctal(value)
              && !looksLikeHexEncodedText(value),
            decode: async (value) => {
              const hash = normalizeHash(value);
              const result = await reverseHash(hash, 'MD5');
              if (!result) {
                throw new Error('MD5 hash not found in rainbow table (irreversible)');
              }
              const source = result.source || 'static';
              return {
                output: result.value,
                label: 'MD5 Hash (' + source.toUpperCase() + ')',
                description: 'MD5 hash reversed via ' + source + ' rainbow table.',
                meta: { type: 'hash-reversed', algorithm: 'MD5', hash, plaintext: result.value, source, success: true }
              };
            }
          },
          {
            id: 'sha1-hash',
            label: 'SHA1 Hash',
            description: 'SHA1 hash detected, attempting rainbow table lookup (static/dynamic/external).',
            hashAlgorithm: 'SHA1',
            test: (value) => /^[a-f0-9]{40}$/i.test(value.trim())
              && !looksLikeBinary(value)
              && !looksLikeDecimalBytes(value)
              && !looksLikeOctal(value)
              && !looksLikeHexEncodedText(value),
            decode: async (value) => {
              const hash = normalizeHash(value);
              const result = await reverseHash(hash, 'SHA1');
              if (!result) {
                throw new Error('SHA1 hash not found in rainbow table (irreversible)');
              }
              const source = result.source || 'static';
              return {
                output: result.value,
                label: 'SHA1 Hash (' + source.toUpperCase() + ')',
                description: 'SHA1 hash reversed via ' + source + ' rainbow table.',
                meta: { type: 'hash-reversed', algorithm: 'SHA1', hash, plaintext: result.value, source, success: true }
              };
            }
          },
          {
            id: 'sha256-hash',
            label: 'SHA256 Hash',
            description: 'SHA256 hash detected, attempting rainbow table lookup (static/dynamic/external).',
            hashAlgorithm: 'SHA256',
            test: (value) => /^[a-f0-9]{64}$/i.test(value.trim())
              && !looksLikeBinary(value)
              && !looksLikeDecimalBytes(value)
              && !looksLikeOctal(value)
              && !looksLikeHexEncodedText(value),
            decode: async (value) => {
              const hash = normalizeHash(value);
              const result = await reverseHash(hash, 'SHA256');
              if (!result) {
                throw new Error('SHA256 hash not found in rainbow table (irreversible)');
              }
              const source = result.source || 'static';
              return {
                output: result.value,
                label: 'SHA256 Hash (' + source.toUpperCase() + ')',
                description: 'SHA256 hash reversed via ' + source + ' rainbow table.',
                meta: { type: 'hash-reversed', algorithm: 'SHA256', hash, plaintext: result.value, source, success: true }
              };
            }
          },
          {
            id: 'sha512-hash',
            label: 'SHA512 Hash',
            description: 'SHA512 hash detected, attempting rainbow table lookup (static/dynamic/external).',
            hashAlgorithm: 'SHA512',
            test: (value) => /^[a-f0-9]{128}$/i.test(value.trim())
              && !looksLikeBinary(value)
              && !looksLikeDecimalBytes(value)
              && !looksLikeOctal(value)
              && !looksLikeHexEncodedText(value),
            decode: async (value) => {
              const hash = normalizeHash(value);
              const result = await reverseHash(hash, 'SHA512');
              if (!result) {
                throw new Error('SHA512 hash not found in rainbow table (irreversible)');
              }
              const source = result.source || 'static';
              return {
                output: result.value,
                label: 'SHA512 Hash (' + source.toUpperCase() + ')',
                description: 'SHA512 hash reversed via ' + source + ' rainbow table.',
                meta: { type: 'hash-reversed', algorithm: 'SHA512', hash, plaintext: result.value, source, success: true }
              };
            }
          },
          {
            id: 'hex',
            label: 'Hexadecimal',
            description: 'Even-length hex bytes detected.',
            test: (value) => {
              const stripped = stripWhitespace(value);
              if (isDictionaryWord(stripped)) return false;
              if (detectHash(stripped)) return false;
              if (looksLikeBinary(stripped) || looksLikeOctal(value) || looksLikeDecimalBytes(value)) return false;
              if (stripped.length < 8 || stripped.length % 2 !== 0) return false;
              return /^[0-9a-fA-F]+$/.test(stripped);
            },
            decode: (value) => {
              const stripped = stripWhitespace(value);
              const bytes = new Uint8Array(stripped.length / 2);
              for (let i = 0; i < stripped.length; i += 2) {
                bytes[i / 2] = parseInt(stripped.slice(i, i + 2), 16);
              }
              try {
                const decoded = new TextDecoder('utf-8').decode(bytes);
                if (!isUsefulDecodedOutput(decoded)) {
                  throw new Error('Decoded hex content appears invalid.');
                }
                return decoded;
              } catch {
                const decoded = new TextDecoder('utf-16').decode(bytes);
                if (!isUsefulDecodedOutput(decoded)) {
                  throw new Error('Decoded hex content appears invalid.');
                }
                return decoded;
              }
            }
          },
          {
            id: 'rot13',
            label: 'ROT13',
            description: 'ROT13 transformation exposes an encoded layer or readable text.',
            test: (value) => {
              const trimmed = value.trim();
              if (isDictionaryWord(trimmed)) return false;
              if (trimmed.length < 8) return false;
              if (!/[A-Za-z]/.test(trimmed)) return false;
              const rotated = rot13(trimmed);
              if (rotated === trimmed) return false;
              const rotatedEncodedScore = bestEncodedScore(rotated);
              const currentEncodedScore = bestEncodedScore(trimmed);
              if (rotatedEncodedScore !== null) {
                if (currentEncodedScore === null) return true;
                if (rotatedEncodedScore >= currentEncodedScore + 10) return true;
              }
              const rotatedTextScore = scoreDecodedText(rotated);
              const currentTextScore = scoreDecodedText(trimmed);
              if (rotatedTextScore >= currentTextScore + 15) return true;
              return false;
            },
            decode: (value) => rot13(value)
          },
          {
            id: 'rot47',
            label: 'ROT47',
            description: 'ROT47 transformation exposes an encoded layer.',
            test: (value) => looksLikeRot47(value),
            decode: (value) => rot47(value)
          },
          {
            id: 'reverse',
            label: 'Reverse',
            description: 'Reversed string appears to be encoded data or readable text.',
            test: (value) => {
              const trimmed = value.trim();
              if (isDictionaryWord(trimmed)) return false;
              if (trimmed.length < 8) return false;
              const reversed = reverseString(trimmed);
              if (reversed === trimmed) return false;
              if (/(?:\\\\[0-7]{3}){2,}/.test(trimmed) && !/^\\\\/.test(trimmed) && /^\\\\/.test(reversed)) return true;
              const reversedEncodedScore = bestEncodedScore(reversed);
              const currentEncodedScore = bestEncodedScore(trimmed);
              if (reversedEncodedScore !== null) {
                if (currentEncodedScore === null) return true;
                if (reversedEncodedScore >= currentEncodedScore + 10) return true;
              }
              const reversedTextScore = scoreDecodedText(reversed);
              const currentTextScore = scoreDecodedText(trimmed);
              if (reversedTextScore >= currentTextScore + 15) return true;
              const headerPattern = /^[A-Z][-A-Za-z]+:/;
              if (headerPattern.test(reversed) && !headerPattern.test(trimmed)) return true;
              return false;
            },
            decode: (value) => reverseString(value)
          }
        ];

        async function analyze() {
          const raw = inputEl.value;
          if (!raw.trim()) {
            renderResults({ steps: [], output: '', meta: [] });
            return;
          }

          statusMessage.textContent = _t('tools.universal-decoder.js.text0', 'Analyzing...');
          const start = performance.now();
          const { steps, output, meta } = await runPipeline(raw);
          const duration = Math.round(performance.now() - start);
          // Avoid template literals inside a back‑ticked script string
          if (steps.length) {
            statusMessage.textContent = '● DECODED ' + steps.length + ' LAYER(S) [' + duration + 'MS]';
          } else {
            statusMessage.textContent = _t('tools.universal-decoder.js.text2', '● IDLE [') + duration + 'MS]';
          }
          renderResults({ steps, output, meta });
        }

        async function runPipeline(value, maxIterations = 100) {
          const isSimMode = typeof location !== 'undefined' && location.search.includes('sim=1');
          const maxDepth = Math.min(maxIterations, isSimMode ? 18 : 14);
          const beamWidth = isSimMode ? 24 : 8;
          const maxExpansions = isSimMode ? 2800 : 420;
          const scoreCache = new Map();
          const decodeCache = new Map();
          const softTransformIds = new Set();
          const potentialBonusFactor = isSimMode ? 1.12 : 0.78;
          const terminalPotentialPenaltyFactor = isSimMode ? 0.92 : 0.45;

          const entropy = (raw) => {
            const sample = stripWhitespace(raw).slice(0, 2048);
            if (!sample) return 0;
            const counts = new Map();
            for (let i = 0; i < sample.length; i++) {
              const ch = sample[i];
              counts.set(ch, (counts.get(ch) || 0) + 1);
            }
            let h = 0;
            const len = sample.length;
            for (const count of counts.values()) {
              const p = count / len;
              h -= p * Math.log2(p);
            }
            return h;
          };

          const valueScore = (raw, depth) => {
            const key = depth + '|' + raw;
            const cached = scoreCache.get(key);
            if (cached !== undefined) return cached;
            const decoded = scoreDecodedText(raw);
            let potential = bestEncodedScore(raw) || 0;
            if (hasOctalEscapes(raw)) potential = Math.max(potential, 60);
            const h = entropy(raw);
            const depthPenalty = depth * 2.4;
            const entropyPenalty = h > 4.6 ? (h - 4.6) * 11 : 0;
            const size = stripWhitespace(raw).length;
            const sizePenalty = size > 8000 ? (size - 8000) / 400 : 0;
            const potentialBonus = Math.min(potential, 85) * potentialBonusFactor;
            const meaningfulBonus = looksMeaningfulText(raw) ? 10 : 0;
            const score = decoded + meaningfulBonus + potentialBonus - depthPenalty - entropyPenalty - sizePenalty;
            scoreCache.set(key, score);
            return score;
          };

          const terminalScore = (raw, depth) => {
            const decoded = scoreDecodedText(raw);
            let potential = bestEncodedScore(raw) || 0;
            if (hasOctalEscapes(raw)) potential = Math.max(potential, 60);
            const h = entropy(raw);
            const depthPenalty = depth * 1.8;
            const entropyPenalty = h > 4.6 ? (h - 4.6) * 7 : 0;
            const potentialPenalty = potential ? Math.min(potential, 85) * terminalPotentialPenaltyFactor : 0;
            let densePenalty = 0;
            const compact = stripWhitespace(raw);
            if (compact.length >= 24 && !/\\s/.test(raw)) {
              let asciiToken = true;
              for (let i = 0; i < compact.length; i++) {
                const code = compact.charCodeAt(i);
                const isAlphaNum = (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
                const isSymbol = code === 45 || code === 95 || code === 43 || code === 47 || code === 61;
                if (!isAlphaNum && !isSymbol) {
                  asciiToken = false;
                  break;
                }
              }
              if (asciiToken) densePenalty = 45;
            }
            const meaningfulBonus = looksMeaningfulText(raw) ? 15 : 0;
            return decoded + meaningfulBonus - depthPenalty - entropyPenalty - potentialPenalty - densePenalty;
          };

          const startState = {
            value,
            steps: [],
            meta: [],
            depth: 0,
            seen: new Set([value])
          };

          const finished = [];
          let frontier = [startState];
          let expansions = 0;

          for (let depth = 0; depth < maxDepth; depth++) {
            const nextStates = [];

            for (const state of frontier) {
              if (expansions >= maxExpansions) break;

              const current = state.value;
              let matchedAny = false;

              for (const detector of detectors) {
                let passesTest = false;
                try {
                  passesTest = Boolean(detector.test(current));
                } catch {
                  passesTest = false;
                }

                if (!passesTest) continue;

                matchedAny = true;
                if (expansions >= maxExpansions) break;
                expansions += 1;

                const cacheKey = detector.id + '\\n' + current;
                let cached = decodeCache.get(cacheKey);
                if (cached === undefined) {
                  try {
                    cached = { ok: true, result: await detector.decode(current) };
                  } catch (error) {
                    cached = { ok: false, error };
                  }
                  decodeCache.set(cacheKey, cached);
                }

                if (!cached.ok) {
                  if (detector.hashAlgorithm) {
                    const hash = normalizeHash(current);
                    const externalEnabled = localStorage.getItem(RAINBOW_EXTERNAL_TOGGLE_KEY) === 'true';
                    const errorMessage = externalEnabled
                      ? 'Not in rainbow table - add a custom entry or try external lookups.'
                      : 'Not in rainbow table - add a custom entry or enable external API lookups.';
                    const errorMeta = {
                      type: 'hash-lookup',
                      algorithm: detector.hashAlgorithm,
                      hash,
                      success: false,
                      error: errorMessage
                    };

                    const steps = state.steps.slice();
                    const meta = state.meta.slice();
                    meta.push(errorMeta);
                    steps.push({
                      label: detector.hashAlgorithm + ' Hash (Not Reversed)',
                      description: '⚠️ ' + detector.hashAlgorithm + ' hash detected but not found in rainbow table. ' + errorMessage,
                      preview: 'Hash: ' + hash.substring(0, 16) + '...',
                      meta: errorMeta
                    });
                    return { steps, output: current, meta };
                  }
                  continue;
                }

                const result = cached.result;
                const isObject = result && typeof result === 'object';
                const nextValue = typeof result === 'string' ? result : result.output;
                const nextText = nextValue ?? '';
                if (nextText === current) continue;
                if (state.seen.has(nextText)) continue;

                const stepMeta = isObject && result.meta ? result.meta : null;
                const stepLabel = isObject && result.label ? result.label : detector.label;
                const stepDescription = isObject && result.description ? result.description : detector.description;
                const stepPreview = isObject && result.preview ? result.preview : summarize(nextText);

                const steps = state.steps.slice();
                steps.push({
                  label: stepLabel,
                  description: stepDescription,
                  preview: stepPreview,
                  meta: stepMeta
                });

                const meta = state.meta.slice();
                if (stepMeta) meta.push(stepMeta);

                const nextSeen = new Set(state.seen);
                nextSeen.add(nextText);

                const nextDepth = state.depth + 1;
                const candidate = {
                  value: nextText,
                  steps,
                  meta,
                  depth: nextDepth,
                  seen: nextSeen,
                  halt: Boolean(isObject && result.halt)
                };

                const vScore = valueScore(nextText, nextDepth);
                candidate.score = vScore;
                if (candidate.halt || nextDepth >= maxDepth) {
                  candidate.terminalScore = terminalScore(nextText, nextDepth);
                  finished.push(candidate);
                } else {
                  nextStates.push(candidate);
                }
              }

              if (!matchedAny) {
                const terminal = { ...state };
                terminal.terminalScore = terminalScore(current, state.depth);
                finished.push(terminal);
              }
            }

            if (nextStates.length === 0) break;

            nextStates.sort((a, b) => b.score - a.score);
            const unique = new Map();
            for (const s of nextStates) {
              if (unique.has(s.value)) continue;
              unique.set(s.value, s);
              if (unique.size >= beamWidth) break;
            }
            frontier = Array.from(unique.values()).filter((s) => !s.halt);
            if (frontier.length === 0) break;
          }

          let best = null;
          for (const state of finished) {
            if (best === null || state.terminalScore > best.terminalScore) best = state;
          }

          if (best) {
            return { steps: best.steps, output: best.value, meta: best.meta };
          }

          frontier.sort((a, b) => terminalScore(b.value, b.depth) - terminalScore(a.value, a.depth));
          const fallback = frontier[0] || startState;
          return { steps: fallback.steps, output: fallback.value, meta: fallback.meta };
        }

        function summarize(value) {
          if (!value) return '(empty)';
          const sanitized = value.replace(/[\\s\\u200B\\u200C\\u200D\\uFEFF]+/g, ' ').trim();
          return sanitized.length > 140 ? sanitized.slice(0, 140) + '…' : sanitized;
        }

        function inferFormat(value) {
          const trimmed = value.trim();
          if (!trimmed) return { label: 'Empty', parsed: null };

          const hash = detectHash(trimmed);
          if (hash) {
            return { label: hash.algorithm + ' Hash', parsed: hash };
          }

          if (/^\\{[\\s\\S]*\\}$|^\\[[\\s\\S]*\\]$/.test(trimmed)) {
            try {
              const parsed = JSON.parse(trimmed);
              return { label: Array.isArray(parsed) ? 'JSON Array' : 'JSON Object', parsed };
            } catch {
              // ignore
            }
          }

          if (/^[A-Za-z]+:\\/\\//.test(trimmed)) {
            try {
              const parsedUrl = new URL(trimmed);
              return { label: 'URL', parsed: parsedUrl };
            } catch {
              // ignore
            }
          }

          if (/^[^=]+=.+(&[^=]+=.+)+/.test(trimmed)) {
            return { label: 'Query String', parsed: trimmed };
          }

          return { label: 'Text', parsed: null };
        }

        function renderResults(result) {
          const { steps, output, meta } = result;
          finalOutputEl.value = output || '';
          layerCountEl.textContent = steps.length;
          byteLengthEl.textContent = new TextEncoder().encode(output).length + ' BYTES';

          const format = inferFormat(output);
          finalFormatEl.textContent = format.label.toUpperCase();
          confidenceBadge.textContent = steps.length >= 3 ? 'HIGH' : steps.length === 2 ? 'MEDIUM' : steps.length === 1 ? 'LOW' : 'UNKNOWN';
          confidenceBadge.className = 'px-3 py-1 text-xs font-semibold rounded border ' + (
            steps.length >= 3
              ? 'bg-success-50 border-success-200 text-success-700 dark:bg-success-900/20 dark:border-success-800 dark:text-success-300'
              : 'bg-warning-50 border-warning-200 text-warning-700 dark:bg-warning-900/20 dark:border-warning-800 dark:text-warning-300'
          );

          // Keep query params panel stable (avoid parse/runtime issues).
          queryParamsEl.innerHTML = '<p class="text-surface-500 dark:text-surface-400 italic">No query string detected.</p>';
        }

        analyzeBtn.addEventListener('click', () => void analyze());
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(finalOutputEl.value || '').then(() => {
            const original = copyBtn.textContent;
            copyBtn.textContent = _t('tools.universal-decoder.js.text6', '✓ COPIED');
            if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
            setTimeout(() => copyBtn.textContent = original, 1500);
          });
        });
        downloadBtn.addEventListener('click', () => {
          const blob = new Blob([finalOutputEl.value || ''], { type: 'text/plain' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'decoded.txt';
          link.click();
          URL.revokeObjectURL(link.href);
        });

        document.querySelectorAll('.sample-btn').forEach((button) => {
          button.addEventListener('click', () => {
            inputEl.value = button.getAttribute('data-sample') || '';
            void analyze();
          });
        });

        let errorTimer = null;

        function showError(message) {
          if (!errorBanner) return;
          errorBanner.textContent = message;
          errorBanner.classList.remove('hidden');
          if (errorTimer) clearTimeout(errorTimer);
          errorTimer = setTimeout(() => errorBanner.classList.add('hidden'), 4000);
        }

        function addCustomEntry() {
          if (!customHashInput || !customValueInput) return;
          const result = isSupportedHash(customHashInput.value);
          if (!result) {
            showError('Enter a supported hex hash (MD5, SHA1, SHA256, or SHA512).');
            return;
          }
          const value = customValueInput.value.trim();
          if (!value) {
            showError('Provide a value to map to the hash.');
            return;
          }

          storeCustomEntry(result.hash, value);
          customHashInput.value = '';
          customValueInput.value = '';
          if (errorBanner) {
            errorBanner.classList.add('hidden');
          }
          if (inputEl.value.trim()) {
            void analyze();
          }
        }

        if (externalApiToggle) {
          externalApiToggle.checked = localStorage.getItem(RAINBOW_EXTERNAL_TOGGLE_KEY) === 'true';
          externalApiToggle.addEventListener('change', () => {
            localStorage.setItem(RAINBOW_EXTERNAL_TOGGLE_KEY, externalApiToggle.checked ? 'true' : 'false');
          });
        }

        if (addCustomButton) {
          addCustomButton.addEventListener('click', addCustomEntry);
        }

        if (location.search.includes('sim=1')) {
          window.__decoderSim = {
            runPipeline,
            md5,
            debugBase64: (value) => {
              const stripped = stripWhitespace(value);
              const padded = padBase64(stripped);
              const decoded = padded ? safeAtob(padded) : null;
              if (decoded === null) {
                return { stripped, padded, decoded: null, decodedScore: null, hasNumericEncoding: null, minScore: null };
              }
              const decodedScore = scoreDecodedCandidate(decoded);
              const decodedTextScore = scoreDecodedText(decoded);
              const hasNumericEncoding = looksLikeBinary(decoded)
                || looksLikeOctal(decoded)
                || looksLikeDecimalBytes(decoded)
                || looksLikeHex(decoded);
              const minScore = stripped.length < 8 ? 70 : stripped.length < 16 ? 80 : 60;
              return { stripped, padded, decoded, decodedScore, decodedTextScore, hasNumericEncoding, minScore };
            }
            ,
            debugDetectors: async (value) => {
              const out = [];
              for (const detector of detectors) {
                let matches = false;
                try {
                  matches = Boolean(detector.test(value));
                } catch (e) {
                  out.push({ id: detector.id, matches: false, ok: false, error: String(e && e.message ? e.message : e) });
                  continue;
                }
                if (!matches) continue;
                try {
                  const result = await detector.decode(value);
                  const nextValue = typeof result === 'string' ? result : result.output;
                  out.push({ id: detector.id, matches: true, ok: true, preview: summarize(String(nextValue ?? '')).slice(0, 140) });
                } catch (e) {
                  out.push({ id: detector.id, matches: true, ok: false, error: String(e && e.message ? e.message : e) });
                }
              }
              return out;
            },
            debugIsUseful: (value) => {
              try {
                return Boolean(isUsefulDecodedOutput(value));
              } catch (e) {
                return { error: String(e && e.message ? e.message : e) };
              }
            },
            debugHexDecode: (value) => {
              const stripped = stripWhitespace(value);
              const bytes = new Uint8Array(stripped.length / 2);
              for (let i = 0; i < stripped.length; i += 2) {
                bytes[i / 2] = parseInt(stripped.slice(i, i + 2), 16);
              }
              const utf8 = new TextDecoder('utf-8').decode(bytes);
              const utf16 = new TextDecoder('utf-16').decode(bytes);
              return { utf8Preview: utf8.slice(0, 80), utf16Preview: utf16.slice(0, 80) };
            }
          };
        }

        let debounceTimer = null;
        inputEl.addEventListener('input', () => {
          if (!liveToggle.checked) return;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => void analyze(), 250);
        });

        void analyze();
      })();
    </script>
  `;

  const html = createPageTemplate({
    title: 'Layered Decoder',
    description: 'Automatically detect Base64, URL encoding, JWTs, and other layers. Decode complex payloads client-side.',
    path: '/universal-decoder',
    content,
    scripts
  });

  return respondHTML(html);
}
