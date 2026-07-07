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
  test("should define PROXY_SOURCE constant", () => {
    expect(optionsSource).toContain("PROXY_SOURCE");
  });

  test("should have required functions", () => {
    const requiredFunctions = [
      "loadSettings",
      "saveSettings",
      "loadStats",
      "testAllServers",
      "testPing",
      "setupEventListeners",
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
      "auto-ping",
      "working-only",
      "auto-select",
      "timeout",
      "max-ping",
    ];

    elements.forEach((el) => {
      expect(optionsSource).toContain(el);
    });
  });
});

describe("options.js - Settings Management", () => {
  test("should save settings to chrome.storage", () => {
    expect(optionsSource).toContain("chrome.storage.local.set");
  });

  test("should load settings from chrome.storage", () => {
    expect(optionsSource).toContain("chrome.storage.local.get");
  });

  test("should have fallback to localStorage", () => {
    expect(optionsSource).toContain("localStorage");
  });

  test("should have auto-connect setting", () => {
    expect(optionsSource).toContain("autoConnect");
  });

  test("should have kill-switch setting", () => {
    expect(optionsSource).toContain("killSwitch");
  });

  test("should have DNS setting", () => {
    expect(optionsSource).toContain("dns");
  });

  test("should have default settings", () => {
    expect(optionsSource).toContain("defaultSettings");
  });
});

describe("options.js - Server Testing", () => {
  test("should have testAllServers function", () => {
    expect(optionsSource).toContain("async function testAllServers");
  });

  test("should have progress tracking", () => {
    expect(optionsSource).toContain("progressFill");
    expect(optionsSource).toContain("progressText");
  });

  test("should render test results", () => {
    expect(optionsSource).toContain("resultsList");
    expect(optionsSource).toContain("innerHTML");
  });

  test("should have deduplication logic", () => {
    expect(optionsSource).toContain("Deduplicate");
    expect(optionsSource).toContain("Map");
  });
});

describe("options.js - UI Interactions", () => {
  test("should have button click handlers", () => {
    expect(optionsSource).toContain("addEventListener");
  });

  test("should handle export functionality", () => {
    expect(optionsSource).toContain("btn-export");
    expect(optionsSource).toContain("download");
  });

  test("should handle reset functionality", () => {
    expect(optionsSource).toContain("btn-reset");
    expect(optionsSource).toContain("confirm");
  });

  test("should handle update button", () => {
    expect(optionsSource).toContain("btn-update-proxies");
    expect(optionsSource).toContain("FORCE_UPDATE");
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
});
