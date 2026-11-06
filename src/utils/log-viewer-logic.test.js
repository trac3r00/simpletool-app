import { describe, expect, it } from "vitest";
import {
  buildSearchRegex,
  detectLevel,
  parseLine,
  splitLines,
} from "./log-viewer-logic.js";

describe("log-viewer-logic", () => {
  it.each([
    ["2026-11-06 12:00:01 INFO no errors found during check", "INFO"],
    ["2026-11-06 12:00:02 DEBUG cache warm", "DEBUG"],
    ["12:00:03 WARN slow query 1200ms", "WARN"],
    ["12:00:03 [warning] disk 91%", "WARN"],
    ['{"ts":"2026-11-06T12:00:04Z","level":"error","msg":"boom"}', "ERROR"],
    ["[ERROR] disk full", "ERROR"],
    ["E FATAL: out of memory", "ERROR"],
    ["level=trace span=abc", "DEBUG"],
    ["Information: user Bob logged in", "OTHER"],
    ["Retrying after 3 ERRORS_TOTAL", "OTHER"],
    ["plain line ✓ 한글", "OTHER"],
    ["", "OTHER"],
  ])("labels %j as %s", (line, level) => {
    expect(detectLevel(line)).toBe(level);
  });

  it("extracts the time of day", () => {
    expect(parseLine("2026-11-06 12:00:00.123 INFO up", 0)).toEqual({
      id: 1,
      raw: "2026-11-06 12:00:00.123 INFO up",
      level: "INFO",
      timestamp: "12:00:00.123",
    });
    expect(parseLine("no time here", 4).timestamp).toBe("");
  });

  it("does not count a trailing newline as a line", () => {
    expect(splitLines("")).toEqual([]);
    expect(splitLines("a\r\nb\n")).toEqual(["a", "b"]);
    expect(splitLines("a\n\nb")).toEqual(["a", "", "b"]);
  });

  it("escapes plain queries and reports bad regexes", () => {
    const plain = buildSearchRegex("a.b(", false, 200);
    expect(plain.error).toBeNull();
    expect("xa.b(y".match(plain.regex)[0]).toBe("a.b(");
    expect("aXb(".match(plain.regex)).toBeNull();
    expect(buildSearchRegex("(unclosed", true, 200).error).toMatch(/^Invalid regex/);
    expect(buildSearchRegex("a".repeat(201), true, 200).error).toMatch(/longer than 200/);
    expect(buildSearchRegex("", true, 200)).toEqual({ regex: null, error: null });
  });
});
