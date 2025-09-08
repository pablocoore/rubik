# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Application code (ES modules).
  - `src/main.{js,ts}`: App entry; bootstraps renderer, scene, camera.
  - `src/core/renderer.{js,ts}`: Three.js setup (renderer, resize, loop).
  - `src/scene/cube.{js,ts}`: Rubik’s Cube model and piece layout.
  - `src/controls/interaction.{js,ts}`: Pointer/keyboard input, face/axis rotation.
  - `src/state/`:
    - `cube-state.{js,ts}`: Logical cube state + moves.
    - `solvers/` (optional): Algorithms and helpers.
- `public/`: Static assets served as‑is (e.g., `index.html`).
- `assets/textures/`: Images/materials.
- `tests/`: Unit and E2E tests.
  - `tests/unit/` and `tests/e2e/` or co‑located `*.test.{js,ts}`.
- `scripts/`: One‑off maintenance scripts.

## Build, Test, and Development Commands
- `npm install`: Install dependencies.
- `npm run dev`: Start local dev server (e.g., Vite) with HMR.
- `npm run build`: Production build to `dist/`.
- `npm run preview`: Serve the production build locally.
- `npm run lint` / `npm run format`: Lint and auto‑format.
- `npm test` / `npm run test:e2e`: Run unit and E2E suites.

## Coding Style & Naming Conventions
- Indentation: 2 spaces; line width 100.
- Files: `kebab-case.{js,ts}`; classes in PascalCase; functions/variables in `camelCase`; constants `SCREAMING_SNAKE_CASE`.
- Prefer TypeScript where practical; ES modules only.
- Tools: ESLint (`@typescript-eslint`), Prettier (single quotes, trailing commas).
- Three.js: Create/dispose resources explicitly; clean up listeners on teardown.

## Testing Guidelines
- Unit: Vitest/Jest for logic in `src/state/**` and utilities; name files `*.test.{js,ts}`.
- E2E: Playwright for user flows (rotate layers, scramble/solve, reset view).
- Coverage: Aim ≥80% lines for `src/state/**` and interaction helpers.
- Example: `npx vitest --ui`, `npx playwright test`.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (e.g., `feat: add face rotation`, `fix: correct U move mapping`).
- Branches: `feature/…`, `fix/…`, `chore/…`.
- PRs: Clear description, linked issue, before/after GIF of cube rotation, manual test steps, and notes on performance or breaking changes. Ensure CI green and docs updated.

## Security & Configuration Tips
- Do not commit secrets; use `.env` (access via `import.meta.env`).
- Pin dependencies; avoid `eval` and untrusted textures.
- Guard WebGL: handle context‑lost; throttle `requestAnimationFrame` work; dispose geometries/materials to prevent leaks.
