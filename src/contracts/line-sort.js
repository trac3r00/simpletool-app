const lineSort = {
  id: 'line-sort',
  name: 'Line Sort & Dedupe',
  inputTypes: ['text'],
  outputTypes: ['text'],
  options: [
    { id: 'mode', type: 'select', values: ['sort', 'reverse', 'dedupe', 'sort-dedupe'] }
  ],
  transform(input, { mode = 'sort' } = {}) {
    if (!input) return '';
    const lines = String(input).split('\n');

    switch (mode) {
      case 'sort':
        return lines.sort().join('\n');
      case 'reverse':
        return lines.sort().reverse().join('\n');
      case 'dedupe': {
        const seen = new Set();
        return lines.filter(line => {
          if (seen.has(line)) return false;
          seen.add(line);
          return true;
        }).join('\n');
      }
      case 'sort-dedupe':
        return [...new Set(lines)].sort().join('\n');
      default:
        return lines.sort().join('\n');
    }
  }
};

export default lineSort;
