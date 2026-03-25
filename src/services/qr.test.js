import { describe, it, expect } from 'vitest';
import { generateQrCode } from './qr.js';

describe('generateQrCode', () => {
  it('generates a QR code with default options', async () => {
    const result = await generateQrCode('https://simpletool.app');
    expect(result).toHaveProperty('dataUrl');
    expect(result).toHaveProperty('format');
    expect(result).toHaveProperty('length');
    expect(result.length).toBe('https://simpletool.app'.length);
  });

  it('generates SVG format when requested', async () => {
    const result = await generateQrCode('hello', { format: 'svg' });
    expect(result.format).toBe('svg');
    expect(result.dataUrl).toContain('data:image/svg+xml;base64,');
    expect(result).toHaveProperty('svg');
  });

  it('returns default error correction level M', async () => {
    const result = await generateQrCode('test');
    expect(result.options.errorCorrectionLevel).toBe('M');
  });

  it('respects custom error correction level', async () => {
    const result = await generateQrCode('test', { errorCorrectionLevel: 'H' });
    expect(result.options.errorCorrectionLevel).toBe('H');
  });

  it('ignores invalid error correction level', async () => {
    const result = await generateQrCode('test', { errorCorrectionLevel: 'X' });
    expect(result.options.errorCorrectionLevel).toBe('M');
  });

  it('clamps margin to valid range', async () => {
    const result = await generateQrCode('test', { margin: 20 });
    expect(result.options.margin).toBeLessThanOrEqual(8);
  });

  it('throws for non-string data', async () => {
    await expect(generateQrCode(123)).rejects.toThrow('QR data must be text');
  });

  it('throws for empty data', async () => {
    await expect(generateQrCode('')).rejects.toThrow('QR data cannot be empty');
    await expect(generateQrCode('   ')).rejects.toThrow('QR data cannot be empty');
  });
});
