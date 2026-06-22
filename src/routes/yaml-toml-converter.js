/**
 * YAML · TOML · JSON Converter
 * Validate and convert between common config formats client-side
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createCheatsheet } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleDataConverterRoutes(request, url) {
  const { pathname } = url;

  if (pathname === '/yaml-toml-converter' || pathname === '/yaml-toml-converter/') {
    if (request.method === 'GET') {
      return respondHTML(renderDataConverterPage(resolveRequestLanguage(request, url)));
    }
    return respondJSON({ error: 'Method not allowed' }, { status: 405 });
  }

  return null;
}

function renderDataConverterPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('yaml-toml-converter', currentLang);
  const title = translation?.name || 'Config Converter';
  const description = translation?.desc || 'Validate and convert configuration files between JSON, YAML, and TOML without uploading anything.';

  const currentTool = TOOLS.find(t => t.id === 'yaml-toml-converter');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <header class="bg-white/90 dark:bg-surface-900/80 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-8">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.35em] text-info-600 dark:text-info-300 mb-3" data-i18n="tools.yaml-toml-converter.ui.desc9">Data formats</p>
            <h1 class="text-4xl sm:text-5xl font-extrabold text-surface-900 dark:text-white mb-4">${title}</h1>
            <p class="text-lg text-surface-600 dark:text-surface-300 max-w-3xl" data-i18n="tools.yaml-toml-converter.ui.desc10">Validate and translate configs instantly. Paste once, get well-formed JSON, YAML, and TOML representations without leaking secrets.</p>
          </div>
          <div class="flex flex-col gap-3 text-sm text-surface-600 dark:text-surface-300">
             <div class="flex items-center gap-3 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-xl px-4 py-3">
              <span class="text-xl">🧪</span>
              <div>
                <p class="font-semibold" data-i18n="tools.yaml-toml-converter.ui.feat0">Schema-less validation</p>
                <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.yaml-toml-converter.ui.desc11">Instant parse feedback.</p>
              </div>
            </div>
             <div class="flex items-center gap-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-xl px-4 py-3">
              <span class="text-xl">🔒</span>
              <div>
                <p class="font-semibold" data-i18n="tools.yaml-toml-converter.ui.feat1">Offline friendly</p>
                <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.yaml-toml-converter.ui.desc12">Everything stays local.</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section class="grid gap-6 lg:grid-cols-[3fr,3fr]">
        <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 space-y-4">
          <div class="flex flex-wrap items-center gap-3">
            <label for="format-select" class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide"><span data-i18n="tools.yaml-toml-converter.ui.label6">Source format</span></label>
            <select id="format-select" class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-950 px-3 py-2 text-sm text-surface-900 dark:text-surface-100">
              <option value="auto" data-i18n="tools.yaml-toml-converter.ui.option8">Auto detect</option>
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
              <option value="toml">TOML</option>
            </select>
             <button id="load-sample" class="btn btn-ghost btn-xs"><span data-i18n="tools.yaml-toml-converter.ui.button0">Load sample</span></button>
          </div>
          <label for="format-input" class="sr-only"><span data-i18n="tools.yaml-toml-converter.ui.label0">Input configuration data</span></label>
          <textarea id="format-input" class="w-full min-h-[280px] rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 px-4 py-3 font-mono text-sm text-surface-900 dark:text-surface-100" placeholder="Paste JSON, YAML, or TOML..." data-i18n-placeholder="tools.yaml-toml-converter.ui.placeholder7"></textarea>
          <div class="flex flex-wrap gap-3">
             <button id="validate-btn" class="btn btn-secondary" data-tooltip="Check syntax without converting"><span data-i18n="tools.yaml-toml-converter.ui.button1">Validate only</span></button>
             <button data-convert="json" class="convert-btn btn btn-secondary" data-tooltip="Convert to JSON format"><span data-i18n="tools.yaml-toml-converter.ui.button2">→ JSON</span></button>
             <button data-convert="yaml" class="convert-btn btn btn-secondary" data-tooltip="Convert to YAML format"><span data-i18n="tools.yaml-toml-converter.ui.button3">→ YAML</span></button>
             <button data-convert="toml" class="convert-btn btn btn-secondary" data-tooltip="Convert to TOML format"><span data-i18n="tools.yaml-toml-converter.ui.button4">→ TOML</span></button>
          </div>
           <div id="format-error" class="hidden rounded-xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/30 text-sm text-error-700 dark:text-error-200 px-4 py-3">Parser error</div>
          <div class="text-sm text-surface-500 dark:text-surface-400">Detected: <span id="detected-format" class="font-semibold">—</span> · Root type: <span id="root-type">—</span> · Keys: <span id="key-count">—</span></div>
        </div>

        <div class="space-y-6">
            <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-lg font-bold text-surface-900 dark:text-white">JSON</h2>
               <button data-copy="json" class="copy-btn btn btn-ghost btn-xs" disabled><span data-i18n="tools.yaml-toml-converter.ui.button5">Copy</span></button>
            </div>
            <pre id="json-output" class="bg-surface-900 text-surface-100 rounded-xl p-4 min-h-[140px] overflow-x-auto text-sm">Await conversion.</pre>
          </div>
          <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-lg font-bold text-surface-900 dark:text-white">YAML</h2>
               <button data-copy="yaml" class="copy-btn btn btn-ghost btn-xs" disabled><span data-i18n="tools.yaml-toml-converter.ui.button5">Copy</span></button>
            </div>
            <pre id="yaml-output" class="bg-surface-900 text-surface-100 rounded-xl p-4 min-h-[140px] overflow-x-auto text-sm">Await conversion.</pre>
          </div>
          <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-lg font-bold text-surface-900 dark:text-white">TOML</h2>
               <button data-copy="toml" class="copy-btn btn btn-ghost btn-xs" disabled><span data-i18n="tools.yaml-toml-converter.ui.button5">Copy</span></button>
            </div>
            <pre id="toml-output" class="bg-surface-900 text-surface-100 rounded-xl p-4 min-h-[140px] overflow-x-auto text-sm">Await conversion.</pre>
          </div>
        </div>
      </section>

      ${createCheatsheet('yaml-toml-converter', 'Format Comparison', [
        { heading: 'Syntax Differences', content: `
          <table>
            <tr><th data-i18n="tools.yaml-toml-converter.ui.th3">Feature</th><th>JSON</th><th>YAML</th><th>TOML</th></tr>
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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'YAML vs TOML vs JSON Compared',
          content: '<p><strong>JSON</strong> is the most widely used format for data exchange due to its simplicity and native support in JavaScript. <strong>YAML</strong> (YAML Ain\'t Markup Language) is a human-friendly data serialization standard that uses indentation to represent structure, making it popular for complex configuration files. <strong>TOML</strong> (Tom\'s Obvious, Minimal Language) is designed to be easy to read and write due to its obvious semantics and is often used for project configuration.</p><p>While JSON is strict and compact, YAML and TOML prioritize human readability and ease of manual editing. YAML is powerful but can be complex due to its many features, while TOML aims for a simpler, more predictable structure that maps well to hash tables. Choosing the right format depends on your specific needs for readability, performance, and tooling support.</p>'
        },
        {
          title: 'How to Use This Tool',
          content: '<ol><li>Paste your configuration data (JSON, YAML, or TOML) into the source text area on the left.</li><li>The tool will automatically detect the source format, or you can select it manually from the dropdown.</li><li>Click the "Validate only" button to check for syntax errors without performing a conversion.</li><li>Click one of the conversion buttons (→ JSON, → YAML, → TOML) to translate your data into that format.</li><li>View the results in the output panels on the right and click "Copy" to save them to your clipboard.</li></ol>'
        },
        {
          title: 'Common Use Cases',
          content: '<ul><li><strong>Infrastructure as Code:</strong> Convert between JSON and YAML when working with Kubernetes manifests, Docker Compose files, or AWS CloudFormation templates.</li><li><strong>Project Configuration:</strong> Migrate settings between <code>package.json</code> (JSON) and <code>pyproject.toml</code> (TOML) or <code>Cargo.toml</code> (TOML).</li><li><strong>API Prototyping:</strong> Quickly visualize how a complex data structure looks in different formats to decide which is best for your API.</li><li><strong>Legacy Migration:</strong> Translate old configuration files into modern formats while ensuring data integrity and syntax correctness.</li></ul>'
        },
        {
          title: 'Pro Tips',
          content: '<ul><li>Use YAML for CI/CD pipelines where readability of complex, nested structures is essential for maintainability.</li><li>Prefer TOML for application-level configuration files to provide a clean and obvious interface for end-users who might need to edit them manually.</li><li>When converting from YAML to JSON, be aware of YAML\'s "Norway problem" (where <code>NO</code> can be interpreted as <code>false</code>) and ensure your data types are preserved correctly.</li></ul>'
        }
      ], 'yaml-toml-converter', currentLang)}
    ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;


  const script = `
    <script src="/vendor/js-yaml.min.js" integrity="sha384-DrPu+BeZLo6V7/5zznxmd0rvFRUQ1TSsrViKUsRBWGonzRQtD+LQAU5GhTslfJTK" crossorigin="anonymous"></script>
    <script src="/vendor/toml.min.js" integrity="sha384-Xct21wwhjNAssRKqsU7xoXtjUU2dxYftwzImANZHaEx1ad00LmZpXh+uGsaOwwgt" crossorigin="anonymous"></script>
    <script>
    (function() {
      var inputEl = document.getElementById('format-input');
      var formatSelect = document.getElementById('format-select');
      var errorEl = document.getElementById('format-error');
      var detectedEl = document.getElementById('detected-format');
      var rootTypeEl = document.getElementById('root-type');
      var keyCountEl = document.getElementById('key-count');
      var jsonOut = document.getElementById('json-output');
      var yamlOut = document.getElementById('yaml-output');
      var tomlOut = document.getElementById('toml-output');

      var SAMPLE = 'name: simpletool\\nversion: 1.0\\ndescription: A useful config file\\ntags:\\n  - web\\n  - api\\ndatabase:\\n  host: localhost\\n  port: 5432';

      function showError(msg) {
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
      }
      function clearError() {
        errorEl.classList.add('hidden');
        errorEl.textContent = '';
      }

      function detectFormat(src) {
        var s = src.trim();
        if (!s) return 'unknown';
        if (s[0] === '{' || s[0] === '[') return 'json';
        if (/^[a-zA-Z_][\\w.-]* *= */.test(s) && s.indexOf(':') === -1) return 'toml';
        return 'yaml';
      }

      function parseInput(src) {
        var fmt = formatSelect.value === 'auto' ? detectFormat(src) : formatSelect.value;
        detectedEl.textContent = fmt;
        if (fmt === 'json') {
          return JSON.parse(src);
        } else if (fmt === 'yaml') {
          if (!window.jsyaml) throw new Error(_t('tools.yaml-toml-converter.js.text3', 'js-yaml not loaded.'));
          return window.jsyaml.load(src);
        } else if (fmt === 'toml') {
          if (!window.toml) throw new Error('toml library not loaded.');
          return window.toml.parse(src);
        }
        throw new Error('Unknown format');
      }

      function objToToml(obj, prefix) {
        prefix = prefix || '';
        var lines = [];
        var tables = [];
        Object.keys(obj).forEach(function(k) {
          var v = obj[k];
          var fullKey = prefix ? prefix + '.' + k : k;
          if (v === null || v === undefined) {
            return;
          } else if (typeof v === 'boolean') {
            lines.push(k + ' = ' + v);
          } else if (typeof v === 'number') {
            lines.push(k + ' = ' + v);
          } else if (typeof v === 'string') {
            lines.push(k + ' = ' + JSON.stringify(v));
          } else if (Array.isArray(v)) {
            var allPrimitive = v.every(function(item) {
              return typeof item !== 'object' || item === null;
            });
            if (allPrimitive) {
              lines.push(k + ' = [' + v.map(function(item) {
                return typeof item === 'string' ? JSON.stringify(item) : String(item);
              }).join(', ') + ']');
            } else {
              v.forEach(function(item) {
                tables.push('[[' + fullKey + ']]');
                tables.push(objToToml(item, ''));
              });
            }
          } else if (typeof v === 'object') {
            tables.push('[' + fullKey + ']');
            tables.push(objToToml(v, fullKey));
          }
        });
        return lines.concat(tables).join('\\n');
      }

      function countKeys(obj) {
        if (!obj || typeof obj !== 'object') return 0;
        return Object.keys(obj).length;
      }

      function updateOutputs(data) {
        try {
          jsonOut.textContent = JSON.stringify(data, null, 2);
          document.querySelector('[data-copy="json"]').disabled = false;
        } catch(e) {
          jsonOut.textContent = _t('tools.yaml-toml-converter.js.text2', '⚠️ Cannot serialize to JSON:') + ' ' + e.message;
        }
        try {
          if (!window.jsyaml) throw new Error(_t('tools.yaml-toml-converter.js.text3', 'js-yaml not loaded.'));
          yamlOut.textContent = window.jsyaml.dump(data, { indent: 2 });
          document.querySelector('[data-copy="yaml"]').disabled = false;
        } catch(e) {
          yamlOut.textContent = _t('tools.yaml-toml-converter.js.text4', '⚠️ YAML conversion failed:') + ' ' + e.message;
        }
        try {
          tomlOut.textContent = objToToml(data, '');
          document.querySelector('[data-copy="toml"]').disabled = false;
        } catch(e) {
          tomlOut.textContent = _t('tools.yaml-toml-converter.js.text6', '⚠️ TOML conversion failed:') + ' ' + e.message;
        }
        rootTypeEl.textContent = Array.isArray(data) ? 'array' : typeof data;
        keyCountEl.textContent = countKeys(data);
      }

      function resetOutputs() {
        var placeholder = _t('tools.yaml-toml-converter.js.tpl7', 'Await conversion.');
        jsonOut.textContent = placeholder;
        yamlOut.textContent = placeholder;
        tomlOut.textContent = placeholder;
        document.querySelectorAll('.copy-btn').forEach(function(b) { b.disabled = true; });
        detectedEl.textContent = '\\u2014';
        rootTypeEl.textContent = '\\u2014';
        keyCountEl.textContent = '\\u2014';
      }

      document.querySelectorAll('.convert-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          clearError();
          var src = inputEl.value.trim();
          if (!src) { showError('Please enter some configuration data.'); return; }
          try {
            updateOutputs(parseInput(src));
          } catch(e) {
            showError(e.message);
            resetOutputs();
          }
        });
      });

      document.getElementById('validate-btn').addEventListener('click', function() {
        clearError();
        var src = inputEl.value.trim();
        if (!src) { showError('Please enter some configuration data.'); return; }
        try {
          parseInput(src);
          errorEl.textContent = '\\u2713 Valid ' + (formatSelect.value === 'auto' ? detectFormat(src) : formatSelect.value).toUpperCase();
          errorEl.classList.remove('hidden');
        } catch(e) {
          showError(e.message);
        }
      });

      document.getElementById('load-sample').addEventListener('click', function() {
        inputEl.value = SAMPLE;
        formatSelect.value = 'yaml';
        clearError();
        resetOutputs();
      });

      document.querySelectorAll('.copy-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var fmt = btn.getAttribute('data-copy');
          var el = document.getElementById(fmt + '-output');
          var text = el ? el.textContent : '';
          var awaitText = _t('tools.yaml-toml-converter.js.tpl7', 'Await conversion.');
          if (!text || text === awaitText) return;
          copyToClipboard(text, btn);
        });
      });

      inputEl.addEventListener('input', function() {
        var src = inputEl.value.trim();
        if (src && formatSelect.value === 'auto') {
          detectedEl.textContent = detectFormat(src);
        } else if (!src) {
          detectedEl.textContent = '\\u2014';
          rootTypeEl.textContent = '\\u2014';
          keyCountEl.textContent = '\\u2014';
        }
      });
    })();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: '/yaml-toml-converter',
    content,
    scripts: script,
    lang: currentLang
  });
}
