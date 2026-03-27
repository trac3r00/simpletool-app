const caseConverter = {
  id: 'case-converter',
  name: 'Text Case Converter',
  inputTypes: ['text'],
  outputTypes: ['text'],
  options: [
    { id: 'style', type: 'select', values: ['camel', 'snake', 'kebab', 'pascal', 'upper', 'lower', 'constant', 'dot', 'title', 'sentence'] }
  ],
  transform(input, { style = 'camel' } = {}) {
    if (!input) return '';
    const text = String(input);

    switch (style) {
      case 'upper':
        return text.toUpperCase();
      case 'lower':
        return text.toLowerCase();
      case 'title':
        return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      case 'sentence':
        return text.toLowerCase().replace(/(^\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
      case 'camel': {
        const words = text.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
        return words.map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('');
      }
      case 'pascal': {
        const words = text.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      }
      case 'snake':
        return text.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
      case 'kebab':
        return text.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
      case 'constant':
        return text.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
      case 'dot':
        return text.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '.').replace(/^\.|\.$/g, '');
      default:
        return text;
    }
  }
};

export default caseConverter;
