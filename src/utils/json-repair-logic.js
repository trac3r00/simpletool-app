/**
 * Prepare common LLM output wrappers for jsonrepair.
 *
 * This function is also inlined into the JSON Formatter page via toString(), so
 * keep it self-contained and compatible with the project's supported browsers.
 *
 * @param {string} input
 * @returns {{ text: string, fixes: string[] }}
 */
export function preprocessJSONRepairInput(input) {
  var text = String(input).trim();
  var fixes = [];
  var fenceMatch = text.match(
    /^([\s\S]*?)```[\w+-]*[ \t]*\r?\n?([\s\S]*?)\r?\n?```[ \t]*$/,
  );

  if (fenceMatch) {
    if (fenceMatch[1].trim()) {
      fixes.push("prose removed");
    }
    text = fenceMatch[2].trim();
    fixes.push("fence removed");
  }

  var objectStart = text.indexOf("{");
  var arrayStart = text.indexOf("[");
  var jsonStart =
    objectStart === -1
      ? arrayStart
      : arrayStart === -1
        ? objectStart
        : Math.min(objectStart, arrayStart);

  if (jsonStart > 0) {
    text = text.slice(jsonStart).trim();
    if (!fixes.includes("prose removed")) {
      fixes.push("prose removed");
    }
  }

  return { text: text, fixes: fixes };
}

/**
 * Repair JSON without allowing expected input errors to escape to the caller.
 *
 * @param {string} input
 * @param {(text: string) => string} jsonrepair
 * @param {typeof preprocessJSONRepairInput} [prepare] pre-pass override (tests only)
 * @returns {{
 *   ok: true,
 *   repaired: string,
 *   value: *,
 *   fixes: string[]
 * } | {
 *   ok: false,
 *   error: string,
 *   fixes: string[]
 * }}
 */
export function repairJSONInput(input, jsonrepair, prepare) {
  var prepared = (prepare || preprocessJSONRepairInput)(input);

  if (!prepared.text) {
    return {
      ok: false,
      error: "No JSON input found.",
      fixes: prepared.fixes,
    };
  }

  try {
    var originalValue = JSON.parse(prepared.text);
    return {
      ok: true,
      repaired: prepared.text,
      value: originalValue,
      fixes: prepared.fixes,
    };
  } catch (parseError) {
    if (
      prepared.text.indexOf("{") === -1 &&
      prepared.text.indexOf("[") === -1
    ) {
      return {
        ok: false,
        error: "No JSON object or array found.",
        fixes: prepared.fixes,
      };
    }
  }

  try {
    var repaired = jsonrepair(prepared.text);
    var value = JSON.parse(repaired);
    var fixes = prepared.fixes.slice();

    if (repaired !== prepared.text) {
      fixes.push("syntax repaired");
    }

    return {
      ok: true,
      repaired: repaired,
      value: value,
      fixes: fixes,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error && typeof error.message === "string"
          ? error.message
          : "Unable to repair this JSON.",
      fixes: prepared.fixes,
    };
  }
}
