/**
 * Shared JSON statistics for the JSON Formatter tool.
 *
 * The route handler inlines this code into the page bundle via
 * `String(countKeys.toString())` so the SAME function runs in the browser
 * and is unit-tested under vitest.
 *
 * IMPORTANT: function source is emitted VERBATIM to the HTML page — it
 * does NOT pass through the esbuild transpiler when inlined via
 * `.toString()`. The syntax written here is the syntax that ships.
 *
 * Allowed: ES2015+ (const, let, template literals, default params,
 * Array.isArray). The project's browserslist is `defaults` which covers
 * every browser that supports those features.
 *
 * Forbidden inside the function body (would ship un-transpiled and break
 * older targets): arrow functions used as the top-level export (the
 * exported binding must be a `function` declaration so toString returns
 * a complete source), async/await, optional chaining (?.), nullish
 * coalescing (??), top-level await, async iterators.
 */

/**
 * Count distinct property keys and the maximum nesting depth of a parsed
 * JSON value.
 *
 * Conventions:
 *  - The depth of a non-empty root container is 1 (not 0). A nested
 *    container is its parent's depth + 1.
 *  - Primitives (string/number/boolean/null) and `undefined` have depth 0
 *    and contribute 0 keys.
 *  - Arrays contribute 0 keys (their indices are positional, not named),
 *    but their elements are still walked for depth and to count keys of
 *    nested objects.
 *  - Plain objects contribute one key per own enumerable property.
 *
 * @param {*} obj - parsed JSON value (object, array, primitive, or null)
 * @param {number} [depth] - internal recursion parameter; callers should omit
 * @returns {{ count: number, maxDepth: number }}
 */
export function countKeys(obj, depth) {
  // First call: callers omit depth. Treat root container as depth 1.
  if (depth === undefined) {
    if (obj === null || typeof obj !== 'object') {
      return { count: 0, maxDepth: 0 };
    }
    return countKeys(obj, 1);
  }

  let count = 0;
  let maxDepth = depth;

  if (obj !== null && typeof obj === 'object') {
    const isArray = Array.isArray(obj);
    for (const key in obj) {
      // Skip inherited properties; only count own keys.
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      // Arrays contribute structural depth but no named keys.
      if (!isArray) count += 1;

      const value = obj[key];
      if (value !== null && typeof value === 'object') {
        const nested = countKeys(value, depth + 1);
        count += nested.count;
        if (nested.maxDepth > maxDepth) maxDepth = nested.maxDepth;
      }
    }
  }

  return { count: count, maxDepth: maxDepth };
}
