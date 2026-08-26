/**
 * In-page probe for scripts/deep-ui-audit.mjs. Runs inside the real browser,
 * inventories and exercises every interactive control, asserts design/a11y
 * invariants, then POSTs a structured report to /__audit.
 *
 * Severity: "error" fails the run; "warn"/"info" are reported but do not fail.
 */
(function () {
  var CFG = window.__AUDIT_CFG || { id: "unknown", selfTest: false };
  var F = [];
  var seen = Object.create(null);

  function add(sev, kind, msg, el) {
    var at = el ? (el.id ? "#" + el.id : "<" + el.tagName.toLowerCase() + ">") : "";
    var key = sev + kind + msg + at;
    if (seen[key]) return;
    seen[key] = 1;
    F.push({ sev: sev, kind: kind, msg: String(msg).slice(0, 200), at: at });
  }

  // ---------------------------------------------------------------- helpers
  function visible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    var cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return false;
    // `opacity` does not inherit: a control inside an opacity-0 wrapper still
    // computes opacity:1 and would be audited despite being invisible.
    var n = el.parentElement;
    while (n && n !== document.documentElement) {
      var pcs = getComputedStyle(n);
      if (pcs.opacity === "0" || pcs.visibility === "hidden" || pcs.display === "none") return false;
      n = n.parentElement;
    }
    return true;
  }

  function esc(s) {
    return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, "\\$&");
  }

  function accName(el) {
    var v = (el.getAttribute("aria-label") || "").trim();
    if (v) return v;
    var lb = el.getAttribute("aria-labelledby");
    if (lb) {
      // The attribute is a space-separated ID list; getElementById on the raw
      // value returns null for "a b" and produced a bogus error-severity finding.
      var parts = lb.split(/\s+/).map(function (ref) {
        var n = document.getElementById(ref);
        return n ? n.textContent.trim() : "";
      }).filter(Boolean);
      if (parts.length) return parts.join(" ");
    }
    if (el.id) {
      var lab = document.querySelector('label[for="' + esc(el.id) + '"]');
      if (lab && lab.textContent.trim()) return lab.textContent.trim();
    }
    var wrap = el.closest ? el.closest("label") : null;
    if (wrap && wrap.textContent.trim()) return wrap.textContent.trim();
    var txt = (el.textContent || "").trim();
    if (txt) return txt;
    var t = (el.getAttribute("title") || "").trim();
    if (t) return t;
    var ph = (el.getAttribute("placeholder") || "").trim();
    if (ph) return ph;
    var img = el.querySelector ? el.querySelector("img[alt],svg title") : null;
    if (img && (img.alt || img.textContent || "").trim()) return (img.alt || img.textContent).trim();
    return "";
  }

  function parseRGB(s) {
    var m = /rgba?\(([^)]+)\)/.exec(s || "");
    if (!m) return null;
    var p = m[1].split(",").map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }

  // Returns the effective backdrop, or null when it cannot be determined.
  //
  // Two things the naive version got wrong. A gradient or background-image
  // paints the element while `backgroundColor` stays rgba(0,0,0,0), so the walk
  // sailed past it to the page background and produced a wildly wrong ratio
  // (white-on-violet-gradient measured as ~1.07:1). And semi-transparent
  // layers were skipped outright instead of being composited. Returning null
  // for the undecidable case is deliberate: no finding beats a false one.
  function effBg(el) {
    var layers = [];
    var n = el;
    while (n && n !== document.documentElement) {
      var cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return null;
      var c = parseRGB(cs.backgroundColor);
      if (c && c.a > 0) {
        if (c.a >= 0.999) {
          // Opaque: composite everything stacked above it and stop.
          var out = c;
          for (var i = layers.length - 1; i >= 0; i--) {
            var t = layers[i];
            out = {
              r: t.r * t.a + out.r * (1 - t.a),
              g: t.g * t.a + out.g * (1 - t.a),
              b: t.b * t.a + out.b * (1 - t.a),
              a: 1,
            };
          }
          return out;
        }
        layers.push(c);
      }
      n = n.parentElement;
    }
    return null;
  }

  function lum(c) {
    function f(v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }

  function contrast(a, b) {
    var l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  // A cheap rolling hash. Measuring LENGTH cannot see an equal-length swap
  // ("Encode"->"Decode", "Show"->"Hide") or a table re-sort, both of which are
  // real reactions; hashing the content can.
  function hash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return h;
  }

  // Canvas repaints never touch innerText/innerHTML, so a canvas-only tool
  // (qr-code, color-converter, the games) would report every draw button dead.
  function canvasFingerprint() {
    var out = "";
    var list = document.querySelectorAll("canvas");
    for (var i = 0; i < list.length && i < 6; i++) {
      var c = list[i];
      out += c.width + "x" + c.height + ":";
      try {
        var ctx = c.getContext("2d");
        if (ctx && c.width && c.height) {
          var w = Math.min(c.width, 40), h = Math.min(c.height, 40);
          var d = ctx.getImageData(0, 0, w, h).data;
          var acc = 0;
          for (var j = 0; j < d.length; j += 17) acc = (acc + d[j] * (j + 1)) | 0;
          out += acc;
        }
      } catch (e) {
        out += "na";
      }
      out += ";";
    }
    return out;
  }

  function snap() {
    var vals = [];
    document.querySelectorAll("input,textarea,select").forEach(function (e) {
      vals.push(e.type === "checkbox" || e.type === "radio" ? String(e.checked) : e.value);
    });
    return {
      t: hash(document.body.innerText || ""),
      h: hash(document.body.innerHTML),
      v: hash(vals.join("\u0001")),
      c: canvasFingerprint(),
      u: location.href,
    };
  }

  function differs(a, b) {
    return a.t !== b.t || a.h !== b.h || a.v !== b.v || a.c !== b.c || a.u !== b.u;
  }

  function sampleValue(el) {
    var type = (el.getAttribute("type") || "text").toLowerCase();
    var hint = (el.id || "") + " " + (el.getAttribute("placeholder") || "") + " " + (el.name || "");
    if (type === "number") return "8";
    if (type === "email") return "user@example.com";
    if (type === "url") return "https://example.com/a";
    if (type === "date") return "2026-01-01";
    if (/json/i.test(hint)) return '{"a":1,"b":[2,3]}';
    if (/yaml|yml/i.test(hint)) return "a: 1\nb:\n  - 2";
    if (/toml/i.test(hint)) return 'a = 1\nb = "x"';
    if (/sql/i.test(hint)) return "select 1 from t where x=2";
    if (/cidr|subnet|ip/i.test(hint)) return "10.0.0.0/24";
    if (/cron/i.test(hint)) return "*/5 * * * *";
    if (/regex|pattern/i.test(hint)) return "[a-z]+";
    if (/jwt|token/i.test(hint)) return "eyJhbGciOiJIUzI1NiJ9.eyJhIjoxfQ.x";
    if (/hex/i.test(hint)) return "deadbeef";
    if (/base64/i.test(hint)) return "aGVsbG8=";
    if (/markdown|md/i.test(hint)) return "# Title\n\nbody text";
    if (/mermaid|diagram/i.test(hint)) return "graph TD; A-->B;";
    if (/csv/i.test(hint)) return "a,b\n1,2";
    if (/xml|saml/i.test(hint)) return "<r><a>1</a></r>";
    if (/css/i.test(hint)) return ".a{color:red}";
    if (/html/i.test(hint)) return "<p>hi</p>";
    if (/curl|command/i.test(hint)) return "curl https://example.com";
    if (/domain|host/i.test(hint)) return "example.com";
    if (/port/i.test(hint)) return "443";
    if (/log/i.test(hint)) return "2026-01-01 ERROR boom user@example.com";
    return "test input 123";
  }

  // Deliberately setTimeout-only. An earlier version chained through
  // requestAnimationFrame, which Safari throttles (and in an occluded or
  // background tab halts entirely), so the promise never resolved and the
  // whole probe hung with no report at all.
  function settle(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

  function fire(el, names) {
    names.forEach(function (n) {
      try {
        el.dispatchEvent(new Event(n, { bubbles: true }));
      } catch (e) {}
    });
  }

  // ---------------------------------------------------------- self-test seed
  // Injects the exact defects the audit claims to detect, so a clean run on a
  // real page cannot be confused with a probe that silently did nothing.
  if (CFG.selfTest) {
    var d = document.createElement("div");
    // The no-name button must be icon-only AND sized: an empty zero-size
    // button is filtered out by visible() before the name check ever runs.
    d.innerHTML =
      '<button id="__st_dead" style="width:40px;height:40px">dead</button>' +
      '<button id="__st_noname" style="width:40px;height:40px">' +
      '<svg width="16" height="16" aria-hidden="true"></svg></button>' +
      '<div id="__st_dup"></div><div id="__st_dup"></div>';
    document.body.appendChild(d);
  }

  // The rest of this probe MUST run after the page's own scripts have bound
  // their handlers. Tool routes bind on DOMContentLoaded; this script is
  // injected before </body> and would otherwise execute at parse time, so
  // every DOMContentLoaded-bound control would be clicked before it was live
  // and reported as a dead control. Defer to load + a settle delay.
  function beacon(phase, extra) {
    try {
      navigator.sendBeacon("/__phase", JSON.stringify({ id: CFG.id, phase: phase, extra: extra || "" }));
    } catch (e) {}
  }

  async function runAudit() {
    beacon("enter");
  // ------------------------------------------------------------- inventory
  var SEL =
    'button,[role="button"],input:not([type="hidden"]),select,textarea,summary,' +
    'a[href^="#"],[tabindex]:not([tabindex="-1"])';
  var controls = [].slice.call(document.querySelectorAll(SEL));
  var vis = controls.filter(visible);

  beacon('inventory', controls.length + ' controls');
  // ---------------------------------------------------- static design checks
  // Duplicate ids
  var ids = {};
  [].slice.call(document.querySelectorAll("[id]")).forEach(function (e) {
    ids[e.id] = (ids[e.id] || 0) + 1;
  });
  Object.keys(ids).forEach(function (k) {
    if (ids[k] > 1) add("error", "duplicate-id", 'id "' + k + '" appears ' + ids[k] + " times", null);
  });

  // Accessible names
  vis.forEach(function (el) {
    var tag = el.tagName.toLowerCase();
    if (tag === "input" && /^(hidden)$/i.test(el.type)) return;
    if (!accName(el)) {
      add("error", "no-accessible-name", tag + (el.type ? "[" + el.type + "]" : "") + " has no label, aria-label or text", el);
    }
  });

  // Exactly one h1, and no skipped heading levels
  var hs = [].slice.call(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).filter(visible);
  var h1s = hs.filter(function (h) { return h.tagName === "H1"; });
  if (h1s.length !== 1) add("error", "heading-h1-count", "expected exactly one visible <h1>, found " + h1s.length, null);
  var prev = 0;
  hs.forEach(function (h) {
    var lvl = Number(h.tagName[1]);
    if (prev && lvl > prev + 1) {
      add("warn", "heading-skip", "h" + prev + " followed by h" + lvl + ' ("' + h.textContent.trim().slice(0, 40) + '")', h);
    }
    prev = lvl;
  });

  // Tap targets (WCAG 2.2 target size minimum is 24x24 CSS px).
  // Visually-hidden skip links are deliberately 1x1 and only materialise on
  // focus, so they are exempt — flagging them is noise, not a defect.
  function srOnly(el) {
    var cs = getComputedStyle(el);
    var r = el.getBoundingClientRect();
    return (
      (r.width <= 2 && r.height <= 2) &&
      (cs.position === "absolute" || cs.position === "fixed") &&
      (cs.overflow === "hidden" || cs.clipPath !== "none")
    );
  }
  vis.forEach(function (el) {
    if (srOnly(el)) return;
    // SC 2.5.8 exempts targets inline in a sentence / constrained by line-height.
    if (el.tagName === "A" && getComputedStyle(el.parentElement || el).display.indexOf("inline") === 0) return;
    var r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 24) {
      add("warn", "small-tap-target", Math.round(r.width) + "x" + Math.round(r.height) + "px < 24x24", el);
    }
  });

  // Text contrast
  var texts = [].slice.call(document.querySelectorAll("p,span,li,td,th,label,a,button,h1,h2,h3,h4,h5,h6,div"));
  var checked = 0;
  for (var i = 0; i < texts.length && checked < 400; i++) {
    var el = texts[i];
    if (!visible(el)) continue;
    var own = "";
    for (var c = 0; c < el.childNodes.length; c++) {
      if (el.childNodes[c].nodeType === 3) own += el.childNodes[c].nodeValue;
    }
    if (own.trim().length < 2) continue;
    checked++;
    var cs = getComputedStyle(el);
    var fg = parseRGB(cs.color);
    if (!fg) continue;
    var eff = fg.a;
    var an = el;
    while (an && an !== document.documentElement) {
      eff *= parseFloat(getComputedStyle(an).opacity || "1");
      an = an.parentElement;
    }
    if (eff < 0.999) fg = { r: fg.r, g: fg.g, b: fg.b, a: eff };
    var bg = effBg(el);
    if (!bg) continue; // gradient/image backdrop — cannot measure reliably
    var cr = contrast(fg, bg);
    var px = parseFloat(cs.fontSize) || 16;
    var bold = (parseInt(cs.fontWeight, 10) || 400) >= 700;
    var large = px >= 24 || (px >= 18.66 && bold);
    var need = large ? 3 : 4.5;
    if (cr < need) {
      add("warn", "low-contrast", cr.toFixed(2) + ":1 (needs " + need + ":1) — " + own.trim().slice(0, 40), el);
    }
  }

  // Horizontal overflow of the page itself
  var de = document.documentElement;
  if (de.scrollWidth > de.clientWidth + 2) {
    add("error", "horizontal-overflow", "page scrolls horizontally: " + de.scrollWidth + " > " + de.clientWidth, null);
  }

  // DESIGN.md contract: a .tool-group must not paint its own surface
  [].slice.call(document.querySelectorAll(".tool-group")).forEach(function (el) {
    if (el.classList.contains("tool-group--inset")) return;
    var bg = getComputedStyle(el).backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
      add("error", "tool-group-filled", ".tool-group paints " + bg + " (contract: no fill)", el);
    }
  });

  // Component contract: buttons/inputs should use .btn*/.input rather than
  // hand-rolled utility stacks.
  [].slice.call(document.querySelectorAll("button")).filter(visible).forEach(function (el) {
    var cl = el.className || "";
    if (typeof cl !== "string") return;
    if (/\bbtn\b|\bbtn-/.test(cl)) return;
    if (/\btab\b|tab-btn|-tab\b/.test(cl)) return; // tabs are their own component
    if (el.closest("[role=tablist]")) return;
    if (/\b(px|py|p)-\d/.test(cl) && /\b(bg-|border)/.test(cl)) {
      add("info", "handrolled-button", "button styled with utilities instead of .btn*: " + cl.slice(0, 70), el);
    }
  });
  [].slice.call(document.querySelectorAll("input,textarea,select")).filter(visible).forEach(function (el) {
    var cl = el.className || "";
    if (typeof cl !== "string") return;
    if (/\binput\b|input-mono/.test(cl)) return;
    if (/^(checkbox|radio|range|color|file|hidden)$/i.test(el.type || "")) return;
    if (/\b(px|py|p)-\d/.test(cl) && /\b(bg-|border)/.test(cl)) {
      add("info", "handrolled-input", el.tagName.toLowerCase() + " styled with utilities instead of .input: " + cl.slice(0, 70), el);
    }
  });

  // NOTE: a focus-visibility check used to live here and was removed.
  // It called el.focus() and diffed computed style, but :focus-visible is
  // modality-driven — programmatic focus does not match it — so it reported
  // 377 violations across 42 tools against the global rule in
  // styles/input.css that already covers exactly the elements it sampled.
  // It also could not tell a real ring from Tailwind's
  // `focus-visible:outline-none`, which compiles to a TRANSPARENT 2px outline.
  // Runtime programmatic focus is the wrong instrument; assert the CSS rule
  // statically instead.

  // ------------------------------------------------- interactive activation

  // Pages with a live timer (caffeinate, timestamp-converter, webhook-debugger,
  // regex-visualizer) mutate on their own between the before/after snapshots, so
  // EVERY click would look alive and a genuinely dead control would pass
  // silently. That false-pass is more dangerous than a false alarm, so detect
  // self-mutation first and suppress the dead-control assertion when present.
  beacon('static-done');
  var idleA = snap();
  await settle(700);
  var selfMutating = differs(idleA, snap());
  if (selfMutating) {
    add("info", "self-mutating-page", "page changes on its own (timer/animation); dead-control detection suppressed here", null);
  }

  // markdown-editor's print/export opens a window, which becomes Safari's
  // `document 1`. The driver then navigates the POPUP instead of the audit tab
  // and every later tool reports NO REPORT. Neutralise those APIs for the run.
  try {
    window.open = function () { return null; };
    window.print = function () {};
  } catch (e) {}

  // Clicking a <button type="submit"> inside a <form> NAVIGATES the page. The
  // probe then dies before reporting, and — worse — Safari's `document 1` ends
  // up pointing at a different tab than the driver is navigating, so every
  // subsequent tool reports NO REPORT. Block navigation for the run.
  document.addEventListener("submit", function (e) { e.preventDefault(); }, true);
  document.addEventListener(
    "click",
    function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (a.target === "_blank" || (href && href.charAt(0) !== "#")) e.preventDefault();
    },
    true,
  );

  var activated = 0;
  var selectOptions = 0;

  beacon('idle-check-done', String(selfMutating));
  // 1. Fill every text-ish field so downstream actions have real input.
  //
  //    seedInputs() is re-run before EVERY button activation. Without that the
  //    sequence is order-dependent and self-poisoning: one "Clear" click empties
  //    the editor, and every button after it then hits the same "please enter
  //    input" branch, produces an identical DOM, and is misreported as a dead
  //    control. Re-seeding makes each control's test independent.
  function seedInputs(countIt) {
    vis.forEach(function (el) {
      var tag = el.tagName.toLowerCase();
      if (tag !== "input" && tag !== "textarea") return;
      var type = (el.getAttribute("type") || "text").toLowerCase();
      if (/^(checkbox|radio|file|hidden|submit|button|image|reset)$/.test(type)) return;
      if (el.disabled || el.readOnly) return;
      try {
        el.value = sampleValue(el);
        fire(el, ["input", "change", "keyup"]);
        if (countIt) activated++;
      } catch (e) {
        add("error", "input-threw", "setting value threw: " + e.message, el);
      }
    });
  }
  seedInputs(true);

  // 2. Cycle every select through all options.
  vis.filter(function (e) { return e.tagName === "SELECT" && !e.disabled; }).forEach(function (sel) {
    var original = sel.value;
    for (var oi = 0; oi < sel.options.length; oi++) {
      try {
        sel.value = sel.options[oi].value;
        fire(sel, ["input", "change"]);
        selectOptions++;
      } catch (e) {
        add("error", "select-threw", 'option "' + sel.options[oi].value + '" threw: ' + e.message, sel);
      }
    }
    try {
      sel.value = original;
      fire(sel, ["input", "change"]);
    } catch (e) {}
    activated++;
  });

  // 3. Toggle every checkbox/radio.
  vis.filter(function (e) {
    return e.tagName === "INPUT" && /^(checkbox|radio)$/i.test(e.type) && !e.disabled;
  }).forEach(function (el) {
    var before = snap();
    try {
      el.click();
      activated++;
    } catch (e) {
      add("error", "toggle-threw", "click threw: " + e.message, el);
      return;
    }
    var after = snap();
    if (!differs(before, after)) {
      add("warn", "dead-control", "toggling changed nothing in the DOM", el);
    }
  });

  // 4. Activate every button individually and require the DOM to react.
  //    A control wired to nothing is the defect this audit exists to find.
  //    Copy/download/share write to the clipboard or filesystem, so producing
  //    no DOM change is correct behaviour, not a dead control. Excluded from
  //    the reaction assertion but still clicked, so a throw is still caught.
  var NO_DOM_EFFECT = /copy|download|clipboard|print|share|save|export/i;
  var buttons = vis.filter(function (e) {
    return (e.tagName === "BUTTON" || e.getAttribute("role") === "button" || e.tagName === "SUMMARY") && !e.disabled;
  });
  beacon('clicking', buttons.length + ' buttons');
  for (var bi = 0; bi < buttons.length; bi++) {
    var el = buttons[bi];
    var name = (accName(el) + " " + (el.id || "")).trim();
    // A node detached by an earlier interaction can never react to a click.
    // That is a stale probe reference, not a defect in the control, so it is
    // reported as its own kind rather than being counted as a dead control.
    if (!el.isConnected) {
      add("info", "detached-before-click", '"' + name.slice(0, 40) + '" was removed from the DOM by an earlier interaction', el);
      continue;
    }
    seedInputs(false);
    await settle(120);
    var before = snap();
    try {
      el.click();
      activated++;
    } catch (e) {
      add("error", "click-threw", '"' + name.slice(0, 40) + '" threw: ' + e.message, el);
      continue;
    }
    // An async handler runs synchronously only up to its first await; the DOM
    // write lands in a later microtask. Measuring in the same tick reported
    // every one of the 31 async click handlers in this codebase as dead.
    await settle(250);
    var after = snap();
    if (!differs(before, after) && !NO_DOM_EFFECT.test(name) && !selfMutating) {
      add(
        "warn",
        "dead-control",
        '"' + name.slice(0, 40) + '" click changed nothing (no text/html/value/canvas/url delta after 400ms)',
        el,
      );
    }
  }

  beacon('clicks-done');
  // ------------------------------------------------------------------ report
  function send() {
    var payload = JSON.stringify({
      id: CFG.id,
      findings: F,
      inventory: {
        total: controls.length,
        visible: vis.length,
        activated: activated,
        selectOptions: selectOptions,
        buttons: buttons.length,
      },
    });
    var sent = false;
    try {
      sent = navigator.sendBeacon("/__audit", payload);
    } catch (e) {
      sent = false;
    }
    if (!sent) {
      // sendBeacon returns FALSE (does not throw) when the payload is too
      // large or the queue is full, so the report was being lost silently.
      var x = new XMLHttpRequest();
      x.open("POST", "/__audit", true);
      x.setRequestHeader("content-type", "text/plain");
      x.send(payload);
    }
  }

  // Let async handlers settle, then re-check overflow (content may have grown).
  setTimeout(function () {
    if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 2) {
      add("error", "horizontal-overflow", "page scrolls horizontally after interaction", null);
    }
    send();
  }, 2500);
  }

  function start() {
    // 1200ms after load covers deferred init and any rAF-scheduled setup.
    // runAudit is async: an unhandled rejection would make the probe vanish and
    // surface only as an unexplained "no report", so failures are caught and
    // reported as a finding.
    setTimeout(function () {
      runAudit().catch(function (e) {
        add("error", "probe-threw", String((e && e.stack) || e).slice(0, 200), null);
        try { send(); } catch (e2) {}
      });
    }, 1200);
  }
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
})();
