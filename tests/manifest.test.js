/* ============================================
   Tests: manifest.json Validation
   ============================================ */

const fs = require("fs");
const path = require("path");
const { loadManifest, loadFileAsString } = require("./helpers");

describe("manifest.json", () => {
  let manifest;

  beforeAll(() => {
    manifest = loadManifest();
  });

  // ── Structure Tests ──────────────────────

  test("should be valid JSON", () => {
    const raw = loadFileAsString("vpn-extension/manifest.json");
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  test("should have manifest_version 3", () => {
    expect(manifest.manifest_version).toBe(3);
  });

  test("should have a name", () => {
    expect(manifest.name).toBeDefined();
    expect(typeof manifest.name).toBe("string");
    expect(manifest.name.length).toBeGreaterThan(0);
  });

  test("should have a version", () => {
    expect(manifest.version).toBeDefined();
    expect(/^\d+\.\d+(\.\d+)?$/.test(manifest.version)).toBe(true);
  });

  test("should have a description", () => {
    expect(manifest.description).toBeDefined();
    expect(typeof manifest.description).toBe("string");
    expect(manifest.description.length).toBeGreaterThan(0);
  });

  // ── Manifest V3 Specific ────────────────

  test("should use background.service_worker (not scripts)", () => {
    expect(manifest.background).toBeDefined();
    expect(manifest.background.service_worker).toBeDefined();
    expect(manifest.background.scripts).toBeUndefined();
  });

  test("should use action (not browser_action)", () => {
    expect(manifest.action).toBeDefined();
    expect(manifest.browser_action).toBeUndefined();
  });

  test("should have default_popup in action", () => {
    expect(manifest.action.default_popup).toBeDefined();
  });

  // ── Icons ───────────────────────────────

  test("should have icons defined", () => {
    expect(manifest.icons).toBeDefined();
    expect(typeof manifest.icons).toBe("object");
  });

  test("should have required icon sizes (16, 48, 128)", () => {
    expect(manifest.icons["16"]).toBeDefined();
    expect(manifest.icons["48"]).toBeDefined();
    expect(manifest.icons["128"]).toBeDefined();
  });

  test("icon files should exist", () => {
    for (const [size, iconPath] of Object.entries(manifest.icons)) {
      const fullPath = path.resolve(__dirname, "../vpn-extension", iconPath);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  // ── Permissions ─────────────────────────

  test("should have permissions array", () => {
    expect(manifest.permissions).toBeDefined();
    expect(Array.isArray(manifest.permissions)).toBe(true);
  });

  test("should have storage permission", () => {
    expect(manifest.permissions).toContain("storage");
  });

  test("should have tabs or activeTab permission", () => {
    const hasTabs = manifest.permissions.includes("tabs");
    const hasActiveTab = manifest.permissions.includes("activeTab");
    expect(hasTabs || hasActiveTab).toBe(true);
  });

  test("should not have dangerous permissions", () => {
    const dangerous = ["debugger", "nativeMessaging", "webRequestBlocking"];
    dangerous.forEach((perm) => {
      expect(manifest.permissions).not.toContain(perm);
    });
  });

  // ── Content Security Policy ─────────────

  test("should not have inline scripts in CSP", () => {
    if (manifest.content_security_policy) {
      const csp =
        typeof manifest.content_security_policy === "string"
          ? manifest.content_security_policy
          : manifest.content_security_policy.extension_pages || "";
      expect(csp).not.toContain("'unsafe-inline'");
    }
  });

  // ── Options Page ────────────────────────

  test("should have options_page if referenced", () => {
    if (manifest.options_page) {
      const optionsPath = path.resolve(__dirname, "../vpn-extension", manifest.options_page);
      expect(fs.existsSync(optionsPath)).toBe(true);
    }
  });

  // ── File Size ───────────────────────────

  test("manifest.json should be under 100KB", () => {
    const manifestPath = path.resolve(__dirname, "../vpn-extension/manifest.json");
    const stats = fs.statSync(manifestPath);
    expect(stats.size).toBeLessThan(100 * 1024);
  });
});
