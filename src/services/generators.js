/**
 * Password and identity generators
 * All generators use cryptographically secure randomness
 */

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?/~`',
};

const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
const VOWELS = 'aeiou';

const RANDOM_TLDS = ['com', 'net', 'org', 'io', 'dev', 'app', 'tech', 'security'];

function secureRandomInt(max) {
  if (!Number.isInteger(max) || max <= 0) {
    throw new Error('secureRandomInt requires a positive integer maximum');
  }

  const range = 0x100000000;
  const limit = Math.floor(range / max) * max;
  const buffer = new Uint32Array(1);

  while (true) {
    crypto.getRandomValues(buffer);
    if (buffer[0] < limit) {
      return buffer[0] % max;
    }
  }
}

function randomFromString(characters) {
  return characters[secureRandomInt(characters.length)];
}

function buildCharacterPool(options) {
  const selections = Object.entries(options)
    .filter(([, include]) => include)
    .map(([key]) => CHARSETS[key])
    .filter(Boolean);

  if (!selections.length) {
    throw new Error('Select at least one character type');
  }

  return selections;
}

export function generatePassword({
  length = 24,
  uppercase = true,
  lowercase = true,
  numbers = true,
  symbols = true,
} = {}) {
  const size = Number.isFinite(length) ? Math.max(12, Math.min(128, Math.floor(length))) : 24;
  const pools = buildCharacterPool({ uppercase, lowercase, numbers, symbols });
  const usableChars = pools.join('');

  const output = [];
  // guarantee at least one char from each selected pool
  for (const pool of pools) {
    output.push(randomFromString(pool));
  }

  while (output.length < size) {
    output.push(randomFromString(usableChars));
  }

  // Fisher–Yates shuffle using secure randomness
  for (let i = output.length - 1; i > 0; i -= 1) {
    const j = secureRandomInt(i + 1);
    [output[i], output[j]] = [output[j], output[i]];
  }

  return output.join('');
}

export function scorePassword(password) {
  const lengthScore = Math.min(4, Math.floor(password.length / 4));
  const variety = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const score = Math.min(4, lengthScore + variety);
  const labels = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'];

  return {
    score,
    label: labels[score],
    percentage: (score / 4) * 100,
  };
}

function randomSyllable() {
  const pattern = secureRandomInt(3);
  if (pattern === 0) {
    return (
      CONSONANTS[secureRandomInt(CONSONANTS.length)] +
      VOWELS[secureRandomInt(VOWELS.length)] +
      CONSONANTS[secureRandomInt(CONSONANTS.length)]
    );
  }
  if (pattern === 1) {
    return (
      CONSONANTS[secureRandomInt(CONSONANTS.length)] +
      VOWELS[secureRandomInt(VOWELS.length)]
    );
  }
  return (
    VOWELS[secureRandomInt(VOWELS.length)] +
    CONSONANTS[secureRandomInt(CONSONANTS.length)]
  );
}

function randomWord({ minSyllables = 2, maxSyllables = 3 } = {}) {
  const syllables = minSyllables + secureRandomInt(maxSyllables - minSyllables + 1);
  let word = '';
  for (let i = 0; i < syllables; i += 1) {
    word += randomSyllable();
  }
  return word.toLowerCase();
}

export function generateUsername({ length = 12, includeNumbers = true, style = 'readable' } = {}) {
  const target = Math.max(6, Math.min(32, Math.floor(length)));

  if (style === 'readable') {
    let username = `${randomWord({ minSyllables: 2, maxSyllables: 3 })}${randomWord({
      minSyllables: 1,
      maxSyllables: 2,
    })}`;
    if (includeNumbers) {
      while (username.length < target) {
        username += secureRandomInt(10).toString();
      }
    }
    return username.slice(0, target);
  }

  if (style === 'color') {
    const color = secureRandomInt(0xffffff)
      .toString(16)
      .padStart(6, '0');
    let name = color;
    const charPool = CHARSETS.lowercase + (includeNumbers ? CHARSETS.numbers : '');
    while (name.length < target) {
      name += randomFromString(charPool);
    }
    return name.slice(0, target).toLowerCase();
  }

  // default: secure random string starting with letter
  const pool = CHARSETS.lowercase + (includeNumbers ? CHARSETS.numbers : '');
  let username = randomFromString(CHARSETS.lowercase);
  while (username.length < target) {
    username += randomFromString(pool);
  }
  return username;
}

export function generatePassphrase({
  wordCount = 4,
  separator = '-',
  capitalize = true,
  includeNumbers = false,
} = {}) {
  const count = Math.max(3, Math.min(8, Math.floor(wordCount)));
  const words = Array.from({ length: count }, () => randomWord({ minSyllables: 2, maxSyllables: 3 }));

  const processed = words.map((word) => {
    const base = capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    if (!includeNumbers) {
      return base;
    }
    const suffix = secureRandomInt(100).toString().padStart(2, '0');
    return `${base}${suffix}`;
  });

  return processed.join(separator);
}

export function generateCatchAllEmail({
  prefix,
  domain,
  prefixLength = 12,
  style = 'random',
} = {}) {
  const localLength = Math.max(6, Math.min(20, Math.floor(prefixLength)));

  let localPart = prefix?.toLowerCase();
  if (!localPart) {
    if (style === 'syllable') {
      localPart = randomWord({ minSyllables: 2, maxSyllables: 3 });
    } else {
      const pool = CHARSETS.lowercase + CHARSETS.numbers;
      localPart = randomFromString(CHARSETS.lowercase);
      while (localPart.length < localLength) {
        localPart += randomFromString(pool);
      }
    }
    localPart = localPart.slice(0, localLength);
  }

  const chosenDomain = domain?.toLowerCase() || `${randomWord({ minSyllables: 2, maxSyllables: 2 })}.${
    RANDOM_TLDS[secureRandomInt(RANDOM_TLDS.length)]
  }`;

  return `${localPart}@${chosenDomain}`;
}

export function generatePlusAddress({ baseEmail, tagLength = 6 } = {}) {
  if (typeof baseEmail !== 'string' || !baseEmail.includes('@')) {
    throw new Error('A valid base email address is required');
  }

  const [localPart, domain] = baseEmail.split('@');
  const length = Math.max(2, Math.min(16, Math.floor(tagLength)));
  const pool = CHARSETS.lowercase + CHARSETS.numbers;

  let tag = '';
  for (let i = 0; i < length; i += 1) {
    tag += randomFromString(pool);
  }

  return `${localPart}+${tag}@${domain}`;
}

export function passwordMetadata(password) {
  const strength = scorePassword(password);
  return {
    length: password.length,
    strength,
    generatedAt: new Date().toISOString(),
  };
}
