/* ============================================
   Options Settings - Load / Save settings
   ============================================ */

// DOM element references (populated in main.js)
var elements = {};

/**
 * Initialize with DOM elements reference.
 * @param {Object} els - elements object from main.js
 */
export function setElements(els) {
  elements = els;
}

/**
 * Load settings from storage and apply to DOM.
 * @returns {Promise<void>}
 */
export async function loadSettings() {
  return new Promise(function (resolve) {
    try {
      var apply = function (settings) {
        if (!settings) settings = {};
        try {
          if (elements.autoConnect)
            elements.autoConnect.checked =
              settings.autoConnect || false;
          if (elements.killSwitch)
            elements.killSwitch.checked =
              settings.killSwitch || false;
          if (elements.autoPing)
            elements.autoPing.checked =
              settings.autoPing !== undefined
                ? settings.autoPing
                : true;
          if (elements.workingOnly)
            elements.workingOnly.checked =
              settings.workingOnly !== undefined
                ? settings.workingOnly
                : true;
          if (elements.autoSelect)
            elements.autoSelect.checked =
              settings.autoSelect !== undefined
                ? settings.autoSelect
                : true;
          if (elements.timeout)
            elements.timeout.value = settings.timeout || 5;
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

/**
 * Save current DOM settings to storage.
 */
export async function saveSettings() {
  try {
    var settings = {
      autoConnect: elements.autoConnect
        ? elements.autoConnect.checked
        : false,
      killSwitch: elements.killSwitch
        ? elements.killSwitch.checked
        : false,
      autoPing: elements.autoPing
        ? elements.autoPing.checked
        : true,
      workingOnly: elements.workingOnly
        ? elements.workingOnly.checked
        : true,
      autoSelect: elements.autoSelect
        ? elements.autoSelect.checked
        : true,
      timeout: elements.timeout
        ? parseInt(elements.timeout.value)
        : 5,
      maxPing: elements.maxPing
        ? parseInt(elements.maxPing.value)
        : 1000,
      dns: document.querySelector('input[name="dns"]:checked')
        ? document.querySelector('input[name="dns"]:checked')
            .value
        : "default",
    };
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ settings: settings });
    } else {
      localStorage.setItem(
        "vpnSettings",
        JSON.stringify(settings)
      );
    }
  } catch (e) {
    console.error("saveSettings error:", e);
  }
}

/**
 * Reset settings to defaults.
 */
export async function resetSettings() {
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
      JSON.stringify(defaultSettings)
    );
  }
  await loadSettings();
}
