// Test-only fixtures shared by the lossless JSON utility and contract suites.
// Expected outputs are hand-written literals, never produced by the formatter.

export const LOSSLESS_INPUT =
  '{"max":9007199254740993,"min":-9007199254740993,"huge":1e400,"fixed":1.2300,"negativeZero":-0,"nested":[[9007199254740993],{"text":"quote: \\" slash: \\\\"}]}';

export const LOSSLESS_SPACED =
  ' { "max" : 9007199254740993, "min" : -9007199254740993, "huge" : 1e400, "fixed" : 1.2300, "negativeZero" : -0, "nested" : [ [ 9007199254740993 ], { "text" : "quote: \\" slash: \\\\" } ] } ';

export const LOSSLESS_PRETTY = [
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
