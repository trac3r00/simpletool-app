// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseUnixInput, zonedWallTimeToEpoch } from "./timestamp-converter-logic.js";

// Expected epochs were computed independently with Python's zoneinfo:
// datetime.fromisoformat(d + "T" + t).replace(tzinfo=ZoneInfo(tz), fold=0).timestamp()
const ZONEINFO_CASES = [
  ["Asia/Tokyo", "2024-01-02", "00:00:00", 1704121200000],
  ["Asia/Tokyo", "2024-01-01", "15:00:00", 1704088800000],
  ["America/New_York", "2024-03-10", "02:30:00", 1710055800000],
  ["America/New_York", "2024-03-10", "03:30:00", 1710055800000],
  ["America/New_York", "2024-11-03", "01:30:00", 1730611800000],
  ["America/New_York", "2024-11-03", "06:30:00", 1730633400000],
  ["Australia/Sydney", "2024-04-07", "01:00:00", 1712412000000],
  ["Australia/Sydney", "2024-04-07", "02:30:00", 1712417400000],
  ["Australia/Sydney", "2024-10-06", "02:30:00", 1728145800000],
  ["Europe/London", "2024-07-01", "00:30:00", 1719790200000],
  ["Europe/Paris", "2024-03-31", "02:15:00", 1711847700000],
  ["Asia/Kolkata", "2024-05-05", "12:00:00", 1714890600000],
  ["America/Los_Angeles", "1969-07-20", "20:17:40", -14157740000],
  ["Pacific/Chatham", "2024-09-29", "02:50:00", 1727532300000],
];

describe("zonedWallTimeToEpoch", () => {
  it.each(ZONEINFO_CASES)("%s %s %s", (tz, date, time, expected) => {
    expect(zonedWallTimeToEpoch(date, time, tz)).toBe(expected);
  });

  it("treats UTC wall time as the epoch directly, including years below 100", () => {
    expect(zonedWallTimeToEpoch("2024-01-01", "00:00:00", "UTC")).toBe(Date.UTC(2024, 0, 1));
    expect(zonedWallTimeToEpoch("0050-06-01", "12:00", "UTC")).toBe(-60576206400000);
  });

  it("round-trips every hour around both DST transitions of a year", () => {
    const tz = "America/New_York";
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const hours = [];
    for (const transition of [Date.UTC(2024, 2, 10, 7), Date.UTC(2024, 10, 3, 6)]) {
      for (let t = transition - 2 * 86400000; t <= transition + 2 * 86400000; t += 3600000) hours.push(t);
    }
    for (const t of hours) {
      const p = Object.fromEntries(fmt.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
      const back = zonedWallTimeToEpoch(`${p.year}-${p.month}-${p.day}`, `${p.hour}:${p.minute}:${p.second}`, tz);
      // The repeated fall-back hour maps to its earlier instant by design.
      expect(back === t || back === t - 3600000).toBe(true);
    }
  });
});

describe("parseUnixInput", () => {
  it("rejects trailing garbage and scientific notation instead of reading a prefix", () => {
    expect(parseUnixInput("1700000000abc", "seconds")).toEqual({ error: "invalid" });
    expect(parseUnixInput("1.7e9", "seconds")).toEqual({ error: "invalid" });
  });

  it("accepts grouped digits and fractions", () => {
    expect(parseUnixInput("1,700,000,000", "seconds")).toEqual({ ms: 1700000000000, hint: null });
    expect(parseUnixInput("1700000000.123", "seconds")).toEqual({ ms: 1700000000123, hint: null });
    expect(parseUnixInput("-1", "seconds")).toEqual({ ms: -1000, hint: null });
  });

  it("hints at the other unit from the digit count", () => {
    expect(parseUnixInput("1700000000000", "seconds").hint).toBe("milliseconds");
    expect(parseUnixInput("1700000000", "milliseconds").hint).toBe("seconds");
  });

  it("reports out-of-range values and empty input", () => {
    expect(parseUnixInput("99999999999999999", "seconds")).toEqual({ error: "range" });
    expect(parseUnixInput("   ", "seconds")).toEqual({ empty: true });
  });
});
