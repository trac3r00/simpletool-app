import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs');
vi.mock('https', () => {
  const mockGet = vi.fn();
  return {
    default: { get: mockGet },
    get: mockGet,
  };
});

import fs from 'fs';
import https from 'https';
import { hasValidCache, main } from './download-fonts.js';

describe('hasValidCache', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns true when font and CSS files exist and are non-empty', () => {
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({ size: 1024 });
    expect(hasValidCache()).toBe(true);
  });

  it('returns false when font file is missing', () => {
    fs.existsSync.mockReturnValue(false);
    fs.statSync.mockReturnValue({ size: 1024 });
    expect(hasValidCache()).toBe(false);
  });

  it('returns false when CSS file is missing', () => {
    fs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
    fs.statSync.mockReturnValue({ size: 1024 });
    expect(hasValidCache()).toBe(false);
  });

  it('returns false when font file exists but is empty', () => {
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValueOnce({ size: 0 }).mockReturnValueOnce({ size: 1024 });
    expect(hasValidCache()).toBe(false);
  });

  it('returns false when CSS file exists but is empty', () => {
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValueOnce({ size: 1024 }).mockReturnValueOnce({ size: 0 });
    expect(hasValidCache()).toBe(false);
  });

  it('returns false when statSync throws', () => {
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockImplementation(() => { throw new Error('ENOENT'); });
    expect(hasValidCache()).toBe(false);
  });
});

describe('main — download behavior', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('skips download when valid cache exists', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({ size: 1024 });

    await main();

    expect(https.get).not.toHaveBeenCalled();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('downloads fonts successfully on the happy path', async () => {
    fs.existsSync.mockReturnValue(false);
    https.get.mockImplementation((url, opts, cb) => {
      cb({
        statusCode: 200,
        on: vi.fn((event, handler) => {
          if (event === 'data') handler(Buffer.from('@font-face { src: url(https://example.com/font.woff2) }'));
          if (event === 'end') handler();
        }),
      });
      return { on: vi.fn(), destroy: vi.fn() };
    });

    await expect(main()).resolves.toBeUndefined();
    expect(https.get).toHaveBeenCalledTimes(2);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
  });

  it('throws when download fails with no valid cache', async () => {
    fs.existsSync.mockReturnValue(false);
    const handlers = {};
    https.get.mockImplementation((url, opts, cb) => {
      const req = {
        on: vi.fn((event, handler) => { handlers[event] = handler; return req; }),
        destroy: vi.fn(),
      };
      setTimeout(() => {
        if (handlers.error) handlers.error(new Error('getaddrinfo ENOTFOUND'));
      }, 5);
      return req;
    });

    await expect(main()).rejects.toThrow(/ENOTFOUND/);
  });

  it('throws on non-200 status code with no cache', async () => {
    fs.existsSync.mockReturnValue(false);
    https.get.mockImplementation((url, opts, cb) => {
      cb({ statusCode: 429, on: vi.fn() });
      return { on: vi.fn(), destroy: vi.fn() };
    });

    await expect(main()).rejects.toThrow('Request failed with status 429');
  });

  it('throws on timeout with no cache', async () => {
    fs.existsSync.mockReturnValue(false);
    https.get.mockImplementation((url, opts, cb) => {
      const req = { on: vi.fn(), destroy: vi.fn() };
      req.on.mockImplementation((event, handler) => {
        if (event === 'timeout') { handler(); req.destroy(); }
        return req;
      });
      return req;
    });

    await expect(main()).rejects.toThrow('Request timeout');
  });
});
