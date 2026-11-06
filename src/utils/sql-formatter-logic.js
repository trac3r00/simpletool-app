/**
 * SQL tokenizer, formatter and minifier for /sql-formatter. Inlined into the
 * page via toString, so each function is self-contained apart from calls to
 * the others listed in SQL_FORMATTER_FUNCTIONS.
 */

export function buildSqlKeywords(dialect) {
  var base = [
    "SELECT", "FROM", "WHERE", "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "OFFSET",
    "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "RETURNING",
    "JOIN", "LEFT", "RIGHT", "FULL", "INNER", "OUTER", "CROSS", "NATURAL", "ON", "USING",
    "UNION", "INTERSECT", "EXCEPT", "ALL", "DISTINCT", "AS", "AND", "OR", "NOT", "NULL", "IS", "IN", "EXISTS",
    "LIKE", "BETWEEN", "ASC", "DESC", "TRUE", "FALSE", "OVER", "INTERVAL",
    "CASE", "WHEN", "THEN", "ELSE", "END",
    "CREATE", "ALTER", "DROP", "TRUNCATE", "TABLE", "VIEW", "INDEX", "PRIMARY", "FOREIGN", "REFERENCES",
    "DEFAULT", "CONSTRAINT", "UNIQUE", "CHECK", "CASCADE",
    "WITH",
  ];
  var extra = {
    postgres: ["ILIKE", "LATERAL", "PARTITION", "WINDOW", "EXCLUDE", "FILTER", "WITHIN"],
    mysql: ["AUTO_INCREMENT", "ENGINE", "CHARSET", "COLLATE", "UNSIGNED", "ENUM", "REPLACE", "IGNORE"],
    bigquery: ["STRUCT", "ARRAY", "UNNEST", "TABLESAMPLE", "QUALIFY", "PIVOT", "UNPIVOT", "SAFE_CAST", "IFNULL", "COUNTIF", "ANY_VALUE", "ARRAY_AGG", "STRING_AGG", "REPLACE", "WINDOW", "ROWS", "RANGE"],
    snowflake: ["VARIANT", "OBJECT", "LATERAL", "FLATTEN", "QUALIFY", "ILIKE", "RLIKE", "SAMPLE", "STREAM", "TASK", "PIPE", "STAGE", "MERGE", "CLONE", "UNDROP", "SWAP"],
    clickhouse: ["ENGINE", "PREWHERE", "GLOBAL", "FINAL", "SAMPLE", "MATERIALIZED", "SETTINGS", "FORMAT", "ARRAY", "TUPLE", "NULLABLE", "LOWCARDINALITY"],
    sqlite: ["AUTOINCREMENT", "GLOB", "REPLACE", "VACUUM", "ATTACH", "DETACH", "PRAGMA", "REINDEX", "EXPLAIN"],
  };
  return new Set(base.concat(extra[dialect] || []));
}

export function tokenizeSql(sql, dialect) {
  var s = String(sql || "");
  var tokens = [];
  var i = 0;
  var line = 1;
  var col = 1;
  var BT = "\u0060";
  function push(type, value, at) {
    tokens.push({ type: type, value: value, at: at });
  }
  function adv(n) {
    for (var k = 0; k < n; k++) {
      if (s[i++] === "\n") { line++; col = 1; } else { col++; }
    }
  }
  function quoted(q) {
    var j = i + 1;
    while (j < s.length) {
      if (s[j] === q && s[j + 1] === q) { j += 2; continue; }
      if (s[j] === q) { j++; break; }
      if (q === "'" && s[j] === "\\" && (dialect === "mysql" || dialect === "bigquery")) { j += 2; continue; }
      j++;
    }
    return j;
  }
  while (i < s.length) {
    var at = { i: i, line: line, col: col };
    var ch = s[i];
    var j;
    if (/\s/.test(ch)) { adv(1); continue; }
    if (ch === "-" && s[i + 1] === "-") {
      j = s.indexOf("\n", i);
      if (j < 0) j = s.length;
      push("comment", s.slice(i, j), at); adv(j - i); continue;
    }
    if ((dialect === "mysql" || dialect === "clickhouse") && ch === "#") {
      j = s.indexOf("\n", i);
      if (j < 0) j = s.length;
      push("comment", s.slice(i, j), at); adv(j - i); continue;
    }
    if (ch === "/" && s[i + 1] === "*") {
      j = s.indexOf("*/", i + 2);
      j = j < 0 ? s.length : j + 2;
      push("comment", s.slice(i, j), at); adv(j - i); continue;
    }
    if (ch === "'") { j = quoted("'"); push("string", s.slice(i, j), at); adv(j - i); continue; }
    if (ch === '"') { j = quoted('"'); push("ident", s.slice(i, j), at); adv(j - i); continue; }
    if ((dialect === "mysql" || dialect === "bigquery" || dialect === "clickhouse") && ch === BT) {
      j = quoted(BT); push("ident", s.slice(i, j), at); adv(j - i); continue;
    }
    if (ch === "$") {
      // Postgres dollar-quoted body ($$ ... $$ or $tag$ ... $tag$) and $1-style parameters.
      var tag = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(s.slice(i, i + 64));
      if (tag) {
        var end = s.indexOf(tag[0], i + tag[0].length);
        j = end < 0 ? s.length : end + tag[0].length;
        push("string", s.slice(i, j), at); adv(j - i); continue;
      }
      var param = /^\$\d+/.exec(s.slice(i, i + 32));
      if (param) { push("param", param[0], at); adv(param[0].length); continue; }
    }
    if ((ch === ":" && s[i + 1] !== ":" && s[i - 1] !== ":") || ch === "@") {
      var named = /^(?::|@@?)[A-Za-z_][A-Za-z0-9_.$]*/.exec(s.slice(i, i + 128));
      if (named) { push("param", named[0], at); adv(named[0].length); continue; }
    }
    if (/\d/.test(ch) || (ch === "." && /\d/.test(s[i + 1] || ""))) {
      var num = /^(?:0[xX][0-9a-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/.exec(s.slice(i, i + 128));
      push("number", num[0], at); adv(num[0].length); continue;
    }
    if (/[A-Za-z_\u0080-\uffff]/.test(ch)) {
      j = i + 1;
      while (j < s.length && /[A-Za-z0-9_$\u0080-\uffff]/.test(s[j])) j++;
      push("word", s.slice(i, j), at); adv(j - i); continue;
    }
    var three = s.slice(i, i + 3);
    var two = s.slice(i, i + 2);
    if (three === "->>" || three === "#>>") { push("op", three, at); adv(3); continue; }
    if (["!=", "<=", ">=", "<>", "::", "->", "||", "#>", "@>", "<@", "&&"].indexOf(two) >= 0) { push("op", two, at); adv(2); continue; }
    push("punct", ch, at);
    adv(1);
  }
  return tokens;
}

// Space between two adjacent tokens. A word followed by "(" is a function
// call ("count(*)") unless it is a keyword ("IN (", "VALUES (") or a table
// name after INTO/TABLE ("INSERT INTO t (a, b)").
export function sqlNeedsSpace(prevTok, curTok, beforePrev, keywords) {
  if (!prevTok) return false;
  var pv = prevTok.value;
  var cv = curTok.value;
  if (cv === "," || cv === ")" || cv === ";") return false;
  if (pv === "(" || pv === "." || cv === ".") return false;
  if (pv === "::" || cv === "::" || cv === "->" || pv === "->" || cv === "->>" || pv === "->>") return false;
  if (cv === "(" && (prevTok.type === "word" || prevTok.type === "ident")) {
    var upper = pv.toUpperCase();
    if (keywords.has(upper)) return true;
    var bp = beforePrev && beforePrev.type === "word" ? beforePrev.value.toUpperCase() : "";
    return bp === "INTO" || bp === "TABLE" || bp === "VIEW" || bp === "JOIN" || bp === "EXISTS";
  }
  return true;
}

export function sqlClauseAt(tokens, i) {
  function w(k) {
    var t = tokens[k];
    return t && t.type === "word" ? t.value.toUpperCase() : "";
  }
  var a = w(i);
  var b = w(i + 1);
  var c = w(i + 2);
  if (a === "GROUP" && b === "BY") return { words: 2, clause: "group" };
  if (a === "ORDER" && b === "BY") return { words: 2, clause: "order" };
  if ((a === "UNION" || a === "INTERSECT" || a === "EXCEPT") && (b === "ALL" || b === "DISTINCT")) return { words: 2, clause: "union" };
  if (a === "UNION" || a === "INTERSECT" || a === "EXCEPT") return { words: 1, clause: "union" };
  if ((a === "LEFT" || a === "RIGHT" || a === "FULL") && b === "OUTER" && c === "JOIN") return { words: 3, clause: "join" };
  if ((a === "LEFT" || a === "RIGHT" || a === "FULL" || a === "INNER" || a === "CROSS" || a === "NATURAL") && b === "JOIN") return { words: 2, clause: "join" };
  if (a === "JOIN") return { words: 1, clause: "join" };
  if (a === "ON") return { words: 1, clause: "on" };
  if (/^(SELECT|FROM|WHERE|HAVING|LIMIT|OFFSET|INSERT|UPDATE|DELETE|VALUES|SET|RETURNING|WITH)$/.test(a)) {
    return { words: 1, clause: a.toLowerCase() };
  }
  return null;
}

export function sqlKeywordCase(word, mode) {
  if (mode === "keep") return word;
  return mode === "lower" ? word.toLowerCase() : word.toUpperCase();
}

export function formatSql(sql, opts, keywords) {
  var unit = " ".repeat(opts.indentSize || 2);
  var lines = formatSqlTokens(tokenizeSql(sql, opts.dialect), opts, keywords, unit);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function sqlSubqueryEnd(tokens, open) {
  var next = open + 1;
  while (tokens[next] && tokens[next].type === "comment") next++;
  var first = tokens[next] && tokens[next].type === "word" ? tokens[next].value.toUpperCase() : "";
  if (first !== "SELECT" && first !== "WITH") return -1;
  var depth = 0;
  for (var j = open; j < tokens.length; j++) {
    if (tokens[j].value === "(") depth++;
    else if (tokens[j].value === ")" && --depth === 0) return j;
  }
  return -1;
}

function formatSqlTokens(tokens, opts, keywords, unit) {
  var parenDepth = 0;
  var clause = "";
  var clauseIndent = 0;
  var lines = [];
  var lineStr = "";
  var prev = null;
  var beforePrev = null;
  var betweenPending = false;

  function setLine(level) {
    lineStr = unit.repeat(Math.max(0, level));
    prev = null;
    beforePrev = null;
  }
  function pushLine(nextLevel) {
    var out = lineStr.replace(/\s+$/, "");
    if (out.trim()) lines.push(out);
    setLine(nextLevel);
  }
  function contentLevel() { return parenDepth + clauseIndent; }
  function emit(tok, val) {
    if (lineStr.trim() && sqlNeedsSpace(prev, tok, beforePrev, keywords)) lineStr += " ";
    lineStr += val;
    beforePrev = prev;
    prev = tok;
  }

  setLine(0);
  for (var i = 0; i < tokens.length; i++) {
    var tok = tokens[i];
    if (tok.type === "comment") {
      if (lineStr.trim()) pushLine(parenDepth);
      setLine(parenDepth);
      lineStr += tok.value.trim();
      pushLine(contentLevel());
      continue;
    }
    if (parenDepth === 0 && tok.type === "word") {
      var cs = sqlClauseAt(tokens, i);
      if (cs) {
        if (lineStr.trim()) pushLine(0);
        setLine(0);
        var words = [];
        for (var k = 0; k < cs.words; k++) words.push(sqlKeywordCase(tokens[i + k].value, opts.kwcase));
        lineStr += words.join(" ");
        clause = cs.clause;
        clauseIndent = clause === "on" ? 2 : 1;
        betweenPending = false;
        pushLine(contentLevel());
        i += cs.words - 1;
        continue;
      }
    }
    var val = tok.value;
    var upper = tok.type === "word" ? val.toUpperCase() : "";
    if (tok.type === "word" && keywords.has(upper)) val = sqlKeywordCase(val, opts.kwcase);
    if (val === ")") parenDepth = Math.max(0, parenDepth - 1);

    // A parenthesised SELECT/WITH is laid out as its own query, one level in.
    if (val === "(") {
      var close = sqlSubqueryEnd(tokens, i);
      if (close !== -1) {
        var base = contentLevel();
        emit(tok, val);
        pushLine(base + 1);
        formatSqlTokens(tokens.slice(i + 1, close), opts, keywords, unit).forEach(function (subLine) {
          if (subLine.trim()) lines.push(unit.repeat(base + 1) + subLine);
        });
        setLine(base);
        lineStr += ")";
        prev = tokens[close];
        i = close;
        continue;
      }
    }

    if (val === "," && parenDepth === 0 && /^(select|from|set|values|returning|group|order)$/.test(clause)) {
      lineStr += ",";
      pushLine(contentLevel());
      continue;
    }
    if (upper === "BETWEEN") betweenPending = true;
    if ((upper === "AND" || upper === "OR") && parenDepth === 0 && /^(where|having|on)$/.test(clause)) {
      if (upper === "AND" && betweenPending) {
        betweenPending = false;
      } else {
        pushLine(contentLevel());
        lineStr += val;
        prev = { type: "word", value: val };
        continue;
      }
    }
    emit(tok, val);
    if (val === "(") parenDepth++;
    if (val === ";") {
      pushLine(0);
      lines.push("");
      clause = "";
      clauseIndent = 0;
      parenDepth = 0;
    }
  }
  if (lineStr.trim()) lines.push(lineStr.replace(/\s+$/, ""));
  return lines;
}

export function minifySql(sql, dialect, keywords) {
  var tokens = tokenizeSql(sql, dialect);
  var out = "";
  var prev = null;
  var beforePrev = null;
  for (var i = 0; i < tokens.length; i++) {
    var tok = tokens[i];
    if (tok.type === "comment") continue;
    if (sqlNeedsSpace(prev, tok, beforePrev, keywords)) out += " ";
    out += tok.value;
    beforePrev = prev;
    prev = tok;
  }
  return out.trim();
}

export const SQL_FORMATTER_FUNCTIONS = [
  buildSqlKeywords, tokenizeSql, sqlNeedsSpace, sqlClauseAt, sqlKeywordCase, sqlSubqueryEnd, formatSqlTokens, formatSql, minifySql,
];
