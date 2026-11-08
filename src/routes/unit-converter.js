/**
 * Unit Converter Tool
 * Convert between various units of measurement
 * All processing happens client-side
 */

import { createPageTemplate, createToolHeader } from "../utils/common-ui.js";
import { respondHTML } from "../utils/respond.js";
import {
  createEducationalSection,
  createRelatedToolsSection,
} from "../utils/content-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import {
  UNIT_CATEGORIES,
  convertUnit,
  formatUnitResult,
} from "../utils/unit-converter-logic.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";

/**
 * Render the Unit Converter page
 */
function renderUnitConverterPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("unit-converter", currentLang);
  const toolHeader = createToolHeader(
    { emoji: "⚖️" },
    translation?.name || "Unit Converter",
    translation?.desc ||
      "Convert between common units of measurement including length, weight, temperature, and more.",
    [
      {
        text: translation?.ui?.badge5 || "Client-Side Only",
        tooltip:
          "Runs entirely in your browser using Web APIs — your data is processed locally and not sent to our servers.",
      },
    ],
    { toolId: "unit-converter" },
  );

  const currentTool = TOOLS.find((t) => t.id === "unit-converter");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];
  const pageContent = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">
        ${toolHeader}
        
        <!-- Category Selection -->
        <div class="mb-8">
          <label class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3"><span data-i18n="tools.unit-converter.ui.label0">Category</span></label>
          <div data-i18n-aria="tools.unit-converter.ui.r6_0" class="grid grid-cols-2 sm:grid-cols-4 gap-3" id="category-grid" role="group" aria-label="Category selection">
            <!-- Categories injected by JS -->
          </div>
        </div>

        <!-- Converter Interface -->
        <div class="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-6 items-center">

          <!-- From Unit -->
          <div class="space-y-4">
            <div>
              <label for="from-unit" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2"><span data-i18n="tools.unit-converter.ui.label1">From</span></label>
              <select id="from-unit" class="input w-full">
                <!-- Units injected by JS -->
              </select>
            </div>
            <div>
              <label for="from-value" class="sr-only"><span>Input value</span></label>
              <input data-i18n-aria="tools.unit-converter.ui.r6_1" type="number" id="from-value" aria-label="Value to convert" step="any" placeholder="0" data-tooltip="Enter the value to convert" data-i18n-tooltip="tools.unit-converter.ui.r64_0" class="input-mono text-lg" />
            </div>
          </div>

          <!-- Swap Button -->
          <div class="flex justify-center md:pt-6">
            <button data-i18n-aria="tools.unit-converter.ui.r6_2" id="swap-btn" data-tooltip="Swap input and output units" data-i18n-tooltip="tools.unit-converter.ui.r64_1" class="btn-ghost btn-icon rounded-full rounded-full" title="Swap Units" aria-label="Swap units" data-i18n-title="tools.unit-converter.ui.title3">
              <span class="material-symbols-rounded transform rotate-90 md:rotate-0 transition-transform group-hover:scale-110" aria-hidden="true" data-icon="swap_horiz"></span>
            </button>
          </div>

          <!-- To Unit -->
          <div class="space-y-4">
            <div>
              <label for="to-unit" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2"><span data-i18n="tools.unit-converter.ui.label2">To</span></label>
              <select id="to-unit" class="input w-full">
                <!-- Units injected by JS -->
              </select>
            </div>
            <div>
              <label for="to-value" class="sr-only"><span data-i18n="tools.unit-converter.ui.r6_3">Converted value</span></label>
              <input data-i18n-aria="tools.unit-converter.ui.r6_3" type="number" id="to-value" aria-label="Converted value" step="any" placeholder="0" readonly class="input-mono w-full" />
              <span id="to-value-live" role="status" class="sr-only"></span>
            </div>
          </div>
        </div>

        <!-- Formula Display -->
        <div class="mt-8 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/50">
          <p class="text-sm text-primary-800 dark:text-primary-300 text-center font-medium" id="formula-display" data-i18n="tools.unit-converter.ui.desc4">
            Select units to see the conversion formula
          </p>
        </div>

      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection(
        [
          {
            title: "Measurement Systems Overview",
            content:
              "<p>Measurement systems are collections of units of measurement and rules relating them to each other. The two most common systems are the <strong>Metric System</strong> (International System of Units or SI) and the <strong>Imperial System</strong>. The Metric system is based on powers of ten, making it highly logical and easy to scale (e.g., meters, kilometers, millimeters).</p><p>The Imperial system, primarily used in the United States, uses units like inches, feet, and pounds, which have historical origins and less uniform conversion factors. Understanding the differences between these systems is essential for science, engineering, international trade, and even daily tasks like cooking or traveling.</p>",
          },
          {
            title: "How to Use This Tool",
            content:
              '<ol><li>Select the measurement category (e.g., Length, Weight, Temperature) from the grid at the top.</li><li>Choose the unit you want to convert from in the "From" dropdown menu.</li><li>Enter the value you wish to convert in the input field below the "From" unit.</li><li>Select the target unit in the "To" dropdown menu.</li><li>The converted value will appear instantly in the "To" field, along with the mathematical formula used for the conversion.</li></ol>',
          },
          {
            title: "Common Use Cases",
            content:
              "<ul><li><strong>Travel:</strong> Convert distances from kilometers to miles or temperatures from Celsius to Fahrenheit when visiting different countries.</li><li><strong>Cooking:</strong> Translate recipes between metric (grams/milliliters) and imperial (ounces/cups) measurements.</li><li><strong>Engineering & Science:</strong> Perform precise conversions between different units of pressure, energy, or speed for technical calculations.</li><li><strong>Digital Storage:</strong> Understand the difference between Megabytes, Gigabytes, and Terabytes when managing your files and hardware.</li></ul>",
          },
          {
            title: "Pro Tips",
            content:
              '<ul><li>Use the "Swap" button to quickly reverse the conversion direction between your selected units.</li><li>Always double-check the specific unit type, especially for volume and weight, as names can be similar across different systems (e.g., US vs. UK gallons).</li><li data-i18n="tools.unit-converter.ui.r3_0">When performing multiple conversions in a sequence, keep as many decimal places as possible until the final result to avoid cumulative rounding errors.</li></ul>',
          },
        ],
        "unit-converter",
        currentLang,
      )}
    </div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">${createRelatedToolsSection(relatedToolsData)}</div>
  `;

  const scripts = `
    <script>
      /* ===== Unit Data ===== */
      const CATEGORY_LABELS = {
        length: _t('tools.unit-converter.js.r64_2', 'Length'),
        weight: _t('tools.unit-converter.js.r64_3', 'Weight'),
        temperature: _t('tools.unit-converter.js.r64_4', 'Temperature'),
        volume: _t('tools.unit-converter.js.r64_5', 'Volume'),
        area: _t('tools.unit-converter.js.r64_6', 'Area'),
        speed: _t('tools.unit-converter.js.r64_7', 'Speed'),
        time: _t('tools.unit-converter.js.r64_8', 'Time'),
        data: _t('tools.unit-converter.js.r64_9', 'Data'),
        pressure: _t('tools.unit-converter.js.r64_10', 'Pressure'),
        energy: _t('tools.unit-converter.js.r64_11', 'Energy')
      };
      const UNIT_CATEGORIES = ${JSON.stringify(UNIT_CATEGORIES)};
      const convertUnit = ${convertUnit.toString()};
      const formatResult = ${formatUnitResult.toString()};
      const CATEGORIES = UNIT_CATEGORIES.map(cat => ({
        id: cat.id,
        label: CATEGORY_LABELS[cat.id] || cat.id,
        icon: cat.icon,
        units: cat.units.map(([id, label, factor]) => ({ id, label, factor }))
      }));

      /* ===== State ===== */
      let currentCategoryId = CATEGORIES[0].id;

      function temperatureFormula(fromId, toId) {
        if (fromId === toId) return 'x';
        const map = { c: '°C', f: '°F', k: 'K' };
        const f = map[fromId], t = map[toId];
        const formulas = {
          'c-f': '(x × 9/5) + 32',
          'f-c': '(x − 32) × 5/9',
          'c-k': 'x + 273.15',
          'k-c': 'x − 273.15',
          'f-k': '(x − 32) × 5/9 + 273.15',
          'k-f': '(x − 273.15) × 9/5 + 32'
        };
        return formulas[fromId + '-' + toId] || 'x';
      }

      /* ===== Populate dropdowns ===== */
      function populateDropdowns(category) {
        const fromSel = document.getElementById('from-unit');
        const toSel = document.getElementById('to-unit');
        fromSel.innerHTML = '';
        toSel.innerHTML = '';
        category.units.forEach((unit, i) => {
          const optFrom = document.createElement('option');
          optFrom.value = unit.id;
          optFrom.textContent = unit.label;
          fromSel.appendChild(optFrom);

          const optTo = document.createElement('option');
          optTo.value = unit.id;
          optTo.textContent = unit.label;
          toSel.appendChild(optTo);
        });
        // Default: second unit as "to"
        if (category.units.length > 1) toSel.selectedIndex = 1;
      }

      /* ===== Build category grid ===== */
      function buildCategoryGrid() {
        const grid = document.getElementById('category-grid');
        grid.innerHTML = '';
        CATEGORIES.forEach(cat => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.dataset.categoryId = cat.id;
          btn.setAttribute('aria-pressed', String(cat.id === currentCategoryId));
          btn.className = 'category-btn flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all ' +
            (cat.id === currentCategoryId
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400');
          btn.innerHTML = '<span class="material-symbols-rounded text-lg" aria-hidden="true" data-icon="' + cat.icon + '"></span>' +
            '<span>' + cat.label + '</span>';
          btn.addEventListener('click', () => selectCategory(cat.id));
          grid.appendChild(btn);
        });
      }

      /* ===== Select category ===== */
      function selectCategory(categoryId) {
        currentCategoryId = categoryId;
        // Update button styles
        document.querySelectorAll('.category-btn').forEach(btn => {
          const isActive = btn.dataset.categoryId === categoryId;
          btn.setAttribute('aria-pressed', String(isActive));
          btn.className = 'category-btn flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all ' +
            (isActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400');
        });
        const category = CATEGORIES.find(c => c.id === categoryId);
        populateDropdowns(category);
        performConversion();
      }

      /* ===== Perform conversion ===== */
      function performConversion() {
        const category = CATEGORIES.find(c => c.id === currentCategoryId);
        if (!category) return;

        const fromValueInput = document.getElementById('from-value');
        const fromValue = parseFloat(fromValueInput.value);
        const fromId = document.getElementById('from-unit').value;
        const toId = document.getElementById('to-unit').value;
        const toValueEl = document.getElementById('to-value');
        const toLiveEl = document.getElementById('to-value-live');

        if (isNaN(fromValue)) {
          fromValueInput.removeAttribute('aria-invalid');
          toValueEl.value = '';
          toLiveEl.textContent = '';
          updateFormulaDisplay();
          return;
        }

        const result = convertUnit(UNIT_CATEGORIES, category.id, fromValue, fromId, toId);
        if (result === null) {
          toValueEl.value = '';
          if (category.id === 'temperature') {
            const msg = 'Below absolute zero (0 K = −273.15 °C = −459.67 °F).';
            toLiveEl.textContent = msg;
            document.getElementById('formula-display').textContent = msg;
            fromValueInput.setAttribute('aria-invalid', 'true');
          }
          return;
        }
        fromValueInput.removeAttribute('aria-invalid');

        const formatted = formatResult(result);
        toValueEl.value = formatted;
        toLiveEl.textContent = formatted;
        updateFormulaDisplay();
      }

      /* ===== Formula display ===== */
      function updateFormulaDisplay() {
        const formulaEl = document.getElementById('formula-display');
        const category = CATEGORIES.find(c => c.id === currentCategoryId);
        if (!category) return;

        const fromId = document.getElementById('from-unit').value;
        const toId = document.getElementById('to-unit').value;
        const fromUnit = category.units.find(u => u.id === fromId);
        const toUnit = category.units.find(u => u.id === toId);
        if (!fromUnit || !toUnit) return;

        if (category.id === 'temperature') {
          const expr = temperatureFormula(fromId, toId);
          formulaEl.textContent = fromUnit.label + ' → ' + toUnit.label + ':  ' + expr;
        } else {
          if (fromId === toId) {
            formulaEl.textContent = _t('tools.unit-converter.js.formula_same', 'Same unit — no conversion needed.');
            return;
          }
          // Express as: x [fromUnit] = x * (fromFactor / toFactor) [toUnit]
          const ratio = fromUnit.factor / toUnit.factor;
          const ratioStr = formatResult(ratio);
          formulaEl.textContent = '1 ' + fromUnit.label + ' = ' + ratioStr + ' ' + toUnit.label;
        }
      }

      /* ===== Swap button ===== */
      document.getElementById('swap-btn').addEventListener('click', () => {
        const fromSel = document.getElementById('from-unit');
        const toSel = document.getElementById('to-unit');
        const fromVal = document.getElementById('from-value');
        const toVal = document.getElementById('to-value');

        const tmpUnit = fromSel.value;
        fromSel.value = toSel.value;
        toSel.value = tmpUnit;

        if (toVal.value !== '') {
          fromVal.value = toVal.value;
        }

        performConversion();
      });

      /* ===== Live input listener ===== */
      document.getElementById('from-value').addEventListener('input', performConversion);
      document.getElementById('from-unit').addEventListener('change', performConversion);
      document.getElementById('to-unit').addEventListener('change', performConversion);

      /* ===== Init ===== */
      buildCategoryGrid();
      const firstCat = CATEGORIES.find(c => c.id === currentCategoryId);
      populateDropdowns(firstCat);
      updateFormulaDisplay();
    </script>
  `;

  return createPageTemplate({
    title: translation?.name || "Unit Converter",
    description: translation?.desc || "Convert length, weight, and more.",
    path: "/unit-converter",
    content: pageContent,
    scripts,
    lang: currentLang,
  });
}

/**
 * Route handler for Unit Converter
 */
export async function handleUnitConverterRoutes(request, url) {
  const pathname = url.pathname;

  if (pathname === "/unit-converter" || pathname === "/unit-converter/") {
    return respondHTML(
      renderUnitConverterPage(resolveRequestLanguage(request, url)),
    );
  }

  return null;
}
