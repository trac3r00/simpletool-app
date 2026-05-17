import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleProtocolHeadersRoutes(request, url) {
  if (url.pathname !== '/protocol-headers' && url.pathname !== '/protocol-headers/') return null;
  if (request.method !== 'GET') return null;
  const lang = resolveRequestLanguage(request, url);
  return respondHTML(renderProtocolHeadersPage(lang));
}

function renderProtocolHeadersPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('protocol-headers', currentLang);
  const title = translation?.name || 'Protocol Header Visualizer';
  const description = translation?.desc || 'Interactive bit-level diagrams for Ethernet, IPv4, IPv6, TCP, UDP, ICMP, and ARP protocol headers.';

  const header = createToolHeader(
    { emoji: '📡' },
    title,
    description,
    [],
    { toolId: 'protocol-headers' }
  );

  const currentTool = TOOLS.find(t => t.id === 'protocol-headers');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      ${header}

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Left Column: Protocol Selector & Controls -->
        <div class="lg:col-span-4 space-y-6">

          <!-- Protocol Selector -->
          <div class="tool-card">
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3" data-i18n="tools.protocol-headers.ui.label0">Select Protocol</label>
            <div class="grid grid-cols-2 gap-2">
              <button class="protocol-tab active px-3 py-2 text-sm font-medium rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border border-primary-200 dark:border-primary-800 transition-colors" data-protocol="ethernet" data-i18n="tools.protocol-headers.ui.button0">Ethernet II</button>
              <button class="protocol-tab px-3 py-2 text-sm font-medium rounded-lg bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 border border-surface-200 dark:border-surface-700 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors" data-protocol="ipv4" data-i18n="tools.protocol-headers.ui.button1">IPv4</button>
              <button class="protocol-tab px-3 py-2 text-sm font-medium rounded-lg bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 border border-surface-200 dark:border-surface-700 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors" data-protocol="ipv6" data-i18n="tools.protocol-headers.ui.button2">IPv6</button>
              <button class="protocol-tab px-3 py-2 text-sm font-medium rounded-lg bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 border border-surface-200 dark:border-surface-700 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors" data-protocol="tcp" data-i18n="tools.protocol-headers.ui.button3">TCP</button>
              <button class="protocol-tab px-3 py-2 text-sm font-medium rounded-lg bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 border border-surface-200 dark:border-surface-700 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors" data-protocol="udp" data-i18n="tools.protocol-headers.ui.button4">UDP</button>
              <button class="protocol-tab px-3 py-2 text-sm font-medium rounded-lg bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 border border-surface-200 dark:border-surface-700 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors" data-protocol="icmp" data-i18n="tools.protocol-headers.ui.button5">ICMP</button>
              <button class="protocol-tab col-span-2 px-3 py-2 text-sm font-medium rounded-lg bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 border border-surface-200 dark:border-surface-700 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors" data-protocol="arp" data-i18n="tools.protocol-headers.ui.button6">ARP (IPv4)</button>
            </div>
          </div>

          <!-- Hex Dump Parser -->
          <div class="tool-card">
            <div class="flex justify-between items-center mb-3">
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300" data-i18n="tools.protocol-headers.ui.label1">Hex Dump Parser</label>
              ${infoHint('Paste a hex dump to parse and visualize the packet structure.', 'Hex dump parser help')}
            </div>
            <textarea id="hex-input" rows="8"
              class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-xs text-surface-900 dark:text-white resize-y"
              placeholder="Paste hex dump here...&#10;e.g.&#10;00 1a 2b 3c 4d 5e 00 50&#10;56 c0 00 08 08 00 45 00&#10;00 3c 1c 46 40 00 40 06&#10;b1 e6 c0 a8 01 0a c0 a8&#10;01 01" data-i18n-placeholder="tools.protocol-headers.ui.placeholder8"
              spellcheck="false"></textarea>
            <div class="flex gap-2 mt-3">
              <button id="parse-hex-btn" class="btn btn-primary flex-1 text-sm" data-i18n="tools.protocol-headers.ui.button7">Parse Hex</button>
              <button id="clear-hex-btn" class="btn btn-ghost text-sm" data-i18n="tools.protocol-headers.ui.button8">Clear</button>
            </div>
            <div id="hex-error" class="mt-3 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg text-sm text-error-700 dark:text-error-200 hidden">
              <span data-i18n="tools.protocol-headers.ui.text0">Invalid hex format</span>
            </div>
          </div>

          <!-- Field Detail Panel -->
          <div class="tool-card">
            <h3 class="text-sm font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
              <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span data-i18n="tools.protocol-headers.ui.heading0">Field Details</span>
            </h3>
            <div id="field-detail" class="space-y-3">
              <p class="text-sm text-surface-500 dark:text-surface-400 italic" data-i18n="tools.protocol-headers.ui.text1">Click on any field in the diagram to see details.</p>
            </div>
          </div>
        </div>

        <!-- Right Column: Bit Diagram -->
        <div class="lg:col-span-8 space-y-6">

          <!-- Protocol Diagram -->
          <div class="tool-card">
            <div class="flex justify-between items-center mb-4">
              <h2 id="diagram-title" class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.protocol-headers.ui.heading14">Ethernet II Header</h2>
              <span id="header-size" class="text-xs font-medium px-2 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400" data-i18n="tools.protocol-headers.ui.desc17">14 bytes</span>
            </div>

            <!-- Bit Labels -->
            <div class="flex text-xs text-surface-500 dark:text-surface-400 mb-1 font-mono">
              <span class="w-[12.5%] text-center">0</span>
              <span class="w-[12.5%] text-center">8</span>
              <span class="w-[12.5%] text-center">16</span>
              <span class="w-[12.5%] text-center">24</span>
              <span class="w-[12.5%] text-center">32</span>
              <span class="w-[12.5%] text-center">40</span>
              <span class="w-[12.5%] text-center">48</span>
              <span class="w-[12.5%] text-center">56</span>
            </div>

            <!-- Bit Lines -->
            <div class="flex h-px bg-surface-300 dark:bg-surface-700 mb-4">
              <div class="w-[12.5%] h-full border-l border-surface-300 dark:border-surface-700"></div>
              <div class="w-[12.5%] h-full border-l border-surface-300 dark:border-surface-700"></div>
              <div class="w-[12.5%] h-full border-l border-surface-300 dark:border-surface-700"></div>
              <div class="w-[12.5%] h-full border-l border-surface-300 dark:border-surface-700"></div>
              <div class="w-[12.5%] h-full border-l border-surface-300 dark:border-surface-700"></div>
              <div class="w-[12.5%] h-full border-l border-surface-300 dark:border-surface-700"></div>
              <div class="w-[12.5%] h-full border-l border-surface-300 dark:border-surface-700"></div>
              <div class="w-[12.5%] h-full border-l border-r border-surface-300 dark:border-surface-700"></div>
            </div>

            <!-- Protocol Diagram Container -->
            <div id="protocol-diagram" class="space-y-1">
              <!-- Diagram rows injected by JavaScript -->
            </div>

            <!-- Offset Labels -->
            <div class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
              <div class="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                <span class="w-3 h-3 rounded bg-primary-100 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700"></span>
                <span data-i18n="tools.protocol-headers.ui.text2">Field boundary</span>
                <span class="w-3 h-3 rounded bg-info-50 dark:bg-info-900/20 border border-info-300 dark:border-info-700 ml-3"></span>
                <span data-i18n="tools.protocol-headers.ui.text3">Bit offset indicator</span>
              </div>
            </div>
          </div>

          <!-- Parsed Hex Output -->
          <div id="parsed-output-section" class="tool-card hidden">
            <h3 class="text-sm font-semibold text-surface-900 dark:text-white mb-3" data-i18n="tools.protocol-headers.ui.heading1">Parsed Packet Data</h3>
            <div id="parsed-output" class="space-y-2">
              <!-- Parsed fields injected here -->
            </div>
          </div>

        </div>
      </div>

      ${createCheatsheet('protocol-headers', 'Protocol Quick Reference', [
        { heading: 'Ethernet II', content: `
          <table>
            <tr><th data-i18n="tools.protocol-headers.ui.th9">Field</th><th data-i18n="tools.protocol-headers.ui.th10">Size</th><th data-i18n="tools.protocol-headers.ui.th11">Description</th></tr>
            <tr><td>Destination MAC</td><td>6 bytes</td><td>Target hardware address</td></tr>
            <tr><td>Source MAC</td><td>6 bytes</td><td>Sender hardware address</td></tr>
            <tr><td>EtherType</td><td>2 bytes</td><td>Protocol type (0x0800=IPv4, 0x86DD=IPv6)</td></tr>
          </table>` },
        { heading: 'IPv4 Header', content: `
          <table>
            <tr><th data-i18n="tools.protocol-headers.ui.th9">Field</th><th data-i18n="tools.protocol-headers.ui.th10">Size</th><th data-i18n="tools.protocol-headers.ui.th11">Description</th></tr>
            <tr><td>Version</td><td>4 bits</td><td>IP version (4)</td></tr>
            <tr><td>IHL</td><td>4 bits</td><td>Header length in 32-bit words</td></tr>
            <tr><td>TOS</td><td>1 byte</td><td>Type of Service / DSCP</td></tr>
            <tr><td>Total Length</td><td>2 bytes</td><td>Total packet size</td></tr>
            <tr><td>TTL</td><td>1 byte</td><td>Time to Live (hop limit)</td></tr>
            <tr><td>Protocol</td><td>1 byte</td><td>Next protocol (6=TCP, 17=UDP)</td></tr>
            <tr><td>Checksum</td><td>2 bytes</td><td>Header checksum</td></tr>
          </table>` },
        { heading: 'TCP Header', content: `
          <table>
            <tr><th data-i18n="tools.protocol-headers.ui.th9">Field</th><th data-i18n="tools.protocol-headers.ui.th10">Size</th><th data-i18n="tools.protocol-headers.ui.th11">Description</th></tr>
            <tr><td>Source Port</td><td>2 bytes</td><td>Sender port number</td></tr>
            <tr><td>Dest Port</td><td>2 bytes</td><td>Receiver port number</td></tr>
            <tr><td>Seq Number</td><td>4 bytes</td><td>Sequence number</td></tr>
            <tr><td>Ack Number</td><td>4 bytes</td><td>Acknowledgment number</td></tr>
            <tr><td>Data Offset</td><td>4 bits</td><td>Header length / 4</td></tr>
            <tr><td>Flags</td><td>9 bits</td><td>NS,CWR,ECE,URG,ACK,PSH,RST,SYN,FIN</td></tr>
            <tr><td>Window</td><td>2 bytes</td><td>Receive window size</td></tr>
          </table>` },
        { heading: 'Common EtherTypes', content: `
          <table>
            <tr><th data-i18n="tools.protocol-headers.ui.th12">Value</th><th data-i18n="tools.protocol-headers.ui.th13">Protocol</th></tr>
            <tr><td><code>0x0800</code></td><td>IPv4</td></tr>
            <tr><td><code>0x0806</code></td><td>ARP</td></tr>
            <tr><td><code>0x86DD</code></td><td>IPv6</td></tr>
            <tr><td><code>0x8100</code></td><td>VLAN (802.1Q)</td></tr>
          </table>` }
      ])}
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'What are Protocol Headers?',
          content: '<p>Protocol headers are structured data that precede the payload in network packets. They contain control information such as source and destination addresses, protocol types, sequence numbers, and checksums. Understanding header structure is essential for network debugging, packet analysis, and protocol implementation.</p><p>Each protocol layer (Ethernet, IP, TCP/UDP) adds its own header, creating a layered encapsulation that enables data to travel across networks.</p>'
        },
        {
          title: 'How to Use This Tool',
          content: '<p>Select a protocol from the tabs to view its header structure. Each colored block represents a field with its size indicated. Click on any field to see detailed information including:</p><ul><li>Field name and description</li><li>Bit/byte offset</li><li>Common values and their meanings</li><li>RFC reference</li></ul><p>Use the hex dump parser to analyze real packet captures by pasting hex output from tools like tcpdump or Wireshark.</p>'
        },
        {
          title: 'Common Use Cases',
          content: '<ul><li><strong>Packet Analysis:</strong> Understand the structure of captured network traffic</li><li><strong>Protocol Learning:</strong> Visual aid for studying network protocols</li><li><strong>Debugging:</strong> Identify malformed headers or incorrect field values</li><li><strong>Development:</strong> Reference when implementing network protocols</li></ul>'
        }
      ], 'protocol-headers', currentLang)}
      ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const scripts = `
    <script>
      // Protocol definitions with field information
      const PROTOCOLS = {
        ethernet: {
          name: 'Ethernet II',
          size: 14,
          fields: [
            { name: 'Destination MAC', bits: 48, offset: 0, desc: 'Target hardware address (6 bytes)', example: '00:1A:2B:3C:4D:5E', color: 'blue' },
            { name: 'Source MAC', bits: 48, offset: 48, desc: 'Source hardware address (6 bytes)', example: '00:50:56:C0:00:08', color: 'green' },
            { name: 'EtherType', bits: 16, offset: 96, desc: 'Protocol type identifier', example: '0x0800 = IPv4, 0x86DD = IPv6', color: 'purple' }
          ]
        },
        ipv4: {
          name: 'IPv4',
          size: 20,
          fields: [
            { name: 'Version', bits: 4, offset: 0, desc: 'IP protocol version (always 4)', example: '4', color: 'blue' },
            { name: 'IHL', bits: 4, offset: 4, desc: 'Internet Header Length (32-bit words)', example: '5 = 20 bytes', color: 'blue' },
            { name: 'TOS', bits: 8, offset: 8, desc: 'Type of Service / DSCP + ECN', example: '0x00 = Default', color: 'cyan' },
            { name: 'Total Length', bits: 16, offset: 16, desc: 'Total packet length in bytes', example: '60', color: 'indigo' },
            { name: 'Identification', bits: 16, offset: 32, desc: 'Unique packet identifier', example: '0x1C46', color: 'violet' },
            { name: 'Flags', bits: 3, offset: 48, desc: 'Reserved, DF (Don\\'t Fragment), MF (More Fragments)', example: '0x2 = DF set', color: 'pink' },
            { name: 'Fragment Offset', bits: 13, offset: 51, desc: 'Position in fragmented stream (x8 bytes)', example: '0', color: 'rose' },
            { name: 'TTL', bits: 8, offset: 64, desc: 'Time To Live (hop counter)', example: '64', color: 'orange' },
            { name: 'Protocol', bits: 8, offset: 72, desc: 'Next layer protocol', example: '6=TCP, 17=UDP, 1=ICMP', color: 'amber' },
            { name: 'Header Checksum', bits: 16, offset: 80, desc: 'Error detection for header', example: '0xB1E6', color: 'yellow' },
            { name: 'Source IP', bits: 32, offset: 96, desc: 'Sender IP address', example: '192.168.1.10', color: 'emerald' },
            { name: 'Destination IP', bits: 32, offset: 128, desc: 'Receiver IP address', example: '192.168.1.1', color: 'teal' }
          ]
        },
        ipv6: {
          name: 'IPv6',
          size: 40,
          fields: [
            { name: 'Version', bits: 4, offset: 0, desc: 'IP protocol version (always 6)', example: '6', color: 'blue' },
            { name: 'Traffic Class', bits: 8, offset: 4, desc: 'DSCP + ECN for QoS', example: '0x00', color: 'cyan' },
            { name: 'Flow Label', bits: 20, offset: 12, desc: 'Flow identifier for QoS', example: '0x00000', color: 'sky' },
            { name: 'Payload Length', bits: 16, offset: 32, desc: 'Payload size in bytes (excludes header)', example: '20', color: 'indigo' },
            { name: 'Next Header', bits: 8, offset: 48, desc: 'Next protocol type', example: '6=TCP, 17=UDP, 58=ICMPv6', color: 'violet' },
            { name: 'Hop Limit', bits: 8, offset: 56, desc: 'Maximum hops (like TTL)', example: '64', color: 'purple' },
            { name: 'Source Address', bits: 128, offset: 64, desc: 'Sender IPv6 address', example: '2001:db8::1', color: 'emerald' },
            { name: 'Destination Address', bits: 128, offset: 192, desc: 'Receiver IPv6 address', example: '2001:db8::2', color: 'teal' }
          ]
        },
        tcp: {
          name: 'TCP',
          size: 20,
          fields: [
            { name: 'Source Port', bits: 16, offset: 0, desc: 'Sender port number', example: '443 = HTTPS', color: 'blue' },
            { name: 'Destination Port', bits: 16, offset: 16, desc: 'Receiver port number', example: '80 = HTTP', color: 'indigo' },
            { name: 'Sequence Number', bits: 32, offset: 32, desc: 'Initial sequence number', example: '0x12345678', color: 'violet' },
            { name: 'Acknowledgment Number', bits: 32, offset: 64, desc: 'Next expected sequence', example: '0x87654321', color: 'purple' },
            { name: 'Data Offset', bits: 4, offset: 96, desc: 'Header length in 32-bit words', example: '5 = 20 bytes', color: 'fuchsia' },
            { name: 'Reserved', bits: 3, offset: 100, desc: 'Reserved for future use (must be 0)', example: '0', color: 'pink' },
            { name: 'Flags (NS)', bits: 1, offset: 103, desc: 'Nonce Sum flag (ECN)', example: '0', color: 'rose' },
            { name: 'Flags (CWR)', bits: 1, offset: 104, desc: 'Congestion Window Reduced', example: '0', color: 'red' },
            { name: 'Flags (ECE)', bits: 1, offset: 105, desc: 'ECN-Echo flag', example: '0', color: 'orange' },
            { name: 'Flags (URG)', bits: 1, offset: 106, desc: 'Urgent pointer valid', example: '0', color: 'amber' },
            { name: 'Flags (ACK)', bits: 1, offset: 107, desc: 'Acknowledgment valid', example: '1', color: 'yellow' },
            { name: 'Flags (PSH)', bits: 1, offset: 108, desc: 'Push data immediately', example: '1', color: 'lime' },
            { name: 'Flags (RST)', bits: 1, offset: 109, desc: 'Reset connection', example: '0', color: 'green' },
            { name: 'Flags (SYN)', bits: 1, offset: 110, desc: 'Synchronize sequence numbers', example: '0', color: 'emerald' },
            { name: 'Flags (FIN)', bits: 1, offset: 111, desc: 'Finish connection', example: '0', color: 'teal' },
            { name: 'Window Size', bits: 16, offset: 112, desc: 'Receive buffer size', example: '65535', color: 'cyan' },
            { name: 'Checksum', bits: 16, offset: 128, desc: 'Error detection', example: '0xABCD', color: 'sky' },
            { name: 'Urgent Pointer', bits: 16, offset: 144, desc: 'Urgent data offset', example: '0', color: 'blue' }
          ]
        },
        udp: {
          name: 'UDP',
          size: 8,
          fields: [
            { name: 'Source Port', bits: 16, offset: 0, desc: 'Sender port number (0 if not used)', example: '53 = DNS', color: 'blue' },
            { name: 'Destination Port', bits: 16, offset: 16, desc: 'Receiver port number', example: '53 = DNS', color: 'indigo' },
            { name: 'Length', bits: 16, offset: 32, desc: 'Header + payload in bytes', example: '33', color: 'violet' },
            { name: 'Checksum', bits: 16, offset: 48, desc: 'Error detection (optional in IPv4)', example: '0x1234', color: 'purple' }
          ]
        },
        icmp: {
          name: 'ICMP',
          size: 8,
          fields: [
            { name: 'Type', bits: 8, offset: 0, desc: 'ICMP message type', example: '8=Echo, 0=Reply, 3=Dest Unreach', color: 'blue' },
            { name: 'Code', bits: 8, offset: 8, desc: 'Subtype for the message', example: '0', color: 'indigo' },
            { name: 'Checksum', bits: 16, offset: 16, desc: 'Error detection', example: '0x5B7A', color: 'violet' },
            { name: 'Rest of Header', bits: 32, offset: 32, desc: 'Content varies by type/code', example: 'ID=0x0001, Seq=0x0001', color: 'purple' }
          ]
        },
        arp: {
          name: 'ARP (IPv4)',
          size: 28,
          fields: [
            { name: 'Hardware Type', bits: 16, offset: 0, desc: 'Link layer protocol', example: '1 = Ethernet', color: 'blue' },
            { name: 'Protocol Type', bits: 16, offset: 16, desc: 'Network layer protocol', example: '0x0800 = IPv4', color: 'indigo' },
            { name: 'Hardware Length', bits: 8, offset: 32, desc: 'MAC address length', example: '6', color: 'violet' },
            { name: 'Protocol Length', bits: 8, offset: 40, desc: 'IP address length', example: '4', color: 'purple' },
            { name: 'Operation', bits: 16, offset: 48, desc: 'Request (1) or Reply (2)', example: '1 = Request', color: 'fuchsia' },
            { name: 'Sender Hardware Addr', bits: 48, offset: 64, desc: 'Sender MAC address', example: '00:1A:2B:3C:4D:5E', color: 'pink' },
            { name: 'Sender Protocol Addr', bits: 32, offset: 112, desc: 'Sender IP address', example: '192.168.1.10', color: 'rose' },
            { name: 'Target Hardware Addr', bits: 48, offset: 144, desc: 'Target MAC address (0 in request)', example: '00:00:00:00:00:00', color: 'red' },
            { name: 'Target Protocol Addr', bits: 32, offset: 192, desc: 'Target IP address', example: '192.168.1.1', color: 'orange' }
          ]
        }
      };

      // Color mapping for Tailwind classes
      const COLOR_MAP = {
        blue: { bg: 'bg-info-100 dark:bg-info-900/30', border: 'border-info-300 dark:border-info-700', text: 'text-info-800 dark:text-info-200' },
        indigo: { bg: 'bg-primary-100 dark:bg-primary-900/30', border: 'border-primary-300 dark:border-primary-700', text: 'text-primary-800 dark:text-primary-200' },
        violet: { bg: 'bg-violet-100 dark:bg-violet-900/30', border: 'border-violet-300 dark:border-violet-700', text: 'text-violet-800 dark:text-violet-200' },
        purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-800 dark:text-purple-200' },
        fuchsia: { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', border: 'border-fuchsia-300 dark:border-fuchsia-700', text: 'text-fuchsia-800 dark:text-fuchsia-200' },
        pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-300 dark:border-pink-700', text: 'text-pink-800 dark:text-pink-200' },
        rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', border: 'border-rose-300 dark:border-rose-700', text: 'text-rose-800 dark:text-rose-200' },
        red: { bg: 'bg-error-100 dark:bg-error-900/30', border: 'border-error-300 dark:border-error-700', text: 'text-error-800 dark:text-error-200' },
        orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-800 dark:text-orange-200' },
        amber: { bg: 'bg-warning-100 dark:bg-warning-900/30', border: 'border-warning-300 dark:border-warning-700', text: 'text-warning-800 dark:text-warning-200' },
        yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-800 dark:text-yellow-200' },
        lime: { bg: 'bg-lime-100 dark:bg-lime-900/30', border: 'border-lime-300 dark:border-lime-700', text: 'text-lime-800 dark:text-lime-200' },
        green: { bg: 'bg-success-100 dark:bg-success-900/30', border: 'border-success-300 dark:border-success-700', text: 'text-success-800 dark:text-success-200' },
        emerald: { bg: 'bg-success-100 dark:bg-success-900/30', border: 'border-success-300 dark:border-success-700', text: 'text-success-800 dark:text-success-200' },
        teal: { bg: 'bg-teal-100 dark:bg-teal-900/30', border: 'border-teal-300 dark:border-teal-700', text: 'text-teal-800 dark:text-teal-200' },
        cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', border: 'border-cyan-300 dark:border-cyan-700', text: 'text-cyan-800 dark:text-cyan-200' },
        sky: { bg: 'bg-sky-100 dark:bg-sky-900/30', border: 'border-sky-300 dark:border-sky-700', text: 'text-sky-800 dark:text-sky-200' }
      };

      let currentProtocol = 'ethernet';
      let selectedField = null;

      function getColorClasses(color) {
        return COLOR_MAP[color] || COLOR_MAP.blue;
      }

      function createBitRow(rowIndex, fieldsInRow) {
        const rowStartBit = rowIndex * 64;
        const rowEndBit = rowStartBit + 64;
        let currentBit = rowStartBit;
        const segments = [];

        for (const field of fieldsInRow) {
          const fieldStart = Math.max(field.offset, rowStartBit);
          const fieldEnd = Math.min(field.offset + field.bits, rowEndBit);
          const bitsInRow = fieldEnd - fieldStart;
          const widthPercent = (bitsInRow / 64) * 100;
          const colors = getColorClasses(field.color);

          segments.push({
            field,
            width: widthPercent,
            startBit: fieldStart,
            endBit: fieldEnd,
            bitsInRow,
            colors
          });
        }

        return segments;
      }

      function renderProtocol(protocolId) {
        const protocol = PROTOCOLS[protocolId];
        const container = document.getElementById('protocol-diagram');
        const titleEl = document.getElementById('diagram-title');
        const sizeEl = document.getElementById('header-size');

        titleEl.textContent = protocol.name + ' Header';
        sizeEl.textContent = protocol.size + ' bytes';

        // Group fields into 64-bit rows
        const rows = [];
        let currentRow = [];
        let currentRowEndBit = 64;

        for (const field of protocol.fields) {
          const fieldEnd = field.offset + field.bits;

          if (field.offset >= currentRowEndBit) {
            if (currentRow.length > 0) {
              rows.push(createBitRow(rows.length, currentRow));
            }
            currentRow = [];
            currentRowEndBit = Math.ceil(field.offset / 64) * 64 + 64;
          }

          currentRow.push(field);
        }

        if (currentRow.length > 0) {
          rows.push(createBitRow(rows.length, currentRow));
        }

        // Render rows
        container.innerHTML = rows.map((row, rowIndex) => {
          const rowStartBit = rowIndex * 64;
          const rowHtml = row.map(segment => {
            const bitsText = segment.bitsInRow >= 8 ? (segment.bitsInRow / 8) + 'B' : segment.bitsInRow + 'b';
            return \`
              <div class="diagram-field \${segment.colors.bg} \${segment.colors.border} \${segment.colors.text} border rounded px-2 py-3 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity flex flex-col justify-center min-h-[60px]"
                   style="width: \${segment.width}%;"
                   data-field-name="\${segment.field.name}"
                   data-offset="\${segment.field.offset}"
                   data-bits="\${segment.field.bits}">
                <span class="truncate">\${segment.field.name}</span>
                <span class="text-[10px] opacity-70">\${bitsText}</span>
              </div>
            \`;
          }).join('');

          const offsetText = 'Offset: ' + (rowStartBit / 8) + ' bytes';
          return \`
            <div class="flex gap-1 mb-1">
              \${rowHtml}
            </div>
            <div class="text-[10px] text-surface-400 mb-2 font-mono">\${offsetText}</div>
          \`;
        }).join('');

        // Add click handlers
        container.querySelectorAll('.diagram-field').forEach(el => {
          el.addEventListener('click', () => {
            const fieldName = el.dataset.fieldName;
            const field = protocol.fields.find(f => f.name === fieldName);
            if (field) {
              showFieldDetail(field);
            }
          });
        });
      }

      function showFieldDetail(field) {
        const detailEl = document.getElementById('field-detail');
        const colors = getColorClasses(field.color);
        const byteOffset = Math.floor(field.offset / 8);
        const byteSize = field.bits / 8;

        detailEl.innerHTML = \`
          <div class="\${colors.bg} \${colors.border} border rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="w-3 h-3 rounded-full \${colors.bg.replace('bg-', 'bg-').replace('/30', '')}"></span>
              <h4 class="font-semibold text-surface-900 dark:text-white">\${field.name}</h4>
            </div>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between">
                <dt class="text-surface-500 dark:text-surface-400">Bit Offset:</dt>
                <dd class="font-mono text-surface-700 dark:text-surface-300">\${field.offset}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-surface-500 dark:text-surface-400">Byte Offset:</dt>
                <dd class="font-mono text-surface-700 dark:text-surface-300">\${byteOffset}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-surface-500 dark:text-surface-400">Size:</dt>
                <dd class="font-mono text-surface-700 dark:text-surface-300">\${field.bits} bits (\${byteSize >= 1 ? byteSize + ' bytes' : field.bits + ' bits'})</dd>
              </div>
            </dl>
            <div class="mt-3 pt-3 border-t \${colors.border}">
              <p class="text-sm text-surface-700 dark:text-surface-300 mb-2">\${field.desc}</p>
              <div class="text-xs text-surface-500 dark:text-surface-400 bg-surface-50 dark:bg-surface-900 p-2 rounded font-mono">
                <span data-i18n="tools.protocol-headers.ui.text4">Example:</span> \${field.example}
              </div>
            </div>
          </div>
        \`;
      }

      function parseHexDump(hexText) {
        // Remove common hex dump formatting
        const cleaned = hexText
          .replace(/0x/g, '')
          .replace(/:/g, ' ')
          .replace(/\\|/g, ' ')
          .replace(/[^0-9a-fA-F\\s]/g, ' ')
          .trim();

        const bytes = cleaned.split(/\\s+/).filter(b => b.length === 2);
        return bytes.map(b => parseInt(b, 16));
      }

      function formatMAC(bytes) {
        return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
      }

      function formatIP(bytes) {
        return bytes.join('.');
      }

      function parseEthernetFrame(bytes) {
        if (bytes.length < 14) return null;

        const destMAC = formatMAC(bytes.slice(0, 6));
        const srcMAC = formatMAC(bytes.slice(6, 12));
        const etherType = (bytes[12] << 8) | bytes[13];
        const etherTypeHex = '0x' + etherType.toString(16).toUpperCase().padStart(4, '0');

        let nextProto = '';
        if (etherType === 0x0800) nextProto = 'IPv4';
        else if (etherType === 0x86DD) nextProto = 'IPv6';
        else if (etherType === 0x0806) nextProto = 'ARP';
        else if (etherType === 0x8100) nextProto = 'VLAN';

        return [
          { label: 'Destination MAC', value: destMAC },
          { label: 'Source MAC', value: srcMAC },
          { label: 'EtherType', value: \`\${etherTypeHex} (\${nextProto || 'Unknown'})\` }
        ];
      }

      function parseIPv4Packet(bytes) {
        if (bytes.length < 20) return null;

        const version = (bytes[0] >> 4) & 0x0F;
        const ihl = bytes[0] & 0x0F;
        const tos = bytes[1];
        const totalLen = (bytes[2] << 8) | bytes[3];
        const id = '0x' + ((bytes[4] << 8) | bytes[5]).toString(16).toUpperCase().padStart(4, '0');
        const ttl = bytes[8];
        const proto = bytes[9];
        const srcIP = formatIP(bytes.slice(12, 16));
        const dstIP = formatIP(bytes.slice(16, 20));

        let protoName = '';
        if (proto === 6) protoName = 'TCP';
        else if (proto === 17) protoName = 'UDP';
        else if (proto === 1) protoName = 'ICMP';
        else if (proto === 58) protoName = 'ICMPv6';

        return [
          { label: 'Version', value: version },
          { label: 'Header Length', value: (ihl * 4) + ' bytes' },
          { label: 'Total Length', value: totalLen + ' bytes' },
          { label: 'Identification', value: id },
          { label: 'TTL', value: ttl },
          { label: 'Protocol', value: \`\${proto} (\${protoName || 'Unknown'})\` },
          { label: 'Source IP', value: srcIP },
          { label: 'Dest IP', value: dstIP }
        ];
      }

      function parseTCP(bytes) {
        if (bytes.length < 20) return null;

        const srcPort = (bytes[0] << 8) | bytes[1];
        const dstPort = (bytes[2] << 8) | bytes[3];
        const seqNum = '0x' + ((bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | bytes[7]).toString(16).toUpperCase().padStart(8, '0');
        const ackNum = '0x' + ((bytes[8] << 24) | (bytes[9] << 16) | (bytes[10] << 8) | bytes[11]).toString(16).toUpperCase().padStart(8, '0');
        const dataOffset = (bytes[12] >> 4) & 0x0F;
        const flags = bytes[13] & 0x3F;
        const window = (bytes[14] << 8) | bytes[15];

        const flagNames = [];
        if (flags & 0x01) flagNames.push('FIN');
        if (flags & 0x02) flagNames.push('SYN');
        if (flags & 0x04) flagNames.push('RST');
        if (flags & 0x08) flagNames.push('PSH');
        if (flags & 0x10) flagNames.push('ACK');
        if (flags & 0x20) flagNames.push('URG');

        return [
          { label: 'Source Port', value: srcPort },
          { label: 'Dest Port', value: dstPort },
          { label: 'Seq Number', value: seqNum },
          { label: 'Ack Number', value: ackNum },
          { label: 'Data Offset', value: (dataOffset * 4) + ' bytes' },
          { label: 'Flags', value: flagNames.join(', ') || 'None' },
          { label: 'Window Size', value: window }
        ];
      }

      function parseUDP(bytes) {
        if (bytes.length < 8) return null;

        const srcPort = (bytes[0] << 8) | bytes[1];
        const dstPort = (bytes[2] << 8) | bytes[3];
        const length = (bytes[4] << 8) | bytes[5];

        return [
          { label: 'Source Port', value: srcPort },
          { label: 'Dest Port', value: dstPort },
          { label: 'Length', value: length + ' bytes' }
        ];
      }

      function parseICMP(bytes) {
        if (bytes.length < 8) return null;

        const type = bytes[0];
        const code = bytes[1];
        const checksum = '0x' + ((bytes[2] << 8) | bytes[3]).toString(16).toUpperCase().padStart(4, '0');

        let typeName = '';
        if (type === 0) typeName = 'Echo Reply';
        else if (type === 8) typeName = 'Echo Request';
        else if (type === 3) typeName = 'Destination Unreachable';
        else if (type === 11) typeName = 'Time Exceeded';

        return [
          { label: 'Type', value: \`\${type} (\${typeName || 'Unknown'})\` },
          { label: 'Code', value: code },
          { label: 'Checksum', value: checksum }
        ];
      }

      function updateParsedOutput(bytes) {
        const outputSection = document.getElementById('parsed-output-section');
        const output = document.getElementById('parsed-output');

        if (!bytes || bytes.length === 0) {
          outputSection.classList.add('hidden');
          return;
        }

        const sections = [];

        // Try Ethernet
        const eth = parseEthernetFrame(bytes);
        if (eth) {
          sections.push({ title: 'Ethernet II', fields: eth });

          const etherType = (bytes[12] << 8) | bytes[13];
          let nextBytes = bytes.slice(14);

          if (etherType === 0x0800 && nextBytes.length >= 20) {
            const ip = parseIPv4Packet(nextBytes);
            if (ip) {
              sections.push({ title: 'IPv4 Header', fields: ip });

              const ihl = (nextBytes[0] & 0x0F) * 4;
              const proto = nextBytes[9];
              const payload = nextBytes.slice(ihl);

              if (proto === 6 && payload.length >= 20) {
                const tcp = parseTCP(payload);
                if (tcp) sections.push({ title: 'TCP Header', fields: tcp });
              } else if (proto === 17 && payload.length >= 8) {
                const udp = parseUDP(payload);
                if (udp) sections.push({ title: 'UDP Header', fields: udp });
              } else if (proto === 1 && payload.length >= 8) {
                const icmp = parseICMP(payload);
                if (icmp) sections.push({ title: 'ICMP Header', fields: icmp });
              }
            }
          }
        }

        output.innerHTML = sections.map(section => \`
          <div class="bg-surface-50 dark:bg-surface-950 rounded-lg p-3">
            <h4 class="text-sm font-semibold text-surface-900 dark:text-white mb-2">\${section.title}</h4>
            <dl class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              \${section.fields.map(f => \`
                <dt class="text-surface-500 dark:text-surface-400">\${f.label}:</dt>
                <dd class="font-mono text-surface-700 dark:text-surface-300 truncate" title="\${f.value}">\${f.value}</dd>
              \`).join('')}
            </dl>
          </div>
        \`).join('');

        outputSection.classList.remove('hidden');
      }

      // Event handlers
      document.querySelectorAll('.protocol-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.protocol-tab').forEach(t => {
            t.classList.remove('active', 'bg-primary-100', 'text-primary-700', 'dark:bg-primary-900/30', 'dark:text-primary-300', 'border-primary-200', 'dark:border-primary-800');
            t.classList.add('bg-surface-100', 'text-surface-600', 'dark:bg-surface-800', 'dark:text-surface-400', 'border-surface-200', 'dark:border-surface-700');
          });
          tab.classList.remove('bg-surface-100', 'text-surface-600', 'dark:bg-surface-800', 'dark:text-surface-400', 'border-surface-200', 'dark:border-surface-700');
          tab.classList.add('active', 'bg-primary-100', 'text-primary-700', 'dark:bg-primary-900/30', 'dark:text-primary-300', 'border-primary-200', 'dark:border-primary-800');

          currentProtocol = tab.dataset.protocol;
          renderProtocol(currentProtocol);
          document.getElementById('field-detail').innerHTML = '<p class="text-sm text-surface-500 dark:text-surface-400 italic" data-i18n="tools.protocol-headers.ui.desc16">Click on any field in the diagram to see details.</p>';
        });
      });

      document.getElementById('parse-hex-btn').addEventListener('click', () => {
        const hexText = document.getElementById('hex-input').value;
        const errorEl = document.getElementById('hex-error');

        if (!hexText.trim()) {
          errorEl.classList.add('hidden');
          document.getElementById('parsed-output-section').classList.add('hidden');
          return;
        }

        try {
          const bytes = parseHexDump(hexText);
          const nonWs = hexText.replace(/\\s+/g, '');
          const looksLikeHex = bytes.length >= 2 && (bytes.length * 2) >= (nonWs.length * 0.3);
          if (bytes.length === 0 || !looksLikeHex) {
            errorEl.classList.remove('hidden');
            return;
          }
          errorEl.classList.add('hidden');
          updateParsedOutput(bytes);
        } catch (e) {
          errorEl.classList.remove('hidden');
        }
      });

      document.getElementById('clear-hex-btn').addEventListener('click', () => {
        document.getElementById('hex-input').value = '';
        document.getElementById('hex-error').classList.add('hidden');
        document.getElementById('parsed-output-section').classList.add('hidden');
      });

      // Initial render
      renderProtocol('ethernet');
    </script>

    <style>
      .protocol-tab.active {
        position: relative;
      }
      .protocol-tab.active::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 2px;
        background: currentColor;
        border-radius: 1px;
      }
      .diagram-field {
        transition: all 0.2s ease;
      }
      .diagram-field:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .dark .diagram-field:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
    </style>
  `;

  return createPageTemplate({
    title,
    description,
    lang: currentLang,
    path: '/protocol-headers',
    content,
    scripts
  });
}
