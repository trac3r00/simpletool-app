/**
 * Unit Converter Tool
 * Convert between various units of measurement
 * All processing happens client-side
 */

import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { respondHTML } from '../utils/respond.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

/**
 * Render the Unit Converter page
 */
function renderUnitConverterPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('unit-converter', currentLang);
  const toolHeader = createToolHeader(
    { emoji: '⚖️' },
    translation?.name || 'Unit Converter',
    translation?.desc || 'Convert between common units of measurement including length, weight, temperature, and more.',
    [{ text: translation?.ui?.badge5 || 'Client-Side Only', tooltip: 'Runs entirely in your browser using Web APIs — your data never leaves your device.' }],
    { toolId: 'unit-converter' }
  );

  const currentTool = TOOLS.find(t => t.id === 'unit-converter');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];
  const pageContent = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}
        
        <!-- Category Selection -->
        <div class="mb-8">
          <label class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3"><span data-i18n="tools.unit-converter.ui.label0">Category</span></label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3" id="category-grid" role="group" aria-label="Category selection">
            <!-- Categories injected by JS -->
          </div>
        </div>

        <!-- Converter Interface -->
        <div class="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-6 items-center">

          <!-- From Unit -->
          <div class="space-y-4">
            <div>
              <label for="from-unit" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2"><span data-i18n="tools.unit-converter.ui.label1">From</span></label>
              <select id="from-unit" class="w-full px-4 py-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-surface-900 dark:text-surface-50 transition-colors">
                <!-- Units injected by JS -->
              </select>
            </div>
            <div>
              <label for="from-value" class="sr-only"><span data-i18n="tools.unit-converter.ui.label0">Input value</span></label>
              <input type="number" id="from-value" placeholder="0" data-tooltip="Enter the value to convert" data-i18n-tooltip="tools.unit-converter.ui.tip0" class="w-full px-4 py-3 bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-surface-900 dark:text-surface-50 text-lg font-mono" />
            </div>
          </div>

          <!-- Swap Button -->
          <div class="flex justify-center md:pt-6">
            <button id="swap-btn" data-tooltip="Swap input and output units" data-i18n-tooltip="tools.unit-converter.ui.tip1" class="p-3 rounded-full bg-surface-100 dark:bg-surface-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-surface-600 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 transition-all group" title="Swap Units" data-i18n-title="tools.unit-converter.ui.title3">
              <span class="material-symbols-rounded transform rotate-90 md:rotate-0 transition-transform group-hover:scale-110">swap_horiz</span>
            </button>
          </div>

          <!-- To Unit -->
          <div class="space-y-4">
            <div>
              <label for="to-unit" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2"><span data-i18n="tools.unit-converter.ui.label2">To</span></label>
              <select id="to-unit" class="w-full px-4 py-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-surface-900 dark:text-surface-50 transition-colors">
                <!-- Units injected by JS -->
              </select>
            </div>
            <div>
              <label for="to-value" class="sr-only"><span data-i18n="tools.unit-converter.ui.label1">Converted value</span></label>
              <input type="number" id="to-value" placeholder="0" readonly class="w-full px-4 py-3 bg-surface-50 dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-50 text-lg font-mono cursor-not-allowed" />
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
      ${createEducationalSection([
        {
          title: 'Measurement Systems Overview',
          content: '<p>Measurement systems are collections of units of measurement and rules relating them to each other. The two most common systems are the <strong>Metric System</strong> (International System of Units or SI) and the <strong>Imperial System</strong>. The Metric system is based on powers of ten, making it highly logical and easy to scale (e.g., meters, kilometers, millimeters).</p><p>The Imperial system, primarily used in the United States, uses units like inches, feet, and pounds, which have historical origins and less uniform conversion factors. Understanding the differences between these systems is essential for science, engineering, international trade, and even daily tasks like cooking or traveling.</p>'
        },
        {
          title: 'How to Use This Tool',
          content: '<ol><li>Select the measurement category (e.g., Length, Weight, Temperature) from the grid at the top.</li><li>Choose the unit you want to convert from in the "From" dropdown menu.</li><li>Enter the value you wish to convert in the input field below the "From" unit.</li><li>Select the target unit in the "To" dropdown menu.</li><li>The converted value will appear instantly in the "To" field, along with the mathematical formula used for the conversion.</li></ol>'
        },
        {
          title: 'Common Use Cases',
          content: '<ul><li><strong>Travel:</strong> Convert distances from kilometers to miles or temperatures from Celsius to Fahrenheit when visiting different countries.</li><li><strong>Cooking:</strong> Translate recipes between metric (grams/milliliters) and imperial (ounces/cups) measurements.</li><li><strong>Engineering & Science:</strong> Perform precise conversions between different units of pressure, energy, or speed for technical calculations.</li><li><strong>Digital Storage:</strong> Understand the difference between Megabytes, Gigabytes, and Terabytes when managing your files and hardware.</li></ul>'
        },
        {
          title: 'Pro Tips',
          content: '<ul><li>Use the "Swap" button to quickly reverse the conversion direction between your selected units.</li><li>Always double-check the specific unit type, especially for volume and weight, as names can be similar across different systems (e.g., US vs. UK gallons).</li><li>When performing multiple conversions in a sequence, keep as many decimal places as possible until the final result to avoid cumulative rounding errors.</li></ul>'
        }
      ], 'unit-converter')}
    </div>
    ${createRelatedToolsSection(relatedToolsData)}
  `;


  const scripts = `
    <script>
      /* ===== Unit Data ===== */
      const CATEGORIES = [
        {
          id: 'length',
          label: _t('tools.unit-converter.js.cat_length', 'Length'),
          icon: 'straighten',
          units: [
            { id: 'm',   label: 'Meter (m)',       factor: 1 },
            { id: 'km',  label: 'Kilometer (km)',   factor: 1000 },
            { id: 'cm',  label: 'Centimeter (cm)',  factor: 0.01 },
            { id: 'mm',  label: 'Millimeter (mm)',  factor: 0.001 },
            { id: 'nm',  label: 'Nanometer (nm)',   factor: 1e-9 },
            { id: 'mi',  label: 'Mile (mi)',         factor: 1609.344 },
            { id: 'yd',  label: 'Yard (yd)',         factor: 0.9144 },
            { id: 'ft',  label: 'Foot (ft)',         factor: 0.3048 },
            { id: 'in',  label: 'Inch (in)',         factor: 0.0254 }
          ]
        },
        {
          id: 'weight',
          label: _t('tools.unit-converter.js.cat_weight', 'Weight'),
          icon: 'monitor_weight',
          units: [
            { id: 'kg',  label: 'Kilogram (kg)',    factor: 1 },
            { id: 'g',   label: 'Gram (g)',          factor: 0.001 },
            { id: 'mg',  label: 'Milligram (mg)',    factor: 1e-6 },
            { id: 'ton', label: 'Metric Ton (t)',    factor: 1000 },
            { id: 'lb',  label: 'Pound (lb)',        factor: 0.453592 },
            { id: 'oz',  label: 'Ounce (oz)',        factor: 0.0283495 },
            { id: 'st',  label: 'Stone (st)',        factor: 6.35029 }
          ]
        },
        {
          id: 'temperature',
          label: _t('tools.unit-converter.js.cat_temperature', 'Temperature'),
          icon: 'thermostat',
          units: [
            { id: 'c', label: 'Celsius (°C)',    factor: null },
            { id: 'f', label: 'Fahrenheit (°F)', factor: null },
            { id: 'k', label: 'Kelvin (K)',       factor: null }
          ]
        },
        {
          id: 'volume',
          label: _t('tools.unit-converter.js.cat_volume', 'Volume'),
          icon: 'water_drop',
          units: [
            { id: 'l',    label: 'Liter (L)',          factor: 1 },
            { id: 'ml',   label: 'Milliliter (mL)',    factor: 0.001 },
            { id: 'm3',   label: 'Cubic Meter (m³)',   factor: 1000 },
            { id: 'gal',  label: 'Gallon (US gal)',    factor: 3.78541 },
            { id: 'qt',   label: 'Quart (US qt)',      factor: 0.946353 },
            { id: 'pt',   label: 'Pint (US pt)',       factor: 0.473176 },
            { id: 'cup',  label: 'Cup (US cup)',       factor: 0.236588 },
            { id: 'floz', label: 'Fl. Ounce (fl oz)', factor: 0.0295735 }
          ]
        },
        {
          id: 'area',
          label: _t('tools.unit-converter.js.cat_area', 'Area'),
          icon: 'crop_square',
          units: [
            { id: 'm2',   label: 'Sq. Meter (m²)',      factor: 1 },
            { id: 'km2',  label: 'Sq. Kilometer (km²)', factor: 1e6 },
            { id: 'cm2',  label: 'Sq. Centimeter (cm²)',factor: 0.0001 },
            { id: 'ha',   label: 'Hectare (ha)',         factor: 10000 },
            { id: 'acre', label: 'Acre (acre)',          factor: 4046.86 },
            { id: 'mi2',  label: 'Sq. Mile (mi²)',      factor: 2589988.11 },
            { id: 'ft2',  label: 'Sq. Foot (ft²)',      factor: 0.092903 },
            { id: 'in2',  label: 'Sq. Inch (in²)',      factor: 0.00064516 }
          ]
        },
        {
          id: 'speed',
          label: _t('tools.unit-converter.js.cat_speed', 'Speed'),
          icon: 'speed',
          units: [
            { id: 'ms',   label: 'Meter/sec (m/s)',   factor: 1 },
            { id: 'kmh',  label: 'Kilometer/hr (km/h)', factor: 0.277778 },
            { id: 'mph',  label: 'Mile/hr (mph)',      factor: 0.44704 },
            { id: 'kn',   label: 'Knot (kn)',          factor: 0.514444 },
            { id: 'fts',  label: 'Foot/sec (ft/s)',    factor: 0.3048 }
          ]
        },
        {
          id: 'time',
          label: _t('tools.unit-converter.js.cat_time', 'Time'),
          icon: 'schedule',
          units: [
            { id: 's',     label: 'Second (s)',    factor: 1 },
            { id: 'ms',    label: 'Millisecond (ms)', factor: 0.001 },
            { id: 'min',   label: 'Minute (min)', factor: 60 },
            { id: 'hr',    label: 'Hour (hr)',     factor: 3600 },
            { id: 'day',   label: 'Day (day)',     factor: 86400 },
            { id: 'week',  label: 'Week (week)',   factor: 604800 },
            { id: 'month', label: 'Month (month)', factor: 2629746 },
            { id: 'year',  label: 'Year (year)',   factor: 31556952 }
          ]
        },
        {
          id: 'data',
          label: _t('tools.unit-converter.js.cat_data', 'Data'),
          icon: 'storage',
          units: [
            { id: 'B',   label: 'Byte (B)',      factor: 1 },
            { id: 'KB',  label: 'Kilobyte (KB)', factor: 1024 },
            { id: 'MB',  label: 'Megabyte (MB)', factor: 1048576 },
            { id: 'GB',  label: 'Gigabyte (GB)', factor: 1073741824 },
            { id: 'TB',  label: 'Terabyte (TB)', factor: 1099511627776 },
            { id: 'PB',  label: 'Petabyte (PB)', factor: 1125899906842624 }
          ]
        },
        {
          id: 'pressure',
          label: _t('tools.unit-converter.js.cat_pressure', 'Pressure'),
          icon: 'compress',
          units: [
            { id: 'Pa',    label: 'Pascal (Pa)',        factor: 1 },
            { id: 'kPa',   label: 'Kilopascal (kPa)',  factor: 1000 },
            { id: 'bar',   label: 'Bar (bar)',          factor: 100000 },
            { id: 'atm',   label: 'Atmosphere (atm)',  factor: 101325 },
            { id: 'psi',   label: 'PSI (psi)',          factor: 6894.76 },
            { id: 'mmHg',  label: 'mmHg (mmHg)',       factor: 133.322 }
          ]
        },
        {
          id: 'energy',
          label: _t('tools.unit-converter.js.cat_energy', 'Energy'),
          icon: 'bolt',
          units: [
            { id: 'J',    label: 'Joule (J)',            factor: 1 },
            { id: 'kJ',   label: 'Kilojoule (kJ)',       factor: 1000 },
            { id: 'cal',  label: 'Calorie (cal)',        factor: 4.184 },
            { id: 'kcal', label: 'Kilocalorie (kcal)',   factor: 4184 },
            { id: 'Wh',   label: 'Watt-hour (Wh)',      factor: 3600 },
            { id: 'kWh',  label: 'Kilowatt-hour (kWh)', factor: 3600000 },
            { id: 'BTU',  label: 'BTU (BTU)',            factor: 1055.06 },
            { id: 'eV',   label: 'Electronvolt (eV)',   factor: 1.60218e-19 }
          ]
        }
      ];

      /* ===== State ===== */
      let currentCategoryId = CATEGORIES[0].id;

      /* ===== Temperature conversion (special case) ===== */
      function convertTemperature(value, fromId, toId) {
        if (fromId === toId) return value;
        // Convert to Celsius first
        let celsius;
        if (fromId === 'c') celsius = value;
        else if (fromId === 'f') celsius = (value - 32) * 5 / 9;
        else celsius = value - 273.15; // K

        // Convert from Celsius to target
        if (toId === 'c') return celsius;
        if (toId === 'f') return celsius * 9 / 5 + 32;
        return celsius + 273.15; // K
      }

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

      /* ===== Generic factor-based conversion ===== */
      function convertValue(value, fromUnit, toUnit) {
        if (fromUnit.id === toUnit.id) return value;
        const valueInBase = value * fromUnit.factor;
        return valueInBase / toUnit.factor;
      }

      function formatResult(num) {
        if (!isFinite(num)) return '';
        // Use toPrecision for very large/small numbers, otherwise plain
        const abs = Math.abs(num);
        if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) {
          return parseFloat(num.toPrecision(10)).toString();
        }
        // Round to 10 significant figures to avoid floating point noise
        const rounded = parseFloat(num.toPrecision(10));
        return rounded.toString();
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
          btn.className = 'category-btn flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all ' +
            (cat.id === currentCategoryId
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400');
          btn.innerHTML = '<span class="material-symbols-rounded text-lg">' + cat.icon + '</span>' +
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
          btn.className = 'category-btn flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all ' +
            (isActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400');
        });
        const category = CATEGORIES.find(c => c.id === categoryId);
        populateDropdowns(category);
        // Clear input and run conversion
        document.getElementById('from-value').value = '';
        document.getElementById('to-value').value = '';
        updateFormulaDisplay();
      }

      /* ===== Perform conversion ===== */
      function performConversion() {
        const category = CATEGORIES.find(c => c.id === currentCategoryId);
        if (!category) return;

        const fromValue = parseFloat(document.getElementById('from-value').value);
        const fromId = document.getElementById('from-unit').value;
        const toId = document.getElementById('to-unit').value;
        const toValueEl = document.getElementById('to-value');
        const toLiveEl = document.getElementById('to-value-live');

        if (isNaN(fromValue)) {
          toValueEl.value = '';
          toLiveEl.textContent = '';
          updateFormulaDisplay();
          return;
        }

        let result;
        if (category.id === 'temperature') {
          result = convertTemperature(fromValue, fromId, toId);
        } else {
          const fromUnit = category.units.find(u => u.id === fromId);
          const toUnit = category.units.find(u => u.id === toId);
          if (!fromUnit || !toUnit) return;
          result = convertValue(fromValue, fromUnit, toUnit);
        }

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
          const ratioStr = parseFloat(ratio.toPrecision(8)).toString();
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

        // Move result to input
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
    title: translation?.name || 'Unit Converter',
    description: translation?.desc || 'Convert length, weight, and more.',
    path: '/unit-converter',
    content: pageContent,
    scripts,
    lang: currentLang
  });
}

/**
 * Route handler for Unit Converter
 */
export async function handleUnitConverterRoutes(request, url) {
  const pathname = url.pathname;

  if (pathname === '/unit-converter' || pathname === '/unit-converter/') {
    return respondHTML(renderUnitConverterPage(resolveRequestLanguage(request, url)));
  }

  return null;
}
