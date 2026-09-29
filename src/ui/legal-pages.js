/**
 * Legal pages - Terms of Service, Privacy Policy, About, Contact
 */

import { respondHTML } from "../utils/respond.js";
import { createPageTemplate, getAdSlotHTML } from "../utils/common-ui.js";
import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  resolveRequestLanguage,
  t,
} from "../utils/i18n.js";
import { getLegalSections } from "./legal-content.js";

const SITE_NAME = "SimpleTool App";
const CONTACT_EMAIL = "hello@simpletool.app";
const LAST_UPDATED_ISO = "2026-09-08";

function renderLegalShell({
  title,
  description,
  content,
  path,
  lang = DEFAULT_LANGUAGE,
}) {
  // createPageTemplate no longer injects a default tool slot.
  const html = createPageTemplate({
    title,
    description,
    content,
    path,
    lang,
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: `https://simpletool.app${path}`,
    },
  });

  return respondHTML(html);
}

function wrapLegalPage({
  heading,
  title,
  description,
  showLastUpdated = true,
  body,
  path,
  lang = DEFAULT_LANGUAGE,
}) {
  const currentLang = normalizeLanguage(lang);
  const lastUpdatedDate = new Date(LAST_UPDATED_ISO).toLocaleDateString(
    currentLang,
    { year: "numeric", month: "long", day: "numeric" },
  );
  const updated = showLastUpdated
    ? `<p class="mt-2 text-sm text-surface-500 dark:text-surface-400">${t("content.legal.lastUpdated", currentLang)}: ${lastUpdatedDate}</p>`
    : "";

  const content = `
    <main class="content-page-shell">
      <div class="content-page-panel">
        <header class="mb-8">
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">${heading}</h1>
          ${updated}
        </header>

        <div class="prose dark:prose-invert max-w-none prose-pre:bg-surface-100 dark:prose-pre:bg-surface-950 prose-pre:border prose-pre:border-surface-200 dark:prose-pre:border-surface-800">
          ${body}
        </div>
      </div>

      ${getAdSlotHTML("legal", { path, wrapperClassName: "mt-10" })}
    </main>
  `;

  return renderLegalShell({
    title,
    description,
    content,
    path,
    lang: currentLang,
  });
}

function renderAdPolicyScope(policy, labels) {
  if (!policy) return "";
  const manualPaths = policy.manualUnitPaths
    .map((path) => `<li><code data-ad-policy-path="${path}">${path}</code></li>`)
    .join("");
  const scriptPaths = policy.scriptPaths
    .map((path) => `<li><code data-ad-policy-path="${path}">${path}</code></li>`)
    .join("");
  const prefixes = policy.scriptPrefixes
    .map((prefix) => `<li><code data-ad-policy-prefix="${prefix}">${prefix}*</code></li>`)
    .join("");

  return `<div class="not-prose mt-4 rounded-lg border border-border bg-muted/40 p-4" data-ad-policy-scope="v1" data-auto-ads-status="${policy.autoAdsStatus}" data-cmp-status="${policy.cmpStatus}">
    <p class="text-sm font-semibold text-foreground">${labels.title}</p>
    <p class="mt-2 text-sm text-muted-foreground">${labels.manualUnits}</p>
    <ul class="mt-2 list-disc pl-5 text-sm text-muted-foreground">${manualPaths}</ul>
    <p class="mt-3 text-sm text-muted-foreground">${labels.scriptScope}</p>
    <ul class="mt-2 list-disc pl-5 text-sm text-muted-foreground">${scriptPaths}${prefixes}</ul>
    <p class="mt-3 text-sm text-muted-foreground">${labels.accountStatus}</p>
  </div>`;
}

function renderSectionBlocks(sections) {
  return sections
    .map((section) => {
      const heading = section.heading ? `<h2>${section.heading}</h2>` : "";
      const paragraphs = (section.paragraphs || [])
        .map((paragraph) => {
          const text = String(paragraph).trim();
          if (/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(text)) {
            const email = text;
            return `<p><a href="mailto:${email}" class="text-primary-600 dark:text-primary-400 hover:underline">${email}</a></p>`;
          }
          return `<p>${text}</p>`;
        })
        .join("");
      const list =
        Array.isArray(section.list) && section.list.length
          ? `<ul>${section.list.map((item) => `<li>${item}</li>`).join("")}</ul>`
          : "";
      const html = section.html ? `<div>${section.html}</div>` : "";
      const adPolicy = renderAdPolicyScope(
        section.adPolicy,
        section.adPolicyLabels,
      );
      return `<section class="mb-8">${heading}${paragraphs}${list}${html}${adPolicy}</section>`;
    })
    .join("");
}

export function renderTermsPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const body = renderSectionBlocks(getLegalSections("terms", currentLang));

  return wrapLegalPage({
    heading: t("content.legal.termsTitle", currentLang),
    title: t("content.legal.termsTitle", currentLang),
    description: t("content.legal.termsDescription", currentLang),
    showLastUpdated: true,
    body,
    path: "/terms",
    lang: currentLang,
  });
}

export function renderPrivacyPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const body = renderSectionBlocks(getLegalSections("privacy", currentLang));

  return wrapLegalPage({
    heading: t("content.legal.privacyTitle", currentLang),
    title: t("content.legal.privacyTitle", currentLang),
    description: t("content.legal.privacyDescription", currentLang),
    showLastUpdated: true,
    body,
    path: "/privacy",
    lang: currentLang,
  });
}

export function renderAboutPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const body = renderSectionBlocks(getLegalSections("about", currentLang));

  return wrapLegalPage({
    heading: t("content.legal.aboutTitle", currentLang),
    title: t("content.legal.aboutTitle", currentLang),
    description: t("content.legal.aboutDescription", currentLang),
    showLastUpdated: false,
    body,
    path: "/about",
    lang: currentLang,
  });
}

export function renderSecurityPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const body = renderSectionBlocks(getLegalSections("security", currentLang));

  return wrapLegalPage({
    heading: t("content.legal.securityTitle", currentLang),
    title: t("content.legal.securityTitle", currentLang),
    description: t("content.legal.securityDescription", currentLang),
    showLastUpdated: true,
    body,
    path: "/security",
    lang: currentLang,
  });
}

export function renderCareersPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const body = renderSectionBlocks(getLegalSections("careers", currentLang));

  return wrapLegalPage({
    heading: t("content.legal.careersTitle", currentLang),
    title: t("content.legal.careersTitle", currentLang),
    description: t("content.legal.careersDescription", currentLang),
    showLastUpdated: true,
    body,
    path: "/careers",
    lang: currentLang,
  });
}

export function renderContactPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const body = renderSectionBlocks(getLegalSections("contact", currentLang));

  return wrapLegalPage({
    heading: t("content.legal.contactTitle", currentLang),
    title: t("content.legal.contactTitle", currentLang),
    description: t("content.legal.contactDescription", currentLang),
    showLastUpdated: false,
    body,
    path: "/contact",
    lang: currentLang,
  });
}
