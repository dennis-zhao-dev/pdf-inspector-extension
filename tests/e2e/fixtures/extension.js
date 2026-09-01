import { chromium, test as base } from "@playwright/test";
import fs from "node:fs";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";

function extensionIdForPath(extensionPath) {
  const digest = crypto.createHash("sha256").update(extensionPath).digest().subarray(0, 16);
  return [...digest].map((byte) => `${String.fromCharCode(97 + (byte >> 4))}${String.fromCharCode(97 + (byte & 15))}`).join("");
}

export const test = base.extend({
  context: async ({}, use) => {
    const extensionPath = path.resolve("dist");
    const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-inspector-e2e-"));
    const context = await chromium.launchPersistentContext(profileDir, {
      headless: true,
      channel: "chromium",
      ignoreDefaultArgs: ["--disable-extensions"],
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
    });
    context.extensionId = extensionIdForPath(extensionPath);
    await use(context);
    await context.close();
  },
  popupPage: async ({ context }, use) => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto(`chrome-extension://${context.extensionId}/src/popup.html`);
    page.setLanguagePreference = async (locale) => {
      await page.evaluate((value) => {
        if (value) localStorage.setItem("pdfInspector.uiLanguage", value);
        else localStorage.removeItem("pdfInspector.uiLanguage");
      }, locale);
      await page.reload();
    };
    await use(page);
  }
});

export { expect } from "@playwright/test";
