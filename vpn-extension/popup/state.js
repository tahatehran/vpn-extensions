/* ============================================
   Popup State - State management
   Load/save from chrome.storage or localStorage
   ============================================ */

import { safeStorageGet, safeStorageSet } from "../shared/storage.js";
import { REFRESH_INTERVAL_HOURS } from "../shared/config.js";

/**
 * Application state singleton.
 * Mutated in-place by other modules.
 */
export var state = {
  connected: false,
  connecting: false,
  selectedServer: null,
  servers: [],
  lastUpdate: null,
  startTime: null,
};

/**
 * Load saved state from storage.
 * @returns {Promise<void>}
 */
export async function loadSavedState() {
  try {
    var data = await safeStorageGet([
      "connected",
      "selectedServer",
      "serverList",
      "lastUpdate",
    ]);
    if (data.connected) state.connected = data.connected;
    if (data.selectedServer) state.selectedServer = data.selectedServer;
    if (data.serverList && data.serverList.length > 0)
      state.servers = data.serverList;
    if (data.lastUpdate) state.lastUpdate = data.lastUpdate;
  } catch (e) {
    console.error("loadSavedState error:", e);
  }
}

/**
 * Save current state to storage.
 * @returns {Promise<void>}
 */
export async function saveState() {
  try {
    var data = {
      connected: state.connected,
      selectedServer: state.selectedServer,
      serverList: state.servers,
      lastUpdate: state.lastUpdate,
    };
    safeStorageSet(data);
  } catch (e) {
    console.error("saveState error:", e);
  }
}

/**
 * Check if server list needs refresh (older than 24h).
 * @returns {boolean}
 */
export function needsRefresh() {
  if (!state.lastUpdate) return true;
  try {
    var hours =
      (Date.now() - new Date(state.lastUpdate).getTime()) / 3600000;
    return hours >= REFRESH_INTERVAL_HOURS;
  } catch (e) {
    return true;
  }
}
