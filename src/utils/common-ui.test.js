import { afterEach, describe, it, expect } from "vitest";
import {
  createFeatureList,
  createPageTemplate,
  createToolHeader,
  setAdConfig,
} from "./common-ui.js";

function extractLanguageCatalog(html) {
  const match = html.match(/var _T = ([\s\S]*?);\n\s*var _supported/);
  expect(match).not.toBeNull();
  return JSON.parse(match[1]);
}

describe("createFeatureList", () => {
  it("returns empty string for empty array", () => {
    const result = createFeatureList([]);
    expect(result).toBe("");
  });

  it("returns empty string for null/undefined", () => {
    expect(createFeatureList(null)).toBe("");
    expect(createFeatureList(undefined)).toBe("");
  });

  it("renders single item as a semantic feature list", () => {
    const result = createFeatureList([{ text: "Feature One" }]);
    expect(result).toBe(
      '<ul data-feature-list class="tool-header-features mt-2 flex flex-wrap gap-2 text-xs text-surface-600 dark:text-surface-400"><li>Feature One</li></ul>',
    );
  });

  it("renders multiple items as semantic feature list items", () => {
    const result = createFeatureList([
      { text: "Feature One" },
      { text: "Feature Two" },
    ]);
    expect(result).toContain("data-feature-list");
    expect(result).not.toContain("<dl");
    expect(result).not.toContain("<dd>");
    expect(result).toContain("<li>Feature One</li>");
    expect(result).toContain("<li>Feature Two</li>");
  });
});

describe("createToolHeader", () => {
  it("renders with 0 pills - no trust pill rendered", () => {
    const html = createToolHeader(
      { emoji: "🔧" },
      "Test Tool",
      "Test description",
      [],
    );
    expect(html).not.toContain("data-trust-pill");
    expect(html).not.toContain("data-feature-list");
  });

  it("renders with 1 pill - exactly 1 data-trust-pill marker attribute", () => {
    const html = createToolHeader(
      { emoji: "🔧" },
      "Test Tool",
      "Test description",
      [{ text: "Privacy First" }],
    );
    // Count occurrences of data-trust-pill attribute
    const matches = html.match(/data-trust-pill(?:=|\s|>)/g) || [];
    expect(matches.length).toBe(1);
    expect(html).toContain("data-trust-pill");
    expect(html).toContain("Privacy First");
    expect(html).not.toContain("data-feature-list");
  });

  it("renders HTML badge content without nesting markup inside attributes", () => {
    const html = createToolHeader(
      { emoji: "🔧" },
      "Test Tool",
      "Test description",
      [
        {
          text: '<span data-i18n="tools.test-tool.ui.badge0">Privacy First</span>',
        },
      ],
    );

    expect(html).toContain("data-trust-pill");
    expect(html).toContain(
      '<span data-i18n="tools.test-tool.ui.badge0">Privacy First</span>',
    );
    expect(html).not.toContain('data-trust-pill="<span');
  });

  it("renders with 3 pills - 1 trust pill + feature list with 2 li entries", () => {
    const html = createToolHeader(
      { emoji: "🔧" },
      "Test Tool",
      "Test description",
      [
        { text: "Trust Pill" },
        { text: "Feature Two" },
        { text: "Feature Three" },
      ],
    );
    // Exactly 1 trust pill
    const trustPills = html.match(/data-trust-pill(?:=|\s|>)/g) || [];
    expect(trustPills.length).toBe(1);
    expect(html).toContain("data-trust-pill");
    expect(html).toContain("Trust Pill");

    // Feature list with 2 demoted items
    expect(html).toContain("data-feature-list");
    const liMatches = html.match(/<li>/g) || [];
    expect(liMatches.length).toBe(2);
    expect(html).not.toContain("<dl");
    expect(html).not.toContain("<dd>");
    expect(html).toContain("<li>Feature Two</li>");
    expect(html).toContain("<li>Feature Three</li>");
  });

  it("preserves existing Tailwind classes and adds shell styling hooks", () => {
    const html = createToolHeader(
      { emoji: "🔧" },
      "Test Tool",
      "Test description",
      [{ text: "Privacy First" }],
    );
    expect(html).toContain("tool-header-trust inline-flex");
    expect(html).toContain(" rounded text-xs");
    expect(html).not.toContain("rounded-full");
    expect(html).toContain('<header class="tool-header');
    expect(html).toContain('class="tool-header-icon');
    expect(html).toContain('class="tool-header-title');
    expect(html).toContain('class="tool-header-subtitle');
  });

  it("renders with 2 pills - 1 trust pill + 1 demoted feature", () => {
    const html = createToolHeader(
      { emoji: "🔧" },
      "Test Tool",
      "Test description",
      [{ text: "Trust Pill" }, { text: "Demoted Feature" }],
    );
    expect(html).toContain("data-trust-pill");
    expect(html).toContain("Trust Pill");
    expect(html).toContain("data-feature-list");
    const liMatches = html.match(/<li>/g) || [];
    expect(liMatches.length).toBe(1);
    expect(html).not.toContain("<dl");
    expect(html).not.toContain("<dd>");
    expect(html).toContain("<li>Demoted Feature</li>");
  });

  it("accepts toolId option correctly", () => {
    const html = createToolHeader(
      { emoji: "🔧" },
      "Test Tool",
      "Test description",
      [{ text: "Privacy First" }],
      { toolId: "test-tool" },
    );
    expect(html).toContain('data-i18n="tools.test-tool.name"');
    expect(html).toContain('data-i18n="tools.test-tool.desc"');
  });

  it("renders a level-two heading for composite tool sections", () => {
    const html = createToolHeader(
      { emoji: "🔧" },
      "Test Tool",
      "Test description",
      [],
      { toolId: "test-tool", headingLevel: 2 },
    );
    expect(html).toContain('<h2 class="tool-header-title');
    expect(html).toContain("Test Tool</h2>");
    expect(html).not.toContain('<h1 class="tool-header-title');
  });

  it("works with string option for toolId (legacy behavior)", () => {
    const html = createToolHeader(
      { emoji: "🔧" },
      "Test Tool",
      "Test description",
      [{ text: "Privacy First" }],
      "test-tool",
    );
    expect(html).toContain('data-i18n="tools.test-tool.name"');
  });
});

describe("createPageTemplate", () => {
  afterEach(() => {
    setAdConfig({ client: null, slots: {}, path: "/" });
  });

  const renderPage = (options = {}) =>
    createPageTemplate({
      title: "Test Tool",
      description: "Test description",
      content: "<main>Test content</main>",
      path: "/test-tool",
      ...options,
    });

  it("preserves the existing tool-page defaults", () => {
    const html = renderPage();

    expect(html).toContain("<title>Test Tool | SimpleTool</title>");
    expect(html).toContain(
      '<meta property="og:title" content="Test Tool | SimpleTool">',
    );
    expect(html).toContain(
      '<meta name="twitter:title" content="Test Tool | SimpleTool">',
    );
    expect(html).not.toContain('<meta name="keywords"');
    expect(html).not.toContain('name="google-adsense-account"');
    expect(html).toContain("keyboard-shortcuts-modal");
    expect(html).toContain("function copyToClipboard");
    expect(html).toContain('var TOOL_ID = "test-tool"');
  });

  it("emits the AdSense account meta when a publisher id is configured", () => {
    setAdConfig({
      client: "ca-pub-5134881365131182",
      slots: {},
      path: "/test-tool",
    });
    const html = renderPage();
    expect(html).toContain(
      '<meta name="google-adsense-account" content="ca-pub-5134881365131182">',
    );
    expect(html).not.toContain("adsbygoogle.js");
  });

  it("supports an exact title and optional keywords", () => {
    const html = renderPage({
      title: "SimpleTool — Browser-based developer utilities",
      titleSuffix: "",
      keywords: "developer tools, browser utilities",
    });

    expect(html).toContain(
      "<title>SimpleTool — Browser-based developer utilities</title>",
    );
    expect(html).toContain(
      '<meta property="og:title" content="SimpleTool — Browser-based developer utilities">',
    );
    expect(html).toContain(
      '<meta name="twitter:title" content="SimpleTool — Browser-based developer utilities">',
    );
    expect(html).toContain(
      '<meta name="keywords" content="developer tools, browser utilities">',
    );
  });

  it("can omit tool-only utilities without removing the shared runtime", () => {
    const html = renderPage({
      includeToolUtilities: false,
      scripts: "<script data-page-script>window.pageReady = true;</script>",
    });

    expect(html).not.toContain("keyboard-shortcuts-modal");
    expect(html).not.toContain("function copyToClipboard");
    expect(html).not.toContain("var TOOL_ID =");
    expect(html).toContain("data-theme-bootstrap");
    expect(html).toContain("data-i18n-bootstrap");
    expect(html).toContain("nav-search-btn");
    expect(html).toContain("data-page-script");
    expect(html).toContain("serviceWorker.register");
  });

  it("forwards embedded tool IDs to the language dictionary slimmer", () => {
    const catalog = extractLanguageCatalog(
      renderPage({ i18nToolIds: ["dns-reference"] }),
    );

    expect(catalog.en.tools["dns-reference"]).toHaveProperty("ui");
    expect(catalog.en.tools["dns-reference"]).toHaveProperty("js");
    expect(catalog.en.tools["port-reference"]).not.toHaveProperty("ui");
    expect(catalog.en.tools["port-reference"]).not.toHaveProperty("js");
  });

  it("uses a supplied schema instead of the automatic tool schema", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "SimpleTool",
    };
    const html = renderPage({ schema });

    expect(html).toContain(JSON.stringify(schema));
    expect(html).not.toContain('"@type":"SoftwareApplication"');
  });
});
