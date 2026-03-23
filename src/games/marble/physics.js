/**
 * Enhanced marble physics engine with spatial hashing, improved collision,
 * bumpers/flippers, replay recording, and camera shake.
 *
 * Designed for client-side inline <script> use (no module imports).
 * All functions receive state objects; no module-level mutable state.
 */

// ── Spatial Hash Grid ──────────────────────────────────────────────
// Speeds up peg/marble collision from O(n*m) to ~O(n) by bucketing.

export function createSpatialHash(cellSize) {
  return { cellSize, cells: new Map() };
}

export function spatialHashClear(grid) {
  grid.cells.clear();
}

function _cellKey(cx, cy) {
  return (cx & 0xFFFF) | ((cy & 0xFFFF) << 16);
}

export function spatialHashInsert(grid, obj, idx) {
  const cs = grid.cellSize;
  const x0 = Math.floor((obj.x - (obj.r || 0)) / cs);
  const x1 = Math.floor((obj.x + (obj.r || 0)) / cs);
  const y0 = Math.floor((obj.y - (obj.r || 0)) / cs);
  const y1 = Math.floor((obj.y + (obj.r || 0)) / cs);
  for (let cx = x0; cx <= x1; cx++) {
    for (let cy = y0; cy <= y1; cy++) {
      const k = _cellKey(cx, cy);
      let bucket = grid.cells.get(k);
      if (!bucket) { bucket = []; grid.cells.set(k, bucket); }
      bucket.push(idx);
    }
  }
}

export function spatialHashQuery(grid, obj) {
  const cs = grid.cellSize;
  const x0 = Math.floor((obj.x - (obj.r || 0)) / cs);
  const x1 = Math.floor((obj.x + (obj.r || 0)) / cs);
  const y0 = Math.floor((obj.y - (obj.r || 0)) / cs);
  const y1 = Math.floor((obj.y + (obj.r || 0)) / cs);
  const seen = new Set();
  const result = [];
  for (let cx = x0; cx <= x1; cx++) {
    for (let cy = y0; cy <= y1; cy++) {
      const k = _cellKey(cx, cy);
      const bucket = grid.cells.get(k);
      if (!bucket) continue;
      for (let i = 0; i < bucket.length; i++) {
        const idx = bucket[i];
        if (!seen.has(idx)) {
          seen.add(idx);
          result.push(idx);
        }
      }
    }
  }
  return result;
}

// ── Collision helpers ──────────────────────────────────────────────

export function collideCircle(m, c, restitution) {
  const dx = m.x - c.x;
  const dy = m.y - c.y;
  const rr = m.r + c.r;
  const d2 = dx * dx + dy * dy;
  if (d2 <= 0 || d2 >= rr * rr) return false;
  const d = Math.sqrt(d2);
  const nx = dx / d;
  const ny = dy / d;
  const overlap = rr - d;
  m.x += nx * overlap;
  m.y += ny * overlap;
  const vn = m.vx * nx + m.vy * ny;
  if (vn < 0) {
    const j = -(1 + restitution) * vn;
    m.vx += j * nx;
    m.vy += j * ny;
  }
  return true;
}

export function collideMarbles(a, c, restitution) {
  const dx = c.x - a.x;
  const dy = c.y - a.y;
  const minDist = a.r + c.r;
  const distSq = dx * dx + dy * dy;
  if (distSq >= minDist * minDist) return false;

  let dist = Math.sqrt(distSq);
  let nx = 1;
  let ny = 0;
  if (dist > 1e-6) {
    nx = dx / dist;
    ny = dy / dist;
  } else {
    dist = 1;
  }

  const overlap = Math.max(0, minDist - dist);
  if (overlap > 0) {
    const half = overlap * 0.5;
    a.x -= nx * half;
    a.y -= ny * half;
    c.x += nx * half;
    c.y += ny * half;
  }

  const rvx = c.vx - a.vx;
  const rvy = c.vy - a.vy;
  const velAlongNormal = rvx * nx + rvy * ny;
  if (velAlongNormal > 0) return false;

  const impulse = -(1 + restitution) * velAlongNormal / 2;
  const ix = impulse * nx;
  const iy = impulse * ny;
  a.vx -= ix;
  a.vy -= iy;
  c.vx += ix;
  c.vy += iy;
  return true;
}

// Bumper collision — higher restitution + radial kick
export function collideBumper(m, bumper) {
  const dx = m.x - bumper.x;
  const dy = m.y - bumper.y;
  const rr = m.r + bumper.r;
  const d2 = dx * dx + dy * dy;
  if (d2 <= 0 || d2 >= rr * rr) return false;
  const d = Math.sqrt(d2);
  const nx = dx / d;
  const ny = dy / d;
  const overlap = rr - d;
  m.x += nx * overlap;
  m.y += ny * overlap;

  // Strong kick away from bumper center
  const kickForce = bumper.kickForce || 600;
  const speed = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
  const minSpeed = Math.max(speed, kickForce * 0.5);
  m.vx = nx * minSpeed;
  m.vy = ny * minSpeed;
  return true;
}

// Flipper collision — deflects marble at an angle
export function collideFlipper(m, flipper) {
  // Flipper is a line segment from (x1,y1) to (x2,y2)
  const abx = flipper.x2 - flipper.x1;
  const aby = flipper.y2 - flipper.y1;
  const apx = m.x - flipper.x1;
  const apy = m.y - flipper.y1;
  const abLen2 = abx * abx + aby * aby;
  if (abLen2 <= 0) return false;
  let t = (apx * abx + apy * aby) / abLen2;
  if (t < 0) t = 0;
  if (t > 1) t = 1;
  const cx = flipper.x1 + abx * t;
  const cy = flipper.y1 + aby * t;
  const dx = m.x - cx;
  const dy = m.y - cy;
  const d2 = dx * dx + dy * dy;
  const rr = m.r + (flipper.thickness || 4);
  if (d2 <= 0 || d2 >= rr * rr) return false;
  const d = Math.sqrt(d2);
  const nx = dx / d;
  const ny = dy / d;
  const overlap = rr - d;
  m.x += nx * overlap;
  m.y += ny * overlap;
  const vn = m.vx * nx + m.vy * ny;
  if (vn < 0) {
    const restitution = flipper.restitution || 0.85;
    const j = -(1 + restitution) * vn;
    m.vx += j * nx;
    m.vy += j * ny;
  }
  return true;
}

// ── Camera Shake ───────────────────────────────────────────────────

export function createShakeState() {
  return { intensity: 0, decay: 0.92, offsetX: 0, offsetY: 0 };
}

export function triggerShake(shake, intensity) {
  shake.intensity = Math.min(shake.intensity + intensity, 12);
}

export function updateShake(shake) {
  if (shake.intensity < 0.3) {
    shake.intensity = 0;
    shake.offsetX = 0;
    shake.offsetY = 0;
    return;
  }
  shake.offsetX = (Math.random() - 0.5) * 2 * shake.intensity;
  shake.offsetY = (Math.random() - 0.5) * 2 * shake.intensity;
  shake.intensity *= shake.decay;
}

// ── Replay Recorder ────────────────────────────────────────────────

export function createReplayRecorder() {
  return { frames: new Map(), recording: false, frameInterval: 3, frameCounter: 0 };
}

export function replayRecordFrame(recorder, marbles, simTime) {
  if (!recorder.recording) return;
  recorder.frameCounter++;
  if (recorder.frameCounter % recorder.frameInterval !== 0) return;
  for (let i = 0; i < marbles.length; i++) {
    const m = marbles[i];
    let arr = recorder.frames.get(m.id);
    if (!arr) { arr = []; recorder.frames.set(m.id, arr); }
    if (arr.length < 2000) {
      arr.push({ x: m.x, y: m.y, t: simTime });
    }
  }
}

export function getReplayPath(recorder, marbleId) {
  return recorder.frames.get(marbleId) || [];
}

// ── Particle Trail System ──────────────────────────────────────────

export function createTrailParticle(x, y, color) {
  return {
    x, y, color,
    alpha: 0.6,
    r: 2 + Math.random() * 2,
    life: 0.4 + Math.random() * 0.3
  };
}

export function updateTrailParticles(particles, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.alpha = Math.max(0, p.life * 1.5);
    p.r *= 0.97;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

// ── Peg layout generators ──────────────────────────────────────────

export function generatePegs(boardW, board, pegProfile, randRangeFn) {
  const usableW = boardW - board.sidePad * 2;
  const targetCols = pegProfile.targetCols || 10;
  const spacingX = Math.max(pegProfile.spacingXMin || 34,
    Math.min(pegProfile.spacingXMax || 56, usableW / targetCols));
  const rows = pegProfile.rows || 32;
  const topY = board.topPad + 140;
  const bottomY = board.worldH - board.slotHeight - 120;
  const spacingY = Math.max(pegProfile.spacingYMin || 44,
    Math.min(pegProfile.spacingYMax || 58, (bottomY - topY) / Math.max(1, rows)));

  const maxCols = Math.floor(usableW / spacingX);
  const baseCols = Math.max(9, Math.min(11, maxCols));
  const pegs = [];

  for (let r = 0; r < rows; r++) {
    const y = topY + r * spacingY;
    const isOffset = r % 2 === 1;
    const rowW = (baseCols - 1) * spacingX;
    const startX = (boardW / 2) - (rowW / 2) + (isOffset ? spacingX * 0.5 : 0);
    for (let c = 0; c < baseCols; c++) {
      const x = startX + c * spacingX;
      if (x < board.sidePad + 16 || x > boardW - board.sidePad - 16) continue;
      pegs.push({
        x: x + randRangeFn(-(pegProfile.jitterX || 2), pegProfile.jitterX || 2),
        y: y + randRangeFn(-(pegProfile.jitterY || 1.5), pegProfile.jitterY || 1.5),
        r: board.pegR
      });
    }
  }
  return pegs;
}

// ── Bumper/Flipper generators for Pinball theme ────────────────────

export function generateBumpers(boardW, board, randRangeFn) {
  const bumpers = [];
  const usableW = boardW - board.sidePad * 2;
  const topY = board.topPad + 200;
  const bottomY = board.worldH - board.slotHeight - 200;
  const midX = boardW / 2;

  // Place bumpers in a triangular pattern through the middle section
  const bumperRows = 6;
  const sectionH = (bottomY - topY) / (bumperRows + 1);

  for (let r = 0; r < bumperRows; r++) {
    const y = topY + (r + 1) * sectionH;
    const count = (r % 2 === 0) ? 3 : 2;
    const spread = usableW * 0.55;
    for (let c = 0; c < count; c++) {
      const frac = count === 1 ? 0.5 : c / (count - 1);
      const x = midX - spread / 2 + frac * spread + randRangeFn(-8, 8);
      bumpers.push({
        x,
        y: y + randRangeFn(-10, 10),
        r: 18 + randRangeFn(-2, 4),
        kickForce: 500 + randRangeFn(0, 200),
        hitTime: 0
      });
    }
  }
  return bumpers;
}

export function generateFlippers(boardW, board) {
  const flippers = [];
  const usableW = boardW - board.sidePad * 2;
  const midX = boardW / 2;
  const topY = board.topPad + 400;
  const bottomY = board.worldH - board.slotHeight - 300;

  // Place flipper pairs at intervals
  const flipperRows = 4;
  const sectionH = (bottomY - topY) / (flipperRows + 1);

  for (let r = 0; r < flipperRows; r++) {
    const y = topY + (r + 1) * sectionH;
    const side = (r % 2 === 0) ? -1 : 1;
    const angle = side * 0.35;
    const len = 40 + (r % 2) * 10;

    // Left flipper
    const lx = midX - usableW * 0.28;
    flippers.push({
      x1: lx, y1: y,
      x2: lx + Math.cos(angle) * len, y2: y + Math.sin(angle) * len,
      thickness: 5, restitution: 0.82
    });

    // Right flipper
    const rx = midX + usableW * 0.28;
    flippers.push({
      x1: rx, y1: y,
      x2: rx - Math.cos(angle) * len, y2: y + Math.sin(angle) * len,
      thickness: 5, restitution: 0.82
    });
  }
  return flippers;
}
