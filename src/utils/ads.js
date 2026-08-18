/**
 * Manual AdSense placements. Non-personalized only.
 * Never Auto ads. Never load the script on deny-listed tools.
 */

export const ADSENSE_PUBLISHER_ID = "ca-pub-5134881365131182";
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
  "/pipe",
]);

export const LEGAL_AD_PATHS = Object.freeze([
  "/about",
  "/privacy",
  "/terms",
  "/contact",
  "/security",
  "/careers",
  "/changelog",
]);

const SLOT_ID_RE = /^\d{10,}$/;

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
  if (path === "/") return true;
  if (path === "/json-formatter") return true;
  return LEGAL_AD_PATHS.includes(path);
}

export function slotKeyForPath(pathname = "/") {
  const path = normalizePath(pathname);
  if (!pageAllowsAds(path)) return null;
  if (path === "/") return "home";
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

export function isAdsEnabled() {
  return (
    typeof adConfig.client === "string" &&
    /^ca-pub-\d+$/.test(adConfig.client) &&
    Object.keys(adConfig.slots).length > 0
  );
}

export function setAdConfig(config = {}) {
  const { client, slots, path } = config;
  if (client === null) {
    adConfig.client = null;
  }
  if (typeof client === "string") {
    const trimmed = client.trim();
    adConfig.client = /^ca-pub-\d+$/.test(trimmed) ? trimmed : null;
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
  return isAdsEnabled();
}

export function getAdsTxtBody() {
  return `${ADS_TXT_LINE}\n`;
}

/**
 * Google AdSense script tag. Loads after first paint. NPA only.
 */
export function getGtagScript() {
  return "";
}

export function getAdSenseScript(pathname = adConfig.path) {
  if (!isAdsEnabled()) return "";
  if (!pageAllowsAds(pathname)) return "";
  const client = adConfig.client;

  return `
    <script>
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.requestNonPersonalizedAds = 1;
      (function() {
        function bootAds() {
          if (document.querySelector('script[data-ad-client="${client}"]')) return;
          var slots = document.querySelectorAll('ins.adsbygoogle[data-ad-slot]');
          if (!slots.length) return;
          var script = document.createElement('script');
          script.async = true;
          script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}';
          script.crossOrigin = 'anonymous';
          script.dataset.adClient = '${client}';
          script.onload = function() {
            slots.forEach(function() {
              try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
            });
          };
          script.onerror = function() { this.remove(); };
          document.head.appendChild(script);
        }
        function afterPaint() {
          if (window.requestAnimationFrame) {
            requestAnimationFrame(function() { setTimeout(bootAds, 0); });
          } else {
            setTimeout(bootAds, 0);
          }
        }
        if (document.readyState === 'complete') afterPaint();
        else window.addEventListener('load', afterPaint, { once: true });
      })();
    </script>
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
    </aside>
  `;
}
