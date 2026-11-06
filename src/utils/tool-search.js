/**
 * Pure tool matching for the home page search.
 *
 * Every query word must appear in the tool text (so "decode jwt" works even
 * though no tool says that exact phrase). A word of 5+ letters also matches a
 * text word one edit away ("pasword" -> "password"); shorter words stay exact
 * so "json" cannot fuzzily match unrelated tools.
 *
 * Self-contained so home.js can inject it with matchesToolQuery.toString().
 */
export function matchesToolQuery(haystack, query) {
  const q = String(query || "").toLowerCase().trim();
  if (!q) return true;
  const text = String(haystack || "").toLowerCase();
  const words = text.split(/[^a-z0-9\u00c0-\uffff]+/).filter(Boolean);
  const withinOneEdit = (a, b) => {
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0;
    let j = 0;
    let edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      edits++;
      if (edits > 1) return false;
      if (a.length > b.length) i++;
      else if (b.length > a.length) j++;
      else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  };
  return q.split(/\s+/).every((term) => {
    if (text.includes(term)) return true;
    if (term.length < 5) return false;
    return words.some((w) => withinOneEdit(term, w));
  });
}

/**
 * @param {Array<Object>} allTools - The TOOLS array from tool-registry.js
 * @param {string} query - User search query
 * @returns {Array<Object>} Filtered tools (returns all when query is empty)
 */
export function filterTools(allTools, query) {
  if (!query || query.trim() === "") return allTools;
  return allTools.filter((tool) =>
    matchesToolQuery(
      [tool.name || "", tool.description || "", tool.keywords || "", ...(tool.tags || [])].join(" "),
      query,
    ),
  );
}
