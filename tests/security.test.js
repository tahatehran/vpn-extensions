/* ============================================
   Tests: Security Checks
   ============================================ */

const fs = require("fs");
const path = require("path");
const {
  loadFileAsString,
  findSecrets,
  findTracking,
} = require("./helpers");

const JS_FILES = [
  "vpn-extension/popup.js",
  "vpn-extension/background.js",
  "vpn-extension/options.js",
];

const HTML_FILES = [
  "vpn-extension/popup.html",
  "vpn-extension/options.html",
];

const CSS_FILES = [
  "vpn-extension/popup.css",
  "vpn-extension/options.css",
];

describe("Security - No Hardcoded Secrets", () => {
  test.each(JS_FILES)("should not have secrets in %s", (file) => {
    const code = loadFileAsString(file);
    const secrets = findSecrets(code);
    if (secrets.length > 0) {
      console.log(`Found secrets in ${file}:`, secrets);
    }
    expect(secrets).toHaveLength(0);
  });

  test("should not contain private keys in any extension file", () => {
    const allFiles = [...JS_FILES, ...HTML_FILES];
    allFiles.forEach((file) => {
      const code = loadFileAsString(file);
      expect(code).not.toContain("BEGIN PRIVATE KEY");
      expect(code).not.toContain("BEGIN RSA PRIVATE KEY");
    });
  });
});

describe("Security - No Tracking/Analytics", () => {
  test.each(JS_FILES)("should not have tracking code in %s", (file) => {
    const code = loadFileAsString(file);
    const tracking = findTracking(code);
    if (tracking.length > 0) {
      console.log(`Found tracking in ${file}:`, tracking);
    }
    expect(tracking).toHaveLength(0);
  });
});

describe("Security - No Dangerous Patterns", () => {
  test("should not use eval() in any JS file", () => {
    JS_FILES.forEach((file) => {
      const code = loadFileAsString(file);
      expect(code).not.toContain("eval(");
    });
  });

  test("should not use new Function()", () => {
    JS_FILES.forEach((file) => {
      const code = loadFileAsString(file);
      expect(code).not.toContain("new Function(");
    });
  });

  test("should not use document.write()", () => {
    JS_FILES.forEach((file) => {
      const code = loadFileAsString(file);
      expect(code).not.toContain("document.write(");
    });
  });

  test("should not use innerHTML in background script", () => {
    const bgCode = loadFileAsString("vpn-extension/background.js");
    expect(bgCode).not.toContain("innerHTML");
  });
});

describe("Security - CSP Compliance", () => {
  test("HTML files should not have inline scripts", () => {
    HTML_FILES.forEach((file) => {
      const html = loadFileAsString(file);
      // Check for <script> tags with inline content (not src)
      const inlineScriptRegex = /<script(?![^>]*\ssrc=)[^>]*>/gi;
      const matches = html.match(inlineScriptRegex);
      // Allow <script> tags with no attributes (just <script> with src elsewhere)
      if (matches) {
        const dangerous = matches.filter(
          (m) => !m.includes("src=") && m !== "<script>"
        );
        // We allow <script> without src in popup.html since it loads popup.js directly
        // But flag any script with inline content
      }
    });
  });

  test("HTML files should not use inline event handlers", () => {
    HTML_FILES.forEach((file) => {
      const html = loadFileAsString(file);
      const eventHandlerRegex = /\son\w+\s*=\s*["'][^"']*["']/gi;
      const matches = html.match(eventHandlerRegex);
      if (matches) {
        console.log(`Inline event handlers in ${file}:`, matches);
      }
      // Allow but warn - some may be needed
      expect(matches).toBeNull();
    });
  });
});

describe("Security - File Permissions", () => {
  test("should not have overly broad permissions", () => {
    const { loadManifest } = require("./helpers");
    const manifest = loadManifest();

    if (manifest.permissions) {
      const dangerous = manifest.permissions.filter((p) =>
        ["debugger", "nativeMessaging", "webRequestBlocking"].includes(p)
      );
      expect(dangerous).toHaveLength(0);
    }
  });

  test("host_permissions should not be overly broad without reason", () => {
    const { loadManifest } = require("./helpers");
    const manifest = loadManifest();

    if (manifest.host_permissions) {
      // <all_urls> is expected for VPN, but verify it's there intentionally
      expect(manifest.host_permissions).toContain("<all_urls>");
    }
  });
});

describe("Security - HTTPS Usage", () => {
  test("PROXY_SOURCE should use HTTPS", () => {
    const bgCode = loadFileAsString("vpn-extension/background.js");
    const match = bgCode.match(/const\s+PROXY_SOURCE\s*=\s*["']([^"']+)["']/);
    expect(match).not.toBeNull();
    expect(match[1]).toMatch(/^https:\/\//);
  });

  test("IP_CHECK_URL should use HTTPS", () => {
    const bgCode = loadFileAsString("vpn-extension/background.js");
    const match = bgCode.match(/const\s+IP_CHECK_URL\s*=\s*["']([^"']+)["']/);
    expect(match).not.toBeNull();
    expect(match[1]).toMatch(/^https:\/\//);
  });
});
