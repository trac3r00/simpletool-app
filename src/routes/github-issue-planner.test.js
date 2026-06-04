// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { handleGithubIssuePlannerRoutes } from './github-issue-planner.js';
import { TOOLS } from '../utils/tool-registry.js';

describe('github-issue-planner route rendering', () => {
  it('should render on /github-issue-planner route', async () => {
    const url = new URL('http://localhost/github-issue-planner');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubIssuePlannerRoutes(request, url);
    expect(response).not.toBeNull();
    const text = await response.text();
    expect(text).toContain('github-issue-planner');
  });

  it('should include required UI element IDs', async () => {
    const url = new URL('http://localhost/github-issue-planner');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubIssuePlannerRoutes(request, url);
    const text = await response.text();

    expect(text).toContain('id="issue-input"');
    expect(text).toContain('id="analyze-issues-btn"');
    expect(text).toContain('id="automation-output"');
  });
});

describe('github-issue-planner registry metadata', () => {
  it('should exist in TOOLS with id github-issue-planner', () => {
    const tool = TOOLS.find((t) => t.id === 'github-issue-planner');
    expect(tool).toBeDefined();
  });

  it('should have keywords containing github, issue, kanban, trac3r00', () => {
    const tool = TOOLS.find((t) => t.id === 'github-issue-planner');
    expect(tool).toBeDefined();
    const keywords = tool.keywords || '';
    expect(keywords.toLowerCase()).toContain('github');
    expect(keywords.toLowerCase()).toContain('issue');
    expect(keywords.toLowerCase()).toContain('kanban');
    expect(keywords.toLowerCase()).toContain('trac3r00');
  });
});
