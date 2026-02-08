/**
 * Image Converter & Resizer Tool
 * Convert between PNG, JPG, WebP, GIF formats
 * Resize images while maintaining quality
 * All processing happens client-side using Canvas API
 */

import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { respondHTML } from '../utils/respond.js';
import { createEducationalSection } from '../utils/content-ui.js';

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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'Image Formats Compared (PNG/JPEG/WebP)',
          content: '<p>Choosing the right image format is crucial for web performance and visual quality. <strong>JPEG</strong> is best for photographs and complex images with many colors, as it uses lossy compression to achieve small file sizes. <strong>PNG</strong> is ideal for images that require transparency or have sharp edges and solid colors (like logos and icons), as it uses lossless compression.</p><p><strong>WebP</strong> is a modern format that provides superior lossy and lossless compression, often resulting in significantly smaller file sizes than JPEG or PNG while maintaining high quality. Our tool supports all these formats, allowing you to optimize your assets for any platform or device without sacrificing clarity.</p>'
        },
        {
          title: 'How to Use This Tool',
          content: '<ol><li>Upload your image by dropping it into the "Upload Image" zone or clicking to browse your files.</li><li>Select your desired output format (PNG, JPG, WebP, or GIF) from the "Convert Format" options.</li><li>If you\'ve selected a lossy format like JPG or WebP, use the quality slider to balance file size and visual fidelity.</li><li>Optionally, use the "Resize Image" settings to scale your image by percentage or specific dimensions.</li><li>Click "Convert & Resize Image" and then "Download" to save your optimized asset.</li></ol>'
        },
        {
          title: 'Common Use Cases',
          content: '<ul><li><strong>Web Optimization:</strong> Convert large PNG or JPEG images to WebP to improve your website\'s load speed and Core Web Vitals.</li><li><strong>Social Media:</strong> Resize and compress photos to meet the specific upload requirements of platforms like Instagram, Twitter, or LinkedIn.</li><li><strong>Email Marketing:</strong> Reduce the file size of images in your email campaigns to ensure they load quickly for all recipients and don\'t get flagged as spam.</li><li><strong>App Development:</strong> Generate multiple sizes of the same icon or asset for different screen densities (e.g., @2x, @3x) using the resizing features.</li></ul>'
        },
        {
          title: 'Pro Tips',
          content: '<ul><li>Use WebP whenever possible for web projects, as it is supported by all modern browsers and offers the best compression-to-quality ratio.</li><li>When converting to JPEG, a quality setting of 70-80% usually provides the best balance between file size and visual quality for most web uses.</li><li>Always keep your original high-resolution images and only convert or resize copies for specific use cases to avoid losing quality over time through repeated compression.</li></ul>'
        }
      ], 'image-converter')}
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
