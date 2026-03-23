/**
 * Color Converter Tool
 * Convert between HEX, RGB, HSL, and other color formats
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleColorConverterRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === '/color-converter' || pathname === '/color-converter/') {
      if (method === 'GET') {
        return renderColorConverterPage(resolveRequestLanguage(request, url));
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

function renderColorConverterPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('color-converter', currentLang);
  const toolHeader = createToolHeader(
    { emoji: '🎨' },
    translation?.name || 'Color Converter',
    translation?.desc || 'Convert between HEX, RGB, HSL, and other color formats with live preview',
    [{ text: translation?.ui?.badge6 || 'Live Preview', color: 'pink', tooltip: 'Updates the color preview and conversion values instantly as you edit inputs.' }],
    { toolId: 'color-converter' }
  );

  const currentTool = TOOLS.find(t => t.id === 'color-converter');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];
  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">

        ${toolHeader}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <!-- Controls -->
          <div class="space-y-6">
            <!-- Canvas Color Picker -->
            <div>
              <label class="label mb-3"><span data-i18n="tools.color-converter.ui.label0">Pick a Color</span></label>
              <div class="flex gap-3 items-start">
                <!-- Saturation/Brightness square -->
                <div class="relative flex-1">
                  <canvas id="sb-canvas" width="280" height="280" class="w-full aspect-square rounded-lg cursor-crosshair border border-surface-200 dark:border-surface-700 shadow-sm" aria-label="Saturation and brightness picker"></canvas>
                  <div id="sb-cursor" class="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none" style="top:10px;left:268px;box-shadow:0 0 0 1px rgba(0,0,0,.3), 0 2px 4px rgba(0,0,0,.3);"></div>
                </div>
                <!-- Hue vertical slider -->
                <div class="relative" style="width:2rem;">
                  <canvas id="hue-canvas" width="32" height="280" class="w-full rounded-lg cursor-pointer border border-surface-200 dark:border-surface-700 shadow-sm" style="height:100%;aspect-ratio:32/280;" aria-label="Hue slider"></canvas>
                  <div id="hue-cursor" class="absolute left-0 right-0 h-2 rounded-sm border-2 border-white shadow-md pointer-events-none" style="top:134px;box-shadow:0 0 0 1px rgba(0,0,0,.3), 0 1px 3px rgba(0,0,0,.3);"></div>
                </div>
              </div>
            </div>

            <!-- Fallback native picker + Manual Input -->
            <div class="flex gap-4 items-end">
              <div class="flex-shrink-0">
                <label for="color-picker" class="label mb-1 text-xs"><span data-i18n="tools.color-converter.ui.label0">Native</span></label>
                <input type="color" id="color-picker" value="#3b82f6" class="w-10 h-10 rounded-lg cursor-pointer border border-surface-200 dark:border-surface-700 shadow-sm">
              </div>
              <div class="flex-1 space-y-1">
                <label for="manual-input" class="label"><span data-i18n="tools.color-converter.ui.label1">Manual Input</span></label>
                <input type="text" id="manual-input" placeholder="#FF5733 or rgb(255,87,51) or hsl(14,100%,60%)" data-i18n-placeholder="tools.color-converter.ui.placeholder3" class="input font-mono" data-tooltip="Enter any color format: #hex, rgb(), or hsl()" data-i18n-tooltip="tools.color-converter.ui.tip0">
                <p class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.color-converter.ui.desc4">Supports #hex, rgb(r,g,b), hsl(h,s,l)</p>
              </div>
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
                  <span class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-tooltip="6-digit hexadecimal color code" data-i18n-tooltip="tools.color-converter.ui.tip1">HEX</span>
                   <button data-copy-target="hex-value" class="copy-btn text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" aria-label="Copy HEX color value">
                     <span class="material-symbols-rounded text-sm" data-i18n="tools.color-converter.ui.desc5">content_copy</span>
                   </button>
                </div>
                <div id="hex-value" class="text-base font-mono font-bold text-surface-900 dark:text-white break-all">#3b82f6</div>
              </div>

              <div class="card p-4">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-tooltip="Red, Green, Blue — 0 to 255 each" data-i18n-tooltip="tools.color-converter.ui.tip2">RGB</span>
                   <button data-copy-target="rgb-value" class="copy-btn text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" aria-label="Copy RGB color value">
                     <span class="material-symbols-rounded text-sm" data-i18n="tools.color-converter.ui.desc5">content_copy</span>
                   </button>
                </div>
                <div id="rgb-value" class="text-base font-mono font-bold text-surface-900 dark:text-white break-all">rgb(59, 130, 246)</div>
              </div>

              <div class="card p-4">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-tooltip="Hue 0-360°, Saturation 0-100%, Lightness 0-100%" data-i18n-tooltip="tools.color-converter.ui.tip3">HSL</span>
                   <button data-copy-target="hsl-value" class="copy-btn text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" aria-label="Copy HSL color value">
                     <span class="material-symbols-rounded text-sm" data-i18n="tools.color-converter.ui.desc5">content_copy</span>
                   </button>
                </div>
                <div id="hsl-value" class="text-base font-mono font-bold text-surface-900 dark:text-white break-all">hsl(217, 91%, 60%)</div>
              </div>

              <div class="card p-4">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide">HSV</span>
                   <button data-copy-target="hsv-value" class="copy-btn text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" aria-label="Copy HSV color value">
                     <span class="material-symbols-rounded text-sm" data-i18n="tools.color-converter.ui.desc5">content_copy</span>
                   </button>
                </div>
                <div id="hsv-value" class="text-base font-mono font-bold text-surface-900 dark:text-white break-all">hsv(217, 76%, 96%)</div>
              </div>
            </div>
          </div>

        </div>

        <span id="color-live" role="status" class="sr-only"></span>
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'Color Models Explained (HEX/RGB/HSL)',
          content: '<p>Color models are mathematical systems for representing colors. <strong>HEX</strong> (Hexadecimal) is a 6-digit code used in HTML and CSS, representing Red, Green, and Blue components. <strong>RGB</strong> (Red, Green, Blue) uses decimal values from 0 to 255 for each channel, often used in digital imaging.</p><p><strong>HSL</strong> (Hue, Saturation, Lightness) is more intuitive for humans, as it describes color in terms of its base pigment (Hue), intensity (Saturation), and brightness (Lightness). Understanding these models helps in choosing the right format for your design and development needs, ensuring consistency across different platforms and devices.</p>'
        },
        {
          title: 'How to Use This Tool',
          content: '<ol><li>Use the visual color picker to select a color by dragging the cursor in the saturation/brightness square and the hue slider.</li><li>Alternatively, enter a specific value in the "Manual Input" field (supports #hex, rgb, or hsl formats).</li><li>Observe the "Preview" box to see the selected color in real-time.</li><li>View the converted values in the HEX, RGB, HSL, and HSV cards below.</li><li>Click the "Copy" icon on any card to save that specific format to your clipboard.</li></ol>'
        },
        {
          title: 'Common Use Cases',
          content: '<ul><li><strong>Web Design:</strong> Convert colors from design tools (often RGB/HSL) to HEX codes for use in CSS stylesheets.</li><li><strong>Brand Consistency:</strong> Ensure your brand colors are accurately represented across different digital formats and media.</li><li><strong>UI Development:</strong> Quickly generate lighter or darker variations of a base color by adjusting the Lightness value in HSL.</li><li><strong>Accessibility Testing:</strong> Use the preview to check if your chosen colors provide enough contrast for readable text and UI elements.</li></ul>'
        },
        {
          title: 'Pro Tips',
          content: '<ul><li>Use HSL when designing UI components like buttons, as it makes it easy to create hover states by simply adjusting the lightness value.</li><li>When working with transparency in CSS, prefer <code>rgba()</code> or <code>hsla()</code> for better readability and control over the alpha channel.</li><li>Always check for color contrast ratios to ensure your designs are accessible to users with visual impairments.</li></ul>'
        }
      ], 'color-converter')}
    </div>
    ${createRelatedToolsSection(relatedToolsData)}
  `

  const script = `
    <script>
      const picker = document.getElementById('color-picker');
      const preview = document.getElementById('color-preview');
      const manualInput = document.getElementById('manual-input');

      /* ===== Canvas Elements ===== */
      const sbCanvas = document.getElementById('sb-canvas');
      const sbCtx = sbCanvas.getContext('2d', { willReadFrequently: true });
      const sbCursor = document.getElementById('sb-cursor');
      const hueCanvas = document.getElementById('hue-canvas');
      const hueCtx = hueCanvas.getContext('2d');
      const hueCursor = document.getElementById('hue-cursor');

      /* Current HSV state */
      let currentH = 217, currentS = 76, currentV = 96;

      /* ===== Color Conversion Helpers ===== */
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

      function hsvToRgb(h, s, v) {
        h /= 360; s /= 100; v /= 100;
        let r, g, b;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        switch (i % 6) {
          case 0: r = v; g = t; b = p; break;
          case 1: r = q; g = v; b = p; break;
          case 2: r = p; g = v; b = t; break;
          case 3: r = p; g = q; b = v; break;
          case 4: r = t; g = p; b = v; break;
          case 5: r = v; g = p; b = q; break;
        }
        return {
          r: Math.round(r * 255),
          g: Math.round(g * 255),
          b: Math.round(b * 255)
        };
      }

      /* ===== Draw Hue Strip ===== */
      function drawHueStrip() {
        const w = hueCanvas.width;
        const h = hueCanvas.height;
        const gradient = hueCtx.createLinearGradient(0, 0, 0, h);
        for (let i = 0; i <= 6; i++) {
          gradient.addColorStop(i / 6, 'hsl(' + (i * 60) + ', 100%, 50%)');
        }
        hueCtx.fillStyle = gradient;
        hueCtx.fillRect(0, 0, w, h);
      }

      /* ===== Draw SB Square ===== */
      function drawSBSquare(hue) {
        const w = sbCanvas.width;
        const h = sbCanvas.height;
        // Base hue color
        const hueRgb = hsvToRgb(hue, 100, 100);
        const baseColor = 'rgb(' + hueRgb.r + ',' + hueRgb.g + ',' + hueRgb.b + ')';

        // White to hue (left to right = saturation)
        const gradH = sbCtx.createLinearGradient(0, 0, w, 0);
        gradH.addColorStop(0, '#ffffff');
        gradH.addColorStop(1, baseColor);
        sbCtx.fillStyle = gradH;
        sbCtx.fillRect(0, 0, w, h);

        // Transparent to black (top to bottom = brightness)
        const gradV = sbCtx.createLinearGradient(0, 0, 0, h);
        gradV.addColorStop(0, 'rgba(0,0,0,0)');
        gradV.addColorStop(1, 'rgba(0,0,0,1)');
        sbCtx.fillStyle = gradV;
        sbCtx.fillRect(0, 0, w, h);
      }

      /* ===== Update Cursors ===== */
      function updateSBCursor() {
        const rect = sbCanvas.getBoundingClientRect();
        const x = (currentS / 100) * rect.width;
        const y = (1 - currentV / 100) * rect.height;
        sbCursor.style.left = (x - 8) + 'px';
        sbCursor.style.top = (y - 8) + 'px';
        // Contrast border
        const rgb = hsvToRgb(currentH, currentS, currentV);
        const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        sbCursor.style.borderColor = lum > 0.5 ? '#000' : '#fff';
      }

      function updateHueCursor() {
        const rect = hueCanvas.getBoundingClientRect();
        const y = (currentH / 360) * rect.height;
        hueCursor.style.top = (y - 4) + 'px';
      }

      /* ===== Sync All From HSV ===== */
      function syncFromHSV(skipCanvasRedraw) {
        if (!skipCanvasRedraw) drawSBSquare(currentH);
        updateSBCursor();
        updateHueCursor();

        const rgb = hsvToRgb(currentH, currentS, currentV);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

        picker.value = hex;
        updateColors(hex);
      }

      /* ===== SB Canvas Interaction ===== */
      let sbDragging = false;

      function handleSBPick(e) {
        const rect = sbCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        currentS = Math.round(x * 100);
        currentV = Math.round((1 - y) * 100);
        syncFromHSV(true);
      }

      sbCanvas.addEventListener('mousedown', (e) => { sbDragging = true; handleSBPick(e); });
      sbCanvas.addEventListener('touchstart', (e) => { sbDragging = true; handleSBPick(e); e.preventDefault(); }, { passive: false });
      window.addEventListener('mousemove', (e) => { if (sbDragging) handleSBPick(e); });
      window.addEventListener('touchmove', (e) => { if (sbDragging) handleSBPick(e); }, { passive: true });
      window.addEventListener('mouseup', () => { sbDragging = false; });
      window.addEventListener('touchend', () => { sbDragging = false; });

      /* ===== Hue Canvas Interaction ===== */
      let hueDragging = false;

      function handleHuePick(e) {
        const rect = hueCanvas.getBoundingClientRect();
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        currentH = Math.round(y * 360);
        syncFromHSV(false);
      }

      hueCanvas.addEventListener('mousedown', (e) => { hueDragging = true; handleHuePick(e); });
      hueCanvas.addEventListener('touchstart', (e) => { hueDragging = true; handleHuePick(e); e.preventDefault(); }, { passive: false });
      window.addEventListener('mousemove', (e) => { if (hueDragging) handleHuePick(e); });
      window.addEventListener('touchmove', (e) => { if (hueDragging) handleHuePick(e); }, { passive: true });
      window.addEventListener('mouseup', () => { hueDragging = false; });
      window.addEventListener('touchend', () => { hueDragging = false; });

      /* ===== Display Updates ===== */
      const colorLive = document.getElementById('color-live');
      let _colorAnnounce;

      function updateColors(hex) {
        const rgb = hexToRgb(hex);
        if (!rgb) return;

        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

        preview.style.backgroundColor = hex;
        document.getElementById('hex-value').textContent = hex.toUpperCase();
        document.getElementById('rgb-value').textContent = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
        document.getElementById('hsl-value').textContent = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)';
        document.getElementById('hsv-value').textContent = 'hsv(' + hsv.h + ', ' + hsv.s + '%, ' + hsv.v + '%)';

        clearTimeout(_colorAnnounce);
        _colorAnnounce = setTimeout(() => { colorLive.textContent = hex.toUpperCase(); }, 400);
      }

      picker.addEventListener('input', (e) => {
        const hex = e.target.value;
        const rgb = hexToRgb(hex);
        if (rgb) {
          const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
          currentH = hsv.h; currentS = hsv.s; currentV = hsv.v;
          syncFromHSV(false);
        }
      });

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
          const rgb = hexToRgb(hex);
          if (rgb) {
            const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
            currentH = hsv.h; currentS = hsv.s; currentV = hsv.v;
            syncFromHSV(false);
          }
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
             if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
             // Fallback
             const original = copyBtn.innerHTML;
             copyBtn.innerHTML = '✓';
             setTimeout(() => copyBtn.innerHTML = original, 2000);
          }
        }
      });

      /* ===== Init ===== */
      drawHueStrip();
      syncFromHSV(false);
    </script>
  `

  return respondHTML(createPageTemplate({
    title: translation?.name || 'Color Converter',
    description: translation?.desc || 'Convert HEX, RGB, and HSL colors.',
    path: '/color-converter',
    content,
    scripts: script,
    lang: currentLang
  }));
}
