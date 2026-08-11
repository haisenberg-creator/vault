# Vault - Setup & Development Guide

Welcome to the **Vault** project! This repository is built with **Tauri v2**, **React 19**, **TypeScript**, and **Vite**.

This guide covers all the commands and prerequisite steps required to set up, develop, test, and build the application.

---

## ⚡ Quick Start (TL;DR)

If you already have **Node.js (v18+)** and **Rust** installed:

```bash
# 1. Install dependencies
npm install

# 2. Run in Desktop Application Development Mode
npm run tauri dev
```

For Web-only UI development (without native desktop bindings):

```bash
npm run dev
```

---

## 🛠️ System Prerequisites

Before running the app locally, ensure your development environment has the necessary runtimes and platform build tools installed.

### 1. Node.js & Package Manager

- **Node.js**: `v18.0.0` or higher (LTS recommended)
- Verify installation:
  ```bash
  node -v
  npm -v
  ```

### 2. Rust Toolchain

- **Rust**: Installed via `rustup`
- Install rustup from [rustup.rs](https://rustup.rs/):
  ```bash
  # Linux / macOS
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

  # Windows
  # Download and run rustup-init.exe from https://rustup.rs/
  ```
- Verify installation:
  ```bash
  rustc --version
  cargo --version
  ```

### 3. Operating System Build Tools

==== "Windows" 1. Install **Microsoft Visual C++ Build Tools**: * Download [Visual Studio Installer](https://visualstudio.microsoft.com/visual-cpp-build-tools/). * Select **Desktop development with C++** workload during installation. 2. **WebView2**: Windows 10 (1809+) and Windows 11 include WebView2 runtime by default.

==== "macOS" 1. Install Xcode Command Line Tools:
`bash
       xcode-select --install
       `

==== "Linux (Ubuntu/Debian)" 1. Install required development libraries:
`bash
       sudo apt update
       sudo apt install -y build-essential curl wget libssl-dev libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev
       `

---

## 📦 Installation & Setup

1. **Clone the Repository**:

   ```bash
   git clone <repository-url>
   cd checklist-app
   ```

2. **Install Node Dependencies**:

   ```bash
   npm install
   ```

3. **Initialize Git Hooks (Husky)**:
   ```bash
   npm run prepare
   ```

---

## 🚀 Running Development Mode

### Option A: Desktop App Mode (Recommended)

Runs the native desktop window powered by Tauri and Vite with full file system / OS access.

```bash
npm run tauri dev
```

_(Or alternatively: `npx tauri dev`)_

### Option B: Web UI Only Mode

Runs the frontend in a standard browser window (useful for rapid UI/styling work).

```bash
npm run dev
```

- Access the app in your browser at: `http://localhost:5173`

---

## 🧪 Testing & Code Quality

### Run Unit & Integration Tests (Vitest)

```bash
# Run tests in watch mode
npm test

# Run tests once (single pass)
npx vitest run
```

### Type Checking

Validate TypeScript types across the codebase:

```bash
npx tsc --noEmit
```

### Code Formatting

Check code formatting using Prettier:

```bash
# Check formatting
npx prettier --check .

# Format code automatically
npx prettier --write .
```

---

## 🏗️ Production Builds

### Build Desktop Application Executable

Compiles the TypeScript frontend and packages native desktop binaries (.exe, .msi, .dmg, .deb, or .AppImage depending on OS):

```bash
npm run tauri build
```

- Native binaries will be generated under: `src-tauri/target/release/bundle/`

### Build Web Static Bundle Only

Compiles and bundles the Web frontend assets:

```bash
npm run build
```

### Preview Production Web Build Locally

Serves the compiled production Web bundle:

```bash
npm run preview
```

---

## 📋 Command Summary Reference Table

| Command                  | Action                                               |
| :----------------------- | :--------------------------------------------------- |
| `npm install`            | Install all JavaScript/TypeScript dependencies       |
| `npm run dev`            | Launch Vite dev server (Browser UI mode)             |
| `npm run tauri dev`      | Launch Tauri native desktop application in dev mode  |
| `npm test`               | Run Vitest test suite                                |
| `npx tsc --noEmit`       | Check TypeScript compilation without emitting output |
| `npm run build`          | Build production Web frontend distribution           |
| `npm run tauri build`    | Package native production desktop installer / binary |
| `npm run preview`        | Preview production web bundle locally                |
| `npx prettier --write .` | Format all files in workspace using Prettier         |

---

## ❓ Troubleshooting Common Setup Issues

### 1. `cargo: command not found` or `tauri: command not found`

- Ensure Rust is in your PATH. Restart your terminal session after installing `rustup`.
- Run `source $HOME/.cargo/env` (Linux/macOS) or re-open PowerShell (Windows).

### 2. Windows C++ Build Tools Missing

- If building Tauri fails with `error: failed to run custom build script for tauri-winres`, verify that **Desktop development with C++** is installed via Visual Studio Installer.

### 3. Port 5173 already in use

- If Vite fails because port 5173 is occupied, stop any running dev servers or specify a custom port:
  ```bash
  npx vite --port 5174
  ```
