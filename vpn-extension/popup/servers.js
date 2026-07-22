/* ============================================
   Popup Servers - Fetch, render, select servers
   Uses async chunking + Map dedup
   ============================================ */

import { PROXY_SOURCE, CHUNK_SIZE, PING_TEST_COUNT } from "../shared/config.js";
import { yieldToMain } from "../shared/utils.js";
import { detectCountry } from "../shared/geo.js";
import { testPing } from "../shared/network.js";
import { state, saveState, needsRefresh } from "./state.js";
import { el } from "./dom.js";
import {
  showStatus,
  showLoading,
  showEmptyState,
  updateServerCount,
} from "./ui.js";

/**
 * Fetch servers from proxy source with dedup and ping testing.
 * Uses async chunking to prevent UI freeze.
 * @param {boolean} force - Force refresh even if cached
 */
export async function fetchServers(force) {
  if (state.connected) {
    if (state.servers.length > 0) {
      renderServerList();
      updateServerCount(state);
    }
    return;
  }

  if (!force && state.servers.length > 0 && !needsRefresh()) {
    renderServerList();
    updateServerCount(state);
    return;
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
      if (!proxyMap.has(k) || p.time_ms < proxyMap.get(k).time_ms) {
        proxyMap.set(k, p);
      }
    }
    await yieldToMain();

    // Build server list
    var idx = 0;
    state.servers = [];
    proxyMap.forEach(function (proxy) {
      state.servers.push({
        id: idx++,
        ip: proxy.ip,
        port: proxy.port,
        jsonPing: Math.round(proxy.time_ms),
        ping: Math.round(proxy.time_ms),
        country: null,
        name: "\u0633\u0631\u0648\u0631",
        status: proxy.status,
        working: false,
      });
    });

    // Detect countries in chunks
    var seen = new Map();
    for (var k2 = 0; k2 < state.servers.length; k2++) {
      if (!seen.has(state.servers[k2].ip)) seen.set(state.servers[k2].ip, true);
    }
    var uniqueIPs = Array.from(seen.keys());
    showStatus(
      "\u062A\u0634\u062E\u06CC\u0635 \u06A9\u0634\u0648\u0631 " +
        uniqueIPs.length +
        " \u0633\u0631\u0648\u0631...",
    );

    for (var b = 0; b < uniqueIPs.length; b += CHUNK_SIZE) {
      var chunk = uniqueIPs.slice(b, b + CHUNK_SIZE);
      var results = await Promise.all(
        chunk.map(function (ip) {
          return detectCountry(ip);
        }),
      );
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
    showStatus(
      "\u062A\u0633\u062A \u067E\u06CC\u0646\u06AF \u0648\u0627\u0642\u0639\u06CC...",
    );
    var toTest = state.servers.slice(0, PING_TEST_COUNT);
    for (var t = 0; t < toTest.length; t++) {
      var srv = toTest[t];
      showStatus(
        "\u062A\u0633\u062A " + (t + 1) + "/" + toTest.length + ": " + srv.ip,
      );
      var realPing = await testPing(srv.ip, srv.port, 2500);
      if (realPing > 0) {
        srv.ping = realPing;
        srv.working = true;
      } else {
        srv.ping = srv.jsonPing;
        srv.working = false;
      }
      await yieldToMain();
    }

    // Remaining servers: assume working from JSON
    for (var m = PING_TEST_COUNT; m < state.servers.length; m++) {
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
    updateServerCount(state);
  } catch (err) {
    console.error("fetchServers error:", err);
    if (state.servers.length > 0) {
      renderServerList();
      updateServerCount(state);
    } else {
      showEmptyState(
        "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC \u0633\u0631\u0648\u0631\u0647\u0627",
      );
    }
  }
  showLoading(false);
}

/**
 * Render the server list with optional filter.
 * @param {string} [filter] - Search filter text
 */
export function renderServerList(filter) {
  try {
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
      showEmptyState(
        "\u0633\u0631\u0648\u0631\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F",
      );
      return;
    }

    var parts = [];
    var limit = Math.min(filtered.length, 50);
    for (var i = 0; i < limit; i++) {
      var server = filtered[i];
      var c = server.country || {
        flag: "\uD83C\uDF10",
        name: "\u0633\u0631\u0648\u0631",
      };
      var sel = state.selectedServer && state.selectedServer.id === server.id;
      var pv = server.ping;
      var pc = !server.working
        ? "ping-bad"
        : pv < 200
          ? "ping-good"
          : pv < 500
            ? "ping-medium"
            : "ping-bad";
      var si = server.working ? "\u2713" : "\u2717";
      var ec = server.working ? "" : " server-down";
      parts.push(
        '<div class="server-item ' +
          (sel ? "selected " : "") +
          ec +
          '" data-id="' +
          server.id +
          '">' +
          '<div class="server-flag">' +
          c.flag +
          "</div>" +
          '<div class="server-info"><div class="server-name">' +
          c.name +
          " " +
          si +
          "</div>" +
          '<div class="server-ip">' +
          server.ip +
          ":" +
          server.port +
          "</div></div>" +
          '<div class="server-ping"><span class="ping-dot ' +
          pc +
          '"></span><span>' +
          (server.working
            ? pv + "ms"
            : "\u0646\u0627\u0645\u0648\u0641\u0642") +
          "</span></div></div>",
      );
    }
    list.innerHTML = parts.join("");

    var items = list.querySelectorAll(".server-item");
    for (var j = 0; j < items.length; j++) {
      items[j].addEventListener("click", function () {
        try {
          selectServer(parseInt(this.dataset.id));
        } catch (e) {}
      });
    }
  } catch (e) {
    console.error("renderServerList error:", e);
  }
}

/**
 * Select a server by ID.
 * @param {number} id - Server ID
 */
export function selectServer(id) {
  try {
    state.selectedServer = state.servers.find(function (s) {
      return s.id === id;
    });
    saveState();
    renderServerList(el.searchInput.value);
    // updateUI called by main.js after this
  } catch (e) {
    console.error("selectServer error:", e);
  }
}
