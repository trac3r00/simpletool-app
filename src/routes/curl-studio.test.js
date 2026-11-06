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
 * the SHIPPED factory, extracted from the rendered route.
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
async function loadCurlLogicFromRenderedPage() {
  const url = new URL("https://simpletool.app/curl-studio");
  const response = await handleCurlStudioRoutes(new Request(url, { method: "GET" }), url);
  const html = await response.text();
  const marker = "const curlLogic = (";
  const start = html.indexOf(marker);
  expect(start, "the curl logic factory should be inlined in the page").toBeGreaterThan(-1);
  const end = html.indexOf(")();", start);
  // eslint-disable-next-line no-eval
  return eval("(" + html.slice(start + marker.length, end) + ")()");
}

describe("curl studio parser", () => {
  let parseCurl;
  let tokenizeShell;
  let generateCurl;
  beforeAll(async () => {
    ({ parseCurl, tokenizeShell, generateCurl } = await loadCurlLogicFromRenderedPage());
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

  // Expected argv was produced by bash itself: eval "set -- $cmd"; printf '%s\0' "$@".
  it.each([
    [
      "curl 'https://x.test/a?b=1&c=2' -H 'accept: */*' --data-raw $'{\"a\":\"line1\\nline2\",\"q\":\"it\\'s\"}' --compressed",
      ["curl", "https://x.test/a?b=1&c=2", "-H", "accept: */*", "--data-raw", '{"a":"line1\nline2","q":"it\'s"}', "--compressed"],
    ],
    ['curl "https://h.test/\\$HOME" -H "X: \\"quoted\\""', ["curl", "https://h.test/$HOME", "-H", 'X: "quoted"']],
    ["curl -XPOST -H'Content-Type: text/plain' https://a.test", ["curl", "-XPOST", "-HContent-Type: text/plain", "https://a.test"]],
    ["curl https://e.test -d ''", ["curl", "https://e.test", "-d", ""]],
    ["curl a\\ b https://sp.test", ["curl", "a b", "https://sp.test"]],
  ])("tokenizes like bash: %s", (cmd, argv) => {
    expect(tokenizeShell(cmd)).toEqual(argv);
  });

  it("accepts CRLF line continuations from a Windows paste", () => {
    expect(tokenizeShell("curl \\\r\n  https://crlf.test/x \\\r\n  -H 'A: b'")).toEqual(["curl", "https://crlf.test/x", "-H", "A: b"]);
  });

  it("parses Chrome's Copy as cURL body and attached short-flag values", () => {
    const chrome = parseCurl("curl 'https://x.test/api' -H 'content-type: application/json' --data-raw $'{\"note\":\"a\\\\nb\"}'");
    expect(chrome.method).toBe("POST");
    expect(chrome.body).toEqual({ note: "a\nb" });
    const attached = parseCurl("curl -XPUT -H'X-A: 1' https://a.test");
    expect(attached.method).toBe("PUT");
    expect(attached.headers).toEqual({ "X-A": "1" });
  });

  it("keeps auth, cookies, forms, --json and repeated -d", () => {
    const r = parseCurl("curl -u me:pw -A ua/1 -b 'a=1' -F n=v --json '{\"k\":1}' -k https://f.test");
    expect(r.user).toBe("me:pw");
    expect(r.headers).toEqual({ "User-Agent": "ua/1", Cookie: "a=1", "Content-Type": "application/json", Accept: "application/json" });
    expect(r.form).toEqual(["n=v"]);
    expect(r.body).toEqual({ k: 1 });
    expect(r.flags).toEqual(["-k"]);
    expect(parseCurl("curl -d a=1 -d b=2 https://x").body).toBe("a=1&b=2");
    expect(parseCurl("curl -G https://g.test --data-urlencode 'q=a b&c'").url).toBe("https://g.test?q=a+b%26c");
    expect(parseCurl("curl -I https://h.test").method).toBe("HEAD");
  });

  // Seeded property test: a generated command must come back through the
  // tokenizer (checked against bash above) and parser with the same values.
  it("round-trips generated commands", () => {
    let seed = 42;
    const pick = (s) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return s[seed % s.length];
    };
    const alphabet = ["a", " ", "'", '"', "$", "`", "\\", "\n", "{", "}", "&", "@", "é", "😀", ":", "!"];
    const word = (n) => Array.from({ length: n }, () => pick(alphabet)).join("");
    for (let k = 0; k < 200; k++) {
      const spec = {
        method: pick(["POST", "PUT", "PATCH", "DELETE"]),
        url: "https://h.test/p?q=" + encodeURIComponent(word(4)),
        headers: { "X-T": word(6).replace(/[\n:]/g, "x").trim() || "v" },
        body: "@" + word(12),
      };
      const back = parseCurl(generateCurl(spec));
      expect(back.method).toBe(spec.method);
      expect(back.url).toBe(spec.url);
      expect(back.headers).toEqual(spec.headers);
      expect(back.body).toBe(spec.body);
    }
  });

  it("single-quotes values so the shell cannot expand them", () => {
    const cmd = generateCurl({ method: "POST", url: "https://a.test/x?y=1&z=2", headers: { "X-Q": "it's $HOME" }, body: '{"p":"$5"}' });
    expect(cmd).toContain("'https://a.test/x?y=1&z=2'");
    expect(cmd).toContain("-H 'X-Q: it'\\''s $HOME'");
    expect(cmd).toContain("--data-raw '{\"p\":\"$5\"}'");
  });
});
