/**
 * Image Converter & Resizer Tool
 * Convert between PNG, JPG, WebP, GIF formats
 * Resize images while maintaining quality
 * All processing happens client-side using Canvas API
 */

import { createPageTemplate, createToolHeader } from "../utils/common-ui.js";
import { respondHTML } from "../utils/respond.js";
import {
  createRelatedToolsSection,
} from "../utils/content-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";

/**
 * Render the Image Converter page
 */
function renderImageConverterPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("image-converter", currentLang);
  const toolHeader = createToolHeader(
    { emoji: "🖼️" },
    translation?.name || "Image Converter",
    translation?.desc ||
      "Convert between image formats and resize images while maintaining quality. All processing happens in your browser.",
    [
      {
        text: translation?.ui?.badge26 || "Client-Side Only",
        tooltip:
          "Runs entirely in your browser using Web APIs — your data is processed locally and not sent to our servers.",
      },
    ],
    { toolId: "image-converter" },
  );

  const currentTool = TOOLS.find((t) => t.id === "image-converter");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];
  const pageContent = `

    <main class="tool-page-shell">
      <div class="tool-page-panel">
        ${toolHeader}

       <!-- Privacy Notice -->
       <div class="mb-6 p-4 bg-success-50 dark:bg-success-900/20 rounded-xl border-2 border-success-300 dark:border-success-700">
         <p class="text-sm text-success-800 dark:text-success-300">
           🔒 <strong>Privacy-First Design:</strong> Your images stay in your browser and are not sent to our servers. All conversion and resizing happens client-side using Canvas API.
         </p>
       </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left Column: Upload & Settings -->
        <div class="space-y-6">
          <!-- File Upload -->
          <div class="tool-group p-6">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.image-converter.ui.heading11">📤 Upload Image</h2>

            <input type="file" id="file-input" accept="image/*" class="hidden" aria-label="Choose an image file to convert" />
            <div id="drop-zone" class="drop-zone" role="button" tabindex="0" aria-labelledby="drop-zone-label">
              <svg class="w-16 h-16 mx-auto mb-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p id="drop-zone-label" class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-2" data-i18n="tools.image-converter.ui.desc19">
                Drop image here or click to browse
              </p>
              <p class="text-sm text-surface-500 dark:text-surface-400" data-i18n="tools.image-converter.ui.desc34">
                Reads PNG, JPG, WebP, GIF, BMP (GIFs are read as a single frame)
              </p>
            </div>

            <div id="file-info" class="mt-4 hidden">
               <div class="p-3 bg-info-50 dark:bg-info-900/20 rounded-lg">
                 <p class="text-sm text-info-800 dark:text-info-300">
                   <strong>File:</strong> <span id="file-name"></span>
                 </p>
                 <p class="text-sm text-info-800 dark:text-info-300">
                   <strong>Size:</strong> <span id="file-size"></span>
                 </p>
                 <p class="text-sm text-info-800 dark:text-info-300">
                   <strong>Dimensions:</strong> <span id="image-dimensions"></span>
                 </p>
               </div>
             </div>
          </div>

          <!-- Format Selection -->
          <div class="tool-group p-6">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.image-converter.ui.heading12">🔄 Convert Format</h2>

            <div class="grid grid-cols-3 gap-3" role="group" aria-label="Output format">
              <button type="button" class="format-option selected" data-format="png" aria-pressed="true">
                <span class="block text-center">
                  <span class="block font-bold text-surface-900 dark:text-surface-50">PNG</span>
                  <span class="block text-xs text-surface-600 dark:text-surface-300" data-i18n="tools.image-converter.ui.desc21">Lossless</span>
                </span>
              </button>
              <button type="button" class="format-option" data-format="jpeg" aria-pressed="false">
                <span class="block text-center">
                  <span class="block font-bold text-surface-900 dark:text-surface-50">JPG</span>
                  <span class="block text-xs text-surface-600 dark:text-surface-300" data-i18n="tools.image-converter.ui.desc22">Smaller size</span>
                </span>
              </button>
              <button type="button" class="format-option" data-format="webp" aria-pressed="false">
                <span class="block text-center">
                  <span class="block font-bold text-surface-900 dark:text-surface-50">WebP</span>
                  <span class="block text-xs text-surface-600 dark:text-surface-300" data-i18n="tools.image-converter.ui.desc23">Modern</span>
                </span>
              </button>
            </div>
            <p class="mt-3 text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.image-converter.ui.desc36">
              A browser canvas cannot encode GIF, so GIF is not offered as an output format.
            </p>

            <!-- Quality Slider (for lossy formats) -->
            <div id="quality-control" class="mt-4 hidden">
              <label for="quality-slider" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2" data-tooltip="Lower quality = smaller file size, more compression artifacts" data-i18n-tooltip="tools.image-converter.ui.tip0">
                Quality: <span id="quality-value">90</span>%
              </label>
              <input type="range" id="quality-slider" min="1" max="100" value="90"
                class="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer dark:bg-surface-700" />
              <p class="text-xs text-surface-500 dark:text-surface-400 mt-1" data-i18n="tools.image-converter.ui.desc25">
                Lower quality = smaller file size
              </p>
            </div>
          </div>

          <!-- Resize Options -->
          <div class="tool-group p-6">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.image-converter.ui.heading13">📏 Resize Image</h2>

            <!-- Resize Mode -->
            <div class="mb-4">
              <label for="resize-mode" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2"><span data-i18n="tools.image-converter.ui.label2">Resize Mode</span></label>
              <select id="resize-mode" class="input">
                <option value="none" data-i18n="tools.image-converter.ui.option7">No Resize (Keep Original)</option>
                <option value="percentage" data-i18n="tools.image-converter.ui.option8">Percentage</option>
                <option value="dimensions" data-i18n="tools.image-converter.ui.option9">Custom Dimensions</option>
                <option value="max-dimensions" data-i18n="tools.image-converter.ui.option10">Max Width/Height</option>
              </select>
            </div>

            <!-- Percentage Resize -->
            <div id="percentage-resize" class="hidden">
              <label for="scale-slider" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                Scale: <span id="scale-value">100</span>%
              </label>
              <input type="range" id="scale-slider" min="10" max="200" value="100"
                class="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer dark:bg-surface-700" />
            </div>

            <!-- Custom Dimensions -->
            <div id="dimensions-resize" class="hidden space-y-3">
              <div>
                <label for="custom-width" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1"><span data-i18n="tools.image-converter.ui.label3">Width (px)</span></label>
                <input type="number" id="custom-width" placeholder="800" min="1"
                  class="input" />
              </div>
              <div>
                <label for="custom-height" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1"><span data-i18n="tools.image-converter.ui.label4">Height (px)</span></label>
                <input type="number" id="custom-height" placeholder="600" min="1"
                  class="input" />
              </div>
              <label for="maintain-aspect" class="flex items-center">
                <input type="checkbox" id="maintain-aspect" checked data-tooltip="Keep original width-to-height ratio when resizing" data-i18n-tooltip="tools.image-converter.ui.tip1" class="mr-2" />
                <span class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.image-converter.ui.desc26">Maintain aspect ratio</span>
              </label>
            </div>

            <!-- Max Dimensions -->
            <div id="max-dimensions-resize" class="hidden space-y-3">
              <div>
                <label for="max-width" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1"><span data-i18n="tools.image-converter.ui.label5">Max Width (px)</span></label>
                <input type="number" id="max-width" placeholder="1920" min="1"
                  class="input" />
              </div>
              <div>
                <label for="max-height" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1"><span data-i18n="tools.image-converter.ui.label6">Max Height (px)</span></label>
                <input type="number" id="max-height" placeholder="1080" min="1"
                  class="input" />
              </div>
            </div>
           </div>

           <!-- Error Banner -->
           <div id="img-error" role="alert" class="hidden w-full rounded-xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/30 text-sm text-error-700 dark:text-error-200 px-4 py-3"></div>

           <!-- Convert Button -->
           <button id="convert-btn" disabled data-tooltip="Convert image to the selected format and size" data-i18n-tooltip="tools.image-converter.ui.tip2"
             class="btn btn-primary w-full py-4 px-6 disabled:opacity-50 disabled:cursor-not-allowed">
             <span id="convert-spinner" class="spinner-sm hidden" style="display:inline-block;vertical-align:middle;margin-right:6px;border-color:rgba(255,255,255,0.3);border-top-color:#fff;"></span>
             <span data-i18n="tools.image-converter.ui.button0">🔄 Convert & Resize Image</span>
           </button>
        </div>

        <!-- Right Column: Preview & Download -->
        <div class="space-y-6">
          <!-- Original Preview -->
          <div class="tool-group p-6">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.image-converter.ui.heading14">📷 Original Image</h2>
            <div class="preview-container">
              <div id="original-placeholder" class="text-center text-surface-500 dark:text-surface-400">
                <svg class="w-24 h-24 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p class="text-sm" data-i18n="tools.image-converter.ui.desc27">No image uploaded</p>
              </div>
              <img id="original-preview" class="preview-image hidden" alt="Original image" />
            </div>
          </div>

          <!-- Converted Preview -->
          <div class="tool-group p-6">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.image-converter.ui.heading15">✨ Converted Image</h2>
            <div class="preview-container">
              <div id="converted-placeholder" class="text-center text-surface-500 dark:text-surface-400">
                <svg class="w-24 h-24 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p class="text-sm" data-i18n="tools.image-converter.ui.desc28">Convert to see result</p>
              </div>
              <canvas id="converted-canvas" class="preview-image hidden"></canvas>
            </div>

             <!-- Converted Image Info -->
             <div id="converted-info" class="mt-4 hidden">
               <div class="p-3 bg-success-50 dark:bg-success-900/20 rounded-lg space-y-1">
                 <p class="text-sm text-success-800 dark:text-success-300">
                   <strong>Format:</strong> <span id="converted-format"></span>
                 </p>
                 <p class="text-sm text-success-800 dark:text-success-300">
                   <strong>Size:</strong> <span id="converted-size"></span>
                 </p>
                 <p class="text-sm text-success-800 dark:text-success-300">
                   <strong>Dimensions:</strong> <span id="converted-dimensions"></span>
                 </p>
                 <p class="text-sm font-semibold text-success-800 dark:text-success-300">
                   💾 <span id="size-reduction"></span>
                 </p>
               </div>
             </div>

            <!-- Download Button -->
            <button id="download-btn" disabled
              class="btn btn-secondary w-full mt-4 py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed">
              <span data-i18n="tools.image-converter.ui.button1">💾 Download Converted Image</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Features Info -->
      <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="tool-group p-6">
          <div class="text-3xl mb-3">🎨</div>
          <h3 class="font-bold text-surface-900 dark:text-surface-50 mb-2" data-i18n="tools.image-converter.ui.heading16">Multiple Formats</h3>
          <p class="text-sm text-surface-600 dark:text-surface-300" data-i18n="tools.image-converter.ui.desc35">
            Convert to PNG, JPG, or WebP with quality control. GIF and BMP files are accepted as input.
          </p>
        </div>
        <div class="tool-group p-6">
          <div class="text-3xl mb-3">📐</div>
          <h3 class="font-bold text-surface-900 dark:text-surface-50 mb-2" data-i18n="tools.image-converter.ui.heading17">Flexible Resizing</h3>
          <p class="text-sm text-surface-600 dark:text-surface-300" data-i18n="tools.image-converter.ui.desc30">
            Resize by percentage, dimensions, or max width/height with aspect ratio control
          </p>
        </div>
        <div class="tool-group p-6">
          <div class="text-3xl mb-3">⚡</div>
          <h3 class="font-bold text-surface-900 dark:text-surface-50 mb-2" data-i18n="tools.image-converter.ui.heading18">Instant Processing</h3>
          <p class="text-sm text-surface-600 dark:text-surface-300" data-i18n="tools.image-converter.ui.desc31">
            Client-side processing using Canvas API - no uploads, instant results
          </p>
        </div>
      </div>
      </div>
    </main>

    <script>
      (function () {
        var byId = function (id) { return document.getElementById(id); };

        var dropZone = byId('drop-zone');
        var fileInput = byId('file-input');
        var fileInfo = byId('file-info');
        var originalPreview = byId('original-preview');
        var originalPlaceholder = byId('original-placeholder');
        var convertBtn = byId('convert-btn');
        var convertSpinner = byId('convert-spinner');
        var downloadBtn = byId('download-btn');
        var convertedCanvas = byId('converted-canvas');
        var convertedPlaceholder = byId('converted-placeholder');
        var convertedInfo = byId('converted-info');
        var qualityControl = byId('quality-control');
        var qualitySlider = byId('quality-slider');
        var qualityValue = byId('quality-value');
        var resizeMode = byId('resize-mode');
        var scaleSlider = byId('scale-slider');
        var scaleValue = byId('scale-value');
        var customWidth = byId('custom-width');
        var customHeight = byId('custom-height');
        var maintainAspect = byId('maintain-aspect');
        var maxWidthInput = byId('max-width');
        var maxHeightInput = byId('max-height');
        var errorBanner = byId('img-error');

        if (!dropZone || !fileInput || !convertBtn || !downloadBtn || !convertedCanvas) return;

        var originalImage = null;
        var originalFile = null;
        var selectedFormat = 'png';
        var convertedBlob = null;
        var convertedUrl = null;
        var downloadName = 'converted-image.png';

        var MIME = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };

        function T(key, fallback) {
          return window._t ? window._t(key, fallback) : fallback;
        }

        function showError(message) {
          if (!errorBanner) return;
          errorBanner.textContent = message || '';
          if (message) {
            errorBanner.classList.remove('hidden');
          } else {
            errorBanner.classList.add('hidden');
          }
        }

        function formatFileSize(bytes) {
          if (!bytes) return '0 Bytes';
          var units = ['Bytes', 'KB', 'MB', 'GB'];
          var i = Math.floor(Math.log(bytes) / Math.log(1024));
          if (i < 0) i = 0;
          if (i > 3) i = 3;
          return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + units[i];
        }

        function baseName(name) {
          var dot = name.lastIndexOf('.');
          return dot > 0 ? name.slice(0, dot) : name;
        }

        function aspectRatio() {
          return originalImage.naturalWidth / originalImage.naturalHeight;
        }

        // ---- output format ----
        var formatButtons = Array.prototype.slice.call(document.querySelectorAll('.format-option'));
        formatButtons.forEach(function (button) {
          button.addEventListener('click', function () {
            formatButtons.forEach(function (other) {
              var isTarget = other === button;
              other.classList.toggle('selected', isTarget);
              other.setAttribute('aria-pressed', String(isTarget));
            });
            selectedFormat = button.dataset.format;
            if (qualityControl) qualityControl.classList.toggle('hidden', selectedFormat === 'png');
          });
        });

        qualitySlider.addEventListener('input', function () {
          qualityValue.textContent = qualitySlider.value;
        });

        scaleSlider.addEventListener('input', function () {
          scaleValue.textContent = scaleSlider.value;
        });

        // ---- resize mode ----
        var RESIZE_PANELS = {
          percentage: 'percentage-resize',
          dimensions: 'dimensions-resize',
          'max-dimensions': 'max-dimensions-resize'
        };

        resizeMode.addEventListener('change', function () {
          Object.keys(RESIZE_PANELS).forEach(function (mode) {
            var panel = byId(RESIZE_PANELS[mode]);
            if (panel) panel.classList.toggle('hidden', mode !== resizeMode.value);
          });
        });

        customWidth.addEventListener('input', function () {
          if (!originalImage || !maintainAspect.checked) return;
          var width = parseInt(customWidth.value, 10);
          if (!(width > 0)) return;
          customHeight.value = Math.max(1, Math.round(width / aspectRatio()));
        });

        customHeight.addEventListener('input', function () {
          if (!originalImage || !maintainAspect.checked) return;
          var height = parseInt(customHeight.value, 10);
          if (!(height > 0)) return;
          customWidth.value = Math.max(1, Math.round(height * aspectRatio()));
        });

        // ---- file selection ----
        dropZone.addEventListener('click', function () { fileInput.click(); });

        dropZone.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault();
            fileInput.click();
          }
        });

        dropZone.addEventListener('dragover', function (event) {
          event.preventDefault();
          dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', function () {
          dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', function (event) {
          event.preventDefault();
          dropZone.classList.remove('drag-over');
          var files = event.dataTransfer && event.dataTransfer.files;
          if (files && files.length) handleFile(files[0]);
        });

        fileInput.addEventListener('change', function () {
          if (fileInput.files && fileInput.files.length) handleFile(fileInput.files[0]);
        });

        function handleFile(file) {
          if (!file) return;
          showError('');

          if (!file.type || file.type.indexOf('image/') !== 0) {
            showError(T('tools.image-converter.js.alert0', 'Please upload a valid image file.'));
            return;
          }

          originalFile = file;
          byId('file-name').textContent = file.name;
          byId('file-size').textContent = formatFileSize(file.size);
          fileInfo.classList.remove('hidden');

          var reader = new FileReader();
          reader.onload = function (event) {
            var img = new Image();
            img.onload = function () {
              originalImage = img;
              originalPreview.src = img.src;
              originalPreview.classList.remove('hidden');
              originalPlaceholder.classList.add('hidden');
              byId('image-dimensions').textContent =
                img.naturalWidth + ' x ' + img.naturalHeight + 'px';
              customWidth.value = img.naturalWidth;
              customHeight.value = img.naturalHeight;
              maxWidthInput.value = img.naturalWidth;
              maxHeightInput.value = img.naturalHeight;
              convertBtn.disabled = false;
            };
            img.onerror = function () {
              showError(T('tools.image-converter.js.alert1', 'Failed to load image. The file might be corrupted.'));
            };
            img.src = event.target.result;
          };
          reader.onerror = function () {
            showError(T('tools.image-converter.js.alert2', 'Error reading file.'));
          };
          reader.readAsDataURL(file);
        }

        // ---- conversion ----
        function targetSize() {
          var width = originalImage.naturalWidth;
          var height = originalImage.naturalHeight;
          var ratio = aspectRatio();
          var mode = resizeMode.value;

          if (mode === 'percentage') {
            var scale = (parseInt(scaleSlider.value, 10) || 100) / 100;
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          } else if (mode === 'dimensions') {
            var wanted = parseInt(customWidth.value, 10);
            var wantedHeight = parseInt(customHeight.value, 10);
            if (maintainAspect.checked) {
              if (wanted > 0) {
                width = wanted;
                height = Math.round(wanted / ratio);
              } else if (wantedHeight > 0) {
                height = wantedHeight;
                width = Math.round(wantedHeight * ratio);
              }
            } else {
              if (wanted > 0) width = wanted;
              if (wantedHeight > 0) height = wantedHeight;
            }
          } else if (mode === 'max-dimensions') {
            var maxW = parseInt(maxWidthInput.value, 10) || width;
            var maxH = parseInt(maxHeightInput.value, 10) || height;
            if (width > maxW) {
              width = maxW;
              height = Math.round(maxW / ratio);
            }
            if (height > maxH) {
              height = maxH;
              width = Math.round(maxH * ratio);
            }
          }

          return { width: Math.max(1, width), height: Math.max(1, height) };
        }

        convertBtn.addEventListener('click', function () {
          if (!originalImage) return;

          showError('');
          convertBtn.disabled = true;
          if (convertSpinner) convertSpinner.classList.remove('hidden');

          var size = targetSize();
          convertedCanvas.width = size.width;
          convertedCanvas.height = size.height;

          var ctx = convertedCanvas.getContext('2d');
          ctx.clearRect(0, 0, size.width, size.height);
          if (selectedFormat === 'jpeg') {
            // JPEG carries no alpha channel; without this, transparency turns black.
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size.width, size.height);
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(originalImage, 0, 0, size.width, size.height);

          var mime = MIME[selectedFormat] || 'image/png';
          var quality = selectedFormat === 'png'
            ? undefined
            : (parseInt(qualitySlider.value, 10) || 90) / 100;

          var finish = function (blob) {
            convertBtn.disabled = false;
            if (convertSpinner) convertSpinner.classList.add('hidden');

            if (!blob) {
              showError(T('tools.image-converter.js.text4', 'Your browser could not encode that format. Try PNG instead.'));
              return;
            }

            convertedBlob = blob;
            convertedCanvas.classList.remove('hidden');
            convertedPlaceholder.classList.add('hidden');

            // Report what the canvas actually produced: toBlob falls back to PNG
            // for any type the browser cannot encode, and a wrong extension on a
            // download is worse than an honest one.
            var actualFormat = (blob.type || mime).split('/')[1] || selectedFormat;
            var extension = actualFormat === 'jpeg' ? 'jpg' : actualFormat;

            byId('converted-format').textContent = actualFormat.toUpperCase();
            byId('converted-size').textContent = formatFileSize(blob.size);
            byId('converted-dimensions').textContent = size.width + ' x ' + size.height + 'px';

            var delta = originalFile.size - blob.size;
            var percent = Math.abs(delta / originalFile.size * 100).toFixed(1);
            byId('size-reduction').textContent = delta >= 0
              ? T('tools.image-converter.js.text5', 'Smaller by') + ' ' + percent + '% (' + formatFileSize(delta) + ' saved)'
              : T('tools.image-converter.js.text6', 'Larger by') + ' ' + percent + '% (' + formatFileSize(-delta) + ' added)';

            convertedInfo.classList.remove('hidden');
            downloadName = baseName(originalFile.name) + '-converted.' + extension;
            downloadBtn.disabled = false;
          };

          try {
            convertedCanvas.toBlob(finish, mime, quality);
          } catch (error) {
            finish(null);
          }
        });

        downloadBtn.addEventListener('click', function () {
          if (!convertedBlob) return;
          if (convertedUrl) URL.revokeObjectURL(convertedUrl);
          convertedUrl = URL.createObjectURL(convertedBlob);

          var link = document.createElement('a');
          link.href = convertedUrl;
          link.download = downloadName;
          document.body.appendChild(link);
          link.click();
          link.remove();
        });
      })();
    </script>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const customStyles = `
    <style>
      .preview-container {
        border: 2px dashed #cbd5e1;
        border-radius: 12px;
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }

      .dark .preview-container {
        border-color: #475569;
      }

      .preview-image {
        max-width: 100%;
        max-height: 400px;
        object-fit: contain;
      }

      .drop-zone {
        border: 3px dashed #cbd5e1;
        border-radius: 12px;
        padding: 3rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s;
      }

      .drop-zone:hover,
      .drop-zone.drag-over {
        border-color: #3b82f6;
        background: #eff6ff;
      }

      .dark .drop-zone:hover,
      .dark .drop-zone.drag-over {
        border-color: #60a5fa;
        background: #1e3a8a;
      }

      .format-option {
        display: block;
        width: 100%;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
        cursor: pointer;
        transition: all 0.2s;
      }

      .format-option:hover {
        border-color: #3b82f6;
        background: #eff6ff;
      }

      .format-option.selected {
        border-color: #3b82f6;
        background: #dbeafe;
      }

      .dark .format-option {
        border-color: #374151;
      }

      .dark .format-option:hover {
        border-color: #60a5fa;
        background: #1e3a8a;
      }

      .dark .format-option.selected {
        border-color: #60a5fa;
        background: #1e40af;
      }
    </style>
  `;

  return createPageTemplate({
    title: translation?.name || "Image Converter",
    description:
      translation?.desc ||
      "Convert and resize images in your browser. Reads PNG, JPG, WebP, GIF and BMP; writes PNG, JPG or WebP. Privacy-first, client-side processing.",
    path: "/image-converter",
    content: customStyles + pageContent,
    lang: currentLang,
  });
}

/**
 * Route handler for Image Converter
 */
export async function handleImageConverterRoutes(request, url) {
  const pathname = url.pathname;

  if (pathname === "/image-converter" || pathname === "/image-converter/") {
    return respondHTML(
      renderImageConverterPage(resolveRequestLanguage(request, url)),
    );
  }

  return null;
}
