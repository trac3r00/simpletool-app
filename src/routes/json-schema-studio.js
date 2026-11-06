import { respondHTML } from "../utils/respond.js";
import {
  createPageTemplate,
  createToolHeader,
  createCheatsheet,
} from "../utils/common-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import { createRelatedToolsSection } from "../utils/content-ui.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";
import { createJsonSchemaLogic } from "../utils/json-schema-studio-logic.js";

export async function handleJsonSchemaStudioRoutes(request, url) {
  if (
    url.pathname !== "/json-schema-studio" &&
    url.pathname !== "/json-schema-studio/"
  )
    return null;
  if (request.method !== "GET") return null;

  return renderJsonSchemaStudioPage(resolveRequestLanguage(request, url));
}

function renderJsonSchemaStudioPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("json-schema-studio", currentLang);
  const title = translation?.name || "JSON Schema Studio";
  const description =
    translation?.desc ||
    "Generate a JSON Schema from JSON input automatically. Fast, private, and perfect for API documentation.";

  const header = createToolHeader(
    { emoji: "📋" },
    title,
    translation?.desc ||
      "Turn any JSON sample into a valid JSON Schema instantly. Use it for validation, documentation, or code generation.",
    [
      {
        text: translation?.ui?.badge9 || "Client-Side Only",
        tooltip:
          "All processing happens in your browser — your data is not sent to our servers.",
      },
    ],
    { toolId: "json-schema-studio" },
  );

  const currentTool = TOOLS.find((t) => t.id === "json-schema-studio");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <script src="/vendor/json-schema-validator.min.js" integrity="sha384-nEQZA2xAqPzm5ZuW5rz2Tdmq0pRvcO5k2Yd9X1VegIDkE7iYKoEUPGfDSZZAh6wf" crossorigin="anonymous"></script>
    <main class="tool-page-shell">
      <div class="tool-page-panel">
        ${header}

      <div class="tabs-list max-w-full flex-wrap h-auto mb-6" role="tablist" aria-label="JSON Schema Studio modes">
        <button id="tab-generate" type="button" role="tab" class="tab-trigger min-h-[44px]" aria-selected="true" aria-controls="panel-generate" tabindex="0">Generate</button>
        <button id="tab-validate" type="button" role="tab" class="tab-trigger min-h-[44px]" aria-selected="false" aria-controls="panel-validate" tabindex="-1">Validate</button>
        <button id="tab-mcp" type="button" role="tab" class="tab-trigger min-h-[44px]" aria-selected="false" aria-controls="panel-mcp" tabindex="-1">MCP tools/list</button>
      </div>

      <div id="panel-generate" role="tabpanel" aria-labelledby="tab-generate">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Input -->
        <div class="tool-group p-5">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.json-schema-studio.ui.heading4">Input JSON</h2>
            <div class="flex gap-2">
              <button id="format-btn" type="button" class="btn btn-secondary btn-xs"><span data-i18n="tools.json-schema-studio.ui.button0">Beautify</span></button>
              <button id="sample-btn" type="button" class="btn btn-secondary btn-xs"><span data-i18n="tools.json-schema-studio.ui.button1">Sample</span></button>
            </div>
          </div>
          <textarea id="json-input" rows="20" aria-label="JSON input" data-tooltip="Paste JSON to auto-generate its JSON Schema" data-i18n-tooltip="tools.json-schema-studio.ui.tip0"
            class="input-mono w-full resize-none"
            placeholder='{ "name": "John", "age": 30 }' aria-describedby="schema-status"></textarea>
          <fieldset class="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <legend class="sr-only">Schema options</legend>
            <label class="inline-flex items-center gap-2 min-h-[44px] text-sm text-surface-700 dark:text-surface-300 cursor-pointer">
              <input type="checkbox" id="opt-required" class="w-5 h-5 accent-primary-600" checked>
              Mark every key as required
            </label>
            <label class="inline-flex items-center gap-2 min-h-[44px] text-sm text-surface-700 dark:text-surface-300 cursor-pointer">
              <input type="checkbox" id="opt-formats" class="w-5 h-5 accent-primary-600" checked>
              Detect string formats (date-time, email, uuid, uri)
            </label>
            <label class="inline-flex items-center gap-2 min-h-[44px] text-sm text-surface-700 dark:text-surface-300 cursor-pointer">
              <input type="checkbox" id="opt-closed" class="w-5 h-5 accent-primary-600">
              Reject unknown keys (additionalProperties: false)
            </label>
          </fieldset>
          <p class="text-xs text-muted-foreground mt-2">Output targets JSON Schema 2020-12. In an array, a key is required only if every element has it, and mixed element types become a type list or <code>anyOf</code>. Press Ctrl+Enter (Cmd+Enter on Mac) to generate.</p>
          <button id="generate-btn" type="button" data-tooltip="Analyze JSON structure and generate a matching schema" data-i18n-tooltip="tools.json-schema-studio.ui.tip1" class="btn btn-primary w-full mt-4"><span data-i18n="tools.json-schema-studio.ui.button2">Generate JSON Schema</span></button>
        </div>

        <!-- Output -->
        <div class="tool-group p-5 flex flex-col">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.json-schema-studio.ui.heading5">JSON Schema Result</h2>
            <button id="copy-btn" type="button" data-tooltip="Copy generated schema to clipboard" data-i18n-tooltip="tools.json-schema-studio.ui.tip2" class="btn btn-secondary btn-xs"><span data-i18n="tools.json-schema-studio.ui.button3">Copy Schema</span></button>
          </div>
          <p id="schema-status" class="text-sm mb-3 text-muted-foreground" role="status" aria-live="polite"></p>
          <pre tabindex="0" aria-label="Generated JSON Schema" class="flex-1 bg-surface-900 text-surface-50 p-4 rounded-lg text-sm font-mono overflow-auto min-h-[400px]" id="schema-output" data-i18n="tools.json-schema-studio.ui.desc4">Schema will appear here...</pre>
        </div>
      </div>
      </div>

      <div id="panel-validate" role="tabpanel" aria-labelledby="tab-validate" class="hidden">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="tool-group p-5">
          <div class="flex justify-between items-center mb-4 gap-2">
            <h2 class="text-lg font-semibold text-foreground">Document and schema</h2>
            <button id="val-sample" type="button" class="btn btn-secondary btn-xs">Sample</button>
          </div>
          <label for="val-doc" class="label block mb-1">JSON document</label>
          <textarea id="val-doc" rows="9" class="input-mono w-full resize-y" placeholder='{ "id": 1, "name": "Ada" }' aria-describedby="val-status"></textarea>
          <div class="flex justify-between items-center mt-4 mb-1 gap-2 flex-wrap">
            <label for="val-schema" class="label">JSON Schema</label>
            <button id="val-use-generated" type="button" class="btn btn-secondary btn-xs" disabled>Use generated schema</button>
          </div>
          <textarea id="val-schema" rows="9" class="input-mono w-full resize-y" placeholder='{ "type": "object", "required": ["id"] }' aria-describedby="val-status"></textarea>
          <label for="val-dialect" class="label block mt-4 mb-1">Dialect</label>
          <select id="val-dialect" class="input w-full">
            <option value="auto">Auto (from $schema, else 2020-12)</option>
            <option value="2020-12">Draft 2020-12</option>
            <option value="2019-09">Draft 2019-09</option>
            <option value="7">Draft-07</option>
          </select>
          <p class="text-xs text-muted-foreground mt-2">Validation runs in your browser with @cfworker/json-schema. <code>format</code> is asserted. Press Ctrl+Enter (Cmd+Enter on Mac) in either box to validate.</p>
          <button id="val-run" type="button" class="btn btn-primary w-full mt-4">Validate</button>
        </div>
        <div class="tool-group p-5 flex flex-col">
          <h2 class="text-lg font-semibold text-foreground mb-4">Validation result</h2>
          <p id="val-status" class="text-sm mb-3 text-muted-foreground" role="status" aria-live="polite">Paste a document and a schema, then press Validate.</p>
          <div id="val-results" tabindex="0" aria-label="Validation errors" class="flex-1 overflow-auto max-h-96 rounded-lg border border-border"></div>
        </div>
      </div>
      </div>

      <div id="panel-mcp" role="tabpanel" aria-labelledby="tab-mcp" class="hidden">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="tool-group p-5">
          <div class="flex justify-between items-center mb-4 gap-2">
            <h2 class="text-lg font-semibold text-foreground">tools/list result</h2>
            <button id="mcp-sample" type="button" class="btn btn-secondary btn-xs">Sample</button>
          </div>
          <label for="mcp-input" class="label block mb-1">JSON-RPC response, result object, or tools array</label>
          <textarea id="mcp-input" rows="18" class="input-mono w-full resize-y" placeholder='{ "jsonrpc": "2.0", "id": 1, "result": { "tools": [] } }' aria-describedby="mcp-status"></textarea>
          <p class="text-xs text-muted-foreground mt-2">Checked against the Tool shape in the MCP specification 2025-11-25. Each inputSchema is checked as a JSON Schema too. Risk notes are heuristics based on wording and annotations, so treat them as prompts to review, not verdicts.</p>
          <button id="mcp-run" type="button" class="btn btn-primary w-full mt-4">Check tools</button>
        </div>
        <div class="tool-group p-5 flex flex-col">
          <h2 class="text-lg font-semibold text-foreground mb-4">Tool report</h2>
          <p id="mcp-status" class="text-sm mb-3 text-muted-foreground" role="status" aria-live="polite">Paste a tools/list result, then press Check tools.</p>
          <dl id="mcp-summary" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 hidden">
            <div class="rounded-lg bg-muted p-3"><dt class="text-xs text-muted-foreground">Tools</dt><dd id="mcp-count" class="text-xl font-semibold text-foreground">0</dd></div>
            <div class="rounded-lg bg-muted p-3"><dt class="text-xs text-muted-foreground">Errors</dt><dd id="mcp-errors" class="text-xl font-semibold text-foreground">0</dd></div>
            <div class="rounded-lg bg-muted p-3"><dt class="text-xs text-muted-foreground">Warnings</dt><dd id="mcp-warnings" class="text-xl font-semibold text-foreground">0</dd></div>
            <div class="rounded-lg bg-muted p-3"><dt class="text-xs text-muted-foreground">Tokens (estimate)</dt><dd id="mcp-tokens" class="text-xl font-semibold text-foreground">0</dd></div>
          </dl>
          <p id="mcp-token-note" class="text-xs text-muted-foreground mb-3 hidden">Estimate: characters of every description plus its serialised inputSchema, divided by 4. Real tokenizers and client framing differ.</p>
          <div id="mcp-results" tabindex="0" aria-label="Tool check results" class="flex-1 overflow-auto max-h-96 space-y-3"></div>
        </div>
      </div>
      </div>

      ${createCheatsheet("json-schema-studio", "JSON Schema Keywords", [
        {
          heading: "Type Keywords",
          content: `
          <table>
            <tr><th data-i18n="tools.json-schema-studio.ui.th0">Keyword</th><th data-i18n="tools.json-schema-studio.ui.th1">Description</th></tr>
            <tr><td><code>type</code></td><td>Data type (string, number, integer, boolean, object, array, null)</td></tr>
            <tr><td><code>enum</code></td><td>Allowed values list</td></tr>
            <tr><td><code>const</code></td><td>Single allowed value</td></tr>
            <tr><td><code>$ref</code></td><td>Reference another schema</td></tr>
          </table>`,
        },
        {
          heading: "Validation Keywords",
          content: `
          <table>
            <tr><th data-i18n="tools.json-schema-studio.ui.th2">Type</th><th data-i18n="tools.json-schema-studio.ui.th3">Keywords</th></tr>
            <tr><td>String</td><td><code>minLength</code>, <code>maxLength</code>, <code>pattern</code>, <code>format</code></td></tr>
            <tr><td>Number</td><td><code>minimum</code>, <code>maximum</code>, <code>multipleOf</code>, <code>exclusiveMinimum</code></td></tr>
            <tr><td>Object</td><td><code>required</code>, <code>properties</code>, <code>additionalProperties</code>, <code>minProperties</code></td></tr>
            <tr><td>Array</td><td><code>items</code>, <code>minItems</code>, <code>maxItems</code>, <code>uniqueItems</code></td></tr>
          </table>`,
        },
      ])}
    ${createRelatedToolsSection(relatedToolsData)}
      </div>
    </main>
  `;

  const scripts = `
    <script>
      const schemaLogic = (${createJsonSchemaLogic.toString()})();

      const input = document.getElementById('json-input');
      const output = document.getElementById('schema-output');
      const status = document.getElementById('schema-status');
      const generateBtn = document.getElementById('generate-btn');
      const formatBtn = document.getElementById('format-btn');
      const sampleBtn = document.getElementById('sample-btn');
      const copyBtn = document.getElementById('copy-btn');
      const optRequired = document.getElementById('opt-required');
      const optFormats = document.getElementById('opt-formats');
      const optClosed = document.getElementById('opt-closed');
      let hasSchema = false;

      function paintStatus(node, text, isError) {
        node.textContent = text;
        node.classList.toggle('text-error-700', !!isError);
        node.classList.toggle('dark:text-error-300', !!isError);
        node.classList.toggle('text-muted-foreground', !isError);
      }

      function setStatus(text, isError) {
        paintStatus(status, text, isError);
        if (isError) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }

      function parseInput() {
        const jsonText = input.value.trim();
        if (!jsonText) {
          setStatus('Paste a JSON document, or press Sample.', true);
          return { ok: false };
        }
        try {
          return { ok: true, value: JSON.parse(jsonText) };
        } catch (e) {
          const prefix = (window._t ? window._t('tools.json-schema-studio.js.text1', 'Invalid JSON: ') : 'Invalid JSON: ').trim();
          setStatus(prefix + ' ' + schemaLogic.describeJsonError(jsonText, e), true);
          return { ok: false };
        }
      }

      function generateSchema() {
        const parsed = parseInput();
        if (!parsed.ok) return;
        const schema = schemaLogic.generateSchema(parsed.value, {
          required: optRequired.checked,
          formats: optFormats.checked,
          closed: optClosed.checked,
        });
        output.textContent = JSON.stringify(schema, null, 2);
        hasSchema = true;
        document.getElementById('val-use-generated').disabled = false;
        setStatus('Generated a JSON Schema 2020-12 document.', false);
      }

      generateBtn.addEventListener('click', generateSchema);
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          generateSchema();
        }
      });
      [optRequired, optFormats, optClosed].forEach(function(el) {
        el.addEventListener('change', function() { if (hasSchema) generateSchema(); });
      });

      formatBtn.addEventListener('click', () => {
        const parsed = parseInput();
        if (!parsed.ok) return;
        input.value = JSON.stringify(parsed.value, null, 2);
        setStatus('Formatted the input.', false);
      });

      sampleBtn.addEventListener('click', () => {
        input.value = JSON.stringify({
          id: 1,
          name: "Leanne Graham",
          username: "Bret",
          email: "Sincere@april.biz",
          address: {
            street: "Kulas Light",
            suite: "Apt. 556",
            city: "Gwenborough"
          },
          website: "hildegard.org"
        }, null, 2);
        generateSchema();
      });

      copyBtn.addEventListener('click', () => {
        if (!hasSchema) {
          setStatus('Generate a schema first, then copy it.', true);
          return;
        }
        navigator.clipboard.writeText(output.textContent).then(() => {
          const original = copyBtn.innerText;
          copyBtn.innerText = _t('tools.json-schema-studio.js.text2', 'Copied!');
          if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
          setTimeout(() => copyBtn.innerText = original, 2000);
        }).catch(() => {
          setStatus('Copy failed: your browser blocked clipboard access. Select the schema and copy it manually.', true);
        });
      });

      // ---- Mode tabs ----
      const tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tablist"] [role="tab"]'));
      function selectTab(tab, focus) {
        tabs.forEach(function(t) {
          const on = t === tab;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
          document.getElementById(t.getAttribute('aria-controls')).classList.toggle('hidden', !on);
        });
        if (focus) tab.focus();
      }
      tabs.forEach(function(t, i) {
        t.addEventListener('click', function() { selectTab(t, false); });
        t.addEventListener('keydown', function(e) {
          let next = -1;
          if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
          else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
          else if (e.key === 'Home') next = 0;
          else if (e.key === 'End') next = tabs.length - 1;
          if (next === -1) return;
          e.preventDefault();
          selectTab(tabs[next], true);
        });
      });

      function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
      }

      function parseField(textarea, label) {
        const text = textarea.value.trim();
        if (!text) return { ok: false, message: label + ' is empty.' };
        try {
          return { ok: true, value: JSON.parse(text) };
        } catch (e) {
          return { ok: false, message: label + ' is not valid JSON: ' + schemaLogic.describeJsonError(text, e) };
        }
      }

      function markInvalid(textarea, bad) {
        if (bad) textarea.setAttribute('aria-invalid', 'true');
        else textarea.removeAttribute('aria-invalid');
      }

      function validatorOrError(statusNode) {
        if (window.CfJsonSchema && window.CfJsonSchema.Validator) return window.CfJsonSchema.Validator;
        paintStatus(statusNode, 'The validator script did not load. Reload the page and try again.', true);
        return null;
      }

      // ---- Validate mode ----
      const valDoc = document.getElementById('val-doc');
      const valSchema = document.getElementById('val-schema');
      const valDialect = document.getElementById('val-dialect');
      const valStatus = document.getElementById('val-status');
      const valResults = document.getElementById('val-results');
      const valRun = document.getElementById('val-run');

      function renderIssueTable(rows, withKeyword) {
        const table = el('table', 'w-full text-sm');
        const head = el('tr', 'text-left text-muted-foreground');
        const cols = withKeyword ? ['Path / keyword', 'Message'] : ['Schema path', 'Problem'];
        cols.forEach(function(c) { const th = el('th', 'px-3 py-2 font-medium', c); th.scope = 'col'; head.appendChild(th); });
        const thead = el('thead', 'bg-muted');
        thead.appendChild(head);
        table.appendChild(thead);
        const body = el('tbody');
        rows.forEach(function(r) {
          const tr = el('tr', 'border-t border-border align-top');
          const pathCell = el('td', 'px-3 py-2');
          pathCell.appendChild(el('code', 'block font-mono text-xs break-all text-foreground', r.path || '(root)'));
          if (withKeyword) pathCell.appendChild(el('code', 'block font-mono text-xs break-all text-muted-foreground mt-0.5', r.keyword));
          tr.appendChild(pathCell);
          tr.appendChild(el('td', 'px-3 py-2 text-foreground', r.message));
          body.appendChild(tr);
        });
        table.appendChild(body);
        return table;
      }

      function runValidate() {
        valResults.textContent = '';
        const doc = parseField(valDoc, 'The document');
        const schema = parseField(valSchema, 'The schema');
        markInvalid(valDoc, !doc.ok);
        markInvalid(valSchema, !schema.ok);
        if (!doc.ok || !schema.ok) {
          paintStatus(valStatus, [doc, schema].filter(function(p) { return !p.ok; }).map(function(p) { return p.message; }).join(' '), true);
          return;
        }
        const Validator = validatorOrError(valStatus);
        if (!Validator) return;
        const r = schemaLogic.validateDocument(Validator, schema.value, doc.value, valDialect.value);
        const dialectName = r.dialect === '7' ? 'draft-07' : 'draft ' + r.dialect;
        if (r.schemaErrors.length) {
          markInvalid(valSchema, true);
          paintStatus(valStatus, 'The schema is not a valid ' + dialectName + ' schema (' + r.schemaErrors.length + ' problem' + (r.schemaErrors.length === 1 ? '' : 's') + '). Fix it before validating.', true);
          valResults.appendChild(renderIssueTable(r.schemaErrors, false));
          return;
        }
        const note = valDialect.value === 'auto' ? ' ' + r.note : '';
        if (r.valid) {
          paintStatus(valStatus, 'Valid: the document matches the schema under ' + dialectName + '.' + note, false);
          return;
        }
        paintStatus(valStatus, 'Invalid: ' + r.errors.length + ' error' + (r.errors.length === 1 ? '' : 's') + ' under ' + dialectName + '.' + note, true);
        valResults.appendChild(renderIssueTable(r.errors, true));
      }

      valRun.addEventListener('click', runValidate);
      [valDoc, valSchema].forEach(function(area) {
        area.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runValidate(); }
        });
      });
      valDialect.addEventListener('change', function() { if (valDoc.value.trim() && valSchema.value.trim()) runValidate(); });
      document.getElementById('val-use-generated').addEventListener('click', function() {
        if (!hasSchema) return;
        valSchema.value = output.textContent;
        if (!valDoc.value.trim()) valDoc.value = input.value;
        paintStatus(valStatus, 'Loaded the generated schema. Press Validate.', false);
      });
      document.getElementById('val-sample').addEventListener('click', function() {
        valSchema.value = JSON.stringify({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          required: ['id', 'email', 'roles'],
          properties: {
            id: { type: 'integer', minimum: 1 },
            email: { type: 'string', format: 'email' },
            roles: { type: 'array', items: { enum: ['admin', 'editor', 'viewer'] }, uniqueItems: true }
          },
          additionalProperties: false
        }, null, 2);
        valDoc.value = JSON.stringify({ id: 0, email: 'not-an-email', roles: ['admin', 'owner', 'admin'], team: 'core' }, null, 2);
        runValidate();
      });

      // ---- MCP tools/list mode ----
      const mcpInput = document.getElementById('mcp-input');
      const mcpStatus = document.getElementById('mcp-status');
      const mcpResults = document.getElementById('mcp-results');
      const mcpSummary = document.getElementById('mcp-summary');
      const mcpTokenNote = document.getElementById('mcp-token-note');

      function issueList(items, tone) {
        const ul = el('ul', 'mt-2 space-y-1 text-sm');
        items.forEach(function(it) {
          const li = el('li', 'flex gap-2 items-start');
          li.appendChild(el('span', 'shrink-0 rounded px-1.5 text-xs font-medium ' + (tone === 'error' ? 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200' : 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200'), tone === 'error' ? 'Error' : 'Warning'));
          const body = el('span', 'min-w-0 text-foreground');
          if (it.path) {
            body.appendChild(el('code', 'font-mono text-xs', it.path));
            body.appendChild(document.createTextNode(' '));
          }
          body.appendChild(document.createTextNode(it.message));
          li.appendChild(body);
          ul.appendChild(li);
        });
        return ul;
      }

      function runMcp() {
        mcpResults.textContent = '';
        mcpSummary.classList.add('hidden');
        mcpTokenNote.classList.add('hidden');
        const parsed = parseField(mcpInput, 'The input');
        markInvalid(mcpInput, !parsed.ok);
        if (!parsed.ok) { paintStatus(mcpStatus, parsed.message, true); return; }
        const Validator = validatorOrError(mcpStatus);
        if (!Validator) return;
        const r = schemaLogic.checkMcpTools(parsed.value, Validator);
        if (r.error) { markInvalid(mcpInput, true); paintStatus(mcpStatus, r.error, true); return; }
        document.getElementById('mcp-count').textContent = String(r.tools.length);
        document.getElementById('mcp-errors').textContent = String(r.errorCount);
        document.getElementById('mcp-warnings').textContent = String(r.warningCount);
        document.getElementById('mcp-tokens').textContent = '~' + r.tokenEstimate.toLocaleString('en-US');
        mcpSummary.classList.remove('hidden');
        mcpTokenNote.classList.remove('hidden');
        paintStatus(mcpStatus, 'Read ' + r.source + ' with ' + r.tools.length + ' tool' + (r.tools.length === 1 ? '' : 's') + ': ' + r.errorCount + ' error' + (r.errorCount === 1 ? '' : 's') + ', ' + r.warningCount + ' warning' + (r.warningCount === 1 ? '' : 's') + '.', r.errorCount > 0);
        if (r.notes.length) {
          const box = el('div', 'rounded-lg border border-border p-3');
          box.appendChild(el('h3', 'text-sm font-semibold text-foreground', 'Response'));
          const errs = r.notes.filter(function(n) { return n.level === 'error'; });
          const infos = r.notes.filter(function(n) { return n.level !== 'error'; });
          if (errs.length) box.appendChild(issueList(errs, 'error'));
          infos.forEach(function(n) { box.appendChild(el('p', 'mt-2 text-sm text-muted-foreground', n.message)); });
          mcpResults.appendChild(box);
        }
        r.tools.forEach(function(t) {
          const card = el('section', 'rounded-lg border border-border p-3');
          const top = el('div', 'flex flex-wrap items-baseline justify-between gap-2');
          const title = el('h3', 'text-sm font-semibold text-foreground break-all');
          title.appendChild(el('span', 'text-muted-foreground font-normal mr-1', '#' + (t.index + 1)));
          title.appendChild(el('code', 'font-mono', t.name || '(no name)'));
          top.appendChild(title);
          top.appendChild(el('span', 'text-xs text-muted-foreground', '~' + t.tokens + ' tokens (estimate)'));
          card.appendChild(top);
          if (t.errors.length) card.appendChild(issueList(t.errors, 'error'));
          if (t.warnings.length) card.appendChild(issueList(t.warnings, 'warning'));
          if (!t.errors.length && !t.warnings.length) card.appendChild(el('p', 'mt-2 text-sm text-muted-foreground', 'No problems found.'));
          mcpResults.appendChild(card);
        });
      }

      document.getElementById('mcp-run').addEventListener('click', runMcp);
      mcpInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runMcp(); }
      });
      document.getElementById('mcp-sample').addEventListener('click', function() {
        mcpInput.value = JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: {
            tools: [
              {
                name: 'get_weather',
                title: 'Weather Information Provider',
                description: 'Get current weather information for a location',
                inputSchema: { type: 'object', properties: { location: { type: 'string', description: 'City name or zip code' } }, required: ['location'] },
                annotations: { readOnlyHint: true, openWorldHint: true }
              },
              {
                name: 'run shell',
                description: 'Execute a shell command on the host and return stdout.',
                inputSchema: { type: 'object', properties: { cmd: { type: 'string' } }, required: ['cmd', 'cwd'] }
              },
              {
                name: 'delete_file',
                description: 'Delete a file from the workspace.',
                inputSchema: { type: 'array' }
              }
            ]
          }
        }, null, 2);
        runMcp();
      });
    </script>
  `;

  return respondHTML(
    createPageTemplate({
      title,
      description,
      path: "/json-schema-studio",
      content,
      scripts,
      lang: currentLang,
    }),
  );
}
