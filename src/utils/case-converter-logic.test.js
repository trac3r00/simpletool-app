// @vitest-environment node
import { describe, expect, it } from "vitest";
import { convertCase, splitWords } from "./case-converter-logic.js";

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Expected values follow lodash's documented examples for camelCase,
// snakeCase and kebabCase (an independent, widely used reference).
describe("identifier styles", () => {
  it.each([
    ["Foo Bar", "fooBar", "foo_bar", "foo-bar"],
    ["--foo-bar--", "fooBar", "foo_bar", "foo-bar"],
    ["__FOO_BAR__", "fooBar", "foo_bar", "foo-bar"],
    ["fooBar", "fooBar", "foo_bar", "foo-bar"],
    ["XMLHttpRequest", "xmlHttpRequest", "xml_http_request", "xml-http-request"],
    ["user_id", "userId", "user_id", "user-id"],
    ["kebab-case-input", "kebabCaseInput", "kebab_case_input", "kebab-case-input"],
    ["  leading space", "leadingSpace", "leading_space", "leading-space"],
    ["café au lait", "caféAuLait", "café_au_lait", "café-au-lait"],
    ["don't stop", "dontStop", "dont_stop", "dont-stop"],
    ["version2Beta", "version2Beta", "version2_beta", "version2-beta"],
  ])("%j", (input, camel, snake, kebab) => {
    expect(convertCase(input, "camelCase")).toBe(camel);
    expect(convertCase(input, "snakeCase")).toBe(snake);
    expect(convertCase(input, "kebabCase")).toBe(kebab);
  });

  // Words are at least two letters: consecutive one-letter words ("w g" -> "WG")
  // are indistinguishable from an acronym once camel-cased, in any splitter.
  it("round-trips seeded random word lists through every identifier style", () => {
    const rand = mulberry32(7);
    const alphabet = "abcdefghijklmnopqrstuvwxyzéüñ";
    for (let run = 0; run < 300; run++) {
      const words = Array.from({ length: 1 + Math.floor(rand() * 5) }, () =>
        Array.from({ length: 2 + Math.floor(rand() * 5) }, () => alphabet[Math.floor(rand() * alphabet.length)]).join(""),
      );
      const snake = words.join("_");
      for (const style of ["camelCase", "pascalCase", "kebabCase", "constantCase", "dotCase", "snakeCase"]) {
        const converted = convertCase(words.join(" "), style);
        expect(convertCase(converted, "snakeCase"), `${style}: ${converted}`).toBe(snake);
      }
    }
  });
});

describe("prose styles", () => {
  it("title-cases accented and punctuated words", () => {
    expect(convertCase("élan vital (hello) wORLD", "titleCase")).toBe("Élan Vital (Hello) World");
  });

  it("capitalises sentence starts after leading whitespace", () => {
    expect(convertCase("  hello. is IT? yes", "sentenceCase")).toBe("  Hello. Is it? Yes");
  });

  it("alternates by character, not UTF-16 unit", () => {
    expect(convertCase("a😀b", "alternating")).toBe("a😀b");
  });

  it("splits words on unicode letter boundaries", () => {
    expect(splitWords("HTTPServer→naïveCafé")).toEqual(["HTTP", "Server", "naïve", "Café"]);
  });
});
