/* ============================================
   Background Messages - Message handler
   Routes messages from popup/options
   ============================================ */

import { fetchAndUpdateProxies, isConnected } from "./proxy-manager.js";
import { safeStorageGet, safeStorageSet } from "../shared/storage.js";
import { verifyConnection } from "../shared/network.js";

/**
 * Connect to a specific server with verification.
 * @param {Object} server - Server object
 * @returns {Promise<Object>}
 */
function connectToServer(server) {
  return new Promise(function (resolve, reject) {
    try {
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
        async function () {
          try {
            await new Promise(function (r) {
              setTimeout(r, 1000);
            });
            var verification = await verifyConnection();
            if (verification.success) {
              safeStorageSet({
                connected: true,
                selectedServer: server,
              });
              resolve(verification);
            } else {
              safeStorageSet({ connected: false });
              reject(new Error("Connection verification failed"));
            }
          } catch (e) {
            safeStorageSet({ connected: false });
            reject(e);
          }
        }
      );
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Auto-connect from background.
 * @returns {Promise<Object>}
 */
async function autoConnectBackground() {
  try {
    var data = await safeStorageGet(["serverList"]);
    var servers = data.serverList || [];

    if (servers.length === 0) {
      await fetchAndUpdateProxies();
      var newData = await safeStorageGet(["serverList"]);
      var newServers = newData.serverList || [];
      if (newServers.length === 0)
        return { success: false, error: "No servers available" };
      var server = newServers[0];
      await connectToServer(server);
      return { success: true, server: server };
    }

    var workingServers = servers.filter(function (s) {
      return s.working !== false;
    });
    if (workingServers.length === 0)
      return { success: false, error: "No working servers found" };

    var fastest = workingServers[0];
    await connectToServer(fastest);
    return { success: true, server: fastest };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}

/**
 * Setup message listener for popup/options communication.
 */
export function setupMessageListener() {
  chrome.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse
  ) {
    try {
      if (!message || !message.type) return false;

      if (message.type === "GET_STATUS") {
        safeStorageGet([
          "connected",
          "selectedServer",
          "lastUpdate",
        ]).then(function (data) {
          try {
            sendResponse(data);
          } catch (e) {}
        });
        return true;
      }

      if (message.type === "FORCE_UPDATE") {
        fetchAndUpdateProxies()
          .then(function () {
            try {
              sendResponse({ success: true });
            } catch (e) {}
          })
          .catch(function () {
            try {
              sendResponse({
                success: false,
                error: "update failed",
              });
            } catch (e) {}
          });
        return true;
      }

      if (message.type === "SET_PROXY") {
        var server = message.server;
        if (!server || !server.ip || !server.port) {
          try {
            sendResponse({
              success: false,
              error: "Invalid server",
            });
          } catch (e) {}
          return false;
        }
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
            try {
              sendResponse({ success: true });
            } catch (e) {}
          }
        );
        return true;
      }

      if (message.type === "REMOVE_PROXY") {
        chrome.proxy.settings.set(
          {
            value: { mode: "direct" },
            scope: "regular",
          },
          function () {
            try {
              sendResponse({ success: true });
            } catch (e) {}
          }
        );
        return true;
      }

      if (message.type === "VERIFY_CONNECTION") {
        verifyConnection()
          .then(function (result) {
            try {
              sendResponse(result);
            } catch (e) {}
          })
          .catch(function (e) {
            try {
              sendResponse({
                success: false,
                error: e.message,
              });
            } catch (_) {}
          });
        return true;
      }

      if (message.type === "AUTO_CONNECT") {
        autoConnectBackground()
          .then(function (result) {
            try {
              sendResponse(result);
            } catch (e) {}
          })
          .catch(function (e) {
            try {
              sendResponse({
                success: false,
                error: e.message,
              });
            } catch (_) {}
          });
        return true;
      }

      return false;
    } catch (e) {
      console.error("Message handler error:", e);
      try {
        sendResponse({
          success: false,
          error: e.message,
        });
      } catch (_) {}
      return false;
    }
  });
}
