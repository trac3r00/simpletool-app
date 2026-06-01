// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { handleKanbanDemandAnalyzerRoutes } from './kanban-demand-analyzer.js';

describe('kanban-demand-analyzer route rendering', () => {
  it('should render on /kanban-demand-analyzer route', async () => {
    const url = new URL('http://localhost/kanban-demand-analyzer');
    const request = new Request(url, { method: 'GET' });
    const response = await handleKanbanDemandAnalyzerRoutes(request, url);
    expect(response).not.toBeNull();
    const text = await response.text();
    expect(text).toContain('kanban-demand-analyzer');
    expect(text).toContain('Kanban Demand Analyzer');
  });

  it('should include all key UI elements', async () => {
    const url = new URL('http://localhost/kanban-demand-analyzer');
    const request = new Request(url, { method: 'GET' });
    const response = await handleKanbanDemandAnalyzerRoutes(request, url);
    const text = await response.text();

    expect(text).toContain('Paste Issue Text');
    expect(text).toContain('Analyze');
    expect(text).toContain('Extracted References');
    expect(text).toContain('Themes');
    expect(text).toContain('Product Value');
    expect(text).toContain('Proposal');
    expect(text).toContain('Export');
    expect(text).toContain('Privacy-First');
  });

  it('should not contain double-escaped regex patterns', async () => {
    const url = new URL('http://localhost/kanban-demand-analyzer');
    const request = new Request(url, { method: 'GET' });
    const response = await handleKanbanDemandAnalyzerRoutes(request, url);
    const text = await response.text();
    expect(text).not.toContain('\\\\d');
  });

  it('should include client-side analysis functions', async () => {
    const url = new URL('http://localhost/kanban-demand-analyzer');
    const request = new Request(url, { method: 'GET' });
    const response = await handleKanbanDemandAnalyzerRoutes(request, url);
    const text = await response.text();

    expect(text).toContain('extractReferences');
    expect(text).toContain('extractThemes');
    expect(text).toContain('scoreProductValue');
    expect(text).toContain('generateProposal');
  });

  it('should use dark: Tailwind variants', async () => {
    const url = new URL('http://localhost/kanban-demand-analyzer');
    const request = new Request(url, { method: 'GET' });
    const response = await handleKanbanDemandAnalyzerRoutes(request, url);
    const text = await response.text();

    expect(text).toContain('dark:bg-surface');
    expect(text).toContain('dark:text-surface');
    expect(text).toContain('dark:border-surface');
  });
});

describe('client-side extraction logic', () => {
  it('should extract repository references from text', async () => {
    const url = new URL('http://localhost/kanban-demand-analyzer');
    const request = new Request(url, { method: 'GET' });
    const response = await handleKanbanDemandAnalyzerRoutes(request, url);
    const text = await response.text();

    // The page should contain regex patterns for repo refs like org/repo#123
    expect(text).toContain('extractReferences');
    expect(text).toContain('github');
    expect(text).toContain('Fixes');
    expect(text).toContain('Closes');
    expect(text).toContain('Resolves');
    expect(text).toContain('/issues');
  });

  it('should score product value based on criteria', async () => {
    const url = new URL('http://localhost/kanban-demand-analyzer');
    const request = new Request(url, { method: 'GET' });
    const response = await handleKanbanDemandAnalyzerRoutes(request, url);
    const text = await response.text();

    expect(text).toContain('scoreProductValue');
    expect(text).toContain('userImpact');
    expect(text).toContain('businessValue');
    expect(text).toContain('effort');
    expect(text).toContain('risk');
  });

  it('should generate proposal text from analysis', async () => {
    const url = new URL('http://localhost/kanban-demand-analyzer');
    const request = new Request(url, { method: 'GET' });
    const response = await handleKanbanDemandAnalyzerRoutes(request, url);
    const text = await response.text();

    expect(text).toContain('generateProposal');
    expect(text).toContain('Triage');
    expect(text).toContain('Priority');
    expect(text).toContain('Automation');
  });

  it('should not produce double hash marks in automation candidate issues reference', async () => {
    const url = new URL('http://localhost/kanban-demand-analyzer');
    const request = new Request(url, { method: 'GET' });
    const response = await handleKanbanDemandAnalyzerRoutes(request, url);
    const text = await response.text();

    expect(text).toContain("refs.issues.join(', ')");
    expect(text).not.toContain("refs.issues.join(', #')");
  });
});
