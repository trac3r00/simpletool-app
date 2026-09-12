// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleCaffeinateRoutes } from "./caffeinate.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

function eventTarget(extra = {}) {
  const listeners = new Map();
  return {
    ...extra,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    async emit(type, event = {}) {
      const results = [...(listeners.get(type) || [])].map((listener) =>
        listener(event),
      );
      await Promise.all(results);
    },
  };
}

function element(id) {
  const classes = new Set();
  return eventTarget({
    id,
    textContent: "",
    disabled: false,
    attributes: {},
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  });
}

function sentinel({ released = false } = {}) {
  const accepted = deferred();
  const releasedByOwner = deferred();
  const lock = eventTarget({ released });
  const addEventListener = lock.addEventListener.bind(lock);
  lock.addEventListener = (type, listener) => {
    addEventListener(type, listener);
    if (type === "release") accepted.resolve();
  };
  lock.accepted = accepted.promise;
  lock.releasedByOwner = releasedByOwner.promise;
  lock.release = vi.fn(async () => {
    if (!lock.released) {
      lock.released = true;
      await lock.emit("release");
    }
    releasedByOwner.resolve();
  });
  lock.browserRelease = async () => {
    lock.released = true;
    await lock.emit("release");
  };
  return lock;
}

async function renderScript() {
  const url = new URL("https://simpletool.test/caffeinate");
  const response = await handleCaffeinateRoutes(new Request(url), url);
  const html = await response.text();
  const scripts = [
    ...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g),
  ].map((match) => match[1]);
  return scripts.find((script) => script.includes("navigator.wakeLock"));
}

function bootstrap(script, request) {
  const elements = new Map();
  const byId = (id) => {
    if (!elements.has(id)) elements.set(id, element(id));
    return elements.get(id);
  };
  const document = eventTarget({
    visibilityState: "visible",
    hasFocus: () => false,
    getElementById: byId,
    createElement: vi.fn(() => {
      throw new Error("Caffeinate must not claim an unplayable video fallback");
    }),
    body: { appendChild: vi.fn() },
  });
  const window = eventTarget({});
  const navigator = { wakeLock: { request } };

  new Function("window", "document", "navigator", script)(
    window,
    document,
    navigator,
  );

  return { byId, document, window };
}

describe("caffeinate wake lock lifecycle", () => {
  let script;

  beforeEach(async () => {
    vi.useFakeTimers();
    script = await renderScript();
    expect(script).toBeTruthy();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("restores a browser-released lock when the page is visible but unfocused", async () => {
    const first = sentinel();
    const second = sentinel();
    const request = vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    const page = bootstrap(script, request);

    await page.byId("toggle-btn").emit("click");
    await first.browserRelease();
    await vi.advanceTimersByTimeAsync(1000);
    await second.accepted;

    expect(request).toHaveBeenCalledTimes(2);
    expect(page.byId("status-panel").classList.contains("border-primary-400")).toBe(true);
    expect(page.byId("stat-mode").textContent).toBe("native");
    expect(page.byId("toggle-btn").attributes["data-i18n"]).toBe(
      "tools.caffeinate.ui.button1",
    );
  });

  it("coalesces release, visibility, pageshow, and focus recovery while acquisition is pending", async () => {
    const first = sentinel();
    const pending = deferred();
    const second = sentinel();
    const request = vi
      .fn()
      .mockResolvedValueOnce(first)
      .mockReturnValueOnce(pending.promise);
    const page = bootstrap(script, request);

    await page.byId("toggle-btn").emit("click");
    await first.browserRelease();
    await page.document.emit("visibilitychange");
    await page.window.emit("pageshow");
    await page.window.emit("focus");
    await vi.advanceTimersByTimeAsync(1000);

    expect(request).toHaveBeenCalledTimes(2);
    pending.resolve(second);
    await second.accepted;
    expect(page.byId("stat-mode").textContent).toBe("native");
  });

  it("starts a fresh request when stopped and reactivated during pending recovery", async () => {
    const first = sentinel();
    const obsoleteRequest = deferred();
    const obsoleteLock = sentinel();
    const current = sentinel();
    const request = vi
      .fn()
      .mockResolvedValueOnce(first)
      .mockReturnValueOnce(obsoleteRequest.promise)
      .mockResolvedValueOnce(current);
    const page = bootstrap(script, request);

    await page.byId("toggle-btn").emit("click");
    await first.browserRelease();
    await vi.advanceTimersByTimeAsync(500);
    expect(request).toHaveBeenCalledTimes(2);

    await page.byId("toggle-btn").emit("click");
    const reactivation = page.byId("toggle-btn").emit("click");

    expect(request).toHaveBeenCalledTimes(3);
    await current.accepted;
    obsoleteRequest.resolve(obsoleteLock);
    await reactivation;
    await obsoleteLock.releasedByOwner;

    expect(obsoleteLock.release).toHaveBeenCalledTimes(1);
    expect(page.byId("stat-mode").textContent).toBe("native");
  });

  it("keeps user intent and reacquires when a pending request resolves after the page hides", async () => {
    const pending = deferred();
    const stale = sentinel();
    const current = sentinel();
    const request = vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(current);
    const page = bootstrap(script, request);

    const activation = page.byId("toggle-btn").emit("click");
    page.document.visibilityState = "hidden";
    await page.document.emit("visibilitychange");
    pending.resolve(stale);
    await activation;

    expect(stale.release).toHaveBeenCalledTimes(1);
    expect(page.byId("toggle-btn").attributes["data-i18n"]).toBe(
      "tools.caffeinate.ui.button1",
    );

    page.document.visibilityState = "visible";
    await page.document.emit("visibilitychange");
    await vi.advanceTimersByTimeAsync(500);
    await current.accepted;

    expect(request).toHaveBeenCalledTimes(2);
    expect(page.byId("status-panel").classList.contains("border-primary-400")).toBe(true);
  });

  it.each(["manual stop", "pagehide"])(
    "invalidates and releases a late sentinel after %s",
    async (stop) => {
      const held = sentinel();
      const pending = deferred();
      const late = sentinel();
      const restored = sentinel();
      const request = vi
        .fn()
        .mockResolvedValueOnce(held)
        .mockReturnValueOnce(pending.promise)
        .mockResolvedValueOnce(restored);
      const page = bootstrap(script, request);

      await page.byId("toggle-btn").emit("click");
      await held.browserRelease();
      await vi.advanceTimersByTimeAsync(500);
      expect(page.byId("toggle-btn").disabled).toBe(false);
      expect(request).toHaveBeenCalledTimes(2);

      if (stop === "manual stop") {
        await page.byId("toggle-btn").emit("click");
      } else {
        await page.window.emit("pagehide");
      }
      pending.resolve(late);
      await late.releasedByOwner;

      expect(late.release).toHaveBeenCalledTimes(1);
      expect(page.byId("status-panel").classList.contains("border-primary-400")).toBe(false);
      expect(page.byId("toggle-btn").attributes["data-i18n"]).toBe(
        stop === "manual stop"
          ? "tools.caffeinate.ui.button0"
          : "tools.caffeinate.ui.button1",
      );

      if (stop === "pagehide") {
        await page.window.emit("pageshow");
        await vi.advanceTimersByTimeAsync(500);
        await restored.accepted;
        expect(request).toHaveBeenCalledTimes(3);
        expect(page.byId("stat-mode").textContent).toBe("native");
      }
    },
  );

  it("never reports an already-released sentinel as active", async () => {
    const request = vi.fn().mockResolvedValue(sentinel({ released: true }));
    const page = bootstrap(script, request);

    await page.byId("toggle-btn").emit("click");

    expect(page.byId("status-panel").classList.contains("border-primary-400")).toBe(false);
    expect(page.byId("toggle-btn").attributes["data-i18n"]).toBe(
      "tools.caffeinate.ui.button1",
    );
  });

  it("surfaces native request rejection without advertising a fallback lock", async () => {
    const request = vi.fn().mockRejectedValue(new Error("permission denied"));
    const page = bootstrap(script, request);

    await page.byId("toggle-btn").emit("click");

    expect(page.byId("status-text").textContent).toContain("permission denied");
    expect(page.byId("status-panel").classList.contains("border-error-400")).toBe(true);
    expect(page.document.createElement).not.toHaveBeenCalled();
  });
});
