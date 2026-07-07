/* ============================================
   Tests: background.js Functions
   ============================================ */

const fs = require("fs");
const { loadFileAsString } = require("./helpers");

let bgSource;
beforeAll(() => {
  bgSource = loadFileAsString("vpn-extension/background.js");
});

describe("background.js - Source Analysis", () => {
  test("should define PROXY_SOURCE constant", () => {
    expect(bgSource).toContain("PROXY_SOURCE");
    expect(bgSource).toContain("cdn.jsdelivr.net");
  });

  test("should define IP_CHECK_URL constant", () => {
    expect(bgSource).toContain("IP_CHECK_URL");
  });

  test("should have required functions", () => {
    const requiredFunctions = [
      "isConnected",
      "fetchAndUpdateProxies",
      "checkAndUpdateProxies",
      "setupDailyAlarm",
      "verifyConnectionBackground",
      "autoConnectBackground",
      "connectToServer",
    ];

    requiredFunctions.forEach((fn) => {
      const fnRegex = new RegExp(
        `(?:async\\s+)?function\\s+${fn}|(?:async\\s+)?const\\s+${fn}\\s*=`,
        "m"
      );
      expect(bgSource).toMatch(fnRegex);
    });
  });

  test("should have chrome.runtime.onInstalled handler", () => {
    expect(bgSource).toContain("chrome.runtime.onInstalled.addListener");
  });

  test("should have chrome.runtime.onStartup handler", () => {
    expect(bgSource).toContain("chrome.runtime.onStartup.addListener");
  });

  test("should have chrome.alarms.onAlarm handler", () => {
    expect(bgSource).toContain("chrome.alarms.onAlarm.addListener");
  });

  test("should have chrome.runtime.onMessage handler", () => {
    expect(bgSource).toContain("chrome.runtime.onMessage.addListener");
  });

  test("should handle GET_STATUS message", () => {
    expect(bgSource).toContain("GET_STATUS");
  });

  test("should handle FORCE_UPDATE message", () => {
    expect(bgSource).toContain("FORCE_UPDATE");
  });

  test("should handle SET_PROXY message", () => {
    expect(bgSource).toContain("SET_PROXY");
  });

  test("should handle REMOVE_PROXY message", () => {
    expect(bgSource).toContain("REMOVE_PROXY");
  });

  test("should handle VERIFY_CONNECTION message", () => {
    expect(bgSource).toContain("VERIFY_CONNECTION");
  });

  test("should handle AUTO_CONNECT message", () => {
    expect(bgSource).toContain("AUTO_CONNECT");
  });

  test("should use service_worker pattern (no window)", () => {
    // background.js should not use window/document APIs
    expect(bgSource).not.toContain("document.getElementById");
    expect(bgSource).not.toContain("window.addEventListener");
  });
});

describe("background.js - Alarm Setup", () => {
  test("should create alarm with 1440 minute period (24h)", () => {
    expect(bgSource).toContain("periodInMinutes: 1440");
  });

  test("should create dailyProxyUpdate alarm", () => {
    expect(bgSource).toContain("dailyProxyUpdate");
  });
});

describe("background.js - Message Handling", () => {
  test("should return true for async message responses", () => {
    // All message handlers should return true for async sendResponse
    const messageSection = bgSource.substring(
      bgSource.indexOf("chrome.runtime.onMessage.addListener")
    );
    // Count return true statements
    const returnTrueCount = (messageSection.match(/return\s+true/g) || []).length;
    expect(returnTrueCount).toBeGreaterThanOrEqual(4);
  });

  test("should use chrome.proxy.settings for proxy management", () => {
    expect(bgSource).toContain("chrome.proxy.settings.set");
  });

  test("should have proxy error handler", () => {
    expect(bgSource).toContain("chrome.proxy");
    expect(bgSource).toContain("onError");
  });
});

describe("background.js - Security", () => {
  test("should not have hardcoded credentials", () => {
    const secrets = [
      /password\s*=\s*["'][^"']+["']/i,
      /api_key\s*=\s*["'][^"']+["']/i,
      /secret\s*=\s*["'][^"']+["']/i,
    ];
    secrets.forEach((pattern) => {
      expect(bgSource).not.toMatch(pattern);
    });
  });

  test("should not use eval or Function constructor", () => {
    expect(bgSource).not.toContain("eval(");
    expect(bgSource).not.toContain("new Function(");
  });

  test("should not have innerHTML usage (XSS risk)", () => {
    expect(bgSource).not.toContain("innerHTML");
  });
});
