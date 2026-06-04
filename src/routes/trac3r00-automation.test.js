// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { handleTrac3r00AutomationRoutes } from './trac3r00-automation.js';

describe('trac3r00-automation route', () => {
  it('should return HTML response for GET request', async () => {
    const url = new URL('http://localhost/trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleTrac3r00AutomationRoutes(request, url);
    expect(response).toBeTruthy();
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('Trac3r00 Automation');
    expect(text).toContain('Kanban');
  });

  it('should return null for POST request', async () => {
    const url = new URL('http://localhost/trac3r00-automation');
    const request = new Request(url, { method: 'POST' });
    const response = await handleTrac3r00AutomationRoutes(request, url);
    expect(response).toBeNull();
  });

  it('should return null for unmatched path', async () => {
    const url = new URL('http://localhost/other-path');
    const request = new Request(url, { method: 'GET' });
    const response = await handleTrac3r00AutomationRoutes(request, url);
    expect(response).toBeNull();
  });

  it('should include GitHub token input field', async () => {
    const url = new URL('http://localhost/trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('id="github-token"');
    expect(text).toContain('id="repo-owner"');
    expect(text).toContain('id="repo-name"');
  });

  it('should include Kanban task input area', async () => {
    const url = new URL('http://localhost/trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('id="kanban-task-input"');
    expect(text).toContain('id="parse-kanban-btn"');
    expect(text).toContain('id="issue-title"');
    expect(text).toContain('id="issue-body"');
    expect(text).toContain('id="create-issue-btn"');
  });

  it('should include label configuration with defaults', async () => {
    const url = new URL('http://localhost/trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('id="custom-labels"');
    expect(text).toContain('id="labels-config"');
  });

  it('should pre-fill repo owner and name with trac3r00 defaults', async () => {
    const url = new URL('http://localhost/trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('value="trac3r00"');
    expect(text).toContain('value="simpletool-app"');
  });

  it('should contain parseKanbanTask function in inline script', async () => {
    const url = new URL('http://localhost/trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('function parseKanbanTask');
    expect(text).toContain('function createIssue');
  });

  it('should use textContent not innerHTML for status updates', async () => {
    const url = new URL('http://localhost/trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    // updateStatus must use textContent assignment, not innerHTML
    expect(text).toContain('statusMessage.textContent');
    expect(text).not.toContain('statusMessage.innerHTML');
  });

  it('should always include default labels automation and trac3r00', async () => {
    const url = new URL('http://localhost/trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    // The inline script must include defaultLabels with automation and trac3r00
    expect(text).toMatch(/defaultLabels\s*=\s*\[\s*['"]automation['"]\s*,\s*['"]trac3r00['"]\s*\]/);
  });

  it('should deduplicate labels when merging defaults with custom', async () => {
    const url = new URL('http://localhost/trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    // The dedup logic should use a seen/lowered map
    expect(text).toContain('.toLowerCase()');
    expect(text).toContain('seen[l]');
  });

  it('should reset parsed assignee, task input, issue title/body, and custom labels on clear', async () => {
    const url = new URL('http://localhost/trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    // Clear button must reset all fields
    expect(text).toContain("issueTitleInput.value = ''");
    expect(text).toContain("issueBodyInput.value = ''");
    expect(text).toContain("customLabelsInput.value = ''");
    expect(text).toContain("parsedAssignee = ''");
  });

  it('should create issue link via DOM APIs not innerHTML', async () => {
    const url = new URL('http://localhost/trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    // createIssue success must use document.createElement, not HTML string injection
    expect(text).toContain("document.createElement('a')");
    expect(text).toContain('link.href = issue.html_url');
    expect(text).toContain('link.textContent');
  });

  it('should double-escape regex in template literal', async () => {
    const url = new URL('http://localhost/trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    // The inline JS uses template literals with backtick
    // Any regex like /\d+/ must be /\\d+/ inside a template literal
    // Check no unescaped \d etc in backtick context
    expect(text).not.toContain('\\d');
  });

  it('should reset isConnected and disable createIssueBtn on failed connect', async () => {
    const url = new URL('http://localhost/trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    // After a successful connect sets isConnected=true and enables createIssueBtn,
    // a later failed connect must reset stale state in the catch block.
    const catchIdx = text.indexOf('.catch(function(error)');
    expect(catchIdx).toBeGreaterThan(-1);
    const catchBlock = text.slice(catchIdx, catchIdx + 400);
    expect(catchBlock).toContain('isConnected = false');
    expect(catchBlock).toContain('createIssueBtn.disabled = true');
  });
});
