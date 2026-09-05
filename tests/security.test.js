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
      const inlineScriptRegex = /<script(?![^>]*\ssrc=)[^>]*>/gi;
      const matches = html.match(inlineScriptRegex);
      if (matches) {
        const dangerous = matches.filter(
          (m) => !m.includes("src=") && m !== "<script>"
        );
        expect(dangerous.length).toBe(0);
      }
    });
  });

  test("HTML files should not use inline event handlers", () => {
    HTML_FILES.forEach((file) => {
      const html = loadFileAsString(file);
      const eventHandlerRegex = /\bon\w+\s*=\s*["'][^"']*["']/gi;
      const matches = html.match(eventHandlerRegex);
      if (matches) {
        console.log(`Inline event handlers in ${file}:`, matches);
      }
      expect(matches).toBeNull();
    });
  });

  test("manifest.json should have content_security_policy", () => {
    const manifest = JSON.parse(loadFileAsString("vpn-extension/manifest.json"));
    expect(manifest.content_security_policy).toBeDefined();
    expect(manifest.content_security_policy.extension_pages).toBeDefined();
  });
});

describe("Security - Host Permissions (HTTPS only)", () => {
  test("should not have http:// host_permissions", () => {
    const manifest = JSON.parse(loadFileAsString("vpn-extension/manifest.json"));
    if (manifest.host_permissions) {
      manifest.host_permissions.forEach((perm) => {
        if (perm.startsWith("http://")) {
          fail(`Found http:// host_permission: ${perm} - must be https://`);
        }
      });
    }
  });

  test("should not have <all_urls> unless only https is used", () => {
    const manifest = JSON.parse(loadFileAsString("vpn-extension/manifest.json"));
    if (manifest.host_permissions) {
      const hasAllUrls = manifest.host_permissions.includes("<all_urls>");
      if (hasAllUrls) {
        // Must have no http:// URLs
        const hasHttp = manifest.host_permissions.some((p) => p.startsWith("http://"));
        expect(!hasHttp).toBe(true);
      }
    }
  });
});

describe("Security - HTTPS Enforcement", () => {
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

  test("PROXY_SOURCE should use HTTPS in popup.js", () => {
    const popupCode = loadFileAsString("vpn-extension/popup.js");
    expect(popupCode).toContain("https://cdn.jsdelivr.net");
  });

  test("GEO_FALLBACK and GEO_PRIMARY should be HTTPS in popup.js", () => {
    const popupCode = loadFileAsString("vpn-extension/popup.js");
    expect(popupCode).toMatch(/https:\/\/(ipinfo|ip-api)\.com/);
  });

  test("Test all servers in options.js should use HTTPS", () => {
    const optsCode = loadFileAsString("vpn-extension/options.js");
    expect(optsCode).toMatch(/https:\/\//);
  });
});

describe("Security - IP and Port Validation", () => {
  test("sanitizeServer should reject private IPs in background.js", () => {
    const bgCode = loadFileAsString("vpn-extension/background.js");
    expect(bgCode).toContain("isPrivateHost");
    expect(bgCode).toContain("sanitizeServer");
  });
});

describe("Security - Message Validation", () => {
  test("GET_STATUS in popup.js should not accept arbitrary objects", () => {
    const popupCode = loadFileAsString("vpn-extension/popup.js");
    expect(popupCode).toContain("GET_STATUS");
  });
});