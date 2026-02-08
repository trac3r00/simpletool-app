/**
 * Image Converter & Resizer Tool
 * Convert between PNG, JPG, WebP, GIF formats
 * Resize images while maintaining quality
 * All processing happens client-side using Canvas API
 */

import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { respondHTML } from '../utils/respond.js';

/**
 * Render the Image Converter page
 */
function renderImageConverterPage() {
  const toolHeader = createToolHeader(
    { emoji: '🖼️' },
    'Image Converter',
    'Convert between image formats and resize images while maintaining quality. All processing happens in your browser.',
    [{ text: 'Client-Side Only', tooltip: 'Runs entirely in your browser using Web APIs — your data never leaves your device.' }],
    { toolId: 'image-converter' }
  );

  const pageContent = `

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}

       <!-- Privacy Notice -->
       <div class="mb-6 p-4 bg-success-50 dark:bg-success-900/20 rounded-xl border-2 border-success-300 dark:border-success-700">
         <p class="text-sm text-success-800 dark:text-success-300">
           🔒 <strong>Privacy-First Design:</strong> Your images never leave your device. All conversion and resizing happens client-side using Canvas API.
         </p>
       </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left Column: Upload & Settings -->
        <div class="space-y-6">
          <!-- File Upload -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm p-6">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.image-converter.ui.heading11">📤 Upload Image</h2>

            <div id="drop-zone" class="drop-zone">
              <input type="file" id="file-input" accept="image/*" class="hidden" />
              <svg class="w-16 h-16 mx-auto mb-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-2" data-i18n="tools.image-converter.ui.desc19">
                Drop image here or click to browse
              </p>
              <p class="text-sm text-surface-500 dark:text-surface-400" data-i18n="tools.image-converter.ui.desc20">
                Supports: PNG, JPG, WebP, GIF
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
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm p-6">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.image-converter.ui.heading12">🔄 Convert Format</h2>

            <div class="grid grid-cols-2 gap-3">
              <div class="format-option selected" data-format="png">
                <div class="text-center">
                  <p class="font-bold text-surface-900 dark:text-surface-50">PNG</p>
                  <p class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.image-converter.ui.desc21">Lossless</p>
                </div>
              </div>
              <div class="format-option" data-format="jpeg">
                <div class="text-center">
                  <p class="font-bold text-surface-900 dark:text-surface-50">JPG</p>
                  <p class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.image-converter.ui.desc22">Smaller size</p>
                </div>
              </div>
              <div class="format-option" data-format="webp">
                <div class="text-center">
                  <p class="font-bold text-surface-900 dark:text-surface-50">WebP</p>
                  <p class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.image-converter.ui.desc23">Modern</p>
                </div>
              </div>
              <div class="format-option" data-format="gif">
                <div class="text-center">
                  <p class="font-bold text-surface-900 dark:text-surface-50">GIF</p>
                  <p class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.image-converter.ui.desc24">Animation</p>
                </div>
              </div>
            </div>

            <!-- Quality Slider (for lossy formats) -->
            <div id="quality-control" class="mt-4 hidden">
              <label for="quality-slider" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2" data-tooltip="Lower quality = smaller file size, more compression artifacts">
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
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm p-6">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.image-converter.ui.heading13">📏 Resize Image</h2>

            <!-- Resize Mode -->
            <div class="mb-4">
              <label for="resize-mode" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2"><span data-i18n="tools.image-converter.ui.label2">Resize Mode</span></label>
              <select id="resize-mode" class="w-full px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-50">
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
                  class="w-full px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-50" />
              </div>
              <div>
                <label for="custom-height" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1"><span data-i18n="tools.image-converter.ui.label4">Height (px)</span></label>
                <input type="number" id="custom-height" placeholder="600" min="1"
                  class="w-full px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-50" />
              </div>
              <label for="maintain-aspect" class="flex items-center">
                <input type="checkbox" id="maintain-aspect" checked data-tooltip="Keep original width-to-height ratio when resizing" class="mr-2" />
                <span class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.image-converter.ui.desc26">Maintain aspect ratio</span>
              </label>
            </div>

            <!-- Max Dimensions -->
            <div id="max-dimensions-resize" class="hidden space-y-3">
              <div>
                <label for="max-width" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1"><span data-i18n="tools.image-converter.ui.label5">Max Width (px)</span></label>
                <input type="number" id="max-width" placeholder="1920" min="1"
                  class="w-full px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-50" />
              </div>
              <div>
                <label for="max-height" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1"><span data-i18n="tools.image-converter.ui.label6">Max Height (px)</span></label>
                <input type="number" id="max-height" placeholder="1080" min="1"
                  class="w-full px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-50" />
              </div>
            </div>
           </div>

           <!-- Error Banner -->
           <div id="img-error" role="alert" class="hidden w-full rounded-xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/30 text-sm text-error-700 dark:text-error-200 px-4 py-3"></div>

           <!-- Convert Button -->
           <button id="convert-btn" disabled data-tooltip="Convert image to the selected format and size"
             class="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
             <span id="convert-spinner" class="spinner-sm hidden" style="display:inline-block;vertical-align:middle;margin-right:6px;border-color:rgba(255,255,255,0.3);border-top-color:#fff;"></span>
             <span data-i18n="tools.image-converter.ui.button0">🔄 Convert & Resize Image</span>
           </button>
        </div>

        <!-- Right Column: Preview & Download -->
        <div class="space-y-6">
          <!-- Original Preview -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm p-6">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.image-converter.ui.heading14">📷 Original Image</h2>
            <div class="preview-container">
              <div id="original-placeholder" class="text-center text-surface-400 dark:text-surface-500">
                <svg class="w-24 h-24 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p class="text-sm" data-i18n="tools.image-converter.ui.desc27">No image uploaded</p>
              </div>
              <img id="original-preview" class="preview-image hidden" alt="Original image" />
            </div>
          </div>

          <!-- Converted Preview -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm p-6">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.image-converter.ui.heading15">✨ Converted Image</h2>
            <div class="preview-container">
              <div id="converted-placeholder" class="text-center text-surface-400 dark:text-surface-500">
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
              class="w-full mt-4 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
              <span data-i18n="tools.image-converter.ui.button1">💾 Download Converted Image</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Features Info -->
      <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-surface-900 rounded-xl shadow-lg p-6">
          <div class="text-3xl mb-3">🎨</div>
          <h3 class="font-bold text-surface-900 dark:text-surface-50 mb-2" data-i18n="tools.image-converter.ui.heading16">Multiple Formats</h3>
          <p class="text-sm text-surface-600 dark:text-surface-300" data-i18n="tools.image-converter.ui.desc29">
            Convert between PNG, JPG, WebP, and GIF formats with quality control
          </p>
        </div>
        <div class="bg-white dark:bg-surface-900 rounded-xl shadow-lg p-6">
          <div class="text-3xl mb-3">📐</div>
          <h3 class="font-bold text-surface-900 dark:text-surface-50 mb-2" data-i18n="tools.image-converter.ui.heading17">Flexible Resizing</h3>
          <p class="text-sm text-surface-600 dark:text-surface-300" data-i18n="tools.image-converter.ui.desc30">
            Resize by percentage, dimensions, or max width/height with aspect ratio control
          </p>
        </div>
        <div class="bg-white dark:bg-surface-900 rounded-xl shadow-lg p-6">
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
      let originalImage = null;
      let originalFile = null;
      let selectedFormat = 'png';

      // DOM Elements
      const dropZone = document.getElementById('drop-zone');
      const fileInput = document.getElementById('file-input');
      const fileInfo = document.getElementById('file-info');
      const originalPreview = document.getElementById('original-preview');
      const originalPlaceholder = document.getElementById('original-placeholder');
      const convertBtn = document.getElementById('convert-btn');
      const downloadBtn = document.getElementById('download-btn');
      const convertedCanvas = document.getElementById('converted-canvas');
      const convertedPlaceholder = document.getElementById('converted-placeholder');
      const convertedInfo = document.getElementById('converted-info');
      const qualityControl = document.getElementById('quality-control');
      const qualitySlider = document.getElementById('quality-slider');
      const qualityValue = document.getElementById('quality-value');
      const resizeMode = document.getElementById('resize-mode');
      const scaleSlider = document.getElementById('scale-slider');
      const scaleValue = document.getElementById('scale-value');

      // Error banner helper
      function showImgError(msg) {
        const el = document.getElementById('img-error');
        if (msg) {
          el.textContent = msg;
          el.classList.remove('hidden');
        } else {
          el.textContent = '';
          el.classList.add('hidden');
        }
      }

      // Format Selection
      document.querySelectorAll('.format-option').forEach(option => {
        option.addEventListener('click', () => {
          document.querySelectorAll('.format-option').forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
          selectedFormat = option.dataset.format;

          // Show quality control for lossy formats
          if (selectedFormat === 'jpeg' || selectedFormat === 'webp') {
            qualityControl.classList.remove('hidden');
          } else {
            qualityControl.classList.add('hidden');
          }
        });
      });

      // Quality Slider
      qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value;
      });

      // Scale Slider
      scaleSlider.addEventListener('input', (e) => {
        scaleValue.textContent = e.target.value;
      });

      // Resize Mode
      resizeMode.addEventListener('change', (e) => {
        document.getElementById('percentage-resize').classList.add('hidden');
        document.getElementById('dimensions-resize').classList.add('hidden');
        document.getElementById('max-dimensions-resize').classList.add('hidden');

        if (e.target.value === 'percentage') {
          document.getElementById('percentage-resize').classList.remove('hidden');
        } else if (e.target.value === 'dimensions') {
          document.getElementById('dimensions-resize').classList.remove('hidden');
        } else if (e.target.value === 'max-dimensions') {
          document.getElementById('max-dimensions-resize').classList.remove('hidden');
        }
      });

      // Drag & Drop
      dropZone.addEventListener('click', () => fileInput.click());

      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
          handleFileSelect(files[0]);
        }
      });

       fileInput.addEventListener('change', (e) => {
         if (e.target.files.length > 0) {
           handleFileSelect(e.target.files[0]);
         }
       });

      // Handle File Selection
      function handleFileSelect(file) {
        if (!file) return;

        // Clear any previous errors
        showImgError('');

        // Large file warning (> 10MB)
        if (file.size > 10 * 1024 * 1024) {
          const proceed = confirm(\`This file is large (\${(file.size / 1024 / 1024).toFixed(1)} MB). Processing might slow down your browser. Do you want to continue?\`);
          if (!proceed) return;
        }

        try {
          if (!file.type.startsWith('image/')) {
            showImgError('Please upload a valid image file.');
            return;
          }

          originalFile = file;

          // Display file info
          document.getElementById('file-name').textContent = file.name;
          document.getElementById('file-size').textContent = formatFileSize(file.size);
          fileInfo.classList.remove('hidden');

          // Load image
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              originalImage = img;
              originalPreview.src = e.target.result;
              originalPreview.classList.remove('hidden');
              originalPlaceholder.classList.add('hidden');
              document.getElementById('image-dimensions').textContent = \`\${img.width} x \${img.height}px\`;
              convertBtn.disabled = false;

              // Set default dimensions for custom resize
              document.getElementById('custom-width').value = img.width;
              document.getElementById('custom-height').value = img.height;
              document.getElementById('max-width').value = img.width;
              document.getElementById('max-height').value = img.height;
            };
            img.onerror = () => {
              showImgError('Failed to load image. The file might be corrupted.');
            };
            img.src = e.target.result;
          };
          reader.onerror = () => {
            showImgError('Error reading file.');
          };
          reader.readAsDataURL(file);
        } catch (error) {
          showImgError('An error occurred: ' + error.message);
          console.error(error);
        }
      }

      // Convert Button
      convertBtn.addEventListener('click', convertImage);

       function convertImage() {
         if (!originalImage) return;

         const convertSpinner = document.getElementById('convert-spinner');
         convertSpinner.classList.remove('hidden');
         convertBtn.disabled = true;

         const mode = resizeMode.value;
        let width = originalImage.width;
        let height = originalImage.height;

        // Calculate new dimensions
        if (mode === 'percentage') {
          const scale = parseInt(scaleSlider.value) / 100;
          width = Math.round(originalImage.width * scale);
          height = Math.round(originalImage.height * scale);
        } else if (mode === 'dimensions') {
          const customWidth = parseInt(document.getElementById('custom-width').value);
          const customHeight = parseInt(document.getElementById('custom-height').value);
          const maintainAspect = document.getElementById('maintain-aspect').checked;

          if (maintainAspect) {
            const aspectRatio = originalImage.width / originalImage.height;
            if (customWidth) {
              width = customWidth;
              height = Math.round(width / aspectRatio);
            } else if (customHeight) {
              height = customHeight;
              width = Math.round(height * aspectRatio);
            }
          } else {
            width = customWidth || width;
            height = customHeight || height;
          }
        } else if (mode === 'max-dimensions') {
          const maxW = parseInt(document.getElementById('max-width').value) || width;
          const maxH = parseInt(document.getElementById('max-height').value) || height;
          const aspectRatio = originalImage.width / originalImage.height;

          if (width > maxW) {
            width = maxW;
            height = Math.round(width / aspectRatio);
          }
          if (height > maxH) {
            height = maxH;
            width = Math.round(height * aspectRatio);
          }
        }

        // Create canvas and draw image
        convertedCanvas.width = width;
        convertedCanvas.height = height;
        const ctx = convertedCanvas.getContext('2d');
        ctx.drawImage(originalImage, 0, 0, width, height);

         // Convert to selected format
         const mimeType = selectedFormat === 'jpeg' ? 'image/jpeg' :
                         selectedFormat === 'webp' ? 'image/webp' :
                         selectedFormat === 'gif' ? 'image/gif' : 'image/png';

         const quality = (selectedFormat === 'jpeg' || selectedFormat === 'webp') ?
                        parseInt(qualitySlider.value) / 100 : undefined;

          convertedCanvas.toBlob((blob) => {
            const convertSpinner = document.getElementById('convert-spinner');
            convertSpinner.classList.add('hidden');
            convertBtn.disabled = false;

            // Check if blob is null (unsupported format like GIF)
            if (!blob) {
              showImgError(selectedFormat.toUpperCase() + ' format is not supported by your browser. Please try PNG, JPG, or WebP instead.');
              return;
            }

           // Show converted image
           convertedCanvas.classList.remove('hidden');
           convertedPlaceholder.classList.add('hidden');

           // Display info
           document.getElementById('converted-format').textContent = selectedFormat.toUpperCase();
           document.getElementById('converted-size').textContent = formatFileSize(blob.size);
           document.getElementById('converted-dimensions').textContent = \`\${width} x \${height}px\`;

           // Calculate size reduction
           const reduction = ((originalFile.size - blob.size) / originalFile.size * 100).toFixed(1);
           const reductionText = reduction > 0 ?
             \`Reduced by \${reduction}% (\${formatFileSize(originalFile.size - blob.size)} saved)\` :
             \`Increased by \${Math.abs(reduction)}%\`;
           document.getElementById('size-reduction').textContent = reductionText;

           convertedInfo.classList.remove('hidden');
           downloadBtn.disabled = false;

           // Store blob for download
           downloadBtn.onclick = () => {
             const url = URL.createObjectURL(blob);
             const a = document.createElement('a');
             a.href = url;
             const extension = selectedFormat === 'jpeg' ? 'jpg' : selectedFormat;
             a.download = \`converted-image.\${extension}\`;
             a.click();
             URL.revokeObjectURL(url);
           };
         }, mimeType, quality);
      }

      // Maintain aspect ratio helper
      let lastWidth = null;
      document.getElementById('custom-width').addEventListener('input', (e) => {
        if (document.getElementById('maintain-aspect').checked && originalImage) {
          const aspectRatio = originalImage.width / originalImage.height;
          const newHeight = Math.round(parseInt(e.target.value) / aspectRatio);
          document.getElementById('custom-height').value = newHeight;
        }
      });

      document.getElementById('custom-height').addEventListener('input', (e) => {
        if (document.getElementById('maintain-aspect').checked && originalImage) {
          const aspectRatio = originalImage.width / originalImage.height;
          const newWidth = Math.round(parseInt(e.target.value) * aspectRatio);
          document.getElementById('custom-width').value = newWidth;
        }
      });

      // Utility Functions
      function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
      }
    </script>
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
    title: 'Image Converter',
    description: 'Convert and resize images in your browser. Support for PNG, JPG, WebP, GIF. Privacy-first, client-side processing.',
    path: '/image-converter',
    content: customStyles + pageContent
  });
}

/**
 * Route handler for Image Converter
 */
export async function handleImageConverterRoutes(request, url) {
  const pathname = url.pathname;

  if (pathname === '/image-converter' || pathname === '/image-converter/') {
    return respondHTML(renderImageConverterPage());
  }

  return null;
}
