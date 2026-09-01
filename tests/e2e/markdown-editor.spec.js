import { test, expect } from "./fixtures/extension.js";

function createPdf() {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Length 44 >>\nstream\nBT /F1 18 Tf 72 720 Td (Hello PDF) Tj ET\nendstream"
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf);
}

test("loads an accessible Markdown editor and formatting toolbar", async ({ popupPage }) => {
  await expect(popupPage.getByRole("textbox", { name: "Extracted result Markdown editor" })).toBeVisible();
  await expect(popupPage.getByRole("toolbar", { name: "Markdown formatting tools" })).toBeVisible();
  await expect(popupPage.getByRole("tab", { name: "Edit" })).toHaveAttribute("aria-selected", "true");
  await expect(popupPage.getByRole("button", { name: "Bold" })).toBeDisabled();
  await popupPage.getByRole("tab", { name: "Preview" }).click();
  await expect(popupPage.getByRole("tab", { name: "Preview" })).toHaveAttribute("aria-selected", "true");
  await expect(popupPage.getByRole("tabpanel", { name: "Preview", exact: true })).toBeVisible();
  await popupPage.getByRole("tab", { name: "Edit" }).click();
  await expect(popupPage.getByRole("tabpanel", { name: "Edit", exact: true })).toBeVisible();
  await expect(popupPage.getByRole("textbox", { name: "Extracted result Markdown editor" })).toHaveAttribute("contenteditable", "false");
});

test("parses a PDF and exports the latest edited Markdown", async ({ context, popupPage }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await popupPage.locator("#pdf-file").setInputFiles({
    name: "sample.pdf",
    mimeType: "application/pdf",
    buffer: createPdf()
  });
  await expect(popupPage.locator("#status")).toContainText("Success", { timeout: 15_000 });
  const editor = popupPage.getByRole("textbox", { name: "Extracted result Markdown editor" });
  await expect(editor).toHaveAttribute("contenteditable", "true");
  await editor.fill("# Edited result\n\nexport me");
  await popupPage.locator("#language-select").selectOption("zh-CN");
  const chineseEditor = popupPage.getByRole("textbox", { name: "提取结果 Markdown 编辑器" });
  await expect(chineseEditor).toContainText("Edited result");
  await popupPage.locator("#language-select").selectOption("en");
  await popupPage.getByRole("button", { name: "Bold" }).click();
  await popupPage.getByRole("tab", { name: "Preview" }).click();
  await expect(popupPage.getByRole("heading", { name: "Edited result" })).toBeVisible();
  await popupPage.getByRole("button", { name: "Copy" }).click();
  expect(await popupPage.evaluate(() => navigator.clipboard.readText())).toContain("# Edited result");
  await popupPage.locator("#language-select").selectOption("zh-CN");
  await expect(popupPage.locator("#copy-label")).toHaveText("✓ 已复制");
  await expect(popupPage.locator("#copy-label")).toHaveText("复制", { timeout: 3_000 });
  await popupPage.locator("#language-select").selectOption("en");
  const downloadPromise = popupPage.waitForEvent("download");
  await popupPage.getByRole("button", { name: "Download" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("sample.md");
});
