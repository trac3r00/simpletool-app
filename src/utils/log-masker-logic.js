/**
 * Log Masker redaction engine. Self-contained so the route can inline it with
 * `createLogMasker.toString()`; the browser runs the code the tests exercise.
 */
export function createLogMasker() {
  function luhnValid(digits) {
    let sum = 0;
    let double = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = digits.charCodeAt(i) - 48;
      if (double) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      double = !double;
    }
    return sum % 10 === 0;
  }

  function validIPv4(ip) {
    return ip.split('.').every((p) => Number(p) <= 255 && (p === '0' || p[0] !== '0'));
  }

  const PATTERNS = {
    // Unicode-aware local part; lookbehind stands in for \b, which is ASCII-only.
    email: {
      re: /(?<![\p{L}\p{N}._%+-])[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)*\.\p{L}{2,}(?![\p{L}\p{N}])/gu,
      replacement: '[EMAIL_REDACTED]',
    },
    ipv4: {
      re: /(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?![\w.])/g,
      replacement: '[IP_REDACTED]',
      accept: validIPv4,
    },
    // Full 8-group form, or a "::"-compressed form with 2+ hex groups, so
    // clock times (10:00:00) and C++ scopes (std::move) are not touched.
    ipv6: {
      re: /(?<![\w:])(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}(?![\w:])|(?<![\w:])(?:[0-9A-Fa-f]{1,4}:){1,6}:(?:[0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{0,4}(?![\w:])/g,
      replacement: '[IP_REDACTED]',
      accept: (m) => m.split(':').filter(Boolean).length >= 2,
    },
    // 13-19 digits, optional space/dash separators, Luhn-checked so order ids
    // and timestamps are not masked as cards.
    creditCard: {
      re: /(?<![\d-])\d(?:[ -]?\d){12,18}(?![\d-])/g,
      replacement: '[CARD_REDACTED]',
      accept: (m) => luhnValid(m.replace(/[ -]/g, '')),
    },
    ssn: {
      re: /(?<![\d-])\d{3}-\d{2}-\d{4}(?![\d-])/g,
      replacement: '[SSN_REDACTED]',
    },
    // Requires separators or a +country prefix: bare 10-digit runs are far
    // more often epoch seconds or durations in logs than phone numbers.
    phone: {
      re: /(?<![\w+])(?:\+\d{1,3}[ .-]?)?(?:\(\d{3}\)[ .-]?|\d{3}[ .-])\d{3}[ .-]\d{4}(?!\w)|(?<![\w+])\+\d{8,15}(?!\w)/g,
      replacement: '[PHONE_REDACTED]',
    },
  };

  const ORDER = ['email', 'ipv6', 'ipv4', 'creditCard', 'ssn', 'phone'];
  const OPTION_FOR = { email: 'email', ipv4: 'ip', ipv6: 'ip', creditCard: 'creditCard', ssn: 'ssn', phone: 'phone' };

  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // A keyword followed by an assignment keeps the key and masks the value
  // (api_key=abc -> api_key=[REDACTED]); a bare keyword is masked itself.
  function maskKeywords(text, keywords) {
    let out = text;
    for (const kw of keywords) {
      const re = new RegExp(
        '(' + escapeRe(kw) + ')(?:(["\']?\\s*[:=]\\s*)("[^"]*"|\'[^\']*\'|[^\\s,;&]+))?',
        'gi',
      );
      out = out.replace(re, (m, key, sep, value) => {
        if (sep === undefined) return '[REDACTED]';
        const q = value[0] === '"' || value[0] === "'" ? value[0] : '';
        return key + sep + q + '[REDACTED]' + q;
      });
    }
    return out;
  }

  function redact(text, options) {
    const opts = options || {};
    let out = String(text || '');
    for (const name of ORDER) {
      if (opts[OPTION_FOR[name]] === false) continue;
      const p = PATTERNS[name];
      out = out.replace(p.re, (m) => (p.accept && !p.accept(m) ? m : p.replacement));
    }
    const keywords = (opts.keywords || []).map((k) => String(k).trim()).filter(Boolean);
    return keywords.length ? maskKeywords(out, keywords) : out;
  }

  return { redact, luhnValid };
}
