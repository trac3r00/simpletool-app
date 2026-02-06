/**
 * CIDR / IP Subnet Calculator
 * Supports IPv4 and IPv6 with client-side calculations
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint } from '../utils/common-ui.js';

export async function handleCIDRCalculatorRoutes(request, url) {
  const { pathname } = url;

  if (pathname === '/cidr-calculator' || pathname === '/cidr-calculator/') {
    if (request.method === 'GET') {
      return respondHTML(renderCIDRCalculatorPage());
    }

    return respondJSON({ error: 'Method not allowed' }, { status: 405 });
  }

  return null;
}

function renderCIDRCalculatorPage() {
  const toolHeader = createToolHeader(
    { emoji: '🕸️' },
    'IP Subnet Planner',
    'Inspect IPv4 and IPv6 networks, validate ranges, plan host allocations, and share subnet blueprints.',
    [
      { text: 'Zero Upload', color: 'blue', tooltip: 'No data is uploaded; all subnet math runs locally in your browser.' },
      { text: 'IPv4 & IPv6', color: 'purple', tooltip: 'Handles subnet planning for both IPv4 and IPv6 address spaces.' }
    ],
    { toolId: 'cidr-calculator' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      ${toolHeader}

      <section class="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <!-- Input Panel -->
        <div class="card p-6 space-y-6">
          <div>
            <label for="cidr-input" class="label"><span data-i18n="tools.cidr-calculator.ui.label4">Network or host</span> ${infoHint('Enter IP with /prefix or dotted mask; missing prefix uses the slider value.')}</label>
            <div class="mt-2 space-y-3">
              <input id="cidr-input" type="text" data-tooltip="Enter IP address with prefix length, e.g. 192.168.1.0/24" spellcheck="false" autocomplete="off" placeholder="Examples: 192.168.1.10/24 · 2001:db8::/48" data-i18n-placeholder="tools.cidr-calculator.ui.placeholder8" class="input font-mono text-base" />
              <div class="flex flex-wrap gap-2 text-sm">
                <button type="button" class="cidr-chip px-2 py-1 rounded-md text-xs border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:border-primary-400 hover:text-primary-600 transition" data-cidr-example="10.0.0.0/8">10.0.0.0/8</button>
                <button type="button" class="cidr-chip px-2 py-1 rounded-md text-xs border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:border-primary-400 hover:text-primary-600 transition" data-cidr-example="172.16.0.0/12">172.16.0.0/12</button>
                <button type="button" class="cidr-chip px-2 py-1 rounded-md text-xs border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:border-primary-400 hover:text-primary-600 transition" data-cidr-example="192.168.1.0/24">192.168.1.0/24</button>
                <button type="button" class="cidr-chip px-2 py-1 rounded-md text-xs border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:border-primary-400 hover:text-primary-600 transition" data-cidr-example="100.64.0.0/10">100.64.0.0/10</button>
                <button type="button" class="cidr-chip px-2 py-1 rounded-md text-xs border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:border-primary-400 hover:text-primary-600 transition" data-cidr-example="2001:db8::/32"><span data-i18n="tools.cidr-calculator.ui.button0">2001:db8::/32</span></button>
              </div>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between text-sm font-semibold text-surface-600 dark:text-surface-300">
              <span>Prefix length</span>
              <span><span id="prefix-display">/24</span> · <span id="host-bits-display">8 host bits</span></span>
            </div>
            <div class="flex items-center gap-4 mt-3">
              <input id="prefix-slider" type="range" aria-label="Prefix length slider" data-tooltip="Adjust subnet prefix length (smaller = more hosts)" min="0" max="32" value="24" class="flex-1 h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer dark:bg-surface-700 accent-primary-600" />
              <input id="prefix-number" type="number" aria-label="Prefix length value" min="0" max="32" value="24" class="w-20 input text-center" />
            </div>
            <p class="mt-2 text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.cidr-calculator.ui.desc21">Specify a prefix if your input omits it.</p>
          </div>

          <div id="cidr-error" class="hidden rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-200 px-4 py-3">Invalid CIDR block.</div>

          <div class="flex flex-wrap gap-3">
            <button id="analyze-btn" class="btn btn-primary" data-tooltip="Calculate subnet details from CIDR notation"><span data-i18n="tools.cidr-calculator.ui.button1">Run analysis</span></button>
            <button id="reset-btn" class="btn btn-ghost"><span data-i18n="tools.cidr-calculator.ui.button2">Reset</span></button>
          </div>
        </div>

        <!-- Sidebar Tools -->
        <div class="space-y-6">
          <!-- Capacity Planner -->
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.cidr-calculator.ui.heading15">Quick host fit</h2>
            </div>
            <div class="space-y-4">
              <div>
                 <label for="host-requirement" class="label"><span data-i18n="tools.cidr-calculator.ui.label5">Required hosts</span></label>
                 <input id="host-requirement" type="number" min="1" max="1000000" value="256" class="input" />
              </div>
              <div>
                  <label class="label"><span data-i18n="tools.cidr-calculator.ui.label6">Address family</span></label>
                  <div class="grid grid-cols-2 gap-2">
                    <label class="flex items-center gap-2 border border-surface-200 dark:border-surface-700 px-3 py-2 rounded-md cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                      <input type="radio" name="host-family" value="ipv4" class="accent-primary-600" checked />
                      <span class="text-sm font-medium">IPv4</span>
                    </label>
                    <label class="flex items-center gap-2 border border-surface-200 dark:border-surface-700 px-3 py-2 rounded-md cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                      <input type="radio" name="host-family" value="ipv6" class="accent-primary-600" />
                      <span class="text-sm font-medium">IPv6</span>
                    </label>
                  </div>
              </div>
              <button id="host-plan-btn" class="btn btn-secondary w-full"><span data-i18n="tools.cidr-calculator.ui.button3">Calculate ideal prefix</span></button>
              <div id="host-plan-result" class="text-sm text-surface-600 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-4 py-3">Ready when you need it.</div>
            </div>
          </div>

          <!-- Checklist -->
          <div class="card p-6">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.cidr-calculator.ui.heading16">Validation</h2>
            </div>
            <ul id="validation-list" class="space-y-2 text-sm text-surface-600 dark:text-surface-300">
              <li class="validation-item">Enter a CIDR block to begin.</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Results Panel -->
      <section id="results-panel" class="hidden space-y-8">
        
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div class="card p-5 border-l-4 border-l-primary-500">
            <p class="label text-surface-500 dark:text-surface-400" data-i18n="tools.cidr-calculator.ui.desc22">Network ID</p>
            <p id="summary-network" class="text-xl font-bold text-surface-900 dark:text-surface-50 mt-1 break-words">—</p>
            <p id="summary-prefix" class="text-xs text-surface-500 mt-1" data-i18n="tools.cidr-calculator.ui.desc23">Prefix —</p>
          </div>
          <div class="card p-5">
            <p class="label text-surface-500 dark:text-surface-400" data-i18n="tools.cidr-calculator.ui.desc24">Address range</p>
            <p id="summary-range" class="text-xl font-bold text-surface-900 dark:text-surface-50 mt-1 break-words">—</p>
            <p id="summary-first-last" class="text-xs text-surface-500 dark:text-surface-400 mt-1" data-i18n="tools.cidr-calculator.ui.desc25">First · Last</p>
          </div>
          <div class="card p-5">
            <p class="label text-surface-500 dark:text-surface-400" data-i18n="tools.cidr-calculator.ui.desc26">Capacity</p>
            <p id="summary-capacity" class="text-xl font-bold text-surface-900 dark:text-surface-50 mt-1">—</p>
            <p id="summary-usable" class="text-xs text-surface-500 dark:text-surface-400 mt-1">Usable hosts</p>
          </div>
          <div class="card p-5">
            <p class="label text-surface-500 dark:text-surface-400" data-i18n="tools.cidr-calculator.ui.desc27">Classification</p>
            <p id="summary-classification" class="text-xl font-bold text-surface-900 dark:text-surface-50 mt-1">—</p>
            <p id="summary-special" class="text-xs text-surface-500 dark:text-surface-400 mt-1">Notes</p>
          </div>
        </div>

        <!-- Detailed Breakdown Table -->
        <div class="card p-6 overflow-hidden">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.cidr-calculator.ui.heading17">Detailed breakdown</h2>
            <span class="text-xs font-mono bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded" id="detail-version">IPv4</span>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm text-left">
              <tbody id="detail-body" class="divide-y divide-surface-100 dark:divide-surface-800"></tbody>
            </table>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <!-- Binary View -->
          <div class="card p-6">
            <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.cidr-calculator.ui.heading18">Binary & Hex</h2>
            <div class="space-y-4 text-sm font-mono">
              <div>
                <p class="text-surface-500 dark:text-surface-400 mb-1 text-xs uppercase" data-i18n="tools.cidr-calculator.ui.desc28">Expanded</p>
                <div id="hex-output" class="rounded-lg bg-surface-50 dark:bg-surface-950 px-4 py-3 overflow-x-auto break-all border border-surface-200 dark:border-surface-800">—</div>
              </div>
              <div>
                <p class="text-surface-500 dark:text-surface-400 mb-1 text-xs uppercase" data-i18n="tools.cidr-calculator.ui.desc29">Bit pattern</p>
                <div id="binary-output" class="rounded-lg bg-surface-50 dark:bg-surface-950 px-4 py-3 overflow-x-auto break-all border border-surface-200 dark:border-surface-800">—</div>
              </div>
            </div>
          </div>

          <!-- Reference Slices -->
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.cidr-calculator.ui.heading19">Neighboring Prefixes</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm text-left">
                <thead class="text-xs uppercase tracking-widest text-surface-500 border-b border-surface-200 dark:border-surface-700">
                  <tr>
                    <th class="py-2 pr-4 font-normal" data-i18n="tools.cidr-calculator.ui.th10">Prefix</th>
                    <th class="py-2 pr-4 font-normal" data-i18n="tools.cidr-calculator.ui.th11">Mask / hosts</th>
                    <th class="py-2 font-normal" data-i18n="tools.cidr-calculator.ui.th12">Notes</th>
                  </tr>
                </thead>
                <tbody id="reference-body" class="divide-y divide-surface-100 dark:divide-surface-800 text-surface-700 dark:text-surface-200"></tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Subnet Explorer -->
        <div class="card p-6">
          <div class="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50" data-i18n="tools.cidr-calculator.ui.heading20">Subnet Explorer</h2>
              <p class="text-sm text-surface-500" data-i18n="tools.cidr-calculator.ui.desc30">Split the analyzed block into smaller CIDRs.</p>
            </div>
            <div class="flex items-center gap-2">
               <label for="subnet-prefix" class="text-sm text-surface-500 dark:text-surface-400"><span data-i18n="tools.cidr-calculator.ui.label7">Target prefix</span> ${infoHint('Pick a deeper prefix to split the analyzed block into smaller subnets.')}</label>
              <select id="subnet-prefix" class="input py-1 px-3 w-auto" aria-label="Target prefix for subnet splitting"></select>
            </div>
          </div>
          <div id="subnet-warning" class="hidden text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">This block cannot be subdivided further.</div>
          <div class="overflow-x-auto mt-4">
            <table class="min-w-full text-sm text-left">
              <thead class="text-xs uppercase tracking-widest text-surface-500 border-b border-surface-200 dark:border-surface-700">
                <tr>
                  <th class="py-2 pr-4 font-normal">CIDR</th>
                  <th class="py-2 pr-4 font-normal" data-i18n="tools.cidr-calculator.ui.th13">Range</th>
                  <th class="py-2 font-normal" data-i18n="tools.cidr-calculator.ui.th14">Usable hosts</th>
                </tr>
              </thead>
              <tbody id="subnet-body" class="divide-y divide-surface-100 dark:divide-surface-800 text-surface-700 dark:text-surface-200"></tbody>
            </table>
          </div>
          <p id="subnet-summary" class="mt-4 text-sm text-surface-500 dark:text-surface-400" data-i18n="tools.cidr-calculator.ui.desc31">Select a prefix to preview subnets.</p>
        </div>
      </section>

      ${createCheatsheet('cidr-calculator', 'Subnet Quick Reference', [
        { heading: 'Common Subnets', content: `
          <table>
            <tr><th>CIDR</th><th>Subnet Mask</th><th>Hosts</th><th>Use Case</th></tr>
            <tr><td><code>/32</code></td><td>255.255.255.255</td><td>1</td><td>Single host</td></tr>
            <tr><td><code>/24</code></td><td>255.255.255.0</td><td>254</td><td>Small network</td></tr>
            <tr><td><code>/16</code></td><td>255.255.0.0</td><td>65,534</td><td>Medium network</td></tr>
            <tr><td><code>/8</code></td><td>255.0.0.0</td><td>16M+</td><td>Large network</td></tr>
          </table>` },
        { heading: 'Private Ranges (RFC 1918)', content: `
          <table>
            <tr><th>Range</th><th>CIDR</th><th>Class</th></tr>
            <tr><td>10.0.0.0 – 10.255.255.255</td><td><code>10.0.0.0/8</code></td><td>A</td></tr>
            <tr><td>172.16.0.0 – 172.31.255.255</td><td><code>172.16.0.0/12</code></td><td>B</td></tr>
            <tr><td>192.168.0.0 – 192.168.255.255</td><td><code>192.168.0.0/16</code></td><td>C</td></tr>
          </table>` }
      ])}
    </main>

    <script>
      (function() {
        const cidrInput = document.getElementById('cidr-input');
        const prefixSlider = document.getElementById('prefix-slider');
        const prefixNumber = document.getElementById('prefix-number');
        const prefixDisplay = document.getElementById('prefix-display');
        const hostBitsDisplay = document.getElementById('host-bits-display');
        const analyzeBtn = document.getElementById('analyze-btn');
        const resetBtn = document.getElementById('reset-btn');
        const errorBox = document.getElementById('cidr-error');
        const resultPanel = document.getElementById('results-panel');
        const detailBody = document.getElementById('detail-body');
        const referenceBody = document.getElementById('reference-body');
        const validationList = document.getElementById('validation-list');
        const subnetPrefixSelect = document.getElementById('subnet-prefix');
        const subnetBody = document.getElementById('subnet-body');
        const subnetSummary = document.getElementById('subnet-summary');
        const subnetWarning = document.getElementById('subnet-warning');
        const hostPlanBtn = document.getElementById('host-plan-btn');
        const hostRequirementInput = document.getElementById('host-requirement');
        const hostPlanResult = document.getElementById('host-plan-result');
        const detailVersion = document.getElementById('detail-version');

        const summaryFields = {
          network: document.getElementById('summary-network'),
          prefix: document.getElementById('summary-prefix'),
          range: document.getElementById('summary-range'),
          firstLast: document.getElementById('summary-first-last'),
          capacity: document.getElementById('summary-capacity'),
          usable: document.getElementById('summary-usable'),
          classification: document.getElementById('summary-classification'),
          special: document.getElementById('summary-special')
        };

        const binaryOutput = document.getElementById('binary-output');
        const hexOutput = document.getElementById('hex-output');

        let currentDetails = null;

        function escapeHTML(value) {
          if (value === undefined || value === null) {
            return '';
          }
          return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        }

        function detectFamilyHint(value) {
          return value.includes(':') ? 'ipv6' : 'ipv4';
        }

        function updatePrefixControls(family) {
          const max = family === 'ipv6' ? 128 : 32;
          if (Number(prefixSlider.max) !== max) {
            prefixSlider.max = max;
            prefixNumber.max = max;
            if (Number(prefixSlider.value) > max) {
              prefixSlider.value = String(max);
              prefixNumber.value = String(max);
            }
          }
          const prefix = Number(prefixSlider.value);
          const hostBits = max - prefix;
          prefixDisplay.textContent = '/' + prefix;
          hostBitsDisplay.textContent = hostBits + ' host bits';
        }

        function syncPrefixInputs(event) {
          if (event) {
            const rawValue = Number(event.target.value);
            const family = detectFamilyHint(cidrInput.value);
            const max = family === 'ipv6' ? 128 : 32;
            const clamped = Math.min(Math.max(Number.isFinite(rawValue) ? rawValue : 0, 0), max);
            prefixSlider.value = String(clamped);
            prefixNumber.value = String(clamped);
            updatePrefixControls(family);
            return;
          }
          prefixNumber.value = prefixSlider.value;
          updatePrefixControls(detectFamilyHint(cidrInput.value));
        }

        prefixSlider.addEventListener('input', () => {
          prefixNumber.value = prefixSlider.value;
          updatePrefixControls(detectFamilyHint(cidrInput.value));
        });
        prefixNumber.addEventListener('input', syncPrefixInputs);
        cidrInput.addEventListener('input', () => updatePrefixControls(detectFamilyHint(cidrInput.value)));

        document.querySelectorAll('.cidr-chip').forEach(button => {
          button.addEventListener('click', () => {
            cidrInput.value = button.dataset.cidrExample;
            updatePrefixControls(detectFamilyHint(cidrInput.value));
            runAnalysis();
          });
        });

        cidrInput.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            runAnalysis();
          }
        });

        function showError(message) {
          if (!message) {
            errorBox.classList.add('hidden');
            errorBox.textContent = '';
            return;
          }
          errorBox.textContent = message;
          errorBox.classList.remove('hidden');
        }

        function parseCIDRInput() {
          const raw = cidrInput.value.trim();
          if (!raw) {
            throw new Error('Provide an IP address or CIDR block.');
          }

          let ipPart = raw;
          let prefixPart = null;

          if (raw.includes('/')) {
            const segments = raw.split('/');
            if (segments.length !== 2) {
              throw new Error('Only one "/" is allowed in CIDR notation.');
            }
            ipPart = segments[0].trim();
            prefixPart = segments[1].trim();
          } else {
            const tokens = raw.split(/\\s+/);
            if (tokens.length === 2) {
              ipPart = tokens[0];
              prefixPart = tokens[1];
            }
          }

          const family = detectFamilyHint(ipPart).toLowerCase();
          if (family !== 'ipv4' && family !== 'ipv6') {
            throw new Error('Unable to detect IP version.');
          }

          const maxPrefix = family === 'ipv6' ? 128 : 32;
          let prefix;
          if (prefixPart !== null && prefixPart !== '') {
            if (family === 'ipv4' && prefixPart.includes('.')) {
              prefix = maskToPrefix(prefixPart);
            } else if (/^\\d+$/.test(prefixPart)) {
              prefix = Number(prefixPart);
            } else {
              throw new Error('Unsupported prefix format. Use /length or dotted-decimal netmask.');
            }
          } else {
            prefix = Number(prefixSlider.value);
          }

          if (!Number.isFinite(prefix)) {
            throw new Error('Prefix must be numeric.');
          }

          if (prefix < 0 || prefix > maxPrefix) {
            throw new Error('Prefix must be between 0 and ' + maxPrefix + ' for ' + family.toUpperCase() + '.');
          }

          if (family === 'ipv4') {
            if (!isValidIPv4(ipPart)) {
              throw new Error('Invalid IPv4 address.');
            }
            return { family: 'IPv4', prefix, address: normalizeIPv4(ipPart) };
          }

          if (!isValidIPv6(ipPart)) {
            throw new Error('Invalid IPv6 address.');
          }
          return { family: 'IPv6', prefix, address: compressIPv6(ipPart) };
        }

        function runAnalysis(event) {
          if (event) {
            event.preventDefault();
          }
          try {
            const parsed = parseCIDRInput();
            updatePrefixControls(parsed.family === 'IPv6' ? 'ipv6' : 'ipv4');
            const details = parsed.family === 'IPv4' ? calculateIPv4Details(parsed) : calculateIPv6Details(parsed);
            currentDetails = details;
            renderResults(details);
            showError('');
            resultPanel.classList.remove('hidden');
          } catch (error) {
            showError(error.message);
            resultPanel.classList.add('hidden');
            currentDetails = null;
          }
        }

        analyzeBtn.addEventListener('click', runAnalysis);
        resetBtn.addEventListener('click', () => {
          cidrInput.value = '';
          prefixSlider.value = '24';
          prefixNumber.value = '24';
          updatePrefixControls('ipv4');
          resultPanel.classList.add('hidden');
          showError('');
          validationList.innerHTML = '<li class="validation-item">Enter a CIDR block to begin.</li>';
        });

        function renderResults(details) {
          summaryFields.network.textContent = details.network;
          summaryFields.prefix.textContent = details.normalized;
          summaryFields.range.textContent = details.range;
          summaryFields.firstLast.textContent = details.firstHost + ' · ' + details.lastHost;
          summaryFields.capacity.textContent = details.totalDisplay;
          summaryFields.usable.textContent = details.usableDisplay;
          summaryFields.classification.textContent = details.classification;
          summaryFields.special.textContent = details.special || '—';
          detailVersion.textContent = details.family;

          hexOutput.textContent = details.expanded;
          binaryOutput.textContent = details.binary;

          detailBody.innerHTML = buildDetailRows(details);
          referenceBody.innerHTML = buildReferenceRows(details);
          validationList.innerHTML = buildValidationList(details);
          updateSubnetExplorer(details);
        }

        function buildDetailRows(details) {
          const rows = [];
          rows.push(['Normalized input', details.normalized]);
          rows.push(['Prefix length', '/' + details.prefix]);
          rows.push(['Network bits', details.networkBits]);
          rows.push(['Host bits', details.hostBits]);
          if (details.netmask) {
            rows.push(['Netmask', details.netmask]);
            rows.push(['Wildcard mask', details.wildcard]);
          }
          rows.push(['Network ID', details.network]);
          if (details.broadcast) {
            rows.push(['Broadcast', details.broadcast]);
          }
          rows.push(['First host', details.firstHost]);
          rows.push(['Last host', details.lastHost]);
          rows.push(['Total addresses', details.totalDisplay]);
          rows.push(['Usable addresses', details.usableDisplay]);
          rows.push(['Range', details.range]);
          if (details.ipClass) {
            rows.push(['IPv4 class', details.ipClass]);
          }
          if (details.special) {
            rows.push(['Special notes', details.special]);
          }
          return rows.map(row => '<tr><td class="py-2 pr-4 font-semibold text-surface-600 dark:text-surface-300">' + escapeHTML(row[0]) + '</td><td class="py-2 text-surface-900 dark:text-white break-all font-mono">' + escapeHTML(row[1]) + '</td></tr>').join('');
        }

        function buildReferenceRows(details) {
          const rows = [];
          const max = details.family === 'IPv6' ? 128 : 32;
          const windowSize = details.family === 'IPv6' ? 6 : 5;
          const start = Math.max(0, details.prefix - Math.floor(windowSize / 2));
          const end = Math.min(max, start + windowSize);
          for (let prefix = start; prefix <= end; prefix++) {
            const highlight = prefix === details.prefix ? 'bg-primary-50 dark:bg-primary-900/20' : '';
            const capacity = details.family === 'IPv6' ? '2^' + (128 - prefix) : formatNumber(Math.pow(2, 32 - prefix));
            const mask = details.family === 'IPv6' ? '—' : intToIPv4(prefixToMask(prefix));
            rows.push('<tr class="' + highlight + '"><td class="py-2 pr-4 font-mono font-semibold">/' + prefix + '</td><td class="py-2 pr-4 text-xs sm:text-sm">' + (mask ? mask + ' · ' : '') + capacity + '</td><td class="py-2 text-xs italic text-surface-400">' + (prefix === details.prefix ? 'Current' : '') + '</td></tr>');
          }
          return rows.join('');
        }

        function buildValidationList(details) {
          const items = [];
          items.push(successItem('syntax', 'Valid CIDR syntax'));
          items.push(successItem('alignment', 'Network + prefix resolves to ' + details.network));
          items.push(successItem('scope', details.classification));
          return items.join('');
        }

        function successItem(id, text) {
          return '<li class="flex items-center gap-2"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs">✓</span><span>' + escapeHTML(text) + '</span></li>';
        }

        function updateSubnetExplorer(details) {
          subnetBody.innerHTML = '';
          const maxPrefix = details.family === 'IPv6' ? 128 : 32;
          const options = [];
          for (let p = details.prefix + 1; p <= Math.min(details.prefix + 8, maxPrefix); p++) {
            options.push('<option value="' + p + '" data-i18n="tools.cidr-calculator.ui.option9">/' + p + '</option>');
          }
          subnetPrefixSelect.innerHTML = options.join('');
          if (!options.length) {
            subnetWarning.classList.remove('hidden');
            subnetSummary.textContent = _t('tools.cidr-calculator.js.text0', 'This block is already at the smallest granularity.');
            subnetPrefixSelect.disabled = true;
            return;
          }
          subnetWarning.classList.add('hidden');
          subnetPrefixSelect.disabled = false;
          subnetPrefixSelect.value = (details.prefix + 1).toString();
          renderSubnetTable(details, details.prefix + 1);
        }

        subnetPrefixSelect.addEventListener('change', () => {
          if (!currentDetails) return;
          const value = Number(subnetPrefixSelect.value);
          renderSubnetTable(currentDetails, value);
        });

        function renderSubnetTable(details, targetPrefix) {
          if (!targetPrefix || targetPrefix <= details.prefix) {
            subnetSummary.textContent = _t('tools.cidr-calculator.js.text1', 'Choose a prefix deeper than the analyzed block.');
            subnetBody.innerHTML = '';
            return;
          }

          const limit = 8;
          const rows = [];
          if (details.family === 'IPv4') {
            const increment = Math.pow(2, 32 - targetPrefix);
            const subnetCount = Math.pow(2, targetPrefix - details.prefix);
            for (let i = 0; i < Math.min(subnetCount, limit); i++) {
              const start = details.networkInt + i * increment;
              const end = start + increment - 1;
              const usable = targetPrefix >= 31 ? 'Point-to-point' : formatNumber(Math.max(Math.pow(2, 32 - targetPrefix) - 2, 0)) + ' hosts';
              rows.push('<tr><td class="py-2 pr-4 font-mono font-semibold">' + intToIPv4(start) + '/' + targetPrefix + '</td><td class="py-2 pr-4 font-mono text-xs sm:text-sm">' + intToIPv4(start) + ' – ' + intToIPv4(end) + '</td><td class="py-2 text-xs sm:text-sm">' + usable + '</td></tr>');
            }
            subnetSummary.textContent = 'Total subnets: ' + formatNumber(subnetCount) + ' · Showing first ' + Math.min(subnetCount, limit);
          } else {
            const increment = 1n << BigInt(128 - targetPrefix);
            const subnetCount = 1n << BigInt(targetPrefix - details.prefix);
            for (let i = 0n; i < subnetCount && i < BigInt(limit); i++) {
              const start = details.networkBigInt + increment * i;
              const end = start + increment - 1n;
              rows.push('<tr><td class="py-2 pr-4 font-mono font-semibold">' + bigIntToIPv6(start) + '/' + targetPrefix + '</td><td class="py-2 pr-4 font-mono text-xs sm:text-sm">' + bigIntToIPv6(start) + ' – ' + bigIntToIPv6(end) + '</td><td class="py-2 text-xs sm:text-sm">2^' + (128 - targetPrefix) + '</td></tr>');
            }
            subnetSummary.textContent = _t('tools.cidr-calculator.js.text3', 'Total subnets: 2^') + (targetPrefix - details.prefix) + ' · Showing first ' + rows.length;
          }
          subnetBody.innerHTML = rows.join('');
        }

        hostPlanBtn.addEventListener('click', (event) => {
          event.preventDefault();
          const hosts = Number(hostRequirementInput.value);
          if (!hosts || hosts < 1) {
            hostPlanResult.textContent = _t('tools.cidr-calculator.js.text4', 'Enter how many hosts you need.');
            return;
          }
          const family = document.querySelector('input[name="host-family"]:checked').value;
          if (family === 'ipv4') {
            const prefix = Math.max(0, 32 - Math.ceil(Math.log2(hosts + (hosts > 1 ? 2 : 0))));
            const capacity = Math.pow(2, 32 - prefix);
            const usable = prefix >= 31 ? capacity : capacity - 2;
            hostPlanResult.textContent = _t('tools.cidr-calculator.js.text5', 'Use at least /') + prefix + ' · ' + formatNumber(usable) + ' usable hosts.';
          } else {
            const hostBits = Math.ceil(Math.log2(hosts));
            const prefix = Math.max(0, 128 - hostBits);
            hostPlanResult.textContent = _t('tools.cidr-calculator.js.text6', 'IPv6 /') + prefix + ' offers 2^' + (128 - prefix) + ' addresses. Plenty of room!';
          }
        });

        // ... [Helper functions remain identical to preserve logic] ...
        function calculateIPv4Details(parsed) {
          const ipInt = ipv4ToInt(parsed.address);
          const mask = prefixToMask(parsed.prefix);
          const wildcard = (~mask) >>> 0;
          const networkInt = ipInt & mask;
          const broadcastInt = networkInt | wildcard;
          const hostBits = 32 - parsed.prefix;
          const totalAddresses = Math.pow(2, hostBits);
          const usable = parsed.prefix >= 31 ? totalAddresses : Math.max(totalAddresses - 2, 0);
          const firstHost = parsed.prefix >= 31 ? networkInt : networkInt + 1;
          const lastHost = parsed.prefix >= 31 ? broadcastInt : broadcastInt - 1;
          const classification = classifyIPv4(networkInt);

          return {
            family: 'IPv4',
            prefix: parsed.prefix,
            normalized: intToIPv4(networkInt) + '/' + parsed.prefix,
            network: intToIPv4(networkInt),
            networkInt,
            broadcast: intToIPv4(broadcastInt),
            firstHost: intToIPv4(firstHost),
            lastHost: intToIPv4(lastHost),
            range: intToIPv4(firstHost) + ' – ' + intToIPv4(lastHost),
            netmask: intToIPv4(mask),
            wildcard: intToIPv4(wildcard),
            hostBits,
            networkBits: parsed.prefix,
            totalDisplay: formatNumber(totalAddresses) + ' addresses',
            usableDisplay: parsed.prefix >= 31 ? 'Point-to-point' : formatNumber(usable) + ' usable',
            classification: classification.label,
            special: classification.special,
            ipClass: determineIPv4Class(networkInt),
            expanded: intToIPv4(networkInt),
            binary: toBinaryString(networkInt, 32, 8),
            networkBigInt: null
          };
        }

        function calculateIPv6Details(parsed) {
          const expanded = expandIPv6(parsed.address);
          const ipBigInt = ipv6ToBigInt(expanded);
          const hostBits = 128 - parsed.prefix;
          const mask = prefixToIPv6Mask(parsed.prefix);
          const networkBigInt = ipBigInt & mask;
          const totalPower = hostBits;
          const firstHost = networkBigInt;
          const lastHost = networkBigInt + (hostBits === 0 ? 0n : (1n << BigInt(hostBits)) - 1n);
          const classification = classifyIPv6(networkBigInt);

          return {
            family: 'IPv6',
            prefix: parsed.prefix,
            normalized: bigIntToIPv6(networkBigInt) + '/' + parsed.prefix,
            network: bigIntToIPv6(networkBigInt),
            networkBigInt,
            broadcast: null,
            firstHost: bigIntToIPv6(firstHost),
            lastHost: bigIntToIPv6(lastHost),
            range: bigIntToIPv6(firstHost) + ' – ' + bigIntToIPv6(lastHost),
            netmask: null,
            wildcard: null,
            hostBits,
            networkBits: parsed.prefix,
            totalDisplay: '2^' + totalPower + ' addresses',
            usableDisplay: 'All addresses routable',
            classification: classification.label,
            special: classification.special,
            ipClass: null,
            expanded,
            binary: toBinaryStringBigInt(networkBigInt, 128, 16)
          };
        }

        function isValidIPv4(ip) {
          const octets = ip.split('.');
          if (octets.length !== 4) return false;
          return octets.every(octet => {
            if (octet === '' || /[^0-9]/.test(octet)) return false;
            const value = Number(octet);
            return value >= 0 && value <= 255;
          });
        }

        function normalizeIPv4(ip) {
          return ip.split('.').map(octet => String(Number(octet))).join('.');
        }

        function ipv4ToInt(ip) {
          return ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
        }

        function intToIPv4(intValue) {
          return [24, 16, 8, 0].map(shift => (intValue >>> shift) & 255).join('.');
        }

        function prefixToMask(prefix) {
          if (prefix === 0) return 0;
          return (0xffffffff << (32 - prefix)) >>> 0;
        }

        function maskToPrefix(mask) {
          if (!isValidIPv4(mask)) {
            throw new Error('Invalid dotted-decimal netmask.');
          }
          const binary = ipv4ToInt(mask).toString(2).padStart(32, '0');
          if (!/^1*0*$/.test(binary)) {
            throw new Error('Netmask must contain contiguous 1 bits followed by 0s.');
          }
          const zeroIndex = binary.indexOf('0');
          return zeroIndex === -1 ? 32 : zeroIndex;
        }

        function toBinaryString(value, bits, group) {
          const binary = value.toString(2).padStart(bits, '0');
          return binary.match(new RegExp('.{1,' + group + '}', 'g')).join(' ');
        }

        function toBinaryStringBigInt(value, bits, group) {
          let binary = value.toString(2);
          while (binary.length < bits) {
            binary = '0' + binary;
          }
          const chunks = [];
          for (let i = 0; i < binary.length; i += group) {
            chunks.push(binary.slice(i, i + group));
          }
          return chunks.join(' ');
        }

        function expandIPv6(address) {
          if (address.includes('.')) {
            const lastColon = address.lastIndexOf(':');
            const ipv4Part = address.slice(lastColon + 1);
            if (!isValidIPv4(ipv4Part)) {
              return null;
            }
            const octets = ipv4Part.split('.').map(Number);
            const high = ((octets[0] << 8) | octets[1]).toString(16);
            const low = ((octets[2] << 8) | octets[3]).toString(16);
            address = address.slice(0, lastColon) + ':' + high + ':' + low;
          }

          if (address.includes('::')) {
            const parts = address.split('::');
            if (parts.length > 2) return null;
            const headParts = parts[0] ? parts[0].split(':').filter(Boolean) : [];
            const tailParts = parts[1] ? parts[1].split(':').filter(Boolean) : [];
            const missing = 8 - (headParts.length + tailParts.length);
            if (missing < 0) return null;
            const zeros = new Array(missing).fill('0');
            const full = [...headParts, ...zeros, ...tailParts];
            return full.map(part => (part || '0').padStart(4, '0')).join(':');
          }

          const straightParts = address.split(':');
          if (straightParts.length !== 8) return null;
          return straightParts.map(part => (part || '0').padStart(4, '0')).join(':');
        }

        function compressIPv6(address) {
          const expanded = expandIPv6(address);
          if (!expanded) return address;
          const parts = expanded.split(':');
          let bestStart = -1;
          let bestLength = 0;
          let currentStart = -1;
          let currentLength = 0;
          parts.forEach((part, index) => {
            if (part === '0000') {
              if (currentStart === -1) currentStart = index;
              currentLength += 1;
              if (currentLength > bestLength) {
                bestStart = currentStart;
                bestLength = currentLength;
              }
            } else {
              currentStart = -1;
              currentLength = 0;
            }
          });
          if (bestLength < 2) {
            return parts.map(part => part.replace(/^0+/, '') || '0').join(':');
          }
          const compressed = [];
          let skip = false;
          parts.forEach((part, index) => {
            if (index === bestStart) {
              compressed.push('');
              skip = true;
            }
            if (index >= bestStart && index < bestStart + bestLength) {
              return;
            }
            compressed.push(part.replace(/^0+/, '') || '0');
          });
          if (bestStart + bestLength === parts.length) {
            compressed.push('');
          }
          return compressed.join(':').replace(':::', '::');
        }

        function isValidIPv6(address) {
          return Boolean(expandIPv6(address));
        }

        function ipv6ToBigInt(expanded) {
          return expanded.split(':').reduce((acc, part) => (acc << 16n) + BigInt('0x' + part), 0n);
        }

        function bigIntToIPv6(value) {
          const parts = [];
          for (let i = 0; i < 8; i++) {
            const shift = BigInt(16 * (7 - i));
            const segment = Number((value >> shift) & 0xffffn);
            parts.push(segment.toString(16));
          }
          return compressIPv6(parts.join(':'));
        }

        function prefixToIPv6Mask(prefix) {
          if (prefix === 0) return 0n;
          return (~((1n << BigInt(128 - prefix)) - 1n)) & ((1n << 128n) - 1n);
        }

        function classifyIPv4(networkInt) {
          const ranges = [
            { range: [ipv4ToInt('10.0.0.0'), ipv4ToInt('10.255.255.255')], label: 'Private RFC1918 /8', special: 'Internal addressing' },
            { range: [ipv4ToInt('172.16.0.0'), ipv4ToInt('172.31.255.255')], label: 'Private RFC1918 /12', special: 'Internal addressing' },
            { range: [ipv4ToInt('192.168.0.0'), ipv4ToInt('192.168.255.255')], label: 'Private RFC1918 /16', special: 'Internal addressing' },
            { range: [ipv4ToInt('100.64.0.0'), ipv4ToInt('100.127.255.255')], label: 'Carrier-grade NAT /10', special: 'RFC6598 shared space' },
            { range: [ipv4ToInt('127.0.0.0'), ipv4ToInt('127.255.255.255')], label: 'Loopback', special: 'Host-local only' },
            { range: [ipv4ToInt('169.254.0.0'), ipv4ToInt('169.254.255.255')], label: 'Link-local', special: 'APIPA auto configuration' },
            { range: [ipv4ToInt('192.0.2.0'), ipv4ToInt('192.0.2.255')], label: 'TEST-NET-1', special: 'Documentation only' },
            { range: [ipv4ToInt('198.51.100.0'), ipv4ToInt('198.51.100.255')], label: 'TEST-NET-2', special: 'Documentation only' },
            { range: [ipv4ToInt('203.0.113.0'), ipv4ToInt('203.0.113.255')], label: 'TEST-NET-3', special: 'Documentation only' },
            { range: [ipv4ToInt('224.0.0.0'), ipv4ToInt('239.255.255.255')], label: 'Multicast', special: 'RFC5771 special use' },
            { range: [ipv4ToInt('240.0.0.0'), ipv4ToInt('255.255.255.254')], label: 'Future use', special: 'Reserved / experimental' }
          ];

          for (const entry of ranges) {
            if (networkInt >= entry.range[0] && networkInt <= entry.range[1]) {
              return { label: entry.label, special: entry.special };
            }
          }
          return { label: 'Public routable', special: 'Subject to RIR allocation policies' };
        }

        function classifyIPv6(networkBigInt) {
          const ulaStart = ipv6ToBigInt('fc00:0000:0000:0000:0000:0000:0000:0000');
          const ulaEnd = ipv6ToBigInt('fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
          const llStart = ipv6ToBigInt('fe80:0000:0000:0000:0000:0000:0000:0000');
          const llEnd = ipv6ToBigInt('febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
          const docStart = ipv6ToBigInt('2001:0db8:0000:0000:0000:0000:0000:0000');
          const docEnd = ipv6ToBigInt('2001:0db8:ffff:ffff:ffff:ffff:ffff:ffff');

          if (networkBigInt >= ulaStart && networkBigInt <= ulaEnd) {
            return { label: 'Unique Local (fc00::/7)', special: 'RFC4193 private IPv6 space' };
          }
          if (networkBigInt >= llStart && networkBigInt <= llEnd) {
            return { label: 'Link-local (fe80::/10)', special: 'Single segment only' };
          }
          if (networkBigInt >= docStart && networkBigInt <= docEnd) {
            return { label: 'Documentation (2001:db8::/32)', special: 'Use in docs/examples' };
          }
          return { label: 'Global unicast', special: 'Routable on the public internet' };
        }

        function determineIPv4Class(ipInt) {
          const firstOctet = ipInt >>> 24;
          if (firstOctet <= 127) return 'Class A';
          if (firstOctet <= 191) return 'Class B';
          if (firstOctet <= 223) return 'Class C';
          if (firstOctet <= 239) return 'Class D (Multicast)';
          return 'Class E (Reserved)';
        }

        function formatNumber(value) {
          return Number(value).toLocaleString();
        }

        updatePrefixControls('ipv4');
      })();
    </script>
  `;

  return createPageTemplate({
    title: 'IP Subnet Planner',
    description: 'Inspect IPv4 and IPv6 networks, validate ranges, plan host allocations, and share subnet blueprints without sending data off-device.',
    path: '/cidr-calculator',
    content,
  });
}
