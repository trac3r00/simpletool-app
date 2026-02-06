/**
 * Token Counter & Cost Estimator
 * - Estimates token counts for GPT / Claude / Llama families (offline, heuristic)
 * - Calculates approximate cost given user-provided $/1M token rates
 * - All processing stays in the browser
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint } from '../utils/common-ui.js';

export async function handleTokenCounterRoutes(request, url) {
  const { pathname } = url;
  if (pathname === '/token-counter' || pathname === '/token-counter/') {
    if (request.method === 'GET') return respondHTML(renderTokenCounterPage());
    return new Response('Method not allowed', { status: 405 });
  }
  return null;
}

function renderTokenCounterPage() {
  const title = 'Token Counter & Cost Estimator';
  const description = 'Estimate token counts for GPT, Claude, and Llama families and calculate cost with your pricing.';

  const header = createToolHeader(
    { emoji: '🧮' },
    title,
    description,
    [
      { text: '<span data-i18n="tools.token-counter.ui.badge0">Offline</span>', tooltip: 'No network calls. Estimates are computed locally.' },
      { text: '<span data-i18n="tools.token-counter.ui.badge1">Bring Your Pricing</span>', tooltip: 'Pricing changes frequently — enter your own $/1M token rates.' }
    ],
    { toolId: 'token-counter' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${header}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-3">
            <div class="flex flex-wrap gap-2 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
              <button id="load-sample" class="btn btn-secondary">🧪 <span data-i18n="tools.token-counter.ui.button0">Sample</span></button>
              <button id="clear" class="btn btn-ghost ml-auto">🗑️ <span data-i18n="tools.token-counter.ui.button1">Clear</span></button>
              <button id="copy" class="btn btn-secondary" disabled>📋 <span data-i18n="tools.token-counter.ui.button2">Copy Summary</span></button>
            </div>

            <label class="label flex items-center gap-2">
              <span data-i18n="tools.token-counter.ui.label0">Text</span>
              ${infoHint('Tokenization differs by model. This tool estimates tokens using byte/character heuristics; use it for planning and budgeting, not exact billing.', 'Help', { i18nKey: 'tools.token-counter.ui.desc0' })}
            </label>
            <textarea id="text" rows="16" class="input-mono resize-y" placeholder="Paste your prompt, docs, code, or any text..." data-i18n-placeholder="tools.token-counter.ui.placeholder0"></textarea>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-chars">0</div>
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.token-counter.ui.stat0">Chars</div>
              </div>
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-bytes">0</div>
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.token-counter.ui.stat1">Bytes (UTF-8)</div>
              </div>
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-words">0</div>
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.token-counter.ui.stat2">Words</div>
              </div>
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-2xl font-bold text-primary-600 dark:text-primary-400" id="stat-lines">0</div>
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.token-counter.ui.stat3">Lines</div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                <label class="label flex items-center gap-2">
                  <span data-i18n="tools.token-counter.ui.label1">Expected output tokens</span>
                  ${infoHint('If you don’t have an actual completion, set an expected output budget to estimate total cost.', 'Help', { i18nKey: 'tools.token-counter.ui.desc6' })}
                </label>
                <input id="out-tokens" type="number" min="0" step="1" value="0" class="input font-mono" />
              </div>
              <div class="p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                <label class="label" data-i18n="tools.token-counter.ui.label2">Estimate mode</label>
                <select id="mode" class="input">
                  <option value="balanced" data-i18n="tools.token-counter.ui.option0">Balanced</option>
                  <option value="conservative" data-i18n="tools.token-counter.ui.option1">Conservative (+10%)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <div class="flex items-center justify-between mb-3">
                <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.token-counter.ui.heading0">Estimates</h2>
                <span id="note" class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.text0">Enter rates to compute cost</span>
              </div>

              <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                  <thead class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400">
                    <tr>
                      <th class="text-left py-2 pr-4" data-i18n="tools.token-counter.ui.th0">Family</th>
                      <th class="text-right py-2 px-3" data-i18n="tools.token-counter.ui.th1">Input</th>
                      <th class="text-right py-2 px-3" data-i18n="tools.token-counter.ui.th2">Output</th>
                      <th class="text-right py-2 px-3" data-i18n="tools.token-counter.ui.th3">Total</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-surface-200 dark:divide-surface-800">
                    <tr>
                      <td class="py-3 pr-4 font-semibold" data-i18n="tools.token-counter.ui.label3">GPT-4 class</td>
                      <td class="py-3 px-3 text-right font-mono" id="gpt-in">0</td>
                      <td class="py-3 px-3 text-right font-mono" id="gpt-out">0</td>
                      <td class="py-3 px-3 text-right font-mono" id="gpt-total">0</td>
                    </tr>
                    <tr>
                      <td class="py-3 pr-4 font-semibold" data-i18n="tools.token-counter.ui.label4">Claude class</td>
                      <td class="py-3 px-3 text-right font-mono" id="claude-in">0</td>
                      <td class="py-3 px-3 text-right font-mono" id="claude-out">0</td>
                      <td class="py-3 px-3 text-right font-mono" id="claude-total">0</td>
                    </tr>
                    <tr>
                      <td class="py-3 pr-4 font-semibold" data-i18n="tools.token-counter.ui.label5">Llama class</td>
                      <td class="py-3 px-3 text-right font-mono" id="llama-in">0</td>
                      <td class="py-3 px-3 text-right font-mono" id="llama-out">0</td>
                      <td class="py-3 px-3 text-right font-mono" id="llama-total">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.token-counter.ui.heading1">Cost (USD)</h2>

              <div class="space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div class="sm:col-span-1">
                    <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label6">GPT-4 class</div>
                  </div>
                  <div>
                    <label class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label7">Input $/1M</label>
                    <input id="gpt-in-rate" type="number" min="0" step="0.01" class="input font-mono" placeholder="e.g., 5.00" data-i18n-placeholder="tools.token-counter.ui.placeholder1" />
                  </div>
                  <div>
                    <label class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label8">Output $/1M</label>
                    <input id="gpt-out-rate" type="number" min="0" step="0.01" class="input font-mono" placeholder="e.g., 15.00" data-i18n-placeholder="tools.token-counter.ui.placeholder2" />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div class="sm:col-span-1">
                    <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label9">Claude class</div>
                  </div>
                  <div>
                    <label class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label10">Input $/1M</label>
                    <input id="claude-in-rate" type="number" min="0" step="0.01" class="input font-mono" placeholder="e.g., 3.00" data-i18n-placeholder="tools.token-counter.ui.placeholder3" />
                  </div>
                  <div>
                    <label class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label11">Output $/1M</label>
                    <input id="claude-out-rate" type="number" min="0" step="0.01" class="input font-mono" placeholder="e.g., 15.00" data-i18n-placeholder="tools.token-counter.ui.placeholder4" />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div class="sm:col-span-1">
                    <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label12">Llama class</div>
                  </div>
                  <div>
                    <label class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label13">Input $/1M</label>
                    <input id="llama-in-rate" type="number" min="0" step="0.01" class="input font-mono" placeholder="e.g., 0.50" data-i18n-placeholder="tools.token-counter.ui.placeholder5" />
                  </div>
                  <div>
                    <label class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label14">Output $/1M</label>
                    <input id="llama-out-rate" type="number" min="0" step="0.01" class="input font-mono" placeholder="e.g., 0.75" data-i18n-placeholder="tools.token-counter.ui.placeholder6" />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                    <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.token-counter.ui.stat4">GPT-4</div>
                    <div class="text-xl font-bold font-mono" id="gpt-cost">$0.00</div>
                  </div>
                  <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                    <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.token-counter.ui.stat5">Claude</div>
                    <div class="text-xl font-bold font-mono" id="claude-cost">$0.00</div>
                  </div>
                  <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                    <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.token-counter.ui.stat6">Llama</div>
                    <div class="text-xl font-bold font-mono" id="llama-cost">$0.00</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        ${createCheatsheet('token-counter', '<span data-i18n="tools.token-counter.ui.heading2">Notes on Token Estimates</span>', [
          {
            heading: '<span data-i18n="tools.token-counter.ui.heading3">Why counts differ</span>',
            content: `
              <ul class="list-disc ml-6 space-y-1">
                <li data-i18n="tools.token-counter.ui.desc1">Each model family uses a different tokenizer (BPE / SentencePiece / custom).</li>
                <li data-i18n="tools.token-counter.ui.desc2">Non-ASCII text (Korean/Japanese), code, and JSON often tokenize differently than plain English.</li>
                <li data-i18n="tools.token-counter.ui.desc3">Chat APIs may add hidden tokens for message formatting.</li>
              </ul>
            `
          },
          {
            heading: '<span data-i18n="tools.token-counter.ui.heading4">How this tool estimates</span>',
            content: `
              <p data-i18n="tools.token-counter.ui.desc4">We estimate tokens from UTF-8 byte length and character makeup (ASCII vs non-ASCII), then apply a small safety factor in Conservative mode.</p>
              <p class="mt-2 text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.desc5">For exact billing, rely on your provider’s official tokenizer when available.</p>
            `
          }
        ])}
      </div>
    </main>
  `;

  const scripts = String.raw`
    <script>
      const t = (k, fb) => (window._t ? window._t('tools.token-counter.js.' + k, fb) : (fb || k));

      const $ = (id) => document.getElementById(id);

      const els = {
        text: $('text'),
        outTokens: $('out-tokens'),
        mode: $('mode'),
        loadSample: $('load-sample'),
        clear: $('clear'),
        copy: $('copy'),
        statChars: $('stat-chars'),
        statBytes: $('stat-bytes'),
        statWords: $('stat-words'),
        statLines: $('stat-lines'),
        gptIn: $('gpt-in'),
        gptOut: $('gpt-out'),
        gptTotal: $('gpt-total'),
        claudeIn: $('claude-in'),
        claudeOut: $('claude-out'),
        claudeTotal: $('claude-total'),
        llamaIn: $('llama-in'),
        llamaOut: $('llama-out'),
        llamaTotal: $('llama-total'),
        gptInRate: $('gpt-in-rate'),
        gptOutRate: $('gpt-out-rate'),
        claudeInRate: $('claude-in-rate'),
        claudeOutRate: $('claude-out-rate'),
        llamaInRate: $('llama-in-rate'),
        llamaOutRate: $('llama-out-rate'),
        gptCost: $('gpt-cost'),
        claudeCost: $('claude-cost'),
        llamaCost: $('llama-cost'),
      };

      const SAMPLE = [
        'You are a senior security engineer.',
        'Task: Review the following incident summary and produce a triage plan.',
        '',
        'Constraints:',
        '- Ask clarifying questions if needed',
        '- Provide a step-by-step checklist',
        '',
        'Incident summary:',
        'User reported suspicious MFA prompts after clicking a link in an email.'
      ].join('\n');

      function utf8Bytes(text) {
        try {
          return new TextEncoder().encode(String(text || '')).length;
        } catch (e) {
          // Fallback (very old browsers): approximate via URI encoding
          return unescape(encodeURIComponent(String(text || ''))).length;
        }
      }

      function basicStats(text) {
        const s = String(text || '');
        const chars = s.length;
        const bytes = utf8Bytes(s);
        const words = s.trim() ? s.trim().split(/\s+/).length : 0;
        const lines = s ? s.split('\n').length : 0;
        let ascii = 0;
        for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) <= 0x7f) ascii++;
        const asciiRatio = chars ? (ascii / chars) : 1;
        return { chars, bytes, words, lines, asciiRatio };
      }

      function estimateTokens({ bytes, asciiRatio }, family, mode) {
        // Heuristic divisors (lower divisor => more tokens).
        let divisor;
        if (family === 'gpt') {
          divisor = asciiRatio > 0.9 ? 4.0 : asciiRatio > 0.6 ? 3.4 : 2.7;
        } else if (family === 'claude') {
          divisor = asciiRatio > 0.9 ? 3.9 : asciiRatio > 0.6 ? 3.3 : 2.6;
        } else {
          divisor = asciiRatio > 0.9 ? 4.2 : asciiRatio > 0.6 ? 3.6 : 2.9;
        }
        let tokens = Math.ceil(bytes / divisor);
        if (mode === 'conservative') tokens = Math.ceil(tokens * 1.1);
        return Math.max(0, tokens);
      }

      function num(v) {
        const n = Number(v);
        return Number.isFinite(n) && n >= 0 ? n : 0;
      }

      function costUsd(inTokens, outTokens, inRatePerM, outRatePerM) {
        const inCost = (inTokens / 1_000_000) * inRatePerM;
        const outCost = (outTokens / 1_000_000) * outRatePerM;
        const total = inCost + outCost;
        return Number.isFinite(total) ? total : 0;
      }

      function fmtUsd(n) {
        return '$' + (Math.round(n * 100) / 100).toFixed(2);
      }

      function readRates() {
        try {
          const raw = localStorage.getItem('token-counter-rates');
          if (!raw) return null;
          const obj = JSON.parse(raw);
          return obj && typeof obj === 'object' ? obj : null;
        } catch (e) {
          return null;
        }
      }

      function writeRates() {
        const obj = {
          gpt: { in: num(els.gptInRate.value), out: num(els.gptOutRate.value) },
          claude: { in: num(els.claudeInRate.value), out: num(els.claudeOutRate.value) },
          llama: { in: num(els.llamaInRate.value), out: num(els.llamaOutRate.value) },
        };
        try { localStorage.setItem('token-counter-rates', JSON.stringify(obj)); } catch (e) {}
      }

      function hydrateRates() {
        const r = readRates();
        if (!r) return;
        if (r.gpt) { els.gptInRate.value = r.gpt.in ?? ''; els.gptOutRate.value = r.gpt.out ?? ''; }
        if (r.claude) { els.claudeInRate.value = r.claude.in ?? ''; els.claudeOutRate.value = r.claude.out ?? ''; }
        if (r.llama) { els.llamaInRate.value = r.llama.in ?? ''; els.llamaOutRate.value = r.llama.out ?? ''; }
      }

      function update() {
        const text = els.text.value;
        const stats = basicStats(text);
        els.statChars.textContent = stats.chars.toLocaleString();
        els.statBytes.textContent = stats.bytes.toLocaleString();
        els.statWords.textContent = stats.words.toLocaleString();
        els.statLines.textContent = stats.lines.toLocaleString();

        const mode = els.mode.value;
        const outTokens = Math.max(0, Math.floor(num(els.outTokens.value)));

        const gptIn = estimateTokens(stats, 'gpt', mode);
        const claudeIn = estimateTokens(stats, 'claude', mode);
        const llamaIn = estimateTokens(stats, 'llama', mode);

        els.gptIn.textContent = gptIn.toLocaleString();
        els.gptOut.textContent = outTokens.toLocaleString();
        els.gptTotal.textContent = (gptIn + outTokens).toLocaleString();

        els.claudeIn.textContent = claudeIn.toLocaleString();
        els.claudeOut.textContent = outTokens.toLocaleString();
        els.claudeTotal.textContent = (claudeIn + outTokens).toLocaleString();

        els.llamaIn.textContent = llamaIn.toLocaleString();
        els.llamaOut.textContent = outTokens.toLocaleString();
        els.llamaTotal.textContent = (llamaIn + outTokens).toLocaleString();

        const gptCost = costUsd(gptIn, outTokens, num(els.gptInRate.value), num(els.gptOutRate.value));
        const claudeCost = costUsd(claudeIn, outTokens, num(els.claudeInRate.value), num(els.claudeOutRate.value));
        const llamaCost = costUsd(llamaIn, outTokens, num(els.llamaInRate.value), num(els.llamaOutRate.value));

        els.gptCost.textContent = fmtUsd(gptCost);
        els.claudeCost.textContent = fmtUsd(claudeCost);
        els.llamaCost.textContent = fmtUsd(llamaCost);

        els.copy.disabled = !text.trim();
        writeRates();
      }

	      let timer = null;
	      function scheduleUpdate() {
	        if (timer) clearTimeout(timer);
	        timer = setTimeout(update, 30);
	      }

      els.text.addEventListener('input', scheduleUpdate);
      els.outTokens.addEventListener('input', scheduleUpdate);
      els.mode.addEventListener('change', scheduleUpdate);
      [
        els.gptInRate, els.gptOutRate,
        els.claudeInRate, els.claudeOutRate,
        els.llamaInRate, els.llamaOutRate
      ].forEach(el => el.addEventListener('input', scheduleUpdate));

      els.loadSample.addEventListener('click', () => {
        els.text.value = SAMPLE;
        scheduleUpdate();
      });

      els.clear.addEventListener('click', () => {
        els.text.value = '';
        els.outTokens.value = '0';
        scheduleUpdate();
      });

      els.copy.addEventListener('click', async () => {
        const text = els.text.value;
        if (!text.trim()) return;
        const stats = basicStats(text);
        const mode = els.mode.value;
        const outTokens = Math.max(0, Math.floor(num(els.outTokens.value)));
        const gptIn = estimateTokens(stats, 'gpt', mode);
        const claudeIn = estimateTokens(stats, 'claude', mode);
        const llamaIn = estimateTokens(stats, 'llama', mode);

        const lines = [
          t('text0', 'Token Estimate Summary'),
          t('text1', 'Chars: {v}').replace('{v}', String(stats.chars)),
          t('text2', 'Bytes: {v}').replace('{v}', String(stats.bytes)),
          t('text3', 'Words: {v}').replace('{v}', String(stats.words)),
          t('text4', 'Lines: {v}').replace('{v}', String(stats.lines)),
          '',
          t('text5', 'Expected output tokens: {v}').replace('{v}', String(outTokens)),
          '',
          t('text6', 'GPT-4 class: in={in}, out={out}, total={total}')
            .replace('{in}', String(gptIn)).replace('{out}', String(outTokens)).replace('{total}', String(gptIn + outTokens)),
          t('text7', 'Claude class: in={in}, out={out}, total={total}')
            .replace('{in}', String(claudeIn)).replace('{out}', String(outTokens)).replace('{total}', String(claudeIn + outTokens)),
          t('text8', 'Llama class: in={in}, out={out}, total={total}')
            .replace('{in}', String(llamaIn)).replace('{out}', String(outTokens)).replace('{total}', String(llamaIn + outTokens)),
          '',
          t('text9', 'Note: These are heuristic estimates, not exact tokenizer counts.')
        ];

        try {
          await navigator.clipboard.writeText(lines.join('\n'));
          const old = els.copy.textContent;
          els.copy.textContent = t('text10', '✓ Copied');
          setTimeout(() => (els.copy.textContent = old), 1200);
        } catch (e) {
          console.error('Copy failed:', e);
        }
      });

      hydrateRates();
      update();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: '/token-counter',
    content,
    scripts
  });
}
