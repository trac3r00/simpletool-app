/**
 * Pipe Mode Engine — runs a linear pipeline of tool contracts.
 *
 * Each step: { contract, options? }
 * The engine passes each step's output as the next step's input.
 * If a step fails, downstream steps are skipped.
 */

/**
 * Run a pipeline of steps against an initial input.
 * @param {Array<{contract: object, options?: object}>} steps
 * @param {string} initialInput
 * @returns {{ success: boolean, steps: Array, finalOutput: string }}
 */
export function runPipeline(steps, initialInput) {
  const results = [];
  let currentInput = initialInput ?? '';
  let failed = false;

  for (const step of steps) {
    if (failed) {
      results.push({
        contractId: step.contract.id,
        status: 'skipped',
        output: null,
        error: null,
      });
      continue;
    }

    try {
      const output = step.contract.transform(currentInput, step.options);
      results.push({
        contractId: step.contract.id,
        status: 'success',
        output,
        error: null,
      });
      currentInput = output;
    } catch (err) {
      results.push({
        contractId: step.contract.id,
        status: 'error',
        output: null,
        error: err.message || String(err),
      });
      failed = true;
    }
  }

  return {
    success: !failed,
    steps: results,
    finalOutput: failed ? null : currentInput,
  };
}

/**
 * Validate that a chain of contracts has compatible types.
 * @param {Array<{inputTypes: string[], outputTypes: string[]}>} contracts
 * @returns {{ valid: boolean, issues: string[] }}
 */
export function validateChain(contracts) {
  const issues = [];

  for (let i = 0; i < contracts.length - 1; i++) {
    const current = contracts[i];
    const next = contracts[i + 1];
    const overlap = current.outputTypes.some(t => next.inputTypes.includes(t));

    if (!overlap) {
      issues.push(
        `Step ${i + 1} → ${i + 2}: type mismatch. ` +
        `${current.id} outputs [${current.outputTypes}] but ` +
        `${next.id} expects [${next.inputTypes}]`
      );
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Serialize a workflow (step IDs + options) to a compact string.
 * Does NOT include user data — only the pipeline definition.
 * @param {Array<{contractId: string, options: object}>} steps
 * @returns {string}
 */
export function serializeWorkflow(steps) {
  try {
    const json = JSON.stringify(steps);
    // Use base64 for URL-safe encoding. For longer chains, pako
    // compression can be added here (pako is already a dependency).
    return btoa(encodeURIComponent(json));
  } catch {
    return '';
  }
}

/**
 * Deserialize a workflow string back to step definitions.
 * @param {string|null} encoded
 * @returns {Array<{contractId: string, options: object}>}
 */
export function deserializeWorkflow(encoded) {
  if (!encoded) return [];

  try {
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
