// Single factory: inlined via toString(), so bundler renames of separate top-level helpers would break the page.
export function createQrCodeLogic() {
  function normalizeHex(value) {
    const v = String(value).trim().replace(/^#/, "").toLowerCase();
    if (/^[0-9a-f]{3}$/.test(v)) return "#" + v.split("").map((c) => c + c).join("");
    if (/^[0-9a-f]{6}$/.test(v)) return "#" + v;
    return null;
  }

  // WCAG 2.x relative luminance of an sRGB colour.
  function luminance(hex) {
    const n = parseInt(hex.slice(1), 16);
    const lin = (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  }

  function contrastRatio(a, b) {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  // Many scanners only read dark modules on a light background, and low
  // contrast fails in poor light even when the order is right.
  function scanWarning(fg, bg) {
    if (luminance(fg) > luminance(bg)) {
      return "Foreground is lighter than the background. Many scanners cannot read inverted QR codes.";
    }
    const ratio = contrastRatio(fg, bg);
    if (ratio < 4) {
      return "Low contrast (" + ratio.toFixed(1) + ":1). Some phones may fail to scan it; aim for 4:1 or more.";
    }
    return null;
  }

  return { normalizeHex, contrastRatio, scanWarning };
}

export const { normalizeHex, contrastRatio, scanWarning } = createQrCodeLogic();
