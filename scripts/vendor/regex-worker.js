/*
 * Runs user-supplied regular expressions off the main thread so a
 * catastrophic-backtracking pattern such as (a+)+$ cannot freeze the page.
 * The page owns the deadline: it terminates this worker when a reply is late.
 * Served as /vendor/regex-worker.js; CSP worker-src falls back to script-src
 * 'self', so no policy change is needed.
 *
 * Request:  { id, mode: "matches", pattern, flags, text, maxMatches }
 *           { id, mode: "lines",   pattern, flags, lines }
 * Reply:    { id, ok: true, matches: [{ index, match, groups, named }], capped }
 *           { id, ok: true, lineIndexes: number[] }
 *           { id, ok: false, error }
 */
self.onmessage = function (event) {
  var req = event.data || {};
  try {
    if (req.mode === "lines") {
      var lineRe = new RegExp(req.pattern, String(req.flags || "").replace(/[gy]/g, ""));
      var hits = [];
      for (var i = 0; i < req.lines.length; i++) {
        if (lineRe.test(req.lines[i])) hits.push(i);
      }
      self.postMessage({ id: req.id, ok: true, lineIndexes: hits });
      return;
    }
    var flags = String(req.flags || "");
    if (flags.indexOf("g") === -1) flags += "g";
    var re = new RegExp(req.pattern, flags);
    var max = req.maxMatches || 1000;
    var out = [];
    var m;
    var capped = false;
    while ((m = re.exec(req.text)) !== null) {
      out.push({
        index: m.index,
        match: m[0],
        groups: Array.prototype.slice.call(m, 1),
        named: m.groups ? Object.assign({}, m.groups) : null,
      });
      if (m[0] === "") re.lastIndex++;
      if (out.length >= max) {
        capped = true;
        break;
      }
    }
    self.postMessage({ id: req.id, ok: true, matches: out, capped: capped });
  } catch (error) {
    self.postMessage({ id: req.id, ok: false, error: String((error && error.message) || error) });
  }
};
