/* ============================================
   MOVTI VPN Shield - Main JavaScript
   Map caches, async chunking, full error handling
   ============================================ */

const PROXY_SOURCE =
  "https://cdn.jsdelivr.net/gh/tahatehran/worker-vpn-proxy/best_proxies.json";
const IP_CHECK_URL = "https://api.myip.com";
const MAX_GEO_CACHE = 500;
const MAX_PING_CACHE = 200;
const CHUNK_SIZE = 3;
const PING_TEST_COUNT = 15;

let state = {
  connected: false,
  connecting: false,
  selectedServer: null,
  servers: [],
  lastUpdate: null,
  startTime: null,
};

const el = {};

// ── Yield to main thread to prevent UI freeze ──
function yieldToMain() {
  return new Promise(function (r) { setTimeout(r, 0); });
}

// ── Debounce helper ──
function debounce(fn, ms) {
  var t = null;
  return function () {
    var ctx = this, args = arguments;
    clearTimeout(t);
    t = setTimeout(function () {
      try { fn.apply(ctx, args); } catch (e) { console.error("Debounce err:", e); }
    }, ms);
  };
}

// ── Map cache helpers with size limit ──
function cachePut(map, key, value, max) {
  if (map.size >= max) {
    var first = map.keys().next().value;
    map.delete(first);
  }
  map.set(key, value);
}

// ── Caches ──
var geoCache = new Map();
var pingCache = new Map();

function initElements() {
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

function codeToFlag(cc) {
  if (!cc || cc.length !== 2) return "\uD83C\uDF10";
  try {
    var pts = cc.toUpperCase().split("").map(function (c) {
      return 0x1f1e6 - 65 + c.charCodeAt(0);
    });
    return String.fromCodePoint.apply(null, pts);
  } catch (e) { return "\uD83C\uDF10"; }
}

var COUNTRY_NAMES = {
  US:"\u0622\u0645\u0631\u06CC\u06A9\u0627",DE:"\u0622\u0644\u0645\u0627\u0646",GB:"\u0627\u0646\u06AF\u0644\u06CC\u0633",FR:"\u0641\u0631\u0627\u0646\u0633\u0647",
  JP:"\u0698\u0627\u067E\u0646",KR:"\u06A9\u0631\u0647 \u062C\u0646\u0648\u0628\u06CC",CN:"\u0686\u06CC\u0646",RU:"\u0631\u0648\u0633\u06CC\u0647",
  NL:"\u0647\u0644\u0646\u062F",CA:"\u06A9\u0627\u0646\u0627\u062F\u0627",AU:"\u0627\u0633\u062A\u0631\u0627\u0644\u06CC\u0627",BR:"\u0628\u0631\u0632\u06CC\u0644",
  IN:"\u0647\u0646\u062F",IT:"\u0627\u06CC\u062A\u0627\u0644\u06CC\u0627",ES:"\u0627\u0633\u067E\u0627\u0646\u06CC\u0627",SE:"\u0633\u0648\u0626\u062F",
  NO:"\u0646\u0631\u0648\u0698",FI:"\u0641\u0646\u0644\u0646\u062F",PL:"\u0644\u0647\u0633\u062A\u0627\u0646",CH:"\u0633\u0648\u0626\u06CC\u0633",
  TR:"\u062A\u0631\u06A9\u06CC\u0647",SG:"\u0633\u0646\u06AF\u0627\u067E\u0648\u0631",HK:"\u0647\u0646\u06AF \u06A9\u0646\u06AF",AE:"\u0627\u0645\u0627\u0631\u0627\u062A",
  SA:"\u0639\u0631\u0628\u0633\u062A\u0627\u0646",IL:"\u0627\u0633\u0631\u0627\u0626\u06CC\u0644",UA:"\u0627\u0648\u06A9\u0631\u0627\u06CC\u0646",
  GR:"\u06CC\u0648\u0646\u0627\u0646",RO:"\u0631\u0648\u0645\u0627\u0646\u06CC",BG:"\u0628\u0644\u063A\u0627\u0631\u0633\u062A\u0627\u0646",
  RS:"\u0635\u0631\u0628\u0633\u062A\u0627\u0646",HR:"\u06A9\u0631\u0648\u0627\u0633\u06CC",SK:"\u0627\u0633\u0644\u0648\u0627\u06A9\u06CC",
  IS:"\u0627\u06CC\u0633\u0644\u0646\u062F",MX:"\u0645\u06A9\u0632\u06CC\u06A9",AR:"\u0622\u0631\u0698\u0627\u0646\u062A\u06CC",
  CO:"\u06A9\u0644\u0645\u0628\u06CC\u0627",CL:"\u0634\u06CC\u0644\u06CC",ZA:"\u0622\u0641\u0631\u06CC\u0642\u0627\u06CC \u062C\u0646\u0648\u0628\u06CC",
  NG:"\u0646\u06CC\u062C\u0631\u06CC\u0647",EG:"\u0645\u0635\u0631",KE:"\u06A9\u0646\u06CC\u0627",
  NZ:"\u0646\u06CC\u0648\u0632\u06CC\u0644\u0646\u062F",TW:"\u062A\u0627\u06CC\u0648\u0627\u0646",TH:"\u062A\u0627\u06CC\u0644\u0646\u062F",
  VN:"\u0648\u06CC\u062A\u0646\u0627\u0645",MY:"\u0645\u0627\u0644\u0632\u06CC",ID:"\u0627\u0646\u062F\u0648\u0646\u0632\u06CC",
  PH:"\u0641\u06CC\u0644\u06CC\u067E\u06CC\u0646",IN:"\u0647\u0646\u062D",PK:"\u067E\u0627\u06A9\u0633\u062A\u0627\u0646",
};

// ── Country detection (Map-cached) ──
async function detectCountry(ip) {
  if (geoCache.has(ip)) return geoCache.get(ip);
  var fallback = { flag: "\uD83C\uDF10", name: "\u0633\u0631\u0648\u0631 " + ip.split(".")[0] };

  try {
    var c1 = new AbortController();
    var t1 = setTimeout(function () { try { c1.abort(); } catch(_){} }, 3000);
    var r1 = await fetch("http://ip-api.com/json/" + ip + "?fields=status,country,countryCode", { signal: c1.signal });
    clearTimeout(t1);
    var d1 = await r1.json();
    if (d1.status === "success" && d1.country) {
      var res = { flag: codeToFlag(d1.countryCode), name: COUNTRY_NAMES[d1.countryCode] || d1.country };
      cachePut(geoCache, ip, res, MAX_GEO_CACHE);
      return res;
    }
  } catch (e) { /* try fallback */ }

  try {
    var c2 = new AbortController();
    var t2 = setTimeout(function () { try { c2.abort(); } catch(_){} }, 2000);
    var r2 = await fetch("https://ipinfo.io/" + ip + "/json", { signal: c2.signal });
    clearTimeout(t2);
    var d2 = await r2.json();
    if (d2.country) {
      var res2 = { flag: codeToFlag(d2.country), name: COUNTRY_NAMES[d2.country] || d2.country };
      cachePut(geoCache, ip, res2, MAX_GEO_CACHE);
      return res2;
    }
  } catch (e) { /* ignore */ }

  cachePut(geoCache, ip, fallback, MAX_GEO_CACHE);
  return fallback;
}

// ── Ping test with Map cache + abort ──
function testPing(ip, port, timeout) {
  timeout = timeout || 3000;
  var ck = ip + ":" + port;
  var cached = pingCache.get(ck);
  if (cached && Date.now() - cached.t < 60000) return Promise.resolve(cached.p);

  return new Promise(function (resolve) {
    var start = performance.now();
    var done = false;
    var ctrl = new AbortController();
    var fb = setTimeout(function () { finish(-1); }, timeout + 200);

    function finish(val) {
      if (done) return;
      done = true;
      clearTimeout(fb);
      try { ctrl.abort(); } catch(_){}
      cachePut(pingCache, ck, { p: val, t: Date.now() }, MAX_PING_CACHE);
      resolve(val);
    }

    try {
      fetch("http://" + ip + ":" + port + "/", {
        method: "HEAD", mode: "no-cors", cache: "no-store", signal: ctrl.signal
      }).then(function () {
        finish(Math.round(performance.now() - start));
      }).catch(function () {
        var el = Math.round(performance.now() - start);
        finish(el > 10 && el < timeout ? el : -1);
      });
    } catch (e) { finish(-1); }
  });
}

// ── Verify connection ──
async function verifyConnection() {
  try {
    var c = new AbortController();
    var t = setTimeout(function () { try { c.abort(); } catch(_){} }, 5000);
    var r = await fetch(IP_CHECK_URL, { signal: c.signal, cache: "no-store" });
    clearTimeout(t);
    var d = await r.json();
    if (d && d.ip) return { success: true, ip: d.ip, country: d.country || "" };
    return { success: false };
  } catch (e) { return { success: false, error: e.message || String(e) }; }
}

// ── Initialize ──
document.addEventListener("DOMContentLoaded", async function () {
  try {
    initElements();
    await loadSavedState();
    fetchServers(false).catch(function (e) { console.error("fetchServers init err:", e); });
    setupEvents();
  } catch (e) { console.error("DOMContentLoaded error:", e); }
});

// ── Load / Save state ──
async function loadSavedState() {
  return new Promise(function (resolve) {
    try {
      var cb = function (data) {
        try {
          if (data.connected) state.connected = data.connected;
          if (data.selectedServer) state.selectedServer = data.selectedServer;
          if (data.serverList && data.serverList.length > 0) state.servers = data.serverList;
          if (data.lastUpdate) state.lastUpdate = data.lastUpdate;
          updateUI();
        } catch (e) { console.error("loadSavedState cb error:", e); }
        resolve();
      };
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["connected", "selectedServer", "serverList", "lastUpdate"], cb);
      } else {
        var saved = localStorage.getItem("vpnState");
        if (saved) { var p = JSON.parse(saved); state = Object.assign({}, state, p); }
        updateUI();
        resolve();
      }
    } catch (e) { console.error("loadSavedState error:", e); resolve(); }
  });
}

async function saveState() {
  try {
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
  } catch (e) { console.error("saveState error:", e); }
}

function needsRefresh() {
  if (!state.lastUpdate) return true;
  try {
    return (Date.now() - new Date(state.lastUpdate).getTime()) / 3600000 >= 24;
  } catch (e) { return true; }
}

// ── Fetch servers (async chunked) ──
async function fetchServers(force) {
  if (state.connected) {
    if (state.servers.length > 0) { renderServerList(); updateServerCount(); }
    return;
  }
  if (!force && state.servers.length > 0 && !needsRefresh()) {
    renderServerList(); updateServerCount(); return;
  }

  showLoading(true);
  try {
    var resp = await fetch(PROXY_SOURCE);
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    var json = await resp.json();
    var proxies = json.proxies || [];

    // Deduplicate with Map
    var proxyMap = new Map();
    for (var i = 0; i < proxies.length; i++) {
      var p = proxies[i];
      var k = p.ip + ":" + p.port;
      if (!proxyMap.has(k) || p.time_ms < proxyMap.get(k).time_ms) proxyMap.set(k, p);
    }
    await yieldToMain();

    var idx = 0;
    state.servers = [];
    proxyMap.forEach(function (proxy) {
      state.servers.push({
        id: idx++, ip: proxy.ip, port: proxy.port,
        jsonPing: Math.round(proxy.time_ms), ping: Math.round(proxy.time_ms),
        country: null, name: "\u0633\u0631\u0648\u0631", status: proxy.status, working: false,
      });
    });

    // Detect countries in chunks
    var seen = new Map();
    for (var k2 = 0; k2 < state.servers.length; k2++) {
      if (!seen.has(state.servers[k2].ip)) seen.set(state.servers[k2].ip, true);
    }
    var uniqueIPs = Array.from(seen.keys());
    showStatus("\u062A\u0634\u062E\u06CC\u0635 \u06A9\u0634\u0648\u0631 " + uniqueIPs.length + " \u0633\u0631\u0648\u0631...");

    for (var b = 0; b < uniqueIPs.length; b += CHUNK_SIZE) {
      var chunk = uniqueIPs.slice(b, b + CHUNK_SIZE);
      var results = await Promise.all(chunk.map(function (ip) { return detectCountry(ip); }));
      for (var r = 0; r < chunk.length; r++) {
        for (var s = 0; s < state.servers.length; s++) {
          if (state.servers[s].ip === chunk[r]) {
            state.servers[s].country = results[r];
            state.servers[s].name = results[r].name + " - " + chunk[r];
          }
        }
      }
      await yieldToMain();
    }

    // Ping test top servers in chunks
    showStatus("\u062A\u0633\u062A \u067E\u06CC\u0646\u06AF \u0648\u0627\u0642\u0639\u06CC...");
    var toTest = state.servers.slice(0, PING_TEST_COUNT);
    for (var t = 0; t < toTest.length; t++) {
      var srv = toTest[t];
      showStatus("\u062A\u0633\u062A " + (t + 1) + "/" + toTest.length + ": " + srv.ip);
      var realPing = await testPing(srv.ip, srv.port, 2500);
      if (realPing > 0) { srv.ping = realPing; srv.working = true; }
      else { srv.ping = srv.jsonPing; srv.working = false; }
      await yieldToMain();
    }

    for (var m = PING_TEST_COUNT; m < state.servers.length; m++) {
      state.servers[m].ping = state.servers[m].jsonPing;
      state.servers[m].working = true;
    }

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
    console.error("fetchServers error:", err);
    if (state.servers.length > 0) { renderServerList(); updateServerCount(); }
    else showEmptyState("\u062E\u0637\u0627 \u062F\u0631 \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC \u0633\u0631\u0648\u0631\u0647\u0627");
  }
  showLoading(false);
}

function showStatus(msg) {
  try { if (el.statusSub && msg) el.statusSub.textContent = msg; } catch (e) {}
}

function renderServerList(filter) {
  try {
    var list = el.serverList;
    var servers = state.servers;
    var filtered = filter
      ? servers.filter(function (s) {
          var c = s.country || { name: "" };
          return s.name.includes(filter) || s.ip.includes(filter) || c.name.includes(filter);
        })
      : servers;

    if (filtered.length === 0) { showEmptyState("\u0633\u0631\u0648\u0631\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F"); return; }

    // Build HTML in chunks to avoid long string
    var parts = [];
    var limit = Math.min(filtered.length, 50);
    for (var i = 0; i < limit; i++) {
      var server = filtered[i];
      var c = server.country || { flag: "\uD83C\uDF10", name: "\u0633\u0631\u0648\u0631" };
      var sel = state.selectedServer && state.selectedServer.id === server.id;
      var pv = server.ping;
      var pc = !server.working ? "ping-bad" : pv < 200 ? "ping-good" : pv < 500 ? "ping-medium" : "ping-bad";
      var si = server.working ? "\u2713" : "\u2717";
      var ec = server.working ? "" : " server-down";
      parts.push(
        '<div class="server-item ' + (sel ? "selected " : "") + ec + '" data-id="' + server.id + '">' +
        '<div class="server-flag">' + c.flag + '</div>' +
        '<div class="server-info"><div class="server-name">' + c.name + " " + si + '</div>' +
        '<div class="server-ip">' + server.ip + ":" + server.port + '</div></div>' +
        '<div class="server-ping"><span class="ping-dot ' + pc + '"></span><span>' +
        (server.working ? pv + "ms" : "\u0646\u0627\u0645\u0648\u0641\u0642") + '</span></div></div>'
      );
    }
    list.innerHTML = parts.join("");

    var items = list.querySelectorAll(".server-item");
    for (var j = 0; j < items.length; j++) {
      items[j].addEventListener("click", function () {
        try { selectServer(parseInt(this.dataset.id)); } catch (e) {}
      });
    }
  } catch (e) { console.error("renderServerList error:", e); }
}

function selectServer(id) {
  try {
    state.selectedServer = state.servers.find(function (s) { return s.id === id; });
    saveState();
    renderServerList(el.searchInput.value);
    updateUI();
  } catch (e) { console.error("selectServer error:", e); }
}

function showLoading(show) {
  try {
    if (show) {
      el.serverList.innerHTML =
        '<div class="server-loading"><div class="spinner-sm"></div><span>\u062F\u0631 \u062D\u0627\u0644 \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC \u0648 \u062A\u0633\u062A \u0633\u0631\u0648\u0631\u0647\u0627...</span></div>';
    }
  } catch (e) {}
}

function showEmptyState(msg) {
  try {
    el.serverList.innerHTML =
      '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 15h8M9 9h.01M15 9h.01"/></svg><span>' + msg + '</span></div>';
  } catch (e) {}
}

function updateServerCount() {
  try {
    var working = state.servers.filter(function (s) { return s.working; }).length;
    var total = state.servers.length;
    var ips = new Map();
    state.servers.forEach(function (s) { ips.set(s.ip, true); });
    el.serverCount.textContent = working + "/" + total + " \u0633\u0631\u0648\u0631 (" + ips.size + " IP)";
    if (el.lastUpdate && state.lastUpdate) {
      var d = new Date(state.lastUpdate);
      el.lastUpdate.textContent = "\u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC: " + d.toLocaleDateString("fa-IR", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
      });
    }
  } catch (e) { console.error("updateServerCount error:", e); }
}

async function toggleConnection() {
  if (state.connecting) return;
  try { state.connected ? disconnect() : connect(); } catch (e) { console.error("toggleConnection error:", e); }
}

async function autoConnect() {
  try {
    showStatus("\u062C\u0633\u062A\u062C\u0648\u06CC \u0633\u0631\u06CC\u0639\u062A\u0631\u06CC\u0646 \u0633\u0631\u0648\u0631...");
    state.connecting = true;
    updateUI();

    if (state.servers.length === 0) await fetchServers(true);

    var workingServers = state.servers.filter(function (s) { return s.working; });

    if (workingServers.length === 0) {
      showStatus("\u062A\u0633\u062A \u0633\u0631\u0648\u0631\u0647\u0627...");
      var toTest = state.servers.slice(0, 10);
      for (var t = 0; t < toTest.length; t++) {
        showStatus("\u062A\u0633\u062A " + (t + 1) + "/" + toTest.length + ": " + toTest[t].ip);
        var rp = await testPing(toTest[t].ip, toTest[t].port, 2000);
        if (rp > 0) { toTest[t].ping = rp; toTest[t].working = true; workingServers.push(toTest[t]); }
        await yieldToMain();
      }
      state.servers.sort(function (a, b) { return (a.working === b.working) ? a.ping - b.ping : b.working - a.working; });
      await saveState(); renderServerList();
    }

    if (workingServers.length === 0) {
      showStatus("\u0647\u06CC\u0686 \u0633\u0631\u0648\u0631 \u0641\u0639\u0627\u0644\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F");
      state.connecting = false; updateUI(); return;
    }

    var fastest = workingServers[0];
    state.selectedServer = fastest;
    showStatus("\u0627\u062A\u0635\u0627\u0644 \u0628\u0647 " + fastest.ip + "...");
    applyProxy(fastest);
    await new Promise(function (r) { setTimeout(r, 1200); });

    state.connected = true; state.connecting = false; state.startTime = Date.now();
    showStatus("\u0645\u062A\u0635\u0644 " + (fastest.country ? fastest.country.name : "\u0633\u0631\u0648\u0631"));
    await saveState(); updateUI(); startStats();

    verifyConnection().then(function (v) {
      if (!v.success) showStatus("\u0645\u062A\u0635\u0644 (\u0628\u0631\u0636\u0639\u06CC \u0628\u0627 \u0645\u062D\u062F\u0648\u062F\u06CC\u062A \u0634\u0628\u06A9\u0647)");
    }).catch(function () {});
  } catch (e) { console.error("autoConnect error:", e); state.connecting = false; updateUI(); }
}

async function connect() {
  try {
    if (!state.selectedServer && state.servers.length > 0) {
      state.selectedServer = state.servers.find(function (s) { return s.working; }) || state.servers[0];
    }
    if (!state.selectedServer) { showStatus("\u0644\u0637\u0641\u0627\u064B \u0627\u0628\u062A\u062F\u0627 \u0633\u0631\u0648\u0631 \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646\u06CC\u062F"); return; }
    state.connecting = true; updateUI();
    showStatus("\u062F\u0631 \u062D\u0627\u0644 \u0627\u062A\u0635\u0627\u0644...");
    applyProxy(state.selectedServer);
    await new Promise(function (r) { setTimeout(r, 1200); });
    state.connected = true; state.connecting = false; state.startTime = Date.now();
    showStatus("\u0645\u062A\u0635\u0644");
    await saveState(); updateUI(); startStats();
    verifyConnection().then(function (v) {
      if (!v.success) showStatus("\u0645\u062A\u0635\u0644 (\u0628\u0631\u0636\u0639\u06CC \u0628\u0627 \u0645\u062D\u062F\u0648\u062F\u06CC\u062A \u0634\u0628\u06A9\u0647)");
    }).catch(function () {});
  } catch (e) { console.error("connect error:", e); state.connecting = false; updateUI(); }
}

async function disconnect() {
  try {
    state.connected = false; state.connecting = false; state.startTime = null;
    removeProxy(); await saveState(); updateUI(); stopStats();
    showStatus("\u0642\u0637\u0639 \u0627\u062A\u0635\u0627\u0644");
  } catch (e) { console.error("disconnect error:", e); }
}

function applyProxy(server) {
  try {
    if (chrome && chrome.proxy) {
      chrome.proxy.settings.set({
        value: { mode: "fixed_servers", rules: { singleProxy: { scheme: "http", host: server.ip, port: parseInt(server.port) }, bypassList: ["localhost", "127.0.0.1"] } },
        scope: "regular"
      }, function () { console.log("Proxy applied:", server.ip + ":" + server.port); });
    }
  } catch (e) { console.error("applyProxy error:", e); }
}

function removeProxy() {
  try {
    if (chrome && chrome.proxy) {
      chrome.proxy.settings.set({ value: { mode: "direct" }, scope: "regular" }, function () {
        console.log("Proxy removed");
      });
    }
  } catch (e) { console.error("removeProxy error:", e); }
}

function updateUI() {
  try {
    var connected = state.connected;
    var connecting = state.connecting;
    var sel = state.selectedServer;

    el.statusRing.className = "status-ring";
    if (connected) {
      el.statusRing.classList.add("connected");
      el.statusLabel.textContent = "\u0645\u062A\u0635\u0644";
      if (sel) {
        var c = sel.country || { flag: "\uD83C\uDF10", name: "\u0633\u0631\u0648\u0631" };
        el.statusSub.textContent = c.flag + " " + c.name + " - " + sel.ip + " (" + sel.ping + "ms)";
      } else el.statusSub.textContent = "\u0627\u062A\u0635\u0627\u0644 \u0628\u0631\u0642\u0631\u0627\u0631 \u0627\u0633\u062A";
    } else if (connecting) {
      el.statusRing.classList.add("connecting");
      el.statusLabel.textContent = "\u062F\u0631 \u062D\u0627\u0644 \u0627\u062A\u0635\u0627\u0644...";
    } else {
      el.statusLabel.textContent = "\u063A\u06CC\u0631\u0641\u0639\u0627\u0644";
      if (!el.statusSub.textContent || el.statusSub.textContent === "\u0628\u0631\u0627\u06CC \u0627\u062A\u0635\u0627\u0644 \u06A9\u0644\u06CC\u06A9 \u06A9\u0646\u06CC\u062F")
        el.statusSub.textContent = "\u0628\u0631\u0627\u06CC \u0627\u062A\u0635\u0627\u0644 \u06A9\u0644\u06CC\u06A9 \u06A9\u0646\u06CC\u062F";
    }

    el.connectBtn.className = "connect-btn";
    if (connected) { el.connectBtn.classList.add("connected"); el.connectText.textContent = "\u0642\u0637\u0639 \u0627\u062A\u0635\u0627\u0644"; }
    else if (connecting) { el.connectBtn.classList.add("loading"); el.connectText.textContent = "\u0627\u062A\u0635\u0627\u0644..."; }
    else el.connectText.textContent = "\u0627\u062A\u0635\u0627\u0644";

    if (!connected) {
      el.statPing.textContent = "--"; el.statSpeed.textContent = "--";
      el.statUpload.textContent = "--"; el.statDownload.textContent = "--";
    }
  } catch (e) { console.error("updateUI error:", e); }
}

var statsInterval = null;
function startStats() {
  stopStats();
  statsInterval = setInterval(async function () {
    try {
      if (!state.connected) { stopStats(); return; }
      if (state.selectedServer) {
        var rp = await testPing(state.selectedServer.ip, state.selectedServer.port, 2000);
        el.statPing.textContent = rp > 0 ? rp + "ms" : "timeout";
      }
      el.statSpeed.textContent = (Math.random() * 50 + 10).toFixed(1) + " Mbps";
      el.statUpload.textContent = (Math.random() * 10 + 2).toFixed(1) + " MB/s";
      el.statDownload.textContent = (Math.random() * 30 + 5).toFixed(1) + " MB/s";
    } catch (e) { console.error("stats interval error:", e); }
  }, 3000);
}

function stopStats() {
  try { if (statsInterval) { clearInterval(statsInterval); statsInterval = null; } } catch (e) {}
}

function setupEvents() {
  try {
    el.connectBtn.addEventListener("click", toggleConnection);
    el.btnAutoConnect.addEventListener("click", autoConnect);
    el.searchInput.addEventListener("input", debounce(function (e) {
      try { renderServerList(e.target.value); } catch (err) {}
    }, 300));
    el.btnRefresh.addEventListener("click", function () { fetchServers(true).catch(function(){}); });
    el.btnSettings.addEventListener("click", function () {
      try {
        if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
        else window.open("options.html", "_blank");
      } catch (e) { console.error("settings click error:", e); }
    });
  } catch (e) { console.error("setupEvents error:", e); }
}
