// Single factory: inlined via toString(), so bundler renames of separate top-level helpers would break the page.
export function createMockDataLogic() {
  const MIN_ROWS = 10;
  const MAX_ROWS = 500;

  function clampRows(value) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return MIN_ROWS;
    return Math.min(MAX_ROWS, Math.max(MIN_ROWS, n));
  }

  function sqlIdentifier(name) {
    const trimmed = String(name).trim() || "mock_data";
    return trimmed
      .split(".")
      .map((part) =>
        /^[A-Za-z_][A-Za-z0-9_]*$/.test(part)
          ? part
          : '"' + part.replace(/"/g, '""') + '"',
      )
      .join(".");
  }

  return { MIN_ROWS, MAX_ROWS, clampRows, sqlIdentifier };
}

export const { MIN_ROWS, MAX_ROWS, clampRows, sqlIdentifier } =
  createMockDataLogic();
