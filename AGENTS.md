# AGENTS.md - AI Assistant Guidelines

This file provides guidelines for AI assistants (like Claude, Cursor, Copilot, etc.) working with the MOVTIGROUP repository.

## Project Overview

MOVTIGROUP is a modern website template repository showcasing the visual design and layout of the MOVTIGROUP company website, along with a VPN browser extension. This is a **template and extension** repository - operational backend code and logic are maintained privately.

## Repository Structure

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

## Key Principles

1. **Template & Extension Focus**: This repository contains visual design templates, layout components, and a VPN browser extension. Do NOT add backend logic, API endpoints, or operational code.

2. **Design Consistency**: All changes must maintain the existing design language - modern, clean, and responsive.

3. **Documentation First**: Any new features or changes must be documented in both Persian (README.md) and English (README.en.md).

4. **Bilingual Support**: The project supports both Persian (Farsi) and English. All user-facing content should consider both languages.

5. **Extension Compatibility**: VPN extension must work on Chrome, Edge, and Firefox browsers.

## Allowed Actions

- Update and improve visual design templates
- Add new layout components and pages
- Modify CSS/SCSS styles
- Update documentation
- Fix responsive design issues
- Add new template variations
- Update and improve the VPN extension
- Add new features to the extension
- Fix extension bugs
- Update extension manifest and permissions

## Prohibited Actions

- Adding backend code, API logic, or database connections
- Modifying GitHub Actions workflows without approval
- Changing the LICENSE terms
- Adding third-party dependencies without discussion
- Exposing any credentials or secrets
- Adding tracking or analytics to the extension

## Coding Standards

### Website Template

- Use semantic HTML5
- Follow BEM or similar CSS naming conventions
- Ensure mobile-first responsive design
- Maintain accessibility standards (WCAG 2.1)
- Keep file sizes optimized for web performance

### VPN Extension

- Use Manifest V3 for Chrome/Edge
- Write clean, documented JavaScript code
- Use standard browser APIs
- Test compatibility across browsers
- Follow security best practices

## Extension Development

### Manifest V3

- Use `background.service_worker` for background scripts
- Use `action` instead of `browser_action`
- Follow Chrome's security policies

### Building CRX Files

```bash
# Build for all browsers
./build-crx.sh all

# Build for specific browser
./build-crx.sh chrome
./build-crx.sh edge
./build-crx.sh firefox
```

## Communication

When making changes:

1. Update relevant documentation
2. Follow the existing code style
3. Test responsiveness across devices
4. Consider both Persian and English layouts (RTL/LTR)
5. Test extension on multiple browsers
