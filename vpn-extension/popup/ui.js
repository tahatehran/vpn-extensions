/* ============================================
   Popup UI - All visual state updates
   Pure functions that update DOM based on state
   ============================================ */

import { el } from "./dom.js";

/**
 * Show a status message in the subtitle.
 * @param {string} msg - Message text
 */
export function showStatus(msg) {
  try {
    if (el.statusSub && msg) el.statusSub.textContent = msg;
  } catch (e) {}
}

/**
 * Show or hide the loading spinner.
 * @param {boolean} show
 */
export function showLoading(show) {
  try {
    if (show) {
      el.serverList.innerHTML =
        '<div class="server-loading"><div class="spinner-sm"></div><span>\u062F\u0631 \u062D\u0627\u0644 \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC \u0648 \u062A\u0633\u062A \u0633\u0631\u0648\u0631\u0647\u0627...</span></div>';
    }
  } catch (e) {}
}

/**
 * Show an empty state message with icon.
 * @param {string} msg - Message text
 */
export function showEmptyState(msg) {
  try {
    el.serverList.innerHTML =
      '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 15h8M9 9h.01M15 9h.01"/></svg><span>' +
      msg +
      "</span></div>";
  } catch (e) {}
}

/**
 * Update the status ring, label, connect button, and stats display.
 * @param {Object} state - Application state
 */
export function updateUI(state) {
  try {
    var connected = state.connected;
    var connecting = state.connecting;
    var sel = state.selectedServer;

    // Status ring
    el.statusRing.className = "status-ring";
    if (connected) {
      el.statusRing.classList.add("connected");
      el.statusLabel.textContent = "\u0645\u062A\u0635\u0644";
      if (sel) {
        var c = sel.country || {
          flag: "\uD83C\uDF10",
          name: "\u0633\u0631\u0648\u0631",
        };
        el.statusSub.textContent =
          c.flag +
          " " +
          c.name +
          " - " +
          sel.ip +
          " (" +
          sel.ping +
          "ms)";
      } else {
        el.statusSub.textContent =
          "\u0627\u062A\u0635\u0627\u0644 \u0628\u0631\u0642\u0631\u0627\u0631 \u0627\u0633\u062A";
      }
    } else if (connecting) {
      el.statusRing.classList.add("connecting");
      el.statusLabel.textContent =
        "\u062F\u0631 \u062D\u0627\u0644 \u0627\u062A\u0635\u0627\u0644...";
    } else {
      el.statusLabel.textContent = "\u063A\u06CC\u0631\u0641\u0639\u0627\u0644";
      if (
        !el.statusSub.textContent ||
        el.statusSub.textContent ===
          "\u0628\u0631\u0627\u06CC \u0627\u062A\u0635\u0627\u0644 \u06A9\u0644\u06CC\u06A9 \u06A9\u0646\u06CC\u062F"
      )
        el.statusSub.textContent =
          "\u0628\u0631\u0627\u06CC \u0627\u062A\u0635\u0627\u0644 \u06A9\u0644\u06CC\u06A9 \u06A9\u0646\u06CC\u062F";
    }

    // Connect button
    el.connectBtn.className = "connect-btn";
    if (connected) {
      el.connectBtn.classList.add("connected");
      el.connectText.textContent =
        "\u0642\u0637\u0639 \u0627\u062A\u0635\u0627\u0644";
    } else if (connecting) {
      el.connectBtn.classList.add("loading");
      el.connectText.textContent =
        "\u0627\u062A\u0635\u0627\u0644...";
    } else {
      el.connectText.textContent =
        "\u0627\u062A\u0635\u0627\u0644";
    }

    // Reset stats when disconnected
    if (!connected) {
      el.statPing.textContent = "--";
      el.statSpeed.textContent = "--";
      el.statUpload.textContent = "--";
      el.statDownload.textContent = "--";
    }
  } catch (e) {
    console.error("updateUI error:", e);
  }
}

/**
 * Update server count and last update time.
 * @param {Object} state - Application state
 */
export function updateServerCount(state) {
  try {
    var working = state.servers.filter(function (s) {
      return s.working;
    }).length;
    var total = state.servers.length;

    // Count unique IPs using Map
    var ips = new Map();
    state.servers.forEach(function (s) {
      ips.set(s.ip, true);
    });

    el.serverCount.textContent =
      working +
      "/" +
      total +
      " \u0633\u0631\u0648\u0631 (" +
      ips.size +
      " IP)";

    if (el.lastUpdate && state.lastUpdate) {
      var d = new Date(state.lastUpdate);
      el.lastUpdate.textContent =
        "\u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC: " +
        d.toLocaleDateString("fa-IR", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
    }
  } catch (e) {
    console.error("updateServerCount error:", e);
  }
}
