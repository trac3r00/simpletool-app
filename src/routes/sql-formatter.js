/**
 * SQL Formatter & Validator
 * - Formats SQL with readable indentation
 * - Detects common syntax issues (quotes/parens/comments)
 * - Dialects: Postgres / MySQL / BigQuery / Snowflake / ClickHouse / SQLite (heuristic)
 */

import { respondHTML } from "../utils/respond.js";
import {
  createPageTemplate,
  createToolHeader,
  createCheatsheet,
  infoHint,
  createEmptyState,
  getBtnLoadingScript,
} from "../utils/common-ui.js";
import {
  createRichEditorPane,
  getRichEditorStyles,
  getRichEditorScript,
} from "../utils/rich-editor.js";
import {
  createEducationalSection,
  createRelatedToolsSection,
} from "../utils/content-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";
import { SQL_FORMATTER_FUNCTIONS } from "../utils/sql-formatter-logic.js";

export async function handleSQLFormatterRoutes(request, url) {
  const { pathname } = url;
  if (pathname === "/sql-formatter" || pathname === "/sql-formatter/") {
    if (request.method === "GET")
      return respondHTML(
        renderSQLFormatterPage(resolveRequestLanguage(request, url)),
      );
    return new Response("Method not allowed", { status: 405 });
  }
  return null;
}

function renderSQLFormatterPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("sql-formatter", currentLang);
  const title = translation?.name || "SQL Formatter & Validator";
  const description =
    translation?.desc ||
    "Format SQL and catch common syntax issues. Supports Postgres/MySQL-friendly formatting (offline).";

  const header = createToolHeader({ emoji: "🗄️" }, title, description, [], {
    toolId: "sql-formatter",
  });

  const currentTool = TOOLS.find((t) => t.id === "sql-formatter");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">
        ${header}

        <div class="flex flex-wrap gap-3 mb-6 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
          <button id="format" class="btn btn-primary">🎨 <span data-i18n="tools.sql-formatter.ui.button0">Format</span></button>
          <button id="validate" class="btn btn-secondary">✓ <span data-i18n="tools.sql-formatter.ui.button1">Validate</span></button>
          <button id="minify" class="btn btn-secondary">📦 <span data-i18n="tools.sql-formatter.ui.button2">Minify</span></button>
          <button id="clear" class="btn btn-ghost ml-auto">🗑️ <span data-i18n="tools.sql-formatter.ui.button3">Clear</span></button>
          <button id="copy" class="btn btn-secondary" disabled>📋 <span data-i18n="tools.sql-formatter.ui.button4">Copy</span></button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-2 min-w-0">
            <label class="label flex items-center gap-2">
              <span data-i18n="tools.sql-formatter.ui.label0">Input SQL</span>
              ${infoHint("This tool does not execute SQL. Validation is heuristic (not a full parser).", "Help", { ariaI18nKey: "tools.sql-formatter.ui.r65_0", i18nKey: "tools.sql-formatter.ui.desc0" })}
            </label>
            ${createRichEditorPane({ id: "sql-in", mode: "textarea", rows: 18, ariaLabel: "SQL input", ariaI18nKey: "tools.sql-formatter.ui.r65_1", placeholder: "SELECT id, email FROM users WHERE created_at > NOW() - INTERVAL '7 days' ORDER BY created_at DESC;" })}

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label for="dialect" class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.sql-formatter.ui.label1">Dialect</label>
                <select id="dialect" class="input">
                  <option value="postgres" data-i18n="tools.sql-formatter.ui.option0">Postgres</option>
                  <option value="mysql" data-i18n="tools.sql-formatter.ui.option1">MySQL</option>
                  <option value="bigquery" data-i18n="tools.sql-formatter.ui.option6">BigQuery</option>
                  <option value="snowflake" data-i18n="tools.sql-formatter.ui.option7">Snowflake</option>
                  <option value="clickhouse" data-i18n="tools.sql-formatter.ui.option8">ClickHouse</option>
                  <option value="sqlite" data-i18n="tools.sql-formatter.ui.option9">SQLite</option>
                </select>
              </div>
              <div>
                <label for="kwcase" class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.sql-formatter.ui.label2">Keyword case</label>
                <select id="kwcase" class="input">
                  <option value="upper" data-i18n="tools.sql-formatter.ui.option2">UPPER</option>
                  <option value="lower" data-i18n="tools.sql-formatter.ui.option3">lower</option>
                  <option value="keep" data-i18n="tools.sql-formatter.ui.option4">keep</option>
                </select>
              </div>
              <div>
                <label for="indent" class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.sql-formatter.ui.label3">Indent</label>
                <select id="indent" class="input">
                  <option value="2" data-i18n="tools.sql-formatter.ui.option5">2 spaces</option>
                  <option value="4" data-i18n="tools.sql-formatter.ui.option10">4 spaces</option>
                </select>
              </div>
            </div>

            <div id="issues" class="hidden rounded-lg p-3 text-sm border"></div>
          </div>

          <div class="space-y-2 min-w-0">
            <label class="label" data-i18n="tools.sql-formatter.ui.label4">Output</label>
            ${createEmptyState({ icon: "🗄️", title: "No output yet", description: "Paste SQL on the left, then click Format or Validate.", id: "sql-empty-state", i18nTitle: "tools.sql-formatter.ui.desc9", i18nDesc: "tools.sql-formatter.ui.desc10" })}
            ${createRichEditorPane({ id: "sql-out", mode: "pre", ariaLabel: "Formatted SQL output", ariaI18nKey: "tools.sql-formatter.ui.r65_2", hidden: true })}
          </div>
        </div>

        ${createCheatsheet(
          "sql-formatter",
          '<span data-i18n="tools.sql-formatter.ui.heading0">SQL Formatting Tips</span>',
          [
            {
              heading:
                '<span data-i18n="tools.sql-formatter.ui.heading1">Quick wins</span>',
              content: `
              <ul class="list-disc ml-6 space-y-1">
                <li><span data-i18n="tools.sql-formatter.ui.desc1">Break long</span> <code>SELECT</code> <span data-i18n="tools.sql-formatter.ui.desc2">lists by comma for easier review.</span></li>
                <li><span data-i18n="tools.sql-formatter.ui.desc3">Put</span> <code>WHERE</code> <span data-i18n="tools.sql-formatter.ui.desc4">conditions on separate lines with</span> <code>AND</code>/<code>OR</code><span data-i18n="tools.sql-formatter.ui.desc5">.</span></li>
                <li><span data-i18n="tools.sql-formatter.ui.desc6">Use explicit</span> <code>JOIN ... ON</code> <span data-i18n="tools.sql-formatter.ui.desc7">blocks instead of comma joins.</span></li>
              </ul>
            `,
            },
            {
              heading:
                '<span data-i18n="tools.sql-formatter.ui.heading2">Validator limitations</span>',
              content: `
              <p data-i18n="tools.sql-formatter.ui.desc8">This tool detects common structural issues (quotes/parens/comments). It does not implement full grammar validation for every dialect.</p>
            `,
            },
          ],
        )}
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection(
        [
          {
            title: "Why Format SQL?",
            content:
              "<p>SQL (Structured Query Language) can quickly become complex and difficult to read, especially when dealing with multiple joins, subqueries, and nested conditions. Formatting SQL involves adding consistent indentation, line breaks, and capitalization of keywords. This makes the logic of the query much easier to follow, which is essential for debugging, code reviews, and maintaining large database schemas over time.</p><p>A well-formatted query is also less prone to logical errors during manual edits. By clearly separating clauses like <code>SELECT</code>, <code>FROM</code>, and <code>WHERE</code>, you can quickly identify missing filters or incorrect join conditions. Consistency in SQL style across a team also improves collaboration and reduces the cognitive load required to understand unfamiliar queries.</p>",
          },
          {
            title: "How to Use This Tool",
            content:
              '<ol><li>Paste your raw SQL query into the "Input SQL" editor on the left.</li><li>Select your database dialect (Postgres or MySQL) and preferred keyword case (UPPER or lower).</li><li>Click the "Format" button to beautify your query with proper indentation and spacing.</li><li>Use the "Validate" button to check for common structural issues like unclosed quotes or unbalanced parentheses.</li><li>Click "Copy" to save the formatted SQL to your clipboard or "Clear" to start over.</li></ol>',
          },
          {
            title: "Common Use Cases",
            content:
              "<ul><li><strong>Code Reviews:</strong> Format messy SQL before submitting a pull request to make it easier for your teammates to review and approve.</li><li><strong>Debugging:</strong> Clean up queries generated by ORMs (like Hibernate or Sequelize) to understand exactly what is being executed against your database.</li><li><strong>Documentation:</strong> Use the formatted output to create clear and readable examples for technical guides, wikis, or README files.</li><li><strong>Legacy Cleanup:</strong> Quickly refactor old, unformatted scripts into a modern, readable style that follows industry standards.</li></ul>",
          },
          {
            title: "Pro Tips",
            content:
              '<ul><li>Use Common Table Expressions (CTEs) with the <code>WITH</code> clause to break down complex queries into smaller, more manageable parts.</li><li>Always use descriptive aliases for tables and columns to make the intent of your query clear to others.</li><li data-i18n="tools.sql-formatter.ui.r3_0">Use the "Minify" button if you need to compress your SQL into a single line for use in configuration files or command-line tools.</li></ul>',
          },
        ],
        "sql-formatter",
        currentLang,
      )}
    ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const scripts =
    `<style>${getRichEditorStyles()}</style>` +
    getRichEditorScript() +
    getBtnLoadingScript() +
    String.raw`
	    <script>
	      const t = (k, fb) => (window._t ? window._t('tools.sql-formatter.js.' + k, fb) : (fb || k));
	      const fmtVars = (s, vars) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] !== undefined) ? String(vars[k]) : '');

      const $ = (id) => document.getElementById(id);

      const editorIn = new RichEditor('sql-in');
      editorIn.setHighlighter('sql');
      const editorOut = new RichEditor('sql-out');
      editorOut.setHighlighter('sql');

      const els = {
        format: $('format'),
        validate: $('validate'),
        minify: $('minify'),
        clear: $('clear'),
        copy: $('copy'),
        dialect: $('dialect'),
        kwcase: $('kwcase'),
        indent: $('indent'),
        issues: $('issues'),
      };

      // Inlined from src/utils/sql-formatter-logic.js (tested in sql-formatter-logic.test.js).
      ${SQL_FORMATTER_FUNCTIONS.map((fn) => fn.toString()).join("\n")}
      var KEYWORDS = buildSqlKeywords('postgres');

       function setIssues(kind, html) {
         if (!html) {
           els.issues.classList.add('hidden');
           els.issues.innerHTML = '';
           return;
         }
         els.issues.classList.remove('hidden');
         if (kind === 'error') {
           els.issues.className = 'rounded-lg p-3 text-sm border bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-200 border-error-200 dark:border-error-800';
         } else if (kind === 'warn') {
           els.issues.className = 'rounded-lg p-3 text-sm border bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-200 border-warning-200 dark:border-warning-800';
         } else {
           els.issues.className = 'rounded-lg p-3 text-sm border bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-200 border-success-200 dark:border-success-800';
         }
         els.issues.innerHTML = html;
       }

      function validateSql(sql, dialect) {
        const s = String(sql || '');
        const issues = [];
        const BT = '\u0060';

        let paren = 0;
        let inSingle = false;
        let inDouble = false;
        let inBacktick = false;
        let inBlockComment = false;

        let line = 1, col = 1;
        let openLine = 1, openCol = 1;

        function push(level, msg, at) {
          issues.push({ level, msg, line: at ? at.line : line, col: at ? at.col : col });
        }
        function markOpen() { openLine = line; openCol = col; }

        for (let i = 0; i < s.length; i++) {
          const ch = s[i];
          const next = s[i + 1];

          // Track position
          if (ch === '\n') { line++; col = 0; }
          col++;

          // Block comment handling
          if (!inSingle && !inDouble && !inBacktick) {
            if (!inBlockComment && ch === '/' && next === '*') { markOpen(); inBlockComment = true; i++; col++; continue; }
            if (!inBlockComment && ch === '$') {
              const tag = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(s.slice(i, i + 64));
              if (tag) {
                const end = s.indexOf(tag[0], i + tag[0].length);
                const stop = end < 0 ? s.length : end + tag[0].length;
                for (let k = i + 1; k < stop; k++) { if (s[k] === '\n') { line++; col = 1; } else { col++; } }
                i = stop - 1;
                continue;
              }
            }
            if (inBlockComment && ch === '*' && next === '/') { inBlockComment = false; i++; col++; continue; }
          }
          if (inBlockComment) continue;

          // Line comment skip
          if (!inSingle && !inDouble && !inBacktick) {
            if (ch === '-' && next === '-') { while (i < s.length && s[i] !== '\n') i++; continue; }
            if ((dialect === 'mysql' || dialect === 'clickhouse') && ch === '#') { while (i < s.length && s[i] !== '\n') i++; continue; }
          }

          // Quotes
          if (!inDouble && !inBacktick && ch === '\'') {
            if (inSingle && next === '\'') { i++; col++; continue; }
            if (!inSingle) markOpen();
            inSingle = !inSingle;
            continue;
          }
          if (!inSingle && !inBacktick && ch === '"') {
            if (inDouble && next === '"') { i++; col++; continue; }
            if (!inDouble) markOpen();
            inDouble = !inDouble;
            continue;
          }
          if ((dialect === 'mysql' || dialect === 'bigquery') && !inSingle && !inDouble && ch === BT) {
            if (inBacktick && next === BT) { i++; col++; continue; }
            if (!inBacktick) markOpen();
            inBacktick = !inBacktick;
            continue;
          }

          if (inSingle || inDouble || inBacktick) continue;

          if (ch === '(') paren++;
          if (ch === ')') paren--;
          if (paren < 0) {
            push('error', t('text0', 'Unmatched closing parenthesis'));
            paren = 0;
          }
        }

        const opened = { line: openLine, col: openCol };
        if (inBlockComment) push('error', t('text1', 'Unclosed block comment (/* ... */)'), opened);
        if (inSingle) push('error', t('text2', 'Unclosed single-quoted string'), opened);
        if (inDouble) push('error', t('text3', 'Unclosed double-quoted identifier/string'), opened);
        if (inBacktick) push('error', t('text4', 'Unclosed backtick-quoted identifier'), opened);
	        if (paren !== 0) push('error', fmtVars(t('text5', 'Unbalanced parentheses: {n}'), { n: paren }));

        const trimmed = s.trim();
        if (trimmed) {
          const last = trimmed.split(/\s+/).slice(-1)[0].toUpperCase();
          const incomplete = new Set(['SELECT','FROM','WHERE','AND','OR','JOIN','ON','SET','VALUES','GROUP','ORDER','HAVING','LIMIT','OFFSET','INTO','WITH']);
	          if (incomplete.has(last)) push('warn', fmtVars(t('text6', 'Query ends with a clause keyword ({kw}). It may be incomplete.'), { kw: last }));
        }

        return issues;
      }

      function renderIssues(issues) {
        if (!issues.length) {
          setIssues('success', t('text7', '✓ No issues detected by heuristic checks.'));
          return;
        }
        const hasError = issues.some(i => i.level === 'error');
        const kind = hasError ? 'error' : 'warn';
        const items = issues.slice(0, 12).map(i => {
          const where = 'L' + i.line + ':' + i.col;
          return '<li><span class="font-mono text-xs">' + where + '</span> — ' + i.msg + '</li>';
        }).join('');
	        const note = issues.length > 12 ? '<div class="mt-2 text-xs opacity-80">' + fmtVars(t('text8', 'Showing first {n} issues.'), { n: 12 }) + '</div>' : '';
        setIssues(kind, '<ul class="list-disc ml-5 space-y-1">' + items + '</ul>' + note);
      }

      function runValidate() {
        const sql = editorIn.getValue();
        if (!sql.trim()) {
          setIssues('error', t('text9', 'Paste SQL first.'));
          return;
        }
        const issues = validateSql(sql, els.dialect.value);
        renderIssues(issues);
      }

      function showOutput(text) {
        var emptyEl = document.getElementById('sql-empty-state');
        if (emptyEl) emptyEl.classList.add('hidden');
        editorOut.setValue(text);
        editorOut.show();
        var wrap = document.getElementById('re-sql-out-wrap');
        if (wrap) { wrap.classList.remove('animate-fade-in-up'); void wrap.offsetWidth; wrap.classList.add('animate-fade-in-up'); }
        els.copy.disabled = !text.trim();
      }

      function runFormat() {
        const sql = editorIn.getValue();
        if (!sql.trim()) {
          setIssues('error', t('text9', 'Paste SQL first.'));
          return;
        }
        const issues = validateSql(sql, els.dialect.value);
        renderIssues(issues);
        lastAction = runFormat;
        const formatted = formatSql(sql, {
          dialect: els.dialect.value,
          kwcase: els.kwcase.value,
          indentSize: Number(els.indent.value) || 2
        }, KEYWORDS);
        showOutput(formatted);
      }

      function runMinify() {
        const sql = editorIn.getValue();
        if (!sql.trim()) {
          setIssues('error', t('text9', 'Paste SQL first.'));
          return;
        }
        const issues = validateSql(sql, els.dialect.value);
        renderIssues(issues);
        lastAction = runMinify;
        const out = minifySql(sql, els.dialect.value, KEYWORDS);
        showOutput(out);
      }

      // Changing an option re-runs the last Format/Minify so the output never shows stale settings.
      let lastAction = null;
      function rerun() { if (lastAction && editorIn.getValue().trim()) lastAction(); }
      els.dialect.addEventListener('change', function() { KEYWORDS = buildSqlKeywords(this.value); rerun(); });
      els.kwcase.addEventListener('change', rerun);
      els.indent.addEventListener('change', rerun);
      els.format.addEventListener('click', function() { window.btnLoading(this, runFormat); });
      els.validate.addEventListener('click', function() { window.btnLoading(this, runValidate); });
      els.minify.addEventListener('click', function() { window.btnLoading(this, runMinify); });

      els.clear.addEventListener('click', () => {
        editorIn.clear();
        editorOut.clear(true);
        els.copy.disabled = true;
        lastAction = null;
        setIssues(null, '');
        var emptyEl = document.getElementById('sql-empty-state');
        if (emptyEl) emptyEl.classList.remove('hidden');
      });

      els.copy.addEventListener('click', function() {
        const text = editorOut.getValue();
        if (!text.trim()) return;
        copyToClipboard(text, els.copy);
      });
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: "/sql-formatter",
    content,
    scripts,
    lang: currentLang,
  });
}
