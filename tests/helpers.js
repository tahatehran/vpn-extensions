/* ============================================
   Test Helpers - Shared Utility Functions
   ============================================ */

/**
 * Load a JS file as a string for analysis
 */
function loadFileAsString(filePath) {
  const fs = require("fs");
  const path = require("path");
  const fullPath = path.resolve(__dirname, "..", filePath);
  return fs.readFileSync(fullPath, "utf-8");
}

/**
 * Load manifest.json as parsed object
 */
function loadManifest() {
  const fs = require("fs");
  const path = require("path");
  const fullPath = path.resolve(__dirname, "..", "vpn-extension/manifest.json");
  return JSON.parse(fs.readFileSync(fullPath, "utf-8"));
}

/**
 * Check if a string contains any of the given patterns
 */
function containsPatterns(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

/**
 * Check for hardcoded secrets in code
 */
function findSecrets(code) {
  const patterns = [
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

  const found = [];
  const lines = code.split("\n");
  lines.forEach((line, index) => {
    patterns.forEach((pattern) => {
      if (pattern.test(line)) {
        found.push({
          line: index + 1,
          content: line.trim(),
          pattern: pattern.source,
        });
      }
    });
  });
  return found;
}

/**
 * Check for tracking/analytics code
 */
function findTracking(code) {
  const patterns = [
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

  const lines = code.split("\n");
  const found = [];
  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;
    patterns.forEach((pattern) => {
      if (line.includes(pattern)) {
        found.push({
          line: index + 1,
          content: line.trim(),
          pattern,
        });
      }
    });
  });
  return found;
}

/**
 * Extract function names from JavaScript code
 */
function extractFunctionNames(code) {
  const fnRegex = /(?:async\s+)?function\s+(\w+)/g;
  const constRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\()/g;
  const methodsRegex = /^\s*(?:async\s+)?(\w+)\s*\(/gm;

  const functions = new Set();
  let match;

  while ((match = fnRegex.exec(code)) !== null) {
    functions.add(match[1]);
  }
  while ((match = constRegex.exec(code)) !== null) {
    functions.add(match[1]);
  }

  return Array.from(functions);
}

module.exports = {
  loadFileAsString,
  loadManifest,
  containsPatterns,
  findSecrets,
  findTracking,
  extractFunctionNames,
};
