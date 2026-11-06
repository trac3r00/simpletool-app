// Single factory: inlined via toString(), so bundler renames of separate top-level helpers would break the page.
export function createLogViewerLogic() {
  const LEVEL_ALIASES = {
    FATAL: "ERROR",
    CRITICAL: "ERROR",
    CRIT: "ERROR",
    ERROR: "ERROR",
    ERR: "ERROR",
    SEVERE: "ERROR",
    WARNING: "WARN",
    WARN: "WARN",
    INFO: "INFO",
    NOTICE: "INFO",
    DEBUG: "DEBUG",
    TRACE: "DEBUG",
  };
  // The first whole-word level token wins, so "INFO no errors found" stays INFO
  // and "ERRORS" / "Information" are not mistaken for levels.
  const LEVEL_RE =
    /(^|[^A-Za-z0-9_])(FATAL|CRITICAL|CRIT|ERROR|ERR|SEVERE|WARNING|WARN|INFO|NOTICE|DEBUG|TRACE)(?![A-Za-z0-9_])/i;
  const TIME_RE = /\d{2}:\d{2}:\d{2}(?:[.,]\d{1,6})?/;

  function detectLevel(line) {
    const m = LEVEL_RE.exec(line);
    return m ? LEVEL_ALIASES[m[2].toUpperCase()] : "OTHER";
  }

  function parseLine(line, index) {
    const t = TIME_RE.exec(line);
    return { id: index + 1, raw: line, level: detectLevel(line), timestamp: t ? t[0] : "" };
  }

  function splitLines(text) {
    if (text === "") return [];
    const lines = text.split(/\r?\n/);
    if (lines[lines.length - 1] === "") lines.pop();
    return lines;
  }

  function buildSearchRegex(query, isRegex, maxLen) {
    if (!query) return { regex: null, error: null };
    if (isRegex && query.length > maxLen) {
      return { regex: null, error: "Regex is longer than " + maxLen + " characters." };
    }
    const source = isRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    try {
      return { regex: new RegExp(source, "gi"), error: null };
    } catch (e) {
      return { regex: null, error: "Invalid regex: " + e.message };
    }
  }

  // Worker requests carry the same source and case-insensitive flag the page regex uses;
  // the worker drops "g" for line tests, matching the page's lastIndex reset.
  function buildLineFilterRequest(query, isRegex, lines) {
    const source = isRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return { mode: "lines", pattern: source, flags: "i", lines: lines };
  }

  function buildHighlightRequest(query, isRegex, text, maxMatches) {
    const source = isRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return { mode: "matches", pattern: source, flags: "gi", text: text, maxMatches: maxMatches };
  }

  return { detectLevel, parseLine, splitLines, buildSearchRegex, buildLineFilterRequest, buildHighlightRequest };
}

export const {
  detectLevel,
  parseLine,
  splitLines,
  buildSearchRegex,
  buildLineFilterRequest,
  buildHighlightRequest,
} = createLogViewerLogic();
