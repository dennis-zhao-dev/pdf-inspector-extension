import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("Worker contract regression", () => {
  it("keeps transferable request and ok/error response shapes", () => {
    const popup = fs.readFileSync("src/popup.js", "utf8");
    const worker = fs.readFileSync("src/worker.js", "utf8");
    expect(popup).toContain("worker.postMessage({ buffer, fileName }, [buffer])");
    expect(worker).toContain("ok: true");
    expect(worker).toContain("ok: false");
  });
});
