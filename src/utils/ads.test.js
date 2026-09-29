import { afterEach, describe, expect, it } from "vitest";
import {
  ADS_TXT_LINE,
  getAdSenseAccountMeta,
  getAdSenseScript,
  getAdSlotHTML,
  getAdsTxtBody,
  hasPublisherClient,
  isAdsEnabled,
  DENY_AD_PATHS,
  LEGAL_AD_PATHS,
  pageAllowsAds,
  pageAllowsAdScript,
  parseAdSlots,
  setAdConfig,
  shouldServeAdsTxt,
  slotKeyForPath,
} from "./ads.js";
import { handlersById } from "../routes/_handlers.js";
import { TOOLS } from "./tool-registry.js";

afterEach(() => {
  setAdConfig({ client: null, slots: {}, path: "/" });
});

describe("pageAllowsAds", () => {
  it("allows homepage, json formatter, and content-bearing legal pages", () => {
    expect(pageAllowsAds("/")).toBe(true);
    expect(pageAllowsAds("/json-formatter")).toBe(true);
    expect(pageAllowsAds("/about")).toBe(true);
    expect(pageAllowsAds("/privacy")).toBe(true);
    expect(pageAllowsAds("/terms")).toBe(true);
    expect(pageAllowsAds("/changelog/")).toBe(true);
    expect([...LEGAL_AD_PATHS]).toEqual([
      "/about",
      "/privacy",
      "/terms",
      "/changelog",
    ]);
  });

  it("does not place ads on thin legal pages", () => {
    expect(pageAllowsAds("/contact")).toBe(false);
    expect(pageAllowsAds("/security")).toBe(false);
    expect(pageAllowsAds("/careers")).toBe(false);
    expect(slotKeyForPath("/contact")).toBeNull();
  });

  it("denies secret and credential tools even with a trailing slash", () => {
    expect(pageAllowsAds("/password-generator")).toBe(false);
    expect(pageAllowsAds("/ssh-key-generator/")).toBe(false);
    expect(pageAllowsAds("/token-studio")).toBe(false);
    expect(pageAllowsAds("/wireguard-config")).toBe(false);
    expect(pageAllowsAds("/certificate-decoder")).toBe(false);
    expect(pageAllowsAds("/secret-scanner")).toBe(false);
    expect(pageAllowsAds("/encoding-workbench")).toBe(false);
  });

  it("keeps the removed /pipe path outside both the explicit deny list and ad inventory", () => {
    // /pipe was removed from the catalog 2026-09-10 and now redirects. It no
    // longer needs a deny-list entry, while the positive allow list still
    // prevents either a unit or client script on the obsolete path itself.
    expect(DENY_AD_PATHS).not.toContain("/pipe");
    expect(pageAllowsAds("/pipe")).toBe(false);
    expect(pageAllowsAdScript("/pipe")).toBe(false);
  });

  it("does not treat other tools as inventory", () => {
    expect(pageAllowsAds("/uuid-generator")).toBe(false);
    expect(slotKeyForPath("/uuid-generator")).toBeNull();
  });

  it("loads the client script on blog and FAQ without making them unit inventory", () => {
    expect(pageAllowsAds("/blog")).toBe(false);
    expect(pageAllowsAds("/faq")).toBe(false);
    expect(slotKeyForPath("/blog")).toBeNull();
    expect(pageAllowsAdScript("/blog")).toBe(true);
    expect(pageAllowsAdScript("/blog/inspect-jwt-in-the-browser")).toBe(true);
    expect(pageAllowsAdScript("/faq")).toBe(true);
    expect(pageAllowsAdScript("/password-generator")).toBe(false);
    expect(pageAllowsAdScript("/uuid-generator")).toBe(false);
  });
});

describe("parseAdSlots", () => {
  it("keeps only allow-list keys and ignores tool/sidebar/bottom", () => {
    expect(
      parseAdSlots({
        ADSENSE_SLOTS: JSON.stringify({
          home: "1111111111",
          json: "2222222222",
          legal: "3333333333",
          tool: "4444444444",
          sidebar: "5555555555",
          bottom: "6666666666",
        }),
      }),
    ).toEqual({
      home: "1111111111",
      json: "2222222222",
      legal: "3333333333",
    });
  });

  it("uses ADSENSE_SLOT only for allow-list keys", () => {
    expect(parseAdSlots({ ADSENSE_SLOT: "7777777777" })).toEqual({
      home: "7777777777",
      json: "7777777777",
      legal: "7777777777",
    });
  });

  it("drops invalid ids", () => {
    expect(
      parseAdSlots({
        ADSENSE_SLOTS: '{"home":"abc","json":"123"}',
      }),
    ).toEqual({});
  });
});

describe("ad rendering", () => {
  it("does not render ad units without slot ids", () => {
    setAdConfig({
      client: "ca-pub-5134881365131182",
      slots: {},
      path: "/",
    });
    expect(isAdsEnabled()).toBe(false);
    expect(getAdSenseScript("/")).toContain(
      'src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5134881365131182"',
    );
    expect(getAdSenseScript("/")).toContain("requestNonPersonalizedAds = 1");
    expect(getAdSenseScript("/")).not.toContain("document.createElement");
    expect(getAdSlotHTML("home")).toBe("");
  });

  it("loads the AdSense client on allow-listed pages before slot ids exist", () => {
    setAdConfig({
      client: "ca-pub-5134881365131182",
      slots: {},
      path: "/",
    });
    expect(getAdSenseScript("/")).toContain(
      'src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-',
    );
    expect(getAdSenseScript("/blog")).toContain("adsbygoogle.js?client=ca-pub-");
    expect(getAdSenseScript("/password-generator")).toBe("");
  });

  it("serves ads.txt and the account meta with a publisher id even before slots exist", () => {
    setAdConfig({
      client: "ca-pub-5134881365131182",
      slots: {},
      path: "/",
    });
    expect(hasPublisherClient()).toBe(true);
    expect(shouldServeAdsTxt()).toBe(true);
    expect(getAdsTxtBody()).toBe(`${ADS_TXT_LINE}\n`);
    expect(getAdSenseAccountMeta()).toBe(
      '<meta name="google-adsense-account" content="ca-pub-5134881365131182">',
    );
  });

  it("omits ads.txt and the account meta without a publisher id", () => {
    setAdConfig({ client: null, slots: {}, path: "/" });
    expect(hasPublisherClient()).toBe(false);
    expect(shouldServeAdsTxt()).toBe(false);
    expect(getAdSenseAccountMeta()).toBe("");
  });

  it("renders a reserved NPA slot on allow-list pages only", () => {
    setAdConfig({
      client: "ca-pub-5134881365131182",
      slots: { home: "1111111111", json: "2222222222", legal: "3333333333" },
      path: "/",
    });
    expect(isAdsEnabled()).toBe(true);
    expect(getAdsTxtBody()).toBe(`${ADS_TXT_LINE}\n`);

    const home = getAdSlotHTML("home");
    expect(home).toContain("Advertisement");
    expect(home).toContain("min-height:280px");
    expect(home).toContain('data-npa-on="1"');
    expect(home).toContain('data-ad-slot="1111111111"');
    expect(home).toContain("adsbygoogle || []).push({})");
    expect(home).not.toContain("display:none");

    setAdConfig({ path: "/password-generator" });
    expect(getAdSenseScript("/password-generator")).toBe("");
    expect(getAdSlotHTML("home")).toBe("");

    setAdConfig({ path: "/json-formatter" });
    const json = getAdSlotHTML("json");
    expect(json).toContain('data-ad-slot="2222222222"');
    expect(getAdSenseScript("/json-formatter")).toContain(
      "requestNonPersonalizedAds = 1",
    );
    expect(getAdSenseScript("/json-formatter")).toContain("adsbygoogle.js");
  });

  it("JSON Formatter page keeps its ad slot below the tool, with no prose block above it", async () => {
    setAdConfig({
      client: "ca-pub-5134881365131182",
      slots: { json: "2222222222" },
      path: "/json-formatter",
    });
    const handler = handlersById["json-formatter"];
    const url = new URL("https://simpletool.app/json-formatter");
    const html = await (await handler(new Request(url), url)).text();
    const placement = html.indexOf('data-ad-placement="json"');
    expect(placement).toBeGreaterThan(-1);
    expect(html).not.toContain('data-ad-placement="tool"');
    // The page is the tool: no marketing/educational prose may precede the controls.
    expect(html).not.toContain('data-section="educational"');
    expect(html).not.toContain("tools.json-formatter.edu.");
    expect(placement).toBeGreaterThan(html.indexOf('id="format-btn"'));
  });

  it("ships no educational or article prose block on all 48 registered tool pages", async () => {
    expect(TOOLS).toHaveLength(48);
    for (const tool of TOOLS) {
      const handler = handlersById[tool.id];
      expect(handler, tool.id).toBeTypeOf("function");
      const url = new URL(`https://simpletool.app${tool.path}`);
      const res = await handler(new Request(url), url);
      // Positive checks first: an error, redirect, or empty page must not pass
      // the negative assertions below by accident.
      expect(res?.status, tool.id).toBe(200);
      expect(res.headers.get("content-type"), tool.id).toContain("text/html");
      const html = await res.text();
      expect(html, tool.id).toContain('id="main-content"');
      expect(html, tool.id).toMatch(/<main[\s>]/);
      expect(html.match(/<h1[\s>]/g) ?? [], tool.id).toHaveLength(1);
      expect(html, tool.id).not.toContain('data-section="educational"');
      expect(html, tool.id).not.toContain(`tools.${tool.id}.edu.`);
    }
  });

  it("never emits Auto ads or leftover slot keys", () => {
    setAdConfig({
      client: "ca-pub-5134881365131182",
      slots: { home: "1111111111", tool: "9999999999" },
      path: "/",
    });
    expect(getAdSlotHTML("tool")).toBe("");
    expect(getAdSenseScript("/")).not.toContain("enable_page_level_ads");
  });
});
