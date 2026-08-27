// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { handleImageConverterRoutes } from "./image-converter.js";

/**
 * The whole point of this tool is upload -> preview -> resize -> convert ->
 * download, and for twelve commits the page shipped with NO inline script at
 * all: `content(tools): add educational sections to 30+ tools` (6e1295c)
 * deleted the entire block. Every static check still passed — the markup, the
 * shell, the headings and the i18n keys were all intact — so nothing failed
 * except the tool, where picking a file left "Convert & Resize Image" disabled
 * forever.
 *
 * A markup-only assertion would not have caught that, so this drives the real
 * inline script through a minimal DOM stub instead: pick a file, convert,
 * download, and assert the state each step is supposed to produce.
 */

async function renderPage() {
  const url = new URL("https://simpletool.test/image-converter");
  const response = await handleImageConverterRoutes(new Request(url), url);
  return response.text();
}

function extractToolScript(html) {
  const blocks = [
    ...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g),
  ].map((match) => match[1]);
  return blocks.find((block) => block.includes("format-option"));
}

function makeElement(id) {
  const classes = new Set();
  return {
    id,
    dataset: {},
    style: {},
    attributes: {},
    listeners: {},
    value: "",
    checked: false,
    disabled: false,
    textContent: "",
    src: "",
    href: "",
    download: "",
    width: 0,
    height: 0,
    files: null,
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
      toggle(name, force) {
        const on = force === undefined ? !classes.has(name) : Boolean(force);
        if (on) classes.add(name);
        else classes.delete(name);
        return on;
      },
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    getAttribute(name) {
      return this.attributes[name];
    },
    addEventListener(type, handler) {
      (this.listeners[type] ||= []).push(handler);
    },
    fire(type, event = {}) {
      (this.listeners[type] || []).forEach((handler) => handler(event));
    },
    click() {
      this.fire("click", {});
    },
    remove() {},
  };
}

/**
 * Runs the page's inline script against stub globals and hands back the pieces
 * a test needs to poke at it.
 */
function bootstrap(script, { imageSize = { width: 120, height: 80 } } = {}) {
  const elements = new Map();
  const byId = (id) => {
    if (!elements.has(id)) elements.set(id, makeElement(id));
    return elements.get(id);
  };

  const formatButtons = ["png", "jpeg", "webp"].map((format) => {
    const button = makeElement(`format-${format}`);
    button.dataset.format = format;
    if (format === "png") button.classList.add("selected");
    return button;
  });

  byId("convert-btn").disabled = true;
  byId("download-btn").disabled = true;
  byId("quality-slider").value = "90";
  byId("scale-slider").value = "100";
  byId("resize-mode").value = "none";
  byId("maintain-aspect").checked = true;

  const ctxCalls = [];
  const canvas = byId("converted-canvas");
  canvas.getContext = () => ({
    clearRect: (...args) => ctxCalls.push(["clearRect", ...args]),
    fillRect: (...args) => ctxCalls.push(["fillRect", ...args]),
    drawImage: (...args) => ctxCalls.push(["drawImage", ...args.slice(1)]),
    set fillStyle(value) {
      ctxCalls.push(["fillStyle", value]);
    },
    set imageSmoothingEnabled(value) {
      ctxCalls.push(["imageSmoothingEnabled", value]);
    },
    set imageSmoothingQuality(value) {
      ctxCalls.push(["imageSmoothingQuality", value]);
    },
  });

  const encodeCalls = [];
  let blobSize = 4096;
  canvas.toBlob = (callback, mime, quality) => {
    encodeCalls.push({ mime, quality });
    callback({ size: blobSize, type: mime });
  };

  const createdLinks = [];
  const documentStub = {
    getElementById: byId,
    querySelectorAll: (selector) =>
      selector === ".format-option" ? formatButtons : [],
    createElement: (tag) => {
      const element = makeElement(`created-${tag}`);
      if (tag === "a") createdLinks.push(element);
      return element;
    },
    body: { appendChild() {} },
  };

  function FileReaderStub() {}
  FileReaderStub.prototype.readAsDataURL = function readAsDataURL(file) {
    this.onload({ target: { result: `data:${file.type};base64,AAAA` } });
  };

  function ImageStub() {
    let source = "";
    Object.defineProperty(this, "src", {
      get: () => source,
      set: (value) => {
        source = value;
        this.naturalWidth = imageSize.width;
        this.naturalHeight = imageSize.height;
        if (this.onload) this.onload();
      },
    });
  }

  const urlStub = {
    createObjectURL: () => "blob:stub",
    revokeObjectURL: () => {},
  };

  // eslint-disable-next-line no-new-func -- executing the page's own script is the point
  new Function("window", "document", "FileReader", "Image", "URL", script)(
    {},
    documentStub,
    FileReaderStub,
    ImageStub,
    urlStub,
  );

  const selectFile = (file) => {
    const input = byId("file-input");
    input.files = [file];
    input.fire("change", {});
  };

  return {
    byId,
    formatButtons,
    ctxCalls,
    encodeCalls,
    createdLinks,
    selectFile,
    setBlobSize: (size) => {
      blobSize = size;
    },
  };
}

const PNG_FILE = { name: "photo.png", type: "image/png", size: 8192 };

describe("image converter page", () => {
  let html;
  let script;

  beforeEach(async () => {
    html = await renderPage();
    script = extractToolScript(html);
  });

  it("ships an inline conversion script that parses", () => {
    expect(script).toBeTruthy();
    expect(() => new Function(script)).not.toThrow();
    // A stray `${` would mean the server template swallowed part of the script.
    expect(script).not.toContain("${");
  });

  it("binds the pipeline with listeners, never inline handlers", () => {
    expect(html).not.toMatch(/\son(click|change|input|drop)=/);
    expect(script).toContain("fileInput.addEventListener('change'");
    expect(script).toContain("convertBtn.addEventListener('click'");
    expect(script).toContain("downloadBtn.addEventListener('click'");
  });

  it("enables convert and shows the preview once a file is selected", () => {
    const page = bootstrap(script);
    expect(page.byId("convert-btn").disabled).toBe(true);

    page.selectFile(PNG_FILE);

    expect(page.byId("convert-btn").disabled).toBe(false);
    expect(page.byId("original-preview").classList.contains("hidden")).toBe(
      false,
    );
    expect(page.byId("original-placeholder").classList.contains("hidden")).toBe(
      true,
    );
    expect(page.byId("file-name").textContent).toBe("photo.png");
    expect(page.byId("image-dimensions").textContent).toBe("120 x 80px");
  });

  it("accepts a dropped file as well as one chosen from the input", () => {
    const page = bootstrap(script);

    page.byId("drop-zone").fire("drop", {
      preventDefault() {},
      dataTransfer: { files: [PNG_FILE] },
    });

    expect(page.byId("convert-btn").disabled).toBe(false);
  });

  it("rejects a non-image file in-page and leaves convert disabled", () => {
    const page = bootstrap(script);

    page.selectFile({ name: "notes.txt", type: "text/plain", size: 12 });

    expect(page.byId("convert-btn").disabled).toBe(true);
    expect(page.byId("img-error").classList.contains("hidden")).toBe(false);
    expect(page.byId("img-error").textContent).toMatch(/valid image/i);
  });

  it("converts to the selected format and enables a matching download", () => {
    const page = bootstrap(script);
    page.setBlobSize(2048);
    page.selectFile(PNG_FILE);

    page.formatButtons[1].fire("click", {}); // JPG
    page.byId("convert-btn").click();

    expect(page.encodeCalls).toEqual([{ mime: "image/jpeg", quality: 0.9 }]);
    expect(page.byId("converted-format").textContent).toBe("JPEG");
    expect(page.byId("converted-size").textContent).toBe("2 KB");
    expect(page.byId("converted-dimensions").textContent).toBe("120 x 80px");
    expect(page.byId("size-reduction").textContent).toMatch(/Smaller by 75.0%/);
    expect(page.byId("converted-canvas").classList.contains("hidden")).toBe(
      false,
    );

    const download = page.byId("download-btn");
    expect(download.disabled).toBe(false);
    download.click();
    expect(page.createdLinks).toHaveLength(1);
    expect(page.createdLinks[0].download).toBe("photo-converted.jpg");
  });

  it("paints a white background before drawing when the target is JPEG", () => {
    const page = bootstrap(script);
    page.selectFile(PNG_FILE);
    page.formatButtons[1].fire("click", {});
    page.byId("convert-btn").click();

    const names = page.ctxCalls.map((call) => call[0]);
    expect(names.indexOf("fillRect")).toBeGreaterThan(-1);
    expect(names.indexOf("fillRect")).toBeLessThan(names.indexOf("drawImage"));
    expect(page.ctxCalls).toContainEqual(["fillStyle", "#ffffff"]);
  });

  it("leaves the canvas untinted for PNG output", () => {
    const page = bootstrap(script);
    page.selectFile(PNG_FILE);
    page.byId("convert-btn").click();

    expect(page.ctxCalls.map((call) => call[0])).not.toContain("fillRect");
    expect(page.encodeCalls).toEqual([{ mime: "image/png", quality: undefined }]);
  });

  it("resizes by percentage", () => {
    const page = bootstrap(script);
    page.selectFile(PNG_FILE);

    const mode = page.byId("resize-mode");
    mode.value = "percentage";
    mode.fire("change", {});
    page.byId("scale-slider").value = "50";
    page.byId("convert-btn").click();

    expect(page.byId("converted-canvas").width).toBe(60);
    expect(page.byId("converted-canvas").height).toBe(40);
    expect(page.byId("converted-dimensions").textContent).toBe("60 x 40px");
  });

  it("clamps to max dimensions while keeping the aspect ratio", () => {
    const page = bootstrap(script);
    page.selectFile(PNG_FILE);

    const mode = page.byId("resize-mode");
    mode.value = "max-dimensions";
    mode.fire("change", {});
    page.byId("max-width").value = "60";
    page.byId("convert-btn").click();

    expect(page.byId("converted-canvas").width).toBe(60);
    expect(page.byId("converted-canvas").height).toBe(40);
  });

  it("reports the format the canvas actually produced, not the one requested", () => {
    const page = bootstrap(script);
    page.selectFile(PNG_FILE);

    // A browser that cannot encode the requested type silently returns PNG.
    const canvas = page.byId("converted-canvas");
    canvas.toBlob = (callback) => callback({ size: 1024, type: "image/png" });

    page.formatButtons[2].fire("click", {}); // WebP
    page.byId("convert-btn").click();

    expect(page.byId("converted-format").textContent).toBe("PNG");
    page.byId("download-btn").click();
    expect(page.createdLinks[0].download).toBe("photo-converted.png");
  });

  it("only advertises formats a canvas can actually encode", () => {
    // Canvas has no GIF encoder, so neither the format picker nor the copy may
    // offer one — a .gif download that is really a PNG is the dishonest failure
    // this guards against.
    expect(html).not.toMatch(/data-format="gif"/);
    expect(html).not.toMatch(/>\s*Animation\s*</);
    expect(script).not.toContain("image/gif");

    const formats = [...html.matchAll(/data-format="([a-z]+)"/g)].map(
      (match) => match[1],
    );
    expect(formats).toEqual(["png", "jpeg", "webp"]);
  });
});
