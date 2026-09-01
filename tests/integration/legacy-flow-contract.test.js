import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("Existing PDF flow regression", () => {
  const popup = fs.readFileSync("src/popup.js", "utf8");

  it("retains local upload, URL loading, auto-detection, statuses, and filename rules", () => {
    expect(popup).toContain('fileInput.addEventListener("change"');
    expect(popup).toContain('loadUrlBtn.addEventListener("click"');
    expect(popup).toContain("chrome.tabs.query");
    expect(popup).toContain('updateStatus("status.downloading"');
    expect(popup).toContain('updateStatus("status.analyzing"');
    expect(popup).toContain('updateStatus("status.success"');
    expect(popup).toContain('fileName.replace(/\\.pdf$/i, "")');
  });
});
