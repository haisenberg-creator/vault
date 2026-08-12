# 🌙 Vault

> **A fast, elegant, local-first Markdown & Task Management desktop application built with Tauri v2, React 19, Lexical, and Rosé Pine Moon aesthetic.**

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Tauri v2](https://img.shields.io/badge/Tauri-v2-FFC107?logo=tauri&logoColor=black)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.0-646CFF?logo=vite&logoColor=white)

---

## 📖 Overview

**Vault** brings structured task organization and Markdown note-taking into a unified, privacy-focused desktop application. Powered by **Tauri v2** and **Lexical**, Vault provides a buttery-smooth editing experience, interactive task checkboxes, folder-scoped YAML dashboards, and a sleek **Rosé Pine Moon** dark mode design system.

Your notes remain plain `.md` files stored locally on your disk—zero proprietary databases, zero lock-in, and zero cloud dependency.

---

## ✨ Key Features

- 🎨 **Rosé Pine Moon Design System**: Crafted with vibrant HSL color tokens, glassmorphism headers, responsive tabs, and subtle micro-animations.
- 📝 **Rich Lexical Markdown Editor**: Live WYSIWYG editing, instant code syntax highlighting, custom interactive checklist portal nodes (`- [ ]` / `- [x]`), and debounced auto-saving.
- 📊 **Folder-Scoped YAML Dashboards**: Aggregate, filter, and track task completion percentages across your vault or scoped to specific sub-folders.
- 🌲 **Interactive File Explorer & Sidebar**: Dual-column layout with customizable tree navigation, active file indicators, and seamless tab switching.
- 🎯 **Drag & Drop Window Controls**: Frameless custom title bar with custom window controls and native drag interaction handling.
- 🔒 **Local-First & Private**: Direct filesystem synchronization via Tauri IPC with full offline capability.

---

## ⚡ Quick Start

### Prerequisites

Ensure your development environment has the following installed:

1. **Node.js** (`v18.0.0` or higher) & `npm`
2. **Rust Toolchain** via [rustup.rs](https://rustup.rs/) (`rustc` & `cargo`)
3. **C++ Build Tools**:
   - **Windows**: Visual Studio Installer with _Desktop development with C++_ workload.
   - **macOS**: Xcode Command Line Tools (`xcode-select --install`).
   - **Linux**: `build-essential`, `libgtk-3-dev`, `libwebkit2gtk-4.1-dev`, `libssl-dev`.

### Installation & Setup

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/haisenberg-creator/vault.git
   cd vault
   ```

2. **Install Node Dependencies**:

   ```bash
   npm install
   ```

3. **Run Desktop App in Development Mode**:

   ```bash
   npm run tauri dev
   ```

4. **Run Web UI Only (Browser Mode)**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🛠️ CLI Commands & Development Reference

| Command               | Description                                               |
| :-------------------- | :-------------------------------------------------------- |
| `npm run tauri dev`   | Launch Tauri desktop application in live development mode |
| `npm run dev`         | Launch Vite server for browser-only UI development        |
| `npm test`            | Run Vitest unit & component test suite                    |
| `npm run typecheck`   | Perform TypeScript type safety compilation check          |
| `npm run build`       | Compile production Web static assets                      |
| `npm run tauri build` | Package native production installer / binary executable   |

---

## 📁 Project Architecture

```
Vault/
├── src/                          # React Frontend Application
│   ├── components/               # UI Components
│   │   ├── dashboard/            # YAML Dashboard widgets & views
│   │   ├── editor/               # Lexical Markdown Editor & Checklist nodes
│   │   ├── layout/               # DualColumnLayout, TitleBar, ErrorBoundary
│   │   └── sidebar/              # SidebarTree, TaskDashboardSidebar
│   ├── services/                 # Business logic, file I/O & dashboard query engine
│   ├── types/                    # TypeScript domain interfaces
│   └── main.tsx                  # React root mounting & ErrorBoundary
├── src-tauri/                    # Tauri Rust Desktop Backend
│   ├── capabilities/             # Tauri security permissions & scopes
│   ├── src/                      # Rust main process & native commands
│   ├── tauri.conf.json           # App configuration & window decorations
│   └── Cargo.toml                # Rust crate metadata & dependencies
├── docs/                         # Architecture Decision Records (ADRs)
└── CONTEXT.md                    # Domain language & ubiquitous vocabulary
```

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/haisenberg-creator">Haiseus</a>
</p>
