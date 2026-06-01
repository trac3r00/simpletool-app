// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { handleOpenTrac3r00AutomationRoutes } from './open-trac3r00-automation.js';
import { TOOLS } from '../utils/tool-registry.js';
import { handlersById } from './_handlers.js';

describe('handleOpenTrac3r00AutomationRoutes', () => {
  it('should return null for unknown paths', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation/unknown');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    expect(response).toBeNull();
  });

  it('should return 200 for GET /open-trac3r00-automation', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    expect(response.status).toBe(200);
  });

  it('should render HTML with DOCTYPE', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('<!DOCTYPE html>');
  });

  it('should include tool name in rendered output', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('Open Trac3r00 Automation');
  });

  it('should contain the main input textarea for issue text', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('id="ota-input"');
    expect(text).toContain('textarea');
  });

  it('should contain the analyze button', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('id="ota-analyze-btn"');
  });

  it('should contain results container for automation brief output', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('id="ota-results"');
  });

  it('should contain client-side script that parses issue references', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    // The client script should look for regex patterns like repo#number
    expect(text).toContain('simpletool-app#');
    // Should generate GitHub search links
    expect(text).toContain('github.com');
    // Should produce prioritized checklist
    expect(text).toContain('ota-checklist');
  });

  it('should render valid escaped regex (slash/digit) with no unterminated patterns', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    // Verify correctly-escaped regex components appear (single backslash in rendered output)
    expect(text).toContain('\\/');    // escaped forward slash (owner/repo separator)
    expect(text).toContain('\\d+');   // escaped digit quantifier
    // Verify no double-escaped backslashes (which would break regex at runtime)
    expect(text).not.toContain('\\\\/');
    expect(text).not.toContain('\\\\d');
    // Verify there's no unterminated group from broken regex
    expect(text).not.toContain('Unterminated group');
    // Verify the full issue-ref regex pattern rounds-trip correctly
    expect(text).toContain('a-zA-Z0-9');
  });

  it('should use Tailwind dark mode tokens', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('dark:bg-surface');
    expect(text).toContain('dark:text-surface');
    expect(text).toContain('dark:border-surface');
  });

  it('should not use alert() for error handling', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).not.toContain('alert(');
  });

  it('should handle trailing slash on main route', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation/');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    expect(response.status).toBe(200);
  });

  it('should extract issue references like repo#number in client logic', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    // The inline script should parse #number patterns
    expect(text).toContain('parseIssueRefs');
    expect(text).toContain('github');
    expect(text).toContain('search');
  });

  it('should contain a reference count display', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('ota-ref-count');
    expect(text).toContain('ota-label-list');
  });

  it('should produce prioritized action checklist output', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('ota-checklist');
    expect(text).toContain('priority');
  });
});

describe('tool registration', () => {
  it('should be registered in TOOLS array with correct id and path', () => {
    const tool = TOOLS.find(t => t.id === 'open-trac3r00-automation');
    expect(tool).toBeDefined();
    expect(tool.path).toBe('/open-trac3r00-automation');
    expect(tool.id).toBe('open-trac3r00-automation');
    expect(tool.name).toBe('Open Trac3r00 Automation');
    expect(tool.category).toBe('utils');
  });

  it('should have a handler registered in handlersById', () => {
    expect(typeof handlersById['open-trac3r00-automation']).toBe('function');
  });
});
