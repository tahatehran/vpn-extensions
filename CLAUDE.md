# CLAUDE.md - Claude Code Configuration

This file provides context and guidelines for Claude Code when working with the MOVTIGROUP repository.

## Project Context

**Project Name:** MOVTIGROUP Website Template & VPN Extension
**Type:** Static Website Template / Design System / Browser Extension
**Primary Languages:** HTML, CSS, JavaScript (template & extension)
**Bilingual:** Persian (Farsi) + English (RTL + LTR)

## Important Constraints

1. **Template & Extension Repository**: This is a visual design template repository with a VPN browser extension. Do NOT add:
   - Backend code (Node.js, Python, PHP, etc.) except for build scripts
   - API endpoints or routes
   - Database connections or models
   - Server-side logic
   - Authentication/authorization systems
   - Tracking or analytics code

2. **No Secrets**: Never add API keys, tokens, passwords, or credentials to this repository.

3. **Design Consistency**: All changes must align with the existing modern, clean, and responsive design language.

4. **Extension Compatibility**: VPN extension must work on Chrome, Edge, and Firefox browsers.

## Allowed Modifications

### Website Template

- HTML structure and markup
- CSS/SCSS styling and responsive design
- JavaScript for UI interactions (no backend)
- Documentation updates (both Persian and English)
- New template pages and components
- Accessibility improvements (WCAG 2.1)

### VPN Extension

- Manifest V3 compliant code
- Popup UI (HTML, CSS, JS)
- Options page (HTML, CSS, JS)
- Background service worker
- Extension icons and assets
- Browser-specific optimizations

## File Organization

### Website Template

- Keep CSS modular and organized by component
- Use BEM or similar naming conventions
- Maintain separate RTL (Persian) and LTR (English) styles where needed
- Optimize images and assets for web performance

### VPN Extension

- Keep extension files in `vpn-extension/` directory
- Separate concerns: popup, options, background
- Use semantic class names
- Follow Chrome extension best practices

## Build Scripts

### CRX Build Script

The `build-crx.sh` script creates browser extension packages:

- Chrome CRX file
- Edge CRX file
- Firefox ZIP file

Usage:

```bash
chmod +x build-crx.sh
./build-crx.sh all
```

## GitHub Actions

### Release Workflow

Automatically triggered when pushing a version tag (`v*`):

- Builds CRX files for Chrome and Edge
- Creates ZIP for Firefox
- Creates GitHub Release with all artifacts

### Version Bump Workflow

Manual trigger to bump version:

- Updates manifest.json
- Updates documentation versions
- Creates git tag

### CRX Build Workflow

Triggered on push to main/master:

- Builds CRX files for all browsers
- Uploads as artifacts

## When in Doubt

- Refer to AGENTS.md for detailed AI assistant guidelines
- Check DESIGN.md for design system specifications
- Review README.md / README.en.md for project context
- Ask the user before making significant structural changes
- Test extension on multiple browsers before committing
