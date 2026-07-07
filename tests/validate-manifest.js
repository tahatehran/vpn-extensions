#!/usr/bin/env node

/* ============================================
   Manifest Validator - Standalone Script
   Can be run directly or via npm script
   ============================================ */

const fs = require("fs");
const path = require("path");

const MANIFEST_PATH = path.resolve(__dirname, "../vpn-extension/manifest.json");
const ICONS_DIR = path.resolve(__dirname, "../vpn-extension/icons");

// Required fields per Manifest V3
const REQUIRED_FIELDS = [
  "manifest_version",
  "name",
  "version",
  "description",
];

const RECOMMENDED_FIELDS = [
  "icons",
  "action",
  "background",
];

// Permissions that may need review
const SENSITIVE_PERMISSIONS = [
  "debugger",
  "nativeMessaging",
  "webRequestBlocking",
  "cookies",
  "webRequest",
];

let errors = [];
let warnings = [];

function validate() {
  console.log("📋 Manifest Validator for MOVTI VPN Shield\n");

  // 1. Check file exists
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("❌ manifest.json not found at:", MANIFEST_PATH);
    process.exit(1);
  }

  // 2. Parse JSON
  let manifest;
  try {
    const content = fs.readFileSync(MANIFEST_PATH, "utf-8");
    manifest = JSON.parse(content);
    console.log("✅ JSON syntax is valid");
  } catch (e) {
    console.error("❌ Invalid JSON:", e.message);
    process.exit(1);
  }

  // 3. Check manifest_version
  if (manifest.manifest_version !== 3) {
    errors.push(`manifest_version must be 3, got: ${manifest.manifest_version}`);
  } else {
    console.log("✅ manifest_version = 3 (Manifest V3)");
  }

  // 4. Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!manifest[field]) {
      errors.push(`Missing required field: ${field}`);
    } else {
      console.log(`✅ Required field present: ${field}`);
    }
  }

  // 5. Check recommended fields
  for (const field of RECOMMENDED_FIELDS) {
    if (!manifest[field]) {
      warnings.push(`Missing recommended field: ${field}`);
    } else {
      console.log(`✅ Recommended field present: ${field}`);
    }
  }

  // 6. Check background configuration (Manifest V3)
  if (manifest.background) {
    if (manifest.background.service_worker) {
      console.log("✅ Uses background.service_worker (correct for V3)");
    } else if (manifest.background.scripts) {
      errors.push("Uses background.scripts - must use service_worker in V3");
    }
  }

  // 7. Check action vs browser_action
  if (manifest.browser_action) {
    errors.push("Uses browser_action - must use 'action' in Manifest V3");
  }
  if (manifest.action) {
    console.log("✅ Uses 'action' (correct for V3)");
  }

  // 8. Check version format
  if (manifest.version) {
    const versionParts = manifest.version.split(".");
    if (versionParts.length < 2 || versionParts.length > 4) {
      warnings.push(`Version format unusual: ${manifest.version} (expected x.y.z or x.y.z.w)`);
    } else {
      console.log(`✅ Version format: ${manifest.version}`);
    }
  }

  // 9. Check icons
  if (manifest.icons) {
    for (const [size, iconPath] of Object.entries(manifest.icons)) {
      const fullPath = path.resolve(__dirname, "../vpn-extension", iconPath);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        console.log(`✅ Icon ${size}x${size}: ${iconPath} (${sizeKB}KB)`);
      } else {
        errors.push(`Icon file not found: ${iconPath}`);
      }
    }
  }

  // 10. Check action icons
  if (manifest.action && manifest.action.default_icon) {
    for (const [size, iconPath] of Object.entries(manifest.action.default_icon)) {
      const fullPath = path.resolve(__dirname, "../vpn-extension", iconPath);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ Action icon ${size}: ${iconPath}`);
      } else {
        errors.push(`Action icon not found: ${iconPath}`);
      }
    }
  }

  // 11. Check permissions
  if (manifest.permissions) {
    console.log(`\n📋 Permissions (${manifest.permissions.length}):`);
    for (const perm of manifest.permissions) {
      if (SENSITIVE_PERMISSIONS.includes(perm)) {
        warnings.push(`Sensitive permission: ${perm} (review needed)`);
        console.log(`  ⚠️  ${perm} (sensitive)`);
      } else {
        console.log(`  ✅ ${perm}`);
      }
    }
  }

  // 12. Check for prohibited items
  if (manifest.web_accessible_resources) {
    warnings.push("web_accessible_resources defined - review for security");
  }

  // 13. Check options_page
  if (manifest.options_page) {
    const optionsPath = path.resolve(__dirname, "../vpn-extension", manifest.options_page);
    if (fs.existsSync(optionsPath)) {
      console.log(`✅ Options page exists: ${manifest.options_page}`);
    } else {
      warnings.push(`Options page not found: ${manifest.options_page}`);
    }
  }

  // 14. Check popup
  if (manifest.action && manifest.action.default_popup) {
    const popupPath = path.resolve(__dirname, "../vpn-extension", manifest.action.default_popup);
    if (fs.existsSync(popupPath)) {
      console.log(`✅ Popup page exists: ${manifest.action.default_popup}`);
    } else {
      warnings.push(`Popup page not found: ${manifest.action.default_popup}`);
    }
  }

  // 15. File size check
  const manifestSize = fs.statSync(MANIFEST_PATH).size;
  if (manifestSize > 100 * 1024) {
    warnings.push(`manifest.json is large: ${(manifestSize / 1024).toFixed(1)}KB`);
  }

  // Summary
  console.log("\n" + "=".repeat(50));

  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} warning(s):`);
    warnings.forEach((w) => console.log(`  ⚠️  ${w}`));
  }

  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} error(s):`);
    errors.forEach((e) => console.log(`  ❌ ${e}`));
    console.log("\n❌ Manifest validation FAILED");
    process.exit(1);
  } else {
    console.log("\n✅ Manifest validation PASSED");
    if (warnings.length > 0) {
      console.log(`   (${warnings.length} warnings to review)`);
    }
    process.exit(0);
  }
}

validate();
