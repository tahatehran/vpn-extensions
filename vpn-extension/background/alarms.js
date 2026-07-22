/* ============================================
   Background Alarms - Daily auto-update scheduling
   ============================================ */

import { checkAndUpdateProxies, fetchAndUpdateProxies, isConnected } from "./proxy-manager.js";

/**
 * Setup daily alarm for proxy list update (every 24h).
 */
export function setupDailyAlarm() {
  try {
    chrome.alarms.create("dailyProxyUpdate", {
      periodInMinutes: 1440,
    });
    console.log("Daily proxy update alarm scheduled");
  } catch (e) {
    console.error("setupDailyAlarm error:", e);
  }
}

/**
 * Handle alarm events.
 */
export function setupAlarmListener() {
  chrome.alarms.onAlarm.addListener(async function (alarm) {
    try {
      if (alarm.name === "dailyProxyUpdate") {
        var connected = await isConnected();
        if (connected) {
          console.log("VPN connected, skipping scheduled update");
          return;
        }
        console.log("Daily update triggered");
        fetchAndUpdateProxies();
      }
    } catch (e) {
      console.error("onAlarm error:", e);
    }
  });
}
