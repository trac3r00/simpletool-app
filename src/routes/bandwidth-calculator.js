/**
 * Bandwidth Calculator Tool
 * Calculate transfer times, required bandwidth, data capacity, and TCP overhead
 * All processing happens client-side
 */

import { createPageTemplate, createToolHeader, createCheatsheet, getCopyToClipboardScript } from '../utils/common-ui.js';
import { respondHTML } from '../utils/respond.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

/**
 * Render the Bandwidth Calculator page
 */
function renderBandwidthCalculatorPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('bandwidth-calculator', currentLang);
  const toolHeader = createToolHeader(
    { emoji: '📊' },
    translation?.name || 'Bandwidth Calculator',
    translation?.desc || 'Calculate transfer times, required bandwidth, data capacity, and TCP overhead.',
    [{ text: translation?.ui?.badge54 || 'Client-Side Only', tooltip: 'Runs entirely in your browser using Web APIs — your data never leaves your device.' }],
    { toolId: 'bandwidth-calculator' }
  );

  const currentTool = TOOLS.find(t => t.id === 'bandwidth-calculator');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="tool-card">
        ${toolHeader}

        <!-- Unit System Toggle -->
        <div class="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-surface-700 dark:text-surface-300" data-i18n="tools.bandwidth-calculator.ui.label0">Unit System:</span>
            <div class="inline-flex bg-surface-100 dark:bg-surface-800 rounded-lg p-1">
              <button id="unit-decimal" class="unit-toggle active px-3 py-1.5 text-sm font-medium rounded-md transition-all" data-unit="decimal">
                <span data-i18n="tools.bandwidth-calculator.ui.button0">Decimal (MB = 1000 KB)</span>
              </button>
              <button id="unit-binary" class="unit-toggle px-3 py-1.5 text-sm font-medium rounded-md transition-all text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200" data-unit="binary">
                <span data-i18n="tools.bandwidth-calculator.ui.button1">Binary (MiB = 1024 KiB)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="border-b border-surface-200 dark:border-surface-700 mb-8">
          <nav class="flex flex-wrap gap-2" aria-label="Bandwidth calculator modes" role="tablist">
            <button id="tab-trigger-transfer" class="tab-button active px-4 py-2 border-b-2 border-primary-600 font-medium text-sm text-primary-600 dark:text-primary-400 transition-colors" data-tab="transfer" role="tab" aria-controls="tab-transfer" aria-selected="true" tabindex="0">
              <span class="material-symbols-rounded text-base align-middle">schedule</span> <span data-i18n="tools.bandwidth-calculator.ui.label1">Transfer Time</span>
            </button>
            <button id="tab-trigger-bandwidth" class="tab-button px-4 py-2 border-b-2 border-transparent font-medium text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 transition-colors" data-tab="bandwidth" role="tab" aria-controls="tab-bandwidth" aria-selected="false" tabindex="-1">
              <span class="material-symbols-rounded text-base align-middle">network_check</span> <span data-i18n="tools.bandwidth-calculator.ui.label2">Required Bandwidth</span>
            </button>
            <button id="tab-trigger-capacity" class="tab-button px-4 py-2 border-b-2 border-transparent font-medium text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 transition-colors" data-tab="capacity" role="tab" aria-controls="tab-capacity" aria-selected="false" tabindex="-1">
              <span class="material-symbols-rounded text-base align-middle">storage</span> <span data-i18n="tools.bandwidth-calculator.ui.label3">Data Capacity</span>
            </button>
            <button id="tab-trigger-tcp" class="tab-button px-4 py-2 border-b-2 border-transparent font-medium text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 transition-colors" data-tab="tcp" role="tab" aria-controls="tab-tcp" aria-selected="false" tabindex="-1">
              <span class="material-symbols-rounded text-base align-middle">swap_horiz</span> <span data-i18n="tools.bandwidth-calculator.ui.label4">TCP Overhead</span>
            </button>
          </nav>
        </div>

        <!-- Transfer Time Tab -->
        <div id="tab-transfer" class="tab-content" role="tabpanel" aria-labelledby="tab-trigger-transfer">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="space-y-6">
              <h3 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.bandwidth-calculator.ui.heading0">Calculate Transfer Time</h3>
              
              <div>
                <label class="label" data-i18n="tools.bandwidth-calculator.ui.label5">File Size</label>
                <div class="flex gap-2">
                  <input type="number" id="transfer-size" min="0" step="any" placeholder="1" class="input flex-1" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder0">
                  <select id="transfer-size-unit" class="input w-28">
                    <option value="B">B</option>
                    <option value="KB">KB</option>
                    <option value="MB" selected>MB</option>
                    <option value="GB">GB</option>
                    <option value="TB">TB</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="label" data-i18n="tools.bandwidth-calculator.ui.label6">Bandwidth</label>
                <div class="flex gap-2">
                  <input type="number" id="transfer-bandwidth" min="0" step="any" placeholder="100" class="input flex-1" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder1">
                  <select id="transfer-bandwidth-unit" class="input w-28">
                    <option value="bps" data-i18n="tools.bandwidth-calculator.ui.option15">bps</option>
                    <option value="Kbps" data-i18n="tools.bandwidth-calculator.ui.option16">Kbps</option>
                    <option value="Mbps" selected data-i18n="tools.bandwidth-calculator.ui.option17">Mbps</option>
                    <option value="Gbps" data-i18n="tools.bandwidth-calculator.ui.option18">Gbps</option>
                  </select>
                </div>
              </div>

              <!-- Quick Presets -->
              <div>
                <label class="label" data-i18n="tools.bandwidth-calculator.ui.label7">Quick Presets</label>
                <div class="flex flex-wrap gap-2">
                  <button class="preset-btn btn btn-ghost btn-xs" data-preset="size" data-value="1073741824" data-unit="B" data-i18n="tools.bandwidth-calculator.ui.button2">1 GB</button>
                  <button class="preset-btn btn btn-ghost btn-xs" data-preset="size" data-value="5046586573" data-unit="B" data-i18n="tools.bandwidth-calculator.ui.button3">DVD (4.7GB)</button>
                  <button class="preset-btn btn btn-ghost btn-xs" data-preset="size" data-value="26843545600" data-unit="B" data-i18n="tools.bandwidth-calculator.ui.button4">Blu-ray (25GB)</button>
                  <button class="preset-btn btn btn-ghost btn-xs" data-preset="size" data-value="53687091200" data-unit="B" data-i18n="tools.bandwidth-calculator.ui.button5">Game (50GB)</button>
                </div>
                <div class="flex flex-wrap gap-2 mt-2">
                  <button class="preset-btn btn btn-ghost btn-xs" data-preset="bw" data-value="10000000" data-unit="bps" data-i18n="tools.bandwidth-calculator.ui.button6">10 Mbps</button>
                  <button class="preset-btn btn btn-ghost btn-xs" data-preset="bw" data-value="100000000" data-unit="bps" data-i18n="tools.bandwidth-calculator.ui.button7">100 Mbps</button>
                  <button class="preset-btn btn btn-ghost btn-xs" data-preset="bw" data-value="1000000000" data-unit="bps" data-i18n="tools.bandwidth-calculator.ui.button8">1 Gbps</button>
                  <button class="preset-btn btn btn-ghost btn-xs" data-preset="bw" data-value="10000000000" data-unit="bps" data-i18n="tools.bandwidth-calculator.ui.button9">10 Gbps</button>
                </div>
              </div>
            </div>

            <div class="bg-surface-50 dark:bg-surface-950 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <h4 class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4" data-i18n="tools.bandwidth-calculator.ui.heading1">Result</h4>
              <div class="space-y-4">
                <div>
                  <p class="text-xs text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.bandwidth-calculator.ui.desc0">Estimated Time</p>
                  <p id="transfer-result" class="text-3xl font-bold text-primary-600 dark:text-primary-400">--</p>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.bandwidth-calculator.ui.desc1">In Seconds</p>
                    <p id="transfer-seconds" class="font-mono text-surface-700 dark:text-surface-300">--</p>
                  </div>
                  <div>
                    <p class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.bandwidth-calculator.ui.desc2">In Minutes</p>
                    <p id="transfer-minutes" class="font-mono text-surface-700 dark:text-surface-300">--</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Required Bandwidth Tab -->
        <div id="tab-bandwidth" class="tab-content hidden" role="tabpanel" aria-labelledby="tab-trigger-bandwidth">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="space-y-6">
              <h3 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.bandwidth-calculator.ui.heading2">Calculate Required Bandwidth</h3>
              
              <div>
                <label class="label" data-i18n="tools.bandwidth-calculator.ui.label8">File Size</label>
                <div class="flex gap-2">
                  <input type="number" id="bw-size" min="0" step="any" placeholder="1" class="input flex-1" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder2">
                  <select id="bw-size-unit" class="input w-28">
                    <option value="B">B</option>
                    <option value="KB">KB</option>
                    <option value="MB" selected>MB</option>
                    <option value="GB">GB</option>
                    <option value="TB">TB</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="label" data-i18n="tools.bandwidth-calculator.ui.label9">Target Transfer Time</label>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <input type="number" id="bw-hours" min="0" placeholder="0" class="input w-full" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder3">
                    <span class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.bandwidth-calculator.ui.desc3">hours</span>
                  </div>
                  <div>
                    <input type="number" id="bw-minutes" min="0" max="59" placeholder="0" class="input w-full" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder4">
                    <span class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.bandwidth-calculator.ui.desc4">minutes</span>
                  </div>
                  <div>
                    <input type="number" id="bw-seconds" min="0" max="59" placeholder="0" class="input w-full" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder5">
                    <span class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.bandwidth-calculator.ui.desc5">seconds</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-surface-50 dark:bg-surface-950 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <h4 class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4" data-i18n="tools.bandwidth-calculator.ui.heading3">Required Bandwidth</h4>
              <div class="space-y-4">
                <div>
                  <p class="text-xs text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.bandwidth-calculator.ui.desc6">Minimum Bandwidth</p>
                  <p id="bw-result" class="text-3xl font-bold text-primary-600 dark:text-primary-400">--</p>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.bandwidth-calculator.ui.desc7">In Mbps</p>
                    <p id="bw-mbps" class="font-mono text-surface-700 dark:text-surface-300">--</p>
                  </div>
                  <div>
                    <p class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.bandwidth-calculator.ui.desc8">In Gbps</p>
                    <p id="bw-gbps" class="font-mono text-surface-700 dark:text-surface-300">--</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Capacity Tab -->
        <div id="tab-capacity" class="tab-content hidden" role="tabpanel" aria-labelledby="tab-trigger-capacity">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="space-y-6">
              <h3 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.bandwidth-calculator.ui.heading4">Calculate Data Capacity</h3>
              
              <div>
                <label class="label" data-i18n="tools.bandwidth-calculator.ui.label10">Bandwidth</label>
                <div class="flex gap-2">
                  <input type="number" id="cap-bandwidth" min="0" step="any" placeholder="100" class="input flex-1" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder6">
                  <select id="cap-bandwidth-unit" class="input w-28">
                    <option value="bps" data-i18n="tools.bandwidth-calculator.ui.option15">bps</option>
                    <option value="Kbps" data-i18n="tools.bandwidth-calculator.ui.option16">Kbps</option>
                    <option value="Mbps" selected data-i18n="tools.bandwidth-calculator.ui.option17">Mbps</option>
                    <option value="Gbps" data-i18n="tools.bandwidth-calculator.ui.option18">Gbps</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="label" data-i18n="tools.bandwidth-calculator.ui.label11">Time Duration</label>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <input type="number" id="cap-hours" min="0" placeholder="0" class="input w-full" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder7">
                    <span class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.bandwidth-calculator.ui.desc9">hours</span>
                  </div>
                  <div>
                    <input type="number" id="cap-minutes" min="0" max="59" placeholder="0" class="input w-full" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder8">
                    <span class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.bandwidth-calculator.ui.desc10">minutes</span>
                  </div>
                  <div>
                    <input type="number" id="cap-seconds" min="0" max="59" placeholder="0" class="input w-full" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder9">
                    <span class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.bandwidth-calculator.ui.desc11">seconds</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-surface-50 dark:bg-surface-950 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <h4 class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4" data-i18n="tools.bandwidth-calculator.ui.heading5">Maximum Transferable Data</h4>
              <div class="space-y-4">
                <div>
                  <p class="text-xs text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.bandwidth-calculator.ui.desc12">Total Data</p>
                  <p id="cap-result" class="text-3xl font-bold text-primary-600 dark:text-primary-400">--</p>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.bandwidth-calculator.ui.desc13">In Megabytes</p>
                    <p id="cap-mb" class="font-mono text-surface-700 dark:text-surface-300">--</p>
                  </div>
                  <div>
                    <p class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.bandwidth-calculator.ui.desc14">In Gigabytes</p>
                    <p id="cap-gb" class="font-mono text-surface-700 dark:text-surface-300">--</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TCP Overhead Tab -->
        <div id="tab-tcp" class="tab-content hidden" role="tabpanel" aria-labelledby="tab-trigger-tcp">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="space-y-6">
              <h3 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.bandwidth-calculator.ui.heading6">TCP Bandwidth-Delay Product</h3>
              
              <div>
                <label class="label" data-i18n="tools.bandwidth-calculator.ui.label12">Bandwidth</label>
                <div class="flex gap-2">
                  <input type="number" id="tcp-bandwidth" min="0" step="any" placeholder="1" class="input flex-1" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder10">
                  <select id="tcp-bandwidth-unit" class="input w-28">
                    <option value="bps" data-i18n="tools.bandwidth-calculator.ui.option15">bps</option>
                    <option value="Kbps" data-i18n="tools.bandwidth-calculator.ui.option16">Kbps</option>
                    <option value="Mbps" data-i18n="tools.bandwidth-calculator.ui.option17">Mbps</option>
                    <option value="Gbps" selected data-i18n="tools.bandwidth-calculator.ui.option18">Gbps</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="label" data-i18n="tools.bandwidth-calculator.ui.label13">Round Trip Time (RTT)</label>
                <div class="flex gap-2">
                  <input type="number" id="tcp-rtt" min="0" step="any" placeholder="50" class="input flex-1" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder11">
                  <select id="tcp-rtt-unit" class="input w-28">
                    <option value="ms" selected data-i18n="tools.bandwidth-calculator.ui.option19">ms</option>
                    <option value="s">s</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="label" data-i18n="tools.bandwidth-calculator.ui.label14">MSS (Maximum Segment Size)</label>
                <div class="flex gap-2">
                  <input type="number" id="tcp-mss" min="1" step="1" placeholder="1460" class="input flex-1" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder12">
                  <span class="input w-28 flex items-center justify-center bg-surface-100 dark:bg-surface-800">bytes</span>
                </div>
                <p class="text-xs text-surface-500 dark:text-surface-400 mt-1" data-i18n="tools.bandwidth-calculator.ui.desc15">Typical: 1460 bytes (Ethernet MTU 1500 - 40 byte headers)</p>
              </div>
            </div>

            <div class="bg-surface-50 dark:bg-surface-950 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <h4 class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4" data-i18n="tools.bandwidth-calculator.ui.heading7">TCP Analysis</h4>
              <div class="space-y-4">
                <div>
                  <p class="text-xs text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.bandwidth-calculator.ui.desc16">Bandwidth-Delay Product (BDP)</p>
                  <p id="tcp-bdp" class="text-2xl font-bold text-primary-600 dark:text-primary-400">--</p>
                  <p class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.bandwidth-calculator.ui.desc17">Optimal window size needed</p>
                </div>
                <div>
                  <p class="text-xs text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.bandwidth-calculator.ui.desc18">Required TCP Window Size</p>
                  <p id="tcp-window" class="text-lg font-semibold text-surface-700 dark:text-surface-300">--</p>
                </div>
                <div>
                  <p class="text-xs text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.bandwidth-calculator.ui.desc19">Theoretical Max Throughput</p>
                  <p id="tcp-throughput" class="text-lg font-semibold text-surface-700 dark:text-surface-300">--</p>
                </div>
                <div class="pt-4 border-t border-surface-200 dark:border-surface-700">
                  <p class="text-xs text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.bandwidth-calculator.ui.desc20">Window Scale Option Needed?</p>
                  <p id="tcp-scale-needed" class="text-sm font-medium">--</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        ${createCheatsheet('bandwidth-calculator', 'Bandwidth Reference Table', [
          {
            heading: 'Common Connection Types',
            content: `
              <table>
                <tr><th data-i18n="tools.bandwidth-calculator.ui.th20">Connection</th><th data-i18n="tools.bandwidth-calculator.ui.th21">Speed</th><th data-i18n="tools.bandwidth-calculator.ui.th22">Use Case</th></tr>
                <tr><td>Dial-up</td><td>56 Kbps</td><td>Legacy, text-only</td></tr>
                <tr><td>ADSL</td><td>10 Mbps</td><td>Basic home internet</td></tr>
                <tr><td>Cable/Fiber</td><td>100-1000 Mbps</td><td>Home/Office internet</td></tr>
                <tr><td>Gigabit Ethernet</td><td>1 Gbps</td><td>LAN, data center</td></tr>
                <tr><td>10 GigE</td><td>10 Gbps</td><td>Server interconnect</td></tr>
                <tr><td>40/100 GigE</td><td>40-100 Gbps</td><td>Core networking</td></tr>
              </table>`
          },
          {
            heading: 'Data Size Reference',
            content: `
              <table>
                <tr><th data-i18n="tools.bandwidth-calculator.ui.th23">Media</th><th data-i18n="tools.bandwidth-calculator.ui.th24">Approx. Size</th></tr>
                <tr><td>MP3 Song (4 min)</td><td>4 MB</td></tr>
                <tr><td>CD Audio (74 min)</td><td>650 MB</td></tr>
                <tr><td>DVD (single layer)</td><td>4.7 GB</td></tr>
                <tr><td>Blu-ray (single layer)</td><td>25 GB</td></tr>
                <tr><td>Triple-A Game</td><td>50-100 GB</td></tr>
                <tr><td>4K Movie</td><td>50-100 GB</td></tr>
              </table>`
          },
          {
            heading: 'Unit Conversions',
            content: `
              <table>
                <tr><th data-i18n="tools.bandwidth-calculator.ui.th25">Decimal (SI)</th><th data-i18n="tools.bandwidth-calculator.ui.th26">Value</th></tr>
                <tr><td>1 KB</td><td>1,000 bytes</td></tr>
                <tr><td>1 MB</td><td>1,000,000 bytes</td></tr>
                <tr><td>1 GB</td><td>1,000,000,000 bytes</td></tr>
                <tr><td>1 Gbps</td><td>1,000,000,000 bits/sec</td></tr>
              </table>
              <table>
                <tr><th data-i18n="tools.bandwidth-calculator.ui.th27">Binary (IEC)</th><th data-i18n="tools.bandwidth-calculator.ui.th26">Value</th></tr>
                <tr><td>1 KiB</td><td>1,024 bytes</td></tr>
                <tr><td>1 MiB</td><td>1,048,576 bytes</td></tr>
                <tr><td>1 GiB</td><td>1,073,741,824 bytes</td></tr>
              </table>`
          }
        ])}
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const scripts = `
    ${getCopyToClipboardScript()}
    <script>
      // Unit system management
      let useBinary = false;
      const DECIMAL_BASE = 1000;
      const BINARY_BASE = 1024;

      function getBase() {
        return useBinary ? BINARY_BASE : DECIMAL_BASE;
      }

      function formatBytes(bytes) {
        const base = getBase();
        const units = useBinary ? ['B', 'KiB', 'MiB', 'GiB', 'TiB'] : ['B', 'KB', 'MB', 'GB', 'TB'];
        let unitIndex = 0;
        let value = bytes;
        while (value >= base && unitIndex < units.length - 1) {
          value /= base;
          unitIndex++;
        }
        return value.toFixed(2) + ' ' + units[unitIndex];
      }

      function formatBitsPerSecond(bps) {
        const units = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps'];
        let unitIndex = 0;
        let value = bps;
        while (value >= 1000 && unitIndex < units.length - 1) {
          value /= 1000;
          unitIndex++;
        }
        return value.toFixed(2) + ' ' + units[unitIndex];
      }

      function formatTime(seconds) {
        if (seconds < 60) {
          return seconds.toFixed(1) + ' seconds';
        } else if (seconds < 3600) {
          const mins = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return mins + ' min' + (secs > 0 ? ' ' + secs + ' sec' : '');
        } else if (seconds < 86400) {
          const hrs = Math.floor(seconds / 3600);
          const mins = Math.floor((seconds % 3600) / 60);
          return hrs + ' hr' + (mins > 0 ? ' ' + mins + ' min' : '');
        } else {
          const days = Math.floor(seconds / 86400);
          const hrs = Math.floor((seconds % 86400) / 3600);
          return days + ' day' + (days > 1 ? 's' : '') + (hrs > 0 ? ' ' + hrs + ' hr' : '');
        }
      }

      // Unit conversion functions
      function toBytes(value, unit) {
        const base = getBase();
        const multipliers = { 'B': 1, 'KB': base, 'MB': base * base, 'GB': base * base * base, 'TB': base * base * base * base,
                              'KiB': 1024, 'MiB': 1024 * 1024, 'GiB': 1024 * 1024 * 1024, 'TiB': 1024 * 1024 * 1024 * 1024 };
        return value * (multipliers[unit] || 1);
      }

      function toBitsPerSecond(value, unit) {
        const multipliers = { 'bps': 1, 'Kbps': 1000, 'Mbps': 1000000, 'Gbps': 1000000000, 'Tbps': 1000000000000 };
        return value * (multipliers[unit] || 1);
      }

      function toSeconds(value, unit) {
        return unit === 's' ? value : value / 1000;
      }

      // Tab switching
      const tabButtons = document.querySelectorAll('.tab-button');
      const tabContents = document.querySelectorAll('.tab-content');

      tabButtons.forEach(button => {
        button.addEventListener('click', () => {
          const targetTab = button.dataset.tab;
          
          tabButtons.forEach(btn => {
            const isTarget = btn.dataset.tab === targetTab;
            btn.classList.toggle('active', isTarget);
            btn.classList.toggle('border-primary-600', isTarget);
            btn.classList.toggle('text-primary-600', isTarget);
            btn.classList.toggle('dark:text-primary-400', isTarget);
            btn.classList.toggle('border-transparent', !isTarget);
            btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
            btn.setAttribute('tabindex', isTarget ? '0' : '-1');
          });

          tabContents.forEach(content => {
            const isTarget = content.id === 'tab-' + targetTab;
            content.classList.toggle('hidden', !isTarget);
          });
        });
      });

      // Unit system toggle
      const unitToggles = document.querySelectorAll('.unit-toggle');
      unitToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
          useBinary = toggle.dataset.unit === 'binary';
          unitToggles.forEach(t => {
            const isActive = t.dataset.unit === (useBinary ? 'binary' : 'decimal');
            t.classList.toggle('active', isActive);
            t.classList.toggle('bg-white', isActive);
            t.classList.toggle('dark:bg-surface-700', isActive);
            t.classList.toggle('shadow-sm', isActive);
            t.classList.toggle('text-primary-600', isActive);
            t.classList.toggle('dark:text-primary-400', isActive);
          });
          // Recalculate all
          calculateTransferTime();
          calculateBandwidth();
          calculateCapacity();
          calculateTCP();
        });
      });

      // Initialize unit toggle styling
      unitToggles.forEach(t => {
        const isActive = t.classList.contains('active');
        if (isActive) {
          t.classList.add('bg-white', 'dark:bg-surface-700', 'shadow-sm');
        }
      });

      // Transfer Time Calculator
      function calculateTransferTime() {
        const size = parseFloat(document.getElementById('transfer-size').value) || 0;
        const sizeUnit = document.getElementById('transfer-size-unit').value;
        const bandwidth = parseFloat(document.getElementById('transfer-bandwidth').value) || 0;
        const bandwidthUnit = document.getElementById('transfer-bandwidth-unit').value;

        if (size <= 0 || bandwidth <= 0) {
          document.getElementById('transfer-result').textContent = '--';
          document.getElementById('transfer-seconds').textContent = '--';
          document.getElementById('transfer-minutes').textContent = '--';
          return;
        }

        const bytes = toBytes(size, sizeUnit);
        const bitsPerSec = toBitsPerSecond(bandwidth, bandwidthUnit);
        const seconds = (bytes * 8) / bitsPerSec;

        document.getElementById('transfer-result').textContent = formatTime(seconds);
        document.getElementById('transfer-seconds').textContent = seconds.toFixed(2) + ' s';
        document.getElementById('transfer-minutes').textContent = (seconds / 60).toFixed(2) + ' min';
      }

      // Required Bandwidth Calculator
      function calculateBandwidth() {
        const size = parseFloat(document.getElementById('bw-size').value) || 0;
        const sizeUnit = document.getElementById('bw-size-unit').value;
        const hours = parseFloat(document.getElementById('bw-hours').value) || 0;
        const minutes = parseFloat(document.getElementById('bw-minutes').value) || 0;
        const seconds = parseFloat(document.getElementById('bw-seconds').value) || 0;

        const totalSeconds = hours * 3600 + minutes * 60 + seconds;

        if (size <= 0 || totalSeconds <= 0) {
          document.getElementById('bw-result').textContent = '--';
          document.getElementById('bw-mbps').textContent = '--';
          document.getElementById('bw-gbps').textContent = '--';
          return;
        }

        const bytes = toBytes(size, sizeUnit);
        const bitsPerSec = (bytes * 8) / totalSeconds;

        document.getElementById('bw-result').textContent = formatBitsPerSecond(bitsPerSec);
        document.getElementById('bw-mbps').textContent = (bitsPerSec / 1000000).toFixed(2) + ' Mbps';
        document.getElementById('bw-gbps').textContent = (bitsPerSec / 1000000000).toFixed(2) + ' Gbps';
      }

      // Data Capacity Calculator
      function calculateCapacity() {
        const bandwidth = parseFloat(document.getElementById('cap-bandwidth').value) || 0;
        const bandwidthUnit = document.getElementById('cap-bandwidth-unit').value;
        const hours = parseFloat(document.getElementById('cap-hours').value) || 0;
        const minutes = parseFloat(document.getElementById('cap-minutes').value) || 0;
        const seconds = parseFloat(document.getElementById('cap-seconds').value) || 0;

        const totalSeconds = hours * 3600 + minutes * 60 + seconds;

        if (bandwidth <= 0 || totalSeconds <= 0) {
          document.getElementById('cap-result').textContent = '--';
          document.getElementById('cap-mb').textContent = '--';
          document.getElementById('cap-gb').textContent = '--';
          return;
        }

        const bitsPerSec = toBitsPerSecond(bandwidth, bandwidthUnit);
        const totalBits = bitsPerSec * totalSeconds;
        const bytes = totalBits / 8;

        document.getElementById('cap-result').textContent = formatBytes(bytes);
        document.getElementById('cap-mb').textContent = (bytes / (useBinary ? 1048576 : 1000000)).toFixed(2) + (useBinary ? ' MiB' : ' MB');
        document.getElementById('cap-gb').textContent = (bytes / (useBinary ? 1073741824 : 1000000000)).toFixed(2) + (useBinary ? ' GiB' : ' GB');
      }

      // TCP Overhead Calculator
      function calculateTCP() {
        const bandwidth = parseFloat(document.getElementById('tcp-bandwidth').value) || 0;
        const bandwidthUnit = document.getElementById('tcp-bandwidth-unit').value;
        const rtt = parseFloat(document.getElementById('tcp-rtt').value) || 0;
        const rttUnit = document.getElementById('tcp-rtt-unit').value;
        const mss = parseFloat(document.getElementById('tcp-mss').value) || 1460;

        if (bandwidth <= 0 || rtt <= 0) {
          document.getElementById('tcp-bdp').textContent = '--';
          document.getElementById('tcp-window').textContent = '--';
          document.getElementById('tcp-throughput').textContent = '--';
          document.getElementById('tcp-scale-needed').textContent = '--';
          return;
        }

        const bitsPerSec = toBitsPerSecond(bandwidth, bandwidthUnit);
        const rttSeconds = toSeconds(rtt, rttUnit);
        
        // BDP = bandwidth * RTT (in bits)
        const bdpBits = bitsPerSec * rttSeconds;
        const bdpBytes = bdpBits / 8;

        // Standard TCP window size is 65535 bytes (16-bit field)
        const standardWindow = 65535;
        const windowNeeded = Math.ceil(bdpBytes);

        // Theoretical max throughput with standard window
        const maxThroughput = (standardWindow * 8) / rttSeconds;

        document.getElementById('tcp-bdp').textContent = formatBytes(bdpBytes);
        document.getElementById('tcp-window').textContent = windowNeeded.toLocaleString() + ' bytes';
        
        if (maxThroughput >= bitsPerSec) {
          document.getElementById('tcp-throughput').textContent = formatBitsPerSecond(bitsPerSec) + ' (line rate)';
        } else {
          document.getElementById('tcp-throughput').textContent = formatBitsPerSecond(maxThroughput) + ' (limited by window)';
        }

        const scaleNeeded = windowNeeded > standardWindow;
        const scaleEl = document.getElementById('tcp-scale-needed');
        if (scaleNeeded) {
          const scaleFactor = Math.ceil(Math.log2(windowNeeded / standardWindow));
          scaleEl.textContent = _t('tools.bandwidth-calculator.js.text2', 'Yes (scale factor: ') + Math.min(scaleFactor, 14) + ')';
          scaleEl.className = 'text-sm font-medium text-warning-600 dark:text-warning-400';
        } else {
          scaleEl.textContent = _t('tools.bandwidth-calculator.js.text1', 'No');
          scaleEl.className = 'text-sm font-medium text-success-600 dark:text-success-400';
        }
      }

      // Attach event listeners
      document.getElementById('transfer-size').addEventListener('input', calculateTransferTime);
      document.getElementById('transfer-size-unit').addEventListener('change', calculateTransferTime);
      document.getElementById('transfer-bandwidth').addEventListener('input', calculateTransferTime);
      document.getElementById('transfer-bandwidth-unit').addEventListener('change', calculateTransferTime);

      document.getElementById('bw-size').addEventListener('input', calculateBandwidth);
      document.getElementById('bw-size-unit').addEventListener('change', calculateBandwidth);
      document.getElementById('bw-hours').addEventListener('input', calculateBandwidth);
      document.getElementById('bw-minutes').addEventListener('input', calculateBandwidth);
      document.getElementById('bw-seconds').addEventListener('input', calculateBandwidth);

      document.getElementById('cap-bandwidth').addEventListener('input', calculateCapacity);
      document.getElementById('cap-bandwidth-unit').addEventListener('change', calculateCapacity);
      document.getElementById('cap-hours').addEventListener('input', calculateCapacity);
      document.getElementById('cap-minutes').addEventListener('input', calculateCapacity);
      document.getElementById('cap-seconds').addEventListener('input', calculateCapacity);

      document.getElementById('tcp-bandwidth').addEventListener('input', calculateTCP);
      document.getElementById('tcp-bandwidth-unit').addEventListener('change', calculateTCP);
      document.getElementById('tcp-rtt').addEventListener('input', calculateTCP);
      document.getElementById('tcp-rtt-unit').addEventListener('change', calculateTCP);
      document.getElementById('tcp-mss').addEventListener('input', calculateTCP);

      // Preset buttons
      document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const preset = btn.dataset.preset;
          const value = parseFloat(btn.dataset.value);
          const unit = btn.dataset.unit;
          
          if (preset === 'size') {
            document.getElementById('transfer-size').value = value;
            document.getElementById('transfer-size-unit').value = unit === 'B' ? 'B' : 
              (useBinary ? unit.replace('B', 'iB') : unit);
          } else if (preset === 'bw') {
            document.getElementById('transfer-bandwidth').value = value;
            document.getElementById('transfer-bandwidth-unit').value = unit;
          }
          calculateTransferTime();
        });
      });

      // Keyboard navigation for tabs
      document.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
        const tabs = Array.from(tabButtons);
        const currentIndex = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
        let newIndex = currentIndex;

        if (e.key === 'ArrowRight') {
          newIndex = (currentIndex + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft') {
          newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
          newIndex = 0;
        } else if (e.key === 'End') {
          newIndex = tabs.length - 1;
        }

        if (newIndex !== currentIndex) {
          e.preventDefault();
          tabs[newIndex].click();
          tabs[newIndex].focus();
        }
      });

      // Initial calculation
      calculateTransferTime();
      calculateBandwidth();
      calculateCapacity();
      calculateTCP();
    </script>
  `;

  return createPageTemplate({
    title: translation?.name || 'Bandwidth Calculator',
    description: translation?.desc || 'Calculate transfer times, required bandwidth, data capacity, and TCP overhead.',
    path: '/bandwidth-calculator',
    content,
    scripts,
    lang: currentLang
  });
}

/**
 * Route handler for Bandwidth Calculator
 */
export async function handleBandwidthCalculatorRoutes(request, url) {
  try {
    if (url.pathname === '/bandwidth-calculator' || url.pathname === '/bandwidth-calculator/') {
      if (request.method === 'GET') {
        return respondHTML(renderBandwidthCalculatorPage(resolveRequestLanguage(request, url)));
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}
