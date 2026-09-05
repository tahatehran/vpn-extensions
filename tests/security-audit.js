#!/usr/bin/env node

/* ============================================
   Security Audit Script
   Run with: npm run security-audit
   ============================================ */

const fs = require("fs");
const path = require("path");

const JS_FILES = [
  "vpn-extension/popup.js",
  "vpn-extension/background.js",
  "vpn-extension/options.js",
];

const HTML_FILES = [
  "vpn-extension/popup.html",
  "vpn-extension/options.html",
];

const MANIFEST = "vpn-extension/manifest.json";

let errors = 0;
let warnings = 0;

function check(pattern, file, msg, isError = true) {
  if (pattern.test(file)) {
    if (isError) {
      console.error(`❌ ${msg}`);
      errors++;
    } else {
      console.warn(`⚠️  ${msg}`);
      warnings++;
    }
  }
}

function checkAll() {
  console.log("🔍 Security Audit for MOVTI VPN Shield\n");

  // 1. Check JS files
  for (const relPath of JS_FILES) {
    const fullPath = path.resolve(__dirname, "..", relPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${relPath}`);
      errors++;
      continue;
    }
    const code = fs.readFileSync(fullPath, "utf-8");
    const lines = code.split("\n");

    // Dangerous patterns
    check(/eval\(/, code, `${relPath}: uses eval()`);
    check(/new Function\(/, code, `${relPath}: uses new Function()`);
    check(/document\.write\(/, code, `${relPath}: uses document.write()`);

    // Hardcoded secrets patterns
    const secretPatterns = [
      /api_key\s*=\s*["'][^"']+["']/i,
      /apikey\s*=\s*["'][^"']+["']/i,
      /secret\s*=\s*["'][^"']+["']/i,
      /password\s*=\s*["'][^"']+["']/i,
      /token\s*=\s*["'][^"']+["']/i,
      /BEGIN.*PRIVATE KEY/,
      /sk-[a-zA-Z0-9]{20,}/,
      /ghp_[a-zA-Z0-9]{36}/,
      /AKIA[A-Z0-9]{16}/,
    ];
    for (const pat of secretPatterns) {
      check(pat, code, `${relPath}: possible hardcoded secret (${pat.source})`);
    }

    // Tracking
    const trackingPatterns = [
      "google-analytics",
      "gtag(",
      "ga(",
      "_gaq",
      "fbq(",
      "mixpanel.",
      "amplitude.",
      "segment.",
      "hotjar",
      "track(",
    ];
    for (const pat of trackingPatterns) {
      if (code.includes(pat)) {
        console.error(`❌ ${relPath}: possible tracking (${pat})`);
        errors++;
      }
    }

    // HTTP URLs
    const httpUrls = code.match(/http:\/\/[^\s"']+/g);
    if (httpUrls) {
      for (const url of httpUrls) {
        check(/./, url, `${relPath}: HTTP URL found: ${url}`);
      }
    }

    // console.log for debugging (warning)
    const consoleLogs = lines.filter(
      (l) => l.includes("console.log") && !l.trim().startsWith("//")
    );
    if (consoleLogs.length > 10) {
      console.warn(
        `⚠️  ${relPath}: ${consoleLogs.length} console.log statements (consider removing for production)`
      );
      warnings++;
    }
  }

  // 2. Check HTML files for inline scripts/handlers
  for (const relPath of HTML_FILES) {
    const fullPath = path.resolve(__dirname, "..", relPath);
    if (!fs.existsSync(fullPath)) continue;
    const html = fs.readFileSync(fullPath, "utf-8");

    // Inline scripts
    const inlineScripts = html.match(/<script(?![^>]*\ssrc=)[^>]*>/gi);
    if (inlineScripts) {
      const dangerous = inlineScripts.filter(
        (m) => !m.includes("src=") && m !== "<script>"
      );
      if (dangerous.length > 0) {
        console.error(`❌ ${relPath}: ${dangerous.length} inline script(s)`);
        errors++;
      }
    }

    // Inline event handlers
    const handlers = html.match(/\bon\w+\s*=\s*["'][^"']*["']/gi);
    if (handlers) {
      console.error(
        `❌ ${relPath}: ${handlers.length} inline event handler(s)`
      );
      errors++;
    }

    // HTTP URLs in HTML
    const httpUrls = html.match(/http:\/\/[^\s"']+/g);
    if (httpUrls) {
      for (const url of httpUrls) {
        check(/./, url, `${relPath}: HTTP URL found: ${url}`);
      }
    }
  }

  // 3. Check manifest.json
  const manifestPath = path.resolve(__dirname, "..", MANIFEST);
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    // Host permissions must be HTTPS
    if (manifest.host_permissions) {
      for (const perm of manifest.host_permissions) {
        if (perm.startsWith("http://") && !perm.startsWith("https://")) {
          check(/./, perm, `Manifest: non-HTTPS host_permission: ${perm}`);
        }
        if (perm === "<all_urls>") {
          check(/./, perm, `Manifest: <all_urls> used (review required)`);
        }
      }
    }

    // Permissions
    if (manifest.permissions) {
      const dangerous = [
        "debugger",
        "nativeMessaging",
        "webRequestBlocking",
        "cookies",
        "webRequest",
      ];
      for (const perm of manifest.permissions) {
        if (dangerous.includes(perm)) {
          check(/./, perm, `Manifest: dangerous permission: ${perm}`);
        }
      }
    }

    // CSP
    if (!manifest.content_security_policy) {
      check(/./, "", `Manifest: missing content_security_policy`);
    } else {
      const csp = manifest.content_security_policy.extension_pages || "";
      if (csp.includes("'unsafe-inline'")) {
        check(/./, "", `Manifest: CSP allows 'unsafe-inline'`);
      }
    }

    // Privacy policy
    if (!manifest.privacy_policy_url) {
      check(/./, "", `Manifest: missing privacy_policy_url`, false);
    } else if (!manifest.privacy_policy_url.startsWith("https://")) {
      check(/./, "", `Manifest: privacy_policy_url must be HTTPS`);
    }

    // Homepage
    if (!manifest.homepage_url) {
      check(/./, "", `Manifest: missing homepage_url`, false);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  if (errors > 0) {
    console.log(`\n❌ ${errors} error(s), ${warnings} warning(s)`);
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`\n✅ Passed (${warnings} warning(s))`);
    process.exit(0);
  } else {
    console.log("\n✅ Security audit passed - no issues found");
    process.exit(0);
  }
}

checkAll();