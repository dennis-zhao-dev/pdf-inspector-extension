import { basicSetup, EditorView } from "codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { Compartment } from "@codemirror/state";
import { createFormatChange } from "./markdown-format.js";
import { renderMarkdownPreview } from "./markdown-preview.js";

export function createMarkdownEditor(host, options = {}) {
  const editable = new Compartment();
  const accessibility = new Compartment();
  let enabled = false;
  let revision = 0;
  let origin = "empty";
  let previewedRevision = null;
  let lastSelection = { anchor: 0, head: 0 };
  let destroyed = false;
  let programmaticOrigin = null;
  let localizedMessages = {
    editorLabel: options.editorLabel || "Extracted result Markdown editor",
    previewError: options.previewError || "Unable to generate the preview. Return to edit mode and check the content."
  };
  let previewErrorNode = null;

  const view = new EditorView({
    parent: host,
    extensions: [
      basicSetup,
      markdown(),
      editable.of(EditorView.editable.of(false)),
      accessibility.of(EditorView.contentAttributes.of({
        "aria-label": localizedMessages.editorLabel,
        spellcheck: "false"
      })),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;
        revision += 1;
        origin = programmaticOrigin || "user";
        previewedRevision = null;
        options.onChange?.(update.state.doc.toString(), { revision, origin });
      })
    ]
  });

  function getContent() {
    return view.state.doc.toString();
  }

  function setContent(content, metadata = {}) {
    const value = String(content ?? "");
    programmaticOrigin = metadata.origin || "parsed";
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
      selection: { anchor: 0 }
    });
    origin = programmaticOrigin;
    programmaticOrigin = null;
  }

  function clear() {
    setContent("", { origin: "empty" });
  }

  function setEnabled(nextEnabled) {
    enabled = Boolean(nextEnabled);
    view.dispatch({ effects: editable.reconfigure(EditorView.editable.of(enabled)) });
    host.classList.toggle("is-disabled", !enabled);
    host.setAttribute("aria-disabled", String(!enabled));
  }

  function applyFormat(commandId) {
    if (!enabled) return;
    const selection = view.state.selection.main;
    const result = createFormatChange(commandId, getContent(), selection.from, selection.to);
    view.dispatch({
      changes: { from: result.from, to: result.to, insert: result.insert },
      selection: result.selection,
      scrollIntoView: true
    });
    view.focus();
  }

  function showEdit() {
    options.editorPanel?.removeAttribute("hidden");
    options.previewPanel?.setAttribute("hidden", "");
    options.editTab?.setAttribute("aria-selected", "true");
    options.previewTab?.setAttribute("aria-selected", "false");
    if (lastSelection) view.dispatch({ selection: lastSelection });
    view.focus();
  }

  async function showPreview() {
    lastSelection = {
      anchor: view.state.selection.main.anchor,
      head: view.state.selection.main.head
    };
    if (options.previewPanel && previewedRevision !== revision) {
      try {
        const fragment = renderMarkdownPreview(getContent());
        options.previewPanel.replaceChildren(fragment);
        previewedRevision = revision;
      } catch (error) {
        const message = document.createElement("p");
        message.className = "preview-error";
        message.textContent = localizedMessages.previewError;
        previewErrorNode = message;
        options.previewPanel.replaceChildren(message);
        options.onPreviewError?.(error);
      }
    }
    options.editorPanel?.setAttribute("hidden", "");
    options.previewPanel?.removeAttribute("hidden");
    options.editTab?.setAttribute("aria-selected", "false");
    options.previewTab?.setAttribute("aria-selected", "true");
    options.previewTab?.focus();
  }

  function setLocalizedMessages(messages = {}) {
    localizedMessages = { ...localizedMessages, ...messages };
    view.dispatch({
      effects: accessibility.reconfigure(EditorView.contentAttributes.of({
        "aria-label": localizedMessages.editorLabel,
        spellcheck: "false"
      }))
    });
    if (previewErrorNode?.isConnected) previewErrorNode.textContent = localizedMessages.previewError;
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    view.destroy();
  }

  setEnabled(false);
  return {
    setContent,
    getContent,
    clear,
    setEnabled,
    applyFormat,
    showEdit,
    showPreview,
    setLocalizedMessages,
    hasContent: () => getContent().length > 0,
    getRevision: () => revision,
    getOrigin: () => origin,
    isEnabled: () => enabled,
    destroy,
    view
  };
}
