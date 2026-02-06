/**
 * CyberChef-inspired text operations
 * Encoding, decoding, hashing, and text transformations
 */

const MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '/': '-..-.',
  '@': '.--.-.', ' ': '/', '-': '-....-'
};

const REVERSE_MORSE = Object.entries(MORSE).reduce((acc, [char, code]) => {
  acc[code] = char;
  return acc;
}, {});

const EXTRACTION_REGEX = {
  ips: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  emails: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  urls: /https?:\/\/[^\s"<>]+/g,
};

function toBase64(input) {
  const encoder = new TextEncoder();
  return btoa(String.fromCharCode(...encoder.encode(input)));
}

function fromBase64(input) {
  try {
    const binary = atob(input);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (error) {
    throw new Error('Invalid base64 input');
  }
}

function toHex(input) {
  return Array.from(new TextEncoder().encode(input))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(input) {
  if (!/^[0-9a-fA-F]+$/.test(input) || input.length % 2 !== 0) {
    throw new Error('Invalid hex input');
  }
  const bytes = new Uint8Array(input.length / 2);
  for (let i = 0; i < input.length; i += 2) {
    bytes[i / 2] = parseInt(input.slice(i, i + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

function urlDecode(input) {
  try {
    return decodeURIComponent(input);
  } catch (error) {
    throw new Error('Invalid URL encoded input');
  }
}

async function hashString(input, algorithm) {
  const data = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest(algorithm, data);
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function rot13(input) {
  return input.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function rot47(input) {
  return input.replace(/[!-~]/g, (char) => {
    const code = char.charCodeAt(0);
    return String.fromCharCode(33 + ((code - 33 + 47) % 94));
  });
}

function atbash(input) {
  return input.replace(/[a-zA-Z]/g, (char) => {
    if (char <= 'Z') {
      return String.fromCharCode(90 - (char.charCodeAt(0) - 65));
    }
    return String.fromCharCode(122 - (char.charCodeAt(0) - 97));
  });
}

function caesar(input, shift = 13) {
  const normalized = ((shift % 26) + 26) % 26;
  return input.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + normalized) % 26) + base);
  });
}

function vigenere(input, key = '') {
  if (!key) {
    throw new Error('Vigenère cipher requires a key');
  }
  let idx = 0;
  const upperKey = key.toUpperCase();
  return input.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    const shift = upperKey.charCodeAt(idx % upperKey.length) - 65;
    idx += 1;
    return String.fromCharCode(((char.charCodeAt(0) - base + shift + 26) % 26) + base);
  });
}

function reverseString(input) {
  return [...input].reverse().join('');
}

function capitalizeWords(input) {
  return input.replace(/\b\w/g, (char) => char.toUpperCase());
}

function removeWhitespace(input) {
  return input.replace(/\s+/g, '');
}

function addLineBreaks(input, width = 64) {
  return input.match(new RegExp(`.{1,${width}}`, 'g'))?.join('\n') ?? input;
}

function encodeMorse(input) {
  return input
    .toUpperCase()
    .split('')
    .map((char) => MORSE[char] ?? '')
    .filter(Boolean)
    .join(' ');
}

function decodeMorse(input) {
  return input
    .trim()
    .split(/\s+/)
    .map((code) => REVERSE_MORSE[code] ?? '')
    .join('');
}

function timestampToDate(input) {
  const value = Number.parseInt(input, 10);
  if (!Number.isFinite(value)) {
    throw new Error('Invalid timestamp');
  }
  const milliseconds = value < 1e12 ? value * 1000 : value;
  return new Date(milliseconds).toISOString();
}

function dateToTimestamp(input) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date input');
  }
  return Math.floor(date.getTime() / 1000).toString();
}

function extractWithRegex(input, regex) {
  return Array.from(new Set(input.match(regex) ?? [])).join('\n');
}

function jsonBeautify(input) {
  return JSON.stringify(JSON.parse(input), null, 2);
}

function jsonMinify(input) {
  return JSON.stringify(JSON.parse(input));
}

const OPERATIONS = {
  base64encode: (input) => toBase64(input),
  base64decode: (input) => fromBase64(input),
  urlencode: (input) => encodeURIComponent(input),
  urldecode: (input) => urlDecode(input),
  hexencode: (input) => toHex(input),
  hexdecode: (input) => fromHex(input),
  rot13: (input) => rot13(input),
  rot47: (input) => rot47(input),
  atbash: (input) => atbash(input),
  reverse: (input) => reverseString(input),
  uppercase: (input) => input.toUpperCase(),
  lowercase: (input) => input.toLowerCase(),
  capitalize: (input) => capitalizeWords(input),
  'capitalize-words': (input) => capitalizeWords(input),
  removewhitespace: (input) => removeWhitespace(input),
  addlinebreaks: (input, options) => addLineBreaks(input, options?.width ?? 64),
  jsonbeautify: (input) => jsonBeautify(input),
  jsonminify: (input) => jsonMinify(input),
  extractips: (input) => extractWithRegex(input, EXTRACTION_REGEX.ips),
  extractemails: (input) => extractWithRegex(input, EXTRACTION_REGEX.emails),
  extracturls: (input) => extractWithRegex(input, EXTRACTION_REGEX.urls),
  timestamptodate: (input) => timestampToDate(input),
  datetotimestamp: (input) => dateToTimestamp(input),
  morse: (input) => encodeMorse(input),
  frommorse: (input) => decodeMorse(input),
  caesar: (input, options) => caesar(input, options?.shift ?? 13),
  vigenere: (input, options) => vigenere(input, options?.key ?? ''),
};

const ASYNC_OPERATIONS = {
  sha1: (input) => hashString(input, 'SHA-1'),
  sha256: (input) => hashString(input, 'SHA-256'),
  sha512: (input) => hashString(input, 'SHA-512'),
};

function executeOperation(op, input, options) {
  if (!OPERATIONS[op]) {
    throw new Error(`Unsupported operation: ${op}`);
  }
  return { operation: op, result: OPERATIONS[op](input, options) };
}

async function executeAsyncOperation(op, input) {
  if (!ASYNC_OPERATIONS[op]) {
    throw new Error(`Unsupported operation: ${op}`);
  }
  const result = await ASYNC_OPERATIONS[op](input);
  return { operation: op, result };
}

function printableRatio(text) {
  if (!text) return 0;
  const nonPrintable = text.replace(/[ -~]/g, '').length;
  return 1 - nonPrintable / text.length;
}

function isLikelyBase64(value) {
  if (!value || value.length < 8) return false;
  if (value.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]+=*$/.test(value);
}

function isLikelyHex(value) {
  return /^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0 && value.length >= 8;
}

function isLikelyUrlEncoded(value) {
  return /%[0-9a-fA-F]{2}/.test(value);
}

function isLikelyTimestamp(value) {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return false;
  return trimmed.length === 10 || trimmed.length === 13;
}

function detectHashType(value) {
  const trimmed = value.trim();
  if (!/^[0-9a-fA-F]+$/.test(trimmed)) return null;
  if (trimmed.length === 32) return 'MD5 (128-bit)';
  if (trimmed.length === 40) return 'SHA-1 (160-bit)';
  if (trimmed.length === 64) return 'SHA-256 (256-bit)';
  if (trimmed.length === 96) return 'SHA-384 (384-bit)';
  if (trimmed.length === 128) return 'SHA-512 (512-bit)';
  return null;
}

function createAutoResponse(operation, result, detection) {
  return {
    operation,
    result,
    metadata: detection,
  };
}

async function autoDetectOperation(input) {
  const trimmed = input.trim();

  // JSON
  try {
    const pretty = jsonBeautify(trimmed);
    return createAutoResponse('jsonbeautify', pretty, {
      detection: 'JSON payload',
      confidence: 0.9,
      note: 'Auto-prettified JSON structure.',
    });
  } catch (error) {
    // ignore
  }

  // Base64
  if (isLikelyBase64(trimmed)) {
    try {
      const decoded = fromBase64(trimmed);
      if (printableRatio(decoded) > 0.6) {
        return createAutoResponse('base64decode', decoded, {
          detection: 'Base64 encoded data',
          confidence: 0.85,
          note: 'Decoded from Base64.',
        });
      }
    } catch (error) {
      // ignore
    }
  }

  // Hex
  if (isLikelyHex(trimmed)) {
    try {
      const decoded = fromHex(trimmed);
      if (printableRatio(decoded) > 0.6) {
        return createAutoResponse('hexdecode', decoded, {
          detection: 'Hexadecimal data',
          confidence: 0.8,
          note: 'Converted from hexadecimal bytes.',
        });
      }
    } catch (error) {
      // ignore
    }
  }

  // URL encoded
  if (isLikelyUrlEncoded(trimmed)) {
    try {
      const decoded = urlDecode(trimmed);
      return createAutoResponse('urldecode', decoded, {
        detection: 'URL encoded string',
        confidence: 0.75,
        note: 'Percent-encoding removed.',
      });
    } catch (error) {
      // ignore
    }
  }

  // Timestamp
  if (isLikelyTimestamp(trimmed)) {
    try {
      const iso = timestampToDate(trimmed);
      return createAutoResponse('timestamptodate', iso, {
        detection: 'Unix timestamp',
        confidence: 0.7,
        note: 'Converted to ISO8601.',
      });
    } catch (error) {
      // ignore
    }
  }

  // Hash detection
  const hashType = detectHashType(trimmed);
  if (hashType) {
    return createAutoResponse('hash-detect', input, {
      detection: hashType,
      confidence: 0.75,
      note: 'Cryptographic hashes are irreversible. Store or compare instead.',
    });
  }

  return createAutoResponse('auto', input, {
    detection: 'No automatic match',
    confidence: 0.2,
    note: 'Select a manual operation to continue.',
  });
}

export async function applyOperation(input, operation, options = {}) {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  const op = operation.toLowerCase();

  if (op === 'md5') {
    throw new Error('MD5 hashing is intentionally unavailable for security reasons');
  }

  if (op === 'auto') {
    return autoDetectOperation(input);
  }

  if (ASYNC_OPERATIONS[op]) {
    return executeAsyncOperation(op, input);
  }

  return executeOperation(op, input, options);
}

export function supportedOperations() {
  return ['auto']
    .concat(Object.keys(OPERATIONS))
    .concat(Object.keys(ASYNC_OPERATIONS))
    .sort();
}
