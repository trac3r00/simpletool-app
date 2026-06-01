/**
 * Mock Data Generator
 * Generates synthetic records entirely client-side
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleMockDataRoutes(request, url) {
  const { pathname } = url;

  if (pathname === '/mock-data-generator' || pathname === '/mock-data-generator/') {
    if (request.method === 'GET') {
      return respondHTML(renderMockDataPage(resolveRequestLanguage(request, url)));
    }
    return respondJSON({ error: 'Method not allowed' }, { status: 405 });
  }

  return null;
}

function renderMockDataPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('mock-data-generator', currentLang);
  const toolHeader = createToolHeader(
    { emoji: '📊' },
    translation?.name || 'Mock Data Generator',
    translation?.desc || 'Produce privacy-safe placeholder data for JSON, CSV, or SQL workflows. Perfect for demos, seeding, or QA.',
    [
      { text: translation?.ui?.badge13 || 'Client-Side Only', tooltip: 'Runs entirely in your browser using Web APIs — your data never leaves your device.' }
    ],
    { toolId: 'mock-data-generator' }
  );

  const currentTool = TOOLS.find(t => t.id === 'mock-data-generator');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];
  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}
` + String.raw`
        <div class="space-y-8">
          <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 md:p-8 space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-2">
              <label for="row-count" class="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-[0.2em]"><span data-i18n="tools.mock-data-generator.ui.label2">Rows</span> ${infoHint('Generate 10-500 rows; higher counts run longer but stay inside the browser.')}</label>
              <input id="row-count" type="number" data-tooltip="Number of data rows to generate (10-500)" data-i18n-tooltip="tools.mock-data-generator.ui.tip0" min="10" max="500" value="25" class="w-full px-4 py-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 text-base text-surface-900 dark:text-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500" />
              <p class="text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.mock-data-generator.ui.desc8">Generate between 10 and 500 records.</p>
            </div>
            <div class="space-y-2">
              <label for="output-format" class="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-[0.2em]"><span data-i18n="tools.mock-data-generator.ui.label3">Format</span></label>
              <select id="output-format" data-tooltip="Choose output format for generated data" data-i18n-tooltip="tools.mock-data-generator.ui.tip1" class="w-full px-4 py-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-950 text-base text-surface-900 dark:text-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500" aria-label="Output format">
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="sql" data-i18n="tools.mock-data-generator.ui.option5">SQL INSERT</option>
              </select>
              <p class="text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.mock-data-generator.ui.desc9">Switch formats instantly.</p>
            </div>
            <div id="sql-options" class="hidden space-y-2">
              <label for="table-name" class="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-[0.2em]"><span data-i18n="tools.mock-data-generator.ui.label4">Table Name</span> ${infoHint('Used by SQL output; keep it alphanumeric and lowercase if you plan to import it.')}</label>
              <input id="table-name" type="text" value="mock_data" class="w-full px-4 py-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 text-base text-surface-900 dark:text-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500" />
              <p class="text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.mock-data-generator.ui.desc10">For INSERT statements.</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-surface-100 dark:border-surface-800 pb-2">
              <p class="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-[0.2em]" data-i18n="tools.mock-data-generator.ui.desc11">Fields</p>
              <span class="text-xs text-surface-600 dark:text-surface-400" data-i18n="tools.mock-data-generator.ui.desc12">Select columns to include</span>
            </div>
            <div id="field-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"></div>
          </div>

          <div class="pt-4 border-t border-surface-100 dark:border-surface-800">
            <button id="generate-data" data-tooltip="Generate random mock data with selected fields" data-i18n-tooltip="tools.mock-data-generator.ui.tip2" class="btn btn-primary w-full md:w-auto md:min-w-[200px] text-lg shadow-lg shadow-primary-600/20 transition transform hover:-translate-y-0.5">
              <span data-i18n="tools.mock-data-generator.ui.button2">Generate Data</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" /></svg>
            </button>
             <div id="data-error" class="mt-4 hidden rounded-lg border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/30 text-sm text-error-700 dark:text-error-200 px-4 py-3">Error</div>
          </div>
        </div>

        <!-- Output & Preview Section -->
        <div class="grid lg:grid-cols-2 gap-8">
             <!-- Output Code Block -->
            <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 flex flex-col h-[600px]">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                  <span class="p-1.5 bg-surface-100 dark:bg-surface-800 rounded-lg text-surface-600">📥</span>
                  <span data-i18n="tools.mock-data-generator.ui.heading2">Output</span>
                </h2>
                <div class="flex gap-2">
                  <button id="copy-output" class="btn btn-secondary btn-sm" disabled><span data-i18n="tools.mock-data-generator.ui.button0">Copy</span></button>
                  <button id="download-output" class="btn btn-secondary btn-sm" disabled><span data-i18n="tools.mock-data-generator.ui.button1">Download</span></button>
                </div>
              </div>
              <div class="relative flex-1 min-h-0 bg-surface-900 rounded-lg overflow-hidden group">
                  <pre id="output-area" class="absolute inset-0 p-4 overflow-auto text-sm text-primary-300 font-mono leading-relaxed selection:bg-primary-500/30" data-i18n="tools.mock-data-generator.ui.desc14">Click "Generate Data" to begin.</pre>
              </div>
            </div>

            <!-- Preview Table -->
            <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 flex flex-col h-[600px]">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                  <span class="p-1.5 bg-surface-100 dark:bg-surface-800 rounded-lg text-surface-600">👁️</span>
                  <span data-i18n="tools.mock-data-generator.ui.heading3">Preview</span> <span class="text-xs font-normal text-surface-600 ml-1" data-i18n="tools.mock-data-generator.ui.desc13">(First 5 rows)</span>
                </h2>
              </div>
              <div class="flex-1 min-h-0 overflow-auto border border-surface-100 dark:border-surface-800 rounded-lg">
                <table class="w-full text-sm text-left border-collapse">
                  <thead class="sticky top-0 bg-surface-50 dark:bg-surface-800/80 backdrop-blur z-10">
                    <tr id="preview-head">
                        <th class="p-4 text-surface-600 font-normal italic" data-i18n="tools.mock-data-generator.ui.th6">Fields will appear here...</th>
                    </tr>
                  </thead>
                  <tbody id="preview-body" class="divide-y divide-surface-100 dark:divide-surface-800 text-surface-700 dark:text-surface-300">
                    <tr><td class="p-4 text-surface-600" data-i18n="tools.mock-data-generator.ui.desc15">No data generated yet.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      ${createCheatsheet('mock-data-generator', 'Mock Data Field Types', [
        { heading: 'Available Types', content: `
          <table>
            <tr><th data-i18n="tools.mock-data-generator.ui.th2">Type</th><th data-i18n="tools.mock-data-generator.ui.th3">Example Output</th></tr>
            <tr><td><code>name</code></td><td>John Smith</td></tr>
            <tr><td><code>email</code></td><td>john@example.com</td></tr>
            <tr><td><code>phone</code></td><td>+1-555-0123</td></tr>
            <tr><td><code>address</code></td><td>123 Main St</td></tr>
            <tr><td><code>date</code></td><td>2024-03-15</td></tr>
            <tr><td><code>uuid</code></td><td>550e8400-e29b...</td></tr>
            <tr><td><code>number</code></td><td>42</td></tr>
            <tr><td><code>boolean</code></td><td>true / false</td></tr>
            <tr><td><code>url</code></td><td>https://example.com</td></tr>
            <tr><td><code>ip</code></td><td>192.168.1.1</td></tr>
            <tr><td><code>color</code></td><td>#ff6b35</td></tr>
            <tr><td><code>company</code></td><td>Acme Corp</td></tr>
          </table>` }
      ])}
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'What is Mock Data?',
          content: '<p>Mock data is synthetic information that mimics real-world data without containing any sensitive or personally identifiable information (PII). It is essential for developers and testers who need realistic datasets to build and validate applications without risking data breaches or violating privacy regulations like GDPR or CCPA. By using mock data, you can simulate various scenarios, from standard user profiles to edge cases, ensuring your software handles all types of input gracefully.</p>'
        },
        {
          title: 'Testing Strategies',
          content: '<p>Effective testing requires diverse datasets. Use mock data to seed your development databases, perform load testing with thousands of records, or verify UI layouts with varying string lengths. It\'s particularly useful for integration testing where you need predictable responses from external APIs. By generating data locally, you can create consistent test environments that are easy to reset and reproduce, leading to more reliable and faster development cycles.</p>'
        },
        {
          title: 'Data Privacy in Mocks',
          content: '<p>Privacy is a top priority in modern software development. Using real production data in development or staging environments is a major security risk. Mock data generators solve this by producing "fake" but structurally correct data. Our tool runs entirely in your browser, meaning your configuration and the generated data never leave your device. This "Privacy-First" approach ensures that even the process of creating mock data is secure and compliant with the strictest security standards.</p>'
        },
        {
          title: 'Pro Tips',
          content: '<ul><li><strong>Consistency:</strong> When generating multiple related datasets, use fixed seeds or patterns to maintain referential integrity between tables.</li><li><strong>Edge Cases:</strong> Don\'t just generate "happy path" data. Include empty strings, very long names, and special characters to test your application\'s robustness.</li><li><strong>Format Switching:</strong> Use the SQL export for quick database seeding and CSV for spreadsheet analysis or bulk imports.</li><li><strong>Automation:</strong> While this tool is manual, the patterns it uses can be integrated into your automated CI/CD pipelines for continuous testing.</li></ul>'
        }
      ], 'mock-data-generator', currentLang)}
    </div>
    ${createRelatedToolsSection(relatedToolsData)}

    <script>
      (function() {
        const FIELDS = [
          { id: 'fullName', label: 'Full Name' },
          { id: 'email', label: 'Email' },
          { id: 'username', label: 'Username' },
          { id: 'jobTitle', label: 'Job Title' },
          { id: 'company', label: 'Company' },
          { id: 'phone', label: 'Phone' },
          { id: 'uuid', label: 'UUID' },
          { id: 'address', label: 'Street Address' },
          { id: 'city', label: 'City' },
          { id: 'country', label: 'Country' },
          { id: 'postalCode', label: 'Postal Code' },
          { id: 'ip', label: 'IP Address' },
          { id: 'createdAt', label: 'Created Timestamp' }
        ];

        const rowCountInput = document.getElementById('row-count');
        const formatSelect = document.getElementById('output-format');
        const fieldGrid = document.getElementById('field-grid');
        const generateBtn = document.getElementById('generate-data');
        const outputArea = document.getElementById('output-area');
        const previewHead = document.getElementById('preview-head');
        const previewBody = document.getElementById('preview-body');
        const errorBox = document.getElementById('data-error');
        const copyBtn = document.getElementById('copy-output');
        const downloadBtn = document.getElementById('download-output');
        const sqlOptions = document.getElementById('sql-options');
        const tableNameInput = document.getElementById('table-name');

        fieldGrid.innerHTML = FIELDS.map(field => '<label class="flex items-center gap-3 px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 text-sm font-medium text-surface-700 dark:text-surface-200 bg-surface-50 dark:bg-surface-900/50"><input type="checkbox" value="' + field.id + '" class="accent-primary-600" checked><span>' + field.label + '</span></label>').join('');

        formatSelect.addEventListener('change', () => {
          sqlOptions.classList.toggle('hidden', formatSelect.value !== 'sql');
        });

        generateBtn.addEventListener('click', () => {
          try {
            const rows = clampRows(Number(rowCountInput.value) || 0);
            const fields = Array.from(fieldGrid.querySelectorAll('input[type="checkbox"]:checked')).map(input => input.value);
            if (!fields.length) throw new Error('Select at least one field.');
            const dataset = buildDataset(rows, fields);
            renderPreview(dataset.slice(0, Math.min(5, dataset.length)), fields);
            const payload = renderOutput(dataset, fields);
            outputArea.textContent = payload.content;
            attachDownload(payload.filename, payload.content);
            showError('');
          } catch (error) {
            showError(error.message);
          }
        });

        copyBtn.addEventListener('click', () => {
          if (outputArea.textContent.trim() === '' || outputArea.textContent.includes('Click "Generate data"')) return;
          navigator.clipboard.writeText(outputArea.textContent);
          copyBtn.textContent = _t('tools.mock-data-generator.js.text0', 'Copied!');
          if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
          setTimeout(() => copyBtn.textContent = _t('tools.mock-data-generator.js.text1', 'Copy'), 1500);
        });

        downloadBtn.addEventListener('click', () => {
          const content = outputArea.textContent;
          if (!content || content.includes('Click "Generate data"')) return;
          const filename = downloadBtn.getAttribute('data-filename') || 'mock-data.txt';
          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });

        function clampRows(value) {
          if (value < 10) return 10;
          if (value > 500) return 500;
          return value;
        }

        function showError(message) {
          if (!message) {
            errorBox.classList.add('hidden');
            copyBtn.disabled = downloadBtn.disabled = false;
            return;
          }
          errorBox.textContent = message;
          errorBox.classList.remove('hidden');
        }

        function buildDataset(rows, fields) {
          const data = [];
          for (let i = 0; i < rows; i++) {
            const record = {};
            fields.forEach(field => {
              record[field] = generators[field]();
            });
            data.push(record);
          }
          return data;
        }

        function renderPreview(rows, fields) {
          if (!rows.length) {
            previewHead.innerHTML = '';
            previewBody.innerHTML = '<tr><td class="py-3 text-surface-600">' + (window._t ? window._t('tools.mock-data-generator.js.text2', 'No rows to preview.') : 'No rows to preview.') + '</td></tr>';
            return;
          }
          previewHead.innerHTML = '<tr>' + fields.map(field => '<th class="py-2 pr-4 text-left" data-i18n="tools.mock-data-generator.ui.th7">' + labelFor(field) + '</th>').join('') + '</tr>';
          previewBody.innerHTML = rows.map(row => '<tr>' + fields.map(field => '<td class="py-2 pr-4">' + escapeHtml(row[field]) + '</td>').join('') + '</tr>').join('');
        }

        function renderOutput(dataset, fields) {
          const format = formatSelect.value;
          if (format === 'json') {
            return { filename: 'mock-data.json', content: JSON.stringify(dataset, null, 2) };
          }
          if (format === 'csv') {
            const header = fields.map(labelFor).join(',');
            const rows = dataset.map(row => fields.map(field => '"' + String(row[field]).replace(/"/g, '""') + '"').join(','));
            return { filename: 'mock-data.csv', content: [header, ...rows].join('\n') };
          }
          const table = tableNameInput.value.trim() || 'mock_data';
          const columns = fields.map(field => '"' + field + '"');
          const values = dataset.map(row => '(' + fields.map(field => '\'' + String(row[field]).replace(/'/g, "''") + '\'').join(', ') + ')');
          const sql = 'INSERT INTO ' + table + ' (' + columns.join(', ') + ')\nVALUES\n' + values.join(',\n') + ';';
          return { filename: table + '.sql', content: sql };
        }

        function attachDownload(filename, content) {
          downloadBtn.setAttribute('data-filename', filename);
          copyBtn.disabled = downloadBtn.disabled = false;
        }

        function labelFor(fieldId) {
          const field = FIELDS.find(item => item.id === fieldId);
          return field ? field.label : fieldId;
        }

        function escapeHtml(value) {
          return String(value).replace(/[&<>]/g, function(char) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]; });
        }

        const names = {
          first: ['Avery', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Dakota', 'Skyler', 'Harper', 'Logan', 'Nova', 'Sawyer', 'Emery'],
          last: ['Nguyen', 'Patel', 'Khan', 'Garcia', 'Sato', 'Silva', 'Okafor', 'Hernandez', 'Keller', 'Bautista', 'Ibrahim', 'Cho']
        };
        const cities = ['New York', 'San Francisco', 'Berlin', 'Seoul', 'Singapore', 'Sydney', 'London', 'Toronto', 'Dubai', 'Mexico City'];
        const countries = ['US', 'Germany', 'Japan', 'Canada', 'Australia', 'UK', 'Singapore', 'UAE', 'Brazil', 'Spain'];
        const streets = ['Maple', 'Sunset', 'Riverside', 'Market', 'Lexington', 'Lakeview', 'Cedar', 'Liberty', 'Mission', 'Laurel'];
        const streetSuffix = ['St', 'Ave', 'Blvd', 'Rd', 'Ln'];
        const companies = ['Northwind Labs', 'Helios Works', 'Pixel Foundry', 'Atlas Robotics', 'Azure Ridge', 'Riverloop', 'Solstice Cloud'];
        const jobs = ['Site Reliability Engineer', 'Product Manager', 'Data Scientist', 'Security Analyst', 'Automation QA', 'Support Engineer'];
        const domains = ['example.com', 'acme.dev', 'sandbox.io', 'internal.cloud', 'lab.local'];

        const generators = {
          fullName: () => pick(names.first) + ' ' + pick(names.last),
          email: () => slug(pick(names.first)) + '.' + slug(pick(names.last)) + '@' + pick(domains),
          username: () => slug(pick(names.first)) + randomNumber(100, 999),
          company: () => pick(companies),
          jobTitle: () => pick(jobs),
          phone: () => '+1-' + randomNumber(200, 989) + '-' + randomNumber(200, 989) + '-' + randomNumber(1000, 9999),
          uuid: () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          })),
          address: () => randomNumber(100, 9999) + ' ' + pick(streets) + ' ' + pick(streetSuffix),
          city: () => pick(cities),
          country: () => pick(countries),
          postalCode: () => randomNumber(10000, 99999),
          ip: () => [randomNumber(1, 223), randomNumber(0, 255), randomNumber(0, 255), randomNumber(1, 254)].join('.'),
          createdAt: () => new Date(Date.now() - randomNumber(0, 31536000000)).toISOString()
        };

        function pick(array) {
          return array[Math.floor(Math.random() * array.length)];
        }

        function slug(value) {
          return value.toLowerCase().replace(/[^a-z0-9]/g, '');
        }

        function randomNumber(min, max) {
          return Math.floor(Math.random() * (max - min + 1)) + min;
        }
      })();
    </script>
  `;

  return createPageTemplate({
    title: translation?.name || 'Mock Data Generator',
    description: translation?.desc || 'Generate fake JSON, CSV, or SQL datasets locally for testing and demos.',
    path: '/mock-data-generator',
    content,
    lang: currentLang
  });
}
