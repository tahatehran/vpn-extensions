/* ============================================
   Shared Network - Ping test & Connection verify
   Uses fetch with abort/timeout, Map-cached
   ============================================ */

import { cachePut } from "./utils.js";
import {
  MAX_PING_CACHE,
  PING_DEFAULT_TIMEOUT,
  PING_CACHE_TTL,
  VERIFY_TIMEOUT,
  IP_CHECK_URL,
} from "./config.js";

// Module-level ping cache
const pingCache = new Map();

/**
 * Test ping to a server using fetch with timeout.
 * Results are cached in a Map with TTL.
 * @param {string} ip - Server IP
 * @param {number} port - Server port
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<number>} Ping in ms, or -1 on failure
 */
export function testPing(ip, port, timeout) {
  timeout = timeout || PING_DEFAULT_TIMEOUT;
  var ck = ip + ":" + port;

  // Check cache
  var cached = pingCache.get(ck);
  if (cached && Date.now() - cached.t < PING_CACHE_TTL) {
    return Promise.resolve(cached.p);
  }

  return new Promise(function (resolve) {
    var start = performance.now();
    var finished = false;
    var ctrl = new AbortController();

    var fallbackTimer = setTimeout(function () {
      finish(-1);
    }, timeout + 200);

    function finish(val) {
      if (finished) return;
      finished = true;
      clearTimeout(fallbackTimer);
      try { ctrl.abort(); } catch (_) {}
      cachePut(pingCache, ck, { p: val, t: Date.now() }, MAX_PING_CACHE);
      resolve(val);
    }

    try {
      fetch("http://" + ip + ":" + port + "/", {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-store",
        signal: ctrl.signal,
      })
        .then(function () {
          finish(Math.round(performance.now() - start));
        })
        .catch(function () {
          var elapsed = Math.round(performance.now() - start);
          finish(elapsed > 10 && elapsed < timeout ? elapsed : -1);
        });
    } catch (e) {
      finish(-1);
    }
  });
}

/**
 * Verify current connection by checking public IP.
 * @returns {Promise<{success: boolean, ip?: string, country?: string, error?: string}>}
 */
export async function verifyConnection() {
  try {
    var controller = new AbortController();
    var timer = setTimeout(function () {
      try { controller.abort(); } catch (_) {}
    }, VERIFY_TIMEOUT);

    var resp = await fetch(IP_CHECK_URL, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);

    var data = await resp.json();
    if (data && data.ip) {
      return { success: true, ip: data.ip, country: data.country || "" };
    }
    return { success: false };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}

/**
 * Clear the ping cache (useful on disconnect).
 */
export function clearPingCache() {
  pingCache.clear();
}
