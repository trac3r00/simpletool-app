import { respondHTML } from "../utils/respond.js";
import {
  createPageTemplate,
  createToolHeader,
  createCheatsheet,
} from "../utils/common-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import {
  createRelatedToolsSection,
} from "../utils/content-ui.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";

export async function handleCurlStudioRoutes(request, url) {
  if (url.pathname !== "/curl-studio" && url.pathname !== "/curl-studio/")
    return null;
  if (request.method !== "GET") return null;
  const lang = resolveRequestLanguage(request, url);
  return renderCurlStudioPage(lang);
}

function renderCurlStudioPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("curl-studio", currentLang);
  const title = translation?.name || "Curl Studio";
  const description = translation?.desc || "Parse and generate curl commands.";

  const header = createToolHeader(
    { emoji: "🐚" },
    title,
    description,
    [
      {
        text: translation?.ui?.badge14 || "Privacy-First",
        tooltip:
          "All processing happens in your browser — your data is not sent to our servers.",
      },
    ],
    { toolId: "curl-studio" },
  );

  const currentTool = TOOLS.find((t) => t.id === "curl-studio");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">
        ${header}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Input Section -->
        <div class="space-y-6">
          <div class="tool-group p-5">
            <div class="flex justify-between items-center mb-2">
              <label for="curl-input" class="block text-sm font-medium text-surface-700 dark:text-surface-300"><span data-i18n="tools.curl-studio.ui.label4">Curl Command</span></label>
              <button id="parse-btn" data-tooltip="Parse a curl command into structured components" data-i18n-tooltip="tools.curl-studio.ui.tip0" class="btn btn-primary btn-xs"><span data-i18n="tools.curl-studio.ui.button0">Parse Command</span></button>
            </div>
            <textarea id="curl-input" rows="8" 
              class="input-mono"
              placeholder="Paste your curl command here (e.g., curl -X POST https://api.example.com -H 'Content-Type: application/json' -d '{\\"key\\":\\"value\\"}')" data-i18n-placeholder="tools.curl-studio.ui.placeholder8"></textarea>
          </div>

          <div class="tool-group p-5">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.curl-studio.ui.heading9">Generator Input</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1"><span data-i18n="tools.curl-studio.ui.label5">Method & URL</span></label>
                <div class="flex gap-2">
                  <select id="gen-method" aria-label="HTTP method" data-tooltip="HTTP method: GET retrieves, POST submits, PUT replaces, DELETE removes" data-i18n-tooltip="tools.curl-studio.ui.tip1" class="input">
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                    <option>PATCH</option>
                    <option>HEAD</option>
                    <option>OPTIONS</option>
                  </select>
                  <input type="text" id="gen-url" aria-label="Target URL" data-tooltip="Target URL for the request" data-i18n-tooltip="tools.curl-studio.ui.tip2" placeholder="https://api.example.com/v1"
                    class="input flex-1">
                </div>
              </div>
              <div>
                <label for="gen-headers" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1"><span data-i18n="tools.curl-studio.ui.label6">Headers (JSON)</span></label>
                <textarea id="gen-headers" rows="3" class="input-mono" placeholder='{"Content-Type": "application/json"}'></textarea>
              </div>
              <div>
                <label for="gen-body" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1"><span data-i18n="tools.curl-studio.ui.label7">Body</span></label>
                <textarea id="gen-body" rows="3" class="input-mono w-full" placeholder='{"foo": "bar"}'></textarea>
              </div>
              <button id="generate-btn" data-tooltip="Build a curl command from the fields above" data-i18n-tooltip="tools.curl-studio.ui.tip3" class="btn btn-primary w-full"><span data-i18n="tools.curl-studio.ui.button1">Generate Curl Command</span></button>
            </div>
          </div>
        </div>

        <!-- Output Section -->
        <div class="space-y-6">
          <div class="tool-group p-5">
             <div class="flex justify-between items-center mb-4">
               <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.curl-studio.ui.heading10">Structured Output</h2>
                <button id="copy-struct-btn" type="button" class="btn btn-ghost btn-xs"><span data-i18n="tools.curl-studio.ui.button2">Copy JSON</span></button>
             </div>
            <pre class="bg-surface-900 text-surface-50 p-4 rounded-lg text-xs font-mono overflow-x-auto min-h-[200px]"><code id="struct-output">{}</code></pre>
          </div>

          <div class="tool-group p-5">
             <div class="flex justify-between items-center mb-4">
               <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.curl-studio.ui.heading11">Generated Command</h2>
                <button id="copy-gen-btn" type="button" class="btn btn-ghost btn-xs"><span data-i18n="tools.curl-studio.ui.button3">Copy Command</span></button>
             </div>
            <div class="bg-surface-900 text-surface-50 p-4 rounded-lg text-xs font-mono break-all whitespace-pre-wrap min-h-[100px]" id="gen-output">curl ...</div>
          </div>
        </div>
      </div>

      ${createCheatsheet("curl-studio", "Curl Flags Reference", [
        {
          heading: "Common Flags",
          content: `
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
          </table>`,
        },
        {
          heading: "Authentication",
          content: `
          <table>
            <tr><th data-i18n="tools.curl-studio.ui.th1">Flag</th><th data-i18n="tools.curl-studio.ui.th4">Type</th></tr>
            <tr><td><code>-u user:pass</code></td><td>Basic auth</td></tr>
            <tr><td><code>-H "Authorization: Bearer TOKEN"</code></td><td>Bearer token</td></tr>
            <tr><td><code>--cert file.pem</code></td><td>Client certificate</td></tr>
          </table>`,
        },
      ])}
    ${createRelatedToolsSection(relatedToolsData, currentLang)}
      </div>
    </main>
  `;

  const scripts = `
      <script type="module">
      // Local curl parser implementation
      // Shell-aware tokenizer. The previous regex approach failed two ways:
      // the URL pattern treated -X as a valueless flag and captured its
      // ARGUMENT ("POST") as the URL, and the body pattern's character class
      // excluded BOTH quote characters, so a JSON body inside
      // single quotes truncated at the first double quote ("{").
      function tokenizeShell(input) {
        const tokens = [];
        let cur = '';
        let quote = null;
        let started = false;
        for (let i = 0; i < input.length; i++) {
          const ch = input[i];
          if (quote) {
            if (ch === '\\\\' && quote === '"' && i + 1 < input.length) {
              cur += input[++i];
            } else if (ch === quote) {
              quote = null;
            } else {
              cur += ch;
            }
            continue;
          }
          if (ch === "'" || ch === '"') { quote = ch; started = true; continue; }
          if (ch === '\\\\' && i + 1 < input.length) {
            const next = input[++i];
            if (next !== '\\n') { cur += next; started = true; }
            continue;
          }
          if (/\\s/.test(ch)) {
            if (cur || started) { tokens.push(cur); cur = ''; started = false; }
            continue;
          }
          cur += ch;
          started = true;
        }
        if (cur || started) tokens.push(cur);
        return tokens;
      }

      function parseCurl(curlCommand) {
        const result = { method: '', url: '', headers: {}, body: null };
        const tokens = tokenizeShell(String(curlCommand || '').trim());
        // Flags that consume the following token but are not the URL.
        const VALUE_FLAGS = new Set([
          '-X', '--request', '-H', '--header', '-d', '--data', '--data-raw',
          '--data-binary', '--data-urlencode', '-u', '--user', '-A',
          '--user-agent', '-e', '--referer', '-b', '--cookie', '-o', '--output',
          '--connect-timeout', '-m', '--max-time', '--retry', '-T',
          '--upload-file', '-F', '--form', '--cert', '--key', '--proxy', '-x'
        ]);
        let sawBody = false;
        for (let i = 0; i < tokens.length; i++) {
          const tok = tokens[i];
          if (i === 0 && tok.toLowerCase() === 'curl') continue;
          if (tok === '-X' || tok === '--request') { result.method = (tokens[++i] || '').toUpperCase(); continue; }
          if (tok === '-H' || tok === '--header') {
            const raw = tokens[++i] || '';
            const at = raw.indexOf(':');
            if (at > 0) result.headers[raw.slice(0, at).trim()] = raw.slice(at + 1).trim();
            continue;
          }
          if (tok === '-d' || tok === '--data' || tok === '--data-raw' || tok === '--data-binary') {
            const raw = tokens[++i] || '';
            sawBody = true;
            try { result.body = JSON.parse(raw); } catch (e) { result.body = raw; }
            continue;
          }
          if (tok === '--url') { result.url = tokens[++i] || ''; continue; }
          if (VALUE_FLAGS.has(tok)) { i++; continue; }
          if (tok.startsWith('-')) continue;         // valueless flag
          if (!result.url) result.url = tok;          // first bare token is the URL
        }
        // curl defaults to POST when a body is supplied and no method is given.
        if (!result.method) result.method = sawBody ? 'POST' : 'GET';
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

  return respondHTML(
    createPageTemplate({
      title,
      description,
      lang: currentLang,
      path: "/curl-studio",
      content,
      scripts,
    }),
  );
}
