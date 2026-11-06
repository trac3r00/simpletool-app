/**
 * Env Var Manager parsing, diffing and masking. Self-contained so the route can
 * inline it with `createEnvVarEngine.toString()`.
 */
export function createEnvVarEngine() {
  function normalizeNewlines(s) {
    return String(s || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  // Name-based: SECRET/TOKEN/PASSWORD-style words, plus KEY/AUTH/SALT as a
  // whole underscore-delimited segment (MASTER_KEY, AUTH_HEADER) so words
  // like KEYBOARD or MONKEY are not caught.
  function looksSensitiveKey(key) {
    const k = String(key || '');
    return /(SECRET|TOKEN|PASSWORD|PASSWD|PASS|PWD|PRIVATE|CREDENTIAL|BEARER|SESSION|COOKIE|DSN|SIGNATURE|API[_-]?KEY)/i.test(k)
      || /(^|_)(KEY|AUTH|SALT|CERT)(_|$)/i.test(k);
  }

  function urlPasswordParts(value) {
    return /^([a-z][a-z0-9+.-]*:\/\/[^\s:\/@]*:)([^\s@\/]+)(@.*)$/i.exec(String(value || ''));
  }

  function looksSensitiveValue(value) {
    const v = String(value || '');
    if (!v) return false;
    if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(v)) return true;
    if (v.length >= 24 && /^[A-Za-z0-9_+/=-]+$/.test(v)) return true;
    if (/-----BEGIN [A-Z ]+PRIVATE KEY-----/.test(v)) return true;
    if (urlPasswordParts(v)) return true;
    return false;
  }

  function maskSecret(v) {
    if (v.length <= 6) return '[REDACTED]';
    return v.slice(0, 2) + '…' + v.slice(-2) + ' (' + v.length + ')';
  }

  // Connection strings keep scheme/user/host so the diff stays useful;
  // only the password is masked.
  function maskValue(value) {
    const v = String(value ?? '');
    if (!v) return '';
    const url = urlPasswordParts(v);
    if (url) return url[1] + '****' + url[3];
    return maskSecret(v);
  }

  function isSensitive(key, ...values) {
    return looksSensitiveKey(key) || values.some(looksSensitiveValue);
  }

  // Returns the index of the closing quote in `s` (starting after the opening
  // one), honouring backslash escapes for double quotes; -1 if unterminated.
  function closingQuote(s, quote) {
    for (let i = 1; i < s.length; i++) {
      if (quote === '"' && s[i] === '\\') { i++; continue; }
      if (s[i] === quote) return i;
    }
    return -1;
  }

  function unescapeDouble(v) {
    return v.replace(/\\(.)/g, (_, c) => (c === 'n' ? '\n' : c === 'r' ? '\r' : c === 't' ? '\t' : c));
  }

  function parseDotenv(text) {
    const lines = normalizeNewlines(text).split('\n');
    const map = new Map();
    const duplicates = [];
    const errors = [];

    for (let idx = 0; idx < lines.length; idx++) {
      const startLine = idx + 1;
      const raw = lines[idx];
      const trimmed = raw.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const line = raw.replace(/^\s*export\s+/, '');
      const eq = line.indexOf('=');
      if (eq <= 0) {
        errors.push({ line: startLine, code: 'missing_eq', v: trimmed.slice(0, 80) });
        continue;
      }
      const key = line.slice(0, eq).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(key)) {
        errors.push({ line: startLine, code: 'invalid_key', key });
        continue;
      }

      let valueRaw = line.slice(eq + 1).trim();
      let value;
      const quote = valueRaw[0];
      if (quote === '"' || quote === "'" || quote === '`') {
        // Quoted values may span lines (dotenv multiline): keep consuming
        // lines until the closing quote appears.
        let buf = valueRaw;
        let end = closingQuote(buf, quote);
        while (end < 0 && idx + 1 < lines.length) {
          idx++;
          buf += '\n' + lines[idx];
          end = closingQuote(buf, quote);
        }
        if (end < 0) {
          errors.push({ line: startLine, code: 'unterminated', key });
          end = buf.length;
        }
        const inner = buf.slice(1, end);
        value = quote === '"' ? unescapeDouble(inner) : inner;
        valueRaw = buf.slice(0, end + 1);
      } else {
        const hash = valueRaw.search(/(^|\s)#/);
        if (hash >= 0) valueRaw = valueRaw.slice(0, hash).trimEnd();
        value = valueRaw;
      }

      if (map.has(key)) duplicates.push({ line: startLine, key });
      map.set(key, { key, value, raw: valueRaw, line: startLine });
    }
    return { map, duplicates, errors };
  }

  function diffEnvs(a, b) {
    const keys = new Set([...a.map.keys(), ...b.map.keys()]);
    return Array.from(keys).sort().map((key) => {
      const av = a.map.has(key) ? a.map.get(key).value : null;
      const bv = b.map.has(key) ? b.map.get(key).value : null;
      let status = 'same';
      if (av === null) status = 'onlyB';
      else if (bv === null) status = 'onlyA';
      else if (av !== bv) status = 'changed';
      return { key, av, bv, status };
    });
  }

  // Comma-separated, case-insensitive substring filter ("AWS_, SECRET").
  function keyMatchesFilter(key, filter) {
    const terms = String(filter || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
    if (!terms.length) return true;
    const k = String(key).toLowerCase();
    return terms.some((term) => k.includes(term));
  }

  return { parseDotenv, diffEnvs, isSensitive, looksSensitiveKey, looksSensitiveValue, maskValue, keyMatchesFilter };
}
