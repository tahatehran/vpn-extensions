/* ============================================
   Popup DOM - DOM element references
   Single source of truth for all element IDs
   ============================================ */

/**
 * DOM element cache.
 * Populated once on init, reused everywhere.
 */
export var el = {};

/**
 * Initialize all DOM element references.
 * Safe to call once on DOMContentLoaded.
 */
export function initElements() {
  try {
    el.statusRing = document.getElementById("status-ring");
    el.statusLabel = document.getElementById("status-label");
    el.statusSub = document.getElementById("status-sub");
    el.connectBtn = document.getElementById("connect-btn");
    el.connectText = document.getElementById("connect-text");
    el.btnAutoConnect = document.getElementById("btn-auto-connect");
    el.serverList = document.getElementById("server-list");
    el.searchInput = document.getElementById("search-input");
    el.serverCount = document.getElementById("server-count");
    el.btnRefresh = document.getElementById("btn-refresh");
    el.btnSettings = document.getElementById("btn-settings");
    el.statPing = document.getElementById("stat-ping");
    el.statSpeed = document.getElementById("stat-speed");
    el.statUpload = document.getElementById("stat-upload");
    el.statDownload = document.getElementById("stat-download");
    el.lastUpdate = document.getElementById("last-update");
  } catch (e) {
    console.error("initElements failed:", e);
  }
}
