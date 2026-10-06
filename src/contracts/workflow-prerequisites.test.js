import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';

const workflowPaths = [
  '../../.github/workflows/ci.yml',
  '../../.github/workflows/deploy.yml',
];

const unzipShimScript = fileURLToPath(new URL('../../scripts/ci/setup-unzip-shim.sh', import.meta.url));

function runUnzipShimScript(env) {
  return spawnSync('bash', [unzipShimScript], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function isActionsCacheStep(uses) {
  return /^actions\/cache(?:\/|@)/.test(uses ?? '');
}

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

function getSelfHostedE2ePlaywrightInstallCommands() {
  const installCommands = [];

  for (const workflowPath of workflowPaths) {
    const workflow = load(fs.readFileSync(new URL(workflowPath, import.meta.url), 'utf8'));

    for (const [jobName, job] of Object.entries(workflow.jobs)) {
      const runnerLabels = Array.isArray(job['runs-on']) ? job['runs-on'] : [job['runs-on']];
      if (!runnerLabels.includes('self-hosted') || !jobName.includes('e2e')) continue;

      for (const step of job.steps) {
        if (typeof step.run !== 'string' || !step.run.includes('bunx playwright install')) continue;

        installCommands.push({
          command: step.run.trim(),
          location: `${workflowPath}:${jobName}:${step.name}`,
        });
      }
    }
  }

  return installCommands;
}

describe('workflow prerequisites', () => {
  it('runs the shared non-privileged unzip shim script before all seven setup-bun steps', () => {
    const prerequisites = getSetupBunPrerequisites();
    const violations = prerequisites
      .filter(({ command }) => command.trim() !== 'bash scripts/ci/setup-unzip-shim.sh')
      .map(({ location }) => location);

    const script = fs.readFileSync(unzipShimScript, 'utf8')
      .split('\n')
      .filter((line) => !line.startsWith('# '))
      .join('\n');
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

    expect(prerequisites).toHaveLength(7);
    expect(violations).toEqual([]);
    expect(script).not.toMatch(/\bsudo\b|\bapt-get\b/);
    expect(requiredFragments.filter((fragment) => !script.includes(fragment))).toEqual([]);
  });

  it('installs Playwright browsers without privileged dependency installation in self-hosted E2E jobs', () => {
    const installCommands = getSelfHostedE2ePlaywrightInstallCommands();
    const violations = installCommands
      .filter(({ command }) => (
        /\bsudo\b|--with-deps|\binstall-deps\b/.test(command)
        || command !== 'bunx playwright install chromium'
      ))
      .map(({ location }) => location);

    expect(installCommands).toHaveLength(2);
    expect(violations).toEqual([]);
  });

  // The pve-ci runner keeps $HOME between jobs, so ~/.bun/install/cache and
  // ~/.cache/ms-playwright already persist on disk. Uploading them through
  // actions/cache only re-tars them in a post step, which took 8+ minutes on the
  // shared box and hit the Build job's 10-minute timeout.
  it('does not round-trip on-disk caches through actions/cache in self-hosted jobs', () => {
    const violations = [];

    for (const workflowPath of workflowPaths) {
      const workflow = load(fs.readFileSync(new URL(workflowPath, import.meta.url), 'utf8'));

      for (const [jobName, job] of Object.entries(workflow.jobs)) {
        const runnerLabels = Array.isArray(job['runs-on']) ? job['runs-on'] : [job['runs-on']];
        if (!runnerLabels.includes('self-hosted')) continue;

        for (const step of job.steps) {
          if (isActionsCacheStep(step.uses)) violations.push(`${workflowPath}:${jobName}:${step.name}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('treats split cache actions as actions/cache steps', () => {
    expect(isActionsCacheStep('actions/cache@v4')).toBe(true);
    expect(isActionsCacheStep('actions/cache/restore@v4')).toBe(true);
    expect(isActionsCacheStep('actions/cache/save@v4')).toBe(true);
    expect(isActionsCacheStep('actions/cache-something@v1')).toBe(false);
    expect(isActionsCacheStep('actions/checkout@v4')).toBe(false);
    expect(isActionsCacheStep(undefined)).toBe(false);
  });

  it('provides Chromium system libraries in user space after browser install and before E2E runs', () => {
    const violations = [];
    let checkedJobs = 0;

    for (const workflowPath of workflowPaths) {
      const workflow = load(fs.readFileSync(new URL(workflowPath, import.meta.url), 'utf8'));

      for (const [jobName, job] of Object.entries(workflow.jobs)) {
        const runnerLabels = Array.isArray(job['runs-on']) ? job['runs-on'] : [job['runs-on']];
        if (!runnerLabels.includes('self-hosted') || !jobName.includes('e2e')) continue;
        checkedJobs += 1;

        const runs = job.steps.map((step) => (typeof step.run === 'string' ? step.run.trim() : ''));
        const depsIndex = runs.indexOf('bash scripts/ci/playwright-user-deps.sh');
        const lastInstallIndex = runs.findLastIndex((run) => run.includes('bunx playwright install'));
        const e2eIndex = runs.indexOf('bun run test:e2e');

        if (depsIndex === -1 || depsIndex < lastInstallIndex || depsIndex > e2eIndex) {
          violations.push(`${workflowPath}:${jobName}`);
        }
      }
    }

    const script = fs.readFileSync(new URL('../../scripts/ci/playwright-user-deps.sh', import.meta.url), 'utf8')
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('#'))
      .join('\n');

    expect(checkedJobs).toBe(2);
    expect(violations).toEqual([]);
    expect(script).not.toMatch(/\bsudo\b|apt-get install/);
    expect(script).toContain('apt-get download');
    expect(script).toContain('GITHUB_ENV');
    expect(script).toMatch(/^deps_dir=.*\$version-\$os_release-\$\(dpkg --print-architecture\)/m);
    expect(script).toContain('/etc/os-release');
  });

  it('removes non-executable Bun leftovers without deleting a healthy Bun executable', () => {
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

      const staleCleanup = runUnzipShimScript({ GITHUB_PATH: githubPath, HOME: home, RUNNER_TEMP: tempRoot });
      expect(staleCleanup.stderr).toBe('');
      expect(staleCleanup.status).toBe(0);
      expect(fs.existsSync(bunPath)).toBe(false);
      expect(fs.existsSync(bunxPath)).toBe(false);

      fs.writeFileSync(bunPath, '#!/bin/sh\nexit 0\n');
      fs.chmodSync(bunPath, 0o755);

      const healthyCleanup = runUnzipShimScript({ GITHUB_PATH: githubPath, HOME: home, RUNNER_TEMP: tempRoot });
      expect(healthyCleanup.stderr).toBe('');
      expect(healthyCleanup.status).toBe(0);
      expect(fs.readFileSync(bunPath, 'utf8')).toBe('#!/bin/sh\nexit 0\n');
      expect(fs.statSync(bunPath).mode & 0o777).toBe(0o755);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('supports setup-bun unzip -o -q invocation and preserves Unix modes', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-unzip-shim-'));
    const githubPath = path.join(tempRoot, 'github-path');
    const archivePath = path.join(tempRoot, 'archive.zip');
    const destination = path.join(tempRoot, 'destination');

    try {
      fs.mkdirSync(destination);

      const setup = runUnzipShimScript({ GITHUB_PATH: githubPath, RUNNER_TEMP: tempRoot });
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
