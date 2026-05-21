import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const WIDTH = 1200;
const HEIGHT = 630;
const OUTPUT = new URL('../dist/og-image.png', import.meta.url);
const OUTPUT_PATH = fileURLToPath(OUTPUT);

const COLORS = {
  surface50: [248, 250, 252, 255],
  surface100: [241, 245, 249, 255],
  surface200: [226, 232, 240, 255],
  surface600: [71, 85, 105, 255],
  surface900: [15, 23, 42, 255],
  primary100: [219, 234, 254, 255],
  primary300: [147, 197, 253, 255],
  primary500: [59, 130, 246, 255],
  primary600: [37, 99, 235, 255],
  primary700: [29, 78, 216, 255],
  white: [255, 255, 255, 255]
};

const FONT = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000']
};

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function mix(left, right, t) {
  return [
    lerp(left[0], right[0], t),
    lerp(left[1], right[1], t),
    lerp(left[2], right[2], t),
    255
  ];
}

const pixels = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);

function offset(x, y) {
  return y * (WIDTH * 4 + 1) + 1 + x * 4;
}

function setPixel(x, y, color) {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
  const i = offset(x, y);
  pixels[i] = color[0];
  pixels[i + 1] = color[1];
  pixels[i + 2] = color[2];
  pixels[i + 3] = color[3];
}

function fillRect(x, y, w, h, color) {
  for (let row = Math.max(0, y); row < Math.min(HEIGHT, y + h); row++) {
    for (let col = Math.max(0, x); col < Math.min(WIDTH, x + w); col++) {
      setPixel(col, row, color);
    }
  }
}

function drawGlyph(char, x, y, scale, color) {
  const glyph = FONT[char] || FONT[' '];
  for (let gy = 0; gy < glyph.length; gy++) {
    for (let gx = 0; gx < glyph[gy].length; gx++) {
      if (glyph[gy][gx] !== '1') continue;
      fillRect(x + gx * scale, y + gy * scale, scale, scale, color);
    }
  }
}

function drawText(text, x, y, scale, color, letterSpacing = Math.max(2, Math.floor(scale / 3))) {
  let cursor = x;
  for (const char of text.toUpperCase()) {
    drawGlyph(char, cursor, y, scale, color);
    cursor += char === ' ' ? 4 * scale : 5 * scale + letterSpacing;
  }
}

function drawCard(x, y, w, h, color, shadow = true) {
  if (shadow) fillRect(x + 10, y + 10, w, h, [15, 23, 42, 28]);
  fillRect(x, y, w, h, color);
}

for (let y = 0; y < HEIGHT; y++) {
  pixels[y * (WIDTH * 4 + 1)] = 0;
  for (let x = 0; x < WIDTH; x++) {
    const t = (x / (WIDTH - 1) * 0.65) + (y / (HEIGHT - 1) * 0.35);
    const color = mix(COLORS.surface50, COLORS.primary100, t);
    setPixel(x, y, color);
  }
}

fillRect(0, 0, 1200, 14, COLORS.primary600);
fillRect(0, 616, 1200, 14, COLORS.primary600);
fillRect(72, 92, 180, 446, COLORS.primary600);
fillRect(252, 92, 18, 446, COLORS.primary300);

drawCard(320, 92, 760, 446, COLORS.white);
fillRect(360, 132, 160, 16, COLORS.primary600);
fillRect(360, 168, 590, 8, COLORS.surface200);
fillRect(360, 190, 520, 8, COLORS.surface200);

drawText('SIMPLETOOL', 360, 238, 18, COLORS.surface900, 6);
drawText('PRIVACY-FIRST BROWSER UTILITIES', 364, 388, 7, COLORS.surface600, 3);
drawText('JSON SECURITY NETWORK TEXT IMAGES', 365, 462, 5, COLORS.primary700, 2);

for (const [x, y, w] of [[94, 132, 86], [94, 184, 126], [94, 236, 96], [94, 288, 134], [94, 340, 106], [94, 392, 118]]) {
  fillRect(x, y, w, 24, COLORS.white);
  fillRect(x, y + 32, 108, 10, COLORS.primary300);
}

fillRect(948, 142, 72, 72, COLORS.primary500);
fillRect(968, 162, 32, 32, COLORS.white);
fillRect(980, 174, 8, 8, COLORS.primary500);
fillRect(934, 462, 96, 20, COLORS.primary600);
fillRect(934, 492, 70, 12, COLORS.surface200);

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(WIDTH, 0);
ihdr.writeUInt32BE(HEIGHT, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(pixels, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
]);

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, png);
console.log(`wrote ${OUTPUT_PATH} (${png.length} bytes, ${WIDTH}x${HEIGHT})`);
