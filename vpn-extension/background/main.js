/* ============================================
   Background Main - Entry point for service worker
   Wires alarms, messages, proxy error handler
   ============================================ */

import { safeStorageSet } from "../shared/storage.js";
import { fetchAndUpdateProxies, isConnected } from "./proxy-manager.js";
import { setupDailyAlarm, setupAlarmListener } from "./alarms.js";
import { setupMessageListener } from "./messages.js";

// ── Install handler ──
chrome.runtime.onInstalled.addListener(function (details) {
  try {
    console.log("MOVTI VPN Shield installed:", details.reason);
    safeStorageSet({
      connected: false,
      selectedServer: null,
      serverList: [],
      lastUpdate: null,
      settings: {
        autoConnect: false,
        killSwitch: false,
        dns: "default",
      },
    });
    setupDailyAlarm();
    fetchAndUpdateProxies();
  } catch (e) {
    console.error("onInstalled error:", e);
  }
});

// ── Startup handler ──
chrome.runtime.onStartup.addListener(async function () {
  try {
    setupDailyAlarm();
    var connected = await isConnected();
    if (!connected) {
      // Import dynamically to avoid circular deps
      var { checkAndUpdateProxies } = await import("./proxy-manager.js");
      checkAndUpdateProxies();
    } else {
      console.log("VPN connected, skipping update on startup");
    }
  } catch (e) {
    console.error("onStartup error:", e);
  }
});

// ── Proxy error handler ──
try {
  if (chrome.proxy && chrome.proxy.onError) {
    chrome.proxy.onError.addListener(function (details) {
      try {
        console.error("Proxy error:", details);
        safeStorageSet({ connected: false });
        chrome.runtime.sendMessage(
          { type: "PROXY_ERROR", error: details.error },
          function () {
            if (chrome.runtime.lastError) {
              /* popup closed */
            }
          }
        );
      } catch (e) {
        console.error("proxy.onError handler error:", e);
      }
    });
  }
} catch (e) {
  console.error("proxy.onError setup error:", e);
}

// ── Wire up listeners ──
setupAlarmListener();
setupMessageListener();
