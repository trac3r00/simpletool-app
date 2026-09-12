import { describe, it, expect, vi } from "vitest";
import { RETIRED_BLOG_REDIRECTS } from "./ui/blog.js";
import { LEGACY_REDIRECTS } from "./utils/redirects.js";

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

describe("canonical route hygiene", () => {
  const htmlAliases = [
    ["/index.html", "/"],
    ["/about.html", "/about"],
    ["/careers.html", "/careers"],
    ["/contact.html", "/contact"],
    ["/privacy.html", "/privacy"],
    ["/security.html", "/security"],
    ["/terms.html", "/terms"],
  ];

  for (const [alias, canonical] of htmlAliases) {
    it(`permanently redirects ${alias} to its canonical URL in one hop`, async () => {
      const res = await fetchWorker(
        `https://simpletool.app${alias}?lang=ko&ref=audit`,
      );

      expect(res.status).toBe(301);
      expect(res.headers.get("Location")).toBe(
        `https://simpletool.app${canonical}?lang=ko&ref=audit`,
      );
      expect(await res.text()).toBe("");

      const canonicalRes = await fetchWorker(res.headers.get("Location"));
      expect(canonicalRes.status).toBe(200);
      expect(canonicalRes.headers.get("Location")).toBeNull();
    });
  }

  it("redirects registered /tools paths while preserving query parameters", async () => {
    const res = await fetchWorker(
      "https://simpletool.app/tools/json-formatter?lang=ja&ref=legacy",
    );

    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe(
      "https://simpletool.app/json-formatter?lang=ja&ref=legacy",
    );
  });

  it("resolves known legacy IDs under /tools without a redirect chain", async () => {
    const res = await fetchWorker(
      "https://simpletool.app/tools/dns-reference?lang=ko&ref=legacy",
    );

    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe(
      "https://simpletool.app/network-reference?tab=dns&lang=ko&ref=legacy",
    );
    const target = await fetchWorker(res.headers.get("Location"));
    expect(target.status).toBe(200);
    expect(target.headers.get("Location")).toBeNull();
  });

  it("returns the normal 404 for unknown and nested /tools suffixes", async () => {
    for (const pathname of [
      "/tools/not-a-real-tool",
      "/tools/json-formatter/extra",
    ]) {
      const res = await fetchWorker(`https://simpletool.app${pathname}`);
      expect(res.status).toBe(404);
      expect(res.headers.get("Location")).toBeNull();
    }
  });

  it("only permits dev-tool compatibility redirects in development", async () => {
    const production = await fetchWorker(
      "https://simpletool.app/tools/ladder-game?lang=en",
    );
    const development = await fetchWorker(
      "https://simpletool.app/tools/ladder-game?lang=en",
      {},
      makeEnv({ ENVIRONMENT: "development" }),
    );

    expect(production.status).toBe(404);
    expect(production.headers.get("Location")).toBeNull();
    expect(development.status).toBe(301);
    expect(development.headers.get("Location")).toBe(
      "https://simpletool.app/ladder-game?lang=en",
    );
  });

  it("keeps all 27 map-driven legacy redirects query-preserving", async () => {
    expect(Object.keys(LEGACY_REDIRECTS)).toHaveLength(27);

    for (const [source, target] of Object.entries(LEGACY_REDIRECTS)) {
      const res = await fetchWorker(
        `https://simpletool.app${source}?lang=ko&ref=legacy`,
      );
      const expected = new URL(target, "https://simpletool.app");
      expected.searchParams.append("lang", "ko");
      expected.searchParams.append("ref", "legacy");

      expect(res.status, source).toBe(301);
      expect(res.headers.get("Location"), source).toBe(expected.href);
    }
  });

  it("keeps all five retired blog redirects", async () => {
    expect(Object.keys(RETIRED_BLOG_REDIRECTS)).toHaveLength(5);

    for (const [slug, target] of Object.entries(RETIRED_BLOG_REDIRECTS)) {
      const res = await fetchWorker(`https://simpletool.app/blog/${slug}`);
      expect(res.status, slug).toBe(301);
      expect(res.headers.get("Location"), slug).toBe(
        `https://simpletool.app${target}`,
      );
    }
  });

  it("publishes canonical pages, never HTML aliases, in the sitemap", async () => {
    const sitemap = await (
      await fetchWorker("https://simpletool.app/sitemap.xml")
    ).text();

    for (const [, canonical] of htmlAliases) {
      const canonicalURL = `https://simpletool.app${canonical}`;
      expect(sitemap).toContain(`<loc>${canonicalURL}</loc>`);
    }
    for (const [alias] of htmlAliases) {
      expect(sitemap).not.toContain(`https://simpletool.app${alias}`);
    }
  });
});

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

  it("serves legal pages with or without a trailing slash", async () => {
    const slash = await fetchWorker("https://simpletool.app/terms/");
    const bare = await fetchWorker("https://simpletool.app/terms");
    expect(slash.status).toBe(200);
    expect(bare.status).toBe(200);
    expect(await slash.text()).toContain("Terms of Service");
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

describe("AdSense site-connect without slots", () => {
  it("serves ads.txt when a publisher id is set", async () => {
    const res = await fetchWorker(
      "https://simpletool.app/ads.txt",
      {},
      makeEnv({
        ADSENSE_CLIENT: "ca-pub-5134881365131182",
        ADSENSE_SLOTS: "{}",
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    expect(await res.text()).toBe(
      "google.com, pub-5134881365131182, DIRECT, f08c47fec0942fa0\n",
    );
  });

  it("puts the account meta and client script on the homepage without ad units", async () => {
    const res = await fetchWorker(
      "https://simpletool.app/",
      {},
      makeEnv({
        ADSENSE_CLIENT: "ca-pub-5134881365131182",
        ADSENSE_SLOTS: "{}",
      }),
    );
    const html = await res.text();
    expect(html).toContain(
      '<meta name="google-adsense-account" content="ca-pub-5134881365131182">',
    );
    expect(html).toMatch(
      /<script[^>]*src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-5134881365131182"/,
    );
    expect(html).toContain("requestNonPersonalizedAds = 1");
    expect(html).not.toContain("<ins class=\"adsbygoogle\"");
  });

  it("keeps the client script off secret tools", async () => {
    const res = await fetchWorker(
      "https://simpletool.app/password-generator",
      {},
      makeEnv({
        ADSENSE_CLIENT: "ca-pub-5134881365131182",
        ADSENSE_SLOTS: "{}",
      }),
    );
    const html = await res.text();
    expect(html).toContain(
      '<meta name="google-adsense-account" content="ca-pub-5134881365131182">',
    );
    expect(html).not.toMatch(
      /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/,
    );
    expect(html).not.toContain("requestNonPersonalizedAds");
  });

  it("301s www to the apex host", async () => {
    const res = await fetchWorker("https://www.simpletool.app/json-formatter?q=1");
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe(
      "https://simpletool.app/json-formatter?q=1",
    );
  });

  it("404s ads.txt without a publisher id", async () => {
    const res = await fetchWorker("https://simpletool.app/ads.txt");
    expect(res.status).toBe(404);
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
      "https://simpletool.app/",
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

describe("Material Symbols font asset", () => {
  it("serves the woff2 with a long-lived cache and no 503", async () => {
    const body = new Uint8Array([0x77, 0x4f, 0x46, 0x32]);
    const res = await fetchWorker(
      "https://simpletool.app/fonts/material-symbols.woff2",
      {},
      makeEnv({
        ASSETS: {
          fetch: async () =>
            new Response(body, {
              status: 200,
              headers: { "Content-Type": "font/woff2" },
            }),
        },
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("font/woff2");
    expect(res.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
  });
});
