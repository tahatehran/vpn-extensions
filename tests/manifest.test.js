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

  test("should have a description in English", () => {
    expect(manifest.description).toBeDefined();
    expect(typeof manifest.description).toBe("string");
    expect(manifest.description.length).toBeGreaterThan(0);
    // Single-purpose description
    expect(manifest.description.length).toBeLessThan(132); // Chrome store limit
  });

  test("should not set default_locale without a _locales directory", () => {
    // Chrome refuses to load an extension that declares default_locale
    // without a matching _locales/<locale>/messages.json
    const localesDir = path.resolve(__dirname, "../vpn-extension/_locales");
    if (!fs.existsSync(localesDir)) {
      expect(manifest.default_locale).toBeUndefined();
    } else {
      expect(manifest.default_locale).toBeDefined();
    }
  });

  // ── Manifest V3 Specific ────────────────

  test("should use background.service_worker (not scripts)", () => {
    expect(manifest.background).toBeDefined();
    expect(manifest.background.service_worker).toBeDefined();
    expect(manifest.background.type).toBe("module");
    expect(manifest.background.scripts).toBeUndefined();
  });

  test("should use action (not browser_action)", () => {
    expect(manifest.action).toBeDefined();
    expect(manifest.browser_action).toBeUndefined();
  });

  test("should have default_popup in action", () => {
    expect(manifest.action.default_popup).toBeDefined();
    expect(manifest.action.default_popup).toBe("popup.html");
  });

  test("should use options_ui (Manifest V3)", () => {
    expect(manifest.options_ui).toBeDefined();
    expect(manifest.options_ui.page).toBe("options.html");
    expect(manifest.options_ui.open_in_tab).toBe(true);
    expect(manifest.options_page).toBeUndefined();
  });

  // ── Icons ────────────────────────────────

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

  test("action icons should exist", () => {
    if (manifest.action && manifest.action.default_icon) {
      for (const [size, iconPath] of Object.entries(manifest.action.default_icon)) {
        const fullPath = path.resolve(__dirname, "../vpn-extension", iconPath);
        expect(fs.existsSync(fullPath)).toBe(true);
      }
    }
  });

  // ── Permissions ──────────────────────────

  test("should have permissions array", () => {
    expect(manifest.permissions).toBeDefined();
    expect(Array.isArray(manifest.permissions)).toBe(true);
  });

  test("should have storage permission", () => {
    expect(manifest.permissions).toContain("storage");
  });

  test("should have alarms permission for auto-refresh", () => {
    expect(manifest.permissions).toContain("alarms");
  });

  test("should have proxy permission", () => {
    expect(manifest.permissions).toContain("proxy");
  });

  test("should NOT have tabs permission (not needed for VPN)", () => {
    expect(manifest.permissions).not.toContain("tabs");
  });

  test("should NOT have activeTab permission (not needed for VPN)", () => {
    expect(manifest.permissions).not.toContain("activeTab");
  });

  test("should not have dangerous permissions", () => {
    const dangerous = ["debugger", "nativeMessaging", "webRequestBlocking", "cookies", "webRequest"];
    dangerous.forEach((perm) => {
      expect(manifest.permissions).not.toContain(perm);
    });
  });

  // ── Host Permissions (HTTPS only) ────────

  test("should have host_permissions array", () => {
    expect(manifest.host_permissions).toBeDefined();
    expect(Array.isArray(manifest.host_permissions)).toBe(true);
  });

  test("host_permissions should all be HTTPS", () => {
    manifest.host_permissions.forEach((perm) => {
      if (!perm.startsWith("https://") && !perm.startsWith("*://")) {
        fail(`Non-HTTPS host_permission: ${perm}`);
      }
    });
  });

  test("should have cdn.jsdelivr.net for proxy list", () => {
    const hasJsdelivr = manifest.host_permissions.some((p) => p.includes("cdn.jsdelivr.net"));
    expect(hasJsdelivr).toBe(true);
  });

  test("should have api.myip.com for IP check", () => {
    const hasMyIp = manifest.host_permissions.some((p) => p.includes("api.myip.com"));
    expect(hasMyIp).toBe(true);
  });

  test("should NOT have http://ip-api.com", () => {
    const hasHttpIpApi = manifest.host_permissions.some((p) => p.startsWith("http://"));
    expect(hasHttpIpApi).toBe(false);
  });

  test("should NOT have <all_urls>", () => {
    expect(manifest.host_permissions).not.toContain("<all_urls>");
  });

  // ── Content Security Policy ──────────────

  test("should have content_security_policy", () => {
    expect(manifest.content_security_policy).toBeDefined();
    expect(manifest.content_security_policy.extension_pages).toBeDefined();
  });

  test("CSP should allow necessary connect-src", () => {
    const csp = manifest.content_security_policy.extension_pages;
    expect(csp).toContain("connect-src");
    expect(csp).toContain("cdn.jsdelivr.net");
    expect(csp).toContain("api.myip.com");
    expect(csp).toContain("ipinfo.io");
    expect(csp).toContain("ip-api.com");
  });

  test("CSP should not have unsafe-inline scripts", () => {
    const csp = manifest.content_security_policy.extension_pages;
    const scriptSrc = csp.match(/script-src[^;]*/);
    expect(scriptSrc).not.toBeNull();
    expect(scriptSrc[0]).not.toContain("'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
  });

  // ── Options Page ─────────────────────────

  test("options page should exist", () => {
    const optionsPath = path.resolve(__dirname, "../vpn-extension/options.html");
    expect(fs.existsSync(optionsPath)).toBe(true);
  });

  // ── File Size ────────────────────────────

  test("manifest.json should be under 100KB", () => {
    const manifestPath = path.resolve(__dirname, "../vpn-extension/manifest.json");
    const stats = fs.statSync(manifestPath);
    expect(stats.size).toBeLessThan(100 * 1024);
  });

  // ── Chrome Store Requirements ────────────

  test("should have author field", () => {
    expect(manifest.author).toBeDefined();
    expect(manifest.author.name).toBeDefined();
    expect(manifest.author.email).toBeDefined();
  });

  test("should have homepage_url", () => {
    expect(manifest.homepage_url).toBeDefined();
    expect(manifest.homepage_url).toMatch(/^https:\/\//);
  });

  test("should have privacy_policy_url with HTTPS", () => {
    expect(manifest.privacy_policy_url).toBeDefined();
    expect(manifest.privacy_policy_url).toMatch(/^https:\/\//);
  });

  test("should not include update_url (Chrome Web Store adds it)", () => {
    expect(manifest.update_url).toBeUndefined();
  });

  test("should not declare empty web_accessible_resources", () => {
    expect(manifest.web_accessible_resources).toBeUndefined();
  });

  test("should have minimum_chrome_version", () => {
    expect(manifest.minimum_chrome_version).toBeDefined();
  });

  test("should have offline_enabled: false (proxy needs network)", () => {
    expect(manifest.offline_enabled).toBe(false);
  });
});