#!/usr/bin/env node
/**
 * Add translated non-tool chrome and isolated tool keys introduced after the
 * original catalogs were generated. English must already define every key.
 * This script is intentionally idempotent and never edits en.js.
 *
 * Run: node scripts/i18n-catalog-additions.mjs
 */
import fs from "node:fs";

const additions = {
  ko: {
    home: {
      trustClient: "브라우저 탭에서 실행",
      trustAccount: "계정 불필요",
      trustCount: "도구 45개",
      trustLangs: "10개 언어",
      flagshipsNav: "대표 도구",
      noResultsHint: "다른 검색어를 입력해 보세요.",
    },
    optionV7: "UUID v7 (Unix 시간, RFC 9562)",
  },
  ja: {
    home: {
      trustClient: "ブラウザ内で実行",
      trustAccount: "アカウント不要",
      trustCount: "45個のツール",
      trustLangs: "10言語",
      flagshipsNav: "主要ツール",
      noResultsHint: "別の検索語をお試しください。",
    },
    optionV7: "UUID v7（Unix時間、RFC 9562）",
  },
  es: {
    home: {
      trustClient: "Funciona en la pestaña",
      trustAccount: "Sin cuenta",
      trustCount: "45 herramientas",
      trustLangs: "10 idiomas",
      flagshipsNav: "Herramientas destacadas",
      noResultsHint: "Prueba con otro término de búsqueda.",
    },
    optionV7: "UUID v7 (hora Unix, RFC 9562)",
  },
  "zh-CN": {
    home: {
      trustClient: "在浏览器标签页中运行",
      trustAccount: "无需账户",
      trustCount: "45 个工具",
      trustLangs: "10 种语言",
      flagshipsNav: "精选工具",
      noResultsHint: "请尝试其他搜索词。",
    },
    optionV7: "UUID v7（Unix 时间，RFC 9562）",
  },
  "zh-TW": {
    home: {
      trustClient: "在瀏覽器分頁中執行",
      trustAccount: "無需帳號",
      trustCount: "45 個工具",
      trustLangs: "10 種語言",
      flagshipsNav: "精選工具",
      noResultsHint: "請嘗試其他搜尋詞。",
    },
    optionV7: "UUID v7（Unix 時間，RFC 9562）",
  },
  fr: {
    home: {
      trustClient: "S’exécute dans l’onglet",
      trustAccount: "Sans compte",
      trustCount: "45 outils",
      trustLangs: "10 langues",
      flagshipsNav: "Outils phares",
      noResultsHint: "Essayez un autre terme de recherche.",
    },
    optionV7: "UUID v7 (heure Unix, RFC 9562)",
  },
  de: {
    home: {
      trustClient: "Läuft im Browser-Tab",
      trustAccount: "Kein Konto",
      trustCount: "45 Tools",
      trustLangs: "10 Sprachen",
      flagshipsNav: "Empfohlene Tools",
      noResultsHint: "Versuche einen anderen Suchbegriff.",
    },
    optionV7: "UUID v7 (Unix-Zeit, RFC 9562)",
  },
  pt: {
    home: {
      trustClient: "Executado na aba",
      trustAccount: "Sem conta",
      trustCount: "45 ferramentas",
      trustLangs: "10 idiomas",
      flagshipsNav: "Ferramentas em destaque",
      noResultsHint: "Tente outro termo de pesquisa.",
    },
    optionV7: "UUID v7 (hora Unix, RFC 9562)",
  },
  vi: {
    home: {
      trustClient: "Chạy trong thẻ trình duyệt",
      trustAccount: "Không cần tài khoản",
      trustCount: "45 công cụ",
      trustLangs: "10 ngôn ngữ",
      flagshipsNav: "Công cụ nổi bật",
      noResultsHint: "Hãy thử một từ khóa tìm kiếm khác.",
    },
    optionV7: "UUID v7 (thời gian Unix, RFC 9562)",
  },
};

const english = (await import("../src/i18n/en.js")).default;
const requiredEnglish = {
  ...Object.fromEntries(
    Object.keys(additions.ko.home).map((key) => [
      `home.${key}`,
      english.home?.[key],
    ]),
  ),
  "tools.uuid-generator.ui.optionV7":
    english.tools?.["uuid-generator"]?.ui?.optionV7,
};
for (const [key, value] of Object.entries(requiredEnglish)) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`English source key is missing: ${key}`);
  }
}

for (const [locale, values] of Object.entries(additions)) {
  const path = `src/i18n/${locale}.js`;
  let source = fs.readFileSync(path, "utf8");
  let changed = 0;

  for (const [key, value] of Object.entries(values.home)) {
    if (new RegExp(`^    ${key}:`, "m").test(source)) continue;
    const anchor = "    favorites:";
    const index = source.indexOf(anchor);
    if (index < 0) throw new Error(`${locale}: home favorites anchor missing`);
    source = `${source.slice(0, index)}    ${key}: ${JSON.stringify(value)},\n${source.slice(index)}`;
    changed++;
  }

  if (!/^        optionV7:/m.test(source)) {
    const anchor = /^        option5:.*$/m;
    const match = source.match(anchor);
    if (!match) throw new Error(`${locale}: UUID option5 anchor missing`);
    const index = match.index + match[0].length;
    source = `${source.slice(0, index)}\n        optionV7: ${JSON.stringify(values.optionV7)},${source.slice(index)}`;
    changed++;
  }

  fs.writeFileSync(path, source);
  console.log(`${locale}: ${changed} key(s) added`);
}
