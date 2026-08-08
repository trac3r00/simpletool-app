import fs from 'fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';

const workflowPaths = [
  '../../.github/workflows/ci.yml',
  '../../.github/workflows/deploy.yml',
];

describe('workflow prerequisites', () => {
  it('installs unzip idempotently before every setup-bun step', () => {
    const violations = [];

    for (const workflowPath of workflowPaths) {
      const workflow = load(fs.readFileSync(new URL(workflowPath, import.meta.url), 'utf8'));

      for (const [jobName, job] of Object.entries(workflow.jobs)) {
        const setupBunIndex = job.steps.findIndex((step) => step.uses?.startsWith('oven-sh/setup-bun@'));
        if (setupBunIndex === -1) continue;

        const prerequisite = job.steps
          .slice(0, setupBunIndex)
          .find((step) => step.run?.includes('apt-get install -y unzip'));
        const command = prerequisite?.run ?? '';

        if (!command.includes('command -v unzip') || !command.includes('apt-get update')) {
          violations.push(`${workflowPath}:${jobName}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
