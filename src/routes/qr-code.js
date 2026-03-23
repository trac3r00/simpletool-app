/**
 * QR Code Generator & Decoder Tool
 * Client-side QR code generation and decoding
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleQRCodeRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === '/qr-code' || pathname === '/qr-code/') {
      if (method === 'GET') {
        return renderQRCodePage(resolveRequestLanguage(request, url));
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

function renderQRCodePage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('qr-code', currentLang);
  const toolHeader = createToolHeader(
    { emoji: '📱' },
    translation?.name || 'QR Code Studio',
    translation?.desc || 'Create and decode QR codes instantly for URLs, text, WiFi credentials, and more.',
    [{ text: translation?.ui?.badge21 || 'Privacy First', color: 'purple', tooltip: 'All processing happens in your browser — no data is sent to any server.' }],
    { toolId: 'qr-code' }
  );

  const currentTool = TOOLS.find(t => t.id === 'qr-code');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];
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
              <span class="material-symbols-rounded text-base align-middle">qr_code_2</span> <span data-i18n="tools.qr-code.ui.tab0">Generate</span>
            </button>
            <button id="tab-trigger-decode" class="tab-button px-4 py-2 border-b-2 border-transparent font-medium text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 transition-colors" data-tab="decode" role="tab" aria-controls="tab-decode" aria-selected="false" tabindex="-1">
              <span class="material-symbols-rounded text-base align-middle">qr_code_scanner</span> <span data-i18n="tools.qr-code.ui.tab1">Decode</span>
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
                <textarea id="qr-data" rows="4" data-tooltip="Text or URL to encode as QR code" data-i18n-tooltip="tools.qr-code.ui.tip0" placeholder="Enter URL, text, or any content..." data-i18n-placeholder="tools.qr-code.ui.placeholder12" class="input resize-vertical font-mono"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="qr-size" class="label">
                    Size: <span id="size-value" class="font-bold text-primary-600 dark:text-primary-400">256</span>px
                  </label>
                  <input type="range" id="qr-size" min="128" data-tooltip="Output image size in pixels" data-i18n-tooltip="tools.qr-code.ui.tip1" max="512" value="256" step="64" class="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-600">
                </div>

                <div>
                  <label for="qr-error-correction" class="label"><span data-i18n="tools.qr-code.ui.label5">Error Correction</span></label>
                  <select id="qr-error-correction" class="input" data-tooltip="Higher correction = more damage resistance but larger QR code" data-i18n-tooltip="tools.qr-code.ui.tip2">
                    <option value="L" data-i18n="tools.qr-code.ui.option13">Low (7%)</option>
                    <option value="M" selected data-i18n="tools.qr-code.ui.option14">Medium (15%)</option>
                    <option value="Q" data-i18n="tools.qr-code.ui.option15">Quartile (25%)</option>
                    <option value="H" data-i18n="tools.qr-code.ui.option16">High (30%)</option>
                  </select>
                </div>
              </div>

              <!-- Color Pickers -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="qr-fg-color" class="label"><span data-i18n="tools.qr-code.ui.label6">Foreground Color</span></label>
                  <div class="flex gap-2 items-center">
                    <input type="color" id="qr-fg-color" value="#000000" class="h-9 w-12 cursor-pointer rounded border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 p-1">
                    <input type="text" id="qr-fg-text" value="#000000" maxlength="7" class="input flex-1 font-mono text-sm" aria-label="Foreground color hex value">
                  </div>
                </div>
                <div>
                  <label for="qr-bg-color" class="label"><span data-i18n="tools.qr-code.ui.label7">Background Color</span></label>
                  <div class="flex gap-2 items-center">
                    <input type="color" id="qr-bg-color" value="#ffffff" class="h-9 w-12 cursor-pointer rounded border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 p-1">
                    <input type="text" id="qr-bg-text" value="#ffffff" maxlength="7" class="input flex-1 font-mono text-sm" aria-label="Background color hex value">
                  </div>
                </div>
              </div>

              <!-- Generate Button -->
              <button id="generate-qr" class="btn btn-primary w-full">
                <span class="material-symbols-rounded text-base align-middle">qr_code_2</span>
                <span data-i18n="tools.qr-code.ui.btnGenerate">Generate QR Code</span>
              </button>

              <!-- Error Message -->
              <div id="qr-error-msg" class="hidden rounded-lg p-3 text-sm border bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800"></div>
            </div>

            <!-- Right: Preview & Download -->
            <div class="space-y-4">
              <div id="qr-preview" class="flex items-center justify-center min-h-[256px] rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-950">
                <div class="text-center text-surface-400 dark:text-surface-600">
                  <span class="material-symbols-rounded text-5xl">qr_code_2</span>
                  <p class="mt-2 text-sm" data-i18n="tools.qr-code.ui.previewPlaceholder">Your QR code will appear here</p>
                </div>
                <canvas id="qr-canvas" class="hidden rounded-lg max-w-full"></canvas>
              </div>

              <!-- Download Buttons -->
              <div class="flex gap-3">
                <button id="download-qr-png" disabled class="btn btn-secondary flex-1">
                  <span class="material-symbols-rounded text-base align-middle">download</span>
                  <span data-i18n="tools.qr-code.ui.btnDownloadPng">Download PNG</span>
                </button>
                <button id="download-qr-svg" disabled class="btn btn-secondary flex-1">
                  <span class="material-symbols-rounded text-base align-middle">download</span>
                  <span data-i18n="tools.qr-code.ui.btnDownloadSvg">Download SVG</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Decode Tab -->
        <div id="tab-decode" class="tab-content hidden" role="tabpanel" aria-labelledby="tab-trigger-decode">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Left: Upload -->
            <div class="space-y-4">
              <div>
                <label for="qr-upload" class="label"><span data-i18n="tools.qr-code.ui.label8">Upload QR Code Image</span></label>
                <input type="file" id="qr-upload" accept="image/*" class="block w-full text-sm text-surface-600 dark:text-surface-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 dark:file:bg-primary-900/20 file:text-primary-700 dark:file:text-primary-300 hover:file:bg-primary-100 dark:hover:file:bg-primary-900/40 cursor-pointer">
              </div>

              <div id="decode-preview" class="flex items-center justify-center min-h-[200px] rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-950">
                <div class="text-center text-surface-400 dark:text-surface-600">
                  <span class="material-symbols-rounded text-5xl">image</span>
                  <p class="mt-2 text-sm" data-i18n="tools.qr-code.ui.decodePlaceholder">Upload an image to decode</p>
                </div>
                <img id="decode-image" class="hidden max-w-full max-h-64 rounded-lg object-contain" alt="QR code to decode">
              </div>

              <button id="decode-qr" disabled class="btn btn-primary w-full">
                <span class="material-symbols-rounded text-base align-middle">qr_code_scanner</span>
                <span data-i18n="tools.qr-code.ui.btnDecode">Decode QR Code</span>
              </button>
            </div>

            <!-- Right: Results -->
            <div class="space-y-4">
              <canvas id="qr-decode-canvas" class="hidden"></canvas>
              <div id="qr-decode-result" class="hidden space-y-3">
                <label class="label"><span data-i18n="tools.qr-code.ui.label9">Decoded Content</span></label>
                <div class="relative">
                  <pre id="qr-decode-output" class="input font-mono text-sm whitespace-pre-wrap break-all min-h-[120px]"></pre>
                </div>
                <button id="copy-decoded" class="btn btn-secondary w-full">
                  <span class="material-symbols-rounded text-base align-middle">content_copy</span>
                  <span data-i18n="tools.qr-code.ui.btnCopyDecoded">Copy Decoded Text</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        ${createEducationalSection([
          {
            title: 'What are QR Codes?',
            content: 'Quick Response (QR) codes are two-dimensional barcodes that can store various types of data, most commonly URLs. They can be scanned by smartphones and specialized readers to quickly access information or trigger actions.'
          },
          {
            title: 'How to Use This Tool',
            content: 'Enter the text or URL you want to encode. Adjust the size and error correction level if needed. The QR code updates in real-time and can be downloaded as an image for print or digital use.'
          },
          {
            title: 'Common Use Cases',
            content: 'Sharing website links, providing Wi-Fi credentials, digital business cards (vCards), event ticketing, and mobile payments or authentication flows.'
          },
          {
            title: 'Pro Tips',
            content: 'Higher error correction levels (H or Q) allow the QR code to remain scannable even if partially damaged or obscured, which is ideal for physical signage or branding.'
          }
        ], 'qr-code', currentLang)}
      </div>
    </main>
    ${createRelatedToolsSection(relatedToolsData)}
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
            errMsg.textContent = _t('tools.qr-code.js.text0', 'Please enter text or URL to encode.');
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
        generateButton.innerHTML = window._t ? window._t('tools.qr-code.ui.generating', 'Generating...') : 'Generating...';

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
            errMsg.textContent = _t('tools.qr-code.js.text4', 'Error generating QR code: ') + error.message;
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
             const errMsg = document.getElementById('qr-error-msg');
             if (errMsg) {
               errMsg.textContent = _t('tools.qr-code.js.alert2', 'No QR code found in the image. Please try another image.');
               errMsg.classList.remove('hidden');
             }
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
             const btn = document.getElementById('copy-decoded');
             const orig = btn.textContent;
             btn.textContent = _t('tools.qr-code.js.alert3', 'Copied!');
             if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
             setTimeout(() => btn.textContent = orig, 2000);
         }
       });
    </script>
  `;

  return respondHTML(createPageTemplate({
    title: translation?.name || 'QR Code Studio',
    description: translation?.desc || 'Generate QR codes for URLs and text.',
    path: '/qr-code',
    content,
    scripts: script,
    lang: currentLang
  }));
}
