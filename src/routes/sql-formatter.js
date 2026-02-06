/**
 * SQL Formatter & Validator
 * - Formats SQL with readable indentation
 * - Detects common syntax issues (quotes/parens/comments)
 * - Dialects: Postgres / MySQL (heuristic)
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint } from '../utils/common-ui.js';

export async function handleSQLFormatterRoutes(request, url) {
  const { pathname } = url;
  if (pathname === '/sql-formatter' || pathname === '/sql-formatter/') {
    if (request.method === 'GET') return respondHTML(renderSQLFormatterPage());
    return new Response('Method not allowed', { status: 405 });
  }
  return null;
}

function renderSQLFormatterPage() {
  const title = 'SQL Formatter & Validator';
  const description = 'Format SQL and catch common syntax issues. Supports Postgres/MySQL-friendly formatting (offline).';

  const header = createToolHeader(
    { emoji: '🗄️' },
    title,
    description,
    [
      { text: '<span data-i18n="tools.sql-formatter.ui.badge0">Formatter</span>', tooltip: 'Indent clauses, break lists, and normalize whitespace.' },
      { text: '<span data-i18n="tools.sql-formatter.ui.badge1">Validator</span>', tooltip: 'Detect unclosed quotes/comments and unbalanced parentheses.' }
    ],
    { toolId: 'sql-formatter' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${header}

        <div class="flex flex-wrap gap-3 mb-6 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
          <button id="format" class="btn btn-primary">🎨 <span data-i18n="tools.sql-formatter.ui.button0">Format</span></button>
          <button id="validate" class="btn btn-secondary">✓ <span data-i18n="tools.sql-formatter.ui.button1">Validate</span></button>
          <button id="minify" class="btn btn-secondary">📦 <span data-i18n="tools.sql-formatter.ui.button2">Minify</span></button>
          <button id="clear" class="btn btn-ghost ml-auto">🗑️ <span data-i18n="tools.sql-formatter.ui.button3">Clear</span></button>
          <button id="copy" class="btn btn-secondary" disabled>📋 <span data-i18n="tools.sql-formatter.ui.button4">Copy</span></button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="label flex items-center gap-2">
              <span data-i18n="tools.sql-formatter.ui.label0">Input SQL</span>
              ${infoHint('This tool does not execute SQL. Validation is heuristic (not a full parser).', 'Help', { i18nKey: 'tools.sql-formatter.ui.desc0' })}
            </label>
            <textarea id="sql-in" rows="18" class="input-mono resize-y" placeholder="SELECT id, email FROM users WHERE created_at &gt; NOW() - INTERVAL '7 days' ORDER BY created_at DESC;" data-i18n-placeholder="tools.sql-formatter.ui.placeholder0"></textarea>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.sql-formatter.ui.label1">Dialect</label>
                <select id="dialect" class="input">
                  <option value="postgres" data-i18n="tools.sql-formatter.ui.option0">Postgres</option>
                  <option value="mysql" data-i18n="tools.sql-formatter.ui.option1">MySQL</option>
                </select>
              </div>
              <div>
                <label class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.sql-formatter.ui.label2">Keyword case</label>
                <select id="kwcase" class="input">
                  <option value="upper" data-i18n="tools.sql-formatter.ui.option2">UPPER</option>
                  <option value="lower" data-i18n="tools.sql-formatter.ui.option3">lower</option>
                  <option value="keep" data-i18n="tools.sql-formatter.ui.option4">keep</option>
                </select>
              </div>
              <div>
                <label class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.sql-formatter.ui.label3">Indent</label>
                <select id="indent" class="input">
                  <option value="2" data-i18n="tools.sql-formatter.ui.option5">2 spaces</option>
                  <option value="4" data-i18n="tools.sql-formatter.ui.option6">4 spaces</option>
                </select>
              </div>
            </div>

            <div id="issues" class="hidden rounded-lg p-3 text-sm border"></div>
          </div>

          <div class="space-y-2">
            <label class="label" data-i18n="tools.sql-formatter.ui.label4">Output</label>
            <textarea id="sql-out" rows="18" class="input-mono resize-y bg-surface-50 dark:bg-surface-950" readonly></textarea>
          </div>
        </div>

        ${createCheatsheet('sql-formatter', '<span data-i18n="tools.sql-formatter.ui.heading0">SQL Formatting Tips</span>', [
          {
            heading: '<span data-i18n="tools.sql-formatter.ui.heading1">Quick wins</span>',
            content: `
              <ul class="list-disc ml-6 space-y-1">
                <li><span data-i18n="tools.sql-formatter.ui.desc1">Break long</span> <code>SELECT</code> <span data-i18n="tools.sql-formatter.ui.desc2">lists by comma for easier review.</span></li>
                <li><span data-i18n="tools.sql-formatter.ui.desc3">Put</span> <code>WHERE</code> <span data-i18n="tools.sql-formatter.ui.desc4">conditions on separate lines with</span> <code>AND</code>/<code>OR</code><span data-i18n="tools.sql-formatter.ui.desc5">.</span></li>
                <li><span data-i18n="tools.sql-formatter.ui.desc6">Use explicit</span> <code>JOIN ... ON</code> <span data-i18n="tools.sql-formatter.ui.desc7">blocks instead of comma joins.</span></li>
              </ul>
            `
          },
          {
            heading: '<span data-i18n="tools.sql-formatter.ui.heading2">Validator limitations</span>',
            content: `
              <p data-i18n="tools.sql-formatter.ui.desc8">This tool detects common structural issues (quotes/parens/comments). It does not implement full grammar validation for every dialect.</p>
            `
          }
        ])}
      </div>
    </main>
  `;

	      const scripts = String.raw`
	    <script>
	      const t = (k, fb) => (window._t ? window._t('tools.sql-formatter.js.' + k, fb) : (fb || k));
	      const fmtVars = (s, vars) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] !== undefined) ? String(vars[k]) : '');

      const $ = (id) => document.getElementById(id);
      const els = {
        input: $('sql-in'),
        output: $('sql-out'),
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

      const KEYWORDS = new Set([
        'SELECT','FROM','WHERE','GROUP','BY','ORDER','HAVING','LIMIT','OFFSET',
        'INSERT','INTO','VALUES','UPDATE','SET','DELETE','RETURNING',
        'JOIN','LEFT','RIGHT','FULL','INNER','OUTER','CROSS','ON',
        'UNION','ALL','DISTINCT','AS','AND','OR','NOT','NULL','IS','IN','EXISTS',
        'CASE','WHEN','THEN','ELSE','END',
        'CREATE','ALTER','DROP','TABLE','VIEW','INDEX',
        'WITH'
      ]);

      function setIssues(kind, html) {
        if (!html) {
          els.issues.classList.add('hidden');
          els.issues.innerHTML = '';
          return;
        }
        els.issues.classList.remove('hidden');
        if (kind === 'error') {
          els.issues.className = 'rounded-lg p-3 text-sm border bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 border-red-200 dark:border-red-800';
        } else if (kind === 'warn') {
          els.issues.className = 'rounded-lg p-3 text-sm border bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
        } else {
          els.issues.className = 'rounded-lg p-3 text-sm border bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-200 border-green-200 dark:border-green-800';
        }
        els.issues.innerHTML = html;
      }

      function tokenize(sql, dialect) {
        const s = String(sql || '');
        const tokens = [];
        let i = 0;
        let line = 1, col = 1;
        const push = (type, value, at) => tokens.push({ type, value, at });
        const BT = '\u0060';

        function adv(n = 1) {
          for (let k = 0; k < n; k++) {
            const ch = s[i++];
            if (ch === '\n') { line++; col = 1; } else { col++; }
          }
        }

        while (i < s.length) {
          const at = { i, line, col };
          const ch = s[i];

          // Whitespace
          if (/\s/.test(ch)) {
            adv(1);
            continue;
          }

          // Line comment
          if (ch === '-' && s[i + 1] === '-') {
            let j = i + 2;
            while (j < s.length && s[j] !== '\n') j++;
            push('comment', s.slice(i, j), at);
            adv(j - i);
            continue;
          }
          if (dialect === 'mysql' && ch === '#') {
            let j = i + 1;
            while (j < s.length && s[j] !== '\n') j++;
            push('comment', s.slice(i, j), at);
            adv(j - i);
            continue;
          }
          // Block comment
          if (ch === '/' && s[i + 1] === '*') {
            let j = i + 2;
            while (j < s.length && !(s[j] === '*' && s[j + 1] === '/')) j++;
            j = Math.min(s.length, j + 2);
            push('comment', s.slice(i, j), at);
            adv(j - i);
            continue;
          }

          // Strings / quoted identifiers
          if (ch === '\'') {
            let j = i + 1;
            while (j < s.length) {
              if (s[j] === '\'' && s[j + 1] === '\'') { j += 2; continue; } // escaped ''
              if (s[j] === '\'') { j++; break; }
              j++;
            }
            push('string', s.slice(i, j), at);
            adv(j - i);
            continue;
          }
          if (ch === '"') {
            let j = i + 1;
            while (j < s.length) {
              if (s[j] === '"' && s[j + 1] === '"') { j += 2; continue; }
              if (s[j] === '"') { j++; break; }
              j++;
            }
            push('ident', s.slice(i, j), at);
            adv(j - i);
            continue;
          }
          if (dialect === 'mysql' && ch === BT) {
            let j = i + 1;
            while (j < s.length) {
              if (s[j] === BT && s[j + 1] === BT) { j += 2; continue; }
              if (s[j] === BT) { j++; break; }
              j++;
            }
            push('ident', s.slice(i, j), at);
            adv(j - i);
            continue;
          }

          // Numbers
          if (/\d/.test(ch)) {
            let j = i + 1;
            while (j < s.length && /[\d.]/.test(s[j])) j++;
            push('number', s.slice(i, j), at);
            adv(j - i);
            continue;
          }

          // Words
          if (/[A-Za-z_]/.test(ch)) {
            let j = i + 1;
            while (j < s.length && /[A-Za-z0-9_$]/.test(s[j])) j++;
            push('word', s.slice(i, j), at);
            adv(j - i);
            continue;
          }

          // Operators / punctuation (prefer longer matches)
          const two = s.slice(i, i + 2);
          const three = s.slice(i, i + 3);
          if (three === '->>') {
            push('op', '->>', at);
            adv(3);
            continue;
          }
          if (['!=','<=','>=','<>','::','->','||'].includes(two)) {
            push('op', two, at);
            adv(2);
            continue;
          }

          push('punct', ch, at);
          adv(1);
        }

        return tokens;
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

        function push(level, msg) {
          issues.push({ level, msg, line, col });
        }

        for (let i = 0; i < s.length; i++) {
          const ch = s[i];
          const next = s[i + 1];

          // Track position
          if (ch === '\n') { line++; col = 0; }
          col++;

          // Block comment handling
          if (!inSingle && !inDouble && !inBacktick) {
            if (!inBlockComment && ch === '/' && next === '*') { inBlockComment = true; i++; col++; continue; }
            if (inBlockComment && ch === '*' && next === '/') { inBlockComment = false; i++; col++; continue; }
          }
          if (inBlockComment) continue;

          // Line comment skip
          if (!inSingle && !inDouble && !inBacktick) {
            if (ch === '-' && next === '-') { while (i < s.length && s[i] !== '\n') i++; continue; }
            if (dialect === 'mysql' && ch === '#') { while (i < s.length && s[i] !== '\n') i++; continue; }
          }

          // Quotes
          if (!inDouble && !inBacktick && ch === '\'') {
            if (inSingle && next === '\'') { i++; col++; continue; }
            inSingle = !inSingle;
            continue;
          }
          if (!inSingle && !inBacktick && ch === '"') {
            if (inDouble && next === '"') { i++; col++; continue; }
            inDouble = !inDouble;
            continue;
          }
          if (dialect === 'mysql' && !inSingle && !inDouble && ch === BT) {
            if (inBacktick && next === BT) { i++; col++; continue; }
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

        if (inBlockComment) push('error', t('text1', 'Unclosed block comment (/* ... */)'));
        if (inSingle) push('error', t('text2', 'Unclosed single-quoted string'));
        if (inDouble) push('error', t('text3', 'Unclosed double-quoted identifier/string'));
        if (inBacktick) push('error', t('text4', 'Unclosed backtick-quoted identifier'));
	        if (paren !== 0) push('error', fmtVars(t('text5', 'Unbalanced parentheses: {n}'), { n: paren }));

        const trimmed = s.trim();
        if (trimmed) {
          const last = trimmed.split(/\s+/).slice(-1)[0].toUpperCase();
          const incomplete = new Set(['SELECT','FROM','WHERE','AND','OR','JOIN','ON','SET','VALUES','GROUP','ORDER','HAVING','LIMIT','OFFSET','INTO','WITH']);
	          if (incomplete.has(last)) push('warn', fmtVars(t('text6', 'Query ends with a clause keyword ({kw}). It may be incomplete.'), { kw: last }));
        }

        return issues;
      }

      function kwTransform(word, mode) {
        if (mode === 'keep') return word;
        return mode === 'lower' ? word.toLowerCase() : word.toUpperCase();
      }

      function fmt(sql, opts) {
        const tokens = tokenize(sql, opts.dialect);

        const indentSize = opts.indentSize;
        let parenDepth = 0;
        let clause = '';
        let clauseIndent = 0;
        const lines = [];
        let lineStr = '';
        let prev = null;

        function baseIndentLevel() {
          return Math.max(0, parenDepth);
        }

        function contentIndentLevel() {
          return Math.max(0, parenDepth + clauseIndent);
        }

        function setIndent(level) {
          lineStr = ' '.repeat(Math.max(0, level * indentSize));
          prev = null;
        }

        function hasLineContent() {
          return lineStr.trim().length > 0;
        }

        function pushLine(nextIndentLevel, allowBlank = false) {
          const outLine = lineStr.trimEnd();
          if (outLine.trim() || allowBlank) lines.push(outLine);
          lineStr = ' '.repeat(Math.max(0, nextIndentLevel * indentSize));
          prev = null;
        }

        function append(val) {
          if (!val) return;
          lineStr += val;
        }

        function isTightOp(v) {
          return v === '.' || v === '::' || v === '->' || v === '->>';
        }

        function needsSpace(prevTok, curTok) {
          if (!prevTok) return false;
          const pv = prevTok.value;
          const cv = curTok.value;
          if (cv === ',' || cv === ')' || cv === ';') return false;
          if (pv === '(') return false;
          if (isTightOp(cv) || isTightOp(pv)) return false;
          if (cv === '.') return false;
          return true;
        }

        function peekWord(i) {
          const t = tokens[i];
          return t && t.type === 'word' ? t.value.toUpperCase() : '';
        }

        function clauseStartAt(i) {
          const w = peekWord(i);
          const w2 = peekWord(i + 1);

          if (w === 'GROUP' && w2 === 'BY') return { text: 'GROUP BY', consume: 2, clause: 'group' };
          if (w === 'ORDER' && w2 === 'BY') return { text: 'ORDER BY', consume: 2, clause: 'order' };
          if (w === 'UNION' && w2 === 'ALL') return { text: 'UNION ALL', consume: 2, clause: 'union' };
          if ((w === 'LEFT' || w === 'RIGHT' || w === 'FULL' || w === 'INNER' || w === 'CROSS') && w2 === 'JOIN') {
            return { text: w + ' JOIN', consume: 2, clause: 'join' };
          }
          if (w === 'JOIN') return { text: 'JOIN', consume: 1, clause: 'join' };
          if (w === 'ON') return { text: 'ON', consume: 1, clause: 'on' };

          const singles = new Set(['SELECT','FROM','WHERE','HAVING','LIMIT','OFFSET','INSERT','UPDATE','DELETE','VALUES','SET','RETURNING','WITH']);
          if (singles.has(w)) {
            const map = {
              SELECT: 'select',
              FROM: 'from',
              WHERE: 'where',
              HAVING: 'having',
              LIMIT: 'limit',
              OFFSET: 'offset',
              INSERT: 'insert',
              UPDATE: 'update',
              DELETE: 'delete',
              VALUES: 'values',
              SET: 'set',
              RETURNING: 'returning',
              WITH: 'with'
            };
            return { text: w, consume: 1, clause: map[w] || 'clause' };
          }

          return null;
        }

        function setClause(name) {
          clause = name || '';
          clauseIndent = 1;
          if (clause === 'on') clauseIndent = 2;
          if (clause === 'limit' || clause === 'offset') clauseIndent = 1;
        }

        setIndent(0);

        for (let i = 0; i < tokens.length; i++) {
          const tok = tokens[i];

          if (tok.type === 'comment') {
            if (hasLineContent()) pushLine(contentIndentLevel(), false);
            setIndent(baseIndentLevel());
            append(tok.value.trim());
            pushLine(contentIndentLevel(), false);
            continue;
          }

          if (parenDepth === 0 && tok.type === 'word') {
            const cs = clauseStartAt(i);
            if (cs) {
              if (hasLineContent()) pushLine(baseIndentLevel(), false);
              setIndent(baseIndentLevel());
              const parts = cs.text.split(' ');
              const rendered = parts.map(p => kwTransform(p, opts.kwcase)).join(' ');
              append(rendered);
              setClause(cs.clause);
              pushLine(contentIndentLevel(), false);
              i += cs.consume - 1;
              prev = { type: 'word', value: cs.text };
              continue;
            }
          }

          let val = tok.value;

          if (tok.type === 'word') {
            const upper = val.toUpperCase();
            if (KEYWORDS.has(upper)) val = kwTransform(upper, opts.kwcase);
          }

          // Parentheses depth (close affects indentation of subsequent tokens)
          if (val === ')') parenDepth = Math.max(0, parenDepth - 1);

          // Line breaks
          const upper = (tok.type === 'word') ? tok.value.toUpperCase() : '';
          const isAndOr = (upper === 'AND' || upper === 'OR');
          const isComma = val === ',';

          if (isComma && parenDepth === 0 && ['select','from','set','values','returning'].includes(clause)) {
            append(',');
            pushLine(contentIndentLevel(), false);
            prev = { type: 'punct', value: ',' };
            continue;
          }

          if (isAndOr && parenDepth === 0 && ['where','having','on'].includes(clause)) {
            pushLine(contentIndentLevel(), false);
            append(val);
            append(' ');
            prev = { type: 'word', value: val };
            continue;
          }

          // Spacing rules
          if (needsSpace(prev, tok)) append(' ');
          append(val);

          if (val === '(') parenDepth++;

          // Semicolon ends statement
          if (val === ';') {
            pushLine(0, false);
            clause = '';
            clauseIndent = 0;
            setIndent(0);
          }

          prev = tok;
        }

        if (lineStr.trim()) lines.push(lineStr.trimEnd());
        const formatted = lines.join('\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim() + '\n';

        return formatted;
      }

      function minifySql(sql, dialect) {
        const tokens = tokenize(sql, dialect);
        const out = [];
        let prev = null;
        function needsSpace(prevTok, curTok) {
          if (!prevTok) return false;
          const pv = prevTok.value;
          const cv = curTok.value;
          if (cv === ',' || cv === ')' || cv === ';') return false;
          if (pv === '(') return false;
          if (cv === '.' || pv === '.') return false;
          if (cv === '::' || pv === '::' || cv === '->' || pv === '->' || cv === '->>' || pv === '->>') return false;
          return true;
        }
        for (const tok of tokens) {
          if (tok.type === 'comment') continue;
          if (needsSpace(prev, tok)) out.push(' ');
          out.push(tok.value);
          prev = tok;
        }
        return out.join('').trim();
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
        const sql = els.input.value;
        if (!sql.trim()) {
          setIssues('error', t('text9', 'Paste SQL first.'));
          return;
        }
        const issues = validateSql(sql, els.dialect.value);
        renderIssues(issues);
      }

      function runFormat() {
        const sql = els.input.value;
        if (!sql.trim()) {
          setIssues('error', t('text9', 'Paste SQL first.'));
          return;
        }
        const issues = validateSql(sql, els.dialect.value);
        renderIssues(issues);
        const formatted = fmt(sql, {
          dialect: els.dialect.value,
          kwcase: els.kwcase.value,
          indentSize: Number(els.indent.value) || 2
        });
        els.output.value = formatted;
        els.copy.disabled = !formatted.trim();
      }

      function runMinify() {
        const sql = els.input.value;
        if (!sql.trim()) {
          setIssues('error', t('text9', 'Paste SQL first.'));
          return;
        }
        const issues = validateSql(sql, els.dialect.value);
        renderIssues(issues);
        const out = minifySql(sql, els.dialect.value);
        els.output.value = out;
        els.copy.disabled = !out.trim();
      }

      els.format.addEventListener('click', runFormat);
      els.validate.addEventListener('click', runValidate);
      els.minify.addEventListener('click', runMinify);

      els.clear.addEventListener('click', () => {
        els.input.value = '';
        els.output.value = '';
        els.copy.disabled = true;
        setIssues(null, '');
      });

      els.copy.addEventListener('click', async () => {
        const text = els.output.value;
        if (!text.trim()) return;
        try {
          await navigator.clipboard.writeText(text);
          const old = els.copy.textContent;
          els.copy.textContent = t('text10', '✓ Copied');
          setTimeout(() => (els.copy.textContent = old), 1200);
        } catch (e) {
          console.error('Copy failed:', e);
        }
      });
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: '/sql-formatter',
    content,
    scripts
  });
}
