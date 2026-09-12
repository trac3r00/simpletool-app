import { describe, it, expect } from "vitest";
import { testContract } from "./test-helper.js";
import jsonFormat from "./json-format.js";

testContract(jsonFormat);

describe("json-format transform", () => {
  it("formats compact JSON", () => {
    const input = '{"a":1,"b":2}';
    const result = jsonFormat.transform(input, { mode: "format" });
    expect(result).toContain("\n");
    expect(result).toContain('  "a": 1');
  });

  it("minifies formatted JSON", () => {
    const input = '{\n  "a": 1,\n  "b": 2\n}';
    const result = jsonFormat.transform(input, { mode: "minify" });
    expect(result).toBe('{"a":1,"b":2}');
  });

  it("preserves every numeric and string lexeme while formatting", () => {
    const input =
      '{"max":9007199254740993,"min":-9007199254740993,"huge":1e400,"fixed":1.2300,"negativeZero":-0,"nested":[[9007199254740993],{"text":"quote: \\" slash: \\\\"}]}';

    expect(jsonFormat.transform(input, { mode: "format", indent: 2 })).toBe(
      [
        "{",
        '  "max": 9007199254740993,',
        '  "min": -9007199254740993,',
        '  "huge": 1e400,',
        '  "fixed": 1.2300,',
        '  "negativeZero": -0,',
        '  "nested": [',
        "    [",
        "      9007199254740993",
        "    ],",
        "    {",
        '      "text": "quote: \\" slash: \\\\"',
        "    }",
        "  ]",
        "}",
      ].join("\n"),
    );
  });

  it("preserves every numeric and string lexeme while minifying", () => {
    const input =
      ' { "max" : 9007199254740993, "min" : -9007199254740993, "huge" : 1e400, "fixed" : 1.2300, "negativeZero" : -0, "nested" : [ [ 9007199254740993 ], { "text" : "quote: \\" slash: \\\\" } ] } ';

    expect(jsonFormat.transform(input, { mode: "minify" })).toBe(
      '{"max":9007199254740993,"min":-9007199254740993,"huge":1e400,"fixed":1.2300,"negativeZero":-0,"nested":[[9007199254740993],{"text":"quote: \\" slash: \\\\"}]}',
    );
  });

  it("defaults to format", () => {
    const result = jsonFormat.transform('{"x":1}');
    expect(result).toContain("\n");
  });

  it("returns error message for invalid JSON", () => {
    const result = jsonFormat.transform("not json");
    expect(result).toContain("Error");
  });

  it("returns empty string for null", () => {
    expect(jsonFormat.transform(null)).toBe("");
  });

  it("handles nested objects", () => {
    const input = '{"a":{"b":{"c":1}}}';
    const result = jsonFormat.transform(input);
    expect(result).toContain('      "c": 1');
  });
});
