import { createMarkdownEditor } from "./editor.js";
import {
  createI18n,
  readLanguagePreference,
  resolveInitialLocale
} from "./i18n.js";

const browserLocale = (() => {
  try { return chrome?.i18n?.getUILanguage?.(); } catch { return null; }
})();
const initialLanguage = resolveInitialLocale({
  savedLocale: readLanguagePreference(),
  browserLocale,
  navigatorLocales: navigator.languages?.length ? navigator.languages : [navigator.language]
});
const i18n = createI18n({ locale: initialLanguage.locale });
i18n.apply(document);

const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
const fileInput = document.querySelector("#pdf-file");
const pdfUrlInput = document.querySelector("#pdf-url");
const loadUrlBtn = document.querySelector("#load-url-btn");
const status = document.querySelector("#status");
const copyBtn = document.querySelector("#copy-btn");
const copyLabel = document.querySelector("#copy-label");
const downloadBtn = document.querySelector("#download-btn");
const languageSelect = document.querySelector("#language-select");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const toolbarButtons = document.querySelectorAll("[data-format]");
const editTab = document.querySelector("#edit-tab");
const previewTab = document.querySelector("#preview-tab");

const editor = createMarkdownEditor(document.querySelector("#output-editor"), {
  editorPanel: document.querySelector("#editor-panel"),
  previewPanel: document.querySelector("#preview-panel"),
  editTab,
  previewTab,
  editorLabel: i18n.t("editor.label"),
  previewError: i18n.t("preview.error"),
  onChange: (content) => updateExportAvailability(content)
});

let currentFileName = "document";
const NO_EXTRACTABLE_TEXT_MARKDOWN = "该 PDF 没有可提取文本，可能需要 OCR。";
let currentStatus = null;
let copyFeedbackActive = false;
let copyFeedbackToken = 0;

function updateExportAvailability(content = editor.getContent()) {
  const disabled = content.length === 0;
  copyBtn.disabled = disabled;
  downloadBtn.disabled = disabled;
}

function setEditorEnabled(enabled) {
  editor.setEnabled(enabled);
  toolbarButtons.forEach((button) => { button.disabled = !enabled; });
}

function renderStatus() {
  if (!currentStatus) {
    status.hidden = true;
    status.textContent = "";
    return;
  }
  status.textContent = i18n.t(currentStatus.key, currentStatus.params);
  status.className = "status";
  if (currentStatus.type === "processing" || currentStatus.type === "progress") status.classList.add("processing");
  if (currentStatus.type === "error") status.classList.add("error");
  if (currentStatus.type === "success") status.classList.add("success");
}

function updateStatus(key, type = "info", params = {}) {
  currentStatus = { key, type, params };
  status.hidden = false;
  renderStatus();
}

function renderCopyLabel() {
  copyLabel.textContent = i18n.t(copyFeedbackActive ? "action.copied" : "action.copy");
}

function applyRuntimeMessages() {
  languageSelect.value = i18n.getLocale();
  editor.setLocalizedMessages({
    editorLabel: i18n.t("editor.label"),
    previewError: i18n.t("preview.error")
  });
  renderStatus();
  renderCopyLabel();
}

languageSelect.value = i18n.getLocale();
languageSelect.addEventListener("change", () => i18n.setLocale(languageSelect.value));
i18n.subscribe(applyRuntimeMessages);
applyRuntimeMessages();

toolbarButtons.forEach((button) => {
  button.disabled = true;
  button.addEventListener("click", () => editor.applyFormat(button.dataset.format));
});
editTab.addEventListener("click", () => editor.showEdit());
previewTab.addEventListener("click", () => editor.showPreview());

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.dataset.tab;
    tabButtons.forEach((button) => button.classList.remove("active"));
    btn.classList.add("active");
    tabContents.forEach((content) => {
      content.style.display = content.id === `tab-${tabName}` ? "block" : "none";
    });
  });
});

async function initializePopup() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    if (!currentTab?.url) return;
    const url = currentTab.url;
    const adobePdfMatch = url.match(/^chrome-extension:\/\/[a-z]+\/(.+)$/);
    const pdfUrl = adobePdfMatch
      ? decodeURIComponent(adobePdfMatch[1])
      : (url.match(/\.pdf(\?.*)?$/i) || url.match(/^https?:\/\/.*\.pdf/i) ? url : null);
    if (pdfUrl) {
      tabButtons[1].click();
      pdfUrlInput.value = pdfUrl;
      pdfUrlInput.focus();
      updateStatus("status.detectedPdf");
    }
  } catch (error) {
    console.log("Could not detect current tab URL:", error);
  }
}
initializePopup();

function processPdfBuffer(buffer, fileName) {
  currentFileName = fileName.replace(/\.pdf$/i, "");
  updateStatus("status.analyzing", "processing");
  editor.clear();
  editor.showEdit();
  setEditorEnabled(false);
  updateExportAvailability("");
  worker.postMessage({ buffer, fileName }, [buffer]);
}

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file || file.type !== "application/pdf") {
    updateStatus("status.invalidPdf", "error");
    return;
  }
  processPdfBuffer(await file.arrayBuffer(), file.name);
});

loadUrlBtn.addEventListener("click", async () => {
  const url = pdfUrlInput.value.trim();
  if (!url) return updateStatus("status.enterUrl", "error");
  try { new URL(url); } catch { return updateStatus("status.invalidUrl", "error"); }
  updateStatus("status.downloading", "processing");
  editor.clear();
  editor.showEdit();
  setEditorEnabled(false);
  updateExportAvailability("");
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/pdf")) {
      updateStatus("status.notPdf", "error");
      return;
    }
    const buffer = await response.arrayBuffer();
    const filename = new URL(url).pathname.split("/").pop() || "document.pdf";
    processPdfBuffer(buffer, filename);
  } catch (error) {
    updateStatus("status.downloadFailed", "error", { error: error.message });
    updateExportAvailability("");
  }
});

pdfUrlInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") loadUrlBtn.click();
});

worker.onmessage = ({ data }) => {
  if (!data.ok) {
    updateStatus("status.processingFailed", "error", { error: data.error });
    setEditorEnabled(false);
    updateExportAvailability("");
    return;
  }
  const { pdfType, markdown } = data.result;
  updateStatus("status.success", "success", { pdfType });
  editor.setContent(markdown ?? NO_EXTRACTABLE_TEXT_MARKDOWN, { origin: "parsed" });
  setEditorEnabled(true);
  updateExportAvailability();
};

copyBtn.addEventListener("click", async () => {
  const content = editor.getContent();
  if (!content) return;
  try {
    await navigator.clipboard.writeText(content);
    const token = ++copyFeedbackToken;
    copyFeedbackActive = true;
    renderCopyLabel();
    setTimeout(() => {
      if (token !== copyFeedbackToken) return;
      copyFeedbackActive = false;
      renderCopyLabel();
    }, 2000);
  } catch (error) {
    console.error("Copy failed:", error);
    updateStatus("status.copyFailed", "error");
  }
});

downloadBtn.addEventListener("click", () => {
  const content = editor.getContent();
  if (!content) return;
  const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${currentFileName}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
});

window.addEventListener("unload", () => editor.destroy(), { once: true });
