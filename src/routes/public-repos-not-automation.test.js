// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  buildNoAutomationChecklist,
  buildNoAutomationDecisionRecord,
  handlePublicReposNotAutomationRoutes,
  parsePublicReposNoAutomationInput
} from './public-repos-not-automation.js';
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
    expect(text).toContain('GitHub public repos JSON');
    expect(text).not.toContain('alert(');
  });

  it('keeps both header badges without malformed definition-list feature markup', async () => {
    const url = new URL('http://localhost/public-repos-not-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handlePublicReposNotAutomationRoutes(request, url);

    const text = await response.text();
    expect(text).toContain('tools.public-repos-not-automation.ui.badge0');
    expect(text).toContain('Client-Side Only');
    expect(text).toContain('tools.public-repos-not-automation.ui.badge1');
    expect(text).toContain('Manual Stewardship');
    expect(text).toContain('data-feature-list');
    expect(text).not.toMatch(/<dl\b[^>]*data-feature-list[^>]*>\s*<dd>/);
  });

  it('renders browser script intent to compose artifacts for every GitHub JSON repo', async () => {
    const url = new URL('http://localhost/public-repos-not-automation');
    const request = new Request(url, { method: 'GET' });
    const response = await handlePublicReposNotAutomationRoutes(request, url);

    const text = await response.text();
    expect(text).toContain('return parsed.map(parseJsonTask).filter(Boolean);');
    expect(text).toContain('if (Array.isArray(parsed))');
    expect(text).toContain('const tasks = parseTaskInput(input);');
    expect(text).toContain('tasks.map((task) => buildDecisionRecord(task, selected, threshold)).join');
    expect(text).toContain('tasks.map((task) => buildChecklist(task, selected, threshold)).join');
    expect(text).not.toContain('parsed.find((entry)');
    expect(text).not.toContain("return [createTask({ task: trimmed })];");
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

describe('public-repos-not-automation pure helpers', () => {
  it('maps GitHub public repos API JSON arrays into no-automation tasks', () => {
    const tasks = parsePublicReposNoAutomationInput(JSON.stringify([
      {
        full_name: 'trac3r00/simpletool-app',
        name: 'simpletool-app',
        owner: { login: 'trac3r00' },
        html_url: 'https://github.com/trac3r00/simpletool-app',
        description: 'Browser tools',
        language: 'JavaScript',
        archived: false,
        fork: false
      },
      {
        html_url: 'https://github.com/trac3r00/docs-site',
        name: 'ignored',
        description: '',
        language: null,
        archived: true,
        fork: true
      },
      {
        name: 'owner-name',
        owner: 'trac3r00',
        language: 'Markdown'
      }
    ]));

    expect(tasks).toHaveLength(3);
    expect(tasks[0]).toMatchObject({
      repo: 'trac3r00/simpletool-app',
      slug: 'trac3r00/simpletool-app',
      task: 'Review public repository automation suitability for trac3r00/simpletool-app',
      owner: 'maintainers',
      cadence: 'unspecified',
      risk: 'review',
      nextReview: '',
      details: {
        description: 'Browser tools',
        language: 'JavaScript',
        archived: false,
        fork: false
      }
    });
    expect(tasks[1]).toMatchObject({
      repo: 'trac3r00/docs-site',
      slug: 'trac3r00/docs-site',
      details: {
        archived: true,
        fork: true
      }
    });
    expect(tasks[1].details).not.toHaveProperty('description');
    expect(tasks[1].details).not.toHaveProperty('language');
    expect(tasks[2]).toMatchObject({
      repo: 'trac3r00/owner-name',
      slug: 'trac3r00/owner-name',
      details: {
        language: 'Markdown'
      }
    });
  });

  it('preserves regular key:value and line input parsing', () => {
    const keyed = parsePublicReposNoAutomationInput([
      'repo: trac3r00/simpletool-app',
      'task: auto-close stale public issues from recurring Kanban demand',
      'owner: maintainers',
      'cadence: monthly',
      'risk: high',
      'next-review: 2026-07-15',
      'notes: requires human judgment'
    ].join('\n'));
    const line = parsePublicReposNoAutomationInput('https://github.com/trac3r00/docs-site');

    expect(keyed).toEqual([
      expect.objectContaining({
        repo: 'trac3r00/simpletool-app',
        slug: 'trac3r00/simpletool-app',
        task: 'auto-close stale public issues from recurring Kanban demand',
        owner: 'maintainers',
        cadence: 'monthly',
        risk: 'high',
        nextReview: '2026-07-15',
        details: {
          notes: 'requires human judgment'
        }
      })
    ]);
    expect(line).toEqual([
      expect.objectContaining({
        repo: 'trac3r00/docs-site',
        slug: 'trac3r00/docs-site',
        task: 'Review public repository automation suitability for trac3r00/docs-site',
        cadence: 'unspecified',
        risk: 'review',
        nextReview: ''
      })
    ]);
  });

  it('builds decision records and checklists with repo metadata and thresholds', () => {
    const [task] = parsePublicReposNoAutomationInput(JSON.stringify([
      {
        full_name: 'trac3r00/simpletool-app',
        description: 'Browser tools',
        language: 'JavaScript',
        archived: false,
        fork: true
      }
    ]));
    const options = {
      reasons: [
        { label: 'Safety or reputation risk' },
        { label: 'Ambiguous policy boundary' }
      ],
      owner: 'security maintainers',
      reviewWindow: '60 days',
      nextReview: '2026-08-01',
      evidenceThreshold: '3 manual reviews, dry-run evidence, rollback owner.'
    };

    const decision = buildNoAutomationDecisionRecord(task, options);
    const checklist = buildNoAutomationChecklist(task, options);

    expect(decision).toContain('Repository: trac3r00/simpletool-app');
    expect(decision).toContain('Decision: Do not automate yet');
    expect(decision).toContain('- Safety or reputation risk');
    expect(decision).toContain('- Ambiguous policy boundary');
    expect(decision).toContain('Owner: security maintainers');
    expect(decision).toContain('Review window: 60 days');
    expect(decision).toContain('Next review: 2026-08-01');
    expect(decision).toContain('3 manual reviews, dry-run evidence, rollback owner.');
    expect(decision).toContain('- Language: JavaScript');
    expect(decision).toContain('- Archived: false');
    expect(decision).toContain('- Fork: true');

    expect(checklist).toContain('- [ ] Confirm the repository is public: trac3r00/simpletool-app');
    expect(checklist).toContain('- [ ] Confirm manual owner: security maintainers');
    expect(checklist).toContain('- [ ] Re-check reason: Safety or reputation risk');
    expect(checklist).toContain('- [ ] Required threshold: 3 manual reviews, dry-run evidence, rollback owner.');
    expect(checklist).toContain('- [ ] Review repository detail: Language: JavaScript');
    expect(checklist).toContain('- [ ] Review repository detail: Fork: true');
  });
});
