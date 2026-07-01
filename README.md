# MOVTIGROUP VPN Extension

[English](README.en.md) | [فارسی](README.fa.md) | [中文](README.zh.md)

This repository contains the main VPN browser extension for **MOVTIGROUP**. Its purpose is to showcase and document the visual design and layout of the website, representing the company's visual identity. Note that the operational code and backend logic are stored privately in a separate repository.

**GitHub Repository:** [https://github.com/movtigroup/movtigroup/](https://github.com/movtigroup/movtigroup/)

## Introduction

This extension serves as the primary visual design for the MOVTIGROUP website. The focus is on delivering a modern, clean, and responsive user experience that reflects the brand identity through its visual components.

## Features

### VPN Extension

- **Responsive Design:** Optimized for various devices including mobile, tablet, and desktop.
- **Easy Customization:** Design elements can be easily adjusted to align with the company's visual identity.
- **Bilingual Support:** Full support for Persian (RTL) and English (LTR) languages.
- **User-Friendly Documentation:** A clean and well-documented structure for quick navigation and understanding.
- **Maintainability:** Regular updates and an organized file structure ensure consistent design evolution.
- **Accessibility:** WCAG 2.1 compliant for better accessibility.

### VPN Extension

- 🔒 Secure connection with one click
- 🌍 300+ servers worldwide
- 📊 Live connection stats (ping, speed, upload, download)
- 🎨 Modern dark theme UI
- 🔄 Auto-update server list
- 🔍 Server search
- ⚙️ Advanced settings (kill switch, DNS, auto-connect)

## Project Structure

```
movtigroup/
├── .github/
│   ├── FUNDING.yml
│   └── workflows/
│       ├── jekyll-gh-pages.yml
│       ├── release.yml
│       ├── version-bump.yml
│       └── build-crx.yml
├── vpn-extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   ├── background.js
│   ├── options.html
│   ├── options.css
│   ├── options.js
│   ├── icons/
│   └── README.md
├── build-crx.sh
├── .gitignore
├── .dockerignore
├── AGENTS.md
├── CHANGELOG
├── CLAUDE.md
├── CONTRIBUTING.md
├── DESIGN.md
├── LICENSE
├── PASS.md
├── PHILOSOPHY.md
├── README.md
├── README.en.md
├── README.fa.md
└── README.zh.md
```

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- For development: Code editor (VS Code, PhpStorm, etc.)
- Node.js (for building CRX files)

### Installation & Usage

1. Clone the repository:

   ```bash
   git clone https://github.com/movtigroup/movtigroup.git
   ```

2. Navigate to the project directory:

   ```bash
   cd movtigroup
   ```

3. Open the extension folder in your browser or use a local server.

### Building CRX Files

To build CRX files for Chrome and Edge browsers:

```bash
# Make the script executable
chmod +x build-crx.sh

# Build all packages
./build-crx.sh all

# Build specific browser
./build-crx.sh chrome
./build-crx.sh edge
./build-crx.sh firefox
```

### Installing Extensions

#### Chrome:

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Drag and drop the `.crx` file

#### Edge:

1. Open `edge://extensions/`
2. Enable **Developer mode**
3. Drag and drop the `.crx` file

#### Firefox:

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select the `manifest.json` file from the extracted ZIP

## Versioning

This project uses Semantic Versioning. To bump version:

1. Go to Actions → Version Bump
2. Select bump type (patch/minor/major)
3. Run workflow

Or use the command line:

```bash
# Install dependencies
npm install -g semantic-release

# Auto bump version
npm run bump
```

## Creating Releases

Releases are automated through GitHub Actions:

1. Push a tag with version format `v*`
2. The workflow automatically:
   - Builds CRX files for Chrome and Edge
   - Creates ZIP for Firefox
   - Creates GitHub Release with all artifacts

```bash
# Create a release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Documentation

- [DESIGN.md](DESIGN.md) - Design system documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [PHILOSOPHY.md](PHILOSOPHY.md) - Project philosophy
- [PASS.md](PASS.md) - Security and access
- [CHANGELOG](CHANGELOG) - Change history

## Important Notes

- This repository is solely for presenting the visual design and layout components of the website.
- Code related to operational functionality and traffic management is maintained privately in a separate repository.
- Updates, improvements, and design revisions are published here.
- This project is released under the [MIT](LICENSE) License.

## Usage

Feel free to review the extension files in this repository. For any suggestions or feedback to improve the extension, please use the **Issues** section on GitHub or contact our team directly.

## Contact

- **GitHub:** [https://github.com/movtigroup/](https://github.com/movtigroup/)
- **Website:** [https://movtigroup.com](https://movtigroup.com)

---

**Version:** 1.0.1 | **Last Updated:** 2026-07-01
