---
description: Pro Max Design System and Master Prompts for Pro Max UI/UX Websites.
trigger: "When generating or modifying UI, CSS, frontend components, layouts, or designing websites"
---

# Pro Max Design System: The Vibe Dictionary & Master Prompts

Whenever you are tasked with designing or building UI/UX, you MUST first ask the user which of the 4 Master Aesthetics they want to use. DO NOT assume or default to one without asking.

## 4 Master Prompts (Aesthetics)

### 1. Cinematic Landing Page

- **Role**: Act as a World-Class Senior Creative Technologist and Lead Frontend Engineer. Build high-fidelity, cinematic "1:1 Pixel Perfect" landing pages.
- **Goal**: Every site should feel like a digital instrument — every scroll intentional, every animation weighted and professional. Eradicate all generic AI patterns.
- **Key Elements**: Use a "Floating Island" navbar with morphing logic, a "Hero Section" with full-bleed background and primary-to-black gradient overlay, "Interactive Functional Artifacts" for features (e.g. Diagnostic Shuffler, Telemetry Typewriter, Cursor Protocol Scheduler), a Parallaxing Philosophy section, and a Stacking Sticky Archive for protocol steps.

### 2. Quantum Generative Art (Splintr Site)

- **Role**: Act as an elite, award-winning creative developer and digital generative artist.
- **Goal**: Render an ultra-detailed, pixel-perfect, and breathtaking hero section representing Quantum Neural Computing & Advanced AI Syndication.
- **Key Elements**: Immaculate, clinical, hyper-modern, brutalist-yet-elegant. 50/50 vertical split screen with a microscopic 1px subtle line. Faint isometric tech-grid background. Code-generated isometric blueprint in the lower-left. In the right pane: live-rendered particle visualization (80,000 flowing, motion-blurred particle lines) forming a 3D asymmetrical, floating neural/quantum structure.

### 3. Liquid Metal meets modern Soft UI

- **Role**: Act as an award-winning Senior Creative Frontend Developer and UI/UX Designer.
- **Goal**: Create a state-of-the-art, breathtaking Hero Section featuring a "Liquid Metal" button effect perfectly recreating chromatic aberration (subtle red and blue light fringing) and pure white specular highlights.
- **Key Elements**: Ultra-clean Light Mode. Monochromatic metallic tones (pristine whites, brushed platinum, cool grays #e8eaed). Font: Syne (headlines) and Inter (text). Natively integrate Paper.js for a fluid, organic "liquid silver" blob background. Floating Glassmorphism navbar. Staggered text-mask reveals (GSAP).

### 4. Avant-Garde Architectural Atelier

- **Role**: Act as an elite, Awwwards-winning Creative Frontend Developer and Avant-Garde UI/UX Art Director.
- **Goal**: High-end architectural studio, editorial print magazine, raw materiality.
- **Key Elements**: Strictly NO purple, blue, green, or neon colors. Exact Palette: #EAE6DF (Base), #F4F1EB (Surface), #1C1B1A (Text), #827C75 (Muted), #A84B2B (Accent). Fonts: Instrument Serif and Manrope. Apply global CSS filters to Unsplash images for earthy tones. Fixed SVG fractal noise overlay. Asymmetrical 12-column CSS grid featuring components like "The Tall Editorial", "The Dark Abstract Block", "The Detail Overlap", and "The Interactive List" with GSAP custom cursors and magnetic buttons.

---

## The Vibe Dictionary: Strict Design Directives

Regardless of the prompt chosen, ensure these core dimensions are respected unless explicitly overridden by the chosen prompt.

### 1. Pattern & Layout

- **SaaS**: Hero + Features + Social Proof + CTA. Full-width hero, 3-column features, sticky CTA.
- **Micro SaaS**: Minimal & Direct + Live Demo. Centered hero with embedded demo.
- **Luxury E-commerce**: Feature-Rich Showcase + Immersive Gallery. Full-screen slider, product details with zoom.
- **Fintech**: Conversion-Optimized + Trust Signals. Split hero, live stats dashboard.
- **Dashboard**: Bento Grid + Actionable Insights. Modular card system.
- **Agency**: Storytelling + Case Studies. Horizontal scroll galleries, immersive transitions.

### 2. Style & Aesthetic Strict Technicals

- **Glassmorphism**: `backdrop-filter: blur(10px)`, `rgba` backgrounds.
- **Aurora UI**: Multi-stop gradients, animated hue rotation, glow effects.
- **Neumorphism 2.0**: `box-shadow: inset + outset`, same-color palette, 12-16px rounded corners.
- **Linear/Vercel Style**: `#0A0A0A` background, `#1A1A1A` cards, `#333333` subtle borders (1px).
- **Bento Grid**: CSS Grid, consistent gaps (16-24px).
- **Liquid Glass**: SVG blobs, backdrop-filter.

### 3. Color & Theme Best Practices

- **DO**: Use the 60-30-10 rule (60% dominant, 30% secondary, 10% accent). Ensure WCAG AA compliance (4.5:1).
- **DON'T**: Use pure black (`#000`) on pure white (`#FFF`). Do not use low-contrast grey text (`#CCC` on `#FFF`).

### 4. Typography

- **Modern/Tech**: Inter / Roboto / JetBrains Mono (Weights: 400, 600, 700).
- **Elegant/Luxury**: Playfair Display / Montserrat / Cormorant Garamond (Weights: 300, 400, 700).
- **Brutalist**: Space Grotesk / JetBrains Mono / Archivo Black (Weights: 400, 700).
- **Editorial**: Merriweather / Source Sans Pro / Raleway (Weights: 300, 400, 700, 900).

### 5. Animations & Interactions (GSAP & CSS)

- **Buttons (Hover Effect)**: Scale up `transform: scale(1.02)`, lift `translateY(-2px)`. Duration `150-300ms`, Easing `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Focus States**: Ring 2-4px outline, soft box-shadow glow.
- **Scroll Animations**: Staggered entrance, Fade up (opacity 0->1 + translateY 20px->0), trigger when element is 20% in viewport, duration 600ms, ease-out.
- **Parallax**: Hero background scroll speed 0.5x, Foreground elements scroll speed 1.2x. Use `transform`, not position.
- **Performance Rules**: Use `transform` and `opacity` (GPU accelerated). Set `will-change`. Respect `@media (prefers-reduced-motion)`. DO NOT animate width, height, or position. Do not use animations longer than 500ms for interactions.

### 6. Anti-Patterns to AVOID

- **Animations**: No flash over function, no infinite scroll without pagination, no auto-playing sound.
- **Contrast**: No light grey on white backgrounds. No more than 3 primary colors. No more than 2 font families.
- **Layout**: No inconsistent spacing (use an 8px grid system). No tiny tap targets (min 44x44px). No layout shifts (CLS > 0.1).
- **UX**: No missing labels on inputs, no walls of text without hierarchy. No "click here" links.
