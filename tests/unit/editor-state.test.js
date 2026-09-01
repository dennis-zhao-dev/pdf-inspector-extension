import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMarkdownEditor } from "../../src/editor.js";
import { installBrowserDoubles } from "../helpers/popup-environment.js";
import { contentHash, createLargeMarkdown } from "../fixtures/large-markdown.js";

describe("EditorController", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div><div id="edit"></div><div id="preview" hidden></div><button id="edit-tab"></button><button id="preview-tab"></button>';
    installBrowserDoubles();
  });

  it("sets, edits, clears, and destroys canonical content", () => {
    const onChange = vi.fn();
    const editor = createMarkdownEditor(document.querySelector("#host"), { onChange });
    editor.setContent("# start", { origin: "parsed" });
    expect(editor.getContent()).toBe("# start");
    expect(editor.getOrigin()).toBe("parsed");
    editor.setEnabled(true);
    editor.view.dispatch({ changes: { from: editor.view.state.doc.length, insert: "!" } });
    expect(editor.getContent()).toBe("# start!");
    expect(editor.getOrigin()).toBe("user");
    editor.clear();
    expect(editor.hasContent()).toBe(false);
    expect(() => { editor.destroy(); editor.destroy(); }).not.toThrow();
  });

  it("formats one transaction and renders a revision-cached preview", async () => {
    const editor = createMarkdownEditor(document.querySelector("#host"), {
      editorPanel: document.querySelector("#edit"),
      previewPanel: document.querySelector("#preview"),
      editTab: document.querySelector("#edit-tab"),
      previewTab: document.querySelector("#preview-tab")
    });
    editor.setContent("text");
    editor.setEnabled(true);
    editor.view.dispatch({ selection: { anchor: 0, head: 4 } });
    editor.applyFormat("bold");
    expect(editor.getContent()).toBe("**text**");
    await editor.showPreview();
    expect(document.querySelector("#preview strong")?.textContent).toBe("text");
    editor.showEdit();
    expect(document.querySelector("#edit").hasAttribute("hidden")).toBe(false);
    editor.destroy();
  });

  it("preserves an exact 500,000-character document", () => {
    const editor = createMarkdownEditor(document.querySelector("#host"));
    const source = createLargeMarkdown();
    const startedAt = performance.now();
    editor.setContent(source, { origin: "parsed" });
    const loaded = editor.getContent();
    expect(performance.now() - startedAt).toBeLessThan(2_000);
    expect(loaded).toHaveLength(500_000);
    expect(contentHash(loaded)).toBe(contentHash(source));
    editor.destroy();
  });

  it("updates accessible messages without recreating editor state", () => {
    const editor = createMarkdownEditor(document.querySelector("#host"));
    editor.setContent("keep **this**", { origin: "parsed" });
    editor.setEnabled(true);
    editor.view.dispatch({ selection: { anchor: 5, head: 13 } });
    const stateBefore = editor.view.state;
    editor.setLocalizedMessages({ editorLabel: "Markdown 编辑器", previewError: "预览失败" });
    expect(editor.getContent()).toBe("keep **this**");
    expect(editor.view.state.selection.main.from).toBe(5);
    expect(editor.view.contentDOM.getAttribute("aria-label")).toBe("Markdown 编辑器");
    expect(editor.view.state).not.toBe(stateBefore);
    editor.view.dispatch({ changes: { from: editor.view.state.doc.length, insert: "!" } });
    expect(editor.getContent()).toBe("keep **this**!");
    editor.view.dispatch({ userEvent: "undo" });
    editor.destroy();
  });
});
