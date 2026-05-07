import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleCurlStudioRoutes(request, url) {
  if (url.pathname !== '/curl-studio' && url.pathname !== '/curl-studio/') return null;
  if (request.method !== 'GET') return null;
  const lang = resolveRequestLanguage(request, url);
  return renderCurlStudioPage(lang);
}

function renderCurlStudioPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('curl-studio', currentLang);
  const title = translation?.name || 'Curl Studio';
  const description = translation?.desc || 'Parse and generate curl commands.';

  const header = createToolHeader(
    { emoji: '🐚' },
    title,
    description,
    [
      { text: '<span data-i18n="tools.curl-studio.ui.badge12">Parser</span>', tooltip: 'Breaks curl commands into structured fields directly in your browser.' },
      { text: '<span data-i18n="tools.curl-studio.ui.badge13">Generator</span>', tooltip: 'Build ready-to-run curl commands from form inputs without network calls.' },
      { text: '<span data-i18n="tools.curl-studio.ui.badge14">Privacy-First</span>', tooltip: 'All processing happens in your browser — no data is sent to any server.' }
    ],
    { toolId: 'curl-studio' }
  );

  const currentTool = TOOLS.find(t => t.id === 'curl-studio');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      ${header}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Input Section -->
        <div class="space-y-6">
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <div class="flex justify-between items-center mb-2">
              <label for="curl-input" class="block text-sm font-medium text-surface-700 dark:text-surface-300"><span data-i18n="tools.curl-studio.ui.label4">Curl Command</span></label>
              <button id="parse-btn" data-tooltip="Parse a curl command into structured components" data-i18n-tooltip="tools.curl-studio.ui.tip0" class="btn btn-primary btn-xs"><span data-i18n="tools.curl-studio.ui.button0">Parse Command</span></button>
            </div>
            <textarea id="curl-input" rows="8" 
              class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm text-surface-900 dark:text-white resize-y"
              placeholder="Paste your curl command here (e.g., curl -X POST https://api.example.com -H 'Content-Type: application/json' -d '{\\"key\\":\\"value\\"}')" data-i18n-placeholder="tools.curl-studio.ui.placeholder8"></textarea>
          </div>

          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.curl-studio.ui.heading9">Generator Input</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1"><span data-i18n="tools.curl-studio.ui.label5">Method & URL</span></label>
                <div class="flex gap-2">
                  <select id="gen-method" aria-label="HTTP method" data-tooltip="HTTP method: GET retrieves, POST submits, PUT replaces, DELETE removes" data-i18n-tooltip="tools.curl-studio.ui.tip1" class="bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg text-sm px-2 py-2 focus:ring-2 focus:ring-primary-500">
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                    <option>PATCH</option>
                    <option>HEAD</option>
                    <option>OPTIONS</option>
                  </select>
                  <input type="text" id="gen-url" aria-label="Target URL" data-tooltip="Target URL for the request" data-i18n-tooltip="tools.curl-studio.ui.tip2" placeholder="https://api.example.com/v1"
                    class="flex-1 p-2 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                </div>
              </div>
              <div>
                <label for="gen-headers" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1"><span data-i18n="tools.curl-studio.ui.label6">Headers (JSON)</span></label>
                <textarea id="gen-headers" rows="3" class="w-full p-2 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500" placeholder='{"Content-Type": "application/json"}'></textarea>
              </div>
              <div>
                <label for="gen-body" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1"><span data-i18n="tools.curl-studio.ui.label7">Body</span></label>
                <textarea id="gen-body" rows="3" class="w-full p-2 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500" placeholder='{"foo": "bar"}'></textarea>
              </div>
              <button id="generate-btn" data-tooltip="Build a curl command from the fields above" data-i18n-tooltip="tools.curl-studio.ui.tip3" class="btn btn-primary w-full"><span data-i18n="tools.curl-studio.ui.button1">Generate Curl Command</span></button>
            </div>
          </div>
        </div>

        <!-- Output Section -->
        <div class="space-y-6">
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
             <div class="flex justify-between items-center mb-4">
               <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.curl-studio.ui.heading10">Structured Output</h2>
                <button id="copy-struct-btn" type="button" class="btn btn-ghost btn-xs"><span data-i18n="tools.curl-studio.ui.button2">Copy JSON</span></button>
             </div>
            <pre class="bg-surface-900 text-surface-50 p-4 rounded-lg text-xs font-mono overflow-x-auto min-h-[200px]"><code id="struct-output">{}</code></pre>
          </div>

          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
             <div class="flex justify-between items-center mb-4">
               <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.curl-studio.ui.heading11">Generated Command</h2>
                <button id="copy-gen-btn" type="button" class="btn btn-ghost btn-xs"><span data-i18n="tools.curl-studio.ui.button3">Copy Command</span></button>
             </div>
            <div class="bg-surface-900 text-surface-50 p-4 rounded-lg text-xs font-mono break-all whitespace-pre-wrap min-h-[100px]" id="gen-output">curl ...</div>
          </div>
        </div>
      </div>

      ${createCheatsheet('curl-studio', 'Curl Flags Reference', [
        { heading: 'Common Flags', content: `
          <table>
            <tr><th data-i18n="tools.curl-studio.ui.th1">Flag</th><th data-i18n="tools.curl-studio.ui.th2">Description</th><th data-i18n="tools.curl-studio.ui.th3">Example</th></tr>
            <tr><td><code>-X</code></td><td>HTTP method</td><td><code>-X POST</code></td></tr>
            <tr><td><code>-H</code></td><td>Add header</td><td><code>-H "Content-Type: application/json"</code></td></tr>
            <tr><td><code>-d</code></td><td>Request body</td><td><code>-d '{"key":"val"}'</code></td></tr>
            <tr><td><code>-o</code></td><td>Output to file</td><td><code>-o response.json</code></td></tr>
            <tr><td><code>-v</code></td><td>Verbose output</td><td>Show headers</td></tr>
            <tr><td><code>-k</code></td><td>Skip TLS verification</td><td>—</td></tr>
            <tr><td><code>-L</code></td><td>Follow redirects</td><td>—</td></tr>
            <tr><td><code>-s</code></td><td>Silent mode</td><td>No progress</td></tr>
          </table>` },
        { heading: 'Authentication', content: `
          <table>
            <tr><th data-i18n="tools.curl-studio.ui.th1">Flag</th><th data-i18n="tools.curl-studio.ui.th4">Type</th></tr>
            <tr><td><code>-u user:pass</code></td><td>Basic auth</td></tr>
            <tr><td><code>-H "Authorization: Bearer TOKEN"</code></td><td>Bearer token</td></tr>
            <tr><td><code>--cert file.pem</code></td><td>Client certificate</td></tr>
          </table>` }
      ])}
    ${createRelatedToolsSection(relatedToolsData)}
    </main>
  `;

  const scripts = `
      <script type="module">
      // Local curl parser implementation
      function parseCurl(curlCommand) {
        const result = {
          method: 'GET',
          url: '',
          headers: {},
          body: null
        };

        // Extract method
        const methodMatch = curlCommand.match(/-X\\s+(\\w+)/i);
        if (methodMatch) {
          result.method = methodMatch[1].toUpperCase();
        }

        // Extract URL - handle various formats
        const urlMatch = curlCommand.match(/curl\\s+(?:-[^\\s]+\\s+)*['"]?([^'"\\s]+)/);
        if (urlMatch) {
          result.url = urlMatch[1];
        }

        // Extract headers
        const headerRegex = /-H\\s+['"]([^'"]+)['"]/g;
        let headerMatch;
        while ((headerMatch = headerRegex.exec(curlCommand)) !== null) {
          const headerParts = headerMatch[1].split(':');
          if (headerParts.length >= 2) {
            const key = headerParts[0].trim();
            const value = headerParts.slice(1).join(':').trim();
            result.headers[key] = value;
          }
        }

        // Extract data/body
        const dataMatch = curlCommand.match(/(?:-d|--data|--data-raw)\\s+['"]([^'"]+)['"]/);
        if (dataMatch) {
          try {
            result.body = JSON.parse(dataMatch[1]);
          } catch (e) {
            result.body = dataMatch[1];
          }
        }

        return result;
      }

      const curlInput = document.getElementById('curl-input');
      const parseBtn = document.getElementById('parse-btn');
      const structOutput = document.getElementById('struct-output');
      
      const genMethod = document.getElementById('gen-method');
      const genUrl = document.getElementById('gen-url');
      const genHeaders = document.getElementById('gen-headers');
      const genBody = document.getElementById('gen-body');
      const generateBtn = document.getElementById('generate-btn');
      const genOutput = document.getElementById('gen-output');
      const copyStructBtn = document.getElementById('copy-struct-btn');
      const copyGenBtn = document.getElementById('copy-gen-btn');

      parseBtn.addEventListener('click', () => {
        const cmd = curlInput.value.trim();
        if (!cmd) return;
        try {
          const parsed = parseCurl(cmd);
          structOutput.textContent = JSON.stringify(parsed, null, 2);
          
          // Sync to generator inputs
          if (parsed.method) genMethod.value = parsed.method.toUpperCase();
          if (parsed.url) genUrl.value = parsed.url;
          if (parsed.headers) genHeaders.value = JSON.stringify(parsed.headers, null, 2);
          if (parsed.body) genBody.value = typeof parsed.body === 'string' ? parsed.body : JSON.stringify(parsed.body, null, 2);
          
          updateGeneratedCommand();
        } catch (e) {
          structOutput.textContent = _t('tools.curl-studio.js.text0', 'Error parsing curl command: ') + e.message;
        }
      });

      generateBtn.addEventListener('click', updateGeneratedCommand);

      function updateGeneratedCommand() {
        const method = genMethod.value;
        const url = genUrl.value.trim() || 'https://api.example.com';
        let headers = {};
        try { headers = JSON.parse(genHeaders.value || '{}'); } catch(e) {}
        const body = genBody.value.trim();

        let cmd = \`curl -X \${method} "\${url}"\`;
        
        Object.entries(headers).forEach(([k, v]) => {
          cmd += \` -H "\${k}: \${v}"\`;
        });

        if (body && method !== 'GET') {
          // Basic escaping for the demo
          const escapedBody = body.replace(/"/g, '\\\\\\"');
          cmd += \` -d "\${escapedBody}"\`;
        }

        genOutput.textContent = cmd;
      }

      function copyOutput(id, btnEl) {
        const el = document.getElementById(id);
        const text = el ? (el.textContent || el.innerText) : '';
        if (!btnEl) return;
        copyToClipboard(text, btnEl);
      }

      copyStructBtn?.addEventListener('click', () => copyOutput('struct-output', copyStructBtn));
      copyGenBtn?.addEventListener('click', () => copyOutput('gen-output', copyGenBtn));
      
      // Initial generation
      updateGeneratedCommand();
    </script>
  `;

  return respondHTML(createPageTemplate({
    title,
    description,
    lang: currentLang,
    path: '/curl-studio',
    content,
    scripts
  }));
}
