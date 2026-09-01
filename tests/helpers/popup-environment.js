import { vi } from "vitest";

export function installBrowserDoubles({ browserLanguage = "en", tabUrl, clipboard } = {}) {
  globalThis.ResizeObserver ||= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  globalThis.requestAnimationFrame ||= (callback) => setTimeout(callback, 0);
  globalThis.cancelAnimationFrame ||= (id) => clearTimeout(id);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: clipboard || { writeText: vi.fn().mockResolvedValue(undefined) }
  });
  globalThis.chrome = {
    i18n: { getUILanguage: vi.fn(() => browserLanguage) },
    tabs: { query: vi.fn().mockResolvedValue(tabUrl ? [{ url: tabUrl }] : []) }
  };
  globalThis.Worker = class {
    postMessage = vi.fn();
    terminate = vi.fn();
  };
  URL.createObjectURL = vi.fn(() => "blob:test");
  URL.revokeObjectURL = vi.fn();
}

export function createThrowingStorage({ failRead = false, failWrite = false } = {}) {
  const values = new Map();
  return {
    getItem(key) {
      if (failRead) throw new Error("read unavailable");
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (failWrite) throw new Error("write unavailable");
      values.set(key, String(value));
    },
    removeItem: (key) => values.delete(key)
  };
}
