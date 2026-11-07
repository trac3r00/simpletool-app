import { respondHTML } from "../utils/respond.js";
import {
  createPageTemplate,
  createToolHeader,
  createCheatsheet,
} from "../utils/common-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import {
  createRelatedToolsSection,
  createVisibleArticle,
} from "../utils/content-ui.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";
import { createCurlLogic } from "../utils/curl-studio-logic.js";

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

        ${createVisibleArticle({
          title: '<span data-i18n="tools.curl-studio.ui.r64_0">This curl parser never fires the request</span>',
          paragraphs: [
            `<span data-i18n-html="tools.curl-studio.ui.r64_1">Paste a command and this page tokenizes it the way a shell does: flags keep their arguments, <code>-X POST</code> does not steal the URL, and a JSON body inside single quotes keeps its double quotes. The previous regex parser on this page failed both of those cases.</span>`,
            `<span data-i18n-html="tools.curl-studio.ui.r64_2">Nothing here is sent to an origin. There is no "Run" button. Authorization headers, cookies, and <code>-d</code> bodies stay in the tab. Use it to inspect a copied command before you paste it into a ticket or a shared doc.</span>`,
            `<span data-i18n-html="tools.curl-studio.ui.r64_3">The generator is the inverse: method, URL, headers, and body in; a copyable curl command out. Every value is wrapped in single quotes, so a <code>$</code>, backtick, or quote in a token or body reaches the server as typed instead of being expanded by your shell, and the body goes through <code>--data-raw</code> so a leading <code>@</code> is not read as a file name. It does not add <code>-k</code> for you. Skipping TLS is a choice you make on purpose.</span>`,
          ],
        })}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Input Section -->
        <div class="space-y-6">
          <div class="tool-group p-5">
            <div class="flex justify-between items-center mb-2">
              <label for="curl-input" class="block text-sm font-medium text-surface-700 dark:text-surface-300"><span data-i18n="tools.curl-studio.ui.label4">Curl Command</span></label>
              <button id="parse-btn" data-tooltip="Parse a curl command into structured components" data-i18n-tooltip="tools.curl-studio.ui.r64_8" class="btn btn-primary btn-xs"><span data-i18n="tools.curl-studio.ui.button0">Parse Command</span></button>
            </div>
            <textarea id="curl-input" rows="8" aria-describedby="curl-hint parse-status"
              class="input-mono"
              placeholder="Paste your curl command here (e.g., curl -X POST https://api.example.com -H 'Content-Type: application/json' -d '{\\"key\\":\\"value\\"}')" data-i18n-placeholder="tools.curl-studio.ui.placeholder8"></textarea>
            <p data-i18n-html="tools.curl-studio.ui.r6_0" id="curl-hint" class="text-xs text-muted-foreground mt-2">Handles single, double and <code>$'...'</code> quoting, so a command from your browser's "Copy as cURL" parses as is. Press Ctrl+Enter (Cmd+Enter on Mac) to parse.</p>
            <p id="parse-status" class="text-sm mt-2" role="status" aria-live="polite"></p>
          </div>

          <div class="tool-group p-5">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.curl-studio.ui.heading9">Generator Input</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1"><span data-i18n="tools.curl-studio.ui.label5">Method & URL</span></label>
                <div class="flex gap-2">
                  <select id="gen-method" aria-label="HTTP method" data-i18n-aria="tools.curl-studio.ui.r64_5" data-tooltip="HTTP method: GET retrieves, POST submits, PUT replaces, DELETE removes" data-i18n-tooltip="tools.curl-studio.ui.r64_9" class="input">
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                    <option>PATCH</option>
                    <option>HEAD</option>
                    <option>OPTIONS</option>
                  </select>
                  <input data-i18n-aria="tools.curl-studio.ui.r6_1" type="text" id="gen-url" aria-label="Target URL" data-tooltip="Target URL for the request" data-i18n-tooltip="tools.curl-studio.ui.r64_10" placeholder="https://api.example.com/v1"
                    class="input flex-1">
                </div>
              </div>
              <div>
                <label for="gen-headers" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1"><span data-i18n="tools.curl-studio.ui.label6">Headers (JSON)</span></label>
                <textarea id="gen-headers" rows="3" class="input-mono" aria-describedby="gen-status" placeholder='{"Content-Type": "application/json"}  or one "Name: value" per line' data-i18n-placeholder="tools.curl-studio.ui.r64_4"></textarea>
              </div>
              <div>
                <label for="gen-body" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1"><span data-i18n="tools.curl-studio.ui.label7">Body</span></label>
                <textarea id="gen-body" rows="3" class="input-mono w-full" placeholder='{"foo": "bar"}'></textarea>
              </div>
              <button id="generate-btn" data-tooltip="Build a curl command from the fields above" data-i18n-tooltip="tools.curl-studio.ui.r64_11" class="btn btn-primary w-full"><span data-i18n="tools.curl-studio.ui.button1">Generate Curl Command</span></button>
              <p id="gen-status" class="text-sm" role="status" aria-live="polite"></p>
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
            <pre tabindex="0" aria-label="Structured output" data-i18n-aria="tools.curl-studio.ui.r64_6" class="bg-surface-900 text-surface-50 p-4 rounded-lg text-xs font-mono overflow-x-auto min-h-[200px]"><code id="struct-output">{}</code></pre>
          </div>

          <div class="tool-group p-5">
             <div class="flex justify-between items-center mb-4">
               <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.curl-studio.ui.heading11">Generated Command</h2>
                <button id="copy-gen-btn" type="button" class="btn btn-ghost btn-xs"><span data-i18n="tools.curl-studio.ui.button3">Copy Command</span></button>
             </div>
            <pre tabindex="0" aria-label="Generated curl command" data-i18n-aria="tools.curl-studio.ui.r64_7" class="bg-surface-900 text-surface-50 p-4 rounded-lg text-xs font-mono break-all whitespace-pre-wrap min-h-[100px]" id="gen-output">curl ...</pre>
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
            <tr><td><code>-s</code></td><td>Silent mode</td><td data-i18n="tools.curl-studio.ui.r3_0">No progress</td></tr>
          </table>`,
        },
        {
          heading: "Authentication",
          content: `
          <table>
            <tr><th data-i18n="tools.curl-studio.ui.th1">Flag</th><th data-i18n="tools.curl-studio.ui.th4">Type</th></tr>
            <tr><td><code>-u user:pass</code></td><td>Basic auth</td></tr>
            <tr><td><code>-H "Authorization: Bearer TOKEN"</code></td><td>Bearer token</td></tr>
            <tr><td><code>--cert file.pem</code></td><td data-i18n="tools.curl-studio.ui.r3_1">Client certificate</td></tr>
          </table>`,
        },
      ])}
    ${createRelatedToolsSection(relatedToolsData)}
      </div>
    </main>
  `;

  const scripts = `
      <script type="module">
      const curlLogic = (${createCurlLogic.toString()})();

      const curlInput = document.getElementById('curl-input');
      const parseBtn = document.getElementById('parse-btn');
      const parseStatus = document.getElementById('parse-status');
      const structOutput = document.getElementById('struct-output');
      const genMethod = document.getElementById('gen-method');
      const genUrl = document.getElementById('gen-url');
      const genHeaders = document.getElementById('gen-headers');
      const genBody = document.getElementById('gen-body');
      const generateBtn = document.getElementById('generate-btn');
      const genStatus = document.getElementById('gen-status');
      const genOutput = document.getElementById('gen-output');
      const copyStructBtn = document.getElementById('copy-struct-btn');
      const copyGenBtn = document.getElementById('copy-gen-btn');

      function setStatus(el, text, isError) {
        el.textContent = text;
        el.classList.toggle('text-error-700', !!isError);
        el.classList.toggle('dark:text-error-300', !!isError);
        el.classList.toggle('text-muted-foreground', !isError);
      }

      function runParse() {
        const cmd = curlInput.value.trim();
        if (!cmd) {
          setStatus(parseStatus, 'Paste a curl command first.', true);
          curlInput.focus();
          return;
        }
        try {
          const parsed = curlLogic.parseCurl(cmd);
          structOutput.textContent = JSON.stringify(parsed, null, 2);
          const warnings = parsed.warnings || [];
          setStatus(parseStatus, warnings.length ? warnings.join(' ') : 'Parsed ' + parsed.method + ' ' + parsed.url + '.', warnings.length > 0);

          const methodOption = Array.from(genMethod.options).some(function(o) { return o.value === parsed.method; });
          if (!methodOption) {
            const opt = document.createElement('option');
            opt.textContent = parsed.method;
            genMethod.appendChild(opt);
          }
          genMethod.value = parsed.method;
          genUrl.value = parsed.url;
          genHeaders.value = Object.keys(parsed.headers).length ? JSON.stringify(parsed.headers, null, 2) : '';
          genBody.value = parsed.body == null ? '' : (typeof parsed.body === 'string' ? parsed.body : JSON.stringify(parsed.body, null, 2));
          updateGeneratedCommand();
        } catch (e) {
          setStatus(parseStatus, _t('tools.curl-studio.js.text0', 'Error parsing curl command: ').trim() + ' ' + e.message, true);
        }
      }

      parseBtn.addEventListener('click', runParse);
      curlInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          runParse();
        }
      });

      generateBtn.addEventListener('click', updateGeneratedCommand);

      function updateGeneratedCommand() {
        const headerResult = curlLogic.parseHeaderInput(genHeaders.value);
        if (headerResult.error) {
          genHeaders.setAttribute('aria-invalid', 'true');
          setStatus(genStatus, headerResult.error, true);
          return;
        }
        genHeaders.removeAttribute('aria-invalid');
        const url = genUrl.value.trim();
        const method = genMethod.value;
        const body = genBody.value.trim();
        genOutput.textContent = curlLogic.generateCurl({
          method: method,
          url: url || 'https://api.example.com',
          headers: headerResult.headers,
          body: body,
        });
        const tr = (k, fb) => (window._t ? window._t('tools.curl-studio.js.' + k, fb) : fb);
        let note = url ? '' : tr('r64_12', 'No URL entered, so the command uses https://api.example.com as a placeholder.');
        if (body && (method === 'GET' || method === 'HEAD')) {
          note = (note ? note + ' ' : '') + tr('r64_13', 'A {method} request with a body is unusual, and many servers and proxies drop it.').replace('{method}', method);
        }
        setStatus(genStatus, note, false);
      }

      function copyOutput(id, btnEl) {
        const el = document.getElementById(id);
        const text = el ? (el.textContent || el.innerText) : '';
        if (!btnEl) return;
        copyToClipboard(text, btnEl);
      }

      copyStructBtn?.addEventListener('click', () => copyOutput('struct-output', copyStructBtn));
      copyGenBtn?.addEventListener('click', () => copyOutput('gen-output', copyGenBtn));

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
