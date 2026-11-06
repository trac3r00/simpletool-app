/**
 * Code minifier / beautifier logic (JS, CSS, HTML).
 *
 * Every function here is inlined into /code-minifier's page via
 * Function.prototype.toString, so each one must be self-contained: no
 * module-level constants, and only calls to other functions exported here.
 * Literal "<" before "!", "/" or "script" is written as \x3c so the inlined
 * source cannot end or confuse the page's own <script> element.
 *
 * Tested in code-minifier-logic.test.js against esbuild as an independent
 * oracle (whitespace-only minification of the original and of our output must
 * agree, which means the token stream and its semantics did not change).
 */

export function cmTokenizeJS(code) {
  var tokens = [];
  var i = 0;
  var n = code.length;
  var nl = false;
  var PUNCT = ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=',
    '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=',
    '%=', '&=', '|=', '^=', '<<', '>>', '**'];
  var BEFORE_EXPR = { 'return': 1, 'typeof': 1, 'instanceof': 1, 'in': 1, 'of': 1, 'new': 1,
    'delete': 1, 'void': 1, 'throw': 1, 'case': 1, 'do': 1, 'else': 1, 'yield': 1, 'await': 1 };

  function last() {
    for (var k = tokens.length - 1; k >= 0; k--) if (tokens[k].t !== 'comment') return tokens[k];
    return null;
  }
  function regexAllowed() {
    var p = last();
    if (!p) return true;
    if (p.v === ')') return !!p.kwParen;
    if (p.t === 'punct') return p.v !== ']' && p.v !== '}' && p.v !== '++' && p.v !== '--';
    if (p.t === 'name') return Object.prototype.hasOwnProperty.call(BEFORE_EXPR, p.v);
    return false;
  }
  var parens = [];
  function scanString(start) {
    var q = code[start];
    var j = start + 1;
    while (j < n && code[j] !== q) {
      if (code[j] === '\\') j++;
      else if (code[j] === '\n') return j; // unterminated: stop at line end
      j++;
    }
    return Math.min(n, j + 1);
  }
  function scanTemplate(start) {
    var j = start + 1;
    while (j < n) {
      var c = code[j];
      if (c === '\\') { j += 2; continue; }
      if (c === '`') return j + 1;
      if (c === '$' && code[j + 1] === '{') { j = scanBalanced(j + 2); continue; }
      j++;
    }
    return n;
  }
  function scanBalanced(start) {
    // Scan from just after "${" to just after the matching "}".
    var depth = 1;
    var j = start;
    while (j < n) {
      var c = code[j];
      if (c === '"' || c === "'") { j = scanString(j); continue; }
      if (c === '`') { j = scanTemplate(j); continue; }
      if (c === '/' && code[j + 1] === '/') { while (j < n && code[j] !== '\n') j++; continue; }
      if (c === '/' && code[j + 1] === '*') { var e = code.indexOf('*/', j + 2); j = e < 0 ? n : e + 2; continue; }
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) return j + 1; }
      j++;
    }
    return n;
  }
  function scanRegex(start) {
    var j = start + 1;
    var inClass = false;
    while (j < n) {
      var c = code[j];
      if (c === '\n') return -1;
      if (c === '\\') { j += 2; continue; }
      if (inClass) { if (c === ']') inClass = false; }
      else if (c === '[') inClass = true;
      else if (c === '/') { j++; while (j < n && /[A-Za-z]/.test(code[j])) j++; return j; }
      j++;
    }
    return -1;
  }

  while (i < n) {
    var ch = code[i];
    if (ch === '\n' || ch === '\r' || ch === '\u2028' || ch === '\u2029') { nl = true; i++; continue; }
    if (/\s/.test(ch)) { i++; continue; }
    var start = i;
    var tok = null;
    if (ch === '/' && code[i + 1] === '/') {
      while (i < n && code[i] !== '\n') i++;
      tok = { t: 'comment', v: code.slice(start, i) };
    } else if (ch === '/' && code[i + 1] === '*') {
      var end = code.indexOf('*/', i + 2);
      i = end < 0 ? n : end + 2;
      tok = { t: 'comment', v: code.slice(start, i) };
      if (/[\n\r]/.test(tok.v)) tok.multiline = true;
    } else if (ch === '#' && i === 0 && code[1] === '!') {
      while (i < n && code[i] !== '\n') i++;
      tok = { t: 'comment', v: code.slice(start, i), keep: true };
    } else if (ch === '"' || ch === "'") {
      i = scanString(i);
      tok = { t: 'str', v: code.slice(start, i) };
    } else if (ch === '`') {
      i = scanTemplate(i);
      tok = { t: 'tmpl', v: code.slice(start, i) };
    } else if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(code[i + 1] || ''))) {
      var m = /^(0[xXbBoO][0-9a-fA-F_]+n?|(?:[0-9][0-9_]*\.?[0-9_]*|\.[0-9][0-9_]*)(?:[eE][+-]?[0-9_]+)?n?)/.exec(code.slice(i, i + 400));
      i += m[0].length;
      tok = { t: 'num', v: m[0] };
    } else if (/[A-Za-z_$#\\]/.test(ch) || ch.charCodeAt(0) > 127) {
      i++;
      while (i < n && (/[A-Za-z0-9_$\\]/.test(code[i]) || code.charCodeAt(i) > 127) && !/\s/.test(code[i])) i++;
      tok = { t: 'name', v: code.slice(start, i) };
    } else if (ch === '/' && regexAllowed()) {
      var re = scanRegex(i);
      if (re > 0) { i = re; tok = { t: 'regex', v: code.slice(start, i) }; }
    }
    if (!tok) {
      var p = ch;
      for (var k = 0; k < PUNCT.length; k++) {
        if (code.startsWith(PUNCT[k], i)) { p = PUNCT[k]; break; }
      }
      // "?." followed by a digit is a ternary, not optional chaining.
      if (p === '?.' && /[0-9]/.test(code[i + 2] || '')) p = '?';
      i += p.length;
      tok = { t: 'punct', v: p };
      if (p === '(') {
        var before = last();
        // `if (x) /re/` - a regex may follow the parenthesised head of if/while/for/with
        parens.push(!!(before && before.t === 'name' && /^(if|while|for|with)$/.test(before.v)));
      } else if (p === ')') {
        tok.kwParen = parens.pop() === true;
      }
    }
    tok.nl = nl;
    nl = false;
    if (tok.t === 'comment' && (tok.multiline || tok.v.slice(0, 2) === '//')) {
      // A line comment always ends at a line break; a multi-line block
      // comment counts as one for automatic semicolon insertion.
      nl = tok.multiline || tok.v.slice(0, 2) === '//';
    }
    tokens.push(tok);
  }
  return tokens;
}

// Would joining these two tokens without a space change how they lex?
export function cmJsNeedsSpace(prev, tok) {
  var a = prev.v.charAt(prev.v.length - 1);
  var b = tok.v.charAt(0);
  var wordy = /[A-Za-z0-9_$\\#]/;
  if ((wordy.test(a) || a.charCodeAt(0) > 127) && (wordy.test(b) || b.charCodeAt(0) > 127)) return true;
  if (prev.t === 'num' && b === '.' && /^[0-9]+$/.test(prev.v)) return true;
  if ((a === '+' || a === '-') && b === a) return true;
  if (a === '/' && (b === '/' || b === '*')) return true;
  if (a === '\x3c' && b === '!') return true;
  if (a === '-' && tok.v.slice(0, 2) === '->') return true;
  return false;
}

// Must a source line break between these tokens survive? Only where automatic
// semicolon insertion (or a restricted production such as `return\nx`) could
// depend on it. Keeping a newline is always safe; dropping one is only safe
// when the parse cannot change.
export function cmJsNeedsNewline(prev, tok) {
  var endsStatement = prev.t === 'name' || prev.t === 'num' || prev.t === 'str' || prev.t === 'tmpl' ||
    prev.t === 'regex' || prev.v === ')' || prev.v === ']' || prev.v === '}' || prev.v === '++' || prev.v === '--';
  if (!endsStatement) return false;
  return tok.t === 'name' || tok.t === 'num' || tok.t === 'str' ||
    tok.v === '{' || tok.v === '++' || tok.v === '--' || tok.v === '!' || tok.v === '~';
}

export function minifyJS(code) {
  var tokens = cmTokenizeJS(String(code));
  var out = '';
  var prev = null;
  var sawNl = false;
  for (var i = 0; i < tokens.length; i++) {
    var tok = tokens[i];
    if (tok.nl) sawNl = true;
    if (tok.t === 'comment') {
      // Keep license comments (/*! ... */) and a hashbang line.
      if (!(tok.keep || tok.v.slice(0, 3) === '/*!')) { if (tok.multiline || tok.v.slice(0, 2) === '//') sawNl = true; continue; }
      if (out) out += '\n';
      out += tok.v;
      if (tok.keep) out += '\n';
      prev = null;
      sawNl = false;
      continue;
    }
    if (prev) {
      if (sawNl && cmJsNeedsNewline(prev, tok)) out += '\n';
      else if (cmJsNeedsSpace(prev, tok)) out += ' ';
    }
    out += tok.v;
    prev = tok;
    sawNl = false;
  }
  return out.trim();
}

export function beautifyJS(code, indentUnit) {
  var unit = indentUnit || '  ';
  var tokens = cmTokenizeJS(String(code));
  var BINARY = { '=': 1, '==': 1, '===': 1, '!=': 1, '!==': 1, '+=': 1, '-=': 1, '*=': 1, '/=': 1, '%=': 1,
    '**=': 1, '<<=': 1, '>>=': 1, '>>>=': 1, '&=': 1, '|=': 1, '^=': 1, '&&=': 1, '||=': 1, '??=': 1,
    '&&': 1, '||': 1, '??': 1, '<': 1, '>': 1, '<=': 1, '>=': 1, '=>': 1, '*': 1, '/': 1, '%': 1,
    '**': 1, '|': 1, '&': 1, '^': 1, '<<': 1, '>>': 1, '>>>': 1, '?': 1 };
  var KEYWORD_PAREN = { 'if': 1, 'for': 1, 'while': 1, 'switch': 1, 'catch': 1, 'with': 1, 'return': 1,
    'typeof': 1, 'await': 1, 'yield': 1, 'in': 1, 'of': 1, 'case': 1, 'void': 1, 'delete': 1, 'throw': 1, 'new': 0 };
  var AFTER_BRACE_SAME_LINE = { 'else': 1, 'catch': 1, 'finally': 1, 'while': 1 };
  var lines = [];
  var line = '';
  var stack = [];
  var lineOpeners = [];
  var prev = null;
  var forParen = -1;
  var pendingBreak = false;

  function depth() { var d = 0; for (var k = 0; k < stack.length; k++) if (stack[k].broke) d++; return d; }
  function breakLine() {
    if (line.trim()) lines.push(line.replace(/\s+$/, ''));
    line = '';
    if (lineOpeners.length) lineOpeners[lineOpeners.length - 1].broke = true;
    lineOpeners = [];
    pendingBreak = false;
  }
  function isUnaryContext() {
    if (!prev) return true;
    if (prev.t === 'punct') return prev.v !== ')' && prev.v !== ']' && prev.v !== '}' && prev.v !== '++' && prev.v !== '--';
    if (prev.t === 'name') return KEYWORD_PAREN[prev.v] === 1 || prev.v === 'new';
    return false;
  }
  var root = { ch: '', broke: false, ternary: 0 };
  function top() { return stack[stack.length - 1] || root; }

  for (var i = 0; i < tokens.length; i++) {
    var tok = tokens[i];
    var v = tok.v;
    if (tok.t === 'comment') {
      if (line.trim()) {
        if (tok.nl) breakLine(); else line += ' ';
      }
      if (!line) line = unit.repeat(depth());
      line += tok.multiline ? v.replace(/\n[ \t]*/g, '\n' + unit.repeat(depth()) + ' ') : v;
      if (v.slice(0, 2) === '//' || tok.multiline) breakLine();
      continue;
    }
    var isCloser = v === '}' || v === ']' || v === ')';
    if (isCloser && v === '}' && line.trim()) {
      pendingBreak = !!(top() && top().broke) || pendingBreak;
    }
    if ((tok.nl && line.trim()) || (pendingBreak && line.trim())) {
      var keepSame = prev && prev.v === '}' && tok.t === 'name' && AFTER_BRACE_SAME_LINE[v] && !tok.nl;
      if (!keepSame) breakLine();
    }
    pendingBreak = false;
    var opener = null;
    if (isCloser) {
      opener = stack.pop();
      var idx = lineOpeners.indexOf(opener);
      if (idx >= 0) lineOpeners.splice(idx, 1);
    }
    if (!line) {
      line = unit.repeat(depth());
    } else if (prev) {
      var sp = '';
      var pv = prev.v;
      if (v === ',' || v === ';' || v === ')' || v === ']' || v === '.' || v === '?.') sp = '';
      else if (pv === '(' || pv === '[' || pv === '.' || pv === '?.' || pv === '...') sp = '';
      else if (pv === '!' || pv === '~') sp = '';
      else if ((pv === '++' || pv === '--') && tok.t === 'name' && (prev.unary)) sp = '';
      else if ((v === '++' || v === '--') && !isUnaryContext()) sp = '';
      else if (v === '(') sp = (prev.t === 'name' && KEYWORD_PAREN[pv] === 1) || (prev.t === 'punct' && pv !== ')' && pv !== ']') ? ' ' : '';
      else if (v === '[') sp = prev.t === 'name' && KEYWORD_PAREN[pv] !== 1 || pv === ')' || pv === ']' ? '' : ' ';
      else if (v === ':') sp = top() && top().ternary > 0 ? ' ' : '';
      else if ((pv === '+' || pv === '-') && prev.unary) sp = '';
      else if (tok.t === 'tmpl' && (prev.t === 'name' || pv === ')' || pv === ']')) sp = '';
      else sp = ' ';
      if (sp && cmJsNeedsSpace(prev, tok)) sp = ' ';
      if (!sp && cmJsNeedsSpace(prev, tok)) sp = ' ';
      line += sp;
    }
    if ((v === '+' || v === '-') && isUnaryContext()) tok.unary = true;
    if ((v === '++' || v === '--') && isUnaryContext()) tok.unary = true;
    if (v === '!' || v === '~') tok.unary = true;
    line += v;

    if (v === '{' || v === '[' || v === '(') {
      var entry = { ch: v, broke: false, ternary: 0 };
      if (v === '(' && prev && prev.v === 'for') forParen = stack.length;
      stack.push(entry);
      lineOpeners.push(entry);
      if (v === '{') {
        var nxt = tokens[i + 1];
        if (!nxt || nxt.v !== '}') breakLine();
      }
    } else if (isCloser) {
      if (v === ')' && forParen === stack.length) forParen = -1;
      if (v === '}') {
        var nx = tokens[i + 1];
        if (nx && !(nx.v === ')' || nx.v === ',' || nx.v === ';' || nx.v === '.' || nx.v === ']' || nx.v === '?.' ||
          (nx.t === 'name' && AFTER_BRACE_SAME_LINE[nx.v] && !nx.nl))) {
          pendingBreak = true;
        }
      }
    } else if (v === ';') {
      if (forParen < 0 || forParen !== stack.length - 1) pendingBreak = true;
    } else if (v === '?') {
      if (top()) top().ternary++;
    } else if (v === ':' && top() && top().ternary > 0) {
      top().ternary--;
    }
    prev = tok;
  }
  if (line.trim()) lines.push(line.replace(/\s+$/, ''));
  return lines.join('\n');
}

// Returns true when the ":" (or whitespace) at position i sits in a CSS
// declaration rather than a selector: the next "{", ";" or "}" outside
// strings and parentheses is not "{".
export function cmCssIsDeclarationAt(s, i) {
  var depth = 0;
  for (var j = i; j < s.length; j++) {
    var c = s[j];
    if (c === '"' || c === "'") {
      var q = c;
      j++;
      while (j < s.length && s[j] !== q) { if (s[j] === '\\') j++; j++; }
      continue;
    }
    if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
    else if (depth === 0) {
      if (c === '{') return false;
      if (c === ';' || c === '}') return true;
    }
  }
  return true;
}

export function minifyCSS(code) {
  var s = String(code);
  var out = '';
  var i = 0;
  var n = s.length;
  var pendingSpace = false;
  var paren = 0;
  function lastChar() { return out.charAt(out.length - 1); }
  while (i < n) {
    var c = s[i];
    if (c === '/' && s[i + 1] === '*') {
      var end = s.indexOf('*/', i + 2);
      var stop = end < 0 ? n : end + 2;
      if (s[i + 2] === '!') { out += s.slice(i, stop); pendingSpace = false; }
      else pendingSpace = pendingSpace || /\S/.test(lastChar()) ;
      i = stop;
      continue;
    }
    if (/\s/.test(c)) { pendingSpace = true; i++; continue; }
    if (pendingSpace && out) {
      var a = lastChar();
      var dropBefore = '{};,!)'.indexOf(c) >= 0 || (paren === 0 && '>~+'.indexOf(c) >= 0);
      var dropAfter = '{};,:('.indexOf(a) >= 0 || (paren === 0 && '>~+'.indexOf(a) >= 0);
      if (c === ':' && cmCssIsDeclarationAt(s, i)) dropBefore = true;
      if (!dropBefore && !dropAfter) out += ' ';
    }
    pendingSpace = false;
    if (c === '"' || c === "'") {
      var j = i + 1;
      while (j < n && s[j] !== c) { if (s[j] === '\\') j++; j++; }
      out += s.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if ((c === 'u' || c === 'U') && /^url\(/i.test(s.slice(i, i + 4))) {
      var k = i + 4;
      while (k < n && /\s/.test(s[k])) k++;
      if (s[k] !== '"' && s[k] !== "'") {
        var close = s.indexOf(')', k);
        if (close < 0) close = n - 1;
        out += s.slice(i, i + 4) + s.slice(k, close).trim() + ')';
        i = close + 1;
        continue;
      }
    }
    if (c === '(') paren++;
    else if (c === ')') paren = Math.max(0, paren - 1);
    if (c === '}' && lastChar() === ';') out = out.slice(0, -1);
    out += c;
    i++;
  }
  return out.trim();
}

export function beautifyCSS(code, indentUnit) {
  var unit = indentUnit || '  ';
  var s = minifyCSS(code);
  var out = '';
  var indent = 0;
  var paren = 0;
  var atLineStart = true;
  function newline() { out = out.replace(/[ \t]+$/, '') + '\n'; atLineStart = true; }
  function put(text) {
    if (atLineStart) { out += unit.repeat(indent); atLineStart = false; }
    out += text;
  }
  for (var i = 0; i < s.length; i++) {
    var c = s[i];
    if (c === '"' || c === "'") {
      var j = i + 1;
      while (j < s.length && s[j] !== c) { if (s[j] === '\\') j++; j++; }
      put(s.slice(i, j + 1));
      i = j;
      continue;
    }
    if (c === '/' && s[i + 1] === '*') {
      var e = s.indexOf('*/', i + 2);
      var stop = e < 0 ? s.length : e + 2;
      put(s.slice(i, stop));
      newline();
      i = stop - 1;
      continue;
    }
    if ((c === 'u' || c === 'U') && /^url\(/i.test(s.slice(i, i + 4)) && s[i + 4] !== '"' && s[i + 4] !== "'") {
      var close = s.indexOf(')', i);
      if (close < 0) close = s.length - 1;
      put(s.slice(i, close + 1));
      i = close;
      continue;
    }
    if (c === '(') { paren++; put(c); continue; }
    if (c === ')') { paren = Math.max(0, paren - 1); put(c); continue; }
    if (paren > 0) { put(c === ',' ? ', ' : c); continue; }
    if (c === '{') {
      put(' {');
      indent++;
      newline();
    } else if (c === '}') {
      if (!atLineStart) newline();
      indent = Math.max(0, indent - 1);
      put('}');
      newline();
      if (s[i + 1] && s[i + 1] !== '}') newline();
    } else if (c === ';') {
      put(';');
      newline();
    } else if (c === ':' && cmCssIsDeclarationAt(s, i)) {
      put(': ');
    } else if (c === ',') {
      if (cmCssIsDeclarationAt(s, i)) put(', ');
      else { put(','); newline(); }
    } else if ((c === '>' || c === '~' || c === '+') && !cmCssIsDeclarationAt(s, i)) {
      put(' ' + c + ' ');
    } else {
      put(c);
    }
  }
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

// Split HTML into tags, comments, raw-text elements and text, keeping the
// contents of <pre>, <textarea>, <script> and <style> verbatim.
export function cmTokenizeHTML(code) {
  var s = String(code);
  var parts = [];
  var i = 0;
  var n = s.length;
  while (i < n) {
    if (s[i] === '\x3c') {
      if (s.startsWith('\x3c!--', i)) {
        var ce = s.indexOf('--\x3e', i + 4);
        var cend = ce < 0 ? n : ce + 3;
        parts.push({ t: 'comment', v: s.slice(i, cend) });
        i = cend;
        continue;
      }
      var m = /^\x3c(\/?)([A-Za-z][\w:-]*)/.exec(s.slice(i, i + 64));
      if (m || s[i + 1] === '!' || s[i + 1] === '?') {
        // find end of tag, respecting quoted attribute values
        var j = i + 1;
        var q = '';
        while (j < n) {
          var c = s[j];
          if (q) { if (c === q) q = ''; }
          else if (c === '"' || c === "'") q = c;
          else if (c === '>') break;
          j++;
        }
        var tag = s.slice(i, Math.min(n, j + 1));
        var name = m ? m[2].toLowerCase() : '';
        var closing = !!(m && m[1]);
        parts.push({ t: 'tag', v: tag, name: name, closing: closing });
        i = j + 1;
        if (!closing && /^(pre|textarea|script|style)$/.test(name) && !/\/>$/.test(tag)) {
          var re = new RegExp('\x3c\\/' + name + '\\s*>', 'i');
          var rest = s.slice(i);
          var mm = re.exec(rest);
          var rawEnd = mm ? i + mm.index : n;
          if (rawEnd > i) parts.push({ t: 'raw', v: s.slice(i, rawEnd), name: name });
          i = rawEnd;
        }
        continue;
      }
    }
    var k = s.indexOf('\x3c', i + 1);
    if (k < 0) k = n;
    parts.push({ t: 'text', v: s.slice(i, k) });
    i = k;
  }
  return parts;
}

export function cmHtmlIsBlock(name) {
  return /^(html|head|body|title|meta|link|base|script|style|noscript|template|div|p|ul|ol|li|dl|dt|dd|table|caption|colgroup|col|thead|tbody|tfoot|tr|td|th|section|article|header|footer|nav|main|aside|h[1-6]|hgroup|form|fieldset|legend|br|hr|pre|blockquote|figure|figcaption|address|details|summary|dialog|menu|option|optgroup|select|textarea|iframe|video|audio|source|track|picture|svg|canvas|!doctype)$/i.test(name);
}

export function minifyHTML(code) {
  var parts = cmTokenizeHTML(code);
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];
    if (p.t === 'comment') {
      if (/^\x3c!--\[if|^\x3c!--\s*\[endif/i.test(p.v)) out.push(p);
      continue;
    }
    if (p.t === 'raw') { out.push(p); continue; }
    if (p.t === 'tag') {
      var tag = p.v;
      if (p.name) {
        // collapse whitespace inside the tag outside quoted values, unquote safe values
        var res = '';
        var q = '';
        for (var k = 0; k < tag.length; k++) {
          var c = tag[k];
          if (q) { res += c; if (c === q) q = ''; continue; }
          if (c === '"' || c === "'") { q = c; res += c; continue; }
          if (/\s/.test(c)) { if (!/\s$/.test(res)) res += ' '; continue; }
          res += c;
        }
        res = res.replace(/\s*=\s*(?=["'\w])/g, '=').replace(/\s+(\/?>)$/, '$1');
        res = res.replace(/=(["'])([\w.:-]+)\1(?=[\s>]|\/>)/g, function (m0, qq, val, off, whole) {
          // a value right before "/>" must stay quoted: "x/>" would swallow the slash
          return whole.slice(off + m0.length, off + m0.length + 2) === '/>' ? m0 : '=' + val;
        });
        tag = res;
      }
      out.push({ t: 'tag', v: tag, name: p.name, closing: p.closing });
      continue;
    }
    out.push({ t: 'text', v: p.v });
  }
  var html = '';
  for (var j = 0; j < out.length; j++) {
    var cur = out[j];
    if (cur.t !== 'text') { html += cur.v; continue; }
    var text = cur.v.replace(/\s+/g, ' ');
    if (text === ' ') {
      var before = out[j - 1];
      var after = out[j + 1];
      var blockNeighbour = !before || !after ||
        (before.t === 'tag' && cmHtmlIsBlock(before.name || '!doctype')) ||
        (after.t === 'tag' && cmHtmlIsBlock(after.name || '!doctype')) ||
        before.t === 'raw' || after.t === 'raw' || before.t === 'comment' || after.t === 'comment';
      if (blockNeighbour) continue;
    } else {
      var b2 = out[j - 1];
      var a2 = out[j + 1];
      if (!b2 || (b2.t === 'tag' && cmHtmlIsBlock(b2.name || '!doctype')) || b2.t === 'raw') text = text.replace(/^ /, '');
      if (!a2 || (a2.t === 'tag' && cmHtmlIsBlock(a2.name || '!doctype')) || a2.t === 'raw') text = text.replace(/ $/, '');
    }
    html += text;
  }
  return html.trim();
}

export function beautifyHTML(code, indentUnit) {
  var unit = indentUnit || '  ';
  var parts = cmTokenizeHTML(code);
  var voidTags = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
  var out = '';
  var indent = 0;
  var inlineRun = false;
  function newline() {
    out = out.replace(/[ \t]+$/, '');
    if (out) out += '\n';
    out += unit.repeat(indent);
    inlineRun = false;
  }
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];
    if (p.t === 'raw') {
      if (p.name === 'pre' || p.name === 'textarea') { out += p.v; inlineRun = true; continue; }
      // script/style: re-indent non-empty lines one level deeper, keep content
      var body = p.v.replace(/^\s*\n/, '').replace(/\s+$/, '');
      if (!body.trim()) continue;
      var linesArr = body.split('\n');
      var minIndent = Infinity;
      linesArr.forEach(function (l) { if (l.trim()) minIndent = Math.min(minIndent, /^[ \t]*/.exec(l)[0].length); });
      linesArr.forEach(function (l) {
        newline();
        out += l.trim() ? l.slice(minIndent) : '';
      });
      continue;
    }
    if (p.t === 'comment') { newline(); out += p.v; continue; }
    if (p.t === 'text') {
      var text = p.v.replace(/\s+/g, ' ');
      if (!text.trim()) {
        // whitespace between two inline pieces is significant
        if (inlineRun && parts[i + 1] && parts[i + 1].t === 'tag' && !cmHtmlIsBlock(parts[i + 1].name || '!doctype')) out += ' ';
        continue;
      }
      if (!inlineRun) { newline(); text = text.replace(/^ /, ''); }
      out += text;
      inlineRun = true;
      continue;
    }
    var name = p.name || '!doctype';
    var block = cmHtmlIsBlock(name);
    if (!block) {
      if (!inlineRun) newline();
      out += p.v;
      inlineRun = true;
      continue;
    }
    if (p.closing) {
      indent = Math.max(0, indent - 1);
      var prevPart = parts[i - 1];
      var hugging = prevPart && (prevPart.t === 'raw' && /^(pre|textarea)$/.test(prevPart.name) ||
        prevPart.t === 'tag' && !prevPart.closing && prevPart.name === p.name);
      if (!hugging) newline();
      out += p.v;
      inlineRun = false;
      continue;
    }
    newline();
    out += p.v;
    inlineRun = false;
    var textChild = parts[i + 1];
    var closeTag = parts[i + 2];
    if (textChild && textChild.t === 'text' && closeTag && closeTag.t === 'tag' && closeTag.closing &&
      closeTag.name === p.name && textChild.v.trim().length <= 80) {
      out += textChild.v.replace(/\s+/g, ' ').trim() + closeTag.v;
      i += 2;
      continue;
    }
    if (p.name && !voidTags.test(p.name) && !/\/>$/.test(p.v)) indent++;
  }
  return out.replace(/^\n+/, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export const CODE_MINIFIER_FUNCTIONS = [
  cmTokenizeJS, cmJsNeedsSpace, cmJsNeedsNewline, minifyJS, beautifyJS,
  cmCssIsDeclarationAt, minifyCSS, beautifyCSS,
  cmTokenizeHTML, cmHtmlIsBlock, minifyHTML, beautifyHTML,
];
