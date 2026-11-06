// Each function is self-contained: the route inlines them with fn.toString().

// Parse a CSS-like color string into exact 0-255 RGB channels plus alpha (0-1).
// Accepts #rgb, #rgba, #rrggbb, #rrggbbaa, rgb()/rgba() (comma or space syntax,
// percentages, decimals, "/ alpha"), hsl()/hsla() (deg/turn/rad units) and hsv().
// Returns null for anything unrecognized or out of range.
export function parseColor(input) {
  const str = String(input == null ? "" : input).trim().toLowerCase();
  if (!str) return null;

  const hex = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(str);
  if (hex) {
    let h = hex[1];
    if (h.length <= 4) h = h.split("").map((c) => c + c).join("");
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? Math.round((parseInt(h.slice(6, 8), 16) / 255) * 1000) / 1000 : 1,
    };
  }

  const fn = /^(rgba?|hsla?|hsva?)\s*\(\s*([^)]*?)\s*\)$/.exec(str);
  if (!fn) return null;
  const name = fn[1].replace(/a$/, "");
  let body = fn[2];
  let alphaPart = null;
  const slash = body.split("/");
  if (slash.length > 2) return null;
  if (slash.length === 2) {
    body = slash[0];
    alphaPart = slash[1].trim();
  }
  let parts = body.includes(",")
    ? body.split(",").map((s) => s.trim())
    : body.trim().split(/\s+/);
  if (alphaPart === null && parts.length === 4) alphaPart = parts.pop();
  if (parts.length !== 3 || parts.some((p) => p === "")) return null;

  const num = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/;
  const readNumber = (s) => (num.test(s) ? parseFloat(s) : NaN);
  const readPercent = (s) => (s.endsWith("%") ? readNumber(s.slice(0, -1)) : NaN);
  const readPercentLoose = (s) => (s.endsWith("%") ? readNumber(s.slice(0, -1)) : readNumber(s));

  let a = 1;
  if (alphaPart !== null) {
    a = alphaPart.endsWith("%") ? readPercent(alphaPart) / 100 : readNumber(alphaPart);
    if (!Number.isFinite(a) || a < 0 || a > 1) return null;
  }

  if (name === "rgb") {
    const ch = parts.map((p) => (p.endsWith("%") ? (readPercent(p) / 100) * 255 : readNumber(p)));
    if (ch.some((v) => !Number.isFinite(v) || v < 0 || v > 255)) return null;
    return { r: Math.round(ch[0]), g: Math.round(ch[1]), b: Math.round(ch[2]), a };
  }

  const hueMatch = /^([+-]?(?:\d+\.?\d*|\.\d+))(deg|turn|rad|grad)?$/.exec(parts[0]);
  if (!hueMatch) return null;
  let hue = parseFloat(hueMatch[1]);
  const unit = hueMatch[2];
  if (unit === "turn") hue *= 360;
  else if (unit === "rad") hue = (hue * 180) / Math.PI;
  else if (unit === "grad") hue *= 0.9;
  hue = ((hue % 360) + 360) % 360;
  const s = readPercentLoose(parts[1]);
  const third = readPercentLoose(parts[2]);
  if (![s, third].every((v) => Number.isFinite(v) && v >= 0 && v <= 100)) return null;

  let r, g, b;
  if (name === "hsl") {
    const S = s / 100, L = third / 100;
    const k = (n) => (n + hue / 30) % 12;
    const amp = S * Math.min(L, 1 - L);
    const f = (n) => L - amp * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    r = f(0); g = f(8); b = f(4);
  } else {
    const S = s / 100, V = third / 100;
    const f = (n) => {
      const k = (n + hue / 60) % 6;
      return V - V * S * Math.max(0, Math.min(k, 4 - k, 1));
    };
    r = f(5); g = f(3); b = f(1);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a };
}

export function rgbToHsvExact(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : (d / max) * 100, v: max * 100 };
}

export function hsvToRgbExact(h, s, v) {
  s /= 100; v /= 100;
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return { r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255) };
}

export function formatColor(color) {
  const { r, g, b } = color;
  const a = color.a == null ? 1 : color.a;
  const hex2 = (n) => n.toString(16).padStart(2, "0");
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const sl = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const sv = max === 0 ? 0 : d / max;
  const H = Math.round(h) % 360;
  const alpha = a < 1;
  const aStr = String(Math.round(a * 100) / 100);
  return {
    hex: ("#" + hex2(r) + hex2(g) + hex2(b) + (alpha ? hex2(Math.round(a * 255)) : "")).toUpperCase(),
    rgb: alpha ? "rgba(" + r + ", " + g + ", " + b + ", " + aStr + ")" : "rgb(" + r + ", " + g + ", " + b + ")",
    hsl: (alpha ? "hsla(" : "hsl(") + H + ", " + Math.round(sl * 100) + "%, " + Math.round(l * 100) + "%" + (alpha ? ", " + aStr : "") + ")",
    hsv: "hsv(" + H + ", " + Math.round(sv * 100) + "%, " + Math.round(max * 100) + "%)",
  };
}
