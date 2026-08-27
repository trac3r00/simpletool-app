import { describe, it, expect, vi } from "vitest";

vi.mock("@sentry/cloudflare", () => ({
  captureException: vi.fn(),
  withSentry: (_opts, handler) => handler,
}));

const { __workerForTests: worker } = await import("./worker.js");

function makeEnv(overrides = {}) {
  return {
    ENVIRONMENT: "production",
    ASSETS: { fetch: async () => new Response("", { status: 404 }) },
    ...overrides,
  };
}

const ctx = { waitUntil() {}, passThroughOnException() {} };

function fetchWorker(urlString, init = {}, env = makeEnv()) {
  return worker.fetch(new Request(urlString, init), env, ctx);
}

describe("HEAD mirrors GET (audit M1)", () => {
  const paths = ["/", "/terms", "/json-formatter", "/blog", "/faq", "/health"];

  for (const path of paths) {
    it(`HEAD ${path} returns the GET status with no body`, async () => {
      const getRes = await fetchWorker(`https://simpletool.app${path}`);
      const headRes = await fetchWorker(`https://simpletool.app${path}`, {
        method: "HEAD",
      });

      expect(getRes.status).toBe(200);
      expect(headRes.status).toBe(getRes.status);
      expect(headRes.headers.get("Content-Type")).toBe(
        getRes.headers.get("Content-Type"),
      );
      expect(await headRes.text()).toBe("");
    });
  }

  it("every sitemap route answers HEAD exactly as it answers GET", async () => {
    const sitemap = await (
      await fetchWorker("https://simpletool.app/sitemap.xml")
    ).text();
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(50);

    const mismatches = [];
    for (const loc of locs) {
      const target = loc === "https://simpletool.app" ? `${loc}/` : loc;
      const getRes = await fetchWorker(target);
      const headRes = await fetchWorker(target, { method: "HEAD" });
      if (getRes.status !== 200 || headRes.status !== 200) {
        mismatches.push(`${target} GET=${getRes.status} HEAD=${headRes.status}`);
      }
    }

    expect(mismatches).toEqual([]);
  });

  it("HEAD on an unknown path still 404s like GET", async () => {
    const res = await fetchWorker("https://simpletool.app/no-such-page", {
      method: "HEAD",
    });

    expect(res.status).toBe(404);
    expect(await res.text()).toBe("");
  });

  it("HEAD on a redirecting path keeps the redirect", async () => {
    const res = await fetchWorker("https://simpletool.app/tools", {
      method: "HEAD",
    });

    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe("https://simpletool.app/");
  });

  it("HEAD keeps the security headers a GET would carry", async () => {
    const res = await fetchWorker("https://simpletool.app/", {
      method: "HEAD",
    });

    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Content-Security-Policy")).toBeTruthy();
  });
});

describe("unsupported methods on page routes (audit M2)", () => {
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    it(`${method} / returns 405 with an Allow header, not the homepage`, async () => {
      const res = await fetchWorker("https://simpletool.app/", { method });

      expect(res.status).toBe(405);
      expect(res.headers.get("Allow")).toBe("GET, HEAD");
      const body = await res.text();
      expect(body).not.toContain("<html");
      expect(JSON.parse(body).error).toBe("Method not allowed");
    });
  }

  it("POST to a tool page returns 405", async () => {
    const res = await fetchWorker("https://simpletool.app/json-formatter", {
      method: "POST",
      body: "x=1",
    });

    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("GET, HEAD");
  });

  it("POST to a legal page returns 405", async () => {
    const res = await fetchWorker("https://simpletool.app/privacy", {
      method: "POST",
    });

    expect(res.status).toBe(405);
  });

  it("POST to an unknown path still returns 404, not 405", async () => {
    const res = await fetchWorker("https://simpletool.app/wp-login.php", {
      method: "POST",
      body: "user=admin",
    });

    expect(res.status).toBe(404);
  });

  it("POST to a legacy path keeps its 301 redirect", async () => {
    const res = await fetchWorker("https://simpletool.app/tools", {
      method: "POST",
    });

    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe("https://simpletool.app/");
  });
});

describe("sub-paths of a tool route", () => {
  // The retired /webhook-debugger/capture endpoint (see
  // src/routes/webhook-debugger.test.js) is a path the tool's handler matches
  // and then declines. Declining must read as "no such resource", not as
  // "wrong method on a resource that exists".
  it("POST to a retired endpoint returns 404, not 405", async () => {
    const res = await fetchWorker(
      "https://simpletool.app/webhook-debugger/capture",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "push" }),
      },
    );

    expect(res.status).toBe(404);
  });

  it("GET the tool page itself still renders", async () => {
    const res = await fetchWorker("https://simpletool.app/webhook-debugger");

    expect(res.status).toBe(200);
    expect(await res.text()).toContain("<html");
  });
});

describe("plain HTTP redirects to HTTPS (audit M2)", () => {
  it("redirects an http request to the same https URL", async () => {
    const res = await fetchWorker("http://simpletool.app/json-formatter?a=1");

    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe(
      "https://simpletool.app/json-formatter?a=1",
    );
  });

  it("leaves local dev over http alone", async () => {
    const res = await fetchWorker(
      "http://localhost:8787/",
      {},
      makeEnv({ ENVIRONMENT: "development" }),
    );

    expect(res.status).toBe(200);
  });
});

describe("sitemap lastmod reflects content, not the request", () => {
  async function getSitemap() {
    return (await fetchWorker("https://simpletool.app/sitemap.xml")).text();
  }

  function urlBlock(xml, loc) {
    const blocks = [...xml.matchAll(/ {2}<url>[\s\S]*?<\/url>/g)].map(
      (m) => m[0],
    );
    return blocks.find((b) => b.includes(`<loc>${loc}</loc>`));
  }

  it("never stamps today's date on a page", async () => {
    const xml = await getSitemap();
    const today = new Date().toISOString().split("T")[0];

    expect(xml).not.toContain(`<lastmod>${today}</lastmod>`);
  });

  it("omits lastmod for pages with no content date", async () => {
    const xml = await getSitemap();

    for (const loc of [
      "https://simpletool.app",
      "https://simpletool.app/json-formatter",
      "https://simpletool.app/privacy",
      "https://simpletool.app/faq",
    ]) {
      expect(urlBlock(xml, loc), loc).not.toContain("<lastmod>");
    }
  });

  it("uses the article's own publication date for blog posts", async () => {
    const { BLOG_ARTICLES } = await import("./ui/blog.js");
    const xml = await getSitemap();

    const dated = BLOG_ARTICLES.filter((a) => a.datePublished);
    expect(dated.length).toBeGreaterThan(0);

    for (const article of dated) {
      const block = urlBlock(xml, `https://simpletool.app/blog/${article.slug}`);
      expect(block, article.slug).toContain(
        `<lastmod>${article.datePublished}</lastmod>`,
      );
    }
  });

  it("emits no lastmod value that is not a real article date", async () => {
    const { BLOG_ARTICLES } = await import("./ui/blog.js");
    const xml = await getSitemap();
    const known = new Set(
      BLOG_ARTICLES.map((a) => a.datePublished).filter(Boolean),
    );
    const emitted = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(
      (m) => m[1],
    );

    expect(emitted.length).toBeGreaterThan(0);
    for (const value of emitted) {
      expect(known.has(value), value).toBe(true);
    }
  });
});

describe("dev-only tools stay out of production HTML (audit M8)", () => {
  const gameIds = ["ladder-game", "roulette-wheel", "marble-roulette"];

  it("home page HTML contains no dev-only tool ids in production", async () => {
    const res = await fetchWorker("https://simpletool.app/");
    const html = await res.text();

    expect(res.status).toBe(200);
    for (const id of gameIds) {
      expect(html).not.toContain(id);
    }
    expect(html).toContain("json-formatter");
  });

  it("a tool page's search catalog contains no dev-only tool ids", async () => {
    const res = await fetchWorker("https://simpletool.app/json-formatter");
    const html = await res.text();

    for (const id of gameIds) {
      expect(html).not.toContain(id);
    }
  });

  it("a localized page ships no dev-only tool translations", async () => {
    const res = await fetchWorker("https://simpletool.app/json-formatter?lang=ko");
    const html = await res.text();

    for (const id of gameIds) {
      expect(html).not.toContain(id);
    }
  });

  it("still exposes the games in local dev", async () => {
    const res = await fetchWorker(
      "http://localhost:8787/",
      {},
      makeEnv({ ENVIRONMENT: "development" }),
    );
    const html = await res.text();

    for (const id of gameIds) {
      expect(html).toContain(id);
    }
  });
});
