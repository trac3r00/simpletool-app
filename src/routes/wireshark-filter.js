import { respondHTML } from "../utils/respond.js";
import {
  createPageTemplate,
  createToolHeader,
  createCheatsheet,
} from "../utils/common-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import {
  appendOperator,
  buildBpfClause,
  buildDisplayClause,
  ipv4NetError,
  joinClause,
  validateFilter,
} from "../utils/wireshark-filter-logic.js";
import { createRelatedToolsSection } from "../utils/content-ui.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";

// Bundlers may rename module functions (shellQuote -> shellQuote3) and the
// renamed name is what other injected bodies call, so inject each function
// under its real name and alias it to the name the page script uses.
function inlineFunctions(fns) {
  return Object.entries(fns)
    .map(([name, fn]) => fn.toString() + (fn.name === name ? "" : "\nvar " + name + " = " + fn.name + ";"))
    .join("\n");
}

export async function handleWiresharkFilterRoutes(request, url) {
  if (
    url.pathname !== "/wireshark-filter" &&
    url.pathname !== "/wireshark-filter/"
  )
    return null;
  if (request.method !== "GET") return null;
  const lang = resolveRequestLanguage(request, url);
  return respondHTML(renderWiresharkFilterPage(lang));
}

function renderWiresharkFilterPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("wireshark-filter", currentLang);
  const title = translation?.name || "Wireshark Filter Builder";
  const description =
    translation?.desc ||
    "Build Wireshark display filters and BPF capture expressions visually.";

  const header = createToolHeader({ emoji: "🦈" }, title, description, [], {
    toolId: "wireshark-filter",
  });

  const currentTool = TOOLS.find((t) => t.id === "wireshark-filter");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">
        ${header}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Panel: Filter Builder -->
        <div class="space-y-6">
          <!-- Mode Tabs -->
          <div class="tool-card">
            <div data-i18n-aria="tools.wireshark-filter.ui.r6_0" class="tabs-list mb-4 flex-wrap" role="tablist" aria-label="Filter type">
              <button id="tab-display" type="button" class="tab-trigger tab-btn active" role="tab" aria-selected="true" aria-controls="panel-display" tabindex="0" data-tab="display">
                <span data-i18n="tools.wireshark-filter.ui.th42">Display Filter</span>
              </button>
              <button id="tab-bpf" type="button" class="tab-trigger tab-btn" role="tab" aria-selected="false" aria-controls="panel-bpf" tabindex="-1" data-tab="bpf">
                <span data-i18n="tools.wireshark-filter.ui.r6_1">Capture Filter (BPF)</span>
              </button>
            </div>

            <!-- Display Filter Mode -->
            <div id="panel-display" class="tab-panel" role="tabpanel" aria-labelledby="tab-display">
              <div class="space-y-4">
                <div>
                  <label for="df-protocol" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1" data-i18n="tools.wireshark-filter.ui.label0">Protocol</label>
                  <select id="df-protocol" class="input w-full">
                    <option value="">-- Select Protocol --</option>
                    <option value="ip">IP</option>
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                    <option value="http">HTTP</option>
                    <option value="tls" data-i18n="tools.wireshark-filter.ui.option21">TLS/SSL</option>
                    <option value="dns">DNS</option>
                    <option value="icmp">ICMP</option>
                    <option value="arp">ARP</option>
                    <option value="dhcp">DHCP</option>
                    <option value="ssh">SSH</option>
                    <option value="ftp">FTP</option>
                    <option value="smtp">SMTP</option>
                    <option value="snmp">SNMP</option>
                    <option value="ntp">NTP</option>
                    <option value="bgp">BGP</option>
                    <option value="ospf">OSPF</option>
                  </select>
                </div>

                <div>
                  <label for="df-field" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1" data-i18n="tools.wireshark-filter.ui.label1">Field</label>
                  <select id="df-field" class="input w-full">
                    <option value="" data-i18n="tools.wireshark-filter.ui.option0">-- Select Field --</option>
                  </select>
                </div>

                <div>
                  <label for="df-operator" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1" data-i18n="tools.wireshark-filter.ui.label2">Operator</label>
                  <select id="df-operator" class="input w-full">
                    <option value="==" data-i18n="tools.wireshark-filter.ui.option22">== (equals)</option>
                    <option value="!=" data-i18n="tools.wireshark-filter.ui.option23">!= (not equals)</option>
                    <option value=">">&gt; (greater than)</option>
                    <option value="<">&lt; (less than)</option>
                    <option value=">=">&gt;= (greater or equal)</option>
                    <option value="<=">&lt;= (less or equal)</option>
                    <option value="contains" data-i18n="tools.wireshark-filter.ui.option26">contains</option>
                    <option value="matches" data-i18n="tools.wireshark-filter.ui.option27">matches (regex)</option>
                  </select>
                </div>

                <div>
                  <label for="df-value" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1" data-i18n="tools.wireshark-filter.ui.label3">Value</label>
                  <input data-i18n-placeholder="tools.wireshark-filter.ui.r6_2" type="text" id="df-value" class="input w-full" placeholder="e.g., 80, 192.168.1.1 (empty = field exists)">
                </div>

                <button id="df-add-btn" type="button" class="btn btn-primary w-full">
                  <span data-i18n="tools.wireshark-filter.ui.r6_3">Add to Filter</span>
                </button>

                <div class="border-t border-surface-200 dark:border-surface-700 pt-4">
                  <label class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-2" data-i18n="tools.wireshark-filter.ui.label4">Logical Operators</label>
                  <div class="flex flex-wrap gap-2">
                    <button data-i18n-aria="tools.wireshark-filter.ui.r6_4" type="button" class="logic-btn btn btn-secondary btn-sm" data-op="&&" aria-label="AND (&&)">AND</button>
                    <button type="button" class="logic-btn btn btn-secondary btn-sm" data-op="||" aria-label="OR (||)">OR</button>
                    <button data-i18n-aria="tools.wireshark-filter.ui.r6_5" type="button" class="logic-btn btn btn-secondary btn-sm" data-op="!" aria-label="NOT (!)">NOT</button>
                    <button data-i18n-aria="tools.wireshark-filter.ui.r6_6" type="button" class="logic-btn btn btn-secondary btn-sm" data-op="(" aria-label="Open parenthesis">(</button>
                    <button data-i18n-aria="tools.wireshark-filter.ui.r6_7" type="button" class="logic-btn btn btn-secondary btn-sm" data-op=")" aria-label="Close parenthesis">)</button>
                  </div>
                </div>

                <div class="border-t border-surface-200 dark:border-surface-700 pt-4">
                  <label class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-2" data-i18n="tools.wireshark-filter.ui.label5">Preset Filters</label>
                  <div class="flex flex-wrap gap-2">
                    <button type="button" class="preset-btn btn btn-ghost btn-xs" data-filter="http" data-i18n="tools.wireshark-filter.ui.button0">HTTP Traffic</button>
                    <button type="button" class="preset-btn btn btn-ghost btn-xs" data-filter="dns" data-i18n="tools.wireshark-filter.ui.button1">DNS Queries</button>
                    <button type="button" class="preset-btn btn btn-ghost btn-xs" data-filter="tcp-errors" data-i18n="tools.wireshark-filter.ui.button2">TCP Errors</button>
                    <button type="button" class="preset-btn btn btn-ghost btn-xs" data-filter="retrans" data-i18n="tools.wireshark-filter.ui.button3">Retransmissions</button>
                    <button type="button" class="preset-btn btn btn-ghost btn-xs" data-filter="ssl-handshake" data-i18n="tools.wireshark-filter.ui.button4">SSL Handshake</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- BPF Capture Filter Mode -->
            <div id="panel-bpf" class="tab-panel hidden" role="tabpanel" aria-labelledby="tab-bpf">
              <div class="space-y-4">
                <div>
                  <label for="bpf-primitive" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1" data-i18n="tools.wireshark-filter.ui.label6">Primitive</label>
                  <select id="bpf-primitive" class="input w-full">
                    <option value="host" data-i18n="tools.wireshark-filter.ui.option28">host</option>
                    <option value="net" data-i18n="tools.wireshark-filter.ui.option29">net</option>
                    <option value="port" data-i18n="tools.wireshark-filter.ui.option30">port</option>
                    <option value="portrange" data-i18n="tools.wireshark-filter.ui.option31">portrange</option>
                    <option value="proto" data-i18n="tools.wireshark-filter.ui.option32">proto</option>
                  </select>
                </div>

                <div>
                  <label for="bpf-direction" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1" data-i18n="tools.wireshark-filter.ui.label7">Direction</label>
                  <select id="bpf-direction" class="input w-full">
                    <option value="" data-i18n="tools.wireshark-filter.ui.option33">src or dst (either)</option>
                    <option value="src" data-i18n="tools.wireshark-filter.ui.option34">src (source only)</option>
                    <option value="dst" data-i18n="tools.wireshark-filter.ui.option35">dst (destination only)</option>
                  </select>
                </div>

                <div>
                  <label for="bpf-value" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1" data-i18n="tools.wireshark-filter.ui.label8">Value</label>
                  <input type="text" id="bpf-value" class="input w-full" placeholder="e.g., 192.168.1.1, 80, 1-1024">
                </div>

                <div>
                  <label for="bpf-protocol" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1" data-i18n="tools.wireshark-filter.ui.label9">Protocol</label>
                  <select id="bpf-protocol" class="input w-full">
                    <option value="" data-i18n="tools.wireshark-filter.ui.option36">Any</option>
                    <option value="tcp">tcp</option>
                    <option value="udp" data-i18n="tools.wireshark-filter.ui.option37">udp</option>
                    <option value="icmp" data-i18n="tools.wireshark-filter.ui.option38">icmp</option>
                    <option value="arp" data-i18n="tools.wireshark-filter.ui.option39">arp</option>
                    <option value="ip" data-i18n="tools.wireshark-filter.ui.option40">ip</option>
                    <option value="ip6" data-i18n="tools.wireshark-filter.ui.r3_0">ip6</option>
                  </select>
                </div>

                <button id="bpf-add-btn" type="button" class="btn btn-primary w-full">
                  <span data-i18n="tools.wireshark-filter.ui.r6_8">Add to Filter</span>
                </button>

                <div class="border-t border-surface-200 dark:border-surface-700 pt-4">
                  <label class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-2" data-i18n="tools.wireshark-filter.ui.label10">Logical Operators</label>
                  <div class="flex flex-wrap gap-2">
                    <button type="button" class="bpf-logic-btn btn btn-secondary btn-sm" data-op="and"><span data-i18n="tools.wireshark-filter.ui.button5">and</span></button>
                    <button type="button" class="bpf-logic-btn btn btn-secondary btn-sm" data-op="or"><span data-i18n="tools.wireshark-filter.ui.button6">or</span></button>
                    <button type="button" class="bpf-logic-btn btn btn-secondary btn-sm" data-op="not"><span data-i18n="tools.wireshark-filter.ui.button7">not</span></button>
                    <button data-i18n-aria="tools.wireshark-filter.ui.r6_9" type="button" class="bpf-logic-btn btn btn-secondary btn-sm" data-op="(" aria-label="Open parenthesis">(</button>
                    <button data-i18n-aria="tools.wireshark-filter.ui.r6_10" type="button" class="bpf-logic-btn btn btn-secondary btn-sm" data-op=")" aria-label="Close parenthesis">)</button>
                  </div>
                </div>

                <div class="border-t border-surface-200 dark:border-surface-700 pt-4">
                  <label class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-2" data-i18n="tools.wireshark-filter.ui.label11">Common BPF Filters</label>
                  <div class="flex flex-wrap gap-2">
                    <button type="button" class="bpf-preset-btn btn btn-ghost btn-xs" data-filter="port-80"><span data-i18n="tools.wireshark-filter.ui.button8">port 80</span></button>
                    <button type="button" class="bpf-preset-btn btn btn-ghost btn-xs" data-filter="host-local"><span data-i18n="tools.wireshark-filter.ui.button9">host 127.0.0.1</span></button>
                    <button type="button" class="bpf-preset-btn btn btn-ghost btn-xs" data-filter="tcp-only"><span data-i18n="tools.wireshark-filter.ui.button10">tcp</span></button>
                    <button type="button" class="bpf-preset-btn btn btn-ghost btn-xs" data-filter="no-arp"><span data-i18n="tools.wireshark-filter.ui.button11">not arp</span></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Filter Preview -->
          <div class="tool-card">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.wireshark-filter.ui.heading0">Filter Preview</h2>
              <button id="clear-filter-btn" type="button" class="btn btn-ghost btn-xs">
                <span data-i18n="tools.wireshark-filter.ui.r6_11">Clear</span>
              </button>
            </div>
            <pre id="filter-preview" tabindex="0" aria-label="Filter preview" data-i18n-aria="tools.wireshark-filter.ui.r62_36" class="bg-surface-900 text-surface-50 p-4 rounded-lg text-sm font-mono overflow-x-auto min-h-[80px] whitespace-pre-wrap"></pre>
          </div>
        </div>

        <!-- Right Panel: Generated Filter & Reference -->
        <div class="space-y-6">
          <!-- Generated Filter -->
          <div class="tool-card">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.wireshark-filter.ui.heading1">Generated Filter</h2>
              <button id="copy-filter-btn" type="button" class="btn btn-primary btn-xs">
                <span data-i18n="tools.wireshark-filter.ui.r6_12">Copy</span>
              </button>
            </div>
            <div class="relative">
              <pre id="generated-filter" tabindex="0" aria-label="Generated filter" data-i18n-aria="tools.wireshark-filter.ui.r62_37" aria-live="polite" class="bg-surface-900 text-surface-50 p-4 rounded-lg text-sm font-mono overflow-x-auto min-h-[100px] whitespace-pre-wrap select-all"></pre>
              <div id="validation-badge" class="absolute top-2 right-2 hidden">
                <span id="validation-icon" class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"></span>
              </div>
            </div>
            <div id="validation-message" class="mt-3 text-sm hidden" role="status"></div>
          </div>

          <!-- Protocol Field Reference -->
          <div class="tool-card">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.wireshark-filter.ui.heading2">Protocol Field Reference</h2>
            <div class="space-y-2" id="protocol-reference">
              <details class="group">
                <summary class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-950 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-900">
                  <span class="font-medium text-surface-900 dark:text-white">TCP</span>
                  <span class="text-surface-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div class="mt-2 px-3 pb-3 text-sm text-surface-600 dark:text-surface-300">
                  <table class="w-full">
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">tcp.port</td><td data-i18n="tools.wireshark-filter.ui.r62_0">Source or destination port</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">tcp.srcport</td><td data-i18n="tools.wireshark-filter.ui.r62_1">Source port</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">tcp.dstport</td><td data-i18n="tools.wireshark-filter.ui.r62_2">Destination port</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">tcp.seq</td><td data-i18n="tools.wireshark-filter.ui.r62_3">Sequence number</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">tcp.ack</td><td data-i18n="tools.wireshark-filter.ui.r62_4">Acknowledgment number</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">tcp.flags.syn</td><td data-i18n="tools.wireshark-filter.ui.r62_5">SYN flag</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">tcp.flags.ack</td><td data-i18n="tools.wireshark-filter.ui.r62_6">ACK flag</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">tcp.flags.fin</td><td data-i18n="tools.wireshark-filter.ui.r62_7">FIN flag</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">tcp.flags.rst</td><td data-i18n="tools.wireshark-filter.ui.r62_8">RST flag</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">tcp.window_size</td><td data-i18n="tools.wireshark-filter.ui.r62_9">Window size</td></tr>
                  </table>
                </div>
              </details>
              <details class="group">
                <summary class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-950 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-900">
                  <span class="font-medium text-surface-900 dark:text-white">IP</span>
                  <span class="text-surface-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div class="mt-2 px-3 pb-3 text-sm text-surface-600 dark:text-surface-300">
                  <table class="w-full">
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">ip.addr</td><td data-i18n="tools.wireshark-filter.ui.r62_10">Source or destination IP</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">ip.src</td><td data-i18n="tools.wireshark-filter.ui.r62_11">Source IP address</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">ip.dst</td><td data-i18n="tools.wireshark-filter.ui.r62_12">Destination IP address</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">ip.proto</td><td data-i18n="tools.wireshark-filter.ui.r62_13">Protocol number</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">ip.ttl</td><td data-i18n="tools.wireshark-filter.ui.r62_14">Time to live</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">ip.len</td><td data-i18n="tools.wireshark-filter.ui.r62_15">Total length</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">ip.version</td><td data-i18n="tools.wireshark-filter.ui.r62_16">IP version (4 or 6)</td></tr>
                  </table>
                </div>
              </details>
              <details class="group">
                <summary class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-950 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-900">
                  <span class="font-medium text-surface-900 dark:text-white">HTTP</span>
                  <span class="text-surface-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div class="mt-2 px-3 pb-3 text-sm text-surface-600 dark:text-surface-300">
                  <table class="w-full">
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">http.request</td><td data-i18n="tools.wireshark-filter.ui.r62_17">HTTP request</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">http.response</td><td data-i18n="tools.wireshark-filter.ui.r62_18">HTTP response</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">http.method</td><td data-i18n="tools.wireshark-filter.ui.r62_19">Request method (GET, POST, etc)</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">http.host</td><td data-i18n="tools.wireshark-filter.ui.r62_20">Host header value</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">http.uri</td><td data-i18n="tools.wireshark-filter.ui.r62_21">Request URI</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">http.user_agent</td><td data-i18n="tools.wireshark-filter.ui.r62_22">User-Agent header</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">http.status_code</td><td data-i18n="tools.wireshark-filter.ui.r62_23">Response status code</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">http.content_type</td><td data-i18n="tools.wireshark-filter.ui.r62_24">Content-Type header</td></tr>
                  </table>
                </div>
              </details>
              <details class="group">
                <summary class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-950 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-900">
                  <span class="font-medium text-surface-900 dark:text-white">DNS</span>
                  <span class="text-surface-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div class="mt-2 px-3 pb-3 text-sm text-surface-600 dark:text-surface-300">
                  <table class="w-full">
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">dns.qry.name</td><td data-i18n="tools.wireshark-filter.ui.r62_25">Query name</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">dns.qry.type</td><td data-i18n="tools.wireshark-filter.ui.r62_26">Query type (A, AAAA, MX, etc)</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">dns.resp.name</td><td data-i18n="tools.wireshark-filter.ui.r62_27">Response name</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">dns.resp.addr</td><td data-i18n="tools.wireshark-filter.ui.r62_28">Response address</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">dns.flags.response</td><td data-i18n="tools.wireshark-filter.ui.r62_29">Is response flag</td></tr>
                  </table>
                </div>
              </details>
              <details class="group">
                <summary class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-950 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-900">
                  <span class="font-medium text-surface-900 dark:text-white">UDP</span>
                  <span class="text-surface-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div class="mt-2 px-3 pb-3 text-sm text-surface-600 dark:text-surface-300">
                  <table class="w-full">
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">udp.port</td><td data-i18n="tools.wireshark-filter.ui.r62_0">Source or destination port</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">udp.srcport</td><td data-i18n="tools.wireshark-filter.ui.r62_1">Source port</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">udp.dstport</td><td data-i18n="tools.wireshark-filter.ui.r62_2">Destination port</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">udp.length</td><td data-i18n="tools.wireshark-filter.ui.r62_30">UDP length</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">udp.checksum</td><td data-i18n="tools.wireshark-filter.ui.r62_31">Checksum value</td></tr>
                  </table>
                </div>
              </details>
              <details class="group">
                <summary class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-950 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-900">
                  <span class="font-medium text-surface-900 dark:text-white">TLS/SSL</span>
                  <span class="text-surface-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div class="mt-2 px-3 pb-3 text-sm text-surface-600 dark:text-surface-300">
                  <table class="w-full">
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">tls.handshake.type</td><td data-i18n="tools.wireshark-filter.ui.r62_32">Handshake type</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">tls.record.content_type</td><td data-i18n="tools.wireshark-filter.ui.r62_33">Record content type</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">tls.alert.level</td><td data-i18n="tools.wireshark-filter.ui.r62_34">Alert level</td></tr>
                    <tr><td class="font-mono text-primary-600 dark:text-primary-400">tls.alert.desc</td><td data-i18n="tools.wireshark-filter.ui.r62_35">Alert description</td></tr>
                  </table>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      ${createCheatsheet(
        "wireshark-filter",
        '<span data-i18n="tools.wireshark-filter.ui.r66_c24">Display Filters vs BPF Comparison</span>',
        [
          {
            heading: '<span data-i18n="tools.wireshark-filter.ui.r66_c21">When to Use Each</span>',
            content: `
          <table>
            <tr><th data-i18n="tools.wireshark-filter.ui.th42">Display Filter</th><th data-i18n="tools.wireshark-filter.ui.th43">BPF Capture Filter</th></tr>
            <tr><td data-i18n-html="tools.wireshark-filter.ui.r66_c1">Applied <strong>after</strong> capture</td><td data-i18n-html="tools.wireshark-filter.ui.r66_c2">Applied <strong>during</strong> capture</td></tr>
            <tr><td data-i18n="tools.wireshark-filter.ui.r66_c3">More flexible (deep packet inspection)</td><td data-i18n="tools.wireshark-filter.ui.r66_c4">Faster performance</td></tr>
            <tr><td data-i18n="tools.wireshark-filter.ui.r66_c5">Can filter on any dissected field</td><td data-i18n="tools.wireshark-filter.ui.r66_c6">Limited to link-layer headers</td></tr>
            <tr><td data-i18n="tools.wireshark-filter.ui.r66_c7">Use for: protocol analysis</td><td data-i18n="tools.wireshark-filter.ui.r66_c8">Use for: reducing capture size</td></tr>
          </table>`,
          },
          {
            heading: '<span data-i18n="tools.wireshark-filter.ui.r66_c22">Common Display Filter Examples</span>',
            content: `
          <table>
            <tr><th data-i18n="tools.wireshark-filter.ui.th44">Filter</th><th data-i18n="tools.wireshark-filter.ui.th45">Description</th></tr>
            <tr><td><code>ip.addr == 192.168.1.1</code></td><td data-i18n="tools.wireshark-filter.ui.r66_c9">Traffic to/from IP</td></tr>
            <tr><td><code>tcp.port == 80</code></td><td data-i18n="tools.wireshark-filter.ui.r66_c10">HTTP traffic</td></tr>
            <tr><td><code>http.request</code></td><td data-i18n="tools.wireshark-filter.ui.r66_c11">Only HTTP requests</td></tr>
            <tr><td><code>dns.qry.type == 1</code></td><td data-i18n="tools.wireshark-filter.ui.r66_c12">A record queries</td></tr>
            <tr><td><code>tcp.flags.syn == 1</code></td><td data-i18n="tools.wireshark-filter.ui.r66_c13">TCP SYN packets</td></tr>
            <tr><td><code>frame.len > 1000</code></td><td data-i18n="tools.wireshark-filter.ui.r66_c14">Large frames</td></tr>
          </table>`,
          },
          {
            heading: '<span data-i18n="tools.wireshark-filter.ui.r66_c23">Common BPF Examples</span>',
            content: `
          <table>
            <tr><th data-i18n="tools.wireshark-filter.ui.th44">Filter</th><th data-i18n="tools.wireshark-filter.ui.th45">Description</th></tr>
            <tr><td><code>host 192.168.1.1</code></td><td data-i18n="tools.wireshark-filter.ui.r66_c15">Traffic to/from host</td></tr>
            <tr><td><code>net 10.0.0.0/24</code></td><td data-i18n="tools.wireshark-filter.ui.r66_c16">Network range</td></tr>
            <tr><td><code>port 80</code></td><td data-i18n="tools.wireshark-filter.ui.r66_c17">Port 80 traffic</td></tr>
            <tr><td><code>tcp port 443</code></td><td data-i18n="tools.wireshark-filter.ui.r66_c18">HTTPS only</td></tr>
            <tr><td><code>not port 22</code></td><td data-i18n="tools.wireshark-filter.ui.r66_c19">Exclude SSH</td></tr>
            <tr><td><code>icmp</code></td><td data-i18n="tools.wireshark-filter.ui.r66_c20">Ping traffic only</td></tr>
          </table>`,
          },
        ],
      )}
      ${createRelatedToolsSection(relatedToolsData)}
      </div>
    </main>
  `;

  const scripts = `
    <script type="module">
      // Protocol fields mapping
      const PROTOCOL_FIELDS = {
        'ip': [
          { value: 'ip.addr', label: 'ip.addr - Source or destination IP' },
          { value: 'ip.src', label: 'ip.src - Source IP address' },
          { value: 'ip.dst', label: 'ip.dst - Destination IP address' },
          { value: 'ip.proto', label: 'ip.proto - Protocol number' },
          { value: 'ip.ttl', label: 'ip.ttl - Time to live' },
          { value: 'ip.len', label: 'ip.len - Total length' }
        ],
        'tcp': [
          { value: 'tcp.port', label: 'tcp.port - Source or destination port' },
          { value: 'tcp.srcport', label: 'tcp.srcport - Source port' },
          { value: 'tcp.dstport', label: 'tcp.dstport - Destination port' },
          { value: 'tcp.seq', label: 'tcp.seq - Sequence number' },
          { value: 'tcp.ack', label: 'tcp.ack - Acknowledgment number' },
          { value: 'tcp.flags.syn', label: 'tcp.flags.syn - SYN flag' },
          { value: 'tcp.flags.ack', label: 'tcp.flags.ack - ACK flag' },
          { value: 'tcp.flags.fin', label: 'tcp.flags.fin - FIN flag' },
          { value: 'tcp.flags.rst', label: 'tcp.flags.rst - RST flag' },
          { value: 'tcp.window_size', label: 'tcp.window_size - Window size' }
        ],
        'udp': [
          { value: 'udp.port', label: 'udp.port - Source or destination port' },
          { value: 'udp.srcport', label: 'udp.srcport - Source port' },
          { value: 'udp.dstport', label: 'udp.dstport - Destination port' },
          { value: 'udp.length', label: 'udp.length - UDP length' },
          { value: 'udp.checksum', label: 'udp.checksum - Checksum' }
        ],
        'http': [
          { value: 'http.request', label: 'http.request - HTTP request' },
          { value: 'http.response', label: 'http.response - HTTP response' },
          { value: 'http.method', label: 'http.method - Request method' },
          { value: 'http.host', label: 'http.host - Host header' },
          { value: 'http.uri', label: 'http.uri - Request URI' },
          { value: 'http.user_agent', label: 'http.user_agent - User-Agent' },
          { value: 'http.status_code', label: 'http.status_code - Status code' },
          { value: 'http.content_type', label: 'http.content_type - Content-Type' }
        ],
        'tls': [
          { value: 'tls.handshake.type', label: 'tls.handshake.type - Handshake type' },
          { value: 'tls.record.content_type', label: 'tls.record.content_type - Content type' },
          { value: 'tls.alert.level', label: 'tls.alert.level - Alert level' },
          { value: 'tls.alert.desc', label: 'tls.alert.desc - Alert description' }
        ],
        'dns': [
          { value: 'dns.qry.name', label: 'dns.qry.name - Query name' },
          { value: 'dns.qry.type', label: 'dns.qry.type - Query type' },
          { value: 'dns.resp.name', label: 'dns.resp.name - Response name' },
          { value: 'dns.resp.addr', label: 'dns.resp.addr - Response address' },
          { value: 'dns.flags.response', label: 'dns.flags.response - Is response' }
        ],
        'icmp': [
          { value: 'icmp.type', label: 'icmp.type - ICMP type' },
          { value: 'icmp.code', label: 'icmp.code - ICMP code' }
        ],
        'arp': [
          { value: 'arp.src.proto_ipv4', label: 'arp.src.proto_ipv4 - Sender IP' },
          { value: 'arp.dst.proto_ipv4', label: 'arp.dst.proto_ipv4 - Target IP' },
          { value: 'arp.src.hw_mac', label: 'arp.src.hw_mac - Sender MAC' }
        ],
        'dhcp': [
          { value: 'dhcp.type', label: 'dhcp.type - Message type' },
          { value: 'dhcp.option.dhcp', label: 'dhcp.option.dhcp - DHCP message type' }
        ],
        'ssh': [
          { value: 'ssh.protocol', label: 'ssh.protocol - Protocol version' }
        ],
        'ftp': [
          { value: 'ftp.request.command', label: 'ftp.request.command - FTP command' },
          { value: 'ftp.response.code', label: 'ftp.response.code - Response code' }
        ],
        'smtp': [
          { value: 'smtp.req.command', label: 'smtp.req.command - SMTP command' },
          { value: 'smtp.rsp.code', label: 'smtp.rsp.code - Response code' }
        ],
        'snmp': [
          { value: 'snmp.version', label: 'snmp.version - SNMP version' }
        ],
        'ntp': [
          { value: 'ntp.mode', label: 'ntp.mode - NTP mode' }
        ],
        'bgp': [
          { value: 'bgp.type', label: 'bgp.type - BGP message type' }
        ],
        'ospf': [
          { value: 'ospf.msg_type', label: 'ospf.msg_type - OSPF message type' }
        ]
      };

      const PRESET_FILTERS = {
        'http': 'http',
        'dns': 'dns',
        'tcp-errors': 'tcp.analysis.flags && !tcp.analysis.window_update',
        'retrans': 'tcp.analysis.retransmission',
        'ssl-handshake': 'tls.handshake.type == 1 || tls.handshake.type == 2'
      };

      const BPF_PRESETS = {
        'port-80': 'port 80',
        'host-local': 'host 127.0.0.1',
        'tcp-only': 'tcp',
        'no-arp': 'not arp'
      };

      // Elements
      const tabBtns = document.querySelectorAll('.tab-btn');
      const tabPanels = document.querySelectorAll('.tab-panel');
      const dfProtocol = document.getElementById('df-protocol');
      const dfField = document.getElementById('df-field');
      const dfOperator = document.getElementById('df-operator');
      const dfValue = document.getElementById('df-value');
      const dfAddBtn = document.getElementById('df-add-btn');
      const logicBtns = document.querySelectorAll('.logic-btn');
      const presetBtns = document.querySelectorAll('.preset-btn');
      const bpfPrimitive = document.getElementById('bpf-primitive');
      const bpfDirection = document.getElementById('bpf-direction');
      const bpfValue = document.getElementById('bpf-value');
      const bpfProtocol = document.getElementById('bpf-protocol');
      const bpfAddBtn = document.getElementById('bpf-add-btn');
      const bpfLogicBtns = document.querySelectorAll('.bpf-logic-btn');
      const bpfPresetBtns = document.querySelectorAll('.bpf-preset-btn');
      const filterPreview = document.getElementById('filter-preview');
      const generatedFilter = document.getElementById('generated-filter');
      const clearFilterBtn = document.getElementById('clear-filter-btn');
      const copyFilterBtn = document.getElementById('copy-filter-btn');
      const validationBadge = document.getElementById('validation-badge');
      const validationIcon = document.getElementById('validation-icon');
      const validationMessage = document.getElementById('validation-message');

      ${inlineFunctions({ joinClause, appendOperator, buildDisplayClause, ipv4NetError, buildBpfClause, validateFilter })}

      // Each mode keeps its own expression: a display filter is not a valid
      // capture filter, so switching tabs must not carry one into the other.
      const filters = { display: '', bpf: '' };
      let currentMode = 'display';

      function setFilter(value) {
        filters[currentMode] = value;
        updateFilterDisplay();
      }

      function showBuilderError(message) {
        validationBadge.classList.add('hidden');
        validationMessage.textContent = message;
        validationMessage.className = 'mt-3 text-sm text-error-600 dark:text-error-400';
      }

      function selectTab(btn, focus) {
        currentMode = btn.dataset.tab;
        tabBtns.forEach(b => {
          const on = b === btn;
          b.classList.toggle('active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
          b.tabIndex = on ? 0 : -1;
        });
        tabPanels.forEach(p => p.classList.add('hidden'));
        document.getElementById('panel-' + currentMode).classList.remove('hidden');
        if (focus) btn.focus();
        updateFilterDisplay();
      }

      tabBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => selectTab(btn, false));
        btn.addEventListener('keydown', (e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          e.preventDefault();
          selectTab(tabBtns[(index + 1) % tabBtns.length], true);
        });
      });

      dfProtocol.addEventListener('change', () => {
        const protocol = dfProtocol.value;
        dfField.innerHTML = '<option value="">-- Select Field --</option>';
        if (protocol && PROTOCOL_FIELDS[protocol]) {
          PROTOCOL_FIELDS[protocol].forEach(field => {
            const option = document.createElement('option');
            option.value = field.value;
            option.textContent = field.label;
            dfField.appendChild(option);
          });
          dfField.selectedIndex = 1;
        }
      });

      function addDisplayClause() {
        const result = buildDisplayClause(dfField.value, dfOperator.value, dfValue.value);
        if (result.error) return showBuilderError(result.error);
        setFilter(joinClause(filters.display, result.clause, '&&'));
        dfValue.value = '';
      }
      dfAddBtn.addEventListener('click', addDisplayClause);
      dfValue.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addDisplayClause(); }
      });

      logicBtns.forEach(btn => {
        btn.addEventListener('click', () => setFilter(appendOperator(filters.display, btn.dataset.op)));
      });
      bpfLogicBtns.forEach(btn => {
        btn.addEventListener('click', () => setFilter(appendOperator(filters.bpf, btn.dataset.op)));
      });

      presetBtns.forEach(btn => {
        btn.addEventListener('click', () => setFilter(PRESET_FILTERS[btn.dataset.filter] || ''));
      });
      bpfPresetBtns.forEach(btn => {
        btn.addEventListener('click', () => setFilter(BPF_PRESETS[btn.dataset.filter] || ''));
      });

      function addBpfClause() {
        const result = buildBpfClause(bpfPrimitive.value, bpfDirection.value, bpfValue.value, bpfProtocol.value);
        if (result.error) return showBuilderError(result.error);
        setFilter(joinClause(filters.bpf, result.clause, 'and'));
        bpfValue.value = '';
      }
      bpfAddBtn.addEventListener('click', addBpfClause);
      bpfValue.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addBpfClause(); }
      });

      clearFilterBtn.addEventListener('click', () => setFilter(''));

      copyFilterBtn.addEventListener('click', () => {
        const text = filters[currentMode];
        if (!text) return showBuilderError('Nothing to copy yet: add a clause or pick a preset.');
        navigator.clipboard.writeText(text).then(() => {
          const label = copyFilterBtn.querySelector('span');
          const original = label.textContent;
          label.textContent = _t('common.copied', 'Copied!');
          setTimeout(() => { label.textContent = original; }, 1500);
        }).catch(() => showBuilderError('Copy failed: the browser blocked clipboard access. Select the filter text and copy it manually.'));
      });

      function updateFilterDisplay() {
        const currentFilter = filters[currentMode];
        filterPreview.textContent = currentFilter || '(empty)';
        generatedFilter.textContent = currentFilter || '(empty)';

        if (!currentFilter) {
          validationBadge.classList.add('hidden');
          validationMessage.classList.add('hidden');
          return;
        }

        validationBadge.classList.remove('hidden');
        validationMessage.classList.remove('hidden');
        const issues = validateFilter(currentFilter, currentMode);

        if (issues.length === 0) {
          validationIcon.textContent = _t('tools.wireshark-filter.js.text0', 'Valid');
          validationIcon.className = 'inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-success-100 text-success-800';
          validationMessage.textContent = _t('tools.wireshark-filter.js.text1', 'Filter syntax looks correct.');
          validationMessage.className = 'mt-3 text-sm text-success-600';
        } else {
          validationIcon.textContent = _t('tools.wireshark-filter.js.text2', 'Check');
          validationIcon.className = 'inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-warning-100 text-warning-800';
          validationMessage.textContent = _t('tools.wireshark-filter.js.text3', 'Note: ') + issues.join('; ');
          validationMessage.className = 'mt-3 text-sm text-warning-600';
        }
      }

      updateFilterDisplay();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    lang: currentLang,
    path: "/wireshark-filter",
    content,
    scripts,
  });
}
