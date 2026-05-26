/**
 * Build script: generates src/routes/_handlers.js
 *
 * Maps tool IDs to their route handler exports. Worker.js imports this
 * single file instead of 49 individual route files.
 *
 * Convention for NEW tools:
 *   - File: src/routes/{tool-id}.js
 *   - Export: export async function handleRoutes(request, url) { ... }
 *   - Add entry to TOOL_HANDLERS below with exportName: 'handleRoutes'
 *
 * Run: node scripts/build-routes.js
 */

import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ROUTES_DIR = join(ROOT, 'src', 'routes');
const OUTPUT = join(ROUTES_DIR, '_handlers.js');

const TOOL_HANDLERS = [
  { id: 'password-generator', file: 'password-generator.js', exp: 'handlePasswordGeneratorRoutes' },
  { id: 'json-formatter', file: 'json-formatter.js', exp: 'handleJSONFormatterRoutes' },
  { id: 'qr-code', file: 'qr-code.js', exp: 'handleQRCodeRoutes' },
  { id: 'uuid-generator', file: 'uuid-generator.js', exp: 'handleUUIDGeneratorRoutes' },
  { id: 'timestamp-converter', file: 'timestamp-converter.js', exp: 'handleTimestampConverterRoutes' },
  { id: 'color-converter', file: 'color-converter.js', exp: 'handleColorConverterRoutes' },
  { id: 'unit-converter', file: 'unit-converter.js', exp: 'handleUnitConverterRoutes' },
  { id: 'markdown-editor', file: 'markdown-editor.js', exp: 'handleMarkdownEditorRoutes' },
  { id: 'text-diff', file: 'text-diff.js', exp: 'handleTextDiffRoutes' },
  { id: 'certificate-decoder', file: 'certificate-decoder.js', exp: 'handleCertificateDecoderRoutes' },
  { id: 'case-converter', file: 'case-converter.js', exp: 'handleCaseConverterRoutes' },
  { id: 'log-viewer', file: 'log-viewer.js', exp: 'handleLogViewerRoutes' },
  { id: 'image-converter', file: 'image-converter.js', exp: 'handleImageConverterRoutes' },
  { id: 'css-gradient', file: 'css-gradient-generator.js', exp: 'handleCSSGradientRoutes' },
  { id: 'code-minifier', file: 'code-minifier.js', exp: 'handleCodeMinifierRoutes' },
  { id: 'cidr-calculator', file: 'cidr-calculator.js', exp: 'handleCIDRCalculatorRoutes' },
  { id: 'saml-decoder', file: 'saml-decoder.js', exp: 'handleSamlDecoderRoutes' },
  { id: 'htpasswd-generator', file: 'htpasswd-generator.js', exp: 'handleHtpasswdRoutes' },
  { id: 'yaml-toml-converter', file: 'yaml-toml-converter.js', exp: 'handleDataConverterRoutes' },
  { id: 'cron-builder', file: 'cron-builder.js', exp: 'handleCronBuilderRoutes' },
  { id: 'mock-data-generator', file: 'mock-data-generator.js', exp: 'handleMockDataRoutes' },
  { id: 'user-agent-decoder', file: 'user-agent-decoder.js', exp: 'handleUserAgentDecoderRoutes' },
  { id: 'ssh-key-generator', file: 'ssh-key-generator.js', exp: 'handleSSHKeyGeneratorRoutes' },
  { id: 'regex-visualizer', file: 'regex-visualizer.js', exp: 'handleRegexVisualizerRoutes' },
  { id: 'curl-studio', file: 'curl-studio.js', exp: 'handleCurlStudioRoutes' },
  { id: 'log-masker', file: 'log-masker.js', exp: 'handleLogMaskerRoutes' },
  { id: 'mermaid-studio', file: 'mermaid-studio.js', exp: 'handleMermaidStudioRoutes' },
  { id: 'json-schema-studio', file: 'json-schema-studio.js', exp: 'handleJsonSchemaStudioRoutes' },
  { id: 'caffeinate', file: 'caffeinate.js', exp: 'handleCaffeinateRoutes' },
  { id: 'email-analyzer', file: 'email-analyzer.js', exp: 'handleEmailAnalyzerRoutes' },
  { id: 'token-counter', file: 'token-counter.js', exp: 'handleTokenCounterRoutes' },
  { id: 'prompt-template-builder', file: 'prompt-template-builder.js', exp: 'handlePromptTemplateBuilderRoutes' },
  { id: 'sql-formatter', file: 'sql-formatter.js', exp: 'handleSQLFormatterRoutes' },
  { id: 'env-var-manager', file: 'env-var-manager.js', exp: 'handleEnvVarManagerRoutes' },
  { id: 'ladder-game', file: 'ladder-game.js', exp: 'handleLadderGameRoutes' },
  { id: 'roulette-wheel', file: 'roulette-wheel.js', exp: 'handleRouletteWheelRoutes' },
  { id: 'svg-optimizer', file: 'svg-optimizer.js', exp: 'handleSVGOptimizerRoutes' },
  { id: 'csp-builder', file: 'csp-builder.js', exp: 'handleCSPBuilderRoutes' },
  { id: 'secret-scanner', file: 'secret-scanner.js', exp: 'handleSecretScannerRoutes' },
  { id: 'dns-reference', file: 'dns-reference.js', exp: 'handleDNSReferenceRoutes' },
  { id: 'port-reference', file: 'port-reference.js', exp: 'handlePortReferenceRoutes' },
  { id: 'http-status-reference', file: 'http-status-reference.js', exp: 'handleHTTPStatusReferenceRoutes' },
  { id: 'bandwidth-calculator', file: 'bandwidth-calculator.js', exp: 'handleBandwidthCalculatorRoutes' },
  { id: 'wireshark-filter', file: 'wireshark-filter.js', exp: 'handleWiresharkFilterRoutes' },
  { id: 'protocol-headers', file: 'protocol-headers.js', exp: 'handleProtocolHeadersRoutes' },
  { id: 'wireguard-config', file: 'wireguard-config.js', exp: 'handleWireguardConfigRoutes' },
  { id: 'marble-roulette', file: 'marble-roulette.js', exp: 'handleMarbleRouletteRoutes' },
  { id: 'token-studio', file: 'token-studio.js', exp: 'handleTokenStudioRoutes' },
  { id: 'encoding-workbench', file: 'encoding-workbench.js', exp: 'handleEncodingWorkbenchRoutes' },
  { id: 'oauth-debugger', file: 'oauth-debugger.js', exp: 'handleOAuthDebuggerRoutes' },
  { id: 'webhook-debugger', file: 'webhook-debugger.js', exp: 'handleWebhookDebuggerRoutes' },
];

const imports = [];
const entries = [];
let missing = 0;

for (const { id, file, exp } of TOOL_HANDLERS) {
  if (!existsSync(join(ROUTES_DIR, file))) {
    console.warn(`WARNING: missing ${file} for tool ${id}`);
    missing++;
    continue;
  }
  const alias = id.replace(/-/g, '_');
  imports.push(`import { ${exp} as ${alias} } from './${file}';`);
  entries.push(`  '${id}': ${alias},`);
}

const output = `/**
 * AUTO-GENERATED by scripts/build-routes.js
 * Do not edit. Re-generate: node scripts/build-routes.js
 */

${imports.join('\n')}

export const handlersById = {
${entries.join('\n')}
};
`;

writeFileSync(OUTPUT, output, 'utf-8');
console.log(`Generated _handlers.js: ${TOOL_HANDLERS.length - missing} handlers (${missing} missing)`);
