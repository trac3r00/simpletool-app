// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { handleGithubAutomationRoutes } from './github-automation.js';

function makeRequest() {
  const url = new URL('http://localhost/github-automation');
  const request = new Request(url, { method: 'GET' });
  return { url, request };
}

/** Extract content of the <script> tag whose content contains `keyword`. */
function extractScriptContaining(text, keyword) {
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
  let match;
  while ((match = scriptRegex.exec(text)) !== null) {
    if (match[1].includes(keyword)) {
      return match[1];
    }
  }
  return null;
}

describe('github-automation regression (#76 #84 follow-up)', () => {
  it('should render the page successfully', async () => {
    const { url, request } = makeRequest();
    const response = await handleGithubAutomationRoutes(request, url);
    expect(response).not.toBeNull();
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('GitHub Automation');
  });

  it('BLOCKER 1: inline script must be valid browser JS (Description newline escape)', async () => {
    const { url, request } = makeRequest();
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();
    const scriptContent = extractScriptContaining(text, 'createIssue');
    expect(scriptContent).not.toBeNull();
    expect(() => new Function(scriptContent)).not.toThrow();
  });

  it('BLOCKER 2: createIssue handles missing #use-trac3r00-template (no bare .checked)', async () => {
    const { url, request } = makeRequest();
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();
    const scriptContent = extractScriptContaining(text, 'createIssue');
    expect(scriptContent).not.toBeNull();
    expect(scriptContent).not.toMatch(/getElementById\(['"]use-trac3r00-template['"]\)\.checked/);
    expect(scriptContent).toMatch(/getElementById\(['"]use-trac3r00-template['"]\)\?\.checked/);
  });

  it('BLOCKER 3: parsedAssignee reset after issue creation (in createIssue function)', async () => {
    const { url, request } = makeRequest();
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();
    const scriptContent = extractScriptContaining(text, 'createIssue');
    expect(scriptContent).not.toBeNull();
    // The createIssue function body (or at least the main tool script) must contain a parsedAssignee reset
    const createIssueMatch = scriptContent.match(/async function createIssue[\s\S]*?\n      \}/);
    expect(createIssueMatch).not.toBeNull();
    expect(createIssueMatch[0]).toContain("parsedAssignee = ''");
  });

  it('clearKanbanTask still resets parsedAssignee', async () => {
    const { url, request } = makeRequest();
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();
    expect(text).toContain("parsedAssignee = ''");
  });
});
