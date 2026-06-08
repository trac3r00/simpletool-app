// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { handleBranchDecisionRoutes, decideBranchAction } from './branch-decision.js';

describe('branch-decision route rendering', () => {
  it('should render on /branch-decision route', async () => {
    const url = new URL('http://localhost/branch-decision');
    const request = new Request(url, { method: 'GET' });
    const response = await handleBranchDecisionRoutes(request, url);
    expect(response).not.toBeNull();
    const text = await response.text();
    expect(text).toContain('branch-decision');
    expect(text).toContain('Branch Decision Helper');
  });

  it('should include all key UI elements', async () => {
    const url = new URL('http://localhost/branch-decision');
    const request = new Request(url, { method: 'GET' });
    const response = await handleBranchDecisionRoutes(request, url);
    const text = await response.text();

    expect(text).toContain('issue-triaged');
    expect(text).toContain('existing-pr');
    expect(text).toContain('scope-matches');
    expect(text).toContain('recent-activity');
    expect(text).toContain('automation-active');
    expect(text).toContain('decide-btn');
    expect(text).toContain('decision-output');
  });

  it('should not contain double-escape in client-side regex patterns', async () => {
    const url = new URL('http://localhost/branch-decision');
    const request = new Request(url, { method: 'GET' });
    const response = await handleBranchDecisionRoutes(request, url);
    const text = await response.text();
    expect(text).not.toContain('\\\\d');
  });
});

describe('decideBranchAction pure logic', () => {
  it('blocks when issue is not triaged', () => {
    const result = decideBranchAction({ issueTriaged: false });
    expect(result.decision).toBe('block');
    expect(result.reason).toContain('triage');
  });

  it('reuses when existing open PR matches scope', () => {
    const result = decideBranchAction({
      issueTriaged: true,
      existingPR: 'open',
      scopeMatches: true,
      recentActivity: false,
      automationActive: false
    });
    expect(result.decision).toBe('reuse');
    expect(result.reason).toContain('open');
  });

  it('reuses when automation is active and scope matches', () => {
    const result = decideBranchAction({
      issueTriaged: true,
      existingPR: 'none',
      scopeMatches: true,
      recentActivity: false,
      automationActive: true
    });
    expect(result.decision).toBe('reuse');
    expect(result.reason).toContain('automation');
  });

  it('creates new when previous PR was merged', () => {
    const result = decideBranchAction({
      issueTriaged: true,
      existingPR: 'merged',
      scopeMatches: true,
      recentActivity: false,
      automationActive: false
    });
    expect(result.decision).toBe('create-new');
    expect(result.reason).toContain('merged');
  });

  it('creates new when existing PR is closed and scope does not match', () => {
    const result = decideBranchAction({
      issueTriaged: true,
      existingPR: 'closed',
      scopeMatches: false,
      recentActivity: false,
      automationActive: false
    });
    expect(result.decision).toBe('create-new');
    expect(result.reason).toContain('closed');
  });

  it('creates new when open PR has no recent activity and scope mismatch', () => {
    const result = decideBranchAction({
      issueTriaged: true,
      existingPR: 'open',
      scopeMatches: false,
      recentActivity: false,
      automationActive: false
    });
    expect(result.decision).toBe('create-new');
    expect(result.reason).toContain('stale');
  });

  it('reuses open PR with recent activity even if scope initially mismatched (WIP)', () => {
    const result = decideBranchAction({
      issueTriaged: true,
      existingPR: 'open',
      scopeMatches: false,
      recentActivity: true,
      automationActive: false
    });
    expect(result.decision).toBe('reuse');
    expect(result.reason).toContain('activity');
  });

  it('defaults to create-new when no special conditions match', () => {
    const result = decideBranchAction({
      issueTriaged: true,
      existingPR: 'none',
      scopeMatches: false,
      recentActivity: false,
      automationActive: false
    });
    expect(result.decision).toBe('create-new');
    expect(result.reason).toContain('new');
  });

  it('creates new when PR is closed and scope matches (previous attempt done)', () => {
    const result = decideBranchAction({
      issueTriaged: true,
      existingPR: 'closed',
      scopeMatches: true,
      recentActivity: false,
      automationActive: false
    });
    expect(result.decision).toBe('create-new');
    expect(result.reason).toContain('closed');
  });
});
