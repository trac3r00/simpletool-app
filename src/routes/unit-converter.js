/**
 * Unit Converter Tool
 * Convert between various units of measurement
 * All processing happens client-side
 */

import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { respondHTML } from '../utils/respond.js';

/**
 * Render the Unit Converter page
 */
function renderUnitConverterPage() {
  const toolHeader = createToolHeader(
    { emoji: '⚖️' },
    'Unit Converter',
    'Convert between common units of measurement including length, weight, temperature, and more.',
    [{ text: 'Client-Side Only', tooltip: 'Runs entirely in your browser using Web APIs — your data never leaves your device.' }],
    { toolId: 'unit-converter' }
  );

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
              <label for="from-value" class="sr-only">Input value</label>
              <input type="number" id="from-value" placeholder="0" data-tooltip="Enter the value to convert" class="w-full px-4 py-3 bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-surface-900 dark:text-surface-50 text-lg font-mono" />
            </div>
          </div>

          <!-- Swap Button -->
          <div class="flex justify-center md:pt-6">
            <button id="swap-btn" data-tooltip="Swap input and output units" class="p-3 rounded-full bg-surface-100 dark:bg-surface-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-surface-600 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 transition-all group" title="Swap Units" data-i18n-title="tools.unit-converter.ui.title3">
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
              <label for="to-value" class="sr-only">Converted value</label>
              <input type="number" id="to-value" placeholder="0" readonly class="w-full px-4 py-3 bg-surface-50 dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-50 text-lg font-mono cursor-not-allowed" />
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

    <script>
      // Unit Definitions
      const categories = {
        length: {
          icon: 'straighten',
          label: 'Length',
          base: 'meter',
          units: {
            kilometer: { label: 'Kilometer (km)', factor: 1000 },
            meter: { label: 'Meter (m)', factor: 1 },
            centimeter: { label: 'Centimeter (cm)', factor: 0.01 },
            millimeter: { label: 'Millimeter (mm)', factor: 0.001 },
            mile: { label: 'Mile (mi)', factor: 1609.344 },
            yard: { label: 'Yard (yd)', factor: 0.9144 },
            foot: { label: 'Foot (ft)', factor: 0.3048 },
            inch: { label: 'Inch (in)', factor: 0.0254 }
          }
        },
        weight: {
          icon: 'scale',
          label: 'Weight',
          base: 'gram',
          units: {
            metric_ton: { label: 'Metric Ton (t)', factor: 1000000 },
            kilogram: { label: 'Kilogram (kg)', factor: 1000 },
            gram: { label: 'Gram (g)', factor: 1 },
            milligram: { label: 'Milligram (mg)', factor: 0.001 },
            pound: { label: 'Pound (lb)', factor: 453.59237 },
            ounce: { label: 'Ounce (oz)', factor: 28.34952 }
          }
        },
        temperature: {
          icon: 'thermostat',
          label: 'Temperature',
          type: 'temperature', // Special handling
          units: {
            celsius: { label: 'Celsius (°C)' },
            fahrenheit: { label: 'Fahrenheit (°F)' },
            kelvin: { label: 'Kelvin (K)' }
          }
        },
        area: {
          icon: 'square_foot',
          label: 'Area',
          base: 'square_meter',
          units: {
            square_kilometer: { label: 'Square Kilometer (km²)', factor: 1000000 },
            square_meter: { label: 'Square Meter (m²)', factor: 1 },
            square_mile: { label: 'Square Mile (mi²)', factor: 2589988.11 },
            square_yard: { label: 'Square Yard (yd²)', factor: 0.836127 },
            square_foot: { label: 'Square Foot (ft²)', factor: 0.092903 },
            acre: { label: 'Acre (ac)', factor: 4046.86 },
            hectare: { label: 'Hectare (ha)', factor: 10000 }
          }
        },
        volume: {
          icon: 'view_in_ar',
          label: 'Volume',
          base: 'liter',
          units: {
            cubic_meter: { label: 'Cubic Meter (m³)', factor: 1000 },
            liter: { label: 'Liter (l)', factor: 1 },
            milliliter: { label: 'Milliliter (ml)', factor: 0.001 },
            gallon_us: { label: 'Gallon (US)', factor: 3.78541 },
            quart_us: { label: 'Quart (US)', factor: 0.946353 },
            pint_us: { label: 'Pint (US)', factor: 0.473176 },
            cup_us: { label: 'Cup (US)', factor: 0.24 },
            fluid_ounce_us: { label: 'Fluid Ounce (US)', factor: 0.0295735 }
          }
        },
        speed: {
          icon: 'speed',
          label: 'Speed',
          base: 'meters_per_second',
          units: {
            miles_per_hour: { label: 'Miles per Hour (mph)', factor: 0.44704 },
            kilometers_per_hour: { label: 'Kilometers per Hour (km/h)', factor: 0.277778 },
            meters_per_second: { label: 'Meters per Second (m/s)', factor: 1 },
            knot: { label: 'Knot (kn)', factor: 0.514444 }
          }
        },
        time: {
          icon: 'timer',
          label: 'Time',
          base: 'second',
          units: {
            year: { label: 'Year', factor: 31536000 },
            week: { label: 'Week', factor: 604800 },
            day: { label: 'Day', factor: 86400 },
            hour: { label: 'Hour', factor: 3600 },
            minute: { label: 'Minute', factor: 60 },
            second: { label: 'Second', factor: 1 },
            millisecond: { label: 'Millisecond (ms)', factor: 0.001 }
          }
        },
        digital: {
          icon: 'hard_drive',
          label: 'Digital Storage',
          base: 'byte',
          units: {
            terabyte: { label: 'Terabyte (TB)', factor: 1099511627776 },
            gigabyte: { label: 'Gigabyte (GB)', factor: 1073741824 },
            megabyte: { label: 'Megabyte (MB)', factor: 1048576 },
            kilobyte: { label: 'Kilobyte (KB)', factor: 1024 },
            byte: { label: 'Byte (B)', factor: 1 },
            bit: { label: 'Bit (b)', factor: 0.125 }
          }
        }
      };

      // State
      let currentCategory = 'length';

      // DOM Elements
      const categoryGrid = document.getElementById('category-grid');
      const fromUnitSelect = document.getElementById('from-unit');
      const toUnitSelect = document.getElementById('to-unit');
      const fromValueInput = document.getElementById('from-value');
      const toValueInput = document.getElementById('to-value');
      const swapBtn = document.getElementById('swap-btn');
      const formulaDisplay = document.getElementById('formula-display');

      // Initialize
      function init() {
        renderCategories();
        updateUnits();
        
        // Event Listeners
        fromValueInput.addEventListener('input', convert);
        fromUnitSelect.addEventListener('change', convert);
        toUnitSelect.addEventListener('change', convert);
        categoryGrid.addEventListener('click', (event) => {
          const button = event.target.closest('[data-category]');
          if (!button) return;
          selectCategory(button.dataset.category);
        });
        
        swapBtn.addEventListener('click', () => {
          const temp = fromUnitSelect.value;
          fromUnitSelect.value = toUnitSelect.value;
          toUnitSelect.value = temp;
          convert();
        });
      }

      function renderCategories() {
        categoryGrid.innerHTML = Object.entries(categories).map(([key, cat]) => {
          const activeClass = 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300';
          const inactiveClass = 'border-transparent bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300';
          const isActive = key === currentCategory;
          const className = \`category-btn p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 \${isActive ? activeClass : inactiveClass}\`;
          
          return \`
          <button 
            class="\${className}"
            type="button"
            data-category="\${key}"
          >
            <span class="material-symbols-rounded text-3xl">\${cat.icon}</span>
            <span class="text-xs font-bold">\${cat.label}</span>
          </button>
          \`;
        }).join('');
      }

      function selectCategory(category) {
        currentCategory = category;
        renderCategories();
        updateUnits();
        fromValueInput.value = '';
        toValueInput.value = '';
        formulaDisplay.textContent = _t('tools.unit-converter.js.text0', 'Select units to see the conversion formula');
      }

      function updateUnits() {
        const cat = categories[currentCategory];
        const units = Object.entries(cat.units);
        
        const options = units.map(([key, unit]) => 
          \`<option value="\${key}">\${unit.label}</option>\`
        ).join('');

        fromUnitSelect.innerHTML = options;
        toUnitSelect.innerHTML = options;
        
        // Set default selection (first and second unit if available)
        if (units.length > 1) {
          toUnitSelect.selectedIndex = 1;
        }
      }

      function convert() {
        const cat = categories[currentCategory];
        const fromUnit = fromUnitSelect.value;
        const toUnit = toUnitSelect.value;
        const value = parseFloat(fromValueInput.value);

        if (isNaN(value)) {
          toValueInput.value = '';
          formulaDisplay.textContent = _t('tools.unit-converter.js.text1', 'Enter a valid number');
          return;
        }

        let result;
        let formulaText = '';

        if (cat.type === 'temperature') {
          result = convertTemperature(value, fromUnit, toUnit);
          formulaText = getTemperatureFormula(fromUnit, toUnit);
        } else {
          // Standard conversion using factors
          const fromFactor = cat.units[fromUnit].factor;
          const toFactor = cat.units[toUnit].factor;
          
          // Convert to base then to target
          const baseValue = value * fromFactor;
          result = baseValue / toFactor;
          
          formulaText = \`Multiply by \${fromFactor / toFactor}\`;
        }

        // Format result (avoid floating point errors)
        toValueInput.value = Number(result.toPrecision(10)).toString();
        formulaDisplay.textContent = formulaText;
      }

      function convertTemperature(value, from, to) {
        if (from === to) return value;

        let celsius;
        // Convert to Celsius first
        if (from === 'celsius') celsius = value;
        else if (from === 'fahrenheit') celsius = (value - 32) * 5/9;
        else if (from === 'kelvin') celsius = value - 273.15;

        // Convert from Celsius to target
        if (to === 'celsius') return celsius;
        else if (to === 'fahrenheit') return (celsius * 9/5) + 32;
        else if (to === 'kelvin') return celsius + 273.15;
      }

      function getTemperatureFormula(from, to) {
        if (from === to) return 'No conversion needed';
        
        if (from === 'celsius' && to === 'fahrenheit') return '(°C × 9/5) + 32 = °F';
        if (from === 'fahrenheit' && to === 'celsius') return '(°F - 32) × 5/9 = °C';
        if (from === 'celsius' && to === 'kelvin') return '°C + 273.15 = K';
        if (from === 'kelvin' && to === 'celsius') return 'K - 273.15 = °C';
        if (from === 'fahrenheit' && to === 'kelvin') return '(°F - 32) × 5/9 + 273.15 = K';
        if (from === 'kelvin' && to === 'fahrenheit') return '(K - 273.15) × 9/5 + 32 = °F';
        
        return 'Complex conversion';
      }

      // Start
      init();
    </script>
  `;

  return createPageTemplate({
    title: 'Unit Converter',
    description: 'Convert between common units of measurement including length, weight, temperature, area, volume, speed, time, and digital storage.',
    path: '/unit-converter',
    content: pageContent
  });
}

/**
 * Route handler for Unit Converter
 */
export async function handleUnitConverterRoutes(request, url) {
  const pathname = url.pathname;

  if (pathname === '/unit-converter' || pathname === '/unit-converter/') {
    return respondHTML(renderUnitConverterPage());
  }

  return null;
}
