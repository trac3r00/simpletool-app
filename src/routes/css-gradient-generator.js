/**
 * CSS Gradient Generator Tool
 * Create linear and radial gradients with live preview
 * Export CSS code for web projects
 * All processing happens client-side
 */

import { createPageTemplate, createToolHeader, getCopyToClipboardScript } from '../utils/common-ui.js';
import { respondHTML } from '../utils/respond.js';

/**
 * Render the CSS Gradient Generator page
 */
function renderCSSGradientPage() {
  const toolHeader = createToolHeader(
    { emoji: '🌈' },
    'Gradient Generator',
    'Create beautiful CSS gradients with an interactive editor. Perfect for web designers and developers.',
    [{ text: 'Client-Side Only', tooltip: 'Runs entirely in your browser using Web APIs — your data never leaves your device.' }],
    { toolId: 'css-gradient' }
  );

  const pageContent = `

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left Column: Controls -->
        <div class="space-y-6">
          <!-- Gradient Type -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm p-6">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.css-gradient.ui.heading18">🔧 Gradient Type</h2>

            <div class="grid grid-cols-2 gap-3">
               <button id="type-linear" class="gradient-type-btn" data-tooltip="Gradient along a straight line" py-3 px-4 rounded-lg font-semibold transition bg-primary-700 text-white">
                 <span data-i18n="tools.css-gradient.ui.button0">Linear</span>
               </button>
              <button id="type-radial" class="gradient-type-btn" data-tooltip="Gradient radiating from a center point" py-3 px-4 rounded-lg font-semibold transition bg-surface-200 dark:bg-surface-800 text-surface-900 dark:text-surface-200">
                <span data-i18n="tools.css-gradient.ui.button1">Radial</span>
              </button>
            </div>

            <!-- Linear Options -->
            <div id="linear-options" class="mt-4">
              <label for="angle-slider" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2" data-tooltip="Direction angle for linear gradient (0-360°)">
                Direction: <span id="angle-value">90</span>°
              </label>
              <input type="range" id="angle-slider" min="0" max="360" value="90"
                class="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer dark:bg-surface-700" />

              <div class="grid grid-cols-4 gap-2 mt-3">
                 <button class="direction-btn py-2 px-3 text-xs rounded bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-angle="0" aria-label="Set gradient direction to 0 degrees (upward)">↑</button>
                 <button class="direction-btn py-2 px-3 text-xs rounded bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-angle="90" aria-label="Set gradient direction to 90 degrees (right)">→</button>
                 <button class="direction-btn py-2 px-3 text-xs rounded bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-angle="180" aria-label="Set gradient direction to 180 degrees (downward)">↓</button>
                 <button class="direction-btn py-2 px-3 text-xs rounded bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-angle="270" aria-label="Set gradient direction to 270 degrees (left)">←</button>
              </div>
            </div>

            <!-- Radial Options -->
            <div id="radial-options" class="mt-4 hidden">
              <label for="radial-shape" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2"><span data-i18n="tools.css-gradient.ui.label5">Shape</span></label>
              <select id="radial-shape" class="w-full px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-100">
                <option value="circle" data-i18n="tools.css-gradient.ui.option7">Circle</option>
                <option value="ellipse" data-i18n="tools.css-gradient.ui.option8">Ellipse</option>
              </select>

              <label for="radial-position" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mt-3 mb-2"><span data-i18n="tools.css-gradient.ui.label6">Position</span></label>
              <select id="radial-position" class="w-full px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-100">
                <option value="center" data-i18n="tools.css-gradient.ui.option9">Center</option>
                <option value="top" data-i18n="tools.css-gradient.ui.option10">Top</option>
                <option value="bottom" data-i18n="tools.css-gradient.ui.option11">Bottom</option>
                <option value="left" data-i18n="tools.css-gradient.ui.option12">Left</option>
                <option value="right" data-i18n="tools.css-gradient.ui.option13">Right</option>
                <option value="top left" data-i18n="tools.css-gradient.ui.option14">Top Left</option>
                <option value="top right" data-i18n="tools.css-gradient.ui.option15">Top Right</option>
                <option value="bottom left" data-i18n="tools.css-gradient.ui.option16">Bottom Left</option>
                <option value="bottom right" data-i18n="tools.css-gradient.ui.option17">Bottom Right</option>
              </select>
            </div>
          </div>

          <!-- Color Stops -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.css-gradient.ui.heading19">🎨 Color Stops</h2>
                <button id="add-color-stop" data-tooltip="Add another color to the gradient" class="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition text-sm font-semibold">
                <span data-i18n="tools.css-gradient.ui.button2">+ Add Color</span>
              </button>
            </div>

            <div id="color-stops-container" class="space-y-3">
              <!-- Color stops will be added here dynamically -->
            </div>
          </div>

          <!-- Preset Gradients -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm p-6">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.css-gradient.ui.heading20">✨ Preset Gradients</h2>

            <div class="grid grid-cols-2 gap-3">
              <div class="preset-card" data-preset="sunset" style="background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);"></div>
              <div class="preset-card" data-preset="ocean" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
              <div class="preset-card" data-preset="forest" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);"></div>
              <div class="preset-card" data-preset="fire" style="background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);"></div>
              <div class="preset-card" data-preset="sky" style="background: linear-gradient(135deg, #2196f3 0%, #00bcd4 100%);"></div>
              <div class="preset-card" data-preset="rose" style="background: linear-gradient(135deg, #f857a6 0%, #ff5858 100%);"></div>
            </div>
          </div>
        </div>

        <!-- Right Column: Preview & Code -->
        <div class="space-y-6">
          <!-- Live Preview -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm p-6">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.css-gradient.ui.heading21">👁️ Live Preview</h2>
            <div id="gradient-preview" class="gradient-preview border-2 border-surface-200 dark:border-surface-700"></div>
          </div>

          <!-- CSS Code -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.css-gradient.ui.heading22">📋 CSS Code</h2>
               <button id="copy-css-btn" class="px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition text-sm font-semibold">
                <span data-i18n="tools.css-gradient.ui.button3">📋 Copy CSS</span>
              </button>
            </div>

            <pre id="css-output" class="bg-surface-50 dark:bg-surface-950 p-4 rounded-lg overflow-x-auto text-sm font-mono text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-800"></pre>
          </div>

          <!-- Info Cards -->
          <div class="grid grid-cols-1 gap-4">
              <div class="bg-info-50 dark:bg-info-900/20 rounded-xl p-4 border-2 border-info-200 dark:border-info-700">
               <h3 class="font-bold text-info-900 dark:text-info-200 mb-2" data-i18n="tools.css-gradient.ui.heading23">💡 Quick Tips</h3>
               <ul class="text-sm text-info-800 dark:text-info-300 space-y-1 list-disc list-inside">
                <li>Use 2-3 colors for smooth gradients</li>
                <li>Add more color stops for complex effects</li>
                <li>Try preset gradients for inspiration</li>
                <li>Radial gradients work great for backgrounds</li>
              </ul>
            </div>

              <div class="bg-success-50 dark:bg-success-900/20 rounded-xl p-4 border-2 border-success-200 dark:border-success-700">
               <h3 class="font-bold text-success-900 dark:text-success-200 mb-2" data-i18n="tools.css-gradient.ui.heading24">🎯 Use Cases</h3>
               <ul class="text-sm text-success-800 dark:text-success-300 space-y-1 list-disc list-inside">
                <li>Website backgrounds and hero sections</li>
                <li>Button and card designs</li>
                <li>Text gradients with background-clip</li>
                <li>Loading screens and overlays</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </div>
    </main>

    ${getCopyToClipboardScript()}

    <script>
      // State
      let gradientType = 'linear';
      let angle = 90;
      let radialShape = 'circle';
      let radialPosition = 'center';
      let colorStops = [
        { color: '#667eea', position: 0 },
        { color: '#764ba2', position: 100 }
      ];

      // DOM Elements
      const previewEl = document.getElementById('gradient-preview');
      const cssOutputEl = document.getElementById('css-output');
      const angleSlider = document.getElementById('angle-slider');
      const angleValue = document.getElementById('angle-value');
      const linearOptions = document.getElementById('linear-options');
      const radialOptions = document.getElementById('radial-options');
      const radialShapeSelect = document.getElementById('radial-shape');
      const radialPositionSelect = document.getElementById('radial-position');
      const colorStopsContainer = document.getElementById('color-stops-container');

      // Gradient Type Toggle
       document.getElementById('type-linear').addEventListener('click', () => {
         gradientType = 'linear';
         document.getElementById('type-linear').className = 'gradient-type-btn py-3 px-4 rounded-lg font-semibold transition bg-primary-700 text-white';
         document.getElementById('type-radial').className = 'gradient-type-btn py-3 px-4 rounded-lg font-semibold transition bg-surface-200 dark:bg-surface-800 text-surface-900 dark:text-surface-200';
        linearOptions.classList.remove('hidden');
        radialOptions.classList.add('hidden');
        updateGradient();
      });

       document.getElementById('type-radial').addEventListener('click', () => {
         gradientType = 'radial';
         document.getElementById('type-radial').className = 'gradient-type-btn py-3 px-4 rounded-lg font-semibold transition bg-primary-700 text-white';
         document.getElementById('type-linear').className = 'gradient-type-btn py-3 px-4 rounded-lg font-semibold transition bg-surface-200 dark:bg-surface-800 text-surface-900 dark:text-surface-200';
        linearOptions.classList.add('hidden');
        radialOptions.classList.remove('hidden');
        updateGradient();
      });

      // Angle Control
      angleSlider.addEventListener('input', (e) => {
        angle = parseInt(e.target.value);
        angleValue.textContent = angle;
        updateGradient();
      });

      // Direction Buttons
      document.querySelectorAll('.direction-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          angle = parseInt(btn.dataset.angle);
          angleSlider.value = angle;
          angleValue.textContent = angle;
          updateGradient();
        });
      });

      // Radial Options
      radialShapeSelect.addEventListener('change', (e) => {
        radialShape = e.target.value;
        updateGradient();
      });

      radialPositionSelect.addEventListener('change', (e) => {
        radialPosition = e.target.value;
        updateGradient();
      });

      // Add Color Stop
      document.getElementById('add-color-stop').addEventListener('click', () => {
        const lastPosition = colorStops[colorStops.length - 1].position;
        const newPosition = Math.min(100, lastPosition + 10);
        colorStops.push({ color: '#ffffff', position: newPosition });
        renderColorStops();
        updateGradient();
      });

      // Render Color Stops
      function renderColorStops() {
        colorStopsContainer.innerHTML = colorStops.map((stop, index) => \`
          <div class="color-stop">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-surface-700 dark:text-surface-300">Color \${index + 1}</span>
              \${colorStops.length > 2 ? \`
                <button class="remove-stop text-error-500 hover:text-error-700 text-sm font-semibold" data-index="\${index}">
                  <span data-i18n="tools.css-gradient.ui.button4">✕ Remove</span>
                </button>
              \` : ''}
            </div>
            <div class="flex items-center gap-3">
              <input type="color" value="\${stop.color}" aria-label="Color stop \${index + 1}" class="color-picker w-12 h-12 rounded border-2 border-surface-300 dark:border-surface-700 cursor-pointer" data-index="\${index}" />
              <div class="flex-1">
                <label class="text-xs text-surface-600 dark:text-surface-400">Position: \${stop.position}%</label>
                <input type="range" min="0" max="100" value="\${stop.position}" aria-label="Color stop \${index + 1} position" class="position-slider w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer dark:bg-surface-700" data-index="\${index}" />
              </div>
            </div>
          </div>
        \`).join('');

        // Attach event listeners
        document.querySelectorAll('.color-picker').forEach(picker => {
          picker.addEventListener('input', (e) => {
            const index = parseInt(e.target.dataset.index);
            colorStops[index].color = e.target.value;
            updateGradient();
          });
        });

        document.querySelectorAll('.position-slider').forEach(slider => {
          slider.addEventListener('input', (e) => {
            const index = parseInt(e.target.dataset.index);
            colorStops[index].position = parseInt(e.target.value);
            renderColorStops();
            updateGradient();
          });
        });

        document.querySelectorAll('.remove-stop').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            colorStops.splice(index, 1);
            renderColorStops();
            updateGradient();
          });
        });
      }

      // Update Gradient
      function updateGradient() {
        const stops = colorStops
          .sort((a, b) => a.position - b.position)
          .map(stop => \`\${stop.color} \${stop.position}%\`)
          .join(', ');

        let gradientCSS;
        if (gradientType === 'linear') {
          gradientCSS = \`linear-gradient(\${angle}deg, \${stops})\`;
        } else {
          gradientCSS = \`radial-gradient(\${radialShape} at \${radialPosition}, \${stops})\`;
        }

        previewEl.style.background = gradientCSS;

        // Update CSS output
        cssOutputEl.textContent = \`background: \${gradientCSS};\`;
      }

      // Copy CSS
      document.getElementById('copy-css-btn').addEventListener('click', async () => {
        const css = cssOutputEl.textContent;
        try {
           await navigator.clipboard.writeText(css);
           const btn = document.getElementById('copy-css-btn');
            btn.textContent = _t('tools.css-gradient.js.text0', '✓ Copied!');
            btn.classList.remove('bg-primary-700', 'hover:bg-primary-800');
            btn.classList.add('bg-success-600', 'hover:bg-success-700');
            if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
            setTimeout(() => {
              btn.textContent = _t('tools.css-gradient.js.text1', '📋 Copy CSS');
              btn.classList.remove('bg-success-600', 'hover:bg-success-700');
              btn.classList.add('bg-primary-700', 'hover:bg-primary-800');
            }, 2000);
          } catch (err) {
            const btn = document.getElementById('copy-css-btn');
            btn.textContent = 'Copy failed';
            btn.classList.remove('bg-primary-700', 'hover:bg-primary-800');
            btn.classList.add('bg-error-600', 'hover:bg-error-700');
            setTimeout(() => {
              btn.textContent = _t('tools.css-gradient.js.text1', '📋 Copy CSS');
              btn.classList.remove('bg-error-600', 'hover:bg-error-700');
              btn.classList.add('bg-primary-700', 'hover:bg-primary-800');
            }, 2000);
         }
      });

      // Preset Gradients
      const presets = {
        sunset: { type: 'linear', angle: 135, stops: [{color: '#ff6b6b', position: 0}, {color: '#feca57', position: 100}] },
        ocean: { type: 'linear', angle: 135, stops: [{color: '#667eea', position: 0}, {color: '#764ba2', position: 100}] },
        forest: { type: 'linear', angle: 135, stops: [{color: '#11998e', position: 0}, {color: '#38ef7d', position: 100}] },
        fire: { type: 'linear', angle: 135, stops: [{color: '#ee0979', position: 0}, {color: '#ff6a00', position: 100}] },
        sky: { type: 'linear', angle: 135, stops: [{color: '#2196f3', position: 0}, {color: '#00bcd4', position: 100}] },
        rose: { type: 'linear', angle: 135, stops: [{color: '#f857a6', position: 0}, {color: '#ff5858', position: 100}] }
      };

      document.querySelectorAll('.preset-card').forEach(card => {
        card.addEventListener('click', () => {
          const preset = presets[card.dataset.preset];
          gradientType = preset.type;
          angle = preset.angle;
          colorStops = JSON.parse(JSON.stringify(preset.stops));

          angleSlider.value = angle;
          angleValue.textContent = angle;

          if (gradientType === 'linear') {
            document.getElementById('type-linear').click();
          } else {
            document.getElementById('type-radial').click();
          }

          renderColorStops();
          updateGradient();
        });
      });

      // Initialize
      document.addEventListener('DOMContentLoaded', () => {
        renderColorStops();
        updateGradient();
      });
    </script>
  `;

  const customStyles = `
    <style>
      .color-stop {
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
        transition: all 0.2s;
      }

       .color-stop:hover {
         border-color: var(--primary-500, #3b82f6);
         box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
       }

       .dark .color-stop {
         border-color: var(--surface-700, #374151);
       }

       .dark .color-stop:hover {
         border-color: var(--primary-400, #60a5fa);
         box-shadow: 0 4px 12px rgba(96, 165, 250, 0.1);
       }

      .gradient-preview {
        min-height: 300px;
        border-radius: 12px;
        transition: all 0.3s;
      }

      .preset-card {
        height: 80px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        border: 2px solid transparent;
      }

       .preset-card:hover {
         transform: scale(1.05);
         border-color: var(--primary-500, #3b82f6);
       }

       .dark .preset-card:hover {
         border-color: var(--primary-400, #60a5fa);
       }
    </style>
  `;

  return createPageTemplate({
    title: 'Gradient Generator',
    description: 'Create beautiful CSS gradients with interactive editor. Linear and radial gradients with live preview and code export.',
    path: '/css-gradient',
    content: customStyles + pageContent
  });
}

/**
 * Route handler for CSS Gradient Generator
 */
export async function handleCSSGradientRoutes(request, url) {
  const pathname = url.pathname;

  try {
    if (pathname === '/css-gradient' || pathname === '/css-gradient/' || pathname === '/css-gradient-generator' || pathname === '/css-gradient-generator/') {
      return respondHTML(renderCSSGradientPage());
    }
    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('CSS Gradient Generator Error:', error);
    // Return a basic error response if rendering fails
    return new Response('Internal Server Error: ' + error.message, { status: 500 });
  }
}
