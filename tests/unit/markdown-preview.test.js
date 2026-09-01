import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { renderMarkdownPreview } from "../../src/markdown-preview.js";

describe("Markdown preview", () => {
  it("renders supported Markdown", () => {
    const fragment = renderMarkdownPreview("# Title\n\n**bold** and [safe](https://example.com)");
    expect(fragment.querySelector("h1")?.textContent).toBe("Title");
    expect(fragment.querySelector("strong")?.textContent).toBe("bold");
    const link = fragment.querySelector("a");
    expect(link?.getAttribute("href")).toBe("https://example.com");
    expect(link?.rel).toBe("noopener noreferrer");
  });

  it("keeps raw HTML inert and removes active content", () => {
    const hostile = fs.readFileSync("tests/fixtures/hostile.md", "utf8");
    const fragment = renderMarkdownPreview(hostile);
    expect(fragment.querySelector("script,img,iframe,svg,style,form,object,embed")).toBeNull();
    expect(fragment.querySelector("[style],[onerror],[onload]")).toBeNull();
    expect([...fragment.querySelectorAll("a")].every((a) => !/^(javascript|data|file):/i.test(a.getAttribute("href") || ""))).toBe(true);
  });
});
