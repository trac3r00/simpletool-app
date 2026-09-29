/**
 * Manual AdSense placements. Non-personalized only.
 * Never Auto ads. Never load the script on deny-listed tools.
 */

export const ADS_TXT_LINE =
  "google.com, pub-5134881365131182, DIRECT, f08c47fec0942fa0";

export const ALLOW_SLOT_KEYS = Object.freeze(["home", "json", "legal"]);

export const DENY_AD_PATHS = Object.freeze([
  "/password-generator",
  "/ssh-key-generator",
  "/token-studio",
  "/wireguard-config",
  "/certificate-decoder",
  "/secret-scanner",
  "/encoding-workbench",
]);

export const LEGAL_AD_PATHS = Object.freeze([
  "/about",
  "/privacy",
  "/terms",
  "/changelog",
]);

/**
 * The complete route allow-list for loading adsbygoogle.js. Manual unit
 * placement is narrower and remains governed by pageAllowsAds().
 */
export const AD_SCRIPT_PATHS = Object.freeze([
  "/",
  "/json-formatter",
  ...LEGAL_AD_PATHS,
  "/blog",
  "/faq",
]);

export const AD_SCRIPT_PREFIXES = Object.freeze(["/blog/"]);

export function getAdPolicySnapshot() {
  return Object.freeze({
    manualUnitPaths: Object.freeze(["/json-formatter", ...LEGAL_AD_PATHS]),
    scriptPaths: AD_SCRIPT_PATHS,
    scriptPrefixes: AD_SCRIPT_PREFIXES,
    manualUnitsRequestNonPersonalizedAds: true,
    autoAdsStatus: "account-controlled-unverified",
    cmpStatus: "not-verified",
  });
}

const SLOT_ID_RE = /^\d{10,}$/;
const PUBLISHER_CLIENT_RE = /^ca-pub-\d+$/;

let adConfig = {
  client: null,
  slots: {},
  path: "/",
};

export function normalizePath(pathname = "/") {
  if (!pathname) return "/";
  const trimmed = pathname.split("?")[0].replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export function pageAllowsAds(pathname = "/") {
  const path = normalizePath(pathname);
  if (DENY_AD_PATHS.some((denied) => path === denied)) return false;
  if (path === "/json-formatter") return true;
  return LEGAL_AD_PATHS.includes(path);
}

/**
 * Client-script pages. Broader than unit inventory so AdSense site-connect
 * and content URLs (blog, FAQ) carry the official head snippet. Secret
 * tools stay off.
 */
export function pageAllowsAdScript(pathname = "/") {
  const path = normalizePath(pathname);
  if (DENY_AD_PATHS.some((denied) => path === denied)) return false;
  if (AD_SCRIPT_PATHS.includes(path)) return true;
  return AD_SCRIPT_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function slotKeyForPath(pathname = "/") {
  const path = normalizePath(pathname);
  if (!pageAllowsAds(path)) return null;
  if (path === "/json-formatter") return "json";
  if (LEGAL_AD_PATHS.includes(path)) return "legal";
  return null;
}

export function isValidSlotId(value) {
  return typeof value === "string" && SLOT_ID_RE.test(value.trim());
}

export function parseAdSlots(env) {
  if (!env) return {};
  const slots = {};

  if (typeof env.ADSENSE_SLOTS === "string" && env.ADSENSE_SLOTS.trim()) {
    try {
      const parsed = JSON.parse(env.ADSENSE_SLOTS);
      if (parsed && typeof parsed === "object") {
        for (const key of ALLOW_SLOT_KEYS) {
          if (isValidSlotId(parsed[key])) {
            slots[key] = parsed[key].trim();
          }
        }
      }
    } catch (error) {
      console.warn("Invalid ADSENSE_SLOTS JSON. Ignoring.", error);
    }
  }

  if (isValidSlotId(env.ADSENSE_SLOT)) {
    const fallback = env.ADSENSE_SLOT.trim();
    for (const key of ALLOW_SLOT_KEYS) {
      slots[key] ||= fallback;
    }
  }

  return slots;
}

export function hasPublisherClient() {
  return (
    typeof adConfig.client === "string" &&
    PUBLISHER_CLIENT_RE.test(adConfig.client)
  );
}

export function isAdsEnabled() {
  return hasPublisherClient() && Object.keys(adConfig.slots).length > 0;
}

export function setAdConfig(config = {}) {
  const { client, slots, path } = config;
  if (client === null) {
    adConfig.client = null;
  }
  if (typeof client === "string") {
    const trimmed = client.trim();
    adConfig.client = PUBLISHER_CLIENT_RE.test(trimmed) ? trimmed : null;
  }
  if (slots && typeof slots === "object") {
    const next = {};
    for (const key of ALLOW_SLOT_KEYS) {
      if (isValidSlotId(slots[key])) next[key] = slots[key].trim();
    }
    adConfig.slots = next;
  }
  if (typeof path === "string") {
    adConfig.path = normalizePath(path);
  }
}

export function getAdConfig() {
  return {
    client: adConfig.client,
    slots: { ...adConfig.slots },
    path: adConfig.path,
  };
}

export function shouldServeAdsTxt() {
  return hasPublisherClient();
}

export function getAdsTxtBody() {
  const publisherId = hasPublisherClient()
    ? adConfig.client.replace(/^ca-/, "")
    : "pub-5134881365131182";
  return `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;
}

/**
 * Site-connect meta. Does not load ads. Present whenever a publisher ID exists
 * so AdSense can verify the site without Auto ads or a head snippet on every page.
 */
export function getAdSenseAccountMeta() {
  if (!hasPublisherClient()) return "";
  return `<meta name="google-adsense-account" content="${adConfig.client}">`;
}

/**
 * Google AdSense script tag. NPA only. No GTM.
 */
export function getGtagScript() {
  return "";
}

/**
 * Official AdSense head snippet. Static tags — Google's site-connect crawler
 * looks for adsbygoogle.js between <head> and </head>, not a post-load
 * createElement. Units still require real slot IDs (see getAdSlotHTML).
 * https://support.google.com/adsense/answer/12176698
 */
export function getAdSenseScript(pathname = adConfig.path) {
  if (!hasPublisherClient()) return "";
  if (!pageAllowsAdScript(pathname)) return "";
  const client = adConfig.client;

  return `
    <script>
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.requestNonPersonalizedAds = 1;
    </script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}" crossorigin="anonymous"></script>
  `;
}

/**
 * Reserved-height manual slot. Visible Advertisement label. NPA only.
 */
export function getAdSlotHTML(slotKey, options = {}) {
  if (!isAdsEnabled()) return "";
  if (!ALLOW_SLOT_KEYS.includes(slotKey)) return "";
  if (!pageAllowsAds(options.path || adConfig.path)) return "";

  const slotId = adConfig.slots?.[slotKey];
  if (!isValidSlotId(slotId)) return "";

  const {
    wrapperClassName = "",
    label = "Advertisement",
    format = "horizontal",
    minHeight = 280,
  } = options;

  const labelHTML = label
    ? `<p class="text-xs uppercase tracking-widest text-surface-400 mb-2">${label}</p>`
    : "";

  return `
    <aside class="${wrapperClassName}" aria-label="Advertisement" data-ad-container data-ad-placement="${slotKey}">
      ${labelHTML}
      <ins class="adsbygoogle"
           style="display:block;min-height:${minHeight}px"
           data-ad-client="${adConfig.client}"
           data-ad-slot="${slotId}"
           data-ad-format="${format}"
           data-npa-on="1"
           data-full-width-responsive="true"></ins>
      <script>(window.adsbygoogle = window.adsbygoogle || []).push({});</script>
    </aside>
  `;
}
