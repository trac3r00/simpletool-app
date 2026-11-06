import { describe, expect, it } from "vitest";
import { clampRows, sqlIdentifier } from "./mock-data-logic.js";

describe("mock-data-logic", () => {
  it.each([
    ["12.5", 12],
    ["3", 10],
    ["", 10],
    ["abc", 10],
    ["-40", 10],
    ["500", 500],
    ["1e6", 500],
    ["25", 25],
  ])("clamps %j to %d rows", (input, rows) => {
    expect(clampRows(input)).toBe(rows);
  });

  it.each([
    ["users", "users"],
    ["public.users", "public.users"],
    ["my table", '"my table"'],
    ['we"ird', '"we""ird"'],
    ["x; DROP TABLE y", '"x; DROP TABLE y"'],
    ["   ", "mock_data"],
    ["2fa_codes", '"2fa_codes"'],
  ])("quotes %j as %s", (name, ident) => {
    expect(sqlIdentifier(name)).toBe(ident);
  });
});
