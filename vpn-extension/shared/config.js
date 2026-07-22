/* ============================================
   Shared Config - Constants & Configuration
   Reusable across popup, background, options
   ============================================ */

export const PROXY_SOURCE =
  "https://cdn.jsdelivr.net/gh/tahatehran/worker-vpn-proxy/best_proxies.json";

export const IP_CHECK_URL = "https://api.myip.com";

// Cache size limits
export const MAX_GEO_CACHE = 500;
export const MAX_PING_CACHE = 200;
export const MAX_PROXY_CACHE = 1000;

// Async chunking
export const CHUNK_SIZE = 3;
export const PING_TEST_COUNT = 15;

// Timeouts (ms)
export const GEO_TIMEOUT = 3000;
export const GEO_FALLBACK_TIMEOUT = 2000;
export const VERIFY_TIMEOUT = 5000;
export const PING_DEFAULT_TIMEOUT = 3000;
export const CONNECT_DELAY = 1200;

// Ping cache TTL (ms)
export const PING_CACHE_TTL = 60000;

// Refresh interval (hours)
export const REFRESH_INTERVAL_HOURS = 24;
