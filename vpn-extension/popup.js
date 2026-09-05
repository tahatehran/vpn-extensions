/* ============================================
   MOVTI VPN Shield - Main JavaScript
   Real ping + HTTPS-only geo lookup
   ============================================ */

const PROXY_SOURCE =
  "https://cdn.jsdelivr.net/gh/tahatehran/worker-vpn-proxy/best_proxies.json";
const IP_CHECK_URL = "https://api.myip.com";
const GEO_PRIMARY = "https://ipinfo.io/";
const GEO_FALLBACK = "https://ip-api.com/json/";

const state = {
  connected: false,
  connecting: false,
  selectedServer: null,
  servers: [],
  lastUpdate: null,
  startTime: null,
  ip: null,
};

const el = {};

function initElements() {
  const ids = [
    "status-ring",
    "status-label",
    "status-sub",
    "connect-btn",
    "connect-text",
    "btn-auto-connect",
    "server-list",
    "search-input",
    "server-count",
    "btn-refresh",
    "btn-settings",
    "stat-ping",
    "stat-speed",
    "stat-upload",
    "stat-download",
    "last-update",
  ];
  for (const id of ids) {
    el[id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] =
      document.getElementById(id);
  }
}

function isPrivateHost(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return true;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1" || h === "::1") return true;
    if (/^(10|127|169\.254|172\.(1[6-9]|2\d|3[01])|192\.168)\./.test(h))
      return true;
    return false;
  } catch {
    return true;
  }
}

function codeToFlag(cc) {
  if (!cc || cc.length !== 2) return "🌐";
  const pts = cc
    .toUpperCase()
    .split("")
    .map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
  return String.fromCodePoint(...pts);
}

const COUNTRY_NAMES = {
  US: "United States",
  DE: "Germany",
  GB: "United Kingdom",
  FR: "France",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  RU: "Russia",
  NL: "Netherlands",
  CA: "Canada",
  AU: "Australia",
  BR: "Brazil",
  IN: "India",
  IT: "Italy",
  ES: "Spain",
  SE: "Sweden",
  NO: "Norway",
  FI: "Finland",
  PL: "Poland",
  CH: "Switzerland",
  AT: "Austria",
  BE: "Belgium",
  DK: "Denmark",
  IE: "Ireland",
  PT: "Portugal",
  CZ: "Czechia",
  RO: "Romania",
  HU: "Hungary",
  TR: "Turkey",
  UA: "Ukraine",
  IL: "Israel",
  SG: "Singapore",
  HK: "Hong Kong",
  TW: "Taiwan",
  TH: "Thailand",
  VN: "Vietnam",
  MY: "Malaysia",
  ID: "Indonesia",
  PH: "Philippines",
  MX: "Mexico",
  AR: "Argentina",
  CO: "Colombia",
  CL: "Chile",
  ZA: "South Africa",
  NG: "Nigeria",
  KE: "Kenya",
  EG: "Egypt",
  SA: "Saudi Arabia",
  AE: "United Arab Emirates",
  QA: "Qatar",
  KW: "Kuwait",
  BH: "Bahrain",
  NZ: "New Zealand",
  GR: "Greece",
  BG: "Bulgaria",
  RS: "Serbia",
  HR: "Croatia",
  SK: "Slovakia",
  LT: "Lithuania",
  LV: "Latvia",
  EE: "Estonia",
  IS: "Iceland",
  LU: "Luxembourg",
  CY: "Cyprus",
  MT: "Malta",
  IR: "Iran",
};

const geoCache = new Map();

async function detectCountry(ip) {
  if (geoCache.has(ip)) return geoCache.get(ip);
  // ipinfo.io
  if (!isPrivateHost(GEO_PRIMARY)) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 3000);
      const resp = await fetch(GEO_PRIMARY + encodeURIComponent(ip) + "/json", {
        signal: controller.signal,
      });
      clearTimeout(t);
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.country) {
          const cc = (data.country || "").toUpperCase();
          const result = { flag: codeToFlag(cc), name: COUNTRY_NAMES[cc] || cc };
          geoCache.set(ip, result);
          return result;
        }
      }
    } catch {
      /* fall through */
    }
  }
  // ip-api.com fallback
  if (!isPrivateHost(GEO_FALLBACK)) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 3000);
      const resp = await fetch(
        GEO_FALLBACK + encodeURIComponent(ip) + "?fields=status,country,countryCode",
        { signal: controller.signal },
      );
      clearTimeout(t);
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.status === "success" && data.countryCode) {
          const cc = (data.countryCode || "").toUpperCase();
          const result = { flag: codeToFlag(cc), name: COUNTRY_NAMES[cc] || data.country };
          geoCache.set(ip, result);
          return result;
        }
      }
    } catch {
      /* ignore */
    }
  }
  const fallback = { flag: "🌐", name: "Server " + ip.split(".")[0] };
  geoCache.set(ip, fallback);
  return fallback;
}

// Real RTT over HTTPS. MV3 extension pages are secure contexts, so direct
// http:// probes of a proxy IP are blocked (mixed content + CSP). Latency is
// therefore measured through the currently active proxy via IP_CHECK_URL and
// is only meaningful while connected; otherwise the source-reported ping is used.
function testPing(timeout) {
  timeout = Math.max(500, Math.min(timeout || 3000, 5000));
  return new Promise(function (resolve) {
    if (isPrivateHost(IP_CHECK_URL)) {
      resolve(-1);
      return;
    }
    const start = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    fetch(IP_CHECK_URL, { cache: "no-store", signal: controller.signal })
      .then(() => {
        clearTimeout(timer);
        resolve(Math.round(performance.now() - start));
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(-1);
      });
  });
}

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

document.addEventListener("DOMContentLoaded", async function () {
  initElements();
  await loadSavedState();
  setupEvents();
  // Background refresh; do not block UI
  refreshServersIfStale().catch((e) => console.error("refresh failed", e));
});

function sendMessage(msg) {
  return new Promise((resolve) => {
    if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
      resolve({ error: "no runtime" });
      return;
    }
    chrome.runtime.sendMessage(msg, (resp) => {
      if (chrome.runtime.lastError) {
        resolve({ error: chrome.runtime.lastError.message });
      } else {
        resolve(resp || {});
      }
    });
  });
}

async function loadSavedState() {
  const resp = await sendMessage({ type: "GET_STATUS" });
  if (resp && !resp.error) {
    if (resp.connected) state.connected = resp.connected;
    if (resp.selectedServer) state.selectedServer = resp.selectedServer;
    if (Array.isArray(resp.serverList) && resp.serverList.length > 0) {
      state.servers = resp.serverList;
    }
    if (resp.lastUpdate) state.lastUpdate = resp.lastUpdate;
    // Stored selectedServer carries no list id; re-attach from the list by ip:port
    if (state.selectedServer && state.servers.length > 0) {
      const sel = state.selectedServer;
      state.selectedServer =
        state.servers.find(
          (s) => s.ip === sel.ip && s.port === sel.port,
        ) || state.selectedServer;
    }
  }
  updateUI();
  if (state.servers.length > 0) {
    renderServerList();
    updateServerCount();
  }
}

async function refreshServersIfStale() {
  if (state.connected) return; // skip to avoid VPN interference
  if (state.servers.length > 0 && !needsRefresh()) {
    renderServerList();
    updateServerCount();
    return;
  }
  await fetchServers(true);
}

function needsRefresh() {
  if (!state.lastUpdate) return true;
  const last = new Date(state.lastUpdate).getTime();
  return (Date.now() - last) / (1000 * 60 * 60) >= 24;
}

async function fetchServers(force) {
  if (state.connected) return;
  if (!force && state.servers.length > 0 && !needsRefresh()) {
    renderServerList();
    updateServerCount();
    return;
  }
  showLoading(true);
  try {
    if (isPrivateHost(PROXY_SOURCE)) {
      throw new Error("Refusing to fetch from non-public host");
    }
    const resp = await fetch(PROXY_SOURCE, { cache: "no-store" });
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const json = await resp.json();
    const proxies = Array.isArray(json.proxies) ? json.proxies : [];

    const map = new Map();
    for (const p of proxies) {
      if (!p || !p.ip || !p.port) continue;
      const key = p.ip + ":" + p.port;
      const prev = map.get(key);
      if (!prev || (p.time_ms || 0) < (prev.time_ms || 0)) {
        map.set(key, p);
      }
    }
    let idx = 0;
    const servers = [];
    for (const proxy of map.values()) {
      servers.push({
        id: idx++,
        ip: proxy.ip,
        port: proxy.port,
        ping: Math.round(proxy.time_ms || 0),
        country: null,
        status: proxy.status,
      });
    }

    // Country lookup (sequential, with cache, rate-limited)
    const uniqueIPs = Array.from(new Set(servers.map((s) => s.ip)));
    for (let i = 0; i < uniqueIPs.length; i += 3) {
      const batch = uniqueIPs.slice(i, i + 3);
      const results = await Promise.all(batch.map(detectCountry));
      for (let j = 0; j < batch.length; j++) {
        const ip = batch[j];
        const country = results[j];
        for (const s of servers) {
          if (s.ip === ip) {
            s.country = country;
            s.name = country.name;
          }
        }
      }
    }

    // Ping shown is the provider-reported latency (time_ms); a live RTT is
    // measured only while connected (see startStats / testPing).
    servers.sort((a, b) => a.ping - b.ping);
    state.servers = servers;
    state.lastUpdate = json.timestamp || new Date().toISOString();

    // Persist
    await sendMessage({ type: "FORCE_UPDATE" });

    renderServerList();
    updateServerCount();
  } catch (err) {
    console.error("Failed to fetch servers:", err);
    if (state.servers.length === 0) {
      showEmptyState("Failed to load servers");
    }
  } finally {
    showLoading(false);
  }
}

function showStatus(msg) {
  if (el.statusSub && msg) el.statusSub.textContent = msg;
}

// Normalize country data: list entries carry {flag,name}; stored servers may
// only carry a 2-letter code string or null.
function countryLabel(c) {
  if (c && typeof c === "object" && c.name) return c;
  if (typeof c === "string" && c.length === 2) {
    return { flag: codeToFlag(c), name: COUNTRY_NAMES[c] || c };
  }
  return { flag: "🌐", name: "Server" };
}

function renderServerList(filter) {
  const list = el.serverList;
  if (!list) return;
  const q = (filter || "").trim().toLowerCase();
  const filtered = q
    ? state.servers.filter((s) => {
        const c = s.country || { name: "" };
        return (
          (s.name || "").toLowerCase().includes(q) ||
          s.ip.includes(q) ||
          c.name.toLowerCase().includes(q)
        );
      })
    : state.servers;

  if (filtered.length === 0) {
    showEmptyState("No servers found");
    return;
  }
  const limit = Math.min(filtered.length, 50);
  const parts = [];
  for (let i = 0; i < limit; i++) {
    const s = filtered[i];
    const c = countryLabel(s.country);
    const selected =
      state.selectedServer &&
      state.selectedServer.ip === s.ip &&
      state.selectedServer.port === s.port
        ? " selected"
        : "";
    const pingVal = s.ping;
    const pingClass =
      pingVal < 200 ? "ping-good" : pingVal < 500 ? "ping-medium" : "ping-bad";
    parts.push(
      '<div class="server-item' +
        selected +
        '" data-id="' +
        s.id +
        '">' +
        '<div class="server-flag">' +
        c.flag +
        "</div>" +
        '<div class="server-info">' +
        '<div class="server-name">' +
        c.name +
        "</div>" +
        '<div class="server-ip">' +
        s.ip +
        ":" +
        s.port +
        "</div>" +
        "</div>" +
        '<div class="server-ping"><span class="ping-dot ' +
        pingClass +
        '"></span><span>' +
        pingVal +
        "ms</span></div>" +
        "</div>",
    );
  }
  list.innerHTML = parts.join("");
  const items = list.querySelectorAll(".server-item");
  items.forEach((item) => {
    item.addEventListener("click", () => {
      const id = parseInt(item.dataset.id, 10);
      selectServer(id);
    });
  });
}

function selectServer(id) {
  state.selectedServer = state.servers.find((s) => s.id === id) || null;
  renderServerList(el.searchInput ? el.searchInput.value : "");
  updateUI();
}

function showLoading(show) {
  if (show && el.serverList) {
    el.serverList.innerHTML =
      '<div class="server-loading"><div class="spinner-sm"></div><span>Loading and testing servers…</span></div>';
  }
}

function showEmptyState(msg) {
  if (!el.serverList) return;
  el.serverList.innerHTML =
    '<div class="empty-state"><span>' + msg + "</span></div>";
}

function updateServerCount() {
  if (!el.serverCount) return;
  const total = state.servers.length;
  const ips = new Set(state.servers.map((s) => s.ip));
  el.serverCount.textContent = total + " servers (" + ips.size + " IPs)";
  if (el.lastUpdate && state.lastUpdate) {
    const d = new Date(state.lastUpdate);
    el.lastUpdate.textContent = "Updated: " + d.toLocaleString();
  }
}

async function toggleConnection() {
  if (state.connecting) return;
  if (state.connected) await disconnect();
  else await connect();
}

async function connect() {
  if (!state.selectedServer && state.servers.length > 0) {
    const sorted = state.servers.slice().sort((a, b) => a.ping - b.ping);
    state.selectedServer = sorted[0];
  }
  if (!state.selectedServer) {
    showStatus("Pick a server first");
    return;
  }
  state.connecting = true;
  updateUI();
  showStatus("Connecting…");
  const resp = await sendMessage({
    type: "SET_PROXY",
    server: state.selectedServer,
  });
  if (!resp || resp.error) {
    state.connecting = false;
    showStatus("Failed: " + (resp && resp.error ? resp.error : "unknown"));
    updateUI();
    return;
  }
  state.connected = true;
  state.connecting = false;
  state.startTime = Date.now();
  showStatus("Connected");
  updateUI();
  startStats();
  // Background verify
  verifyConnection().then((v) => {
    if (v.success) {
      state.ip = v.ip;
      showStatus("Connected • " + v.ip);
    } else {
      showStatus("Connected (verification limited)");
    }
  });
}

async function disconnect() {
  state.connecting = false;
  state.connected = false;
  state.startTime = null;
  state.ip = null;
  await sendMessage({ type: "REMOVE_PROXY" });
  showStatus("Disconnected");
  updateUI();
  stopStats();
}

function updateUI() {
  const connected = state.connected;
  const connecting = state.connecting;
  const sel = state.selectedServer;
  if (el.statusRing) {
    el.statusRing.className = "status-ring" + (connected ? " connected" : connecting ? " connecting" : "");
  }
  if (el.statusLabel) {
    el.statusLabel.textContent = connected
      ? "Connected"
      : connecting
        ? "Connecting…"
        : "Off";
  }
  if (el.statusSub) {
    if (connected && sel) {
      const c = countryLabel(sel.country);
      el.statusSub.textContent = c.flag + " " + c.name + " - " + sel.ip;
    } else if (el.statusSub.textContent !== "Click to connect") {
      el.statusSub.textContent = "Click to connect";
    }
  }
  if (el.connectBtn) {
    el.connectBtn.className =
      "connect-btn" + (connected ? " connected" : connecting ? " loading" : "");
  }
  if (el.connectText) {
    el.connectText.textContent = connected
      ? "Disconnect"
      : connecting
        ? "Connecting…"
        : "Connect";
  }
  if (!connected) {
    el.statPing.textContent = "--";
    el.statSpeed.textContent = "--";
    el.statUpload.textContent = "--";
    el.statDownload.textContent = "--";
  }
}

let statsInterval = null;

function startStats() {
  stopStats();
  statsInterval = setInterval(async () => {
    if (!state.connected || !state.selectedServer) {
      stopStats();
      return;
    }
    const realPing = await testPing(2000);
    el.statPing.textContent = realPing > 0 ? realPing + " ms" : "timeout";
    // No fake speed/up/down numbers: only show real data
  }, 3000);
}

function stopStats() {
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }
}

function setupEvents() {
  if (el.connectBtn) el.connectBtn.addEventListener("click", toggleConnection);
  if (el.btnAutoConnect)
    el.btnAutoConnect.addEventListener("click", autoConnect);
  if (el.searchInput)
    el.searchInput.addEventListener("input", (e) => renderServerList(e.target.value));
  if (el.btnRefresh)
    el.btnRefresh.addEventListener("click", () => fetchServers(true));
  if (el.btnSettings)
    el.btnSettings.addEventListener("click", () => {
      if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open("options.html", "_blank");
      }
    });
}

async function autoConnect() {
  showStatus("Finding fastest server…");
  state.connecting = true;
  updateUI();
  const resp = await sendMessage({ type: "AUTO_CONNECT" });
  state.connecting = false;
  if (!resp || !resp.success) {
    showStatus("Auto-connect failed: " + (resp && resp.error ? resp.error : "unknown"));
    updateUI();
    return;
  }
  state.connected = true;
  state.startTime = Date.now();
  state.selectedServer = resp.server;
  state.ip = resp.ip || null;
  showStatus("Connected • " + (resp.country || "server"));
  updateUI();
}
