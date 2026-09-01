import { en } from "./locales/en.js";
import { zhCN } from "./locales/zh-CN.js";

export const SUPPORTED_LOCALES = ["zh-CN", "en"];
export const LANGUAGE_STORAGE_KEY = "pdfInspector.uiLanguage";
export const DEFAULT_CATALOGS = { en, "zh-CN": zhCN };

export function normalizeLocale(value) {
  if (typeof value !== "string" || !value.trim()) return "en";
  const primary = value.trim().split(/[-_]/, 1)[0].toLowerCase();
  if (primary === "zh") return "zh-CN";
  if (primary === "en") return "en";
  return "en";
}

export function readLanguagePreference(storage = globalThis.localStorage) {
  try {
    const value = storage?.getItem(LANGUAGE_STORAGE_KEY);
    return SUPPORTED_LOCALES.includes(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeLanguagePreference(storage = globalThis.localStorage, locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) return false;
  try {
    storage?.setItem(LANGUAGE_STORAGE_KEY, locale);
    return true;
  } catch {
    return false;
  }
}

export function resolveInitialLocale({ savedLocale, browserLocale, navigatorLocales = [] } = {}) {
  if (SUPPORTED_LOCALES.includes(savedLocale)) return { locale: savedLocale, source: "saved" };
  if (typeof browserLocale === "string" && browserLocale.trim()) {
    return { locale: normalizeLocale(browserLocale), source: "browser" };
  }
  const candidates = Array.isArray(navigatorLocales) ? navigatorLocales : [navigatorLocales];
  const candidate = candidates.find((value) => typeof value === "string" && value.trim());
  if (candidate) return { locale: normalizeLocale(candidate), source: "navigator" };
  return { locale: "en", source: "fallback" };
}

function interpolate(template, params) {
  return template.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  );
}

export function createI18n({
  catalogs = DEFAULT_CATALOGS,
  fallbackLocale = "en",
  locale = "en",
  storage = globalThis.localStorage
} = {}) {
  let activeLocale = normalizeLocale(locale);
  const listeners = new Set();

  function t(key, params = {}) {
    const template = catalogs[activeLocale]?.[key] ?? catalogs[fallbackLocale]?.[key] ?? key;
    return interpolate(String(template), params);
  }

  function apply(root = document) {
    const scope = root?.querySelectorAll ? root : document;
    scope.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
    for (const [attribute, datasetKey] of [
      ["placeholder", "i18nPlaceholder"],
      ["title", "i18nTitle"],
      ["aria-label", "i18nAriaLabel"]
    ]) {
      scope.querySelectorAll(`[data-${datasetKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}]`)
        .forEach((node) => node.setAttribute(attribute, t(node.dataset[datasetKey])));
    }
    const doc = scope.ownerDocument ?? (scope.nodeType === 9 ? scope : document);
    if (doc?.documentElement) doc.documentElement.lang = activeLocale;
  }

  function setLocale(nextLocale, options = {}) {
    const next = normalizeLocale(nextLocale);
    const changed = next !== activeLocale;
    activeLocale = next;
    if (options.persist !== false) writeLanguagePreference(storage, next);
    if (options.apply !== false && typeof document !== "undefined") apply(document);
    if (changed || options.notify === true) listeners.forEach((listener) => listener(next));
    return next;
  }

  return {
    getLocale: () => activeLocale,
    setLocale,
    t,
    apply,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
