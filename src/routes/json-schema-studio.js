import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet } from '../utils/common-ui.js';

export async function handleJsonSchemaStudioRoutes(request) {
  const title = 'JSON Schema Studio';
  const description = 'Generate a JSON Schema from JSON input automatically. Fast, private, and perfect for API documentation.';

  const header = createToolHeader(
    { emoji: '📋' },
    title,
    'Turn any JSON sample into a valid JSON Schema instantly. Use it for validation, documentation, or code generation.',
    [{ text: 'Auto-Generator', tooltip: 'Automatically infers a JSON Schema from your sample JSON input.' },
     { text: 'JSON Schema', tooltip: 'Produces schemas that comply with the JSON Schema specification.' },
     { text: 'Privacy-First', tooltip: 'All processing happens in your browser — no data is sent to any server.' }],
    { toolId: 'json-schema-studio' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      ${header}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Input -->
        <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.json-schema-studio.ui.heading4">Input JSON</h2>
            <div class="flex gap-2">
              <button id="format-btn" class="text-xs text-primary-600 hover:underline"><span data-i18n="tools.json-schema-studio.ui.button0">Beautify</span></button>
              <button id="sample-btn" class="text-xs text-primary-600 hover:underline"><span data-i18n="tools.json-schema-studio.ui.button1">Sample</span></button>
            </div>
          </div>
          <textarea id="json-input" rows="20" data-tooltip="Paste JSON to auto-generate its JSON Schema" 
            class="w-full p-4 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm text-surface-900 dark:text-white resize-none"
            placeholder='{ "name": "John", "age": 30 }'></textarea>
          <button id="generate-btn" data-tooltip="Analyze JSON structure and generate a matching schema" class="w-full mt-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition shadow-md"><span data-i18n="tools.json-schema-studio.ui.button2">Generate JSON Schema</span></button>
        </div>

        <!-- Output -->
        <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5 flex flex-col">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.json-schema-studio.ui.heading5">JSON Schema Result</h2>
            <button id="copy-btn" data-tooltip="Copy generated schema to clipboard" class="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"><span data-i18n="tools.json-schema-studio.ui.button3">Copy Schema</span></button>
          </div>
          <pre class="flex-1 bg-surface-900 text-surface-50 p-4 rounded-lg text-sm font-mono overflow-auto min-h-[400px]" id="schema-output">Schema will appear here...</pre>
        </div>
      </div>

      ${createCheatsheet('json-schema-studio', 'JSON Schema Keywords', [
        { heading: 'Type Keywords', content: `
          <table>
            <tr><th>Keyword</th><th>Description</th></tr>
            <tr><td><code>type</code></td><td>Data type (string, number, integer, boolean, object, array, null)</td></tr>
            <tr><td><code>enum</code></td><td>Allowed values list</td></tr>
            <tr><td><code>const</code></td><td>Single allowed value</td></tr>
            <tr><td><code>$ref</code></td><td>Reference another schema</td></tr>
          </table>` },
        { heading: 'Validation Keywords', content: `
          <table>
            <tr><th>Type</th><th>Keywords</th></tr>
            <tr><td>String</td><td><code>minLength</code>, <code>maxLength</code>, <code>pattern</code>, <code>format</code></td></tr>
            <tr><td>Number</td><td><code>minimum</code>, <code>maximum</code>, <code>multipleOf</code>, <code>exclusiveMinimum</code></td></tr>
            <tr><td>Object</td><td><code>required</code>, <code>properties</code>, <code>additionalProperties</code>, <code>minProperties</code></td></tr>
            <tr><td>Array</td><td><code>items</code>, <code>minItems</code>, <code>maxItems</code>, <code>uniqueItems</code></td></tr>
          </table>` }
      ])}
    </main>
  `;

  const scripts = `
    <script src="/vendor/to-json-schema.min.js" integrity="sha384-SQtZqPfpn1uLbqIZ/C7YZy247iVhjHtJ9ZQNjmXtwPApoyZ0qWOpB7EcWNDfRt8H" crossorigin="anonymous"></script>
    <script>
      const toJsonSchemaFn = window.toJsonSchema;

      const input = document.getElementById('json-input');
      const output = document.getElementById('schema-output');
      const generateBtn = document.getElementById('generate-btn');
      const formatBtn = document.getElementById('format-btn');
      const sampleBtn = document.getElementById('sample-btn');
      const copyBtn = document.getElementById('copy-btn');

      function generateSchema() {
        const jsonText = input.value.trim();
        if (!jsonText) return;

        if (typeof toJsonSchemaFn !== 'function') {
          output.textContent = _t('tools.json-schema-studio.js.text0', 'Schema generator failed to load.');
          return;
        }

        try {
          const jsonObj = JSON.parse(jsonText);
          const schema = toJsonSchemaFn(jsonObj, {
            required: true,
            postProcessFnc: (type, schema, value, defaultFunc) => {
              return { ...schema, title: 'Generated Schema' };
            }
          });
          output.textContent = JSON.stringify(schema, null, 2);
        } catch (e) {
          output.textContent = 'Invalid JSON: ' + e.message;
        }
      }

      generateBtn.addEventListener('click', generateSchema);

      formatBtn.addEventListener('click', () => {
        try {
          input.value = JSON.stringify(JSON.parse(input.value), null, 2);
        } catch (e) {}
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
        navigator.clipboard.writeText(output.textContent).then(() => {
          const original = copyBtn.innerText;
          copyBtn.innerText = _t('tools.json-schema-studio.js.text2', 'Copied!');
          setTimeout(() => copyBtn.innerText = original, 2000);
        });
      });
    </script>
  `;

  return respondHTML(createPageTemplate({
    title,
    description,
    path: '/json-schema-studio',
    content,
    scripts
  }));
}
