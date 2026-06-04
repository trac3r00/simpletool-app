// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { handleGithubAutomationRoutes } from './github-automation.js';

function getMainScript(text) {
  const matches = [...text.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
  return matches.map(m => m[1]).find(content => content.includes('connectToGitHub'));
}

describe('github-automation route rendering', () => {
  it('should render on /github-automation route', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    expect(response).not.toBeNull();
    const text = await response.text();
    expect(text).toContain('github-automation');
    expect(text).toContain('GitHub Automation');
  });

  it('should include all key UI elements', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();

    expect(text).toContain('Personal Access Token');
    expect(text).toContain('Repository Owner');
    expect(text).toContain('Repository Name');
    expect(text).toContain('Connect to GitHub');
    expect(text).toContain('Create Issue');
    expect(text).toContain('Issue Labels');
    expect(text).toContain('Kanban Task');
    expect(text).toContain('Preview Issue');
    expect(text).toContain('Status');
  });

  it('should properly escape template-literal regex without unescaped newlines in single-quoted strings', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();

    // The inline script must not have actual newlines inside single-quoted strings
    // e.g., '### Description\n' would become '### Description\n' if properly escaped
    // but an actual newline (literal line break) inside single quotes breaks JS
    const scriptContent = getMainScript(text);
    if (scriptContent) {
      // Check there's no literal newline inside single-quoted strings
      // This regex finds lines that start a single-quoted string and end with a different quote
      const lines = scriptContent.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Count single quotes - if odd, a string is open across lines (BAD)
        const singleQuotes = (line.match(/'/g) || []).length;
        if (singleQuotes % 2 !== 0) {
          // Check if this is genuinely a multi-line string issue
          // Look for patterns like 'text\n' which would be broken
          expect(line).not.toMatch(/'\n$/);
        }
      }
    }
  });

  it('should include use-trac3r00-template checkbox element', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();

    // The createIssue function references this element; it must exist in the DOM
    expect(text).toContain('use-trac3r00-template');
  });

  it('should sanitize GitHub label colors used in inline style', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();

    // Find the label color usage in the displayIssues function
    // It should sanitize the label.color before inserting into style
    const scriptContent = getMainScript(text);
    if (scriptContent) {
      // The label color should be filtered through something that removes non-hex chars
      // Look for sanitization of label.color
      if (scriptContent.includes('label.color')) {
        expect(scriptContent).not.toContain('style="${label.color ?');
        // Should pass label.color through a sanitization function before using in inline style
        expect(scriptContent).toContain('sanitizeLabelColor(label.color)');
      }
    }
  });

  it('should use _t() for dynamic status/error messages', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();

    // Status/error messages inside the script should use _t() with i18n keys
    const scriptContent = getMainScript(text);
    if (scriptContent) {
      expect(scriptContent).toContain("_t('tools.github-automation.js.text10");
      expect(scriptContent).toContain("_t('tools.github-automation.js.text1");
      expect(scriptContent).toContain("_t('tools.github-automation.js.text6");
    }
  });

  it('should filter out pull requests in loadRecentIssues', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();

    const scriptContent = getMainScript(text);
    if (scriptContent) {
      // GitHub /issues endpoint returns both issues and PRs; PRs have a pull_request property
      expect(scriptContent).toContain('!issue.pull_request');
      expect(scriptContent).toContain('.filter(');
    }
  });
});

describe('Kanban task parser behavior (client-side logic rendered)', () => {
  it('should render parseKanbanTask function with proper body/assignee/labels handling', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();

    // The parseKanbanTask function should handle:
    // - task.body (or task.description) for issue body
    // - task.assignee for parsedAssignee
    // - task.labels for custom labels input
    expect(text).toContain('parsedAssignee');
    expect(text).toContain('task.body');
    expect(text).toContain('task.assignee');
    expect(text).toContain('task.labels');
    expect(text).toContain('custom-labels');
  });

  it('should not contain broken literal newline inside single-quoted string in script', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();

    // The key pattern to check: '### Description\n' must be written as
    // '### Description\\n' in the outer template literal so it becomes
    // a valid \n escape in the rendered script, not a literal newline
    const scriptContent = getMainScript(text);
    if (scriptContent) {
      // Search for any occurrence of single-quoted strings with actual newlines
      // by checking that all single-quoted strings are properly closed
      const lines = scriptContent.split('\n');
      let inString = false;
      for (const line of lines) {
        for (let i = 0; i < line.length; i++) {
          if (line[i] === "'" && (i === 0 || line[i - 1] !== '\\')) {
            inString = !inString;
          }
        }
        if (inString) {
          // Line ends with an open single-quoted string — this is a bug
          expect(line).toBe(''); // force failure with context
        }
      }
    }
  });

  it('should contain correct single-backslash escapes for \\n and \\u2192 in rendered script', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();

    const scriptContent = getMainScript(text);
    expect(scriptContent).toBeTruthy();

    // The script must contain \n (one backslash) so the JS engine produces real newlines
    expect(scriptContent).toContain("sections.join('\\n')");
    // Must NOT contain \\n (two backslashes) which would produce literal \n text in the issue body
    expect(scriptContent).not.toContain("sections.join('\\\\n')");

    // The script must contain \u2192 (one backslash) so the JS engine produces the real arrow
    expect(scriptContent).toContain('\\u2192');
    // Must NOT contain \\u2192 (two backslashes) which would produce literal \u2192 text
    expect(scriptContent).not.toContain('\\\\u2192');
  });

  it('should include Kanban task input textarea and parse/clear buttons', async () => {
    const url = new URL('http://localhost/github-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handleGithubAutomationRoutes(request, url);
    const text = await response.text();

    expect(text).toContain('kanban-task-input');
    expect(text).toContain('parse-kanban-btn');
    expect(text).toContain('clear-kanban-btn');
    expect(text).toContain('kanban-parse-status');
  });
});
