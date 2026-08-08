import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';

const workflowPaths = [
  '../../.github/workflows/ci.yml',
  '../../.github/workflows/deploy.yml',
];

function getSetupBunPrerequisites() {
  const prerequisites = [];

  for (const workflowPath of workflowPaths) {
    const workflow = load(fs.readFileSync(new URL(workflowPath, import.meta.url), 'utf8'));

    for (const [jobName, job] of Object.entries(workflow.jobs)) {
      job.steps.forEach((step, stepIndex) => {
        if (!step.uses?.startsWith('oven-sh/setup-bun@')) return;

        prerequisites.push({
          command: job.steps[stepIndex - 1]?.run ?? '',
          location: `${workflowPath}:${jobName}`,
        });
      });
    }
  }

  return prerequisites;
}

describe('workflow prerequisites', () => {
  it('adds a non-privileged user-space unzip shim before all seven setup-bun steps', () => {
    const violations = [];
    const prerequisites = getSetupBunPrerequisites();

    for (const { command, location } of prerequisites) {
      const requiredFragments = [
        'RUNNER_TEMP',
        '#!/usr/bin/env python3',
        'import zipfile',
        'zipfile.ZipFile',
        'extractall()',
        'chmod +x',
        'GITHUB_PATH',
      ];

      if (
        /\bsudo\b|\bapt-get\b/.test(command)
        || requiredFragments.some((fragment) => !command.includes(fragment))
      ) {
        violations.push(location);
      }
    }

    expect(prerequisites).toHaveLength(7);
    expect(violations).toEqual([]);
  });

  it('supports setup-bun unzip -o -q invocation from the destination cwd', () => {
    const [{ command }] = getSetupBunPrerequisites();
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-unzip-shim-'));
    const githubPath = path.join(tempRoot, 'github-path');
    const archivePath = path.join(tempRoot, 'archive.zip');
    const destination = path.join(tempRoot, 'destination');

    try {
      fs.mkdirSync(destination);

      const setup = spawnSync('bash', ['-euo', 'pipefail', '-c', command], {
        encoding: 'utf8',
        env: {
          ...process.env,
          GITHUB_PATH: githubPath,
          RUNNER_TEMP: tempRoot,
        },
      });
      expect(setup.stderr).toBe('');
      expect(setup.status).toBe(0);

      execFileSync(
        'python3',
        [
          '-c',
          'import sys, zipfile\nwith zipfile.ZipFile(sys.argv[1], "w") as archive:\n    archive.writestr("nested/file.txt", "shim works")',
          archivePath,
        ],
        { stdio: 'inherit' }
      );

      const shimDirectory = fs.readFileSync(githubPath, 'utf8').trim();
      execFileSync(path.join(shimDirectory, 'unzip'), ['-o', '-q', archivePath], {
        cwd: destination,
        stdio: 'inherit',
      });

      expect(fs.readFileSync(path.join(destination, 'nested/file.txt'), 'utf8')).toBe('shim works');
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
