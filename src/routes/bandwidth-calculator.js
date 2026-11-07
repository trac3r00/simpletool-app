/**
 * Bandwidth Calculator Tool
 * Calculate transfer times, required bandwidth, data capacity, and TCP overhead
 * All processing happens client-side
 */

import {
  createPageTemplate,
  createToolHeader,
  createCheatsheet,
} from "../utils/common-ui.js";
import { respondHTML } from "../utils/respond.js";
import { TOOLS } from "../utils/tool-registry.js";
import { createRelatedToolsSection } from "../utils/content-ui.js";
import {
  calculateTransferTime as calculateTransferTimePure,
  toBitsPerSecond,
  toBytes,
} from "../utils/bandwidth-logic.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";

/**
 * Render the Bandwidth Calculator page
 */
function renderBandwidthCalculatorPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("bandwidth-calculator", currentLang);
  const toolHeader = createToolHeader(
    { emoji: "📊" },
    translation?.name || "Bandwidth Calculator",
    translation?.desc ||
      "Calculate transfer times, required bandwidth, data capacity, and TCP overhead.",
    [
      {
        text: translation?.ui?.badge54 || "Client-Side Only",
        tooltip:
          "Runs entirely in your browser using Web APIs — your data is processed locally and not sent to our servers.",
      },
    ],
    { toolId: "bandwidth-calculator" },
  );

  const currentTool = TOOLS.find((t) => t.id === "bandwidth-calculator");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];
  const exampleSizes = [
    ["1 GB", 1e9],
    ["10 GB", 10e9],
    ["100 GB", 100e9],
    ["1 TB", 1e12],
  ];
  const exampleSpeeds = [10, 100, 1000];
  const exampleRows = exampleSizes
    .map(
      ([label, bytes]) => `
        <tr><th scope="row">${label}</th>${exampleSpeeds
          .map((speed) => {
            const seconds = calculateTransferTimePure(
              bytes,
              speed * 1e6,
            );
            const label =
              seconds < 60
                ? `${seconds.toFixed(1)} s`
                : seconds < 3600
                  ? `${(seconds / 60).toFixed(1)} min`
                  : seconds < 86400
                    ? `${(seconds / 3600).toFixed(1)} h`
                    : `${(seconds / 86400).toFixed(1)} days`;
            return `<td>${label}</td>`;
          })
          .join("")}</tr>`,
    )
    .join("");

  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">
        ${toolHeader}

        <!-- Unit System Toggle -->
        <div class="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <span class="text-sm font-medium text-surface-700 dark:text-surface-300 shrink-0" data-i18n="tools.bandwidth-calculator.ui.label0">Unit System:</span>
            <div class="tabs-list max-w-full flex-wrap h-auto">
              <button id="unit-decimal" type="button" aria-pressed="true" class="unit-toggle tab-trigger active" data-unit="decimal">
                <span data-i18n="tools.bandwidth-calculator.ui.button0">Decimal (MB = 1000 KB)</span>
              </button>
              <button id="unit-binary" type="button" aria-pressed="false" class="unit-toggle tab-trigger" data-unit="binary">
                <span data-i18n="tools.bandwidth-calculator.ui.button1">Binary (MiB = 1024 KiB)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="border-b border-surface-200 dark:border-surface-700 mb-8">
          <nav data-i18n-aria="tools.bandwidth-calculator.ui.r6_0" class="flex flex-wrap gap-2" aria-label="Bandwidth calculator modes" role="tablist">
            <button id="tab-trigger-transfer" class="tab-trigger tab-button active" data-tab="transfer" role="tab" aria-controls="tab-transfer" aria-selected="true" tabindex="0">
              <span class="material-symbols-rounded text-base leading-none align-middle" aria-hidden="true" data-icon="schedule"></span> <span data-i18n="tools.bandwidth-calculator.ui.label1">Transfer Time</span>
            </button>
            <button id="tab-trigger-bandwidth" class="tab-trigger tab-button" data-tab="bandwidth" role="tab" aria-controls="tab-bandwidth" aria-selected="false" tabindex="-1">
              <span class="material-symbols-rounded text-base leading-none align-middle" aria-hidden="true" data-icon="network_check"></span> <span data-i18n="tools.bandwidth-calculator.ui.label2">Required Bandwidth</span>
            </button>
            <button id="tab-trigger-capacity" class="tab-trigger tab-button" data-tab="capacity" role="tab" aria-controls="tab-capacity" aria-selected="false" tabindex="-1">
              <span class="material-symbols-rounded text-base leading-none align-middle" aria-hidden="true" data-icon="storage"></span> <span data-i18n="tools.bandwidth-calculator.ui.label3">Data Capacity</span>
            </button>
            <button id="tab-trigger-tcp" class="tab-trigger tab-button" data-tab="tcp" role="tab" aria-controls="tab-tcp" aria-selected="false" tabindex="-1">
              <span class="material-symbols-rounded text-base leading-none align-middle" aria-hidden="true" data-icon="swap_horiz"></span> <span data-i18n="tools.bandwidth-calculator.ui.label4">TCP Overhead</span>
            </button>
          </nav>
        </div>

        <!-- Transfer Time Tab -->
        <div id="tab-transfer" class="tab-content" role="tabpanel" aria-labelledby="tab-trigger-transfer">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="space-y-6">
              <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.bandwidth-calculator.ui.heading0">Calculate Transfer Time</h2>
              
              <div>
                <label for="transfer-size" class="label" data-i18n="tools.bandwidth-calculator.ui.label5">File Size</label>
                <div class="flex gap-2">
                  <input type="number" id="transfer-size" value="1" min="0" step="any" placeholder="1" class="input flex-1" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder0">
                  <select id="transfer-size-unit" class="input w-28" aria-label="Transfer file size unit" data-i18n-aria="tools.bandwidth-calculator.ui.r61_0">
                    <option value="B">B</option>
                    <option value="KB">KB</option>
                    <option value="MB" selected>MB</option>
                    <option value="GB">GB</option>
                    <option value="TB">TB</option>
                  </select>
                </div>
              </div>

              <div>
                <label for="transfer-bandwidth" class="label" data-i18n="tools.bandwidth-calculator.ui.label6">Bandwidth</label>
                <div class="flex gap-2">
                  <input type="number" id="transfer-bandwidth" value="100" min="0" step="any" placeholder="100" class="input flex-1" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder1">
                  <select id="transfer-bandwidth-unit" class="input w-28" aria-label="Transfer bandwidth unit" data-i18n-aria="tools.bandwidth-calculator.ui.r61_1">
                    <option value="bps" data-i18n="tools.bandwidth-calculator.ui.option15">bps</option>
                    <option value="Kbps" data-i18n="tools.bandwidth-calculator.ui.option16">Kbps</option>
                    <option value="Mbps" selected data-i18n="tools.bandwidth-calculator.ui.option17">Mbps</option>
                    <option value="Gbps" data-i18n="tools.bandwidth-calculator.ui.option18">Gbps</option>
                  </select>
                </div>
              </div>

              <div>
                <label for="transfer-efficiency" class="label" data-i18n="tools.bandwidth-calculator.ui.r3_2">Protocol efficiency</label>
                <div class="flex items-center gap-2">
                  <input type="number" id="transfer-efficiency" value="100" min="0.01" max="100" step="any" class="input w-32">
                  <span class="text-sm text-surface-600 dark:text-surface-400">%</span>
                </div>
                <p class="text-xs text-surface-500 dark:text-surface-400 mt-1" data-i18n="tools.bandwidth-calculator.ui.r3_11">Estimated share of the link rate available for file data.</p>
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
                  <button class="preset-btn btn btn-ghost btn-xs" data-preset="bw" data-value="20000000" data-unit="bps" data-i18n="tools.bandwidth-calculator.ui.r3_0">Typical 4G · 20 Mbps</button>
                  <button class="preset-btn btn btn-ghost btn-xs" data-preset="bw" data-value="300000000" data-unit="bps" data-i18n="tools.bandwidth-calculator.ui.r3_1">Typical 5G · 300 Mbps</button>
                </div>
              </div>
            </div>

            <div class="bg-surface-50 dark:bg-surface-950 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4" data-i18n="tools.bandwidth-calculator.ui.heading1">Result</h3>
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
              <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.bandwidth-calculator.ui.heading2">Calculate Required Bandwidth</h2>
              
              <div>
                <label class="label" data-i18n="tools.bandwidth-calculator.ui.label8">File Size</label>
                <div class="flex gap-2">
                  <input type="number" id="bw-size" value="1" min="0" step="any" placeholder="1" class="input flex-1" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder2">
                  <select id="bw-size-unit" class="input w-28" aria-label="Required bandwidth file size unit" data-i18n-aria="tools.bandwidth-calculator.ui.r61_2">
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
                    <input type="number" id="bw-minutes" value="1" min="0" max="59" placeholder="0" class="input w-full" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder4">
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
              <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4" data-i18n="tools.bandwidth-calculator.ui.heading3">Required Bandwidth</h3>
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
              <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.bandwidth-calculator.ui.heading4">Calculate Data Capacity</h2>
              
              <div>
                <label class="label" data-i18n="tools.bandwidth-calculator.ui.label10">Bandwidth</label>
                <div class="flex gap-2">
                  <input type="number" id="cap-bandwidth" value="100" min="0" step="any" placeholder="100" class="input flex-1" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder6">
                  <select id="cap-bandwidth-unit" class="input w-28" aria-label="Data capacity bandwidth unit" data-i18n-aria="tools.bandwidth-calculator.ui.r61_3">
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
                    <input type="number" id="cap-minutes" value="1" min="0" max="59" placeholder="0" class="input w-full" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder8">
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
              <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4" data-i18n="tools.bandwidth-calculator.ui.heading5">Maximum Transferable Data</h3>
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
              <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.bandwidth-calculator.ui.heading6">TCP Bandwidth-Delay Product</h2>
              
              <div>
                <label class="label" data-i18n="tools.bandwidth-calculator.ui.label12">Bandwidth</label>
                <div class="flex gap-2">
                  <input type="number" id="tcp-bandwidth" value="1" min="0" step="any" placeholder="1" class="input flex-1" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder10">
                  <select id="tcp-bandwidth-unit" class="input w-28" aria-label="TCP bandwidth unit" data-i18n-aria="tools.bandwidth-calculator.ui.r61_4">
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
                  <input type="number" id="tcp-rtt" value="50" min="0" step="any" placeholder="50" class="input flex-1" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder11">
                  <select id="tcp-rtt-unit" class="input w-28" aria-label="Round trip time unit" data-i18n-aria="tools.bandwidth-calculator.ui.r61_5">
                    <option value="ms" selected data-i18n="tools.bandwidth-calculator.ui.option19">ms</option>
                    <option value="s">s</option>
                  </select>
                </div>
              </div>

              <div>
                <label for="tcp-mss" class="label" data-i18n="tools.bandwidth-calculator.ui.label14">MSS (Maximum Segment Size)</label>
                <div class="flex gap-2">
                  <input type="number" id="tcp-mss" value="1460" min="1" step="1" placeholder="1460" class="input flex-1" data-i18n-placeholder="tools.bandwidth-calculator.ui.placeholder12">
                  <span data-i18n="tools.bandwidth-calculator.ui.r6_1" class="input w-28 flex items-center justify-center bg-surface-100 dark:bg-surface-800">bytes</span>
                </div>
                <p class="text-xs text-surface-500 dark:text-surface-400 mt-1" data-i18n="tools.bandwidth-calculator.ui.desc15">Typical: 1460 bytes (Ethernet MTU 1500 - 40 byte headers)</p>
              </div>
            </div>

            <div class="bg-surface-50 dark:bg-surface-950 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4" data-i18n="tools.bandwidth-calculator.ui.heading7">TCP Analysis</h3>
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
                <div>
                  <p class="text-xs text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.bandwidth-calculator.ui.r3_12">Segments in flight per RTT (BDP / MSS)</p>
                  <p id="tcp-segments" class="text-lg font-semibold text-surface-700 dark:text-surface-300">--</p>
                </div>
                <div class="pt-4 border-t border-surface-200 dark:border-surface-700">
                  <p class="text-xs text-surface-500 dark:text-surface-400 mb-1" data-i18n="tools.bandwidth-calculator.ui.desc20">Window Scale Option Needed?</p>
                  <p id="tcp-scale-needed" class="text-sm font-medium">--</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section class="card p-6 mt-8 space-y-6" aria-labelledby="bandwidth-reference-heading">
          <h2 id="bandwidth-reference-heading" class="text-xl font-semibold text-surface-900 dark:text-white" data-i18n="tools.bandwidth-calculator.ui.r3_7">Bandwidth and transfer-time reference</h2>
          <div>
            <h3 class="text-lg font-semibold text-surface-800 dark:text-surface-200" data-i18n="tools.bandwidth-calculator.ui.r3_8">Mbps vs MB/s</h3>
            <p class="text-sm text-surface-600 dark:text-surface-400 mt-2" data-i18n="tools.bandwidth-calculator.ui.r3_13">Mbps measures megabits per second; MB/s measures megabytes per second. Since 8 bits make 1 byte, divide a decimal Mbps rate by 8 to get its ideal MB/s rate.</p>
            <div class="overflow-x-auto mt-3">
              <table class="w-full text-sm text-left">
                <thead><tr><th class="p-2" data-i18n="tools.bandwidth-calculator.ui.r3_3">Link rate</th><th class="p-2" data-i18n="tools.bandwidth-calculator.ui.r3_4">Ideal data rate</th></tr></thead>
                <tbody>
                  <tr><td data-i18n="tools.bandwidth-calculator.ui.r6_2" class="p-2">8 Mbps</td><td class="p-2">1 MB/s</td></tr>
                  <tr><td data-i18n="tools.bandwidth-calculator.ui.r6_3" class="p-2">100 Mbps</td><td class="p-2">12.5 MB/s</td></tr>
                  <tr><td data-i18n="tools.bandwidth-calculator.ui.r6_4" class="p-2">1 Gbps (1,000 Mbps)</td><td class="p-2">125 MB/s</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-surface-800 dark:text-surface-200" data-i18n="tools.bandwidth-calculator.ui.r3_9">Example transfer times</h3>
            <p class="text-sm text-surface-600 dark:text-surface-400 mt-2" data-i18n="tools.bandwidth-calculator.ui.r3_14">Ideal times use decimal file sizes and 100% efficiency, with no protocol or storage bottlenecks.</p>
            <div class="overflow-x-auto mt-3">
              <table class="w-full text-sm text-left">
                <thead><tr><th class="p-2" data-i18n="tools.bandwidth-calculator.ui.r3_5">File size</th><th data-i18n="tools.bandwidth-calculator.ui.r6_5" class="p-2">10 Mbps</th><th data-i18n="tools.bandwidth-calculator.ui.r6_6" class="p-2">100 Mbps</th><th class="p-2" data-i18n="tools.bandwidth-calculator.ui.r3_6">1,000 Mbps</th></tr></thead>
                <tbody>${exampleRows}</tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-surface-800 dark:text-surface-200" data-i18n="tools.bandwidth-calculator.ui.r3_10">How the calculation works</h3>
            <p class="text-sm text-surface-600 dark:text-surface-400 mt-2" data-i18n="tools.bandwidth-calculator.ui.r3_15">Convert the file size to bytes and the bandwidth to bits per second, then divide the file's bits by the usable bit rate.</p>
            <p class="font-mono text-sm mt-2 text-surface-800 dark:text-surface-200" data-i18n="tools.bandwidth-calculator.ui.r3_16">time (seconds) = file size (bytes) × 8 ÷ [bandwidth (bits/second) × efficiency (%) ÷ 100]</p>
            <p class="text-xs text-surface-500 dark:text-surface-400 mt-2" data-i18n="tools.bandwidth-calculator.ui.r3_17">Decimal units use powers of 1,000 (MB = 1,000,000 bytes); binary units use powers of 1,024 (MiB = 1,048,576 bytes).</p>
          </div>
        </section>

        ${createCheatsheet(
          "bandwidth-calculator",
          "Bandwidth Reference Table",
          [
            {
              heading: "Common Connection Types",
              content: `
              <table>
                <tr><th data-i18n="tools.bandwidth-calculator.ui.th20">Connection</th><th data-i18n="tools.bandwidth-calculator.ui.th21">Speed</th><th data-i18n="tools.bandwidth-calculator.ui.th22">Use Case</th></tr>
                <tr><td data-i18n="tools.bandwidth-calculator.ui.r66_0">Dial-up</td><td>56 Kbps</td><td>Legacy, text-only</td></tr>
                <tr><td>ADSL</td><td>10 Mbps</td><td>Basic home internet</td></tr>
                <tr><td data-i18n="tools.bandwidth-calculator.ui.r66_1">Cable/Fiber</td><td>100-1000 Mbps</td><td>Home/Office internet</td></tr>
                <tr><td data-i18n="tools.bandwidth-calculator.ui.r66_2">Gigabit Ethernet</td><td>1 Gbps</td><td>LAN, data center</td></tr>
                <tr><td>10 GigE</td><td>10 Gbps</td><td>Server interconnect</td></tr>
                <tr><td>40/100 GigE</td><td>40-100 Gbps</td><td>Core networking</td></tr>
              </table>`,
            },
            {
              heading: "Data Size Reference",
              content: `
              <table>
                <tr><th data-i18n="tools.bandwidth-calculator.ui.th23">Media</th><th data-i18n="tools.bandwidth-calculator.ui.th24">Approx. Size</th></tr>
                <tr><td>MP3 Song (4 min)</td><td>4 MB</td></tr>
                <tr><td>CD Audio (74 min)</td><td>650 MB</td></tr>
                <tr><td>DVD (single layer)</td><td>4.7 GB</td></tr>
                <tr><td>Blu-ray (single layer)</td><td>25 GB</td></tr>
                <tr><td>Triple-A Game</td><td>50-100 GB</td></tr>
                <tr><td>4K Movie</td><td>50-100 GB</td></tr>
              </table>`,
            },
            {
              heading: "Unit Conversions",
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
              </table>`,
            },
          ],
        )}
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const scripts = `
    <script>
      const toBytes = ${toBytes.toString()};
      const toBitsPerSecond = ${toBitsPerSecond.toString()};
      const calculateTransferTimePure = ${calculateTransferTimePure.toString()};
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
        if (seconds < 1) {
          return (seconds * 1000).toPrecision(3) + ' ms';
        } else if (seconds < 60) {
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
      function toBytesForDisplay(value, unit) {
        const base = getBase();
        const multipliers = { 'B': 1, 'KB': base, 'MB': base * base, 'GB': base * base * base, 'TB': base * base * base * base,
                              'KiB': 1024, 'MiB': 1024 * 1024, 'GiB': 1024 * 1024 * 1024, 'TiB': 1024 * 1024 * 1024 * 1024 };
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
            t.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          });
          const binaryLabels = { KB: 'KiB', MB: 'MiB', GB: 'GiB', TB: 'TiB' };
          document.querySelectorAll('select option').forEach(opt => {
            if (binaryLabels[opt.value]) opt.textContent = useBinary ? binaryLabels[opt.value] : opt.value;
          });
          // Recalculate all
          updateTransferTime();
          calculateBandwidth();
          calculateCapacity();
          calculateTCP();
        });
      });


      // Transfer Time Calculator
      function updateTransferTime() {
        const size = parseFloat(document.getElementById('transfer-size').value);
        const sizeUnit = document.getElementById('transfer-size-unit').value;
        const bandwidth = parseFloat(document.getElementById('transfer-bandwidth').value);
        const bandwidthUnit = document.getElementById('transfer-bandwidth-unit').value;
        const efficiency = parseFloat(document.getElementById('transfer-efficiency').value);

        const bytes = toBytes(size, sizeUnit, useBinary);
        const bitsPerSec = toBitsPerSecond(bandwidth, bandwidthUnit);
        const seconds =
          bytes === null || bitsPerSec === null
            ? null
            : calculateTransferTimePure(bytes, bitsPerSec, efficiency);
        if (seconds === null) {
          document.getElementById('transfer-result').textContent = '--';
          document.getElementById('transfer-seconds').textContent = '--';
          document.getElementById('transfer-minutes').textContent = '--';
          return;
        }

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

        const bytes = toBytesForDisplay(size, sizeUnit);
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
          document.getElementById('tcp-segments').textContent = '--';
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
        document.getElementById('tcp-window').textContent = _t('tools.bandwidth-calculator.js.r66_bytes', '{n} bytes').replace('{n}', windowNeeded.toLocaleString());
        
        if (maxThroughput >= bitsPerSec) {
          document.getElementById('tcp-throughput').textContent = _t('tools.bandwidth-calculator.js.r66_line', '{rate} (line rate)').replace('{rate}', formatBitsPerSecond(bitsPerSec));
        } else {
          document.getElementById('tcp-throughput').textContent = _t('tools.bandwidth-calculator.js.r66_limited', '{rate} (limited by the 64 KiB window without scaling)').replace('{rate}', formatBitsPerSecond(maxThroughput));
        }
        document.getElementById('tcp-segments').textContent = _t('tools.bandwidth-calculator.js.r66_segments', '{n} segments of {size} bytes').replace('{n}', Math.ceil(bdpBytes / mss).toLocaleString()).replace('{size}', mss.toLocaleString());

        const scaleNeeded = windowNeeded > standardWindow;
        const scaleEl = document.getElementById('tcp-scale-needed');
        if (scaleNeeded) {
          const scaleFactor = Math.ceil(Math.log2(windowNeeded / standardWindow));
          scaleEl.textContent = _t('tools.bandwidth-calculator.js.text2', 'Yes (scale factor: ') + Math.min(scaleFactor, 14) + ')' +
            (scaleFactor > 14 ? ' - exceeds the RFC 7323 maximum of 14 (1 GiB window); one connection cannot fill this path' : '');
          scaleEl.className = 'text-sm font-medium text-warning-600 dark:text-warning-400';
        } else {
          scaleEl.textContent = _t('tools.bandwidth-calculator.js.text1', 'No');
          scaleEl.className = 'text-sm font-medium text-success-600 dark:text-success-400';
        }
      }

      // Attach event listeners
      document.getElementById('transfer-size').addEventListener('input', updateTransferTime);
      document.getElementById('transfer-size-unit').addEventListener('change', updateTransferTime);
      document.getElementById('transfer-bandwidth').addEventListener('input', updateTransferTime);
      document.getElementById('transfer-bandwidth-unit').addEventListener('change', updateTransferTime);
      document.getElementById('transfer-efficiency').addEventListener('input', updateTransferTime);

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
          updateTransferTime();
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
      updateTransferTime();
      calculateBandwidth();
      calculateCapacity();
      calculateTCP();
    </script>
  `;

  return createPageTemplate({
    title: translation?.name || "Bandwidth Calculator",
    description:
      translation?.desc ||
      "Calculate transfer times, required bandwidth, data capacity, and TCP overhead.",
    path: "/bandwidth-calculator",
    content,
    scripts,
    lang: currentLang,
  });
}

/**
 * Route handler for Bandwidth Calculator
 */
export async function handleBandwidthCalculatorRoutes(request, url) {
  try {
    if (
      url.pathname === "/bandwidth-calculator" ||
      url.pathname === "/bandwidth-calculator/"
    ) {
      if (request.method === "GET") {
        return respondHTML(
          renderBandwidthCalculatorPage(resolveRequestLanguage(request, url)),
        );
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}
