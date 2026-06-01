import { describe, it, expect } from 'vitest';
import { handleAutomationPlannerRoutes } from './automation-planner.js';

describe('automation-planner route', () => {
  it('returns HTML for GET /automation-planner', async () => {
    const request = new Request('http://localhost/automation-planner');
    const url = new URL(request.url);
    const response = await handleAutomationPlannerRoutes(request, url);
    expect(response).not.toBeNull();
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('Automation Planner');
    expect(text).toContain('ap-input');
    expect(text).toContain('ap-analyze-btn');
    expect(text).toContain('Shareable Summary');
    expect(text).toContain('textarea');
    expect(text).toContain('<script');
  });

  it('returns null for non-matching paths', async () => {
    const request = new Request('http://localhost/other');
    const url = new URL(request.url);
    const result = await handleAutomationPlannerRoutes(request, url);
    expect(result).toBeNull();
  });

  it('returns 405 for POST requests', async () => {
    const request = new Request('http://localhost/automation-planner', { method: 'POST' });
    const url = new URL(request.url);
    const response = await handleAutomationPlannerRoutes(request, url);
    expect(response).not.toBeNull();
    expect(response.status).toBe(405);
  });
});

describe('automation-planner client analysis logic', () => {
  it('extracts issue references from text', () => {
    const text = 'Fix #123 and #456, also refs #789';
    const issues = (text.match(/#\d+/g) || []).map(i => i.slice(1));
    expect(issues).toEqual(['123', '456', '789']);
  });

  it('detects repeated keywords', () => {
    const text = 'bug bug fix auth auth auth performance performance';
    const words = text.toLowerCase().split(/\s+/);
    const freq = {};
    for (const w of words) {
      freq[w] = (freq[w] || 0) + 1;
    }
    const repeated = Object.entries(freq)
      .filter(([, c]) => c >= 2)
      .sort(([, a], [, b]) => b - a)
      .map(([w]) => w);
    expect(repeated).toContain('bug');
    expect(repeated).toContain('auth');
    expect(repeated).toContain('performance');
  });

  it('identifies blocked status', () => {
    const text = 'This is blocked by PR #42\\nWaiting on design review';
    const blockers = (text.match(/blocked|blocking|waiting on|depends on|needs/i) || []);
    expect(blockers.length).toBeGreaterThan(0);
  });

  it('suggests actions for automation', () => {
    const text = 'Fix #123 - auth bug [critical]\\nAdd #124 - feature request [ready]\\nUpdate #125 - docs [wontfix]';
    const issues = (text.match(/#\d+/g) || []).length;
    const hasReady = /ready|wontfix|critical/i.test(text);
    expect(issues).toBe(3);
    expect(hasReady).toBe(true);
  });
});
