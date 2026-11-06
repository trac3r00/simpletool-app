// The route inlines this factory into its client script with fn.toString(), so it
// must stay self-contained. A factory keeps the inner names local: the worker
// bundler may rename colliding top-level names.
export function createCspLogic() {
  const KEYWORDS = [
    "self", "none", "unsafe-inline", "unsafe-eval", "strict-dynamic",
    "unsafe-hashes", "report-sample", "wasm-unsafe-eval", "unsafe-allow-redirects",
  ];

  function normalizePolicyValue(input) {
    const raw = String(input || "").replace(/\r?\n/g, " ").trim();
    const m = raw.match(/^content-security-policy(-report-only)?\s*:\s*([\s\S]*)$/i);
    return m ? m[2].trim() : raw;
  }

  function isReportOnlyHeader(input) {
    return /^\s*content-security-policy-report-only\s*:/i.test(String(input || ""));
  }

  // CSP3 §2.2.1: directive names are case-insensitive and, when a name repeats,
  // the first occurrence wins and later ones are ignored.
  function parseCsp(input) {
    const directives = {};
    const order = [];
    const duplicates = [];
    normalizePolicyValue(input).split(";").forEach(function (part) {
      const tokens = part.trim().split(/\s+/).filter(Boolean);
      if (!tokens.length) return;
      const name = tokens[0].toLowerCase();
      if (Object.prototype.hasOwnProperty.call(directives, name)) {
        duplicates.push(name);
        return;
      }
      directives[name] = tokens.slice(1).join(" ");
      order.push(name);
    });
    return { directives: directives, order: order, duplicates: duplicates };
  }

  function buildCsp(entries) {
    const parts = [];
    entries.forEach(function (entry) {
      const name = String(entry[0] || "").trim();
      const value = String(entry[1] || "").trim().replace(/\s+/g, " ");
      if (!name) return;
      parts.push(value ? name + " " + value : name);
    });
    return parts.length ? parts.join("; ") + ";" : "";
  }

  function sources(value) {
    return String(value || "").trim().split(/\s+/).filter(Boolean);
  }

  function hasNonceOrHash(list) {
    return list.some(function (s) { return /^'(nonce-|sha256-|sha384-|sha512-)/i.test(s); });
  }

  function cspWarnings(directives, options) {
    const opts = options || {};
    const out = [];
    const has = function (name) { return Object.prototype.hasOwnProperty.call(directives, name); };
    const effective = function (name) {
      if (has(name)) return { value: directives[name], from: name };
      if (has("default-src")) return { value: directives["default-src"], from: "default-src" };
      return null;
    };
    const add = function (level, key, text, params) {
      out.push({ level: level, key: key, text: text, params: params || {} });
    };

    if (!has("default-src")) add("medium", "text0", "Missing default-src. Consider setting default-src 'self' as a baseline.");

    const script = effective("script-src");
    if (!script) {
      add("medium", "text3", "Missing script-src. Many strict policies set script-src explicitly (often with nonces/hashes).");
    } else {
      const list = sources(script.value);
      const lower = list.map(function (s) { return s.toLowerCase(); });
      if (lower.indexOf("'unsafe-inline'") !== -1 && !hasNonceOrHash(list) && lower.indexOf("'strict-dynamic'") === -1) {
        add("high", "unsafeInlineFrom", "{directive} allows 'unsafe-inline' scripts (XSS risk). Prefer nonces/hashes.", { directive: script.from });
      }
      if (lower.indexOf("'unsafe-eval'") !== -1) {
        add("high", "unsafeEval", "{directive} contains 'unsafe-eval', which lets injected strings run as code via eval().", { directive: script.from });
      }
      const loose = lower.filter(function (s) { return s === "*" || s === "http:" || s === "https:" || s === "data:"; });
      if (loose.length) {
        add("high", "looseScript", "{directive} allows scripts from {sources} (very permissive). Narrow it to specific origins, nonces or hashes.", { directive: script.from, sources: loose.join(" ") });
      }
    }

    const obj = effective("object-src");
    if (!obj) add("medium", "text4", "Missing object-src. Recommended: object-src 'none'.");
    else if (obj.value.trim().toLowerCase() !== "'none'") add("low", "text5", "object-src is not 'none'. If you don't need plugins, set it to 'none'.");

    if (!has("base-uri")) add("medium", "text6", "Missing base-uri. Recommended: base-uri 'none'.");
    if (!has("frame-ancestors")) add("medium", "text7", "Missing frame-ancestors. Recommended: frame-ancestors 'none' (or allowed origins).");

    const style = effective("style-src");
    if (style && /'unsafe-inline'/i.test(style.value)) add("low", "text8", "style-src contains 'unsafe-inline'. Consider hashes/nonces if feasible.");

    Object.keys(directives).forEach(function (name) {
      const list = sources(directives[name]);
      list.forEach(function (token) {
        const bare = token.toLowerCase();
        if (KEYWORDS.indexOf(bare) !== -1 || /^(nonce|sha256|sha384|sha512)-/.test(bare)) {
          add("high", "unquotedKeyword", "{directive}: {token} must be in single quotes ('{token}'). Unquoted, the browser treats it as a host name.", { directive: name, token: token });
        }
      });
      const lower = list.map(function (s) { return s.toLowerCase(); });
      if (lower.indexOf("'none'") !== -1 && lower.length > 1) {
        add("medium", "noneWithOthers", "{directive} combines 'none' with other sources. 'none' only works alone; drop it or the other sources.", { directive: name });
      }
      if (/\{\{\s*nonce\s*\}\}/.test(directives[name])) {
        add("low", "noncePlaceholder", "{directive} still contains the {{nonce}} placeholder. Your server must replace it with a fresh random value on every response.", { directive: name });
      }
    });

    (opts.duplicates || []).forEach(function (name) {
      add("medium", "duplicateDirective", "{directive} appears more than once. Browsers use the first one and ignore the rest.", { directive: name });
    });
    (opts.withSemicolon || []).forEach(function (name) {
      add("high", "semicolonInValue", "The {directive} field contains ';', which starts a new directive in the header. Put each directive in its own field.", { directive: name });
    });

    return out;
  }

  function formatWarning(warning, template) {
    return String(template).replace(/\{(\w+)\}/g, function (m, key) {
      return Object.prototype.hasOwnProperty.call(warning.params, key) ? warning.params[key] : m;
    });
  }

  return {
    normalizePolicyValue: normalizePolicyValue,
    isReportOnlyHeader: isReportOnlyHeader,
    parseCsp: parseCsp,
    buildCsp: buildCsp,
    cspWarnings: cspWarnings,
    formatWarning: formatWarning,
  };
}

export const {
  normalizePolicyValue,
  isReportOnlyHeader,
  parseCsp,
  buildCsp,
  cspWarnings,
  formatWarning,
} = createCspLogic();
