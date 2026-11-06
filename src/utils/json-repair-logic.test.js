import { afterAll, describe, expect, it } from "vitest";
import { jsonrepair } from "jsonrepair";
import {
  preprocessJSONRepairInput,
  repairJSONInput,
} from "./json-repair-logic.js";

const SEED = 0x5eedc0de;
const CASES_PER_PROPERTY = 200;
const propertyCounts = {
  valid: { attempted: 0, executed: 0, discarded: 0, failing: 0 },
  wrapped: { attempted: 0, executed: 0, discarded: 0, failing: 0 },
  corruptions: { attempted: 0, executed: 0, discarded: 0, failing: 0 },
  noJSON: { attempted: 0, executed: 0, discarded: 0, failing: 0 },
  calibrationNoProseStripper: { attempted: 0, executed: 0, discarded: 0, failing: 0 },
};

function createPRNG(seed) {
  let state = seed >>> 0;
  return function random() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, values) {
  return values[Math.floor(random() * values.length)];
}

function randomString(random) {
  const chunks = [
    "",
    "plain",
    "quote \" slash \\ newline\n tab\t",
    "emoji 😀",
    "한글",
    "日本語",
    "组合字符 e\u0301",
    "\u2028 separator",
  ];
  return pick(random, chunks) + Math.floor(random() * 1000);
}

function randomNumber(random) {
  return pick(random, [
    0,
    -0,
    1,
    -42,
    1.25,
    -0.0003,
    6.022e23,
    1e-7,
    Number.MAX_SAFE_INTEGER,
  ]);
}

function randomValue(random, depth) {
  if (depth <= 0) {
    return pick(random, [
      null,
      random() > 0.5,
      randomNumber(random),
      randomString(random),
    ]);
  }

  const kind = Math.floor(random() * 6);
  if (kind < 4) return randomValue(random, 0);
  if (kind === 4) {
    return Array.from(
      { length: Math.floor(random() * 4) },
      () => randomValue(random, depth - 1),
    );
  }

  const result = {};
  const length = Math.floor(random() * 4);
  for (let index = 0; index < length; index += 1) {
    result[`key${index}`] = randomValue(random, depth - 1);
  }
  return result;
}

function randomDocument(random) {
  return {
    root: randomValue(random, 3),
    items: Array.from(
      { length: Math.floor(random() * 4) },
      () => randomValue(random, 2),
    ),
    enabled: random() > 0.5,
    exponent: 6.022e23,
  };
}

function singleQuoteString(value) {
  return `'${value
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")}'`;
}

function toSingleQuotedJSON(value) {
  if (value === null || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "string") return singleQuoteString(value);
  if (Array.isArray(value)) {
    return `[${value.map(toSingleQuotedJSON).join(",")}]`;
  }
  return `{${Object.entries(value)
    .map(
      ([key, childValue]) =>
        `${singleQuoteString(key)}:${toSingleQuotedJSON(childValue)}`,
    )
    .join(",")}}`;
}

function addTrailingCommas(json) {
  return json.replace(/([}\]])/g, ",$1");
}

function addLineComment(json) {
  return json.replace("{", "{\n// generated comment\n");
}

function unquoteKeys(json) {
  return json.replace(/"([A-Za-z_$][A-Za-z0-9_$]*)":/g, "$1:");
}

const PROSE = [
  "Here is the JSON:",
  "The requested result follows.",
  "Generated output:\n",
  "Sure! Below is the data you asked for.\n\n",
];
const FENCE_LANGS = ["json", "JSON", "jsonc", "js", ""];

// Family (b): same generator for the real pre-pass and the calibration variant.
// Returns the inputs whose repaired value is not deep-equal to the oracle.
function runWrappedProperty(countsName, prepare) {
  const random = createPRNG(SEED ^ 0x11111111);
  const failures = [];
  const counts = propertyCounts[countsName];
  for (let index = 0; index < CASES_PER_PROPERTY; index += 1) {
    const original = JSON.stringify(randomDocument(random));
    const fence = `\`\`\`${pick(random, FENCE_LANGS)}\n${original}\n\`\`\``;
    const input = pick(random, [
      () => `${pick(random, PROSE)}\n${fence}`,
      () => fence,
      () => `${pick(random, PROSE)}\n${original}`,
      () => `${pick(random, PROSE)} ${original}`,
    ])();
    counts.attempted += 1;
    counts.executed += 1;
    const result = repairJSONInput(input, jsonrepair, prepare);
    let equal = false;
    try {
      expect(result.value).toEqual(JSON.parse(original));
      equal = result.ok;
    } catch {
      equal = false;
    }
    if (!equal) {
      counts.failing += 1;
      failures.push(input);
    }
  }
  return failures;
}

function runProperty(name, action) {
  const counts = propertyCounts[name];
  counts.attempted += 1;
  try {
    counts.executed += 1;
    action();
  } catch (error) {
    counts.failing += 1;
    throw error;
  }
}

afterAll(() => {
  console.info(
    `JSON repair property counts seed=${SEED}: ${JSON.stringify(propertyCounts)}`,
  );
});

describe("JSON repair examples", () => {
  it.each([
    ["trailing commas", '{"value": 1,}', { value: 1 }],
    ["single quotes", "{'value': 'text'}", { value: "text" }],
    ["comments", '{"value": 1 // comment\n}', { value: 1 }],
    ["block comments", '{/* note */ "value": 1}', { value: 1 }],
    ["unquoted keys", "{value: 1}", { value: 1 }],
    ["truncated output", '{"value": [1, 2', { value: [1, 2] }],
    [
      "Python True and None",
      "{'enabled': True, 'missing': None}",
      { enabled: true, missing: null },
    ],
  ])("repairs %s", (_name, input, expected) => {
    const result = repairJSONInput(input, jsonrepair);

    expect(result).toMatchObject({ ok: true, value: expected });
    expect(result.fixes).toContain("syntax repaired");
  });

  it("reports only fixes that can be detected", () => {
    const result = repairJSONInput(
      'Here is the JSON:\n```json\n{"value": 1}\n```',
      jsonrepair,
    );

    expect(result).toMatchObject({ ok: true, value: { value: 1 } });
    expect([...result.fixes].sort()).toEqual(["fence removed", "prose removed"]);
  });

  it("does not claim a syntax repair for valid JSON", () => {
    expect(repairJSONInput('{"value": 1}', jsonrepair).fixes).toEqual([]);
  });
});

describe("JSON repair seeded properties", () => {
  it("preserves valid generated JSON values", () => {
    const random = createPRNG(SEED);
    for (let index = 0; index < CASES_PER_PROPERTY; index += 1) {
      runProperty("valid", () => {
        const original = JSON.stringify(randomDocument(random));
        const result = repairJSONInput(original, jsonrepair);

        expect(result.ok).toBe(true);
        expect(result.value).toEqual(JSON.parse(original));
      });
    }
  });

  it("preserves generated values wrapped in fences and prose", () => {
    const failures = runWrappedProperty("wrapped");
    expect(failures).toEqual([]);
  });

  it("repairs generated trailing commas, quotes, comments, and keys", () => {
    const random = createPRNG(SEED ^ 0x22222222);

    for (let index = 0; index < CASES_PER_PROPERTY; index += 1) {
      const value = randomDocument(random);
      const original = JSON.stringify(value);
      const corruptions = [
        addTrailingCommas(original),
        toSingleQuotedJSON(value),
        addLineComment(original),
        unquoteKeys(original),
      ];

      for (const corrupted of corruptions) {
        runProperty("corruptions", () => {
          const result = repairJSONInput(corrupted, jsonrepair);

          expect(result.ok).toBe(true);
          // Oracle is JSON.parse(original): JSON cannot carry -0, so the raw
          // generated value is not a valid oracle.
          expect(result.value).toEqual(JSON.parse(original));
        });
      }
    }
  });

  it("returns documented errors for generated inputs with no JSON", () => {
    const random = createPRNG(SEED ^ 0x33333333);
    const fragments = [
      "Here is some prose",
      "No structured data follows:",
      "```json\nnot json\n```",
      "True None False",
      "",
      "   \n\t",
      "```\n```",
    ];
    const words = ["alpha", "True", "None", "null", "key:", "'quoted'", "//", "]", "}", "42"];

    for (let index = 0; index < CASES_PER_PROPERTY; index += 1) {
      runProperty("noJSON", () => {
        // Never valid JSON and never contains { or [.
        const extra = Array.from({ length: 1 + Math.floor(random() * 4) }, () =>
          pick(random, words),
        ).join(" ");
        const input = pick(random, [
          // "#" keeps a blank fragment + number from becoming the valid JSON scalar "3".
          `${pick(random, fragments)} #${Math.floor(random() * 1000)}`,
          pick(random, fragments),
          `word ${extra}`,
        ]);

        expect(() => repairJSONInput(input, jsonrepair)).not.toThrow();
        expect(repairJSONInput(input, jsonrepair)).toMatchObject({
          ok: false,
          error: expect.stringMatching(/No JSON/),
        });
      });
    }
  });

  it("calibration: the wrapped property fails when the prose stripper is disabled", () => {
    // Deliberately wrong pre-pass: removes fence lines but keeps leading prose.
    // jsonrepair then turns "Here is the JSON:\n{...}" into ["Here is the JSON:", {...}].
    const fenceOnlyPrepare = (input) => ({
      text: String(input).replace(/^```.*$/gm, "").trim(),
      fixes: [],
    });
    const failures = runWrappedProperty(
      "calibrationNoProseStripper",
      fenceOnlyPrepare,
    );
    expect(failures.length).toBeGreaterThan(0);
  });

  it("pre-pass leaves bare JSON untouched", () => {
    expect(preprocessJSONRepairInput(' [1, 2] ')).toEqual({
      text: "[1, 2]",
      fixes: [],
    });
  });
});
