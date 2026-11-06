import { describe, expect, it } from "vitest";
import { describeCron, nextRuns, parseCron } from "./cron-builder-logic.js";

const START = new Date(Date.UTC(2026, 0, 31, 10, 7));
const iso = (d) => d.toISOString().slice(0, 16) + "Z";
const runs = (expr, n = 3, from = START) => {
  const p = parseCron(expr);
  expect(p.ok, p.error).toBe(true);
  return nextRuns(p, from, n, { utc: true }).map(iso);
};

// Expected values were produced by python croniter from the same UTC start
// (2026-01-31T10:07Z), an implementation independent of this module.
const CRONITER = {
  "1-30/5 * * * *": ["2026-01-31T10:11Z", "2026-01-31T10:16Z", "2026-01-31T10:21Z"],
  "0 0 * * 7": ["2026-02-01T00:00Z", "2026-02-08T00:00Z", "2026-02-15T00:00Z"],
  "0 0 13 * 5": ["2026-02-06T00:00Z", "2026-02-13T00:00Z", "2026-02-20T00:00Z"],
  "0 0 29 2 *": ["2028-02-29T00:00Z", "2032-02-29T00:00Z", "2036-02-29T00:00Z"],
  "0 0 * 2 *": ["2026-02-01T00:00Z", "2026-02-02T00:00Z", "2026-02-03T00:00Z"],
  "5/15 * * * *": ["2026-01-31T10:20Z", "2026-01-31T10:35Z", "2026-01-31T10:50Z"],
  "0 8-18/2 * * 1,3,5": ["2026-02-02T08:00Z", "2026-02-02T10:00Z", "2026-02-02T12:00Z"],
};

describe("cron next runs", () => {
  for (const [expr, expected] of Object.entries(CRONITER)) {
    it(`matches croniter for ${expr}`, () => {
      expect(runs(expr)).toEqual(expected);
    });
  }

  it("does not skip February when the search starts on the 31st", () => {
    // The old setMonth(+1) on Jan 31 rolled over to March 3.
    expect(runs("0 0 * 2 *", 1)[0]).toBe("2026-02-01T00:00Z");
  });

  it("returns no runs for a date that never exists", () => {
    expect(runs("0 0 30 2 *")).toEqual([]);
  });

  // Seeded property test: the skipping search must agree with a naive
  // minute-by-minute scan that applies the Vixie day rule directly.
  it("agrees with a brute-force scan on random expressions", () => {
    let seed = 20261106;
    const rand = (n) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % n;
    };
    const field = (min, max) => {
      const r = rand(6);
      if (r === 0) return "*";
      if (r === 1) return "*/" + (1 + rand(Math.min(12, max)));
      const a = min + rand(max - min + 1);
      if (r === 2) return String(a);
      const b = a + rand(max - a + 1);
      if (r === 3) return a + "-" + b;
      if (r === 4) return a + "-" + b + "/" + (1 + rand(4));
      return a + "," + (min + rand(max - min + 1));
    };
    const inSet = (raw, v, min, max) =>
      raw.split(",").some((item) => {
        const [base, stepText] = item.split("/");
        const step = stepText ? Number(stepText) : 1;
        let lo = min;
        let hi = max;
        if (base !== "*") {
          const [x, y] = base.split("-").map(Number);
          lo = x;
          hi = y === undefined ? (stepText ? max : x) : y;
        }
        return v >= lo && v <= hi && (v - lo) % step === 0;
      });
    for (let k = 0; k < 120; k++) {
      const parts = [field(0, 59), field(0, 23), field(1, 31), field(1, 12), field(0, 6)];
      const expr = parts.join(" ");
      const got = runs(expr, 4);
      const want = [];
      const domStar = parts[2][0] === "*";
      const dowStar = parts[4][0] === "*";
      const end = START.getTime() + 400 * 86400000;
      for (let t = START.getTime() + 60000; want.length < 4 && t < end; t += 60000) {
        const d = new Date(t);
        const dom = inSet(parts[2], d.getUTCDate(), 1, 31);
        const dow = inSet(parts[4], d.getUTCDay(), 0, 6);
        const dayOk = domStar || dowStar ? dom && dow : dom || dow;
        if (!dayOk || !inSet(parts[3], d.getUTCMonth() + 1, 1, 12)) {
          t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - 60000;
          continue;
        }
        if (inSet(parts[0], d.getUTCMinutes(), 0, 59) && inSet(parts[1], d.getUTCHours(), 0, 23)) {
          want.push(iso(d));
        }
      }
      if (want.length === 4) expect(got, expr).toEqual(want);
    }
  });
});

describe("cron parsing", () => {
  it("treats day-of-week 7 as Sunday", () => {
    expect(parseCron("0 0 * * 7").fields.dow.values).toEqual([0]);
    expect(parseCron("0 0 * * 5-7").fields.dow.values).toEqual([0, 5, 6]);
  });

  it("expands macros", () => {
    expect(parseCron("@daily").expression).toBe("0 0 * * *");
    expect(parseCron("@HOURLY").expression).toBe("0 * * * *");
    expect(parseCron("@reboot").ok).toBe(false);
  });

  it.each([
    ["*/0 * * * *", /Step 0/],
    ["60 * * * *", /out of range/],
    ["0 0 0 * * *", /6 fields.*seconds/],
    ["* * * *", /4 fields/],
    ["0 0 ? * 1", /Quartz/],
    ["5-1 * * * *", /backwards/],
    ["a * * * *", /not a valid value/],
    ["1,,2 * * * *", /Empty list item/],
    ["", /Enter a cron expression/],
  ])("rejects %j", (expr, message) => {
    const p = parseCron(expr);
    expect(p.ok).toBe(false);
    expect(p.error).toMatch(message);
  });
});

describe("cron description", () => {
  it.each([
    ["* * * * *", "Every minute"],
    ["* 9 * * *", "Every minute during hour 9"],
    ["0 * * * *", "At minute 0 past every hour"],
    ["0 9,17 * * *", "At 09:00 and 17:00"],
    ["0 9 * * 1-5", "At 09:00 on Mon through Fri"],
    ["0 0 13 * 5", "At 00:00 on day-of-month 13 or on Fri"],
    ["0 0 */2 * 1", "At 00:00 on every 2nd day of the month if it is also Mon"],
    ["0 0 1 JAN,JUL *", "At 00:00 on day-of-month 1 in Jan and Jul"],
    ["15,45 */3 * * *", "At minutes 15 and 45 past every 3rd hour"],
  ])("%s", (expr, text) => {
    expect(describeCron(parseCron(expr))).toBe(text);
  });
});
