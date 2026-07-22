/* ============================================
   Options Tester - Test all servers
   Async chunking to prevent UI freeze
   ============================================ */

import { PROXY_SOURCE } from "../shared/config.js";
import { yieldToMain } from "../shared/utils.js";

/**
 * Test ping to a single server.
 * @param {string} ip
 * @param {number} port
 * @param {number} timeout
 * @returns {Promise<number>}
 */
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

/**
 * Test all servers with progress updates.
 * Uses async chunking of 3 to prevent UI freeze.
 * @param {Object} elements - DOM elements reference
 * @returns {Promise<void>}
 */
export async function testAllServers(elements) {
  if (!elements.btnTestAll) return;
  elements.btnTestAll.disabled = true;
  elements.btnTestAll.textContent =
    "\u062F\u0631 \u062D\u0627\u0644 \u062A\u0633\u062A...";
  if (elements.testProgress)
    elements.testProgress.style.display = "block";
  if (elements.serverResults)
    elements.serverResults.style.display = "block";
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

    // Test in chunks of 3
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
      var progress = Math.min(
        ((c + CHUNK) / servers.length) * 100,
        100
      );
      if (elements.progressFill)
        elements.progressFill.style.width = progress + "%";
      var lastTested = results[results.length - 1];
      if (elements.progressText)
        elements.progressText.textContent =
          "\u062A\u0633\u062A " +
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
            "</div>"
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
