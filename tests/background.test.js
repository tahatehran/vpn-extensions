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
  test("should define PROXY_SOURCE constant (HTTPS)", () => {
    expect(bgSource).toContain("PROXY_SOURCE");
    expect(bgSource).toContain("https://cdn.jsdelivr.net");
    expect(bgSource).not.toContain("http://cdn.jsdelivr.net");
  });

  test("should define IP_CHECK_URL constant (HTTPS)", () => {
    expect(bgSource).toContain("IP_CHECK_URL");
    expect(bgSource).toContain("https://api.myip.com");
  });

  test("geo lookup stays HTTPS (ipinfo.io / ip-api.com in popup)", () => {
    const popupSource = loadFileAsString("vpn-extension/popup.js");
    expect(popupSource).toMatch(/https:\/\/(ipinfo|ip-api)\.com/);
    expect(popupSource).not.toContain("http://ipinfo.io");
    expect(popupSource).not.toContain("http://ip-api.com");
  });

  test("should have required functions", () => {
    const requiredFunctions = [
      "isConnected",
      "fetchProxyList",
      "refreshProxyList",
      "scheduleAlarms",
      "verifyConnection",
      "autoConnect",
      "setProxy",
      "clearProxy",
      "runWatchdog",
      "sanitizeServer",
      "sanitizeSettings",
      "isPrivateHost",
      "dedupeServers",
      "tryConnectFromList",
    ];

    requiredFunctions.forEach((fn) => {
      const fnRegex = new RegExp(
        `(?:async\\s+)?function\\s+${fn}\\s*\\(|(?:async\\s+)?const\\s+${fn}\\s*=`,
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

  test("should handle SAVE_SETTINGS message", () => {
    expect(bgSource).toContain("SAVE_SETTINGS");
  });

  test("should use service_worker pattern (no window/document)", () => {
    expect(bgSource).not.toContain("document.getElementById");
    expect(bgSource).not.toContain("window.addEventListener");
  });
});

describe("background.js - Alarm Setup", () => {
  test("should create dailyProxyUpdate alarm with 1440 minute period (24h)", () => {
    expect(bgSource).toContain("periodInMinutes: 1440");
    expect(bgSource).toContain("dailyProxyUpdate");
  });

  test("should create proxyWatchdog alarm for kill switch", () => {
    expect(bgSource).toContain("proxyWatchdog");
    expect(bgSource).toContain("PROXY_CHECK_INTERVAL_MIN");
  });
});

describe("background.js - Kill Switch Implementation", () => {
  test("should have runWatchdog function for kill switch", () => {
    expect(bgSource).toContain("runWatchdog");
  });

  test("should check killSwitch setting in watchdog", () => {
    expect(bgSource).toContain("settings.killSwitch");
  });

  test("should clear proxy when VPN drops and killSwitch is on", () => {
    expect(bgSource).toContain("clearProxy");
    expect(bgSource).toContain("Kill switch");
  });
});

describe("background.js - Message Handling", () => {
  test("should return true for async message responses", () => {
    // Message handler should return true for async sendResponse
    const handlerStart = bgSource.indexOf("chrome.runtime.onMessage.addListener");
    const handlerEnd = bgSource.indexOf("function handleMessage");
    const messageSection =
      handlerEnd > handlerStart
        ? bgSource.substring(handlerStart, handlerEnd)
        : bgSource.substring(handlerStart);
    // Count return true statements in handler
    const returnTrueCount = (messageSection.match(/return\s+true\b/g) || []).length;
    expect(returnTrueCount).toBeGreaterThanOrEqual(1);
  });

  test("should use chrome.proxy.settings for proxy management", () => {
    expect(bgSource).toContain("chrome.proxy.settings.set");
  });

  test("should have proxy error handler", () => {
    expect(bgSource).toContain("chrome.proxy");
    expect(bgSource).toContain("onError");
    expect(bgSource).toContain("addListener");
  });

  test("should check chrome.runtime.lastError after setProxy", () => {
    expect(bgSource).toContain("chrome.runtime.lastError");
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

  test("should validate server input with sanitizeServer", () => {
    expect(bgSource).toContain("sanitizeServer");
    expect(bgSource).toContain("isPrivateHost");
  });

  test("should reject private hosts in isPrivateHost", () => {
    expect(bgSource).toContain("isPrivateHost");
    expect(bgSource).toMatch(/localhost|127\.0\.0\.1|192\.168|10\./);
  });
});

describe("background.js - Proxy Validation", () => {
  test("should validate IP format", () => {
    expect(bgSource).toContain("isIp");
    expect(bgSource).toContain("clampPort");
  });

  test("should deduplicate servers by IP:PORT", () => {
    expect(bgSource).toContain("dedupeServers");
  });

  test("should use best ping when deduplicating", () => {
    expect(bgSource).toContain("ping");
  });
});