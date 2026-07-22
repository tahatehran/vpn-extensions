/* ============================================
   Popup Main - Entry point
   Wires all popup modules together
   ============================================ */

import { initElements } from "./dom.js";
import { loadSavedState } from "./state.js";
import { updateUI } from "./ui.js";
import { fetchServers } from "./servers.js";
import { setupEvents } from "./events.js";
import { state } from "./state.js";

// ── Bootstrap ──
document.addEventListener("DOMContentLoaded", async function () {
  try {
    initElements();
    await loadSavedState();
    updateUI(state);
    fetchServers(false).catch(function (e) {
      console.error("fetchServers init err:", e);
    });
    setupEvents();
  } catch (e) {
    console.error("DOMContentLoaded error:", e);
  }
});
