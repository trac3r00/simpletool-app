// The route inlines this factory into its client script with fn.toString(), so it
// must stay self-contained. `randomInt(n)` must return a uniform integer in
// [0, n): the page passes a rejection-sampled crypto.getRandomValues source,
// tests pass a seeded one.
export function createPasswordLogic(randomInt) {
  const LOWER = "abcdefghijklmnopqrstuvwxyz";
  const DIGITS = "0123456789";
  const CONSONANTS = "bcdfghjklmnpqrstvwxyz";
  const VOWELS = "aeiou";

  function pick(chars) {
    return chars[randomInt(chars.length)];
  }

  function generatePassword(length, charsets) {
    const sets = charsets.filter(function (s) { return s && s.length; });
    if (!sets.length) throw new Error("NO_CHARSET");
    if (length < sets.length) throw new Error("TOO_SHORT");
    const all = sets.join("");
    const chars = sets.map(pick);
    while (chars.length < length) chars.push(pick(all));
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      const tmp = chars[i]; chars[i] = chars[j]; chars[j] = tmp;
    }
    return chars.join("");
  }

  function randomSyllable() {
    const pattern = randomInt(3);
    if (pattern === 0) return pick(CONSONANTS) + pick(VOWELS) + pick(CONSONANTS);
    if (pattern === 1) return pick(CONSONANTS) + pick(VOWELS);
    return pick(VOWELS) + pick(CONSONANTS);
  }

  function randomWord(minSyllables, maxSyllables) {
    const count = minSyllables + randomInt(maxSyllables - minSyllables + 1);
    let word = "";
    for (let i = 0; i < count; i++) word += randomSyllable();
    return word;
  }

  function generateUsername(length, style, includeNumbers) {
    const target = Math.max(6, Math.min(32, length));
    if (style === "readable") {
      const digitCount = includeNumbers ? 2 : 0;
      let name = "";
      while (name.length < target - digitCount) name += randomWord(1, 3);
      name = name.slice(0, target - digitCount);
      for (let i = 0; i < digitCount; i++) name += pick(DIGITS);
      return name;
    }
    const pool = LOWER + (includeNumbers ? DIGITS : "");
    let name;
    if (style === "color") {
      const hex = includeNumbers ? "0123456789abcdef" : "abcdef";
      name = "";
      for (let i = 0; i < 6; i++) name += pick(hex);
    } else {
      name = pick(LOWER);
    }
    while (name.length < target) name += pick(pool);
    return name.slice(0, target);
  }

  function generatePassphrase(wordCount, separator, capitalize, includeNumbers) {
    const count = Math.max(3, Math.min(8, wordCount));
    const words = [];
    for (let i = 0; i < count; i++) {
      let word = randomWord(2, 3);
      if (capitalize) word = word.charAt(0).toUpperCase() + word.slice(1);
      if (includeNumbers) word += pick(DIGITS) + pick(DIGITS);
      words.push(word);
    }
    return words.join(separator);
  }

  // RFC 5321/5322 dot-atom local part (no quoted strings) and an LDH or
  // internationalised host name with at least two labels.
  function isValidLocalPart(local) {
    return local.length > 0 && local.length <= 64 &&
      /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/.test(local);
  }

  function isValidDomain(domain) {
    if (!domain || domain.length > 253) return false;
    const labels = domain.split(".");
    if (labels.length < 2) return false;
    return labels.every(function (label) {
      return /^[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?$/u.test(label);
    });
  }

  function generateCatchAllEmail(prefix, domain, prefixLength, style) {
    const localLength = Math.max(6, Math.min(20, prefixLength));
    let local = String(prefix || "").trim().toLowerCase();
    if (local && !isValidLocalPart(local)) throw new Error("BAD_PREFIX");
    if (!local) {
      if (style === "syllable") {
        while (local.length < localLength) local += randomWord(1, 3);
      } else {
        local = pick(LOWER);
        while (local.length < localLength) local += pick(LOWER + DIGITS);
      }
      local = local.slice(0, localLength);
    }
    let host = String(domain || "").trim().toLowerCase().replace(/^@/, "");
    if (host && !isValidDomain(host)) throw new Error("BAD_DOMAIN");
    if (!host) host = randomWord(2, 2) + "." + ["com", "net", "org", "io", "dev", "app", "tech"][randomInt(7)];
    return local + "@" + host;
  }

  function generatePlusAddress(baseEmail, tagLength) {
    const email = String(baseEmail || "").trim();
    const at = email.lastIndexOf("@");
    const local = at > 0 ? email.slice(0, at) : "";
    const domain = at > 0 ? email.slice(at + 1) : "";
    if (!isValidLocalPart(local) || !isValidDomain(domain)) throw new Error("BAD_EMAIL");
    const length = Math.max(2, Math.min(16, tagLength));
    let tag = "";
    for (let i = 0; i < length; i++) tag += pick(LOWER + DIGITS);
    return local + "+" + tag + "@" + domain;
  }

  return {
    generatePassword: generatePassword,
    generateUsername: generateUsername,
    generatePassphrase: generatePassphrase,
    generateCatchAllEmail: generateCatchAllEmail,
    generatePlusAddress: generatePlusAddress,
    isValidLocalPart: isValidLocalPart,
    isValidDomain: isValidDomain,
  };
}
