/**
 * QR Code Generator & Decoder Tool
 * Client-side QR code generation and decoding
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';

export async function handleQRCodeRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === '/qr-code' || pathname === '/qr-code/') {
      if (method === 'GET') {
        return renderQRCodePage();
      }
    }

    return respondJSON({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('QR Code Route Error:', error);
    return respondJSON(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function renderQRCodePage() {
  const toolHeader = createToolHeader(
    { emoji: '📱' },
    'QR Code Studio',
    'Create and decode QR codes instantly for URLs, text, WiFi credentials, and more.',
    [{ text: 'Privacy First', color: 'purple', tooltip: 'All processing happens in your browser — no data is sent to any server.' }],
    { toolId: 'qr-code' }
  );

  const content = `
    <!-- QR Code Libraries -->
    <script src="/vendor/qrcode.min.js" integrity="sha384-B3w4ObQEXH2D3E8FlVZ+pBTHHTrPFwqbXjfU/95D5ekt8DVTeG+cB6s6nVpsvh3m" crossorigin="anonymous"></script>
    <script src="/vendor/jsqr.min.js" integrity="sha384-b5Ya4Bq3qCyz39m2ISh+4DxjAIljdeFwK/BsXLuj9gugaNwAcj/ia15fxNZL9Nlx" crossorigin="anonymous"></script>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">

        ${toolHeader}

        <!-- Tabs -->
        <div class="border-b border-surface-200 dark:border-surface-700 mb-8">
          <nav class="flex flex-wrap gap-2" aria-label="QR code tool modes" role="tablist">
            <button id="tab-trigger-generate" class="tab-button active px-4 py-2 border-b-2 border-primary-600 font-medium text-sm text-primary-600 dark:text-primary-400 transition-colors" data-tab="generate" role="tab" aria-controls="tab-generate" aria-selected="true" tabindex="0">
              <span class="material-symbols-rounded text-base align-middle">qr_code_2</span> Generate
            </button>
            <button id="tab-trigger-decode" class="tab-button px-4 py-2 border-b-2 border-transparent font-medium text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 transition-colors" data-tab="decode" role="tab" aria-controls="tab-decode" aria-selected="false" tabindex="-1">
              <span class="material-symbols-rounded text-base align-middle">qr_code_scanner</span> Decode
            </button>
          </nav>
        </div>

        <!-- Generate Tab -->
        <div id="tab-generate" class="tab-content" role="tabpanel" aria-labelledby="tab-trigger-generate">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Left: Controls -->
            <div class="space-y-6">
              <div>
                <label for="qr-data" class="label"><span data-i18n="tools.qr-code.ui.label4">Text or URL to Encode</span></label>
                <textarea id="qr-data" rows="4" data-tooltip="Text or URL to encode as QR code" placeholder="Enter URL, text, or any content..." data-i18n-placeholder="tools.qr-code.ui.placeholder12" class="input resize-vertical font-mono"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="qr-size" class="label">
                    Size: <span id="size-value" class="font-bold text-primary-600 dark:text-primary-400">256</span>px
                  </label>
                  <input type="range" id="qr-size" min="128" data-tooltip="Output image size in pixels" max="512" value="256" step="64" class="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-600">
                </div>

                <div>
                  <label for="qr-error-correction" class="label"><span data-i18n="tools.qr-code.ui.label5">Error Correction</span></label>
                  <select id="qr-error-correction" class="input" data-tooltip="Higher correction = more damage resistance but larger QR code">
                    <option value="L" data-i18n="tools.qr-code.ui.option13">Low (7%)</option>
                    <option value="M" selected data-i18n="tools.qr-code.ui.option14">Medium (15%)</option>
                    <option value="Q" data-i18n="tools.qr-code.ui.option15">Quartile (25%)</option>
                    <option value="H" data-i18n="tools.qr-code.ui.option16">High (30%)</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="qr-fg-color" class="label"><span data-i18n="tools.qr-code.ui.label6">Foreground</span></label>
                  <div class="flex gap-2">
                    <input type="color" id="qr-fg-color" value="#000000" aria-label="Foreground color picker" class="w-10 h-10 rounded cursor-pointer border border-surface-300 dark:border-surface-600 p-0.5">
                    <input type="text" id="qr-fg-text" value="#000000" aria-label="Foreground color hex value" class="input font-mono text-sm">
                  </div>
                </div>

                <div>
                  <label for="qr-bg-color" class="label"><span data-i18n="tools.qr-code.ui.label7">Background</span></label>
                  <div class="flex gap-2">
                    <input type="color" id="qr-bg-color" value="#ffffff" aria-label="Background color picker" class="w-10 h-10 rounded cursor-pointer border border-surface-300 dark:border-surface-600 p-0.5">
                    <input type="text" id="qr-bg-text" value="#ffffff" aria-label="Background color hex value" class="input font-mono text-sm">
                  </div>
                </div>
              </div>

              <div id="qr-error-msg" role="alert" class="hidden p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800 text-sm"></div>

              <button id="generate-qr" class="btn btn-primary" data-tooltip="Generate QR code from the input text or URL" w-full py-4 text-lg">
                <span data-i18n="tools.qr-code.ui.button0">Generate QR Code</span>
              </button>

              <div class="flex gap-3">
                <button id="download-qr-png" class="btn btn-secondary flex-1" disabled>
                  <span data-i18n="tools.qr-code.ui.button1">💾 PNG</span>
                </button>
                <button id="download-qr-svg" class="btn btn-secondary flex-1" disabled>
                  <span data-i18n="tools.qr-code.ui.button2">💾 SVG</span>
                </button>
              </div>
            </div>

            <!-- Right: Preview -->
            <div>
              <label class="label"><span data-i18n="tools.qr-code.ui.label8">Preview</span></label>
              <div id="qr-preview" class="bg-surface-50 dark:bg-surface-950 rounded-xl p-8 text-center border-2 border-surface-200 dark:border-surface-800 min-h-[400px] flex items-center justify-center">
                <div class="text-surface-400 dark:text-surface-500">
                  <span class="material-symbols-rounded text-6xl mb-4">qr_code_2</span>
                  <p class="text-lg font-medium">Enter text to generate</p>
                </div>
                <canvas id="qr-canvas" class="hidden mx-auto"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Decode Tab -->
        <div id="tab-decode" class="tab-content hidden" role="tabpanel" aria-labelledby="tab-trigger-decode">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Left: Upload -->
            <div class="space-y-6">
              <div>
                <label for="qr-upload" class="label"><span data-i18n="tools.qr-code.ui.label9">Upload Image</span></label>
                <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-surface-300 dark:border-surface-700 border-dashed rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors group cursor-pointer relative bg-surface-50 dark:bg-surface-900">
                  <input id="qr-upload" type="file" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                  <div class="space-y-1 text-center pointer-events-none">
                    <span class="material-symbols-rounded text-4xl text-surface-400 group-hover:text-primary-500 transition-colors" data-i18n="tools.qr-code.ui.desc17">upload_file</span>
                    <div class="flex text-sm text-surface-600 dark:text-surface-400 justify-center">
                      <span class="font-medium text-primary-600 dark:text-primary-400 group-hover:underline">Upload a file</span>
                      <p class="pl-1">or drag and drop</p>
                    </div>
                    <p class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.qr-code.ui.desc18">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>

              <button id="decode-qr" class="btn btn-primary w-full py-4 text-lg" disabled>
                <span data-i18n="tools.qr-code.ui.button3">Decode QR Code</span>
              </button>

              <div id="qr-decode-result" class="hidden">
                <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                      <p class="text-sm text-surface-600 dark:text-surface-400 mb-2" data-i18n="tools.qr-code.ui.desc19">Decoded Text:</p>
                      <p id="qr-decode-output" class="text-lg font-mono font-bold text-surface-900 dark:text-white break-all"></p>
                    </div>
                    <button id="copy-decoded" class="btn btn-secondary flex-shrink-0">
                      <span class="material-symbols-rounded">content_copy</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Preview -->
            <div>
              <label class="label"><span data-i18n="tools.qr-code.ui.label10">Image Preview</span></label>
              <div id="decode-preview" class="bg-surface-50 dark:bg-surface-950 rounded-xl p-8 text-center border-2 border-surface-200 dark:border-surface-800 min-h-[400px] flex items-center justify-center overflow-hidden">
                <div class="text-surface-400 dark:text-surface-500">
                  <span class="material-symbols-rounded text-6xl mb-4">image_search</span>
                  <p class="text-lg font-medium">Upload an image to decode</p>
                </div>
                <img id="decode-image" class="hidden max-w-full max-h-[350px] rounded-lg object-contain" alt="QR Code to decode">
                <canvas id="qr-decode-canvas" style="display: none;"></canvas>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  `;

  const script = `
    <script>
      // Tab switching with accessibility enhancements
      const tabList = document.querySelector('[role="tablist"]');
      const tabButtons = tabList ? Array.from(tabList.querySelectorAll('.tab-button')) : [];

      const activateTab = (button) => {
        if (!button) return;

        const targetId = button.dataset.tab;
        const targetPanelId = 'tab-' + targetId;

        tabButtons.forEach((btn) => {
          const isTarget = btn === button;
          btn.classList.toggle('active', isTarget);
          btn.classList.toggle('border-primary-600', isTarget);
          btn.classList.toggle('text-primary-600', isTarget);
          btn.classList.toggle('dark:text-primary-400', isTarget);
          btn.classList.toggle('border-transparent', !isTarget);
          
          btn.setAttribute('aria-selected', String(isTarget));
          btn.setAttribute('tabindex', isTarget ? '0' : '-1');
        });

        document.querySelectorAll('.tab-content').forEach(panel => {
           const isTarget = panel.id === targetPanelId;
           panel.classList.toggle('hidden', !isTarget);
           panel.setAttribute('aria-hidden', String(!isTarget));
        });

        button.focus({ preventScroll: true });
      };

      tabButtons.forEach((button, index) => {
        button.addEventListener('click', () => activateTab(button));
        button.addEventListener('keydown', (event) => {
          const { key } = event;
          const lastIndex = tabButtons.length - 1;

          if (key === 'ArrowRight' || key === 'ArrowLeft') {
            event.preventDefault();
            const direction = key === 'ArrowRight' ? 1 : -1;
            const nextIndex = (index + direction + tabButtons.length) % tabButtons.length;
            activateTab(tabButtons[nextIndex]);
          } else if (key === 'Home') {
            event.preventDefault();
            activateTab(tabButtons[0]);
          } else if (key === 'End') {
            event.preventDefault();
            activateTab(tabButtons[lastIndex]);
          }
        });
      });

      // ========== QR CODE GENERATION ==========
      const sizeSlider = document.getElementById('qr-size');
      const sizeValue = document.getElementById('size-value');
      sizeSlider.addEventListener('input', (e) => {
        sizeValue.textContent = e.target.value;
      });

      // Color sync
      const fgColor = document.getElementById('qr-fg-color');
      const fgText = document.getElementById('qr-fg-text');
      const bgColor = document.getElementById('qr-bg-color');
      const bgText = document.getElementById('qr-bg-text');

      fgColor.addEventListener('input', (e) => fgText.value = e.target.value);
      fgText.addEventListener('input', (e) => fgColor.value = e.target.value);
      bgColor.addEventListener('input', (e) => bgText.value = e.target.value);
      bgText.addEventListener('input', (e) => bgColor.value = e.target.value);

      let currentQRDataURL = null;
      let currentSVGMarkup = null;

      async function generateQRCode(data, size, errorCorrection, fg, bg, canvas) {
        if (!window.QRCode) {
          throw new Error('QR code library failed to load.');
        }

        const svg = await window.QRCode.toString(data, {
          type: 'svg',
          errorCorrectionLevel: errorCorrection,
          color: { dark: fg, light: bg },
          margin: 2,
          width: size
        });

        await window.QRCode.toCanvas(canvas, data, {
          errorCorrectionLevel: errorCorrection,
          color: { dark: fg, light: bg },
          margin: 2,
          width: size
        });

        return { svg, pngDataUrl: canvas.toDataURL('image/png') };
      }

      const generateButton = document.getElementById('generate-qr');
      const generateButtonOriginalHTML = generateButton.innerHTML;

      generateButton.addEventListener('click', async () => {
        const data = document.getElementById('qr-data').value.trim();
        if (!data) {
          const errMsg = document.getElementById('qr-error-msg');
          if (errMsg) {
            errMsg.textContent = 'Please enter text or URL to encode.';
            errMsg.classList.remove('hidden');
          }
          return;
        }

        const canvas = document.getElementById('qr-canvas');
        const size = parseInt(sizeSlider.value);
        const errorCorrection = document.getElementById('qr-error-correction').value;
        const fg = fgText.value;
        const bg = bgText.value;

        generateButton.disabled = true;
        generateButton.innerHTML = 'Generating...';

        try {
          const errMsg = document.getElementById('qr-error-msg');
          if (errMsg) errMsg.classList.add('hidden');
          const result = await generateQRCode(data, size, errorCorrection, fg, bg, canvas);
          currentSVGMarkup = result.svg;
          currentQRDataURL = result.pngDataUrl;

          // Show canvas, hide placeholder
          document.querySelector('#qr-preview > div').classList.add('hidden');
          canvas.classList.remove('hidden');

          // Enable download buttons
          document.getElementById('download-qr-png').disabled = false;
          document.getElementById('download-qr-svg').disabled = false;
        } catch (error) {
          const errMsg = document.getElementById('qr-error-msg');
          if (errMsg) {
            errMsg.textContent = 'Error generating QR code: ' + error.message;
            errMsg.classList.remove('hidden');
          }
          currentQRDataURL = null;
          currentSVGMarkup = null;
        } finally {
          generateButton.disabled = false;
          generateButton.innerHTML = generateButtonOriginalHTML;
        }
      });

      // Download PNG
      document.getElementById('download-qr-png').addEventListener('click', () => {
        if (!currentQRDataURL) return;

        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = currentQRDataURL;
        link.click();
      });

      // Download SVG
      document.getElementById('download-qr-svg').addEventListener('click', () => {
        if (!currentSVGMarkup) return;

        const blob = new Blob([currentSVGMarkup], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'qrcode.svg';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });

      // ========== QR CODE DECODING ==========
      const uploadInput = document.getElementById('qr-upload');
      const decodeButton = document.getElementById('decode-qr');
      const decodeImage = document.getElementById('decode-image');
      const decodeCanvas = document.getElementById('qr-decode-canvas');
      const decodeResult = document.getElementById('qr-decode-result');
      const decodeOutput = document.getElementById('qr-decode-output');

      uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          decodeImage.src = event.target.result;
          decodeImage.classList.remove('hidden');
          document.querySelector('#decode-preview > div').classList.add('hidden');
          decodeButton.disabled = false;
          decodeResult.classList.add('hidden');
        };
        reader.readAsDataURL(file);
      });

      decodeButton.addEventListener('click', () => {
        if (!decodeImage.src) return;

        const ctx = decodeCanvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          decodeCanvas.width = img.width;
          decodeCanvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, decodeCanvas.width, decodeCanvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            decodeOutput.textContent = code.data;
            decodeResult.classList.remove('hidden');
          } else {
            alert('No QR code found in the image. Please try another image.');
          }
        };

        img.src = decodeImage.src;
      });

      // Copy decoded text
      document.getElementById('copy-decoded').addEventListener('click', async () => {
        const text = decodeOutput.textContent;
        
        if(window.copyToClipboard) {
            window.copyToClipboard(text, document.getElementById('copy-decoded'));
        } else {
            await navigator.clipboard.writeText(text);
            alert('Copied!');
        }
      });
    </script>
  `;

  return respondHTML(createPageTemplate({
    title: 'QR Code Studio',
    description: 'Create and decode QR codes for URLs, text, WiFi credentials, and more with customization options.',
    path: '/qr-code',
    content,
    scripts: script
  }));
}
