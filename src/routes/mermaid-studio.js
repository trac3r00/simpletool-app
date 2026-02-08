import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, createMobileTabView, getMobileTabScript, createEmptyState } from '../utils/common-ui.js';
import { createRichEditorPane, getRichEditorStyles, getRichEditorScript } from '../utils/rich-editor.js';

export async function handleMermaidStudioRoutes(request, url) {
  if (url.pathname !== '/mermaid-studio' && url.pathname !== '/mermaid-studio/') return null;
  if (request.method !== 'GET') return null;

  const title = 'Mermaid Studio';
  const description = 'Live Mermaid.js diagram previewer. Create flowcharts, sequence diagrams, and gantt charts with ease.';

  const header = createToolHeader(
    { emoji: '🧜‍♀️' },
    title,
    'Write diagram code and see it rendered in real-time. Fast, private, and entirely in your browser.',
    [{ text: 'Live Preview', tooltip: 'Updates the rendered diagram instantly as you edit Mermaid code.' },
     { text: 'Flowcharts', tooltip: 'Tailored for creating flowcharts, sequence diagrams, and similar graphs.' },
     { text: 'SVG Export', tooltip: 'Download the rendered diagram as an SVG file for reuse.' }],
    { toolId: 'mermaid-studio' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      ${header}

      ${createMobileTabView({ leftPaneId: 'editor-pane', rightPaneId: 'preview-pane', leftLabel: '<span data-i18n="tools.mermaid-studio.ui.stat3">Mermaid Code</span>', rightLabel: '<span data-i18n="tools.mermaid-studio.ui.stat4">Preview</span>' })}

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-350px)] min-h-[600px]">
        <!-- Editor -->
        <div id="editor-pane" class="lg:col-span-5 flex flex-col bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 overflow-hidden">
          <div class="px-4 py-3 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center bg-surface-50 dark:bg-surface-950">
            <span class="text-sm font-semibold text-surface-900 dark:text-white uppercase tracking-wider" data-i18n="tools.mermaid-studio.ui.stat3">Mermaid Code</span>
            <div class="flex gap-2">
              <button id="sample-btn" data-tooltip="Load a sample diagram to get started" class="btn btn-secondary btn-xs"><span data-i18n="tools.mermaid-studio.ui.button0">Load Sample</span></button>
            </div>
          </div>
          ${createRichEditorPane({ id: 'mermaid-input', mode: 'textarea', rows: 22, placeholder: "graph TD\\nA[Start] --> B{Is it working?}\\nB -- Yes --> C[Great!]\\nB -- No --> D[Debug]", wrapClass: 'flex-1' })}
        </div>

        <!-- Preview -->
        <div id="preview-pane" class="lg:col-span-7 flex flex-col bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 overflow-hidden">
          <div class="px-4 py-3 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center bg-surface-50 dark:bg-surface-950">
            <span class="text-sm font-semibold text-surface-900 dark:text-white uppercase tracking-wider" data-i18n="tools.mermaid-studio.ui.stat4">Preview</span>
            <div class="flex gap-3">
              <button id="download-svg" data-tooltip="Download the rendered diagram as SVG" class="btn btn-secondary btn-xs"><span data-i18n="tools.mermaid-studio.ui.button1">Download SVG</span></button>
            </div>
          </div>
          <div id="mermaid-render" class="flex-1 p-8 overflow-auto flex items-center justify-center bg-white dark:bg-surface-950">
            ${createEmptyState({ icon: '🧜‍♀️', title: 'No diagram yet', description: 'Write Mermaid code on the left to see it rendered here.', id: 'mermaid-empty-state' })}
          </div>
        </div>
      </div>

      ${createCheatsheet('mermaid-studio', 'Mermaid Syntax Reference', [
        { heading: 'Diagram Types', content: `
          <table>
            <tr><th>Keyword</th><th>Type</th></tr>
            <tr><td><code>graph TD</code></td><td>Top-down flowchart</td></tr>
            <tr><td><code>graph LR</code></td><td>Left-right flowchart</td></tr>
            <tr><td><code>sequenceDiagram</code></td><td>Sequence diagram</td></tr>
            <tr><td><code>classDiagram</code></td><td>Class diagram</td></tr>
            <tr><td><code>stateDiagram-v2</code></td><td>State diagram</td></tr>
            <tr><td><code>erDiagram</code></td><td>ER diagram</td></tr>
            <tr><td><code>gantt</code></td><td>Gantt chart</td></tr>
            <tr><td><code>pie</code></td><td>Pie chart</td></tr>
          </table>` },
        { heading: 'Flowchart Syntax', content: `
          <table>
            <tr><th>Syntax</th><th>Shape</th></tr>
            <tr><td><code>A[Text]</code></td><td>Rectangle</td></tr>
            <tr><td><code>A(Text)</code></td><td>Rounded</td></tr>
            <tr><td><code>A{Text}</code></td><td>Diamond</td></tr>
            <tr><td><code>A--&gt;B</code></td><td>Arrow</td></tr>
            <tr><td><code>A-.-&gt;B</code></td><td>Dotted arrow</td></tr>
            <tr><td><code>A==&gt;B</code></td><td>Thick arrow</td></tr>
          </table>` }
      ])}
    </main>
  `;

  const scripts = `
    <style>${getRichEditorStyles()}</style>
    ${getRichEditorScript()}
    ${getMobileTabScript()}
    <script src="/vendor/mermaid.min.js" integrity="sha384-enVdc7lTHDGtpROV85t9+VqPC2EyyB0hsRD0MrvQnHUsHmTHIz2D8SPP4EnBkstH" crossorigin="anonymous"></script>
    <script>
      const mermaid = window.mermaid;

      mermaid.initialize({
        startOnLoad: false,
        theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default',
        securityLevel: 'strict'
      });

      const editor = new RichEditor('mermaid-input');
      editor.setHighlighter('mermaid');
      editor.setValue("graph TD\\n    A[Christmas] -->|Get money| B(Go shopping)\\n    B --> C{Let me think}\\n    C -->|One| D[Laptop]\\n    C -->|Two| E[iPhone]\\n    C -->|Three| F[fa:fa-car Car]");

      const renderArea = document.getElementById('mermaid-render');
      const sampleBtn = document.getElementById('sample-btn');
      const downloadBtn = document.getElementById('download-svg');

      let timeout = null;

       const emptyState = document.getElementById('mermaid-empty-state');

       function showEmptyState() {
         if (emptyState) emptyState.classList.remove('hidden');
         const diagram = renderArea.querySelector('.mermaid');
         if (diagram) diagram.remove();
         const err = renderArea.querySelector('.mermaid-error');
         if (err) err.remove();
       }

       async function renderDiagram() {
         const code = editor.getValue().trim();
         if (!code) { showEmptyState(); return; }

         if (emptyState) emptyState.classList.add('hidden');

         try {
           const prev = renderArea.querySelector('.mermaid');
           if (prev) prev.remove();
           const prevErr = renderArea.querySelector('.mermaid-error');
           if (prevErr) prevErr.remove();

           const mermaidDiv = document.createElement('div');
           mermaidDiv.className = 'mermaid animate-fade-in-up';
           mermaidDiv.textContent = code;
           renderArea.appendChild(mermaidDiv);
           await mermaid.run({
             nodes: [renderArea.querySelector('.mermaid')]
           });
         } catch (e) {
           const prev = renderArea.querySelector('.mermaid');
           if (prev) prev.remove();
           const errDiv = document.createElement('div');
           errDiv.className = 'mermaid-error bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap animate-fade-in-up';
           errDiv.textContent = 'Syntax Error: ' + e.message;
           renderArea.appendChild(errDiv);
         }
       }

      editor.el.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(renderDiagram, 500);
      });

      sampleBtn.addEventListener('click', () => {
        editor.setValue('sequenceDiagram\\n    Alice->>John: Hello John, how are you?\\n    John-->>Alice: Great!\\n    Alice-)John: See you later!');
        renderDiagram();
      });

      downloadBtn.addEventListener('click', () => {
        const svg = renderArea.querySelector('svg');
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'diagram.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });

      // Handle theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        mermaid.initialize({ theme: e.matches ? 'dark' : 'default' });
        renderDiagram();
      });

      // Initial render
      setTimeout(renderDiagram, 500);
    </script>
  `;

  return respondHTML(createPageTemplate({
    title,
    description,
    path: '/mermaid-studio',
    content,
    scripts
  }));
}
