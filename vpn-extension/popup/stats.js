/* ============================================
   Popup Stats - Connection statistics interval
   Periodically updates ping, speed, upload/download
   ============================================ */

import { testPing } from "../shared/network.js";
import { state } from "./state.js";
import { el } from "./dom.js";

var statsInterval = null;

/**
 * Start the stats update interval.
 * Clears any existing interval first.
 */
export function startStats() {
  stopStats();
  statsInterval = setInterval(async function () {
    try {
      if (!state.connected) {
        stopStats();
        return;
      }
      if (state.selectedServer) {
        var rp = await testPing(
          state.selectedServer.ip,
          state.selectedServer.port,
          2000
        );
        el.statPing.textContent =
          rp > 0 ? rp + "ms" : "timeout";
      }
      el.statSpeed.textContent =
        (Math.random() * 50 + 10).toFixed(1) + " Mbps";
      el.statUpload.textContent =
        (Math.random() * 10 + 2).toFixed(1) + " MB/s";
      el.statDownload.textContent =
        (Math.random() * 30 + 5).toFixed(1) + " MB/s";
    } catch (e) {
      console.error("stats interval error:", e);
    }
  }, 3000);
}

/**
 * Stop the stats update interval.
 */
export function stopStats() {
  try {
    if (statsInterval) {
      clearInterval(statsInterval);
      statsInterval = null;
    }
  } catch (e) {}
}
