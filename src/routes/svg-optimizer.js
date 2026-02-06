/**
 * SVG Optimizer & Editor
 * - Sanitizes SVG (DOMPurify)
 * - Optimizes/minifies markup
 * - Previews SVG and allows simple color replacements
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint } from '../utils/common-ui.js';

export async function handleSVGOptimizerRoutes(request, url) {
  const { pathname } = url;
  if (pathname === '/svg-optimizer' || pathname === '/svg-optimizer/') {
    if (request.method === 'GET') return respondHTML(renderSVGOptimizerPage());
    return new Response('Method not allowed', { status: 405 });
  }
  return null;
}

function renderSVGOptimizerPage() {
  const title = 'SVG Optimizer & Editor';
  const description = 'Clean up and preview SVGs, then quickly adjust fill/stroke colors — all locally.';

  const header = createToolHeader(
    { emoji: '✍️' },
    title,
    description,
    [
      { text: '<span data-i18n="tools.svg-optimizer.ui.badge0">Sanitized</span>', tooltip: 'Removes scripts/foreignObject/event handlers for safe preview.' },
      { text: '<span data-i18n="tools.svg-optimizer.ui.badge1">Icon Workflow</span>', tooltip: 'Extract colors and replace them with a few clicks.' }
    ],
    { toolId: 'svg-optimizer' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${header}

        <div class="flex flex-wrap gap-3 mb-6 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
          <button id="preview-btn" class="btn btn-primary">👁️ <span data-i18n="tools.svg-optimizer.ui.button0">Preview</span></button>
          <button id="optimize-btn" class="btn btn-secondary">🧼 <span data-i18n="tools.svg-optimizer.ui.button1">Optimize</span></button>
          <button id="minify-btn" class="btn btn-secondary">📦 <span data-i18n="tools.svg-optimizer.ui.button2">Minify</span></button>
          <button id="currentcolor-btn" class="btn btn-secondary">🎯 <span data-i18n="tools.svg-optimizer.ui.button3">currentColor</span></button>
          <button id="clear-btn" class="btn btn-ghost ml-auto">🗑️ <span data-i18n="tools.svg-optimizer.ui.button4">Clear</span></button>
          <button id="copy-btn" class="btn btn-secondary" disabled>📋 <span data-i18n="tools.svg-optimizer.ui.button5">Copy</span></button>
          <button id="download-btn" class="btn btn-secondary" disabled>💾 <span data-i18n="tools.svg-optimizer.ui.button6">Download</span></button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-3">
            <label class="label flex items-center gap-2">
              <span data-i18n="tools.svg-optimizer.ui.label0">SVG Input</span>
              ${infoHint('Paste an SVG. This tool sanitizes it for safe preview using DOMPurify (client-side).', 'Help', { i18nKey: 'tools.svg-optimizer.ui.desc0' })}
            </label>
            <textarea id="svg-input" rows="18" class="input-mono resize-y" placeholder="&lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 24 24&quot;&gt;...&lt;/svg&gt;" data-i18n-placeholder="tools.svg-optimizer.ui.placeholder0"></textarea>

            <div class="grid grid-cols-2 gap-3">
              <label class="inline-flex items-center gap-2 cursor-pointer text-sm text-surface-700 dark:text-surface-300">
                <input id="strip-metadata" type="checkbox" class="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" checked>
                <span data-i18n="tools.svg-optimizer.ui.label1">Remove &lt;title&gt;/&lt;desc&gt;/&lt;metadata&gt;</span>
              </label>
              <label class="inline-flex items-center gap-2 cursor-pointer text-sm text-surface-700 dark:text-surface-300">
                <input id="strip-dimensions" type="checkbox" class="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500">
                <span data-i18n="tools.svg-optimizer.ui.label2">Remove width/height</span>
              </label>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.svg-optimizer.ui.stat0">Input bytes</div>
                <div class="text-xl font-bold font-mono" id="in-bytes">0</div>
              </div>
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.svg-optimizer.ui.stat1">Output bytes</div>
                <div class="text-xl font-bold font-mono" id="out-bytes">0</div>
              </div>
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.svg-optimizer.ui.stat2">Colors</div>
                <div class="text-xl font-bold font-mono" id="color-count">0</div>
              </div>
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.svg-optimizer.ui.stat3">ViewBox</div>
                <div class="text-sm font-mono break-words" id="viewbox">—</div>
              </div>
            </div>

            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <div class="flex items-center justify-between gap-3 mb-3">
                <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.svg-optimizer.ui.heading0">Colors</h2>
                <div class="flex items-center gap-2">
                  <button id="apply-colors" class="btn btn-secondary text-xs py-1 px-2" disabled data-i18n="tools.svg-optimizer.ui.button7">Apply</button>
                  <span class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.svg-optimizer.ui.text0">fill/stroke/stop-color</span>
                </div>
              </div>
              <div id="colors" class="space-y-2 text-sm text-surface-700 dark:text-surface-200">
                <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.svg-optimizer.ui.desc1">Preview an SVG to extract colors.</p>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.svg-optimizer.ui.heading1">Preview</h2>
              <div id="preview" class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 min-h-[320px] flex items-center justify-center overflow-auto" aria-label="SVG preview" data-i18n-aria="tools.svg-optimizer.ui.aria0">
                <div class="text-sm text-surface-500 dark:text-surface-400" data-i18n="tools.svg-optimizer.ui.desc2">No preview yet.</div>
              </div>
            </div>

            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <div class="flex items-center justify-between mb-3">
                <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.svg-optimizer.ui.heading2">Output SVG</h2>
              </div>
              <textarea id="svg-output" rows="12" class="input-mono resize-y bg-surface-50 dark:bg-surface-950" readonly placeholder="Optimized SVG will appear here..." data-i18n-placeholder="tools.svg-optimizer.ui.placeholder1"></textarea>
            </div>
          </div>
        </div>

        ${createCheatsheet('svg-optimizer', '<span data-i18n="tools.svg-optimizer.ui.heading3">SVG Safety Notes</span>', [
          {
            heading: '<span data-i18n="tools.svg-optimizer.ui.heading4">Sanitization</span>',
            content: `
              <p data-i18n="tools.svg-optimizer.ui.desc3">SVG can execute scripts or load external resources. This tool sanitizes the markup before preview and removes risky elements/attributes.</p>
              <ul class="list-disc ml-6 space-y-1">
                <li><span data-i18n="tools.svg-optimizer.ui.desc4">Removes</span> <code>&lt;script&gt;</code>, <code>&lt;foreignObject&gt;</code>, <span data-i18n="tools.svg-optimizer.ui.desc5">and event handler attributes</span> (<code>on*</code>).</li>
                <li><span data-i18n="tools.svg-optimizer.ui.desc6">Strips external</span> <code>href</code>/<code>xlink:href</code> <span data-i18n="tools.svg-optimizer.ui.desc7">unless it’s an internal</span> <code>#id</code> <span data-i18n="tools.svg-optimizer.ui.desc8">reference.</span></li>
              </ul>
            `
          }
        ])}
      </div>
    </main>
  `;

  const scripts = String.raw`
    <script src="/vendor/purify.min.js" integrity="sha384-BjfVFB+DQXdwMb+gLCO2/H8GkAukZu/tIKIpJwtsEIKZB1OxoOHwn0dHsiubTmLN" crossorigin="anonymous"></script>
    <script>
      const t = (k, fb) => (window._t ? window._t('tools.svg-optimizer.js.' + k, fb) : (fb || k));

      const $ = (id) => document.getElementById(id);
      const els = {
        input: $('svg-input'),
        output: $('svg-output'),
        preview: $('preview'),
        colors: $('colors'),
        applyColors: $('apply-colors'),
        inBytes: $('in-bytes'),
        outBytes: $('out-bytes'),
        colorCount: $('color-count'),
        viewBox: $('viewbox'),
        stripMetadata: $('strip-metadata'),
        stripDimensions: $('strip-dimensions'),
        previewBtn: $('preview-btn'),
        optimizeBtn: $('optimize-btn'),
        minifyBtn: $('minify-btn'),
        currentColorBtn: $('currentcolor-btn'),
        clearBtn: $('clear-btn'),
        copyBtn: $('copy-btn'),
        downloadBtn: $('download-btn'),
      };

      let current = { input: '', sanitized: '', optimized: '', doc: null, editDoc: null, editSvg: null, mapping: null, lastMinify: false };

      function utf8Bytes(text) {
        try { return new TextEncoder().encode(String(text || '')).length; } catch (e) { return String(text || '').length; }
      }

      function setPreviewMessage(msg) {
        els.preview.innerHTML = '';
        const div = document.createElement('div');
        div.className = 'text-sm text-surface-500 dark:text-surface-400';
        div.textContent = msg;
        els.preview.appendChild(div);
      }

      function sanitizeSvg(raw) {
        const s = String(raw || '').trim();
        if (!s) return { ok: false, error: t('text0', 'Paste an SVG first.') };
        if (!window.DOMPurify) return { ok: false, error: t('text1', 'DOMPurify not loaded.') };

        // DOMPurify supports SVG profiles.
        const clean = window.DOMPurify.sanitize(s, {
          USE_PROFILES: { svg: true, svgFilters: true },
          FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'object', 'embed'],
          FORBID_ATTR: ['srcdoc'],
        });

        // Strip external href/xlink:href (keep internal #id references)
	        const doc = new DOMParser().parseFromString(clean, 'image/svg+xml');
	        const svg = doc.documentElement && doc.documentElement.tagName.toLowerCase() === 'svg' ? doc.documentElement : doc.querySelector('svg');
	        if (!svg) return { ok: false, error: t('text2', 'No <svg> root element found.') };

	        function scrubElement(el) {
	          for (const attr of Array.from(el.attributes || [])) {
	            if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
	          }
	          const href = el.getAttribute('href') || el.getAttribute('xlink:href');
	          if (href && !href.startsWith('#') && !href.startsWith('data:')) {
	            el.removeAttribute('href');
	            el.removeAttribute('xlink:href');
	          }
	        }

	        scrubElement(svg);
	        const walker = doc.createTreeWalker(svg, NodeFilter.SHOW_ELEMENT);
	        while (walker.nextNode()) scrubElement(walker.currentNode);

	        return { ok: true, doc, svg };
	      }

      function stripNodes(svg, names) {
        names.forEach(n => {
          svg.querySelectorAll(n).forEach(el => el.remove());
        });
      }

      function optimizeDoc(doc, svg, { minify = false }) {
        if (els.stripMetadata.checked) {
          stripNodes(svg, ['title', 'desc', 'metadata']);
        }
        if (els.stripDimensions.checked) {
          svg.removeAttribute('width');
          svg.removeAttribute('height');
        }

        // Ensure xmlns exists for portability
        if (!svg.getAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        // Serialize
        let out = new XMLSerializer().serializeToString(svg);
        // Remove XML/doctype remnants (some copy/pastes include them)
        out = out.replace(/<\?xml[\s\S]*?\?>/g, '').replace(/<!DOCTYPE[\s\S]*?>/gi, '').trim();
        // Remove comments
        out = out.replace(/<!--[\s\S]*?-->/g, '');

        if (minify) {
          out = out
            .replace(/>\s+</g, '><')
            .replace(/\s{2,}/g, ' ')
            .trim();
        } else {
          // light cleanup
          out = out.replace(/[ \t]+\n/g, '\n').trim();
        }
        return out;
      }

      function extractColors(svg) {
        const set = new Set();
        const attrs = ['fill', 'stroke', 'stop-color', 'color'];
        const styleRe = /(fill|stroke|stop-color|color)\s*:\s*([^;]+)/gi;

        const walker = svg.ownerDocument.createTreeWalker(svg, NodeFilter.SHOW_ELEMENT);
        while (walker.nextNode()) {
          const el = walker.currentNode;
          attrs.forEach(a => {
            const v = el.getAttribute(a);
            if (v) set.add(v.trim());
          });
          const st = el.getAttribute('style');
          if (st) {
            let m;
            while ((m = styleRe.exec(st)) !== null) set.add(String(m[2] || '').trim());
          }
        }

        const colors = Array.from(set)
          .map(c => c.trim())
          .filter(Boolean)
          .filter(c => !['none', 'currentColor', 'inherit'].includes(c))
          .filter(c => !/^url\(/i.test(c));

        return colors.sort((a, b) => a.localeCompare(b));
      }

      function replaceColors(svg, mapping) {
        const attrs = ['fill', 'stroke', 'stop-color', 'color'];
        const styleProps = ['fill', 'stroke', 'stop-color', 'color'];
        const escapeRe = (s) => String(s || '').replace(/[.*+?^{}$()|[\]\\]/g, '\\$&');

        const walker = svg.ownerDocument.createTreeWalker(svg, NodeFilter.SHOW_ELEMENT);
        while (walker.nextNode()) {
          const el = walker.currentNode;
          for (const a of attrs) {
            const v = el.getAttribute(a);
            if (!v) continue;
            const trimmed = v.trim();
            if (mapping[trimmed]) el.setAttribute(a, mapping[trimmed]);
          }

          const st = el.getAttribute('style');
          if (st && Object.keys(mapping).length) {
            let next = st;
            for (const prop of styleProps) {
              // Replace exact value occurrences in style declarations.
              Object.entries(mapping).forEach(([from, to]) => {
                const re = new RegExp('(' + prop + '\\\\s*:\\\\s*)' + escapeRe(from) + '(\\\\s*;?)', 'g');
                next = next.replace(re, '$1' + to + '$2');
              });
            }
            if (next !== st) el.setAttribute('style', next);
          }
        }
      }

      function updateStats() {
        els.inBytes.textContent = utf8Bytes(current.input).toLocaleString();
        els.outBytes.textContent = utf8Bytes(current.optimized || current.sanitized || '').toLocaleString();
        const vb = current.doc?.documentElement?.getAttribute('viewBox') || current.doc?.querySelector('svg')?.getAttribute('viewBox');
        els.viewBox.textContent = vb || '—';
      }

      function renderColorEditor(svg) {
        const colors = extractColors(svg);
        els.colorCount.textContent = String(colors.length);
        els.colors.innerHTML = '';

        if (!colors.length) {
          const p = document.createElement('p');
          p.className = 'text-surface-500 dark:text-surface-400';
          p.textContent = t('text3', 'No explicit colors found (may already use currentColor).');
          els.colors.appendChild(p);
          return {};
        }

        const mapping = {};

        colors.forEach(c => {
          const row = document.createElement('div');
          row.className = 'flex items-center gap-3';

          const sw = document.createElement('div');
          sw.className = 'w-6 h-6 rounded border border-surface-200 dark:border-surface-800';
          sw.style.background = c;

          const from = document.createElement('code');
          from.className = 'text-xs font-mono text-surface-700 dark:text-surface-200';
          from.textContent = c;

          const input = document.createElement('input');
          input.className = 'input font-mono flex-1';
          input.placeholder = t('text4', 'Replace with… (e.g., #000000)');
          input.value = '';

          input.addEventListener('input', () => {
            const v = input.value.trim();
            if (v) mapping[c] = v;
            else delete mapping[c];
            els.applyColors.disabled = Object.keys(mapping).length === 0;
          });

          row.appendChild(sw);
          row.appendChild(from);
          row.appendChild(input);
          els.colors.appendChild(row);
        });

        return mapping;
      }

      function renderPreview(svg) {
        els.preview.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'max-w-full';
        // Import node into HTML document for display.
        const node = document.importNode(svg, true);
        node.style.maxWidth = '100%';
        node.style.maxHeight = '280px';
        wrap.appendChild(node);
        els.preview.appendChild(wrap);
      }

      function syncOutputButtons() {
        const out = els.output.value.trim();
        const has = Boolean(out);
        els.copyBtn.disabled = !has;
        els.downloadBtn.disabled = !has;
      }

      function applyAndRender({ minify = false, makeCurrentColor = false } = {}) {
        current.input = els.input.value;
        const res = sanitizeSvg(current.input);
        if (!res.ok) {
          setPreviewMessage(res.error);
          els.output.value = '';
          els.colors.innerHTML = '<p class="text-surface-500 dark:text-surface-400">' + t('text5', 'Preview an SVG to extract colors.') + '</p>';
          els.colorCount.textContent = '0';
          syncOutputButtons();
          updateStats();
          return;
        }
        current.doc = res.doc;

        const svg = res.svg;
        if (makeCurrentColor) {
          // Convert all explicit fills/strokes to currentColor (except none/url())
          svg.querySelectorAll('*').forEach(el => {
            ['fill', 'stroke', 'stop-color', 'color'].forEach(a => {
              const v = el.getAttribute(a);
              if (!v) return;
              const t = v.trim();
              if (!t || t === 'none' || t === 'currentColor' || /^url\(/i.test(t)) return;
              el.setAttribute(a, 'currentColor');
            });
          });
        }

        const out = optimizeDoc(res.doc, svg, { minify });
        current.sanitized = new XMLSerializer().serializeToString(svg);
        current.optimized = out;
        current.lastMinify = Boolean(minify);

        els.output.value = out;
        syncOutputButtons();

        // Re-parse output for consistent preview and color extraction
        const doc2 = new DOMParser().parseFromString(out, 'image/svg+xml');
        const svg2 = doc2.querySelector('svg');
        if (svg2) {
          current.doc = doc2;
          renderPreview(svg2);
          current.editDoc = doc2;
          current.editSvg = svg2;
          current.mapping = renderColorEditor(svg2);
          els.applyColors.disabled = true;
        } else {
          setPreviewMessage(t('text6', 'Preview failed: invalid SVG output.'));
        }

        updateStats();
      }

      els.applyColors.addEventListener('click', () => {
        if (!current.editDoc || !current.editSvg || !current.mapping) return;
        if (!Object.keys(current.mapping).length) return;

        replaceColors(current.editSvg, current.mapping);
        const out = optimizeDoc(current.editDoc, current.editSvg, { minify: current.lastMinify });
        current.optimized = out;
        els.output.value = out;
        syncOutputButtons();

        const doc2 = new DOMParser().parseFromString(out, 'image/svg+xml');
        const svg2 = doc2.querySelector('svg');
        if (svg2) {
          current.doc = doc2;
          current.editDoc = doc2;
          current.editSvg = svg2;
          renderPreview(svg2);
          current.mapping = renderColorEditor(svg2);
          els.applyColors.disabled = true;
          updateStats();
        }
      });

      els.previewBtn.addEventListener('click', () => applyAndRender({ minify: false }));
      els.optimizeBtn.addEventListener('click', () => applyAndRender({ minify: false }));
      els.minifyBtn.addEventListener('click', () => applyAndRender({ minify: true }));
      els.currentColorBtn.addEventListener('click', () => applyAndRender({ minify: true, makeCurrentColor: true }));

      els.clearBtn.addEventListener('click', () => {
        els.input.value = '';
        els.output.value = '';
        setPreviewMessage(t('text7', 'No preview yet.'));
        els.colors.innerHTML = '<p class="text-surface-500 dark:text-surface-400">' + t('text5', 'Preview an SVG to extract colors.') + '</p>';
        els.colorCount.textContent = '0';
        current = { input: '', sanitized: '', optimized: '', doc: null, editDoc: null, editSvg: null, mapping: null, lastMinify: false };
        els.applyColors.disabled = true;
        updateStats();
        syncOutputButtons();
      });

      els.copyBtn.addEventListener('click', async () => {
        const text = els.output.value;
        if (!text.trim()) return;
        try {
          await navigator.clipboard.writeText(text);
          const old = els.copyBtn.textContent;
          els.copyBtn.textContent = t('text8', '✓ Copied');
          setTimeout(() => (els.copyBtn.textContent = old), 1200);
        } catch (e) {
          console.error('Copy failed:', e);
        }
      });

      els.downloadBtn.addEventListener('click', () => {
        const text = els.output.value;
        if (!text.trim()) return;
        const blob = new Blob([text], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'optimized.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

      // Update byte stats live
      els.input.addEventListener('input', () => {
        current.input = els.input.value;
        updateStats();
      });

      updateStats();
      syncOutputButtons();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: '/svg-optimizer',
    content,
    scripts
  });
}
