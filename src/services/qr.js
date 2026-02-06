/**
 * QR Code generation service
 * Generates QR codes in PNG or SVG format
 */

import QRCode from 'qrcode';

function sanitizeText(value) {
  if (typeof value !== 'string') {
    throw new Error('QR data must be text');
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('QR data cannot be empty');
  }
  return trimmed;
}

function clamp(value, min, max, fallback) {
  const numeric = Number.parseInt(value, 10);
  if (Number.isFinite(numeric)) {
    return Math.min(max, Math.max(min, numeric));
  }
  return fallback;
}

export async function generateQrCode(data, rawOptions = {}) {
  const text = sanitizeText(data);
  const errorCorrectionLevels = new Set(['L', 'M', 'Q', 'H']);

  const errorCorrectionLevel = errorCorrectionLevels.has(String(rawOptions.errorCorrectionLevel))
    ? String(rawOptions.errorCorrectionLevel)
    : 'M';
  const margin = clamp(rawOptions.margin, 0, 8, 2);
  const scale = clamp(rawOptions.scale ?? rawOptions.size, 2, 16, 6);
  const format = rawOptions.format === 'svg' ? 'svg' : 'png';

  if (format === 'svg') {
    const svg = await QRCode.toString(text, {
      errorCorrectionLevel,
      margin,
      type: 'svg',
    });
    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return {
      format: 'svg',
      dataUrl: `data:image/svg+xml;base64,${base64}`,
      svg,
      options: { errorCorrectionLevel, margin, scale },
      length: text.length,
    };
  }

  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel,
      margin,
      scale,
    });

    return {
      format: 'png',
      dataUrl,
      options: { errorCorrectionLevel, margin, scale },
      length: text.length,
    };
  } catch (error) {
    const svg = await QRCode.toString(text, {
      errorCorrectionLevel,
      margin,
      type: 'svg',
    });
    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return {
      format: 'svg',
      dataUrl: `data:image/svg+xml;base64,${base64}`,
      svg,
      options: { errorCorrectionLevel, margin, scale },
      length: text.length,
      fallback: 'png-generation-not-supported',
      error: error.message,
    };
  }
}
