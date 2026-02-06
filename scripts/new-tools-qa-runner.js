/**
 * New Tools QA Runner (Node-only)
 * - Executes each tool's inline <script> in a VM with minimal DOM stubs
 * - Runs 100+ mock simulations without launching a real browser
 *
 * Usage:
 *   node scripts/new-tools-qa-runner.js
 */

import vm from 'node:vm';

import { handleEmailAnalyzerRoutes } from '../src/routes/email-analyzer.js';
import { handleTokenCounterRoutes } from '../src/routes/token-counter.js';
import { handlePromptTemplateBuilderRoutes } from '../src/routes/prompt-template-builder.js';
import { handleSQLFormatterRoutes } from '../src/routes/sql-formatter.js';
import { handleEnvVarManagerRoutes } from '../src/routes/env-var-manager.js';
import { handleSVGOptimizerRoutes } from '../src/routes/svg-optimizer.js';
import { handleCSPBuilderRoutes } from '../src/routes/csp-builder.js';
import { handleSecretScannerRoutes } from '../src/routes/secret-scanner.js';

class LocalStorageStub {
  #m = new Map();
  getItem(k) { return this.#m.has(String(k)) ? this.#m.get(String(k)) : null; }
  setItem(k, v) { this.#m.set(String(k), String(v)); }
  removeItem(k) { this.#m.delete(String(k)); }
}

class ClassListStub {
  constructor(el) { this.el = el; }
  add(...names) {
    names.filter(Boolean).forEach(n => this.el._classSet.add(String(n)));
    this.el._syncClassName();
  }
  remove(...names) {
    names.filter(Boolean).forEach(n => this.el._classSet.delete(String(n)));
    this.el._syncClassName();
  }
  contains(name) { return this.el._classSet.has(String(name)); }
  toggle(name, force) {
    const n = String(name);
    const next = (typeof force === 'boolean') ? force : !this.contains(n);
    if (next) this.add(n); else this.remove(n);
    return next;
  }
}

const stripTags = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

class ElementStub {
  constructor(tagName = 'DIV', id = null) {
    this.tagName = String(tagName || 'DIV').toUpperCase();
    this.id = id ? String(id) : '';
    this.type = '';
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.style = {};
    this._className = '';
    this._classSet = new Set();
    this.classList = new ClassListStub(this);
    this._textContent = '';
    this._innerHTML = '';
    this._listeners = new Map();
    this.children = [];
    this.parentElement = null;
    this._attrs = new Map();
    this.dataset = {};
  }

  _syncClassName() { this._className = Array.from(this._classSet).join(' '); }

  get className() { return this._className; }
  set className(v) {
    this._className = String(v ?? '');
    this._classSet = new Set(this._className.split(/\s+/).filter(Boolean));
    this.classList = new ClassListStub(this);
  }

  get textContent() {
    if (this.children.length) {
      const parts = [];
      if (this._textContent) parts.push(this._textContent);
      this.children.forEach(ch => parts.push(ch?.textContent || ''));
      return parts.join(' ').replace(/\s+/g, ' ').trim();
    }
    return this._textContent;
  }
  set textContent(v) {
    this._textContent = String(v ?? '');
    this._innerHTML = '';
    this.children = [];
  }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(v) {
    this._innerHTML = String(v ?? '');
    this._textContent = stripTags(this._innerHTML);
    this.children = [];
  }

  get childElementCount() { return this.children.length; }

  setAttribute(name, value) {
    const n = String(name);
    this._attrs.set(n, String(value ?? ''));
    if (n === 'id') this.id = String(value ?? '');
    if (n === 'class') this.className = String(value ?? '');
    if (n.startsWith('data-')) {
      const key = n.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[key] = String(value ?? '');
    }
  }
  getAttribute(name) { return this._attrs.get(String(name)) ?? null; }
  removeAttribute(name) { this._attrs.delete(String(name)); }

  appendChild(child) {
    if (!child) return child;
    this.children.push(child);
    child.parentElement = this;
    return child;
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) this.children.splice(idx, 1);
    if (child) child.parentElement = null;
    return child;
  }
  remove() {
    if (this.parentElement) this.parentElement.removeChild(this);
  }

  addEventListener(type, handler) {
    const t = String(type);
    const list = this._listeners.get(t) || [];
    list.push(handler);
    this._listeners.set(t, list);
  }

  async dispatchEvent(evt) {
    const e = evt && typeof evt === 'object' ? evt : { type: String(evt) };
    e.type = String(e.type || '');
    e.target = e.target || this;
    const list = this._listeners.get(e.type) || [];
    for (const fn of list) {
      const r = fn.call(this, e);
      if (r && typeof r.then === 'function') await r;
    }
    return true;
  }

  async click() { return this.dispatchEvent({ type: 'click', target: this }); }
  focus() {}
}

class DocumentStub {
  constructor() {
    this._byId = new Map();
    this.body = new ElementStub('BODY', 'body');
  }

  seedElement(tagName, id, attrs = {}) {
    const el = new ElementStub(tagName, id);
    if (attrs.type) el.type = String(attrs.type);
    if (typeof attrs.value === 'string') el.value = attrs.value;
    if (attrs.checked) el.checked = true;
    if (attrs.disabled) el.disabled = true;
    if (attrs.className) el.className = attrs.className;
    this._byId.set(String(id), el);
    return el;
  }

  getElementById(id) {
    const key = String(id || '');
    if (!key) return null;
    if (this._byId.has(key)) return this._byId.get(key);
    const el = new ElementStub('DIV', key);
    this._byId.set(key, el);
    return el;
  }

  createElement(tagName) { return new ElementStub(tagName); }

  importNode(node, deep = false) {
    if (!node || typeof node !== 'object') return node;
    if (typeof node.cloneNode === 'function') return node.cloneNode(Boolean(deep));
    return node;
  }
}

function seedFromHtml(doc, html) {
  const re = /<(input|textarea|select|button|div|span|p|table|tbody|thead|tr|td|pre)\b([^>]*\bid="[^"]+"[^>]*)>/gi;
  let m;
  while ((m = re.exec(String(html || ''))) !== null) {
    const tag = m[1];
    const attrs = m[2] || '';
    const idm = attrs.match(/\bid="([^"]+)"/i);
    if (!idm) continue;
    const id = idm[1];
    if (!id || doc._byId?.has?.(id)) continue;
    const type = (attrs.match(/\btype="([^"]+)"/i)?.[1]) || '';
    const value = (attrs.match(/\bvalue="([^"]*)"/i)?.[1]);
    const checked = /\bchecked\b/i.test(attrs);
    const disabled = /\bdisabled\b/i.test(attrs);
    const className = (attrs.match(/\bclass="([^"]+)"/i)?.[1]) || '';
    doc.seedElement(tag, id, { type, value: (typeof value === 'string' ? value : ''), checked, disabled, className });
  }
}

function extractInlineScripts(html) {
  const scripts = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(String(html || ''))) !== null) {
    const attrs = m[1] || '';
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const code = String(m[2] || '').trim();
    if (code) scripts.push(code);
  }
  return scripts;
}

function pickToolScript(inlineScripts, marker) {
  const m = String(marker || '');
  const found = inlineScripts.find(s => s.includes(m));
  if (!found) throw new Error('Tool script not found (marker=' + m + ')');
  return found;
}

// --- Minimal XML DOM for SVG tool ---
class XMLNode {
  constructor(tagName, attrs = {}, ownerDocument = null) {
    this.tagName = String(tagName || '').toUpperCase();
    this.ownerDocument = ownerDocument;
    this.parentElement = null;
    this.children = [];
    this.style = {};
    this._attrs = new Map();
    Object.entries(attrs).forEach(([k, v]) => this._attrs.set(String(k), String(v)));
  }
  get attributes() {
    return Array.from(this._attrs.entries()).map(([name, value]) => ({ name, value }));
  }
  getAttribute(name) { return this._attrs.get(String(name)) ?? null; }
  setAttribute(name, value) { this._attrs.set(String(name), String(value ?? '')); }
  removeAttribute(name) { this._attrs.delete(String(name)); }
  appendChild(child) {
    if (!child) return child;
    this.children.push(child);
    child.parentElement = this;
    return child;
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) this.children.splice(idx, 1);
    if (child) child.parentElement = null;
    return child;
  }
  remove() { if (this.parentElement) this.parentElement.removeChild(this); }
  cloneNode(deep = false) {
    const copy = new XMLNode(this.tagName, Object.fromEntries(this._attrs), this.ownerDocument);
    if (deep) this.children.forEach(c => copy.appendChild(c.cloneNode(true)));
    return copy;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  querySelectorAll(selector) {
    const sel = String(selector || '').trim();
    const wantAll = sel === '*';
    const want = wantAll ? null : sel.toUpperCase();
    const out = [];
    const visit = (node) => {
      node.children.forEach(ch => {
        if (ch && typeof ch.tagName === 'string') {
          if (wantAll || ch.tagName === want) out.push(ch);
          visit(ch);
        }
      });
    };
    visit(this);
    return out;
  }
}

class TreeWalkerStub {
  constructor(root) {
    this.root = root;
    this.currentNode = root;
    this._nodes = root ? root.querySelectorAll('*') : [];
    this._i = 0;
  }
  nextNode() {
    if (this._i >= this._nodes.length) return false;
    this.currentNode = this._nodes[this._i++];
    return true;
  }
}

class XMLDocumentStub {
  constructor(root) {
    this.documentElement = root || null;
    if (this.documentElement) this.documentElement.ownerDocument = this;
  }
  querySelector(selector) {
    if (!this.documentElement) return null;
    const sel = String(selector || '').trim().toUpperCase();
    if (sel && this.documentElement.tagName === sel) return this.documentElement;
    return this.documentElement.querySelector(selector);
  }
  createTreeWalker(root) { return new TreeWalkerStub(root); }
}

function parseXmlAttributes(s) {
  const attrs = {};
  const re = /([A-Za-z_:][A-Za-z0-9_:\-\.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let m;
  while ((m = re.exec(String(s || ''))) !== null) {
    attrs[m[1]] = (m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

function parseSimpleXml(xml) {
  const s = String(xml || '');
  const stack = [];
  let root = null;
  let i = 0;

  while (i < s.length) {
    const lt = s.indexOf('<', i);
    if (lt < 0) break;
    const gt = s.indexOf('>', lt + 1);
    if (gt < 0) break;
    const rawTag = s.slice(lt + 1, gt).trim();
    i = gt + 1;

    if (!rawTag) continue;
    if (rawTag.startsWith('!--')) continue;
    if (rawTag.startsWith('?')) continue;
    if (/^!DOCTYPE/i.test(rawTag)) continue;

    if (rawTag[0] === '/') {
      stack.pop();
      continue;
    }

    const selfClosing = rawTag.endsWith('/');
    const inner = selfClosing ? rawTag.slice(0, -1).trim() : rawTag;
    const space = inner.search(/\s/);
    const tagName = (space >= 0 ? inner.slice(0, space) : inner).trim();
    const attrStr = (space >= 0 ? inner.slice(space + 1) : '');
    const attrs = parseXmlAttributes(attrStr);
    const node = new XMLNode(tagName, attrs, null);

    if (!root) root = node;
    const parent = stack[stack.length - 1] || null;
    if (parent) parent.appendChild(node);
    if (!selfClosing) stack.push(node);
  }

  const doc = new XMLDocumentStub(root);
  const attachDoc = (n) => {
    if (!n) return;
    n.ownerDocument = doc;
    n.children.forEach(attachDoc);
  };
  attachDoc(root);
  return doc;
}

class DOMParserStub {
  parseFromString(markup) {
    try {
      return parseSimpleXml(markup);
    } catch (e) {
      return new XMLDocumentStub(null);
    }
  }
}

function serializeAttrs(map) {
  const parts = [];
  for (const [k, v] of map.entries()) {
    const val = String(v ?? '').replace(/"/g, '&quot;');
    parts.push(`${k}="${val}"`);
  }
  return parts.length ? ' ' + parts.join(' ') : '';
}

function serializeXmlNode(node) {
  const tag = node.tagName.toLowerCase();
  const attrs = serializeAttrs(node._attrs);
  if (!node.children.length) return `<${tag}${attrs}/>`;
  return `<${tag}${attrs}>${node.children.map(serializeXmlNode).join('')}</${tag}>`;
}

class XMLSerializerStub {
  serializeToString(node) {
    if (!node) return '';
    return serializeXmlNode(node);
  }
}

function createVm(toolHtml, marker, extra = {}) {
  const document = new DocumentStub();
  seedFromHtml(document, toolHtml);

  const env = {
    document,
    window: null,
    globalThis: null,
    localStorage: new LocalStorageStub(),
    navigator: {
      clipboard: {
        writeText: async (t) => { env.__clipboard = String(t ?? ''); }
      }
    },
    console: {
      log: (...args) => { env.__logs.push(['log', ...args]); },
      warn: (...args) => { env.__logs.push(['warn', ...args]); },
      error: (...args) => { env.__logs.push(['error', ...args]); },
    },
    __logs: [],
    __clipboard: '',
    setTimeout: (fn) => { try { fn(); } catch (e) {} return 0; },
    clearTimeout: () => {},
    TextEncoder,
    URL,
    Blob: globalThis.Blob,
    NodeFilter: { SHOW_ELEMENT: 1 },
    DOMParser: DOMParserStub,
    XMLSerializer: XMLSerializerStub,
    ...extra,
  };
  env.window = env;
  env.globalThis = env;

  const ctx = vm.createContext(env);
  const toolScript = pickToolScript(extractInlineScripts(toolHtml), marker);
  vm.runInContext(toolScript, ctx, { timeout: 1500 });
  return env;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function numText(el) {
  const t = (el?.textContent ?? '').toString().replace(/,/g, '').trim();
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

function findFirstDescendant(el, predicate) {
  const stack = [el].filter(Boolean);
  while (stack.length) {
    const cur = stack.shift();
    if (cur && predicate(cur)) return cur;
    if (cur?.children?.length) stack.unshift(...cur.children);
  }
  return null;
}

async function runEmailAnalyzer() {
  const url = new URL('http://local/email-analyzer');
  const req = new Request(url.toString(), { method: 'GET' });
  const res = await handleEmailAnalyzerRoutes(req, url);
  const html = await res.text();
  const env = createVm(html, 'email-input');

  const cases = [
    {
      name: 'all pass',
      raw: [
        'Return-Path: <bounce@mailer.example.net>',
        'Authentication-Results: mx;',
        ' spf=pass smtp.mailfrom=bounce@mailer.example.net;',
        ' dkim=pass header.i=@example.net header.s=s1;',
        ' dmarc=pass header.from=example.net',
        'From: billing@example.net',
        'To: soc@example.com',
        'Subject: Invoice',
        '',
        'Hello https://example.net/pay'
      ].join('\n'),
      exp: { spf: 'pass', dkim: 'pass', dmarc: 'pass' }
    },
    {
      name: 'dmarc fail',
      raw: [
        'Authentication-Results: mx; spf=pass smtp.mailfrom=a@evil.tld; dkim=pass header.i=@evil.tld; dmarc=fail header.from=example.com',
        'From: ceo@example.com',
        'Reply-To: attacker@evil.tld',
        'To: finance@example.com',
        'Subject: urgent',
        '',
        'pay now http://xn--exmple-qta.net'
      ].join('\n'),
      exp: { spf: 'pass', dkim: 'pass', dmarc: 'fail' }
    },
    {
      name: 'spf fail',
      raw: [
        'Authentication-Results: mx; spf=fail smtp.mailfrom=a@example.net; dkim=pass header.i=@example.net; dmarc=fail header.from=example.net',
        'From: a@example.net',
        'To: b@example.net',
        'Subject: test',
        '',
        'https://example.net'
      ].join('\n'),
      exp: { spf: 'fail', dkim: 'pass', dmarc: 'fail' }
    },
    {
      name: 'received-spf fallback',
      raw: [
        'Received-SPF: pass (domain of example.net designates 203.0.113.10 as permitted sender)',
        'From: a@example.net',
        'To: b@example.net',
        'Subject: test',
        '',
        'no links'
      ].join('\n'),
      exp: { spf: 'pass', dkim: 'unknown', dmarc: 'unknown' }
    },
    {
      name: 'no auth headers',
      raw: [
        'From: a@example.net',
        'To: b@example.net',
        'Subject: test',
        '',
        'https://example.net'
      ].join('\n'),
      exp: { spf: 'unknown', dkim: 'unknown', dmarc: 'unknown' }
    },
  ];
  while (cases.length < 20) {
    const i = cases.length + 1;
    const spf = (i % 3 === 0) ? 'fail' : 'pass';
    const dkim = (i % 4 === 0) ? 'fail' : 'pass';
    const dmarc = (spf === 'pass' && dkim === 'pass') ? 'pass' : (i % 2 ? 'fail' : 'pass');
    const url2 = (i % 5 === 0) ? `http://203.0.113.${i}` : `https://example.net/path/${i}`;
    cases.push({
      name: 'gen-' + i,
      raw: [
        `Authentication-Results: mx; spf=${spf} smtp.mailfrom=a@example.net; dkim=${dkim} header.i=@example.net; dmarc=${dmarc} header.from=example.net`,
        `Received: from mail.example.net (mail.example.net [203.0.113.${i}]) by mx with ESMTP; Tue, 21 Jan 2025 10:20:30 -0800`,
        'From: a@example.net',
        'To: b@example.net',
        'Subject: test ' + i,
        '',
        'See: ' + url2
      ].join('\n'),
      exp: { spf, dkim, dmarc }
    });
  }

  const input = env.document.getElementById('email-input');
  const analyze = env.document.getElementById('analyze-btn');
  env.document.getElementById('include-body-urls').checked = true;

  let passed = 0;
  const failures = [];
  for (const tc of cases) {
    try {
      input.value = tc.raw;
      await analyze.click();
      const spf = env.document.getElementById('spf-result').textContent.toLowerCase();
      const dkim = env.document.getElementById('dkim-result').textContent.toLowerCase();
      const dmarc = env.document.getElementById('dmarc-result').textContent.toLowerCase();
      assert(spf.includes(tc.exp.spf), tc.name + ': spf expected ' + tc.exp.spf + ' got ' + spf);
      assert(dkim.includes(tc.exp.dkim), tc.name + ': dkim expected ' + tc.exp.dkim + ' got ' + dkim);
      assert(dmarc.includes(tc.exp.dmarc), tc.name + ': dmarc expected ' + tc.exp.dmarc + ' got ' + dmarc);
      passed++;
    } catch (e) {
      failures.push({ name: tc.name, error: String(e?.message || e) });
    }
  }
  return { tool: 'Email Security Analyzer', total: cases.length, passed, failures };
}

async function runTokenCounter() {
  const url = new URL('http://local/token-counter');
  const req = new Request(url.toString(), { method: 'GET' });
  const res = await handleTokenCounterRoutes(req, url);
  const html = await res.text();
  const env = createVm(html, 'gpt-in-rate');

  const texts = [
    'hello world',
    '한국어 문장 하나입니다. 토큰이 어떻게 추정되는지 확인합니다.',
    '日本語の文章です。トークン推定の確認。',
    'function hello(){return \"world\";}',
    JSON.stringify({ a: 1, b: [1, 2, 3], c: { nested: true } }),
    'A'.repeat(2000),
    'The quick brown fox jumps over the lazy dog.'.repeat(50),
  ];
  while (texts.length < 20) texts.push('case-' + texts.length + ' ' + 'lorem ipsum '.repeat(texts.length + 5));

  const setVal = async (id, v) => {
    const el = env.document.getElementById(id);
    el.value = String(v);
    await el.dispatchEvent({ type: 'input', target: el });
    await el.dispatchEvent({ type: 'change', target: el });
  };

  await setVal('gpt-in-rate', '5');
  await setVal('gpt-out-rate', '15');
  await setVal('out-tokens', '1000');

  const textEl = env.document.getElementById('text');
  let passed = 0;
  const failures = [];
  for (const [i, t] of texts.entries()) {
    try {
      textEl.value = t;
      await textEl.dispatchEvent({ type: 'input', target: textEl });
      const gptIn = numText(env.document.getElementById('gpt-in'));
      assert(gptIn > 0, 'text-' + i + ': gptIn should be > 0');
      passed++;
    } catch (e) {
      failures.push({ name: 'text-' + i, error: String(e?.message || e) });
    }
  }

  const costText = env.document.getElementById('gpt-cost').textContent || '';
  if (!/\$\d+\.\d{2}/.test(costText)) {
    failures.push({ name: 'cost', error: 'Expected $d.dd, got ' + costText });
  }

  return { tool: 'Token Counter & Cost Estimator', total: texts.length + 1, passed: passed + (/\$\d+\.\d{2}/.test(costText) ? 1 : 0), failures };
}

async function runPromptTemplateBuilder() {
  const url = new URL('http://local/prompt-template-builder');
  const req = new Request(url.toString(), { method: 'GET' });
  const res = await handlePromptTemplateBuilderRoutes(req, url);
  const html = await res.text();
  const env = createVm(html, 'copy-system');

  const configs = [
    { target: 'gpt', outFormat: 'markdown', role: 'You are a senior backend engineer.', task: 'Explain this stacktrace and propose fixes.', vars: 'stacktrace, context' },
    { target: 'claude', outFormat: 'json', role: 'You are a security engineer.', task: 'Generate an incident triage plan.', vars: 'incident_summary, logs' },
    { target: 'generic', outFormat: 'checklist', role: 'You are an SRE.', task: 'Write a runbook to diagnose latency spikes.', vars: 'service_name, metrics' },
  ];
  while (configs.length < 15) configs.push({ target: 'gpt', outFormat: 'markdown', role: 'You are a helpful assistant.', task: 'Summarize: ' + configs.length, vars: 'input' });

  const setVal = async (id, v) => {
    const el = env.document.getElementById(id);
    el.value = String(v);
    await el.dispatchEvent({ type: 'input', target: el });
    await el.dispatchEvent({ type: 'change', target: el });
  };

  let passed = 0;
  const failures = [];
  for (const [i, c] of configs.entries()) {
    try {
      await setVal('target', c.target);
      await setVal('out-format', c.outFormat);
      await setVal('role', c.role);
      await setVal('task', c.task);
      await setVal('vars', c.vars);

      if (c.target === 'claude') {
        const user = env.document.getElementById('user').value || '';
        assert(user.includes('<task>'), 'cfg-' + i + ': expected <task> in user');
      } else if (c.target === 'generic') {
        const single = env.document.getElementById('single').value || '';
        assert(single.includes('Task:'), 'cfg-' + i + ': expected Task: in single');
      } else {
        const user = env.document.getElementById('user').value || '';
        assert(user.includes('# Task'), 'cfg-' + i + ': expected # Task in user');
      }
      passed++;
    } catch (e) {
      failures.push({ name: 'cfg-' + i, error: String(e?.message || e) });
    }
  }

  return { tool: 'Prompt Template Builder', total: configs.length, passed, failures };
}

async function runSQLFormatter() {
  const url = new URL('http://local/sql-formatter');
  const req = new Request(url.toString(), { method: 'GET' });
  const res = await handleSQLFormatterRoutes(req, url);
  const html = await res.text();
  const env = createVm(html, 'sql-in');

  const queries = [
    { sql: 'select id,email from users where id=1 and active=true order by created_at desc;', valid: true },
    { sql: "SELECT * FROM t WHERE name = 'unterminated;", valid: false, expect: 'Unclosed single-quoted string' },
    { sql: 'SELECT (1 + 2 FROM t;', valid: false, expect: 'Unbalanced parentheses' },
    { sql: '/* comment without end SELECT 1;', valid: false, expect: 'Unclosed block comment' },
    { sql: 'SELECT a, b, c FROM t;', valid: true },
  ];
  while (queries.length < 30) {
    const i = queries.length;
    const ok = i % 5 !== 0;
    queries.push({
      sql: ok ? `SELECT col${i}, col${i + 1} FROM t WHERE a=${i} AND b=${i + 1};` : `SELECT col${i} FROM t WHERE a='oops;`,
      valid: ok,
    });
  }

  const input = env.document.getElementById('sql-in');
  const out = env.document.getElementById('sql-out');
  const formatBtn = env.document.getElementById('format');
  const validateBtn = env.document.getElementById('validate');
  const issues = env.document.getElementById('issues');

  let passed = 0;
  const failures = [];
  for (const [i, q] of queries.entries()) {
    try {
      input.value = q.sql;
      await formatBtn.click();
      assert(String(out.value || '').includes('\n'), 'q-' + i + ': formatted output should contain newline');

      await validateBtn.click();
      const issuesText = (issues.textContent || '').toString();
      if (q.valid) {
        assert(/No issues detected|✓/i.test(issuesText), 'q-' + i + ': expected no issues, got ' + issuesText);
      } else if (q.expect) {
        assert(issuesText.includes(q.expect), 'q-' + i + ': expected "' + q.expect + '" got ' + issuesText);
      }
      passed++;
    } catch (e) {
      failures.push({ name: 'q-' + i, error: String(e?.message || e) });
    }
  }

  return { tool: 'SQL Formatter & Validator', total: queries.length, passed, failures };
}

async function runEnvVarManager() {
  const url = new URL('http://local/env-var-manager');
  const req = new Request(url.toString(), { method: 'GET' });
  const res = await handleEnvVarManagerRoutes(req, url);
  const html = await res.text();
  const env = createVm(html, 'env-a');

  const pairs = [
    { a: 'A=1\nB=2\nJWT_SECRET=devsecret', b: 'A=1\nB=3\nJWT_SECRET=prodsecret\nC=9', exp: { same: 1, changed: 2, onlyA: 0, onlyB: 1 } },
    { a: 'API_URL=https://dev\nPASSWORD=\"abc12345\"\n', b: 'API_URL=https://dev\nPASSWORD=\"abc12345\"\n', exp: { same: 2, changed: 0, onlyA: 0, onlyB: 0 } },
    { a: 'export X=1\nY=2 # comment', b: 'X=1\nY=2\nZ=3', exp: { same: 2, changed: 0, onlyA: 0, onlyB: 1 } },
  ];
  while (pairs.length < 18) {
    const i = pairs.length;
    pairs.push({
      a: `K${i}=A${i}\nSECRET_${i}=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`,
      b: `K${i}=B${i}\nSECRET_${i}=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\nONLY_${i}=x`,
      exp: { same: 0, changed: 2, onlyA: 0, onlyB: 1 }
    });
  }

  const envA = env.document.getElementById('env-a');
  const envB = env.document.getElementById('env-b');
  const compare = env.document.getElementById('compare');

  let passed = 0;
  const failures = [];
  for (const [i, p] of pairs.entries()) {
    try {
      envA.value = p.a;
      envB.value = p.b;
      await compare.click();

      const same = numText(env.document.getElementById('same-count'));
      const changed = numText(env.document.getElementById('changed-count'));
      const onlyA = numText(env.document.getElementById('only-a-count'));
      const onlyB = numText(env.document.getElementById('only-b-count'));

      assert(same === p.exp.same, 'pair-' + i + ': same ' + same + ' != ' + p.exp.same);
      assert(changed === p.exp.changed, 'pair-' + i + ': changed ' + changed + ' != ' + p.exp.changed);
      assert(onlyA === p.exp.onlyA, 'pair-' + i + ': onlyA ' + onlyA + ' != ' + p.exp.onlyA);
      assert(onlyB === p.exp.onlyB, 'pair-' + i + ': onlyB ' + onlyB + ' != ' + p.exp.onlyB);
      passed++;
    } catch (e) {
      failures.push({ name: 'pair-' + i, error: String(e?.message || e) });
    }
  }

  return { tool: 'Environment Variable Manager', total: pairs.length, passed, failures };
}

function makeDomPurifyStub() {
  return {
    sanitize: (input) => {
      const s = String(input || '');
      return s
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
        .replace(/<(iframe|object|embed)[\s\S]*?<\/\1>/gi, '');
    }
  };
}

async function runSVGOptimizer() {
  const url = new URL('http://local/svg-optimizer');
  const req = new Request(url.toString(), { method: 'GET' });
  const res = await handleSVGOptimizerRoutes(req, url);
  const html = await res.text();
  const env = createVm(html, 'svg-input', { DOMPurify: makeDomPurifyStub() });

  const svgs = [
    '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 10 10\"><rect width=\"10\" height=\"10\" fill=\"#ff0000\"/></svg>',
    '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 10 10\" onload=\"alert(1)\"><circle cx=\"5\" cy=\"5\" r=\"4\" fill=\"#00ff00\"/></svg>',
    '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 10 10\"><script>alert(1)</script><path d=\"M0 0h10v10H0z\" fill=\"#000\"/></svg>',
    '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 10 10\"><g style=\"fill:#123456\"><path d=\"M0 0h10v10H0z\"/></g></svg>',
  ];
  while (svgs.length < 10) svgs.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M${svgs.length} 0h10v10H0z" fill="#${svgs.length}${svgs.length}${svgs.length}"/></svg>`);

  const input = env.document.getElementById('svg-input');
  const optimizeBtn = env.document.getElementById('optimize-btn');
  const previewBtn = env.document.getElementById('preview-btn');
  const out = env.document.getElementById('svg-output');
  const apply = env.document.getElementById('apply-colors');

  let passed = 0;
  const failures = [];
  for (const [i, svg] of svgs.entries()) {
    try {
      input.value = svg;
      await optimizeBtn.click();
      const outv = String(out.value || '');
      assert(outv.includes('<svg'), 'svg-' + i + ': output should contain <svg');
      assert(!outv.toLowerCase().includes('<script'), 'svg-' + i + ': output should not contain <script');
      assert(!outv.toLowerCase().includes('onload='), 'svg-' + i + ': output should not contain onload=');
      passed++;
    } catch (e) {
      failures.push({ name: 'svg-' + i, error: String(e?.message || e) });
    }
  }

  // recolor smoke test
  try {
    input.value = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#ff0000"/></svg>';
    await previewBtn.click();
    const colorsBox = env.document.getElementById('colors');
    const firstInput = findFirstDescendant(colorsBox, (n) => n?.tagName === 'INPUT');
    assert(firstInput, 'recolor: no color input rendered');
    firstInput.value = '#0000ff';
    await firstInput.dispatchEvent({ type: 'input', target: firstInput });
    await apply.click();
    assert(String(out.value || '').includes('#0000ff'), 'recolor: expected output to include #0000ff');
    passed++;
  } catch (e) {
    failures.push({ name: 'recolor', error: String(e?.message || e) });
  }

  return { tool: 'SVG Optimizer & Editor', total: svgs.length + 1, passed, failures };
}

async function runCSPBuilder() {
  const url = new URL('http://local/csp-builder');
  const req = new Request(url.toString(), { method: 'GET' });
  const res = await handleCSPBuilderRoutes(req, url);
  const html = await res.text();
  const env = createVm(html, 'csp-input');

  const applyBaseline = env.document.getElementById('apply-baseline');
  const out = env.document.getElementById('csp-output');
  const input = env.document.getElementById('csp-input');
  const parseBtn = env.document.getElementById('parse');
  const warnings = env.document.getElementById('warnings');

  let passed = 0;
  const failures = [];

  try {
    await applyBaseline.click();
    const v = String(out.value || '');
    assert(v.includes('Content-Security-Policy'), 'baseline: should include header name');
    assert(v.includes("object-src 'none'"), 'baseline: should include object-src none');
    passed++;
  } catch (e) {
    failures.push({ name: 'baseline', error: String(e?.message || e) });
  }

  const parseCases = [
    {
      name: 'parse-unsafe-inline',
      value: "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none';",
      expect: /unsafe-inline/i
    },
    {
      name: 'parse-star',
      value: "default-src 'self'; script-src *; object-src 'none'; base-uri 'none';",
      expect: /very permissive|\\*/i
    },
    {
      name: 'parse-missing-default',
      value: "script-src 'self'; object-src 'none'; base-uri 'none';",
      expect: /Missing default-src/i
    }
  ];

  for (const tc of parseCases) {
    try {
      input.value = tc.value;
      await parseBtn.click();
      const w = (warnings.textContent || warnings.innerHTML || '').toString();
      assert(tc.expect.test(w), tc.name + ': expected warning match ' + tc.expect);
      passed++;
    } catch (e) {
      failures.push({ name: tc.name, error: String(e?.message || e) });
    }
  }

  return { tool: 'CSP Header Builder', total: 1 + parseCases.length, passed, failures };
}

async function runSecretScanner() {
  const url = new URL('http://local/secret-scanner');
  const req = new Request(url.toString(), { method: 'GET' });
  const res = await handleSecretScannerRoutes(req, url);
  const html = await res.text();
  const env = createVm(html, 'copy-redacted');

  const input = env.document.getElementById('input');
  const scan = env.document.getElementById('scan');
  const includeLow = env.document.getElementById('include-low');
  const high = env.document.getElementById('high');
  const redacted = env.document.getElementById('redacted');
  const med = env.document.getElementById('med');
  const low = env.document.getElementById('low');

  let passed = 0;
  const failures = [];
  const cases = [
    { name: 'aws', text: 'AKIA0123456789ABCDE1', exp: { high: 1 } },
    { name: 'github', text: 'github_pat_1234567890_abcdefghijklmnopqrstuvwxyz', exp: { high: 1 } },
    { name: 'google', text: 'AIza' + 'a'.repeat(35), exp: { high: 1 } },
    { name: 'slack', text: 'xoxb-1234567890-abcdefg-hijklmnop', exp: { high: 1 } },
    { name: 'bearer', text: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.signature', exp: { med: 1 } },
    { name: 'password', text: 'password=\"supersecret\"', exp: { med: 1 } },
    { name: 'api_key_low', text: 'api_key: \"abcdefg1234567890\"', includeLow: true, exp: { low: 1 } },
    { name: 'private_key', text: '-----BEGIN PRIVATE KEY-----', exp: { high: 1 } },
    {
      name: 'combined',
      text: [
        'AWS_ACCESS_KEY_ID=AKIA0123456789ABCDE1',
        'GITHUB_TOKEN=ghp_0123456789abcdefghijklmnopqrstuvwxyzABCDEF0123',
        'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.signature',
        'password=\"supersecret\"',
        '-----BEGIN PRIVATE KEY-----',
      ].join('\n'),
      includeLow: true,
      exp: { high: 1, med: 1, redacted: 1 }
    }
  ];

  for (const tc of cases) {
    try {
      includeLow.checked = Boolean(tc.includeLow);
      input.value = tc.text;
      await scan.click();
      if (tc.exp.high) assert(numText(high) >= tc.exp.high, tc.name + ': expected high >= ' + tc.exp.high);
      if (tc.exp.med) assert(numText(med) >= tc.exp.med, tc.name + ': expected med >= ' + tc.exp.med);
      if (tc.exp.low) assert(numText(low) >= tc.exp.low, tc.name + ': expected low >= ' + tc.exp.low);
      if (tc.exp.redacted) assert(String(redacted.value || '').includes('[REDACTED:'), tc.name + ': expected redacted markers');
      passed++;
    } catch (e) {
      failures.push({ name: tc.name, error: String(e?.message || e) });
    }
  }

  return { tool: 'Secret Scanner', total: cases.length, passed, failures };
}

function scoreFrom(passed, total) {
  if (!total) return 1;
  const raw = Math.round((passed / total) * 100);
  return Math.min(100, Math.max(1, raw));
}

async function main() {
  const runs = [
    runEmailAnalyzer,
    runTokenCounter,
    runPromptTemplateBuilder,
    runSQLFormatter,
    runEnvVarManager,
    runSVGOptimizer,
    runCSPBuilder,
    runSecretScanner,
  ];

  const results = [];
  for (const fn of runs) {
    // eslint-disable-next-line no-await-in-loop
    const r = await fn();
    results.push({ ...r, score: scoreFrom(r.passed, r.total) });
  }

  const totalCases = results.reduce((a, r) => a + r.total, 0);
  const totalPassed = results.reduce((a, r) => a + r.passed, 0);

  console.log('\nNew Tools QA (Node VM) — Summary');
  console.log('Total cases:', totalCases, 'Passed:', totalPassed, 'Failed:', totalCases - totalPassed);
  console.log('');

  results.forEach(r => {
    console.log('- ' + r.tool + ': ' + r.passed + '/' + r.total + ' (score ' + r.score + ')');
    (r.failures || []).slice(0, 3).forEach(f => console.log('  - FAIL ' + f.name + ': ' + f.error));
    if ((r.failures || []).length > 3) console.log('  - … +' + ((r.failures || []).length - 3) + ' more');
  });

  const exitCode = results.some(r => r.passed !== r.total) ? 1 : 0;
  process.exitCode = exitCode;
}

await main();
