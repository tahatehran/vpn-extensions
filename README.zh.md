# MOVTIGROUP 网站模板和 VPN 扩展

[English](README.md) | [فارسی](README.fa.md) | [中文](README.zh.md)

此仓库包含 **MOVTIGROUP** 公司的主要网站模板和 VPN 浏览器扩展。其目的是展示和记录网站的视觉设计和布局，代表公司的视觉形象。请注意，操作代码和后端逻辑存储在单独的私有仓库中。

**GitHub 仓库：** [https://github.com/movtigroup/movtigroup/](https://github.com/movtigroup/movtigroup/)

## 简介

此模板作为 MOVTIGROUP 网站的主要视觉设计。重点是通过视觉组件提供现代、简洁和响应式的用户体验，反映品牌形象。

## 功能特性

### 网站模板

- **响应式设计：** 针对各种设备（手机、平板和桌面）进行了优化。
- **易于定制：** 设计元素可以轻松调整以符合公司的视觉形象。
- **用户友好文档：** 结构清晰、文档完善，便于快速浏览和理解。
- **可维护性：** 定期更新和有序的文件结构确保一致的设计演变。

### VPN 扩展

- 🔒 一键安全连接
- 🌍 全球 300+ 服务器
- 📊 实时连接统计（延迟、速度、上传、下载）
- 🎨 现代深色主题 UI
- 🔄 自动更新服务器列表
- 🔍 服务器搜索
- ⚙️ 高级设置（终止开关、DNS、自动连接）

## 项目结构

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

## 快速开始

### 先决条件

- 现代网络浏览器（Chrome、Firefox、Safari、Edge）
- Node.js（用于构建 CRX 文件）

### 安装和使用

1. 克隆仓库：

   ```bash
   git clone https://github.com/movtigroup/movtigroup.git
   ```

2. 进入项目目录：

   ```bash
   cd movtigroup
   ```

3. 在浏览器中打开模板文件或使用本地服务器。

### 构建 CRX 文件

```bash
# 使脚本可执行
chmod +x build-crx.sh

# 构建所有包
./build-crx.sh all
```

### 安装扩展

#### Chrome：

1. 打开 `chrome://extensions/`
2. 启用 **开发者模式**
3. 拖放 `.crx` 文件

#### Edge：

1. 打开 `edge://extensions/`
2. 启用 **开发者模式**
3. 拖放 `.crx` 文件

#### Firefox：

1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击 **加载临时附加组件**
3. 选择 `manifest.json` 文件

## 版本控制

本项目使用语义化版本控制。创建发布：

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## 使用

欢迎查看此仓库中的文件以探索网站的视觉设计和布局。如有任何改进模板的建议或反馈，请使用 GitHub 上的 **Issues** 部分或直接联系我们的团队。

## 联系我们

- **GitHub：** [https://github.com/movtigroup/](https://github.com/movtigroup/)
- **网站：** [https://movtigroup.com](https://movtigroup.com)

---

**版本：** 1.0.1 | **最后更新：** 2026-07-01
