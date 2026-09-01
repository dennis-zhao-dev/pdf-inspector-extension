import { describe, expect, it } from "vitest";
import { createI18n, resolveInitialLocale } from "../../src/i18n.js";
import { en } from "../../src/locales/en.js";
import { zhCN } from "../../src/locales/zh-CN.js";

describe("popup localization contract", () => {
  it.each([["zh-CN", "zh-CN"], ["zh-TW", "zh-CN"], ["en-US", "en"], ["fr-FR", "en"]])("maps browser %s to %s", (browserLocale, locale) => {
    expect(resolveInitialLocale({ browserLocale }).locale).toBe(locale);
  });

  it("re-renders semantic status while preserving dynamic values", () => {
    const status = { key: "status.downloadFailed", params: { error: "HTTP 404: Missing.pdf" } };
    const i18n = createI18n({ locale: "en", catalogs: { en, "zh-CN": zhCN } });
    expect(i18n.t(status.key, status.params)).toBe("Download failed: HTTP 404: Missing.pdf");
    i18n.setLocale("zh-CN", { persist: false, apply: false });
    expect(i18n.t(status.key, status.params)).toBe("下载失败：HTTP 404: Missing.pdf");
  });
});
