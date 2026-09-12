import { describe, expect, it } from "vitest";
import { formatJsonLosslessly } from "./lossless-json.js";

const LOSSLESS_INPUT =
  '{"max":9007199254740993,"min":-9007199254740993,"huge":1e400,"fixed":1.2300,"negativeZero":-0,"nested":[[9007199254740993],{"text":"quote: \\" slash: \\\\"}]}';

const LOSSLESS_PRETTY = [
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
].join("\n");

describe("formatJsonLosslessly", () => {
  it("preserves numeric and escaped-string lexemes while formatting", () => {
    expect(formatJsonLosslessly(LOSSLESS_INPUT, 2)).toBe(LOSSLESS_PRETTY);
  });

  it("preserves numeric and escaped-string lexemes while minifying", () => {
    const spaced =
      ' { "max" : 9007199254740993, "min" : -9007199254740993, "huge" : 1e400, "fixed" : 1.2300, "negativeZero" : -0, "nested" : [ [ 9007199254740993 ], { "text" : "quote: \\" slash: \\\\" } ] } ';
    expect(formatJsonLosslessly(spaced, 0)).toBe(LOSSLESS_INPUT);
  });

  it("formats ordinary nested JSON with the requested indentation", () => {
    expect(formatJsonLosslessly('{"a":1,"b":[true,false]}', 4)).toBe(
      [
        "{",
        '    "a": 1,',
        '    "b": [',
        "        true,",
        "        false",
        "    ]",
        "}",
      ].join("\n"),
    );
  });

  it("matches JSON.stringify indentation options for empty and nested values", () => {
    expect(formatJsonLosslessly('{"empty":{},"items":[]}', "\t")).toBe(
      ['{', '\t"empty": {},', '\t"items": []', '}'].join("\n"),
    );
    expect(formatJsonLosslessly('{"a":1}', null)).toBe('{"a":1}');
  });

  it("rejects malformed JSON with the native parse error", () => {
    expect(() => formatJsonLosslessly('{"a":}', 2)).toThrow(SyntaxError);
  });
});
