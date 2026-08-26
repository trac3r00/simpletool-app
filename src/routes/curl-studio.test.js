// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { handleCurlStudioRoutes } from "./curl-studio.js";

/**
 * The original parser used three independent regexes over the raw command,
 * which failed on the most ordinary curl invocation there is:
 *
 *   curl -X POST https://api.example.com/v1/items -H 'X-Demo: 1' -d '{"name":"test"}'
 *
 *   - URL:  /curl\s+(?:-[^\s]+\s+)*['"]?([^'"\s]+)/ treated `-X` as a
 *     VALUELESS flag, so it skipped the flag and captured its argument —
 *     the URL came out as "POST".
 *   - body: /['"]([^'"]+)['"]/ excludes BOTH quote characters, so a JSON body
 *     wrapped in single quotes truncated at the first double quote — "{".
 *
 * It is now a shell-aware tokenizer plus flag-table parse. These assertions run
 * the SHIPPED function, extracted from the route.
 */

/**
 * Extracts parseCurl from the RENDERED page, not from the source file.
 *
 * The client script is emitted inside a template literal, so escapes collapse
 * on the way out: source `'\\\\'` becomes `'\\'` in the browser and source
 * `/\\\\s/` becomes `/\\s/`. Evaluating the source directly therefore tests
 * something the browser never runs — and the first version of this file did
 * exactly that, which masked a real SyntaxError that only a browser caught.
 */
async function loadParseCurlFromRenderedPage() {
  const url = new URL("https://simpletool.app/curl-studio");
  const response = await handleCurlStudioRoutes(new Request(url, { method: "GET" }), url);
  const html = await response.text();
  const start = html.indexOf("function tokenizeShell(");
  expect(start, "tokenizeShell should be in the rendered page").toBeGreaterThan(-1);
  // End at the closing brace of parseCurl, not an arbitrary offset.
  const marker = "return result;";
  const at = html.indexOf(marker, start);
  const end = html.indexOf("}", html.indexOf("\n", at)) + 1;
  // eslint-disable-next-line no-eval
  return eval(`(function(){${html.slice(start, end)}; return parseCurl;})()`);
}

describe("curl studio parser", () => {
  let parseCurl;
  beforeAll(async () => {
    parseCurl = await loadParseCurlFromRenderedPage();
  });

  it("parses the reported command correctly", () => {
    const r = parseCurl(
      `curl -X POST https://api.example.com/v1/items -H 'X-Demo: 1' -d '{"name":"test"}'`,
    );
    expect(r.method).toBe("POST");
    expect(r.url).toBe("https://api.example.com/v1/items"); // was "POST"
    expect(r.headers).toEqual({ "X-Demo": "1" });
    expect(r.body).toEqual({ name: "test" }); // was "{"
  });

  it("does not mistake a flag argument for the URL", () => {
    for (const [cmd, url] of [
      [`curl -X DELETE https://a.example/x`, "https://a.example/x"],
      [`curl -m 30 https://b.example/y`, "https://b.example/y"],
      [`curl -o out.txt https://c.example/z`, "https://c.example/z"],
    ]) {
      expect(parseCurl(cmd).url, cmd).toBe(url);
    }
  });

  it("keeps a quoted JSON body intact", () => {
    expect(parseCurl(`curl -d '{"a":1,"b":"x y"}' https://h/p`).body).toEqual({
      a: 1,
      b: "x y",
    });
    // non-JSON bodies stay as text
    expect(parseCurl(`curl -d 'a=1&b=2' https://h/p`).body).toBe("a=1&b=2");
  });

  it("handles --url, multiple headers and escaped quotes", () => {
    const r = parseCurl(
      `curl -H "Authorization: Bearer abc" -H 'X-B: 2' --url https://a.b/c`,
    );
    expect(r.url).toBe("https://a.b/c");
    expect(r.headers).toEqual({ Authorization: "Bearer abc", "X-B": "2" });
  });

  it("defaults the method the way curl does", () => {
    expect(parseCurl(`curl https://x/y`).method).toBe("GET");
    // curl implies POST when a body is supplied without -X
    expect(parseCurl(`curl -d 'a=1' https://x/y`).method).toBe("POST");
  });

  it("splits a header only on its FIRST colon", () => {
    // "Bearer abc" and URLs in header values contain colons too.
    const r = parseCurl(`curl -H 'X-Target: https://host:8080/p' https://x/y`);
    expect(r.headers["X-Target"]).toBe("https://host:8080/p");
  });
});
