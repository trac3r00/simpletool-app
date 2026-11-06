/**
 * Timestamp parsing and wall-clock-to-epoch conversion for
 * /timestamp-converter. Inlined into the page via toString, so each function
 * is self-contained apart from calls to the others listed in
 * TIMESTAMP_CONVERTER_FUNCTIONS.
 */

// Strictly parse a Unix timestamp the user typed or pasted. Accepts digit
// grouping ("1,700,000,000", "1_700_000_000") and a fractional part; rejects
// anything else instead of silently reading a prefix the way parseInt does.
// `hint` names the other unit when the digit count makes it the likely intent.
export function parseUnixInput(raw, unit) {
  var s = String(raw).trim().replace(/[,_\s]/g, "");
  if (!s) return { empty: true };
  if (!/^[-+]?\d+(\.\d+)?$/.test(s)) return { error: "invalid" };
  var n = Number(s);
  var ms = unit === "seconds" ? Math.round(n * 1000) : Math.round(n);
  if (isNaN(new Date(ms).getTime())) return { error: "range" };
  var digits = s.replace(/^[-+]/, "").split(".")[0].replace(/^0+/, "").length;
  var hint = null;
  if (unit === "seconds" && digits >= 12) hint = "milliseconds";
  if (unit === "milliseconds" && digits >= 9 && digits <= 10) hint = "seconds";
  return { ms: ms, hint: hint };
}

// Offset (ms) of `timeZone` from UTC at the instant `epochMs`; undefined
// timeZone means the browser's local zone. hourCycle h23 avoids the "24:00"
// that hour12:false yields for midnight in some engines.
export function zoneOffsetAt(epochMs, timeZone) {
  var parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    era: "short",
  }).formatToParts(new Date(epochMs));
  var get = function (type) {
    var p = parts.find(function (x) { return x.type === type; });
    return p ? p.value : "";
  };
  var year = Number(get("year"));
  if (/^B/.test(get("era"))) year = 1 - year;
  var d = new Date(0);
  d.setUTCFullYear(year, Number(get("month")) - 1, Number(get("day")));
  d.setUTCHours(Number(get("hour")) % 24, Number(get("minute")), Number(get("second")), 0);
  var floored = Math.floor(epochMs / 1000) * 1000;
  return d.getTime() - floored;
}

// Epoch ms for a wall-clock date ("YYYY-MM-DD") and time ("HH:MM[:SS]") in
// `timeZone` ("UTC", an IANA name, or "local"). The offset must hold at the
// resulting instant, not at the wall time read as UTC (that shortcut is an
// hour off near a DST change), so both offsets around the wall time are tried.
// Like Temporal's "compatible" (and Python's fold=0): an ambiguous fall-back
// time takes the earlier instant; a spring-forward gap uses the pre-gap offset.
export function zonedWallTimeToEpoch(dateStr, timeStr, timeZone) {
  var dp = String(dateStr).split("-").map(Number);
  var tp = String(timeStr || "00:00:00").split(":").map(Number);
  var d = new Date(0);
  d.setUTCFullYear(dp[0], dp[1] - 1, dp[2]);
  d.setUTCHours(tp[0] || 0, tp[1] || 0, tp[2] || 0, 0);
  var wall = d.getTime();
  if (isNaN(wall)) return NaN;
  if (timeZone === "UTC") return wall;
  var tz = timeZone === "local" ? undefined : timeZone;
  var day = 86400000;
  var offBefore = zoneOffsetAt(wall - day, tz);
  var offAfter = zoneOffsetAt(wall + day, tz);
  var valid = [wall - offBefore, wall - offAfter].filter(function (c) {
    return zoneOffsetAt(c, tz) === wall - c;
  });
  if (!valid.length) return wall - offBefore;
  return Math.min.apply(null, valid);
}

export const TIMESTAMP_CONVERTER_FUNCTIONS = [parseUnixInput, zoneOffsetAt, zonedWallTimeToEpoch];
