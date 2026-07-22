/* ============================================
   Options Main - Entry point for options page
   Wires all options modules together
   ============================================ */

import {
  loadSettings,
  saveSettings,
  resetSettings,
} from "./settings.js";
import { loadStats } from "./stats.js";
import { testAllServers } from "./tester.js";

// ── DOM Elements ──
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
    elements.dnsOptions = document.querySelectorAll(
      'input[name="dns"]'
    );
    elements.statTotal = document.getElementById("stat-total");
    elements.statWorking = document.getElementById("stat-working");
    elements.statCountries = document.getElementById(
      "stat-countries"
    );
    elements.statLastUpdate = document.getElementById(
      "stat-last-update"
    );
    elements.testProgress = document.getElementById(
      "test-progress"
    );
    elements.progressFill = document.getElementById("progress-fill");
    elements.progressText = document.getElementById(
      "progress-text"
    );
    elements.serverResults = document.getElementById(
      "server-results"
    );
    elements.resultsList = document.getElementById("results-list");
  } catch (e) {
    console.error("initDOM error:", e);
  }
}

// ── Event Listeners ──
function setupEventListeners() {
  try {
    if (elements.autoConnect)
      elements.autoConnect.addEventListener(
        "change",
        saveSettings
      );
    if (elements.killSwitch)
      elements.killSwitch.addEventListener(
        "change",
        saveSettings
      );
    if (elements.autoPing)
      elements.autoPing.addEventListener("change", saveSettings);
    if (elements.workingOnly)
      elements.workingOnly.addEventListener(
        "change",
        saveSettings
      );
    if (elements.autoSelect)
      elements.autoSelect.addEventListener(
        "change",
        saveSettings
      );

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
            elements.maxPingValue.textContent =
              e.target.value + "ms";
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
        testAllServers(elements).catch(function (e) {
          console.error("testAllServers error:", e);
        });
      });
    }

    if (elements.btnUpdate) {
      elements.btnUpdate.addEventListener(
        "click",
        async function () {
          try {
            elements.btnUpdate.disabled = true;
            elements.btnUpdate.textContent =
              "\u062F\u0631 \u062D\u0627\u0644 \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC...";
            if (
              chrome &&
              chrome.runtime &&
              chrome.runtime.sendMessage
            ) {
              chrome.runtime.sendMessage(
                { type: "FORCE_UPDATE" },
                function () {
                  if (chrome.runtime.lastError) {
                    /* ignore */
                  }
                }
              );
            }
            await loadStats(elements);
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
        }
      );
    }

    if (elements.btnExport) {
      elements.btnExport.addEventListener(
        "click",
        async function () {
          try {
            var { PROXY_SOURCE } = await import(
              "../shared/config.js"
            );
            var resp = await fetch(PROXY_SOURCE);
            var text = await resp.text();
            var blob = new Blob([text], {
              type: "application/json",
            });
            var url = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = url;
            a.download = "best_proxies.json";
            a.click();
            URL.revokeObjectURL(url);
          } catch (error) {
            console.error("Export failed:", error);
          }
        }
      );
    }

    if (elements.btnReset) {
      elements.btnReset.addEventListener(
        "click",
        async function () {
          try {
            if (
              !confirm(
                "\u0622\u06CC\u0627 \u0645\u0637\u0645\u0626\u0646 \u0647\u0633\u062A\u06CC\u062F? \u062A\u0645\u0627\u0645 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0628\u0627\u0632\u0646\u0634\u0627\u0646\u06CC \u0645\u064D\u0634\u0648\u062F."
              )
            )
              return;
            await resetSettings();
            alert(
              "\u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0628\u0627\u0632\u0646\u0634\u0627\u0646\u06CC \u0634\u062F!"
            );
          } catch (e) {
            console.error("btnReset error:", e);
          }
        }
      );
    }
  } catch (e) {
    console.error("setupEventListeners error:", e);
  }
}

// ── Bootstrap ──
document.addEventListener("DOMContentLoaded", async function () {
  try {
    initDOM();
    // Pass elements to settings module
    var settingsMod = await import("./settings.js");
    settingsMod.setElements(elements);
    await loadSettings();
    await loadStats(elements);
    setupEventListeners();
  } catch (e) {
    console.error("DOMContentLoaded error:", e);
  }
});
