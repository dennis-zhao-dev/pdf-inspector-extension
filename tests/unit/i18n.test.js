import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LANGUAGE_STORAGE_KEY,
  createI18n,
  normalizeLocale,
  readLanguagePreference,
  resolveInitialLocale,
  writeLanguagePreference
} from "../../src/i18n.js";
import { createThrowingStorage } from "../helpers/popup-environment.js";

describe("i18n controller", () => {
  beforeEach(() => {
    document.documentElement.lang = "";
    document.body.innerHTML = '<p data-i18n="hello"></p><input data-i18n-placeholder="placeholder"><button data-i18n-title="title" data-i18n-aria-label="label"></button>';
  });

  it.each([["zh-CN", "zh-CN"], ["zh-TW", "zh-CN"], ["EN-us", "en"], ["fr", "en"], [null, "en"]])("normalizes %s", (input, expected) => {
    expect(normalizeLocale(input)).toBe(expected);
  });

  it("falls back, interpolates named values, and applies safe DOM attributes", () => {
    const i18n = createI18n({
      locale: "zh-CN",
      catalogs: {
        en: { hello: "Hello {name}", placeholder: "Type", title: "Title", label: "Label", fallback: "Fallback" },
        "zh-CN": { hello: "你好 {name}", placeholder: "输入", title: "标题", label: "标签" }
      }
    });
    expect(i18n.t("hello", { name: "<b>Ada</b>" })).toBe("你好 <b>Ada</b>");
    expect(i18n.t("fallback")).toBe("Fallback");
    expect(i18n.t("missing.key")).toBe("missing.key");
    i18n.apply();
    expect(document.querySelector("p").innerHTML).toBe("你好 {name}");
    expect(document.querySelector("input").placeholder).toBe("输入");
    expect(document.querySelector("button").getAttribute("aria-label")).toBe("标签");
    expect(document.documentElement.lang).toBe("zh-CN");
  });

  it("notifies subscribers and persists a manual locale", () => {
    const storage = createThrowingStorage();
    const listener = vi.fn();
    const i18n = createI18n({ storage });
    i18n.subscribe(listener);
    i18n.setLocale("zh-HK", { apply: false });
    expect(i18n.getLocale()).toBe("zh-CN");
    expect(listener).toHaveBeenCalledWith("zh-CN");
    expect(storage.getItem(LANGUAGE_STORAGE_KEY)).toBe("zh-CN");
  });
});

describe("language preference", () => {
  it("uses saved, browser, navigator, then fallback order", () => {
    expect(resolveInitialLocale({ savedLocale: "en", browserLocale: "zh-CN" })).toEqual({ locale: "en", source: "saved" });
    expect(resolveInitialLocale({ browserLocale: "zh-TW" })).toEqual({ locale: "zh-CN", source: "browser" });
    expect(resolveInitialLocale({ navigatorLocales: ["en-GB"] })).toEqual({ locale: "en", source: "navigator" });
    expect(resolveInitialLocale()).toEqual({ locale: "en", source: "fallback" });
  });

  it("contains invalid values and storage failures", () => {
    const invalid = createThrowingStorage();
    invalid.setItem(LANGUAGE_STORAGE_KEY, "fr");
    expect(readLanguagePreference(invalid)).toBeNull();
    expect(readLanguagePreference(createThrowingStorage({ failRead: true }))).toBeNull();
    expect(writeLanguagePreference(createThrowingStorage({ failWrite: true }), "en")).toBe(false);
    expect(writeLanguagePreference(invalid, "fr")).toBe(false);
  });
});
