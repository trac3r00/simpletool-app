import { describe, it, expect } from 'vitest';
import {
  cryptoUint32, randU32, randInt, randFloat, randFloat01,
  randRange, shuffleInPlace, clamp, escapeHtml,
  spawnConfetti, tickConfetti, drawConfettiParticles
} from './game-utils.js';

describe('game-utils', () => {

  describe('cryptoUint32 / randU32', () => {
    it('returns a 32-bit unsigned integer', () => {
      const v = cryptoUint32();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(0xFFFFFFFF);
      expect(Number.isInteger(v)).toBe(true);
    });

    it('randU32 is the same function', () => {
      expect(randU32).toBe(cryptoUint32);
    });
  });

  describe('randInt', () => {
    it('returns 0 for maxExclusive=0', () => {
      expect(randInt(0)).toBe(0);
    });

    it('always returns 0 for maxExclusive=1', () => {
      for (let i = 0; i < 50; i++) {
        expect(randInt(1)).toBe(0);
      }
    });

    it('stays within [0, maxExclusive)', () => {
      for (let i = 0; i < 200; i++) {
        const v = randInt(10);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(10);
        expect(Number.isInteger(v)).toBe(true);
      }
    });

    it('produces roughly uniform distribution', () => {
      const bins = new Array(6).fill(0);
      const N = 6000;
      for (let i = 0; i < N; i++) bins[randInt(6)]++;
      const expected = N / 6;
      for (const count of bins) {
        expect(count).toBeGreaterThan(expected * 0.7);
        expect(count).toBeLessThan(expected * 1.3);
      }
    });
  });

  describe('randFloat / randFloat01', () => {
    it('returns value in [0, 1)', () => {
      for (let i = 0; i < 100; i++) {
        const v = randFloat();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });

    it('randFloat01 is the same function', () => {
      expect(randFloat01).toBe(randFloat);
    });
  });

  describe('randRange', () => {
    it('returns value in [min, max)', () => {
      for (let i = 0; i < 100; i++) {
        const v = randRange(5, 10);
        expect(v).toBeGreaterThanOrEqual(5);
        expect(v).toBeLessThan(10);
      }
    });
  });

  describe('shuffleInPlace', () => {
    it('returns the same array reference', () => {
      const arr = [1, 2, 3];
      const result = shuffleInPlace(arr);
      expect(result).toBe(arr);
    });

    it('preserves all elements', () => {
      const arr = [10, 20, 30, 40, 50];
      shuffleInPlace(arr);
      expect(arr.sort((a, b) => a - b)).toEqual([10, 20, 30, 40, 50]);
    });

    it('produces different permutations over many runs', () => {
      const seen = new Set();
      for (let i = 0; i < 100; i++) {
        const arr = [1, 2, 3, 4];
        shuffleInPlace(arr);
        seen.add(arr.join(','));
      }
      expect(seen.size).toBeGreaterThan(5);
    });

    it('handles single-element and empty arrays', () => {
      expect(shuffleInPlace([])).toEqual([]);
      expect(shuffleInPlace([42])).toEqual([42]);
    });
  });

  describe('clamp', () => {
    it('returns min when n < min', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('returns max when n > max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('returns n when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('handles boundary values', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('escapeHtml', () => {
    it('escapes ampersand', () => {
      expect(escapeHtml('a&b')).toBe('a&amp;b');
    });

    it('escapes angle brackets', () => {
      expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
    });

    it('escapes quotes', () => {
      expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
      expect(escapeHtml("it's")).toBe("it&#39;s");
    });

    it('handles all entities together', () => {
      expect(escapeHtml('<a href="x">&\'</a>'))
        .toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
    });

    it('coerces non-string input', () => {
      expect(escapeHtml(123)).toBe('123');
      expect(escapeHtml(null)).toBe('null');
    });
  });

  describe('spawnConfetti', () => {
    it('pushes the correct number of particles', () => {
      const particles = [];
      spawnConfetti(particles, 100, 100, 20, ['#f00', '#0f0'], 1);
      expect(particles.length).toBe(20);
    });

    it('each particle has required properties', () => {
      const particles = [];
      spawnConfetti(particles, 50, 50, 5, ['#fff'], 1);
      for (const p of particles) {
        expect(p).toHaveProperty('x', 50);
        expect(p).toHaveProperty('y', 50);
        expect(p).toHaveProperty('vx');
        expect(p).toHaveProperty('vy');
        expect(p).toHaveProperty('rot');
        expect(p).toHaveProperty('vr');
        expect(p).toHaveProperty('w');
        expect(p).toHaveProperty('h');
        expect(p).toHaveProperty('alpha', 1);
        expect(p).toHaveProperty('color', '#fff');
      }
    });

    it('appends to existing particles', () => {
      const particles = [{ existing: true }];
      spawnConfetti(particles, 0, 0, 3, ['#000'], 1);
      expect(particles.length).toBe(4);
      expect(particles[0].existing).toBe(true);
    });
  });

  describe('tickConfetti', () => {
    it('applies gravity and movement', () => {
      const particles = [{
        x: 100, y: 100, vx: 1, vy: 0,
        rot: 0, vr: 0.1, w: 5, h: 5, alpha: 1
      }];
      tickConfetti(particles, 1 / 60, 500);
      expect(particles[0].y).toBeGreaterThan(100);
      expect(particles[0].x).toBeGreaterThan(100);
    });

    it('removes dead particles (low alpha)', () => {
      const particles = [{
        x: 100, y: 100, vx: 0, vy: 0,
        rot: 0, vr: 0, w: 5, h: 5, alpha: 0.03
      }];
      tickConfetti(particles, 1 / 60, 500);
      expect(particles.length).toBe(0);
    });

    it('removes particles below canvas', () => {
      const particles = [{
        x: 100, y: 600, vx: 0, vy: 0,
        rot: 0, vr: 0, w: 5, h: 5, alpha: 1
      }];
      tickConfetti(particles, 1 / 60, 500);
      expect(particles.length).toBe(0);
    });
  });

  describe('drawConfettiParticles', () => {
    it('does nothing for empty array', () => {
      let saveCalls = 0;
      const ctx = {
        save() { saveCalls++; },
        restore() {},
        translate() {},
        rotate() {},
        fillRect() {},
        globalAlpha: 1,
        fillStyle: ''
      };
      drawConfettiParticles(ctx, []);
      expect(saveCalls).toBe(0);
    });

    it('calls save/restore for each particle', () => {
      let saveCalls = 0;
      let restoreCalls = 0;
      const ctx = {
        save() { saveCalls++; },
        restore() { restoreCalls++; },
        translate() {},
        rotate() {},
        fillRect() {},
        globalAlpha: 1,
        fillStyle: ''
      };
      const particles = [
        { x: 0, y: 0, rot: 0, alpha: 1, color: '#f00', w: 4, h: 4 },
        { x: 0, y: 0, rot: 0, alpha: 1, color: '#0f0', w: 4, h: 4 }
      ];
      drawConfettiParticles(ctx, particles);
      expect(saveCalls).toBe(3);
      expect(restoreCalls).toBe(3);
    });
  });
});
