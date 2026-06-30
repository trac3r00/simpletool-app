/**
 * Public REST API v1 — exposes SimpleTool text transforms as JSON endpoints.
 *
 * Rate-limited separately from the web UI (stricter).
 * All processing is server-side (same Worker isolate).
 */

import base64Contract from '../contracts/base64.js';
import jsonFormatContract from '../contracts/json-format.js';
import urlEncodeContract from '../contracts/url-encode.js';
import caseConverterContract from '../contracts/case-converter.js';
import lineSortContract from '../contracts/line-sort.js';

// ── Contracts registry (API-facing subset) ──────────────────────────
const contracts = new Map();
for (const c of [base64Contract, jsonFormatContract, urlEncodeContract, caseConverterContract, lineSortContract]) {
  contracts.set(c.id, c);
}

// ── Rate limiting (API-specific, per-IP, in-memory) ─────────────────
const API_RATE_LIMIT_WINDOW_MS = 60_000;
const API_RATE_LIMIT_MAX = 30; // 30 req/min per IP
const apiRateLimiter = new Map();

function checkApiRateLimit(ip, now) {
  if (!ip || ip === 'unknown') return { limited: false, remaining: API_RATE_LIMIT_MAX, reset: now + API_RATE_LIMIT_WINDOW_MS };

  const entry = apiRateLimiter.get(ip);
  if (!entry || now - entry.start >= API_RATE_LIMIT_WINDOW_MS) {
    apiRateLimiter.set(ip, { count: 1, start: now });
    return { limited: false, remaining: API_RATE_LIMIT_MAX - 1, reset: now + API_RATE_LIMIT_WINDOW_MS };
  }

  entry.count += 1;
  const remaining = Math.max(0, API_RATE_LIMIT_MAX - entry.count);
  const reset = entry.start + API_RATE_LIMIT_WINDOW_MS;

  if (entry.count > API_RATE_LIMIT_MAX) {
    return { limited: true, remaining: 0, reset, retryAfterMs: Math.max(0, reset - now) };
  }
  return { limited: false, remaining, reset };
}

// Sweep stale entries every 200 API requests
let apiSweepCounter = 0;
function maybeSweepApiRateLimiter(now) {
  apiSweepCounter++;
  if (apiSweepCounter >= 200) {
    for (const [ip, entry] of apiRateLimiter.entries()) {
      if (now - entry.start >= API_RATE_LIMIT_WINDOW_MS) {
        apiRateLimiter.delete(ip);
      }
    }
    apiSweepCounter = 0;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function apiJSON(data, { status = 200, rateLimit = null } = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...CORS_HEADERS,
  };
  if (rateLimit) {
    headers['X-RateLimit-Limit'] = String(API_RATE_LIMIT_MAX);
    headers['X-RateLimit-Remaining'] = String(rateLimit.remaining);
    headers['X-RateLimit-Reset'] = String(Math.ceil(rateLimit.reset / 1000));
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function apiError(message, status = 400, rateLimit = null) {
  return apiJSON({ error: message }, { status, rateLimit });
}

async function readBody(request, maxBytes = 1_048_576) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return { error: 'Content-Type must be application/json' };
  }
  try {
    const text = await request.text();
    if (text.length > maxBytes) {
      return { error: `Request body exceeds ${maxBytes} bytes` };
    }
    return { data: JSON.parse(text) };
  } catch {
    return { error: 'Invalid JSON body' };
  }
}

// Input size limit (100KB of text input)
const MAX_INPUT_LENGTH = 102_400;

function validateInput(input) {
  if (typeof input !== 'string') return 'input must be a string';
  if (input.length > MAX_INPUT_LENGTH) return `input exceeds ${MAX_INPUT_LENGTH} characters`;
  return null;
}

// ── Route handlers ──────────────────────────────────────────────────

function handleListTransforms(rateLimit) {
  const tools = [];
  for (const [, c] of contracts) {
    tools.push({
      id: c.id,
      name: c.name,
      inputTypes: c.inputTypes,
      outputTypes: c.outputTypes,
      options: c.options || [],
    });
  }

  return apiJSON({
    version: 'v1',
    transforms: tools,
    rateLimit: { windowMs: API_RATE_LIMIT_WINDOW_MS, maxRequests: API_RATE_LIMIT_MAX },
  }, { rateLimit });
}

async function handleTransform(request, contractId, rateLimit) {
  const contract = contracts.get(contractId);
  if (!contract) {
    return apiError(`Unknown transform: ${contractId}. Use GET /api/v1/transforms for available transforms.`, 404, rateLimit);
  }

  if (request.method !== 'POST') {
    return apiError('Method not allowed. Use POST.', 405, rateLimit);
  }

  const body = await readBody(request);
  if (body.error) return apiError(body.error, 400, rateLimit);

  const { input, options } = body.data;
  const inputErr = validateInput(input);
  if (inputErr) return apiError(inputErr, 400, rateLimit);

  try {
    const output = contract.transform(input, options || {});
    return apiJSON({
      transform: contractId,
      input,
      options: options || {},
      output,
    }, { rateLimit });
  } catch (err) {
    return apiError(`Transform failed: ${err.message}`, 422, rateLimit);
  }
}

// ── Main router ─────────────────────────────────────────────────────
export async function handleApiV1(request, url) {
  const now = Date.now();
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';

  maybeSweepApiRateLimiter(now);

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Rate limit check
  const rateLimit = checkApiRateLimit(ip, now);
  if (rateLimit.limited) {
    const retryAfter = Math.ceil((rateLimit.retryAfterMs || 0) / 1000);
    return apiJSON(
      { error: 'Rate limit exceeded', retryAfterSeconds: retryAfter },
      { status: 429, rateLimit }
    );
  }

  // Strip /api/v1 prefix
  const path = url.pathname.replace(/^\/api\/v1/, '') || '/';

  // Route
  if (path === '/' || path === '/transforms') {
    return handleListTransforms(rateLimit);
  }

  if (path.startsWith('/transform/')) {
    const contractId = path.slice('/transform/'.length).replace(/\/$/, '');
    return handleTransform(request, contractId, rateLimit);
  }

  return apiError('Not found. Use GET /api/v1/transforms for available endpoints.', 404, rateLimit);
}
