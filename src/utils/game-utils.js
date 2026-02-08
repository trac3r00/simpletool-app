/**
 * Shared game utilities for marble-roulette, roulette-wheel, and ladder-game.
 * Bundled to dist/vendor/game-utils.min.js as IIFE with global `GameUtils`.
 *
 * Provides crypto-secure RNG, audio helpers, confetti engine, and common utils.
 */

// ── Crypto RNG ──────────────────────────────────────────────────────

/** Return a crypto-random unsigned 32-bit integer. */
export function cryptoUint32() {
  const u = new Uint32Array(1);
  crypto.getRandomValues(u);
  return u[0] >>> 0;
}

/** Alias kept for marble-roulette compatibility. */
export const randU32 = cryptoUint32;

/**
 * Rejection-sampling integer in [0, maxExclusive).
 * Avoids modulo bias.
 */
export function randInt(maxExclusive) {
  const m = maxExclusive >>> 0;
  if (!m) return 0;
  const limit = Math.floor(0x100000000 / m) * m;
  while (true) {
    const x = cryptoUint32();
    if (x < limit) return x % m;
  }
}

/** Crypto-random float in [0, 1) using 32-bit precision. */
export function randFloat() {
  return cryptoUint32() / 0x100000000;
}

/** Alias kept for marble-roulette compatibility (same 32-bit impl). */
export const randFloat01 = randFloat;

/** Crypto-random float in [min, max). */
export function randRange(min, max) {
  return min + (max - min) * randFloat();
}

/**
 * Fisher-Yates shuffle with crypto RNG (rejection sampling).
 * Mutates and returns the array.
 */
export function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const m = (i + 1) >>> 0;
    const limit = Math.floor(0x100000000 / m) * m;
    let x = 0;
    do { x = cryptoUint32() >>> 0; } while (x >= limit);
    const j = x % m;
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

// ── Numeric helpers ─────────────────────────────────────────────────

/** Clamp n to [min, max]. */
export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// ── String helpers ──────────────────────────────────────────────────

/** Escape HTML entities (&, <, >, ", '). */
export function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ── Audio helpers ───────────────────────────────────────────────────

/**
 * Lazily create / return an AudioContext.
 * `audioHolder` should be an object with a `ctx` property (e.g. `{ ctx: null }`).
 */
export function ensureAudioCtx(audioHolder) {
  if (audioHolder.ctx) return audioHolder.ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioHolder.ctx = new AC();
    return audioHolder.ctx;
  } catch (e) { return null; }
}

/**
 * Play a short sine-wave beep.
 * `audioHolder` is an object with a `ctx` property.
 */
export function playBeep(audioHolder, freq, durMs, gain) {
  const c = ensureAudioCtx(audioHolder);
  if (!c) return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    const t0 = c.currentTime;
    const dur = clamp(durMs, 10, 500) / 1000;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, clamp(gain, 0, 0.5)), t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch (e) {}
}

// ── Confetti engine ─────────────────────────────────────────────────

/**
 * Spawn confetti particles into the `particles` array.
 * @param {Array} particles — mutable array to push into
 * @param {number} cx — center x
 * @param {number} cy — center y
 * @param {number} count — how many particles
 * @param {string[]} colors — color palette
 * @param {number} [speedMult=1] — speed multiplier
 */
export function spawnConfetti(particles, cx, cy, count, colors, speedMult) {
  const sm = speedMult || 1;
  for (let i = 0; i < count; i++) {
    const a = randFloat() * Math.PI * 2;
    const sp = (2.2 + randFloat() * 4.5) * sm;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 2.8,
      rot: randFloat() * Math.PI * 2,
      vr: (randFloat() - 0.5) * 0.4,
      w: 4 + randInt(7),
      h: 8 + randInt(12),
      alpha: 1,
      shimmer: randFloat() > 0.6,
      color: colors[randInt(colors.length)]
    });
  }
}

/**
 * Advance confetti physics by `dt` seconds.
 * Removes dead particles (alpha < 0.04 or below canvasH + margin).
 * Returns the (mutated) particles array.
 */
export function tickConfetti(particles, dt, canvasH) {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.vy += 9.2 * dt;
    p.x += p.vx * 60 * dt;
    p.y += p.vy * 60 * dt;
    p.rot += p.vr * 60 * dt;
    p.alpha *= 0.988;
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (p.alpha < 0.04 || p.y > canvasH + 60) {
      particles.splice(i, 1);
    }
  }
  return particles;
}

/**
 * Draw confetti particles onto a 2D canvas context.
 */
export function drawConfettiParticles(ctx, particles) {
  if (!particles.length) return;
  ctx.save();
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }
  ctx.restore();
}
