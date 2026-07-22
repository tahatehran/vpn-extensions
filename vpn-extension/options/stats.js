/* ============================================
   Options Stats - Load proxy stats for display
   Uses Map for dedup
   ============================================ */

import { PROXY_SOURCE } from "../shared/config.js";

/**
 * Load proxy stats and update DOM elements.
 * @param {Object} elements - DOM elements reference
 * @returns {Promise<void>}
 */
export async function loadStats(elements) {
  try {
    var resp = await fetch(PROXY_SOURCE);
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    var json = await resp.json();
    var proxies = json.proxies || [];

    // Deduplicate with Map
    var proxyMap = new Map();
    for (var i = 0; i < proxies.length; i++) {
      var p = proxies[i];
      var k = p.ip + ":" + p.port;
      if (
        !proxyMap.has(k) ||
        p.time_ms < proxyMap.get(k).time_ms
      ) {
        proxyMap.set(k, p);
      }
    }

    var servers = Array.from(proxyMap.values());
    var uniqueIPs = new Map();
    var countries = new Map();

    for (var j = 0; j < servers.length; j++) {
      uniqueIPs.set(servers[j].ip, true);
      countries.set(servers[j].ip.split(".")[0], true);
    }

    if (elements.statTotal)
      elements.statTotal.textContent = servers.length;
    if (elements.statWorking)
      elements.statWorking.textContent = servers.filter(
        function (s) {
          return s.time_ms < 500;
        }
      ).length;
    if (elements.statCountries)
      elements.statCountries.textContent = countries.size;
    if (elements.proxyCount)
      elements.proxyCount.textContent =
        servers.length +
        " \u0633\u0631\u0648\u0631 (" +
        uniqueIPs.size +
        " IP)";

    if (json.timestamp && elements.statLastUpdate) {
      var d = new Date(json.timestamp);
      elements.statLastUpdate.textContent =
        d.toLocaleDateString("fa-IR", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
    }
  } catch (error) {
    console.error("loadStats error:", error);
    if (elements.proxyCount)
      elements.proxyCount.textContent =
        "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC";
  }
}
