/**
 * Pure User-Agent helpers shared by the user-agent-decoder route.
 *
 * detectUserAgentBot is injected into the page via fn.toString(), so it must
 * stay self-contained: no imports, no closures over module scope.
 */

export function detectUserAgentBot(userAgent) {
  const ua = typeof userAgent === "string" ? userAgent : "";
  const detectors = [
    { name: "Googlebot", category: "search", pattern: /googlebot(?:-[a-z]+)?\//i },
    { name: "Bingbot", category: "search", pattern: /bingbot\//i },
    { name: "Applebot", category: "search", pattern: /applebot\//i },
    { name: "GPTBot", category: "ai", pattern: /gptbot\//i },
    { name: "ClaudeBot", category: "ai", pattern: /claudebot\//i },
    { name: "PerplexityBot", category: "ai", pattern: /perplexitybot\//i },
    { name: "facebookexternalhit", category: "social", pattern: /facebookexternalhit\//i },
    { name: "Twitterbot", category: "social", pattern: /twitterbot\//i },
    { name: "UptimeRobot", category: "monitoring", pattern: /uptimerobot\//i },
    { name: "Pingdom", category: "monitoring", pattern: /pingdom\.com_bot/i },
    { name: "curl", category: "tool", pattern: /(?:^|[\s(;+])curl\/\d/i },
    { name: "Wget", category: "tool", pattern: /(?:^|[\s(;+])wget\/\d/i },
    { name: "python-requests", category: "tool", pattern: /python-requests\/\d/i },
    { name: "Go-http-client", category: "tool", pattern: /go-http-client\/\d/i },
    { name: "PostmanRuntime", category: "tool", pattern: /postmanruntime\/\d/i },
  ];

  for (let i = 0; i < detectors.length; i++) {
    if (detectors[i].pattern.test(ua)) {
      return { isBot: true, name: detectors[i].name, category: detectors[i].category };
    }
  }

  // Unlisted crawlers that still identify themselves: "SomeBot/1.0" or
  // "(compatible; Some Spider ...)". Requiring the version slash or the
  // "compatible;" context keeps device names such as "Cubot" from matching.
  if (/(?:bot|crawler|spider)\/\d|compatible;[^)]*(?:bot|crawler|spider)/i.test(ua)) {
    return { isBot: true, name: "Unidentified crawler", category: null };
  }

  return { isBot: false, name: null, category: null };
}

/**
 * Browser / OS / device breakdown of a User-Agent string. Injected into the
 * page together with detectUserAgentBot (which it calls), so it may reference
 * that function but nothing else outside its own body.
 */
export function analyzeUserAgent(userAgent) {
  const ua = typeof userAgent === "string" ? userAgent : "";
  const result = {
    browser: { name: null, version: null, engine: null, engineVersion: null },
    os: { name: null, version: null, architecture: null },
    device: { type: null, vendor: null, model: null },
    isBot: false,
    bot: { isBot: false, name: null, category: null },
    isMobile: false,
    isTablet: false,
  };
  const pick = (regex) => {
    const match = ua.match(regex);
    return match ? match[1] : null;
  };

  result.bot = detectUserAgentBot(ua);
  result.isBot = result.bot.isBot;

  const isIOS = /iPhone|iPad|iPod/.test(ua);
  result.isMobile = /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  result.isTablet = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));

  // Most specific token first: every Chromium browser also sends "Chrome/", and
  // every iOS browser is WebKit with its own token (CriOS, FxiOS, EdgiOS).
  const BROWSERS = [
    ["Microsoft Edge", /(?:Edg|EdgA|EdgiOS)\/(\d+(?:\.\d+)?)/, "Blink"],
    ["Samsung Internet", /SamsungBrowser\/(\d+(?:\.\d+)?)/, "Blink"],
    ["Opera", /(?:OPR|OPT|Opera)\/(\d+(?:\.\d+)?)/, "Blink"],
    ["Yandex Browser", /YaBrowser\/(\d+(?:\.\d+)?)/, "Blink"],
    ["Vivaldi", /Vivaldi\/(\d+(?:\.\d+)?)/, "Blink"],
    ["Google Chrome", /CriOS\/(\d+(?:\.\d+)?)/, "WebKit"],
    ["Mozilla Firefox", /FxiOS\/(\d+(?:\.\d+)?)/, "WebKit"],
    ["Chromium", /Chromium\/(\d+(?:\.\d+)?)/, "Blink"],
    ["Google Chrome", /Chrome\/(\d+(?:\.\d+)?)/, "Blink"],
    ["Mozilla Firefox", /Firefox\/(\d+(?:\.\d+)?)/, "Gecko"],
  ];
  for (let i = 0; i < BROWSERS.length; i++) {
    const version = pick(BROWSERS[i][1]);
    if (version) {
      result.browser.name = BROWSERS[i][0];
      result.browser.version = version;
      result.browser.engine = isIOS ? "WebKit" : BROWSERS[i][2];
      break;
    }
  }
  if (!result.browser.name && /Safari\//.test(ua) && /AppleWebKit\//.test(ua)) {
    result.browser.name = "Safari";
    result.browser.version = pick(/Version\/(\d+(?:\.\d+)?)/);
    result.browser.engine = "WebKit";
  }
  if (result.browser.engine === "Blink") {
    // Blink shares Chromium's version; the AppleWebKit token is frozen at 537.36.
    result.browser.engineVersion = pick(/Chrome\/(\d+(?:\.\d+)?)/);
  } else if (result.browser.engine === "WebKit") {
    result.browser.engineVersion = pick(/AppleWebKit\/(\d+(?:\.\d+)?)/);
  } else if (result.browser.engine === "Gecko") {
    result.browser.engineVersion = pick(/rv:(\d+(?:\.\d+)?)/);
  }

  if (/Windows NT/.test(ua)) {
    const WINDOWS = { "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7", "6.0": "Vista", "5.1": "XP" };
    const version = pick(/Windows NT (\d+\.\d+)/);
    result.os.name = "Windows";
    result.os.version = WINDOWS[version] || version;
    result.os.architecture = /Win64|x64|WOW64/.test(ua) ? "x64" : /ARM/.test(ua) ? "ARM" : "x86";
  } else if (isIOS) {
    result.os.name = /iPad/.test(ua) ? "iPadOS" : "iOS";
    const version = pick(/OS (\d+(?:_\d+){0,2})/);
    result.os.version = version ? version.replace(/_/g, ".") : null;
    result.os.architecture = "ARM";
  } else if (/Mac OS X/.test(ua)) {
    result.os.name = "macOS";
    const version = pick(/Mac OS X (\d+(?:[._]\d+){0,2})/);
    result.os.version = version ? version.replace(/_/g, ".") : null;
    // Safari, Chrome and Firefox freeze this at 10.15(.7) and "Intel" on every Mac.
    if (result.os.version === "10.15.7" || result.os.version === "10.15") {
      result.os.version += " (frozen: browsers do not send the real macOS version)";
    }
    result.os.architecture = /Intel/.test(ua) ? "Intel (also sent by Apple silicon Macs)" : null;
  } else if (/CrOS/.test(ua)) {
    result.os.name = "ChromeOS";
    result.os.version = pick(/CrOS \S+ (\d+(?:\.\d+)*)/);
    result.os.architecture = /x86_64/.test(ua) ? "x64" : /aarch64|armv/.test(ua) ? "ARM" : null;
  } else if (/Android/.test(ua)) {
    result.os.name = "Android";
    result.os.version = pick(/Android (\d+(?:\.\d+)*)/);
    result.os.architecture = "ARM";
  } else if (/Linux/.test(ua)) {
    result.os.name = "Linux";
    result.os.architecture = /x86_64|amd64/.test(ua) ? "x64" : /aarch64|arm/i.test(ua) ? "ARM" : /i[3-6]86/.test(ua) ? "x86" : null;
  }

  if (/iPhone|iPod/.test(ua)) {
    result.device = { type: "Mobile", vendor: "Apple", model: /iPod/.test(ua) ? "iPod touch" : "iPhone" };
  } else if (/iPad/.test(ua)) {
    result.device = { type: "Tablet", vendor: "Apple", model: "iPad" };
  } else if (/Android/.test(ua)) {
    result.device.type = result.isTablet ? "Tablet" : "Mobile";
    const segment = pick(/\(([^)]*Android[^)]*)\)/) || "";
    const tokens = segment.split(";").map((token) => token.trim());
    const after = tokens.slice(tokens.findIndex((token) => /^Android/.test(token)) + 1);
    const model = after.find((token) => token && !/^(?:Mobile|Tablet|wv|U|[a-z]{2}(?:[-_][A-Za-z]{2})?|rv:.*)$/.test(token));
    if (model === "K") {
      // Chrome's reduced User-Agent replaces the model with "K" (Chrome 110+).
      result.device.model = "Hidden (reduced User-Agent)";
    } else if (model) {
      const name = model.replace(/\s+Build\/.*$/, "").replace(/^SAMSUNG\s+/i, "");
      const VENDORS = [
        [/^(?:SM-|GT-|SCH-|Galaxy)/i, "Samsung"],
        [/^(?:Pixel|Nexus)/, "Google"],
        [/^(?:Redmi|POCO|Mi |MI |Xiaomi|M2\d{3})/, "Xiaomi"],
        [/^(?:moto|Motorola|XT\d)/i, "Motorola"],
        [/^(?:ONEPLUS|OnePlus)/, "OnePlus"],
        [/^(?:HUAWEI|Huawei)/, "Huawei"],
        [/^CPH\d/, "OPPO"],
        [/^RMX\d/, "realme"],
        [/^(?:LM-|LG-)/, "LG"],
        [/^Nokia/, "Nokia"],
      ];
      const vendor = VENDORS.find((entry) => entry[0].test(name));
      result.device.vendor = vendor ? vendor[1] : null;
      result.device.model = name;
    }
  } else if (result.isTablet) {
    result.device.type = "Tablet";
  } else if (result.isMobile) {
    result.device.type = "Mobile";
  } else {
    result.device.type = result.browser.name || result.os.name ? "Desktop" : null;
  }
  return result;
}

export const UA_SAMPLES = [
  { group: "Desktop", label: "Chrome on Windows", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" },
  { group: "Desktop", label: "Edge on Windows", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0" },
  { group: "Desktop", label: "Firefox on Windows", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0" },
  { group: "Desktop", label: "Opera on Windows", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 OPR/115.0.0.0" },
  { group: "Desktop", label: "Chrome on macOS", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" },
  { group: "Desktop", label: "Safari on macOS", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15" },
  { group: "Desktop", label: "Firefox on Linux", ua: "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0" },
  { group: "Mobile", label: "Safari on iPhone", ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1" },
  { group: "Mobile", label: "Chrome on iPhone", ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1" },
  { group: "Mobile", label: "Chrome on Pixel", ua: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.104 Mobile Safari/537.36" },
  { group: "Mobile", label: "Samsung Internet", ua: "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36" },
  { group: "Mobile", label: "Firefox on Android", ua: "Mozilla/5.0 (Android 15; Mobile; rv:133.0) Gecko/133.0 Firefox/133.0" },
  { group: "Tablet", label: "Safari on iPad", ua: "Mozilla/5.0 (iPad; CPU OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1" },
  { group: "Tablet", label: "Chrome on Galaxy Tab", ua: "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" },
  { group: "Tablet", label: "Chrome on Pixel Tablet", ua: "Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" },
  { group: "Bots & clients", label: "Googlebot (desktop)", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/131.0.6778.204 Safari/537.36" },
  { group: "Bots & clients", label: "Googlebot (smartphone)", ua: "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.204 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
  { group: "Bots & clients", label: "Bingbot", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36" },
  { group: "Bots & clients", label: "Applebot", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)" },
  { group: "Bots & clients", label: "GPTBot", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)" },
  { group: "Bots & clients", label: "ClaudeBot", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)" },
  { group: "Bots & clients", label: "PerplexityBot", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)" },
  { group: "Bots & clients", label: "facebookexternalhit", ua: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)" },
  { group: "Bots & clients", label: "Twitterbot", ua: "Twitterbot/1.0" },
  { group: "Bots & clients", label: "UptimeRobot", ua: "Mozilla/5.0+(compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)" },
  { group: "Bots & clients", label: "curl", ua: "curl/8.7.1" },
  { group: "Bots & clients", label: "python-requests", ua: "python-requests/2.32.3" },
  { group: "Bots & clients", label: "Go-http-client", ua: "Go-http-client/1.1" },
  { group: "Bots & clients", label: "PostmanRuntime", ua: "PostmanRuntime/7.42.0" },
];
