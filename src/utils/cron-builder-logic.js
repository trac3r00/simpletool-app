// Classic five-field crontab (Vixie / cronie) parsing, description and
// next-run search. The route inlines this factory into its client script with
// fn.toString(), so it must stay self-contained. A factory keeps the inner
// names local: the worker bundler may rename colliding top-level names.
export function createCronLogic() {
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTH_MAP = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
  const DAY_MAP = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };

  const FIELDS = [
    { key: "minute", label: "minute", min: 0, max: 59 },
    { key: "hour", label: "hour", min: 0, max: 23 },
    { key: "dom", label: "day of month", min: 1, max: 31 },
    { key: "month", label: "month", min: 1, max: 12, names: MONTH_MAP },
    { key: "dow", label: "day of week", min: 0, max: 7, names: DAY_MAP },
  ];

  const MACROS = {
    "@yearly": "0 0 1 1 *",
    "@annually": "0 0 1 1 *",
    "@monthly": "0 0 1 * *",
    "@weekly": "0 0 * * 0",
    "@daily": "0 0 * * *",
    "@midnight": "0 0 * * *",
    "@hourly": "0 * * * *",
  };

  function fail(error) {
    return { ok: false, error: error };
  }

  function parseValue(token, spec) {
    if (/^\d+$/.test(token)) return Number(token);
    if (spec.names) {
      const v = spec.names[token.toUpperCase()];
      if (v !== undefined) return v;
    }
    return NaN;
  }

  function parseField(raw, spec) {
    if (raw === "?") {
      return { error: "\"?\" in the " + spec.label + " field is Quartz syntax. Classic crontab uses * instead." };
    }
    const values = new Set();
    const items = raw.split(",");
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) return { error: "Empty list item in the " + spec.label + " field: \"" + raw + "\"." };
      const slash = item.split("/");
      if (slash.length > 2) return { error: "Too many \"/\" in the " + spec.label + " field: \"" + item + "\"." };
      let step = 1;
      if (slash.length === 2) {
        if (!/^\d+$/.test(slash[1])) return { error: "Step \"" + slash[1] + "\" in the " + spec.label + " field is not a whole number." };
        step = Number(slash[1]);
        if (step < 1) return { error: "Step 0 in the " + spec.label + " field would never advance. Use 1 or more." };
      }
      const base = slash[0];
      let start;
      let end;
      if (base === "*") {
        start = spec.min;
        end = spec.max === 7 ? 6 : spec.max;
      } else {
        const dash = base.split("-");
        if (dash.length > 2 || dash[0] === "") return { error: "\"" + item + "\" is not a valid value or range for the " + spec.label + " field." };
        start = parseValue(dash[0], spec);
        if (dash.length === 2) {
          end = parseValue(dash[1], spec);
        } else {
          // "a/s" means "from a to the end of the range, every s" (cronie, croniter).
          end = slash.length === 2 ? (spec.max === 7 ? 6 : spec.max) : start;
        }
        if (Number.isNaN(start) || Number.isNaN(end)) {
          return { error: "\"" + item + "\" is not a valid value for the " + spec.label + " field." };
        }
        if (start < spec.min || start > spec.max || end < spec.min || end > spec.max) {
          return { error: "\"" + item + "\" is out of range for the " + spec.label + " field (" + spec.min + "-" + spec.max + ")." };
        }
        if (start > end) {
          return { error: "Range \"" + base + "\" in the " + spec.label + " field runs backwards. Write the smaller value first." };
        }
      }
      for (let v = start; v <= end; v += step) values.add(spec.max === 7 && v === 7 ? 0 : v);
    }
    return {
      raw: raw,
      // Vixie cron decides how day-of-month and day-of-week combine from
      // whether the field text starts with "*" (DOM_STAR / DOW_STAR).
      star: raw.charAt(0) === "*",
      values: Array.from(values).sort(function (a, b) { return a - b; }),
    };
  }

  function parseCron(input) {
    const text = String(input == null ? "" : input).trim();
    if (!text) return fail("Enter a cron expression, for example */5 * * * *.");
    let expr = text;
    let macro = null;
    if (text.charAt(0) === "@") {
      const name = text.toLowerCase();
      if (name === "@reboot") return fail("@reboot runs once when the cron daemon starts. It has no schedule to preview.");
      if (!MACROS[name]) return fail("Unknown macro \"" + text + "\". Known macros: " + Object.keys(MACROS).join(", ") + ", @reboot.");
      macro = name;
      expr = MACROS[name];
    }
    const parts = expr.split(/\s+/);
    if (parts.length !== 5) {
      let msg = "Found " + parts.length + " field" + (parts.length === 1 ? "" : "s") + ". Classic crontab needs exactly 5: minute hour day-of-month month day-of-week.";
      if (parts.length === 6) msg += " A sixth field is usually seconds (Quartz, Spring) or a year, which crontab does not support.";
      return fail(msg);
    }
    const fields = {};
    for (let i = 0; i < FIELDS.length; i++) {
      const f = parseField(parts[i], FIELDS[i]);
      if (f.error) return fail(f.error);
      fields[FIELDS[i].key] = f;
    }
    return { ok: true, expression: parts.join(" "), macro: macro, fields: fields };
  }

  function dayMatches(fields, dom, dow) {
    const domOk = fields.dom.values.indexOf(dom) !== -1;
    const dowOk = fields.dow.values.indexOf(dow) !== -1;
    // cronie: if either field starts with "*", both must match; otherwise either may.
    if (fields.dom.star || fields.dow.star) return domOk && dowOk;
    return domOk || dowOk;
  }

  function nextRuns(parsed, from, count, opts) {
    const options = opts || {};
    const utc = !!options.utc;
    const maxYears = options.maxYears || 9;
    const f = parsed.fields;
    const has = function (field, v) { return f[field].values.indexOf(v) !== -1; };
    const get = utc
      ? function (d) { return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate(), w: d.getUTCDay(), h: d.getUTCHours(), mi: d.getUTCMinutes() }; }
      : function (d) { return { y: d.getFullYear(), mo: d.getMonth(), d: d.getDate(), w: d.getDay(), h: d.getHours(), mi: d.getMinutes() }; };
    const make = utc
      ? function (y, mo, d) { return new Date(Date.UTC(y, mo, d, 0, 0, 0, 0)); }
      : function (y, mo, d) { return new Date(y, mo, d, 0, 0, 0, 0); };

    const results = [];
    let t = new Date(Math.floor(from.getTime() / 60000) * 60000 + 60000);
    let stopYear = get(t).y + maxYears;
    let guard = 0;
    while (results.length < count && guard++ < 2000000) {
      const c = get(t);
      if (c.y > stopYear) break;
      let next;
      if (!has("month", c.mo + 1)) {
        next = make(c.y, c.mo + 1, 1);
      } else if (!dayMatches(f, c.d, c.w)) {
        next = make(c.y, c.mo, c.d + 1);
      } else if (!has("hour", c.h)) {
        // Absolute arithmetic, so a repeated hour at a DST fall-back cannot loop.
        next = new Date(t.getTime() + (60 - c.mi) * 60000);
      } else if (!has("minute", c.mi)) {
        next = new Date(t.getTime() + 60000);
      } else {
        results.push(new Date(t.getTime()));
        stopYear = c.y + maxYears;
        next = new Date(t.getTime() + 60000);
      }
      if (next.getTime() <= t.getTime()) next = new Date(t.getTime() + 60000);
      t = next;
    }
    return results;
  }

  function joinList(list) {
    if (list.length <= 1) return list.join("");
    if (list.length === 2) return list[0] + " and " + list[1];
    return list.slice(0, -1).join(", ") + ", and " + list[list.length - 1];
  }

  function ordinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function isPlainNumberList(raw) {
    return /^\d+(,\d+)*$/.test(raw);
  }

  function describeItems(raw, spec, unit, nameOf) {
    const name = function (tok) {
      const v = parseValue(tok, spec);
      return nameOf ? nameOf(spec.max === 7 && v === 7 ? 0 : v) : String(v);
    };
    return joinList(raw.split(",").map(function (item) {
      const slash = item.split("/");
      const base = slash[0];
      const step = slash.length === 2 ? Number(slash[1]) : 0;
      let range = "";
      if (base !== "*") {
        const dash = base.split("-");
        range = dash.length === 2 ? name(dash[0]) + " through " + name(dash[1]) : name(dash[0]);
      }
      if (step) {
        const every = step === 1 ? "every " + unit : "every " + ordinal(step) + " " + unit;
        if (base === "*") return every;
        return every + " from " + range + (base.indexOf("-") === -1 ? " onward" : "");
      }
      if (base === "*") return "every " + unit;
      return range;
    }));
  }

  function describeCron(parsed) {
    const f = parsed.fields;
    const spec = {};
    FIELDS.forEach(function (s) { spec[s.key] = s; });
    let time;
    const mRaw = f.minute.raw;
    const hRaw = f.hour.raw;
    if (isPlainNumberList(mRaw) && isPlainNumberList(hRaw) && f.minute.values.length * f.hour.values.length <= 6) {
      const times = [];
      f.hour.values.forEach(function (h) {
        f.minute.values.forEach(function (m) { times.push(pad2(h) + ":" + pad2(m)); });
      });
      time = "At " + joinList(times);
    } else {
      let minutePart;
      if (mRaw === "*" || mRaw === "*/1") minutePart = "Every minute";
      else if (/^\*\/\d+$/.test(mRaw)) minutePart = "Every " + mRaw.slice(2) + " minutes";
      else {
        const items = describeItems(mRaw, spec.minute, "minute");
        minutePart = items.indexOf("every") === 0
          ? "E" + items.slice(1)
          : "At minute" + (f.minute.values.length > 1 ? "s " : " ") + items;
      }
      const connector = minutePart.indexOf("Every") === 0 ? " during " : " past ";
      if (hRaw === "*") {
        time = minutePart + (connector === " past " ? " past every hour" : "");
      } else {
        const items = describeItems(hRaw, spec.hour, "hour");
        time = minutePart + connector + (items.indexOf("every") === 0 ? items : "hour" + (f.hour.values.length > 1 ? "s " : " ") + items);
      }
    }

    const domRestricted = f.dom.raw !== "*";
    const dowRestricted = f.dow.raw !== "*";
    let day = "";
    const domItems = domRestricted ? describeItems(f.dom.raw, spec.dom, "day of the month") : "";
    const domText = domRestricted ? "on " + (domItems.indexOf("every") === 0 ? domItems : "day-of-month " + domItems) : "";
    const dowText = dowRestricted ? "on " + describeItems(f.dow.raw, spec.dow, "day-of-week", function (v) { return DAY_NAMES[v]; }) : "";
    if (domRestricted && dowRestricted) {
      day = " " + domText + (f.dom.star || f.dow.star ? " if it is also " : " or ") + dowText.replace(/^on /, f.dom.star || f.dow.star ? "" : "on ");
    } else if (domRestricted) {
      day = " " + domText;
    } else if (dowRestricted) {
      day = " " + dowText;
    }
    const month = f.month.raw !== "*"
      ? " in " + describeItems(f.month.raw, spec.month, "month", function (v) { return MONTH_NAMES[v - 1]; })
      : "";
    return time + day + month;
  }

  return { parseCron: parseCron, nextRuns: nextRuns, describeCron: describeCron, MACROS: MACROS };
}

const cronLogic = createCronLogic();
export const parseCron = cronLogic.parseCron;
export const nextRuns = cronLogic.nextRuns;
export const describeCron = cronLogic.describeCron;
