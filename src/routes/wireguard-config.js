/**
 * WireGuard Config Studio
 * Generate, parse, and manage WireGuard configurations client-side
 * All key generation happens locally using libsodium.js
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';

export async function handleWireguardConfigRoutes(request, url) {
  if (url.pathname !== '/wireguard-config' && url.pathname !== '/wireguard-config/') return null;
  if (request.method !== 'GET') return null;
  return respondHTML(renderWireguardConfigPage());
}

function renderWireguardConfigPage() {
  const toolHeader = createToolHeader(
    { emoji: '🔒' },
    'WireGuard Config Studio',
    'Generate WireGuard configurations with local key generation, template quick-starts, and QR code export.',
    [
      { text: 'Client-Side Keys', color: 'green', tooltip: 'All private keys generated locally in your browser using libsodium.js. Keys never leave your device.' },
      { text: 'QR Export', color: 'purple', tooltip: 'Export configs as QR codes for easy mobile import.' },
      { text: 'Template Wizard', color: 'blue', tooltip: 'Quick-start templates for common network topologies.' }
    ],
    { toolId: 'wireguard-config' }
  );

  const currentTool = TOOLS.find(t => t.id === 'wireguard-config');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <!-- Libsodium for WireGuard key generation -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/libsodium.js/0.7.13/sodium.min.js" 
      integrity="sha384-ZSs6LKr2GoUPDyHrN+rCQgyHL1yUyok5xMniSrgeRG7rUvA6vTmxronM1eZOfjgz" 
      crossorigin="anonymous"></script>
    <script src="/vendor/qrcode.min.js" integrity="sha384-B3w4ObQEXH2D3E8FlVZ+pBTHHTrPFwqbXjfU/95D5ekt8DVTeG+cB6s6nVpsvh3m" crossorigin="anonymous"></script>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="tool-card">

        ${toolHeader}

        <!-- Security Notice -->
        <div class="mb-6 p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
          <div class="flex items-start gap-3">
            <span class="text-2xl">🔐</span>
            <div>
              <h2 class="text-sm font-bold text-success-900 dark:text-success-300 mb-1" data-i18n="tools.wireguard-config.ui.heading0">100% Client-Side Key Generation</h2>
              <p class="text-xs text-success-800 dark:text-success-200" data-i18n="tools.wireguard-config.ui.desc0">
                Private keys are generated using libsodium.js directly in your browser. Keys never leave your device.
              </p>
            </div>
          </div>
        </div>

        <!-- Key Generation Section -->
        <div class="mb-8 p-5 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl">
          <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <span class="text-xl">🗝️</span>
              <span data-i18n="tools.wireguard-config.ui.heading1">Key Pair Generator</span>
            </h2>
            <button id="generate-keys-btn" class="btn btn-primary">
              <span data-i18n="tools.wireguard-config.ui.button0">Generate Key Pair</span>
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Private Key -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase" data-i18n="tools.wireguard-config.ui.label0">Private Key</label>
                <div class="flex gap-2">
                  <button id="toggle-private-key" class="btn btn-ghost btn-xs" data-i18n="tools.wireguard-config.ui.button1">Show</button>
                  <button id="copy-private-key" class="btn btn-secondary btn-xs" data-i18n="tools.wireguard-config.ui.button2">Copy</button>
                </div>
              </div>
              <input type="password" id="private-key" readonly 
                class="w-full p-3 bg-error-50 dark:bg-error-900/10 border border-error-200 dark:border-error-900 rounded-lg font-mono text-sm text-surface-900 dark:text-surface-100"
                placeholder="Click Generate to create..." data-i18n-placeholder="tools.wireguard-config.ui.placeholder0">
              <p class="mt-1 text-xs text-error-600 dark:text-error-400" data-i18n="tools.wireguard-config.ui.warning0">⚠️ Never share your private key!</p>
            </div>

            <!-- Public Key -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase" data-i18n="tools.wireguard-config.ui.label1">Public Key</label>
                <button id="copy-public-key" class="btn btn-secondary btn-xs" data-i18n="tools.wireguard-config.ui.button2">Copy</button>
              </div>
              <input type="text" id="public-key" readonly 
                class="w-full p-3 bg-surface-100 dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg font-mono text-sm text-surface-900 dark:text-surface-100"
                placeholder="Generated from private key..." data-i18n-placeholder="tools.wireguard-config.ui.placeholder1">
            </div>
          </div>
        </div>

        <!-- Template Quick Start -->
        <div class="mb-8">
          <label class="label mb-2" data-i18n="tools.wireguard-config.ui.label2">Template Quick Start</label>
          <select id="template-select" class="input">
            <option value="" data-i18n="tools.wireguard-config.ui.option0">-- Select a template --</option>
            <option value="p2p-client" data-i18n="tools.wireguard-config.ui.option1">Point-to-Point (Client)</option>
            <option value="p2p-server" data-i18n="tools.wireguard-config.ui.option2">Point-to-Point (Server)</option>
            <option value="hub-hub" data-i18n="tools.wireguard-config.ui.option3">Hub-and-Spoke (Hub)</option>
            <option value="hub-spoke" data-i18n="tools.wireguard-config.ui.option4">Hub-and-Spoke (Spoke)</option>
            <option value="site-to-site" data-i18n="tools.wireguard-config.ui.option5">Site-to-Site</option>
            <option value="road-warrior" data-i18n="tools.wireguard-config.ui.option6">Road Warrior (Split Tunnel)</option>
          </select>
        </div>

        <!-- Main Config Builder -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <!-- Left: Builder Form -->
          <div class="space-y-6">
            
            <!-- [Interface] Section -->
            <div class="p-5 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl">
              <h3 class="text-base font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <span class="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs font-mono">[Interface]</span>
              </h3>
              
              <div class="space-y-4">
                <div>
                  <label for="iface-private-key" class="label" data-i18n="tools.wireguard-config.ui.label3">PrivateKey</label>
                  <input type="text" id="iface-private-key" class="input font-mono text-sm" placeholder="Base64-encoded private key..." data-i18n-placeholder="tools.wireguard-config.ui.placeholder2">
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label for="iface-address" class="label">
                      <span data-i18n="tools.wireguard-config.ui.label4">Address</span>
                      ${infoHint('IP address with CIDR, e.g., 10.0.0.2/24')}
                    </label>
                    <input type="text" id="iface-address" class="input font-mono text-sm" placeholder="10.0.0.2/24" data-i18n-placeholder="tools.wireguard-config.ui.placeholder3">
                  </div>
                  <div>
                    <label for="iface-listen-port" class="label" data-i18n="tools.wireguard-config.ui.label5">ListenPort</label>
                    <input type="number" id="iface-listen-port" class="input font-mono text-sm" placeholder="51820" min="1" max="65535" data-i18n-placeholder="tools.wireguard-config.ui.placeholder4">
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label for="iface-dns" class="label">
                      <span data-i18n="tools.wireguard-config.ui.label6">DNS</span>
                      ${infoHint('Optional. Comma-separated DNS servers.')}
                    </label>
                    <input type="text" id="iface-dns" class="input font-mono text-sm" placeholder="1.1.1.1, 8.8.8.8" data-i18n-placeholder="tools.wireguard-config.ui.placeholder5">
                  </div>
                  <div>
                    <label for="iface-mtu" class="label">
                      <span data-i18n="tools.wireguard-config.ui.label7">MTU</span>
                      ${infoHint('Default: 1420 for IPv4, 1400 for IPv6')}
                    </label>
                    <input type="number" id="iface-mtu" class="input font-mono text-sm" placeholder="1420" min="576" max="9000" data-i18n-placeholder="tools.wireguard-config.ui.placeholder6">
                  </div>
                </div>

                <div>
                  <label for="iface-post-up" class="label">
                    <span data-i18n="tools.wireguard-config.ui.label8">PostUp</span>
                    ${infoHint('Command to run after interface is brought up.')}
                  </label>
                  <input type="text" id="iface-post-up" class="input font-mono text-sm" placeholder="iptables -A FORWARD -i %i -j ACCEPT..." data-i18n-placeholder="tools.wireguard-config.ui.placeholder7">
                </div>

                <div>
                  <label for="iface-post-down" class="label">
                    <span data-i18n="tools.wireguard-config.ui.label9">PostDown</span>
                    ${infoHint('Command to run after interface is brought down.')}
                  </label>
                  <input type="text" id="iface-post-down" class="input font-mono text-sm" placeholder="iptables -D FORWARD -i %i -j ACCEPT..." data-i18n-placeholder="tools.wireguard-config.ui.placeholder8">
                </div>
              </div>
            </div>

            <!-- [Peer] Section(s) -->
            <div id="peers-container" class="space-y-4">
              <!-- Peers will be added here dynamically -->
            </div>

            <!-- Add Peer Button -->
            <button id="add-peer-btn" class="btn btn-secondary w-full">
              <span class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                <span data-i18n="tools.wireguard-config.ui.button3">Add Peer</span>
              </span>
            </button>

            <!-- Config Parser -->
            <div class="p-5 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl">
              <h3 class="text-base font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <span data-i18n="tools.wireguard-config.ui.heading2">📥 Config Parser</span>
              </h3>
              <p class="text-xs text-surface-500 dark:text-surface-400 mb-3" data-i18n="tools.wireguard-config.ui.desc1">Paste an existing .conf file to populate the form.</p>
              <textarea id="config-parser-input" rows="6" class="input font-mono text-sm resize-vertical" 
                placeholder="[Interface]\nPrivateKey = ...\nAddress = ..." data-i18n-placeholder="tools.wireguard-config.ui.placeholder9"></textarea>
              <button id="parse-config-btn" class="btn btn-primary w-full mt-3" data-i18n="tools.wireguard-config.ui.button4">Parse Configuration</button>
            </div>
          </div>

          <!-- Right: Preview Panel -->
          <div class="space-y-6">
            <!-- Live Config Preview -->
            <div class="p-5 bg-surface-900 dark:bg-black border border-surface-800 rounded-xl">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-semibold text-white flex items-center gap-2">
                  <span>📝</span>
                  <span data-i18n="tools.wireguard-config.ui.heading3">Configuration Preview</span>
                </h3>
                <div class="flex gap-2">
                  <button id="copy-config-btn" class="btn btn-ghost btn-xs text-surface-300 hover:text-white" data-i18n="tools.wireguard-config.ui.button5">Copy</button>
                  <button id="download-config-btn" class="btn btn-primary btn-xs" data-i18n="tools.wireguard-config.ui.button6">Download .conf</button>
                </div>
              </div>
              <pre id="config-preview" class="font-mono text-sm text-surface-300 overflow-x-auto whitespace-pre-wrap min-h-[300px]" data-i18n="tools.wireguard-config.ui.text0"># Configure your interface to see the output...</pre>
            </div>

            <!-- QR Code -->
            <div class="p-5 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                  <span>📱</span>
                  <span data-i18n="tools.wireguard-config.ui.heading4">QR Code</span>
                </h3>
                <button id="generate-qr-btn" class="btn btn-primary btn-sm" data-i18n="tools.wireguard-config.ui.button7">Generate QR</button>
              </div>
              <div id="qr-container" class="flex items-center justify-center p-8 bg-white rounded-lg">
                <p class="text-surface-400 text-sm" data-i18n="tools.wireguard-config.ui.desc2">Generate a config to create QR code</p>
              </div>
              <p class="mt-3 text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.wireguard-config.ui.desc3">Scan with the WireGuard mobile app to import configuration.</p>
            </div>

            <!-- Validation Status -->
            <div id="validation-status" class="hidden p-4 rounded-lg border">
              <div class="flex items-start gap-3">
                <span id="validation-icon"></span>
                <div>
                  <h4 id="validation-title" class="font-semibold text-sm"></h4>
                  <ul id="validation-messages" class="mt-1 text-xs space-y-1"></ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        ${createCheatsheet('wireguard-config', 'WireGuard Quick Reference', [
          { heading: 'Interface Fields', content: `
            <table>
              <tr><th>Field</th><th>Required</th><th>Description</th></tr>
              <tr><td><code>PrivateKey</code></td><td>Yes</td><td>Base64 private key for this peer</td></tr>
              <tr><td><code>Address</code></td><td>Yes</td><td>CIDR IP address(es), comma-separated</td></tr>
              <tr><td><code>ListenPort</code></td><td>No</td><td>UDP port to listen on (server only)</td></tr>
              <tr><td><code>DNS</code></td><td>No</td><td>DNS servers to use</td></tr>
              <tr><td><code>MTU</code></td><td>No</td><td>Maximum transmission unit (default: 1420)</td></tr>
              <tr><td><code>PostUp</code></td><td>No</td><td>Command after interface up</td></tr>
              <tr><td><code>PostDown</code></td><td>No</td><td>Command after interface down</td></tr>
            </table>` },
          { heading: 'Peer Fields', content: `
            <table>
              <tr><th>Field</th><th>Required</th><th>Description</th></tr>
              <tr><td><code>PublicKey</code></td><td>Yes</td><td>Base64 public key of remote peer</td></tr>
              <tr><td><code>PresharedKey</code></td><td>No</td><td>Additional symmetric key for quantum resistance</td></tr>
              <tr><td><code>AllowedIPs</code></td><td>Yes</td><td>CIDRs this peer can route (0.0.0.0/0 for all)</td></tr>
              <tr><td><code>Endpoint</code></td><td>No</td><td>host:port of remote peer (client only)</td></tr>
              <tr><td><code>PersistentKeepalive</code></td><td>No</td><td>Seconds between keepalive packets (NAT)</td></tr>
            </table>` },
          { heading: 'Common Commands', content: `
            <table>
              <tr><th>Command</th><th>Description</th></tr>
              <tr><td><code>wg genkey | tee private.key | wg pubkey > public.key</code></td><td>Generate key pair</td></tr>
              <tr><td><code>wg-quick up wg0</code></td><td>Start interface</td></tr>
              <tr><td><code>wg-quick down wg0</code></td><td>Stop interface</td></tr>
              <tr><td><code>wg show</code></td><td>Show interface status</td></tr>
              <tr><td><code>wg showconf wg0</code></td><td>Dump current config</td></tr>
            </table>` },
          { heading: 'Template Types', content: `
            <table>
              <tr><th>Topology</th><th>Use Case</th></tr>
              <tr><td><code>Point-to-Point</code></td><td>Direct connection between two peers</td></tr>
              <tr><td><code>Hub-and-Spoke</code></td><td>Central server with multiple clients</td></tr>
              <tr><td><code>Site-to-Site</code></td><td>Connect two networks</td></tr>
              <tr><td><code>Road Warrior</code></td><td>Remote client with split tunneling</td></tr>
            </table>` }
        ])}

        ${createRelatedToolsSection(relatedToolsData)}
      </div>
    </main>
  `;

  const script = `
    <script>
      // Wait for libsodium to load
      let sodiumReady = false;
      
      async function initSodium() {
        if (typeof sodium !== 'undefined') {
          await sodium.ready;
          sodiumReady = true;
        }
      }
      
      // Try to init immediately or wait
      if (typeof sodium !== 'undefined') {
        initSodium();
      } else {
        window.addEventListener('load', initSodium);
      }

      // Peer counter for unique IDs
      let peerCounter = 0;
      const peers = new Map();

      // Key Generation
      document.getElementById('generate-keys-btn').addEventListener('click', async () => {
        if (!sodiumReady && typeof sodium !== 'undefined') {
          await sodium.ready;
          sodiumReady = true;
        }
        
        if (!sodiumReady) {
          showValidation('error', ['Libsodium library not loaded. Please refresh the page.']);
          return;
        }

        try {
          // Generate key pair using libsodium
          const keyPair = sodium.crypto_box_keypair();
          const privateKey = sodium.to_base64(keyPair.privateKey, sodium.base64_variants.ORIGINAL);
          const publicKey = sodium.to_base64(keyPair.publicKey, sodium.base64_variants.ORIGINAL);

          document.getElementById('private-key').value = privateKey;
          document.getElementById('public-key').value = publicKey;
          
          // Also fill in the interface private key if empty
          const ifacePrivateKey = document.getElementById('iface-private-key');
          if (!ifacePrivateKey.value) {
            ifacePrivateKey.value = privateKey;
          }
          
          updateConfigPreview();
          showValidation('success', ['Key pair generated successfully!']);
        } catch (error) {
          showValidation('error', ['Failed to generate keys: ' + error.message]);
        }
      });

      // Toggle private key visibility
      document.getElementById('toggle-private-key').addEventListener('click', () => {
        const input = document.getElementById('private-key');
        const btn = document.getElementById('toggle-private-key');
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = _t('tools.wireguard-config.js.text0', 'Hide');
        } else {
          input.type = 'password';
          btn.textContent = _t('tools.wireguard-config.js.text1', 'Show');
        }
      });

      // Copy buttons
      document.getElementById('copy-private-key').addEventListener('click', () => {
        copyToClipboard(document.getElementById('private-key').value, document.getElementById('copy-private-key'));
      });
      
      document.getElementById('copy-public-key').addEventListener('click', () => {
        copyToClipboard(document.getElementById('public-key').value, document.getElementById('copy-public-key'));
      });

      function copyToClipboard(text, btn) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
          const original = btn.textContent;
          btn.textContent = _t('common.copied', 'Copied!');
          setTimeout(() => btn.textContent = original, 2000);
        });
      }

      // Template Quick Start
      const templates = {
        'p2p-client': {
          iface: { address: '10.0.0.2/24', listenPort: '', dns: '1.1.1.1', mtu: '' },
          peers: [{ allowedIPs: '10.0.0.1/32', persistentKeepalive: '25' }]
        },
        'p2p-server': {
          iface: { address: '10.0.0.1/24', listenPort: '51820', dns: '', mtu: '' },
          peers: [{ allowedIPs: '10.0.0.2/32', persistentKeepalive: '' }]
        },
        'hub-hub': {
          iface: { address: '10.0.0.1/24', listenPort: '51820', dns: '', mtu: '' },
          peers: [
            { allowedIPs: '10.0.0.0/24', persistentKeepalive: '' }
          ]
        },
        'hub-spoke': {
          iface: { address: '10.0.0.10/24', listenPort: '', dns: '1.1.1.1', mtu: '' },
          peers: [{ allowedIPs: '10.0.0.0/24', persistentKeepalive: '25' }]
        },
        'site-to-site': {
          iface: { address: '10.200.200.1/24', listenPort: '51820', dns: '', mtu: '' },
          peers: [{ allowedIPs: '10.200.200.2/32,192.168.2.0/24', persistentKeepalive: '25' }]
        },
        'road-warrior': {
          iface: { address: '10.0.0.10/32', listenPort: '', dns: '1.1.1.1, 8.8.8.8', mtu: '' },
          peers: [{ allowedIPs: '0.0.0.0/0, ::/0', persistentKeepalive: '25' }]
        }
      };

      document.getElementById('template-select').addEventListener('change', (e) => {
        const template = templates[e.target.value];
        if (!template) return;

        // Apply interface settings
        document.getElementById('iface-address').value = template.iface.address;
        document.getElementById('iface-listen-port').value = template.iface.listenPort;
        document.getElementById('iface-dns').value = template.iface.dns;
        document.getElementById('iface-mtu').value = template.iface.mtu;

        // Clear existing peers and add template peers
        peers.clear();
        const peersEl = document.getElementById('peers-container');
        while (peersEl.firstChild) peersEl.removeChild(peersEl.firstChild);
        
        template.peers.forEach(peerTemplate => {
          addPeer(peerTemplate);
        });

        updateConfigPreview();
      });

      // Add Peer
      function addPeer(template = {}) {
        peerCounter++;
        const peerId = peerCounter;
        const peerData = {
          id: peerId,
          publicKey: template.publicKey || '',
          presharedKey: template.presharedKey || '',
          allowedIPs: template.allowedIPs || '',
          endpoint: template.endpoint || '',
          persistentKeepalive: template.persistentKeepalive || ''
        };
        peers.set(peerId, peerData);

        const peerHTML = \`
          <div class="peer-card p-5 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl" data-peer-id="\${peerId}">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                <span class="px-2 py-1 bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 rounded text-xs font-mono">[Peer]</span>
                <span class="peer-number">Peer \${peerId}</span>
              </h4>
              <button class="remove-peer-btn btn btn-ghost btn-xs text-error-600 dark:text-error-400" data-peer-id="\${peerId}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="label">PublicKey <span class="text-error-500">*</span></label>
                <input type="text" class="peer-public-key input font-mono text-sm" placeholder="Base64 public key of peer..." value="\${peerData.publicKey}">
              </div>
              
              <div>
                <label class="label">PresharedKey <span class="text-xs text-surface-400">(optional)</span></label>
                <input type="text" class="peer-preshared-key input font-mono text-sm" placeholder="Additional symmetric key..." value="\${peerData.presharedKey}">
              </div>
              
              <div>
                <label class="label">AllowedIPs <span class="text-error-500">*</span></label>
                <input type="text" class="peer-allowed-ips input font-mono text-sm" placeholder="0.0.0.0/0 or 10.0.0.1/32..." value="\${peerData.allowedIPs}">
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="label">Endpoint</label>
                  <input type="text" class="peer-endpoint input font-mono text-sm" placeholder="host:port..." value="\${peerData.endpoint}">
                </div>
                <div>
                  <label class="label">PersistentKeepalive</label>
                  <input type="number" class="peer-keepalive input font-mono text-sm" placeholder="25" min="0" max="65535" value="\${peerData.persistentKeepalive}">
                </div>
              </div>
            </div>
          </div>
        \`;

        const container = document.getElementById('peers-container');
        const range = document.createRange();
        range.selectNode(container);
        const fragment = range.createContextualFragment(peerHTML);
        container.appendChild(fragment.firstElementChild);

        // Attach event listeners
        attachPeerListeners(peerId);
      }

      function attachPeerListeners(peerId) {
        const card = document.querySelector(\`.peer-card[data-peer-id="\${peerId}"]\`);
        if (!card) return;

        const updatePeer = () => {
          peers.set(peerId, {
            id: peerId,
            publicKey: card.querySelector('.peer-public-key').value,
            presharedKey: card.querySelector('.peer-preshared-key').value,
            allowedIPs: card.querySelector('.peer-allowed-ips').value,
            endpoint: card.querySelector('.peer-endpoint').value,
            persistentKeepalive: card.querySelector('.peer-keepalive').value
          });
          updateConfigPreview();
        };

        card.querySelectorAll('input').forEach(input => {
          input.addEventListener('input', updatePeer);
        });

        card.querySelector('.remove-peer-btn').addEventListener('click', () => {
          peers.delete(peerId);
          card.remove();
          updatePeerNumbers();
          updateConfigPreview();
        });
      }

      function updatePeerNumbers() {
        document.querySelectorAll('.peer-card').forEach((card, index) => {
          card.querySelector('.peer-number').textContent = \`Peer \${index + 1}\`;
        });
      }

      document.getElementById('add-peer-btn').addEventListener('click', () => {
        addPeer();
        updateConfigPreview();
      });

      // Update config preview
      function updateConfigPreview() {
        const config = buildConfig();
        document.getElementById('config-preview').textContent = config || '# Configure your interface to see the output...';
        validateConfig();
      }

      function buildConfig() {
        const privateKey = document.getElementById('iface-private-key').value.trim();
        const address = document.getElementById('iface-address').value.trim();
        const listenPort = document.getElementById('iface-listen-port').value.trim();
        const dns = document.getElementById('iface-dns').value.trim();
        const mtu = document.getElementById('iface-mtu').value.trim();
        const postUp = document.getElementById('iface-post-up').value.trim();
        const postDown = document.getElementById('iface-post-down').value.trim();

        if (!privateKey && !address && peers.size === 0) {
          return '';
        }

        let config = '# WireGuard Configuration\\n';
        config += '# Generated by SimpleTool.app\\n\\n';
        config += '[Interface]\\n';
        
        if (privateKey) config += \`PrivateKey = \${privateKey}\n\`;
        if (address) config += \`Address = \${address}\n\`;
        if (listenPort) config += \`ListenPort = \${listenPort}\n\`;
        if (dns) config += \`DNS = \${dns}\n\`;
        if (mtu) config += \`MTU = \${mtu}\n\`;
        if (postUp) config += \`PostUp = \${postUp}\n\`;
        if (postDown) config += \`PostDown = \${postDown}\n\`;

        peers.forEach(peer => {
          if (peer.publicKey || peer.allowedIPs) {
            config += '\\n[Peer]\\n';
            if (peer.publicKey) config += \`PublicKey = \${peer.publicKey}\n\`;
            if (peer.presharedKey) config += \`PresharedKey = \${peer.presharedKey}\n\`;
            if (peer.allowedIPs) config += \`AllowedIPs = \${peer.allowedIPs}\n\`;
            if (peer.endpoint) config += \`Endpoint = \${peer.endpoint}\n\`;
            if (peer.persistentKeepalive) config += \`PersistentKeepalive = \${peer.persistentKeepalive}\n\`;
          }
        });

        return config;
      }

      // Form input listeners
      document.querySelectorAll('#iface-private-key, #iface-address, #iface-listen-port, #iface-dns, #iface-mtu, #iface-post-up, #iface-post-down').forEach(input => {
        input.addEventListener('input', updateConfigPreview);
      });

      // Config validation
      function validateConfig() {
        const errors = [];
        const warnings = [];

        const privateKey = document.getElementById('iface-private-key').value.trim();
        const address = document.getElementById('iface-address').value.trim();
        const listenPort = document.getElementById('iface-listen-port').value.trim();

        if (!privateKey) {
          errors.push('PrivateKey is required in [Interface] section');
        } else if (privateKey.length !== 44) {
          errors.push('PrivateKey should be 44 characters (Base64 encoded)');
        }

        if (!address) {
          errors.push('Address is required in [Interface] section');
        } else if (!address.match(/^(\\d{1,3}\\.){3}\\d{1,3}\\/\\d{1,2}(,\\s*(\\d{1,3}\\.){3}\\d{1,3}\\/\\d{1,2})*$/)) {
          errors.push('Address should be valid CIDR notation (e.g., 10.0.0.2/24)');
        }

        if (listenPort && (listenPort < 1 || listenPort > 65535)) {
          errors.push('ListenPort must be between 1 and 65535');
        }

        peers.forEach((peer, id) => {
          if (!peer.publicKey) {
            errors.push(\`Peer \${id}: PublicKey is required\`);
          } else if (peer.publicKey.length !== 44) {
            errors.push(\`Peer \${id}: PublicKey should be 44 characters\`);
          }

          if (!peer.allowedIPs) {
            errors.push(\`Peer \${id}: AllowedIPs is required\`);
          }

          if (peer.persistentKeepalive && (peer.persistentKeepalive < 0 || peer.persistentKeepalive > 65535)) {
            errors.push(\`Peer \${id}: PersistentKeepalive must be 0-65535\`);
          }
        });

        if (peers.size === 0) {
          warnings.push('No peers configured. Add at least one [Peer] section to establish connectivity.');
        }

        if (errors.length > 0) {
          showValidation('error', errors);
        } else if (warnings.length > 0) {
          showValidation('warning', warnings);
        } else {
          showValidation('success', ['Configuration looks valid!']);
        }
      }

      function showValidation(type, messages) {
        const statusEl = document.getElementById('validation-status');
        const iconEl = document.getElementById('validation-icon');
        const titleEl = document.getElementById('validation-title');
        const messagesEl = document.getElementById('validation-messages');

        statusEl.classList.remove('hidden', 'bg-success-50', 'dark:bg-success-900/20', 'border-success-200', 'dark:border-success-800', 'bg-error-50', 'dark:bg-error-900/20', 'border-error-200', 'dark:border-error-800', 'bg-warning-50', 'dark:bg-warning-900/20', 'border-warning-200', 'dark:border-warning-800');

        if (type === 'success') {
          statusEl.classList.add('bg-success-50', 'dark:bg-success-900/20', 'border-success-200', 'dark:border-success-800');
          iconEl.textContent = '✅';
          titleEl.className = 'font-semibold text-sm text-success-900 dark:text-success-300';
          titleEl.textContent = _t('tools.wireguard-config.js.text2', 'Valid Configuration');
        } else if (type === 'error') {
          statusEl.classList.add('bg-error-50', 'dark:bg-error-900/20', 'border-error-200', 'dark:border-error-800');
          iconEl.textContent = '❌';
          titleEl.className = 'font-semibold text-sm text-error-900 dark:text-error-300';
          titleEl.textContent = _t('tools.wireguard-config.js.text3', 'Validation Errors');
        } else {
          statusEl.classList.add('bg-warning-50', 'dark:bg-warning-900/20', 'border-warning-200', 'dark:border-warning-800');
          iconEl.textContent = '⚠️';
          titleEl.className = 'font-semibold text-sm text-warning-900 dark:text-warning-300';
          titleEl.textContent = _t('tools.wireguard-config.js.text4', 'Warnings');
        }

        messagesEl.textContent = '';
        const liClass = type === 'error' ? 'text-error-700 dark:text-error-200' : type === 'warning' ? 'text-warning-700 dark:text-warning-200' : 'text-success-700 dark:text-success-200';
        messages.forEach(m => {
          const li = document.createElement('li');
          li.className = liClass;
          li.textContent = m;
          messagesEl.appendChild(li);
        });
      }

      // Copy/Download config
      document.getElementById('copy-config-btn').addEventListener('click', () => {
        const config = buildConfig();
        if (!config) return;
        navigator.clipboard.writeText(config).then(() => {
          const btn = document.getElementById('copy-config-btn');
          const original = btn.textContent;
          btn.textContent = _t('common.copied', 'Copied!');
          setTimeout(() => btn.textContent = original, 2000);
        });
      });

      document.getElementById('download-config-btn').addEventListener('click', () => {
        const config = buildConfig();
        if (!config) return;
        
        const blob = new Blob([config], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wg0.conf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

      // QR Code generation
      let currentQR = null;
      
      document.getElementById('generate-qr-btn').addEventListener('click', async () => {
        const config = buildConfig();
        if (!config) {
          alert(_t('tools.wireguard-config.js.alert0', 'Please generate a configuration first'));
          return;
        }

        const container = document.getElementById('qr-container');
        while (container.firstChild) container.removeChild(container.firstChild);
        const spinner = document.createElement('div');
        spinner.className = 'animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full';
        container.appendChild(spinner);

        try {
          const canvas = document.createElement('canvas');
          await QRCode.toCanvas(canvas, config, {
            errorCorrectionLevel: 'M',
            margin: 2,
            width: 256
          });
          
          while (container.firstChild) container.removeChild(container.firstChild);
          container.appendChild(canvas);
          currentQR = canvas;
        } catch (error) {
          container.textContent = '';
          const p = document.createElement('p');
          p.className = 'text-error-500 text-sm';
          p.textContent = 'Error: ' + error.message;
          container.appendChild(p);
        }
      });

      // Config Parser
      document.getElementById('parse-config-btn').addEventListener('click', () => {
        const input = document.getElementById('config-parser-input').value.trim();
        if (!input) return;

        try {
          parseConfig(input);
          updateConfigPreview();
          showValidation('success', ['Configuration parsed successfully!']);
        } catch (error) {
          showValidation('error', ['Parse error: ' + error.message]);
        }
      });

      function parseConfig(configText) {
        const lines = configText.split('\\n');
        let currentSection = null;
        let currentPeer = null;
        const newPeers = [];

        lines.forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;

          if (trimmed === '[Interface]') {
            currentSection = 'interface';
            currentPeer = null;
          } else if (trimmed === '[Peer]') {
            currentSection = 'peer';
            currentPeer = { publicKey: '', presharedKey: '', allowedIPs: '', endpoint: '', persistentKeepalive: '' };
            newPeers.push(currentPeer);
          } else if (trimmed.includes('=')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').trim();
            const normalizedKey = key.trim();

            if (currentSection === 'interface') {
              switch (normalizedKey) {
                case 'PrivateKey':
                  document.getElementById('iface-private-key').value = value;
                  break;
                case 'Address':
                  document.getElementById('iface-address').value = value;
                  break;
                case 'ListenPort':
                  document.getElementById('iface-listen-port').value = value;
                  break;
                case 'DNS':
                  document.getElementById('iface-dns').value = value;
                  break;
                case 'MTU':
                  document.getElementById('iface-mtu').value = value;
                  break;
                case 'PostUp':
                  document.getElementById('iface-post-up').value = value;
                  break;
                case 'PostDown':
                  document.getElementById('iface-post-down').value = value;
                  break;
              }
            } else if (currentSection === 'peer' && currentPeer) {
              switch (normalizedKey) {
                case 'PublicKey':
                  currentPeer.publicKey = value;
                  break;
                case 'PresharedKey':
                  currentPeer.presharedKey = value;
                  break;
                case 'AllowedIPs':
                  currentPeer.allowedIPs = value;
                  break;
                case 'Endpoint':
                  currentPeer.endpoint = value;
                  break;
                case 'PersistentKeepalive':
                  currentPeer.persistentKeepalive = value;
                  break;
              }
            }
          }
        });

        // Clear and rebuild peers
        peers.clear();
        const peersBox = document.getElementById('peers-container');
        while (peersBox.firstChild) peersBox.removeChild(peersBox.firstChild);
        newPeers.forEach(peerData => {
          if (peerData.publicKey || peerData.allowedIPs) {
            addPeer(peerData);
          }
        });
      }

      // Initialize with one peer
      addPeer();
      updateConfigPreview();
    </script>
  `;

  return createPageTemplate({
    title: 'WireGuard Config Studio',
    description: 'Generate WireGuard configurations with local key generation, templates, and QR export.',
    path: '/wireguard-config',
    content,
    scripts: script
  });
}
