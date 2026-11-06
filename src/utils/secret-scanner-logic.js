/**
 * Secret Scanner detection + redaction engine.
 *
 * `createSecretScanner` is self-contained (no module-scope references) so the
 * route can inline it into the page with `createSecretScanner.toString()` —
 * the browser runs exactly the code these tests exercise.
 *
 * Patterns are ORDERED specific → generic. Both scanning and redaction walk
 * them in this order, and a match that overlaps an earlier (more specific)
 * match is dropped, so one secret produces one finding with the most precise
 * label (e.g. "GitHub token", not "Secret assignment" plus "GitHub token").
 */
export function createSecretScanner() {
  const PATTERNS = [
    {
      id: 'private_key',
      labelKey: 'text0',
      label: 'Private key block',
      severity: 'high',
      re: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z0-9 ]*PRIVATE KEY-----|$)/g,
      adviceKey: 'text1',
      advice: 'Revoke/rotate the key. Treat as compromised.',
    },
    {
      id: 'aws_access_key_id',
      labelKey: 'text2',
      label: 'AWS Access Key ID',
      severity: 'high',
      re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g,
      adviceKey: 'text3',
      advice: 'Rotate AWS keys and investigate CloudTrail usage.',
    },
    {
      // Context-anchored: a bare 40-char base64 string is far too common to
      // flag on its own, so require the AWS key name beside it.
      id: 'aws_secret_access_key',
      label: 'AWS Secret Access Key',
      severity: 'high',
      re: /\b(AWS_?SECRET_?ACCESS_?KEY|aws_secret_access_key)(\s*[:=]\s*)(['"]?)([A-Za-z0-9\/+=]{40})\3/g,
      redactGroup: 4,
      advice: 'Rotate this key immediately in IAM. A secret access key grants full API access.',
    },
    {
      id: 'github_pat',
      labelKey: 'text4',
      label: 'GitHub token',
      severity: 'high',
      // ghp_ (classic PAT), gho_ (OAuth), ghu_/ghs_ (app user/server), ghr_ (refresh)
      re: /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
      adviceKey: 'text5',
      advice: 'Revoke the token in GitHub and audit access.',
    },
    {
      id: 'google_api_key',
      labelKey: 'text6',
      label: 'Google API key',
      severity: 'high',
      re: /\bAIza[0-9A-Za-z_-]{35}\b/g,
      adviceKey: 'text7',
      advice: 'Restrict/rotate the key in Google Cloud Console.',
    },
    {
      id: 'stripe_secret',
      labelKey: 'text8',
      label: 'Stripe secret key',
      severity: 'high',
      // secret (sk_) and restricted (rk_) keys, live and test mode
      re: /\b[sr]k_(?:live|test)_[0-9a-zA-Z]{20,}\b/g,
      adviceKey: 'text9',
      advice: 'Roll the key in Stripe and check recent charges/activity.',
    },
    {
      id: 'slack_token',
      labelKey: 'text10',
      label: 'Slack token',
      severity: 'high',
      re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g,
      adviceKey: 'text11',
      advice: 'Revoke the Slack token and review app scopes.',
    },
    {
      id: 'slack_webhook',
      label: 'Slack webhook URL',
      severity: 'high',
      re: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9_\/-]{20,}/g,
      advice: 'Anyone with this URL can post to the channel. Regenerate the webhook in Slack.',
    },
    {
      id: 'anthropic_key',
      label: 'Anthropic API key',
      severity: 'high',
      re: /\bsk-ant-[A-Za-z0-9_-]{20,}/g,
      advice: 'Revoke the key in the Anthropic Console and create a new one.',
    },
    {
      id: 'openai_key',
      label: 'OpenAI API key',
      severity: 'high',
      // Require a digit so long kebab-case words starting with "sk-" do not match.
      re: /\bsk-(?:proj-|svcacct-|admin-)?(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]{20,}/g,
      advice: 'Revoke the key in the OpenAI dashboard and create a new one.',
    },
    {
      id: 'npm_token',
      label: 'npm access token',
      severity: 'high',
      re: /\bnpm_[A-Za-z0-9]{36}\b/g,
      advice: 'Revoke the token with `npm token revoke` or on npmjs.com.',
    },
    {
      id: 'jwt',
      labelKey: 'text12',
      label: 'JWT-like token',
      severity: 'medium',
      re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
      adviceKey: 'text13',
      advice: 'If this is a real session token, invalidate sessions and rotate signing keys if needed.',
    },
    {
      id: 'bearer',
      labelKey: 'text14',
      label: 'Bearer token in header',
      severity: 'medium',
      re: /\bBearer\s+[A-Za-z0-9._+/=-]{16,}/g,
      adviceKey: 'text15',
      advice: 'Treat as credential. Rotate/invalidate token and audit usage.',
    },
    {
      // scheme://user:password@host — mask only the password so the
      // connection string stays reviewable.
      id: 'url_credentials',
      label: 'Password in URL',
      severity: 'medium',
      re: /\b([a-z][a-z0-9+.-]*:\/\/[^\s:\/@]+:)([^\s@\/]+)(@)/gi,
      redactGroup: 2,
      advice: 'Change this password and pass credentials separately from the connection URL.',
    },
    {
      id: 'password_assign',
      labelKey: 'text16',
      label: 'Password assignment',
      severity: 'medium',
      re: /\b(pass(word)?|pwd)\s*[:=]\s*['"][^'"]{6,}['"]/gi,
      adviceKey: 'text17',
      advice: 'Remove hardcoded passwords. Store in a secret manager or env var.',
    },
    {
      // env-file style NAME=value with no quotes, which is how secrets usually
      // leak; the quoted api_key_assign pattern below misses it.
      id: 'generic_secret_assign',
      label: 'Secret assignment (unquoted)',
      severity: 'medium',
      re: /\b([A-Za-z0-9_]*(?:SECRET|TOKEN|PASSWORD|PASSWD|APIKEY|API_KEY|PRIVATE_KEY)[A-Za-z0-9_]*)(\s*[:=]\s*)([^\s'"#\[(){};,<>]{16,})/gi,
      redactGroup: 3,
      advice: 'Move this value to a secret manager and rotate it.',
    },
    {
      id: 'api_key_assign',
      labelKey: 'text18',
      label: 'API key assignment',
      severity: 'low',
      re: /\b(api[_-]?key|token|secret)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
      adviceKey: 'text19',
      advice: 'Review if this is a real secret. Consider moving to a secret store.',
    },
  ];

  function activePatterns(includeLow) {
    return includeLow ? PATTERNS : PATTERNS.filter((p) => p.severity !== 'low');
  }

  function globalRe(p) {
    return new RegExp(p.re.source, p.re.flags.includes('g') ? p.re.flags : p.re.flags + 'g');
  }

  function overlaps(taken, start, end) {
    for (let i = 0; i < taken.length; i++) {
      if (start < taken[i][1] && taken[i][0] < end) return true;
    }
    return false;
  }

  /** Per-line scan; one finding per secret (overlapping generic matches dropped). */
  function scanText(text, includeLow, opts) {
    const maxLen = (opts && opts.maxLen) || 250000;
    const maxFindings = (opts && opts.maxFindings) || 200;
    const src = String(text || '');
    const isTruncated = src.length > maxLen;
    const lines = (isTruncated ? src.slice(0, maxLen) : src).split('\n');
    const patterns = activePatterns(includeLow);
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const taken = [];
      const lineFindings = [];
      for (const p of patterns) {
        const re = globalRe(p);
        let m;
        while ((m = re.exec(line)) !== null) {
          if (m[0] === '') { re.lastIndex++; continue; }
          const start = m.index;
          const end = start + m[0].length;
          if (overlaps(taken, start, end)) continue;
          taken.push([start, end]);
          lineFindings.push({ pattern: p, id: p.id, severity: p.severity, line: i + 1, col: start + 1, match: m[0] });
        }
      }
      lineFindings.sort((a, b) => a.col - b.col);
      for (const f of lineFindings) {
        findings.push(f);
        if (findings.length >= maxFindings) return { findings, truncated: isTruncated };
      }
    }
    return { findings, truncated: isTruncated };
  }

  /** Share-safe copy of the whole text (not limited to the scan window). */
  function redact(text, includeLow) {
    let out = String(text || '');
    for (const p of activePatterns(includeLow)) {
      out = out.replace(globalRe(p), function (m) {
        const tag = '[REDACTED:' + p.id + ']';
        if (!p.redactGroup) return tag;
        // Groups are contiguous from the start of the match, so the secret's
        // offset is the length of the groups before it.
        const groups = Array.prototype.slice.call(arguments, 1, -2);
        const value = groups[p.redactGroup - 1];
        if (!value) return tag;
        let at = 0;
        for (let g = 0; g < p.redactGroup - 1; g++) at += (groups[g] || '').length;
        return m.slice(0, at) + tag + m.slice(at + value.length);
      });
    }
    return out;
  }

  return { PATTERNS, scanText, redact };
}
