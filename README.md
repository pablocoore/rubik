# Rubik Cube • Three.js

Interactive 3D Rubik’s Cube built with Three.js and Vite. Mobile-friendly UI with Reset/Scramble buttons and PWA support (installable on phones).

## Live Demo

- GitHub Pages: https://pablocoore.github.io/rubik/

## Getting Started

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

## Publish to GitHub Pages

This repo includes a GitHub Actions workflow that builds and deploys to Pages on every push to `main`.

Steps:
- Create a GitHub repository and push this code.
- In GitHub, go to Settings → Pages:
  - Set Source to “GitHub Actions”.
- Wait for the “Deploy to GitHub Pages” workflow to finish.
- The site will be available at: `https://<username>.github.io/<repo>/`.

Notes:
- Vite is configured to infer `base` from the repository name when building in GitHub Actions.
- Service worker and manifest paths are base-aware (relative), so PWA works on Pages.

## Controls

- Orbit camera: drag, zoom with wheel/pinch
- Moves: U/R/D/L/B/F/M (Shift = prime)
- Toolbar (mobile only): Reset, Scramble, Help, Install

## PWA

- Manifest: `public/manifest.webmanifest`
- Service Worker: `public/sw.js`
- Icons: `public/icons/` (maskable + standard + Apple touch)
