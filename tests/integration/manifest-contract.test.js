import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("Manifest contract regression", () => {
  it("keeps permissions and CSP unchanged", () => {
    const manifest = JSON.parse(fs.readFileSync("public/manifest.json", "utf8"));
    expect(manifest.permissions).toEqual(["activeTab", "downloads"]);
    expect(manifest.permissions).not.toContain("storage");
    expect(manifest.host_permissions).toEqual(["https://*/*", "http://*/*"]);
    expect(manifest.content_security_policy.extension_pages).toBe("script-src 'self' 'wasm-unsafe-eval'; object-src 'self'");
    expect(JSON.stringify(manifest)).not.toMatch(/_locales|https?:\/\/.*locales/i);
  });
});
