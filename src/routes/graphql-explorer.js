import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleGraphQLExplorerRoutes(request, url) {
  if (url.pathname !== '/graphql-explorer' && url.pathname !== '/graphql-explorer/') return null;
  if (request.method !== 'GET') return null;
  const lang = resolveRequestLanguage(request, url);
  return renderGraphQLExplorerPage(lang);
}

function renderGraphQLExplorerPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('graphql-explorer', currentLang);
  const title = translation?.name || 'GraphQL Explorer';
  const description = translation?.desc || 'Introspect GraphQL schemas and run queries against live endpoints.';

  const header = createToolHeader(
    { emoji: '🔮' },
    title,
    description,
    [
      { text: translation?.ui?.badge0 || 'Client-Side', tooltip: 'All requests are made directly from your browser to the GraphQL endpoint.' },
      { text: translation?.ui?.badge1 || 'CORS-Ready', tooltip: 'Introspection queries work with most public GraphQL APIs.' }
    ],
    { toolId: 'graphql-explorer' }
  );

  const currentTool = TOOLS.find(t => t.id === 'graphql-explorer');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      ${header}

      <!-- Endpoint + Auth Row -->
      <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5 mb-6">
        <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div class="flex-1 w-full">
            <label for="endpoint-url" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1" data-i18n="tools.graphql-explorer.ui.label0">GraphQL Endpoint</label>
            <input type="url" id="endpoint-url" 
              class="w-full p-2.5 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500"
              placeholder="https://api.example.com/graphql"
              data-i18n-placeholder="tools.graphql-explorer.ui.placeholder0">
          </div>
          <div class="w-full sm:w-64">
            <label for="auth-header" class="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1" data-i18n="tools.graphql-explorer.ui.label1">Authorization (optional)</label>
            <input type="text" id="auth-header"
              class="w-full p-2.5 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500"
              placeholder="Bearer eyJ..."
              data-i18n-placeholder="tools.graphql-explorer.ui.placeholder1">
          </div>
          <button id="introspect-btn" class="btn btn-secondary whitespace-nowrap" data-i18n="tools.graphql-explorer.ui.button0">Introspect Schema</button>
        </div>
        <div id="schema-error" class="hidden mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400"></div>
      </div>

      <!-- Schema Browser + Editor Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <!-- Schema Tree -->
        <div class="lg:col-span-2 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
          <div class="flex justify-between items-center mb-3">
            <h2 class="text-base font-semibold text-surface-900 dark:text-white" data-i18n="tools.graphql-explorer.ui.heading0">Schema Explorer</h2>
            <button id="toggle-schema-btn" class="btn btn-ghost btn-xs" data-i18n="tools.graphql-explorer.ui.button1">Collapse All</button>
          </div>
          <div id="schema-tree" class="text-sm font-mono max-h-[500px] overflow-y-auto space-y-0.5">
            <p class="text-surface-400 dark:text-surface-500 text-xs italic" data-i18n="tools.graphql-explorer.ui.text0">Enter an endpoint and click Introspect Schema to explore the types.</p>
          </div>
        </div>

        <!-- Query Editor -->
        <div class="lg:col-span-3 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
          <div class="flex justify-between items-center mb-3">
            <h2 class="text-base font-semibold text-surface-900 dark:text-white" data-i18n="tools.graphql-explorer.ui.heading1">Query Editor</h2>
            <button id="format-query-btn" class="btn btn-ghost btn-xs" data-i18n="tools.graphql-explorer.ui.button2">Format</button>
          </div>
          <textarea id="query-editor" rows="10"
            class="w-full p-3 bg-surface-950 text-surface-50 border border-surface-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-primary-500 resize-y"
            placeholder="{ &quot;query&quot;: &quot;{ __schema { types { name } } }&quot; }"
            data-i18n-placeholder="tools.graphql-explorer.ui.placeholder2"></textarea>
        </div>
      </div>

      <!-- Variables + Response Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Variables Panel -->
        <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
          <div class="flex justify-between items-center mb-3">
            <h2 class="text-base font-semibold text-surface-900 dark:text-white" data-i18n="tools.graphql-explorer.ui.heading2">Variables</h2>
            <span class="text-xs text-surface-400" data-i18n="tools.graphql-explorer.ui.text1">JSON object</span>
          </div>
          <textarea id="variables-editor" rows="6"
            class="w-full p-3 bg-surface-950 text-surface-50 border border-surface-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-primary-500 resize-y"
            placeholder='{ "id": "123" }'
            data-i18n-placeholder="tools.graphql-explorer.ui.placeholder3"></textarea>
        </div>

        <!-- Response Panel -->
        <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
          <div class="flex justify-between items-center mb-3">
            <h2 class="text-base font-semibold text-surface-900 dark:text-white" data-i18n="tools.graphql-explorer.ui.heading3">Response</h2>
            <div class="flex items-center gap-2">
              <span id="response-timing" class="text-xs text-surface-400 dark:text-surface-500 font-mono"></span>
              <button id="copy-response-btn" class="btn btn-ghost btn-xs" data-i18n="tools.graphql-explorer.ui.button3">Copy</button>
            </div>
          </div>
          <pre id="response-output" class="bg-surface-950 text-surface-50 p-4 rounded-lg text-xs font-mono overflow-auto min-h-[160px] max-h-[300px]"><code class="text-surface-400" data-i18n="tools.graphql-explorer.ui.text2">Response will appear here...</code></pre>
        </div>
      </div>

      <!-- Execute Button -->
      <div class="flex justify-center mb-8">
        <button id="execute-btn" class="btn btn-primary btn-lg px-12" data-i18n="tools.graphql-explorer.ui.button4">Execute Query</button>
      </div>

      ${createRelatedToolsSection(relatedToolsData)}
    </main>
  `;

  const scripts = `
    <script type="module">
    const endpointUrl = document.getElementById('endpoint-url');
    const authHeader = document.getElementById('auth-header');
    const introspectBtn = document.getElementById('introspect-btn');
    const schemaError = document.getElementById('schema-error');
    const schemaTree = document.getElementById('schema-tree');
    const toggleSchemaBtn = document.getElementById('toggle-schema-btn');
    const queryEditor = document.getElementById('query-editor');
    const formatQueryBtn = document.getElementById('format-query-btn');
    const variablesEditor = document.getElementById('variables-editor');
    const responseOutput = document.getElementById('response-output');
    const responseTiming = document.getElementById('response-timing');
    const copyResponseBtn = document.getElementById('copy-response-btn');
    const executeBtn = document.getElementById('execute-btn');

    // ── Introspection helpers ──────────────────────────────────────────────

    const INTROSPECTION_QUERY = \`
      query IntrospectionQuery {
        __schema {
          queryType { name }
          mutationType { name }
          subscriptionType { name }
          types {
            kind
            name
            description
            fields(includeDeprecated: true) {
              name
              description
              args {
                name
                description
                type { name kind ofType { name kind } }
                defaultValue
              }
              type { name kind ofType { name kind } }
              isDeprecated
              deprecationReason
            }
            inputFields {
              name
              description
              type { name kind ofType { name kind } }
              defaultValue
            }
            interfaces {
              name
              kind
              ofType { name kind }
            }
            enumValues(includeDeprecated: true) {
              name
              description
              isDeprecated
              deprecationReason
            }
          }
          directives {
            name
            description
            locations
            args {
              name
              description
              type { name kind ofType { name kind } }
              defaultValue
            }
          }
        }
      }
    \`.trim();

    async function runGQL(query, variables, operationName) {
      const headers = { 'Content-Type': 'application/json' };
      const auth = authHeader.value.trim();
      if (auth) headers['Authorization'] = auth;

      const body = JSON.stringify({ query, variables: variables || null, operationName: operationName || null });

      const start = performance.now();
      const res = await fetch(endpointUrl.value.trim(), { method: 'POST', headers, body });
      const elapsed = Math.round(performance.now() - start);

      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { json = { errors: [{ message: 'Non-JSON response: ' + text.slice(0, 200) }] }; }

      return { status: res.status, ok: res.ok, data: json.data, errors: json.errors, elapsed };
    }

    // ── Schema rendering ────────────────────────────────────────────────────

    let schemaData = null;
    let collapsedTypes = new Set();

    function renderSchema(schema) {
      if (!schema) return;
      schemaData = schema;
      collapsedTypes.clear();

      const typeMap = {};
      schema.types.forEach(t => { typeMap[t.name] = t; });

      // Build tree starting from Query root
      const roots = [];
      if (schema.queryType) {
        const qt = typeMap[schema.queryType.name];
        if (qt) roots.push(qt);
      }
      if (schema.mutationType) {
        const mt = typeMap[schema.mutationType.name];
        if (mt) roots.push(mt);
      }
      if (schema.subscriptionType) {
        const st = typeMap[schema.subscriptionType.name];
        if (st) roots.push(st);
      }

      // Add root operations to schema tree
      let html = '';

      if (schema.queryType) {
        const qt = typeMap[schema.queryType.name];
        if (qt) html += renderTypeNode(qt, typeMap, 0, true);
      }
      if (schema.mutationType) {
        const mt = typeMap[schema.mutationType.name];
        if (mt) html += renderTypeNode(mt, typeMap, 0, true);
      }
      if (schema.subscriptionType) {
        const st = typeMap[schema.subscriptionType.name];
        if (st) html += renderTypeNode(st, typeMap, 0, true);
      }

      // Also list all types not shown under root
      const shown = new Set();
      function collectShown(t) {
        if (!t || !t.name || t.kind === 'SCALAR' || t.kind === 'INPUT_OBJECT') return;
        shown.add(t.name);
        if (t.fields) t.fields.forEach(f => { if (f.type) collectShown(f.type.ofType || f.type); });
        if (t.inputFields) t.inputFields.forEach(f => { if (f.type) collectShown(f.type.ofType || f.type); });
        if (t.interfaces) t.interfaces.forEach(i => { if (i.ofType) collectShown(i.ofType); });
      }
      [schema.queryType, schema.mutationType, schema.subscriptionType].forEach(rt => {
        if (rt) {
          const t = typeMap[rt.name];
          if (t) collectShown(t);
        }
      });

      const unshown = schema.types.filter(t => t.name && !shown.has(t.name) && t.kind !== 'SCALAR' && t.kind !== 'ENUM' && t.name !== '__Schema' && t.name !== '__Type' && t.name !== '__Field' && t.name !== '__InputValue' && t.name !== '__EnumValue' && t.name !== '__Directive' && t.name !== '__DirectiveLocation');
      if (unshown.length) {
        html += '<div class="mt-3 border-t border-surface-200 dark:border-surface-700 pt-3">';
        html += '<div class="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase mb-2 cursor-pointer" data-i18n="tools.graphql-explorer.ui.text3">Other Types</div>';
        html += unshown.map(t => renderTypeNode(t, typeMap, 0, false)).join('');
        html += '</div>';
      }

      schemaTree.innerHTML = html;
      bindTreeEvents();
    }

    function renderTypeNode(type, typeMap, depth, expandable) {
      if (!type || !type.name) return '';
      if (type.name.startsWith('__')) return '';

      const indent = '&nbsp;'.repeat(depth * 2);
      const kindColors = {
        'SCALAR': 'text-amber-500',
        'OBJECT': 'text-blue-500',
        'INTERFACE': 'text-purple-500',
        'UNION': 'text-green-500',
        'ENUM': 'text-emerald-500',
        'INPUT_OBJECT': 'text-orange-500',
      };
      const kindColor = kindColors[type.kind] || 'text-surface-400';

      const shortDesc = type.description ? type.description.slice(0, 60) + (type.description.length > 60 ? '…' : '') : '';

      let html = '';
      const isCollapsed = collapsedTypes.has(type.name);
      const chevron = expandable ? (isCollapsed ? '&#9654;' : '&#9660;') : '&#x25B8;';
      const canToggle = expandable && type.kind === 'OBJECT' && type.fields && type.fields.length > 0;

      html += '<div class="type-node py-0.5 px-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 cursor-default">';
      html += '<span class="inline-block cursor-pointer ' + (canToggle ? 'font-semibold' : '') + '" data-type="' + type.name + '" data-expandable="' + (canToggle ? '1' : '0') + '">';
      html += '<span class="text-surface-400 mx-0.5">' + chevron + '</span>';
      html += '<span class="' + kindColor + '">' + escapeHtml(type.name) + '</span>';
      if (type.kind !== 'OBJECT') html += ' <span class="text-xs text-surface-400">(' + type.kind + ')</span>';
      html += '</span>';
      if (shortDesc) html += ' <span class="text-xs text-surface-400">— ' + escapeHtml(shortDesc) + '</span>';
      html += '</div>';

      // Children (only shown if not collapsed)
      if (!isCollapsed && type.fields && type.fields.length > 0) {
        type.fields.forEach(field => {
          const ftype = resolveType(field.type);
          const fkindColor = kindColors[ftype.kind] || 'text-surface-400';
          const fdesc = field.description ? field.description.slice(0, 50) : '';
          const deprec = field.isDeprecated ? ' ❌' : '';
          html += '<div class="py-0.5 px-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800">';
          html += indent + '&nbsp;&nbsp;<span class="text-surface-600 dark:text-surface-400">';
          html += '<span class="text-primary-600 dark:text-primary-400">' + escapeHtml(field.name) + '</span>';
          html += '(' + (field.args && field.args.length ? field.args.map(a => escapeHtml(a.name) + ': ' + resolveTypeName(a.type)).join(', ') : '') + ')';
          html += ': <span class="' + fkindColor + '">' + escapeHtml(resolveTypeName(field.type)) + '</span>';
          html += deprec;
          html += '</span>';
          if (fdesc) html += ' <span class="text-xs text-surface-400">— ' + escapeHtml(fdesc) + '</span>';
          html += '</div>';
        });
      }

      if (!isCollapsed && type.inputFields && type.inputFields.length > 0) {
        html += '<div class="px-1 text-xs text-surface-500 dark:text-surface-400 italic py-0.5">' + indent + '&nbsp;&nbsp;input fields: ' + type.inputFields.map(f => escapeHtml(f.name) + ': ' + resolveTypeName(f.type)).join(', ') + '</div>';
      }

      if (!isCollapsed && type.enumValues && type.enumValues.length > 0) {
        type.enumValues.forEach(ev => {
          const edeprec = ev.isDeprecated ? ' ❌' : '';
          html += '<div class="py-0.5 px-1">';
          html += indent + '&nbsp;&nbsp;<span class="text-emerald-600 dark:text-emerald-400">=' + escapeHtml(ev.name) + '</span>' + edeprec;
          if (ev.description) html += ' <span class="text-xs text-surface-400">— ' + escapeHtml(ev.description.slice(0, 50)) + '</span>';
          html += '</div>';
        });
      }

      return html;
    }

    function resolveType(typeRef) {
      if (!typeRef) return { name: 'Unknown', kind: 'SCALAR' };
      if (typeRef.ofType) return resolveType(typeRef.ofType);
      return typeRef;
    }

    function resolveTypeName(typeRef) {
      if (!typeRef) return 'Unknown';
      if (typeRef.ofType) return resolveTypeName(typeRef.ofType);
      return typeRef.name || typeRef.kind || 'Unknown';
    }

    function bindTreeEvents() {
      schemaTree.querySelectorAll('[data-type]').forEach(el => {
        el.addEventListener('click', e => {
          const typeName = el.dataset.type;
          const expandable = el.dataset.expandable === '1';
          if (expandable) {
            if (collapsedTypes.has(typeName)) {
              collapsedTypes.delete(typeName);
            } else {
              collapsedTypes.add(typeName);
            }
            runGQL(INTROSPECTION_QUERY, null).then(res => {
              if (res.data && res.data.__schema) renderSchema(res.data.__schema);
            }).catch(() => {});
          } else {
            // Insert type name into query
            const name = typeName;
            queryEditor.value = '{ ' + name + ' { ' + getDefaultFields(typeName) + ' } }';
          }
        });
      });
    }

    function getDefaultFields(typeName) {
      if (!schemaData) return 'id';
      const t = schemaData.types.find(t => t.name === typeName);
      if (!t || !t.fields) return 'id';
      return t.fields.filter(f => !f.isDeprecated).slice(0, 5).map(f => f.name).join(' ');
    }

    // ── Event handlers ──────────────────────────────────────────────────────

    introspectBtn.addEventListener('click', async () => {
      const url = endpointUrl.value.trim();
      if (!url) { showError(_t('tools.graphql-explorer.js.text3', 'Please enter a GraphQL endpoint URL.')); return; }
      schemaError.classList.add('hidden');
      introspectBtn.disabled = true;
      introspectBtn.textContent = _t('tools.graphql-explorer.ui.button5', 'Loading…');

      try {
        const res = await runGQL(INTROSPECTION_QUERY, null);
        if (res.errors) {
          showError(_t('tools.graphql-explorer.js.text4', 'Introspection failed:') + ' ' + (res.errors[0]?.message || 'Unknown error'));
        } else if (res.data && res.data.__schema) {
          renderSchema(res.data.__schema);
          // Set default example query
          if (res.data.__schema.queryType) {
            queryEditor.value = '{ ' + res.data.__schema.queryType.name + ' { ' + getDefaultFields(res.data.__schema.queryType.name) + ' } }';
          }
        }
      } catch (e) {
        showError(_t('tools.graphql-explorer.js.text5', 'Fetch error:') + ' ' + e.message);
      } finally {
        introspectBtn.disabled = false;
        introspectBtn.textContent = _t('tools.graphql-explorer.ui.button0', 'Introspect Schema');
      }
    });

    executeBtn.addEventListener('click', async () => {
      const query = queryEditor.value.trim();
      if (!query) { showResponseError(_t('tools.graphql-explorer.js.text6', 'Please enter a query.')); return; }
      const url = endpointUrl.value.trim();
      if (!url) { showResponseError(_t('tools.graphql-explorer.js.text7', 'Please enter an endpoint URL.')); return; }

      let variables = null;
      const varText = variablesEditor.value.trim();
      if (varText) {
        try { variables = JSON.parse(varText); } catch(e) {
          showResponseError(_t('tools.graphql-explorer.js.text8', 'Invalid variables JSON:') + ' ' + e.message);
          return;
        }
      }

      executeBtn.disabled = true;
      executeBtn.textContent = _t('tools.graphql-explorer.ui.button6', 'Running…');
      responseTiming.textContent = '';
      responseOutput.innerHTML = '<code class="text-surface-400">Running query...</code>';

      try {
        const res = await runGQL(query, variables);
        responseTiming.textContent = res.elapsed + 'ms';

        if (res.errors) {
          const errHtml = '<div class="text-red-400">' + _t('tools.graphql-explorer.js.text9', 'Errors:') + '</div>' +
            highlightJSON(JSON.stringify({ errors: res.errors }, null, 2));
          responseOutput.innerHTML = errHtml;
        } else if (res.data) {
          responseOutput.innerHTML = highlightJSON(JSON.stringify(res.data, null, 2));
        } else {
          responseOutput.innerHTML = '<code class="text-surface-400">Empty response</code>';
        }
      } catch (e) {
        responseOutput.innerHTML = '<div class="text-red-400">' + _t('tools.graphql-explorer.js.text10', 'Request failed:') + ' ' + escapeHtml(e.message) + '</div>';
      } finally {
        executeBtn.disabled = false;
        executeBtn.textContent = _t('tools.graphql-explorer.ui.button4', 'Execute Query');
      }
    });

    formatQueryBtn.addEventListener('click', () => {
      const text = queryEditor.value.trim();
      if (!text) return;
      try {
        const parsed = JSON.parse(text);
        queryEditor.value = JSON.stringify(parsed, null, 2);
      } catch {
        // Try to pretty-print as GraphQL (simple indent)
        queryEditor.value = text.replace(/\\s+/g, ' ').replace(/\\{/g, ' { ').replace(/}/g, ' } ').replace(/,/g, ', ');
      }
    });

    toggleSchemaBtn.addEventListener('click', () => {
      if (collapsedTypes.size > 0) {
        collapsedTypes.clear();
      } else if (schemaData) {
        schemaData.types.forEach(t => { if (t.kind === 'OBJECT') collapsedTypes.add(t.name); });
      }
      runGQL(INTROSPECTION_QUERY, null).then(res => {
        if (res.data && res.data.__schema) renderSchema(res.data.__schema);
      }).catch(() => {});
    });

    copyResponseBtn.addEventListener('click', () => {
      const text = responseOutput.textContent || '';
      copyToClipboard(text, copyResponseBtn);
    });

    // ── Utilities ──────────────────────────────────────────────────────────

    function escapeHtml(str) {
      return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function copyToClipboard(text, btnEl) {
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        const orig = btnEl.textContent;
        btnEl.textContent = '✓';
        setTimeout(() => { btnEl.textContent = orig; }, 1500);
      }).catch(() => {});
    }

    function showError(msg) {
      schemaError.textContent = msg;
      schemaError.classList.remove('hidden');
    }

    function showResponseError(msg) {
      responseOutput.innerHTML = '<code class="text-red-400">' + escapeHtml(msg) + '</code>';
      responseTiming.textContent = '';
    }

    function highlightJSON(json) {
      return json
        .replace(/&quot;/g, '"')
        .replace(/(".*?")\\s*:/g, '<span class="text-blue-400">$1</span>:')
        .replace(/:\\s*(".*?")(?=[,}\\]])/g, ': <span class="text-emerald-400">$1</span>')
        .replace(/\\b(true|false|null)\\b/g, '<span class="text-amber-400">$1</span>')
        .replace(/\\b(-?\\d+\\.?\\d*)\\b/g, '<span class="text-orange-400">$1</span>');
    }
    </script>
  `;

  return respondHTML(createPageTemplate({
    title,
    description,
    lang: currentLang,
    path: '/graphql-explorer',
    content,
    scripts
  }));
}