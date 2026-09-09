/**
 * Material Symbols ligatures for the home catalog.
 * Tool-registry `icon` stays emoji for tool-page headers; the home grid
 * does not. Values are written as icon properties so icon-inventory can
 * scan them.
 */

export const CATEGORY_ICONS = {
  formatters: { icon: "data_object" },
  security: { icon: "encrypted" },
  network: { icon: "lan" },
  generators: { icon: "bolt" },
  game: { icon: "sports_esports" },
  utils: { icon: "handyman" },
};

export const TOOL_SYMBOLS = {
  "json-formatter": { icon: "data_object" },
  "uuid-generator": { icon: "crop_square" },
  "password-generator": { icon: "password" },
  "cidr-calculator": { icon: "lan" },
  "network-reference": { icon: "network_check" },
  "bandwidth-calculator": { icon: "speed" },
  "webhook-debugger": { icon: "webhook" },
  "wireguard-config": { icon: "vpn_key" },
  "wireshark-filter": { icon: "filter_alt" },
  "text-diff": { icon: "difference" },
  "regex-visualizer": { icon: "code" },
  "cron-builder": { icon: "schedule" },
  "ssh-key-generator": { icon: "key" },
  "certificate-decoder": { icon: "description" },
  "token-studio": { icon: "token" },
  "encoding-workbench": { icon: "compress" },
  "saml-decoder": { icon: "badge" },
  "oauth-debugger": { icon: "login" },
  "user-agent-decoder": { icon: "devices" },
  "qr-code": { icon: "qr_code_2" },
  "timestamp-converter": { icon: "event" },
  "color-converter": { icon: "palette" },
  "unit-converter": { icon: "straighten" },
  "yaml-toml-converter": { icon: "swap_horiz" },
  "htpasswd-generator": { icon: "lock" },
  "mock-data-generator": { icon: "dataset" },
  "markdown-editor": { icon: "edit_note" },
  "log-viewer": { icon: "terminal" },
  "case-converter": { icon: "match_case" },
  "code-minifier": { icon: "compress" },
  "image-converter": { icon: "image" },
  "css-gradient": { icon: "gradient" },
  "curl-studio": { icon: "http" },
  "log-masker": { icon: "visibility_off" },
  "mermaid-studio": { icon: "account_tree" },
  "json-schema-studio": { icon: "schema" },
  caffeinate: { icon: "coffee" },
  "email-analyzer": { icon: "email" },
  "token-counter": { icon: "numbers" },
  "prompt-template-builder": { icon: "chat" },
  "repo-ops": { icon: "folder_copy" },
  "sql-formatter": { icon: "database" },
  "env-var-manager": { icon: "settings" },
  "svg-optimizer": { icon: "polyline" },
  "csp-builder": { icon: "security" },
  "secret-scanner": { icon: "find_in_page" },
  pipe: { icon: "conversion_path" },
  "ladder-game": { icon: "stairs" },
  "roulette-wheel": { icon: "casino" },
  "marble-roulette": { icon: "sports_esports" },
};

export function categoryIcon(key) {
  return CATEGORY_ICONS[key]?.icon || "apps";
}

export function toolSymbol(id) {
  return TOOL_SYMBOLS[id]?.icon || "apps";
}
