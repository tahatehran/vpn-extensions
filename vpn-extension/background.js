/* ============================================
   MOVTI VPN Shield - Background Service Worker
   Daily auto-update of proxy list
   ============================================ */

// Proxy data source
const PROXY_SOURCE =
  "https://cdn.jsdelivr.net/gh/tahatehran/worker-vpn-proxy/best_proxies.json";

// IP check URL for connection verification
const IP_CHECK_URL = "https://api.myip.com";

// Helper: check if currently connected
async function isConnected() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["connected"], (data) => {
      resolve(data.connected === true);
    });
  });
}

// Install handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log("MOVTI VPN Shield installed:", details.reason);

  // Set default settings
  chrome.storage.local.set({
    connected: false,
    selectedServer: null,
    serverList: [],
    lastUpdate: null,
    settings: {
      autoConnect: false,
      killSwitch: false,
      dns: "default",
    },
  });

  // Schedule daily update alarm
  setupDailyAlarm();

  // First fetch
  fetchAndUpdateProxies();
});

// Startup handler - schedule alarm on browser start
chrome.runtime.onStartup.addListener(async () => {
  setupDailyAlarm();
  const connected = await isConnected();
  if (!connected) {
    checkAndUpdateProxies();
  } else {
    console.log("VPN is connected, skipping proxy update on startup");
  }
});

// Setup daily alarm (every 24 hours)
function setupDailyAlarm() {
  chrome.alarms.create("dailyProxyUpdate", {
    periodInMinutes: 1440, // 24 hours
  });
  console.log("Daily proxy update alarm scheduled");
}

// Check if update is needed (older than 24h) - skip if connected
async function checkAndUpdateProxies() {
  const connected = await isConnected();
  if (connected) {
    console.log("VPN is connected, skipping proxy update check");
    return;
  }

  chrome.storage.local.get(["lastUpdate"], (data) => {
    if (!data.lastUpdate) {
      fetchAndUpdateProxies();
      return;
    }

    const last = new Date(data.lastUpdate).getTime();
    const now = Date.now();
    const hoursSince = (now - last) / (1000 * 60 * 60);

    if (hoursSince >= 24) {
      fetchAndUpdateProxies();
    }
  });
}

// Fetch and update proxy list
async function fetchAndUpdateProxies() {
  console.log("Fetching updated proxy list...");
  try {
    const response = await fetch(PROXY_SOURCE);
    const json = await response.json();
    const proxies = json.proxies || [];

    // Deduplicate by IP:PORT and keep best ping
    const proxyMap = new Map();
    for (const p of proxies) {
      const key = `${p.ip}:${p.port}`;
      if (!proxyMap.has(key) || p.time_ms < proxyMap.get(key).time_ms) {
        proxyMap.set(key, p);
      }
    }

    const servers = [];
    let index = 0;
    for (const [key, proxy] of proxyMap) {
      servers.push({
        id: index++,
        ip: proxy.ip,
        port: proxy.port,
        ping: Math.round(proxy.time_ms),
        status: proxy.status,
        proxyStr: proxy.proxy_str,
      });
    }

    // Sort by ping
    servers.sort((a, b) => a.ping - b.ping);

    chrome.storage.local.set({
      serverList: servers,
      lastUpdate: json.timestamp || new Date().toISOString(),
    });

    console.log(`Proxy list updated: ${servers.length} servers`);
  } catch (error) {
    console.error("Failed to update proxies:", error);
  }
}

// Alarm handler - skip if connected
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "dailyProxyUpdate") {
    const connected = await isConnected();
    if (connected) {
      console.log("VPN is connected, skipping scheduled proxy update");
      return;
    }
    console.log("Daily proxy update triggered");
    fetchAndUpdateProxies();
  }
});

// Proxy error handler
if (chrome.proxy?.onError) {
  chrome.proxy.onError.addListener((details) => {
    console.error("Proxy error:", details);

    // Update connection state on error
    chrome.storage.local.set({ connected: false });

    // Notify popup
    chrome.runtime.sendMessage({
      type: "PROXY_ERROR",
      error: details.error,
    });
  });
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_STATUS") {
    chrome.storage.local.get(
      ["connected", "selectedServer", "lastUpdate"],
      (data) => {
        sendResponse(data);
      },
    );
    return true;
  }

  if (message.type === "FORCE_UPDATE") {
    fetchAndUpdateProxies().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === "SET_PROXY") {
    const { server } = message;
    chrome.proxy.settings.set(
      {
        value: {
          mode: "fixed_servers",
          rules: {
            singleProxy: {
              scheme: "http",
              host: server.ip,
              port: parseInt(server.port),
            },
            bypassList: ["localhost", "127.0.0.1"],
          },
        },
        scope: "regular",
      },
      () => {
        sendResponse({ success: true });
      },
    );
    return true;
  }

  if (message.type === "REMOVE_PROXY") {
    chrome.proxy.settings.set(
      {
        value: { mode: "direct" },
        scope: "regular",
      },
      () => {
        sendResponse({ success: true });
      },
    );
    return true;
  }

  if (message.type === "VERIFY_CONNECTION") {
    verifyConnectionBackground().then((result) => {
      sendResponse(result);
    });
    return true;
  }

  if (message.type === "AUTO_CONNECT") {
    autoConnectBackground().then((result) => {
      sendResponse(result);
    });
    return true;
  }
});

// Verify connection from background
async function verifyConnectionBackground() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(IP_CHECK_URL, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    const data = await resp.json();
    if (data && data.ip) {
      return { success: true, ip: data.ip, country: data.country || "" };
    }
    return { success: false };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Auto-connect from background
async function autoConnectBackground() {
  try {
    // Get servers from storage
    const data = await chrome.storage.local.get(["serverList"]);
    const servers = data.serverList || [];

    if (servers.length === 0) {
      await fetchAndUpdateProxies();
      const newData = await chrome.storage.local.get(["serverList"]);
      const newServers = newData.serverList || [];

      if (newServers.length === 0) {
        return { success: false, error: "No servers available" };
      }

      // Try first server
      const server = newServers[0];
      await connectToServer(server);
      return { success: true, server };
    }

    // Find fastest working server
    const workingServers = servers.filter((s) => s.working !== false);

    if (workingServers.length === 0) {
      return { success: false, error: "No working servers found" };
    }

    const fastest = workingServers[0];
    await connectToServer(fastest);
    return { success: true, server: fastest };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Connect to a specific server
async function connectToServer(server) {
  return new Promise((resolve, reject) => {
    chrome.proxy.settings.set(
      {
        value: {
          mode: "fixed_servers",
          rules: {
            singleProxy: {
              scheme: "http",
              host: server.ip,
              port: parseInt(server.port),
            },
            bypassList: ["localhost", "127.0.0.1"],
          },
        },
        scope: "regular",
      },
      async () => {
        // Wait a bit for proxy to apply
        await new Promise((r) => setTimeout(r, 1000));

        // Verify connection
        const verification = await verifyConnectionBackground();
        if (verification.success) {
          chrome.storage.local.set({
            connected: true,
            selectedServer: server,
          });
          resolve(verification);
        } else {
          chrome.storage.local.set({ connected: false });
          reject(new Error("Connection verification failed"));
        }
      },
    );
  });
}
