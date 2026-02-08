/**
 * Code Minifier & Beautifier Tool
 * Minify and beautify JavaScript, CSS, HTML, and JSON code
 * All processing happens client-side
 */

import { createPageTemplate, createToolHeader, getCopyToClipboardScript, getDownloadFileScript } from '../utils/common-ui.js';
import { respondHTML } from '../utils/respond.js';
import { createEducationalSection } from '../utils/content-ui.js';

/**
 * Render the Code Minifier page
 */
function renderCodeMinifierPage() {
  const toolHeader = createToolHeader(
    { emoji: '📦' },
    'Code Minifier',
    'Minify and beautify JavaScript, CSS, HTML, and JSON code with one click. Optimize your code for production or improve readability.',
    [{ text: 'Client-Side Only', tooltip: 'Runs entirely in your browser using Web APIs — your code never leaves your device.' }],
    { toolId: 'code-minifier' }
  );

  const pageContent = `

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}

      <!-- Language Tabs -->
      <div class="flex justify-center mb-6 border-b-2 border-surface-200 dark:border-surface-700">
        <div class="flex gap-2">
          <button class="language-tab active" data-lang="javascript" data-tooltip="Minify JavaScript code"><span data-i18n="tools.code-minifier.ui.button0">JavaScript</span></button>
          <button class="language-tab" data-lang="css" data-tooltip="Minify CSS stylesheets">CSS</button>
          <button class="language-tab" data-lang="html" data-tooltip="Minify HTML markup">HTML</button>
          <button class="language-tab" data-lang="json" data-tooltip="Format or minify JSON data">JSON</button>
        </div>
      </div>

      <!-- Mode Selection -->
      <div class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button id="minify-btn" class="mode-btn btn btn-primary active" data-tooltip="Remove whitespace and shorten code for production">
            <span data-i18n="tools.code-minifier.ui.button1">🗜️ Minify Code</span>
          </button>
          <button id="beautify-btn" class="mode-btn btn btn-secondary" data-tooltip="Add indentation and formatting for readability">
            <span data-i18n="tools.code-minifier.ui.button2">✨ Beautify Code</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Input -->
        <div>
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.code-minifier.ui.heading8">📝 Input Code</h2>
            <button id="clear-input-btn" class="btn btn-ghost text-sm">
              <span data-i18n="tools.code-minifier.ui.button3">🗑️ Clear</span>
            </button>
          </div>

          <textarea id="input-code" class="code-editor w-full p-4 border-2 border-surface-300 dark:border-surface-700 rounded-lg bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 resize-vertical" placeholder="Paste your code here..." data-i18n-placeholder="tools.code-minifier.ui.placeholder6"></textarea>

          <div class="mt-3 text-sm text-surface-600 dark:text-surface-400">
            <span id="input-size">Size: 0 bytes</span>
          </div>
        </div>

        <!-- Output -->
        <div>
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.code-minifier.ui.heading9">✅ Output Code</h2>
            <div class="flex gap-2">
              <button id="copy-output-btn" class="btn btn-primary text-sm">
                <span data-i18n="tools.code-minifier.ui.button4">📋 Copy</span>
              </button>
              <button id="download-output-btn" class="btn btn-secondary text-sm">
                <span data-i18n="tools.code-minifier.ui.button5">💾 Download</span>
              </button>
            </div>
          </div>

          <textarea id="output-code" class="code-editor w-full p-4 border-2 border-surface-300 dark:border-surface-700 rounded-lg bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 resize-vertical" readonly placeholder="Output will appear here..." data-i18n-placeholder="tools.code-minifier.ui.placeholder7"></textarea>

          <div id="output-stats" class="mt-3 text-sm text-surface-600 dark:text-surface-400 hidden">
            <span id="output-size"></span>
            <span id="reduction" class="ml-4 font-semibold"></span>
          </div>
        </div>
      </div>

      <!-- Info -->
      <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
          <h3 class="font-bold text-surface-900 dark:text-surface-100 mb-2" data-i18n="tools.code-minifier.ui.heading10">🗜️ Minification</h3>
          <p class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.code-minifier.ui.desc13">
            Removes whitespace, comments, and optimizes code for smaller file sizes. Perfect for production.
          </p>
        </div>

        <div class="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
          <h3 class="font-bold text-surface-900 dark:text-surface-100 mb-2" data-i18n="tools.code-minifier.ui.heading11">✨ Beautification</h3>
          <p class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.code-minifier.ui.desc14">
            Formats code with proper indentation and spacing. Makes code more readable and maintainable.
          </p>
        </div>

        <div class="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
          <h3 class="font-bold text-surface-900 dark:text-surface-100 mb-2" data-i18n="tools.code-minifier.ui.heading12">🔒 Privacy First</h3>
          <p class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.code-minifier.ui.desc15">
            All processing happens in your browser. Your code never leaves your device.
          </p>
        </div>
      </div>
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'What is Minification?',
          content: '<p>Minification is the process of removing all unnecessary characters from source code without changing its functionality. This includes removing whitespace, newlines, comments, and sometimes shortening variable names. The goal is to reduce the file size of the code, which in turn reduces the amount of data that needs to be transferred over the network.</p><p>This leads to faster page load times and improved performance for web applications. While minification is essential for production environments, it makes the code nearly impossible for humans to read and debug. Therefore, it is typically performed as a final step in the build process before deploying to a live server.</p>'
        },
        {
          title: 'How to Use This Tool',
          content: '<ol><li>Select the programming language (JavaScript, CSS, HTML, or JSON) from the tabs at the top.</li><li>Paste your source code into the "Input Code" text area on the left.</li><li>Click the "Minify Code" button to reduce the file size for production use.</li><li>Alternatively, click "Beautify Code" to add indentation and formatting for better readability.</li><li>View the results in the "Output Code" area and click "Copy" or "Download" to save your optimized code.</li></ol>'
        },
        {
          title: 'Common Use Cases',
          content: '<ul><li><strong>Production Deployment:</strong> Minify your JS and CSS files before uploading them to your web server to improve site speed and SEO.</li><li><strong>Email Templates:</strong> Minify HTML email code to ensure it stays under the size limits of various email clients and loads quickly for recipients.</li><li><strong>API Responses:</strong> Minify JSON data before sending it from your server to reduce bandwidth usage and egress costs.</li><li><strong>Code Auditing:</strong> Use the beautifier to format messy or minified code you\'ve found online to understand how it works.</li></ul>'
        },
        {
          title: 'Pro Tips',
          content: '<ul><li>Always keep your original, unminified source code for development and only use the minified version for production deployment.</li><li>Use Source Maps to bridge the gap between minified production code and readable development code, allowing for efficient debugging in the browser.</li><li>Combine minification with Gzip or Brotli compression on your server for the maximum possible reduction in file size and transfer time.</li></ul>'
        }
      ], 'code-minifier')}
    </div>
  `;


  const customStyles = `
    <style>
      .code-editor {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
        font-size: 14px;
        line-height: 1.6;
        min-height: 400px;
      }

      .language-tab {
        padding: 0.75rem 1.5rem;
        border: 1px solid transparent;
        border-bottom: none;
        border-radius: 8px 8px 0 0;
        font-weight: 600;
        transition: all 0.2s;
        cursor: pointer;
        background: #f4f4f5;
        color: #71717a;
      }

      .dark .language-tab {
        background: #27272a;
        color: #a1a1aa;
      }

      .language-tab.active {
        background: white;
        color: #4f46e5;
        border-color: #e4e4e7;
        border-bottom-color: white;
      }

      .dark .language-tab.active {
        background: #18181b;
        color: #818cf8;
        border-color: #3f3f46;
        border-bottom-color: #18181b;
      }

      .mode-btn {
        padding: 1rem 2rem;
        font-weight: 600;
        transition: all 0.2s;
      }

      .mode-btn.active {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    </style>
  `;

  return createPageTemplate({
    title: 'Code Minifier',
    description: 'Minify and beautify JavaScript, CSS, HTML, and JSON code. Optimize for production or improve readability.',
    path: '/code-minifier',
    content: customStyles + pageContent
  });
}

/**
 * Route handler for Code Minifier
 */
export async function handleCodeMinifierRoutes(request, url) {
  const pathname = url.pathname;

  // Only handle exact matches for the code minifier route
  if (pathname === '/code-minifier' || pathname === '/code-minifier/') {
    if (request.method !== 'GET') {
      // Return 405 Method Not Allowed for non-GET requests
      return new Response('Method Not Allowed', {
        status: 405,
        headers: {
          'Content-Type': 'text/plain',
          'Allow': 'GET'
        }
      });
    }
    return respondHTML(renderCodeMinifierPage());
  }

  // Return null to let the main router handle 404
  return null;
}
