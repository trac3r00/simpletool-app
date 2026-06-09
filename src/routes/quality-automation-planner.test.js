// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  analyzeQualitySignals,
  calculateReadinessScore,
  handleQualityAutomationPlannerRoutes
} from './quality-automation-planner.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = join(__dirname, 'quality-automation-planner.js');

describe('analyzeQualitySignals', () => {
  it('returns empty recommendations for empty signals', () => {
    const result = analyzeQualitySignals([]);
    expect(result.recommendations).toEqual([]);
    expect(result.summary).toBe('No quality signals detected.');
  });

  it('recommends block-for-triage for critical bug signals', () => {
    const result = analyzeQualitySignals(['Critical bug in checkout flow']);
    expect(result.recommendations).toContain('block-for-triage');
  });

  it('recommends add-coverage for test-related signals', () => {
    const result = analyzeQualitySignals(['No unit tests for new auth module']);
    expect(result.recommendations).toContain('add-coverage');
  });

  it('recommends dependency-automation for dependency signals', () => {
    const result = analyzeQualitySignals(['npm audit found 3 high severity vulnerabilities']);
    expect(result.recommendations).toContain('dependency-automation');
  });

  it('recommends accessibility-audit for a11y signals', () => {
    const result = analyzeQualitySignals(['WCAG contrast failure on landing page']);
    expect(result.recommendations).toContain('accessibility-audit');
  });

  it('deduplicates recommendations when multiple signals match the same category', () => {
    const result = analyzeQualitySignals([
      'Crash on startup',
      'Critical error in payment gateway'
    ]);
    const triage = result.recommendations.filter(r => r === 'block-for-triage');
    expect(triage.length).toBe(1);
  });

  it('returns all applicable recommendations for mixed signals', () => {
    const result = analyzeQualitySignals([
      'Bug: login fails intermittently',
      'Coverage below 50% for new feature',
      'Outdated dependencies with known CVEs',
      'Missing aria labels on navigation'
    ]);
    expect(result.recommendations).toContain('block-for-triage');
    expect(result.recommendations).toContain('add-coverage');
    expect(result.recommendations).toContain('dependency-automation');
    expect(result.recommendations).toContain('accessibility-audit');
  });

  it('ignores case when matching keywords', () => {
    const result = analyzeQualitySignals(['BUG found in production']);
    expect(result.recommendations).toContain('block-for-triage');
  });

  it('provides a summary with recommendation count', () => {
    const result = analyzeQualitySignals(['Test coverage missing', 'Accessibility issue']);
    expect(result.summary).toContain('2');
  });

  it('detects quality signals from recurring Kanban innovation proposals (refs #34 accessibility, #394 Dependabot)', () => {
    const result = analyzeQualitySignals([
      '[Innovation Proposal] Build a never quality existing automation tool from recurring Kanban demand'
    ]);
    expect(result.recommendations).toEqual(['quality-automation-roadmap']);
    expect(result.summary).toBe('1 recommendation identified.');
  });
});

describe('calculateReadinessScore', () => {
  it('returns 100 for no recommendations', () => {
    expect(calculateReadinessScore([])).toBe(100);
  });

  it('deducts 20 points for block-for-triage', () => {
    expect(calculateReadinessScore(['block-for-triage'])).toBe(80);
  });

  it('deducts 15 points for add-coverage', () => {
    expect(calculateReadinessScore(['add-coverage'])).toBe(85);
  });

  it('deducts 15 points for dependency-automation', () => {
    expect(calculateReadinessScore(['dependency-automation'])).toBe(85);
  });

  it('deducts 15 points for accessibility-audit', () => {
    expect(calculateReadinessScore(['accessibility-audit'])).toBe(85);
  });

  it('floors at 0 for severe combinations', () => {
    expect(calculateReadinessScore([
      'block-for-triage',
      'add-coverage',
      'dependency-automation',
      'accessibility-audit'
    ])).toBe(35);
    expect(calculateReadinessScore([
      'block-for-triage',
      'add-coverage',
      'dependency-automation',
      'accessibility-audit',
      'add-coverage'
    ])).toBe(20);
  });

  it('calculates correctly for mixed recommendations', () => {
    expect(calculateReadinessScore(['block-for-triage', 'add-coverage'])).toBe(65);
  });
});

describe('handleQualityAutomationPlannerRoutes', () => {
  it('returns HTML for GET /quality-automation-planner', async () => {
    const url = new URL('http://localhost/quality-automation-planner');
    const request = new Request(url, { method: 'GET' });
    const response = await handleQualityAutomationPlannerRoutes(request, url);
    expect(response).not.toBeNull();
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('Quality Automation Planner');
  });

  it('returns null for unmatched paths', async () => {
    const url = new URL('http://localhost/other-tool');
    const request = new Request(url, { method: 'GET' });
    const response = await handleQualityAutomationPlannerRoutes(request, url);
    expect(response).toBeNull();
  });

  it('returns 405 for non-GET methods on matched path', async () => {
    const url = new URL('http://localhost/quality-automation-planner');
    const request = new Request(url, { method: 'POST' });
    const response = await handleQualityAutomationPlannerRoutes(request, url);
    expect(response.status).toBe(405);
  });
});

describe('source code regression', () => {
  it('does not contain disallowed bare global helper calls (Set, String)', () => {
    const src = readFileSync(SOURCE_PATH, 'utf8');
    expect(src).not.toMatch(/\bnew\s+Set\s*\(/);
    expect(src).not.toMatch(/\bString\s*\(/);
  });
});
