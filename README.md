# MOVTI VPN Shield

[![CI](https://github.com/tahatehran/vpn-extensions/actions/workflows/ci.yml/badge.svg)](https://github.com/tahatehran/vpn-extensions/actions/workflows/ci.yml)
[![Security](https://img.shields.io/badge/security-audit-passing-brightgreen)](https://github.com/tahatehran/vpn-extensions/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**MOVTI VPN Shield** is a lightweight, privacy-focused browser extension that routes your traffic through a configurable HTTP proxy with real-time ping measurement. No accounts, no logs, no tracking.

> **Status**: Updated for Chrome Web Store certification (v1.0.3)

---

## Features

- **One-click connect** – Pick a server or auto-connect to the fastest
- **Real ping** – Measures actual RTT via `fetch` HEAD requests (no fake stats)
- **Kill switch** – Blocks all traffic if VPN tunnel drops
- **Auto-refresh** – Server list updates daily from public CDN
- **HTTPS-only** – All external requests use HTTPS (enforced by CSP)
- **Minimal permissions** – Only `proxy`, `storage`, `alarms` + specific host permissions
- **No tracking** – Zero analytics, zero telemetry, zero external scripts

---

## Quick Start

### Install from Source (Developer Mode)

```bash
git clone https://github.com/tahatehran/vpn-extensions.git
cd vpn-extensions

# Install test dependencies
npm ci

# Run tests
npm test

# Build CRX package
npm run build
```

Then load `vpn-extension/` as an unpacked extension in Chrome/Edge:
1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `vpn-extension/` folder

---

## Available Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run Jest test suite (manifest, security, unit) |
| `npm run lint` | ESLint check on extension JS files |
| `npm run validate-manifest` | Validate manifest.json against Chrome Store rules |
| `npm run security-audit` | Full security scan (secrets, tracking, HTTP URLs, CSP) |
| `npm run build` | Build `.crx` package via `build-crx.sh` |

---

## Chrome Web Store Certification Checklist

### Pre-submission (must pass all)

- [ ] **Manifest V3** – `manifest_version: 3`, `background.service_worker`, `action` (not `browser_action`)
- [ ] **Single Purpose** – Description < 132 chars, clearly states "VPN proxy"
- [ ] **Minimal Permissions** – No `tabs`, `activeTab`, `cookies`, `webRequest`, `debugger`
- [ ] **HTTPS-only host_permissions** – No `http://`, no `<all_urls>`
- [ ] **Content Security Policy** – Explicit `content_security_policy.extension_pages`
- [ ] **Privacy Policy URL** – HTTPS, matches actual data practices
- [ ] **Homepage URL** – HTTPS landing page with support contact
- [ ] **Author field** – Name + email in manifest
- [ ] **No inline scripts/handlers** – All JS in external files
- [ ] **No eval/Function/document.write** – Security audit passes
- [ ] **No hardcoded secrets** – API keys, tokens, private keys absent
- [ ] **No tracking code** – No GA, Mixpanel, Facebook Pixel, etc.
- [ ] **Kill switch implemented** – Not just a UI toggle
- [ ] **No fake functionality** – Stats are real or hidden (no `Math.random()` speed)
- [ ] **Options page** – Uses `options_ui` (V3), not deprecated `options_page`
- [ ] **Icons exist** – 16, 48, 128 PNG files referenced correctly
- [ ] **Test suite passes** – `npm test` exits 0
- [ ] **Security audit passes** – `npm run security-audit` exits 0

### Store Listing Requirements

- [ ] **Screenshots** – 1280×800 (min 1, max 5), show actual UI
- [ ] **Promo tile** – 440×280 (optional but recommended)
- [ ] **Detailed description** – Explains what data is accessed and why
- [ ] **Support link** – GitHub Issues or email in store listing
- [ ] **Single category** – Productivity (or Developer Tools)

---

## Project Structure

```
vpn-extensions/
├── .github/
│   └── workflows/ci.yml          # CI: lint, test, security, build
├── tests/
│   ├── helpers.js                # Shared test utilities
│   ├── setup.js                  # Jest mocks (chrome APIs, DOM, fetch)
│   ├── validate-manifest.js      # Standalone manifest validator
│   ├── security-audit.js         # Security scanner (run via npm)
│   ├── manifest.test.js          # Manifest V3 compliance tests
│   ├── security.test.js          # Security pattern tests
│   ├── background.test.js        # Background SW function tests
│   ├── popup.test.js             # Popup UI/logic tests
│   └── options.test.js           # Options page tests
├── vpn-extension/
│   ├── manifest.json             # MV3 manifest (CSP, permissions, etc.)
│   ├── background.js             # Service worker (proxy, kill switch, alarms)
│   ├── popup.html / .js / .css   # Main UI (connect, server list, stats)
│   ├── options.html / .js / .css # Settings (kill switch, geo, DNS, test)
│   ├── icons/                    # 16/48/128 PNG icons
│   └── README.md
├── build-crx.sh                  # CRX/ZIP builder
├── package.json                  # npm scripts, jest, eslint config
└── LICENSE
```

---

## Architecture

### Background Service Worker (`background.js`)

- **Proxy management** – `chrome.proxy.settings.set` with error handling
- **Kill switch watchdog** – Runs every minute via `chrome.alarms`; verifies tunnel via `api.myip.com`
- **Auto-refresh** – Daily alarm fetches fresh proxy list from CDN
- **Message bus** – Handles `GET_STATUS`, `SET_PROXY`, `REMOVE_PROXY`, `VERIFY_CONNECTION`, `AUTO_CONNECT`, `FORCE_UPDATE`, `SAVE_SETTINGS`
- **Input validation** – `sanitizeServer()`, `isPrivateHost()`, `sanitizeSettings()`

### Popup (`popup.js` / `popup.html`)

- Server list with country flags (via `ipinfo.io` + `ip-api.com` fallback)
- Real ping test (HEAD request via proxy, `no-cors` mode)
- Connection state synced with background via messages
- Stats show **only real ping**; speed/up/down hidden (no fake data)

### Options (`options.js` / `options.html`)

- Kill switch toggle (persists to background)
- Geo provider selector (ipinfo.io / ip-api.com)
- DNS selector (UI only – documented as informational)
- Server test suite (tests top 20, shows real ping vs reported)

---

## Security Model

| Layer | Implementation |
|-------|----------------|
| **Network** | All external fetches use HTTPS; `isPrivateHost()` blocks RFC1918/loopback |
| **Input** | `sanitizeServer()` validates IP format, port range, deduplicates by IP:PORT |
| **CSP** | `script-src 'self'`, `connect-src` allowlisted to 4 HTTPS endpoints |
| **Permissions** | Only `proxy`, `storage`, `alarms` + 4 specific HTTPS host patterns |
| **Messages** | Background validates every message type and payload |
| **Proxy errors** | `chrome.proxy.onError` triggers kill-switch if enabled |

---

## Testing

```bash
# Full test suite
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Security only
npm run security-audit

# Manifest only
npm run validate-manifest
```

### Test Categories

| File | Focus |
|------|-------|
| `manifest.test.js` | MV3 structure, permissions, CSP, icons, store requirements |
| `security.test.js` | No secrets, no tracking, no dangerous patterns, HTTPS enforcement |
| `background.test.js` | Functions, alarms, kill-switch, message handling, validation |
| `popup.test.js` | Functions, state, ping logic, flag conversion, needsRefresh |
| `options.test.js` | Settings, server testing, UI handlers, security |

---

## Building for Release

```bash
# Build CRX for Chrome/Edge (requires build-crx.sh + pem key)
npm run build

# Output: movti-vpn-shield-v1.0.3.crx
```

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every PR and tag:
- **PR**: lint → validate-manifest → test → security-audit
- **main**: same + build CRX artifact
- **tag `v*`**: same + create GitHub Release with CRX

---

## Privacy

MOVTI VPN Shield **does not collect any personal data**.

- **No accounts**, **no login**, **no telemetry**
- **No analytics** (Google Analytics, Mixpanel, etc.)
- **Proxy list** fetched from public CDN (`cdn.jsdelivr.net`)
- **IP verification** uses `api.myip.com` (returns your exit IP only)
- **Geo lookup** uses `ipinfo.io` / `ip-api.com` (server IP only)
- All settings stored locally via `chrome.storage.local`

See [Privacy Policy](https://tahatehran.github.io/vpn-extensions/privacy) for details.

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Run `npm test` and `npm run security-audit` – **must pass**
4. Open a PR with clear description
5. CI must pass (GitHub Actions)

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT License – see [LICENSE](LICENSE) for details.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/tahatehran/vpn-extensions/issues)
- **Email**: support@movtigroup.com
- **Website**: [https://tahatehran.github.io/vpn-extensions/](https://tahatehran.github.io/vpn-extensions/)

---

**Version**: 1.0.3 | **Updated**: 2026-09-04