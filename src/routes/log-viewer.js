import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';

export async function handleLogViewerRoutes(request, url) {
  if (url.pathname !== '/log-viewer' && url.pathname !== '/log-viewer/') return null;
  if (request.method !== 'GET') return null;

  const currentTool = TOOLS.find(t => t.id === 'log-viewer');
    const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];


  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      ${createToolHeader(
        { emoji: '📃' },
        'Enterprise Log Viewer',
        'Analyze massive log files locally with virtual scrolling, filtering, and density visualization.',
        [{ text: 'Client-Side Only', tooltip: 'Runs entirely in your browser using Web APIs — your data never leaves your device.' },
         { text: '100k+ Lines', tooltip: 'Designed to handle and visualize very large log files without server streaming.' }],
        { toolId: 'log-viewer' }
      )}

      <!-- Controls -->
      <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <!-- File Input -->
          <div class="md:col-span-4">
            <label for="file-input" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1"><span data-i18n="tools.log-viewer.ui.label0">Log File</span></label>
            <input type="file" id="file-input" accept=".log,.txt,.json"
              class="block w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400 transition-colors cursor-pointer">
          </div>

          <!-- Search -->
          <div class="md:col-span-5">
            <label for="search-input" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1"><span data-i18n="tools.log-viewer.ui.label1">Filter</span></label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-4 w-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input type="text" id="search-input" placeholder="Search logs..." data-i18n-placeholder="tools.log-viewer.ui.placeholder2" data-tooltip="Filter logs by text — enable regex toggle for pattern matching" data-i18n-placeholder="tools.log-viewer.ui.placeholder2"
                class="block w-full pl-10 pr-12 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
              <div class="absolute inset-y-0 right-0 flex items-center">
                <label for="regex-toggle" class="flex items-center px-2 cursor-pointer" title="Use Regex" data-i18n-title="tools.log-viewer.ui.title3">
                  <input type="checkbox" id="regex-toggle" class="sr-only peer" data-tooltip="Enable regex pattern matching in search">
                  <span class="text-xs font-bold text-surface-400 peer-checked:text-primary-600 dark:peer-checked:text-primary-400 select-none">.*</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Level Filters -->
          <div class="md:col-span-3 flex gap-2">
             <button id="toggle-info" data-tooltip="Show/hide INFO level messages" class="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-300 border border-transparent hover:border-info-300 transition-all ring-2 ring-info-500 ring-offset-1 dark:ring-offset-surface-900" data-active="true">INFO</button>
             <button id="toggle-warn" class="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300 border border-transparent hover:border-warning-300 transition-all ring-2 ring-warning-500 ring-offset-1 dark:ring-offset-surface-900" data-active="true">WARN</button>
             <button id="toggle-error" class="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300 border border-transparent hover:border-error-300 transition-all ring-2 ring-error-500 ring-offset-1 dark:ring-offset-surface-900" data-active="true">ERR</button>
            <button id="toggle-other" class="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-transparent hover:border-gray-300 transition-all ring-2 ring-gray-500 ring-offset-1 dark:ring-offset-surface-900" data-active="true">OTHER</button>
          </div>
        </div>
        
         <!-- Stats -->
         <div class="mt-4 flex items-center justify-between text-xs text-surface-500 dark:text-surface-400 border-t border-surface-100 dark:border-surface-800 pt-3">
           <div class="flex items-center gap-2">
             <div id="status-text">Ready to load file</div>
             <span id="log-spinner" class="spinner-sm hidden" style="display:inline-block;vertical-align:middle;border-color:rgba(107,114,128,0.3);border-top-color:rgb(107,114,128);"></span>
           </div>
           <div id="match-count" class="font-mono hidden">0 matches</div>
         </div>
      </div>

      <!-- Visualization -->
      <div id="viz-container" class="hidden mb-4 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-4">
        <h3 class="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2" data-i18n="tools.log-viewer.ui.stat4">Log Density</h3>
        <canvas id="density-canvas" class="w-full h-16 cursor-crosshair rounded bg-surface-50 dark:bg-surface-950"></canvas>
      </div>

      <!-- Log Viewer -->
      <div class="bg-surface-900 rounded-xl shadow-lg overflow-hidden border border-surface-800 relative h-[600px] flex flex-col">
        <!-- Header -->
        <div class="flex items-center px-4 py-2 bg-surface-800 border-b border-surface-700 text-xs font-mono text-surface-400 select-none">
          <div class="w-16 text-right mr-4">#</div>
          <div class="w-24">TIMESTAMP</div>
          <div class="w-16">LEVEL</div>
          <div class="flex-1">MESSAGE</div>
        </div>

        <!-- Virtual Scroll Container -->
        <div id="log-container" class="flex-1 overflow-y-auto relative custom-scrollbar bg-[#1e1e1e] text-gray-300 font-mono text-sm leading-6">
          <div id="log-phantom" class="absolute top-0 left-0 w-full h-px"></div>
          <div id="log-content" class="absolute top-0 left-0 w-full">
            <!-- Rows injected here -->
            <div class="flex items-center justify-center h-full text-surface-500 pt-20">
              <div class="text-center">
                <p class="mb-2">No file loaded</p>
                <p class="text-xs opacity-70" data-i18n="tools.log-viewer.ui.desc5">Select a log file to begin analysis</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ${createRelatedToolsSection(relatedToolsData)}
    </main>

    <style>
      .custom-scrollbar::-webkit-scrollbar { width: 12px; height: 12px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: #1e1e1e; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #424242; border-radius: 6px; border: 3px solid #1e1e1e; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      
      .log-row { display: flex; padding: 0 1rem; height: 24px; white-space: pre; align-items: center; }
      .log-row:hover { background-color: rgba(255,255,255,0.05); }
      .log-num { width: 4rem; text-align: right; margin-right: 1rem; color: #666; user-select: none; flex-shrink: 0; }
      .log-time { width: 6rem; color: #569cd6; margin-right: 1rem; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; }
      .log-lvl { width: 4rem; font-weight: bold; margin-right: 1rem; flex-shrink: 0; }
      .log-msg { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: pre; }
      
       .lvl-info { color: var(--info-400, #4fc1ff); }
       .lvl-warn { color: var(--warning-300, #dcdcaa); }
       .lvl-error { color: var(--error-400, #f44747); }
      .lvl-debug { color: #b5cea8; }
      .lvl-other { color: #9ca3af; }
      
      .highlight { background-color: rgba(255, 255, 0, 0.2); color: #fff; }
    </style>

    <script>
      (function() {
        // State
        let allLogs = [];
        let filteredLogs = [];
        let isRegex = false;
        let activeLevels = { INFO: true, WARN: true, ERROR: true, DEBUG: true, OTHER: true };
        const ROW_HEIGHT = 24;
        const BUFFER_SIZE = 20;
        
        // DOM Elements
        const fileInput = document.getElementById('file-input');
        const searchInput = document.getElementById('search-input');
        const regexToggle = document.getElementById('regex-toggle');
        const container = document.getElementById('log-container');
        const phantom = document.getElementById('log-phantom');
        const content = document.getElementById('log-content');
        const statusText = document.getElementById('status-text');
        const matchCount = document.getElementById('match-count');
        const canvas = document.getElementById('density-canvas');
        const vizContainer = document.getElementById('viz-container');
        
        // Level Buttons
        const btnInfo = document.getElementById('toggle-info');
        const btnWarn = document.getElementById('toggle-warn');
        const btnError = document.getElementById('toggle-error');
        const btnOther = document.getElementById('toggle-other');

        // Workers/Parsing
        const parseLine = (line, index) => {
          // Simple heuristic parsing
          let level = 'OTHER';
          let timestamp = '';
          
          // Detect Level
          const upper = line.toUpperCase();
          if (upper.includes('ERROR') || upper.includes('FATAL') || upper.includes('CRITICAL')) level = 'ERROR';
          else if (upper.includes('WARN')) level = 'WARN';
          else if (upper.includes('INFO')) level = 'INFO';
          else if (upper.includes('DEBUG') || upper.includes('TRACE')) level = 'DEBUG';
          
          // Detect Timestamp (Basic ISO-like or common patterns)
          // Matches: 2023-01-01 12:00:00, 12:00:00.000, etc.
          const timeMatch = line.match(/\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?/);
          if (timeMatch) timestamp = timeMatch[0];
          
          return {
            id: index + 1,
            raw: line,
            level,
            timestamp
          };
        };

         // File Handling
         fileInput.addEventListener('change', (e) => {
           const file = e.target.files[0];
           if (!file) return;

           const logSpinner = document.getElementById('log-spinner');
           logSpinner.classList.remove('hidden');
           statusText.textContent = _t('tools.log-viewer.js.text0', 'Reading file...');
           const reader = new FileReader();
           
           reader.onload = (event) => {
             const text = event.target.result;
             statusText.textContent = _t('tools.log-viewer.js.text1', 'Parsing logs...');
             
             // Use setTimeout to allow UI to update
             setTimeout(() => {
               const lines = text.split(/\\r?\\n/);
               allLogs = lines.map((line, i) => parseLine(line, i));
               applyFilters();
               statusText.textContent = 'Loaded ' + allLogs.length.toLocaleString() + ' lines';
               logSpinner.classList.add('hidden');
               vizContainer.classList.remove('hidden');
             }, 10);
           };
           
           reader.readAsText(file);
         });

        // Filtering
        function applyFilters() {
          const query = searchInput.value;
          let regex = null;
          
          if (query) {
            try {
               regex = isRegex ? new RegExp(query, 'i') : new RegExp(query.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&'), 'i');
               searchInput.classList.remove('border-error-500', 'focus:border-error-500', 'focus:ring-error-500');
             } catch (e) {
               searchInput.classList.add('border-error-500', 'focus:border-error-500', 'focus:ring-error-500');
               return; // Invalid regex
            }
          }

          filteredLogs = allLogs.filter(log => {
            // Level Check
            if (log.level === 'INFO' && !activeLevels.INFO) return false;
            if (log.level === 'WARN' && !activeLevels.WARN) return false;
            if (log.level === 'ERROR' && !activeLevels.ERROR) return false;
            if (log.level === 'DEBUG' && !activeLevels.DEBUG) return false;
            if (log.level === 'OTHER' && !activeLevels.OTHER) return false;

            // Text Check
            if (!query) return true;
            return regex.test(log.raw);
          });

          matchCount.textContent = filteredLogs.length.toLocaleString() + ' matches';
          matchCount.classList.remove('hidden');
          
          updateVirtualScroll();
          drawDensity();
        }

        // Virtual Scroll
        function updateVirtualScroll() {
          const totalHeight = filteredLogs.length * ROW_HEIGHT;
          phantom.style.height = totalHeight + 'px';
          renderVisibleRows();
        }

        function renderVisibleRows() {
          const scrollTop = container.scrollTop;
          const viewportHeight = container.clientHeight;
          
          const startIndex = Math.floor(scrollTop / ROW_HEIGHT);
          const endIndex = Math.min(filteredLogs.length, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + BUFFER_SIZE);
          const renderStart = Math.max(0, startIndex - BUFFER_SIZE);
          
          const visibleLogs = filteredLogs.slice(renderStart, endIndex);
          const offsetY = renderStart * ROW_HEIGHT;
          
          content.style.transform = 'translateY(' + offsetY + 'px)';
          
          // Highlight search term
          const query = searchInput.value;
          let highlightRegex = null;
          if (query) {
             try {
                const escapedQuery = query.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&');
               highlightRegex = isRegex ? new RegExp('(' + query + ')', 'gi') : new RegExp('(' + escapedQuery + ')', 'gi');
             } catch(e) {}
          }

          const fragment = document.createDocumentFragment();
          const highlightFlags = highlightRegex ? highlightRegex.flags : '';
          const globalHighlightRegex = highlightRegex && !highlightFlags.includes('g')
            ? new RegExp(highlightRegex.source, highlightFlags + 'g')
            : highlightRegex;

          visibleLogs.forEach(log => {
            const row = document.createElement('div');
            row.className = 'log-row';

            const number = document.createElement('span');
            number.className = 'log-num';
            number.textContent = log.id;

            const time = document.createElement('span');
            time.className = 'log-time';
            time.textContent = log.timestamp || '-';

            const level = document.createElement('span');
            level.className = 'log-lvl lvl-' + log.level.toLowerCase();
            level.textContent = log.level;

            const message = document.createElement('span');
            message.className = 'log-msg';

            if (globalHighlightRegex) {
              const text = log.raw;
              let lastIndex = 0;
              globalHighlightRegex.lastIndex = 0;
              let match;

              while ((match = globalHighlightRegex.exec(text)) !== null) {
                const start = match.index;
                const end = start + match[0].length;

                if (start > lastIndex) {
                  message.appendChild(document.createTextNode(text.slice(lastIndex, start)));
                }

                const highlight = document.createElement('span');
                highlight.className = 'highlight';
                highlight.textContent = text.slice(start, end);
                message.appendChild(highlight);

                lastIndex = end;
                if (match[0].length === 0) {
                  globalHighlightRegex.lastIndex++;
                }
              }

              if (lastIndex < text.length) {
                message.appendChild(document.createTextNode(text.slice(lastIndex)));
              }
            } else {
              message.textContent = log.raw;
            }

            row.appendChild(number);
            row.appendChild(time);
            row.appendChild(level);
            row.appendChild(message);

            fragment.appendChild(row);
          });

          content.replaceChildren(fragment);
        }

        container.addEventListener('scroll', () => {
          window.requestAnimationFrame(renderVisibleRows);
        });

        // Visualization
        function drawDensity() {
          const ctx = canvas.getContext('2d');
          const width = canvas.width = canvas.offsetWidth;
          const height = canvas.height = canvas.offsetHeight;
          
          ctx.clearRect(0, 0, width, height);
          
          if (filteredLogs.length === 0 || width === 0 || height === 0) return;

          const binCount = width; // 1 pixel per bin
          const logsPerBin = filteredLogs.length / binCount;
          
          // Find max density for normalization
          let maxDensity = 0;
          const bins = new Array(binCount).fill(0).map(() => ({ count: 0, error: 0, warn: 0, info: 0 }));
          
          for (let i = 0; i < filteredLogs.length; i++) {
            const binIndex = Math.min(Math.floor(i / logsPerBin), binCount - 1);
            const log = filteredLogs[i];
            bins[binIndex].count++;
            if (log.level === 'ERROR') bins[binIndex].error++;
            else if (log.level === 'WARN') bins[binIndex].warn++;
            else if (log.level === 'INFO') bins[binIndex].info++;
          }
          
          maxDensity = Math.max(...bins.map(b => b.count));
          
          // Draw
          bins.forEach((bin, x) => {
            if (bin.count === 0) return;
            
            const barHeight = (bin.count / maxDensity) * height;
            const y = height - barHeight;
            
            ctx.fillStyle = '#9ca3af'; 
            
            if (bin.error > 0) ctx.fillStyle = '#f44747';
            else if (bin.warn > 0) ctx.fillStyle = '#dcdcaa';
            else if (bin.info > 0) ctx.fillStyle = '#4fc1ff';
            
            ctx.fillRect(x, y, 1, barHeight);
          });
        }
        
        // Canvas Click to Scroll
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            const scrollY = percentage * (filteredLogs.length * ROW_HEIGHT);
            container.scrollTop = scrollY;
        });

        // Event Listeners for Controls
        searchInput.addEventListener('input', () => {
            // Debounce slightly
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(applyFilters, 300);
        });
        
        regexToggle.addEventListener('change', (e) => {
            isRegex = e.target.checked;
            applyFilters();
        });

        const toggleLevel = (level, btn) => {
            activeLevels[level] = !activeLevels[level];
            if (activeLevels[level]) {
                btn.classList.remove('opacity-50', 'grayscale');
                btn.classList.add('ring-2');
            } else {
                btn.classList.add('opacity-50', 'grayscale');
                btn.classList.remove('ring-2');
            }
            applyFilters();
        };

        btnInfo.addEventListener('click', () => toggleLevel('INFO', btnInfo));
        btnWarn.addEventListener('click', () => toggleLevel('WARN', btnWarn));
        btnError.addEventListener('click', () => toggleLevel('ERROR', btnError));
        btnOther.addEventListener('click', () => toggleLevel('OTHER', btnOther));
        
        // Resize observer for canvas
        new ResizeObserver(() => {
            drawDensity();
            renderVisibleRows();
        }).observe(vizContainer);

      })();
    </script>
  `;

  return respondHTML(createPageTemplate({
    title: 'Log Viewer',
    description: 'Client-side enterprise log viewer with virtual scrolling and filtering.',
    path: '/log-viewer',
    content: content
  }));
}
