import { describe, expect, it } from "vitest";
import { en } from "../../src/locales/en.js";
import { zhCN } from "../../src/locales/zh-CN.js";

const placeholders = (value) => [...value.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map((match) => match[1]).sort();

describe("localization catalogs", () => {
  it("keeps exact key and placeholder parity", () => {
    expect(Object.keys(zhCN).sort()).toEqual(Object.keys(en).sort());
    for (const key of Object.keys(en)) {
      expect(zhCN[key].trim(), key).not.toBe("");
      expect(en[key].trim(), key).not.toBe("");
      expect(placeholders(zhCN[key]), key).toEqual(placeholders(en[key]));
    }
  });

  it("contains plain text instead of markup", () => {
    for (const catalog of [en, zhCN]) {
      for (const [key, value] of Object.entries(catalog)) expect(value, key).not.toMatch(/<\/?[a-z][^>]*>/i);
    }
  });
});
