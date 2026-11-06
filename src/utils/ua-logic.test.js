import { describe, expect, it } from "vitest";
import { analyzeUserAgent, detectUserAgentBot, UA_SAMPLES } from "./ua-logic.js";

const SEED = Number(process.env.UA_FUZZ_SEED ?? 0x5eed1234);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rand, list) => list[Math.floor(rand() * list.length)];

// Hand-written oracle: expected bot name per sample label (null = a browser).
const ORACLE = {
  "Chrome on Windows": null,
  "Edge on Windows": null,
  "Firefox on Windows": null,
  "Opera on Windows": null,
  "Chrome on macOS": null,
  "Safari on macOS": null,
  "Firefox on Linux": null,
  "Safari on iPhone": null,
  "Chrome on iPhone": null,
  "Chrome on Pixel": null,
  "Samsung Internet": null,
  "Firefox on Android": null,
  "Safari on iPad": null,
  "Chrome on Galaxy Tab": null,
  "Chrome on Pixel Tablet": null,
  "Googlebot (desktop)": ["Googlebot", "search"],
  "Googlebot (smartphone)": ["Googlebot", "search"],
  Bingbot: ["Bingbot", "search"],
  Applebot: ["Applebot", "search"],
  GPTBot: ["GPTBot", "ai"],
  ClaudeBot: ["ClaudeBot", "ai"],
  PerplexityBot: ["PerplexityBot", "ai"],
  facebookexternalhit: ["facebookexternalhit", "social"],
  Twitterbot: ["Twitterbot", "social"],
  UptimeRobot: ["UptimeRobot", "monitoring"],
  curl: ["curl", "tool"],
  "python-requests": ["python-requests", "tool"],
  "Go-http-client": ["Go-http-client", "tool"],
  PostmanRuntime: ["PostmanRuntime", "tool"],
};

const UNKNOWN = { isBot: false, name: null, category: null };
const bots = UA_SAMPLES.filter((s) => ORACLE[s.label]);
const browsers = UA_SAMPLES.filter((s) => ORACLE[s.label] === null);

function expectedFor(label) {
  const entry = ORACLE[label];
  return entry ? { isBot: true, name: entry[0], category: entry[1] } : UNKNOWN;
}

function tableFailures(detector) {
  return UA_SAMPLES.filter((s) => {
    const got = detector(s.ua);
    const want = expectedFor(s.label);
    return got.isBot !== want.isBot || got.name !== want.name;
  }).map((s) => s.label);
}

function randomCase(rand, text) {
  let out = "";
  for (const ch of text) out += rand() < 0.5 ? ch.toUpperCase() : ch.toLowerCase();
  return out;
}

const NOISE = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "AppleWebKit/537.36 (KHTML, like Gecko)",
  "Chrome/131.0.0.0 Safari/537.36",
  "(Macintosh; Intel Mac OS X 10_15_7)",
  "Gecko/20100101 Firefox/133.0",
  "Mobile/15E148",
];

function withNoise(rand, ua) {
  const before = Array.from({ length: Math.floor(rand() * 3) }, () => pick(rand, NOISE));
  const after = Array.from({ length: Math.floor(rand() * 3) }, () => pick(rand, NOISE));
  return [...before, ua, ...after].join(" ");
}

function runProperty(name, iterations, body) {
  const rand = mulberry32(SEED ^ name.length);
  const stats = { attempted: iterations, executed: 0, discarded: 0, failing: 0 };
  const failures = [];
  for (let i = 0; i < iterations; i++) {
    stats.executed++;
    const problem = body(rand, i);
    if (problem) {
      stats.failing++;
      if (failures.length < 5) failures.push(problem);
    }
  }
  console.log(`[ua-fuzz] ${name} seed=${SEED} ${JSON.stringify(stats)}`);
  return failures;
}

describe("detectUserAgentBot sample table", () => {
  it("oracle covers every shipped sample and the library has >= 25 entries", () => {
    expect(UA_SAMPLES.length).toBeGreaterThanOrEqual(25);
    expect(UA_SAMPLES.map((s) => s.label).sort()).toEqual(Object.keys(ORACLE).sort());
    for (const group of ["Desktop", "Mobile", "Tablet", "Bots & clients"]) {
      expect(UA_SAMPLES.some((s) => s.group === group)).toBe(true);
    }
  });

  it.each(UA_SAMPLES.map((s) => [s.label, s.ua]))("%s", (label, ua) => {
    expect(detectUserAgentBot(ua)).toEqual(expectedFor(label));
  });

  it("calibration: a naive /bot/i detector fails the table", () => {
    const naive = (ua) =>
      /bot/i.test(ua) ? { isBot: true, name: ua.match(/(\w*bot)/i)[1], category: null } : UNKNOWN;
    const failed = tableFailures(naive);
    expect(failed).toContain("curl");
    expect(failed).toContain("facebookexternalhit");
    expect(tableFailures(detectUserAgentBot)).toEqual([]);
  });
});

describe("detectUserAgentBot properties (seeded)", () => {
  it("random case changes keep every classification", () => {
    const failures = runProperty("case", 500, (rand) => {
      const sample = pick(rand, UA_SAMPLES);
      const mutated = randomCase(rand, sample.ua);
      const got = detectUserAgentBot(mutated);
      const want = expectedFor(sample.label);
      return got.isBot === want.isBot && got.name === want.name ? null : { mutated, got, want };
    });
    expect(failures).toEqual([]);
  });

  it("browser-like noise around a bot UA keeps its detection", () => {
    const failures = runProperty("noise-bots", 500, (rand) => {
      const sample = pick(rand, bots);
      const mutated = withNoise(rand, sample.ua);
      const got = detectUserAgentBot(mutated);
      return got.name === ORACLE[sample.label][0] ? null : { mutated, got };
    });
    expect(failures).toEqual([]);
  });

  it("browser-like noise around a browser UA stays non-bot", () => {
    const failures = runProperty("noise-browsers", 300, (rand) => {
      const mutated = withNoise(rand, pick(rand, browsers).ua);
      const got = detectUserAgentBot(mutated);
      return got.isBot ? { mutated, got } : null;
    });
    expect(failures).toEqual([]);
  });

  it("garbage without letters is unknown; any printable garbage never throws", () => {
    const failures = runProperty("garbage", 500, (rand) => {
      const len = Math.floor(rand() * 200);
      let noLetters = "";
      let printable = "";
      for (let i = 0; i < len; i++) {
        noLetters += pick(rand, "0123456789 /;()+-_.,:!@#$%^&*[]{}<>\t");
        printable += String.fromCharCode(32 + Math.floor(rand() * 95));
      }
      const a = detectUserAgentBot(noLetters);
      if (JSON.stringify(a) !== JSON.stringify(UNKNOWN)) return { noLetters, a };
      const b = detectUserAgentBot(printable);
      return typeof b.isBot === "boolean" ? null : { printable, b };
    });
    expect(failures).toEqual([]);
  });

  it("empty, non-string, and 10k-char inputs are unknown", () => {
    const rand = mulberry32(SEED);
    let longRandom = "";
    for (let i = 0; i < 10000; i++) longRandom += pick(rand, "0123456789 ;()/.");
    for (const input of ["", "   ", null, undefined, 42, {}, "a".repeat(10000), "/".repeat(10000), longRandom]) {
      expect(detectUserAgentBot(input)).toEqual(UNKNOWN);
    }
  });

  it("is self-contained so it can be injected with toString()", () => {
    const rebuilt = new Function(`return (${detectUserAgentBot.toString()})`)();
    for (const s of UA_SAMPLES) expect(rebuilt(s.ua)).toEqual(expectedFor(s.label));
  });
});


describe("analyzeUserAgent", () => {
  // Hand-written from each sample's label and the vendors' published UA formats
  // (Chrome UA reduction, Samsung Internet, CriOS on iOS): [browser, os, device type, vendor, model].
  const EXPECTED = {
    "Chrome on Windows": ["Google Chrome", "Windows", "Desktop", null, null],
    "Edge on Windows": ["Microsoft Edge", "Windows", "Desktop", null, null],
    "Firefox on Windows": ["Mozilla Firefox", "Windows", "Desktop", null, null],
    "Opera on Windows": ["Opera", "Windows", "Desktop", null, null],
    "Chrome on macOS": ["Google Chrome", "macOS", "Desktop", null, null],
    "Safari on macOS": ["Safari", "macOS", "Desktop", null, null],
    "Firefox on Linux": ["Mozilla Firefox", "Linux", "Desktop", null, null],
    "Safari on iPhone": ["Safari", "iOS", "Mobile", "Apple", "iPhone"],
    "Chrome on iPhone": ["Google Chrome", "iOS", "Mobile", "Apple", "iPhone"],
    "Chrome on Pixel": ["Google Chrome", "Android", "Mobile", "Google", "Pixel 9"],
    "Samsung Internet": ["Samsung Internet", "Android", "Mobile", "Samsung", "SM-S928B"],
    "Firefox on Android": ["Mozilla Firefox", "Android", "Mobile", null, null],
    "Safari on iPad": ["Safari", "iPadOS", "Tablet", "Apple", "iPad"],
    "Chrome on Galaxy Tab": ["Google Chrome", "Android", "Tablet", "Samsung", "SM-X710"],
    "Chrome on Pixel Tablet": ["Google Chrome", "Android", "Tablet", "Google", "Pixel Tablet"],
  };

  it.each(Object.keys(EXPECTED))("%s", (label) => {
    const sample = UA_SAMPLES.find((entry) => entry.label === label);
    const parsed = analyzeUserAgent(sample.ua);
    expect([parsed.browser.name, parsed.os.name, parsed.device.type, parsed.device.vendor, parsed.device.model]).toEqual(EXPECTED[label]);
    expect(parsed.isBot).toBe(false);
  });

  it("uses WebKit for every iOS browser and Blink's Chromium version for Chromium browsers", () => {
    expect(analyzeUserAgent(UA_SAMPLES.find((s) => s.label === "Chrome on iPhone").ua).browser).toMatchObject({ engine: "WebKit", version: "131.0" });
    expect(analyzeUserAgent(UA_SAMPLES.find((s) => s.label === "Samsung Internet").ua).browser).toMatchObject({ version: "27.0", engineVersion: "125.0" });
  });

  it("reports Chrome's reduced Android model and ChromeOS instead of guessing", () => {
    const reduced = analyzeUserAgent("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36");
    expect(reduced.device).toEqual({ type: "Mobile", vendor: null, model: "Hidden (reduced User-Agent)" });
    const cros = analyzeUserAgent("Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");
    expect(cros.os).toEqual({ name: "ChromeOS", version: "14541.0.0", architecture: "x64" });
  });

  it("recovers the generated browser and OS versions from seeded random UAs", () => {
    const rand = mulberry32(SEED ^ 0xa11a);
    const failures = [];
    for (let n = 0; n < 2000; n++) {
      const major = 60 + Math.floor(rand() * 90);
      const android = 8 + Math.floor(rand() * 8);
      const kind = pick(rand, ["chrome-win", "edge-win", "firefox-linux", "chrome-android", "crios", "fxios"]);
      const ios = 15 + Math.floor(rand() * 5) + "_" + Math.floor(rand() * 7);
      const ua = {
        "chrome-win": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36`,
        "edge-win": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36 Edg/${major}.0.1.2`,
        "firefox-linux": `Mozilla/5.0 (X11; Linux x86_64; rv:${major}.0) Gecko/20100101 Firefox/${major}.0`,
        "chrome-android": `Mozilla/5.0 (Linux; Android ${android}; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Mobile Safari/537.36`,
        crios: `Mozilla/5.0 (iPhone; CPU iPhone OS ${ios} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/${major}.0.1.2 Mobile/15E148 Safari/604.1`,
        fxios: `Mozilla/5.0 (iPhone; CPU iPhone OS ${ios} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/${major}.0 Mobile/15E148 Safari/605.1.15`,
      }[kind];
      const expected = {
        "chrome-win": ["Google Chrome", "Windows", "10/11"],
        "edge-win": ["Microsoft Edge", "Windows", "10/11"],
        "firefox-linux": ["Mozilla Firefox", "Linux", null],
        "chrome-android": ["Google Chrome", "Android", String(android)],
        crios: ["Google Chrome", "iOS", ios.replace("_", ".")],
        fxios: ["Mozilla Firefox", "iOS", ios.replace("_", ".")],
      }[kind];
      const parsed = analyzeUserAgent(ua);
      const actual = [parsed.browser.name, parsed.os.name, parsed.os.version];
      if (JSON.stringify(actual) !== JSON.stringify(expected) || parsed.browser.version !== major + ".0") failures.push({ ua, actual, version: parsed.browser.version });
    }
    expect(failures.slice(0, 3)).toEqual([]);
  });
});
