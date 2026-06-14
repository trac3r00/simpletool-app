// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { handlePublicReposNotAutomationRoutes } from './public-repos-not-automation.js';
import { TOOLS } from '../utils/tool-registry.js';

describe('public-repos-not-automation route rendering', () => {
  it('is registered with the expected production metadata', () => {
    const tool = TOOLS.find((item) => item.id === 'public-repos-not-automation');

    expect(tool).toMatchObject({
      id: 'public-repos-not-automation',
      name: 'Public Repos Not Automation',
      path: '/public-repos-not-automation',
      category: 'utils'
    });
    expect(tool?.keywords).toContain('no automation');
  });

  it('renders the no-automation decision UI without browser alerts', async () => {
    const url = new URL('http://localhost/public-repos-not-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handlePublicReposNotAutomationRoutes(request, url);

    expect(response).not.toBeNull();
    expect(response.status).toBe(200);

    const text = await response.text();
    expect(text).toContain('Public Repos Not Automation');
    expect(text).toContain('repo-task-input');
    expect(text).toContain('reason-safety');
    expect(text).toContain('reason-unclear-owner');
    expect(text).toContain('reason-low-frequency');
    expect(text).toContain('decision-output');
    expect(text).toContain('checklist-output');
    expect(text).toContain('no-automation decision record');
    expect(text).toContain('manual stewardship');
    expect(text).not.toContain('alert(');
  });

  it('returns null for unmatched routes and 405 for unsupported methods', async () => {
    const missUrl = new URL('http://localhost/not-public-repos-not-automation');
    const missRequest = new Request(missUrl, { method: 'GET' });
    await expect(handlePublicReposNotAutomationRoutes(missRequest, missUrl)).resolves.toBeNull();

    const postUrl = new URL('http://localhost/public-repos-not-automation');
    const postRequest = new Request(postUrl, { method: 'POST' });
    const response = await handlePublicReposNotAutomationRoutes(postRequest, postUrl);
    expect(response.status).toBe(405);
  });
});
