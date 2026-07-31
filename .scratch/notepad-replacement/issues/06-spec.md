Labels: ready-for-agent
Status: open
Type: spec

# Specification: Notepad++ Replacement

## Problem Statement

Users need a fast, lightweight local text editor (like Notepad++) to manage notes and stateful tasks (checklists) in a single document, without losing the simplicity and portability of plain text files. Current local editors do not natively support rich, interactive task management with states like "open", "in progress", "blocked", and "completed" directly inline with the text.

## Solution

A lightning-fast Desktop application built on Tauri, Rust, React, and Vite that replaces Notepad++. It stores data as plain Markdown (`.md`) files on the user's hard drive using custom syntax for checklist states. It provides a Dual Column layout featuring a Global Task Dashboard on the left and a rich-text Lexical editor on the right, styled with an animated, premium Rosé Pine Moon Soho aesthetic.

## User Stories

1. As a user, I want to create and edit plain Markdown (`.md`) files anywhere on my local file system, so that I maintain complete ownership and portability of my data.
2. As a user, I want to use custom Markdown syntax (e.g., `[ ]`, `[-]`, `[x]`, `[>]`) to define stateful tasks, so that I can track task progress directly in my notes.
3. As a user, I want a rich text editing experience (powered by Lexical) when I open these Markdown files in the app, so that the custom syntax is beautifully rendered as interactive UI elements.
4. As a user, I want to view a Global Task Dashboard (Dual Column Layout) alongside my active note, so that I can see all "blocked", "in progress", "open", and "completed" tasks aggregated from across my workspace.
5. As a user, I want to click on a task in the Global Task Dashboard or within the editor to instantly toggle its state, so that I can manage my work smoothly.
6. As a user, I want to see smooth micro-animations, glowing headers, and live progress meters (Rosé Pine Moon Soho theme), so that using the app feels elegant, tactile, and premium.
7. As a user, I want the app to start up incredibly fast and consume low resources, so that it effectively replaces my lightweight Notepad++ workflows without lag.

## Implementation Decisions

- **Framework & Scaffold:** Scaffolded with Tauri v2 (Rust backend) + React + Vite + TypeScript.
- **Editor:** Lexical chosen for rich-text editing. It will use a custom `DecoratorNode` combined with React portals to render the stateful checklist items interactively.
- **Data Storage:** Data persistence is exclusively plain `.md` files. A local Rust filesystem watcher (or standard Tauri fs APIs) will handle reading/writing workspace files.
- **UI Layout:** A Dual Column design (Variant C from prototypes). Left pane aggregates all tasks across all notes; right pane is the active document.
- **Design System:** Animated Rosé Pine Moon Soho theme. Utilizes Vanilla CSS tokens (`--rose-bg-base`, `--rose-bg-surface`, etc.), `@keyframes roseGlowPulse`, `Pixelify Sans` for UI, and `JetBrains Mono` for the editor. Micro-animations included for hover states and clicks (150-350ms duration).
- **Prototyping Artifact Reference:** Prototyped interactive Lexical task nodes and global dashboard aggregation via `Prototype.tsx` (Variant E2).

## Testing Decisions

- **What Makes a Good Test:** Tests should focus on external behavior, such as interacting with the editor and verifying that the correct Markdown syntax is read from/written to the file system, and that toggling a task in the UI updates the underlying state.
- **Modules to be Tested:**
  1. Markdown Parsing / Serialization: Ensure `[ ]`, `[-]`, `[x]`, `[>]` correctly translate to/from Lexical node states.
  2. Task Aggregation: Ensure the left column correctly filters and displays tasks from multiple `.md` files.
  3. Editor Interactions: Ensure clicking a task node toggles its state and triggers a document update.
- **Seams:** The highest testing seam will be at the Tauri command / File System interface and the React component root. We can test the React App in isolation by mocking the Tauri `invoke` filesystem calls, feeding it mock markdown content and asserting on the DOM (using React Testing Library).

## Out of Scope

- Mobile application.
- Native desktop frameworks (WPF, Swift, etc. - locked into Tauri).
- Cloud syncing or non-local database storage (e.g., SQLite, PostgreSQL).

## Further Notes

- All text must meet WCAG AA minimum contrast.
- Emojis as icons are banned; use crisp SVG icons.
- Instant 0ms state changes are banned; smooth transitions are required.
