import { describe, expect, it } from "vitest";
import {
  PIPE_LOGIC_FUNCTIONS,
  pipeBase64Decode,
  pipeBase64Encode,
  pipeCaseConvert,
  pipeJsonFormat,
  pipeLineSort,
  pipeSanitizeSteps,
  pipeUrlDecode,
  pipeUrlEncode,
} from "./pipe-logic.js";

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POOLS = [
  [0x20, 0x7e],
  [0xa0, 0x24f],
  [0xac00, 0xd7a3],
  [0x1f300, 0x1f64f],
];

function randomText(rand, maxLen = 40) {
  const len = Math.floor(rand() * maxLen);
  let s = "";
  for (let i = 0; i < len; i++) {
    const [lo, hi] = POOLS[Math.floor(rand() * POOLS.length)];
    s += String.fromCodePoint(lo + Math.floor(rand() * (hi - lo + 1)));
    if (rand() < 0.1) s += "\n";
  }
  return s;
}

describe("pipe base64 (oracle: Node Buffer)", () => {
  it("encodes UTF-8 exactly like Buffer and round-trips, seeded", () => {
    const rand = mulberry32(20261106);
    for (let i = 0; i < 500; i++) {
      const s = randomText(rand);
      const expected = Buffer.from(s, "utf8").toString("base64");
      expect(pipeBase64Encode(s)).toBe(expected);
      expect(pipeBase64Decode(expected)).toBe(s);
      const urlSafe = Buffer.from(s, "utf8").toString("base64url");
      expect(pipeBase64Decode(urlSafe)).toBe(s);
    }
  });

  it("decodes a real JWT payload segment that uses URL-safe characters", () => {
    const payload = JSON.stringify({ sub: "a?b>c", name: "ÿÿ~~" });
    const seg = Buffer.from(payload).toString("base64url");
    expect(seg).toMatch(/[-_]/);
    expect(pipeBase64Decode(seg)).toBe(payload);
  });

  it("rejects malformed input and non-UTF-8 bytes with an Error", () => {
    expect(() => pipeBase64Decode("abc$")).toThrow(/Invalid Base64/);
    expect(() => pipeBase64Decode("abcde")).toThrow(/length/);
    expect(() => pipeBase64Decode(Buffer.from([0xff, 0xfe]).toString("base64"))).toThrow(/UTF-8/);
  });
});

describe("pipe URL encoding", () => {
  it("round-trips seeded unicode and matches Node's querystring escaping", async () => {
    const { escape } = await import("node:querystring");
    const rand = mulberry32(7);
    for (let i = 0; i < 300; i++) {
      const s = randomText(rand);
      expect(pipeUrlDecode(pipeUrlEncode(s))).toBe(s);
      expect(pipeUrlEncode(s)).toBe(escape(s));
    }
  });

  it("decodes + as space only when asked, and throws on a bad escape", () => {
    expect(pipeUrlDecode("a+b%20c", true)).toBe("a b c");
    expect(pipeUrlDecode("a+b", false)).toBe("a+b");
    expect(() => pipeUrlDecode("%E0%A4%A")).toThrow(/Invalid URL encoding/);
  });
});

describe("pipe JSON format", () => {
  it("formats and minifies, and throws on invalid JSON", () => {
    expect(pipeJsonFormat(' {"a":[1,2]} ', "format")).toBe('{\n  "a": [\n    1,\n    2\n  ]\n}');
    expect(pipeJsonFormat('{ "a" : 1 }', "minify")).toBe('{"a":1}');
    expect(() => pipeJsonFormat("[Error: x]", "format")).toThrow(/Invalid JSON/);
  });
});

describe("pipe line sort (oracle: independent sort of the line list)", () => {
  it("matches a reference implementation on seeded inputs", () => {
    const rand = mulberry32(42);
    for (let i = 0; i < 300; i++) {
      const lines = Array.from({ length: Math.floor(rand() * 8) + 1 }, () => ["apple", "Banana", "cherry", "", "äpfel", "b"][Math.floor(rand() * 6)]);
      lines.push("zeta");
      const input = lines.join("\n");
      const sorted = [...lines].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      expect(pipeLineSort(input, "sort")).toBe(sorted.join("\n"));
      expect(pipeLineSort(input, "reverse")).toBe([...sorted].reverse().join("\n"));
      expect(pipeLineSort(input, "dedupe")).toBe(lines.filter((l, j) => lines.indexOf(l) === j).join("\n"));
      expect(pipeLineSort(input, "sort-dedupe")).toBe(sorted.filter((l, j) => sorted.indexOf(l) === j).join("\n"));
    }
  });

  it("keeps a trailing newline as a terminator instead of a blank first line", () => {
    expect(pipeLineSort("b\na\n", "sort")).toBe("a\nb\n");
    expect(pipeLineSort("b\r\na\r\n", "sort")).toBe("a\nb\n");
  });
});

describe("pipe case conversion", () => {
  it("keeps non-ASCII letters and existing word boundaries", () => {
    expect(pipeCaseConvert("héllo wörld", "camel")).toBe("hélloWörld");
    expect(pipeCaseConvert("XMLHttpRequest id", "snake")).toBe("xml_http_request_id");
    expect(pipeCaseConvert("élan vital", "title")).toBe("Élan Vital");
    expect(pipeCaseConvert("user id", "constant")).toBe("USER_ID");
  });
});

describe("pipe step sanitizing", () => {
  const contracts = {
    base64: { options: [{ id: "mode", values: ["encode", "decode"], default: "encode" }] },
    "line-sort": { options: [{ id: "mode", values: ["sort", "reverse"], default: "sort" }] },
  };

  it("drops unknown contracts and invalid option values", () => {
    expect(
      pipeSanitizeSteps(
        [{ id: "base64", o: { mode: "decode" } }, { id: "nope" }, { id: "__proto__" }, { id: "line-sort", o: { mode: "<img>" } }, null],
        contracts,
      ),
    ).toEqual([
      { contractId: "base64", options: { mode: "decode" } },
      { contractId: "line-sort", options: { mode: "sort" } },
    ]);
    expect(pipeSanitizeSteps({ id: "base64" }, contracts)).toEqual([]);
    expect(pipeSanitizeSteps([{ contractId: "base64", options: { mode: "encode" } }], contracts)).toEqual([
      { contractId: "base64", options: { mode: "encode" } },
    ]);
  });
});

describe("pipe logic inlining", () => {
  it("every exported function survives toString round-trip as a declaration", () => {
    for (const fn of PIPE_LOGIC_FUNCTIONS) {
      expect(fn.toString()).toMatch(new RegExp("^function " + fn.name + "\\("));
    }
  });
});
