# CHRONOVA — Time, Refined.

A complete, self-contained luxury watch e-commerce experience built with plain HTML, CSS, and JavaScript. **No build step, no npm, no server.**

## How to open it

Double-click **`index.html`**. That's it — it opens directly in your default browser.

Everything (product data, cart, wishlist, configurator logic) lives inside `script.js` as plain JavaScript objects. Nothing is loaded with `fetch()`, so none of it is blocked by the browser's `file://` security restrictions.

Three.js, GSAP, and ScrollTrigger are **vendored locally** in `assets/vendor/` (not pulled from a CDN), loaded as classic `<script>` tags — never as ES modules. That means the entire 3D experience, the configurator, and every animation work with **zero internet connection**. The one exception is the Google Fonts `<link>` in `<head>`, purely for typography polish; if there's no network, the browser silently falls back to the system serif/sans-serif stack already declared in `style.css`, and nothing breaks. If you ever run this with no internet at all, the 3D watch would only fall back to the animated SVG version if your specific browser build additionally has WebGL disabled — the local Three.js files themselves load regardless of connectivity.

## File structure

```
chronova-watch-store/
├── index.html      → main entry point, open this file
├── style.css        → the entire design system
├── script.js        → all data + all interactivity (single file, no modules)
├── README.md
└── assets/
    ├── vendor/       → three.min.js, gsap.min.js, ScrollTrigger.min.js (local, no CDN)
    ├── images/       → optional AI-generated product photography (see below)
    └── models/       → optional watch.glb (not required — see below)
```

## Visual assets — how they actually work in this build

The brief asked for AI-generated product photography. This build environment does not have an image-generation tool available, so instead of shipping broken image links or generic stock photography, every visual in the site is **procedurally generated**, in two layers:

1. **Hero and Configurator** — a real, hand-built Three.js 3D watch (case, bezel, dial, hands set to a classic "10:10" pose, hour markers, crown, and a strap that physically changes structure between a leather/rubber band and a segmented steel bracelet). It rotates slowly, floats gently, responds to mouse parallax, and can be dragged to rotate.
2. **Product cards, the modal, and the cart** — a lightweight inline SVG "watch face" generator (`buildWatchSVG()` in `script.js`) that draws a case, bezel, dial, hour markers, hands, and strap using gradients that match each product's actual case/dial/strap configuration. It's vector, so it's always sharp and never a broken `<img>`.

### Dropping in real AI-generated images later

The markup and code are already wired for it. Each product's `image` field in `script.js` points at a file under `assets/images/` using the exact filenames requested in the original spec:

```
assets/images/hero-watch.png
assets/images/watch-noir.png
assets/images/watch-aurelis.png
assets/images/watch-meridian.png
assets/images/watch-eclipse.png
assets/images/craftsmanship.png
assets/images/editorial-watch.png
```

If you generate these with an AI image tool (Midjourney, DALL·E, Stable Diffusion, etc.) and drop them into `assets/images/` with those exact names, they will appear automatically — every `<img>` tag has an `onerror` handler that silently keeps the procedural SVG/3D visual if the file is missing, and swaps to the real photo the moment it exists. No code changes needed.

Suggested prompts for each (matching the original art direction — photorealistic, studio-lit, dark luxury background, no text/logo/watermark, no human hand):

- **hero-watch.png** — "Photorealistic luxury mechanical wristwatch, stainless steel case, obsidian dial, sapphire crystal, studio product photography, dark background, cinematic lighting, no text, no logo"
- **watch-noir.png** — "Black ceramic automatic watch, black dial, silver markers, black strap, dramatic studio lighting, no text"
- **watch-aurelis.png** — "Champagne-gold luxury watch, ivory dial, brown leather strap, editorial studio lighting, no text"
- **watch-meridian.png** — "Brushed steel sports-luxury watch, integrated steel bracelet, midnight-blue dial, no text"
- **watch-eclipse.png** — "Steel GMT travel watch, dark dial, subtle GMT hand, steel bracelet, studio lighting, no text"
- **craftsmanship.png** — "Cinematic macro shot of mechanical watch gears and components, brushed metal, dark background, warm light, no text"
- **editorial-watch.png** — "Abstract macro close-up of watch metal and sapphire glass reflections, dark premium composition, no text"

### 3D model (optional)

`assets/models/watch.glb` is not included and is **not required** — the site does not attempt to load a `.glb` at all in this build, because `GLTFLoader` typically needs to fetch a binary file, which is exactly the kind of local-file request that browsers block under `file://`. Instead, the "3D model" is built procedurally in code with `THREE.Geometry` primitives, which has the added benefit of letting the Configurator recolor and restructure it live (steel/black/gold case, three dial colors, and three physically different strap types) with zero loading step. If you want to swap in a real `.glb` later, you'll need to run the site from a local web server (e.g. `npx serve`) rather than double-clicking it, since `file://` blocks the loader's internal fetch requests.

## 3D & animation quality

The Three.js scenes (hero + configurator) use a full small PBR pipeline rather than flat/unlit materials:

- ACES filmic tone mapping + sRGB output for cinematic contrast instead of a flat, washed-out render
- A procedural environment map (no external HDRI file needed) so brushed/polished metal actually picks up soft studio reflections
- Real-time soft shadows (`PCFSoftShadowMap`) cast by the watch onto a shadow-catcher plane
- Clearcoat on the case, bezel, and crystal materials for a lacquered, premium metal look
- A fluted bezel (60 machined ridges, rendered as a single `InstancedMesh` so it costs one draw call, not sixty)
- A cheap "poor man's" mirror floor reflection — a dimmed, vertically-flipped clone of the watch
- A continuously sweeping second hand, drag-to-rotate with momentum/inertia on release, mouse parallax, and a cinematic scale/camera-dolly entrance once the preloader clears
- Both scenes pause their render loop entirely via `IntersectionObserver` when scrolled out of view, so the page stays light even with two live WebGL scenes on it

Site-wide interaction polish layered on top: a custom cursor with a trailing ring (desktop only, disabled on touch), a cursor-following spotlight glow in the hero, magnetic hover on primary buttons and icon buttons, a 3D tilt-on-hover effect on product cards, a per-letter animated reveal on the hero headline, an animated price counter and "pop" micro-animation in the configurator, scroll-linked parallax on the craftsmanship gears and editorial banner texture, and a bounce animation on the cart/wishlist badges. Everything respects `prefers-reduced-motion` and degrades gracefully — none of it is required for the site to be fully usable.

## Features implemented

- Preloader with animated progress
- Fixed navigation with scroll state, mobile menu, and a search overlay that filters the catalog live
- Cinematic 3D hero with auto-rotation, floating motion, mouse parallax, and drag-to-rotate
- Four-product Featured Collection grid with wishlist + quick add-to-cart
- Interactive Configurator (case / strap / dial) with live 3D material + geometry updates and dynamic pricing
- Craftsmanship editorial section with animated SVG gear artwork
- Editorial banner and Newsletter section (client-side only, no real email sending)
- Product Detail Modal with specs, quantity selector, Escape/backdrop-to-close
- Fully functional cart drawer: add/remove/adjust quantity, subtotal, `localStorage` persistence across reloads
- Checkout button shows a tasteful "Checkout integration can be connected in the next phase" notice — no payment fields anywhere
- GSAP + ScrollTrigger reveals on scroll, with `prefers-reduced-motion` respected throughout (and everything still works if GSAP fails to load from the CDN)
- Fully responsive, no horizontal overflow, touch-friendly controls

## Notes

- This is a fictional brand ("CHRONOVA") and fictional models — nothing here references or copies any real watch manufacturer.
- No real payment processing, no backend, no user accounts — this is a front-end concept build only.
