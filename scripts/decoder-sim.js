import { chromium } from '@playwright/test';

const TOTAL_CASES = Number(process.env.DECODER_SIM_CASES || 10000);
const SEED_START = Number(process.env.DECODER_SIM_SEED || 1337);
const TARGET_URL = 'http://localhost:8787/universal-decoder?sim=1';

const basePhishing = [
  'http://login-microsoft-security.example.com/verify?user=john.doe',
  'https://accounts.google.com-security.login.example.org',
  'PAYROLL UPDATE REQUIRED: https://hr.example.com/update',
  '<script>document.location="http://evil.example"</script>',
  'invoice.pdf.exe',
  'Your mailbox is full. Click to expand: https://mail.example.com',
  'Dear user, reset your password at https://example.com/reset',
  'X-Correlation-Id: 8f3a0c9b-2f7c-4a19-9bcb-91b2f3c7c2aa',
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiamRvZSJ9.sig',
  'action=login&user=admin&redirect=https://example.com',
  'DROP TABLE users; --',
  'From: IT <it@example.com>\nSubject: MFA reset',
  'Access code: 735291',
  'Payment overdue. Please update billing info',
  'https://bit.ly/3fakeurl',
  'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'https://sharepoint.example.com/sites/finance',
  '{"event":"login","ip":"10.10.10.10"}',
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC3',
  'Authorization: Bearer abc.def.ghi'
];

const baseReversible = [
  'password',
  'admin',
  'root',
  'test',
  'hello',
  'secret',
  'welcome',
  'qwerty',
  'abc123',
  'letmein',
  'iloveyou',
  'master',
  'password1',
  'admin123'
];

const supportedLayerList = [
  'base64',
  'base64url',
  'url',
  'hex',
  'unicode',
  'html',
  'quoted',
  'binary',
  'octal',
  'decimal',
  'reverse',
  'rot13',
  'rot47',
  'base32',
  'base58',
  'jwt'
];

const hashLayerList = ['md5'];

const unsupportedLayerList = ['gzip'];

function mergeTallies(base, addition) {
  Object.entries(addition).forEach(([key, value]) => {
    base[key] = (base[key] || 0) + value;
  });
}

async function run() {
  const browser = await chromium.launch();
  const workers = Number(process.env.DECODER_SIM_WORKERS || 4);
  const pages = await Promise.all(
    Array.from({ length: workers }, async () => {
      const page = await browser.newPage();
      page.setDefaultTimeout(0);
      page.setDefaultNavigationTimeout(0);
      await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
      return page;
    })
  );

  const results = {
    total: 0,
    supportedCases: 0,
    success: 0,
    successSupported: 0,
    unsupportedCases: 0,
    ambiguousCases: 0,
    layerDepth: { min: Infinity, max: 0, sum: 0 },
    layerCounts: {},
    failureByLayer: {},
    failures: []
  };

  const batchSize = 400;
  const parallel = 8;
  const perWorker = Math.ceil(TOTAL_CASES / workers);
  const workerRuns = pages.map((page, index) => {
    const workerSeed = SEED_START + index * 1000;
    let remaining = perWorker;
    let seed = workerSeed;

    const runWorker = async () => {
      const workerStats = {
        total: 0,
        supportedCases: 0,
        success: 0,
        successSupported: 0,
        unsupportedCases: 0,
        ambiguousCases: 0,
        layerDepth: { min: Infinity, max: 0, sum: 0 },
        layerCounts: {},
        failureByLayer: {},
        failures: []
      };

      while (remaining > 0) {
        const count = Math.min(batchSize, remaining);
        const batch = await page.evaluate(async ({
          count,
          seed,
          parallel,
          basePhishing,
          baseReversible,
          supportedLayerList,
          hashLayerList,
          unsupportedLayerList
        }) => {
      const sim = window.__decoderSim;
      if (!sim) throw new Error('Simulation hooks not available.');
      const runPipeline = sim.runPipeline;
      const md5 = sim.md5;

      const rng = (() => {
        let state = seed;
        return () => {
          state |= 0;
          state = state + 0x6D2B79F5 | 0;
          let t = Math.imul(state ^ state >>> 15, 1 | state);
          t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
      })();

    const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

    const encodeBase32 = (value) => {
      const bytes = new TextEncoder().encode(value);
      let buffer = 0;
      let bits = 0;
      let output = '';
      bytes.forEach((byte) => {
        buffer = (buffer << 8) | byte;
        bits += 8;
        while (bits >= 5) {
          output += BASE32_ALPHABET[(buffer >> (bits - 5)) & 31];
          bits -= 5;
        }
      });
      if (bits > 0) {
        output += BASE32_ALPHABET[(buffer << (5 - bits)) & 31];
      }
      return output;
    };

    const encodeBase58 = (value) => {
      const bytes = new TextEncoder().encode(value);
      if (!bytes.length) return '';
      const digits = [0];
      bytes.forEach((byte) => {
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
      });
      let output = '';
      for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
        output += '1';
      }
      for (let i = digits.length - 1; i >= 0; i--) {
        output += BASE58_ALPHABET[digits[i]];
      }
      return output;
    };

    const encoders = {
      base64: (value) => {
        const bytes = new TextEncoder().encode(value);
        let binary = '';
        bytes.forEach((b) => { binary += String.fromCharCode(b); });
        return btoa(binary);
      },
      base64url: (value) => {
        const base = encoders.base64(value);
        return base.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      },
      base32: (value) => encodeBase32(value),
      base58: (value) => encodeBase58(value),
      url: (value) => encodeURIComponent(value),
        hex: (value) => {
          const bytes = new TextEncoder().encode(value);
          return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
        },
        unicode: (value) => value.split('').map((ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4,'0')}`).join(''),
        html: (value) => value.split('').map((ch) => `&#x${ch.charCodeAt(0).toString(16)};`).join(''),
        quoted: (value) => {
          const bytes = new TextEncoder().encode(value);
          return Array.from(bytes).map((b) => {
            if ((b >= 33 && b <= 60) || (b >= 62 && b <= 126)) return String.fromCharCode(b);
            if (b === 32) return '=20';
            return '=' + b.toString(16).toUpperCase().padStart(2,'0');
          }).join('');
        },
        binary: (value) => {
          const bytes = new TextEncoder().encode(value);
          return Array.from(bytes).map((b) => b.toString(2).padStart(8,'0')).join('');
        },
        octal: (value) => {
          const bytes = new TextEncoder().encode(value);
          return Array.from(bytes).map((b) => '\\' + b.toString(8).padStart(3,'0')).join('');
        },
        decimal: (value) => {
          const bytes = new TextEncoder().encode(value);
          return Array.from(bytes).map((b) => String(b)).join(' ');
        },
        reverse: (value) => value.split('').reverse().join(''),
        rot13: (value) => value.replace(/[A-Za-z]/g, (char) => {
          const base = char <= 'Z' ? 65 : 97;
          return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
        }),
        rot47: (value) => value.replace(/[!-~]/g, (ch) => {
          const code = ch.charCodeAt(0);
          return String.fromCharCode(33 + ((code - 33 + 47) % 94) + 33);
        }),
        base32: (value) => encodeBase32(value),
        base58: (value) => encodeBase58(value),
        jwt: (payload) => {
          const header = encoders.base64url(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
          const body = encoders.base64url(JSON.stringify(payload));
          return `${header}.${body}.sig`;
        }
      };

      const unsupportedEncoders = {
        gzip: (value) => value
      };

      async function sha(algo, value) {
        const data = new TextEncoder().encode(value);
        const digest = await crypto.subtle.digest(algo, data);
        return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
      }

      const hashEncoders = {
        md5: async (value) => md5(value),
        sha1: async (value) => sha('SHA-1', value),
        sha256: async (value) => sha('SHA-256', value),
        sha512: async (value) => sha('SHA-512', value)
      };

      const batchStats = {
        total: count,
        supportedCases: 0,
        success: 0,
        successSupported: 0,
        unsupportedCases: 0,
        ambiguousCases: 0,
        layerDepth: { min: Infinity, max: 0, sum: 0 },
        layerCounts: {},
        failureByLayer: {},
        failures: []
      };

      const pick = (arr) => arr[Math.floor(rng() * arr.length)];

      const cases = [];
      for (let i = 0; i < count; i++) {
        const useReversible = rng() < 0.4;
        let base = useReversible ? pick(baseReversible) : pick(basePhishing);
        let expected = base;
        let current = base;
        const chain = [];

        let targetLayers = 2 + Math.floor(rng() * 4);
        if (rng() < 0.05) targetLayers = 6 + Math.floor(rng() * 2);

        const makeUnsupported = rng() < 0.15;
        const makeAmbiguous = rng() < 0.08;

        let unsupportedInjected = false;

        for (let layerIndex = 0; layerIndex < targetLayers; layerIndex++) {
          const allowHash = layerIndex === 0 && baseReversible.includes(expected) && rng() < 0.1;
          if (allowHash) {
            const hashType = pick(hashLayerList);
            current = await hashEncoders[hashType](current);
            chain.push(hashType);
            continue;
          }

          if (makeUnsupported && !unsupportedInjected && layerIndex === Math.floor(targetLayers / 2)) {
            const badLayer = pick(unsupportedLayerList);
            current = unsupportedEncoders[badLayer](current);
            chain.push(badLayer);
            unsupportedInjected = true;
            continue;
          }

          const layerType = pick(supportedLayerList);
          if (layerType === 'jwt') {
            const payload = { data: expected, ts: Date.now() };
            current = encoders.jwt(payload);
            expected = JSON.stringify(payload, null, 2);
            chain.push(layerType);
            continue;
          }

          current = encoders[layerType](current);
          chain.push(layerType);
        }

        if (makeAmbiguous) {
          current = current.slice(0, 12);
        }

        cases.push({
          chain,
          current,
          expected,
          unsupportedInjected,
          makeAmbiguous
        });
      }

      for (let idx = 0; idx < cases.length; idx += parallel) {
        const slice = cases.slice(idx, idx + parallel);
        const outputs = await Promise.all(slice.map((item) => runPipeline(item.current, 100)));
        outputs.forEach((output, outIndex) => {
          const item = slice[outIndex];
          const finalOutput = output.output || '';
          const success = finalOutput.trim() === item.expected.trim();
          const isSupported = !item.unsupportedInjected && !item.makeAmbiguous;

          if (isSupported) batchStats.supportedCases += 1;
          if (item.unsupportedInjected) batchStats.unsupportedCases += 1;
          if (item.makeAmbiguous) batchStats.ambiguousCases += 1;

          batchStats.layerDepth.min = Math.min(batchStats.layerDepth.min, item.chain.length);
          batchStats.layerDepth.max = Math.max(batchStats.layerDepth.max, item.chain.length);
          batchStats.layerDepth.sum += item.chain.length;
          batchStats.layerCounts[item.chain.length] = (batchStats.layerCounts[item.chain.length] || 0) + 1;

          if (success) {
            batchStats.success += 1;
            if (isSupported) batchStats.successSupported += 1;
          } else {
            item.chain.forEach((layer) => {
              batchStats.failureByLayer[layer] = (batchStats.failureByLayer[layer] || 0) + 1;
            });
            if (batchStats.failures.length < 3) {
              batchStats.failures.push({
                chain: item.chain,
                inputPreview: item.current.slice(0, 120),
                expected: item.expected.slice(0, 120),
                output: finalOutput.slice(0, 120)
              });
            }
          }
        });
      }

        return batchStats;
        }, {
          count,
          seed,
          parallel,
          basePhishing,
          baseReversible,
          supportedLayerList,
          hashLayerList,
          unsupportedLayerList
        });

        workerStats.total += batch.total;
        workerStats.supportedCases += batch.supportedCases;
        workerStats.success += batch.success;
        workerStats.successSupported += batch.successSupported;
        workerStats.unsupportedCases += batch.unsupportedCases;
        workerStats.ambiguousCases += batch.ambiguousCases;

        workerStats.layerDepth.min = Math.min(workerStats.layerDepth.min, batch.layerDepth.min);
        workerStats.layerDepth.max = Math.max(workerStats.layerDepth.max, batch.layerDepth.max);
        workerStats.layerDepth.sum += batch.layerDepth.sum;

        mergeTallies(workerStats.layerCounts, batch.layerCounts);
        mergeTallies(workerStats.failureByLayer, batch.failureByLayer);

        if (workerStats.failures.length < 10) {
          workerStats.failures.push(...batch.failures.slice(0, 10 - workerStats.failures.length));
        }

        remaining -= count;
        seed += 31;
        process.stderr.write(`worker ${index + 1}: ${workerStats.total}/${perWorker}\n`);
      }

      return workerStats;
    };

    return runWorker();
  });

  const workerResults = await Promise.all(workerRuns);
  await browser.close();

  workerResults.forEach((batch) => {
    results.total += batch.total;
    results.supportedCases += batch.supportedCases;
    results.success += batch.success;
    results.successSupported += batch.successSupported;
    results.unsupportedCases += batch.unsupportedCases;
    results.ambiguousCases += batch.ambiguousCases;

    results.layerDepth.min = Math.min(results.layerDepth.min, batch.layerDepth.min);
    results.layerDepth.max = Math.max(results.layerDepth.max, batch.layerDepth.max);
    results.layerDepth.sum += batch.layerDepth.sum;

    mergeTallies(results.layerCounts, batch.layerCounts);
    mergeTallies(results.failureByLayer, batch.failureByLayer);

    if (results.failures.length < 10) {
      results.failures.push(...batch.failures.slice(0, 10 - results.failures.length));
    }
  });

  const avgLayers = results.layerDepth.sum / results.total;
  const supportedRate = results.supportedCases ? (results.successSupported / results.supportedCases) : 0;
  const overallRate = results.success / results.total;
  const unsupportedRate = results.unsupportedCases / results.total;
  const ambiguousRate = results.ambiguousCases / results.total;
  const legacyScore = Math.max(1, Math.min(100, Math.round((supportedRate * 100) - (avgLayers * 1.2) - (unsupportedRate * 15))));
  const quality = 100 * (1 - Math.exp(-6 * supportedRate));
  const avgLayersPenalty = Math.min(avgLayers, 12) * 0.3;
  const unsupportedPenalty = unsupportedRate * 10;
  const ambiguousPenalty = ambiguousRate * 5;
  const score = Math.max(1, Math.min(100, Math.round(quality - avgLayersPenalty - unsupportedPenalty - ambiguousPenalty)));

  return {
    score,
    legacyScore,
    successRate: overallRate,
    supportedRate,
    avgLayers,
    totals: results,
    failures: results.failures,
    failureByLayer: results.failureByLayer
  };
}

run().then((result) => {
  process.stdout.write(JSON.stringify(result, null, 2));
  process.stdout.write('\n');
  process.exit(0);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
