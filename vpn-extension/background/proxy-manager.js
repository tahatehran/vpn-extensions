/* ============================================
   Background Proxy Manager - Fetch & cache proxies
   Map-based dedup, retry logic, guard flag
   ============================================ */

import { PROXY_SOURCE, MAX_PROXY_CACHE } from "../shared/config.js";
import { safeStorageSet, safeStorageGet } from "../shared/storage.js";

const MAX_RETRY = 2;
var fetchInProgress = false;
var proxyCacheMap = new Map();

/**
 * Check if currently connected to VPN.
 * @returns {Promise<boolean>}
 */
export async function isConnected() {
  var data = await safeStorageGet(["connected"]);
  return data.connected === true;
}

/**
 * Fetch and update proxy list from CDN.
 * Uses Map for dedup, retry on failure, guard against concurrent calls.
 * @returns {Promise<void>}
 */
export async function fetchAndUpdateProxies() {
  if (fetchInProgress) {
    console.log("Fetch already in progress, skipping");
    return;
  }
  fetchInProgress = true;

  for (var attempt = 0; attempt <= MAX_RETRY; attempt++) {
    try {
      console.log("Fetching proxies (attempt " + (attempt + 1) + ")...");
      var response = await fetch(PROXY_SOURCE);
      if (!response.ok) throw new Error("HTTP " + response.status);
      var json = await response.json();
      var proxies = json.proxies || [];

      // Deduplicate with Map
      var proxyMap = new Map();
      for (var i = 0; i < proxies.length; i++) {
        var p = proxies[i];
        var key = p.ip + ":" + p.port;
        if (!proxyMap.has(key) || p.time_ms < proxyMap.get(key).time_ms) {
          proxyMap.set(key, p);
        }
      }

      var servers = [];
      var idx = 0;
      proxyMap.forEach(function (proxy) {
        servers.push({
          id: idx++,
          ip: proxy.ip,
          port: proxy.port,
          ping: Math.round(proxy.time_ms),
          status: proxy.status,
          proxyStr: proxy.proxy_str,
        });
      });

      servers.sort(function (a, b) {
        return a.ping - b.ping;
      });

      safeStorageSet({
        serverList: servers,
        lastUpdate: json.timestamp || new Date().toISOString(),
      });

      // Update in-memory cache
      proxyCacheMap.clear();
      servers.forEach(function (s) {
        if (proxyCacheMap.size < MAX_PROXY_CACHE) {
          proxyCacheMap.set(s.ip + ":" + s.port, s);
        }
      });

      console.log("Proxy list updated: " + servers.length + " servers");
      fetchInProgress = false;
      return;
    } catch (error) {
      console.error("Fetch attempt " + (attempt + 1) + " failed:", error);
      if (attempt < MAX_RETRY) {
        await new Promise(function (r) {
          setTimeout(r, 1000 * (attempt + 1));
        });
      }
    }
  }
  console.error("All fetch attempts failed");
  fetchInProgress = false;
}

/**
 * Check if update is needed (older than 24h) and fetch if so.
 * Skips if VPN is connected.
 */
export async function checkAndUpdateProxies() {
  try {
    var connected = await isConnected();
    if (connected) return;
    var data = await safeStorageGet(["lastUpdate"]);
    if (!data.lastUpdate) {
      fetchAndUpdateProxies();
      return;
    }
    var hoursSince =
      (Date.now() - new Date(data.lastUpdate).getTime()) / 3600000;
    if (hoursSince >= 24) fetchAndUpdateProxies();
  } catch (e) {
    console.error("checkAndUpdateProxies error:", e);
  }
}
