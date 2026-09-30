// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createRichEditorPane } from "./rich-editor.js";
import { handlersById } from "../routes/_handlers.js";
import { TOOLS } from "./tool-registry.js";

/**
 * Placeholders in this app are code samples — JSON, SQL, Mermaid — that
 * legitimately contain `"`, `<`, `>` and `&`. They were interpolated into a
 * double-quoted attribute unescaped, so the JSON sample rendered as
 * placeholder="{" and the remainder ("name": "SimpleTool", ...) was parsed by
 * the browser as stray attributes on the <textarea>.
 *
 * The user-visible symptom was a placeholder showing a single "{". Nothing
 * threw, every test passed, and the smoke suite reported the page clean —
 * which is why this needs its own assertion.
 */
describe("rich editor placeholder escaping", () => {
  it("escapes quotes, angle brackets and ampersands in the placeholder", () => {
    const html = createRichEditorPane({
      id: "t",
      mode: "textarea",
      placeholder: '{"a": 1} & <b> --> c',
    });
    const match = html.match(/placeholder="([^"]*)"/);
    expect(match, "placeholder attribute should be present and well-formed").toBeTruthy();
    expect(match[1]).toBe("{&quot;a&quot;: 1} &amp; &lt;b&gt; --&gt; c");
  });

  it("does not let a placeholder inject extra attributes", () => {
    const html = createRichEditorPane({
      id: "t",
      mode: "textarea",
      placeholder: '" onfocus="alert(1)',
    });
    const tag = html.match(/<textarea[^>]*>/)[0];
    // `onfocus=` legitimately survives as INERT TEXT inside the escaped value
    // (placeholder="&quot; onfocus=&quot;..."). What must not happen is a real
    // attribute, so strip the placeholder value before asserting.
    const withoutPlaceholder = tag.replace(/placeholder="[^"]*"/, "");
    expect(withoutPlaceholder).not.toMatch(/\sonfocus=/);
    expect(tag).toMatch(/placeholder="&quot; onfocus=&quot;alert\(1\)"/);
  });

  it("no rendered tool page has a placeholder-injected stray attribute", async () => {
    const offenders = [];
    for (const tool of TOOLS) {
      const handler = handlersById[tool.id];
      if (!handler) continue;
      const url = new URL(`https://simpletool.app${tool.path}`);
      const response = await handler(new Request(url, { method: "GET" }), url);
      if (response.status !== 200) continue;
      const html = await response.text();
      for (const tag of html.match(/<(?:textarea|input)\b[^>]*>/g) ?? []) {
        // A well-formed tag has no bare `":` sequence and no attribute name
        // that starts mid-sample. The tell-tale of the original bug was a
        // truncated placeholder immediately followed by junk like `name=": `.
        if (/placeholder="[^"]*"\s*[^\s/>=]+=":/.test(tag)) {
          offenders.push(`${tool.id}: ${tag.slice(0, 120)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
