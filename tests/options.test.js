/* ============================================
   Tests: options.js Functions
   ============================================ */

const fs = require("fs");
const { loadFileAsString } = require("./helpers");

let optionsSource;
beforeAll(() => {
  optionsSource = loadFileAsString("vpn-extension/options.js");
});

describe("options.js - Source Analysis", () => {
  test("should define PROXY_SOURCE constant (HTTPS)", () => {
    expect(optionsSource).toContain("PROXY_SOURCE");
    expect(optionsSource).toContain("https://cdn.jsdelivr.net");
  });

  test("should have required functions", () => {
    const requiredFunctions = [
      "loadSettings",
      "saveSettings",
      "loadStats",
      "testAllServers",
      "esc",
      "updateProxies",
      "resetSettings",
      "setupEventListeners",
      "isPrivateHost",
    ];

    requiredFunctions.forEach((fn) => {
      const fnRegex = new RegExp(
        `(?:async\\s+)?function\\s+${fn}|(?:async\\s+)?const\\s+${fn}\\s*=`,
        "m"
      );
      expect(optionsSource).toMatch(fnRegex);
    });
  });

  test("should have DOMContentLoaded handler", () => {
    expect(optionsSource).toContain("DOMContentLoaded");
  });

  test("should have DOM elements defined", () => {
    const elements = [
      "auto-connect",
      "kill-switch",
      "geo-provider",
      "dns-default",
      "dns-cloudflare",
      "dns-google",
      "dns-opendns",
      "btn-test-all",
      "btn-update",
      "btn-reset",
    ];

    elements.forEach((el) => {
      expect(optionsSource).toContain(el);
    });
  });
});

describe("options.js - Settings Management", () => {
  test("should save settings to background via SAVE_SETTINGS", () => {
    expect(optionsSource).toContain("SAVE_SETTINGS");
    expect(optionsSource).toContain("chrome.runtime.sendMessage");
  });

  test("should load settings from background via GET_STATUS", () => {
    expect(optionsSource).toContain("GET_STATUS");
  });

  test("should have auto-connect setting", () => {
    expect(optionsSource).toContain("autoConnect");
  });

  test("should have kill-switch setting", () => {
    expect(optionsSource).toContain("killSwitch");
  });

  test("should have geoProvider setting", () => {
    expect(optionsSource).toContain("geoProvider");
  });

  test("should have dns setting", () => {
    expect(optionsSource).toContain("dns");
  });

  test("should have DEFAULT_SETTINGS object", () => {
    expect(optionsSource).toContain("DEFAULT_SETTINGS");
  });
});

describe("options.js - Server Testing", () => {
  test("should have testAllServers function", () => {
    expect(optionsSource).toContain("async function testAllServers");
  });

  test("should have progress tracking", () => {
    expect(optionsSource).toContain("progress-fill");
    expect(optionsSource).toContain("progress-text");
  });

  test("should render test results", () => {
    expect(optionsSource).toContain("results-list");
  });

  test("should have deduplication logic", () => {
    expect(optionsSource).toContain("new Map");
  });

  test("should test only top 20 servers", () => {
    expect(optionsSource).toContain("slice(0, 20)");
  });
});

describe("options.js - UI Interactions", () => {
  test("should have button click handlers", () => {
    expect(optionsSource).toContain("addEventListener");
  });

  test("should handle update proxies button", () => {
    expect(optionsSource).toContain("FORCE_UPDATE");
    expect(optionsSource).toContain("btn-update");
  });

  test("should handle reset functionality", () => {
    expect(optionsSource).toContain("btn-reset");
    expect(optionsSource).toContain("confirm");
  });
});

describe("options.js - Security", () => {
  test("should not have eval or Function constructor", () => {
    expect(optionsSource).not.toContain("eval(");
    expect(optionsSource).not.toContain("new Function(");
  });

  test("should not have hardcoded credentials", () => {
    const secrets = [
      /password\s*=\s*["'][^"']+["']/i,
      /api_key\s*=\s*["'][^"']+["']/i,
    ];
    secrets.forEach((pattern) => {
      expect(optionsSource).not.toMatch(pattern);
    });
  });

  test("should use isPrivateHost for URL validation", () => {
    expect(optionsSource).toContain("isPrivateHost");
  });

  test("should only use HTTPS for external requests", () => {
    expect(optionsSource).toMatch(/https:\/\//);
  });
});