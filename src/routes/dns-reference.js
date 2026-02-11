import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, getCopyToClipboardScript } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';

export async function handleDNSReferenceRoutes(request, url) {
  if (url.pathname !== '/dns-reference' && url.pathname !== '/dns-reference/') return null;
  if (request.method !== 'GET') return null;

  const title = 'DNS Record Reference';
  const description = 'Interactive reference for DNS record types with syntax, examples, and command builders.';

  const header = createToolHeader(
    { emoji: '📇' },
    title,
    'Comprehensive DNS record type reference with syntax examples, TTL recommendations, and command builders for dig and nslookup.',
    [
      { text: '<span data-i18n="tools.dns-reference.ui.badge0">Interactive</span>', tooltip: 'Click any record type to see detailed information and examples.' },
      { text: '<span data-i18n="tools.dns-reference.ui.badge1">Command Builder</span>', tooltip: 'Generate dig and nslookup commands with one click.' }
    ],
    { toolId: 'dns-reference' }
  );

  const currentTool = TOOLS.find(t => t.id === 'dns-reference');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="tool-card">
        ${header}

        <!-- Search Bar -->
        <div class="mb-6">
          <div class="relative">
            <input type="text" id="search-input" class="input w-full pl-10" placeholder="Search record types..." data-i18n-placeholder="tools.dns-reference.ui.placeholder0">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        <!-- Record Type Grid -->
        <div id="record-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
          ${recordTypeCards()}
        </div>

        <!-- Detail Panel -->
        <div id="detail-panel" class="hidden mb-8">
          <div class="bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800 p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <span id="detail-icon" class="text-3xl"></span>
                <div>
                  <h2 id="detail-title" class="text-xl font-bold text-surface-900 dark:text-white"></h2>
                  <p id="detail-category" class="text-sm text-surface-500 dark:text-surface-400"></p>
                </div>
              </div>
              <button id="close-detail" class="btn btn-ghost btn-sm" aria-label="Close details">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <h3 class="text-sm font-semibold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-2" data-i18n="tools.dns-reference.ui.heading0">Description</h3>
                  <p id="detail-description" class="text-surface-700 dark:text-surface-300"></p>
                </div>

                <div>
                  <h3 class="text-sm font-semibold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-2" data-i18n="tools.dns-reference.ui.heading1">Syntax Format</h3>
                  <code id="detail-syntax" class="block bg-surface-100 dark:bg-surface-900 p-3 rounded-lg text-sm font-mono text-primary-700 dark:text-primary-400 break-all"></code>
                </div>

                <div>
                  <h3 class="text-sm font-semibold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-2" data-i18n="tools.dns-reference.ui.heading2">Example</h3>
                  <pre class="bg-surface-900 text-surface-50 p-3 rounded-lg text-xs font-mono overflow-x-auto"><code id="detail-example"></code></pre>
                </div>
              </div>

              <div class="space-y-4">
                <div>
                  <h3 class="text-sm font-semibold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-2" data-i18n="tools.dns-reference.ui.heading3">Use Cases</h3>
                  <ul id="detail-use-cases" class="list-disc ml-5 text-surface-700 dark:text-surface-300 space-y-1"></ul>
                </div>

                <div>
                  <h3 class="text-sm font-semibold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-2" data-i18n="tools.dns-reference.ui.heading4">TTL Recommendation</h3>
                  <p id="detail-ttl" class="text-surface-700 dark:text-surface-300"></p>
                </div>

                <div>
                  <h3 class="text-sm font-semibold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-2" data-i18n="tools.dns-reference.ui.heading5">Security Notes</h3>
                  <p id="detail-security" class="text-surface-700 dark:text-surface-300"></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Command Builder -->
        <div class="bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800 p-6 mb-8">
          <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <span data-i18n="tools.dns-reference.ui.heading6">Command Builder</span>
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label class="label" data-i18n="tools.dns-reference.ui.label0">Record Type</label>
              <select id="cmd-record-type" class="input w-full">
                <option value="A">A</option>
                <option value="AAAA">AAAA</option>
                <option value="CNAME">CNAME</option>
                <option value="MX">MX</option>
                <option value="TXT">TXT</option>
                <option value="NS">NS</option>
                <option value="SOA">SOA</option>
                <option value="PTR">PTR</option>
                <option value="SRV">SRV</option>
                <option value="CAA">CAA</option>
                <option value="DS">DS</option>
                <option value="DNSKEY">DNSKEY</option>
              </select>
            </div>
            <div>
              <label class="label" data-i18n="tools.dns-reference.ui.label1">Domain</label>
              <input type="text" id="cmd-domain" class="input w-full" placeholder="example.com" data-i18n-placeholder="tools.dns-reference.ui.placeholder1">
            </div>
            <div>
              <label class="label" data-i18n="tools.dns-reference.ui.label2">DNS Server (optional)</label>
              <input type="text" id="cmd-server" class="input w-full" placeholder="8.8.8.8" data-i18n-placeholder="tools.dns-reference.ui.placeholder2">
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-surface-700 dark:text-surface-300" data-i18n="tools.dns-reference.ui.label3">dig Command</label>
                <button id="copy-dig" class="btn btn-ghost btn-xs" data-i18n="tools.dns-reference.ui.button0">Copy</button>
              </div>
              <pre class="bg-surface-900 text-surface-50 p-3 rounded-lg text-xs font-mono overflow-x-auto"><code id="dig-output">dig example.com A</code></pre>
            </div>
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-surface-700 dark:text-surface-300" data-i18n="tools.dns-reference.ui.label4">nslookup Command</label>
                <button id="copy-nslookup" class="btn btn-ghost btn-xs" data-i18n="tools.dns-reference.ui.button1">Copy</button>
              </div>
              <pre class="bg-surface-900 text-surface-50 p-3 rounded-lg text-xs font-mono overflow-x-auto"><code id="nslookup-output">nslookup -type=A example.com</code></pre>
            </div>
          </div>
        </div>

        ${createCheatsheet('dns-reference', '<span data-i18n="tools.dns-reference.ui.heading7">DNS Hierarchy</span>', [
          {
            heading: '<span data-i18n="tools.dns-reference.ui.heading8">Root Zone</span>',
            content: `
              <p data-i18n="tools.dns-reference.ui.desc0">The DNS hierarchy starts at the root (.) — 13 logical root name servers (a.root-servers.net through m.root-servers.net) handle queries for top-level domains.</p>
            `
          },
          {
            heading: '<span data-i18n="tools.dns-reference.ui.heading9">Top-Level Domains (TLDs)</span>',
            content: `
              <p data-i18n="tools.dns-reference.ui.desc1">Managed by registries. Examples: .com, .org, .net (generic), .uk, .de (country-code), .app, .dev (new gTLDs). TLD servers delegate to authoritative name servers for each domain.</p>
            `
          },
          {
            heading: '<span data-i18n="tools.dns-reference.ui.heading10">Authoritative Name Servers</span>',
            content: `
              <p data-i18n="tools.dns-reference.ui.desc2">These servers hold the actual DNS records for a domain. NS records point to them. They're the final authority for queries about that domain's records.</p>
            `
          },
          {
            heading: '<span data-i18n="tools.dns-reference.ui.heading11">DNS Resolution Flow</span>',
            content: `
              <ol class="list-decimal ml-6 space-y-1">
                <li data-i18n="tools.dns-reference.ui.desc3">Stub resolver checks local cache</li>
                <li data-i18n="tools.dns-reference.ui.desc4">Query recursive resolver (ISP or public DNS like 8.8.8.8)</li>
                <li data-i18n="tools.dns-reference.ui.desc5">Recursive resolver queries root servers</li>
                <li data-i18n="tools.dns-reference.ui.desc6">Root refers to TLD servers</li>
                <li data-i18n="tools.dns-reference.ui.desc7">TLD refers to authoritative name servers</li>
                <li data-i18n="tools.dns-reference.ui.desc8">Authoritative server returns the record</li>
                <li data-i18n="tools.dns-reference.ui.desc9">Result is cached at each level</li>
              </ol>
            `
          }
        ])}
      </div>
      ${createRelatedToolsSection(relatedToolsData)}
    </main>
  `;

  const scripts = `
    ${getCopyToClipboardScript()}
    <script>
      const t = (k, fb) => (window._t ? window._t('tools.dns-reference.js.' + k, fb) : (fb || k));

      // DNS Record Type Data
      const recordTypes = {
        A: {
          icon: '🌐',
          category: 'Address',
          description: 'Maps a domain name to an IPv4 address. The most fundamental DNS record type used to direct traffic to web servers.',
          syntax: 'name TTL IN A ipv4-address',
          example: 'www.example.com. 300 IN A 192.0.2.1',
          useCases: [
            'Pointing domain to web server',
            'Load balancing with multiple A records',
            'Subdomain routing'
          ],
          ttl: '300-3600 seconds (5 min - 1 hour). Lower for dynamic IPs, higher for static.',
          security: 'Consider DNSSEC to prevent spoofing. Use short TTLs during migrations.'
        },
        AAAA: {
          icon: '🌍',
          category: 'Address',
          description: 'Maps a domain name to an IPv6 address. Essential for IPv6-enabled networks and future-proofing.',
          syntax: 'name TTL IN AAAA ipv6-address',
          example: 'www.example.com. 300 IN AAAA 2001:db8::1',
          useCases: [
            'IPv6-enabled websites',
            'Dual-stack configurations',
            'Modern network infrastructure'
          ],
          ttl: '300-3600 seconds (5 min - 1 hour). Match A record TTL for consistency.',
          security: 'Ensure both A and AAAA records point to equivalent services. Monitor for IPv6-only connectivity issues.'
        },
        CNAME: {
          icon: '🔗',
          category: 'Alias',
          description: 'Creates an alias from one domain name to another (canonical name). Cannot coexist with other records at the same name.',
          syntax: 'alias TTL IN CNAME canonical-name',
          example: 'blog.example.com. 3600 IN CNAME www.example.com.',
          useCases: [
            'Subdomain aliasing',
            'CDN integration',
            'Platform-as-a-Service hosting (Heroku, Vercel, etc.)'
          ],
          ttl: '3600-86400 seconds (1-24 hours). Higher is fine as CNAMEs change rarely.',
          security: 'Avoid CNAME at apex (root) domain — use ALIAS/ANAME if provider supports it. Beware of CNAME flattening side effects.'
        },
        MX: {
          icon: '📧',
          category: 'Mail',
          description: 'Specifies mail servers responsible for accepting email on behalf of a domain. Includes priority value.',
          syntax: 'name TTL IN MX priority mail-server',
          example: 'example.com. 3600 IN MX 10 mail.example.com.',
          useCases: [
            'Primary and backup mail servers (use priorities)',
            'Third-party email services (Google Workspace, Microsoft 365)',
            'Email routing configuration'
          ],
          ttl: '3600-86400 seconds (1-24 hours). Mail routing changes are infrequent.',
          security: 'Always have at least one MX record. Use SPF, DKIM, and DMARC for email authentication.'
        },
        TXT: {
          icon: '📝',
          category: 'Text',
          description: 'Stores arbitrary text data. Widely used for domain verification, SPF, DKIM, and DMARC policies.',
          syntax: 'name TTL IN TXT "text-content"',
          example: 'example.com. 3600 IN TXT "v=spf1 include:_spf.google.com ~all"',
          useCases: [
            'SPF records (email sender policy)',
            'Domain ownership verification',
            'DKIM public keys',
            'DMARC policies',
            'Arbitrary notes'
          ],
          ttl: '3600-86400 seconds (1-24 hours). DKIM keys may need rotation.',
          security: 'Keep TXT records under 255 characters per string (multiple strings allowed). Monitor for unauthorized SPF/DKIM records.'
        },
        NS: {
          icon: '🖥️',
          category: 'Infrastructure',
          description: 'Specifies authoritative name servers for a domain or zone delegation. Critical for DNS resolution.',
          syntax: 'zone TTL IN NS nameserver',
          example: 'example.com. 86400 IN NS ns1.example.com.',
          useCases: [
            'Delegating to authoritative name servers',
            'Subdomain delegation',
            'Zone transfers'
          ],
          ttl: '86400-172800 seconds (24-48 hours). Very high TTL recommended.',
          security: 'Maintain at least 2 NS records. Keep secondary DNS servers on separate networks. Monitor for unauthorized changes.'
        },
        SOA: {
          icon: '📋',
          category: 'Infrastructure',
          description: 'Start of Authority — specifies administrative information about a DNS zone. Exactly one per zone.',
          syntax: 'zone TTL IN SOA primary-ns admin-email serial refresh retry expire minimum',
          example: 'example.com. 3600 IN SOA ns1.example.com. admin.example.com. 2024010101 3600 600 604800 86400',
          useCases: [
            'Zone administration',
            'Serial number for zone transfers',
            'Negative caching (minimum TTL)'
          ],
          ttl: '3600-86400 seconds (1-24 hours).',
          security: 'Increment serial number on every zone change. Keep admin email current. Set reasonable refresh/retry intervals.'
        },
        PTR: {
          icon: '🔙',
          category: 'Reverse',
          description: 'Pointer record — maps an IP address to a domain name (reverse of A/AAAA). Used for reverse DNS lookups.',
          syntax: 'reverse-ip TTL IN PTR hostname',
          example: '1.2.0.192.in-addr.arpa. 3600 IN PTR www.example.com.',
          useCases: [
            'Reverse DNS for mail servers',
            'Network troubleshooting',
            'IP reputation checking'
          ],
          ttl: '3600-86400 seconds (1-24 hours).',
          security: 'Ensure PTR records match A/AAAA records (forward-confirmed reverse DNS). Many mail servers require valid PTR.'
        },
        SRV: {
          icon: '🎯',
          category: 'Service',
          description: 'Service locator — specifies the location (hostname and port) of servers for specific services.',
          syntax: '_service._proto.name TTL IN SRV priority weight port target',
          example: '_sip._tcp.example.com. 3600 IN SRV 10 5 5060 sipserver.example.com.',
          useCases: [
            'SIP/XMPP service discovery',
            'Microsoft 365 service configuration',
            'Kerberos and LDAP service location'
          ],
          ttl: '3600-86400 seconds (1-24 hours).',
          security: 'Use meaningful priority/weight values. Ensure target host has appropriate A/AAAA records.'
        },
        CAA: {
          icon: '🔒',
          category: 'Security',
          description: 'Certification Authority Authorization — specifies which CAs are allowed to issue certificates for a domain.',
          syntax: 'name TTL IN CAA flags tag value',
          example: 'example.com. 86400 IN CAA 0 issue "letsencrypt.org"',
          useCases: [
            'Restricting certificate issuance',
            'Preventing unauthorized certificate requests',
            'Multi-CA environments'
          ],
          ttl: '86400 seconds (24 hours). Changes rarely.',
          security: 'Set CAA records to prevent misissued certificates. Include both issue and issuewild tags. Add iodef for violation reporting.'
        },
        DKIM: {
          icon: '✉️',
          category: 'Email Security',
          description: 'DomainKeys Identified Mail — cryptographically signs emails to verify sender authenticity. Implemented as TXT records.',
          syntax: 'selector._domainkey.name TTL IN TXT "v=DKIM1; k=rsa; p=public-key"',
          example: 'default._domainkey.example.com. 3600 IN TXT "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..."',
          useCases: [
            'Email authentication',
            'Preventing email spoofing',
            'Improving email deliverability'
          ],
          ttl: '3600-86400 seconds (1-24 hours).',
          security: 'Rotate keys periodically. Keep private keys secure. Use key length of 2048 bits or more.'
        },
        SPF: {
          icon: '🛡️',
          category: 'Email Security',
          description: 'Sender Policy Framework — specifies which mail servers are authorized to send email for a domain. Implemented as TXT records.',
          syntax: 'name TTL IN TXT "v=spf1 mechanisms qualifiers"',
          example: 'example.com. 3600 IN TXT "v=spf1 include:_spf.google.com include:mailgun.org ~all"',
          useCases: [
            'Preventing email spoofing',
            'Authorizing third-party senders',
            'Email deliverability improvement'
          ],
          ttl: '3600-86400 seconds (1-24 hours).',
          security: 'Use ~all (soft fail) during testing, -all (hard fail) when confident. Avoid +all. Keep lookups under 10.'
        },
        DMARC: {
          icon: '📊',
          category: 'Email Security',
          description: 'Domain-based Message Authentication — policy framework for handling SPF/DKIM failures. Implemented as TXT records.',
          syntax: 'name TTL IN TXT "v=DMARC1; p=policy; rua=reporting-uri"',
          example: '_dmarc.example.com. 86400 IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"',
          useCases: [
            'Email authentication policy',
            'Aggregate and forensic reporting',
            'Protecting against domain spoofing'
          ],
          ttl: '86400 seconds (24 hours).',
          security: 'Start with p=none to monitor, then progress to quarantine, then reject. Set up reporting email address.'
        },
        DS: {
          icon: '🔐',
          category: 'DNSSEC',
          description: 'Delegation Signer — holds the hash of a DNSKEY record. Used to establish chain of trust in DNSSEC.',
          syntax: 'name TTL IN DS key-tag algorithm digest-type digest',
          example: 'example.com. 86400 IN DS 12345 8 2 49FD46E6C4B45C55D4AC...',
          useCases: [
            'DNSSEC chain of trust',
            'Parent zone delegation signing',
            'Secure delegation'
          ],
          ttl: '86400 seconds (24 hours). Very stable.',
          security: 'Keep DS records in sync with DNSKEY. Use algorithm 13 (ECDSA) or 8 (RSA/SHA-256). Update parent zone when rotating keys.'
        },
        DNSKEY: {
          icon: '🔑',
          category: 'DNSSEC',
          description: 'DNS Public Key — contains the public key used to verify DNSSEC signatures. Stored in the child zone.',
          syntax: 'name TTL IN DNSKEY flags protocol algorithm public-key',
          example: 'example.com. 3600 IN DNSKEY 256 3 13 oJB1W6W...',
          useCases: [
            'Zone signing',
            'DNSSEC validation',
            'Key rollover'
          ],
          ttl: '3600-86400 seconds (1-24 hours).',
          security: 'Separate ZSK (Zone Signing Key) and KSK (Key Signing Key). Use algorithm 13 for efficiency. Monitor for unauthorized keys.'
        }
      };

      // UI Elements
      const searchInput = document.getElementById('search-input');
      const recordGrid = document.getElementById('record-grid');
      const detailPanel = document.getElementById('detail-panel');
      const closeDetail = document.getElementById('close-detail');

      // Detail elements
      const detailIcon = document.getElementById('detail-icon');
      const detailTitle = document.getElementById('detail-title');
      const detailCategory = document.getElementById('detail-category');
      const detailDescription = document.getElementById('detail-description');
      const detailSyntax = document.getElementById('detail-syntax');
      const detailExample = document.getElementById('detail-example');
      const detailUseCases = document.getElementById('detail-use-cases');
      const detailTtl = document.getElementById('detail-ttl');
      const detailSecurity = document.getElementById('detail-security');

      // Command builder elements
      const cmdRecordType = document.getElementById('cmd-record-type');
      const cmdDomain = document.getElementById('cmd-domain');
      const cmdServer = document.getElementById('cmd-server');
      const digOutput = document.getElementById('dig-output');
      const nslookupOutput = document.getElementById('nslookup-output');
      const copyDig = document.getElementById('copy-dig');
      const copyNslookup = document.getElementById('copy-nslookup');

      // Search functionality
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const cards = recordGrid.querySelectorAll('.record-card');
        cards.forEach(card => {
          const type = card.dataset.type.toLowerCase();
          const category = card.dataset.category.toLowerCase();
          const match = type.includes(query) || category.includes(query);
          card.style.display = match ? '' : 'none';
        });
      });

      // Show record details
      function showRecordDetails(type) {
        const record = recordTypes[type];
        if (!record) return;

        detailIcon.textContent = record.icon;
        detailTitle.textContent = type;
        detailCategory.textContent = record.category;
        detailDescription.textContent = record.description;
        detailSyntax.textContent = record.syntax;
        detailExample.textContent = record.example;
        detailTtl.textContent = record.ttl;
        detailSecurity.textContent = record.security;

        detailUseCases.innerHTML = '';
        record.useCases.forEach(useCase => {
          const li = document.createElement('li');
          li.textContent = useCase;
          detailUseCases.appendChild(li);
        });

        detailPanel.classList.remove('hidden');
        detailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Record card click handlers
      recordGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.record-card');
        if (card) {
          showRecordDetails(card.dataset.type);
        }
      });

      // Close detail panel
      closeDetail.addEventListener('click', () => {
        detailPanel.classList.add('hidden');
      });

      // Command builder
      function updateCommands() {
        const type = cmdRecordType.value;
        const domain = cmdDomain.value.trim() || 'example.com';
        const server = cmdServer.value.trim();

        let digCmd = server 
          ? 'dig @' + server + ' ' + domain + ' ' + type
          : 'dig ' + domain + ' ' + type;
        
        let nslookupCmd = 'nslookup -type=' + type + ' ' + domain;
        if (server) {
          nslookupCmd += ' ' + server;
        }

        digOutput.textContent = digCmd;
        nslookupOutput.textContent = nslookupCmd;
      }

      cmdRecordType.addEventListener('change', updateCommands);
      cmdDomain.addEventListener('input', updateCommands);
      cmdServer.addEventListener('input', updateCommands);

      // Copy buttons
      copyDig.addEventListener('click', () => {
        copyToClipboard(digOutput.textContent, copyDig);
      });

      copyNslookup.addEventListener('click', () => {
        copyToClipboard(nslookupOutput.textContent, copyNslookup);
      });

      // Initialize
      updateCommands();
    </script>
  `;

  return respondHTML(createPageTemplate({
    title,
    description,
    path: '/dns-reference',
    content,
    scripts
  }));
}

function recordTypeCards() {
  const records = [
    { type: 'A', icon: '🌐', category: 'Address' },
    { type: 'AAAA', icon: '🌍', category: 'Address' },
    { type: 'CNAME', icon: '🔗', category: 'Alias' },
    { type: 'MX', icon: '📧', category: 'Mail' },
    { type: 'TXT', icon: '📝', category: 'Text' },
    { type: 'NS', icon: '🖥️', category: 'Infrastructure' },
    { type: 'SOA', icon: '📋', category: 'Infrastructure' },
    { type: 'PTR', icon: '🔙', category: 'Reverse' },
    { type: 'SRV', icon: '🎯', category: 'Service' },
    { type: 'CAA', icon: '🔒', category: 'Security' },
    { type: 'DKIM', icon: '✉️', category: 'Email Security' },
    { type: 'SPF', icon: '🛡️', category: 'Email Security' },
    { type: 'DMARC', icon: '📊', category: 'Email Security' },
    { type: 'DS', icon: '🔐', category: 'DNSSEC' },
    { type: 'DNSKEY', icon: '🔑', category: 'DNSSEC' }
  ];

  return records.map(r => `
    <button class="record-card bg-surface-50 dark:bg-surface-950 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-surface-200 dark:border-surface-800 hover:border-primary-300 dark:hover:border-primary-700 rounded-lg p-4 text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
      data-type="${r.type}" data-category="${r.category}" data-i18n-title="tools.dns-reference.ui.title.${r.type}" title="Click to view ${r.type} details">
      <div class="text-2xl mb-1">${r.icon}</div>
      <div class="font-bold text-surface-900 dark:text-white">${r.type}</div>
      <div class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.dns-reference.ui.category.${r.type}">${r.category}</div>
    </button>
  `).join('');
}
