/* ============================================
   Popup Events - Event listener setup
   Connects DOM events to module functions
   ============================================ */

import { el } from "./dom.js";
import { debounce } from "../shared/utils.js";
import { toggleConnection, autoConnect } from "./connection.js";
import { fetchServers } from "./servers.js";
import { renderServerList } from "./servers.js";

/**
 * Set up all event listeners.
 */
export function setupEvents() {
  try {
    // Connect button
    el.connectBtn.addEventListener("click", toggleConnection);

    // Auto-connect button
    el.btnAutoConnect.addEventListener("click", autoConnect);

    // Search with debounce
    el.searchInput.addEventListener(
      "input",
      debounce(function (e) {
        try {
          renderServerList(e.target.value);
        } catch (err) {}
      }, 300)
    );

    // Refresh button
    el.btnRefresh.addEventListener("click", function () {
      fetchServers(true).catch(function () {});
    });

    // Settings button
    el.btnSettings.addEventListener("click", function () {
      try {
        if (
          chrome &&
          chrome.runtime &&
          chrome.runtime.openOptionsPage
        ) {
          chrome.runtime.openOptionsPage();
        } else {
          window.open("options.html", "_blank");
        }
      } catch (e) {
        console.error("settings click error:", e);
      }
    });
  } catch (e) {
    console.error("setupEvents error:", e);
  }
}
