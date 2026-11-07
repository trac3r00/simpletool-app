/**
 * Token Counter & Cost Estimator
 * - Estimates token counts for GPT / Claude / Llama families (offline, heuristic)
 * - Calculates approximate cost given user-provided $/1M token rates
 * - All processing stays in the browser
 */

import { respondHTML } from "../utils/respond.js";
import {
  createPageTemplate,
  createToolHeader,
  createCheatsheet,
  infoHint,
} from "../utils/common-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import { createRelatedToolsSection } from "../utils/content-ui.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";
import {
  TOKENIZER_BUNDLES,
  TOKEN_MODELS,
  TOKEN_VIEW_CAP,
  contextUsage,
  escapeHtml,
  segmentTokens,
  renderTokenSpans,
} from "../utils/token-logic.js";

const DEFAULT_MODEL_ID = "gpt-4o";

function renderModelOptions() {
  const groups = [];
  for (const m of TOKEN_MODELS) {
    let g = groups.find((x) => x.name === m.group);
    if (!g) groups.push((g = { name: m.group, models: [] }));
    g.models.push(m);
  }
  return groups
    .map(
      (g) =>
        `<optgroup label="${escapeHtml(g.name)}">${g.models
          .map(
            (m) =>
              `<option value="${escapeHtml(m.id)}"${m.id === DEFAULT_MODEL_ID ? " selected" : ""}>${escapeHtml(m.label)}${m.encoding ? " (" + m.encoding + ")" : ""}</option>`,
          )
          .join("")}</optgroup>`,
    )
    .join("");
}

function toInlineJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export async function handleTokenCounterRoutes(request, url) {
  const { pathname } = url;
  if (pathname === "/token-counter" || pathname === "/token-counter/") {
    if (request.method === "GET")
      return respondHTML(
        renderTokenCounterPage(resolveRequestLanguage(request, url)),
      );
    return new Response("Method not allowed", { status: 405 });
  }
  return null;
}

function renderTokenCounterPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("token-counter", currentLang);
  const title = translation?.name || "Token Counter & Cost Estimator";
  const description =
    translation?.desc ||
    "Estimate token counts for GPT, Claude, Llama and Gemini tokenizer families and calculate cost with your pricing.";

  const header = createToolHeader(
    { emoji: "🧮" },
    title,
    description,
    [
      {
        text: '<span data-i18n="tools.token-counter.ui.badge0">Offline</span>',
        tooltip:
          "Your text never leaves the browser. The exact OpenAI tokenizer file is fetched from this site only when an OpenAI model is selected and text is entered.",
        tooltipI18nKey: "tools.token-counter.ui.r65_2",
      },
      {
        text: '<span data-i18n="tools.token-counter.ui.badge1">Bring Your Pricing</span>',
        tooltip:
          "Pricing changes frequently — enter your own $/1M token rates.",
      },
    ],
    { toolId: "token-counter" },
  );

  const currentTool = TOOLS.find((t) => t.id === "token-counter");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">
        ${header}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-3">
            <div class="flex flex-wrap gap-2 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
              <button id="load-sample" class="btn btn-secondary">🧪 <span data-i18n="tools.token-counter.ui.button0">Sample</span></button>
              <button id="clear" class="btn btn-ghost ml-auto">🗑️ <span data-i18n="tools.token-counter.ui.button1">Clear</span></button>
              <button id="copy" class="btn btn-secondary" disabled>📋 <span data-i18n="tools.token-counter.ui.button2">Copy Summary</span></button>
            </div>
            <p id="copy-status" class="text-xs text-red-600 dark:text-red-400" role="status" aria-live="polite"></p>

            <label for="text" class="label flex items-center gap-2">
              <span data-i18n="tools.token-counter.ui.label0">Text</span>
              ${infoHint("Tokenization differs by model. This tool estimates tokens using byte/character heuristics; use it for planning and budgeting, not exact billing.", "Help", { ariaI18nKey: "tools.token-counter.ui.r65_0", i18nKey: "tools.token-counter.ui.desc0" })}
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
              <div class="tool-group p-4">
                <label for="out-tokens" class="label flex items-center gap-2">
                  <span data-i18n="tools.token-counter.ui.label1">Expected output tokens</span>
                  ${infoHint("If you don’t have an actual completion, set an expected output budget to estimate total cost.", "Help", { ariaI18nKey: "tools.token-counter.ui.r65_1", i18nKey: "tools.token-counter.ui.desc6" })}
                </label>
                <input id="out-tokens" type="number" min="0" step="1" value="0" class="input font-mono" />
              </div>
              <div class="tool-group p-4">
                <label for="mode" class="label" data-i18n="tools.token-counter.ui.label2">Estimate mode</label>
                <select id="mode" class="input">
                  <option value="balanced" data-i18n="tools.token-counter.ui.option0">Balanced</option>
                  <option value="conservative" data-i18n="tools.token-counter.ui.option1">Conservative (+10%)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <section class="tool-group p-5" aria-labelledby="model-heading">
              <h2 id="model-heading" class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.token-counter.ui.r3_2">Model token count</h2>
              <label for="model" class="label" data-i18n="tools.token-counter.ui.r3_0">Model</label>
              <select id="model" class="input">${renderModelOptions()}</select>

              <div class="flex items-baseline gap-3 mt-4">
                <div id="model-count" class="text-3xl font-bold font-mono text-primary-600 dark:text-primary-400">0</div>
                <span class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.r3_5">input tokens</span>
                <span id="model-kind" class="ml-auto text-xs font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300" data-i18n="tools.token-counter.ui.r3_3">Exact</span>
              </div>
              <p id="model-status" class="text-xs text-surface-500 dark:text-surface-400 mt-2" aria-live="polite"></p>
              <p id="model-error" class="text-xs text-red-600 dark:text-red-400 mt-2" role="status" hidden></p>

              <div class="mt-4">
                <label for="context-window" class="label" data-i18n="tools.token-counter.ui.r3_1">Context window (tokens)</label>
                <input id="context-window" type="number" min="1" step="1" class="input font-mono" placeholder="Enter the model's context window" data-i18n-placeholder="tools.token-counter.ui.r4_0" />
                <div class="mt-3 h-2 rounded-full bg-surface-200 dark:bg-surface-800 overflow-hidden" aria-hidden="true">
                  <div id="context-bar" class="h-2 bg-primary-500 transition-all"></div>
                </div>
                <p id="context-usage" class="text-xs text-surface-500 dark:text-surface-400 mt-2" aria-live="polite" data-i18n="tools.token-counter.ui.r3_6">Enter a context window to see usage.</p>
              </div>
            </section>

            <div class="tool-group p-5">
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
                      <td class="py-3 pr-4 font-semibold" data-i18n="tools.token-counter.ui.label3">GPT family (BPE)</td>
                      <td class="py-3 px-3 text-right font-mono" id="gpt-in">0</td>
                      <td class="py-3 px-3 text-right font-mono" id="gpt-out">0</td>
                      <td class="py-3 px-3 text-right font-mono" id="gpt-total">0</td>
                    </tr>
                    <tr>
                      <td class="py-3 pr-4 font-semibold" data-i18n="tools.token-counter.ui.label4">Claude family</td>
                      <td class="py-3 px-3 text-right font-mono" id="claude-in">0</td>
                      <td class="py-3 px-3 text-right font-mono" id="claude-out">0</td>
                      <td class="py-3 px-3 text-right font-mono" id="claude-total">0</td>
                    </tr>
                    <tr>
                      <td class="py-3 pr-4 font-semibold" data-i18n="tools.token-counter.ui.label5">Llama / Gemini family (SentencePiece)</td>
                      <td class="py-3 px-3 text-right font-mono" id="llama-in">0</td>
                      <td class="py-3 px-3 text-right font-mono" id="llama-out">0</td>
                      <td class="py-3 px-3 text-right font-mono" id="llama-total">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="tool-group p-5">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-3" data-i18n="tools.token-counter.ui.heading1">Cost (USD)</h2>

              <div class="space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div class="sm:col-span-1">
                    <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label6">GPT family (BPE)</div>
                  </div>
                  <div>
                    <label for="gpt-in-rate" class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label7">Input $/1M</label>
                    <input id="gpt-in-rate" type="number" min="0" step="0.01" class="input font-mono" placeholder="e.g., 5.00" data-i18n-placeholder="tools.token-counter.ui.placeholder1" />
                  </div>
                  <div>
                    <label for="gpt-out-rate" class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label8">Output $/1M</label>
                    <input id="gpt-out-rate" type="number" min="0" step="0.01" class="input font-mono" placeholder="e.g., 15.00" data-i18n-placeholder="tools.token-counter.ui.placeholder2" />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div class="sm:col-span-1">
                    <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label9">Claude family</div>
                  </div>
                  <div>
                    <label for="claude-in-rate" class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label10">Input $/1M</label>
                    <input id="claude-in-rate" type="number" min="0" step="0.01" class="input font-mono" placeholder="e.g., 3.00" data-i18n-placeholder="tools.token-counter.ui.placeholder3" />
                  </div>
                  <div>
                    <label for="claude-out-rate" class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label11">Output $/1M</label>
                    <input id="claude-out-rate" type="number" min="0" step="0.01" class="input font-mono" placeholder="e.g., 15.00" data-i18n-placeholder="tools.token-counter.ui.placeholder4" />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div class="sm:col-span-1">
                    <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label12">Llama / Gemini family (SentencePiece)</div>
                  </div>
                  <div>
                    <label for="llama-in-rate" class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label13">Input $/1M</label>
                    <input id="llama-in-rate" type="number" min="0" step="0.01" class="input font-mono" placeholder="e.g., 0.50" data-i18n-placeholder="tools.token-counter.ui.placeholder5" />
                  </div>
                  <div>
                    <label for="llama-out-rate" class="text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.label14">Output $/1M</label>
                    <input id="llama-out-rate" type="number" min="0" step="0.01" class="input font-mono" placeholder="e.g., 0.75" data-i18n-placeholder="tools.token-counter.ui.placeholder6" />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                    <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.token-counter.ui.stat4">GPT</div>
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

        <section class="tool-group p-5 mt-6" aria-labelledby="tokens-heading">
          <h2 id="tokens-heading" class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-2" data-i18n="tools.token-counter.ui.r3_4">Token boundaries</h2>
          <p id="tokens-note" class="text-xs text-surface-500 dark:text-surface-400 mb-3" aria-live="polite" data-i18n="tools.token-counter.ui.r3_7">Token boundaries are shown for exact (OpenAI) encodings once the tokenizer has loaded.</p>
          <div id="tokens-view" class="font-mono text-sm whitespace-pre-wrap break-all max-h-96 overflow-auto p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950"></div>
        </section>

        ${createCheatsheet(
          "token-counter",
          '<span data-i18n="tools.token-counter.ui.heading2">Notes on Token Estimates</span>',
          [
            {
              heading:
                '<span data-i18n="tools.token-counter.ui.heading3">Why counts differ</span>',
              content: `
              <ul class="list-disc ml-6 space-y-1">
                <li data-i18n="tools.token-counter.ui.desc1">Each model family uses a different tokenizer (BPE / SentencePiece / custom). Rows are per tokenizer family, not per model version — Gemini tokenizes like the SentencePiece row.</li>
                <li data-i18n="tools.token-counter.ui.desc2">Non-ASCII text (Korean/Japanese), code, and JSON often tokenize differently than plain English.</li>
                <li data-i18n="tools.token-counter.ui.desc3">Chat APIs may add hidden tokens for message formatting.</li>
              </ul>
            `,
            },
            {
              heading:
                '<span data-i18n="tools.token-counter.ui.heading4">How this tool estimates</span>',
              content: `
              <p data-i18n="tools.token-counter.ui.desc4">We estimate tokens from UTF-8 byte length and character makeup (ASCII vs non-ASCII), then apply a small safety factor in Conservative mode.</p>
              <p class="mt-2 text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.token-counter.ui.desc5">For exact billing, rely on your provider’s official tokenizer when available.</p>
            `,
            },
          ],
        )}
      </div>
    ${createRelatedToolsSection(relatedToolsData)}
    </main>
  `;

  const scripts = String.raw`
    <script>
      const t = (k, fb) => (window._t ? window._t('tools.token-counter.js.' + k, fb) : (fb || k));

      const $ = (id) => document.getElementById(id);

      const MODELS = ${toInlineJson(TOKEN_MODELS)};
      const BUNDLES = ${toInlineJson(TOKENIZER_BUNDLES)};
      const VIEW_CAP = ${TOKEN_VIEW_CAP};
      const ENCODE_OPTS = { disallowedSpecial: new Set() };
      const SCRIPT_NONCE = (document.currentScript && document.currentScript.nonce) || '';
      ${contextUsage.toString()}
      ${escapeHtml.toString()}
      ${segmentTokens.toString()}
      ${renderTokenSpans.toString()}

      const tokenizers = {};
      function ensureTokenizer(enc) {
        if (tokenizers[enc]) return tokenizers[enc];
        const bundle = BUNDLES[enc];
        const entry = { state: 'loading', api: null, error: '' };
        tokenizers[enc] = entry;
        if (window[bundle.global]) {
          entry.state = 'ready';
          entry.api = window[bundle.global];
          return entry;
        }
        const s = document.createElement('script');
        s.src = bundle.src;
        s.integrity = bundle.integrity;
        s.crossOrigin = 'anonymous';
        s.async = true;
        if (SCRIPT_NONCE) s.nonce = SCRIPT_NONCE;
        s.addEventListener('load', () => {
          const api = window[bundle.global];
          if (api && typeof api.encode === 'function' && typeof api.decode === 'function') {
            entry.state = 'ready';
            entry.api = api;
          } else {
            entry.state = 'error';
            entry.error = 'the ' + enc + ' tokenizer loaded but did not expose an encoder';
          }
          scheduleUpdate();
        });
        s.addEventListener('error', () => {
          entry.state = 'error';
          entry.error = 'the ' + enc + ' tokenizer could not be downloaded or failed its integrity check (reload the page to retry)';
          scheduleUpdate();
        });
        document.head.appendChild(s);
        return entry;
      }

      function selectedModel() {
        return MODELS.find((m) => m.id === els.model.value) || MODELS[0];
      }

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
        model: $('model'),
        modelCount: $('model-count'),
        modelKind: $('model-kind'),
        modelStatus: $('model-status'),
        modelError: $('model-error'),
        ctx: $('context-window'),
        ctxBar: $('context-bar'),
        ctxUsage: $('context-usage'),
        tokensNote: $('tokens-note'),
        tokensView: $('tokens-view'),
        copyStatus: $('copy-status'),
      };

      const KIND_CLASSES = {
        exact: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
        estimate: 'bg-surface-200 text-surface-700 dark:bg-surface-800 dark:text-surface-300',
      };
      const KIND_BASE = 'ml-auto text-xs font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ';

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
        // Code points, not UTF-16 units: an emoji counts as 1, like Python's len().
        const chars = Array.from(s).length;
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

      // A single prompt usually costs well under a cent, so amounts below $1
      // keep 4 decimals instead of rounding to $0.00.
      function fmtUsd(n) {
        if (n > 0 && n < 1) return '$' + n.toFixed(4);
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

      function computeModelCount(text, stats, mode) {
        const model = selectedModel();
        if (!model.encoding) {
          return {
            model, kind: 'estimate', count: estimateTokens(stats, model.family, mode), tokens: null, api: null,
            status: 'Estimate: ' + model.reason, error: '',
          };
        }
        const exactStatus = (window._t ? window._t('tools.token-counter.js.r65_0', 'Exact count for raw text with the {encoding} encoding (gpt-tokenizer 4.1.0). Special tokens such as <|endoftext|> are counted as plain text; chat message formatting adds a few tokens per message.') : 'Exact count for raw text with the {encoding} encoding (gpt-tokenizer 4.1.0). Special tokens such as <|endoftext|> are counted as plain text; chat message formatting adds a few tokens per message.').replace('{encoding}', model.encoding);
        if (!text) {
          return { model, kind: 'exact', count: 0, tokens: [], api: null, status: exactStatus, error: '' };
        }
        const entry = ensureTokenizer(model.encoding);
        if (entry.state === 'ready') {
          try {
            const tokens = entry.api.encode(text, ENCODE_OPTS);
            return { model, kind: 'exact', count: tokens.length, tokens, api: entry.api, status: exactStatus, error: '' };
          } catch (e) {
            entry.state = 'error';
            entry.error = 'the ' + model.encoding + ' tokenizer failed on this text (' + (e && e.message ? e.message : e) + ')';
          }
        }
        if (entry.state === 'loading') {
          return {
            model, kind: 'loading', count: null, tokens: null, api: null,
            status: 'Loading the ' + model.encoding + ' tokenizer from this site...', error: '',
          };
        }
        return {
          model, kind: 'estimate', count: estimateTokens(stats, 'gpt', mode), tokens: null, api: null, status: '',
          error: 'Exact count unavailable: ' + entry.error + '. Showing a heuristic estimate instead.',
        };
      }

      function renderModel(text, stats, mode, outTokens) {
        const r = computeModelCount(text, stats, mode);
        els.modelCount.textContent = r.count === null ? '...' : r.count.toLocaleString();
        els.modelKind.textContent = r.kind === 'exact' ? 'Exact' : r.kind === 'loading' ? 'Loading' : 'Estimate';
        els.modelKind.className = KIND_BASE + (r.kind === 'exact' ? KIND_CLASSES.exact : KIND_CLASSES.estimate);
        els.modelStatus.textContent = r.status;
        els.modelStatus.hidden = !r.status;
        els.modelError.textContent = r.error;
        els.modelError.hidden = !r.error;

        const usage = r.count === null ? null : contextUsage(r.count + outTokens, els.ctx.value);
        if (!usage) {
          els.ctxBar.style.width = '0%';
          els.ctxUsage.textContent = r.count === null ? 'Waiting for the tokenizer...' : _t('tools.token-counter.ui.r3_6', 'Enter a context window to see usage.');
        } else {
          els.ctxBar.style.width = usage.barPercent + '%';
          els.ctxBar.className = 'h-2 transition-all ' + (usage.over ? 'bg-red-500' : 'bg-primary-500');
          els.ctxUsage.textContent = usage.percentLabel + ' used (input + expected output, ' + usage.used.toLocaleString() + ' of ' + usage.window.toLocaleString() + ') - ' +
            (usage.over ? 'over by ' + (-usage.remaining).toLocaleString() + ' tokens' : usage.remaining.toLocaleString() + ' remaining');
        }

        if (r.tokens && r.api && r.tokens.length) {
          const shown = r.tokens.length > VIEW_CAP ? r.tokens.slice(0, VIEW_CAP) : r.tokens;
          els.tokensView.innerHTML = renderTokenSpans(segmentTokens(shown, r.api.decode, text));
          els.tokensNote.textContent = r.tokens.length > VIEW_CAP
            ? 'Showing the first ' + VIEW_CAP.toLocaleString() + ' of ' + r.tokens.length.toLocaleString() + ' tokens (' + r.model.encoding + '). Hover a span for its token count.'
            : r.tokens.length.toLocaleString() + ' tokens (' + r.model.encoding + '). Alternating colors mark token boundaries; hover a span for its token count.';
        } else {
          els.tokensView.textContent = '';
          els.tokensNote.textContent = 'Token boundaries are shown for exact (OpenAI) encodings once the tokenizer has loaded.';
        }
        return r;
      }

      let lastModelResult = null;

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

        lastModelResult = renderModel(text, stats, mode, outTokens);

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
      els.ctx.addEventListener('input', scheduleUpdate);
      els.model.addEventListener('change', () => {
        const m = selectedModel();
        els.ctx.value = m.contextWindow ? String(m.contextWindow) : '';
        scheduleUpdate();
      });
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
          t('text6', 'GPT family: in={in}, out={out}, total={total}')
            .replace('{in}', String(gptIn)).replace('{out}', String(outTokens)).replace('{total}', String(gptIn + outTokens)),
          t('text7', 'Claude family: in={in}, out={out}, total={total}')
            .replace('{in}', String(claudeIn)).replace('{out}', String(outTokens)).replace('{total}', String(claudeIn + outTokens)),
          t('text8', 'Llama / Gemini family: in={in}, out={out}, total={total}')
            .replace('{in}', String(llamaIn)).replace('{out}', String(outTokens)).replace('{total}', String(llamaIn + outTokens)),
          '',
          (lastModelResult && lastModelResult.count !== null)
            ? 'Selected model: ' + lastModelResult.model.label + ' - ' + lastModelResult.count + ' input tokens (' + (lastModelResult.kind === 'exact' ? 'exact, ' + lastModelResult.model.encoding : 'estimate') + ')'
            : 'Selected model: ' + selectedModel().label + ' - tokenizer still loading',
          '',
          t('text9', 'Note: These are heuristic estimates, not exact tokenizer counts.')
        ];

        els.copyStatus.textContent = '';
        try {
          await navigator.clipboard.writeText(lines.join('\n'));
        } catch (e) {
          els.copyStatus.textContent = _t('tools.token-counter.js.r4_0', 'Copy failed: the browser blocked clipboard access.');
          return;
        }
        const old = els.copy.innerHTML;
        els.copy.textContent = t('text10', '✓ Copied');
        if (window.Toast && window._t) window.Toast.success(window._t('common.copied', 'Copied!'));
        setTimeout(() => (els.copy.innerHTML = old), 1200);
      });

      hydrateRates();
      {
        const m = selectedModel();
        els.ctx.value = m.contextWindow ? String(m.contextWindow) : '';
      }
      update();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: "/token-counter",
    content,
    scripts,
    lang: currentLang,
  });
}
