import { respondHTML } from "../utils/respond.js";
import { createPageTemplate, createToolHeader } from "../utils/common-ui.js";
import { createRelatedToolsSection } from "../utils/content-ui.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";
import { TOOLS } from "../utils/tool-registry.js";
import { renderDnsReferenceSection } from "./dns-reference.js";
import { renderPortReferenceSection } from "./port-reference.js";
import { renderHTTPStatusReferenceSection } from "./http-status-reference.js";
import { renderProtocolHeadersSection } from "./protocol-headers.js";

// Merged tool (Track A): DNS / ports / HTTP status / protocol headers, four
// former standalone tools, now four tabs. Each source file exports a
// render*Section(lang) that returns { content, scripts? } with its body + inline
// script verbatim (scripts are IIFE-wrapped; http-status prefixes its shared DOM
// ids with `hs-`). The old paths 301 here via src/utils/redirects.js.
const TABS = [
  {
    id: "dns",
    label: "DNS records",
    i18nKey: "tab0",
    render: renderDnsReferenceSection,
  },
  {
    id: "ports",
    label: "Ports",
    i18nKey: "tab1",
    render: renderPortReferenceSection,
  },
  {
    id: "http",
    label: "HTTP status",
    i18nKey: "tab2",
    render: renderHTTPStatusReferenceSection,
  },
  {
    id: "headers",
    label: "Protocol headers",
    i18nKey: "tab3",
    render: renderProtocolHeadersSection,
  },
];

export async function handleNetworkReferenceRoutes(request, url) {
  if (
    url.pathname !== "/network-reference" &&
    url.pathname !== "/network-reference/"
  )
    return null;
  if (request.method !== "GET") return null;
  const lang = resolveRequestLanguage(request, url);
  return respondHTML(
    renderNetworkReferencePage(lang, url.searchParams.get("tab")),
  );
}

function renderNetworkReferencePage(lang = DEFAULT_LANGUAGE, requestedTab) {
  const currentLang = normalizeLanguage(lang);
  const selectedTab = TABS.some((tab) => tab.id === requestedTab)
    ? requestedTab
    : TABS[0].id;
  const translation = getToolTranslation("network-reference", currentLang);
  const title = translation?.name || "Network Reference";
  const description =
    translation?.desc ||
    "DNS records, common ports, HTTP status codes, and protocol headers — four references in one tabbed tool.";

  const sections = TABS.map((tab) => ({
    ...tab,
    out: tab.render(currentLang),
  }));

  const tabButtons = sections
    .map(
      (s) => `
        <button class="tab-trigger" role="tab" id="tab-${s.id}"
          aria-controls="panel-${s.id}" aria-selected="${s.id === selectedTab ? "true" : "false"}"
          tabindex="${s.id === selectedTab ? "0" : "-1"}" data-net-tab="${s.id}"
          data-i18n="tools.network-reference.ui.${s.i18nKey}">${s.label}</button>`,
    )
    .join("");

  const panels = sections
    .map(
      (s) => `
      <div class="net-ref-panel" role="tabpanel" id="panel-${s.id}" aria-labelledby="tab-${s.id}"${s.id === selectedTab ? "" : " hidden"}>
        ${s.out.content}
      </div>`,
    )
    .join("");

  const relatedTools = (
    TOOLS.find((tool) => tool.id === "network-reference")?.relatedTools || []
  )
    .map((id) => TOOLS.find((tool) => tool.id === id))
    .filter(Boolean);
  const sectionScripts = sections.map((s) => s.out.scripts || "").join("\n");

  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">
        ${createToolHeader({ emoji: "🌐" }, title, description, [], { toolId: "network-reference" })}
      <div class="tabs-list mb-6 flex-wrap" role="tablist" aria-label="Network reference sections"
        data-network-reference-tabs data-i18n-aria="tools.network-reference.ui.aria0">
        ${tabButtons}
      </div>
        ${panels}
        ${createRelatedToolsSection(relatedTools, currentLang)}
      </div>
    </main>
  `;

  const scripts = `
    ${sectionScripts}
    <script>
      (function () {
        const list = document.querySelector('[data-network-reference-tabs]');
        if (!list) return;
        const tabs = Array.from(list.querySelectorAll('[data-net-tab]'));
        const tabIds = tabs.map((tab) => tab.dataset.netTab);
        const defaultId = tabIds[0];
        function updateUrl(id, method) {
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.set('tab', id);
          window.history[method](
            null,
            '',
            nextUrl.pathname + nextUrl.search + nextUrl.hash,
          );
        }
        function activate(id, focus, historyMethod) {
          const nextId = tabIds.includes(id) ? id : defaultId;
          tabs.forEach((tab) => {
            const on = tab.dataset.netTab === nextId;
            tab.setAttribute('aria-selected', on ? 'true' : 'false');
            tab.tabIndex = on ? 0 : -1;
            const panel = document.getElementById('panel-' + tab.dataset.netTab);
            if (panel) panel.hidden = !on;
            if (on && focus) tab.focus();
          });
          if (historyMethod) updateUrl(nextId, historyMethod);
        }
        function activateFromUrl() {
          const requested = new URL(window.location.href).searchParams.get('tab');
          const initialId = tabIds.includes(requested) ? requested : defaultId;
          activate(initialId, false);
          if (requested !== null && requested !== initialId) {
            updateUrl(initialId, 'replaceState');
          }
        }
        list.addEventListener('click', (e) => {
          const t = e.target.closest('[data-net-tab]');
          if (t) activate(t.dataset.netTab, false, 'pushState');
        });
        list.addEventListener('keydown', (e) => {
          const idx = tabs.indexOf(document.activeElement);
          if (idx < 0) return;
          let next = -1;
          if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
          else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
          else if (e.key === 'Home') next = 0;
          else if (e.key === 'End') next = tabs.length - 1;
          if (next >= 0) {
            e.preventDefault();
            activate(tabs[next].dataset.netTab, true, 'pushState');
          }
        });
        window.addEventListener('popstate', activateFromUrl);
        activateFromUrl();
      })();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    lang: currentLang,
    path: "/network-reference",
    content,
    scripts,
    i18nToolIds: [
      "dns-reference",
      "port-reference",
      "http-status-reference",
      "protocol-headers",
    ],
  });
}
