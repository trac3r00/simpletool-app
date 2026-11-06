import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import {
  checkMcpTools,
  checkSchema,
  describeJsonError,
  detectDialect,
  estimateTokens,
  generateSchema,
  validateDocument,
} from "./json-schema-studio-logic.js";

// The exact bundle the page loads (@cfworker/json-schema 4.1.6, IIFE global).
const bundle = readFileSync(new URL("../../dist/vendor/json-schema-validator.min.js", import.meta.url), "utf8");
const { Validator } = runInNewContext(bundle + ";CfJsonSchema", { URL });

// Minimal validator for the keywords the generator emits. Python's jsonschema
// (Draft202012Validator with check_schema) accepted 402 generated schemas and
// validated each sample against its schema when this module was written; this
// keeps that property under test without a network dependency.
function validates(schema, value) {
  if (schema.anyOf) return schema.anyOf.some((s) => validates(s, value));
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actual = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
    const ok = types.some((t) =>
      t === "integer" ? Number.isInteger(value) : t === "number" ? typeof value === "number" : t === actual,
    );
    if (!ok) return false;
  }
  if (Array.isArray(value) && schema.items) return value.every((v) => validates(schema.items, v));
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if ((schema.required || []).some((k) => !(k in value))) return false;
    for (const [k, v] of Object.entries(value)) {
      if (schema.properties && schema.properties[k]) {
        if (!validates(schema.properties[k], v)) return false;
      } else if (schema.additionalProperties === false) {
        return false;
      }
    }
  }
  return true;
}

describe("json schema generator", () => {
  it("emits 2020-12 keywords, not draft-03 required: true", () => {
    const schema = generateSchema({ id: 1, name: "a" });
    expect(schema).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      title: "Generated Schema",
      type: "object",
      properties: { id: { type: "integer" }, name: { type: "string" } },
      required: ["id", "name"],
    });
    expect(JSON.stringify(schema)).not.toContain('"required":true');
  });

  it("merges array items instead of dropping object properties", () => {
    expect(generateSchema([{ a: 1 }, { a: 2.5, b: "x" }]).items).toEqual({
      type: "object",
      properties: { a: { type: "number" }, b: { type: "string" } },
      required: ["a"],
    });
    expect(generateSchema([1, "two", null]).items).toEqual({ type: ["integer", "string", "null"] });
    expect(generateSchema([1, { a: 1 }]).items.anyOf).toHaveLength(2);
  });

  it("detects common string formats only when asked", () => {
    const value = { when: "2026-11-06T10:00:00Z", day: "2026-11-06", mail: "a@b.co", id: "123e4567-e89b-12d3-a456-426614174000", url: "https://x.test/a" };
    const props = generateSchema(value).properties;
    expect(Object.values(props).map((p) => p.format)).toEqual(["date-time", "date", "email", "uuid", "uri"]);
    expect(generateSchema(value, { formats: false }).properties.when).toEqual({ type: "string" });
  });

  it("can close objects and skip required", () => {
    const schema = generateSchema({ a: { b: 1 } }, { closed: true, required: false });
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.a.additionalProperties).toBe(false);
    expect(schema.required).toBeUndefined();
  });

  it("accepts the sample it was generated from (seeded)", () => {
    let seed = 99;
    const rnd = (n) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % n;
    };
    const gen = (d) => {
      const r = rnd(d > 3 ? 5 : 8);
      if (r === 0) return null;
      if (r === 1) return rnd(2) === 0;
      if (r === 2) return rnd(1000) - 500;
      if (r === 3) return rnd(1000) / 7;
      if (r === 4) return ["x", "2026-11-06", "a@b.co", "😀"][rnd(4)];
      if (r <= 6) return Array.from({ length: rnd(4) }, () => gen(d + 1));
      const o = {};
      for (let i = 0; i < rnd(4); i++) o["k" + rnd(5)] = gen(d + 1);
      return o;
    };
    for (let k = 0; k < 400; k++) {
      const value = gen(0);
      expect(validates(generateSchema(value), value), JSON.stringify(value)).toBe(true);
      expect(validates(generateSchema(value, { closed: true }), value), JSON.stringify(value)).toBe(true);
    }
  });

  it("reports JSON errors with line and column", () => {
    const text = '{\n  "a": 1,\n  oops\n}';
    let error;
    try {
      JSON.parse(text);
    } catch (e) {
      error = e;
    }
    expect(describeJsonError(text, error)).toMatch(/line 3, column 3\)$/);
  });
});

// ---- Validate mode, against Python jsonschema 4.26.0 ------------------------
// Expected values were produced at authoring time by python3 -I with
// jsonschema.validators.Draft202012Validator / Draft201909Validator /
// Draft7Validator: iter_errors(doc), each error as JSON-Pointer(absolute_path) +
// "|" + validator ("false" for a false schema), de-duplicated and sorted.
// format is left out: Python does not assert it by default, cfworker does.

const sig = (errors) => [...new Set(errors.map((e) => e.path + "|" + e.keyword))].sort();

// [dialect, schema, document, Python's errors]
const HAND = [
  ["2020-12", {"type":"object","required":["id","name"],"properties":{"id":{"type":"integer","minimum":1},"name":{"type":"string","minLength":1},"tags":{"type":"array","items":{"type":"string"},"uniqueItems":true}},"additionalProperties":false}, {"id":0,"name":"","tags":["a","a"],"extra":1}, ["/id|minimum","/name|minLength","/tags|uniqueItems","|additionalProperties"]],
  ["2020-12", {"type":"object","properties":{"id":{"type":"integer"}}}, {"id":5}, []],
  ["2020-12", {"prefixItems":[{"type":"string"},{"type":"integer"}],"items":false}, ["a",1,true], ["|items"]],
  ["2020-12", {"$defs":{"pos":{"type":"number","exclusiveMinimum":0}},"type":"array","items":{"$ref":"#/$defs/pos"}}, [1,0,-1], ["/1|exclusiveMinimum","/2|exclusiveMinimum"]],
  ["2020-12", {"if":{"properties":{"kind":{"const":"a"}}},"then":{"required":["x"]},"else":{"required":["y"]}}, {"kind":"a"}, ["|required"]],
  ["2020-12", {"if":{"properties":{"kind":{"const":"a"}}},"then":{"required":["x"]},"else":{"required":["y"]}}, {"kind":"b"}, ["|required"]],
  ["2020-12", {"properties":{"a":{}},"unevaluatedProperties":false}, {"a":1,"b":2}, ["|unevaluatedProperties"]],
  ["2020-12", {"oneOf":[{"type":"number"},{"type":"integer"}]}, 3, ["|oneOf"]],
  ["2020-12", {"dependentRequired":{"card":["cvc"]}}, {"card":"4111"}, ["|dependentRequired"]],
  ["2020-12", false, {}, ["|false"]],
  ["2020-12", true, {}, []],
  ["2020-12", {"contains":{"type":"string"},"minContains":2}, ["a",1], ["|minContains"]],
  ["2020-12", {"propertyNames":{"pattern":"^[a-z]+$"}}, {"ok":1,"Bad":2}, ["|pattern"]],
  ["2019-09", {"items":[{"type":"string"}],"additionalItems":false}, ["a",2], ["|additionalItems"]],
  ["2019-09", {"$defs":{"n":{"type":"null"}},"properties":{"v":{"$ref":"#/$defs/n"}}}, {"v":0}, ["/v|type"]],
  ["2019-09", {"dependentSchemas":{"a":{"required":["b"]}}}, {"a":1}, ["|required"]],
  ["7", {"definitions":{"s":{"type":"string"}},"properties":{"a":{"$ref":"#/definitions/s"}}}, {"a":1}, ["/a|type"]],
  ["7", {"items":[{"type":"integer"}],"additionalItems":{"type":"string"}}, [1,2], ["/1|type"]],
  ["7", {"dependencies":{"a":["b"],"c":{"required":["d"]}}}, {"a":1,"c":1}, ["|dependencies","|required"]],
  ["7", {"type":"object","properties":{"n":{"type":"number","maximum":10,"multipleOf":3}}}, {"n":11}, ["/n|maximum","/n|multipleOf"]],
  ["7", {"patternProperties":{"^x-":{"type":"string"}},"additionalProperties":false}, {"x-a":1,"y":2}, ["/x-a|type","|additionalProperties"]],
];

// Seeded generator: schemas over the common keywords, documents drawn from the
// schema then perturbed so nested applicators fail too.
function makeCases(seed, count) {
  const rnd = (n) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return Math.floor(seed / 65536) % n;
  };
  const pick = (a) => a[rnd(a.length)];
  const scalar = () => pick([null, true, false, 0, 3, -2, 7, 2.5, "", "ab", "hello", "x1"]);
  const value = (d) => {
    const r = rnd(d > 2 ? 6 : 9);
    if (r < 5) return scalar();
    if (r < 7) return Array.from({ length: rnd(4) }, () => value(d + 1));
    const o = {};
    for (let i = 0; i < rnd(4); i++) o[pick(["a", "b", "c", "d e"])] = value(d + 1);
    return o;
  };
  const schema = (d) => {
    const s = {};
    const n = 1 + rnd(3);
    for (let i = 0; i < n; i++) {
      const k = rnd(d > 2 ? 9 : 16);
      if (k === 0) s.type = pick(["string", "integer", "number", "object", "array", "null", "boolean"]);
      else if (k === 1) s.type = [pick(["string", "integer"]), pick(["null", "array", "object"])];
      else if (k === 2) s.minimum = rnd(6) - 1;
      else if (k === 3) s.maxLength = rnd(4);
      else if (k === 4) s.enum = [scalar(), scalar(), scalar()];
      else if (k === 5) s.const = scalar();
      else if (k === 6) s.minItems = rnd(3);
      else if (k === 7) s.uniqueItems = true;
      else if (k === 8) s.required = [pick(["a", "b", "c"])];
      else if (k === 9) s.properties = { a: schema(d + 1), "d e": schema(d + 1) };
      else if (k === 10) s.additionalProperties = rnd(2) ? false : schema(d + 1);
      else if (k === 11) s.items = schema(d + 1);
      else if (k === 12) s.anyOf = [schema(d + 1), schema(d + 1)];
      else if (k === 13) s.allOf = [schema(d + 1), schema(d + 1)];
      else if (k === 14) s.not = schema(d + 1);
      else s.oneOf = [schema(d + 1), schema(d + 1)];
    }
    return s;
  };
  // A document shaped by the schema, then perturbed, so nested keywords get
  // exercised instead of failing at the root every time.
  const fromSchema = (s, d) => {
    if (d > 3 || rnd(5) === 0) return value(d);
    if (s.enum && rnd(2)) return pick(s.enum);
    if ("const" in s && rnd(2)) return s.const;
    const branch = s.anyOf || s.oneOf || s.allOf;
    if (branch && rnd(2)) return fromSchema(pick(branch), d + 1);
    const t = Array.isArray(s.type) ? pick(s.type) : s.type;
    if (s.properties || t === "object") {
      const o = {};
      const props = s.properties || {};
      Object.keys(props).forEach((k) => { if (rnd(4)) o[k] = fromSchema(props[k], d + 1); });
      if (rnd(3) === 0) o[pick(["b", "c", "z"])] = value(d + 1);
      return o;
    }
    if (s.items || t === "array") return Array.from({ length: rnd(4) }, () => (s.items ? fromSchema(s.items, d + 1) : value(d + 1)));
    if (t === "string") return pick(["", "ab", "hello"]);
    if (t === "integer") return pick([0, 3, -2]);
    if (t === "number") return pick([2.5, 7]);
    if (t === "boolean") return rnd(2) === 0;
    if (t === "null") return null;
    return value(d);
  };
  const out = [];
  for (let i = 0; i < count; i++) {
    const s = schema(0);
    out.push([s, fromSchema(s, 0)]);
  }
  return out;
}

// Python's result for makeCases(20261106, 400): cases split by ";", errors by ",".
// Identical under 2020-12, 2019-09 and draft-07 (no dialect-specific keywords).
const ORACLE = "|minimum;/0|enum,/0|oneOf,/0|type;;|oneOf;|type;;/0|enum,/0|type,/1|enum,/1|type,/2|enum,/2|type;;|const,|minItems,|oneOf,|type;;;;|oneOf;/d e|enum,/d e|not,|anyOf,|type;|maxLength;;;|oneOf;;|const;;;|enum,|oneOf;|minimum;;|enum;;;|not;;;;|not;|type;|enum;;|not,|oneOf;;|const,|enum,|type;;|type;;|anyOf;/0|const,/1|const;/d e|oneOf;;/0|type,/1|maxLength,/2|type,|type;|const,|type;;;|const,|enum,|type;;|type;;/a|type;;;|anyOf;/a/d e|const,/a/d e|enum,/d e|enum,/d e|oneOf,|required;;|anyOf,|enum;/0/0|enum,/0/1|enum,/0/1|type,/0/2|enum,/0/2|type,/0|const,/1/0|enum,/1/0|type,/1/1|enum,/1|const,|type;;|not;;;;|oneOf;;;|not;;|oneOf;|enum,|type;;;/a|minimum;|anyOf;|minimum;|const;;|not;;;|anyOf,|not;|required;;|anyOf,|const;;;|enum,|not;|anyOf,|type;|type;;;/0/0|additionalProperties,/0/0|required;|const,|type;|oneOf;|anyOf;;;|const;|oneOf;;;|type;/a|const,|type;|enum,|minimum;|const,|maxLength,|type;|not;;;;/a|oneOf,|enum;|type;;|const,|oneOf;|maxLength;|required,|type;;;;;;|additionalProperties;|not;;|const;;|type;/0|type,/1|type;;|anyOf,|enum;|enum;;;;;|enum;;|enum;;|const;|oneOf,|type;|oneOf;;;;;;|const,|oneOf;;|oneOf;|maxLength,|oneOf;;;|const;;;|anyOf,|enum;;|enum;;;|enum,|type;|const;|const;;|const,|required;/a/0|additionalProperties,/a/0|const,/a/1|additionalProperties,/a/1|const,/d e|const,|anyOf;/0|additionalProperties;|enum;;|type;|enum;|oneOf;;|type;;/a|enum;;;;|const,|oneOf,|type;/0/d e|anyOf,/0|required;/d e|anyOf,|required;|enum;;;|const;|const;|anyOf;|additionalProperties;|type;;|const,|enum,|not,|type;|const,|oneOf;|enum;;|not;/0|const,|const;;/0|not,/1|not,/1|type,|type;;;;|const;;;/a|oneOf;|minimum;/a|maxLength,/a|oneOf,/a|type,|const,|not;;;;/a/0|const,/a/0|type,/a|enum;;/0|type,/1|type,/2|enum;|const,|enum,|maxLength,|type;|const,|minItems;;|const;;;|type;/b|enum;|const;|required,|type;|anyOf,|const;|enum;|enum,|type;;;;;/0|not,|type;|const;;|const,|oneOf,|type;/0|not,/1|not;;;;;;|anyOf;;;/d e|enum;/d e|const,/d e|type,|const;;;|type;|oneOf;|enum;;;;;;;;;;;|not,|type;|enum;|required;|const;|not;;/a|const,/d e/d e|const,/d e/d e|enum,/d e|type;;|anyOf,|type;|anyOf,|type;/0/a|maxLength,/2/d e/0|type,/2/d e|type;|enum;;|required,|type;;|enum;;|anyOf;|enum,|type;;|enum,|not;|anyOf;;;;|maxLength;|const,|not,|type;|enum;;|const;;;;;|oneOf,|required;/d e|enum,|oneOf,|type;|const;|enum;|const;;/d e|anyOf;;/d e/d e|type,/d e|enum;;;;/0|type,|not;;;;/0|enum,/1|enum,/2|enum;;;|not;;;/0/a|type,/0/d e/d e|enum,/0/d e|type,/1/b|type;|enum;|type;/0|oneOf;/1|enum,/2|enum,|not;;;;;;;;|oneOf;;;;/0|oneOf;;;/a|enum,/d e|const,|const,|enum;/c|const;|maxLength;;;;;;;;|enum,|type;|const;|const;;;|maxLength;;;;|oneOf;|oneOf,|required;|type;|const;/a/a|const,/a/a|enum,/a/a|type,/a/d e|anyOf,/a/d e|enum;;|enum;;|oneOf;/0|oneOf,/1|type,/2|oneOf,/2|type;|const,|enum;;|enum,|oneOf;|const;;|const,|enum;;;;|const;|oneOf;;;|type;/a|const,|type;|enum,|minimum;|const,|maxLength,|type;|not;;;;/a|oneOf,|enum;|type;;|const,|oneOf;|maxLength;|required,|type;;;;";
const oracleCases = () => ORACLE.split(";").map((s) => (s ? s.split(",") : []));

describe("validate mode", () => {
  it("matches Python jsonschema on hand-written fixtures in each dialect", () => {
    for (const [dialect, schema, doc, expected] of HAND) {
      const r = validateDocument(Validator, schema, doc, dialect);
      expect(r.schemaErrors, JSON.stringify(schema)).toEqual([]);
      expect(r.valid).toBe(expected.length === 0);
      expect(sig(r.errors), JSON.stringify([schema, doc])).toEqual(expected);
    }
  });

  it("matches Python jsonschema on 400 seeded cases in all three dialects", () => {
    const cases = makeCases(20261106, 400);
    const expected = oracleCases();
    expect(expected).toHaveLength(400);
    expect(expected.filter((e) => e.length).length).toBeGreaterThan(150);
    for (const dialect of ["2020-12", "2019-09", "7"]) {
      cases.forEach(([schema, doc], i) => {
        const r = validateDocument(Validator, schema, doc, dialect);
        expect(r.valid).toBe(expected[i].length === 0);
        expect(sig(r.errors), dialect + " " + JSON.stringify([schema, doc])).toEqual(expected[i]);
      });
    }
  });

  it("calibration: the unreduced cfworker error list disagrees with the oracle", () => {
    const cases = makeCases(20261106, 400);
    const expected = oracleCases();
    const raw = (schema, doc) =>
      new Validator(schema, "2020-12", false).validate(doc).errors.map((e) => ({
        path: decodeURIComponent(e.instanceLocation.slice(1)),
        keyword: e.keyword,
      }));
    const wrong = cases.filter(([s, d], i) => JSON.stringify(sig(raw(s, d))) !== JSON.stringify(expected[i]));
    expect(wrong.length).toBeGreaterThan(50);
  });

  it("decodes instance paths to JSON Pointers", () => {
    const r = validateDocument(Validator, { properties: { "a b/c~%": { type: "string" } } }, { "a b/c~%": 1 }, "2020-12");
    expect(r.errors).toEqual([
      expect.objectContaining({ path: "/a b~1c~0%", keyword: "type", schemaPath: "/properties/a b~1c~0%/type" }),
    ]);
  });

  it("picks the dialect from $schema when set to auto", () => {
    expect(detectDialect({ $schema: "http://json-schema.org/draft-07/schema#" }, "auto").dialect).toBe("7");
    expect(detectDialect({ $schema: "https://json-schema.org/draft/2019-09/schema" }, "auto").dialect).toBe("2019-09");
    expect(detectDialect({}, "auto")).toEqual({ dialect: "2020-12", note: "No $schema; validating as draft 2020-12." });
    expect(detectDialect({ $schema: "http://json-schema.org/draft-04/schema#" }, "auto").note).toMatch(/^Unsupported/);
    expect(detectDialect({ $schema: "http://json-schema.org/draft-07/schema#" }, "2020-12").dialect).toBe("2020-12");
    // draft-07 tuple items behave differently from 2020-12
    const tuple = { items: [{ type: "string" }], additionalItems: false };
    expect(validateDocument(Validator, tuple, ["a", 1], "7").valid).toBe(false);
    expect(validateDocument(Validator, tuple, ["a", 1], "2020-12").schemaErrors[0].path).toBe("/items");
  });

  it("reports a schema that cannot be compiled instead of throwing", () => {
    const r = validateDocument(Validator, { $ref: "#/nope" }, 1, "2020-12");
    expect(r.valid).toBe(false);
    expect(r.schemaErrors[0].message).toMatch(/^The schema could not be compiled: Unresolved \$ref/);
  });
});

// Python: Vn(Vn.META_SCHEMA, format_checker=Vn.FORMAT_CHECKER).iter_errors(schema)
// is empty ("1") or not ("0"), per dialect, for each schema below.
const SCHEMAS = [{"type":"object","properties":{"a":{"type":"string"}},"required":["a"]},{"type":"bogus"},{"type":["string","string"]},{"type":["string","null"]},{"properties":{"a":{"type":7}}},{"properties":[]},{"required":"a"},{"required":["a","a"]},{"required":[1]},{"minLength":-1},{"minLength":1.5},{"maxItems":"3"},{"minimum":"0"},{"multipleOf":0},{"multipleOf":0.5},{"pattern":"[a-"},{"pattern":"^[a-z]+$"},{"patternProperties":{"(":{}}},{"enum":"a"},{"enum":[1,"a",null]},{"anyOf":[]},{"allOf":{}},{"oneOf":[{"type":"string"},5]},{"items":[{"type":"string"}]},{"items":{"type":"string"}},{"prefixItems":[{"type":"string"}],"items":false},{"uniqueItems":"yes"},{"additionalProperties":"no"},{"additionalProperties":false},{"not":5},{"$ref":5},{"$defs":{"a":{"type":"nope"}}},{"dependentRequired":{"a":"b"}},{"dependentRequired":{"a":["b"]}},{"format":5},{"title":1},true,false,5,[],{"if":{"type":"string"},"then":{"minLength":"x"}},{"exclusiveMinimum":true},{"dependencies":{"a":["b"],"c":{"type":"zz"}}},{"definitions":{"x":{"required":"q"}}}];
const META = {"7":"10010000000000101001000111001001110011000000","2020-12":"10010000000000101001000011001000010011000000","2019-09":"10010000000000101001000111001000010011000000"};

describe("schema check", () => {
  it("agrees with Python's meta-schema validation on valid and invalid schemas", () => {
    for (const dialect of ["2020-12", "2019-09", "7"]) {
      SCHEMAS.forEach((schema, i) => {
        const ok = checkSchema(schema, dialect).length === 0 ? "1" : "0";
        expect(ok, dialect + " " + JSON.stringify(schema)).toBe(META[dialect][i]);
      });
    }
  });

  it("points at the offending keyword", () => {
    expect(checkSchema({ properties: { a: { type: "strng" } } }, "2020-12")).toEqual([
      { path: "/properties/a/type", message: 'Unknown type "strng".' },
    ]);
  });
});

describe("MCP tools/list check (spec 2025-11-25)", () => {
  // The example tool from the spec's tools page.
  const weather = {
    name: "get_weather",
    title: "Weather Information Provider",
    description: "Get current weather information for a location",
    inputSchema: {
      type: "object",
      properties: { location: { type: "string", description: "City name or zip code" } },
      required: ["location"],
    },
  };

  it("accepts the spec example as a JSON-RPC response, a result, or a bare array", () => {
    for (const input of [{ jsonrpc: "2.0", id: 1, result: { tools: [weather] } }, { tools: [weather] }, [weather]]) {
      const r = checkMcpTools(input, Validator);
      expect(r.error).toBeUndefined();
      expect(r.errorCount).toBe(0);
      expect(r.warningCount).toBe(0);
      expect(r.tools[0].name).toBe("get_weather");
    }
  });

  it("estimates tokens as description plus serialised inputSchema over 4", () => {
    const chars = weather.description.length + JSON.stringify(weather.inputSchema).length;
    expect(checkMcpTools([weather], Validator).tokenEstimate).toBe(Math.ceil(chars / 4));
    expect(estimateTokens("abcde", undefined)).toBe(2);
  });

  it("flags spec shape errors", () => {
    const r = checkMcpTools(
      [
        { description: "no name" },
        { name: "a", inputSchema: { type: "array" } },
        { name: "b", inputSchema: { type: "object", properties: { q: { type: "bogus" } } } },
        { name: "c", description: 5, inputSchema: { type: "object" }, annotations: { readOnlyHint: "yes" } },
        "tool",
      ],
      Validator,
    );
    const paths = r.tools.map((t) => t.errors.map((e) => e.path));
    expect(paths).toEqual([
      ["name", "inputSchema"],
      ["inputSchema.type"],
      ["inputSchema/properties/q/type"],
      ["description", "annotations.readOnlyHint"],
      [""],
    ]);
    expect(r.errorCount).toBe(7);
  });

  it("warns on SHOULD rules: name charset, duplicates, missing description", () => {
    const r = checkMcpTools(
      [
        { name: "has space", description: "Reads things", inputSchema: { type: "object" } },
        { name: "x".repeat(129), description: "Reads", inputSchema: { type: "object" } },
        { name: "admin.tools.list", description: "Lists", inputSchema: { type: "object" } },
        { name: "admin.tools.list", inputSchema: { type: "object" } },
      ],
      Validator,
    );
    expect(r.tools.map((t) => t.warnings.map((w) => w.path))).toEqual([["name"], ["name"], [], ["name", "description"]]);
    expect(r.tools[3].warnings[0].message).toMatch(/tool #3/);
  });

  it("warns on risky declarations and open write-like schemas", () => {
    const r = checkMcpTools(
      [
        { name: "runShellCommand", description: "Execute a command", inputSchema: { type: "object" } },
        { name: "delete_record", description: "Remove a row", inputSchema: { type: "object", additionalProperties: false } },
        { name: "read_secret", description: "Return the API key", annotations: { readOnlyHint: true }, inputSchema: { type: "object" } },
        { name: "fetch_url", description: "Download a URL", annotations: { readOnlyHint: true }, inputSchema: { type: "object" } },
        { name: "lookup", description: "Find a user", annotations: { destructiveHint: true }, inputSchema: { type: "object" } },
        { name: "update_note", description: "Update", annotations: { readOnlyHint: true }, inputSchema: { type: "object" } },
        { name: "summarise", description: "y".repeat(1025), inputSchema: { type: "object" } },
      ],
      Validator,
    );
    expect(r.tools.map((t) => t.risks)).toEqual([["exec"], ["delete"], ["credentials"], ["network"], [], ["write"], []]);
    const open = r.tools.map((t) => t.warnings.some((w) => w.path === "inputSchema.additionalProperties"));
    expect(open).toEqual([true, false, false, false, true, false, false]);
    expect(r.tools[5].warnings.some((w) => w.path === "annotations.readOnlyHint")).toBe(true);
    expect(r.tools[6].warnings.map((w) => w.message)).toEqual([expect.stringMatching(/1025 characters/)]);
  });

  it("explains inputs that are not a tools/list result", () => {
    expect(checkMcpTools({ jsonrpc: "2.0", id: 1, error: { code: -32601, message: "Method not found" } }, Validator).error).toMatch(/Method not found$/);
    expect(checkMcpTools({ result: {} }, Validator).error).toMatch(/No "tools" array/);
    expect(checkMcpTools(42, Validator).error).toMatch(/^Expected/);
    const r = checkMcpTools({ result: { tools: [], nextCursor: "abc" } }, Validator);
    expect(r.notes.map((n) => n.path)).toEqual(["jsonrpc", "id", "nextCursor"]);
    expect(r.errorCount).toBe(2);
  });
});
