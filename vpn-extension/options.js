/* ============================================
   MOVTI VPN Shield - Options Page Script
   Persists settings via background service worker
   ============================================ */
/* eslint-disable no-alert */

const PROXY_SOURCE =
  "https://cdn.jsdelivr.net/gh/tahatehran/worker-vpn-proxy/best_proxies.json";

const DEFAULT_SETTINGS = {
  autoConnect: false,
  killSwitch: false,
  dns: "default",
  geoProvider: "ipinfo",
};

const $ = (id) => document.getElementById(id);

const elements = {};

function cacheElements() {
  const ids = [
    "auto-connect",
    "kill-switch",
    "geo-provider",
    "dns-default",
    "dns-cloudflare",
    "dns-google",
    "dns-opendns",
    "proxy-count",
    "btn-update",
    "btn-test-all",
    "btn-reset",
    "stat-total",
    "stat-countries",
    "stat-last-update",
    "test-progress",
    "progress-fill",
    "progress-text",
    "results-list",
  ];
  for (const id of ids) elements[id] = $(id);
}

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

document.addEventListener("DOMContentLoaded", async () => {
  cacheElements();
  await loadSettings();
  await loadStats();
  setupEventListeners();
});

async function loadSettings() {
  const resp = await sendMessage({ type: "GET_STATUS" });
  const settings = (resp && resp.settings) || DEFAULT_SETTINGS;
  elements["auto-connect"].checked = !!settings.autoConnect;
  elements["kill-switch"].checked = !!settings.killSwitch;
  elements["geo-provider"].value = settings.geoProvider || "ipinfo";
  const dns = settings.dns || "default";
  const dnsRadio = document.querySelector('input[name="dns"][value="' + dns + '"]');
  if (dnsRadio) dnsRadio.checked = true;
}

function readSettings() {
  return {
    autoConnect: elements["auto-connect"].checked,
    killSwitch: elements["kill-switch"].checked,
    dns:
      (document.querySelector('input[name="dns"]:checked') || {}).value ||
      "default",
    geoProvider: elements["geo-provider"].value,
  };
}

async function saveSettings() {
  await sendMessage({ type: "SAVE_SETTINGS", settings: readSettings() });
}

async function loadStats() {
  const resp = await sendMessage({ type: "GET_STATUS" });
  const list = (resp && resp.serverList) || [];
  const total = list.length;
  const uniqueIPs = new Set(list.map((s) => s.ip)).size;
  if (elements["stat-total"]) elements["stat-total"].textContent = total;
  if (elements["stat-countries"])
    elements["stat-countries"].textContent = uniqueIPs;
  if (elements["proxy-count"])
    elements["proxy-count"].textContent =
      total + " servers (" + uniqueIPs + " IPs)";
  if (elements["stat-last-update"] && resp && resp.lastUpdate) {
    const d = new Date(resp.lastUpdate);
    elements["stat-last-update"].textContent = d.toLocaleString();
  }
}

function isPrivateHost(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return true;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1") return true;
    if (/^(10|127|169\.254|172\.(1[6-9]|2\d|3[01])|192\.168)\./.test(h))
      return true;
    return false;
  } catch {
    return true;
  }
}

// Escape untrusted strings before inserting into innerHTML
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]);
}

// MV3 blocks direct http:// probes of proxy IPs from secure extension pages,
// so the table shows the provider-reported latency and status instead of a
// client-side measurement.
async function testAllServers() {
  const btn = elements["btn-test-all"];
  btn.disabled = true;
  btn.textContent = "Testing…";
  elements["test-progress"].style.display = "block";
  elements["results-list"].innerHTML = "";
  try {
    if (isPrivateHost(PROXY_SOURCE)) throw new Error("Refusing non-public host");
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
    const servers = Array.from(map.values()).slice(0, 20);
    const results = [];
    for (let i = 0; i < servers.length; i++) {
      const s = servers[i];
      const progress = ((i + 1) / servers.length) * 100;
      elements["progress-fill"].style.width = progress + "%";
      elements["progress-text"].textContent =
        "Test " + (i + 1) + "/" + servers.length + ": " + s.ip;
      results.push({
        ip: s.ip,
        port: s.port,
        ok: s.status === "ok",
        ping: Math.round(s.time_ms || 0),
      });
    }
    results.sort((a, b) => {
      if (a.ok !== b.ok) return a.ok ? -1 : 1;
      return a.ping - b.ping;
    });
    elements["results-list"].innerHTML = results
      .map((r) => {
        const cls = !r.ok
          ? "ping-bad"
          : r.ping < 200
            ? "ping-good"
            : "ping-medium";
        return (
          '<div class="result-item">' +
          '<span class="result-status ' +
          cls +
          '">' +
          (r.ok ? "✓" : "✗") +
          "</span>" +
          '<span class="result-ip">' +
          esc(r.ip) +
          ":" +
          esc(r.port) +
          "</span>" +
          '<span class="result-ping">' +
          esc(r.ping) +
          "ms</span>" +
          '<span class="result-json">reported</span>' +
          "</div>"
        );
      })
      .join("");
    const working = results.filter((r) => r.ok).length;
    elements["progress-text"].textContent =
      "Done: " + working + "/" + results.length + " servers reported healthy";
  } catch (error) {
    elements["progress-text"].textContent = "Test failed: " + error.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Test all servers";
  }
}

async function updateProxies() {
  const btn = elements["btn-update"];
  btn.disabled = true;
  btn.textContent = "Updating…";
  try {
    await sendMessage({ type: "FORCE_UPDATE" });
    await loadStats();
    btn.textContent = "Updated ✓";
  } catch (e) {
    btn.textContent = "Failed ✗";
  }
  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = "Update list";
  }, 2000);
}

async function resetSettings() {
  if (!confirm("Reset all settings to defaults?")) return;
  await sendMessage({ type: "SAVE_SETTINGS", settings: DEFAULT_SETTINGS });
  await loadSettings();
  alert("Settings reset");
}

function setupEventListeners() {
  elements["auto-connect"].addEventListener("change", saveSettings);
  elements["kill-switch"].addEventListener("change", saveSettings);
  elements["geo-provider"].addEventListener("change", saveSettings);
  document
    .querySelectorAll('input[name="dns"]')
    .forEach((r) => r.addEventListener("change", saveSettings));
  elements["btn-test-all"].addEventListener("click", testAllServers);
  elements["btn-update"].addEventListener("click", updateProxies);
  elements["btn-reset"].addEventListener("click", resetSettings);
}
