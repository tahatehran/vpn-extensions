/* ============================================
   Shared Geo - Country detection via GeoIP
   Uses Map cache, dual provider fallback
   ============================================ */

import { cachePut } from "./utils.js";
import { codeToFlag, COUNTRY_NAMES } from "./country.js";
import { MAX_GEO_CACHE, GEO_TIMEOUT, GEO_FALLBACK_TIMEOUT } from "./config.js";

// Module-level geo cache
const geoCache = new Map();

/**
 * Detect country for an IP address using GeoIP services.
 * Tries ip-api.com first, then ipinfo.io as fallback.
 * Results are cached in a Map.
 * @param {string} ip - IP address to look up
 * @returns {Promise<{flag: string, name: string}>}
 */
export async function detectCountry(ip) {
  if (geoCache.has(ip)) return geoCache.get(ip);

  var fallback = { flag: "\uD83C\uDF10", name: "\u0633\u0631\u0648\u0631 " + ip.split(".")[0] };

  // Provider 1: ip-api.com
  try {
    var c1 = new AbortController();
    var t1 = setTimeout(function () {
      try { c1.abort(); } catch (_) {}
    }, GEO_TIMEOUT);
    var r1 = await fetch(
      "http://ip-api.com/json/" + ip + "?fields=status,country,countryCode",
      { signal: c1.signal }
    );
    clearTimeout(t1);
    var d1 = await r1.json();
    if (d1.status === "success" && d1.country) {
      var res = {
        flag: codeToFlag(d1.countryCode),
        name: COUNTRY_NAMES[d1.countryCode] || d1.country,
      };
      cachePut(geoCache, ip, res, MAX_GEO_CACHE);
      return res;
    }
  } catch (e) {
    // Try fallback
  }

  // Provider 2: ipinfo.io
  try {
    var c2 = new AbortController();
    var t2 = setTimeout(function () {
      try { c2.abort(); } catch (_) {}
    }, GEO_FALLBACK_TIMEOUT);
    var r2 = await fetch("https://ipinfo.io/" + ip + "/json", {
      signal: c2.signal,
    });
    clearTimeout(t2);
    var d2 = await r2.json();
    if (d2.country) {
      var res2 = {
        flag: codeToFlag(d2.country),
        name: COUNTRY_NAMES[d2.country] || d2.country,
      };
      cachePut(geoCache, ip, res2, MAX_GEO_CACHE);
      return res2;
    }
  } catch (e) {
    // Ignore
  }

  cachePut(geoCache, ip, fallback, MAX_GEO_CACHE);
  return fallback;
}

/**
 * Clear the geo cache.
 */
export function clearGeoCache() {
  geoCache.clear();
}
