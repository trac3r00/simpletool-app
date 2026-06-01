// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { TOOLS } from '../utils/tool-registry.js';
import { handlersById } from './_handlers.js';
import { handleGithubAutomationRoutes } from './github-automation.js';

describe('github-automation registration', () => {
  it('is registered in tool registry', () => {
    const entry = TOOLS.find(t => t.id === 'github-automation');
    expect(entry).toBeDefined();
    expect(entry.name).toBe('GitHub Automation');
    expect(entry.path).toBe('/github-automation');
  });

  it('is registered in handler map', () => {
    expect(handlersById['github-automation']).toBeDefined();
    expect(handlersById['github-automation']).toBe(handleGithubAutomationRoutes);
  });
});

describe('github-automation route rendering', () => {
  it('should render on /github-automation route', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    expect(response).not.toBeNull();
    const text = await response.text();
    expect(text).toContain('GitHub Automation');
    expect(text).toContain('Connect to GitHub');
  });

  it('inline scripts parse without syntax errors', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();

    // Extract all <script> blocks (with or without attributes)
    const scriptBlocks = text.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
    expect(scriptBlocks).not.toBeNull();

    for (const block of scriptBlocks) {
      const code = block.replace(/<\/?script[^>]*>/g, '').trim();
      if (!code) continue;
      // Skip JSON-LD or non-JS blocks
      if (code.startsWith('{') || code.startsWith('[')) continue;
      // Verify no syntax errors by parsing with Function constructor
      expect(() => new Function(code)).not.toThrow();
    }
  });
});

describe('github-automation source requirements', () => {
  it('uses task.body fallback before task.description', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('task.body || task.description');
  });

  it('includes assignees in API payload', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('assignees');
    expect(text).toContain('parsedAssignee');
  });

  it('merges custom labels with default labels using Set dedupe', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('const defaultLabels =');
    expect(text).toContain('new Set');
    expect(text).toContain("'automation', 'trac3r00'");
  });

  it('clearKanbanTask resets parsedAssignee', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain("parsedAssignee = ''");
    expect(text).toContain('function clearKanbanTask');
  });

  it('preserves issue body when use-trac3r00-template is absent', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('const templateToggle = document.getElementById("use-trac3r00-template")');
    expect(text).toContain('templateToggle && !templateToggle.checked');
  });
});
