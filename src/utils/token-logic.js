/**
 * Pure helpers for the token counter (src/routes/token-counter.js).
 *
 * The functions are injected into the page's inline <script> via
 * `fn.toString()`, so each one must stay self-contained: no imports, no
 * closures over module scope. The data constants are injected as JSON.
 */

/**
 * Vendored gpt-tokenizer 4.1.0 bundles (built by scripts/build-vendor.js).
 * `integrity` is the SRI SHA-384 of the shipped file; token-logic.test.js
 * recomputes it from dist/vendor so a rebuilt bundle cannot ship stale.
 */
export const TOKENIZER_BUNDLES = {
  o200k_base: {
    src: "/vendor/gpt-tokenizer-o200k_base.min.js",
    integrity:
      "sha384-lU4YN0JsXL7pRp21XM+YYllCT4F1qhiw+k7SFBCmLSj4MYPFm0QpJJnwvU3MamFE",
    global: "GPTTokenizer_o200k_base",
  },
  cl100k_base: {
    src: "/vendor/gpt-tokenizer-cl100k_base.min.js",
    integrity:
      "sha384-V/aC+fKm+MSXFZXAHGqr0YDj3JjAYuCpNOr+Z3hXttjwHC2Ix5SMkT1cQmuxYxKQ",
    global: "GPTTokenizer_cl100k_base",
  },
};

// contextWindow: null where no published value is certain (field left empty).
export const TOKEN_MODELS = [
  { id: "gpt-5", label: "GPT-5", group: "OpenAI (exact)", encoding: "o200k_base", contextWindow: 400000 },
  { id: "gpt-4.1", label: "GPT-4.1", group: "OpenAI (exact)", encoding: "o200k_base", contextWindow: 1047576 },
  { id: "gpt-4.1-mini", label: "GPT-4.1 mini", group: "OpenAI (exact)", encoding: "o200k_base", contextWindow: 1047576 },
  { id: "gpt-4o", label: "GPT-4o", group: "OpenAI (exact)", encoding: "o200k_base", contextWindow: 128000 },
  { id: "gpt-4o-mini", label: "GPT-4o mini", group: "OpenAI (exact)", encoding: "o200k_base", contextWindow: 128000 },
  { id: "o3", label: "o3", group: "OpenAI (exact)", encoding: "o200k_base", contextWindow: 200000 },
  { id: "o4-mini", label: "o4-mini", group: "OpenAI (exact)", encoding: "o200k_base", contextWindow: 200000 },
  { id: "o1", label: "o1", group: "OpenAI (exact)", encoding: "o200k_base", contextWindow: 200000 },
  { id: "gpt-4-turbo", label: "GPT-4 Turbo", group: "OpenAI (exact)", encoding: "cl100k_base", contextWindow: 128000 },
  { id: "gpt-4", label: "GPT-4", group: "OpenAI (exact)", encoding: "cl100k_base", contextWindow: 8192 },
  { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", group: "OpenAI (exact)", encoding: "cl100k_base", contextWindow: 16385 },
  {
    id: "claude",
    label: "Claude (Sonnet / Opus 4.x)",
    group: "Estimate only",
    encoding: null,
    family: "claude",
    contextWindow: 200000,
    reason: "Anthropic has not published the tokenizer for current Claude models, so this is a byte-based heuristic.",
  },
  {
    id: "gemini",
    label: "Gemini 2.5 Pro / Flash",
    group: "Estimate only",
    encoding: null,
    family: "llama",
    contextWindow: 1048576,
    reason: "Gemini's SentencePiece tokenizer is not bundled in this page, so this is a byte-based heuristic.",
  },
  {
    id: "llama",
    label: "Llama 3.x",
    group: "Estimate only",
    encoding: null,
    family: "llama",
    contextWindow: null,
    reason: "Llama tokenizers differ by version and none is bundled in this page, so this is a byte-based heuristic.",
  },
];

export const TOKEN_VIEW_CAP = 2000;

export function contextUsage(used, windowSize) {
  const w = Number(windowSize);
  if (!Number.isFinite(w) || w <= 0) return null;
  const u = Math.max(0, Number(used) || 0);
  const percent = (u / w) * 100;
  return {
    used: u,
    window: w,
    percent: percent,
    percentLabel: (Math.round(percent * 10) / 10).toFixed(1) + "%",
    remaining: w - u,
    over: u > w,
    barPercent: Math.min(100, percent),
  };
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Split `tokens` into display segments whose texts concatenate to the
 * decoded text. A token can hold part of a UTF-8 character (decoding it alone
 * yields U+FFFD), so consecutive tokens are grouped until the group decodes to
 * exactly the next slice of `input`. `exact: false` marks a trailing group
 * that never matched (e.g. a token list cut mid-character).
 */
export function segmentTokens(tokens, decode, input) {
  const segments = [];
  const text = String(input);
  let pos = 0;
  let group = [];
  for (let i = 0; i < tokens.length; i++) {
    group.push(tokens[i]);
    const s = decode(group);
    if (s.length > 0 && text.startsWith(s, pos)) {
      segments.push({ text: s, tokens: group.length, exact: true });
      pos += s.length;
      group = [];
    }
  }
  if (group.length > 0) {
    segments.push({ text: decode(group), tokens: group.length, exact: false });
  }
  return segments;
}

export function renderTokenSpans(segments) {
  const classes = [
    "bg-primary-100 dark:bg-primary-900/40",
    "bg-info-100 dark:bg-info-900/30",
  ];
  let html = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const title = seg.tokens === 1 ? "1 token" : seg.tokens + " tokens (one character split across tokens)";
    html +=
      '<span class="rounded-sm ' + classes[i % 2] + '" title="' + title + '">' +
      escapeHtml(seg.text) +
      "</span>";
  }
  return html;
}
