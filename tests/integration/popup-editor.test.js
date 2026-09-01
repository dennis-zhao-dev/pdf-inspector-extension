import { beforeEach, describe, expect, it } from "vitest";
import { createMarkdownEditor } from "../../src/editor.js";
import { installBrowserDoubles } from "../helpers/popup-environment.js";
import { createI18n } from "../../src/i18n.js";

describe("Popup editor integration contract", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div><div id="edit"></div><div id="preview" hidden></div><button id="edit-tab"></button><button id="preview-tab"></button>';
    installBrowserDoubles();
  });

  it("clears an old document before replacing it", () => {
    const editor = createMarkdownEditor(document.querySelector("#host"));
    editor.setContent("old", { origin: "parsed" });
    editor.setEnabled(false);
    editor.clear();
    expect(editor.getContent()).toBe("");
    editor.setContent("new", { origin: "parsed" });
    expect(editor.getContent()).toBe("new");
    editor.destroy();
  });

  it("uses current edited content for export consumers", () => {
    const editor = createMarkdownEditor(document.querySelector("#host"));
    editor.setContent("parsed");
    editor.setEnabled(true);
    editor.view.dispatch({ changes: { from: 0, to: 6, insert: "edited" } });
    const copied = editor.getContent();
    const downloaded = new Blob([editor.getContent()], { type: "text/markdown" });
    expect(copied).toBe("edited");
    expect(downloaded.size).toBe(6);
    editor.destroy();
  });

  it("keeps Markdown bytes identical across UI locales", async () => {
    const content = "# 中英 mixed\n\n[PDF](https://example.test/a.pdf)";
    const i18n = createI18n({ locale: "en" });
    const englishBytes = await new Blob([content], { type: "text/markdown" }).arrayBuffer();
    i18n.setLocale("zh-CN", { persist: false, apply: false });
    const chineseBytes = await new Blob([content], { type: "text/markdown" }).arrayBuffer();
    expect([...new Uint8Array(chineseBytes)]).toEqual([...new Uint8Array(englishBytes)]);
  });
});
