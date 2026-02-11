/**
 * Rich Editor — reusable syntax-highlighted editor pane
 *
 * Provides line numbers, scroll sync, and pluggable highlighters
 * for JSON, SQL, XML, CSS, Mermaid, and plain text.
 *
 * Usage (server-side, inside route template literals):
 *   import { createRichEditorPane, getRichEditorStyles, getRichEditorScript } from '../utils/rich-editor.js';
 *
 *   // In HTML content:
 *   ${createRichEditorPane({ id: 'input', mode: 'textarea' })}
 *   ${createRichEditorPane({ id: 'output', mode: 'pre' })}
 *
 *   // In <style> block:
 *   ${getRichEditorStyles()}
 *
 *   // In <script> block (creates window.RichEditor class):
 *   ${getRichEditorScript()}
 */

// ---------------------------------------------------------------------------
// Server-side: HTML pane generator
// ---------------------------------------------------------------------------

/**
 * Create the HTML for an editor pane (textarea or readonly pre).
 *
 * @param {Object} opts
 * @param {string} opts.id          - Unique pane id (e.g. 'input', 'output')
 * @param {'textarea'|'pre'} opts.mode - 'textarea' for editable, 'pre' for readonly output
 * @param {string} [opts.placeholder] - Placeholder text (textarea only)
 * @param {number} [opts.rows=20]   - Rows for textarea
 * @param {string} [opts.ariaLabel] - Accessible label for the pane
 * @param {boolean} [opts.hidden=false] - Start hidden (for output panes)
 * @param {string} [opts.wrapClass=''] - Extra classes on the outer wrap
 * @returns {string} HTML string
 */
export function createRichEditorPane(opts = {}) {
  const {
    id,
    mode = 'textarea',
    placeholder = '',
    rows = 20,
    ariaLabel = '',
    hidden = false,
    wrapClass = ''
  } = opts;

  const wrapId = `re-${id}-wrap`;
  const lineId = `re-${id}-lines`;
  const hiddenClass = hidden ? ' hidden' : '';
  const extraWrap = wrapClass ? ` ${wrapClass}` : '';

  if (mode === 'textarea') {
    const phAttr = placeholder ? ` placeholder="${placeholder}"` : '';
    return `<div id="${wrapId}" class="re-wrap${extraWrap}${hiddenClass}">` +
      `<div id="${lineId}" class="re-line-numbers" aria-hidden="true">1</div>` +
      `<textarea id="re-${id}" rows="${rows}" spellcheck="false"${phAttr} class="input-mono resize-none re-textarea"></textarea>` +
      `</div>`;
  }

  // mode === 'pre'
  const ariaAttr = ariaLabel ? ` aria-label="${ariaLabel}"` : '';
  return `<div id="${wrapId}" class="re-wrap${extraWrap}${hiddenClass}">` +
    `<div id="${lineId}" class="re-line-numbers" aria-hidden="true">1</div>` +
    `<pre id="re-${id}" class="re-highlighted" tabindex="0" role="region"${ariaAttr}></pre>` +
    `</div>`;
}


// ---------------------------------------------------------------------------
// Server-side: CSS for the editor (emitted once per page inside <style>)
// ---------------------------------------------------------------------------

/**
 * Return CSS rules for the rich editor shell.
 * Token colours live in input.css via Tailwind (.re-key, .re-string, …).
 * This function only provides structural / layout styles.
 *
 * @returns {string} CSS text (no <style> tags — caller wraps)
 */
export function getRichEditorStyles() {
  return `
.re-wrap {
  border: 1px solid var(--color-surface-200);
  border-radius: 0.75rem;
  overflow: hidden;
  background: var(--color-surface-50, #f8fafc);
  position: relative;
}
.dark .re-wrap {
  border-color: var(--color-surface-700);
  background: var(--color-surface-950, #0a0a0a);
}
.re-line-numbers {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 3rem;
  padding: 0.75rem 0.5rem 0.75rem 0;
  text-align: right;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.8125rem;
  line-height: 1.5rem;
  color: var(--color-surface-400, #9ca3af);
  background: var(--color-surface-100, #f1f5f9);
  border-right: 1px solid var(--color-surface-200, #e2e8f0);
  user-select: none;
  overflow: hidden;
  white-space: pre-line;
}
.dark .re-line-numbers {
  background: var(--color-surface-900, #111);
  border-right-color: var(--color-surface-700);
  color: var(--color-surface-500);
}
.re-textarea {
  padding-left: 3.75rem !important;
  border: none !important;
  border-radius: 0 !important;
  background: transparent !important;
  line-height: 1.5rem;
  font-size: 0.8125rem;
  min-height: 30rem;
}
.re-highlighted {
  padding: 0.75rem 1rem 0.75rem 3.75rem;
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.8125rem;
  line-height: 1.5rem;
  min-height: 30rem;
  overflow: auto;
  white-space: pre;
  color: var(--color-surface-900, #111);
  background: transparent;
}
.dark .re-highlighted {
  color: var(--color-surface-100, #eee);
}

/* Collapsible sections (JSON tree) */
.re-toggle { cursor: pointer; user-select: none; position: relative; }
.re-toggle::before {
  content: '\\25BC';
  font-size: 0.6em;
  position: absolute;
  left: -1em;
  top: 0.15em;
  transition: transform 0.15s ease;
  color: var(--color-surface-400);
}
.re-toggle.collapsed::before { transform: rotate(-90deg); }
.re-collapsible.collapsed { display: none; }
.re-ellipsis { display: none; color: var(--color-surface-400); font-style: italic; }
.re-toggle.collapsed + .re-ellipsis { display: inline; }
`;
}


// ---------------------------------------------------------------------------
// Server-side: client script (creates window.RichEditor)
// ---------------------------------------------------------------------------

/**
 * Return a <script> block that defines the RichEditor class on the client.
 *
 * ⚠️  This runs inside a template literal in a route file — every regex
 *     backslash is already double-escaped here so the RUNTIME sees the
 *     correct single backslash.
 *
 * @returns {string} <script>…</script> block
 */
export function getRichEditorScript() {
  // ⚠️ Template literal escaping rules:
  //   \\n  → \n   (newline in runtime source)
  //   \\d  → \d   (regex digit in runtime source)
  //   \\\\ → \\   (literal backslash in runtime source)
  return `
    <script>
    (function() {
      function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      function updateLineNumbers(text, lineNumEl) {
        var lines = text.split('\\n');
        var nums = [];
        for (var i = 1; i <= lines.length; i++) nums.push(i);
        lineNumEl.textContent = nums.join('\\n');
      }

      var HIGHLIGHTERS = {
        json: function(src) {
          return src.replace(
            /("(?:[^"\\\\]|\\\\.)*")\\s*(:)|("(?:[^"\\\\]|\\\\.)*")|\\b(true|false)\\b|\\b(null)\\b|(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)|([{}\\[\\]])/g,
            function(m, key, colon, str, bool, nul, num, bracket) {
              if (key) return '<span class="re-key">' + escapeHtml(key) + '</span>' + colon;
              if (str) return '<span class="re-string">' + escapeHtml(str) + '</span>';
              if (bool) return '<span class="re-boolean">' + m + '</span>';
              if (nul) return '<span class="re-null">' + m + '</span>';
              if (num) return '<span class="re-number">' + m + '</span>';
              if (bracket) return '<span class="re-bracket">' + m + '</span>';
              return escapeHtml(m);
            }
          );
        },

        sql: function(src) {
          var KW = 'SELECT|FROM|WHERE|INSERT|INTO|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|' +
                   'JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|IN|IS|NULL|AS|ORDER|BY|GROUP|' +
                   'HAVING|LIMIT|OFFSET|UNION|ALL|DISTINCT|CASE|WHEN|THEN|ELSE|END|EXISTS|' +
                   'BETWEEN|LIKE|INDEX|VALUES|PRIMARY|KEY|FOREIGN|REFERENCES|DEFAULT|' +
                   'COUNT|SUM|AVG|MIN|MAX|COALESCE|CAST|CONVERT|IF|BEGIN|COMMIT|ROLLBACK';
          var kwRe = new RegExp('\\\\b(' + KW + ')\\\\b', 'gi');
          var escaped = escapeHtml(src);
          escaped = escaped.replace(/'([^']*)'/g, function(m) {
            return '<span class="re-string">' + m + '</span>';
          });
          escaped = escaped.replace(/\\b(\\d+(?:\\.\\d+)?)\\b/g, '<span class="re-number">$1</span>');
          escaped = escaped.replace(kwRe, '<span class="re-keyword">$1</span>');
          escaped = escaped.replace(/(--[^\\n]*)/g, '<span class="re-comment">$1</span>');
          return escaped;
        },

        xml: function(src) {
          var escaped = escapeHtml(src);
          escaped = escaped.replace(/(&lt;\\/?)([\\w:.-]+)/g, '$1<span class="re-keyword">$2</span>');
          escaped = escaped.replace(/\\s([\\w:.-]+)=/g, ' <span class="re-key">$1</span>=');
          escaped = escaped.replace(/=(&quot;[^&]*&quot;)/g, '=<span class="re-string">$1</span>');
          escaped = escaped.replace(/(&lt;!--[\\s\\S]*?--&gt;)/g, '<span class="re-comment">$1</span>');
          return escaped;
        },

        css: function(src) {
          var escaped = escapeHtml(src);
          escaped = escaped.replace(/^([^{}@\\/][^{]*)(\\{)/gm, '<span class="re-keyword">$1</span>$2');
          escaped = escaped.replace(/(\\s+)([\\w-]+)(\\s*:)/g, '$1<span class="re-key">$2</span>$3');
          escaped = escaped.replace(/(&quot;[^&]*&quot;)/g, '<span class="re-string">$1</span>');
          escaped = escaped.replace(/\\b(\\d+(?:\\.\\d+)?)(px|em|rem|%|vh|vw|s|ms|deg|fr)?\\b/g, '<span class="re-number">$1$2</span>');
          escaped = escaped.replace(/(\\/\\*[\\s\\S]*?\\*\\/)/g, '<span class="re-comment">$1</span>');
          return escaped;
        },

        mermaid: function(src) {
          var escaped = escapeHtml(src);
          var types = 'graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|' +
                      'gantt|pie|gitGraph|journey|mindmap|timeline|sankey|block';
          var typeRe = new RegExp('^(' + types + ')\\\\b', 'gm');
          escaped = escaped.replace(typeRe, '<span class="re-keyword">$1</span>');
          escaped = escaped.replace(/\\b(LR|RL|TB|BT|TD)\\b/g, '<span class="re-keyword">$1</span>');
          escaped = escaped.replace(/(-->|==>|-.->|--x|--o|&lt;-->|---|===)/g, '<span class="re-bracket">$1</span>');
          escaped = escaped.replace(/(\\[[^\\]]*\\]|\\([^)]*\\)|\\{[^}]*\\})/g, '<span class="re-string">$1</span>');
          escaped = escaped.replace(/(%%[^\\n]*)/g, '<span class="re-comment">$1</span>');
          return escaped;
        },

        jwt: function(src) {
          var s = escapeHtml(src).trim();
          var parts = s.split('.');
          if (parts.length === 3) {
            return '<span class="re-jwt-header">' + parts[0] + '</span>' +
                   '<span class="re-jwt-dot">.</span>' +
                   '<span class="re-jwt-payload">' + parts[1] + '</span>' +
                   '<span class="re-jwt-dot">.</span>' +
                   '<span class="re-jwt-signature">' + parts[2] + '</span>';
          }
          return s;
        },

        plain: function(src) {
          return escapeHtml(src);
        }
      };

      function RichEditor(paneId) {
        this.id = paneId;
        this.wrap = document.getElementById('re-' + paneId + '-wrap');
        this.el = document.getElementById('re-' + paneId);
        this.lineEl = document.getElementById('re-' + paneId + '-lines');
        this.highlighter = null;
        this._scrollBound = false;
        this.isTextarea = this.el && this.el.tagName === 'TEXTAREA';

        if (this.isTextarea && this.el && this.lineEl) {
          var self = this;
          this.el.addEventListener('input', function() {
            updateLineNumbers(self.el.value, self.lineEl);
          });
          this.el.addEventListener('scroll', function() {
            self.lineEl.style.transform = 'translateY(-' + self.el.scrollTop + 'px)';
          });
          updateLineNumbers('', this.lineEl);
        }
      }

      RichEditor.prototype.setHighlighter = function(h) {
        if (typeof h === 'function') {
          this.highlighter = h;
        } else {
          this.highlighter = HIGHLIGHTERS[h] || HIGHLIGHTERS.plain;
        }
      };

      RichEditor.prototype.getValue = function() {
        return this.isTextarea ? this.el.value : (this.el.textContent || '');
      };

      RichEditor.prototype.setValue = function(text) {
        if (this.isTextarea) {
          this.el.value = text;
          if (this.lineEl) updateLineNumbers(text, this.lineEl);
          return;
        }
        var fn = this.highlighter || HIGHLIGHTERS.plain;
        this.el.innerHTML = fn(text);
        if (this.lineEl) updateLineNumbers(text, this.lineEl);
        if (this.wrap) this.wrap.classList.remove('hidden');
        if (!this._scrollBound && this.lineEl) {
          var lineEl = this.lineEl;
          var el = this.el;
          this.el.addEventListener('scroll', function() {
            lineEl.style.transform = 'translateY(-' + el.scrollTop + 'px)';
          });
          this._scrollBound = true;
        }
      };

      RichEditor.prototype.clear = function(hide) {
        if (this.isTextarea) {
          this.el.value = '';
        } else {
          this.el.innerHTML = '';
        }
        if (this.lineEl) updateLineNumbers('', this.lineEl);
        if (hide && this.wrap) this.wrap.classList.add('hidden');
      };

      RichEditor.prototype.show = function() { if (this.wrap) this.wrap.classList.remove('hidden'); };
      RichEditor.prototype.hide = function() { if (this.wrap) this.wrap.classList.add('hidden'); };

      window.RichEditor = RichEditor;
    })();
    </script>`;
}
