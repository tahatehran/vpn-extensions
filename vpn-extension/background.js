/* ============================================
   MOVTI VPN Shield - Background Service Worker
   Daily auto-update of proxy list + kill switch
   ============================================ */

const PROXY_SOURCE =
  "https://cdn.jsdelivr.net/gh/tahatehran/worker-vpn-proxy/best_proxies.json";

const IP_CHECK_URL = "https://api.myip.com";
// Geo lookup (ipinfo.io / ip-api.com) is done in popup.js; both are HTTPS.

const ALARM_NAME = "dailyProxyUpdate";
const PROXY_ALARM_NAME = "proxyWatchdog";
const PROXY_CHECK_INTERVAL_MIN = 1;

const DEFAULT_SETTINGS = {
  autoConnect: false,
  killSwitch: false,
  dns: "default",
  geoProvider: "ipinfo",
};

// ----- helpers --------------------------------------------------------

const storage = {
  get(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (data) => resolve(data || {}));
    });
  },
  set(items) {
    return new Promise((resolve) => chrome.storage.local.set(items, resolve));
  },
};

function isPrivateHost(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return true;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "0.0.0.0")
      return true;
    if (/^(10|127|169\.254|172\.(1[6-9]|2\d|3[01])|192\.168)\./.test(h))
      return true;
    if (h.endsWith(".local") || h.endsWith(".internal")) return true;
    return false;
  } catch {
    return true;
  }
}

function isIp(s) {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(String(s || ""));
}

function clampPort(p) {
  const n = parseInt(p, 10);
  if (!Number.isFinite(n) || n < 1 || n > 65535) return null;
  return n;
}

function sanitizeServer(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (!isIp(raw.ip)) return null;
  const port = clampPort(raw.port);
  if (port === null) return null;
  // Source JSON reports latency as time_ms; accept ping as an alias
  const latency = raw.ping != null ? raw.ping : raw.time_ms;
  const ping = Number.isFinite(Number(latency))
    ? Math.max(0, Math.round(Number(latency)))
    : null;
  return {
    ip: raw.ip,
    port,
    ping: ping == null ? null : ping,
    country: typeof raw.country === "string" ? raw.country : null,
    source: typeof raw.source === "string" ? raw.source : null,
  };
}

function dedupeServers(list) {
  const map = new Map();
  for (const s of list) {
    const key = `${s.ip}:${s.port}`;
    const prev = map.get(key);
    if (!prev || (s.ping != null && (prev.ping == null || s.ping < prev.ping))) {
      map.set(key, s);
    }
  }
  return Array.from(map.values());
}

async function getSettings() {
  const { settings } = await storage.get(["settings"]);
  return Object.assign({}, DEFAULT_SETTINGS, settings || {});
}

async function isConnected() {
  const { connected } = await storage.get(["connected"]);
  return connected === true;
}

// ----- proxy control --------------------------------------------------

function setProxy(server) {
  return new Promise((resolve, reject) => {
    const config = server
      ? {
          value: {
            mode: "fixed_servers",
            rules: {
              singleProxy: {
                scheme: "http",
                host: server.ip,
                port: server.port,
              },
              bypassList: ["localhost", "127.0.0.1", "<local>"],
            },
          },
          scope: "regular",
        }
      : { value: { mode: "direct" }, scope: "regular" };
    chrome.proxy.settings.set(config, () => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve();
    });
  });
}

async function clearProxy() {
  try {
    await setProxy(null);
  } catch (e) {
    console.error("clearProxy failed:", e);
  }
  await storage.set({ connected: false, selectedServer: null });
}

// ----- proxy list -----------------------------------------------------

async function fetchProxyList() {
  if (isPrivateHost(PROXY_SOURCE)) {
    throw new Error("Refusing to fetch from non-public host");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const resp = await fetch(PROXY_SOURCE, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (!data || !Array.isArray(data.proxies)) {
      throw new Error("Invalid proxy payload");
    }
    const cleaned = data.proxies.map(sanitizeServer).filter(Boolean);
    return {
      servers: dedupeServers(cleaned),
      timestamp: data.timestamp || new Date().toISOString(),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function refreshProxyList() {
  if (await isConnected()) {
    console.log("Skipping proxy refresh while connected");
    return { skipped: true };
  }
  try {
    const { servers, timestamp } = await fetchProxyList();
    await storage.set({ serverList: servers, lastUpdate: timestamp });
    return { servers: servers.length, timestamp };
  } catch (e) {
    console.error("refreshProxyList failed:", e);
    return { error: e.message };
  }
}

// ----- connection verify ---------------------------------------------

async function verifyConnection() {
  if (isPrivateHost(IP_CHECK_URL)) return { success: false };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(IP_CHECK_URL, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!resp.ok) return { success: false };
    const data = await resp.json();
    if (data && data.ip) {
      return { success: true, ip: data.ip, country: data.country || "" };
    }
    return { success: false };
  } catch {
    return { success: false };
  }
}

// ----- install / startup ---------------------------------------------

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("MOVTI VPN Shield installed:", details.reason);
  if (details.reason === "install") {
    // Fresh install: reset everything to defaults
    await storage.set({
      connected: false,
      selectedServer: null,
      serverList: [],
      lastUpdate: null,
      settings: DEFAULT_SETTINGS,
    });
  } else {
    // Update: preserve user settings, clear runtime state
    const prev = await getSettings();
    await storage.set({
      connected: false,
      selectedServer: null,
      settings: prev,
    });
  }
  await scheduleAlarms();
  await refreshProxyList();
});

chrome.runtime.onStartup.addListener(async () => {
  await scheduleAlarms();
  const settings = await getSettings();
  if (!settings.killSwitch) return;
  if (!(await isConnected())) {
    // kill switch was on but VPN dropped while browser was closed
    await clearProxy();
  }
});

async function scheduleAlarms() {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1440 });
  chrome.alarms.create(PROXY_ALARM_NAME, {
    periodInMinutes: PROXY_CHECK_INTERVAL_MIN,
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await refreshProxyList();
  } else if (alarm.name === PROXY_ALARM_NAME) {
    await runWatchdog();
  }
});

// ----- kill switch (proxy watchdog) ----------------------------------

async function runWatchdog() {
  const settings = await getSettings();
  if (!settings.killSwitch) return;
  const connected = await isConnected();
  if (!connected) return; // user is intentionally offline
  const result = await verifyConnection();
  if (!result.success) {
    console.warn("Kill switch: VPN tunnel appears down, clearing proxy");
    await clearProxy();
  }
}

// ----- proxy error handler -------------------------------------------

if (chrome.proxy && chrome.proxy.onError && chrome.proxy.onError.addListener) {
  chrome.proxy.onError.addListener(async (details) => {
    console.error("Proxy error:", details);
    const settings = await getSettings();
    await storage.set({ connected: false });
    if (settings.killSwitch) {
      await clearProxy();
    }
  });
}

// ----- message handler -----------------------------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch((err) => {
    sendResponse({ error: err.message || String(err) });
  });
  return true; // async response
});

async function handleMessage(message) {
  if (!message || typeof message !== "object") {
    return { error: "invalid message" };
  }
  switch (message.type) {
    case "GET_STATUS": {
      const data = await storage.get([
        "connected",
        "selectedServer",
        "lastUpdate",
        "serverList",
        "settings",
      ]);
      return data;
    }
    case "FORCE_UPDATE": {
      const result = await refreshProxyList();
      return { success: !result.error, result };
    }
    case "SET_PROXY": {
      const server = sanitizeServer(message.server);
      if (!server) return { success: false, error: "invalid server" };
      await setProxy(server);
      await storage.set({ connected: true, selectedServer: server });
      return { success: true };
    }
    case "REMOVE_PROXY": {
      await clearProxy();
      return { success: true };
    }
    case "VERIFY_CONNECTION": {
      return await verifyConnection();
    }
    case "AUTO_CONNECT": {
      return await autoConnect();
    }
    case "SAVE_SETTINGS": {
      const clean = sanitizeSettings(message.settings || {});
      await storage.set({ settings: clean });
      return { success: true, settings: clean };
    }
    default:
      return { error: `unknown message: ${message.type}` };
  }
}

function sanitizeSettings(input) {
  const out = Object.assign({}, DEFAULT_SETTINGS);
  if (typeof input.autoConnect === "boolean") out.autoConnect = input.autoConnect;
  if (typeof input.killSwitch === "boolean") out.killSwitch = input.killSwitch;
  if (typeof input.dns === "string" && /^(default|cloudflare|google|opendns)$/.test(input.dns)) {
    out.dns = input.dns;
  }
  if (typeof input.geoProvider === "string" && /^(ipinfo|ipapi)$/.test(input.geoProvider)) {
    out.geoProvider = input.geoProvider;
  }
  return out;
}

// ----- auto connect --------------------------------------------------

async function autoConnect() {
  const { serverList } = await storage.get(["serverList"]);
  const servers = Array.isArray(serverList) ? serverList : [];
  if (servers.length === 0) {
    const refresh = await refreshProxyList();
    if (refresh.error) {
      return { success: false, error: "No servers available" };
    }
    const { serverList: list2 } = await storage.get(["serverList"]);
    if (!Array.isArray(list2) || list2.length === 0) {
      return { success: false, error: "No servers available" };
    }
    return await tryConnectFromList(list2);
  }
  return await tryConnectFromList(servers);
}

async function tryConnectFromList(servers) {
  const usable = servers
    .filter((s) => s && s.ping != null)
    .sort((a, b) => a.ping - b.ping);
  if (usable.length === 0) {
    return { success: false, error: "No servers with ping info" };
  }
  const best = usable[0];
  try {
    await setProxy(best);
    const verify = await verifyConnection();
    if (!verify.success) {
      await clearProxy();
      return { success: false, error: "verification failed" };
    }
    await storage.set({ connected: true, selectedServer: best, startTime: Date.now() });
    return { success: true, server: best, ip: verify.ip, country: verify.country };
  } catch (e) {
    await clearProxy();
    return { success: false, error: e.message };
  }
}
