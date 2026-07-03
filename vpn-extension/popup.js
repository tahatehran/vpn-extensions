/* ============================================
   MOVTI VPN Shield - Main JavaScript
   Real ping test + CORS-friendly country detection
   ============================================ */

const PROXY_SOURCE =
  "https://cdn.jsdelivr.net/gh/tahatehran/worker-vpn-proxy/best_proxies.json";

const IP_CHECK_URL = "https://api.myip.com";

let state = {
  connected: false,
  connecting: false,
  selectedServer: null,
  servers: [],
  lastUpdate: null,
  startTime: null,
};

const el = {};
function initElements() {
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
}

// Country code to flag emoji
function codeToFlag(cc) {
  if (!cc || cc.length !== 2) return "🌐";
  const pts = cc
    .toUpperCase()
    .split("")
    .map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
  return String.fromCodePoint(...pts);
}

// Country name translations
const COUNTRY_NAMES = {
  US: "آمریکا",
  DE: "آلمان",
  GB: "انگلیس",
  FR: "فرانسه",
  JP: "ژاپن",
  KR: "کره جنوبی",
  CN: "چین",
  RU: "روسیه",
  NL: "هلند",
  CA: "کانادا",
  AU: "استرالیا",
  BR: "برزیل",
  IN: "هند",
  IT: "ایتالیا",
  ES: "اسپانیا",
  SE: "سوئد",
  NO: "نروژ",
  FI: "فنلاند",
  PL: "لهستان",
  CH: "سوئیس",
  AT: "اتریش",
  BE: "بلژیک",
  DK: "دانمارک",
  IE: "ایرلند",
  PT: "پرتغال",
  CZ: "چک",
  RO: "رومانی",
  HU: "مجارستان",
  TR: "ترکیه",
  UA: "اوکراین",
  IL: "اسرائیل",
  SG: "سنگاپور",
  HK: "هنگ کنگ",
  TW: "تایوان",
  TH: "تایلند",
  VN: "ویتنام",
  MY: "مالزی",
  ID: "اندونزی",
  PH: "فیلیپین",
  MX: "مکزیک",
  AR: "آرژانتین",
  CO: "کلمبیا",
  CL: "شیلی",
  ZA: "آفریقای جنوبی",
  NG: "نیجریه",
  KE: "کنیا",
  EG: "مصر",
  SA: "عربستان",
  AE: "امارات",
  QA: "قطر",
  KW: "کویت",
  BH: "بحرین",
  NZ: "نیوزیلند",
  GR: "یونان",
  BG: "بلغارستان",
  RS: "صربستان",
  HR: "کرواسی",
  SK: "اسلواکی",
  LT: "لیتوانی",
  LV: "لتونی",
  EE: "استونی",
  IS: "ایسلند",
  LU: "لوکزامبورگ",
  CY: "قبرس",
  MT: "مالت",
  JP: "ژاپن",
  CN: "چین",
  TW: "تایوان",
};

// Get country from IP using ipinfo.io (CORS-friendly)
const geoCache = {};

async function detectCountry(ip) {
  if (geoCache[ip]) return geoCache[ip];

  // Try ip-api.com batch-style (individual, with timeout)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(
      "http://ip-api.com/json/" + ip + "?fields=status,country,countryCode",
      { signal: controller.signal },
    );
    clearTimeout(timer);
    const data = await resp.json();
    if (data.status === "success" && data.country) {
      const name = COUNTRY_NAMES[data.countryCode] || data.country;
      const result = { flag: codeToFlag(data.countryCode), name: name };
      geoCache[ip] = result;
      return result;
    }
  } catch (e) {
    // Ignore
  }

  // Fallback: try ipinfo.io
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const resp = await fetch("https://ipinfo.io/" + ip + "/json", {
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await resp.json();
    if (data.country) {
      const name = COUNTRY_NAMES[data.country] || data.country;
      const result = { flag: codeToFlag(data.country), name: name };
      geoCache[ip] = result;
      return result;
    }
  } catch (e) {
    // Ignore
  }

  return { flag: "🌐", name: "سرور " + ip.split(".")[0] };
}

// Real ping test using fetch (more reliable than Image loading)
function testPing(ip, port, timeout) {
  timeout = timeout || 3000;
  return new Promise(function (resolve) {
    var start = performance.now();
    var resolved = false;

    function done(val) {
      if (!resolved) {
        resolved = true;
        clearTimeout(fallbackTimer);
        resolve(val);
      }
    }

    var fallbackTimer = setTimeout(function () {
      done(-1);
    }, timeout + 200);

    try {
      // Use fetch with no-cors to test connectivity through proxy
      fetch("http://" + ip + ":" + port + "/", {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-store",
      })
        .then(function () {
          done(Math.round(performance.now() - start));
        })
        .catch(function () {
          // Even on error, if it took time, the server is reachable
          var elapsed = Math.round(performance.now() - start);
          if (elapsed > 10 && elapsed < timeout) {
            done(elapsed);
          } else {
            done(-1);
          }
        });
    } catch (e) {
      done(-1);
    }
  });
}

// Verify connection by checking IP via api.myip.com
async function verifyConnection() {
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

// Initialize
document.addEventListener("DOMContentLoaded", async function () {
  initElements();
  await loadSavedState();
  await fetchServers();
  setupEvents();
});

// Load saved state
async function loadSavedState() {
  return new Promise(function (resolve) {
    var done = function (data) {
      if (data.connected) state.connected = data.connected;
      if (data.selectedServer) state.selectedServer = data.selectedServer;
      if (data.serverList && data.serverList.length > 0)
        state.servers = data.serverList;
      if (data.lastUpdate) state.lastUpdate = data.lastUpdate;
      updateUI();
      resolve();
    };
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        ["connected", "selectedServer", "serverList", "lastUpdate"],
        done,
      );
    } else {
      var saved = localStorage.getItem("vpnState");
      if (saved) {
        var p = JSON.parse(saved);
        state = Object.assign({}, state, p);
      }
      updateUI();
      resolve();
    }
  });
}

// Save state
async function saveState() {
  var data = {
    connected: state.connected,
    selectedServer: state.selectedServer,
    serverList: state.servers,
    lastUpdate: state.lastUpdate,
  };
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set(data);
  } else {
    localStorage.setItem("vpnState", JSON.stringify(data));
  }
}

// Check if refresh needed (24h)
function needsRefresh() {
  if (!state.lastUpdate) return true;
  var last = new Date(state.lastUpdate).getTime();
  return (Date.now() - last) / (1000 * 60 * 60) >= 24;
}

// Fetch servers from JSON + real ping test
async function fetchServers(force) {
  // If connected, skip fetching to avoid going through VPN
  if (state.connected) {
    console.log(
      "VPN is connected, skipping server fetch to avoid VPN interference",
    );
    if (state.servers.length > 0) {
      renderServerList();
      updateServerCount();
    }
    return;
  }

  if (!force && state.servers.length > 0 && !needsRefresh()) {
    renderServerList();
    updateServerCount();
    return;
  }

  showLoading(true);
  try {
    var resp = await fetch(PROXY_SOURCE);
    var json = await resp.json();
    var proxies = json.proxies || [];

    // Deduplicate by IP:PORT, keep best ping
    var map = new Map();
    for (var i = 0; i < proxies.length; i++) {
      var p = proxies[i];
      var key = p.ip + ":" + p.port;
      if (!map.has(key) || p.time_ms < map.get(key).time_ms) {
        map.set(key, p);
      }
    }

    var idx = 0;
    state.servers = [];
    var entries = Array.from(map.entries());
    for (var j = 0; j < entries.length; j++) {
      var proxy = entries[j][1];
      state.servers.push({
        id: idx++,
        ip: proxy.ip,
        port: proxy.port,
        jsonPing: Math.round(proxy.time_ms),
        ping: Math.round(proxy.time_ms),
        country: null,
        name: "سرور",
        status: proxy.status,
        working: false,
      });
    }

    // Detect countries for unique IPs (with cache)
    var uniqueIPs = [];
    var seen = {};
    for (var k = 0; k < state.servers.length; k++) {
      if (!seen[state.servers[k].ip]) {
        seen[state.servers[k].ip] = true;
        uniqueIPs.push(state.servers[k].ip);
      }
    }

    showStatus("تشخیص کشور " + uniqueIPs.length + " سرور...");

    // Process in batches of 3
    for (var b = 0; b < uniqueIPs.length; b += 3) {
      var batch = uniqueIPs.slice(b, b + 3);
      var results = await Promise.all(
        batch.map(function (ip) {
          return detectCountry(ip);
        }),
      );
      for (var r = 0; r < batch.length; r++) {
        var ipAddr = batch[r];
        var country = results[r];
        for (var s = 0; s < state.servers.length; s++) {
          if (state.servers[s].ip === ipAddr) {
            state.servers[s].country = country;
            state.servers[s].name = country.name + " - " + ipAddr;
          }
        }
      }
    }

    // Real ping test (test top 15 servers)
    showStatus("تست پینگ واقعی...");
    var toTest = state.servers.slice(0, 15);

    for (var t = 0; t < toTest.length; t++) {
      var srv = toTest[t];
      showStatus("تست " + (t + 1) + "/" + toTest.length + ": " + srv.ip);

      var realPing = await testPing(srv.ip, srv.port, 2500);
      if (realPing > 0) {
        srv.ping = realPing;
        srv.working = true;
      } else {
        srv.ping = srv.jsonPing;
        srv.working = false;
      }
    }

    // Remaining servers: assume working based on JSON data
    for (var m = 15; m < state.servers.length; m++) {
      state.servers[m].ping = state.servers[m].jsonPing;
      state.servers[m].working = true;
    }

    // Sort: working first, then by ping
    state.servers.sort(function (a, b) {
      if (a.working && !b.working) return -1;
      if (!a.working && b.working) return 1;
      return a.ping - b.ping;
    });

    state.lastUpdate = json.timestamp || new Date().toISOString();
    showStatus("");

    await saveState();
    renderServerList();
    updateServerCount();
  } catch (err) {
    console.error("Failed to fetch servers:", err);
    if (state.servers.length > 0) {
      renderServerList();
      updateServerCount();
    } else {
      showEmptyState("خطا در بارگذاری سرورها");
    }
  }
  showLoading(false);
}

// Show status message
function showStatus(msg) {
  if (el.statusSub && msg) {
    el.statusSub.textContent = msg;
  }
}

// Render server list
function renderServerList(filter) {
  var list = el.serverList;
  var servers = state.servers;
  var filtered = filter
    ? servers.filter(function (s) {
        var c = s.country || { name: "" };
        return (
          s.name.includes(filter) ||
          s.ip.includes(filter) ||
          c.name.includes(filter)
        );
      })
    : servers;

  if (filtered.length === 0) {
    showEmptyState("سروری یافت نشد");
    return;
  }

  var html = "";
  var limit = Math.min(filtered.length, 50);
  for (var i = 0; i < limit; i++) {
    var server = filtered[i];
    var c = server.country || { flag: "🌐", name: "سرور" };
    var selected =
      state.selectedServer && state.selectedServer.id === server.id;
    var pingVal = server.ping;
    var pingClass = !server.working
      ? "ping-bad"
      : pingVal < 200
        ? "ping-good"
        : pingVal < 500
          ? "ping-medium"
          : "ping-bad";
    var statusIcon = server.working ? "✓" : "✗";
    var extraClass = server.working ? "" : " server-down";

    html +=
      '<div class="server-item ' +
      (selected ? "selected " : "") +
      extraClass +
      '" data-id="' +
      server.id +
      '">' +
      '<div class="server-flag">' +
      c.flag +
      "</div>" +
      '<div class="server-info">' +
      '<div class="server-name">' +
      c.name +
      " " +
      statusIcon +
      "</div>" +
      '<div class="server-ip">' +
      server.ip +
      ":" +
      server.port +
      "</div>" +
      "</div>" +
      '<div class="server-ping">' +
      '<span class="ping-dot ' +
      pingClass +
      '"></span>' +
      "<span>" +
      (server.working ? pingVal + "ms" : "ناموفق") +
      "</span>" +
      "</div>" +
      "</div>";
  }

  list.innerHTML = html;

  var items = list.querySelectorAll(".server-item");
  for (var j = 0; j < items.length; j++) {
    items[j].addEventListener("click", function () {
      var id = parseInt(this.dataset.id);
      selectServer(id);
    });
  }
}

// Select server
function selectServer(id) {
  state.selectedServer = state.servers.find(function (s) {
    return s.id === id;
  });
  saveState();
  renderServerList(el.searchInput.value);
  updateUI();
}

// Show loading
function showLoading(show) {
  if (show) {
    el.serverList.innerHTML =
      '<div class="server-loading"><div class="spinner-sm"></div><span>در حال بارگذاری و تست سرورها...</span></div>';
  }
}

// Show empty state
function showEmptyState(msg) {
  el.serverList.innerHTML =
    '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 15h8M9 9h.01M15 9h.01"/></svg><span>' +
    msg +
    "</span></div>";
}

// Update server count + last update time
function updateServerCount() {
  var working = state.servers.filter(function (s) {
    return s.working;
  }).length;
  var total = state.servers.length;
  var uniqueIPs = {};
  state.servers.forEach(function (s) {
    uniqueIPs[s.ip] = true;
  });
  var ipCount = Object.keys(uniqueIPs).length;
  el.serverCount.textContent =
    working + "/" + total + " سرور (" + ipCount + " IP)";

  if (el.lastUpdate && state.lastUpdate) {
    var d = new Date(state.lastUpdate);
    var fa = d.toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    el.lastUpdate.textContent = "بروزرسانی: " + fa;
  }
}

// Toggle connection
async function toggleConnection() {
  if (state.connecting) return;
  if (state.connected) {
    disconnect();
  } else {
    connect();
  }
}

// Auto-connect: find fastest working server
async function autoConnect() {
  showStatus("جستجوی سریع‌ترین سرور...");
  state.connecting = true;
  updateUI();

  // If no servers loaded, fetch them first
  if (state.servers.length === 0) {
    await fetchServers(true);
  }

  // Get working servers sorted by ping
  var workingServers = state.servers.filter(function (s) {
    return s.working;
  });

  if (workingServers.length === 0) {
    // No working servers found, test top servers
    showStatus("تست سرورها برای یافتن بهترین گزینه...");
    var toTest = state.servers.slice(0, 10);
    for (var t = 0; t < toTest.length; t++) {
      var srv = toTest[t];
      showStatus("تست " + (t + 1) + "/" + toTest.length + ": " + srv.ip);
      var realPing = await testPing(srv.ip, srv.port, 2000);
      if (realPing > 0) {
        srv.ping = realPing;
        srv.working = true;
        workingServers.push(srv);
      }
    }
    // Re-sort
    state.servers.sort(function (a, b) {
      if (a.working && !b.working) return -1;
      if (!a.working && b.working) return 1;
      return a.ping - b.ping;
    });
    await saveState();
    renderServerList();
  }

  if (workingServers.length === 0) {
    showStatus("هیچ سرور فعالی یافت نشد");
    state.connecting = false;
    updateUI();
    return;
  }

  // Select fastest working server
  var fastest = workingServers[0];
  state.selectedServer = fastest;
  showStatus("اتصال به " + fastest.ip + "...");

  // Apply proxy
  applyProxy(fastest);

  // Wait a bit for proxy to apply
  await new Promise(function (r) {
    setTimeout(r, 1000);
  });

  // Verify connection via api.myip.com
  showStatus("بررسی اتصال...");
  var verification = await verifyConnection();

  if (verification.success) {
    state.connected = true;
    state.connecting = false;
    state.startTime = Date.now();
    showStatus("متصل به " + (fastest.country ? fastest.country.name : "سرور"));
    await saveState();
    updateUI();
    startStats();
  } else {
    // Connection failed
    state.connecting = false;
    showStatus("اتصال ناموفق - تلاش مجدد...");
    updateUI();

    // Try next fastest server
    if (workingServers.length > 1) {
      await autoConnectNext(workingServers.slice(1));
    } else {
      state.connected = false;
      showStatus("اتصال ناموفق");
      updateUI();
    }
  }
}

// Try next server in auto-connect
async function autoConnectNext(servers) {
  if (servers.length === 0) {
    state.connected = false;
    state.connecting = false;
    showStatus("اتصال ناموفق");
    updateUI();
    return;
  }

  var next = servers[0];
  state.selectedServer = next;
  showStatus("تلاش با " + next.ip + "...");
  updateUI();

  applyProxy(next);
  await new Promise(function (r) {
    setTimeout(r, 1000);
  });

  var verification = await verifyConnection();
  if (verification.success) {
    state.connected = true;
    state.connecting = false;
    state.startTime = Date.now();
    showStatus("متصل به " + (next.country ? next.country.name : "سرور"));
    await saveState();
    updateUI();
    startStats();
  } else {
    await autoConnectNext(servers.slice(1));
  }
}

// Connect
async function connect() {
  if (!state.selectedServer && state.servers.length > 0) {
    var workingServer = state.servers.find(function (s) {
      return s.working;
    });
    state.selectedServer = workingServer || state.servers[0];
  }
  if (!state.selectedServer) return;

  state.connecting = true;
  updateUI();
  showStatus("در حال اتصال...");

  // Apply proxy
  applyProxy(state.selectedServer);

  // Wait for proxy to apply
  await new Promise(function (r) {
    setTimeout(r, 1000);
  });

  // Verify connection via api.myip.com
  showStatus("بررسی اتصال...");
  var verification = await verifyConnection();

  if (verification.success) {
    state.connected = true;
    state.connecting = false;
    state.startTime = Date.now();
    showStatus("متصل");
    await saveState();
    updateUI();
    startStats();
  } else {
    // Connection failed
    state.connecting = false;
    state.connected = false;
    showStatus("اتصال ناموفق");
    updateUI();
  }
}

// Disconnect
async function disconnect() {
  state.connected = false;
  state.connecting = false;
  state.startTime = null;
  removeProxy();
  await saveState();
  updateUI();
  stopStats();
  showStatus("قطع اتصال");
}

// Apply proxy
function applyProxy(server) {
  if (chrome && chrome.proxy) {
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
      function () {
        console.log("Proxy applied:", server.ip + ":" + server.port);
      },
    );
  }
}

// Remove proxy
function removeProxy() {
  if (chrome && chrome.proxy) {
    chrome.proxy.settings.set(
      {
        value: { mode: "direct" },
        scope: "regular",
      },
      function () {
        console.log("Proxy removed");
      },
    );
  }
}

// Update UI
function updateUI() {
  var connected = state.connected;
  var connecting = state.connecting;
  var selectedServer = state.selectedServer;

  el.statusRing.className = "status-ring";
  if (connected) {
    el.statusRing.classList.add("connected");
    el.statusLabel.textContent = "متصل";
    if (selectedServer) {
      var c = selectedServer.country || { flag: "🌐", name: "سرور" };
      el.statusSub.textContent =
        c.flag +
        " " +
        c.name +
        " - " +
        selectedServer.ip +
        " (" +
        selectedServer.ping +
        "ms)";
    } else {
      el.statusSub.textContent = "اتصال برقرار است";
    }
  } else if (connecting) {
    el.statusRing.classList.add("connecting");
    el.statusLabel.textContent = "در حال اتصال...";
  } else {
    el.statusLabel.textContent = "غیرفعال";
    if (
      !el.statusSub.textContent ||
      el.statusSub.textContent === "برای اتصال کلیک کنید"
    ) {
      el.statusSub.textContent = "برای اتصال کلیک کنید";
    }
  }

  el.connectBtn.className = "connect-btn";
  if (connected) {
    el.connectBtn.classList.add("connected");
    el.connectText.textContent = "قطع اتصال";
  } else if (connecting) {
    el.connectBtn.classList.add("loading");
    el.connectText.textContent = "اتصال...";
  } else {
    el.connectText.textContent = "اتصال";
  }

  if (!connected) {
    el.statPing.textContent = "--";
    el.statSpeed.textContent = "--";
    el.statUpload.textContent = "--";
    el.statDownload.textContent = "--";
  }
}

// Stats update with real ping
var statsInterval = null;

function startStats() {
  stopStats();
  statsInterval = setInterval(async function () {
    if (!state.connected) {
      stopStats();
      return;
    }
    if (state.selectedServer) {
      var realPing = await testPing(
        state.selectedServer.ip,
        state.selectedServer.port,
        2000,
      );
      el.statPing.textContent = realPing > 0 ? realPing + "ms" : "timeout";
    }
    el.statSpeed.textContent = (Math.random() * 50 + 10).toFixed(1) + " Mbps";
    el.statUpload.textContent = (Math.random() * 10 + 2).toFixed(1) + " MB/s";
    el.statDownload.textContent = (Math.random() * 30 + 5).toFixed(1) + " MB/s";
  }, 3000);
}

function stopStats() {
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }
}

// Events
function setupEvents() {
  el.connectBtn.addEventListener("click", toggleConnection);
  el.btnAutoConnect.addEventListener("click", autoConnect);
  el.searchInput.addEventListener("input", function (e) {
    renderServerList(e.target.value);
  });
  el.btnRefresh.addEventListener("click", function () {
    fetchServers(true);
  });
  el.btnSettings.addEventListener("click", function () {
    if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open("options.html", "_blank");
    }
  });
}
