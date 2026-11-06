/**
 * Email Security Analyzer parsing helpers. Self-contained so the route can
 * inline it with `createEmailEngine.toString()`.
 */
export function createEmailEngine() {
  function normalizeNewlines(text) {
    return String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  function parseEmail(raw) {
    const lines = normalizeNewlines(raw).split('\n');
    const headerLines = [];
    let current = '';
    let i = 0;
    for (; i < lines.length; i++) {
      const line = lines[i];
      if (line === '') { i++; break; }
      if (/^[ \t]/.test(line) && current) {
        current += ' ' + line.trim();
      } else {
        if (current) headerLines.push(current);
        current = line;
      }
    }
    if (current) headerLines.push(current);

    const headers = new Map();
    for (const hl of headerLines) {
      const idx = hl.indexOf(':');
      if (idx <= 0) continue;
      const name = hl.slice(0, idx).trim().toLowerCase();
      if (!/^[!-9;-~]+$/.test(name)) continue;
      const arr = headers.get(name) || [];
      arr.push(hl.slice(idx + 1).trim());
      headers.set(name, arr);
    }
    return { headers, body: lines.slice(i).join('\n') };
  }

  function bytesToText(bytes, charset) {
    try {
      return new TextDecoder(charset || 'utf-8').decode(bytes);
    } catch (e) {
      return new TextDecoder('utf-8').decode(bytes);
    }
  }

  function base64ToBytes(b64) {
    const clean = String(b64).replace(/[^A-Za-z0-9+/=]/g, '');
    try {
      const bin = atob(clean);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    } catch (e) {
      return new Uint8Array(0);
    }
  }

  // Quoted-printable (RFC 2045 §6.7): "=\n" is a soft line break, "=XX" a byte.
  function qpToBytes(s) {
    const src = String(s).replace(/=[ \t]*\n/g, '');
    const out = [];
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (c === '=' && /^[0-9A-Fa-f]{2}$/.test(src.slice(i + 1, i + 3))) {
        out.push(parseInt(src.slice(i + 1, i + 3), 16));
        i += 2;
      } else {
        const code = c.charCodeAt(0);
        if (code < 128) out.push(code);
        else for (const b of new TextEncoder().encode(c)) out.push(b);
      }
    }
    return new Uint8Array(out);
  }

  // RFC 2047 encoded-words: =?charset?B|Q?text?=; whitespace between two
  // adjacent encoded-words is dropped.
  function decodeEncodedWords(value) {
    return String(value || '')
      .replace(/(=\?[^?\s]+\?[BbQq]\?[^?\s]*\?=)\s+(?==\?)/g, '$1')
      .replace(/=\?([^?\s]+)\?([BbQq])\?([^?\s]*)\?=/g, (m, charset, enc, text) => {
        const bytes = enc.toUpperCase() === 'B'
          ? base64ToBytes(text)
          : qpToBytes(text.replace(/_/g, ' '));
        return bytesToText(bytes, charset.split('*')[0]);
      });
  }

  function headerParam(value, name) {
    const m = new RegExp('(?:^|;)\\s*' + name + '\\s*=\\s*(?:"([^"]*)"|([^;\\s]+))', 'i').exec(String(value || ''));
    return m ? (m[1] !== undefined ? m[1] : m[2]) : '';
  }

  function decodePart(headers, body) {
    const first = (n) => (headers.get(n) || [''])[0];
    const type = first('content-type').toLowerCase();
    const cte = first('content-transfer-encoding').trim().toLowerCase();
    if (type.startsWith('multipart/')) {
      const boundary = headerParam(first('content-type'), 'boundary');
      if (!boundary) return body;
      const delim = '--' + boundary;
      return body.split('\n')
        .reduce((parts, line) => {
          if (line.startsWith(delim)) parts.push([]);
          else if (parts.length) parts[parts.length - 1].push(line);
          return parts;
        }, [])
        .map((partLines) => {
          const part = parseEmail(partLines.join('\n'));
          return decodePart(part.headers, part.body);
        })
        .join('\n');
    }
    if (type && !type.startsWith('text/') && !type.startsWith('message/')) return '';
    const charset = headerParam(first('content-type'), 'charset');
    if (cte === 'base64') return bytesToText(base64ToBytes(body), charset);
    if (cte === 'quoted-printable') return bytesToText(qpToBytes(body), charset);
    return body;
  }

  function decodedBody(parsed) {
    return decodePart(parsed.headers, parsed.body);
  }

  // The real address is the angle-addr when present; a display name such as
  // "service@paypal.com" <attacker@evil.biz> must not be read as the sender.
  function addressOf(value) {
    const v = decodeEncodedWords(value);
    const angle = /<([^<>@\s]+@[^<>\s]+)>/.exec(v);
    if (angle) return angle[1].trim();
    const bare = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.exec(v);
    return bare ? bare[0] : '';
  }

  function domainOf(value) {
    const addr = addressOf(value);
    const at = addr.lastIndexOf('@');
    return at >= 0 ? addr.slice(at + 1).toLowerCase().replace(/\.$/, '') : '';
  }

  function displayName(value) {
    const v = decodeEncodedWords(value);
    const lt = v.indexOf('<');
    return lt > 0 ? v.slice(0, lt).trim().replace(/^"|"$/g, '') : '';
  }

  // Relaxed (DMARC-style) alignment approximation: same domain, or one is a
  // subdomain of the other. Avoids flagging bounce.example.com vs example.com.
  function domainsAligned(a, b) {
    if (!a || !b) return true;
    return a === b || a.endsWith('.' + b) || b.endsWith('.' + a);
  }

  function decodeEntities(s) {
    return s.replace(/&(amp|lt|gt|quot|#39|#x27);/g, (m, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", '#x27': "'" })[e]);
  }

  function extractUrls(text) {
    const out = [];
    const re = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;
    let m;
    while ((m = re.exec(String(text || ''))) !== null) {
      let url = decodeEntities(m[0]);
      // Trailing sentence punctuation and an unbalanced ")" belong to the
      // surrounding prose, not the URL.
      for (;;) {
        const last = url.slice(-1);
        if (/[.,;:!?\]}>]/.test(last)) { url = url.slice(0, -1); continue; }
        if (last === ')' && (url.match(/\(/g) || []).length < (url.match(/\)/g) || []).length) { url = url.slice(0, -1); continue; }
        break;
      }
      if (/^www\./i.test(url)) url = 'http://' + url;
      out.push(url);
    }
    return Array.from(new Set(out));
  }

  function scoreUrl(u) {
    const flags = [];
    let hostname = '';
    try {
      const url = new URL(u);
      hostname = url.hostname || '';
      if (hostname.split('.').some((label) => label.startsWith('xn--'))) flags.push('punycode');
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.startsWith('[')) flags.push('ip_host');
      if (url.username || url.password) flags.push('userinfo');
      if (url.protocol !== 'https:') flags.push('non_https');
    } catch (e) {
      flags.push('invalid');
    }
    return { flags, hostname };
  }

  return { parseEmail, decodeEncodedWords, decodedBody, addressOf, domainOf, displayName, domainsAligned, extractUrls, scoreUrl };
}
