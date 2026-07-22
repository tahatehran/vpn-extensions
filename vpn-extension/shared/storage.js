/* ============================================
   Shared Storage - Chrome Storage wrappers
   Safe wrappers with fallback to localStorage
   ============================================ */

/**
 * Safely get values from chrome.storage.local.
 * Falls back to localStorage if chrome.storage is unavailable.
 * @param {string[]} keys - Keys to retrieve
 * @returns {Promise<Object>}
 */
export function safeStorageGet(keys) {
  return new Promise(function (resolve) {
    try {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(keys, function (data) {
          resolve(data || {});
        });
      } else {
        var result = {};
        keys.forEach(function (key) {
          var val = localStorage.getItem(key);
          if (val) {
            try { result[key] = JSON.parse(val); } catch (_) {
              result[key] = val;
            }
          }
        });
        resolve(result);
      }
    } catch (e) {
      console.error("safeStorageGet error:", e);
      resolve({});
    }
  });
}

/**
 * Safely set values in chrome.storage.local.
 * Falls back to localStorage if chrome.storage is unavailable.
 * @param {Object} data - Key-value pairs to store
 */
export function safeStorageSet(data) {
  try {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(data);
    } else {
      Object.keys(data).forEach(function (key) {
        localStorage.setItem(key, JSON.stringify(data[key]));
      });
    }
  } catch (e) {
    console.error("safeStorageSet error:", e);
  }
}
