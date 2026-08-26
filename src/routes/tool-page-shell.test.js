import { describe, expect, it } from "vitest";
import { handleBandwidthCalculatorRoutes } from "./bandwidth-calculator.js";
import { handleCaffeinateRoutes } from "./caffeinate.js";
import { handleCaseConverterRoutes } from "./case-converter.js";
import { handleEnvVarManagerRoutes } from "./env-var-manager.js";
import { handleTextDiffRoutes } from "./text-diff.js";
import { handleTimestampConverterRoutes } from "./timestamp-converter.js";
import { handleTokenCounterRoutes } from "./token-counter.js";
import { handleUnitConverterRoutes } from "./unit-converter.js";
import { handleUUIDGeneratorRoutes } from "./uuid-generator.js";
import { handleWireguardConfigRoutes } from "./wireguard-config.js";
import { handleEmailAnalyzerRoutes } from "./email-analyzer.js";
import { handleColorConverterRoutes } from "./color-converter.js";
import { handleSQLFormatterRoutes } from "./sql-formatter.js";
import { handleSVGOptimizerRoutes } from "./svg-optimizer.js";
import { handleCodeMinifierRoutes } from "./code-minifier.js";
import { handleUserAgentDecoderRoutes } from "./user-agent-decoder.js";
import { handleEncodingWorkbenchRoutes } from "./encoding-workbench.js";
import { handleImageConverterRoutes } from "./image-converter.js";
import { handleJSONFormatterRoutes } from "./json-formatter.js";
import { handleMockDataRoutes } from "./mock-data-generator.js";
import { handleOAuthDebuggerRoutes } from "./oauth-debugger.js";
import { handleSecretScannerRoutes } from "./secret-scanner.js";
import { handleCSSGradientRoutes } from "./css-gradient-generator.js";
import { handlePasswordGeneratorRoutes } from "./password-generator.js";
import { handlePromptTemplateBuilderRoutes } from "./prompt-template-builder.js";
import { handleQRCodeRoutes } from "./qr-code.js";
import { handleSSHKeyGeneratorRoutes } from "./ssh-key-generator.js";
import { handleTokenStudioRoutes } from "./token-studio.js";
import { handleCSPBuilderRoutes } from "./csp-builder.js";
import { handleCertificateDecoderRoutes } from "./certificate-decoder.js";
import { handleCIDRCalculatorRoutes } from "./cidr-calculator.js";
import { handleSamlDecoderRoutes } from "./saml-decoder.js";
import { handleHtpasswdRoutes } from "./htpasswd-generator.js";
import { handleDataConverterRoutes } from "./yaml-toml-converter.js";
import { handleMarkdownEditorRoutes } from "./markdown-editor.js";
import { handleCronBuilderRoutes } from "./cron-builder.js";
import { handleRegexVisualizerRoutes } from "./regex-visualizer.js";
import { handleMermaidStudioRoutes } from "./mermaid-studio.js";
import { handlePipeRoutes } from "./pipe.js";
import { handleCurlStudioRoutes } from "./curl-studio.js";
import { handleLogMaskerRoutes } from "./log-masker.js";
import { handleJsonSchemaStudioRoutes } from "./json-schema-studio.js";
import { handleWiresharkFilterRoutes } from "./wireshark-filter.js";
import { handleWebhookDebuggerRoutes } from "./webhook-debugger.js";
import { handleRepoOpsRoutes } from "./repo-ops.js";
import { handleNetworkReferenceRoutes } from "./network-reference.js";
import { handleLadderGameRoutes } from "./ladder-game.js";
import { handleRouletteWheelRoutes } from "./roulette-wheel.js";
import { handleMarbleRouletteRoutes } from "./marble-roulette.js";
import { handleLogViewerRoutes } from "./log-viewer.js";

const MIGRATED_ROUTES = [
  ["unit-converter", handleUnitConverterRoutes],
  ["bandwidth-calculator", handleBandwidthCalculatorRoutes],
  ["uuid-generator", handleUUIDGeneratorRoutes],
  ["caffeinate", handleCaffeinateRoutes],
  ["case-converter", handleCaseConverterRoutes],
  ["env-var-manager", handleEnvVarManagerRoutes],
  ["text-diff", handleTextDiffRoutes],
  ["timestamp-converter", handleTimestampConverterRoutes],
  ["token-counter", handleTokenCounterRoutes],
  ["wireguard-config", handleWireguardConfigRoutes],
  ["email-analyzer", handleEmailAnalyzerRoutes],
  ["color-converter", handleColorConverterRoutes],
  ["sql-formatter", handleSQLFormatterRoutes],
  ["svg-optimizer", handleSVGOptimizerRoutes],
  ["code-minifier", handleCodeMinifierRoutes],
  ["user-agent-decoder", handleUserAgentDecoderRoutes],
  ["encoding-workbench", handleEncodingWorkbenchRoutes],
  ["image-converter", handleImageConverterRoutes],
  ["json-formatter", handleJSONFormatterRoutes],
  ["mock-data-generator", handleMockDataRoutes],
  ["oauth-debugger", handleOAuthDebuggerRoutes],
  ["secret-scanner", handleSecretScannerRoutes],
  ["css-gradient", handleCSSGradientRoutes],
  ["password-generator", handlePasswordGeneratorRoutes],
  ["prompt-template-builder", handlePromptTemplateBuilderRoutes],
  ["qr-code", handleQRCodeRoutes],
  ["ssh-key-generator", handleSSHKeyGeneratorRoutes],
  ["token-studio", handleTokenStudioRoutes],
  ["csp-builder", handleCSPBuilderRoutes],
  ["certificate-decoder", handleCertificateDecoderRoutes],
  ["cidr-calculator", handleCIDRCalculatorRoutes],
  ["saml-decoder", handleSamlDecoderRoutes],
  ["htpasswd-generator", handleHtpasswdRoutes],
  ["yaml-toml-converter", handleDataConverterRoutes],
  ["markdown-editor", handleMarkdownEditorRoutes],
  ["cron-builder", handleCronBuilderRoutes],
  ["regex-visualizer", handleRegexVisualizerRoutes],
  ["mermaid-studio", handleMermaidStudioRoutes],
  ["pipe", handlePipeRoutes],
  ["curl-studio", handleCurlStudioRoutes],
  ["log-masker", handleLogMaskerRoutes],
  ["json-schema-studio", handleJsonSchemaStudioRoutes],
  ["wireshark-filter", handleWiresharkFilterRoutes],
  ["webhook-debugger", handleWebhookDebuggerRoutes],
  ["repo-ops", handleRepoOpsRoutes],
  ["network-reference", handleNetworkReferenceRoutes],
  ["ladder-game", handleLadderGameRoutes],
  ["roulette-wheel", handleRouletteWheelRoutes],
  ["marble-roulette", handleMarbleRouletteRoutes],
  ["log-viewer", handleLogViewerRoutes],
];

const COMPOSITE_ROUTE_MARKERS = {
  "repo-ops": ["repo-ops-tab-inventory", "repo-ops-panel-inventory"],
  "network-reference": ["tab-dns", "panel-dns"],
};

function countClassToken(markup, token) {
  return Array.from(markup.matchAll(/\bclass=(["'])([\s\S]*?)\1/g))
    .map((match) => match[2])
    .filter((className) => className.split(/\s+/).includes(token)).length;
}

describe("canonical tool page shell", () => {
  it.each(MIGRATED_ROUTES)(
    "renders %s in the canonical shell",
    async (path, handler) => {
      const url = new URL(`https://simpletool.app/${path}`);
      const response = await handler(new Request(url), url);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toMatch(/^text\/html\b/i);
      expect(html.match(/<main\b/gi) || []).toHaveLength(1);
      expect(html.match(/<\/main\s*>/gi) || []).toHaveLength(1);

      const main = html.match(/<main\b([^>]*)>([\s\S]*?)<\/main>/i);
      expect(main).not.toBeNull();

      const mainOpeningTag = `<main${main[1]}>`;
      const mainContent = main[2];
      expect(countClassToken(mainOpeningTag, "tool-page-shell")).toBe(1);
      expect(
        countClassToken(mainContent, "tool-page-panel"),
      ).toBeGreaterThanOrEqual(1);
      expect(mainContent).not.toMatch(/<main\b/i);

      const compositeMarkers = COMPOSITE_ROUTE_MARKERS[path];
      if (compositeMarkers) {
        expect(countClassToken(mainContent, "tool-page-panel")).toBe(1);
        for (const id of compositeMarkers) {
          expect(mainContent).toContain(`id="${id}"`);
        }
      }
    },
  );
});
