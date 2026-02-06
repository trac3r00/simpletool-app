/**
 * YAML · TOML · JSON Converter
 * Validate and convert between common config formats client-side
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createCheatsheet } from '../utils/common-ui.js';

export async function handleDataConverterRoutes(request, url) {
  const { pathname } = url;

  if (pathname === '/yaml-toml-converter' || pathname === '/yaml-toml-converter/') {
    if (request.method === 'GET') {
      return respondHTML(renderDataConverterPage());
    }
    return respondJSON({ error: 'Method not allowed' }, { status: 405 });
  }

  return null;
}

function renderDataConverterPage() {
  const content = `
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <header class="bg-white/90 dark:bg-surface-900/80 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-8">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600 dark:text-sky-300 mb-3" data-i18n="tools.yaml-toml-converter.ui.desc9">Data formats</p>
            <h1 class="text-4xl sm:text-5xl font-extrabold text-surface-900 dark:text-white mb-4">Config Converter</h1>
            <p class="text-lg text-surface-600 dark:text-surface-300 max-w-3xl" data-i18n="tools.yaml-toml-converter.ui.desc10">Validate and translate configs instantly. Paste once, get well-formed JSON, YAML, and TOML representations without leaking secrets.</p>
          </div>
          <div class="flex flex-col gap-3 text-sm text-surface-600 dark:text-surface-300">
            <div class="flex items-center gap-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl px-4 py-3">
              <span class="text-xl">🧪</span>
              <div>
                <p class="font-semibold">Schema-less validation</p>
                <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.yaml-toml-converter.ui.desc11">Instant parse feedback.</p>
              </div>
            </div>
            <div class="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-3">
              <span class="text-xl">🔒</span>
              <div>
                <p class="font-semibold">Offline friendly</p>
                <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.yaml-toml-converter.ui.desc12">Everything stays local.</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section class="grid gap-6 lg:grid-cols-[3fr,3fr]">
        <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-6 space-y-4">
          <div class="flex flex-wrap items-center gap-3">
            <label for="format-select" class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide"><span data-i18n="tools.yaml-toml-converter.ui.label6">Source format</span></label>
            <select id="format-select" class="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-950 px-3 py-2 text-sm text-surface-900 dark:text-surface-100">
              <option value="auto" data-i18n="tools.yaml-toml-converter.ui.option8">Auto detect</option>
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
              <option value="toml">TOML</option>
            </select>
            <button id="load-sample" class="text-xs text-surface-500 hover:text-sky-500"><span data-i18n="tools.yaml-toml-converter.ui.button0">Load sample</span></button>
          </div>
          <label for="format-input" class="sr-only">Input configuration data</label>
          <textarea id="format-input" class="w-full min-h-[280px] rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 px-4 py-3 font-mono text-sm text-surface-900 dark:text-surface-100" placeholder="Paste JSON, YAML, or TOML..." data-i18n-placeholder="tools.yaml-toml-converter.ui.placeholder7"></textarea>
          <div class="flex flex-wrap gap-3">
            <button id="validate-btn" class="px-4 py-2 rounded-2xl bg-surface-900 text-white text-sm font-semibold" data-tooltip="Check syntax without converting"><span data-i18n="tools.yaml-toml-converter.ui.button1">Validate only</span></button>
            <button data-convert="json" class="convert-btn px-4 py-2 rounded-2xl border border-surface-300 dark:border-surface-600 text-sm" data-tooltip="Convert to JSON format"><span data-i18n="tools.yaml-toml-converter.ui.button2">→ JSON</span></button>
            <button data-convert="yaml" class="convert-btn px-4 py-2 rounded-2xl border border-surface-300 dark:border-surface-600 text-sm" data-tooltip="Convert to YAML format"><span data-i18n="tools.yaml-toml-converter.ui.button3">→ YAML</span></button>
            <button data-convert="toml" class="convert-btn px-4 py-2 rounded-2xl border border-surface-300 dark:border-surface-600 text-sm" data-tooltip="Convert to TOML format"><span data-i18n="tools.yaml-toml-converter.ui.button4">→ TOML</span></button>
          </div>
          <div id="format-error" class="hidden rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-200 px-4 py-3">Parser error</div>
          <div class="text-sm text-surface-500 dark:text-surface-400">Detected: <span id="detected-format" class="font-semibold">—</span> · Root type: <span id="root-type">—</span> · Keys: <span id="key-count">—</span></div>
        </div>

        <div class="space-y-6">
            <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-6">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-lg font-bold text-surface-900 dark:text-white">JSON</h2>
              <button data-copy="json" class="copy-btn text-sm text-sky-600 dark:text-sky-300" disabled><span data-i18n="tools.yaml-toml-converter.ui.button5">Copy</span></button>
            </div>
            <pre id="json-output" class="bg-surface-900 text-surface-100 rounded-2xl p-4 min-h-[140px] overflow-x-auto text-sm">Await conversion.</pre>
          </div>
          <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-6">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-lg font-bold text-surface-900 dark:text-white">YAML</h2>
              <button data-copy="yaml" class="copy-btn text-sm text-sky-600 dark:text-sky-300" disabled><span data-i18n="tools.yaml-toml-converter.ui.button5">Copy</span></button>
            </div>
            <pre id="yaml-output" class="bg-surface-900 text-surface-100 rounded-2xl p-4 min-h-[140px] overflow-x-auto text-sm">Await conversion.</pre>
          </div>
          <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-xl p-6">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-lg font-bold text-surface-900 dark:text-white">TOML</h2>
              <button data-copy="toml" class="copy-btn text-sm text-sky-600 dark:text-sky-300" disabled><span data-i18n="tools.yaml-toml-converter.ui.button5">Copy</span></button>
            </div>
            <pre id="toml-output" class="bg-surface-900 text-surface-100 rounded-2xl p-4 min-h-[140px] overflow-x-auto text-sm">Await conversion.</pre>
          </div>
        </div>
      </section>

      ${createCheatsheet('yaml-toml-converter', 'Format Comparison', [
        { heading: 'Syntax Differences', content: `
          <table>
            <tr><th>Feature</th><th>JSON</th><th>YAML</th><th>TOML</th></tr>
            <tr><td>Comments</td><td>❌ None</td><td><code># comment</code></td><td><code># comment</code></td></tr>
            <tr><td>Strings</td><td><code>"double only"</code></td><td><code>bare or "quoted"</code></td><td><code>"basic"</code> or <code>'literal'</code></td></tr>
            <tr><td>Arrays</td><td><code>[1, 2]</code></td><td><code>- 1</code> (newline each)</td><td><code>[1, 2]</code></td></tr>
            <tr><td>Nesting</td><td><code>{"a":{"b":1}}</code></td><td>Indentation</td><td><code>[a.b]</code> sections</td></tr>
          </table>` },
        { heading: 'When to Use', content: `
          <table>
            <tr><td><strong>JSON</strong></td><td>APIs, data exchange, package.json, tsconfig.json</td></tr>
            <tr><td><strong>YAML</strong></td><td>Config files, Kubernetes manifests, CI/CD pipelines, Docker Compose</td></tr>
            <tr><td><strong>TOML</strong></td><td>Simple configs — Cargo.toml, pyproject.toml, Hugo</td></tr>
          </table>` }
      ])}
    </main>

    <script src="/vendor/js-yaml.min.js" integrity="sha384-ZeqCzuWczURac3RacSufGD7oSbzeaX7xxnnOr3PTcYTLx4Av0qBj0kBq7AeCtHLA" crossorigin="anonymous"></script>
    <script src="/vendor/toml.min.js" integrity="sha384-l3mnDxXnicxE1DfJV0YEMFry8osCCiUgFGpvrx/BZR5axHxs39/J2q6i+wpkiv2f" crossorigin="anonymous"></script>
    <script>
      (function() {
        const inputEl = document.getElementById('format-input');
        const formatSelect = document.getElementById('format-select');
        const validateBtn = document.getElementById('validate-btn');
        const convertButtons = document.querySelectorAll('.convert-btn');
        const copyButtons = document.querySelectorAll('.copy-btn');
        const detectedFormat = document.getElementById('detected-format');
        const rootType = document.getElementById('root-type');
        const keyCount = document.getElementById('key-count');
        const errorBox = document.getElementById('format-error');
        const outputs = {
          json: document.getElementById('json-output'),
          yaml: document.getElementById('yaml-output'),
          toml: document.getElementById('toml-output')
        };
        const loadSampleBtn = document.getElementById('load-sample');

        let latestData = null;

        validateBtn.addEventListener('click', (event) => {
          event.preventDefault();
          try {
            const result = parseInput();
            renderMeta(result);
            showError('');
          } catch (error) {
            showError(error.message);
          }
        });

        convertButtons.forEach(button => {
          button.addEventListener('click', (event) => {
            event.preventDefault();
            handleConversion(button.dataset.convert);
          });
        });

        copyButtons.forEach(button => {
          button.addEventListener('click', () => {
            const type = button.dataset.copy;
            const text = outputs[type].textContent;
            if (!text || text === 'Await conversion.') return;
            navigator.clipboard.writeText(text);
            button.textContent = _t('tools.yaml-toml-converter.js.text0', 'Copied');
            setTimeout(() => button.textContent = _t('tools.yaml-toml-converter.js.text1', 'Copy'), 1500);
          });
        });

        loadSampleBtn.addEventListener('click', () => {
          inputEl.value = 'name: SimpleTool\\nversion: 2\\nfeatures:\\n  - privacy-first\\n  - offline\\nports:\\n  web: 8080\\n  metrics: 9090';
        });

        function handleConversion(target) {
          try {
            const result = parseInput();
            latestData = result.data;
            renderMeta(result);
            renderOutputs(result.data);
            showError('');
            updateCopyButtons(true);
          } catch (error) {
            showError(error.message);
            updateCopyButtons(false);
          }
        }

        function parseInput() {
          const raw = inputEl.value.trim();
          if (!raw) {
            throw new Error('Provide some input first.');
          }
          const format = formatSelect.value;
          if (format === 'json') return { format: 'JSON', data: parseJson(raw) };
          if (format === 'yaml') return { format: 'YAML', data: parseYaml(raw) };
          if (format === 'toml') return { format: 'TOML', data: parseToml(raw) };
          return autoDetect(raw);
        }

        function parseJson(text) {
          return JSON.parse(text);
        }

        function parseYaml(text) {
          if (!window.jsyaml) throw new Error('js-yaml library did not load.');
          return window.jsyaml.load(text);
        }

        function parseToml(text) {
          if (!window.toml || typeof window.toml.parse !== 'function') {
            throw new Error('TOML parser failed to load.');
          }
          return window.toml.parse(text);
        }

        function autoDetect(text) {
          const attempts = [
            { label: 'JSON', fn: parseJson },
            { label: 'YAML', fn: parseYaml },
            { label: 'TOML', fn: parseToml }
          ];
          for (const attempt of attempts) {
            try {
              return { format: attempt.label, data: attempt.fn(text) };
            } catch (error) {
              continue;
            }
          }
          throw new Error('Unable to parse input as JSON, YAML, or TOML.');
        }

        function renderMeta(result) {
          detectedFormat.textContent = result.format;
          rootType.textContent = Array.isArray(result.data) ? 'Array' : typeof result.data;
          keyCount.textContent = Array.isArray(result.data) ? result.data.length : Object.keys(result.data || {}).length;
        }

        function renderOutputs(data) {
          try {
            outputs.json.textContent = JSON.stringify(data, null, 2);
          } catch (error) {
            outputs.json.textContent = '⚠️ Cannot serialize to JSON: ' + error.message;
          }
          try {
            if (window.jsyaml) {
              outputs.yaml.textContent = window.jsyaml.dump(data, { indent: 2, lineWidth: 120 });
            } else {
              outputs.yaml.textContent = _t('tools.yaml-toml-converter.js.text3', 'js-yaml not loaded.');
            }
          } catch (error) {
            outputs.yaml.textContent = '⚠️ YAML conversion failed: ' + error.message;
          }
          try {
            if (window.toml && typeof window.toml.stringify === 'function') {
              outputs.toml.textContent = window.toml.stringify(data);
            } else {
              outputs.toml.textContent = _t('tools.yaml-toml-converter.js.text5', 'TOML stringify not available in this runtime.');
            }
          } catch (error) {
            outputs.toml.textContent = '⚠️ TOML conversion failed: ' + error.message;
          }
        }

        function showError(message) {
          if (!message) {
            errorBox.classList.add('hidden');
            return;
          }
          errorBox.textContent = message;
          errorBox.classList.remove('hidden');
        }

        function updateCopyButtons(enabled) {
          copyButtons.forEach(button => {
            button.disabled = !enabled;
            if (!enabled) {
              button.textContent = _t('tools.yaml-toml-converter.js.text1', 'Copy');
            }
          });
        }
      })();
    </script>
  `;

  return createPageTemplate({
    title: 'Config Converter',
    description: 'Validate and convert configuration files between JSON, YAML, and TOML without uploading anything.',
    path: '/yaml-toml-converter',
    content
  });
}
