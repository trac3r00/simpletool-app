/**
 * Pure tool filtering function for the home page search.
 *
 * Substring match (case-insensitive) over name, description, and keywords.
 * No fuzzy matching, no regex — substring only to avoid false positives
 * like "json" matching unrelated tools.
 *
 * @param {Array<Object>} allTools - The TOOLS array from tool-registry.js
 * @param {string} query - User search query
 * @returns {Array<Object>} Filtered tools (returns all when query is empty)
 */
export function filterTools(allTools, query) {
  if (!query || query.trim() === '') return allTools;
  const q = query.toLowerCase().trim();
  return allTools.filter((tool) => {
    const searchable = [
      tool.name || '',
      tool.description || '',
      tool.keywords || '',
      ...(tool.tags || [])
    ]
      .join(' ')
      .toLowerCase();
    return searchable.includes(q);
  });
}
