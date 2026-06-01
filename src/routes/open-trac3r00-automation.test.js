// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { handleOpenTrac3r00AutomationRoutes } from './open-trac3r00-automation.js';

describe('open-trac3r00-automation route rendering', () => {
  it('should render on /open-trac3r00-automation route', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    expect(response).not.toBeNull();
    const text = await response.text();
    expect(text).toContain('open-trac3r00-automation');
    expect(text).toContain('Open Trac3r00 Automation');
  });

  it('should return 200 for GET /open-trac3r00-automation', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    expect(response.status).toBe(200);
  });

  it('should include backlog input control', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('backlog');
  });

  it('should include repo slug input control', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('repo');
    expect(text).toContain('slug');
  });

  it('should include Generate automation plan button', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('Generate automation plan');
  });

  it('should include the issue 63 recurring Kanban demand as the sample backlog', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('Build a simpletool-app open trac3r00 automation tool from recurring Kanban demand');
    expect(text).toContain('[simpletool-app#34] [proposal] Add registry-driven accessibility audit for all tools');
    expect(text).toContain('[simpletool-app#48] Resolve merge conflict: changelog & pipe routes');
    expect(text).toContain('Product Value Score: 0.88');
  });

  it('should include Signal summary output section', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('Signal summary');
  });

  it('should include Automation plan output section', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('Automation plan');
  });

  it('should include GitHub next steps output section', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('GitHub next steps');
  });

  it('should handle trailing slash on main route', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation/');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    expect(response.status).toBe(200);
  });

  it('should return null for unknown paths (handled by worker cascade)', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation/api');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    expect(response).toBeNull();
  });

  it('should include escapeHtml function in client script for XSS prevention', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('function escapeHtml');
    expect(text).toContain('.replace(/&/g,');
  });

  it('should escape HTML entities in backlog text before innerHTML', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('escapeHtml(item.text)');
    expect(text).toContain('safeText');
  });

  it('should escape prTitle in generated shell commands', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('escapeHtml(');
  });

  it('should include escapeShell function for shell command safety', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('function escapeShell');
    expect(text).toContain('replace(new RegExp(String.fromCharCode(96)');
    expect(text).toContain('escapeShell(item.type');
  });

  it('should include escapeMdPipe function for markdown table safety', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('function escapeMdPipe');
    expect(text).toContain('.replace(/\\|/g,');
  });

  it('should apply escapeShell to prTitle before escapeHtml in next steps', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('escapeHtml(escapeShell(');
  });

  it('should use escapeMdPipe in markdown table rows', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('escapeMdPipe(item.text)');
  });

  it('should use escapeShell in markdown gh pr create command', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('escapeShell(item.type');
  });

  it('should use dark mode Tailwind variants', async () => {
    const url = new URL('http://localhost/open-trac3r00-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleOpenTrac3r00AutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain('dark:bg-surface');
    expect(text).toContain('dark:text-surface');
  });
});
