/**
 * UUID/GUID Generator Tool
 * Generate various types of UUIDs/GUIDs
 */

import { respondHTML, respondJSON } from "../utils/respond.js";
import { createPageTemplate, createToolHeader } from "../utils/common-ui.js";
import {
  createEducationalSection,
  createRelatedToolsSection,
} from "../utils/content-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";
import { createUuidLogic } from "../utils/uuid-generator-logic.js";

export async function handleUUIDGeneratorRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === "/uuid-generator" || pathname === "/uuid-generator/") {
      if (method === "GET") {
        return renderUUIDGeneratorPage(resolveRequestLanguage(request, url));
      }
    }

    return respondJSON({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("UUID Generator Route Error:", error);
    return respondJSON(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    );
  }
}

function renderUUIDGeneratorPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("uuid-generator", currentLang);
  const toolHeader = createToolHeader(
    { emoji: "🔑" },
    translation?.name || "UUID Generator",
    translation?.desc ||
      "Generate unique identifiers instantly (UUID v4, v7, v1, NIL, GUID)",
    [
      {
        text: translation?.ui?.badge16 || "Bulk Generation",
        color: "purple",
        tooltip:
          "Generate multiple UUIDs or GUIDs at once without any network requests.",
        tooltipI18nKey: "tools.uuid-generator.ui.r65_0",
      },
    ],
    { toolId: "uuid-generator" },
  );

  const currentTool = TOOLS.find((t) => t.id === "uuid-generator");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];
  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">

        ${toolHeader}

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Controls Column -->
          <div class="lg:col-span-1 space-y-6">
            <!-- UUID Type Selection -->
            <div>
              <label for="uuid-version" class="label"><span data-i18n="tools.uuid-generator.ui.label1">UUID Version</span></label>
              <select id="uuid-version" class="input" data-tooltip="v4 is random. v7 is time-sortable. v1 is legacy time-based." data-i18n-tooltip="tools.uuid-generator.ui.r65_1">
                <option value="v4" selected data-i18n="tools.uuid-generator.ui.option5">UUID v4 (Random)</option>
                <option value="v7" data-i18n="tools.uuid-generator.ui.optionV7">UUID v7 (Unix time, RFC 9562)</option>
                <option value="v1" data-i18n="tools.uuid-generator.ui.option6">UUID v1 (Timestamp)</option>
                <option value="nil" data-i18n="tools.uuid-generator.ui.option7">NIL UUID (All zeros)</option>
              </select>
              <p id="version-desc" class="text-xs text-surface-500 dark:text-surface-400 mt-2" data-i18n="tools.uuid-generator.ui.desc10">
                Cryptographically strong random UUID
              </p>
            </div>

            <!-- Quantity -->
            <div>
              <label data-i18n-html="tools.uuid-generator.ui.r6_0" for="quantity" class="label">
                Quantity: <span id="quantity-value" class="font-bold text-primary-600 dark:text-primary-400">1</span>
              </label>
              <input type="range" id="quantity" min="1" data-tooltip="Generate multiple UUIDs at once (up to 100)" data-i18n-tooltip="tools.uuid-generator.ui.r65_2" max="100" value="1" class="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-600">
            </div>

            <!-- Format Options -->
            <div>
              <label class="label"><span data-i18n="tools.uuid-generator.ui.label2">Format</span></label>
              <div class="space-y-3">
                <label class="flex items-center space-x-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700">
                  <input type="radio" name="format" value="hyphenated" checked class="w-4 h-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500">
                  <span class="text-sm font-medium text-surface-900 dark:text-surface-100" data-i18n="tools.uuid-generator.ui.desc11">Hyphenated</span>
                </label>
                <label class="flex items-center space-x-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700">
                  <input type="radio" name="format" value="plain" class="w-4 h-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500">
                  <span class="text-sm font-medium text-surface-900 dark:text-surface-100" data-i18n="tools.uuid-generator.ui.desc12">Plain (no hyphens)</span>
                </label>
                <label class="flex items-center space-x-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700">
                  <input type="radio" name="format" value="uppercase" class="w-4 h-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500">
                  <span class="text-sm font-medium text-surface-900 dark:text-surface-100" data-i18n="tools.uuid-generator.ui.desc13">Uppercase</span>
                </label>
                <label class="flex items-center space-x-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700">
                  <input type="radio" name="format" value="braces" class="w-4 h-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500">
                  <span class="text-sm font-medium text-surface-900 dark:text-surface-100" data-i18n="tools.uuid-generator.ui.desc14">With braces {}</span>
                </label>
              </div>
              <p data-i18n-html="tools.uuid-generator.ui.r6_1" class="text-xs text-surface-500 dark:text-surface-400 mt-2">Tip: A Microsoft GUID is a UUID v4 with <code>{}</code> braces — select UUID v4 + 'With braces {}' format.</p>
            </div>

            <!-- Generate Button -->
            <button id="generate-btn" class="btn btn-primary w-full">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              <span data-i18n="tools.uuid-generator.ui.button0">Generate</span>
            </button>
          </div>

          <!-- Results Column -->
          <div class="lg:col-span-2">
            <div id="placeholder" class="flex flex-col items-center justify-center py-16 text-surface-500 dark:text-surface-400">
              <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
              <p class="text-sm" data-i18n="tools.uuid-generator.ui.text0">Click Generate to create UUIDs</p>
            </div>
            <div id="result" class="hidden">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-300" data-i18n="tools.uuid-generator.ui.heading0">Generated UUIDs</h2>
                <button id="copy-btn" class="btn btn-ghost text-xs">
                  <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  <span data-i18n="tools.uuid-generator.ui.button1">Copy All</span>
                </button>
              </div>
              <div id="uuid-output" class="font-mono text-sm space-y-1 max-h-96 overflow-y-auto bg-surface-50 dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700"></div>
            </div>
          </div>
        </div>

        ${createEducationalSection(
          [
            {
              title: "What is a UUID?",
              content:
                "A Universally Unique Identifier (UUID) is a 128-bit number used to uniquely identify information in computer systems. They are designed to be generated independently without a central authority while maintaining a negligible probability of collision.",
            },
            {
              title: "How to Use This Tool",
              content:
                'Select the UUID version (v1 for time-based, v4 for random) and the number of IDs you need. Click "Generate" to create a list of unique identifiers ready for use in your database or application.',
            },
            {
              title: "Common Use Cases",
              content:
                "Primary keys in distributed databases, session identifiers, transaction tracking, and naming temporary files or resources where uniqueness is critical across multiple systems.",
            },
            {
              title: "Pro Tips",
              content:
                "UUID v4 is the most common choice for general-purpose unique IDs because it relies on high-quality randomness. Use v7 if you need IDs that sort by creation time.",
            },
          ],
          "uuid-generator",
          currentLang,
        )}
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">${createRelatedToolsSection(relatedToolsData)}</div>
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
        v7: 'Unix-time sortable UUID (RFC 9562)',
        v1: 'Timestamp-based UUID with a random node (not a MAC address)',
        nil: 'All-zero UUID used as null value'
      };

      if (versionSelect) versionSelect.addEventListener('change', () => {
        if (versionDesc) versionDesc.textContent = descriptions[versionSelect.value];
      });

      if (quantitySlider) quantitySlider.addEventListener('input', (e) => {
        if (quantityValue) quantityValue.textContent = e.target.value;
      });

      const uuidLogic = (${createUuidLogic.toString()})();
      const fillRandom = (bytes) => crypto.getRandomValues(bytes);

      var generateBtn = document.getElementById('generate-btn');
      if (generateBtn) generateBtn.addEventListener('click', () => {
        const version = versionSelect.value;
        const quantity = parseInt(quantitySlider.value);
        const format = document.querySelector('input[name="format"]:checked').value;

        const uuids = uuidLogic.generateBatch(version, quantity, format, Date.now(), fillRandom);

        uuidOutput.innerHTML = uuids.map(uuid =>
          \`<button type="button" class="uuid-item btn btn-ghost w-full justify-start font-mono font-normal text-surface-900 dark:text-surface-100" data-uuid="\${uuid}" title="\${_t('tools.uuid-generator.js.r4_0', 'Click to copy')}">\${uuid}</button>\`
        ).join('');

        resultDiv.classList.remove('hidden');
        placeholderDiv.classList.add('hidden');
      });

      // Event delegation for clicking UUID items
      if (uuidOutput) uuidOutput.addEventListener('click', async (e) => {
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
               uuidItem.classList.add('text-success-600', 'font-bold');
               if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
               setTimeout(() => {
                  uuidItem.textContent = original;
                  uuidItem.classList.remove('text-success-600', 'font-bold');
              }, 1000);
           }
        }
      });

      var copyBtn = document.getElementById('copy-btn');
      if (copyBtn) copyBtn.addEventListener('click', async () => {
        const allUUIDs = uuidOutput ? Array.from(uuidOutput.children).map(el => el.dataset.uuid).join('\\n') : '';
        if(window.copyToClipboard) {
            window.copyToClipboard(allUUIDs, copyBtn);
        } else {
            await navigator.clipboard.writeText(allUUIDs);
            if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
        }
      });
    </script>
  `;

  return respondHTML(
    createPageTemplate({
      title: translation?.name || "UUID Generator",
      description: translation?.desc || "Generate standard UUIDs (v1, v4).",
      path: "/uuid-generator",
      content,
      scripts: script,
      lang: currentLang,
    }),
  );
}
