/* ============================================
   MOVTI VPN Shield - Options Page Script
   Map caches, async chunking, full error handling
   ============================================ */

const PROXY_SOURCE =
  "https://cdn.jsdelivr.net/gh/tahatehran/worker-vpn-proxy/best_proxies.json";

// ── Yield to main thread ──
function yieldToMain() {
  return new Promise(function (r) {
    setTimeout(r, 0);
  });
}

// ── Map cache for dedup ──
var optionsProxyCache = new Map();

// DOM Elements with null-safety
var elements = {};
function initDOM() {
  try {
    elements.autoConnect = document.getElementById("auto-connect");
    elements.killSwitch = document.getElementById("kill-switch");
    elements.autoPing = document.getElementById("auto-ping");
    elements.workingOnly = document.getElementById("working-only");
    elements.autoSelect = document.getElementById("auto-select");
    elements.timeout = document.getElementById("timeout");
    elements.timeoutValue = document.getElementById("timeout-value");
    elements.maxPing = document.getElementById("max-ping");
    elements.maxPingValue = document.getElementById("max-ping-value");
    elements.proxyCount = document.getElementById("proxy-count");
    elements.btnUpdate = document.getElementById("btn-update-proxies");
    elements.btnExport = document.getElementById("btn-export-proxies");
    elements.btnTestAll = document.getElementById("btn-test-all");
    elements.btnReset = document.getElementById("btn-reset");
    elements.dnsOptions = document.querySelectorAll('input[name="dns"]');
    elements.statTotal = document.getElementById("stat-total");
    elements.statWorking = document.getElementById("stat-working");
    elements.statCountries = document.getElementById("stat-countries");
    elements.statLastUpdate = document.getElementById("stat-last-update");
    elements.testProgress = document.getElementById("test-progress");
    elements.progressFill = document.getElementById("progress-fill");
    elements.progressText = document.getElementById("progress-text");
    elements.serverResults = document.getElementById("server-results");
    elements.resultsList = document.getElementById("results-list");
  } catch (e) {
    console.error("initDOM error:", e);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  try {
    initDOM();
    await loadSettings();
    await loadStats();
    setupEventListeners();
  } catch (e) {
    console.error("DOMContentLoaded error:", e);
  }
});

async function loadSettings() {
  return new Promise(function (resolve) {
    try {
      var apply = function (settings) {
        if (!settings) settings = {};
        try {
          if (elements.autoConnect)
            elements.autoConnect.checked = settings.autoConnect || false;
          if (elements.killSwitch)
            elements.killSwitch.checked = settings.killSwitch || false;
          if (elements.autoPing)
            elements.autoPing.checked =
              settings.autoPing !== undefined ? settings.autoPing : true;
          if (elements.workingOnly)
            elements.workingOnly.checked =
              settings.workingOnly !== undefined ? settings.workingOnly : true;
          if (elements.autoSelect)
            elements.autoSelect.checked =
              settings.autoSelect !== undefined ? settings.autoSelect : true;
          if (elements.timeout) elements.timeout.value = settings.timeout || 5;
          if (elements.timeoutValue)
            elements.timeoutValue.textContent =
              (settings.timeout || 5) + " \u062B\u0627\u0646\u06CC\u0647";
          if (elements.maxPing)
            elements.maxPing.value = settings.maxPing || 1000;
          if (elements.maxPingValue)
            elements.maxPingValue.textContent =
              (settings.maxPing || 1000) + "ms";
          var dns = settings.dns || "default";
          if (elements.dnsOptions) {
            elements.dnsOptions.forEach(function (opt) {
              opt.checked = opt.value === dns;
            });
          }
        } catch (e) {
          console.error("apply settings error:", e);
        }
      };

      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["settings"], function (data) {
          try {
            apply(data.settings || {});
          } catch (e) {
            console.error("loadSettings cb error:", e);
          }
          resolve();
        });
      } else {
        var saved = localStorage.getItem("vpnSettings");
        apply(saved ? JSON.parse(saved) : {});
        resolve();
      }
    } catch (e) {
      console.error("loadSettings error:", e);
      resolve();
    }
  });
}

async function saveSettings() {
  try {
    var settings = {
      autoConnect: elements.autoConnect ? elements.autoConnect.checked : false,
      killSwitch: elements.killSwitch ? elements.killSwitch.checked : false,
      autoPing: elements.autoPing ? elements.autoPing.checked : true,
      workingOnly: elements.workingOnly ? elements.workingOnly.checked : true,
      autoSelect: elements.autoSelect ? elements.autoSelect.checked : true,
      timeout: elements.timeout ? parseInt(elements.timeout.value) : 5,
      maxPing: elements.maxPing ? parseInt(elements.maxPing.value) : 1000,
      dns: document.querySelector('input[name="dns"]:checked')
        ? document.querySelector('input[name="dns"]:checked').value
        : "default",
    };
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ settings: settings });
    } else {
      localStorage.setItem("vpnSettings", JSON.stringify(settings));
    }
  } catch (e) {
    console.error("saveSettings error:", e);
  }
}

async function loadStats() {
  try {
    var resp = await fetch(PROXY_SOURCE);
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    var json = await resp.json();
    var proxies = json.proxies || [];

    // Deduplicate with Map
    optionsProxyCache.clear();
    for (var i = 0; i < proxies.length; i++) {
      var p = proxies[i];
      var k = p.ip + ":" + p.port;
      if (
        !optionsProxyCache.has(k) ||
        p.time_ms < optionsProxyCache.get(k).time_ms
      ) {
        optionsProxyCache.set(k, p);
      }
    }

    var servers = Array.from(optionsProxyCache.values());
    var uniqueIPs = new Map();
    var countries = new Map();

    for (var j = 0; j < servers.length; j++) {
      uniqueIPs.set(servers[j].ip, true);
      countries.set(servers[j].ip.split(".")[0], true);
    }

    if (elements.statTotal) elements.statTotal.textContent = servers.length;
    if (elements.statWorking)
      elements.statWorking.textContent = servers.filter(function (s) {
        return s.time_ms < 500;
      }).length;
    if (elements.statCountries)
      elements.statCountries.textContent = countries.size;
    if (elements.proxyCount)
      elements.proxyCount.textContent =
        servers.length +
        " \u0633\u0631\u0648\u0631 (" +
        uniqueIPs.size +
        " IP)";

    if (json.timestamp && elements.statLastUpdate) {
      var d = new Date(json.timestamp);
      elements.statLastUpdate.textContent = d.toLocaleDateString("fa-IR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  } catch (error) {
    console.error("loadStats error:", error);
    if (elements.proxyCount)
      elements.proxyCount.textContent =
        "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC";
  }
}

// Test all servers with async chunking
async function testAllServers() {
  if (!elements.btnTestAll) return;
  elements.btnTestAll.disabled = true;
  elements.btnTestAll.textContent =
    "\u062F\u0631 \u062D\u0627\u0644 \u062A\u0633\u062A...";
  if (elements.testProgress) elements.testProgress.style.display = "block";
  if (elements.serverResults) elements.serverResults.style.display = "block";
  if (elements.resultsList) elements.resultsList.innerHTML = "";

  try {
    var resp = await fetch(PROXY_SOURCE);
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    var json = await resp.json();
    var proxies = json.proxies || [];

    var proxyMap = new Map();
    for (var i = 0; i < proxies.length; i++) {
      var p = proxies[i];
      var k = p.ip + ":" + p.port;
      if (!proxyMap.has(k) || p.time_ms < proxyMap.get(k).time_ms)
        proxyMap.set(k, p);
    }

    var servers = Array.from(proxyMap.values()).slice(0, 20);
    var results = [];

    // Test in chunks of 3 to prevent UI freeze
    var CHUNK = 3;
    for (var c = 0; c < servers.length; c += CHUNK) {
      var batch = servers.slice(c, c + CHUNK);
      var batchPromises = batch.map(async function (s) {
        var ping = await testPing(s.ip, s.port);
        return {
          ip: s.ip,
          port: s.port,
          ping: ping,
          working: ping > 0,
          jsonPing: Math.round(s.time_ms),
        };
      });
      var batchResults = await Promise.all(batchPromises);
      results = results.concat(batchResults);

      // Update progress
      var progress = Math.min(((c + CHUNK) / servers.length) * 100, 100);
      if (elements.progressFill)
        elements.progressFill.style.width = progress + "%";
      var lastTested = results[results.length - 1];
      if (elements.progressText)
        elements.progressText.textContent =
          "تست " +
          Math.min(c + CHUNK, servers.length) +
          "/" +
          servers.length +
          ": " +
          (lastTested ? lastTested.ip : "");

      await yieldToMain();
    }

    // Sort results
    results.sort(function (a, b) {
      if (a.working && !b.working) return -1;
      if (!a.working && b.working) return 1;
      return a.ping - b.ping;
    });

    // Render results
    if (elements.resultsList) {
      var htmlParts = [];
      for (var r = 0; r < results.length; r++) {
        var res = results[r];
        var pc = !res.working
          ? "ping-bad"
          : res.ping < 200
            ? "ping-good"
            : res.ping < 500
              ? "ping-medium"
              : "ping-bad";
        var st = res.working ? "\u2713" : "\u2717";
        htmlParts.push(
          '<div class="result-item">' +
            '<span class="result-status ' +
            pc +
            '">' +
            st +
            "</span>" +
            '<span class="result-ip">' +
            res.ip +
            ":" +
            res.port +
            "</span>" +
            '<span class="result-ping">' +
            (res.working
              ? res.ping + "ms"
              : "\u0646\u0627\u0645\u0648\u0641\u0642") +
            "</span>" +
            '<span class="result-json">' +
            res.jsonPing +
            "ms (JSON)</span>" +
            "</div>",
        );
      }
      elements.resultsList.innerHTML = htmlParts.join("");
    }

    var workingCount = results.filter(function (r) {
      return r.working;
    }).length;
    if (elements.progressText)
      elements.progressText.textContent =
        "\u062A\u0633\u062A \u06A9\u0627\u0645\u0644 \u0634\u062F! " +
        workingCount +
        "/" +
        results.length +
        " \u0633\u0631\u0648\u0631 \u0641\u0639\u0627\u0644";
  } catch (error) {
    console.error("testAllServers error:", error);
    if (elements.progressText)
      elements.progressText.textContent =
        "\u062E\u0637\u0627 \u062F\u0631 \u062A\u0633\u062A: " +
        (error.message || String(error));
  }

  elements.btnTestAll.disabled = false;
  elements.btnTestAll.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> \u062A\u0633\u062A \u062A\u0645\u0627\u0645 \u0633\u0631\u0648\u0631\u0647\u0627';
}

async function testPing(ip, port, timeout) {
  timeout = timeout || 3000;
  try {
    var start = performance.now();
    var controller = new AbortController();
    var timer = setTimeout(function () {
      try {
        controller.abort();
      } catch (_) {}
    }, timeout);
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

function setupEventListeners() {
  try {
    if (elements.autoConnect)
      elements.autoConnect.addEventListener("change", saveSettings);
    if (elements.killSwitch)
      elements.killSwitch.addEventListener("change", saveSettings);
    if (elements.autoPing)
      elements.autoPing.addEventListener("change", saveSettings);
    if (elements.workingOnly)
      elements.workingOnly.addEventListener("change", saveSettings);
    if (elements.autoSelect)
      elements.autoSelect.addEventListener("change", saveSettings);

    if (elements.timeout) {
      elements.timeout.addEventListener("input", function (e) {
        try {
          if (elements.timeoutValue)
            elements.timeoutValue.textContent =
              e.target.value + " \u062B\u0627\u0646\u06CC\u0647";
          saveSettings();
        } catch (e2) {
          console.error("timeout input error:", e2);
        }
      });
    }

    if (elements.maxPing) {
      elements.maxPing.addEventListener("input", function (e) {
        try {
          if (elements.maxPingValue)
            elements.maxPingValue.textContent = e.target.value + "ms";
          saveSettings();
        } catch (e2) {
          console.error("maxPing input error:", e2);
        }
      });
    }

    if (elements.dnsOptions) {
      elements.dnsOptions.forEach(function (opt) {
        opt.addEventListener("change", saveSettings);
      });
    }

    if (elements.btnTestAll) {
      elements.btnTestAll.addEventListener("click", function () {
        testAllServers().catch(function (e) {
          console.error("testAllServers click error:", e);
        });
      });
    }

    if (elements.btnUpdate) {
      elements.btnUpdate.addEventListener("click", async function () {
        try {
          elements.btnUpdate.disabled = true;
          elements.btnUpdate.textContent =
            "\u062F\u0631 \u062D\u0627\u0644 \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC...";
          if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ type: "FORCE_UPDATE" }, function () {
              if (chrome.runtime.lastError) {
                /* ignore */
              }
            });
          }
          await loadStats();
          if (elements.proxyCount)
            elements.proxyCount.textContent =
              "\u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F \u2705";
        } catch (error) {
          console.error("btnUpdate error:", error);
          if (elements.proxyCount)
            elements.proxyCount.textContent =
              "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u274C";
        }
        setTimeout(function () {
          try {
            elements.btnUpdate.disabled = false;
            elements.btnUpdate.innerHTML =
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0644\u06CC\u0633\u062A';
          } catch (e) {}
        }, 2000);
      });
    }

    if (elements.btnExport) {
      elements.btnExport.addEventListener("click", async function () {
        try {
          var resp = await fetch(PROXY_SOURCE);
          var text = await resp.text();
          var blob = new Blob([text], { type: "application/json" });
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = "best_proxies.json";
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Export failed:", error);
        }
      });
    }

    if (elements.btnReset) {
      elements.btnReset.addEventListener("click", async function () {
        try {
          if (
            !confirm(
              "\u0622\u06CC\u0627 \u0645\u0637\u0645\u0626\u0646 \u0647\u0633\u062A\u06CC\u062F? \u062A\u0645\u0627\u0645 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0628\u0627\u0632\u0646\u0634\u0627\u0646\u06CC \u0645\u064D\u0634\u0648\u062F.",
            )
          )
            return;
          var defaultSettings = {
            autoConnect: false,
            killSwitch: false,
            autoPing: true,
            workingOnly: true,
            autoSelect: true,
            timeout: 5,
            maxPing: 1000,
            dns: "default",
          };
          if (chrome && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ settings: defaultSettings });
          } else {
            localStorage.setItem(
              "vpnSettings",
              JSON.stringify(defaultSettings),
            );
          }
          await loadSettings();
          alert(
            "\u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0628\u0627\u0632\u0646\u0634\u0627\u0646\u06CC \u0634\u062F!",
          );
        } catch (e) {
          console.error("btnReset error:", e);
        }
      });
    }
  } catch (e) {
    console.error("setupEventListeners error:", e);
  }
}
