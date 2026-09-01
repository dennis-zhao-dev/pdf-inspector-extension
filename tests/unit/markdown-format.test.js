import { describe, expect, it } from "vitest";
import { createFormatChange } from "../../src/markdown-format.js";

function apply(doc, change) {
  return doc.slice(0, change.from) + change.insert + doc.slice(change.to);
}

describe("Markdown format changes", () => {
  it.each([
    ["bold", "text", 0, 4, "**text**"],
    ["italic", "text", 0, 4, "*text*"],
    ["link", "text", 0, 4, "[text](https://example.com)"],
    ["unordered-list", "one\ntwo", 0, 7, "- one\n- two"],
    ["ordered-list", "one\ntwo", 0, 7, "1. one\n2. two"],
    ["quote", "one\ntwo", 0, 7, "> one\n> two"],
    ["heading", "title", 0, 5, "# title"],
    ["code", "a\nb", 0, 3, "```\na\nb\n```"]
  ])("applies %s to selected content", (id, doc, from, to, expected) => {
    expect(apply(doc, createFormatChange(id, doc, from, to))).toBe(expected);
  });

  it.each(["heading", "bold", "italic", "link", "ordered-list", "unordered-list", "quote", "code"])(
    "inserts an editable placeholder for %s",
    (id) => {
      const change = createFormatChange(id, "", 0, 0);
      expect(change.insert.length).toBeGreaterThan(0);
      expect(change.selection.head).toBeGreaterThan(change.selection.anchor);
    }
  );

  it("prefixes whole boundary lines", () => {
    const doc = "zero\none\ntwo\nthree";
    const change = createFormatChange("quote", doc, 7, 12);
    expect(apply(doc, change)).toBe("zero\n> one\n> two\nthree");
  });

  it("rejects unknown commands and invalid ranges", () => {
    expect(() => createFormatChange("unknown", "x", 0, 1)).toThrow();
    expect(() => createFormatChange("bold", "x", -1, 1)).toThrow(RangeError);
  });
});
