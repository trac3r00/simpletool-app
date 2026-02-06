/**
 * Color Converter Tool
 * Convert between HEX, RGB, HSL, and other color formats
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';

export async function handleColorConverterRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === '/color-converter' || pathname === '/color-converter/') {
      if (method === 'GET') {
        return renderColorConverterPage();
      }
    }

    return respondJSON({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Color Converter Route Error:', error);
    return respondJSON(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function renderColorConverterPage() {
  const toolHeader = createToolHeader(
    { emoji: '🎨' },
    'Color Converter',
    'Convert between HEX, RGB, HSL, and other color formats with live preview',
    [{ text: 'Live Preview', color: 'pink', tooltip: 'Updates the color preview and conversion values instantly as you edit inputs.' }],
    { toolId: 'color-converter' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">

        ${toolHeader}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <!-- Controls -->
          <div class="space-y-6">
            <!-- Color Picker -->
            <div class="text-center">
              <label for="color-picker" class="label mb-4"><span data-i18n="tools.color-converter.ui.label0">Pick a Color</span></label>
              <input type="color" id="color-picker" value="#3b82f6" class="w-32 h-32 mx-auto rounded-xl cursor-pointer border-4 border-surface-200 dark:border-surface-700 shadow-sm transition-transform hover:scale-105">
            </div>

            <!-- Manual Input -->
            <div class="space-y-2">
              <label for="manual-input" class="label"><span data-i18n="tools.color-converter.ui.label1">Manual Input</span></label>
              <input type="text" id="manual-input" placeholder="#FF5733 or rgb(255,87,51) or hsl(14,100%,60%)" data-i18n-placeholder="tools.color-converter.ui.placeholder3" class="input font-mono" data-tooltip="Enter any color format: #hex, rgb(), or hsl()">
              <p class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.color-converter.ui.desc4">Supports #hex, rgb(r,g,b), hsl(h,s,l)</p>
            </div>
          </div>

          <!-- Results -->
          <div class="space-y-6">
            <!-- Color Preview -->
            <div>
              <label class="label"><span data-i18n="tools.color-converter.ui.label2">Preview</span></label>
              <div id="color-preview" class="h-32 rounded-xl shadow-sm border-2 border-surface-200 dark:border-surface-700 transition-colors duration-200" style="background-color: #3b82f6;"></div>
            </div>

            <!-- Conversion Values -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="card p-4">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-tooltip="6-digit hexadecimal color code">HEX</span>
                  <button data-copy-target="hex-value" class="copy-btn text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    <span class="material-symbols-rounded text-sm" data-i18n="tools.color-converter.ui.desc5">content_copy</span>
                  </button>
                </div>
                <div id="hex-value" class="text-base font-mono font-bold text-surface-900 dark:text-white break-all">#3b82f6</div>
              </div>

              <div class="card p-4">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-tooltip="Red, Green, Blue — 0 to 255 each">RGB</span>
                  <button data-copy-target="rgb-value" class="copy-btn text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    <span class="material-symbols-rounded text-sm" data-i18n="tools.color-converter.ui.desc5">content_copy</span>
                  </button>
                </div>
                <div id="rgb-value" class="text-base font-mono font-bold text-surface-900 dark:text-white break-all">rgb(59, 130, 246)</div>
              </div>

              <div class="card p-4">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-tooltip="Hue 0-360°, Saturation 0-100%, Lightness 0-100%">HSL</span>
                  <button data-copy-target="hsl-value" class="copy-btn text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    <span class="material-symbols-rounded text-sm" data-i18n="tools.color-converter.ui.desc5">content_copy</span>
                  </button>
                </div>
                <div id="hsl-value" class="text-base font-mono font-bold text-surface-900 dark:text-white break-all">hsl(217, 91%, 60%)</div>
              </div>

              <div class="card p-4">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide">HSV</span>
                  <button data-copy-target="hsv-value" class="copy-btn text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    <span class="material-symbols-rounded text-sm" data-i18n="tools.color-converter.ui.desc5">content_copy</span>
                  </button>
                </div>
                <div id="hsv-value" class="text-base font-mono font-bold text-surface-900 dark:text-white break-all">hsv(217, 76%, 96%)</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  `

  const script = `
    <script>
      const picker = document.getElementById('color-picker');
      const preview = document.getElementById('color-preview');
      const manualInput = document.getElementById('manual-input');

      function hexToRgb(hex) {
        const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      }

      function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
          const hex = x.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('');
      }

      function parseRgb(str) {
        const match = str.match(/rgba?\\s*\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)/i);
        if (match) {
          return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3])
          };
        }
        return null;
      }

      function hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;
        if (s === 0) {
          r = g = b = l;
        } else {
          const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
          };

          const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          const p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
        }

        return {
          r: Math.round(r * 255),
          g: Math.round(g * 255),
          b: Math.round(b * 255)
        };
      }

      function parseHsl(str) {
        const match = str.match(/hsla?\\s*\\(\\s*(\\d+)\\s*,\\s*(\\d+)%?\\s*,\\s*(\\d+)%?/i);
        if (match) {
          return {
            h: parseInt(match[1]),
            s: parseInt(match[2]),
            l: parseInt(match[3])
          };
        }
        return null;
      }

      function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
          h = s = 0;
        } else {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
          }
        }

        return {
          h: Math.round(h * 360),
          s: Math.round(s * 100),
          l: Math.round(l * 100)
        };
      }

      function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const d = max - min;
        const s = max === 0 ? 0 : d / max;
        const v = max;

        let h;
        if (max === min) {
          h = 0;
        } else {
          switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
          }
        }

        return {
          h: Math.round(h * 360),
          s: Math.round(s * 100),
          v: Math.round(v * 100)
        };
      }

      function updateColors(hex) {
        const rgb = hexToRgb(hex);
        if (!rgb) return;

        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

        preview.style.backgroundColor = hex;
        document.getElementById('hex-value').textContent = hex.toUpperCase();
        document.getElementById('rgb-value').textContent = \`rgb(\${rgb.r}, \${rgb.g}, \${rgb.b})\`;
        document.getElementById('hsl-value').textContent = \`hsl(\${hsl.h}, \${hsl.s}%, \${hsl.l}%)\`;
        document.getElementById('hsv-value').textContent = \`hsv(\${hsv.h}, \${hsv.s}%, \${hsv.v}%)\`;
      }

      picker.addEventListener('input', (e) => updateColors(e.target.value));

      manualInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        let hex = null;

        // Try HEX format
        if (/^#?[0-9A-Fa-f]{6}$/.test(value)) {
          hex = value.startsWith('#') ? value : '#' + value;
        }
        // Try RGB format
        else if (value.toLowerCase().includes('rgb')) {
          const rgb = parseRgb(value);
          if (rgb) {
            hex = rgbToHex(rgb.r, rgb.g, rgb.b);
          }
        }
        // Try HSL format
        else if (value.toLowerCase().includes('hsl')) {
          const hsl = parseHsl(value);
          if (hsl) {
            const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
            hex = rgbToHex(rgb.r, rgb.g, rgb.b);
          }
        }

        if (hex) {
          picker.value = hex;
          updateColors(hex);
        }
      });

      // Event delegation for copy buttons
      document.addEventListener('click', async (e) => {
        const copyBtn = e.target.closest('.copy-btn');
        if (copyBtn) {
          const targetId = copyBtn.dataset.copyTarget;
          const text = document.getElementById(targetId).textContent;
          
          if(window.copyToClipboard) {
             window.copyToClipboard(text, copyBtn);
          } else {
             await navigator.clipboard.writeText(text);
             // Fallback
             const original = copyBtn.innerHTML;
             copyBtn.innerHTML = '✓';
             setTimeout(() => copyBtn.innerHTML = original, 2000);
          }
        }
      });

      updateColors('#3b82f6');
    </script>
  `

  return respondHTML(createPageTemplate({
    title: 'Color Converter',
    description: 'Convert between HEX, RGB, HSL, and other color formats with live preview.',
    path: '/color-converter',
    content,
    scripts: script
  }));
}
