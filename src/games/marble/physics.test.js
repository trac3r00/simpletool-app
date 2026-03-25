import { describe, it, expect } from 'vitest';
import {
  createSpatialHash,
  spatialHashClear,
  spatialHashInsert,
  spatialHashQuery,
  collideCircle,
  collideMarbles,
  collideBumper,
  collideFlipper,
  createShakeState,
  triggerShake,
  updateShake,
  createReplayRecorder,
  replayRecordFrame,
  getReplayPath,
  createTrailParticle,
  updateTrailParticles,
  generatePegs,
  generateBumpers,
  generateFlippers
} from './physics.js';

describe('Spatial Hash', () => {
  it('creates a spatial hash with given cell size', () => {
    const grid = createSpatialHash(50);
    expect(grid.cellSize).toBe(50);
    expect(grid.cells).toBeInstanceOf(Map);
  });

  it('inserts and queries objects', () => {
    const grid = createSpatialHash(50);
    spatialHashInsert(grid, { x: 100, y: 100, r: 5 }, 0);
    spatialHashInsert(grid, { x: 200, y: 200, r: 5 }, 1);

    const near = spatialHashQuery(grid, { x: 100, y: 100, r: 10 });
    expect(near).toContain(0);
  });

  it('clears the grid', () => {
    const grid = createSpatialHash(50);
    spatialHashInsert(grid, { x: 100, y: 100, r: 5 }, 0);
    spatialHashClear(grid);
    expect(grid.cells.size).toBe(0);
  });

  it('returns unique indices', () => {
    const grid = createSpatialHash(10);
    spatialHashInsert(grid, { x: 5, y: 5, r: 8 }, 0);
    const results = spatialHashQuery(grid, { x: 5, y: 5, r: 8 });
    const unique = new Set(results);
    expect(unique.size).toBe(results.length);
  });
});

describe('collideCircle', () => {
  it('returns false when circles do not overlap', () => {
    const m = { x: 0, y: 0, r: 5, vx: 0, vy: 0 };
    const c = { x: 20, y: 0, r: 5 };
    expect(collideCircle(m, c, 0.5)).toBe(false);
  });

  it('resolves overlap and adjusts velocity', () => {
    const m = { x: 8, y: 0, r: 5, vx: -10, vy: 0 };
    const c = { x: 0, y: 0, r: 5 };
    const result = collideCircle(m, c, 0.5);
    expect(result).toBe(true);
    // Marble should be pushed away
    expect(m.x).toBeGreaterThanOrEqual(10);
  });

  it('does not adjust velocity when moving away', () => {
    const m = { x: 8, y: 0, r: 5, vx: 10, vy: 0 };
    const c = { x: 0, y: 0, r: 5 };
    collideCircle(m, c, 0.5);
    // vx should remain positive (moving away)
    expect(m.vx).toBeGreaterThan(0);
  });
});

describe('collideMarbles', () => {
  it('returns false for non-overlapping marbles', () => {
    const a = { x: 0, y: 0, r: 5, vx: 0, vy: 0 };
    const b = { x: 20, y: 0, r: 5, vx: 0, vy: 0 };
    expect(collideMarbles(a, b, 0.5)).toBe(false);
  });

  it('resolves collision between overlapping marbles', () => {
    const a = { x: 0, y: 0, r: 5, vx: 5, vy: 0 };
    const b = { x: 8, y: 0, r: 5, vx: -5, vy: 0 };
    const result = collideMarbles(a, b, 0.5);
    expect(result).toBe(true);
  });

  it('separates overlapping marbles', () => {
    const a = { x: 0, y: 0, r: 5, vx: 5, vy: 0 };
    const b = { x: 8, y: 0, r: 5, vx: -5, vy: 0 };
    collideMarbles(a, b, 0.5);
    const dist = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
    expect(dist).toBeGreaterThanOrEqual(a.r + b.r - 0.01);
  });
});

describe('collideBumper', () => {
  it('returns false when marble is far from bumper', () => {
    const m = { x: 100, y: 100, r: 5, vx: 0, vy: 0 };
    const bumper = { x: 0, y: 0, r: 20, kickForce: 600 };
    expect(collideBumper(m, bumper)).toBe(false);
  });

  it('kicks marble away on collision', () => {
    const m = { x: 22, y: 0, r: 5, vx: -10, vy: 0 };
    const bumper = { x: 0, y: 0, r: 20, kickForce: 600 };
    const result = collideBumper(m, bumper);
    expect(result).toBe(true);
    // Marble should be kicked away (positive vx)
    expect(m.vx).toBeGreaterThan(0);
  });
});

describe('collideFlipper', () => {
  it('returns false when marble is far from flipper', () => {
    const m = { x: 100, y: 100, r: 5, vx: 0, vy: 0 };
    const flipper = { x1: 0, y1: 0, x2: 40, y2: 0, thickness: 4 };
    expect(collideFlipper(m, flipper)).toBe(false);
  });

  it('deflects marble on collision', () => {
    const m = { x: 20, y: 6, r: 5, vx: 0, vy: -10 };
    const flipper = { x1: 0, y1: 0, x2: 40, y2: 0, thickness: 4, restitution: 0.85 };
    const result = collideFlipper(m, flipper);
    expect(result).toBe(true);
    expect(m.vy).toBeGreaterThan(0); // deflected upward
  });
});

describe('Camera Shake', () => {
  it('creates shake state with zero intensity', () => {
    const shake = createShakeState();
    expect(shake.intensity).toBe(0);
    expect(shake.offsetX).toBe(0);
    expect(shake.offsetY).toBe(0);
  });

  it('triggers shake with intensity', () => {
    const shake = createShakeState();
    triggerShake(shake, 5);
    expect(shake.intensity).toBe(5);
  });

  it('caps shake intensity at 12', () => {
    const shake = createShakeState();
    triggerShake(shake, 20);
    expect(shake.intensity).toBe(12);
  });

  it('decays shake over updates', () => {
    const shake = createShakeState();
    triggerShake(shake, 5);
    updateShake(shake);
    expect(shake.intensity).toBeLessThan(5);
  });

  it('zeros out below threshold', () => {
    const shake = createShakeState();
    shake.intensity = 0.1;
    updateShake(shake);
    expect(shake.intensity).toBe(0);
    expect(shake.offsetX).toBe(0);
    expect(shake.offsetY).toBe(0);
  });
});

describe('Replay Recorder', () => {
  it('creates empty recorder', () => {
    const rec = createReplayRecorder();
    expect(rec.frames).toBeInstanceOf(Map);
    expect(rec.recording).toBe(false);
  });

  it('does not record when not started', () => {
    const rec = createReplayRecorder();
    replayRecordFrame(rec, [{ id: 'a', x: 0, y: 0 }], 0);
    expect(getReplayPath(rec, 'a')).toEqual([]);
  });

  it('records frames when active', () => {
    const rec = createReplayRecorder();
    rec.recording = true;
    rec.frameInterval = 1;
    replayRecordFrame(rec, [{ id: 'a', x: 10, y: 20 }], 0.1);
    replayRecordFrame(rec, [{ id: 'a', x: 15, y: 25 }], 0.2);
    const path = getReplayPath(rec, 'a');
    expect(path.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty array for unknown marble', () => {
    const rec = createReplayRecorder();
    expect(getReplayPath(rec, 'nonexistent')).toEqual([]);
  });
});

describe('Trail Particles', () => {
  it('creates a trail particle', () => {
    const p = createTrailParticle(10, 20, '#ff0000');
    expect(p.x).toBe(10);
    expect(p.y).toBe(20);
    expect(p.color).toBe('#ff0000');
    expect(p.alpha).toBeGreaterThan(0);
    expect(p.life).toBeGreaterThan(0);
  });

  it('removes dead particles on update', () => {
    const particles = [
      { x: 0, y: 0, color: '#000', alpha: 0.5, r: 2, life: 0.01 }
    ];
    updateTrailParticles(particles, 0.1);
    expect(particles).toHaveLength(0);
  });

  it('decreases life over time', () => {
    const particles = [
      { x: 0, y: 0, color: '#000', alpha: 0.6, r: 3, life: 0.5 }
    ];
    updateTrailParticles(particles, 0.1);
    expect(particles[0].life).toBeCloseTo(0.4);
    // alpha is recalculated as life * 1.5
    expect(particles[0].alpha).toBeCloseTo(0.4 * 1.5);
  });
});

describe('generatePegs', () => {
  it('generates an array of pegs', () => {
    const board = { sidePad: 20, topPad: 40, worldH: 2000, slotHeight: 80, pegR: 6 };
    const pegProfile = {
      rows: 10, targetCols: 5,
      spacingXMin: 34, spacingXMax: 56,
      spacingYMin: 44, spacingYMax: 58,
      jitterX: 2, jitterY: 1.5
    };
    const pegs = generatePegs(400, board, pegProfile, () => 0);
    expect(pegs.length).toBeGreaterThan(0);
    for (const peg of pegs) {
      expect(peg).toHaveProperty('x');
      expect(peg).toHaveProperty('y');
      expect(peg).toHaveProperty('r', 6);
    }
  });
});

describe('generateBumpers', () => {
  it('generates bumpers for pinball', () => {
    const board = { sidePad: 20, topPad: 40, worldH: 2000, slotHeight: 80 };
    const bumpers = generateBumpers(400, board, () => 0);
    expect(bumpers.length).toBeGreaterThan(0);
    for (const b of bumpers) {
      expect(b).toHaveProperty('x');
      expect(b).toHaveProperty('y');
      expect(b).toHaveProperty('r');
      expect(b).toHaveProperty('kickForce');
    }
  });
});

describe('generateFlippers', () => {
  it('generates flipper pairs', () => {
    const board = { sidePad: 20, topPad: 40, worldH: 2000, slotHeight: 80 };
    const flippers = generateFlippers(400, board);
    expect(flippers.length).toBeGreaterThan(0);
    // Should be pairs (even number)
    expect(flippers.length % 2).toBe(0);
    for (const f of flippers) {
      expect(f).toHaveProperty('x1');
      expect(f).toHaveProperty('y1');
      expect(f).toHaveProperty('x2');
      expect(f).toHaveProperty('y2');
      expect(f).toHaveProperty('thickness');
      expect(f).toHaveProperty('restitution');
    }
  });
});
