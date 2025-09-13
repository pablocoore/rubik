# Mobile UX/UI TODO

This checklist focuses on user experience and interface improvements for mobile. It intentionally avoids performance optimizations. Check off items as they’re implemented; link code locations or notes when useful.

## Quick Access Controls
- [x] Add a persistent bottom toolbar with large touch targets.
  - Buttons: Reset cube, Scramble cube.
  - Visible on mobile and desktop; sized for thumbs (44–48px min height).
  - Hooked to existing logic in `src/main.ts`.
- [ ] Add visual/haptic feedback on button press.
  - Press states (scale/opacity), `navigator.vibrate(10)` if supported.

## Onboarding & Help
- [ ] Add a one-time onboarding tip for gestures (drag to rotate, pinch to zoom, two-finger orbit).
  - Dismissible, stored in `localStorage`.
- [ ] Add a compact in-app Help sheet accessible via a `?` button.

## Touch & Gestures (UX)
- [x] Prevent page scroll during canvas interaction via `touch-action: none` on the canvas area.
- [ ] Improve gesture affordances (cursor/touch hints) and snap indicators (subtle glow when snapping).

## Layout & Accessibility
- [ ] Ensure toolbar does not overlap critical 3D content on very short screens.
  - Add bottom padding to canvas or auto-hide toolbar after a few seconds of inactivity.
- [ ] Provide accessible names/labels for buttons and keyboard focus styles.
- [ ] Respect prefers-reduced-motion for any UI transitions.

## PWA Installability
- [x] Add a web app manifest (`public/manifest.webmanifest`).
- [x] Register a service worker (`public/sw.js`) for basic offline capability.
- [ ] Add app icons (192, 512, maskable) and Apple touch icons.
- [ ] Add an optional custom “Install App” prompt button when `beforeinstallprompt` fires.

## Orientation & UI Polish
- [ ] Handle orientation change UX: keep toolbar usable in landscape, avoid overlapping the notch/home indicator (`viewport-fit=cover`).
- [ ] Add active state indicator for Test Mode if exposed in UI.

---

## Implementation Notes

### Bottom Toolbar (Reset / Scramble)
- Implemented in `index.html` with `.toolbar` container and two buttons: `Reset` and `Scramble`.
- `src/main.ts` attaches listeners to `#btn-reset` and `#btn-scramble` and calls existing `resetView()` and `scramble()`.

### PWA Scaffolding
- `public/manifest.webmanifest` contains core metadata: `name`, `short_name`, `start_url`, `display`, `theme_color`, `background_color`.
- `public/sw.js` registers a minimal caching strategy for app shell; registration gated behind `import.meta.env.PROD` in `src/main.ts`.
- Icons are placeholder (TODO) to be added later.

### Touch Interaction
- Added `touch-action: none` to the canvas via CSS in `index.html` to reduce scroll conflicts on mobile.

---

## Release Checklist
- [ ] Validate installability in Chrome DevTools (Lighthouse PWA pass, manifest + SW detected).
- [ ] Test on iOS Safari add-to-home-screen (standalone launches, status bar color ok).
- [ ] Verify toolbar works across common devices (iPhone SE/12/14 Pro Max, Pixel 5/7, small tablets).
- [ ] Confirm offline start for already-visited users.

