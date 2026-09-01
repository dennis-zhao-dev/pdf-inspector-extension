import { test, expect } from "./fixtures/extension.js";

test("switches both directions and persists the manual preference", async ({ popupPage }) => {
  await popupPage.setLanguagePreference(null);
  const selector = popupPage.locator("#language-select");
  await expect(selector).toHaveValue("en");
  await expect(popupPage.locator("html")).toHaveAttribute("lang", "en");
  await popupPage.getByRole("button", { name: "URL link" }).click();
  await expect(popupPage.getByRole("button", { name: "Load PDF" })).toBeVisible();

  const started = Date.now();
  await selector.selectOption("zh-CN");
  await expect(popupPage.getByRole("button", { name: "加载 PDF" })).toBeVisible();
  expect(Date.now() - started).toBeLessThan(500);
  await expect(popupPage.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(popupPage.getByRole("textbox", { name: "提取结果 Markdown 编辑器" })).toBeVisible();

  await popupPage.reload();
  await expect(selector).toHaveValue("zh-CN");
  await selector.selectOption("en");
  await expect(popupPage.getByRole("button", { name: "Local file" })).toBeVisible();
});

test("keeps editor and preview mode stable during a language switch", async ({ popupPage }) => {
  const editor = popupPage.getByRole("textbox", { name: "Extracted result Markdown editor" });
  await expect(editor).toBeVisible();
  await popupPage.getByRole("tab", { name: "Preview" }).click();
  await popupPage.locator("#language-select").selectOption("zh-CN");
  await expect(popupPage.locator(".cm-content")).toHaveAttribute("aria-label", "提取结果 Markdown 编辑器");
  await expect(popupPage.getByRole("tab", { name: "预览" })).toHaveAttribute("aria-selected", "true");
  await expect(popupPage.locator("#preview-panel")).not.toHaveAttribute("hidden", "");
});

test("has keyboard-accessible localization with no horizontal overflow at supported widths", async ({ popupPage }) => {
  for (const width of [800, 600]) {
    await popupPage.setViewportSize({ width, height: 900 });
    for (const locale of ["en", "zh-CN"]) {
      await popupPage.locator("#language-select").selectOption(locale);
      expect(await popupPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
  }
  await popupPage.locator("#language-select").focus();
  await expect(popupPage.locator("#language-select")).toBeFocused();
});
