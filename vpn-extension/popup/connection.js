/* ============================================
   Popup Connection - Connect / Disconnect / Auto
   Applies proxy, manages connection state
   ============================================ */

import { CONNECT_DELAY } from "../shared/config.js";
import { yieldToMain } from "../shared/utils.js";
import { testPing, verifyConnection } from "../shared/network.js";
import { state, saveState } from "./state.js";
import {
  showStatus,
  updateUI,
} from "./ui.js";
import { fetchServers } from "./servers.js";
import { startStats, stopStats } from "./stats.js";

/**
 * Apply proxy settings for a server.
 * @param {Object} server - Server object with ip, port
 */
export function applyProxy(server) {
  try {
    if (chrome && chrome.proxy) {
      chrome.proxy.settings.set(
        {
          value: {
            mode: "fixed_servers",
            rules: {
              singleProxy: {
                scheme: "http",
                host: server.ip,
                port: parseInt(server.port),
              },
              bypassList: ["localhost", "127.0.0.1"],
            },
          },
          scope: "regular",
        },
        function () {
          console.log(
            "Proxy applied:",
            server.ip + ":" + server.port
          );
        }
      );
    }
  } catch (e) {
    console.error("applyProxy error:", e);
  }
}

/**
 * Remove proxy settings (direct connection).
 */
export function removeProxy() {
  try {
    if (chrome && chrome.proxy) {
      chrome.proxy.settings.set(
        { value: { mode: "direct" }, scope: "regular" },
        function () {
          console.log("Proxy removed");
        }
      );
    }
  } catch (e) {
    console.error("removeProxy error:", e);
  }
}

/**
 * Toggle between connect and disconnect.
 */
export async function toggleConnection() {
  if (state.connecting) return;
  try {
    state.connected ? disconnect() : connect();
  } catch (e) {
    console.error("toggleConnection error:", e);
  }
}

/**
 * Auto-connect to the fastest working server.
 */
export async function autoConnect() {
  try {
    showStatus(
      "\u062C\u0633\u062A\u062C\u0648\u06CC \u0633\u0631\u06CC\u0639\u062A\u0631\u06CC\u0646 \u0633\u0631\u0648\u0631..."
    );
    state.connecting = true;
    updateUI(state);

    if (state.servers.length === 0) await fetchServers(true);

    var workingServers = state.servers.filter(function (s) {
      return s.working;
    });

    if (workingServers.length === 0) {
      showStatus(
        "\u062A\u0633\u062A \u0633\u0631\u0648\u0631\u0647\u0627..."
      );
      var toTest = state.servers.slice(0, 10);
      for (var t = 0; t < toTest.length; t++) {
        showStatus(
          "\u062A\u0633\u062A " +
            (t + 1) +
            "/" +
            toTest.length +
            ": " +
            toTest[t].ip
        );
        var rp = await testPing(
          toTest[t].ip,
          toTest[t].port,
          2000
        );
        if (rp > 0) {
          toTest[t].ping = rp;
          toTest[t].working = true;
          workingServers.push(toTest[t]);
        }
        await yieldToMain();
      }
      state.servers.sort(function (a, b) {
        return a.working === b.working
          ? a.ping - b.ping
          : b.working - a.working;
      });
      await saveState();
    }

    if (workingServers.length === 0) {
      showStatus(
        "\u0647\u06CC\u0686 \u0633\u0631\u0648\u0631 \u0641\u0639\u0627\u0644\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F"
      );
      state.connecting = false;
      updateUI(state);
      return;
    }

    var fastest = workingServers[0];
    state.selectedServer = fastest;
    showStatus(
      "\u0627\u062A\u0635\u0627\u0644 \u0628\u0647 " +
        fastest.ip +
        "..."
    );
    applyProxy(fastest);
    await new Promise(function (r) {
      setTimeout(r, CONNECT_DELAY);
    });

    state.connected = true;
    state.connecting = false;
    state.startTime = Date.now();
    showStatus(
      "\u0645\u062A\u0635\u0644 " +
        (fastest.country ? fastest.country.name : "\u0633\u0631\u0648\u0631")
    );
    await saveState();
    updateUI(state);
    startStats();

    // Background verification (non-blocking)
    verifyConnection()
      .then(function (v) {
        if (!v.success)
          showStatus(
            "\u0645\u062A\u0635\u0644 (\u0628\u0631\u0636\u0639\u06CC \u0628\u0627 \u0645\u062D\u062F\u0648\u062F\u06CC\u062A \u0634\u0628\u06A9\u0647)"
          );
      })
      .catch(function () {});
  } catch (e) {
    console.error("autoConnect error:", e);
    state.connecting = false;
    updateUI(state);
  }
}

/**
 * Connect to the selected server.
 */
export async function connect() {
  try {
    if (!state.selectedServer && state.servers.length > 0) {
      state.selectedServer =
        state.servers.find(function (s) {
          return s.working;
        }) || state.servers[0];
    }
    if (!state.selectedServer) {
      showStatus(
        "\u0644\u0637\u0641\u0627\u064B \u0627\u0628\u062A\u062F\u0627 \u0633\u0631\u0648\u0631 \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646\u06CC\u062F"
      );
      return;
    }

    state.connecting = true;
    updateUI(state);
    showStatus(
      "\u062F\u0631 \u062D\u0627\u0644 \u0627\u062A\u0635\u0627\u0644..."
    );
    applyProxy(state.selectedServer);
    await new Promise(function (r) {
      setTimeout(r, CONNECT_DELAY);
    });

    state.connected = true;
    state.connecting = false;
    state.startTime = Date.now();
    showStatus("\u0645\u062A\u0635\u0644");
    await saveState();
    updateUI(state);
    startStats();

    // Background verification (non-blocking)
    verifyConnection()
      .then(function (v) {
        if (!v.success)
          showStatus(
            "\u0645\u062A\u0635\u0644 (\u0628\u0631\u0636\u0639\u06CC \u0628\u0627 \u0645\u062D\u062F\u0648\u062F\u06CC\u062A \u0634\u0628\u06A9\u0647)"
          );
      })
      .catch(function () {});
  } catch (e) {
    console.error("connect error:", e);
    state.connecting = false;
    updateUI(state);
  }
}

/**
 * Disconnect from VPN.
 */
export async function disconnect() {
  try {
    state.connected = false;
    state.connecting = false;
    state.startTime = null;
    removeProxy();
    await saveState();
    updateUI(state);
    stopStats();
    showStatus(
      "\u0642\u0637\u0639 \u0627\u062A\u0635\u0627\u0644"
    );
  } catch (e) {
    console.error("disconnect error:", e);
  }
}
