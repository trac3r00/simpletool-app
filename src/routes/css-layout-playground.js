/**
 * CSS Layout Playground Tool
 * Visual editor for CSS Flexbox and Grid layouts with live preview
 * All processing happens client-side
 */

import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { respondHTML } from '../utils/respond.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

/**
 * Render the CSS Layout Playground page
 */
function renderCSSLayoutPlaygroundPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('css-layout-playground', currentLang);
  const toolHeader = createToolHeader(
    { emoji: '🔲' },
    translation?.name || 'CSS Layout Playground',
    translation?.desc || 'Visual editor for CSS Flexbox and Grid layouts with live preview. Perfect for learning and prototyping layout systems.',
    [{ text: translation?.ui?.badge32 || 'Client-Side Only', tooltip: 'Runs entirely in your browser using Web APIs — your data never leaves your device.' }],
    { toolId: 'css-layout-playground' }
  );

  const currentTool = TOOLS.find(t => t.id === 'css-layout-playground');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];
  const pageContent = `

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left Column: Controls -->
        <div class="space-y-6">
          <!-- Layout Mode Tabs -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm p-6">
            <div class="flex border-b border-surface-200 dark:border-surface-700 mb-4">
              <button id="tab-flexbox" class="layout-tab px-6 py-3 font-semibold text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 transition-colors" data-mode="flexbox">
                Flexbox
              </button>
              <button id="tab-grid" class="layout-tab px-6 py-3 font-semibold text-surface-500 dark:text-surface-400 border-b-2 border-transparent hover:text-surface-700 dark:hover:text-surface-200 transition-colors" data-mode="grid">
                Grid
              </button>
            </div>

            <!-- Flexbox Controls -->
            <div id="flexbox-controls" class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">flex-direction</label>
                <div class="flex flex-wrap gap-2">
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-prop="flex-direction" data-value="row">row</button>
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-primary-700 text-white transition" data-prop="flex-direction" data-value="row-reverse">row-reverse</button>
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-prop="flex-direction" data-value="column">column</button>
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-prop="flex-direction" data-value="column-reverse">column-reverse</button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">justify-content</label>
                <div class="flex flex-wrap gap-2">
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-primary-700 text-white transition" data-prop="justify-content" data-value="flex-start">flex-start</button>
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-prop="justify-content" data-value="center">center</button>
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-prop="justify-content" data-value="flex-end">flex-end</button>
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-prop="justify-content" data-value="space-between">space-between</button>
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-prop="justify-content" data-value="space-around">space-around</button>
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-prop="justify-content" data-value="space-evenly">space-evenly</button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">align-items</label>
                <div class="flex flex-wrap gap-2">
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-primary-700 text-white transition" data-prop="align-items" data-value="stretch">stretch</button>
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-prop="align-items" data-value="flex-start">flex-start</button>
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-prop="align-items" data-value="center">center</button>
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-prop="align-items" data-value="flex-end">flex-end</button>
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-prop="align-items" data-value="baseline">baseline</button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">flex-wrap</label>
                <div class="flex flex-wrap gap-2">
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-primary-700 text-white transition" data-prop="flex-wrap" data-value="nowrap">nowrap</button>
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-prop="flex-wrap" data-value="wrap">wrap</button>
                  <button class="flex-prop-btn px-3 py-2 text-sm rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition" data-prop="flex-wrap" data-value="wrap-reverse">wrap-reverse</button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                  gap: <span id="gap-value">8</span>px
                </label>
                <input type="range" id="gap-slider" min="0" max="64" value="8"
                  class="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer dark:bg-surface-700" />
              </div>
            </div>

            <!-- Grid Controls -->
            <div id="grid-controls" class="space-y-4 hidden">
              <div>
                <label for="grid-cols" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">grid-template-columns</label>
                <input type="text" id="grid-cols" value="1fr 1fr 1fr"
                  class="w-full px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-100 font-mono text-sm" />
              </div>

              <div>
                <label for="grid-rows" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">grid-template-rows</label>
                <input type="text" id="grid-rows" value="auto"
                  class="w-full px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-100 font-mono text-sm" />
              </div>

              <div>
                <label class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                  gap: <span id="grid-gap-value">8</span>px
                </label>
                <input type="range" id="grid-gap-slider" min="0" max="64" value="8"
                  class="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer dark:bg-surface-700" />
              </div>

              <div>
                <label for="grid-auto-flow" class="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">grid-auto-flow</label>
                <select id="grid-auto-flow" class="w-full px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-100">
                  <option value="row">row (default)</option>
                  <option value="column">column</option>
                  <option value="dense">dense</option>
                  <option value="row dense">row dense</option>
                  <option value="column dense">column dense</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Child Items -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.css-layout-playground.ui.heading_children">🧒 Child Items</h2>
              <div class="flex gap-2">
                <button id="add-child" class="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition text-sm font-semibold">
                  <span data-i18n="tools.css-layout-playground.ui.button_add">+ Add Child</span>
                </button>
                <button id="remove-child" class="px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition text-sm font-semibold">
                  <span data-i18n="tools.css-layout-playground.ui.button_remove">− Remove</span>
                </button>
              </div>
            </div>

            <div id="children-list" class="space-y-3 max-h-96 overflow-y-auto">
              <!-- Child items rendered here -->
            </div>
          </div>
        </div>

        <!-- Right Column: Preview & Code -->
        <div class="space-y-6">
          <!-- Live Preview -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm p-6">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.css-layout-playground.ui.heading_preview">👁️ Live Preview</h2>
            <div id="layout-preview" class="layout-preview border-2 border-surface-200 dark:border-surface-700 rounded-xl p-4 min-h-64 flex flex-wrap">
              <!-- Child boxes rendered here -->
            </div>
            <div class="mt-3 flex gap-2">
              <button id="add-preview-child" class="px-3 py-1 text-xs bg-surface-100 dark:bg-surface-800 rounded hover:bg-primary-700 hover:text-white transition">+ Child</button>
              <button id="remove-preview-child" class="px-3 py-1 text-xs bg-surface-100 dark:bg-surface-800 rounded hover:bg-error-600 hover:text-white transition">− Child</button>
            </div>
          </div>

          <!-- CSS Code -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.css-layout-playground.ui.heading_css">📋 CSS Code</h2>
              <button id="copy-css-btn" class="px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition text-sm font-semibold">
                <span data-i18n="tools.css-layout-playground.ui.button_copy">📋 Copy CSS</span>
              </button>
            </div>

            <pre id="css-output" class="bg-surface-50 dark:bg-surface-950 p-4 rounded-lg overflow-x-auto text-sm font-mono text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-800"></pre>
          </div>

          <!-- Info Cards -->
          <div class="grid grid-cols-1 gap-4">
            <div class="bg-info-50 dark:bg-info-900/20 rounded-xl p-4 border-2 border-info-200 dark:border-info-700">
              <h3 class="font-bold text-info-900 dark:text-info-200 mb-2" data-i18n="tools.css-layout-playground.ui.heading_tips">💡 Quick Tips</h3>
              <ul class="text-sm text-info-800 dark:text-info-300 space-y-1 list-disc list-inside">
                <li>Use Flexbox for one-dimensional layouts (rows OR columns)</li>
                <li>Use Grid for two-dimensional layouts (rows AND columns)</li>
                <li>Try "space-between" for equal spacing between items</li>
                <li>flex-wrap lets items flow to next line</li>
              </ul>
            </div>

            <div class="bg-success-50 dark:bg-success-900/20 rounded-xl p-4 border-2 border-success-200 dark:border-success-700">
              <h3 class="font-bold text-success-900 dark:text-success-200 mb-2" data-i18n="tools.css-layout-playground.ui.heading_usecases">🎯 Use Cases</h3>
              <ul class="text-sm text-success-800 dark:text-success-300 space-y-1 list-disc list-inside">
                <li>Navigation bars and sidebars</li>
                <li>Card grids and dashboard layouts</li>
                <li>Form layouts and alignment</li>
                <li>Holy grail and responsive layouts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </div>
    </main>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'What is Flexbox?',
          content: '<p>CSS Flexible Box Layout (Flexbox) is a one-dimensional layout method for arranging items in rows or columns. Items flex to fill additional space or shrink to fit. Flexbox is ideal for navigation menus, card layouts, and centering content within containers.</p>'
        },
        {
          title: 'What is CSS Grid?',
          content: '<p>CSS Grid Layout (Grid) is a two-dimensional layout system that handles both columns and rows simultaneously. Unlike Flexbox which works along a single axis, Grid allows you to define explicit tracks and align items within both dimensions. It is powerful for page layouts and complex visual compositions.</p>'
        },
        {
          title: 'flex-grow, flex-shrink, and flex-basis',
          content: '<p>The <code>flex</code> shorthand controls how a flex item grows or shrinks. <code>flex-grow</code> defines ability to grow (0 = fixed size), <code>flex-shrink</code> defines ability to shrink (0 = fixed size), and <code>flex-basis</code> defines the initial size before free space is distributed. Common shorthand values: <code>flex: 1</code> (grow equally), <code>flex: 0 0 auto</code> (use intrinsic size).</p>'
        },
        {
          title: 'fr units and auto-fit',
          content: '<p>The <code>fr</code> unit represents a fraction of available space. <code>1fr 1fr 1fr</code> creates three equal columns. Combined with <code>minmax()</code> and <code>auto-fit</code>/<code>auto-fill</code>, you can create responsive grids without media queries: <code>grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))</code>.</p>'
        }
      ], 'css-layout-playground', currentLang)}
    </div>
    ${createRelatedToolsSection(relatedToolsData)}

    <script>
      // State
      let layoutMode = 'flexbox';
      let children = [
        { name: 'Item 1', flexGrow: 0, flexShrink: 1, flexBasis: 'auto' },
        { name: 'Item 2', flexGrow: 0, flexShrink: 1, flexBasis: 'auto' },
        { name: 'Item 3', flexGrow: 0, flexShrink: 1, flexBasis: 'auto' }
      ];

      // Flexbox state
      let flexDirection = 'row';
      let justifyContent = 'flex-start';
      let alignItems = 'stretch';
      let flexWrap = 'nowrap';
      let gap = 8;

      // Grid state
      let gridTemplateColumns = '1fr 1fr 1fr';
      let gridTemplateRows = 'auto';
      let gridGap = 8;
      let gridAutoFlow = 'row';

      // Circled numbers
      var CIRCLED = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫'];

      // DOM Elements
      var previewEl = document.getElementById('layout-preview');
      var cssOutputEl = document.getElementById('css-output');
      var childrenListEl = document.getElementById('children-list');
      var flexboxControls = document.getElementById('flexbox-controls');
      var gridControls = document.getElementById('grid-controls');

      // Tab Switching
      document.getElementById('tab-flexbox').addEventListener('click', function() {
        layoutMode = 'flexbox';
        document.getElementById('tab-flexbox').className = 'layout-tab px-6 py-3 font-semibold text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 transition-colors';
        document.getElementById('tab-grid').className = 'layout-tab px-6 py-3 font-semibold text-surface-500 dark:text-surface-400 border-b-2 border-transparent hover:text-surface-700 dark:hover:text-surface-200 transition-colors';
        flexboxControls.classList.remove('hidden');
        gridControls.classList.add('hidden');
        updatePreview();
      });

      document.getElementById('tab-grid').addEventListener('click', function() {
        layoutMode = 'grid';
        document.getElementById('tab-grid').className = 'layout-tab px-6 py-3 font-semibold text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 transition-colors';
        document.getElementById('tab-flexbox').className = 'layout-tab px-6 py-3 font-semibold text-surface-500 dark:text-surface-400 border-b-2 border-transparent hover:text-surface-700 dark:hover:text-surface-200 transition-colors';
        gridControls.classList.remove('hidden');
        flexboxControls.classList.add('hidden');
        updatePreview();
      });

      // Flexbox property buttons
      document.querySelectorAll('.flex-prop-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var prop = btn.dataset.prop;
          var value = btn.dataset.value;

          if (prop === 'flex-direction') flexDirection = value;
          if (prop === 'justify-content') justifyContent = value;
          if (prop === 'align-items') alignItems = value;
          if (prop === 'flex-wrap') flexWrap = value;

          var siblings = btn.parentElement.querySelectorAll('.flex-prop-btn');
          siblings.forEach(function(s) {
            s.className = 'flex-prop-btn px-3 py-2 text-sm rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-primary-700 hover:text-white transition';
          });
          btn.className = 'flex-prop-btn px-3 py-2 text-sm rounded-lg bg-primary-700 text-white transition';

          updatePreview();
        });
      });

      // Gap slider
      document.getElementById('gap-slider').addEventListener('input', function(e) {
        gap = parseInt(e.target.value);
        document.getElementById('gap-value').textContent = gap;
        updatePreview();
      });

      // Grid controls
      document.getElementById('grid-cols').addEventListener('input', function(e) {
        gridTemplateColumns = e.target.value;
        updatePreview();
      });

      document.getElementById('grid-rows').addEventListener('input', function(e) {
        gridTemplateRows = e.target.value;
        updatePreview();
      });

      document.getElementById('grid-gap-slider').addEventListener('input', function(e) {
        gridGap = parseInt(e.target.value);
        document.getElementById('grid-gap-value').textContent = gridGap;
        updatePreview();
      });

      document.getElementById('grid-auto-flow').addEventListener('change', function(e) {
        gridAutoFlow = e.target.value;
        updatePreview();
      });

      // Add/Remove children
      document.getElementById('add-child').addEventListener('click', function() { addChild(); });
      document.getElementById('remove-child').addEventListener('click', function() { removeChild(); });
      document.getElementById('add-preview-child').addEventListener('click', function() { addChild(); });
      document.getElementById('remove-preview-child').addEventListener('click', function() { removeChild(); });

      function addChild() {
        if (children.length >= 12) return;
        children.push({ name: 'Item ' + (children.length + 1), flexGrow: 0, flexShrink: 1, flexBasis: 'auto' });
        renderChildrenList();
        updatePreview();
      }

      function removeChild() {
        if (children.length <= 1) return;
        children.pop();
        renderChildrenList();
        updatePreview();
      }

      function renderChildrenList() {
        var html = '';
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          var circledNum = CIRCLED[i];
          html += '<div class="child-item flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">';
          html += '<span class="text-lg font-bold text-primary-600 dark:text-primary-400 w-6 text-center">' + circledNum + '</span>';
          html += '<input type="text" value="' + escAttr(child.name) + '" class="flex-1 px-3 py-1 border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-100 text-sm" data-index="' + i + '" data-field="name" />';
          if (layoutMode === 'flexbox') {
            html += '<input type="number" min="0" max="5" value="' + child.flexGrow + '" class="w-16 px-2 py-1 border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-100 text-sm text-center" data-index="' + i + '" data-field="flexGrow" title="flex-grow" />';
            html += '<input type="number" min="0" max="5" value="' + child.flexShrink + '" class="w-16 px-2 py-1 border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-100 text-sm text-center" data-index="' + i + '" data-field="flexShrink" title="flex-shrink" />';
            html += '<input type="text" value="' + escAttr(child.flexBasis) + '" class="w-20 px-2 py-1 border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-100 text-sm" data-index="' + i + '" data-field="flexBasis" placeholder="auto" title="flex-basis" />';
          }
          html += '</div>';
        }
        childrenListEl.innerHTML = html;

        // Attach event listeners
        var inputs = childrenListEl.querySelectorAll('input[data-field]');
        inputs.forEach(function(input) {
          input.addEventListener('input', function(e) {
            var idx = parseInt(e.target.dataset.index);
            var field = e.target.dataset.field;
            if (field === 'name') children[idx].name = e.target.value;
            if (field === 'flexGrow') children[idx].flexGrow = parseInt(e.target.value) || 0;
            if (field === 'flexShrink') children[idx].flexShrink = parseInt(e.target.value) || 0;
            if (field === 'flexBasis') children[idx].flexBasis = e.target.value;
            updatePreview();
          });
        });
      }

      function escAttr(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      function updatePreview() {
        if (layoutMode === 'flexbox') {
          previewEl.style.display = 'flex';
          previewEl.style.flexDirection = flexDirection;
          previewEl.style.justifyContent = justifyContent;
          previewEl.style.alignItems = alignItems;
          previewEl.style.flexWrap = flexWrap;
          previewEl.style.gap = gap + 'px';
          previewEl.style.gridTemplateColumns = '';
          previewEl.style.gridTemplateRows = '';
          previewEl.style.gridAutoFlow = '';
        } else {
          previewEl.style.display = 'grid';
          previewEl.style.flexDirection = '';
          previewEl.style.justifyContent = '';
          previewEl.style.alignItems = '';
          previewEl.style.flexWrap = '';
          previewEl.style.gap = gridGap + 'px';
          previewEl.style.gridTemplateColumns = gridTemplateColumns;
          previewEl.style.gridTemplateRows = gridTemplateRows;
          previewEl.style.gridAutoFlow = gridAutoFlow;
        }

        // Render child boxes
        var altColors = [
          'bg-primary-100 dark:bg-primary-900/40',
          'bg-success-100 dark:bg-success-900/40',
          'bg-warning-100 dark:bg-warning-900/40',
          'bg-info-100 dark:bg-info-900/40',
          'bg-error-100 dark:bg-error-900/40'
        ];

        var boxesHtml = '';
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          var colorClass = altColors[i % altColors.length];
          var circledNum = CIRCLED[i];
          var flexStyle = layoutMode === 'flexbox'
            ? 'flex: ' + child.flexGrow + ' ' + child.flexShrink + ' ' + child.flexBasis + ';'
            : '';
          boxesHtml += '<div class="child-box ' + colorClass + ' border-2 border-surface-300 dark:border-surface-600 rounded-lg p-4 flex items-center justify-center min-h-16 min-w-16" style="' + flexStyle + '">';
          boxesHtml += '<span class="text-2xl font-bold text-surface-700 dark:text-surface-300 mr-2">' + circledNum + '</span>';
          boxesHtml += '<span class="text-sm font-medium text-surface-800 dark:text-surface-200">' + escHtml(child.name) + '</span>';
          boxesHtml += '</div>';
        }
        previewEl.innerHTML = boxesHtml;

        // Update CSS output
        updateCSSOutput();
      }

      function escHtml(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      function updateCSSOutput() {
        var css = '';
        if (layoutMode === 'flexbox') {
          css = '.container {\\n';
          css += '  display: flex;\\n';
          css += '  flex-direction: ' + flexDirection + ';\\n';
          css += '  justify-content: ' + justifyContent + ';\\n';
          css += '  align-items: ' + alignItems + ';\\n';
          css += '  flex-wrap: ' + flexWrap + ';\\n';
          css += '  gap: ' + gap + 'px;\\n';
          css += '}\\n';
          for (var i = 0; i < children.length; i++) {
            var child = children[i];
            css += '\\n.child-' + (i + 1) + ' {\\n';
            css += '  flex: ' + child.flexGrow + ' ' + child.flexShrink + ' ' + child.flexBasis + ';\\n';
            css += '}\\n';
          }
        } else {
          css = '.container {\\n';
          css += '  display: grid;\\n';
          css += '  grid-template-columns: ' + gridTemplateColumns + ';\\n';
          css += '  grid-template-rows: ' + gridTemplateRows + ';\\n';
          css += '  gap: ' + gridGap + 'px;\\n';
          css += '  grid-auto-flow: ' + gridAutoFlow + ';\\n';
          css += '}\\n';
          for (var j = 0; j < children.length; j++) {
            css += '\\n/* Child ' + (j + 1) + ': ' + escHtml(children[j].name) + ' */\\n';
          }
        }
        cssOutputEl.textContent = css;
      }

      // Copy CSS
      document.getElementById('copy-css-btn').addEventListener('click', async function() {
        var css = cssOutputEl.textContent;
        try {
          await navigator.clipboard.writeText(css);
          var btn = document.getElementById('copy-css-btn');
          btn.innerHTML = '<span>✓ Copied!</span>';
          btn.classList.remove('bg-primary-700', 'hover:bg-primary-800');
          btn.classList.add('bg-success-600', 'hover:bg-success-700');
          if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
          setTimeout(function() {
            btn.innerHTML = '<span data-i18n="tools.css-layout-playground.ui.button_copy">📋 Copy CSS</span>';
            btn.classList.remove('bg-success-600', 'hover:bg-success-700');
            btn.classList.add('bg-primary-700', 'hover:bg-primary-800');
          }, 2000);
        } catch (err) {
          var btn = document.getElementById('copy-css-btn');
          btn.innerHTML = '<span>Copy failed</span>';
          btn.classList.remove('bg-primary-700', 'hover:bg-primary-800');
          btn.classList.add('bg-error-600', 'hover:bg-error-700');
          setTimeout(function() {
            btn.innerHTML = '<span data-i18n="tools.css-layout-playground.ui.button_copy">📋 Copy CSS</span>';
            btn.classList.remove('bg-error-600', 'hover:bg-error-700');
            btn.classList.add('bg-primary-700', 'hover:bg-primary-800');
          }, 2000);
        }
      });

      // Initialize
      document.addEventListener('DOMContentLoaded', function() {
        renderChildrenList();
        updatePreview();
      });
    </script>
  `;

  const customStyles = `
    <style>
      .child-item {
        transition: all 0.2s;
      }

      .child-item:hover {
        border-color: var(--primary-500, #3b82f6);
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
      }

      .layout-preview {
        transition: all 0.3s;
        min-height: 256px;
      }

      .child-box {
        transition: all 0.2s;
      }

      .child-box:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .dark .child-box:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
    </style>
  `;

  return createPageTemplate({
    title: translation?.name || 'CSS Layout Playground',
    description: translation?.desc || 'Visual editor for CSS Flexbox and Grid layouts with live preview. Perfect for learning and prototyping layout systems.',
    path: '/css-layout-playground',
    content: customStyles + pageContent,
    lang: currentLang
  });
}

/**
 * Route handler for CSS Layout Playground
 */
export async function handleCSSLayoutPlaygroundRoutes(request, url) {
  const pathname = url.pathname;

  try {
    if (pathname === '/css-layout-playground' || pathname === '/css-layout-playground/' || pathname === '/css-layout' || pathname === '/css-layout/') {
      return respondHTML(renderCSSLayoutPlaygroundPage(resolveRequestLanguage(request, url)));
    }
    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('CSS Layout Playground Error:', error);
    return new Response('Internal Server Error: ' + error.message, { status: 500 });
  }
}