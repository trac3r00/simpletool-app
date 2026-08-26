import { respondHTML } from "../utils/respond.js";
import { createPageTemplate } from "../utils/common-ui.js";
import { createRelatedToolsSection } from "../utils/content-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";
import { renderPublicReposYmlBuilderSection } from "./public-repos-yml-builder.js";
import { renderPublicReposNotAutomationSection } from "./public-repos-not-automation.js";
import { renderReviewDescriptionGeneratorSection } from "./review-description-generator.js";

const TABS = [
  {
    id: "inventory",
    label: "Repository inventory",
    i18nKey: "tab0",
    render: renderPublicReposYmlBuilderSection,
  },
  {
    id: "manual",
    label: "Manual stewardship",
    i18nKey: "tab1",
    render: renderPublicReposNotAutomationSection,
  },
  {
    id: "review",
    label: "Review descriptions",
    i18nKey: "tab2",
    render: renderReviewDescriptionGeneratorSection,
  },
];

export async function handleRepoOpsRoutes(request, url) {
  if (url.pathname !== "/repo-ops" && url.pathname !== "/repo-ops/") {
    return null;
  }
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }
  return respondHTML(
    renderRepoOpsPage(
      resolveRequestLanguage(request, url),
      url.searchParams.get("tab"),
    ),
  );
}

export function renderRepoOpsPage(lang = DEFAULT_LANGUAGE, requestedTab) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation("repo-ops", currentLang);
  const title = translation?.name || "Repo Operations";
  const description =
    translation?.desc ||
    "Build public repository inventories, manual-stewardship records, and review descriptions in one workspace.";
  const selectedTab = TABS.some((tab) => tab.id === requestedTab)
    ? requestedTab
    : TABS[0].id;
  const sections = TABS.map((tab) => ({
    ...tab,
    output: tab.render(currentLang),
  }));
  const currentTool = TOOLS.find((tool) => tool.id === "repo-ops");
  const relatedTools =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((tool) => tool.id === id))
      .filter(Boolean) || [];

  const tabButtons = sections
    .map(
      (section) => `
        <button class="tab-trigger" type="button" role="tab"
          id="repo-ops-tab-${section.id}"
          aria-controls="repo-ops-panel-${section.id}"
          aria-selected="${section.id === selectedTab ? "true" : "false"}"
          tabindex="${section.id === selectedTab ? "0" : "-1"}"
          data-repo-ops-tab="${section.id}"
          data-i18n="tools.repo-ops.ui.${section.i18nKey}">${section.label}</button>`,
    )
    .join("");

  const panels = sections
    .map(
      (section) => `
        <div role="tabpanel" id="repo-ops-panel-${section.id}"
          aria-labelledby="repo-ops-tab-${section.id}"${section.id === selectedTab ? "" : " hidden"}>
          ${section.output.content}
        </div>`,
    )
    .join("");

  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">
        <div class="mb-6">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-3xl" aria-hidden="true">📚</span>
          <h1 class="tool-header-title" data-i18n="tools.repo-ops.name">${title}</h1>
        </div>
        <p class="text-surface-600 dark:text-surface-400 max-w-3xl" data-i18n="tools.repo-ops.desc">${description}</p>
      </div>
      <div class="tabs-list mb-6 flex-wrap" role="tablist" aria-label="Repository operations sections"
        data-repo-ops-tabs data-i18n-aria="tools.repo-ops.ui.aria0">
        ${tabButtons}
      </div>
      ${panels}
        ${createRelatedToolsSection(relatedTools, currentLang)}
      </div>
    </main>
  `;

  const scripts = `
    ${sections.map((section) => section.output.scripts || "").join("\n")}
    <script>
      (function () {
        const list = document.querySelector('[data-repo-ops-tabs]');
        if (!list) return;
        const tabs = Array.from(list.querySelectorAll('[data-repo-ops-tab]'));
        const tabIds = tabs.map((tab) => tab.dataset.repoOpsTab);
        const defaultId = tabIds[0];
        function updateUrl(id, method) {
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.set("tab", id);
          window.history[method](
            null,
            "",
            nextUrl.pathname + nextUrl.search + nextUrl.hash,
          );
        }
        function activate(id, focus, historyMethod) {
          const nextId = tabIds.includes(id) ? id : defaultId;
          tabs.forEach((tab) => {
            const active = tab.dataset.repoOpsTab === nextId;
            tab.setAttribute("aria-selected", active ? "true" : "false");
            tab.tabIndex = active ? 0 : -1;
            const panel = document.getElementById("repo-ops-panel-" + tab.dataset.repoOpsTab);
            if (panel) panel.hidden = !active;
            if (active && focus) tab.focus();
          });
          if (historyMethod) updateUrl(nextId, historyMethod);
        }
        function activateFromUrl() {
          const requested = new URL(window.location.href).searchParams.get("tab");
          const initialId = tabIds.includes(requested) ? requested : defaultId;
          activate(initialId, false);
          if (requested !== null && requested !== initialId) {
            updateUrl(initialId, "replaceState");
          }
        }
        list.addEventListener("click", (event) => {
          const tab = event.target.closest("[data-repo-ops-tab]");
          if (tab) activate(tab.dataset.repoOpsTab, false, "pushState");
        });
        list.addEventListener("keydown", (event) => {
          const index = tabs.indexOf(document.activeElement);
          if (index < 0) return;
          let next = -1;
          if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
          else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
          else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = tabs.length - 1;
          if (next >= 0) {
            event.preventDefault();
            activate(tabs[next].dataset.repoOpsTab, true, "pushState");
          }
        });
        window.addEventListener("popstate", activateFromUrl);
        activateFromUrl();
      })();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    lang: currentLang,
    path: "/repo-ops",
    content,
    scripts,
    i18nToolIds: [
      "public-repos-yml-builder",
      "public-repos-not-automation",
      "review-description-generator",
    ],
  });
}
