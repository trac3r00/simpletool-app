// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { handlePublicReposYmlBuilderRoutes } from './public-repos-yml-builder.js';
import { TOOLS } from '../utils/tool-registry.js';

describe('public-repos-yml-builder route rendering', () => {
  it('is registered with the expected production metadata', () => {
    const tool = TOOLS.find((item) => item.id === 'public-repos-yml-builder');

    expect(tool).toMatchObject({
      id: 'public-repos-yml-builder',
      name: 'Public Repos YAML Builder',
      path: '/public-repos-yml-builder',
      category: 'utils'
    });
    expect(tool?.keywords).toContain('repos.yml');
  });

  it('renders the builder UI and client-side automation outputs', async () => {
    const url = new URL('http://localhost/public-repos-yml-builder');
    const request = new Request(url, { method: 'GET' });
    const response = await handlePublicReposYmlBuilderRoutes(request, url);

    expect(response).not.toBeNull();
    expect(response.status).toBe(200);

    const text = await response.text();
    expect(text).toContain('Public Repos YAML Builder');
    expect(text).toContain('repo-input');
    expect(text).toContain('repos-yaml-output');
    expect(text).toContain('actions-output');
    expect(text).toContain('SHA pinning');
    expect(text).toContain('branch protection');
    expect(text).toContain('secrets posture');
    expect(text).toContain('monetization readiness');
    expect(text).toContain('github/codeql-action/init@');
    expect(text).toContain('jsyaml.dump');
    expect(text).not.toContain('alert(');
  });

  it('returns null for unmatched routes and 405 for unsupported methods', async () => {
    const missUrl = new URL('http://localhost/not-public-repos-yml-builder');
    const missRequest = new Request(missUrl, { method: 'GET' });
    await expect(handlePublicReposYmlBuilderRoutes(missRequest, missUrl)).resolves.toBeNull();

    const postUrl = new URL('http://localhost/public-repos-yml-builder');
    const postRequest = new Request(postUrl, { method: 'POST' });
    const response = await handlePublicReposYmlBuilderRoutes(postRequest, postUrl);
    expect(response.status).toBe(405);
  });
});
