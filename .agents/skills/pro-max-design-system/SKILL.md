---
name: pro-max-design-system
description: Generate a premium, highly-opinionated UI/UX design system. Use when the user wants to start a new web app, design a UI, or requests a design system.
---

Generate a foundational design system to lock in the aesthetic rules before writing any UI code.

1. **Mode Selection**
   Ask the user to choose an operation mode, waiting for their response before continuing:
   - _Search/Auto Mode_: Query the vendored Design Intelligence Database for domain-tailored UI styles, color palettes, typography, and UX guidelines.
     - Primary execution: Run Python BM25 search: `python3 scripts/search.py "<domain or keyword>" --domain style` (or `--domain color`/`--domain typography`/`--domain stack`).
     - Tool fallback: If Python 3 is unavailable, use `grep_search` or `view_file` directly on dataset CSV files under `data/` (`styles.csv`, `colors.csv`, `typography.csv`, `ux-guidelines.csv`, `stacks/`).
     - Use search results to select a tailored design pattern, color palette, typography, and chart/UX guidelines.
   - _Manual Mode_: Accept specific ideas, reference sites, or existing brand guidelines from the user. If their request is vague or incomplete, invoke the `grilling` skill to interview them relentlessly (asking one question at a time) to extract exact details about their preferred aesthetic, colors, and typography until you reach a shared understanding.
     _Completion criterion: The user has explicitly selected a mode and provided any necessary context._

2. **Generate Markdown Spec**
   Output a structured Markdown artifact named `design_system_spec.md` containing:
   - **Pattern & Style**: (e.g., Soft UI, Brutalism, Clean Modern).
   - **Colors**: Primary, Secondary, CTA, Background, and Text (with exact hex codes).
   - **Typography**: Font families, weights, and the intended mood.
   - **Key Effects**: Shadow styles, border radiuses, micro-animations.
   - **Constraints & Anti-patterns**: Explicitly list banned elements.
   - **Pre-delivery Checklist**: A checkable list for accessibility and responsiveness.
     _Completion criterion: The `design_system_spec.md` artifact is created and you have paused to ask the user for approval._

3. **Enforce Strict Constraints**
   When generating the spec, ruthlessly apply these premium design rules:
   - Ban generic AI purple/pink gradients.
   - Ban harsh neon colors unless explicitly requested.
   - Ban emojis as icons (use SVG like Lucide or Heroicons).
   - Require smooth hover transitions (150-300ms).
   - Require WCAG AA minimum contrast.
     _Completion criterion: Every constraint is explicitly documented in the spec._

4. **Token Generation (Hybrid Output)**
   Upon user approval of the Markdown spec, translate the rules into code-ready tokens.
   - Write or update `index.css` (or `tailwind.config.js`) in the workspace with the CSS variables matching the spec.
     _Completion criterion: Code tokens are written to the project workspace and match the approved spec exactly._
