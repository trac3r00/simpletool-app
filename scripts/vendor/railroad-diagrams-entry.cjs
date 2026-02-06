// Bundled into dist/vendor/railroad-diagrams.min.js (IIFE global: Railroad)
const rr = require('railroad-diagrams');

module.exports = {
  ...rr,

  // The upstream library doesn't export these helpers, but the Regex Studio
  // tool expects them. We map them to reasonable visual tokens.
  Start() {
    return rr.NonTerminal('start');
  },
  End() {
    return rr.NonTerminal('end');
  },
  Group(content, label) {
    if (!label) return content;
    return rr.Sequence(rr.NonTerminal(label), content);
  },
  Comment(node, text) {
    if (text === undefined) return rr.Comment(node);
    return rr.Sequence(node, rr.Comment(text));
  }
};
