// The route inlines this factory into its client script with fn.toString(), so it
// must stay self-contained. A factory keeps the inner names local: the worker
// bundler may rename colliding top-level names.
export function createJsonSchemaLogic() {
  const DRAFT = "https://json-schema.org/draft/2020-12/schema";
  const FORMATS = [
    ["date-time", /^\d{4}-\d{2}-\d{2}[Tt ]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/],
    ["date", /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/],
    ["uuid", /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/],
    ["email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/],
    ["uri", /^https?:\/\/[^\s]+$/],
  ];

  function typeOf(value) {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
    return typeof value;
  }

  function infer(value, opts) {
    const type = typeOf(value);
    if (type === "string") {
      const schema = { type: "string" };
      if (opts.formats) {
        const hit = FORMATS.find(function (f) { return f[1].test(value); });
        if (hit) schema.format = hit[0];
      }
      return schema;
    }
    if (type === "array") {
      const schema = { type: "array" };
      if (value.length) schema.items = value.map(function (v) { return infer(v, opts); }).reduce(function (a, b) { return merge(a, b, opts); });
      return schema;
    }
    if (type === "object") {
      const keys = Object.keys(value);
      const schema = { type: "object", properties: {} };
      keys.forEach(function (k) { schema.properties[k] = infer(value[k], opts); });
      if (opts.required && keys.length) schema.required = keys.slice();
      if (opts.closed) schema.additionalProperties = false;
      return schema;
    }
    return { type: type };
  }

  function variants(schema) {
    if (schema.anyOf) return schema.anyOf;
    if (Array.isArray(schema.type)) return schema.type.map(function (t) { return { type: t }; });
    return [schema];
  }

  function mergeSame(a, b, opts) {
    if (a.type === "object") {
      const props = {};
      Object.keys(a.properties).forEach(function (k) { props[k] = a.properties[k]; });
      Object.keys(b.properties).forEach(function (k) { props[k] = props[k] ? merge(props[k], b.properties[k], opts) : b.properties[k]; });
      const out = { type: "object", properties: props };
      if (opts.required) {
        const req = (a.required || []).filter(function (k) { return (b.required || []).indexOf(k) !== -1; });
        if (req.length) out.required = req;
      }
      if (opts.closed) out.additionalProperties = false;
      return out;
    }
    if (a.type === "array") {
      const out = { type: "array" };
      if (a.items && b.items) out.items = merge(a.items, b.items, opts);
      else if (a.items || b.items) out.items = a.items || b.items;
      return out;
    }
    if (a.type === "string") {
      const out = { type: "string" };
      if (a.format && a.format === b.format) out.format = a.format;
      return out;
    }
    return { type: a.type };
  }

  // Combines two schemas so that every value either one accepts is accepted.
  // integer widens to number; other mixed types become a type list (scalars)
  // or anyOf (when objects or arrays are involved).
  function merge(a, b, opts) {
    const list = variants(a).slice();
    variants(b).forEach(function (s) {
      let t = s.type;
      let idx = list.findIndex(function (x) { return x.type === t; });
      if (idx === -1 && (t === "integer" || t === "number")) {
        idx = list.findIndex(function (x) { return x.type === "integer" || x.type === "number"; });
        if (idx !== -1) {
          list[idx] = { type: "number" };
          return;
        }
      }
      if (idx === -1) list.push(s);
      else list[idx] = mergeSame(list[idx], s, opts);
    });
    if (list.length === 1) return list[0];
    const simple = list.every(function (s) { return Object.keys(s).length === 1; });
    if (simple) return { type: list.map(function (s) { return s.type; }) };
    return { anyOf: list };
  }

  function generateSchema(value, options) {
    const opts = Object.assign({ required: true, formats: true, closed: false }, options || {});
    const body = infer(value, opts);
    const out = { $schema: DRAFT, title: opts.title || "Generated Schema" };
    Object.keys(body).forEach(function (k) { out[k] = body[k]; });
    return out;
  }

  function describeJsonError(text, error) {
    const msg = String(error && error.message || error);
    const m = /position (\d+)/.exec(msg);
    if (!m) return msg;
    const pos = Number(m[1]);
    const before = text.slice(0, pos);
    const line = before.split("\n").length;
    const col = pos - before.lastIndexOf("\n");
    return msg.replace(/\s*\(line \d+ column \d+\)/, "") + " (line " + line + ", column " + col + ")";
  }

  // ---- Validate mode -------------------------------------------------------
  // Validation itself is done by the vendored @cfworker/json-schema (passed in as
  // `Validator`, the browser global CfJsonSchema.Validator). This module adds a
  // structural schema check, dialect detection, and a reduction of cfworker's
  // flat error list to the leaf errors a person acts on.

  const DIALECTS = {
    "2020-12": "https://json-schema.org/draft/2020-12/schema",
    "2019-09": "https://json-schema.org/draft/2019-09/schema",
    "7": "http://json-schema.org/draft-07/schema#",
  };
  const TYPES = ["string", "number", "integer", "boolean", "object", "array", "null"];
  const DRAFT7_UNKNOWN = ["$defs", "$anchor", "dependentSchemas", "dependentRequired", "prefixItems", "unevaluatedProperties", "unevaluatedItems", "minContains", "maxContains"];

  // Picks the dialect from $schema when the user chose "auto".
  function detectDialect(schema, choice) {
    if (choice && choice !== "auto") return { dialect: choice, note: "" };
    const uri = schema && typeof schema === "object" && typeof schema.$schema === "string" ? schema.$schema : "";
    if (!uri) return { dialect: "2020-12", note: "No $schema; validating as draft 2020-12." };
    if (uri.indexOf("2020-12") !== -1) return { dialect: "2020-12", note: "Detected draft 2020-12 from $schema." };
    if (uri.indexOf("2019-09") !== -1) return { dialect: "2019-09", note: "Detected draft 2019-09 from $schema." };
    if (uri.indexOf("draft-07") !== -1) return { dialect: "7", note: "Detected draft-07 from $schema." };
    return { dialect: "2020-12", note: "Unsupported $schema " + uri + "; validating as draft 2020-12." };
  }

  function isPlainObject(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }

  function escapeToken(k) {
    return String(k).replace(/~/g, "~0").replace(/\//g, "~1");
  }

  // Structural check of a schema against the shape its dialect's meta-schema
  // requires (types of keyword values, nested schemas, valid regexes). It is not
  // a full meta-schema validation: unknown keywords are allowed, as the spec does.
  function checkSchema(schema, dialect) {
    const issues = [];
    const d = dialect || "2020-12";
    function add(path, message) { issues.push({ path: path, message: message }); }
    function isNonNegInt(v) { return typeof v === "number" && Number.isInteger(v) && v >= 0; }
    function uniqueStrings(v) {
      return Array.isArray(v) && v.every(function (x) { return typeof x === "string"; }) && new Set(v).size === v.length;
    }
    function walk(s, path) {
      if (typeof s === "boolean") return;
      if (!isPlainObject(s)) { add(path, "A schema must be an object or a boolean."); return; }
      // Keywords added in 2019-09 are unknown (and so ignored) under draft-07.
      if (d === "7") {
        s = Object.assign({}, s);
        DRAFT7_UNKNOWN.forEach(function (k) { delete s[k]; });
      }
      if (s.type !== undefined) {
        const list = Array.isArray(s.type) ? s.type : [s.type];
        if (Array.isArray(s.type) && new Set(s.type).size !== s.type.length) add(path + "/type", "type lists the same type twice.");
        if (Array.isArray(s.type) && !s.type.length && d === "7") add(path + "/type", "type must not be an empty list.");
        list.forEach(function (t) { if (TYPES.indexOf(t) === -1) add(path + "/type", "Unknown type " + JSON.stringify(t) + "."); });
      }
      ["properties", "patternProperties", "$defs", "definitions", "dependentSchemas"].forEach(function (k) {
        if (s[k] === undefined) return;
        if (!isPlainObject(s[k])) { add(path + "/" + k, k + " must be an object of schemas."); return; }
        Object.keys(s[k]).forEach(function (name) {
          if (k === "patternProperties") {
            try { new RegExp(name, "u"); } catch (e) { add(path + "/" + k + "/" + escapeToken(name), "Invalid regular expression."); }
          }
          walk(s[k][name], path + "/" + k + "/" + escapeToken(name));
        });
      });
      const single = ["additionalProperties", "propertyNames", "not", "if", "then", "else", "contains", "unevaluatedProperties", "unevaluatedItems", "additionalItems"];
      single.forEach(function (k) { if (s[k] !== undefined) walk(s[k], path + "/" + k); });
      if (s.items !== undefined) {
        if (Array.isArray(s.items) && d !== "2020-12") s.items.forEach(function (x, i) { walk(x, path + "/items/" + i); });
        else if (Array.isArray(s.items)) add(path + "/items", "In draft 2020-12, items is a single schema; use prefixItems for a tuple.");
        else walk(s.items, path + "/items");
      }
      ["allOf", "anyOf", "oneOf", "prefixItems"].forEach(function (k) {
        if (s[k] === undefined) return;
        if (!Array.isArray(s[k]) || !s[k].length) { add(path + "/" + k, k + " must be a non-empty array of schemas."); return; }
        s[k].forEach(function (x, i) { walk(x, path + "/" + k + "/" + i); });
      });
      if (s.required !== undefined && !uniqueStrings(s.required)) add(path + "/required", "required must be an array of unique strings.");
      if (s.enum !== undefined && !Array.isArray(s.enum)) add(path + "/enum", "enum must be an array.");
      ["minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum"].forEach(function (k) {
        if (s[k] !== undefined && typeof s[k] !== "number") add(path + "/" + k, k + " must be a number.");
      });
      if (s.multipleOf !== undefined && !(typeof s.multipleOf === "number" && s.multipleOf > 0)) add(path + "/multipleOf", "multipleOf must be a number greater than 0.");
      ["minLength", "maxLength", "minItems", "maxItems", "minProperties", "maxProperties", "minContains", "maxContains"].forEach(function (k) {
        if (s[k] !== undefined && !isNonNegInt(s[k])) add(path + "/" + k, k + " must be a non-negative integer.");
      });
      if (s.uniqueItems !== undefined && typeof s.uniqueItems !== "boolean") add(path + "/uniqueItems", "uniqueItems must be a boolean.");
      if (s.pattern !== undefined) {
        if (typeof s.pattern !== "string") add(path + "/pattern", "pattern must be a string.");
        else { try { new RegExp(s.pattern, "u"); } catch (e) { add(path + "/pattern", "Invalid regular expression."); } }
      }
      ["$ref", "$id", "$anchor", "$schema", "title", "description", "format"].forEach(function (k) {
        if (s[k] !== undefined && typeof s[k] !== "string") add(path + "/" + k, k + " must be a string.");
      });
      if (s.dependentRequired !== undefined) {
        if (!isPlainObject(s.dependentRequired)) add(path + "/dependentRequired", "dependentRequired must be an object.");
        else Object.keys(s.dependentRequired).forEach(function (k) {
          if (!uniqueStrings(s.dependentRequired[k])) add(path + "/dependentRequired/" + escapeToken(k), "Must be an array of unique strings.");
        });
      }
      if (s.dependencies !== undefined) {
        if (!isPlainObject(s.dependencies)) add(path + "/dependencies", "dependencies must be an object.");
        else Object.keys(s.dependencies).forEach(function (k) {
          const v = s.dependencies[k];
          if (Array.isArray(v)) { if (!uniqueStrings(v)) add(path + "/dependencies/" + escapeToken(k), "Must be an array of unique strings."); }
          else walk(v, path + "/dependencies/" + escapeToken(k));
        });
      }
    }
    walk(schema, "");
    return issues;
  }

  function decodeLocation(loc) {
    const s = String(loc || "").replace(/^#/, "");
    try { return decodeURIComponent(s); } catch (e) { return s; }
  }

  // cfworker reports every failing keyword on the way down ("Property b does not
  // match schema", "A subschema had errors") plus each failing anyOf/oneOf
  // branch. Keep the leaves: drop branch errors under anyOf/oneOf (the combinator
  // error says it), drop a false-schema error that follows its applicator (the
  // applicator names the property), then drop applicators that still have a
  // descendant error.
  const APPLICATORS = ["properties", "patternProperties", "additionalProperties", "unevaluatedProperties", "items", "prefixItems", "additionalItems", "unevaluatedItems", "dependentSchemas", "dependencies", "propertyNames"];
  function reduceErrors(raw) {
    const list = raw.map(function (e) { return { path: decodeLocation(e.instanceLocation), keyword: e.keyword, schemaPath: decodeLocation(e.keywordLocation), message: e.error }; });
    // Subschema errors that only explain a combinator or contains count.
    const combinators = [];
    list.forEach(function (e) {
      if (e.keyword === "anyOf" || e.keyword === "oneOf") combinators.push(e.schemaPath + "/");
      if (e.keyword === "contains" || e.keyword === "minContains" || e.keyword === "maxContains") {
        combinators.push(e.schemaPath.replace(/\/[^/]*$/, "") + "/contains/");
      }
      // propertyNames checks a key, not a value: report it on the object.
      if (e.schemaPath.indexOf("/propertyNames/") !== -1) e.path = e.path.replace(/\/[^/]*$/, "");
    });
    // A false-schema error carries no real schema path; it belongs to the
    // applicator reported just before it, so it shares that error's fate, and the
    // applicator's own message (which names the property) is the one kept.
    let kept = [];
    let prevDropped = false;
    list.forEach(function (e, i) {
      let drop;
      if (e.keyword === "false" && i > 0) drop = prevDropped || APPLICATORS.indexOf(list[i - 1].keyword) !== -1;
      else drop = combinators.some(function (p) { return e.schemaPath.indexOf(p) === 0; });
      prevDropped = drop;
      if (!drop) kept.push(e);
    });
    function prefixes(e) {
      if (e.keyword === "if") {
        const base = e.schemaPath.replace(/\/if$/, "");
        return [base + "/then/", base + "/else/"];
      }
      return [e.schemaPath + "/"];
    }
    kept = kept.filter(function (e) {
      if (e.keyword === "anyOf" || e.keyword === "oneOf") return true;
      // draft-07 dependencies shares one location for its list form (a leaf) and
      // its schema form (an applicator); only the list form names a missing key.
      if (e.keyword === "dependencies" && / but does not have /.test(e.message)) return true;
      const pre = prefixes(e);
      return !kept.some(function (f) { return f !== e && pre.some(function (p) { return f.schemaPath.indexOf(p) === 0; }); });
    });
    const seen = {};
    return kept.filter(function (e) {
      const key = e.path + "|" + e.keyword + "|" + e.message;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  // Returns { valid, dialect, schemaErrors: [{path, message}], errors: [{path, keyword, schemaPath, message}] }.
  function validateDocument(Validator, schema, doc, choice) {
    const picked = detectDialect(schema, choice);
    const out = { valid: false, dialect: picked.dialect, note: picked.note, schemaErrors: [], errors: [] };
    out.schemaErrors = checkSchema(schema, picked.dialect);
    if (out.schemaErrors.length) return out;
    let result;
    try {
      result = new Validator(schema, picked.dialect, false).validate(doc);
    } catch (e) {
      out.schemaErrors = [{ path: "", message: "The schema could not be compiled: " + String(e && e.message || e).split("\n")[0] }];
      return out;
    }
    out.valid = result.valid;
    out.errors = reduceErrors(result.errors);
    return out;
  }

  // Schema problems for a schema used somewhere else (an MCP inputSchema):
  // structural issues first, then whether cfworker can compile and run it.
  function schemaProblems(Validator, schema) {
    const picked = detectDialect(schema, "auto");
    const issues = checkSchema(schema, picked.dialect);
    if (issues.length || !Validator) return issues;
    try { new Validator(schema, picked.dialect, false).validate({}); } catch (e) {
      issues.push({ path: "", message: "Could not be compiled: " + String(e && e.message || e).split("\n")[0] });
    }
    return issues;
  }

  // ---- MCP tools/list mode -------------------------------------------------
  // Shape from the MCP specification 2025-11-25:
  //   schema/2025-11-25/schema.ts (interfaces Tool, BaseMetadata, ToolAnnotations,
  //   ListToolsResult) and https://modelcontextprotocol.io/specification/2025-11-25/server/tools
  //   ("Tool Names": SHOULD be 1-128 chars of A-Z a-z 0-9 _ - . and unique per server).
  // Tool = { name: string, title?: string, description?: string,
  //          inputSchema: { $schema?, type: "object", properties?, required?: string[] },
  //          outputSchema?: same shape, annotations?: { title?, readOnlyHint?,
  //          destructiveHint?, idempotentHint?, openWorldHint? }, execution?, icons?, _meta? }
  const MCP_SPEC = "2025-11-25";
  const NAME_RE = /^[A-Za-z0-9_.-]{1,128}$/;
  const LONG_DESCRIPTION = 1024;
  const RISKS = [
    { id: "exec", label: "runs commands", re: /\b(shell|bash|zsh|exec|execute|executes|command|commands|cmd|subprocess|spawn|eval|terminal)\b/g },
    { id: "delete", label: "deletes data", re: /\b(delete|deletes|remove|removes|drop|destroy|truncate|wipe|purge|rm)\b/g },
    { id: "write", label: "writes or changes data", re: /\b(write|writes|overwrite|update|updates|modify|modifies|create|creates|insert|edit|edits|save|saves|upload|move|rename)\b/g },
    { id: "credentials", label: "touches credentials", re: /\b(credential|credentials|password|passwords|passwd|secret|secrets|api key|apikey|api_key|access token|private key|ssh key)\b/g },
    { id: "network", label: "makes network calls", re: /\b(network|http|https|url|urls|fetch|fetches|download|webhook|socket|curl|request|requests)\b/g },
  ];
  const WRITE_LIKE = ["exec", "delete", "write"];

  function words(text) {
    return String(text || "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_.\-]+/g, " ").toLowerCase();
  }

  function extractTools(value) {
    if (Array.isArray(value)) return { tools: value, source: "a bare tools array", notes: [] };
    if (!isPlainObject(value)) return { error: "Expected a tools/list JSON-RPC response, a result object with \"tools\", or an array of tools." };
    if (value.error !== undefined) {
      const msg = isPlainObject(value.error) && typeof value.error.message === "string" ? value.error.message : JSON.stringify(value.error);
      return { error: "This is a JSON-RPC error response, not a tools/list result: " + msg };
    }
    const notes = [];
    let result = value;
    let source = "a ListToolsResult object";
    if (isPlainObject(value.result)) {
      result = value.result;
      source = "a JSON-RPC response";
      if (value.jsonrpc !== "2.0") notes.push({ level: "error", path: "jsonrpc", message: "A JSON-RPC 2.0 response must carry \"jsonrpc\": \"2.0\"." });
      if (value.id === undefined) notes.push({ level: "error", path: "id", message: "A JSON-RPC response must echo the request id." });
    }
    if (!Array.isArray(result.tools)) return { error: "No \"tools\" array found in the result." };
    if (result.nextCursor !== undefined && typeof result.nextCursor !== "string") notes.push({ level: "error", path: "nextCursor", message: "nextCursor must be a string." });
    if (typeof result.nextCursor === "string") notes.push({ level: "info", path: "nextCursor", message: "The result is paginated: this page does not include every tool." });
    return { tools: result.tools, source: source, notes: notes };
  }

  function checkObjectSchema(Validator, schema, field, errors) {
    if (!isPlainObject(schema)) { errors.push({ path: field, message: field + " must be a JSON Schema object." }); return; }
    if (schema.type !== "object") errors.push({ path: field + ".type", message: field + ".type must be \"object\" (found " + JSON.stringify(schema.type) + ")." });
    if (schema.properties !== undefined && !isPlainObject(schema.properties)) errors.push({ path: field + ".properties", message: "properties must be an object." });
    schemaProblems(Validator, schema).forEach(function (p) {
      errors.push({ path: field + p.path, message: p.message });
    });
  }

  function checkTool(Validator, tool, index, seen) {
    const errors = [];
    const warnings = [];
    if (!isPlainObject(tool)) {
      return { index: index, name: "", errors: [{ path: "", message: "A tool must be an object." }], warnings: warnings, tokens: 0, risks: [] };
    }
    const name = typeof tool.name === "string" ? tool.name : "";
    if (tool.name === undefined) errors.push({ path: "name", message: "name is required." });
    else if (typeof tool.name !== "string") errors.push({ path: "name", message: "name must be a string." });
    else if (!NAME_RE.test(name)) warnings.push({ path: "name", message: "Tool names should be 1-128 characters of A-Z, a-z, 0-9, _, - and . (no spaces)." });
    if (name && seen[name]) warnings.push({ path: "name", message: "Duplicate name: tool #" + seen[name] + " uses it too. Names should be unique within a server." });
    if (name && !seen[name]) seen[name] = index + 1;
    if (tool.title !== undefined && typeof tool.title !== "string") errors.push({ path: "title", message: "title must be a string." });
    const description = typeof tool.description === "string" ? tool.description : "";
    if (tool.description !== undefined && typeof tool.description !== "string") errors.push({ path: "description", message: "description must be a string." });
    else if (!description.trim()) warnings.push({ path: "description", message: "No description. It is optional in the spec, but models choose tools by it." });
    if (description.length > LONG_DESCRIPTION) warnings.push({ path: "description", message: "Description is " + description.length + " characters (over " + LONG_DESCRIPTION + "); it is sent to the model on every request." });

    if (tool.inputSchema === undefined) errors.push({ path: "inputSchema", message: "inputSchema is required." });
    else checkObjectSchema(Validator, tool.inputSchema, "inputSchema", errors);
    const input = isPlainObject(tool.inputSchema) ? tool.inputSchema : {};
    if (Array.isArray(input.required) && isPlainObject(input.properties)) {
      input.required.forEach(function (k) {
        if (typeof k === "string" && !Object.prototype.hasOwnProperty.call(input.properties, k)) warnings.push({ path: "inputSchema.required", message: "\"" + k + "\" is required but not declared in properties." });
      });
    }
    if (tool.outputSchema !== undefined) checkObjectSchema(Validator, tool.outputSchema, "outputSchema", errors);

    const ann = tool.annotations;
    if (ann !== undefined) {
      if (!isPlainObject(ann)) errors.push({ path: "annotations", message: "annotations must be an object." });
      else {
        if (ann.title !== undefined && typeof ann.title !== "string") errors.push({ path: "annotations.title", message: "annotations.title must be a string." });
        ["readOnlyHint", "destructiveHint", "idempotentHint", "openWorldHint"].forEach(function (k) {
          if (ann[k] !== undefined && typeof ann[k] !== "boolean") errors.push({ path: "annotations." + k, message: k + " must be a boolean." });
        });
      }
    }

    const text = words(name) + " " + words(description);
    const risks = [];
    RISKS.forEach(function (r) {
      const hits = text.match(r.re);
      if (!hits) return;
      const uniq = hits.filter(function (h, i) { return hits.indexOf(h) === i; });
      risks.push(r.id);
      warnings.push({ path: "name/description", message: "Mentions " + uniq.map(function (h) { return "\"" + h + "\""; }).join(", ") + ": this tool likely " + r.label + "." });
    });
    const annObj = isPlainObject(ann) ? ann : {};
    const writeByText = risks.some(function (r) { return WRITE_LIKE.indexOf(r) !== -1; });
    if (annObj.readOnlyHint === true && writeByText) warnings.push({ path: "annotations.readOnlyHint", message: "readOnlyHint is true, but the name or description suggests the tool changes things." });
    const writeLike = annObj.readOnlyHint !== true && (writeByText || annObj.destructiveHint === true || annObj.readOnlyHint === false);
    if (writeLike && isPlainObject(tool.inputSchema) && tool.inputSchema.additionalProperties !== false) {
      warnings.push({ path: "inputSchema.additionalProperties", message: "Write-like tool accepts undeclared arguments; set additionalProperties: false." });
    }

    const tokens = estimateTokens(description, tool.inputSchema);
    return { index: index, name: name, errors: errors, warnings: warnings, tokens: tokens, risks: risks };
  }

  // Rough size of what a client sends the model per tool: the description plus the
  // serialised inputSchema, at about 4 characters per token. An estimate only.
  function estimateTokens(description, inputSchema) {
    const chars = String(description || "").length + (inputSchema === undefined ? 0 : JSON.stringify(inputSchema).length);
    return Math.ceil(chars / 4);
  }

  function checkMcpTools(value, Validator) {
    const found = extractTools(value);
    if (found.error) return { error: found.error, tools: [], notes: [], errorCount: 0, warningCount: 0, tokenEstimate: 0 };
    const seen = {};
    const tools = found.tools.map(function (t, i) { return checkTool(Validator, t, i, seen); });
    const sum = function (key) { return tools.reduce(function (n, t) { return n + (key === "tokens" ? t.tokens : t[key].length); }, 0); };
    return {
      spec: MCP_SPEC,
      source: found.source,
      notes: found.notes,
      tools: tools,
      errorCount: sum("errors") + found.notes.filter(function (n) { return n.level === "error"; }).length,
      warningCount: sum("warnings"),
      tokenEstimate: sum("tokens"),
    };
  }

  return {
    generateSchema: generateSchema,
    describeJsonError: describeJsonError,
    DRAFT: DRAFT,
    DIALECTS: DIALECTS,
    detectDialect: detectDialect,
    checkSchema: checkSchema,
    reduceErrors: reduceErrors,
    validateDocument: validateDocument,
    checkMcpTools: checkMcpTools,
    estimateTokens: estimateTokens,
    MCP_SPEC: MCP_SPEC,
  };
}

const jsonSchemaLogic = createJsonSchemaLogic();
export const generateSchema = jsonSchemaLogic.generateSchema;
export const describeJsonError = jsonSchemaLogic.describeJsonError;
export const detectDialect = jsonSchemaLogic.detectDialect;
export const checkSchema = jsonSchemaLogic.checkSchema;
export const reduceErrors = jsonSchemaLogic.reduceErrors;
export const validateDocument = jsonSchemaLogic.validateDocument;
export const checkMcpTools = jsonSchemaLogic.checkMcpTools;
export const estimateTokens = jsonSchemaLogic.estimateTokens;
