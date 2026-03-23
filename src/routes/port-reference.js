import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handlePortReferenceRoutes(request, url) {
  if (url.pathname !== '/port-reference' && url.pathname !== '/port-reference/') return null;
  if (request.method !== 'GET') return null;
  const lang = resolveRequestLanguage(request, url);
  return respondHTML(renderPortReferencePage(lang));
}

function renderPortReferencePage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('port-reference', currentLang);
  const title = translation?.name || 'Port Reference';
  const description = translation?.desc || 'Comprehensive IANA port database with search, filters, and security risk indicators.';

  const header = createToolHeader(
    { emoji: '🌐' },
    title,
    description,
    [
      { text: translation?.ui?.badge23 || 'IANA Official', tooltip: 'Official port assignments from IANA registry.' },
      { text: translation?.ui?.badge24 || 'Security Flags', tooltip: 'Highlights commonly exploited ports with risk indicators.' },
      { text: translation?.ui?.badge25 || 'Client-Side Only', tooltip: 'All data is embedded locally — no network requests.' }
    ],
    { toolId: 'port-reference' }
  );

  const currentTool = TOOLS.find(t => t.id === 'port-reference');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      ${header}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Search and Filters Panel -->
        <div class="space-y-6">
          <div class="tool-card">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.port-reference.ui.heading0">Search Ports</h2>
            
            <!-- Search Input -->
            <div class="mb-4">
              <label for="port-search" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2" data-i18n="tools.port-reference.ui.label0">Search by port number or service name</label>
              <input 
                type="text" 
                id="port-search" 
                class="input w-full" 
                placeholder="e.g., 443, HTTPS, SSH..."
                data-i18n-placeholder="tools.port-reference.ui.placeholder0"
                data-tooltip="Type a port number (e.g., 443) or service name (e.g., HTTPS)" data-i18n-tooltip="tools.port-reference.ui.tip0"
              />
            </div>

            <!-- Protocol Filter -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2" data-i18n="tools.port-reference.ui.label1">Protocol</label>
              <div class="flex flex-wrap gap-2">
                <button type="button" class="protocol-filter btn btn-primary btn-sm active" data-protocol="all" data-i18n="tools.port-reference.ui.button0">All</button>
                <button type="button" class="protocol-filter btn btn-secondary btn-sm" data-protocol="tcp" data-i18n="tools.port-reference.ui.button1">TCP</button>
                <button type="button" class="protocol-filter btn btn-secondary btn-sm" data-protocol="udp" data-i18n="tools.port-reference.ui.button2">UDP</button>
              </div>
            </div>

            <!-- Category Filter -->
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2" data-i18n="tools.port-reference.ui.label2">Port Category</label>
              <div class="flex flex-wrap gap-2">
                <button type="button" class="category-filter btn btn-primary btn-sm active" data-category="all" data-i18n="tools.port-reference.ui.button3">All</button>
                <button type="button" class="category-filter btn btn-secondary btn-sm" data-category="well-known" data-i18n="tools.port-reference.ui.button4">Well-Known (0-1023)</button>
                <button type="button" class="category-filter btn btn-secondary btn-sm" data-category="registered" data-i18n="tools.port-reference.ui.button5">Registered (1024-49151)</button>
                <button type="button" class="category-filter btn btn-secondary btn-sm" data-category="dynamic" data-i18n="tools.port-reference.ui.button6">Dynamic (49152-65535)</button>
              </div>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="tool-card">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.port-reference.ui.heading1">Quick Stats</h2>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-surface-50 dark:bg-surface-950 rounded-lg p-3">
                <p class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.port-reference.ui.desc0">Total Ports</p>
                <p class="text-2xl font-bold text-surface-900 dark:text-white" id="total-ports">0</p>
              </div>
              <div class="bg-surface-50 dark:bg-surface-950 rounded-lg p-3">
                <p class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.port-reference.ui.desc1">Filtered</p>
                <p class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="filtered-count">0</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Results Panel -->
        <div class="space-y-6">
          <div class="tool-card">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.port-reference.ui.heading2">Results</h2>
              <button id="clear-search" class="btn btn-ghost btn-xs" data-i18n="tools.port-reference.ui.button7">Clear</button>
            </div>
            
            <div id="results-container" class="overflow-x-auto">
              <table class="min-w-full text-sm text-left">
                <thead class="text-xs uppercase tracking-widest text-surface-500 border-b border-surface-200 dark:border-surface-700">
                  <tr>
                    <th class="py-2 pr-4 font-normal" data-i18n="tools.port-reference.ui.th0">Port</th>
                    <th class="py-2 pr-4 font-normal" data-i18n="tools.port-reference.ui.th1">Service</th>
                    <th class="py-2 pr-4 font-normal" data-i18n="tools.port-reference.ui.th2">Protocol</th>
                    <th class="py-2 pr-4 font-normal" data-i18n="tools.port-reference.ui.th3">Description</th>
                    <th class="py-2 font-normal" data-i18n="tools.port-reference.ui.th4">Risk</th>
                  </tr>
                </thead>
                <tbody id="results-body" class="divide-y divide-surface-100 dark:divide-surface-800">
                  <tr>
                    <td colspan="5" class="py-8 text-center text-surface-500 dark:text-surface-400" data-i18n="tools.port-reference.ui.text0">
                      Start typing to search for ports...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div id="pagination" class="mt-4 flex justify-between items-center hidden">
              <button id="prev-page" class="btn btn-ghost btn-xs" disabled data-i18n="tools.port-reference.ui.button8">Previous</button>
              <span id="page-info" class="text-sm text-surface-500 dark:text-surface-400" data-i18n="tools.port-reference.ui.desc22">Page 1 of 1</span>
              <button id="next-page" class="btn btn-ghost btn-xs" disabled data-i18n="tools.port-reference.ui.button9">Next</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Top 50 Ports Grid -->
      <div class="mt-8">
        <div class="tool-card">
          <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.port-reference.ui.heading3">Top 50 Most Common Ports</h2>
          <div id="top-ports-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <!-- Filled by JS -->
          </div>
        </div>
      </div>

      ${createCheatsheet('port-reference', 'Port Categories & Security Guide', [
        { heading: 'Port Number Ranges', content: `
          <table>
            <tr><th data-i18n="tools.port-reference.ui.th14">Range</th><th data-i18n="tools.port-reference.ui.th15">Name</th><th data-i18n="tools.port-reference.ui.th12">Description</th></tr>
            <tr><td><code>0-1023</code></td><td>Well-Known</td><td>Reserved for system services (HTTP, SSH, etc.)</td></tr>
            <tr><td><code>1024-49151</code></td><td>Registered</td><td>User-registered ports for applications</td></tr>
            <tr><td><code>49152-65535</code></td><td>Dynamic/Private</td><td>Ephemeral ports for client connections</td></tr>
          </table>` },
        { heading: 'High Risk Ports', content: `
          <table>
            <tr><th data-i18n="tools.port-reference.ui.th10">Port</th><th data-i18n="tools.port-reference.ui.th11">Service</th><th data-i18n="tools.port-reference.ui.th13">Risk</th></tr>
            <tr><td><code>21</code></td><td>FTP</td><td>Unencrypted file transfers</td></tr>
            <tr><td><code>23</code></td><td>Telnet</td><td>Plain text authentication</td></tr>
            <tr><td><code>25</code></td><td>SMTP</td><td>Email spam relay risk</td></tr>
            <tr><td><code>53</code></td><td>DNS</td><td>DDoS amplification attacks</td></tr>
            <tr><td><code>445</code></td><td>SMB</td><td>Ransomware propagation</td></tr>
            <tr><td><code>3389</code></td><td>RDP</td><td>Brute force attacks</td></tr>
          </table>` },
        { heading: 'Security Best Practices', content: `
          <ul>
            <li><strong>Close unused ports:</strong> Reduce attack surface by disabling services you don't need</li>
            <li><strong>Use firewalls:</strong> Implement network-level access controls</li>
            <li><strong>Monitor traffic:</strong> Log connections to sensitive ports (22, 443, 3389)</li>
            <li><strong>Prefer encrypted protocols:</strong> Use SSH (22) instead of Telnet (23), SFTP instead of FTP</li>
            <li><strong>Change defaults:</strong> Consider non-standard ports for SSH/RDP (security through obscurity)</li>
          </ul>` }
      ])}

      ${createRelatedToolsSection(relatedToolsData)}
    </main>

    <script>
      (function() {
        // Comprehensive IANA Port Database
        const PORT_DATABASE = [
          // Well-Known Ports (0-1023)
          { port: 0, service: "Reserved", protocol: "TCP/UDP", description: "Reserved port", risk: "none" },
          { port: 1, service: "TCPMUX", protocol: "TCP/UDP", description: "TCP Port Service Multiplexer", risk: "low" },
          { port: 5, service: "RJE", protocol: "TCP/UDP", description: "Remote Job Entry", risk: "low" },
          { port: 7, service: "Echo", protocol: "TCP/UDP", description: "Echo protocol", risk: "low" },
          { port: 9, service: "Discard", protocol: "TCP/UDP", description: "Discard protocol", risk: "low" },
          { port: 11, service: "SYSTAT", protocol: "TCP/UDP", description: "Active Users", risk: "medium" },
          { port: 13, service: "DAYTIME", protocol: "TCP/UDP", description: "Daytime protocol", risk: "low" },
          { port: 15, service: "NETSTAT", protocol: "TCP", description: "Network status", risk: "medium" },
          { port: 17, service: "QOTD", protocol: "TCP/UDP", description: "Quote of the Day", risk: "low" },
          { port: 19, service: "CHARGEN", protocol: "TCP/UDP", description: "Character Generator", risk: "medium" },
          { port: 20, service: "FTP-DATA", protocol: "TCP", description: "File Transfer [Default Data]", risk: "high" },
          { port: 21, service: "FTP", protocol: "TCP/UDP", description: "File Transfer Protocol [Control]", risk: "high", tags: ["exploit", "unencrypted"] },
          { port: 22, service: "SSH", protocol: "TCP/UDP", description: "Secure Shell (SFTP/SCP)", risk: "medium", tags: ["brute-force"] },
          { port: 23, service: "Telnet", protocol: "TCP", description: "Telnet protocol", risk: "high", tags: ["exploit", "unencrypted", "obsolete"] },
          { port: 25, service: "SMTP", protocol: "TCP", description: "Simple Mail Transfer", risk: "high", tags: ["spam", "relay"] },
          { port: 37, service: "TIME", protocol: "TCP/UDP", description: "Time Protocol", risk: "low" },
          { port: 42, service: "NAMESERVER", protocol: "TCP/UDP", description: "Host Name Server", risk: "medium" },
          { port: 43, service: "WHOIS", protocol: "TCP", description: "Who Is service", risk: "low" },
          { port: 49, service: "TACACS", protocol: "TCP/UDP", description: "Login Host Protocol", risk: "medium" },
          { port: 53, service: "DNS", protocol: "TCP/UDP", description: "Domain Name System", risk: "high", tags: ["amplification", "DDoS"] },
          { port: 67, service: "DHCP/BOOTPS", protocol: "UDP", description: "Bootstrap Protocol Server", risk: "medium" },
          { port: 68, service: "DHCP/BOOTPC", protocol: "UDP", description: "Bootstrap Protocol Client", risk: "low" },
          { port: 69, service: "TFTP", protocol: "UDP", description: "Trivial File Transfer", risk: "high", tags: ["unencrypted", "file-transfer"] },
          { port: 70, service: "GOPHER", protocol: "TCP", description: "Gopher protocol", risk: "low" },
          { port: 79, service: "FINGER", protocol: "TCP", description: "Finger protocol", risk: "high", tags: ["info-leak"] },
          { port: 80, service: "HTTP", protocol: "TCP/UDP", description: "HyperText Transfer Protocol", risk: "medium", tags: ["web", "common"] },
          { port: 88, service: "KERBEROS", protocol: "TCP/UDP", description: "Kerberos authentication", risk: "medium" },
          { port: 102, service: "ISO-TSAP", protocol: "TCP", description: "ISO Transport Service Access Point", risk: "low" },
          { port: 110, service: "POP3", protocol: "TCP", description: "Post Office Protocol v3", risk: "medium", tags: ["email", "unencrypted"] },
          { port: 111, service: "RPCBIND", protocol: "TCP/UDP", description: "SUN Remote Procedure Call", risk: "high", tags: ["exploit", "information-disclosure"] },
          { port: 113, service: "IDENT", protocol: "TCP", description: "Authentication Service", risk: "low" },
          { port: 115, service: "SFTP", protocol: "TCP", description: "Simple File Transfer Protocol", risk: "medium" },
          { port: 117, service: "UUCP-PATH", protocol: "TCP", description: "UUCP Path Service", risk: "low" },
          { port: 119, service: "NNTP", protocol: "TCP", description: "Network News Transfer Protocol", risk: "low" },
          { port: 123, service: "NTP", protocol: "UDP", description: "Network Time Protocol", risk: "medium", tags: ["amplification"] },
          { port: 135, service: "MSRPC", protocol: "TCP/UDP", description: "Microsoft RPC Endpoint Mapper", risk: "high", tags: ["exploit", "windows"] },
          { port: 137, service: "NETBIOS-NS", protocol: "TCP/UDP", description: "NetBIOS Name Service", risk: "high", tags: ["info-leak", "windows"] },
          { port: 138, service: "NETBIOS-DGM", protocol: "TCP/UDP", description: "NetBIOS Datagram Service", risk: "medium", tags: ["windows"] },
          { port: 139, service: "NETBIOS-SSN", protocol: "TCP/UDP", description: "NetBIOS Session Service", risk: "high", tags: ["exploit", "windows"] },
          { port: 143, service: "IMAP", protocol: "TCP/UDP", description: "Internet Message Access Protocol", risk: "medium", tags: ["email", "unencrypted"] },
          { port: 161, service: "SNMP", protocol: "UDP", description: "Simple Network Management Protocol", risk: "high", tags: ["info-leak", "default-creds"] },
          { port: 162, service: "SNMPTRAP", protocol: "TCP/UDP", description: "SNMP Trap", risk: "medium" },
          { port: 177, service: "XDMCP", protocol: "TCP/UDP", description: "X Display Manager Control Protocol", risk: "high" },
          { port: 179, service: "BGP", protocol: "TCP", description: "Border Gateway Protocol", risk: "medium", tags: ["routing"] },
          { port: 194, service: "IRC", protocol: "TCP", description: "Internet Relay Chat", risk: "medium", tags: ["chat"] },
          { port: 201, service: "APPLETALK", protocol: "TCP/UDP", description: "AppleTalk Routing", risk: "low" },
          { port: 264, service: "BGMP", protocol: "TCP/UDP", description: "Border Gateway Multicast Protocol", risk: "low" },
          { port: 318, service: "TSP", protocol: "TCP/UDP", description: "Time Stamp Protocol", risk: "low" },
          { port: 381, service: "HP-CPM", protocol: "TCP/UDP", description: "HP Performance Data Collector", risk: "low" },
          { port: 383, service: "HP-ALARM", protocol: "TCP/UDP", description: "HP Performance Data Alarm Manager", risk: "low" },
          { port: 389, service: "LDAP", protocol: "TCP/UDP", description: "Lightweight Directory Access Protocol", risk: "medium", tags: ["directory", "authentication"] },
          { port: 443, service: "HTTPS", protocol: "TCP/UDP", description: "HTTP Secure (TLS/SSL)", risk: "low", tags: ["web", "secure", "common"] },
          { port: 445, service: "SMB", protocol: "TCP", description: "Microsoft SMB over TCP", risk: "high", tags: ["ransomware", "exploit", "windows"] },
          { port: 464, service: "KERBEROS-ADM", protocol: "TCP/UDP", description: "Kerberos Admin", risk: "medium" },
          { port: 465, service: "SMTPS", protocol: "TCP", description: "SMTP over SSL (deprecated)", risk: "medium", tags: ["email", "secure"] },
          { port: 500, service: "ISAKMP", protocol: "UDP", description: "Internet Security Association and Key Management", risk: "medium", tags: ["VPN", "IPSec"] },
          { port: 514, service: "SYSLOG", protocol: "UDP", description: "Unix System Logging", risk: "low", tags: ["logging"] },
          { port: 515, service: "PRINTER", protocol: "TCP", description: "Line Printer Daemon", risk: "medium", tags: ["printing"] },
          { port: 520, service: "RIP", protocol: "UDP", description: "Routing Information Protocol", risk: "medium", tags: ["routing"] },
          { port: 530, service: "RPC", protocol: "TCP/UDP", description: "Remote Procedure Call", risk: "high" },
          { port: 543, service: "KLOGIN", protocol: "TCP", description: "Kerberos Login", risk: "medium" },
          { port: 544, service: "KSHELL", protocol: "TCP", description: "Kerberos Remote Shell", risk: "medium" },
          { port: 546, service: "DHCPV6-CLIENT", protocol: "TCP/UDP", description: "DHCPv6 Client", risk: "low" },
          { port: 547, service: "DHCPV6-SERVER", protocol: "TCP/UDP", description: "DHCPv6 Server", risk: "low" },
          { port: 548, service: "AFP", protocol: "TCP", description: "Apple Filing Protocol", risk: "low", tags: ["apple"] },
          { port: 554, service: "RTSP", protocol: "TCP/UDP", description: "Real Time Streaming Protocol", risk: "medium", tags: ["streaming", "video"] },
          { port: 560, service: "Rmonitor", protocol: "UDP", description: "Remote Monitor", risk: "low" },
          { port: 563, service: "NNTPS", protocol: "TCP/UDP", description: "NNTP over SSL", risk: "low" },
          { port: 587, service: "SMTP-Submission", protocol: "TCP", description: "Mail Submission Agent", risk: "medium", tags: ["email", "submission"] },
          { port: 591, service: "FILEMAKER", protocol: "TCP/UDP", description: "FileMaker Web Sharing", risk: "low" },
          { port: 593, service: "HTTP-RPC", protocol: "TCP/UDP", description: "HTTP RPC Ep Map", risk: "medium" },
          { port: 636, service: "LDAPS", protocol: "TCP/UDP", description: "LDAP over SSL", risk: "low", tags: ["directory", "secure"] },
          { port: 660, service: "MAC-SRV-ADMIN", protocol: "TCP/UDP", description: "MacOS Server Admin", risk: "low" },
          { port: 674, service: "ACAP", protocol: "TCP", description: "Application Configuration Access Protocol", risk: "low" },
          { port: 691, service: "RESERVATION", protocol: "TCP/UDP", description: "Microsoft Exchange Routing", risk: "low" },
          { port: 749, service: "KERBEROS-AD", protocol: "TCP/UDP", description: "Kerberos Admin Server", risk: "medium" },
          { port: 750, service: "KERBEROS-IV", protocol: "TCP/UDP", description: "Kerberos version IV", risk: "medium" },
          { port: 873, service: "RSYNC", protocol: "TCP", description: "rsync file synchronization", risk: "medium", tags: ["file-transfer"] },
          { port: 902, service: "VMWARE-SERVER", protocol: "TCP", description: "VMware Server Console", risk: "medium" },
          { port: 903, service: "VMWARE-CONSOLE", protocol: "TCP", description: "VMware Remote Console", risk: "medium" },
          { port: 992, service: "TELNETS", protocol: "TCP", description: "Telnet over SSL", risk: "medium" },
          { port: 993, service: "IMAPS", protocol: "TCP", description: "IMAP over SSL", risk: "low", tags: ["email", "secure"] },
          { port: 995, service: "POP3S", protocol: "TCP", description: "POP3 over SSL", risk: "low", tags: ["email", "secure"] },
          
          // Registered Ports (1024-49151) - Most Common
          { port: 1080, service: "SOCKS", protocol: "TCP/UDP", description: "SOCKS Proxy", risk: "medium", tags: ["proxy"] },
          { port: 1194, service: "OPENVPN", protocol: "TCP/UDP", description: "OpenVPN", risk: "low", tags: ["VPN", "secure"] },
          { port: 1214, service: "KAZAA", protocol: "TCP/UDP", description: "Kazaa P2P", risk: "medium" },
          { port: 1241, service: "NESSUS", protocol: "TCP", description: "Nessus Security Scanner", risk: "low", tags: ["security"] },
          { port: 1311, service: "RXMON", protocol: "TCP", description: "Dell OpenManage", risk: "low" },
          { port: 1337, service: "WASTE", protocol: "TCP", description: "WASTE P2P", risk: "medium" },
          { port: 1433, service: "MS-SQL", protocol: "TCP/UDP", description: "Microsoft SQL Server", risk: "high", tags: ["database", "exploit", "brute-force"] },
          { port: 1434, service: "MS-SQL-MON", protocol: "TCP/UDP", description: "Microsoft SQL Monitor", risk: "high" },
          { port: 1512, service: "WINS", protocol: "TCP/UDP", description: "Microsoft Windows Internet Name Service", risk: "medium" },
          { port: 1521, service: "ORACLE", protocol: "TCP", description: "Oracle database default listener", risk: "high", tags: ["database", "exploit"] },
          { port: 1589, service: "CISCO-VQP", protocol: "TCP/UDP", description: "Cisco VLAN Query Protocol", risk: "low" },
          { port: 1701, service: "L2TP", protocol: "UDP", description: "Layer 2 Tunneling Protocol", risk: "low", tags: ["VPN"] },
          { port: 1723, service: "PPTP", protocol: "TCP", description: "Point-to-Point Tunneling Protocol", risk: "high", tags: ["VPN", "insecure"] },
          { port: 1755, service: "MMS", protocol: "TCP/UDP", description: "Microsoft Media Services", risk: "low", tags: ["streaming"] },
          { port: 1812, service: "RADIUS", protocol: "UDP", description: "RADIUS Authentication", risk: "medium", tags: ["authentication"] },
          { port: 1813, service: "RADIUS-ACCT", protocol: "UDP", description: "RADIUS Accounting", risk: "medium" },
          { port: 1863, service: "MSN", protocol: "TCP/UDP", description: "MSN Messenger", risk: "low" },
          { port: 1900, service: "UPNP", protocol: "UDP", description: "Universal Plug and Play", risk: "high", tags: ["exploit", "amplification"] },
          { port: 1984, service: "BB", protocol: "TCP/UDP", description: "Big Brother Monitoring", risk: "low" },
          { port: 2000, service: "CISCO-SCCP", protocol: "TCP", description: "Cisco SCCP (Skinny)", risk: "low" },
          { port: 2049, service: "NFS", protocol: "TCP/UDP", description: "Network File System", risk: "high", tags: ["file-share", "exploit"] },
          { port: 2101, service: "RTCM", protocol: "TCP/UDP", description: "RTCM SC-104", risk: "low" },
          { port: 2103, service: "ZEPHYR-CLT", protocol: "TCP/UDP", description: "Zephyr Notification", risk: "low" },
          { port: 2105, service: "ZEPHYR-HM", protocol: "TCP/UDP", description: "Zephyr Notification HM", risk: "low" },
          { port: 2107, service: "MSXRPC", protocol: "TCP", description: "Microsoft Message Queue", risk: "low" },
          { port: 2121, service: "CCPROXY", protocol: "TCP", description: "CCProxy FTP", risk: "medium" },
          { port: 2179, service: "VMRDP", protocol: "TCP/UDP", description: "Microsoft RDP for VMs", risk: "medium" },
          { port: 2195, service: "APPLE-PUSH", protocol: "TCP", description: "Apple Push Notification Service", risk: "low" },
          { port: 2200, service: "TUXHTTP", protocol: "TCP", description: "TUX HTTP Server", risk: "low" },
          { port: 2218, service: "DPAP", protocol: "TCP", description: "Digital Photo Access Protocol", risk: "low" },
          { port: 2222, service: "DIRECTADMIN", protocol: "TCP", description: "DirectAdmin Web Panel", risk: "medium" },
          { port: 2302, service: "HALFLIFE", protocol: "UDP", description: "Half-Life Server", risk: "low", tags: ["gaming"] },
          { port: 2323, service: "3D-NFS", protocol: "TCP", description: "3d-nfsd", risk: "low" },
          { port: 2368, service: "GHOST", protocol: "TCP", description: "Ghost Blogging Platform", risk: "low" },
          { port: 2375, service: "DOCKER", protocol: "TCP", description: "Docker REST API (unencrypted)", risk: "high", tags: ["exploit", "unencrypted"] },
          { port: 2376, service: "DOCKER-SSL", protocol: "TCP", description: "Docker REST API (SSL)", risk: "medium", tags: ["secure"] },
          { port: 2382, service: "MS-OLAP", protocol: "TCP/UDP", description: "MS OLAP", risk: "low" },
          { port: 2383, service: "MS-OLAP3", protocol: "TCP/UDP", description: "MS OLAP / SQL Server", risk: "low" },
          { port: 2401, service: "CVS", protocol: "TCP/UDP", description: "CVS Version Control", risk: "low", tags: ["version-control"] },
          { port: 2404, service: "IEC-104", protocol: "TCP", description: "IEC 60870-5-104", risk: "medium" },
          { port: 2430, service: "VENUS", protocol: "TCP/UDP", description: "Venus", risk: "low" },
          { port: 2431, service: "VENUS-SE", protocol: "TCP/UDP", description: "Venus Service", risk: "low" },
          { port: 2483, service: "ORACLE-DB", protocol: "TCP/UDP", description: "Oracle Database", risk: "high", tags: ["database"] },
          { port: 2484, service: "ORACLE-DB-SSL", protocol: "TCP/UDP", description: "Oracle Database SSL", risk: "medium", tags: ["secure", "database"] },
          { port: 2525, service: "SMTP-ALT", protocol: "TCP", description: "SMTP Alternate", risk: "medium" },
          { port: 2555, service: "COMPAQ-WWW", protocol: "TCP", description: "Compaq Web", risk: "low" },
          { port: 2583, service: "MON", protocol: "TCP/UDP", description: "Mon", risk: "low" },
          { port: 2589, service: "FJMPSS", protocol: "TCP/UDP", description: "Fujitsu AP", risk: "low" },
          { port: 2593, service: "NIP", protocol: "TCP/UDP", description: "NEI Services", risk: "low" },
          { port: 2601, service: "ZEBRA", protocol: "TCP", description: "Zebra routing", risk: "low", tags: ["routing"] },
          { port: 2604, service: "OSPFD", protocol: "TCP", description: "OSPF Daemon", risk: "low", tags: ["routing"] },
          { port: 2605, service: "BGPD", protocol: "TCP", description: "BGP Daemon", risk: "low", tags: ["routing"] },
          { port: 2638, service: "SYBASE", protocol: "TCP/UDP", description: "Sybase Database", risk: "medium", tags: ["database"] },
          { port: 2717, service: "PN-REQUESTER", protocol: "TCP/UDP", description: "PN Requester", risk: "low" },
          { port: 2766, service: "LISTEN", protocol: "TCP", description: "System Monitor", risk: "low" },
          { port: 2784, service: "WWW-LEX", protocol: "TCP/UDP", description: "WWW Lexico", risk: "low" },
          { port: 2809, service: "CORBALOC", protocol: "TCP/UDP", description: "Corbaloc", risk: "low" },
          { port: 2811, service: "GSIFTP", protocol: "TCP", description: "Globus GridFTP", risk: "low" },
          { port: 2869, service: "ICSLAP", protocol: "TCP", description: "ICSLAP", risk: "low" },
          { port: 2947, service: "GPSD", protocol: "TCP", description: "GPS Daemon", risk: "low" },
          { port: 3000, service: "DEV", protocol: "TCP", description: "Development/Various (React, Grafana, etc)", risk: "medium", tags: ["development"] },
          { port: 3001, service: "NESSUS-XML", protocol: "TCP", description: "Nessus XML RPC", risk: "low" },
          { port: 3031, service: "EPPC", protocol: "TCP", description: "Apple EPPC", risk: "low", tags: ["apple"] },
          { port: 3050, service: "FIREBIRD", protocol: "TCP/UDP", description: "Firebird Database", risk: "low", tags: ["database"] },
          { port: 3052, service: "APC-POWER", protocol: "TCP/UDP", description: "APC PowerChute", risk: "low" },
          { port: 3124, service: "SCSI-ST", protocol: "TCP/UDP", description: "SCSI on ST", risk: "low" },
          { port: 3127, service: "CMD-PORT", protocol: "TCP", description: "Command Port", risk: "medium" },
          { port: 3128, service: "SQUID", protocol: "TCP", description: "Squid HTTP Proxy", risk: "medium", tags: ["proxy"] },
          { port: 3130, service: "ICPV2", protocol: "UDP", description: "ICPv2", risk: "low" },
          { port: 3141, service: "VMODEM", protocol: "TCP", description: "VMODEM", risk: "low" },
          { port: 3260, service: "ISCSI", protocol: "TCP", description: "iSCSI Target", risk: "medium", tags: ["storage"] },
          { port: 3268, service: "MS-GC", protocol: "TCP", description: "Microsoft Global Catalog", risk: "low" },
          { port: 3269, service: "MS-GC-SSL", protocol: "TCP", description: "MS Global Catalog SSL", risk: "low", tags: ["secure"] },
          { port: 3300, service: "DEBIAN", protocol: "TCP", description: "Debian GIS", risk: "low" },
          { port: 3305, service: "ODETTE-FTP", protocol: "TCP", description: "Odette FTP", risk: "low" },
          { port: 3306, service: "MYSQL", protocol: "TCP/UDP", description: "MySQL Database", risk: "high", tags: ["database", "exploit", "brute-force"] },
          { port: 3323, service: "DE-NA-CDN", protocol: "TCP/UDP", description: "DE-NA CDN", risk: "low" },
          { port: 3324, service: "DE-NA-SYS", protocol: "TCP/UDP", description: "DE-NA System", risk: "low" },
          { port: 3351, service: "DBSERVER", protocol: "TCP/UDP", description: "Database Server", risk: "medium", tags: ["database"] },
          { port: 3389, service: "RDP", protocol: "TCP/UDP", description: "Remote Desktop Protocol", risk: "high", tags: ["exploit", "brute-force", "windows"] },
          { port: 3390, service: "RDP-ALT", protocol: "TCP/UDP", description: "RDP Alternate", risk: "high" },
          { port: 3460, service: "ENVIRON", protocol: "TCP/UDP", description: "Environmental Monitor", risk: "low" },
          { port: 3478, service: "STUN", protocol: "UDP", description: "STUN NAT Traversal", risk: "low", tags: ["webrtc"] },
          { port: 3483, service: "SLIM-DEVICES", protocol: "TCP/UDP", description: "Slim Devices", risk: "low" },
          { port: 3517, service: "802-11-IAPP", protocol: "TCP/UDP", description: "IEEE 802.11 IAPP", risk: "low" },
          { port: 3518, service: "APPWORXSRV", protocol: "TCP/UDP", description: "AppWorx Server", risk: "low" },
          { port: 3527, service: "MBLAP", protocol: "TCP/UDP", description: "Mblap", risk: "low" },
          { port: 3535, service: "MS-LA", protocol: "TCP", description: "MS Label Service", risk: "low" },
          { port: 3544, service: "TEREDO", protocol: "UDP", description: "Teredo tunneling", risk: "low" },
          { port: 3551, service: "APCUPSD", protocol: "TCP/UDP", description: "Apcupsd Service", risk: "low" },
          { port: 3580, service: "GSI", protocol: "TCP", description: "Globus Service", risk: "low" },
          { port: 3606, service: "SPLUNK", protocol: "TCP", description: "Splunk Web Interface", risk: "low", tags: ["monitoring"] },
          { port: 3632, service: "DISTCC", protocol: "TCP", description: "Distributed Compiler", risk: "medium" },
          { port: 3689, service: "DAAP", protocol: "TCP", description: "Digital Audio Access Protocol", risk: "low", tags: ["apple", "audio"] },
          { port: 3690, service: "SVN", protocol: "TCP", description: "Subversion Version Control", risk: "low", tags: ["version-control"] },
          { port: 3703, service: "ADOBESERVER-3", protocol: "TCP/UDP", description: "Adobe Server 3", risk: "low" },
          { port: 3724, service: "WOW", protocol: "TCP", description: "World of Warcraft", risk: "low", tags: ["gaming"] },
          { port: 3784, service: "BFTP", protocol: "UDP", description: "BFD Control", risk: "low" },
          { port: 3809, service: "QBFSPRO", protocol: "TCP/UDP", description: "Qb DB Dynamic Port", risk: "low" },
          { port: 3868, service: "DIAMETER", protocol: "TCP/UDP", description: "Diameter AAA Protocol", risk: "low", tags: ["authentication"] },
          { port: 3872, service: "OAS-MPM", protocol: "TCP", description: "Oracle OAS", risk: "low" },
          { port: 3899, service: "DCASS", protocol: "TCP/UDP", description: "DCA Service", risk: "low" },
          { port: 3900, service: "UDT-OS", protocol: "TCP/UDP", description: "Unidata UDT OS", risk: "low" },
          { port: 3945, service: "EMCADS", protocol: "TCP/UDP", description: "EMC ADS", risk: "low" },
          { port: 3971, service: "LANZ", protocol: "TCP/UDP", description: "Lanz Streaming", risk: "low" },
          { port: 3999, service: "NVCNET", protocol: "TCP/UDP", description: "Norman Visa", risk: "low" },
          { port: 4000, service: "RX", protocol: "TCP/UDP", description: "Open Solutions", risk: "low" },
          { port: 4001, service: "NEO4J", protocol: "TCP", description: "Neo4j Database", risk: "low", tags: ["database"] },
          { port: 4045, service: "NLOCKMGR", protocol: "TCP/UDP", description: "NFS Lock Daemon", risk: "medium" },
          { port: 4069, service: "MRTG", protocol: "TCP", description: "MRTG Monitoring", risk: "low" },
          { port: 4070, service: "TOLSERV", protocol: "TCP/UDP", description: "Tolerance Server", risk: "low" },
          { port: 4071, service: "MOSAIXCC", protocol: "TCP/UDP", description: "Mosaix", risk: "low" },
          { port: 4089, service: "OPENCORE", protocol: "TCP/UDP", description: "OpenCORE Remote", risk: "low" },
          { port: 4096, service: "BRE", protocol: "TCP/UDP", description: "BRE Bridge", risk: "low" },
          { port: 4100, service: "IGSERVER", protocol: "TCP/UDP", description: "IG Server", risk: "low" },
          { port: 4111, service: "XGRID", protocol: "TCP", description: "Xgrid", risk: "low" },
          { port: 4125, service: "HYDRA", protocol: "TCP", description: "Microsoft Operations Manager", risk: "low" },
          { port: 4126, service: "HYDRA-ALT", protocol: "TCP", description: "Microsoft Operations Manager", risk: "low" },
          { port: 4132, service: "NUTS", protocol: "TCP/UDP", description: "NUTS Daemon", risk: "low" },
          { port: 4133, service: "NUTSBOOT", protocol: "TCP/UDP", description: "NUTS Boot", risk: "low" },
          { port: 4141, service: "NEXENTA", protocol: "TCP", description: "Nexenta Systems", risk: "low" },
          { port: 4153, service: "RZHD", protocol: "TCP/UDP", description: "Rohde&Schwarz HD", risk: "low" },
          { port: 4160, service: "JONAS", protocol: "TCP/UDP", description: "JONAS", risk: "low" },
          { port: 4190, service: "SIEVE", protocol: "TCP", description: "ManageSieve", risk: "low", tags: ["email"] },
          { port: 4201, service: "VRML-MP", protocol: "TCP/UDP", description: "VRML Multiplayer", risk: "low" },
          { port: 4224, service: "XTALK", protocol: "TCP/UDP", description: "XTalk", risk: "low" },
          { port: 4242, service: "VRML-MP", protocol: "TCP/UDP", description: "VRML Multiplayer", risk: "low" },
          { port: 4303, service: "YES-LM", protocol: "TCP/UDP", description: "Yes License", risk: "low" },
          { port: 4321, service: "RWHOD", protocol: "UDP", description: "Remote Who", risk: "low" },
          { port: 4333, service: "M-SQL", protocol: "TCP", description: "mSQL", risk: "low", tags: ["database"] },
          { port: 4343, service: "UNICALL", protocol: "TCP/UDP", description: "UNICALL", risk: "low" },
          { port: 4352, service: "PJLINK", protocol: "TCP", description: "PJLink", risk: "low" },
          { port: 4369, service: "EPMD", protocol: "TCP/UDP", description: "Erlang Port Mapper", risk: "low" },
          { port: 4400, service: "CRYSTAL-REPORTS", protocol: "TCP", description: "Crystal Reports", risk: "low" },
          { port: 4444, service: "METASPLOIT", protocol: "TCP", description: "Metasploit / Various malware", risk: "high", tags: ["exploit", "malware"] },
          { port: 4445, service: "UPNOTIFYP", protocol: "TCP/UDP", description: "UPNOTIFYP", risk: "low" },
          { port: 4457, service: "PR-AUTH", protocol: "TCP/UDP", description: "PR Auth", risk: "low" },
          { port: 4488, service: "AWACS-ICE", protocol: "TCP/UDP", description: "AWACS ICE", risk: "low" },
          { port: 4500, service: "IPSEC-NAT-T", protocol: "UDP", description: "IPSec NAT Traversal", risk: "low", tags: ["VPN"] },
          { port: 4505, service: "SALT-MASTER", protocol: "TCP", description: "Salt Stack Master", risk: "medium", tags: ["automation"] },
          { port: 4506, service: "SALT-API", protocol: "TCP", description: "Salt Stack API", risk: "medium", tags: ["automation"] },
          { port: 4534, service: "ACS-PROTO", protocol: "TCP/UDP", description: "ACS Protocol", risk: "low" },
          { port: 4545, service: "SILVERTHRN", protocol: "TCP/UDP", description: "Silverthorne", risk: "low" },
          { port: 4555, service: "RSIP", protocol: "TCP/UDP", description: "RSIP", risk: "low" },
          { port: 4567, service: "TRAM", protocol: "TCP/UDP", description: "TRAM", risk: "low" },
          { port: 4568, service: "BPC-PATROL", protocol: "TCP/UDP", description: "BPC Patrol", risk: "low" },
          { port: 4600, service: "P2P", protocol: "TCP/UDP", description: "Peer-to-Peer Networking", risk: "medium" },
          { port: 4658, service: "PLAYSTATION", protocol: "TCP/UDP", description: "PlayStation Network", risk: "low", tags: ["gaming"] },
          { port: 4662, service: "EMULE", protocol: "TCP/UDP", description: "eMule P2P", risk: "medium" },
          { port: 4672, service: "EMULE-UDP", protocol: "UDP", description: "eMule UDP", risk: "medium" },
          { port: 4711, service: "TMAGENT", protocol: "TCP", description: "Trend Micro", risk: "low" },
          { port: 4728, service: "CHROMECAST", protocol: "TCP/UDP", description: "Google Chromecast", risk: "low", tags: ["streaming"] },
          { port: 4730, service: "GEARMAN", protocol: "TCP", description: "Gearman Job Server", risk: "low" },
          { port: 4739, service: "IPFLOW", protocol: "TCP/UDP", description: "IP Flow", risk: "low" },
          { port: 4740, service: "IPFIX", protocol: "TCP/UDP", description: "IPFIX", risk: "low" },
          { port: 4750, service: "SNAP", protocol: "TCP/UDP", description: "SNAP", risk: "low" },
          { port: 4786, service: "SMART-INSTALL", protocol: "TCP", description: "Cisco Smart Install", risk: "high", tags: ["exploit"] },
          { port: 4848, service: "APACHE-JSERV", protocol: "TCP", description: "Apache JServ", risk: "low" },
          { port: 4849, service: "APP", protocol: "TCP/UDP", description: "Application Server", risk: "low" },
          { port: 4894, service: "LYNX", protocol: "TCP/UDP", description: "LYNX", risk: "low" },
          { port: 4899, service: "RADMIN", protocol: "TCP", description: "Radmin Remote Admin", risk: "medium", tags: ["remote-access"] },
          { port: 4900, service: "MUNIN", protocol: "TCP", description: "Munin Monitoring", risk: "low", tags: ["monitoring"] },
          { port: 4949, service: "MUNIN-PLAIN", protocol: "TCP", description: "Munin Plain", risk: "low" },
          { port: 5000, service: "UPNP-ADMIN", protocol: "TCP/UDP", description: "UPnP / Various Services", risk: "medium", tags: ["development"] },
          { port: 5001, service: "SSL-UPNP", protocol: "TCP", description: "SSL UPnP", risk: "low" },
          { port: 5002, service: "SARICA", protocol: "TCP/UDP", description: "SARICA", risk: "low" },
          { port: 5003, service: "FILEMAKER", protocol: "TCP", description: "FileMaker", risk: "low", tags: ["database"] },
          { port: 5004, service: "RTP", protocol: "UDP", description: "RTP Media", risk: "low", tags: ["streaming", "voip"] },
          { port: 5005, service: "RTCP", protocol: "UDP", description: "RTP Control", risk: "low", tags: ["streaming", "voip"] },
          { port: 5006, service: "WMLS", protocol: "TCP", description: "WMLS", risk: "low" },
          { port: 5007, service: "WMLS-SSL", protocol: "TCP", description: "WMLS SSL", risk: "low" },
          { port: 5008, service: "WDAEMON", protocol: "TCP/UDP", description: "Wdaemon", risk: "low" },
          { port: 5009, service: "CAPI", protocol: "TCP/UDP", description: "CAPI", risk: "low" },
          { port: 5010, service: "TELELPATH", protocol: "TCP/UDP", description: "Telelpath", risk: "low" },
          { port: 5011, service: "TELELPATH-BT", protocol: "TCP/UDP", description: "Telelpath", risk: "low" },
          { port: 5031, service: "DAAP", protocol: "TCP", description: "DAAP", risk: "low" },
          { port: 5050, service: "MMCC", protocol: "TCP/UDP", description: "Multimedia", risk: "low" },
          { port: 5051, service: "ITA-MGR", protocol: "TCP/UDP", description: "ITA Manager", risk: "low" },
          { port: 5052, service: "SUN-AS-ILOOP", protocol: "TCP/UDP", description: "Sun AS", risk: "low" },
          { port: 5060, service: "SIP", protocol: "TCP/UDP", description: "Session Initiation Protocol", risk: "medium", tags: ["voip"] },
          { port: 5061, service: "SIPS", protocol: "TCP/UDP", description: "SIP over TLS", risk: "low", tags: ["voip", "secure"] },
          { port: 5062, service: "DAAP", protocol: "TCP/UDP", description: "DAAP", risk: "low" },
          { port: 5070, service: "VTSAS", protocol: "TCP/UDP", description: "VTSAS", risk: "low" },
          { port: 5081, service: "SDL-ETS", protocol: "TCP/UDP", description: "SDL ETS", risk: "low" },
          { port: 5093, service: "SENTINEL-SR", protocol: "TCP/UDP", description: "Sentinel SR", risk: "low" },
          { port: 5099, service: "SENTINEL-EVENT", protocol: "TCP/UDP", description: "Sentinel Event", risk: "low" },
          { port: 5100, service: "TROJAN", protocol: "TCP/UDP", description: "Trojan / Socalia", risk: "high", tags: ["malware"] },
          { port: 5101, service: "TALON-DSC", protocol: "TCP/UDP", description: "Talon Discovery", risk: "low" },
          { port: 5102, service: "TALON-REP", protocol: "TCP/UDP", description: "Talon Reporting", risk: "low" },
          { port: 5120, service: "TACDAT", protocol: "TCP/UDP", description: "TACDAT", risk: "low" },
          { port: 5130, service: "BMC-CTD", protocol: "TCP/UDP", description: "BMC Control", risk: "low" },
          { port: 5137, service: "MYRTLE", protocol: "TCP/UDP", description: "Myrtle", risk: "low" },
          { port: 5145, service: "RMCP", protocol: "TCP/UDP", description: "RMCP", risk: "low" },
          { port: 5150, service: "ATMP", protocol: "TCP/UDP", description: "Ascend Tunnel", risk: "low" },
          { port: 5151, service: "ESRI-SDE", protocol: "TCP/UDP", description: "ESRI SDE", risk: "low" },
          { port: 5152, service: "SDE-DISC", protocol: "TCP/UDP", description: "SDE Discovery", risk: "low" },
          { port: 5165, service: "NSP", protocol: "TCP/UDP", description: "NSP", risk: "low" },
          { port: 5190, service: "AOL", protocol: "TCP", description: "AOL Instant Messenger", risk: "low" },
          { port: 5200, service: "TARGUS-GETDATA", protocol: "TCP/UDP", description: "Targus GetData", risk: "low" },
          { port: 5201, service: "IPERF3", protocol: "TCP/UDP", description: "iPerf3 Speed Test", risk: "low", tags: ["testing"] },
          { port: 5222, service: "XMPP-CLIENT", protocol: "TCP", description: "XMPP Client Connection", risk: "low", tags: ["chat", "messaging"] },
          { port: 5223, service: "XMPP-CLIENT-SSL", protocol: "TCP", description: "XMPP Client SSL", risk: "low", tags: ["secure", "chat"] },
          { port: 5228, service: "ANDROID", protocol: "TCP", description: "Android Market", risk: "low" },
          { port: 5246, service: "CAPWAP-CTRL", protocol: "UDP", description: "CAPWAP Control", risk: "low", tags: ["wireless"] },
          { port: 5247, service: "CAPWAP-DATA", protocol: "UDP", description: "CAPWAP Data", risk: "low", tags: ["wireless"] },
          { port: 5269, service: "XMPP-SERVER", protocol: "TCP", description: "XMPP Server-to-Server", risk: "low", tags: ["chat"] },
          { port: 5280, service: "XMPP-BOSH", protocol: "TCP", description: "XMPP BOSH", risk: "low" },
          { port: 5298, service: "ZEROCONF", protocol: "TCP/UDP", description: "Zero Configuration", risk: "low", tags: ["bonjour"] },
          { port: 5351, service: "NAT-PMP", protocol: "UDP", description: "NAT Port Mapping Protocol", risk: "medium" },
          { port: 5353, service: "MDNS", protocol: "UDP", description: "Multicast DNS", risk: "low", tags: ["bonjour", "zeroconf"] },
          { port: 5354, service: "MDNS-RESPONDER", protocol: "TCP/UDP", description: "mDNS Responder", risk: "low" },
          { port: 5355, service: "LLMNR", protocol: "UDP", description: "Link-Local Multicast Name Resolution", risk: "low" },
          { port: 5357, service: "WSDAPI", protocol: "TCP", description: "Web Services for Devices", risk: "low" },
          { port: 5432, service: "POSTGRESQL", protocol: "TCP", description: "PostgreSQL Database", risk: "high", tags: ["database", "exploit", "brute-force"] },
          { port: 5443, service: "SPACEMGT", protocol: "TCP/UDP", description: "SPACEMGT", risk: "low" },
          { port: 5454, service: "TENTACLE", protocol: "TCP", description: "Pandora Agent", risk: "low" },
          { port: 5500, service: "HOTLINE", protocol: "TCP/UDP", description: "Hotline", risk: "low" },
          { port: 5510, service: "SECURE-RSHELL", protocol: "TCP", description: "Secure RShell", risk: "medium" },
          { port: 5554, service: "Sasser", protocol: "TCP", description: "Sasser Worm Backdoor", risk: "high", tags: ["malware", "worm"] },
          { port: 5555, service: "HPLP", protocol: "TCP/UDP", description: "HP Data Protector / Backdoor", risk: "high", tags: ["malware", "backdoor"] },
          { port: 5566, service: "RCFILE", protocol: "TCP", description: "RC File", risk: "low" },
          { port: 5598, service: "ESINSTALL", protocol: "TCP/UDP", description: "Enterprise Security", risk: "low" },
          { port: 5601, service: "KIBANA", protocol: "TCP", description: "Kibana Dashboard", risk: "low", tags: ["monitoring", "logging"] },
          { port: 5631, service: "PCANYWHEREDATA", protocol: "TCP", description: "pcAnywhere Data", risk: "medium", tags: ["remote-access"] },
          { port: 5632, service: "PCANYWHERESTAT", protocol: "TCP/UDP", description: "pcAnywhere Status", risk: "medium", tags: ["remote-access"] },
          { port: 5666, service: "NRPE", protocol: "TCP", description: "Nagios Remote Plugin", risk: "low", tags: ["monitoring"] },
          { port: 5671, service: "AMQPS", protocol: "TCP", description: "AMQP over SSL", risk: "low", tags: ["messaging", "secure"] },
          { port: 5672, service: "AMQP", protocol: "TCP", description: "Advanced Message Queuing", risk: "low", tags: ["messaging"] },
          { port: 5678, service: "RRAC", protocol: "TCP/UDP", description: "Remote Replication", risk: "low" },
          { port: 5683, service: "COAP", protocol: "UDP", description: "Constrained Application Protocol", risk: "low", tags: ["iot"] },
          { port: 5684, service: "COAPS", protocol: "UDP", description: "CoAP over DTLS", risk: "low", tags: ["iot", "secure"] },
          { port: 5693, service: "DATA-TRS", protocol: "TCP/UDP", description: "Data TRS", risk: "low" },
          { port: 5700, service: "STORAGEOS", protocol: "TCP/UDP", description: "StorageOS", risk: "low" },
          { port: 5718, service: "DPM", protocol: "TCP/UDP", description: "DPM Communication", risk: "low" },
          { port: 5720, service: "BRIJ-PRINT", protocol: "TCP/UDP", description: "Brij Print", risk: "low" },
          { port: 5741, service: "IDA-DISC", protocol: "TCP/UDP", description: "IDA Discovery", risk: "low" },
          { port: 5742, service: "IDA-AGENT", protocol: "TCP", description: "IDA Agent Port", risk: "high", tags: ["trojan", "backdoor"] },
          { port: 5800, service: "VNC-HTTP", protocol: "TCP", description: "VNC over HTTP", risk: "medium", tags: ["remote-access"] },
          { port: 5801, service: "VNC-HTTP-1", protocol: "TCP", description: "VNC HTTP (Display 1)", risk: "medium", tags: ["remote-access"] },
          { port: 5810, service: "MPD", protocol: "TCP", description: "Music Player Daemon", risk: "low", tags: ["audio"] },
          { port: 5814, service: "IPDC", protocol: "TCP/UDP", description: "IPDC", risk: "low" },
          { port: 5859, service: "WHEREHOO", protocol: "TCP/UDP", description: "WhereHoo", risk: "low" },
          { port: 5862, service: "RADW", protocol: "TCP/UDP", description: "RADW", risk: "low" },
          { port: 5877, service: "AFTERSTEP", protocol: "TCP", description: "Afterstep X11", risk: "low" },
          { port: 5900, service: "VNC", protocol: "TCP", description: "Virtual Network Computing", risk: "high", tags: ["remote-access", "exploit", "brute-force"] },
          { port: 5901, service: "VNC-1", protocol: "TCP", description: "VNC Display :1", risk: "high", tags: ["remote-access"] },
          { port: 5902, service: "VNC-2", protocol: "TCP", description: "VNC Display :2", risk: "high", tags: ["remote-access"] },
          { port: 5903, service: "VNC-3", protocol: "TCP", description: "VNC Display :3", risk: "high", tags: ["remote-access"] },
          { port: 5938, service: "TEAMVIEWER", protocol: "TCP/UDP", description: "TeamViewer", risk: "medium", tags: ["remote-access"] },
          { port: 5984, service: "COUCHDB", protocol: "TCP", description: "CouchDB", risk: "medium", tags: ["database"] },
          { port: 5985, service: "WINRM-HTTP", protocol: "TCP", description: "Windows Remote Management (HTTP)", risk: "medium", tags: ["windows", "remote-management"] },
          { port: 5986, service: "WINRM-HTTPS", protocol: "TCP", description: "Windows Remote Management (HTTPS)", risk: "low", tags: ["windows", "secure"] },
          { port: 6000, service: "X11", protocol: "TCP", description: "X11 Server", risk: "high", tags: ["X-windows", "remote-access"] },
          { port: 6001, service: "X11-1", protocol: "TCP", description: "X11 Server :1", risk: "high", tags: ["X-windows"] },
          { port: 6064, service: "NDL-AHP", protocol: "TCP/UDP", description: "NDL-AHP", risk: "low" },
          { port: 6072, service: "RELOAD", protocol: "TCP/UDP", description: "Reload Configuration", risk: "low" },
          { port: 6100, service: "SYNC", protocol: "TCP/UDP", description: "Synchronization", risk: "low" },
          { port: 6101, service: "RESCAN", protocol: "TCP/UDP", description: "Rescan", risk: "low" },
          { port: 6110, service: "SOFTCM", protocol: "TCP", description: "HP SoftBench", risk: "low" },
          { port: 6111, service: "SPC", protocol: "TCP", description: "SPC", risk: "low" },
          { port: 6112, service: "DTSPCD", protocol: "TCP", description: "deskTop Server", risk: "low" },
          { port: 6123, service: "REXECJ", protocol: "TCP/UDP", description: "REXECJ", risk: "medium" },
          { port: 6129, service: "DAMEWARE", protocol: "TCP", description: "DameWare Remote Control", risk: "medium", tags: ["remote-access"] },
          { port: 6156, service: "EPMD", protocol: "TCP", description: "Erlang Port Mapper", risk: "low" },
          { port: 6262, service: "GRIDSERVICE", protocol: "TCP", description: "Grid Service", risk: "low" },
          { port: 6267, service: "GCMP", protocol: "TCP/UDP", description: "Grid Configuration", risk: "low" },
          { port: 6343, service: "SFLOW", protocol: "UDP", description: "sFlow Monitoring", risk: "low", tags: ["monitoring"] },
          { port: 6346, service: "GNUTELLA", protocol: "TCP/UDP", description: "Gnutella P2P", risk: "medium", tags: ["p2p"] },
          { port: 6347, service: "GNUTELLA-RTR", protocol: "TCP/UDP", description: "Gnutella Router", risk: "medium", tags: ["p2p"] },
          { port: 6379, service: "REDIS", protocol: "TCP", description: "Redis Key-Value Store", risk: "high", tags: ["database", "exploit", "no-auth"] },
          { port: 6380, service: "REDIS-SENTINEL", protocol: "TCP", description: "Redis Sentinel", risk: "medium", tags: ["database"] },
          { port: 6444, service: "GEARMAN-SSL", protocol: "TCP", description: "Gearman SSL", risk: "low", tags: ["secure"] },
          { port: 6446, service: "MYSQL-PROXY", protocol: "TCP", description: "MySQL Proxy", risk: "medium", tags: ["database"] },
          { port: 6502, service: "NETOP-RC", protocol: "TCP", description: "NetOp Remote Control", risk: "low", tags: ["remote-access"] },
          { port: 6503, service: "NETOP-SCHOOL", protocol: "TCP", description: "NetOp School", risk: "low" },
          { port: 6504, service: "NETOP-WEB", protocol: "TCP", description: "NetOp Web", risk: "low" },
          { port: 6520, service: "GADMIN-DAEMON", protocol: "TCP/UDP", description: "Gadmin Daemon", risk: "low" },
          { port: 6543, service: "MYTHTV", protocol: "TCP/UDP", description: "MythTV", risk: "low", tags: ["media"] },
          { port: 6566, service: "SANE", protocol: "TCP", description: "SANE Scanner", risk: "low" },
          { port: 6567, service: "ESP", protocol: "UDP", description: "Epson Streaming", risk: "low" },
          { port: 6571, service: "PROPEL-MSGSYS", protocol: "TCP/UDP", description: "Propel Message", risk: "low" },
          { port: 6600, service: "MPD", protocol: "TCP", description: "Music Player Daemon", risk: "low" },
          { port: 6601, service: "MPD-ADMIN", protocol: "TCP", description: "MPD Admin", risk: "low" },
          { port: 6602, service: "MPD-CLIENT", protocol: "TCP", description: "MPD Client", risk: "low" },
          { port: 6619, service: "ODETTE-FTP", protocol: "TCP/UDP", description: "Odette FTP", risk: "low" },
          { port: 6646, service: "AGENT-VIEW", protocol: "TCP/UDP", description: "Agent View", risk: "low" },
          { port: 6660, service: "IRC-ALT", protocol: "TCP", description: "IRC File Transfer", risk: "medium", tags: ["chat"] },
          { port: 6661, service: "IRC-ALT", protocol: "TCP", description: "IRC File Transfer", risk: "medium" },
          { port: 6662, service: "IRC-ALT", protocol: "TCP", description: "IRC File Transfer", risk: "medium" },
          { port: 6663, service: "IRC-ALT", protocol: "TCP", description: "IRC File Transfer", risk: "medium" },
          { port: 6664, service: "IRC-ALT", protocol: "TCP", description: "IRC File Transfer", risk: "medium" },
          { port: 6665, service: "IRC-ALT", protocol: "TCP", description: "IRC File Transfer", risk: "medium" },
          { port: 6666, service: "IRC-ALT", protocol: "TCP", description: "IRC File Transfer", risk: "medium" },
          { port: 6667, service: "IRC", protocol: "TCP", description: "Internet Relay Chat", risk: "medium", tags: ["chat", "malware"] },
          { port: 6668, service: "IRC-ALT", protocol: "TCP", description: "IRC File Transfer", risk: "medium" },
          { port: 6669, service: "IRC-ALT", protocol: "TCP", description: "IRC File Transfer", risk: "medium" },
          { port: 6670, service: "VocalTec-Global", protocol: "TCP/UDP", description: "VocalTec Global", risk: "low" },
          { port: 6679, service: "IRC-SSL", protocol: "TCP", description: "IRC over SSL", risk: "low", tags: ["secure", "chat"] },
          { port: 6697, service: "IRC-SSL", protocol: "TCP", description: "IRC SSL", risk: "low", tags: ["secure", "chat"] },
          { port: 6699, service: "NAPSTER", protocol: "TCP", description: "Napster", risk: "medium", tags: ["p2p"] },
          { port: 6700, service: "NAPSTER", protocol: "TCP", description: "Napster", risk: "medium" },
          { port: 6701, service: "NAPSTER", protocol: "TCP/UDP", description: "Napster", risk: "medium" },
          { port: 6711, service: "SUBSEVEN", protocol: "TCP", description: "SubSeven Trojan", risk: "high", tags: ["malware", "trojan"] },
          { port: 6776, service: "SUBSEVEN-ALT", protocol: "TCP", description: "SubSeven Backdoor", risk: "high", tags: ["malware", "trojan"] },
          { port: 6789, service: "SAGE", protocol: "TCP", description: "SAGE", risk: "low" },
          { port: 6790, service: "HNMP", protocol: "TCP/UDP", description: "HNMP", risk: "low" },
          { port: 6801, service: "ACNET", protocol: "TCP/UDP", description: "ACNET", risk: "low" },
          { port: 6881, service: "BITTORRENT", protocol: "TCP/UDP", description: "BitTorrent", risk: "medium", tags: ["p2p"] },
          { port: 6882, service: "BITTORRENT", protocol: "TCP/UDP", description: "BitTorrent", risk: "medium", tags: ["p2p"] },
          { port: 6883, service: "BITTORRENT", protocol: "TCP/UDP", description: "BitTorrent", risk: "medium", tags: ["p2p"] },
          { port: 6884, service: "BITTORRENT", protocol: "TCP/UDP", description: "BitTorrent", risk: "medium", tags: ["p2p"] },
          { port: 6885, service: "BITTORRENT", protocol: "TCP/UDP", description: "BitTorrent", risk: "medium", tags: ["p2p"] },
          { port: 6886, service: "BITTORRENT", protocol: "TCP/UDP", description: "BitTorrent", risk: "medium", tags: ["p2p"] },
          { port: 6887, service: "BITTORRENT", protocol: "TCP/UDP", description: "BitTorrent", risk: "medium", tags: ["p2p"] },
          { port: 6888, service: "BITTORRENT", protocol: "TCP/UDP", description: "BitTorrent", risk: "medium", tags: ["p2p"] },
          { port: 6889, service: "BITTORRENT", protocol: "TCP/UDP", description: "BitTorrent", risk: "medium", tags: ["p2p"] },
          { port: 6890, service: "BITTORRENT", protocol: "TCP/UDP", description: "BitTorrent", risk: "medium", tags: ["p2p"] },
          { port: 6891, service: "WINDOWS-LIVE", protocol: "TCP", description: "Windows Live Messenger", risk: "low", tags: ["chat"] },
          { port: 6892, service: "WINDOWS-LIVE", protocol: "TCP", description: "Windows Live Messenger", risk: "low", tags: ["chat"] },
          { port: 6893, service: "WINDOWS-LIVE", protocol: "TCP", description: "Windows Live Messenger", risk: "low", tags: ["chat"] },
          { port: 6894, service: "WINDOWS-LIVE", protocol: "TCP", description: "Windows Live Messenger", risk: "low", tags: ["chat"] },
          { port: 6895, service: "WINDOWS-LIVE", protocol: "TCP", description: "Windows Live Messenger", risk: "low", tags: ["chat"] },
          { port: 6901, service: "WINDOWS-LIVE-Voice", protocol: "TCP/UDP", description: "Windows Live Voice", risk: "low", tags: ["voip"] },
          { port: 6969, service: "BITTORRENT-TRACKER", protocol: "TCP", description: "BitTorrent Tracker", risk: "medium", tags: ["p2p"] },
          { port: 6970, service: "RTP", protocol: "TCP/UDP", description: "Real-time Transport", risk: "low" },
          { port: 6999, service: "ACCESS-PAGE", protocol: "TCP", description: "Access Network", risk: "low" },
          { port: 7000, service: "AFS3-FILESERVER", protocol: "TCP/UDP", description: "Andrew File System", risk: "low", tags: ["file-system"] },
          { port: 7001, service: "AFS3-CALLBACK", protocol: "TCP/UDP", description: "AFS Callback", risk: "low" },
          { port: 7002, service: "AFS3-PRSERVER", protocol: "TCP/UDP", description: "AFS Protection", risk: "low" },
          { port: 7003, service: "AFS3-VLSERVER", protocol: "TCP/UDP", description: "AFS Volume", risk: "low" },
          { port: 7004, service: "AFS3-KASERVER", protocol: "TCP/UDP", description: "AFS Kerberos", risk: "low" },
          { port: 7005, service: "AFS3-VOLSER", protocol: "TCP/UDP", description: "AFS Volume", risk: "low" },
          { port: 7006, service: "AFS3-ERRORS", protocol: "TCP/UDP", description: "AFS Errors", risk: "low" },
          { port: 7007, service: "AFS3-BOS", protocol: "TCP/UDP", description: "AFS Boss", risk: "low" },
          { port: 7008, service: "AFS3-UPDATE", protocol: "TCP/UDP", description: "AFS Update", risk: "low" },
          { port: 7009, service: "AFS3-RMTSYS", protocol: "TCP/UDP", description: "AFS Remote", risk: "low" },
          { port: 7025, service: "ZENOSS", protocol: "TCP", description: "Zenoss Core", risk: "low", tags: ["monitoring"] },
          { port: 7070, service: "ARCP", protocol: "TCP/UDP", description: "ARCP", risk: "low" },
          { port: 7071, service: "IWG1", protocol: "TCP/UDP", description: "IWG1", risk: "low" },
          { port: 7100, service: "FONT-SERVICE", protocol: "TCP", description: "X Font Service", risk: "low", tags: ["X-windows"] },
          { port: 7144, service: "PEERWARE", protocol: "TCP", description: "PeerWire", risk: "low" },
          { port: 7145, service: "PEERWARE-TR", protocol: "TCP", description: "PeerWire Tracking", risk: "low" },
          { port: 7171, service: "DSD", protocol: "TCP/UDP", description: "DSD", risk: "low" },
          { port: 7181, service: "MOINMOIN", protocol: "TCP", description: "MoinMoin Wiki", risk: "low" },
          { port: 7262, service: "CAMERA", protocol: "TCP/UDP", description: "Camera Control", risk: "low" },
          { port: 7272, service: "WATCHME-7272", protocol: "TCP/UDP", description: "WatchMe", risk: "low" },
          { port: 7326, service: "CBER-CAM", protocol: "TCP/UDP", description: "Ciber Control", risk: "low" },
          { port: 7337, service: "REBUILD", protocol: "TCP", description: "Rebuild", risk: "low" },
          { port: 7400, service: "RTPS-DD", protocol: "TCP/UDP", description: "RTPS Discovery", risk: "low" },
          { port: 7401, service: "RTPS-TEE", protocol: "TCP/UDP", description: "RTPS Data", risk: "low" },
          { port: 7402, service: "RTPS-DISC", protocol: "TCP/UDP", description: "RTPS Discovery", risk: "low" },
          { port: 7443, service: "ORACLE-HTTPS", protocol: "TCP", description: "Oracle Application Server HTTPS", risk: "low", tags: ["secure"] },
          { port: 7510, service: "SILHOUETTE", protocol: "TCP/UDP", description: "Silhouette", risk: "low" },
          { port: 7511, service: "K", protocol: "TCP/UDP", description: "K Service", risk: "low" },
          { port: 7777, service: "TROJAN", protocol: "TCP", description: "Trojan / CBT", risk: "high", tags: ["malware"] },
          { port: 7778, service: "INTERWISE", protocol: "TCP/UDP", description: "Interwise", risk: "low" },
          { port: 7789, service: "TROJAN", protocol: "TCP", description: "Trojan", risk: "high", tags: ["malware"] },
          { port: 7800, service: "ASR", protocol: "TCP/UDP", description: "Apple Software Restore", risk: "low", tags: ["apple"] },
          { port: 8000, service: "HTTP-ALT", protocol: "TCP", description: "HTTP Alternate / iRDMI", risk: "low", tags: ["web", "development"] },
          { port: 8001, service: "VCOM-TUNNEL", protocol: "TCP/UDP", description: "VCOM Tunnel", risk: "low" },
          { port: 8005, service: "MXXRLOGIN", protocol: "TCP", description: "MX-XR Login", risk: "low" },
          { port: 8008, service: "HTTP", protocol: "TCP", description: "IBM HTTP Server", risk: "low", tags: ["web"] },
          { port: 8009, service: "AJP13", protocol: "TCP", description: "Apache JServ Protocol", risk: "medium", tags: ["java"] },
          { port: 8010, service: "XMPP", protocol: "TCP", description: "XMPP File Transfer", risk: "low" },
          { port: 8021, service: "FTP-PROXY", protocol: "TCP", description: "FTP Proxy", risk: "medium" },
          { port: 8080, service: "HTTP-PROXY", protocol: "TCP", description: "HTTP Proxy / Alternate HTTP", risk: "low", tags: ["web", "proxy", "development"] },
          { port: 8081, service: "HTTP-PROXY", protocol: "TCP", description: "HTTP Proxy Alternate", risk: "low", tags: ["proxy"] },
          { port: 8086, service: "INFLUXDB", protocol: "TCP", description: "InfluxDB HTTP API", risk: "high", tags: ["database"] },
          { port: 8087, service: "INFLUXDB-ALT", protocol: "TCP", description: "InfluxDB RPC", risk: "high", tags: ["database"] },
          { port: 8088, service: "RADAN-HTTP", protocol: "TCP", description: "Radan HTTP", risk: "low" },
          { port: 8118, service: "PRIVACY", protocol: "TCP", description: "Privoxy", risk: "low", tags: ["proxy", "privacy"] },
          { port: 8123, service: "POLIPO", protocol: "TCP", description: "Polipo HTTP Proxy", risk: "low", tags: ["proxy"] },
          { port: 8200, service: "VMWARE-TRIAL", protocol: "TCP", description: "VMware Trial", risk: "low" },
          { port: 8222, service: "VMWARE-TRIAL-SSL", protocol: "TCP", description: "VMware Trial SSL", risk: "low" },
          { port: 8291, service: "WINBOX", protocol: "TCP", description: "MikroTik WinBox", risk: "medium" },
          { port: 8300, service: "TRANSMISSION", protocol: "TCP", description: "Transmission BitTorrent", risk: "medium", tags: ["p2p"] },
          { port: 8443, service: "HTTPS-ALT", protocol: "TCP", description: "HTTPS Alternate", risk: "low", tags: ["web", "secure"] },
          { port: 8500, service: "COLDFUSION", protocol: "TCP", description: "Adobe ColdFusion", risk: "medium", tags: ["development"] },
          { port: 8585, service: "MAXIM-ADMIN", protocol: "TCP", description: "Maxim Admin", risk: "low" },
          { port: 8600, service: "ASTERIX", protocol: "TCP/UDP", description: "Asterisk", risk: "low", tags: ["voip"] },
          { port: 8649, service: "GANGALIA", protocol: "TCP", description: "Ganglia Monitoring", risk: "low", tags: ["monitoring"] },
          { port: 8651, service: "SUN-SEA-PORT", protocol: "TCP", description: "Sun SEA Port", risk: "low" },
          { port: 8652, service: "SUN-SEA-PORT-SSL", protocol: "TCP", description: "Sun SEA Port SSL", risk: "low" },
          { port: 8701, service: "RSIP", protocol: "TCP/UDP", description: "RSIP", risk: "low" },
          { port: 8800, service: "SUNWEBADMIN", protocol: "TCP", description: "Sun Web Server Admin", risk: "low" },
          { port: 8873, service: "DXSPIDER", protocol: "TCP", description: "DX Spider", risk: "low" },
          { port: 8880, service: "CDDBP-ALT", protocol: "TCP", description: "CDDBP Alternative", risk: "low" },
          { port: 8883, service: "MQTT-SSL", protocol: "TCP", description: "MQTT over TLS", risk: "low", tags: ["iot", "secure"] },
          { port: 8888, service: "SUN-ANSWERBOOK", protocol: "TCP", description: "Sun Answerbook", risk: "low" },
          { port: 8889, service: "DATABASE", protocol: "TCP", description: "Database Admin", risk: "medium", tags: ["database"] },
          { port: 9000, service: "CSLISTENER", protocol: "TCP", description: "CSListener / SonarQube", risk: "medium", tags: ["development"] },
          { port: 9001, service: "ETLSERVICEMGR", protocol: "TCP", description: "ETL Service Manager", risk: "low" },
          { port: 9042, service: "CASSANDRA", protocol: "TCP", description: "Apache Cassandra CQL", risk: "high", tags: ["database"] },
          { port: 9043, service: "CASSANDRA-ALT", protocol: "TCP", description: "Cassandra Alt", risk: "high", tags: ["database"] },
          { port: 9050, service: "TOR-SOCKS", protocol: "TCP", description: "Tor SOCKS Proxy", risk: "medium", tags: ["proxy", "privacy"] },
          { port: 9051, service: "TOR-CTRL", protocol: "TCP", description: "Tor Control Port", risk: "medium", tags: ["proxy", "privacy"] },
          { port: 9090, service: "WEBSM", protocol: "TCP", description: "WebSM", risk: "low" },
          { port: 9091, service: "TRANSMISSION", protocol: "TCP", description: "Transmission RPC", risk: "medium", tags: ["p2p"] },
          { port: 9092, service: "KAFKA", protocol: "TCP", description: "Apache Kafka", risk: "medium", tags: ["messaging"] },
          { port: 9100, service: "JETDIRECT", protocol: "TCP", description: "HP JetDirect", risk: "low", tags: ["printing"] },
          { port: 9200, service: "ELASTICSEARCH", protocol: "TCP", description: "Elasticsearch HTTP", risk: "high", tags: ["database", "search"] },
          { port: 9201, service: "ELASTICSEARCH-SSL", protocol: "TCP", description: "Elasticsearch SSL", risk: "high", tags: ["database", "secure"] },
          { port: 9292, service: "SONATYPE-NEXUS", protocol: "TCP", description: "Sonatype Nexus", risk: "low" },
          { port: 9300, service: "ELASTICSEARCH-TRANSPORT", protocol: "TCP", description: "Elasticsearch Transport", risk: "high", tags: ["database"] },
          { port: 9418, service: "GIT", protocol: "TCP", description: "Git Version Control", risk: "low", tags: ["version-control"] },
          { port: 9443, service: "HTTPS-ALT", protocol: "TCP", description: "HTTPS Alternate (IBM)", risk: "low", tags: ["secure"] },
          { port: 9495, service: "OPENFIRE", protocol: "TCP", description: "Openfire Administration", risk: "medium" },
          { port: 9535, service: "MANAGEENGINE", protocol: "TCP", description: "ManageEngine", risk: "low" },
          { port: 9593, service: "LANDESK", protocol: "TCP", description: "LANDesk Remote Control", risk: "low" },
          { port: 9600, service: "METAMAC", protocol: "TCP/UDP", description: "Metamaco", risk: "low" },
          { port: 9675, service: "SPICEWORKS", protocol: "TCP", description: "Spiceworks", risk: "low" },
          { port: 9800, service: "WEBDAV", protocol: "TCP/UDP", description: "WebDAV", risk: "low" },
          { port: 9850, service: "MONGODB", protocol: "TCP", description: "MongoDB", risk: "high", tags: ["database"] },
          { port: 9876, service: "SD", protocol: "TCP", description: "Session Director", risk: "low" },
          { port: 9900, service: "IUA", protocol: "TCP/UDP", description: "IUA", risk: "low" },
          { port: 9997, service: "PALOALTO-LOG", protocol: "TCP", description: "Palo Alto Logs", risk: "low" },
          { port: 9998, service: "DISTINCT32", protocol: "TCP", description: "Distinct32", risk: "low" },
          { port: 9999, service: "DISTINCT", protocol: "TCP", description: "Distinct", risk: "low" },
          { port: 10000, service: "NDMP", protocol: "TCP/UDP", description: "Network Data Management Protocol", risk: "medium", tags: ["backup"] },
          { port: 10001, service: "SCP-CONFIG", protocol: "TCP", description: "SCP Configuration", risk: "low" },
          { port: 10050, service: "ZABBIX-AGENT", protocol: "TCP", description: "Zabbix Agent", risk: "medium", tags: ["monitoring"] },
          { port: 10051, service: "ZABBIX-TRAPPER", protocol: "TCP", description: "Zabbix Trapper", risk: "medium", tags: ["monitoring"] },
          { port: 10180, service: "AMANDA", protocol: "TCP/UDP", description: "Amanda Backup", risk: "low", tags: ["backup"] },
          { port: 10215, service: "APC-POWERCHUTE", protocol: "TCP", description: "APC PowerChute", risk: "low" },
          { port: 10500, service: "DOCUMENTUM", protocol: "TCP", description: "EMC Documentum", risk: "low" },
          { port: 10933, service: "TENTACLE", protocol: "TCP", description: "Pandora Tentacle", risk: "low" },
          { port: 11000, service: "IRISA", protocol: "TCP", description: "IRISA", risk: "low" },
          { port: 11211, service: "MEMCACHE", protocol: "TCP/UDP", description: "Memcached", risk: "high", tags: ["cache"] },
          { port: 11234, service: "INFORMIX", protocol: "TCP", description: "IBM Informix", risk: "medium", tags: ["database"] },
          { port: 11371, service: "PKSD", protocol: "TCP", description: "PGP Key Server", risk: "low" },
          { port: 12000, service: "CCDB", protocol: "TCP/UDP", description: "CCDB", risk: "low" },
          { port: 12345, service: "NETBUS", protocol: "TCP", description: "NetBus Trojan", risk: "critical", tags: ["malware", "trojan"] },
          { port: 13720, service: "BPDBM", protocol: "TCP/UDP", description: "Veritas NetBackup", risk: "low", tags: ["backup"] },
          { port: 13721, service: "BPDBM", protocol: "TCP/UDP", description: "Veritas NetBackup", risk: "low", tags: ["backup"] },
          { port: 13722, service: "BPCD", protocol: "TCP", description: "Veritas NetBackup", risk: "low", tags: ["backup"] },
          { port: 13724, service: "VNETD", protocol: "TCP/UDP", description: "Veritas NetBackup", risk: "low", tags: ["backup"] },
          { port: 15000, service: "VISTA-4GL", protocol: "TCP", description: "Vista 4GL", risk: "low" },
          { port: 16001, service: "SRP", protocol: "TCP/UDP", description: "SRP", risk: "low" },
          { port: 17000, service: "QUANTUM-DSS", protocol: "TCP/UDP", description: "Quantum Software", risk: "low" },
          { port: 18000, service: "BIIMENU", protocol: "TCP", description: "BII Menu", risk: "low" },
          { port: 20000, service: "DNP", protocol: "TCP", description: "DNP / Usermin", risk: "low" },
          { port: 22001, service: "SNAPENETIO", protocol: "TCP", description: "SnapenetIO", risk: "low" },
          { port: 22273, service: "WNN6", protocol: "TCP", description: "Wnn6", risk: "low" },
          { port: 22305, service: "KASSEN", protocol: "TCP", description: "Kassen", risk: "low" },
          { port: 23546, service: "ARENA-ULTD", protocol: "TCP/UDP", description: "Arena Unlimited", risk: "low" },
          { port: 26000, service: "QUAKE", protocol: "TCP/UDP", description: "Quake", risk: "low", tags: ["gaming"] },
          { port: 27015, service: "SOURCE-ENGINE", protocol: "TCP/UDP", description: "Source Engine Games", risk: "low", tags: ["gaming"] },
          { port: 27016, service: "SOURCE-ENGINE", protocol: "TCP/UDP", description: "Source Engine Games", risk: "low", tags: ["gaming"] },
          { port: 27017, service: "MONGODB", protocol: "TCP", description: "MongoDB", risk: "high", tags: ["database"] },
          { port: 27018, service: "MONGODB-SHARD", protocol: "TCP", description: "MongoDB Shard", risk: "high", tags: ["database"] },
          { port: 27019, service: "MONGODB-CONFIG", protocol: "TCP", description: "MongoDB Config Server", risk: "high", tags: ["database"] },
          { port: 27036, service: "STEAM", protocol: "UDP", description: "Steam In-Home Streaming", risk: "low", tags: ["gaming"] },
          { port: 27037, service: "STEAM", protocol: "UDP", description: "Steam In-Home Streaming", risk: "low", tags: ["gaming"] },
          { port: 27374, service: "SUB7", protocol: "TCP", description: "Sub7 Backdoor", risk: "critical", tags: ["malware", "trojan"] },
          { port: 28015, service: "RUST", protocol: "TCP/UDP", description: "Rust Game Server", risk: "low", tags: ["gaming"] },
          { port: 28017, service: "MONGODB-WEB", protocol: "TCP", description: "MongoDB Web Status", risk: "high", tags: ["database"] },
          { port: 28080, service: "HTTP-PROXY", protocol: "TCP", description: "HTTP Proxy", risk: "low", tags: ["proxy"] },
          { port: 31337, service: "ELITE", protocol: "TCP", description: "Back Orifice", risk: "critical", tags: ["malware", "trojan"] },
          { port: 32768, service: "FILENET", protocol: "TCP/UDP", description: "FileNet", risk: "low" },
          { port: 32769, service: "FILENET", protocol: "TCP/UDP", description: "FileNet RPC", risk: "low" },
          { port: 32770, service: "FILENET", protocol: "TCP/UDP", description: "FileNet", risk: "low" },
          { port: 32771, service: "FILENET", protocol: "TCP/UDP", description: "FileNet", risk: "low" },
          { port: 32772, service: "FILENET", protocol: "TCP/UDP", description: "FileNet", risk: "low" },
          { port: 32773, service: "FILENET", protocol: "TCP/UDP", description: "FileNet", risk: "low" },
          { port: 32774, service: "FILENET", protocol: "TCP/UDP", description: "FileNet", risk: "low" },
          { port: 32775, service: "FILENET", protocol: "TCP/UDP", description: "FileNet", risk: "low" },
          { port: 32776, service: "FILENET", protocol: "TCP/UDP", description: "FileNet", risk: "low" },
          { port: 32777, service: "FILENET", protocol: "TCP/UDP", description: "FileNet", risk: "low" },
          { port: 32778, service: "FILENET", protocol: "TCP/UDP", description: "FileNet", risk: "low" },
          { port: 32779, service: "FILENET", protocol: "TCP/UDP", description: "FileNet", risk: "low" },
          { port: 32780, service: "FILENET", protocol: "TCP/UDP", description: "FileNet", risk: "low" },
          { port: 32781, service: "FILENET", protocol: "TCP/UDP", description: "FileNet", risk: "low" },
          { port: 32782, service: "FILENET", protocol: "TCP/UDP", description: "FileNet", risk: "low" },
          { port: 32783, service: "FILENET", protocol: "TCP/UDP", description: "FileNet", risk: "low" },
          { port: 32784, service: "FILENET", protocol: "TCP/UDP", description: "FileNet", risk: "low" },
          { port: 32785, service: "FILENET", protocol: "TCP/UDP", description: "FileNet", risk: "low" },
          { port: 43188, service: "LISTSERV", protocol: "TCP/UDP", description: "LISTSERV", risk: "low" },
          { port: 47001, service: "WINRM-HTTP", protocol: "TCP", description: "Windows Remote Management", risk: "medium", tags: ["windows"] },
          { port: 49152, service: "DYNAMIC", protocol: "TCP/UDP", description: "Dynamic/Private Port", risk: "low" },
          { port: 49153, service: "DYNAMIC", protocol: "TCP/UDP", description: "Dynamic/Private Port", risk: "low" },
          { port: 49154, service: "DYNAMIC", protocol: "TCP/UDP", description: "Dynamic/Private Port", risk: "low" },
          { port: 49155, service: "DYNAMIC", protocol: "TCP/UDP", description: "Dynamic/Private Port", risk: "low" },
          { port: 49156, service: "DYNAMIC", protocol: "TCP/UDP", description: "Dynamic/Private Port", risk: "low" },
          { port: 49157, service: "DYNAMIC", protocol: "TCP/UDP", description: "Dynamic/Private Port", risk: "low" },
          { port: 50000, service: "SAP", protocol: "TCP", description: "SAP Services", risk: "low" },
          { port: 50001, service: "SAP", protocol: "TCP", description: "SAP Services", risk: "low" },
          { port: 50002, service: "SAP", protocol: "TCP", description: "SAP Services", risk: "low" },
          { port: 50003, service: "SAP", protocol: "TCP", description: "SAP Services", risk: "low" },
          { port: 50004, service: "SAP", protocol: "TCP", description: "SAP Services", risk: "low" },
          { port: 50005, service: "SAP", protocol: "TCP", description: "SAP Services", risk: "low" }
        ];

        // Top 50 most common ports
        const TOP_PORTS = [
          20, 21, 22, 23, 25, 53, 67, 68, 69, 80, 88, 110, 111, 115, 123, 135, 137, 138, 139, 143,
          161, 162, 179, 194, 389, 443, 445, 464, 500, 514, 515, 520, 530, 543, 544, 546, 547, 548, 
          554, 587, 631, 636, 749, 873, 902, 989, 990, 993, 995, 1080
        ];

        // State
        let filteredPorts = [...PORT_DATABASE];
        let currentPage = 1;
        const itemsPerPage = 20;
        let searchQuery = '';
        let protocolFilter = 'all';
        let categoryFilter = 'all';

        // DOM Elements
        const searchInput = document.getElementById('port-search');
        const resultsBody = document.getElementById('results-body');
        const totalPortsEl = document.getElementById('total-ports');
        const filteredCountEl = document.getElementById('filtered-count');
        const paginationEl = document.getElementById('pagination');
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        const pageInfoEl = document.getElementById('page-info');
        const clearSearchBtn = document.getElementById('clear-search');
        const topPortsGrid = document.getElementById('top-ports-grid');
        const protocolFilters = document.querySelectorAll('.protocol-filter');
        const categoryFilters = document.querySelectorAll('.category-filter');

        // Utility: Get risk badge color
        function getRiskColor(risk) {
          switch (risk) {
            case 'critical': return 'bg-error-100 dark:bg-error-900 text-error-800 dark:text-error-200';
            case 'high': return 'bg-warning-100 dark:bg-warning-900 text-warning-800 dark:text-warning-200';
            case 'medium': return 'bg-warning-50 dark:bg-warning-900/50 text-warning-700 dark:text-warning-300';
            case 'low': return 'bg-success-100 dark:bg-success-900 text-success-800 dark:text-success-200';
            case 'none': return 'bg-success-100 dark:bg-success-900 text-success-800 dark:text-success-200';
            default: return 'bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200';
          }
        }

        // Utility: Get protocol color
        function getProtocolColor(protocol) {
          switch (protocol.toLowerCase()) {
            case 'tcp': return 'text-info-600 dark:text-info-400';
            case 'udp': return 'text-primary-600 dark:text-primary-400';
            case 'tcp/udp': return 'text-success-600 dark:text-success-400';
            default: return 'text-surface-600 dark:text-surface-400';
          }
        }

        // Filter ports based on search and filters
        function filterPorts() {
          filteredPorts = PORT_DATABASE.filter(port => {
            // Search filter
            const matchesSearch = !searchQuery || 
              port.port.toString().includes(searchQuery) ||
              port.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
              port.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (port.tags && port.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

            // Protocol filter
            const matchesProtocol = protocolFilter === 'all' || 
              port.protocol.toLowerCase().includes(protocolFilter.toLowerCase());

            // Category filter
            let matchesCategory = true;
            if (categoryFilter === 'well-known') {
              matchesCategory = port.port >= 0 && port.port <= 1023;
            } else if (categoryFilter === 'registered') {
              matchesCategory = port.port >= 1024 && port.port <= 49151;
            } else if (categoryFilter === 'dynamic') {
              matchesCategory = port.port >= 49152;
            }

            return matchesSearch && matchesProtocol && matchesCategory;
          });

          currentPage = 1;
          updateStats();
          renderResults();
        }

        // Update statistics
        function updateStats() {
          totalPortsEl.textContent = PORT_DATABASE.length;
          filteredCountEl.textContent = filteredPorts.length;
        }

        // Render results table
        function renderResults() {
          if (filteredPorts.length === 0) {
            resultsBody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-surface-500 dark:text-surface-400">No ports found matching your search.</td></tr>';
            paginationEl.classList.add('hidden');
            return;
          }

          const start = (currentPage - 1) * itemsPerPage;
          const end = start + itemsPerPage;
          const pagePorts = filteredPorts.slice(start, end);

          resultsBody.innerHTML = pagePorts.map(port => \`
            <tr class="hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
              <td class="py-2 pr-4 font-mono text-surface-900 dark:text-white">\${port.port}</td>
              <td class="py-2 pr-4 font-medium text-surface-900 dark:text-white">\${port.service}</td>
              <td class="py-2 pr-4 \${getProtocolColor(port.protocol)}">\${port.protocol}</td>
              <td class="py-2 pr-4 text-surface-600 dark:text-surface-400">
                \${port.description}
                \${port.tags ? '<span class="ml-2 text-xs text-surface-400">[' + port.tags.join(', ') + ']</span>' : ''}
              </td>
              <td class="py-2">
                <span class="px-2 py-1 rounded text-xs font-medium \${getRiskColor(port.risk)}">\${port.risk.toUpperCase()}</span>
              </td>
            </tr>
          \`).join('');

          // Update pagination
          const totalPages = Math.ceil(filteredPorts.length / itemsPerPage);
          if (totalPages > 1) {
            paginationEl.classList.remove('hidden');
            pageInfoEl.textContent = \`Page \${currentPage} of \${totalPages}\`;
            prevPageBtn.disabled = currentPage === 1;
            nextPageBtn.disabled = currentPage === totalPages;
          } else {
            paginationEl.classList.add('hidden');
          }
        }

        // Render top ports grid
        function renderTopPorts() {
          topPortsGrid.innerHTML = TOP_PORTS.map(port => {
            const portData = PORT_DATABASE.find(p => p.port === port);
            return \`
              <button class="top-port-btn p-2 bg-surface-50 dark:bg-surface-800 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors text-left"
                      data-port="\${port}">
                <span class="font-mono font-bold text-surface-900 dark:text-white">\${port}</span>
                <span class="block text-xs text-surface-500 dark:text-surface-400 truncate">\${portData ? portData.service : 'Unknown'}</span>
              </button>
            \`;
          }).join('');

          // Add click handlers
          document.querySelectorAll('.top-port-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              searchInput.value = btn.dataset.port;
              searchQuery = btn.dataset.port;
              filterPorts();
            });
          });
        }

        // Event Listeners
        searchInput.addEventListener('input', (e) => {
          searchQuery = e.target.value.trim();
          filterPorts();
        });

        clearSearchBtn.addEventListener('click', () => {
          searchInput.value = '';
          searchQuery = '';
          filterPorts();
        });

        protocolFilters.forEach(btn => {
          btn.addEventListener('click', () => {
            protocolFilters.forEach(b => {
              b.classList.remove('btn-primary', 'active');
              b.classList.add('btn-secondary');
            });
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary', 'active');
            protocolFilter = btn.dataset.protocol;
            filterPorts();
          });
        });

        categoryFilters.forEach(btn => {
          btn.addEventListener('click', () => {
            categoryFilters.forEach(b => {
              b.classList.remove('btn-primary', 'active');
              b.classList.add('btn-secondary');
            });
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary', 'active');
            categoryFilter = btn.dataset.category;
            filterPorts();
          });
        });

        prevPageBtn.addEventListener('click', () => {
          if (currentPage > 1) {
            currentPage--;
            renderResults();
          }
        });

        nextPageBtn.addEventListener('click', () => {
          const totalPages = Math.ceil(filteredPorts.length / itemsPerPage);
          if (currentPage < totalPages) {
            currentPage++;
            renderResults();
          }
        });

        // Initialize
        updateStats();
        renderResults();
        renderTopPorts();
      })();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    lang: currentLang,
    path: '/port-reference',
    content
  });
}
