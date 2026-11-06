/**
 * PNG export sizing for /mermaid-studio. Inlined into the page via
 * `(${createMermaidExportLogic.toString()})()`, so everything lives inside one
 * self-contained factory (the bundler renames clashing top-level names, which
 * would break cross-references in the served page).
 */
export function createMermaidExportLogic() {
  // SVG viewBox: four numbers separated by whitespace and/or commas
  // (SVG 1.1 section 7.7). Returns null unless width and height are positive.
  function parseViewBox(value) {
    if (typeof value !== "string") return null;
    var parts = value.trim().split(/\s*,\s*|\s+/);
    if (parts.length !== 4) return null;
    var nums = [];
    for (var i = 0; i < 4; i++) {
      if (parts[i] === "") return null;
      var n = Number(parts[i]);
      if (!isFinite(n)) return null;
      nums.push(n);
    }
    if (!(nums[2] > 0) || !(nums[3] > 0)) return null;
    return { x: nums[0], y: nums[1], width: nums[2], height: nums[3] };
  }

  // Pixel size of the exported raster. Applies `scale`, but shrinks it so the
  // longer side never exceeds `maxSide` (browsers refuse or blank very large
  // canvases). Each side is at least 1px.
  function exportDimensions(box, scale, maxSide) {
    var longest = Math.max(box.width, box.height);
    var effective = Math.min(scale, maxSide / longest);
    return {
      width: Math.max(1, Math.round(box.width * effective)),
      height: Math.max(1, Math.round(box.height * effective)),
      scale: effective,
    };
  }

  return { parseViewBox: parseViewBox, exportDimensions: exportDimensions };
}
