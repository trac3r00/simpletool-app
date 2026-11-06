// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parsePublicReposInput, splitInventoryLine } from "./public-repos-yml-builder.js";
import { handleRepoOpsRoutes } from "./repo-ops.js";
import { TOOLS } from "../utils/tool-registry.js";

describe("repo-ops embedded repository inventory", () => {
  it("is registered with the expected production metadata", () => {
    const tool = TOOLS.find((item) => item.id === "repo-ops");

    expect(tool).toMatchObject({
      id: "repo-ops",
      name: "Repo Operations",
      path: "/repo-ops",
      category: "utils",
    });
    expect(tool?.keywords).toContain("repos.yml");
  });

  it("renders the builder UI and client-side automation outputs", async () => {
    const url = new URL("http://localhost/repo-ops");
    const request = new Request(url, { method: "GET" });
    const response = await handleRepoOpsRoutes(request, url);

    expect(response).not.toBeNull();
    expect(response.status).toBe(200);

    const text = await response.text();
    expect(text).toContain("Public Repos YAML Builder");
    expect(text).toContain("repo-input");
    expect(text).toContain("repos-yaml-output");
    expect(text).toContain("actions-output");
    expect(text).toContain("SHA pinning");
    expect(text).toContain("branch protection");
    expect(text).toContain("secrets posture");
    expect(text).toContain("monetization readiness");
    expect(text).toContain(
      "github/codeql-action/init@<codeql_action_init_commit_sha>",
    );
    expect(text).toContain("actions/checkout@<actions_checkout_commit_sha>");
    expect(text).not.toContain("github/codeql-action/init@v3");
    expect(text).not.toContain("actions/checkout@v4");
    expect(text).toContain("jsyaml.dump");
    expect(text).not.toContain("alert(");
  });

  it("returns null for unmatched routes and 405 for unsupported methods", async () => {
    const missUrl = new URL("http://localhost/not-repo-ops");
    const missRequest = new Request(missUrl, { method: "GET" });
    await expect(handleRepoOpsRoutes(missRequest, missUrl)).resolves.toBeNull();

    const postUrl = new URL("http://localhost/repo-ops");
    const postRequest = new Request(postUrl, { method: "POST" });
    const response = await handleRepoOpsRoutes(postRequest, postUrl);
    expect(response.status).toBe(405);
  });
});

describe("public-repos-yml-builder JSON import parsing", () => {
  it("maps GitHub public repos API JSON arrays into repos.yml entries", () => {
    const repos = parsePublicReposInput(
      JSON.stringify([
        {
          full_name: "trac3r00/simpletool-app",
          name: "simpletool-app",
          owner: { login: "trac3r00" },
          html_url: "https://github.com/trac3r00/simpletool-app",
          description: "Browser tools",
          language: "JavaScript",
          homepage: "https://simpletool.io",
          archived: false,
          fork: false,
        },
        {
          name: "docs-site",
          owner: { login: "trac3r00" },
          description: "",
          language: null,
          homepage: "",
          archived: true,
          fork: false,
        },
      ]),
      { fallbackOwner: "fallback-owner", cadence: "monthly" },
    );

    expect(repos).toHaveLength(2);
    expect(repos[0]).toMatchObject({
      slug: "trac3r00/simpletool-app",
      visibility: "public",
      automation: {
        cadence: "monthly",
        kanban: true,
        recurring_demand: true,
      },
      stewardship: {
        team: "maintainers",
        topic: "public-repo-audit",
      },
      policy: {
        sha_pinning: "review",
        branch_protection: "review",
        secrets_posture: "review",
        monetization_readiness: "review",
      },
      details: {
        description: "Browser tools",
        language: "JavaScript",
        homepage: "https://simpletool.io",
        archived: false,
        fork: false,
      },
    });
    expect(repos[1]).toMatchObject({
      slug: "trac3r00/docs-site",
      details: {
        archived: true,
        fork: false,
      },
    });
    expect(repos[1].details).not.toHaveProperty("description");
    expect(repos[1].details).not.toHaveProperty("language");
    expect(repos[1].details).not.toHaveProperty("homepage");
  });

  it("falls back from full_name to html_url, then owner/name, while preserving line input parsing", () => {
    const fromJson = parsePublicReposInput(
      JSON.stringify([
        { html_url: "https://github.com/trac3r00/docs-site", name: "ignored" },
        { owner: "trac3r00", name: "owner-string" },
      ]),
      { fallbackOwner: "fallback-owner", cadence: "weekly" },
    );
    const fromLines = parsePublicReposInput(
      "simpletool-app team=platform cadence=biweekly sha=ok branch=protected secrets=ok monetization=ready notes=active",
      { fallbackOwner: "trac3r00", cadence: "weekly" },
    );

    expect(fromJson.map((repo) => repo.slug)).toEqual([
      "trac3r00/docs-site",
      "trac3r00/owner-string",
    ]);
    expect(fromLines[0]).toMatchObject({
      slug: "trac3r00/simpletool-app",
      automation: { cadence: "biweekly" },
      stewardship: { team: "platform" },
      policy: {
        sha_pinning: "ok",
        branch_protection: "protected",
        secrets_posture: "ok",
        monetization_readiness: "ready",
      },
      notes: "active",
    });
    expect(fromLines[0]).not.toHaveProperty("details");
  });

  it("returns invalid entries for malformed JSON and unparseable JSON objects", () => {
    expect(
      parsePublicReposInput("[{", {
        fallbackOwner: "trac3r00",
        cadence: "weekly",
      }),
    ).toEqual([
      expect.objectContaining({
        invalid: true,
        line: 1,
        reason: "invalid_json",
      }),
    ]);

    expect(
      parsePublicReposInput(
        JSON.stringify([{ private: false }, "not-an-object"]),
        {
          fallbackOwner: "trac3r00",
          cadence: "weekly",
        },
      ),
    ).toEqual([
      expect.objectContaining({
        invalid: true,
        line: 1,
        reason: "invalid_json_repo",
      }),
      expect.objectContaining({
        invalid: true,
        line: 2,
        reason: "invalid_json_repo",
      }),
    ]);
  });
});

describe("public repos line parsing", () => {
  it("flags tokens after the slug that are not key=value metadata", () => {
    const [entry] = parsePublicReposInput("not a repo!!", { fallbackOwner: "example" });
    expect(entry.slug).toBe("example/not");
    expect(entry.ignored).toEqual(["a", "repo!!"]);
    expect(entry.line).toBe(1);

    const [clean] = parsePublicReposInput("example/api team=platform", {});
    expect(clean.ignored).toBeUndefined();
  });
});

describe("inventory metadata with quoted values", () => {
  const lines = [
    'owner/api team=platform notes="two words here" cadence=monthly',
    "owner/docs notes='single quoted' team=docs",
    'owner/x notes="unclosed words',
    'owner/y,team=a,notes="a, b"',
    "owner/z notes=\"\" team=empty",
  ];

  it("keeps spaces inside quoted values and drops the quotes", () => {
    const [api, docs, unclosed, commas, empty] = parsePublicReposInput(lines.join("\n"), {});
    expect([api.notes, api.stewardship.team, api.automation.cadence]).toEqual(["two words here", "platform", "monthly"]);
    expect([docs.notes, docs.stewardship.team]).toEqual(["single quoted", "docs"]);
    expect([unclosed.notes, unclosed.ignored]).toEqual(['"unclosed', ["words"]]);
    expect([commas.notes, commas.stewardship.team]).toEqual(["a, b", "a"]);
    expect([empty.notes, empty.stewardship.team]).toEqual(["", "empty"]);
  });

  it("the inline browser tokenizer matches the exported one", async () => {
    const response = await handleRepoOpsRoutes(new Request("https://simpletool.app/repo-ops"), new URL("https://simpletool.app/repo-ops"));
    const html = await response.text();
    const start = html.indexOf("function splitInventoryLine(raw)");
    expect(start).toBeGreaterThan(-1);
    const end = html.indexOf("return parts;", start);
    const source = html.slice(start, html.indexOf("}", end) + 1);
    const inline = new Function(source + "; return splitInventoryLine;")();
    for (const line of lines) expect(inline(line)).toEqual(splitInventoryLine(line));
  });
});
