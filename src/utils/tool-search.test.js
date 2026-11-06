import { describe, it, expect } from "vitest";
import { filterTools } from "./tool-search.js";
import { TOOLS } from "./tool-registry.js";

describe("filterTools", () => {
  it("returns all tools when query is empty", () => {
    expect(filterTools(TOOLS, "").length).toBe(TOOLS.length);
  });

  it("returns all tools when query is whitespace only", () => {
    expect(filterTools(TOOLS, "   ").length).toBe(TOOLS.length);
  });

  it("'json' matches json-formatter", () => {
    const results = filterTools(TOOLS, "json");
    expect(results.some((t) => t.id === "json-formatter")).toBe(true);
  });

  it("'json' does NOT match ladder-game", () => {
    const results = filterTools(TOOLS, "json");
    expect(results.some((t) => t.id === "ladder-game")).toBe(false);
  });

  it("'json' does NOT match token-studio", () => {
    const results = filterTools(TOOLS, "json");
    expect(results.some((t) => t.id === "token-studio")).toBe(false);
  });

  it("'json' does NOT match caffeniate", () => {
    const results = filterTools(TOOLS, "json");
    expect(results.some((t) => t.id === "caffeniate")).toBe(false);
  });

  it("'json' does NOT match bandwidth-calculator", () => {
    const results = filterTools(TOOLS, "json");
    expect(results.some((t) => t.id === "bandwidth-calculator")).toBe(false);
  });

  it("'json' does NOT match markdown-editor", () => {
    const results = filterTools(TOOLS, "json");
    expect(results.some((t) => t.id === "markdown-editor")).toBe(false);
  });

  it("'regex' matches regex-visualizer", () => {
    const results = filterTools(TOOLS, "regex");
    expect(results.some((t) => t.id === "regex-visualizer")).toBe(true);
  });

  it("nonsense query 'xyzzy12345' returns empty array", () => {
    const results = filterTools(TOOLS, "xyzzy12345");
    expect(results.length).toBe(0);
  });

  it("special chars query '.*' does not crash", () => {
    expect(() => filterTools(TOOLS, ".*")).not.toThrow();
    const results = filterTools(TOOLS, ".*");
    expect(Array.isArray(results)).toBe(true);
  });

  it("case-insensitive: 'JSON' returns same results as 'json'", () => {
    const lower = filterTools(TOOLS, "json");
    const upper = filterTools(TOOLS, "JSON");
    expect(upper.length).toBe(lower.length);
    expect(upper.some((t) => t.id === "json-formatter")).toBe(true);
  });
});

describe("multi-word and typo-tolerant search", () => {
  const ids = (q) => filterTools(TOOLS, q).map((t) => t.id);

  it.each([
    ["json repair", "json-formatter"],
    ["decode jwt", "token-studio"],
    ["nginx basic auth", "htpasswd-generator"],
    ["pasword", "password-generator"],
    ["sertificate", "certificate-decoder"],
  ])("%s finds %s", (q, id) => {
    expect(ids(q)).toContain(id);
  });

  it("keeps short words exact so 'jsno' finds nothing", () => {
    expect(ids("jsno")).toEqual([]);
  });

  it("requires every word: 'json wireguard' matches no single tool", () => {
    expect(ids("json wireguard")).toEqual([]);
  });

  it("finds each tool from any 5+ letter name word with one character deleted (seeded)", () => {
    let seed = 0x5eed;
    const rand = (n) => ((seed = (seed * 1103515245 + 12345) >>> 0) % n);
    let executed = 0;
    for (const tool of TOOLS) {
      for (const word of tool.name.toLowerCase().split(/[^a-z0-9]+/)) {
        if (word.length < 6) continue;
        const cut = rand(word.length);
        const typo = word.slice(0, cut) + word.slice(cut + 1);
        expect(ids(typo), `${typo} -> ${tool.id}`).toContain(tool.id);
        executed++;
      }
    }
    expect(executed).toBeGreaterThan(40);
  });
});
