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
  it('cleans stale Bun binaries and adds a non-privileged unzip shim before all seven setup-bun steps', () => {
    const violations = [];
    const prerequisites = getSetupBunPrerequisites();

    for (const { command, location } of prerequisites) {
      const requiredFragments = [
        '$HOME/.bun/bin/bun',
        '$HOME/.bun/bin/bunx',
        '! -x',
        'rm -f',
        'RUNNER_TEMP',
        '#!/usr/bin/env python3',
        'import os, sys, zipfile',
        'zipfile.ZipFile',
        'archive.infolist()',
        'archive.extract(member)',
        'member.external_attr >> 16',
        'os.chmod',
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

  it('removes non-executable Bun leftovers without deleting a healthy Bun executable', () => {
    const [{ command }] = getSetupBunPrerequisites();
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-bun-cleanup-'));
    const home = path.join(tempRoot, 'home');
    const bunDirectory = path.join(home, '.bun', 'bin');
    const bunPath = path.join(bunDirectory, 'bun');
    const bunxPath = path.join(bunDirectory, 'bunx');
    const githubPath = path.join(tempRoot, 'github-path');

    try {
      fs.mkdirSync(bunDirectory, { recursive: true });
      fs.writeFileSync(bunPath, 'stale bun');
      fs.writeFileSync(bunxPath, 'stale bunx');
      fs.chmodSync(bunPath, 0o644);
      fs.chmodSync(bunxPath, 0o644);

      const staleCleanup = spawnSync('bash', ['-euo', 'pipefail', '-c', command], {
        encoding: 'utf8',
        env: {
          ...process.env,
          GITHUB_PATH: githubPath,
          HOME: home,
          RUNNER_TEMP: tempRoot,
        },
      });
      expect(staleCleanup.stderr).toBe('');
      expect(staleCleanup.status).toBe(0);
      expect(fs.existsSync(bunPath)).toBe(false);
      expect(fs.existsSync(bunxPath)).toBe(false);

      fs.writeFileSync(bunPath, '#!/bin/sh\nexit 0\n');
      fs.chmodSync(bunPath, 0o755);

      const healthyCleanup = spawnSync('bash', ['-euo', 'pipefail', '-c', command], {
        encoding: 'utf8',
        env: {
          ...process.env,
          GITHUB_PATH: githubPath,
          HOME: home,
          RUNNER_TEMP: tempRoot,
        },
      });
      expect(healthyCleanup.stderr).toBe('');
      expect(healthyCleanup.status).toBe(0);
      expect(fs.readFileSync(bunPath, 'utf8')).toBe('#!/bin/sh\nexit 0\n');
      expect(fs.statSync(bunPath).mode & 0o777).toBe(0o755);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('supports setup-bun unzip -o -q invocation and preserves Unix modes', () => {
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
          [
            'import sys, zipfile',
            'with zipfile.ZipFile(sys.argv[1], "w") as archive:',
            '    directory = zipfile.ZipInfo("nested/")',
            '    directory.create_system = 3',
            '    directory.external_attr = 0o40750 << 16',
            '    archive.writestr(directory, "")',
            '    executable = zipfile.ZipInfo("nested/bun")',
            '    executable.create_system = 3',
            '    executable.external_attr = 0o100755 << 16',
            '    archive.writestr(executable, \'#!/bin/sh\\nprintf "shim works"\\n\')',
            '    archive.writestr("../escape.txt", "stays contained")',
          ].join('\n'),
          archivePath,
        ],
        { stdio: 'inherit' }
      );

      const shimDirectory = fs.readFileSync(githubPath, 'utf8').trim();
      execFileSync(path.join(shimDirectory, 'unzip'), ['-o', '-q', archivePath], {
        cwd: destination,
        stdio: 'inherit',
      });

      const extractedDirectory = path.join(destination, 'nested');
      const extractedExecutable = path.join(extractedDirectory, 'bun');

      expect(fs.statSync(extractedExecutable).mode & 0o777).toBe(0o755);
      expect(fs.statSync(extractedDirectory).mode & 0o777).toBe(0o750);
      expect(execFileSync(extractedExecutable, { encoding: 'utf8' })).toBe('shim works');
      expect(fs.readFileSync(path.join(destination, 'escape.txt'), 'utf8')).toBe('stays contained');
      expect(fs.existsSync(path.join(tempRoot, 'escape.txt'))).toBe(false);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
