// @vitest-environment node
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { handleNetworkReferenceRoutes } from "./network-reference.js";
import { handleRepoOpsRoutes } from "./repo-ops.js";
import { LEGACY_REDIRECTS, tryLegacyRedirect } from "../utils/redirects.js";
import { TOOLS } from "../utils/tool-registry.js";

const ROUTES = [
  {
    name: "network reference",
    path: "/network-reference",
    handler: handleNetworkReferenceRoutes,
    ids: ["dns", "ports", "http", "headers"],
    dataAttribute: "data-net-tab",
    datasetKey: "netTab",
    canonicalToolId: "network-reference",
    stableListAttribute: "data-network-reference-tabs",
    fullDictionaryIds: [
      "dns-reference",
      "port-reference",
      "http-status-reference",
      "protocol-headers",
    ],
    tabId: (id) => `tab-${id}`,
    panelId: (id) => `panel-${id}`,
  },
  {
    name: "repo operations",
    path: "/repo-ops",
    handler: handleRepoOpsRoutes,
    ids: ["inventory", "manual", "review"],
    dataAttribute: "data-repo-ops-tab",
    datasetKey: "repoOpsTab",
    canonicalToolId: "repo-ops",
    stableListAttribute: "data-repo-ops-tabs",
    fullDictionaryIds: [
      "public-repos-yml-builder",
      "public-repos-not-automation",
      "review-description-generator",
    ],
    tabId: (id) => `repo-ops-tab-${id}`,
    panelId: (id) => `repo-ops-panel-${id}`,
  },
];

const LEGACY_TAB_REDIRECTS = {
  "/dns-reference": ["/network-reference", "dns"],
  "/port-reference": ["/network-reference", "ports"],
  "/http-status-reference": ["/network-reference", "http"],
  "/protocol-headers": ["/network-reference", "headers"],
  "/domain-status": ["/network-reference", "dns"],
  "/public-repos-yml-builder": ["/repo-ops", "inventory"],
  "/public-repos-not-automation": ["/repo-ops", "manual"],
  "/review-description-generator": ["/repo-ops", "review"],
};

async function renderRoute(route, query = "") {
  const url = new URL(`https://simpletool.app${route.path}${query}`);
  const response = await route.handler(new Request(url), url);
  expect(response.status).toBe(200);
  return response.text();
}

function openingTag(html, element, id) {
  const match = html.match(new RegExp(`<${element}[^>]*\\bid="${id}"[^>]*>`));
  expect(match, `missing ${element}#${id}`).not.toBeNull();
  return match[0];
}

function controllerScript(html, dataAttribute) {
  const scripts = [
    ...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g),
  ].map((match) => match[1]);
  const script = scripts.find(
    (body) =>
      body.includes(`[${dataAttribute}]`) && body.includes("activateFromUrl"),
  );
  expect(script, `missing ${dataAttribute} tab controller`).toBeTruthy();
  return script;
}

function languageScript(html) {
  const scripts = [
    ...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g),
  ].map((match) => match[1]);
  const script = scripts.find((body) =>
    body.includes("window.setLanguage = function"),
  );
  expect(script, "missing language controller").toBeTruthy();
  return script;
}

function extractLanguageCatalog(html) {
  const match = html.match(/var _T = ([\s\S]*?);\n\s*var _supported/);
  expect(match).not.toBeNull();
  return JSON.parse(match[1]);
}

function createLanguageHarness(route, html) {
  const elements = {
    name: {
      key: `tools.${route.canonicalToolId}.name`,
      textContent: "",
    },
    desc: {
      key: `tools.${route.canonicalToolId}.desc`,
      textContent: "",
    },
  };
  for (const element of Object.values(elements)) {
    element.getAttribute = (name) =>
      name === "data-i18n" ? element.key : null;
  }

  let currentUrl = new URL(`https://simpletool.app${route.path}?lang=ja`);
  const storage = new Map();
  const document = {
    body: { getAttribute: () => null },
    documentElement: { lang: "ja" },
    querySelectorAll(selector) {
      return selector === "[data-i18n]" ? Object.values(elements) : [];
    },
    querySelector() {
      return null;
    },
    addEventListener() {},
  };
  const browserWindow = {
    history: {
      pushState(_state, _title, nextUrl) {
        currentUrl = new URL(String(nextUrl), currentUrl);
      },
    },
    addEventListener() {},
  };
  Object.defineProperty(browserWindow, "location", {
    get() {
      return currentUrl;
    },
  });
  const localStorage = {
    getItem(key) {
      return storage.get(key) || null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
  };

  runInNewContext(languageScript(html), {
    document,
    localStorage,
    navigator: { language: "ja" },
    URL,
    URLSearchParams,
    window: browserWindow,
  });

  return {
    elements,
    setLanguage(lang) {
      browserWindow.setLanguage(lang);
    },
  };
}

function createTabHarness(route, script, href) {
  const listListeners = {};
  const windowListeners = {};
  const document = {
    activeElement: null,
    querySelector() {
      return list;
    },
    getElementById(id) {
      return panels.get(id) || null;
    },
  };
  const tabs = route.ids.map((id, index) => {
    const attributes = new Map([
      ["aria-selected", index === 0 ? "true" : "false"],
    ]);
    return {
      dataset: { [route.datasetKey]: id },
      tabIndex: index === 0 ? 0 : -1,
      setAttribute(name, value) {
        attributes.set(name, String(value));
      },
      getAttribute(name) {
        return attributes.get(name) || null;
      },
      closest(selector) {
        return selector === `[${route.dataAttribute}]` ? this : null;
      },
      focus() {
        document.activeElement = this;
      },
    };
  });
  const panels = new Map(
    route.ids.map((id, index) => [route.panelId(id), { hidden: index !== 0 }]),
  );
  const list = {
    querySelectorAll(selector) {
      return selector === `[${route.dataAttribute}]` ? tabs : [];
    },
    addEventListener(type, listener) {
      listListeners[type] = listener;
    },
  };

  let currentUrl = new URL(href);
  const historyCalls = [];
  const history = {};
  for (const method of ["pushState", "replaceState"]) {
    history[method] = (_state, _title, nextUrl) => {
      currentUrl = new URL(String(nextUrl), currentUrl);
      historyCalls.push({ method, href: currentUrl.href });
    };
  }
  const browserWindow = {
    history,
    addEventListener(type, listener) {
      windowListeners[type] = listener;
    },
  };
  Object.defineProperty(browserWindow, "location", {
    get() {
      return currentUrl;
    },
  });

  runInNewContext(script, {
    document,
    URL,
    window: browserWindow,
  });

  return {
    tabs,
    panels,
    historyCalls,
    get href() {
      return currentUrl.href;
    },
    get activeElement() {
      return document.activeElement;
    },
    click(id) {
      const tab = tabs[route.ids.indexOf(id)];
      listListeners.click({ target: tab });
    },
    keydown(id, key) {
      const tab = tabs[route.ids.indexOf(id)];
      tab.focus();
      let prevented = false;
      listListeners.keydown({
        key,
        preventDefault() {
          prevented = true;
        },
      });
      return prevented;
    },
    popstate(nextUrl) {
      currentUrl = new URL(nextUrl, currentUrl);
      windowListeners.popstate();
    },
  };
}

function expectActive(route, harness, activeId) {
  for (const [index, id] of route.ids.entries()) {
    const active = id === activeId;
    expect(harness.tabs[index].getAttribute("aria-selected")).toBe(
      active ? "true" : "false",
    );
    expect(harness.tabs[index].tabIndex).toBe(active ? 0 : -1);
    expect(harness.panels.get(route.panelId(id)).hidden).toBe(!active);
  }
}

describe("composite route tab URL contract", () => {
  it("redirects each retired tool to its deterministic tab and preserves other query params", () => {
    for (const [legacyPath, [canonicalPath, tab]] of Object.entries(
      LEGACY_TAB_REDIRECTS,
    )) {
      expect(LEGACY_REDIRECTS[legacyPath]).toBe(`${canonicalPath}?tab=${tab}`);
      const response = tryLegacyRedirect(
        new URL(
          `https://simpletool.app${legacyPath}/?lang=ja&source=legacy&filter=one&filter=two&tab=wrong`,
        ),
      );
      expect(response.status).toBe(301);

      const location = new URL(response.headers.get("location"));
      expect(location.pathname).toBe(canonicalPath);
      expect(location.searchParams.get("tab")).toBe(tab);
      expect(location.searchParams.getAll("tab")).toEqual([tab]);
      expect(location.searchParams.get("lang")).toBe("ja");
      expect(location.searchParams.get("source")).toBe("legacy");
      expect(location.searchParams.getAll("filter")).toEqual(["one", "two"]);
    }
  });

  it("also preserves query params on unrelated legacy redirects", () => {
    const response = tryLegacyRedirect(
      new URL("https://simpletool.app/jwt-decoder?lang=fr&source=bookmark"),
    );
    expect(response.headers.get("location")).toBe(
      "https://simpletool.app/token-studio?lang=fr&source=bookmark",
    );
  });

  for (const route of ROUTES) {
    it(`${route.name} renders one page heading and unique DOM ids`, async () => {
      const html = await renderRoute(route);
      expect(html.match(/<h1\b/g) || []).toHaveLength(1);

      const ids = [...html.matchAll(/<[^>]+\sid="([^"]+)"[^>]*>/g)].map(
        (match) => match[1],
      );
      expect(new Set(ids).size).toBe(ids.length);
    });

    it(`${route.name} renders localized tab hooks and a bounded language catalog`, async () => {
      const html = await renderRoute(route, "?lang=ja");
      const catalog = extractLanguageCatalog(html);
      const translation = catalog.ja.tools[route.canonicalToolId];

      expect(html).toContain(`<title>${translation.name} | SimpleTool</title>`);
      expect(html).toContain(`content="${translation.desc}"`);
      expect(html).toContain(`data-i18n="tools.${route.canonicalToolId}.name"`);
      expect(html).toContain(`data-i18n="tools.${route.canonicalToolId}.desc"`);
      expect(html).toContain(route.stableListAttribute);
      expect(html).toContain(
        `data-i18n-aria="tools.${route.canonicalToolId}.ui.aria0"`,
      );

      for (const [index, id] of route.ids.entries()) {
        expect(openingTag(html, "button", route.tabId(id))).toContain(
          `data-i18n="tools.${route.canonicalToolId}.ui.tab${index}"`,
        );
      }

      const script = controllerScript(html, route.dataAttribute);
      expect(script).toContain(`[${route.stableListAttribute}]`);
      expect(script).not.toContain('[role="tablist"][aria-label=');

      for (const lang of ["en", "ja"]) {
        expect(catalog[lang].tools[route.canonicalToolId]).toHaveProperty("ui");
        for (const toolId of route.fullDictionaryIds) {
          const entry = catalog[lang].tools[toolId];
          expect(entry, `${lang} ${toolId}`).toHaveProperty("ui");
          // Only tools with runtime _t()/tr() strings carry a `js` dictionary;
          // English is the source of truth for which sections must exist.
          for (const section of Object.keys(catalog.en.tools[toolId])) {
            expect(entry, `${lang} ${toolId}.${section}`).toHaveProperty(
              section,
            );
          }
        }
        expect(catalog[lang].tools["json-formatter"]).not.toHaveProperty("ui");
        expect(catalog[lang].tools["json-formatter"]).not.toHaveProperty("js");
      }
    });

    it(`${route.name} updates its canonical heading when language changes in place`, async () => {
      const html = await renderRoute(route, "?lang=ja");
      const catalog = extractLanguageCatalog(html);
      const harness = createLanguageHarness(route, html);

      harness.setLanguage("en");
      expect(harness.elements.name.textContent).toBe(
        catalog.en.tools[route.canonicalToolId].name,
      );
      expect(harness.elements.desc.textContent).toBe(
        catalog.en.tools[route.canonicalToolId].desc,
      );

      harness.setLanguage("ja");
      expect(harness.elements.name.textContent).toBe(
        catalog.ja.tools[route.canonicalToolId].name,
      );
      expect(harness.elements.desc.textContent).toBe(
        catalog.ja.tools[route.canonicalToolId].desc,
      );
    });

    it(`${route.name} renders canonical related tools with every panel localized`, async () => {
      const html = await renderRoute(route, "?lang=ja");
      const currentTool = TOOLS.find(
        (tool) => tool.id === route.canonicalToolId,
      );

      expect(html).toContain('data-i18n="content.relatedTools"');
      for (const relatedId of currentTool.relatedTools) {
        const relatedTool = TOOLS.find((tool) => tool.id === relatedId);
        expect(html).toContain(`href="${relatedTool.path}"`);
      }

      for (const id of route.ids) {
        const panel = openingTag(html, "div", route.panelId(id));
        expect(panel).not.toContain('lang="en"');
        expect(panel).not.toContain('data-translation-status="english-only"');
      }
    });

    it(`${route.name} renders valid URL targets with correct accessible state`, async () => {
      for (const selectedId of route.ids) {
        const html = await renderRoute(
          route,
          `?lang=ja&tab=${selectedId}&source=bookmark`,
        );
        for (const id of route.ids) {
          const active = id === selectedId;
          const tab = openingTag(html, "button", route.tabId(id));
          const panel = openingTag(html, "div", route.panelId(id));
          expect(tab).toContain(`aria-selected="${active ? "true" : "false"}"`);
          expect(tab).toContain(`tabindex="${active ? "0" : "-1"}"`);
          expect(/\shidden(?:\s|>)/.test(panel)).toBe(!active);
        }
      }
    });

    it(`${route.name} falls back to the first tab for invalid URL targets`, async () => {
      const html = await renderRoute(route, "?tab=not-a-tab");
      const firstTab = openingTag(html, "button", route.tabId(route.ids[0]));
      const firstPanel = openingTag(html, "div", route.panelId(route.ids[0]));
      expect(firstTab).toContain('aria-selected="true"');
      expect(firstTab).toContain('tabindex="0"');
      expect(firstPanel).not.toMatch(/\shidden(?:\s|>)/);
    });

    it(`${route.name} updates tabs and URL history for pointer and keyboard selection`, async () => {
      const initialId = route.ids[1];
      const clickedId = route.ids.at(-1);
      const keyboardId = route.ids.at(-2);
      const html = await renderRoute(route, `?lang=ja&tab=${initialId}`);
      const script = controllerScript(html, route.dataAttribute);
      const harness = createTabHarness(
        route,
        script,
        `https://simpletool.app${route.path}?lang=ja&source=bookmark&tab=${initialId}#details`,
      );

      expectActive(route, harness, initialId);
      expect(harness.historyCalls).toEqual([]);

      harness.click(clickedId);
      expectActive(route, harness, clickedId);
      let address = new URL(harness.href);
      expect(address.searchParams.get("tab")).toBe(clickedId);
      expect(address.searchParams.get("lang")).toBe("ja");
      expect(address.searchParams.get("source")).toBe("bookmark");
      expect(address.hash).toBe("#details");
      expect(harness.historyCalls.at(-1).method).toBe("pushState");

      expect(harness.keydown(clickedId, "ArrowLeft")).toBe(true);
      expectActive(route, harness, keyboardId);
      address = new URL(harness.href);
      expect(address.searchParams.get("tab")).toBe(keyboardId);
      expect(harness.historyCalls.at(-1).method).toBe("pushState");
      expect(harness.activeElement).toBe(
        harness.tabs[route.ids.indexOf(keyboardId)],
      );

      const callCount = harness.historyCalls.length;
      harness.popstate(
        `https://simpletool.app${route.path}?lang=ja&tab=${initialId}`,
      );
      expectActive(route, harness, initialId);
      expect(harness.historyCalls).toHaveLength(callCount);
    });

    it(`${route.name} normalizes an invalid browser URL without dropping other params`, async () => {
      const html = await renderRoute(route);
      const harness = createTabHarness(
        route,
        controllerScript(html, route.dataAttribute),
        `https://simpletool.app${route.path}?lang=vi&source=bookmark&tab=invalid`,
      );

      expectActive(route, harness, route.ids[0]);
      expect(harness.historyCalls).toHaveLength(1);
      expect(harness.historyCalls[0].method).toBe("replaceState");
      const address = new URL(harness.href);
      expect(address.searchParams.get("tab")).toBe(route.ids[0]);
      expect(address.searchParams.get("lang")).toBe("vi");
      expect(address.searchParams.get("source")).toBe("bookmark");
    });
  }
});
