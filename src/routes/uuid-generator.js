/**
 * UUID/GUID Generator Tool
 * Generate various types of UUIDs/GUIDs
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';

export async function handleUUIDGeneratorRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === '/uuid-generator' || pathname === '/uuid-generator/') {
      if (method === 'GET') {
        return renderUUIDGeneratorPage();
      }
    }

    return respondJSON({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('UUID Generator Route Error:', error);
    return respondJSON(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function renderUUIDGeneratorPage() {
  const toolHeader = createToolHeader(
    { emoji: '🔑' },
    'UUID Generator',
    'Generate unique identifiers instantly (UUID v4, v1, NIL, GUID)',
    [{ text: 'Bulk Generation', color: 'purple', tooltip: 'Generate multiple UUIDs or GUIDs at once without any network requests.' }],
    { toolId: 'uuid-generator' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">

        ${toolHeader}

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Controls Column -->
          <div class="lg:col-span-1 space-y-6">
            <!-- UUID Type Selection -->
            <div>
              <label for="uuid-version" class="label"><span data-i18n="tools.uuid-generator.ui.label1">UUID Version</span></label>
              <select id="uuid-version" class="input" data-tooltip="v4 is random and most common. v1 is time-based.">
                <option value="v4" selected data-i18n="tools.uuid-generator.ui.option5">UUID v4 (Random)</option>
                <option value="v1" data-i18n="tools.uuid-generator.ui.option6">UUID v1 (Timestamp)</option>
                <option value="nil" data-i18n="tools.uuid-generator.ui.option7">NIL UUID (All zeros)</option>
                <option value="guid" data-i18n="tools.uuid-generator.ui.option8">GUID (Microsoft)</option>
              </select>
              <p id="version-desc" class="text-xs text-surface-500 dark:text-surface-400 mt-2" data-i18n="tools.uuid-generator.ui.desc10">
                Cryptographically strong random UUID
              </p>
            </div>

            <!-- Quantity -->
            <div>
              <label for="quantity" class="label">
                Quantity: <span id="quantity-value" class="font-bold text-primary-600 dark:text-primary-400">1</span>
              </label>
              <input type="range" id="quantity" min="1" data-tooltip="Generate multiple UUIDs at once (up to 100)" max="100" value="1" class="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-600">
            </div>

            <!-- Format Options -->
            <div>
              <label class="label"><span data-i18n="tools.uuid-generator.ui.label2">Format</span></label>
              <div class="space-y-3">
                <label class="flex items-center space-x-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700">
                  <input type="radio" name="format" value="hyphenated" checked class="w-4 h-4 text-primary-600 focus:ring-primary-500">
                  <span class="text-sm font-medium text-surface-900 dark:text-surface-100" data-i18n="tools.uuid-generator.ui.desc11">Hyphenated</span>
                </label>
                <label class="flex items-center space-x-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700">
                  <input type="radio" name="format" value="plain" class="w-4 h-4 text-primary-600 focus:ring-primary-500">
                  <span class="text-sm font-medium text-surface-900 dark:text-surface-100" data-i18n="tools.uuid-generator.ui.desc12">Plain (no hyphens)</span>
                </label>
                <label class="flex items-center space-x-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700">
                  <input type="radio" name="format" value="uppercase" class="w-4 h-4 text-primary-600 focus:ring-primary-500">
                  <span class="text-sm font-medium text-surface-900 dark:text-surface-100" data-i18n="tools.uuid-generator.ui.desc13">Uppercase</span>
                </label>
                <label class="flex items-center space-x-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700">
                  <input type="radio" name="format" value="braces" class="w-4 h-4 text-primary-600 focus:ring-primary-500">
                  <span class="text-sm font-medium text-surface-900 dark:text-surface-100" data-i18n="tools.uuid-generator.ui.desc14">With braces {}</span>
                </label>
              </div>
            </div>

            <!-- Generate Button -->
            <button id="generate-btn" class="btn btn-primary" data-tooltip="Generate new UUID(s) using crypto.getRandomValues()" w-full py-3 text-lg">
              <span data-i18n="tools.uuid-generator.ui.button0">Generate UUID</span>
            </button>
          </div>

          <!-- Results Column -->
          <div class="lg:col-span-2">
            <div id="result" class="hidden h-full flex flex-col">
              <div class="flex items-center justify-between mb-2">
                <label class="label"><span data-i18n="tools.uuid-generator.ui.label3">Generated UUID(s)</span></label>
                <button id="copy-btn" class="btn btn-secondary text-xs py-1 px-3">
                  <span class="material-symbols-rounded text-sm" data-i18n="tools.uuid-generator.ui.desc15">content_copy</span> Copy All
                </button>
              </div>
              <div id="uuid-output" class="flex-grow p-4 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg font-mono text-sm max-h-[600px] overflow-y-auto space-y-1"></div>
            </div>
            
            <!-- Placeholder State -->
            <div id="placeholder" class="h-full flex flex-col items-center justify-center p-8 text-center text-surface-400 border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-xl">
               <span class="material-symbols-rounded text-6xl mb-4">manufacturing</span>
               <p>Click "Generate UUID" to start</p>
            </div>
          </div>

        </div>

        <!-- Info -->
        <div class="mt-8 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-lg">
          <h2 class="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-2" data-i18n="tools.uuid-generator.ui.heading9">ℹ️ About UUID Versions</h2>
          <div class="text-sm text-surface-700 dark:text-surface-300 space-y-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <p><strong>UUID v4:</strong> Randomly generated, 122 bits of randomness. Best for most use cases.</p>
            <p><strong>UUID v1:</strong> Time-based with MAC address. Sortable but may reveal system info.</p>
            <p><strong>NIL UUID:</strong> All zeros (0000...). Used as null/empty value.</p>
            <p><strong>GUID:</strong> Globally Unique Identifier, Microsoft's UUID implementation.</p>
          </div>
        </div>

      </div>
    </main>
  `;

  const script = `
    <script>
      const versionSelect = document.getElementById('uuid-version');
      const versionDesc = document.getElementById('version-desc');
      const quantitySlider = document.getElementById('quantity');
      const quantityValue = document.getElementById('quantity-value');
      const resultDiv = document.getElementById('result');
      const placeholderDiv = document.getElementById('placeholder');
      const uuidOutput = document.getElementById('uuid-output');

      const descriptions = {
        v4: 'Cryptographically strong random UUID',
        v1: 'Timestamp-based UUID with system info',
        nil: 'All-zero UUID used as null value',
        guid: 'Microsoft GUID format (uppercase with braces)'
      };

      versionSelect.addEventListener('change', () => {
        versionDesc.textContent = descriptions[versionSelect.value];
      });

      quantitySlider.addEventListener('input', (e) => {
        quantityValue.textContent = e.target.value;
      });

      // UUID v4 Generator (cryptographically secure)
      function generateUUIDv4() {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);

        // Set version (4) and variant bits according to RFC4122
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

        // Convert bytes to hex string with hyphens
        const hexArray = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
        return [
          hexArray.slice(0, 4).join(''),
          hexArray.slice(4, 6).join(''),
          hexArray.slice(6, 8).join(''),
          hexArray.slice(8, 10).join(''),
          hexArray.slice(10, 16).join('')
        ].join('-');
      }

      // UUID v1 Generator (timestamp-based with cryptographically secure random components)
      function generateUUIDv1() {
        const now = Date.now();
        const timestamp = now * 10000 + 122192928000000000; // UUID epoch

        const timeLow = (timestamp & 0xFFFFFFFF).toString(16).padStart(8, '0');
        const timeMid = ((timestamp >> 32) & 0xFFFF).toString(16).padStart(4, '0');
        const timeHi = (((timestamp >> 48) & 0x0FFF) | 0x1000).toString(16).padStart(4, '0');

        // Use crypto.getRandomValues for clock sequence and node
        const randomBytes = new Uint8Array(8);
        crypto.getRandomValues(randomBytes);

        // Clock sequence: 14 bits with variant bits set
        const clockSeqLow = randomBytes[0];
        const clockSeqHi = (randomBytes[1] & 0x3f) | 0x80; // Variant 10
        const clockSeq = ((clockSeqHi << 8) | clockSeqLow).toString(16).padStart(4, '0');

        // Node: 48 bits (6 bytes)
        const node = Array.from(randomBytes.slice(2, 8), b => b.toString(16).padStart(2, '0')).join('');

        return \`\${timeLow}-\${timeMid}-\${timeHi}-\${clockSeq}-\${node}\`;
      }

      // NIL UUID
      function generateNIL() {
        return '00000000-0000-0000-0000-000000000000';
      }

      // Format UUID
      function formatUUID(uuid, format) {
        switch (format) {
          case 'plain':
            return uuid.replace(/-/g, '');
          case 'uppercase':
            return uuid.toUpperCase();
          case 'braces':
            return '{' + uuid + '}';
          default:
            return uuid;
        }
      }

      document.getElementById('generate-btn').addEventListener('click', () => {
        const version = versionSelect.value;
        const quantity = parseInt(quantitySlider.value);
        const format = document.querySelector('input[name="format"]:checked').value;

        const uuids = [];
        for (let i = 0; i < quantity; i++) {
          let uuid;

          if (version === 'v4' || version === 'guid') {
            uuid = generateUUIDv4();
          } else if (version === 'v1') {
            uuid = generateUUIDv1();
          } else if (version === 'nil') {
            uuid = generateNIL();
          }

          if (version === 'guid') {
            uuid = '{' + uuid.toUpperCase() + '}';
          } else {
            uuid = formatUUID(uuid, format);
          }

          uuids.push(uuid);
        }

        uuidOutput.innerHTML = uuids.map(uuid =>
          \`<div class="uuid-item text-surface-900 dark:text-surface-100 hover:bg-surface-200 dark:hover:bg-surface-800 p-2 rounded cursor-pointer transition-colors" data-uuid="\${uuid}">\${uuid}</div>\`
        ).join('');

        resultDiv.classList.remove('hidden');
        placeholderDiv.classList.add('hidden');
      });

      // Event delegation for clicking UUID items
      uuidOutput.addEventListener('click', async (e) => {
        const uuidItem = e.target.closest('.uuid-item');
        if (uuidItem) {
          const text = uuidItem.dataset.uuid;
          if(window.copyToClipboard) {
             window.copyToClipboard(text, uuidItem);
          } else {
             await navigator.clipboard.writeText(text);
             // Fallback visual feedback
             const original = uuidItem.textContent;
             uuidItem.textContent = _t('tools.uuid-generator.js.text0', '✓ Copied!');
             uuidItem.classList.add('text-green-600', 'font-bold');
             setTimeout(() => {
                uuidItem.textContent = original;
                uuidItem.classList.remove('text-green-600', 'font-bold');
             }, 1000);
          }
        }
      });

      document.getElementById('copy-btn').addEventListener('click', async () => {
        const allUUIDs = Array.from(uuidOutput.children).map(div => div.textContent.trim()).join('\\n');
        if(window.copyToClipboard) {
            window.copyToClipboard(allUUIDs, document.getElementById('copy-btn'));
        } else {
            await navigator.clipboard.writeText(allUUIDs);
        }
      });
    </script>
  `;

  return respondHTML(createPageTemplate({
    title: 'UUID Generator',
    description: 'Generate UUIDs (v1, v4), GUIDs, and NIL UUIDs with bulk generation support.',
    path: '/uuid-generator',
    content,
    scripts: script
  }));
}
