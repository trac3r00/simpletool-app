// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  handleKanbanAutomationRoutes,
  extractIssueRefs,
  detectThemes,
  computeScore,
  generateProposal
} from './kanban-automation.js';

describe('kanban-automation route', () => {
  it('should return HTML 200 for GET /kanban-automation', async () => {
    const url = new URL('http://localhost/kanban-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleKanbanAutomationRoutes(request, url);
    expect(response).not.toBeNull();
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('kanban-input');
    expect(text).toContain('analyze-btn');
    expect(text).toContain('proposal-output');
  });

  it('should return null for unmatched paths', async () => {
    const url = new URL('http://localhost/other');
    const request = new Request(url, { method: 'GET' });
    const response = await handleKanbanAutomationRoutes(request, url);
    expect(response).toBeNull();
  });
});

describe('extractIssueRefs', () => {
  it('finds simpletool-app#34 style refs', () => {
    const text = 'We need to fix simpletool-app#34 and simpletool-app#48 before release.';
    expect(extractIssueRefs(text)).toEqual(['simpletool-app#34', 'simpletool-app#48']);
  });

  it('deduplicates repeated refs', () => {
    const text = 'simpletool-app#34 simpletool-app#34 simpletool-app#34';
    expect(extractIssueRefs(text)).toEqual(['simpletool-app#34']);
  });

  it('returns empty array when no refs', () => {
    expect(extractIssueRefs('no issues here')).toEqual([]);
  });
});

describe('detectThemes', () => {
  it('finds recurring keywords', () => {
    const text = 'The authentication module needs work. Authentication is critical. We must improve auth flow and also fix the authentication bug.';
    const themes = detectThemes(text);
    expect(themes.length).toBeGreaterThan(0);
    expect(themes[0].word).toBe('authentication');
    expect(themes[0].count).toBeGreaterThanOrEqual(3);
  });

  it('ignores stop words', () => {
    const text = 'the and or but in on at to for of with by';
    expect(detectThemes(text)).toEqual([]);
  });
});

describe('computeScore', () => {
  it('returns higher score for security-related text', () => {
    const refs = ['simpletool-app#1', 'simpletool-app#2', 'simpletool-app#3'];
    const themes = [{ word: 'security', count: 3 }, { word: 'authentication', count: 2 }];
    const text = 'Critical security vulnerability and crash blocker. Acceptance criteria needed.';
    const result = computeScore(refs, themes, text);
    expect(result.score).toBeGreaterThan(50);
    expect(result.readiness).toContain('High');
  });

  it('returns lower score for vague text', () => {
    const refs = [];
    const themes = [];
    const text = 'some stuff';
    const result = computeScore(refs, themes, text);
    expect(result.score).toBeLessThan(40);
    expect(result.readiness).toContain('Low');
  });
});

describe('generateProposal', () => {
  it('includes issue refs and themes', () => {
    const refs = ['simpletool-app#34', 'simpletool-app#48'];
    const themes = [{ word: 'performance', count: 3 }];
    const proposal = generateProposal(refs, themes, 75, 'High — ready for triage');
    expect(proposal).toContain('simpletool-app#34');
    expect(proposal).toContain('simpletool-app#48');
    expect(proposal).toContain('performance');
    expect(proposal).toContain('75/100');
    expect(proposal).toContain('High — ready for triage');
  });
});
