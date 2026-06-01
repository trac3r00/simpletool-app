import { describe, it, expect } from 'vitest';
import { buildFailureTestPlan } from '../../scripts/failure-test-plan.js';

describe('failure-test-plan automation', () => {
  it('enumerates all registered tools from the real registry', () => {
    const plan = buildFailureTestPlan();
    expect(plan.tools.length).toBeGreaterThan(0);
    expect(plan.tools.every((t) => typeof t.id === 'string' && t.id.length > 0)).toBe(true);
  });

  it('includes the four recurring failure lanes for each tool', () => {
    const plan = buildFailureTestPlan();
    const requiredLanes = ['routeSmoke', 'metadata', 'a11yReadiness', 'e2eCoverage'];
    for (const tool of plan.tools) {
      for (const lane of requiredLanes) {
        expect(tool.lanes).toHaveProperty(lane);
        expect(typeof tool.lanes[lane].ok).toBe('boolean');
        expect(typeof tool.lanes[lane].detail).toBe('string');
      }
    }
  });

  it('includes vendor/build prerequisite lane in the summary', () => {
    const plan = buildFailureTestPlan();
    expect(plan.summary).toHaveProperty('buildPrerequisites');
    expect(typeof plan.summary.buildPrerequisites.ok).toBe('boolean');
    expect(Array.isArray(plan.summary.buildPrerequisites.details)).toBe(true);
  });

  it('flags a registry with duplicate IDs as a structural failure', () => {
    const badRegistry = [
      { id: 'dup', name: 'Dup A', icon: 'A', description: 'A.', path: '/a', category: 'utils', keywords: '' },
      { id: 'dup', name: 'Dup B', icon: 'B', description: 'B.', path: '/b', category: 'utils', keywords: '' },
    ];
    const plan = buildFailureTestPlan({ overrideTools: badRegistry });
    expect(plan.summary.structuralErrors.length).toBeGreaterThan(0);
    expect(plan.summary.structuralErrors.some((e) => e.includes('dup'))).toBe(true);
    expect(plan.summary.ok).toBe(false);
  });

  it('flags a registry with duplicate paths as a structural failure', () => {
    const badRegistry = [
      { id: 'a', name: 'A', icon: 'A', description: 'A.', path: '/same', category: 'utils', keywords: '' },
      { id: 'b', name: 'B', icon: 'B', description: 'B.', path: '/same', category: 'utils', keywords: '' },
    ];
    const plan = buildFailureTestPlan({ overrideTools: badRegistry });
    expect(plan.summary.structuralErrors.length).toBeGreaterThan(0);
    expect(plan.summary.ok).toBe(false);
  });

  it('flags a tool missing required metadata fields and fails summary', () => {
    const badRegistry = [
      { id: 'bad', name: '', icon: '', description: '', path: '/bad', category: 'utils' },
    ];
    const plan = buildFailureTestPlan({ overrideTools: badRegistry });
    const badTool = plan.tools.find((t) => t.id === 'bad');
    expect(badTool).toBeDefined();
    expect(badTool.lanes.metadata.ok).toBe(false);
    expect(plan.summary.ok).toBe(false);
  });

  it('flags missing route handlers as a route-smoke failure and fails summary', () => {
    const singleTool = [
      { id: 'ghost-tool', name: 'Ghost', icon: '👻', description: 'Ghost.', path: '/ghost', category: 'utils', keywords: '' },
    ];
    const plan = buildFailureTestPlan({ overrideTools: singleTool, overrideHandlers: {} });
    const ghost = plan.tools.find((t) => t.id === 'ghost-tool');
    expect(ghost.lanes.routeSmoke.ok).toBe(false);
    expect(ghost.lanes.routeSmoke.detail).toContain('missing handler');
    expect(plan.summary.ok).toBe(false);
  });

  it('flags missing e2e action coverage in the lane but does not fail summary by default', () => {
    const singleTool = [
      { id: 'no-e2e', name: 'No E2E', icon: 'x', description: 'x.', path: '/no-e2e', category: 'utils', keywords: 'test' },
    ];
    const handlers = { 'no-e2e': () => {} };
    const plan = buildFailureTestPlan({ overrideTools: singleTool, overrideHandlers: handlers, overrideToolActions: {} });
    const tool = plan.tools.find((t) => t.id === 'no-e2e');
    expect(tool.lanes.e2eCoverage.ok).toBe(false);
    expect(tool.lanes.e2eCoverage.detail).toContain('no TOOL_ACTIONS');
    expect(plan.summary.ok).toBe(true);
  });

  it('fails summary in strictE2E mode when e2e coverage is missing', () => {
    const singleTool = [
      { id: 'no-e2e', name: 'No E2E', icon: 'x', description: 'x.', path: '/no-e2e', category: 'utils', keywords: 'test' },
    ];
    const handlers = { 'no-e2e': () => {} };
    const plan = buildFailureTestPlan({ overrideTools: singleTool, overrideHandlers: handlers, overrideToolActions: {}, strictE2E: true });
    expect(plan.summary.ok).toBe(false);
    expect(plan.summary.strictE2E).toBe(true);
  });

  it('produces ok=true when a tool has a handler and an e2e action', () => {
    const singleTool = [
      { id: 'good', name: 'Good', icon: 'g', description: 'g.', path: '/good', category: 'utils', keywords: 'test' },
    ];
    const handlers = { good: () => {} };
    const actions = { good: { action: () => {}, waitFor: () => {} } };
    const plan = buildFailureTestPlan({ overrideTools: singleTool, overrideHandlers: handlers, overrideToolActions: actions });
    const tool = plan.tools.find((t) => t.id === 'good');
    expect(tool.lanes.routeSmoke.ok).toBe(true);
    expect(tool.lanes.e2eCoverage.ok).toBe(true);
    expect(plan.summary.ok).toBe(true);
  });
});
