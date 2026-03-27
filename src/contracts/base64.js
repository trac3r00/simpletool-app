const base64 = {
  id: 'base64',
  name: 'Base64 Encode/Decode',
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
        return decodeURIComponent(
          atob(text).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          ).join('')
        );
      } catch {
        return `[Error: invalid Base64 input]`;
      }
    }

    try {
      return btoa(
        encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, p1) =>
          String.fromCharCode(parseInt(p1, 16))
        )
      );
    } catch {
      return `[Error: cannot encode input]`;
    }
  }
};

export default base64;
