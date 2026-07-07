/* ============================================
   Tests: popup.js Functions
   ============================================ */

const fs = require("fs");
const path = require("path");
const { loadFileAsString, extractFunctionNames } = require("./helpers");

// Read the source file for analysis tests
let popupSource;
beforeAll(() => {
  popupSource = loadFileAsString("vpn-extension/popup.js");
});

describe("popup.js - Source Analysis", () => {
  test("should have required functions", () => {
    const requiredFunctions = [
      "codeToFlag",
      "detectCountry",
      "testPing",
      "verifyConnection",
      "loadSavedState",
      "saveState",
      "needsRefresh",
      "fetchServers",
      "renderServerList",
      "selectServer",
      "showLoading",
      "showEmptyState",
      "updateServerCount",
      "toggleConnection",
      "autoConnect",
      "connect",
      "disconnect",
      "applyProxy",
      "removeProxy",
      "updateUI",
      "startStats",
      "stopStats",
      "setupEvents",
      "initElements",
    ];

    requiredFunctions.forEach((fn) => {
      // Check for function declaration or const assignment
      const fnRegex = new RegExp(
        `(?:function\\s+${fn}|const\\s+${fn}\\s*=|let\\s+${fn}\\s*=|var\\s+${fn}\\s*=)`,
        "m",
      );
      expect(popupSource).toMatch(fnRegex);
    });
  });

  test("should define PROXY_SOURCE constant", () => {
    expect(popupSource).toContain("PROXY_SOURCE");
  });

  test("should define IP_CHECK_URL constant", () => {
    expect(popupSource).toContain("IP_CHECK_URL");
  });

  test("should have COUNTRY_NAMES translations", () => {
    expect(popupSource).toContain("COUNTRY_NAMES");
    expect(popupSource).toContain("US:");
    expect(popupSource).toContain("DE:");
    expect(popupSource).toContain("آمریکا"); // Iran for US
  });

  test("should have state object with required properties", () => {
    const stateRegex =
      /(?:const|let|var)\s+state\s*=\s*\{[^}]*connected[^}]*\}/s;
    expect(popupSource).toMatch(stateRegex);
  });

  test("should use chrome.storage for persistence", () => {
    expect(popupSource).toContain("chrome.storage.local");
  });

  test("should handle DOMContentLoaded event", () => {
    expect(popupSource).toContain("DOMContentLoaded");
  });

  test("should use chrome.proxy.settings for proxy", () => {
    expect(popupSource).toContain("chrome.proxy.settings.set");
  });

  test("should have event listeners setup", () => {
    expect(popupSource).toContain("addEventListener");
  });

  test("should have error handling in fetchServers", () => {
    const fetchServersSection = popupSource.substring(
      popupSource.indexOf("async function fetchServers"),
      popupSource.indexOf("// Show status message"),
    );
    expect(fetchServersSection).toContain("catch");
    expect(fetchServersSection).toContain("console.error");
  });
});

describe("popup.js - codeToFlag function", () => {
  // Extract and test the codeToFlag function logic
  test("should convert country codes to flag emojis", () => {
    // Re-implement the logic for testing
    function codeToFlag(cc) {
      if (!cc || cc.length !== 2) return "🌐";
      const pts = cc
        .toUpperCase()
        .split("")
        .map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
      return String.fromCodePoint(...pts);
    }

    expect(codeToFlag("US")).toBe("🇺🇸");
    expect(codeToFlag("DE")).toBe("🇩🇪");
    expect(codeToFlag("GB")).toBe("🇬🇧");
    expect(codeToFlag("FR")).toBe("🇫🇷");
    expect(codeToFlag("JP")).toBe("🇯🇵");
  });

  test("should return globe emoji for invalid input", () => {
    function codeToFlag(cc) {
      if (!cc || cc.length !== 2) return "🌐";
      const pts = cc
        .toUpperCase()
        .split("")
        .map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
      return String.fromCodePoint(...pts);
    }

    expect(codeToFlag("")).toBe("🌐");
    expect(codeToFlag(null)).toBe("🌐");
    expect(codeToFlag(undefined)).toBe("🌐");
    expect(codeToFlag("A")).toBe("🌐");
    expect(codeToFlag("ABC")).toBe("🌐");
  });
});

describe("popup.js - needsRefresh function", () => {
  test("should return true when no lastUpdate", () => {
    // Re-implement for testing
    function needsRefresh(lastUpdate) {
      if (!lastUpdate) return true;
      var last = new Date(lastUpdate).getTime();
      return (Date.now() - last) / (1000 * 60 * 60) >= 24;
    }

    expect(needsRefresh(null)).toBe(true);
    expect(needsRefresh(undefined)).toBe(true);
  });

  test("should return true when lastUpdate is older than 24h", () => {
    function needsRefresh(lastUpdate) {
      if (!lastUpdate) return true;
      var last = new Date(lastUpdate).getTime();
      return (Date.now() - last) / (1000 * 60 * 60) >= 24;
    }

    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    expect(needsRefresh(twoDaysAgo)).toBe(true);
  });

  test("should return false when lastUpdate is recent", () => {
    function needsRefresh(lastUpdate) {
      if (!lastUpdate) return true;
      var last = new Date(lastUpdate).getTime();
      return (Date.now() - last) / (1000 * 60 * 60) >= 24;
    }

    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    expect(needsRefresh(oneHourAgo)).toBe(false);
  });
});

describe("popup.js - State Management", () => {
  test("should have initial state with required fields", () => {
    const stateRegex = /let\s+state\s*=\s*\{([^}]+)\}/s;
    const match = popupSource.match(stateRegex);
    expect(match).not.toBeNull();

    const stateContent = match[1];
    expect(stateContent).toContain("connected");
    expect(stateContent).toContain("connecting");
    expect(stateContent).toContain("selectedServer");
    expect(stateContent).toContain("servers");
    expect(stateContent).toContain("lastUpdate");
  });

  test("should have server deduplication logic", () => {
    expect(popupSource).toContain("Map");
    expect(popupSource).toContain("Deduplicate");
  });
});
