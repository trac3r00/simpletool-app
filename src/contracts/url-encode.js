const urlEncode = {
  id: 'url-encode',
  name: 'URL Encode/Decode',
  inputTypes: ['text'],
  outputTypes: ['text'],
  options: [
    { id: 'mode', type: 'select', values: ['encode', 'decode'] }
  ],
  transform(input, { mode = 'encode' } = {}) {
    if (!input) return '';
    const text = String(input);

    if (mode === 'decode') {
      try {
        return decodeURIComponent(text);
      } catch {
        return `[Error: invalid URL-encoded input]`;
      }
    }

    return encodeURIComponent(text);
  }
};

export default urlEncode;
