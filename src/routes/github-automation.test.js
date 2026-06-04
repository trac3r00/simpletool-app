// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  parseKanbanTask,
  buildGitHubIssueTitle,
  buildGitHubIssueBody,
  getRecommendedLabels,
  buildGitHubNewIssueURL,
  buildGitHubIssuePayload,
} from './github-automation.js';

describe('parseKanbanTask', () => {
  it('parses a standard Hermes Kanban task with id, title, and body', () => {
    const raw = `Task #76
Title: Implement GitHub Automation tool
Body: Create a new tool that converts Hermes Kanban tasks into GitHub issues. Must support id/title/body extraction and be client-side only.`;
    const result = parseKanbanTask(raw);
    expect(result).toEqual({
      id: '76',
      title: 'Implement GitHub Automation tool',
      body: 'Create a new tool that converts Hermes Kanban tasks into GitHub issues. Must support id/title/body extraction and be client-side only.',
    });
  });

  it('parses markdown heading format with t_ task id and body after blank line', () => {
    const raw = `# Kanban task t_c811c147: Example title

Body line one
Body line two`;
    const result = parseKanbanTask(raw);
    expect(result).toEqual({
      id: 't_c811c147',
      title: 'Example title',
      body: 'Body line one\nBody line two',
    });
  });

  it('still parses the existing simple Task #76 format after adding markdown support', () => {
    const raw = `Task #76
Title: Implement GitHub Automation tool
Body: Create a new tool that converts Hermes Kanban tasks into GitHub issues. Must support id/title/body extraction and be client-side only.`;
    const result = parseKanbanTask(raw);
    expect(result).not.toBeNull();
    expect(result.id).toBe('76');
    expect(result.title).toBe('Implement GitHub Automation tool');
    expect(result.body).toContain('client-side only');
  });

  it('trims whitespace from parsed fields', () => {
    const raw = `  Task #42  
  Title:   Trim me   
  Body:   Also trim me   `;
    const result = parseKanbanTask(raw);
    expect(result.id).toBe('42');
    expect(result.title).toBe('Trim me');
    expect(result.body).toBe('Also trim me');
  });

  it('handles multi-line body content', () => {
    const raw = `Task #1
Title: Multi-line
Body: Line one
Line two
Line three`;
    const result = parseKanbanTask(raw);
    expect(result.body).toBe('Line one\nLine two\nLine three');
  });

  it('returns null for non-matching input', () => {
    expect(parseKanbanTask('Just random text')).toBeNull();
    expect(parseKanbanTask('')).toBeNull();
    expect(parseKanbanTask('Task without id')).toBeNull();
  });

  it('is pure: does not mutate input or rely on external state', () => {
    const raw = `Task #99
Title: Pure
Body: Test`;
    const result1 = parseKanbanTask(raw);
    const result2 = parseKanbanTask(raw);
    expect(result1).toEqual(result2);
    expect(result1).not.toBe(result2); // new object each call
  });
});

describe('buildGitHubIssueTitle', () => {
  it('prefixes task id to the title', () => {
    const task = { id: '76', title: 'Implement GitHub Automation tool', body: '...' };
    expect(buildGitHubIssueTitle(task)).toBe('[#76] Implement GitHub Automation tool');
  });

  it('handles ids with leading zeros', () => {
    const task = { id: '007', title: 'Secret feature', body: '' };
    expect(buildGitHubIssueTitle(task)).toBe('[#007] Secret feature');
  });

  it('is pure and returns a string', () => {
    const task = { id: '1', title: 'A', body: '' };
    expect(typeof buildGitHubIssueTitle(task)).toBe('string');
  });
});

describe('buildGitHubIssueBody', () => {
  it('includes task provenance header and original body', () => {
    const task = {
      id: '76',
      title: 'Implement GitHub Automation tool',
      body: 'Create a tool for GitHub issue creation.',
    };
    const body = buildGitHubIssueBody(task);
    expect(body).toContain('Hermes Kanban Task #76');
    expect(body).toContain('Original Title: Implement GitHub Automation tool');
    expect(body).toContain('Create a tool for GitHub issue creation.');
  });

  it('includes a footer with provenance metadata', () => {
    const task = { id: '1', title: 'T', body: 'B' };
    const body = buildGitHubIssueBody(task);
    expect(body).toContain('---');
    expect(body).toContain('Auto-generated from Hermes Kanban');
  });

  it('preserves multi-line body content', () => {
    const task = {
      id: '5',
      title: 'Multi',
      body: 'Step 1\nStep 2\nStep 3',
    };
    const body = buildGitHubIssueBody(task);
    expect(body).toContain('Step 1\nStep 2\nStep 3');
  });

  it('is pure', () => {
    const task = { id: '2', title: 'Pure', body: 'Test' };
    const a = buildGitHubIssueBody(task);
    const b = buildGitHubIssueBody(task);
    expect(a).toBe(b);
  });
});

describe('getRecommendedLabels', () => {
  it('suggests bug label when title/body contains "bug" or "fix"', () => {
    expect(getRecommendedLabels({ title: 'Fix login bug', body: '' })).toContain('bug');
    expect(getRecommendedLabels({ title: 'Something', body: 'This is a bug report' })).toContain('bug');
  });

  it('suggests enhancement label when title/body contains "feature" or "add"', () => {
    expect(getRecommendedLabels({ title: 'Add new feature', body: '' })).toContain('enhancement');
    expect(getRecommendedLabels({ title: 'Feature request', body: '' })).toContain('enhancement');
  });

  it('suggests documentation label when title/body contains "doc"', () => {
    expect(getRecommendedLabels({ title: 'Update docs', body: '' })).toContain('documentation');
  });

  it('returns an empty array for unrelated content', () => {
    expect(getRecommendedLabels({ title: 'Random task', body: 'Nothing special' })).toEqual([]);
  });

  it('returns unique labels without duplicates', () => {
    const labels = getRecommendedLabels({ title: 'Bug fix feature', body: 'bug and feature' });
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('is pure', () => {
    const task = { title: 'Bug fix', body: '' };
    expect(getRecommendedLabels(task)).toEqual(getRecommendedLabels(task));
  });
});

describe('buildGitHubNewIssueURL', () => {
  it('builds a new-issue URL with encoded title and body', () => {
    const url = buildGitHubNewIssueURL('acme', 'repo', 'Title', 'Body', ['bug']);
    expect(url).toBe('https://github.com/acme/repo/issues/new?title=Title&body=Body&labels=bug');
  });

  it('URL-encodes special characters in title and body', () => {
    const url = buildGitHubNewIssueURL('acme', 'repo', 'A & B', 'Line 1\nLine 2', []);
    expect(url).toContain(encodeURIComponent('A & B'));
    expect(url).toContain(encodeURIComponent('Line 1\nLine 2'));
  });

  it('omits labels param when labels array is empty', () => {
    const url = buildGitHubNewIssueURL('acme', 'repo', 'T', 'B', []);
    expect(url).not.toContain('labels=');
  });

  it('joins multiple labels with comma', () => {
    const url = buildGitHubNewIssueURL('acme', 'repo', 'T', 'B', ['bug', 'enhancement']);
    expect(url).toContain('labels=bug%2Cenhancement');
  });

  it('is pure', () => {
    const url1 = buildGitHubNewIssueURL('o', 'r', 't', 'b', []);
    const url2 = buildGitHubNewIssueURL('o', 'r', 't', 'b', []);
    expect(url1).toBe(url2);
  });
});

describe('buildGitHubIssuePayload', () => {
  it('returns a valid GitHub REST API v3 payload object', () => {
    const payload = buildGitHubIssuePayload('acme', 'repo', 'Title', 'Body', ['bug']);
    expect(payload).toEqual({
      owner: 'acme',
      repo: 'repo',
      title: 'Title',
      body: 'Body',
      labels: ['bug'],
    });
  });

  it('uses empty labels array when none provided', () => {
    const payload = buildGitHubIssuePayload('o', 'r', 't', 'b', []);
    expect(payload.labels).toEqual([]);
  });

  it('is pure and returns a new object each call', () => {
    const p1 = buildGitHubIssuePayload('o', 'r', 't', 'b', []);
    const p2 = buildGitHubIssuePayload('o', 'r', 't', 'b', []);
    expect(p1).toEqual(p2);
    expect(p1).not.toBe(p2);
  });
});
