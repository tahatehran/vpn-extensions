/* ============================================
   MOVTI VPN Shield - Options Page Script
   ============================================ */

const PROXY_SOURCE =
  "https://cdn.jsdelivr.net/gh/tahatehran/worker-vpn-proxy/best_proxies.json";

// DOM Elements
const elements = {
  autoConnect: document.getElementById("auto-connect"),
  killSwitch: document.getElementById("kill-switch"),
  autoPing: document.getElementById("auto-ping"),
  workingOnly: document.getElementById("working-only"),
  autoSelect: document.getElementById("auto-select"),
  timeout: document.getElementById("timeout"),
  timeoutValue: document.getElementById("timeout-value"),
  maxPing: document.getElementById("max-ping"),
  maxPingValue: document.getElementById("max-ping-value"),
  proxyCount: document.getElementById("proxy-count"),
  btnUpdate: document.getElementById("btn-update-proxies"),
  btnExport: document.getElementById("btn-export-proxies"),
  btnTestAll: document.getElementById("btn-test-all"),
  btnReset: document.getElementById("btn-reset"),
  dnsOptions: document.querySelectorAll('input[name="dns"]'),
  statTotal: document.getElementById("stat-total"),
  statWorking: document.getElementById("stat-working"),
  statCountries: document.getElementById("stat-countries"),
  statLastUpdate: document.getElementById("stat-last-update"),
  testProgress: document.getElementById("test-progress"),
  progressFill: document.getElementById("progress-fill"),
  progressText: document.getElementById("progress-text"),
  serverResults: document.getElementById("server-results"),
  resultsList: document.getElementById("results-list"),
};

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  await loadStats();
  setupEventListeners();
});

// Load settings from storage
async function loadSettings() {
  return new Promise((resolve) => {
    const apply = (settings) => {
      elements.autoConnect.checked = settings.autoConnect || false;
      elements.killSwitch.checked = settings.killSwitch || false;
      elements.autoPing.checked = settings.autoPing !== undefined ? settings.autoPing : true;
      elements.workingOnly.checked = settings.workingOnly !== undefined ? settings.workingOnly : true;
      elements.autoSelect.checked = settings.autoSelect !== undefined ? settings.autoSelect : true;
      elements.timeout.value = settings.timeout || 5;
      elements.timeoutValue.textContent = settings.timeout + " ثانیه";
      elements.maxPing.value = settings.maxPing || 1000;
      elements.maxPingValue.textContent = (settings.maxPing || 1000) + "ms";

      const dns = settings.dns || "default";
      elements.dnsOptions.forEach((opt) => {
        opt.checked = opt.value === dns;
      });
    };

    if (chrome?.storage?.local) {
      chrome.storage.local.get(["settings"], (data) => {
        apply(data.settings || {});
        resolve();
      });
    } else {
      const saved = localStorage.getItem("vpnSettings");
      apply(saved ? JSON.parse(saved) : {});
      resolve();
    }
  });
}

// Save settings
async function saveSettings() {
  const settings = {
    autoConnect: elements.autoConnect.checked,
    killSwitch: elements.killSwitch.checked,
    autoPing: elements.autoPing.checked,
    workingOnly: elements.workingOnly.checked,
    autoSelect: elements.autoSelect.checked,
    timeout: parseInt(elements.timeout.value),
    maxPing: parseInt(elements.maxPing.value),
    dns: document.querySelector('input[name="dns"]:checked')?.value || "default",
  };

  if (chrome?.storage?.local) {
    chrome.storage.local.set({ settings });
  } else {
    localStorage.setItem("vpnSettings", JSON.stringify(settings));
  }
}

// Load stats
async function loadStats() {
  try {
    const resp = await fetch(PROXY_SOURCE);
    const json = await resp.json();
    const proxies = json.proxies || [];

    // Deduplicate
    const map = new Map();
    for (const p of proxies) {
      const key = p.ip + ":" + p.port;
      if (!map.has(key) || p.time_ms < map.get(key).time_ms) {
        map.set(key, p);
      }
    }

    const servers = Array.from(map.values());
    const uniqueIPs = new Set(servers.map((s) => s.ip));
    const countries = new Set();

    // Detect countries
    for (const s of servers) {
      const first = s.ip.split(".")[0];
      countries.add(first);
    }

    elements.statTotal.textContent = servers.length;
    elements.statWorking.textContent = servers.filter((s) => s.time_ms < 500).length;
    elements.statCountries.textContent = countries.size;
    elements.proxyCount.textContent = servers.length + " سرور (" + uniqueIPs.size + " IP منحصربفرد)";

    if (json.timestamp) {
      const d = new Date(json.timestamp);
      elements.statLastUpdate.textContent = d.toLocaleDateString("fa-IR", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
    }
  } catch (error) {
    elements.proxyCount.textContent = "خطا در بارگذاری";
    console.error("Failed to load stats:", error);
  }
}

// Test all servers
async function testAllServers() {
  elements.btnTestAll.disabled = true;
  elements.btnTestAll.textContent = "در حال تست...";
  elements.testProgress.style.display = "block";
  elements.serverResults.style.display = "block";
  elements.resultsList.innerHTML = "";

  try {
    const resp = await fetch(PROXY_SOURCE);
    const json = await resp.json();
    const proxies = json.proxies || [];

    // Deduplicate
    const map = new Map();
    for (const p of proxies) {
      const key = p.ip + ":" + p.port;
      if (!map.has(key) || p.time_ms < map.get(key).time_ms) {
        map.set(key, p);
      }
    }

    const servers = Array.from(map.values()).slice(0, 20);
    const results = [];

    for (let i = 0; i < servers.length; i++) {
      const s = servers[i];
      const progress = ((i + 1) / servers.length) * 100;
      elements.progressFill.style.width = progress + "%";
      elements.progressText.textContent = "تست " + (i + 1) + "/" + servers.length + ": " + s.ip;

      const ping = await testPing(s.ip, s.port);
      results.push({
        ip: s.ip,
        port: s.port,
        ping: ping,
        working: ping > 0,
        jsonPing: Math.round(s.time_ms),
      });
    }

    // Sort by ping
    results.sort((a, b) => {
      if (a.working && !b.working) return -1;
      if (!a.working && b.working) return 1;
      return a.ping - b.ping;
    });

    // Render results
    elements.resultsList.innerHTML = results.map((r) => {
      const pingClass = !r.working ? "ping-bad" : r.ping < 200 ? "ping-good" : r.ping < 500 ? "ping-medium" : "ping-bad";
      const status = r.working ? "✓" : "✗";
      return '<div class="result-item">' +
        '<span class="result-status ' + pingClass + '">' + status + '</span>' +
        '<span class="result-ip">' + r.ip + ':' + r.port + '</span>' +
        '<span class="result-ping">' + (r.working ? r.ping + 'ms' : 'ناموفق') + '</span>' +
        '<span class="result-json">' + r.jsonPing + 'ms (JSON)</span>' +
      '</div>';
    }).join("");

    elements.progressText.textContent = "تست کامل شد! " + results.filter((r) => r.working).length + "/" + results.length + " سرور فعال";
  } catch (error) {
    elements.progressText.textContent = "خطا در تست: " + error.message;
  }

  elements.btnTestAll.disabled = false;
  elements.btnTestAll.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> تست تمام سرورها';
}

// Test single ping
async function testPing(ip, port, timeout = 3000) {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    await fetch("http://" + ip + ":" + port, {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return Math.round(performance.now() - start);
  } catch (e) {
    return -1;
  }
}

// Setup event listeners
function setupEventListeners() {
  // Settings toggles
  elements.autoConnect.addEventListener("change", saveSettings);
  elements.killSwitch.addEventListener("change", saveSettings);
  elements.autoPing.addEventListener("change", saveSettings);
  elements.workingOnly.addEventListener("change", saveSettings);
  elements.autoSelect.addEventListener("change", saveSettings);

  // Range inputs
  elements.timeout.addEventListener("input", (e) => {
    elements.timeoutValue.textContent = e.target.value + " ثانیه";
    saveSettings();
  });

  elements.maxPing.addEventListener("input", (e) => {
    elements.maxPingValue.textContent = e.target.value + "ms";
    saveSettings();
  });

  // DNS options
  elements.dnsOptions.forEach((opt) => {
    opt.addEventListener("change", saveSettings);
  });

  // Test all servers
  elements.btnTestAll.addEventListener("click", testAllServers);

  // Update proxies
  elements.btnUpdate.addEventListener("click", async () => {
    elements.btnUpdate.disabled = true;
    elements.btnUpdate.textContent = "در حال بروزرسانی...";

    try {
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: "FORCE_UPDATE" });
      }
      await loadStats();
      elements.proxyCount.textContent = "بروزرسانی شد ✅";
    } catch (error) {
      elements.proxyCount.textContent = "خطا در بروزرسانی ❌";
    }

    setTimeout(() => {
      elements.btnUpdate.disabled = false;
      elements.btnUpdate.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> بروزرسانی لیست';
    }, 2000);
  });

  // Export proxies
  elements.btnExport.addEventListener("click", async () => {
    try {
      const resp = await fetch(PROXY_SOURCE);
      const text = await resp.text();
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "best_proxies.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  });

  // Reset
  elements.btnReset.addEventListener("click", async () => {
    if (confirm("آیا مطمئن هستید؟ تمام تنظیمات بازنشانی می‌شود.")) {
      const defaultSettings = {
        autoConnect: false,
        killSwitch: false,
        autoPing: true,
        workingOnly: true,
        autoSelect: true,
        timeout: 5,
        maxPing: 1000,
        dns: "default",
      };

      if (chrome?.storage?.local) {
        chrome.storage.local.set({ settings: defaultSettings });
      } else {
        localStorage.setItem("vpnSettings", JSON.stringify(defaultSettings));
      }

      await loadSettings();
      alert("تنظیمات بازنشانی شد!");
    }
  });
}
