import { chromium } from '@playwright/test';

const TOTAL_CASES = Number(process.env.DECODER_ALT_CASES || 50);
const TARGET_URL = process.env.DECODER_ALT_URL || 'http://localhost:8787/universal-decoder?sim=1';

function base64EncodeUtf8(value) {
  return Buffer.from(value, 'utf8').toString('base64');
}

function base64UrlEncodeUtf8(value) {
  return base64EncodeUtf8(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function hexEncodeUtf8(value) {
  return Buffer.from(value, 'utf8').toString('hex');
}

function urlEncode(value) {
  return encodeURIComponent(value);
}

function unicodeEscape(value) {
  return value.split('').map((ch) => {
    const code = ch.charCodeAt(0);
    return '\\u' + code.toString(16).padStart(4, '0');
  }).join('');
}

function htmlHexEntities(value) {
  return value.split('').map((ch) => {
    const code = ch.charCodeAt(0);
    return '&#x' + code.toString(16) + ';';
  }).join('');
}

function quotedPrintable(value) {
  const bytes = Buffer.from(value, 'utf8');
  return Array.from(bytes).map((b) => {
    if ((b >= 33 && b <= 60) || (b >= 62 && b <= 126)) return String.fromCharCode(b);
    if (b === 32) return '=20';
    return '=' + b.toString(16).toUpperCase().padStart(2, '0');
  }).join('');
}

function binaryEncode(value) {
  const bytes = Buffer.from(value, 'utf8');
  return Array.from(bytes).map((b) => b.toString(2).padStart(8, '0')).join('');
}

function octalEncode(value) {
  const bytes = Buffer.from(value, 'utf8');
  return Array.from(bytes).map((b) => '\\' + b.toString(8).padStart(3, '0')).join('');
}

function decimalEncode(value) {
  const bytes = Buffer.from(value, 'utf8');
  return Array.from(bytes).map((b) => String(b)).join(' ');
}

function reverseString(value) {
  return value.split('').reverse().join('');
}

function rot13(value) {
  return value.replace(/[A-Za-z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function rot47Standard(value) {
  return value.replace(/[!-~]/g, (ch) => {
    const code = ch.charCodeAt(0);
    return String.fromCharCode(33 + ((code - 33 + 47) % 94));
  });
}

function rot47Bug(value) {
  return value.replace(/[!-~]/g, (ch) => {
    const code = ch.charCodeAt(0);
    return String.fromCharCode(33 + ((code - 33 + 47) % 94) + 33);
  });
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32EncodeUtf8(value) {
  const bytes = Buffer.from(value, 'utf8');
  let buffer = 0;
  let bits = 0;
  let output = '';
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(buffer >> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(buffer << (5 - bits)) & 31];
  }
  return output;
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58EncodeUtf8(value) {
  const bytes = Uint8Array.from(Buffer.from(value, 'utf8'));
  if (!bytes.length) return '';
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      const total = digits[i] * 256 + carry;
      digits[i] = total % 58;
      carry = Math.floor(total / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let out = '';
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out += '1';
  for (let i = digits.length - 1; i >= 0; i--) out += BASE58_ALPHABET[digits[i]];
  return out;
}

function jwtEncode(payload) {
  const header = base64UrlEncodeUtf8(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
  const body = base64UrlEncodeUtf8(JSON.stringify(payload));
  return header + '.' + body + '.sig';
}

const ENCODERS = {
  base64: base64EncodeUtf8,
  base64url: base64UrlEncodeUtf8,
  hex: hexEncodeUtf8,
  url: urlEncode,
  unicode: unicodeEscape,
  html: htmlHexEntities,
  quoted: quotedPrintable,
  binary: binaryEncode,
  octal: octalEncode,
  decimal: decimalEncode,
  reverse: reverseString,
  rot13: rot13,
  rot47: rot47Standard,
  'rot47-bug': rot47Bug,
  base32: base32EncodeUtf8,
  base58: base58EncodeUtf8
};

function buildCases() {
  const basesShort = [
    'admin',
    'root',
    'test',
    'hello',
    'secret',
    'welcome',
    'abc123',
    'letmein',
    'password1',
    'master'
  ];

  const basesMedium = [
    'invoice.pdf.exe',
    'PAYROLL UPDATE REQUIRED: https://hr.example.com/update',
    'X-Correlation-Id: 8f3a0c9b-2f7c-4a19-9bcb-91b2f3c7c2aa',
    'action=login&user=admin&redirect=https://example.com',
    'From: IT <it@example.com>\nSubject: MFA reset',
    '<script>document.location="http://evil.example"</script>',
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Your mailbox is full. Click to expand: https://mail.example.com',
    '{"event":"login","ip":"10.10.10.10"}',
    'Authorization: Bearer abc.def.ghi'
  ];

  const cases = [];

  // 10 cases: binary -> binary -> base32
  for (const base of basesShort) {
    const chain = ['binary', 'binary', 'base32'];
    let current = base;
    for (const layer of chain) current = ENCODERS[layer](current);
    cases.push({ base, chain, input: current, expected: base });
  }

  // 10 cases: octal -> octal -> octal -> reverse -> hex
  for (const base of basesShort) {
    const chain = ['octal', 'octal', 'octal', 'reverse', 'hex'];
    let current = base;
    for (const layer of chain) current = ENCODERS[layer](current);
    cases.push({ base, chain, input: current, expected: base });
  }

  // 10 cases: hex -> base64url -> reverse
  for (const base of basesMedium) {
    const chain = ['hex', 'base64url', 'reverse'];
    let current = base;
    for (const layer of chain) current = ENCODERS[layer](current);
    cases.push({ base, chain, input: current, expected: base });
  }

  // 10 cases: quoted -> base64
  for (const base of basesMedium) {
    const chain = ['quoted', 'base64'];
    let current = base;
    for (const layer of chain) current = ENCODERS[layer](current);
    cases.push({ base, chain, input: current, expected: base });
  }

  // 10 cases: url -> base64url -> rot13 or rot47 bug (alternating)
  for (let i = 0; i < basesMedium.length; i++) {
    const base = basesMedium[i];
    const last = i % 2 === 0 ? 'rot13' : 'rot47-bug';
    const chain = ['url', 'base64url', last];
    let current = base;
    for (const layer of chain) current = ENCODERS[layer](current);
    cases.push({ base, chain: ['url', 'base64url', last === 'rot47-bug' ? 'rot47' : last], input: current, expected: base });
  }

  // Extra: 5 jwt-heavy cases (replace last 5 to keep total stable)
  const fixedTs = 1700000000000;
  for (let i = 0; i < 5; i++) {
    const base = basesMedium[i];
    const payload = { data: base, ts: fixedTs + i };
    const expected = JSON.stringify(payload, null, 2);
    let current = jwtEncode(payload);
    const chain = ['reverse', 'base64url', 'reverse'];
    for (const layer of chain) current = layer === 'base64url' ? ENCODERS.base64url(current) : ENCODERS.reverse(current);
    cases.push({ base: base, chain: ['jwt', ...chain], input: current, expected });
  }

  return cases.slice(0, TOTAL_CASES);
}

async function main() {
  const cases = buildCases();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(0);
  page.setDefaultNavigationTimeout(0);
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

  const result = await page.evaluate(async (payload) => {
    const sim = window.__decoderSim;
    if (!sim) throw new Error('Simulation hooks not available.');
    const runPipeline = sim.runPipeline;
    const started = Date.now();
    const outputs = [];
    for (const item of payload.cases) {
      const out = await runPipeline(item.input, 150);
      const finalOut = (out.output || '').trim();
      const expected = (item.expected || '').trim();
      outputs.push({
        ok: finalOut === expected,
        output: finalOut,
        steps: (out.steps || []).map((s) => s.label),
        stepCount: (out.steps || []).length
      });
    }
    const elapsedMs = Date.now() - started;
    return { elapsedMs, outputs };
  }, { cases });

  let okCount = 0;
  let stepSum = 0;
  const failures = [];
  for (let i = 0; i < cases.length; i++) {
    const out = result.outputs[i];
    stepSum += out.stepCount;
    if (out.ok) {
      okCount += 1;
    } else if (failures.length < 10) {
      failures.push({
        chain: cases[i].chain,
        expected: String(cases[i].expected).slice(0, 140),
        output: String(out.output).slice(0, 140),
        steps: out.steps
      });
    }
  }

  const successRate = cases.length ? okCount / cases.length : 0;
  const avgSteps = cases.length ? stepSum / cases.length : 0;

  const summary = {
    total: cases.length,
    ok: okCount,
    successRate,
    avgSteps,
    elapsedMs: result.elapsedMs,
    failures
  };

  process.stdout.write(JSON.stringify(summary, null, 2));
  process.stdout.write('\n');

  await browser.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
