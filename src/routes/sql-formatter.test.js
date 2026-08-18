// @vitest-environment node
import { describe, expect, it } from "vitest";
import { handleSQLFormatterRoutes } from "./sql-formatter.js";

describe("sql-formatter labels", () => {
  it("keeps BigQuery and 4 spaces on separate i18n keys", async () => {
    const url = new URL("http://localhost/sql-formatter");
    const request = new Request(url, { method: "GET" });
    const response = await handleSQLFormatterRoutes(request, url);

    expect(response).not.toBeNull();
    expect(response.status).toBe(200);

    const text = await response.text();
    expect(text).toContain('value="bigquery" data-i18n="tools.sql-formatter.ui.option6"');
    expect(text).toContain('value="4" data-i18n="tools.sql-formatter.ui.option10"');
    expect(text).toContain(">4 spaces</option>");
    expect(text).toContain(">BigQuery</option>");
  });
});
