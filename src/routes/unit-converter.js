/**
 * Unit Converter Tool
 * Convert between various units of measurement
 * All processing happens client-side
 */

import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { respondHTML } from '../utils/respond.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';

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
