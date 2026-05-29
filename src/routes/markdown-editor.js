import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleMarkdownEditorRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === '/markdown-editor' || pathname === '/markdown-editor/') {
      if (method === 'GET') {
        return renderMarkdownEditorPage(resolveRequestLanguage(request, url));
      }
    }
    return respondJSON({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Markdown Preview Route Error:', error);
    return respondJSON(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function renderMarkdownEditorPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('markdown-editor', currentLang);
  const toolHeader = createToolHeader(
    { emoji: '📝' },
    translation?.name || 'Markdown Editor',
    translation?.desc || 'Live Markdown editor with split-pane preview, Mermaid diagrams, and export tools.',
    [],
    { toolId: 'markdown-editor' }
  );

  const currentTool = TOOLS.find(t => t.id === 'markdown-editor');
    const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];


  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      ${toolHeader}

      <div id="md-preview-root" class="flex flex-col gap-4 min-h-[560px] h-[calc(100vh-20rem)]" data-view="split" style="--split: 55%;">
        <!-- Toolbar -->
        <div class="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 bg-white/95 dark:bg-surface-900/90 backdrop-blur p-3 sm:p-4 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
          <div class="flex flex-wrap items-center gap-3">
            <div class="inline-flex items-center rounded-md border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 overflow-hidden">
              <button type="button" class="view-btn px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors" data-view-mode="split" aria-pressed="true" data-tooltip="Side-by-side editor and preview"><span data-i18n="tools.markdown-editor.ui.button0">Split</span></button>
              <button type="button" class="view-btn px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors" data-view-mode="edit" aria-pressed="false" data-tooltip="Full-width editor only"><span data-i18n="tools.markdown-editor.ui.button1">Editor</span></button>
              <button type="button" class="view-btn px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors" data-view-mode="preview" aria-pressed="false" data-tooltip="Full-width rendered preview only"><span data-i18n="tools.markdown-editor.ui.button2">Preview</span></button>
            </div>

            <div class="hidden sm:flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
              <span id="word-count" role="status">0 words</span>
              <span class="text-surface-300 dark:text-surface-700">|</span>
              <span id="char-count">0 chars</span>
            </div>

            <div class="hidden md:block">
              <label for="outline-select" class="sr-only"><span data-i18n="tools.markdown-editor.ui.label0">Jump to heading</span></label>
              <select id="outline-select" class="max-w-[220px] px-2.5 py-1.5 text-sm bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-md text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500" disabled>
                <option value="" data-i18n="tools.markdown-editor.ui.option9">Jump to heading...</option>
              </select>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <input id="md-file-input" type="file" accept=".md,.markdown,text/markdown,text/plain" class="hidden" />

            <button id="open-md-btn" class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-200 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"></path></svg>
              Open
            </button>

            <button id="clear-md-btn" class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-200 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500">
              <span data-i18n="tools.markdown-editor.ui.button3">Clear</span>
            </button>

            <div class="h-4 w-px bg-surface-300 dark:bg-surface-700 mx-1 hidden sm:block"></div>

            <div class="relative group">
              <button id="export-menu-btn" class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                <span data-i18n="tools.markdown-editor.ui.button11">Export</span>
                <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
              </button>
              <div class="absolute right-0 mt-1 w-48 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-10">
                <button id="copy-md-btn" class="w-full text-left px-4 py-2 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  <span data-i18n="tools.markdown-editor.ui.button4">Copy MD</span>
                </button>
                <button id="copy-html-btn" class="w-full text-left px-4 py-2 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  <span data-i18n="tools.markdown-editor.ui.button5">Copy HTML</span>
                </button>
                <div class="border-t border-surface-200 dark:border-surface-700"></div>
                <button id="download-md-btn" class="w-full text-left px-4 py-2 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  <span data-i18n="tools.markdown-editor.ui.button6">Download .md</span>
                </button>
                <button id="download-html-btn" class="w-full text-left px-4 py-2 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  <span data-i18n="tools.markdown-editor.ui.button7">Download .html</span>
                </button>
                <div class="border-t border-surface-200 dark:border-surface-700"></div>
                <button id="print-btn" class="w-full text-left px-4 py-2 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"></path></svg>
                  <span data-i18n="tools.markdown-editor.ui.title8">Print</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Split Pane -->
        <div class="flex-grow min-h-0">
          <div id="md-split" dir="ltr" class="h-full min-h-0 grid">
            <!-- Editor -->
            <div id="md-editor-pane" class="min-h-0 flex flex-col relative group">
              <label for="markdown-input" class="sr-only"><span data-i18n="tools.markdown-editor.ui.label1">Markdown input</span></label>
              <textarea
                id="markdown-input"
                dir="auto"
                class="flex-grow w-full p-4 font-mono text-sm bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-800 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                placeholder="# Start typing Markdown here...\n\nTip: Mermaid diagrams are supported via code fences:\n\n\`\`\`mermaid\nflowchart TD\n  A[Start] --> B{Works?}\n  B -->|Yes| C[Ship]\n  B -->|No| D[Fix]\n\`\`\`"
                spellcheck="false"
              ></textarea>
              <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span class="text-xs text-surface-400 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded" data-i18n="tools.markdown-editor.ui.desc10">Markdown</span>
              </div>
            </div>

            <!-- Divider -->
            <div id="md-divider" class="flex items-center justify-center cursor-col-resize select-none" aria-hidden="true">
              <div class="w-px h-full bg-surface-200 dark:bg-surface-800"></div>
            </div>

            <!-- Preview -->
            <div id="md-preview-pane" class="min-h-0 flex flex-col relative group bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg overflow-hidden">
              <div
                id="preview-output"
                dir="auto"
                class="flex-grow w-full p-6 overflow-y-auto prose dark:prose-invert max-w-none prose-sm sm:prose-base prose-pre:bg-surface-100 dark:prose-pre:bg-surface-950 prose-pre:border prose-pre:border-surface-200 dark:prose-pre:border-surface-800"
              ></div>
              <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span class="text-xs text-surface-400 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded" data-i18n="tools.markdown-editor.ui.desc7">Preview</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        /* Custom scrollbar for editor and preview */
        textarea::-webkit-scrollbar,
        #preview-output::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        textarea::-webkit-scrollbar-track,
        #preview-output::-webkit-scrollbar-track {
          background: transparent;
        }
        textarea::-webkit-scrollbar-thumb,
        #preview-output::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 4px;
        }
        textarea::-webkit-scrollbar-thumb:hover,
        #preview-output::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.8);
        }

        /* Default Split View Layout */
        #md-split {
          grid-template-rows: 1fr;
          grid-template-columns: minmax(0, var(--split)) 10px minmax(0, 1fr);
        }

        /* View mode overrides */
        #md-preview-root[data-view="edit"] #md-preview-pane,
        #md-preview-root[data-view="edit"] #md-divider {
          display: none;
        }
        #md-preview-root[data-view="edit"] #md-split {
          grid-template-columns: 1fr;
          grid-template-rows: 1fr;
        }

        #md-preview-root[data-view="preview"] #md-editor-pane,
        #md-preview-root[data-view="preview"] #md-divider {
          display: none;
        }
        #md-preview-root[data-view="preview"] #md-split {
          grid-template-columns: 1fr;
          grid-template-rows: 1fr;
        }
        /* Divider affordance */
        #md-divider:hover div {
          background-color: rgba(59, 130, 246, 0.6);
        }

        /* Mermaid canvas */
        .mermaid {
          margin: 1.25rem 0;
          padding: 1rem;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          background: #f8fafc;
          overflow-x: auto;
        }
        .dark .mermaid {
          border-color: #334155;
          background: rgba(2, 6, 23, 0.5);
        }

        /* Code block chrome (post-processed) */
        .md-codeblock {
          position: relative;
        }
        .md-codeblock-toolbar {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          display: flex;
          gap: 0.5rem;
          align-items: center;
          opacity: 0;
          transition: opacity 150ms ease;
        }
        .md-codeblock:hover .md-codeblock-toolbar {
          opacity: 1;
        }
        .md-codeblock-badge {
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          border: 1px solid #e5e7eb;
          background: rgba(255, 255, 255, 0.7);
          color: #334155;
          user-select: none;
        }
        .dark .md-codeblock-badge {
          border-color: #334155;
          background: rgba(2, 6, 23, 0.6);
          color: #e2e8f0;
        }
        .md-codeblock-copy {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          background: rgba(255, 255, 255, 0.85);
          color: #334155;
        }
        .md-codeblock-copy:hover {
          background: rgba(241, 245, 249, 1);
        }
        .dark .md-codeblock-copy {
          border-color: #334155;
          background: rgba(2, 6, 23, 0.75);
          color: #e2e8f0;
        }
        .dark .md-codeblock-copy:hover {
          background: rgba(15, 23, 42, 0.9);
        }

        /* Table styling */
        .prose table {
          width: 100%;
          border-collapse: collapse;
        }
        .prose th,
        .prose td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem;
          text-align: left;
        }
        .dark .prose th,
        .dark .prose td {
          border-color: #374151;
        }
      </style>

      ${createCheatsheet('markdown-preview', 'Markdown Quick Reference', [
        { heading: 'Formatting', content: `
          <table>
            <tr><th data-i18n="tools.markdown-editor.ui.th3">Syntax</th><th data-i18n="tools.markdown-editor.ui.th4">Result</th></tr>
            <tr><td><code>**bold**</code></td><td>Bold text</td></tr>
            <tr><td><code>*italic*</code></td><td>Italic text</td></tr>
            <tr><td><code>~~strike~~</code></td><td>Strikethrough</td></tr>
            <tr><td><code>\`code\`</code></td><td>Inline code</td></tr>
            <tr><td><code>&gt; quote</code></td><td>Blockquote</td></tr>
          </table>` },
        { heading: 'Structure', content: `
          <table>
            <tr><th data-i18n="tools.markdown-editor.ui.th3">Syntax</th><th data-i18n="tools.markdown-editor.ui.th5">Element</th></tr>
            <tr><td><code># H1</code> to <code>###### H6</code></td><td>Headings</td></tr>
            <tr><td><code>- item</code> or <code>* item</code></td><td>Unordered list</td></tr>
            <tr><td><code>1. item</code></td><td>Ordered list</td></tr>
            <tr><td><code>---</code></td><td>Horizontal rule</td></tr>
            <tr><td><code>- [ ] task</code></td><td>Task list</td></tr>
          </table>` },
        { heading: 'Links &amp; Media', content: `
          <table>
            <tr><th data-i18n="tools.markdown-editor.ui.th3">Syntax</th><th data-i18n="tools.markdown-editor.ui.th4">Result</th></tr>
            <tr><td><code>[text](url)</code></td><td>Hyperlink</td></tr>
            <tr><td><code>![alt](url)</code></td><td>Image</td></tr>
            <tr><td><code>[text](url "title")</code></td><td>Link with tooltip</td></tr>
          </table>` },
        { heading: 'Code &amp; Tables', content: '<p>Use triple backticks for code blocks with optional language. Tables use pipes: <code>| Col1 | Col2 |</code> with <code>|---|---|</code> separator.</p>' }
      ])}
    ${createRelatedToolsSection(relatedToolsData)}
    </main>
  `;

  const scripts = `
    <script src="/vendor/marked.min.js" integrity="sha384-8RA8Ah4c9upJmKfg5nH01OgjZoQ3mRX+ngrKYWXQYj2dHYxFqYz8POSlii33f0wB" crossorigin="anonymous"></script>
    <script src="/vendor/purify.min.js" integrity="sha384-pcBjnGbkyKeOXaoFkmJiuR9E08/6gkmus6/Strimnxtl3uk0Hx23v345pWyC/MMr" crossorigin="anonymous"></script>
    <script src="/vendor/mermaid.min.js" integrity="sha384-enVdc7lTHDGtpROV85t9+VqPC2EyyB0hsRD0MrvQnHUsHmTHIz2D8SPP4EnBkstH" crossorigin="anonymous"></script>

    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const root = document.getElementById('md-preview-root');
        const split = document.getElementById('md-split');
        const divider = document.getElementById('md-divider');
        const outlineSelect = document.getElementById('outline-select');
        const input = document.getElementById('markdown-input');
        const preview = document.getElementById('preview-output');
        const wordCount = document.getElementById('word-count');
        const charCount = document.getElementById('char-count');
        const mdFileInput = document.getElementById('md-file-input');

         const openMdBtn = document.getElementById('open-md-btn');
         const clearMdBtn = document.getElementById('clear-md-btn');
         const exportMenuBtn = document.getElementById('export-menu-btn');
         const copyMdBtn = document.getElementById('copy-md-btn');
         const copyHtmlBtn = document.getElementById('copy-html-btn');
         const downloadMdBtn = document.getElementById('download-md-btn');
         const downloadHtmlBtn = document.getElementById('download-html-btn');
         const printBtn = document.getElementById('print-btn');

        const viewBtns = document.querySelectorAll('.view-btn');

        function getMermaidTheme() {
          return document.documentElement.classList.contains('dark') ? 'dark' : 'default';
        }

        function normalizeHeadingId(text) {
          return String(text || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 80);
        }

        // Configure Marked
        marked.setOptions({
          gfm: true,
          breaks: true,
          headerIds: true,
          mangle: false,
          langPrefix: 'language-'
        });

        // Load from LocalStorage
        const savedContent = localStorage.getItem('markdown-content');
        input.value = savedContent || '';

        // State
        let isScrolling = false;
        let timeoutId = null;
        let mermaidInitialized = false;

        function buildOutline() {
          if (!outlineSelect) return;
          outlineSelect.innerHTML = '<option value="" data-i18n="tools.markdown-editor.ui.option9">Jump to heading...</option>';

          const headings = preview.querySelectorAll('h1, h2, h3, h4, h5, h6');
          const items = [];
          const used = new Set();

          headings.forEach(h => {
            const level = parseInt(h.tagName.slice(1), 10);
            const text = (h.textContent || '').trim();
            if (!text) return;

            let id = h.getAttribute('id');
            if (!id) {
              const base = normalizeHeadingId(text) || 'section';
              let candidate = base;
              let n = 2;
              while (used.has(candidate) || document.getElementById(candidate)) {
                candidate = base + '-' + n;
                n++;
              }
              id = candidate;
              h.setAttribute('id', id);
            }
            used.add(id);
            items.push({ id, level, text });
          });

          outlineSelect.disabled = items.length === 0;
          items.forEach(item => {
            const opt = document.createElement('option');
            const pad = Math.max(0, item.level - 1);
            opt.value = item.id;
            opt.textContent = (pad ? '  '.repeat(pad) : '') + item.text;
            outlineSelect.appendChild(opt);
          });
        }

        function decorateCodeBlocks() {
          const blocks = preview.querySelectorAll('pre');
          blocks.forEach(pre => {
            if (pre.querySelector('.md-codeblock-toolbar')) return;
            const code = pre.querySelector('code');
            if (!code) return;

            const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
            const lang = langClass ? langClass.replace('language-', '') : '';
            pre.classList.add('md-codeblock');

            const toolbar = document.createElement('div');
            toolbar.className = 'md-codeblock-toolbar';

            const badge = document.createElement('span');
            badge.className = 'md-codeblock-badge';
            badge.textContent = lang || 'code';
            toolbar.appendChild(badge);

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'md-codeblock-copy';
            btn.textContent = _t('tools.markdown-editor.js.text0', 'Copy');
            btn.addEventListener('click', async () => {
              try {
                await navigator.clipboard.writeText(code.textContent || '');
                const old = btn.textContent;
                btn.textContent = _t('tools.markdown-editor.js.text1', 'Copied');
                if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
                setTimeout(() => (btn.textContent = old), 1200);
              } catch (e) {
                console.error('Copy failed:', e);
              }
            });
            toolbar.appendChild(btn);

            pre.appendChild(toolbar);
          });
        }

        function transformMermaidBlocks() {
          const codeBlocks = preview.querySelectorAll('pre > code');
          codeBlocks.forEach(code => {
            const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
            const lang = langClass ? langClass.replace('language-', '').toLowerCase() : '';
            if (lang !== 'mermaid') return;

            const pre = code.closest('pre');
            if (!pre) return;
            const mermaidDiv = document.createElement('div');
            mermaidDiv.className = 'mermaid';
            mermaidDiv.textContent = code.textContent || '';
            pre.replaceWith(mermaidDiv);
          });
        }

        async function renderMermaid() {
          if (!window.mermaid) return;
          try {
            if (!mermaidInitialized) {
              window.mermaid.initialize({
                startOnLoad: false,
                securityLevel: 'strict',
                theme: getMermaidTheme()
              });
              mermaidInitialized = true;
            }
            // Re-apply theme each run (handles light/dark toggles)
            window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: getMermaidTheme() });
            await window.mermaid.run({ querySelector: '#preview-output .mermaid' });
          } catch (e) {
            console.error('Mermaid render failed:', e);
          }
        }

        function updatePreview() {
          const rawMarkdown = input.value;
          const prevScrollPct = preview.scrollHeight > preview.clientHeight
            ? (preview.scrollTop / (preview.scrollHeight - preview.clientHeight))
            : 0;

          try {
            localStorage.setItem('markdown-content', rawMarkdown);
          } catch (e) {}

          const words = rawMarkdown.trim() ? rawMarkdown.trim().split(/\\s+/).length : 0;
          wordCount.textContent = words + ' word' + (words !== 1 ? 's' : '');
          charCount.textContent = rawMarkdown.length + ' char' + (rawMarkdown.length !== 1 ? 's' : '');

          try {
            const html = marked.parse(rawMarkdown);
            const cleanHtml = DOMPurify.sanitize(html, {
              ADD_TAGS: ['input'],
              ADD_ATTR: ['checked', 'disabled', 'type']
            });
            preview.innerHTML = cleanHtml;

            transformMermaidBlocks();
            decorateCodeBlocks();
            buildOutline();
            renderMermaid();

            requestAnimationFrame(() => {
              if (preview.scrollHeight > preview.clientHeight) {
                preview.scrollTop = prevScrollPct * (preview.scrollHeight - preview.clientHeight);
              }
            });
          } catch (e) {
            console.error('Markdown parsing error:', e);
          }
        }

        // Initial render
        updatePreview();

        // Debounced updates
        input.addEventListener('input', () => {
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(updatePreview, 20);
        });

         // Sync scroll with line-number mapping for better accuracy
         const getLineNumber = (element) => {
           if (element === input) {
             const text = input.value.substring(0, input.selectionStart);
             return text.split('\\n').length - 1;
           }
           return 0;
         };

         const syncScroll = (source, target) => {
           if (isScrolling) return;
           isScrolling = true;

           // Try line-based sync for textarea → preview
           if (source === input && target === preview) {
             const lines = input.value.split('\\n');
             const scrollPct = input.scrollHeight > input.clientHeight
               ? (input.scrollTop / (input.scrollHeight - input.clientHeight))
               : 0;
             
             // Estimate which line is at top of viewport
             const avgLineHeight = input.scrollHeight / Math.max(lines.length, 1);
             const estimatedLine = Math.floor((input.scrollTop / avgLineHeight));
             
             // Find corresponding heading in preview
             const headings = preview.querySelectorAll('h1, h2, h3, h4, h5, h6');
             let targetScroll = scrollPct * (preview.scrollHeight - preview.clientHeight);
             
             if (headings.length > 0) {
               // Use heading positions as anchor points for better sync
               const headingIndex = Math.min(estimatedLine / 5, headings.length - 1);
               if (headingIndex >= 0) {
                 const heading = headings[Math.floor(headingIndex)];
                 if (heading) {
                   targetScroll = Math.max(0, heading.offsetTop - preview.clientHeight * 0.2);
                 }
               }
             }
             
             target.scrollTop = targetScroll;
           } else if (source === preview && target === input) {
             // Preview → textarea: use percentage-based sync
             const denom = source.scrollHeight - source.clientHeight;
             const percentage = denom > 0 ? (source.scrollTop / denom) : 0;
             const targetDenom = target.scrollHeight - target.clientHeight;
             target.scrollTop = percentage * (targetDenom > 0 ? targetDenom : 0);
           }

           setTimeout(() => { isScrolling = false; }, 50);
         };
         input.addEventListener('scroll', () => syncScroll(input, preview));
         preview.addEventListener('scroll', () => syncScroll(preview, input));

        // Outline jump
        outlineSelect?.addEventListener('change', () => {
          const id = outlineSelect.value;
          if (!id) return;
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
        });

        // View mode
        function setViewMode(mode) {
          root.setAttribute('data-view', mode);
          viewBtns.forEach(btn => {
            const isActive = btn.getAttribute('data-view-mode') === mode;
            btn.setAttribute('aria-pressed', String(isActive));
            btn.classList.toggle('bg-white', isActive);
            btn.classList.toggle('dark:bg-surface-900', isActive);
          });
          try {
            localStorage.setItem('markdown-view', mode);
          } catch (e) {}
        }
        const storedView = localStorage.getItem('markdown-view');
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
        setViewMode(storedView || (isMobile ? 'edit' : 'split'));
        viewBtns.forEach(btn => {
          btn.addEventListener('click', () => setViewMode(btn.getAttribute('data-view-mode')));
        });

        // Draggable split (horizontal)
        let isDragging = false;
        divider?.addEventListener('pointerdown', (e) => {
          isDragging = true;
          divider.setPointerCapture(e.pointerId);
          e.preventDefault();
        });
        divider?.addEventListener('pointermove', (e) => {
          if (!isDragging) return;
          const rect = split.getBoundingClientRect();
          const x = e.clientX - rect.left;
          let pct = (x / rect.width) * 100;

          pct = Math.max(20, Math.min(80, pct));
          root.style.setProperty('--split', pct.toFixed(2) + '%');
          try {
            localStorage.setItem('markdown-split', String(pct));
          } catch (err) {}
        });
        divider?.addEventListener('pointerup', () => {
          isDragging = false;
        });
        const storedSplit = parseFloat(localStorage.getItem('markdown-split') || '');
        if (Number.isFinite(storedSplit)) {
          root.style.setProperty('--split', Math.max(20, Math.min(80, storedSplit)).toFixed(2) + '%');
        }

        // Open markdown file
        openMdBtn.addEventListener('click', () => mdFileInput.click());
        mdFileInput.addEventListener('change', async () => {
          const file = mdFileInput.files && mdFileInput.files[0];
          if (!file) return;
          try {
            const text = await file.text();
            input.value = text;
            updatePreview();
          } catch (e) {
            console.error('File read failed:', e);
          } finally {
            mdFileInput.value = '';
          }
        });

        // Clear
        clearMdBtn.addEventListener('click', () => {
          input.value = '';
          updatePreview();
          try {
            localStorage.removeItem('markdown-content');
          } catch (e) {}
        });

        // Copy Markdown
        copyMdBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(input.value || '');
            const originalText = copyMdBtn.textContent;
            copyMdBtn.textContent = _t('tools.markdown-editor.js.text1', 'Copied');
            if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
            setTimeout(() => { copyMdBtn.textContent = originalText; }, 1200);
          } catch (err) {
            console.error('Failed to copy:', err);
          }
        });

        // Copy HTML
        copyHtmlBtn.addEventListener('click', async () => {
          const html = preview.innerHTML;
          try {
            await navigator.clipboard.writeText(html);
            const originalText = copyHtmlBtn.textContent;
            copyHtmlBtn.textContent = _t('tools.markdown-editor.js.text1', 'Copied');
            if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
            setTimeout(() => { copyHtmlBtn.textContent = originalText; }, 1200);
          } catch (err) {
            console.error('Failed to copy:', err);
          }
        });

        // Download .md
        downloadMdBtn.addEventListener('click', () => {
          const blob = new Blob([input.value], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'document.md';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });

        function getExportHTML(title) {
          const parts = [
            '<!DOCTYPE html>',
            '<html lang="en">',
            '<head>',
            '  <meta charset="UTF-8">',
            '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
            '  <title>' + title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</title>',
            '  <style>',
            '    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; color: #111827; }',
            '    pre { background: #f4f4f5; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }',
            '    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }',
            '    img { max-width: 100%; }',
            '    blockquote { border-left: 4px solid #e5e7eb; margin: 0; padding-left: 1rem; color: #6b7280; }',
            '    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }',
            '    th, td { border: 1px solid #e5e7eb; padding: 0.5rem; text-align: left; }',
            '    .mermaid { border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1rem; background: #f8fafc; overflow-x: auto; }',
            '    @media print { body { padding: 0; } }',
            '  </style>',
            '</head>',
            '<body>',
            preview.innerHTML,
            '</body>',
            '</html>'
          ];
          return parts.join('\\n');
        }

        // Download .html
        downloadHtmlBtn.addEventListener('click', () => {
          const htmlContent = getExportHTML('Markdown Export');
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'document.html';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });

         // Print preview
         printBtn?.addEventListener('click', () => {
           const htmlContent = getExportHTML('Markdown Print');
           const w = window.open('', '_blank', 'noopener,noreferrer');
           if (!w) return;
           w.document.open();
           w.document.write(htmlContent);
           w.document.close();
           w.focus();
           setTimeout(() => w.print(), 250);
         });

         // Close export dropdown on click outside
         document.addEventListener('click', (e) => {
           const exportMenu = exportMenuBtn?.closest('.group');
           if (exportMenu && !exportMenu.contains(e.target)) {
             exportMenu.classList.remove('group-hover:opacity-100', 'group-hover:visible');
           }
           
           const toggleBtn = e.target.closest('[data-theme-toggle]');
           if (!toggleBtn) return;
           setTimeout(updatePreview, 200);
         });
      });
    </script>
  `;

  return respondHTML(
    createPageTemplate({
      title: translation?.name || 'Markdown Editor',
      description: translation?.desc || 'Split-pane Markdown editor with sync scroll and GFM support.',
      path: '/markdown-editor',
      content,
      scripts,
      lang: currentLang
    })
  );
}
