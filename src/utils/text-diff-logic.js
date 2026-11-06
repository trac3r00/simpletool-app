/**
 * Pure text diff engine for the text-diff page.
 *
 * All functions live inside createTextDiffEngine(), which is self-contained (no imports,
 * no closures over module state) so the route can inject it with `fn.toString()` and
 * call it once in the page. Keeping the helpers inside one function means a minifier
 * renames their cross-references consistently.
 *
 * Algorithm: Myers' O(ND) difference algorithm with the linear-space "middle snake"
 * refinement, run after (1) trimming the common prefix/suffix and (2) dropping tokens
 * that occur on only one side. A token that never appears on the other side can never
 * be part of a common subsequence, so removing it keeps the result minimal while
 * making unrelated inputs (large D) cheap.
 */

export function createTextDiffEngine() {
  /**
   * Split text into tokens whose concatenation is exactly the input.
   * - line: each line keeps its trailing "\n" (the last line may lack one)
   * - word: alternating runs of whitespace and non-whitespace
   * - char: Unicode code points; with ignoreWhitespace, whitespace runs are one token
   */
  function tokenizeText(text, mode, options) {
    const opts = options || {};
    if (text === "") return [];
    if (mode === "word") return text.match(/\s+|\S+/g);
    if (mode === "char") {
      if (opts.ignoreWhitespace) return text.match(/\s+|\S/gu);
      return Array.from(text);
    }
    const out = [];
    let start = 0;
    for (let i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) === 10) {
        out.push(text.slice(start, i + 1));
        start = i + 1;
      }
    }
    if (start < text.length) out.push(text.slice(start));
    return out;
  }

  /**
   * Comparison key for a token. Tokens with equal keys are treated as unchanged.
   * - ignoreCase: compare lower-cased text
   * - ignoreWhitespace: line mode removes all whitespace before comparing (like
   *   `git diff -w`); word/char modes treat any whitespace run as equal to any other
   */
  function diffTokenKey(token, mode, options) {
    const opts = options || {};
    let key = token;
    if (opts.ignoreWhitespace) {
      if (mode === "line") key = key.replace(/\s+/g, "");
      else if (/^\s+$/.test(key)) key = " ";
    }
    if (opts.ignoreCase) key = key.toLowerCase();
    return key;
  }

  /**
   * Longest common subsequence of two integer arrays via Myers' linear-space
   * algorithm. Returns { pairs, exact }: matched index pairs [i, j] in increasing
   * order. With a finite maxCost (diagonal steps + snake steps), a sub-box that
   * would exceed it is left unmatched (all deletes, then all inserts) and exact is
   * false: the script stays valid but may not be minimal.
   */
  function myersMatchPairs(a, b, maxCost) {
    const budget = maxCost === undefined ? Infinity : maxCost;
    let cost = 0;
    let exact = true;
    const pairs = [];
    const total = a.length + b.length;
    const off = total + 2;
    const vf = new Int32Array(2 * off + 2);
    const vb = new Int32Array(2 * off + 2);

    function middleSnake(a0, a1, b0, b1) {
      const n = a1 - a0;
      const m = b1 - b0;
      const delta = n - m;
      const odd = (delta & 1) !== 0;
      const maxD = Math.ceil((n + m) / 2);
      vf[off + 1] = 0;
      vb[off + 1] = 0;
      for (let d = 0; d <= maxD; d++) {
        for (let k = -d; k <= d; k += 2) {
          let x =
            k === -d || (k !== d && vf[off + k - 1] < vf[off + k + 1])
              ? vf[off + k + 1]
              : vf[off + k - 1] + 1;
          let y = x - k;
          const x0 = x;
          const y0 = y;
          while (x < n && y < m && a[a0 + x] === b[b0 + y]) {
            x++;
            y++;
          }
          cost += 1 + x - x0;
          vf[off + k] = x;
          if (odd && k >= delta - (d - 1) && k <= delta + (d - 1)) {
            if (x + vb[off + delta - k] >= n) return [x0, y0, x, y];
          }
        }
        for (let k = -d; k <= d; k += 2) {
          let x =
            k === -d || (k !== d && vb[off + k - 1] < vb[off + k + 1])
              ? vb[off + k + 1]
              : vb[off + k - 1] + 1;
          let y = x - k;
          const x0 = x;
          const y0 = y;
          while (x < n && y < m && a[a1 - 1 - x] === b[b1 - 1 - y]) {
            x++;
            y++;
          }
          cost += 1 + x - x0;
          vb[off + k] = x;
          if (!odd && k >= delta - d && k <= delta + d) {
            if (x + vf[off + delta - k] >= n) return [n - x, m - y, n - x0, m - y0];
          }
        }
        if (cost > budget) return null;
      }
      throw new Error("diff: middle snake not found");
    }

    function solve(a0, a1, b0, b1) {
      while (a0 < a1 && b0 < b1 && a[a0] === b[b0]) {
        pairs.push([a0, b0]);
        a0++;
        b0++;
      }
      let suffix = 0;
      while (a1 > a0 && b1 > b0 && a[a1 - 1] === b[b1 - 1]) {
        a1--;
        b1--;
        suffix++;
      }
      const s = a0 < a1 && b0 < b1 && cost <= budget ? middleSnake(a0, a1, b0, b1) : null;
      if (a0 < a1 && b0 < b1 && s === null) exact = false;
      if (s !== null) {
        solve(a0, a0 + s[0], b0, b0 + s[1]);
        for (let t = 0; t < s[2] - s[0]; t++) pairs.push([a0 + s[0] + t, b0 + s[1] + t]);
        solve(a0 + s[2], a1, b0 + s[3], b1);
      }
      for (let t = 0; t < suffix; t++) pairs.push([a1 + t, b1 + t]);
    }

    solve(0, a.length, 0, b.length);
    return { pairs, exact };
  }

  /**
   * Diff two texts. Returns { mode, ops, stats, exact } where ops is a list of
   * { type: 'equal', a, b } | { type: 'delete', a } | { type: 'insert', b }, one per
   * token. `equal` carries both sides because ignore options can make them differ.
   * Concatenating equal.a + delete.a gives textA; equal.b + insert.b gives textB.
   * options.maxCost bounds the work (see myersMatchPairs); exact is false when hit.
   */
  function computeTextDiff(textA, textB, options) {
    const opts = options || {};
    const mode = opts.mode === "word" || opts.mode === "char" ? opts.mode : "line";
    const ta = tokenizeText(textA, mode, opts);
    const tb = tokenizeText(textB, mode, opts);

    const ids = new Map();
    const countA = [];
    const countB = [];
    const intern = (tok) => {
      const key = diffTokenKey(tok, mode, opts);
      let id = ids.get(key);
      if (id === undefined) {
        id = ids.size;
        ids.set(key, id);
        countA.push(0);
        countB.push(0);
      }
      return id;
    };
    const ia = ta.map(intern);
    const ib = tb.map(intern);
    for (const id of ia) countA[id]++;
    for (const id of ib) countB[id]++;

    const fa = [];
    const fai = [];
    for (let i = 0; i < ia.length; i++) {
      if (countB[ia[i]] > 0) {
        fa.push(ia[i]);
        fai.push(i);
      }
    }
    const fb = [];
    const fbi = [];
    for (let j = 0; j < ib.length; j++) {
      if (countA[ib[j]] > 0) {
        fb.push(ib[j]);
        fbi.push(j);
      }
    }

    const { pairs, exact } = myersMatchPairs(fa, fb, opts.maxCost);
    const ops = [];
    let i = 0;
    let j = 0;
    const flushTo = (ai, bj) => {
      while (i < ai) ops.push({ type: "delete", a: ta[i++] });
      while (j < bj) ops.push({ type: "insert", b: tb[j++] });
    };
    for (const p of pairs) {
      const ai = fai[p[0]];
      const bj = fbi[p[1]];
      flushTo(ai, bj);
      ops.push({ type: "equal", a: ta[i++], b: tb[j++] });
    }
    flushTo(ta.length, tb.length);

    const counts = (tok) => mode !== "word" || /\S/.test(tok);
    const stats = { added: 0, removed: 0, unchanged: 0 };
    for (const op of ops) {
      if (op.type === "insert") {
        if (counts(op.b)) stats.added++;
      } else if (op.type === "delete") {
        if (counts(op.a)) stats.removed++;
      } else if (counts(op.a)) stats.unchanged++;
    }
    return { mode, ops, stats, exact };
  }

  /**
   * Unified diff (line mode) with `context` lines around each change (default 3).
   * Lines that compare equal under the ignore options are written as context from
   * textA. Returns "" when nothing differs.
   */
  function createUnifiedDiff(textA, textB, options) {
    const opts = options || {};
    const context = opts.context === undefined ? 3 : opts.context;
    const ops = computeTextDiff(textA, textB, {
      mode: "line",
      ignoreCase: opts.ignoreCase,
      ignoreWhitespace: opts.ignoreWhitespace,
      maxCost: opts.maxCost,
    }).ops;

    const changes = [];
    for (let k = 0; k < ops.length; k++) if (ops[k].type !== "equal") changes.push(k);
    if (changes.length === 0) return "";

    const groups = [];
    let first = changes[0];
    let last = changes[0];
    for (let c = 1; c < changes.length; c++) {
      if (changes[c] - last - 1 > 2 * context) {
        groups.push([first, last]);
        first = changes[c];
      }
      last = changes[c];
    }
    groups.push([first, last]);

    // aBefore[k] / bBefore[k]: lines of A / B consumed before op k
    const aBefore = [0];
    const bBefore = [0];
    for (let k = 0; k < ops.length; k++) {
      aBefore.push(aBefore[k] + (ops[k].type === "insert" ? 0 : 1));
      bBefore.push(bBefore[k] + (ops[k].type === "delete" ? 0 : 1));
    }

    const range = (start, count) =>
      (count === 0 ? String(start) : String(start + 1)) + (count === 1 ? "" : "," + count);
    const emit = (prefix, line) => {
      if (line.endsWith("\n")) return prefix + line;
      return prefix + line + "\n\\ No newline at end of file\n";
    };

    let out =
      "--- " + (opts.labelA || "original.txt") + "\n+++ " + (opts.labelB || "modified.txt") + "\n";
    for (const g of groups) {
      const s = Math.max(0, g[0] - context);
      const e = Math.min(ops.length, g[1] + context + 1);
      const aCount = aBefore[e] - aBefore[s];
      const bCount = bBefore[e] - bBefore[s];
      out += "@@ -" + range(aBefore[s], aCount) + " +" + range(bBefore[s], bCount) + " @@\n";
      for (let k = s; k < e; k++) {
        const op = ops[k];
        if (op.type === "equal") out += emit(" ", op.a);
        else if (op.type === "delete") out += emit("-", op.a);
        else out += emit("+", op.b);
      }
    }
    return out;
  }

  return { tokenizeText, diffTokenKey, myersMatchPairs, computeTextDiff, createUnifiedDiff };
}

export const {
  tokenizeText,
  diffTokenKey,
  myersMatchPairs,
  computeTextDiff,
  createUnifiedDiff,
} = createTextDiffEngine();
