import { respondHTML } from "../utils/respond.js";
import {
  createPageTemplate,
  createToolHeader,
  createCheatsheet,
  createEmptyState,
} from "../utils/common-ui.js";
import {
  createRichEditorPane,
  getRichEditorStyles,
  getRichEditorScript,
} from "../utils/rich-editor.js";
import { TOOLS } from "../utils/tool-registry.js";
import { createMermaidExportLogic } from "../utils/mermaid-export-logic.js";
import { createRelatedToolsSection } from "../utils/content-ui.js";
import {
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";

export async function handleMermaidStudioRoutes(request, url) {
  if (url.pathname !== "/mermaid-studio" && url.pathname !== "/mermaid-studio/")
    return null;
  if (request.method !== "GET") return null;
  const currentLang = resolveRequestLanguage(request, url);
  const translation = getToolTranslation("mermaid-studio", currentLang);

  const title = translation?.name || "Mermaid Studio";
  const description =
    translation?.desc ||
    "Live Mermaid.js diagram previewer. Create flowcharts, sequence diagrams, and gantt charts with ease.";

  const header = createToolHeader(
    { emoji: "🧜‍♀️" },
    title,
    description,
    [
      {
        text: translation?.ui?.badge9 || "Client-Side Only",
        tooltip: "Diagrams render entirely in your browser using Mermaid.js.",
      },
    ],
    { toolId: "mermaid-studio" },
  );

  const currentTool = TOOLS.find((t) => t.id === "mermaid-studio");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <main class="tool-page-shell min-h-[calc(100vh-4rem)] flex flex-col">
      <div class="tool-page-panel tool-page-panel--fill">
      ${header}

      <div class="mobile-tabs-bar flex lg:hidden items-center gap-1 rounded-lg bg-muted p-1 mb-4 text-muted-foreground" role="tablist" aria-label="Editor or preview">
        <button type="button" id="mobile-tab-editor" class="tab-trigger flex-1" role="tab" aria-selected="true" aria-controls="editor-pane" data-tab="left" tabindex="0"><span data-i18n="tools.mermaid-studio.ui.stat3">Mermaid Code</span></button>
        <button type="button" id="mobile-tab-preview" class="tab-trigger flex-1" role="tab" aria-selected="false" aria-controls="preview-pane" data-tab="right" tabindex="-1"><span data-i18n="tools.mermaid-studio.ui.stat4">Preview</span></button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-350px)] min-h-[600px]">
        <!-- Editor -->
        <div id="editor-pane" class="tool-group tool-group--flush lg:col-span-5 flex flex-col overflow-hidden" role="tabpanel" aria-labelledby="mobile-tab-editor" tabindex="0">
          <div class="px-4 py-3 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center bg-surface-50 dark:bg-surface-950">
            <span class="text-sm font-semibold text-surface-900 dark:text-white uppercase tracking-wider" data-i18n="tools.mermaid-studio.ui.stat3">Mermaid Code</span>
            <div class="flex gap-2">
              <button id="sample-btn" type="button" data-tooltip="Load a sample diagram to get started" class="btn btn-secondary btn-xs"><span data-i18n="tools.mermaid-studio.ui.button0">Load Sample</span></button>
            </div>
          </div>
          ${createRichEditorPane({ id: "mermaid-input", mode: "textarea", rows: 22, ariaLabel: "Mermaid diagram code", placeholder: "graph TD\\nA[Start] --> B{Is it working?}\\nB -- Yes --> C[Great!]\\nB -- No --> D[Debug]", wrapClass: "flex-1" })}
        </div>

        <!-- Preview -->
        <div id="preview-pane" class="tool-group tool-group--flush lg:col-span-7 flex flex-col overflow-hidden" role="tabpanel" aria-labelledby="mobile-tab-preview" tabindex="0">
          <div class="px-4 py-3 border-b border-surface-200 dark:border-surface-800 flex flex-wrap gap-2 justify-between items-center bg-surface-50 dark:bg-surface-950">
            <span class="text-sm font-semibold text-surface-900 dark:text-white uppercase tracking-wider" data-i18n="tools.mermaid-studio.ui.stat4">Preview</span>
            <div class="flex flex-wrap items-center justify-end gap-2">
              <button id="copy-svg" type="button" data-tooltip="Copy the rendered diagram's SVG markup" class="btn btn-secondary btn-xs min-h-[28px]" data-i18n="tools.mermaid-studio.ui.r3_2">Copy SVG</button>
              <button id="download-svg" type="button" data-tooltip="Download the rendered diagram as SVG" class="btn btn-secondary btn-xs min-h-[28px]"><span data-i18n="tools.mermaid-studio.ui.button1">Download SVG</span></button>
              <label for="png-background" class="sr-only" data-i18n="tools.mermaid-studio.ui.r3_4">PNG background</label>
              <select id="png-background" class="input w-auto min-h-[28px] py-0.5 text-xs" data-tooltip="Background for the PNG export">
                <option value="transparent" data-i18n="tools.mermaid-studio.ui.r3_5">Transparent</option>
                <option value="theme" data-i18n="tools.mermaid-studio.ui.r3_6">Theme background</option>
              </select>
              <button id="download-png" type="button" data-tooltip="Download the rendered diagram as a 2x PNG" class="btn btn-secondary btn-xs min-h-[28px]" data-i18n="tools.mermaid-studio.ui.r3_3">Download PNG</button>
            </div>
            <span id="download-status" class="basis-full text-right text-xs text-muted-foreground empty:hidden" role="status" aria-live="polite"></span>
          </div>
          <div id="mermaid-render" class="flex-1 min-h-[24rem] p-8 overflow-auto flex items-center justify-center bg-background">
            ${createEmptyState({ icon: "🧜‍♀️", title: "No diagram yet", description: "Write Mermaid code on the left to see it rendered here.", id: "mermaid-empty-state", i18nTitle: "tools.mermaid-studio.ui.desc10", i18nDesc: "tools.mermaid-studio.ui.desc11" })}
          </div>
        </div>
      </div>

      ${createCheatsheet("mermaid-studio", "Mermaid Syntax Reference", [
        {
          heading: "Diagram Types",
          content: `
          <table>
            <tr><th data-i18n="tools.mermaid-studio.ui.th2">Keyword</th><th data-i18n="tools.mermaid-studio.ui.th3">Type</th></tr>
            <tr><td><code>graph TD</code></td><td>Top-down flowchart</td></tr>
            <tr><td><code>graph LR</code></td><td>Left-right flowchart</td></tr>
            <tr><td><code>sequenceDiagram</code></td><td>Sequence diagram</td></tr>
            <tr><td><code>classDiagram</code></td><td>Class diagram</td></tr>
            <tr><td><code>stateDiagram-v2</code></td><td>State diagram</td></tr>
            <tr><td><code>erDiagram</code></td><td>ER diagram</td></tr>
            <tr><td><code>gantt</code></td><td>Gantt chart</td></tr>
            <tr><td><code>pie</code></td><td data-i18n="tools.mermaid-studio.ui.r3_0">Pie chart</td></tr>
          </table>`,
        },
        {
          heading: "Flowchart Syntax",
          content: `
          <table>
            <tr><th data-i18n="tools.mermaid-studio.ui.th4">Syntax</th><th data-i18n="tools.mermaid-studio.ui.th5">Shape</th></tr>
            <tr><td><code>A[Text]</code></td><td>Rectangle</td></tr>
            <tr><td><code>A(Text)</code></td><td>Rounded</td></tr>
            <tr><td><code>A{Text}</code></td><td>Diamond</td></tr>
            <tr><td><code>A--&gt;B</code></td><td>Arrow</td></tr>
            <tr><td><code>A-.-&gt;B</code></td><td>Dotted arrow</td></tr>
            <tr><td><code>A==&gt;B</code></td><td data-i18n="tools.mermaid-studio.ui.r3_1">Thick arrow</td></tr>
          </table>`,
        },
      ])}
    ${createRelatedToolsSection(relatedToolsData)}
      </div>
    </main>
  `;

  const scripts = `
    <style>
      ${getRichEditorStyles()}
      /* Scoped override: the shared .re-line-numbers gutter text/background
         (surface-400 on surface-100, ~2.31:1) falls short of WCAG AA. Reuse
         the app's --muted-foreground/--muted pair, already calibrated for
         >=4.5:1 against each other in both themes (see styles/input.css). */
      #re-mermaid-input-wrap .re-line-numbers {
        color: hsl(var(--muted-foreground));
        background: hsl(var(--muted));
        border-right-color: hsl(var(--border));
      }
    </style>
    ${getRichEditorScript()}
    <script>
      // Mobile editor/preview tab switch — role="tablist"/"tab"/"tabpanel"
      // with roving tabindex and Arrow key navigation (WAI-ARIA APG tabs
      // pattern). Kept local to this route: the shared mobile-tab helper in
      // common-ui.js emitted role="tab" buttons with no role="tablist"
      // parent (axe: aria-required-parent).
      (function() {
        const tabBar = document.querySelector('.mobile-tabs-bar');
        if (!tabBar) return;
        const tabs = Array.from(tabBar.querySelectorAll('[role="tab"]'));
        const panes = {
          left: document.getElementById('editor-pane'),
          right: document.getElementById('preview-pane'),
        };
        if (!panes.left || !panes.right) return;

        let savedTab = 'left';
        try {
          savedTab = localStorage.getItem('mobile-tab-preference') || 'left';
        } catch (e) {}

        function showTab(tabName, focusTab) {
          panes.left.classList.toggle('mobile-pane-hidden', tabName !== 'left');
          panes.right.classList.toggle('mobile-pane-hidden', tabName === 'left');
          tabs.forEach((tab) => {
            const isActive = tab.getAttribute('data-tab') === tabName;
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
            tab.setAttribute('tabindex', isActive ? '0' : '-1');
            if (isActive && focusTab) tab.focus();
          });
          try { localStorage.setItem('mobile-tab-preference', tabName); } catch (e) {}
        }

        tabs.forEach((tab) => {
          tab.addEventListener('click', () => showTab(tab.getAttribute('data-tab')));
        });

        tabBar.addEventListener('keydown', (e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          const currentIdx = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
          const dir = e.key === 'ArrowLeft' ? -1 : 1;
          const nextIdx = (currentIdx + dir + tabs.length) % tabs.length;
          showTab(tabs[nextIdx].getAttribute('data-tab'), true);
        });

        showTab(savedTab, false);
      })();
    </script>
    <script src="/vendor/mermaid.min.js" integrity="sha384-yQ4mmBBT+vhTAwjFH0toJXNYJ6O4usWnt6EPIdWwrRvx2V/n5lXuDZQwQFeSFydF" crossorigin="anonymous"></script>
    <script>
      const mermaid = window.mermaid;
      const mermaidExport = (${createMermaidExportLogic.toString()})();

      // Mermaid's own theme must track the SITE's active theme (the "dark"
      // class the theme toggle puts on <html>), not a fresh, independent
      // prefers-color-scheme check: those two can disagree (system dark +
      // user-selected light, or vice versa), which rendered a dark-theme
      // diagram (light node/edge-label text) onto the page's light
      // background — measured 1.53:1. themeVariables pin the text colors to
      // the same tokens the rest of the page uses for --foreground, so
      // contrast holds even if mermaid's built-in theme defaults drift.
      function isSiteDark() {
        return document.documentElement.classList.contains('dark');
      }

      function mermaidThemeVariables(dark) {
        const textColor = dark ? '#f8fafc' /* --foreground dark */ : '#12141c' /* --foreground light */;
        return {
          primaryTextColor: textColor,
          textColor: textColor,
          secondaryTextColor: textColor,
          tertiaryTextColor: textColor,
          nodeTextColor: textColor,
          taskTextColor: textColor,
          taskTextOutsideColor: textColor,
        };
      }

      function mermaidConfig() {
        const dark = isSiteDark();
        return {
          startOnLoad: false,
          theme: dark ? 'dark' : 'default',
          securityLevel: 'strict',
          themeVariables: mermaidThemeVariables(dark),
        };
      }

      function applyMermaidTheme() {
        mermaid.initialize(mermaidConfig());
      }

      applyMermaidTheme();

      const editor = new RichEditor('mermaid-input');
      editor.setHighlighter('mermaid');
      const DRAFT_KEY = 'mermaid-studio-draft';
      let savedDraft = null;
      try { savedDraft = localStorage.getItem(DRAFT_KEY); } catch (e) {}
      editor.setValue(savedDraft !== null ? savedDraft : "graph TD\\n    A[Christmas] -->|Get money| B(Go shopping)\\n    B --> C{Let me think}\\n    C -->|One| D[Laptop]\\n    C -->|Two| E[iPhone]\\n    C -->|Three| F[Car]");
      function saveDraft() {
        try { localStorage.setItem(DRAFT_KEY, editor.getValue()); } catch (e) {}
      }

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

       let pendingRender = false;

       async function renderDiagram() {
         const code = editor.getValue().trim();
         if (!code) { showEmptyState(); return; }

         // Rendering into a 0x0 box (pane hidden by the mobile tab switcher)
         // makes mermaid emit a degenerate 16px svg. Defer until the observer
         // reports a real layout box.
         if (!renderArea.clientWidth || !renderArea.clientHeight) {
           pendingRender = true;
           return;
         }
         pendingRender = false;

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
           errDiv.textContent = (window._t ? window._t('tools.mermaid-studio.js.text0', 'Syntax Error: ') : 'Syntax Error: ') + e.message;
           renderArea.appendChild(errDiv);
         }
       }

      editor.el.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => { saveDraft(); renderDiagram(); }, 500);
      });

      sampleBtn.addEventListener('click', () => {
        editor.setValue('sequenceDiagram\\n    Alice->>John: Hello John, how are you?\\n    John-->>Alice: Great!\\n    Alice-)John: See you later!');
        saveDraft();
        renderDiagram();
      });

      const downloadStatus = document.getElementById('download-status');
      const copyBtn = document.getElementById('copy-svg');
      const pngBtn = document.getElementById('download-png');
      const pngBackground = document.getElementById('png-background');

      function renderedSvg(action) {
        const svg = renderArea.querySelector('.mermaid svg');
        if (svg) return svg;
        downloadStatus.textContent = renderArea.querySelector('.mermaid-error')
          ? 'Fix the syntax error first; there is no diagram to ' + action + '.'
          : 'Write a diagram first; there is nothing to ' + action + ' yet.';
        return null;
      }

      function saveBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 0);
      }

      downloadBtn.addEventListener('click', () => {
        const svg = renderedSvg('download');
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        saveBlob(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }), 'diagram.svg');
        downloadStatus.textContent = 'Downloaded diagram.svg.';
      });

      copyBtn.addEventListener('click', async () => {
        const svg = renderedSvg('copy');
        if (!svg) return;
        try {
          await navigator.clipboard.writeText(new XMLSerializer().serializeToString(svg));
          downloadStatus.textContent = 'Copied SVG markup to the clipboard.';
        } catch (e) {
          downloadStatus.textContent = 'Could not copy: the browser blocked clipboard access.';
        }
      });

      // Rasterizing the on-screen SVG fails: Mermaid draws labels as HTML in
      // <foreignObject>, and drawing such an SVG image taints the canvas, so
      // toBlob throws SecurityError. Re-render the same code with htmlLabels
      // off (plain SVG <text>) just for the export; any foreignObject a
      // diagram type still emits is swapped for centred <text>.
      let exportSeq = 0;
      async function renderExportSvg(code) {
        const config = mermaidConfig();
        mermaid.initialize(Object.assign({}, config, {
          htmlLabels: false,
          flowchart: { htmlLabels: false },
          class: { htmlLabels: false },
          state: { htmlLabels: false },
        }));
        try {
          exportSeq += 1;
          return (await mermaid.render('mermaid-export-' + exportSeq, code)).svg;
        } finally {
          mermaid.initialize(config);
        }
      }

      function replaceForeignObjects(svg) {
        const SVG_NS = 'http://www.w3.org/2000/svg';
        svg.querySelectorAll('foreignObject').forEach((fo) => {
          const x = parseFloat(fo.getAttribute('x')) || 0;
          const y = parseFloat(fo.getAttribute('y')) || 0;
          const w = parseFloat(fo.getAttribute('width')) || 0;
          const h = parseFloat(fo.getAttribute('height')) || 0;
          const text = svg.ownerDocument.createElementNS(SVG_NS, 'text');
          text.setAttribute('x', String(x + w / 2));
          text.setAttribute('y', String(y + h / 2));
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'central');
          text.textContent = (fo.textContent || '').trim();
          fo.replaceWith(text);
        });
      }

      async function buildPngBlob(code, background) {
        const svgText = await renderExportSvg(code);
        const svg = new DOMParser().parseFromString(svgText, 'image/svg+xml').documentElement;
        if (!svg || svg.nodeName !== 'svg') throw new Error('Mermaid returned no SVG.');
        replaceForeignObjects(svg);
        const box = mermaidExport.parseViewBox(svg.getAttribute('viewBox'));
        if (!box) throw new Error('The diagram has no usable size.');
        const size = mermaidExport.exportDimensions(box, 2, 8192);
        svg.setAttribute('width', String(box.width));
        svg.setAttribute('height', String(box.height));
        svg.removeAttribute('style');

        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
        await img.decode();

        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;
        const ctx = canvas.getContext('2d');
        if (background) {
          ctx.fillStyle = background;
          ctx.fillRect(0, 0, size.width, size.height);
        }
        ctx.drawImage(img, 0, 0, size.width, size.height);
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('The browser could not encode the PNG.');
        return { blob, size };
      }

      pngBtn.addEventListener('click', async () => {
        if (!renderedSvg('download')) return;
        const background = pngBackground.value === 'theme'
          ? getComputedStyle(renderArea).backgroundColor
          : '';
        pngBtn.disabled = true;
        downloadStatus.textContent = 'Preparing PNG…';
        try {
          const { blob, size } = await buildPngBlob(editor.getValue().trim(), background);
          saveBlob(blob, 'diagram.png');
          downloadStatus.textContent = 'Downloaded diagram.png (' + size.width + ' × ' + size.height + ' px).';
        } catch (e) {
          downloadStatus.textContent = 'Could not export PNG: ' + (e && e.message ? e.message : String(e));
        } finally {
          pngBtn.disabled = false;
        }
      });

      // Handle theme changes — watch the <html class="dark"> attribute
      // directly rather than only prefers-color-scheme, so a manual click on
      // the site's light/dark toggle (which doesn't fire a matchMedia event)
      // re-themes the diagram too, not just an OS-level scheme change.
      new MutationObserver(() => {
        applyMermaidTheme();
        renderDiagram();
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

      // The preview pane starts hidden (the editor/preview toggle defaults to
      // the editor), so the initial render would run against a display:none
      // container. Mermaid measures edge-label positions off real geometry and
      // throws "Could not find a suitable point for the given distance" on a
      // 0x0 box — which is why a perfectly valid flowchart showed an error and
      // switching to Preview then revealed that stale error rather than a
      // diagram. Render only once the area actually has a layout box, and
      // re-render whenever it regains one.
      let lastArea = 0;
      const ensureRendered = () => {
        const w = renderArea.clientWidth;
        const h = renderArea.clientHeight;
        if (!w || !h) { lastArea = 0; return; }
        const area = w * h;
        if (lastArea === 0 && (pendingRender || !renderArea.querySelector('svg'))) {
          lastArea = area;
          renderDiagram();
          return;
        }
        lastArea = area;
      };

      if (typeof ResizeObserver === 'function') {
        new ResizeObserver(ensureRendered).observe(renderArea);
      }
      setTimeout(ensureRendered, 500);
    </script>
  `;

  return respondHTML(
    createPageTemplate({
      title,
      description,
      path: "/mermaid-studio",
      content,
      scripts,
      lang: normalizeLanguage(currentLang),
    }),
  );
}
